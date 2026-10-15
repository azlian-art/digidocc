-- Import this file into the existing db_digidocc database.

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(254) NULL,
    password_hash VARCHAR(255) NOT NULL,
    id_number VARCHAR(50) NOT NULL,
    user_type ENUM('admin', 'employee', 'customer') NOT NULL DEFAULT 'employee',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username),
    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_id_number (id_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @users_email_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'email'
);
SET @users_email_migration = IF(
    @users_email_exists = 0,
    'ALTER TABLE users ADD COLUMN email VARCHAR(254) NULL AFTER username',
    'SELECT 1'
);
PREPARE users_email_statement FROM @users_email_migration;
EXECUTE users_email_statement;
DEALLOCATE PREPARE users_email_statement;

SET @users_email_index_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND index_name = 'uq_users_email'
);
SET @users_email_index_migration = IF(
    @users_email_index_exists = 0,
    'ALTER TABLE users ADD UNIQUE KEY uq_users_email (email)',
    'SELECT 1'
);
PREPARE users_email_index_statement FROM @users_email_index_migration;
EXECUTE users_email_index_statement;
DEALLOCATE PREPARE users_email_index_statement;

CREATE TABLE IF NOT EXISTS docks (
    id INT UNSIGNED NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_docks_code (code),
    UNIQUE KEY uq_docks_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO docks (id, code, name) VALUES
    (1, 'BLUGA', 'Dock Bluga'),
    (2, 'ORCA', 'Dock Orca'),
    (3, 'SURABAYA', 'Dock Surabaya'),
    (4, 'LAMONGAN', 'Dock Lamongan')
ON DUPLICATE KEY UPDATE
    code = VALUES(code),
    name = VALUES(name);

CREATE TABLE IF NOT EXISTS ships (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    dock_id INT UNSIGNED NOT NULL,
    ship_name VARCHAR(150) NOT NULL,
    loa DECIMAL(10,2) NOT NULL,
    loa_max DECIMAL(10,2) NULL,
    loa_text TEXT NULL,
    beam DECIMAL(10,2) NOT NULL,
    beam_max DECIMAL(10,2) NULL,
    beam_text TEXT NULL,
    draft DECIMAL(10,2) NOT NULL DEFAULT 0,
    draft_max DECIMAL(10,2) NULL,
    draft_text TEXT NULL,
    gt DECIMAL(12,2) NOT NULL DEFAULT 0,
    gt_max DECIMAL(12,2) NULL,
    gt_text TEXT NULL,
    dwt DECIMAL(12,2) NOT NULL DEFAULT 0,
    dwt_max DECIMAL(12,2) NULL,
    dwt_text TEXT NULL,
    stay_start DATETIME NOT NULL,
    stay_end DATETIME NOT NULL,
    schedule_date DATE NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ships_dock_stay_start (dock_id, stay_start),
    CONSTRAINT fk_ships_dock
        FOREIGN KEY (dock_id) REFERENCES docks (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @schedule_date_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'ships'
      AND column_name = 'schedule_date'
);
SET @schedule_date_migration = IF(
    @schedule_date_exists = 0,
    'ALTER TABLE ships ADD COLUMN schedule_date DATE NULL AFTER stay_end',
    'SELECT 1'
);
PREPARE schedule_date_statement FROM @schedule_date_migration;
EXECUTE schedule_date_statement;
DEALLOCATE PREPARE schedule_date_statement;

SET @beam_max_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'ships'
      AND column_name = 'beam_max'
);
SET @beam_max_migration = IF(
    @beam_max_exists = 0,
    'ALTER TABLE ships ADD COLUMN beam_max DECIMAL(10,2) NULL AFTER beam',
    'SELECT 1'
);
PREPARE beam_max_statement FROM @beam_max_migration;
EXECUTE beam_max_statement;
DEALLOCATE PREPARE beam_max_statement;

SET @beam_text_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'ships'
      AND column_name = 'beam_text'
);
SET @beam_text_migration = IF(
    @beam_text_exists = 0,
    'ALTER TABLE ships ADD COLUMN beam_text TEXT NULL AFTER beam_max',
    'SELECT 1'
);
PREPARE beam_text_statement FROM @beam_text_migration;
EXECUTE beam_text_statement;
DEALLOCATE PREPARE beam_text_statement;

SET @gt_max_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'ships'
      AND column_name = 'gt_max'
);
SET @gt_max_migration = IF(
    @gt_max_exists = 0,
    'ALTER TABLE ships ADD COLUMN gt_max DECIMAL(12,2) NULL AFTER gt',
    'SELECT 1'
);
PREPARE gt_max_statement FROM @gt_max_migration;
EXECUTE gt_max_statement;
DEALLOCATE PREPARE gt_max_statement;

SET @gt_text_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'ships'
      AND column_name = 'gt_text'
);
SET @gt_text_migration = IF(
    @gt_text_exists = 0,
    'ALTER TABLE ships ADD COLUMN gt_text TEXT NULL AFTER gt_max',
    'SELECT 1'
);
PREPARE gt_text_statement FROM @gt_text_migration;
EXECUTE gt_text_statement;
DEALLOCATE PREPARE gt_text_statement;

SET @dwt_max_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'ships'
      AND column_name = 'dwt_max'
);
SET @dwt_max_migration = IF(
    @dwt_max_exists = 0,
    'ALTER TABLE ships ADD COLUMN dwt_max DECIMAL(12,2) NULL AFTER dwt',
    'SELECT 1'
);
PREPARE dwt_max_statement FROM @dwt_max_migration;
EXECUTE dwt_max_statement;
DEALLOCATE PREPARE dwt_max_statement;

SET @dwt_text_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'ships'
      AND column_name = 'dwt_text'
);
SET @dwt_text_migration = IF(
    @dwt_text_exists = 0,
    'ALTER TABLE ships ADD COLUMN dwt_text TEXT NULL AFTER dwt_max',
    'SELECT 1'
);
PREPARE dwt_text_statement FROM @dwt_text_migration;
EXECUTE dwt_text_statement;
DEALLOCATE PREPARE dwt_text_statement;

SET @loa_max_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'ships'
      AND column_name = 'loa_max'
);
SET @loa_max_migration = IF(
    @loa_max_exists = 0,
    'ALTER TABLE ships ADD COLUMN loa_max DECIMAL(10,2) NULL AFTER loa',
    'SELECT 1'
);
PREPARE loa_max_statement FROM @loa_max_migration;
EXECUTE loa_max_statement;
DEALLOCATE PREPARE loa_max_statement;

SET @loa_text_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'ships'
      AND column_name = 'loa_text'
);
SET @loa_text_migration = IF(
    @loa_text_exists = 0,
    'ALTER TABLE ships ADD COLUMN loa_text TEXT NULL AFTER loa_max',
    'SELECT 1'
);
PREPARE loa_text_statement FROM @loa_text_migration;
EXECUTE loa_text_statement;
DEALLOCATE PREPARE loa_text_statement;

SET @draft_max_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'ships'
      AND column_name = 'draft_max'
);
SET @draft_max_migration = IF(
    @draft_max_exists = 0,
    'ALTER TABLE ships ADD COLUMN draft_max DECIMAL(10,2) NULL AFTER draft',
    'SELECT 1'
);
PREPARE draft_max_statement FROM @draft_max_migration;
EXECUTE draft_max_statement;
DEALLOCATE PREPARE draft_max_statement;

SET @draft_text_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'ships'
      AND column_name = 'draft_text'
);
SET @draft_text_migration = IF(
    @draft_text_exists = 0,
    'ALTER TABLE ships ADD COLUMN draft_text TEXT NULL AFTER draft_max',
    'SELECT 1'
);
PREPARE draft_text_statement FROM @draft_text_migration;
EXECUTE draft_text_statement;
DEALLOCATE PREPARE draft_text_statement;

CREATE TABLE IF NOT EXISTS vessel_sales (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    vessel_name VARCHAR(150) NOT NULL,
    sales_type VARCHAR(100) NOT NULL,
    budget DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency CHAR(3) NOT NULL DEFAULT 'IDR',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_vessel_sales_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mro_sales_records (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    vessel_name VARCHAR(150) NOT NULL,
    sales_type VARCHAR(100) NOT NULL,
    budget DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency CHAR(3) NOT NULL DEFAULT 'IDR',
    target_sales_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    project_start DATE NULL,
    project_end DATE NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_mro_sales_records_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mro_sales_weeks (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    sales_record_id INT UNSIGNED NOT NULL,
    week_number INT UNSIGNED NOT NULL,
    cost DECIMAL(15,2) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_mro_sales_weeks_record_week (sales_record_id, week_number),
    CONSTRAINT fk_mro_sales_weeks_record
        FOREIGN KEY (sales_record_id) REFERENCES mro_sales_records (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS workshop_bookings (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    request_id VARCHAR(40) NOT NULL,
    status ENUM('Under Review', 'Approved', 'Rejected') NOT NULL DEFAULT 'Under Review',
    company_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    country_region VARCHAR(100) NULL,
    company_website VARCHAR(255) NULL,
    vessel_name VARCHAR(150) NOT NULL,
    vessel_type VARCHAR(80) NOT NULL,
    imo_number VARCHAR(20) NULL,
    flag_country VARCHAR(100) NULL,
    dwt DECIMAL(12,2) UNSIGNED NULL,
    gross_tonnage DECIMAL(12,2) UNSIGNED NULL,
    loa DECIMAL(10,2) UNSIGNED NOT NULL,
    beam DECIMAL(10,2) UNSIGNED NOT NULL,
    draft DECIMAL(10,2) UNSIGNED NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    facility VARCHAR(100) NULL,
    planned_start_date DATE NOT NULL,
    duration_days INT UNSIGNED NOT NULL,
    scope_of_work TEXT NOT NULL,
    capabilities TEXT NULL,
    notes TEXT NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_workshop_bookings_request_id (request_id),
    KEY idx_workshop_bookings_status_created_at (status, created_at),
    KEY idx_workshop_bookings_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @workshop_rejection_reason_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'workshop_bookings'
      AND column_name = 'rejection_reason'
);
SET @workshop_rejection_reason_migration = IF(
    @workshop_rejection_reason_exists = 0,
    'ALTER TABLE workshop_bookings ADD COLUMN rejection_reason TEXT NULL AFTER notes',
    'SELECT 1'
);
PREPARE workshop_rejection_reason_statement FROM @workshop_rejection_reason_migration;
EXECUTE workshop_rejection_reason_statement;
DEALLOCATE PREPARE workshop_rejection_reason_statement;
