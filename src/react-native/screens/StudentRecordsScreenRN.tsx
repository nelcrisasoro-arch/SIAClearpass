import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useClearPass } from '../../context/ClearPassContext';
import { StudentProfile } from '../../types/clearpass';

interface Props {
  onBack: () => void;
  onOpenCertificate: (student: StudentProfile) => void;
}

export const StudentRecordsScreenRN: React.FC<Props> = ({
  onBack,
  onOpenCertificate,
}) => {
  const { currentStudent, records } = useClearPass();

  const student = currentStudent;
  if (!student) return null;

  const studentRecords = records.filter(r => r.student_id === student.student_id);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clearance Records</Text>
        <View style={styles.siaPill}>
          <Text style={styles.siaPillText}>SIA</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionSubtitle}>
          Archived and current clearance certifications:
        </Text>

        {/* Current & Past Records (Figure 23) */}
        {studentRecords.map((rec) => {
          const isCleared = rec.overall_status === 'Cleared' || rec.progress_percentage === 100;

          return (
            <View key={rec.clearance_record_id} style={styles.recordCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.syTitle}>
                    SY {rec.school_year} {rec.term}
                  </Text>
                  <Text style={styles.statusLabel}>
                    Status: {rec.overall_status} ({rec.progress_percentage}%)
                  </Text>
                </View>
                <View
                  style={[
                    styles.clearedPill,
                    isCleared ? styles.clearedPillGreen : styles.clearedPillAmber,
                  ]}
                >
                  <Text
                    style={[
                      styles.clearedPillText,
                      isCleared ? styles.clearedPillTextGreen : styles.clearedPillTextAmber,
                    ]}
                  >
                    {isCleared ? '✓ Cleared' : 'In Progress'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.completedDateText}>
                  {rec.completed_at
                    ? `Issued: ${new Date(rec.completed_at).toLocaleDateString()}`
                    : 'Active clearance cycle'}
                </Text>

                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => onOpenCertificate(student)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.downloadButtonText}>
                    {isCleared ? '📥 Download' : '📄 View'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
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
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 14,
  },
  recordCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  syTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  clearedPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  clearedPillGreen: {
    backgroundColor: '#dcfce7',
  },
  clearedPillAmber: {
    backgroundColor: '#fef3c7',
  },
  clearedPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  clearedPillTextGreen: {
    color: '#15803d',
  },
  clearedPillTextAmber: {
    color: '#b45309',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  completedDateText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  downloadButton: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
