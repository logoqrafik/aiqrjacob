import sys, math, subprocess, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps
SC="/tmp/claude-0/-home-user-aiqrjacob/f811b12d-0b73-5e7c-95ff-87bb79e718c3/scratchpad/"
IMG="/tmp/claude-0/-home-user-aiqrjacob/f811b12d-0b73-5e7c-95ff-87bb79e718c3/images/"
OUT="/home/user/aiqrjacob/uceller-kinetik/"
W,H=1080,1920; FPS=30
DARK=(12,18,15); GREEN=(5,143,57); ORANGE=(253,125,14); RED=(240,68,54); WHITE=(255,255,255); INK=(14,20,17)
# ---------------- timeline
T_TITLE=3.4; T_TIP0=6.0; TIP=4.8; T_ENG=T_TIP0+5*TIP; T_CTA=T_ENG+3.0; END=T_CTA+5.6
TIPS=[("05","Kutuları","karışık doldurmak",["Numaralı kutu, etiketli oda:","her şey yerini bulur."]),
      ("04","Ambalajı","son güne bırakmak",["Eşya baştan korunur:","çizilme, ezilme, toz yok."]),
      ("03","Ağır eşyayı","merdivenden taşımak",["Mobil asansörle pencereden:","hızlı ve güvenli."]),
      ("02","En ucuz","teklife atlamak",["Ucuz teklif, pahalı hasar","demek olabilir."]),
      ("01","Deneyimsiz","ekibe güvenmek",["1990'dan beri aynı özen,","aynı sorumluluk."])]
TIPBG=[DARK,GREEN,DARK,ORANGE,DARK]
HOOK=[("TAŞINMADAN",520,150,WHITE,0.10),("ÖNCE",690,190,ORANGE,0.55),("BUNU",860,190,WHITE,0.95),
      ("BİLMEZSEN",1030,170,WHITE,1.40),("PAHALIYA",1250,230,ORANGE,2.20),("PATLAR.",1440,200,WHITE,2.80)]

def ease(x): x=max(0.,min(1.,x)); return 1-(1-x)**3
def back(x):
    x=max(0.,min(1.,x)); c=1.70158; return 1+(c+1)*(x-1)**3+c*(x-1)**2
_f={}
def font(n,s):
    k=(n,int(s))
    if k not in _f: _f[k]=ImageFont.truetype("/usr/share/fonts/opentype/inter/"+n,int(s))
    return _f[k]
BLK="InterDisplay-Black.otf"; BLD="InterDisplay-Bold.otf"
def fit(txt,maxw,size,name=BLK):
    while size>20 and font(name,size).getlength(txt)>maxw: size-=4
    return size

def T(im,txt,cx,cy,size,col,t,t0,name=BLK,maxw=None,alpha=1.0,pop=True,shake=0.0,pd=0.35):
    if t<t0: return
    p=(t-t0)/pd
    if maxw: size=fit(txt,maxw,size,name)
    sz=size*(0.45+0.55*back(p)) if pop else size
    f=font(name,sz); a=ease(p*2.2)*alpha
    if a<=0: return
    pad=24; lw=int(f.getlength(txt))+2*pad; lh=int(f.size*1.35)+2*pad
    lay=Image.new("RGBA",(lw,lh),(0,0,0,0)); ImageDraw.Draw(lay).text((lw/2,lh/2),txt,font=f,fill=col+(255,),anchor="mm")
    al=lay.getchannel("A").point(lambda v:int(v*a))
    dx=shake*math.sin((t-t0)*95)*math.exp(-(t-t0)*7) if shake else 0
    dy=shake*0.6*math.cos((t-t0)*83)*math.exp(-(t-t0)*7) if shake else 0
    im.paste(lay.convert("RGB"),(int(cx-lw/2+dx),int(cy-lh/2+dy)),al)

def rrect(im,box,r,fill,alpha=1.0):
    x0,y0,x1,y1=[int(v) for v in box]
    if x1-x0<4 or y1-y0<4: return
    lay=Image.new("RGBA",(x1-x0,y1-y0),(0,0,0,0)); ImageDraw.Draw(lay).rounded_rectangle((0,0,x1-x0-1,y1-y0-1),radius=r,fill=fill+(255,))
    im.paste(lay.convert("RGB"),(x0,y0),lay.getchannel("A").point(lambda v:int(v*alpha)))
def circle(im,cx,cy,r,fill,alpha=1.0):
    r=max(r,1); d=int(r*2)
    lay=Image.new("RGBA",(d+2,d+2),(0,0,0,0)); ImageDraw.Draw(lay).ellipse((1,1,d,d),fill=fill+(255,))
    im.paste(lay.convert("RGB"),(int(cx-r-1),int(cy-r-1)),lay.getchannel("A").point(lambda v:int(v*alpha)))
def check(im,cx,cy,s,col=WHITE,alpha=1.0):
    lay=Image.new("RGBA",(int(s*2),int(s*2)),(0,0,0,0)); d=ImageDraw.Draw(lay); c=s
    d.line((c-0.35*s,c+0.02*s,c-0.08*s,c+0.3*s,c+0.4*s,c-0.28*s),fill=col+(255,),width=max(5,int(s*0.18)),joint="curve")
    im.paste(lay.convert("RGB"),(int(cx-c),int(cy-c)),lay.getchannel("A").point(lambda v:int(v*alpha)))
def cross(im,cx,cy,s,col=WHITE,alpha=1.0):
    lay=Image.new("RGBA",(int(s*2),int(s*2)),(0,0,0,0)); d=ImageDraw.Draw(lay); c=s
    for a,b in (((-.3,-.3),(.3,.3)),((-.3,.3),(.3,-.3))): d.line((c+a[0]*s,c+a[1]*s,c+b[0]*s,c+b[1]*s),fill=col+(255,),width=max(5,int(s*0.2)))
    im.paste(lay.convert("RGB"),(int(cx-c),int(cy-c)),lay.getchannel("A").point(lambda v:int(v*alpha)))

# ----- scenes
def sc_hook(t):
    red=ease((t-2.2)/0.3)*0.55
    bg=tuple(int(DARK[i]*(1-red)+(44,12,10)[i]*red) for i in range(3))
    im=Image.new("RGB",(W,H),bg)
    # sweeping orange bar
    p=ease(t/0.5); rrect(im,(72,330,72+int(300*p),342),6,ORANGE,1.0)
    # burst behind PATLAR
    if t>2.75:
        b=back((t-2.75)/0.4); R=int(330*b)
        circle(im,W/2,1440,R,ORANGE,0.20+0.10*math.sin(t*14))
    for txt,y,sz,col,t0 in HOOK:
        T(im,txt,W/2,y,sz,col,t,t0,maxw=960,shake=(14 if txt in("BİLMEZSEN","PAHALIYA","PATLAR.") else 0))
    return im
def sc_title(t):
    im=Image.new("RGB",(W,H),ORANGE)
    T(im,"TAŞINIRKEN",W/2,500,150,INK,t,0.05,maxw=940)
    T(im,"YAPILAN",W/2,650,150,INK,t,0.20,maxw=940)
    n=min(5,1+int(max(0,t-0.30)/0.14)); tn=0.30+(n-1)*0.14
    if t>=0.30: T(im,str(n),W/2,1030,760,WHITE,t,tn,pd=0.2,shake=(10 if n==5 else 0))
    T(im,"HATA",W/2,1430,270,INK,t,0.95,maxw=940)
    return im
def dots(im,cur,txt_col,t):
    for i in range(5):
        x=540+(i-2)*54
        on=i<=cur
        circle(im,x,1548,14 if i==cur else 9,ORANGE if on else txt_col,1.0 if on else 0.35)
def sc_tip(k,t):
    num,l1,l2,sol=TIPS[k]; bg=TIPBG[k]; im=Image.new("RGB",(W,H),bg)
    on_or=(bg==ORANGE); txt=INK if on_or else WHITE; mut=(60,40,20) if on_or else (186,196,191)
    # ghost number
    T(im,num,820,420,560,INK if on_or else WHITE,t,0.0,alpha=0.07 if not on_or else 0.10,pop=False)
    # label pill
    pa=back(t/0.35)
    rrect(im,(72,250,72+int(370*min(1,pa)),350),50,INK if on_or else RED,min(1,pa*1.5))
    if t>0.2:
        cross(im,72+58,300,38,WHITE,ease((t-0.2)/0.2))
        T(im,"HATA "+num,72+232,302,46,WHITE,t,0.2,name=BLD,pop=False)
    T(im,l1,W/2,800,110,mut,t,0.25,name=BLD,maxw=940)
    dim=1.0-0.45*ease((t-1.9)/0.3)
    T(im,l2,W/2,960,170,txt,t,0.6,maxw=940,alpha=dim)
    # strike
    if t>1.5:
        f=font(BLK,fit(l2,940,170)); w=f.getlength(l2); p=ease((t-1.5)/0.35)
        x0=W/2-w/2-14; x1=x0+(w+28)*p
        rrect(im,(x0,948,max(x0+8,x1),964),8,WHITE if on_or else RED,1.0)
    # solution card
    if t>2.2:
        p=back((t-2.2)/0.45); a=ease((t-2.2)/0.25); y=1240+(1-p)*90
        rrect(im,(72,y,1008,y+250),48,WHITE,a)
        circle(im,72+96,y+125,56,GREEN,a); check(im,72+96,y+125,50,WHITE,a)
        T(im,"DOĞRUSU",72+210+160,y+52,34,ORANGE,t,2.25,name=BLD,pop=False,pd=0.2)
        for i,s in enumerate(sol):
            T(im,s,72+210+ (936-210-40)/2,y+118+i*62,50,INK,t,2.3+0.1*i,name=BLD,maxw=936-210-50,pop=False,pd=0.25)
    dots(im,k,txt if not on_or else INK,t)
    return im
def sc_eng(t):
    im=Image.new("RGB",(W,H),DARK)
    T(im,"SEN HANGİSİNİ",W/2,560,150,WHITE,t,0.05,maxw=940)
    T(im,"YAPTIN?",W/2,780,260,ORANGE,t,0.25,maxw=940,shake=10)
    if t>0.8:
        p=back((t-0.8)/0.4); y=1000
        rrect(im,(300,y,780,y+170),85,WHITE,ease((t-0.8)/0.2))
        # tail
        d=ImageDraw.Draw(im); 
        if t>0.9: d.polygon([(380,y+150),(350,y+215),(450,y+160)],fill=WHITE)
        for i in range(3):
            b=0.5+0.5*math.sin(t*9-i*0.9)
            circle(im,430+i*110,y+85-14*b,22,(120,128,124) if b<0.5 else GREEN,1.0)
    T(im,"Yoruma yaz",W/2,1320,84,WHITE,t,1.3,name=BLD)
    if t>1.5:
        a=ease((t-1.5)/0.2); by=1450+12*math.sin(t*8)
        d=ImageDraw.Draw(im); d.line((W/2,by-50,W/2,by+20),fill=ORANGE,width=14); d.line((W/2-34,by-14,W/2,by+30,W/2+34,by-14),fill=ORANGE,width=14,joint="curve")
    return im
LOGO=Image.open(IMG+"1.webp").convert("RGBA")
_bg=Image.new("RGBA",LOGO.size,(255,255,255,255)); _bg.alpha_composite(LOGO); LOGO=_bg.convert("RGB")
LOGO=LOGO.crop(ImageOps.invert(LOGO.convert("L")).point(lambda p:255 if p>20 else 0).getbbox())
def sc_cta(t):
    im=Image.new("RGB",(W,H),WHITE)
    a=ease(t/0.4); lw=800; lg=LOGO.resize((lw,round(LOGO.height*lw/LOGO.width)),Image.LANCZOS)
    y=int(300+(1-a)*40); 
    if a>0.02: im.paste(Image.blend(Image.new("RGB",lg.size,WHITE),lg,a),((W-lw)//2,y))
    T(im,"1990'DAN BERİ",W/2,790,120,GREEN,t,0.35,maxw=940)
    if t>0.6: rrect(im,(W/2-100,880,W/2+100*1,890),5,ORANGE,ease((t-0.6)/0.3))
    T(im,"Taşınmanın güvenli yolu",W/2,985,62,(70,80,74),t,0.7,name=BLD,pop=False,pd=0.3)
    if t>1.5:
        pul=1+0.035*math.sin(t*7); p=back((t-1.5)/0.45); bw=int(900*pul*min(1,p)); bh=int(170*pul*min(1,p)); cx,cy=W/2,1210
        rrect(im,(cx-bw/2,cy-bh/2+10,cx+bw/2,cy+bh/2+10),85,(0,0,0),0.12)
        rrect(im,(cx-bw/2,cy-bh/2,cx+bw/2,cy+bh/2),85,(37,170,80))
        T(im,"WhatsApp'tan Yaz",W/2,cy-2,60,WHITE,t,1.8,name=BLD,pop=False,pd=0.2)
    T(im,"0542 526 34 36",W/2,1420,84,INK,t,2.1,name=BLK,maxw=940)
    T(im,"Fiyat teklifi için hemen yaz",W/2,1505,40,(90,100,95),t,2.4,name=BLD,pop=False,pd=0.3)
    return im

SCENES=[(0,T_TITLE,sc_hook),(T_TITLE,T_TIP0,sc_title)]+[(T_TIP0+i*TIP,T_TIP0+(i+1)*TIP,(lambda i:lambda t:sc_tip(i,t))(i)) for i in range(5)]+[(T_ENG,T_CTA,sc_eng),(T_CTA,END,sc_cta)]

def frame(t):
    idx=max(i for i,(a,b,f) in enumerate(SCENES) if a<=t+1e-9)
    a,b,f=SCENES[idx]; im=f(t-a)
    if idx>0 and t-a<0.45:
        pa,pb,pf=SCENES[idx-1]; prev=pf(t-pa)
        r=ease((t-a)/0.45)*1500
        m=Image.new("L",(W,H),0); ImageDraw.Draw(m).ellipse((W/2-r,H*0.52-r,W/2+r,H*0.52+r),fill=255)
        prev.paste(im,(0,0),m); im=prev
    # camera push
    z=1+0.035*((t-a)/(b-a))
    if z>1.001:
        w,h=W/z,H/z; x=(W-w)/2; y=(H-h)/2; im=im.resize((W,H),Image.BILINEAR,box=(x,y,x+w,y+h))
    return im

def render_video():
    enc=subprocess.Popen(["ffmpeg","-y","-loglevel","error","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-",
        "-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p","-an",SC+"kin_silent.mp4"],stdin=subprocess.PIPE)
    for i in range(int(END*FPS)): enc.stdin.write(frame(i/FPS).tobytes())
    enc.stdin.close(); enc.wait(); print("video ok")

# ---------------- audio
SR=44100; N=int(END*SR); L=np.zeros(N); R=np.zeros(N); rng=np.random.default_rng(11)
def add(sig,t,pan=0.0,gain=1.0):
    i=int(t*SR)
    if i>=N or i<0: return
    s=sig[:N-i]*gain; L[i:i+len(s)]+=s*(1-max(0,pan)); R[i:i+len(s)]+=s*(1+min(0,pan))
def lpf(x,fc):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); return np.fft.irfft(X/(1+(f/fc)**4),len(x))
def hpf(x,fc):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); return np.fft.irfft(X*(1-1/(1+(f/fc)**4)),len(x))
def kick(g=1.0):
    t=np.arange(int(.35*SR))/SR; f=45+110*np.exp(-t/0.035); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/0.14)*g
def hat(o=False):
    n=int((0.22 if o else 0.05)*SR); return hpf(rng.standard_normal(n),6500)*np.exp(-np.arange(n)/SR/(0.07 if o else 0.015))*0.35
def clap():
    n=int(.2*SR); t=np.arange(n)/SR; x=hpf(lpf(rng.standard_normal(n),5000),900)*(np.exp(-t/0.05)+0.6*np.exp(-((t-0.012)%0.02)/0.004)*np.exp(-t/0.08)); return x*0.5
def pluck(f,d=0.3):
    t=np.arange(int(d*SR))/SR; x=sum(np.sin(2*np.pi*f*k*t)/k**1.3 for k in (1,2,3,4))*np.exp(-t/0.11); return lpf(x,2600)*0.5
def pop(f=720,d=0.12):
    t=np.arange(int(d*SR))/SR; return np.sin(2*np.pi*(f+f*0.8*np.exp(-t/0.02))*t)*np.exp(-t/0.04)*0.8
def whoosh(d=0.6):
    n=int(d*SR); x=rng.standard_normal(n); t=np.arange(n)/SR; y=lpf(x,3800)-lpf(x,300); return y*np.sin(np.pi*np.clip(t/d,0,1))**2*0.9
def riser(d):
    n=int(d*SR); t=np.arange(n)/SR; x=hpf(rng.standard_normal(n),1500); ph=2*np.pi*np.cumsum(300+2600*(t/d)**2)/SR
    return (0.5*x+0.35*np.sin(ph))*(t/d)**2*0.7
def impact(g=1.0):
    n=int(1.0*SR); t=np.arange(n)/SR; x=np.zeros(n); k=kick(1.5); x[:len(k)]+=k; return (x+lpf(rng.standard_normal(n),2400)*np.exp(-t/0.3)*0.7)*g
def slam(g=1.0):
    n=int(0.45*SR); t=np.arange(n)/SR; x=np.zeros(n); k=kick(1.2)[:n]; x[:len(k)]+=k; return (x+lpf(rng.standard_normal(n),3500)*np.exp(-t/0.09)*0.6)*g
def buzz():
    n=int(0.28*SR); t=np.arange(n)/SR; f=190-60*t/0.28; s=np.sign(np.sin(2*np.pi*np.cumsum(f)/SR))*0.35; return lpf(s,1800)*np.exp(-t/0.25)
def swish():
    n=int(0.3*SR); t=np.arange(n)/SR; x=hpf(rng.standard_normal(n),2500)*np.sin(np.pi*t/0.3)**1.5; return x*0.5
def chime(f,d=1.4):
    t=np.arange(int(d*SR))/SR; return sum(np.sin(2*np.pi*f*k*t)*a for k,a in ((1,1),(2,.35),(3,.15)))*np.exp(-t/0.45)*0.45
def tick(): 
    t=np.arange(int(.05*SR))/SR; return np.sin(2*np.pi*1500*t)*np.exp(-t/0.012)*0.6
def audio():
    # hook
    for txt,y,sz,col,t0 in HOOK:
        add(slam(0.9 if txt not in("PAHALIYA","PATLAR.") else 1.1),t0); add(whoosh(0.3),t0-0.12,gain=0.5)
    add(riser(0.9),1.3,gain=0.8); add(impact(1.0),2.8)
    # transitions
    starts=[T_TITLE]+[T_TIP0+i*TIP for i in range(5)]+[T_ENG,T_CTA]
    for s in starts: add(whoosh(0.5),s-0.05,gain=0.8)
    # title
    for i in range(5): add(tick(),T_TITLE+0.30+i*0.14,gain=0.9)
    add(impact(0.9),T_TITLE+0.30+4*0.14); add(slam(0.8),T_TITLE+0.95)
    # tips
    for i in range(5):
        b=T_TIP0+i*TIP
        add(pop(560,0.14),b+0.0); add(whoosh(0.3),b+0.25,gain=0.5); add(slam(0.8),b+0.6)
        add(swish(),b+1.5,gain=0.9); add(buzz(),b+1.55,gain=0.7)
        add(whoosh(0.35),b+2.2,gain=0.6); add(pop(900,0.12),b+2.3); 
        for j,f in enumerate((783.99,1046.5)): add(chime(f,0.9),b+2.3+j*0.09,gain=0.7)
    # engage
    add(slam(0.9),T_ENG+0.05); add(slam(1.0),T_ENG+0.25); add(pop(700,0.15),T_ENG+0.85)
    for j in range(6): add(tick(),T_ENG+1.0+j*0.17,gain=0.4)
    add(chime(1318.5,0.8),T_ENG+1.35,gain=0.8)
    # cta
    add(riser(0.9),T_CTA-0.9,gain=0.8); add(impact(1.0),T_CTA)
    for i,f in enumerate((523.25,659.25,783.99,1046.5)): add(chime(f,1.6),T_CTA+0.1+i*0.07,pan=0.3*(i-1.5)/1.5,gain=0.9)
    add(pop(1000,0.15),T_CTA+1.5); add(chime(1568,0.8),T_CTA+1.6,gain=0.6)
    # music: 124 bpm, enters low at 0, full from T_TITLE
    bpm=124; beat=60/bpm; prog=[110.0,87.31,98.0,82.41]; arp=[[220,261.63,329.63,440],[174.61,220,261.63,349.23],[196,246.94,293.66,392],[164.81,207.65,246.94,329.63]]
    t=0.0; bar=0
    while t<END-0.2:
        full=t>=T_TITLE-0.01; g=1.0 if full else 0.0
        for b in range(4):
            bt=t+b*beat
            if full or b==0: add(kick(0.7 if full else 0.5),bt)
            add(hat(),bt+beat/2,gain=0.8*(1 if full else 0.0))
            if full and b in (1,3): add(clap(),bt,gain=0.6)
        if full:
            for off in (0,1.5,2.5,3.0): add(pluck(prog[bar%4],0.35),t+off*beat,gain=0.8)
            for k in range(8): add(pluck(arp[bar%4][k%4],0.25),t+k*beat/2,pan=0.4*(1 if k%2 else -1),gain=0.28)
        t+=4*beat; bar+=1
    tt=np.arange(N)/SR; pad=np.zeros(N); chords=[(220,261.63,329.63),(174.61,220,261.63),(196,246.94,293.66),(164.81,207.65,246.94)]
    barlen=4*beat
    for bi in range(int(END/barlen)+1):
        s=bi*barlen; si=int(s*SR); ei=min(N,int((s+barlen+0.3)*SR))
        if si>=N: break
        seg=np.arange(ei-si)/SR; x=sum(np.sin(2*np.pi*f*seg)+0.5*np.sin(2*np.pi*f*1.003*seg) for f in chords[bi%4])
        pad[si:ei]+=x*np.minimum(seg/0.5,1)*np.minimum((barlen+0.3-seg)/0.4,1)*0.05
    L[:]+=pad; R[:]+=pad
    fade=np.clip((END-tt)/1.0,0,1); L[:]*=fade; R[:]*=fade
    m=max(np.abs(L).max(),np.abs(R).max()); L[:]=L/m*0.85; R[:]=R/m*0.85
    st=(np.stack([L,R],1)*32767).astype(np.int16)
    w=wave.open(SC+"kin_bed.wav","wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes()); w.close(); print("audio ok",END)
if sys.argv[1]=="video": render_video()
elif sys.argv[1]=="audio": audio()
elif sys.argv[1]=="still":
    for t in map(float,sys.argv[2:]): frame(t).resize((360,640)).save(SC+f"s_{t}.png")
