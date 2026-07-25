from datetime import datetime
import db
import streaks

def unlock(username,achievement_id):

    conn=db.get_db()
    cursor=conn.cursor()

    cursor.execute("""
    INSERT OR IGNORE INTO user_achievements
    (username,achievement_id,earned_at)
    VALUES(?,?,?)
    """,(
        username,
        achievement_id,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))

def check_achievements(username):

    conn=db.get_db()
    cursor=conn.cursor()

    cursor.execute("""
    SELECT
        id,
        requirement_type,
        requirement_value
    FROM achievements
    """)

    achievements=cursor.fetchall()

    # total sessions
    cursor.execute("""
    SELECT COUNT(*)
    FROM study_sessions
    WHERE username=?
    """,(username,))

    sessions=cursor.fetchone()[0]

    # total minutes
    cursor.execute("""
    SELECT COALESCE(SUM(minutes),0)
    FROM study_sessions
    WHERE username=?
    """,(username,))

    minutes=cursor.fetchone()[0]

    streak=streaks.get_current_streak(username)

    conn.close()

    for aid,rtype,rvalue in achievements:

        if rtype=="sessions" and sessions>=rvalue:
            unlock(username,aid)

        elif rtype=="minutes" and minutes>=rvalue:
            unlock(username,aid)

        elif rtype=="streak" and streak>=rvalue:
            unlock(username,aid)
    conn.commit()
    conn.close()
