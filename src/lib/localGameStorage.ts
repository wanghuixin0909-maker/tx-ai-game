import type {
  CaseTestimony,
  ChatMessage,
  GameState,
  NpcRuntimeState,
  NpcStatus,
} from "../types/game";

const LEGACY_STORAGE_KEY = "neon-echo-local-memory-v1";
const CASE_FILE_STORAGE_KEY = "neon-echo-case-file-v3";
const RECENT_CHAT_STORAGE_KEY = "neon-echo-recent-chat-v3";
const GAME_STATE_STORAGE_KEY = "neon-echo-game-state-v2";
const validSpeakerTypes = new Set(["npc", "player", "system"]);
const validNpcStatuses = new Set<NpcStatus>(["online", "guarded", "suspect", "offline"]);

export const MAX_RECENT_MESSAGES_PER_NPC = 18;
export const MAX_CASE_TESTIMONIES = 12;

type PersistedCaseFileMemory = Pick<
  GameState,
  "activeCaseId" | "discoveredClueIds" | "casePhase" | "keyTestimonies"
>;

type PersistedRecentChatMemory = Pick<
  GameState,
  "selectedNpcId" | "conversations" | "npcStates"
>;

type PersistedGameMemory = PersistedCaseFileMemory & PersistedRecentChatMemory;

type PersistedGameStateMessage = ChatMessage & {
  conversationNpcId: string;
};

type MinimalPersistedGameState = {
  messages: PersistedGameStateMessage[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function cloneMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    ...message,
    unlockClueIds: message.unlockClueIds ? [...message.unlockClueIds] : undefined,
  }));
}

function cloneConversations(
  conversations: Record<string, ChatMessage[]>,
): Record<string, ChatMessage[]> {
  return Object.fromEntries(
    Object.entries(conversations).map(([npcId, messages]) => [npcId, cloneMessages(messages)]),
  );
}

function cloneTestimonies(testimonies: CaseTestimony[]): CaseTestimony[] {
  return testimonies.map((testimony) => ({
    ...testimony,
    linkedClueIds: [...testimony.linkedClueIds],
  }));
}

function trimMessages(messages: ChatMessage[]): ChatMessage[] {
  return cloneMessages(messages.slice(-MAX_RECENT_MESSAGES_PER_NPC));
}

function createMinimalPersistedGameState(
  memory: PersistedRecentChatMemory,
): MinimalPersistedGameState {
  return {
    messages: Object.entries(memory.conversations).flatMap(([npcId, messages]) =>
      trimMessages(messages).map((message) => ({
        ...message,
        conversationNpcId: npcId,
      })),
    ),
  };
}

function createDefaultMemory(defaultMemory: PersistedGameMemory): PersistedGameMemory {
  return {
    ...defaultMemory,
    conversations: cloneConversations(defaultMemory.conversations),
    discoveredClueIds: [...defaultMemory.discoveredClueIds],
    keyTestimonies: cloneTestimonies(defaultMemory.keyTestimonies),
    npcStates: sanitizeNpcStates(defaultMemory.npcStates, defaultMemory.npcStates),
  };
}

function parseStorageItem(key: string): unknown {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(key);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as unknown;
  } catch {
    return null;
  }
}

function sanitizeChatMessage(value: unknown, validClueIds: Set<string>): ChatMessage | null {
  if (!isRecord(value)) {
    return null;
  }

  const { id, speakerId, speakerType, text, timestamp, unlockClueIds } = value;

  if (
    typeof id !== "string" ||
    typeof speakerId !== "string" ||
    typeof speakerType !== "string" ||
    !validSpeakerTypes.has(speakerType) ||
    typeof text !== "string" ||
    typeof timestamp !== "string"
  ) {
    return null;
  }

  const sanitizedUnlockClueIds = Array.isArray(unlockClueIds)
    ? Array.from(
        new Set(
          unlockClueIds.filter(
            (clueId): clueId is string => typeof clueId === "string" && validClueIds.has(clueId),
          ),
        ),
      )
    : undefined;

  return {
    id,
    speakerId,
    speakerType: speakerType as ChatMessage["speakerType"],
    text,
    timestamp,
    unlockClueIds: sanitizedUnlockClueIds?.length ? sanitizedUnlockClueIds : undefined,
  };
}

function sanitizeCaseTestimony(
  value: unknown,
  validNpcIds: Set<string>,
  validClueIds: Set<string>,
): CaseTestimony | null {
  if (!isRecord(value)) {
    return null;
  }

  const { messageId, npcId, npcName, text, timestamp, linkedClueIds } = value;

  if (
    typeof messageId !== "string" ||
    typeof npcId !== "string" ||
    !validNpcIds.has(npcId) ||
    typeof npcName !== "string" ||
    typeof text !== "string" ||
    typeof timestamp !== "string" ||
    !Array.isArray(linkedClueIds)
  ) {
    return null;
  }

  const sanitizedClueIds = Array.from(
    new Set(
      linkedClueIds.filter(
        (clueId): clueId is string => typeof clueId === "string" && validClueIds.has(clueId),
      ),
    ),
  );

  if (!sanitizedClueIds.length) {
    return null;
  }

  return {
    messageId,
    npcId,
    npcName,
    text,
    timestamp,
    linkedClueIds: sanitizedClueIds,
  };
}

function sanitizeNpcStates(
  value: unknown,
  defaultNpcStates: Record<string, NpcRuntimeState>,
): Record<string, NpcRuntimeState> {
  if (!isRecord(value)) {
    return { ...defaultNpcStates };
  }

  return Object.fromEntries(
    Object.entries(defaultNpcStates).map(([npcId, defaultState]) => {
      const candidate = value[npcId];

      if (!isRecord(candidate)) {
        return [npcId, { ...defaultState }];
      }

      const { status, trustLevel } = candidate;

      if (
        typeof status !== "string" ||
        !validNpcStatuses.has(status as NpcStatus) ||
        typeof trustLevel !== "number" ||
        Number.isNaN(trustLevel)
      ) {
        return [npcId, { ...defaultState }];
      }

      return [
        npcId,
        {
          status: status as NpcStatus,
          trustLevel: Math.max(0, Math.min(100, Math.round(trustLevel))),
        },
      ];
    }),
  );
}

function sanitizeConversations(
  value: unknown,
  defaultConversations: Record<string, ChatMessage[]>,
  validNpcIds: string[],
  validClueIds: Set<string>,
): Record<string, ChatMessage[]> {
  const storedConversations = isRecord(value) ? value : {};
  const conversations = cloneConversations(defaultConversations);

  validNpcIds.forEach((npcId) => {
    const messages = storedConversations[npcId];

    if (!Array.isArray(messages)) {
      return;
    }

    conversations[npcId] = trimMessages(
      messages
        .map((message) => sanitizeChatMessage(message, validClueIds))
        .filter((message): message is ChatMessage => message !== null),
    );
  });

  return conversations;
}

function sanitizeConversationsFromGameState(
  value: unknown,
  defaultConversations: Record<string, ChatMessage[]>,
  validNpcIds: string[],
  validClueIds: Set<string>,
): Record<string, ChatMessage[]> | null {
  if (!isRecord(value) || !Array.isArray(value.messages)) {
    return null;
  }

  const validNpcIdSet = new Set(validNpcIds);
  const groupedMessages: Record<string, ChatMessage[]> = {};

  value.messages.forEach((candidate) => {
    if (!isRecord(candidate)) {
      return;
    }

    const conversationNpcId = candidate.conversationNpcId;

    if (typeof conversationNpcId !== "string" || !validNpcIdSet.has(conversationNpcId)) {
      return;
    }

    const sanitizedMessage = sanitizeChatMessage(candidate, validClueIds);

    if (!sanitizedMessage) {
      return;
    }

    groupedMessages[conversationNpcId] = [
      ...(groupedMessages[conversationNpcId] ?? []),
      sanitizedMessage,
    ];
  });

  const conversations = cloneConversations(defaultConversations);

  Object.entries(groupedMessages).forEach(([npcId, messages]) => {
    conversations[npcId] = trimMessages(messages);
  });

  return conversations;
}

function sanitizeDiscoveredClueIds(
  value: unknown,
  defaultClueIds: string[],
  validClueIds: Set<string>,
): string[] {
  const discoveredClueIds = Array.isArray(value)
    ? Array.from(
        new Set(
          value.filter(
            (clueId): clueId is string => typeof clueId === "string" && validClueIds.has(clueId),
          ),
        ),
      )
    : [...defaultClueIds];

  return discoveredClueIds.length > 0 ? discoveredClueIds : [...defaultClueIds];
}

function sanitizeKeyTestimonies(
  value: unknown,
  validNpcIds: Set<string>,
  validClueIds: Set<string>,
): CaseTestimony[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const testimonies = value
    .map((testimony) => sanitizeCaseTestimony(testimony, validNpcIds, validClueIds))
    .filter((testimony): testimony is CaseTestimony => testimony !== null);

  const deduped = testimonies.reduce<CaseTestimony[]>((collected, testimony) => {
    if (collected.some((item) => item.messageId === testimony.messageId)) {
      return collected;
    }

    return [...collected, testimony];
  }, []);

  return cloneTestimonies(deduped.slice(-MAX_CASE_TESTIMONIES));
}

export function loadGameMemory(
  defaultMemory: PersistedGameMemory,
  validNpcIds: string[],
  validClueIds: string[],
): PersistedGameMemory {
  if (typeof window === "undefined") {
    return createDefaultMemory(defaultMemory);
  }

  const caseFileMemory = parseStorageItem(CASE_FILE_STORAGE_KEY);
  const recentChatMemory = parseStorageItem(RECENT_CHAT_STORAGE_KEY);
  const minimalGameState = parseStorageItem(GAME_STATE_STORAGE_KEY);
  const legacyMemory = parseStorageItem(LEGACY_STORAGE_KEY);

  const caseSource = isRecord(caseFileMemory)
    ? caseFileMemory
    : isRecord(legacyMemory)
      ? legacyMemory
      : null;
  const chatSource = isRecord(recentChatMemory)
    ? recentChatMemory
    : isRecord(legacyMemory)
      ? legacyMemory
      : null;

  const validNpcIdSet = new Set(validNpcIds);
  const validClueIdSet = new Set(validClueIds);
  const conversations =
    sanitizeConversationsFromGameState(
      minimalGameState,
      defaultMemory.conversations,
      validNpcIds,
      validClueIdSet,
    ) ??
    sanitizeConversations(
      chatSource?.conversations,
      defaultMemory.conversations,
      validNpcIds,
      validClueIdSet,
    );

  return {
    activeCaseId:
      typeof caseSource?.activeCaseId === "string" && caseSource.activeCaseId
        ? caseSource.activeCaseId
        : defaultMemory.activeCaseId,
    selectedNpcId:
      typeof chatSource?.selectedNpcId === "string" && validNpcIdSet.has(chatSource.selectedNpcId)
        ? chatSource.selectedNpcId
        : defaultMemory.selectedNpcId,
    conversations,
    discoveredClueIds: sanitizeDiscoveredClueIds(
      caseSource?.discoveredClueIds,
      defaultMemory.discoveredClueIds,
      validClueIdSet,
    ),
    keyTestimonies:
      sanitizeKeyTestimonies(caseSource?.keyTestimonies, validNpcIdSet, validClueIdSet) ??
      cloneTestimonies(defaultMemory.keyTestimonies),
    casePhase:
      typeof caseSource?.casePhase === "string" && caseSource.casePhase.trim()
        ? caseSource.casePhase
        : defaultMemory.casePhase,
    npcStates: sanitizeNpcStates(chatSource?.npcStates, defaultMemory.npcStates),
  };
}

export function saveCaseFileMemory(memory: PersistedCaseFileMemory) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const snapshot: PersistedCaseFileMemory = {
      activeCaseId: memory.activeCaseId,
      discoveredClueIds: Array.from(new Set(memory.discoveredClueIds)),
      casePhase: memory.casePhase,
      keyTestimonies: cloneTestimonies(memory.keyTestimonies.slice(-MAX_CASE_TESTIMONIES)),
    };

    window.localStorage.setItem(CASE_FILE_STORAGE_KEY, JSON.stringify(snapshot));
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Ignore storage failures so gameplay is not interrupted.
  }
}

export function saveRecentChatMemory(memory: PersistedRecentChatMemory) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const snapshot: PersistedRecentChatMemory = {
      selectedNpcId: memory.selectedNpcId,
      conversations: Object.fromEntries(
        Object.entries(memory.conversations).map(([npcId, messages]) => [npcId, trimMessages(messages)]),
      ),
      npcStates: sanitizeNpcStates(memory.npcStates, memory.npcStates),
    };

    window.localStorage.setItem(RECENT_CHAT_STORAGE_KEY, JSON.stringify(snapshot));
    window.localStorage.setItem(
      GAME_STATE_STORAGE_KEY,
      JSON.stringify(createMinimalPersistedGameState(snapshot)),
    );
  } catch {
    // Ignore storage failures so gameplay is not interrupted.
  }
}

export function clearGameMemory() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(CASE_FILE_STORAGE_KEY);
    window.localStorage.removeItem(RECENT_CHAT_STORAGE_KEY);
    window.localStorage.removeItem(GAME_STATE_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Ignore storage failures so gameplay is not interrupted.
  }
}
