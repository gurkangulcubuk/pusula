# PUSULA ikon üretici — "GG" (python3 icons/make_icons.py)
from PIL import Image, ImageDraw, ImageFont
import os
D = os.path.dirname(os.path.abspath(__file__))
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
BG, FG, AC = (14, 14, 15, 255), (237, 237, 237, 255), (110, 110, 110, 255)
def make(size, maskable, name):
    S = size * 4
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    if maskable: d.rectangle([0, 0, S, S], fill=BG)
    else: d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.23), fill=BG)
    font = ImageFont.truetype(FONT, int(S * (0.34 if maskable else 0.42)))
    gap = -int(S * 0.025)
    bb = d.textbbox((0, 0), "G", font=font); gw = bb[2] - bb[0]; gh = bb[3] - bb[1]
    total = gw * 2 + gap; x = (S - total) / 2 - bb[0]; y = (S - gh) / 2 - bb[1]
    d.text((x, y), "G", font=font, fill=FG); d.text((x + gw + gap, y), "G", font=font, fill=FG)
    # ince alt çizgi: sade imza dokunuşu
    lw = int(total * 0.36); ly = int(y + bb[1] + gh + S * 0.07)
    d.rounded_rectangle([(S - lw) // 2, ly, (S + lw) // 2, ly + int(S * 0.018)], radius=int(S * 0.01), fill=AC)
    img.resize((size, size), Image.LANCZOS).save(os.path.join(D, name))
make(192, False, "icon-192.png"); make(512, False, "icon-512.png"); make(512, True, "maskable-512.png")
