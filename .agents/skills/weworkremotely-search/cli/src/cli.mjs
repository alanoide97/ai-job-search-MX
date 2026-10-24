#!/usr/bin/env node
// Self-contained CLI for searching We Work Remotely via a headless Chromium
// (Playwright). WWR serves a Cloudflare challenge to plain server-side fetch,
// but a real browser clears it — verified 2026-08-25.
//
// Runs under Node (Playwright's native runtime; it hangs under Bun on Windows).
// Requires: playwright installed at the repo root (bun add -d playwright) and
// chromium downloaded (bunx playwright install chromium).
//
// Personal use only — keep volume low.

import { chromium } from "playwright"
import { existsSync } from "node:fs"

const CHROME_CANDIDATES = [
  process.env.PLAYWRIGHT_CHROMIUM_PATH,
  "C:\\Users\\alano\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe",
  "C:\\Users\\alano\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe",
].filter(Boolean)

function findChrome() {
  return CHROME_CANDIDATES.find((c) => existsSync(c))
}

function writeError(error, code) {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

function parseFlags(argv) {
  const flags = { _: [] }
  const alias = { q: "query", t: "category", n: "limit" }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith("-")) {
      flags._.push(a)
      continue
    }
    const key = alias[a.replace(/^-+/, "")] ?? a.replace(/^-+/, "")
    const next = argv[i + 1]
    if (next === undefined || next.startsWith("-")) {
      flags[key] = true
    } else {
      flags[key] = next
      i++
    }
  }
  return flags
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
}

function clean(html) {
  return decodeHtmlEntities(String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
}

/** Extract job cards from the rendered search page HTML. */
export function parseJobCards(html) {
  const results = []
  const openRe = /<li class="[^"]*new-listing-container[^"]*">/gi
  let mm
  while ((mm = openRe.exec(html)) !== null) {
    const start = mm.index
    const next = html.indexOf("new-listing-container", start + 30)
    const card = html.slice(start, next < 0 ? start + 4000 : next)

    const linkM = card.match(/<a class="listing-link--unlocked"[^>]*href="(\/remote-jobs\/[a-z0-9-]+)"/i)
    if (!linkM) continue
    const url = `https://weworkremotely.com${linkM[1]}`
    const id = linkM[1].split("/").pop()

    const titleM = card.match(/class="new-listing__header__title__text">\s*([^<]+?)\s*</i)
    const title = titleM ? clean(titleM[1]) : null
    if (!title) continue

    const compM = card.match(/class="new-listing__company-name">\s*([^<]+?)\s*</i)
    const company = compM ? clean(compM[1]) || null : null

    const hqM = card.match(/class="new-listing__company-headquarters">\s*([^<]+?)\s*</i)
    const region = hqM ? clean(hqM[1]) || null : null

    const dateM = card.match(/class="new-listing__header__icons__date">\s*([^<]+?)\s*</i)
    const date = dateM ? clean(dateM[1]) || null : null

    const cats = [...card.matchAll(/class="new-listing__categories__category">\s*([^<]+?)\s*</gi)].map((m) => clean(m[1]))

    results.push({ id, title, company, region, date, categories: cats, url })
  }
  return results
}

async function fetchSearchHtml(term, category) {
  const exe = findChrome()
  if (!exe) throw new Error("no Chromium found; run `bunx playwright install chromium` or set PLAYWRIGHT_CHROMIUM_PATH")
  const browser = await chromium.launch({ headless: true, executablePath: exe, timeout: 45000 })
  try {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    const params = new URLSearchParams()
    if (term) params.set("term", term)
    // Category shortcuts map to WWR's known category URLs.
    const catMap = {
      dev: "/categories/remote-full-stack-programming-jobs",
      design: "/categories/remote-design-jobs",
      support: "/categories/remote-customer-support-jobs",
      marketing: "/categories/remote-marketing-jobs",
      all: "",
    }
    let url = "https://weworkremotely.com/remote-jobs/search"
    if (term) url += `?${params.toString()}`
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })
    // Give Cloudflare any JS challenge a moment to clear itself.
    await page.waitForTimeout(2500)
    return await page.content()
  } finally {
    await browser.close()
  }
}

const HELP = `weworkremotely-cli — search jobs on We Work Remotely (headless Chromium)

USAGE
  node src/cli.mjs search [-q "<keywords>"] [--format json|table|plain]
  node src/cli.mjs detail <slug|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>   Keywords. Optional (empty = featured listings).
  --limit, -n <n>      Cap results emitted. Default 25.
  --format <fmt>       json (default) | table | plain.

DETAIL
  <slug|url>           A /remote-jobs/<slug> path from search results.

EXAMPLES
  node src/cli.mjs search -q "devops" --limit 10 --format table
  node src/cli.mjs search -q "customer support" --format table

Requires playwright + chromium (bun add -d playwright && bunx playwright install chromium).
Runs under Node — Playwright hangs under Bun on Windows.
`

function renderTable(cards) {
  if (cards.length === 0) return "No results."
  const cols = [
    { h: "SLUG", w: Math.max(4, ...cards.map((c) => c.id.length)), f: (c) => c.id },
    { h: "TITLE", w: 40, f: (c) => c.title },
    { h: "COMPANY", w: 26, f: (c) => c.company ?? "—" },
    { h: "REGION", w: 22, f: (c) => c.region ?? "—" },
    { h: "AGE", w: 6, f: (c) => c.date ?? "—" },
  ]
  const row = (cells) => cells.map((c, i) => String(c).slice(0, cols[i].w).padEnd(cols[i].w)).join("  ")
  const header = row(cols.map((c) => c.h))
  return [header, "-".repeat(header.length), ...cards.map((c) => row(cols.map((col) => col.f(c))))].join("\n")
}

function renderPlain(cards) {
  if (cards.length === 0) return "No results."
  return cards
    .map((c) => `${c.title}\n  ${c.company ?? "—"} · ${c.region ?? "—"} · ${c.date ?? "—"}\n  slug: ${c.id}\n  ${c.url}`)
    .join("\n\n")
}

async function main() {
  const argv = process.argv.slice(2)
  const flags = parseFlags(argv)
  const cmd = flags._[0]

  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }

  const KNOWN = {
    search: new Set(["query", "limit", "format", "help", "h"]),
    detail: new Set(["format", "help", "h"]),
  }
  const known = KNOWN[cmd]
  if (!known) {
    writeError(`Unknown command "${cmd}"`, "BAD_CMD")
    return 1
  }
  for (const key of Object.keys(flags)) {
    if (key === "_" || known.has(key)) continue
    writeError(`unknown flag --${key} for '${cmd}' - flags are never silently ignored; see --help`, "UNKNOWN_FLAG")
    return 1
  }

  const fmt = typeof flags.format === "string" ? flags.format : "json"
  if (!["json", "table", "plain"].includes(fmt)) {
    writeError(`--format must be json|table|plain, got "${fmt}"`, "BAD_ARG")
    return 1
  }

  try {
    if (cmd === "search") {
      const html = await fetchSearchHtml(typeof flags.query === "string" ? flags.query : undefined)
      let cards = parseJobCards(html)
      if (flags.limit !== undefined) cards = cards.slice(0, parseInt(flags.limit, 10) || 25)
      if (fmt === "table") process.stdout.write(renderTable(cards) + "\n")
      else if (fmt === "plain") process.stdout.write(renderPlain(cards) + "\n")
      else process.stdout.write(JSON.stringify({ meta: { count: cards.length }, results: cards }, null, 2) + "\n")
      return 0
    }
    // detail
    const id = flags._[1]
    if (!id) {
      writeError("detail requires a <slug|url>", "NO_ID")
      return 1
    }
    const slug = id.replace(/^https?:\/\/weworkremotely\.com\/remote-jobs\//, "").replace(/^\/remote-jobs\//, "")
    const exe = findChrome()
    if (!exe) throw new Error("no Chromium found")
    const browser = await chromium.launch({ headless: true, executablePath: exe, timeout: 45000 })
    let out
    try {
      const page = await (await browser.newContext()).newPage()
      await page.goto(`https://weworkremotely.com/remote-jobs/${slug}`, { waitUntil: "domcontentloaded", timeout: 30000 })
      await page.waitForTimeout(2000)
      const html = await page.content()
      const titleM = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
      const compM = html.match(/href="\/companies\/[^"]+"[^>]*>([\s\S]*?)<\/a>/i)
      const descM = html.match(/<div[^>]*class="[^"]*listing-container[^"]*"[^>]*>([\s\S]*?)<\/section>/i)
      const desc = descM
        ? decodeHtmlEntities(
            descM[1]
              .replace(/<\s*br\s*\/?>/gi, "\n")
              .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
              .replace(/<[^>]+>/g, " "),
          )
            .replace(/[ \t]+/g, " ")
            .replace(/ *\n */g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim() || null
        : null
      out = {
        id: slug,
        title: titleM ? clean(titleM[1]) : "(untitled)",
        company: compM ? clean(compM[1]) || null : null,
        url: `https://weworkremotely.com/remote-jobs/${slug}`,
        description: desc,
      }
    } finally {
      await browser.close()
    }
    if (fmt === "plain") {
      const lines = [out.title, `${out.company || "—"}`, "", out.description || "(no description)", "", `URL: ${out.url}`]
      process.stdout.write(lines.join("\n") + "\n")
    } else {
      process.stdout.write(JSON.stringify(out, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "FETCH_FAILED")
    return 1
  }
}

main().then((code) => process.exit(code))
