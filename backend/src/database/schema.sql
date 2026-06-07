-- =============================================================
-- MYS PLATFORM - DATABASE SCHEMA
-- Muslim Youth Summit Event Management System
-- =============================================================

CREATE DATABASE IF NOT EXISTS mys_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mys_platform;

-- -------------------------------------------------------------
-- ADMINS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(191) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('super_admin','admin','attendant') NOT NULL DEFAULT 'admin',
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- EVENTS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title                 VARCHAR(200) NOT NULL,
  edition               VARCHAR(20) NOT NULL COMMENT 'e.g. MYS3',
  slug                  VARCHAR(220) NOT NULL UNIQUE,
  tagline               VARCHAR(300),
  description           TEXT,
  venue                 VARCHAR(300),
  venue_address         TEXT,
  status                ENUM('draft','active','completed','archived') NOT NULL DEFAULT 'draft',
  -- date range (supports multi-day)
  start_date            DATE NOT NULL,
  end_date              DATE NOT NULL,
  -- ticket settings
  early_bird_closes_at  DATETIME,
  -- meta
  cover_image_url       VARCHAR(500),
  created_by            INT UNSIGNED NOT NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admins(id)
) ENGINE=InnoDB;

-- Only 1 event can be active at a time (enforced in app layer + trigger)
-- -------------------------------------------------------------
-- EVENT DAYS (multi-day schedule)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_days (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id    INT UNSIGNED NOT NULL,
  day_number  TINYINT UNSIGNED NOT NULL COMMENT '1, 2, 3...',
  event_date  DATE NOT NULL,
  theme       VARCHAR(200),
  description TEXT,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE KEY uq_event_day (event_id, day_number)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- SPEAKERS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS speakers (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id    INT UNSIGNED COMMENT 'NULL = global speaker usable across events',
  name        VARCHAR(150) NOT NULL,
  title       VARCHAR(200),
  bio         TEXT,
  photo_url   VARCHAR(500),
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- LECTURES / SESSIONS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lectures (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id        INT UNSIGNED NOT NULL,
  event_day_id    INT UNSIGNED,
  title           VARCHAR(300) NOT NULL,
  description     TEXT,
  lecture_type    ENUM('lecture','panel','workshop','keynote','other') NOT NULL DEFAULT 'lecture',
  start_time      TIME,
  end_time        TIME,
  sort_order      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (event_day_id) REFERENCES event_days(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- lecture ↔ speaker many-to-many
CREATE TABLE IF NOT EXISTS lecture_speakers (
  lecture_id  INT UNSIGNED NOT NULL,
  speaker_id  INT UNSIGNED NOT NULL,
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (lecture_id, speaker_id),
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
  FOREIGN KEY (speaker_id) REFERENCES speakers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- TICKET TYPES
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_types (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id              INT UNSIGNED NOT NULL,
  name                  VARCHAR(100) NOT NULL COMMENT 'e.g. Regular, VIP',
  regular_price         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  early_bird_price      DECIMAL(10,2),
  quantity_available    INT UNSIGNED COMMENT 'NULL = unlimited',
  quantity_sold         INT UNSIGNED NOT NULL DEFAULT 0,
  is_active             TINYINT(1) NOT NULL DEFAULT 1,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- PARTICIPANTS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS participants (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(150) NOT NULL,
  email             VARCHAR(191) NOT NULL,
  phone             VARCHAR(30),
  gender            ENUM('male','female','prefer_not_to_say'),
  occupation        VARCHAR(150),
  email_subscribed  TINYINT(1) NOT NULL DEFAULT 1,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_participant_email (email)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- TICKETS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id            INT UNSIGNED NOT NULL,
  ticket_type_id      INT UNSIGNED NOT NULL,
  participant_id      INT UNSIGNED NOT NULL,
  unique_number       VARCHAR(30) NOT NULL UNIQUE COMMENT 'e.g. MYS3-0001',
  qr_code_svg         MEDIUMTEXT COMMENT 'Rendered SVG',
  amount_paid         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  paystack_reference  VARCHAR(100) UNIQUE,
  status              ENUM('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
  is_early_bird       TINYINT(1) NOT NULL DEFAULT 0,
  purchased_at        DATETIME,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id),
  FOREIGN KEY (participant_id) REFERENCES participants(id)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- EVENT TAGS (physical entry tags)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_tags (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id        INT UNSIGNED NOT NULL,
  tag_number      VARCHAR(20) NOT NULL COMMENT 'e.g. TAG-001',
  qr_code_svg     MEDIUMTEXT,
  ticket_id       INT UNSIGNED UNIQUE COMMENT 'NULL = unassigned',
  participant_id  INT UNSIGNED COMMENT 'denormalised for quick lookup',
  assigned_at     DATETIME,
  assigned_by     INT UNSIGNED COMMENT 'admin who assigned',
  is_printed      TINYINT(1) NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL,
  FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_by) REFERENCES admins(id) ON DELETE SET NULL,
  UNIQUE KEY uq_event_tag (event_id, tag_number)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- ATTENDANCE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id        INT UNSIGNED NOT NULL,
  ticket_id       INT UNSIGNED NOT NULL,
  tag_id          INT UNSIGNED COMMENT 'event_tags.id',
  day_id          INT UNSIGNED COMMENT 'event_days.id, NULL = all-day',
  checked_in_at   DATETIME,
  checked_out_at  DATETIME,
  check_in_by     INT UNSIGNED COMMENT 'admin/attendant',
  check_out_by    INT UNSIGNED,
  notes           TEXT,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (ticket_id) REFERENCES tickets(id),
  FOREIGN KEY (tag_id) REFERENCES event_tags(id) ON DELETE SET NULL,
  FOREIGN KEY (check_in_by) REFERENCES admins(id) ON DELETE SET NULL,
  FOREIGN KEY (check_out_by) REFERENCES admins(id) ON DELETE SET NULL,
  UNIQUE KEY uq_ticket_attendance (ticket_id)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- EVENT GALLERY
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_gallery (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id        INT UNSIGNED NOT NULL,
  image_url       VARCHAR(500) NOT NULL,
  thumbnail_url   VARCHAR(500),
  caption         VARCHAR(300),
  sort_order      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  uploaded_by     INT UNSIGNED,
  uploaded_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- EMAIL CAMPAIGNS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_campaigns (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id         INT UNSIGNED,
  subject          VARCHAR(300) NOT NULL,
  body_html        MEDIUMTEXT NOT NULL,
  body_text        MEDIUMTEXT,
  recipient_type   ENUM('all','past_attendees') NOT NULL DEFAULT 'all',
  status           ENUM('draft','sending','sent','failed') NOT NULL DEFAULT 'draft',
  recipient_count  INT UNSIGNED NOT NULL DEFAULT 0,
  sent_count       INT UNSIGNED NOT NULL DEFAULT 0,
  failed_count     INT UNSIGNED NOT NULL DEFAULT 0,
  created_by       INT UNSIGNED,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at          DATETIME,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS email_logs (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  campaign_id     INT UNSIGNED NOT NULL,
  participant_id  INT UNSIGNED,
  email           VARCHAR(191) NOT NULL,
  status          ENUM('sent','failed') NOT NULL,
  error_message   TEXT,
  sent_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =============================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_tickets_participant ON tickets(participant_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_attendance_event ON attendance(event_id);
CREATE INDEX idx_event_tags_event ON event_tags(event_id);
CREATE INDEX idx_gallery_event ON event_gallery(event_id, sort_order);
