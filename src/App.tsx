import { useState } from "react";
import { ChatWindow } from "./components/ChatWindow";
import { CluePanel } from "./components/CluePanel";
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
import type { ChatMessage, GameState, MobilePanel } from "./types/game";

const mobilePanels: Array<{ id: MobilePanel; label: string }> = [
  { id: "chat", label: "CHAT" },
  { id: "npcs", label: "NPCS" },
  { id: "clues", label: "CLUES" },
];

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

  return {
    ...current,
    conversations: {
      ...current.conversations,
      [npcId]: [
        ...(current.conversations[npcId] ?? []),
        createNpcMessage(npcId, replyText, unlockClueIds),
      ],
    },
    discoveredClueIds: [...updatedIds],
  };
}

function getProgressLabel(discoveredCount: number) {
  if (discoveredCount >= 5) {
    return "Signal almost complete";
  }

  if (discoveredCount >= 3) {
    return "Pattern emerging";
  }

  return "Early reconstruction";
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    activeCaseId: caseFile.id,
    selectedNpcId: npcs[0].id,
    draftMessage: "",
    conversations: initialConversations,
    discoveredClueIds: starterClueIds,
    mobilePanel: "chat",
  });
  const [pendingNpcIds, setPendingNpcIds] = useState<string[]>([]);

  const activeNpc = npcs.find((npc) => npc.id === gameState.selectedNpcId) ?? npcs[0];
  const activeMessages = gameState.conversations[activeNpc.id] ?? [];

  const discoveredClueIdSet = new Set(gameState.discoveredClueIds);
  const handleSendMessage = async () => {
    const trimmed = gameState.draftMessage.trim();
    const npcId = activeNpc.id;

    if (!trimmed || pendingNpcIds.includes(npcId)) {
      return;
    }

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
        [npcId]: [...(current.conversations[npcId] ?? []), playerMessage],
      },
    }));
    setPendingNpcIds((current) => [...current, npcId]);

    try {
      const response = await fetchNpcReply({
        npcId,
        playerMessage: trimmed,
      });

      setGameState((current) =>
        appendNpcReplyToState(
          current,
          npcId,
          response.reply,
          scriptedReply?.unlockClueIds,
        ),
      );
    } catch (error) {
      const fallbackMessage =
        error instanceof ChatApiError
          ? `后端通信失败: ${error.message}`
          : "后端通信失败，请稍后重试。";

      setGameState((current) => ({
        ...current,
        conversations: {
          ...current.conversations,
          [npcId]: [
            ...(current.conversations[npcId] ?? []),
            createSystemMessage(fallbackMessage),
          ],
        },
      }));
    } finally {
      setPendingNpcIds((current) => current.filter((item) => item !== npcId));
    }
  };

  const selectNpc = (npcId: string) => {
    setGameState((current) => ({
      ...current,
      selectedNpcId: npcId,
      mobilePanel: "chat",
    }));
  };

  const activeLinkedClues = clues.filter((clue) => clue.sourceNpcId === activeNpc.id).length;
  const progressLabel = getProgressLabel(gameState.discoveredClueIds.length);
  const pendingActiveNpc = pendingNpcIds.includes(activeNpc.id);

  return (
    <main className="relative min-h-screen overflow-hidden px-3 py-4 text-slate-50 sm:px-5 sm:py-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(167,181,200,0.07),_transparent_30%),radial-gradient(circle_at_right,_rgba(132,145,171,0.06),_transparent_24%),linear-gradient(180deg,_rgba(36,48,65,0.5),_rgba(32,40,58,0.34),_rgba(26,34,51,0.12))]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1700px] flex-col gap-5">
        <header className="cyber-panel p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.42em] text-[#B8C2CF]">
                AI Detective Interface
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-[0.04em] text-slate-50 sm:text-[2.85rem]">
                霓虹推理终端
              </h1>
              <p className="mt-4 max-w-3xl text-[0.98rem] leading-7 text-[#D6DEEA] sm:text-[1.02rem]">
                在赛博都市的断电窗口里，逐个击穿 NPC 话术，拼合被重写的监控与权限链。所有数据均为 mock，
                但交互闭环已可直接试玩。
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="cyber-card rounded-[24px] px-4 py-3.5">
                <p className="text-[0.68rem] uppercase tracking-[0.26em] text-[#AEB8C5]">
                  Active NPC
                </p>
                <p className="mt-2 text-lg font-semibold text-[#E2E8F0]">{activeNpc.name}</p>
                <p className="mt-1 text-sm text-[#D6DEEA]">{activeNpc.role}</p>
              </div>
              <div className="cyber-card rounded-[24px] px-4 py-3.5">
                <p className="text-[0.68rem] uppercase tracking-[0.26em] text-[#AEB8C5]">
                  Clues Recovered
                </p>
                <p className="mt-2 text-lg font-semibold text-[#E2E8F0]">
                  {gameState.discoveredClueIds.length}/{clues.length}
                </p>
                <p className="mt-1 text-sm text-[#D6DEEA]">{progressLabel}</p>
              </div>
              <div className="cyber-card rounded-[24px] px-4 py-3.5">
                <p className="text-[0.68rem] uppercase tracking-[0.26em] text-[#AEB8C5]">
                  Linked Evidence
                </p>
                <p className="mt-2 text-lg font-semibold text-[#E2E8F0]">{activeLinkedClues}</p>
                <p className="mt-1 text-sm text-[#D6DEEA]">与当前通道相关的碎片数量</p>
              </div>
            </div>
          </div>
        </header>

        <div className="xl:hidden">
          <div className="cyber-panel flex items-center gap-2 p-2.5">
            {mobilePanels.map((panel) => {
              const active = gameState.mobilePanel === panel.id;

              return (
                <button
                  key={panel.id}
                  type="button"
                  onClick={() =>
                    setGameState((current) => ({ ...current, mobilePanel: panel.id }))
                  }
                  className={`terminal-tab flex-1 rounded-2xl px-4 py-2.5 text-xs font-medium tracking-[0.24em] ${
                    active ? "is-active" : ""
                  }`}
                >
                  {panel.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid flex-1 gap-4 lg:hidden">
          <div className={gameState.mobilePanel === "npcs" ? "block" : "hidden"}>
            <NpcSidebar
              npcs={npcs}
              selectedNpcId={gameState.selectedNpcId}
              conversations={gameState.conversations}
              onSelect={selectNpc}
            />
          </div>

          <div
            className={`${gameState.mobilePanel === "chat" ? "flex" : "hidden"} min-h-0 flex-col gap-4`}
          >
            <ChatWindow
              caseFile={caseFile}
              activeNpc={activeNpc}
              messages={activeMessages}
              progressLabel={progressLabel}
            />
            <PlayerInput
              draftMessage={gameState.draftMessage}
              onDraftChange={(draftMessage) =>
                setGameState((current) => ({ ...current, draftMessage }))
              }
              onSend={handleSendMessage}
              disabled={pendingActiveNpc}
              isLoading={pendingActiveNpc}
            />
          </div>

          <div className={gameState.mobilePanel === "clues" ? "block" : "hidden"}>
            <CluePanel
              clues={clues}
              activeNpc={activeNpc}
              discoveredClueIds={discoveredClueIdSet}
            />
          </div>
        </div>

        <div className="hidden flex-1 gap-4 lg:grid xl:hidden lg:grid-cols-[300px_minmax(0,1fr)]">
          <div>
            {gameState.mobilePanel === "clues" ? (
              <CluePanel
                clues={clues}
                activeNpc={activeNpc}
                discoveredClueIds={discoveredClueIdSet}
              />
            ) : (
              <NpcSidebar
                npcs={npcs}
                selectedNpcId={gameState.selectedNpcId}
                conversations={gameState.conversations}
                onSelect={selectNpc}
              />
            )}
          </div>

          <div className="min-h-0 flex flex-col gap-4">
            <ChatWindow
              caseFile={caseFile}
              activeNpc={activeNpc}
              messages={activeMessages}
              progressLabel={progressLabel}
            />
            <PlayerInput
              draftMessage={gameState.draftMessage}
              onDraftChange={(draftMessage) =>
                setGameState((current) => ({ ...current, draftMessage }))
              }
              onSend={handleSendMessage}
              disabled={pendingActiveNpc}
              isLoading={pendingActiveNpc}
            />
          </div>
        </div>

        <div className="hidden flex-1 gap-4 xl:grid xl:grid-cols-[300px_minmax(0,1fr)_340px]">
          <div>
            <NpcSidebar
              npcs={npcs}
              selectedNpcId={gameState.selectedNpcId}
              conversations={gameState.conversations}
              onSelect={selectNpc}
            />
          </div>

          <div className="min-h-0 flex flex-col gap-4">
            <ChatWindow
              caseFile={caseFile}
              activeNpc={activeNpc}
              messages={activeMessages}
              progressLabel={progressLabel}
            />
            <PlayerInput
              draftMessage={gameState.draftMessage}
              onDraftChange={(draftMessage) =>
                setGameState((current) => ({ ...current, draftMessage }))
              }
              onSend={handleSendMessage}
              disabled={pendingActiveNpc}
              isLoading={pendingActiveNpc}
            />
          </div>

          <div>
            <CluePanel
              clues={clues}
              activeNpc={activeNpc}
              discoveredClueIds={discoveredClueIdSet}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
