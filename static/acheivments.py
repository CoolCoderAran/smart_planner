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

    conn.commit()
    conn.close()
