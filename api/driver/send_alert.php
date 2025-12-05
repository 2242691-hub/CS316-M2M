<?php
header('Content-Type: application/json');
require_once '../db_connect.php';

// Accept JSON input
$data = json_decode(file_get_contents("php://input"));

if (empty($data->message)) {
    echo json_encode(["success" => false, "message" => "Message cannot be empty."]);
    exit;
}

$message = $conn->real_escape_string($data->message);
$type = $conn->real_escape_string($data->type ?? 'alert'); // Default to 'alert'
$driver_name = $conn->real_escape_string($data->driver_name ?? 'Unknown Driver');

// Prefix the message with the driver's name for clarity
$final_message = "[$driver_name]: " . $message;

$sql = "INSERT INTO notifications (message, type, is_read) VALUES ('$final_message', '$type', 0)";

if ($conn->query($sql) === TRUE) {
    echo json_encode(["success" => true, "message" => "Alert sent successfully."]);
} else {
    echo json_encode(["success" => false, "message" => "Database Error: " . $conn->error]);
}

$conn->close();
?>