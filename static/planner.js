// =========================
// 1. STATE & DATA
// =========================
let tasks = [
    {
        id: 1,
        title: "Math Test",
        subject: "Mathematics",
        minutes: 45,
        due: "Today",
        priority: "high",
        completed: false
    },
    {
        id: 2,
        title: "Science Quiz",
        subject: "Science",
        minutes: 30,
        due: "Today",
        priority: "medium",
        completed: false
    },
    {
        id: 3,
        title: "History Essay",
        subject: "History",
        minutes: 60,
        due: "Monday",
        priority: "low",
        completed: false
    }
];

let editingTaskId = null;

// =========================
// 2. UI TOGGLES & HELPERS
// =========================
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("mainContent");
    
    if (sidebar) sidebar.classList.toggle("open");
    if (mainContent) mainContent.classList.toggle("shifted");
}

function openModal() {
    const modal = document.getElementById("taskModal");
    if (modal) modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("taskModal");
    const form = document.getElementById("addTaskForm");
    
    if (modal) modal.style.display = "none";
    if (form) form.reset();
    editingTaskId = null; // Clear edit mode
}

// Close modal when clicking background overlay
window.addEventListener("click", function(event) {
    const modal = document.getElementById("taskModal");
    if (event.target === modal) {
        closeModal();
    }
});

function getPriorityIcon(priority) {
    if (priority === "high") return "🔴";
    if (priority === "medium") return "🟡";
    return "🟢";
}

function showEmptyState(container, message) {
    if (container && container.children.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                ${message}
            </div>
        `;
    }
}

// =========================
// 3. RENDER FUNCTION
// =========================
function renderTasks() {
    const todayContainer = document.getElementById("today-tasks");
    const upcomingContainer = document.getElementById("upcoming-tasks");
    const completedContainer = document.getElementById("completed-tasks");

    if (!todayContainer || !upcomingContainer) return;

    // Reset container contents
    todayContainer.innerHTML = "";
    upcomingContainer.innerHTML = "";
    if (completedContainer) completedContainer.innerHTML = "";

    // Sort tasks: Active first, then by priority (High -> Low)
    tasks.sort((a, b) => {
        const priorityScore = { high: 1, medium: 2, low: 3 };

        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        return priorityScore[a.priority] - priorityScore[b.priority];
    });

    tasks.forEach(task => {
        const card = document.createElement("div");
        card.className = `task-card ${task.completed ? "is-completed" : ""}`;

        card.innerHTML = `
            <div class="task-info">
                <div class="task-title">
                    ${getPriorityIcon(task.priority)} ${task.title}
                </div>
                <div class="task-subject">${task.subject}</div>
                <div class="task-meta">${task.minutes} min · Due ${task.due}</div>
            </div>
            <div class="task-actions">
                ${!task.completed 
                    ? `<button class="task-button complete-button" onclick="completeTask(${task.id})">✓ Complete</button>` 
                    : ''}
                <button class="task-button edit-button" onclick="editTask(${task.id})">✏ Edit</button>
                <button class="task-button delete-button" onclick="deleteTask(${task.id})">🗑 Delete</button>
            </div>
        `;

        // Route card to the corresponding section
        if (task.completed && completedContainer) {
            completedContainer.appendChild(card);
        } else if (task.due === "Today") {
            todayContainer.appendChild(card);
        } else {
            upcomingContainer.appendChild(card);
        }
    });

    // Display empty placeholder messages if lists are empty
    showEmptyState(todayContainer, "📋 No tasks for today");
    showEmptyState(upcomingContainer, "📅 No upcoming tasks");
    if (completedContainer) showEmptyState(completedContainer, "✅ No completed tasks yet");
}

// =========================
// 4. TASK ACTIONS
// =========================
function completeTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = true;
        renderTasks();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById("modalTaskName").value = task.title;
    document.getElementById("modalSubject").value = task.subject;
    document.getElementById("modalEstMinutes").value = task.minutes;
    document.getElementById("modalPriority").value = task.priority;

    editingTaskId = id;
    openModal();
}

// =========================
// 5. INITIALIZATION & FORM SUBMIT
// =========================
document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("addTaskForm");

    if (form) {
        form.addEventListener("submit", function(event) {
            event.preventDefault();

            const title = document.getElementById("modalTaskName").value.trim();
            const subject = document.getElementById("modalSubject").value.trim();
            const minutes = parseInt(document.getElementById("modalEstMinutes").value, 10);
            const priority = document.getElementById("modalPriority").value;
            const dueDateInput = document.getElementById("modalDueDate")?.value;

            if (!title) {
                alert("Please enter a task name.");
                return;
            }

            if (editingTaskId !== null) {
                // Update existing task
                const task = tasks.find(t => t.id === editingTaskId);
                if (task) {
                    task.title = title;
                    task.subject = subject;
                    task.minutes = minutes;
                    task.priority = priority;
                }
            } else {
                // Create new task
                tasks.push({
                    id: Date.now(),
                    title: title,
                    subject: subject,
                    minutes: minutes,
                    priority: priority,
                    due: dueDateInput || "Today",
                    completed: false
                });
            }

            renderTasks();
            closeModal();
        });
    }

    // Initial render on load
    renderTasks();
});
