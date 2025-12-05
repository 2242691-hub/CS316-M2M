// assets/js/admin_schedule.js

document.addEventListener('DOMContentLoaded', () => {
    loadFormOptions();
    
    // Attach listener to the Save button
    const saveBtn = document.getElementById('btn-save-schedule');
    if (saveBtn) {
        saveBtn.addEventListener('click', submitSchedule);
    }
});

async function loadFormOptions() {
    try {
        const response = await fetch('api/admin/get_form_options.php');
        const json = await response.json();

        if (json.success) {
            populateSelect('route-select', json.data.routes);
            populateSelect('driver-select', json.data.drivers);
            populateSelect('shuttle-select', json.data.shuttles, 'plate_number');
        }
    } catch (error) {
        console.error('Error loading options:', error);
    }
}

function populateSelect(elementId, items, labelKey = 'name') {
    const select = document.getElementById(elementId);
    if (!select) return;

    select.innerHTML = '<option value="">-- Select --</option>'; // Reset
    
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item[labelKey]; // uses 'name' or 'plate_number'
        select.appendChild(option);
    });
}

async function submitSchedule(e) {
    e.preventDefault();

    const data = {
        route_id: document.getElementById('route-select').value, // Not used in DB yet but good to have
        driver_id: document.getElementById('driver-select').value,
        shuttle_id: document.getElementById('shuttle-select').value,
        date: document.getElementById('date-input').value,
        time: document.getElementById('time-input').value
    };

    if(!data.driver_id || !data.shuttle_id || !data.date || !data.time) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        const response = await fetch('api/admin/create_schedule.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
            alert("Schedule Created!");
            window.location.href = 'admin.html';
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}