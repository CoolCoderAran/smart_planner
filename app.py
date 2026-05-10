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
