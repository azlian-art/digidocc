<?php
require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$defaultUsername = 'admin';
$defaultPassword = 'admin123';
$defaultId = 'ADM';

try {
    $check = $pdo->prepare('SELECT id FROM users WHERE username = :username OR id_number = :id_number LIMIT 1');
    $check->execute([
        ':username' => $defaultUsername,
        ':id_number' => $defaultId,
    ]);

    if ($check->fetch()) {
        echo json_encode(['success' => true, 'message' => 'Admin account already exists']);
        exit;
    }

    $stmt = $pdo->prepare('INSERT INTO users (username, password_hash, id_number, user_type) VALUES (:username, :password_hash, :id_number, :user_type)');
    $stmt->execute([
        ':username' => $defaultUsername,
        ':password_hash' => password_hash($defaultPassword, PASSWORD_DEFAULT),
        ':id_number' => $defaultId,
        ':user_type' => 'admin'
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Admin account created successfully',
        'username' => $defaultUsername,
        'id_number' => $defaultId,
        'password' => $defaultPassword
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to seed admin',
        'error' => $e->getMessage()
    ]);
}
