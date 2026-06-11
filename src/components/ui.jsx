// ─── STRUCTO ERP — SHARED UI COMPONENTS ──────────────────────────────────────
import React from "react";
import { T, css } from "../theme.js";

export const Badge = ({ children, color="blue" }) => {
  const C = { blue:{bg:"#DBEAFE",text:"#1E40AF"}, green:{bg:"#DCFCE7",text:"#166534"}, amber:{bg:"#FEF3C7",text:"#92400E"}, red:{bg:"#FEE2E2",text:"#991B1B"}, gray:{bg:"#F1F5F9",text:"#475569"}, gold:{bg:"#FEF3C7",text:"#92400E"}, purple:{bg:"#EDE9FE",text:"#5B21B6"}, teal:{bg:"#CFFAFE",text:"#155E75"} };
  const c=C[color]||C.blue;
  return <span style={{ background:c.bg, color:c.text, borderRadius:4, padding:"2px 7px", fontSize:11, fontWeight:700, letterSpacing:"0.03em", whiteSpace:"nowrap" }}>{children}</span>;
};

export const StatCard = ({ label, value, sub, color=T.accent }) => (
  <div style={{ ...css.card, flex:1, minWidth:130 }}>
    <div style={{ fontSize:10, color:T.textMid, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:24, fontWeight:700, color, fontFamily:T.fontMono, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textLow, marginTop:4 }}>{sub}</div>}
  </div>
);

export const Modal = ({ title, onClose, children, width=660 }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
    <div style={{ background:T.bgCard, border:`1px solid ${T.borderHi}`, borderRadius:12, width:"100%", maxWidth:width, maxHeight:"92vh", overflow:"hidden", display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
        <div style={{ fontSize:15, fontWeight:700, color:T.text }}>{title}</div>
        <button onClick={onClose} style={{ ...css.btn.ghost, fontSize:16, padding:"2px 8px", color:T.textMid }}>✕</button>
      </div>
      <div style={{ padding:18, overflowY:"auto", flex:1 }}>{children}</div>
    </div>
  </div>
);

export const Field = ({ label, children, required }) => (
  <div style={{ marginBottom:12 }}>
    <label style={css.label}>{label}{required&&<span style={{color:T.red}}> *</span>}</label>
    {children}
  </div>
);

export const Input = (p) => <input {...p} style={{ ...css.input, ...p.style }} />;
export const Sel = ({ children, ...p }) => <select {...p} style={{ ...css.input, ...p.style }}>{children}</select>;
export const Textarea = (p) => <textarea {...p} style={{ ...css.input, minHeight:64, resize:"vertical", ...p.style }} />;

export const G2 = ({ children, style }) => <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, ...style }}>{children}</div>;
export const G3 = ({ children }) => <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>{children}</div>;

export const SectionHd = ({ title, action, sub, children }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
    <div>
      <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{title||children}</div>
      {sub && <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>{sub}</div>}
    </div>
    {action}
  </div>
);

export const TH = ({ children, right, mono }) => (
  <th style={{ padding:"7px 10px", textAlign:right?"right":"left", fontSize:10, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:"0.04em", borderBottom:`2px solid ${T.borderHi}`, background:T.bgInput, whiteSpace:"nowrap", fontFamily:mono?T.fontMono:T.font }}>{children}</th>
);

export const TD = ({ children, right, mono, bold, color, style:s }) => (
  <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, textAlign:right?"right":"left", fontFamily:mono?T.fontMono:T.font, fontWeight:bold?700:400, color:color||T.text, ...s }}>{children}</td>
);

export const InfoBanner = ({ color="amber", children }) => {
  const C = { amber:{bg:T.amberBg,border:T.amber,text:"#92400E"}, green:{bg:T.greenBg,border:T.green,text:"#065F46"}, red:{bg:T.redBg,border:T.redLo,text:"#991B1B"}, blue:{bg:"#DBEAFE",border:T.borderHi,text:"#1E40AF"} };
  const c=C[color]||C.amber;
  return <div style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:6, padding:"10px 14px", fontSize:12, color:c.text, marginBottom:14 }}>{children}</div>;
};

export const MField = ({ label, children, required }) => (
  <div style={{ marginBottom:14 }}>
    <label style={css.label}>{label}{required&&<span style={{color:T.red}}> *</span>}</label>
    {children}
  </div>
);

export const TabBar2 = ({ tabs, active, onChange }) => (
  <div style={{ display:"flex", gap:2, borderBottom:`1px solid ${T.border}`, marginBottom:20, overflowX:"auto" }}>
    {tabs.map(t => (
      <button key={t.id} onClick={()=>onChange(t.id)} style={{ padding:"10px 14px", fontSize:12, fontWeight:active===t.id?700:500, color:active===t.id?T.accent:T.textMid, background:"transparent", border:"none", borderBottom:active===t.id?`2px solid ${T.accent}`:"2px solid transparent", cursor:"pointer", fontFamily:T.font, whiteSpace:"nowrap" }}>{t.label}</button>
    ))}
  </div>
);

export const Row2 = ({ label, value, mono }) => (
  <div style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${T.border}` }}>
    <span style={{ fontSize:12, color:T.textMid }}>{label}</span>
    <span style={{ fontSize:13, color:T.text, fontFamily:mono?T.fontMono:T.font, fontWeight:500 }}>{value||"—"}</span>
  </div>
);
