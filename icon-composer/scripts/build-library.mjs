import { copyFile } from 'node:fs/promises';
await Promise.all([
  copyFile('src/theme.css', 'dist/elements/theme.css'),
  copyFile('src/icon-composer.d.ts', 'dist/elements/icon-composer.d.ts'),
  copyFile('THIRD_PARTY_NOTICES.md', 'dist/elements/THIRD_PARTY_NOTICES.md'),
]);
