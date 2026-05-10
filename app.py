from flask import Flask, render_template, request

app = Flask(__name__)

# Home page
@app.route("/")
def home():
    return render_template("index.html")

# Signup page
@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        return "Signup received (not stored yet)"
    return render_template("signup.html")

# Local development only
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
