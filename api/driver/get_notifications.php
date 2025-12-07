<?php

header('Content-Type: application/json');

// 1. Enable error reporting locally (remove in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 2. Include the database connection
if (file_exists('../db_connect.php')) {
    require_once '../db_connect.php';
} elseif (file_exists('../../db_connect.php')) {
    require_once '../../db_connect.php'; 
} else {
    echo json_encode(["success" => false, "message" => "Database file not found"]);
    exit;
}

// 3. Fetch Announcements (acting as Notifications)
// We format the date directly in SQL to make it easier for the frontend
$sql = "SELECT id, message, DATE_FORMAT(created_at, '%b %d, %h:%i %p') as formatted_date 
        FROM announcements 
        ORDER BY created_at DESC 
        LIMIT 10";

$result = $conn->query($sql);

$data = [];

if ($result) {
    while($row = $result->fetch_assoc()) {
        $data[] = [
            'id' => $row['id'],
            'message' => $row['message'],
            // Map formatted_date to created_at so the JS receives the string it expects
            'created_at' => $row['formatted_date']
        ];
    }
    echo json_encode(['success' => true, 'data' => $data]);
} else {
    // If table doesn't exist or query fails
    echo json_encode(['success' => false, 'message' => 'Query Failed: ' . $conn->error]);
}

$conn->close();
?>