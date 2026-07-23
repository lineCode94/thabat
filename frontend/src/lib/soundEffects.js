const SOUND_STORAGE_KEY = 'thabat:sound-effects';
let sharedAudioContext = null;

export function isSoundEnabled() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(SOUND_STORAGE_KEY) !== 'off';
}

export function setSoundEnabled(isEnabled) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SOUND_STORAGE_KEY, isEnabled ? 'on' : 'off');
}

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext || !isSoundEnabled()) return null;
  sharedAudioContext ??= new AudioContext();
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }
  return sharedAudioContext;
}

function resumeContext(context, onReady) {
  if (context.state === 'suspended') {
    context.resume().then(onReady).catch(() => {});
    return;
  }

  onReady();
}

function playTone(context, { frequency, start, duration, type = 'sine', gain = 0.08 }) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const startTime = context.currentTime + start;
  const endTime = startTime + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  envelope.gain.setValueAtTime(0.0001, startTime);
  envelope.gain.exponentialRampToValueAtTime(gain, startTime + 0.018);
  envelope.gain.exponentialRampToValueAtTime(0.0001, endTime);

  oscillator.connect(envelope);
  envelope.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(endTime + 0.02);
}

function playSequence(tones) {
  const context = getAudioContext();
  if (!context) return;

  resumeContext(context, () => {
    tones.forEach((tone) => playTone(context, tone));
  });
}

export function primeSoundEffects() {
  const context = getAudioContext();
  if (!context) return;
  if (context.state === 'suspended') {
    context.resume?.().catch(() => {});
  }
}

export function playStepSound() {
  playSequence([
    { frequency: 520, start: 0, duration: 0.035, type: 'sine', gain: 0.022 },
  ]);
}

export function playTasbihSound() {
  playSequence([
    { frequency: 880, start: 0, duration: 0.028, type: 'square', gain: 0.035 },
    { frequency: 660, start: 0.022, duration: 0.045, type: 'triangle', gain: 0.028 },
  ]);
}

export function playNotificationSound() {
  playSequence([
    { frequency: 740, start: 0, duration: 0.055, type: 'sine', gain: 0.05 },
    { frequency: 988, start: 0.075, duration: 0.075, type: 'sine', gain: 0.045 },
  ]);
}

export function playHighScoreSound() {
  playSequence([
    { frequency: 523.25, start: 0, duration: 0.09, type: 'triangle', gain: 0.1 },
    { frequency: 659.25, start: 0.08, duration: 0.1, type: 'triangle', gain: 0.11 },
    { frequency: 783.99, start: 0.17, duration: 0.16, type: 'triangle', gain: 0.12 },
    { frequency: 1046.5, start: 0.28, duration: 0.18, type: 'sine', gain: 0.08 },
  ]);
}

export function playMidScoreSound() {
  playSequence([
    { frequency: 440, start: 0, duration: 0.08, type: 'triangle', gain: 0.065 },
    { frequency: 554.37, start: 0.085, duration: 0.12, type: 'triangle', gain: 0.07 },
    { frequency: 659.25, start: 0.19, duration: 0.12, type: 'sine', gain: 0.055 },
  ]);
}

export function playLowScoreSound() {
  playSequence([
    { frequency: 330, start: 0, duration: 0.14, type: 'sine', gain: 0.09 },
    { frequency: 246.94, start: 0.12, duration: 0.22, type: 'sine', gain: 0.08 },
    { frequency: 196, start: 0.3, duration: 0.12, type: 'triangle', gain: 0.045 },
  ]);
}

export function playSaveSound() {
  playSequence([
    { frequency: 392, start: 0, duration: 0.055, type: 'sine', gain: 0.055 },
    { frequency: 523.25, start: 0.055, duration: 0.08, type: 'sine', gain: 0.06 },
  ]);
}
