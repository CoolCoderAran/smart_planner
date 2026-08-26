from datetime import datetime
import sqlite3
import db

def add_planner_task(username, title, subject, due_date, estimated_minutes, priority):
    """Inserts a new task into planner_tasks and returns success status."""
    conn = db.get_db()
    cursor = conn.cursor()
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    try:
        cursor.execute("""
            INSERT INTO planner_tasks (
                username, title, subject, due_date, estimated_minutes, priority, completed, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
        """, (username, title, subject, due_date, estimated_minutes, priority, created_at))
        conn.commit()
        return True
    except sqlite3.Error as e:
        conn.rollback()
        print(f"Database insertion error: {e}")
        return False
    finally:
        conn.close()
        
def get_planner_tasks(username):
    """Retrieves all tasks for a given user from planner_tasks."""
    conn = db.get_db()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT * FROM planner_tasks WHERE username = ? ORDER BY id DESC
        """, (username,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()
    
def update_planner_task(username, task_id, title, subject, due_date, estimated_minutes, priority):
    """Updates an existing task for a user."""
    conn = db.get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE planner_tasks
            SET title = ?, subject = ?, due_date = ?, estimated_minutes = ?, priority = ?
            WHERE id = ? AND username = ?
        """, (title, subject, due_date, estimated_minutes, priority, task_id, username))
        conn.commit()
        return cursor.rowcount
    finally:
        conn.close()

def toggle_planner_task(username, task_id):
    """Toggles the completed status of a task."""
    conn = db.get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE planner_tasks
            SET completed = CASE WHEN completed = 0 THEN 1 ELSE 0 END
            WHERE id = ? AND username = ?
        """, (task_id, username))
        conn.commit()
        return cursor.rowcount
    finally:
        conn.close()

def delete_planner_task(username, task_id):
    """Deletes a task for a user."""
    conn = db.get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            DELETE FROM planner_tasks WHERE id = ? AND username = ?
        """, (task_id, username))
        conn.commit()
        return cursor.rowcount
    finally:
        conn.close()
