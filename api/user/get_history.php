<?php
header('Content-Type: application/json');

require_once '../db_connect.php';

if (!isset($_GET['user_id'])) {
    echo json_encode(["success" => false, "message" => "User ID required"]);
    exit();
}

$user_id = $conn->real_escape_string($_GET['user_id']);

// JOIN with Routes and Shuttles to get readable details
// ADDED: s.status as schedule_status to check if the driver finished the trip
$sql = "SELECT 
            b.id, 
            b.pickup_location, 
            b.dropoff_location, 
            b.status, 
            b.created_at,
            s.shift_date, 
            s.start_time,
            s.status as schedule_status,
            sh.plate_number,
            r.name as route_name
        FROM bookings b
        JOIN driver_schedule s ON b.driver_schedule_id = s.id
        JOIN shuttles sh ON s.shuttle_id = sh.id
        LEFT JOIN routes r ON s.route_id = r.id  
        WHERE b.user_id = '$user_id'
        ORDER BY s.shift_date DESC, s.start_time DESC";

$result = $conn->query($sql);

if (!$result) {
    // Return JSON error so frontend can handle it gracefully
    echo json_encode(["success" => false, "message" => "Database Error: " . $conn->error]);
    exit();
}

$upcoming = [];
$past = [];

while($row = $result->fetch_assoc()) {
    $row['formatted_date'] = date('M d, Y', strtotime($row['shift_date']));
    $row['formatted_time'] = date('g:i A', strtotime($row['start_time']));
    
    // If route name is missing, use locations
    if (empty($row['route_name'])) {
        $row['route_name'] = $row['pickup_location'] . ' → ' . $row['dropoff_location'];
    }

    // --- LOGIC FIX ---
    
    // 1. If the driver marked the SCHEDULE as completed, move to PAST (override booking status)
    if ($row['schedule_status'] === 'completed') {
        $row['status'] = 'completed'; // Force status to 'completed' for the UI display
        $past[] = $row;
    }
    // 2. If Booking is Pending or Accepted (and trip is NOT completed), it is UPCOMING
    elseif ($row['status'] == 'pending' || $row['status'] == 'accepted') {
        $upcoming[] = $row;
    } 
    // 3. Cancelled, Rejected, or already marked Completed bookings go to PAST
    else {
        $past[] = $row;
    }
}

echo json_encode([
    "success" => true,
    "upcoming" => $upcoming,
    "past" => $past
]);

$conn->close();
?>