// Double-beep via the Web Audio API, so no audio file asset is needed.
export function playAlarm(): void {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    [0, 0.25].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);
      osc.start(now + delay);
      osc.stop(now + delay + 0.2);
    });
  } catch {
    // AudioContext unavailable (e.g. no user gesture yet) — skip silently.
  }
}
