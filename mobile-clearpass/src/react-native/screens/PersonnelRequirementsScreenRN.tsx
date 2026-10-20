import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { useClearPass } from '../../context/ClearPassContext';

interface Props {
  onBack: () => void;
  onNavigateSubmissions: () => void;
}

export const PersonnelRequirementsScreenRN: React.FC<Props> = ({
  onBack,
  onNavigateSubmissions,
}) => {
  const {
    currentPersonnel,
    requirements,
    students,
    activeForm,
    addRequirement,
  } = useClearPass();

  const [postModalVisible, setPostModalVisible] = useState(false);
  const [taskName, setTaskName] = useState('Activity 4: Eco-System Research Paper');
  const [description, setDescription] = useState('Submit a 2-page synthesis on local Bohol marine biodiversity.');
  const [category, setCategory] = useState(currentPersonnel?.assigned_subject || 'Science');
  const [schoolLevel, setSchoolLevel] = useState('Junior High School');
  const [gradeLevel, setGradeLevel] = useState('Grade 9');
  const [section, setSection] = useState('Rose, Daisy');
  const [requireAttachment, setRequireAttachment] = useState(true);

  const teacher = currentPersonnel;
  if (!teacher) return null;

  const teacherReqs = requirements.filter(
    r => r.category === teacher.assigned_subject || r.personnel_id === teacher.personnel_id
  );

  const handleSaveRequirement = () => {
    if (!taskName.trim()) return;

    addRequirement({
      clearance_form_id: activeForm?.clearance_form_id || 'form_2026_jhs_sec_sem',
      requirement_name: taskName,
      description,
      office: teacher.assigned_subject,
      category,
      grade_level: gradeLevel,
      section,
      is_required: true,
      allowed_file_type: requireAttachment ? 'PDF, DOCX, JPG' : 'None',
      max_file_size_mb: 10,
      personnel_id: teacher.personnel_id,
      status: 1,
      created_by: teacher.personnel_id,
    });

    setPostModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Requirements</Text>
        <View style={styles.siaPill}>
          <Text style={styles.siaPillText}>SIA</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
        {/* Post Requirement Button (Figure 25) */}
        <TouchableOpacity
          style={styles.postButton}
          onPress={() => setPostModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.postButtonIcon}>＋</Text>
          <Text style={styles.postButtonText}>Post Requirement</Text>
        </TouchableOpacity>

        {/* Category Card (Figure 25: Science, 40 Students, 03 Approved) */}
        <View style={styles.categoryCard}>
          <View style={styles.catHeader}>
            <View>
              <Text style={styles.catTitle}>{teacher.assigned_subject}</Text>
              <Text style={styles.catStatsText}>
                40 Students · 03 Approved
              </Text>
            </View>

            <TouchableOpacity
              style={styles.viewSubmissionsBtn}
              onPress={onNavigateSubmissions}
              activeOpacity={0.8}
            >
              <Text style={styles.viewSubmissionsBtnText}>View Submissions</Text>
            </TouchableOpacity>
          </View>

          {/* List of Posted Tasks under Category */}
          <View style={styles.tasksList}>
            {teacherReqs.map((req, index) => (
              <View key={req.requirement_id} style={styles.taskItem}>
                <View style={styles.taskBullet}>
                  <Text style={styles.taskBulletText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskNameText}>{req.requirement_name}</Text>
                  <Text style={styles.taskDescText}>{req.description}</Text>
                  <Text style={styles.taskMetaText}>
                    Target: {req.grade_level} ({req.section || 'All Sections'}) · Format: {req.allowed_file_type}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Post Requirement Modal / Drawer (Figure 25 Right) */}
      <Modal
        visible={postModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPostModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setPostModalVisible(false)}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Post Requirement</Text>
              <View style={styles.siaPill}>
                <Text style={styles.siaPillText}>SIA</Text>
              </View>
            </View>

            <ScrollView style={styles.formContent} showsVerticalScrollIndicator={false}>
              {/* Category Field */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.selectBox}>
                  <Text style={styles.selectBoxText}>{category}</Text>
                </View>
              </View>

              {/* Add Task Field */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Add Task</Text>
                <TextInput
                  style={styles.textInput}
                  value={taskName}
                  onChangeText={setTaskName}
                  placeholder="e.g. Activity 1: Create Science Model"
                />

                {/* Attachment Checkbox */}
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Add attachment requirement (files)</Text>
                  <Switch
                    value={requireAttachment}
                    onValueChange={setRequireAttachment}
                    trackColor={{ false: '#cbd5e1', true: '#1e3a8a' }}
                  />
                </View>

                {/* Description */}
                <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Task Instructions / Rubric</Text>
                <TextInput
                  style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  placeholder="Explain requirements for students..."
                />
              </View>

              {/* Applicable Students Section (Figure 25 Right) */}
              <View style={styles.applicableSection}>
                <Text style={styles.sectionHeading}>Applicable Students</Text>

                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>School Level</Text>
                  <View style={styles.selectBox}>
                    <Text style={styles.selectBoxText}>{schoolLevel}</Text>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>Grade Level</Text>
                  <View style={styles.selectBox}>
                    <Text style={styles.selectBoxText}>{gradeLevel}</Text>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>Section</Text>
                  <View style={styles.selectBox}>
                    <Text style={styles.selectBoxText}>{section}</Text>
                  </View>
                </View>
              </View>

              {/* Save Button (Figure 25 Right) */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveRequirement}
                activeOpacity={0.85}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </ScrollView>
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
  backButton: {
    padding: 6,
  },
  backButtonText: {
    fontSize: 20,
    color: '#1e3a8a',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  siaPill: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  siaPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  scrollList: {
    flex: 1,
    padding: 16,
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e3a8a',
    paddingVertical: 11,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  postButtonIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  postButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  catTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  catStatsText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  viewSubmissionsBtn: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  viewSubmissionsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  tasksList: {
    marginTop: 12,
    gap: 10,
  },
  taskItem: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  taskBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskBulletText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  taskNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  taskDescText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  taskMetaText: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 4,
  },

  // Modal Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  formContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  selectBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectBoxText: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  switchLabel: {
    fontSize: 11,
    color: '#475569',
  },
  applicableSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
