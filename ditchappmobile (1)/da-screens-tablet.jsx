// ─── Tablet screens ─────────────────────────────────────────────────────────
// Landscape split: list rail (left) + big map (right)

function TabletDashboard() {
  const [seg, setSeg] = React.useState('active');
  const [active, setActive] = React.useState('I-1');
  return (
    <Tablet>
      <div style={{display:'flex', height:'100%'}}>
        {/* LEFT — list rail */}
        <div style={{width:380, borderRight:`1px solid ${DA.line}`, display:'flex', flexDirection:'column', background:DA.paper}}>
          <HeaderBar mapToggle={true}/>
          <Seg value={seg} onChange={setSeg} items={[{k:'active', L:'Active'},{k:'all', L:'All'}]}/>
          <div style={{flex:1, overflow:'auto'}}>
            {INCIDENTS.map(i=>(
              <IncidentRow key={i.id} inc={i} active={i.id===active} onClick={()=>setActive(i.id)} compact/>
            ))}
          </div>
        </div>
        {/* RIGHT — map */}
        <div style={{flex:1, position:'relative', overflow:'hidden'}}>
          <MapLight w={760} h={780}/>
          <Radius x={400} y={400} r={220}/>
          {/* scale up incident positions ~1.9x */}
          <div style={{position:'absolute', inset:0, zIndex:5, pointerEvents:'none'}}>
            {INCIDENTS.map(i=>(
              <div key={i.id} style={{position:'absolute', left:i.x*1.9-60, top:i.y*1.0+30, transform:'translate(-50%,-50%)'}}>
                <Pin kind={i.kind} size={i.id===active?40:32} ring/>
              </div>
            ))}
          </div>
          {/* map controls */}
          <div style={{position:'absolute', right:18, top:18, display:'flex', flexDirection:'column', gap:8}}>
            {[IcPlus, IcMinus, IcTarget, IcLayers].map((Ic,i)=>(
              <div key={i} style={{width:44, height:44, borderRadius:'50%', background:DA.paper, border:`1px solid ${DA.line}`, color:DA.ink, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 6px rgba(0,0,0,0.10)'}}>
                <Ic size={20}/>
              </div>
            ))}
          </div>
          {/* timebar */}
          <div style={{position:'absolute', left:18, bottom:18, padding:'8px 14px', borderRadius:12, background:DA.cta, color:DA.paper, fontFamily:DA.ui, fontSize:13, fontWeight:700, boxShadow:'0 4px 10px rgba(48,152,242,0.30)'}}>3 hrs</div>
          {/* legend */}
          <div style={{position:'absolute', right:18, bottom:18, padding:'10px 14px', borderRadius:14, background:DA.paper, border:`1px solid ${DA.line}`, boxShadow:'0 2px 6px rgba(0,0,0,0.08)', display:'flex', gap:12, alignItems:'center'}}>
            <span style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3, fontWeight:600, textTransform:'uppercase', letterSpacing:0.6}}>Traffic</span>
            <span style={{display:'inline-flex', gap:4, alignItems:'center'}}><span style={{width:16, height:4, background:DA.roadFast, borderRadius:2}}/><span style={{fontFamily:DA.ui, fontSize:11, color:DA.ink2}}>Free</span></span>
            <span style={{display:'inline-flex', gap:4, alignItems:'center'}}><span style={{width:16, height:4, background:DA.roadMid, borderRadius:2}}/><span style={{fontFamily:DA.ui, fontSize:11, color:DA.ink2}}>Slow</span></span>
            <span style={{display:'inline-flex', gap:4, alignItems:'center'}}><span style={{width:16, height:4, background:DA.roadStop, borderRadius:2}}/><span style={{fontFamily:DA.ui, fontSize:11, color:DA.ink2}}>Stop</span></span>
          </div>
        </div>
      </div>
    </Tablet>
  );
}

// Tablet · Dark dashboard
function TabletDark() {
  const [active, setActive] = React.useState('I-2');
  return (
    <Tablet dark>
      <div style={{display:'flex', height:'100%', background:DA.bgD}}>
        <div style={{width:380, borderRight:`1px solid ${DA.lineD}`, display:'flex', flexDirection:'column', background:DA.surfD}}>
          <HeaderBar dark/>
          <Seg dark value="active" onChange={()=>{}} items={[{k:'active', L:'Active'},{k:'all', L:'All'}]}/>
          <div style={{flex:1, overflow:'auto'}}>
            {INCIDENTS.map(i=>(
              <IncidentRow key={i.id} inc={i} dark active={i.id===active} onClick={()=>setActive(i.id)} compact/>
            ))}
          </div>
        </div>
        <div style={{flex:1, position:'relative', overflow:'hidden'}}>
          <MapDark w={760} h={780}/>
          <div style={{position:'absolute', inset:0, zIndex:5, pointerEvents:'none'}}>
            {INCIDENTS.map(i=>(
              <div key={i.id} style={{position:'absolute', left:i.x*1.9-60, top:i.y*1.0+30, transform:'translate(-50%,-50%)'}}>
                <Pin kind={i.kind} size={i.id===active?40:32} ring/>
              </div>
            ))}
          </div>
          <div style={{position:'absolute', right:18, top:18, display:'flex', flexDirection:'column', gap:8}}>
            {[IcPlus, IcMinus, IcTarget, IcLayers].map((Ic,i)=>(
              <div key={i} style={{width:44, height:44, borderRadius:'50%', background:DA.surfD2, color:DA.paper, border:'1px solid rgba(255,255,255,0.10)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <Ic size={20}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Tablet>
  );
}

// Tablet · Filters open as side panel
function TabletFilters() {
  return (
    <Tablet>
      <div style={{display:'flex', height:'100%'}}>
        <div style={{width:380, borderRight:`1px solid ${DA.line}`, display:'flex', flexDirection:'column'}}>
          <HeaderBar/>
          <Seg value="active" onChange={()=>{}} items={[{k:'active', L:'Active'},{k:'all', L:'All'}]}/>
          <div style={{flex:1, overflow:'auto', opacity:0.5}}>
            {INCIDENTS.slice(0,5).map(i=>(<IncidentRow key={i.id} inc={i} compact/>))}
          </div>
        </div>
        <div style={{flex:1, position:'relative', overflow:'hidden'}}>
          <MapLight w={760} h={780}/>
          <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.10)'}}/>
          {/* floating filter card */}
          <div style={{position:'absolute', right:24, top:24, bottom:24, width:380, background:DA.paper, borderRadius:20, padding:'22px 24px', boxShadow:'0 14px 40px rgba(0,0,0,0.18)', display:'flex', flexDirection:'column'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
              <h2 style={{margin:0, fontFamily:DA.ui, fontWeight:800, fontSize:22, letterSpacing:-0.4}}>Filters</h2>
              <IcClose size={22}/>
            </div>
            <div style={{fontFamily:DA.ui, fontSize:14, fontWeight:600, marginBottom:12}}>Type of Incidents</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:18}}>
              {KIND_KEYS.slice(0,8).map(k=>(
                <div key={k} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6}}>
                  <Pin kind={k} size={48}/>
                  <span style={{fontFamily:DA.ui, fontSize:11, color:DA.ink2, fontWeight:500}}>{KIND[k].L}</span>
                </div>
              ))}
            </div>
            <div style={{fontFamily:DA.ui, fontSize:14, fontWeight:600, marginBottom:8}}>Radius to Monitor</div>
            <div style={{display:'flex', justifyContent:'space-between', fontFamily:DA.ui, fontSize:11, color:DA.ink3, fontWeight:600, marginBottom:8}}>
              <span>1 KM</span><span>15 KM</span>
            </div>
            <div style={{position:'relative', height:24, display:'flex', alignItems:'center'}}>
              <div style={{height:4, borderRadius:99, background:DA.line, width:'100%'}}/>
              <div style={{position:'absolute', left:0, height:4, borderRadius:99, background:DA.cta, width:'70%'}}/>
              <div style={{position:'absolute', left:'70%', width:20, height:20, borderRadius:'50%', background:DA.paper, border:`3px solid ${DA.cta}`, transform:'translateX(-50%)', boxShadow:'0 2px 6px rgba(0,0,0,0.15)'}}/>
            </div>
            <div style={{textAlign:'center', fontFamily:DA.ui, fontSize:12, color:DA.ink3, marginTop:8}}>11 Kilometers</div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0'}}>
              <span style={{fontFamily:DA.ui, fontSize:14, fontWeight:600}}>Show Traffic</span>
              <div style={{width:42, height:24, borderRadius:99, background:DA.cta, padding:3, display:'flex', justifyContent:'flex-end'}}>
                <span style={{width:18, height:18, borderRadius:'50%', background:DA.paper}}/>
              </div>
            </div>
            <div style={{flex:1}}/>
            <CTA>Apply</CTA>
          </div>
        </div>
      </div>
    </Tablet>
  );
}

// Tablet · Detail with map focus
function TabletDetail() {
  return (
    <Tablet>
      <div style={{display:'flex', height:'100%'}}>
        <div style={{width:380, borderRight:`1px solid ${DA.line}`, display:'flex', flexDirection:'column'}}>
          <HeaderBar/>
          {/* back */}
          <div style={{padding:'10px 14px'}}>
            <span style={{display:'inline-flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:99, background:DA.line2, fontFamily:DA.ui, fontSize:13, fontWeight:600, color:DA.ink}}><IcChevL size={14}/> Back</span>
          </div>
          {/* selected incident card */}
          <div style={{padding:'4px 16px 0'}}>
            <div style={{display:'flex', gap:12, alignItems:'flex-start'}}>
              <Pin kind="collision" size={48}/>
              <div style={{flex:1}}>
                <div style={{fontFamily:DA.ui, fontSize:18, fontWeight:800, lineHeight:1.2}}>Vehicle Collision</div>
                <div style={{fontFamily:DA.ui, fontSize:12, color:DA.ink3, fontStyle:'italic', marginTop:2}}>3 minutes ago · Waze · @TowDriver_Greg</div>
              </div>
            </div>
            <div style={{padding:'14px 0', borderTop:`1px solid ${DA.line2}`, marginTop:14}}>
              <div style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3, fontWeight:600, letterSpacing:0.6, textTransform:'uppercase', marginBottom:4}}>Location</div>
              <div style={{fontFamily:DA.ui, fontSize:13, fontWeight:600, color:DA.ink, textTransform:'uppercase', letterSpacing:0.5}}>ON DUNDAS ST W IN MISSISSAUGA</div>
              <div style={{fontFamily:DA.ui, fontSize:13, color:DA.ink2, marginTop:2}}>43.589° N · 79.644° W</div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, padding:'4px 0 16px', borderTop:`1px solid ${DA.line2}`}}>
              <div style={{padding:'12px 14px', background:DA.line2, borderRadius:14}}>
                <div style={{fontFamily:DA.ui, fontSize:10, color:DA.ink3, fontWeight:600, letterSpacing:0.6, textTransform:'uppercase'}}>Distance</div>
                <div style={{fontFamily:DA.ui, fontSize:22, fontWeight:800, color:DA.ink, marginTop:2}}>4.1<span style={{fontSize:13, color:DA.ink3, marginLeft:2}}>km</span></div>
              </div>
              <div style={{padding:'12px 14px', background:DA.line2, borderRadius:14}}>
                <div style={{fontFamily:DA.ui, fontSize:10, color:DA.ink3, fontWeight:600, letterSpacing:0.6, textTransform:'uppercase'}}>ETA</div>
                <div style={{fontFamily:DA.ui, fontSize:22, fontWeight:800, color:DA.ink, marginTop:2}}>6<span style={{fontSize:13, color:DA.ink3, marginLeft:2}}>min</span></div>
              </div>
            </div>
            <div style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3, fontWeight:600, letterSpacing:0.6, textTransform:'uppercase', marginBottom:8}}>Timeline</div>
            {[['9:38','Reported by motorist'],['9:39','TomTom confirmed'],['9:41','Dispatched to T-08']].map(([t,l],i,arr)=>(
              <div key={i} style={{display:'flex', gap:10, alignItems:'flex-start'}}>
                <div style={{width:48, fontFamily:DA.mono, fontSize:11, color:DA.ink3, paddingTop:6}}>{t}</div>
                <div style={{position:'relative', width:14, paddingTop:8}}>
                  <span style={{position:'absolute', top:8, left:5, width:5, height:5, borderRadius:'50%', background: i===arr.length-1?DA.cta:DA.ink4}}/>
                  {i<arr.length-1 && <span style={{position:'absolute', top:14, left:6.5, width:1, bottom:-4, background:DA.line}}/>}
                </div>
                <div style={{flex:1, padding:'4px 0 12px', fontFamily:DA.ui, fontSize:13}}>{l}</div>
              </div>
            ))}
            <div style={{padding:'10px 0'}}>
              <CTA>Start Navigation</CTA>
            </div>
          </div>
        </div>
        <div style={{flex:1, position:'relative', overflow:'hidden'}}>
          <MapLight w={760} h={780}/>
          {/* route overlay */}
          <svg style={{position:'absolute', inset:0}} viewBox="0 0 760 780">
            <path d="M120 600 C 220 500, 280 460, 360 400 S 480 280, 540 220" stroke={DA.cta} strokeWidth="6" fill="none" strokeLinecap="round"/>
            <path d="M120 600 C 220 500, 280 460, 360 400 S 480 280, 540 220" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="3 8"/>
          </svg>
          <div style={{position:'absolute', left:120, top:600, transform:'translate(-50%,-50%)', width:36, height:36, borderRadius:'50%', background:DA.ink, color:DA.paper, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 4px rgba(48,152,242,0.30)'}}>
            <IcLoc size={18}/>
          </div>
          <div style={{position:'absolute', left:540, top:220, transform:'translate(-50%,-50%)'}}>
            <Pin kind="collision" size={48} ring/>
          </div>
          <div style={{position:'absolute', right:18, top:18, padding:'8px 14px', borderRadius:99, background:DA.paper, border:`1px solid ${DA.line}`, fontFamily:DA.ui, fontSize:12, fontWeight:700, color:DA.ink, display:'inline-flex', alignItems:'center', gap:6, boxShadow:'0 2px 6px rgba(0,0,0,0.08)'}}>
            <span style={{width:6, height:6, borderRadius:'50%', background:DA.cta}}/> 4.1 KM · 6 MIN
          </div>
        </div>
      </div>
    </Tablet>
  );
}

window.TabletDashboard = TabletDashboard;
window.TabletDark = TabletDark;
window.TabletFilters = TabletFilters;
window.TabletDetail = TabletDetail;
