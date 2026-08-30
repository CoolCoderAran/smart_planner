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
