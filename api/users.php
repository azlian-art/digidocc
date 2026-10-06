<?php
require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    $stmt = $pdo->query('SELECT id, username, id_number, user_type, created_at FROM users ORDER BY created_at ASC');
    $users = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data' => array_map(function ($user) {
            return [
                'id' => (int)$user['id'],
                'username' => $user['username'],
                'id_number' => $user['id_number'],
                'userType' => $user['user_type'],
                'user_type' => $user['user_type'],
                'created_at' => $user['created_at']
            ];
        }, $users)
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch users',
        'error' => $e->getMessage()
    ]);
}
