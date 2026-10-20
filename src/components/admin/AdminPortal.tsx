import React, { useState } from 'react';
import { useClearPass } from '../../context/ClearPassContext';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Calendar,
  FolderArchive,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Eye,
  Search,
  CheckCircle,
  Clock,
  Shield,
  Upload,
  School,
  X,
  UserPlus,
  UserCheck,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { UserRole, StudentProfile, PersonnelProfile } from '../../types/clearpass';
import { ClearanceCertificateModal } from '../common/ClearanceCertificateModal';
import { apiFetch } from '../../utils/api';
import { SchoolLogo } from '../common/SchoolLogo';

export const AdminPortal: React.FC<{ onBackToPortal?: () => void }> = ({ onBackToPortal }) => {
  const {
    users,
    students,
    personnel,
    clearanceForms,
    clearancePeriods,
    records,
    signatories,
    activePeriod,
    activeForm,
    currentRole,
    currentUser,
    authenticateUser,
    logout,
    setDeviceMode,
    switchRole,
    addUser,
    deleteUser,
    updateAdminStudent,
    updateAdminPersonnel,
    addClearanceForm,
    addClearancePeriod,
    resetAllData,
    syncError,
  } = useClearPass();

  // Authentication state for Admin Web Portal (Figure 29)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active portal tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'forms' | 'periods' | 'records'>('dashboard');

  // Modals
  const [addPersonnelModalOpen, setAddPersonnelModalOpen] = useState(false);
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [editingPersonnelId, setEditingPersonnelId] = useState<string | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [addFormModalOpen, setAddFormModalOpen] = useState(false);
  const [addPeriodModalOpen, setAddPeriodModalOpen] = useState(false);
  const [viewCertStudent, setViewCertStudent] = useState<StudentProfile | null>(null);
  const [creationSuccessNotice, setCreationSuccessNotice] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // User management tab & search (Figure 31)
  const [userTabFilter, setUserTabFilter] = useState<'all' | 'personnel' | 'students'>('personnel');
  const [userSearch, setUserSearch] = useState('');
  const [filterSchoolLevel, setFilterSchoolLevel] = useState('All School Level');
  const [filterGradeLevel, setFilterGradeLevel] = useState('All Grade Level');
  const [filterSection, setFilterSection] = useState('All Section');

  // Form states: New Personnel (Figure 31 / Table 5.0)
  const [pFirstName, setPFirstName] = useState('');
  const [pMiddleName, setPMiddleName] = useState('');
  const [pLastName, setPLastName] = useState('');
  const [pSuffix, setPSuffix] = useState('');
  const [pEmployeeNo, setPEmployeeNo] = useState('');
  const [pUsername, setPUsername] = useState('');
  const [pPassword, setPPassword] = useState('');
  const [pOffice, setPOffice] = useState('Science Department');
  const [pPosition, setPPosition] = useState('Science Teacher & Clearance Signatory');
  const [pAssignedSubject, setPAssignedSubject] = useState('Science');
  const [pSchoolLevel, setPSchoolLevel] = useState('Junior High School');
  const [pGradeLevel, setPGradeLevel] = useState('Grade 9');
  const [pSection, setPSection] = useState('Rose');

  // Form states: New Student (Figure 31 / Table 4.0)
  const [sFirstName, setSFirstName] = useState('');
  const [sMiddleName, setSMiddleName] = useState('');
  const [sLastName, setSLastName] = useState('');
  const [sSuffix, setSSuffix] = useState('');
  const [sLrn, setSLrn] = useState('');
  const [sSchoolLevel, setSSchoolLevel] = useState('Junior High School');
  const [sGradeLevel, setSGradeLevel] = useState('Grade 9');
  const [sSection, setSSection] = useState('Rose');

  // Form states: Clearance Form & Period
  const [formName, setFormName] = useState('SY: 2026-2027 Junior High School Clearance Form');
  const [formSy, setFormSy] = useState('2026-2027');
  const [formLevel, setFormLevel] = useState('Junior High School');
  const [formTerm, setFormTerm] = useState('Second Semester');

  const [periodSy, setPeriodSy] = useState('2026-2027');
  const [periodLevel, setPeriodLevel] = useState('Junior High School');
  const [periodTerm, setPeriodTerm] = useState('Second Semester');
  const [startDate, setStartDate] = useState('2026-03-01');
  const [endDate, setEndDate] = useState('2026-04-01');

  // Statistics (Figure 30)
  const totalEnrolled = students.length;
  const totalCleared = records.filter(r => r.overall_status === 'Cleared' || r.progress_percentage === 100).length;
  const totalUncleared = Math.max(0, totalEnrolled - totalCleared);
  const progressPercent = totalEnrolled ? Math.round((totalCleared / totalEnrolled) * 100) : 0;
  const filteredPersonnel = personnel.filter(p =>
    p.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.employee_number.includes(userSearch) ||
    p.assigned_subject.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredStudents = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(userSearch.toLowerCase()) ||
    s.student_number.includes(userSearch)
  );

  // Handle Admin Login (Figure 29)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await authenticateUser(adminUsername.trim(), adminPassword, 'Administrator');
    if (result.success) {
      setIsAdminLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError(result.message || 'Invalid Administrator credentials.');
    }
  };

  // Handle creating Personnel account by Administrator (SDD Table 5.0) -> Direct to MySQL
  const handleCreatePersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    if (!pFirstName.trim() || !pLastName.trim()) return;

    const fullName = `${pLastName}, ${pFirstName} ${pMiddleName} ${pSuffix}`.trim();
    const empNo = pEmployeeNo.trim() || String(Math.floor(1000 + Math.random() * 9000));

    if (editingPersonnelId) {
      try {
        await updateAdminPersonnel(editingPersonnelId, {
          employee_number: empNo,
          full_name: fullName,
          office: pOffice,
          position: pPosition,
          assigned_subject: pAssignedSubject,
          assigned_grade_level: pGradeLevel,
          assigned_section: pSection,
        });
        setCreationSuccessNotice(`Personnel "${fullName}" was updated.`);
        setAddPersonnelModalOpen(false);
        setEditingPersonnelId(null);
        setPFirstName('');
        setPMiddleName('');
        setPLastName('');
        setPSuffix('');
        setPEmployeeNo('');
        setPUsername('');
        setPPassword('');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error.';
        console.error('[Personnel update failed]:', error);
        setDeleteError(`Could not update personnel account: ${message}`);
      }
      return;
    }

    const finalUsername = pUsername.trim() || `${pFirstName.trim().toLowerCase()}.${pLastName.trim().toLowerCase()}`.replace(/\s+/g, '');
    const teacherPass = pPassword.trim();
    if (teacherPass.length < 12) {
      setDeleteError('Set a temporary password with at least 12 characters.');
      return;
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const personnelId = `per_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      const response = await apiFetch('/api/personnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          personnel_id: personnelId,
          employee_number: empNo,
          full_name: fullName,
          office: pOffice,
          position: pPosition,
          assigned_subject: pAssignedSubject,
          assigned_grade_level: pGradeLevel,
          assigned_section: pSection,
          username: finalUsername,
          password: teacherPass,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || `Server returned ${response.status}.`);
      }

      addUser({
        name: data.user.name,
        email: data.user.email,
        role: 'Personnel',
        employeeNumber: data.personnel.employee_number,
        office: data.personnel.office,
        position: data.personnel.position,
        assignedSubject: data.personnel.assigned_subject,
        gradeLevel: data.personnel.assigned_grade_level,
        section: data.personnel.assigned_section,
        userId: data.user.user_id,
        personnelId: data.personnel.personnel_id,
      });
      setCreationSuccessNotice(`✓ Personnel "${fullName}" saved to the database. Mobile login: "${finalUsername}".`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error.';
      console.error('[Personnel creation failed]:', error);
      setDeleteError(`Could not create personnel account: ${message}`);
      return;
    }
    setTimeout(() => setCreationSuccessNotice(null), 8000);

    setAddPersonnelModalOpen(false);
    setPFirstName('');
    setPMiddleName('');
    setPLastName('');
    setPUsername('');
    setPPassword('');
    setPEmployeeNo('');
  };

  const handleDeleteUser = async (userId: string) => {
    setDeleteError(null);
    try {
      await deleteUser(userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error.';
      console.error('[Account deletion failed]:', error);
      setDeleteError(`Could not delete account: ${message}`);
    }
  };

  const beginPersonnelEdit = (profile: PersonnelProfile) => {
    const [lastName = '', givenNames = ''] = profile.full_name.split(',').map(part => part.trim());
    const nameParts = givenNames.split(/\s+/).filter(Boolean);
    const lastPart = nameParts[nameParts.length - 1] || '';
    const hasSuffix = ['Jr.', 'Sr.', 'II', 'III', 'IV'].includes(lastPart);
    setPFirstName(nameParts[0] || '');
    setPMiddleName(nameParts.slice(1, hasSuffix ? -1 : undefined).join(' '));
    setPSuffix(hasSuffix ? lastPart : '');
    setPLastName(lastName);
    setPEmployeeNo(profile.employee_number);
    setPUsername(users.find(user => user.user_id === profile.user_id)?.email.split('@')[0] || '');
    setPPassword('');
    setPOffice(profile.office);
    setPPosition(profile.position);
    setPAssignedSubject(profile.assigned_subject);
    setPGradeLevel(profile.assigned_grade_level);
    setPSection(profile.assigned_section);
    setEditingPersonnelId(profile.personnel_id);
    setAddPersonnelModalOpen(true);
  };

  const beginStudentEdit = (profile: StudentProfile) => {
    setSFirstName(profile.first_name);
    setSMiddleName(profile.middle_name);
    setSLastName(profile.last_name);
    setSSuffix(profile.suffix || '');
    setSLrn(profile.student_number);
    setSSchoolLevel(profile.school_level);
    setSGradeLevel(profile.grade_level);
    setSSection(profile.section);
    setEditingStudentId(profile.student_id);
    setAddStudentModalOpen(true);
  };

  // Handle creating Student account by Administrator (SDD Table 4.0) -> Direct to MySQL
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    if (!sFirstName.trim() || !sLastName.trim()) return;

    const lrnNo = sLrn.trim();
    if (!/^\d{12}$/.test(lrnNo)) {
      setDeleteError('Enter a valid 12-digit LRN.');
      return;
    }

    if (editingStudentId) {
      try {
        await updateAdminStudent(editingStudentId, {
          student_number: lrnNo,
          first_name: sFirstName.trim(),
          middle_name: sMiddleName.trim(),
          last_name: sLastName.trim(),
          suffix: sSuffix.trim(),
          school_level: sSchoolLevel,
          grade_level: sGradeLevel,
          section: sSection,
          school_year: students.find(student => student.student_id === editingStudentId)?.school_year || '2026-2027',
        });
        setCreationSuccessNotice(`Student "${sFirstName.trim()} ${sLastName.trim()}" was updated.`);
        setAddStudentModalOpen(false);
        setEditingStudentId(null);
        setSFirstName('');
        setSMiddleName('');
        setSLastName('');
        setSSuffix('');
        setSLrn('');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error.';
        console.error('[Student update failed]:', error);
        setDeleteError(`Could not update student account: ${message}`);
      }
      return;
    }

    const fullName = `${sLastName}, ${sFirstName} ${sMiddleName} ${sSuffix}`.trim();
    const studentPass = lrnNo.slice(-4);

    const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const studentId = `std_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      const response = await apiFetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          student_id: studentId,
          student_number: lrnNo,
          first_name: sFirstName.trim(),
          middle_name: sMiddleName.trim(),
          last_name: sLastName.trim(),
          suffix: sSuffix.trim(),
          school_level: sSchoolLevel,
          grade_level: sGradeLevel,
          section: sSection,
          school_year: '2026-2027',
          username: lrnNo,
          password: studentPass,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || `Server returned ${response.status}.`);
      }

      addUser({
        name: data.user.name,
        email: data.user.email,
        role: 'Student',
        studentNumber: data.student.student_number,
        schoolLevel: data.student.school_level,
        gradeLevel: data.student.grade_level,
        section: data.student.section,
        firstName: data.student.first_name,
        middleName: data.student.middle_name,
        lastName: data.student.last_name,
        suffix: data.student.suffix,
        schoolYear: data.student.school_year,
        userId: data.user.user_id,
        studentId: data.student.student_id,
      });
      setCreationSuccessNotice(`✓ Student "${fullName}" (LRN: ${lrnNo}) saved to the database.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error.';
      console.error('[Student creation failed]:', error);
      setDeleteError(`Could not create student account: ${message}`);
      return;
    }

    setAddStudentModalOpen(false);
    setSFirstName('');
    setSMiddleName('');
    setSLastName('');
    setSLrn('');
  };

  const handleCreateForm = (e: React.FormEvent) => {
    e.preventDefault();
    addClearanceForm({
      form_name: formName,
      description: `Official ${formLevel} clearance application document for ${formSy}.`,
      school_year: formSy,
      school_level: formLevel,
      term: formTerm,
      status: 1,
      created_by: 'usr_admin',
    });
    setAddFormModalOpen(false);
  };

  const handleCreatePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeForm) {
      setCreationSuccessNotice('Create a clearance form before setting a clearance period.');
      return;
    }

    addClearancePeriod({
      clearance_form_id: activeForm.clearance_form_id,
      school_year: periodSy,
      school_level: periodLevel,
      term: periodTerm,
      start_date: startDate,
      end_date: endDate,
      status: 'Ongoing',
      created_by: 'usr_admin',
    });
    setAddPeriodModalOpen(false);
  };

  // ==========================================
  // VIEW: ADMIN LOGIN SCREEN (Official Web Portal)
  // ==========================================
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-200">
          <div className="text-center mb-6">
            <SchoolLogo size="lg" className="justify-center mb-3" />
            <h2 className="text-xl font-bold text-slate-900">Administrator Portal</h2>
            <p className="text-xs text-slate-500 mt-1">St. Isidore Academy of Trinidad Bohol, Inc.</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 mt-2 text-[11px] font-semibold text-blue-900">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-800" />
              <span>Official DepEd Clearance System Web Console</span>
            </div>
          </div>

          {loginError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center mb-4">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Administrator Username</label>
              <input
                type="text"
                required
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer mt-2 text-sm"
            >
              Sign In to Administrator Dashboard
            </button>
          </form>

          {onBackToPortal && (
            <button
              type="button"
              onClick={onBackToPortal}
              className="mt-3 w-full rounded-lg py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-blue-950"
            >
              Back to account selection
            </button>
          )}

          <div className="mt-6 pt-4 border-t border-slate-200 text-center text-[11px] text-slate-400">
            <span>Authorized access only · School Year 2026-2027</span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: MAIN ADMIN WEB PORTAL (Figures 30 - 34)
  // ==========================================
  return (
    <div className="flex h-screen w-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {/* Left Sidebar (Figures 30-34) */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 shadow-xl">
        <div>
          {/* Logo & School Header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <SchoolLogo size="sm" />
            <div>
              <h2 className="text-white font-bold text-sm tracking-wide">SIA ClearPass</h2>
              <p className="text-[10px] text-slate-400">Admin Web Portal</p>
            </div>
          </div>

          {/* Navigation Items (Figures 30-34) */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-800 text-white shadow-sm'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Clearance Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-blue-800 text-white shadow-sm'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Management (Accounts)</span>
            </button>

            <button
              onClick={() => setActiveTab('forms')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'forms'
                  ? 'bg-blue-800 text-white shadow-sm'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Clearance Form</span>
            </button>

            <button
              onClick={() => setActiveTab('periods')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'periods'
                  ? 'bg-blue-800 text-white shadow-sm'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Clearance Period</span>
            </button>

            <button
              onClick={() => setActiveTab('records')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'records'
                  ? 'bg-blue-800 text-white shadow-sm'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FolderArchive className="w-4 h-4" />
              <span>Clearance Record</span>
            </button>
          </nav>
        </div>

        {/* Footer with Reset & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => {
              setIsAdminLoggedIn(false);
              logout();
              onBackToPortal?.();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Admin Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Administrative Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              St. Isidore Academy of Trinidad Bohol, Inc.
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Administrator Web Console · Provisioning School Personnel & Students
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="block text-xs font-bold text-slate-800">Admin Office</span>
              <span className="block text-[10px] text-slate-500">System Administrator</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
              AD
            </div>
          </div>
        </header>

        {syncError && (
          <div className="bg-rose-100 border-b border-rose-300 px-6 py-2 text-xs font-medium text-rose-800" role="alert">
            Database/realtime sync issue: {syncError}
          </div>
        )}

        {/* Success Alert Banner */}
        {creationSuccessNotice && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-semibold flex items-center justify-between shadow">
            <span>{creationSuccessNotice}</span>
            <button onClick={() => setCreationSuccessNotice(null)} className="cursor-pointer text-white">
              ✕
            </button>
          </div>
        )}
        {deleteError && (
          <div className="bg-rose-100 border-b border-rose-300 px-6 py-2.5 text-xs font-semibold text-rose-800 flex items-center justify-between" role="alert">
            <span>{deleteError}</span>
            <button onClick={() => setDeleteError(null)} className="cursor-pointer text-rose-800">
              ✕
            </button>
          </div>
        )}

        {/* Dynamic Panels */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ========================================================= */}
          {/* TAB: USER MANAGEMENT - PERSONNEL & STUDENT ACCOUNTS (Figure 31) */}
          {/* ========================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-5 max-w-6xl">
              {/* Header with Title and Create Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">User Management</h1>
                  <p className="text-xs text-slate-500">
                    Administrator creates, provisions, and manages all School Personnel and Student accounts.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingPersonnelId(null);
                      setPFirstName('');
                      setPMiddleName('');
                      setPLastName('');
                      setPSuffix('');
                      setPEmployeeNo('');
                      setPUsername('');
                      setPPassword('');
                      setAddPersonnelModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Personnel (Teacher / Staff)</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingStudentId(null);
                      setSFirstName('');
                      setSMiddleName('');
                      setSLastName('');
                      setSSuffix('');
                      setSLrn('');
                      setSSchoolLevel('Junior High School');
                      setSGradeLevel('Grade 9');
                      setSSection('Rose');
                      setAddStudentModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Student</span>
                  </button>
                </div>
              </div>

              {/* Role Sub-tabs & Search Filters (Figure 31) */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                {/* Segmented Filter */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setUserTabFilter('personnel')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      userTabFilter === 'personnel'
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    School Personnel ({personnel.length})
                  </button>
                  <button
                    onClick={() => setUserTabFilter('students')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      userTabFilter === 'students'
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Students ({students.length})
                  </button>
                  <button
                    onClick={() => setUserTabFilter('all')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      userTabFilter === 'all'
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    All Accounts ({users.length})
                  </button>
                </div>

                {/* Search Bar */}
                <div className="flex-1 max-w-xs">
                  <div className="relative">
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search by name, ID, or subject..."
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900"
                    />
                  </div>
                </div>
              </div>

              {/* PERSONNEL ACCOUNTS TABLE */}
              {userTabFilter === 'personnel' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Authorized School Personnel & Clearance Signatories (Table 5.0)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Credentials configured here allow personnel to log in to the SIA ClearPass Mobile App
                    </span>
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                      <tr>
                        <th className="py-3 px-4">Employee No.</th>
                        <th className="py-3 px-4">Full Name</th>
                        <th className="py-3 px-4">Office / Department</th>
                        <th className="py-3 px-4">Assigned Subject & Role</th>
                        <th className="py-3 px-4">Target Class</th>
                        <th className="py-3 px-4">Mobile App Login</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPersonnel.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 px-4 text-center text-slate-500">
                            No personnel accounts yet. Use “Add Personnel” to create the first account.
                          </td>
                        </tr>
                      ) : filteredPersonnel.map((p) => {
                          const userAcc = users.find(u => u.user_id === p.user_id);

                          return (
                            <tr key={p.personnel_id} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-mono font-bold text-blue-900">
                                {p.employee_number}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-900">
                                {p.full_name}
                              </td>
                              <td className="py-3 px-4 text-slate-700">{p.office}</td>
                              <td className="py-3 px-4">
                                <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-900 rounded font-semibold text-[11px] border border-blue-200">
                                  {p.assigned_subject}
                                </span>
                                <span className="block text-[10px] text-slate-500 mt-0.5">
                                  {p.position}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {p.assigned_grade_level} - {p.assigned_section}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-mono text-slate-800 text-[11px]">
                                  {userAcc?.email || '—'}
                                </div>
                                {userAcc && (
                                  <span className="text-[9px] text-emerald-700 font-bold">✓ Active Login</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => beginPersonnelEdit(p)}
                                  className="p-1.5 text-slate-400 hover:text-blue-700 rounded transition-colors cursor-pointer"
                                  title="Edit Personnel Account"
                                  aria-label={`Edit ${p.full_name}`}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => void handleDeleteUser(p.user_id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                  title="Delete Personnel Account"
                                  aria-label={`Delete ${p.full_name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* STUDENTS ACCOUNTS TABLE */}
              {userTabFilter === 'students' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Registered Student Accounts (Table 4.0)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Students use their LRN or username to access requirements and clearances
                    </span>
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                      <tr>
                        <th className="py-3 px-4">LRN (Student No.)</th>
                        <th className="py-3 px-4">Full Name</th>
                        <th className="py-3 px-4">School Level</th>
                        <th className="py-3 px-4">Grade & Section</th>
                        <th className="py-3 px-4">School Year</th>
                        <th className="py-3 px-4">Clearance Status</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 px-4 text-center text-slate-500">
                            No student accounts yet. Use “Add Student” to enroll the first student.
                          </td>
                        </tr>
                      ) : filteredStudents.map((s) => {
                          const rec = records.find(r => r.student_id === s.student_id);
                          const isCleared = rec?.overall_status === 'Cleared' || rec?.progress_percentage === 100;

                          return (
                            <tr key={s.student_id} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-mono font-bold text-slate-800">
                                {s.student_number}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-900">
                                {s.last_name}, {s.first_name} {s.middle_name}
                              </td>
                              <td className="py-3 px-4 text-slate-700">{s.school_level}</td>
                              <td className="py-3 px-4 text-slate-700">
                                {s.grade_level} - {s.section}
                              </td>
                              <td className="py-3 px-4 text-slate-600 font-medium">{s.school_year}</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isCleared ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {isCleared ? 'Cleared (100%)' : `In Progress (${rec?.progress_percentage ?? 0}%)`}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => beginStudentEdit(s)}
                                  className="p-1.5 text-slate-400 hover:text-blue-700 rounded transition-colors cursor-pointer"
                                  title="Edit Student Account"
                                  aria-label={`Edit ${s.first_name} ${s.last_name}`}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => void handleDeleteUser(s.user_id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                  title="Delete Student"
                                  aria-label={`Delete ${s.first_name} ${s.last_name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ALL REGISTERED USERS TABLE */}
              {userTabFilter === 'all' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                      <tr>
                        <th className="py-3 px-4">Full Name</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Email / Username</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => (
                        <tr key={u.user_id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-semibold text-slate-900">{u.name}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                u.role === 'Student'
                                  ? 'bg-blue-100 text-blue-800'
                                  : u.role === 'Personnel'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-slate-200 text-slate-800'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                          <td className="py-3 px-4">
                            <span className="text-emerald-700 font-bold text-[10px]">Active</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {u.role !== 'Administrator' && (
                              <button
                                onClick={() => void handleDeleteUser(u.user_id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: DASHBOARD (Figure 30) */}
          {/* ========================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 max-w-6xl">
              {/* Header with Server Connection & Term Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Clearance Management Dashboard</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    School-wide clearance progress overview, real-time signatory monitoring, and student analytics.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Real-Time Central Server: Online</span>
                  </div>

                  <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-bold">
                    <span>
                      {activePeriod
                        ? `SY: ${activePeriod.school_year} ${activePeriod.term}`
                        : 'No clearance period configured'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Metric Summary Boxes (Figure 30 + SDD) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500">Total Enrolled</p>
                    <span className="p-2 bg-slate-100 text-slate-600 rounded-xl text-xs">🎓</span>
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{totalEnrolled}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Junior & Senior High School</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-emerald-200 bg-emerald-50/20 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-emerald-800">Cleared Students</p>
                    <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl text-xs">✓</span>
                  </div>
                  <p className="text-3xl font-extrabold text-emerald-700 mt-2 font-mono">{totalCleared}</p>
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">
                    {progressPercent}% clearance completion
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/20 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-amber-800">In Progress / Deficient</p>
                    <span className="p-2 bg-amber-100 text-amber-700 rounded-xl text-xs">⏳</span>
                  </div>
                  <p className="text-3xl font-extrabold text-amber-700 mt-2 font-mono">{totalUncleared}</p>
                  <p className="text-[11px] text-amber-600 font-medium mt-1">Pending department sign-offs</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-blue-200 bg-blue-50/20 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-blue-900">Signatory Dept Heads</p>
                    <span className="p-2 bg-blue-100 text-blue-800 rounded-xl text-xs">✍️</span>
                  </div>
                  <p className="text-3xl font-extrabold text-blue-900 mt-2 font-mono">{signatories.length}</p>
                  <p className="text-[11px] text-blue-700 font-medium mt-1">Authorized Department Heads</p>
                </div>
              </div>

              {/* Progress Card with Interactive Filters (Figure 30) */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Institutional Clearance Progress</h3>
                    <p className="text-xs text-slate-500">Live progress across selected school level and sections</p>
                  </div>
                  <span className="text-sm font-extrabold text-blue-900 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
                    {progressPercent}% Complete
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-6 rounded-full overflow-hidden p-1 shadow-inner border border-slate-200">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2.5 text-[10px] text-white font-bold"
                    style={{ width: `${progressPercent}%` }}
                  >
                    {progressPercent}%
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">School Level Filter</label>
                    <select
                      value={filterSchoolLevel}
                      onChange={(e) => setFilterSchoolLevel(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-700"
                    >
                      <option>All School Level</option>
                      <option>Junior High School</option>
                      <option>Senior High School</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Grade Level Filter</label>
                    <select
                      value={filterGradeLevel}
                      onChange={(e) => setFilterGradeLevel(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-700"
                    >
                      <option>All Grade Level</option>
                      <option>Grade 7</option>
                      <option>Grade 8</option>
                      <option>Grade 9</option>
                      <option>Grade 10</option>
                      <option>Grade 11</option>
                      <option>Grade 12</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Section Filter</label>
                    <select
                      value={filterSection}
                      onChange={(e) => setFilterSection(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-700"
                    >
                      <option>All Section</option>
                      <option>Rose</option>
                      <option>Daisy</option>
                      <option>Sampaguita</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Signatories Status Table */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions Panel */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                    Administrator Quick Actions
                  </h3>

                  <button
                    onClick={() => {
                      setUserTabFilter('personnel');
                      setActiveTab('users');
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-left transition-all cursor-pointer group"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-blue-900">Provision Personnel</p>
                      <p className="text-[11px] text-slate-500">Create teachers & assign clearance roles</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900 transition-transform group-hover:translate-x-1" />
                  </button>

                  <button
                    onClick={() => {
                      setUserTabFilter('students');
                      setActiveTab('users');
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-left transition-all cursor-pointer group"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-blue-900">Enroll Students</p>
                      <p className="text-[11px] text-slate-500">Add learners with 12-digit LRNs</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900 transition-transform group-hover:translate-x-1" />
                  </button>

                  <button
                    onClick={() => setActiveTab('records')}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-left transition-all cursor-pointer group"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                        View Clearance Records
                      </p>
                      <p className="text-[11px] text-slate-500">Master registry and clearance certificates</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>

                {/* Department Heads Status Preview */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs">Authorized Department Clearance Signatories</h3>
                      <p className="text-[11px] text-slate-500">Designated Department Heads with mobile sign authority</p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded-full">
                      Live Monitor
                    </span>
                  </div>

                  <div className="p-3 divide-y divide-slate-100 overflow-y-auto max-h-64">
                    {signatories.map((sig) => (
                      <div key={sig.signatory_id} className="py-2.5 px-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center text-[11px]">
                            {sig.personnel_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{sig.personnel_name}</p>
                            <p className="text-[11px] text-slate-500">{sig.office_role}</p>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Authorized Signatory
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: CLEARANCE FORM MANAGEMENT (Figure 32) */}
          {/* ========================================================= */}
          {activeTab === 'forms' && (
            <div className="space-y-4 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Clearance Form Management</h1>
                  <p className="text-xs text-slate-500">Configure clearance forms, required signatories, and academic terms.</p>
                </div>

                <button
                  onClick={() => setAddFormModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Clearance Form</span>
                </button>
              </div>

              <div className="space-y-3">
                {clearanceForms.map((cf) => (
                  <div
                    key={cf.clearance_form_id}
                    className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{cf.form_name}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        School Year: {cf.school_year} · Level: {cf.school_level} · Term: {cf.term}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{cf.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                        Active Form
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50/60 p-5 text-center">
                <h3 className="text-sm font-bold text-blue-950">Official Clearance Format</h3>
                <p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-blue-800">
                  Wala pa na-upload ang inyong official clearance form. I-send ang inyong format (photo, PDF, o Word file) aron mao gyud ang sundon sa preview ug clearance form sa system.
                </p>
                <span className="mt-3 inline-flex rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[10px] font-bold text-blue-900">Awaiting official template</span>
              </div>

              {/* Authorized Department Head Signatories Management (SDD Table 8.0) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
                <div className="p-4 border-b border-slate-200 bg-amber-50/50 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>👑</span>
                      <span>Authorized Department Head Signatories (Official Clearance Authority)</span>
                    </h3>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Only one designated Department Head per office is authorized to sign the official clearance form.
                      This ensures official accountability and prevents multiple duplicate staff signatures.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                    Exclusive Signatory Rule Active
                  </span>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Order</th>
                      <th className="py-2.5 px-4">Department / Office</th>
                      <th className="py-2.5 px-4">Authorized Department Head</th>
                      <th className="py-2.5 px-4">Designation</th>
                      <th className="py-2.5 px-4 text-center">Clearance Signing Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {signatories.map((sig, idx) => (
                      <tr key={sig.signatory_id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-400">#{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {sig.department_code === 'SCIENCE'
                            ? 'Science Department'
                            : sig.department_code === 'CASHIER'
                            ? 'Finance & Accounting (Cashier)'
                            : sig.department_code === 'LIBRARY'
                            ? 'Learning Resource Center (Library)'
                            : sig.department_code === 'ADVISER'
                            ? 'Homeroom / Academic Advising'
                            : 'Administration & Principal'}
                        </td>
                        <td className="py-3 px-4 font-bold text-blue-950 flex items-center gap-1.5">
                          <span>{sig.personnel_name}</span>
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                            Head
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{sig.office_role}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ✓ Exclusive Signatory
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: CLEARANCE PERIOD (Figure 33) */}
          {/* ========================================================= */}
          {activeTab === 'periods' && (
            <div className="space-y-4 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Clearance Period</h1>
                  <p className="text-xs text-slate-500">Set and manage clearance start and end dates.</p>
                </div>

                <button
                  onClick={() => setAddPeriodModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Clearance Period</span>
                </button>
              </div>

              <div className="space-y-3">
                {clearancePeriods.map((cp) => (
                  <div
                    key={cp.period_id}
                    className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">
                        SY: {cp.school_year} {cp.school_level} {cp.term} Clearance
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Dates: {cp.start_date} to {cp.end_date}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-800 text-xs font-bold rounded-lg border border-blue-200">
                        {cp.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: CLEARANCE RECORDS (Figure 34) */}
          {/* ========================================================= */}
          {activeTab === 'records' && (
            <div className="space-y-4 max-w-5xl">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Clearance Records</h1>
                <p className="text-xs text-slate-500">Official registry of student clearances and certificates.</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Name of Students</th>
                      <th className="py-3 px-4">LRN</th>
                      <th className="py-3 px-4">Grade & Section</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Clearance Certificate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((std) => {
                      const rec = records.find(r => r.student_id === std.student_id);
                      const isCleared = rec?.overall_status === 'Cleared' || rec?.progress_percentage === 100;

                      return (
                        <tr key={std.student_id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {std.last_name}, {std.first_name} {std.middle_name}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">{std.student_number}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {std.grade_level} - {std.section}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isCleared ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isCleared ? 'Cleared' : 'In Progress'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => setViewCertStudent(std)}
                              className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold rounded-lg border border-blue-200 text-xs transition-colors cursor-pointer"
                            >
                              View Clearance Form
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL: ADD PERSONNEL (Figure 31 / Table 5.0) */}
      {/* ========================================================= */}
      {addPersonnelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingPersonnelId ? 'Edit School Personnel' : 'Add School Personnel (Teacher / Signatory)'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {editingPersonnelId
                    ? 'Update the personnel profile. Login credentials will remain unchanged.'
                    : 'Admin registers personnel and configures their clearance role and mobile login'}
                </p>
              </div>
              <button onClick={() => {
                setAddPersonnelModalOpen(false);
                setEditingPersonnelId(null);
              }}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreatePersonnel} className="space-y-3.5 text-xs">
              {/* Personnel Name Fields */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required={!editingPersonnelId}
                    placeholder="e.g. Nelcris"
                    value={pFirstName}
                    onChange={(e) => setPFirstName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Tilacas"
                    value={pMiddleName}
                    onChange={(e) => setPMiddleName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Asoro"
                    value={pLastName}
                    onChange={(e) => setPLastName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Suffix</label>
                  <input
                    type="text"
                    placeholder="Jr./III"
                    value={pSuffix}
                    onChange={(e) => setPSuffix(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Employee No & Department */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employee Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0001"
                    value={pEmployeeNo}
                    onChange={(e) => setPEmployeeNo(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department / Office</label>
                  <select
                    value={pOffice}
                    onChange={(e) => setPOffice(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="Science Department">Science Department</option>
                    <option value="Academic Faculty">Academic Faculty (Adviser)</option>
                    <option value="Learning Resource Center">Learning Resource Center (Library)</option>
                    <option value="Finance & Accounting">Finance & Accounting (Cashier)</option>
                    <option value="Guidance & Counseling">Guidance & Counseling</option>
                  </select>
                </div>
              </div>

              {/* Subject & Position */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science"
                    value={pAssignedSubject}
                    onChange={(e) => setPAssignedSubject(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Position / Role</label>
                  <input
                    type="text"
                    value={pPosition}
                    onChange={(e) => setPPosition(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Target Grade Level & Section */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">School Level</label>
                  <select
                    value={pSchoolLevel}
                    onChange={(e) => {
                      const lvl = e.target.value;
                      setPSchoolLevel(lvl);
                      if (lvl === 'Junior High School' && !['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'All Grades'].includes(pGradeLevel)) {
                        setPGradeLevel('Grade 9');
                      } else if (lvl === 'Senior High School' && !['Grade 11', 'Grade 12', 'All Grades'].includes(pGradeLevel)) {
                        setPGradeLevel('Grade 11');
                      }
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="Junior High School">Junior High School</option>
                    <option value="Senior High School">Senior High School</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Grade Level {pSchoolLevel === 'Junior High School' ? '(7-10)' : '(11-12)'}
                  </label>
                  <select
                    value={pGradeLevel}
                    onChange={(e) => setPGradeLevel(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    {pSchoolLevel === 'Junior High School' ? (
                      <>
                        <option value="Grade 7">Grade 7 (JHS)</option>
                        <option value="Grade 8">Grade 8 (JHS)</option>
                        <option value="Grade 9">Grade 9 (JHS)</option>
                        <option value="Grade 10">Grade 10 (JHS)</option>
                        <option value="All Grades">All JHS Grades</option>
                      </>
                    ) : (
                      <>
                        <option value="Grade 11">Grade 11 (SHS)</option>
                        <option value="Grade 12">Grade 12 (SHS)</option>
                        <option value="All Grades">All SHS Grades</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    value={pSection}
                    onChange={(e) => setPSection(e.target.value)}
                    placeholder="e.g. Rose"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Login Credentials for Mobile App */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                <span className="font-bold text-blue-900 block text-[11px] uppercase tracking-wider">
                  Mobile App Login Credentials (Issued by Admin)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Username *</label>
                    <input
                      type="text"
                      required={!editingPersonnelId}
                      placeholder="e.g. nelcris.asoro"
                      value={pUsername}
                      onChange={(e) => setPUsername(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Initial Password *</label>
                    <input
                      type="password"
                      required={!editingPersonnelId}
                      placeholder={editingPersonnelId ? 'Unchanged' : '••••••••'}
                      value={pPassword}
                      onChange={(e) => setPPassword(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    const rnd = Math.floor(1000 + Math.random() * 9000);
                    setPFirstName('Nelcris');
                    setPMiddleName('Tilacas');
                    setPLastName('Asoro');
                    setPEmployeeNo(String(rnd));
                    setPUsername(`nelcris.teacher${rnd}`);
                    setPPassword(`Teach${rnd}!SIA2026`);
                  }}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs cursor-pointer border border-slate-300"
                >
                  ⚡ Fill Sample
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg font-bold text-xs cursor-pointer shadow"
                >
                  {editingPersonnelId ? 'Save Personnel Changes' : 'Create Personnel & Save to MySQL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD STUDENT (Figure 31 / Table 4.0) */}
      {/* ========================================================= */}
      {addStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingStudentId ? 'Edit Student Account' : 'Add Enrolled Student'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {editingStudentId
                    ? 'Update the student profile. Login credentials will remain unchanged.'
                    : 'Admin registers student with LRN, class section, and clearance assignment'}
                </p>
              </div>
              <button onClick={() => {
                setAddStudentModalOpen(false);
                setEditingStudentId(null);
              }}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. James"
                    value={sFirstName}
                    onChange={(e) => setSFirstName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Vale"
                    value={sMiddleName}
                    onChange={(e) => setSMiddleName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Palatan"
                    value={sLastName}
                    onChange={(e) => setSLastName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Suffix</label>
                  <input
                    type="text"
                    placeholder="None"
                    value={sSuffix}
                    onChange={(e) => setSSuffix(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">LRN (Learner Reference Number) *</label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  maxLength={12}
                  pattern="[0-9]{12}"
                  placeholder="e.g. 117947100018 (12-digit DepEd LRN)"
                  value={sLrn}
                  onChange={(e) => setSLrn(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                />
                <span className="text-[10px] text-blue-600 font-medium mt-0.5 block">
                  {editingStudentId
                    ? 'Existing student login credentials stay unchanged when you update the LRN.'
                    : 'The student signs in with the LRN as username and its last 4 digits as the initial password.'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">School Level *</label>
                  <select
                    value={sSchoolLevel}
                    onChange={(e) => {
                      const lvl = e.target.value;
                      setSSchoolLevel(lvl);
                      if (lvl === 'Junior High School' && !['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].includes(sGradeLevel)) {
                        setSGradeLevel('Grade 7');
                      } else if (lvl === 'Senior High School' && !['Grade 11', 'Grade 12'].includes(sGradeLevel)) {
                        setSGradeLevel('Grade 11');
                      }
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
                  >
                    <option value="Junior High School">Junior High School (Grades 7-10)</option>
                    <option value="Senior High School">Senior High School (Grades 11-12)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Grade Level {sSchoolLevel === 'Junior High School' ? '(7-10)' : '(11-12)'} *
                  </label>
                  <select
                    value={sGradeLevel}
                    onChange={(e) => setSGradeLevel(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
                  >
                    {sSchoolLevel === 'Junior High School' ? (
                      <>
                        <option value="Grade 7">Grade 7</option>
                        <option value="Grade 8">Grade 8</option>
                        <option value="Grade 9">Grade 9</option>
                        <option value="Grade 10">Grade 10</option>
                      </>
                    ) : (
                      <>
                        <option value="Grade 11">Grade 11</option>
                        <option value="Grade 12">Grade 12</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section *</label>
                  <input
                    type="text"
                    required
                    value={sSection}
                    onChange={(e) => setSSection(e.target.value)}
                    placeholder="e.g. Rose, STEM A"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1">
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                  Student Mobile Login
                </span>
                <p className="text-[11px] text-slate-600">Username is the 12-digit LRN. The initial password is the last 4 digits of that LRN; the administrator cannot set a separate student password here.</p>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    const rnd = Math.floor(1000 + Math.random() * 9000);
                    setSFirstName('Juan');
                    setSMiddleName('Santos');
                    setSLastName('DelaCruz');
                    setSLrn(`11794710${rnd}`);
                  }}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs cursor-pointer border border-slate-300 transition-colors"
                >
                  ⚡ Fill Sample
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs cursor-pointer shadow transition-all"
                >
                  {editingStudentId ? 'Save Student Changes' : 'Enroll Student & Save to MySQL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clearance Form Modal */}
      {addFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">Add Clearance Form</h3>
              <button onClick={() => setAddFormModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateForm} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Form Title</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">School Year</label>
                <input
                  type="text"
                  value={formSy}
                  onChange={(e) => setFormSy(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">School Level</label>
                <input
                  type="text"
                  value={formLevel}
                  onChange={(e) => setFormLevel(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Term</label>
                <input
                  type="text"
                  value={formTerm}
                  onChange={(e) => setFormTerm(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-900 text-white rounded-lg font-bold text-xs mt-3 cursor-pointer"
              >
                Save Clearance Form
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Clearance Period Modal */}
      {addPeriodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">Create Clearance Period</h3>
              <button onClick={() => setAddPeriodModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreatePeriod} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">School Year</label>
                <input
                  type="text"
                  value={periodSy}
                  onChange={(e) => setPeriodSy(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-900 text-white rounded-lg font-bold text-xs mt-3 cursor-pointer"
              >
                Save Clearance Period
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Official Certificate Modal */}
      {viewCertStudent && (
        <ClearanceCertificateModal
          isOpen={!!viewCertStudent}
          onClose={() => setViewCertStudent(null)}
          student={viewCertStudent}
        />
      )}
    </div>
  );
};
