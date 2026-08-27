import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  DRIVER_CIRCLE_GUIDELINES,
  DriverCirclePost,
  DriverCircleTopic,
} from '../store/driverCircleStore';
import useDriverCircleStore from '../store/driverCircleStore';
import { CARTOON_COLORS, CARTOON_RADIUS, CARTOON_SHADOWS } from '../theme/cartoonTheme';

const TOPICS: Array<DriverCircleTopic | 'All'> = [
  'All',
  'Authority',
  'Dispatch',
  'Cash Flow',
  'Road Conditions',
  'Team Driving',
  'Safety',
];

const formatRelativeTime = (dateString: string): string => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(dateString).getTime()) / 60000));
  if (minutes < 2) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const ROLE_COLORS: Record<DriverCirclePost['authorRole'], string> = {
  'Rookie Driver': CARTOON_COLORS.electricBlue,
  'Mentor Driver': CARTOON_COLORS.moneyGreen,
  'PHI Team': CARTOON_COLORS.electricPurple,
};

export default function DriverCircleScreen() {
  const { posts, blockedAuthorNames, createPost, addReply, markHelpful, reportPost, blockAuthor } = useDriverCircleStore();
  const [selectedTopic, setSelectedTopic] = useState<DriverCircleTopic | 'All'>('All');
  const [draftBody, setDraftBody] = useState('');
  const [draftTopic, setDraftTopic] = useState<DriverCircleTopic>('Authority');
  const [seekingMentor, setSeekingMentor] = useState(false);
  const [seekingTeamDriver, setSeekingTeamDriver] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');

  const visiblePosts = useMemo(
    () => posts.filter((post) => !blockedAuthorNames.includes(post.authorName) && (selectedTopic === 'All' || post.topic === selectedTopic)),
    [blockedAuthorNames, posts, selectedTopic],
  );

  const containsSensitiveData = (value: string): boolean => {
    const hasPhoneNumber = /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/.test(value);
    const hasFinancialPhrase = /(routing number|bank account|wire transfer|cashapp|venmo|zelle|password)/i.test(value);
    return hasPhoneNumber || hasFinancialPhrase;
  };

  const publishPost = () => {
    const body = draftBody.trim();
    if (body.length < 12) {
      Alert.alert('Add more detail', 'Write at least 12 characters so other drivers can understand your question or update.');
      return;
    }
    if (containsSensitiveData(body)) {
      Alert.alert('Protect your information', 'Remove phone numbers, banking details, payment handles, passwords, and requests to send money before posting.');
      return;
    }
    createPost({ body, topic: draftTopic, seekingMentor, seekingTeamDriver });
    setDraftBody('');
    setSeekingMentor(false);
    setSeekingTeamDriver(false);
    setSelectedTopic('All');
  };

  const publishReply = (postId: string) => {
    const body = replyBody.trim();
    if (body.length < 4) return;
    if (containsSensitiveData(body)) {
      Alert.alert('Protect your information', 'Remove sensitive contact, banking, payment, and account details before replying.');
      return;
    }
    addReply(postId, body);
    setReplyBody('');
    setReplyingTo(null);
  };

  const confirmReport = (post: DriverCirclePost) => {
    Alert.alert('Report this post?', 'The post will be marked as reported on this device. Community moderation requires the production service to be enabled.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report', style: 'destructive', onPress: () => reportPost(post.id) },
    ]);
  };

  const confirmBlock = (post: DriverCirclePost) => {
    Alert.alert(`Block ${post.authorName}?`, 'Posts from this author will be hidden on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: () => blockAuthor(post.authorName) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={CARTOON_COLORS.gradientCandy} style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="people-outline" size={30} color={CARTOON_COLORS.electricPurple} /></View>
          <Text style={styles.eyebrow}>THE DRIVER’S CIRCLE</Text>
          <Text style={styles.heroTitle}>Real questions. Safer decisions.</Text>
          <Text style={styles.heroSubtitle}>Find practical peer support while keeping your private business information private.</Text>
        </LinearGradient>

        <View style={styles.testModeNotice}>
          <Ionicons name="flask-outline" size={20} color="#735A08" />
          <Text style={styles.testModeText}>Testing preview: posts and reports are retained on this device until the authenticated community service is connected.</Text>
        </View>

        <View style={styles.guidelineCard}>
          <View style={styles.guidelineTitleRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={CARTOON_COLORS.moneyGreen} />
            <Text style={styles.guidelineTitle}>Circle safety rules</Text>
          </View>
          {DRIVER_CIRCLE_GUIDELINES.map((guideline) => (
            <View key={guideline} style={styles.guidelineRow}>
              <Text style={styles.bullet}>•</Text><Text style={styles.guidelineText}>{guideline}</Text>
            </View>
          ))}
        </View>

        <View style={styles.composerCard}>
          <Text style={styles.composerTitle}>Ask the Circle</Text>
          <Text style={styles.composerHelp}>Share a question or a useful, general road update. Do not post private numbers, money details, or exact live location.</Text>
          <TextInput
            style={styles.composerInput}
            value={draftBody}
            onChangeText={setDraftBody}
            placeholder="Example: What records helped you prepare for your first New Entrant safety audit?"
            placeholderTextColor="#8291A8"
            multiline
            maxLength={600}
            textAlignVertical="top"
            accessibilityLabel="Write a Driver’s Circle post"
          />
          <View style={styles.topicRow}>
            {TOPICS.filter((topic): topic is DriverCircleTopic => topic !== 'All').map((topic) => (
              <TouchableOpacity key={topic} onPress={() => setDraftTopic(topic)} style={[styles.topicChip, draftTopic === topic && styles.topicChipActive]}>
                <Text style={[styles.topicChipText, draftTopic === topic && styles.topicChipTextActive]}>{topic}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>I’d like a mentor connection</Text>
            <Switch value={seekingMentor} onValueChange={setSeekingMentor} trackColor={{ false: '#CAD8EC', true: '#8FB8FF' }} thumbColor={seekingMentor ? CARTOON_COLORS.royalBlue : '#FFFFFF'} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>I’m exploring team driving</Text>
            <Switch value={seekingTeamDriver} onValueChange={setSeekingTeamDriver} trackColor={{ false: '#CAD8EC', true: '#8FB8FF' }} thumbColor={seekingTeamDriver ? CARTOON_COLORS.royalBlue : '#FFFFFF'} />
          </View>
          <TouchableOpacity style={styles.publishButton} onPress={publishPost} accessibilityRole="button">
            <Ionicons name="send-outline" size={18} color="#FFFFFF" />
            <Text style={styles.publishText}>Post safely</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>EXPLORE TOPICS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {TOPICS.map((topic) => (
            <TouchableOpacity key={topic} onPress={() => setSelectedTopic(topic)} style={[styles.filterChip, selectedTopic === topic && styles.filterChipActive]}>
              <Text style={[styles.filterText, selectedTopic === topic && styles.filterTextActive]}>{topic}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>CIRCLE FEED</Text>
        {visiblePosts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="chatbubble-ellipses-outline" size={28} color={CARTOON_COLORS.electricBlue} />
            <Text style={styles.emptyTitle}>No posts in this topic yet</Text>
            <Text style={styles.emptyText}>Start the conversation with a clear question or helpful lesson.</Text>
          </View>
        ) : visiblePosts.map((post) => (
          <View key={post.id} style={[styles.postCard, post.isReported && styles.reportedCard]}>
            <View style={styles.postHeader}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{post.authorName.slice(0, 1).toUpperCase()}</Text></View>
              <View style={styles.authorMeta}>
                <Text style={styles.authorName}>{post.authorName}</Text>
                <Text style={[styles.roleText, { color: ROLE_COLORS[post.authorRole] }]}>{post.authorRole} · {formatRelativeTime(post.createdAt)}</Text>
              </View>
              <TouchableOpacity onPress={() => confirmReport(post)} style={styles.iconButton} accessibilityLabel={`Report post by ${post.authorName}`}>
                <Ionicons name={post.isReported ? 'flag' : 'flag-outline'} size={19} color={post.isReported ? '#D64545' : '#7185A2'} />
              </TouchableOpacity>
            </View>
            <View style={styles.postTagRow}>
              <View style={styles.postTopicTag}><Text style={styles.postTopicText}>{post.topic}</Text></View>
              {post.seekingMentor && <View style={styles.mentorTag}><Ionicons name="school-outline" size={13} color="#236B3A" /><Text style={styles.mentorTagText}>Mentor request</Text></View>}
              {post.seekingTeamDriver && <View style={styles.teamTag}><Ionicons name="people-outline" size={13} color="#2D5AA5" /><Text style={styles.teamTagText}>Team driving</Text></View>}
            </View>
            <Text style={styles.postBody}>{post.body}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => markHelpful(post.id)} style={styles.actionButton}><Ionicons name="thumbs-up-outline" size={17} color={CARTOON_COLORS.royalBlue} /><Text style={styles.actionText}>Helpful {post.helpfulCount > 0 ? `(${post.helpfulCount})` : ''}</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setReplyingTo(replyingTo === post.id ? null : post.id)} style={styles.actionButton}><Ionicons name="chatbubble-outline" size={17} color={CARTOON_COLORS.royalBlue} /><Text style={styles.actionText}>Reply {post.replyCount > 0 ? `(${post.replyCount})` : ''}</Text></TouchableOpacity>
              {post.authorRole !== 'PHI Team' && <TouchableOpacity onPress={() => confirmBlock(post)} style={styles.actionButton}><Ionicons name="eye-off-outline" size={17} color="#7185A2" /><Text style={styles.actionText}>Hide</Text></TouchableOpacity>}
            </View>
            {replyingTo === post.id && (
              <View style={styles.replyComposer}>
                <TextInput style={styles.replyInput} value={replyBody} onChangeText={setReplyBody} placeholder="Write a safe, useful reply" placeholderTextColor="#8291A8" multiline maxLength={400} />
                <TouchableOpacity onPress={() => publishReply(post.id)} style={styles.replyButton}><Text style={styles.replyButtonText}>Reply</Text></TouchableOpacity>
              </View>
            )}
            {post.replies.length > 0 && (
              <View style={styles.replyList}>
                {post.replies.map((reply) => (
                  <View key={reply.id} style={styles.replyRow}>
                    <View style={styles.replyDot} />
                    <View style={styles.replyBody}><Text style={styles.replyAuthor}>{reply.authorName} · {formatRelativeTime(reply.createdAt)}</Text><Text style={styles.replyText}>{reply.body}</Text></View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7FF' },
  content: { padding: 16, paddingBottom: 36, gap: 14 },
  hero: { borderRadius: CARTOON_RADIUS.xl, padding: 22, ...CARTOON_SHADOWS.lg },
  heroIcon: { alignSelf: 'flex-start', padding: 10, borderRadius: 18, backgroundColor: '#FFFFFF', marginBottom: 12 },
  eyebrow: { color: 'rgba(255,255,255,0.85)', fontSize: 11, letterSpacing: 1.1, fontWeight: '900' },
  heroTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', lineHeight: 33, marginTop: 5 },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600', lineHeight: 20, marginTop: 7 },
  testModeNotice: { flexDirection: 'row', gap: 9, padding: 12, backgroundColor: '#FFF6D7', borderColor: '#F2D77C', borderWidth: 1, borderRadius: CARTOON_RADIUS.md },
  testModeText: { flex: 1, color: '#735A08', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  guidelineCard: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: CARTOON_RADIUS.lg, borderWidth: 1.5, borderColor: '#B9EBC7', gap: 8, ...CARTOON_SHADOWS.sm },
  guidelineTitleRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 2 },
  guidelineTitle: { color: CARTOON_COLORS.charcoal, fontSize: 16, fontWeight: '900' },
  guidelineRow: { flexDirection: 'row', gap: 7 },
  bullet: { color: CARTOON_COLORS.moneyGreen, fontWeight: '900' },
  guidelineText: { flex: 1, color: CARTOON_COLORS.slate, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  composerCard: { backgroundColor: '#FFFFFF', padding: 16, gap: 11, borderRadius: CARTOON_RADIUS.lg, borderWidth: 1.5, borderColor: '#C9DDF7', ...CARTOON_SHADOWS.sm },
  composerTitle: { color: CARTOON_COLORS.charcoal, fontSize: 18, fontWeight: '900' },
  composerHelp: { color: CARTOON_COLORS.slate, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  composerInput: { minHeight: 98, padding: 12, borderRadius: CARTOON_RADIUS.md, borderWidth: 1.5, borderColor: '#C7D9F1', color: CARTOON_COLORS.charcoal, fontSize: 14, fontWeight: '600', backgroundColor: '#F8FBFF' },
  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  topicChip: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: 99, borderWidth: 1, borderColor: '#BFD3EE', backgroundColor: '#FFFFFF' },
  topicChipActive: { backgroundColor: CARTOON_COLORS.royalBlue, borderColor: CARTOON_COLORS.royalBlue },
  topicChipText: { color: '#456485', fontSize: 11, fontWeight: '800' },
  topicChipTextActive: { color: '#FFFFFF' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  switchText: { color: CARTOON_COLORS.charcoal, fontSize: 13, fontWeight: '700' },
  publishButton: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingVertical: 13, borderRadius: CARTOON_RADIUS.md, backgroundColor: CARTOON_COLORS.royalBlue },
  publishText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  sectionLabel: { color: '#496383', fontSize: 11, letterSpacing: 1, fontWeight: '900', marginTop: 3 },
  filterRow: { gap: 8, paddingRight: 16 },
  filterChip: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 99, borderWidth: 1.5, backgroundColor: '#FFFFFF', borderColor: '#BFD3EE' },
  filterChipActive: { backgroundColor: CARTOON_COLORS.royalBlue, borderColor: CARTOON_COLORS.royalBlue },
  filterText: { color: '#456485', fontSize: 12, fontWeight: '800' },
  filterTextActive: { color: '#FFFFFF' },
  emptyCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#C9DDF7', borderRadius: CARTOON_RADIUS.lg, padding: 24, gap: 7 },
  emptyTitle: { color: CARTOON_COLORS.charcoal, fontSize: 16, fontWeight: '900' },
  emptyText: { color: CARTOON_COLORS.slate, fontSize: 13, lineHeight: 19, textAlign: 'center', fontWeight: '600' },
  postCard: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#D3E0F2', padding: 16, gap: 10, borderRadius: CARTOON_RADIUS.lg, ...CARTOON_SHADOWS.sm },
  reportedCard: { borderColor: '#F2A3A3', backgroundColor: '#FFFBFB' },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  avatar: { width: 37, height: 37, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E7F0FF' },
  avatarText: { color: CARTOON_COLORS.royalBlue, fontSize: 16, fontWeight: '900' },
  authorMeta: { flex: 1 },
  authorName: { color: CARTOON_COLORS.charcoal, fontSize: 14, fontWeight: '900' },
  roleText: { fontSize: 11, fontWeight: '800', marginTop: 2 },
  iconButton: { padding: 5 },
  postTagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  postTopicTag: { borderRadius: 99, paddingVertical: 5, paddingHorizontal: 9, backgroundColor: '#E8F1FF' },
  postTopicText: { color: CARTOON_COLORS.royalBlue, fontSize: 10, fontWeight: '900' },
  mentorTag: { flexDirection: 'row', gap: 4, alignItems: 'center', borderRadius: 99, paddingVertical: 5, paddingHorizontal: 8, backgroundColor: '#E5F8EA' },
  mentorTagText: { color: '#236B3A', fontSize: 10, fontWeight: '900' },
  teamTag: { flexDirection: 'row', gap: 4, alignItems: 'center', borderRadius: 99, paddingVertical: 5, paddingHorizontal: 8, backgroundColor: '#EAF3FF' },
  teamTagText: { color: '#2D5AA5', fontSize: 10, fontWeight: '900' },
  postBody: { color: CARTOON_COLORS.charcoal, fontSize: 14, lineHeight: 21, fontWeight: '600' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 3 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3 },
  actionText: { color: '#456485', fontSize: 12, fontWeight: '800' },
  replyComposer: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', backgroundColor: '#F6FAFF', borderRadius: CARTOON_RADIUS.md, padding: 10 },
  replyInput: { flex: 1, minHeight: 44, maxHeight: 100, padding: 8, color: CARTOON_COLORS.charcoal, fontSize: 13, fontWeight: '600' },
  replyButton: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: CARTOON_COLORS.royalBlue },
  replyButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  replyList: { gap: 8, borderTopWidth: 1, borderTopColor: '#E4EDF9', paddingTop: 10 },
  replyRow: { flexDirection: 'row', gap: 8 },
  replyDot: { width: 7, height: 7, borderRadius: 4, marginTop: 6, backgroundColor: CARTOON_COLORS.electricBlue },
  replyBody: { flex: 1, gap: 2 },
  replyAuthor: { color: '#456485', fontSize: 11, fontWeight: '900' },
  replyText: { color: CARTOON_COLORS.slate, fontSize: 12, lineHeight: 18, fontWeight: '600' },
});
