from datetime import datetime
import db
import sqlite3
conn.row_factory = sqlite3.Row

def add_planner_task(username, title, subject, due_date, estimated_minutes, priority):
    """Inserts a new task into the planner_tasks table."""
    conn = db.get_db()
    cursor = conn.cursor()
    
    created_at = datetime.now().isoformat()
    
    cursor.execute("""
        INSERT INTO planner_tasks (
            username, title, subject, due_date, estimated_minutes, priority, completed, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    """, (username, title, subject, due_date, estimated_minutes, priority, created_at))
    
    conn.commit()
    conn.close()

def get_planner_tasks(username):
    """Retrieves all tasks for a given user from planner_tasks."""
    conn = db.get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM planner_tasks WHERE username = ? ORDER BY id DESC
    """, (username,))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]
    
def update_planner_task(
    username,
    task_id,
    title,
    subject,
    due_date,
    estimated_minutes,
    priority
):
    conn = db.get_db()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE planner_tasks
        SET
            title = ?,
            subject = ?,
            due_date = ?,
            estimated_minutes = ?,
            priority = ?
        WHERE id = ?
        AND username = ?
    """, (
        title,
        subject,
        due_date,
        estimated_minutes,
        priority,
        task_id,
        username
    ))

    conn.commit()
    changed = cursor.rowcount
    conn.close()

    return changed
def toggle_planner_task(username, task_id):
    conn = db.get_db()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE planner_tasks
        SET completed = CASE
            WHEN completed = 0 THEN 1
            ELSE 0
        END
        WHERE id = ?
        AND username = ?
    """, (task_id, username))

    conn.commit()
    changed = cursor.rowcount
    conn.close()
    

    return changed

def delete_planner_task(username, task_id):
    conn = db.get_db()
    cursor = conn.cursor()

    cursor.execute("""
        DELETE FROM planner_tasks
        WHERE id = ?
        AND username = ?
    """, (task_id, username))

    conn.commit()
    deleted = cursor.rowcount
    conn.close()

    return deleted
