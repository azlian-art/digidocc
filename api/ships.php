<?php
require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query(
            'SELECT s.*, d.code AS dock_code, d.name AS dock_name
             FROM ships s
             LEFT JOIN docks d ON d.id = s.dock_id
             ORDER BY s.stay_start DESC'
        );

        echo json_encode([
            'success' => true,
            'data' => $stmt->fetchAll()
        ]);
        exit;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to fetch ships',
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

    $dockId = (int)($data['dock_id'] ?? 0);
    $shipName = trim((string)($data['ship_name'] ?? ''));
    $loa = (float)($data['loa'] ?? 0);
    $beam = (float)($data['beam'] ?? 0);
    $draft = (float)($data['draft'] ?? 0);
    $gt = (float)($data['gt'] ?? 0);
    $dwt = (float)($data['dwt'] ?? 0);
    $stayStart = trim((string)($data['stay_start'] ?? ''));
    $stayEnd = trim((string)($data['stay_end'] ?? ''));

    if ($dockId <= 0 || $shipName === '' || $loa <= 0 || $beam <= 0 || $stayStart === '' || $stayEnd === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required ship data']);
        exit;
    }

    try {
        $stmt = $pdo->prepare(
            'INSERT INTO ships (dock_id, ship_name, loa, beam, draft, gt, dwt, stay_start, stay_end)
             VALUES (:dock_id, :ship_name, :loa, :beam, :draft, :gt, :dwt, :stay_start, :stay_end)'
        );

        $stmt->execute([
            ':dock_id' => $dockId,
            ':ship_name' => $shipName,
            ':loa' => $loa,
            ':beam' => $beam,
            ':draft' => $draft,
            ':gt' => $gt,
            ':dwt' => $dwt,
            ':stay_start' => $stayStart,
            ':stay_end' => $stayEnd,
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Ship saved successfully',
            'ship_id' => (int)$pdo->lastInsertId()
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save ship',
            'error' => $e->getMessage()
        ]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
