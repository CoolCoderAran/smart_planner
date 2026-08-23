from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    flash,
    jsonify
)

from datetime import timedelta, datetime
from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)

import sqlite3
import re
import db
import streaks
import achievements
import planner

# Flask and App Setup
app = Flask(__name__)
app.secret_key = "long_secure_secret_key"
app.permanent_session_lifetime = timedelta(days=30)

# Initialize Database
db.init_db()

# Password Security
Common_Patterns = {
    "password",
    "123456",
    "qwerty",
    "admin",
    "@123"
}

def secure_password(password):
    if len(password) < 12:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    if not re.search(r"[^A-Za-z0-9]", password):
        return False

    lower_pw = password.lower()
    for pattern in Common_Patterns:
        if pattern in lower_pw:
            return False

    return True


# Routes
@app.route("/")
def home():
    if "user" in session:
        return redirect(url_for("dashboard"))
    return render_template("index.html")


@app.route("/about")
def about():
    return render_template("about.html")


@app.route("/dashboard")
def dashboard():
    username = session.get("user")
    if username is None:
        return redirect(url_for("login"))

    streak_data = streaks.get_streak_data(username)
    achievement_data = achievements.get_user_achievements(username)

    conn = db.get_db()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, task
        FROM tasks
        WHERE username = ?
        ORDER BY id DESC
        """,
        (username,)
    )
    tasks = cursor.fetchall()
    conn.close()

    return render_template(
        "dashboard.html",
        username=username,
        tasks=tasks,
        streak_data=streak_data,
        achievements=achievement_data
    )


@app.route("/study")
def study():
    username = session.get("user")
    if not username:
        return redirect(url_for("login"))

    conn = db.get_db()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, task
        FROM tasks
        WHERE username = ?
        ORDER BY id DESC
        """,
        (username,)
    )
    tasks = cursor.fetchall()
    conn.close()

    return render_template(
        "study.html",
        username=username,
        tasks=tasks,
        streak_data=streaks.get_streak_data(username)
    )


@app.route("/save_study_session", methods=["POST"])
def save_study_session():
    username = session.get("user")
    if username is None:
        return jsonify({"success": False, "message": "Not logged in"}), 401

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data received"}), 400

    mode = data.get("mode", "Unknown")
    task = data.get("task", "")

    try:
        minutes = max(0, int(data.get("minutes", 0)))
    except (ValueError, TypeError):
        minutes = 0

    if minutes <= 0:
        return jsonify({"success": False, "message": "Invalid study time."}), 400

    conn = db.get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT 1
        FROM tasks
        WHERE username = ?
          AND task = ?
        """,
        (username, task)
    )
    if cursor.fetchone() is None:
        task = ""

    try:
        cursor.execute(
            """
            INSERT INTO study_sessions (username, mode, task, minutes, completed_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                username,
                mode,
                task,
                minutes,
                datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )
        )
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "error": str(e)}), 500

    conn.close()
    achievements.check_achievements(username)

    return jsonify({"success": True})


@app.route("/get_study_stats")
def get_study_stats():
    username = session.get("user")

    if username is None:
        return jsonify({
            "today_minutes": 0,
            "weekly_minutes": 0,
            "total_sessions": 0,
            "total_minutes": 0,
            "today_sessions": 0,
            "current_streak": 0,
            "best_streak": 0,
            "achievement_count": 0
        })

    conn = db.get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT COUNT(*), COALESCE(SUM(minutes), 0)
        FROM study_sessions
        WHERE username = ?
        """,
        (username,)
    )
    total_sessions, total_minutes = cursor.fetchone()

    cursor.execute(
        """
        SELECT COALESCE(SUM(minutes), 0)
        FROM study_sessions
        WHERE username = ?
          AND DATE(completed_at) = DATE('now')
        """,
        (username,)
    )
    today_minutes = cursor.fetchone()[0]

    cursor.execute(
        """
        SELECT COALESCE(SUM(minutes), 0)
        FROM study_sessions
        WHERE username = ?
          AND DATE(completed_at) >= DATE('now', '-6 days')
        """,
        (username,)
    )
    weekly_minutes = cursor.fetchone()[0]

    cursor.execute(
        """
        SELECT COUNT(*)
        FROM study_sessions
        WHERE username = ?
          AND DATE(completed_at) = DATE('now')
        """,
        (username,)
    )
    today_sessions = cursor.fetchone()[0]

    conn.close()

    streak_data = streaks.get_streak_data(username)
    achievement_count = achievements.get_count(username)

    return jsonify({
        "today_minutes": today_minutes,
        "weekly_minutes": weekly_minutes,
        "total_sessions": total_sessions,
        "total_minutes": total_minutes,
        "today_sessions": today_sessions,
        "current_streak": streak_data["current"],
        "best_streak": streak_data["best"],
        "achievement_count": achievement_count
    })


@app.route("/signup", methods=["GET", "POST"])
def signup():
    if "user" in session:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        if not username or not password:
            flash("Please fill in all fields.")
            return redirect(url_for("signup"))

        if not secure_password(password):
            flash("Password must contain 12+ characters, uppercase, lowercase, number, and symbol.")
            return redirect(url_for("signup"))

        hashed_password = generate_password_hash(password)

        conn = db.get_db()
        cursor = conn.cursor()

        try:
            cursor.execute(
                """
                INSERT INTO users (username, password)
                VALUES (?, ?)
                """,
                (username, hashed_password)
            )
            conn.commit()
        except sqlite3.IntegrityError:
            conn.close()
            flash("Username already exists.")
            return redirect(url_for("signup"))

        conn.close()

        session.permanent = True
        session["user"] = username

        return redirect(url_for("dashboard"))

    return render_template("signup.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if "user" in session:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        conn = db.get_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT password
            FROM users
            WHERE username = ?
            """,
            (username,)
        )
        user = cursor.fetchone()
        conn.close()

        if not user:
            flash("User not found.")
            return redirect(url_for("login"))

        stored_password = user[0]

        if not check_password_hash(stored_password, password):
            flash("Incorrect password.")
            return redirect(url_for("login"))

        session.permanent = True
        session["user"] = username

        return redirect(url_for("dashboard"))

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("home"))


@app.route("/get_study_stats")
def get_study_stats():
    username = session.get("user")

    if username is None:
        return jsonify({
            "today_minutes": 0,
            "weekly_minutes": 0,
            "total_sessions": 0,
            "total_minutes": 0,
            "today_sessions": 0,
            "current_streak": 0,
            "best_streak": 0,
            "achievement_count": 0
        })

    conn = db.get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT COUNT(*), COALESCE(SUM(minutes), 0)
        FROM study_sessions
        WHERE username = ?
        """,
        (username,)
    )
    total_sessions, total_minutes = cursor.fetchone()

    cursor.execute(
        """
        SELECT COALESCE(SUM(minutes), 0)
        FROM study_sessions
        WHERE username = ? AND DATE(completed_at) = DATE('now')
        """,
        (username,)
    )
    today_minutes = cursor.fetchone()[0]

    cursor.execute(
        """
        SELECT COALESCE(SUM(minutes), 0)
        FROM study_sessions
        WHERE username = ? AND DATE(completed_at) >= DATE('now', '-6 days')
        """,
        (username,)
    )
    weekly_minutes = cursor.fetchone()[0]

    cursor.execute(
        """
        SELECT COUNT(*)
        FROM study_sessions
        WHERE username = ? AND DATE(completed_at) = DATE('now')
        """,
        (username,)
    )
    today_sessions = cursor.fetchone()[0]

    conn.close()

    streak_data = streaks.get_streak_data(username)
    achievement_count = achievements.get_count(username)

    return jsonify({
        "today_minutes": today_minutes,
        "weekly_minutes": weekly_minutes,
        "total_sessions": total_sessions,
        "total_minutes": total_minutes,
        "today_sessions": today_sessions,
        "current_streak": streak_data["current_streak"],
        "best_streak": streak_data["best_streak"],
        "achievement_count": achievement_count
    })

@app.route("/planner/add", methods=["POST"])
def planner_add():
    if "user" not in session:
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    try:
        title = request.form.get("title") or request.form.get("modalTaskName")
        subject = request.form.get("subject") or request.form.get("modalSubject")
        due_date = request.form.get("due_date") or request.form.get("modalDueDate")
        raw_minutes = request.form.get("estimated_minutes") or request.form.get("modalEstMinutes") or 30
        priority = request.form.get("priority") or request.form.get("modalPriority") or "Medium"

        try:
            estimated_minutes = int(raw_minutes)
        except (ValueError, TypeError):
            estimated_minutes = 30

        if not title:
            return jsonify({"success": False, "error": "Task title is required"}), 400

        planner.add_planner_task(
            username=session["user"],
            title=title,
            subject=subject,
            due_date=due_date,
            estimated_minutes=estimated_minutes,
            priority=priority
        )

        return jsonify({"success": True, "message": "Task created successfully"})

    except Exception as e:
        return jsonify({"success": False, "error": "Internal server error"}), 500

@app.route("/planner/toggle/<int:task_id>", methods=["POST"])
def planner_toggle(task_id):
    username = session.get("user")
    if not username:
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    changed = planner.toggle_planner_task(username, task_id)
    if changed:
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Task not found"}), 404

@app.route("/planner/delete/<int:task_id>", methods=["POST"])
def planner_delete(task_id):
    username = session.get("user")
    if not username:
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    deleted = planner.delete_planner_task(username, task_id)
    if deleted:
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Task not found"}), 404

# Subscribe Route
@app.route("/subscribe", methods=["POST"])
def subscribe():
    email = request.form.get("email", "").strip()

    if not email:
        return redirect(url_for("home"))

    conn = db.get_db()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO subscribers (email)
            VALUES (?)
            """,
            (email,)
        )
        conn.commit()
        flash("Successfully subscribed!")
    except sqlite3.IntegrityError:
        flash("Email already subscribed.")

    conn.close()
    return redirect(url_for("home"))


# Error Handlers
@app.errorhandler(404)
def page_not_found(error):
    return render_template("404.html"), 404


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=10000,
        debug=True
    )
