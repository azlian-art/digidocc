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
$email = trim((string)($data['email'] ?? ''));
$password = (string)($data['password'] ?? '');
$idNumber = trim(strtoupper((string)($data['id_number'] ?? '')));
$userType = strtolower(trim((string)($data['user_type'] ?? 'employee')));

if ($username === '' || $password === '' || $idNumber === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'username, password, and id_number are required']);
    exit;
}

if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'A valid email address is required']);
    exit;
}

if (!in_array($userType, ['admin', 'employee', 'customer'], true)) {
    $userType = 'employee';
}

try {
    $stmt = $pdo->prepare('SELECT id FROM users WHERE username = :username OR id_number = :id_number OR (:email_check IS NOT NULL AND email = :email_value) LIMIT 1');
    $stmt->execute([
        ':username' => $username,
        ':id_number' => $idNumber,
        ':email_check' => $email !== '' ? $email : null,
        ':email_value' => $email !== '' ? $email : null,
    ]);

    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Username or ID already exists']);
        exit;
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare('INSERT INTO users (username, email, password_hash, id_number, user_type) VALUES (:username, :email, :password_hash, :id_number, :user_type)');
    $stmt->execute([
        ':username' => $username,
        ':email' => $email !== '' ? $email : null,
        ':password_hash' => $passwordHash,
        ':id_number' => $idNumber,
        ':user_type' => $userType,
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'User registered successfully',
        'user_id' => (int)$pdo->lastInsertId(),
        'username' => $username,
        'email' => $email,
        'user_type' => $userType
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Registration failed',
        'error' => $e->getMessage()
    ]);
}
