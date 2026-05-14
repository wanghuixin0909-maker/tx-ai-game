export type NpcStatus = "online" | "guarded" | "suspect" | "offline";
export type ClueStatus = "locked" | "unlocked" | "verified";
export type SpeakerType = "npc" | "player" | "system";
export type MobilePanel = "chat" | "npcs" | "clues";
export type NpcLyingTendency = "low" | "medium" | "high";

export interface NpcPersonaProfile {
  id: string;
  name: string;
  identity: string;
  personality: string;
  hiddenSecret: string;
  caseRelationship: string;
  isTrueCulprit: boolean;
  lyingTendency: NpcLyingTendency;
}

export interface Npc {
  id: string;
  name: string;
  role: string;
  status: NpcStatus;
  trustLevel: number;
  accentColor: string;
  tagline: string;
  avatarSeed: string;
}

export interface ChatMessage {
  id: string;
  speakerId: string;
  speakerType: SpeakerType;
  text: string;
  timestamp: string;
  unlockClueIds?: string[];
}

export interface Clue {
  id: string;
  title: string;
  summary: string;
  category: string;
  sourceNpcId: string;
  status: ClueStatus;
}

export interface CaseMeta {
  id: string;
  title: string;
  phase: string;
  district: string;
  threatLevel: string;
  briefing: string;
  objective: string;
}

export interface GameState {
  activeCaseId: string;
  selectedNpcId: string;
  draftMessage: string;
  conversations: Record<string, ChatMessage[]>;
  discoveredClueIds: string[];
  mobilePanel: MobilePanel;
}
