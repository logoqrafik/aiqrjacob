"""Render 9:16 (1080x1920) PNGs from template.html.
Usage: python3 render.py            -> renders every case in CASES
Add a case: drop the screenshot into assets/ and add an entry below."""
import urllib.parse, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent.resolve()

CASES = {
  "case-patates": dict(img="assets/ref-3.png", client="Qida / Delivery",
      title="165 mesaj, <em>16,94 TL</em>", sub="Hər mesajın dəyəri. Kampaniya 14 403 nəfərə çatdı.", zx=100,
      m1v="165", m1l="Mesajlaşma söhbəti", m2v="16,94 TL", m2l="Bir mesajın dəyəri", m3v="14 403", m3l="Əhatə (7 gün)"),
  "case-mesaj-94": dict(img="assets/ref-2.png", client="Mesaj kampaniyası",
      title="94 mesaj, <em>33,13 TL</em>", sub="Hər mesajın dəyəri. Fərdiləşdirilmiş mesajlaşma kampaniyası.", zx=100,
      m1v="94", m1l="Mesajlaşma söhbəti", m2v="33,13 TL", m2l="Bir mesajın dəyəri", m3v="3 114 TL", m3l="Ümumi xərc"),
  "case-lead-4038": dict(img="assets/ref-5.png", client="Lead generasiya",
      title="4 038 müraciət, <em>10,88 TL</em>", sub="Hər müraciətin dəyəri. Potensial müştəri kampaniyası.", zx=90,
      m1v="4 038", m1l="Potensial müştəri", m2v="10,88 TL", m2l="Bir müraciətin dəyəri", m3v="1 500 TL", m3l="Gündəlik büdcə"),
  "case-5usd": dict(img="assets/ref-4.png", client="Gündə 5 $ büdcə",
      title="Gündə 5 $, <em>0,77 $</em>", sub="Hər mesajın dəyəri. Kiçik büdcə, real mesajlar.", zx=100,
      m1v="15", m1l="Mesajlaşma söhbəti", m2v="0,77 $", m2l="Bir mesajın dəyəri", m3v="5 $", m3l="Gündəlik büdcə"),
}

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": 1080, "height": 1920})
    for name, c in CASES.items():
        pg.goto((HERE / "template.html").as_uri() + "?" + urllib.parse.urlencode(c))
        pg.wait_for_function("document.getElementById('img').complete")
        pg.screenshot(path=str(HERE / "output" / f"{name}.png"))
        print("ok", name)
    b.close()
