// Generates llms.txt and llms-full.txt from README.md and docs/*.md.
// Run via `pnpm generate:llms` (also wired into `prepublishOnly`).
// Spec: https://llmstxt.org

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');

const pkg = JSON.parse(read('package.json'));
const readme = read('README.md');
const advanced = read('docs/advanced.md');

const repoUrl = `https://github.com/${pkg.repository}`;
const rawUrl = `${repoUrl.replace('github.com', 'raw.githubusercontent.com')}/main`;

// llms.txt — short index for LLM agents
const llmsTxt = `# ${pkg.name}

> ${pkg.description}

## Docs

- [README](${rawUrl}/README.md) — installation, quick start, ecommerce API, Safari ITP proxy, provider props
- [Advanced usage](${rawUrl}/docs/advanced.md) — typed goals, wrapper hook pattern, domain-to-product mapping, debug mode

## Optional

- [Full documentation](${rawUrl}/llms-full.txt) — README and advanced guide in a single file
`;

// llms-full.txt — everything concatenated for one-shot loading
const llmsFullTxt = `# ${pkg.name}

> ${pkg.description}

> Generated from README.md and docs/advanced.md. Do not edit by hand.

---

${readme}

---

${advanced}
`;

writeFileSync(resolve(root, 'llms.txt'), llmsTxt);
writeFileSync(resolve(root, 'llms-full.txt'), llmsFullTxt);

console.log('Generated llms.txt and llms-full.txt');
