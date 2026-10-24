# Get on Board CLI

Zero-runtime-dependency CLI for querying Get on Board's public API (LATAM tech and remote jobs). Built with `bun` and TypeScript.

## Installation

```bash
cd .agents/skills/getonbrd-search/cli
bun install
```

## Quick Start

```bash
# Search for IT Support and Systems jobs
bun run src/cli.ts search -q "support" --limit 10 --format table

# SysAdmin, DevOps & QA category in Remote
bun run src/cli.ts search -c sysadmin-devops-qa -l "remote" --format table

# Fetch job detail
bun run src/cli.ts detail <id|url> --format plain
```

## Testing

```bash
bun test
bun run typecheck
```
