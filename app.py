from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session
)

import re
import db

from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)

# =========================
# APP SETUP
# =========================

app = Flask(__name__)

app.secret_key = "replace_this_with_a_long_random_secret"

db.init_db()

# =========================
# PASSWORD SECURITY
# =========================

COMMON_PATTERNS = [
    "password",
    "123456",
    "qwerty",
    "admin",
    "letmein"
]

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


# =========================
# HOME
# =========================

@app.route("/")
def home():
    return render_template("index.html")


# =========================
# ABOUT
# =========================

@app.route("/about")
def about():
    return render_template("about.html")


# =========================
# SIGNUP
# =========================

@app.route("/signup", methods=["GET", "POST"])
def signup():

    if request.method == "POST":

        username = request.form["username"].strip()
        password = request.form["password"]

        # PASSWORD VALIDATION
        if not is_secure_password(password):
            return "Weak password. Use 12+ characters with uppercase, lowercase, number, and symbol."

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

        except:
            conn.close()
            return "Username already exists"

        conn.close()

        # AUTO LOGIN AFTER SIGNUP
        session["user"] = username

        return redirect(url_for("home"))

    return render_template("signup.html")


# =========================
# LOGIN
# =========================

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        username = request.form["username"].strip()
        password = request.form["password"]

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

        # CHECK PASSWORD HASH
        if user and check_password_hash(user[0], password):

            session["user"] = username

            return redirect(url_for("planner"))

        return "Invalid username or password"

    return render_template("login.html")


# =========================
# LOGOUT
# =========================

@app.route("/logout")
def logout():

    session.pop("user", None)

    return redirect(url_for("home"))


# =========================
# PLANNER
# =========================

@app.route("/planner")
def planner():

    # BLOCK GUEST ACCESS
    if "user" not in session:
        return redirect(url_for("login"))

    username = session["user"]

    conn = db.get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT task
        FROM tasks
        WHERE username = ?
        """,
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

    task = request.form["task"]

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

    return redirect(url_for("planner"))


# =========================
# EMAIL SUBSCRIBE
# =========================

@app.route("/subscribe", methods=["POST"])
def subscribe():

    email = request.form["email"].strip()

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

    except:
        conn.close()
        return "Email already subscribed"

    conn.close()

    return redirect(url_for("home"))


# =========================
# RUN APP
# =========================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
