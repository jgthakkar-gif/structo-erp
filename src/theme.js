// ─── STRUCTO ERP — DESIGN TOKENS ─────────────────────────────────────────────
export const T = {
  bg:"#F8FAFC", bgCard:"#FFFFFF", bgHover:"#F1F5F9", bgInput:"#F1F5F9",
  bgSidebar:"#1E3A5F", bgSidebarActive:"rgba(59,130,246,0.18)",
  border:"#E2E8F0", borderHi:"#CBD5E1",
  accent:"#1D4ED8", accentLo:"#1E40AF", accentHi:"#3B82F6",
  gold:"#D97706", goldLo:"#B45309",
  green:"#15803D", greenLo:"#166534", greenBg:"#DCFCE7",
  red:"#DC2626", redLo:"#991B1B", redBg:"#FEE2E2",
  amber:"#B45309", amberBg:"#FEF3C7",
  text:"#0F172A", textMid:"#475569", textLow:"#94A3B8",
  sidebarText:"#93C5FD", sidebarTextActive:"#FFFFFF",
  surface2:"#F1F5F9",
  font:"'IBM Plex Sans', sans-serif", fontMono:"'IBM Plex Mono', monospace",
};

export const css = {
  card:  { background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:8, padding:16 },
  input: { background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:6, color:T.text, padding:"7px 11px", fontSize:13, fontFamily:T.font, width:"100%", outline:"none", boxSizing:"border-box" },
  label: { fontSize:10, color:T.textMid, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:3, display:"block" },
  btn:{
    primary:   { background:T.accent,  color:"#fff",     border:"none",                     borderRadius:6, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:T.font },
    secondary: { background:"transparent", color:T.textMid, border:`1px solid ${T.border}`, borderRadius:6, padding:"7px 14px", fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:T.font },
    danger:    { background:T.redLo,   color:T.red,      border:`1px solid ${T.redLo}`,     borderRadius:6, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:T.font },
    ghost:     { background:"transparent", color:T.textLow, border:"none",                  borderRadius:4, padding:"4px 8px",  fontSize:11, cursor:"pointer", fontFamily:T.font },
    sm:        { background:T.accent,  color:"#fff",     border:"none",                     borderRadius:4, padding:"4px 10px", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:T.font },
    amber:     { background:"#D97706", color:"#fff",      border:"none",                    borderRadius:6, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:T.font },
    green:     { background:"#15803D", color:"#fff",      border:"none",                    borderRadius:6, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:T.font },
  },
};
