/**
 * tests/unit/noNetwork.test.ts — Strict offline execution check (CLAUDE.md rule 2).
 * Verifies that src/ contains zero external network URLs (http:// or https:// outside localhost).
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function getAllSourceFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllSourceFiles(filePath, fileList);
    } else if (/\.(ts|tsx|js|jsx|css|html)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

describe('Offline Integrity (CLAUDE.md Rule 2)', () => {
  it('contains no external http:// or https:// URLs in src/ code', () => {
    const srcDir = path.resolve(__dirname, '../../src');
    const files = getAllSourceFiles(srcDir);
    const violations: Array<{ file: string; line: number; match: string }> = [];

    const urlRegex = /https?:\/\/(?!localhost|127\.0\.0\.1)[^\s"'`<>]+/g;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Strip single line comments
        const cleanLine = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
        const matches = cleanLine.match(urlRegex);
        if (matches) {
          for (const match of matches) {
            violations.push({
              file: path.relative(srcDir, file),
              line: index + 1,
              match,
            });
          }
        }
      });
    }

    expect(
      violations,
      `Found external network calls in src/: ${JSON.stringify(violations, null, 2)}`,
    ).toHaveLength(0);
  });
});
