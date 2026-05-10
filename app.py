from flask import Flask, render_template, request
import db

app = Flask(__name__)

# initialize database
db.init_db()

# home page
@app.route("/")
def home():
    return render_template("index.html")

# signup page
@app.route("/signup", methods=["GET", "POST"])
def signup():

    if request.method == "POST":

        username = request.form["username"]
        password = request.form["password"]

        conn = db.get_db()
        cursor = conn.cursor()

        try:
            cursor.execute(
                "INSERT INTO users (username, password) VALUES (?, ?)",
                (username, password)
            )

            conn.commit()

        except:
            conn.close()
            return "Username already exists"

        conn.close()

        return "Account created"

    return render_template("signup.html")

# local development
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        username = request.form["username"]
        password = request.form["password"]

        conn = db.get_db()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM users WHERE username=? AND password=?",
            (username, password)
        )

        user = cursor.fetchone()

        conn.close()

        if user:
            return "Login successful"

        else:
            return "Invalid username or password"

    return render_template("login.html")

@app.route("/terms")
def terms():
    return render_template("terms.html")

import re

COMMON_PATTERNS = [
    "password", "123456", "qwerty", "admin", "letmein"
]

def is_secure_password(pw):
    # length requirement (main driver of entropy)
    if len(pw) < 12:
        return False

    # character class checks
    if not re.search(r"[A-Z]", pw):
        return False
    if not re.search(r"[a-z]", pw):
        return False
    if not re.search(r"[0-9]", pw):
        return False
    if not re.search(r"[^A-Za-z0-9]", pw):
        return False

    # prevent weak patterns
    lower_pw = pw.lower()
    for pattern in COMMON_PATTERNS:
        if pattern in lower_pw:
            return False

    return True
