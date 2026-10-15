import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
} from 'react-native';
import { useClearPass } from '../../context/ClearPassContext';
import schoolLogoUrl from '../../assets/images/sia_school_logo.jpg';

interface Props {
  onNavigateTab: (tab: 'home' | 'requirements' | 'submissions' | 'signature' | 'records' | 'profile') => void;
}

export const PersonnelHomeScreenRN: React.FC<Props> = ({ onNavigateTab }) => {
  const {
    currentPersonnel,
    students,
    activePeriod,
    submissions,
    assignments,
    logout,
  } = useClearPass();

  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const teacher = currentPersonnel;
  if (!teacher) return null;

  // Filter students under this teacher
  const assignedStudents = students.filter(
    s => s.grade_level === teacher.assigned_grade_level || teacher.assigned_grade_level === 'All Grades'
  );

  const totalAssigned = 20; // SDD prototype specification: 20 Students
  const pendingSubmissions = submissions.filter(s => s.submission_status === 'Pending').length;
  const signedCount = 1;
  const pendingCount = 19;

  return (
    <View style={styles.container}>
      {/* Top Header Bar (Figure 24) */}
      <View style={styles.topBar}>
        <Image source={{ uri: schoolLogoUrl }} style={styles.siaLogo} />

        <View style={styles.topRightIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onNavigateTab('submissions')}
            activeOpacity={0.7}
          >
            <Text style={styles.headerIconEmoji}>🔔</Text>
            {pendingSubmissions > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{pendingSubmissions}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onNavigateTab('profile')}
            activeOpacity={0.7}
          >
            <Text style={styles.headerIconEmoji}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Welcome, {teacher.full_name.split(' ')[0]}!
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Let's keep student clearances moving.
          </Text>
        </View>

        {/* Authorized Department Head Banner */}
        <View style={styles.deptHeadBanner}>
          <Text style={styles.deptHeadEmoji}>👑</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.deptHeadTitle}>Authorized Department Head Signatory</Text>
            <Text style={styles.deptHeadOffice}>{teacher.office} · Exclusive Official Signatory</Text>
          </View>
        </View>

        {/* Clearance Period Card (Figure 24) */}
        <View style={styles.periodCard}>
          <Text style={styles.syText}>SY: {activePeriod?.school_year || '2026-2027'}</Text>
          <Text style={styles.periodRangeText}>
            Clearance period: {activePeriod ? `${activePeriod.start_date} - ${activePeriod.end_date}` : 'March 1 - April 1'}
          </Text>
        </View>

        {/* Big Statistics Grid (Figure 24) */}
        <View style={styles.statsContainer}>
          {/* Total Students Card */}
          <View style={styles.totalStudentsCard}>
            <View style={styles.totalStudentsHeader}>
              <View style={styles.totalIconGroup}>
                <Text style={styles.totalStudentsEmoji}>👥</Text>
                <Text style={styles.totalStudentsNumber}>{totalAssigned}</Text>
                <Text style={styles.totalStudentsLabel}>Students</Text>
              </View>

              <View style={styles.assignedRolePill}>
                <Text style={styles.assignedRolePillText}>All assigned roles ▾</Text>
              </View>
            </View>
          </View>

          {/* Signed & Pending Columns (Figure 24) */}
          <View style={styles.signedPendingRow}>
            {/* Signed Box */}
            <TouchableOpacity
              style={styles.signedBox}
              onPress={() => onNavigateTab('records')}
              activeOpacity={0.8}
            >
              <View style={styles.statIconCircleGreen}>
                <Text style={styles.statIconEmoji}>✓</Text>
              </View>
              <View>
                <Text style={styles.statNumber}>{signedCount}</Text>
                <Text style={styles.statLabel}>Signed</Text>
              </View>
            </TouchableOpacity>

            {/* Pending Box */}
            <TouchableOpacity
              style={styles.pendingBox}
              onPress={() => onNavigateTab('submissions')}
              activeOpacity={0.8}
            >
              <View style={styles.statIconCircleAmber}>
                <Text style={styles.statIconEmoji}>⏳</Text>
              </View>
              <View>
                <Text style={styles.statNumber}>{pendingCount}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Action Navigation Buttons */}
        <View style={styles.quickNavSection}>
          <Text style={styles.sectionHeader}>Clearance Management</Text>

          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => onNavigateTab('submissions')}
            activeOpacity={0.8}
          >
            <View style={styles.quickTileIconCircle}>
              <Text style={styles.quickTileEmoji}>📥</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickTileTitle}>Student Submissions</Text>
              <Text style={styles.quickTileDesc}>Review files, approve tasks, or send remarks</Text>
            </View>
            <View style={styles.pendingCountPill}>
              <Text style={styles.pendingCountPillText}>{pendingSubmissions} new</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => onNavigateTab('requirements')}
            activeOpacity={0.8}
          >
            <View style={styles.quickTileIconCircle}>
              <Text style={styles.quickTileEmoji}>📝</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickTileTitle}>Post Requirements</Text>
              <Text style={styles.quickTileDesc}>Create new clearance requirements for classes</Text>
            </View>
            <Text style={styles.chevronText}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => onNavigateTab('signature')}
            activeOpacity={0.8}
          >
            <View style={styles.quickTileIconCircle}>
              <Text style={styles.quickTileEmoji}>✍️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickTileTitle}>Digital Signature</Text>
              <Text style={styles.quickTileDesc}>Register or edit your official e-signature pad</Text>
            </View>
            <Text style={styles.chevronText}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Profile Details Modal / Drawer (Figure 24 Right) */}
      <Modal
        visible={profileModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileSheetContainer}>
            {/* Sheet Header */}
            <View style={styles.sheetHeader}>
              <TouchableOpacity
                onPress={() => setProfileModalVisible(false)}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>Profile Details</Text>
              <View style={styles.siaMiniBadge}>
                <Text style={styles.siaMiniBadgeText}>SIA</Text>
              </View>
            </View>

            {/* Profile Info (Figure 24 Right) */}
            <View style={styles.profileDetailsContent}>
              <View style={styles.avatarRow}>
                <Image
                  source={{ uri: teacher.avatar_url || '/src/assets/images/personnel_id_avatar_1790959908050.jpg' }}
                  style={styles.profileAvatar}
                />
                <View style={styles.avatarMeta}>
                  <Text style={styles.avatarName}>{teacher.full_name}</Text>
                  <Text style={styles.avatarId}>ID: {teacher.employee_number}</Text>
                </View>
              </View>

              <View style={styles.assignedRolesCard}>
                <Text style={styles.assignedRolesTitle}>Assigned Roles:</Text>

                <View style={styles.roleTableContainer}>
                  <View style={styles.roleTableHeaderRow}>
                    <Text style={[styles.roleTableHeaderCell, { flex: 1.4 }]}>Role/Subject</Text>
                    <Text style={[styles.roleTableHeaderCell, { flex: 1.2 }]}>Grade Level</Text>
                    <Text style={[styles.roleTableHeaderCell, { flex: 1 }]}>Section</Text>
                  </View>

                  <View style={styles.roleTableRow}>
                    <Text style={[styles.roleTableCell, { flex: 1.4, fontWeight: '700' }]}>
                      {teacher.assigned_subject}
                    </Text>
                    <Text style={[styles.roleTableCell, { flex: 1.2 }]}>
                      {teacher.assigned_grade_level}
                    </Text>
                    <Text style={[styles.roleTableCell, { flex: 1 }]}>
                      {teacher.assigned_section}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Logout Button (Figure 24 Right) */}
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={() => {
                  setProfileModalVisible(false);
                  logout();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  siaPill: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  siaLogo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#1e3a8a',
  },
  siaPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  topRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    position: 'relative',
    padding: 6,
  },
  headerIconEmoji: {
    fontSize: 20,
  },
  unreadBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    marginBottom: 14,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  periodCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  syText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  periodRangeText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  statsContainer: {
    gap: 10,
    marginBottom: 18,
  },
  totalStudentsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  totalStudentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalStudentsEmoji: {
    fontSize: 22,
  },
  totalStudentsNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  totalStudentsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  assignedRolePill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  assignedRolePillText: {
    fontSize: 10,
    color: '#1e3a8a',
    fontWeight: '600',
  },
  signedPendingRow: {
    flexDirection: 'row',
    gap: 10,
  },
  signedBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconCircleGreen: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconCircleAmber: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconEmoji: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pendingBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  quickNavSection: {
    marginBottom: 20,
    gap: 10,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  quickActionTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  quickTileIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTileEmoji: {
    fontSize: 18,
  },
  quickTileTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  quickTileDesc: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  pendingCountPill: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingCountPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b91c1c',
  },
  chevronText: {
    fontSize: 18,
    color: '#94a3b8',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  profileSheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 6,
  },
  backButtonText: {
    fontSize: 20,
    color: '#1e3a8a',
    fontWeight: 'bold',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  siaMiniBadge: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  siaMiniBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileDetailsContent: {
    padding: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 14,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#1e3a8a',
  },
  avatarMeta: {
    flex: 1,
  },
  avatarName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  avatarId: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  assignedRolesCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  assignedRolesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  roleTableContainer: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  roleTableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  roleTableHeaderCell: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  roleTableRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  roleTableCell: {
    fontSize: 11,
    color: '#0f172a',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  deptHeadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#fcd34d',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 10,
  },
  deptHeadEmoji: {
    fontSize: 20,
  },
  deptHeadTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deptHeadOffice: {
    fontSize: 10,
    color: '#b45309',
    fontWeight: '500',
    marginTop: 1,
  },
});
