"""Render the motion-graphics overlay (transparent PNG frames) and composite over base video + audio.
Usage: python3 render_overlay.py base.mp4 audio.m4a out.mp4 [fps] [t0] [t1]"""
import subprocess, sys, pathlib
from playwright.sync_api import sync_playwright
base, audio, out = sys.argv[1:4]
FPS = int(sys.argv[4]) if len(sys.argv) > 4 else 30
T0 = float(sys.argv[5]) if len(sys.argv) > 5 else 0
T1 = float(sys.argv[6]) if len(sys.argv) > 6 else 34.6
here = pathlib.Path(__file__).parent.resolve()
cmd = ["ffmpeg","-y","-loglevel","error","-i",base,"-f","image2pipe","-framerate",str(FPS),"-c:v","png","-i","-","-i",audio,
 "-filter_complex","[0:v][1:v]overlay=format=auto,format=yuv420p[v]","-map","[v]","-map","2:a","-c:v","libx264","-preset","medium","-crf","17",
 "-r",str(FPS),"-c:a","aac","-b:a","192k","-t",str(T1-T0),"-movflags","+faststart",out]
p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width":1080,"height":1920})
    pg.goto((here/"overlay.html").as_uri())
    pg.evaluate("window.ready")
    n = int((T1-T0)*FPS)
    for i in range(n):
        pg.evaluate(f"setT({T0+i/FPS})")
        p.stdin.write(pg.screenshot(omit_background=True, type="png"))
    b.close()
p.stdin.close(); p.wait()
print("done", out)
