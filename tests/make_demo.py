"""Generate synthetic teaching fixtures, not real instructor material."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen.canvas import Canvas

DEMO_INPUT = Path(__file__).resolve().parents[1] / "demo" / "input"
PAGE_SIZE = (720, 500)


def draw_text_page(canvas, title, lines, page_number):
    """Draw a page whose text can be indexed directly from the PDF."""
    canvas.setFillColorRGB(0.98, 0.97, 0.94)
    canvas.rect(0, 0, *PAGE_SIZE, fill=1, stroke=0)
    canvas.setFillColorRGB(0.16, 0.18, 0.16)
    canvas.setFont("Helvetica", 10)
    canvas.drawString(42, 460, "SYNTHETIC TEACHING SAMPLE — NOT A TEACHER HANDOUT")
    canvas.setFont("Helvetica-Bold", 25)
    canvas.drawString(42, 408, title)
    canvas.setFont("Helvetica", 16)
    for index, line in enumerate(lines):
        canvas.drawString(42, 355 - index * 35, line)
    canvas.setFont("Helvetica", 10)
    canvas.drawString(42, 25, f"PDF page {page_number}")
    canvas.showPage()


def draw_raster_page(canvas):
    """Keep this page image-only to exercise low-text detection and visual review."""
    image = Image.new("RGB", (1440, 1000), "#faf7f0")
    draw = ImageDraw.Draw(image)
    # Pillow >= 10.1 bundles a scalable font, so no system font path is needed.
    font = ImageFont.load_default(size=34)
    heading_font = ImageFont.load_default(size=48)
    draw.text(
        (84, 65),
        "SYNTHETIC SAMPLE / RASTER-ONLY PAGE",
        font=font,
        fill="#555555",
    )
    draw.text((84, 160), "2. Read the two-way table", font=heading_font, fill="#292d29")
    rows = [
        ["", "Economics", "Not economics", "Total"],
        ["Statistics", "24", "16", "40"],
        ["Not statistics", "26", "34", "60"],
        ["Total", "50", "50", "100"],
    ]
    for row_index, row in enumerate(rows):
        for column_index, text in enumerate(row):
            draw.text(
                (84 + column_index * 330, 300 + row_index * 110),
                text,
                font=font,
                fill="#292d29",
            )
    draw.text(
        (84, 850),
        "24 / 40 = 0.60 differs from 50 / 100 = 0.50.",
        font=font,
        fill="#a74326",
    )
    canvas.drawImage(ImageReader(image), 0, 0, width=720, height=500)
    canvas.showPage()


def create_demo(output_dir):
    """Write two small example PDFs to the selected directory."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    canvas = Canvas(str(output_dir / "01-conditional-probability.pdf"), pagesize=PAGE_SIZE)
    draw_text_page(
        canvas,
        "1. Conditional probability",
        [
            "A survey contains 100 students.",
            "40 students take statistics (S).",
            "24 of those statistics students also take economics (E).",
            "Question: among statistics students, what fraction take economics?",
        ],
        1,
    )
    draw_text_page(
        canvas,
        "2. Change the reference group",
        [
            "P(E | S) = P(E and S) / P(S), provided P(S) > 0.",
            "P(E | S) = (24/100) / (40/100) = 24/40 = 0.60.",
            "P(E and S) = 0.24 is a different quantity.",
            "Conditioning changes the denominator to the specified group.",
        ],
        2,
    )
    canvas.save()

    canvas = Canvas(str(output_dir / "02-independence.pdf"), pagesize=PAGE_SIZE)
    draw_text_page(
        canvas,
        "1. Independence",
        [
            "E and S are independent if P(E and S) = P(E) P(S).",
            "When P(S) > 0, this is equivalent to P(E | S) = P(E).",
            "Suppose 50 of all 100 students take economics.",
            "P(E) = 0.50, while P(E | S) = 0.60: not independent.",
        ],
        1,
    )
    draw_raster_page(canvas)
    canvas.save()


def main():
    create_demo(DEMO_INPUT)
    print(DEMO_INPUT)


if __name__ == "__main__":
    main()
