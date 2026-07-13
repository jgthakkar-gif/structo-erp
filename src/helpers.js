// ─── STRUCTO ERP — SHARED HELPERS ────────────────────────────────────────────

// ── Formatters ────────────────────────────────────────────────────────────────
export const fmt = {
  num:      (n) => new Intl.NumberFormat("en-IN").format(n||0),
  currency: (n) => `₹${new Intl.NumberFormat("en-IN",{maximumFractionDigits:0}).format(n||0)}`,
  date:     (d) => d ? new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—",
  wt:       (n) => `${new Intl.NumberFormat("en-IN",{maximumFractionDigits:2}).format(n||0)} kg`,
  wtT:      (n) => `${((n||0)/1000).toFixed(3)} T`,
  initials: (n) => (n||"").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),
};

export const today = () => new Date().toISOString().slice(0,10);

// ── Financial Year ─────────────────────────────────────────────────────────────
export const getFinancialYear = (date) => {
  const d = date || new Date();
  const month = d.getMonth();
  const year = d.getFullYear();
  if (month >= 3) {
    return `${String(year).slice(-2)}-${String(year+1).slice(-2)}`;
  } else {
    return `${String(year-1).slice(-2)}-${String(year).slice(-2)}`;
  }
};

export const genOrderId = (company) => {
  const prefix = company?.orderPrefix || "FXL";
  const fy = getFinancialYear(new Date());
  const nextNo = company?.orderNextNo || 1;
  return `${prefix}${fy}/${String(nextNo).padStart(4,"0")}`;
};

// ── Material Code Helpers ──────────────────────────────────────────────────────
export const normMatCode = mc => (mc||"").toUpperCase().trim()
  .replace(/\s+/g,"")
  .replace(/[×*]/g,"X")
  .replace(/(\d)MM$/,"$1")
  .replace(/\/(\d+)MM\//g,"/$1/");

export const normSize = s => (s||"").toUpperCase().trim()
  .replace(/\s+/g,"")
  .replace(/[×*]/g,"X")
  .replace(/MM$/i,"");

export const buildMatCode = (sectionType, matType, grade, size) => {
  const sec  = (sectionType||"").toUpperCase().trim();
  const mat  = (matType||"").toUpperCase().trim();
  const grd  = (grade||"").toUpperCase().trim();
  const sz   = normSize(size);
  const isPlate = sec==="PLATE"||sec.includes("PLATE")||sec.includes("CHQ");
  const szDisplay = isPlate && /^\d+(\.\d+)?$/.test(sz) ? sz+"MM" : sz;
  return [sec,mat,grd,szDisplay].filter(Boolean).join("/");
};

// ── Sheet Weight Calculator ────────────────────────────────────────────────────
export const calcSheetWt = (rmUnitId) => {
  if (!rmUnitId) return 0;
  const parts = rmUnitId.split("/");
  const thickSeg = parts.find(p => /^\d+(\.\d+)?mm$/i.test(p));
  const thickness = thickSeg ? parseFloat(thickSeg) : 0;
  const dimSeg = parts.find(p => /^\d+[Xx]\d+$/.test(p));
  if (!dimSeg || !thickness) return 0;
  const dimParts = dimSeg.toUpperCase().split("X");
  if (dimParts.length < 2) return 0;
  const w = parseFloat(dimParts[0]) / 1000;
  const l = parseFloat(dimParts[1]) / 1000;
  const t = thickness / 1000;
  return Math.round(w * l * t * 7850 * 100) / 100;
};

// ── Unique ID Helpers ──────────────────────────────────────────────────────────
export const buildDIId = (drawingId, instanceNo) => `DI-${drawingId}-${instanceNo}`;

export const getOrderPrefix = (orderNo) => {
  if (!orderNo) return "000";
  const parts = orderNo.split("/");
  const seq = parts[parts.length - 1] || "000";
  return seq.slice(-3).padStart(3, "0");
};

export const detectDrawingPrefix = (drawings) => {
  if (!drawings || drawings.length === 0) return "";
  if (drawings.length === 1) {
    const dn = drawings[0].drawingNo || "";
    const lastDash = dn.lastIndexOf("-");
    return lastDash > 0 ? dn.slice(0, lastDash + 1) : "";
  }
  const nums = drawings.map(d => d.drawingNo || "");
  let prefix = nums[0];
  for (let i = 1; i < nums.length; i++) {
    while (!nums[i].startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return "";
    }
  }
  const lastDash = prefix.lastIndexOf("-");
  return lastDash > 0 ? prefix.slice(0, lastDash + 1) : prefix;
};

export const getDrawingShortCode = (drawingNo, prefix) => {
  if (!prefix || !drawingNo.startsWith(prefix)) {
    const lastDash = drawingNo.lastIndexOf("-");
    return lastDash >= 0 ? drawingNo.slice(lastDash + 1) : drawingNo;
  }
  return drawingNo.slice(prefix.length) || drawingNo;
};

export const buildDIUniqueId = (orderPrefix, shortCode, instanceNo, totalInstances) => {
  const base = `${orderPrefix}-${shortCode}`;
  return totalInstances > 1 ? `${base}-${instanceNo}` : base;
};

export const buildPartUniqueId = (diUniqueId, markNo, pieceNo, totalPieces) => {
  const base = `${diUniqueId}/${markNo}`;
  return totalPieces > 1 ? `${base}-${pieceNo}` : base;
};

export const computePartBaseUniqueId = (order, drawing, markNo) => {
  if (!order || !drawing || !markNo) return null;
  const orderPrefix = getOrderPrefix(order.orderNo||order.id);
  const strippedPrefix = order.drawingPrefix !== undefined
    ? order.drawingPrefix
    : detectDrawingPrefix(order.drawings||[]);
  const shortCode = drawing.shortCode || getDrawingShortCode(drawing.drawingNo||"", strippedPrefix);
  return `${orderPrefix}-${shortCode}/${markNo}`;
};

export const computeTotalPieces = (drawingQty, partQtyPerDrg) =>
  (drawingQty||1) * (partQtyPerDrg||1);

// ── CSV Parser (RFC 4180) ──────────────────────────────────────────────────────
export const parseCSVLine = (line) => {
  const result = []; let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i+1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQ = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') { inQ = true; }
      else if (ch === ',') { result.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
  }
  result.push(cur.trim());
  return result;
};

export const parseCSVText = (text) =>
  text.replace(/\r\n/g,"\n").replace(/\r/g,"\n")
    .split("\n").filter(l=>l.trim()).map(parseCSVLine);

// ─── PERMISSION UTILITY ───────────────────────────────────────────────────────
export const ROLE_DEFAULT_PERMS = {
  planning_admin:   ["orders.view","orders.create","orders.edit","mrp.view","mrp.run_nesting","mrp.discard_nesting","mrp.raise_pr","mrp.edit_pr","mrp.cancel_pr","purchase.view","stock.view","stock.allocate","stock.release_alloc","production.view","production.new_release","rmqc.view","qc.view","qc.raise_concern","qc.tpi_offer","masters.view"],
  planning_user:    ["orders.view","mrp.view","purchase.view","stock.view","production.view","rmqc.view","qc.view","masters.view"],
  purchase_admin:   ["orders.view","mrp.view","mrp.edit_pr","mrp.cancel_pr","purchase.view","purchase.view_pricing","purchase.create_po","purchase.edit_po","purchase.cancel_po","purchase.add_po_line","purchase.create_grn","purchase.edit_grn","purchase.reverse_grn","purchase.edit_mtc","stock.view","rmqc.view","masters.view"],
  purchase_user:    ["orders.view","purchase.view","stock.view","rmqc.view","masters.view"],
  store_admin:      ["orders.view","purchase.view","purchase.create_grn","purchase.edit_grn","purchase.edit_mtc","stock.view","stock.allocate","stock.release_alloc","stock.transfer_bay","stock.issue","stock.reverse_issue","stock.record_offcut","stock.edit_offcut","stock.add_offcut_retro","stock.write_off","stock.verify_offcut","rmqc.view","production.view","production.edit_offcut","production.add_offcut_retro","masters.view"],
  store_user:       ["purchase.view","stock.view","stock.transfer_bay","rmqc.view","masters.view"],
  qc_admin:         ["orders.view","stock.view","rmqc.view","rmqc.approve","rmqc.revert","rmqc.edit_reason","rmqc.client_inspect","rmqc.revert_client","production.view","production.cutting_qc","production.revert_cutting_qc","production.edit_defect","qc.view","qc.raise_concern","qc.close_concern","qc.tpi_offer","qc.tpi_clearance","masters.view"],
  qc_user:          ["orders.view","stock.view","rmqc.view","rmqc.approve","production.view","qc.view","qc.raise_concern","masters.view"],
  floor_planner:    ["orders.view","mrp.view","mrp.run_nesting","purchase.view","stock.view","production.view","production.new_release","production.cancel_release","production.edit_contractor","production.confirm_cutting","rmqc.view","qc.view","masters.view"],
  production_admin: ["orders.view","mrp.view","mrp.run_nesting","mrp.discard_nesting","purchase.view","stock.view","stock.allocate","stock.release_alloc","stock.record_offcut","stock.edit_offcut","stock.add_offcut_retro","rmqc.view","production.view","production.new_release","production.cancel_release","production.edit_contractor","production.confirm_cutting","production.revert_cutting","production.edit_offcut","production.add_offcut_retro","production.edit_split","production.edit_lot_ref","production.cutting_qc","production.revert_cutting_qc","production.edit_defect","cq.view","cq.mark_collected","cq.revert_collected","cq.mark_fitup","cq.mark_welding","cq.revert_welding","cq.edit_welder","cq.reassign_contractor","bp.view","bp.assign","bp.record_blast","bp.record_coat","bp.edit_dft","bp.edit_coat","bp.revert_stage","qc.view","qc.raise_concern","qc.close_concern","qc.tpi_offer","masters.view"],
  production_engineer:["orders.view","mrp.view","stock.view","stock.record_offcut","stock.edit_offcut","stock.add_offcut_retro","rmqc.view","production.view","production.cancel_release","production.edit_contractor","production.confirm_cutting","production.revert_cutting","production.edit_offcut","production.add_offcut_retro","production.edit_split","production.edit_lot_ref","production.cutting_qc","production.revert_cutting_qc","production.edit_defect","cq.view","cq.mark_collected","cq.revert_collected","cq.mark_fitup","cq.mark_welding","cq.revert_welding","cq.edit_welder","cq.reassign_contractor","bp.view","bp.assign","bp.record_blast","bp.record_coat","bp.edit_dft","bp.edit_coat","bp.revert_stage","qc.view","qc.raise_concern","masters.view"],
  blasting_engineer:["production.view","bp.view","bp.record_blast","bp.edit_dft","qc.view","masters.view"],
  painting_engineer:["production.view","bp.view","bp.record_coat","bp.edit_coat","bp.edit_dft","qc.view","masters.view"],
  finance_admin:    ["orders.view","orders.finance","orders.edit_milestones","purchase.view","purchase.view_pricing","masters.view"],
  finance_user:     ["orders.view","orders.finance","purchase.view","masters.view"],
  dispatch_admin:   ["orders.view","production.view","qc.view","masters.view"],
  dispatch_user:    ["orders.view","production.view","masters.view"],
  contractor:       ["production.view","cq.view","cq.mark_collected","cq.mark_fitup","cq.mark_welding","cq.edit_welder","bp.view","bp.record_blast","bp.record_coat","bp.edit_dft","bp.edit_coat"],
  machine_operator: ["production.view","production.confirm_cutting","production.edit_offcut","production.add_offcut_retro","stock.record_offcut","stock.edit_offcut"],
};

export const can = (user, permission) => {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  if (user.permissions && typeof user.permissions[permission] === "boolean") {
    return user.permissions[permission];
  }
  return (ROLE_DEFAULT_PERMS[user.role] || []).includes(permission);
};

// ─── SEED USERS ───────────────────────────────────────────────────────────────
export const USERS = [
  { id:"U001", name:"Rajesh Kumar",         username:"rajesh.kumar",    password:"admin123", role:"super_admin",         active:true },
  { id:"U002", name:"Anita Sharma",         username:"anita.sharma",    password:"admin123", role:"super_admin",         active:true },
  { id:"U003", name:"Vikram Singh",         username:"vikram.singh",    password:"plan123",  role:"planning_admin",      active:true },
  { id:"U004", name:"Neha Gupta",           username:"neha.gupta",      password:"plan123",  role:"planning_user",       active:true },
  { id:"U005", name:"Ajay Mishra",          username:"ajay.mishra",     password:"plan123",  role:"planning_user",       active:true },
  { id:"U006", name:"Deepak Rao",           username:"deepak.rao",      password:"pur123",   role:"purchase_admin",      active:true },
  { id:"U007", name:"Sunita Verma",         username:"sunita.verma",    password:"pur123",   role:"purchase_user",       active:true },
  { id:"U008", name:"Rahul Jain",           username:"rahul.jain",      password:"pur123",   role:"purchase_user",       active:true },
  { id:"U009", name:"Mohan Das",            username:"mohan.das",       password:"store123", role:"store_admin",         active:true },
  { id:"U010", name:"Kavita Joshi",         username:"kavita.joshi",    password:"store123", role:"store_user",          active:true },
  { id:"U011", name:"Sanjay Tiwari",        username:"sanjay.tiwari",   password:"store123", role:"store_user",          active:true },
  { id:"U012", name:"Priya Mehta",          username:"priya.mehta",     password:"qc123",    role:"qc_admin",            active:true },
  { id:"U013", name:"Arvind Nair",          username:"arvind.nair",     password:"qc123",    role:"qc_user",             active:true },
  { id:"U014", name:"Sneha Reddy",          username:"sneha.reddy",     password:"qc123",    role:"qc_user",             active:true },
  { id:"U015", name:"Suresh Patel",         username:"suresh.patel",    password:"prod123",  role:"floor_planner",       active:true },
  { id:"U016", name:"Manoj Sharma",         username:"manoj.sharma",    password:"prod123",  role:"floor_planner",       active:true },
  { id:"U017", name:"Ravi Yadav",           username:"ravi.yadav",      password:"prod123",  role:"production_engineer", active:true },
  { id:"U018", name:"Dinesh Kumar",         username:"dinesh.kumar",    password:"prod123",  role:"production_engineer", active:true },
  { id:"U019", name:"Prakash Singh",        username:"prakash.singh",   password:"prod123",  role:"blasting_engineer",   active:true },
  { id:"U020", name:"Vijay More",           username:"vijay.more",      password:"prod123",  role:"blasting_engineer",   active:true },
  { id:"U021", name:"Ramesh Naik",          username:"ramesh.naik",     password:"prod123",  role:"painting_engineer",   active:true },
  { id:"U022", name:"Ganesh Bhosale",       username:"ganesh.bhosale",  password:"prod123",  role:"painting_engineer",   active:true },
  { id:"U023", name:"Sameer Shah",          username:"sameer.shah",     password:"fin123",   role:"finance_admin",       active:true },
  { id:"U024", name:"Pooja Iyer",           username:"pooja.iyer",      password:"fin123",   role:"finance_user",        active:true },
  { id:"U025", name:"Kiran Desai",          username:"kiran.desai",     password:"fin123",   role:"finance_user",        active:true },
  { id:"U026", name:"Ramesh Kulkarni",      username:"ramesh.kulkarni", password:"disp123",  role:"dispatch_admin",      active:true },
  { id:"U027", name:"Divya Pillai",         username:"divya.pillai",    password:"disp123",  role:"dispatch_user",       active:true },
  { id:"U028", name:"Santosh Pawar",        username:"santosh.pawar",   password:"disp123",  role:"dispatch_user",       active:true },
  { id:"U029", name:"Krishna Fabricators",  username:"krishna.fab",     password:"con123",   role:"contractor",          active:true, contractorId:"CON-001" },
  { id:"U030", name:"In-House Contractor A",username:"inhouse.a",       password:"con123",   role:"contractor",          active:true, contractorId:"CON-002" },
  { id:"U031", name:"In-House Contractor B",username:"inhouse.b",       password:"con123",   role:"contractor",          active:true, contractorId:"CON-003" },
  { id:"U032", name:"RK Contractor",        username:"rk.contractor",   password:"con123",   role:"contractor",          active:true, contractorId:"CON-004" },
  { id:"U033", name:"SB Painting Contractor",username:"sb.painting",    password:"con123",   role:"contractor",          active:true, contractorId:"CON-005" },
  { id:"U034", name:"In-House Contractor C", username:"inhouse.c",      password:"con123",   role:"contractor",          active:true, contractorId:"CON-006" },
  { id:"U035", name:"Ajay Kadam",           username:"ajay.kadam",      password:"machine123",role:"machine_operator",   active:true },
  { id:"U036", name:"Ravi Thakur",          username:"ravi.thakur",     password:"machine123",role:"machine_operator",   active:true },
  { id:"USR-008", name:"Arjun Patil",       username:"arjun.qc",        password:"qc123",    role:"qc_user",             active:true },
  { id:"U037", name:"Ajay Rahangdale",      username:"ajay.rahangdale", password:"prod123",  role:"production_admin",    active:true },
  { id:"U038", name:"Anmol Vaidya",         username:"anmol.vaidya",    password:"pe123",    role:"production_engineer", active:true },
  { id:"U039", name:"Vibhor Suryavanshi",   username:"vibhor.suryavanshi",password:"pe123",  role:"production_engineer", active:true },
  { id:"U040", name:"Pramita Madam",        username:"pramita.madam",   password:"pur123",   role:"purchase_admin",      active:true },
  { id:"U041", name:"Sachin Blast Paint",   username:"sachin.blast",    password:"con123",   role:"contractor",          active:true, contractorId:"CON-007" },
];

// ─── PAINT AREA CALCULATION ───────────────────────────────────────────────────
export const computePaintableArea = (part, drawing) => {
  const sec = (part.section||part.sectionType||"").toUpperCase().replace(/\s+/g,"");
  const L = parseFloat(part.length)||0;
  const W = parseFloat(part.width)||0;
  const size = (part.size||"").toUpperCase().replace(/MM/g,"").trim();
  const isPlate = ["PLATE","CHEQ","SHEET","FLAT"].includes(sec);
  if (isPlate && L>0 && W>0) {
    const t = parseFloat(size)||0;
    const faceArea = 2*(L/1000)*(W/1000);
    const edgeArea = t>0 ? 2*(L+W)/1000*(t/1000) : 0;
    return faceArea + edgeArea;
  }
  if (sec==="ROD" && L>0) { const d=parseFloat(size)||0; return Math.PI*(d/1000)*(L/1000); }
  if (sec==="BAR" && L>0) { const dims=size.split("X").map(parseFloat).filter(Boolean); const s1=dims[0]||0,s2=dims[1]||s1; return 2*(s1+s2)/1000*(L/1000); }
  const SECTION_PERIMETERS = {
    "ISA/25X25X3":0.097,"ISA/25X25X5":0.093,"ISA/30X30X3":0.117,"ISA/35X35X3":0.137,
    "ISA/40X40X3":0.157,"ISA/40X40X5":0.153,"ISA/45X45X3":0.177,"ISA/45X45X5":0.173,
    "ISA/50X50X5":0.193,"ISA/50X50X6":0.191,"ISA/55X55X6":0.211,"ISA/60X60X5":0.233,
    "ISA/60X60X6":0.231,"ISA/65X65X6":0.251,"ISA/65X65X8":0.247,"ISA/65X65X10":0.243,
    "ISA/70X70X6":0.271,"ISA/75X75X6":0.291,"ISA/75X75X8":0.287,"ISA/75X75X10":0.283,
    "ISA/80X80X6":0.311,"ISA/80X80X8":0.307,"ISA/90X90X6":0.351,"ISA/90X90X8":0.347,
    "ISA/90X90X10":0.343,"ISA/100X100X6":0.391,"ISA/100X100X8":0.387,"ISA/100X100X10":0.383,
    "ISA/100X100X12":0.379,"ISA/110X110X8":0.427,"ISA/130X130X10":0.503,"ISA/150X150X10":0.583,
    "ISA/150X150X12":0.579,"ISA/150X150X15":0.573,"ISA/150X150X16":0.571,"ISA/200X200X16":0.771,
    "ISMB/100":0.482,"ISMB/125":0.602,"ISMB/150":0.726,"ISMB/175":0.826,"ISMB/200":0.946,
    "ISMB/225":1.060,"ISMB/250":1.178,"ISMB/300":1.406,"ISMB/350":1.578,"ISMB/400":1.762,
    "ISMB/450":1.938,"ISMB/500":2.170,"ISMB/550":2.376,"ISMB/600":2.582,
    "ISMC/75":0.370,"ISMC/100":0.500,"ISMC/125":0.614,"ISMC/150":0.738,"ISMC/175":0.852,
    "ISMC/200":0.966,"ISMC/225":1.074,"ISMC/250":1.186,"ISMC/300":1.410,"ISMC/400":1.858,
    "ISLB/75":0.358,"ISLB/100":0.454,"ISLB/125":0.574,"ISLB/150":0.694,"ISLB/175":0.782,
    "ISLB/200":0.886,"ISLB/225":0.994,"ISLB/250":1.098,"ISLB/275":1.202,"ISLB/300":1.306,
    "ISLB/350":1.518,"ISLB/400":1.690,"ISLB/450":1.906,"ISLB/500":2.118,"ISLB/550":2.322,"ISLB/600":2.530,
    "ISWB/150":0.666,"ISWB/175":0.766,"ISWB/200":0.858,"ISWB/225":0.962,"ISWB/250":1.050,
    "ISWB/300":1.234,"ISWB/350":1.418,"ISWB/400":1.594,"ISWB/450":1.778,"ISWB/500":1.962,
    "ISWB/550":2.146,"ISWB/600":2.330,
    "RHS/100X50X4":0.296,"RHS/100X50X5":0.296,"RHS/100X50X6":0.296,"RHS/120X60X4":0.356,
    "RHS/150X75X5":0.446,"RHS/150X100X5":0.496,"RHS/200X100X5":0.596,"RHS/200X100X6":0.596,
    "RHS/250X150X6":0.796,"RHS/300X200X8":0.996,
    "SHS/40X4":0.152,"SHS/50X4":0.192,"SHS/50X5":0.190,"SHS/60X4":0.232,"SHS/75X5":0.290,
    "SHS/100X5":0.390,"SHS/100X6":0.388,"SHS/125X6":0.488,"SHS/150X6":0.588,"SHS/200X8":0.784,
    "ISHT/50":0.194,"ISHT/60":0.234,"ISHT/70":0.274,"ISHT/80":0.314,"ISHT/100":0.394,
    "ISHT/125":0.494,"ISHT/150":0.594,
  };
  const sectionKey = `${sec}/${size}`;
  const perim = SECTION_PERIMETERS[sectionKey];
  if (perim && L>0) return perim*(L/1000);
  if (["NPB","WPB"].includes(sec) && L>0) {
    const dims=size.split("X").map(parseFloat).filter(Boolean);
    if (dims.length>=2) { const depth=dims[0]/1000,width=dims[1]/1000; return (2*depth+2*width)*(L/1000); }
  }
  const PIPE_OD = {"15NB":0.02135,"20NB":0.02667,"25NB":0.03338,"32NB":0.04216,
    "40NB":0.04826,"50NB":0.06033,"65NB":0.07312,"80NB":0.08890,"100NB":0.11430,
    "125NB":0.14130,"150NB":0.16830,"200NB":0.21910,"250NB":0.27305,"300NB":0.32385};
  if (sec==="ROPIPE" && L>0) {
    const nbMatch=size.match(/(\d+NB)/i);
    const od=nbMatch?PIPE_OD[nbMatch[1].toUpperCase()]:null;
    if (od) return Math.PI*od*(L/1000);
  }
  return null;
};

// Paint coats for an order's quality spec — canonical shared implementation
// (was duplicated in App.jsx and relied upon, unimported, in ProductionModule).
export const getPaintCoats = (quality) => {
  const q = quality || {};
  if (q.paintSpecs?.length) return q.paintSpecs[0].coats || [];
  return q.paintCoats || [];
};
