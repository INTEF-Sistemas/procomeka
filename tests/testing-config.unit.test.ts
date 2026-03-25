import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';

describe('Configuración de testing del monorepo', () => {
  test('el script test de Bun está acotado y no recoge e2e de Playwright', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
      scripts: Record<string, string>;
    };

    expect(pkg.scripts.test).toBe('bun test --coverage tests');
    expect(pkg.scripts['test:e2e']).toContain('playwright test');
  });

  test('los tests E2E usan extensión .e2e.ts', () => {
    expect(existsSync('e2e/example.e2e.ts')).toBe(true);
    expect(existsSync('e2e/example.spec.ts')).toBe(false);
  });
});
