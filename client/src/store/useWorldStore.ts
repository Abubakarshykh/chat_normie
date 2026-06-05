import { create } from 'zustand';

export interface NftTrait {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

export interface NormieSummary {
  id: string;
  name: string;
  avatar: string;
  color: string;
  archetype: string;
  traits: string[];
  mood: string;
  stats: { charisma: number; intelligence: number; aggression: number; humor: number; empathy: number };
  reputation: number;
  interests: string[];
  shortTermMemory: string[];
  relationshipCount: number;
  // NFT fields
  tokenId?: number | null;
  nftName?: string | null;
  nftTraits?: NftTrait[];
  imageUrl?: string | null;
}

export interface FeedEvent {
  id: string;
  type: 'conversation' | 'post' | 'drama';
  timestamp: string;
  // conversation
  sender?: { id: string; name: string; avatar: string; color: string; imageUrl?: string | null };
  receiver?: { id: string; name: string; avatar: string; color: string; imageUrl?: string | null };
  senderMessage?: string;
  receiverReply?: string;
  relationshipType?: string;
  forced?: boolean;
  // post
  normie?: { id: string; name: string; avatar: string; color: string; imageUrl?: string | null };
  content?: string;
  // drama
  dramaType?: string;
  label?: string;
  description?: string;
  normie1?: { id: string; name: string; avatar: string; color: string; imageUrl?: string | null };
  normie2?: { id: string; name: string; avatar: string; color: string; imageUrl?: string | null };
  relationshipChange?: { aScore: number; bScore: number; aType: string; bType: string };
}

export interface WorldStats {
  normieCount: number;
  totalFeedEvents: number;
  totalInteractions: number;
  topNormie: { name: string; avatar: string; reputation: number; imageUrl?: string | null } | null;
  simulationTick: number;
  totalNormieSupply?: number | null;
}

interface WorldStore {
  normies: NormieSummary[];
  feed: FeedEvent[];
  stats: WorldStats | null;
  dramaAlert: FeedEvent | null;
  connected: boolean;
  loading: boolean;

  setNormies: (n: NormieSummary[]) => void;
  prependFeedEvent: (e: FeedEvent) => void;
  setFeed: (f: FeedEvent[]) => void;
  setStats: (s: WorldStats) => void;
  setDramaAlert: (e: FeedEvent | null) => void;
  setConnected: (c: boolean) => void;
  setLoading: (l: boolean) => void;
  updateNormieMood: (id: string, mood: string) => void;
}

export const useWorldStore = create<WorldStore>((set) => ({
  normies: [],
  feed: [],
  stats: null,
  dramaAlert: null,
  connected: false,
  loading: true,

  setNormies: (normies) => set({ normies }),
  prependFeedEvent: (event) => set((state) => ({
    feed: [event, ...state.feed].slice(0, 100),
  })),
  setFeed: (feed) => set({ feed }),
  setStats: (stats) => set({ stats }),
  setDramaAlert: (dramaAlert) => set({ dramaAlert }),
  setConnected: (connected) => set({ connected }),
  setLoading: (loading) => set({ loading }),
  updateNormieMood: (id, mood) => set((state) => ({
    normies: state.normies.map(n => n.id === id ? { ...n, mood } : n),
  })),
}));
