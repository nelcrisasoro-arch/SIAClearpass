-- SIA ClearPass core schema (MySQL 8+ / TiDB MySQL-compatible).
-- Run this in the selected database before starting the app.

CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL,
  name VARCHAR(150) NOT NULL,
  avatar_url TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  student_id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  student_number VARCHAR(20) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100) NOT NULL DEFAULT '',
  last_name VARCHAR(100) NOT NULL,
  suffix VARCHAR(20) NOT NULL DEFAULT '',
  school_level VARCHAR(50) NOT NULL,
  grade_level VARCHAR(20) NOT NULL,
  section VARCHAR(50) NOT NULL,
  school_year VARCHAR(20) NOT NULL DEFAULT '2026-2027',
  avatar_url TEXT NULL,
  status INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_students_user_id (user_id),
  INDEX idx_students_grade_section (grade_level, section)
);

CREATE TABLE IF NOT EXISTS personnel (
  personnel_id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  employee_number VARCHAR(30) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  office VARCHAR(100) NOT NULL,
  position VARCHAR(100) NOT NULL,
  assigned_subject VARCHAR(100) NOT NULL,
  assigned_grade_level VARCHAR(20) NOT NULL DEFAULT 'All Grades',
  assigned_section VARCHAR(50) NOT NULL DEFAULT 'All Sections',
  is_department_head BOOLEAN NOT NULL DEFAULT FALSE,
  department_head_title VARCHAR(150) NULL,
  avatar_url TEXT NULL,
  status INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_personnel_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS clearance_forms (
  clearance_form_id VARCHAR(64) PRIMARY KEY,
  form_name VARCHAR(200) NOT NULL,
  school_year VARCHAR(20) NOT NULL,
  school_level VARCHAR(50) NOT NULL,
  term VARCHAR(50) NOT NULL,
  description TEXT NULL,
  status INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clearance_periods (
  period_id VARCHAR(64) PRIMARY KEY,
  school_year VARCHAR(20) NOT NULL,
  term VARCHAR(50) NOT NULL,
  school_level VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Ongoing',
  created_by VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clearance_requirements (
  requirement_id VARCHAR(64) PRIMARY KEY,
  clearance_form_id VARCHAR(64) NULL,
  office VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  requirement_type VARCHAR(50) NOT NULL,
  submission_type VARCHAR(30) NOT NULL,
  due_date DATETIME NULL,
  target_grade_level VARCHAR(20) NOT NULL DEFAULT 'All',
  created_by VARCHAR(64) NULL,
  status INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_requirements_form (clearance_form_id)
);

CREATE TABLE IF NOT EXISTS student_clearance_records (
  record_id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  period_id VARCHAR(64) NULL,
  school_year VARCHAR(20) NOT NULL,
  term VARCHAR(50) NOT NULL,
  overall_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  progress_percentage INT NOT NULL DEFAULT 0,
  certificate_code VARCHAR(100) NULL,
  certificate_issued_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_student_period (student_id, period_id),
  INDEX idx_clearance_records_student (student_id)
);

CREATE TABLE IF NOT EXISTS student_submissions (
  submission_id VARCHAR(64) PRIMARY KEY,
  requirement_id VARCHAR(64) NOT NULL,
  student_id VARCHAR(64) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NULL,
  file_type VARCHAR(50) NULL,
  file_size_kb INT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  remarks TEXT NULL,
  reviewer_personnel_id VARCHAR(64) NULL,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_submissions_student (student_id),
  INDEX idx_submissions_requirement (requirement_id)
);

CREATE TABLE IF NOT EXISTS digital_signatures (
  signature_id VARCHAR(64) PRIMARY KEY,
  personnel_id VARCHAR(64) NOT NULL,
  student_id VARCHAR(64) NOT NULL,
  record_id VARCHAR(64) NULL,
  office VARCHAR(100) NOT NULL,
  signature_data LONGTEXT NOT NULL,
  signature_hash VARCHAR(128) NOT NULL,
  is_signed BOOLEAN NOT NULL DEFAULT TRUE,
  signed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_signature_person_student_record (personnel_id, student_id, record_id)
);

CREATE TABLE IF NOT EXISTS clearance_assignments (
  assignment_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  requirement_id VARCHAR(64) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  signed_by_personnel_id VARCHAR(64) NULL,
  signed_at DATETIME NULL,
  remarks TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_assignments_student (student_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user (user_id)
);

-- The app creates clearpass_app_state automatically the first time it connects.
