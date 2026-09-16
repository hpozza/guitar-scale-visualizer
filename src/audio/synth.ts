/**
 * A tiny plucked-string voice built with the Web Audio API.
 *
 * Nothing is loaded from the network: the tone is two detuned oscillators
 * through a decaying filter, so the app still works offline and with no
 * samples. The context is created on first use because browsers require a
 * gesture before audio can start.
 */

import { midiToFrequency } from '../theory/notes';

let context: AudioContext | null = null;
let master: GainNode | null = null;

type AudioContextConstructor = new () => AudioContext;

function audioContextConstructor(): AudioContextConstructor | null {
  const scope = window as unknown as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  return scope.AudioContext ?? scope.webkitAudioContext ?? null;
}

export function isAudioSupported(): boolean {
  return audioContextConstructor() !== null;
}

function ensureContext(): AudioContext | null {
  if (context) return context;
  const Constructor = audioContextConstructor();
  if (!Constructor) return null;
  try {
    context = new Constructor();
    master = context.createGain();
    master.gain.value = 0.22;
    master.connect(context.destination);
    return context;
  } catch {
    context = null;
    master = null;
    return null;
  }
}

/** Pluck a single note. Returns false when audio is unavailable. */
export function playNote(midi: number, duration = 1.15): boolean {
  const ctx = ensureContext();
  if (!ctx || !master) return false;
  if (ctx.state === 'suspended') void ctx.resume();

  const now = ctx.currentTime;
  const frequency = midiToFrequency(midi);

  const voice = ctx.createGain();
  voice.gain.setValueAtTime(0, now);
  voice.gain.linearRampToValueAtTime(0.9, now + 0.006);
  voice.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.8;
  filter.frequency.setValueAtTime(Math.min(9000, frequency * 9), now);
  filter.frequency.exponentialRampToValueAtTime(Math.max(320, frequency * 2), now + duration);

  const fundamental = ctx.createOscillator();
  fundamental.type = 'triangle';
  fundamental.frequency.value = frequency;

  const body = ctx.createOscillator();
  body.type = 'sawtooth';
  body.frequency.value = frequency * 1.003;
  const bodyGain = ctx.createGain();
  bodyGain.gain.value = 0.28;

  fundamental.connect(filter);
  body.connect(bodyGain).connect(filter);
  filter.connect(voice).connect(master);

  fundamental.start(now);
  body.start(now);
  fundamental.stop(now + duration + 0.05);
  body.stop(now + duration + 0.05);
  return true;
}

/** Play the notes of a chord or shape one after another. */
export function playSequence(midiNotes: number[], gap = 0.075): boolean {
  if (!ensureContext()) return false;
  midiNotes.forEach((midi, index) => {
    window.setTimeout(() => playNote(midi, 1.4), index * gap * 1000);
  });
  return true;
}

export function suspendAudio(): void {
  if (context && context.state === 'running') void context.suspend();
}
