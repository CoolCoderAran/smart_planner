from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")


# Only used when running locally (NOT used on Render)
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

from flask import Flask, render_template, request

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        return "Signup received (not stored yet)"
    return render_template("signup.html")
