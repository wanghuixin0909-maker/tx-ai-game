export type NpcStatus = "online" | "guarded" | "suspect" | "offline";
export type ClueStatus = "locked" | "unlocked" | "verified";
export type SpeakerType = "npc" | "player" | "system";
export type MobilePanel = "chat" | "npcs" | "case-file";
export type NpcLyingTendency = "low" | "medium" | "high";
export type AccusationVerdict =
  | "insufficient-evidence"
  | "case-resolved"
  | "false-accusation";

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

export interface CaseTruth {
  culpritId: string;
  summary: string;
  motive: string;
  method?: string;
  coverUp: string;
}

export interface CaseAccusationConfig {
  requiredClueIds: string[];
  suspectEvidenceMap: Record<string, string[]>;
  successArchiveLines: string[];
  failureArchiveLines: string[];
}

export interface CaseCategory {
  id: string;
  label: string;
  description: string;
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

export interface AccusationCheckResult {
  suspectId: string;
  verdict: AccusationVerdict;
  isCorrect: boolean;
  requiredClueIds: string[];
  missingClueIds: string[];
}

export interface SuspectInsight {
  suspectId: string;
  suspicionLabel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  matchedEvidenceCount: number;
  matchedEvidenceIds: string[];
}

export interface CaseScore {
  clueCompleteness: number;
  interrogationEfficiency: number;
  deductionAccuracy: number;
  overall: number;
}

export interface EndingState {
  suspectId: string;
  verdict: AccusationVerdict;
  score: CaseScore;
  aiLines: string[];
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

export interface CaseDefinition {
  id: string;
  categoryId: string;
  difficulty: string;
  estimatedMinutes: number;
  selectionSummary: string;
  tags: string[];
  remoteSupport: boolean;
  caseFile: CaseMeta;
  truth: CaseTruth;
  accusation: CaseAccusationConfig;
  npcs: Npc[];
  clues: Clue[];
  initialConversations: Record<string, ChatMessage[]>;
  scriptedReplies: Record<string, ChatMessage[]>;
  starterClueIds: string[];
  suggestedPrompts: Record<string, string[]>;
}
