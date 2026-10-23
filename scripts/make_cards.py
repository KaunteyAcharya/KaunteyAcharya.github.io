"""Draw the link-preview cards (1200x630 PNG) in the site's own style.

Usage: python scripts/make_cards.py <cards.json> <output folder>
cards.json is a list of {"file", "label", "title", "summary"} written by build-notes.mjs.
Runs during deployment (GitHub Actions); nothing here needs editing for a new note.
"""
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1200, 630
PAD = 80
BG = (245, 245, 220)                     # --bg  #F5F5DC
INK = (0, 0, 0)                          # --text
MUTED = tuple(round(0.34 * c) for c in BG)          # black at 66% on the beige
LINE = tuple(round(0.82 * c) for c in BG)           # black at 18% on the beige


def font(weight, size):
    return ImageFont.truetype(os.path.join(HERE, 'fonts', f'JetBrainsMono-{weight}.ttf'), size)


def wrap(draw, text, fnt, width):
    words, lines, cur = text.split(), [], ''
    for w in words:
        test = (cur + ' ' + w).strip()
        if draw.textlength(test, font=fnt) <= width or not cur:
            cur = test
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def clamp(draw, lines, fnt, width, n):
    """Keep at most n lines, ending the last one with an ellipsis if text was cut."""
    if len(lines) <= n:
        return lines
    last = lines[n - 1]
    while last and draw.textlength(last + '…', font=fnt) > width:
        last = last.rsplit(' ', 1)[0] if ' ' in last else last[:-1]
    return lines[:n - 1] + [last.rstrip(',.;:') + '…']


def card(c, out_path, logo):
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    width = W - 2 * PAD

    # Small label, like the section labels on the site
    d.text((PAD, PAD - 6), c['label'].upper(), font=font('Regular', 22), fill=MUTED)

    # Title: as large as fits in three lines
    for size in (66, 60, 54, 48, 44):
        tf = font('Bold', size)
        tl = wrap(d, c['title'], tf, width)
        if len(tl) <= 3:
            break
    tl = clamp(d, tl, tf, width, 3)
    y = PAD + 52
    lh = int(size * 1.22)
    for line in tl:
        d.text((PAD, y), line, font=tf, fill=INK)
        y += lh

    # Summary, two lines at most
    if c.get('summary'):
        sf = font('Regular', 26)
        sl = clamp(d, wrap(d, c['summary'], sf, width), sf, width, 2 if len(tl) < 3 else 1)
        y += 18
        for line in sl:
            d.text((PAD, y), line, font=sf, fill=MUTED)
            y += 38

    # Footer: rule, logo, name, address
    fy = H - 112
    d.line((PAD, fy, W - PAD, fy), fill=LINE, width=2)
    lh_logo = 40
    lw = round(logo.width * lh_logo / logo.height)
    mark = logo.resize((lw, lh_logo), Image.LANCZOS)
    img.paste(mark, (PAD, fy + 32), mark)
    nf = font('Bold', 24)
    d.text((PAD + lw + 18, fy + 38), 'Kauntey Acharya', font=nf, fill=INK)
    uf = font('Regular', 22)
    url = 'kaunteyacharya.com'
    d.text((W - PAD - d.textlength(url, font=uf), fy + 40), url, font=uf, fill=MUTED)

    img.save(out_path, optimize=True)


def main():
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    logo = Image.open(os.path.join(HERE, 'logo-mark.png')).convert('RGBA')
    cards = json.load(open(src, encoding='utf-8'))
    for c in cards:
        card(c, os.path.join(out, c['file']), logo)
    print(f'Made {len(cards)} preview cards')


if __name__ == '__main__':
    main()
