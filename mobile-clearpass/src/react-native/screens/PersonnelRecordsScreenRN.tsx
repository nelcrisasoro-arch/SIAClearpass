import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useClearPass } from '../../context/ClearPassContext';
import { StudentProfile } from '../../types/clearpass';

interface Props {
  onBack: () => void;
  onOpenCertificate: (student: StudentProfile) => void;
}

export const PersonnelRecordsScreenRN: React.FC<Props> = ({
  onBack,
  onOpenCertificate,
}) => {
  const { students, records, currentPersonnel } = useClearPass();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSy, setSelectedSy] = useState('SY 2026-2027');
  const [selectedLevel, setSelectedLevel] = useState('Junior High School');
  const [selectedSection, setSelectedSection] = useState('Rose');
  const [selectedTerm, setSelectedTerm] = useState('Second Semester');

  const filteredStudents = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.student_number.includes(searchQuery)
  );

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
        {/* Search Student (Figure 28) */}
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Student..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Controls (Figure 28: SY, School Level, Section, Term) */}
        <View style={styles.filterGrid}>
          <View style={styles.filterPill}>
            <Text style={styles.filterPillText}>{selectedSy} ▾</Text>
          </View>
          <View style={styles.filterPill}>
            <Text style={styles.filterPillText}>{selectedLevel} ▾</Text>
          </View>
        </View>

        <View style={styles.filterGrid}>
          <View style={styles.filterPill}>
            <Text style={styles.filterPillText}>{selectedSection} ▾</Text>
          </View>
          <View style={styles.filterPill}>
            <Text style={styles.filterPillText}>{selectedTerm} ▾</Text>
          </View>
        </View>

        {/* Name of Students Table (Figure 28) */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableHeaderCell}>Name of Students</Text>
          </View>

          {filteredStudents.map((std, idx) => {
            const studentRec = records.find(r => r.student_id === std.student_id);
            const isCleared = studentRec?.overall_status === 'Cleared' || studentRec?.progress_percentage === 100;

            return (
              <View key={std.student_id} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>
                    {std.last_name}, {std.first_name} {std.middle_name?.[0]}.
                  </Text>
                  <Text style={styles.studentMeta}>
                    {std.grade_level} - {std.section} · LRN: {std.student_number}
                  </Text>
                </View>

                {/* View Clearance Form Button (Figure 28) */}
                <TouchableOpacity
                  style={styles.viewFormBtn}
                  onPress={() => onOpenCertificate(std)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.viewFormBtnText}>View Clearance Form</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
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
  searchBox: {
    marginBottom: 10,
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
  filterGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filterPill: {
    flex: 1,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
  },
  filterPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
  },
  tableHeaderRow: {
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
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableRowAlt: {
    backgroundColor: '#fafbfc',
  },
  studentName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  studentMeta: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  viewFormBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewFormBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1e3a8a',
  },
});
