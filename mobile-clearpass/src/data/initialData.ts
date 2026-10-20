import {
  User,
  StudentProfile,
  PersonnelProfile,
  ClearanceForm,
  ClearancePeriod,
  ClearanceRequirement,
  ClearanceSignatory,
  StudentRequirementAssignment,
  RequirementSubmission,
  ClearanceRecord,
  DigitalSignature,
  NotificationItem,
} from '../types/clearpass';

export const INITIAL_USERS: User[] = [
  {
    user_id: 'usr_admin',
    auth_user_id: 'auth_admin_001',
    name: 'SIA School Administrator',
    email: 'admin@sia.edu.ph',
    role: 'Administrator',
    status: 1,
    created_at: '2026-08-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
  },
];

export const INITIAL_STUDENTS: StudentProfile[] = [];

export const INITIAL_PERSONNEL: PersonnelProfile[] = [];

export const INITIAL_CLEARANCE_FORMS: ClearanceForm[] = [];

export const INITIAL_CLEARANCE_PERIODS: ClearancePeriod[] = [];

export const INITIAL_SIGNATORIES: ClearanceSignatory[] = [];

export const INITIAL_REQUIREMENTS: ClearanceRequirement[] = [];

export const INITIAL_STUDENT_ASSIGNMENTS: StudentRequirementAssignment[] = [];

export const INITIAL_SUBMISSIONS: RequirementSubmission[] = [];

export const INITIAL_CLEARANCE_RECORDS: ClearanceRecord[] = [];

export const INITIAL_DIGITAL_SIGNATURES: DigitalSignature[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
