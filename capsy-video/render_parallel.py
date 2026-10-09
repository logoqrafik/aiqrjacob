"""Parallel frame renderer: python3 render_parallel.py overlay.html outdir fps t0 t1 workers"""
import sys, os, pathlib, multiprocessing as mp
from playwright.sync_api import sync_playwright
overlay, outdir, fps, t0, t1, workers = sys.argv[1], sys.argv[2], int(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), int(sys.argv[6])
here = pathlib.Path(__file__).parent.resolve()
def work(args):
    wid, frames = args
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=os.environ.get('CHROME_PATH'), args=['--no-sandbox'])
        pg = b.new_page(viewport={"width":1080,"height":1920})
        pg.goto((here/overlay).as_uri()); pg.evaluate("window.ready")
        for i in frames:
            pg.evaluate(f"setT({t0+i/fps})")
            pg.screenshot(path=f"{outdir}/f{i:05d}.png", omit_background=True, type="png")
        b.close()
    return wid
if __name__ == "__main__":
    os.makedirs(outdir, exist_ok=True)
    n = int((t1-t0)*fps)
    chunks = [(w, list(range(w, n, workers))) for w in range(workers)]   # interleaved so load is even
    with mp.Pool(workers) as p: list(p.imap_unordered(work, chunks))
    print("frames", n)
