// ─── Camera mode + Send-to-nav + Full map (tablet & mobile) ────────────────

// Reusable: fake CCTV scene
function CCTVScene({ w=760, h=780 }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{position:'absolute', inset:0}}>
      <defs>
        <linearGradient id="cctvSky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1F4F77"/>
          <stop offset="60%" stopColor="#0B2A45"/>
        </linearGradient>
        <linearGradient id="cctvRoad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0F2A42"/>
          <stop offset="100%" stopColor="#03101C"/>
        </linearGradient>
      </defs>
      <rect width={w} height={h*0.55} fill="url(#cctvSky)"/>
      <rect y={h*0.55} width={w} height={h*0.45} fill="url(#cctvRoad)"/>
      {/* perspective road */}
      <path d={`M${-100} ${h} L ${w*0.42} ${h*0.55} L ${w*0.58} ${h*0.55} L ${w+100} ${h} Z`} fill="#0A1F33" opacity="0.7"/>
      {/* lane markers */}
      <g stroke="#3FA7E6" strokeWidth="3" opacity="0.55" strokeLinecap="round">
        {[[0.30,0.78,0.20,0.95],[0.36,0.66,0.32,0.74],[0.40,0.60,0.39,0.62],[0.62,0.66,0.66,0.74],[0.66,0.78,0.78,0.95]].map((c,i)=>
          <line key={i} x1={c[0]*w} y1={c[1]*h} x2={c[2]*w} y2={c[3]*h}/>
        )}
      </g>
      <line x1={w/2} y1={h*0.55} x2={w/2} y2={h} stroke="#1F6FB2" strokeWidth="2" opacity="0.45"/>
      {/* distant buildings */}
      <g fill="#0B3354" opacity="0.85">
        <rect x={w*0.06} y={h*0.42} width="60" height="80"/>
        <rect x={w*0.18} y={h*0.46} width="40" height="60"/>
        <rect x={w*0.78} y={h*0.43} width="50" height="78"/>
        <rect x={w*0.88} y={h*0.48} width="35" height="50"/>
      </g>
      {/* incident vehicles */}
      <g>
        <rect x={w*0.40} y={h*0.62} width="56" height="28" rx="5" fill="#E63946"/>
        <rect x={w*0.405} y={h*0.628} width="46" height="12" rx="2" fill="#0A1F33" opacity="0.5"/>
        <g transform={`rotate(-15 ${w*0.55} ${h*0.65})`}>
          <rect x={w*0.52} y={h*0.62} width="52" height="26" rx="5" fill="#E0E6EC"/>
          <rect x={w*0.527} y={h*0.628} width="42" height="11" rx="2" fill="#0A1F33" opacity="0.5"/>
        </g>
        {/* debris */}
        <circle cx={w*0.46} cy={h*0.72} r="2.5" fill="#A4B7C9"/>
        <circle cx={w*0.50} cy={h*0.74} r="2" fill="#A4B7C9"/>
        <circle cx={w*0.54} cy={h*0.71} r="2.5" fill="#A4B7C9"/>
        <rect x={w*0.57} y={h*0.74} width="8" height="3" fill="#6B89A2"/>
      </g>
      {/* glow */}
      <circle cx={w*0.30} cy={h*0.85} r="50" fill="#3FA7E6" opacity="0.18"/>
      <circle cx={w*0.72} cy={h*0.85} r="50" fill="#E63946" opacity="0.20"/>
      {/* scan lines */}
      <g stroke="rgba(255,255,255,0.04)" strokeWidth="1">
        {Array.from({length:Math.ceil(h/16)}).map((_,i)=>(<line key={i} x1="0" x2={w} y1={i*16} y2={i*16}/>))}
      </g>
    </svg>
  );
}

// AR detection bracket overlay
function ARBracket({ left, top, w, h, label='DETECTED · 2 VEHICLES · 96%', color }){
  const c = color || DA.sky;
  return (
    <div style={{position:'absolute', left, top, width:w, height:h, pointerEvents:'none'}}>
      <div style={{position:'absolute', inset:0, border:`2px solid ${c}`, borderRadius:6, animation:'da-frame 2s ease-in-out infinite'}}/>
      {[
        {top:-2, left:-2, b:['t','l']},{top:-2, right:-2, b:['t','r']},
        {bottom:-2, left:-2, b:['b','l']},{bottom:-2, right:-2, b:['b','r']},
      ].map((p,i)=>(
        <div key={i} style={{position:'absolute', width:14, height:14, borderColor:c, borderStyle:'solid', borderWidth:0,
          top:p.top, left:p.left, right:p.right, bottom:p.bottom,
          borderTopWidth:p.b.includes('t')?3:0, borderBottomWidth:p.b.includes('b')?3:0,
          borderLeftWidth:p.b.includes('l')?3:0, borderRightWidth:p.b.includes('r')?3:0,
        }}/>
      ))}
      <div style={{position:'absolute', top:-22, left:0, padding:'2px 6px', background:c, color:DA.paper, fontFamily:DA.ui, fontSize:9, fontWeight:700, letterSpacing:0.8, borderRadius:3}}>
        {label}
      </div>
    </div>
  );
}

// Cam-side common chrome (back, cam id pill, REC, time)
function CamChrome({ dark=true, time='9:41:42', recSec='02:14', camId='OPP CAM 401-E-12', loc='Hwy 401 EB · exit 366', size='lg' }){
  const small = size==='sm';
  return (
    <>
      <div style={{position:'absolute', top:14, left:14, right:14, zIndex:30, display:'flex', gap:8}}>
        <div style={{padding:10, borderRadius:14, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', display:'flex', alignItems:'center', justifyContent:'center', color:DA.paper, border:'1px solid rgba(255,255,255,0.10)'}}>
          <IcChevL size={small?16:18}/>
        </div>
        <div style={{flex:1, padding:'8px 12px', borderRadius:14, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', color:DA.paper, border:'1px solid rgba(255,255,255,0.10)'}}>
          <div style={{display:'flex', alignItems:'center', gap:6}}>
            <span style={{width:6, height:6, borderRadius:'50%', background:'#E63946', animation:'da-blink 1s infinite'}}/>
            <span style={{fontFamily:DA.mono, fontSize: small?9:10, opacity:0.75, letterSpacing:0.8, textTransform:'uppercase'}}>LIVE · {camId}</span>
          </div>
          <div style={{fontFamily:DA.ui, fontSize: small?12:14, fontWeight:600, marginTop:1}}>{loc}</div>
        </div>
        <div style={{padding:10, borderRadius:14, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', color:DA.paper, border:'1px solid rgba(255,255,255,0.10)', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <IcLayers size={small?16:18}/>
        </div>
      </div>

      <div style={{position:'absolute', top:80, left:14, zIndex:30, padding:'5px 10px', borderRadius:8, background:'rgba(230,57,70,0.92)', color:DA.paper, display:'flex', alignItems:'center', gap:6, fontFamily:DA.mono, fontSize: small?9:10, fontWeight:700, letterSpacing:0.8}}>
        <span style={{width:6, height:6, borderRadius:'50%', background:DA.paper, animation:'da-blink 1s infinite'}}/>
        REC · {recSec}
      </div>
      <div style={{position:'absolute', top:80, right:14, zIndex:30, padding:'5px 10px', borderRadius:8, background:'rgba(0,0,0,0.55)', color:DA.paper, fontFamily:DA.mono, fontSize: small?9:10, fontWeight:700, letterSpacing:0.8}}>
        {time} EDT · MAY 06
      </div>
    </>
  );
}

// ───────── TABLET · CAMERA ──────────────────────────────────────────────────
function TabletCamera() {
  return (
    <Tablet dark>
      <div style={{display:'flex', height:'100%', background:DA.bgD}}>
        {/* LEFT — verify panel */}
        <div style={{width:380, borderRight:`1px solid ${DA.lineD}`, display:'flex', flexDirection:'column', background:DA.surfD, color:DA.paper, padding:'16px 18px'}}>
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:14}}>
            <span style={{padding:'6px 12px', borderRadius:99, background:'rgba(255,255,255,0.10)', display:'inline-flex', alignItems:'center', gap:6, fontFamily:DA.ui, fontSize:13, fontWeight:600}}>
              <IcChevL size={14}/> Back
            </span>
            <Pin kind="police" size={28}/>
            <span style={{fontFamily:DA.ui, fontSize:12, fontWeight:700, letterSpacing:0.6, textTransform:'uppercase', color:'rgba(255,255,255,0.6)'}}>Cam Verify</span>
          </div>

          <h2 style={{margin:'4px 0 4px', fontFamily:DA.ui, fontWeight:800, fontSize:22, letterSpacing:-0.4, lineHeight:1.15}}>Verify before<br/>you roll</h2>
          <div style={{fontFamily:DA.ui, fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.45}}>~13% of dispatches in this zone last month were unverified or staged. Confirm visually before accepting.</div>

          {/* AI confidence */}
          <div style={{marginTop:16, padding:'12px 14px', borderRadius:14, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <span style={{fontFamily:DA.ui, fontSize:11, color:'rgba(255,255,255,0.6)', fontWeight:600, letterSpacing:0.6, textTransform:'uppercase'}}>Auto-detect confidence</span>
              <span style={{fontFamily:DA.ui, fontSize:14, color:DA.sky, fontWeight:800}}>96%</span>
            </div>
            <div style={{height:6, borderRadius:99, background:'rgba(255,255,255,0.10)', overflow:'hidden'}}>
              <div style={{width:'96%', height:'100%', background:`linear-gradient(90deg, ${DA.sky}, ${DA.deep})`, borderRadius:99}}/>
            </div>
            <div style={{display:'flex', flexWrap:'wrap', gap:6, marginTop:10}}>
              {['2 vehicles','Lane blocked','Debris on road'].map(t=>(
                <span key={t} style={{padding:'4px 8px', borderRadius:6, background:'rgba(255,255,255,0.08)', fontFamily:DA.ui, fontSize:11, fontWeight:600, display:'inline-flex', alignItems:'center', gap:5}}>
                  <IcCheck size={11} sw={2.4}/>{t}
                </span>
              ))}
            </div>
          </div>

          {/* Source / time meta */}
          <div style={{marginTop:14, padding:'12px 14px', borderRadius:14, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)'}}>
            {[['Reported','9:39 EDT · motorist 511'],['Cross-ref','TomTom · OPP feed'],['Distance','9.2 km · ETA 4 min'],['Bids','2 of 4 · closes 0:42']].map(([l,v])=>(
              <div key={l} style={{display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                <span style={{fontFamily:DA.ui, fontSize:12, color:'rgba(255,255,255,0.55)'}}>{l}</span>
                <span style={{fontFamily:DA.ui, fontSize:13, fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>

          {/* Nearby cameras */}
          <div style={{marginTop:14}}>
            <div style={{fontFamily:DA.ui, fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:600, letterSpacing:0.6, textTransform:'uppercase', marginBottom:6}}>Nearby cameras · 6</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
              {[['401-E-12',true],['401-E-11'],['DIXIE-N-04'],['QEW-W-21']].map(([c,sel])=>(
                <div key={c} style={{padding:'7px 10px', borderRadius:8, background: sel?DA.sky:'rgba(255,255,255,0.06)', color:DA.paper, fontFamily:DA.mono, fontSize:11, fontWeight:600, letterSpacing:0.4, border:'1px solid rgba(255,255,255,0.08)', textAlign:'center'}}>{c}</div>
              ))}
            </div>
          </div>

          <div style={{flex:1}}/>

          {/* CTAs */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:14}}>
            <button style={{padding:'14px 12px', borderRadius:14, border:'1px solid rgba(255,255,255,0.14)', background:'rgba(255,255,255,0.06)', color:DA.paper, fontFamily:DA.ui, fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2}}>
              <span style={{display:'inline-flex', alignItems:'center', gap:6}}><span style={{width:8, height:8, borderRadius:'50%', background:'#E63946'}}/> Flag as fake</span>
              <span style={{fontFamily:DA.ui, fontSize:10, opacity:0.6, fontWeight:500}}>Notify dispatch</span>
            </button>
            <button style={{padding:'14px 12px', borderRadius:14, border:'none', background:DA.on, color:DA.paper, fontFamily:DA.ui, fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2, boxShadow:'0 6px 14px rgba(31,203,107,0.30)'}}>
              <span style={{display:'inline-flex', alignItems:'center', gap:6}}><IcCheck size={14} sw={2.4}/> Confirmed real</span>
              <span style={{fontFamily:DA.ui, fontSize:10, opacity:0.85, fontWeight:500}}>Roll truck now</span>
            </button>
          </div>
        </div>

        {/* RIGHT — camera viewport */}
        <div style={{flex:1, position:'relative', overflow:'hidden', background:'#000'}}>
          <CCTVScene w={760} h={790}/>
          <div style={{position:'absolute', inset:0, opacity:0.06, backgroundImage:'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize:'3px 3px', pointerEvents:'none'}}/>
          <div style={{position:'absolute', inset:0, background:'radial-gradient(140% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.65) 100%)', pointerEvents:'none'}}/>

          <CamChrome/>

          {/* AR detection bracket */}
          <ARBracket left={300} top={460} w={170} h={110}/>

          {/* PTZ controls right */}
          <div style={{position:'absolute', right:14, top:160, display:'flex', flexDirection:'column', gap:8, zIndex:30}}>
            {[IcPlus, IcMinus, IcTarget, IcLayers].map((Ic,i)=>(
              <div key={i} style={{width:42, height:42, borderRadius:12, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.10)', color:DA.paper, display:'flex', alignItems:'center', justifyContent:'center'}}>
                <Ic size={18}/>
              </div>
            ))}
          </div>

          {/* timeline scrubber */}
          <div style={{position:'absolute', left:14, right:14, bottom:14, padding:'10px 14px', borderRadius:14, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.10)', color:DA.paper, zIndex:30}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6, fontFamily:DA.mono, fontSize:10, color:'rgba(255,255,255,0.65)', letterSpacing:0.8, textTransform:'uppercase'}}>
              <span>9:25</span><span>· LIVE ·</span><span>9:55</span>
            </div>
            <div style={{position:'relative', height:8, borderRadius:99, background:'rgba(255,255,255,0.10)'}}>
              <div style={{position:'absolute', inset:0, width:'55%', borderRadius:99, background:DA.sky}}/>
              <div style={{position:'absolute', left:'55%', transform:'translate(-50%, -50%)', top:'50%', width:14, height:14, borderRadius:'50%', background:DA.paper, border:`2px solid ${DA.sky}`, boxShadow:'0 2px 6px rgba(0,0,0,0.30)'}}/>
            </div>
          </div>
        </div>
      </div>
    </Tablet>
  );
}

// ───────── MOBILE · CAMERA ──────────────────────────────────────────────────
function MobileCamera() {
  return (
    <Phone dark>
      <div style={{position:'absolute', inset:0, background:'#000'}}>
        <CCTVScene w={393} h={852}/>
        <div style={{position:'absolute', inset:0, opacity:0.06, backgroundImage:'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize:'3px 3px'}}/>
        <div style={{position:'absolute', inset:0, background:'radial-gradient(140% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.65) 100%)'}}/>
      </div>

      <CamChrome size="sm"/>

      <ARBracket left={120} top={500} w={150} h={100}/>

      {/* PTZ controls */}
      <div style={{position:'absolute', right:12, top:260, display:'flex', flexDirection:'column', gap:8, zIndex:30}}>
        {[IcPlus, IcMinus, IcTarget].map((Ic,i)=>(
          <div key={i} style={{width:38, height:38, borderRadius:12, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.10)', color:DA.paper, display:'flex', alignItems:'center', justifyContent:'center'}}>
            <Ic size={18}/>
          </div>
        ))}
      </div>

      {/* nearby cams strip */}
      <div style={{position:'absolute', left:12, top:260, display:'flex', flexDirection:'column', gap:6, zIndex:30}}>
        <span style={{fontFamily:DA.ui, fontSize:9, color:'rgba(255,255,255,0.6)', fontWeight:600, letterSpacing:0.6, textTransform:'uppercase'}}>Nearby cams</span>
        {[['401-E-12',true],['401-E-11'],['DIXIE-N-04']].map(([c,sel])=>(
          <div key={c} style={{padding:'4px 8px', borderRadius:8, background: sel?DA.sky:'rgba(0,0,0,0.55)', color:DA.paper, fontFamily:DA.mono, fontSize:10, fontWeight:600, letterSpacing:0.4, border:'1px solid rgba(255,255,255,0.10)'}}>{c}</div>
        ))}
      </div>

      {/* verify sheet */}
      <div style={{position:'absolute', left:0, right:0, bottom:0, padding:'12px 18px 28px', borderRadius:'24px 24px 0 0', background:DA.paper, color:DA.ink, zIndex:30, boxShadow:'0 -10px 30px rgba(0,0,0,0.30)'}}>
        <div style={{display:'flex', justifyContent:'center', marginBottom:10}}>
          <div style={{width:36, height:4, borderRadius:99, background:'rgba(11,51,84,0.18)'}}/>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8}}>
          <Pin kind="collision" size={28}/>
          <div style={{flex:1}}>
            <div style={{fontFamily:DA.ui, fontSize:15, fontWeight:800}}>Verify before you roll</div>
            <div style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3}}>Multi-vehicle · Hwy 401 EB</div>
          </div>
          <span style={{padding:'3px 8px', borderRadius:5, background:DA.ice, color:DA.deep, fontFamily:DA.mono, fontSize:10, fontWeight:700}}>96%</span>
        </div>
        <div style={{height:6, borderRadius:99, background:DA.line2, overflow:'hidden', marginBottom:10}}>
          <div style={{width:'96%', height:'100%', background:`linear-gradient(90deg, ${DA.sky}, ${DA.deep})`, borderRadius:99}}/>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
          <button style={{padding:'12px 10px', borderRadius:14, border:`1px solid ${DA.line}`, background:DA.paper, color:DA.ink, fontFamily:DA.ui, fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2}}>
            <span style={{display:'inline-flex', alignItems:'center', gap:5}}><span style={{width:7, height:7, borderRadius:'50%', background:'#E63946'}}/> Flag fake</span>
          </button>
          <button style={{padding:'12px 10px', borderRadius:14, border:'none', background:DA.on, color:DA.paper, fontFamily:DA.ui, fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2, boxShadow:'0 6px 14px rgba(31,203,107,0.30)'}}>
            <span style={{display:'inline-flex', alignItems:'center', gap:5}}><IcCheck size={13} sw={2.4}/> Confirmed</span>
          </button>
        </div>
      </div>
    </Phone>
  );
}

// ───────── Send-to-nav (shared bits) ────────────────────────────────────────
const NAV_APPS = [
  { k:'apple',  name:'Apple Maps',   sub:'Default · ETA 4 min',   color:DA.deep,   glyph:'A' },
  { k:'google', name:'Google Maps',  sub:'Has live traffic',       color:'#0E8A5F', glyph:'G' },
  { k:'waze',   name:'Waze',         sub:'Police-aware route',     color:DA.sky,    glyph:'W' },
  { k:'truck',  name:'TruckMap Pro', sub:'CMV-safe roads',         color:DA.ink,    glyph:'T' },
];

function NavAppRow({ a, first }) {
  return (
    <div style={{display:'flex', alignItems:'center', gap:14, padding:'12px 4px', borderTop: first?'none':`1px solid ${DA.line2}`, cursor:'pointer'}}>
      <div style={{width:44, height:44, borderRadius:13, background:a.color, color:DA.paper, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:DA.ui, fontWeight:800, fontSize:18, position:'relative'}}>
        {a.glyph}
        <span style={{position:'absolute', inset:-2, borderRadius:14, border:`1.5px solid ${a.color}`, opacity:0.3}}/>
      </div>
      <div style={{flex:1}}>
        <div style={{fontFamily:DA.ui, fontSize:15, fontWeight:700, color:DA.ink}}>{a.name}</div>
        <div style={{fontFamily:DA.ui, fontSize:12, color:DA.ink3, marginTop:1}}>{a.sub}</div>
      </div>
      {a.k==='apple'
        ? <span style={{padding:'4px 9px', borderRadius:6, background:DA.ice, color:DA.deep, fontFamily:DA.mono, fontSize:10, fontWeight:700, letterSpacing:0.6, textTransform:'uppercase'}}>Default</span>
        : <IcChevR size={16}/>
      }
    </div>
  );
}

// ───────── TABLET · SEND TO NAV ─────────────────────────────────────────────
function TabletNavSend() {
  return (
    <Tablet>
      <div style={{display:'flex', height:'100%'}}>
        {/* LEFT — map preview */}
        <div style={{flex:1, position:'relative', overflow:'hidden'}}>
          <MapLight w={790} h={780}/>
          <svg style={{position:'absolute', inset:0}} viewBox="0 0 790 790">
            <path d="M120 600 C 240 480, 320 460, 400 380 S 540 240, 600 200" stroke={DA.deep} strokeWidth="6" fill="none" strokeLinecap="round"/>
            <path d="M120 600 C 240 480, 320 460, 400 380 S 540 240, 600 200" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="3 8"/>
          </svg>
          <div style={{position:'absolute', left:120, top:600, transform:'translate(-50%,-50%)', width:36, height:36, borderRadius:'50%', background:DA.ink, color:DA.paper, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 0 4px rgba(63,167,230,0.30)`}}>
            <IcLoc size={18}/>
          </div>
          <div style={{position:'absolute', left:600, top:200, transform:'translate(-50%,-50%)'}}><Pin kind="collision" size={48} ring/></div>
          <div style={{position:'absolute', inset:0, background:'linear-gradient(90deg, transparent 50%, rgba(244,248,252,0.55) 100%)', pointerEvents:'none'}}/>

          {/* dist pill */}
          <div style={{position:'absolute', right:24, top:24, padding:'8px 14px', borderRadius:99, background:DA.paper, border:`1px solid ${DA.line}`, fontFamily:DA.ui, fontSize:12, fontWeight:700, color:DA.ink, display:'inline-flex', alignItems:'center', gap:6, boxShadow:'0 2px 6px rgba(0,0,0,0.08)'}}>
            <span style={{width:6, height:6, borderRadius:'50%', background:DA.deep}}/> 9.2 KM · 4 MIN · 401 EB
          </div>
        </div>

        {/* RIGHT — send sheet rail */}
        <div style={{width:420, borderLeft:`1px solid ${DA.line}`, padding:'18px 22px 22px', display:'flex', flexDirection:'column', background:DA.paper}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
            <span style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3, fontWeight:700, letterSpacing:0.8, textTransform:'uppercase'}}>Send route to</span>
            <IcClose size={20}/>
          </div>
          <h2 style={{margin:'2px 0 10px', fontFamily:DA.ui, fontWeight:800, fontSize:22, letterSpacing:-0.4}}>Open in navigation</h2>

          {/* destination card */}
          <div style={{padding:'12px 14px', borderRadius:16, background:DA.ice, border:`1px solid ${DA.line2}`, display:'flex', gap:12, alignItems:'center'}}>
            <div style={{width:38, height:38, borderRadius:11, background:DA.deep, color:DA.paper, display:'flex', alignItems:'center', justifyContent:'center'}}>
              <IcLoc size={18}/>
            </div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontFamily:DA.ui, fontSize:14, fontWeight:700, color:DA.ink}}>Hwy 401 EB · exit 366</div>
              <div style={{fontFamily:DA.mono, fontSize:11, color:DA.ink3}}>43.6068° N · 79.6397° W</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:DA.ui, fontSize:18, fontWeight:800, color:DA.ink}}>4 min</div>
              <div style={{fontFamily:DA.mono, fontSize:10, color:DA.ink3, letterSpacing:0.5}}>9.2 KM</div>
            </div>
          </div>

          {/* app list */}
          <div style={{marginTop:14}}>
            {NAV_APPS.map((a,i)=><NavAppRow key={a.k} a={a} first={i===0}/>)}
          </div>

          {/* default toggle */}
          <div style={{marginTop:14, padding:'12px 14px', borderRadius:14, background:DA.ice, display:'flex', alignItems:'center', gap:12}}>
            <span style={{width:30, height:30, borderRadius:9, background:DA.paper, color:DA.deep, display:'flex', alignItems:'center', justifyContent:'center'}}>
              <IcMap size={16}/>
            </span>
            <div style={{flex:1}}>
              <div style={{fontFamily:DA.ui, fontSize:13, fontWeight:700, color:DA.ink}}>Always use Apple Maps</div>
              <div style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3}}>Skip this sheet for future jobs</div>
            </div>
            <div style={{width:42, height:24, borderRadius:99, background:'rgba(11,51,84,0.15)', padding:3, display:'flex'}}>
              <span style={{width:18, height:18, borderRadius:'50%', background:DA.paper, boxShadow:'0 1px 3px rgba(0,0,0,0.15)'}}/>
            </div>
          </div>

          {/* secondary actions */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12}}>
            {['Copy address','Share with crew'].map(l=>(
              <button key={l} style={{padding:'12px 10px', borderRadius:12, border:`1px solid ${DA.line}`, background:DA.paper, fontFamily:DA.ui, fontSize:13, fontWeight:600, color:DA.ink, cursor:'pointer'}}>{l}</button>
            ))}
          </div>

          <div style={{flex:1}}/>

          <div style={{marginTop:12}}>
            <CTA icon={<IcLoc size={16}/>}>Start in Apple Maps</CTA>
          </div>
        </div>
      </div>
    </Tablet>
  );
}

// ───────── MOBILE · SEND TO NAV ─────────────────────────────────────────────
function MobileNavSend() {
  return (
    <Phone>
      {/* dim map */}
      <div style={{position:'absolute', inset:0}}>
        <MapLight w={393} h={852}/>
        <div style={{position:'absolute', left:196, top:380, transform:'translate(-50%,-50%)'}}><Pin kind="collision" size={42} ring/></div>
        <svg style={{position:'absolute', inset:0}} viewBox="0 0 393 852">
          <path d="M120 600 C 160 500, 180 460, 220 400 S 240 380, 250 360" stroke={DA.deep} strokeWidth="4" fill="none" strokeLinecap="round"/>
          <path d="M120 600 C 160 500, 180 460, 220 400 S 240 380, 250 360" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeDasharray="2 6"/>
        </svg>
        <div style={{position:'absolute', inset:0, background:'rgba(11,51,84,0.42)'}}/>
      </div>

      <div style={{position:'absolute', top:14, left:14, zIndex:30, padding:10, borderRadius:14, background:'rgba(255,255,255,0.18)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.20)', color:DA.paper, display:'flex', alignItems:'center', justifyContent:'center'}}>
        <IcClose size={18}/>
      </div>

      <div style={{position:'absolute', left:0, right:0, bottom:0, padding:'14px 18px 28px', background:DA.paper, borderRadius:'28px 28px 0 0', boxShadow:'0 -20px 50px rgba(0,0,0,0.20)', zIndex:30}}>
        <div style={{display:'flex', justifyContent:'center', marginBottom:10}}>
          <div style={{width:36, height:4, borderRadius:99, background:'rgba(11,51,84,0.18)'}}/>
        </div>
        <span style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3, fontWeight:700, letterSpacing:0.8, textTransform:'uppercase'}}>Send route to</span>
        <h2 style={{margin:'4px 0 10px', fontFamily:DA.ui, fontWeight:800, fontSize:22, letterSpacing:-0.4}}>Open in navigation</h2>

        <div style={{padding:'12px 14px', borderRadius:16, background:DA.ice, border:`1px solid ${DA.line2}`, display:'flex', gap:12, alignItems:'center'}}>
          <div style={{width:36, height:36, borderRadius:11, background:DA.deep, color:DA.paper, display:'flex', alignItems:'center', justifyContent:'center'}}>
            <IcLoc size={16}/>
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontFamily:DA.ui, fontSize:13, fontWeight:700, color:DA.ink}}>Hwy 401 EB · exit 366</div>
            <div style={{fontFamily:DA.mono, fontSize:10, color:DA.ink3}}>43.6068° N · 79.6397° W</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontFamily:DA.ui, fontSize:16, fontWeight:800, color:DA.ink}}>4 min</div>
            <div style={{fontFamily:DA.mono, fontSize:10, color:DA.ink3}}>9.2 KM</div>
          </div>
        </div>

        <div style={{marginTop:10}}>
          {NAV_APPS.map((a,i)=><NavAppRow key={a.k} a={a} first={i===0}/>)}
        </div>

        <div style={{marginTop:12}}>
          <CTA icon={<IcLoc size={16}/>}>Start in Apple Maps</CTA>
        </div>
      </div>
    </Phone>
  );
}

// ───────── TABLET · FULL MAP (immersive) ────────────────────────────────────
function TabletFullMap() {
  return (
    <Tablet>
      <div style={{position:'absolute', inset:0}}>
        <MapLight w={1180} h={820}/>
        <Radius x={580} y={400} r={260}/>
        {/* markers — scattered across full width */}
        <div style={{position:'absolute', inset:0, zIndex:5, pointerEvents:'none'}}>
          {INCIDENTS.map((i,idx)=>(
            <div key={i.id} style={{position:'absolute', left: 100+idx*92+(idx%2)*30, top: 140+(idx%4)*120, transform:'translate(-50%,-50%)'}}>
              <Pin kind={i.kind} size={36} ring/>
            </div>
          ))}
        </div>
      </div>

      {/* top: search + filter chips */}
      <div style={{position:'absolute', top:18, left:18, right:18, zIndex:20, display:'flex', gap:10}}>
        <div style={{padding:10, borderRadius:14, background:DA.paper, border:`1px solid ${DA.line}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 6px rgba(0,0,0,0.08)'}}>
          <IcChevL size={18}/>
        </div>
        <div style={{flex:1, height:46, padding:'0 14px', borderRadius:14, background:DA.paper, border:`1px solid ${DA.line}`, display:'flex', alignItems:'center', gap:10, boxShadow:'0 2px 6px rgba(0,0,0,0.08)'}}>
          <IcSearch size={18}/>
          <span style={{flex:1, fontFamily:DA.ui, fontSize:14, color:DA.ink3}}>Search Mississauga · GTA West</span>
          <span style={{fontFamily:DA.mono, fontSize:10, color:DA.ink4}}>⌘K</span>
        </div>
        {/* chip rail */}
        <div style={{display:'flex', gap:6, alignItems:'center'}}>
          {[
            ['All','12',true],['Critical','2'],['Police','5'],['Hazard','3'],['< 5 KM',''],
          ].map(([l,c,sel])=>(
            <div key={l} style={{padding:'9px 14px', borderRadius:99, fontFamily:DA.ui, fontSize:13, fontWeight:700, background: sel?DA.ink:DA.paper, color: sel?DA.paper:DA.ink, border: sel?'none':`1px solid ${DA.line}`, display:'inline-flex', gap:6, alignItems:'center', whiteSpace:'nowrap', boxShadow:'0 2px 6px rgba(0,0,0,0.06)'}}>
              {l}{c && <span style={{fontFamily:DA.mono, fontSize:10, opacity:0.7}}>{c}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* right rail controls */}
      <div style={{position:'absolute', right:18, top:90, display:'flex', flexDirection:'column', gap:8, zIndex:20}}>
        {[IcPlus, IcMinus, null, IcTarget, IcLayers].map((Ic,i)=>(
          Ic ? <div key={i} style={{width:46, height:46, borderRadius:14, background:DA.paper, border:`1px solid ${DA.line}`, color:DA.ink, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 6px rgba(0,0,0,0.08)'}}><Ic size={20}/></div>
          : <div key={i} style={{height:1, background:DA.line, margin:'0 6px'}}/>
        ))}
      </div>

      {/* bottom-left: legend */}
      <div style={{position:'absolute', left:18, bottom:18, padding:'14px 16px', borderRadius:16, background:DA.paper, border:`1px solid ${DA.line}`, boxShadow:'0 4px 14px rgba(0,0,0,0.10)', zIndex:20}}>
        <div style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3, fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', marginBottom:8}}>Legend · Pin types</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'6px 18px'}}>
          {KIND_KEYS.slice(0,8).map(k=>(
            <div key={k} style={{display:'flex', alignItems:'center', gap:8}}>
              <Pin kind={k} size={20}/>
              <span style={{fontFamily:DA.ui, fontSize:12, color:DA.ink2, fontWeight:500}}>{KIND[k].L}</span>
            </div>
          ))}
        </div>
        <div style={{height:1, background:DA.line2, margin:'10px 0'}}/>
        <div style={{display:'flex', gap:14, alignItems:'center'}}>
          <span style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3, fontWeight:700, textTransform:'uppercase', letterSpacing:0.6}}>Traffic</span>
          {[['Free','#22B86C'],['Slow','#F4C430'],['Stop','#E63946']].map(([l,c])=>(
            <span key={l} style={{display:'inline-flex', gap:5, alignItems:'center'}}>
              <span style={{width:18, height:4, background:c, borderRadius:2}}/>
              <span style={{fontFamily:DA.ui, fontSize:11, color:DA.ink2}}>{l}</span>
            </span>
          ))}
        </div>
      </div>

      {/* bottom-right: timebar / slider */}
      <div style={{position:'absolute', right:18, bottom:18, padding:'14px 16px', borderRadius:16, background:DA.paper, border:`1px solid ${DA.line}`, boxShadow:'0 4px 14px rgba(0,0,0,0.10)', zIndex:20, width:340}}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:6}}>
          <span style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3, fontWeight:700, letterSpacing:0.8, textTransform:'uppercase'}}>Timeline · last 3 hrs</span>
          <span style={{fontFamily:DA.mono, fontSize:11, color:DA.ink, fontWeight:600}}>9:41</span>
        </div>
        <div style={{position:'relative', height:24, display:'flex', alignItems:'center'}}>
          <div style={{height:4, borderRadius:99, background:DA.line, width:'100%'}}/>
          <div style={{position:'absolute', left:0, height:4, borderRadius:99, background:DA.deep, width:'100%'}}/>
          {/* dots for incidents */}
          {[10,22,38,52,68,80,92].map((p,i)=>(
            <span key={i} style={{position:'absolute', left:`${p}%`, transform:'translateX(-50%)', width:6, height:6, borderRadius:'50%', background:DA.sky}}/>
          ))}
          <div style={{position:'absolute', left:'92%', width:18, height:18, borderRadius:'50%', background:DA.paper, border:`3px solid ${DA.deep}`, transform:'translateX(-50%)', boxShadow:'0 2px 6px rgba(11,51,84,0.2)'}}/>
        </div>
      </div>

      {/* zone counter chip top-right */}
      <div style={{position:'absolute', right:18, top:80+5*54-220, zIndex:20}}/>
    </Tablet>
  );
}

window.TabletCamera = TabletCamera;
window.MobileCamera = MobileCamera;
window.TabletNavSend = TabletNavSend;
window.MobileNavSend = MobileNavSend;
window.TabletFullMap = TabletFullMap;
