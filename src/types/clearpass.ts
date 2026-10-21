export type UserRole = 'Student' | 'Personnel' | 'Administrator';

export interface User {
  user_id: string;
  auth_user_id: string;
  username?: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: number; // 1 = active, 0 = inactive
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  student_id: string;
  user_id: string;
  student_number: string; // LRN (e.g. 117947100018)
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix?: string;
  grade_level: string; // e.g. "Grade 9"
  section: string; // e.g. "Rose"
  school_level: string; // e.g. "Junior High School"
  school_year: string; // e.g. "2026-2027"
  status: number;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export type AdminStudentUpdate = Partial<StudentProfile> & {
  username?: string;
  password?: string;
};

export interface PersonnelProfile {
  personnel_id: string;
  user_id: string;
  employee_number: string; // e.g. "0001"
  full_name: string; // e.g. "Nelcris Bergsitin Asoro"
  office: string; // e.g. "Science Department"
  position: string; // e.g. "Science Department Head & Clearance Signatory"
  assigned_subject: string; // e.g. "Science"
  assigned_grade_level: string; // e.g. "Grade 9"
  assigned_section: string; // e.g. "Rose"
  is_department_head: boolean; // Only the Head of each department is authorized to sign!
  department_head_title?: string; // e.g. "Authorized Science Head Signatory"
  status: number;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ClearanceForm {
  clearance_form_id: string;
  form_name: string;
  description: string;
  school_year: string;
  school_level: string;
  term: string; // e.g. "Second Semester", "End of School Year"
  template_file_name?: string;
  status: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ClearancePeriod {
  period_id: string;
  clearance_form_id: string;
  school_year: string;
  school_level: string;
  term: string;
  start_date: string;
  end_date: string;
  status: 'Upcoming' | 'Ongoing' | 'Closed' | 'Inactive';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ClearanceRequirement {
  requirement_id: string;
  clearance_form_id: string;
  requirement_name: string; // e.g. "Activity 1: Create Science Model"
  description: string;
  office: string; // e.g. "Science", "Library", "Cashier", "Guidance", "Adviser"
  category: string; // e.g. "Science", "Mathematics", "English", "Library", "Finance"
  grade_level: string;
  section?: string;
  is_required: boolean;
  allowed_file_type: string; // e.g. "PDF, DOCX, JPG, PNG"
  max_file_size_mb: number; // e.g. 10
  personnel_id?: string;
  status: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ClearanceSignatory {
  signatory_id: string;
  clearance_form_id: string;
  personnel_id: string;
  personnel_name: string;
  office_role: string; // e.g. "Science Department Head", "Class Adviser / Homeroom Head", "Chief Librarian", "School Cashier / Comptroller", "Guidance Counselor", "Principal"
  is_department_head: boolean; // Only the designated Department Head has signing authority!
  department_code: string; // e.g. "SCIENCE", "CASHIER", "LIBRARY", "ADVISER", "GUIDANCE", "PRINCIPAL"
  signatory_order: number;
  status: number;
  assigned_by: string;
}

export type AssignmentStatus = 'Pending' | 'Submitted' | 'Approved' | 'Rejected' | 'With Remarks';

export interface StudentRequirementAssignment {
  assignment_id: string;
  student_id: string;
  requirement_id: string;
  period_id: string;
  status: AssignmentStatus;
  remarks?: string;
  signed_by_personnel_id?: string;
  signed_at?: string;
  assigned_by: string;
  assigned_at: string;
  updated_at: string;
}

export interface RequirementSubmission {
  submission_id: string;
  assignment_id: string;
  student_id: string;
  requirement_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size_kb: number;
  submission_status: 'Pending' | 'Approved' | 'Rejected' | 'With Remarks';
  remarks?: string;
  reviewed_by?: string;
  submitted_at: string;
  reviewed_at?: string;
  updated_at: string;
}

export type OverallClearanceStatus = 'Pending' | 'In Progress' | 'Cleared' | 'Incomplete';

export interface ClearanceRecord {
  clearance_record_id: string;
  student_id: string;
  clearance_form_id: string;
  period_id: string;
  school_year: string;
  term: string;
  overall_status: OverallClearanceStatus;
  progress_percentage: number;
  completed_at?: string;
  completed_form_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DigitalSignature {
  signature_id: string;
  clearance_record_id?: string;
  personnel_id: string;
  signature_data: string; // Base64 or SVG stroke path
  signature_status: 'active' | 'valid' | 'revoked';
  verification_code: string;
  signed_at: string;
  created_at: string;
}

export interface NotificationItem {
  notification_id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: 'Submission' | 'Approval' | 'Remark' | 'Status Update' | 'Clearance Completed';
  related_record_id?: string;
  is_read: boolean;
  created_at: string;
}
