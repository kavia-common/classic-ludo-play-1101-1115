/**
 * Sound Service for the Ludo Game
 * 
 * Uses the Web Audio API to generate procedural sound effects.
 * No external audio files needed - all sounds are synthesized.
 * Supports global enable/disable via the soundEnabled flag.
 */

let audioContext = null;

/**
 * Get or create the AudioContext singleton.
 * @returns {AudioContext|null} The audio context, or null if unavailable
 */
function getAudioContext() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      // Web Audio API not supported
      return null;
    }
  }
  // Resume if suspended (browsers require user gesture)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

/**
 * Play a simple tone.
 * @param {number} frequency - Frequency in Hz
 * @param {number} duration - Duration in seconds
 * @param {string} type - Oscillator type ('sine', 'square', 'triangle', 'sawtooth')
 * @param {number} volume - Volume (0-1)
 */
function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

// PUBLIC_INTERFACE
/**
 * Play the dice roll sound effect - a rapid series of clicks.
 */
export function playDiceRollSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Series of short clicks to simulate dice tumbling
  for (let i = 0; i < 8; i++) {
    const time = ctx.currentTime + i * 0.07;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(200 + Math.random() * 400, time);

    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  }
}

// PUBLIC_INTERFACE
/**
 * Play a single token step sound - a short tap.
 */
export function playTokenStepSound() {
  playTone(600, 0.08, 'triangle', 0.15);
}

// PUBLIC_INTERFACE
/**
 * Play token capture sound effect - dramatic descending tone.
 */
export function playCaptureSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);

  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.4);
}

// PUBLIC_INTERFACE
/**
 * Play win/victory fanfare sound effect.
 */
export function playWinSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const time = ctx.currentTime + i * 0.15;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.3);
  });
}

// PUBLIC_INTERFACE
/**
 * Play token exit base sound - ascending cheerful tone.
 */
export function playExitBaseSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);

  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.25);
}

// PUBLIC_INTERFACE
/**
 * Play token reaching home sound effect.
 */
export function playHomeSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [784, 988, 1175]; // G5, B5, D6
  notes.forEach((freq, i) => {
    const time = ctx.currentTime + i * 0.12;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.2);
  });
}

// PUBLIC_INTERFACE
/**
 * Play a click/tap UI sound.
 */
export function playClickSound() {
  playTone(1000, 0.05, 'sine', 0.1);
}
