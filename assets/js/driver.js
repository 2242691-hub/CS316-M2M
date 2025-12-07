let currentScheduleId = null;
let passengerRefreshInterval = null; // Store interval ID for passenger list
let currentUser = JSON.parse(localStorage.getItem('m2m_user'));

document.addEventListener('DOMContentLoaded', () => {
    if(!currentUser || currentUser.role !== 'driver') {
        window.location.href = 'index.html';
        return;
    }

    setupSidebar();
    loadDriverSchedule();
    loadNotifications();

    // 1. REAL-TIME UPDATE: Refresh Dashboard every 5 seconds
    setInterval(loadDriverSchedule, 5000); 
    
    // Refresh notifications every 30 seconds
    setInterval(loadNotifications, 30000);
});

// ... (setupSidebar function remains the same, keep it here) ...
function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const openBtn = document.getElementById('open-sidebar');
    const closeBtn = document.getElementById('close-sidebar');
    const logoutBtn = document.getElementById('btn-logout');

    if (openBtn) openBtn.addEventListener('click', () => { sidebar.classList.add('active'); overlay.classList.add('active'); });
    
    function closeSidebarMenu() { sidebar.classList.remove('active'); overlay.classList.remove('active'); }

    if (closeBtn) closeBtn.addEventListener('click', closeSidebarMenu);
    if (overlay) overlay.addEventListener('click', closeSidebarMenu);

    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        Swal.fire({
            title: 'Logout?', text: "End shift?", icon: 'warning', showCancelButton: true, confirmButtonColor: '#E02B2B', confirmButtonText: 'Yes'
        }).then((result) => {
            if (result.isConfirmed) { localStorage.removeItem('m2m_user'); window.location.href = 'index.html'; }
        });
    });
}

async function loadDriverSchedule() {
    try {
        const response = await fetch(`api/driver/get_schedule.php?driver_id=${currentUser.id}`);
        const result = await response.json();

        if (result.success) {
            // Only re-render if we have data, to prevent blank flashing
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
        container.innerHTML = `<div class="trip-card gray-card"><h3 class="card-title">No Active Trips</h3><p class="sub-text">Next trip will appear 15 minutes before departure.</p></div>`;
        return;
    }

    currentScheduleId = trip.id;
    const capacityPercentage = Math.min(100, (trip.passenger_count / trip.capacity) * 100);

    let statusHtml = trip.status === 'delayed' 
        ? '<span class="live-badge" style="background:orange;">DELAYED</span>' 
        : '<span class="live-badge">LIVE</span>';
        
    const isStarted = trip.status === 'in_progress' || trip.status === 'delayed';
    const btnText = isStarted ? "End Trip" : "Start Trip";
    const btnColor = isStarted ? "#111" : "#cc0000";
    const btnAction = isStarted ? "complete" : "start";

    // Note: We use the existing HTML structure but ensure values are injected
    container.innerHTML = `
        <div class="trip-card gray-card">
            <div class="card-header-row">
                <h3 class="card-title">Current Trip</h3>
                ${statusHtml}
            </div>
            
            <p class="sub-text" style="font-size:14px; margin-bottom:5px;"><strong>Bus:</strong> ${trip.plate_number}</p>
            <p class="sub-text" style="font-size:14px;"><strong>Route:</strong> ${trip.route_name || 'Route Not Assigned'}</p>
           
            <div class="booking-status" style="margin: 15px 0;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                     <span class="label">Passenger Count</span>
                     <span class="count" style="font-size:16px; font-weight:bold; color:#E02B2B;">${trip.passenger_count} / ${trip.capacity}</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width: ${capacityPercentage}%;"></div></div>
            </div>

            <div class="time-info">
                <div class="time-box"><span>Departure</span><strong>${formatTime(trip.start_time)}</strong></div>
                <div class="time-divider"></div>
                <div class="time-box"><span>Arrival</span><strong>${formatTime(trip.end_time)}</strong></div>
            </div>

            <button class="btn-action" style="background-color: #444; margin-bottom: 10px;" onclick="openPassengerModal()">
                <i class="fas fa-users"></i> View Passengers
            </button>

            <div class="action-buttons">
                <button class="btn-action red" style="background-color: ${btnColor}" onclick="updateTripStatus('${btnAction}')">${btnText}</button>
                <button class="btn-action red" onclick="reportDelay()">Report Delay</button>
            </div>
        </div>
    `;
}

function renderUpcomingTrips(trips) {
    const container = document.getElementById('upcoming-trips-list');
    if(!container) return; 
    
    // Simple check to avoid clearing if user is scrolling or interacting
    // For now, we rebuild it.
    let html = '';
    if (trips.length === 0) {
        html = '<p class="sub-text">No upcoming trips.</p>';
    } else {
        trips.forEach(trip => {
            const dateObj = new Date(trip.shift_date);
            const month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
            const day = dateObj.getDate();
            html += `
                <div class="upcoming-item">
                    <div class="date-box"><span class="month">${month}</span><span class="day">${day}</span></div>
                    <div class="trip-text">
                        <strong>${formatTime(trip.start_time)}</strong>
                        <span>${trip.route_name || 'Assigned Route'}</span>
                    </div>
                </div>
                <div class="divider-black"></div>
            `;
        });
    }
    container.innerHTML = html;
}

// --- PASSENGER LOGIC ---

function openPassengerModal() {
    if(!currentScheduleId) return;
    openModal('passenger-modal');
    loadPassengers(); // Load immediately
    
    // 2. REAL-TIME LIST: Refresh list every 3 seconds while modal is open
    if(passengerRefreshInterval) clearInterval(passengerRefreshInterval);
    passengerRefreshInterval = setInterval(loadPassengers, 3000);
}

function closePassengerModal() {
    closeModal('passenger-modal');
    // Stop refreshing when closed to save resources
    if(passengerRefreshInterval) clearInterval(passengerRefreshInterval);
}

async function loadPassengers() {
    const container = document.getElementById('passenger-list');
    if(!container) return;

    try {
        const response = await fetch(`api/driver/get_trip_passengers.php?schedule_id=${currentScheduleId}`);
        const result = await response.json();

        if(result.success) {
            const passengers = result.data;
            if(passengers.length === 0) {
                container.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">No passengers booked yet.</p>';
                return;
            }

            container.innerHTML = passengers.map(p => {
                const isPaid = p.payment_status === 'paid';
                const isCash = p.payment_method === 'cash';
                const amount = parseFloat(p.amount).toFixed(2);

                let statusBadge = '';
                let actionBtn = '';

                if (isPaid) {
                    statusBadge = `<span class="status-badge-small badge-paid"><i class="fas fa-check"></i> PAID (${p.payment_method})</span>`;
                } else {
                    statusBadge = `<span class="status-badge-small badge-unpaid">PENDING (${p.payment_method})</span>`;
                    
                    // Only show Verify Button if method is CASH and status is UNPAID
                    if(isCash) {
                        actionBtn = `<button class="btn-verify" onclick="verifyPassenger(${p.booking_id})">Confirm ₱${amount}</button>`;
                    }
                }

                return `
                    <div class="passenger-item" style="border-bottom:1px solid #eee; padding: 12px 0;">
                        <div class="passenger-info">
                            <h4 style="margin:0; font-size:15px;">${p.passenger_name}</h4>
                            <p style="margin:2px 0; font-size:12px; color:#666;">
                                <i class="fas fa-map-marker-alt"></i> ${p.pickup_location} <i class="fas fa-arrow-right"></i> ${p.dropoff_location}
                            </p>
                            <div style="font-size:12px; margin-top:4px;">
                                <strong>Transaction:</strong> ₱${amount} via ${p.payment_method.toUpperCase()}
                            </div>
                        </div>
                        <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:5px;">
                            ${statusBadge}
                            ${actionBtn}
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (e) {
        console.error(e);
    }
}

async function verifyPassenger(bookingId) {
    // Temporarily stop refresh so the button doesn't disappear while clicking
    if(passengerRefreshInterval) clearInterval(passengerRefreshInterval);

    if(!confirm("Confirm that you received cash payment?")) {
        // Restart refresh if cancelled
        passengerRefreshInterval = setInterval(loadPassengers, 3000);
        return;
    }

    try {
        const response = await fetch('api/driver/verify_payment.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking_id: bookingId })
        });
        const result = await response.json();

        if(result.success) {
            Swal.fire({ icon: 'success', title: 'Payment Verified', timer: 1500, showConfirmButton: false });
            loadPassengers(); // Refresh immediately
            loadDriverSchedule(); // Update main count
        } else {
            Swal.fire('Error', result.message, 'error');
        }
    } catch (e) {
        console.error(e);
    } finally {
        // Restart refresh
        passengerRefreshInterval = setInterval(loadPassengers, 3000);
    }
}

// ... (Rest of your functions: updateTripStatus, reportDelay, notifications, formatTime) ...
// Make sure to add the rest of the existing functions here
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
            Swal.fire('Success', action === 'start' ? "Trip Started!" : "Status Updated", 'success');
            loadDriverSchedule(); 
        } else {
            Swal.fire('Error', data.message, 'error');
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

// driver.js

// driver.js

async function loadNotifications() {
    const list = document.getElementById('notification-list');
    if (!list) return;

    try {
        const response = await fetch('api/driver/get_notifications.php');
        const json = await response.json();

        if (json.success) {
            const notifs = json.data;
            let unreadCount = 0; 

            if (notifs.length === 0) {
                list.innerHTML = '<li class="feed-item"><p>No new notifications.</p></li>';
                return;
            }

            list.innerHTML = notifs.map(item => {
                const isUnread = item.is_read === 0;
                if (isUnread) unreadCount++; 

                const unreadClass = isUnread ? 'unread' : '';
                
                // Determine icon and color based on 'type'
                let iconClass = 'fas fa-bullhorn'; // Default icon
                let iconColor = '#E02B2B';        // Default color
                let backgroundColor = '#eef2ff';

                if (item.type === 'announcement') {
                    // Use a different icon for announcements
                    iconClass = 'fas fa-megophone'; 
                    iconColor = '#007bff'; // Blue for official announcements
                    backgroundColor = '#e6f3ff';
                }
                // You can add more 'else if' blocks for 'type' such as 'warning', 'system', etc.

                return `
                    <li class="feed-item ${unreadClass}">
                        <div class="feed-icon" style="background:${backgroundColor}; color:${iconColor};">
                            <i class="${iconClass}"></i>
                        </div>
                        <div class="feed-content">
                            <p><strong>[Announcement]</strong> ${item.message}</p>
                            <span>${item.created_at}</span>
                        </div>
                    </li>
                `;
            }).join('');
            
            const dot = document.querySelector('.notification-icon .dot');
            if (dot) {
                dot.style.display = unreadCount > 0 ? 'block' : 'none';
            }
        }
    } catch (error) {
        console.error("Error loading notifications", error);
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
        closePassengerModal(); // Ensure we stop the interval if clicked outside
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