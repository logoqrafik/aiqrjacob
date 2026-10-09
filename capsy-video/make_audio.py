"""Synthesise a minimal music bed + SFX track for the Capsy ad (48 kHz stereo wav, DUR seconds)."""
import numpy as np, wave, sys
SR = 48000; DUR = 34.6; N = int(SR*DUR)
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)
def add(sig, t, g=1.0, pan=0.0):
    i = int(t*SR); j = min(N, i+len(sig))
    if i >= N or j <= i: return
    s = sig[:j-i]*g
    L[i:j] += s*(1-max(0,pan)); R[i:j] += s*(1+min(0,pan))
def env(n, a, d): # fast attack, exp decay
    x = np.arange(n)/SR
    return np.minimum(1, x/max(a,1e-4))*np.exp(-x/d)
def lp(x, fc):
    a = 1-np.exp(-2*np.pi*fc/SR); y = np.zeros_like(x); s = 0.0
    for k in range(len(x)): s += a*(x[k]-s); y[k] = s
    return y
def sweep_lp(x, f0, f1):
    n = len(x); fc = np.geomspace(f0, f1, n); a = 1-np.exp(-2*np.pi*fc/SR); y = np.zeros(n); s = 0.0
    for k in range(n): s += a[k]*(x[k]-s); y[k] = s
    return y
def whoosh(dur=0.7, up=True):
    n = int(dur*SR); x = rng.standard_normal(n)
    y = sweep_lp(x, 300, 7000) if up else sweep_lp(x, 7000, 300)
    y = y - lp(y, 120)          # drop sub rumble
    t = np.linspace(0, 1, n); e = np.sin(np.pi*t)**2.0
    return y*e*0.9/np.max(np.abs(y*e)+1e-9)
def boom(dur=1.2):
    n = int(dur*SR); t = np.arange(n)/SR
    f = 42+90*np.exp(-t*9); ph = 2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*np.exp(-t*3.2)
def pop(f=900, dur=0.14):
    n = int(dur*SR); t = np.arange(n)/SR
    ph = 2*np.pi*np.cumsum(f*(1+0.8*np.exp(-t*60)))/SR
    return np.sin(ph)*np.exp(-t*28)
def tick(f=2200):
    n = int(0.03*SR); t = np.arange(n)/SR
    return np.sin(2*np.pi*f*t)*np.exp(-t*160)
def chime(f=1568, dur=0.9):
    n = int(dur*SR); t = np.arange(n)/SR
    s = sum(a*np.sin(2*np.pi*f*m*t) for m, a in ((1, 1), (1.5, .5), (2, .35), (3, .15)))
    return s*np.exp(-t*5.5)*np.minimum(1, t/0.004)
def thud():
    n = int(0.25*SR); t = np.arange(n)/SR
    return (np.sin(2*np.pi*(70+60*np.exp(-t*40))*t)*np.exp(-t*22)) + 0.2*rng.standard_normal(n)*np.exp(-t*90)

def kick():
    n = int(0.3*SR); x = np.arange(n)/SR
    return np.sin(2*np.pi*np.cumsum(50+95*np.exp(-x*30))/SR)*np.exp(-x*14)

# ---- music bed ----
chords = [(110.0, 130.81, 164.81, 220.0), (87.31, 110.0, 130.81, 174.61), (130.81, 164.81, 196.0, 261.63), (98.0, 123.47, 146.83, 196.0)]
def pad(freqs, dur):
    n = int(dur*SR); t = np.arange(n)/SR; s = np.zeros(n)
    for f in freqs:
        for det in (-0.4, 0.4):
            ff = f*(1+det/100)
            s += np.sin(2*np.pi*ff*t)+0.35*np.sin(2*np.pi*2*ff*t)+0.12*np.sin(2*np.pi*3*ff*t)
    s /= len(freqs)*2*1.5
    a = np.minimum(1, t/1.2)*np.minimum(1, (dur-t)/1.2)
    return s*a
T = 0.0; k = 0
while T < DUR:
    seg = pad(chords[k % 4], 4.6)
    gain = 0.20 if T < 5.9 else 0.30
    add(seg, T, gain, pan=0)
    T += 4.3; k += 1
bpm = 100; beat = 60/bpm
t = 5.95
while t < 28.0:
    add(kick(), t, 0.40)
    h = rng.standard_normal(int(0.05*SR)); h = h-lp(h, 5000)
    add(h*np.exp(-np.arange(len(h))/SR*70), t+beat/2, 0.07, pan=0.3)
    t += beat
# outro lift
t = 28.1
for i, f in enumerate([440, 523.25, 659.25, 783.99, 659.25, 523.25]*3):
    add(chime(f*2, 0.6)*0.5, t+i*0.3, 0.06, pan=(-0.4 if i % 2 else 0.4))

# ---- SFX ----
S = 0.55
add(whoosh(.55, True), 5.45, S); add(boom(), 5.95, 0.55)
for i, tt in enumerate([7.73, 8.18, 8.63]): add(pop(700+i*180), tt-0.05+ 0.0, 0.5)
add(whoosh(.5, True), 11.45, S); add(chime(1318), 12.0, 0.25)
for a in (13.3, 17.5, 22.0):
    add(whoosh(.45, True), a-0.15, 0.5)                   # scene in
    for i in range(22):                                    # counter ticks
        add(tick(1400+i*70), a+0.12+i*0.055, 0.22)
    add(thud(), a+0.25, 0.45); add(thud(), a+0.55, 0.40)    # cards land
    add(chime(1568), a+1.55, 0.30)                          # highlight
for c in (15.2, 20.0, 24.5):
    add(pop(1100), c-0.05, 0.55); add(chime(1760, 0.7), c, 0.25)
add(whoosh(.5, True), 26.1, S)
for i in range(3): add(thud(), 26.4+i*0.2, 0.5)
add(chime(1568), 27.1, 0.4); add(chime(2093, 0.9), 27.22, 0.3)
add(whoosh(.45, False), 27.85, 0.45)
add(pop(800), 30.7, 0.6); add(tick(1800), 30.95, 0.5)
add(pop(1000), 32.5, 0.5)
add(whoosh(.6, True), 33.1, S); add(chime(1568, 1.2), 33.45, 0.35); add(chime(2349, 1.2), 33.55, 0.25); add(boom(0.9), 33.4, 0.4)

peak = max(np.max(np.abs(L)), np.max(np.abs(R)))
L, R = L/peak*0.9, R/peak*0.9
out = np.stack([L, R], 1)
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'bed.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out*32767).astype('<i2').tobytes())
print('ok')
