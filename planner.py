from datetime import datetime
from db import get_db_connection

def add_planner_task(username, title, subject, due_date, estimated_minutes, priority):
    """Inserts a new task into the planner_tasks table."""
    conn = get_db_connection()
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
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM planner_tasks WHERE username = ? ORDER BY id DESC
    """, (username,))
    
    rows = cursor.fetchall()
    conn.close()
    
    # Convert Row objects to dictionaries
    return [dict(row) for row in rows]
