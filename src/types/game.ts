export type NpcStatus = "online" | "guarded" | "suspect" | "offline";
export type ClueStatus = "locked" | "unlocked" | "verified";
export type SpeakerType = "npc" | "player" | "system";
export type MobilePanel = "chat" | "npcs" | "case-file";
export type NpcLyingTendency = "low" | "medium" | "high";

export interface CaseVictim {
  name: string;
  identity: string;
  summary: string;
}

export interface CaseBrief {
  playerRole: string;
  victim: CaseVictim;
  background: string;
  currentSuspects: string[];
  investigationDirections: string[];
}

export interface NpcPersonaProfile {
  id: string;
  name: string;
  identity: string;
  personality: string;
  motive: string;
  hiddenSecret: string;
  caseRelationship: string;
  knownFacts: string[];
  lieStyle: string;
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
  investigationFocus: string;
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

export interface CaseTestimony {
  messageId: string;
  npcId: string;
  npcName: string;
  text: string;
  timestamp: string;
  linkedClueIds: string[];
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
  brief: CaseBrief;
  worldBackground: string;
  relationshipMap: string[];
}

export interface NpcRuntimeState {
  status: NpcStatus;
  trustLevel: number;
}

export interface GameState {
  activeCaseId: string;
  selectedNpcId: string;
  draftMessage: string;
  conversations: Record<string, ChatMessage[]>;
  discoveredClueIds: string[];
  keyTestimonies: CaseTestimony[];
  mobilePanel: MobilePanel;
  casePhase: string;
  npcStates: Record<string, NpcRuntimeState>;
}

export interface CaseBibleNpc extends NpcPersonaProfile {
  role: string;
  status: NpcStatus;
  trustLevel: number;
  accentColor: string;
  avatarSeed: string;
  tagline: string;
  investigationFocus: string;
}

export interface CaseBibleData {
  case: {
    id: string;
    title: string;
    district: string;
    threatLevel: string;
    shortBriefing: string;
    playerRole: string;
    victim: CaseVictim;
    background: string;
    objective: string;
    currentSuspects: string[];
    investigationDirections: string[];
  };
  world: {
    background: string;
    rules: string[];
  };
  relationships: string[];
  truth: {
    culpritId: string;
    summary: string;
    motive: string;
    method: string;
    coverUp: string;
  };
  npcs: CaseBibleNpc[];
}
