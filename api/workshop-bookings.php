<?php
require_once __DIR__ . '/../db.php';

function respond(int $statusCode, array $body): void
{
    http_response_code($statusCode);
    echo json_encode($body);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $requestId = trim((string)($_GET['request_id'] ?? ''));
    if ($requestId === '') {
        respond(400, ['success' => false, 'message' => 'request_id is required']);
    }

    try {
        $stmt = $pdo->prepare(
            'SELECT request_id, status, company_name, contact_person, email, phone,
                    vessel_name, vessel_type, service_name, facility, planned_start_date,
                    duration_days, scope_of_work, created_at
             FROM workshop_bookings
             WHERE request_id = :request_id
             LIMIT 1'
        );
        $stmt->execute([':request_id' => $requestId]);
        $booking = $stmt->fetch();

        if (!$booking) {
            respond(404, ['success' => false, 'message' => 'Booking request not found']);
        }

        respond(200, ['success' => true, 'data' => $booking]);
    } catch (PDOException $e) {
        respond(500, [
            'success' => false,
            'message' => 'Failed to fetch booking request',
            'error' => $e->getMessage()
        ]);
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['success' => false, 'message' => 'Method not allowed']);
}

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    respond(400, ['success' => false, 'message' => 'Invalid JSON payload']);
}

$stringFields = [
    'company_name' => 150,
    'contact_person' => 150,
    'email' => 254,
    'phone' => 30,
    'country_region' => 100,
    'company_website' => 255,
    'vessel_name' => 150,
    'vessel_type' => 80,
    'imo_number' => 20,
    'flag_country' => 100,
    'service_name' => 100,
    'facility' => 100,
    'planned_start_date' => 10,
    'scope_of_work' => 65535,
    'capabilities' => 65535,
    'notes' => 65535
];

$values = [];
foreach ($stringFields as $field => $maxLength) {
    $value = trim((string)($data[$field] ?? ''));
    if (strlen($value) > $maxLength) {
        respond(400, ['success' => false, 'message' => $field . ' is too long']);
    }
    $values[$field] = $value === '' ? null : $value;
}

$requiredFields = [
    'company_name',
    'contact_person',
    'email',
    'phone',
    'vessel_name',
    'vessel_type',
    'service_name',
    'planned_start_date',
    'scope_of_work'
];
foreach ($requiredFields as $field) {
    if ($values[$field] === null) {
        respond(400, ['success' => false, 'message' => $field . ' is required']);
    }
}

if (!filter_var($values['email'], FILTER_VALIDATE_EMAIL)) {
    respond(400, ['success' => false, 'message' => 'email is invalid']);
}

$date = DateTime::createFromFormat('!Y-m-d', $values['planned_start_date']);
if (!$date || $date->format('Y-m-d') !== $values['planned_start_date']) {
    respond(400, ['success' => false, 'message' => 'planned_start_date is invalid']);
}

$numericFields = ['dwt', 'gross_tonnage', 'loa', 'beam', 'draft', 'duration_days'];
foreach ($numericFields as $field) {
    $rawValue = $data[$field] ?? null;
    if ($rawValue === null || $rawValue === '') {
        $values[$field] = null;
        continue;
    }
    if (!is_numeric($rawValue) || (float)$rawValue < 0) {
        respond(400, ['success' => false, 'message' => $field . ' must be a non-negative number']);
    }
    $values[$field] = $rawValue;
}

foreach (['loa', 'beam', 'draft'] as $field) {
    if ($values[$field] === null || (float)$values[$field] <= 0) {
        respond(400, ['success' => false, 'message' => $field . ' must be greater than zero']);
    }
}
if ($values['duration_days'] === null || (int)$values['duration_days'] < 1) {
    respond(400, ['success' => false, 'message' => 'duration_days must be at least 1']);
}
if ((float)$values['duration_days'] !== (float)(int)$values['duration_days']) {
    respond(400, ['success' => false, 'message' => 'duration_days must be a whole number']);
}
if ((float)$values['dwt'] > 9999999999.99 || (float)$values['gross_tonnage'] > 9999999999.99) {
    respond(400, ['success' => false, 'message' => 'Tonnage value is too large']);
}

try {
    $requestId = 'REQ-' . strtoupper(bin2hex(random_bytes(16)));
    $stmt = $pdo->prepare(
        'INSERT INTO workshop_bookings (
            request_id, company_name, contact_person, email, phone, country_region,
            company_website, vessel_name, vessel_type, imo_number, flag_country, dwt,
            gross_tonnage, loa, beam, draft, service_name, facility, planned_start_date,
            duration_days, scope_of_work, capabilities, notes
         ) VALUES (
            :request_id, :company_name, :contact_person, :email, :phone, :country_region,
            :company_website, :vessel_name, :vessel_type, :imo_number, :flag_country, :dwt,
            :gross_tonnage, :loa, :beam, :draft, :service_name, :facility, :planned_start_date,
            :duration_days, :scope_of_work, :capabilities, :notes
         )'
    );
    $stmt->execute([
        ':request_id' => $requestId,
        ':company_name' => $values['company_name'],
        ':contact_person' => $values['contact_person'],
        ':email' => $values['email'],
        ':phone' => $values['phone'],
        ':country_region' => $values['country_region'],
        ':company_website' => $values['company_website'],
        ':vessel_name' => $values['vessel_name'],
        ':vessel_type' => $values['vessel_type'],
        ':imo_number' => $values['imo_number'],
        ':flag_country' => $values['flag_country'],
        ':dwt' => $values['dwt'],
        ':gross_tonnage' => $values['gross_tonnage'],
        ':loa' => $values['loa'],
        ':beam' => $values['beam'],
        ':draft' => $values['draft'],
        ':service_name' => $values['service_name'],
        ':facility' => $values['facility'],
        ':planned_start_date' => $values['planned_start_date'],
        ':duration_days' => $values['duration_days'],
        ':scope_of_work' => $values['scope_of_work'],
        ':capabilities' => $values['capabilities'],
        ':notes' => $values['notes']
    ]);

    respond(201, [
        'success' => true,
        'message' => 'Booking request submitted successfully',
        'request_id' => $requestId,
        'status' => 'Under Review'
    ]);
} catch (PDOException $e) {
    respond(500, [
        'success' => false,
        'message' => 'Failed to save booking request',
        'error' => $e->getMessage()
    ]);
}
