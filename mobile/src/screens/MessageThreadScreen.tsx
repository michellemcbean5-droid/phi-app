import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import { RootStackParamList } from '../navigation/RootNavigator';
import useInboxStore, { InboxMessage, DISPATCH_THREAD_ID } from '../store/inboxStore';
import { getDispatcherReply } from '../workers/DispatcherRadioWorker';
import useWorkerStore from '../store/workerStore';

type ThreadRouteProp = RouteProp<RootStackParamList, 'MessageThread'>;

export default function MessageThreadScreen() {
  const route = useRoute<ThreadRouteProp>();
  const { threadId } = route.params;
  const { threads, sendMessage, markRead } = useInboxStore();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<InboxMessage>>(null);

  const thread = threads.find((t) => t.id === threadId);

  useEffect(() => {
    markRead(threadId);
  }, [threadId, markRead]);

  const handleSend = (): void => {
    const text = input.trim();
    if (!text || !thread) return;
    setInput('');
    sendMessage(threadId, 'me', text);

    if (threadId === DISPATCH_THREAD_ID) {
      setSending(true);
      getDispatcherReply(text)
        .then((reply) => {
          sendMessage(threadId, 'them', reply);
          useWorkerStore.getState().recordTaskCompletion('dispatch-coordinator', 0, 'Replied in Messages');
        })
        .finally(() => setSending(false));
    }
  };

  if (!thread) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>Conversation not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={thread.messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.from === 'me' ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={styles.bubbleText}>{item.text}</Text>
            </View>
          )}
        />
        {sending ? <Text style={styles.typingText}>Dispatch is typing...</Text> : null}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message dispatch..."
            placeholderTextColor="#7F9FCC"
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="send" size={20} color={PHI_COLORS.charcoalBlack} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  flex: { flex: 1 },
  messages: { padding: 16, gap: 10 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12 },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: PHI_COLORS.royalBlue },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: PHI_COLORS.card },
  bubbleText: { color: PHI_COLORS.white, fontSize: 15, lineHeight: 20 },
  typingText: { color: '#7F9FCC', fontSize: 12, paddingHorizontal: 16, paddingBottom: 4, fontStyle: 'italic' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12,
    borderTopWidth: 1, borderTopColor: '#1E3A62',
  },
  input: {
    flex: 1, backgroundColor: PHI_COLORS.card, borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, color: PHI_COLORS.white, maxHeight: 100,
  },
  sendButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: PHI_COLORS.sunshineYellow,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { color: '#7F9FCC', textAlign: 'center', marginTop: 40 },
});
