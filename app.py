from flask import Flask, render_template, request, redirect, url_for, session, flash
import re
import sqlite3
import db

from werkzeug.security import generate_password_hash, check_password_hash


# =========================
# APP SETUP
# =========================

app = Flask(__name__)
app.secret_key = "replace_with_a_real_secret_key"

db.init_db()


# =========================
# SECURITY RULES
# =========================

COMMON_PATTERNS = {"password", "123456", "qwerty", "admin", "letmein"}


def is_secure_password(password: str) -> bool:
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

    lower = password.lower()
    return not any(pattern in lower for pattern in COMMON_PATTERNS)


# =========================
# HOME
# =========================

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/about")
def about():
    return render_template("about.html")


# =========================
# SIGNUP
# =========================

@app.route("/signup", methods=["GET", "POST"])
def signup():

    if request.method == "POST":

        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        if not username or not password:
            flash("Missing username or password")
            return redirect(url_for("signup"))

        if not is_secure_password(password):
            flash("Password is too weak")
            return redirect(url_for("signup"))

        hashed = generate_password_hash(password)

        conn = db.get_db()
        cursor = conn.cursor()

        try:
            cursor.execute(
                "INSERT INTO users (username, password) VALUES (?, ?)",
                (username, hashed)
            )
            conn.commit()

        except sqlite3.IntegrityError:
            flash("Username already exists")
            return redirect(url_for("signup"))

        finally:
            conn.close()

        session.clear()
        session["user"] = username

        return redirect(url_for("planner"))

    return render_template("signup.html")


# =========================
# LOGIN
# =========================

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        conn = db.get_db()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT password FROM users WHERE username = ?",
            (username,)
        )

        user = cursor.fetchone()
        conn.close()

        if user and check_password_hash(user[0], password):
            session.clear()
            session["user"] = username
            return redirect(url_for("planner"))

        flash("Invalid username or password")
        return redirect(url_for("login"))

    return render_template("login.html")


# =========================
# LOGOUT
# =========================

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("home"))


# =========================
# PLANNER (PROTECTED)
# =========================

@app.route("/planner")
def planner():

    if "user" not in session:
        return redirect(url_for("login"))

    username = session["user"]

    conn = db.get_db()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT task FROM tasks WHERE username = ?",
        (username,)
    )

    tasks = cursor.fetchall()
    conn.close()

    return render_template(
        "planner.html",
        tasks=tasks,
        username=username
    )


# =========================
# ADD TASK
# =========================

@app.route("/add_task", methods=["POST"])
def add_task():

    if "user" not in session:
        return redirect(url_for("login"))

    task = request.form.get("task", "").strip()

    if not task:
        return redirect(url_for("planner"))

    conn = db.get_db()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO tasks (username, task) VALUES (?, ?)",
        (session["user"], task)
    )

    conn.commit()
    conn.close()

    return redirect(url_for("planner"))


# =========================
# SUBSCRIBE (EMAIL)
# =========================

@app.route("/subscribe", methods=["POST"])
def subscribe():

    email = request.form.get("email", "").strip()

    if not email:
        return redirect(url_for("home"))

    conn = db.get_db()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO subscribers (email) VALUES (?)",
            (email,)
        )
        conn.commit()

    except sqlite3.IntegrityError:
        flash("Already subscribed")

    finally:
        conn.close()

    return redirect(url_for("home"))


# =========================
# RUN APP
# =========================

if __name__ == "__main__":
    app.run(debug=True)
