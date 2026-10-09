import sys, pathlib
from playwright.sync_api import sync_playwright
here = pathlib.Path(__file__).parent.resolve()
times = [float(x) for x in sys.argv[2:]]
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=__import__('os').environ.get('CHROME_PATH'), args=['--no-sandbox']); pg = b.new_page(viewport={"width":1080,"height":1920})
    pg.goto((here/__import__("os").environ.get("OVERLAY","overlay.html")).as_uri()); pg.evaluate("window.ready")
    for t in times:
        pg.evaluate(f"setT({t})"); pg.screenshot(path=f"{sys.argv[1]}_{t:.1f}.png", omit_background=False)
    b.close()
