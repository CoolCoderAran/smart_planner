// Global state
let currentView = "month";
let currentDate = new Date();
let selectedTask = null;

document.addEventListener("DOMContentLoaded", function () {
    // Sync currentDate with server-provided date if available
    if (typeof serverToday !== "undefined" && serverToday) {
        const parsedDate = new Date(serverToday + "T00:00:00");
        if (!isNaN(parsedDate.getTime())) {
            currentDate = parsedDate;
        }
    } else if (typeof currentYear !== "undefined" && typeof currentMonth !== "undefined") {
        currentDate = new Date(currentYear, currentMonth - 1, 1);
    }

    updateCalendarView();

    // Bind Calendar Modal Action Buttons
    document.getElementById("calToggleBtn")?.addEventListener("click", async () => {
        if (!selectedTask) return;
        if (typeof completeTask === "function") {
            await completeTask(selectedTask.id);
            closeCalendarModal();
            updateCalendarView();
        }
    });

    document.getElementById("calDeleteBtn")?.addEventListener("click", async () => {
        if (!selectedTask) return;
        if (typeof deleteTask === "function") {
            await deleteTask(selectedTask.id);
            closeCalendarModal();
            updateCalendarView();
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
        if (currentView === "month") {
            currentDate.setMonth(currentDate.getMonth() - 1);
        } else if (currentView === "week") {
            currentDate.setDate(currentDate.getDate() - 7);
        } else if (currentView === "day") {
            currentDate.setDate(currentDate.getDate() - 1);
        }
        updateCalendarView();
    });

    document.getElementById("nextMonthBtn")?.addEventListener("click", () => {
        if (currentView === "month") {
            currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (currentView === "week") {
            currentDate.setDate(currentDate.getDate() + 7);
        } else if (currentView === "day") {
            currentDate.setDate(currentDate.getDate() + 1);
        }
        updateCalendarView();
    });

    document.getElementById("todayBtn")?.addEventListener("click", () => {
        currentDate = new Date();
        updateCalendarView();
    });

    // View Switching Buttons
    document.querySelectorAll(".view-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const target = e.currentTarget;
            document.querySelectorAll(".view-btn").forEach((b) => b.classList.remove("active"));
            target.classList.add("active");
            currentView = target.dataset.view || "month";
            updateCalendarView();
        });
    });
});

function updateCalendarView() {
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Fixed ID match with calendar.html
    const monthYearDisplay = document.getElementById("currentMonthYearDisplay");
    if (monthYearDisplay) {
        monthYearDisplay.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
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

    grid.className = "calendar-grid view-month";
    grid.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Fill blank padding days for start of month
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "calendar-day empty";
        grid.appendChild(emptyCell);
    }

    // Render active month days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement("div");
        dayCell.className = "calendar-day";

        const monthStr = String(month + 1).padStart(2, "0");
        const dayStr = String(day).padStart(2, "0");
        const dateStr = `${year}-${monthStr}-${dayStr}`;
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

    grid.className = "calendar-grid view-week";
    grid.innerHTML = "";

    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);

        const dayCell = document.createElement("div");
        dayCell.className = "calendar-day week-view-day";

        const year = dayDate.getFullYear();
        const monthStr = String(dayDate.getMonth() + 1).padStart(2, "0");
        const dayStr = String(dayDate.getDate()).padStart(2, "0");
        const dateStr = `${year}-${monthStr}-${dayStr}`;
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

    grid.className = "calendar-grid view-day";
    grid.innerHTML = "";

    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day single-day-view";

    const year = currentDate.getFullYear();
    const monthStr = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dayStr = String(currentDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${monthStr}-${dayStr}`;
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
    // Support both rawTasksData (defined in HTML) and allTasks
    const tasksToRender = (typeof rawTasksData !== "undefined" && Array.isArray(rawTasksData))
        ? rawTasksData
        : ((typeof allTasks !== "undefined" && Array.isArray(allTasks)) ? allTasks : []);

    tasksToRender.forEach((task) => {
        if (!task.due_date) return;

        const dateKey = task.due_date.split("T")[0];
        const dayCell = document.querySelector(`.calendar-day[data-date="${dateKey}"]`);

        if (dayCell) {
            const tasksContainer = dayCell.querySelector(".day-tasks");
            if (!tasksContainer) return;

            const badge = document.createElement("div");
            const priorityClass = task.priority ? `priority-${task.priority.toLowerCase()}` : "priority-medium";
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
    
    const setElementText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setElementText("calModalTitle", task.title || "Untitled Task");
    setElementText("calModalSubject", task.subject || "N/A");
    setElementText("calModalDueDate", task.due_date || "No Date");
    setElementText("calModalPriority", task.priority || "Medium");
    setElementText("calModalEst", task.estimated_minutes || 30);
    setElementText("calModalStatus", task.completed ? "Completed" : "Pending");

    const modal = document.getElementById("calendarTaskModal");
    if (modal) modal.style.display = "flex";
}

function closeCalendarModal() {
    const modal = document.getElementById("calendarTaskModal");
    if (modal) modal.style.display = "none";
}

// Global State
let currentView = "month";
let currentDate = new Date();
let selectedTask = null;
let currentFilter = "all"; // 'all', 'incomplete', 'completed', 'high'

document.addEventListener("DOMContentLoaded", function () {
    // Sync currentDate with server date if provided
    if (typeof serverToday !== "undefined" && serverToday) {
        const parsedDate = new Date(serverToday + "T00:00:00");
        if (!isNaN(parsedDate.getTime())) {
            currentDate = parsedDate;
        }
    }

    updateCalendarView();

    // Modal Actions
    document.getElementById("calToggleBtn")?.addEventListener("click", async () => {
        if (!selectedTask) return;
        if (typeof completeTask === "function") {
            await completeTask(selectedTask.id);
            closeCalendarModal();
            updateCalendarView();
        }
    });

    document.getElementById("calDeleteBtn")?.addEventListener("click", async () => {
        if (!selectedTask) return;
        if (typeof deleteTask === "function") {
            await deleteTask(selectedTask.id);
            closeCalendarModal();
            updateCalendarView();
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

    // View Navigation
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

    // View Switching
    document.querySelectorAll(".view-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".view-btn").forEach((b) => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            currentView = e.currentTarget.dataset.view || "month";
            updateCalendarView();
        });
    });

    // Hour 4: Filter Button Handlers
    document.querySelectorAll(".filter-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            currentFilter = e.currentTarget.dataset.filter || "all";
            renderCalendarTasks();
        });
    });
});

function updateCalendarView() {
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const monthYearDisplay = document.getElementById("currentMonthYearDisplay");
    if (monthYearDisplay) {
        monthYearDisplay.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }

    if (currentView === "month") renderMonthGrid();
    else if (currentView === "week") renderWeekGrid();
    else if (currentView === "day") renderDayGrid();
}

function renderMonthGrid() {
    const grid = document.getElementById("calendarGrid");
    if (!grid) return;

    grid.className = "calendar-grid view-month";
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

    grid.className = "calendar-grid view-week";
    grid.innerHTML = "";

    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);

        const dayCell = document.createElement("div");
        dayCell.className = "calendar-day week-view-day";

        const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, "0")}-${String(dayDate.getDate()).padStart(2, "0")}`;
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

    grid.className = "calendar-grid view-day";
    grid.innerHTML = "";

    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day single-day-view";

    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
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
    const rawTasks = (typeof rawTasksData !== "undefined" && Array.isArray(rawTasksData))
        ? rawTasksData
        : ((typeof allTasks !== "undefined" && Array.isArray(allTasks)) ? allTasks : []);

    // Clear previous badges
    document.querySelectorAll(".day-tasks").forEach(container => container.innerHTML = "");

    // Hour 4: Filter Tasks
    const filteredTasks = rawTasks.filter(task => {
        if (currentFilter === "incomplete") return !task.completed;
        if (currentFilter === "completed") return task.completed;
        if (currentFilter === "high") return task.priority?.toLowerCase() === "high";
        return true;
    });

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // Group tasks by date
    const tasksByDate = {};
    filteredTasks.forEach(task => {
        if (!task.due_date) return;
        const dateKey = task.due_date.split("T")[0];
        if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
        tasksByDate[dateKey].push(task);
    });

    // Hour 4 & 5: Render badges and overflow limits
    const maxVisibleTasks = 3;

    Object.keys(tasksByDate).forEach(dateKey => {
        const dayCell = document.querySelector(`.calendar-day[data-date="${dateKey}"]`);
        if (!dayCell) return;

        const tasksContainer = dayCell.querySelector(".day-tasks");
        if (!tasksContainer) return;

        const dayTasks = tasksByDate[dateKey];
        const visibleTasks = dayTasks.slice(0, maxVisibleTasks);
        const overflowCount = dayTasks.length - maxVisibleTasks;

        visibleTasks.forEach(task => {
            const badge = document.createElement("div");
            const priorityClass = task.priority ? `priority-${task.priority.toLowerCase()}` : "priority-medium";
            
            // Hour 4: Overdue calculation
            const isOverdue = !task.completed && dateKey < todayStr;
            const overdueClass = isOverdue ? "overdue" : "";

            badge.className = `calendar-task-badge ${priorityClass} ${task.completed ? "completed" : ""} ${overdueClass}`;
            
            // Hour 3 & 4: Exact time handling
            const timeDisplay = task.due_time ? ` (${task.due_time})` : "";
            badge.textContent = `${task.title}${timeDisplay}`;

            badge.addEventListener("click", (e) => {
                e.stopPropagation();
                openCalendarTaskModal(task);
            });

            tasksContainer.appendChild(badge);
        });

        // Hour 4: Crowded dates handle (+X more)
        if (overflowCount > 0) {
            const moreBadge = document.createElement("div");
            moreBadge.className = "more-tasks-indicator";
            moreBadge.textContent = `+${overflowCount} more`;
            tasksContainer.appendChild(moreBadge);
        }
    });

    // Hour 5: Empty state handling
    const grid = document.getElementById("calendarGrid");
    const hasAnyBadges = grid?.querySelector(".calendar-task-badge");
    let emptyNotice = document.getElementById("calendarEmptyNotice");

    if (!hasAnyBadges) {
        if (!emptyNotice && grid) {
            emptyNotice = document.createElement("div");
            emptyNotice.id = "calendarEmptyNotice";
            emptyNotice.className = "calendar-empty-notice";
            emptyNotice.textContent = "No tasks scheduled for this period.";
            grid.parentElement.appendChild(emptyNotice);
        }
    } else if (emptyNotice) {
        emptyNotice.remove();
    }
}

function openCalendarTaskModal(task) {
    selectedTask = task;
    
    const setElementText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    const timeDisplay = task.due_time ? ` at ${task.due_time}` : "";

    setElementText("calModalTitle", task.title || "Untitled Task");
    setElementText("calModalSubject", task.subject || "N/A");
    setElementText("calModalDueDate", `${task.due_date || "No Date"}${timeDisplay}`);
    setElementText("calModalPriority", task.priority || "Medium");
    setElementText("calModalEst", task.estimated_minutes || 30);
    setElementText("calModalStatus", task.completed ? "Completed" : "Pending");

    const modal = document.getElementById("calendarTaskModal");
    if (modal) modal.style.display = "flex";
}

function closeCalendarModal() {
    const modal = document.getElementById("calendarTaskModal");
    if (modal) modal.style.display = "none";
}
