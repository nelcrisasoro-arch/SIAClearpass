import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  User,
  UserRole,
  StudentProfile,
  AdminStudentUpdate,
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
  AssignmentStatus,
} from '../types/clearpass';
import {
  INITIAL_USERS,
  INITIAL_STUDENTS,
  INITIAL_PERSONNEL,
  INITIAL_CLEARANCE_FORMS,
  INITIAL_CLEARANCE_PERIODS,
  INITIAL_SIGNATORIES,
  INITIAL_REQUIREMENTS,
  INITIAL_STUDENT_ASSIGNMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_CLEARANCE_RECORDS,
  INITIAL_DIGITAL_SIGNATURES,
  INITIAL_NOTIFICATIONS,
} from '../data/initialData';
import { apiFetch, apiUrl, realtimeUrl } from '../utils/api';
import { connectRealtime } from '../utils/realtime';
import { appStorage } from '../utils/storage';

export type DeviceMode = 'mobile' | 'responsive' | 'admin_web';

interface ClearPassContextType {
  // State
  users: User[];
  students: StudentProfile[];
  personnel: PersonnelProfile[];
  clearanceForms: ClearanceForm[];
  clearancePeriods: ClearancePeriod[];
  signatories: ClearanceSignatory[];
  requirements: ClearanceRequirement[];
  assignments: StudentRequirementAssignment[];
  submissions: RequirementSubmission[];
  records: ClearanceRecord[];
  signatures: DigitalSignature[];
  notifications: NotificationItem[];
  currentUser: User | null;
  currentRole: UserRole;
  currentStudent: StudentProfile | null;
  currentPersonnel: PersonnelProfile | null;
  deviceMode: DeviceMode;
  activePeriod: ClearancePeriod | null;
  activeForm: ClearanceForm | null;
  isPhoneLocked: boolean;
  headsUpNotification: NotificationItem | null;
  pushPermissionGranted: boolean;
  syncError: string | null;

  // Actions
  setDeviceMode: (mode: DeviceMode) => void;
  setIsPhoneLocked: (locked: boolean) => void;
  dismissHeadsUp: () => void;
  requestSystemPushPermission: () => Promise<boolean>;
  triggerDemoPushNotification: (type?: 'approval' | 'remarks' | 'complete') => void;
  switchRole: (role: UserRole) => void;
  loginUser: (usernameOrRole: string, password?: string, expectedRole?: UserRole) => { success: boolean; role?: UserRole; message?: string };
  authenticateUser: (username: string, password: string, expectedRole?: UserRole | UserRole[]) => Promise<{ success: boolean; role?: UserRole; message?: string }>;
  logout: () => void;
  submitRequirement: (params: {
    assignment_id: string;
    requirement_id: string;
    student_id: string;
    file_name: string;
    file_url?: string;
    file_type?: string;
    file_size_kb?: number;
  }) => void;
  reviewSubmission: (params: {
    submission_id: string;
    status: 'Approved' | 'Rejected' | 'With Remarks';
    remarks?: string;
    reviewer_personnel_id: string;
  }) => void;
  saveSignature: (personnel_id: string, signature_data: string) => DigitalSignature;
  signClearanceForStudent: (personnel_id: string, student_id: string) => void;
  revokeClearanceSignatureForStudent: (params: {
    personnel_id: string;
    student_id: string;
    reason?: string;
  }) => void;
  addRequirement: (req: Omit<ClearanceRequirement, 'requirement_id' | 'created_at' | 'updated_at'>) => void;
  addClearanceForm: (form: Omit<ClearanceForm, 'clearance_form_id' | 'created_at' | 'updated_at'>) => void;
  addClearancePeriod: (period: Omit<ClearancePeriod, 'period_id' | 'created_at' | 'updated_at'>) => void;
  addUser: (params: {
    name: string;
    email: string;
    role: UserRole;
    username?: string;
    studentNumber?: string;
    employeeNumber?: string;
    schoolLevel?: string;
    gradeLevel?: string;
    section?: string;
    office?: string;
    position?: string;
    assignedSubject?: string;
    userId?: string;
    studentId?: string;
    personnelId?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    suffix?: string;
    schoolYear?: string;
  }) => void;
  deleteUser: (userId: string) => Promise<void>;
  updateAdminStudent: (student_id: string, updates: AdminStudentUpdate) => Promise<void>;
  updateAdminPersonnel: (personnel_id: string, updates: Partial<PersonnelProfile>) => Promise<void>;
  updateStudentProfile: (student_id: string, updates: Partial<StudentProfile>) => void;
  updatePersonnelProfile: (personnel_id: string, updates: Partial<PersonnelProfile>) => void;
  markNotificationRead: (notification_id: string) => void;
  markAllNotificationsRead: () => void;
  resetAllData: () => void;
  getStudentProgress: (student_id: string) => {
    percentage: number;
    total: number;
    approved: number;
    pending: number;
    withRemarks: number;
    allSigned: boolean;
  };
}

const STORAGE_KEY = 'sia_clearpass_state_v3';

const readApiResponse = async (response: Response): Promise<Record<string, unknown>> => {
  const body = await response.text();
  if (!body.trim()) {
    throw new Error(`Server returned an empty response (${response.status}). Restart the API server and try again.`);
  }

  try {
    const result: unknown = JSON.parse(body);
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      return result as Record<string, unknown>;
    }
    throw new Error('Server returned an invalid response.');
  } catch (error) {
    if (error instanceof SyntaxError) {
      const details = body.trim().slice(0, 200);
      throw new Error(`Server returned a non-JSON response (${response.status})${details ? `: ${details}` : '.'}`);
    }
    throw error;
  }
};

const ClearPassContext = createContext<ClearPassContextType | undefined>(undefined);

export const ClearPassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial from localStorage if available
  const [users, setUsers] = useState<User[]>(() => {
    const saved = appStorage.getItem(`${STORAGE_KEY}_users`);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [students, setStudents] = useState<StudentProfile[]>(() => {
    const saved = appStorage.getItem(`${STORAGE_KEY}_students`);
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [personnel, setPersonnel] = useState<PersonnelProfile[]>(() => {
    const saved = appStorage.getItem(`${STORAGE_KEY}_personnel`);
    return saved ? JSON.parse(saved) : INITIAL_PERSONNEL;
  });

  const [clearanceForms, setClearanceForms] = useState<ClearanceForm[]>(() => {
    const saved = appStorage.getItem(`${STORAGE_KEY}_forms`);
    return saved ? JSON.parse(saved) : INITIAL_CLEARANCE_FORMS;
  });

  const [clearancePeriods, setClearancePeriods] = useState<ClearancePeriod[]>(() => {
    const saved = appStorage.getItem(`${STORAGE_KEY}_periods`);
    return saved ? JSON.parse(saved) : INITIAL_CLEARANCE_PERIODS;
  });

  const [signatories, setSignatories] = useState<ClearanceSignatory[]>(() => {
    const saved = appStorage.getItem(`${STORAGE_KEY}_signatories`);
    return saved ? JSON.parse(saved) : INITIAL_SIGNATORIES;
  });

  const [requirements, setRequirements] = useState<ClearanceRequirement[]>(() => {
    const saved = appStorage.getItem(`${STORAGE_KEY}_requirements`);
    return saved ? JSON.parse(saved) : INITIAL_REQUIREMENTS;
  });

  const [assignments, setAssignments] = useState<StudentRequirementAssignment[]>(() => {
    const saved = appStorage.getItem(`${STORAGE_KEY}_assignments`);
    return saved ? JSON.parse(saved) : INITIAL_STUDENT_ASSIGNMENTS;
  });

  const [submissions, setSubmissions] = useState<RequirementSubmission[]>(() => {
    const saved = appStorage.getItem(`${STORAGE_KEY}_submissions`);
    return saved ? JSON.parse(saved) : INITIAL_SUBMISSIONS;
  });

  const [records, setRecords] = useState<ClearanceRecord[]>(() => {
    const saved = appStorage.getItem(`${STORAGE_KEY}_records`);
    return saved ? JSON.parse(saved) : INITIAL_CLEARANCE_RECORDS;
  });

  const [signatures, setSignatures] = useState<DigitalSignature[]>(() => {
    const saved = appStorage.getItem(`${STORAGE_KEY}_signatures`);
    return saved ? JSON.parse(saved) : INITIAL_DIGITAL_SIGNATURES;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = appStorage.getItem(`${STORAGE_KEY}_notifications`);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });
  const [syncError, setSyncError] = useState<string | null>(null);
  const [serverStateLoaded, setServerStateLoaded] = useState(false);
  const lastSyncedState = useRef<string | null>(null);
  const serverStateVersion = useRef<number | null>(null);
  const stateSyncQueue = useRef<Promise<void>>(Promise.resolve());
  const syncClientId = useRef(`client_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  const getDataSnapshot = () => ({
    users,
    students,
    personnel,
    clearanceForms,
    clearancePeriods,
    signatories,
    requirements,
    assignments,
    submissions,
    records,
    signatures,
    notifications,
  });

  const [currentRole, setCurrentRole] = useState<UserRole>('Administrator');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setServerStateLoaded(false);
      return;
    }
    let active = true;
    let requestSequence = 0;
    let stateLoadInFlight = false;
    let loadRequested = false;
    let versionCheckInFlight = false;
    let versionTimer: ReturnType<typeof setInterval> | undefined;
    let realtimeConnected = false;

    const loadSharedState = async () => {
      if (stateLoadInFlight) {
        loadRequested = true;
        return;
      }
      stateLoadInFlight = true;
      const requestId = ++requestSequence;
      try {
        const response = await apiFetch('/api/state', { cache: 'no-store' });
        if (response.status === 401) {
          if (active) {
            appStorage.removeItem('sia_clearpass_session');
            setSyncError('Your session expired. Sign in again to sync clearance changes.');
            setServerStateLoaded(false);
            setCurrentUser(null);
          }
          return;
        }
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || `Database sync failed (${response.status}).`);
        }

        if (active && requestId === requestSequence && result.state) {
          const state = result.state;
          if (JSON.stringify(state) !== lastSyncedState.current) {
            setUsers(Array.isArray(state.users) ? state.users : INITIAL_USERS);
            setStudents(Array.isArray(state.students) ? state.students : INITIAL_STUDENTS);
            setPersonnel(Array.isArray(state.personnel) ? state.personnel : INITIAL_PERSONNEL);
            setClearanceForms(Array.isArray(state.clearanceForms) ? state.clearanceForms : INITIAL_CLEARANCE_FORMS);
            setClearancePeriods(Array.isArray(state.clearancePeriods) ? state.clearancePeriods : INITIAL_CLEARANCE_PERIODS);
            setSignatories(Array.isArray(state.signatories) ? state.signatories : INITIAL_SIGNATORIES);
            setRequirements(Array.isArray(state.requirements) ? state.requirements : INITIAL_REQUIREMENTS);
            setAssignments(Array.isArray(state.assignments) ? state.assignments : INITIAL_STUDENT_ASSIGNMENTS);
            setSubmissions(Array.isArray(state.submissions) ? state.submissions : INITIAL_SUBMISSIONS);
            setRecords(Array.isArray(state.records) ? state.records : INITIAL_CLEARANCE_RECORDS);
            setSignatures(Array.isArray(state.signatures) ? state.signatures : INITIAL_DIGITAL_SIGNATURES);
            setNotifications(Array.isArray(state.notifications) ? state.notifications : INITIAL_NOTIFICATIONS);
            lastSyncedState.current = JSON.stringify(state);
            serverStateVersion.current = Number(result.revision ?? 0);
          }
        }
        if (active && requestId === requestSequence) {
          serverStateVersion.current = Number(result.revision ?? 0);
          if (realtimeConnected) setSyncError(null);
          setServerStateLoaded(true);
        }
      } catch (error) {
        if (active && requestId === requestSequence) {
          const message = error instanceof Error ? error.message : 'Unknown database sync error.';
          console.error('[ClearPass shared state load failed]:', error);
          setSyncError(message);
          setServerStateLoaded(true);
        }
      } finally {
        stateLoadInFlight = false;
        if (loadRequested && active) {
          loadRequested = false;
          void loadSharedState();
        }
      }
    };

    const checkStateVersion = async () => {
      if (!active || versionCheckInFlight) return;
      versionCheckInFlight = true;
      try {
        const response = await apiFetch('/api/state/version', { cache: 'no-store' });
        if (response.status === 401) {
          appStorage.removeItem('sia_clearpass_session');
          setSyncError('Your session expired. Sign in again to sync clearance changes.');
          setServerStateLoaded(false);
          setCurrentUser(null);
          return;
        }
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || `Database sync failed (${response.status}).`);
        }
        const revision = Number(result.revision ?? 0);
        if (serverStateVersion.current === null || revision !== serverStateVersion.current) {
          void loadSharedState();
        }
      } catch (error) {
        if (active) {
          const message = error instanceof Error ? error.message : 'Could not check for shared updates.';
          setSyncError(message);
        }
      } finally {
        versionCheckInFlight = false;
      }
    };

    void loadSharedState();
    const realtimeConnection = connectRealtime(realtimeUrl(), {
      onOpen: () => {
        realtimeConnected = true;
        if (active) setSyncError(null);
        void loadSharedState();
      },
      onMessage: (message) => {
        try {
          const event = JSON.parse(message.data);
          const isOwnStateUpdate = event.type === 'STATE_UPDATED' && event.data?.source === syncClientId.current;
          if (!isOwnStateUpdate && event.type !== 'CONNECTED' && event.type !== 'HEARTBEAT') {
            void loadSharedState();
          }
        } catch (error) {
          console.error('[ClearPass realtime event parse failed]:', error);
        }
      },
      onError: () => {
        realtimeConnected = false;
        if (active) setSyncError('Realtime stream interrupted. Checking for updates every 2 seconds.');
      },
    });
    if (!realtimeConnection) setSyncError('Realtime stream unavailable. Checking for updates every 2 seconds.');
    versionTimer = setInterval(() => { void checkStateVersion(); }, 2000);
    void checkStateVersion();

    return () => {
      active = false;
      realtimeConnection?.close();
      if (versionTimer) clearInterval(versionTimer);
    };
  }, [currentUser]);

  // Current session
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('mobile');
  const [isPhoneLocked, setIsPhoneLocked] = useState(false);
  const [headsUpNotification, setHeadsUpNotification] = useState<NotificationItem | null>(null);
  const [pushPermissionGranted, setPushPermissionGranted] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // AudioContext unavailable or blocked
    }
  };

  const dispatchPush = (item: NotificationItem) => {
    playNotificationChime();
    setHeadsUpNotification(item);
    setTimeout(() => {
      setHeadsUpNotification((current) => (current?.notification_id === item.notification_id ? null : current));
    }, 6000);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(item.title, {
          body: item.message,
          icon: '/src/assets/images/sia_school_logo.jpg',
        });
      } catch (err) {
        console.error('System notification error:', err);
      }
    }
  };

  const requestSystemPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        const granted = res === 'granted';
        setPushPermissionGranted(granted);
        return granted;
      } catch {
        return false;
      }
    }
    return false;
  };

  const dismissHeadsUp = () => {
    setHeadsUpNotification(null);
  };

  const triggerDemoPushNotification = (type: 'approval' | 'remarks' | 'complete' = 'approval') => {
    const now = new Date().toISOString();
    let notif: NotificationItem;
    if (type === 'complete') {
      notif = {
        notification_id: 'notif_demo_' + Date.now(),
        user_id: 'usr_student_joseph',
        title: 'Clearance Completed',
        message: 'Congratulations! All required school offices have verified and approved your clearance. Your Official Form is ready to download.',
        notification_type: 'Clearance Completed',
        is_read: false,
        created_at: now,
      };
    } else if (type === 'remarks') {
      notif = {
        notification_id: 'notif_demo_' + Date.now(),
        user_id: 'usr_student_joseph',
        title: 'Task Remarks - Science Activity 1',
        message: 'Mr. Nelcris Asoro: "Please attach clear photo of working model circuit diagram before final sign-off."',
        notification_type: 'Remark',
        is_read: false,
        created_at: now,
      };
    } else {
      notif = {
        notification_id: 'notif_demo_' + Date.now(),
        user_id: 'usr_student_joseph',
        title: 'Science Signed - Mr. Nelcris Asoro',
        message: 'Your Science clearance has been approved and digitally signed. Clearance progress updated!',
        notification_type: 'Approval',
        is_read: false,
        created_at: now,
      };
    }

    setNotifications(prev => [notif, ...prev]);
    dispatchPush(notif);
  };

  // Sync to local storage
  useEffect(() => {
    appStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
    appStorage.setItem(`${STORAGE_KEY}_students`, JSON.stringify(students));
    appStorage.setItem(`${STORAGE_KEY}_personnel`, JSON.stringify(personnel));
    appStorage.setItem(`${STORAGE_KEY}_forms`, JSON.stringify(clearanceForms));
    appStorage.setItem(`${STORAGE_KEY}_periods`, JSON.stringify(clearancePeriods));
    appStorage.setItem(`${STORAGE_KEY}_signatories`, JSON.stringify(signatories));
    appStorage.setItem(`${STORAGE_KEY}_requirements`, JSON.stringify(requirements));
    appStorage.setItem(`${STORAGE_KEY}_assignments`, JSON.stringify(assignments));
    appStorage.setItem(`${STORAGE_KEY}_submissions`, JSON.stringify(submissions));
    appStorage.setItem(`${STORAGE_KEY}_records`, JSON.stringify(records));
    appStorage.setItem(`${STORAGE_KEY}_signatures`, JSON.stringify(signatures));
    appStorage.setItem(`${STORAGE_KEY}_notifications`, JSON.stringify(notifications));
  }, [users, students, personnel, clearanceForms, clearancePeriods, signatories, requirements, assignments, submissions, records, signatures, notifications]);

  useEffect(() => {
    if (!currentUser || !serverStateLoaded) return;
    const state = getDataSnapshot();
    const serializedState = JSON.stringify(state);
    if (serializedState === lastSyncedState.current) return;

    stateSyncQueue.current = stateSyncQueue.current.catch(() => undefined).then(async () => {
      if (serializedState === lastSyncedState.current) return;
      try {
        const response = await apiFetch('/api/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state, source: syncClientId.current }),
        });
        if (response.status === 401) {
          appStorage.removeItem('sia_clearpass_session');
          setSyncError('Your session expired. Sign in again to save and sync clearance changes.');
          setServerStateLoaded(false);
          setCurrentUser(null);
          return;
        }
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || `Database sync failed (${response.status}).`);
        }
        lastSyncedState.current = serializedState;
        if (result.revision !== undefined) serverStateVersion.current = Number(result.revision);
        setSyncError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown database sync error.';
        console.error('[ClearPass shared state save failed]:', error);
        setSyncError(message);
      }
    });
  }, [currentUser, serverStateLoaded, users, students, personnel, clearanceForms, clearancePeriods, signatories, requirements, assignments, submissions, records, signatures, notifications]);

  // Derived active items
  const activePeriod = clearancePeriods.find(p => p.status === 'Ongoing') || clearancePeriods[0] || null;
  const activeForm = clearanceForms.find(f => f.status === 1) || clearanceForms[0] || null;

  const currentStudent = currentUser && currentUser.role === 'Student'
    ? students.find(s => s.user_id === currentUser.user_id) || students[0]
    : null;

  const currentPersonnel = currentUser && currentUser.role === 'Personnel'
    ? personnel.find(p => p.user_id === currentUser.user_id) || personnel[0]
    : null;

  // Switch Role
  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    const targetUser = users.find(u => u.role === role);
    if (targetUser) {
      setCurrentUser(targetUser);
    }
  };

  const loginUser = (usernameOrRole: string, passwordInput?: string, expectedRole?: UserRole) => {
    const term = usernameOrRole.trim().toLowerCase();
    const pass = passwordInput ? passwordInput.trim() : '';

    // 1. Check if user is a Student
    // Keep the local preview login compatible with accounts created before the database login flow.
    const matchedStudent = students.find(s => {
      const u = users.find(user => user.user_id === s.user_id);
      const studentUsername = `${s.first_name}.${s.last_name}`.toLowerCase();
      const emailUsername = u?.email.split('@')[0].toLowerCase();
      return (
        s.student_number === term ||
        studentUsername === term ||
        emailUsername === term ||
        s.first_name.toLowerCase() === term ||
        s.last_name.toLowerCase() === term
      );
    });

    if (matchedStudent) {
      if (expectedRole && expectedRole !== 'Student') {
        return { success: false, message: 'Invalid login credentials for the selected role.' };
      }

      const lrn = matchedStudent.student_number;
      const last4Lrn = lrn.slice(-4); // e.g. "0018"
      const isValidPassword = !pass || pass === last4Lrn || pass === lrn || pass === 'password123';

      if (!isValidPassword) {
        return {
          success: false,
          message: 'Incorrect password. Use the password provided by the school administrator or ask them to reset it.',
        };

      }

      const user = users.find(u => u.user_id === matchedStudent.user_id);
      if (user) {
        setCurrentRole('Student');
        setCurrentUser(user);
        return { success: true, role: 'Student' as UserRole };
      }
    }

    // 2. Check if user is School Personnel
    // Locked to their designated department/office!
    const matchedPersonnel = personnel.find(p => {
      const u = users.find(user => user.user_id === p.user_id);
      const pUsername = `${p.full_name.split(' ')[0]}.${p.full_name.split(' ').slice(-1)[0]}`.toLowerCase();
      const emailUsername = u?.email.split('@')[0].toLowerCase();
      return (
        p.employee_number === term ||
        pUsername === term ||
        emailUsername === term ||
        p.full_name.toLowerCase().includes(term) ||
        p.office.toLowerCase().includes(term) ||
        p.assigned_subject.toLowerCase() === term
      );
    });

    if (matchedPersonnel) {
      if (expectedRole && expectedRole !== 'Personnel') {
        return { success: false, message: 'Invalid login credentials for the selected role.' };
      }

      const user = users.find(u => u.user_id === matchedPersonnel.user_id);
      if (user) {
        setCurrentRole('Personnel');
        setCurrentUser(user);
        return { success: true, role: 'Personnel' as UserRole };
      }
    }

    // 3. Check Admin
    if (term === 'admin') {
      if (expectedRole && expectedRole !== 'Administrator') {
        return { success: false, message: 'Invalid login credentials for the selected role.' };
      }

      const adminUser = users.find(u => u.role === 'Administrator');
      if (adminUser) {
        setCurrentRole('Administrator');
        setCurrentUser(adminUser);
        return { success: true, role: 'Administrator' as UserRole };
      }
    }

    // Fallback for legacy role matching
    const targetUser = users.find(u => u.role.toLowerCase() === term);
    if (targetUser && (!expectedRole || targetUser.role === expectedRole)) {
      setCurrentRole(targetUser.role);
      setCurrentUser(targetUser);
      return { success: true, role: targetUser.role };
    }

    return {
      success: false,
      message: 'Account not recognized. Check your assigned username and password with the school administrator.',
    };
  };

  const authenticateUser = async (username: string, password: string, expectedRole?: UserRole | UserRole[]) => {
    try {
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, expectedRole }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        return { success: false, message: result.message || 'Invalid username or password.' };
      }
      const allowedRoles = expectedRole ? (Array.isArray(expectedRole) ? expectedRole : [expectedRole]) : null;
      if (allowedRoles && !allowedRoles.includes(result.role)) {
        return { success: false, message: 'Invalid login credentials for the selected role.' };
      }

      if (result.sessionToken) appStorage.setItem('sia_clearpass_session', result.sessionToken);

      const now = new Date().toISOString();
      const authenticatedUser: User = {
        user_id: result.user.user_id,
        auth_user_id: `auth_${result.user.user_id}`,
        name: result.user.name,
        email: result.user.email || `${result.user.username}@sia.edu.ph`,
        role: result.role,
        status: result.user.status ?? 1,
        created_at: result.user.created_at || now,
        updated_at: result.user.updated_at || now,
      };
      setUsers(previous => previous.some(user => user.user_id === authenticatedUser.user_id)
        ? previous
        : [...previous, authenticatedUser]);

      if (result.student) {
        const student: StudentProfile = {
          student_id: result.student.student_id,
          user_id: result.student.user_id,
          student_number: result.student.student_number,
          first_name: result.student.first_name,
          middle_name: result.student.middle_name || '',
          last_name: result.student.last_name,
          school_level: result.student.school_level || 'Junior High School',
          school_year: result.student.school_year || '2026-2027',
          grade_level: result.student.grade_level,
          section: result.student.section,
          status: result.student.status ?? 1,
          created_at: result.student.created_at || now,
          updated_at: result.student.updated_at || now,
        };
        setStudents(previous => previous.some(entry => entry.student_id === student.student_id)
          ? previous
          : [...previous, student]);
      }

      if (result.personnel) {
        const person: PersonnelProfile = {
          personnel_id: result.personnel.personnel_id,
          user_id: result.personnel.user_id,
          employee_number: result.personnel.employee_number,
          full_name: result.personnel.full_name,
          office: result.personnel.office,
          position: result.personnel.position,
          assigned_subject: result.personnel.assigned_subject,
          assigned_grade_level: result.personnel.assigned_grade_level || 'Grade 9',
          assigned_section: result.personnel.assigned_section || 'All Sections',
          is_department_head: Boolean(result.personnel.is_department_head),
          department_head_title: result.personnel.department_head_title,
          status: result.personnel.status ?? 1,
          created_at: result.personnel.created_at || now,
          updated_at: result.personnel.updated_at || now,
        };
        setPersonnel(previous => previous.some(entry => entry.personnel_id === person.personnel_id)
          ? previous
          : [...previous, person]);
      }

      setCurrentRole(result.role);
      setCurrentUser(authenticatedUser);
      setSyncError(null);
      return { success: true, role: result.role as UserRole };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not connect to the authentication server.';
      console.error('[ClearPass login failed]:', error);
      setSyncError(message);
      return { success: false, message: 'Could not connect to the server. Check your network and try again.' };
    }
  };

  const logout = () => {
    const pushToken = appStorage.getItem('sia_clearpass_push_token');
    void apiFetch('/api/push/register', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: pushToken }),
    }).catch(() => undefined);
    appStorage.removeItem('sia_clearpass_push_token');
    void apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    appStorage.removeItem('sia_clearpass_session');
    setCurrentUser(null);
  };

  // Helper to compute progress
  const getStudentProgress = (student_id: string) => {
    const studentAssignments = assignments.filter(a => a.student_id === student_id);
    const total = studentAssignments.length || 1;
    const approved = studentAssignments.filter(a => a.status === 'Approved').length;
    const pending = studentAssignments.filter(a => a.status === 'Pending' || a.status === 'Submitted').length;
    const withRemarks = studentAssignments.filter(a => a.status === 'With Remarks' || a.status === 'Rejected').length;
    const percentage = Math.round((approved / total) * 100);
    const allSigned = approved === total && total > 0;
    return { percentage, total, approved, pending, withRemarks, allSigned };
  };

  // Submit Requirement
  const submitRequirement = ({
    assignment_id,
    requirement_id,
    student_id,
    file_name,
    file_url = 'https://storage.sia.edu.ph/submissions/' + encodeURIComponent(file_name),
    file_type = 'application/pdf',
    file_size_kb = 1500,
  }: {
    assignment_id: string;
    requirement_id: string;
    student_id: string;
    file_name: string;
    file_url?: string;
    file_type?: string;
    file_size_kb?: number;
  }) => {
    const now = new Date().toISOString();
    const submissionId = 'sub_' + Date.now();

    const newSub: RequirementSubmission = {
      submission_id: submissionId,
      assignment_id,
      student_id,
      requirement_id,
      file_name,
      file_url,
      file_type,
      file_size_kb,
      submission_status: 'Pending',
      submitted_at: now,
      updated_at: now,
    };

    setSubmissions(prev => [newSub, ...prev.filter(s => s.assignment_id !== assignment_id)]);

    // Update assignment status
    setAssignments(prev =>
      prev.map(a =>
        a.assignment_id === assignment_id
          ? { ...a, status: 'Submitted', updated_at: now }
          : a
      )
    );

    // Notify Personnel
    const req = requirements.find(r => r.requirement_id === requirement_id);
    const std = students.find(s => s.student_id === student_id);
    const personnelUser = users.find(u => u.role === 'Personnel');

    if (personnelUser) {
      const notif: NotificationItem = {
        notification_id: 'notif_' + Date.now(),
        user_id: personnelUser.user_id,
        title: 'New Student Submission',
        message: `${std?.first_name} ${std?.last_name} submitted document for ${req?.requirement_name || 'requirement'}.`,
        notification_type: 'Submission',
        related_record_id: submissionId,
        is_read: false,
        created_at: now,
      };
      setNotifications(prev => [notif, ...prev]);
    }
  };

  // Review submission
  const reviewSubmission = ({
    submission_id,
    status,
    remarks = '',
    reviewer_personnel_id,
  }: {
    submission_id: string;
    status: 'Approved' | 'Rejected' | 'With Remarks';
    remarks?: string;
    reviewer_personnel_id: string;
  }) => {
    const now = new Date().toISOString();
    const affectedSubmission = submissions.find(item => item.submission_id === submission_id);
    if (!affectedSubmission) return;
    const affectedStudentId = affectedSubmission.student_id;
    const affectedReqId = affectedSubmission.requirement_id;

    setSubmissions(prev =>
      prev.map(s => {
        if (s.submission_id === submission_id) {
          return {
            ...s,
            submission_status: status,
            remarks: remarks || s.remarks,
            reviewed_by: reviewer_personnel_id,
            reviewed_at: now,
            updated_at: now,
          };
        }
        return s;
      })
    );

    const mappedAssignmentStatus: AssignmentStatus =
      status === 'Approved' ? 'Approved' : status === 'With Remarks' ? 'With Remarks' : 'Rejected';

    setAssignments(prev =>
      prev.map(a => {
        if (a.student_id === affectedStudentId && a.requirement_id === affectedReqId) {
          return {
            ...a,
            status: mappedAssignmentStatus,
            remarks: remarks || a.remarks,
            ...(status === 'Rejected' || status === 'With Remarks'
              ? { signed_by_personnel_id: undefined, signed_at: undefined }
              : {}),
            updated_at: now,
          };
        }
        return a;
      })
    );

    // Update Clearance Record progress
    const affectedStudent = students.find(student => student.student_id === affectedStudentId);
    const studentUser = users.find(user => user.user_id === affectedStudent?.user_id);
    const req = requirements.find(r => r.requirement_id === affectedReqId);

    // Recalculate progress
    const updatedAssignments = assignments.map(a =>
      a.student_id === affectedStudentId && a.requirement_id === affectedReqId
        ? { ...a, status: mappedAssignmentStatus }
        : a
    );
    const studentAsgs = updatedAssignments.filter(a => a.student_id === affectedStudentId);
    const approvedCount = studentAsgs.filter(a => a.status === 'Approved').length;
    const newPercent = Math.round((approvedCount / (studentAsgs.length || 1)) * 100);

    setRecords(prev =>
      prev.map(r => {
        if (r.student_id === affectedStudentId && r.period_id === activePeriod?.period_id) {
          const isCleared = newPercent === 100;
          return {
            ...r,
            progress_percentage: newPercent,
            overall_status: isCleared ? 'Cleared' : 'In Progress',
            completed_at: isCleared ? now : undefined,
            updated_at: now,
          };
        }
        return r;
      })
    );

    // Create Notification for Student
    if (studentUser) {
      const isApproved = status === 'Approved';
      const notif: NotificationItem = {
        notification_id: 'notif_' + Date.now(),
        user_id: studentUser.user_id,
        title: isApproved ? 'Task Approved' : status === 'Rejected' ? 'Task Rejected' : 'Task Remarks',
        message: isApproved
          ? `Your submission for "${req?.requirement_name}" was approved! Progress is now ${newPercent}%.`
          : status === 'Rejected'
            ? `Your submission for "${req?.requirement_name}" was rejected: ${remarks}`
            : `Feedback received on "${req?.requirement_name}": ${remarks}`,
        notification_type: isApproved ? 'Approval' : 'Remark',
        related_record_id: submission_id,
        is_read: false,
        created_at: now,
      };
      setNotifications(prev => [notif, ...prev]);
      dispatchPush(notif);

      if (newPercent === 100) {
        const completedNotif: NotificationItem = {
          notification_id: 'notif_complete_' + Date.now(),
          user_id: studentUser.user_id,
          title: 'Clearance Completed',
          message: 'Congratulations! All required school offices have verified and approved your clearance. You can now download your Official Clearance Form.',
          notification_type: 'Clearance Completed',
          related_record_id: 'cert_' + Date.now(),
          is_read: false,
          created_at: now,
        };
        setNotifications(prev => [completedNotif, ...prev]);
        dispatchPush(completedNotif);
      }
    }
  };

  // Register & Save Signature
  const saveSignature = (personnel_id: string, signature_data: string): DigitalSignature => {
    const now = new Date().toISOString();
    const verCode = `SIA-SIG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}-VERIFIED`;
    const newSig: DigitalSignature = {
      signature_id: 'sig_' + Date.now(),
      personnel_id,
      signature_data,
      signature_status: 'active',
      verification_code: verCode,
      signed_at: now,
      created_at: now,
    };

    setSignatures(prev => [newSig, ...prev.filter(s => s.personnel_id !== personnel_id)]);
    return newSig;
  };

  // Sign clearance for a student
  const signClearanceForStudent = (personnel_id: string, student_id: string) => {
    // Approve all requirements under this personnel for this student
    const signer = personnel.find(profile => profile.personnel_id === personnel_id);
    const teacherReqs = requirements
      .filter(r => r.personnel_id === personnel_id || r.category === signer?.assigned_subject)
      .map(r => r.requirement_id);
    const now = new Date().toISOString();

    setAssignments(prev =>
      prev.map(a => {
        if (a.student_id === student_id && teacherReqs.includes(a.requirement_id)) {
          return {
            ...a,
            status: 'Approved',
            signed_by_personnel_id: personnel_id,
            signed_at: now,
            updated_at: now,
          };
        }
        return a;
      })
    );

    // Recompute student progress
    const updatedAssignments = assignments.map(a => {
      if (a.student_id === student_id && teacherReqs.includes(a.requirement_id)) {
        return { ...a, status: 'Approved' as const };
      }
      return a;
    });
    const studentAsgs = updatedAssignments.filter(a => a.student_id === student_id);
    const approvedCount = studentAsgs.filter(a => a.status === 'Approved').length;
    const newPercent = Math.round((approvedCount / (studentAsgs.length || 1)) * 100);

    setRecords(prev =>
      prev.map(r => {
        if (r.student_id === student_id && r.period_id === activePeriod?.period_id) {
          const isCleared = newPercent === 100;
          return {
            ...r,
            progress_percentage: newPercent,
            overall_status: isCleared ? 'Cleared' : 'In Progress',
            completed_at: isCleared ? now : undefined,
            updated_at: now,
          };
        }
        return r;
      })
    );

    const pers = personnel.find(p => p.personnel_id === personnel_id);
    const std = students.find(s => s.student_id === student_id);
    if (std) {
      const studentUser = users.find(u => u.user_id === std.user_id);
      if (studentUser) {
        setNotifications(prev => [
          {
            notification_id: 'notif_sig_' + Date.now(),
            user_id: studentUser.user_id,
            title: `${pers?.assigned_subject || 'Teacher'} Signed`,
            message: `${pers?.full_name} has authorized and applied digital signature to your clearance form.`,
            notification_type: 'Approval',
            is_read: false,
            created_at: now,
          },
          ...prev,
        ]);
      }
    }
  };

  // Revoke / Undo accidental signature for a student
  const revokeClearanceSignatureForStudent = ({
    personnel_id,
    student_id,
    reason = 'Accidental sign-off / Reverted by teacher for verification',
  }: {
    personnel_id: string;
    student_id: string;
    reason?: string;
  }) => {
    const pers = personnel.find(p => p.personnel_id === personnel_id) || currentPersonnel;
    const teacherReqs = requirements
      .filter(r => r.personnel_id === personnel_id || r.category === pers?.assigned_subject)
      .map(r => r.requirement_id);
    const now = new Date().toISOString();

    setAssignments(prev =>
      prev.map(a => {
        if (a.student_id === student_id && teacherReqs.includes(a.requirement_id)) {
          return {
            ...a,
            status: 'With Remarks',
            remarks: reason,
            signed_by_personnel_id: undefined,
            signed_at: undefined,
            updated_at: now,
          };
        }
        return a;
      })
    );

    setSubmissions(prev =>
      prev.map(s => {
        if (s.student_id === student_id && teacherReqs.includes(s.requirement_id)) {
          return {
            ...s,
            submission_status: 'With Remarks',
            remarks: reason,
            updated_at: now,
          };
        }
        return s;
      })
    );

    // Recalculate student clearance progress
    const updatedAssignments = assignments.map(a => {
      if (a.student_id === student_id && teacherReqs.includes(a.requirement_id)) {
        return {
          ...a,
          status: 'With Remarks' as const,
          remarks: reason,
          signed_by_personnel_id: undefined,
          signed_at: undefined,
        };
      }
      return a;
    });
    const studentAsgs = updatedAssignments.filter(a => a.student_id === student_id);
    const approvedCount = studentAsgs.filter(a => a.status === 'Approved').length;
    const newPercent = Math.round((approvedCount / (studentAsgs.length || 1)) * 100);

    setRecords(prev =>
      prev.map(r => {
        if (r.student_id === student_id && r.period_id === activePeriod?.period_id) {
          return {
            ...r,
            progress_percentage: newPercent,
            overall_status: 'In Progress',
            completed_at: undefined,
            updated_at: now,
          };
        }
        return r;
      })
    );

    const std = students.find(s => s.student_id === student_id);
    if (std) {
      const studentUser = users.find(u => u.user_id === std.user_id);
      if (studentUser) {
        const notif: NotificationItem = {
          notification_id: 'notif_revoke_' + Date.now(),
          user_id: studentUser.user_id,
          title: `⚠️ Signature Revoked - ${pers?.assigned_subject || 'Clearance'}`,
          message: `${pers?.full_name} has revoked the clearance signature. Reason: "${reason}". Progress updated to ${newPercent}%.`,
          notification_type: 'Remark',
          is_read: false,
          created_at: now,
        };
        setNotifications(prev => [notif, ...prev]);
        dispatchPush(notif);
      }
    }
  };

  // Add Clearance Requirement
  const addRequirement = (req: Omit<ClearanceRequirement, 'requirement_id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newReqId = 'req_' + Date.now();
    const newRequirement: ClearanceRequirement = {
      ...req,
      requirement_id: newReqId,
      created_at: now,
      updated_at: now,
    };
    setRequirements(prev => [...prev, newRequirement]);

    // Automatically assign to matching students
    const targetStudents = students.filter(s =>
      (!req.grade_level || s.grade_level === req.grade_level) &&
      (!req.section || s.section === req.section || req.section === 'All Sections')
    );

    const newAssignments: StudentRequirementAssignment[] = targetStudents.map(s => ({
      assignment_id: `asg_${s.student_id}_${newReqId}`,
      student_id: s.student_id,
      requirement_id: newReqId,
      period_id: activePeriod?.period_id || 'period_2026_sem2',
      status: 'Pending',
      assigned_by: req.created_by,
      assigned_at: now,
      updated_at: now,
    }));

    setAssignments(prev => [...prev, ...newAssignments]);
  };

  // Add Clearance Form
  const addClearanceForm = (form: Omit<ClearanceForm, 'clearance_form_id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newForm: ClearanceForm = {
      ...form,
      clearance_form_id: 'form_' + Date.now(),
      created_at: now,
      updated_at: now,
    };
    setClearanceForms(prev => [...prev, newForm]);
  };

  // Add Clearance Period
  const addClearancePeriod = (period: Omit<ClearancePeriod, 'period_id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newPeriod: ClearancePeriod = {
      ...period,
      period_id: 'period_' + Date.now(),
      created_at: now,
      updated_at: now,
    };
    setClearancePeriods(prev => [...prev, newPeriod]);
  };

  const makePersonnelSignatory = (
    profile: PersonnelProfile,
    order: number,
    existing?: ClearanceSignatory
  ): ClearanceSignatory => {
    const office = profile.office.trim();
    const normalizedOffice = office.toLowerCase();
    const departmentCode = normalizedOffice.includes('science')
      ? 'SCIENCE'
      : normalizedOffice.includes('cashier') || normalizedOffice.includes('finance') || normalizedOffice.includes('accounting')
      ? 'CASHIER'
      : normalizedOffice.includes('library') || normalizedOffice.includes('resource')
      ? 'LIBRARY'
      : normalizedOffice.includes('guidance')
      ? 'GUIDANCE'
      : normalizedOffice.includes('adviser') || normalizedOffice.includes('academic')
      ? 'ADVISER'
      : normalizedOffice.includes('principal') || normalizedOffice.includes('administration')
      ? 'PRINCIPAL'
      : normalizedOffice.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').toUpperCase() || 'GENERAL';
    const departmentName = office.endsWith('Department') ? office : `${office} Department`;

    return {
      signatory_id: existing?.signatory_id || `sig_${profile.personnel_id}`,
      clearance_form_id: existing?.clearance_form_id || activeForm?.clearance_form_id || '',
      personnel_id: profile.personnel_id,
      personnel_name: profile.full_name,
      office_role: profile.position.toLowerCase().includes('head')
        ? profile.position
        : `${departmentName} Head`,
      is_department_head: true,
      department_code: departmentCode,
      signatory_order: existing?.signatory_order || order,
      status: profile.status,
      assigned_by: existing?.assigned_by || 'usr_admin',
    };
  };

  // Add User
  const addUser = (params: {
    name: string;
    email: string;
    role: UserRole;
    username?: string;
    studentNumber?: string;
    employeeNumber?: string;
    schoolLevel?: string;
    gradeLevel?: string;
    section?: string;
    office?: string;
    position?: string;
    assignedSubject?: string;
    userId?: string;
    studentId?: string;
    personnelId?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    suffix?: string;
    schoolYear?: string;
  }) => {
    const now = new Date().toISOString();
    const userId = params.userId || 'usr_' + Date.now();
    const newUser: User = {
      user_id: userId,
      auth_user_id: 'auth_' + Date.now(),
      username: params.username,
      name: params.name,
      email: params.email,
      role: params.role,
      status: 1,
      created_at: now,
      updated_at: now,
    };
    setUsers(prev => [...prev, newUser]);

    if (params.role === 'Student') {
      const nameParts = params.name.split(' ');
      const newStudent: StudentProfile = {
        student_id: params.studentId || 'std_' + Date.now(),
        user_id: userId,
        student_number: params.studentNumber || String(Math.floor(100000000000 + Math.random() * 900000000000)),
        first_name: params.firstName || nameParts[0] || 'Student',
        middle_name: params.middleName ?? (nameParts.length > 2 ? nameParts[1] : ''),
        last_name: params.lastName || nameParts[nameParts.length - 1] || '',
        suffix: params.suffix || '',
        grade_level: params.gradeLevel || 'Grade 9',
        section: params.section || 'Rose',
        school_level: params.schoolLevel || 'Junior High School',
        school_year: params.schoolYear || '2026-2027',
        status: 1,
        created_at: now,
        updated_at: now,
      };
      setStudents(prev => [...prev, newStudent]);

      // Assign existing requirements
      const matchingReqs = requirements.filter(r =>
        (!r.grade_level || r.grade_level === newStudent.grade_level)
      );
      const studentAsgs: StudentRequirementAssignment[] = activePeriod ? matchingReqs.map(r => ({
        assignment_id: `asg_${newStudent.student_id}_${r.requirement_id}`,
        student_id: newStudent.student_id,
        requirement_id: r.requirement_id,
        period_id: activePeriod.period_id,
        status: 'Pending',
        assigned_by: 'usr_admin',
        assigned_at: now,
        updated_at: now,
      })) : [];
      setAssignments(prev => [...prev, ...studentAsgs]);

      if (activeForm && activePeriod) {
        setRecords(prev => [
          ...prev,
          {
            clearance_record_id: 'rec_' + newStudent.student_id + '_' + activePeriod.period_id,
            student_id: newStudent.student_id,
            clearance_form_id: activeForm.clearance_form_id,
            period_id: activePeriod.period_id,
            school_year: activePeriod.school_year,
            term: activePeriod.term,
            overall_status: 'Pending',
            progress_percentage: 0,
            created_at: now,
            updated_at: now,
          },
        ]);
      }
    } else if (params.role === 'Personnel') {
      const newPersonnel: PersonnelProfile = {
        personnel_id: params.personnelId || 'per_' + Date.now(),
        user_id: userId,
        employee_number: params.employeeNumber || String(Math.floor(1000 + Math.random() * 9000)),
        full_name: params.name,
        office: params.office || 'Academic Faculty',
        position: params.position || 'Subject Teacher & Signatory',
        assigned_subject: params.assignedSubject || 'General Academics',
        assigned_grade_level: params.gradeLevel || 'Grade 9',
        assigned_section: params.section || 'All Sections',
        is_department_head: true,
        department_head_title: params.position || 'Authorized Department Head',
        status: 1,
        created_at: now,
        updated_at: now,
      };
      setPersonnel(prev => [...prev, newPersonnel]);
      setSignatories(prev => {
        const existing = prev.find(signatory => signatory.personnel_id === newPersonnel.personnel_id);
        const order = existing?.signatory_order || prev.length + 1;
        const newSignatory = makePersonnelSignatory(newPersonnel, order, existing);
        return existing
          ? prev.map(signatory => signatory.personnel_id === newPersonnel.personnel_id ? newSignatory : signatory)
          : [...prev, newSignatory];
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (users.some(user => user.user_id === userId && user.role === 'Administrator')) {
      throw new Error('Administrator accounts cannot be deleted.');
    }

    const response = await apiFetch(`/api/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || `Failed to delete account (${response.status}).`);
    }

    const deletedPersonnelIds = personnel
      .filter(profile => profile.user_id === userId)
      .map(profile => profile.personnel_id);
    setUsers(prev => prev.filter(u => u.user_id !== userId));
    setStudents(prev => prev.filter(s => s.user_id !== userId));
    setPersonnel(prev => prev.filter(p => p.user_id !== userId));
    setSignatories(prev => prev.filter(signatory => !deletedPersonnelIds.includes(signatory.personnel_id)));
    setSignatures(prev => prev.filter(signature => !deletedPersonnelIds.includes(signature.personnel_id)));
  };

  const updateAdminStudent = async (student_id: string, updates: AdminStudentUpdate) => {
      const response = await apiFetch(`/api/students/${encodeURIComponent(student_id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || `Failed to update student (${response.status}).`);
    }

    const updatedStudent = result.student as StudentProfile;
    const updatedAccount = result.user as { username?: string; email?: string; name?: string } | undefined;
    const fullName = `${updatedStudent.first_name} ${updatedStudent.middle_name} ${updatedStudent.last_name} ${updatedStudent.suffix || ''}`.trim();
    setStudents(prev => prev.map(student => student.student_id === student_id
      ? { ...student, ...updatedStudent, updated_at: new Date().toISOString() }
      : student
    ));
    setUsers(prev => prev.map(user => user.user_id === updatedStudent.user_id
      ? {
        ...user,
        username: updatedAccount?.username ?? updates.username ?? user.username,
        email: updatedAccount?.email ?? user.email,
        name: updatedAccount?.name ?? fullName,
        updated_at: new Date().toISOString(),
      }
      : user
    ));
  };

  const updateAdminPersonnel = async (personnel_id: string, updates: Partial<PersonnelProfile>) => {
      const response = await apiFetch(`/api/personnel/${encodeURIComponent(personnel_id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const result = await readApiResponse(response);
    if (!response.ok || !result.success) {
      throw new Error(typeof result.message === 'string'
        ? result.message
        : `Failed to update personnel (${response.status}).`);
    }

    const updatedPersonnel = result.personnel as PersonnelProfile;
    setPersonnel(prev => prev.map(person => person.personnel_id === personnel_id
      ? { ...person, ...updatedPersonnel, updated_at: new Date().toISOString() }
      : person
    ));
    setSignatories(prev => {
      const existing = prev.find(signatory => signatory.personnel_id === personnel_id);
      const existingProfile = personnel.find(person => person.personnel_id === personnel_id);
      if (!existingProfile) return prev;
      const profile: PersonnelProfile = {
        ...existingProfile,
        ...updatedPersonnel,
        is_department_head: true,
      };
      const updatedSignatory = makePersonnelSignatory(profile, existing?.signatory_order || prev.length + 1, existing);
      return existing
        ? prev.map(signatory => signatory.personnel_id === personnel_id ? updatedSignatory : signatory)
        : [...prev, updatedSignatory];
    });
    setUsers(prev => prev.map(user => user.user_id === updatedPersonnel.user_id
      ? { ...user, name: updatedPersonnel.full_name, updated_at: new Date().toISOString() }
      : user
    ));
  };

  const updateStudentProfile = (student_id: string, updates: Partial<StudentProfile>) => {
    setStudents(prev =>
      prev.map(s => (s.student_id === student_id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s))
    );
    if (updates.avatar_url && currentUser?.role === 'Student') {
      setUsers(prev =>
        prev.map(u => (u.user_id === currentUser.user_id ? { ...u, avatar_url: updates.avatar_url } : u))
      );
    }
  };

  const updatePersonnelProfile = (personnel_id: string, updates: Partial<PersonnelProfile>) => {
    setPersonnel(prev =>
      prev.map(p => (p.personnel_id === personnel_id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p))
    );
    if (updates.avatar_url && currentUser?.role === 'Personnel') {
      setUsers(prev =>
        prev.map(u => (u.user_id === currentUser.user_id ? { ...u, avatar_url: updates.avatar_url } : u))
      );
    }
  };

  const markNotificationRead = (notification_id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.notification_id === notification_id ? { ...n, is_read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => n.user_id === currentUser?.user_id ? { ...n, is_read: true } : n));
  };

  const resetAllData = () => {
    appStorage.removeItem(`${STORAGE_KEY}_users`);
    appStorage.removeItem(`${STORAGE_KEY}_students`);
    appStorage.removeItem(`${STORAGE_KEY}_personnel`);
    appStorage.removeItem(`${STORAGE_KEY}_forms`);
    appStorage.removeItem(`${STORAGE_KEY}_periods`);
    appStorage.removeItem(`${STORAGE_KEY}_signatories`);
    appStorage.removeItem(`${STORAGE_KEY}_requirements`);
    appStorage.removeItem(`${STORAGE_KEY}_assignments`);
    appStorage.removeItem(`${STORAGE_KEY}_submissions`);
    appStorage.removeItem(`${STORAGE_KEY}_records`);
    appStorage.removeItem(`${STORAGE_KEY}_signatures`);
    appStorage.removeItem(`${STORAGE_KEY}_notifications`);

    setUsers(INITIAL_USERS);
    setStudents(INITIAL_STUDENTS);
    setPersonnel(INITIAL_PERSONNEL);
    setClearanceForms(INITIAL_CLEARANCE_FORMS);
    setClearancePeriods(INITIAL_CLEARANCE_PERIODS);
    setSignatories(INITIAL_SIGNATORIES);
    setRequirements(INITIAL_REQUIREMENTS);
    setAssignments(INITIAL_STUDENT_ASSIGNMENTS);
    setSubmissions(INITIAL_SUBMISSIONS);
    setRecords(INITIAL_CLEARANCE_RECORDS);
    setSignatures(INITIAL_DIGITAL_SIGNATURES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCurrentRole('Administrator');
    setCurrentUser(INITIAL_USERS.find(user => user.role === 'Administrator') || null);
  };

  useEffect(() => {
    setSignatories(previous => {
      const currentPersonnelSignatories = personnel
        .filter(profile => profile.status !== 0)
        .map((profile, index) => {
          const existing = previous.find(signatory => signatory.personnel_id === profile.personnel_id);
          return makePersonnelSignatory(profile, existing?.signatory_order || index + 1, existing);
        });
      return JSON.stringify(previous) === JSON.stringify(currentPersonnelSignatories)
        ? previous
        : currentPersonnelSignatories;
    });
  }, [personnel, activeForm?.clearance_form_id]);

  return (
    <ClearPassContext.Provider
      value={{
        users,
        students,
        personnel,
        clearanceForms,
        clearancePeriods,
        signatories,
        requirements,
        assignments,
        submissions,
        records,
        signatures,
        notifications,
        currentUser,
        currentRole,
        currentStudent,
        currentPersonnel,
        deviceMode,
        activePeriod,
        activeForm,
        isPhoneLocked,
        headsUpNotification,
        pushPermissionGranted,
        syncError,
        setDeviceMode,
        setIsPhoneLocked,
        dismissHeadsUp,
        requestSystemPushPermission,
        triggerDemoPushNotification,
        switchRole,
        loginUser,
        authenticateUser,
        logout,
        submitRequirement,
        reviewSubmission,
        saveSignature,
        signClearanceForStudent,
        revokeClearanceSignatureForStudent,
        addRequirement,
        addClearanceForm,
        addClearancePeriod,
        addUser,
        deleteUser,
        updateAdminStudent,
        updateAdminPersonnel,
        updateStudentProfile,
        updatePersonnelProfile,
        markNotificationRead,
        markAllNotificationsRead,
        resetAllData,
        getStudentProgress,
      }}
    >
      {children}
    </ClearPassContext.Provider>
  );
};

export const useClearPass = () => {
  const context = useContext(ClearPassContext);
  if (!context) {
    throw new Error('useClearPass must be used within a ClearPassProvider');
  }
  return context;
};
