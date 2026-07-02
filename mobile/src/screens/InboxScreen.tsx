import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import { RootStackParamList } from '../navigation/RootNavigator';
import useInboxStore from '../store/inboxStore';

type InboxNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Inbox'>;

const formatTime = (timestamp: string): string =>
  new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export default function InboxScreen() {
  const navigation = useNavigation<InboxNavigationProp>();
  const threads = useInboxStore((state) => state.threads);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={threads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => {
          const lastMessage = item.messages[item.messages.length - 1];
          return (
            <TouchableOpacity
              style={styles.threadRow}
              onPress={() => navigation.navigate('MessageThread', { threadId: item.id })}
            >
              <View style={styles.avatar}>
                <Ionicons name="person-circle-outline" size={36} color={PHI_COLORS.sunshineYellow} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.threadName}>{item.name}</Text>
                <Text style={styles.threadPreview} numberOfLines={1}>
                  {lastMessage ? lastMessage.text : item.subtitle}
                </Text>
              </View>
              <View style={styles.metaCol}>
                {lastMessage ? <Text style={styles.timeText}>{formatTime(lastMessage.timestamp)}</Text> : null}
                {item.unread ? <View style={styles.unreadDot} /> : null}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  content: { padding: 12 },
  threadRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: PHI_COLORS.card, borderRadius: 14, marginBottom: 10,
  },
  avatar: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  threadName: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 15 },
  threadPreview: { color: '#A8B7D8', fontSize: 13, marginTop: 2 },
  metaCol: { alignItems: 'flex-end', gap: 6 },
  timeText: { color: '#7F9FCC', fontSize: 11 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PHI_COLORS.moneyGreen },
});
