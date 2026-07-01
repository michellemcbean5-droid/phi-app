import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { PHI_COLORS } from '../assets/brandColors';
import useRadioStore, { RadioMessage } from '../store/radioStore';
import { getDispatcherReply } from '../workers/DispatcherRadioWorker';

const SPEAKER_COLORS: Record<RadioMessage['speaker'], string> = {
  Dispatcher: PHI_COLORS.sunshineYellow,
  Driver: PHI_COLORS.moneyGreen,
  System: '#7F9FCC',
};

export default function DispatcherRadioScreen() {
  const { messages, transmitting, addMessage, setTransmitting } = useRadioStore();
  const [input, setInput] = useState('');
  const spokenIds = useRef<Set<string>>(new Set());
  const listRef = useRef<FlatList<RadioMessage>>(null);

  useEffect(() => {
    if (messages.length === 0) {
      addMessage('System', 'Radio channel open. Key up to talk to dispatch.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.speaker === 'Dispatcher' && !spokenIds.current.has(last.id)) {
      spokenIds.current.add(last.id);
      Speech.speak(last.text, { rate: 0.95 });
    }
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleKeyUp = (): void => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    addMessage('Driver', text);
    setTransmitting(true);
    getDispatcherReply(text)
      .then((reply) => addMessage('Dispatcher', reply))
      .finally(() => setTransmitting(false));
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.headerCard}>
        <Ionicons name="radio-outline" size={24} color={PHI_COLORS.sunshineYellow} />
        <Text style={styles.headerTitle}>Dispatcher Radio</Text>
        <View style={[styles.statusDot, { backgroundColor: transmitting ? '#FF5252' : PHI_COLORS.moneyGreen }]} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.feed}
          renderItem={({ item }) => (
            <View style={styles.messageRow}>
              <Text style={[styles.speaker, { color: SPEAKER_COLORS[item.speaker] }]}>
                {item.speaker === 'Dispatcher' ? '📡 DISPATCH' : item.speaker === 'Driver' ? '🚛 YOU' : 'ℹ️'}
              </Text>
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          )}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Key up to talk to dispatch..."
            placeholderTextColor="#7F9FCC"
            onSubmitEditing={handleKeyUp}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.pttButton} onPress={handleKeyUp}>
            <Ionicons name="radio" size={24} color={PHI_COLORS.charcoalBlack} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.charcoalBlack },
  flex: { flex: 1 },
  headerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16,
    backgroundColor: PHI_COLORS.royalBlue,
  },
  headerTitle: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '900', flex: 1 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  feed: { padding: 16, gap: 12 },
  messageRow: { gap: 2 },
  speaker: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  messageText: { color: PHI_COLORS.white, fontSize: 15, lineHeight: 21 },
  inputRow: { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: '#2A3B55' },
  input: {
    flex: 1, backgroundColor: '#1A2B45', borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, color: PHI_COLORS.white,
  },
  pttButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: PHI_COLORS.sunshineYellow,
    alignItems: 'center', justifyContent: 'center',
  },
});
