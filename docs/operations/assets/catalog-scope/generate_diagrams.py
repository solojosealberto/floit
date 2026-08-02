#!/usr/bin/env python3
"""Diagramas del alcance de catálogo — lenguaje no técnico."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
INK = (11, 15, 14)
INK2 = (21, 27, 25)
GREEN = (23, 201, 100)
MINT = (159, 230, 195)
MIST = (234, 248, 241)
WHITE = (255, 255, 255)
GRAY = (90, 110, 100)
SOFT = (210, 230, 220)
AMBER = (232, 168, 56)
RED = (220, 80, 70)
BLUE = (70, 140, 180)


def font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def rounded(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def text_center(draw, xy, text, fnt, fill=INK):
    x, y = xy
    bbox = draw.textbbox((0, 0), text, font=fnt)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((x - w / 2, y - h / 2), text, font=fnt, fill=fill)


def save(img, name):
    path = OUT / name
    img.save(path, "PNG", optimize=True)
    print("wrote", path.name)


def diagram_objectives():
    img = Image.new("RGB", (1400, 620), MIST)
    d = ImageDraw.Draw(img)
    d.text((60, 36), "Tu trabajo tiene dos metas (van juntas)", font=font(34, True), fill=INK)

    cards = [
        ("A", "Que los datos sean verdaderos",
         "Revisar cada gimnasio ya publicado:\n¿existe de verdad? ¿está abierto?\n¿nombre, zona, teléfono, precio y\nfotos coinciden con la realidad?", GREEN),
        ("B", "Sumar los que faltan",
         "Buscar gimnasios de Caracas que\naún no están en QueGym y cargarlos\ncon la misma calidad y evidencia\nque los ya publicados.", BLUE),
    ]
    for i, (letter, heading, desc, accent) in enumerate(cards):
        x0 = 60 + i * 670
        rounded(d, (x0, 120, x0 + 610, 520), 28, WHITE, SOFT, 2)
        rounded(d, (x0, 120, x0 + 610, 210), 28, accent)
        d.rectangle((x0, 180, x0 + 610, 210), fill=accent)
        text_center(d, (x0 + 305, 165), f"Meta {letter} — {heading}", font(24, True), WHITE)
        y = 250
        for line in desc.split("\n"):
            d.text((x0 + 40, y), line, font=font(20), fill=INK2)
            y += 36
        d.text((x0 + 40, 450), "Siempre con prueba externa (Maps, IG, web…)", font=font(17), fill=GRAY)
    save(img, "01-objetivos.png")


def diagram_pipeline():
    img = Image.new("RGB", (1400, 420), MIST)
    d = ImageDraw.Draw(img)
    d.text((60, 30), "Cómo llega un lote de gimnasios a la plataforma", font=font(30, True), fill=INK)

    steps = [
        ("1. Tu tabla", "Google Sheets\ncon todas las columnas", MINT),
        ("2. Exportar", "Descargas el archivo\ncomo CSV", GREEN),
        ("3. El equipo\ncarga", "Un responsable\nlo sube a QueGym", BLUE),
        ("4. Revisar", "Tú verificas en\nla web / panel admin", AMBER),
    ]
    y = 130
    for i, (title, sub, color) in enumerate(steps):
        x = 70 + i * 330
        rounded(d, (x, y, x + 290, y + 210), 22, WHITE, color, 3)
        rounded(d, (x, y, x + 290, y + 70), 22, color)
        d.rectangle((x, y + 40, x + 290, y + 70), fill=color)
        for j, line in enumerate(title.split("\n")):
            text_center(d, (x + 145, y + 28 + j * 22), line, font(18, True), INK if color == MINT else WHITE)
        yy = y + 105
        for line in sub.split("\n"):
            text_center(d, (x + 145, yy), line, font(17), INK2)
            yy += 30
        if i < 3:
            ax = x + 295
            d.polygon([(ax, y + 100), (ax + 28, y + 115), (ax, y + 130)], fill=GREEN)
    d.text((60, 370), "Tú preparas y verificas la tabla. La carga masiva la coordina el responsable del equipo.", font=font(16), fill=GRAY)
    save(img, "02-pipeline.png")


def diagram_status():
    img = Image.new("RGB", (1400, 380), WHITE)
    d = ImageDraw.Draw(img)
    d.text((60, 28), "Estados que usarás en la columna «Estado» del Sheet", font=font(28, True), fill=INK)

    flow = [
        ("Pendiente", GRAY),
        ("En revisión", AMBER),
        ("Verificado", GREEN),
        ("Publicado", BLUE),
    ]
    y = 120
    for i, (label, color) in enumerate(flow):
        x = 70 + i * 300
        rounded(d, (x, y, x + 220, y + 90), 40, color)
        text_center(d, (x + 110, y + 45), label, font(20, True), WHITE)
        if i < 3:
            d.polygon([(x + 230, y + 35), (x + 270, y + 45), (x + 230, y + 55)], fill=SOFT)

    alts = [("Bloqueado", RED), ("Duplicado", AMBER), ("Cerrado", GRAY)]
    d.text((60, 260), "Si no se puede publicar:", font=font(18, True), fill=INK2)
    for i, (label, color) in enumerate(alts):
        x = 320 + i * 220
        rounded(d, (x, 245, x + 190, 305), 28, color)
        text_center(d, (x + 95, 275), label, font(18, True), WHITE)
    save(img, "03-estados.png")


def diagram_completeness():
    img = Image.new("RGB", (1400, 520), MIST)
    d = ImageDraw.Draw(img)
    d.text((60, 30), "Cómo están hoy los ~95 gimnasios ya cargados", font=font(30, True), fill=INK)
    metrics = [
        ("Tienen descripción clara", 100, GREEN),
        ("Tienen foto", 95, GREEN),
        ("Tienen teléfono / contacto", 92, GREEN),
        ("Tienen precio de referencia", 60, AMBER),
        ("Perfil listo para verse bien en la app", 52, AMBER),
    ]
    for i, (label, pct, color) in enumerate(metrics):
        y = 110 + i * 70
        d.text((60, y + 8), label, font=font(19, True), fill=INK2)
        rounded(d, (520, y, 1260, y + 42), 14, WHITE)
        fill_w = int(740 * pct / 100)
        rounded(d, (520, y, 520 + fill_w, y + 42), 14, color)
        d.text((1280, y + 8), f"{pct}%", font=font(20, True), fill=INK)
    d.text((60, 470), "Prioridad: completar precios, contactos y fotos — y sumar gimnasios que falten.", font=font(17), fill=GRAY)
    save(img, "04-completitud.png")


def diagram_methods():
    img = Image.new("RGB", (1400, 560), WHITE)
    d = ImageDraw.Draw(img)
    d.text((60, 28), "Herramientas que puedes usar (combinables)", font=font(30, True), fill=INK)
    cards = [
        ("Google Sheets", "Tu tabla diaria\nFuente de verdad\nExportas cuando el\nlote esté listo", MINT),
        ("Panel admin", "Corregir 1 a 20\ngimnasios a mano\nFotos, precios,\nnombre, zona", GREEN),
        ("Carga por lote", "Cuando hay muchos\nnuevos o cambios:\nentregas CSV al\nresponsable", BLUE),
        ("Fuentes afuera", "Google Maps\nInstagram / web\nWhatsApp o llamada\nPrueba + fecha", AMBER),
    ]
    for i, (title, body, color) in enumerate(cards):
        x = 50 + i * 335
        y = 110
        rounded(d, (x, y, x + 310, y + 360), 24, MIST if i % 2 == 0 else WHITE, color, 3)
        rounded(d, (x + 20, y + 24, x + 290, y + 100), 18, color)
        text_center(d, (x + 155, y + 62), title, font(22, True), WHITE if color != MINT else INK)
        yy = y + 140
        for line in body.split("\n"):
            text_center(d, (x + 155, yy), line, font(18), INK2)
            yy += 36
    save(img, "05-metodos.png")


def diagram_venue_card():
    img = Image.new("RGB", (1400, 720), MIST)
    d = ImageDraw.Draw(img)
    d.text((60, 28), "Ejemplo: cómo se ve un gimnasio bien cargado", font=font(28, True), fill=INK)

    rounded(d, (60, 100, 820, 660), 28, WHITE, SOFT, 2)
    rounded(d, (60, 100, 820, 220), 28, GREEN)
    d.rectangle((60, 180, 820, 220), fill=GREEN)
    d.text((90, 130), "Gold's Gym (sede C.C. San Ignacio)", font=font(24, True), fill=WHITE)
    d.text((90, 175), "Zona: Chacao  ·  Tipo: Gimnasio integral", font=font(16), fill=MIST)

    fields = [
        ("Dirección / Maps", "Link de Google Maps verificado"),
        ("Teléfono", "0212-2642045"),
        ("Instagram", "@goldsgymve"),
        ("Precio ref.", "Desde 80 USD / mes"),
        ("Horario", "Lun–Vie 6am–9pm · Sáb–Dom reducido"),
        ("Fotos", "2 URLs públicas que abren bien"),
    ]
    for i, (k, v) in enumerate(fields):
        col = i % 2
        row = i // 2
        x = 100 + col * 360
        y = 260 + row * 70
        d.text((x, y), k, font=font(14), fill=GRAY)
        d.text((x, y + 24), v, font=font(17, True), fill=INK)

    d.text((100, 500), "Actividades", font=font(14), fill=GRAY)
    mods = ["Cycling", "Pilates", "Yoga", "TRX"]
    x = 100
    for m in mods:
        w = d.textbbox((0, 0), m, font=font(16))[2] + 28
        rounded(d, (x, 530, x + w, 570), 16, MINT)
        text_center(d, (x + w / 2, 550), m, font(15), INK)
        x += w + 12

    d.text((100, 600), "Amenidades", font=font(14), fill=GRAY)
    ams = ["Sauna", "Parking", "Lockers", "Duchas"]
    x = 100
    for a in ams:
        w = d.textbbox((0, 0), a, font=font(16))[2] + 28
        rounded(d, (x, 630, x + w, 670), 16, SOFT)
        text_center(d, (x + w / 2, 650), a, font(15), INK2)
        x += w + 12

    rounded(d, (860, 100, 1340, 660), 28, WHITE, GREEN, 3)
    d.text((900, 130), "Qué debe tener la fila", font=font(22, True), fill=INK)
    mapping = [
        "Nombre comercial correcto",
        "Municipio / zona clara",
        "Link de Google Maps",
        "Teléfono o WhatsApp",
        "Precio de referencia",
        "Actividades que ofrece",
        "Amenidades (sauna, parking…)",
        "Horario resumido",
        "Instagram o web (si hay)",
        "Fotos con link que abra",
        "Notas de verificación",
        "Estado (Pendiente → …)",
    ]
    y = 185
    for item in mapping:
        rounded(d, (900, y + 4, 922, y + 26), 6, GREEN)
        d.text((940, y), item, font=font(17), fill=INK2)
        y += 36
    save(img, "06-anatomia-venue.png")


def diagram_phases():
    img = Image.new("RGB", (1400, 480), WHITE)
    d = ImageDraw.Draw(img)
    d.text((60, 28), "Plan de trabajo en 4 etapas", font=font(30, True), fill=INK)
    phases = [
        ("0", "Arranque", "1–2 días\nLeer esta guía,\npedir accesos,\npracticar con 5", MINT),
        ("1", "Revisión", "Los ~95 ya\npublicados\n10–15 por día", GREEN),
        ("2", "Ampliar", "Buscar faltantes\nevitar repetidos\nmarcar listos", BLUE),
        ("3", "Cierre", "Completar huecos\n(precio/foto)\nentregar reporte", AMBER),
    ]
    for i, (num, title, body, color) in enumerate(phases):
        x = 60 + i * 335
        rounded(d, (x, 110, x + 300, 420), 24, MIST, color, 3)
        rounded(d, (x + 110, 130, x + 190, 210), 40, color)
        text_center(d, (x + 150, 170), num, font(36, True), WHITE if color != MINT else INK)
        text_center(d, (x + 150, 250), title, font(24, True), INK)
        yy = 300
        for line in body.split("\n"):
            text_center(d, (x + 150, yy), line, font(16), INK2)
            yy += 28
    save(img, "07-fases.png")


def diagram_verify_loop():
    img = Image.new("RGB", (1400, 500), MIST)
    d = ImageDraw.Draw(img)
    d.text((60, 28), "Tu rutina diaria (paso a paso)", font=font(30, True), fill=INK)
    steps = [
        ("1", "Abrir el Sheet\ny filtrar Pendiente"),
        ("2", "Abrir Google Maps\ne Instagram / web"),
        ("3", "Comparar con lo\nque se ve en QueGym"),
        ("4", "Completar o corregir\nla fila del Sheet"),
        ("5", "Si hace falta, editar\nen el panel admin"),
        ("6", "Marcar estado +\nanotar la prueba"),
    ]
    for i, (num, label) in enumerate(steps):
        x = 50 + (i % 3) * 450
        y = 110 + (i // 3) * 170
        rounded(d, (x, y, x + 410, y + 140), 22, WHITE, GREEN, 2)
        rounded(d, (x + 20, y + 30, x + 90, y + 100), 18, GREEN)
        text_center(d, (x + 55, y + 65), num, font(28, True), WHITE)
        yy = y + 45
        for line in label.split("\n"):
            d.text((x + 115, yy), line, font=font(20), fill=INK2)
            yy += 32
    save(img, "08-loop-diario.png")


def diagram_access():
    img = Image.new("RGB", (1400, 420), WHITE)
    d = ImageDraw.Draw(img)
    d.text((60, 28), "Qué debes pedir vs qué no te corresponde", font=font(28, True), fill=INK)

    rounded(d, (60, 100, 680, 380), 24, MIST, GREEN, 3)
    d.text((100, 130), "Pide al responsable", font=font(24, True), fill=INK)
    for i, item in enumerate([
        "Usuario del panel admin (staging)",
        "Acceso de editor al Google Sheet",
        "Confirmación: solo ambiente de prueba",
        "Canal para dudas (WhatsApp / Slack)",
        "Ejemplos de 2–3 gimnasios bien hechos",
    ]):
        rounded(d, (100, 180 + i * 36, 130, 205 + i * 36), 8, GREEN)
        d.text((145, 180 + i * 36), item, font=font(17), fill=INK2)

    rounded(d, (720, 100, 1340, 380), 24, (255, 240, 235), RED, 3)
    d.text((760, 130), "No necesitas / no toques", font=font(24, True), fill=INK)
    for i, item in enumerate([
        "Contraseñas técnicas del servidor",
        "Subir lotes a producción por tu cuenta",
        "Cambiar el código de la app",
        "El sitio público final (www) sin aviso",
        "Inventar datos para «completar»",
    ]):
        rounded(d, (760, 180 + i * 36, 790, 205 + i * 36), 8, RED)
        d.text((805, 180 + i * 36), item, font=font(17), fill=INK2)
    save(img, "09-accesos.png")


def diagram_sheet_example():
    """Visual mock of a Google Sheets-like table with 2 example gyms."""
    img = Image.new("RGB", (1600, 720), (241, 243, 244))
    d = ImageDraw.Draw(img)

    # Sheet chrome
    rounded(d, (30, 30, 1570, 690), 12, WHITE, (200, 200, 200), 1)
    d.rectangle((30, 30, 1570, 78), fill=(232, 240, 254))
    d.text((50, 44), "QueGym · Catálogo Caracas — Tracking  |  Hoja 1", font=font(18, True), fill=(60, 64, 67))

    headers = [
        ("A", "Nombre del gimnasio", 210),
        ("B", "Zona / Municipio", 130),
        ("C", "Categoría", 140),
        ("D", "Link Google Maps", 150),
        ("E", "Teléfono / WhatsApp", 140),
        ("F", "Instagram", 110),
        ("G", "Precio ref.", 120),
        ("H", "Actividades", 140),
        ("I", "Amenidades", 130),
        ("J", "Horario", 130),
        ("K", "Estado", 100),
    ]

    # Column letters bar
    d.rectangle((30, 78, 1570, 108), fill=(248, 249, 250))
    x = 70
    d.rectangle((30, 78, 70, 108), fill=(241, 243, 244))
    for letter, title, w in headers:
        d.line((x, 78, x, 108), fill=(218, 220, 224))
        text_center(d, (x + w / 2, 93), letter, font(12, True), GRAY)
        x += w

    # Header row
    y = 108
    d.rectangle((30, y, 1570, y + 56), fill=MIST)
    d.rectangle((30, y, 70, y + 56), fill=(241, 243, 244))
    text_center(d, (50, y + 28), "1", font(12), GRAY)
    x = 70
    for letter, title, w in headers:
        # wrap title
        words = title.split()
        if len(title) > 14:
            mid = len(words) // 2 or 1
            lines = [" ".join(words[:mid]), " ".join(words[mid:])]
        else:
            lines = [title]
        yy = y + 14 if len(lines) == 1 else y + 8
        for line in lines:
            text_center(d, (x + w / 2, yy + 8), line, font(11, True), INK)
            yy += 16
        d.line((x, y, x, y + 56), fill=(218, 220, 224))
        x += w

    rows = [
        (
            "2",
            [
                "Gold's Gym (C.C. San Ignacio)",
                "Chacao",
                "Gimnasio integral",
                "maps…/san-ignacio",
                "0212-2642045",
                "@goldsgymve",
                "80$ mensual",
                "Cycling, Pilates, Yoga, TRX",
                "Sauna, Parking, Lockers, Duchas",
                "L-V 6am-9pm; Sáb 8-4",
                "Verificado",
            ],
            (232, 245, 233),
        ),
        (
            "3",
            [
                "Black Rock GYM",
                "Baruta",
                "Entrenamiento híbrido",
                "maps…/black-rock",
                "0412-8958723",
                "@theblackrockgym",
                "15$ diario / 30$ sem.",
                "Escalada, CrossFit, Yoga",
                "Sauna, Parking, Baby GYM",
                "L-V 6am-9pm; Sáb 9-3",
                "En revisión",
            ],
            (255, 248, 225),
        ),
        (
            "4",
            [
                "(fila vacía — nuevo)",
                "…",
                "…",
                "pegar link Maps",
                "…",
                "@…",
                "…",
                "separar con comas",
                "separar con comas",
                "…",
                "Pendiente",
            ],
            WHITE,
        ),
    ]

    y = 164
    for num, cells, bg in rows:
        h = 100
        d.rectangle((30, y, 1570, y + h), fill=bg)
        d.rectangle((30, y, 70, y + h), fill=(241, 243, 244))
        text_center(d, (50, y + h / 2), num, font(12), GRAY)
        x = 70
        for (letter, title, w), cell in zip(headers, cells):
            # simple wrap
            max_chars = max(8, w // 8)
            if len(cell) > max_chars + 4:
                # two lines
                cut = cell.rfind(" ", 0, max_chars) if " " in cell[:max_chars] else max_chars
                line1, line2 = cell[:cut].strip(), cell[cut:].strip()
                d.text((x + 6, y + 28), line1[: max_chars + 2], font=font(11), fill=INK2)
                d.text((x + 6, y + 48), line2[: max_chars + 2], font=font(11), fill=INK2)
            else:
                d.text((x + 6, y + 42), cell, font=font(12), fill=INK2)
            d.line((x, y, x, y + h), fill=(218, 220, 224))
            x += w
        d.line((30, y + h, 1570, y + h), fill=(218, 220, 224))
        y += h

    # Extra columns note
    d.rectangle((30, y, 1570, 690), fill=(255, 255, 255))
    d.text((50, y + 18), "También agrega columnas: Planes · Fotos (URLs) · Existe? (Sí/No) · Fuente verificada · Notas de evidencia · Acción · Listo para cargar (Sí/No)", font=font(14), fill=GRAY)
    d.text((50, y + 48), "Verde = Verificado  ·  Amarillo = En revisión  ·  Fila 4 = plantilla para un gimnasio nuevo", font=font(14, True), fill=INK2)
    save(img, "10-ejemplo-sheet.png")


def main():
    diagram_objectives()
    diagram_pipeline()
    diagram_status()
    diagram_completeness()
    diagram_methods()
    diagram_venue_card()
    diagram_phases()
    diagram_verify_loop()
    diagram_access()
    diagram_sheet_example()
    print("done")


if __name__ == "__main__":
    main()
