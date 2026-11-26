import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

it('no permite colores hexadecimales en código de src/ fuera de src/tema/', () => {
  const src = fileURLToPath(new URL('../src/', import.meta.url));
  const findings: string[] = [];
  const extensions = /\.(?:[cm]?[jt]sx?|css|scss|sass|less)$/i;

  function scan(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      const relative = path.relative(src, file);
      if (relative === 'tema') continue;
      if (entry.isSymbolicLink())
        throw new Error(`Ruta enlazada no inspeccionada: src/${relative}`);
      if (entry.isDirectory()) {
        scan(file);
      } else if (entry.isFile() && extensions.test(entry.name)) {
        const lines = readFileSync(file, 'utf8').split(/\r?\n/);
        lines.forEach((line, index) => {
          // RGB, RGBA, RRGGBB y RRGGBBAA completos; no prefijos de un valor más largo.
          const colors = line.matchAll(
            /#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})(?![\w-])/gi,
          );
          for (const color of colors)
            findings.push(
              `src/${relative.split(path.sep).join('/')}:${index + 1}:${(color.index ?? 0) + 1} ${color[0]}`,
            );
        });
      }
    }
  }

  scan(src);
  expect(
    findings,
    `Colores fijos fuera de src/tema/ (${findings.length}):\n${findings.join('\n')}`,
  ).toEqual([]);
});
