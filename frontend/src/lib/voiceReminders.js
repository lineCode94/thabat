import { isSoundEnabled } from './soundEffects';

let voicesReadyPromise = null;
const activeUtterances = new Set();

function getSpeechSynthesis() {
  if (typeof window === 'undefined') return null;
  return window.speechSynthesis ?? null;
}

function waitForVoices(synthesis) {
  const voices = synthesis.getVoices();
  if (voices.length > 0) return Promise.resolve(voices);

  if (!voicesReadyPromise) {
    voicesReadyPromise = new Promise((resolve) => {
      const timeout = window.setTimeout(() => {
        synthesis.removeEventListener?.('voiceschanged', handleVoicesChanged);
        resolve(synthesis.getVoices());
      }, 700);

      function handleVoicesChanged() {
        window.clearTimeout(timeout);
        synthesis.removeEventListener?.('voiceschanged', handleVoicesChanged);
        resolve(synthesis.getVoices());
      }

      synthesis.addEventListener?.('voiceschanged', handleVoicesChanged);
      synthesis.onvoiceschanged = handleVoicesChanged;
    });
  }

  return voicesReadyPromise;
}

function pickArabicVoice(voices) {
  const arabicVoices = voices.filter((voice) => (
    voice.lang?.toLowerCase().startsWith('ar')
    || /arabic|arab/i.test(`${voice.name} ${voice.lang}`)
  ));

  const maleNamePattern = /male|man|masculine|naayf|nayef|naif|maged|majed|tariq|tarik|khalid|ahmed|mohamed|muhammad|omar|ali|youssef|hassan/i;
  const femaleNamePattern = /female|woman|hoda|salma|laila|layla|mona|amira|fatima|zira|susan|hedda|samantha|sabina/i;

  return arabicVoices.find((voice) => maleNamePattern.test(voice.name))
    ?? voices.find((voice) => maleNamePattern.test(`${voice.name} ${voice.lang}`))
    ?? arabicVoices.find((voice) => !femaleNamePattern.test(voice.name))
    ?? arabicVoices[0]
    ?? null;
}

export async function speakArabicReminder(text) {
  const synthesis = getSpeechSynthesis();
  if (!synthesis || !isSoundEnabled()) return false;

  const voices = synthesis.getVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ar-EG';
  utterance.rate = 0.82;
  utterance.pitch = 0.42;
  utterance.volume = 0.9;

  const voice = pickArabicVoice(voices);
  if (voice) utterance.voice = voice;

  utterance.onend = () => activeUtterances.delete(utterance);
  utterance.onerror = () => activeUtterances.delete(utterance);
  synthesis.cancel();
  activeUtterances.add(utterance);
  synthesis.speak(utterance);
  waitForVoices(synthesis).then((loadedVoices) => {
    if (voice || loadedVoices.length === 0 || synthesis.speaking) return;
    const delayedVoice = pickArabicVoice(loadedVoices);
    if (!delayedVoice) return;
    const delayedUtterance = new SpeechSynthesisUtterance(text);
    delayedUtterance.lang = 'ar-EG';
    delayedUtterance.rate = 0.82;
    delayedUtterance.pitch = 0.42;
    delayedUtterance.volume = 0.9;
    delayedUtterance.voice = delayedVoice;
    delayedUtterance.onend = () => activeUtterances.delete(delayedUtterance);
    delayedUtterance.onerror = () => activeUtterances.delete(delayedUtterance);
    activeUtterances.add(delayedUtterance);
    synthesis.speak(delayedUtterance);
  }).catch(() => {});
  return true;
}
