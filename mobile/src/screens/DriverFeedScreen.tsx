/**
 * DriverFeedScreen — Social platform for drivers
 *
 * - Driver posts: road updates, fuel prices, load tips, photos
 * - Follow/following feed
 * - Comments, reactions (🚛💰⭐🔥✅)
 * - Trending topics
 * - Road conditions & weigh station alerts
 * - Driver badges
 */

import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';

type ReactionType = '🚛' | '💰' | '⭐' | '🔥' | '✅';
const REACTIONS: ReactionType[] = ['🚛', '💰', '⭐', '🔥', '✅'];

type PostType = 'tip' | 'alert' | 'fuel' | 'general' | 'weigh_station';
type BadgeType = 'Top Earner' | 'Million Miler' | 'Safety Pro' | 'On Time' | 'Road Warrior';

interface DriverPost {
  id: string;
  authorName: string;
  authorBadge?: BadgeType;
  authorCity: string;
  authorState: string;
  type: PostType;
  content: string;
  timeAgo: string;
  reactions: Record<ReactionType, number>;
  myReaction: ReactionType | null;
  commentCount: number;
  locationTag?: string;
}

const SEED_POSTS: DriverPost[] = [
  {
    id: 'p1',
    authorName: 'Marcus J.',
    authorBadge: 'Million Miler',
    authorCity: 'Dallas',
    authorState: 'TX',
    type: 'tip',
    content: 'Pro tip: always negotiate above the first rate offer. I countered $200 on a Chicago run today and they came up $150. Never leave money on the table 💪',
    timeAgo: '12m ago',
    reactions: { '🚛': 24, '💰': 18, '⭐': 9, '🔥': 31, '✅': 12 },
    myReaction: null,
    commentCount: 7,
  },
  {
    id: 'p2',
    authorName: 'Sandra T.',
    authorBadge: 'Safety Pro',
    authorCity: 'Arlington',
    authorState: 'TX',
    type: 'fuel',
    content: '⛽ Diesel at TA on I-35 near Waco: $3.42/gal. Cheapest I\'ve seen all week. Topped off both tanks!',
    timeAgo: '28m ago',
    reactions: { '🚛': 8, '💰': 42, '⭐': 5, '🔥': 11, '✅': 33 },
    myReaction: null,
    commentCount: 3,
    locationTag: 'Waco, TX · I-35',
  },
  {
    id: 'p3',
    authorName: 'Darnell W.',
    authorBadge: 'Road Warrior',
    authorCity: 'Fort Worth',
    authorState: 'TX',
    type: 'alert',
    content: '⚠️ Construction backup on I-20 EB near Odessa — adding 45 mins. Avoid if you can, take US-80.',
    timeAgo: '1h ago',
    reactions: { '🚛': 19, '💰': 2, '⭐': 4, '🔥': 6, '✅': 28 },
    myReaction: null,
    commentCount: 11,
    locationTag: 'Odessa, TX · I-20 EB',
  },
  {
    id: 'p4',
    authorName: 'Kevin P.',
    authorCity: 'Waco',
    authorState: 'TX',
    type: 'weigh_station',
    content: '⚖️ Weigh station on I-35 SB (Hillsboro) is CLOSED — bypass saved me 20 mins!',
    timeAgo: '2h ago',
    reactions: { '🚛': 14, '💰': 3, '⭐': 7, '🔥': 5, '✅': 19 },
    myReaction: null,
    commentCount: 2,
    locationTag: 'Hillsboro, TX · I-35 SB',
  },
  {
    id: 'p5',
    authorName: 'Tanya R.',
    authorBadge: 'Top Earner',
    authorCity: 'Austin',
    authorState: 'TX',
    type: 'general',
    content: 'Just crossed 95k miles with PHI this year. The load board + AI dispatcher combo is no joke 🏆 If you\'re still booking manually you\'re leaving $$$ on the table.',
    timeAgo: '3h ago',
    reactions: { '🚛': 47, '💰': 39, '⭐': 55, '🔥': 61, '✅': 22 },
    myReaction: null,
    commentCount: 19,
  },
];

const TRENDING = ['#PHILoadBoard', '#FuelPrices', '#I35Alert', '#DryVan', '#RateNegotiation'];

const POST_TYPE_ICON: Record<PostType, string> = {
  tip: '💡',
  alert: '⚠️',
  fuel: '⛽',
  general: '🚛',
  weigh_station: '⚖️',
};

const BADGE_COLORS: Record<BadgeType, string> = {
  'Top Earner': PHI_COLORS.sunshineYellow,
  'Million Miler': '#9BE8FF',
  'Safety Pro': PHI_COLORS.moneyGreen,
  'On Time': '#C7A6FF',
  'Road Warrior': '#FF9F43',
};

export default function DriverFeedScreen() {
  const [posts, setPosts] = useState<DriverPost[]>(SEED_POSTS);
  const [composeVisible, setComposeVisible] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [activeTab, setActiveTab] = useState<'feed' | 'trending' | 'alerts'>('feed');

  const handleReact = (postId: string, reaction: ReactionType) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const already = p.myReaction;
        const newReactions = { ...p.reactions };
        if (already) newReactions[already] = Math.max(0, newReactions[already] - 1);
        if (already !== reaction) newReactions[reaction] = (newReactions[reaction] ?? 0) + 1;
        return {
          ...p,
          reactions: newReactions,
          myReaction: already === reaction ? null : reaction,
        };
      }),
    );
  };

  const handleSubmitPost = () => {
    if (!newPost.trim()) return;
    const post: DriverPost = {
      id: `new-${Date.now()}`,
      authorName: 'You',
      authorCity: 'My Location',
      authorState: 'TX',
      type: 'general',
      content: newPost.trim(),
      timeAgo: 'Just now',
      reactions: { '🚛': 0, '💰': 0, '⭐': 0, '🔥': 0, '✅': 0 },
      myReaction: null,
      commentCount: 0,
    };
    setPosts((prev) => [post, ...prev]);
    setNewPost('');
    setComposeVisible(false);
  };

  const alertPosts = posts.filter((p) => p.type === 'alert' || p.type === 'weigh_station');

  const displayPosts = activeTab === 'alerts' ? alertPosts : posts;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="people-circle" size={22} color={PHI_COLORS.sunshineYellow} />
        <Text style={styles.headerTitle}>Driver Feed</Text>
        <TouchableOpacity style={styles.composeBtn} onPress={() => setComposeVisible(true)}>
          <Ionicons name="create-outline" size={20} color={PHI_COLORS.charcoalBlack} />
        </TouchableOpacity>
      </View>

      {/* Sub-tabs */}
      <View style={styles.subTabRow}>
        {(['feed', 'trending', 'alerts'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.subTab, activeTab === tab && styles.subTabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.subTabText, activeTab === tab && styles.subTabTextActive]}>
              {tab === 'feed' ? '📰 Feed' : tab === 'trending' ? '📈 Trending' : '🚨 Alerts'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'trending' ? (
        <TrendingView topics={TRENDING} />
      ) : (
        <FlatList
          data={displayPosts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.feedContent}
          renderItem={({ item }) => (
            <PostCard post={item} onReact={(r) => handleReact(item.id, r)} />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No alerts right now — roads are clear! 🟢</Text>
          }
        />
      )}

      {/* Compose modal */}
      <Modal
        visible={composeVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setComposeVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Post</Text>
              <TouchableOpacity onPress={() => setComposeVisible(false)}>
                <Ionicons name="close" size={24} color={PHI_COLORS.white} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.composeInput}
              placeholder="Share a tip, fuel price, or road alert…"
              placeholderTextColor="#7F9FCC"
              value={newPost}
              onChangeText={setNewPost}
              multiline
              autoFocus
            />
            <TouchableOpacity
              style={[styles.postBtn, !newPost.trim() && styles.postBtnDisabled]}
              onPress={handleSubmitPost}
              disabled={!newPost.trim()}
            >
              <Text style={styles.postBtnText}>Post to Feed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── PostCard ──────────────────────────────────────────────────────────────────

function PostCard({ post, onReact }: { post: DriverPost; onReact: (r: ReactionType) => void }) {
  const [expanded, setExpanded] = useState(false);
  const totalReactions = Object.values(post.reactions).reduce((s, v) => s + v, 0);

  return (
    <View style={styles.postCard}>
      {/* Author */}
      <View style={styles.postTop}>
        <View style={styles.postAvatar}>
          <Text style={styles.postAvatarText}>{post.authorName.charAt(0)}</Text>
        </View>
        <View style={styles.postAuthorInfo}>
          <View style={styles.postAuthorRow}>
            <Text style={styles.postAuthorName}>{post.authorName}</Text>
            {post.authorBadge && (
              <View style={[styles.badgeChip, { backgroundColor: BADGE_COLORS[post.authorBadge] + '22' }]}>
                <Text style={[styles.badgeText, { color: BADGE_COLORS[post.authorBadge] }]}>
                  {post.authorBadge}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.postMeta}>
            {post.authorCity}, {post.authorState} · {post.timeAgo}
          </Text>
        </View>
        <Text style={styles.postTypeIcon}>{POST_TYPE_ICON[post.type]}</Text>
      </View>

      {/* Content */}
      <Text style={styles.postContent}>{post.content}</Text>

      {/* Location tag */}
      {post.locationTag && (
        <View style={styles.locationTag}>
          <Ionicons name="location-outline" size={12} color="#7F9FCC" />
          <Text style={styles.locationTagText}>{post.locationTag}</Text>
        </View>
      )}

      {/* Reaction totals */}
      {totalReactions > 0 && (
        <Text style={styles.reactionTotal}>{totalReactions} reactions</Text>
      )}

      {/* Reaction buttons */}
      <View style={styles.reactionRow}>
        {REACTIONS.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.reactionBtn, post.myReaction === r && styles.reactionBtnActive]}
            onPress={() => onReact(r)}
          >
            <Text style={styles.reactionEmoji}>{r}</Text>
            {(post.reactions[r] ?? 0) > 0 && (
              <Text style={styles.reactionCount}>{post.reactions[r]}</Text>
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.commentBtn} onPress={() => setExpanded(!expanded)}>
          <Ionicons name="chatbubble-outline" size={14} color="#7F9FCC" />
          <Text style={styles.commentCount}>{post.commentCount}</Text>
        </TouchableOpacity>
      </View>

      {/* Expanded comments placeholder */}
      {expanded && (
        <View style={styles.commentsPlaceholder}>
          <Text style={styles.commentsPlaceholderText}>Comments coming in the next update — stay tuned 🚛</Text>
        </View>
      )}
    </View>
  );
}

// ── TrendingView ──────────────────────────────────────────────────────────────

function TrendingView({ topics }: { topics: string[] }) {
  return (
    <View style={styles.trendingContainer}>
      <Text style={styles.trendingTitle}>Trending in the PHI Community</Text>
      {topics.map((t, i) => (
        <TouchableOpacity key={t} style={styles.trendingRow}>
          <Text style={styles.trendingRank}>#{i + 1}</Text>
          <Text style={styles.trendingTopic}>{t}</Text>
          <Ionicons name="chevron-forward" size={16} color="#29508C" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: PHI_COLORS.royalBlue,
  },
  headerTitle: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '900', flex: 1 },
  composeBtn: {
    backgroundColor: PHI_COLORS.sunshineYellow,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabRow: { flexDirection: 'row', backgroundColor: PHI_COLORS.card, borderBottomWidth: 1, borderBottomColor: '#1B3060' },
  subTab: { flex: 1, padding: 12, alignItems: 'center' },
  subTabActive: { borderBottomWidth: 2, borderBottomColor: PHI_COLORS.sunshineYellow },
  subTabText: { color: '#7F9FCC', fontWeight: '700', fontSize: 13 },
  subTabTextActive: { color: PHI_COLORS.white },
  feedContent: { padding: 12, gap: 12, paddingBottom: 24 },
  emptyText: { color: '#7F9FCC', fontSize: 13, textAlign: 'center', paddingVertical: 32 },
  postCard: { backgroundColor: PHI_COLORS.card, borderRadius: 16, padding: 14, gap: 10 },
  postTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PHI_COLORS.royalBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarText: { color: PHI_COLORS.white, fontWeight: '900', fontSize: 16 },
  postAuthorInfo: { flex: 1 },
  postAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  postAuthorName: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 14 },
  badgeChip: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  postMeta: { color: '#7F9FCC', fontSize: 11, marginTop: 1 },
  postTypeIcon: { fontSize: 18 },
  postContent: { color: '#D7E3FF', fontSize: 14, lineHeight: 20 },
  locationTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationTagText: { color: '#7F9FCC', fontSize: 11 },
  reactionTotal: { color: '#7F9FCC', fontSize: 11 },
  reactionRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#0A1628',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reactionBtnActive: { borderColor: PHI_COLORS.sunshineYellow, backgroundColor: '#1A2B10' },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { color: '#D7E3FF', fontSize: 11, fontWeight: '700' },
  commentBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  commentCount: { color: '#7F9FCC', fontSize: 12 },
  commentsPlaceholder: { backgroundColor: '#0A1628', borderRadius: 10, padding: 10 },
  commentsPlaceholderText: { color: '#7F9FCC', fontSize: 12, textAlign: 'center' },
  // Trending
  trendingContainer: { padding: 16, gap: 10 },
  trendingTitle: { color: PHI_COLORS.white, fontWeight: '900', fontSize: 16, marginBottom: 6 },
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: PHI_COLORS.card,
    borderRadius: 14,
    padding: 14,
  },
  trendingRank: { color: '#7F9FCC', fontWeight: '800', fontSize: 14, width: 24 },
  trendingTopic: { color: PHI_COLORS.sunshineYellow, fontWeight: '800', fontSize: 15, flex: 1 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: PHI_COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 14,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: PHI_COLORS.white, fontWeight: '900', fontSize: 18 },
  composeInput: {
    backgroundColor: '#0A1628',
    borderRadius: 14,
    padding: 14,
    color: PHI_COLORS.white,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#29508C',
  },
  postBtn: {
    backgroundColor: PHI_COLORS.sunshineYellow,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  postBtnDisabled: { backgroundColor: '#29508C' },
  postBtnText: { color: PHI_COLORS.charcoalBlack, fontWeight: '900', fontSize: 15 },
});
