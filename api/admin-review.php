<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

requireAppAccess($pdo, ['admin', 'employee']);

function respond(int $code, array $body): void
{
    http_response_code($code);
    echo json_encode($body);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query(
            'SELECT request_id, status, company_name, contact_person,
                    email, phone, vessel_name, vessel_type, service_name,
                    facility, planned_start_date, duration_days,
                    scope_of_work, rejection_reason, created_at
             FROM workshop_bookings
             ORDER BY created_at DESC'
        );

        respond(200, [
            'success' => true,
            'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
    } catch (PDOException $e) {
        respond(500, [
            'success' => false,
            'message' => 'Failed to retrieve bookings'
        ]);
    }
}

if ($method !== 'POST') {
    header('Allow: GET, POST');
    respond(405, [
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}

$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data)) {
    respond(400, [
        'success' => false,
        'message' => 'Invalid JSON payload'
    ]);
}

$requestId = trim((string)($data['request_id'] ?? ''));
$status = trim((string)($data['status'] ?? ''));
$reason = trim((string)($data['reason'] ?? ''));

if ($requestId === '') {
    respond(400, [
        'success' => false,
        'message' => 'request_id is required'
    ]);
}

if (!in_array($status, ['Approved', 'Rejected'], true)) {
    respond(400, [
        'success' => false,
        'message' => 'Status must be Approved or Rejected'
    ]);
}

if ($status === 'Rejected' && $reason === '') {
    respond(400, [
        'success' => false,
        'message' => 'Rejection reason is required'
    ]);
}

if (strlen($reason) > 1000) {
    respond(400, [
        'success' => false,
        'message' => 'Reason must not exceed 1000 characters'
    ]);
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        'SELECT status FROM workshop_bookings
         WHERE request_id = :request_id
         LIMIT 1 FOR UPDATE'
    );
    $stmt->execute([':request_id' => $requestId]);
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$booking) {
        $pdo->rollBack();
        respond(404, [
            'success' => false,
            'message' => 'Booking not found'
        ]);
    }

    if ($booking['status'] !== 'Under Review') {
        $pdo->rollBack();
        respond(409, [
            'success' => false,
            'message' => 'Only bookings under review can be decided'
        ]);
    }

    $stmt = $pdo->prepare(
        'UPDATE workshop_bookings
         SET status = :status, rejection_reason = :rejection_reason
         WHERE request_id = :request_id'
    );
    $stmt->execute([
        ':status' => $status,
        ':rejection_reason' => $status === 'Rejected' ? $reason : null,
        ':request_id' => $requestId
    ]);

    $pdo->commit();

    respond(200, [
        'success' => true,
        'message' => 'Booking decision saved',
        'request_id' => $requestId,
        'status' => $status,
        'reason' => $status === 'Rejected' ? $reason : null
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    respond(500, [
        'success' => false,
        'message' => 'Failed to update booking'
    ]);
}