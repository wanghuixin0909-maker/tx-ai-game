import type { AccusationCheckResult, CaseScore, Clue, SuspectInsight } from "../types/game";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getClueTitle(clues: Clue[], clueId: string) {
  return clues.find((clue) => clue.id === clueId)?.title ?? clueId;
}

export function validateFinalAccusation(
  discoveredClueIds: string[],
  suspectId: string,
  requiredClueIds: string[],
  culpritId: string,
): AccusationCheckResult {
  const discoveredClueSet = new Set(discoveredClueIds);
  const missingClueIds = requiredClueIds.filter((clueId) => !discoveredClueSet.has(clueId));
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
    requiredClueIds: [...requiredClueIds],
    missingClueIds,
  };
}

export function buildSuspectInsight(
  suspectId: string,
  discoveredClueIds: string[],
  suspectEvidenceMap: Record<string, string[]>,
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
