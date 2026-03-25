// Programmatic audio generation for retro sound effects and music
// Generates simple waveform-based sounds using Web Audio API

export class AudioGenerator {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  // Generate a buffer from sample data
  private createBuffer(samples: Float32Array, sampleRate = 44100): AudioBuffer {
    const ctx = this.getContext();
    const buffer = ctx.createBuffer(1, samples.length, sampleRate);
    buffer.copyToChannel(new Float32Array(samples.buffer as ArrayBuffer), 0);
    return buffer;
  }

  // Simple square wave tone
  generateTone(freq: number, duration: number, volume = 0.3, type: 'square' | 'sine' | 'sawtooth' | 'triangle' = 'square'): Float32Array {
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);
    const samples = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const phase = (t * freq) % 1;
      let val = 0;
      switch (type) {
        case 'square': val = phase < 0.5 ? 1 : -1; break;
        case 'sine': val = Math.sin(2 * Math.PI * phase); break;
        case 'sawtooth': val = 2 * phase - 1; break;
        case 'triangle': val = 4 * Math.abs(phase - 0.5) - 1; break;
      }
      // Envelope
      const env = Math.min(1, (numSamples - i) / (sampleRate * 0.05));
      const attack = Math.min(1, i / (sampleRate * 0.01));
      samples[i] = val * volume * env * attack;
    }
    return samples;
  }

  // Generate sword swing sound
  generateSwordSwing(): Float32Array {
    const sampleRate = 44100;
    const duration = 0.15;
    const numSamples = Math.floor(sampleRate * duration);
    const samples = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      const t = i / numSamples;
      const freq = 200 + t * 800;
      const phase = (i / sampleRate * freq) % 1;
      const noise = Math.random() * 0.3;
      samples[i] = ((phase < 0.5 ? 0.4 : -0.4) + noise) * (1 - t) * 0.4;
    }
    return samples;
  }

  // Generate hit sound
  generateHit(): Float32Array {
    const sampleRate = 44100;
    const duration = 0.2;
    const numSamples = Math.floor(sampleRate * duration);
    const samples = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      const t = i / numSamples;
      const noise = Math.random() * 2 - 1;
      const freq = 150 * (1 - t * 0.5);
      const square = ((i / sampleRate * freq) % 1) < 0.5 ? 1 : -1;
      samples[i] = (noise * 0.3 + square * 0.4) * (1 - t) * 0.5;
    }
    return samples;
  }

  // Generate item pickup jingle
  generatePickup(): Float32Array {
    const notes = [523, 659, 784]; // C5, E5, G5
    const noteLen = 0.08;
    const total = notes.length * noteLen;
    const sampleRate = 44100;
    const samples = new Float32Array(Math.floor(sampleRate * total));
    for (let n = 0; n < notes.length; n++) {
      const tone = this.generateTone(notes[n], noteLen, 0.3, 'square');
      const offset = Math.floor(n * noteLen * sampleRate);
      for (let i = 0; i < tone.length && offset + i < samples.length; i++) {
        samples[offset + i] += tone[i];
      }
    }
    return samples;
  }

  // Generate blaster shot
  generateBlasterShot(): Float32Array {
    const sampleRate = 44100;
    const duration = 0.15;
    const numSamples = Math.floor(sampleRate * duration);
    const samples = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      const t = i / numSamples;
      const freq = 800 - t * 600;
      const phase = (i / sampleRate * freq) % 1;
      samples[i] = (phase < 0.3 ? 0.5 : -0.5) * (1 - t) * 0.35;
    }
    return samples;
  }

  // Generate portal/warp sound
  generatePortal(): Float32Array {
    const sampleRate = 44100;
    const duration = 0.6;
    const numSamples = Math.floor(sampleRate * duration);
    const samples = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      const t = i / numSamples;
      const freq = 200 + Math.sin(t * 20) * 300;
      const phase = (i / sampleRate * freq) % 1;
      samples[i] = Math.sin(2 * Math.PI * phase) * (1 - t) * 0.3;
    }
    return samples;
  }

  // Generate a simple music loop (returns raw samples)
  generateMusicLoop(style: 'title' | 'village' | 'dungeon' | 'digital' | 'boss' | 'victory'): Float32Array {
    const sampleRate = 44100;
    const bpm = style === 'boss' ? 160 : style === 'title' ? 120 : style === 'village' ? 110 : 100;
    const beatLen = 60 / bpm;

    let notes: number[][] = [];
    let waveType: 'square' | 'triangle' | 'sawtooth' = 'square';
    let loopBeats = 16;

    switch (style) {
      case 'title':
        notes = [[262,330],[330,392],[392,523],[523,659],[392,523],[330,392],[262,330],[196,262],
                 [262,330],[330,392],[440,523],[523,659],[440,523],[392,523],[330,392],[262,330]];
        waveType = 'square';
        break;
      case 'village':
        notes = [[330,0],[392,0],[440,0],[392,0],[330,0],[294,0],[262,0],[294,0],
                 [330,0],[392,0],[440,0],[523,0],[440,0],[392,0],[330,0],[262,0]];
        waveType = 'triangle';
        break;
      case 'dungeon':
        notes = [[131,0],[0,0],[165,0],[0,0],[131,0],[147,0],[0,0],[131,0],
                 [123,0],[0,0],[131,0],[0,0],[110,0],[0,0],[131,0],[0,0]];
        waveType = 'square';
        break;
      case 'digital':
        notes = [[523,0],[0,0],[659,0],[0,0],[784,0],[0,0],[659,0],[523,0],
                 [392,0],[0,0],[523,0],[0,0],[659,0],[784,0],[0,0],[523,0]];
        waveType = 'sawtooth';
        break;
      case 'boss':
        notes = [[196,0],[233,0],[262,0],[233,0],[196,0],[196,0],[262,0],[294,0],
                 [196,0],[233,0],[262,0],[330,0],[294,0],[262,0],[233,0],[196,0]];
        waveType = 'square';
        break;
      case 'victory':
        loopBeats = 8;
        notes = [[523,659],[659,784],[784,988],[988,1175],[784,988],[659,784],[523,659],[523,659]];
        waveType = 'square';
        break;
    }

    const totalSamples = Math.floor(sampleRate * beatLen * loopBeats);
    const samples = new Float32Array(totalSamples);

    for (let b = 0; b < loopBeats && b < notes.length; b++) {
      const [freq1, freq2] = notes[b];
      const offset = Math.floor(b * beatLen * sampleRate);
      const noteDuration = beatLen * 0.8;
      const noteLen = Math.floor(sampleRate * noteDuration);

      for (let i = 0; i < noteLen && offset + i < totalSamples; i++) {
        const t = i / noteLen;
        const env = Math.min(1, i / (sampleRate * 0.01)) * Math.min(1, (noteLen - i) / (sampleRate * 0.05));
        let val = 0;
        if (freq1 > 0) {
          const phase1 = (i / sampleRate * freq1) % 1;
          switch (waveType) {
            case 'square': val += phase1 < 0.5 ? 1 : -1; break;
            case 'triangle': val += 4 * Math.abs(phase1 - 0.5) - 1; break;
            case 'sawtooth': val += 2 * phase1 - 1; break;
          }
        }
        if (freq2 > 0) {
          const phase2 = (i / sampleRate * freq2) % 1;
          val += phase2 < 0.5 ? 0.5 : -0.5;
        }
        samples[offset + i] += val * env * 0.2;
      }
    }

    return samples;
  }

  // Convert Float32Array to base64 WAV for Phaser loading
  samplesToWavBase64(samples: Float32Array, sampleRate = 44100): string {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = samples.length * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return 'data:audio/wav;base64,' + btoa(binary);
  }
}

export const audioGen = new AudioGenerator();
