import { useEffect, useRef, useState } from "react";

const NEW_BADGE_DURATION = 4000;
const ANIMATION_RESET_DELAY = 100;

interface ClueUnlockState {
  isNewlyUnlocked: boolean;
  showBadge: boolean;
}

/**
 * Hook to track newly unlocked clues and manage animation states.
 * @param discoveredClueIds - Current array of discovered clue IDs
 * @param onUnlock - Optional callback when new clues are unlocked
 * @returns Object with newly unlocked clue IDs set and clue states
 */
export function useClueUnlockAnimation(
  discoveredClueIds: string[],
  onUnlock?: () => void,
) {
  const previousIdsRef = useRef<string[]>([]);
  const hasInitializedRef = useRef(false);
  const [newlyUnlockedIds, setNewlyUnlockedIds] = useState<Set<string>>(new Set());
  const [clueStates, setClueStates] = useState<Record<string, ClueUnlockState>>({});

  useEffect(() => {
    if (!hasInitializedRef.current) {
      previousIdsRef.current = [...discoveredClueIds];
      hasInitializedRef.current = true;
      return;
    }

    const previousIds = new Set(previousIdsRef.current);
    const newIds = discoveredClueIds.filter((id) => !previousIds.has(id));

    if (newIds.length > 0) {
      const animationResetTimer = window.setTimeout(() => {
        setClueStates((prev) => {
          const updated = { ...prev };
          newIds.forEach((id) => {
            if (updated[id]) {
              updated[id] = { ...updated[id], isNewlyUnlocked: false };
            }
          });
          return updated;
        });
      }, ANIMATION_RESET_DELAY);

      const badgeClearTimer = window.setTimeout(() => {
        setClueStates((prev) => {
          const updated = { ...prev };
          newIds.forEach((id) => {
            if (updated[id]) {
              updated[id] = { ...updated[id], showBadge: false };
            }
          });
          return updated;
        });
        setNewlyUnlockedIds((current) => {
          const next = new Set(current);
          newIds.forEach((id) => next.delete(id));
          return next;
        });
      }, NEW_BADGE_DURATION);

      setNewlyUnlockedIds(new Set(newIds));

      setClueStates((prev) => {
        const updated = { ...prev };
        newIds.forEach((id) => {
          updated[id] = { isNewlyUnlocked: true, showBadge: true };
        });
        return updated;
      });

      onUnlock?.();
      previousIdsRef.current = [...discoveredClueIds];

      return () => {
        window.clearTimeout(animationResetTimer);
        window.clearTimeout(badgeClearTimer);
      };
    }

    previousIdsRef.current = [...discoveredClueIds];
  }, [discoveredClueIds, onUnlock]);

  return {
    newlyUnlockedIds,
    clueStates,
  };
}

export function shouldShowNewBadge(clueId: string, clueStates: Record<string, ClueUnlockState>): boolean {
  return clueStates[clueId]?.showBadge ?? false;
}
