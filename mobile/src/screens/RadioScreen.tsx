/**
 * RadioScreen — Real dispatch radio experience
 *
 * - CB-style channels: Ch 1 (Emergency), Ch 9 (General), Ch 19 (Highway) + custom
 * - Push-to-talk (PTT) hold button
 * - 10-code quick-reply buttons
 * - Channel roster (who's listening)
 * - TTS for incoming dispatch messages
 * - Text transcript / history per channel
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { PHI_COLORS } from '../assets/brandColors';
import useRadioStore, { RadioMessage } from '../store/radioStore';
import { getDispatcherReply } from '../workers/DispatcherRadioWorker';
import useWorkerStore from '../store/workerStore';

// ── Channel definitions ───────────────────────────────────────────────────────

interface RadioChannel {
  id: string;
  number: number;
  name: string;
  description: string;
  color: string;
  activeCount: number;
}

const CHANNELS: RadioChannel[] = [
  { id: 'ch1', number: 1, name: 'Emergency', description: 'Breakdowns, accidents, crises', color: '#FF5252', activeCount: 3 },
  { id: 'ch9', number: 9, name: 'General', description: 'Main chatter channel', color: PHI_COLORS.moneyGreen, activeCount: 47 },
  { id: 'ch19', number: 19, name: 'Highway', description: 'Road alerts, weigh stations', color: PHI_COLORS.sunshineYellow, activeCount: 128 },
  { id: 'ch21', number: 21, name: 'Load Board', description: 'AI broadcasts new loads', color: '#9BE8FF', activeCount: 89 },
  { id: 'ch33', number: 33, name: 'Dispatch Only', description: 'PHI AI dispatcher channel', color: '#C7A6FF', activeCount: 12 },
];

// ── 10-code shortcuts ─────────────────────────────────────────────────────────

const TEN_CODES: { code: string; meaning: string }[] = [
  { code: '10-4', meaning: 'Acknowledged / Copy' },
  { code: '10-20', meaning: 'What is your location?' },
  { code: '10-36', meaning: 'What is the correct time?' },
  { code: '10-9', meaning: 'Repeat last message' },
  { code: '10-100', meaning: 'Restroom break' },
  { code: '10-33', meaning: 'Emergency — all units stop' },
  { code: '10-200', meaning: 'Need police' },
  { code: '10-7', meaning: 'Out of service' },
];

const SPEAKER_COLORS: Record<RadioMessage['speaker'], string> = {
  Dispatcher: PHI_COLORS.sunshineYellow,
  Driver: PHI_COLORS.moneyGreen,
  System: '#7F9FCC',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function RadioScreen() {
  const { messages, transmitting, addMessage, setTransmitting } = useRadioStore();
  const [activeChannel, setActiveChannel] = useState<RadioChannel>(CHANNELS[1]); // Ch 9 default
  const [input, setInput] = useState('');
  const [pttHeld, setPttHeld] = useState(false);
  const [showChannels, setShowChannels] = useState(false);
  const [showTenCodes, setShowTenCodes] = useState(false);
  const spokenIds = useRef<Set<string>>(new Set());
  const listRef = useRef<FlatList<RadioMessage>>(null);
  const pttTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Announce channel on load
  useEffect(() => {
    addMessage('System', `Tuned to Channel ${activeChannel.number} — ${activeChannel.name}. ${activeChannel.activeCount} drivers listening.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-TTS incoming dispatcher messages
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.speaker === 'Dispatcher' && !spokenIds.current.has(last.id)) {
      spokenIds.current.add(last.id);
      Speech.speak(last.text, { rate: 0.9, pitch: 0.85 });
    }
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setInput('');
      addMessage('Driver', trimmed);
      setTransmitting(true);
      getDispatcherReply(trimmed)
        .then((reply) => {
          addMessage('Dispatcher', reply);
          useWorkerStore.getState().recordTaskCompletion('dispatch-coordinator', 0, 'Radio reply sent');
        })
        .finally(() => setTransmitting(false));
    },
    [addMessage, setTransmitting],
  );

  const handlePttPress = () => {
    setPttHeld(true);
  };

  const handlePttRelease = () => {
    setPttHeld(false);
    if (input.trim()) {
      sendMessage(input);
    }
  };

  const handleTenCode = (code: string) => {
    setShowTenCodes(false);
    sendMessage(code);
  };

  const handleChannelSwitch = (ch: RadioChannel) => {
    setShowChannels(false);
    setActiveChannel(ch);
    addMessage('System', `Switched to Channel ${ch.number} — ${ch.name}. ${ch.activeCount} drivers listening.`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* CB-style header */}
      <View style={[styles.header, { borderBottomColor: activeChannel.color }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.channelNum}>CH {activeChannel.number}</Text>
          <View>
            <Text style={styles.channelName}>{activeChannel.name}</Text>
            <Text style={styles.channelDesc}>{activeChannel.description}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.listenersRow}>
            <View style={[styles.liveIndicator, { backgroundColor: transmitting ? '#FF5252' : activeChannel.color }]} />
            <Text style={styles.listenersText}>{activeChannel.activeCount} drivers</Text>
          </View>
          <TouchableOpacity style={styles.channelSwitchBtn} onPress={() => setShowChannels(!showChannels)}>
            <Text style={styles.channelSwitchText}>SCAN</Text>
            <Ionicons name={showChannels ? 'chevron-up' : 'chevron-down'} size={14} color={PHI_COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Channel selector dropdown */}
      {showChannels && (
        <View style={styles.channelList}>
          {CHANNELS.map((ch) => (
            <TouchableOpacity
              key={ch.id}
              style={[styles.channelRow, activeChannel.id === ch.id && styles.channelRowActive]}
              onPress={() => handleChannelSwitch(ch)}
            >
              <View style={[styles.channelNumBadge, { backgroundColor: ch.color + '33' }]}>
                <Text style={[styles.channelNumBadgeText, { color: ch.color }]}>{ch.number}</Text>
              </View>
              <View style={styles.channelInfo}>
                <Text style={styles.channelRowName}>{ch.name}</Text>
                <Text style={styles.channelRowDesc}>{ch.description}</Text>
              </View>
              <View style={styles.channelRowListeners}>
                <View style={[styles.dot, { backgroundColor: ch.color }]} />
                <Text style={styles.channelRowCount}>{ch.activeCount}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        {/* Message feed */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.feed}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.messageRow, item.speaker === 'Driver' && styles.messageRowSelf]}>
              <Text style={[styles.speakerLabel, { color: SPEAKER_COLORS[item.speaker] }]}>
                {item.speaker === 'Dispatcher' ? '📡 DISPATCH' : item.speaker === 'Driver' ? '🚛 YOU' : 'ℹ️ SYSTEM'}
              </Text>
              <View style={[styles.messageBubble, item.speaker === 'Driver' && styles.messageBubbleSelf]}>
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            </View>
          )}
        />

        {/* 10-codes drawer */}
        {showTenCodes && (
          <ScrollView horizontal style={styles.tenCodeScroll} contentContainerStyle={styles.tenCodeContent} showsHorizontalScrollIndicator={false}>
            {TEN_CODES.map((tc) => (
              <TouchableOpacity key={tc.code} style={styles.tenCodeChip} onPress={() => handleTenCode(tc.code)}>
                <Text style={styles.tenCodeCode}>{tc.code}</Text>
                <Text style={styles.tenCodeMeaning} numberOfLines={1}>{tc.meaning}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input row */}
        <View style={styles.inputRow}>
          {/* 10-code toggle */}
          <TouchableOpacity
            style={[styles.iconBtn, showTenCodes && styles.iconBtnActive]}
            onPress={() => setShowTenCodes(!showTenCodes)}
          >
            <Text style={styles.iconBtnText}>10</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={pttHeld ? '🔴 TRANSMITTING...' : 'Key up to talk...'}
            placeholderTextColor={pttHeld ? '#FF5252' : '#7F9FCC'}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
          />

          {/* PTT button */}
          <TouchableOpacity
            style={[styles.pttBtn, pttHeld && styles.pttBtnActive]}
            onPressIn={handlePttPress}
            onPressOut={handlePttRelease}
            activeOpacity={0.7}
          >
            <Ionicons name="radio" size={24} color={pttHeld ? '#FF5252' : PHI_COLORS.charcoalBlack} />
            <Text style={[styles.pttLabel, pttHeld && styles.pttLabelActive]}>PTT</Text>
          </TouchableOpacity>
        </View>

        {/* Transmitting indicator */}
        {transmitting && (
          <View style={styles.transmittingBar}>
            <View style={styles.transmittingDot} />
            <Text style={styles.transmittingText}>Dispatch is responding...</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E1A' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#0D1525',
    borderBottomWidth: 2,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  channelNum: {
    color: PHI_COLORS.sunshineYellow,
    fontSize: 28,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  channelName: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 15 },
  channelDesc: { color: '#7F9FCC', fontSize: 11, marginTop: 1 },
  headerRight: { alignItems: 'flex-end', gap: 6 },
  listenersRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveIndicator: { width: 8, height: 8, borderRadius: 4 },
  listenersText: { color: '#D7E3FF', fontSize: 12, fontWeight: '700' },
  channelSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A2B45',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  channelSwitchText: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 11 },
  channelList: { backgroundColor: '#0D1525', borderBottomWidth: 1, borderBottomColor: '#1B3060' },
  channelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  channelRowActive: { backgroundColor: '#0D2A50' },
  channelNumBadge: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  channelNumBadgeText: { fontWeight: '900', fontSize: 16 },
  channelInfo: { flex: 1 },
  channelRowName: { color: PHI_COLORS.white, fontWeight: '700', fontSize: 13 },
  channelRowDesc: { color: '#7F9FCC', fontSize: 11, marginTop: 1 },
  channelRowListeners: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  channelRowCount: { color: '#D7E3FF', fontSize: 11 },
  feed: { padding: 12, gap: 10 },
  messageRow: { gap: 3 },
  messageRowSelf: { alignItems: 'flex-end' },
  speakerLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  messageBubble: {
    backgroundColor: '#0D1F3C',
    borderRadius: 12,
    padding: 10,
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: '#1B3060',
  },
  messageBubbleSelf: { backgroundColor: '#0D3020', borderColor: PHI_COLORS.moneyGreen + '55' },
  messageText: { color: PHI_COLORS.white, fontSize: 14, lineHeight: 20 },
  tenCodeScroll: { maxHeight: 72, borderTopWidth: 1, borderTopColor: '#1B3060' },
  tenCodeContent: { padding: 8, gap: 6 },
  tenCodeChip: {
    backgroundColor: '#0D2A50',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#1B4BCC',
  },
  tenCodeCode: { color: PHI_COLORS.sunshineYellow, fontWeight: '900', fontSize: 13 },
  tenCodeMeaning: { color: '#D7E3FF', fontSize: 9, marginTop: 2, textAlign: 'center' },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#1B3060',
    alignItems: 'center',
    backgroundColor: '#0D1525',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1A2B45',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#29508C',
  },
  iconBtnActive: { backgroundColor: '#0D2A50', borderColor: PHI_COLORS.royalBlue },
  iconBtnText: { color: PHI_COLORS.sunshineYellow, fontWeight: '900', fontSize: 13 },
  input: {
    flex: 1,
    backgroundColor: '#1A2B45',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: PHI_COLORS.white,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#29508C',
  },
  pttBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PHI_COLORS.sunshineYellow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pttBtnActive: { backgroundColor: '#FF5252' },
  pttLabel: { color: PHI_COLORS.charcoalBlack, fontSize: 9, fontWeight: '900' },
  pttLabelActive: { color: PHI_COLORS.white },
  transmittingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1A2B45',
    padding: 8,
    paddingHorizontal: 16,
  },
  transmittingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF5252' },
  transmittingText: { color: '#7F9FCC', fontSize: 12 },
});
