import type {
  CaseTestimony,
  ChatMessage,
  GameState,
  NpcRuntimeState,
  NpcStatus,
} from "../types/game";

const CASE_LIBRARY_STORAGE_KEY = "neon-echo-case-library-v1";
const LEGACY_STORAGE_KEY = "neon-echo-local-memory-v1";
const LEGACY_CASE_FILE_STORAGE_KEY = "neon-echo-case-file-v3";
const LEGACY_RECENT_CHAT_STORAGE_KEY = "neon-echo-recent-chat-v3";
const LEGACY_GAME_STATE_STORAGE_KEY = "neon-echo-game-state-v2";

const validSpeakerTypes = new Set(["npc", "player", "system"]);
const validNpcStatuses = new Set<NpcStatus>(["online", "guarded", "suspect", "offline"]);

export const MAX_RECENT_MESSAGES_PER_NPC = 18;
export const MAX_CASE_TESTIMONIES = 12;

type PersistedCaseMemory = Pick<
  GameState,
  | "activeCaseId"
  | "selectedNpcId"
  | "conversations"
  | "discoveredClueIds"
  | "keyTestimonies"
  | "casePhase"
  | "npcStates"
>;

type PersistedGameStateMessage = ChatMessage & {
  conversationNpcId: string;
};

type MinimalPersistedGameState = {
  messages: PersistedGameStateMessage[];
};

type PersistedCaseLibrary = {
  selectedCaseId?: string;
  cases?: Record<string, unknown>;
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

function parseCaseLibrary(): PersistedCaseLibrary {
  const parsed = parseStorageItem(CASE_LIBRARY_STORAGE_KEY);
  return isRecord(parsed) ? (parsed as PersistedCaseLibrary) : {};
}

function writeCaseLibrary(library: PersistedCaseLibrary) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CASE_LIBRARY_STORAGE_KEY, JSON.stringify(library));
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

function sanitizeConversationsFromMinimalState(
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

function createDefaultMemory(defaultMemory: PersistedCaseMemory): PersistedCaseMemory {
  return {
    ...defaultMemory,
    conversations: cloneConversations(defaultMemory.conversations),
    discoveredClueIds: [...defaultMemory.discoveredClueIds],
    keyTestimonies: cloneTestimonies(defaultMemory.keyTestimonies),
    npcStates: sanitizeNpcStates(defaultMemory.npcStates, defaultMemory.npcStates),
  };
}

function sanitizePersistedCaseMemory(
  source: unknown,
  defaultMemory: PersistedCaseMemory,
  validNpcIds: string[],
  validClueIds: string[],
): PersistedCaseMemory {
  const candidate = isRecord(source) ? source : {};
  const validNpcIdSet = new Set(validNpcIds);
  const validClueIdSet = new Set(validClueIds);

  return {
    activeCaseId:
      typeof candidate.activeCaseId === "string" && candidate.activeCaseId
        ? candidate.activeCaseId
        : defaultMemory.activeCaseId,
    selectedNpcId:
      typeof candidate.selectedNpcId === "string" && validNpcIdSet.has(candidate.selectedNpcId)
        ? candidate.selectedNpcId
        : defaultMemory.selectedNpcId,
    conversations: sanitizeConversations(
      candidate.conversations,
      defaultMemory.conversations,
      validNpcIds,
      validClueIdSet,
    ),
    discoveredClueIds: sanitizeDiscoveredClueIds(
      candidate.discoveredClueIds,
      defaultMemory.discoveredClueIds,
      validClueIdSet,
    ),
    keyTestimonies:
      sanitizeKeyTestimonies(candidate.keyTestimonies, validNpcIdSet, validClueIdSet) ??
      cloneTestimonies(defaultMemory.keyTestimonies),
    casePhase:
      typeof candidate.casePhase === "string" && candidate.casePhase.trim()
        ? candidate.casePhase
        : defaultMemory.casePhase,
    npcStates: sanitizeNpcStates(candidate.npcStates, defaultMemory.npcStates),
  };
}

function createMinimalPersistedGameState(
  memory: PersistedCaseMemory,
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

function createSnapshot(memory: PersistedCaseMemory): PersistedCaseMemory {
  return {
    activeCaseId: memory.activeCaseId,
    selectedNpcId: memory.selectedNpcId,
    conversations: Object.fromEntries(
      Object.entries(memory.conversations).map(([npcId, messages]) => [npcId, trimMessages(messages)]),
    ),
    discoveredClueIds: Array.from(new Set(memory.discoveredClueIds)),
    keyTestimonies: cloneTestimonies(memory.keyTestimonies.slice(-MAX_CASE_TESTIMONIES)),
    casePhase: memory.casePhase,
    npcStates: sanitizeNpcStates(memory.npcStates, memory.npcStates),
  };
}

function loadLegacyMemory(
  defaultMemory: PersistedCaseMemory,
  validNpcIds: string[],
  validClueIds: string[],
): PersistedCaseMemory | null {
  const caseFileMemory = parseStorageItem(LEGACY_CASE_FILE_STORAGE_KEY);
  const recentChatMemory = parseStorageItem(LEGACY_RECENT_CHAT_STORAGE_KEY);
  const minimalGameState = parseStorageItem(LEGACY_GAME_STATE_STORAGE_KEY);
  const legacyMemory = parseStorageItem(LEGACY_STORAGE_KEY);

  if (!caseFileMemory && !recentChatMemory && !minimalGameState && !legacyMemory) {
    return null;
  }

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
    sanitizeConversationsFromMinimalState(
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

function clearLegacyStorage() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LEGACY_CASE_FILE_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_RECENT_CHAT_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_GAME_STATE_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function loadSelectedCaseId(defaultCaseId: string, validCaseIds: string[]) {
  if (typeof window === "undefined") {
    return defaultCaseId;
  }

  const storedCaseId = parseCaseLibrary().selectedCaseId;
  return typeof storedCaseId === "string" && validCaseIds.includes(storedCaseId)
    ? storedCaseId
    : defaultCaseId;
}

export function saveSelectedCaseId(caseId: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const library = parseCaseLibrary();
    writeCaseLibrary({
      ...library,
      selectedCaseId: caseId,
      cases: isRecord(library.cases) ? library.cases : {},
    });
  } catch {
    // Ignore storage failures so gameplay is not interrupted.
  }
}

export function loadCaseMemory(
  caseId: string,
  defaultMemory: PersistedCaseMemory,
  validNpcIds: string[],
  validClueIds: string[],
): PersistedCaseMemory {
  if (typeof window === "undefined") {
    return createDefaultMemory(defaultMemory);
  }

  const library = parseCaseLibrary();
  const storedCases = isRecord(library.cases) ? library.cases : {};
  const storedCaseMemory = storedCases[caseId];

  if (storedCaseMemory) {
    return sanitizePersistedCaseMemory(storedCaseMemory, defaultMemory, validNpcIds, validClueIds);
  }

  const legacyMemory = loadLegacyMemory(defaultMemory, validNpcIds, validClueIds);
  return legacyMemory?.activeCaseId === caseId
    ? legacyMemory
    : createDefaultMemory(defaultMemory);
}

export function saveCaseMemory(caseId: string, memory: PersistedCaseMemory) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const library = parseCaseLibrary();
    const storedCases = isRecord(library.cases) ? library.cases : {};
    const snapshot = createSnapshot(memory);

    writeCaseLibrary({
      selectedCaseId: caseId,
      cases: {
        ...storedCases,
        [caseId]: snapshot,
      },
    });

    window.localStorage.setItem(
      `${CASE_LIBRARY_STORAGE_KEY}:${caseId}:messages`,
      JSON.stringify(createMinimalPersistedGameState(snapshot)),
    );
    clearLegacyStorage();
  } catch {
    // Ignore storage failures so gameplay is not interrupted.
  }
}

export function clearCaseMemory(caseId: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const library = parseCaseLibrary();
    const storedCases = { ...(isRecord(library.cases) ? library.cases : {}) };
    delete storedCases[caseId];

    writeCaseLibrary({
      ...library,
      cases: storedCases,
    });

    window.localStorage.removeItem(`${CASE_LIBRARY_STORAGE_KEY}:${caseId}:messages`);
    clearLegacyStorage();
  } catch {
    // Ignore storage failures so gameplay is not interrupted.
  }
}
