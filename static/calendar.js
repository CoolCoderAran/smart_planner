let currentView = "month";
let currentDate = new Date();
let selectedTask = null;

document.addEventListener("DOMContentLoaded", function () {
    updateCalendarView();

    // Bind Calendar Modal Action Buttons
    document.getElementById("calToggleBtn")?.addEventListener("click", async () => {
        if (!selectedTask) return;
        if (typeof completeTask === "function") {
            await completeTask(selectedTask.id);
            closeCalendarModal();
            window.location.reload();
        }
    });

    document.getElementById("calDeleteBtn")?.addEventListener("click", async () => {
        if (!selectedTask) return;
        if (typeof deleteTask === "function") {
            await deleteTask(selectedTask.id);
            closeCalendarModal();
            window.location.reload();
        }
    });

    document.getElementById("calEditBtn")?.addEventListener("click", () => {
        if (!selectedTask) return;
        closeCalendarModal();
        if (typeof editTask === "function") {
            editTask(
                selectedTask.id,
                selectedTask.title,
                selectedTask.subject,
                selectedTask.estimated_minutes,
                selectedTask.priority,
                selectedTask.due_date
            );
        }
    });

    // View Navigation Controls
    document.getElementById("prevMonthBtn")?.addEventListener("click", () => {
        if (currentView === "month") currentDate.setMonth(currentDate.getMonth() - 1);
        else if (currentView === "week") currentDate.setDate(currentDate.getDate() - 7);
        else if (currentView === "day") currentDate.setDate(currentDate.getDate() - 1);
        updateCalendarView();
    });

    document.getElementById("nextMonthBtn")?.addEventListener("click", () => {
        if (currentView === "month") currentDate.setMonth(currentDate.getMonth() + 1);
        else if (currentView === "week") currentDate.setDate(currentDate.getDate() + 7);
        else if (currentView === "day") currentDate.setDate(currentDate.getDate() + 1);
        updateCalendarView();
    });

    document.getElementById("todayBtn")?.addEventListener("click", () => {
        currentDate = new Date();
        updateCalendarView();
    });

    // View Switching Buttons
    document.querySelectorAll(".view-btn")?.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".view-btn").forEach((b) => b.classList.remove("active"));
            e.target.classList.add("active");
            currentView = e.target.dataset.view;
            updateCalendarView();
        });
    });
});

function updateCalendarView() {
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const displayHeader = document.getElementById("currentMonthYearDisplay");
    if (displayHeader) {
        displayHeader.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }

    if (currentView === "month") {
        renderMonthGrid();
    } else if (currentView === "week") {
        renderWeekGrid();
    } else if (currentView === "day") {
        renderDayGrid();
    }
}

function renderMonthGrid() {
    const grid = document.getElementById("calendarGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "calendar-day empty";
        grid.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement("div");
        dayCell.className = "calendar-day";
        
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        dayCell.dataset.date = dateStr;

        const dayNum = document.createElement("span");
        dayNum.className = "day-number";
        dayNum.textContent = day;
        dayCell.appendChild(dayNum);

        const tasksContainer = document.createElement("div");
        tasksContainer.className = "day-tasks";
        dayCell.appendChild(tasksContainer);

        grid.appendChild(dayCell);
    }

    renderCalendarTasks();
}

function renderWeekGrid() {
    const grid = document.getElementById("calendarGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);

        const dayCell = document.createElement("div");
        dayCell.className = "calendar-day week-view-day";

        const dateStr = dayDate.toISOString().split("T")[0];
        dayCell.dataset.date = dateStr;

        const dayNum = document.createElement("span");
        dayNum.className = "day-number";
        dayNum.textContent = `${dayDate.toLocaleDateString("en-US", { weekday: "short" })} ${dayDate.getDate()}`;
        dayCell.appendChild(dayNum);

        const tasksContainer = document.createElement("div");
        tasksContainer.className = "day-tasks";
        dayCell.appendChild(tasksContainer);

        grid.appendChild(dayCell);
    }

    renderCalendarTasks();
}

function renderDayGrid() {
    const grid = document.getElementById("calendarGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day day-view-full";

    const dateStr = currentDate.toISOString().split("T")[0];
    dayCell.dataset.date = dateStr;

    const dayNum = document.createElement("span");
    dayNum.className = "day-number";
    dayNum.textContent = currentDate.toDateString();
    dayCell.appendChild(dayNum);

    const tasksContainer = document.createElement("div");
    tasksContainer.className = "day-tasks";
    dayCell.appendChild(tasksContainer);

    grid.appendChild(dayCell);

    renderCalendarTasks();
}

function renderCalendarTasks() {
    if (typeof allTasks === "undefined" || !Array.isArray(allTasks)) return;

    allTasks.forEach((task) => {
        if (!task.due_date) return;

        const dateKey = task.due_date.split("T")[0];
        const dayCell = document.querySelector(`.calendar-day[data-date="${dateKey}"]`);

        if (dayCell) {
            const tasksContainer = dayCell.querySelector(".day-tasks");
            if (!tasksContainer) return;

            const badge = document.createElement("div");
           // Change this line inside renderCalendarTasks():
// badge.className = `calendar-task-badge ${task.completed ? "completed" : ""}`;

// To this:
const priorityClass = task.priority ? `priority-${task.priority.toLowerCase()}` : '';
badge.className = `calendar-task-badge ${priorityClass} ${task.completed ? "completed" : ""}`;
            badge.textContent = task.title;

            badge.addEventListener("click", (e) => {
                e.stopPropagation();
                openCalendarTaskModal(task);
            });

            tasksContainer.appendChild(badge);
        }
    });
}

function openCalendarTaskModal(task) {
    selectedTask = task;
    document.getElementById("calModalTitle").textContent = task.title || "Untitled Task";
    document.getElementById("calModalSubject").textContent = task.subject || "N/A";
    document.getElementById("calModalDueDate").textContent = task.due_date || "No Date";
    document.getElementById("calModalPriority").textContent = task.priority || "Medium";
    document.getElementById("calModalEst").textContent = task.estimated_minutes || 30;
    document.getElementById("calModalStatus").textContent = task.completed ? "Completed" : "Pending";

    const modal = document.getElementById("calendarTaskModal");
    if (modal) modal.style.display = "flex";
}

function closeCalendarModal() {
    const modal = document.getElementById("calendarTaskModal");
    if (modal) modal.style.display = "none";
}
