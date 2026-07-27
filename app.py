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

# =====================================
# APP SETUP
# =====================================

app = Flask(__name__)

# CHANGE THIS TO A REAL SECRET KEY
app.secret_key = "replace_this_with_a_long_secure_secret_key"

# KEEP USERS LOGGED IN
app.permanent_session_lifetime = timedelta(days=30)

# INITIALIZE DATABASE
db.init_db()


# =====================================
# PASSWORD SECURITY
# =====================================

COMMON_PATTERNS = {
    "password",
    "123456",
    "qwerty",
    "admin",
    "letmein"
}


def is_secure_password(password):

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

    for pattern in COMMON_PATTERNS:
        if pattern in lower_pw:
            return False

    return True


# =====================================
# HOME
# =====================================

@app.route("/")
def home():

    # LOGGED-IN USERS GO TO DASHBOARD
    if "user" in session:
        return redirect(url_for("dashboard"))

    return render_template("index.html")


# =====================================
# ABOUT
# =====================================

@app.route("/about")
def about():
    return render_template("about.html")


# =====================================
# DASHBOARD
# =====================================

@app.route("/dashboard")
def dashboard():

    username = session.get("user")  # [Change 9]: Use session.get()
    if username is None:
        return redirect(url_for("login"))

    # [Change 3]: Load streak data & achievement data
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

    # [Change 1 & 3]: Added missing comma & passed achievements template variable
    return render_template(
        "dashboard.html",
        username=username,
        tasks=tasks,
        streak_data=streak_data,
        achievements=achievement_data
    )


# =====================================
# STUDY MODE
# =====================================

@app.route("/study")
def study():

    username = session.get("user")  # [Change 9]: Use session.get()
    if username is None:
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

    # [Change 4]: Pass streak_data to study template
    return render_template(
        "study.html",
        username=username,
        tasks=tasks,
        streak_data=streaks.get_streak_data(username)
    )


# =====================================
# SAVE STUDY SESSION
# =====================================

@app.route("/save_study_session", methods=["POST"])
def save_study_session():

    username = session.get("user")  # [Change 9]: Use session.get()
    if username is None:
        return jsonify({
            "success": False,
            "message": "Not logged in"
        }), 401

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "No data received"
        }), 400

    mode = data.get("mode", "Unknown")
    task = data.get("task", "")

    # [Change 6]: Prevent negative study times
    try:
        minutes = max(0, int(data.get("minutes", 0)))
    except (ValueError, TypeError):
        minutes = 0

    # [Change 11]: Reject invalid study times <= 0
    if minutes <= 0:
        return jsonify({
            "success": False,
            "message": "Invalid study time."
        }), 400

    conn = db.get_db()
    cursor = conn.cursor()

    # [Change 7]: Verify task actually exists
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
            INSERT INTO study_sessions
            (
                username,
                mode,
                task,
                minutes,
                completed_at
            )
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
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    # [Change 5]: Close db conn BEFORE checking achievements to prevent dangling connections
    conn.close()
    achievements.check_achievements(username)

    return jsonify({
        "success": True
    })


# =====================================
# GET STUDY STATS
# =====================================

@app.route("/get_study_stats")
def get_study_stats():

    username = session.get("user")  # [Change 9]: Use session.get()

    # [Change 8]: Return structured default values when not logged in
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

    # Total Stats
    cursor.execute(
        """
        SELECT
            COUNT(*),
            COALESCE(SUM(minutes), 0)
        FROM study_sessions
        WHERE username = ?
        """,
        (username,)
    )
    total_sessions, total_minutes = cursor.fetchone()

    # Today's Minutes
    cursor.execute(
        """
        SELECT
            COALESCE(SUM(minutes), 0)
        FROM study_sessions
        WHERE username = ?
        AND DATE(completed_at) = DATE('now')
        """,
        (username,)
    )
    today_minutes = cursor.fetchone()[0]

    # [Change 2]: Calculate weekly minutes
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

    # [Change 13]: Add today's session count
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

    # [Change 14 & 15]: Fetch streak and achievement count
    streak_data = streaks.get_streak_data(username)
    achievement_count = achievements.get_count(username)

    # [Change 2, 13, 14, 15]: Updated return payload
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


# =====================================
# SIGNUP
# =====================================

@app.route("/signup", methods=["GET", "POST"])
def signup():

    # BLOCK LOGGED-IN USERS
    if "user" in session:
        return redirect(url_for("dashboard"))

    if request.method == "POST":

        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")  # [Change 10]: Password spaces kept unstripped

        # BASIC VALIDATION
        if not username or not password:
            flash("Please fill in all fields.")
            return redirect(url_for("signup"))

        # PASSWORD VALIDATION
        if not is_secure_password(password):
            flash(
                "Password must contain 12+ characters, uppercase, lowercase, number, and symbol."
            )
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

        # AUTO LOGIN
        session.permanent = True
        session["user"] = username

        return redirect(url_for("dashboard"))

    return render_template("signup.html")


# =====================================
# LOGIN
# =====================================

@app.route("/login", methods=["GET", "POST"])
def login():

    # BLOCK LOGGED-IN USERS
    if "user" in session:
        return redirect(url_for("dashboard"))

    if request.method == "POST":

        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")  # [Change 10]: Password spaces kept unstripped

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

        # USER DOES NOT EXIST
        if not user:
            flash("User not found.")
            return redirect(url_for("login"))

        stored_password = user[0]

        # PASSWORD CHECK
        if not check_password_hash(stored_password, password):
            flash("Incorrect password.")
            print("Wrong Password")

        # SUCCESSFUL LOGIN
        session.permanent = True
        session["user"] = username

        return redirect(url_for("dashboard"))

    return render_template("login.html")


# =====================================
# LOGOUT
# =====================================

@app.route("/logout")
def logout():

    session.clear()

    return redirect(url_for("home"))


# =====================================
# PLANNER
# =====================================

@app.route("/planner")
def planner():

    if session.get("user") is None:  # [Change 9]: Use session.get()
        return redirect(url_for("login"))

    return redirect(url_for("dashboard"))


# =====================================
# ADD TASK
# =====================================

@app.route("/add_task", methods=["POST"])
def add_task():

    username = session.get("user")  # [Change 9]: Use session.get()
    if username is None:
        return redirect(url_for("login"))

    task = request.form.get("task", "").strip()

    # EMPTY TASK PROTECTION
    if not task:
        return redirect(url_for("dashboard"))

    conn = db.get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO tasks (username, task)
        VALUES (?, ?)
        """,
        (username, task)
    )

    conn.commit()
    conn.close()

    return redirect(url_for("dashboard"))


# =====================================
# DELETE TASK
# =====================================

@app.route("/delete_task/<int:task_id>")
def delete_task(task_id):

    username = session.get("user")  # [Change 9]: Use session.get()
    if username is None:
        return redirect(url_for("login"))

    conn = db.get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        DELETE FROM tasks
        WHERE id = ?
        AND username = ?
        """,
        (task_id, username)
    )

    conn.commit()
    conn.close()

    return redirect(url_for("dashboard"))


# =====================================
# EMAIL SUBSCRIBE
# =====================================

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


# =====================================
# ERROR PAGES
# =====================================

@app.errorhandler(404)
def page_not_found(error):
    return render_template("404.html"), 404


# =====================================
# RUN APP
# =====================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=10000,
        debug=True
    )

