let currentView = "month"; // "month" | "week" | "day"
let currentDate = new Date(currentYear, currentMonth - 1, 1);

document.addEventListener("DOMContentLoaded", function () {
    // Initial Render
    updateCalendarView();

    // View Switching Listeners
    const viewBtns = document.querySelectorAll(".view-btn");
    viewBtns.forEach(btn => {
        btn.addEventListener("click", function () {
            viewBtns.forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            currentView = this.dataset.view;
            updateCalendarView();
        });
    });

    // Navigation Controls
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
});

function updateCalendarView() {
    const grid = document.getElementById("calendarGrid");
    const display = document.getElementById("currentMonthYearDisplay");
    if (!grid) return;

    grid.innerHTML = "";
    grid.className = `calendar-grid view-${currentView}`;

    if (currentView === "month") {
        renderMonthView(grid, display);
    } else if (currentView === "week") {
        renderWeekView(grid, display);
    } else if (currentView === "day") {
        renderDayView(grid, display);
    }
}

// Helper: Format JS Date to YYYY-MM-DD
function formatDateISO(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 1. MONTH VIEW
function renderMonthView(grid, display) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"];
    
    if (display) display.textContent = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Previous month padding
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.classList.add("calendar-day", "empty");
        grid.appendChild(emptyCell);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(year, month, day);
        const dateISO = formatDateISO(dayDate);
        
        const dayCell = createDayCell(day, dateISO);
        grid.appendChild(dayCell);
    }
}

// 2. WEEK VIEW
function renderWeekView(grid, display) {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    if (display) {
        display.textContent = `${startOfWeek.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        const dateISO = formatDateISO(dayDate);

        const dayCell = createDayCell(dayDate.getDate(), dateISO, true);
        grid.appendChild(dayCell);
    }
}

// 3. DAY VIEW
function renderDayView(grid, display) {
    const dateISO = formatDateISO(currentDate);

    if (display) {
        display.textContent = currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }

    const dayCell = createDayCell(currentDate.getDate(), dateISO, true);
    dayCell.classList.add("single-day-view");
    grid.appendChild(dayCell);
}

// Reusable Cell Creator
function createDayCell(dayNumber, dateISO, showWeekdayLabel = false) {
    const dayCell = document.createElement("div");
    dayCell.classList.add("calendar-day");
    if (dateISO === serverToday) dayCell.classList.add("today");

    let headerHTML = `<span class="day-number">${dayNumber}</span>`;
    if (showWeekdayLabel) {
        const d = new Date(dateISO + "T00:00:00");
        const weekday = d.toLocaleDateString('default', { weekday: 'short' });
        headerHTML = `<span class="weekday-label">${weekday}</span> ` + headerHTML;
    }

    dayCell.innerHTML = `<div class="day-header">${headerHTML}</div><div class="day-tasks"></div>`;

    const tasksContainer = dayCell.querySelector(".day-tasks");
    const matchingTasks = rawTasksData.filter(t => t.due_date === dateISO);

    matchingTasks.forEach(task => {
        const taskBadge = document.createElement("div");
        taskBadge.classList.add("calendar-task-badge", `priority-${(task.priority || 'medium').toLowerCase()}`);
        if (task.completed) taskBadge.classList.add("completed");
        
        taskBadge.textContent = task.title;
        taskBadge.setAttribute("data-task-id", task.id);
        tasksContainer.appendChild(taskBadge);
    });

    return dayCell;
}
