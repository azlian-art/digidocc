<?php
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../db.php';

$username = trim((string)getenv('DIGIDOCC_ADMIN_USERNAME'));
$password = (string)getenv('DIGIDOCC_ADMIN_PASSWORD');
$idNumber = trim(strtoupper((string)getenv('DIGIDOCC_ADMIN_ID')));
if ($username === '' || $password === '' || $idNumber === '') {
    fwrite(STDERR, "Set DIGIDOCC_ADMIN_USERNAME, DIGIDOCC_ADMIN_PASSWORD, and DIGIDOCC_ADMIN_ID.\n");
    exit(1);
}

try {
    $check = $pdo->prepare('SELECT id FROM users WHERE username = :username OR id_number = :id_number LIMIT 1');
    $check->execute([
        ':username' => $username,
        ':id_number' => $idNumber,
    ]);

    if ($check->fetch()) {
        fwrite(STDERR, "An account already uses that username or ID.\n");
        exit(1);
    }

    $stmt = $pdo->prepare('INSERT INTO users (username, password_hash, id_number, user_type) VALUES (:username, :password_hash, :id_number, :user_type)');
    $stmt->execute([
        ':username' => $username,
        ':password_hash' => password_hash($password, PASSWORD_DEFAULT),
        ':id_number' => $idNumber,
        ':user_type' => 'admin'
    ]);

    echo "Admin account created successfully.\n";
} catch (PDOException $e) {
    fwrite(STDERR, "Failed to create admin account: {$e->getMessage()}\n");
    exit(1);
}
