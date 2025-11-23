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
        return jsonify({"error": "Dataset inválido"}), 400
    wb = openpyxl.Workbook()
    ws = wb.active
    if data:
        headers = list(data[0].keys())
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
    bio = BytesIO()
    c = canvas.Canvas(bio)
    # Encabezado con datos requeridos
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
    # Dibuja gráfica para inventario (suma por producto)
    if kind == "inventory" and data:
        try:
            # Agregar por producto
            agg = {}
            for row in data:
                label = row.get("producto") or "N/A"
                try:
                    val = float(row.get("cantidad") or 0)
                except Exception:
                    val = 0.0
                agg[label] = agg.get(label, 0.0) + val
            # Top 12 por cantidad
            items = sorted(agg.items(), key=lambda x: x[1], reverse=True)[:12]
            labels = [k for k, _ in items]
            values = [v for _, v in items]
            max_v = max(values) if values else 0
            # Área de la gráfica
            margin_x = 50
            chart_w = 520
            chart_top = 760
            chart_h = 300
            chart_bottom = chart_top - chart_h
            # Título
            c.setFont("Helvetica-Bold", 12)
            c.drawString(margin_x, chart_top + 20, "Inventario - Cantidad por producto")
            # Ejes
            c.setLineWidth(1)
            c.line(margin_x, chart_bottom, margin_x + chart_w, chart_bottom)  # eje X
            c.line(margin_x, chart_bottom, margin_x, chart_top)               # eje Y
            # Barras
            n = len(values)
            if n > 0 and max_v > 0:
                slot = chart_w / n
                bar_w = max(8, slot * 0.6)
                c.setFillColorRGB(0.2, 0.55, 0.9)
                c.setFont("Helvetica", 8)
                for i, (lbl, val) in enumerate(items):
                    bx = margin_x + i * slot + (slot - bar_w) / 2
                    bh = (val / max_v) * chart_h
                    c.rect(bx, chart_bottom, bar_w, bh, fill=1, stroke=0)
                    # Etiqueta rotada
                    c.saveState()
                    c.translate(bx + bar_w / 2, chart_bottom - 10)
                    c.rotate(45)
                    c.drawString(0, 0, str(lbl)[:14])
                    c.restoreState()
                # Grid simple (valor máximo)
                c.setFont("Helvetica", 9)
                c.drawRightString(margin_x - 6, chart_top, str(int(max_v)))
                c.drawRightString(margin_x - 6, chart_bottom, "0")
        except Exception:
            pass
        # Nueva página para la tabla
        c.showPage()
        y = 820
        c.setFont("Helvetica", 10)
    # Layout especial para clientes: columnas seleccionadas y celdas con salto de línea
    if kind == "clients" and data:
        # Layout compacto y legible: 4 columnas (id, nombre, dirección, observaciones)
        headers = ["idclie", "nombre", "direccion", "observaciones"]
        table_w = 520
        #                 id    nom    direcc   obs
        col_ws = [         60,   160,    200,    100 ]  # suma ~520
        row_line_h = 13
        # Cabecera
        c.setFillColorRGB(0.12, 0.16, 0.22)
        c.rect(40, y - row_line_h, table_w, row_line_h, fill=1, stroke=0)
        c.setFillColorRGB(1, 1, 1)
        c.setFont("Helvetica-Bold", 9)
        x = 40
        for i, h in enumerate(headers):
            c.drawString(x + 2, y - 10, str(h)[:18])
            x += col_ws[i]
        y -= (row_line_h + 4)
        c.setFont("Helvetica", 8)
        c.setFillColorRGB(0, 0, 0)

        def wrap_text(txt: str, max_chars: int):
            if txt is None:
                return [""]
            s = str(txt)
            # corte simple por palabras
            out, line = [], ""
            for w in s.split():
                if len(line) + len(w) + 1 <= max_chars:
                    line = (line + " " + w).strip()
                else:
                    out.append(line)
                    line = w
            if line:
                out.append(line)
            return out or [""]

        # estimación de caracteres por columna según ancho
        # (aprox 6 px por carácter a tamaño 8)
        char_per_col = [max(4, int(w/6)) for w in col_ws]

        for idx, row in enumerate(data):
            # Salto de página si no hay espacio suficiente (3 líneas mínimas)
            if y < 40 + row_line_h * 3:
                c.showPage(); y = 820
                c.setFont("Helvetica", 8)
                # Redibujar cabecera
                c.setFillColorRGB(0.12, 0.16, 0.22)
                c.rect(40, y - row_line_h, table_w, row_line_h, fill=1, stroke=0)
                c.setFillColorRGB(1, 1, 1)
                c.setFont("Helvetica-Bold", 9)
                x = 40
                for i, h in enumerate(headers):
                    c.drawString(x + 2, y - 10, str(h)[:18])
                    x += col_ws[i]
                y -= (row_line_h + 4)
                c.setFont("Helvetica", 8)
                c.setFillColorRGB(0, 0, 0)

            # Construir dirección unificada y calcular líneas envueltas por columna
            direccion = " ".join(
                str(x) for x in [
                    row.get("calle") or "",
                    (row.get("num_exterior") or ""),
                    ("Int. " + str(row.get("num_interior"))) if row.get("num_interior") else "",
                    (row.get("colonia") or ""),
                    (row.get("ciudad") or ""),
                    (row.get("estado") or ""),
                    (row.get("cp") or ""),
                ] if str(x)
            ).strip()

            cols_vals = [row.get("idclie"), row.get("nombre"), direccion, row.get("observaciones")]
            wrapped_cols = [wrap_text(v, char_per_col[i]) for i, v in enumerate(cols_vals)]
            max_lines = max(len(w) for w in wrapped_cols)
            # Zebra opcional
            if idx % 2 == 0:
                c.setFillColorRGB(0.96, 0.97, 0.99)
                c.rect(40, y - (row_line_h * max_lines) + 2, table_w, row_line_h * max_lines, fill=1, stroke=0)
                c.setFillColorRGB(0, 0, 0)
            # Pintar cada columna línea por línea
            base_x = 40
            for i, lines in enumerate(wrapped_cols):
                for li, t in enumerate(lines):
                    c.drawString(base_x + 2, y - 10 - (li * row_line_h), t)
                base_x += col_ws[i]
            y -= (row_line_h * max_lines + 4)

        # Finalizar PDF y responder
        c.save()
        bio.seek(0)
        return send_file(bio, as_attachment=True, download_name=f"{kind}.pdf", mimetype="application/pdf")

    if data:
        headers = list(data[0].keys())
        table_w = 560 - 40  # ancho util
        col_w = table_w / max(1, len(headers))
        row_h = 16
        # Cabecera
        c.setFillColorRGB(0.12, 0.16, 0.22)
        c.rect(40, y - row_h, table_w, row_h, fill=1, stroke=0)
        c.setFillColorRGB(1, 1, 1)
        c.setFont("Helvetica-Bold", 9)
        for i, h in enumerate(headers):
            c.drawString(40 + i * col_w + 2, y - 12, str(h)[:18])
        y -= (row_h + 4)
        c.setFont("Helvetica", 9)
        c.setFillColorRGB(0, 0, 0)
        # Filas
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
    # end of content
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
