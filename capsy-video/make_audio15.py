"""Music bed + SFX for the 15 s Capsy ad (48 kHz stereo wav)."""
import numpy as np, wave, sys
SR=48000; DUR=15.2; N=int(SR*DUR); rng=np.random.default_rng(11)
L=np.zeros(N); R=np.zeros(N)
def add(sig,t,g=1.0,pan=0.0):
    i=int(t*SR); j=min(N,i+len(sig))
    if i>=N or j<=i: return
    s=sig[:j-i]*g; L[i:j]+=s*(1-max(0,pan)); R[i:j]+=s*(1+min(0,pan))
def lp(x,fc):
    a=1-np.exp(-2*np.pi*fc/SR); y=np.zeros_like(x); s=0.0
    for k in range(len(x)): s+=a*(x[k]-s); y[k]=s
    return y
def sweep_lp(x,f0,f1):
    n=len(x); fc=np.geomspace(f0,f1,n); a=1-np.exp(-2*np.pi*fc/SR); y=np.zeros(n); s=0.0
    for k in range(n): s+=a[k]*(x[k]-s); y[k]=s
    return y
def whoosh(dur=.5,up=True):
    n=int(dur*SR); x=rng.standard_normal(n); y=sweep_lp(x,300,8000) if up else sweep_lp(x,8000,300)
    y=y-lp(y,150); t=np.linspace(0,1,n); e=np.sin(np.pi*t)**1.6; y=y*e; return y/(np.max(np.abs(y))+1e-9)
def riser(dur=1.0):
    n=int(dur*SR); x=rng.standard_normal(n); y=sweep_lp(x,200,9000); y=y-lp(y,300); t=np.linspace(0,1,n); y=y*t**2.2
    f=200+1800*t**2; y+=0.25*np.sin(2*np.pi*np.cumsum(f)/SR)*t**2; return y/(np.max(np.abs(y))+1e-9)
def boom(dur=1.1):
    n=int(dur*SR); t=np.arange(n)/SR; f=40+100*np.exp(-t*10); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*3.4)
def kick():
    n=int(.28*SR); x=np.arange(n)/SR; return np.sin(2*np.pi*np.cumsum(48+110*np.exp(-x*32))/SR)*np.exp(-x*13)
def clap():
    n=int(.18*SR); x=np.arange(n)/SR; y=rng.standard_normal(n); y=y-lp(y,900); return y*np.exp(-x*28)
def hat(o=False):
    n=int((.18 if o else .05)*SR); x=np.arange(n)/SR; y=rng.standard_normal(n); y=y-lp(y,6000); return y*np.exp(-x*(18 if o else 70))
def pop(f=900,dur=.14):
    n=int(dur*SR); t=np.arange(n)/SR; return np.sin(2*np.pi*np.cumsum(f*(1+.8*np.exp(-t*60)))/SR)*np.exp(-t*28)
def tick(f=2200):
    n=int(.03*SR); t=np.arange(n)/SR; return np.sin(2*np.pi*f*t)*np.exp(-t*160)
def chime(f=1568,dur=.9):
    n=int(dur*SR); t=np.arange(n)/SR
    s=sum(a*np.sin(2*np.pi*f*m*t) for m,a in ((1,1),(1.5,.5),(2,.35),(3,.15))); return s*np.exp(-t*5.5)*np.minimum(1,t/.004)
def thud():
    n=int(.25*SR); t=np.arange(n)/SR; return np.sin(2*np.pi*(70+60*np.exp(-t*40))*t)*np.exp(-t*22)+.2*rng.standard_normal(n)*np.exp(-t*90)
def bass(f,dur):
    n=int(dur*SR); t=np.arange(n)/SR; s=np.sin(2*np.pi*f*t)+.3*np.sin(2*np.pi*2*f*t); return lp(s,500)*np.exp(-t*4)*np.minimum(1,t/.01)
def pad(freqs,dur):
    n=int(dur*SR); t=np.arange(n)/SR; s=np.zeros(n)
    for f in freqs:
        for d in (-.4,.4):
            ff=f*(1+d/100); s+=np.sin(2*np.pi*ff*t)+.35*np.sin(2*np.pi*2*ff*t)+.12*np.sin(2*np.pi*3*ff*t)
    s/=len(freqs)*3; return s*np.minimum(1,t/.6)*np.minimum(1,(dur-t)/.6)
# --- music: 120 bpm
beat=.5
chords=[(110,130.81,164.81,220),(87.31,110,130.81,174.61),(130.81,164.81,196,261.63),(98,123.47,146.83,196)]
for k,t in enumerate(np.arange(0,DUR,2.0)): add(pad(chords[k%4],2.4),t,.30 if t>3.4 else .22)
bf=[55,43.65,65.41,49]
t=3.6;i=0
while t<14.45:
    add(kick(),t,.45); add(hat(),t+beat/2,.08,.3)
    if i%2==1: add(clap(),t,.12)
    add(bass(bf[int((t//2)%4)],.45),t+beat/2,.22)
    t+=beat;i+=1
add(kick(),0.0,.35)
for i,f in enumerate([440,523.25,659.25,783.99]*2): add(chime(f*2,.5)*.5,6.85+i*.25,.05,pan=(-.4 if i%2 else .4))
# --- SFX
W=.55
add(boom(.9),0.0,.35)
for tt in (1.75,2.3,2.85): add(pop(900+int(tt*100)),tt,.5)
for a in (3.65,5.25):
    add(whoosh(.45,True),a-.2,W); add(boom(.8),a,.5); add(thud(),a+.12,.35)
    for i in range(14): add(tick(1500+i*70),a+.08+i*.045,.2)
add(pop(1100),4.3,.55); add(chime(1760,.7),4.3,.28); add(chime(1568),4.2,.22)
add(pop(1100),5.9,.55); add(chime(1760,.7),5.9,.28); add(chime(1568),5.8,.22)
add(whoosh(.45,True),6.65,W); add(boom(.7),6.85,.4)
for tt in (6.95,7.85,8.75,9.35): add(pop(800+int((tt-6.9)*120)),tt,.55); add(tick(1800),tt+.2,.4); add(chime(1318,.5),tt+.05,.15)
add(riser(.9),9.5,.55); add(boom(1.3),10.3,.7); add(chime(1568,1.1),10.32,.3); add(chime(2093,1.1),10.4,.22)
add(whoosh(1.7,True),10.3,.28)
add(whoosh(.4,False),11.95,.5); add(whoosh(.45,True),12.0,.5); add(boom(.6),12.2,.45)
add(pop(800),13.2,.6); add(tick(1800),13.45,.5)
add(whoosh(.4,True),14.3,.55); add(boom(1.0),14.5,.6); add(chime(1568,1.2),14.55,.35); add(chime(2349,1.2),14.62,.28); add(chime(3136,1.0),14.7,.18)
pk=max(np.abs(L).max(),np.abs(R).max()); L,R=L/pk*.9,R/pk*.9
out=np.stack([L,R],1)
with wave.open(sys.argv[1] if len(sys.argv)>1 else 'bed15.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out*32767).astype('<i2').tobytes())
print('ok')
