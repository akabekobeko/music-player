import { SeededRandom } from "./SeededRandom.ts";

/** Samples per second. */
const SAMPLE_RATE = 44_100;

/** Seconds between two tones; eighth notes at 120 beats per minute. */
const STEP_SEC = 0.25;

/** Seconds a tone rings before it is cut. */
const TONE_SEC = 1.2;

/** Tone pitches in hertz: two octaves of the A minor pentatonic scale. */
const PITCHES = [
  220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99,
] as const;

/** Pitches of the sustained background chord in hertz. */
const DRONE = [55, 110, 164.81] as const;

/**
 * Synthesize the audio of the playable demo track as a WAV file.
 *
 * It is a signal tone sequence, not music taken from anywhere: sine tones
 * on a pentatonic scale over a quiet sustained chord, generated from a
 * fixed seed so the result is reproducible.
 *
 * @param durationSec - Length in seconds.
 * @returns WAV file bytes (16 bit stereo PCM at 44.1 kHz).
 */
export const synthesizeDemoToneWav = (durationSec: number): Buffer => {
  const rng = new SeededRandom("tone");
  const frames = Math.round(durationSec * SAMPLE_RATE);
  const left = new Float64Array(frames);
  const right = new Float64Array(frames);

  // Sustained chord with a slow tremolo.
  for (let frame = 0; frame < frames; frame++) {
    const time = frame / SAMPLE_RATE;
    const tremolo = 0.75 + 0.25 * Math.sin(2 * Math.PI * 0.1 * time);
    let value = 0;
    for (const pitch of DRONE) {
      value += Math.sin(2 * Math.PI * pitch * time);
    }

    const sample = (value / DRONE.length) * 0.16 * tremolo;
    left[frame] = sample;
    right[frame] = sample;
  }

  // Decaying tones that walk along the scale and wander between the
  // channels. Every fourth step rests.
  let index = 4;
  const steps = Math.floor(durationSec / STEP_SEC);
  for (let step = 0; step < steps; step++) {
    index = Math.min(PITCHES.length - 1, Math.max(0, index + rng.int(-2, 2)));
    if (step % 4 === 3 && rng.chance(0.7)) {
      continue;
    }

    const pitch = PITCHES[index] ?? 440;
    const pan = 0.5 + 0.4 * Math.sin(step * 0.37);
    const start = Math.round(step * STEP_SEC * SAMPLE_RATE);
    const length = Math.round(TONE_SEC * SAMPLE_RATE);
    for (let offset = 0; offset < length && start + offset < frames; offset++) {
      const time = offset / SAMPLE_RATE;
      // Short attack to avoid a click, then an exponential decay.
      const envelope = Math.min(1, time / 0.004) * Math.exp(-time * 5);
      const sample = Math.sin(2 * Math.PI * pitch * time) * envelope * 0.32;
      const frame = start + offset;
      left[frame] = (left[frame] ?? 0) + sample * (1 - pan);
      right[frame] = (right[frame] ?? 0) + sample * pan;
    }
  }

  const header = 44;
  const buffer = Buffer.alloc(header + frames * 4);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write("WAVEfmt ", 8, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(frames * 4, 40);

  const fadeIn = SAMPLE_RATE;
  const fadeOut = SAMPLE_RATE * 3;
  for (let frame = 0; frame < frames; frame++) {
    const fade = Math.min(1, frame / fadeIn, (frames - 1 - frame) / fadeOut);
    for (const [channel, samples] of [left, right].entries()) {
      const value = Math.max(-1, Math.min(1, (samples[frame] ?? 0) * fade));
      buffer.writeInt16LE(
        Math.round(value * 32_767),
        header + frame * 4 + channel * 2,
      );
    }
  }

  return buffer;
};
