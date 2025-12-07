let map;
let routingControl;
let allSchedules = [];
let selectedScheduleId = null;
let currentUser = JSON.parse(localStorage.getItem('m2m_user'));

// NEW: Track if we previously had an active ride
let wasRideActive = false; 

document.addEventListener('DOMContentLoaded', () => {
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    if(document.getElementById('map')) {
        map = L.map('map').setView([16.4023, 120.5960], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        
        // 1. Initial Check
        checkUserBookingStatus();

        // 2. NEW: Poll every 5 seconds to check for updates (e.g., trip finished)
        setInterval(checkUserBookingStatus, 5000);
        
        // Load schedules for booking
        fetchActiveSchedules();
        
        setupPassengerCounter();
        
        document.getElementById('btn-book-now').addEventListener('click', () => {
            if(selectedScheduleId) {
                document.getElementById('payment-modal').style.display = 'flex';
            }
        });

        document.getElementById('btn-confirm-payment').addEventListener('click', submitBooking);

        document.getElementById('close-payment').addEventListener('click', () => {
            document.getElementById('payment-modal').style.display = 'none';
        });
    }
});

async function checkUserBookingStatus() {
    try {
        const response = await fetch(`api/routes/check_user_status.php?user_id=${currentUser.id}`);
        const result = await response.json();

        const panel = document.getElementById('booking-panel');

        // SCENARIO 1: User has an active trip (Pending or Accepted)
        if (result.success && result.has_active) {
            
            // Mark that we are currently in a ride
            wasRideActive = true; 

            // Disable polling interactions while in ride (optional, but good for UX)
            // But we keep updating the text based on status
            
            let statusTitle = "Trip Scheduled";
            let statusDesc = "Waiting for driver to start trip.";
            let iconClass = "fa-clock";
            let iconColor = "#ffc107"; 

            if (result.data.trip_status === 'in_progress') {
                statusTitle = "Trip in Progress";
                statusDesc = "The shuttle is currently en route.";
                iconClass = "fa-bus";
                iconColor = "#E02B2B"; 
            }

            // Overwrite the booking panel with Status Info
            panel.innerHTML = `
                <div style="text-align:center; padding: 20px 0;">
                    <i class="fas ${iconClass}" style="font-size: 40px; color: ${iconColor}; margin-bottom: 15px;"></i>
                    <h3>${statusTitle}</h3>
                    <p style="color:#666; font-size:13px; margin-bottom:5px;">
                        <strong>${result.data.route_name}</strong>
                    </p>
                    <p style="color:#888; font-size:12px; margin-bottom:20px;">
                        ${statusDesc}
                    </p>
                    <button class="btn-login" onclick="window.location.href='history.html'">View Ticket</button>
                </div>
            `;
        } 
        // SCENARIO 2: No active trip returned (Trip is Completed or Cancelled)
        else {
            // CHECK: Did we just finish a ride?
            if (wasRideActive === true) {
                wasRideActive = false; // Reset flag
                
                // Show Success Message
                Swal.fire({
                    title: 'Trip Completed!',
                    text: 'You have arrived at your destination.',
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false
                });

                // RELOAD the page to reset the Booking UI cleanly
                setTimeout(() => {
                    window.location.reload(); 
                }, 3000);
            }
            
            // If the user loads the page and wasRideActive is false, 
            // we do nothing (the default HTML booking form is already there).
        }
    } catch (e) {
        console.error("Connection error during polling", e);
    }
}

// ... rest of your functions (fetchActiveSchedules, populateRouteDropdown, etc.) remain the same
async function fetchActiveSchedules() {
    try {
        const response = await fetch('api/routes/get_active_schedules.php');
        const json = await response.json();

        if(json.success) {
            allSchedules = json.data;      
            populateRouteDropdown(allSchedules);
        }
    } catch (e) {
        console.error(e);
    }
}

function populateRouteDropdown(schedules) {
    const selector = document.getElementById('route-selector');
    if(!selector) return; 
    
    const uniqueRoutes = {};

    schedules.forEach(sch => {
        if(!uniqueRoutes[sch.route_id]) {
            uniqueRoutes[sch.route_id] = {
                id: sch.route_id,
                name: sch.route_name,
                data: sch 
            };
            const option = document.createElement('option');
            option.value = sch.route_id;
            option.textContent = sch.route_name;
            selector.appendChild(option);
        }
    });

    selector.addEventListener('change', (e) => {
        const routeId = e.target.value;
        renderShuttleList(routeId);
        
        if(routeId && uniqueRoutes[routeId]) {
            drawRouteOnMap(uniqueRoutes[routeId].data);
        }
    });
}

function renderShuttleList(routeId) {
    const listContainer = document.getElementById('shuttle-list');
    if(!listContainer) return;
    
    listContainer.innerHTML = '';
    selectedScheduleId = null;
    updateBookButton();

    if(!routeId) {
        listContainer.innerHTML = '<div style="padding:10px; text-align:center; color:#999; font-size:12px;">Select a route first</div>';
        return;
    }

    const relevantSchedules = allSchedules.filter(s => s.route_id == routeId);

    if(relevantSchedules.length === 0) {
        listContainer.innerHTML = '<div style="padding:10px; text-align:center; color:#999; font-size:12px;">No active shuttles for this route</div>';
        return;
    }

    relevantSchedules.forEach(sch => {
        const div = document.createElement('div');
        div.className = 'shuttle-option';
        const isFull = sch.available_seats <= 0;
        
        div.innerHTML = `
            <div class="shuttle-info">
                <h4>${sch.formatted_time} - ${sch.plate_number}</h4>
                <p>Capacity: ${sch.capacity}</p>
            </div>
            <div class="seats-badge ${isFull ? 'full' : ''}">
                ${isFull ? 'FULL' : sch.available_seats + ' Seats Left'}
            </div>
        `;

        if(!isFull) {
            div.addEventListener('click', () => {
                document.querySelectorAll('.shuttle-option').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
                selectedScheduleId = sch.schedule_id;
                updateBookButton();
            });
        } else {
            div.style.opacity = '0.5';
            div.style.cursor = 'not-allowed';
        }

        listContainer.appendChild(div);
    });
}

function drawRouteOnMap(routeData) {
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }

    if(routeData.start_lat && routeData.end_lat) {
        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(routeData.start_lat, routeData.start_lng),
                L.latLng(routeData.end_lat, routeData.end_lng)
            ],
            lineOptions: { styles: [{ color: '#E02B2B', opacity: 0.8, weight: 5 }] },
            createMarker: function() { return null; },
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            show: false
        }).addTo(map);
    }
}

function updateBookButton() {
    const btn = document.getElementById('btn-book-now');
    if(!btn) return;
    
    if(selectedScheduleId) {
        btn.disabled = false;
        btn.style.opacity = '1';
    } else {
        btn.disabled = true;
        btn.style.opacity = '0.6';
    }
}

window.selectPayment = function(method, element) {
    document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    document.getElementById('selected-payment-method').value = method;
    
    const btn = document.getElementById('btn-confirm-payment');
    btn.disabled = false;
    btn.innerText = method === 'cash' ? 'Book with Cash' : 'Pay Online Now';
}

async function submitBooking() {
    const user = JSON.parse(localStorage.getItem('m2m_user'));
    const passengers = document.getElementById('passenger-count').innerText;
    const method = document.getElementById('selected-payment-method').value;

    if(!user || !selectedScheduleId || !method) return;

    const btn = document.getElementById('btn-confirm-payment');
    const originalText = btn.innerText;
    btn.innerText = "Processing...";
    btn.disabled = true;

    try {
        const response = await fetch('api/routes/book_ride.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.id,
                schedule_id: selectedScheduleId,
                passengers: passengers,
                payment_method: method
            })
        });

        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch(e) {
            throw new Error("Server returned an invalid response.");
        }

        if(result.success) {
            document.getElementById('payment-modal').style.display = 'none';
            
            Swal.fire({
                title: 'Booking Confirmed!',
                text: 'Please present your ticket in the History tab.',
                icon: 'success',
                confirmButtonText: 'Go to My History'
            }).then(() => {
                // Instead of redirecting away, we reload to start the "Trip Scheduled" view
                window.location.reload(); 
            });

        } else {
            Swal.fire('Error', result.message, 'error');
            btn.innerText = originalText;
            btn.disabled = false;
        }

    } catch (e) {
        Swal.fire('Error', e.message || 'Something went wrong', 'error');
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

function setupPassengerCounter() {
    const display = document.getElementById('passenger-count');
    const btnInc = document.getElementById('btn-increase');
    const btnDec = document.getElementById('btn-decrease');
    
    if(!display || !btnInc) return;
    
    let count = 1;

    btnInc.addEventListener('click', () => { if(count < 5) display.innerText = ++count; });
    btnDec.addEventListener('click', () => { if(count > 1) display.innerText = --count; });
}