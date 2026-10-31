// tslint:disable
/* eslint-disable */
import React, { useEffect, useRef } from 'react';

/**
 * Properties for the ZoneMusicSynthesizer procedural synth component.
 */
export interface ZoneMusicSynthesizerProps {
  /** Active Zone identifier (1 to 5) determines the tragic procedural composition. */
  readonly zoneId?: number;
  /** Whether playback is currently active. */
  readonly isPlaying: boolean;
  /** Whether the audio output is muted. Defaults to false. */
  readonly isMuted?: boolean;
  /** Master volume level between 0.0 (silent) and 1.0 (full). Defaults to 0.4. */
  readonly volume?: number;
}

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

// Frequency helper for musical notes (A4 = 440 Hz)
function noteFreq(note: string, octave: number): number {
  const noteMap: Record<string, number> = {
    C: 0,
    'C#': 1,
    Db: 1,
    D: 2,
    'D#': 3,
    Eb: 3,
    E: 4,
    F: 5,
    'F#': 6,
    Gb: 6,
    G: 7,
    'G#': 8,
    Ab: 8,
    A: 9,
    'A#': 10,
    Bb: 10,
    B: 11,
  };
  const semitonesFromA4 =
    (octave - 4) * 12 + (noteMap[note] ?? 0) - noteMap['A'];
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

/**
 * Procedural 16-Bit FM Synthesizer Retro Sound Chip Engine (© 1996 AndyCrow Games)
 * Generates 5 distinct, increasingly tragic and desolate musical themes for each zone:
 * 1. Valle Devastado: Melodía melancólica en modo menor con arpegios lentos y flauta triste (~76 bpm)
 * 2. Catacumbas de Cristal Oscuro: Campanas resonantes desoladoras y líneas de bajo opresivas
 * 3. Templo Celestial Profanado: Cánticos armónicos menores disonantes y cuerdas graves
 * 4. Cumbre Glacial Solitaria: Notas de viento desgarrador y sintetizador gélido y punzante
 * 5. El Infierno Abisal de Ghotur: Clímax trágico y fúnebre con órganos oscuros y percusión marcial
 */
export function ZoneMusicSynthesizer({
  zoneId = 1,
  isPlaying,
  isMuted = false,
  volume = 0.38,
}: ZoneMusicSynthesizerProps): React.ReactElement | null {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const schedulerTimerRef = useRef<number | null>(null);
  const activeNodesRef = useRef<Array<AudioNode>>([]);

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const currentZoneRef = useRef(zoneId);
  currentZoneRef.current = zoneId;

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  // Track loop beat counter
  const stepRef = useRef(0);
  const nextNoteTimeRef = useRef(0);

  // Initialize Audio Context & Master Gain
  const getOrCreateContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      return audioCtxRef.current;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as WindowWithWebkitAudio).webkitAudioContext;
    if (!AudioContextClass) return null;

    try {
      const ctx = new AudioContextClass();
      const master = ctx.createGain();
      const effectiveVol = isMutedRef.current ? 0 : Math.max(0, Math.min(1, volumeRef.current));
      master.gain.setValueAtTime(effectiveVol, ctx.currentTime);

      // Master subtle lowpass filter for warm 16-bit soundchip warmth
      const masterFilter = ctx.createBiquadFilter();
      masterFilter.type = 'lowpass';
      masterFilter.frequency.setValueAtTime(5400, ctx.currentTime);
      masterFilter.Q.setValueAtTime(0.7, ctx.currentTime);

      master.connect(masterFilter);
      masterFilter.connect(ctx.destination);

      audioCtxRef.current = ctx;
      masterGainRef.current = master;

      const unlock = () => {
        if (ctx.state === 'suspended') {
          void ctx.resume().catch(() => {});
        }
      };
      window.addEventListener('pointerdown', unlock, { once: true, passive: true });
      window.addEventListener('keydown', unlock, { once: true, passive: true });
      window.addEventListener('touchstart', unlock, { once: true, passive: true });

      return ctx;
    } catch {
      return null;
    }
  };

  // Helper to play a synthesized voice with envelope
  const playSynthVoice = (
    ctx: AudioContext,
    dest: GainNode,
    time: number,
    freq: number,
    duration: number,
    type: OscillatorType,
    vol: number,
    filterFreq = 2200,
  ) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, time);

      // ADSR Envelope
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vol, time + Math.min(0.06, duration * 0.2));
      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, vol * 0.4),
        time + duration * 0.6,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(time);
      osc.stop(time + duration + 0.05);

      activeNodesRef.current.push(osc, gain, filter);
    } catch {}
  };

  // Helper for FM Bell Synthesis (Catacombs / Zone 2)
  const playFmBell = (
    ctx: AudioContext,
    dest: GainNode,
    time: number,
    carrierFreq: number,
    duration: number,
    vol: number,
  ) => {
    try {
      const carrier = ctx.createOscillator();
      const modulator = ctx.createOscillator();
      const modGain = ctx.createGain();
      const carrierGain = ctx.createGain();

      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(carrierFreq, time);

      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(carrierFreq * 2.404, time);

      modGain.gain.setValueAtTime(carrierFreq * 1.5, time);
      modGain.gain.exponentialRampToValueAtTime(0.1, time + duration * 0.8);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);

      carrierGain.gain.setValueAtTime(0.0001, time);
      carrierGain.gain.linearRampToValueAtTime(vol, time + 0.01);
      carrierGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      carrier.connect(carrierGain);
      carrierGain.connect(dest);

      carrier.start(time);
      modulator.start(time);
      carrier.stop(time + duration + 0.05);
      modulator.stop(time + duration + 0.05);

      activeNodesRef.current.push(carrier, modulator, modGain, carrierGain);
    } catch {}
  };

  // Helper for Glacial Wind Noise (Zone 4)
  const playFrostWindNoise = (
    ctx: AudioContext,
    dest: GainNode,
    time: number,
    duration: number,
    vol: number,
  ) => {
    try {
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(600, time);
      bandpass.frequency.exponentialRampToValueAtTime(900, time + duration * 0.5);
      bandpass.frequency.exponentialRampToValueAtTime(450, time + duration);
      bandpass.Q.setValueAtTime(4.0, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vol * 0.4, time + duration * 0.3);
      gain.gain.linearRampToValueAtTime(0.0001, time + duration);

      noise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(dest);

      noise.start(time);
      noise.stop(time + duration + 0.05);
      activeNodesRef.current.push(noise, bandpass, gain);
    } catch {}
  };

  // Helper for Dark Pipe Organ (Zone 5)
  const playDarkOrganChord = (
    ctx: AudioContext,
    dest: GainNode,
    time: number,
    freqs: number[],
    duration: number,
    vol: number,
  ) => {
    try {
      freqs.forEach((freq) => {
        [1, 2].forEach((mult, mIdx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = mIdx === 0 ? 'triangle' : 'sawtooth';
          osc.frequency.setValueAtTime(freq * mult, time);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1400, time);

          gain.gain.setValueAtTime(0.0001, time);
          gain.gain.linearRampToValueAtTime((vol / freqs.length) * (mIdx === 0 ? 0.8 : 0.4), time + 0.1);
          gain.gain.setValueAtTime((vol / freqs.length) * 0.6, time + duration * 0.7);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(dest);

          osc.start(time);
          osc.stop(time + duration + 0.05);
          activeNodesRef.current.push(osc, gain, filter);
        });
      });
    } catch {}
  };

  // Marching Funeral Bass Kick for Zone 5
  const playMartialThud = (
    ctx: AudioContext,
    dest: GainNode,
    time: number,
    vol: number,
  ) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80, time);
      osc.frequency.exponentialRampToValueAtTime(25, time + 0.25);

      gain.gain.setValueAtTime(vol * 0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(time);
      osc.stop(time + 0.28);
      activeNodesRef.current.push(osc, gain);
    } catch {}
  };

  // Step Sequencer scheduler
  useEffect(() => {
    if (!isPlaying) {
      if (schedulerTimerRef.current) {
        clearInterval(schedulerTimerRef.current);
        schedulerTimerRef.current = null;
      }
      return;
    }

    const ctx = getOrCreateContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }

    nextNoteTimeRef.current = ctx.currentTime + 0.05;
    stepRef.current = 0;

    const scheduleNotes = () => {
      if (!audioCtxRef.current || !masterGainRef.current || !isPlayingRef.current) return;
      const c = audioCtxRef.current;
      const m = masterGainRef.current;
      const zone = currentZoneRef.current;

      if (activeNodesRef.current.length > 60) {
        activeNodesRef.current = activeNodesRef.current.slice(-30);
      }

      while (nextNoteTimeRef.current < c.currentTime + 0.4) {
        const time = nextNoteTimeRef.current;
        const step = stepRef.current;

        if (zone === 1) {
          // ===================================================================
          // ZONA 1: VALLE DEVASTADO (Ecos de la aldea orgriniana arrasada)
          // Melodía melancólica en Re menor (D minor), arpegios lentos, flauta triste (~76 bpm)
          // ===================================================================
          const stepDur = 0.20;

          // Arpegio bajo sombrío (D2, A2, F2, D2, Bb1...)
          const bassNotes = [
            noteFreq('D', 2),
            noteFreq('A', 2),
            noteFreq('F', 2),
            noteFreq('D', 2),
            noteFreq('Bb', 1),
            noteFreq('F', 2),
            noteFreq('D', 2),
            noteFreq('A', 2),
          ];
          if (step % 2 === 0) {
            const bFreq = bassNotes[(step / 2) % bassNotes.length];
            playSynthVoice(c, m, time, bFreq, stepDur * 2.2, 'triangle', 0.28, 800);
          }

          // Flauta melancólica de los escombros (notas tristes lentas)
          const melodyPattern: Record<number, { note: string; oct: number; dur: number }> = {
            0: { note: 'D', oct: 4, dur: 0.7 },
            4: { note: 'F', oct: 4, dur: 0.55 },
            8: { note: 'E', oct: 4, dur: 0.7 },
            12: { note: 'D', oct: 4, dur: 0.7 },
            16: { note: 'A', oct: 3, dur: 0.6 },
            20: { note: 'Bb', oct: 3, dur: 0.6 },
            24: { note: 'C', oct: 4, dur: 0.6 },
            28: { note: 'A', oct: 3, dur: 0.75 },
          };
          const melStep = step % 32;
          if (melodyPattern[melStep]) {
            const mData = melodyPattern[melStep];
            playSynthVoice(
              c,
              m,
              time,
              noteFreq(mData.note, mData.oct),
              mData.dur,
              'sine',
              0.24,
              1800,
            );
          }

          nextNoteTimeRef.current += stepDur;
        } else if (zone === 2) {
          // ===================================================================
          // ZONA 2: CATACUMBAS DE CRISTAL OSCURO (El eco de un mundo sepultado)
          // Campanas resonantes desoladoras y líneas de bajo opresivas
          // ===================================================================
          const stepDur = 0.25;

          // Bajo opresivo pedal (C2 / G1)
          if (step % 4 === 0) {
            const bNote = step % 16 < 8 ? noteFreq('C', 2) : noteFreq('G', 1);
            playSynthVoice(c, m, time, bNote, stepDur * 3.8, 'sawtooth', 0.22, 450);
          }

          // Campana de cristal funerario (FM bell chime)
          const bellPattern: Record<number, { note: string; oct: number }> = {
            0: { note: 'Eb', oct: 4 },
            3: { note: 'G', oct: 4 },
            6: { note: 'C', oct: 5 },
            10: { note: 'B', oct: 4 },
            14: { note: 'Ab', oct: 4 },
            18: { note: 'G', oct: 4 },
            22: { note: 'Eb', oct: 4 },
            26: { note: 'D', oct: 4 },
          };
          const bStep = step % 32;
          if (bellPattern[bStep]) {
            const bData = bellPattern[bStep];
            playFmBell(c, m, time, noteFreq(bData.note, bData.oct), 1.2, 0.28);
          }

          nextNoteTimeRef.current += stepDur;
        } else if (zone === 3) {
          // ===================================================================
          // ZONA 3: TEMPLO CELESTIAL PROFANADO (Deidad corrompida y cosmos profanado)
          // Cánticos armónicos menores disonantes y cuerdas graves
          // ===================================================================
          const stepDur = 0.28;

          // Cuerdas graves solemnes
          if (step % 4 === 0) {
            const chordRoot = step % 16 < 8 ? noteFreq('E', 2) : noteFreq('F', 2);
            playSynthVoice(c, m, time, chordRoot, stepDur * 3.6, 'sawtooth', 0.24, 600);
            playSynthVoice(c, m, time, chordRoot * 1.5, stepDur * 3.4, 'triangle', 0.18, 900);
          }

          // Cántico disonante menor (tritono y séptima menor)
          const chantNotes: Record<number, { note: string; oct: number }> = {
            0: { note: 'B', oct: 3 },
            2: { note: 'C', oct: 4 },
            4: { note: 'Bb', oct: 3 },
            8: { note: 'A', oct: 3 },
            12: { note: 'F', oct: 3 },
            16: { note: 'G', oct: 3 },
            20: { note: 'E', oct: 3 },
            24: { note: 'Eb', oct: 3 },
          };
          const cStep = step % 32;
          if (chantNotes[cStep]) {
            const cData = chantNotes[cStep];
            playSynthVoice(
              c,
              m,
              time,
              noteFreq(cData.note, cData.oct),
              0.8,
              'sawtooth',
              0.22,
              1200,
            );
          }

          nextNoteTimeRef.current += stepDur;
        } else if (zone === 4) {
          // ===================================================================
          // ZONA 4: CUMBRE GLACIAL SOLITARIA (Soledad, ventisca y dolor)
          // Notas de viento desgarrador y sintetizador gélido y punzante
          // ===================================================================
          const stepDur = 0.32;

          // Ráfaga de viento gélido continuo
          if (step % 8 === 0) {
            playFrostWindNoise(c, m, time, stepDur * 7.5, 0.25);
          }

          // Bajo gélido de permafrost
          if (step % 4 === 0) {
            const iceBass = step % 16 < 8 ? noteFreq('F', 1) : noteFreq('C', 1);
            playSynthVoice(c, m, time, iceBass, stepDur * 3.8, 'triangle', 0.3, 350);
          }

          // Sintetizador gélido y solitario (notas altas de hielo)
          const frostLead: Record<number, { note: string; oct: number }> = {
            0: { note: 'E', oct: 5 },
            4: { note: 'B', oct: 4 },
            8: { note: 'G', oct: 4 },
            12: { note: 'F#', oct: 4 },
            16: { note: 'E', oct: 4 },
            20: { note: 'D', oct: 5 },
            24: { note: 'C', oct: 5 },
            28: { note: 'B', oct: 4 },
          };
          const fStep = step % 32;
          if (frostLead[fStep]) {
            const fData = frostLead[fStep];
            playSynthVoice(
              c,
              m,
              time,
              noteFreq(fData.note, fData.oct),
              0.9,
              'sine',
              0.24,
              2800,
            );
          }

          nextNoteTimeRef.current += stepDur;
        } else {
          // ===================================================================
          // ZONA 5: EL INFIERNO ABISAL DE GHOTUR (Clímax trágico y fúnebre final)
          // Órganos oscuros y percusión marcial pesada para la venganza final
          // ===================================================================
          const stepDur = 0.22;

          // Percusión marcial pesada (Timbal fúnebre en beats 0, 4, 8, 12)
          if (step % 4 === 0) {
            playMartialThud(c, m, time, 0.36);
          }

          // Órgano gótico fúnebre
          if (step % 8 === 0) {
            const organStep = Math.floor(step / 8) % 4;
            let chordFreqs: number[] = [];
            if (organStep === 0) {
              chordFreqs = [noteFreq('C', 3), noteFreq('Eb', 3), noteFreq('G', 3)];
            } else if (organStep === 1) {
              chordFreqs = [noteFreq('Ab', 2), noteFreq('C', 3), noteFreq('Eb', 3)];
            } else if (organStep === 2) {
              chordFreqs = [noteFreq('F', 2), noteFreq('Ab', 2), noteFreq('C', 3)];
            } else {
              chordFreqs = [noteFreq('G', 2), noteFreq('B', 2), noteFreq('D', 3)];
            }
            playDarkOrganChord(c, m, time, chordFreqs, stepDur * 7.5, 0.36);
          }

          // Lead agudo fúnebre desgarrador
          const doomLead: Record<number, { note: string; oct: number }> = {
            2: { note: 'G', oct: 4 },
            4: { note: 'Ab', oct: 4 },
            6: { note: 'G', oct: 4 },
            10: { note: 'F', oct: 4 },
            12: { note: 'Eb', oct: 4 },
            14: { note: 'D', oct: 4 },
            18: { note: 'C', oct: 4 },
            22: { note: 'B', oct: 3 },
          };
          const dStep = step % 32;
          if (doomLead[dStep]) {
            const dData = doomLead[dStep];
            playSynthVoice(
              c,
              m,
              time,
              noteFreq(dData.note, dData.oct),
              0.55,
              'sawtooth',
              0.22,
              2000,
            );
          }

          nextNoteTimeRef.current += stepDur;
        }

        stepRef.current++;
      }
    };

    schedulerTimerRef.current = window.setInterval(scheduleNotes, 45);

    return () => {
      if (schedulerTimerRef.current) {
        clearInterval(schedulerTimerRef.current);
        schedulerTimerRef.current = null;
      }
    };
  }, [isPlaying, zoneId]);

  // Handle Mute & Volume updates dynamically
  useEffect(() => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (ctx && master && ctx.state !== 'closed') {
      const target = isMuted ? 0 : Math.max(0, Math.min(1, volume));
      master.gain.setTargetAtTime(target, ctx.currentTime, 0.05);
    }
  }, [isMuted, volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (schedulerTimerRef.current) {
        clearInterval(schedulerTimerRef.current);
        schedulerTimerRef.current = null;
      }
      activeNodesRef.current.forEach((node) => {
        try {
          (node as any).stop?.();
          node.disconnect();
        } catch {}
      });
      activeNodesRef.current = [];
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        void audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  return null;
}

export default ZoneMusicSynthesizer;
