import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useRef } from "react";

// ─── PERSISTENT STORAGE ───────────────────────────────────────────────────────
const DB = {
  load: async (key) => { try { const r = localStorage.getItem(key); return r?JSON.parse(r):null; } catch { return null; } },
  save: async (key,val) => { try { localStorage.setItem(key,JSON.stringify(val)); } catch {} },
};

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED = {
  about: {
    name:"Your Name", title:"Computer Science Student & Cybersecurity Researcher",
    bio:"Passionate about low-level systems, reverse engineering, and malware analysis. Currently pursuing offensive security certifications while building tools and solving CTF challenges. I believe in understanding systems deeply — from silicon to software.",
    location:"Dammam, Saudi Arabia", email:"you@example.com",
    github:"github.com/yourusername", linkedin:"linkedin.com/in/yourusername",
    focusAreas:["Reverse Engineering","Malware Analysis","Hardware Security","Binary Exploitation","OS Internals"],
    tools:["IDA Pro","Ghidra","x64dbg","Frida","GDB+PEDA","Wireshark","YARA","Volatility"],
  },
  stats: { ctfs:24, writeups:18, tools:7, certs:1, streak:14, solved:89 },
  projects: [
    {id:1,title:"PE Analyzer",desc:"Static analysis tool for PE files — extracts imports, sections, entropy, and detects common packer signatures automatically.",tech:["Python","pefile","YARA"],category:"Tool",github:"#",demo:"",featured:true},
    {id:2,title:"Shellcode Loader",desc:"Educational process injection framework for learning Windows injection techniques in isolated lab environments.",tech:["C","WinAPI","x86 ASM"],category:"Research",github:"#",demo:"",featured:true},
    {id:3,title:"Ghidra Scripts",desc:"Collection of automation scripts — string decryption, function renaming, anti-debug bypass helpers, and deobfuscation utilities.",tech:["Java","Ghidra API","Python"],category:"Tool",github:"#",demo:"",featured:false},
    {id:4,title:"CTF Toolkit",desc:"Personal CTF framework with exploit helpers, format string generators, ROP chain automation, and common crypto solvers.",tech:["Python","pwntools","ROPgadget"],category:"CTF",github:"#",demo:"#",featured:true},
  ],
  writeups: [
    {id:1,title:"HTB — BinaryExploits (RE Challenge)",category:"Reverse Engineering",difficulty:"Hard",date:"2025-01-15",summary:"Analyzed a custom packer using x64dbg and Ghidra. Key technique was tracing the unpacking stub via hardware breakpoints on memory write.",tags:["unpacking","x64dbg","PE"],url:"#"},
    {id:2,title:"PicoCTF 2024 — Buffer Overflow Series",category:"Binary Exploitation",difficulty:"Medium",date:"2025-02-01",summary:"Exploited classic stack buffer overflows through NX, ASLR, and full RELRO bypass. Final challenge required a ret2libc chain.",tags:["BOF","ROP","pwntools"],url:"#"},
    {id:3,title:"Flare-On 2024 — Challenge 3",category:"Malware Analysis",difficulty:"Hard",date:"2025-02-20",summary:"Deobfuscated a multi-stage loader using IDA Pro. Final payload was a keylogger with C2 over DNS tunneling — extracted IOCs and wrote YARA rule.",tags:["malware","IDA","C2","DNS"],url:"#"},
    {id:4,title:"HTB — HardwareHack",category:"Hardware Security",difficulty:"Insane",date:"2025-03-01",summary:"UART console access via logic analyzer, extracted firmware, found hardcoded credentials in decompiled NVRAM routines using Binwalk + Ghidra.",tags:["UART","firmware","hardware"],url:"#"},
  ],
  certs: [
    {id:1,name:"eJPTv2",issuer:"eLearnSecurity",date:"2024",status:"Earned",color:"#22c55e"},
    {id:2,name:"PNPT",issuer:"TCM Security",date:"2025",status:"In Progress",color:"#f59e0b"},
    {id:3,name:"CRTP",issuer:"Pentester Academy",date:"2025",status:"Planned",color:"#6a7aaa"},
    {id:4,name:"OSED",issuer:"Offensive Security",date:"2026",status:"Planned",color:"#6a7aaa"},
  ],
  posts: [
    {id:1,title:"Understanding PE File Format From Scratch",category:"Malware Analysis",date:"2025-01-10",excerpt:"A deep dive into the Portable Executable format — headers, sections, import tables, and how packers abuse them.",tags:["PE","malware","windows"],readTime:8},
    {id:2,title:"Getting Started with Hardware Hacking",category:"Hardware Security",date:"2025-02-05",excerpt:"My journey from zero to reading UART consoles, extracting firmware, and analyzing embedded systems.",tags:["hardware","UART","firmware"],readTime:12},
    {id:3,title:"ROP Chains Explained",category:"Binary Exploitation",date:"2025-02-28",excerpt:"Building reliable ROP chains manually — finding gadgets, chaining syscalls, and bypassing NX with real examples.",tags:["ROP","pwn","x86-64"],readTime:10},
  ],
  topics: [
    {id:"re",  label:"Reverse Engineering",icon:"⚙️",subs:[{label:"Static Analysis",level:3},{label:"Dynamic Analysis",level:3},{label:"Decompilers",level:3},{label:"Anti-debug",level:2},{label:"Obfuscation",level:2}]},
    {id:"mal", label:"Malware Analysis",   icon:"🦠",subs:[{label:"PE Format",level:4},{label:"Unpacking",level:3},{label:"Behavioral",level:3},{label:"Network IOCs",level:2},{label:"Rootkits",level:1}]},
    {id:"pwn", label:"Binary Exploitation",icon:"💥",subs:[{label:"Stack BOF",level:3},{label:"Heap Exploit",level:1},{label:"ROP Chains",level:2},{label:"Format Strings",level:2},{label:"Kernel Pwn",level:0}]},
    {id:"hw",  label:"Hardware Security",  icon:"🔌",subs:[{label:"JTAG/UART",level:2},{label:"Firmware",level:2},{label:"Side-channel",level:0},{label:"PCB Analysis",level:1},{label:"Secure Boot",level:1}]},
    {id:"os",  label:"OS Internals",       icon:"🖥️",subs:[{label:"Win Internals",level:3},{label:"Linux Kernel",level:2},{label:"Memory Mgmt",level:3},{label:"Syscalls",level:3},{label:"Drivers",level:1}]},
    {id:"net", label:"Network Security",   icon:"🌐",subs:[{label:"Packet Analysis",level:2},{label:"C2 Protocols",level:2},{label:"SSL/TLS",level:2},{label:"Pivoting",level:1},{label:"IDS Evasion",level:1}]},
    {id:"ctf", label:"CTF Skills",         icon:"🚩",subs:[{label:"Crypto",level:2},{label:"Forensics",level:2},{label:"Web",level:1},{label:"OSINT",level:2},{label:"Stego",level:1}]},
    {id:"tools",label:"Tools & Env",       icon:"🛠️",subs:[{label:"IDA Pro",level:3},{label:"Ghidra",level:3},{label:"x64dbg",level:3},{label:"Frida",level:2},{label:"GDB+PEDA",level:3}]},
  ],
  // Tracker data
  entries: [],
  quizzes: [],
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const LEVELS      = ["Unknown","Aware","Learning","Solid","Mastered"];
const LEVEL_COLOR = ["#2a2a3a","#5a3e6b","#1d6a7f","#1a7a4a","#2d8c1a"];
const LEVEL_GLOW  = ["#444","#7c3aed","#0ea5e9","#22c55e","#84cc16"];
const DIFF_COLOR  = {Easy:"#22c55e",Medium:"#f59e0b",Hard:"#ef4444",Insane:"#a855f7"};
const CATS        = ["Reverse Engineering","Binary Exploitation","Malware Analysis","Hardware Security","Network Security","OS Internals","CTF Skills","Tools & Env"];

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  bg:"#07070f", bg1:"#0c0c18", bg2:"#101020",
  border:"#181828", border2:"#1e1e32",
  g:"#00ff88", b:"#00ccff", o:"#ff6b35", r:"#ff3355", p:"#a855f7",
  text:"#c8d0dc", muted:"#445566", dim:"#252535",
};

// ─── REUSABLE UI ──────────────────────────────────────────────────────────────
const Tag = ({c,children})=>(
  <span style={{background:(c||C.g)+"18",color:c||C.g,fontSize:10,padding:"2px 8px",
    borderRadius:3,fontFamily:"monospace",letterSpacing:.4,whiteSpace:"nowrap",display:"inline-block"}}>
    {children}
  </span>
);

const Chip = ({active,onClick,children,accent})=>(
  <button onClick={onClick} style={{
    background:active?(accent||C.g)+"18":"transparent",
    border:`1px solid ${active?(accent||C.g):C.border2}`,
    color:active?(accent||C.g):C.muted,
    padding:"5px 13px",borderRadius:4,cursor:"pointer",
    fontSize:10,fontFamily:"monospace",letterSpacing:.5,whiteSpace:"nowrap",transition:"all .15s"
  }}>{children}</button>
);

const Btn = ({children,onClick,accent,outline,sm,full,disabled})=>(
  <button onClick={onClick} disabled={disabled} style={{
    background:outline?"transparent":(accent||C.g)+"18",
    border:`1px solid ${accent||C.g}`,color:accent||C.g,
    padding:sm?"7px 16px":"10px 24px",borderRadius:5,cursor:disabled?"not-allowed":"pointer",
    fontSize:sm?10:12,fontFamily:"monospace",letterSpacing:1,
    boxShadow:`0 0 8px ${accent||C.g}22`,transition:"all .2s",
    width:full?"100%":"auto",whiteSpace:"nowrap",opacity:disabled?.5:1
  }}
    onMouseEnter={e=>{if(!disabled){e.currentTarget.style.background=(accent||C.g)+"28";e.currentTarget.style.boxShadow=`0 0 16px ${accent||C.g}44`;}}}
    onMouseLeave={e=>{e.currentTarget.style.background=outline?"transparent":(accent||C.g)+"18";e.currentTarget.style.boxShadow=`0 0 8px ${accent||C.g}22`;}}
  >{children}</button>
);

const SLabel = ({children,accent})=>(
  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
    <span style={{fontFamily:"Orbitron",fontSize:10,color:accent||C.g,letterSpacing:3,whiteSpace:"nowrap"}}>{children}</span>
    <div style={{flex:1,height:1,background:`linear-gradient(90deg,${accent||C.g}44,transparent)`}}/>
  </div>
);

const Card = ({children,style,glow,onClick,hover})=>{
  const [hov,setHov]=useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={()=>hover&&setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:C.bg1,border:`1px solid ${hov&&hover?C.border2+"88":glow?glow+"28":C.border}`,
        borderRadius:8,padding:"20px 22px",boxShadow:glow?`0 0 24px ${glow}0a`:"none",
        cursor:onClick?"pointer":"default",transition:"all .2s",...style}}>
      {children}
    </div>
  );
};

const Input = ({value,onChange,placeholder,type,multiline,rows,style:s})=>{
  const base = {background:C.bg2,border:`1px solid ${C.border2}`,color:C.text,
    padding:"9px 12px",borderRadius:5,fontSize:12,fontFamily:"inherit",
    width:"100%",resize:multiline?"vertical":undefined,...s};
  return multiline
    ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows||3} style={base}/>
    : <input type={type||"text"} value={value} onChange={onChange} placeholder={placeholder} style={base}/>;
};

const Select = ({value,onChange,options})=>(
  <select value={value} onChange={onChange}
    style={{background:C.bg2,border:`1px solid ${C.border2}`,color:C.text,
      padding:"9px 12px",borderRadius:5,fontSize:12,fontFamily:"inherit",width:"100%"}}>
    {options.map(o=><option key={o} style={{background:C.bg1}}>{o}</option>)}
  </select>
);

const FRow = ({label,children,full,cols})=>(
  <div style={full?{gridColumn:"1/-1"}:{}}>
    <div style={{fontSize:9,color:C.muted,letterSpacing:1.5,marginBottom:5,fontFamily:"monospace"}}>{label}</div>
    {children}
  </div>
);

const Grid = ({children,cols,gap})=>(
  <div style={{display:"grid",gridTemplateColumns:cols||"1fr 1fr",gap:gap||12}}>{children}</div>
);

// ─── USEWIDTH ─────────────────────────────────────────────────────────────────
function useWidth(){
  const [w,setW]=useState(900);
  useEffect(()=>{ const h=()=>setW(window.innerWidth); window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h); },[]);
  return w;
}

// ─── TYPEWRITER ───────────────────────────────────────────────────────────────
function useTypewriter(text,speed=35){
  const [out,setOut]=useState("");
  useEffect(()=>{ let i=0,t; const go=()=>{ if(i<=text.length){setOut(text.slice(0,i++));t=setTimeout(go,speed);} }; go(); return()=>clearTimeout(t); },[text]);
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  APP ROOT
// ═══════════════════════════════════════════════════════════════════════════════
function App(){
  const [page,setPage]      = useState("home");
  const [adminMode,setAdmin]= useState(false);
  const [menuOpen,setMenu]  = useState(false);
  const [data,setData]      = useState(null);
  const width = useWidth();
  const mobile = width<640, tablet = width<960;

  // Load from storage or seed
  useEffect(()=>{
    (async()=>{
      const saved = await DB.load("sp_data");
      setData(saved || JSON.parse(JSON.stringify(SEED)));
    })();
  },[]);

  const persist = useCallback(async(d)=>{ await DB.save("sp_data",d); },[]);
  const update  = useCallback((updater)=>{
    setData(prev=>{ const next=updater({...prev}); persist(next); return next; });
  },[persist]);

  const NAV=[
    {id:"home",      label:"HOME",   icon:"◈"},
    {id:"about",     label:"ABOUT",  icon:"👤"},
    {id:"projects",  label:"PROJECTS",icon:"🛠️"},
    {id:"writeups",  label:"WRITEUPS",icon:"📄"},
    {id:"skills",    label:"SKILLS", icon:"⚙️"},
    {id:"blog",      label:"BLOG",   icon:"📝"},
    {id:"certs",     label:"CERTS",  icon:"🏆"},
    {id:"contact",   label:"CONTACT",icon:"✉️"},
  ];

  if(!data) return (
    <div style={{background:C.bg,height:"100vh",display:"flex",alignItems:"center",
      justifyContent:"center",color:C.g,fontFamily:"monospace",fontSize:12,letterSpacing:3}}>
      BOOTING...
    </div>
  );

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,
      fontFamily:"'JetBrains Mono','Fira Code',monospace",fontSize:13}}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&family=Orbitron:wght@400;600;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;background:#07070f}
        ::-webkit-scrollbar-thumb{background:#1a2a1a;border-radius:2px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes spinY{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}
        .fin{animation:fadeUp .3s ease both}
        input,textarea,select{outline:none!important;-webkit-appearance:none}
        input::placeholder,textarea::placeholder{color:#253535!important}
        select option{background:#0c0c18}
        button{cursor:pointer;font-family:inherit}
        a{text-decoration:none;color:inherit}
      `}</style>

      {/* Grid bg */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,
        backgroundImage:`linear-gradient(${C.border}60 1px,transparent 1px),linear-gradient(90deg,${C.border}60 1px,transparent 1px)`,
        backgroundSize:"44px 44px",opacity:.5}}/>

      {/* Header */}
      <header style={{position:"sticky",top:0,zIndex:300,background:C.bg+"ee",
        backdropFilter:"blur(14px)",borderBottom:`1px solid ${C.border}`,
        height:54,display:"flex",alignItems:"center",padding:`0 ${mobile?14:28}px`,gap:14}}>

        <div onClick={()=>{setPage("home");setAdmin(false);}} style={{cursor:"pointer",flexShrink:0}}>
          <span style={{fontFamily:"Orbitron",fontSize:mobile?11:14,color:C.g,
            letterSpacing:2,textShadow:`0 0 14px ${C.g}77`}}>
            &lt;<span style={{color:C.b}}>sec</span><span style={{color:C.o}}>port</span>/&gt;
          </span>
        </div>

        {!tablet&&!adminMode&&(
          <nav style={{display:"flex",gap:1,marginLeft:8}}>
            {NAV.map(({id,label})=>(
              <button key={id} onClick={()=>setPage(id)} style={{
                background:"none",border:"none",color:page===id?C.g:C.muted,
                fontSize:9,letterSpacing:1.5,padding:"6px 10px",
                borderBottom:page===id?`2px solid ${C.g}`:"2px solid transparent",
                transition:"all .15s"
              }}>{label}</button>
            ))}
          </nav>
        )}
        {!tablet&&adminMode&&(
          <span style={{fontFamily:"Orbitron",fontSize:10,color:C.o,letterSpacing:2,marginLeft:12}}>
            ADMIN DASHBOARD
          </span>
        )}

        <div style={{marginLeft:"auto",display:"flex",gap:9,alignItems:"center"}}>
          {/* Mastery pill */}
          {!mobile&&(()=>{
            let s=0,c=0; data.topics.forEach(t=>t.subs.forEach(x=>{s+=x.level;c++;}));
            const pct=c?Math.round((s/(c*4))*100):0;
            return (
              <div style={{display:"flex",alignItems:"center",gap:7,background:C.bg2,
                border:`1px solid ${C.border2}`,borderRadius:20,padding:"4px 10px"}}>
                <div style={{width:48,height:3,background:C.dim,borderRadius:2}}>
                  <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${C.g},${C.b})`,borderRadius:2}}/>
                </div>
                <span style={{fontSize:9,color:C.g,fontFamily:"Orbitron"}}>{pct}%</span>
              </div>
            );
          })()}
          <Btn onClick={()=>{setAdmin(a=>!a);setMenu(false);}} accent={adminMode?C.o:C.muted} outline sm>
            {adminMode?"← EXIT":"ADMIN"}
          </Btn>
          {tablet&&(
            <button onClick={()=>setMenu(m=>!m)} style={{
              background:"none",border:`1px solid ${C.border}`,color:C.g,
              width:34,height:34,borderRadius:5,fontSize:15,
              display:"flex",alignItems:"center",justifyContent:"center"}}>
              {menuOpen?"✕":"☰"}
            </button>
          )}
        </div>
      </header>

      {/* Mobile menu */}
      {tablet&&menuOpen&&(
        <div className="fin" style={{position:"fixed",top:54,left:0,right:0,zIndex:200,
          background:C.bg1+"f8",backdropFilter:"blur(12px)",
          borderBottom:`1px solid ${C.border}`,padding:"10px 14px",
          display:"flex",flexWrap:"wrap",gap:7}}>
          {NAV.map(({id,label,icon})=>(
            <button key={id} onClick={()=>{setPage(id);setMenu(false);setAdmin(false);}} style={{
              flex:"1 1 70px",background:page===id&&!adminMode?C.g+"15":"transparent",
              border:`1px solid ${page===id&&!adminMode?C.g:C.border}`,
              color:page===id&&!adminMode?C.g:C.muted,
              padding:"9px 6px",borderRadius:5,fontSize:10,letterSpacing:.5,textAlign:"center"
            }}>{icon} {label}</button>
          ))}
        </div>
      )}

      {/* Pages */}
      <div style={{position:"relative",zIndex:1,paddingBottom:mobile?60:0}}>
        {adminMode
          ? <AdminDashboard data={data} update={update} mobile={mobile} tablet={tablet}/>
          : <>
              {page==="home"     && <HomePage     data={data} setPage={setPage} mobile={mobile} tablet={tablet}/>}
              {page==="about"    && <AboutPage    data={data} mobile={mobile}/>}
              {page==="projects" && <ProjectsPage data={data} mobile={mobile} tablet={tablet}/>}
              {page==="writeups" && <WriteupsPage data={data} mobile={mobile}/>}
              {page==="skills"   && <SkillsPage   data={data} mobile={mobile} tablet={tablet}/>}
              {page==="blog"     && <BlogPage     data={data} mobile={mobile}/>}
              {page==="certs"    && <CertsPage    data={data} mobile={mobile} tablet={tablet}/>}
              {page==="contact"  && <ContactPage  data={data} mobile={mobile}/>}
            </>
        }
      </div>

      {/* Mobile bottom nav */}
      {mobile&&!adminMode&&(
        <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,
          background:C.bg1+"f0",backdropFilter:"blur(10px)",
          borderTop:`1px solid ${C.border}`,display:"flex",height:54}}>
          {NAV.slice(0,5).map(({id,label,icon})=>(
            <button key={id} onClick={()=>setPage(id)} style={{
              flex:1,background:page===id?"#0a1a0a":"transparent",border:"none",
              color:page===id?C.g:C.muted,
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              gap:2,fontSize:8,letterSpacing:.4,transition:"all .15s"}}>
              <span style={{fontSize:16,lineHeight:1}}>{icon}</span>
              {label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  HOME PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function HomePage({data,setPage,mobile,tablet}){
  const typed = useTypewriter("Computer Science Student & Cybersecurity Researcher");

  return (
    <div style={{maxWidth:1140,margin:"0 auto",padding:mobile?"44px 16px 20px":"80px 28px 40px"}}>

      {/* Hero */}
      <div className="fin" style={{marginBottom:mobile?52:88}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:C.g,boxShadow:`0 0 8px ${C.g}`,animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:9,color:C.muted,letterSpacing:3}}>AVAILABLE FOR OPPORTUNITIES</span>
        </div>
        <h1 style={{fontFamily:"Orbitron",
          fontSize:`clamp(${mobile?"30px":"40px"},${mobile?"8vw":"5.5vw"},${mobile?"46px":"72px"})`,
          color:"#fff",lineHeight:1.05,marginBottom:14,fontWeight:900,letterSpacing:-1}}>
          <span style={{color:C.g,textShadow:`0 0 40px ${C.g}44`}}>HACK</span>.
          <span style={{color:C.b}}>LEARN</span>.
          <br/>
          <span style={{color:C.o}}>BUILD</span>.<span style={{color:"#ffffff88"}}> REPEAT</span>.
        </h1>
        <div style={{fontSize:mobile?12:14,color:C.muted,marginBottom:24,fontFamily:"monospace",display:"flex",alignItems:"center",gap:6}}>
          <span style={{color:C.g}}>$</span>
          <span>{typed}</span>
          <span style={{animation:"blink 1s infinite",color:C.g}}>█</span>
        </div>
        <p style={{fontSize:mobile?12:13,color:"#667788",maxWidth:540,lineHeight:1.9,marginBottom:36}}>
          {data.about.bio}
        </p>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          <Btn onClick={()=>setPage("projects")}>VIEW PROJECTS →</Btn>
          <Btn onClick={()=>setPage("writeups")} accent={C.b} outline>READ WRITEUPS</Btn>
          <Btn onClick={()=>setPage("contact")} accent={C.muted} outline>CONTACT ME</Btn>
        </div>
      </div>

      {/* Stat cards */}
      <div className="fin" style={{display:"grid",
        gridTemplateColumns:mobile?"repeat(2,1fr)":"repeat(3,1fr)",
        gap:12,marginBottom:mobile?52:72}}>
        {[
          {n:data.stats.ctfs,      label:"CTFs Competed",  icon:"🚩",c:C.g},
          {n:data.stats.writeups,  label:"Writeups",       icon:"📄",c:C.b},
          {n:data.stats.tools,     label:"Tools Built",    icon:"🛠️",c:C.o},
          {n:data.stats.solved,    label:"Challenges",     icon:"✅",c:C.p},
          {n:data.stats.certs,     label:"Certs Earned",   icon:"🏆",c:"#f59e0b"},
          {n:data.stats.streak,    label:"Day Streak 🔥",  icon:"📅",c:C.g},
        ].map(({n,label,icon,c},i)=>(
          <Card key={i} glow={c} style={{padding:mobile?"14px":"18px 22px",textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:6}}>{icon}</div>
            <div style={{fontFamily:"Orbitron",fontSize:mobile?26:34,color:c,fontWeight:900,
              textShadow:`0 0 20px ${c}55`,lineHeight:1}}>{n}</div>
            <div style={{fontSize:9,color:C.muted,marginTop:5,letterSpacing:1}}>{label}</div>
          </Card>
        ))}
      </div>

      {/* Recent writeups preview */}
      <div className="fin" style={{marginBottom:mobile?48:72}}>
        <SLabel>RECENT WRITEUPS</SLabel>
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {data.writeups.slice(0,3).map((w,i)=>(
            <div key={i} style={{background:C.bg1,border:`1px solid ${C.border}`,borderRadius:7,
              padding:"13px 16px",display:"flex",gap:12,alignItems:"center",
              cursor:"pointer",transition:"border .2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.b+"55"}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <span style={{fontSize:18,flexShrink:0}}>📄</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,color:"#fff",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.title}</div>
                <div style={{fontSize:10,color:C.muted,marginTop:2}}>{w.category} · {new Date(w.date).toLocaleDateString("en-US",{month:"short",year:"numeric"})}</div>
              </div>
              <Tag c={DIFF_COLOR[w.difficulty]}>{w.difficulty}</Tag>
            </div>
          ))}
        </div>
        <div style={{marginTop:14}}>
          <Btn onClick={()=>setPage("writeups")} accent={C.b} outline sm>ALL WRITEUPS →</Btn>
        </div>
      </div>

      {/* Skills overview */}
      <div className="fin">
        <SLabel>SKILLS OVERVIEW</SLabel>
        <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:10}}>
          {data.topics.slice(0,6).map((t,i)=>{
            const avg=t.subs.reduce((s,x)=>s+x.level,0)/t.subs.length;
            return (
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"6px 0"}}>
                <span style={{fontSize:16,flexShrink:0}}>{t.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:11,color:C.text}}>{t.label}</span>
                    <span style={{fontSize:9,color:C.g,fontFamily:"Orbitron"}}>{Math.round((avg/4)*100)}%</span>
                  </div>
                  <div style={{height:3,background:C.dim,borderRadius:2}}>
                    <div style={{width:`${(avg/4)*100}%`,height:"100%",borderRadius:2,
                      background:`linear-gradient(90deg,${C.g},${C.b})`,transition:"width 1s"}}/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ABOUT
// ═══════════════════════════════════════════════════════════════════════════════
function AboutPage({data,mobile}){
  const a=data.about;
  return (
    <div style={{maxWidth:960,margin:"0 auto",padding:mobile?"32px 16px":"64px 28px"}}>
      <SLabel>ABOUT ME</SLabel>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"240px 1fr",gap:28}}>
        {/* Left */}
        <div>
          <div style={{width:"100%",maxWidth:240,aspectRatio:"1",background:C.bg2,
            border:`1px solid ${C.border2}`,borderRadius:10,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:72,marginBottom:18,position:"relative",overflow:"hidden"}}>
            👾
            <div style={{position:"absolute",inset:0,background:`linear-gradient(135deg,${C.g}08,${C.b}08)`}}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {[{i:"📍",t:a.location},{i:"✉️",t:a.email},{i:"🐙",t:a.github},{i:"💼",t:a.linkedin}].map(({i,t})=>(
              <div key={t} style={{display:"flex",gap:9,alignItems:"center",
                background:C.bg2,border:`1px solid ${C.border}`,borderRadius:5,padding:"8px 11px"}}>
                <span style={{fontSize:13}}>{i}</span>
                <span style={{fontSize:10,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Right */}
        <div>
          <h2 style={{fontFamily:"Orbitron",fontSize:mobile?20:26,color:"#fff",marginBottom:6,fontWeight:800}}>{a.name}</h2>
          <div style={{fontSize:12,color:C.g,marginBottom:22,letterSpacing:.5}}>{a.title}</div>
          <p style={{fontSize:13,color:"#667788",lineHeight:1.9,marginBottom:28}}>{a.bio}</p>

          <div style={{fontSize:9,color:C.muted,letterSpacing:2,marginBottom:12}}>FOCUS AREAS</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:24}}>
            {a.focusAreas.map(t=><Tag key={t}>{t}</Tag>)}
          </div>

          <div style={{fontSize:9,color:C.muted,letterSpacing:2,marginBottom:12}}>DAILY TOOLS</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
            {a.tools.map(t=><Tag key={t} c={C.b}>{t}</Tag>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PROJECTS
// ═══════════════════════════════════════════════════════════════════════════════
function ProjectsPage({data,mobile,tablet}){
  const [filter,setFilter]=useState("All");
  const cats=["All","Tool","Research","CTF"];
  const filtered=filter==="All"?data.projects:data.projects.filter(p=>p.category===filter);
  return (
    <div style={{maxWidth:1140,margin:"0 auto",padding:mobile?"32px 16px":"64px 28px"}}>
      <SLabel>PROJECTS & TOOLS</SLabel>
      <div style={{display:"flex",gap:7,marginBottom:28,flexWrap:"wrap"}}>
        {cats.map(c=><Chip key={c} active={filter===c} onClick={()=>setFilter(c)}>{c}</Chip>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":tablet?"1fr 1fr":"1fr 1fr",gap:16}}>
        {filtered.map((p,i)=>(
          <Card key={p.id} style={{position:"relative",overflow:"hidden",animationDelay:`${i*.07}s`}} className="fin">
            <div style={{position:"absolute",top:0,right:0,background:C.g+"15",
              color:C.g,fontSize:9,padding:"4px 11px",borderBottomLeftRadius:6,letterSpacing:1}}>
              {p.category}{p.featured&&" ★"}
            </div>
            <div style={{fontSize:14,color:"#fff",fontWeight:700,marginBottom:8,paddingRight:80}}>{p.title}</div>
            <p style={{fontSize:12,color:"#556677",lineHeight:1.75,marginBottom:16}}>{p.desc}</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:18}}>
              {p.tech.map(t=><Tag key={t} c={C.b}>{t}</Tag>)}
            </div>
            <div style={{display:"flex",gap:9}}>
              <Btn sm outline accent={C.g}>⟨/⟩ CODE</Btn>
              {p.demo&&<Btn sm outline accent={C.b}>↗ DEMO</Btn>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  WRITEUPS
// ═══════════════════════════════════════════════════════════════════════════════
function WriteupsPage({data,mobile}){
  const [filter,setFilter]=useState("All");
  const [diffFilter,setDiff]=useState("All");
  const cats=["All",...new Set(data.writeups.map(w=>w.category))];
  const diffs=["All","Easy","Medium","Hard","Insane"];
  const filtered=data.writeups.filter(w=>
    (filter==="All"||w.category===filter)&&
    (diffFilter==="All"||w.difficulty===diffFilter)
  );
  return (
    <div style={{maxWidth:960,margin:"0 auto",padding:mobile?"32px 16px":"64px 28px"}}>
      <SLabel accent={C.b}>CTF WRITEUPS</SLabel>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
        {cats.map(c=><Chip key={c} active={filter===c} onClick={()=>setFilter(c)} accent={C.b}>{c.split(" ")[0]}</Chip>)}
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:24}}>
        {diffs.map(d=><Chip key={d} active={diffFilter===d} onClick={()=>setDiff(d)} accent={DIFF_COLOR[d]||C.muted}>{d}</Chip>)}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        {filtered.length===0&&<div style={{color:C.dim,textAlign:"center",padding:40,border:`1px dashed ${C.border}`,borderRadius:7}}>No writeups match.</div>}
        {filtered.map((w,i)=>(
          <div key={w.id} className="fin" style={{background:C.bg1,border:`1px solid ${C.border}`,
            borderRadius:8,padding:"18px 20px",cursor:"pointer",transition:"all .2s",
            animationDelay:`${i*.06}s`}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.b+"55";e.currentTarget.style.transform="translateY(-1px)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";}}>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-start",marginBottom:8}}>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontFamily:"Orbitron",fontSize:12,color:"#fff",fontWeight:700,marginBottom:3}}>{w.title}</div>
                <div style={{fontSize:10,color:C.muted}}>{w.category}</div>
              </div>
              <div style={{display:"flex",gap:7,flexShrink:0}}>
                <Tag c={C.b}>{w.category.split(" ")[0]}</Tag>
                <Tag c={DIFF_COLOR[w.difficulty]}>{w.difficulty}</Tag>
              </div>
            </div>
            <p style={{fontSize:12,color:"#556677",lineHeight:1.7,marginBottom:12}}>{w.summary}</p>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              {w.tags.map(t=><Tag key={t} c="#5a5aaa">#{t}</Tag>)}
              <span style={{marginLeft:"auto",fontSize:9,color:C.dim}}>
                {new Date(w.date).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"})}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SKILLS MAP
// ═══════════════════════════════════════════════════════════════════════════════
function SkillsPage({data,mobile,tablet}){
  const [exp,setExp]=useState(null);
  return (
    <div style={{maxWidth:1140,margin:"0 auto",padding:mobile?"32px 16px":"64px 28px"}}>
      <SLabel accent={C.o}>SKILLS & KNOWLEDGE MAP</SLabel>

      {/* Legend */}
      <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:24}}>
        {LEVELS.map((l,i)=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:10,height:10,borderRadius:2,background:LEVEL_COLOR[i],boxShadow:`0 0 4px ${LEVEL_GLOW[i]}`}}/>
            <span style={{fontSize:9,color:C.muted}}>{l}</span>
          </div>
        ))}
      </div>

      {/* Expandable topic rows */}
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:32}}>
        {data.topics.map((t,ti)=>{
          const avg=t.subs.reduce((s,x)=>s+x.level,0)/t.subs.length;
          const isOpen=exp===ti;
          return (
            <div key={t.id} style={{border:`1px solid ${isOpen?C.g+"44":C.border}`,borderRadius:8,overflow:"hidden",background:C.bg1}}>
              <div onClick={()=>setExp(isOpen?null:ti)}
                style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",
                  cursor:"pointer",userSelect:"none",background:isOpen?"#0a180a":"transparent",minHeight:52}}>
                <span style={{fontSize:20,flexShrink:0}}>{t.icon}</span>
                <span style={{flex:1,fontSize:12,color:"#fff",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.label}</span>
                <div style={{width:mobile?60:100,height:4,background:C.dim,borderRadius:2,flexShrink:0}}>
                  <div style={{width:`${(avg/4)*100}%`,height:"100%",borderRadius:2,
                    background:`linear-gradient(90deg,${C.g},${C.b})`,boxShadow:`0 0 4px ${C.g}33`}}/>
                </div>
                <span style={{fontFamily:"Orbitron",fontSize:10,color:C.g,width:30,textAlign:"right",flexShrink:0}}>{Math.round((avg/4)*100)}%</span>
                <span style={{color:C.muted,fontSize:11,marginLeft:4,flexShrink:0}}>{isOpen?"▾":"▸"}</span>
              </div>
              {isOpen&&(
                <div style={{padding:"10px 16px 16px",display:"grid",
                  gridTemplateColumns:mobile?"1fr 1fr":"repeat(auto-fill,minmax(180px,1fr))",gap:9}}>
                  {t.subs.map((s,si)=>(
                    <div key={si} className="fin" style={{background:C.bg2,
                      border:`1px solid ${LEVEL_COLOR[s.level]}44`,borderRadius:6,padding:"10px 12px",
                      animationDelay:`${si*.04}s`}}>
                      <div style={{fontSize:11,color:C.text,marginBottom:9,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.label}</div>
                      <div style={{display:"flex",gap:3,marginBottom:6}}>
                        {LEVELS.map((_,li)=>(
                          <div key={li} style={{flex:1,height:mobile?22:16,borderRadius:2,
                            background:s.level===li?LEVEL_COLOR[li]:C.dim,
                            boxShadow:s.level===li?`0 0 5px ${LEVEL_GLOW[li]}`:"none"}}/>
                        ))}
                      </div>
                      <div style={{fontSize:9,color:LEVEL_GLOW[s.level],letterSpacing:.5}}>{LEVELS[s.level]}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Topic grid overview */}
      <SLabel accent={C.o}>OVERVIEW</SLabel>
      <div style={{display:"grid",gridTemplateColumns:mobile?"repeat(2,1fr)":tablet?"repeat(4,1fr)":"repeat(4,1fr)",gap:10}}>
        {data.topics.map((t,i)=>{
          const avg=t.subs.reduce((s,x)=>s+x.level,0)/t.subs.length;
          const pct=Math.round((avg/4)*100);
          const ci=Math.min(4,Math.round(avg));
          return (
            <div key={i} style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:7,padding:"12px 14px"}}>
              <div style={{fontSize:20,marginBottom:6}}>{t.icon}</div>
              <div style={{fontSize:10,color:C.text,marginBottom:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.label}</div>
              <div style={{height:4,background:C.dim,borderRadius:2,marginBottom:5}}>
                <div style={{width:`${pct}%`,height:"100%",borderRadius:2,
                  background:`linear-gradient(90deg,${LEVEL_COLOR[ci]},${LEVEL_GLOW[ci]})`,transition:"width 1s"}}/>
              </div>
              <div style={{fontSize:9,color:C.muted}}>{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  BLOG
// ═══════════════════════════════════════════════════════════════════════════════
function BlogPage({data,mobile}){
  const [sel,setSel]=useState(null);
  if(sel) return (
    <div style={{maxWidth:760,margin:"0 auto",padding:mobile?"32px 16px":"64px 28px"}}>
      <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:C.muted,
        fontSize:11,marginBottom:24,display:"flex",alignItems:"center",gap:6}}>← BACK TO BLOG</button>
      <div style={{fontSize:9,color:C.muted,letterSpacing:2,marginBottom:6}}>{sel.category.toUpperCase()}</div>
      <h1 style={{fontFamily:"Orbitron",fontSize:mobile?18:24,color:"#fff",fontWeight:800,marginBottom:12,lineHeight:1.3}}>{sel.title}</h1>
      <div style={{display:"flex",gap:10,marginBottom:28,flexWrap:"wrap",alignItems:"center"}}>
        {sel.tags.map(t=><Tag key={t} c="#5a5aaa">#{t}</Tag>)}
        <span style={{fontSize:10,color:C.muted}}>{sel.readTime} min read</span>
        <span style={{fontSize:10,color:C.dim,marginLeft:"auto"}}>{new Date(sel.date).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</span>
      </div>
      <div style={{background:C.bg1,border:`1px solid ${C.border}`,borderRadius:8,padding:24,
        fontSize:13,color:"#667788",lineHeight:1.9}}>
        <p>{sel.excerpt}</p>
        <br/>
        <p style={{color:C.muted,fontSize:11,fontStyle:"italic"}}>
          Full blog content would be stored as markdown in MongoDB and rendered here with a markdown parser like react-markdown.
        </p>
      </div>
    </div>
  );

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:mobile?"32px 16px":"64px 28px"}}>
      <SLabel accent={C.p}>BLOG & NOTES</SLabel>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {data.posts.map((p,i)=>(
          <div key={p.id} className="fin" onClick={()=>setSel(p)}
            style={{background:C.bg1,border:`1px solid ${C.border}`,borderRadius:8,
              padding:"20px 22px",cursor:"pointer",transition:"all .2s",animationDelay:`${i*.07}s`}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.p+"55";e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap",marginBottom:8}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:"Orbitron",fontSize:13,color:"#fff",fontWeight:700,marginBottom:3}}>{p.title}</div>
                <div style={{fontSize:10,color:C.muted}}>{p.category}</div>
              </div>
              <div style={{display:"flex",gap:7,flexShrink:0,alignItems:"center"}}>
                <Tag c={C.p}>{p.readTime} min</Tag>
                <span style={{fontSize:10,color:C.dim}}>{new Date(p.date).toLocaleDateString("en-US",{month:"short",year:"numeric"})}</span>
              </div>
            </div>
            <p style={{fontSize:12,color:"#556677",lineHeight:1.7,marginBottom:12}}>{p.excerpt}</p>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {p.tags.map(t=><Tag key={t} c="#5a5aaa">#{t}</Tag>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CERTS
// ═══════════════════════════════════════════════════════════════════════════════
function CertsPage({data,mobile,tablet}){
  const roadmap=[
    {label:"eJPTv2 — Junior Penetration Tester",  done:true,  date:"2024", note:"Entry-level pen testing fundamentals"},
    {label:"PNPT — Practical Network Pen Test",    active:true,date:"2025", note:"Real-world external/internal pen test"},
    {label:"CRTP — Red Team Pro",                  date:"2025", note:"Active Directory attacks & defense"},
    {label:"OSED — Exploit Developer",             date:"2026", note:"Windows exploit development"},
    {label:"OSCP — Offensive Security CP",         date:"2026", note:"The gold standard cert"},
  ];
  return (
    <div style={{maxWidth:1000,margin:"0 auto",padding:mobile?"32px 16px":"64px 28px"}}>
      <SLabel accent="#f59e0b">CERTIFICATIONS</SLabel>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":tablet?"repeat(2,1fr)":"repeat(4,1fr)",gap:14,marginBottom:48}}>
        {data.certs.map((c,i)=>(
          <Card key={i} glow={c.color} style={{textAlign:"center",padding:"24px 16px"}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:c.color+"18",
              border:`2px solid ${c.color}44`,display:"flex",alignItems:"center",
              justifyContent:"center",fontSize:22,margin:"0 auto 14px"}}>🏆</div>
            <div style={{fontFamily:"Orbitron",fontSize:13,color:"#fff",fontWeight:800,marginBottom:5}}>{c.name}</div>
            <div style={{fontSize:10,color:C.muted,marginBottom:12}}>{c.issuer}</div>
            <Tag c={c.color}>{c.status}</Tag>
            <div style={{fontSize:9,color:C.dim,marginTop:8}}>{c.date}</div>
          </Card>
        ))}
      </div>

      <SLabel accent={C.muted}>LEARNING ROADMAP</SLabel>
      <div style={{display:"flex",flexDirection:"column",gap:0}}>
        {roadmap.map((r,i,arr)=>(
          <div key={i} style={{display:"flex",gap:16,alignItems:"flex-start"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0,width:20}}>
              <div style={{width:14,height:14,borderRadius:"50%",marginTop:3,flexShrink:0,
                background:r.done?C.g:r.active?C.o:C.border2,
                boxShadow:r.active?`0 0 10px ${C.o}`:r.done?`0 0 8px ${C.g}`:"none",
                border:r.active?`2px solid ${C.o}44`:"none"}}/>
              {i<arr.length-1&&<div style={{width:1,flex:1,background:C.border,minHeight:32}}/>}
            </div>
            <div style={{paddingBottom:22,flex:1}}>
              <div style={{fontSize:12,color:r.done?C.g:r.active?"#fff":C.muted,fontWeight:r.active?700:400}}>{r.label}</div>
              <div style={{fontSize:10,color:C.dim,marginTop:2}}>{r.note}</div>
              <div style={{fontSize:9,color:C.dim,marginTop:1}}>{r.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CONTACT
// ═══════════════════════════════════════════════════════════════════════════════
function ContactPage({data,mobile}){
  const [form,setForm]=useState({name:"",email:"",subject:"",message:""});
  const [sent,setSent]=useState(false);
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));

  if(sent) return (
    <div style={{maxWidth:600,margin:"0 auto",padding:"100px 28px",textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16}}>✅</div>
      <div style={{fontFamily:"Orbitron",fontSize:16,color:C.g,marginBottom:8}}>MESSAGE SENT</div>
      <div style={{fontSize:12,color:C.muted}}>Thanks for reaching out. I'll get back to you soon.</div>
      <div style={{marginTop:24}}><Btn onClick={()=>setSent(false)} sm outline>SEND ANOTHER</Btn></div>
    </div>
  );

  return (
    <div style={{maxWidth:760,margin:"0 auto",padding:mobile?"32px 16px":"64px 28px"}}>
      <SLabel accent={C.g}>GET IN TOUCH</SLabel>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:24}}>
        {/* Info */}
        <div>
          <p style={{fontSize:13,color:"#667788",lineHeight:1.9,marginBottom:28}}>
            Interested in collaboration, have a security question, or want to discuss a project? I'm always open to connect with fellow researchers and learners.
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {[
              {icon:"✉️",label:"Email",val:data.about.email},
              {icon:"🐙",label:"GitHub",val:data.about.github},
              {icon:"💼",label:"LinkedIn",val:data.about.linkedin},
            ].map(({icon,label,val})=>(
              <div key={label} style={{display:"flex",gap:10,alignItems:"center",
                background:C.bg2,border:`1px solid ${C.border}`,borderRadius:6,padding:"10px 13px"}}>
                <span style={{fontSize:16}}>{icon}</span>
                <div>
                  <div style={{fontSize:9,color:C.muted,letterSpacing:1}}>{label}</div>
                  <div style={{fontSize:11,color:C.text,marginTop:1}}>{val}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Form */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <div style={{fontSize:9,color:C.muted,letterSpacing:1.5,marginBottom:5}}>NAME</div>
            <Input value={form.name} onChange={e=>f("name",e.target.value)} placeholder="Your name"/>
          </div>
          <div>
            <div style={{fontSize:9,color:C.muted,letterSpacing:1.5,marginBottom:5}}>EMAIL</div>
            <Input value={form.email} onChange={e=>f("email",e.target.value)} placeholder="you@email.com" type="email"/>
          </div>
          <div>
            <div style={{fontSize:9,color:C.muted,letterSpacing:1.5,marginBottom:5}}>SUBJECT</div>
            <Input value={form.subject} onChange={e=>f("subject",e.target.value)} placeholder="Collaboration / Question / Other"/>
          </div>
          <div>
            <div style={{fontSize:9,color:C.muted,letterSpacing:1.5,marginBottom:5}}>MESSAGE</div>
            <Input value={form.message} onChange={e=>f("message",e.target.value)} placeholder="Your message..." multiline rows={5}/>
          </div>
          <Btn onClick={()=>setSent(true)} full disabled={!form.name||!form.email||!form.message}>
            SEND MESSAGE →
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN DASHBOARD — unified portfolio + tracker
// ═══════════════════════════════════════════════════════════════════════════════
function AdminDashboard({data,update,mobile,tablet}){
  const [authed,setAuthed]=useState(false);
  const [pw,setPw]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [section,setSection]=useState("overview");

  const login = async () => {
    if(!pw.trim()) return;
    setLoading(true); setErr("");
    try {
      const res = await fetch("/api/auth/login", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({password:pw}),
      });
      if(res.ok) setAuthed(true);
      else setErr("Wrong password. Try again.");
    } catch {
      setErr("Connection error. Try again.");
    }
    setLoading(false);
  };

  if(!authed) return (
    <div style={{minHeight:"80vh",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{width:"100%",maxWidth:380}}>
        <div style={{fontFamily:"Orbitron",fontSize:18,color:C.o,textAlign:"center",letterSpacing:2,marginBottom:6}}>ADMIN ACCESS</div>
        <div style={{fontSize:10,color:C.muted,textAlign:"center",marginBottom:28,letterSpacing:1}}>ENTER PASSWORD TO CONTINUE</div>
        <Card>
          <div style={{fontSize:9,color:C.muted,letterSpacing:1.5,marginBottom:5}}>PASSWORD</div>
          <Input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr("");}}
            placeholder="Admin password"
            style={{marginBottom:err?8:14}} onKeyDown={e=>e.key==="Enter"&&login()}/>
          {err&&<div style={{fontSize:11,color:C.r,marginBottom:12,textAlign:"center"}}>{err}</div>}
          <Btn onClick={login} accent={C.o} full disabled={loading}>
            {loading?"CHECKING...":"AUTHENTICATE →"}
          </Btn>
        </Card>
      </div>
    </div>
  );

  const SECTIONS=[
    {id:"overview",  label:"OVERVIEW",   icon:"◈",  accent:C.g},
    {id:"projects",  label:"PROJECTS",   icon:"🛠️", accent:C.g},
    {id:"writeups",  label:"WRITEUPS",   icon:"📄", accent:C.b},
    {id:"blog",      label:"BLOG",       icon:"📝", accent:C.p},
    {id:"certs",     label:"CERTS",      icon:"🏆", accent:"#f59e0b"},
    {id:"about",     label:"ABOUT",      icon:"👤", accent:C.muted},
    {id:"stats",     label:"STATS",      icon:"📊", accent:C.o},
    {id:"tracker",   label:"TRACKER",    icon:"🧠", accent:C.g},
    {id:"skillmap",  label:"SKILL MAP",  icon:"⚙️", accent:C.o},
  ];

  return (
    <div style={{display:"flex",minHeight:"calc(100vh - 54px)"}}>
      {/* Sidebar */}
      {!mobile&&(
        <aside style={{width:196,background:C.bg1,borderRight:`1px solid ${C.border}`,
          padding:"16px 0",flexShrink:0,position:"sticky",top:54,height:"calc(100vh - 54px)",overflowY:"auto"}}>
          <div style={{fontSize:8,color:C.muted,letterSpacing:2,padding:"0 14px",marginBottom:10}}>NAVIGATION</div>
          {SECTIONS.map(({id,label,icon,accent})=>(
            <button key={id} onClick={()=>setSection(id)} style={{
              width:"100%",background:section===id?accent+"12":"transparent",
              border:"none",borderLeft:section===id?`2px solid ${accent}`:"2px solid transparent",
              color:section===id?accent:C.muted,
              padding:"10px 14px",textAlign:"left",fontSize:10,letterSpacing:.8,
              display:"flex",gap:9,alignItems:"center",transition:"all .15s"
            }}><span>{icon}</span>{label}</button>
          ))}
        </aside>
      )}

      {/* Mobile tabs */}
      {mobile&&(
        <div style={{position:"sticky",top:54,left:0,right:0,zIndex:100,
          background:C.bg1,borderBottom:`1px solid ${C.border}`,
          display:"flex",overflowX:"auto",padding:"8px",gap:6,flexShrink:0}}>
          {SECTIONS.map(({id,label,icon,accent})=>(
            <button key={id} onClick={()=>setSection(id)} style={{
              background:section===id?accent+"15":"transparent",
              border:`1px solid ${section===id?accent:C.border}`,
              color:section===id?accent:C.muted,
              padding:"6px 10px",borderRadius:4,fontSize:9,whiteSpace:"nowrap"
            }}>{icon} {label}</button>
          ))}
        </div>
      )}

      {/* Content */}
      <main style={{flex:1,padding:mobile?"14px":"22px",overflowY:"auto",minWidth:0}}>
        {section==="overview"  && <AOverview  data={data}/>}
        {section==="projects"  && <AProjects  data={data} update={update} mobile={mobile}/>}
        {section==="writeups"  && <AWriteups  data={data} update={update} mobile={mobile}/>}
        {section==="blog"      && <ABlog      data={data} update={update} mobile={mobile}/>}
        {section==="certs"     && <ACerts     data={data} update={update} mobile={mobile}/>}
        {section==="about"     && <AAbout     data={data} update={update} mobile={mobile}/>}
        {section==="stats"     && <AStats     data={data} update={update} mobile={mobile}/>}
        {section==="tracker"   && <ATracker   data={data} update={update} mobile={mobile}/>}
        {section==="skillmap"  && <ASkillMap  data={data} update={update} mobile={mobile}/>}
      </main>
    </div>
  );
}

// ── Admin Overview ────────────────────────────────────────────────────────────
function AOverview({data}){
  const weakTopics=[];
  data.topics.forEach(t=>t.subs.forEach(s=>{if(s.level<=1)weakTopics.push({topic:t.label,sub:s.label,level:s.level});}));
  const correctRate=data.quizzes.length?Math.round((data.quizzes.filter(q=>q.correct).length/data.quizzes.length)*100):0;

  return (
    <div>
      <ATitleBar label="OVERVIEW"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:20}}>
        {[
          {label:"Projects",    val:data.projects.length,  c:C.g},
          {label:"Writeups",    val:data.writeups.length,  c:C.b},
          {label:"Blog Posts",  val:data.posts.length,     c:C.p},
          {label:"Certs",       val:data.certs.length,     c:"#f59e0b"},
          {label:"Quiz Q&As",   val:data.quizzes.length,   c:C.o},
          {label:"Quiz Accuracy",val:`${correctRate}%`,   c:correctRate>=70?C.g:C.r},
          {label:"Log Entries", val:data.entries.length,   c:C.g},
          {label:"Weak Topics", val:weakTopics.length,     c:C.r},
        ].map(({label,val,c})=>(
          <Card key={label} glow={c} style={{padding:"12px 14px"}}>
            <div style={{fontSize:8,color:C.muted,letterSpacing:1.5,marginBottom:3}}>{label}</div>
            <div style={{fontFamily:"Orbitron",fontSize:22,color:c,fontWeight:700}}>{val}</div>
          </Card>
        ))}
      </div>
      {weakTopics.length>0&&(
        <Card style={{marginBottom:14}}>
          <div style={{fontSize:9,color:C.r,letterSpacing:2,marginBottom:12}}>⚠ TOP WEAK SPOTS</div>
          {weakTopics.slice(0,5).map((w,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",
              padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:11,color:C.text}}>{w.sub} <span style={{color:C.muted,fontSize:9}}>({w.topic})</span></span>
              <Tag c={C.r}>{LEVELS[w.level]}</Tag>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── Admin helper components ───────────────────────────────────────────────────
const ATitleBar = ({label,children})=>(
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:8}}>
    <span style={{fontFamily:"Orbitron",fontSize:12,color:C.o,letterSpacing:2}}>{label}</span>
    <div style={{display:"flex",gap:8}}>{children}</div>
  </div>
);

function AForm({fields,initial,onSave,onCancel,mobile}){
  const [vals,setVals]=useState(()=>{
    const v={}; fields.forEach(f=>v[f.key]=initial?.[f.key]??f.default??""); return v;
  });
  const f=(k,v)=>setVals(p=>({...p,[k]:v}));
  return (
    <Card style={{marginBottom:14,border:`1px solid ${C.g}33`}}>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:11,marginBottom:13}}>
        {fields.map(({key,label,type,full,opts,placeholder})=>(
          <div key={key} style={full?{gridColumn:"1/-1"}:{}}>
            <div style={{fontSize:9,color:C.muted,letterSpacing:1.5,marginBottom:4}}>{label}</div>
            {type==="textarea"  ? <Input multiline rows={3} value={vals[key]} onChange={e=>f(key,e.target.value)} placeholder={placeholder}/>
            :type==="select"    ? <Select value={vals[key]} onChange={e=>f(key,e.target.value)} options={opts}/>
            :<Input type={type||"text"} value={vals[key]} onChange={e=>f(key,e.target.value)} placeholder={placeholder||""}/>}
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:9}}>
        <Btn sm onClick={()=>onSave(vals)}>SAVE</Btn>
        <Btn sm accent={C.r} onClick={onCancel}>CANCEL</Btn>
      </div>
    </Card>
  );
}

function AList({items,renderRow}){
  if(!items.length) return <div style={{color:C.dim,textAlign:"center",padding:"28px 0",border:`1px dashed ${C.border}`,borderRadius:7,fontSize:11}}>Nothing here yet.</div>;
  return <div style={{display:"flex",flexDirection:"column",gap:7}}>{items.map((item,i)=>renderRow(item,i))}</div>;
}

function ARow({title,sub,tags,onEdit,onDelete,accent}){
  return (
    <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:6,
      padding:"11px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12,color:"#fff",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</div>
        {sub&&<div style={{fontSize:10,color:C.muted,marginTop:2}}>{sub}</div>}
        {tags&&<div style={{display:"flex",gap:5,marginTop:5,flexWrap:"wrap"}}>{tags.map((t,i)=><Tag key={i} c={accent||C.b}>{t}</Tag>)}</div>}
      </div>
      <div style={{display:"flex",gap:7,flexShrink:0}}>
        {onEdit&&<Btn sm outline accent={C.b} onClick={onEdit}>EDIT</Btn>}
        {onDelete&&<Btn sm outline accent={C.r} onClick={onDelete}>DEL</Btn>}
      </div>
    </div>
  );
}

// ── Projects ──────────────────────────────────────────────────────────────────
function AProjects({data,update,mobile}){
  const [adding,setAdding]=useState(false);
  const [editing,setEditing]=useState(null);
  const fields=[
    {key:"title",      label:"TITLE",    full:true, placeholder:"PE Analyzer"},
    {key:"desc",       label:"DESCRIPTION",type:"textarea",full:true},
    {key:"tech",       label:"TECH (comma separated)", placeholder:"Python, pefile, YARA"},
    {key:"category",   label:"CATEGORY", type:"select",opts:["Tool","Research","CTF","Other"]},
    {key:"github",     label:"GITHUB URL"},
    {key:"demo",       label:"DEMO URL"},
  ];
  const add=(v)=>{
    update(d=>({...d,projects:[...d.projects,{...v,id:Date.now(),tech:v.tech.split(",").map(t=>t.trim()).filter(Boolean),featured:false}]}));
    setAdding(false);
  };
  const del=(id)=>update(d=>({...d,projects:d.projects.filter(p=>p.id!==id)}));
  return (
    <div>
      <ATitleBar label="PROJECTS">
        <Btn sm onClick={()=>setAdding(true)}>+ ADD</Btn>
      </ATitleBar>
      {adding&&<AForm fields={fields} onSave={add} onCancel={()=>setAdding(false)} mobile={mobile}/>}
      <AList items={data.projects} renderRow={(p)=>(
        <ARow key={p.id} title={p.title} sub={p.category}
          tags={p.tech} accent={C.b}
          onDelete={()=>del(p.id)}/>
      )}/>
    </div>
  );
}

// ── Writeups ──────────────────────────────────────────────────────────────────
function AWriteups({data,update,mobile}){
  const [adding,setAdding]=useState(false);
  const fields=[
    {key:"title",     label:"TITLE",full:true, placeholder:"HTB — Challenge Name"},
    {key:"summary",   label:"SUMMARY",type:"textarea",full:true},
    {key:"category",  label:"CATEGORY",type:"select",opts:CATS.slice(0,5)},
    {key:"difficulty",label:"DIFFICULTY",type:"select",opts:["Easy","Medium","Hard","Insane"]},
    {key:"url",       label:"URL (optional)"},
    {key:"tags",      label:"TAGS (comma separated)", placeholder:"rop, anti-debug, PE"},
  ];
  const add=(v)=>{
    update(d=>({...d,writeups:[{...v,id:Date.now(),date:new Date().toISOString().split("T")[0],tags:v.tags.split(",").map(t=>t.trim()).filter(Boolean)},...d.writeups]}));
    setAdding(false);
  };
  const del=(id)=>update(d=>({...d,writeups:d.writeups.filter(w=>w.id!==id)}));
  return (
    <div>
      <ATitleBar label="WRITEUPS">
        <Btn sm accent={C.b} onClick={()=>setAdding(true)}>+ ADD</Btn>
      </ATitleBar>
      {adding&&<AForm fields={fields} onSave={add} onCancel={()=>setAdding(false)} mobile={mobile}/>}
      <AList items={data.writeups} renderRow={(w)=>(
        <ARow key={w.id} title={w.title} sub={`${w.category} · ${w.date}`}
          tags={[w.difficulty]} accent={DIFF_COLOR[w.difficulty]} onDelete={()=>del(w.id)}/>
      )}/>
    </div>
  );
}

// ── Blog ──────────────────────────────────────────────────────────────────────
function ABlog({data,update,mobile}){
  const [adding,setAdding]=useState(false);
  const fields=[
    {key:"title",    label:"TITLE",full:true},
    {key:"excerpt",  label:"EXCERPT",type:"textarea",full:true},
    {key:"category", label:"CATEGORY",type:"select",opts:CATS},
    {key:"readTime", label:"READ TIME (minutes)", placeholder:"8"},
    {key:"tags",     label:"TAGS (comma separated)"},
  ];
  const add=(v)=>{
    update(d=>({...d,posts:[{...v,id:Date.now(),date:new Date().toISOString().split("T")[0],readTime:+v.readTime||5,tags:v.tags.split(",").map(t=>t.trim()).filter(Boolean)},...d.posts]}));
    setAdding(false);
  };
  const del=(id)=>update(d=>({...d,posts:d.posts.filter(p=>p.id!==id)}));
  return (
    <div>
      <ATitleBar label="BLOG POSTS">
        <Btn sm accent={C.p} onClick={()=>setAdding(true)}>+ ADD</Btn>
      </ATitleBar>
      {adding&&<AForm fields={fields} onSave={add} onCancel={()=>setAdding(false)} mobile={mobile}/>}
      <AList items={data.posts} renderRow={(p)=>(
        <ARow key={p.id} title={p.title} sub={`${p.category} · ${p.readTime}min · ${p.date}`}
          tags={p.tags} accent={C.p} onDelete={()=>del(p.id)}/>
      )}/>
    </div>
  );
}

// ── Certs ─────────────────────────────────────────────────────────────────────
function ACerts({data,update,mobile}){
  const [adding,setAdding]=useState(false);
  const fields=[
    {key:"name",   label:"CERT NAME",      placeholder:"eJPTv2"},
    {key:"issuer", label:"ISSUER",         placeholder:"eLearnSecurity"},
    {key:"date",   label:"DATE",           placeholder:"2025"},
    {key:"status", label:"STATUS",type:"select",opts:["Earned","In Progress","Planned"]},
  ];
  const COLORS={"Earned":C.g,"In Progress":C.o,"Planned":"#6a7aaa"};
  const add=(v)=>{
    update(d=>({...d,certs:[...d.certs,{...v,id:Date.now(),color:COLORS[v.status]||C.g}]}));
    setAdding(false);
  };
  const del=(id)=>update(d=>({...d,certs:d.certs.filter(c=>c.id!==id)}));
  return (
    <div>
      <ATitleBar label="CERTIFICATIONS">
        <Btn sm accent="#f59e0b" onClick={()=>setAdding(true)}>+ ADD</Btn>
      </ATitleBar>
      {adding&&<AForm fields={fields} onSave={add} onCancel={()=>setAdding(false)} mobile={mobile}/>}
      <AList items={data.certs} renderRow={(c)=>(
        <ARow key={c.id} title={c.name} sub={`${c.issuer} · ${c.date}`}
          tags={[c.status]} accent={c.color} onDelete={()=>del(c.id)}/>
      )}/>
    </div>
  );
}

// ── About editor ──────────────────────────────────────────────────────────────
function AAbout({data,update,mobile}){
  const [vals,setVals]=useState({...data.about,
    focusAreas:data.about.focusAreas.join(", "),
    tools:data.about.tools.join(", "),
  });
  const f=(k,v)=>setVals(p=>({...p,[k]:v}));
  const save=()=>update(d=>({...d,about:{...vals,
    focusAreas:vals.focusAreas.split(",").map(s=>s.trim()).filter(Boolean),
    tools:vals.tools.split(",").map(s=>s.trim()).filter(Boolean),
  }}));
  return (
    <div>
      <ATitleBar label="EDIT ABOUT"/>
      <Card>
        <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:11,marginBottom:13}}>
          {[
            {k:"name",     l:"FULL NAME"},
            {k:"title",    l:"TAGLINE / TITLE"},
            {k:"location", l:"LOCATION"},
            {k:"email",    l:"EMAIL"},
            {k:"github",   l:"GITHUB"},
            {k:"linkedin", l:"LINKEDIN"},
          ].map(({k,l})=>(
            <div key={k}>
              <div style={{fontSize:9,color:C.muted,letterSpacing:1.5,marginBottom:4}}>{l}</div>
              <Input value={vals[k]} onChange={e=>f(k,e.target.value)}/>
            </div>
          ))}
          <div style={{gridColumn:"1/-1"}}>
            <div style={{fontSize:9,color:C.muted,letterSpacing:1.5,marginBottom:4}}>BIO</div>
            <Input multiline rows={4} value={vals.bio} onChange={e=>f("bio",e.target.value)}/>
          </div>
          <div style={{gridColumn:"1/-1"}}>
            <div style={{fontSize:9,color:C.muted,letterSpacing:1.5,marginBottom:4}}>FOCUS AREAS (comma separated)</div>
            <Input value={vals.focusAreas} onChange={e=>f("focusAreas",e.target.value)}/>
          </div>
          <div style={{gridColumn:"1/-1"}}>
            <div style={{fontSize:9,color:C.muted,letterSpacing:1.5,marginBottom:4}}>TOOLS (comma separated)</div>
            <Input value={vals.tools} onChange={e=>f("tools",e.target.value)}/>
          </div>
        </div>
        <Btn sm onClick={save}>SAVE CHANGES</Btn>
      </Card>
    </div>
  );
}

// ── Stats editor ──────────────────────────────────────────────────────────────
function AStats({data,update,mobile}){
  const [vals,setVals]=useState({...data.stats});
  const f=(k,v)=>setVals(p=>({...p,[k]:v}));
  const save=()=>update(d=>({...d,stats:{...vals,ctfs:+vals.ctfs,writeups:+vals.writeups,tools:+vals.tools,certs:+vals.certs,streak:+vals.streak,solved:+vals.solved}}));
  const labels={ctfs:"CTFs Played",writeups:"Writeups Published",tools:"Tools Built",certs:"Certs Earned",streak:"Day Streak",solved:"Challenges Solved"};
  return (
    <div>
      <ATitleBar label="CTF STATS & ACHIEVEMENTS"/>
      <Card>
        <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":"repeat(3,1fr)",gap:11,marginBottom:13}}>
          {Object.keys(vals).map(k=>(
            <div key={k}>
              <div style={{fontSize:9,color:C.muted,letterSpacing:1.5,marginBottom:4}}>{labels[k]||k.toUpperCase()}</div>
              <Input type="number" value={vals[k]} onChange={e=>f(k,e.target.value)}/>
            </div>
          ))}
        </div>
        <Btn sm onClick={save}>SAVE STATS</Btn>
      </Card>
    </div>
  );
}

// ── Tracker (learning entries + quizzes) ──────────────────────────────────────
function ATracker({data,update,mobile}){
  const [tab,setTab]=useState("entries");
  const [addingE,setAddE]=useState(false);
  const [addingQ,setAddQ]=useState(false);

  const eFields=[
    {key:"title",   label:"TITLE",full:true,placeholder:"What did you learn?"},
    {key:"type",    label:"TYPE",type:"select",opts:["Note","Video","Article","Course","Lab","Tool","Concept","Other"]},
    {key:"category",label:"CATEGORY",type:"select",opts:CATS},
    {key:"url",     label:"SOURCE URL"},
    {key:"notes",   label:"NOTES",type:"textarea",full:true},
    {key:"tags",    label:"TAGS (comma separated)"},
  ];
  const qFields=[
    {key:"question",  label:"QUESTION",type:"textarea",full:true,placeholder:"What is the TEB? How does ASLR work?"},
    {key:"answer",    label:"ANSWER",type:"textarea",full:true,placeholder:"Your answer..."},
    {key:"category",  label:"CATEGORY",type:"select",opts:CATS},
    {key:"correct",   label:"RESULT",type:"select",opts:["Untested","Correct","Wrong"]},
    {key:"confidence",label:"CONFIDENCE",type:"select",opts:["1","2","3","4","5"]},
    {key:"notes",     label:"NOTES",placeholder:"Extra context..."},
  ];

  const addEntry=(v)=>{
    update(d=>({...d,entries:[{...v,id:Date.now(),date:new Date().toISOString(),tags:v.tags?.split(",").map(s=>s.trim()).filter(Boolean)||[]},...d.entries]}));
    setAddE(false);
  };
  const addQuiz=(v)=>{
    const correctMap={"Correct":true,"Wrong":false,"Untested":null};
    update(d=>({...d,quizzes:[{...v,id:Date.now(),date:new Date().toISOString(),correct:correctMap[v.correct],confidence:+v.confidence},...d.quizzes]}));
    setAddQ(false);
  };
  const delEntry=(id)=>update(d=>({...d,entries:d.entries.filter(e=>e.id!==id)}));
  const delQuiz=(id)=>update(d=>({...d,quizzes:d.quizzes.filter(q=>q.id!==id)}));

  const nC=data.quizzes.filter(q=>q.correct===true).length;
  const nW=data.quizzes.filter(q=>q.correct===false).length;
  const nU=data.quizzes.filter(q=>q.correct===null).length;

  return (
    <div>
      <ATitleBar label="CYBERTRACK LEARNING TRACKER"/>
      <div style={{display:"flex",gap:7,marginBottom:18}}>
        <Chip active={tab==="entries"} onClick={()=>setTab("entries")}>📝 LOG ({data.entries.length})</Chip>
        <Chip active={tab==="quizzes"} onClick={()=>setTab("quizzes")} accent={C.o}>❓ QUIZ ({data.quizzes.length})</Chip>
      </div>

      {tab==="entries"&&(
        <>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
            <Btn sm onClick={()=>setAddE(true)}>+ NEW ENTRY</Btn>
          </div>
          {addingE&&<AForm fields={eFields} onSave={addEntry} onCancel={()=>setAddE(false)} mobile={mobile}/>}
          <AList items={data.entries} renderRow={(e)=>(
            <ARow key={e.id} title={e.title}
              sub={`${e.type} · ${e.category} · ${new Date(e.date).toLocaleDateString()}`}
              tags={e.tags} accent={C.g}
              onDelete={()=>delEntry(e.id)}/>
          )}/>
        </>
      )}

      {tab==="quizzes"&&(
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div style={{fontSize:10,color:C.muted}}>
              <span style={{color:C.g,marginRight:10}}>✓ {nC}</span>
              <span style={{color:C.r,marginRight:10}}>✗ {nW}</span>
              <span>? {nU}</span>
            </div>
            <Btn sm accent={C.o} onClick={()=>setAddQ(true)}>+ ADD Q&A</Btn>
          </div>
          {addingQ&&<AForm fields={qFields} onSave={addQuiz} onCancel={()=>setAddQ(false)} mobile={mobile}/>}
          <AList items={data.quizzes} renderRow={(q)=>(
            <ARow key={q.id}
              title={q.question.slice(0,80)+(q.question.length>80?"...":"")}
              sub={`${q.category} · confidence ${q.confidence}/5`}
              tags={[q.correct===true?"✅ Correct":q.correct===false?"❌ Wrong":"❓ Untested"]}
              accent={q.correct===true?C.g:q.correct===false?C.r:C.muted}
              onDelete={()=>delQuiz(q.id)}/>
          )}/>
        </>
      )}
    </div>
  );
}

// ── Skill Map editor ──────────────────────────────────────────────────────────
function ASkillMap({data,update,mobile}){
  const [exp,setExp]=useState(null);
  const setLevel=(ti,si,lv)=>{
    update(d=>({...d,topics:d.topics.map((t,i)=>i!==ti?t:{...t,
      subs:t.subs.map((s,j)=>j!==si?s:{...s,level:lv})})}));
  };

  return (
    <div>
      <ATitleBar label="SKILLS MAP EDITOR"/>
      <div style={{fontSize:10,color:C.muted,marginBottom:14}}>
        Click a topic to expand. Tap level 0–4 to set mastery. Changes save instantly.
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {data.topics.map((t,ti)=>{
          const avg=t.subs.reduce((s,x)=>s+x.level,0)/t.subs.length;
          const isOpen=exp===ti;
          return (
            <div key={t.id} style={{border:`1px solid ${isOpen?C.g+"44":C.border}`,borderRadius:7,overflow:"hidden",background:C.bg1}}>
              <div onClick={()=>setExp(isOpen?null:ti)}
                style={{display:"flex",alignItems:"center",gap:11,padding:"12px 14px",cursor:"pointer",userSelect:"none",background:isOpen?"#0a160a":"transparent"}}>
                <span style={{fontSize:18,flexShrink:0}}>{t.icon}</span>
                <span style={{flex:1,fontSize:12,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.label}</span>
                <div style={{width:80,height:3,background:C.dim,borderRadius:2,flexShrink:0}}>
                  <div style={{width:`${(avg/4)*100}%`,height:"100%",borderRadius:2,background:`linear-gradient(90deg,${C.g},${C.b})`}}/>
                </div>
                <span style={{fontFamily:"Orbitron",fontSize:9,color:C.g,width:28,textAlign:"right",flexShrink:0}}>{Math.round((avg/4)*100)}%</span>
                <span style={{color:C.muted,flexShrink:0,marginLeft:4}}>{isOpen?"▾":"▸"}</span>
              </div>
              {isOpen&&(
                <div style={{padding:"8px 14px 14px",display:"grid",
                  gridTemplateColumns:mobile?"1fr 1fr":"repeat(auto-fill,minmax(175px,1fr))",gap:8}}>
                  {t.subs.map((s,si)=>(
                    <div key={si} className="fin" style={{background:C.bg2,
                      border:`1px solid ${LEVEL_COLOR[s.level]}44`,borderRadius:6,padding:"9px 11px",
                      animationDelay:`${si*.04}s`}}>
                      <div style={{fontSize:11,color:C.text,marginBottom:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.label}</div>
                      <div style={{display:"flex",gap:3}}>
                        {LEVELS.map((_,li)=>(
                          <button key={li} onClick={()=>setLevel(ti,si,li)} style={{
                            flex:1,height:mobile?26:18,border:"none",borderRadius:2,
                            background:s.level===li?LEVEL_COLOR[li]:C.dim,
                            boxShadow:s.level===li?`0 0 5px ${LEVEL_GLOW[li]}`:"none",
                            transition:"all .15s",color:s.level===li?"#fff":"#3a4a3a",fontSize:8
                          }}>{li}</button>
                        ))}
                      </div>
                      <div style={{fontSize:9,color:LEVEL_GLOW[s.level],marginTop:5,letterSpacing:.5}}>{LEVELS[s.level]}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(App), { ssr: false });