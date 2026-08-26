// =========================
// 1. STATE & DATA
// =========================
let editingTaskId = null;

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
}

// Close modal when clicking background overlay
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
        if (result.success) {
            window.location.reload();
        } else {
            alert(result.error || "Failed to update task.");
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
        if (result.success) {
            window.location.reload();
        } else {
            alert(result.error || "Failed to delete task.");
        }
    } catch (err) {
        console.error("Error deleting task:", err);
    }
}

function editTask(id, title, subject, minutes, priority, dueDate) {
    document.getElementById("modalTaskName").value = title || "";
    document.getElementById("modalSubject").value = subject || "";
    document.getElementById("modalEstMinutes").value = minutes || 30;
    document.getElementById("modalPriority").value = priority || "Medium";
    
    const dueInput = document.getElementById("modalDueDate");
    if (dueInput) dueInput.value = dueDate || "";

    editingTaskId = id;
    openModal();
}

// =========================
// 4. INITIALIZATION & FORM SUBMIT
// =========================
document.addEventListener("DOMContentLoaded", function() {
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
});

// =========================
// SEARCH & FILTER LOGIC
// =========================
let currentFilter = "all";

function applyFilters() {
    const searchInput = document.getElementById("searchInput");
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const taskCards = document.querySelectorAll(".task-card");

    taskCards.forEach(card => {
        // Read dataset attributes or fallback to card content text
        const title = (card.querySelector(".task-title")?.textContent || "").toLowerCase();
        const subject = (card.querySelector(".task-subject")?.textContent || "").toLowerCase();
        const priority = (card.dataset.priority || "").toLowerCase();
        const isCompleted = card.dataset.completed === "1" || card.classList.contains("completed");
// Inside applyFilters() in planner_3.js
const title = (card.querySelector(".task-title")?.textContent || "").toLowerCase();
const subject = (card.querySelector(".task-subject")?.textContent || "").toLowerCase();
const dateMeta = (card.querySelector(".task-meta")?.textContent || "").toLowerCase();

// Matches query against title, subject, or date text
const matchesSearch = title.includes(query) || subject.includes(query) || dateMeta.includes(query);
        // 1. Check Search Match
        const matchesSearch = title.includes(query) || subject.includes(query);

        // 2. Check Category/Priority Filter Match
        let matchesFilter = true;
        if (currentFilter === "completed") {
            matchesFilter = isCompleted;
        } else if (currentFilter === "pending") {
            matchesFilter = !isCompleted;
        } else if (["high", "medium", "low"].includes(currentFilter)) {
            matchesFilter = priority === currentFilter;
        }

        // Show or hide card
        if (matchesSearch && matchesFilter) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}


// Bind event handlers once the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    // 1. Search Bar Input Event
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", applyFilters);
    }

    // 2. Filter Buttons Click Event
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach(btn => {
        btn.addEventListener("click", function() {
            // Toggle active visual state
            filterButtons.forEach(b => b.classList.remove("active"));
            this.classList.add("active");

            // Extract target filter (e.g. data-filter="high" or textContent fallback)
            currentFilter = (this.dataset.filter || this.textContent).toLowerCase().trim();
            applyFilters();
        });
    });
});

// =========================
// SIDEBAR INTERACTION LOGIC
// =========================
const sidebarLinks = document.querySelectorAll(".sidebar nav a, .sidebar .nav-item");
const sidebarToggleBtn = document.getElementById("sidebarToggle") || document.querySelector(".sidebar-toggle");
const sidebar = document.querySelector(".sidebar");

// 1. Mobile Sidebar Toggle
if (sidebarToggleBtn && sidebar) {
    sidebarToggleBtn.addEventListener("click", function() {
        sidebar.classList.toggle("open");
    });
}

// 2. Active Link Switching & Navigation Handling
sidebarLinks.forEach(link => {
    link.addEventListener("click", function(event) {
        // Remove active class from all links
        sidebarLinks.forEach(item => item.classList.remove("active"));
        this.classList.add("active");

        // If link has a data-filter attribute, apply it directly to tasks
        const filterType = this.dataset.filter;
        if (filterType && typeof applyFilters === "function") {
            currentFilter = filterType;
            applyFilters();
        }

        // Close mobile sidebar automatically after clicking a menu item
        if (sidebar && sidebar.classList.contains("open")) {
            sidebar.classList.remove("open");
        }
    });
});
