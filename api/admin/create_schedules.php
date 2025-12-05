<?php
// api/admin/create_schedule.php
header('Content-Type: application/json');
require_once '../db_connect.php';

$data = json_decode(file_get_contents("php://input"));

// Validate inputs
if (empty($data->driver_id) || empty($data->shuttle_id) || empty($data->date) || empty($data->time)) {
    echo json_encode(["success" => false, "message" => "Please fill in all fields."]);
    exit();
}

$driver_id = $conn->real_escape_string($data->driver_id);
$shuttle_id = $conn->real_escape_string($data->shuttle_id);
$date = $conn->real_escape_string($data->date);
$time = $conn->real_escape_string($data->time);
// We calculate end time automatically (e.g., +1 hour) or you can add an input for it
$end_time = date('H:i:s', strtotime($time) + 3600); 

// Insert into driver_schedule
$sql = "INSERT INTO driver_schedule (driver_id, shuttle_id, shift_date, start_time, end_time, status) 
        VALUES ('$driver_id', '$shuttle_id', '$date', '$time', '$end_time', 'scheduled')";

if ($conn->query($sql) === TRUE) {
    echo json_encode(["success" => true, "message" => "Schedule created successfully!"]);
} else {
    echo json_encode(["success" => false, "message" => "Error: " . $conn->error]);
}

$conn->close();
?>