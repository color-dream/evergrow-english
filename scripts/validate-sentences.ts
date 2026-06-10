/**
 * 校验所有课程 JSON 文件的格式和内容完整性。
 *
 * 用法：bun run scripts/validate-sentences.ts
 */

import fs from "node:fs";
import path from "node:path";
import { validateCourseFile } from "../src/lib/sentence-validator";
import type { StatementEntry } from "../src/types/sentence";

const SENTENCES_DIR = path.resolve(__dirname, "../src/assets/sentences");

/** 递归收集所有 JSON 文件（返回相对于 SENTENCES_DIR 的路径） */
function collectJsonFiles(dir: string): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...collectJsonFiles(full));
    } else if (entry.name.endsWith(".json")) {
      result.push(path.relative(SENTENCES_DIR, full));
    }
  }
  return result;
}

function main() {
  const files = collectJsonFiles(SENTENCES_DIR).sort();

  if (files.length === 0) {
    console.log("⚠️  未找到课程 JSON 文件");
    return;
  }

  let totalErrors = 0;
  let totalStatements = 0;

  for (const file of files) {
    const filePath = path.join(SENTENCES_DIR, file);
    const raw = fs.readFileSync(filePath, "utf-8");

    let statements: StatementEntry[];
    try {
      statements = JSON.parse(raw);
    } catch (e) {
      console.error(`❌ ${file}: JSON 解析失败 — ${(e as Error).message}`);
      totalErrors++;
      continue;
    }

    const errors = validateCourseFile(statements, file);

    totalStatements += statements.length;

    if (errors.length === 0) {
      console.log(`✅ ${file}: ${statements.length} 条语句 — 全部通过`);
    } else {
      console.error(`❌ ${file}: ${errors.length} 个错误`);
      for (const err of errors) {
        const loc = err.index !== undefined ? `[${err.index}] ` : "";
        console.error(`   - ${loc}${err.field}: ${err.message}`);
      }
      totalErrors += errors.length;
    }
  }

  console.log(`\n📊 总计: ${files.length} 个课程文件, ${totalStatements} 条语句`);
  if (totalErrors > 0) {
    console.error(`❌ 共 ${totalErrors} 个错误`);
    process.exit(1);
  } else {
    console.log("✅ 全部校验通过");
  }
}

main();
