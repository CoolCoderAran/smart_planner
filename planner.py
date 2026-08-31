from datetime import datetime
import sqlite3
import db

def add_planner_task(username, title, subject, due_date, due_time, estimated_minutes, priority):
    """Inserts a new task into planner_tasks with due_time and returns success status."""
    conn = db.get_db()
    cursor = conn.cursor()
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    try:
        cursor.execute("""
            INSERT INTO planner_tasks (
                username, title, subject, due_date, due_time, estimated_minutes, priority, completed, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
        """, (username, title, subject, due_date, due_time, estimated_minutes, priority, created_at))
        conn.commit()
        return True
    except sqlite3.Error as e:
        conn.rollback()
        print(f"Database insertion error: {e}")
        return False
    finally:
        conn.close()

# Fix 10: Logical ordering (uncompleted first, then by due date, due time, and priority)
def get_planner_tasks(username):
    """Retrieves all tasks for a given user ordered by completion status, due date, due time, and priority."""
    conn = db.get_db()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT * FROM planner_tasks 
            WHERE username = ? 
            ORDER BY 
                completed ASC,
                CASE WHEN due_date IS NULL OR due_date = '' THEN 1 ELSE 0 END ASC,
                due_date ASC,
                CASE WHEN due_time IS NULL OR due_time = '' THEN 1 ELSE 0 END ASC,
                due_time ASC,
                CASE priority
                    WHEN 'High' THEN 1
                    WHEN 'Medium' THEN 2
                    WHEN 'Low' THEN 3
                    ELSE 4
                END ASC,
                id DESC
        """, (username,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

# Fix 6 & 7: Updated signature to accept due_time and completed status, with strict username isolation
def update_planner_task(username, task_id, title, subject, due_date, due_time, estimated_minutes, priority, completed=None):
    """Updates an existing task for a user while preserving fields and enforcing account ownership."""
    conn = db.get_db()
    cursor = conn.cursor()

    try:
        if completed is not None:
            cursor.execute("""
                UPDATE planner_tasks
                SET title = ?, subject = ?, due_date = ?, due_time = ?, estimated_minutes = ?, priority = ?, completed = ?
                WHERE id = ? AND username = ?
            """, (title, subject, due_date, due_time, estimated_minutes, priority, completed, task_id, username))
        else:
            cursor.execute("""
                UPDATE planner_tasks
                SET title = ?, subject = ?, due_date = ?, due_time = ?, estimated_minutes = ?, priority = ?
                WHERE id = ? AND username = ?
            """, (title, subject, due_date, due_time, estimated_minutes, priority, task_id, username))
            
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

# Fix 9: Strict ownership enforcement on task completion toggle
def toggle_planner_task(username, task_id):
    """Toggles the completed status of a task strictly owned by the specified user."""
    conn = db.get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE planner_tasks
            SET completed = CASE WHEN completed = 0 THEN 1 ELSE 0 END
            WHERE id = ? AND username = ?
        """, (task_id, username))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

# Fix 8: Strict ownership enforcement on task deletion
def delete_planner_task(username, task_id):
    """Deletes a task strictly owned by the specified user."""
    conn = db.get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            DELETE FROM planner_tasks WHERE id = ? AND username = ?
        """, (task_id, username))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()
