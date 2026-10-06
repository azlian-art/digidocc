<?php
require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query('SELECT * FROM vessel_sales ORDER BY created_at DESC');
        echo json_encode([
            'success' => true,
            'data' => $stmt->fetchAll()
        ]);
        exit;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to fetch vessels',
            'error' => $e->getMessage()
        ]);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON payload']);
        exit;
    }

    $vesselName = trim((string)($data['vessel_name'] ?? ''));
    $salesType = trim((string)($data['sales_type'] ?? ''));
    $budget = (float)($data['budget'] ?? 0);
    $currency = strtoupper(trim((string)($data['currency'] ?? 'IDR')));

    if ($vesselName === '' || $salesType === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'vessel_name and sales_type are required']);
        exit;
    }

    try {
        $stmt = $pdo->prepare(
            'INSERT INTO vessel_sales (vessel_name, sales_type, budget, currency) VALUES (:vessel_name, :sales_type, :budget, :currency)'
        );

        $stmt->execute([
            ':vessel_name' => $vesselName,
            ':sales_type' => $salesType,
            ':budget' => $budget,
            ':currency' => $currency
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Vessel saved successfully',
            'vessel_id' => (int)$pdo->lastInsertId()
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save vessel',
            'error' => $e->getMessage()
        ]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
