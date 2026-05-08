/* Ditchapp logo explorations.
 * Brand cues: tow truck dispatch app for accidents (vehicles in ditches/snow).
 * Palette: light blue #3FA7E6 + ice/white. Optional deep blue for depth.
 * Type: Space Grotesk for warmth, Inter for utility, JetBrains Mono for mark/system bits.
 * Each artboard is a self-contained logo lock-up so we can compare side-by-side.
 */

/* ---------- Shared helpers ---------- */
const C = {
  blue: "#3FA7E6",
  blueDeep: "#1F6FB2",
  blueInk: "#0B3354",
  blueIce: "#E8F4FC",
  bluePale: "#CFE6F7",
  ink: "#0B1B2B",
  paper: "#FFFFFF",
  line: "#D7E3EE",
};

const Frame = ({ bg = C.paper, children, pad = 56, align = "center" }) => (
  <div style={{
    width: "100%", height: "100%",
    background: bg,
    display: "flex", alignItems: "center", justifyContent: align,
    padding: pad, boxSizing: "border-box",
    position: "relative", overflow: "hidden",
  }}>{children}</div>
);

const Caption = ({ children, dark }) => (
  <div style={{
    position: "absolute", left: 18, bottom: 14,
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase",
    color: dark ? "rgba(255,255,255,.55)" : "#94A6B8",
  }}>{children}</div>
);

const TopTag = ({ children, dark }) => (
  <div style={{
    position: "absolute", right: 18, top: 14,
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase",
    color: dark ? "rgba(255,255,255,.55)" : "#94A6B8",
  }}>{children}</div>
);

/* =========================================================
 * 01 — D as road dipping into a ditch
 * The D's spine is the road; the bowl curves down into a dip.
 * ========================================================= */
const Logo01 = () => (
  <Frame>
    <TopTag>01 · Road dip</TopTag>
    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
      <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
        {/* outer rounded square */}
        <rect x="4" y="4" width="152" height="152" rx="34" fill={C.blueIce} />
        {/* road / D */}
        <path
          d="M44 36 H88 a44 44 0 0 1 0 88 H44"
          stroke={C.blue} strokeWidth="14" strokeLinecap="round" fill="none" />
        {/* dashed centerline */}
        <path
          d="M52 80 H86"
          stroke={C.paper} strokeWidth="3" strokeLinecap="round"
          strokeDasharray="6 7" />
        {/* ditch slope */}
        <path d="M86 124 q 14 8 28 -2" stroke={C.blueDeep} strokeWidth="4"
              strokeLinecap="round" fill="none" opacity=".55"/>
      </svg>
      <div>
        <div style={{
          fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 56,
          letterSpacing: "-.03em", color: C.blueInk, lineHeight: 1,
        }}>ditch<span style={{color:C.blue}}>app</span></div>
        <div style={{
          fontFamily: "JetBrains Mono", fontSize: 11, marginTop: 10,
          letterSpacing: ".22em", color: "#6B7C8D", textTransform: "uppercase",
        }}>tow · faster</div>
      </div>
    </div>
    <Caption>D = the road that dips</Caption>
  </Frame>
);

/* =========================================================
 * 02 — D + tow hook negative space
 * The counter of the D is shaped like a hook.
 * ========================================================= */
const Logo02 = () => (
  <Frame bg={C.blueIce}>
    <TopTag>02 · Hook counter</TopTag>
    <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
      <svg width="170" height="170" viewBox="0 0 170 170">
        <defs>
          <mask id="dmask">
            <rect width="170" height="170" fill="white"/>
            {/* the hook negative space */}
            <path d="M70 40 H92 a40 40 0 0 1 0 80 H70 V96 a16 16 0 0 1 16 -16 h6 a8 8 0 0 0 0 -16 H70 Z"
                  fill="black"/>
          </mask>
        </defs>
        {/* the D solid */}
        <path d="M40 24 H92 a 60 60 0 0 1 0 122 H40 Z"
              fill={C.blue} mask="url(#dmask)"/>
        {/* small bolt at hook tip */}
        <circle cx="86" cy="72" r="4" fill={C.paper}/>
      </svg>
      <div>
        <div style={{
          fontFamily: "Inter", fontWeight: 800, fontSize: 60,
          letterSpacing: "-.04em", color: C.blueInk, lineHeight: .95,
        }}>Ditchapp</div>
        <div style={{
          fontFamily: "Inter", fontSize: 13, marginTop: 8,
          color: C.blueDeep, fontWeight: 500,
        }}>The fastest way to a tow.</div>
      </div>
    </div>
    <Caption>hook hides inside the D</Caption>
  </Frame>
);

/* =========================================================
 * 03 — D as a pin / location marker
 * Half-D, half-pin, dropped into a snow line.
 * ========================================================= */
const Logo03 = () => (
  <Frame>
    <TopTag>03 · Drop pin D</TopTag>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <svg width="170" height="190" viewBox="0 0 170 190">
        {/* ground line w/ snow texture */}
        <line x1="10" y1="172" x2="160" y2="172" stroke={C.blueDeep} strokeWidth="2" opacity=".25"/>
        {[18,40,62,84,106,128,150].map(x=>(
          <circle key={x} cx={x} cy="178" r="2" fill={C.blueDeep} opacity=".25"/>
        ))}
        {/* pin tail */}
        <path d="M85 168 L72 130 H98 Z" fill={C.blueDeep}/>
        {/* D body */}
        <path d="M38 22 H90 a 54 54 0 0 1 0 108 H38 Z" fill={C.blue}/>
        {/* inner bowl */}
        <path d="M58 42 H90 a 34 34 0 0 1 0 68 H58 Z" fill={C.paper}/>
        {/* center dot */}
        <circle cx="84" cy="76" r="11" fill={C.blueDeep}/>
      </svg>
      <div style={{textAlign:"center"}}>
        <div style={{
          fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 38,
          letterSpacing: "-.02em", color: C.blueInk, lineHeight: 1,
        }}>ditchapp</div>
        <div style={{
          fontFamily: "JetBrains Mono", fontSize: 10, marginTop: 6,
          letterSpacing: ".3em", color: "#7E8FA1", textTransform: "uppercase",
        }}>dispatch · arrive · recover</div>
      </div>
    </div>
    <Caption>a D that drops onto the map</Caption>
  </Frame>
);

/* =========================================================
 * 04 — Monogram tile (app icon)
 * Solid blue tile, white D with a curved tow line.
 * ========================================================= */
const Logo04 = () => (
  <Frame bg="#0B3354">
    <TopTag dark>04 · App icon</TopTag>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
      <div style={{
        width: 200, height: 200, borderRadius: 46,
        background: `linear-gradient(160deg, ${C.blue} 0%, ${C.blueDeep} 100%)`,
        position: "relative", overflow: "hidden",
        boxShadow: "0 20px 50px -20px rgba(31,111,178,.7), inset 0 1px 0 rgba(255,255,255,.4)",
      }}>
        {/* highlight */}
        <div style={{
          position:"absolute", inset:0,
          background:"radial-gradient(120% 80% at 20% 0%, rgba(255,255,255,.35), transparent 55%)",
        }}/>
        <svg width="200" height="200" viewBox="0 0 200 200" style={{position:"absolute",inset:0}}>
          {/* D */}
          <path d="M58 40 H108 a 60 60 0 0 1 0 120 H58 Z" fill={C.paper}/>
          <path d="M76 58 H108 a 42 42 0 0 1 0 84 H76 Z" fill="none"/>
          <path d="M76 58 H108 a 42 42 0 0 1 0 84 H76 Z" fill={C.blue}/>
          {/* tow cable from D to small hook */}
          <path d="M150 58 q 6 42 -10 50" stroke={C.paper} strokeWidth="4"
                strokeLinecap="round" fill="none" strokeDasharray="0"/>
          <circle cx="150" cy="58" r="5" fill={C.paper}/>
          <path d="M138 110 a 6 6 0 1 0 12 0 a 6 6 0 1 0 -12 0" fill="none"
                stroke={C.paper} strokeWidth="3"/>
        </svg>
      </div>
      <div style={{
        fontFamily: "Inter", fontWeight: 700, fontSize: 22,
        color: C.paper, letterSpacing: "-.01em",
      }}>Ditchapp</div>
    </div>
    <Caption dark>iOS / Android tile</Caption>
  </Frame>
);

/* =========================================================
 * 05 — Wordmark with tilted D (vehicle in ditch metaphor)
 * The D leans forward like a car nose-down.
 * ========================================================= */
const Logo05 = () => (
  <Frame>
    <TopTag>05 · Tilted D</TopTag>
    <div style={{display:"flex",alignItems:"baseline",gap:0}}>
      <svg width="120" height="150" viewBox="0 0 120 150" style={{transform:"translateY(8px)"}}>
        <g transform="rotate(-14 60 75)">
          <path d="M22 22 H64 a 50 50 0 0 1 0 100 H22 Z" fill={C.blue}/>
          <path d="M40 40 H64 a 32 32 0 0 1 0 64 H40 Z" fill={C.paper}/>
        </g>
        {/* snow bank */}
        <path d="M2 132 q30 -10 60 0 t 60 0 V150 H2 Z" fill={C.bluePale}/>
        <path d="M2 138 q30 -8 60 0 t 60 0 V150 H2 Z" fill={C.blue} opacity=".55"/>
      </svg>
      <div style={{
        fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 76,
        letterSpacing: "-.04em", color: C.blueInk, lineHeight: 1,
      }}>itchapp</div>
    </div>
    <Caption>D nose-down in a snow bank</Caption>
  </Frame>
);

/* =========================================================
 * 06 — Badge / shield emblem (operator-friendly)
 * Strong, reads at small size on a truck door.
 * ========================================================= */
const Logo06 = () => (
  <Frame bg={C.blueIce}>
    <TopTag>06 · Truck-door badge</TopTag>
    <div style={{display:"flex",alignItems:"center",gap:30}}>
      <svg width="170" height="170" viewBox="0 0 170 170">
        {/* shield */}
        <path d="M85 8 L156 30 V92 c0 38 -30 60 -71 70 c-41 -10 -71 -32 -71 -70 V30 Z"
              fill={C.paper} stroke={C.blue} strokeWidth="4"/>
        {/* inner ring */}
        <path d="M85 22 L142 40 V90 c0 30 -24 48 -57 56 c-33 -8 -57 -26 -57 -56 V40 Z"
              fill={C.blue}/>
        {/* D mark */}
        <path d="M58 56 H92 a 28 28 0 0 1 0 56 H58 Z" fill={C.paper}/>
        <circle cx="86" cy="84" r="8" fill={C.blue}/>
        {/* est. tag */}
        <text x="85" y="158" textAnchor="middle"
              style={{fontFamily:"JetBrains Mono",fontSize:8,letterSpacing:".25em"}}
              fill={C.blueDeep}>EST · 2026</text>
      </svg>
      <div>
        <div style={{
          fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 44,
          letterSpacing: "-.03em", color: C.blueInk, lineHeight: 1,
        }}>DITCHAPP</div>
        <div style={{height:2,background:C.blue,width:80,margin:"10px 0"}}/>
        <div style={{
          fontFamily: "JetBrains Mono", fontSize: 11,
          letterSpacing: ".25em", color: "#6B7C8D", textTransform: "uppercase",
        }}>tow · recovery · dispatch</div>
      </div>
    </div>
    <Caption>fleet livery / business card</Caption>
  </Frame>
);

/* =========================================================
 * 07 — Geometric D + ping (live dispatch metaphor)
 * Concentric arcs ripple from the D bowl.
 * ========================================================= */
const Logo07 = () => (
  <Frame>
    <TopTag>07 · Live ping</TopTag>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18}}>
      <svg width="220" height="180" viewBox="0 0 220 180">
        {/* radar arcs */}
        <circle cx="110" cy="90" r="54" fill="none" stroke={C.bluePale} strokeWidth="2"/>
        <circle cx="110" cy="90" r="74" fill="none" stroke={C.bluePale} strokeWidth="2" opacity=".7"/>
        <circle cx="110" cy="90" r="94" fill="none" stroke={C.bluePale} strokeWidth="2" opacity=".4"/>
        {/* D */}
        <path d="M82 50 H114 a 40 40 0 0 1 0 80 H82 Z" fill={C.blue}/>
        <path d="M96 64 H114 a 26 26 0 0 1 0 52 H96 Z" fill={C.paper}/>
        {/* ping dot */}
        <circle cx="110" cy="90" r="6" fill={C.blueDeep}/>
      </svg>
      <div style={{textAlign:"center"}}>
        <div style={{
          fontFamily: "Inter", fontWeight: 800, fontSize: 40,
          letterSpacing: "-.03em", color: C.blueInk, lineHeight: 1,
        }}>Ditchapp</div>
        <div style={{
          fontFamily: "Inter", fontSize: 12, marginTop: 6,
          color: "#6B7C8D",
        }}>Live tow dispatch · 24/7</div>
      </div>
    </div>
    <Caption>signal ripples from the mark</Caption>
  </Frame>
);

/* =========================================================
 * 08 — Inverse / dark mode
 * White D on deep blue, for splash & loading screens.
 * ========================================================= */
const Logo08 = () => (
  <Frame bg={C.blueDeep}>
    <TopTag dark>08 · Dark / splash</TopTag>
    <div style={{display:"flex",alignItems:"center",gap:24}}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <path d="M30 24 H78 a 46 46 0 0 1 0 92 H30 Z" fill={C.paper}/>
        <path d="M48 42 H78 a 28 28 0 0 1 0 56 H48 Z" fill={C.blueDeep}/>
      </svg>
      <div>
        <div style={{
          fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 60,
          letterSpacing: "-.03em", color: C.paper, lineHeight: 1,
        }}>ditchapp</div>
        <div style={{
          fontFamily: "JetBrains Mono", fontSize: 11, marginTop: 8,
          letterSpacing: ".25em", color: C.bluePale, textTransform: "uppercase",
        }}>v 1.0 · loading</div>
      </div>
    </div>
    <Caption dark>inverse lockup</Caption>
  </Frame>
);

/* =========================================================
 * 09 — Car nose-dived into the D (the D is the ditch)
 * The D's open side acts as a hole; a car points down into it.
 * ========================================================= */
const Logo09 = () => (
  <Frame>
    <TopTag>09 · Car in the D</TopTag>
    <div style={{display:"flex",alignItems:"center",gap:30}}>
      <svg width="200" height="180" viewBox="0 0 200 180">
        {/* horizon line */}
        <line x1="10" y1="120" x2="190" y2="120" stroke={C.line} strokeWidth="1.5"/>
        {/* snow mounds */}
        <path d="M10 120 q 30 -14 60 0 t 60 0 t 60 0 V140 H10 Z" fill={C.blueIce}/>
        {/* the D — open bowl on the right acts as the ditch */}
        <path d="M30 24 H82 a 56 56 0 0 1 0 112 H30 Z" fill={C.blue}/>
        <path d="M48 42 H82 a 38 38 0 0 1 0 76 H48 Z" fill={C.paper}/>
        {/* tilted car nose-down inside the bowl */}
        <g transform="rotate(58 110 92)">
          {/* body */}
          <rect x="86" y="78" width="48" height="22" rx="5" fill={C.blueDeep}/>
          {/* cabin */}
          <path d="M96 78 L102 68 H120 L126 78 Z" fill={C.blueDeep}/>
          {/* windows */}
          <path d="M100 78 L104 70 H118 L122 78 Z" fill={C.blueIce}/>
          {/* wheels */}
          <circle cx="96" cy="100" r="5" fill={C.ink}/>
          <circle cx="124" cy="100" r="5" fill={C.ink}/>
          {/* headlight beam */}
          <path d="M134 88 L150 86 L150 92 L134 90 Z" fill={C.blue} opacity=".5"/>
        </g>
        {/* skid/snow puff */}
        <circle cx="142" cy="118" r="6" fill={C.bluePale}/>
        <circle cx="152" cy="122" r="4" fill={C.bluePale}/>
        <circle cx="134" cy="124" r="3" fill={C.bluePale}/>
      </svg>
      <div>
        <div style={{
          fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 56,
          letterSpacing: "-.03em", color: C.blueInk, lineHeight: 1,
        }}>ditch<span style={{color:C.blue}}>app</span></div>
        <div style={{
          fontFamily: "Inter", fontSize: 13, marginTop: 8, color: "#6B7C8D",
        }}>When the D is exactly where you don't want to be.</div>
      </div>
    </div>
    <Caption>literal: car ditched into the D</Caption>
  </Frame>
);

/* =========================================================
 * 10 — Tow truck pulling the D back onto the road
 * D acts as the stranded vehicle being recovered.
 * ========================================================= */
const Logo10 = () => (
  <Frame bg={C.blueIce}>
    <TopTag>10 · Tow & rescue</TopTag>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18}}>
      <svg width="320" height="170" viewBox="0 0 320 170">
        {/* road */}
        <line x1="10" y1="138" x2="310" y2="138" stroke={C.blueDeep} strokeWidth="2"/>
        <path d="M30 144 H50 M70 144 H90 M110 144 H130 M150 144 H170 M190 144 H210 M230 144 H250 M270 144 H290"
              stroke={C.blue} strokeWidth="2" strokeDasharray="0"/>
        {/* tow truck on the left */}
        <g>
          {/* flatbed */}
          <rect x="22" y="108" width="60" height="20" rx="3" fill={C.blueDeep}/>
          {/* cab */}
          <path d="M82 108 H108 L116 88 H94 L82 108 Z" fill={C.blue}/>
          <rect x="98" y="92" width="14" height="12" fill={C.blueIce}/>
          {/* light bar */}
          <rect x="90" y="84" width="22" height="4" rx="1" fill={C.blueDeep}/>
          {/* wheels */}
          <circle cx="38" cy="132" r="7" fill={C.ink}/>
          <circle cx="38" cy="132" r="2.5" fill={C.paper}/>
          <circle cx="68" cy="132" r="7" fill={C.ink}/>
          <circle cx="68" cy="132" r="2.5" fill={C.paper}/>
          <circle cx="100" cy="132" r="7" fill={C.ink}/>
          <circle cx="100" cy="132" r="2.5" fill={C.paper}/>
          {/* hook arm */}
          <path d="M22 110 L 0 96" stroke={C.blueDeep} strokeWidth="3" strokeLinecap="round"/>
          {/* tow cable to D */}
          <path d="M0 96 Q 70 70 150 100"
                stroke={C.blueDeep} strokeWidth="2" fill="none"
                strokeDasharray="3 3"/>
        </g>
        {/* the D being rescued */}
        <g transform="translate(150,72) rotate(-12)">
          <path d="M0 0 H38 a 32 32 0 0 1 0 64 H0 Z" fill={C.blue}/>
          <path d="M12 12 H38 a 20 20 0 0 1 0 40 H12 Z" fill={C.paper}/>
          {/* hook attach point */}
          <circle cx="0" cy="0" r="3" fill={C.blueDeep}/>
        </g>
        {/* skid dust under D */}
        <ellipse cx="180" cy="142" rx="30" ry="3" fill={C.bluePale}/>
      </svg>
      <div style={{textAlign:"center"}}>
        <div style={{
          fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 38,
          letterSpacing: "-.03em", color: C.blueInk, lineHeight: 1,
        }}>Ditchapp</div>
        <div style={{
          fontFamily: "JetBrains Mono", fontSize: 10, marginTop: 6,
          letterSpacing: ".25em", color: "#6B7C8D", textTransform: "uppercase",
        }}>we get you out</div>
      </div>
    </div>
    <Caption>tow truck recovering the D itself</Caption>
  </Frame>
);

/* =========================================================
 * 11 — Side-view: car wheels into the D's bowl
 * The bottom curve of the D becomes the ditch the car is sitting in.
 * ========================================================= */
const Logo11 = () => (
  <Frame>
    <TopTag>11 · Half-buried</TopTag>
    <div style={{display:"flex",alignItems:"center",gap:30}}>
      <svg width="220" height="180" viewBox="0 0 220 180">
        {/* the D as a cross-section: spine on left = roadside */}
        <path d="M20 30 H78 a 64 64 0 0 1 0 128 H20 Z" fill={C.blue}/>
        {/* inner bowl (the actual ditch) */}
        <path d="M20 30 H78 a 64 64 0 0 1 0 128 H20 Z M38 48 H78 a 46 46 0 0 1 0 92 H38 Z"
              fill={C.blue} fillRule="evenodd"/>
        <path d="M38 48 H78 a 46 46 0 0 1 0 92 H38 Z" fill={C.blueIce}/>
        {/* car sitting in the bowl, tilted forward */}
        <g transform="translate(46 76) rotate(22)">
          <rect x="0" y="14" width="60" height="20" rx="4" fill={C.paper} stroke={C.blueDeep} strokeWidth="2"/>
          <path d="M10 14 L18 2 H44 L52 14 Z" fill={C.paper} stroke={C.blueDeep} strokeWidth="2"/>
          <path d="M14 14 L20 5 H42 L48 14 Z" fill={C.blue} opacity=".55"/>
          <circle cx="14" cy="36" r="6" fill={C.blueInk}/>
          <circle cx="46" cy="36" r="6" fill={C.blueInk}/>
          <circle cx="14" cy="36" r="2" fill={C.paper}/>
          <circle cx="46" cy="36" r="2" fill={C.paper}/>
        </g>
        {/* hazard ! above the D */}
        <g transform="translate(120 30)">
          <path d="M16 0 L32 26 H0 Z" fill={C.blueDeep}/>
          <rect x="14" y="8" width="4" height="10" fill={C.paper}/>
          <rect x="14" y="20" width="4" height="3" fill={C.paper}/>
        </g>
      </svg>
      <div>
        <div style={{
          fontFamily: "Inter", fontWeight: 800, fontSize: 54,
          letterSpacing: "-.04em", color: C.blueInk, lineHeight: .95,
        }}>Ditchapp</div>
        <div style={{
          fontFamily: "Inter", fontSize: 13, marginTop: 8, color: C.blueDeep,
          fontWeight: 500,
        }}>Roadside help, on demand.</div>
      </div>
    </div>
    <Caption>car parked in the bowl of the D</Caption>
  </Frame>
);

/* =========================================================
 * 12 — Top-down: D-shaped curve in the road, car off the edge
 * Map view — the road bends like a D and a car has slipped off.
 * ========================================================= */
const Logo12 = () => (
  <Frame bg={C.blueIce}>
    <TopTag>12 · Map view</TopTag>
    <div style={{display:"flex",alignItems:"center",gap:28}}>
      <svg width="200" height="200" viewBox="0 0 200 200">
        {/* terrain dots */}
        {Array.from({length:24}).map((_,i)=>{
          const x = 16 + (i*7) % 170;
          const y = 16 + Math.floor((i*13)%170);
          return <circle key={i} cx={x} cy={y} r="1.5" fill={C.bluePale}/>;
        })}
        {/* D-shaped road */}
        <path d="M40 28 V172"
              stroke={C.blueDeep} strokeWidth="14" strokeLinecap="round" fill="none"/>
        <path d="M40 28 H102 a 72 72 0 0 1 0 144 H40"
              stroke={C.blueDeep} strokeWidth="14" strokeLinecap="round" fill="none"/>
        {/* lane stripe */}
        <path d="M40 36 V164"
              stroke={C.paper} strokeWidth="2" strokeDasharray="6 6" fill="none"/>
        <path d="M48 36 H102 a 64 64 0 0 1 0 128 H48"
              stroke={C.paper} strokeWidth="2" strokeDasharray="6 6" fill="none"/>
        {/* car off the road, top-down */}
        <g transform="translate(150 96) rotate(38)">
          <rect x="-14" y="-8" width="28" height="16" rx="3" fill={C.blue}/>
          <rect x="-10" y="-5" width="20" height="10" rx="1" fill={C.blueIce}/>
          <rect x="-12" y="-9" width="3" height="2" fill={C.paper}/>
          <rect x="9" y="-9" width="3" height="2" fill={C.paper}/>
        </g>
        {/* skid marks */}
        <path d="M118 80 Q 130 88 144 92" stroke={C.blueInk} strokeWidth="2" fill="none" opacity=".4"/>
        <path d="M120 90 Q 132 96 146 100" stroke={C.blueInk} strokeWidth="2" fill="none" opacity=".4"/>
        {/* incident pin */}
        <circle cx="150" cy="96" r="14" fill="none" stroke={C.blue} strokeWidth="2" opacity=".6"/>
        <circle cx="150" cy="96" r="22" fill="none" stroke={C.blue} strokeWidth="2" opacity=".3"/>
      </svg>
      <div>
        <div style={{
          fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 50,
          letterSpacing: "-.03em", color: C.blueInk, lineHeight: 1,
        }}>ditchapp</div>
        <div style={{
          fontFamily: "JetBrains Mono", fontSize: 11, marginTop: 8,
          letterSpacing: ".22em", color: C.blueDeep, textTransform: "uppercase",
        }}>incident · located</div>
      </div>
    </div>
    <Caption>road bends like a D · car off the edge</Caption>
  </Frame>
);

/* =========================================================
 * 13 — Headlight D
 * A single car headlight (front view) shaped like a D, beam radiating.
 * ========================================================= */
const Logo13 = () => (
  <Frame bg={C.blueDeep}>
    <TopTag dark>13 · Headlight</TopTag>
    <div style={{display:"flex",alignItems:"center",gap:30}}>
      <svg width="200" height="180" viewBox="0 0 200 180">
        {/* beam cone */}
        <path d="M110 90 L 200 30 L 200 150 Z" fill={C.blue} opacity=".22"/>
        <path d="M110 90 L 196 50 L 196 130 Z" fill={C.blue} opacity=".18"/>
        {/* car front fragment */}
        <path d="M16 30 H110 a 60 60 0 0 1 0 120 H16 Z" fill={C.blueInk}/>
        {/* grille slots */}
        <rect x="30" y="72" width="50" height="3" rx="1" fill={C.blue} opacity=".5"/>
        <rect x="30" y="80" width="50" height="3" rx="1" fill={C.blue} opacity=".4"/>
        <rect x="30" y="88" width="50" height="3" rx="1" fill={C.blue} opacity=".3"/>
        {/* headlight = the D */}
        <path d="M70 50 H100 a 40 40 0 0 1 0 80 H70 Z" fill={C.paper}/>
        <path d="M78 58 H100 a 32 32 0 0 1 0 64 H78 Z" fill={C.blue}/>
        <circle cx="98" cy="90" r="10" fill={C.paper} opacity=".95"/>
        <circle cx="94" cy="86" r="3" fill={C.paper}/>
      </svg>
      <div>
        <div style={{
          fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 56,
          letterSpacing: "-.03em", color: C.paper, lineHeight: 1,
        }}>ditchapp</div>
        <div style={{
          fontFamily: "JetBrains Mono", fontSize: 11, marginTop: 8,
          letterSpacing: ".22em", color: C.bluePale, textTransform: "uppercase",
        }}>we see you · we're coming</div>
      </div>
    </div>
    <Caption dark>D as a headlight cutting through</Caption>
  </Frame>
);

/* =========================================================
 * 14 — App icon: car silhouette inside D bowl
 * Cleaner, icon-grade version of #11.
 * ========================================================= */
const Logo14 = () => (
  <Frame bg="#0B3354">
    <TopTag dark>14 · Icon · car in D</TopTag>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:24}}>
      <div style={{
        width: 200, height: 200, borderRadius: 46,
        background: `linear-gradient(160deg, ${C.blue} 0%, ${C.blueDeep} 100%)`,
        position: "relative", overflow: "hidden",
        boxShadow: "0 20px 50px -20px rgba(31,111,178,.7), inset 0 1px 0 rgba(255,255,255,.4)",
      }}>
        <div style={{
          position:"absolute", inset:0,
          background:"radial-gradient(120% 80% at 20% 0%, rgba(255,255,255,.35), transparent 55%)",
        }}/>
        <svg width="200" height="200" viewBox="0 0 200 200" style={{position:"absolute",inset:0}}>
          {/* D outer */}
          <path d="M48 36 H106 a 64 64 0 0 1 0 128 H48 Z" fill={C.paper}/>
          {/* D inner */}
          <path d="M66 54 H106 a 46 46 0 0 1 0 92 H66 Z" fill={C.blue}/>
          {/* car silhouette tilted in the bowl */}
          <g transform="translate(80 92) rotate(20)">
            <rect x="0" y="8" width="44" height="14" rx="3" fill={C.paper}/>
            <path d="M6 8 L12 -2 H32 L38 8 Z" fill={C.paper}/>
            <path d="M9 8 L14 0 H30 L35 8 Z" fill={C.blue}/>
            <circle cx="10" cy="24" r="4.5" fill={C.blueInk}/>
            <circle cx="34" cy="24" r="4.5" fill={C.blueInk}/>
          </g>
        </svg>
      </div>
      <div style={{
        fontFamily: "Inter", fontWeight: 700, fontSize: 22,
        color: C.paper, letterSpacing: "-.01em",
      }}>Ditchapp</div>
    </div>
    <Caption dark>iOS / Android tile · v2</Caption>
  </Frame>
);

/* =========================================================
 * Type / color spec card
 * ========================================================= */
const Spec = () => (
  <Frame pad={40} align="flex-start">
    <TopTag>System</TopTag>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:36,width:"100%",alignSelf:"stretch",marginTop:24}}>
      <div>
        <div style={{fontFamily:"JetBrains Mono",fontSize:10,letterSpacing:".25em",color:"#94A6B8",marginBottom:12}}>PALETTE</div>
        {[
          {n:"Sky",  v:C.blue},
          {n:"Deep", v:C.blueDeep},
          {n:"Ink",  v:C.blueInk},
          {n:"Ice",  v:C.blueIce},
          {n:"Paper",v:C.paper, border:true},
        ].map(s=>(
          <div key={s.n} style={{display:"flex",alignItems:"center",gap:14,marginBottom:8,fontFamily:"JetBrains Mono",fontSize:12,color:"#5C6E80"}}>
            <div style={{width:28,height:28,borderRadius:6,background:s.v,border: s.border?"1px solid #D7E3EE":"none"}}/>
            <div style={{width:60,fontWeight:600,color:C.blueInk}}>{s.n}</div>
            <div>{s.v}</div>
          </div>
        ))}
      </div>
      <div>
        <div style={{fontFamily:"JetBrains Mono",fontSize:10,letterSpacing:".25em",color:"#94A6B8",marginBottom:12}}>TYPE</div>
        <div style={{fontFamily:"Space Grotesk",fontWeight:700,fontSize:34,color:C.blueInk,letterSpacing:"-.02em",lineHeight:1}}>Space Grotesk</div>
        <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:"#94A6B8",marginTop:4,marginBottom:18}}>display · wordmark</div>
        <div style={{fontFamily:"Inter",fontWeight:700,fontSize:26,color:C.blueInk,letterSpacing:"-.01em"}}>Inter</div>
        <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:"#94A6B8",marginTop:4,marginBottom:18}}>UI · body</div>
        <div style={{fontFamily:"JetBrains Mono",fontWeight:500,fontSize:18,color:C.blueDeep,letterSpacing:".05em"}}>JetBrains Mono</div>
        <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:"#94A6B8",marginTop:4}}>system · tags</div>
      </div>
    </div>
    <Caption>type & color reference</Caption>
  </Frame>
);

/* =========================================================
 * Assembling the canvas
 * ========================================================= */
function App(){
  return (
    <DesignCanvas
      title="Ditchapp · Logo Exploration"
      subtitle="Light blue + white · letter-D forward · 8 directions"
    >
      <DCSection id="marks" title="Letter-D directions">
        <DCArtboard id="01" label="Road dip"        width={620} height={420}><Logo01/></DCArtboard>
        <DCArtboard id="02" label="Hook counter"    width={620} height={420}><Logo02/></DCArtboard>
        <DCArtboard id="03" label="Drop pin"        width={520} height={460}><Logo03/></DCArtboard>
        <DCArtboard id="05" label="Tilted D"        width={620} height={420}><Logo05/></DCArtboard>
        <DCArtboard id="07" label="Live ping"       width={520} height={460}><Logo07/></DCArtboard>
      </DCSection>

      <DCSection id="cars" title="Car-involved · D + accident">
        <DCArtboard id="09" label="Car in the D"      width={680} height={420}><Logo09/></DCArtboard>
        <DCArtboard id="11" label="Half-buried"       width={680} height={420}><Logo11/></DCArtboard>
        <DCArtboard id="12" label="Map view"          width={620} height={460}><Logo12/></DCArtboard>
        <DCArtboard id="10" label="Tow & rescue"      width={620} height={420}><Logo10/></DCArtboard>
        <DCArtboard id="13" label="Headlight D"       width={620} height={420}><Logo13/></DCArtboard>
      </DCSection>

      <DCSection id="apps" title="Applications">
        <DCArtboard id="04" label="App icon"          width={420} height={500}><Logo04/></DCArtboard>
        <DCArtboard id="14" label="Icon · car in D"   width={420} height={500}><Logo14/></DCArtboard>
        <DCArtboard id="06" label="Truck-door badge"  width={620} height={420}><Logo06/></DCArtboard>
        <DCArtboard id="08" label="Dark / splash"     width={620} height={360}><Logo08/></DCArtboard>
      </DCSection>

      <DCSection id="spec" title="System">
        <DCArtboard id="spec" label="Type & color"  width={760} height={420}><Spec/></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}
