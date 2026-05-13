// ─── Company / Dispatcher (B2B) screens — desktop tablet 1180×820 ──────────

// Sidebar
function CoSide({ sel='dispatch' }) {
  const items = [
    {k:'dispatch', L:'Dispatch',  Ic:IcMap},
    {k:'fleet',    L:'Fleet',     Ic:IcLoc},
    {k:'jobs',     L:'Jobs',      Ic:IcCheck},
    {k:'drivers',  L:'Drivers',   Ic:IcUser},
    {k:'billing',  L:'Billing',   Ic:IcCard},
    {k:'reports',  L:'Reports',   Ic:IcLayers},
    {k:'settings', L:'Settings',  Ic:IcSliders},
  ];
  return (
    <div style={{width:220, height:'100%', background:DA.ink, color:DA.paper, display:'flex', flexDirection:'column', padding:'18px 14px'}}>
      <div style={{display:'flex', alignItems:'center', gap:8, padding:'4px 6px 16px'}}>
        <div style={{width:30, height:30, borderRadius:9, background:DA.sky, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <IcLogo size={18}/>
        </div>
        <div style={{lineHeight:1.1}}>
          <div style={{fontFamily:DA.ui, fontSize:14, fontWeight:800}}>DitchApp</div>
          <div style={{fontFamily:DA.ui, fontSize:10, color:'rgba(255,255,255,0.55)', fontWeight:600, letterSpacing:0.6, textTransform:'uppercase'}}>Operator hub</div>
        </div>
      </div>
      <div style={{padding:'10px 8px', borderRadius:10, background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:10, marginBottom:14}}>
        <div style={{width:30, height:30, borderRadius:8, background:DA.sky, color:DA.paper, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:DA.ui, fontWeight:800, fontSize:13}}>NT</div>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontFamily:DA.ui, fontSize:12, fontWeight:700}}>Northland Towing</div>
          <div style={{fontFamily:DA.ui, fontSize:10, color:'rgba(255,255,255,0.55)'}}>GTA West · 14 trucks</div>
        </div>
        <IcChevD size={14}/>
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:2}}>
        {items.map(it=>{
          const a = it.k===sel;
          return (
            <div key={it.k} style={{padding:'9px 12px', borderRadius:10, background: a?'rgba(63,167,230,0.18)':'transparent', color: a?DA.paper:'rgba(255,255,255,0.65)', display:'flex', alignItems:'center', gap:10, fontFamily:DA.ui, fontSize:13, fontWeight:600, cursor:'pointer', borderLeft: a?`3px solid ${DA.sky}`:'3px solid transparent'}}>
              <it.Ic size={16}/>{it.L}
            </div>
          );
        })}
      </div>
      <div style={{flex:1}}/>
      <div style={{padding:'12px 10px', borderRadius:12, background:'rgba(255,255,255,0.06)', fontFamily:DA.ui, fontSize:11, color:'rgba(255,255,255,0.7)'}}>
        <div style={{fontWeight:700, color:DA.paper, marginBottom:2}}>Pro plan · $189/mo</div>
        Unlimited dispatches across 14 trucks · renews May 28
      </div>
    </div>
  );
}

function CoTopbar({ title, sub, action }) {
  return (
    <div style={{padding:'18px 26px', display:'flex', alignItems:'center', gap:14, borderBottom:`1px solid ${DA.line2}`, background:DA.paper}}>
      <div style={{flex:1}}>
        <div style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3, fontWeight:700, letterSpacing:0.8, textTransform:'uppercase'}}>{sub}</div>
        <h1 style={{margin:'2px 0 0', fontFamily:DA.ui, fontSize:24, fontWeight:800, color:DA.ink, letterSpacing:-0.4}}>{title}</h1>
      </div>
      <div style={{height:42, padding:'0 14px', borderRadius:12, background:DA.bg, border:`1px solid ${DA.line}`, display:'flex', alignItems:'center', gap:8, width:280}}>
        <IcSearch size={16}/>
        <span style={{flex:1, fontFamily:DA.ui, fontSize:13, color:DA.ink3}}>Search jobs, drivers, plates…</span>
      </div>
      {action}
      <div style={{width:42, height:42, borderRadius:'50%', background:DA.bg, border:`1px solid ${DA.line}`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative'}}>
        <IcBell size={18}/>
        <span style={{position:'absolute', top:8, right:9, width:8, height:8, borderRadius:'50%', background:'#E63946', border:`2px solid ${DA.bg}`}}/>
      </div>
    </div>
  );
}

// 1) Company · Dispatch (live ops)
function CoDispatch() {
  return (
    <Tablet w={1180} h={820}>
      <div style={{display:'flex', height:'100%', background:DA.bg}}>
        <CoSide sel="dispatch"/>
        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
          <CoTopbar sub="Live operations" title="Dispatch board"
            action={<button style={{padding:'10px 16px', borderRadius:12, background:DA.deep, color:DA.paper, fontFamily:DA.ui, fontSize:13, fontWeight:700, border:'none', display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer'}}><IcPlus size={14}/> New manual job</button>}/>
          {/* KPI strip */}
          <div style={{padding:'14px 26px 0', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12}}>
            {[
              ['Live incidents','27','+3 last hr','#E63946'],
              ['Active jobs','9','of 14 trucks',DA.deep],
              ['Avg ETA','7m 12s','-1m vs avg',DA.on],
              ['Today revenue','$4,820','12 jobs',DA.sky],
            ].map(([l,v,sub,c])=>(
              <div key={l} style={{padding:'14px 16px', borderRadius:14, background:DA.paper, border:`1px solid ${DA.line2}`}}>
                <div style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3, fontWeight:700, letterSpacing:0.6, textTransform:'uppercase'}}>{l}</div>
                <div style={{display:'flex', alignItems:'baseline', gap:8, marginTop:4}}>
                  <div style={{fontFamily:DA.ui, fontSize:24, fontWeight:800, color:DA.ink}}>{v}</div>
                  <div style={{fontFamily:DA.ui, fontSize:11, color:c, fontWeight:600}}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
          {/* main split */}
          <div style={{flex:1, display:'grid', gridTemplateColumns:'1fr 360px', gap:14, padding:14, overflow:'hidden'}}>
            {/* live map */}
            <div style={{borderRadius:16, overflow:'hidden', position:'relative', background:DA.paper, border:`1px solid ${DA.line2}`}}>
              <MapLight w={580} h={500}/>
              <Radius x={290} y={220} r={170}/>
              {/* incident pins */}
              <div style={{position:'absolute', inset:0, pointerEvents:'none'}}>
                {INCIDENTS.slice(0,8).map((i,idx)=>(
                  <div key={i.id} style={{position:'absolute', left:90+idx*55, top:120+(idx%3)*100, transform:'translate(-50%,-50%)'}}>
                    <Pin kind={i.kind} size={28} ring/>
                  </div>
                ))}
                {/* trucks */}
                {[[180,260,'T-04'],[400,180,'T-08'],[300,360,'T-11']].map(([x,y,c])=>(
                  <div key={c} style={{position:'absolute', left:x, top:y, transform:'translate(-50%,-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:3}}>
                    <div style={{width:30, height:30, borderRadius:9, background:DA.ink, color:DA.paper, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 0 3px ${DA.paper}, 0 0 0 5px rgba(63,167,230,0.4)`}}><GlTow size={16}/></div>
                    <span style={{padding:'1px 6px', borderRadius:5, background:DA.paper, fontFamily:DA.mono, fontSize:9, color:DA.ink, fontWeight:700, border:`1px solid ${DA.line}`}}>{c}</span>
                  </div>
                ))}
              </div>
              <div style={{position:'absolute', top:14, left:14, padding:'7px 12px', borderRadius:10, background:DA.paper, border:`1px solid ${DA.line}`, fontFamily:DA.ui, fontSize:12, fontWeight:700, color:DA.ink, boxShadow:'0 2px 6px rgba(0,0,0,0.06)'}}>
                <span style={{display:'inline-flex', alignItems:'center', gap:6}}><span style={{width:8, height:8, borderRadius:'50%', background:DA.on}}/> 14 trucks · 9 active</span>
              </div>
              <div style={{position:'absolute', right:14, top:14, display:'flex', flexDirection:'column', gap:6}}>
                {[IcPlus, IcMinus, IcLayers].map((Ic,i)=>(
                  <div key={i} style={{width:36, height:36, borderRadius:10, background:DA.paper, border:`1px solid ${DA.line}`, color:DA.ink, display:'flex', alignItems:'center', justifyContent:'center'}}><Ic size={16}/></div>
                ))}
              </div>
            </div>
            {/* queue rail */}
            <div style={{borderRadius:16, background:DA.paper, border:`1px solid ${DA.line2}`, overflow:'hidden', display:'flex', flexDirection:'column'}}>
              <div style={{padding:'14px 16px', borderBottom:`1px solid ${DA.line2}`, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <div>
                  <div style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3, fontWeight:700, letterSpacing:0.6, textTransform:'uppercase'}}>Open queue</div>
                  <div style={{fontFamily:DA.ui, fontSize:16, fontWeight:800, color:DA.ink}}>5 unassigned</div>
                </div>
                <span style={{padding:'4px 8px', borderRadius:6, background:DA.ice, color:DA.deep, fontFamily:DA.mono, fontSize:11, fontWeight:700}}>AUTO</span>
              </div>
              <div style={{flex:1, overflow:'auto'}}>
                {[
                  {k:'collision',t:'Vehicle Collision',w:'401 EB · exit 366',d:'9.2 km',a:'2 min',sla:'on'},
                  {k:'accident',t:'Accident · minor',w:'QEW W · Cawthra',d:'4.1 km',a:'5 min',sla:'on'},
                  {k:'hazard',t:'Pothole · shoulder',w:'Hwy 400 N',d:'13.8 km',a:'12 min',sla:'warn'},
                  {k:'jam',t:'Jam · stopped traffic',w:'401 collector E',d:'7.4 km',a:'14 min',sla:'on'},
                  {k:'fire',t:'Vehicle fire',w:'QEW W · Oakville',d:'18 km',a:'17 min',sla:'late'},
                ].map((j,i)=>(
                  <div key={i} style={{padding:'12px 16px', borderBottom:`1px solid ${DA.line2}`, display:'flex', gap:10, cursor:'pointer'}}>
                    <Pin kind={j.k} size={32}/>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{display:'flex', justifyContent:'space-between', gap:6}}>
                        <span style={{fontFamily:DA.ui, fontSize:13, fontWeight:700, color:DA.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{j.t}</span>
                        <span style={{fontFamily:DA.mono, fontSize:11, color:DA.ink3}}>{j.a}</span>
                      </div>
                      <div style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3, textTransform:'uppercase', letterSpacing:0.5, fontWeight:600, marginTop:1}}>{j.w}</div>
                      <div style={{display:'flex', justifyContent:'space-between', marginTop:6, alignItems:'center'}}>
                        <span style={{padding:'2px 7px', borderRadius:5, fontFamily:DA.mono, fontSize:10, fontWeight:700, letterSpacing:0.5,
                          background: j.sla==='late'?'rgba(230,57,70,0.10)':j.sla==='warn'?'rgba(244,196,48,0.18)':'rgba(31,203,107,0.10)',
                          color:      j.sla==='late'?'#E63946':j.sla==='warn'?'#A88200':DA.on}}>SLA {j.sla.toUpperCase()}</span>
                        <span style={{fontFamily:DA.ui, fontSize:12, fontWeight:700, color:DA.ink}}>{j.d}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Tablet>
  );
}

// 2) Company · Fleet
function CoFleet() {
  const trucks = [
    {id:'T-04',driver:'Marc R.',status:'En route',job:'Collision · 401 EB',eta:'4 min',speed:'88 km/h',fuel:78,plate:'CMV 4029'},
    {id:'T-08',driver:'Aisha K.',status:'On scene',job:'Hazard · QEW W',eta:'—',speed:'0',fuel:62,plate:'CMV 8814'},
    {id:'T-11',driver:'Greg T.',status:'Returning',job:'Drop-off · yard',eta:'18 min',speed:'72 km/h',fuel:34,plate:'CMV 1106'},
    {id:'T-02',driver:'Priya S.',status:'Idle',job:'—',eta:'—',speed:'0',fuel:91,plate:'CMV 2247'},
    {id:'T-07',driver:'Dan W.',status:'Off shift',job:'—',eta:'—',speed:'—',fuel:55,plate:'CMV 7708'},
    {id:'T-13',driver:'Lina M.',status:'En route',job:'Jam assist · 401 collector',eta:'9 min',speed:'64 km/h',fuel:48,plate:'CMV 1334'},
  ];
  const stCol = (s)=> s==='En route'?DA.deep : s==='On scene'?'#E63946' : s==='Returning'?DA.sky : s==='Idle'?DA.on : DA.ink3;
  return (
    <Tablet w={1180} h={820}>
      <div style={{display:'flex', height:'100%', background:DA.bg}}>
        <CoSide sel="fleet"/>
        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
          <CoTopbar sub="Fleet" title="Trucks · 14"
            action={<button style={{padding:'10px 16px', borderRadius:12, background:DA.paper, border:`1px solid ${DA.line}`, color:DA.ink, fontFamily:DA.ui, fontSize:13, fontWeight:700, cursor:'pointer'}}>Export CSV</button>}/>
          {/* segmented status row */}
          <div style={{padding:'14px 26px 0', display:'flex', gap:8, flexWrap:'wrap'}}>
            {[['All','14',true],['En route','3'],['On scene','2'],['Returning','1'],['Idle','3'],['Off shift','5'],['Maintenance','0']].map(([l,c,sel])=>(
              <span key={l} style={{padding:'7px 14px', borderRadius:99, fontFamily:DA.ui, fontSize:13, fontWeight:700, background: sel?DA.ink:DA.paper, color: sel?DA.paper:DA.ink, border:sel?'none':`1px solid ${DA.line}`, display:'inline-flex', gap:6}}>
                {l}<span style={{fontFamily:DA.mono, fontSize:10, opacity:0.7}}>{c}</span>
              </span>
            ))}
          </div>
          {/* table */}
          <div style={{padding:14, flex:1, overflow:'hidden'}}>
            <div style={{height:'100%', borderRadius:16, background:DA.paper, border:`1px solid ${DA.line2}`, overflow:'hidden', display:'flex', flexDirection:'column'}}>
              <div style={{display:'grid', gridTemplateColumns:'90px 1fr 130px 1.2fr 90px 90px 110px 30px', gap:12, padding:'12px 18px', background:DA.bg, borderBottom:`1px solid ${DA.line2}`, fontFamily:DA.ui, fontSize:10, fontWeight:700, color:DA.ink3, letterSpacing:0.7, textTransform:'uppercase'}}>
                <span>Truck</span><span>Driver</span><span>Status</span><span>Current job</span><span>ETA</span><span>Speed</span><span>Fuel</span><span/>
              </div>
              <div style={{flex:1, overflow:'auto'}}>
                {trucks.map((t,i)=>(
                  <div key={t.id} style={{display:'grid', gridTemplateColumns:'90px 1fr 130px 1.2fr 90px 90px 110px 30px', gap:12, padding:'14px 18px', borderBottom:`1px solid ${DA.line2}`, alignItems:'center'}}>
                    <span style={{fontFamily:DA.mono, fontSize:13, fontWeight:700, color:DA.ink}}>{t.id}</span>
                    <span style={{display:'flex', alignItems:'center', gap:10}}>
                      <span style={{width:30, height:30, borderRadius:'50%', background:DA.ice, color:DA.deep, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:DA.ui, fontWeight:800, fontSize:12}}>{t.driver[0]}</span>
                      <span style={{display:'flex', flexDirection:'column'}}>
                        <span style={{fontFamily:DA.ui, fontSize:13, fontWeight:600, color:DA.ink}}>{t.driver}</span>
                        <span style={{fontFamily:DA.mono, fontSize:10, color:DA.ink3}}>{t.plate}</span>
                      </span>
                    </span>
                    <span style={{display:'inline-flex', alignItems:'center', gap:6, fontFamily:DA.ui, fontSize:12, fontWeight:700, color:stCol(t.status)}}>
                      <span style={{width:7, height:7, borderRadius:'50%', background:stCol(t.status)}}/>{t.status}
                    </span>
                    <span style={{fontFamily:DA.ui, fontSize:13, color:DA.ink2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{t.job}</span>
                    <span style={{fontFamily:DA.mono, fontSize:13, color:DA.ink, fontWeight:600}}>{t.eta}</span>
                    <span style={{fontFamily:DA.mono, fontSize:12, color:DA.ink2}}>{t.speed}</span>
                    <span style={{display:'flex', alignItems:'center', gap:8}}>
                      <span style={{flex:1, height:6, borderRadius:99, background:DA.line2, overflow:'hidden'}}>
                        <span style={{display:'block', width:t.fuel+'%', height:'100%', borderRadius:99, background: t.fuel<40?'#E63946':t.fuel<60?DA.sky:DA.on}}/>
                      </span>
                      <span style={{fontFamily:DA.mono, fontSize:11, color:DA.ink2, width:24, textAlign:'right'}}>{t.fuel}</span>
                    </span>
                    <IcChevR size={16}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Tablet>
  );
}

// 3) Company · Drivers
function CoDrivers() {
  const ds = [
    {n:'Marc Rinaldi',     id:'D-04',shift:'Day · 7a-7p',jobs:142,rating:4.9,trust:96,status:'Active',cert:['CDL-A','HazMat']},
    {n:'Aisha Khan',       id:'D-08',shift:'Day · 7a-7p',jobs:118,rating:4.8,trust:92,status:'Active',cert:['CDL-A']},
    {n:'Greg Thompson',    id:'D-11',shift:'Day · 7a-7p',jobs:97 ,rating:4.6,trust:88,status:'Active',cert:['CDL-A','Air-brake']},
    {n:'Priya Sharma',     id:'D-02',shift:'Night · 7p-7a',jobs:166,rating:4.9,trust:97,status:'Active',cert:['CDL-A','HazMat','Heavy']},
    {n:'Dan Wojcik',       id:'D-07',shift:'Off',         jobs:84 ,rating:4.4,trust:79,status:'Off shift',cert:['CDL-A']},
    {n:'Lina Mendez',      id:'D-13',shift:'Day · 7a-7p',jobs:54 ,rating:4.7,trust:90,status:'Active',cert:['CDL-A']},
  ];
  return (
    <Tablet w={1180} h={820}>
      <div style={{display:'flex', height:'100%', background:DA.bg}}>
        <CoSide sel="drivers"/>
        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
          <CoTopbar sub="Roster" title="Drivers · 14"
            action={<button style={{padding:'10px 16px', borderRadius:12, background:DA.deep, color:DA.paper, border:'none', fontFamily:DA.ui, fontSize:13, fontWeight:700, cursor:'pointer', display:'inline-flex', gap:6, alignItems:'center'}}><IcPlus size={14}/> Invite driver</button>}/>
          {/* grid of cards */}
          <div style={{padding:14, flex:1, overflow:'auto'}}>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12}}>
              {ds.map(d=>(
                <div key={d.id} style={{padding:'16px', borderRadius:16, background:DA.paper, border:`1px solid ${DA.line2}`, display:'flex', flexDirection:'column', gap:10}}>
                  <div style={{display:'flex', alignItems:'center', gap:12}}>
                    <div style={{width:46, height:46, borderRadius:'50%', background:DA.deep, color:DA.paper, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:DA.ui, fontWeight:800, fontSize:16}}>{d.n.split(' ').map(s=>s[0]).join('')}</div>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontFamily:DA.ui, fontSize:14, fontWeight:700, color:DA.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{d.n}</div>
                      <div style={{fontFamily:DA.mono, fontSize:11, color:DA.ink3}}>{d.id} · {d.shift}</div>
                    </div>
                    <span style={{padding:'3px 8px', borderRadius:6, fontFamily:DA.mono, fontSize:10, fontWeight:700, letterSpacing:0.6, textTransform:'uppercase',
                      background: d.status==='Active'?'rgba(31,203,107,0.10)':DA.line2,
                      color: d.status==='Active'?DA.on:DA.ink3}}>{d.status}</span>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8}}>
                    {[['Jobs',d.jobs],['Rating',d.rating.toFixed(1)+'★'],['Trust',d.trust+'%']].map(([l,v])=>(
                      <div key={l} style={{padding:'10px', borderRadius:10, background:DA.bg, textAlign:'center'}}>
                        <div style={{fontFamily:DA.ui, fontSize:9, color:DA.ink3, fontWeight:700, letterSpacing:0.6, textTransform:'uppercase'}}>{l}</div>
                        <div style={{fontFamily:DA.ui, fontSize:16, fontWeight:800, color:DA.ink, marginTop:1}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex', flexWrap:'wrap', gap:5}}>
                    {d.cert.map(c=>(
                      <span key={c} style={{padding:'3px 8px', borderRadius:5, background:DA.ice, color:DA.deep, fontFamily:DA.mono, fontSize:10, fontWeight:700, letterSpacing:0.4}}>{c}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Tablet>
  );
}

// 4) Company · Reports / Analytics
function CoReports() {
  // bar chart data
  const days = [['M',12,3],['T',18,5],['W',14,4],['T',22,6],['F',28,8],['S',31,9],['S',24,7]];
  const max = 32;
  return (
    <Tablet w={1180} h={820}>
      <div style={{display:'flex', height:'100%', background:DA.bg}}>
        <CoSide sel="reports"/>
        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
          <CoTopbar sub="Performance" title="Reports · this week"
            action={<span style={{padding:'8px 14px', borderRadius:10, background:DA.paper, border:`1px solid ${DA.line}`, fontFamily:DA.ui, fontSize:12, fontWeight:600, color:DA.ink, display:'inline-flex', gap:6, alignItems:'center'}}>May 6 – May 12 <IcChevD size={13}/></span>}/>
          <div style={{padding:'14px 26px 0', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12}}>
            {[
              ['Total jobs','149','+12% vs last wk',DA.on],
              ['Revenue','$32,840','+8.2%',DA.on],
              ['Avg response','6m 48s','-22s',DA.on],
              ['Verified rate','87%','-3pp this wk','#E63946'],
            ].map(([l,v,sub,c])=>(
              <div key={l} style={{padding:'14px 16px', borderRadius:14, background:DA.paper, border:`1px solid ${DA.line2}`}}>
                <div style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3, fontWeight:700, letterSpacing:0.6, textTransform:'uppercase'}}>{l}</div>
                <div style={{display:'flex', alignItems:'baseline', gap:8, marginTop:4}}>
                  <div style={{fontFamily:DA.ui, fontSize:24, fontWeight:800, color:DA.ink}}>{v}</div>
                  <div style={{fontFamily:DA.ui, fontSize:11, color:c, fontWeight:600}}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{padding:14, flex:1, display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:12, overflow:'hidden'}}>
            {/* Chart */}
            <div style={{padding:'18px 22px', borderRadius:16, background:DA.paper, border:`1px solid ${DA.line2}`, display:'flex', flexDirection:'column'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
                <div>
                  <div style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3, fontWeight:700, letterSpacing:0.6, textTransform:'uppercase'}}>Jobs by day</div>
                  <div style={{fontFamily:DA.ui, fontSize:18, fontWeight:800, color:DA.ink}}>149 completed · 42 declined</div>
                </div>
                <div style={{display:'flex', gap:14, fontFamily:DA.ui, fontSize:11, color:DA.ink2}}>
                  <span style={{display:'inline-flex', alignItems:'center', gap:5}}><span style={{width:10, height:10, borderRadius:3, background:DA.deep}}/>Completed</span>
                  <span style={{display:'inline-flex', alignItems:'center', gap:5}}><span style={{width:10, height:10, borderRadius:3, background:DA.line2, border:`1px solid ${DA.line}`}}/>Declined</span>
                </div>
              </div>
              <div style={{flex:1, display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:18, alignItems:'flex-end', padding:'10px 4px'}}>
                {days.map(([d,c,x],i)=>(
                  <div key={i} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:8, height:'100%'}}>
                    <div style={{flex:1, width:'100%', display:'flex', alignItems:'flex-end', gap:6}}>
                      <div style={{flex:1, height:`${c/max*100}%`, background:DA.deep, borderRadius:'8px 8px 0 0', minHeight:8}}/>
                      <div style={{flex:1, height:`${x/max*100}%`, background:DA.ice, border:`1px solid ${DA.sky}`, borderRadius:'8px 8px 0 0', minHeight:6}}/>
                    </div>
                    <span style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3, fontWeight:600}}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Top drivers */}
            <div style={{padding:'18px 20px', borderRadius:16, background:DA.paper, border:`1px solid ${DA.line2}`, display:'flex', flexDirection:'column'}}>
              <div style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3, fontWeight:700, letterSpacing:0.6, textTransform:'uppercase', marginBottom:10}}>Top drivers</div>
              {[
                ['Priya Sharma','D-02',32,4.9],
                ['Marc Rinaldi','D-04',28,4.9],
                ['Aisha Khan','D-08',24,4.8],
                ['Greg Thompson','D-11',21,4.6],
              ].map(([n,id,j,r],i)=>(
                <div key={id} style={{display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:i<3?`1px solid ${DA.line2}`:'none'}}>
                  <span style={{width:22, fontFamily:DA.ui, fontSize:11, color:DA.ink3, fontWeight:700}}>{i+1}</span>
                  <div style={{width:34, height:34, borderRadius:'50%', background:DA.ice, color:DA.deep, fontFamily:DA.ui, fontWeight:800, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center'}}>{n.split(' ').map(s=>s[0]).join('')}</div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontFamily:DA.ui, fontSize:13, fontWeight:600, color:DA.ink}}>{n}</div>
                    <div style={{fontFamily:DA.mono, fontSize:10, color:DA.ink3}}>{id} · {r}★</div>
                  </div>
                  <div style={{fontFamily:DA.ui, fontSize:14, fontWeight:800, color:DA.ink}}>{j}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Tablet>
  );
}

// 5) Company · Billing
function CoBilling() {
  const inv = [
    {n:'INV-2026-0142', period:'May 1–7',  jobs:38, amt:9420, status:'Paid'},
    {n:'INV-2026-0141', period:'Apr 24–30',jobs:42, amt:10180, status:'Paid'},
    {n:'INV-2026-0140', period:'Apr 17–23',jobs:35, amt:8740, status:'Paid'},
    {n:'INV-2026-0139', period:'Apr 10–16',jobs:31, amt:7990, status:'Paid'},
    {n:'INV-2026-0138', period:'Apr 3–9',  jobs:40, amt:9560, status:'Refunded'},
  ];
  const stCol = (s)=> s==='Paid'?DA.on : s==='Refunded'?'#E63946' : DA.sky;
  return (
    <Tablet w={1180} h={820}>
      <div style={{display:'flex', height:'100%', background:DA.bg}}>
        <CoSide sel="billing"/>
        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
          <CoTopbar sub="Subscription &amp; invoices" title="Billing"
            action={<button style={{padding:'10px 16px', borderRadius:12, background:DA.deep, color:DA.paper, border:'none', fontFamily:DA.ui, fontSize:13, fontWeight:700, cursor:'pointer'}}>Manage subscription</button>}/>
          <div style={{padding:'14px 26px 0', display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr', gap:12}}>
            {/* current plan */}
            <div style={{padding:'18px', borderRadius:16, background:`linear-gradient(135deg, ${DA.deep}, ${DA.ink})`, color:DA.paper}}>
              <div style={{fontFamily:DA.ui, fontSize:11, color:'rgba(255,255,255,0.65)', fontWeight:700, letterSpacing:0.6, textTransform:'uppercase'}}>Current plan</div>
              <div style={{display:'flex', alignItems:'baseline', gap:8, marginTop:4}}>
                <div style={{fontFamily:DA.ui, fontSize:24, fontWeight:800}}>Pro</div>
                <div style={{fontFamily:DA.ui, fontSize:13, color:'rgba(255,255,255,0.65)'}}>· $189/mo · 14 trucks</div>
              </div>
              <div style={{display:'flex', gap:14, marginTop:14}}>
                {[['Drivers','14 / 25'],['Dispatches','Unlim.'],['Renews','May 28']].map(([l,v])=>(
                  <div key={l}>
                    <div style={{fontFamily:DA.ui, fontSize:9, color:'rgba(255,255,255,0.55)', fontWeight:700, letterSpacing:0.6, textTransform:'uppercase'}}>{l}</div>
                    <div style={{fontFamily:DA.ui, fontSize:14, fontWeight:700, marginTop:1}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* payment method */}
            <div style={{padding:'18px', borderRadius:16, background:DA.paper, border:`1px solid ${DA.line2}`}}>
              <div style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3, fontWeight:700, letterSpacing:0.6, textTransform:'uppercase'}}>Payment method</div>
              <div style={{display:'flex', alignItems:'center', gap:10, marginTop:10}}>
                <div style={{width:40, height:28, borderRadius:6, background:DA.ink, color:DA.paper, display:'flex', alignItems:'center', justifyContent:'center'}}><IcCard size={16}/></div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:DA.mono, fontSize:13, color:DA.ink, fontWeight:600}}>•••• 4811</div>
                  <div style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3}}>Visa · expires 04/28</div>
                </div>
                <span style={{fontFamily:DA.ui, fontSize:12, color:DA.deep, fontWeight:700, cursor:'pointer'}}>Update</span>
              </div>
            </div>
            {/* MTD */}
            <div style={{padding:'18px', borderRadius:16, background:DA.paper, border:`1px solid ${DA.line2}`}}>
              <div style={{fontFamily:DA.ui, fontSize:11, color:DA.ink3, fontWeight:700, letterSpacing:0.6, textTransform:'uppercase'}}>Month-to-date</div>
              <div style={{fontFamily:DA.ui, fontSize:24, fontWeight:800, color:DA.ink, marginTop:4}}>$14,120</div>
              <div style={{fontFamily:DA.ui, fontSize:11, color:DA.on, fontWeight:600}}>+18% vs last month</div>
            </div>
          </div>
          {/* invoice table */}
          <div style={{padding:14, flex:1, overflow:'hidden'}}>
            <div style={{height:'100%', borderRadius:16, background:DA.paper, border:`1px solid ${DA.line2}`, display:'flex', flexDirection:'column', overflow:'hidden'}}>
              <div style={{padding:'14px 18px', borderBottom:`1px solid ${DA.line2}`, display:'flex', justifyContent:'space-between'}}>
                <div style={{fontFamily:DA.ui, fontSize:14, fontWeight:800, color:DA.ink}}>Invoice history</div>
                <span style={{fontFamily:DA.ui, fontSize:12, color:DA.deep, fontWeight:600, cursor:'pointer'}}>Download all (CSV)</span>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1.5fr 1.2fr 1fr 1fr 1fr 60px', gap:12, padding:'10px 18px', background:DA.bg, borderBottom:`1px solid ${DA.line2}`, fontFamily:DA.ui, fontSize:10, fontWeight:700, color:DA.ink3, letterSpacing:0.7, textTransform:'uppercase'}}>
                <span>Invoice</span><span>Period</span><span>Jobs</span><span>Amount</span><span>Status</span><span/>
              </div>
              <div style={{flex:1, overflow:'auto'}}>
                {inv.map(j=>(
                  <div key={j.n} style={{display:'grid', gridTemplateColumns:'1.5fr 1.2fr 1fr 1fr 1fr 60px', gap:12, padding:'14px 18px', borderBottom:`1px solid ${DA.line2}`, alignItems:'center'}}>
                    <span style={{fontFamily:DA.mono, fontSize:13, fontWeight:600, color:DA.ink}}>{j.n}</span>
                    <span style={{fontFamily:DA.ui, fontSize:13, color:DA.ink2}}>{j.period}</span>
                    <span style={{fontFamily:DA.ui, fontSize:13, color:DA.ink2}}>{j.jobs}</span>
                    <span style={{fontFamily:DA.ui, fontSize:14, color:DA.ink, fontWeight:700}}>${j.amt.toLocaleString()}</span>
                    <span style={{display:'inline-flex', alignItems:'center', gap:6, fontFamily:DA.ui, fontSize:12, fontWeight:700, color:stCol(j.status)}}>
                      <span style={{width:7, height:7, borderRadius:'50%', background:stCol(j.status)}}/>{j.status}
                    </span>
                    <span style={{fontFamily:DA.ui, fontSize:12, color:DA.deep, fontWeight:600, cursor:'pointer'}}>PDF</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Tablet>
  );
}

window.CoDispatch = CoDispatch;
window.CoFleet = CoFleet;
window.CoDrivers = CoDrivers;
window.CoReports = CoReports;
window.CoBilling = CoBilling;
