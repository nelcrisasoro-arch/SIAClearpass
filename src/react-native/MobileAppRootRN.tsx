import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useClearPass } from '../context/ClearPassContext';
import { StudentProfile } from '../types/clearpass';
import { LoginScreenRN } from './screens/LoginScreenRN';
import { StudentHomeScreenRN } from './screens/StudentHomeScreenRN';
import { StudentRequirementsScreenRN } from './screens/StudentRequirementsScreenRN';
import { StudentNotificationsScreenRN } from './screens/StudentNotificationsScreenRN';
import { StudentRecordsScreenRN } from './screens/StudentRecordsScreenRN';
import { StudentProfileScreenRN } from './screens/StudentProfileScreenRN';
import { PersonnelHomeScreenRN } from './screens/PersonnelHomeScreenRN';
import { PersonnelRequirementsScreenRN } from './screens/PersonnelRequirementsScreenRN';
import { PersonnelSubmissionsScreenRN } from './screens/PersonnelSubmissionsScreenRN';
import { PersonnelSignatureScreenRN } from './screens/PersonnelSignatureScreenRN';
import { PersonnelRecordsScreenRN } from './screens/PersonnelRecordsScreenRN';
import { PersonnelProfileScreenRN } from './screens/PersonnelProfileScreenRN';
import { StudentTabBarRN, PersonnelTabBarRN } from './components/BottomTabBarRN';
import { ClearanceCertificateModal } from '../components/common/ClearanceCertificateModal';

export const MobileAppRootRN: React.FC = () => {
  const { currentUser, currentRole, logout, syncError } = useClearPass();

  // Navigation tab states
  const [studentTab, setStudentTab] = useState<'home' | 'requirements' | 'records' | 'notifications' | 'profile'>('home');
  const [personnelTab, setPersonnelTab] = useState<'home' | 'requirements' | 'submissions' | 'signature' | 'records' | 'profile'>('home');

  // Certificate Modal State
  const [certificateStudent, setCertificateStudent] = useState<StudentProfile | null>(null);

  // If user is not logged in, render mobile login screen (Figure 19)
  if (!currentUser) {
    return <LoginScreenRN onSuccess={() => {}} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {syncError && (
          <Text accessibilityRole="alert" style={styles.syncError}>
            Database/realtime sync issue: {syncError}
          </Text>
        )}
        {/* Main Screen Content */}
        <View style={styles.screenWrapper}>
          {currentRole === 'Student' ? (
            <>
              {studentTab === 'home' && (
                <StudentHomeScreenRN
                  onNavigateTab={(tab) => setStudentTab(tab as any)}
                  onOpenCertificate={(std) => setCertificateStudent(std)}
                />
              )}
              {studentTab === 'requirements' && (
                <StudentRequirementsScreenRN
                  onBack={() => setStudentTab('home')}
                  onOpenCertificate={(std) => setCertificateStudent(std)}
                />
              )}
              {studentTab === 'notifications' && (
                <StudentNotificationsScreenRN
                  onBack={() => setStudentTab('home')}
                />
              )}
              {studentTab === 'records' && (
                <StudentRecordsScreenRN
                  onBack={() => setStudentTab('home')}
                  onOpenCertificate={(std) => setCertificateStudent(std)}
                />
              )}
              {studentTab === 'profile' && (
                <StudentProfileScreenRN
                  onBack={() => setStudentTab('home')}
                  onLogout={logout}
                />
              )}
            </>
          ) : (
            // Personnel Role Screens
            <>
              {personnelTab === 'home' && (
                <PersonnelHomeScreenRN
                  onNavigateTab={(tab) => setPersonnelTab(tab as any)}
                />
              )}
              {personnelTab === 'requirements' && (
                <PersonnelRequirementsScreenRN
                  onBack={() => setPersonnelTab('home')}
                  onNavigateSubmissions={() => setPersonnelTab('submissions')}
                />
              )}
              {personnelTab === 'submissions' && (
                <PersonnelSubmissionsScreenRN
                  onBack={() => setPersonnelTab('home')}
                  onNavigateSignature={() => setPersonnelTab('signature')}
                />
              )}
              {personnelTab === 'signature' && (
                <PersonnelSignatureScreenRN
                  onBack={() => setPersonnelTab('home')}
                />
              )}
              {personnelTab === 'records' && (
                <PersonnelRecordsScreenRN
                  onBack={() => setPersonnelTab('home')}
                  onOpenCertificate={(std) => setCertificateStudent(std)}
                />
              )}
              {personnelTab === 'profile' && (
                <PersonnelProfileScreenRN
                  onBack={() => setPersonnelTab('home')}
                  onLogout={logout}
                />
              )}
            </>
          )}
        </View>

        {/* Bottom Tab Bar (Figures 20 & 24) */}
        {currentRole === 'Student' ? (
          <StudentTabBarRN
            currentTab={studentTab}
            onSelectTab={(tab) => setStudentTab(tab)}
          />
        ) : (
          <PersonnelTabBarRN
            currentTab={personnelTab}
            onSelectTab={(tab) => setPersonnelTab(tab)}
          />
        )}

        {/* Official Clearance Certificate Document Modal */}
        {certificateStudent && (
          <ClearanceCertificateModal
            isOpen={!!certificateStudent}
            onClose={() => setCertificateStudent(null)}
            student={certificateStudent}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  screenWrapper: {
    flex: 1,
  },
  syncError: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
});
