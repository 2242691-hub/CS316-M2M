<?php
header('Content-Type: application/json');
require_once '../db_connect.php';

// Fetch latest 10 notifications
$sql = "SELECT id, message, type, is_read, DATE_FORMAT(created_at, '%b %d, %h:%i %p') as formatted_date 
        FROM notifications 
        ORDER BY created_at DESC 
        LIMIT 10";

$result = $conn->query($sql);

$data = [];

if ($result) {
    while($row = $result->fetch_assoc()) {
        $data[] = [
            'id' => $row['id'],
            'message' => $row['message'],
            'type' => $row['type'],
            'created_at' => $row['formatted_date']
        ];
    }
    echo json_encode(['success' => true, 'data' => $data]);
} else {
    echo json_encode(['success' => false, 'message' => 'Query Failed']);
}

$conn->close();
?>