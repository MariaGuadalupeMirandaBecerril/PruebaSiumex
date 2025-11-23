import os
import re
from typing import Dict, Any
from sqlalchemy import text
from sqlalchemy.engine import Engine


def _ident(name: str) -> str:
    if not name:
        raise ValueError("Nombre de identificador vacío")
    if not re.fullmatch(r"[A-Za-z0-9_\.]+", name):
        raise ValueError(f"Identificador inválido: {name}")
    # Permitir schema.table
    return ".".join(f"[{part}]" for part in name.split("."))


def _cfg() -> Dict[str, str]:
    return {
        "TBL_CARDS": os.getenv("MSSQL_TBL_CARDS"),
        "COL_CARD_NUMBER": os.getenv("MSSQL_COL_CARD_NUMBER", "NumeroTarjeta"),
        "COL_CARD_ACTIVE": os.getenv("MSSQL_COL_CARD_ACTIVE", "Activa"),
        "COL_BAL_INIT": os.getenv("MSSQL_COL_BAL_INIT", "SaldoInicial"),
        "COL_BAL_CURR": os.getenv("MSSQL_COL_BAL_CURR", "SaldoActual"),
        "TBL_MOVS": os.getenv("MSSQL_TBL_MOVS"),
        "COL_MOV_DATE": os.getenv("MSSQL_COL_MOV_DATE", "Fecha"),
        "COL_MOV_TYPE": os.getenv("MSSQL_COL_MOV_TYPE", "Tipo"),
    }


def available() -> bool:
    cfg = _cfg()
    return bool(cfg["TBL_CARDS"]) and bool(cfg["TBL_MOVS"])


def dashboard_summary(engine: Engine) -> Dict[str, Any]:
    cfg = _cfg()
    cards = _ident(cfg["TBL_CARDS"])  # type: ignore
    movs = _ident(cfg["TBL_MOVS"])  # type: ignore
    cnum = _ident(cfg["COL_CARD_NUMBER"])
    cact = _ident(cfg["COL_CARD_ACTIVE"])
    cini = _ident(cfg["COL_BAL_INIT"])
    ccurr = _ident(cfg["COL_BAL_CURR"])
    mdate = _ident(cfg["COL_MOV_DATE"])

    with engine.begin() as conn:
        total_cards_active = conn.execute(text(f"SELECT COUNT(1) FROM {cards} WHERE {cact} = 1")).scalar() or 0
        saldo_promedio = conn.execute(text(f"SELECT AVG(CAST({ccurr} as float)) FROM {cards} WHERE {ccurr} IS NOT NULL")).scalar()
        total_cards = conn.execute(text(f"SELECT COUNT(1) FROM {cards}")).scalar() or 0
        total_movs = conn.execute(text(f"SELECT COUNT(1) FROM {movs}")).scalar() or 0

        serie_rows = conn.execute(text(
            f"SELECT TOP 50 {cnum} AS num, CAST({ccurr} as float) AS saldo FROM {cards} WHERE {cact} = 1 ORDER BY {cnum}"
        )).mappings().all()

    series = [{"tarjeta": r["num"], "saldo": float(r["saldo"] or 0)} for r in serie_rows]

    # Tablas de resumen (limitadas)
    resumen_tarjetas = series  # simple: usar misma serie
    # Resumen balanza: últimos 50 movimientos (solo fecha)
    with engine.begin() as conn:
        mov_rows = conn.execute(text(f"SELECT TOP 50 {mdate} AS fecha FROM {movs} ORDER BY {mdate} DESC")).mappings().all()

    return {
        "cards": {
            "tarjetas_activas": int(total_cards_active),
            "saldo_promedio": float(saldo_promedio or 0),
            "tarjetas_emitidas": int(total_cards),
            "movimientos_totales": int(total_movs),
        },
        "serie_saldo_tarjetas": series,
        "tabla_resumen_tarjetas": resumen_tarjetas,
        "tabla_resumen_balanza": [{"fecha": str(r["fecha"]) } for r in mov_rows],
    }

