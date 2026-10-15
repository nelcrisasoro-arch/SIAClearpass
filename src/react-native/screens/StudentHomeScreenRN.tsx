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
import { StudentProfile } from '../../types/clearpass';
import schoolLogoUrl from '../../assets/images/sia_school_logo.jpg';

interface Props {
  onNavigateTab: (tab: 'home' | 'requirements' | 'records' | 'notifications' | 'profile') => void;
  onOpenCertificate: (student: StudentProfile) => void;
}

export const StudentHomeScreenRN: React.FC<Props> = ({
  onNavigateTab,
  onOpenCertificate,
}) => {
  const {
    currentStudent,
    signatories,
    signatures,
    personnel,
    activePeriod,
    notifications,
    getStudentProgress,
    logout,
  } = useClearPass();

  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const student = currentStudent;
  if (!student) return null;

  const progress = getStudentProgress(student.student_id);
  const unreadNotifs = notifications.filter(n => !n.is_read && n.user_id === 'usr_student_joseph').length;

  return (
    <View style={styles.container}>
      {/* Top Header Bar (Figure 20) */}
      <View style={styles.topBar}>
        <Image source={schoolLogoUrl} style={styles.siaLogo} />

        <View style={styles.topRightIcons}>
          {/* Notification Bell */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onNavigateTab('notifications')}
            activeOpacity={0.7}
          >
            <Text style={styles.headerIconEmoji}>🔔</Text>
            {unreadNotifs > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadNotifs}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Profile Details Trigger */}
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
            Welcome, {student.first_name}!
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Let's get your clearance completed.
          </Text>
        </View>

        {/* Clearance Card (Figure 20) */}
        <View style={styles.clearanceCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.syText}>SY: {student.school_year}</Text>
              <Text style={styles.periodText}>
                Clearance period: {activePeriod ? `${activePeriod.start_date} - ${activePeriod.end_date}` : 'March 1 - April 1'}
              </Text>
            </View>
            <View style={styles.daysBadge}>
              <Text style={styles.clockIcon}>⏱️</Text>
              <Text style={styles.daysText}>20 days left</Text>
            </View>
          </View>

          {/* Progress Box */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTextCol}>
              <Text style={styles.progressLabel}>Clearance Progress</Text>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, Math.max(0, progress.percentage))}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressSubText}>
                {progress.approved} of {progress.total} requirements approved
              </Text>
            </View>

            <View style={styles.progressGaugeBox}>
              <Text style={styles.progressPercentageText}>{progress.percentage}%</Text>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.cardActionRow}>
            <TouchableOpacity
              style={styles.viewTasksButton}
              onPress={() => onNavigateTab('requirements')}
              activeOpacity={0.8}
            >
              <Text style={styles.viewTasksButtonText}>View Requirements</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.certificateButton}
              onPress={() => onOpenCertificate(student)}
              activeOpacity={0.8}
            >
              <Text style={styles.certificateButtonText}>
                {progress.percentage === 100 ? '🎓 Download Clearance' : '📄 Preview Form'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Required Signatories Table (Figure 20) */}
        <View style={styles.signatoriesSection}>
          <Text style={styles.sectionTitle}>Required Signatories</Text>

          <View style={styles.tableCard}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Name</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Role</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Status</Text>
            </View>

            {signatories.map((sig, index) => {
              const pers = personnel.find(p => p.personnel_id === sig.personnel_id);
              const isSigned = progress.percentage === 100 || sig.signatory_order > 1;

              return (
                <View key={sig.signatory_id} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                  <View style={{ flex: 1.4 }}>
                    <Text style={styles.signatoryNameText} numberOfLines={1}>
                      {pers?.full_name || sig.personnel_name}
                    </Text>
                    <Text style={styles.signatoryOfficeText} numberOfLines={1}>
                      {pers?.office || 'Department'}
                    </Text>
                  </View>

                  <Text style={[styles.signatoryRoleText, { flex: 1.2 }]} numberOfLines={1}>
                    {sig.office_role}
                  </Text>

                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <View
                      style={[
                        styles.statusBadge,
                        isSigned ? styles.statusBadgeSigned : styles.statusBadgePending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isSigned ? styles.statusBadgeTextSigned : styles.statusBadgeTextPending,
                        ]}
                      >
                        {isSigned ? 'Signed' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Profile Details Modal / Drawer (Figure 20 Right) */}
      <Modal
        visible={profileModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileSheetContainer}>
            {/* Modal Header with Back Arrow */}
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

            {/* Profile Info Fields (Figure 20 Right) */}
            <View style={styles.profileDetailsContent}>
              <View style={styles.avatarRow}>
                <Image
                  source={{ uri: student.avatar_url || '/src/assets/images/student_id_avatar_1790959893290.jpg' }}
                  style={styles.profileAvatar}
                />
                <View style={styles.avatarMeta}>
                  <Text style={styles.avatarName}>
                    {student.last_name}, {student.first_name} {student.middle_name}
                  </Text>
                  <Text style={styles.avatarLrn}>LRN: {student.student_number}</Text>
                </View>
              </View>

              <View style={styles.infoFieldBox}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Full Name:</Text>
                  <Text style={styles.infoValue}>
                    {student.last_name}, {student.first_name} {student.middle_name}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>LRN:</Text>
                  <Text style={styles.infoValue}>{student.student_number}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>School Level:</Text>
                  <Text style={styles.infoValue}>{student.school_level}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Grade Level:</Text>
                  <Text style={styles.infoValue}>{student.grade_level}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Section:</Text>
                  <Text style={styles.infoValue}>{student.section}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>School Year:</Text>
                  <Text style={styles.infoValue}>{student.school_year}</Text>
                </View>
              </View>

              {/* Logout Button */}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  clearanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  syText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  periodText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  clockIcon: {
    fontSize: 12,
  },
  daysText: {
    fontSize: 10,
    color: '#1e3a8a',
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  progressTextCol: {
    flex: 1,
    marginRight: 12,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1e3a8a',
    borderRadius: 4,
  },
  progressSubText: {
    fontSize: 10,
    color: '#64748b',
  },
  progressGaugeBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentageText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  cardActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  viewTasksButton: {
    flex: 1,
    backgroundColor: '#1e3a8a',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewTasksButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  certificateButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  certificateButtonText: {
    color: '#1e293b',
    fontSize: 11,
    fontWeight: '600',
  },
  signatoriesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableRowAlt: {
    backgroundColor: '#fafbfc',
  },
  signatoryNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  signatoryOfficeText: {
    fontSize: 10,
    color: '#64748b',
  },
  signatoryRoleText: {
    fontSize: 11,
    color: '#334155',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeSigned: {
    backgroundColor: '#dcfce7',
  },
  statusBadgePending: {
    backgroundColor: '#fef3c7',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadgeTextSigned: {
    color: '#15803d',
  },
  statusBadgeTextPending: {
    color: '#b45309',
  },

  // Modal Sheet Styles
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
  avatarLrn: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  infoFieldBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
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
});
