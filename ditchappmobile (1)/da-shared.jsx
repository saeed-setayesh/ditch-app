// ─── DitchApp · Incidenta-style primitives ──────────────────────────────────

const DA = {
  // Brand palette (Sky / Deep / Ink / Ice / Paper)
  sky:'#3FA7E6', deep:'#1F6FB2', ice:'#E8F4FC',
  on:'#1FCB6B', cta:'#1F6FB2', ctaDark:'#0B3354',
  ink:'#0B3354', ink2:'#345A7E', ink3:'#7A8FA8', ink4:'#B5C3D2',
  line:'#DCE7F0', line2:'#EEF4F9', paper:'#FFFFFF', bg:'#F4F8FC',
  bgD:'#06182C', surfD:'#0B3354', surfD2:'#13456E', lineD:'#1F4F77',
  // incident pin colors
  iAccident:'#F38A1F', iCollision:'#22B86C', iFire:'#E63946', iHazard:'#F4C430',
  iJam:'#8C4FCF', iMedical:'#E63946', iPolice:'#3098F2', iWeather:'#28C6C8',
  iConstruction:'#FF7A33', iTow:'#5C6BFF',
  // road flow
  roadFast:'#4ADE80', roadMid:'#FACC15', roadSlow:'#F97316', roadStop:'#EF4444',
  ui:"'Inter', system-ui, sans-serif", mono:"'JetBrains Mono', ui-monospace, monospace",
};

// ─── Icon set — outline glyphs, currentColor ────────────────────────────────
const Ico = ({d, size=20, sw=2, fill='none', children}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{flex:'0 0 auto'}}>
    {d ? <path d={d}/> : children}
  </svg>
);

const IcMap     = (p)=> <Ico {...p}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/></Ico>;
const IcSliders = (p)=> <Ico {...p}><path d="M4 7h12M20 7h0M4 12h4M12 12h8M4 17h10M18 17h2"/><circle cx="18" cy="7" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="16" cy="17" r="2"/></Ico>;
const IcChevR   = (p)=> <Ico {...p}><path d="m9 6 6 6-6 6"/></Ico>;
const IcChevL   = (p)=> <Ico {...p}><path d="m15 6-6 6 6 6"/></Ico>;
const IcChevD   = (p)=> <Ico {...p}><path d="m6 9 6 6 6-6"/></Ico>;
const IcClose   = (p)=> <Ico {...p}><path d="M6 6l12 12M18 6 6 18"/></Ico>;
const IcCheck   = (p)=> <Ico {...p}><path d="m4 12 5 5L20 6"/></Ico>;
const IcSearch  = (p)=> <Ico {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Ico>;
const IcPlus    = (p)=> <Ico {...p}><path d="M12 5v14M5 12h14"/></Ico>;
const IcMinus   = (p)=> <Ico {...p}><path d="M5 12h14"/></Ico>;
const IcLayers  = (p)=> <Ico {...p}><path d="m12 3 9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/></Ico>;
const IcTarget  = (p)=> <Ico {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></Ico>;
const IcLoc     = (p)=> <Ico {...p}><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.6"/></Ico>;
const IcUser    = (p)=> <Ico {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6"/></Ico>;
const IcBell    = (p)=> <Ico {...p}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5L6 16z"/><path d="M10 21h4"/></Ico>;
const IcCard    = (p)=> <Ico {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></Ico>;
const IcLogo    = (p)=> <Ico {...p}><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5" fill="currentColor"/></Ico>;
// pin glyphs (white on color)
const GlAccident = ({size=18})=> <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff"><path d="M3 14l1.5-4 2-1h4l2.5 4h7v4h-1a2 2 0 1 1-4 0H9a2 2 0 1 1-4 0H3v-3z"/><path d="M14 5l1 3M18 4l-2 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/></svg>;
const GlCollision= ({size=18})=> <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff"><path d="M2 14l1-3 2-1h4l2 3h4l2-3h2l1 3v3h-2a2 2 0 1 1-4 0h-2a2 2 0 1 1-4 0H4a2 2 0 1 1-4 0v-3z"/></svg>;
const GlFire     = ({size=18})=> <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff"><path d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-3s1 2 3 2c0-3-2-4 0-7z"/></svg>;
const GlHazard   = ({size=18})=> <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff"><rect x="11" y="6" width="2.2" height="8" rx="1"/><circle cx="12" cy="17" r="1.4"/></svg>;
const GlJam      = ({size=18})=> <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff"><rect x="4" y="4" width="11" height="6" rx="2"/><rect x="9" y="14" width="11" height="6" rx="2"/><circle cx="6.5" cy="10.5" r="1.2"/><circle cx="12.5" cy="10.5" r="1.2"/><circle cx="11.5" cy="20.5" r="1.2"/><circle cx="17.5" cy="20.5" r="1.2"/></svg>;
const GlMedical  = ({size=18})=> <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6V4z"/></svg>;
const GlPolice   = ({size=18})=> <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff"><path d="M6 12a6 6 0 0 1 12 0v4H6v-4z"/><circle cx="12" cy="6" r="2"/><rect x="4" y="16" width="16" height="2" rx="1"/></svg>;
const GlWeather  = ({size=18})=> <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff"><path d="M7 13a4 4 0 1 1 1.5-7.7A5 5 0 0 1 18 9a3 3 0 0 1 0 6H7z"/><path d="M9 18l-1 2M13 18l-1 2M17 18l-1 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>;
const GlConstruction=({size=18})=> <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff"><path d="M5 9h14l-2 11H7L5 9zM3 7h18v2H3z"/></svg>;
const GlTow      = ({size=18})=> <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff"><path d="M2 16h7l3-4h6l4 4v3h-2"/><circle cx="7" cy="19" r="1.6"/><circle cx="18" cy="19" r="1.6"/></svg>;

// Map incident "kind" → color & glyph & label
const KIND = {
  accident:    { c: DA.iAccident,    G: GlAccident,    L:'Accident' },
  collision:   { c: DA.iCollision,   G: GlCollision,   L:'Collision' },
  fire:        { c: DA.iFire,        G: GlFire,        L:'Fire' },
  hazard:      { c: DA.iHazard,      G: GlHazard,      L:'Hazard' },
  jam:         { c: DA.iJam,         G: GlJam,         L:'Jam' },
  medical:     { c: DA.iMedical,     G: GlMedical,     L:'Medical' },
  police:      { c: DA.iPolice,      G: GlPolice,      L:'Police' },
  weather:     { c: DA.iWeather,     G: GlWeather,     L:'Weather' },
  construction:{ c: DA.iConstruction,G: GlConstruction,L:'Construction' },
  tow:         { c: DA.iTow,         G: GlTow,         L:'Tow' },
};

// ─── Pin (round colored, white glyph) ───────────────────────────────────────
function Pin({ kind='hazard', size=34, ring=false, scale=1 }) {
  const k = KIND[kind] || KIND.hazard;
  const s = size * scale;
  return (
    <span style={{
      width:s, height:s, borderRadius:'50%', background:k.c,
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      boxShadow: ring ? `0 0 0 3px ${DA.paper}, 0 4px 10px rgba(0,0,0,0.2)` : '0 2px 6px rgba(0,0,0,0.18)',
      flex:'0 0 auto',
    }}>
      <k.G size={s*0.55}/>
    </span>
  );
}

// ─── Online pill (green, animated) ──────────────────────────────────────────
function OnlinePill({ on=true, size='md' }) {
  const big = size==='lg';
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:8,
      padding: big ? '9px 18px' : '7px 14px',
      borderRadius:99,
      background: on ? DA.on : '#9CA3AF',
      color: DA.paper,
      fontFamily:DA.ui, fontWeight:700, fontSize: big?14:13, letterSpacing:1,
      textTransform:'uppercase',
      boxShadow:'0 2px 8px rgba(31,203,107,0.30)',
    }}>
      <span style={{
        width:8, height:8, borderRadius:'50%', background:DA.paper,
        boxShadow:`0 0 0 0 rgba(255,255,255,0.7)`,
        animation: on ? 'da-pulse 1.6s ease-out infinite' : 'none',
      }}/>
      {on?'Online':'Offline'}
    </div>
  );
}

// ─── Top header (avatar · ONLINE pill · filter · map) ───────────────────────
function HeaderBar({ dark=false, online=true, mapToggle=true, onMap, onFilter, onAvatar }) {
  const btnBg = dark ? 'rgba(255,255,255,0.08)' : 'rgba(20,24,32,0.06)';
  const btnFg = dark ? DA.paper : DA.ink;
  const btnBd = dark ? '1px solid rgba(255,255,255,0.10)' : `1px solid ${DA.line}`;
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10,
      padding:'10px 12px',
    }}>
      {/* Avatar — white circle dark border */}
      <div onClick={onAvatar} style={{
        width:40, height:40, borderRadius:'50%',
        background:dark?'rgba(255,255,255,0.10)':DA.paper,
        border:dark?'1px solid rgba(255,255,255,0.14)':`1px solid ${DA.line}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        color: dark ? 'rgba(255,255,255,0.65)' : DA.ink3, cursor:'pointer',
        boxShadow:'0 2px 4px rgba(0,0,0,0.04)', flex:'0 0 auto',
      }}>
        <IcUser size={22}/>
      </div>
      <div style={{flex:1, display:'flex', justifyContent:'center'}}>
        <OnlinePill on={online}/>
      </div>
      {/* filter */}
      <div onClick={onFilter} style={{
        width:40, height:40, borderRadius:'50%',
        background:dark?'rgba(255,255,255,0.08)':'rgba(15,18,24,0.85)',
        color:dark?DA.paper:DA.paper,
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', flex:'0 0 auto',
        boxShadow:'0 2px 6px rgba(0,0,0,0.10)',
      }}>
        <IcSliders size={20}/>
      </div>
      {/* map / list toggle */}
      {mapToggle && (
        <div onClick={onMap} style={{
          width:40, height:40, borderRadius:'50%',
          background:dark?'rgba(255,255,255,0.08)':'rgba(15,18,24,0.85)',
          color:DA.paper, display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', flex:'0 0 auto',
          boxShadow:'0 2px 6px rgba(0,0,0,0.10)',
        }}>
          <IcMap size={20}/>
        </div>
      )}
    </div>
  );
}

// ─── Segmented control (Active / All) ───────────────────────────────────────
function Seg({ items, value, onChange, dark=false }) {
  return (
    <div style={{
      margin:'4px 12px 8px', padding:4, borderRadius:14,
      background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,18,24,0.06)',
      display:'grid', gridTemplateColumns:`repeat(${items.length},1fr)`,
    }}>
      {items.map(it=>{
        const sel = it.k===value;
        return (
          <div key={it.k} onClick={()=>onChange?.(it.k)} style={{
            padding:'8px 0', textAlign:'center', borderRadius:10,
            background: sel ? (dark?DA.surfD2:DA.paper) : 'transparent',
            color: sel ? (dark?DA.paper:DA.ink) : (dark?'rgba(255,255,255,0.55)':DA.ink3),
            fontFamily:DA.ui, fontWeight:600, fontSize:14, cursor:'pointer',
            boxShadow: sel ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
          }}>{it.L}</div>
        );
      })}
    </div>
  );
}

// ─── Incident list row (Incidenta-style) ────────────────────────────────────
function IncidentRow({ inc, dark=false, compact=false, onClick, active=false }) {
  const k = KIND[inc.kind] || KIND.hazard;
  const sub = dark ? 'rgba(255,255,255,0.55)' : DA.ink3;
  const text = dark ? DA.paper : DA.ink;
  const bd = dark ? '1px solid rgba(255,255,255,0.06)' : `1px solid ${DA.line2}`;
  const bg = active ? (dark?'rgba(48,152,242,0.14)':'rgba(48,152,242,0.08)') : 'transparent';
  return (
    <div onClick={onClick} style={{
      display:'flex', gap:12, padding: compact?'10px 14px':'14px 16px',
      borderBottom: bd, background:bg, cursor:'pointer', alignItems:'flex-start',
    }}>
      <Pin kind={inc.kind} size={compact?32:38}/>
      <div style={{flex:1, minWidth:0}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
          <div style={{fontFamily:DA.ui, fontSize: compact?13:15, fontWeight:700, color:text, lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{inc.title}</div>
          <div style={{fontFamily:DA.ui, fontSize:12, color:sub, display:'inline-flex', alignItems:'center', gap:5, flex:'0 0 auto'}}>
            <span style={{fontWeight:500}}>{inc.source}</span>
            <span style={{display:'inline-flex', width:14, height:14, borderRadius:'50%', border:`1px solid ${sub}`, alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700}}>i</span>
          </div>
        </div>
        <div style={{fontFamily:DA.ui, fontSize:12, color:sub, fontStyle:'italic', marginTop:1}}>{inc.ago}</div>
        <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:8, marginTop:6}}>
          <div style={{fontFamily:DA.ui, fontSize: compact?11:12, fontWeight:600, color:text, letterSpacing:0.6, textTransform:'uppercase', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{inc.where}</div>
          <div style={{fontFamily:DA.ui, fontSize: compact?11:13, fontWeight:600, color:text, flex:'0 0 auto'}}>{inc.dist}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Map (light) — bright traffic flow style à la Google Maps ───────────────
function MapLight({ w=400, h=820, style={}, density=1 }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
         style={{position:'absolute', inset:0, ...style}}>
      <rect width={w} height={h} fill="#EFF3F0"/>
      {/* parks */}
      <g fill="#D7ECCF">
        <rect x="20" y="60" width="120" height="80" rx="10"/>
        <rect x="220" y="380" width="160" height="120" rx="14"/>
        <rect x="40" y="640" width="100" height="120" rx="10"/>
      </g>
      {/* water */}
      <path d={`M0 ${h-90} Q ${w*0.35} ${h-130}, ${w*0.7} ${h-100} T ${w} ${h-80} L ${w} ${h} L 0 ${h} Z`} fill="#BBDDF0"/>
      {/* gray side roads */}
      <g stroke="#D5DCE2" strokeWidth="3" fill="none" strokeLinecap="round">
        {Array.from({length:Math.round(14*density)}).map((_,i)=>(<line key={'s'+i} x1="0" x2={w} y1={i*60+30} y2={i*60+30} opacity="0.7"/>))}
        {Array.from({length:8}).map((_,i)=>(<line key={'sv'+i} y1="0" y2={h} x1={i*52+20} x2={i*52+20} opacity="0.7"/>))}
      </g>
      {/* green flow major */}
      <g stroke={DA.roadFast} strokeWidth="6" fill="none" strokeLinecap="round">
        <path d="M-10 200 L 410 220"/>
        <path d="M-10 480 L 410 470"/>
        <path d="M120 -10 L 110 830"/>
        <path d="M280 -10 L 295 830"/>
        <path d="M0 110 Q 200 160, 410 130"/>
        <path d="M0 380 Q 200 360, 410 360"/>
        <path d="M0 580 Q 200 600, 410 590"/>
      </g>
      {/* yellow */}
      <g stroke={DA.roadMid} strokeWidth="6" fill="none" strokeLinecap="round">
        <path d="M-10 280 L 410 290" opacity="0.95"/>
        <path d="M60 -10 L 70 830" opacity="0.85"/>
        <path d="M210 -10 L 220 830" opacity="0.85"/>
      </g>
      {/* orange / red */}
      <g stroke={DA.roadSlow} strokeWidth="6" fill="none" strokeLinecap="round">
        <path d="M-10 700 L 410 690"/>
        <path d="M340 -10 L 350 830" opacity="0.85"/>
      </g>
      <g stroke={DA.roadStop} strokeWidth="6" fill="none" strokeLinecap="round">
        <path d="M-10 760 L 410 740"/>
      </g>
      {/* highway dash overlay (green) */}
      <g stroke="#16A34A" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeDasharray="6 8" opacity="0.6">
        <path d="M-10 200 L 410 220"/>
        <path d="M120 -10 L 110 830"/>
      </g>
    </svg>
  );
}

// Map (dark)
function MapDark({ w=400, h=820, style={} }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
         style={{position:'absolute', inset:0, ...style}}>
      <rect width={w} height={h} fill={DA.bgD}/>
      <g fill="#0F1822" opacity="0.85">
        <rect x="20" y="60" width="120" height="80" rx="10"/>
        <rect x="220" y="380" width="160" height="120" rx="14"/>
      </g>
      <g stroke="#1A2230" strokeWidth="3" fill="none" strokeLinecap="round">
        {Array.from({length:14}).map((_,i)=>(<line key={'s'+i} x1="0" x2={w} y1={i*60+30} y2={i*60+30}/>))}
        {Array.from({length:8}).map((_,i)=>(<line key={'sv'+i} y1="0" y2={h} x1={i*52+20} x2={i*52+20}/>))}
      </g>
      <g stroke="#22C55E" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.95">
        <path d="M-10 200 L 410 220"/>
        <path d="M-10 480 L 410 470"/>
        <path d="M120 -10 L 110 830"/>
        <path d="M280 -10 L 295 830"/>
        <path d="M0 110 Q 200 160, 410 130"/>
        <path d="M0 380 Q 200 360, 410 360"/>
        <path d="M0 580 Q 200 600, 410 590"/>
      </g>
      <g stroke={DA.roadMid} strokeWidth="5" fill="none" strokeLinecap="round">
        <path d="M-10 280 L 410 290" opacity="0.85"/>
        <path d="M60 -10 L 70 830" opacity="0.75"/>
      </g>
      <g stroke={DA.roadSlow} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.9">
        <path d="M-10 700 L 410 690"/>
      </g>
    </svg>
  );
}

// ─── Coverage radius circle ─────────────────────────────────────────────────
function Radius({ x, y, r, dark=false }) {
  const c = dark ? '#3098F2' : '#3098F2';
  return (
    <>
      <div style={{position:'absolute', left:x, top:y, transform:'translate(-50%,-50%)', width:r*2, height:r*2, borderRadius:'50%', border:`1.5px dashed ${c}`, opacity:0.5}}/>
      <div style={{position:'absolute', left:x, top:y, transform:'translate(-50%,-50%)', width:r*2, height:r*2, borderRadius:'50%', background:c, opacity:0.06}}/>
    </>
  );
}

// ─── Mock data ──────────────────────────────────────────────────────────────
const INCIDENTS = [
  { id:'I-1', kind:'police',     title:'Police Hiding',           ago:'21 seconds ago',  source:'Waze',  where:'ON KEELE ST IN TORONTO',      dist:'12.4km', x:175, y:200 },
  { id:'I-2', kind:'police',     title:'Police Hiding',           ago:'46 seconds ago',  source:'Waze',  where:'ON LESLIE ST IN TORONTO',     dist:'5.5km',  x:260, y:280 },
  { id:'I-3', kind:'police',     title:'Police',                  ago:'51 seconds ago',  source:'Waze',  where:'ON WESTON RD IN TORONTO',     dist:'10.5km', x:90,  y:340 },
  { id:'I-4', kind:'jam',        title:'Jam Heavy Traffic',       ago:'52 seconds ago',  source:'Waze',  where:'ON HWY 401 COLLECTOR E',      dist:'12.6km', x:330, y:230 },
  { id:'I-5', kind:'police',     title:'Police',                  ago:'52 seconds ago',  source:'Waze',  where:'IN TORONTO',                  dist:'8.1km',  x:200, y:430 },
  { id:'I-6', kind:'hazard',     title:'Hazard On Shoulder Car Stopped', ago:'1 minute ago', source:'Waze', where:'ON HWY 407 ETR E IN VAUGHAN', dist:'13.8km', x:110, y:560 },
  { id:'I-7', kind:'accident',   title:'Accident Minor',          ago:'2 minutes ago',   source:'Waze',  where:'ON HWY 400 N',                dist:'9.2km',  x:300, y:560 },
  { id:'I-8', kind:'collision',  title:'Vehicle Collision',       ago:'3 minutes ago',   source:'Waze',  where:'ON DUNDAS ST W',              dist:'4.1km',  x:240, y:660 },
  { id:'I-9', kind:'fire',       title:'Vehicle Fire',            ago:'4 minutes ago',   source:'Waze',  where:'ON QEW W IN OAKVILLE',        dist:'18.0km', x:60,  y:660 },
  { id:'I-10',kind:'weather',    title:'Heavy Rain',              ago:'5 minutes ago',   source:'Waze',  where:'IN BRAMPTON',                 dist:'22.5km', x:350, y:120 },
  { id:'I-11',kind:'construction',title:'Construction',           ago:'6 minutes ago',   source:'Waze',  where:'ON HWY 427 N',                dist:'7.9km',  x:140, y:120 },
  { id:'I-12',kind:'medical',    title:'Medical · Ambulance',     ago:'7 minutes ago',   source:'Waze',  where:'ON YONGE ST',                 dist:'2.3km',  x:220, y:380 },
];

const KIND_KEYS = ['accident','collision','fire','hazard','jam','medical','police','weather','construction','tow'];

// ─── Phone & Tablet shells ──────────────────────────────────────────────────
function Phone({ children, dark=false, w=393, h=852 }) {
  return (
    <div style={{
      width:w, height:h, borderRadius:54, overflow:'hidden', position:'relative',
      background: dark ? DA.bgD : DA.paper, color: dark?DA.paper:DA.ink,
      boxShadow:'0 30px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.10)',
      fontFamily:DA.ui,
    }}>
      {/* dynamic island */}
      <div style={{position:'absolute', top:11, left:'50%', transform:'translateX(-50%)', width:120, height:36, borderRadius:24, background:'#000', zIndex:50}}/>
      {/* status bar */}
      <div style={{position:'absolute', top:0, left:0, right:0, zIndex:5, height:54, padding:'0 28px', display:'flex', alignItems:'flex-end', justifyContent:'space-between', paddingBottom:8, color:dark?DA.paper:DA.ink, fontFamily:DA.mono, fontSize:14, fontWeight:600}}>
        <div>9:41</div>
        <div style={{display:'flex', gap:6, alignItems:'center'}}>
          <svg width="18" height="11" viewBox="0 0 18 11"><g fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="0.5"/><rect x="5" y="5" width="3" height="6" rx="0.5"/><rect x="10" y="2" width="3" height="9" rx="0.5"/><rect x="15" y="0" width="3" height="11" rx="0.5"/></g></svg>
          <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M1 4.5a11 11 0 0 1 14 0M3 6.8a8 8 0 0 1 10 0M5.5 9a4.5 4.5 0 0 1 5 0"/></svg>
          <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="22" height="11" rx="2.5" fill="none" stroke="currentColor" strokeOpacity="0.4"/><rect x="2" y="2" width="14" height="8" rx="1" fill="currentColor"/><rect x="23" y="4" width="2" height="4" rx="1" fill="currentColor" opacity="0.4"/></svg>
        </div>
      </div>
      <div style={{height:'100%', paddingTop:54, display:'flex', flexDirection:'column', position:'relative'}}>{children}</div>
      {/* home indicator */}
      <div style={{position:'absolute', bottom:8, left:0, right:0, zIndex:60, display:'flex', justifyContent:'center', pointerEvents:'none'}}>
        <div style={{width:134, height:5, borderRadius:99, background: dark?'rgba(255,255,255,0.55)':'rgba(0,0,0,0.30)'}}/>
      </div>
    </div>
  );
}

function Tablet({ children, dark=false, w=1180, h=820 }) {
  return (
    <div style={{
      width:w, height:h, borderRadius:38, overflow:'hidden', position:'relative',
      background: dark ? DA.bgD : DA.paper, color: dark?DA.paper:DA.ink,
      boxShadow:'0 40px 80px rgba(0,0,0,0.18), 0 0 0 1.5px rgba(0,0,0,0.12)',
      fontFamily:DA.ui, padding:14,
    }}>
      <div style={{
        width:'100%', height:'100%', borderRadius:24, overflow:'hidden', position:'relative',
        background: dark?DA.bgD:DA.paper, border: dark?'1px solid #1A1F28':`1px solid ${DA.line}`,
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── Pulse keyframe (global) ────────────────────────────────────────────────
function GlobalCss(){
  return <style>{`
    @keyframes da-pulse { 0%{box-shadow:0 0 0 0 rgba(255,255,255,0.7)} 100%{box-shadow:0 0 0 8px rgba(255,255,255,0)} }
    @keyframes da-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  `}</style>;
}

// Map markers placement (positions stored per incident as x,y)
function MapMarkers({ incidents, scale=1, active=null, dark=false }){
  return (
    <div style={{position:'absolute', inset:0, zIndex:5, pointerEvents:'none'}}>
      {incidents.map(i=>(
        <div key={i.id} style={{position:'absolute', left:i.x*scale, top:i.y*scale, transform:'translate(-50%,-50%)'}}>
          <Pin kind={i.kind} size={i.id===active?38:32} ring/>
        </div>
      ))}
    </div>
  );
}

// CTA button
function CTA({ children, onClick, tone='primary', icon, style }){
  const tones = {
    primary: { bg:DA.cta,  fg:DA.paper, sh:'0 6px 14px rgba(48,152,242,0.34)' },
    dark:    { bg:DA.ink,  fg:DA.paper, sh:'0 6px 14px rgba(0,0,0,0.20)' },
    ghost:   { bg:'rgba(15,18,24,0.06)', fg:DA.ink, sh:'none' },
  };
  const t = tones[tone];
  return (
    <button onClick={onClick} style={{
      width:'100%', padding:'16px 18px', borderRadius:99, border:'none', cursor:'pointer',
      background:t.bg, color:t.fg, fontFamily:DA.ui, fontSize:16, fontWeight:700,
      display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
      boxShadow:t.sh, ...style,
    }}>
      {icon}{children}
    </button>
  );
}

Object.assign(window, {
  DA, KIND, KIND_KEYS, INCIDENTS,
  Pin, OnlinePill, HeaderBar, Seg, IncidentRow,
  MapLight, MapDark, MapMarkers, Radius, Phone, Tablet, GlobalCss, CTA,
  IcMap, IcSliders, IcChevR, IcChevL, IcChevD, IcClose, IcCheck, IcSearch, IcPlus, IcMinus, IcLayers, IcTarget, IcLoc, IcUser, IcBell, IcCard, IcLogo,
  GlAccident, GlCollision, GlFire, GlHazard, GlJam, GlMedical, GlPolice, GlWeather, GlConstruction, GlTow,
});
