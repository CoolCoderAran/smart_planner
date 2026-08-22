   function toggleSidebar() {
            const sidebar = document.getElementById("sidebar");
            const mainContent = document.getElementById("mainContent");
            
            // Toggle the 'active' class on the sidebar
            sidebar.classList.toggle("active");
            
            // Optional: Toggle 'shifted' class to push main content
            mainContent.classList.toggle("shifted");
        }

const tasks = [
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
        subject: "English",
        minutes: 60,
        due: "Monday",
        priority: "low",
        completed: false
    }
];


function getPriorityIcon(priority) {
    if (priority === "high") return "🔴";
    if (priority === "medium") return "🟡";
    return "🟢";
}


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
