# Remotive CLI

Zero-runtime-dependency CLI for querying Remotive's public remote job listings API. Built with `bun` and TypeScript.

## Installation

```bash
cd .agents/skills/remotive-search/cli
bun install
```

## Quick Start

```bash
# Search for IT and Support jobs
bun run src/cli.ts search -q "support" --limit 10 --format table

# Filter by category and location
bun run src/cli.ts search -c information-technology -l worldwide --format table

# Fetch job detail
bun run src/cli.ts detail <id> --format plain
```

## Testing

```bash
bun test
bun run typecheck
```
