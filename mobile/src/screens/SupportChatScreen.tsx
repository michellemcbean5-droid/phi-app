import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Linking, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import { RootStackParamList } from '../navigation/RootNavigator';
import { isClaudeConfigured } from '../api/claudeClient';
import useSupportChatStore, { SupportMessage } from '../store/supportChatStore';
import { getMichelleReply } from '../workers/SupportChatWorker';

type SupportChatNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const TRAIN_PLACEHOLDER = 'e.g. "Keep answers to one sentence" or "Always mention the Fleet plan when relevant"';

// Update this to your real support inbox before publishing.
const SUPPORT_EMAIL = 'support@princehaulintelligence.com';

const SUGGESTIONS = ['Is PHI really free?', 'How do I add my API key?', 'How do I cancel my subscription?', 'How do AI workers work?'];

export default function SupportChatScreen() {
  const navigation = useNavigation<SupportChatNavigationProp>();
  const { messages, thinking, customInstructions, addMessage, setThinking, setCustomInstructions } = useSupportChatStore();
  const [input, setInput] = useState('');
  const [trainOpen, setTrainOpen] = useState(false);
  const [trainDraft, setTrainDraft] = useState(customInstructions);
  const listRef = useRef<FlatList<SupportMessage>>(null);

  useEffect(() => {
    if (messages.length === 0) {
      addMessage(
        'michelle',
        isClaudeConfigured()
          ? "Hi, I'm Michelle — PHI's support assistant. Ask me anything about how the app works, billing, or privacy."
          : "Hi, I'm Michelle. I'm running in offline mode until you add a free API key in Settings, but I can still answer common questions — try one below.",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = (text?: string): void => {
    const message = (text ?? input).trim();
    if (!message) return;
    setInput('');
    addMessage('me', message);
    setThinking(true);
    getMichelleReply(message, customInstructions)
      .then((reply) => addMessage('michelle', reply))
      .finally(() => setThinking(false));
  };

  const handleContactHuman = (): void => {
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=PHI Support Request`);
  };

  const handleSaveTraining = (): void => {
    setCustomInstructions(trainDraft.trim());
    setTrainOpen(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ask Michelle</Text>
        <View style={styles.headerActionsRow}>
          <TouchableOpacity style={styles.troubleshootButton} onPress={() => navigation.navigate('SystemCheck')}>
            <Ionicons name="build-outline" size={16} color={PHI_COLORS.charcoalBlack} />
            <Text style={styles.troubleshootButtonText}>Troubleshoot</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.trainButton} onPress={() => { setTrainDraft(customInstructions); setTrainOpen((v) => !v); }}>
            <Ionicons name="options-outline" size={16} color={PHI_COLORS.sunshineYellow} />
            <Text style={styles.trainButtonText} numberOfLines={1}>Train Michelle</Text>
          </TouchableOpacity>
        </View>
      </View>


      {trainOpen && (
        <View style={styles.trainPanel}>
          <Text style={styles.trainPanelLabel}>
            Tell Michelle how you want her to behave. This only changes her replies when AI is configured (BYOK or your plan's managed AI) — offline FAQ answers can't be customized.
          </Text>
          <TextInput
            style={styles.trainInput}
            value={trainDraft}
            onChangeText={setTrainDraft}
            placeholder={TRAIN_PLACEHOLDER}
            placeholderTextColor="#7F9FCC"
            multiline
          />
          <View style={styles.trainActionsRow}>
            <TouchableOpacity style={styles.trainSaveButton} onPress={handleSaveTraining}>
              <Text style={styles.trainSaveButtonText}>Save</Text>
            </TouchableOpacity>
            {customInstructions ? (
              <TouchableOpacity
                style={styles.trainClearButton}
                onPress={() => { setTrainDraft(''); setCustomInstructions(''); }}
              >
                <Text style={styles.trainClearButtonText}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.feed}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.from === 'me' ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={styles.bubbleText}>{item.text}</Text>
            </View>
          )}
          ListFooterComponent={
            messages.length <= 1 ? (
              <View style={styles.suggestionWrap}>
                <TouchableOpacity style={styles.suggestionChip} onPress={() => navigation.navigate('SystemCheck')}>
                  <Text style={styles.suggestionText}>🩺 Something not working? Run a System Check</Text>
                </TouchableOpacity>
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => handleSend(s)}>
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null
          }
        />
        {thinking ? <Text style={styles.typingText}>Michelle is typing...</Text> : null}
        <TouchableOpacity style={styles.contactRow} onPress={handleContactHuman}>
          <Ionicons name="mail-outline" size={16} color={PHI_COLORS.sunshineYellow} />
          <Text style={styles.contactText}>Contact a human</Text>
        </TouchableOpacity>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Michelle anything..."
            placeholderTextColor="#7F9FCC"
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendButton} onPress={() => handleSend()}>
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
  header: { gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '900' },
  headerActionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  troubleshootButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  troubleshootButtonText: { color: PHI_COLORS.charcoalBlack, fontSize: 12, fontWeight: '700' },
  trainButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PHI_COLORS.card, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#29508C' },
  trainButtonText: { color: PHI_COLORS.sunshineYellow, fontSize: 12, fontWeight: '700' },
  trainPanel: { backgroundColor: PHI_COLORS.card, marginHorizontal: 16, marginBottom: 8, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: '#29508C' },
  trainPanelLabel: { color: '#A8B7D8', fontSize: 12, lineHeight: 17 },
  trainInput: { backgroundColor: '#132B52', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: PHI_COLORS.white, borderWidth: 1, borderColor: '#29508C', minHeight: 70, textAlignVertical: 'top' },
  trainActionsRow: { flexDirection: 'row', gap: 10 },
  trainSaveButton: { flex: 1, backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  trainSaveButtonText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800' },
  trainClearButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#FF525244' },
  trainClearButtonText: { color: '#FF5252', fontWeight: '700' },
  feed: { padding: 16, gap: 10 },
  bubble: { maxWidth: '85%', borderRadius: 16, padding: 12 },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: PHI_COLORS.royalBlue },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: PHI_COLORS.card },
  bubbleText: { color: PHI_COLORS.white, fontSize: 15, lineHeight: 21 },
  suggestionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  suggestionChip: { backgroundColor: PHI_COLORS.card, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#29508C' },
  suggestionText: { color: PHI_COLORS.sunshineYellow, fontSize: 12, fontWeight: '700' },
  typingText: { color: '#7F9FCC', fontSize: 12, paddingHorizontal: 16, paddingBottom: 2, fontStyle: 'italic' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingBottom: 8 },
  contactText: { color: PHI_COLORS.sunshineYellow, fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
  inputRow: { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: '#1E3A62' },
  input: { flex: 1, backgroundColor: PHI_COLORS.card, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: PHI_COLORS.white },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: PHI_COLORS.sunshineYellow, alignItems: 'center', justifyContent: 'center' },
});
