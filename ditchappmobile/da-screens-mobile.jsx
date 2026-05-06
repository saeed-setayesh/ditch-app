// ─── Mobile screens ─────────────────────────────────────────────────────────

// 1. Mobile · List view (light) — Incidenta-style
function MobileList() {
  const [seg, setSeg] = React.useState('active');
  return (
    <Phone>
      <HeaderBar/>
      <Seg value={seg} onChange={setSeg} items={[{k:'active', L:'Active'},{k:'all', L:'All'}]}/>
      <div style={{flex:1, overflow:'auto', paddingBottom:24}}>
        {INCIDENTS.slice(0,8).map(i=>(<IncidentRow key={i.id} inc={i}/>))}
      </div>
    </Phone>
  );
}

// 2. Mobile · Map view (light) with radius
function MobileMap() {
  return (
    <Phone>
      <div style={{position:'absolute', inset:0, top:0}}>
        <MapLight w={393} h={852}/>
        <Radius x={196} y={460} r={150}/>
        <MapMarkers incidents={INCIDENTS}/>
      </div>
      <div style={{position:'relative', zIndex:10}}>
        <HeaderBar/>
      </div>
      {/* timebar pill bottom left */}
      <div style={{position:'absolute', left:14, bottom:30, zIndex:11, padding:'7px 12px', borderRadius:10, background:DA.cta, color:DA.paper, fontFamily:DA.ui, fontSize:12, fontWeight:700, boxShadow:'0 4px 10px rgba(48,152,242,0.3)'}}>3 hrs</div>
    </Phone>
  );
}

// 3. Mobile · Filters modal
function MobileFilters() {
  return (
    <Phone>
      {/* dim map underneath */}
      <div style={{position:'absolute', inset:0}}>
        <MapLight w={393} h={852}/>
        <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.10)'}}/>
      </div>
      {/* filter sheet */}
      <div style={{position:'absolute', left:0, right:0, bottom:0, top:120, background:DA.paper, borderRadius:'24px 24px 0 0', padding:'20px 22px 28px', boxShadow:'0 -10px 30px rgba(0,0,0,0.12)', zIndex:10, display:'flex', flexDirection:'column'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
          <h2 style={{margin:0, fontFamily:DA.ui, fontWeight:800, fontSize:24, letterSpacing:-0.4}}>Filters</h2>
          <IcClose size={22}/>
        </div>
        <div style={{fontFamily:DA.ui, fontSize:14, fontWeight:600, color:DA.ink, marginBottom:12}}>Type of Incidents</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:18}}>
          {KIND_KEYS.slice(0,8).map(k=>(
            <div key={k} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6}}>
              <Pin kind={k} size={48}/>
              <span style={{fontFamily:DA.ui, fontSize:11, color:DA.ink2, fontWeight:500}}>{KIND[k].L}</span>
            </div>
          ))}
        </div>
        <div style={{fontFamily:DA.ui, fontSize:14, fontWeight:600, color:DA.ink, marginBottom:8}}>Radius to Monitor</div>
        <div style={{padding:'4px 6px'}}>
          <div style={{display:'flex', justifyContent:'space-between', fontFamily:DA.ui, fontSize:11, color:DA.ink3, fontWeight:600, marginBottom:8}}>
            <span>1 KM</span><span>15 KM</span>
          </div>
          <div style={{position:'relative', height:24, display:'flex', alignItems:'center'}}>
            <div style={{height:4, borderRadius:99, background:DA.line, width:'100%'}}/>
            <div style={{position:'absolute', left:0, height:4, borderRadius:99, background:DA.cta, width:'88%'}}/>
            <div style={{position:'absolute', left:'88%', width:20, height:20, borderRadius:'50%', background:DA.paper, border:`3px solid ${DA.cta}`, transform:'translateX(-50%)', boxShadow:'0 2px 6px rgba(0,0,0,0.15)'}}/>
          </div>
          <div style={{textAlign:'center', fontFamily:DA.ui, fontSize:12, color:DA.ink3, marginTop:8}}>15 Kilometers</div>
        </div>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 4px', marginTop:6}}>
          <span style={{fontFamily:DA.ui, fontSize:14, fontWeight:600}}>Show Traffic</span>
          <div style={{width:42, height:24, borderRadius:99, background:DA.cta, padding:3, display:'flex', justifyContent:'flex-end'}}>
            <span style={{width:18, height:18, borderRadius:'50%', background:DA.paper}}/>
          </div>
        </div>
        <div style={{flex:1}}/>
        <CTA>Apply</CTA>
      </div>
    </Phone>
  );
}

// 4. Mobile · Incident detail (dark map)
function MobileDetail() {
  return (
    <Phone dark>
      <div style={{position:'absolute', inset:0}}>
        <MapDark w={393} h={852}/>
        <div style={{position:'absolute', left:196, top:380, transform:'translate(-50%,-50%)'}}>
          <Pin kind="hazard" size={42} ring/>
        </div>
      </div>
      <div style={{position:'relative', zIndex:10}}>
        <HeaderBar dark/>
      </div>
      <div style={{position:'absolute', left:14, bottom:230, zIndex:10, padding:'9px 16px', borderRadius:99, background:'rgba(255,255,255,0.10)', backdropFilter:'blur(20px)', color:DA.paper, display:'inline-flex', alignItems:'center', gap:6, fontFamily:DA.ui, fontWeight:600, fontSize:14, border:'1px solid rgba(255,255,255,0.14)'}}>
        <IcChevL size={16}/> Back
      </div>
      {/* bottom card */}
      <div style={{position:'absolute', left:12, right:12, bottom:30, zIndex:10, padding:'14px 16px 16px', borderRadius:18, background:'rgba(255,255,255,0.06)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.10)', color:DA.paper}}>
        <div style={{display:'flex', justifyContent:'center', marginBottom:10}}>
          <div style={{width:34, height:4, borderRadius:99, background:'rgba(255,255,255,0.22)'}}/>
        </div>
        <div style={{display:'flex', gap:12, alignItems:'flex-start'}}>
          <Pin kind="hazard" size={36}/>
          <div style={{flex:1}}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <div style={{fontFamily:DA.ui, fontSize:15, fontWeight:700, lineHeight:1.2}}>Hazard On Road<br/>Pot Hole</div>
              <div style={{fontFamily:DA.ui, fontSize:11, color:'rgba(255,255,255,0.7)', textAlign:'right', fontStyle:'italic'}}>Waze<br/>@CindySwatton2016</div>
            </div>
            <div style={{fontFamily:DA.ui, fontSize:12, color:'rgba(255,255,255,0.65)', fontStyle:'italic', marginTop:2}}>1 minute ago</div>
          </div>
        </div>
        <div style={{display:'flex', justifyContent:'space-between', marginTop:12, padding:'10px 0', borderTop:'1px solid rgba(255,255,255,0.08)'}}>
          <span style={{fontFamily:DA.ui, fontSize:12, fontWeight:600, letterSpacing:0.4, textTransform:'uppercase'}}>ON HWY 400 N IN BRADFORD WEST GWILLIMBURY</span>
          <span style={{fontFamily:DA.ui, fontSize:13, fontWeight:700, flex:'0 0 auto', marginLeft:8}}>16.3KM</span>
        </div>
        <CTA>Start</CTA>
      </div>
    </Phone>
  );
}

// 5. Mobile · Dark list
function MobileListDark() {
  const [seg, setSeg] = React.useState('active');
  return (
    <Phone dark>
      <HeaderBar dark/>
      <Seg dark value={seg} onChange={setSeg} items={[{k:'active', L:'Active'},{k:'all', L:'All'}]}/>
      <div style={{flex:1, overflow:'auto', paddingBottom:24}}>
        {INCIDENTS.slice(0,8).map(i=>(<IncidentRow key={i.id} inc={i} dark/>))}
      </div>
    </Phone>
  );
}

// 6. Mobile · Account
function MobileAccount() {
  return (
    <Phone>
      <div style={{padding:'14px 22px 6px', display:'flex', alignItems:'center'}}>
        <IcChevL size={22}/>
      </div>
      <div style={{padding:'10px 22px 0'}}>
        <h1 style={{margin:0, fontFamily:DA.ui, fontWeight:800, fontSize:34, letterSpacing:-0.6}}>Account Settings</h1>
        <div style={{marginTop:18}}>
          <CTA>Manage Subscription</CTA>
          <div style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3, textAlign:'center', marginTop:8, lineHeight:1.5}}>Update payment method, change subscription, see invoice<br/>history, update billing information, and more.</div>
        </div>
        <div style={{marginTop:22, borderTop:`1px solid ${DA.line}`}}>
          {[['Location','Network',IcLoc],['Map Application','Default',IcLoc],['Display','Light',IcBell]].map(([l,v,Ic])=>(
            <div key={l} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 4px', borderBottom:`1px solid ${DA.line}`}}>
              <div style={{display:'flex', alignItems:'center', gap:10, fontFamily:DA.ui, fontSize:14, color:DA.ink}}>
                <Ic size={16}/>{l}
              </div>
              <div style={{display:'flex', alignItems:'center', gap:5, fontFamily:DA.ui, fontSize:14, color:DA.ink2, fontWeight:500}}>
                {v} <IcChevD size={14}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:18, display:'flex', flexDirection:'column', gap:10}}>
          {['Tour guide','Change password','Logout'].map(l=>(<div key={l} style={{fontFamily:DA.ui, fontSize:14, color:DA.cta, fontWeight:600}}>{l}</div>))}
        </div>
      </div>
    </Phone>
  );
}

window.MobileList = MobileList;
window.MobileMap = MobileMap;
window.MobileFilters = MobileFilters;
window.MobileDetail = MobileDetail;
window.MobileListDark = MobileListDark;
window.MobileAccount = MobileAccount;
