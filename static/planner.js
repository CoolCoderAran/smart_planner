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
// 2. UI TOGGLES & MODAL
// =========================
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("mainContent");
    
    if (sidebar) sidebar.classList.toggle("active");
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
    editingTaskId = null; // Clear edit mode on close
}

// Close modal when clicking on background overlay
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

// =========================
// 3. RENDER FUNCTION
// =========================
function renderTasks() {
    tasks.sort((a, b) => {

    const priority = {
        high: 1,
        medium: 2,
        low: 3
    };

    // Completed tasks go last
    if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
    }

    // Higher priority first
    if (priority[a.priority] !== priority[b.priority]) {
        return priority[a.priority] - priority[b.priority];
    }

    // Earlier due date first
    return new Date(a.due) - new Date(b.due);
});
    const today = document.getElementById("today-tasks");
    const upcoming = document.getElementById("upcoming-tasks");
    const completed = document.getElementById("completed-tasks");

    today.innerHTML = "";
    upcoming.innerHTML = "";
    completed.innerHTML = "";

    tasks.forEach(task => {
        const card = createTaskCard(task);

        if (task.completed) {
            completed.appendChild(card);
        } else if (task.due === "Today") {
            today.appendChild(card);
        } else {
            upcoming.appendChild(card);
        }
    });
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

    // Populate modal form fields for editing
    document.getElementById("modalTaskName").value = task.title;
    document.getElementById("modalSubject").value = task.subject;
    document.getElementById("modalEstMinutes").value = task.minutes;
    document.getElementById("modalPriority").value = task.priority;

    editingTaskId = id;
    openModal();
}

// =========================
// 5. FORM SUBMISSION
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
            const dueDate = document.getElementById("modalDueDate")?.value || "Today";

            if (!title) {
                alert("Please enter a task title.");
                return;
            }

            if (editingTaskId !== null) {
                // Editing existing task
                const task = tasks.find(t => t.id === editingTaskId);
                if (task) {
                    task.title = title;
                    task.subject = subject;
                    task.minutes = minutes;
                    task.priority = priority;
                }
            } else {
                // Creating new task
                tasks.push({
                    id: Date.now(),
                    title: title,
                    subject: subject,
                    minutes: minutes,
                    priority: priority,
                    due: dueDate === new Date().toISOString().split('T')[0] ? "Today" : dueDate,
                    completed: false
                });
            }

            renderTasks();
            closeModal();
        });
    }

    // Initial render on page load
    renderTasks();
});            const dueDate = document.getElementById("modalDueDate").value;

            console.log("New Task Data:", { title, dueDate });

            // Reset form fields and close modal
            form.reset();
            closeModal();
        });
    }
});

function getPriorityIcon(priority) {
    if (priority === "high") return "🔴";
    if (priority === "medium") return "🟡";
    return "🟢";
}

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const minutes = Number(minutesInput.value);

    if (!title) {
        alert("Please enter a task name.");
        return;
    }

    if (!Number.isFinite(minutes) || minutes <= 0) {
        alert("Enter a valid number of minutes.");
        return;
    }

    if (editingTaskId !== null) {
        const task = tasks.find(t => t.id === editingTaskId);

        if (task) {
            task.title = title;
            task.subject = subjectInput.value.trim();
            task.minutes = minutes;
            task.priority = priorityInput.value;
        }
    } else {
        tasks.push({
            id: Date.now(),
            title: title,
            subject: subjectInput.value.trim(),
            minutes: minutes,
            priority: priorityInput.value,
            due: "Today",
            completed: false
        });
    }

    renderTasks();
    taskModal.classList.remove("open");
    editingTaskId = null;
});

function renderTasks() {

    const todayContainer = document.getElementById("today-tasks");
    const upcomingContainer = document.getElementById("upcoming-tasks");

    todayContainer.innerHTML = "";
    upcomingContainer.innerHTML = "";

    tasks.forEach(task => {

        const card = document.createElement("div");
        card.className = "task-card";

        card.innerHTML = `
            <div class="task-info">

                <div class="task-title">
                    ${getPriorityIcon(task.priority)}
                    ${task.title}
                </div>

                <div class="task-subject">
                    ${task.subject}
                </div>

                <div class="task-meta">
                    ${task.minutes} min · Due ${task.due}
                </div>

            </div>

            <div class="task-actions">

                <button
                    class="task-button complete-button"
                    onclick="completeTask(${task.id})">
                    ✓ Complete
                </button>

                <button
                    class="task-button edit-button"
                    onclick="editTask(${task.id})">
                    ✏ Edit
                </button>

                <button
                    class="task-button delete-button"
                    onclick="deleteTask(${task.id})">
                    🗑 Delete
                </button>

            </div>
        `;

        if (task.due === "Today") {
            todayContainer.appendChild(card);
        } else {
            upcomingContainer.appendChild(card);
        }
    });
}


function completeTask(id) {

    const task = tasks.find(task => task.id === id);

    if (!task) return;

    task.completed = true;

    renderTasks();
}


function deleteTask(id) {

    const index = tasks.findIndex(task => task.id === id);

    if (index === -1) return;

    tasks.splice(index, 1);

    renderTasks();
}


function editTask(id) {

    const task = tasks.find(task => task.id === id);

    if (!task) return;

    const newTitle = prompt("Task name:", task.title);

    if (newTitle && newTitle.trim()) {
        task.title = newTitle.trim();
        renderTasks();
    }
}


renderTasks();
