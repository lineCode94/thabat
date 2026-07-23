import { useEffect, useRef } from 'react';

import { speakArabicReminder } from '@/lib/voiceReminders';

const WELCOME_SESSION_KEY = 'thabat:welcome-voice-played';
const PRAYER_REMINDER_INTERVAL_MS = 3 * 60 * 1000;

async function speakWhenPossible(text) {
  try {
    return await speakArabicReminder(text);
  } catch {
    return false;
  }
}

export function SpiritualVoiceReminders({ enabled = false }) {
  const hasScheduledWelcomeRef = useRef(false);

  useEffect(() => {
    if (!enabled || hasScheduledWelcomeRef.current) return undefined;
    hasScheduledWelcomeRef.current = true;

    const playWelcome = async () => {
      if (window.sessionStorage.getItem(WELCOME_SESSION_KEY) === 'true') return true;
      const didAttempt = await speakWhenPossible('بسم الله الرحمن الرحيم');
      if (didAttempt) {
        window.sessionStorage.setItem(WELCOME_SESSION_KEY, 'true');
      }
      return didAttempt;
    };

    const timeout = window.setTimeout(playWelcome, 900);

    const handleFirstInteraction = async () => {
      const didAttempt = await playWelcome();
      if (!didAttempt) return;
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;

    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      speakWhenPossible('صل على النبي');
    }, PRAYER_REMINDER_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [enabled]);

  return null;
}
