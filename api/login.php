<?php
require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload']);
    exit;
}

$username = trim((string)($data['username'] ?? ''));
$password = (string)($data['password'] ?? '');
$idNumber = trim(strtoupper((string)($data['id_number'] ?? '')));
$userType = strtolower(trim((string)($data['user_type'] ?? 'employee')));

if ($username === '' || $password === '' || $idNumber === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'username, password, and id_number are required']);
    exit;
}

if (!in_array($userType, ['admin', 'employee', 'customer'], true)) {
    $userType = 'employee';
}

try {
    $stmt = $pdo->prepare('SELECT id, username, password_hash, id_number, user_type FROM users WHERE username = :username AND id_number = :id_number AND user_type = :user_type LIMIT 1');
    $stmt->execute([
        ':username' => $username,
        ':id_number' => $idNumber,
        ':user_type' => $userType,
    ]);

    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid username, ID, user type, or password']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'user' => [
            'id' => (int)$user['id'],
            'username' => $user['username'],
            'id_number' => $user['id_number'],
            'user_type' => $user['user_type']
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Login failed',
        'error' => $e->getMessage()
    ]);
}
