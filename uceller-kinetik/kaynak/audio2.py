
import sys,numpy as np,wave
sys.argv=["x","none"]
src=open("kin.py").read(); head=src[:src.index("def audio")]
ns={}; exec(head,ns)
import importlib.util
spec=importlib.util.spec_from_file_location("k2","kin2.py"); k2=importlib.util.module_from_spec(spec); spec.loader.exec_module(k2)
END=k2.END; SR=44100; N=int(END*SR); ns['N']=N; ns['END']=END
L=np.zeros(N); R=np.zeros(N); ns['L']=L; ns['R']=R
add=ns['add']; slam=ns['slam']; whoosh=ns['whoosh']; riser=ns['riser']; impact=ns['impact']; pop=ns['pop']; chime=ns['chime']; tick=ns['tick']; swish=ns['swish']; buzz=ns['buzz']
kick=ns['kick']; hat=ns['hat']; clap=ns['clap']; pluck=ns['pluck']; lpf=ns['lpf']; hpf=ns['hpf']; rng=ns['rng']
EV=k2.EV; TS=k2.TS; T_TITLE=k2.T_TITLE; T_ENG=k2.T_ENG; T_CTA=k2.T_CTA
# hook
add(pop(1100,0.2),0.0,gain=0.8)
for txt,y,sz,col,t0 in k2.HOOK: add(slam(0.9 if txt not in("PAHALIYA","PATLAR.") else 1.1),t0); add(whoosh(0.3),t0-0.12,gain=0.5)
add(riser(0.8),1.3,gain=0.8); add(impact(1.0),2.79)
for i in range(8): add(chime(1568*(1+0.12*(i%4)),0.5),2.82+i*0.05,pan=((i%3)-1)*0.5,gain=0.35)
starts=[T_TITLE]+TS+[T_ENG,T_CTA]
for s in starts: add(whoosh(0.55),s-0.05,gain=0.85)
# title
for i in range(5): add(tick(),4.0+i*0.16,gain=0.9)
add(impact(0.9),4.64); add(slam(0.8),5.0)
n=int(2.3*SR); eng=lpf(rng.standard_normal(n),180)*np.sin(np.pi*np.arange(n)/n)**0.7*0.5; add(eng,3.1,gain=0.8)
# tips
for k in range(5):
    e=EV[k]; t0=TS[k]
    add(pop(560,0.14),t0+0.05); add(whoosh(0.3),e['l1']-0.1,gain=0.5); add(slam(0.8),e['l2'])
    add(swish(),e['strike'],gain=0.9); add(buzz(),e['strike']+0.05,gain=0.7)
    add(pop(900,0.12),e['card']); 
    for j,f in enumerate((783.99,1046.5)): add(chime(f,0.9),e['card']+j*0.09,gain=0.7)
    for j,f in enumerate((1568,2093,2637)): add(chime(f,0.6),e['card']+0.15+j*0.07,gain=0.35,pan=(j-1)*0.4)
    add(tick(),e['s1'],gain=0.5); add(tick(),e['s2'],gain=0.5)
# engage
add(slam(0.9),T_ENG+0.05); add(slam(1.0),T_ENG+0.35)
for i in range(5): add(pop(600+i*90,0.12),T_ENG+0.7+i*0.1,gain=0.8)
add(tick(),33.15,gain=0.9); add(pop(900,0.14),33.15); add(pop(700,0.15),33.5)
for j in range(6): add(tick(),33.7+j*0.17,gain=0.4)
for i in range(7): add(pop(1200+i*60,0.08),33.6+i*0.18,gain=0.3,pan=((i%3)-1)*0.5)
# cta
add(riser(0.9),T_CTA-0.9,gain=0.8); add(impact(1.0),T_CTA)
for i,f in enumerate((523.25,659.25,783.99,1046.5)): add(chime(f,1.6),T_CTA+0.1+i*0.07,pan=0.3*(i-1.5)/1.5,gain=0.9)
add(chime(1318.5,1.0),35.3,gain=0.8); add(pop(800,0.14),36.7)
add(tick(),38.2,gain=1.0); add(impact(0.8),38.2)
for i in range(14): add(chime(1568*(1+0.1*(i%5)),0.5),38.22+i*0.04,pan=((i%4)-1.5)*0.4,gain=0.35)
# cursor clicks
for (tc,cx,cy) in k2.CLICKS: add(tick(),tc,gain=0.45)
# music
bpm=124; beat=60/bpm; prog=[110.0,87.31,98.0,82.41]; arp=[[220,261.63,329.63,440],[174.61,220,261.63,349.23],[196,246.94,293.66,392],[164.81,207.65,246.94,329.63]]
t=0.0; bar=0
while t<END-0.2:
    full=t>=T_TITLE-0.01
    for b in range(4):
        bt=t+b*beat
        if full or b==0: add(kick(0.7 if full else 0.5),bt)
        if full: add(hat(),bt+beat/2,gain=0.8)
        if full and b in (1,3): add(clap(),bt,gain=0.6)
    if full:
        for off in (0,1.5,2.5,3.0): add(pluck(prog[bar%4],0.35),t+off*beat,gain=0.8)
        for k in range(8): add(pluck(arp[bar%4][k%4],0.25),t+k*beat/2,pan=0.4*(1 if k%2 else -1),gain=0.28)
    t+=4*beat; bar+=1
tt=np.arange(N)/SR; pad=np.zeros(N); chords=[(220,261.63,329.63),(174.61,220,261.63),(196,246.94,293.66),(164.81,207.65,246.94)]; barlen=4*beat
for bi in range(int(END/barlen)+1):
    s=bi*barlen; si=int(s*SR); ei=min(N,int((s+barlen+0.3)*SR))
    if si>=N: break
    seg=np.arange(ei-si)/SR; x=sum(np.sin(2*np.pi*f*seg)+0.5*np.sin(2*np.pi*f*1.003*seg) for f in chords[bi%4])
    pad[si:ei]+=x*np.minimum(seg/0.5,1)*np.minimum((barlen+0.3-seg)/0.4,1)*0.05
L+=pad; R+=pad
fade=np.clip((END-tt)/1.0,0,1); L*=fade; R*=fade
m=max(np.abs(L).max(),np.abs(R).max()); L=L/m*0.85; R=R/m*0.85
st=(np.stack([L,R],1)*32767).astype(np.int16)
w=wave.open("kin2_bed.wav","wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes()); w.close(); print("audio ok",END)
