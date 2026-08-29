let currentView = "month"; // "month" | "week" | "day"
let currentDate = new Date(currentYear, currentMonth - 1, 1);

document.addEventListener("DOMContentLoaded", function () {
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

function formatDateISO(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Render Month
function renderMonthView(grid, display) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"];
    
    if (display) display.textContent = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.classList.add("calendar-day", "empty");
        grid.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(year, month, day);
        const dateISO = formatDateISO(dayDate);
        grid.appendChild(createDayCell(day, dateISO));
    }
}

// Render Week
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
        grid.appendChild(createDayCell(dayDate.getDate(), formatDateISO(dayDate), true));
    }
}

// Render Day
function renderDayView(grid, display) {
    const dateISO = formatDateISO(currentDate);
    if (display) {
        display.textContent = currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }

    const dayCell = createDayCell(currentDate.getDate(), dateISO, true);
    dayCell.classList.add("single-day-view");
    grid.appendChild(dayCell);
}

// Reusable Cell Creator with Workload Indicators & Interactive Task Badges
function createDayCell(dayNumber, dateISO, showWeekdayLabel = false) {
    const dayCell = document.createElement("div");
    dayCell.classList.add("calendar-day");
    dayCell.setAttribute("data-date", dateISO); // Fix: Add date attribute
    if (dateISO === serverToday) dayCell.classList.add("today");

    let headerHTML = `<span class="day-number">${dayNumber}</span>`;
    if (showWeekdayLabel) {
        const d = new Date(dateISO + "T00:00:00");
        const weekday = d.toLocaleDateString('default', { weekday: 'short' });
        headerHTML = `<span class="weekday-label">${weekday}</span> ` + headerHTML;
    }

    const matchingTasks = rawTasksData.filter(t => t.due_date === dateISO);
    const pendingTasks = matchingTasks.filter(t => !t.completed);
    const totalMinutes = pendingTasks.reduce((acc, t) => acc + (parseInt(t.estimated_minutes) || 0), 0);

    let workloadHTML = "";
    if (totalMinutes > 0) {
        const loadClass = totalMinutes > 120 ? "heavy" : (totalMinutes > 60 ? "moderate" : "light");
        workloadHTML = `<span class="workload-tag ${loadClass}">${totalMinutes}m</span>`;
    }

    dayCell.innerHTML = `
        <div class="day-header">
            ${headerHTML}
            ${workloadHTML}
        </div>
        <div class="day-tasks calendar-day-tasks"></div>
    `;

    const tasksContainer = dayCell.querySelector(".day-tasks");

    matchingTasks.forEach(task => {
        const taskBadge = document.createElement("div");
        const isOverdue = !task.completed && dateISO < serverToday;
        
        taskBadge.className = `calendar-task-badge priority-${(task.priority || 'medium').toLowerCase()}`;
        if (task.completed) taskBadge.classList.add("completed");
        if (isOverdue) taskBadge.classList.add("overdue");

        taskBadge.innerHTML = `
            <span class="badge-title">${isOverdue ? '⚠️ ' : ''}${task.title}</span>
            <span class="badge-time">${task.estimated_minutes}m</span>
        `;
        
        // Fix: Open the calendar task details modal on click
        taskBadge.addEventListener("click", (e) => {
            e.stopPropagation();
            openCalendarTaskModal(task);
        });

        tasksContainer.appendChild(taskBadge);
    });

    return dayCell;
}

function renderCalendarTasks() {
    // Clear out existing task elements from calendar cells
    document.querySelectorAll('.calendar-day-tasks').forEach(el => el.innerHTML = '');

    // Map tasks by date
    rawTasksData.forEach(task => {
        if (!task.due_date) return;
        
        // Ensure format is YYYY-MM-DD
        const taskDateStr = task.due_date.split('T')[0]; 
        
        // Find cell matching this date (e.g., <div data-date="2026-08-28">)
        const dayCell = document.querySelector(`.calendar-day[data-date="${taskDateStr}"] .calendar-day-tasks`);
        
        if (dayCell) {
            // Check overflow (+X more)
            if (dayCell.children.length >= 3) {
                let badge = dayCell.querySelector('.more-tasks-badge');
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'more-tasks-badge';
                    dayCell.appendChild(badge);
                }
                const count = dayCell.querySelectorAll('.calendar-task-card').length - 2;
                badge.textContent = `+${count + 1} more`;
                return;
            }

            const card = document.createElement('div');
            card.className = `calendar-task-card priority-${(task.priority || 'medium').toLowerCase()} ${task.completed ? 'completed' : ''}`;
            card.textContent = task.title;
            card.onclick = (e) => {
                e.stopPropagation();
                openCalendarTaskModal(task);
            };

            dayCell.appendChild(card);
        }
    });
}
