from flask import request, send_file, jsonify
from io import BytesIO, StringIO
from routes import api
from utils.auth import auth_required
from database import db
from models.product import Product
from models.client import Client
from models.process import Process
from models.provider import Provider
from models.inventory import Inventory
from datetime import datetime
import csv
import os
import re


def _query_dataset(kind: str):
    if kind == "products":
        return [p.to_dict() for p in db.session.query(Product).all()]
    if kind == "clients":
        return [c.to_dict() for c in db.session.query(Client).all()]
    if kind == "processes":
        q = db.session.query(Process)
        d_from = _parse_date(request.args.get("from"))
        d_to = _parse_date(request.args.get("to"))
        op = request.args.get("op")
        if d_from:
            q = q.filter(Process.created_at >= datetime.combine(d_from, datetime.min.time()))
        if d_to:
            q = q.filter(Process.created_at <= datetime.combine(d_to, datetime.max.time()))
        if op:
            like = f"%{op}%"
            q = q.filter(Process.op.ilike(like))
        return [p.to_dict() for p in q.order_by(Process.created_at.desc()).all()]
    if kind == "providers":
        return [p.to_dict() for p in db.session.query(Provider).all()]
    if kind == "inventory":
        # MSSQL external table support via env vars
        table = os.getenv("MSSQL_INV_TABLE")
        date_col = os.getenv("MSSQL_INV_DATE_COL")
        def _ident(name: str) -> str:
            if not name:
                raise ValueError("Empty identifier")
            if not re.fullmatch(r"[A-Za-z0-9_\.]+", name):
                raise ValueError(f"Invalid identifier: {name}")
            return ".".join(f"[{p}]" for p in name.split("."))

        if table:
            d_from = _parse_date(request.args.get("from"))
            d_to = _parse_date(request.args.get("to"))
            where = []
            params = {}
            if date_col and d_from:
                where.append(f"{_ident(date_col)} >= :dfrom")
                params["dfrom"] = d_from
            if date_col and d_to:
                where.append(f"{_ident(date_col)} <= :dto")
                params["dto"] = d_to
            sql = f"SELECT * FROM {_ident(table)}"
            if where:
                sql += " WHERE " + " AND ".join(where)
            if date_col:
                sql += f" ORDER BY {_ident(date_col)} DESC"
            rows = db.session.execute(db.text(sql), params).mappings().all()
            return [dict(r) for r in rows]
        else:
            d_from = _parse_date(request.args.get("from"))
            d_to = _parse_date(request.args.get("to"))
            mr = request.args.get("mr")
            q = db.session.query(Inventory)
            if d_from:
                q = q.filter(Inventory.fecha >= d_from)
            if d_to:
                q = q.filter(Inventory.fecha <= d_to)
            if mr:
                like = f"%{mr}%"
                q = q.filter(Inventory.codigo_mr.ilike(like))
            rows = q.order_by(Inventory.fecha.desc()).all()
            data = []
            for r in rows:
                d = r.to_dict()
                d["producto"] = r.producto.nombre if r.producto else None
                d["cliente"] = r.cliente.nombre if r.cliente else None
                data.append(d)
            return data
    return None


def _parse_date(s: str | None):
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


@api.get("/export/excel")
@auth_required()
def export_excel():
    try:
        import openpyxl  # lazy import para compatibilidad
    except ImportError:
        return jsonify({"error": "Dependencia faltante: openpyxl"}), 500
    kind = request.args.get("kind", "products")
    data = _query_dataset(kind)
    if data is None:
        return jsonify({"error": "Dataset invÃ¡lido"}), 400
    # Adaptar columnas a lo visible en UI (y normalizar inventario)
    columns_qs = request.args.get("columns")
    canon_cols = ["folio","ope","producto_id","cliente_id","piezas","peso_bruto","tara","peso_neto"]
    def _canon_row(row: dict) -> dict:
        if kind != "inventory":
            return row
        def first(keys):
            for k in keys:
                if k in row and row.get(k) not in (None,""):
                    return row.get(k)
            return None
        out = {}
        out["folio"] = first(["folio","id","idfolio","folio_id","folio_op"]) or ""
        out["ope"] = first(["ope","op","orden","orden_produccion","ordenproduccion","codigo_mr","mr","ordenprod"]) or ""
        v = first(["producto_id","id_producto","productoId","idprod"])
        if v is None:
            obj = first(["producto"]) or {}
            if isinstance(obj, dict):
                v = obj.get("id") or obj.get("idprod")
        out["producto_id"] = v or ""
        v = first(["cliente_id","id_cliente","clienteId","idclie"])
        if v is None:
            obj = first(["cliente"]) or {}
            if isinstance(obj, dict):
                v = obj.get("id") or obj.get("idclie")
        out["cliente_id"] = v or ""
        out["piezas"] = first(["piezas","cantidad_piezas","cantidad","qty"]) or ""
        out["peso_bruto"] = first(["peso_bruto","pesobruto","bruto","pesoBruto"]) or ""
        tara = first(["tara","peso_tara"])
        out["tara"] = tara or ""
        neto = first(["peso_neto","pesoneto","neto","pesoNeto"])
        if neto is None:
            try:
                b = float(out["peso_bruto"] or 0)
                t = float(tara or 0)
                neto = round(b - t, 2)
            except Exception:
                neto = ""
        out["peso_neto"] = neto
        return out
    if kind == "inventory":
        data = [ _canon_row(r) for r in (data or []) ]
    if columns_qs:
        headers = [c for c in columns_qs.split(",") if c]
        if kind == "inventory":
            headers = [c for c in headers if c in canon_cols]
    else:
        headers = (list(data[0].keys()) if data else [])
    wb = openpyxl.Workbook()
    ws = wb.active
    if data:
        ws.append(headers)
        for row in data:
            ws.append([row.get(k) for k in headers])
    bio = BytesIO()
    wb.save(bio)
    bio.seek(0)
    return send_file(
        bio,
        as_attachment=True,
        download_name=f"{kind}.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@api.get("/export/pdf")
@auth_required()
def export_pdf():
    try:
        from reportlab.pdfgen import canvas  # lazy import
    except ImportError:
        return jsonify({"error": "Dependencia faltante: reportlab"}), 500
    kind = request.args.get("kind", "products")
    data = _query_dataset(kind)
    if data is None:
        return jsonify({"error": "Dataset inválido"}), 400

    # Preparar datos/columnas según la vista cuando es inventario (sin gráficas)
    headers = None
    if kind == "inventory":
        canon_cols = ["folio","ope","producto_id","cliente_id","piezas","peso_bruto","tara","peso_neto"]
        def canon_row(row: dict) -> dict:
            def first(keys):
                for k in keys:
                    if k in row and row.get(k) not in (None,""):
                        return row.get(k)
                return None
            out = {}
            out["folio"] = first(["folio","id","idfolio","folio_id","folio_op"]) or ""
            out["ope"] = first(["ope","op","orden","orden_produccion","ordenproduccion","codigo_mr","mr","ordenprod"]) or ""
            v = first(["producto_id","id_producto","productoId","idprod"])
            if v is None:
                obj = first(["producto"]) or {}
                if isinstance(obj, dict):
                    v = obj.get("id") or obj.get("idprod")
            out["producto_id"] = v or ""
            v = first(["cliente_id","id_cliente","clienteId","idclie"])
            if v is None:
                obj = first(["cliente"]) or {}
                if isinstance(obj, dict):
                    v = obj.get("id") or obj.get("idclie")
            out["cliente_id"] = v or ""
            out["piezas"] = first(["piezas","cantidad_piezas","cantidad","qty"]) or ""
            out["peso_bruto"] = first(["peso_bruto","pesobruto","bruto","pesoBruto"]) or ""
            tara = first(["tara","peso_tara"])
            out["tara"] = tara or ""
            neto = first(["peso_neto","pesoneto","neto","pesoNeto"])
            if neto is None:
                try:
                    b = float(out["peso_bruto"] or 0)
                    t = float(tara or 0)
                    neto = round(b - t, 2)
                except Exception:
                    neto = ""
            out["peso_neto"] = neto
            return out
        data = [canon_row(r) for r in (data or [])]
        columns_qs = request.args.get('columns')
        headers = [c for c in (columns_qs.split(',') if columns_qs else canon_cols) if c in canon_cols]

    bio = BytesIO()
    c = canvas.Canvas(bio)

    # Encabezado
    c.setFont("Helvetica-Bold", 14)
    y = 820
    c.drawString(40, y, "Sistema Administrativo - Reporte")
    c.setFont("Helvetica", 10)
    y -= 16
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    user = getattr(request, 'user', None)
    user_name = getattr(user, 'nombre', 'Usuario') if user else 'Usuario'
    filters = {k: request.args.get(k) for k in ("from","to","mr") if request.args.get(k)}
    c.drawString(40, y, f"Tipo: {kind}  Fecha: {now}  Usuario: {user_name}")
    y -= 14
    if filters:
        c.drawString(40, y, f"Filtros: {filters}")
        y -= 14
    c.line(40, y, 560, y)
    y -= 20

    # Solo tabla
    if data:
        if headers is None:
            headers = list(data[0].keys())
        table_w = 560 - 40
        col_w = table_w / max(1, len(headers))
        row_h = 16
        c.setFillColorRGB(0.12, 0.16, 0.22)
        c.rect(40, y - row_h, table_w, row_h, fill=1, stroke=0)
        c.setFillColorRGB(1, 1, 1)
        c.setFont("Helvetica-Bold", 9)
        for i, h in enumerate(headers):
            c.drawString(40 + i * col_w + 2, y - 12, str(h)[:18])
        y -= (row_h + 4)
        c.setFont("Helvetica", 9)
        c.setFillColorRGB(0, 0, 0)
        for idx, row in enumerate(data):
            if y < 40 + row_h:
                c.showPage(); y = 820
                c.setFillColorRGB(0.12, 0.16, 0.22)
                c.rect(40, y - row_h, table_w, row_h, fill=1, stroke=0)
                c.setFillColorRGB(1, 1, 1); c.setFont("Helvetica-Bold", 9)
                for i, h in enumerate(headers):
                    c.drawString(40 + i * col_w + 2, y - 12, str(h)[:18])
                y -= (row_h + 4); c.setFont("Helvetica", 9); c.setFillColorRGB(0, 0, 0)
            if idx % 2 == 0:
                c.setFillColorRGB(0.96, 0.97, 0.99)
                c.rect(40, y - row_h + 2, table_w, row_h, fill=1, stroke=0)
                c.setFillColorRGB(0, 0, 0)
            for i, h in enumerate(headers):
                txt = str(row.get(h))
                c.drawString(40 + i * col_w + 2, y - 12, txt[:22])
            y -= row_h

    c.save()
    bio.seek(0)
    return send_file(bio, as_attachment=True, download_name=f"{kind}.pdf", mimetype="application/pdf")

@api.get("/export/csv")
@auth_required()
def export_csv():
    kind = request.args.get("kind", "products")
    data = _query_dataset(kind)
    if data is None:
        return jsonify({"error": "Dataset invalido"}), 400
    if not data:
        data = [{}]
    headers = list(data[0].keys())
    sio = StringIO()
    writer = csv.writer(sio)
    writer.writerow(headers)
    for row in data:
        writer.writerow([row.get(h) for h in headers])
    data_bytes = sio.getvalue().encode("utf-8-sig")
    bio = BytesIO(data_bytes)
    bio.seek(0)
    return send_file(
        bio,
        as_attachment=True,
        download_name=f"{kind}.csv",
        mimetype="text/csv; charset=utf-8",
    )

