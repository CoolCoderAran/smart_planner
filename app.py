from datetime import timedelta, datetime, date
import re
import sqlite3

from flask import (
    Flask,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from werkzeug.security import check_password_hash, generate_password_hash

import achievements
import db
import planner
import streaks

app = Flask(__name__)
app.secret_key = "long_secure_secret_key"
app.permanent_session_lifetime = timedelta(days=30)

db.init_db()

# Helper Validation Functions

def validate_task_date(date_str):
    if not date_str:
        return True, None
    try:
        task_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return False, "Invalid date format. Use YYYY-MM-DD."

    if not (2000 <= task_date.year <= 2050):
        return False, "Year must be between 2000 and 2050."

    return True, task_date.strftime("%Y-%m-%d")

# Fix 15: Validate due_time format (HH:MM)
def validate_task_time(time_str):
    if not time_str:
        return True, ""
    try:
        parsed_time = datetime.strptime(time_str, "%H:%M")
        return True, parsed_time.strftime("%H:%M")
    except ValueError:
        return False, "Invalid time format. Use HH:MM (24-hour)."

Common_Patterns = {"password", "123456", "qwerty", "admin", "@123"}

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
    tasks = planner.get_planner_tasks(username)

    return render_template(
        "dashboard.html",
        username=username,
        tasks=tasks,
        streak_data=streak_data,
        achievements=achievement_data,
    )


# Fix 18: Unauthenticated access redirect for /study
@app.route("/study")
def study():
    username = session.get("user")
    if not username:
        return redirect(url_for("login"))

    tasks = planner.get_planner_tasks(username)

    return render_template(
        "study.html",
        username=username,
        tasks=tasks,
        streak_data=streaks.get_streak_data(username),
    )


@app.route("/save_study_session", methods=["POST"])
def save_study_session():
    username = session.get("user")
    if username is None:
        return jsonify({"success": False, "message": "Not logged in"}), 401

    data = request.get_json(silent=True) or {}
    mode = data.get("mode", "Unknown")
    task_title = (data.get("task") or "").strip()

    try:
        minutes = int(data.get("minutes", 0))
    except (ValueError, TypeError):
        minutes = 0

    # Fix 27: Reject zero or negative study minutes server-side
    if minutes <= 0:
        return jsonify({"success": False, "message": "Study time must be greater than 0 minutes."}), 400

    conn = db.get_db()
    cursor = conn.cursor()

    # Fix 26: Validate that the selected task belongs strictly to the logged-in user
    if task_title:
        cursor.execute(
            """
            SELECT 1 FROM planner_tasks
            WHERE username = ? AND title = ?
            """,
            (username, task_title),
        )
        if cursor.fetchone() is None:
            task_title = ""  # Disassociate task if user ownership fails

    try:
        cursor.execute(
            """
            INSERT INTO study_sessions (username, mode, task, minutes, completed_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                username,
                mode,
                task_title,
                minutes,
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "error": str(e)}), 500

    conn.close()

    # Fix 29: Execute achievement checks strictly isolated to active user
    achievements.check_achievements(username)

    return jsonify({"success": True, "message": "Study session saved successfully."}), 200

@app.route("/get_study_stats")
def get_study_stats():
    username = session.get("user")
    if not username:
        return jsonify({
            "today_minutes": 0,
            "weekly_minutes": 0,
            "total_sessions": 0,
            "total_minutes": 0
        }), 401

    conn = db.get_db()
    cursor = conn.cursor()

    try:
        # Today's minutes
        cursor.execute("""
            SELECT COALESCE(SUM(minutes), 0)
            FROM study_sessions
            WHERE username = ? AND DATE(completed_at) = DATE('now', 'localtime')
        """, (username,))
        today_minutes = cursor.fetchone()[0]

        # Weekly minutes (last 7 days)
        cursor.execute("""
            SELECT COALESCE(SUM(minutes), 0)
            FROM study_sessions
            WHERE username = ? AND DATE(completed_at) >= DATE('now', 'localtime', '-7 days')
        """, (username,))
        weekly_minutes = cursor.fetchone()[0]

        # Total sessions
        cursor.execute("""
            SELECT COUNT(*)
            FROM study_sessions
            WHERE username = ?
        """, (username,))
        total_sessions = cursor.fetchone()[0]

        # Total minutes
        cursor.execute("""
            SELECT COALESCE(SUM(minutes), 0)
            FROM study_sessions
            WHERE username = ?
        """, (username,))
        total_minutes = cursor.fetchone()[0]

    finally:
        conn.close()

    return jsonify({
        "today_minutes": today_minutes,
        "weekly_minutes": weekly_minutes,
        "total_sessions": total_sessions,
        "total_minutes": total_minutes
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
                "INSERT INTO users (username, password) VALUES (?, ?)",
                (username, hashed_password),
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


# Fix 20: Explicit flash error messages on login failure
@app.route("/login", methods=["GET", "POST"])
def login():
    if "user" in session:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        if not username or not password:
            flash("Please provide both username and password.")
            return redirect(url_for("login"))

        conn = db.get_db()
        cursor = conn.cursor()

        cursor.execute("SELECT password FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        conn.close()

        if not user or not check_password_hash(user[0], password):
            flash("Invalid username or password.")
            return redirect(url_for("login"))

        session.permanent = True
        session["user"] = username

        return redirect(url_for("dashboard"))

    return render_template("login.html")


# Fix 19: Clean session invalidation on logout
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


# Fix 16: Unauthenticated access redirect for /planner
@app.route("/planner")
def planner_view():
    username = session.get("user")
    if not username:
        return redirect(url_for("login"))

    user_tasks = planner.get_planner_tasks(username)
    return render_template("planner.html", tasks=user_tasks, username=username)


# Fixes 11, 12, 13, 14, 15: Server-side task creation validation
@app.route("/planner/add", methods=["POST"])
def add_planner_task_route():
    username = session.get("user")
    if not username:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    data = request.get_json(silent=True) or request.form

    # Fix 11: Sanitize and reject whitespace-only or empty titles
    title = (data.get("title") or data.get("modalTaskName") or "").strip()
    subject = (data.get("subject") or data.get("modalTaskSubject") or "").strip()
    due_date = data.get("due_date") or data.get("modalDueDate") or None
    due_time = data.get("due_time") or data.get("modalDueTime") or None
    raw_priority = data.get("priority") or data.get("modalPriority") or "Medium"

    if not title:
        return jsonify({"status": "error", "message": "Task title is required."}), 400

    if len(title) > 255:
        return jsonify({"status": "error", "message": "Title cannot exceed 255 characters."}), 400
    if len(subject) > 255:
        return jsonify({"status": "error", "message": "Subject cannot exceed 255 characters."}), 400

    try:
        raw_minutes = data.get("estimated_minutes") or data.get("modalEstMinutes") or 30
        estimated_minutes = int(raw_minutes)
        if estimated_minutes < 0:
            return jsonify({"status": "error", "message": "Estimated minutes cannot be negative."}), 400
        if estimated_minutes == 0:
            estimated_minutes = 30
    except (ValueError, TypeError):
        estimated_minutes = 30

    priority = raw_priority if raw_priority in ["Low", "Medium", "High"] else "Medium"

    # Date validation
    if due_date:
        valid_date, date_or_msg = validate_task_date(due_date)
        if not valid_date:
            return jsonify({"status": "error", "message": date_or_msg}), 400
        due_date = date_or_msg

    # Fix 15: Time validation
    if due_time:
        valid_time, time_or_msg = validate_task_time(due_time)
        if not valid_time:
            return jsonify({"status": "error", "message": time_or_msg}), 400
        due_time = time_or_msg

    success = planner.add_planner_task(
        username=username,
        title=title,
        subject=subject,
        due_date=due_date,
        due_time=due_time,
        estimated_minutes=estimated_minutes,
        priority=priority,
    )

    if success:
        return jsonify({"status": "success", "message": "Task added successfully"}), 200
    
    return jsonify({"status": "error", "message": "Database insertion failed"}), 500


@app.route("/planner/update/<int:task_id>", methods=["POST"])
def planner_update(task_id):
    username = session.get("user")
    if not username:
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or request.form

    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"success": False, "error": "Task title is required."}), 400

    subject = (data.get("subject") or "").strip()
    due_date = data.get("due_date") or None
    due_time = data.get("due_time") or None
    raw_priority = data.get("priority") or "Medium"
    completed = data.get("completed")

    try:
        estimated_minutes = max(0, int(data.get("estimated_minutes") or 30))
    except (ValueError, TypeError):
        estimated_minutes = 30

    priority = raw_priority if raw_priority in ["Low", "Medium", "High"] else "Medium"

    changed = planner.update_planner_task(
        username=username,
        task_id=task_id,
        title=title,
        subject=subject,
        due_date=due_date,
        due_time=due_time,
        estimated_minutes=estimated_minutes,
        priority=priority,
        completed=completed,
    )

    if changed:
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Task not found or unchanged"}), 404


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


# Fix 22: Clean month boundary wrap-around logic for calendar navigation
@app.route("/calendar")
def calendar_view():
    username = session.get("user")
    if not username:
        return redirect(url_for("login"))

    user_tasks = planner.get_planner_tasks(username)
    
    today = date.today()
    selected_year = request.args.get("year", default=today.year, type=int)
    selected_month = request.args.get("month", default=today.month, type=int)

    # Normalize month boundaries (1-12)
    if selected_month > 12:
        selected_year += (selected_month - 1) // 12
        selected_month = ((selected_month - 1) % 12) + 1
    elif selected_month < 1:
        selected_year -= abs(selected_month) // 12 + 1
        selected_month = 12 - (abs(selected_month) % 12)

    # Calculate previous and next month/year values for template controls
    prev_month = 12 if selected_month == 1 else selected_month - 1
    prev_year = selected_year - 1 if selected_month == 1 else selected_year
    next_month = 1 if selected_month == 12 else selected_month + 1
    next_year = selected_year + 1 if selected_month == 12 else selected_year

    return render_template(
        "calendar.html",
        tasks=user_tasks,
        year=selected_year,
        month=selected_month,
        prev_month=prev_month,
        prev_year=prev_year,
        next_month=next_month,
        next_year=next_year,
        today_date=today.strftime("%Y-%m-%d"),
    )

@app.route("/get_recent_sessions")
def get_recent_sessions():
    username = session.get("user")
    if not username:
        return jsonify([]), 401

    conn = db.get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT task, mode, minutes, completed_at
            FROM study_sessions
            WHERE username = ?
            ORDER BY completed_at DESC
            LIMIT 5
        """, (username,))
        rows = cursor.fetchall()
        
        history = [
            {"task": r[0], "mode": r[1], "minutes": r[2], "completed_at": r[3]}
            for r in rows
        ]
    finally:
        conn.close()

    return jsonify(history)
    
@app.errorhandler(404)
def page_not_found(error):
    return render_template("404.html"), 404

def build_response(success, message="", data=None, status_code=200):
    payload = {
        "success": success,
        "message": message,
        "status": "success" if success else "error"
    }
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status_code
    

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000, debug=True)
