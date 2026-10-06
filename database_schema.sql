CREATE DATABASE IF NOT EXISTS db_digidocc
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE db_digidocc;

-- 1. Tabel user / login
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  id_number VARCHAR(20) NOT NULL,
  user_type ENUM('admin', 'employee', 'customer') NOT NULL DEFAULT 'employee',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Master data dok / pelabuhan
CREATE TABLE IF NOT EXISTS docks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(100) NOT NULL,
  dock_length DECIMAL(10,2) NOT NULL,
  dock_width DECIMAL(10,2) NOT NULL,
  status ENUM('active', 'maintenance', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Data kapal utama
CREATE TABLE IF NOT EXISTS ships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dock_id INT NOT NULL,
  ship_name VARCHAR(100) NOT NULL,
  loa DECIMAL(10,2) NOT NULL,
  beam DECIMAL(10,2) NOT NULL,
  draft DECIMAL(10,2) NOT NULL,
  gt DECIMAL(10,2) NOT NULL,
  dwt DECIMAL(10,2) NOT NULL,
  stay_start DATETIME NOT NULL,
  stay_end DATETIME NOT NULL,
  status ENUM('waiting', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'waiting',
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ships_dock FOREIGN KEY (dock_id) REFERENCES docks(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ships_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CHECK (stay_end >= stay_start)
);

-- 4. Jadwal pelabuhan / detail booking kapal per dok
CREATE TABLE IF NOT EXISTS ship_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ship_id INT NOT NULL,
  dock_id INT NOT NULL,
  schedule_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_schedule_ship FOREIGN KEY (ship_id) REFERENCES ships(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_schedule_dock FOREIGN KEY (dock_id) REFERENCES docks(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 5. Data vessel / omset
CREATE TABLE IF NOT EXISTS vessel_sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vessel_name VARCHAR(100) NOT NULL,
  sales_type ENUM('Navy Vessels (KRI)', 'Commercial Vessel', 'Non-Vessel') NOT NULL,
  budget DECIMAL(15,2) DEFAULT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'IDR',
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vessel_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 6. Budget / detail omset per vessel
CREATE TABLE IF NOT EXISTS sales_budget (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vessel_id INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'IDR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_budget_vessel FOREIGN KEY (vessel_id) REFERENCES vessel_sales(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 7. Log aktivitas
CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(100) NOT NULL,
  details JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Data master dok sesuai kebutuhan project
INSERT INTO docks (code, name, location, dock_length, dock_width, status)
VALUES
  ('IR', 'Irian', 'Irian', 225.00, 25.00, 'active'),
  ('SMG', 'Semarang', 'Semarang', 300.00, 32.00, 'active'),
  ('SBY', 'Surabaya', 'Surabaya', 128.00, 20.00, 'active')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  location = VALUES(location),
  dock_length = VALUES(dock_length),
  dock_width = VALUES(dock_width),
  status = VALUES(status);

-- Contoh admin akun awal
-- Password sebaiknya dibuat hash saat aplikasi login dijalankan.
INSERT INTO users (username, password_hash, id_number, user_type)
VALUES
  ('admin', '$2y$10$kY.SHo/jOZm40zctl.9pWuWQ.H71.Z6WxanXQYlrCqbboRkaiw7wG', 'ADM', 'admin')
ON DUPLICATE KEY UPDATE
  user_type = VALUES(user_type),
  password_hash = VALUES(password_hash);

-- Index tambahan untuk pencarian cepat
CREATE INDEX idx_ships_dock_status ON ships (dock_id, status);
CREATE INDEX idx_ships_date_range ON ships (stay_start, stay_end);
CREATE INDEX idx_vessel_sales_type ON vessel_sales (sales_type);
CREATE INDEX idx_activity_module ON activity_logs (module, created_at);
