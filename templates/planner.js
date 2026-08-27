document.addEventListener("DOMContentLoaded", function () {
    renderCalendar(currentYear, currentMonth);

    // Navigation Controls
    document.getElementById("prevMonthBtn")?.addEventListener("click", () => {
        currentMonth--;
        if (currentMonth < 1) {
            currentMonth = 12;
            currentYear--;
        }
        renderCalendar(currentYear, currentMonth);
    });

    document.getElementById("nextMonthBtn")?.addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
        }
        renderCalendar(currentYear, currentMonth);
    });

    document.getElementById("todayBtn")?.addEventListener("click", () => {
        const today = new Date();
        currentYear = today.getFullYear();
        currentMonth = today.getMonth() + 1;
        renderCalendar(currentYear, currentMonth);
    });
});

function renderCalendar(year, month) {
    const grid = document.getElementById("calendarGrid");
    const display = document.getElementById("currentMonthYearDisplay");
    if (!grid) return;

    grid.innerHTML = ""; // Clear existing grid

    const monthNames = ["January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"];
    
    if (display) {
        display.textContent = `${monthNames[month - 1]} ${year}`;
    }

    // Days calculation
    const firstDayIndex = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    // Render empty padding slots for previous month
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.classList.add("calendar-day", "empty");
        grid.appendChild(emptyCell);
    }

    // Render actual days of current month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement("div");
        dayCell.classList.add("calendar-day");
        
        // Format ISO Date string: YYYY-MM-DD
        const monthStr = String(month).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateISO = `${year}-${monthStr}-${dayStr}`;

        if (dateISO === serverToday) {
            dayCell.classList.add("today");
        }

        dayCell.innerHTML = `<span class="day-number">${day}</span><div class="day-tasks"></div>`;
        
        // Render tasks associated with this date
        const dayTasksContainer = dayCell.querySelector(".day-tasks");
        const matchingTasks = rawTasksData.filter(task => task.due_date === dateISO);

        matchingTasks.forEach(task => {
            const taskBadge = document.createElement("div");
            taskBadge.classList.add("calendar-task-badge", `priority-${task.priority}`);
            taskBadge.textContent = task.title;
            taskBadge.setAttribute("data-task-id", task.id);
            dayTasksContainer.appendChild(taskBadge);
        });

        grid.appendChild(dayCell);
    }
}
