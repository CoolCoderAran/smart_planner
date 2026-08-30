document.addEventListener("DOMContentLoaded", () => {
  let currentDate = new Date();

  const monthYearElement = document.getElementById("currentMonthYear");
  const calendarGrid = document.getElementById("calendarGrid");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const todayBtn = document.getElementById("todayBtn");

  function renderCalendar() {
    if (!calendarGrid) return;
    calendarGrid.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Set header text
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    if (monthYearElement) {
      monthYearElement.textContent = `${monthNames[month]} ${year}`;
    }

    // Get date bounds
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Render previous month padding days
    for (let x = firstDayIndex; x > 0; x--) {
      const dayCell = document.createElement("div");
      dayCell.classList.add("calendar-day-cell", "other-month");
      dayCell.innerHTML = `<span class="day-number">${prevMonthDays - x + 1}</span>`;
      calendarGrid.appendChild(dayCell);
    }

    // Render current month days
    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
      const dayCell = document.createElement("div");
      dayCell.classList.add("calendar-day-cell");

      if (
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear()
      ) {
        dayCell.classList.add("today");
      }

      dayCell.innerHTML = `<span class="day-number">${day}</span>`;
      calendarGrid.appendChild(dayCell);
    }

    // Render next month padding days to complete grid row balance
    const totalCells = calendarGrid.children.length;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      const dayCell = document.createElement("div");
      dayCell.classList.add("calendar-day-cell", "other-month");
      dayCell.innerHTML = `<span class="day-number">${i}</span>`;
      calendarGrid.appendChild(dayCell);
    }
  }

  // Event Handlers
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener("click", () => {
      currentDate = new Date();
      renderCalendar();
    });
  }

  // Initial Run
  renderCalendar();
});
