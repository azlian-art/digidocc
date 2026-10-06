USE db_digidocc;

START TRANSACTION;

-- Demo users use the password admin123. Existing accounts are left unchanged.
INSERT INTO users (username, password_hash, id_number, user_type)
SELECT 'admin', '$2y$10$kY.SHo/jOZm40zctl.9pWuWQ.H71.Z6WxanXQYlrCqbboRkaiw7wG', 'ADM', 'admin'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE username = 'admin' OR id_number = 'ADM'
);

INSERT INTO users (username, password_hash, id_number, user_type)
SELECT 'employee01', '$2y$10$kY.SHo/jOZm40zctl.9pWuWQ.H71.Z6WxanXQYlrCqbboRkaiw7wG', 'EMP1', 'employee'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE username = 'employee01' OR id_number = 'EMP1'
);

INSERT INTO users (username, password_hash, id_number, user_type)
SELECT 'customer01', '$2y$10$kY.SHo/jOZm40zctl.9pWuWQ.H71.Z6WxanXQYlrCqbboRkaiw7wG', 'CUS1', 'customer'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE username = 'customer01' OR id_number = 'CUS1'
);

INSERT INTO docks (code, name, location, dock_length, dock_width, status) VALUES
  ('IR', 'Irian', 'Irian', 225.00, 25.00, 'active'),
  ('SMG', 'Semarang', 'Semarang', 300.00, 32.00, 'active'),
  ('SBY', 'Surabaya', 'Surabaya', 128.00, 20.00, 'active')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  location = VALUES(location),
  dock_length = VALUES(dock_length),
  dock_width = VALUES(dock_width),
  status = VALUES(status);

INSERT INTO ships (dock_id, ship_name, loa, beam, draft, gt, dwt, stay_start, stay_end, status, created_by)
SELECT d.id, 'MV Ocean Pearl', 120.00, 18.00, 7.00, 5000.00, 3500.00,
       '2026-10-01 08:00:00', '2026-10-05 18:00:00', 'in_progress', u.id
FROM docks d
JOIN users u ON u.username = 'admin'
WHERE d.code = 'IR'
  AND NOT EXISTS (
    SELECT 1 FROM ships s
    WHERE s.dock_id = d.id AND s.ship_name = 'MV Ocean Pearl'
      AND s.stay_start = '2026-10-01 08:00:00'
  );

INSERT INTO ships (dock_id, ship_name, loa, beam, draft, gt, dwt, stay_start, stay_end, status, created_by)
SELECT d.id, 'MV Nusantara', 150.00, 20.00, 8.50, 6200.00, 4300.00,
       '2026-10-02 09:00:00', '2026-10-06 17:00:00', 'waiting', u.id
FROM docks d
JOIN users u ON u.username = 'admin'
WHERE d.code = 'SMG'
  AND NOT EXISTS (
    SELECT 1 FROM ships s
    WHERE s.dock_id = d.id AND s.ship_name = 'MV Nusantara'
      AND s.stay_start = '2026-10-02 09:00:00'
  );

INSERT INTO ships (dock_id, ship_name, loa, beam, draft, gt, dwt, stay_start, stay_end, status, created_by)
SELECT d.id, 'MV Borneo', 95.00, 16.00, 6.20, 4200.00, 2800.00,
       '2026-10-03 10:00:00', '2026-10-04 20:00:00', 'waiting', u.id
FROM docks d
JOIN users u ON u.username = 'admin'
WHERE d.code = 'SBY'
  AND NOT EXISTS (
    SELECT 1 FROM ships s
    WHERE s.dock_id = d.id AND s.ship_name = 'MV Borneo'
      AND s.stay_start = '2026-10-03 10:00:00'
  );

INSERT INTO ships (dock_id, ship_name, loa, beam, draft, gt, dwt, stay_start, stay_end, status, created_by)
SELECT d.id, 'MV Celebes', 110.00, 17.00, 6.80, 4800.00, 3300.00,
       '2026-10-07 08:00:00', '2026-10-10 18:00:00', 'waiting', u.id
FROM docks d
JOIN users u ON u.username = 'employee01'
WHERE d.code = 'IR'
  AND NOT EXISTS (
    SELECT 1 FROM ships s
    WHERE s.dock_id = d.id AND s.ship_name = 'MV Celebes'
      AND s.stay_start = '2026-10-07 08:00:00'
  );

INSERT INTO vessel_sales (vessel_name, sales_type, budget, currency, created_by)
SELECT 'KRI Aru', 'Navy Vessels (KRI)', 2500000000.00, 'IDR', u.id
FROM users u
WHERE u.username = 'admin'
  AND NOT EXISTS (SELECT 1 FROM vessel_sales v WHERE v.vessel_name = 'KRI Aru');

INSERT INTO vessel_sales (vessel_name, sales_type, budget, currency, created_by)
SELECT 'MV Sinar Jaya', 'Commercial Vessel', 1500000000.00, 'IDR', u.id
FROM users u
WHERE u.username = 'employee01'
  AND NOT EXISTS (SELECT 1 FROM vessel_sales v WHERE v.vessel_name = 'MV Sinar Jaya');

INSERT INTO vessel_sales (vessel_name, sales_type, budget, currency, created_by)
SELECT 'Cargo Unit 7', 'Non-Vessel', 900000000.00, 'IDR', u.id
FROM users u
WHERE u.username = 'admin'
  AND NOT EXISTS (SELECT 1 FROM vessel_sales v WHERE v.vessel_name = 'Cargo Unit 7');

INSERT INTO sales_budget (vessel_id, category, amount, currency)
SELECT v.id, 'Maintenance', 500000000.00, 'IDR'
FROM vessel_sales v
WHERE v.vessel_name = 'KRI Aru'
  AND NOT EXISTS (
    SELECT 1 FROM sales_budget b
    WHERE b.vessel_id = v.id AND b.category = 'Maintenance'
  );

INSERT INTO sales_budget (vessel_id, category, amount, currency)
SELECT v.id, 'Operations', 650000000.00, 'IDR'
FROM vessel_sales v
WHERE v.vessel_name = 'MV Sinar Jaya'
  AND NOT EXISTS (
    SELECT 1 FROM sales_budget b
    WHERE b.vessel_id = v.id AND b.category = 'Operations'
  );

INSERT INTO sales_budget (vessel_id, category, amount, currency)
SELECT v.id, 'Logistics', 280000000.00, 'IDR'
FROM vessel_sales v
WHERE v.vessel_name = 'Cargo Unit 7'
  AND NOT EXISTS (
    SELECT 1 FROM sales_budget b
    WHERE b.vessel_id = v.id AND b.category = 'Logistics'
  );

INSERT INTO activity_logs (user_id, action, module, details)
SELECT u.id, 'login', 'auth', JSON_OBJECT('status', 'success')
FROM users u
WHERE u.username = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM activity_logs l
    WHERE l.user_id = u.id AND l.action = 'login' AND l.module = 'auth'
      AND JSON_CONTAINS(l.details, JSON_OBJECT('status', 'success'))
  );

INSERT INTO activity_logs (user_id, action, module, details)
SELECT u.id, 'create_ship', 'dock', JSON_OBJECT('dock', 'IR', 'ship', 'MV Ocean Pearl')
FROM users u
WHERE u.username = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM activity_logs l
    WHERE l.user_id = u.id AND l.action = 'create_ship' AND l.module = 'dock'
      AND JSON_CONTAINS(l.details, JSON_OBJECT('dock', 'IR', 'ship', 'MV Ocean Pearl'))
  );

INSERT INTO activity_logs (user_id, action, module, details)
SELECT u.id, 'create_vessel', 'sales', JSON_OBJECT('vessel', 'MV Sinar Jaya')
FROM users u
WHERE u.username = 'employee01'
  AND NOT EXISTS (
    SELECT 1 FROM activity_logs l
    WHERE l.user_id = u.id AND l.action = 'create_vessel' AND l.module = 'sales'
      AND JSON_CONTAINS(l.details, JSON_OBJECT('vessel', 'MV Sinar Jaya'))
  );

COMMIT;
