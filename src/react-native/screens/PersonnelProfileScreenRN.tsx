import React, { useState, useRef } from 'react';
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

interface Props {
  onBack: () => void;
  onLogout: () => void;
}

const PRESET_PERSONNEL_AVATARS = [
  '/src/assets/images/personnel_id_avatar_1790959908050.jpg',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300',
];

export const PersonnelProfileScreenRN: React.FC<Props> = ({ onBack, onLogout }) => {
  const { currentPersonnel, updatePersonnelProfile } = useClearPass();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [phone, setPhone] = useState('0998 765 4321');
  const [roomLocation, setRoomLocation] = useState('Science Laboratory Building, Rm 204');
  const [consultationHours, setConsultationHours] = useState('Mon - Fri: 3:00 PM - 5:00 PM');
  const [savedNotice, setSavedNotice] = useState(false);

  if (!currentPersonnel) return null;

  const handleSelectPreset = (url: string) => {
    updatePersonnelProfile(currentPersonnel.personnel_id, { avatar_url: url });
    setIsPhotoModalOpen(false);
    triggerNotice();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        updatePersonnelProfile(currentPersonnel.personnel_id, { avatar_url: dataUrl });
        setIsPhotoModalOpen(false);
        triggerNotice();
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerNotice = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <View style={styles.container}>
      {/* Hidden file input for custom uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personnel Profile</Text>
        <View style={styles.siaPill}>
          <Text style={styles.siaPillText}>SIA</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollList} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {savedNotice && (
          <View style={styles.toastNotice}>
            <Text style={styles.toastNoticeText}>✓ Profile photo & details updated!</Text>
          </View>
        )}

        {/* Profile Card (Figure 27) */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri: currentPersonnel.avatar_url || '/src/assets/images/personnel_id_avatar_1790959908050.jpg',
              }}
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

          <Text style={styles.personnelName}>{currentPersonnel.full_name}</Text>
          <Text style={styles.personnelPosition}>{currentPersonnel.position}</Text>
          <Text style={styles.personnelOffice}>{currentPersonnel.office}</Text>

          {/* Department Head Badge */}
          <View style={styles.deptHeadPill}>
            <Text style={styles.deptHeadEmoji}>👑</Text>
            <Text style={styles.deptHeadText}>Authorized Department Head Signatory</Text>
          </View>

          <TouchableOpacity
            style={styles.changePhotoPill}
            onPress={() => setIsPhotoModalOpen(true)}
          >
            <Text style={styles.changePhotoPillText}>Change / Upload Profile Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Department & Clearance Signing Authority */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Signatory & Official Office</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Department Office</Text>
            <Text style={styles.infoValue}>{currentPersonnel.office}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Employee Number</Text>
            <Text style={[styles.infoValue, { fontFamily: 'monospace' }]}>{currentPersonnel.employee_number}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned Subject</Text>
            <Text style={styles.infoValue}>{currentPersonnel.assigned_subject}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned Grade & Section</Text>
            <Text style={styles.infoValue}>{currentPersonnel.assigned_grade_level} - {currentPersonnel.assigned_section}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Signing Authority</Text>
            <Text style={[styles.infoValue, { color: '#b45309', fontWeight: '800' }]}>Exclusive Department Head</Text>
          </View>
        </View>

        {/* Contact & Faculty Office Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Faculty Details & Office Hours</Text>

          <View style={styles.inputFieldGroup}>
            <Text style={styles.fieldLabel}>Phone / Extension</Text>
            <TextInput
              style={styles.fieldInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 0998 765 4321"
            />
          </View>

          <View style={styles.inputFieldGroup}>
            <Text style={styles.fieldLabel}>Office Room / Location</Text>
            <TextInput
              style={styles.fieldInput}
              value={roomLocation}
              onChangeText={setRoomLocation}
              placeholder="e.g. Science Laboratory Building"
            />
          </View>

          <View style={styles.inputFieldGroup}>
            <Text style={styles.fieldLabel}>Clearance Consultation Hours</Text>
            <TextInput
              style={styles.fieldInput}
              value={consultationHours}
              onChangeText={setConsultationHours}
              placeholder="e.g. Mon - Fri: 3:00 PM - 5:00 PM"
            />
          </View>

          <TouchableOpacity
            style={styles.saveDetailsButton}
            onPress={() => triggerNotice()}
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
              <Text style={styles.modalTitle}>Update Personnel Photo</Text>
              <TouchableOpacity onPress={() => setIsPhotoModalOpen(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Upload a verified photo from your device or select an avatar preset:
            </Text>

            {/* Upload Button */}
            <TouchableOpacity
              style={styles.uploadFileBtn}
              onPress={() => fileInputRef.current?.click()}
              activeOpacity={0.8}
            >
              <Text style={styles.uploadFileIcon}>📁</Text>
              <View>
                <Text style={styles.uploadFileTitle}>Choose Photo from Phone</Text>
                <Text style={styles.uploadFileSub}>Upload custom JPG / PNG</Text>
              </View>
            </TouchableOpacity>

            {/* Presets */}
            <Text style={styles.presetSectionTitle}>Or select an avatar preset:</Text>
            <View style={styles.avatarGrid}>
              {PRESET_PERSONNEL_AVATARS.map((url, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleSelectPreset(url)}
                  style={styles.presetAvatarBox}
                >
                  <Image source={{ uri: url }} style={styles.presetAvatarImg} />
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
  personnelName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  personnelPosition: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
    marginTop: 2,
    textAlign: 'center',
  },
  personnelOffice: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  deptHeadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 8,
  },
  deptHeadEmoji: {
    fontSize: 12,
  },
  deptHeadText: {
    color: '#92400e',
    fontSize: 10,
    fontWeight: '800',
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
