// =========================
// 1. STATE & DATA
// =========================
let editingTaskId = null;
let currentFilter = "all";

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
    editingTaskId = null;
    const taskIdEl = document.getElementById("modalTaskId");
    if (taskIdEl) taskIdEl.value = "";
    
    const headerTitle = document.getElementById("modalHeaderTitle");
    if (headerTitle) headerTitle.textContent = "Add New Task";
}

window.addEventListener("click", function(event) {
    const modal = document.getElementById("taskModal");
    if (event.target === modal) {
        closeModal();
    }
});

function getPriorityIcon(priority) {
    const lowerPrio = (priority || "").toLowerCase();
    if (lowerPrio === "high") return "🔴";
    if (lowerPrio === "medium") return "🟡";
    return "🟢";
}

// =========================
// 3. TASK API & ACTIONS
// =========================
async function completeTask(id) {
    try {
        const response = await fetch(`/planner/toggle/${id}`, {
            method: 'POST'
        });
        const result = await response.json();
        if (result.success || result.status === 'success') {
            window.location.reload();
        } else {
            alert(result.error || result.message || "Failed to update task.");
        }
    } catch (err) {
        console.error("Error toggling task:", err);
    }
}

async function deleteTask(id) {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
        const response = await fetch(`/planner/delete/${id}`, {
            method: 'POST'
        });
        const result = await response.json();
        if (result.success || result.status === 'success') {
            window.location.reload();
        } else {
            alert(result.error || result.message || "Failed to delete task.");
        }
    } catch (err) {
        console.error("Error deleting task:", err);
    }
}

function editTask(id, title, subject, minutes, priority, dueDate) {
    document.getElementById("modalTaskId").value = id || "";
    document.getElementById("modalTaskName").value = title || "";
    document.getElementById("modalSubject").value = subject || "";
    document.getElementById("modalEstMinutes").value = minutes || 30;
    document.getElementById("modalPriority").value = priority || "Medium";
    
    const dueInput = document.getElementById("modalDueDate");
    if (dueInput) dueInput.value = dueDate || "";

    const headerTitle = document.getElementById("modalHeaderTitle");
    if (headerTitle) headerTitle.textContent = "Edit Task";

    editingTaskId = id;
    openModal();
}

// =========================
// 4. SEARCH & FILTER LOGIC
// =========================
function applyFilters() {
    const searchInput = document.getElementById("search");
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const taskCards = document.querySelectorAll(".task-card");
    const taskSections = document.querySelectorAll(".task-section");

    taskCards.forEach(card => {
        const title = (card.querySelector(".task-title")?.textContent || "").toLowerCase();
        const subject = (card.querySelector(".task-subject")?.textContent || "").toLowerCase();
        const dateMeta = (card.querySelector(".task-meta")?.textContent || "").toLowerCase();
        const isCompleted = card.dataset.completed === "true" || card.classList.contains("completed");
        const category = card.dataset.category;
        const priority = (card.dataset.priority || "").toLowerCase();

        const matchesSearch = title.includes(query) || subject.includes(query) || dateMeta.includes(query);

        let matchesFilter = true;
        if (currentFilter === "today") {
            matchesFilter = (category === "today");
        } else if (currentFilter === "upcoming") {
            matchesFilter = (category === "upcoming");
        } else if (currentFilter === "completed") {
            matchesFilter = isCompleted;
        } else if (["high", "medium", "low"].includes(currentFilter)) {
            matchesFilter = priority === currentFilter;
        }

        card.style.display = (matchesSearch && matchesFilter) ? "flex" : "none";
    });

    taskSections.forEach(section => {
        const sectionCategory = section.dataset.section;
        if (currentFilter === "all" || ["high", "medium", "low"].includes(currentFilter)) {
            section.style.display = "block";
        } else if (currentFilter === sectionCategory) {
            section.style.display = "block";
        } else {
            section.style.display = "none";
        }
    });
}

// =========================
// 5. INITIALIZATION & LISTENERS
// =========================
document.addEventListener("DOMContentLoaded", function() {
    const currentDateElem = document.getElementById("current-date");
    if (currentDateElem) {
        currentDateElem.textContent = new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    const form = document.getElementById("addTaskForm");
    if (form) {
        form.addEventListener("submit", async function(event) {
            event.preventDefault();

            const title = document.getElementById("modalTaskName").value.trim();
            const subject = document.getElementById("modalSubject").value.trim();
            const minutes = document.getElementById("modalEstMinutes").value;
            const priority = document.getElementById("modalPriority").value;
            const dueDate = document.getElementById("modalDueDate")?.value || "";

            if (!title || !subject) {
                alert("Task name and subject cannot be empty.");
                return;
            }

            const formData = new FormData();
            formData.append("title", title);
            formData.append("subject", subject);
            formData.append("estimated_minutes", minutes);
            formData.append("priority", priority);
            formData.append("due_date", dueDate);

            const endpoint = editingTaskId 
                ? `/planner/update/${editingTaskId}` 
                : '/planner/add';

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (response.ok && (result.status === 'success' || result.success)) {
                    closeModal();
                    window.location.reload();
                } else {
                    alert(result.message || result.error || "Failed to save task.");
                }
            } catch (err) {
                console.error("Submission error:", err);
                alert("Network error: Could not reach server.");
            }
        });
    }

    const searchInput = document.getElementById("search");
    if (searchInput) {
        searchInput.addEventListener("input", applyFilters);
    }

    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach(btn => {
        btn.addEventListener("click", function() {
            filterButtons.forEach(b => b.classList.remove("active"));
            this.classList.add("active");

            currentFilter = (this.dataset.filter || this.textContent).toLowerCase().trim();
            
            document.querySelectorAll(".sidebar-filter-link").forEach(link => {
                link.classList.toggle("active", link.dataset.filter === currentFilter);
            });

            applyFilters();
        });
    });

    const sidebarLinks = document.querySelectorAll(".sidebar-filter-link");
    sidebarLinks.forEach(link => {
        link.addEventListener("click", function(event) {
            sidebarLinks.forEach(item => item.classList.remove("active"));
            this.classList.add("active");

            const filterType = this.dataset.filter;
            if (filterType) {
                currentFilter = filterType;
                
                document.querySelectorAll(".filter-btn").forEach(btn => {
                    btn.classList.toggle("active", btn.dataset.filter === currentFilter);
                });

                applyFilters();
            }

            const sidebar = document.getElementById("sidebar");
            if (sidebar && sidebar.classList.contains("open")) {
                toggleSidebar();
            }
        });
    });
});

// Fix 21: Parse date string directly as local YYYY-MM-DD to avoid timezone shifting
function parseLocalDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

// Fix 23: Format and render deadline times on calendar task elements
function formatTaskTime(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHour = h % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
}

// Fix 24 & 25: Calendar-to-Planner bi-directional synchronization via fetch API
async function toggleCalendarTask(taskId) {
    const res = await fetch(`/planner/toggle/${taskId}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
        window.location.reload();
    } else {
        alert(data.error || 'Failed to toggle task completion.');
    }
}

async function deleteCalendarTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const res = await fetch(`/planner/delete/${taskId}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
        window.location.reload();
    } else {
        alert(data.error || 'Failed to delete task.');
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Set current date string
    const dateDisplay = document.getElementById("current-date");
    if (dateDisplay) {
        const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        dateDisplay.textContent = new Date().toLocaleDateString(undefined, options);
    }

    // Attach search event
    const searchInput = document.getElementById("search");
    if (searchInput) {
        searchInput.addEventListener("input", filterTasks);
    }

    // Attach filter tab events
    document.querySelectorAll(".filter-btn, .sidebar-filter-link").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const filter = e.currentTarget.dataset.filter;
            setActiveFilter(filter);
        });
    });

    // Close modal on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeModal();
            const sidebar = document.getElementById("sidebar");
            if (sidebar && sidebar.classList.contains("open")) {
                toggleSidebar();
            }
        }
    });
});

/* SIDEBAR TOGGLE */
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    if (sidebar && overlay) {
        sidebar.classList.toggle("open");
        overlay.classList.toggle("active");
    }
}

/* MODAL CONTROLS */
function openModal() {
    const modal = document.getElementById("taskModal");
    const form = document.getElementById("addTaskForm");
    const headerTitle = document.getElementById("modalHeaderTitle");
    
    if (form) form.reset();
    document.getElementById("modalTaskId").value = "";
    if (headerTitle) headerTitle.textContent = "Add New Task";
    
    if (modal) modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("taskModal");
    if (modal) modal.style.display = "none";
}

function editTask(id, title, subject, estMinutes, priority, dueDate) {
    openModal();
    document.getElementById("modalHeaderTitle").textContent = "Edit Task";
    document.getElementById("modalTaskId").value = id;
    document.getElementById("modalTaskName").value = title;
    document.getElementById("modalSubject").value = subject;
    document.getElementById("modalEstMinutes").value = estMinutes;
    document.getElementById("modalPriority").value = priority;
    document.getElementById("modalDueDate").value = dueDate || "";
}

/* TASK ACTIONS (ASYNC CALLS) */
async function completeTask(taskId) {
    try {
        const response = await fetch(`/planner/toggle/${taskId}`, { method: 'POST' });
        if (response.ok) {
            window.location.reload();
        }
    } catch (err) {
        console.error("Failed to toggle task:", err);
    }
}

async function deleteTask(taskId) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
        const response = await fetch(`/planner/delete/${taskId}`, { method: 'POST' });
        if (response.ok) {
            window.location.reload();
        }
    } catch (err) {
        console.error("Failed to delete task:", err);
    }
}

/* FILTER & SEARCH LOGIC */
function setActiveFilter(filter) {
    document.querySelectorAll(".filter-btn, .sidebar-filter-link").forEach(el => {
        el.classList.toggle("active", el.dataset.filter === filter);
    });

    const sections = document.querySelectorAll(".task-section");
    sections.forEach(section => {
        const secName = section.dataset.section;
        if (filter === "all") {
            section.style.display = "block";
        } else {
            section.style.display = (secName === filter) ? "block" : "none";
        }
    });
}

function filterTasks() {
    const query = document.getElementById("search").value.toLowerCase();
    const cards = document.querySelectorAll(".task-card");

    cards.forEach(card => {
        const title = card.querySelector(".task-title").textContent.toLowerCase();
        const subject = card.querySelector(".task-subject").textContent.toLowerCase();
        
        if (title.includes(query) || subject.includes(query)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}
