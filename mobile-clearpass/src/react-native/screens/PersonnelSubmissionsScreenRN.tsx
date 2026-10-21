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
import { StudentProfile, RequirementSubmission } from '../../types/clearpass';

interface Props {
  onBack: () => void;
  onNavigateSignature: () => void;
}

type ReviewFilter = 'All' | 'Pending' | 'Rejected' | 'Approved';

export const PersonnelSubmissionsScreenRN: React.FC<Props> = ({
  onBack,
  onNavigateSignature,
}) => {
  const {
    currentPersonnel,
    students,
    requirements,
    submissions,
    assignments,
    reviewSubmission,
    signClearanceForStudent,
    revokeClearanceSignatureForStudent,
    signatures,
  } = useClearPass();

  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<RequirementSubmission | null>(null);
  const [remarksInput, setRemarksInput] = useState('');
  const [remarksModalVisible, setRemarksModalVisible] = useState(false);
  const [reviewAction, setReviewAction] = useState<'remarks' | 'reject'>('remarks');
  const [revokeModalVisible, setRevokeModalVisible] = useState(false);
  const [revokeReason, setRevokeReason] = useState('Na-sipyat og pirma / Reverted for requirement verification');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('All');

  const teacher = currentPersonnel;
  if (!teacher) return null;

  // Filter students
  const filteredStudents = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.student_number.includes(searchQuery)
  );

  const teacherReqIds = requirements
    .filter(r => r.category === teacher.assigned_subject || r.personnel_id === teacher.personnel_id)
    .map(r => r.requirement_id);
  const teacherReqIdSet = new Set(teacherReqIds);
  const getReviewStatus = (studentId: string): Exclude<ReviewFilter, 'All'> => {
    const statusValues = [
      ...assignments
        .filter(item => item.student_id === studentId && teacherReqIdSet.has(item.requirement_id))
        .map(item => item.status),
      ...submissions
        .filter(item => item.student_id === studentId && teacherReqIdSet.has(item.requirement_id))
        .map(item => item.submission_status),
    ];
    if (statusValues.some(status => status === 'Rejected' || status === 'With Remarks')) return 'Rejected';
    if (statusValues.some(status => status === 'Pending' || status === 'Submitted')) return 'Pending';
    return statusValues.length > 0 ? 'Approved' : 'Pending';
  };
  const visibleStudents = filteredStudents.filter(student =>
    reviewFilter === 'All' || getReviewStatus(student.student_id) === reviewFilter
  );
  const reviewCounts: Record<ReviewFilter, number> = {
    All: filteredStudents.length,
    Pending: filteredStudents.filter(student => getReviewStatus(student.student_id) === 'Pending').length,
    Rejected: filteredStudents.filter(student => getReviewStatus(student.student_id) === 'Rejected').length,
    Approved: filteredStudents.filter(student => getReviewStatus(student.student_id) === 'Approved').length,
  };

  const teacherSig = signatures.find(s => s.personnel_id === teacher.personnel_id);

  const handleOpenStudent = (std: StudentProfile) => {
    setSelectedStudent(std);
    // Find latest submission for this student under this teacher
    const sub = submissions
      .filter(s => s.student_id === std.student_id && teacherReqIdSet.has(s.requirement_id))
      .sort((left, right) => new Date(right.submitted_at).getTime() - new Date(left.submitted_at).getTime())[0];
    setSelectedSubmission(sub || null);
    setRemarksInput(sub?.remarks || '');
  };

  const handleApprove = () => {
    if (!selectedSubmission || !teacher) return;
    reviewSubmission({
      submission_id: selectedSubmission.submission_id,
      status: 'Approved',
      remarks: 'Approved by ' + teacher.full_name,
      reviewer_personnel_id: teacher.personnel_id,
    });
    setSelectedStudent(null);
  };

  const handleSendRemarks = () => {
    if (!selectedSubmission || !teacher) return;
    const remarks = remarksInput.trim();
    if (!remarks) {
      Alert.alert('Add a reason', 'Enter feedback before sending remarks or rejecting the submission.');
      return;
    }
    reviewSubmission({
      submission_id: selectedSubmission.submission_id,
      status: reviewAction === 'reject' ? 'Rejected' : 'With Remarks',
      remarks,
      reviewer_personnel_id: teacher.personnel_id,
    });
    setRemarksModalVisible(false);
    setSelectedStudent(null);
  };

  const handleSignStudentClearance = () => {
    if (!selectedStudent || !teacher) return;
    if (!teacherSig?.signature_data) {
      Alert.alert('Save your signature first', 'Register your digital signature before applying it to a student clearance form.');
      return;
    }
    const studentTeacherAssignments = assignments.filter(assignment =>
      assignment.student_id === selectedStudent.student_id && teacherReqIdSet.has(assignment.requirement_id)
    );
    if (!studentTeacherAssignments.length || studentTeacherAssignments.some(assignment => assignment.status !== 'Approved')) {
      Alert.alert('Requirements are not approved', 'Approve all of your assigned clearance items before signing this student form.');
      return;
    }
    signClearanceForStudent(teacher.personnel_id, selectedStudent.student_id);
    setSelectedStudent(null);
  };

  const handleRevokeSignature = () => {
    if (!selectedStudent || !teacher) return;
    revokeClearanceSignatureForStudent({
      personnel_id: teacher.personnel_id,
      student_id: selectedStudent.student_id,
      reason: revokeReason,
    });
    setRevokeModalVisible(false);
    setSelectedStudent(null);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Submissions</Text>
        <View style={styles.siaPill}>
          <Text style={styles.siaPillText}>SIA</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
        {/* Search Bar (Figure 26) */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Student..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Row: Category, Grade Level, Section (Figure 26) */}
        <View style={styles.filterRow}>
          <View style={styles.filterChip}>
            <Text style={styles.filterChipLabel}>Category: </Text>
            <Text style={styles.filterChipValue}>{teacher.assigned_subject}</Text>
          </View>
          <View style={styles.filterChip}>
            <Text style={styles.filterChipLabel}>Grade: </Text>
            <Text style={styles.filterChipValue}>9</Text>
          </View>
          <View style={styles.filterChip}>
            <Text style={styles.filterChipLabel}>Section: </Text>
            <Text style={styles.filterChipValue}>Rose</Text>
          </View>
        </View>

        <View style={[styles.filterRow, { marginTop: 4 }]}>
          {(['All', 'Pending', 'Rejected', 'Approved'] as ReviewFilter[]).map(filter => (
            <TouchableOpacity
              key={filter}
              onPress={() => setReviewFilter(filter)}
              style={[styles.filterChip, reviewFilter === filter && { backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }]}
            >
              <Text style={[styles.filterChipValue, reviewFilter === filter && { color: '#fff' }]}>
                {filter} ({reviewCounts[filter]})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Students Table (Figure 26) */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Students</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>
              Clearance Status
            </Text>
          </View>

          {visibleStudents.map((std, idx) => {
            const status = getReviewStatus(std.student_id);

            return (
              <TouchableOpacity
                key={std.student_id}
                style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}
                onPress={() => handleOpenStudent(std)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1.4 }}>
                  <Text style={styles.studentNameText}>
                    {std.last_name}, {std.first_name} {std.middle_name?.[0]}.
                  </Text>
                  <Text style={styles.studentLrnText}>LRN: {std.student_number}</Text>
                </View>

                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <View
                    style={[
                      styles.statusPill,
                      status === 'Approved'
                        ? styles.statusPillSigned
                        : status === 'Rejected'
                        ? styles.statusPillRemarks
                        : styles.statusPillPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        status === 'Approved'
                          ? styles.statusPillTextSigned
                          : status === 'Rejected'
                          ? styles.statusPillTextRemarks
                          : styles.statusPillTextPending,
                      ]}
                    >
                      {status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Submission Details Modal (Figure 26 Right) */}
      <Modal
        visible={!!selectedStudent}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedStudent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalSheet}>
            <View style={styles.detailsModalHeader}>
              <TouchableOpacity onPress={() => setSelectedStudent(null)}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.detailsModalTitle}>Submission Details</Text>
              <View style={styles.siaPill}>
                <Text style={styles.siaPillText}>SIA</Text>
              </View>
            </View>

            {selectedStudent && (
              <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
                {/* Student Info Box */}
                <View style={styles.studentDetailCard}>
                  <Text style={styles.studentDetailName}>
                    Full Name: {selectedStudent.last_name}, {selectedStudent.first_name} {selectedStudent.middle_name}
                  </Text>
                  <Text style={styles.studentDetailMeta}>
                    Grade Level: {selectedStudent.grade_level}
                  </Text>
                  <Text style={styles.studentDetailMeta}>
                    Section: {selectedStudent.section}
                  </Text>
                  <Text style={styles.studentDetailMeta}>
                    LRN: {selectedStudent.student_number}
                  </Text>
                </View>

                {/* Tasks List for this Student (Figure 26 Right) */}
                <Text style={styles.tasksSectionTitle}>Tasks</Text>

                <View style={styles.taskCard}>
                  <Text style={styles.taskCardTitle}>
                    {selectedSubmission
                      ? requirements.find(r => r.requirement_id === selectedSubmission.requirement_id)?.requirement_name || 'Activity 1: Create Science Model'
                      : 'Activity 1: Create Science Model'}
                  </Text>

                  {selectedSubmission ? (
                    <View style={styles.fileAttachmentBox}>
                      <Text style={styles.fileIconEmoji}>📄</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.attachmentName} numberOfLines={1}>
                          {selectedSubmission.file_name}
                        </Text>
                        <Text style={styles.attachmentMeta}>
                          {(selectedSubmission.file_size_kb / 1024).toFixed(2)} MB · Submitted:{' '}
                          {new Date(selectedSubmission.submitted_at).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedBadgeText}>Attached</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.noFileBox}>
                      <Text style={styles.noFileText}>No document uploaded yet for this item.</Text>
                    </View>
                  )}

                  {/* Existing Remarks if any */}
                  {selectedSubmission?.remarks ? (
                    <View style={styles.existingRemarksBox}>
                      <Text style={styles.existingRemarksLabel}>Current Remarks:</Text>
                      <Text style={styles.existingRemarksText}>"{selectedSubmission.remarks}"</Text>
                    </View>
                  ) : null}

                  {/* Actions for Task (Figure 26 Right: Approve & Send Remarks) */}
                  <View style={styles.taskActionButtons}>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={handleApprove}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.approveButtonText}>✓ Approve</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.remarksButton, { backgroundColor: '#fee2e2' }]}
                      onPress={() => {
                        setReviewAction('reject');
                        setRemarksInput('');
                        setRemarksModalVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.remarksButtonText, { color: '#b91c1c' }]}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.remarksButton}
                      onPress={() => {
                        setReviewAction('remarks');
                        setRemarksInput(selectedSubmission?.remarks || '');
                        setRemarksModalVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.remarksButtonText}>💬 Send Remarks</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Sign or Revoke Clearance Section */}
                {selectedStudent && assignments
                  .filter(a => a.student_id === selectedStudent.student_id)
                  .filter(a => {
                    const r = requirements.find(req => req.requirement_id === a.requirement_id);
                    return r?.personnel_id === teacher.personnel_id || r?.category === teacher.assigned_subject;
                  })
                  .every(a => a.status === 'Approved') ? (
                  <View style={styles.signedStatusCard}>
                    <View style={styles.signedStatusHeader}>
                      <Text style={styles.signedStatusBadge}>✓ Officially Signed & Approved</Text>
                      <Text style={styles.signedStatusTime}>Clearance authorized</Text>
                    </View>
                    <Text style={styles.signedStatusNote}>
                      Your digital signature has been applied to {selectedStudent.first_name}'s clearance form.
                    </Text>

                    {/* Revoke / Change Signature Button (Na-sipyat) */}
                    <TouchableOpacity
                      style={styles.revokeButton}
                      onPress={() => setRevokeModalVisible(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.revokeButtonText}>
                        ↺ Bawi-on / Bag-ohon ang Pirma (Na-sipyat og Pirma)
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.signClearanceButton}
                    onPress={handleSignStudentClearance}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.signClearanceButtonText}>
                      ✍️ Apply Official Digital Signature to Clearance
                    </Text>
                  </TouchableOpacity>
                )}

                {!teacherSig && (
                  <TouchableOpacity
                    style={styles.goToSigPadLink}
                    onPress={() => {
                      setSelectedStudent(null);
                      onNavigateSignature();
                    }}
                  >
                    <Text style={styles.goToSigPadLinkText}>
                      ⚠️ Setup / Edit your signature pad first
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Revoke / Retract Signature Sub-Modal (Na-sipyat) */}
      <Modal
        visible={revokeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRevokeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.remarksDialog}>
            <Text style={[styles.remarksDialogTitle, { color: '#b91c1c' }]}>
              Bawi-on ang Pirma / Retract Clearance Approval
            </Text>
            <Text style={styles.remarksDialogSubtitle}>
              Kung na-sipyat o sayop nga napirmahan, ibalik kini sa Pending / With Remarks aron makita sa estudyante nga kinahanglan pa niyang tarungon:
            </Text>

            <TextInput
              style={styles.remarksDialogInput}
              value={revokeReason}
              onChangeText={setRevokeReason}
              multiline
              numberOfLines={3}
              placeholder="Rason ngano gibawi ang pirma (e.g. Sayop nga na-approve, kulang pa ang requirements)..."
            />

            <View style={styles.dialogButtonsRow}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setRevokeModalVisible(false)}
              >
                <Text style={styles.dialogCancelBtnText}>Kanselahon</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogConfirmBtn, { backgroundColor: '#dc2626' }]}
                onPress={handleRevokeSignature}
              >
                <Text style={styles.dialogConfirmBtnText}>Bawi-on ang Pirma</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Remarks Input Sub-Modal */}
      <Modal
        visible={remarksModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRemarksModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.remarksDialog}>
            <Text style={styles.remarksDialogTitle}>{reviewAction === 'reject' ? 'Reject Submission' : 'Provide Feedback / Remarks'}</Text>
            <Text style={styles.remarksDialogSubtitle}>
              {reviewAction === 'reject'
                ? 'Give the student a reason so they know what to correct before resubmitting.'
                : 'The student will receive an immediate notification with these instructions:'}
            </Text>

            <TextInput
              style={styles.remarksDialogInput}
              value={remarksInput}
              onChangeText={setRemarksInput}
              multiline
              numberOfLines={4}
              placeholder="e.g. Please attach clear photo of working model circuit..."
            />

            <View style={styles.dialogButtonsRow}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setRemarksModalVisible(false)}
              >
                <Text style={styles.dialogCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogConfirmBtn}
                onPress={handleSendRemarks}
              >
                <Text style={styles.dialogConfirmBtnText}>{reviewAction === 'reject' ? 'Reject submission' : 'Send to Student'}</Text>
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
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    color: '#0f172a',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  filterChipLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  filterChipValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableRowAlt: {
    backgroundColor: '#fafbfc',
  },
  studentNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  studentLrnText: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: 'monospace',
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillSigned: {
    backgroundColor: '#dcfce7',
  },
  statusPillRemarks: {
    backgroundColor: '#fee2e2',
  },
  statusPillPending: {
    backgroundColor: '#fef3c7',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusPillTextSigned: {
    color: '#15803d',
  },
  statusPillTextRemarks: {
    color: '#b91c1c',
  },
  statusPillTextPending: {
    color: '#b45309',
  },

  // Details Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailsModalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    maxHeight: '88%',
  },
  detailsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  detailsModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  detailsContent: {
    padding: 16,
  },
  studentDetailCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    gap: 3,
  },
  studentDetailName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  studentDetailMeta: {
    fontSize: 11,
    color: '#475569',
  },
  tasksSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  taskCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  fileAttachmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
    gap: 10,
    marginBottom: 12,
  },
  fileIconEmoji: {
    fontSize: 20,
  },
  attachmentName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  attachmentMeta: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 1,
  },
  verifiedBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1e40af',
  },
  noFileBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  noFileText: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  existingRemarksBox: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  existingRemarksLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#991b1b',
  },
  existingRemarksText: {
    fontSize: 11,
    color: '#7f1d1d',
    fontStyle: 'italic',
    marginTop: 1,
  },
  taskActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  remarksButton: {
    flex: 1,
    backgroundColor: '#f59e0b',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  remarksButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  signClearanceButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  signClearanceButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  goToSigPadLink: {
    marginTop: 8,
    alignItems: 'center',
  },
  goToSigPadLinkText: {
    fontSize: 11,
    color: '#b45309',
    fontWeight: '600',
  },

  // Remarks Dialog
  remarksDialog: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  remarksDialogTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  remarksDialogSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 10,
  },
  remarksDialogInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    color: '#0f172a',
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  dialogButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  dialogCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  dialogCancelBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  dialogConfirmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#1e3a8a',
  },
  dialogConfirmBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  signedStatusCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
    gap: 8,
  },
  signedStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signedStatusBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
  },
  signedStatusTime: {
    fontSize: 10,
    color: '#16a34a',
  },
  signedStatusNote: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 16,
  },
  revokeButton: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  revokeButtonText: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '700',
  },
});
