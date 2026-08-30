// Consolidated and fixed calendar.js
// - Removed duplicate declarations and duplicate blocks.
// - Single initialization on DOMContentLoaded.
// - Safer event binding with optional chaining and existence checks.
// - Filter handling, overdue badges, time display, overflow "+X more" indicator,
//   empty-state handling, and month/week/day views preserved.

// Global state
let currentView = "month"; // 'month' | 'week' | 'day'
let currentDate = new Date();
let selectedTask = null;
let currentFilter = "all"; // 'all', 'incomplete', 'completed', 'high'

// Helpers
const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function safeGetById(id) {
    return document.getElementById(id) || null;
}

function setTextIfExists(id, text) {
    const el = safeGetById(id);
    if (el) el.textContent = text;
}

// Main initialization
document.addEventListener("DOMContentLoaded", function () {
    // Sync currentDate with server-provided date if available
    if (typeof serverToday !== "undefined" && serverToday) {
        const parsedDate = new Date(serverToday + "T00:00:00");
        if (!isNaN(parsedDate.getTime())) {
            currentDate = parsedDate;
        }
    } else if (typeof currentYear !== "undefined" && typeof currentMonth !== "undefined") {
        // currentMonth is expected 1-based in some templates
        currentDate = new Date(currentYear, currentMonth - 1, 1);
    }

    updateCalendarView();

    // Modal Actions
    safeGetById("calToggleBtn")?.addEventListener("click", async () => {
        if (!selectedTask) return;
        if (typeof completeTask === "function") {
            await completeTask(selectedTask.id);
            closeCalendarModal();
            updateCalendarView();
        }
    });

    safeGetById("calDeleteBtn")?.addEventListener("click", async () => {
        if (!selectedTask) return;
        if (typeof deleteTask === "function") {
            await deleteTask(selectedTask.id);
            closeCalendarModal();
            updateCalendarView();
        }
    });

    safeGetById("calEditBtn")?.addEventListener("click", () => {
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

    // Navigation
    safeGetById("prevMonthBtn")?.addEventListener("click", () => {
        if (currentView === "month") currentDate.setMonth(currentDate.getMonth() - 1);
        else if (currentView === "week") currentDate.setDate(currentDate.getDate() - 7);
        else if (currentView === "day") currentDate.setDate(currentDate.getDate() - 1);
        updateCalendarView();
    });

    safeGetById("nextMonthBtn")?.addEventListener("click", () => {
        if (currentView === "month") currentDate.setMonth(currentDate.getMonth() + 1);
        else if (currentView === "week") currentDate.setDate(currentDate.getDate() + 7);
        else if (currentView === "day") currentDate.setDate(currentDate.getDate() + 1);
        updateCalendarView();
    });

    safeGetById("todayBtn")?.addEventListener("click", () => {
        currentDate = new Date();
        updateCalendarView();
    });

    // View switching
    document.querySelectorAll(".view-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".view-btn").forEach((b) => b.classList.remove("active"));
            const target = e.currentTarget;
            target.classList.add("active");
            currentView = target.dataset.view || "month";
            updateCalendarView();
        });
    });

    // Filter buttons (optional)
    document.querySelectorAll(".filter-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
            const target = e.currentTarget;
            target.classList.add("active");
            currentFilter = target.dataset.filter || "all";
            renderCalendarTasks();
        });
    });

    // Close calendar modal when clicking outside (optional UX)
    document.addEventListener("click", (e) => {
        const modal = safeGetById("calendarTaskModal");
        if (!modal) return;
        if (modal.style.display === "flex") {
            // if clicked outside modal content, close
            const content = modal.querySelector(".modal-content");
            if (content && !content.contains(e.target)) {
                closeCalendarModal();
            }
        }
    });
});

// Update view header and render grid
function updateCalendarView() {
    const monthYearDisplay = safeGetById("currentMonthYearDisplay");
    if (monthYearDisplay) {
        monthYearDisplay.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }

    if (currentView === "month") renderMonthGrid();
    else if (currentView === "week") renderWeekGrid();
    else if (currentView === "day") renderDayGrid();
}

function renderMonthGrid() {
    const grid = safeGetById("calendarGrid");
    if (!grid) return;

    grid.className = "calendar-grid view-month";
    grid.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // padding empty days
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
    const grid = safeGetById("calendarGrid");
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
    const grid = safeGetById("calendarGrid");
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

    // Apply filter
    const filteredTasks = rawTasks.filter(task => {
        if (currentFilter === "incomplete") return !task.completed;
        if (currentFilter === "completed") return task.completed;
        if (currentFilter === "high") return (task.priority || "").toLowerCase() === "high";
        return true;
    });

    // Group tasks by date
    const tasksByDate = {};
    filteredTasks.forEach(task => {
        if (!task.due_date) return;
        const dateKey = task.due_date.split("T")[0];
        if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
        tasksByDate[dateKey].push(task);
    });

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const maxVisibleTasks = 3;

    Object.keys(tasksByDate).forEach(dateKey => {
        const dayCell = document.querySelector(`.calendar-day[data-date="${dateKey}"]`);
        if (!dayCell) return;

        const tasksContainer = dayCell.querySelector(".day-tasks");
        if (!tasksContainer) return;

        const dayTasks = tasksByDate[dateKey];
        const visibleTasks = dayTasks.slice(0, maxVisibleTasks);
        const overflowCount = Math.max(0, dayTasks.length - maxVisibleTasks);

        visibleTasks.forEach(task => {
            const badge = document.createElement("div");
            const priorityClass = task.priority ? `priority-${task.priority.toLowerCase()}` : "priority-medium";

            // Overdue calculation (string compare works for YYYY-MM-DD)
            const isOverdue = !task.completed && dateKey < todayStr;
            const overdueClass = isOverdue ? "overdue" : "";

            badge.className = `calendar-task-badge ${priorityClass} ${task.completed ? "completed" : ""} ${overdueClass}`.trim();

            const timeDisplay = task.due_time ? ` (${task.due_time})` : "";
            badge.textContent = `${task.title || "Untitled"}${timeDisplay}`;

            badge.addEventListener("click", (e) => {
                e.stopPropagation();
                openCalendarTaskModal(task);
            });

            tasksContainer.appendChild(badge);
        });

        if (overflowCount > 0) {
            const moreBadge = document.createElement("div");
            moreBadge.className = "more-tasks-indicator";
            moreBadge.textContent = `+${overflowCount} more`;
            // click to open modal for that date (optional) - show list in modal could be added
            moreBadge.addEventListener("click", (e) => {
                e.stopPropagation();
                // open a simple modal listing - for now we open the calendar modal with first overflow task
                const firstOverflow = dayTasks[maxVisibleTasks];
                if (firstOverflow) openCalendarTaskModal(firstOverflow);
            });
            tasksContainer.appendChild(moreBadge);
        }
    });

    // Empty state handling
    const grid = safeGetById("calendarGrid");
    const hasAnyBadges = !!grid?.querySelector(".calendar-task-badge");
    let emptyNotice = safeGetById("calendarEmptyNotice");

    if (!hasAnyBadges) {
        if (!emptyNotice && grid && grid.parentElement) {
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

    const timeDisplay = task.due_time ? ` at ${task.due_time}` : "";

    setTextIfExists("calModalTitle", task.title || "Untitled Task");
    setTextIfExists("calModalSubject", task.subject || "N/A");
    setTextIfExists("calModalDueDate", `${task.due_date || "No Date"}${timeDisplay}`);
    setTextIfExists("calModalPriority", task.priority || "Medium");
    setTextIfExists("calModalEst", task.estimated_minutes || 30);
    setTextIfExists("calModalStatus", task.completed ? "Completed" : "Pending");

    const modal = safeGetById("calendarTaskModal");
    if (modal) modal.style.display = "flex";
}

function closeCalendarModal() {
    const modal = safeGetById("calendarTaskModal");
    if (modal) modal.style.display = "none";
}
