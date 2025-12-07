<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
require_once '../db_connect.php';

date_default_timezone_set('Asia/Manila');

$driver_id = $_GET['driver_id'] ?? null;

if (!$driver_id) {
    echo json_encode(["success" => false, "message" => "Driver ID missing"]);
    exit;
}

$response = [
    "current_trip" => null,
    "upcoming_trips" => []
];

$sql = "SELECT ds.id, ds.shift_date, ds.start_time, ds.end_time, ds.status, 
               s.plate_number, r.name as route_name, s.capacity,
               (SELECT COUNT(*) FROM bookings b WHERE b.driver_schedule_id = ds.id) as passenger_count
        FROM driver_schedule ds
        JOIN shuttles s ON ds.shuttle_id = s.id
        LEFT JOIN routes r ON ds.route_id = r.id
        WHERE ds.driver_id = ? 
        AND ds.status IN ('scheduled', 'in_progress', 'delayed')
        ORDER BY ds.shift_date ASC, ds.start_time ASC";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
    exit;
}

$stmt->bind_param("i", $driver_id);
$stmt->execute();
$result = $stmt->get_result();

$current_timestamp = time();

while ($row = $result->fetch_assoc()) {
    $trip_start_str = $row['shift_date'] . ' ' . $row['start_time'];
    $trip_start_timestamp = strtotime($trip_start_str);
    
    $time_diff = $trip_start_timestamp - $current_timestamp;

    $is_active = false;

    if ($row['status'] === 'in_progress' || $row['status'] === 'delayed') {
        $is_active = true;
    } 
    elseif ($row['status'] === 'scheduled' && $time_diff <= 900 && $time_diff > -7200) {
        $is_active = true;
        $row['is_boarding'] = true; 
    }

    if ($is_active && $response['current_trip'] === null) {
        $response['current_trip'] = $row;
    } else {
        $response['upcoming_trips'][] = $row;
    }
}

echo json_encode(["success" => true, "data" => $response]);
$stmt->close();
$conn->close();
?>