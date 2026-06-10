/** 共享 AudioContext（延迟初始化，避免浏览器 autoplay 限制） */
let audioCtx: AudioContext | null = null;

/** 播放正确输入提示音 */
export function playCorrectSound() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(1760, audioCtx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.12);
  } catch { /* 静默 */ }
}

/** 播放错误输入提示音 */
export function playWrongSound() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "triangle";
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(120, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.15);
  } catch { /* 静默 */ }
}

/** 播放完美完成庆祝音效 */
export function playCompleteSound() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const t = audioCtx.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const osc = audioCtx!.createOscillator();
      const gain = audioCtx!.createGain();
      osc.connect(gain);
      gain.connect(audioCtx!.destination);
      osc.type = "sine";
      const start = t + i * 0.08;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.07, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      osc.start(start);
      osc.stop(start + 0.18);
    });
  } catch { /* 静默 */ }
}
