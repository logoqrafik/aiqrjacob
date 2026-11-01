import sys, math, subprocess, wave, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter
SC="/tmp/claude-0/-home-user-aiqrjacob/f811b12d-0b73-5e7c-95ff-87bb79e718c3/scratchpad/"
IMG="/tmp/claude-0/-home-user-aiqrjacob/f811b12d-0b73-5e7c-95ff-87bb79e718c3/images/"
W,H=1080,1920; FPS=30
WHITE=(255,255,255); INK=(14,20,17); ORANGE=(253,125,14); RED=(240,68,54); GREEN=(34,197,94); BLUE=(59,130,246)
YELLOW=(250,204,21); VIOLET=(168,85,247); BRAND=(5,143,57)
ACC=[ORANGE,BLUE,GREEN,YELLOW,VIOLET]
END=39.6
# ---- timeline from voice analysis
TS=[5.45,11.20,17.30,22.90,27.15]          # tip scene starts
EV=[dict(l1=6.03,l2=6.20,strike=7.00,card=7.50,s1=8.26,s2=10.11),
    dict(l1=11.81,l2=11.95,strike=12.90,card=13.39,s1=14.09,s2=15.40),
    dict(l1=17.82,l2=18.00,strike=19.20,card=19.60,s1=20.35,s2=21.92),
    dict(l1=23.40,l2=23.55,strike=24.35,card=24.75,s1=24.85,s2=26.15),
    dict(l1=27.65,l2=27.80,strike=28.60,card=29.05,s1=29.16,s2=30.69)]
T_TITLE=3.05; T_ENG=32.35; T_CTA=34.15
HOOK=[("TAŞINMADAN",470,140,WHITE,0.12),("ÖNCE",620,170,ORANGE,0.72),("BUNU",770,170,WHITE,1.05),
      ("BİLMEZSEN",930,150,WHITE,1.40),("PAHALIYA",1150,210,ORANGE,2.12),("PATLAR.",1330,190,WHITE,2.79)]
TIPS=[("05","Kutuları","karışık doldurmak",["Numaralı kutu, etiketli oda:","her şey yerini bulur."]),
      ("04","Ambalajı","son güne bırakmak",["Eşya baştan korunur:","çizilme, ezilme, toz yok."]),
      ("03","Ağır eşyayı","merdivenden taşımak",["Mobil asansörle pencereden:","hızlı ve güvenli."]),
      ("02","En ucuz","teklife atlamak",["Ucuz teklif, pahalı hasar","demek olabilir."]),
      ("01","Deneyimsiz","ekibe güvenmek",["1990'dan beri aynı özen,","aynı sorumluluk."])]

def clamp(x,a=0.,b=1.): return max(a,min(b,x))
def ease(x): x=clamp(x); return 1-(1-x)**3
def back(x):
    x=clamp(x); c=1.70158; return 1+(c+1)*(x-1)**3+c*(x-1)**2
def smooth(x): x=clamp(x); return x*x*(3-2*x)
def lerp(a,b,u): return a+(b-a)*u
_f={}
def font(n,s):
    k=(n,int(s))
    if k not in _f: _f[k]=ImageFont.truetype(n if n.startswith("/") else "/usr/share/fonts/opentype/inter/"+n,int(s))
    return _f[k]
BLK="Inter-Black.otf"; REG="Inter-Regular.otf"; BLD=REG
HAND="/usr/local/lib/python3.13/dist-packages/font_amatic_sc/files/AmaticSC-Bold.ttf"
def twidth(txt,f,tr):
    return f.getlength(txt)+tr*f.size*(len(txt)-1)
def fitsz(txt,maxw,size,name=BLK,tr=None):
    if tr is None: tr=0 if name==HAND else -0.014
    while size>20 and twidth(txt,font(name,size),tr)>maxw: size-=4
    return size

# ---------------- paste helpers
def paste(im,lay,x,y,alpha=1.0):
    if alpha<=0: return
    a=lay.getchannel("A")
    if alpha<1: a=a.point(lambda v:int(v*alpha))
    im.paste(lay.convert("RGB"),(int(x),int(y)),a)
def T(im,txt,cx,cy,size,col,ta,t0,name=BLK,maxw=None,alpha=1.0,pop=True,shake=0.0,pd=0.35,rot=0,track=None):
    if ta<t0: return
    p=(ta-t0)/pd
    tr=0 if name==HAND else (-0.014 if track is None else track)
    if maxw: size=fitsz(txt,maxw,size,name,tr)
    sz=size*(0.4+0.6*back(p)) if pop else size
    f=font(name,sz); a=ease(p*2.2)*alpha
    if a<=0: return
    pad=20; width=twidth(txt,f,tr); lw=int(width)+2*pad; lh=int(f.size*1.4)+2*pad
    lay=Image.new("RGBA",(lw,lh),(0,0,0,0)); d=ImageDraw.Draw(lay)
    if tr==0: d.text((lw/2,lh/2),txt,font=f,fill=col+(255,),anchor="mm")
    else:
        x0=(lw-width)/2
        for i,ch in enumerate(txt): d.text((x0+f.getlength(txt[:i])+i*tr*f.size,lh/2),ch,font=f,fill=col+(255,),anchor="lm")
    if rot: lay=lay.rotate(rot,resample=Image.BICUBIC,expand=True); lw,lh=lay.size
    dx=shake*math.sin((ta-t0)*95)*math.exp(-(ta-t0)*7) if shake else 0
    dy=shake*0.6*math.cos((ta-t0)*83)*math.exp(-(ta-t0)*7) if shake else 0
    paste(im,lay,cx-lw/2+dx,cy-lh/2+dy,a)
def rr(im,box,r,fill,alpha=1.0,outline=None,ow=0):
    x0,y0,x1,y1=[int(v) for v in box]
    if x1-x0<4 or y1-y0<4: return
    lay=Image.new("RGBA",(x1-x0,y1-y0),(0,0,0,0)); d=ImageDraw.Draw(lay)
    d.rounded_rectangle((0,0,x1-x0-1,y1-y0-1),radius=r,fill=fill+(255,) if fill else None,outline=(outline+(255,)) if outline else None,width=ow)
    paste(im,lay,x0,y0,alpha)
def disc(im,cx,cy,r,col,alpha=1.0):
    r=max(r,1.5); d=int(r*2)+4
    lay=Image.new("RGBA",(d,d),(0,0,0,0)); ImageDraw.Draw(lay).ellipse((2,2,d-3,d-3),fill=col+(255,))
    paste(im,lay,cx-d/2,cy-d/2,alpha)
_glow={}
def glow(im,cx,cy,r,col,alpha=0.5):
    k=(int(r/8),col)
    if k not in _glow:
        n=int(r*2); y,x=np.mgrid[0:n,0:n]; dd=np.hypot(x-n/2,y-n/2)/(n/2); a=np.clip(1-dd,0,1)**2.2
        lay=Image.new("RGBA",(n,n),col+(0,)); lay.putalpha(Image.fromarray((a*255).astype(np.uint8))); _glow[k]=lay
    lay=_glow[k]; paste(im,lay,cx-lay.width/2,cy-lay.height/2,alpha)
def ring(im,cx,cy,r,col,w,alpha):
    if alpha<=0 or r<2: return
    d=int(r*2)+w*2+4; lay=Image.new("RGBA",(d,d),(0,0,0,0)); ImageDraw.Draw(lay).ellipse((w+1,w+1,d-w-2,d-w-2),outline=col+(255,),width=w)
    paste(im,lay,cx-d/2,cy-d/2,alpha)

# ---------------- sprites (supersampled)
_sp={}
def mk(name,fn,S=420):
    im=Image.new("RGBA",(S*2,S*2),(0,0,0,0)); d=ImageDraw.Draw(im); fn(d,S*2); _sp[name]=im.resize((S,S),Image.LANCZOS)
def P(s,*c): return [v*s for v in c]
def _box(d,s):
    d.rounded_rectangle(P(s,.10,.28,.90,.90),radius=s*.03,fill=(201,147,90)); d.polygon([(.06*s,.20*s),(.94*s,.20*s),(.90*s,.34*s),(.10*s,.34*s)],fill=(224,174,116))
    d.rectangle(P(s,.43,.20,.57,.90),fill=(240,222,176)); d.rounded_rectangle(P(s,.62,.55,.82,.74),radius=s*.02,fill=(255,255,255))
    for i in range(3): d.line(P(s,.65,.60+i*.05,.79,.60+i*.05),fill=(150,150,150),width=int(s*.012))
def _crate(d,s):
    d.rounded_rectangle(P(s,.07,.26,.93,.92),radius=s*.05,fill=(37,99,235)); d.rounded_rectangle(P(s,.04,.18,.96,.30),radius=s*.04,fill=(59,130,246))
    d.rounded_rectangle(P(s,.34,.34,.66,.41),radius=s*.03,fill=(20,60,150))
    d.rounded_rectangle(P(s,.20,.50,.80,.84),radius=s*.03,fill=(255,255,255))
def _coin(d,s):
    d.ellipse(P(s,.06,.06,.94,.94),fill=(250,176,5)); d.ellipse(P(s,.14,.14,.86,.86),fill=(255,214,60)); d.ellipse(P(s,.14,.14,.86,.86),outline=(222,150,0),width=int(s*.025))
    f=ImageFont.truetype("/usr/share/fonts/opentype/inter/InterDisplay-Black.otf",int(s*.5)); d.text((s/2,s*.52),"₺",font=f,fill=(190,115,0),anchor="mm")
def _warn(d,s):
    d.polygon([(.5*s,.08*s),(.95*s,.88*s),(.05*s,.88*s)],fill=(255,170,0)); d.line([(.5*s,.08*s),(.95*s,.88*s),(.05*s,.88*s),(.5*s,.08*s)],fill=(255,170,0),width=int(s*.05),joint="curve")
    d.rounded_rectangle(P(s,.46,.34,.54,.62),radius=s*.03,fill=(40,24,0)); d.ellipse(P(s,.45,.68,.55,.78),fill=(40,24,0))
def _clock(d,s):
    d.ellipse(P(s,.05,.05,.95,.95),fill=(255,255,255)); d.ellipse(P(s,.05,.05,.95,.95),outline=(30,36,48),width=int(s*.05))
    for i in range(12):
        a=i*math.pi/6; r0,r1=(.36,.42) if i%3 else (.32,.42); d.line([(s*(.5+r0*math.sin(a)),s*(.5-r0*math.cos(a))),(s*(.5+r1*math.sin(a)),s*(.5-r1*math.cos(a)))],fill=(30,36,48),width=int(s*.025))
    d.ellipse(P(s,.2,-.01,.36,.08),fill=(240,68,54)); d.ellipse(P(s,.64,-.01,.80,.08),fill=(240,68,54))
def _shield(d,s):
    pts=[(.5*s,.06*s),(.9*s,.2*s),(.86*s,.58*s),(.5*s,.94*s),(.14*s,.58*s),(.1*s,.2*s)]
    d.polygon(pts,fill=(34,197,94)); d.polygon([(.5*s,.06*s),(.9*s,.2*s),(.86*s,.58*s),(.5*s,.94*s)],fill=(22,163,74))
    d.line([(.3*s,.5*s),(.45*s,.65*s),(.72*s,.34*s)],fill=WHITE,width=int(s*.09),joint="curve")
def _tag(d,s):
    d.polygon([(.1*s,.5*s),(.38*s,.12*s),(.9*s,.12*s),(.9*s,.88*s),(.38*s,.88*s)],fill=(255,255,255)); d.ellipse(P(s,.27,.43,.38,.57),fill=(60,70,90))
    f=ImageFont.truetype("/usr/share/fonts/opentype/inter/InterDisplay-Black.otf",int(s*.42)); d.text((s*.64,s*.52),"₺",font=f,fill=(34,197,94),anchor="mm")
def _vase(d,s):
    pts=[(.36,.08),(.64,.08),(.60,.24),(.78,.46),(.76,.74),(.64,.92),(.36,.92),(.24,.74),(.22,.46),(.40,.24)]
    d.polygon([(x*s,y*s) for x,y in pts],fill=(96,165,250)); d.polygon([(x*s,y*s) for x,y in pts[:5]+[(.5,.5)]],fill=(125,185,255))
def _vase_broken(d,s):
    _vase(d,s); d.line([(.5*s,.08*s),(.44*s,.3*s),(.56*s,.5*s),(.46*s,.7*s),(.54*s,.92*s)],fill=(14,20,27),width=int(s*.03)); d.line([(.56*s,.5*s),(.76*s,.56*s)],fill=(14,20,27),width=int(s*.025))
def _helmet(d,s):
    d.pieslice(P(s,.1,.14,.9,.94),180,360,fill=(250,204,21)); d.rounded_rectangle(P(s,.04,.52,.96,.64),radius=s*.05,fill=(234,179,8)); d.rounded_rectangle(P(s,.44,.18,.56,.52),radius=s*.02,fill=(255,225,90))
def _medal(d,s):
    d.polygon([(.3*s,.02*s),(.5*s,.4*s),(.38*s,.52*s),(.14*s,.1*s)],fill=(34,197,94)); d.polygon([(.7*s,.02*s),(.5*s,.4*s),(.62*s,.52*s),(.86*s,.1*s)],fill=(22,163,74))
    d.ellipse(P(s,.14,.3,.86,.98),fill=(250,176,5)); d.ellipse(P(s,.2,.36,.8,.92),fill=(255,214,60)); d.ellipse(P(s,.2,.36,.8,.92),outline=(222,150,0),width=int(s*.02))
def _bubble(d,s):
    d.rounded_rectangle(P(s,.04,.1,.96,.72),radius=s*.2,fill=WHITE); d.polygon([(.2*s,.66*s),(.14*s,.94*s),(.44*s,.7*s)],fill=WHITE)
def _heart(d,s):
    d.ellipse(P(s,.08,.14,.56,.62),fill=(244,63,94)); d.ellipse(P(s,.44,.14,.92,.62),fill=(244,63,94)); d.polygon([(.1*s,.46*s),(.9*s,.46*s),(.5*s,.9*s)],fill=(244,63,94))
def _phone(d,s):
    d.ellipse(P(s,.04,.04,.96,.96),fill=(37,211,102)); d.polygon([(.2*s,.96*s),(.14*s,.66*s),(.4*s,.9*s)],fill=(37,211,102))
    d.arc(P(s,.26,.26,.74,.74),start=100,end=260,fill=WHITE,width=int(s*.08)); d.ellipse(P(s,.3,.55,.4,.7),fill=WHITE); d.ellipse(P(s,.46,.3,.58,.42),fill=WHITE)
    d.line([(.34*s,.3*s),(.34*s,.62*s)],fill=WHITE,width=int(s*.07)); 
def _truck(d,s):
    d.rounded_rectangle(P(s,.02,.2,.64,.76),radius=s*.03,fill=(255,255,255)); d.rounded_rectangle(P(s,.66,.36,.96,.76),radius=s*.05,fill=(253,125,14)); d.polygon([(.7*s,.4*s),(.86*s,.4*s),(.92*s,.54*s),(.7*s,.54*s)],fill=(190,230,255))
    d.rectangle(P(s,.08,.34,.40,.44),fill=(34,197,94)); 
    for cx in (.2,.78): d.ellipse(P(s,cx-.1,.66,cx+.1,.9),fill=(30,36,48)); d.ellipse(P(s,cx-.04,.74,cx+.04,.82),fill=(200,205,210))
def _spark(d,s):
    d.polygon([(.5*s,0),(.58*s,.42*s),(s,.5*s),(.58*s,.58*s),(.5*s,s),(.42*s,.58*s),(0,.5*s),(.42*s,.42*s)],fill=WHITE)
def _cross(d,s):
    d.ellipse(P(s,.04,.04,.96,.96),fill=(240,68,54)); d.line([(.32*s,.32*s),(.68*s,.68*s)],fill=WHITE,width=int(s*.1)); d.line([(.32*s,.68*s),(.68*s,.32*s)],fill=WHITE,width=int(s*.1))
def _checkb(d,s):
    d.ellipse(P(s,.04,.04,.96,.96),fill=(34,197,94)); d.line([(.28*s,.52*s),(.44*s,.68*s),(.72*s,.34*s)],fill=WHITE,width=int(s*.1),joint="curve")
for n,f in dict(box=_box,crate=_crate,coin=_coin,warn=_warn,clock=_clock,shield=_shield,tag=_tag,vase=_vase,vaseb=_vase_broken,helmet=_helmet,medal=_medal,bubble=_bubble,heart=_heart,phone=_phone,truck=_truck,spark=_spark,crossb=_cross,checkb=_checkb).items(): mk(n,f)
_rc={}
def spr(im,name,cx,cy,size,rot=0,alpha=1.0,gcol=None,gal=0.5):
    if alpha<=0 or size<4: return
    k=(name,int(size/4)*4,int(rot/3)*3)
    if k not in _rc:
        s=_sp[name].resize((k[1],k[1]),Image.LANCZOS)
        if k[2]: s=s.rotate(k[2],resample=Image.BICUBIC,expand=True)
        _rc[k]=s
    s=_rc[k]
    if gcol: glow(im,cx,cy,size*0.95,gcol,gal*alpha)
    paste(im,s,cx-s.width/2,cy-s.height/2,alpha)

# ---------------- background
_bg={}
def bgbase(acc):
    if acc not in _bg:
        y,x=np.mgrid[0:H,0:W].astype(np.float32); u=y/H
        base=np.stack([8+6*u,12+8*u,18+9*u],-1)
        d1=np.hypot(x-W*0.85,y-H*0.22)/900; d2=np.hypot(x-W*0.1,y-H*0.88)/800
        g=(np.clip(1-d1,0,1)**2*0.22+np.clip(1-d2,0,1)**2*0.12)[...,None]
        a=np.array(acc,np.float32)[None,None,:]
        _bg[acc]=np.clip(base*(1-g)+a*g*0.9+base*g*0.2,0,255).astype(np.uint8)
    return _bg[acc]
rnd=random.Random(5); PART=[(rnd.random(),rnd.random(),rnd.uniform(0.02,0.07),rnd.uniform(3,9)) for _ in range(34)]
def background(acc,ta):
    im=Image.fromarray(bgbase(acc))
    for (px,py,sp,r) in PART:
        x=px*W+30*math.sin(ta*0.8+px*9); y=(py-ta*sp)%1.0*H
        disc(im,x,y,r,acc,0.22)
    # subtle moving light bar
    return im
BG={"hook":(240,68,54),"title":ORANGE,"eng":VIOLET,"cta":GREEN}

# ---------------- cursor dot
def build_wp():
    wp=[(0,540,1750),(0.12,200,500),(0.72,830,640),(1.05,250,780),(1.40,800,950),(2.12,300,1160),(2.79,540,1330),(T_TITLE,540,980),
        (3.6,540,640),(4.4,540,1000),(5.0,540,1380),(TS[0],540,1000)]
    for k in range(5):
        e=EV[k]; f=font(BLK,fitsz(TIPS[k][2],940,165)); w=f.getlength(TIPS[k][2]); x0=540-w/2-20; x1=540+w/2+20
        t0=TS[k]
        wp+=[(t0,540,1000),(e['l1']-0.05,260,860),(e['strike']-0.05,x0-40,1000),(e['strike']+0.35,x1+40,1000),(e['card']-0.25,720,1150),(e['card'],860,1350),(e['card']+0.9,800,1320)]
        wp.append(((TS[k+1] if k<4 else T_ENG)-0.05,540,1000))
    wp+=[(T_ENG+0.05,540,1000),(32.9,330,1010),(33.15,330,1010),(33.5,540,1420),(34.0,540,1560),(T_CTA,540,1000),
         (35.3,540,730),(36.6,540,1040),(38.0,540,1180),(38.2,540,1210),(38.9,760,1290),(39.6,860,1340)]
    return sorted(wp)
WP=build_wp()
def dotpos(t):
    if t<=WP[0][0]: return WP[0][1:]
    for i in range(len(WP)-1):
        a,b=WP[i],WP[i+1]
        if a[0]<=t<b[0]:
            u=smooth((t-a[0])/(b[0]-a[0])); dx,dy=b[1]-a[1],b[2]-a[2]; dist=math.hypot(dx,dy)+1e-6
            off=math.sin(math.pi*u)*dist*0.10
            return a[1]+dx*u+(-dy/dist)*off, a[2]+dy*u+(dx/dist)*off
    return WP[-1][1:]
CLICKS=[(0.12,200,500),(0.72,830,640),(2.79,540,1330),(4.4,540,1000)]
for k in range(5): CLICKS.append((EV[k]['card'],860,1350))
CLICKS+=[(33.15,330,1010),(33.5,540,1420),(38.2,540,1210)]
def draw_dot(im,t):
    for i in range(14,0,-1):
        x,y=dotpos(max(0,t-i*0.022)); a=(1-i/15)*0.55
        disc(im,x,y,16*(1-i/18),(255,170,60),a)
    x,y=dotpos(t); glow(im,x,y,95,(255,150,40),0.75); disc(im,x,y,19,(255,255,255)); disc(im,x,y,12,(255,196,90))
    for (tc,cx,cy) in CLICKS:
        if tc<=t<tc+0.55:
            u=(t-tc)/0.55; ring(im,cx,cy,20+120*ease(u),WHITE,5,(1-u)*0.9); ring(im,cx,cy,10+70*ease(u),(255,170,60),4,(1-u))

# ---------------- illustrations
def junk(im,ta,cx,cy,t0):
    cols=[ORANGE,BLUE,YELLOW,VIOLET,(244,63,94)]
    for i in range(5):
        a=(ta-t0)*2.2+i*1.256; r=190+25*math.sin((ta-t0)*3+i); x=cx+r*math.cos(a); y=cy-40+0.55*r*math.sin(a)
        rot=((ta-t0)*140+i*70)%360; sz=64+8*math.sin(ta*5+i)
        lay=Image.new("RGBA",(100,100),(0,0,0,0)); d=ImageDraw.Draw(lay)
        if i%2: d.ellipse((10,10,90,90),fill=cols[i]+(255,))
        else: d.rounded_rectangle((12,12,88,88),radius=14,fill=cols[i]+(255,))
        lay=lay.resize((int(sz),int(sz))).rotate(rot,expand=True,resample=Image.BICUBIC); paste(im,lay,x-lay.width/2,y-lay.height/2)
def ill_wrong(k,ta,cx,cy,al):
    t0=TS[k]; ph=ta-t0
    if k==0:
        spr(im_,"box",cx,cy+40,300,rot=4*math.sin(ph*6),alpha=al); 
        junk(im_,ta,cx,cy,t0)
        T(im_,"?",cx+170,cy-170,120,YELLOW,ta,t0+0.3,pop=True,alpha=al)
    if k==1:
        spr(im_,"clock",cx,cy,310,alpha=al,gcol=RED,gal=0.5)
        for (ln,wd,sp) in ((115,10,14),(85,14,1.2)):
            a=ph*sp; ImageDraw.Draw(im_).line([(cx,cy),(cx+ln*math.sin(a),cy-ln*math.cos(a))],fill=(30,36,48),width=wd)
        disc(im_,cx,cy,12,(30,36,48),al)
        spr(im_,"warn",cx+140,cy-130,100,rot=8*math.sin(ph*9),alpha=al)
    if k==2:
        d=ImageDraw.Draw(im_); n=6; sw,sh=70,50; x0=cx-210; y0=cy+150
        pts=[]
        for i in range(n): pts+= [(x0+i*sw,y0-i*sh),(x0+i*sw,y0-(i+1)*sh)]
        pts.append((x0+n*sw,y0-n*sh)); d.line(pts,fill=(210,220,235),width=14,joint="curve")
        u=(math.sin(ph*2.2)+1)/2; si=u*(n-1); i=int(si); fr=si-i
        bx=x0+i*sw+sw*0.5+sw*fr; by=y0-(i+1)*sh-50-abs(math.sin(ph*9))*22 - fr*sh
        spr(im_,"box",bx,by,110,rot=10*math.sin(ph*8),alpha=al)
        for j in range(3): T(im_,"💧" if False else "•",bx-60+j*40,by-80-((ph*3+j)%1)*30,60,(120,200,255),ta,t0,pop=False,alpha=al*(1-((ph*3+j)%1)))
    if k==3:
        spr(im_,"tag",cx,cy,330,rot=10*math.sin(ph*4),alpha=al,gcol=GREEN,gal=0.45)
        spr(im_,"coin",cx+170,cy+120+8*math.sin(ph*5),110,alpha=al)
    if k==4:
        spr(im_,"helmet",cx,cy+30,300,rot=6*math.sin(ph*5),alpha=al,gcol=YELLOW,gal=0.3)
        for i in range(3):
            a=ph*2.5+i*2.09; T(im_,"?",cx+190*math.cos(a),cy-30+110*math.sin(a),90,WHITE,ta,t0,pop=False,alpha=al)
    spr(im_,"crossb",cx+(150 if k!=1 else 170),cy-(150 if k!=1 else 160)+(0 if k!=1 else 0),90,alpha=al*ease((ph-0.4)/0.3)) if k in(0,2,3,4) else None
def ill_right(k,ta,cx,cy,al):
    t0=EV[k]['card']; ph=ta-t0
    if k==0:
        for i,(lab,dx) in enumerate((("MUTFAK",-250),("SALON",0),("YATAK",250))):
            p=back((ph-i*0.12)/0.4); y=cy+40-(1-p)*160
            spr(im_,"crate",cx+dx,y,220,alpha=al*ease((ph-i*0.12)/0.2),gcol=BLUE,gal=0.4)
            T(im_,lab,cx+dx,y+34,26,(20,60,150),ta,t0+i*0.12+0.1,name=BLK,pop=False,alpha=al,track=0.02)
            disc(im_,cx+dx,y-95,34*min(1,p),ORANGE,al); T(im_,str(i+1),cx+dx,y-95,40,WHITE,ta,t0+i*0.12+0.05,pop=False,alpha=al)
    if k==1:
        spr(im_,"box",cx,cy+30,230,alpha=al)
        for i in range(3):
            u=((ph*1.2+i/3)%1); rr(im_,(cx-130-u*70,cy-80-u*70,cx+130+u*70,cy+160+u*70),30+u*40,None,al*(1-u)*0.9,outline=GREEN,ow=8)
        spr(im_,"shield",cx+150,cy-110,170,alpha=al*back(ph/0.4),gcol=GREEN,gal=0.55)
    if k==2:
        d=ImageDraw.Draw(im_)
        rr(im_,(cx-250,cy-200,cx+250,cy+210),30,(30,42,58),al,outline=(70,90,115),ow=4)
        for r in range(3):
            for c in range(3):
                col=(250,204,21) if (r,c)==(0,2) else (50,68,90); rr(im_,(cx-210+c*140,cy-170+r*105,cx-110+c*140,cy-100+r*105),10,col,al)
        x0,y0,x1,y1=cx-230,cy+180,cx+130,cy-130
        d.line([(x0,y0),(x1,y1)],fill=(210,220,235),width=18); d.line([(x0+26,y0+10),(x1+26,y1+10)],fill=(210,220,235),width=18)
        for i in range(1,8): 
            u=i/8; px,py=lerp(x0,x1,u),lerp(y0,y1,u); d.line([(px,py),(px+26,py+10)],fill=(150,165,185),width=7)
        u=smooth((ph*0.9)%1.4/1.2); bx,by=lerp(x0,x1,u)+13,lerp(y0,y1,u)-50
        spr(im_,"box",bx,by,110,alpha=al)
    if k==3:
        spr(im_,"vaseb",cx-20,cy+10+8*math.sin(ph*6),270,rot=-8,alpha=al,gcol=RED,gal=0.35)
        for i in range(5):
            u=clamp((ph-0.1*i)/1.0); a=-0.4+i*0.55; x=cx+60+u*260*math.cos(a)*(0.6+0.1*i); y=cy-60-u*220*math.sin(a)+u*u*200
            spr(im_,"coin",x,y,70,rot=u*400,alpha=al*(1-u)*ease(ph/0.15))
        spr(im_,"warn",cx+170,cy-150,110,rot=6*math.sin(ph*9),alpha=al*back(ph/0.4))
    if k==4:
        spr(im_,"medal",cx,cy+10,330,alpha=al*back(ph/0.45),gcol=YELLOW,gal=0.5)
        T(im_,"1990",cx,cy+120,64,(150,90,0),ta,t0+0.2,pop=False,alpha=al)
        for i in range(3): spr(im_,"spark",cx-170+i*170,cy-150-(i%2)*40,56+10*math.sin(ph*6+i),rot=ph*60,alpha=al*ease((ph-0.2-i*0.12)/0.2))
    spr(im_,"checkb",cx+(150 if k not in(1,2) else (200 if k==1 else 230)),cy-(150 if k not in(1,2) else (170 if k==1 else 200)),90,alpha=al*back((ph-0.3)/0.3)) if k!=3 else None
im_=None

# ---------------- scenes
def sc_hook(ta):
    red=ease((ta-2.1)/0.3)*0.5+0.1*abs(math.sin(ta*8))*ease((ta-2.1)/0.2)
    im=background(RED,ta); 
    ov=Image.new("RGB",(W,H),(60,10,8)); im=Image.blend(im,ov,red*0.7)
    spr(im,"warn",540,330+10*math.sin(ta*9),170,rot=6*math.sin(ta*10),alpha=ease(ta/0.3),gcol=ORANGE,gal=0.6)
    for txt,y,sz,col,t0 in HOOK:
        T(im,txt,540,y,sz,col,ta,t0,maxw=960,shake=(14 if txt in("BİLMEZSEN","PAHALIYA","PATLAR.") else 0))
    # coin burst
    if ta>2.79:
        u0=ta-2.79
        for i in range(14):
            a=i*0.45+0.2; v=380+60*(i%3); x=540+v*u0*math.cos(a); y=1330-v*u0*math.sin(a)*0.9+520*u0*u0
            spr(im,"coin",x,y,70+10*(i%3),rot=u0*500+i*30,alpha=clamp(1-u0/1.3))
        ring(im,540,1330,80+500*ease(u0/0.6),(255,200,80),10,clamp(1-u0/0.6))
    if 2.12<ta<2.8: 
        for i in range(3): spr(im,"tag",300+i*240,1000+((ta*3+i*.4)%1)*400 ,110,rot=20*i-20,alpha=0.5)
    return im
def sc_title(ta):
    im=background(ORANGE,ta); s=ta-T_TITLE
    T(im,"TAŞINIRKEN",540,420,140,WHITE,ta,3.20,maxw=940)
    T(im,"YAPILAN",540,560,140,WHITE,ta,3.75,maxw=940)
    n=min(5,1+int(max(0,ta-4.0)/0.16))
    if ta>=4.0:
        tn=4.0+(n-1)*0.16
        glow(im,540,960,560,ORANGE,0.55)
        T(im,str(n),540,940,640,ORANGE,ta,tn,pd=0.2,shake=(12 if n==5 else 0))
    T(im,"HATA",540,1290,230,WHITE,ta,5.0,maxw=940)
    # truck driving
    x=-200+ (ta-3.1)*520
    for i in range(14): rr(im,(((i*120-ta*400)%1500)-100,1535,((i*120-ta*400)%1500)-40,1545),5,(255,255,255),0.25)
    spr(im,"truck",x,1470,190,rot=1.2*math.sin(ta*18),alpha=1.0)
    return im
def sc_tip(k,ta):
    global im_
    acc=ACC[k]; e=EV[k]; num,l1,l2,sol=TIPS[k]; t0=TS[k]; ph=ta-t0
    im=background(acc,ta); im_=im
    T(im,num,820,380,560,acc,ta,t0,alpha=0.10,pop=False)
    pa=back(ph/0.4); rr(im,(72,250,72+int(380*min(1,pa)),345),48,RED,min(1,pa*1.5))
    if ph>0.2: spr(im,"crossb",72+56,298,64,alpha=ease((ph-0.2)/0.2)); T(im,"HATA "+num,72+245,300,38,WHITE,ta,t0+0.2,name=BLK,pop=False,track=0.06)
    cy=640; 
    wrong_a=ease((e['card']-0.15-ta)/0.25)*ease((ta-(t0+0.25))/0.3)
    if wrong_a>0: ill_wrong(k,ta,540,cy,wrong_a)
    if ta>=e['card']:
        sp=clamp((ta-e['card'])/0.9)
        if sp<1:
            for i in range(10):
                a=i*0.63; r=40+330*ease(sp); spr(im,"spark",540+r*math.cos(a),cy+r*math.sin(a)*0.8,36*(1-sp),rot=ta*90,alpha=1-sp,gcol=acc,gal=0.4)
        ill_right(k,ta,540,cy,ease((ta-e['card'])/0.25))
    T(im,l1,540,880,100,(200,208,216),ta,e['l1'],name=REG,maxw=940)
    dim=1.0-0.55*ease((ta-(e['strike']+0.3))/0.3)
    T(im,l2,540,1000,165,WHITE,ta,e['l2'],maxw=940,alpha=dim)
    if ta>e['strike']:
        f=font(BLK,fitsz(l2,940,165)); w=f.getlength(l2); p=ease((ta-e['strike'])/0.35); x0=540-w/2-20
        glow(im,x0+(w+40)*p,1000,120,RED,0.5*p)
        rr(im,(x0,990,max(x0+8,x0+(w+40)*p),1008),9,RED,1.0)
    if ta>e['card']-0.05:
        p=back((ta-e['card'])/0.45); a=ease((ta-e['card'])/0.25); y=1260+(1-p)*100
        rr(im,(60,y-10,1020,y+250),52,acc,a*0.35)
        rr(im,(72,y,1008,y+240),48,WHITE,a); rr(im,(72,y,98,y+240),13,acc,a)
        spr(im,"checkb",72+120,y+120,100,alpha=a)
        T(im,"DOĞRUSU",600,y+46,28,acc if acc!=YELLOW else (170,120,0),ta,e['card'],name=BLK,pop=False,pd=0.2,track=0.10)
        T(im,sol[0],600,y+104,46,INK,ta,e['s1'],name=REG,maxw=730,pop=False,pd=0.25)
        T(im,sol[1],600,y+168,90,(acc if acc!=YELLOW else (176,120,0)) if acc!=GREEN else (22,150,70),ta,e['s2'],name=HAND,maxw=730,pop=False,pd=0.25,rot=-1.5)
    for i in range(5):
        x=540+(i-2)*54; on=i<=k; disc(im,x,1555,13 if i==k else 8,acc if on else (110,120,130),1.0 if on else 0.5)
    return im
def sc_eng(ta):
    global im_
    s=ta-T_ENG; im=background(VIOLET,ta); im_=im
    T(im,"SEN HANGİSİNİ",540,360,130,WHITE,ta,T_ENG+0.05,maxw=940)
    T(im,"YAPTIN?",540,540,230,VIOLET,ta,T_ENG+0.35,maxw=940,shake=8)
    icons=[("box",0),("clock",1),("truck",2),("tag",3),("helmet",4)]
    sel=ease((ta-33.15)/0.2)
    for i,(nm,ki) in enumerate(icons):
        t0=T_ENG+0.7+i*0.1; p=back((ta-t0)/0.4)
        x=170+i*185; y=830
        ch=(i==2)
        rr(im,(x-80,y-80+(1-p)*80,x+80,y+80+(1-p)*80),34,(26,34,48),clamp(p),outline=(ACC[4-i] if (ch and sel>0.5) else (70,84,108)),ow=(7 if (ch and sel>0.5) else 3))
        if p>0.05: spr(im,nm,x,y+(1-p)*80,100*clamp(p),alpha=clamp(p))
        if p>0.05: T(im,"0"+str(5-i),x,y+105+(1-p)*80,32,ACC[4-i],ta,t0,name=BLK,pop=False,track=0.04)
    if ta>33.5:
        p=back((ta-33.5)/0.4); y=1170
        rr(im,(160,y-90*p,920,y+90*p),90,WHITE,clamp(p))
        for i in range(3):
            b=0.5+0.5*math.sin(ta*9-i*0.9); disc(im,330+i*110,y-12*b,22,(110,120,130) if b<0.5 else VIOLET)
    T(im,"Yoruma yaz",540,1385,170,WHITE,ta,33.5,name=HAND,rot=-4)
    for i in range(7):
        u=((ta-33.5)*0.55+i*0.14)%1.0
        if ta>33.5: spr(im,"heart",200+i*120+30*math.sin(ta*3+i),1540-u*600,50+14*(i%3),alpha=clamp(1-u)*0.9)
    return im
LOGO=Image.open(IMG+"1.webp").convert("RGBA"); _b=Image.new("RGBA",LOGO.size,(255,255,255,255)); _b.alpha_composite(LOGO); LOGO=_b.convert("RGB")
LOGO=LOGO.crop(ImageOps.invert(LOGO.convert("L")).point(lambda p:255 if p>20 else 0).getbbox())
def sc_cta(ta):
    global im_
    s=ta-T_CTA; im=background(GREEN,ta); im_=im
    a=back(s/0.5); lw=820; lg=LOGO.resize((lw,round(LOGO.height*lw/LOGO.width)),Image.LANCZOS)
    cardh=lg.height+80; y=330+(1-a)*60
    if s>0:
        glow(im,540,y+cardh/2,700,GREEN,0.35*clamp(a))
        rr(im,(60,y,1020,y+cardh),60,WHITE,clamp(a)); paste(im,lg.convert("RGBA"),(W-lw)//2,y+40,clamp(a))
    if ta>35.3:
        p=back((ta-35.3)/0.5); spr(im,"medal",300,880,200*clamp(p),alpha=clamp(p),gcol=YELLOW,gal=0.5)
        spr(im,"spark",300,900,70*clamp(p),rot=ta*50,alpha=clamp(p))
        T(im,"1990'DAN BERİ",690,860,84,WHITE,ta,35.4,maxw=600)
        T(im,"güvenli taşıma",690,950,50,(200,240,214),ta,35.7,name=REG,maxw=600)
        for i in range(4): spr(im,"spark",120+i*270+(i%2)*40,1060-(i%2)*30,40+8*math.sin(ta*6+i),rot=ta*80,alpha=0.8*ease((ta-35.6-i*0.1)/0.2))
    if ta>36.7:
        pul=1+0.035*math.sin(ta*7); p=back((ta-36.7)/0.45); bw=int(900*pul*min(1,p)); bh=int(170*pul*min(1,p)); cx,cy=540,1210
        pr=(ta*1.2)%1
        ring(im,cx,cy,int(bw/2*0.9+pr*80),(37,211,102),6,(1-pr)*0.6*clamp(p))
        rr(im,(cx-bw/2,cy-bh/2+12,cx+bw/2,cy+bh/2+12),85,(0,40,20),0.4)
        rr(im,(cx-bw/2,cy-bh/2,cx+bw/2,cy+bh/2),85,(37,211,102))
        spr(im,"phone",cx-bw/2+95,cy,120*clamp(p),alpha=1.0,rot=8*math.sin(ta*10)*(1 if ta<38.2 else 0))
        T(im,"WhatsApp'tan Yaz",cx+50,cy-2,56,WHITE,ta,36.9,name=BLK,pop=False,pd=0.2,maxw=560)
        T(im,"0542 526 34 36",540,1420,84,WHITE,ta,37.2,maxw=940)
        T(im,"fiyat teklifi için hemen yaz",540,1515,100,(200,240,214),ta,37.5,name=HAND,pop=False,pd=0.3,rot=-2)
    if ta>38.2:
        u=ta-38.2
        for i in range(26):
            a=i*0.62+0.3; v=420+90*(i%4); x=540+v*u*math.cos(a); y=1210-v*u*math.sin(a)*0.8+700*u*u
            col=[ORANGE,YELLOW,WHITE,(37,211,102),BLUE][i%5]; rr(im,(x-8,y-8,x+8,y+8),3,col,clamp(1-u/1.3))
    return im
SCENES=[(0,T_TITLE,sc_hook),(T_TITLE,TS[0],sc_title)]+[(TS[k],(TS[k+1] if k<4 else T_ENG),(lambda k:lambda ta:sc_tip(k,ta))(k)) for k in range(5)]+[(T_ENG,T_CTA,sc_eng),(T_CTA,END,sc_cta)]
def frame(t):
    idx=max(i for i,(a,b,f) in enumerate(SCENES) if a<=t+1e-9)
    a,b,f=SCENES[idx]; im=f(t)
    if idx>0 and t-a<0.5:
        pa,pb,pf=SCENES[idx-1]; prev=pf(t)
        cx,cy=dotpos(a); r=ease((t-a)/0.5)*2100
        m=Image.new("L",(W,H),0); ImageDraw.Draw(m).ellipse((cx-r,cy-r,cx+r,cy+r),fill=255)
        prev.paste(im,(0,0),m); im=prev
    z=1+0.03*((t-a)/max(0.1,(b-a)))
    if z>1.001:
        w,h=W/z,H/z; im=im.resize((W,H),Image.BILINEAR,box=((W-w)/2,(H-h)/2,(W+w)/2,(H+h)/2))
    draw_dot(im,t)
    return im
def render_video():
    enc=subprocess.Popen(["ffmpeg","-y","-loglevel","error","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-",
        "-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p","-an",SC+"kin2_silent.mp4"],stdin=subprocess.PIPE)
    for i in range(int(END*FPS)): enc.stdin.write(frame(i/FPS).tobytes())
    enc.stdin.close(); enc.wait(); print("video ok")
if __name__=="__main__":
    if sys.argv[1]=="video": render_video()
    elif sys.argv[1]=="still":
        for t in map(float,sys.argv[2:]): frame(t).resize((360,640)).save(SC+f"s2_{t}.png")
