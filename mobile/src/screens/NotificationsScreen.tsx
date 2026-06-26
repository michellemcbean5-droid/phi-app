import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PHI_COLORS } from '../assets/brandColors';

interface NotificationItem {
  id: string;
  priority: 'Critical' | 'High' | 'Normal';
  message: string;
  read: boolean;
}

const initialNotifications: NotificationItem[] = [
  { id: 'note-1', priority: 'Critical', message: 'Driver HOS projected to expire in 90 minutes.', read: false },
  { id: 'note-2', priority: 'High', message: 'Broker updated rate confirmation for load DAT-101.', read: false },
  { id: 'note-3', priority: 'Normal', message: 'Fuel optimizer found lower pricing on your Atlanta lane.', read: true },
];

const priorityColors: Record<NotificationItem['priority'], string> = {
  Critical: '#FF5252',
  High: PHI_COLORS.sunshineYellow,
  Normal: PHI_COLORS.moneyGreen,
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const orderedNotifications = useMemo(
    () => [...notifications].sort((left, right) => Number(left.read) - Number(right.read)),
    [notifications],
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Priority Queue</Text>
        {orderedNotifications.map((notification) => (
          <View key={notification.id} style={[styles.card, notification.read && styles.cardRead]}>
            <View style={styles.cardHeader}>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColors[notification.priority] }]}>
                <Text style={styles.priorityText}>{notification.priority}</Text>
              </View>
              {!notification.read && <Text style={styles.unreadMarker}>Unread</Text>}
            </View>
            <Text style={styles.message}>{notification.message}</Text>
            <TouchableOpacity
              style={styles.markReadButton}
              onPress={() =>
                setNotifications((current) =>
                  current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
                )
              }
            >
              <Text style={styles.markReadText}>{notification.read ? 'Read' : 'Mark as Read'}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  content: { padding: 16, gap: 14 },
  title: { color: PHI_COLORS.white, fontSize: 26, fontWeight: '800' },
  card: { backgroundColor: PHI_COLORS.card, borderRadius: 16, padding: 16, gap: 10 },
  cardRead: { opacity: 0.72 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priorityBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  priorityText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800' },
  unreadMarker: { color: PHI_COLORS.sunshineYellow, fontWeight: '700' },
  message: { color: PHI_COLORS.white, lineHeight: 20 },
  markReadButton: { backgroundColor: PHI_COLORS.royalBlue, padding: 12, borderRadius: 12 },
  markReadText: { color: PHI_COLORS.white, textAlign: 'center', fontWeight: '700' },
});
