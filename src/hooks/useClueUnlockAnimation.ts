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
 * @param soundEnabled - Whether to play unlock sound
 * @returns Object with newly unlocked clue IDs set and sound trigger ref
 */
export function useClueUnlockAnimation(
  discoveredClueIds: string[],
  soundEnabled: boolean = false,
) {
  const previousIdsRef = useRef<string[]>([]);
  const [newlyUnlockedIds, setNewlyUnlockedIds] = useState<Set<string>>(new Set());
  const [clueStates, setClueStates] = useState<Record<string, ClueUnlockState>>({});
  const soundTriggerRef = useRef(0);

  useEffect(() => {
    const previousIds = new Set(previousIdsRef.current);
    const newIds = discoveredClueIds.filter((id) => !previousIds.has(id));

    if (newIds.length > 0) {
      setNewlyUnlockedIds(new Set(newIds));
      soundTriggerRef.current += 1;

      setClueStates((prev) => {
        const updated = { ...prev };
        newIds.forEach((id) => {
          updated[id] = { isNewlyUnlocked: true, showBadge: true };
        });
        return updated;
      });

      if (soundEnabled) {
        playUnlockSound();
      }

      setTimeout(() => {
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

      setTimeout(() => {
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
    }

    previousIdsRef.current = [...discoveredClueIds];
  }, [discoveredClueIds, soundEnabled]);

  return {
    newlyUnlockedIds,
    clueStates,
    soundTriggerRef,
  };
}

function playUnlockSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1320, audioContext.currentTime + 0.08);

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch {
    // Audio not available, silently fail
  }
}

export function isClueNewlyUnlocked(clueId: string, newlyUnlockedIds: Set<string>): boolean {
  return newlyUnlockedIds.has(clueId);
}

export function shouldShowNewBadge(clueId: string, clueStates: Record<string, ClueUnlockState>): boolean {
  return clueStates[clueId]?.showBadge ?? false;
}
