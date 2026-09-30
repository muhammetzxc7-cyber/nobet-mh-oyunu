export class HospitalAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private nextBeat = 0;
  private nextAlarm = 0;
  private enabled = true;
  async start() {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') await this.context.resume();
  }
  setEnabled(on: boolean) {
    this.enabled = on;
    if (this.context && this.master) this.master.gain.setTargetAtTime(on ? 0.22 : 0, this.context.currentTime, 0.015);
  }
  private tone(frequency: number, time: number, duration: number, volume: number, type: OscillatorType = 'sine') {
    if (!this.context || !this.master || !this.enabled) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    oscillator.connect(gain); gain.connect(this.master);
    oscillator.start(time); oscillator.stop(time + duration + 0.02);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  tick(hr: number, critical: boolean, running: boolean) {
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    this.master.gain.setTargetAtTime(running && this.enabled ? 0.22 : 0, now, 0.025);
    if (!running || !this.enabled) { this.nextBeat = now; this.nextAlarm = now; return; }
    if (now >= this.nextBeat) { this.tone(850, now, 0.10, 0.24); this.nextBeat = now + 60 / hr; }
    if (critical && now >= this.nextAlarm) {
      [0, 0.20, 0.4].forEach((delay, i) => this.tone(i === 1 ? 740 : 980, now + delay, 0.16, 0.34, 'triangle'));
      this.nextAlarm = now + 1.9;
    }
  }
  success() {
    if (!this.context) return;
    const now = this.context.currentTime;
    [523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, now + i * 0.12, 0.3, 0.2));
  }
  dispose() { this.context?.close(); }
}
