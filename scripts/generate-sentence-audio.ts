/**
 * 句子 TTS 音频预生成脚本。
 *
 * 用法：
 *   bun run scripts/generate-sentence-audio.ts              # 全部生成
 *   bun run scripts/generate-sentence-audio.ts --missing-only # 只生成缺失的
 *
 * 依赖 edge-tts (Python CLI)：
 *   pip install edge-tts
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const SENTENCES_DIR = path.resolve(__dirname, "../src/assets/sentences");
const AUDIO_DIR = path.resolve(__dirname, "../public/audio/sentences");
const VOICE = "en-US-AriaNeural"; // 美音女声，自然流畅

interface SentenceEntry {
  uuid: string;
  text: string;
}

function collectSentences(): SentenceEntry[] {
  const files = fs
    .readdirSync(SENTENCES_DIR)
    .filter((f) => f.endsWith(".json"));
  const sentences: SentenceEntry[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(SENTENCES_DIR, file), "utf-8");
    const json = JSON.parse(raw);
    for (const lesson of json.lessons ?? []) {
      for (const s of lesson.sentences ?? []) {
        if (s.uuid && s.text) {
          sentences.push({ uuid: s.uuid, text: s.text });
        }
      }
    }
  }

  return sentences;
}

function audioExists(uuid: string): boolean {
  return fs.existsSync(path.join(AUDIO_DIR, `${uuid}.mp3`));
}

function generateAudio(uuid: string, text: string): boolean {
  const outPath = path.join(AUDIO_DIR, `${uuid}.mp3`);

  // 清理文本中的特殊字符，防止 shell 注入
  const safeText = text.replace(/"/g, '\\"').replace(/`/g, "\\`").replace(/\$/g, "\\$");

  try {
    // 使用 edge-tts 生成 MP3
    execSync(
      `edge-tts --voice "${VOICE}" --text "${safeText}" --write-media "${outPath}"`,
      {
        stdio: "pipe",
        timeout: 30_000,
      },
    );
    return true;
  } catch (e) {
    console.error(`  ❌ TTS 生成失败: ${uuid} — "${text.slice(0, 50)}..."`);
    return false;
  }
}

// ── Main ──

function main() {
  const missingOnly = process.argv.includes("--missing-only");

  // 确保目标目录存在
  fs.mkdirSync(AUDIO_DIR, { recursive: true });

  // 检查 edge-tts 是否可用
  try {
    execSync("edge-tts --version", { stdio: "pipe" });
  } catch {
    console.error("❌ 未找到 edge-tts，请先安装：pip install edge-tts");
    process.exit(1);
  }

  const sentences = collectSentences();
  console.log(`📝 找到 ${sentences.length} 个句子`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const { uuid, text } of sentences) {
    if (missingOnly && audioExists(uuid)) {
      skipped++;
      continue;
    }

      const shortText =
text.length > 40 ? text.slice(0, 40) + "..." : text;
    process.stdout.write(`  🔊 [${uuid.slice(0, 8)}...] ${shortText} ... `);

    if (generateAudio(uuid, text)) {
      console.log("✅");
      generated++;
    } else {
      failed++;
    }

    // 节流，避免被限流
    if (generated > 0 && generated % 10 === 0) {
      const waitMs = 2000;
      console.log(`  ⏳ 等待 ${waitMs / 1000}s（节流）...`);
      Bun.sleepSync?.(waitMs);
    }
  }

  console.log(
    `\n📊 完成: ${generated} 生成, ${skipped} 跳过, ${failed} 失败`,
  );
}

main();
