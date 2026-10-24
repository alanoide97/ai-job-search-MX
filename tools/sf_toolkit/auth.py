"""Authentication, session caching, and automated account registration for SAP SuccessFactors portals."""

from __future__ import annotations

import json
import os
from datetime import datetime
from typing import Any, Dict, Optional, Tuple

from playwright.sync_api import Browser, BrowserContext, Frame, Page

from .config import (
    PORTALS_AUTH_PATH,
    SCREENSHOTS_DIR,
    SESSIONS_DIR,
    PortalConfig,
    load_candidate_profile,
)


def load_auth_state() -> Dict[str, Any]:
    if os.path.exists(PORTALS_AUTH_PATH):
        try:
            with open(PORTALS_AUTH_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_auth_state(state: Dict[str, Any]) -> None:
    os.makedirs(os.path.dirname(PORTALS_AUTH_PATH), exist_ok=True)
    with open(PORTALS_AUTH_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def get_session_path(portal_key: str) -> str:
    os.makedirs(SESSIONS_DIR, exist_ok=True)
    return os.path.join(SESSIONS_DIR, f"{portal_key}_storage.json")


def create_portal_context(browser: Browser, portal_key: str) -> BrowserContext:
    """Create a BrowserContext pre-loaded with cached storage_state if available."""
    sess_path = get_session_path(portal_key)
    user_agent = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) "
        "Gecko/20100101 Firefox/132.0"
    )
    if os.path.exists(sess_path):
        try:
            return browser.new_context(
                storage_state=sess_path,
                user_agent=user_agent,
                viewport={"width": 1440, "height": 960},
            )
        except Exception as e:
            print(f"  [WARN] Could not load cached session for {portal_key}: {e}")
    return browser.new_context(
        user_agent=user_agent,
        viewport={"width": 1440, "height": 960},
    )


def dismiss_cookie_banners(page: Page) -> None:
    """Dismiss common cookie/privacy overlays (OneTrust, TrustArc, SAP CSB banners)."""
    selectors = [
        "#onetrust-accept-btn-handler",
        "#truste-consent-button",
        "button#cookie-accept",
        "button:has-text('Aceptar todas las cookies')",
        "button:has-text('Aceptar todas')",
        "button:has-text('Accept All Cookies')",
        "button:has-text('Accept All')",
        "button:has-text('Aceptar cookies')",
        "a:has-text('Aceptar cookies')",
    ]
    for sel in selectors:
        try:
            loc = page.locator(sel).first
            if loc.count() > 0 and loc.is_visible():
                loc.click(timeout=2000)
                page.wait_for_timeout(500)
        except Exception:
            pass


def is_authenticated(page: Page) -> bool:
    """Detect whether the current page or any frame is an authenticated SuccessFactors session."""
    try:
        url = page.url.lower()
        body_text = (page.inner_text("body") or "").lower()
    except Exception:
        return False

    # If login inputs are visible right now, we are NOT authenticated
    for scope in [page] + list(page.frames):
        try:
            u = scope.locator("input#username:visible, input[name='username']:visible")
            if u.count() > 0:
                return False
        except Exception:
            pass

    auth_markers = [
        "ampliar todas las secciones",
        "expand all sections",
        "mis documentos",
        "my documents",
        "información del perfil",
        "profile information",
        "cargar una hoja de vida",
        "upload a resume",
        "finalizar postulación",
    ]
    if any(m in body_text for m in auth_markers):
        return True

    # Check sign-out links
    signout_selectors = [
        "a:has-text('Salir'):visible",
        "a:has-text('Cerrar sesión'):visible",
        "a:has-text('Sign Out'):visible",
        "a:has-text('Log Out'):visible",
    ]
    for sel in signout_selectors:
        try:
            if page.locator(sel).count() > 0:
                return True
        except Exception:
            pass

    if "navbarlevel=my_profile" in url and "login" not in url:
        # Check if profile sections exist
        if page.locator(".rcmFormSectionTitle, h2[id*='headerLabel']").count() > 0:
            return True

    return False


def _find_login_scope(page: Page) -> Optional[Page | Frame]:
    """Find the Page or Frame holding the SuccessFactors login username/password inputs."""
    for scope in [page] + list(page.frames):
        try:
            loc = scope.locator(
                "input#username, input[name='username'], input[id*='username'], input[id*='userName'], input[name='j_username']"
            )
            if loc.count() > 0:
                return scope
            # Also detect by presence of password input alongside text/email input
            pw = scope.locator("input[type='password']")
            if pw.count() == 1:
                return scope
        except Exception:
            continue
    return None


def navigate_to_login_or_profile(page: Page, portal_cfg: PortalConfig) -> bool:
    """Navigate from the portal home page to the candidate profile / login screen."""
    print(f"  [AUTH] Navigating to {portal_cfg.name} ({portal_cfg.home_url})...")
    page.goto(portal_cfg.home_url, timeout=45000)
    page.wait_for_timeout(3000)
    dismiss_cookie_banners(page)

    if is_authenticated(page) or _find_login_scope(page) is not None:
        return True

    # Try clicking known login/profile links (strictly links 'a', never submit buttons)
    candidates = list(portal_cfg.login_link_texts) + [
        "Ver perfil",
        "Iniciar sesión / Ver Perfil",
        "Iniciar sesión",
        "Mi perfil",
        "Mi cuenta",
        "View Profile",
        "Sign In",
        "Log In",
        "Profile",
        "Candidate Profile",
    ]
    seen_texts = set()
    for text in candidates:
        if text.lower() in seen_texts:
            continue
        seen_texts.add(text.lower())
        try:
            loc = page.locator(f"a:has-text('{text}'):visible").first
            if loc.count() > 0:
                print(f"  [AUTH] Clicking profile/login link: '{text}'")
                loc.click(timeout=5000)
                # Poll up to 8 seconds for login form or authenticated profile to appear
                for _ in range(8):
                    page.wait_for_timeout(1000)
                    if is_authenticated(page) or _find_login_scope(page) is not None:
                        return True
                dismiss_cookie_banners(page)
                if is_authenticated(page) or _find_login_scope(page) is not None:
                    return True
        except Exception:
            continue

    # Fallback: look for any link with href containing portalcareer or login or my_profile
    try:
        href_loc = page.locator(
            "a[href*='portalcareer']:visible, a[href*='MY_PROFILE']:visible, a[href*='login']:visible"
        ).first
        if href_loc.count() > 0:
            href_loc.click(timeout=5000)
            page.wait_for_timeout(5000)
            return True
    except Exception:
        pass

    return is_authenticated(page) or (_find_login_scope(page) is not None)


def _attempt_credentials_login(
    page: Page,
    scope: Page | Frame,
    email: str,
    password: str,
    portal_cfg: PortalConfig,
) -> Tuple[bool, str]:
    """Fill username and password in scope and click the login button."""
    try:
        u_inp = scope.locator(
            "input#username, input[name='username'], input[id*='username'], input[name='j_username']"
        ).first
        p_inp = scope.locator(
            "input#password, input[name='password'], input[id*='password'], input[type='password']"
        ).first
        u_inp.fill(email)
        p_inp.fill(password)
        page.wait_for_timeout(600)

        btn_texts = list(portal_cfg.login_button_texts) + [
            "Entrar",
            "Inicia sesión",
            "Iniciar sesión",
            "Sign In",
            "Log In",
            "Acceder",
        ]
        clicked = False
        for bt in btn_texts:
            btn = scope.locator(
                f"button:has-text('{bt}'):visible, input[value='{bt}']:visible"
            ).first
            if btn.count() > 0:
                btn.click(timeout=5000)
                clicked = True
                break
        if not clicked:
            fallback_btn = scope.locator(
                "button.rcmButton:visible, button[type='submit']:visible, input[type='submit']:visible"
            ).first
            fallback_btn.click(timeout=5000)

        page.wait_for_timeout(6500)
    except Exception as e:
        return False, f"Login interaction error: {e}"

    if is_authenticated(page):
        return True, "Authenticated"

    # Check error message in scope or page
    err_text = ""
    try:
        err_text = (scope.inner_text("body") or "")[:1000]
    except Exception:
        pass
    return False, err_text


def register_account(
    page: Page,
    portal_cfg: PortalConfig,
    profile: Optional[Dict[str, Any]] = None,
) -> Tuple[bool, str]:
    """Create a new candidate account on a SAP SuccessFactors portal."""
    prof = profile or load_candidate_profile()
    creds = prof["credentials"]
    personal = prof["personal"]
    email = creds["email"]
    passwords_to_try = [creds["default_password"], creds["fallback_password"]]

    scope = _find_login_scope(page) or page

    # Find 'Crear una cuenta' / 'Create an account' link
    create_selectors = [
        "a:has-text('Crear una cuenta')",
        "a:has-text('Crear cuenta')",
        "a:has-text('Create an account')",
        "a:has-text('Create Account')",
        "button:has-text('Crear una cuenta')",
        "button:has-text('Create an account')",
        "a[id*='createAccount']",
        "a[href*='createAccount']",
    ]
    clicked_create = False
    for sel in create_selectors:
        try:
            loc = scope.locator(sel).first
            if loc.count() == 0:
                loc = page.locator(sel).first
            if loc.count() > 0 and loc.is_visible():
                print(f"  [REGISTER] Clicking account creation link ({sel})...")
                loc.click(timeout=5000)
                page.wait_for_timeout(4000)
                clicked_create = True
                break
        except Exception:
            continue

    if not clicked_create:
        return False, "Could not locate 'Crear una cuenta' / 'Create an account' link"

    reg_scope: Page | Frame = page
    for f in page.frames:
        try:
            if f.locator("input[type='password']:visible").count() >= 2:
                reg_scope = f
                break
        except Exception:
            pass

    for pw in passwords_to_try:
        print(f"  [REGISTER] Filling registration form for {email}...")
        try:
            # Fill all visible inputs on registration form by label/id heuristics
            inputs = reg_scope.locator("input:visible, select:visible").all()
            for inp in inputs:
                inp_id = (inp.get_attribute("id") or "").lower()
                inp_name = (inp.get_attribute("name") or "").lower()
                inp_type = (inp.get_attribute("type") or "").lower()
                if inp_type in ("checkbox", "radio", "button", "submit", "hidden", "file"):
                    continue
                tag = inp.evaluate("el => el.tagName.toLowerCase()")
                lbl = inp.evaluate(
                    """el => {
                        const id = el.id;
                        if (id) {
                            const l = document.querySelector(`label[for="${CSS.escape(id)}"]`);
                            if (l && l.innerText) return l.innerText.trim();
                        }
                        const row = el.closest('tr, .rcmFormField, .fd-form-item, div');
                        return row ? row.innerText.split('\\n')[0].trim() : '';
                    }"""
                ).lower()

                combined = f"{inp_id} {inp_name} {lbl}"
                if inp_type == "password" or "password" in combined or "contraseña" in combined or "contrasena" in combined:
                    inp.fill(pw)
                elif "email" in combined or "correo" in combined or "usuario" in combined:
                    inp.fill(email)
                elif "segundo apellido" in combined or "materno" in combined:
                    inp.fill(personal["last_name_maternal"])
                elif "apellido" in combined or "last name" in combined or "surname" in combined:
                    inp.fill(personal["last_name_paternal"])
                elif "nombre" in combined or "first name" in combined or "given name" in combined:
                    inp.fill(personal["first_name"])
                elif "teléfono" in combined or "telefono" in combined or "phone" in combined or "celular" in combined:
                    inp.fill(personal["phone_number"])
                elif tag == "select" and ("país" in combined or "pais" in combined or "country" in combined):
                    try:
                        inp.select_option(label="México")
                    except Exception:
                        try:
                            inp.select_option(value="MX")
                        except Exception:
                            pass

            # Handle Terms / Privacy Consent checkbox or modal link
            privacy_links = reg_scope.locator(
                "a:has-text('Leer y aceptar'), a:has-text('Aviso de privacidad'), a:has-text('Read and accept'), a:has-text('Privacy Statement')"
            ).all()
            for pl in privacy_links:
                try:
                    if pl.is_visible():
                        pl.click(timeout=3000)
                        page.wait_for_timeout(1500)
                        accept_btn = page.locator(
                            "button:has-text('Aceptar'):visible, button:has-text('Accept'):visible, input[value='Aceptar']:visible"
                        ).first
                        if accept_btn.count() > 0:
                            accept_btn.click(timeout=3000)
                            page.wait_for_timeout(1000)
                except Exception:
                    pass

            checkboxes = reg_scope.locator("input[type='checkbox']:visible").all()
            for cb in checkboxes:
                try:
                    if not cb.is_checked():
                        cb.check(timeout=2000)
                except Exception:
                    pass

            # Check if CAPTCHA is present
            has_captcha = False
            for f in page.frames:
                if "recaptcha" in f.url.lower() or "hcaptcha" in f.url.lower():
                    has_captcha = True
                    break

            submit_reg = reg_scope.locator(
                "button:has-text('Crear cuenta'):visible, button:has-text('Crear una cuenta'):visible, "
                "button:has-text('Create Account'):visible, button[id*='createAccount']:visible, "
                "input[type='submit']:visible, button.rcmButton:visible"
            ).first
            if submit_reg.count() > 0:
                submit_reg.click(timeout=5000)
                page.wait_for_timeout(6000)

            if is_authenticated(page):
                auth_state = load_auth_state()
                auth_state[portal_cfg.key] = {
                    "email": email,
                    "password": pw,
                    "status": "registered_and_authenticated",
                    "updated_at": datetime.now().isoformat(),
                }
                save_auth_state(auth_state)
                return True, f"Account created and authenticated with password '{pw}'"

            body_msg = (reg_scope.inner_text("body") or "").lower()
            if "verificar" in body_msg or "verification" in body_msg or "correo electrónico" in body_msg:
                auth_state = load_auth_state()
                auth_state[portal_cfg.key] = {
                    "email": email,
                    "password": pw,
                    "status": "pending_email_verification",
                    "updated_at": datetime.now().isoformat(),
                }
                save_auth_state(auth_state)
                return False, f"Registration submitted — portal sent an email verification link to {email}"

            if has_captcha:
                return False, "Registration blocked by reCAPTCHA/hCaptcha challenge"

        except Exception as e:
            print(f"  [REGISTER] Attempt with password '{pw}' encountered error: {e}")

    return False, "Registration did not reach authenticated profile state"


def ensure_logged_in(
    page: Page,
    context: BrowserContext,
    portal_cfg: PortalConfig,
    profile: Optional[Dict[str, Any]] = None,
    auto_register: bool = True,
) -> Tuple[bool, str]:
    """Ensure the Playwright page is logged into `portal_cfg`, logging in or registering if needed."""
    prof = profile or load_candidate_profile()
    creds = prof["credentials"]
    email = creds["email"]

    auth_state = load_auth_state()
    portal_record = auth_state.get(portal_cfg.key, {})
    saved_pw = portal_record.get("password") or creds["default_password"]
    passwords = [saved_pw]
    if creds["default_password"] not in passwords:
        passwords.append(creds["default_password"])
    if creds["fallback_password"] not in passwords:
        passwords.append(creds["fallback_password"])

    if not navigate_to_login_or_profile(page, portal_cfg):
        ss_path = os.path.join(SCREENSHOTS_DIR, f"{portal_cfg.key}_nav_failed.png")
        try:
            page.screenshot(path=ss_path, full_page=True)
        except Exception:
            pass
        return False, f"Could not find login or profile entry on {portal_cfg.home_url}"

    if is_authenticated(page):
        print(f"  [AUTH] Cached session active for {portal_cfg.name}!")
        context.storage_state(path=get_session_path(portal_cfg.key))
        return True, "Authenticated via cached session"

    login_scope = _find_login_scope(page)
    if login_scope is None:
        return False, "Login form inputs not found on page or frames"

    last_err = ""
    for pw in passwords:
        print(f"  [AUTH] Logging into {portal_cfg.name} as {email}...")
        ok, msg = _attempt_credentials_login(page, login_scope, email, pw, portal_cfg)
        if ok:
            print(f"  [AUTH] Successfully logged into {portal_cfg.name}!")
            context.storage_state(path=get_session_path(portal_cfg.key))
            auth_state[portal_cfg.key] = {
                "email": email,
                "password": pw,
                "status": "authenticated",
                "updated_at": datetime.now().isoformat(),
            }
            save_auth_state(auth_state)
            return True, "Logged in with credentials"
        last_err = msg
        login_scope = _find_login_scope(page)
        if login_scope is None:
            break

    if auto_register:
        print(f"  [AUTH] Login did not succeed on {portal_cfg.name}; attempting account registration...")
        ok, reg_msg = register_account(page, portal_cfg, prof)
        if ok:
            context.storage_state(path=get_session_path(portal_cfg.key))
        return ok, reg_msg

    return False, f"Login failed: {last_err[:200]}"
