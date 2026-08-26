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
                alert("Task name and subject cannot be empty or just spaces.");
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

                if (result.status === 'success' || result.success) {
                    closeModal();
                    window.location.reload();
                } else {
                    alert(result.message || result.error || "Failed to save task.");
                }
            } catch (err) {
                console.error("Error submitting task form:", err);
            }
        });
    }
});
