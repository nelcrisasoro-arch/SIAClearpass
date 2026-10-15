import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useClearPass } from '../../context/ClearPassContext';

interface Props {
  onBack: () => void;
}

export const StudentNotificationsScreenRN: React.FC<Props> = ({ onBack }) => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useClearPass();

  const studentNotifs = notifications.filter(
    n => n.user_id === 'usr_student_joseph' || !n.user_id
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.siaPill}>
          <Text style={styles.siaPillText}>SIA</Text>
        </View>
      </View>

      <View style={styles.subHeaderBar}>
        <Text style={styles.subHeaderCount}>
          {studentNotifs.filter(n => !n.is_read).length} unread updates
        </Text>
        <TouchableOpacity onPress={markAllNotificationsRead}>
          <Text style={styles.markAllReadText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
        {studentNotifs.map((notif) => {
          const isComplete = notif.notification_type === 'Clearance Completed';
          const isSigned = notif.title.toLowerCase().includes('signed');
          const isApproved = notif.notification_type === 'Approval';
          const isRemark = notif.notification_type === 'Remark';

          const iconEmoji = isComplete
            ? '🎓'
            : isSigned
            ? '✍️'
            : isApproved
            ? '✅'
            : isRemark
            ? '⚠️'
            : 'ℹ️';

          return (
            <TouchableOpacity
              key={notif.notification_id}
              style={[
                styles.notifCard,
                !notif.is_read && styles.notifCardUnread,
              ]}
              onPress={() => markNotificationRead(notif.notification_id)}
              activeOpacity={0.8}
            >
              <View style={styles.iconCircle}>
                <Text style={styles.iconEmoji}>{iconEmoji}</Text>
              </View>

              <View style={styles.notifContent}>
                <View style={styles.notifHeaderRow}>
                  <Text style={styles.notifTitle}>{notif.title}</Text>
                  {!notif.is_read && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.notifMessage}>{notif.message}</Text>

                <Text style={styles.notifTime}>
                  {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </TouchableOpacity>
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
  subHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  subHeaderCount: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  markAllReadText: {
    fontSize: 11,
    color: '#1e3a8a',
    fontWeight: '600',
  },
  scrollList: {
    flex: 1,
    padding: 16,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'flex-start',
    gap: 12,
  },
  notifCardUnread: {
    borderColor: '#bfdbfe',
    backgroundColor: '#f0f7ff',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconEmoji: {
    fontSize: 18,
  },
  notifContent: {
    flex: 1,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1e3a8a',
  },
  notifMessage: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  notifTime: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 6,
  },
});
