   function toggleSidebar() {
            const sidebar = document.getElementById("sidebar");
            const mainContent = document.getElementById("mainContent");
            
            // Toggle the 'active' class on the sidebar
            sidebar.classList.toggle("active");
            
            // Optional: Toggle 'shifted' class to push main content
            mainContent.classList.toggle("shifted");
        }
