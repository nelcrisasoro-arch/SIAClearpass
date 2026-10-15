-- =========================================================================
-- SIA ClearPass: Student Clearance Management System
-- St. Isidore Academy of Trinidad Bohol, Inc.
-- PostgreSQL Database Schema & Initial Seed Data
-- =========================================================================

-- 1. Create Database (Run in psql as superuser / postgres)
-- CREATE DATABASE sia_clearpass;
-- \c sia_clearpass;

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- Table 1: USERS (Authentication & Role Management)
-- =========================================================================
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('Administrator', 'Personnel', 'Student')),
    name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- Table 2: STUDENTS (Enrolled Learners - JHS Grades 7-10 & SHS Grades 11-12)
-- SDD Table 4.0
-- =========================================================================
CREATE TABLE IF NOT EXISTS students (
    student_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(user_id) ON DELETE CASCADE,
    student_number VARCHAR(20) UNIQUE NOT NULL, -- 12-digit DepEd LRN (e.g. 117947100018)
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),
    school_level VARCHAR(50) NOT NULL CHECK (school_level IN ('Junior High School', 'Senior High School')),
    grade_level VARCHAR(20) NOT NULL, -- Grade 7-10 for JHS, Grade 11-12 for SHS
    section VARCHAR(50) NOT NULL,     -- e.g. Rose, STEM A
    school_year VARCHAR(20) NOT NULL DEFAULT '2026-2027',
    avatar_url TEXT,
    phone_number VARCHAR(30),
    home_address TEXT,
    status INTEGER DEFAULT 1,         -- 1 = Active Enrolled, 0 = Inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- Table 3: PERSONNEL (Teachers, Signatories, & Department Heads)
-- SDD Table 5.0
-- =========================================================================
CREATE TABLE IF NOT EXISTS personnel (
    personnel_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(user_id) ON DELETE CASCADE,
    employee_number VARCHAR(30) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    office VARCHAR(100) NOT NULL,               -- e.g. Science Department, Finance & Accounting
    position VARCHAR(100) NOT NULL,             -- e.g. Science Department Head
    assigned_subject VARCHAR(100) NOT NULL,     -- e.g. Science, General Academics
    assigned_grade_level VARCHAR(20),
    assigned_section VARCHAR(50),
    is_department_head BOOLEAN DEFAULT FALSE,   -- Only authorized Department Heads sign official clearance
    department_head_title VARCHAR(150),
    avatar_url TEXT,
    phone_number VARCHAR(30),
    office_location VARCHAR(150),
    consultation_hours VARCHAR(100),
    status INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- Table 4: CLEARANCE FORMS (Document Structure per Level/Term)
-- SDD Table 1.0 & Figure 32
-- =========================================================================
CREATE TABLE IF NOT EXISTS clearance_forms (
    clearance_form_id VARCHAR(64) PRIMARY KEY,
    form_name VARCHAR(200) NOT NULL,
    school_year VARCHAR(20) NOT NULL,
    school_level VARCHAR(50) NOT NULL,
    term VARCHAR(50) NOT NULL,
    description TEXT,
    status INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- Table 5: CLEARANCE PERIODS (Active Clearance Schedule)
-- SDD Table 2.0 & Figure 33
-- =========================================================================
CREATE TABLE IF NOT EXISTS clearance_periods (
    period_id VARCHAR(64) PRIMARY KEY,
    school_year VARCHAR(20) NOT NULL,
    term VARCHAR(50) NOT NULL,
    school_level VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Ongoing' CHECK (status IN ('Upcoming', 'Ongoing', 'Closed', 'Archived')),
    created_by VARCHAR(64) REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- Table 6: CLEARANCE REQUIREMENTS (Deficiencies, Dues, Obligations)
-- SDD Table 3.0 & Figures 21, 25
-- =========================================================================
CREATE TABLE IF NOT EXISTS clearance_requirements (
    requirement_id VARCHAR(64) PRIMARY KEY,
    clearance_form_id VARCHAR(64) REFERENCES clearance_forms(clearance_form_id) ON DELETE CASCADE,
    office VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    requirement_type VARCHAR(50) NOT NULL, -- e.g. 'Laboratory Equipment', 'Tuition Fees', 'Textbook Return'
    submission_type VARCHAR(30) NOT NULL CHECK (submission_type IN ('File Upload', 'Physical Verification', 'Payment Confirmation')),
    due_date TIMESTAMP WITH TIME ZONE,
    target_grade_level VARCHAR(20) DEFAULT 'All',
    created_by VARCHAR(64) REFERENCES personnel(personnel_id),
    status INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- Table 7: STUDENT CLEARANCE RECORDS (Progress per Period)
-- SDD Table 6.0 & Figures 20, 28
-- =========================================================================
CREATE TABLE IF NOT EXISTS student_clearance_records (
    record_id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) REFERENCES students(student_id) ON DELETE CASCADE,
    period_id VARCHAR(64) REFERENCES clearance_periods(period_id) ON DELETE CASCADE,
    school_year VARCHAR(20) NOT NULL,
    term VARCHAR(50) NOT NULL,
    overall_status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (overall_status IN ('Pending', 'With Remarks', 'Cleared')),
    progress_percentage INTEGER DEFAULT 0,
    certificate_code VARCHAR(100),
    certificate_issued_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, period_id)
);

-- =========================================================================
-- Table 8: STUDENT SUBMISSIONS (Proof Uploads & Reviews)
-- Figures 21, 26
-- =========================================================================
CREATE TABLE IF NOT EXISTS student_submissions (
    submission_id VARCHAR(64) PRIMARY KEY,
    requirement_id VARCHAR(64) REFERENCES clearance_requirements(requirement_id) ON DELETE CASCADE,
    student_id VARCHAR(64) REFERENCES students(student_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT,
    file_type VARCHAR(50),
    file_size_kb INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'With Remarks')),
    remarks TEXT,
    reviewer_personnel_id VARCHAR(64) REFERENCES personnel(personnel_id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- Table 9: DIGITAL SIGNATURES (Department Head Clearances)
-- Figures 24, 28 & Certificate Stamp
-- =========================================================================
CREATE TABLE IF NOT EXISTS digital_signatures (
    signature_id VARCHAR(64) PRIMARY KEY,
    personnel_id VARCHAR(64) REFERENCES personnel(personnel_id) ON DELETE CASCADE,
    student_id VARCHAR(64) REFERENCES students(student_id) ON DELETE CASCADE,
    record_id VARCHAR(64) REFERENCES student_clearance_records(record_id) ON DELETE CASCADE,
    office VARCHAR(100) NOT NULL,
    signature_data TEXT NOT NULL,         -- Base64 Canvas Drawing / Signature Vector
    signature_hash VARCHAR(128) NOT NULL, -- SHA-256 Tamper-evident verification hash
    is_signed BOOLEAN DEFAULT TRUE,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (personnel_id, student_id, record_id)
);

-- =========================================================================
-- Table 10: NOTIFICATIONS (System Push Alerts)
-- =========================================================================
CREATE TABLE IF NOT EXISTS notifications (
    notification_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL, -- 'approval', 'remarks', 'period', 'system'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- INITIAL SEED DATA (admin account only; the administrator creates all other records)
-- =========================================================================

-- 1. Insert Administrator Account
INSERT INTO users (user_id, username, email, password_hash, role, name)
VALUES (
    'usr_admin',
    'admin',
    'admin@sia.edu.ph',
    'admin123', -- In production, use bcrypt hash
    'Administrator',
    'ClearPass System Administrator'
) ON CONFLICT (user_id) DO NOTHING;
