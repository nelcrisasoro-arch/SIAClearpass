import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { useClearPass } from '../../context/ClearPassContext';
import { pickProfileImage } from '../../utils/imagePicker';
import { studentAvatarSource } from '../utils/avatarSource';

interface Props {
  onBack: () => void;
  onLogout: () => void;
}

const PRESET_AVATARS = [
  '/src/assets/images/student_id_avatar_1790959893290.jpg',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
];

export const StudentProfileScreenRN: React.FC<Props> = ({ onBack, onLogout }) => {
  const { currentStudent, updateStudentProfile, getStudentProgress } = useClearPass();

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [phone, setPhone] = useState('0912 345 6789');
  const [address, setAddress] = useState('Poblacion, Trinidad, Bohol');
  const [bio, setBio] = useState('Grade 9 Student at St. Isidore Academy');
  const [savedNotice, setSavedNotice] = useState(false);

  if (!currentStudent) return null;

  const progress = getStudentProgress(currentStudent.student_id);

  const handleSelectPreset = (url: string) => {
    updateStudentProfile(currentStudent.student_id, { avatar_url: url });
    setIsPhotoModalOpen(false);
    triggerNotice();
  };

  const handleFileUpload = async () => {
    const imageUri = await pickProfileImage();
    if (!imageUri) return;
    updateStudentProfile(currentStudent.student_id, { avatar_url: imageUri });
    setIsPhotoModalOpen(false);
    triggerNotice();
  };

  const triggerNotice = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleSaveInfo = () => {
    triggerNotice();
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Profile</Text>
        <View style={styles.siaPill}>
          <Text style={styles.siaPillText}>SIA</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollList} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {savedNotice && (
          <View style={styles.toastNotice}>
            <Text style={styles.toastNoticeText}>✓ Profile updated successfully!</Text>
          </View>
        )}

        {/* Profile Header Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarWrapper}>
            <Image
              source={studentAvatarSource(currentStudent.avatar_url)}
              style={styles.avatarImage}
            />
            {/* Edit / Add Photo Button */}
            <TouchableOpacity
              style={styles.editPhotoButton}
              onPress={() => setIsPhotoModalOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.editPhotoIcon}>📷</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.studentName}>
            {currentStudent.first_name} {currentStudent.middle_name} {currentStudent.last_name}
          </Text>
          <Text style={styles.studentGradeSection}>
            {currentStudent.grade_level} - {currentStudent.section}
          </Text>
          <Text style={styles.studentLrn}>LRN: {currentStudent.student_number}</Text>

          <TouchableOpacity
            style={styles.changePhotoPill}
            onPress={() => setIsPhotoModalOpen(true)}
          >
            <Text style={styles.changePhotoPillText}>Change / Upload Profile Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Clearance Status Summary */}
        <View style={styles.clearanceCard}>
          <View style={styles.clearanceCardHeader}>
            <Text style={styles.clearanceCardTitle}>Clearance Status</Text>
            <Text style={styles.clearancePercent}>{progress.percentage}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress.percentage}%` }]} />
          </View>
          <Text style={styles.clearanceSubtext}>
            {progress.approved} of {progress.total} department requirements verified
          </Text>
        </View>

        {/* Official Academic Details (Figure 23) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Academic Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>School Level</Text>
            <Text style={styles.infoValue}>{currentStudent.school_level}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Grade Level</Text>
            <Text style={styles.infoValue}>{currentStudent.grade_level}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Section</Text>
            <Text style={styles.infoValue}>{currentStudent.section}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>School Year</Text>
            <Text style={styles.infoValue}>{currentStudent.school_year}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Status</Text>
            <Text style={[styles.infoValue, { color: '#16a34a', fontWeight: '800' }]}>Active Enrolled</Text>
          </View>
        </View>

        {/* Personal & Contact Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Contact & Personal Details</Text>

          <View style={styles.inputFieldGroup}>
            <Text style={styles.fieldLabel}>Phone / Contact Number</Text>
            <TextInput
              style={styles.fieldInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 0912 345 6789"
            />
          </View>

          <View style={styles.inputFieldGroup}>
            <Text style={styles.fieldLabel}>Home Address / Barangay</Text>
            <TextInput
              style={styles.fieldInput}
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. Poblacion, Trinidad, Bohol"
            />
          </View>

          <View style={styles.inputFieldGroup}>
            <Text style={styles.fieldLabel}>Student Bio / Motto</Text>
            <TextInput
              style={[styles.fieldInput, { height: 60, textAlignVertical: 'top' }]}
              value={bio}
              onChangeText={setBio}
              multiline
              placeholder="Tell something about yourself..."
            />
          </View>

          <TouchableOpacity
            style={styles.saveDetailsButton}
            onPress={handleSaveInfo}
            activeOpacity={0.8}
          >
            <Text style={styles.saveDetailsButtonText}>Save Details</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={onLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>Sign Out of ClearPass</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal: Change / Add Photo */}
      <Modal
        visible={isPhotoModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPhotoModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.photoModalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Profile Photo</Text>
              <TouchableOpacity onPress={() => setIsPhotoModalOpen(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Upload a picture from your device or choose a verified student avatar:
            </Text>

            {/* Upload Button */}
            <TouchableOpacity
              style={styles.uploadFileBtn}
              onPress={() => { void handleFileUpload(); }}
              activeOpacity={0.8}
            >
              <Text style={styles.uploadFileIcon}>📁</Text>
              <View>
                <Text style={styles.uploadFileTitle}>Choose Photo from Phone</Text>
                <Text style={styles.uploadFileSub}>JPEG, PNG, or WebP</Text>
              </View>
            </TouchableOpacity>

            {/* Presets */}
            <Text style={styles.presetSectionTitle}>Or select an avatar preset:</Text>
            <View style={styles.avatarGrid}>
              {PRESET_AVATARS.map((url, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleSelectPreset(url)}
                  style={styles.presetAvatarBox}
                >
                  <Image source={studentAvatarSource(url)} style={styles.presetAvatarImg} />
                </TouchableOpacity>
              ))}
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
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 6,
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  siaPill: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  siaPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  scrollList: {
    flex: 1,
    padding: 16,
  },
  toastNotice: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  toastNoticeText: {
    color: '#15803d',
    fontWeight: '700',
    fontSize: 12,
  },
  profileHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1e3a8a',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  editPhotoIcon: {
    fontSize: 14,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  studentGradeSection: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    marginTop: 2,
  },
  studentLrn: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#64748b',
    marginTop: 2,
  },
  changePhotoPill: {
    marginTop: 10,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  changePhotoPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  clearanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  clearanceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearanceCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  clearancePercent: {
    fontSize: 14,
    fontWeight: '900',
    color: '#16a34a',
  },
  progressBarBg: {
    height: 7,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 4,
  },
  clearanceSubtext: {
    fontSize: 10,
    color: '#64748b',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: '700',
  },
  inputFieldGroup: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0f172a',
  },
  saveDetailsButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  saveDetailsButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  logoutButtonText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  photoModalSheet: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#64748b',
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 14,
  },
  uploadFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#3b82f6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  uploadFileIcon: {
    fontSize: 24,
  },
  uploadFileTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e40af',
  },
  uploadFileSub: {
    fontSize: 10,
    color: '#60a5fa',
  },
  presetSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetAvatarBox: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  presetAvatarImg: {
    width: 52,
    height: 52,
  },
});
