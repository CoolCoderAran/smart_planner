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

    if "user" not in session:
        return redirect(url_for("login"))

    username = session["user"]

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
        tasks=tasks
    )

# =====================================
# STUDY MODE
# =====================================

@app.route("/study")
def study():

    if "user" not in session:
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
        (session["user"],)
    )

    tasks = cursor.fetchall()

    conn.close()

    return render_template(
        "study.html",
        username=session["user"],
        tasks=tasks
    )

# =====================================
# SAVE STUDY SESSION (Fixed Duplication & Error Handling)
# =====================================

@app.route("/save_study_session", methods=["POST"])
def save_study_session():

    if "user" not in session:
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
    
    # Safely convert to integer to prevent DB crashes
    try:
        minutes = int(data.get("minutes", 0))
    except (ValueError, TypeError):
        minutes = 0

    conn = db.get_db()
    cursor = conn.cursor()

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
                session["user"],
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

    conn.close()

    return jsonify({
        "success": True
    })


# =====================================
# GET STUDY STATS
# =====================================

@app.route("/get_study_stats")
def get_study_stats():

    if "user" not in session:
        return jsonify({})

    conn = db.get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            COUNT(*),
            COALESCE(SUM(minutes), 0)
        FROM study_sessions
        WHERE username = ?
        """,
        (session["user"],)
    )

    total_sessions, total_minutes = cursor.fetchone()

    cursor.execute(
        """
        SELECT
            COALESCE(SUM(minutes), 0)
        FROM study_sessions
        WHERE username = ?
        AND DATE(completed_at) = DATE('now')
        """,
        (session["user"],)
    )

    today_minutes = cursor.fetchone()[0]

    conn.close()

    return jsonify({
        "total_sessions": total_sessions,
        "total_minutes": total_minutes,
        "today_minutes": today_minutes
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
        password = request.form.get("password", "")

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

        # USER DOES NOT EXIST
        if not user:
            flash("User not found.")
            return redirect(url_for("login"))

        stored_password = user[0]

        # PASSWORD CHECK
        if not check_password_hash(stored_password, password):
            flash("Incorrect password.")
            return redirect(url_for("login"))

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

    if "user" not in session:
        return redirect(url_for("login"))

    return redirect(url_for("dashboard"))


# =====================================
# ADD TASK
# =====================================

@app.route("/add_task", methods=["POST"])
def add_task():

    if "user" not in session:
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
        (session["user"], task)
    )

    conn.commit()
    conn.close()

    return redirect(url_for("dashboard"))


# =====================================
# DELETE TASK
# =====================================

@app.route("/delete_task/<int:task_id>")
def delete_task(task_id):

    if "user" not in session:
        return redirect(url_for("login"))

    conn = db.get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        DELETE FROM tasks
        WHERE id = ?
        AND username = ?
        """,
        (task_id, session["user"])
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
        port=5000,
        debug=True
    )
