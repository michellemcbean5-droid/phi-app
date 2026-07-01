import React, { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
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
  const [listening, setListening] = useState(false);
  const [micPermission, setMicPermission] = useState(false);
  const spokenIds = useRef<Set<string>>(new Set());
  const listRef = useRef<FlatList<RadioMessage>>(null);

  useEffect(() => {
    void ExpoSpeechRecognitionModule.requestPermissionsAsync().then((res) => setMicPermission(res.granted));
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      addMessage('System', 'Radio channel open. Hold the mic button to talk to dispatch.');
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

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (event.isFinal && transcript) {
      handleDriverTranscript(transcript);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
  });

  useSpeechRecognitionEvent('error', () => {
    setListening(false);
  });

  const handleDriverTranscript = (transcript: string): void => {
    addMessage('Driver', transcript);
    setTransmitting(true);
    getDispatcherReply(transcript)
      .then((reply) => addMessage('Dispatcher', reply))
      .finally(() => setTransmitting(false));
  };

  const startTalking = (): void => {
    if (!micPermission) return;
    setListening(true);
    ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: false });
  };

  const stopTalking = (): void => {
    ExpoSpeechRecognitionModule.stop();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.headerCard}>
        <Ionicons name="radio-outline" size={24} color={PHI_COLORS.sunshineYellow} />
        <Text style={styles.headerTitle}>Dispatcher Radio</Text>
        <View style={[styles.statusDot, { backgroundColor: transmitting ? '#FF5252' : PHI_COLORS.moneyGreen }]} />
      </View>

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

      {!micPermission ? (
        <Text style={styles.permissionText}>Microphone permission needed to talk to dispatch.</Text>
      ) : null}

      <TouchableOpacity
        style={[styles.pttButton, listening && styles.pttButtonActive]}
        onPressIn={startTalking}
        onPressOut={stopTalking}
        disabled={!micPermission}
      >
        <Ionicons name={listening ? 'mic' : 'mic-outline'} size={32} color={PHI_COLORS.charcoalBlack} />
        <Text style={styles.pttText}>{listening ? 'Listening...' : 'Hold to Talk'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.charcoalBlack },
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
  permissionText: { color: '#FF5252', textAlign: 'center', paddingHorizontal: 20, paddingBottom: 8, fontSize: 12 },
  pttButton: {
    margin: 16, backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 20,
    paddingVertical: 20, alignItems: 'center', gap: 6,
  },
  pttButtonActive: { backgroundColor: '#FF5252' },
  pttText: { color: PHI_COLORS.charcoalBlack, fontWeight: '900', fontSize: 15 },
});
