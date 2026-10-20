import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useClearPass } from '../../context/ClearPassContext';
import { apiFetch } from '../../utils/api';
import { PersonnelProfile, StudentProfile, UserRole } from '../../types/clearpass';

type Section = 'dashboard' | 'accounts' | 'forms' | 'periods' | 'records';
type AccountDraft = {
  role: 'Student' | 'Personnel';
  userId?: string;
  profileId?: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  identity: string;
  username: string;
  password: string;
  email: string;
  office: string;
  position: string;
  subject: string;
  schoolLevel: string;
  gradeLevel: string;
  section: string;
};

const blankAccount = (role: 'Student' | 'Personnel'): AccountDraft => ({
  role,
  firstName: '', middleName: '', lastName: '', suffix: '', identity: '',
  username: '', password: '', email: '', office: 'Academic Faculty',
  position: 'Subject Teacher & Clearance Signatory', subject: 'General Academics',
  schoolLevel: 'Junior High School', gradeLevel: 'Grade 9', section: 'Rose',
});

const logo = require('../../assets/images/sia_school_logo.jpg');

const AdminPortalScreenRN: React.FC = () => {
  const {
    currentUser, users, students, personnel, records, clearanceForms, clearancePeriods,
    assignments, submissions, syncError, authenticateUser, logout, addUser, deleteUser,
    updateAdminStudent, updateAdminPersonnel, addClearanceForm, addClearancePeriod,
  } = useClearPass();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [section, setSection] = useState<Section>('dashboard');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState<'All' | 'Student' | 'Personnel'>('Personnel');
  const [accountDraft, setAccountDraft] = useState<AccountDraft | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ userId: string; name: string } | null>(null);
  const [notice, setNotice] = useState('');
  const [formName, setFormName] = useState('SY: 2026-2027 Junior High School Clearance Form');
  const [formYear, setFormYear] = useState('2026-2027');
  const [formLevel, setFormLevel] = useState('Junior High School');
  const [formTerm, setFormTerm] = useState('Second Semester');
  const [periodYear, setPeriodYear] = useState('2026-2027');
  const [periodLevel, setPeriodLevel] = useState('Junior High School');
  const [periodTerm, setPeriodTerm] = useState('Second Semester');
  const [startDate, setStartDate] = useState('2026-03-01');
  const [endDate, setEndDate] = useState('2026-04-01');

  const filteredAccounts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return users.filter(user => {
      if (user.role === 'Administrator') return false;
      if (accountFilter !== 'All' && user.role !== accountFilter) return false;
      if (!term) return true;
      const profile = user.role === 'Student'
        ? students.find(item => item.user_id === user.user_id)
        : personnel.find(item => item.user_id === user.user_id);
      const searchable = [user.name, user.email, user.role,
        user.role === 'Student' ? (profile as StudentProfile | undefined)?.student_number : (profile as PersonnelProfile | undefined)?.employee_number,
      ].join(' ').toLowerCase();
      return searchable.includes(term);
    });
  }, [users, students, personnel, query, accountFilter]);

  const handleLogin = async () => {
    setBusy(true);
    setLoginError('');
    const result = await authenticateUser(username.trim(), password, 'Administrator');
    setBusy(false);
    if (!result.success) setLoginError(result.message || 'Invalid administrator username or password.');
  };

  const editStudent = (profile: StudentProfile) => {
    const user = users.find(item => item.user_id === profile.user_id);
    setAccountDraft({
      ...blankAccount('Student'), userId: profile.user_id, profileId: profile.student_id,
      firstName: profile.first_name, middleName: profile.middle_name || '', lastName: profile.last_name,
      suffix: profile.suffix || '', identity: profile.student_number, email: user?.email || '',
      schoolLevel: profile.school_level, gradeLevel: profile.grade_level, section: profile.section,
    });
  };

  const editPersonnel = (profile: PersonnelProfile) => {
    const user = users.find(item => item.user_id === profile.user_id);
    const parts = profile.full_name.split(', ');
    const given = (parts[1] || '').split(' ');
    setAccountDraft({
      ...blankAccount('Personnel'), userId: profile.user_id, profileId: profile.personnel_id,
      firstName: given[0] || '', middleName: given.slice(1, -1).join(' '), lastName: parts[0] || '',
      identity: profile.employee_number, email: user?.email || '', office: profile.office,
      position: profile.position, subject: profile.assigned_subject,
      gradeLevel: profile.assigned_grade_level, section: profile.assigned_section,
    });
  };

  const saveAccount = async () => {
    if (!accountDraft) return;
    const draft = accountDraft;
    const fullName = `${draft.lastName}, ${draft.firstName} ${draft.middleName} ${draft.suffix}`.trim();
    setBusy(true);
    setNotice('');
    try {
      if (draft.role === 'Student') {
        if (!/^\d{12}$/.test(draft.identity.trim())) throw new Error('Enter a valid 12-digit LRN.');
        if (draft.profileId) {
          await updateAdminStudent(draft.profileId, {
            student_number: draft.identity.trim(), first_name: draft.firstName.trim(),
            middle_name: draft.middleName.trim(), last_name: draft.lastName.trim(), suffix: draft.suffix.trim(),
            school_level: draft.schoolLevel, grade_level: draft.gradeLevel, section: draft.section,
            school_year: students.find(item => item.student_id === draft.profileId)?.school_year || '2026-2027',
          });
        } else {
          const userId = `usr_${Date.now()}`;
          const studentId = `std_${Date.now()}`;
          const response = await apiFetch('/api/students', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, student_id: studentId,
              student_number: draft.identity.trim(), first_name: draft.firstName.trim(),
              middle_name: draft.middleName.trim(), last_name: draft.lastName.trim(), suffix: draft.suffix.trim(),
              school_level: draft.schoolLevel, grade_level: draft.gradeLevel, section: draft.section,
              school_year: '2026-2027', username: draft.username.trim() || draft.identity.trim(),
              password: draft.identity.trim().slice(-4),
            }),
          });
          const data = await response.json();
          if (!response.ok || !data.success) throw new Error(data.error || data.message || `Server returned ${response.status}.`);
          addUser({ name: data.user.name, email: data.user.email || '', role: 'Student',
            studentNumber: data.student.student_number, schoolLevel: data.student.school_level,
            gradeLevel: data.student.grade_level, section: data.student.section,
            userId: data.user.user_id, studentId: data.student.student_id,
            firstName: draft.firstName.trim(), middleName: draft.middleName.trim(),
            lastName: draft.lastName.trim(), suffix: draft.suffix.trim(), schoolYear: '2026-2027',
          });
        }
      } else if (draft.profileId) {
        await updateAdminPersonnel(draft.profileId, {
          employee_number: draft.identity.trim(), full_name: fullName, office: draft.office,
          position: draft.position, assigned_subject: draft.subject,
          assigned_grade_level: draft.gradeLevel, assigned_section: draft.section,
        });
      } else {
        if (draft.password.trim().length < 12) throw new Error('Set a temporary password with at least 12 characters.');
        const response = await apiFetch('/api/personnel', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: `usr_${Date.now()}`, personnel_id: `per_${Date.now()}`,
            employee_number: draft.identity.trim(), full_name: fullName, office: draft.office,
            position: draft.position, assigned_subject: draft.subject, assigned_grade_level: draft.gradeLevel,
            assigned_section: draft.section, username: draft.username.trim() || `${draft.firstName}.${draft.lastName}`.toLowerCase().replace(/\s+/g, ''),
            password: draft.password.trim(), email: draft.email.trim(),
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || data.message || `Server returned ${response.status}.`);
        addUser({ name: data.user.name, email: data.user.email || '', role: 'Personnel',
          employeeNumber: data.personnel.employee_number, office: data.personnel.office,
          position: data.personnel.position, assignedSubject: data.personnel.assigned_subject,
          gradeLevel: data.personnel.assigned_grade_level, section: data.personnel.assigned_section,
          userId: data.user.user_id, personnelId: data.personnel.personnel_id,
        });
      }
      setNotice(`${draft.role} account ${draft.profileId ? 'updated' : 'saved'}.`);
      setAccountDraft(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to save this account.');
    } finally {
      setBusy(false);
    }
  };

  const saveForm = () => {
    if (!formName.trim()) return setNotice('Enter a form title before saving.');
    addClearanceForm({ form_name: formName.trim(), description: `Official ${formLevel} clearance application document for ${formYear}.`,
      school_year: formYear, school_level: formLevel, term: formTerm, status: 1, created_by: currentUser?.user_id || 'usr_admin' });
    setNotice('Clearance form saved.');
  };

  const savePeriod = () => {
    const activeForm = clearanceForms.find(form => form.status === 1) || clearanceForms[0];
    if (!activeForm) return setNotice('Create a clearance form before setting a clearance period.');
    addClearancePeriod({ clearance_form_id: activeForm.clearance_form_id,
      school_year: periodYear, school_level: periodLevel, term: periodTerm,
      start_date: startDate, end_date: endDate, status: 'Ongoing', created_by: currentUser?.user_id || 'usr_admin' });
    setNotice('Clearance period saved.');
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await deleteUser(pendingDelete.userId);
      setNotice(`${pendingDelete.name} was removed.`);
      setPendingDelete(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to delete this account.');
      setPendingDelete(null);
    } finally {
      setBusy(false);
    }
  };

  if (currentUser?.role !== 'Administrator') {
    return (
      <View style={styles.loginBackdrop}>
        <View style={styles.loginCard}>
          <Image source={logo} style={styles.loginLogo} resizeMode="contain" />
          <Text style={styles.loginTitle}>Administrator Portal</Text>
          <Text style={styles.loginSub}>St. Isidore Academy of Trinidad Bohol, Inc.</Text>
          <View style={styles.trustBadge}><Text style={styles.trustText}>OFFICIAL SCHOOL ADMIN CONSOLE</Text></View>
          {!!loginError && <Notice text={loginError} error />}
          <Field label="Administrator username" value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="Enter username" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Enter password" />
          <ActionButton label={busy ? 'Signing in…' : 'Sign in to dashboard'} onPress={() => void handleLogin()} disabled={busy} />
          {Platform.OS === 'web' && <Pressable onPress={() => { if (typeof window !== 'undefined') window.location.href = '/'; }} style={styles.linkButton}><Text style={styles.linkText}>Student & personnel sign-in</Text></Pressable>}
          <Text style={styles.loginFoot}>Administrator access is managed by the school.</Text>
        </View>
      </View>
    );
  }

  const tabs: { id: Section; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' }, { id: 'accounts', label: 'User accounts' },
    { id: 'forms', label: 'Clearance forms' }, { id: 'periods', label: 'Periods' }, { id: 'records', label: 'Records' },
  ];
  const cleared = records.filter(record => record.overall_status === 'Cleared' || record.progress_percentage === 100).length;
  const openSubmissions = submissions.filter(item => item.submission_status === 'Pending' || item.submission_status === 'With Remarks').length;

  return (
    <View style={styles.app}>
      <View style={[styles.header, wide && styles.headerWide]}>
        <View style={styles.brand}>
          <Image source={logo} style={styles.brandLogo} resizeMode="contain" />
          <View><Text style={styles.brandTitle}>SIA ClearPass</Text><Text style={styles.brandSub}>Administrator console</Text></View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.adminName}>{currentUser.name}</Text>
          <Pressable onPress={logout} style={styles.logoutButton}><Text style={styles.logoutText}>Sign out</Text></Pressable>
        </View>
      </View>

      <View style={[styles.layout, wide && styles.layoutWide]}>
        {wide ? (
          <View style={styles.sidebar}>
            <Text style={styles.navCaption}>MANAGEMENT</Text>
            {tabs.map(item => <NavButton key={item.id} label={item.label} active={section === item.id} onPress={() => setSection(item.id)} />)}
            <View style={styles.sidebarFooter}><Text style={styles.sidebarFooterText}>St. Isidore Academy</Text><Text style={styles.sidebarFooterText}>Trinidad, Bohol</Text></View>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileNav}>
            {tabs.map(item => <NavButton key={item.id} label={item.label} active={section === item.id} onPress={() => setSection(item.id)} compact />)}
          </ScrollView>
        )}

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} keyboardShouldPersistTaps="handled">
          {syncError ? <Notice text={`Database sync: ${syncError}`} error /> : null}
          {notice ? <Notice text={notice} onClose={() => setNotice('')} /> : null}

          {section === 'dashboard' && <>
            <View style={styles.pageIntro}><Text style={styles.eyebrow}>OVERVIEW</Text><Text style={styles.pageTitle}>Clearance management</Text><Text style={styles.pageSub}>Accounts, clearance periods, and school records in one place.</Text></View>
            <View style={styles.metricGrid}>
              <Metric label="Students" value={students.length} tone="blue" />
              <Metric label="Personnel" value={personnel.length} tone="purple" />
              <Metric label="Cleared" value={cleared} tone="green" />
              <Metric label="Pending reviews" value={openSubmissions} tone="amber" />
            </View>
            <View style={styles.panel}><Text style={styles.panelTitle}>Quick actions</Text><Text style={styles.panelSub}>Choose a section to manage the clearance system.</Text><View style={styles.quickGrid}>
              <ActionButton label="Manage accounts" onPress={() => setSection('accounts')} />
              <ActionButton label="Create clearance form" variant="light" onPress={() => setSection('forms')} />
              <ActionButton label="Set clearance period" variant="light" onPress={() => setSection('periods')} />
            </View></View>
            <View style={styles.panel}><Text style={styles.panelTitle}>Active clearance form</Text><Text style={styles.panelSub}>{clearanceForms.find(item => item.status === 1)?.form_name || 'No active clearance form yet.'}</Text></View>
          </>}

          {section === 'accounts' && <>
            <PageHeading eyebrow="DIRECTORY" title="School accounts" subtitle="Provision and manage student and personnel access." />
            <View style={styles.actionRow}><ActionButton label="+ Add personnel" onPress={() => setAccountDraft(blankAccount('Personnel'))} /><ActionButton label="+ Add student" variant="light" onPress={() => setAccountDraft(blankAccount('Student'))} /></View>
            <View style={styles.filterRow}>
              {(['Personnel', 'Student', 'All'] as const).map(filter => <Pressable key={filter} onPress={() => setAccountFilter(filter)} style={[styles.filterChip, accountFilter === filter && styles.filterChipActive]}><Text style={[styles.filterText, accountFilter === filter && styles.filterTextActive]}>{filter === 'All' ? 'All accounts' : `${filter}s`}</Text></Pressable>)}
            </View>
            <Field label="Search accounts" value={query} onChangeText={setQuery} placeholder="Name, ID, or email" />
            {filteredAccounts.map(user => {
              const student = user.role === 'Student' ? students.find(item => item.user_id === user.user_id) : undefined;
              const staff = user.role === 'Personnel' ? personnel.find(item => item.user_id === user.user_id) : undefined;
              const profile = student || staff;
              return <View key={user.user_id} style={styles.accountCard}>
                <View style={styles.accountAvatar}><Text style={styles.accountAvatarText}>{user.name.slice(0, 1).toUpperCase()}</Text></View>
                <View style={styles.accountMain}><Text style={styles.accountName}>{user.name}</Text><Text style={styles.accountMeta}>{user.role} · {student?.student_number || staff?.employee_number || 'ID unavailable'}</Text><Text style={styles.accountMeta}>{student ? `${student.grade_level} · ${student.section}` : staff ? `${staff.office} · ${staff.assigned_subject}` : user.email}</Text></View>
                <View style={styles.accountActions}>
                  {student && <SmallButton label="Edit" onPress={() => editStudent(student)} />}
                  {staff && <SmallButton label="Edit" onPress={() => editPersonnel(staff)} />}
                  {profile && <SmallButton label="Delete" danger onPress={() => setPendingDelete({ userId: user.user_id, name: user.name })} />}
                </View>
              </View>;
            })}
            {filteredAccounts.length === 0 && <EmptyState text="No accounts match this search." />}
          </>}

          {section === 'forms' && <>
            <PageHeading eyebrow="CONFIGURATION" title="Clearance forms" subtitle="Set the form, school year, level, and semester used by clearance records." />
            <View style={styles.panel}>
              <Field label="Form title" value={formName} onChangeText={setFormName} placeholder="Clearance form title" />
              <Field label="School year" value={formYear} onChangeText={setFormYear} placeholder="2026-2027" />
              <Field label="School level" value={formLevel} onChangeText={setFormLevel} placeholder="Junior High School" />
              <Field label="Term" value={formTerm} onChangeText={setFormTerm} placeholder="Second Semester" />
              <ActionButton label="Save clearance form" onPress={saveForm} />
            </View>
            {clearanceForms.map(form => <View key={form.clearance_form_id} style={styles.listCard}><Text style={styles.accountName}>{form.form_name}</Text><Text style={styles.accountMeta}>{form.school_year} · {form.school_level} · {form.term}</Text><StatusPill label={form.status ? 'Active' : 'Inactive'} /></View>)}
          </>}

          {section === 'periods' && <>
            <PageHeading eyebrow="SCHEDULE" title="Clearance periods" subtitle="Set when students can complete their school clearance." />
            <View style={styles.panel}>
              <Field label="School year" value={periodYear} onChangeText={setPeriodYear} placeholder="2026-2027" />
              <Field label="School level" value={periodLevel} onChangeText={setPeriodLevel} placeholder="Junior High School" />
              <Field label="Term" value={periodTerm} onChangeText={setPeriodTerm} placeholder="Second Semester" />
              <View style={styles.twoColumns}><Field label="Start date" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" /><Field label="End date" value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" /></View>
              <ActionButton label="Save clearance period" onPress={savePeriod} />
            </View>
            {clearancePeriods.map(period => <View key={period.period_id} style={styles.listCard}><Text style={styles.accountName}>{period.school_year} · {period.term}</Text><Text style={styles.accountMeta}>{period.school_level} · {period.start_date} to {period.end_date}</Text><StatusPill label={period.status} /></View>)}
          </>}

          {section === 'records' && <>
            <PageHeading eyebrow="CLEARANCE STATUS" title="Student records" subtitle="Review progress and clearance status across the current school year." />
            {records.map(record => {
              const student = students.find(item => item.student_id === record.student_id);
              const user = student && users.find(item => item.user_id === student.user_id);
              return <View key={record.clearance_record_id} style={styles.listCard}>
                <View style={styles.recordRow}><View style={styles.accountMain}><Text style={styles.accountName}>{user?.name || student?.first_name || 'Student record'}</Text><Text style={styles.accountMeta}>{student?.student_number || 'LRN unavailable'} · {record.school_year} · {record.term}</Text></View><StatusPill label={record.overall_status} /></View>
                <View style={styles.progressTrack}><View style={[styles.progressValue, { width: `${Math.max(0, Math.min(100, record.progress_percentage))}%` }]} /></View>
                <Text style={styles.accountMeta}>{record.progress_percentage}% complete</Text>
              </View>;
            })}
            {records.length === 0 && <EmptyState text="No clearance records are available yet." />}
          </>}
        </ScrollView>
      </View>

      <Modal visible={!!accountDraft} transparent animationType="fade" onRequestClose={() => setAccountDraft(null)}>
        <View style={styles.modalBackdrop}><View style={[styles.modalCard, wide && styles.modalCardWide]}>
          <View style={styles.modalHeader}><View><Text style={styles.panelTitle}>{accountDraft?.profileId ? 'Edit' : 'Add'} {accountDraft?.role} account</Text><Text style={styles.panelSub}>{accountDraft?.role === 'Student' ? 'Student uses LRN and the last four digits as initial password.' : 'Personnel accounts sign in using the username and temporary password.'}</Text></View><Pressable onPress={() => setAccountDraft(null)} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalForm}>
            <View style={styles.twoColumns}><Field label="First name" value={accountDraft?.firstName || ''} onChangeText={value => setAccountDraft(prev => prev && ({ ...prev, firstName: value }))} placeholder="First name" /><Field label="Middle name" value={accountDraft?.middleName || ''} onChangeText={value => setAccountDraft(prev => prev && ({ ...prev, middleName: value }))} placeholder="Middle name" /></View>
            <View style={styles.twoColumns}><Field label="Last name" value={accountDraft?.lastName || ''} onChangeText={value => setAccountDraft(prev => prev && ({ ...prev, lastName: value }))} placeholder="Last name" /><Field label="Suffix" value={accountDraft?.suffix || ''} onChangeText={value => setAccountDraft(prev => prev && ({ ...prev, suffix: value }))} placeholder="Optional" /></View>
            <Field label={accountDraft?.role === 'Student' ? 'LRN (12 digits)' : 'Employee number'} value={accountDraft?.identity || ''} onChangeText={value => setAccountDraft(prev => prev && ({ ...prev, identity: accountDraft?.role === 'Student' ? value.replace(/\D/g, '').slice(0, 12) : value }))} keyboardType={accountDraft?.role === 'Student' ? 'number-pad' : 'default'} placeholder={accountDraft?.role === 'Student' ? '12-digit LRN' : 'Employee number'} />
            {accountDraft?.role === 'Student' ? <>
              <Field label="School level" value={accountDraft.schoolLevel} onChangeText={value => setAccountDraft(prev => prev && ({ ...prev, schoolLevel: value }))} placeholder="Junior High School" />
              <View style={styles.twoColumns}><Field label="Grade level" value={accountDraft.gradeLevel} onChangeText={value => setAccountDraft(prev => prev && ({ ...prev, gradeLevel: value }))} placeholder="Grade 9" /><Field label="Section" value={accountDraft.section} onChangeText={value => setAccountDraft(prev => prev && ({ ...prev, section: value }))} placeholder="Rose" /></View>
              {!accountDraft.profileId && <Field label="Username (defaults to LRN)" value={accountDraft.username} onChangeText={value => setAccountDraft(prev => prev && ({ ...prev, username: value }))} autoCapitalize="none" placeholder="Optional" />}
            </> : <>
              <Field label="Office / department" value={accountDraft?.office || ''} onChangeText={value => setAccountDraft(prev => prev && ({ ...prev, office: value }))} placeholder="Office" />
              <Field label="Position" value={accountDraft?.position || ''} onChangeText={value => setAccountDraft(prev => prev && ({ ...prev, position: value }))} placeholder="Position" />
              <Field label="Assigned subject" value={accountDraft?.subject || ''} onChangeText={value => setAccountDraft(prev => prev && ({ ...prev, subject: value }))} placeholder="Subject" />
              <View style={styles.twoColumns}><Field label="Grade level" value={accountDraft?.gradeLevel || ''} onChangeText={value => setAccountDraft(prev => prev && ({ ...prev, gradeLevel: value }))} placeholder="Grade 9" /><Field label="Section" value={accountDraft?.section || ''} onChangeText={value => setAccountDraft(prev => prev && ({ ...prev, section: value }))} placeholder="All sections" /></View>
              {!accountDraft?.profileId && <><Field label="Username" value={accountDraft?.username || ''} onChangeText={value => setAccountDraft(prev => prev && ({ ...prev, username: value }))} autoCapitalize="none" placeholder="name.surname" /><Field label="Temporary password (12+ characters)" value={accountDraft?.password || ''} onChangeText={value => setAccountDraft(prev => prev && ({ ...prev, password: value }))} secureTextEntry placeholder="Set a temporary password" /><Field label="Email (optional)" value={accountDraft?.email || ''} onChangeText={value => setAccountDraft(prev => prev && ({ ...prev, email: value }))} autoCapitalize="none" keyboardType="email-address" placeholder="name@example.com" /></>}
            </>}
            <View style={styles.actionRow}><ActionButton label={busy ? 'Saving…' : 'Save account'} onPress={() => void saveAccount()} disabled={busy} /><ActionButton label="Cancel" variant="light" onPress={() => setAccountDraft(null)} /></View>
          </ScrollView>
        </View></View>
      </Modal>

      <Modal visible={!!pendingDelete} transparent animationType="fade" onRequestClose={() => setPendingDelete(null)}>
        <View style={styles.modalBackdrop}><View style={styles.confirmCard}><Text style={styles.panelTitle}>Delete account?</Text><Text style={styles.panelSub}>This removes {pendingDelete?.name} from the school account list.</Text><View style={styles.actionRow}><ActionButton label={busy ? 'Deleting…' : 'Delete account'} danger onPress={() => void handleDelete()} disabled={busy} /><ActionButton label="Cancel" variant="light" onPress={() => setPendingDelete(null)} /></View></View></View>
      </Modal>
    </View>
  );
};

const PageHeading: React.FC<{ eyebrow: string; title: string; subtitle: string }> = ({ eyebrow, title, subtitle }) => <View style={styles.pageIntro}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.pageTitle}>{title}</Text><Text style={styles.pageSub}>{subtitle}</Text></View>;

const Field: React.FC<React.ComponentProps<typeof TextInput> & { label: string }> = ({ label, style, ...props }) => (
  <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>{label}</Text><TextInput {...props} style={[styles.input, style]} placeholderTextColor="#94a3b8" /></View>
);

const ActionButton: React.FC<{ label: string; onPress: () => void; variant?: 'primary' | 'light'; danger?: boolean; disabled?: boolean }> = ({ label, onPress, variant = 'primary', danger, disabled }) => (
  <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.actionButton, variant === 'light' && styles.actionButtonLight, danger && styles.actionButtonDanger, disabled && styles.disabledButton, pressed && !disabled && styles.pressedButton]}><Text style={[styles.actionButtonText, variant === 'light' && styles.actionButtonTextLight]}>{label}</Text></Pressable>
);

const SmallButton: React.FC<{ label: string; onPress: () => void; danger?: boolean }> = ({ label, onPress, danger }) => <Pressable onPress={onPress} style={[styles.smallButton, danger && styles.smallDanger]}><Text style={[styles.smallButtonText, danger && styles.smallDangerText]}>{label}</Text></Pressable>;

const NavButton: React.FC<{ label: string; active: boolean; onPress: () => void; compact?: boolean }> = ({ label, active, onPress, compact }) => <Pressable onPress={onPress} style={[styles.navButton, active && styles.navButtonActive, compact && styles.navButtonCompact]}><Text style={[styles.navButtonText, active && styles.navButtonTextActive]}>{label}</Text></Pressable>;

const Metric: React.FC<{ label: string; value: number; tone: 'blue' | 'purple' | 'green' | 'amber' }> = ({ label, value, tone }) => <View style={[styles.metricCard, styles[`metric_${tone}`]]}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;

const Notice: React.FC<{ text: string; error?: boolean; onClose?: () => void }> = ({ text, error, onClose }) => <View style={[styles.notice, error && styles.noticeError]}><Text style={[styles.noticeText, error && styles.noticeErrorText]}>{text}</Text>{onClose && <Pressable onPress={onClose}><Text style={styles.noticeDismiss}>×</Text></Pressable>}</View>;

const StatusPill: React.FC<{ label: string }> = ({ label }) => <View style={styles.statusPill}><Text style={styles.statusPillText}>{label}</Text></View>;

const EmptyState: React.FC<{ text: string }> = ({ text }) => <View style={styles.emptyState}><Text style={styles.emptyText}>{text}</Text></View>;

const styles = StyleSheet.create({
  app: { flex: 1, minHeight: '100%', backgroundColor: '#f4f7fc' },
  loginBackdrop: { flex: 1, minHeight: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f1c42', padding: 20 },
  loginCard: { width: '100%', maxWidth: 430, backgroundColor: '#fff', borderRadius: 24, padding: 28, borderWidth: 1, borderColor: '#dbe4f1', shadowColor: '#071633', shadowOpacity: 0.18, shadowRadius: 20, elevation: 7 },
  loginLogo: { width: 92, height: 92, alignSelf: 'center', borderRadius: 46, marginBottom: 14 },
  loginTitle: { color: '#122349', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  loginSub: { marginTop: 5, marginBottom: 12, color: '#64748b', fontSize: 12, textAlign: 'center' },
  trustBadge: { alignSelf: 'center', backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 18 },
  trustText: { color: '#1e3a8a', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  loginFoot: { color: '#94a3b8', textAlign: 'center', fontSize: 11, marginTop: 18 },
  linkButton: { alignSelf: 'center', padding: 12 }, linkText: { color: '#1e40af', fontWeight: '700', fontSize: 12 },
  header: { minHeight: 72, backgroundColor: '#fff', borderBottomColor: '#e2e8f0', borderBottomWidth: 1, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerWide: { paddingHorizontal: 28 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 }, brandLogo: { width: 46, height: 46, borderRadius: 23 },
  brandTitle: { color: '#122349', fontSize: 16, fontWeight: '800' }, brandSub: { color: '#64748b', fontSize: 11, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 }, adminName: { color: '#475569', fontSize: 12, fontWeight: '700' },
  logoutButton: { borderRadius: 10, borderColor: '#dbe3ef', borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 }, logoutText: { color: '#334155', fontSize: 12, fontWeight: '700' },
  layout: { flex: 1 }, layoutWide: { flexDirection: 'row', alignItems: 'stretch' },
  sidebar: { width: 238, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#e2e8f0', padding: 18 }, navCaption: { color: '#94a3b8', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginHorizontal: 12, marginTop: 10, marginBottom: 12 },
  navButton: { paddingHorizontal: 13, paddingVertical: 12, borderRadius: 11, marginBottom: 5 }, navButtonActive: { backgroundColor: '#eaf1ff' }, navButtonText: { color: '#64748b', fontWeight: '700', fontSize: 12 }, navButtonTextActive: { color: '#17377e' },
  navButtonCompact: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8, marginBottom: 0 }, mobileNav: { paddingHorizontal: 14, paddingVertical: 12 },
  sidebarFooter: { marginTop: 'auto', padding: 12, borderTopWidth: 1, borderColor: '#e2e8f0' }, sidebarFooterText: { color: '#94a3b8', fontSize: 10, marginVertical: 2 },
  content: { flex: 1 }, contentInner: { width: '100%', maxWidth: 1250, alignSelf: 'center', padding: 22, paddingBottom: 48 },
  pageIntro: { marginBottom: 20 }, eyebrow: { color: '#3461b5', fontSize: 10, letterSpacing: 1.2, fontWeight: '800', marginBottom: 6 }, pageTitle: { color: '#122349', fontSize: 26, fontWeight: '800' }, pageSub: { color: '#64748b', fontSize: 13, lineHeight: 19, marginTop: 5 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18 }, metricCard: { flexGrow: 1, flexBasis: 155, minHeight: 115, borderRadius: 16, padding: 18, borderWidth: 1 }, metric_blue: { backgroundColor: '#eff6ff', borderColor: '#dbeafe' }, metric_purple: { backgroundColor: '#f5f3ff', borderColor: '#e9d5ff' }, metric_green: { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' }, metric_amber: { backgroundColor: '#fffbeb', borderColor: '#fde68a' }, metricValue: { color: '#122349', fontSize: 28, fontWeight: '800' }, metricLabel: { color: '#64748b', marginTop: 5, fontSize: 12, fontWeight: '600' },
  panel: { backgroundColor: '#fff', borderRadius: 16, borderColor: '#e2e8f0', borderWidth: 1, padding: 19, marginBottom: 16, shadowColor: '#0f172a', shadowOpacity: 0.03, shadowRadius: 7, elevation: 1 }, panelTitle: { color: '#122349', fontSize: 16, fontWeight: '800' }, panelSub: { color: '#64748b', fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: 12 }, quickGrid: { gap: 9, marginTop: 5 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 14 }, actionButton: { minHeight: 42, backgroundColor: '#1e3a8a', borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, paddingVertical: 11 }, actionButtonLight: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#dbeafe' }, actionButtonDanger: { backgroundColor: '#b91c1c' }, actionButtonText: { color: '#fff', fontWeight: '800', fontSize: 12 }, actionButtonTextLight: { color: '#1e3a8a' }, disabledButton: { opacity: 0.55 }, pressedButton: { opacity: 0.82 },
  fieldGroup: { width: '100%', marginBottom: 12 }, fieldLabel: { color: '#334155', fontSize: 11, fontWeight: '700', marginBottom: 5 }, input: { width: '100%', minHeight: 42, borderRadius: 9, borderColor: '#cbd5e1', borderWidth: 1, backgroundColor: '#f8fafc', color: '#0f172a', paddingHorizontal: 11, paddingVertical: 9, fontSize: 13 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 8 }, filterChip: { borderRadius: 20, borderWidth: 1, borderColor: '#dbe3ef', paddingHorizontal: 13, paddingVertical: 8, backgroundColor: '#fff' }, filterChipActive: { backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }, filterText: { color: '#64748b', fontWeight: '700', fontSize: 11 }, filterTextActive: { color: '#fff' },
  accountCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 13, padding: 13, marginBottom: 9 }, accountAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center' }, accountAvatarText: { color: '#1e3a8a', fontWeight: '800', fontSize: 17 }, accountMain: { flex: 1, minWidth: 0 }, accountName: { color: '#172554', fontWeight: '800', fontSize: 13 }, accountMeta: { color: '#64748b', fontSize: 10, marginTop: 3 }, accountActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, smallButton: { paddingHorizontal: 10, paddingVertical: 7, borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 8 }, smallButtonText: { color: '#334155', fontSize: 10, fontWeight: '700' }, smallDanger: { borderColor: '#fecaca', backgroundColor: '#fff7f7' }, smallDangerText: { color: '#b91c1c' },
  listCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 13, padding: 15, marginBottom: 9 }, recordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, statusPill: { backgroundColor: '#eff6ff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' }, statusPillText: { color: '#1e3a8a', fontSize: 10, fontWeight: '800' }, progressTrack: { height: 7, borderRadius: 4, backgroundColor: '#e2e8f0', overflow: 'hidden', marginTop: 13, marginBottom: 5 }, progressValue: { height: '100%', borderRadius: 4, backgroundColor: '#16a34a' },
  twoColumns: { flexDirection: 'row', gap: 10 }, notice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#bbf7d0', padding: 11, borderRadius: 10, marginBottom: 13 }, noticeError: { backgroundColor: '#fff1f2', borderColor: '#fecdd3' }, noticeText: { flex: 1, color: '#166534', fontSize: 11, fontWeight: '600' }, noticeErrorText: { color: '#be123c' }, noticeDismiss: { color: '#64748b', fontSize: 19, paddingHorizontal: 6 },
  emptyState: { backgroundColor: '#fff', padding: 24, borderRadius: 13, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' }, emptyText: { color: '#64748b', fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', alignItems: 'center', justifyContent: 'center', padding: 16 }, modalCard: { width: '100%', maxWidth: 620, maxHeight: '92%', backgroundColor: '#fff', borderRadius: 18, padding: 18 }, modalCardWide: { maxWidth: 680 }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }, modalForm: { paddingBottom: 8 }, closeButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }, closeText: { color: '#475569', fontSize: 22, lineHeight: 25 }, confirmCard: { width: '100%', maxWidth: 430, backgroundColor: '#fff', borderRadius: 16, padding: 20 },
});

export default AdminPortalScreenRN;
