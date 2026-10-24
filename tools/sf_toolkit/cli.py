"""Command-Line Interface for the SAP SuccessFactors Playwright Toolkit (`tools/sf_toolkit/cli.py`)."""

from __future__ import annotations

import argparse
import json
import sys
from typing import List

from playwright.sync_api import sync_playwright

from .applicator import apply_to_job, check_portal_applications_status
from .auth import create_portal_context, ensure_logged_in
from .config import PORTALS, PortalConfig, load_candidate_profile, resolve_portal
from .form_solver import (
    format_outstanding_summary,
    load_outstanding_questions,
    set_outstanding_answer,
)
from .profile_sync import sync_full_candidate_profile


def _resolve_portal_targets(portal_args: List[str]) -> List[PortalConfig]:
    if not portal_args or "all" in [p.lower() for p in portal_args]:
        return list(PORTALS.values())
    out: List[PortalConfig] = []
    for p in portal_args:
        for part in p.split(","):
            part = part.strip()
            if part:
                out.append(resolve_portal(part))
    return out


def cmd_register(args: argparse.Namespace) -> int:
    profile = load_candidate_profile()
    targets = _resolve_portal_targets(args.portal)
    results = []

    with sync_playwright() as p:
        browser = p.firefox.launch(headless=not args.headed)
        for cfg in targets:
            print(f"\n=== [REGISTER / LOGIN] {cfg.name} ({cfg.key}) ===")
            ctx = create_portal_context(browser, cfg.key)
            page = ctx.new_page()
            try:
                ok, msg = ensure_logged_in(page, ctx, cfg, profile, auto_register=True)
                results.append({"portal": cfg.key, "ok": ok, "message": msg})
                print(f"  -> Result: ok={ok} | {msg}")
            except Exception as e:
                results.append({"portal": cfg.key, "ok": False, "message": str(e)})
                print(f"  -> [ERROR] {e}")
            finally:
                ctx.close()
        browser.close()

    print("\n=== Registration / Auth Summary ===")
    print(json.dumps(results, ensure_ascii=False, indent=2))
    summary = format_outstanding_summary()
    if summary:
        print(summary)
    return 0


def cmd_sync_profile(args: argparse.Namespace) -> int:
    profile = load_candidate_profile()
    targets = _resolve_portal_targets(args.portal)
    results = []

    with sync_playwright() as p:
        browser = p.firefox.launch(headless=not args.headed)
        for cfg in targets:
            print(f"\n=== [SYNC PROFILE] {cfg.name} ({cfg.key}) ===")
            ctx = create_portal_context(browser, cfg.key)
            page = ctx.new_page()
            try:
                ok, msg = ensure_logged_in(page, ctx, cfg, profile, auto_register=True)
                if not ok:
                    results.append({"portal": cfg.key, "ok": False, "message": msg})
                    print(f"  -> [SKIP] Not authenticated: {msg}")
                    continue

                sync_res = sync_full_candidate_profile(
                    page,
                    cfg,
                    cv_path=args.cv,
                    profile=profile,
                    overwrite_personal=True,
                )
                ctx.storage_state(path=f"tools/sf_toolkit/state/sessions/{cfg.key}_storage.json")
                results.append(sync_res)
                print(f"  -> Sync result: {json.dumps(sync_res, ensure_ascii=False)}")
            except Exception as e:
                results.append({"portal": cfg.key, "ok": False, "error": str(e)})
                print(f"  -> [ERROR] {e}")
            finally:
                ctx.close()
        browser.close()

    print("\n=== Profile Sync Summary ===")
    print(json.dumps(results, ensure_ascii=False, indent=2))
    summary = format_outstanding_summary()
    if summary:
        print(summary)
    return 0


def cmd_apply(args: argparse.Namespace) -> int:
    profile = load_candidate_profile()
    portal_cfg = resolve_portal(args.url)

    with sync_playwright() as p:
        browser = p.firefox.launch(headless=not args.headed)
        ctx = create_portal_context(browser, portal_cfg.key)
        page = ctx.new_page()
        try:
            res = apply_to_job(
                page,
                ctx,
                args.url,
                company=args.company or "",
                role=args.role or "",
                cv_path=args.cv,
                cover_letter_path=args.cover,
                salary_override=args.salary,
                dry_run=args.dry_run,
                profile=profile,
            )
            print("\n=== Application Result ===")
            print(json.dumps(res, ensure_ascii=False, indent=2))
        finally:
            ctx.close()
            browser.close()

    summary = format_outstanding_summary()
    if summary:
        print(summary)
    return 0


def cmd_resume(args: argparse.Namespace) -> int:
    if args.id and args.answer is not None:
        updated = set_outstanding_answer(args.id, args.answer)
        if updated:
            print(f"Recorded answer for {args.id} ({updated.get('label')}): {args.answer!r}")
        else:
            print(f"[WARN] Question ID '{args.id}' not found in outstanding queue.")
            return 1

    # Find all job URLs that have at least one 'answered' question and zero 'pending' questions
    items = load_outstanding_questions()
    by_url = {}
    for it in items:
        u = it.get("job_url")
        if u:
            by_url.setdefault(u, []).append(it)

    ready_urls = [
        u
        for u, qlist in by_url.items()
        if any(q.get("status") == "answered" for q in qlist)
        and not any(q.get("status") == "pending" for q in qlist)
    ]

    if not ready_urls:
        print("No jobs have all outstanding questions answered yet.")
        summary = format_outstanding_summary()
        if summary:
            print(summary)
        return 0

    profile = load_candidate_profile()
    with sync_playwright() as p:
        browser = p.firefox.launch(headless=not args.headed)
        for job_url in ready_urls:
            q0 = by_url[job_url][0]
            portal_cfg = resolve_portal(job_url)
            ctx = create_portal_context(browser, portal_cfg.key)
            page = ctx.new_page()
            try:
                print(f"\n=== [RESUME APPLICATION] {q0.get('company')} — {q0.get('role')} ===")
                res = apply_to_job(
                    page,
                    ctx,
                    job_url,
                    company=q0.get("company", ""),
                    role=q0.get("role", ""),
                    profile=profile,
                )
                print(json.dumps(res, ensure_ascii=False, indent=2))
            finally:
                ctx.close()
        browser.close()

    summary = format_outstanding_summary()
    if summary:
        print(summary)
    return 0


def cmd_status(args: argparse.Namespace) -> int:
    profile = load_candidate_profile()
    targets = _resolve_portal_targets(args.portal)
    results = []

    with sync_playwright() as p:
        browser = p.firefox.launch(headless=not args.headed)
        for cfg in targets:
            print(f"\n=== [STATUS] {cfg.name} ({cfg.key}) ===")
            ctx = create_portal_context(browser, cfg.key)
            page = ctx.new_page()
            try:
                st = check_portal_applications_status(page, ctx, cfg, profile)
                results.append(st)
                print(json.dumps(st, ensure_ascii=False, indent=2))
            except Exception as e:
                results.append({"portal": cfg.key, "error": str(e)})
            finally:
                ctx.close()
        browser.close()

    summary = format_outstanding_summary()
    if summary:
        print(summary)
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="sf_toolkit",
        description="SAP SuccessFactors Playwright Automation Toolkit",
    )
    parser.add_argument(
        "--headed",
        action="store_true",
        help="Run Firefox in headed (visible) mode instead of headless.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p_reg = sub.add_parser("register", help="Ensure candidate account exists and is authenticated on portal(s)")
    p_reg.add_argument("--portal", nargs="*", default=["all"], help="Portal key(s) or 'all'")
    p_reg.set_defaults(func=cmd_register)

    p_sync = sub.add_parser("sync-profile", help="Hydrate full candidate profile + repeating blocks on portal(s)")
    p_sync.add_argument("--portal", nargs="*", default=["femsa", "tec"], help="Portal key(s) or 'all'")
    p_sync.add_argument("--cv", default=None, help="Optional PDF CV path to upload to profile")
    p_sync.set_defaults(func=cmd_sync_profile)

    p_app = sub.add_parser("apply", help="Apply to a SAP SuccessFactors job posting URL")
    p_app.add_argument("--url", required=True, help="Full job posting URL")
    p_app.add_argument("--company", default="", help="Company name override")
    p_app.add_argument("--role", default="", help="Role title override")
    p_app.add_argument("--cv", default=None, help="Path to tailored CV PDF")
    p_app.add_argument("--cover", default=None, help="Path to tailored Cover Letter PDF")
    p_app.add_argument("--salary", default=None, help="Monthly salary override in MXN")
    p_app.add_argument("--dry-run", action="store_true", help="Save draft on portal without clicking final Submit")
    p_app.set_defaults(func=cmd_apply)

    p_res = sub.add_parser("resume", help="Answer an outstanding screening question and resume saved application(s)")
    p_res.add_argument("--id", default=None, help="Question ID (e.g. sfq_a1b2c3)")
    p_res.add_argument("--answer", default=None, help="Answer text or option label")
    p_res.set_defaults(func=cmd_resume)

    p_st = sub.add_parser("status", help="Check submitted and saved draft applications on portal(s)")
    p_st.add_argument("--portal", nargs="*", default=["femsa", "tec"], help="Portal key(s) or 'all'")
    p_st.set_defaults(func=cmd_status)

    return parser


def main(argv: List[str] | None = None) -> int:
    # Ensure stdout/stderr handle UTF-8 on Windows PowerShell
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")

    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
