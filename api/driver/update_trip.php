<?php
header('Content-Type: application/json');
require_once '../db_connect.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->schedule_id) || !isset($data->action)) {
    echo json_encode(["success" => false, "message" => "Missing parameters"]);
    exit;
}

$schedule_id = $conn->real_escape_string($data->schedule_id);
$action = $data->action; 
$driver_name = $data->driver_name ?? 'Driver';

if ($action === 'start') {
    $sql = "UPDATE driver_schedule SET status = 'in_progress' WHERE id = '$schedule_id'";
    $notif_msg = "Trip started by $driver_name";
} elseif ($action === 'complete') {
    $sql = "UPDATE driver_schedule SET status = 'completed' WHERE id = '$schedule_id'";
    $notif_msg = "Trip completed by $driver_name";
} elseif ($action === 'delay') {
    $minutes = $conn->real_escape_string($data->minutes ?? 0);
    // Note: We only update the status tag. We do not change the actual start_time column
    // to preserve the original schedule record, unless you want to mathematically add minutes to start_time.
    $sql = "UPDATE driver_schedule SET status = 'delayed' WHERE id = '$schedule_id'";
    $notif_msg = "Delay of $minutes mins reported by $driver_name";
} else {
    echo json_encode(["success" => false, "message" => "Invalid action"]);
    exit;
}

if ($conn->query($sql) === TRUE) {
    if (isset($notif_msg)) {
        $conn->query("INSERT INTO notifications (message, type) VALUES ('$notif_msg', 'info')");
    }
    echo json_encode(["success" => true, "message" => "Status updated"]);
} else {
    echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
}

$conn->close();
?>