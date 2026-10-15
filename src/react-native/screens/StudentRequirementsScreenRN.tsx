import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useClearPass } from '../../context/ClearPassContext';
import { ClearanceRequirement, StudentProfile } from '../../types/clearpass';

interface Props {
  onBack: () => void;
  onOpenCertificate: (student: StudentProfile) => void;
}

export const StudentRequirementsScreenRN: React.FC<Props> = ({
  onBack,
  onOpenCertificate,
}) => {
  const {
    currentStudent,
    requirements,
    assignments,
    submissions,
    submitRequirement,
  } = useClearPass();

  const [selectedCategory, setSelectedCategory] = useState<string | null>('Science');
  const [activeReqForUpload, setActiveReqForUpload] = useState<ClearanceRequirement | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [notes, setNotes] = useState('');

  const student = currentStudent;
  if (!student) return null;

  // Categories available for student
  const studentAssignments = assignments.filter(a => a.student_id === student.student_id);
  const assignedReqIds = studentAssignments.map(a => a.requirement_id);
  const studentReqs = requirements.filter(r => assignedReqIds.includes(r.requirement_id));

  const categories = Array.from(new Set(studentReqs.map(r => r.category)));

  const handleOpenUpload = (req: ClearanceRequirement) => {
    setActiveReqForUpload(req);
    const existingSub = submissions.find(
      s => s.student_id === student.student_id && s.requirement_id === req.requirement_id
    );
    setUploadFileName(existingSub ? existingSub.file_name : `${student.last_name}_${req.requirement_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    setNotes(existingSub?.remarks || '');
  };

  const handlePickSampleFile = (fileName: string) => {
    setUploadFileName(fileName);
  };

  const handleSubmit = () => {
    if (!activeReqForUpload) return;
    const asg = studentAssignments.find(a => a.requirement_id === activeReqForUpload.requirement_id);
    if (!asg) return;

    submitRequirement({
      assignment_id: asg.assignment_id,
      requirement_id: activeReqForUpload.requirement_id,
      student_id: student.student_id,
      file_name: uploadFileName || 'Clearance_Document.pdf',
      file_type: 'application/pdf',
      file_size_kb: 2150,
    });

    setActiveReqForUpload(null);
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => {
            if (selectedCategory) {
              setSelectedCategory(null);
            } else {
              onBack();
            }
          }}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedCategory ? `${selectedCategory} Tasks` : 'Clearance Requirements'}
        </Text>
        <View style={styles.siaPill}>
          <Text style={styles.siaPillText}>SIA</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!selectedCategory ? (
          // Category Listing (Figure 21 Left)
          <View style={styles.categoryList}>
            <Text style={styles.pageSubtitle}>
              Select a school department or subject to view clearance tasks:
            </Text>

            {categories.map((cat) => {
              const catReqs = studentReqs.filter(r => r.category === cat);
              const catAsgs = studentAssignments.filter(a =>
                catReqs.some(r => r.requirement_id === a.requirement_id)
              );
              const isAllApproved = catAsgs.length > 0 && catAsgs.every(a => a.status === 'Approved');
              const hasRemarks = catAsgs.some(a => a.status === 'With Remarks');

              return (
                <TouchableOpacity
                  key={cat}
                  style={styles.categoryCard}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                >
                  <View style={styles.catLeftCol}>
                    <View style={styles.catIconCircle}>
                      <Text style={styles.catEmoji}>
                        {cat === 'Science' ? '🔬' : cat === 'Adviser' ? '📋' : cat === 'Library' ? '📚' : '💳'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.catTitle}>{cat}</Text>
                      <Text style={styles.catCountText}>{catReqs.length} assigned tasks</Text>
                    </View>
                  </View>

                  <View style={styles.catRightCol}>
                    <View
                      style={[
                        styles.catStatusBadge,
                        isAllApproved
                          ? styles.catStatusBadgeApproved
                          : hasRemarks
                          ? styles.catStatusBadgeRemarks
                          : styles.catStatusBadgePending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.catStatusBadgeText,
                          isAllApproved
                            ? styles.catStatusBadgeTextApproved
                            : hasRemarks
                            ? styles.catStatusBadgeTextRemarks
                            : styles.catStatusBadgeTextPending,
                        ]}
                      >
                        {isAllApproved ? 'Signed' : hasRemarks ? 'Remarks' : 'Pending'}
                      </Text>
                    </View>
                    <Text style={styles.chevronText}>›</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          // Drill-down Tasks List (Figure 21 Right)
          <View style={styles.tasksContainer}>
            <View style={styles.tasksCategoryBanner}>
              <Text style={styles.tasksCategoryTitle}>{selectedCategory} Department</Text>
              <Text style={styles.tasksCategorySubtitle}>
                Complete and upload all requirements below for teacher verification.
              </Text>
            </View>

            {studentReqs
              .filter(r => r.category === selectedCategory)
              .map((req, idx) => {
                const asg = studentAssignments.find(a => a.requirement_id === req.requirement_id);
                const sub = submissions.find(
                  s => s.student_id === student.student_id && s.requirement_id === req.requirement_id
                );
                const isApproved = asg?.status === 'Approved';
                const isWithRemarks = asg?.status === 'With Remarks';
                const isSubmitted = asg?.status === 'Submitted';

                return (
                  <View key={req.requirement_id} style={styles.taskCard}>
                    <View style={styles.taskHeader}>
                      <View style={styles.taskIndexCircle}>
                        <Text style={styles.taskIndexText}>{idx + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.taskTitle}>{req.requirement_name}</Text>
                        <Text style={styles.taskDesc}>{req.description}</Text>
                      </View>
                    </View>

                    {/* Status Row */}
                    <View style={styles.taskStatusRow}>
                      <View
                        style={[
                          styles.taskBadge,
                          isApproved
                            ? styles.taskBadgeApproved
                            : isWithRemarks
                            ? styles.taskBadgeRemarks
                            : isSubmitted
                            ? styles.taskBadgeSubmitted
                            : styles.taskBadgePending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.taskBadgeText,
                            isApproved
                              ? styles.taskBadgeTextApproved
                              : isWithRemarks
                              ? styles.taskBadgeTextRemarks
                              : isSubmitted
                              ? styles.taskBadgeTextSubmitted
                              : styles.taskBadgeTextPending,
                          ]}
                        >
                          {isApproved
                            ? 'Approved'
                            : isWithRemarks
                            ? 'With Remarks'
                            : isSubmitted
                            ? 'Submitted'
                            : 'Pending'}
                        </Text>
                      </View>

                      {sub ? (
                        <Text style={styles.submittedFileText} numberOfLines={1}>
                          📎 {sub.file_name}
                        </Text>
                      ) : null}
                    </View>

                    {/* Teacher Remarks if any */}
                    {asg?.remarks ? (
                      <View style={styles.remarksBox}>
                        <Text style={styles.remarksLabel}>Teacher Remark:</Text>
                        <Text style={styles.remarksText}>"{asg.remarks}"</Text>
                      </View>
                    ) : null}

                    {/* Upload / Re-upload Button */}
                    <TouchableOpacity
                      style={[
                        styles.uploadActionButton,
                        isApproved && styles.uploadActionButtonApproved,
                      ]}
                      onPress={() => handleOpenUpload(req)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.uploadActionButtonText,
                          isApproved && styles.uploadActionButtonTextApproved,
                        ]}
                      >
                        {isApproved ? '✓ View Submitted Proof' : isSubmitted ? '🔄 Re-upload Document' : '📤 Upload Requirement'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
          </View>
        )}

        {/* Bottom Actions (Figure 21 Bottom: View My Clearance & Download) */}
        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity
            style={styles.viewClearanceBtn}
            onPress={() => onOpenCertificate(student)}
            activeOpacity={0.85}
          >
            <Text style={styles.viewClearanceBtnText}>View My Clearance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={() => onOpenCertificate(student)}
            activeOpacity={0.85}
          >
            <Text style={styles.downloadBtnText}>Download</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Upload Requirement Modal (Figure 21 Action) */}
      <Modal
        visible={!!activeReqForUpload}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveReqForUpload(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.uploadModalSheet}>
            <View style={styles.uploadModalHeader}>
              <Text style={styles.uploadModalTitle}>Submit Requirement</Text>
              <TouchableOpacity onPress={() => setActiveReqForUpload(null)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.uploadModalBody}>
              <Text style={styles.modalReqName}>{activeReqForUpload?.requirement_name}</Text>
              <Text style={styles.modalReqDesc}>{activeReqForUpload?.description}</Text>

              <Text style={styles.inputSectionLabel}>Select / Attach File:</Text>

              {/* Sample Quick Files Picker */}
              <View style={styles.sampleFileChips}>
                <TouchableOpacity
                  style={styles.fileChip}
                  onPress={() => handlePickSampleFile(`${student.last_name}_ScienceModel_Final.pdf`)}
                >
                  <Text style={styles.fileChipText}>📄 Model_Report.pdf</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.fileChip}
                  onPress={() => handlePickSampleFile(`${student.last_name}_ProjectPhotos.jpg`)}
                >
                  <Text style={styles.fileChipText}>🖼️ Project_Photo.jpg</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.inputFieldLabel}>File Name / Attachment:</Text>
                <TextInput
                  style={styles.textInput}
                  value={uploadFileName}
                  onChangeText={setUploadFileName}
                  placeholder="e.g. Science_Model_Report.pdf"
                />
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.inputFieldLabel}>Student Notes / Remarks (Optional):</Text>
                <TextInput
                  style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  placeholder="e.g. Attached photos of the miniature model and circuit diagram."
                />
              </View>

              <TouchableOpacity
                style={styles.confirmSubmitButton}
                onPress={handleSubmit}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmSubmitButtonText}>Submit to Teacher for Review</Text>
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
    fontSize: 15,
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
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  categoryList: {
    gap: 10,
    marginBottom: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catEmoji: {
    fontSize: 20,
  },
  catTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  catCountText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  catRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catStatusBadgeApproved: {
    backgroundColor: '#dcfce7',
  },
  catStatusBadgeRemarks: {
    backgroundColor: '#fee2e2',
  },
  catStatusBadgePending: {
    backgroundColor: '#fef3c7',
  },
  catStatusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  catStatusBadgeTextApproved: {
    color: '#15803d',
  },
  catStatusBadgeTextRemarks: {
    color: '#b91c1c',
  },
  catStatusBadgeTextPending: {
    color: '#b45309',
  },
  chevronText: {
    fontSize: 20,
    color: '#94a3b8',
  },
  tasksContainer: {
    gap: 12,
    marginBottom: 20,
  },
  tasksCategoryBanner: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1e3a8a',
  },
  tasksCategoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  tasksCategorySubtitle: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  taskHeader: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  taskIndexCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskIndexText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  taskDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  taskStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 4,
  },
  taskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  taskBadgeApproved: {
    backgroundColor: '#dcfce7',
  },
  taskBadgeRemarks: {
    backgroundColor: '#fee2e2',
  },
  taskBadgeSubmitted: {
    backgroundColor: '#e0f2fe',
  },
  taskBadgePending: {
    backgroundColor: '#fef3c7',
  },
  taskBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  taskBadgeTextApproved: {
    color: '#15803d',
  },
  taskBadgeTextRemarks: {
    color: '#b91c1c',
  },
  taskBadgeTextSubmitted: {
    color: '#0369a1',
  },
  taskBadgeTextPending: {
    color: '#b45309',
  },
  submittedFileText: {
    fontSize: 10,
    color: '#64748b',
    maxWidth: 160,
  },
  remarksBox: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
    marginBottom: 6,
  },
  remarksLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#991b1b',
  },
  remarksText: {
    fontSize: 11,
    color: '#7f1d1d',
    fontStyle: 'italic',
    marginTop: 1,
  },
  uploadActionButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  uploadActionButtonApproved: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  uploadActionButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  uploadActionButtonTextApproved: {
    color: '#334155',
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    marginBottom: 24,
  },
  viewClearanceBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewClearanceBtnText: {
    color: '#1e293b',
    fontSize: 12,
    fontWeight: '700',
  },
  downloadBtn: {
    flex: 1,
    backgroundColor: '#1e3a8a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  downloadBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Upload Modal Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  uploadModalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  uploadModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: 'bold',
  },
  uploadModalBody: {
    marginBottom: 16,
  },
  modalReqName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  modalReqDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 14,
  },
  inputSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  sampleFileChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  fileChip: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  fileChipText: {
    fontSize: 10,
    color: '#1e3a8a',
    fontWeight: '600',
  },
  inputBox: {
    marginBottom: 12,
  },
  inputFieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
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
  confirmSubmitButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmSubmitButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
