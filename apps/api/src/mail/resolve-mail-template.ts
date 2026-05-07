import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Resolves a Handlebars file under `src/mail/templates/{module}/` for dev,
 * or `dist/src/mail/templates/{module}/` after `nest build` (assets copy).
 */
export function resolveMailTemplatePath(module: string, file: string): string {
  const segments = ['mail', 'templates', module, file];
  const distPath = join(process.cwd(), 'dist', 'src', ...segments);
  const srcPath = join(process.cwd(), 'src', ...segments);
  if (existsSync(distPath)) return distPath;
  return srcPath;
}
