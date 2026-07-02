import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Linking, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import { isClaudeConfigured } from '../api/claudeClient';
import useSupportChatStore, { SupportMessage } from '../store/supportChatStore';
import { getMichelleReply } from '../workers/SupportChatWorker';

// Update this to your real support inbox before publishing.
const SUPPORT_EMAIL = 'support@princehaulintelligence.com';

const SUGGESTIONS = ['Is PHI really free?', 'How do I add my API key?', 'How do I cancel my subscription?', 'How do AI workers work?'];

export default function SupportChatScreen() {
  const { messages, thinking, addMessage, setThinking } = useSupportChatStore();
  const [input, setInput] = useState('');
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
    getMichelleReply(message)
      .then((reply) => addMessage('michelle', reply))
      .finally(() => setThinking(false));
  };

  const handleContactHuman = (): void => {
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=PHI Support Request`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
