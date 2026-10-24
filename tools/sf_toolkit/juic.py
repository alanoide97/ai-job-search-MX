"""Low-level SAP SuccessFactors JUIC & UI5 DOM widget automation engine."""

from __future__ import annotations

import os
import re
from typing import Any, Dict, List, Optional, Sequence, Tuple

from playwright.sync_api import Locator, Page

from .form_solver import normalize_text


def expand_all_sections(page: Page) -> None:
    """Click 'Ampliar todas las secciones' / 'Expand all sections' and open any closed sectionContent divs."""
    expand_selectors = [
        "a:has-text('Ampliar todas las secciones'):visible",
        "button:has-text('Ampliar todas las secciones'):visible",
        "a:has-text('Expand all sections'):visible",
        "button:has-text('Expand all sections'):visible",
    ]
    for sel in expand_selectors:
        try:
            loc = page.locator(sel).first
            if loc.count() > 0:
                loc.click(timeout=4000)
                page.wait_for_timeout(2000)
                break
        except Exception:
            pass

    # Only click section topBars whose corresponding :sectionContent does NOT have .sectionContentOpen
    try:
        page.evaluate(
            """() => {
                const contents = Array.from(document.querySelectorAll('div[id$=":sectionContent"]'));
                for (const c of contents) {
                    if (!c.classList.contains('sectionContentOpen') && c.offsetParent === null) {
                        const prefix = c.id.replace(':sectionContent', '');
                        const topBar = document.getElementById(prefix + ':topBar');
                        if (topBar) topBar.click();
                    }
                }
            }"""
        )
        page.wait_for_timeout(1000)
    except Exception:
        pass


def fill_sf_text(page: Page, locator: Locator, value: str, overwrite: bool = True) -> bool:
    """Fill a SAP SuccessFactors text or textarea field and fire JUIC/UI5 change events."""
    try:
        if locator.count() == 0:
            return False
        el = locator.first
        cur = (el.input_value() or "").strip()
        if cur == str(value).strip():
            return True
        if not overwrite and cur:
            return True

        # Ensure enclosing section is open if it was collapsed
        el.evaluate(
            """node => {
                const sec = node.closest('div[id$=":sectionContent"]');
                if (sec && !sec.classList.contains('sectionContentOpen') && sec.offsetParent === null) {
                    const topBar = document.getElementById(sec.id.replace(':sectionContent', ':topBar'));
                    if (topBar) topBar.click();
                }
            }"""
        )

        try:
            if el.is_visible():
                el.scroll_into_view_if_needed(timeout=2000)
                el.click(timeout=2000)
                el.fill(str(value))
        except Exception:
            pass

        el.evaluate(
            """(node, val) => {
                node.value = val;
                node.dispatchEvent(new Event('input', { bubbles: true }));
                node.dispatchEvent(new Event('change', { bubbles: true }));
                node.dispatchEvent(new Event('blur', { bubbles: true }));
                if (window.juic && node.id && node.id.includes(':')) {
                    const prefix = node.id.split(':')[0] + ':';
                    try { window.juic.fire(prefix, '_handleInput', { target: node }); } catch (e) {}
                    try { window.juic.fire(prefix, '_handleChange', { target: node }); } catch (e) {}
                    try { window.juic.fire(prefix, '_change', { target: node }); } catch (e) {}
                    try { window.juic.fire(prefix, '_handleOnBlur', { target: node }); } catch (e) {}
                    try { window.juic.fire(prefix, '_blur', { target: node }); } catch (e) {}
                }
            }""",
            str(value),
        )
        return True
    except Exception as e:
        print(f"    [WARN] fill_sf_text failed: {e}")
        return False


def fill_sf_datepicker(page: Page, container_or_widget: Locator, date_ddmmyyyy: str, overwrite: bool = True) -> bool:
    """Fill a SAP SuccessFactors `.datePicker` / `<ui5-date-picker-xweb-calendar-widget>` field."""
    try:
        if container_or_widget.count() == 0:
            return False
        root = container_or_widget.first

        # Check current value on UI5 widget or inner input
        current_val = root.evaluate(
            """node => {
                const w = node.matches('ui5-date-picker-xweb-calendar-widget')
                    ? node
                    : node.querySelector('ui5-date-picker-xweb-calendar-widget');
                if (w && w.getAttribute('value')) return w.getAttribute('value');
                if (w && w.value) return w.value;
                const inp = node.querySelector('input');
                return inp ? inp.value : '';
            }"""
        )
        if str(current_val).strip() == str(date_ddmmyyyy).strip():
            return True
        if not overwrite and current_val and str(current_val).strip():
            return True

        # Update the UI5 web component attributes, shadow DOM input, properties, and JUIC events directly
        # NEVER press Enter on inner_inp because Enter submits the enclosing SAP SuccessFactors <form>!
        root.evaluate(
            """(node, val) => {
                const w = node.matches('ui5-date-picker-xweb-calendar-widget')
                    ? node
                    : node.querySelector('ui5-date-picker-xweb-calendar-widget');
                if (w) {
                    w.setAttribute('value', val);
                    w.value = val;
                    if (w.shadowRoot) {
                        const sInp = w.shadowRoot.querySelector('input');
                        if (sInp) {
                            sInp.value = val;
                            sInp.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                            sInp.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                            sInp.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
                        }
                    }
                    w.dispatchEvent(new CustomEvent('input', { detail: { value: val, valid: true }, bubbles: true, composed: true }));
                    w.dispatchEvent(new CustomEvent('change', { detail: { value: val, valid: true }, bubbles: true, composed: true }));
                    w.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
                }
                const plainInp = node.querySelector('input:not([type="hidden"])');
                if (plainInp) {
                    plainInp.value = val;
                    plainInp.dispatchEvent(new Event('input', { bubbles: true }));
                    plainInp.dispatchEvent(new Event('change', { bubbles: true }));
                    plainInp.dispatchEvent(new Event('blur', { bubbles: true }));
                }
                const dp = node.classList.contains('datePicker') ? node : node.closest('.datePicker') || node.querySelector('.datePicker');
                if (dp && dp.id && window.juic) {
                    const prefix = dp.id.split(':')[0] + ':';
                    try { window.juic.fire(prefix, '_change', { value: val }); } catch (e) {}
                    try { window.juic.fire(prefix, '_handleChange', { value: val }); } catch (e) {}
                }
            }""",
            date_ddmmyyyy,
        )
        page.wait_for_timeout(200)
        return True
    except Exception as e:
        print(f"    [WARN] fill_sf_datepicker failed: {e}")
        return False


def get_combobox_options(page: Page, input_locator: Locator) -> List[str]:
    """Open a SAP SuccessFactors `.rcmpaginatedselectinput` combobox and return its available options."""
    try:
        if input_locator.count() == 0:
            return []
        inp = input_locator.first
        inp_id = inp.get_attribute("id") or ""
        list_id = inp.get_attribute("aria-owns") or ""
        prefix = inp_id.split(":")[0] + ":" if ":" in inp_id else ""

        # Trigger dropdown open via selectButton or juic.fire
        page.evaluate(
            """({inpId, prefix}) => {
                const btn = inpId ? document.getElementById(inpId.replace('_input', '_selectButton')) : null;
                if (btn) {
                    btn.click();
                } else if (window.juic && prefix) {
                    window.juic.fire(prefix, '_click', {});
                }
            }""",
            {"inpId": inp_id, "prefix": prefix},
        )
        page.wait_for_timeout(900)

        options = page.evaluate(
            """(listId) => {
                let items = [];
                if (listId) {
                    const container = document.getElementById(listId);
                    if (container) {
                        items = Array.from(container.querySelectorAll('li, a, [role="option"]'));
                    }
                }
                if (items.length === 0) {
                    items = Array.from(document.querySelectorAll(
                        '.rcmpaginatedselectlist:not([style*="display: none"]) li, ' +
                        'ul.ui-autocomplete:not([style*="display: none"]) li, ' +
                        '.fd-list li, [role="listbox"] [role="option"]'
                    ));
                }
                const seen = new Set();
                const out = [];
                for (const el of items) {
                    const txt = (el.innerText || el.textContent || '').trim();
                    if (txt && !/^(sin selecci[oó]n|no selection|-?\\s*seleccione\\s*-?)$/i.test(txt) && !seen.has(txt)) {
                        seen.add(txt);
                        out.push(txt);
                    }
                }
                return out;
            }""",
            list_id,
        )
        return options
    except Exception:
        return []


def select_sf_combobox(
    page: Page,
    input_locator: Locator,
    target_values: str | Sequence[str],
    *,
    overwrite: bool = True,
    allow_first_valid_fallback: bool = False,
) -> Tuple[bool, str]:
    """Select an option in a SAP SuccessFactors `.rcmpaginatedselectinput` or `<select>`."""
    targets = [target_values] if isinstance(target_values, str) else list(target_values)
    targets = [str(t).strip() for t in targets if str(t).strip()]
    if not targets or input_locator.count() == 0:
        return False, ""

    el = input_locator.first
    try:
        tag = el.evaluate("node => node.tagName.toLowerCase()")
    except Exception:
        return False, ""

    # Standard HTML <select>
    if tag == "select":
        for t in targets:
            try:
                el.select_option(label=t, timeout=2000)
                return True, t
            except Exception:
                pass
        return False, ""

    # Check if already populated
    norm_targets = [normalize_text(t) for t in targets]
    try:
        cur_val = (el.input_value() or "").strip()
        if cur_val and normalize_text(cur_val) not in ("sin seleccion", "no selection", "- seleccione -", "seleccione"):
            if not overwrite or normalize_text(cur_val) in norm_targets:
                return True, cur_val
    except Exception:
        pass

    inp_id = el.get_attribute("id") or ""
    list_id = el.get_attribute("aria-owns") or ""
    prefix = inp_id.split(":")[0] + ":" if ":" in inp_id else ""

    # 1. Open dropdown via button click / juic.fire and try direct match in list
    try:
        el.scroll_into_view_if_needed(timeout=3000)
        page.evaluate(
            """({inpId, prefix}) => {
                const btn = inpId ? document.getElementById(inpId.replace('_input', '_selectButton')) : null;
                if (btn) {
                    btn.click();
                } else if (window.juic && prefix) {
                    window.juic.fire(prefix, '_click', {});
                }
            }""",
            {"inpId": inp_id, "prefix": prefix},
        )
        page.wait_for_timeout(900)

        norm_targets = [normalize_text(t) for t in targets]

        # Step 1: Check initial dropdown page for an exact or substring match (NO fallback yet,
        # because paginated comboboxes like 'País' only load A-B on page 1 and need Step 2 typing for 'México').
        clicked_text = page.evaluate(
            """({listId, normTargets}) => {
                const normalize = (s) => (s || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().trim();
                let candidates = [];
                if (listId) {
                    const listEl = document.getElementById(listId);
                    if (listEl) {
                        candidates = Array.from(listEl.querySelectorAll('li, a, [role="option"]'));
                    }
                }
                if (candidates.length === 0) {
                    candidates = Array.from(document.querySelectorAll(
                        '.rcmpaginatedselectlist li, ul.ui-autocomplete li, [role="listbox"] [role="option"]'
                    )).filter(e => e.offsetParent !== null);
                }
                const validItems = candidates.filter(e => {
                    const t = (e.innerText || '').trim();
                    return t && !/^(sin selecci[oó]n|no selection|-?\\s*seleccione\\s*-?)$/i.test(t);
                });

                // Exact normalized match first
                for (const nt of normTargets) {
                    const exact = validItems.find(e => normalize(e.innerText) === nt);
                    if (exact) {
                        const txt = exact.innerText.trim();
                        exact.click();
                        return txt;
                    }
                }
                // Substring match second (only if candidate text has >= 3 chars to avoid spurious single-letter matches)
                for (const nt of normTargets) {
                    if (nt.length < 2) continue;
                    const sub = validItems.find(e => {
                        const en = normalize(e.innerText);
                        return en.includes(nt) || (en.length >= 3 && nt.includes(en));
                    });
                    if (sub) {
                        const txt = sub.innerText.trim();
                        sub.click();
                        return txt;
                    }
                }
                return '';
            }""",
            {
                "listId": list_id,
                "normTargets": norm_targets,
            },
        )
        if clicked_text:
            page.wait_for_timeout(700)
            return True, clicked_text
    except Exception:
        pass

    # Step 2: Type sequentially into the combobox to filter paginated options (e.g., 'México' in 'País')
    for t in targets:
        try:
            el.scroll_into_view_if_needed(timeout=2000)
            el.focus()
            page.keyboard.press("Control+A")
            page.keyboard.press("Backspace")
            page.wait_for_timeout(200)
            short_query = t[:8]
            el.press_sequentially(short_query, delay=75)
            page.wait_for_timeout(1200)
            nt = normalize_text(t)
            picked = page.evaluate(
                """({listId, nt}) => {
                    const normalize = (s) => (s || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().trim();
                    let items = [];
                    if (listId) {
                        const l = document.getElementById(listId);
                        if (l) items = Array.from(l.querySelectorAll('li, [role="option"]'));
                    }
                    if (items.length === 0) {
                        items = Array.from(document.querySelectorAll(
                            '.rcmpaginatedselectlist li, ul.ui-autocomplete li, [role="listbox"] [role="option"]'
                        )).filter(e => e.offsetParent !== null);
                    }
                    const valid = items.filter(e => {
                        const txt = (e.innerText || '').trim();
                        return txt && !/^(sin selecci[oó]n|no selection|-?\\s*seleccione\\s*-?)$/i.test(txt);
                    });
                    const match = valid.find(e => normalize(e.innerText) === nt) ||
                                  valid.find(e => normalize(e.innerText).includes(nt) || (normalize(e.innerText).length >= 3 && nt.includes(normalize(e.innerText))));
                    if (match) {
                        const txt = match.innerText.trim();
                        const link = match.querySelector('a');
                        if (link) link.click();
                        match.click();
                        return txt;
                    }
                    return '';
                }""",
                {"listId": list_id, "nt": nt},
            )
            if picked:
                page.wait_for_timeout(700)
                return True, picked
        except Exception:
            continue

    # Step 3: If allow_first_valid_fallback is True and no target matched in Step 1 or Step 2,
    # re-open the dropdown and pick the first valid non-empty option.
    if allow_first_valid_fallback:
        try:
            el.fill("")
            page.evaluate(
                """({inpId, prefix}) => {
                    const btn = inpId ? document.getElementById(inpId.replace('_input', '_selectButton')) : null;
                    if (btn) {
                        btn.click();
                    } else if (window.juic && prefix) {
                        window.juic.fire(prefix, '_click', {});
                    }
                }""",
                {"inpId": inp_id, "prefix": prefix},
            )
            page.wait_for_timeout(900)
            fb_picked = page.evaluate(
                """(listId) => {
                    let items = [];
                    if (listId) {
                        const l = document.getElementById(listId);
                        if (l) items = Array.from(l.querySelectorAll('li, a, [role="option"]'));
                    }
                    if (items.length === 0) {
                        items = Array.from(document.querySelectorAll(
                            '.rcmpaginatedselectlist li, ul.ui-autocomplete li, [role="listbox"] [role="option"]'
                        )).filter(e => e.offsetParent !== null);
                    }
                    const valid = items.filter(e => {
                        const txt = (e.innerText || '').trim();
                        return txt && !/^(sin selecci[oó]n|no selection|-?\\s*seleccione\\s*-?)$/i.test(txt);
                    });
                    if (valid.length > 0) {
                        const txt = valid[0].innerText.trim();
                        valid[0].click();
                        return txt;
                    }
                    return '';
                }""",
                list_id,
            )
            if fb_picked:
                page.wait_for_timeout(700)
                return True, fb_picked
        except Exception:
            pass

    return False, ""


def select_sf_radio(
    page: Page,
    group_container: Locator,
    target_options: str | Sequence[str],
) -> Tuple[bool, str]:
    """Select an option in a SAP SuccessFactors `.radioGroup` / `.globalRadio` widget."""
    targets = [target_options] if isinstance(target_options, str) else list(target_options)
    norm_targets = [normalize_text(t) for t in targets if str(t).strip()]
    if not norm_targets or group_container.count() == 0:
        return False, ""

    try:
        grp = group_container.first
        grp.scroll_into_view_if_needed(timeout=3000)
        selected = grp.evaluate(
            """(node, normTargets) => {
                const normalize = (s) => (s || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().trim();
                const labels = Array.from(node.querySelectorAll('label.radioLabel, label'));
                for (const nt of normTargets) {
                    const lbl = labels.find(l => normalize(l.innerText) === nt) ||
                                labels.find(l => normalize(l.innerText).includes(nt));
                    if (lbl) {
                        const txt = lbl.innerText.trim();
                        const radioSpan = lbl.closest('[id$=":_radio"]') || lbl.parentElement;
                        if (radioSpan) radioSpan.click();
                        lbl.click();
                        if (window.juic && lbl.id && lbl.id.includes(':')) {
                            const prefix = lbl.id.split(':')[0] + ':';
                            try { window.juic.fire(prefix, '_itemSelect', {}); } catch (e) {}
                        }
                        return txt;
                    }
                }
                return '';
            }""",
            norm_targets,
        )
        if selected:
            page.wait_for_timeout(400)
            return True, selected
    except Exception as e:
        print(f"    [WARN] select_sf_radio failed: {e}")

    return False, ""


def upload_sf_document(
    page: Page,
    file_path: str,
    *,
    is_cover_letter: bool = False,
    force_replace: bool = False,
) -> bool:
    """Upload a CV or Cover Letter PDF into SAP SuccessFactors' 'Mis documentos' section."""
    if not file_path or not os.path.exists(file_path):
        print(f"    [WARN] Document path does not exist: {file_path}")
        return False

    abs_path = os.path.abspath(file_path)
    basename = os.path.basename(abs_path)

    # Check if already attached (unless force_replace is True)
    if not force_replace and not is_cover_letter:
        try:
            existing = page.locator("div:has-text('.pdf'):visible, a:has-text('.pdf'):visible")
            if existing.count() > 0:
                print(f"    [DOC] Existing CV PDF already attached on profile.")
                return True
        except Exception:
            pass

    if is_cover_letter:
        trigger_selectors = [
            "div:has-text('Agregar un documento'):visible",
            "a:has-text('Agregar un documento'):visible",
            "div:has-text('Carta de presentación'):visible",
            "a:has-text('Carta de presentación'):visible",
            "div:has-text('Add a document'):visible",
            "a:has-text('Cover Letter'):visible",
        ]
    else:
        trigger_selectors = [
            "div:has-text('Cargar una hoja de vida'):visible",
            "a:has-text('Cargar una hoja de vida'):visible",
            "div:has-text('Cargar un currículum'):visible",
            "div:has-text('Upload a resume'):visible",
            "a:has-text('Upload a resume'):visible",
            "button[title*='Editar']:visible",
            "span.edit_icon:visible",
        ]

    for sel in trigger_selectors:
        try:
            loc = page.locator(sel).last
            if loc.count() > 0 and loc.is_visible():
                loc.click(timeout=4000)
                page.wait_for_timeout(1800)
                break
        except Exception:
            continue

    try:
        file_inp = page.locator("input[type='file']").last
        if file_inp.count() > 0:
            print(f"    [DOC] Uploading {'Cover Letter' if is_cover_letter else 'CV'}: {basename}...")
            file_inp.set_input_files(abs_path)
            page.wait_for_timeout(7500)
            return True
    except Exception as e:
        print(f"    [WARN] upload_sf_document error: {e}")

    return False


def extract_all_form_fields(page: Page) -> List[Dict[str, Any]]:
    """Scan all sections on a SuccessFactors profile or application page and return structured field metadata."""
    return page.evaluate(
        """() => {
            const results = [];
            const fields = Array.from(document.querySelectorAll('.RCMFormField, .rcmFormElement, .rcmFormQuestionElement'));
            const seenKeys = new Set();

            for (const f of fields) {
                if (f.classList.contains('instructionField')) continue;
                const sec = f.closest('div[id$=":sectionContent"]');
                const secId = sec ? sec.id : '';
                const header = secId ? document.getElementById(secId.replace(':sectionContent', ':headerLabel')) : null;
                const sectionTitle = header ? header.innerText.trim() : '';

                const rowComp = f.closest('.rcmSectionComponent');
                const rowCompId = rowComp ? rowComp.id : '';

                const lblEl = f.querySelector('label.rcmFormFieldLabel, label.rcmFormQuestionLabel, label');
                const rawLabel = lblEl ? lblEl.innerText.trim() : '';
                const hasAsterisk = rawLabel.includes('*') || !!f.querySelector('.requiredField');

                let widgetType = 'unknown';
                let fieldId = '';
                let currentValue = '';
                let ariaRequired = false;
                let options = [];

                const dp = f.querySelector('.datePicker, ui5-date-picker-xweb-calendar-widget');
                const radioGrp = f.querySelector('.radioGroup, [role="radiogroup"]');
                const combo = f.querySelector('input.rcmpaginatedselectinput, input[role="combobox"]');
                const txtArea = f.querySelector('textarea');
                const sel = f.querySelector('select');
                const txtInp = f.querySelector('input[type="text"]:not(.rcmpaginatedselectinput), input[type="number"], input[type="tel"], input[type="email"]');

                if (dp) {
                    widgetType = 'datepicker';
                    const dpDiv = f.querySelector('.datePicker');
                    const ui5 = f.querySelector('ui5-date-picker-xweb-calendar-widget');
                    fieldId = (dpDiv && dpDiv.id) || (ui5 && ui5.id) || '';
                    currentValue = (ui5 && (ui5.getAttribute('value') || ui5.value)) || '';
                    ariaRequired = hasAsterisk || (ui5 && ui5.hasAttribute('required'));
                } else if (radioGrp) {
                    widgetType = 'radio';
                    fieldId = radioGrp.id || '';
                    ariaRequired = hasAsterisk || radioGrp.getAttribute('aria-required') === 'true';
                    const radioLabels = Array.from(radioGrp.querySelectorAll('label.radioLabel, label'));
                    options = radioLabels.map(l => l.innerText.trim()).filter(Boolean);
                    const checked = radioGrp.querySelector('[aria-checked="true"], .radioOn');
                    if (checked) {
                        const cl = checked.closest('.globalRadio')?.querySelector('label.radioLabel');
                        currentValue = cl ? cl.innerText.trim() : 'checked';
                    }
                } else if (combo) {
                    widgetType = 'combobox';
                    fieldId = combo.id || '';
                    currentValue = (combo.value || '').trim();
                    if (/^(sin selecci[oó]n|no selection|-?\\s*seleccione\\s*-?)$/i.test(currentValue)) currentValue = '';
                    ariaRequired = hasAsterisk || combo.getAttribute('aria-required') === 'true';
                } else if (txtArea) {
                    widgetType = 'textarea';
                    fieldId = txtArea.id || '';
                    currentValue = (txtArea.value || '').trim();
                    ariaRequired = hasAsterisk || txtArea.getAttribute('aria-required') === 'true';
                } else if (sel) {
                    widgetType = 'select';
                    fieldId = sel.id || '';
                    currentValue = (sel.value || '').trim();
                    ariaRequired = hasAsterisk || sel.getAttribute('aria-required') === 'true';
                    options = Array.from(sel.options).map(o => o.text.trim()).filter(Boolean);
                } else if (txtInp) {
                    widgetType = 'text';
                    fieldId = txtInp.id || '';
                    currentValue = (txtInp.value || '').trim();
                    ariaRequired = hasAsterisk || txtInp.getAttribute('aria-required') === 'true';
                } else {
                    continue;
                }

                const errEl = f.querySelector('.rcmValidationMsgArea:not(.displayNone)');
                const valErr = errEl ? (errEl.innerText || '').trim() : '';

                const dedupKey = `${sectionTitle}|${rowCompId}|${fieldId}|${rawLabel}`;
                if (seenKeys.has(dedupKey)) continue;
                seenKeys.add(dedupKey);

                results.push({
                    section: sectionTitle,
                    row_id: rowCompId,
                    label: rawLabel,
                    field_id: fieldId,
                    widget_type: widgetType,
                    required: Boolean(ariaRequired),
                    current_value: currentValue,
                    options: options,
                    validation_error: valErr
                });
            }
            return results;
        }"""
    )


def get_validation_errors(page: Page) -> List[Dict[str, str]]:
    """Return any visible `.rcmValidationMsgArea` or `.sectionError` validation messages on the page."""
    return page.evaluate(
        """() => {
            const errs = [];
            const msgAreas = Array.from(document.querySelectorAll('.rcmValidationMsgArea:not(.displayNone), [role="alert"]:not(.displayNone)'));
            for (const m of msgAreas) {
                const txt = (m.innerText || '').trim();
                if (!txt) continue;
                const lower = txt.toLowerCase();
                if (lower.includes('con éxito') || lower.includes('con exito') || lower.includes('successfully')) {
                    continue;
                }
                const f = m.closest('.RCMFormField, .rcmFormElement, .rcmFormQuestionElement');
                const lbl = f ? (f.querySelector('label')?.innerText || '').trim() : '';
                const sec = m.closest('div[id$=":sectionContent"]');
                const header = sec ? document.getElementById(sec.id.replace(':sectionContent', ':headerLabel')) : null;
                const secTitle = header ? header.innerText.trim() : '';
                errs.push({
                    section: secTitle,
                    label: lbl,
                    error: txt
                });
            }
            return errs;
        }"""
    )


def click_save_draft(page: Page) -> bool:
    """Click the 'Guardar' / 'Save' button on a SuccessFactors profile or application page."""
    selectors = [
        "button:has-text('Guardar'):visible",
        ".rcmSaveButton:has-text('Guardar'):visible",
        "span.rcmButton:has-text('Guardar'):visible",
        "button:has-text('Save'):visible",
        ".rcmSaveButton:has-text('Save'):visible",
        "*[id*='_saveBtn']:visible",
    ]
    for sel in selectors:
        try:
            btn = page.locator(sel).first
            if btn.count() > 0:
                btn.scroll_into_view_if_needed(timeout=3000)
                btn.click(timeout=5000)
                page.wait_for_timeout(6000)
                return True
        except Exception:
            continue
    return False


def click_submit_application(page: Page) -> Tuple[bool, str]:
    """Click the final 'Solicitar' / 'Finalizar postulación' / 'Submit' button on an application form."""
    selectors = [
        ".rcmSaveButton:has-text('Finalizar postulación'):visible",
        "button:has-text('Finalizar postulación'):visible",
        "span:has-text('Finalizar postulación'):visible",
        "span.rcmButton:has-text('Solicitar'):visible",
        ".rcmSaveButton:has-text('Solicitar'):visible",
        "button:has-text('Solicitar'):visible",
        "input[value='Solicitar']:visible",
        ".rcmSaveButton:has-text('Enviar'):visible",
        "button:has-text('Apply'):visible",
        "button:has-text('Submit'):visible",
        "*[id*='_applyBtn']:visible",
        "*[id*='_submitBtn']:visible",
    ]
    for sel in selectors:
        try:
            btn = page.locator(sel).first
            if btn.count() > 0:
                btn_text = (btn.inner_text() or sel).strip()
                btn.scroll_into_view_if_needed(timeout=3000)
                btn.click(timeout=6000)
                page.wait_for_timeout(10000)
                return True, btn_text
        except Exception:
            continue
    return False, "Submit button not found"
