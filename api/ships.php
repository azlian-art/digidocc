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
    $loaValue = $data['loa'] ?? 0;
    $loaMinValue = $data['loa_min'] ?? $loaValue;
    $loaMaxValue = $data['loa_max'] ?? $loaValue;
    $loaTextInput = $data['loa_text'] ?? (string)$loaValue;
    $loa = is_numeric($loaMinValue) ? (float)$loaMinValue : 0;
    $loaMin = is_numeric($loaMinValue) ? (float)$loaMinValue : 0;
    $loaMax = is_numeric($loaMaxValue) ? (float)$loaMaxValue : 0;
    $loaText = is_string($loaTextInput) ? trim($loaTextInput) : '';
    $beamValue = $data['beam'] ?? 0;
    $beamMinValue = $data['beam_min'] ?? $beamValue;
    $beamMaxValue = $data['beam_max'] ?? $beamValue;
    $beamTextInput = $data['beam_text'] ?? (string)$beamValue;
    $beam = is_numeric($beamMinValue) ? (float)$beamMinValue : 0;
    $beamMin = is_numeric($beamMinValue) ? (float)$beamMinValue : 0;
    $beamMax = is_numeric($beamMaxValue) ? (float)$beamMaxValue : 0;
    $beamText = is_string($beamTextInput) ? trim($beamTextInput) : '';
    $draftInput = $data['draft_text'] ?? $data['draft'] ?? '';
    $draftText = is_string($draftInput) ? trim($draftInput) : '';
    $draftValue = $data['draft'] ?? null;
    $draftMaxValue = $data['draft_max'] ?? $draftValue;
    $draft = is_numeric($draftValue) ? (float)$draftValue : 0;
    $draftMax = is_numeric($draftMaxValue) ? (float)$draftMaxValue : $draft;
    $gtValue = $data['gt'] ?? 0;
    $gtMinValue = $data['gt_min'] ?? $gtValue;
    $gtMaxValue = $data['gt_max'] ?? $gtValue;
    $gtTextInput = $data['gt_text'] ?? (string)$gtValue;
    $gt = is_numeric($gtMinValue) ? (float)$gtMinValue : 0;
    $gtMin = is_numeric($gtMinValue) ? (float)$gtMinValue : 0;
    $gtMax = is_numeric($gtMaxValue) ? (float)$gtMaxValue : 0;
    $gtText = is_string($gtTextInput) ? trim($gtTextInput) : '';
    $dwtValue = $data['dwt'] ?? 0;
    $dwtMinValue = $data['dwt_min'] ?? $dwtValue;
    $dwtMaxValue = $data['dwt_max'] ?? $dwtValue;
    $dwtTextInput = $data['dwt_text'] ?? (string)$dwtValue;
    $dwt = is_numeric($dwtMinValue) ? (float)$dwtMinValue : 0;
    $dwtMin = is_numeric($dwtMinValue) ? (float)$dwtMinValue : 0;
    $dwtMax = is_numeric($dwtMaxValue) ? (float)$dwtMaxValue : 0;
    $dwtText = is_string($dwtTextInput) ? trim($dwtTextInput) : '';
    $stayStart = trim((string)($data['stay_start'] ?? ''));
    $stayEnd = trim((string)($data['stay_end'] ?? ''));

    if (
        $dockId <= 0 ||
        $shipName === '' ||
        $loa <= 0 ||
        $loaMin <= 0 ||
        $loaMax < $loaMin ||
        $loaText === '' ||
        $beam <= 0 ||
        $beamMax < $beamMin ||
        $beamText === '' ||
        $draftText === '' ||
        $gt <= 0 ||
        $gtMax < $gtMin ||
        $gtText === '' ||
        $dwt <= 0 ||
        $dwtMax < $dwtMin ||
        $dwtText === '' ||
        $stayStart === '' ||
        $stayEnd === ''
    ) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid or missing ship data']);
        exit;
    }

    try {
        $stmt = $pdo->prepare(
            'INSERT INTO ships (dock_id, ship_name, loa, loa_max, loa_text, beam, beam_max, beam_text, draft, draft_max, draft_text, gt, gt_max, gt_text, dwt, dwt_max, dwt_text, stay_start, stay_end)
             VALUES (:dock_id, :ship_name, :loa, :loa_max, :loa_text, :beam, :beam_max, :beam_text, :draft, :draft_max, :draft_text, :gt, :gt_max, :gt_text, :dwt, :dwt_max, :dwt_text, :stay_start, :stay_end)'
        );

        $stmt->execute([
            ':dock_id' => $dockId,
            ':ship_name' => $shipName,
            ':loa' => $loa,
            ':loa_max' => $loaMax,
            ':loa_text' => $loaText,
            ':beam' => $beam,
            ':beam_max' => $beamMax,
            ':beam_text' => $beamText,
            ':draft' => $draft,
            ':draft_max' => $draftMax,
            ':draft_text' => $draftText,
            ':gt' => $gt,
            ':gt_max' => $gtMax,
            ':gt_text' => $gtText,
            ':dwt' => $dwt,
            ':dwt_max' => $dwtMax,
            ':dwt_text' => $dwtText,
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
