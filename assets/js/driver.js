let currentScheduleId = null;
let currentUser = JSON.parse(localStorage.getItem('m2m_user'));

document.addEventListener('DOMContentLoaded', () => {
    if(!currentUser || currentUser.role !== 'driver') {
        window.location.href = 'index.html';
        return;
    }

    setupSidebar();
    loadDriverSchedule();
    loadNotifications();

    setInterval(loadNotifications, 30000);
});

function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const openBtn = document.getElementById('open-sidebar');
    const closeBtn = document.getElementById('close-sidebar');
    const logoutBtn = document.getElementById('btn-logout');

    if (openBtn) {
        openBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
            overlay.classList.add('active');
        });
    }

    function closeSidebarMenu() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }

    if (closeBtn) closeBtn.addEventListener('click', closeSidebarMenu);
    if (overlay) overlay.addEventListener('click', closeSidebarMenu);

if (logoutBtn) {
    // Using .onclick overwrites any previous listeners, preventing double popups
    logoutBtn.onclick = function(e) {
        e.preventDefault();
        
        Swal.fire({
            title: 'Are you sure?',
            text: "You will be logged out of the system.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, Logout'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = '../logout.php';
            }
        });
    };
}
}

async function loadDriverSchedule() {
    try {
        const response = await fetch(`api/driver/get_schedule.php?driver_id=${currentUser.id}`);
        const result = await response.json();

        if (result.success) {
            renderCurrentTrip(result.data.current_trip);
            renderUpcomingTrips(result.data.upcoming_trips);
        }
    } catch (error) {
        console.error('Error loading schedule:', error);
    }
}
function renderCurrentTrip(trip) {
    const container = document.getElementById('current-trip-container');
    
    if (!trip) {
        container.innerHTML = `
            <div class="trip-card gray-card">
                <h3 class="card-title">No Active Trips</h3>
                <p class="sub-text">Next trip will appear 15 minutes before departure.</p>
            </div>`;
        return;
    }

    currentScheduleId = trip.id;
    const capacityPercentage = Math.min(100, (trip.passenger_count / trip.capacity) * 100);

    let pillHtml = '';
    let statusText = '';

    if(trip.status === 'in_progress') {
        pillHtml = '<button class="pill active">On Route</button>';
        statusText = 'LIVE';
    } else if(trip.status === 'delayed') {
        pillHtml = '<button class="pill active status-delayed">Delayed</button>';
        statusText = 'DELAYED';
    } else if (trip.is_boarding) {
        pillHtml = '<button class="pill" style="background: #e67e22; color: #fff;">Boarding Now</button>';
        statusText = 'BOARDING';
    } else {
        pillHtml = '<button class="pill">Scheduled</button>';
    }

    const isStarted = trip.status === 'in_progress' || trip.status === 'delayed';
    const btnText = isStarted ? "End Trip" : "Start Trip";
    const btnColor = isStarted ? "#111" : "#cc0000";
    const btnAction = isStarted ? "complete" : "start";

    container.innerHTML = `
        <div class="trip-card gray-card">
            <div class="card-header-row">
                <h3 class="card-title">Current Trip</h3>
                <span class="live-badge" style="${trip.status === 'delayed' ? 'background:orange;' : ''}">${statusText}</span>
            </div>
            
            <p class="sub-text"><strong>Bus:</strong> ${trip.plate_number}</p>
            <p class="sub-text"><strong>Route:</strong> ${trip.route_name || 'Route Not Assigned'}</p>
           
            <div class="booking-status">
                <span class="label">Passenger Count</span>
                <span class="count">${trip.passenger_count}/${trip.capacity}</span>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${capacityPercentage}%;"></div>
                </div>
            </div>

            <div class="time-info">
                <div class="time-box">
                    <span>Departure</span>
                    <strong>${formatTime(trip.start_time)}</strong>
                </div>
                <div class="time-divider"></div>
                <div class="time-box">
                    <span>Arrival</span>
                    <strong>${formatTime(trip.end_time)}</strong>
                </div>
            </div>

            <div class="status-pills">
                ${pillHtml}
            </div>

            <div class="action-buttons">
                <button class="btn-action red" id="btn-toggle" 
                    style="background-color: ${btnColor}" 
                    onclick="updateTripStatus('${btnAction}')">${btnText}</button>
                <button class="btn-action red" onclick="reportDelay()">Report Delay</button>
            </div>
        </div>
    `;
}

function renderUpcomingTrips(trips) {
    const container = document.getElementById('upcoming-trips-list');
    container.innerHTML = '';

    if (trips.length === 0) {
        container.innerHTML = '<p class="sub-text">No upcoming trips.</p>';
        return;
    }

    trips.forEach(trip => {
        const dateObj = new Date(trip.shift_date);
        const month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
        const day = dateObj.getDate();

        container.innerHTML += `
            <div class="upcoming-item">
                <div class="date-box">
                    <span class="month">${month}</span>
                    <span class="day">${day}</span>
                </div>
                <div class="trip-text">
                    <strong>${formatTime(trip.start_time)}</strong>
                    <span>${trip.route_name || 'Assigned Route'}</span>
                    <small>Capacity: ${trip.capacity}</small>
                </div>
            </div>
            <div class="divider-black"></div>
        `;
    });
}

async function updateTripStatus(action, extraData = {}) {
    if(!currentScheduleId) return;

    const payload = {
        schedule_id: currentScheduleId,
        action: action,
        driver_name: currentUser.name,
        ...extraData
    };

    try {
        const res = await fetch('api/driver/update_trip.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if(data.success) {
            alert(action === 'start' ? "Trip Started!" : "Status Updated");
            loadDriverSchedule(); 
        } else {
            alert("Error: " + data.message);
        }
    } catch (e) {
        console.error(e);
    }
}

function reportDelay() {
    const minutes = prompt("How many minutes is the delay?");
    if (minutes && !isNaN(minutes)) {
        updateTripStatus('delay', { minutes: minutes });
    }
}

function reportAccident() {
    if(confirm("Are you sure you want to report an accident? This will alert the admin.")) {
        sendAlert("ACCIDENT REPORTED", "critical");
    }
}

async function loadNotifications() {
    const list = document.getElementById('notification-list');
    if (!list) return;

    try {
        const response = await fetch('api/driver/get_notifications.php');
        const json = await response.json();

        if (json.success) {
            const notifs = json.data;
            if (notifs.length === 0) {
                list.innerHTML = '<li class="feed-item"><p>No new notifications.</p></li>';
                return;
            }

            list.innerHTML = notifs.map(item => `
                <li class="feed-item">
                    <div class="feed-icon" style="background:#eef2ff; color:#E02B2B;">
                        <i class="fas fa-bullhorn"></i>
                    </div>
                    <div class="feed-content">
                        <p>${item.message}</p>
                        <span>${item.created_at}</span>
                    </div>
                </li>
            `).join('');
            
            const dot = document.querySelector('.notification-icon .dot');
            if(dot) dot.style.display = 'block';
        }
    } catch (error) {
        console.error("Error loading notifications", error);
    }
}

async function sendAlert(customMsg = null, type = 'alert') {
    let message = customMsg;
    
    if (!message) {
        message = prompt("Enter alert message to send to Admin/System:");
    }
    
    if (message) {
        try {
            const response = await fetch('api/driver/send_alert.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    type: type,
                    driver_name: currentUser.name
                })
            });
            const res = await response.json();
            if (res.success) {
                if(!customMsg) alert("Alert Sent Successfully.");
                loadNotifications();
            } else {
                alert("Failed to send: " + res.message);
            }
        } catch (error) {
            console.error("Error sending alert:", error);
        }
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) modal.style.display = 'flex';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target.classList.contains('custom-modal')) {
        event.target.style.display = 'none';
    }
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
}