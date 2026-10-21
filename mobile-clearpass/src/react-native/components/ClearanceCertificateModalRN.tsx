import React from 'react';
import { Image, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useClearPass } from '../../context/ClearPassContext';
import { StudentProfile } from '../../types/clearpass';

type Props = { visible: boolean; student: StudentProfile; onClose: () => void };
type SignaturePoint = { x: number; y: number };
type SignatureStroke = SignaturePoint[];
const signaturePrefix = 'sia-signature:';

const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const signatureLines = (strokes: SignatureStroke[]) => strokes.flatMap((stroke, strokeIndex) =>
  stroke.slice(1).map((point, pointIndex) => {
    const prior = stroke[pointIndex];
    const x1 = prior.x * 0.45;
    const y1 = prior.y * 0.25;
    const x2 = point.x * 0.45;
    const y2 = point.y * 0.25;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    return {
      key: `${strokeIndex}-${pointIndex}`,
      style: {
        left: (x1 + x2) / 2 - length / 2,
        top: (y1 + y2) / 2 - 1.5,
        width: Math.max(length, 2),
        transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
      },
    };
  })
);

const SignatureMark: React.FC<{ value: string }> = ({ value }) => {
  if (!value.startsWith(signaturePrefix)) {
    return <Image source={{ uri: value }} style={styles.signatureImage} resizeMode="contain" />;
  }
  try {
    const parsed: unknown = JSON.parse(value.slice(signaturePrefix.length));
    const lines = signatureLines(Array.isArray(parsed) ? parsed as SignatureStroke[] : []);
    return (
      <View style={styles.signaturePreview}>
        {lines.length
          ? lines.map(line => <View key={line.key} pointerEvents="none" style={[styles.signatureInk, line.style]} />)
          : <Text style={styles.signatureFallback}>Signature saved</Text>}
      </View>
    );
  } catch {
    return <Text style={styles.signatureFallback}>Signature saved</Text>;
  }
};

export const ClearanceCertificateModalRN: React.FC<Props> = ({ visible, student, onClose }) => {
  const { activeForm, activePeriod, records, signatories, signatures, personnel, users, requirements, assignments } = useClearPass();
  const record = records.find(item => item.student_id === student.student_id);
  const user = users.find(item => item.user_id === student.user_id);
  const progress = record?.progress_percentage ?? 0;

  const shareCertificate = async () => {
    const name = `${student.first_name} ${student.middle_name || ''} ${student.last_name} ${student.suffix || ''}`.replace(/\s+/g, ' ').trim();
    const signedBy = signatories.filter(item => assignments.some(assignment =>
      assignment.student_id === student.student_id && assignment.signed_by_personnel_id === item.personnel_id
    )).map(item => item.personnel_name);
    await Share.share({
      title: 'SIA ClearPass Certificate',
      message: `${name}\nSt. Isidore Academy of Trinidad Bohol, Inc.\n${activeForm?.form_name || 'Clearance Certificate'}\nSchool Year: ${record?.school_year || student.school_year}\nStatus: ${record?.overall_status || 'In Progress'} (${progress}% complete)\nSigned by: ${signedBy.join(', ') || 'No personnel signatures yet'}`,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View><Text style={styles.kicker}>ST. ISIDORE ACADEMY</Text><Text style={styles.title}>Clearance certificate</Text></View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close certificate" style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.school}>St. Isidore Academy of Trinidad Bohol, Inc.</Text>
            <Text style={styles.description}>OFFICIAL STUDENT CLEARANCE</Text>
            <View style={styles.rule} />
            <Info label="Student" value={`${student.first_name} ${student.middle_name || ''} ${student.last_name} ${student.suffix || ''}`.replace(/\s+/g, ' ').trim()} />
            <Info label="Learner reference number" value={student.student_number} />
            <Info label="School level / grade / section" value={`${student.school_level} · ${student.grade_level} · ${student.section}`} />
            <Info label="School year / term" value={`${record?.school_year || student.school_year} · ${record?.term || activePeriod?.term || '—'}`} />
            <Info label="Clearance form" value={activeForm?.form_name || 'Current clearance form'} />
            <View style={styles.progressWrap}><Text style={styles.progressLabel}>Completion</Text><Text style={styles.progressValue}>{progress}% · {record?.overall_status || 'In Progress'}</Text><View style={styles.track}><View style={[styles.fill, { width: `${Math.min(100, Math.max(0, progress))}%` }]} /></View></View>
            <Text style={styles.sectionTitle}>Authorized signatories</Text>
            {signatories.filter(item => item.status !== 0).map(item => {
              const signature = signatures.find(entry => entry.personnel_id === item.personnel_id && entry.signature_status === 'active');
              const staff = personnel.find(entry => entry.personnel_id === item.personnel_id);
              const matchTerms = [staff?.assigned_subject, staff?.office, item.department_code, item.office_role]
                .filter((value): value is string => Boolean(value)).map(normalizeKey).filter(Boolean);
              const requirementIds = new Set(requirements.filter(requirement => requirement.personnel_id === item.personnel_id
                || [requirement.category, requirement.office].map(normalizeKey)
                  .some(value => matchTerms.some(term => value === term || value.includes(term) || term.includes(value))))
                .map(requirement => requirement.requirement_id));
              const linkedAssignments = assignments.filter(assignment =>
                assignment.student_id === student.student_id && requirementIds.has(assignment.requirement_id)
              );
              const status = linkedAssignments.some(assignment => assignment.status === 'Rejected') ? 'Rejected'
                : linkedAssignments.some(assignment => assignment.status === 'With Remarks') ? 'With Remarks'
                  : linkedAssignments.length > 0 && linkedAssignments.every(assignment => assignment.status === 'Approved') ? 'Approved'
                    : linkedAssignments.some(assignment => assignment.status === 'Submitted') ? 'Submitted' : 'Pending';
              const isSigned = linkedAssignments.length > 0 && linkedAssignments.every(assignment =>
                assignment.status === 'Approved' && assignment.signed_by_personnel_id === item.personnel_id
              );
              const stateColor = status === 'Approved' ? '#15803d' : status === 'Rejected' || status === 'With Remarks' ? '#be123c' : '#b45309';
              return <View key={item.signatory_id} style={styles.signatoryCard}>
                <View style={styles.signatoryRow}>
                  <View style={[styles.signatoryMark, isSigned && styles.signatoryMarkSigned]}><Text style={styles.markText}>{isSigned ? '✓' : '·'}</Text></View>
                  <View style={styles.signatoryInfo}><Text style={styles.signatoryName}>{item.personnel_name}</Text><Text style={styles.signatoryRole}>{item.office_role}</Text></View>
                  <Text style={[styles.signatoryState, { color: stateColor }]}>{status}</Text>
                </View>
                <View style={styles.signatureRow}>
                  {isSigned && signature?.signature_data
                    ? <SignatureMark value={signature.signature_data} />
                    : <Text style={styles.signaturePending}>{isSigned ? 'Signature applied' : 'Awaiting personnel signature'}</Text>}
                  <Text style={styles.verificationCode}>{isSigned ? signature?.verification_code || 'Digitally signed' : 'Not signed'}</Text>
                </View>
              </View>;
            })}
            {!user && <Text style={styles.note}>Student record loaded from the clearance database.</Text>}
            <Text style={styles.note}>This certificate reflects the current clearance record. Final clearance is issued when all requirements are approved.</Text>
          </ScrollView>
          <View style={styles.footer}><Pressable onPress={onClose} style={[styles.button, styles.buttonLight]}><Text style={[styles.buttonText, styles.buttonTextLight]}>Close</Text></Pressable><Pressable onPress={() => void shareCertificate()} style={styles.button}><Text style={styles.buttonText}>Share details</Text></Pressable></View>
        </View>
      </View>
    </Modal>
  );
};

const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value || '—'}</Text></View>;

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.64)', justifyContent: 'center', alignItems: 'center', padding: 14 },
  sheet: { width: '100%', maxWidth: 700, maxHeight: '94%', backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 17, backgroundColor: '#f8fafc', borderBottomColor: '#e2e8f0', borderBottomWidth: 1 },
  kicker: { color: '#1e3a8a', fontSize: 9, fontWeight: '800', letterSpacing: 1 }, title: { color: '#0f172a', fontSize: 19, fontWeight: '800', marginTop: 3 },
  close: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }, closeText: { color: '#334155', fontSize: 22, lineHeight: 24 },
  body: { padding: 22 }, school: { color: '#0f172a', textAlign: 'center', fontSize: 17, fontWeight: '800' }, description: { color: '#1e3a8a', textAlign: 'center', fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginTop: 7 }, rule: { height: 2, backgroundColor: '#1e3a8a', marginVertical: 18 },
  infoRow: { borderBottomWidth: 1, borderColor: '#e2e8f0', paddingVertical: 9 }, infoLabel: { color: '#64748b', fontSize: 10, fontWeight: '700' }, infoValue: { color: '#172554', fontSize: 13, fontWeight: '700', marginTop: 4 },
  progressWrap: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 11, padding: 13, marginTop: 15 }, progressLabel: { color: '#475569', fontWeight: '700', fontSize: 11 }, progressValue: { color: '#1e3a8a', fontWeight: '800', fontSize: 13, marginTop: 4 }, track: { height: 7, backgroundColor: '#dbe3ef', borderRadius: 4, marginTop: 10, overflow: 'hidden' }, fill: { height: 7, backgroundColor: '#16a34a', borderRadius: 4 },
  sectionTitle: { color: '#0f172a', fontWeight: '800', fontSize: 13, marginTop: 20, marginBottom: 8 }, signatoryCard: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, marginBottom: 8, paddingHorizontal: 10 }, signatoryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderColor: '#f1f5f9' }, signatoryMark: { width: 25, height: 25, borderRadius: 13, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }, signatoryMarkSigned: { backgroundColor: '#dcfce7' }, markText: { color: '#1e3a8a', fontSize: 15, fontWeight: '800' }, signatoryInfo: { flex: 1 }, signatoryName: { color: '#172554', fontSize: 11, fontWeight: '700' }, signatoryRole: { color: '#64748b', fontSize: 10, marginTop: 2 }, signatoryState: { color: '#64748b', fontSize: 9, fontWeight: '700' }, signatureRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 5 }, signaturePreview: { width: 145, height: 46, overflow: 'hidden', position: 'relative', borderBottomWidth: 1, borderColor: '#cbd5e1' }, signatureInk: { position: 'absolute', height: 3, borderRadius: 2, backgroundColor: '#1e3a8a' }, signatureImage: { width: 145, height: 46 }, signatureFallback: { color: '#15803d', fontSize: 9, fontWeight: '700', alignSelf: 'center', paddingTop: 12 }, signaturePending: { color: '#94a3b8', fontSize: 9 }, verificationCode: { color: '#64748b', fontSize: 8, fontFamily: 'monospace', flexShrink: 1, textAlign: 'right' }, note: { color: '#64748b', fontSize: 10, lineHeight: 15, marginTop: 14 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, padding: 14, borderTopWidth: 1, borderColor: '#e2e8f0' }, button: { backgroundColor: '#1e3a8a', paddingHorizontal: 17, paddingVertical: 11, borderRadius: 9 }, buttonLight: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#dbeafe' }, buttonText: { color: '#fff', fontSize: 11, fontWeight: '800' }, buttonTextLight: { color: '#1e3a8a' },
});
