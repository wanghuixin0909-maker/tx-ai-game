import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AccusationModal } from "./components/AccusationModal";
import { CaseFilePanel } from "./components/CaseFilePanel";
import { CaseHero } from "./components/CaseHero";
import { CaseSelector } from "./components/CaseSelector";
import { ChatWindow } from "./components/ChatWindow";
import { EndingOverlay } from "./components/EndingOverlay";
import { NpcSidebar } from "./components/NpcSidebar";
import { PlayerInput } from "./components/PlayerInput";
import { caseCategories, caseLibrary, caseLibraryById, defaultCaseId } from "./data/caseLibrary";
import { useClueUnlockAnimation } from "./hooks/useClueUnlockAnimation";
import { useSoundEffects } from "./hooks/useSoundEffects";
import { buildCaseScore, validateFinalAccusation } from "./lib/accusation";
import { ChatApiError, fetchNpcReply } from "./lib/chatApi";
import {
  clearCaseMemory,
  loadCaseMemory,
  loadSelectedCaseId,
  MAX_CASE_TESTIMONIES,
  MAX_RECENT_MESSAGES_PER_NPC,
  saveCaseMemory,
  saveSelectedCaseId,
} from "./lib/localGameStorage";
import { buildKeywordIndex, selectReply } from "./lib/replyMatcher";
import type {
  AccusationCheckResult,
  CaseDefinition,
  CaseTestimony,
  ChatMessage,
  EndingState,
  GameState,
  MobilePanel,
  Npc,
  NpcRuntimeState,
} from "./types/game";

const mobilePanels: Array<{ id: MobilePanel; label: string }> = [
  { id: "chat", label: "审问" },
  { id: "npcs", label: "对象" },
  { id: "case-file", label: "档案" },
];

type ResponseMode = "remote" | "fallback";

interface InvestigationGuidance {
  currentObjective: string;
  suggestedPrompts: string[];
  nextMilestone: string;
}

const CASE_ROUTE_PREFIX = "/cases/";

function getCasePath(caseId: string) {
  return `${CASE_ROUTE_PREFIX}${encodeURIComponent(caseId)}`;
}

function getCaseIdFromPath(pathname: string) {
  if (!pathname.startsWith(CASE_ROUTE_PREFIX)) {
    return null;
  }

  const encodedCaseId = pathname.slice(CASE_ROUTE_PREFIX.length).split("/")[0] ?? "";
  const caseId = decodeURIComponent(encodedCaseId);

  return caseLibraryById[caseId] ? caseId : null;
}

function scrollAppToTop() {
  const main = document.querySelector("main");

  if (main instanceof HTMLElement) {
    main.scrollTo({ top: 0, behavior: "auto" });
  }

  window.scrollTo({ top: 0, behavior: "auto" });
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

function trimConversation(messages: ChatMessage[]): ChatMessage[] {
  return messages.slice(-MAX_RECENT_MESSAGES_PER_NPC);
}

function createUsedReplyIndexMap(npcs: Npc[]) {
  return Object.fromEntries(npcs.map((npc) => [npc.id, [] as number[]]));
}

function getCasePhase(totalClues: number, discoveredCount: number) {
  if (discoveredCount >= totalClues) {
    return "阶段 05 / 最终推演";
  }

  if (discoveredCount >= Math.max(4, Math.ceil(totalClues * 0.75))) {
    return "阶段 04 / 锁定真凶";
  }

  if (discoveredCount >= Math.max(3, Math.ceil(totalClues * 0.5))) {
    return "阶段 03 / 证词对照";
  }

  if (discoveredCount >= Math.max(2, Math.ceil(totalClues * 0.33))) {
    return "阶段 02 / 嫌疑筛查";
  }

  return "阶段 01 / 案件简报";
}

function createInitialNpcStates(npcs: Npc[]): Record<string, NpcRuntimeState> {
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

function createKeyTestimony(
  message: ChatMessage,
  npcNameById: Record<string, string>,
): CaseTestimony | null {
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
  npcs: Npc[],
  conversations: Record<string, ChatMessage[]>,
  npcNameById: Record<string, string>,
): CaseTestimony[] {
  let testimonies: CaseTestimony[] = [];

  npcs.forEach((npc) => {
    (conversations[npc.id] ?? []).forEach((message) => {
      testimonies = appendKeyTestimony(testimonies, createKeyTestimony(message, npcNameById));
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

function createInitialGameState(caseDefinition: CaseDefinition): GameState {
  const conversations = cloneConversations(caseDefinition.initialConversations);

  return {
    activeCaseId: caseDefinition.id,
    selectedNpcId: caseDefinition.npcs[0]?.id ?? "",
    draftMessage: "",
    conversations,
    discoveredClueIds: [...caseDefinition.starterClueIds],
    keyTestimonies: buildKeyTestimoniesFromConversations(
      caseDefinition.npcs,
      conversations,
      Object.fromEntries(caseDefinition.npcs.map((npc) => [npc.id, npc.name])),
    ),
    mobilePanel: "chat",
    casePhase: getCasePhase(caseDefinition.clues.length, caseDefinition.starterClueIds.length),
    npcStates: createInitialNpcStates(caseDefinition.npcs),
  };
}

function createPersistedMemory(gameState: GameState) {
  return {
    activeCaseId: gameState.activeCaseId,
    selectedNpcId: gameState.selectedNpcId,
    conversations: gameState.conversations,
    discoveredClueIds: gameState.discoveredClueIds,
    keyTestimonies: gameState.keyTestimonies,
    casePhase: gameState.casePhase,
    npcStates: gameState.npcStates,
  };
}

function hydrateGameState(caseDefinition: CaseDefinition): GameState {
  const initialState = createInitialGameState(caseDefinition);
  const restoredMemory = loadCaseMemory(
    caseDefinition.id,
    createPersistedMemory(initialState),
    caseDefinition.npcs.map((npc) => npc.id),
    caseDefinition.clues.map((clue) => clue.id),
  );
  const conversations = cloneConversations(restoredMemory.conversations);
  const npcNameById = Object.fromEntries(caseDefinition.npcs.map((npc) => [npc.id, npc.name]));
  const derivedTestimonies = buildKeyTestimoniesFromConversations(
    caseDefinition.npcs,
    conversations,
    npcNameById,
  );
  const discoveredClueIds =
    restoredMemory.discoveredClueIds.length > 0
      ? restoredMemory.discoveredClueIds
      : [...caseDefinition.starterClueIds];

  return {
    ...initialState,
    ...restoredMemory,
    draftMessage: "",
    conversations,
    discoveredClueIds,
    keyTestimonies: mergeKeyTestimonies(restoredMemory.keyTestimonies, derivedTestimonies),
    mobilePanel: "chat",
    casePhase: getCasePhase(caseDefinition.clues.length, discoveredClueIds.length),
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

function createNpcMessage(npcId: string, text: string, unlockClueIds?: string[]): ChatMessage {
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
  caseDefinition: CaseDefinition,
  npcId: string,
  replyText: string,
  npcNameById: Record<string, string>,
  unlockClueIds?: string[],
  options?: {
    systemText?: string;
  },
): GameState {
  const updatedIds = new Set(current.discoveredClueIds);
  unlockClueIds?.forEach((clueId) => updatedIds.add(clueId));

  const npcMessage = createNpcMessage(npcId, replyText, unlockClueIds);
  const nextMessages = [...(current.conversations[npcId] ?? [])];

  if (options?.systemText) {
    nextMessages.push(createSystemMessage(options.systemText));
  }

  nextMessages.push(npcMessage);

  return {
    ...current,
    conversations: {
      ...current.conversations,
      [npcId]: trimConversation(nextMessages),
    },
    discoveredClueIds: [...updatedIds],
    keyTestimonies: appendKeyTestimony(
      current.keyTestimonies,
      createKeyTestimony(npcMessage, npcNameById),
    ),
    casePhase: getCasePhase(caseDefinition.clues.length, updatedIds.size),
  };
}

function getProgressLabel(totalClues: number, discoveredCount: number) {
  if (discoveredCount >= totalClues) {
    return "证据链已闭合";
  }

  if (discoveredCount >= Math.max(4, Math.ceil(totalClues * 0.75))) {
    return "关键矛盾正在收束";
  }

  if (discoveredCount >= Math.max(3, Math.ceil(totalClues * 0.5))) {
    return "嫌疑网络逐渐成形";
  }

  return "先搭建案件全貌";
}

function getCurrentObjective(
  caseDefinition: CaseDefinition,
  activeNpc: Npc,
  discoveredClueIds: string[],
) {
  const discoveredSet = new Set(discoveredClueIds);
  const pendingNpcClue = caseDefinition.clues.find(
    (clue) => clue.sourceNpcId === activeNpc.id && !discoveredSet.has(clue.id),
  );

  if (pendingNpcClue) {
    return `围绕“${pendingNpcClue.title}”继续追问，确认${activeNpc.name}是否还隐瞒关键细节。`;
  }

  return activeNpc.investigationFocus;
}

function getSuggestedPrompts(caseDefinition: CaseDefinition, npcId: string) {
  return caseDefinition.suggestedPrompts[npcId] ?? caseDefinition.caseFile.brief.investigationDirections.slice(0, 3);
}

function getNextMilestone(caseDefinition: CaseDefinition, discoveredClueIds: string[]) {
  const nextClue = caseDefinition.clues.find((clue) => !discoveredClueIds.includes(clue.id));

  if (!nextClue) {
    return "核心线索已齐，整理证据链并发起最终指控。";
  }

  const npcName = caseDefinition.npcs.find((npc) => npc.id === nextClue.sourceNpcId)?.name ?? "相关对象";
  return `下一里程碑: 从 ${npcName} 身上拿到“${nextClue.title}”。`;
}

function buildGuidance(
  caseDefinition: CaseDefinition,
  activeNpc: Npc,
  discoveredClueIds: string[],
): InvestigationGuidance {
  return {
    currentObjective: getCurrentObjective(caseDefinition, activeNpc, discoveredClueIds),
    suggestedPrompts: getSuggestedPrompts(caseDefinition, activeNpc.id),
    nextMilestone: getNextMilestone(caseDefinition, discoveredClueIds),
  };
}

export default function App() {
  const caseSelectorRef = useRef<HTMLElement | null>(null);
  const desktopGridRef = useRef<HTMLDivElement | null>(null);
  const persistenceReadyRef = useRef(false);
  const requestEpochRef = useRef(0);
  const previousPhaseRef = useRef<string | null>(null);
  const [desktopGridHeight, setDesktopGridHeight] = useState<number | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [selectedCaseId, setSelectedCaseId] = useState(() =>
    getCaseIdFromPath(window.location.pathname)
    ?? loadSelectedCaseId(defaultCaseId, caseLibrary.map((caseDefinition) => caseDefinition.id)),
  );
  const initialCase = caseLibraryById[selectedCaseId] ?? caseLibraryById[defaultCaseId];
  const replyUsageRef = useRef<Record<string, number[]>>(createUsedReplyIndexMap(initialCase.npcs));

  const [gameState, setGameState] = useState<GameState>(() => hydrateGameState(initialCase));
  const [pendingNpcIds, setPendingNpcIds] = useState<string[]>([]);
  const [isAccusationOpen, setIsAccusationOpen] = useState(false);
  const [lastAccusationResult, setLastAccusationResult] =
    useState<AccusationCheckResult | null>(null);
  const [caseOutcome, setCaseOutcome] = useState<EndingState | null>(null);
  const [isEndingOverlayOpen, setIsEndingOverlayOpen] = useState(false);
  const [responseMode, setResponseMode] = useState<ResponseMode>(
    initialCase.remoteSupport ? "remote" : "fallback",
  );
  const [phaseNotice, setPhaseNotice] = useState<null | { phase: string; detail: string }>(null);
  const { playSound } = useSoundEffects();
  const { clueStates } = useClueUnlockAnimation(gameState.discoveredClueIds, () => {
    playSound("unlock");
  });

  const activeCase = caseLibraryById[selectedCaseId] ?? caseLibraryById[defaultCaseId];
  const activeCategoryLabel =
    caseCategories.find((category) => category.id === activeCase.categoryId)?.label ?? "案件";
  const npcNameById = Object.fromEntries(activeCase.npcs.map((npc) => [npc.id, npc.name]));
  const runtimeNpcs = activeCase.npcs.map((npc) => ({
    ...npc,
    ...(gameState.npcStates[npc.id] ?? {
      status: npc.status,
      trustLevel: npc.trustLevel,
    }),
  }));
  const activeNpc =
    runtimeNpcs.find((npc) => npc.id === gameState.selectedNpcId) ?? runtimeNpcs[0];
  const activeCaseFile = {
    ...activeCase.caseFile,
    id: gameState.activeCaseId,
    phase: gameState.casePhase,
  };
  const activeMessages = activeNpc ? gameState.conversations[activeNpc.id] ?? [] : [];
  const guidance = activeNpc
    ? buildGuidance(activeCase, activeNpc, gameState.discoveredClueIds)
    : {
        currentObjective: activeCase.caseFile.objective,
        suggestedPrompts: [],
        nextMilestone: getNextMilestone(activeCase, gameState.discoveredClueIds),
      };

  useEffect(() => {
    saveSelectedCaseId(selectedCaseId);
  }, [selectedCaseId]);

  useEffect(() => {
    if (!persistenceReadyRef.current) {
      return;
    }

    saveCaseMemory(selectedCaseId, createPersistedMemory(gameState));
  }, [gameState, selectedCaseId]);

  useEffect(() => {
    persistenceReadyRef.current = true;
  }, []);

  useEffect(() => {
    if (previousPhaseRef.current === null) {
      previousPhaseRef.current = gameState.casePhase;
      return;
    }

    if (previousPhaseRef.current === gameState.casePhase) {
      return;
    }

    previousPhaseRef.current = gameState.casePhase;
    setPhaseNotice({
      phase: gameState.casePhase,
      detail: `${getProgressLabel(activeCase.clues.length, gameState.discoveredClueIds.length)}，继续推进证词交叉验证。`,
    });

    const noticeTimer = window.setTimeout(() => {
      setPhaseNotice(null);
    }, 4200);

    return () => window.clearTimeout(noticeTimer);
  }, [activeCase.clues.length, gameState.casePhase, gameState.discoveredClueIds.length]);

  useEffect(() => {
    const currentPath = window.location.pathname;
    const canonicalPath = getCasePath(selectedCaseId);

    if (currentPath !== canonicalPath) {
      window.history.replaceState({ caseId: selectedCaseId }, "", canonicalPath);
    }
  }, [selectedCaseId]);

  useEffect(() => {
    const handlePopState = () => {
      const routeCaseId = getCaseIdFromPath(window.location.pathname);

      if (!routeCaseId || routeCaseId === selectedCaseId) {
        return;
      }

      const nextCase = caseLibraryById[routeCaseId];

      requestEpochRef.current += 1;
      previousPhaseRef.current = null;
      replyUsageRef.current = createUsedReplyIndexMap(nextCase.npcs);
      resetTransientUi(nextCase.remoteSupport ? "remote" : "fallback");
      setSelectedCaseId(routeCaseId);
      setGameState(hydrateGameState(nextCase));
      scrollAppToTop();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [selectedCaseId]);

  useLayoutEffect(() => {
    const updateDesktopGridHeight = () => {
      const desktopGridElement = desktopGridRef.current;

      if (!desktopGridElement) {
        return;
      }

      const top = desktopGridElement.getBoundingClientRect().top;
      const availableHeight = Math.max(window.innerHeight - top, 420);
      setDesktopGridHeight(availableHeight);
    };

    updateDesktopGridHeight();

    const resizeObserver = new ResizeObserver(updateDesktopGridHeight);
    resizeObserver.observe(document.body);
    window.addEventListener("resize", updateDesktopGridHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDesktopGridHeight);
    };
  }, [selectedCaseId, phaseNotice]);

  const progressLabel = getProgressLabel(activeCase.clues.length, gameState.discoveredClueIds.length);
  const pendingActiveNpc = activeNpc ? pendingNpcIds.includes(activeNpc.id) : false;
  const desktopMainGridStyle =
    desktopGridHeight !== null ? { height: `${desktopGridHeight}px` } : undefined;
  const evidenceChainReady = activeCase.accusation.requiredClueIds.every((clueId) =>
    gameState.discoveredClueIds.includes(clueId),
  );
  const accusationStatus =
    caseOutcome?.verdict === "case-resolved"
      ? "resolved"
      : caseOutcome?.verdict === "false-accusation"
        ? "failed"
        : evidenceChainReady
          ? "ready"
          : "locked";
  const caseResolved = caseOutcome?.verdict === "case-resolved";

  const resetTransientUi = (nextResponseMode: ResponseMode) => {
    setPendingNpcIds([]);
    setIsAccusationOpen(false);
    setLastAccusationResult(null);
    setCaseOutcome(null);
    setIsEndingOverlayOpen(false);
    setResponseMode(nextResponseMode);
    setPhaseNotice(null);
  };

  const handleSelectCase = (caseId: string) => {
    const nextCase = caseLibraryById[caseId];

    if (!nextCase) {
      return;
    }

    const nextPath = getCasePath(caseId);

    if (window.location.pathname !== nextPath) {
      window.history.pushState({ caseId }, "", nextPath);
    }

    if (caseId !== selectedCaseId) {
      requestEpochRef.current += 1;
      previousPhaseRef.current = null;
      replyUsageRef.current = createUsedReplyIndexMap(nextCase.npcs);
      resetTransientUi(nextCase.remoteSupport ? "remote" : "fallback");
      setSelectedCaseId(caseId);
      setGameState(hydrateGameState(nextCase));
    }

    scrollAppToTop();
  };

  const handleSendMessage = async () => {
    if (!activeNpc) {
      return;
    }

    const trimmed = gameState.draftMessage.trim();
    const npcId = activeNpc.id;

    if (!trimmed || pendingNpcIds.includes(npcId) || caseResolved) {
      return;
    }

    const requestEpoch = requestEpochRef.current;
    const playerMessage = createPlayerMessage(trimmed);
    const replyPool = activeCase.scriptedReplies[npcId] ?? [];
    const usedIndices = new Set(replyUsageRef.current[npcId] ?? []);
    const fallbackSelection =
      replyPool.length > 0
        ? selectReply(
            trimmed,
            replyPool,
            buildKeywordIndex(replyPool),
            gameState.discoveredClueIds,
            usedIndices,
          )
        : null;

    playSound("send");

    setGameState((current) => ({
      ...current,
      draftMessage: "",
      conversations: {
        ...current.conversations,
        [npcId]: trimConversation([...(current.conversations[npcId] ?? []), playerMessage]),
      },
    }));
    setPendingNpcIds((current) => [...current, npcId]);

    const applyFallbackReply = (systemText?: string) => {
      const replyText =
        fallbackSelection?.reply.text
        ?? `${activeNpc.name}短暂沉默，像是在衡量你已经掌握了多少。`;
      const unlockClueIds = fallbackSelection?.reply.unlockClueIds;

      if (fallbackSelection) {
        replyUsageRef.current[npcId] = [
          ...(replyUsageRef.current[npcId] ?? []),
          fallbackSelection.matchedIndex,
        ];
      }

      setResponseMode("fallback");
      playSound("reply");
      setGameState((current) =>
        appendNpcReplyToState(
          current,
          activeCase,
          npcId,
          replyText,
          npcNameById,
          unlockClueIds,
          systemText ? { systemText } : undefined,
        ),
      );
    };

    try {
      if (!activeCase.remoteSupport) {
        applyFallbackReply("当前剧本使用本地推演模式，回复将基于该案件的专属脚本库生成。");
        return;
      }

      const response = await fetchNpcReply({
        npcId,
        playerMessage: trimmed,
      });

      if (requestEpoch !== requestEpochRef.current) {
        return;
      }

      if (fallbackSelection) {
        replyUsageRef.current[npcId] = [
          ...(replyUsageRef.current[npcId] ?? []),
          fallbackSelection.matchedIndex,
        ];
      }

      setResponseMode("remote");
      playSound("reply");
      setGameState((current) =>
        appendNpcReplyToState(
          current,
          activeCase,
          npcId,
          response.reply,
          npcNameById,
          fallbackSelection?.reply.unlockClueIds,
        ),
      );
    } catch (error) {
      if (requestEpoch !== requestEpochRef.current) {
        return;
      }

      if (fallbackSelection) {
        applyFallbackReply(
          "远程链路波动，系统已切换到本地案件推演，本轮调查仍会继续推进有效线索。",
        );
        return;
      }

      const fallbackMessage =
        error instanceof ChatApiError
          ? `后端请求失败: ${error.message}`
          : "后端请求失败，请稍后再试。";

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
    if (!window.confirm(`重置《${activeCase.caseFile.title}》并清除该剧本的已保存进度？`)) {
      return;
    }

    requestEpochRef.current += 1;
    previousPhaseRef.current = null;
    replyUsageRef.current = createUsedReplyIndexMap(activeCase.npcs);
    clearCaseMemory(selectedCaseId);
    resetTransientUi(activeCase.remoteSupport ? "remote" : "fallback");
    setGameState(createInitialGameState(activeCase));
  };

  const selectNpc = (npcId: string) => {
    setGameState((current) => ({
      ...current,
      selectedNpcId: npcId,
      mobilePanel: "chat",
    }));
  };

  const handleUseSuggestedPrompt = (prompt: string) => {
    setGameState((current) => ({
      ...current,
      draftMessage: prompt,
      mobilePanel: "chat",
    }));
  };

  const handleConfirmAccusation = (suspectId: string) => {
    const result = validateFinalAccusation(
      gameState.discoveredClueIds,
      suspectId,
      activeCase.accusation.requiredClueIds,
      activeCase.truth.culpritId,
    );

    setLastAccusationResult(result);

    if (result.verdict === "insufficient-evidence") {
      return;
    }

    setIsAccusationOpen(false);
    setCaseOutcome({
      suspectId,
      verdict: result.verdict,
      score: buildCaseScore({
        discoveredCluesCount: gameState.discoveredClueIds.length,
        totalCluesCount: activeCase.clues.length,
        keyTestimoniesCount: gameState.keyTestimonies.length,
        isCorrect: result.isCorrect,
      }),
      aiLines:
        result.verdict === "case-resolved"
          ? activeCase.accusation.successArchiveLines
          : activeCase.accusation.failureArchiveLines,
    });
    setIsEndingOverlayOpen(true);
  };

  const handleOpenAccusation = () => {
    if (caseOutcome?.verdict === "case-resolved") {
      setIsEndingOverlayOpen(true);
      return;
    }

    setIsAccusationOpen(true);
  };

  return (
    <main className="relative flex min-h-dvh flex-col overflow-x-hidden overflow-y-auto px-3 py-4 text-slate-50 sm:px-5 sm:py-5 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(167,181,200,0.07),_transparent_30%),radial-gradient(circle_at_right,_rgba(132,145,171,0.06),_transparent_24%),linear-gradient(180deg,_rgba(36,48,65,0.5),_rgba(32,40,58,0.34),_rgba(26,34,51,0.12))]" />
      <div className="relative mx-auto flex w-full max-w-[1700px] flex-1 flex-col gap-4">
        <CaseHero
          caseDefinition={activeCase}
          activeNpc={activeNpc}
          categoryLabel={activeCategoryLabel}
          discoveredCluesCount={gameState.discoveredClueIds.length}
          progressLabel={progressLabel}
          responseMode={responseMode}
          onBrowseCases={() =>
            caseSelectorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        />

        <header className="hidden">
          <div className="flex flex-col gap-3.5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[#B8C2CF]">
                AI 侦查终端
              </p>
              <h1 className="mt-2.5 text-[2.15rem] font-bold tracking-[0.02em] text-slate-50 sm:text-[2.55rem]">
                {activeCase.caseFile.title}
              </h1>
              <p className="mt-3 hidden max-w-3xl text-[0.92rem] leading-6 text-[#D6DEEA] sm:block sm:text-[0.98rem]">
                {activeCase.selectionSummary}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="terminal-pill rounded-full px-3 py-1.5 text-[0.64rem] uppercase tracking-[0.14em]">
                  {activeCaseFile.phase}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[0.64rem] uppercase tracking-[0.14em] text-[#D7DEE7]">
                  {caseCategories.find((category) => category.id === activeCase.categoryId)?.label}
                </span>
                <span
                  className={`rounded-full border px-3 py-1.5 text-[0.64rem] uppercase tracking-[0.14em] ${
                    responseMode === "remote"
                      ? "border-[#8eb2c166] bg-[rgba(142,178,193,0.12)] text-[#E7F4FA]"
                      : "border-[#ffd15e55] bg-[rgba(255,209,94,0.12)] text-[#FFE7A8]"
                  }`}
                >
                  {responseMode === "remote" ? "远程 AI 审问" : "本地案件推演"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="cyber-card rounded-[22px] px-3 py-2.5">
                <p className="text-[0.64rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                  当前对象
                </p>
                <p className="mt-1.5 text-sm font-semibold text-[#E2E8F0] sm:text-base">
                  {activeNpc?.name ?? "--"}
                </p>
                <p className="mt-1 hidden text-[0.74rem] leading-5 text-[#D6DEEA] sm:block sm:text-sm">
                  {activeNpc?.role ?? activeCase.caseFile.district}
                </p>
              </div>
              <div className="cyber-card rounded-[22px] px-3 py-2.5">
                <p className="text-[0.64rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                  已获线索
                </p>
                <p className="mt-1.5 text-sm font-semibold text-[#E2E8F0] sm:text-base">
                  {gameState.discoveredClueIds.length}/{activeCase.clues.length}
                </p>
                <p className="mt-1 hidden text-[0.74rem] leading-5 text-[#D6DEEA] sm:block sm:text-sm">
                  {progressLabel}
                </p>
              </div>
              <div className="cyber-card rounded-[22px] px-3 py-2.5">
                <p className="text-[0.64rem] uppercase tracking-[0.14em] text-[#AEB8C5]">
                  受害者
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

        <section ref={caseSelectorRef}>
          <CaseSelector
            categories={caseCategories}
            activeCategoryId={activeCategoryId}
            selectedCaseId={selectedCaseId}
            cases={caseLibrary}
            onCategoryChange={setActiveCategoryId}
            onSelectCase={handleSelectCase}
          />
        </section>

        {phaseNotice ? (
          <div className="cyber-panel border-pulse shrink-0 px-4 py-3.5 sm:px-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-[#8eb2c1]">
                  Phase Sync
                </p>
                <p className="mt-1 text-sm font-semibold text-[#E2E8F0]">{phaseNotice.phase}</p>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-[#D6DEEA]">
                {phaseNotice.detail}
              </p>
            </div>
          </div>
        ) : null}

        <div className="xl:hidden">
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

        <div className="grid min-h-0 flex-1 gap-3.5 lg:hidden">
          <div className={gameState.mobilePanel === "npcs" ? "block min-h-0 flex-1" : "hidden"}>
            <NpcSidebar
              npcs={runtimeNpcs}
              selectedNpcId={gameState.selectedNpcId}
              conversations={gameState.conversations}
              onSelect={selectNpc}
            />
          </div>

          <div
            className={`${gameState.mobilePanel === "chat" ? "flex h-full" : "hidden"} min-h-0 flex-1 flex-col`}
          >
            <ChatWindow
              activeNpc={activeNpc}
              messages={activeMessages}
              currentObjective={guidance.currentObjective}
              nextMilestone={guidance.nextMilestone}
              responseMode={responseMode}
              footer={
                <PlayerInput
                  draftMessage={gameState.draftMessage}
                  currentObjective={guidance.currentObjective}
                  suggestedPrompts={guidance.suggestedPrompts}
                  responseMode={responseMode}
                  onDraftChange={(draftMessage) =>
                    setGameState((current) => ({ ...current, draftMessage }))
                  }
                  onUseSuggestedPrompt={handleUseSuggestedPrompt}
                  onSend={handleSendMessage}
                  onReset={handleResetGame}
                  disabled={pendingActiveNpc || caseResolved}
                  isLoading={pendingActiveNpc}
                />
              }
            />
          </div>

          <div className={gameState.mobilePanel === "case-file" ? "block min-h-0 flex-1" : "hidden"}>
            <CaseFilePanel
              caseFile={activeCaseFile}
              clues={activeCase.clues}
              discoveredClueIds={gameState.discoveredClueIds}
              keyTestimonies={gameState.keyTestimonies}
              progressLabel={progressLabel}
              currentObjective={guidance.currentObjective}
              nextMilestone={guidance.nextMilestone}
              activeNpc={activeNpc}
              accusationStatus={accusationStatus}
              onOpenAccusation={handleOpenAccusation}
              clueStates={clueStates}
            />
          </div>
        </div>

        <div
          ref={desktopGridRef}
          style={desktopMainGridStyle}
          className="hidden min-h-0 flex-1 gap-3.5 lg:grid lg:grid-cols-[300px_minmax(0,1fr)_340px] lg:items-stretch"
        >
          <div className="h-full min-h-0 overflow-y-auto">
            <NpcSidebar
              npcs={runtimeNpcs}
              selectedNpcId={gameState.selectedNpcId}
              conversations={gameState.conversations}
              onSelect={selectNpc}
            />
          </div>

          <div className="flex h-full min-h-0 flex-col">
            <ChatWindow
              activeNpc={activeNpc}
              messages={activeMessages}
              currentObjective={guidance.currentObjective}
              nextMilestone={guidance.nextMilestone}
              responseMode={responseMode}
              footer={
                <PlayerInput
                  draftMessage={gameState.draftMessage}
                  currentObjective={guidance.currentObjective}
                  suggestedPrompts={guidance.suggestedPrompts}
                  responseMode={responseMode}
                  onDraftChange={(draftMessage) =>
                    setGameState((current) => ({ ...current, draftMessage }))
                  }
                  onUseSuggestedPrompt={handleUseSuggestedPrompt}
                  onSend={handleSendMessage}
                  onReset={handleResetGame}
                  disabled={pendingActiveNpc || caseResolved}
                  isLoading={pendingActiveNpc}
                />
              }
            />
          </div>

          <div className="flex h-full min-h-0 flex-col overflow-y-auto">
            <CaseFilePanel
              caseFile={activeCaseFile}
              clues={activeCase.clues}
              discoveredClueIds={gameState.discoveredClueIds}
              keyTestimonies={gameState.keyTestimonies}
              progressLabel={progressLabel}
              currentObjective={guidance.currentObjective}
              nextMilestone={guidance.nextMilestone}
              activeNpc={activeNpc}
              accusationStatus={accusationStatus}
              onOpenAccusation={handleOpenAccusation}
              clueStates={clueStates}
            />
          </div>
        </div>

        <AccusationModal
          isOpen={isAccusationOpen}
          npcs={runtimeNpcs}
          clues={activeCase.clues}
          discoveredClueIds={gameState.discoveredClueIds}
          requiredClueIds={activeCase.accusation.requiredClueIds}
          suspectEvidenceMap={activeCase.accusation.suspectEvidenceMap}
          lastResult={lastAccusationResult}
          onClose={() => setIsAccusationOpen(false)}
          onConfirm={handleConfirmAccusation}
        />

        <EndingOverlay
          endingState={isEndingOverlayOpen ? caseOutcome : null}
          caseFile={activeCaseFile}
          culpritSummary={activeCase.truth}
          clues={activeCase.clues}
          requiredClueIds={activeCase.accusation.requiredClueIds}
          npcs={runtimeNpcs}
          onClose={() => setIsEndingOverlayOpen(false)}
        />
      </div>
    </main>
  );
}
