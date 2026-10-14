<?php
function startAppSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);

    if (!session_start()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'message' => 'Could not start secure session']);
        exit;
    }
}

function requireAppAccess(PDO $pdo, array $allowedRoles): array
{
    startAppSession();
    header('Content-Type: application/json; charset=utf-8');

    if (
        !isset($_SESSION['user_id'], $_SESSION['last_activity']) ||
        !is_int($_SESSION['user_id']) ||
        !is_int($_SESSION['last_activity']) ||
        time() - $_SESSION['last_activity'] > 1800
    ) {
        $_SESSION = [];
        session_destroy();
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Login required']);
        exit;
    }

    try {
        $stmt = $pdo->prepare('SELECT user_type FROM users WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $_SESSION['user_id']]);
        $user = $stmt->fetch();
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Could not verify account access']);
        exit;
    }

    if (!$user) {
        $_SESSION = [];
        session_destroy();
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Login required']);
        exit;
    }

    if (!in_array($user['user_type'], $allowedRoles, true)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'You are not allowed to access this resource']);
        exit;
    }

    $_SESSION['last_activity'] = time();
    $_SESSION['user_type'] = $user['user_type'];

    return [
        'id' => $_SESSION['user_id'],
        'user_type' => $user['user_type']
    ];
}
