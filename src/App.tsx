import { useEffect, useRef, useState } from "react";
import { CaseFilePanel } from "./components/CaseFilePanel";
import { ChatWindow } from "./components/ChatWindow";
import { NpcSidebar } from "./components/NpcSidebar";
import { PlayerInput } from "./components/PlayerInput";
import {
  caseFile,
  clues,
  initialConversations,
  npcs,
  scriptedReplies,
  starterClueIds,
} from "./data/mockGame";
import { ChatApiError, fetchNpcReply } from "./lib/chatApi";
import {
  clearGameMemory,
  loadGameMemory,
  MAX_CASE_TESTIMONIES,
  MAX_RECENT_MESSAGES_PER_NPC,
  saveCaseFileMemory,
  saveRecentChatMemory,
} from "./lib/localGameStorage";
import type {
  CaseTestimony,
  ChatMessage,
  GameState,
  MobilePanel,
  NpcRuntimeState,
} from "./types/game";

const mobilePanels: Array<{ id: MobilePanel; label: string }> = [
  { id: "chat", label: "CHAT" },
  { id: "npcs", label: "NPCS" },
  { id: "case-file", label: "FILE" },
];

const CASE_PHASES = [
  { minClues: clues.length, label: "Phase 05 / Final Reconstruction" },
  { minClues: 5, label: "Phase 04 / 真凶锁定" },
  { minClues: 3, label: "Phase 03 / 证词对照" },
  { minClues: 2, label: "Phase 02 / 嫌疑排查" },
  { minClues: 0, label: "Phase 01 / 案件简报" },
] as const;

const validNpcIds = npcs.map((npc) => npc.id);
const validClueIds = clues.map((clue) => clue.id);
const npcNameById = Object.fromEntries(npcs.map((npc) => [npc.id, npc.name]));

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

function trimConversation(messages: ChatMessage[]): ChatMessage[] {
  return messages.slice(-MAX_RECENT_MESSAGES_PER_NPC);
}

function createInitialNpcStates(): Record<string, NpcRuntimeState> {
  return Object.fromEntries(
    npcs.map((npc) => [
      npc.id,
      {
        status: npc.status,
        trustLevel: npc.trustLevel,
      },
    ]),
  );
}

function getCasePhase(discoveredCount: number): string {
  return (
    CASE_PHASES.find((phase) => discoveredCount >= phase.minClues)?.label
    ?? "Phase 01 / 案件简报"
  );
}

function createKeyTestimony(message: ChatMessage): CaseTestimony | null {
  if (message.speakerType !== "npc" || !message.unlockClueIds?.length) {
    return null;
  }

  const npcName = npcNameById[message.speakerId];

  if (!npcName) {
    return null;
  }

  return {
    messageId: message.id,
    npcId: message.speakerId,
    npcName,
    text: message.text,
    timestamp: message.timestamp,
    linkedClueIds: Array.from(new Set(message.unlockClueIds)),
  };
}

function appendKeyTestimony(
  testimonies: CaseTestimony[],
  testimony: CaseTestimony | null,
): CaseTestimony[] {
  if (!testimony || testimonies.some((item) => item.messageId === testimony.messageId)) {
    return testimonies;
  }

  return [...testimonies, testimony].slice(-MAX_CASE_TESTIMONIES);
}

function buildKeyTestimoniesFromConversations(
  conversations: Record<string, ChatMessage[]>,
): CaseTestimony[] {
  let testimonies: CaseTestimony[] = [];

  npcs.forEach((npc) => {
    (conversations[npc.id] ?? []).forEach((message) => {
      testimonies = appendKeyTestimony(testimonies, createKeyTestimony(message));
    });
  });

  return testimonies;
}

function mergeKeyTestimonies(
  storedTestimonies: CaseTestimony[],
  derivedTestimonies: CaseTestimony[],
): CaseTestimony[] {
  return derivedTestimonies.reduce(
    (collected, testimony) => appendKeyTestimony(collected, testimony),
    [...storedTestimonies],
  );
}

function createInitialGameState(): GameState {
  const conversations = cloneConversations(initialConversations);
  const discoveredClueIds = [...starterClueIds];

  return {
    activeCaseId: caseFile.id,
    selectedNpcId: npcs[0].id,
    draftMessage: "",
    conversations,
    discoveredClueIds,
    keyTestimonies: buildKeyTestimoniesFromConversations(conversations),
    mobilePanel: "chat",
    casePhase: getCasePhase(discoveredClueIds.length),
    npcStates: createInitialNpcStates(),
  };
}

function createPersistedCaseFile(gameState: GameState) {
  return {
    activeCaseId: gameState.activeCaseId,
    discoveredClueIds: gameState.discoveredClueIds,
    casePhase: gameState.casePhase,
    keyTestimonies: gameState.keyTestimonies,
  };
}

function createPersistedRecentChats(gameState: GameState) {
  return {
    selectedNpcId: gameState.selectedNpcId,
    conversations: gameState.conversations,
    npcStates: gameState.npcStates,
  };
}

function createPersistedMemory(gameState: GameState) {
  return {
    ...createPersistedCaseFile(gameState),
    ...createPersistedRecentChats(gameState),
  };
}

function createPlayerMessage(text: string): ChatMessage {
  return {
    id: `player-${globalThis.crypto.randomUUID()}`,
    speakerId: "player",
    speakerType: "player",
    text,
    timestamp: new Date().toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
}

function createNpcMessage(
  npcId: string,
  text: string,
  unlockClueIds?: string[],
): ChatMessage {
  return {
    id: `npc-${globalThis.crypto.randomUUID()}`,
    speakerId: npcId,
    speakerType: "npc",
    text,
    timestamp: new Date().toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    unlockClueIds,
  };
}

function createSystemMessage(text: string): ChatMessage {
  return {
    id: `system-${globalThis.crypto.randomUUID()}`,
    speakerId: "system",
    speakerType: "system",
    text,
    timestamp: new Date().toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
}

function appendNpcReplyToState(
  current: GameState,
  npcId: string,
  replyText: string,
  unlockClueIds?: string[],
): GameState {
  const updatedIds = new Set(current.discoveredClueIds);
  unlockClueIds?.forEach((clueId) => updatedIds.add(clueId));

  const npcMessage = createNpcMessage(npcId, replyText, unlockClueIds);

  return {
    ...current,
    conversations: {
      ...current.conversations,
      [npcId]: trimConversation([...(current.conversations[npcId] ?? []), npcMessage]),
    },
    discoveredClueIds: [...updatedIds],
    keyTestimonies: appendKeyTestimony(current.keyTestimonies, createKeyTestimony(npcMessage)),
    casePhase: getCasePhase(updatedIds.size),
  };
}

function getProgressLabel(discoveredCount: number) {
  if (discoveredCount >= 5) {
    return "关键证据已接近闭环";
  }

  if (discoveredCount >= 3) {
    return "嫌疑链正在成形";
  }

  return "先建立案情全貌";
}

export default function App() {
  const persistenceReadyRef = useRef(false);
  const skipCaseFilePersistenceRef = useRef(false);
  const skipRecentChatPersistenceRef = useRef(false);
  const requestEpochRef = useRef(0);

  const [gameState, setGameState] = useState<GameState>(() => {
    const initialState = createInitialGameState();
    const restoredMemory = loadGameMemory(
      createPersistedMemory(initialState),
      validNpcIds,
      validClueIds,
    );
    const conversations = cloneConversations(restoredMemory.conversations);
    const mergedTestimonies = mergeKeyTestimonies(
      restoredMemory.keyTestimonies,
      buildKeyTestimoniesFromConversations(conversations),
    );
    const discoveredClueIds =
      restoredMemory.discoveredClueIds.length > 0
        ? restoredMemory.discoveredClueIds
        : [...starterClueIds];

    return {
      ...initialState,
      ...restoredMemory,
      draftMessage: "",
      conversations,
      discoveredClueIds,
      keyTestimonies: mergedTestimonies,
      mobilePanel: "chat",
      casePhase: getCasePhase(discoveredClueIds.length),
    };
  });
  const [pendingNpcIds, setPendingNpcIds] = useState<string[]>([]);

  useEffect(() => {
    if (!persistenceReadyRef.current) {
      return;
    }

    if (skipCaseFilePersistenceRef.current) {
      skipCaseFilePersistenceRef.current = false;
      return;
    }

    saveCaseFileMemory(createPersistedCaseFile(gameState));
  }, [
    gameState.activeCaseId,
    gameState.casePhase,
    gameState.discoveredClueIds,
    gameState.keyTestimonies,
  ]);

  useEffect(() => {
    if (!persistenceReadyRef.current) {
      return;
    }

    if (skipRecentChatPersistenceRef.current) {
      skipRecentChatPersistenceRef.current = false;
      return;
    }

    saveRecentChatMemory(createPersistedRecentChats(gameState));
  }, [gameState.conversations, gameState.npcStates]);

  useEffect(() => {
    persistenceReadyRef.current = true;
  }, []);

  const runtimeNpcs = npcs.map((npc) => ({
    ...npc,
    ...(gameState.npcStates[npc.id] ?? {
      status: npc.status,
      trustLevel: npc.trustLevel,
    }),
  }));
  const activeNpc =
    runtimeNpcs.find((npc) => npc.id === gameState.selectedNpcId) ?? runtimeNpcs[0];
  const activeCaseFile = {
    ...caseFile,
    id: gameState.activeCaseId,
    phase: gameState.casePhase,
  };
  const activeMessages = gameState.conversations[activeNpc.id] ?? [];

  const handleSendMessage = async () => {
    const trimmed = gameState.draftMessage.trim();
    const npcId = activeNpc.id;

    if (!trimmed || pendingNpcIds.includes(npcId)) {
      return;
    }

    const requestEpoch = requestEpochRef.current;
    const playerMessage = createPlayerMessage(trimmed);
    const currentConversation = gameState.conversations[npcId] ?? [];
    const currentPlayerTurns = currentConversation.filter(
      (message) => message.speakerType === "player",
    ).length;
    const replyPool = scriptedReplies[npcId] ?? [];
    const scriptedReply =
      replyPool.length > 0 ? replyPool[currentPlayerTurns % replyPool.length] : undefined;

    setGameState((current) => ({
      ...current,
      draftMessage: "",
      conversations: {
        ...current.conversations,
        [npcId]: trimConversation([...(current.conversations[npcId] ?? []), playerMessage]),
      },
    }));
    setPendingNpcIds((current) => [...current, npcId]);

    try {
      const response = await fetchNpcReply({
        npcId,
        playerMessage: trimmed,
      });

      if (requestEpoch !== requestEpochRef.current) {
        return;
      }

      setGameState((current) =>
        appendNpcReplyToState(
          current,
          npcId,
          response.reply,
          scriptedReply?.unlockClueIds,
        ),
      );
    } catch (error) {
      if (requestEpoch !== requestEpochRef.current) {
        return;
      }

      const fallbackMessage =
        error instanceof ChatApiError
          ? `Backend request failed: ${error.message}`
          : "Backend request failed. Please try again in a moment.";

      setGameState((current) => ({
        ...current,
        conversations: {
          ...current.conversations,
          [npcId]: trimConversation([
            ...(current.conversations[npcId] ?? []),
            createSystemMessage(fallbackMessage),
          ]),
        },
      }));
    } finally {
      if (requestEpoch !== requestEpochRef.current) {
        return;
      }

      setPendingNpcIds((current) => current.filter((item) => item !== npcId));
    }
  };

  const handleResetGame = () => {
    if (!window.confirm("Reset Case and clear saved clues, testimony, and recent chats?")) {
      return;
    }

    requestEpochRef.current += 1;
    skipCaseFilePersistenceRef.current = true;
    skipRecentChatPersistenceRef.current = true;
    clearGameMemory();
    setPendingNpcIds([]);
    setGameState(createInitialGameState());
  };

  const selectNpc = (npcId: string) => {
    setGameState((current) => ({
      ...current,
      selectedNpcId: npcId,
      mobilePanel: "chat",
    }));
  };

  const progressLabel = getProgressLabel(gameState.discoveredClueIds.length);
  const pendingActiveNpc = pendingNpcIds.includes(activeNpc.id);

  return (
    <main className="relative h-screen overflow-hidden px-3 py-4 text-slate-50 sm:px-5 sm:py-5 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(167,181,200,0.07),_transparent_30%),radial-gradient(circle_at_right,_rgba(132,145,171,0.06),_transparent_24%),linear-gradient(180deg,_rgba(36,48,65,0.5),_rgba(32,40,58,0.34),_rgba(26,34,51,0.12))]" />
      <div className="relative mx-auto flex h-full min-h-0 max-w-[1700px] flex-col gap-4">
        <header className="cyber-panel shrink-0 p-4 sm:p-5">
          <div className="flex flex-col gap-3.5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[#B8C2CF]">
                AI Detective Interface
              </p>
              <h1 className="mt-2.5 text-[2.15rem] font-bold tracking-[0.02em] text-slate-50 sm:text-[2.55rem]">
                NEON ECHO
              </h1>
              <p className="mt-3 hidden max-w-3xl text-[0.92rem] leading-6 text-[#D6DEEA] sm:block sm:text-[0.98rem]">
                你是受董事会密派的独立调查员。首席审计员
                {activeCaseFile.brief.victim.name}
                在断电前 37 秒身亡，你必须在四名关键对象的矛盾证词中找出真正凶手。
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="cyber-card rounded-[22px] px-3 py-2.5">
                <p className="text-[0.64rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                  Active NPC
                </p>
                <p className="mt-1.5 text-sm font-semibold text-[#E2E8F0] sm:text-base">
                  {activeNpc.name}
                </p>
                <p className="mt-1 hidden text-[0.74rem] leading-5 text-[#D6DEEA] sm:block sm:text-sm">
                  {activeNpc.role}
                </p>
              </div>
              <div className="cyber-card rounded-[22px] px-3 py-2.5">
                <p className="text-[0.64rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                  Clues Recovered
                </p>
                <p className="mt-1.5 text-sm font-semibold text-[#E2E8F0] sm:text-base">
                  {gameState.discoveredClueIds.length}/{clues.length}
                </p>
                <p className="mt-1 hidden text-[0.74rem] leading-5 text-[#D6DEEA] sm:block sm:text-sm">
                  {progressLabel}
                </p>
              </div>
              <div className="cyber-card rounded-[22px] px-3 py-2.5">
                <p className="text-[0.64rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                  Victim
                </p>
                <p className="mt-1.5 text-sm font-semibold text-[#E2E8F0] sm:text-base">
                  {activeCaseFile.brief.victim.name}
                </p>
                <p className="mt-1 hidden text-[0.74rem] leading-5 text-[#D6DEEA] sm:block sm:text-sm">
                  {activeCaseFile.brief.victim.identity}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="shrink-0 xl:hidden">
          <div className="cyber-panel flex items-center gap-2 p-2">
            {mobilePanels.map((panel) => {
              const active = gameState.mobilePanel === panel.id;

              return (
                <button
                  key={panel.id}
                  type="button"
                  onClick={() =>
                    setGameState((current) => ({ ...current, mobilePanel: panel.id }))
                  }
                  className={`terminal-tab flex-1 rounded-2xl px-4 py-2.5 text-xs font-medium tracking-[0.14em] ${
                    active ? "is-active" : ""
                  }`}
                >
                  {panel.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-3.5 overflow-hidden lg:hidden">
          <div className={gameState.mobilePanel === "npcs" ? "min-h-0 block" : "hidden"}>
            <NpcSidebar
              npcs={runtimeNpcs}
              selectedNpcId={gameState.selectedNpcId}
              conversations={gameState.conversations}
              onSelect={selectNpc}
            />
          </div>

          <div
            className={`${gameState.mobilePanel === "chat" ? "flex" : "hidden"} min-h-0 flex-1 flex-col gap-3.5 overflow-hidden`}
          >
            <ChatWindow
              activeNpc={activeNpc}
              messages={activeMessages}
            />
            <PlayerInput
              draftMessage={gameState.draftMessage}
              onDraftChange={(draftMessage) =>
                setGameState((current) => ({ ...current, draftMessage }))
              }
              onSend={handleSendMessage}
              onReset={handleResetGame}
              disabled={pendingActiveNpc}
              isLoading={pendingActiveNpc}
            />
          </div>

          <div className={gameState.mobilePanel === "case-file" ? "min-h-0 block" : "hidden"}>
            <CaseFilePanel
              caseFile={activeCaseFile}
              clues={clues}
              npcs={runtimeNpcs}
              discoveredClueIds={gameState.discoveredClueIds}
              keyTestimonies={gameState.keyTestimonies}
              progressLabel={progressLabel}
            />
          </div>
        </div>

        <div className="hidden min-h-0 flex-1 gap-3.5 overflow-hidden lg:grid lg:grid-cols-[300px_minmax(0,1fr)_340px] lg:grid-rows-[minmax(0,1fr)]">
          <div className="min-h-0">
            <NpcSidebar
              npcs={runtimeNpcs}
              selectedNpcId={gameState.selectedNpcId}
              conversations={gameState.conversations}
              onSelect={selectNpc}
            />
          </div>

          <div className="min-h-0 flex flex-col gap-3.5 overflow-hidden">
            <ChatWindow
              activeNpc={activeNpc}
              messages={activeMessages}
            />
            <PlayerInput
              draftMessage={gameState.draftMessage}
              onDraftChange={(draftMessage) =>
                setGameState((current) => ({ ...current, draftMessage }))
              }
              onSend={handleSendMessage}
              onReset={handleResetGame}
              disabled={pendingActiveNpc}
              isLoading={pendingActiveNpc}
            />
          </div>

          <div className="min-h-0">
            <CaseFilePanel
              caseFile={activeCaseFile}
              clues={clues}
              npcs={runtimeNpcs}
              discoveredClueIds={gameState.discoveredClueIds}
              keyTestimonies={gameState.keyTestimonies}
              progressLabel={progressLabel}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
