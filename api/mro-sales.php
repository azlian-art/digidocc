<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/auth.php';

function respond(int $statusCode, array $body): void
{
    http_response_code($statusCode);
    echo json_encode($body);
    exit;
}

function readPayload(): array
{
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        respond(400, ['success' => false, 'message' => 'Invalid JSON payload']);
    }
    return $data;
}

requireAppAccess($pdo, ['employee']);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $records = $pdo->query(
            'SELECT id, vessel_name, sales_type, budget, currency, target_sales_percent,
                    project_start, project_end
             FROM mro_sales_records
             ORDER BY id ASC'
        )->fetchAll();
        $weekRows = $pdo->query(
            'SELECT sales_record_id, week_number, cost
             FROM mro_sales_weeks
             ORDER BY sales_record_id ASC, week_number ASC'
        )->fetchAll();

        $weeksByRecord = [];
        foreach ($weekRows as $week) {
            $weeksByRecord[(int)$week['sales_record_id']][] = (float)$week['cost'];
        }
        foreach ($records as &$record) {
            $record['id'] = (int)$record['id'];
            $record['budget'] = (float)$record['budget'];
            $record['target_sales_percent'] = (float)$record['target_sales_percent'];
            $record['weeks'] = $weeksByRecord[$record['id']] ?? [];
        }
        unset($record);

        respond(200, ['success' => true, 'data' => $records]);
    } catch (PDOException $e) {
        respond(500, [
            'success' => false,
            'message' => 'Failed to fetch MRO sales records',
            'error' => $e->getMessage()
        ]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = readPayload();
    $id = (int)($data['id'] ?? 0);
    $isUpdate = $_SERVER['REQUEST_METHOD'] === 'PUT';
    $vesselName = trim((string)($data['vessel_name'] ?? ''));
    $salesType = trim((string)($data['sales_type'] ?? ''));
    $budget = $data['budget'] ?? 0;
    $currency = strtoupper(trim((string)($data['currency'] ?? 'IDR')));
    $targetSalesPercent = $data['target_sales_percent'] ?? 0;
    $projectStart = trim((string)($data['project_start'] ?? ''));
    $projectEnd = trim((string)($data['project_end'] ?? ''));
    $weeks = $data['weeks'] ?? [];

    if ($isUpdate && $id <= 0) {
        respond(400, ['success' => false, 'message' => 'A valid record id is required']);
    }
    if ($vesselName === '' || strlen($vesselName) > 150 || $salesType === '' || strlen($salesType) > 100) {
        respond(400, ['success' => false, 'message' => 'Vessel name and sales type are required']);
    }
    if (!is_numeric($budget) || (float)$budget < 0 || (float)$budget > 9999999999999.99) {
        respond(400, ['success' => false, 'message' => 'Budget must be a valid non-negative amount']);
    }
    if (!in_array($currency, ['IDR', 'USD', 'EUR'], true)) {
        respond(400, ['success' => false, 'message' => 'Currency must be IDR, USD, or EUR']);
    }
    if (
        !is_numeric($targetSalesPercent) ||
        (float)$targetSalesPercent < 0 ||
        (float)$targetSalesPercent > 100
    ) {
        respond(400, ['success' => false, 'message' => 'Target sales percentage must be between 0 and 100']);
    }
    if (!is_array($weeks) || count($weeks) > 520) {
        respond(400, ['success' => false, 'message' => 'Weeks must be a list of at most 520 costs']);
    }

    foreach ([$projectStart, $projectEnd] as $date) {
        if ($date !== '') {
            $parsedDate = DateTime::createFromFormat('!Y-m-d', $date);
            if (!$parsedDate || $parsedDate->format('Y-m-d') !== $date) {
                respond(400, ['success' => false, 'message' => 'Project dates must use YYYY-MM-DD format']);
            }
        }
    }
    if ($projectStart !== '' && $projectEnd !== '' && $projectEnd < $projectStart) {
        respond(400, ['success' => false, 'message' => 'Project end date cannot be earlier than start date']);
    }

    foreach ($weeks as $weekCost) {
        if (!is_numeric($weekCost) || (float)$weekCost < 0 || (float)$weekCost > 9999999999999.99) {
            respond(400, ['success' => false, 'message' => 'Weekly costs must be valid non-negative amounts']);
        }
    }

    try {
        $pdo->beginTransaction();
        if ($isUpdate) {
            $stmt = $pdo->prepare(
                'UPDATE mro_sales_records
                 SET vessel_name = :vessel_name, sales_type = :sales_type, budget = :budget,
                     currency = :currency, target_sales_percent = :target_sales_percent,
                     project_start = :project_start, project_end = :project_end
                 WHERE id = :id'
            );
            $stmt->execute([
                ':vessel_name' => $vesselName,
                ':sales_type' => $salesType,
                ':budget' => $budget,
                ':currency' => $currency,
                ':target_sales_percent' => $targetSalesPercent,
                ':project_start' => $projectStart !== '' ? $projectStart : null,
                ':project_end' => $projectEnd !== '' ? $projectEnd : null,
                ':id' => $id
            ]);
            if ($stmt->rowCount() === 0) {
                $check = $pdo->prepare('SELECT id FROM mro_sales_records WHERE id = :id');
                $check->execute([':id' => $id]);
                if (!$check->fetch()) {
                    $pdo->rollBack();
                    respond(404, ['success' => false, 'message' => 'MRO sales record not found']);
                }
            }
        } else {
            $stmt = $pdo->prepare(
                'INSERT INTO mro_sales_records
                    (vessel_name, sales_type, budget, currency, target_sales_percent, project_start, project_end)
                 VALUES
                    (:vessel_name, :sales_type, :budget, :currency, :target_sales_percent, :project_start, :project_end)'
            );
            $stmt->execute([
                ':vessel_name' => $vesselName,
                ':sales_type' => $salesType,
                ':budget' => $budget,
                ':currency' => $currency,
                ':target_sales_percent' => $targetSalesPercent,
                ':project_start' => $projectStart !== '' ? $projectStart : null,
                ':project_end' => $projectEnd !== '' ? $projectEnd : null
            ]);
            $id = (int)$pdo->lastInsertId();
        }

        $deleteWeeks = $pdo->prepare('DELETE FROM mro_sales_weeks WHERE sales_record_id = :id');
        $deleteWeeks->execute([':id' => $id]);
        $insertWeek = $pdo->prepare(
            'INSERT INTO mro_sales_weeks (sales_record_id, week_number, cost)
             VALUES (:sales_record_id, :week_number, :cost)'
        );
        foreach ($weeks as $index => $weekCost) {
            $insertWeek->execute([
                ':sales_record_id' => $id,
                ':week_number' => $index + 1,
                ':cost' => $weekCost
            ]);
        }
        $pdo->commit();

        respond($isUpdate ? 200 : 201, [
            'success' => true,
            'message' => 'MRO sales record saved successfully',
            'id' => $id
        ]);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        respond(500, [
            'success' => false,
            'message' => 'Failed to save MRO sales record',
            'error' => $e->getMessage()
        ]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = readPayload();
    $id = (int)($data['id'] ?? 0);
    if ($id <= 0) {
        respond(400, ['success' => false, 'message' => 'A valid record id is required']);
    }

    try {
        $stmt = $pdo->prepare('DELETE FROM mro_sales_records WHERE id = :id');
        $stmt->execute([':id' => $id]);
        if ($stmt->rowCount() === 0) {
            respond(404, ['success' => false, 'message' => 'MRO sales record not found']);
        }
        respond(200, ['success' => true, 'message' => 'MRO sales record deleted successfully']);
    } catch (PDOException $e) {
        respond(500, [
            'success' => false,
            'message' => 'Failed to delete MRO sales record',
            'error' => $e->getMessage()
        ]);
    }
}

respond(405, ['success' => false, 'message' => 'Method not allowed']);
