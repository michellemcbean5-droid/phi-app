import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type DriverCircleTopic =
  | 'Authority'
  | 'Dispatch'
  | 'Cash Flow'
  | 'Road Conditions'
  | 'Team Driving'
  | 'Safety';

export interface DriverCircleReply {
  id: string;
  authorName: string;
  authorRole: 'Rookie Driver' | 'Mentor Driver' | 'PHI Team';
  body: string;
  createdAt: string;
}

export interface DriverCirclePost {
  id: string;
  authorName: string;
  authorRole: 'Rookie Driver' | 'Mentor Driver' | 'PHI Team';
  topic: DriverCircleTopic;
  body: string;
  createdAt: string;
  replyCount: number;
  helpfulCount: number;
  seekingMentor?: boolean;
  seekingTeamDriver?: boolean;
  isReported?: boolean;
  replies: DriverCircleReply[];
}

export interface DriverCircleDraft {
  body: string;
  topic: DriverCircleTopic;
  seekingMentor: boolean;
  seekingTeamDriver: boolean;
}

export const DRIVER_CIRCLE_GUIDELINES = [
  'Keep phone numbers, exact real-time location, MC credentials, banking details, and rate confirmations out of public posts.',
  'Verify brokers and freight independently. A community post is not a safety, credit, or payment guarantee.',
  'Report scam requests, harassment, or pressure to move money or personal documents outside verified channels.',
];

const createId = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const SYSTEM_POST: DriverCirclePost = {
  id: 'phi-circle-welcome',
  authorName: 'PHI Team',
  authorRole: 'PHI Team',
  topic: 'Safety',
  body: 'Welcome to Driver’s Circle. Ask clear questions, protect sensitive business information, and independently verify every freight or broker offer before you act.',
  createdAt: '2026-08-19T00:00:00.000Z',
  replyCount: 0,
  helpfulCount: 0,
  replies: [],
};

interface DriverCircleState {
  posts: DriverCirclePost[];
  blockedAuthorNames: string[];
  createPost: (draft: DriverCircleDraft, authorName?: string) => void;
  addReply: (postId: string, body: string, authorName?: string) => void;
  markHelpful: (postId: string) => void;
  reportPost: (postId: string) => void;
  blockAuthor: (authorName: string) => void;
}

const useDriverCircleStore = create<DriverCircleState>()(
  persist(
    (set) => ({
      posts: [SYSTEM_POST],
      blockedAuthorNames: [],
      createPost: (draft, authorName = 'Driver') =>
        set((state) => ({
          posts: [
            {
              id: createId('circle-post'),
              authorName: authorName.trim() || 'Driver',
              authorRole: draft.seekingMentor || draft.seekingTeamDriver ? 'Rookie Driver' : 'Rookie Driver',
              topic: draft.topic,
              body: draft.body.trim(),
              createdAt: new Date().toISOString(),
              replyCount: 0,
              helpfulCount: 0,
              seekingMentor: draft.seekingMentor,
              seekingTeamDriver: draft.seekingTeamDriver,
              replies: [],
            },
            ...state.posts,
          ],
        })),
      addReply: (postId, body, authorName = 'Driver') =>
        set((state) => ({
          posts: state.posts.map((post) => {
            if (post.id !== postId) return post;
            const reply: DriverCircleReply = {
              id: createId('circle-reply'),
              authorName: authorName.trim() || 'Driver',
              authorRole: 'Rookie Driver',
              body: body.trim(),
              createdAt: new Date().toISOString(),
            };
            return {
              ...post,
              replies: [...post.replies, reply],
              replyCount: post.replyCount + 1,
            };
          }),
        })),
      markHelpful: (postId) =>
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === postId ? { ...post, helpfulCount: post.helpfulCount + 1 } : post,
          ),
        })),
      reportPost: (postId) =>
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === postId ? { ...post, isReported: true } : post,
          ),
        })),
      blockAuthor: (authorName) =>
        set((state) => ({
          blockedAuthorNames: state.blockedAuthorNames.includes(authorName)
            ? state.blockedAuthorNames
            : [...state.blockedAuthorNames, authorName],
        })),
    }),
    {
      name: 'phi_driver_circle_store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        posts: state.posts,
        blockedAuthorNames: state.blockedAuthorNames,
      }),
    },
  ),
);

export default useDriverCircleStore;
