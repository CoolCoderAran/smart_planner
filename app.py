from flask import Flask, render_template, request
import db
import re
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# =========================
# DATABASE INIT
# =========================
db.init_db()

# =========================
# PASSWORD SECURITY RULE (~400 entropy equivalent)
# =========================
COMMON_PATTERNS = [
    "password", "123456", "qwerty", "admin", "letmein"
]

def is_secure_password(pw):
    if len(pw) < 12:
        return False
    if not re.search(r"[A-Z]", pw):
        return False
    if not re.search(r"[a-z]", pw):
        return False
    if not re.search(r"[0-9]", pw):
        return False
    if not re.search(r"[^A-Za-z0-9]", pw):
        return False

    lower_pw = pw.lower()
    for pattern in COMMON_PATTERNS:
        if pattern in lower_pw:
            return False

    return True


# =========================
# ROUTES
# =========================

@app.route("/")
def home():
    return render_template("index.html")


# -------------------------
# SIGNUP (HASHED)
# -------------------------
@app.route("/signup", methods=["GET", "POST"])
def signup():

    if request.method == "POST":

        username = request.form["username"]
        password = request.form["password"]

        # enforce strong password
        if not is_secure_password(password):
            return "Weak password: use 12+ chars with uppercase, lowercase, number, and symbol."

        # 🔐 HASH PASSWORD HERE
        hashed_password = generate_password_hash(password)

        conn = db.get_db()
        cursor = conn.cursor()

        try:
            cursor.execute(
                "INSERT INTO users (username, password) VALUES (?, ?)",
                (username, hashed_password)
            )
            conn.commit()

        except:
            conn.close()
            return "Username already exists"

        conn.close()
        return "Account created successfully"

    return render_template("signup.html")


# -------------------------
# LOGIN (HASH CHECK)
# -------------------------
@app.route("/signup", methods=["GET", "POST"])
def signup():

    if request.method == "POST":

        username = request.form["username"]
        password = request.form["password"]

        if not is_secure_password(password):
            return "Weak password"

        hashed_password = generate_password_hash(password)

        conn = db.get_db()
        cursor = conn.cursor()

        try:
            cursor.execute(
                "INSERT INTO users (username, password) VALUES (?, ?)",
                (username, hashed_password)
            )
            conn.commit()

        except:
            conn.close()
            return "Username already exists"

        conn.close()

        # ✅ redirect instead of plain text
        return redirect(url_for("login"))

    return render_template("signup.html")
