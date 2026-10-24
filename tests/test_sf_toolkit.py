"""Unit tests for the SAP SuccessFactors Playwright Toolkit (`tools/sf_toolkit`)."""

from __future__ import annotations

import os
import tempfile

from tools.sf_toolkit.config import (
    PORTALS,
    load_candidate_profile,
    make_application_slug,
    resolve_portal,
    resolve_salary_for_role,
)
from tools.sf_toolkit.form_solver import (
    format_outstanding_summary,
    load_outstanding_questions,
    make_question_id,
    normalize_text,
    record_outstanding_question,
    resolve_screening_answer,
    set_outstanding_answer,
)
from tools.sf_toolkit.profile_sync import resolve_personal_field_value


def test_portal_registry_and_url_resolution():
    assert len(PORTALS) >= 11
    assert resolve_portal("femsa").key == "femsa"
    assert resolve_portal("https://careers.femsa.com/OXXO/job/Monterrey/1234/").key == "femsa"
    assert resolve_portal("https://career19.sapsf.com/portalcareer?company=centrodese").key == "femsa"
    assert resolve_portal("https://jobs.tec.mx/tecnologico-de-monterrey/job/123").key == "tec"
    assert resolve_portal("https://career8.successfactors.com/portalcareer?company=ITESM").key == "tec"
    assert resolve_portal("https://jobs.cemex.com/job/Monterrey/123").key == "cemex"
    assert resolve_portal("https://careers.arcacontal.com/job/123").key == "arcacontinental"
    assert resolve_portal("https://careers.gruma.com/job/123").key == "gruma"
    assert resolve_portal("https://vacantes.heb.com.mx/job/123").key == "heb"
    assert resolve_portal("https://careers.posadas.com/job/123").key == "posadas"
    assert resolve_portal("https://jobdetails.nestle.com/job/123").key == "nestle"
    assert resolve_portal("https://careers.techint.com/job/123").key == "ternium"
    assert resolve_portal("https://jobs.dana.com/job/123").key == "dana"
    assert resolve_portal("https://careers.thehersheycompany.com/job/123").key == "hershey"

    # Generic unknown SuccessFactors domain fallback
    generic = resolve_portal("https://career4.successfactors.com/portalcareer?company=ACME")
    assert "career4_successfactors_com" in generic.key


def test_candidate_profile_canonical_values():
    prof = load_candidate_profile()
    assert prof["credentials"]["email"] == "candidato.ejemplo@example.com"
    assert prof["credentials"]["default_password"] == "Password123!"
    assert prof["personal"]["curp"] == "PERJ950515HNLXXX01"
    assert prof["personal"]["rfc"] == "PERJ950515XX1"
    assert prof["personal"]["nss"] == "12345678901"
    assert prof["personal"]["birth_city"] == "Monterrey"
    assert prof["personal"]["marital_status_es"] == "Soltero"
    assert prof["address"]["street"] == "Avenida Constitución"
    assert prof["address"]["exterior_number"] == "100"
    assert prof["address"]["postal_code"] == "64000"
    assert prof["education"][0]["is_titled"] is False
    assert "Pasante" in prof["education"][0]["status_es"]
    assert len(prof["work_experience"]) >= 1


def test_personal_field_mapping():
    prof = load_candidate_profile()
    assert resolve_personal_field_value("* Nombres", "text", prof) == "Juan Carlos"
    assert resolve_personal_field_value("Primer Apellido", "text", prof) == "Pérez"
    assert resolve_personal_field_value("Segundo Apellido", "text", prof) == "Gómez"
    assert resolve_personal_field_value("Calle", "text", prof) == "Avenida Constitución"
    assert resolve_personal_field_value("Número exterior", "text", prof) == "100"
    assert resolve_personal_field_value("Código postal", "text", prof) == "64000"
    assert resolve_personal_field_value("Colonia", "text", prof) == "Centro"
    assert resolve_personal_field_value("CURP", "text", prof) == "PERJ950515HNLXXX01"
    assert resolve_personal_field_value("RFC", "text", prof) == "PERJ950515XX1"
    assert resolve_personal_field_value("IMSS", "text", prof) == "12345678901"
    assert resolve_personal_field_value("Ciudad/Municipio de nacimiento", "text", prof) == "Monterrey"


def test_dynamic_salary_resolver_and_floor():
    prof = load_candidate_profile()
    jr = resolve_salary_for_role("Auxiliar de Soporte TI Jr", profile=prof)
    mid = resolve_salary_for_role("Especialista Administrador de Sistemas", profile=prof)
    sr = resolve_salary_for_role("Coordinador Senior Cloud SRE", profile=prof)
    low_override = resolve_salary_for_role("Any Role", salary_override=5000, profile=prof)

    assert jr["tier"] == "entry"
    assert int(jr["expected_num"]) >= 10000
    assert mid["tier"] == "mid"
    assert int(mid["expected_num"]) > int(jr["expected_num"])
    assert sr["tier"] == "senior"
    assert int(sr["expected_num"]) > int(mid["expected_num"])
    # Verify $10,000 MXN floor is enforced even on low override
    assert int(low_override["expected_num"]) == 10000
    assert int(low_override["current_num"]) >= 10000


def test_screening_question_solver():
    prof = load_candidate_profile()

    # Work auth
    ok, val = resolve_screening_answer(
        label="* ¿Estás legalmente autorizado para trabajar en este país?",
        widget_type="combobox",
        profile=prof,
    )
    assert ok is True
    assert "Sí" in val

    # Source
    ok, val = resolve_screening_answer(
        label="* ¿Cómo te enteraste de este puesto?",
        widget_type="combobox",
        profile=prof,
    )
    assert ok is True
    assert "Bolsas de Trabajo" in val

    # Relocation
    ok, val = resolve_screening_answer(
        label="* ¿Estás abierto a cambio de residencia?",
        widget_type="combobox",
        profile=prof,
    )
    assert ok is True
    assert val[0] == "No"

    # Education title status (Pasante / Kardex, not titled)
    ok, val = resolve_screening_answer(
        label="¿Cuentas con título profesional?",
        widget_type="combobox",
        profile=prof,
    )
    assert ok is True
    assert "Pasante" in val or "No" in val

    # Unrecognized custom question returns False so it gets annotated
    ok, val = resolve_screening_answer(
        label="* ¿Cuántos años de experiencia tienes operando hornos de fundición metalúrgica?",
        widget_type="text",
        profile=prof,
    )
    assert ok is False
    assert val is None


def test_outstanding_questions_queue_and_resume():
    with tempfile.TemporaryDirectory() as tmpdir:
        qpath = os.path.join(tmpdir, "outstanding.json")
        job_url = "https://jobs.cemex.com/job/Monterrey-Test/999/"
        lbl = "* ¿Dispones de certificación SAP Basis nivel experto?"

        recorded = record_outstanding_question(
            portal_key="cemex",
            company="CEMEX",
            role="Admin Sistemas",
            job_url=job_url,
            section="Información específica",
            label=lbl,
            field_id="901:_input",
            widget_type="combobox",
            options=["Sí", "No", "En proceso"],
            path=qpath,
        )
        qid = recorded["id"]
        assert qid == make_question_id(job_url, lbl)

        items = load_outstanding_questions(qpath)
        assert len(items) == 1
        assert items[0]["status"] == "pending"

        summary = format_outstanding_summary(qpath)
        assert qid in summary
        assert "OUTSTANDING QUESTIONS TO TOUCH BASE ON" in summary

        # Supply user answer and verify solver now resolves it automatically
        set_outstanding_answer(qid, "No", path=qpath)
        ok, ans = resolve_screening_answer(
            label=lbl,
            widget_type="combobox",
            job_url=job_url,
            outstanding_path=qpath,
        )
        assert ok is True
        assert ans == ["No"]
        assert format_outstanding_summary(qpath) == ""
