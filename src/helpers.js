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
