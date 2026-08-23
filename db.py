import sqlite3


DB_NAME = "database.db"


def get_db():
    conn = sqlite3.connect(DB_NAME)
    return conn


def init_db():

    conn = get_db()
    cursor = conn.cursor()



    # Table of Users

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        username TEXT UNIQUE NOT NULL,

        password TEXT NOT NULL,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP

    )
    """)



    
    # Table of tasks.
    

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        username TEXT NOT NULL,

        task TEXT NOT NULL

    )
    """)




    # Table of Subscriibers(those who entered their email in)


    cursor.execute("""
    CREATE TABLE IF NOT EXISTS subscribers (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        email TEXT UNIQUE NOT NULL

    )
    """)



    # Study Sessions Table


    cursor.execute("""
    CREATE TABLE IF NOT EXISTS study_sessions (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        username TEXT NOT NULL,

        mode TEXT NOT NULL,

        task TEXT,

        minutes INTEGER NOT NULL,

        completed_at TEXT NOT NULL

    )
    """)

    
    # Planner Table


   
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS planner_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        description TEXT,
        priority TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        estimated_minutes INTEGER NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL,
        completed_at TEXT
        )
    """)

    # Table of Acheivments.
   

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS achievements (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        name TEXT UNIQUE NOT NULL,

        description TEXT NOT NULL,

        icon TEXT,

        requirement_type TEXT NOT NULL,

        requirement_value INTEGER NOT NULL

    )
    """)


    # User Acheivments Tables


    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_achievements (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        username TEXT NOT NULL,

        achievement_id INTEGER NOT NULL,

        earned_at TEXT NOT NULL,

        UNIQUE(username, achievement_id)

    )
    """)



    insert_achievements(cursor)


    conn.commit()
    conn.close()


def delete_task(task_id: int):
    """
    Deletes a specific task by its unique ID.
    """
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        conn.commit()
        print(f"Successfully deleted task with ID {task_id}.")
    except sqlite3.Error as e:
        conn.rollback()
        print(f"An error occurred while deleting the task: {e}")
    finally:
        conn.close()

# The 50 Default Acheivments.


def insert_achievements(cursor):


    ACHIEVEMENTS = [


        # Sessions

        (
            "First Session",
            "Complete your first study session",
            "🎉",
            "sessions",
            1
        ),

        (
            "Getting Started",
            "Complete 5 study sessions",
            "📘",
            "sessions",
            5
        ),

        (
            "Dedicated",
            "Complete 25 study sessions",
            "📗",
            "sessions",
            25
        ),

        (
            "Scholar",
            "Complete 50 study sessions",
            "📚",
            "sessions",
            50
        ),


        (
            "Master Student",
            "Complete 100 study sessions",
            "🏆",
            "sessions",
            100
        ),



        # Minutes


        (
            "100 Minutes",
            "Study 100 total minutes",
            "⏱",
            "minutes",
            100
        ),

        (
            "500 Minutes",
            "Study 500 total minutes",
            "⌚",
            "minutes",
            500
        ),

        (
            "1000 Minutes",
            "Study 1000 total minutes",
            "🕒",
            "minutes",
            1000
        ),



        # Streaks


        (
            "2 Day Streak",
            "Study 2 days in a row",
            "🔥",
            "streak",
            2
        ),

        (
            "7 Day Streak",
            "Study 7 days in a row",
            "🔥",
            "streak",
            7
        ),

        (
            "30 Day Streak",
            "Study 30 days in a row",
            "🔥",
            "streak",
            30
        ),



        # Modes


        (
            "Pomodoro Beginner",
            "Complete 10 Pomodoro sessions",
            "🍅",
            "pomodoro",
            10
        ),

        (
            "Deep Thinker",
            "Complete 10 Deep Work sessions",
            "🧠",
            "deepwork",
            10
        ),

        (
            "Speed Learner",
            "Complete 20 Quick Burst sessions",
            "⚡",
            "quickburst",
            20
        ),

        (
            "Exam Warrior",
            "Complete 20 Exam Crunch sessions",
            "📖",
            "examcrunch",
            20
        ),



        # Daily


        (
            "Hour of Power",
            "Study 60 minutes in one day",
            "💪",
            "dailyminutes",
            60
        ),

        (
            "Marathon",
            "Study 180 minutes in one day",
            "🏃",
            "dailyminutes",
            180
        )


    ]


    cursor.executemany(

        """
        INSERT OR IGNORE INTO achievements
        (
            name,
            description,
            icon,
            requirement_type,
            requirement_value
        )

        VALUES (?,?,?,?,?)

        """,

        ACHIEVEMENTS

    )
#Planner_tasks

cursor.execute("""CREATE TABLE IF NOT EXISTS planner_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    title TEXT NOT NULL,
    subject TEXT,
    due_date TEXT,
    estimated_minutes INTEGER NOT NULL DEFAULT 30,
    priority TEXT NOT NULL DEFAULT 'Medium',
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
)
""")
