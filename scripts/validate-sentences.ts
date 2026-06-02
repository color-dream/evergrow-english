/**
 * 校验所有句子本 JSON 的格式和内容完整性。
 *
 * 用法：bun run scripts/validate-sentences.ts
 */

import fs from "node:fs";
import path from "node:path";
import { validateSentenceBook } from "../src/lib/sentence-validator";
import type { SentenceBookJSON } from "../src/types/sentence";

const SENTENCES_DIR = path.resolve(__dirname, "../src/assets/sentences");

function main() {
  const files = fs.readdirSync(SENTENCES_DIR).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.log("⚠️  未找到句子本 JSON 文件");
    return;
  }

  let totalErrors = 0;
  let totalSentences = 0;
  let totalLessons = 0;

  for (const file of files) {
    const filePath = path.join(SENTENCES_DIR, file);
    const raw = fs.readFileSync(filePath, "utf-8");

    let json: SentenceBookJSON;
    try {
      json = JSON.parse(raw);
    } catch (e) {
      console.error(`❌ ${file}: JSON 解析失败 — ${(e as Error).message}`);
      totalErrors++;
      continue;
    }

    const errors = validateSentenceBook(json, file);
    const sentenceCount = json.lessons?.reduce(
      (sum, l) => sum + (l.sentences?.length ?? 0),
      0,
    ) ?? 0;
    const lessonCount = json.lessons?.length ?? 0;

    totalSentences += sentenceCount;
    totalLessons += lessonCount;

    if (errors.length === 0) {
      console.log(`✅ ${file}: ${lessonCount} 课, ${sentenceCount} 句 — 全部通过`);
    } else {
      console.error(`❌ ${file}: ${errors.length} 个错误`);
      for (const err of errors) {
        const loc = [err.lessonId, err.sentenceId].filter(Boolean).join(" → ");
        console.error(`   - ${loc ? loc + ": " : ""}${err.field}: ${err.message}`);
      }
      totalErrors += errors.length;
    }
  }

  console.log(`\n📊 总计: ${files.length} 个文件, ${totalLessons} 课, ${totalSentences} 句`);
  if (totalErrors > 0) {
    console.error(`❌ 共 ${totalErrors} 个错误`);
    process.exit(1);
  } else {
    console.log("✅ 全部校验通过");
  }
}

main();
