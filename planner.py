from datetime import datetime
import db  # Import db directly to keep function calls consistent with app.py

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
