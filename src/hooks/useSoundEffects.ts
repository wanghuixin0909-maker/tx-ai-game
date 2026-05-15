import { useCallback, useRef, useState } from "react";

export type SoundType = "send" | "reply" | "unlock";

interface UseSoundEffectsReturn {
  isMuted: boolean;
  toggleMute: () => void;
  playSound: (type: SoundType) => void;
}

export function useSoundEffects(): UseSoundEffectsReturn {
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem("neon-echo-sound-muted") === "true";
    } catch {
      return false;
    }
  });

  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("neon-echo-sound-muted", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const playSound = useCallback(
    (type: SoundType) => {
      if (isMuted) return;

      try {
        const ctx = getAudioContext();
        if (ctx.state === "suspended") {
          ctx.resume();
        }

        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);
        masterGain.gain.value = 0.15;

        const now = ctx.currentTime;

        switch (type) {
          case "send": {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(masterGain);
            osc.type = "sine";
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);
            gain.gain.setValueAtTime(0.6, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            osc.start(now);
            osc.stop(now + 0.06);
            break;
          }

          case "reply": {
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.connect(gain1);
            gain1.connect(masterGain);
            osc1.type = "sine";
            osc1.frequency.setValueAtTime(600, now);
            osc1.frequency.setValueAtTime(900, now + 0.06);
            gain1.gain.setValueAtTime(0.5, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc1.start(now);
            osc1.stop(now + 0.12);

            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(masterGain);
            osc2.type = "sine";
            osc2.frequency.setValueAtTime(900, now + 0.08);
            osc2.frequency.setValueAtTime(700, now + 0.14);
            gain2.gain.setValueAtTime(0.4, now + 0.08);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc2.start(now + 0.08);
            osc2.stop(now + 0.2);
            break;
          }

          case "unlock": {
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.connect(gain1);
            gain1.connect(masterGain);
            osc1.type = "sine";
            osc1.frequency.setValueAtTime(400, now);
            osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            gain1.gain.setValueAtTime(0.5, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc1.start(now);
            osc1.stop(now + 0.08);

            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(masterGain);
            osc2.type = "triangle";
            osc2.frequency.setValueAtTime(1400, now + 0.06);
            osc2.frequency.exponentialRampToValueAtTime(1800, now + 0.18);
            gain2.gain.setValueAtTime(0.4, now + 0.06);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc2.start(now + 0.06);
            osc2.stop(now + 0.25);

            const osc3 = ctx.createOscillator();
            const gain3 = ctx.createGain();
            osc3.connect(gain3);
            gain3.connect(masterGain);
            osc3.type = "sine";
            osc3.frequency.setValueAtTime(2000, now + 0.18);
            gain3.gain.setValueAtTime(0.3, now + 0.18);
            gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc3.start(now + 0.18);
            osc3.stop(now + 0.35);
            break;
          }
        }
      } catch {
        // Audio not available, silently ignore
      }
    },
    [isMuted, getAudioContext],
  );

  return { isMuted, toggleMute, playSound };
}
