document.addEventListener('DOMContentLoaded', () => {
    loadDrivers();
    setupGlobalUI(); // Ensures sidebar works

    const form = document.getElementById('add-driver-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('driver-name').value;
            const email = document.getElementById('driver-email').value;
            const password = document.getElementById('driver-pass').value;

            try {
                const response = await fetch('api/admin/add_drivers.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                const result = await response.json();

                if (result.success) {
                    alert("Driver Created!");
                    form.reset();
                    loadDrivers(); // Refresh list immediately
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error(error);
            }
        });
    }
});

async function loadDrivers() {
    const list = document.getElementById('drivers-list');
    try {
        const response = await fetch('api/admin/get_drivers.php');
        const json = await response.json();

        list.innerHTML = ''; // Clear loading text

        if (json.success && json.data.length > 0) {
            json.data.forEach(driver => {
                const item = document.createElement('div');
                item.className = 'history-item'; 
                item.id = `driver-card-${driver.id}`; // Add ID for deletion
                
                item.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <div style="display:flex; align-items:center; gap: 15px;">
                            <i class="fas fa-user-tie" style="color:#E02B2B; font-size:24px;"></i>
                            <div>
                                <h4 style="margin:0;">${driver.name}</h4>
                                <p style="font-size:12px; color:#666; margin:0;">${driver.email}</p>
                            </div>
                        </div>
                        
                        <button onclick="deleteDriver(${driver.id})" style="background:none; border:none; cursor:pointer;">
                            <i class="fas fa-trash-alt" style="color:#888; transition:color 0.2s;" onmouseover="this.style.color='#E02B2B'" onmouseout="this.style.color='#888'"></i>
                        </button>
                    </div>
                `;
                list.appendChild(item);
            });
        } else {
            list.innerHTML = '<p style="text-align:center; color:#999;">No drivers found.</p>';
        }
    } catch (error) {
        console.error('Error loading drivers:', error);
    }
}

// --- NEW: Delete Driver Function ---
async function deleteDriver(id) {
    if(!confirm("Are you sure you want to delete this driver? They will no longer be able to log in.")) return;

    try {
        const response = await fetch('api/admin/delete_drivers.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        const result = await response.json();

        if (result.success) {
            // Remove from UI
            const el = document.getElementById(`driver-card-${id}`);
            if(el) el.remove();
        } else {
            alert("Failed to delete: " + result.message);
        }
    } catch (error) {
        console.error('Error deleting:', error);
    }
}