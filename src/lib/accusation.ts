import { clues, culpritId } from "../data/mockGame";
import type { AccusationCheckResult, CaseScore, SuspectInsight } from "../types/game";

export const FINAL_REQUIRED_CLUE_IDS = [
  "badge-scan",
  "ghost-proxy",
  "thermal-gap",
] as const;

export const FINAL_AI_ARCHIVE_LINES = [
  "案件归档完成。",
  "真相已恢复。",
  "记忆碎片同步结束。",
];

const suspectEvidenceMap: Record<string, string[]> = {
  nova: ["badge-scan"],
  shade: ["ghost-proxy", "mirror-contract"],
  echo: ["thermal-gap"],
  iris: [
    "badge-scan",
    "ghost-proxy",
    "thermal-gap",
    "vault-key",
    "maintenance-route",
    "mirror-contract",
  ],
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getClueTitle(clueId: string) {
  return clues.find((clue) => clue.id === clueId)?.title ?? clueId;
}

export function validateFinalAccusation(
  discoveredClueIds: string[],
  suspectId: string,
): AccusationCheckResult {
  const discoveredClueSet = new Set(discoveredClueIds);
  const missingClueIds = FINAL_REQUIRED_CLUE_IDS.filter((clueId) => !discoveredClueSet.has(clueId));
  const isCorrect = suspectId === culpritId;

  return {
    suspectId,
    verdict:
      missingClueIds.length > 0
        ? "insufficient-evidence"
        : isCorrect
          ? "case-resolved"
          : "false-accusation",
    isCorrect,
    requiredClueIds: [...FINAL_REQUIRED_CLUE_IDS],
    missingClueIds,
  };
}

export function buildSuspectInsight(
  suspectId: string,
  discoveredClueIds: string[],
): SuspectInsight {
  const clueSet = new Set(discoveredClueIds);
  const matchedEvidenceIds = (suspectEvidenceMap[suspectId] ?? []).filter((clueId) =>
    clueSet.has(clueId),
  );
  const matchedEvidenceCount = matchedEvidenceIds.length;

  let suspicionLabel: SuspectInsight["suspicionLabel"] = "LOW";

  if (matchedEvidenceCount >= 3) {
    suspicionLabel = "CRITICAL";
  } else if (matchedEvidenceCount === 2) {
    suspicionLabel = "HIGH";
  } else if (matchedEvidenceCount === 1) {
    suspicionLabel = "MEDIUM";
  }

  return {
    suspectId,
    suspicionLabel,
    matchedEvidenceCount,
    matchedEvidenceIds,
  };
}

export function buildCaseScore(input: {
  discoveredCluesCount: number;
  totalCluesCount: number;
  keyTestimoniesCount: number;
  isCorrect: boolean;
}): CaseScore {
  const clueCompleteness = clampScore(
    (input.discoveredCluesCount / Math.max(1, input.totalCluesCount)) * 100,
  );
  const interrogationEfficiency = clampScore(
    42 + input.keyTestimoniesCount * 9 + input.discoveredCluesCount * 4,
  );
  const deductionAccuracy = input.isCorrect ? 100 : 0;
  const overall = clampScore(
    clueCompleteness * 0.4 + interrogationEfficiency * 0.25 + deductionAccuracy * 0.35,
  );

  return {
    clueCompleteness,
    interrogationEfficiency,
    deductionAccuracy,
    overall,
  };
}
