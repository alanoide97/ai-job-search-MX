# Talenteca CLI

Zero-runtime-dependency CLI for querying Talenteca's Mexican job board API. Built with `bun` and TypeScript.

## Installation

```bash
cd .agents/skills/talenteca-search/cli
bun install
```

## Quick Start

```bash
# Search for IT Support jobs in Monterrey
bun run src/cli.ts search -q "soporte tecnico" -l "monterrey" --limit 10 --format table

# Systems administration jobs in Nuevo León
bun run src/cli.ts search -q "sistemas" -l "nuevo leon" --limit 10 --format table

# Fetch job detail
bun run src/cli.ts detail <id> --format plain
```

## Testing

```bash
bun test
bun run typecheck
```
