import { useState, useEffect, useRef } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:"#0A0E1A", bgCard:"#111827", bgHover:"#1A2235", bgInput:"#0D1424",
  border:"#1E2D45", borderHi:"#2D4A6E",
  accent:"#3B82F6", accentLo:"#1D4ED8", accentHi:"#60A5FA",
  gold:"#F59E0B", goldLo:"#D97706",
  green:"#10B981", greenLo:"#065F46", greenBg:"#022C22",
  red:"#EF4444", redLo:"#991B1B", redBg:"#1F0707",
  amber:"#F59E0B", amberBg:"#1C1107",
  text:"#F1F5F9", textMid:"#94A3B8", textLow:"#475569",
  font:"'IBM Plex Sans', sans-serif", fontMono:"'IBM Plex Mono', monospace",
};

// ─── ROLES ────────────────────────────────────────────────────────────────────
const ROLES = [
  { id:"super_admin",         label:"Super Admin",         dept:"Management",  level:"admin" },
  { id:"planning_admin",      label:"Planning Admin",      dept:"Planning",    level:"admin" },
  { id:"planning_user",       label:"Planning User",       dept:"Planning",    level:"user"  },
  { id:"purchase_admin",      label:"Purchase Admin",      dept:"Purchase",    level:"admin" },
  { id:"purchase_user",       label:"Purchase User",       dept:"Purchase",    level:"user"  },
  { id:"store_admin",         label:"Store Admin",         dept:"Store",       level:"admin" },
  { id:"store_user",          label:"Store User",          dept:"Store",       level:"user"  },
  { id:"qc_admin",            label:"QC Admin",            dept:"Quality",     level:"admin" },
  { id:"qc_user",             label:"QC User",             dept:"Quality",     level:"user"  },
  { id:"floor_planner",       label:"Floor Planner",       dept:"Production",  level:"admin" },
  { id:"production_engineer", label:"Production Engineer", dept:"Production",  level:"admin" },
  { id:"blasting_engineer",   label:"Blasting Engineer",   dept:"Production",  level:"user"  },
  { id:"painting_engineer",   label:"Painting Engineer",   dept:"Production",  level:"user"  },
  { id:"finance_admin",       label:"Finance Admin",       dept:"Finance",     level:"admin" },
  { id:"finance_user",        label:"Finance User",        dept:"Finance",     level:"user"  },
  { id:"dispatch_admin",      label:"Dispatch Admin",      dept:"Dispatch",    level:"admin" },
  { id:"dispatch_user",       label:"Dispatch User",       dept:"Dispatch",    level:"user"  },
  { id:"contractor",          label:"Contractor",          dept:"External",    level:"user"  },
];

// ─── USERS ────────────────────────────────────────────────────────────────────
const USERS = [
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
  { id:"U030", name:"Shiv Cutting Works",   username:"shiv.cutting",    password:"con123",   role:"contractor",          active:true, contractorId:"CON-002" },
  { id:"U031", name:"Ganesh Blasting",      username:"ganesh.blast",    password:"con123",   role:"contractor",          active:true, contractorId:"CON-003" },
  { id:"U032", name:"Balaji Engineering",   username:"balaji.engg",     password:"con123",   role:"contractor",          active:true, contractorId:"CON-004" },
];

// ─── CONTRACTORS ──────────────────────────────────────────────────────────────
const CONTRACTORS = [
  { id:"CON-001", name:"Krishna Fabricators",       code:"KF",  type:["fit_up","welding"],          contact:"9876543210", address:"Plot 12, MIDC Butibori, Nagpur",  active:true, gst:"27AABCK1234A1Z5" },
  { id:"CON-002", name:"Shiv Cutting Works",        code:"SCW", type:["cutting"],                    contact:"9876543211", address:"Survey 45, Hingna Road, Nagpur",  active:true, gst:"27AABCS5678B1Z3" },
  { id:"CON-003", name:"Ganesh Blasting & Painting",code:"GBP", type:["blasting","painting"],        contact:"9876543212", address:"Gat 78, Kalmeshwar, Nagpur",      active:true, gst:"27AABCG9012C1Z1" },
  { id:"CON-004", name:"Balaji Engineering",        code:"BE",  type:["fit_up","welding","cutting"], contact:"9876543213", address:"Plot 34, Amravati Road, Nagpur",   active:true, gst:"27AABCB3456D1Z9" },
];

// ─── BAYS ─────────────────────────────────────────────────────────────────────
const BAYS_SEED = Array.from({length:25}, (_,i) => ({
  id:`BAY-${String(i+1).padStart(2,"0")}`, number:i+1, description:"", status:"available", currentLot:null, capacity:"50T", notes:"",
}));

// ─── MATERIALS LIBRARY ────────────────────────────────────────────────────────
const MATERIALS_LIBRARY = [
  { id:"ML-001", matType:"MS", grade:"E250", sectionType:"ISA",     size:"50x50x5",    matCode:"ISA/MS/E250/50X50X5",      isPlate:false, standardLengths:[6000,8000,10000,12000], wtPerMetre:3.77,  unit:"kg/m",  active:true },
  { id:"ML-002", matType:"MS", grade:"E250", sectionType:"ISA",     size:"65x65x6",    matCode:"ISA/MS/E250/65X65X6",      isPlate:false, standardLengths:[6000,8000,10000,12000], wtPerMetre:5.79,  unit:"kg/m",  active:true },
  { id:"ML-003", matType:"MS", grade:"E250", sectionType:"ISA",     size:"75x75x8",    matCode:"ISA/MS/E250/75X75X8",      isPlate:false, standardLengths:[6000,8000,10000,12000], wtPerMetre:8.96,  unit:"kg/m",  active:true },
  { id:"ML-004", matType:"MS", grade:"E250", sectionType:"ISA",     size:"100x100x10", matCode:"ISA/MS/E250/100X100X10",   isPlate:false, standardLengths:[6000,8000,10000,12000], wtPerMetre:14.9,  unit:"kg/m",  active:true },
  { id:"ML-005", matType:"MS", grade:"E250", sectionType:"ISA",     size:"150x150x16", matCode:"ISA/MS/E250/150X150X16",   isPlate:false, standardLengths:[6000,8000,10000,12000], wtPerMetre:36.9,  unit:"kg/m",  active:true },
  { id:"ML-006", matType:"MS", grade:"E250", sectionType:"ISMC",    size:"100",        matCode:"ISMC/MS/E250/100",         isPlate:false, standardLengths:[6000,8000,10000,12000], wtPerMetre:9.56,  unit:"kg/m",  active:true },
  { id:"ML-007", matType:"MS", grade:"E250", sectionType:"ISMC",    size:"150",        matCode:"ISMC/MS/E250/150",         isPlate:false, standardLengths:[6000,8000,10000,12000], wtPerMetre:16.4,  unit:"kg/m",  active:true },
  { id:"ML-008", matType:"MS", grade:"E250", sectionType:"ISMC",    size:"200",        matCode:"ISMC/MS/E250/200",         isPlate:false, standardLengths:[6000,8000,10000,12000], wtPerMetre:22.1,  unit:"kg/m",  active:true },
  { id:"ML-009", matType:"MS", grade:"E250", sectionType:"ISMB",    size:"200",        matCode:"ISMB/MS/E250/200",         isPlate:false, standardLengths:[6000,8000,10000,12000], wtPerMetre:25.4,  unit:"kg/m",  active:true },
  { id:"ML-010", matType:"MS", grade:"E250", sectionType:"ISMB",    size:"300",        matCode:"ISMB/MS/E250/300",         isPlate:false, standardLengths:[6000,8000,10000,12000], wtPerMetre:46.1,  unit:"kg/m",  active:true },
  { id:"ML-011", matType:"MS", grade:"E250", sectionType:"ISMB",    size:"400",        matCode:"ISMB/MS/E250/400",         isPlate:false, standardLengths:[6000,8000,10000,12000], wtPerMetre:61.6,  unit:"kg/m",  active:true },
  { id:"ML-012", matType:"MS", grade:"E250", sectionType:"Flat Bar", size:"50x6",      matCode:"FLAT BAR/MS/E250/50X6",    isPlate:false, standardLengths:[6000,8000],             wtPerMetre:2.36,  unit:"kg/m",  active:true },
  { id:"ML-013", matType:"MS", grade:"E250", sectionType:"Flat Bar", size:"75x10",     matCode:"FLAT BAR/MS/E250/75X10",   isPlate:false, standardLengths:[6000,8000],             wtPerMetre:5.89,  unit:"kg/m",  active:true },
  { id:"ML-014", matType:"MS", grade:"E250", sectionType:"Flat Bar", size:"100x12",    matCode:"FLAT BAR/MS/E250/100X12",  isPlate:false, standardLengths:[6000,8000],             wtPerMetre:9.42,  unit:"kg/m",  active:true },
  { id:"ML-015", matType:"MS", grade:"E250", sectionType:"PLATE",   size:"6mm",        matCode:"PLATE/MS/E250/6MM",        isPlate:true,  standardLengths:[],                      wtPerM2:47.1,     unit:"kg/m²", active:true },
  { id:"ML-016", matType:"MS", grade:"E250", sectionType:"PLATE",   size:"8mm",        matCode:"PLATE/MS/E250/8MM",        isPlate:true,  standardLengths:[],                      wtPerM2:62.8,     unit:"kg/m²", active:true },
  { id:"ML-017", matType:"MS", grade:"E250", sectionType:"PLATE",   size:"10mm",       matCode:"PLATE/MS/E250/10MM",       isPlate:true,  standardLengths:[],                      wtPerM2:78.5,     unit:"kg/m²", active:true },
  { id:"ML-018", matType:"MS", grade:"E250", sectionType:"PLATE",   size:"12mm",       matCode:"PLATE/MS/E250/12MM",       isPlate:true,  standardLengths:[],                      wtPerM2:94.2,     unit:"kg/m²", active:true },
  { id:"ML-019", matType:"MS", grade:"E350", sectionType:"PLATE",   size:"16mm",       matCode:"PLATE/MS/E350/16MM",       isPlate:true,  standardLengths:[],                      wtPerM2:125.6,    unit:"kg/m²", active:true },
  { id:"ML-020", matType:"MS", grade:"E350", sectionType:"PLATE",   size:"20mm",       matCode:"PLATE/MS/E350/20MM",       isPlate:true,  standardLengths:[],                      wtPerM2:157.0,    unit:"kg/m²", active:true },
  { id:"ML-021", matType:"SS", grade:"304",  sectionType:"PLATE",   size:"6mm",        matCode:"PLATE/SS/304/6MM",         isPlate:true,  standardLengths:[],                      wtPerM2:48.0,     unit:"kg/m²", active:true },
  { id:"ML-022", matType:"MS", grade:"E250", sectionType:"RHS",     size:"50x50x4",    matCode:"RHS/MS/E250/50X50X4",      isPlate:false, standardLengths:[6000,8000,12000],       wtPerMetre:5.72,  unit:"kg/m",  active:true },
  { id:"ML-023", matType:"MS", grade:"E250", sectionType:"RHS",     size:"100x50x4",   matCode:"RHS/MS/E250/100X50X4",     isPlate:false, standardLengths:[6000,8000,12000],       wtPerMetre:9.22,  unit:"kg/m",  active:true },
  { id:"ML-024", matType:"MS", grade:"E250", sectionType:"SHS",     size:"75x75x5",    matCode:"SHS/MS/E250/75X75X5",      isPlate:false, standardLengths:[6000,8000,12000],       wtPerMetre:10.8,  unit:"kg/m",  active:true },
];

// ─── PAINT LIBRARY ────────────────────────────────────────────────────────────
const PAINT_LIBRARY = [
  { id:"PNT-001", make:"Akzo Nobel",  type:"primer",  product:"International Interplus 356",  dft:50, thinnerRatio:"5-10%", active:true },
  { id:"PNT-002", make:"Akzo Nobel",  type:"mio",     product:"International Intergard 269",  dft:75, thinnerRatio:"5%",    active:true },
  { id:"PNT-003", make:"Akzo Nobel",  type:"finish",  product:"International Interthane 990", dft:50, thinnerRatio:"5-10%", active:true },
  { id:"PNT-004", make:"Berger",      type:"primer",  product:"Berger Epilux 19 Red Oxide",   dft:50, thinnerRatio:"10%",   active:true },
  { id:"PNT-005", make:"Berger",      type:"finish",  product:"Berger Epilux 58 HS",          dft:75, thinnerRatio:"5%",    active:true },
  { id:"PNT-006", make:"Asian Paints",type:"primer",  product:"Apcoat EP Primer Red",         dft:40, thinnerRatio:"10%",   active:true },
];

// ─── TPI AGENCIES ─────────────────────────────────────────────────────────────
const TPI_AGENCIES = [
  { id:"TPI-001", name:"Bureau Veritas India", code:"BV",  contact:"Nagpur Office", phone:"0712-6789012", email:"industrial.nagpur@bureauveritas.com", active:true },
  { id:"TPI-002", name:"Lloyd's Register India",code:"LR",  contact:"Pune Office",   phone:"020-12345678", email:"india@lr.org",                       active:true },
  { id:"TPI-003", name:"DNV India",             code:"DNV", contact:"Mumbai Office", phone:"022-67890123", email:"india@dnv.com",                       active:true },
  { id:"TPI-004", name:"Intertek India",        code:"ITK", contact:"Nagpur Rep",    phone:"9876507890",   email:"industrial@intertek.com",             active:true },
];

// ─── APPROVED MAKES LIBRARY ───────────────────────────────────────────────────
const APPROVED_MAKES_LIBRARY = [
  { id:"AM-001", materialType:"MS Plates",  makes:["JSW Steel","SAIL","Essar Steel","Tata Steel"], active:true },
  { id:"AM-002", materialType:"Angles/ISA", makes:["JSW Steel","SAIL","Uttam Steel"],              active:true },
  { id:"AM-003", materialType:"Channels",   makes:["JSW Steel","SAIL","Bhushan Steel"],            active:true },
  { id:"AM-004", materialType:"Beams/ISMB", makes:["JSW Steel","SAIL"],                            active:true },
  { id:"AM-005", materialType:"Flat Bar",   makes:["JSW Steel","SAIL","Vizag Steel"],              active:true },
  { id:"AM-006", materialType:"RHS/SHS",    makes:["APL Apollo","Tata Structura","Jindal"],        active:true },
];

// ─── ROLES LABEL MAP ──────────────────────────────────────────────────────────
const ROLES_LABEL = Object.fromEntries(ROLES.map(r=>[r.id, r.label]));

const PERMISSIONS = {
  super_admin:     { modules:["all"], canApprove:true,  canOverride:true,  canManageUsers:true  },
  planning_admin:  { modules:["dashboard","orders","mrp","stock"],            canApprove:true,  canOverride:true,  canManageUsers:false },
  planning_user:   { modules:["dashboard","mrp"],                             canApprove:false, canOverride:false, canManageUsers:false },
  purchase_admin:  { modules:["dashboard","purchase","stock","vendors"],       canApprove:true,  canOverride:false, canManageUsers:false },
  purchase_user:   { modules:["dashboard","purchase"],                         canApprove:false, canOverride:false, canManageUsers:false },
  store_admin:     { modules:["dashboard","stock","bays"],                     canApprove:true,  canOverride:false, canManageUsers:false },
  store_user:      { modules:["dashboard","stock"],                            canApprove:false, canOverride:false, canManageUsers:false },
  qc_admin:        { modules:["dashboard","qc","stock","production"],          canApprove:true,  canOverride:true,  canManageUsers:false },
  qc_user:         { modules:["dashboard","qc"],                               canApprove:false, canOverride:false, canManageUsers:false },
  floor_planner:   { modules:["dashboard","mrp","production","stock"],         canApprove:true,  canOverride:false, canManageUsers:false },
  production_engineer:{ modules:["dashboard","production","qc"],               canApprove:true,  canOverride:true,  canManageUsers:false },
  blasting_engineer:  { modules:["dashboard","production"],                    canApprove:false, canOverride:false, canManageUsers:false },
  painting_engineer:  { modules:["dashboard","production"],                    canApprove:false, canOverride:false, canManageUsers:false },
  finance_admin:   { modules:["dashboard","orders","finance"],                 canApprove:true,  canOverride:false, canManageUsers:false },
  finance_user:    { modules:["dashboard","finance"],                          canApprove:false, canOverride:false, canManageUsers:false },
  dispatch_admin:  { modules:["dashboard","dispatch","qc"],                    canApprove:true,  canOverride:false, canManageUsers:false },
  dispatch_user:   { modules:["dashboard","dispatch"],                         canApprove:false, canOverride:false, canManageUsers:false },
  contractor:      { modules:["dashboard","my_work"],                          canApprove:false, canOverride:false, canManageUsers:false },
};

// ─── REFERENCE DATA ───────────────────────────────────────────────────────────
const CLIENTS = {
  "CL-001": { name:"Tata Projects Limited",    code:"TATA" },
  "CL-002": { name:"Bharat Heavy Electricals", code:"BHEL" },
};

const CLIENTS_FULL = [
  { id:"CL-001", code:"TATA", name:"Tata Projects Limited",    gstin:"27AAACT1234A1Z5", pan:"AAACT1234A", state:"Maharashtra", stateCode:"27", billing:{ addr:"Tata Centre, 43 Chowringhee Road, Kolkata 700071", contact:"Anil Verma", phone:"033-22883434", email:"procurement@tataprojects.com" }, paymentTerms:"60 days", creditLimit:5000000, active:true, notes:"Tier-1 client. TPI mandatory on all structural orders." },
  { id:"CL-002", code:"BHEL", name:"Bharat Heavy Electricals", gstin:"07AAACB1234B1Z3", pan:"AAACB1234B", state:"Delhi",       stateCode:"07", billing:{ addr:"BHEL House, Siri Fort, New Delhi 110049", contact:"Suresh Rajan", phone:"011-26001000", email:"mm@bhel.in" }, paymentTerms:"45 days", creditLimit:3000000, active:true, notes:"Payment milestone advance requires Bank Guarantee." },
  { id:"CL-003", code:"LOCAL",name:"Nagpur Municipal Corporation", gstin:"27AAALG1234C1Z1", pan:"AAALG1234C", state:"Maharashtra", stateCode:"27", billing:{ addr:"Civil Lines, Nagpur 440001", contact:"Rajendra Bhoyar", phone:"0712-2562626", email:"pwd@nmc.gov.in" }, paymentTerms:"90 days", creditLimit:1000000, active:true, notes:"Government client. Payment delays common." },
];

const VENDORS = [
  { id:"V-001", vendorCode:"JSW001", vendorShortName:"JSW", vendorType:"RM", name:"JSW Steel Limited",          gstin:"27AAACJ1234A1Z5", state:"Maharashtra", contact:"Sales Desk",    phone:"022-24215000", email:"sales@jsw.in",              approvedMaterials:["MS Plates","Angles","Channels","Beams","Flat Bar"], active:true },
  { id:"V-002", vendorCode:"STE002", vendorShortName:"STE", vendorType:"RM", name:"Steel Authority of India",   gstin:"11AAACS1234B1Z3", state:"Delhi",       contact:"Nagpur Office", phone:"0712-2222222", email:"nagpur@sail.in",            approvedMaterials:["MS Plates","Angles","Channels","Beams"], active:true },
  { id:"V-003", vendorCode:"APL003", vendorShortName:"APL", vendorType:"RM", name:"APL Apollo Tubes",           gstin:"06AAACA1234C1Z1", state:"Haryana",     contact:"Depot Manager", phone:"9876501234",   email:"depot@aplapoll.com",        approvedMaterials:["Hollow Sections","Pipes"], active:true },
  { id:"V-004", vendorCode:"AKZ004", vendorShortName:"AKZ", vendorType:"PT", name:"Akzo Nobel India",           gstin:"27AAACA5678D1Z9", state:"Maharashtra", contact:"Deepak Salve",  phone:"9876502345",   email:"industrial@akzonobel.in",   approvedMaterials:["Primers","MIO","Finish Coats"], active:true },
  { id:"V-005", vendorCode:"BER005", vendorShortName:"BER", vendorType:"PT", name:"Berger Paints India",        gstin:"19AAACB9012E1Z7", state:"West Bengal", contact:"Nagpur Rep",    phone:"9876503456",   email:"industrial@berger.com",     approvedMaterials:["Primers","Epoxy Coatings"], active:true },
  { id:"V-006", vendorCode:"SHR006", vendorShortName:"SHR", vendorType:"TR", name:"Shree Transport Corporation",gstin:"27AAACS3456F1Z5", state:"Maharashtra", contact:"Rahul Shah",    phone:"9876504567",   email:"booking@shreetransport.com", approvedMaterials:[], active:true },
  { id:"V-007", vendorCode:"NAG007", vendorShortName:"NAG", vendorType:"OP", name:"Nagpur Bending Works",       gstin:"27AAACN7890G1Z3", state:"Maharashtra", contact:"Prakash Wasnik",phone:"9876505678",   email:"nbw@gmail.com",             approvedMaterials:["Bending","Rolling"], active:true },
  { id:"V-008", vendorCode:"MAH008", vendorShortName:"MAH", vendorType:"OP", name:"Maharashtra Galvanisers",    gstin:"27AAACM2345H1Z1", state:"Maharashtra", contact:"Santosh Kale",  phone:"9876506789",   email:"mgalv@gmail.com",           approvedMaterials:["Galvanising"], active:true },
];

const BAYS = Array.from({length:25},(_,i)=>({ id:`BAY-${String(i+1).padStart(2,"0")}`, number:i+1 }));

// ─── SEED: ORDERS (summary only - parts & drawings needed for MRP) ───────────
const ORDERS = [
  {
    id:"SF-2025-0001", clientId:"CL-001", projectDesc:"Nagpur-Wardha Expressway — Jetty Structure", orderQty:250, orderUnit:"Ton", ratePerUnit:95000, orderValue:23750000, status:"active",
    drawings:[
      { id:"D001", drawingNo:"TPL-JETTY-COL-01", title:"Main Column Type A", qty:4,  unitWt:857.78, totalWt:3431.12, phase:1, priority:1, receivedDate:"2025-01-12", status:"active"  },
      { id:"D002", drawingNo:"TPL-JETTY-BM-01",  title:"Main Beam Type B",   qty:6,  unitWt:420.50, totalWt:2523.00, phase:1, priority:2, receivedDate:"2025-01-12", status:"active"  },
      { id:"D003", drawingNo:"TPL-JETTY-BP-01",  title:"Base Plate Assembly",qty:8,  unitWt:215.30, totalWt:1722.40, phase:1, priority:2, receivedDate:"2025-01-12", status:"active"  },
      { id:"D004", drawingNo:"TPL-JETTY-BRK-01", title:"Bracings H&D",       qty:12, unitWt:145.60, totalWt:1747.20, phase:2, priority:1, receivedDate:"2025-01-15", status:"active"  },
      { id:"D005", drawingNo:"TPL-JETTY-PL-01",  title:"Platform Level 1",   qty:2,  unitWt:980.00, totalWt:1960.00, phase:2, priority:2, receivedDate:"",           status:"pending" },
      { id:"D006", drawingNo:"TPL-JETTY-PL-02",  title:"Platform Level 2",   qty:2,  unitWt:920.00, totalWt:1840.00, phase:3, priority:1, receivedDate:"",           status:"pending" },
    ],
    parts:[
      { id:"P001", drawingId:"D001", drawingNo:"TPL-JETTY-COL-01", markNo:"SBK-101", desc:"BRACKET ANGLE",     fabType:"Fabricate", matType:"MS", grade:"E250", section:"ISA",     size:"75x75x8",   length:150,  qtyPerDrg:80, clientUnitWt:1.335,  clientTotalWt:106.8,  source:"Procure"      },
      { id:"P002", drawingId:"D001", drawingNo:"TPL-JETTY-COL-01", markNo:"SBK-103", desc:"HEAVY BRACKET",     fabType:"Fabricate", matType:"MS", grade:"E250", section:"ISA",     size:"150x150x16",length:270,  qtyPerDrg:5,  clientUnitWt:9.666,  clientTotalWt:48.33,  source:"Procure"      },
      { id:"P003", drawingId:"D001", drawingNo:"TPL-JETTY-COL-01", markNo:"PL-001",  desc:"BASE PLATE 10MM",   fabType:"Fabricate", matType:"MS", grade:"E250", section:"PLATE",   size:"10mm",      length:500,  qtyPerDrg:4,  clientUnitWt:19.625, clientTotalWt:78.5,   source:"Procure"      },
      { id:"P004", drawingId:"D001", drawingNo:"TPL-JETTY-COL-01", markNo:"BOLT-M24",desc:"M24 HDG BOLTS",     fabType:"Bought Out",matType:"MS", grade:"Galv", section:"—",       size:"M24x100",   length:100,  qtyPerDrg:32, clientUnitWt:0.51,   clientTotalWt:16.32,  source:"Procure"      },
      { id:"P005", drawingId:"D002", drawingNo:"TPL-JETTY-BM-01",  markNo:"WB-201",  desc:"WIDE FLANGE BEAM",  fabType:"Fabricate", matType:"MS", grade:"E250", section:"ISMB",    size:"300",       length:6200, qtyPerDrg:2,  clientUnitWt:285.82, clientTotalWt:571.64, source:"Procure"      },
      { id:"P006", drawingId:"D002", drawingNo:"TPL-JETTY-BM-01",  markNo:"CH-202",  desc:"CHANNEL PURLIN",    fabType:"Fabricate", matType:"MS", grade:"E250", section:"ISMC",    size:"150",       length:2500, qtyPerDrg:8,  clientUnitWt:41.0,   clientTotalWt:328.0,  source:"Client Supply"},
      { id:"P007", drawingId:"D002", drawingNo:"TPL-JETTY-BM-01",  markNo:"FB-203",  desc:"FLAT BAR STIFFENER",fabType:"Fabricate", matType:"MS", grade:"E250", section:"Flat Bar",size:"75x10",    length:150,  qtyPerDrg:50, clientUnitWt:0.883,  clientTotalWt:44.15,  source:"Procure"      },
      { id:"P008", drawingId:"D003", drawingNo:"TPL-JETTY-BP-01",  markNo:"BP-301",  desc:"BASE PLATE 12MM",   fabType:"Fabricate", matType:"MS", grade:"E250", section:"PLATE",   size:"12mm",      length:600,  qtyPerDrg:1,  clientUnitWt:33.912, clientTotalWt:33.912, source:"Procure"      },
      { id:"P009", drawingId:"D003", drawingNo:"TPL-JETTY-BP-01",  markNo:"SBK-302", desc:"ANCHOR BOLTS",      fabType:"Bought Out",matType:"MS", grade:"Galv", section:"—",       size:"M30x600",   length:600,  qtyPerDrg:4,  clientUnitWt:3.37,   clientTotalWt:13.48,  source:"Procure"      },
      { id:"P010", drawingId:"D004", drawingNo:"TPL-JETTY-BRK-01", markNo:"BRC-401", desc:"DIAGONAL BRACING",  fabType:"Fabricate", matType:"MS", grade:"E250", section:"ISA",     size:"100x100x10",length:2400, qtyPerDrg:4,  clientUnitWt:35.76,  clientTotalWt:143.04, source:"Procure"      },
      { id:"P011", drawingId:"D004", drawingNo:"TPL-JETTY-BRK-01", markNo:"GP-402",  desc:"GUSSET PLATE 8MM",  fabType:"Fabricate", matType:"MS", grade:"E250", section:"PLATE",   size:"8mm",       length:300,  qtyPerDrg:8,  clientUnitWt:4.712,  clientTotalWt:37.696, source:"Procure"      },
    ],
    quality:{ approvedMakes:[ {matType:"MS Plates",makes:"JSW Steel, SAIL"},{matType:"Angles/ISA",makes:"JSW Steel, SAIL"},{matType:"Channels/ISMC",makes:"JSW Steel, SAIL"},{matType:"Beams/ISMB",makes:"JSW Steel, SAIL"} ] },
  },
  {
    id:"SF-2025-0002", clientId:"CL-002", projectDesc:"NTPC Mouda — Equipment Support Structure", orderQty:45, orderUnit:"Ton", ratePerUnit:88000, orderValue:3960000, status:"active",
    drawings:[
      { id:"D101", drawingNo:"BHEL-ESS-FR-01",  title:"Equipment Support Frame",  qty:2, unitWt:980.0, totalWt:1960.0, phase:1, priority:1, receivedDate:"2025-01-28", status:"active"  },
      { id:"D102", drawingNo:"BHEL-ESS-PED-01", title:"Equipment Pedestal",       qty:4, unitWt:145.0, totalWt:580.0,  phase:1, priority:2, receivedDate:"2025-01-28", status:"active"  },
      { id:"D103", drawingNo:"BHEL-ESS-ACC-01", title:"Access Platform & Handrail",qty:1,unitWt:360.0, totalWt:360.0,  phase:1, priority:3, receivedDate:"",           status:"pending" },
    ],
    parts:[
      { id:"P101", drawingId:"D101", drawingNo:"BHEL-ESS-FR-01",  markNo:"FR-101", desc:"MAIN COLUMN RHS",    fabType:"Fabricate", matType:"MS", grade:"E250", section:"RHS",   size:"100x50x4",length:3500,qtyPerDrg:4, clientUnitWt:32.27,  clientTotalWt:129.08, source:"Procure" },
      { id:"P102", drawingId:"D101", drawingNo:"BHEL-ESS-FR-01",  markNo:"FR-102", desc:"HORIZONTAL ISMB",    fabType:"Fabricate", matType:"MS", grade:"E250", section:"ISMB",  size:"200",     length:2000,qtyPerDrg:3, clientUnitWt:50.8,   clientTotalWt:152.4,  source:"Procure" },
      { id:"P103", drawingId:"D101", drawingNo:"BHEL-ESS-FR-01",  markNo:"PL-103", desc:"MOUNTING PLATE 16MM",fabType:"Fabricate", matType:"MS", grade:"E350", section:"PLATE", size:"16mm",    length:400, qtyPerDrg:2, clientUnitWt:20.096, clientTotalWt:40.192, source:"Procure" },
      { id:"P104", drawingId:"D102", drawingNo:"BHEL-ESS-PED-01", markNo:"PED-201",desc:"PEDESTAL ISMC",      fabType:"Fabricate", matType:"MS", grade:"E250", section:"ISMC",  size:"200",     length:800, qtyPerDrg:2, clientUnitWt:17.68,  clientTotalWt:35.36,  source:"Procure" },
      { id:"P105", drawingId:"D102", drawingNo:"BHEL-ESS-PED-01", markNo:"BP-202", desc:"BASE PLATE 12MM",    fabType:"Fabricate", matType:"MS", grade:"E250", section:"PLATE", size:"12mm",    length:300, qtyPerDrg:1, clientUnitWt:8.478,  clientTotalWt:8.478,  source:"Procure" },
    ],
    quality:{ approvedMakes:[ {matType:"MS Plates",makes:"JSW Steel, SAIL, Tata Steel"},{matType:"RHS/SHS",makes:"APL Apollo, Tata Structura"} ] },
  },
];

// ─── SEED: PURCHASE REQUIREMENTS (from MRP nesting) ──────────────────────────
const INIT_PURCHASE_REQS = [
  { id:"PR-001", orderId:"SF-2025-0001", drawingId:"D001", drawingNo:"TPL-JETTY-COL-01", matType:"MS",   grade:"E250", section:"ISA",     size:"75x75x8",    wtRequired:534.0,  approvedMakes:"JSW Steel, SAIL",   status:"approved", createdDate:"2025-01-20", remarks:"4 drawings × 80 pcs" },
  { id:"PR-002", orderId:"SF-2025-0001", drawingId:"D001", drawingNo:"TPL-JETTY-COL-01", matType:"MS",   grade:"E250", section:"ISA",     size:"150x150x16", wtRequired:241.65, approvedMakes:"JSW Steel, SAIL",   status:"approved", createdDate:"2025-01-20", remarks:"" },
  { id:"PR-003", orderId:"SF-2025-0001", drawingId:"D001", drawingNo:"TPL-JETTY-COL-01", matType:"MS",   grade:"E250", section:"PLATE",   size:"10mm",       wtRequired:392.5,  approvedMakes:"JSW Steel, SAIL",   status:"approved", createdDate:"2025-01-20", remarks:"" },
  { id:"PR-004", orderId:"SF-2025-0001", drawingId:"D002", drawingNo:"TPL-JETTY-BM-01",  matType:"MS",   grade:"E250", section:"ISMB",    size:"300",        wtRequired:3429.84,approvedMakes:"JSW Steel, SAIL",   status:"approved", createdDate:"2025-01-20", remarks:"6 beams" },
  { id:"PR-005", orderId:"SF-2025-0001", drawingId:"D002", drawingNo:"TPL-JETTY-BM-01",  matType:"MS",   grade:"E250", section:"Flat Bar",size:"75x10",      wtRequired:264.9,  approvedMakes:"JSW Steel, SAIL",   status:"approved", createdDate:"2025-01-20", remarks:"" },
  { id:"PR-006", orderId:"SF-2025-0001", drawingId:"D003", drawingNo:"TPL-JETTY-BP-01",  matType:"MS",   grade:"E250", section:"PLATE",   size:"12mm",       wtRequired:271.296,approvedMakes:"JSW Steel, SAIL",   status:"approved", createdDate:"2025-01-20", remarks:"" },
  { id:"PR-007", orderId:"SF-2025-0001", drawingId:"D004", drawingNo:"TPL-JETTY-BRK-01", matType:"MS",   grade:"E250", section:"ISA",     size:"100x100x10", wtRequired:1716.48,approvedMakes:"JSW Steel, SAIL",   status:"approved", createdDate:"2025-01-21", remarks:"" },
  { id:"PR-008", orderId:"SF-2025-0001", drawingId:"D004", drawingNo:"TPL-JETTY-BRK-01", matType:"MS",   grade:"E250", section:"PLATE",   size:"8mm",        wtRequired:452.352,approvedMakes:"JSW Steel, SAIL",   status:"approved", createdDate:"2025-01-21", remarks:"" },
  { id:"PR-009", orderId:"SF-2025-0002", drawingId:"D101", drawingNo:"BHEL-ESS-FR-01",   matType:"MS",   grade:"E250", section:"RHS",     size:"100x50x4",   wtRequired:258.16, approvedMakes:"APL Apollo",        status:"approved", createdDate:"2025-02-05", remarks:"" },
  { id:"PR-010", orderId:"SF-2025-0002", drawingId:"D101", drawingNo:"BHEL-ESS-FR-01",   matType:"MS",   grade:"E250", section:"ISMB",    size:"200",        wtRequired:304.8,  approvedMakes:"JSW Steel, SAIL",   status:"approved", createdDate:"2025-02-05", remarks:"" },
  { id:"PR-011", orderId:"SF-2025-0002", drawingId:"D101", drawingNo:"BHEL-ESS-FR-01",   matType:"MS",   grade:"E350", section:"PLATE",   size:"16mm",       wtRequired:80.384, approvedMakes:"JSW Steel, SAIL",   status:"approved", createdDate:"2025-02-05", remarks:"" },
  { id:"PR-012", orderId:"SF-2025-0002", drawingId:"D102", drawingNo:"BHEL-ESS-PED-01",  matType:"MS",   grade:"E250", section:"ISMC",    size:"200",        wtRequired:141.44, approvedMakes:"JSW Steel, SAIL",   status:"approved", createdDate:"2025-02-05", remarks:"" },
  { id:"PR-013", orderId:"SF-2025-0002", drawingId:"D102", drawingNo:"BHEL-ESS-PED-01",  matType:"MS",   grade:"E250", section:"PLATE",   size:"12mm",       wtRequired:33.912, approvedMakes:"JSW Steel, SAIL",   status:"approved", createdDate:"2025-02-05", remarks:"" },
];

// ─── SEED: POs ────────────────────────────────────────────────────────────────
const INIT_POS = [
  {
    id:"PO-2025-001", vendorId:"V-001", vendorCode:"JSW001", vendorName:"JSW Steel Limited", poDate:"2025-01-25", expectedDelivery:"2025-02-05",
    servedOrders:["SF-2025-0001"], status:"partially_received", remarks:"First batch for Phase 1",
    lines:[
      { id:"POL-001", matType:"MS", grade:"E250", section:"ISA",    size:"75x75x8",    qty:2,   unit:"MT", unitPrice:65000, totalPrice:130000, wtOrdered:2000, wtReceived:2000, status:"fully_received"    },
      { id:"POL-002", matType:"MS", grade:"E250", section:"ISA",    size:"150x150x16", qty:1,   unit:"MT", unitPrice:67000, totalPrice:67000,  wtOrdered:1000, wtReceived:500,  status:"partially_received"},
      { id:"POL-003", matType:"MS", grade:"E250", section:"ISMB",   size:"300",        qty:5,   unit:"MT", unitPrice:66000, totalPrice:330000, wtOrdered:5000, wtReceived:0,    status:"pending"           },
      { id:"POL-004", matType:"MS", grade:"E250", section:"PLATE",  size:"10mm",       qty:1.5, unit:"MT", unitPrice:64000, totalPrice:96000,  wtOrdered:1500, wtReceived:1500, status:"fully_received"    },
    ],
    grns:[
      {
        id:"GRN-2025-001", batchNo:"JSW001-2025-001", date:"2025-02-04", vehicleNo:"MH-31-AB-1234", challanNo:"JSW/CH/2025/4521",
        lines:[
          { poLineId:"POL-001", materialDesc:"ISA 75x75x8 E250", qty:2,   unit:"MT", wtReceived:2000, condition:"good", inspStatus:"approved" },
          { poLineId:"POL-002", materialDesc:"ISA 150x150x16 E250", qty:0.5, unit:"MT", wtReceived:500,  condition:"good", inspStatus:"approved" },
          { poLineId:"POL-004", materialDesc:"MS PLATE 10mm E250", qty:1.5, unit:"MT", wtReceived:1500, condition:"good", inspStatus:"approved" },
        ],
        remarks:"All materials in good condition. MTC attached.",
        createdBy:"Mohan Das",
      },
    ],
  },
  {
    id:"PO-2025-002", vendorId:"V-001", vendorCode:"JSW001", vendorName:"JSW Steel Limited", poDate:"2025-01-28", expectedDelivery:"2025-02-10",
    servedOrders:["SF-2025-0001","SF-2025-0002"], status:"pending", remarks:"Combined PO for ISMB and PLATE",
    lines:[
      { id:"POL-005", matType:"MS", grade:"E250", section:"PLATE", size:"12mm",  qty:2,   unit:"MT", unitPrice:64500, totalPrice:129000, wtOrdered:2000, wtReceived:0, status:"pending" },
      { id:"POL-006", matType:"MS", grade:"E250", section:"ISMB",  size:"200",   qty:1,   unit:"MT", unitPrice:66000, totalPrice:66000,  wtOrdered:1000, wtReceived:0, status:"pending" },
      { id:"POL-007", matType:"MS", grade:"E350", section:"PLATE", size:"16mm",  qty:0.5, unit:"MT", unitPrice:68000, totalPrice:34000,  wtOrdered:500,  wtReceived:0, status:"pending" },
    ],
    grns:[],
  },
  {
    id:"PO-2025-003", vendorId:"V-003", vendorCode:"APL003", vendorName:"APL Apollo Tubes", poDate:"2025-02-02", expectedDelivery:"2025-02-12",
    servedOrders:["SF-2025-0002"], status:"pending", remarks:"RHS for BHEL ESS frame",
    lines:[
      { id:"POL-008", matType:"MS", grade:"E250", section:"RHS", size:"100x50x4", qty:0.5, unit:"MT", unitPrice:72000, totalPrice:36000, wtOrdered:500, wtReceived:0, status:"pending" },
    ],
    grns:[],
  },
  {
    id:"PO-2026-002", vendorId:"V-003", vendorCode:"APL003", vendorName:"APL Apollo Tubes", poDate:"2026-03-12", expectedDelivery:"2026-03-22",
    servedOrders:["SF-2025-0002"], status:"partially_received", remarks:"RHS and SHS for BHEL frame — second order",
    lines:[
      { id:"POL-013", matType:"MS", grade:"E250", section:"RHS", size:"100x50x4", qty:1,   unit:"MT", unitPrice:72000, totalPrice:72000,  wtOrdered:1000, wtReceived:1000, status:"fully_received"     },
      { id:"POL-014", matType:"MS", grade:"E250", section:"SHS", size:"75x75x5",  qty:0.5, unit:"MT", unitPrice:74000, totalPrice:37000,  wtOrdered:500,  wtReceived:250,  status:"partially_received" },
      { id:"POL-015", matType:"MS", grade:"E250", section:"RHS", size:"50x50x4",  qty:0.5, unit:"MT", unitPrice:71000, totalPrice:35500,  wtOrdered:500,  wtReceived:0,    status:"pending"            },
    ],
    grns:[
      {
        id:"GRN-2026-002", batchNo:"APL003-2026-001", date:"2026-03-15", vehicleNo:"MH-31-EF-9012", challanNo:"APL/CH/2026/0098",
        bayId:"BAY-09",
        lines:[
          { poLineId:"POL-013", materialDesc:"RHS 100x50x4 E250", qty:1,   unit:"MT", wtReceived:1000, condition:"good", inspStatus:"approved" },
          { poLineId:"POL-014", materialDesc:"SHS 75x75x5 E250",  qty:0.25,unit:"MT", wtReceived:250,  condition:"good", inspStatus:"approved" },
        ],
        remarks:"Both lots received in good condition. MTC pending from supplier.",
        createdBy:"Mohan Das",
      },
    ],
  },
  {
    id:"PO-2026-001", vendorId:"V-002", vendorCode:"STE002", vendorName:"Steel Authority of India", poDate:"2026-03-10", expectedDelivery:"2026-03-20",
    servedOrders:["SF-2025-0001","SF-2025-0002"], status:"partially_received", remarks:"Phase 2 bulk order — ISMB, plates and angles",
    lines:[
      { id:"POL-009", matType:"MS", grade:"E250", section:"ISMB",    size:"300",       qty:3,   unit:"MT", unitPrice:66500, totalPrice:199500, wtOrdered:3000, wtReceived:3000, status:"fully_received"     },
      { id:"POL-010", matType:"MS", grade:"E250", section:"PLATE",   size:"12mm",      qty:2,   unit:"MT", unitPrice:64000, totalPrice:128000, wtOrdered:2000, wtReceived:800,  status:"partially_received" },
      { id:"POL-011", matType:"MS", grade:"E250", section:"ISA",     size:"100x100x10",qty:1.5, unit:"MT", unitPrice:65500, totalPrice:98250,  wtOrdered:1500, wtReceived:0,    status:"pending"            },
      { id:"POL-012", matType:"MS", grade:"E350", section:"PLATE",   size:"20mm",      qty:1,   unit:"MT", unitPrice:70000, totalPrice:70000,  wtOrdered:1000, wtReceived:0,    status:"pending"            },
    ],
    grns:[
      {
        id:"GRN-2026-001", batchNo:"STE002-2026-001", date:"2026-03-14", vehicleNo:"MH-40-CD-5678", challanNo:"SAIL/CH/2026/0312",
        bayId:"BAY-07",
        lines:[
          { poLineId:"POL-009", materialDesc:"ISMB 300 E250", qty:3,   unit:"MT", wtReceived:3000, condition:"good",    inspStatus:"approved" },
          { poLineId:"POL-010", materialDesc:"MS PLATE 12mm E250", qty:0.8, unit:"MT", wtReceived:800,  condition:"damaged", inspStatus:"hold"     },
        ],
        holdReason:"Surface rust and minor edge damage on plates — awaiting QC decision",
        remarks:"ISMB cleared. Plate lot held pending QC re-inspection.",
        createdBy:"Mohan Das",
      },
    ],
  },
];

// ─── SEED: STOCK ──────────────────────────────────────────────────────────────
const INIT_STOCK = [
  { id:"STK-001", lotNo:"LOT-2025-001", batchNo:"JSW001-2025-001", poId:"PO-2025-001", poLineId:"POL-001", grnId:"GRN-2025-001", vendorId:"V-001", vendorCode:"JSW001", vendorName:"JSW Steel Limited", matType:"MS", grade:"E250", section:"ISA",   size:"75x75x8",    itemCode:"", matCode:"", matLibId:"", heatNo:"", wtReceived:2000, wtAvailable:1800, wtAllocated:200, wtIssued:0, wtConsumed:0, status:"available", bayId:"BAY-03", mtcUploaded:true,  mtcDoc:"https://drive.google.com/file/d/mtc001/view", rmQcStatus:"approved", clientInspStatus:"approved", receivedDate:"2025-02-04", isOffcut:false, parentLotId:"", allocations:[{orderId:"SF-2025-0001",drawingId:"D001",wt:200}] },
  { id:"STK-002", lotNo:"LOT-2025-002", batchNo:"JSW001-2025-001", poId:"PO-2025-001", poLineId:"POL-002", grnId:"GRN-2025-001", vendorId:"V-001", vendorCode:"JSW001", vendorName:"JSW Steel Limited", matType:"MS", grade:"E250", section:"ISA",   size:"150x150x16", itemCode:"", matCode:"", matLibId:"", heatNo:"", wtReceived:500,  wtAvailable:500,  wtAllocated:0,   wtIssued:0, wtConsumed:0, status:"available", bayId:"BAY-03", mtcUploaded:true,  mtcDoc:"https://drive.google.com/file/d/mtc002/view", rmQcStatus:"approved", clientInspStatus:"approved", receivedDate:"2025-02-04", isOffcut:false, parentLotId:"", allocations:[] },
  { id:"STK-003", lotNo:"LOT-2025-003", batchNo:"JSW001-2025-001", poId:"PO-2025-001", poLineId:"POL-004", grnId:"GRN-2025-001", vendorId:"V-001", vendorCode:"JSW001", vendorName:"JSW Steel Limited", matType:"MS", grade:"E250", section:"PLATE", size:"10mm",       itemCode:"", matCode:"", matLibId:"", heatNo:"", wtReceived:1500, wtAvailable:1200, wtAllocated:300, wtIssued:0, wtConsumed:0, status:"available", bayId:"BAY-05", mtcUploaded:true,  mtcDoc:"https://drive.google.com/file/d/mtc003/view", rmQcStatus:"approved", clientInspStatus:"approved", receivedDate:"2025-02-04", isOffcut:false, parentLotId:"", allocations:[{orderId:"SF-2025-0001",drawingId:"D001",wt:300}] },
  { id:"STK-004", lotNo:"LOT-2025-004", batchNo:"JSW001-2025-001", poId:"PO-2025-001", poLineId:"POL-001", grnId:"GRN-2025-001", vendorId:"V-001", vendorCode:"JSW001", vendorName:"JSW Steel Limited", matType:"MS", grade:"E250", section:"ISA",   size:"75x75x8",    itemCode:"", matCode:"", matLibId:"", heatNo:"", wtReceived:800,  wtAvailable:800,  wtAllocated:0,   wtIssued:0, wtConsumed:0, status:"qc_hold",  bayId:"BAY-04", mtcUploaded:false, mtcDoc:"", rmQcStatus:"pending",  clientInspStatus:"pending",  receivedDate:"2025-02-06", isOffcut:false, parentLotId:"", allocations:[], qcHoldReason:"MTC not received from supplier" },
  { id:"STK-005", lotNo:"LOT-2026-001", batchNo:"STE002-2026-001", poId:"PO-2026-001", poLineId:"POL-009", grnId:"GRN-2026-001", vendorId:"V-002", vendorCode:"STE002", vendorName:"Steel Authority of India", matType:"MS", grade:"E250", section:"ISMB",  size:"300",       itemCode:"", matCode:"", matLibId:"", heatNo:"", wtReceived:3000, wtAvailable:3000, wtAllocated:0, wtIssued:0, wtConsumed:0, status:"qc_hold", bayId:"BAY-07", mtcUploaded:false, mtcDoc:"", rmQcStatus:"pending", clientInspStatus:"pending", receivedDate:"2026-03-14", isOffcut:false, parentLotId:"", allocations:[], qcHoldReason:"" },
  { id:"STK-006", lotNo:"LOT-2026-002", batchNo:"STE002-2026-001", poId:"PO-2026-001", poLineId:"POL-010", grnId:"GRN-2026-001", vendorId:"V-002", vendorCode:"STE002", vendorName:"Steel Authority of India", matType:"MS", grade:"E250", section:"PLATE", size:"12mm",      itemCode:"", matCode:"", matLibId:"", heatNo:"", wtReceived:800,  wtAvailable:800,  wtAllocated:0, wtIssued:0, wtConsumed:0, status:"qc_hold",   bayId:"BAY-07", mtcUploaded:false, mtcDoc:"", rmQcStatus:"pending",  clientInspStatus:"pending", receivedDate:"2026-03-14", isOffcut:false, parentLotId:"", allocations:[], qcHoldReason:"Surface rust and minor edge damage on plates — awaiting QC decision" },
  { id:"STK-007", lotNo:"LOT-2026-003", batchNo:"APL003-2026-001", poId:"PO-2026-002", poLineId:"POL-013", grnId:"GRN-2026-002", vendorId:"V-003", vendorCode:"APL003", vendorName:"APL Apollo Tubes",        matType:"MS", grade:"E250", section:"RHS",   size:"100x50x4",  itemCode:"", matCode:"", matLibId:"", heatNo:"", wtReceived:1000, wtAvailable:1000, wtAllocated:0, wtIssued:0, wtConsumed:0, status:"qc_hold", bayId:"BAY-09", mtcUploaded:false, mtcDoc:"", rmQcStatus:"pending", clientInspStatus:"pending", receivedDate:"2026-03-15", isOffcut:false, parentLotId:"", allocations:[], qcHoldReason:"" },
  { id:"STK-008", lotNo:"LOT-2026-004", batchNo:"APL003-2026-001", poId:"PO-2026-002", poLineId:"POL-014", grnId:"GRN-2026-002", vendorId:"V-003", vendorCode:"APL003", vendorName:"APL Apollo Tubes",        matType:"MS", grade:"E250", section:"SHS",   size:"75x75x5",   itemCode:"", matCode:"", matLibId:"", heatNo:"", wtReceived:250,  wtAvailable:250,  wtAllocated:0, wtIssued:0, wtConsumed:0, status:"qc_hold", bayId:"BAY-09", mtcUploaded:false, mtcDoc:"", rmQcStatus:"pending", clientInspStatus:"pending", receivedDate:"2026-03-15", isOffcut:false, parentLotId:"", allocations:[], qcHoldReason:"" },
];

// ─── NESTING RUNS ─────────────────────────────────────────────────────────────
const INIT_NESTING_RUNS = [
  { id:"NEST-2025-001", runDate:"2025-02-10", runBy:"Vikram Singh", materialCode:"ISA/MS/E250/75X75X8", orders:["SF-2025-0001"], drawings:["D001","D004"], lotsUsed:["STK-001"], sheetsOrBarsUsed:18, utilisationPct:84.2, wasteKg:312, offcutsCreated:[], dxfLink:"https://drive.google.com/file/d/nest001/view", status:"confirmed", parts:[] },
  { id:"NEST-2026-001", runDate:"2026-03-18", runBy:"Vikram Singh", materialCode:"ISMB/MS/E250/300", orders:["SF-2025-0001","SF-2025-0002"], drawings:["D002","D101"], lotsUsed:["STK-005"], sheetsOrBarsUsed:12, utilisationPct:91.5, wasteKg:88, offcutsCreated:[], dxfLink:"", status:"draft", parts:[] },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = {
  num:      (n) => new Intl.NumberFormat("en-IN").format(n||0),
  currency: (n) => `₹${new Intl.NumberFormat("en-IN",{maximumFractionDigits:0}).format(n||0)}`,
  date:     (d) => d ? new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—",
  wt:       (n) => `${new Intl.NumberFormat("en-IN",{maximumFractionDigits:2}).format(n||0)} kg`,
  wtT:      (n) => `${((n||0)/1000).toFixed(3)} T`,
  initials: (n) => n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),
};
const today = () => new Date().toISOString().slice(0,10);
const calcWtOrdered = (qty, unit) => (unit||"MT")==="MT" ? (qty||0)*1000 : (qty||0);
const buildMatCode = (sectionType, matType, grade, size) =>
  [sectionType, matType, grade, size].map(s=>(s||"").toUpperCase()).join("/");
const buildItemCode = (l) => {
  if (!l.matCode) return l.section ? buildMatCode(l.section, l.matType, l.grade, l.size) : "";
  if (l.isPlate) return (l.sheetLength&&l.sheetWidth) ? `${l.matCode}/${l.sheetLength}X${l.sheetWidth}` : l.matCode;
  return l.stdLength ? `${l.matCode}/${l.stdLength}` : l.matCode;
};
const calcPoLineWt = (l) => {
  if (l.matLibId) {
    if (l.isPlate) return (l.qty||0)*((l.sheetLength||0)/1000)*((l.sheetWidth||0)/1000)*(l.wtPerM2||0);
    return (l.qty||0)*((l.stdLength||0)/1000)*(l.wtPerMetre||0);
  }
  return calcWtOrdered(l.qty, l.unit);
};
const genBatchNo = (vendorCode, allPos, year) => {
  let max = 0;
  allPos.forEach(po => {
    if (!po.vendorCode || po.vendorCode !== vendorCode) return;
    (po.grns||[]).forEach(grn => {
      const m = (grn.batchNo||"").match(/^[A-Z0-9]+-(\d{4})-(\d+)$/);
      if (m && +m[1]===year) max = Math.max(max, +m[2]);
    });
  });
  return `${vendorCode}-${year}-${String(max+1).padStart(3,"0")}`;
};
const buildStockLots = (grnForm, po, grnId, ts) =>
  (grnForm.lines||[]).filter(l=>(l.wtReceived||0)>0).map((l,idx) => {
    const poLine = po.lines?.find(pl=>pl.id===l.poLineId)||{};
    return {
      id:`LOT-${ts}-${idx}`, poId:po.id, poLineId:l.poLineId, grnId,
      vendorId:po.vendorId, vendorName:po.vendorName, vendorCode:po.vendorCode||"",
      batchNo:grnForm.batchNo||"",
      itemCode:poLine.itemCode||"", matCode:poLine.matCode||"", matLibId:poLine.matLibId||"",
      matType:poLine.matType||"", grade:poLine.grade||"", section:poLine.section||"", size:poLine.size||"",
      heatNo:l.heatNo||"",
      wtReceived:l.wtReceived, wtAvailable:l.wtReceived, wtAllocated:0, wtIssued:0, wtConsumed:0,
      status:"qc_hold", bayId:grnForm.bayId||"", mtcUploaded:false, mtcDoc:"",
      rmQcStatus:"pending", clientInspStatus:"pending", receivedDate:today(),
      isOffcut:false, parentLotId:"",
      allocations:[], qcHoldReason:(l.inspStatus||"")==="hold"?(grnForm.holdReason||""):"",
    };
  });

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
const css = {
  card:  { background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:8, padding:16 },
  input: { background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:6, color:T.text, padding:"7px 11px", fontSize:13, fontFamily:T.font, width:"100%", outline:"none", boxSizing:"border-box" },
  label: { fontSize:10, color:T.textMid, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:3, display:"block" },
  btn:{
    primary:   { background:T.accent,  color:"#fff",     border:"none",                     borderRadius:6, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:T.font },
    secondary: { background:"transparent", color:T.textMid, border:`1px solid ${T.border}`, borderRadius:6, padding:"7px 14px", fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:T.font },
    danger:    { background:T.redLo,   color:T.red,      border:`1px solid ${T.redLo}`,     borderRadius:6, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:T.font },
    ghost:     { background:"transparent", color:T.textLow, border:"none",                  borderRadius:4, padding:"4px 8px",  fontSize:11, cursor:"pointer", fontFamily:T.font },
    sm:        { background:T.accent,  color:"#fff",     border:"none",                     borderRadius:4, padding:"4px 10px", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:T.font },
    amber:     { background:T.amberBg, color:T.amber,    border:`1px solid ${T.amber}`,     borderRadius:6, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:T.font },
    green:     { background:T.greenLo, color:T.green,    border:`1px solid ${T.green}`,     borderRadius:6, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:T.font },
  },
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
const Badge = ({ children, color="blue" }) => {
  const C = { blue:{bg:"#1D3A5F",text:T.accentHi}, green:{bg:T.greenLo,text:T.green}, amber:{bg:"#3D2A00",text:T.amber}, red:{bg:T.redLo,text:T.red}, gray:{bg:"#1E293B",text:T.textMid}, gold:{bg:"#3D2A00",text:T.gold}, purple:{bg:"#2D1B69",text:"#A78BFA"}, teal:{bg:"#0D3340",text:"#22D3EE"} };
  const c=C[color]||C.blue;
  return <span style={{ background:c.bg, color:c.text, borderRadius:4, padding:"2px 7px", fontSize:11, fontWeight:700, letterSpacing:"0.03em", whiteSpace:"nowrap" }}>{children}</span>;
};
const StatCard = ({ label, value, sub, color=T.accent }) => (
  <div style={{ ...css.card, flex:1, minWidth:130 }}>
    <div style={{ fontSize:10, color:T.textMid, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:24, fontWeight:700, color, fontFamily:T.fontMono, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textLow, marginTop:4 }}>{sub}</div>}
  </div>
);
const Modal = ({ title, onClose, children, width=660 }) => (
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
const Field = ({ label, children, required }) => (
  <div style={{ marginBottom:12 }}>
    <label style={css.label}>{label}{required&&<span style={{color:T.red}}> *</span>}</label>
    {children}
  </div>
);
const Input = (p) => <input {...p} style={{ ...css.input, ...p.style }} />;
const Sel = ({ children, ...p }) => <select {...p} style={{ ...css.input, ...p.style }}>{children}</select>;
const Textarea = (p) => <textarea {...p} style={{ ...css.input, minHeight:64, resize:"vertical", ...p.style }} />;
const G2 = ({ children, style }) => <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, ...style }}>{children}</div>;
const G3 = ({ children }) => <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>{children}</div>;
const SectionHd = ({ title, action, sub }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
    <div>
      <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{title}</div>
      {sub && <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>{sub}</div>}
    </div>
    {action}
  </div>
);
const TH = ({ children, right, mono }) => <th style={{ padding:"7px 10px", textAlign:right?"right":"left", fontSize:10, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:"0.04em", borderBottom:`2px solid ${T.borderHi}`, background:T.bgInput, whiteSpace:"nowrap", fontFamily:mono?T.fontMono:T.font }}>{children}</th>;
const TD = ({ children, right, mono, bold, color, style:s }) => <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, textAlign:right?"right":"left", fontFamily:mono?T.fontMono:T.font, fontWeight:bold?700:400, color:color||T.text, ...s }}>{children}</td>;
const InfoBanner = ({ color="amber", children }) => {
  const C = { amber:{bg:T.amberBg,border:T.amber,text:T.amber}, green:{bg:T.greenBg,border:T.green,text:T.green}, red:{bg:T.redBg,border:T.redLo,text:T.red}, blue:{bg:"#0D1E3A",border:T.borderHi,text:T.accentHi} };
  const c=C[color]||C.amber;
  return <div style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:6, padding:"10px 14px", fontSize:12, color:c.text, marginBottom:14 }}>{children}</div>;
};

// ─── NAV ─────────────────────────────────────────────────────────────────────
const NAV = [
  { id:"dashboard", label:"Dashboard",    icon:"◉",  module:"dashboard"  },
  { id:"orders",    label:"Orders",       icon:"📋", module:"orders"     },
  { id:"mrp",       label:"MRP Planning", icon:"📊", module:"mrp"        },
  { id:"purchase",  label:"Purchase",     icon:"🛒", module:"purchase"   },
  { id:"stock",     label:"Stock",        icon:"📦", module:"stock"      },
  { id:"qc",        label:"RM Quality",   icon:"✓",  module:"qc"         },
  { id:"production",label:"Production",   icon:"⚙️", module:"production" },
  { id:"finance",   label:"Finance",      icon:"₹",  module:"finance"    },
  { id:"dispatch",  label:"Dispatch",     icon:"🚚", module:"dispatch"   },
  { id:"tools",     label:"Tools",        icon:"🔧", module:"tools"      },
  { id:"masters",   label:"Masters",      icon:"⚙",  module:"all"        },
];

const canSee = (user, mod) => {
  if (mod === "tools") return !!PERMISSIONS[user?.role];
  const p = PERMISSIONS[user?.role];
  return p && (p.modules.includes("all") || p.modules.includes(mod));
};

// ─── MASTERS: TABLE HELPER ────────────────────────────────────────────────────
const MTable = ({ cols, rows, emptyMsg="No records found" }) => (
  <div style={{ overflowX:"auto" }}>
    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
      <thead>
        <tr>{cols.map(c=><th key={c.key} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:"0.05em", borderBottom:`1px solid ${T.border}`, whiteSpace:"nowrap", background:T.bg }}>{c.label}</th>)}</tr>
      </thead>
      <tbody>
        {rows.length===0?<tr><td colSpan={cols.length} style={{ padding:32, textAlign:"center", color:T.textLow }}>{emptyMsg}</td></tr>:rows.map((row,i)=>(
          <tr key={i} style={{ background:i%2===0?"transparent":T.bg }}>
            {cols.map(c=><td key={c.key} style={{ padding:"10px 12px", borderBottom:`1px solid ${T.border}`, color:T.text, verticalAlign:"middle" }}>{c.render?c.render(row):row[c.key]??"—"}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
const MSearch = ({ value, onChange, placeholder }) => (
  <div style={{ position:"relative" }}>
    <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:T.textLow }}>🔍</span>
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||"Search..."} style={{ ...css.input, paddingLeft:32, width:220 }} />
  </div>
);
const MField = ({ label, children, required }) => (
  <div style={{ marginBottom:14 }}>
    <label style={css.label}>{label}{required&&<span style={{color:T.red}}> *</span>}</label>
    {children}
  </div>
);

// ─── MASTERS: CLIENTS ─────────────────────────────────────────────────────────
const ClientsMaster = ({ user, clients, setClients }) => {
  const [search, setSearch] = useState(""); const [modal, setModal] = useState(null); const [form, setForm] = useState({});
  const filtered = clients.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.code.toLowerCase().includes(search.toLowerCase()));
  const canEdit = user.role==="super_admin"||user.role==="finance_admin";
  const save = () => { setClients(prev=>modal==="add"?[...prev,{...form,id:`CL-${String(prev.length+1).padStart(3,"0")}`}]:prev.map(c=>c.id===form.id?form:c)); setModal(null); };
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:700, color:T.text }}>Clients ({clients.length})</div>
        <div style={{ display:"flex", gap:8 }}><MSearch value={search} onChange={setSearch} placeholder="Search clients..." />{canEdit&&<button onClick={()=>{setForm({active:true});setModal("add");}} style={css.btn.primary}>+ Add Client</button>}</div>
      </div>
      <MTable cols={[
        {key:"code", label:"Code", render:r=><span style={{fontFamily:T.fontMono,color:T.accentHi,fontWeight:700}}>{r.code}</span>},
        {key:"name", label:"Client Name"},
        {key:"gstin", label:"GSTIN", render:r=><span style={{fontFamily:T.fontMono,fontSize:11}}>{r.gstin}</span>},
        {key:"state", label:"State"},
        {key:"paymentTerms", label:"Payment Terms"},
        {key:"creditLimit", label:"Credit Limit", render:r=>fmt.currency(r.creditLimit)},
        {key:"active", label:"Status", render:r=><Badge color={r.active?"green":"gray"}>{r.active?"Active":"Inactive"}</Badge>},
        {key:"actions", label:"", render:r=>canEdit?<button onClick={()=>{setForm({...r});setModal("edit");}} style={css.btn.ghost}>Edit</button>:null},
      ]} rows={filtered} />
      {modal&&<Modal title={modal==="add"?"Add Client":"Edit Client"} onClose={()=>setModal(null)} width={640}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <MField label="Code" required><input value={form.code||""} onChange={e=>setForm({...form,code:e.target.value})} style={css.input} /></MField>
          <MField label="Name" required><input value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})} style={css.input} /></MField>
          <MField label="GSTIN"><input value={form.gstin||""} onChange={e=>setForm({...form,gstin:e.target.value})} style={css.input} /></MField>
          <MField label="PAN"><input value={form.pan||""} onChange={e=>setForm({...form,pan:e.target.value})} style={css.input} /></MField>
          <MField label="State"><input value={form.state||""} onChange={e=>setForm({...form,state:e.target.value})} style={css.input} /></MField>
          <MField label="State Code"><input value={form.stateCode||""} onChange={e=>setForm({...form,stateCode:e.target.value})} style={css.input} /></MField>
          <MField label="Payment Terms"><input value={form.paymentTerms||""} onChange={e=>setForm({...form,paymentTerms:e.target.value})} style={css.input} /></MField>
          <MField label="Credit Limit"><input type="number" value={form.creditLimit||""} onChange={e=>setForm({...form,creditLimit:+e.target.value})} style={css.input} /></MField>
        </div>
        <MField label="Billing Address"><textarea value={form.billing?.addr||""} onChange={e=>setForm({...form,billing:{...form.billing,addr:e.target.value}})} style={{ ...css.input, minHeight:72, resize:"vertical" }} /></MField>
        <MField label="Notes"><textarea value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})} style={{ ...css.input, minHeight:56, resize:"vertical" }} /></MField>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}><button onClick={()=>setModal(null)} style={css.btn.secondary}>Cancel</button><button onClick={save} style={css.btn.primary}>Save Client</button></div>
      </Modal>}
    </div>
  );
};

// ─── MASTERS: VENDORS ─────────────────────────────────────────────────────────
const VENDOR_TYPE_LABEL = { RM:"RM Supplier", PT:"Paint Supplier", TR:"Transport", OP:"Outbound / Processing", SV:"Service" };

// Returns { prefix, code, collision, colliderName, colliderCode, suggestion }
const genVendorCode = (name, vendors, excludeId) => {
  const words = name.trim().toUpperCase().replace(/[^A-Z0-9 ]/g,"").split(/\s+/).filter(Boolean);
  let prefix = "";
  if (words.length >= 3)      prefix = words[0][0]+words[1][0]+words[2][0];
  else if (words.length === 2) prefix = (words[0].slice(0,2)+words[1][0]).slice(0,3);
  else                         prefix = (words[0]||"VND").slice(0,3);
  prefix = prefix.padEnd(3,"X").slice(0,3);

  const seq = vendors.reduce((max,v)=>{
    if (excludeId && v.id===excludeId) return max;
    const n = parseInt((v.vendorCode||"").slice(3)||"0",10);
    return isNaN(n)?max:Math.max(max,n);
  },0)+1;
  const code = `${prefix}${String(seq).padStart(3,"0")}`;

  const collider = vendors.find(v=>v.id!==excludeId && (v.vendorCode||"").startsWith(prefix));
  return { prefix, code, seq, collision: !!collider, colliderName:collider?.name||"", colliderCode:collider?.vendorCode||"", suggestion: collider ? `${prefix.slice(0,2)}X${String(seq).padStart(3,"0")}` : code };
};

const VendorsMaster = ({ user, vendors, setVendors }) => {
  const [search, setSearch] = useState(""); const [typeFilter, setTypeFilter] = useState("all");
  const [modal, setModal] = useState(null); // null | "add" | "edit"
  const [form, setForm] = useState({});
  const [customPrefix, setCustomPrefix] = useState("");
  const canEdit = user.role==="super_admin"||user.role==="purchase_admin";

  const filtered = vendors.filter(v=>{
    const q = search.toLowerCase();
    const matchText = v.name.toLowerCase().includes(q)||( v.vendorCode||"").toLowerCase().includes(q)||(v.vendorShortName||"").toLowerCase().includes(q);
    return matchText && (typeFilter==="all"||v.vendorType===typeFilter);
  });

  const openAdd = () => { setForm({ vendorType:"RM", active:true }); setCustomPrefix(""); setModal("add"); };
  const openEdit = r => { setForm({...r}); setCustomPrefix(""); setModal("edit"); };
  const closeModal = () => setModal(null);

  // Preview code generation
  const preview = modal ? genVendorCode(form.name||"", vendors, form.id) : null;
  const effectivePrefix = customPrefix.length===3 ? customPrefix.toUpperCase() : preview?.prefix||"";
  const effectiveCode = customPrefix.length===3
    ? `${customPrefix.toUpperCase()}${String(preview?.seq||1).padStart(3,"0")}`
    : preview?.code||"";

  const saveVendor = () => {
    if (!form.name?.trim()) return;
    const vendorCode = effectiveCode;
    const vendorShortName = effectivePrefix;
    const next = { ...form, vendorCode, vendorShortName };
    if (modal==="add") {
      next.id = `V-${String(vendors.length+1).padStart(3,"0")}`;
      setVendors(prev=>[...prev,next]);
    } else {
      setVendors(prev=>prev.map(v=>v.id===next.id?next:v));
    }
    closeModal();
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:700, color:T.text }}>Vendors & Suppliers ({vendors.length})</div>
        <div style={{ display:"flex", gap:8 }}>
          <MSearch value={search} onChange={setSearch} placeholder="Search vendors..." />
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{ ...css.input, width:180 }}>
            <option value="all">All Types</option>
            {Object.entries(VENDOR_TYPE_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
          {canEdit&&<button onClick={openAdd} style={css.btn.primary}>+ Add Vendor</button>}
        </div>
      </div>
      <MTable cols={[
        {key:"vendorCode", label:"Vendor Code", render:r=><span style={{fontFamily:T.fontMono,color:T.accentHi,fontWeight:700}}>{r.vendorCode||"—"}</span>},
        {key:"name", label:"Vendor Name"},
        {key:"vendorType", label:"Type", render:r=><Badge color="blue">{VENDOR_TYPE_LABEL[r.vendorType]||r.vendorType||"—"}</Badge>},
        {key:"gstin", label:"GSTIN", render:r=><span style={{fontFamily:T.fontMono,fontSize:11}}>{r.gstin||"—"}</span>},
        {key:"state", label:"State"},
        {key:"contact", label:"Contact"},
        {key:"active", label:"Status", render:r=><Badge color={r.active?"green":"gray"}>{r.active?"Active":"Inactive"}</Badge>},
        {key:"actions", label:"", render:r=>canEdit?<button onClick={()=>openEdit(r)} style={css.btn.ghost}>Edit</button>:null},
      ]} rows={filtered} />

      {modal&&<Modal title={modal==="add"?"Add Vendor":"Edit Vendor"} onClose={closeModal} width={520}>
        <MField label="Vendor Name *"><input value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={css.input} placeholder="e.g. Tata Steel Limited" /></MField>
        <MField label="Type *">
          <select value={form.vendorType||"RM"} onChange={e=>setForm(f=>({...f,vendorType:e.target.value}))} style={css.input}>
            {Object.entries(VENDOR_TYPE_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
        </MField>

        {/* Code Preview */}
        {form.name&&preview&&<div style={{ background:T.surface2, border:`1px solid ${preview.collision&&!customPrefix?T.amber:T.border}`, borderRadius:8, padding:12, marginBottom:12 }}>
          <div style={{ fontSize:11, color:T.textMid, marginBottom:6 }}>VENDOR CODE PREVIEW</div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontFamily:T.fontMono, fontSize:22, fontWeight:800, color:T.accentHi }}>{effectiveCode}</span>
            <div style={{ fontSize:12, color:T.textLow }}>
              <div>Prefix: <b style={{fontFamily:T.fontMono}}>{effectivePrefix}</b> · Seq: <b style={{fontFamily:T.fontMono}}>#{preview.seq}</b></div>
            </div>
          </div>
          {preview.collision&&!customPrefix&&<div style={{ marginTop:8, padding:"6px 10px", background:T.amberBg, borderRadius:6, fontSize:12, color:T.amber }}>
            ⚠ Prefix collision with <b>{preview.colliderName}</b> ({preview.colliderCode}). Suggested alternative: <b style={{fontFamily:T.fontMono}}>{preview.suggestion}</b> — or enter a custom 3-letter prefix below.
          </div>}
          <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:11, color:T.textMid }}>Custom prefix (3 letters):</span>
            <input value={customPrefix} onChange={e=>setCustomPrefix(e.target.value.replace(/[^A-Za-z]/g,"").slice(0,3))}
              style={{ ...css.input, width:70, fontFamily:T.fontMono, textTransform:"uppercase" }} placeholder="e.g. TAT" maxLength={3} />
            {customPrefix.length>0&&customPrefix.length<3&&<span style={{fontSize:11,color:T.red}}>3 letters required</span>}
          </div>
        </div>}

        <MField label="GSTIN"><input value={form.gstin||""} onChange={e=>setForm(f=>({...f,gstin:e.target.value}))} style={css.input} placeholder="27AAACX1234A1Z5" /></MField>
        <MField label="State"><input value={form.state||""} onChange={e=>setForm(f=>({...f,state:e.target.value}))} style={css.input} /></MField>
        <MField label="Contact Person"><input value={form.contact||""} onChange={e=>setForm(f=>({...f,contact:e.target.value}))} style={css.input} /></MField>
        <MField label="Phone"><input value={form.phone||""} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} style={css.input} /></MField>
        <MField label="Email"><input value={form.email||""} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={css.input} /></MField>
        <MField label="Active">
          <select value={form.active?"yes":"no"} onChange={e=>setForm(f=>({...f,active:e.target.value==="yes"}))} style={css.input}>
            <option value="yes">Active</option><option value="no">Inactive</option>
          </select>
        </MField>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:8 }}>
          <button onClick={closeModal} style={css.btn.secondary}>Cancel</button>
          <button onClick={saveVendor} style={css.btn.primary} disabled={!form.name?.trim()||effectiveCode.length<6}>✓ Save Vendor</button>
        </div>
      </Modal>}
    </div>
  );
};

// ─── MASTERS: CONTRACTORS ─────────────────────────────────────────────────────
const ContractorsMaster = ({ user, contractors }) => {
  const [search, setSearch] = useState("");
  const canEdit = user.role==="super_admin"||user.role==="production_engineer";
  const typeLabel = { cutting:"Cutting", fit_up:"Fit-Up", welding:"Welding", blasting:"Blasting", painting:"Painting" };
  const filtered = contractors.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.id.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:700, color:T.text }}>Contractors ({contractors.length})</div>
        <div style={{ display:"flex", gap:8 }}><MSearch value={search} onChange={setSearch} />{canEdit&&<button style={css.btn.primary}>+ Add Contractor</button>}</div>
      </div>
      <MTable cols={[
        {key:"id", label:"ID", render:r=><span style={{fontFamily:T.fontMono,color:T.gold,fontWeight:700}}>{r.id}</span>},
        {key:"name", label:"Contractor Name"},
        {key:"type", label:"Speciality", render:r=><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{r.type.map(t=><Badge key={t} color="amber">{typeLabel[t]||t}</Badge>)}</div>},
        {key:"contact", label:"Contact"},
        {key:"gst", label:"GST", render:r=><span style={{fontFamily:T.fontMono,fontSize:11}}>{r.gst||"—"}</span>},
        {key:"address", label:"Address"},
        {key:"active", label:"Status", render:r=><Badge color={r.active?"green":"gray"}>{r.active?"Active":"Inactive"}</Badge>},
        {key:"actions", label:"", render:r=>canEdit?<button style={css.btn.ghost}>Edit</button>:null},
      ]} rows={filtered} />
    </div>
  );
};

// ─── MASTERS: BAYS ────────────────────────────────────────────────────────────
const BaysMaster = ({ user, bays, setBays }) => {
  const [modal, setModal] = useState(null); const [form, setForm] = useState({});
  const canEdit = user.role==="super_admin"||user.role==="store_admin";
  const statusColor = { available:"green", occupied:"amber", maintenance:"red" };
  return (
    <div>
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <StatCard label="Total Bays" value={bays.length} color={T.text} />
        <StatCard label="Available" value={bays.filter(b=>b.status==="available").length} color={T.green} />
        <StatCard label="Occupied" value={bays.filter(b=>b.status==="occupied").length} color={T.amber} />
      </div>
      <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:12 }}>Bay Layout (1–25)</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, marginBottom:20 }}>
        {bays.map(bay=>(
          <div key={bay.id} onClick={()=>canEdit&&(setForm({...bay}),setModal("edit"))}
            style={{ background:bay.status==="available"?T.greenBg:bay.status==="occupied"?T.amberBg:T.redBg, border:`1px solid ${bay.status==="available"?T.green:bay.status==="occupied"?T.amber:T.red}`, borderRadius:8, padding:12, cursor:canEdit?"pointer":"default" }}>
            <div style={{ fontSize:16, fontWeight:800, color:bay.status==="available"?T.green:bay.status==="occupied"?T.amber:T.red, fontFamily:T.fontMono }}>{String(bay.number).padStart(2,"0")}</div>
            <div style={{ fontSize:10, color:T.textMid, marginTop:2 }}>{bay.description||"No description"}</div>
            <div style={{ marginTop:6 }}><Badge color={statusColor[bay.status]||"gray"}>{bay.status}</Badge></div>
            {bay.currentLot&&<div style={{ fontSize:10, color:T.textLow, marginTop:4, fontFamily:T.fontMono }}>{bay.currentLot}</div>}
          </div>
        ))}
      </div>
      {modal==="edit"&&<Modal title={`Bay ${String(form.number).padStart(2,"0")}`} onClose={()=>setModal(null)} width={400}>
        <MField label="Description"><input value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})} style={css.input} placeholder="e.g. MS Plates Area" /></MField>
        <MField label="Status"><select value={form.status||"available"} onChange={e=>setForm({...form,status:e.target.value})} style={css.input}><option value="available">Available</option><option value="occupied">Occupied</option><option value="maintenance">Maintenance</option></select></MField>
        <MField label="Notes"><textarea value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})} style={{ ...css.input, minHeight:60, resize:"vertical" }} /></MField>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}><button onClick={()=>setModal(null)} style={css.btn.secondary}>Cancel</button><button onClick={()=>{setBays(prev=>prev.map(b=>b.id===form.id?form:b));setModal(null);}} style={css.btn.primary}>Save</button></div>
      </Modal>}
    </div>
  );
};

// ─── MASTERS: MATERIALS LIBRARY ───────────────────────────────────────────────
const MaterialsMaster = ({ user, materials, setMaterials }) => {
  const [search, setSearch] = useState(""); const [sectionFilter, setSectionFilter] = useState("all");
  const [modal, setModal] = useState(null); const [form, setForm] = useState({}); const [lenInput, setLenInput] = useState("");
  const canEdit = user.role==="super_admin"||user.role==="qc_admin";
  const sections = ["all",...new Set(materials.map(m=>m.sectionType))];
  const isPlateForm = form.sectionType==="PLATE";
  const previewCode = form.sectionType&&form.matType&&form.grade&&form.size ? buildMatCode(form.sectionType,form.matType,form.grade,form.size) : "";
  const filtered = materials.filter(m=>{
    const q = search.toLowerCase();
    return ((m.matCode||"").toLowerCase().includes(q)||m.size.toLowerCase().includes(q)||m.sectionType.toLowerCase().includes(q))
      && (sectionFilter==="all"||m.sectionType===sectionFilter);
  });
  const openAdd = () => { setForm({matType:"MS",grade:"E250",sectionType:"ISA",active:true}); setLenInput("6000,8000,10000,12000"); setModal("add"); };
  const openEdit = r => { setForm({...r}); setLenInput((r.standardLengths||[]).join(",")); setModal("edit"); };
  const saveMat = () => {
    if (!previewCode) return;
    const plate = form.sectionType==="PLATE";
    const standardLengths = plate ? [] : lenInput.split(",").map(s=>parseInt(s.trim(),10)).filter(n=>!isNaN(n)&&n>0);
    const next = { ...form, matCode:previewCode, isPlate:plate, standardLengths, matType:form.matType||"MS" };
    if (!plate) { next.wtPerM2=null; } else { next.wtPerMetre=null; }
    if (modal==="add") { next.id=`ML-${String(materials.length+1).padStart(3,"0")}`; setMaterials(prev=>[...prev,next]); }
    else { setMaterials(prev=>prev.map(m=>m.id===next.id?next:m)); }
    setModal(null);
  };
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:700, color:T.text }}>Materials Library ({materials.length} items)</div>
        <div style={{ display:"flex", gap:8 }}>
          <MSearch value={search} onChange={setSearch} placeholder="Search matCode / size / section..." />
          <select value={sectionFilter} onChange={e=>setSectionFilter(e.target.value)} style={{ ...css.input, width:140 }}>{sections.map(s=><option key={s} value={s}>{s==="all"?"All Sections":s}</option>)}</select>
          {canEdit&&<button onClick={openAdd} style={css.btn.primary}>+ Add Material</button>}
        </div>
      </div>
      <MTable cols={[
        {key:"matCode", label:"Material Code", render:r=><span style={{fontFamily:T.fontMono,fontSize:12,color:T.accentHi,fontWeight:700}}>{r.matCode||"—"}</span>},
        {key:"matType", label:"Type", render:r=><Badge color="blue">{r.matType}</Badge>},
        {key:"grade", label:"Grade", render:r=><Badge color="amber">{r.grade}</Badge>},
        {key:"sectionType", label:"Section"},
        {key:"size", label:"Size", render:r=><span style={{fontFamily:T.fontMono,fontWeight:700}}>{r.size}</span>},
        {key:"weight", label:"Unit Weight", render:r=><span style={{fontFamily:T.fontMono}}>{r.wtPerMetre?`${r.wtPerMetre} kg/m`:`${r.wtPerM2} kg/m²`}</span>},
        {key:"stdLen", label:"Std Lengths", render:r=>r.isPlate?<span style={{color:T.textLow,fontSize:11}}>—</span>:<span style={{fontFamily:T.fontMono,fontSize:11}}>{(r.standardLengths||[]).map(l=>`${l/1000}m`).join(", ")||"—"}</span>},
        {key:"active", label:"Status", render:r=><Badge color={r.active?"green":"gray"}>{r.active?"Active":"Inactive"}</Badge>},
        {key:"actions", label:"", render:r=>canEdit?<button onClick={()=>openEdit(r)} style={css.btn.ghost}>Edit</button>:null},
      ]} rows={filtered} />
      {modal&&<Modal title={modal==="add"?"Add Material":"Edit Material"} onClose={()=>setModal(null)} width={520}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
          <MField label="Section Type *">
            <select value={form.sectionType||"ISA"} onChange={e=>setForm(f=>({...f,sectionType:e.target.value,isPlate:e.target.value==="PLATE",wtPerMetre:e.target.value==="PLATE"?null:f.wtPerMetre,wtPerM2:e.target.value==="PLATE"?f.wtPerM2:null}))} style={css.input}>
              {["ISA","ISMC","ISMB","ISLB","ISWB","PLATE","RHS","SHS","Flat Bar","Round Bar","Pipe"].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </MField>
          <MField label="Material Type *">
            <select value={form.matType||"MS"} onChange={e=>setForm(f=>({...f,matType:e.target.value}))} style={css.input}>
              {["MS","SS","AL","GI"].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </MField>
          <MField label="Grade *"><input value={form.grade||""} onChange={e=>setForm(f=>({...f,grade:e.target.value}))} style={css.input} placeholder="E250 / E350 / 304" /></MField>
          <MField label={isPlateForm?"Thickness (e.g. 10mm) *":"Size (e.g. 75x75x8) *"}><input value={form.size||""} onChange={e=>setForm(f=>({...f,size:e.target.value}))} style={css.input} placeholder={isPlateForm?"10mm":"75x75x8"} /></MField>
          {isPlateForm
            ? <MField label="Weight (kg/m²) *"><input type="number" step="0.1" value={form.wtPerM2||""} onChange={e=>setForm(f=>({...f,wtPerM2:parseFloat(e.target.value)||0}))} style={css.input} /></MField>
            : <MField label="Weight (kg/m) *"><input type="number" step="0.01" value={form.wtPerMetre||""} onChange={e=>setForm(f=>({...f,wtPerMetre:parseFloat(e.target.value)||0}))} style={css.input} /></MField>
          }
          {!isPlateForm&&<MField label="Std Lengths (mm, comma-sep)"><input value={lenInput} onChange={e=>setLenInput(e.target.value)} style={css.input} placeholder="6000,8000,10000,12000" /></MField>}
        </div>
        {previewCode&&<div style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:8, padding:12, marginBottom:12 }}>
          <div style={{ fontSize:11, color:T.textMid, marginBottom:4 }}>MATERIAL CODE PREVIEW</div>
          <span style={{ fontFamily:T.fontMono, fontSize:18, fontWeight:800, color:T.accentHi }}>{previewCode}</span>
        </div>}
        <MField label="Active"><select value={form.active?"yes":"no"} onChange={e=>setForm(f=>({...f,active:e.target.value==="yes"}))} style={css.input}><option value="yes">Active</option><option value="no">Inactive</option></select></MField>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:8 }}>
          <button onClick={()=>setModal(null)} style={css.btn.secondary}>Cancel</button>
          <button onClick={saveMat} style={css.btn.primary} disabled={!previewCode}>✓ Save Material</button>
        </div>
      </Modal>}
    </div>
  );
};

// ─── MASTERS: PAINT LIBRARY ───────────────────────────────────────────────────
const PaintMaster = ({ user, paint }) => {
  const paints = paint;
  const typeColor = { primer:"blue", mio:"amber", finish:"green" };
  const canEdit = user.role==="super_admin"||user.role==="qc_admin";
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:700, color:T.text }}>Paint Library ({paints.length} products)</div>
        {canEdit&&<button style={css.btn.primary}>+ Add Paint</button>}
      </div>
      <MTable cols={[
        {key:"id", label:"ID", render:r=><span style={{fontFamily:T.fontMono,fontSize:11,color:T.textMid}}>{r.id}</span>},
        {key:"make", label:"Make"},
        {key:"type", label:"Type", render:r=><Badge color={typeColor[r.type]||"gray"}>{r.type.toUpperCase()}</Badge>},
        {key:"product", label:"Product Name"},
        {key:"dft", label:"DFT (μm)", render:r=><span style={{fontFamily:T.fontMono}}>{r.dft}</span>},
        {key:"thinnerRatio", label:"Thinner Ratio"},
        {key:"active", label:"Status", render:r=><Badge color={r.active?"green":"gray"}>{r.active?"Active":"Inactive"}</Badge>},
        {key:"actions", label:"", render:r=>canEdit?<button style={css.btn.ghost}>Edit</button>:null},
      ]} rows={paints} />
    </div>
  );
};

// ─── MASTERS: TPI AGENCIES ────────────────────────────────────────────────────
const TPIMaster = ({ user, tpiAgencies }) => {
  const agencies = tpiAgencies;
  const canEdit = user.role==="super_admin"||user.role==="qc_admin";
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:700, color:T.text }}>TPI Agencies ({agencies.length})</div>
        {canEdit&&<button style={css.btn.primary}>+ Add Agency</button>}
      </div>
      <MTable cols={[
        {key:"code", label:"Code", render:r=><span style={{fontFamily:T.fontMono,color:T.accentHi,fontWeight:700}}>{r.code}</span>},
        {key:"name", label:"Agency Name"},
        {key:"contact", label:"Contact"},
        {key:"phone", label:"Phone", render:r=><span style={{fontFamily:T.fontMono}}>{r.phone}</span>},
        {key:"email", label:"Email"},
        {key:"active", label:"Status", render:r=><Badge color={r.active?"green":"gray"}>{r.active?"Active":"Inactive"}</Badge>},
        {key:"actions", label:"", render:r=>canEdit?<button style={css.btn.ghost}>Edit</button>:null},
      ]} rows={agencies} />
    </div>
  );
};

// ─── MASTERS: APPROVED MAKES ──────────────────────────────────────────────────
const ApprovedMakesMaster = ({ user, approvedMakes }) => {
  const makes = approvedMakes;
  const canEdit = user.role==="super_admin"||user.role==="qc_admin";
  return (
    <div>
      <div style={{ ...css.card, background:T.amberBg, border:`1px solid ${T.amber}`, marginBottom:16, fontSize:13, color:T.amber }}>
        <strong>Note:</strong> This is the global approved makes library. Per-order approved makes are set in the Quality tab of each order and override these defaults.
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:700, color:T.text }}>Global Approved Makes Library</div>
        {canEdit&&<button style={css.btn.primary}>+ Add Material Type</button>}
      </div>
      <MTable cols={[
        {key:"id", label:"ID", render:r=><span style={{fontFamily:T.fontMono,fontSize:11,color:T.textMid}}>{r.id}</span>},
        {key:"materialType", label:"Material Type", render:r=><strong>{r.materialType}</strong>},
        {key:"makes", label:"Approved Makes", render:r=><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{r.makes.map(m=><Badge key={m} color="green">{m}</Badge>)}</div>},
        {key:"actions", label:"", render:r=>canEdit?<button style={css.btn.ghost}>Edit</button>:null},
      ]} rows={makes} />
    </div>
  );
};

// ─── MASTERS: USERS ───────────────────────────────────────────────────────────
const UsersMaster = ({ user }) => {
  const [users] = useState(USERS);
  const [search, setSearch] = useState(""); const [roleFilter, setRoleFilter] = useState("all");
  const canManage = user.role==="super_admin";
  const filtered = users.filter(u=>(u.name.toLowerCase().includes(search.toLowerCase())||u.username.toLowerCase().includes(search.toLowerCase()))&&(roleFilter==="all"||u.role===roleFilter));
  const getRoleInfo = (roleId) => ROLES.find(r=>r.id===roleId);
  const initials = (n) => n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:700, color:T.text }}>System Users ({users.length})</div>
        <div style={{ display:"flex", gap:8 }}>
          <MSearch value={search} onChange={setSearch} placeholder="Search users..." />
          <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} style={{ ...css.input, width:180 }}>
            <option value="all">All Roles</option>{ROLES.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          {canManage&&<button style={css.btn.primary}>+ Add User</button>}
        </div>
      </div>
      <MTable cols={[
        {key:"id", label:"ID", render:r=><span style={{fontFamily:T.fontMono,fontSize:11,color:T.textMid}}>{r.id}</span>},
        {key:"avatar", label:"", render:r=><div style={{width:32,height:32,borderRadius:"50%",background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff"}}>{initials(r.name)}</div>},
        {key:"name", label:"Name"},
        {key:"username", label:"Username", render:r=><span style={{fontFamily:T.fontMono,fontSize:12,color:T.accentHi}}>{r.username}</span>},
        {key:"role", label:"Role", render:r=>{ const ri=getRoleInfo(r.role); return ri?<div><Badge color="blue">{ri.label}</Badge><span style={{fontSize:11,color:T.textMid,marginLeft:6}}>{ri.dept}</span></div>:r.role; }},
        {key:"level", label:"Level", render:r=>{ const ri=getRoleInfo(r.role); return ri?<Badge color={ri.level==="admin"?"gold":"gray"}>{ri.level.toUpperCase()}</Badge>:null; }},
        {key:"active", label:"Status", render:r=><Badge color={r.active?"green":"gray"}>{r.active?"Active":"Inactive"}</Badge>},
        {key:"actions", label:"", render:r=>canManage?<button style={css.btn.ghost}>Edit</button>:null},
      ]} rows={filtered} />
    </div>
  );
};

// ─── COMPANY MASTER ───────────────────────────────────────────────────────────
const CompanyMaster = ({ company, setCompany }) => {
  const [form, setForm] = React.useState({...company});
  const [dirty, setDirty] = React.useState(false);
  const upd = (k,v) => { setForm(f=>({...f,[k]:v})); setDirty(true); };
  return (
    <div>
      {/* Preview strip */}
      <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:8, padding:"12px 16px", marginBottom:20, display:"flex", gap:24, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ fontWeight:800, fontSize:15, color:T.text }}>{form.name||<span style={{color:T.textLow}}>Company Name</span>}</div>
        <div style={{ fontSize:12, color:T.textMid }}>GSTIN: <span style={{ fontFamily:T.fontMono, color:T.text }}>{form.gstin||"—"}</span></div>
        <div style={{ fontSize:12, color:T.textMid }}>State: <span style={{ color:T.text }}>{form.state||"—"} ({form.stateCode||"—"})</span></div>
      </div>
      <InfoBanner color="blue">Company details will appear on Issue Notes, Challans and Invoices from Session 5</InfoBanner>
      {/* Identity */}
      <div style={{ ...css.card, marginBottom:16 }}>
        <SectionHd>Identity</SectionHd>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Field label="Company Name"><Input value={form.name} onChange={e=>upd("name",e.target.value)} /></Field>
          <Field label="Trading Name / Short Name"><Input value={form.tradingName} onChange={e=>upd("tradingName",e.target.value)} /></Field>
          <Field label="GSTIN"><Input value={form.gstin} onChange={e=>upd("gstin",e.target.value)} placeholder="27AAAAA0000A1Z5" /></Field>
          <Field label="PAN"><Input value={form.pan} onChange={e=>upd("pan",e.target.value)} placeholder="AAAAA0000A" /></Field>
          <Field label="State"><Input value={form.state} onChange={e=>upd("state",e.target.value)} /></Field>
          <Field label="State Code"><Input value={form.stateCode} onChange={e=>upd("stateCode",e.target.value)} /></Field>
        </div>
      </div>
      {/* Address */}
      <div style={{ ...css.card, marginBottom:16 }}>
        <SectionHd>Address</SectionHd>
        <Field label="Registered Address"><Textarea value={form.address} onChange={e=>upd("address",e.target.value)} rows={3} /></Field>
        <Field label="Factory / Works Address"><Textarea value={form.worksAddress} onChange={e=>upd("worksAddress",e.target.value)} rows={3} /></Field>
      </div>
      {/* Contact */}
      <div style={{ ...css.card, marginBottom:16 }}>
        <SectionHd>Contact</SectionHd>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Field label="Phone"><Input value={form.phone} onChange={e=>upd("phone",e.target.value)} /></Field>
          <Field label="Email"><Input value={form.email} onChange={e=>upd("email",e.target.value)} /></Field>
          <Field label="Logo URL"><Input value={form.logoUrl} onChange={e=>upd("logoUrl",e.target.value)} placeholder="https://..." /></Field>
        </div>
      </div>
      {/* Banking */}
      <div style={{ ...css.card, marginBottom:16 }}>
        <SectionHd>Banking</SectionHd>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Field label="Bank Name"><Input value={form.bankName} onChange={e=>upd("bankName",e.target.value)} /></Field>
          <Field label="Account Number"><Input value={form.bankAccount} onChange={e=>upd("bankAccount",e.target.value)} /></Field>
          <Field label="IFSC Code"><Input value={form.ifsc} onChange={e=>upd("ifsc",e.target.value)} /></Field>
        </div>
      </div>
      {dirty && (
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button onClick={()=>{setForm({...company});setDirty(false);}} style={css.btn.secondary}>Discard</button>
          <button onClick={()=>{setCompany(form);setDirty(false);}} style={css.btn.primary}>Save Company Details</button>
        </div>
      )}
    </div>
  );
};

// ─── MASTERS MODULE ───────────────────────────────────────────────────────────
const MastersModule = ({ user, clients, setClients, vendors, setVendors, contractors, setContractors, bays, setBays, materials, setMaterials, paint, setPaint, tpiAgencies, setTpiAgencies, approvedMakes, setApprovedMakes, company, setCompany }) => {
  const tabs = [
    { id:"company",     label:"Company Details",  show: user.role==="super_admin" },
    { id:"clients",     label:"Clients"           },
    { id:"vendors",     label:"Vendors"           },
    { id:"contractors", label:"Contractors"       },
    { id:"bays",        label:"Storage Bays"      },
    { id:"materials",   label:"Materials Library" },
    { id:"paint",       label:"Paint Library"     },
    { id:"tpi",         label:"TPI Agencies"      },
    { id:"makes",       label:"Approved Makes"    },
    { id:"users",       label:"Users",            show: user.role==="super_admin" },
  ].filter(t=>t.show!==false);
  const [activeTab, setActiveTab] = useState("clients");
  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:800, color:T.text }}>Masters</div>
        <div style={{ fontSize:13, color:T.textMid }}>Manage all reference data — clients, vendors, contractors, materials, bays, and users</div>
      </div>
      <div style={{ display:"flex", gap:2, borderBottom:`1px solid ${T.border}`, marginBottom:20, overflowX:"auto" }}>
        {tabs.map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} style={{ padding:"10px 16px", fontSize:13, fontWeight:activeTab===t.id?700:500, color:activeTab===t.id?T.accent:T.textMid, background:"transparent", border:"none", borderBottom:activeTab===t.id?`2px solid ${T.accent}`:"2px solid transparent", cursor:"pointer", fontFamily:T.font, whiteSpace:"nowrap" }}>{t.label}</button>)}
      </div>
      {activeTab==="company"     && <CompanyMaster      company={company} setCompany={setCompany} />}
      {activeTab==="clients"     && <ClientsMaster     user={user} clients={clients} setClients={setClients} />}
      {activeTab==="vendors"     && <VendorsMaster     user={user} vendors={vendors} setVendors={setVendors} />}
      {activeTab==="contractors" && <ContractorsMaster user={user} contractors={contractors} />}
      {activeTab==="bays"        && <BaysMaster        user={user} bays={bays} setBays={setBays} />}
      {activeTab==="materials"   && <MaterialsMaster   user={user} materials={materials} setMaterials={setMaterials} />}
      {activeTab==="paint"       && <PaintMaster       user={user} paint={paint} />}
      {activeTab==="tpi"         && <TPIMaster         user={user} tpiAgencies={tpiAgencies} />}
      {activeTab==="makes"       && <ApprovedMakesMaster user={user} approvedMakes={approvedMakes} />}
      {activeTab==="users"       && <UsersMaster       user={user} />}
    </div>
  );
};


// ─── STATUS BADGE HELPERS ─────────────────────────────────────────────────────
const poStatusBadge   = { pending:"amber", partially_received:"blue", fully_received:"green", cancelled:"red" };
const grnStatusBadge  = { approved:"green", hold:"amber", rejected:"red", pending:"gray" };
const stkStatusBadge  = { available:"green", allocated:"blue", qc_hold:"amber", rejected:"red", consumed:"gray" };
const qcStatusBadge   = { approved:"green", pending:"gray", failed:"red", hold:"amber" };

// ═══════════════════════════════════════════════════════════════════════════════
// MRP MODULE
// ═══════════════════════════════════════════════════════════════════════════════
const MRPModule = ({ user, purchaseReqs, setPurchaseReqs, stock, orders, materials, nestingRuns, setNestingRuns }) => {
  const [view, setView] = useState("overview");
  const [expand, setExpand] = useState({});
  const [nestModal, setNestModal] = useState(null);
  const [nestForm, setNestForm] = useState({});
  const [toast, setToast] = useState(null);
  const [matReqFilter, setMatReqFilter] = useState("all");
  const [newRunModal, setNewRunModal] = useState(false);
  const [runForm, setRunForm] = useState({});

  const showToast = (msg, color="green") => { setToast({msg,color}); setTimeout(()=>setToast(null),3000); };

  // Group purchase reqs by order → drawing
  const byOrder = orders.map(o => {
    const reqs = purchaseReqs.filter(r=>r.orderId===o.id);
    const totalWtReq = reqs.reduce((s,r)=>s+(r.wtRequired||0),0);
    const totalProcured = reqs.filter(r=>r.status==="approved"||r.status==="po_raised").reduce((s,r)=>s+(r.wtRequired||0),0);
    const drawings = o.drawings.filter(d=>d.receivedDate);
    const totalDrgWt = drawings.reduce((s,d)=>s+(d.totalWt||0),0);
    return { order:o, reqs, totalWtReq, totalProcured, drawings, totalDrgWt };
  });

  // Material aggregation for export preview
  const matAgg = purchaseReqs.reduce((acc,r) => {
    const key = `${r.matType}|${r.grade}|${r.section}|${r.size}`;
    if (!acc[key]) acc[key] = { matType:r.matType, grade:r.grade, section:r.section, size:r.size, wtRequired:0, approvedMakes:r.approvedMakes, orders:[] };
    acc[key].wtRequired += r.wtRequired;
    if (!acc[key].orders.includes(r.orderId)) acc[key].orders.push(r.orderId);
    return acc;
  }, {});
  const matList = Object.values(matAgg);

  const handleNestImport = () => {
    showToast("Nesting import saved — draft purchase requirements updated", "green");
    setNestModal(null);
  };

  if (view === "nest_export") return <MRPNestExport onBack={()=>setView("overview")} purchaseReqs={purchaseReqs} stock={stock} orders={orders} />;

  // ── Material Requirements computation (View 2) ───────────────────────────
  const filtOrders = matReqFilter==="all" ? orders : orders.filter(o=>o.id===matReqFilter);
  const fabAgg = {};
  filtOrders.forEach(o => {
    o.parts.filter(p=>p.fabType==="Fabricate"&&p.source==="Procure").forEach(p => {
      const key = p.matCode || buildMatCode(p.section,p.matType,p.grade,p.size);
      if (!fabAgg[key]) {
        const lib = (materials||[]).find(m=>m.matCode===key||(m.sectionType===p.section&&m.size.toLowerCase()===(p.size||"").toLowerCase()&&m.grade.toLowerCase()===(p.grade||"").toLowerCase()));
        const pr = purchaseReqs.find(r=>r.section===p.section&&r.size===p.size&&r.grade===p.grade);
        fabAgg[key] = { matCode:key, section:p.section, size:p.size, grade:p.grade, matType:p.matType, orders:[], wtRequired:0, lib, prStatus:pr?.status||"none" };
      }
      fabAgg[key].wtRequired += (p.calcTotalWt||p.clientTotalWt||0);
      if (!fabAgg[key].orders.includes(o.id)) fabAgg[key].orders.push(o.id);
    });
  });
  const fabList = Object.values(fabAgg).map(row => {
    const stockAvail = stock.filter(s=>(s.matCode&&s.matCode===row.matCode)||(s.section===row.section&&s.size===row.size&&s.grade===row.grade)).reduce((a,s)=>a+(s.wtAvailable||0),0);
    const netToProcure = Math.max(0, row.wtRequired - stockAvail);
    return { ...row, stockAvail, netToProcure };
  });
  const boAgg = {};
  filtOrders.forEach(o => {
    o.parts.filter(p=>p.fabType==="Bought Out"&&p.source==="Procure").forEach(p => {
      const key = `${p.desc}|${p.size}`;
      if (!boAgg[key]) boAgg[key] = { desc:p.desc, size:p.size, grade:p.grade, orders:[], totalPcs:0, unitWt:p.clientUnitWt||0, totalWt:0 };
      boAgg[key].totalPcs += (p.qtyPerDrg||0);
      boAgg[key].totalWt += (p.calcTotalWt||p.clientTotalWt||0);
      if (!boAgg[key].orders.includes(o.id)) boAgg[key].orders.push(o.id);
    });
  });
  const boList = Object.values(boAgg);
  const csParts = filtOrders.flatMap(o=>o.parts.filter(p=>p.source==="Client Supply").map(p=>({...p,orderId:o.id})));

  return (
    <div>
      {toast && (
        <div style={{ position:"fixed", top:20, right:20, zIndex:2000, background:toast.color==="green"?T.greenBg:T.redBg, border:`1px solid ${toast.color==="green"?T.green:T.red}`, borderRadius:8, padding:"12px 20px", color:toast.color==="green"?T.green:T.red, fontSize:13, fontWeight:600 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:20, fontWeight:800, color:T.text }}>MRP Planning</div>
        <div style={{ fontSize:12, color:T.textMid }}>Cross-order material requirements · Coverage · Nesting export/import</div>
      </div>

      {/* Tab Nav */}
      <div style={{ display:"flex", gap:2, marginBottom:18, borderBottom:`1px solid ${T.border}` }}>
        {[["overview","Planning Overview"],["mat_req","Material Requirements"],["nesting","Nesting Runs"]].map(([v,lbl])=>(
          <button key={v} onClick={()=>setView(v)} style={{ ...css.btn.ghost, padding:"8px 16px", fontSize:13, fontWeight:view===v?700:400, color:view===v?T.accent:T.textMid, borderBottom:view===v?`2px solid ${T.accent}`:"2px solid transparent", borderRadius:0 }}>{lbl}</button>
        ))}
      </div>

      {/* ── VIEW: PLANNING OVERVIEW ───────────────────────────────────────── */}
      {view==="overview" && <>
      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
        <StatCard label="Active Orders" value={orders.length} color={T.text} />
        <StatCard label="Material Lines" value={purchaseReqs.length} color={T.accent} />
        <StatCard label="Total Wt Required" value={fmt.wtT(purchaseReqs.reduce((s,r)=>s+(r.wtRequired||0),0))} color={T.gold} />
        <StatCard label="Drawings Received" value={orders.reduce((s,o)=>s+o.drawings.filter(d=>d.receivedDate).length,0)} sub={`of ${orders.reduce((s,o)=>s+o.drawings.length,0)} total`} color={T.green} />
        <StatCard label="Drawings Pending" value={orders.reduce((s,o)=>s+o.drawings.filter(d=>!d.receivedDate).length,0)} color={T.amber} />
      </div>

      {/* Drawing Release Alerts */}
      {orders.some(o=>o.drawings.some(d=>!d.receivedDate)) && (
        <InfoBanner color="amber">
          ⚠ <strong>Drawings pending client release:</strong>{" "}
          {orders.map(o=>{
            const pend = o.drawings.filter(d=>!d.receivedDate);
            if (!pend.length) return null;
            return ` ${o.id}: ${pend.length} drawing(s) · ${(pend.reduce((s,d)=>s+(d.totalWt||0),0)/1000).toFixed(1)}T`;
          }).filter(Boolean).join(" | ")}
          {" — MRP planning should proceed only for received drawings."}
        </InfoBanner>
      )}

      <div style={{ display:"flex", gap:8, marginBottom:18 }}>
        <button onClick={()=>setView("nest_export")} style={css.btn.primary}>📤 Export Nesting Sheets (Stage 1)</button>
        <button onClick={()=>setNestModal("import")} style={css.btn.amber}>📥 Import Nesting Results</button>
      </div>

      {/* Per-order MRP view */}
      {byOrder.map(({ order, reqs, totalWtReq, drawings, totalDrgWt }) => (
        <div key={order.id} style={{ ...css.card, marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <div>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                <span style={{ fontFamily:T.fontMono, color:T.accentHi, fontSize:13, fontWeight:700 }}>{order.id}</span>
                <Badge color="green">{order.status}</Badge>
                <Badge color="gray">{CLIENTS[order.clientId]?.name}</Badge>
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{order.projectDesc}</div>
              <div style={{ fontSize:12, color:T.textMid, marginTop:2 }}>
                {order.orderQty} {order.orderUnit} · {fmt.currency(order.orderValue)} ·{" "}
                Drawings received: {drawings.length}/{order.drawings.length} · {fmt.wtT(totalDrgWt)} of {order.orderQty}T
              </div>
            </div>
            <button onClick={()=>setExpand(e=>({...e,[order.id]:!e[order.id]}))} style={css.btn.ghost}>
              {expand[order.id]?"▲ Collapse":"▼ Expand"}
            </button>
          </div>

          {/* Drawing release mini-bar */}
          <div style={{ height:5, background:T.border, borderRadius:3, overflow:"hidden", marginBottom:8 }}>
            <div style={{ height:"100%", width:`${Math.min(100,Math.round((totalDrgWt/1000/order.orderQty)*100))}%`, background:T.amber, borderRadius:3 }} />
          </div>

          {expand[order.id] && (
            <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${T.border}` }}>
              {/* Material requirements table */}
              <div style={{ fontSize:12, fontWeight:700, color:T.textMid, textTransform:"uppercase", marginBottom:8 }}>Material Requirements ({reqs.length} lines)</div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead><tr>
                    <TH>Drawing No</TH><TH>Mat Type</TH><TH>Grade</TH><TH>Section</TH><TH>Size</TH>
                    <TH right>Wt Req (kg)</TH><TH>Approved Makes</TH><TH>Status</TH>
                    {PERMISSIONS[user.role]?.canApprove && <TH>Action</TH>}
                  </tr></thead>
                  <tbody>
                    {reqs.map((r,i) => (
                      <tr key={r.id} style={{ background:i%2===0?"transparent":T.bg }}>
                        <TD mono>{r.drawingNo}</TD>
                        <TD>{r.matType}</TD>
                        <TD mono>{r.grade}</TD>
                        <TD>{r.section}</TD>
                        <TD mono>{r.size}</TD>
                        <TD right mono bold color={T.gold}>{fmt.num(r.wtRequired)}</TD>
                        <TD><span style={{ fontSize:11, color:T.textMid }}>{r.approvedMakes}</span></TD>
                        <TD><Badge color={r.status==="approved"?"green":r.status==="po_raised"?"blue":"gray"}>{r.status}</Badge></TD>
                        {PERMISSIONS[user.role]?.canApprove && <TD>
                          {r.status!=="approved"&&r.status!=="po_raised"&&<button onClick={()=>setPurchaseReqs(prev=>prev.map(pr=>pr.id===r.id?{...pr,status:"approved"}:pr))} style={{ ...css.btn.sm, background:T.greenLo, color:T.green, border:`1px solid ${T.green}` }}>Approve</button>}
                        </TD>}
                      </tr>
                    ))}
                    <tr style={{ background:T.bgInput }}>
                      <td colSpan={5} style={{ padding:"6px 10px", fontWeight:700, fontSize:12, color:T.textMid }}>Total</td>
                      <td style={{ padding:"6px 10px", textAlign:"right", fontFamily:T.fontMono, fontWeight:700, color:T.gold }}>{fmt.num(reqs.reduce((s,r)=>s+(r.wtRequired||0),0))} kg</td>
                      <td colSpan={PERMISSIONS[user.role]?.canApprove?3:2}/>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Consolidated material list */}
      <div style={{ ...css.card, marginTop:8 }}>
        <SectionHd title="Consolidated Material Summary" sub="Aggregated across all orders — forms basis for purchase requirements" />
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead><tr>
              <TH>Mat Type</TH><TH>Grade</TH><TH>Section</TH><TH>Size</TH>
              <TH right>Total Wt (kg)</TH><TH right>Total Wt (T)</TH><TH>Approved Makes</TH><TH>Orders</TH>
            </tr></thead>
            <tbody>
              {matList.map((m,i) => (
                <tr key={i} style={{ background:i%2===0?"transparent":T.bg }}>
                  <TD>{m.matType}</TD>
                  <TD mono>{m.grade}</TD>
                  <TD>{m.section}</TD>
                  <TD mono>{m.size}</TD>
                  <TD right mono bold color={T.gold}>{fmt.num(Math.round(m.wtRequired))}</TD>
                  <TD right mono color={T.accent}>{(m.wtRequired/1000).toFixed(3)}</TD>
                  <TD><span style={{ fontSize:11, color:T.textMid }}>{m.approvedMakes}</span></TD>
                  <TD><div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>{m.orders.map(o=><Badge key={o} color="blue">{o}</Badge>)}</div></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nesting Import Modal */}
      {nestModal==="import" && (
        <Modal title="Import Nesting Results — Stage 1 (Preliminary)" onClose={()=>setNestModal(null)} width={700}>
          <InfoBanner color="blue">
            Upload the completed nesting Excel (Sheet 4) with qty to order, order unit, weight to order, source, and remarks per material line. Approved makes are auto-populated from Quality tab.
          </InfoBanner>
          <div style={{ ...css.card, background:T.bg, marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.textMid, marginBottom:10, textTransform:"uppercase" }}>Sheet 4 Preview — Import Format</div>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
              <thead><tr>
                {["Section","Size","Wt Required (kg)","Qty to Order","Order Unit","Wt to Order (kg)","Extra (kg)","Source","Remarks"].map(h=>(
                  <th key={h} style={{ padding:"5px 8px", textAlign:"left", fontSize:10, fontWeight:700, color:T.amber, textTransform:"uppercase", borderBottom:`1px solid ${T.border}`, background:T.amberBg }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {matList.slice(0,5).map((m,i)=>(
                  <tr key={i}>
                    <td style={{ padding:"5px 8px", color:T.text, borderBottom:`1px solid ${T.border}` }}>{m.section}</td>
                    <td style={{ padding:"5px 8px", color:T.text, borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono }}>{m.size}</td>
                    <td style={{ padding:"5px 8px", color:T.gold, borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono }}>{fmt.num(Math.round(m.wtRequired))}</td>
                    <td style={{ padding:"5px 8px", borderBottom:`1px solid ${T.border}` }}><Input type="number" style={{ width:80, padding:"3px 6px", fontSize:11 }} placeholder="0" value={nestForm[`qty_${i}`]||""} onChange={e=>setNestForm(f=>({...f,[`qty_${i}`]:e.target.value}))} /></td>
                    <td style={{ padding:"5px 8px", borderBottom:`1px solid ${T.border}` }}>
                      <Sel style={{ width:60, padding:"3px 6px", fontSize:11 }}><option>MT</option><option>KG</option></Sel>
                    </td>
                    <td style={{ padding:"5px 8px", borderBottom:`1px solid ${T.border}` }}><Input type="number" style={{ width:90, padding:"3px 6px", fontSize:11 }} /></td>
                    <td style={{ padding:"5px 8px", borderBottom:`1px solid ${T.border}`, color:T.textLow }}>auto</td>
                    <td style={{ padding:"5px 8px", borderBottom:`1px solid ${T.border}` }}>
                      <Sel style={{ width:90, padding:"3px 6px", fontSize:11 }}><option>Procure</option><option>Stock</option></Sel>
                    </td>
                    <td style={{ padding:"5px 8px", borderBottom:`1px solid ${T.border}` }}><Input style={{ width:100, padding:"3px 6px", fontSize:11 }} placeholder="remarks..." /></td>
                  </tr>
                ))}
                {matList.length>5 && <tr><td colSpan={9} style={{ padding:"5px 8px", color:T.textLow, fontStyle:"italic" }}>...{matList.length-5} more lines</td></tr>}
              </tbody>
            </table>
          </div>
          <InfoBanner color="amber">In production this would be a full Excel file upload. This preview shows the format. Save will create draft purchase requirements.</InfoBanner>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button onClick={()=>setNestModal(null)} style={css.btn.secondary}>Cancel</button>
            <button onClick={handleNestImport} style={css.btn.primary}>Save Nesting Import → Create Draft PRs</button>
          </div>
        </Modal>
      )}
      </>}

      {/* ── VIEW: MATERIAL REQUIREMENTS ──────────────────────────────────────── */}
      {view==="mat_req" && (
        <div>
          {/* Order Filter */}
          <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
            <div style={{ fontSize:12, color:T.textMid, fontWeight:600 }}>Filter by Order:</div>
            <Sel value={matReqFilter} onChange={e=>setMatReqFilter(e.target.value)} style={{ width:280 }}>
              <option value="all">All Orders ({orders.length})</option>
              {orders.map(o=><option key={o.id} value={o.id}>{o.id} — {o.projectDesc}</option>)}
            </Sel>
            <div style={{ fontSize:12, color:T.textLow }}>
              {fabList.length} material types · {boList.length} bought-out items · {csParts.length} client supply parts
            </div>
          </div>

          {/* Table 1: Fabrication Materials */}
          <div style={{ ...css.card, marginBottom:16 }}>
            <SectionHd title="Fabrication Materials" sub="fabType=Fabricate · source=Procure · aggregated by Material Code" />
            {fabList.length===0
              ? <div style={{ color:T.textLow, fontSize:12, padding:16 }}>No fabrication material requirements found.</div>
              : <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                    <thead><tr>
                      <TH>Material Code</TH><TH>Section</TH><TH>Size</TH><TH>Grade</TH>
                      <TH>Orders</TH><TH right>Wt Reqd (kg)</TH><TH right>Length / Area</TH>
                      <TH right>Stock Avail (kg)</TH><TH right>Net to Procure (kg)</TH>
                      <TH>Coverage</TH><TH>PR Status</TH>
                    </tr></thead>
                    <tbody>
                      {fabList.map((row,i)=>{
                        const lib = row.lib;
                        const lenArea = lib
                          ? (lib.isPlate
                              ? `${(row.wtRequired/(lib.wtPerM2||1)).toFixed(2)} m²`
                              : `${(row.wtRequired/(lib.wtPerMetre||1)).toFixed(1)} m`)
                          : "—";
                        const covPct = row.wtRequired > 0 ? Math.min(100, (row.stockAvail/row.wtRequired)*100) : 100;
                        const netColor = row.netToProcure===0 ? T.green : (row.prStatus==="approved"||row.prStatus==="po_raised") ? T.amber : T.red;
                        const prBadge = row.prStatus==="approved"?"green":row.prStatus==="po_raised"?"blue":row.prStatus==="none"?"gray":"amber";
                        return (
                          <tr key={i} style={{ background:i%2===0?"transparent":T.bg }}>
                            <TD mono>{row.matCode||"—"}</TD>
                            <TD>{row.section}</TD>
                            <TD mono>{row.size}</TD>
                            <TD><Badge color="gray">{row.grade}</Badge></TD>
                            <TD><div style={{ display:"flex",gap:3,flexWrap:"wrap" }}>{row.orders.map(o=><Badge key={o} color="blue">{o}</Badge>)}</div></TD>
                            <TD right mono bold color={T.gold}>{fmt.num(Math.round(row.wtRequired))}</TD>
                            <TD right mono>{lenArea}</TD>
                            <TD right mono color={T.green}>{fmt.num(Math.round(row.stockAvail))}</TD>
                            <TD right mono bold color={netColor}>{fmt.num(Math.round(row.netToProcure))}</TD>
                            <TD>
                              <div style={{ width:80, height:6, background:T.border, borderRadius:3, overflow:"hidden" }}>
                                <div style={{ height:"100%", width:`${covPct}%`, background:covPct>=100?T.green:covPct>50?T.amber:T.red, borderRadius:3 }} />
                              </div>
                              <div style={{ fontSize:10, color:T.textLow, marginTop:2 }}>{covPct.toFixed(0)}%</div>
                            </TD>
                            <TD><Badge color={prBadge}>{row.prStatus==="none"?"no PR":row.prStatus}</Badge></TD>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
            }
          </div>

          {/* Table 2: Bought-out Items */}
          {boList.length>0 && (
            <div style={{ ...css.card, marginBottom:16 }}>
              <SectionHd title="Bought-out Items" sub="fabType=Bought Out · source=Procure · aggregated by description + size" />
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead><tr>
                    <TH>Description</TH><TH>Size</TH><TH>Grade</TH><TH>Orders</TH>
                    <TH right>Total Pcs</TH><TH right>Unit Wt (kg)</TH><TH right>Total Wt (kg)</TH>
                  </tr></thead>
                  <tbody>
                    {boList.map((row,i)=>(
                      <tr key={i} style={{ background:i%2===0?"transparent":T.bg }}>
                        <TD>{row.desc}</TD>
                        <TD mono>{row.size}</TD>
                        <TD><Badge color="gray">{row.grade}</Badge></TD>
                        <TD><div style={{ display:"flex",gap:3,flexWrap:"wrap" }}>{row.orders.map(o=><Badge key={o} color="blue">{o}</Badge>)}</div></TD>
                        <TD right mono>{fmt.num(row.totalPcs)}</TD>
                        <TD right mono>{row.unitWt.toFixed(3)}</TD>
                        <TD right mono bold color={T.gold}>{fmt.num(row.totalWt.toFixed(1))}</TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Client Supply */}
          {csParts.length>0 && (
            <div style={{ ...css.card }}>
              <SectionHd title="Client Supply Items" sub="source=Client Supply — no procurement action needed" />
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {csParts.map((p,i)=>(
                  <div key={i} style={{ ...css.card, padding:"8px 12px", background:T.bg, minWidth:180 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.text }}>{p.markNo}</div>
                    <div style={{ fontSize:11, color:T.textMid }}>{p.desc}</div>
                    <div style={{ fontSize:11, color:T.textLow, fontFamily:T.fontMono }}>{p.section} {p.size}</div>
                    <div style={{ fontSize:10, color:T.amber, marginTop:4 }}>Client Supply · {fmt.num(p.clientTotalWt||0)} kg</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── VIEW: NESTING RUNS ───────────────────────────────────────────────── */}
      {view==="nesting" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:T.text }}>Nesting Runs</div>
              <div style={{ fontSize:12, color:T.textMid }}>History of all nesting runs · Bridge tool import results</div>
            </div>
            {["super_admin","planning_admin","floor_planner"].includes(user.role) && (
              <button onClick={()=>{setRunForm({orderIds:[],drawings:[],status:"draft"});setNewRunModal(true);}} style={css.btn.primary}>+ New Nesting Run</button>
            )}
          </div>

          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead><tr>
                <TH>Run ID</TH><TH>Date</TH><TH>Material Code</TH><TH>Orders</TH>
                <TH right>Bars / Sheets</TH><TH right>Utilisation %</TH><TH right>Waste kg</TH>
                <TH>Off-cuts</TH><TH>Status</TH><TH>DXF</TH>
              </tr></thead>
              <tbody>
                {(nestingRuns||[]).length===0 && <tr><td colSpan={10} style={{ padding:32, textAlign:"center", color:T.textLow }}>No nesting runs yet</td></tr>}
                {(nestingRuns||[]).map((r,i)=>(
                  <tr key={r.id} style={{ background:i%2===0?"transparent":T.bg }}>
                    <TD mono>{r.id}</TD>
                    <TD>{fmt.date(r.runDate)}</TD>
                    <TD mono>{r.materialCode}</TD>
                    <TD><div style={{ display:"flex",gap:3,flexWrap:"wrap" }}>{(r.orders||[]).map(o=><Badge key={o} color="blue">{o}</Badge>)}</div></TD>
                    <TD right mono>{r.sheetsOrBarsUsed}</TD>
                    <TD right mono bold color={r.utilisationPct>=85?T.green:r.utilisationPct>=70?T.amber:T.red}>{r.utilisationPct?.toFixed(1)}%</TD>
                    <TD right mono color={T.textMid}>{fmt.num(r.wasteKg)}</TD>
                    <TD><span style={{ fontSize:11, color:T.textLow }}>{(r.offcutsCreated||[]).length>0?(r.offcutsCreated||[]).length+" lots":"—"}</span></TD>
                    <TD><Badge color={r.status==="confirmed"?"green":r.status==="cancelled"?"red":"amber"}>{r.status}</Badge></TD>
                    <TD>{r.dxfLink?<a href={r.dxfLink} target="_blank" rel="noreferrer" style={{ fontSize:11, color:T.accent, fontWeight:600 }}>DXF↗</a>:<span style={{ color:T.textLow }}>—</span>}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* New Nesting Run Modal */}
          {newRunModal && (
            <Modal title="New Nesting Run" onClose={()=>setNewRunModal(false)} width={580}>
              <InfoBanner color="blue">
                Enter the nesting run details after completing nesting in DeepNest or the internal cutting calculator. The run ID is auto-generated.
              </InfoBanner>
              <Field label="Material Code" required>
                <Sel value={runForm.materialCode||""} onChange={e=>setRunForm(f=>({...f,materialCode:e.target.value}))}>
                  <option value="">Select material...</option>
                  {(materials||[]).filter(m=>m.active).map(m=><option key={m.id} value={m.matCode}>{m.matCode}</option>)}
                </Sel>
              </Field>
              <Field label="Orders Included" required>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:6 }}>
                  {orders.map(o=>(
                    <label key={o.id} style={{ display:"flex", alignItems:"center", gap:4, cursor:"pointer", fontSize:12, color:T.text }}>
                      <input type="checkbox" checked={(runForm.orderIds||[]).includes(o.id)} onChange={e=>{
                        const ids = runForm.orderIds||[];
                        setRunForm(f=>({...f, orderIds: e.target.checked?[...ids,o.id]:ids.filter(x=>x!==o.id)}));
                      }} />
                      {o.id}
                    </label>
                  ))}
                </div>
              </Field>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <Field label="Bars / Sheets Used" required>
                  <Input type="number" value={runForm.sheetsOrBarsUsed||""} onChange={e=>setRunForm(f=>({...f,sheetsOrBarsUsed:+e.target.value}))} placeholder="e.g. 18" />
                </Field>
                <Field label="Utilisation %">
                  <Input type="number" value={runForm.utilisationPct||""} onChange={e=>setRunForm(f=>({...f,utilisationPct:+e.target.value}))} placeholder="e.g. 87.3" step="0.1" max="100" />
                </Field>
                <Field label="Waste (kg)">
                  <Input type="number" value={runForm.wasteKg||""} onChange={e=>setRunForm(f=>({...f,wasteKg:+e.target.value}))} placeholder="e.g. 312" />
                </Field>
                <Field label="Status">
                  <Sel value={runForm.status||"draft"} onChange={e=>setRunForm(f=>({...f,status:e.target.value}))}>
                    <option value="draft">Draft</option>
                    <option value="confirmed">Confirmed</option>
                  </Sel>
                </Field>
              </div>
              <Field label="DXF Cutting Layout (Drive link)">
                <Input value={runForm.dxfLink||""} onChange={e=>setRunForm(f=>({...f,dxfLink:e.target.value}))} placeholder="https://drive.google.com/..." />
              </Field>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <button onClick={()=>setNewRunModal(false)} style={css.btn.secondary}>Cancel</button>
                <button onClick={()=>{
                  const yr = new Date().getFullYear();
                  let max = 0;
                  (nestingRuns||[]).forEach(r=>{ const m=(r.id||"").match(/^NEST-(\d{4})-(\d+)$/); if(m&&+m[1]===yr) max=Math.max(max,+m[2]); });
                  const newId = `NEST-${yr}-${String(max+1).padStart(3,"0")}`;
                  const newRun = { id:newId, runDate:today(), runBy:user.name, materialCode:runForm.materialCode||"", orders:runForm.orderIds||[], drawings:[], lotsUsed:[], sheetsOrBarsUsed:runForm.sheetsOrBarsUsed||0, utilisationPct:runForm.utilisationPct||0, wasteKg:runForm.wasteKg||0, offcutsCreated:[], dxfLink:runForm.dxfLink||"", status:runForm.status||"draft", parts:[] };
                  setNestingRuns(prev=>[...prev, newRun]);
                  setNewRunModal(false); setRunForm({});
                  showToast(`Nesting run ${newId} created`);
                }} style={css.btn.primary}>Create Run</button>
              </div>
            </Modal>
          )}
        </div>
      )}
    </div>
  );
};

// ─── MRP NESTING EXPORT VIEW ─────────────────────────────────────────────────
const MRPNestExport = ({ onBack, purchaseReqs, stock, orders }) => {
  const [sheet, setSheet] = useState("S1");
  const sheets = [
    { id:"S1", label:"Sheet 1 — Drawing Register" },
    { id:"S2", label:"Sheet 2 — Drawing Part List" },
    { id:"S3", label:"Sheet 3 — Available Stock" },
    { id:"S4", label:"Sheet 4 — Material Summary" },
  ];

  // Flatten all drawings
  const allDrawings = orders.flatMap(o=>o.drawings.filter(d=>d.receivedDate).map(d=>({...d,orderId:o.id,orderDesc:o.projectDesc})));
  const allParts = orders.flatMap(o=>o.parts.filter(p=>p.source==="Procure"||p.source==="Stock").map(p=>({...p,orderId:o.id})));

  // Material summary for Sheet 4
  const matAgg = purchaseReqs.reduce((acc,r) => {
    const key=`${r.matType}|${r.grade}|${r.section}|${r.size}`;
    if(!acc[key]) acc[key]={matType:r.matType,grade:r.grade,section:r.section,size:r.size,wtRequired:0,approvedMakes:r.approvedMakes};
    acc[key].wtRequired+=r.wtRequired;
    return acc;
  },{});

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <button onClick={onBack} style={{ ...css.btn.ghost, color:T.accent }}>← MRP Planning</button>
        <div style={{ fontSize:18, fontWeight:800, color:T.text }}>Nesting Export — Stage 1 (Preliminary)</div>
      </div>
      <InfoBanner color="blue">
        Export these 4 sheets to your nesting software. Sheet 4 is the purchase input — only fill Qty to Order, Order Unit, Weight to Order, Source, Remarks on Sheet 4 and import back.
      </InfoBanner>
      <div style={{ display:"flex", gap:2, marginBottom:16, borderBottom:`1px solid ${T.border}` }}>
        {sheets.map(s=>(
          <button key={s.id} onClick={()=>setSheet(s.id)} style={{ padding:"8px 14px", fontSize:12, fontWeight:sheet===s.id?700:400, color:sheet===s.id?T.accent:T.textMid, background:"transparent", border:"none", borderBottom:sheet===s.id?`2px solid ${T.accent}`:"2px solid transparent", cursor:"pointer", fontFamily:T.font, whiteSpace:"nowrap" }}>{s.label}</button>
        ))}
        <div style={{ flex:1 }} />
        <button style={{ ...css.btn.sm, margin:"4px 0" }}>⬇ Download Excel</button>
      </div>

      {sheet==="S1" && (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead><tr><TH>Order ID</TH><TH>Drawing No</TH><TH>Title</TH><TH>Phase</TH><TH>Priority</TH><TH right>Qty</TH><TH right>Unit Wt (kg)</TH><TH right>Total Wt (kg)</TH><TH>Received Date</TH></tr></thead>
            <tbody>{allDrawings.map((d,i)=>(
              <tr key={d.id} style={{ background:i%2===0?"transparent":T.bg }}>
                <TD mono>{d.orderId}</TD><TD mono>{d.drawingNo}</TD><TD>{d.title}</TD>
                <TD right mono>{d.phase}</TD><TD right mono>{d.priority}</TD>
                <TD right mono>{d.qty}</TD><TD right mono>{fmt.num(d.unitWt)}</TD>
                <TD right mono bold color={T.gold}>{fmt.num(d.totalWt)}</TD>
                <TD>{fmt.date(d.receivedDate)}</TD>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {sheet==="S2" && (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead><tr><TH>Order</TH><TH>Drawing No</TH><TH>Mark No</TH><TH>Description</TH><TH>Section</TH><TH>Size</TH><TH right>L(mm)</TH><TH right>Qty</TH><TH right>Client Wt (kg)</TH><TH>Joints</TH><TH>Source</TH></tr></thead>
            <tbody>{allParts.map((p,i)=>(
              <tr key={p.id} style={{ background:i%2===0?"transparent":T.bg }}>
                <TD mono>{p.orderId}</TD><TD mono>{p.drawingNo}</TD><TD bold>{p.markNo}</TD><TD>{p.desc}</TD>
                <TD>{p.section}</TD><TD mono>{p.size}</TD><TD right mono>{fmt.num(p.length)}</TD>
                <TD right mono>{p.qtyPerDrg}</TD><TD right mono color={T.amber}>{p.clientTotalWt?.toFixed(2)}</TD>
                <TD><Badge color="gray">{p.jointsAllowed?"Yes":"No"}</Badge></TD>
                <TD><Badge color={p.source==="Procure"?"blue":p.source==="Stock"?"green":"amber"}>{p.source}</Badge></TD>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {sheet==="S3" && (
        <div style={{ overflowX:"auto" }}>
          <InfoBanner color="green">Showing only QC-approved, available stock. Allocated stock shown with order reference.</InfoBanner>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead><tr><TH>Lot No</TH><TH>Material</TH><TH>Grade</TH><TH>Section</TH><TH>Size</TH><TH right>Wt Available (kg)</TH><TH right>Wt Allocated (kg)</TH><TH>Bay</TH><TH>Joints</TH><TH>Allocated To</TH></tr></thead>
            <tbody>{stock.filter(s=>s.rmQcStatus==="approved"&&s.clientInspStatus==="approved").map((s,i)=>(
              <tr key={s.id} style={{ background:i%2===0?"transparent":T.bg }}>
                <TD mono>{s.lotNo}</TD><TD>{s.matType}</TD><TD mono>{s.grade}</TD><TD>{s.section}</TD><TD mono>{s.size}</TD>
                <TD right mono bold color={T.green}>{fmt.num(s.wtAvailable)}</TD>
                <TD right mono color={T.accent}>{fmt.num(s.wtAllocated)}</TD>
                <TD><Badge color="teal">{s.bayId}</Badge></TD>
                <TD><Badge color="amber">Yes</Badge></TD>
                <TD>{s.allocations?.map(a=><Badge key={a.orderId} color="blue">{a.orderId}</Badge>)}</TD>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {sheet==="S4" && (
        <div style={{ overflowX:"auto" }}>
          <InfoBanner color="amber">Sheet 4 — fill the yellow columns in the downloaded Excel file. Import back to create draft purchase requirements.</InfoBanner>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead><tr>
              <TH>Mat Type</TH><TH>Grade</TH><TH>Section</TH><TH>Size</TH><TH right>Wt Required (kg)</TH><TH right>Wt Required (T)</TH>
              <th style={{ padding:"7px 10px", textAlign:"left", fontSize:10, fontWeight:700, color:T.amber, textTransform:"uppercase", borderBottom:`2px solid ${T.borderHi}`, background:T.amberBg }}>Qty to Order ▶</th>
              <th style={{ padding:"7px 10px", textAlign:"left", fontSize:10, fontWeight:700, color:T.amber, textTransform:"uppercase", borderBottom:`2px solid ${T.borderHi}`, background:T.amberBg }}>Order Unit ▶</th>
              <th style={{ padding:"7px 10px", textAlign:"left", fontSize:10, fontWeight:700, color:T.amber, textTransform:"uppercase", borderBottom:`2px solid ${T.borderHi}`, background:T.amberBg }}>Wt to Order (kg) ▶</th>
              <th style={{ padding:"7px 10px", textAlign:"left", fontSize:10, fontWeight:700, color:T.amber, textTransform:"uppercase", borderBottom:`2px solid ${T.borderHi}`, background:T.amberBg }}>Source ▶</th>
              <th style={{ padding:"7px 10px", textAlign:"left", fontSize:10, fontWeight:700, color:T.amber, textTransform:"uppercase", borderBottom:`2px solid ${T.borderHi}`, background:T.amberBg }}>Remarks ▶</th>
              <TH>Approved Makes (auto)</TH>
            </tr></thead>
            <tbody>{Object.values(matAgg).map((m,i)=>(
              <tr key={i} style={{ background:i%2===0?"transparent":T.bg }}>
                <TD>{m.matType}</TD><TD mono>{m.grade}</TD><TD>{m.section}</TD><TD mono>{m.size}</TD>
                <TD right mono bold color={T.gold}>{fmt.num(Math.round(m.wtRequired))}</TD>
                <TD right mono color={T.accent}>{(m.wtRequired/1000).toFixed(3)}</TD>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, background:T.amberBg }}><span style={{ color:T.amber, fontSize:11 }}>— fill —</span></td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, background:T.amberBg }}><span style={{ color:T.amber, fontSize:11 }}>— fill —</span></td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, background:T.amberBg }}><span style={{ color:T.amber, fontSize:11 }}>— fill —</span></td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, background:T.amberBg }}><span style={{ color:T.amber, fontSize:11 }}>— fill —</span></td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, background:T.amberBg }}><span style={{ color:T.amber, fontSize:11 }}>— fill —</span></td>
                <TD><span style={{ fontSize:11, color:T.textMid }}>{m.approvedMakes}</span></TD>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PURCHASE MODULE
// ═══════════════════════════════════════════════════════════════════════════════
const PurchaseModule = ({ user, pos, setPos, purchaseReqs, setStock, orders, vendors, materials }) => {
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [grnModal, setGrnModal] = useState(null);
  const [grnForm, setGrnForm] = useState({ lines:[] });
  const [toast, setToast] = useState(null);

  const showToast = (msg,color="green") => { setToast({msg,color}); setTimeout(()=>setToast(null),3000); };

  const canEdit = ["super_admin","purchase_admin","planning_admin"].includes(user.role);

  const statusSummary = { pending:0, partially_received:0, fully_received:0, cancelled:0 };
  pos.forEach(p=>{ statusSummary[p.status]=(statusSummary[p.status]||0)+1; });
  const totalPoValue = pos.reduce((s,p)=>s+p.lines.reduce((ss,l)=>ss+(l.totalPrice||0),0),0);

  const savePO = () => {
    const lines = form.lines||[];
    const v = vendors.find(x=>x.id===form.vendorId);
    setPos(prev => {
      const yr = new Date().getFullYear();
      const max = prev.reduce((m,p)=>{ const mt=p.id.match(/^PO-(\d{4})-(\d+)$/); return mt&&+mt[1]===yr?Math.max(m,+mt[2]):m; }, 0);
      const newPO = {
        ...form,
        id: `PO-${yr}-${String(max+1).padStart(3,"0")}`,
        vendorCode: v?.vendorCode||"",
        status:"pending",
        grns:[],
        lines: lines.map((l,i)=>({...l, id:`POL-${Date.now()}-${i}`, wtReceived:0, status:"pending", wtOrdered:calcPoLineWt(l), itemCode:buildItemCode(l)})),
        createdBy: user.name,
        createdDate: today(),
      };
      return [...prev, newPO];
    });
    showToast("Purchase Order created");
    setModal(null);
  };

  const saveGRN = (poId) => {
    const po = pos.find(p=>p.id===poId);
    const ts = Date.now();
    const grnId = `GRN-${ts}`;
    const yr = new Date().getFullYear();
    const batchNoGrn = po?.vendorCode ? genBatchNo(po.vendorCode, pos, yr) : "";
    const newGrn = { ...grnForm, id:grnId, batchNo:batchNoGrn, date:today(), createdBy:user.name, lines:(grnForm.lines||[]) };
    setPos(prev => prev.map(p => {
      if (p.id!==poId) return p;
      const updatedLines = p.lines.map(pl => {
        const grnLine = newGrn.lines.find(gl=>gl.poLineId===pl.id);
        if (!grnLine) return pl;
        const newReceived = (pl.wtReceived||0)+(grnLine.wtReceived||0);
        return { ...pl, wtReceived:newReceived, status:newReceived>=pl.wtOrdered?"fully_received":"partially_received" };
      });
      const allFull = updatedLines.every(l=>l.status==="fully_received");
      const anyRec = updatedLines.some(l=>l.status==="fully_received"||l.status==="partially_received");
      return { ...p, grns:[...p.grns, newGrn], lines:updatedLines, status:allFull?"fully_received":anyRec?"partially_received":"pending" };
    }));
    if (po && setStock) {
      const rawLots = buildStockLots(newGrn, po, grnId, ts);
      if (rawLots.length>0) setStock(prev=>{
        const maxLot=prev.reduce((m,s)=>{ const mt=s.lotNo?.match(/^LOT-(\d{4})-(\d+)$/); return mt&&+mt[1]===yr?Math.max(m,+mt[2]):m; },0);
        return [...prev,...rawLots.map((lot,i)=>({...lot,lotNo:`LOT-${yr}-${String(maxLot+i+1).padStart(3,"0")}`}))];
      });
    }
    showToast("GRN saved — materials pending RM QC inspection");
    setGrnModal(null);
    setGrnForm({lines:[]});
  };

  if (selected) return <PODetail po={pos.find(p=>p.id===selected)||{}} onBack={()=>setSelected(null)} user={user} pos={pos} setPos={setPos} setStock={setStock} showToast={showToast} />;

  return (
    <div>
      {toast && <div style={{ position:"fixed", top:20, right:20, zIndex:2000, background:toast.color==="green"?T.greenBg:T.redBg, border:`1px solid ${toast.color==="green"?T.green:T.red}`, borderRadius:8, padding:"12px 20px", color:toast.color==="green"?T.green:T.red, fontSize:13, fontWeight:600 }}>{toast.msg}</div>}

      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:20, fontWeight:800, color:T.text }}>Purchase Orders</div>
        <div style={{ fontSize:12, color:T.textMid }}>PO management · GRN · Multi-order coverage · Many-to-many PO/Order linking</div>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <StatCard label="Total POs" value={pos.length} color={T.text} />
        <StatCard label="Total Value" value={fmt.currency(totalPoValue)} color={T.accent} />
        <StatCard label="Pending" value={statusSummary.pending} color={T.amber} />
        <StatCard label="Part Received" value={statusSummary.partially_received} color={T.gold} />
        <StatCard label="Fully Received" value={statusSummary.fully_received} color={T.green} />
      </div>

      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12 }}>
        {canEdit && <button onClick={()=>{setForm({servedOrders:[],lines:[],poDate:today()});setModal("new_po");}} style={css.btn.primary}>+ New PO</button>}
      </div>

      {pos.map(po => {
        const totalVal = po.lines.reduce((s,l)=>s+(l.totalPrice||0),0);
        const totalWtOrd = po.lines.reduce((s,l)=>s+(l.wtOrdered||0),0);
        const totalWtRec = po.lines.reduce((s,l)=>s+(l.wtReceived||0),0);
        return (
          <div key={po.id} onClick={()=>setSelected(po.id)} style={{ ...css.card, marginBottom:10, cursor:"pointer" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=T.borderHi}
            onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
              <div>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                  <span style={{ fontFamily:T.fontMono, color:T.accentHi, fontSize:13, fontWeight:700 }}>{po.id}</span>
                  <Badge color={poStatusBadge[po.status]||"gray"}>{po.status.replace("_"," ")}</Badge>
                  {po.grns?.length>0 && <Badge color="teal">{po.grns.length} GRN(s)</Badge>}
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{po.vendorName}</div>
                <div style={{ fontSize:12, color:T.textMid, marginTop:2 }}>
                  PO Date: {fmt.date(po.poDate)} · Expected: {fmt.date(po.expectedDelivery)} · {po.lines.length} line(s)
                </div>
                <div style={{ display:"flex", gap:12, marginTop:6, flexWrap:"wrap" }}>
                  <span style={{ fontSize:12, color:T.textMid }}>Value: <strong style={{color:T.green,fontFamily:T.fontMono}}>{fmt.currency(totalVal)}</strong></span>
                  <span style={{ fontSize:12, color:T.textMid }}>Wt Ordered: <strong style={{color:T.text,fontFamily:T.fontMono}}>{fmt.wtT(totalWtOrd)}</strong></span>
                  <span style={{ fontSize:12, color:T.textMid }}>Wt Received: <strong style={{color:totalWtRec>0?T.green:T.textLow,fontFamily:T.fontMono}}>{fmt.wtT(totalWtRec)}</strong></span>
                </div>
                <div style={{ display:"flex", gap:4, marginTop:6 }}>
                  {po.servedOrders.map(oid=><Badge key={oid} color="blue">{oid}</Badge>)}
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:11, color:T.textMid, marginBottom:4 }}>Received</div>
                <div style={{ height:6, background:T.border, borderRadius:3, width:120, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${totalWtOrd>0?Math.round(totalWtRec/totalWtOrd*100):0}%`, background:totalWtRec>=totalWtOrd?T.green:T.amber, borderRadius:3 }} />
                </div>
                <div style={{ fontSize:11, color:T.textMid, marginTop:4 }}>{totalWtOrd>0?Math.round(totalWtRec/totalWtOrd*100):0}%</div>
              </div>
            </div>
          </div>
        );
      })}

      {/* New PO Modal */}
      {modal==="new_po" && (
        <Modal title="New Purchase Order" onClose={()=>setModal(null)} width={720}>
          <G2>
            <Field label="Vendor" required>
              <Sel value={form.vendorId||""} onChange={e=>{ const v=vendors.find(x=>x.id===e.target.value); setForm(f=>({...f,vendorId:e.target.value,vendorName:v?.name||""})); }}>
                <option value="">Select vendor...</option>
                {vendors.filter(v=>v.vendorType==="RM").map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
              </Sel>
            </Field>
            <Field label="PO Date" required><Input type="date" value={form.poDate||""} onChange={e=>setForm(f=>({...f,poDate:e.target.value}))} /></Field>
            <Field label="Expected Delivery"><Input type="date" value={form.expectedDelivery||""} onChange={e=>setForm(f=>({...f,expectedDelivery:e.target.value}))} /></Field>
            <Field label="Orders Served">
              <div style={{ display:"flex", gap:8 }}>
                {orders.map(o=>(
                  <label key={o.id} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer" }}>
                    <input type="checkbox" checked={(form.servedOrders||[]).includes(o.id)} onChange={e=>setForm(f=>({...f,servedOrders:e.target.checked?[...(f.servedOrders||[]),o.id]:(f.servedOrders||[]).filter(x=>x!==o.id)}))} />
                    <span style={{ fontSize:12, color:T.text }}>{o.id}</span>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Remarks"><Input value={form.remarks||""} onChange={e=>setForm(f=>({...f,remarks:e.target.value}))} /></Field>
          </G2>
          <div style={{ marginTop:12, marginBottom:8 }}>
            <SectionHd title="PO Lines" action={
              <button onClick={()=>setForm(f=>({...f,lines:[...(f.lines||[]),{matLibId:"",matCode:"",section:"",size:"",grade:"",matType:"MS",isPlate:false,qty:0,unit:"Nos",unitPrice:0,wtOrdered:0}]}))} style={css.btn.sm}>+ Add Line</button>
            } />
            {(form.lines||[]).map((l,i)=>{
              const libItem = (materials||[]).find(m=>m.id===l.matLibId);
              const lineWt = calcPoLineWt(l);
              const itemCode = buildItemCode(l);
              return (
                <div key={i} style={{ ...css.card, background:T.bg, marginBottom:8 }}>
                  {/* Material selector */}
                  <div style={{ marginBottom:8 }}>
                    <div style={css.label}>Material</div>
                    <Sel value={l.matLibId||"__ns__"} onChange={e=>setForm(f=>{ const n=[...f.lines]; if(e.target.value==="__ns__"){n[i]={...n[i],matLibId:"",matCode:"",isPlate:false,wtPerMetre:null,wtPerM2:null,stdLength:null,sheetLength:null,sheetWidth:null};}else{const m=(materials||[]).find(x=>x.id===e.target.value); if(m)n[i]={...n[i],matLibId:m.id,matCode:m.matCode,section:m.sectionType,size:m.size,grade:m.grade,matType:m.matType,isPlate:m.isPlate,wtPerMetre:m.wtPerMetre||null,wtPerM2:m.wtPerM2||null,stdLength:null,sheetLength:null,sheetWidth:null};} return {...f,lines:n}; })}>
                      <option value="__ns__">— Non-standard / not in library —</option>
                      {(materials||[]).filter(m=>m.active).map(m=>(
                        <option key={m.id} value={m.id}>{m.sectionType} {m.size} — {m.grade} ({m.wtPerMetre?`${m.wtPerMetre} kg/m`:`${m.wtPerM2} kg/m²`})</option>
                      ))}
                    </Sel>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr auto", gap:8, alignItems:"end" }}>
                    {/* Std length for sections */}
                    {l.matLibId && !l.isPlate && (
                      <Field label="Standard Length">
                        <Sel value={l.stdLength||""} onChange={e=>setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],stdLength:+e.target.value}; return {...f,lines:n}; })}>
                          <option value="">Select length...</option>
                          {(libItem?.standardLengths||[]).map(sl=><option key={sl} value={sl}>{sl/1000}m ({sl}mm)</option>)}
                        </Sel>
                      </Field>
                    )}
                    {/* Sheet dims for plates */}
                    {l.matLibId && l.isPlate && <>
                      <Field label="Sheet Length (mm)"><Input type="number" value={l.sheetLength||""} onChange={e=>setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],sheetLength:+e.target.value}; return {...f,lines:n}; })} /></Field>
                      <Field label="Sheet Width (mm)"><Input type="number" value={l.sheetWidth||""} onChange={e=>setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],sheetWidth:+e.target.value}; return {...f,lines:n}; })} /></Field>
                    </>}
                    {/* Free-text fallback */}
                    {!l.matLibId && <>
                      <Field label="Section"><Input value={l.section||""} onChange={e=>setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],section:e.target.value}; return {...f,lines:n}; })} placeholder="ISA, PLATE..." /></Field>
                      <Field label="Size"><Input value={l.size||""} onChange={e=>setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],size:e.target.value}; return {...f,lines:n}; })} /></Field>
                      <Field label="Grade"><Input value={l.grade||""} onChange={e=>setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],grade:e.target.value}; return {...f,lines:n}; })} /></Field>
                      <Field label="Unit"><Sel value={l.unit||"MT"} onChange={e=>setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],unit:e.target.value}; return {...f,lines:n}; })}><option>MT</option><option>KG</option><option>Nos</option></Sel></Field>
                    </>}
                    <Field label="Qty"><Input type="number" value={l.qty||""} onChange={e=>setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],qty:+e.target.value,totalPrice:+e.target.value*(n[i].unitPrice||0)}; return {...f,lines:n}; })} /></Field>
                    <Field label="Unit Price (₹/kg)"><Input type="number" value={l.unitPrice||""} onChange={e=>setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],unitPrice:+e.target.value,totalPrice:(n[i].qty||0)*+e.target.value}; return {...f,lines:n}; })} /></Field>
                    <Field label="Wt Ordered (kg)"><Input value={lineWt>0?lineWt.toFixed(1):""} readOnly style={{opacity:0.6,cursor:"default",color:T.green,fontFamily:T.fontMono}} /></Field>
                    <button onClick={()=>setForm(f=>({...f,lines:f.lines.filter((_,j)=>j!==i)}))} style={{ ...css.btn.ghost, color:T.red, paddingTop:18 }}>✕</button>
                  </div>
                  {/* Live calc preview + item code */}
                  <div style={{ marginTop:6, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                    <div style={{ fontSize:11, color:T.textMid }}>
                      {l.matLibId && !l.isPlate && l.stdLength>0 && <span>{l.qty} × {(l.stdLength/1000).toFixed(1)}m × {l.wtPerMetre} kg/m = <strong style={{color:T.green}}>{lineWt.toFixed(1)} kg</strong></span>}
                      {l.matLibId && l.isPlate && l.sheetLength>0 && l.sheetWidth>0 && <span>{l.qty} × {(l.sheetLength/1000).toFixed(2)}m × {(l.sheetWidth/1000).toFixed(2)}m × {l.wtPerM2} kg/m² = <strong style={{color:T.green}}>{lineWt.toFixed(1)} kg</strong></span>}
                    </div>
                    <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                      {itemCode && <span style={{ fontFamily:T.fontMono, fontSize:11, color:T.accentHi }}>📦 {itemCode}</span>}
                      <span style={{ fontSize:11, color:T.textMid }}>Line Total: <strong style={{color:T.green,fontFamily:T.fontMono}}>{fmt.currency((l.qty||0)*(l.unitPrice||0))}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button onClick={()=>setModal(null)} style={css.btn.secondary}>Cancel</button>
            <button onClick={savePO} style={css.btn.primary}>Create Purchase Order</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── PO DETAIL VIEW ───────────────────────────────────────────────────────────
const PODetail = ({ po, onBack, user, pos, setPos, setStock, showToast }) => {
  const [tab, setTab] = useState("lines");
  const [grnModal, setGrnModal] = useState(false);
  const [grnForm, setGrnForm] = useState({ lines:[] });
  const [inspModal, setInspModal] = useState(null);

  const canEdit = ["super_admin","purchase_admin","store_admin"].includes(user.role);
  const canInspect = ["super_admin","qc_admin","qc_user","store_admin"].includes(user.role);

  const saveGRN = () => {
    const ts = Date.now();
    const grnId = `GRN-${ts}`;
    const yr = new Date().getFullYear();
    const batchNo = po.vendorCode ? genBatchNo(po.vendorCode, pos, yr) : "";
    const newGrn = { ...grnForm, id:grnId, batchNo, date:today(), createdBy:user.name, lines:(grnForm.lines||[]) };
    setPos(prev => prev.map(p => {
      if (p.id!==po.id) return p;
      const updLines = p.lines.map(pl=>{
        const gl = newGrn.lines.find(x=>x.poLineId===pl.id);
        if(!gl) return pl;
        const nw=(pl.wtReceived||0)+(gl.wtReceived||0);
        return {...pl, wtReceived:nw, status:nw>=pl.wtOrdered?"fully_received":"partially_received"};
      });
      const allF=updLines.every(l=>l.status==="fully_received");
      const anyR=updLines.some(l=>l.status==="fully_received"||l.status==="partially_received");
      return {...p, grns:[...p.grns,newGrn], lines:updLines, status:allF?"fully_received":anyR?"partially_received":"pending"};
    }));
    if (setStock) {
      const rawLots = buildStockLots(newGrn, po, grnId, ts);
      if (rawLots.length>0) setStock(prev=>{
        const maxLot=prev.reduce((m,s)=>{ const mt=s.lotNo?.match(/^LOT-(\d{4})-(\d+)$/); return mt&&+mt[1]===yr?Math.max(m,+mt[2]):m; },0);
        return [...prev,...rawLots.map((lot,i)=>({...lot,lotNo:`LOT-${yr}-${String(maxLot+i+1).padStart(3,"0")}`}))];
      });
    }
    showToast("GRN saved — materials added to RM QC queue");
    setGrnModal(false); setGrnForm({lines:[]});
  };

  const totalWtOrd = po.lines?.reduce((s,l)=>s+(l.wtOrdered||0),0)||0;
  const totalWtRec = po.lines?.reduce((s,l)=>s+(l.wtReceived||0),0)||0;
  const totalVal = po.lines?.reduce((s,l)=>s+(l.totalPrice||0),0)||0;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
        <button onClick={onBack} style={{ ...css.btn.ghost, color:T.accent }}>← Purchase Orders</button>
        <span style={{ color:T.textLow }}>/</span>
        <span style={{ fontFamily:T.fontMono, color:T.accentHi, fontSize:14, fontWeight:700 }}>{po.id}</span>
        <Badge color={poStatusBadge[po.status]||"gray"}>{po.status?.replace("_"," ")}</Badge>
      </div>
      <div style={{ fontSize:18, fontWeight:800, color:T.text, marginBottom:2 }}>{po.vendorName}</div>
      <div style={{ fontSize:12, color:T.textMid, marginBottom:16 }}>
        PO Date: {fmt.date(po.poDate)} · Expected: {fmt.date(po.expectedDelivery)} ·
        Value: <strong style={{color:T.green,fontFamily:T.fontMono}}>{fmt.currency(totalVal)}</strong> ·
        Received: {fmt.wtT(totalWtRec)} of {fmt.wtT(totalWtOrd)}
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {["lines","grns"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:"7px 14px", fontSize:12, fontWeight:tab===t?700:400, color:tab===t?T.accent:T.textMid, background:"transparent", border:"none", borderBottom:tab===t?`2px solid ${T.accent}`:"2px solid transparent", cursor:"pointer", fontFamily:T.font }}>
            {t==="lines"?"PO Lines":"GRNs"} {t==="grns"&&po.grns?.length>0?`(${po.grns.length})`:""}
          </button>
        ))}
        <div style={{ flex:1 }} />
        {canEdit && tab==="grns" && <button onClick={()=>{ const yr=new Date().getFullYear(); const preview=po.vendorCode?genBatchNo(po.vendorCode,pos,yr):""; setGrnForm({lines:[],batchNo:preview}); setGrnModal(true); }} style={css.btn.primary}>+ Raise GRN</button>}
      </div>

      {/* PO Lines */}
      {tab==="lines" && (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead><tr><TH>#</TH><TH>Item Code / Material</TH><TH right>Qty</TH><TH right>Unit Price</TH><TH right>Total Price</TH><TH right>Wt Ordered (kg)</TH><TH right>Wt Received (kg)</TH><TH>Status</TH></tr></thead>
            <tbody>
              {po.lines?.map((l,i)=>{
                const dispCode = l.itemCode || l.matCode || (l.section?`${l.section} ${l.size} ${l.grade}`.trim():"—");
                return (
                <tr key={l.id} style={{ background:i%2===0?"transparent":T.bg }}>
                  <TD mono color={T.textLow}>{i+1}</TD>
                  <TD><span style={{fontFamily:T.fontMono,fontSize:11,color:l.matLibId?T.accentHi:T.text}}>{dispCode}</span></TD>
                  <TD right mono>{l.qty} {l.unit||"Nos"}</TD>
                  <TD right mono>{fmt.currency(l.unitPrice)}</TD>
                  <TD right mono bold color={T.green}>{fmt.currency(l.totalPrice)}</TD>
                  <TD right mono>{fmt.num(l.wtOrdered)}</TD>
                  <TD right mono color={l.wtReceived>0?T.green:T.textLow}>{fmt.num(l.wtReceived||0)}</TD>
                  <TD><Badge color={l.status==="fully_received"?"green":l.status==="partially_received"?"amber":l.status==="pending"?"gray":"red"}>{l.status?.replace("_"," ")}</Badge></TD>
                </tr>
                );
              })}
              <tr style={{ background:T.bgInput }}>
                <td colSpan={4} style={{ padding:"6px 10px", fontWeight:700, fontSize:12, color:T.textMid }}>Total</td>
                <td style={{ padding:"6px 10px", textAlign:"right", fontFamily:T.fontMono, fontWeight:700, color:T.green }}>{fmt.currency(totalVal)}</td>
                <td style={{ padding:"6px 10px", textAlign:"right", fontFamily:T.fontMono, fontWeight:700 }}>{fmt.num(totalWtOrd)}</td>
                <td style={{ padding:"6px 10px", textAlign:"right", fontFamily:T.fontMono, fontWeight:700, color:T.green }}>{fmt.num(totalWtRec)}</td>
                <td/>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* GRNs */}
      {tab==="grns" && (
        <div>
          {po.grns?.length===0 && <div style={{ ...css.card, textAlign:"center", color:T.textLow, padding:32 }}>No GRNs raised yet</div>}
          {po.grns?.map(grn=>(
            <div key={grn.id} style={{ ...css.card, marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                    <span style={{ fontFamily:T.fontMono, color:T.accentHi, fontSize:13, fontWeight:700 }}>{grn.id}</span>
                    <Badge color="green">Received</Badge>
                  </div>
                  <div style={{ fontSize:12, color:T.textMid }}>Date: {fmt.date(grn.date)} · Vehicle: {grn.vehicleNo} · Challan: {grn.challanNo} · By: {grn.createdBy}</div>
                  {grn.batchNo&&<div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>Batch: <span style={{fontFamily:T.fontMono,color:T.accentHi,fontWeight:700}}>{grn.batchNo}</span></div>}
                  {grn.remarks && <div style={{ fontSize:12, color:T.textMid, marginTop:4 }}>{grn.remarks}</div>}
                </div>
              </div>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead><tr><TH>PO Line</TH><TH>Material</TH><TH right>Wt Received (kg)</TH><TH>Heat No</TH><TH>Condition</TH><TH>Inspection</TH></tr></thead>
                <tbody>
                  {grn.lines?.map((l,i)=>(
                    <tr key={i} style={{ background:i%2===0?"transparent":T.bg }}>
                      <TD mono>{l.poLineId}</TD>
                      <TD><span style={{fontFamily:T.fontMono,fontSize:11}}>{l.materialDesc}</span></TD>
                      <TD right mono bold color={T.green}>{fmt.num(l.wtReceived)}</TD>
                      <TD mono>{l.heatNo||<span style={{color:T.textLow}}>—</span>}</TD>
                      <TD>{l.condition}</TD>
                      <TD><Badge color={grnStatusBadge[l.inspStatus]||"gray"}>{l.inspStatus}</Badge></TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* GRN Modal */}
      {grnModal && (
        <Modal title={`Raise GRN — ${po.id}`} onClose={()=>{setGrnModal(false);setGrnForm({lines:[]});}} width={800}>
          {/* Batch number preview */}
          {grnForm.batchNo && (
            <div style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 14px", marginBottom:14, display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ fontSize:11, color:T.textMid }}>BATCH NUMBER</div>
              <span style={{ fontFamily:T.fontMono, fontSize:16, fontWeight:800, color:T.accentHi }}>{grnForm.batchNo}</span>
              <span style={{ fontSize:11, color:T.textLow }}>This batch number will be assigned to all stock lots created by this GRN</span>
            </div>
          )}
          <G2>
            <Field label="Vehicle No"><Input value={grnForm.vehicleNo||""} onChange={e=>setGrnForm(f=>({...f,vehicleNo:e.target.value}))} placeholder="MH-31-AB-1234" /></Field>
            <Field label="Challan No"><Input value={grnForm.challanNo||""} onChange={e=>setGrnForm(f=>({...f,challanNo:e.target.value}))} /></Field>
            <Field label="Supplier DC No"><Input value={grnForm.dcNo||""} onChange={e=>setGrnForm(f=>({...f,dcNo:e.target.value}))} /></Field>
            <Field label="Storage Bay">
              <Sel value={grnForm.bayId||""} onChange={e=>setGrnForm(f=>({...f,bayId:e.target.value}))}>
                <option value="">Select bay...</option>
                {BAYS.map(b=><option key={b.id} value={b.id}>Bay {String(b.number).padStart(2,"0")}</option>)}
              </Sel>
            </Field>
            <Field label="Remarks"><Input value={grnForm.remarks||""} onChange={e=>setGrnForm(f=>({...f,remarks:e.target.value}))} /></Field>
          </G2>
          {(grnForm.lines||[]).some(l=>l.inspStatus==="hold") && (
            <Field label="Hold Reason"><Input value={grnForm.holdReason||""} onChange={e=>setGrnForm(f=>({...f,holdReason:e.target.value}))} placeholder="Reason for hold..." /></Field>
          )}
          <SectionHd title="Received Lines" action={
            <button onClick={()=>setGrnForm(f=>({...f,lines:[...(f.lines||[]),{wtReceived:0,heatNo:"",condition:"good",inspStatus:"approved"}]}))} style={css.btn.sm}>+ Add Line</button>
          } />
          {(grnForm.lines||[]).map((l,i)=>(
            <div key={i} style={{ ...css.card, background:T.bg, marginBottom:8 }}>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto", gap:10, alignItems:"end" }}>
                <Field label="PO Line Ref">
                  <Sel value={l.poLineId||""} onChange={e=>setGrnForm(f=>{ const n=[...f.lines]; const pl=po.lines?.find(x=>x.id===e.target.value); n[i]={...n[i],poLineId:e.target.value,materialDesc:pl?.itemCode||pl?.matCode||`${pl?.section||""} ${pl?.size||""}`.trim()}; return {...f,lines:n}; })}>
                    <option value="">Select PO line...</option>
                    {po.lines?.map(pl=><option key={pl.id} value={pl.id}>{pl.id} — {pl.itemCode||pl.matCode||`${pl.section} ${pl.size}`.trim()}</option>)}
                  </Sel>
                </Field>
                <Field label="Wt Received (kg)"><Input type="number" value={l.wtReceived||""} onChange={e=>setGrnForm(f=>{ const n=[...f.lines]; n[i]={...n[i],wtReceived:+e.target.value}; return {...f,lines:n}; })} /></Field>
                <Field label={<span>Heat No {!l.heatNo&&<span style={{color:T.amber,fontSize:10}}>⚠ blank</span>}</span>}>
                  <Input value={l.heatNo||""} onChange={e=>setGrnForm(f=>{ const n=[...f.lines]; n[i]={...n[i],heatNo:e.target.value}; return {...f,lines:n}; })} placeholder="From MTC..." />
                </Field>
                <Field label="Condition">
                  <Sel value={l.condition||"good"} onChange={e=>setGrnForm(f=>{ const n=[...f.lines]; n[i]={...n[i],condition:e.target.value}; return {...f,lines:n}; })}>
                    <option value="good">Good</option>
                    <option value="damaged">Damaged</option>
                    <option value="short">Short Quantity</option>
                  </Sel>
                </Field>
                <Field label="Insp Status">
                  <Sel value={l.inspStatus||"approved"} onChange={e=>setGrnForm(f=>{ const n=[...f.lines]; n[i]={...n[i],inspStatus:e.target.value}; return {...f,lines:n}; })}>
                    <option value="approved">Approved</option>
                    <option value="hold">Hold</option>
                    <option value="rejected">Rejected</option>
                  </Sel>
                </Field>
                <button onClick={()=>setGrnForm(f=>({...f,lines:f.lines.filter((_,j)=>j!==i)}))} style={{ ...css.btn.ghost, color:T.red, paddingTop:20 }}>✕</button>
              </div>
            </div>
          ))}
          <InfoBanner color="amber">All received lots start as QC Hold — regardless of visual inspection. Progression through RM QC module.</InfoBanner>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button onClick={()=>{setGrnModal(false);setGrnForm({lines:[]});}} style={css.btn.secondary}>Cancel</button>
            <button onClick={saveGRN} style={css.btn.primary}>Save GRN</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// RM QC MODULE
// ═══════════════════════════════════════════════════════════════════════════════
const RMQCModule = ({ user, stock, setStock }) => {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (msg,color="green") => { setToast({msg,color}); setTimeout(()=>setToast(null),3000); };
  const canQC = ["super_admin","qc_admin","qc_user","store_admin"].includes(user.role);

  const qcPending = stock.filter(s=>s.rmQcStatus==="pending");
  const clientPending = stock.filter(s=>s.rmQcStatus==="approved"&&s.clientInspStatus==="pending");
  const approved = stock.filter(s=>s.rmQcStatus==="approved"&&s.clientInspStatus==="approved");
  const onHold = stock.filter(s=>s.status==="qc_hold");

  const doQC = (lotId, result, remarks) => {
    setStock(prev=>prev.map(s=>s.id===lotId?{...s,rmQcStatus:result,qcRemarks:remarks,qcDate:today(),qcBy:user.name,
      status:result==="failed"?"rejected":s.status}:s));
    showToast(result==="approved"?"RM QC Approved — pending client inspection":"RM QC result saved");
    setModal(null);
  };

  const doClientInsp = (lotId, result, remarks) => {
    setStock(prev=>prev.map(s=>s.id===lotId?{...s,clientInspStatus:result,clientInspRemarks:remarks,clientInspDate:today(),
      status:(result==="approved"&&s.rmQcStatus==="approved")?"available":"qc_hold"}:s));
    showToast(result==="approved"?"Client Inspection Passed — material added to available stock ✓":"Client inspection result saved");
    setModal(null);
  };

  const QCRow = ({ lot, type }) => (
    <tr style={{ borderBottom:`1px solid ${T.border}` }}>
      <TD mono>{lot.lotNo}</TD>
      <TD>{lot.matType} {lot.grade}</TD>
      <TD>{lot.section}</TD>
      <TD mono>{lot.size}</TD>
      <TD right mono bold color={T.gold}>{fmt.num(lot.wtReceived)}</TD>
      <TD><Badge color="teal">{lot.bayId}</Badge></TD>
      <TD>{lot.vendorName}</TD>
      <TD>{fmt.date(lot.receivedDate)}</TD>
      <TD>
        {lot.mtcUploaded
          ? <a href={lot.mtcDoc} target="_blank" rel="noreferrer" style={{ ...css.btn.sm, textDecoration:"none", background:T.greenLo, color:T.green, fontSize:10 }}>MTC ✓</a>
          : <span style={{ fontSize:11, color:T.red }}>⚠ MTC Missing</span>}
      </TD>
      <TD>
        <Badge color={qcStatusBadge[type==="qc"?lot.rmQcStatus:lot.clientInspStatus]||"gray"}>
          {type==="qc"?lot.rmQcStatus:lot.clientInspStatus}
        </Badge>
      </TD>
      <TD>
        {canQC && (
          <button onClick={()=>{setForm({lotId:lot.id,type,lot});setModal("inspect");}} style={{ ...css.btn.sm, background:T.amberBg, color:T.amber, border:`1px solid ${T.amber}` }}>
            {type==="qc"?"Inspect":"Client Insp"}
          </button>
        )}
      </TD>
    </tr>
  );

  const Section = ({ title, lots, type, color }) => (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{title}</div>
        <Badge color={color}>{lots.length}</Badge>
      </div>
      {lots.length===0
        ? <div style={{ ...css.card, textAlign:"center", color:T.textLow, padding:20 }}>No items</div>
        : <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead><tr><TH>Lot No</TH><TH>Material</TH><TH>Section</TH><TH>Size</TH><TH right>Wt (kg)</TH><TH>Bay</TH><TH>Vendor</TH><TH>Received</TH><TH>MTC</TH><TH>Status</TH><TH>Action</TH></tr></thead>
              <tbody>{lots.map(l=><QCRow key={l.id} lot={l} type={type} />)}</tbody>
            </table>
          </div>
      }
    </div>
  );

  return (
    <div>
      {toast && <div style={{ position:"fixed", top:20, right:20, zIndex:2000, background:toast.color==="green"?T.greenBg:T.redBg, border:`1px solid ${toast.color==="green"?T.green:T.red}`, borderRadius:8, padding:"12px 20px", color:toast.color==="green"?T.green:T.red, fontSize:13, fontWeight:600 }}>{toast.msg}</div>}

      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:20, fontWeight:800, color:T.text }}>RM Quality Control</div>
        <div style={{ fontSize:12, color:T.textMid }}>RM inspection · MTC verification · Client inspection gate · Stock release</div>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
        <StatCard label="RM QC Pending" value={qcPending.length} color={T.amber} />
        <StatCard label="Client Insp Pending" value={clientPending.length} color={T.gold} sub="HARD GATE — cannot produce" />
        <StatCard label="Approved & Available" value={approved.length} color={T.green} />
        <StatCard label="QC Hold" value={onHold.length} color={T.red} />
      </div>

      {onHold.length>0 && (
        <InfoBanner color="red">
          ⚠ <strong>{onHold.length} lot(s) on QC Hold:</strong>{" "}{onHold.map(s=>`${s.lotNo} — ${s.qcHoldReason||s.qcRemarks||"Reason not specified"}`).join(" | ")}
        </InfoBanner>
      )}

      <Section title="RM QC Pending — Physical Inspection" lots={qcPending} type="qc" color="amber" />
      <Section title="Client Inspection Pending" lots={clientPending} type="client" color="gold" />
      <Section title="Approved & Available in Stock" lots={approved} type="done" color="green" />

      {/* Inspection Modal */}
      {modal==="inspect" && (
        <Modal title={form.type==="qc"?"RM QC Inspection":"Client Inspection"} onClose={()=>setModal(null)} width={560}>
          <div style={{ ...css.card, background:T.bg, marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.textMid, marginBottom:8 }}>LOT DETAILS</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[["Lot No",form.lot?.lotNo],["Material",`${form.lot?.matType} ${form.lot?.grade}`],["Section/Size",`${form.lot?.section} ${form.lot?.size}`],["Wt Received",`${fmt.num(form.lot?.wtReceived)} kg`],["Bay",form.lot?.bayId],["MTC",form.lot?.mtcUploaded?"Uploaded ✓":"⚠ Missing"]].map(([k,v])=>(
                <div key={k}><div style={css.label}>{k}</div><div style={{ fontSize:12, color:v?.includes?.("⚠")?T.red:T.text, fontFamily:k.includes("Lot")||k.includes("Wt")||k.includes("Bay")?T.fontMono:T.font }}>{v}</div></div>
              ))}
            </div>
          </div>

          {form.type==="qc" && (
            <div>
              <Field label="Inspection Checks">
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {["MTC Verified","Dimensions Checked","Visual Inspection OK","Surface Condition OK","Identification Marking OK"].map(check=>(
                    <label key={check} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                      <input type="checkbox" checked={form[check]||false} onChange={e=>setForm(f=>({...f,[check]:e.target.checked}))} />
                      <span style={{ fontSize:12, color:T.text }}>{check}</span>
                    </label>
                  ))}
                </div>
              </Field>
              {!form.lot?.mtcUploaded && <InfoBanner color="red">⚠ MTC not uploaded — system will allow QC but will log warning. Upload MTC before client inspection.</InfoBanner>}
            </div>
          )}

          {form.type==="client" && (
            <InfoBanner color="amber">
              HARD GATE — client must physically inspect and approve before material enters production. Once approved, material becomes available for nesting and production.
            </InfoBanner>
          )}

          <Field label="Remarks / Observations"><Textarea value={form.remarks||""} onChange={e=>setForm(f=>({...f,remarks:e.target.value}))} /></Field>

          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button onClick={()=>setModal(null)} style={css.btn.secondary}>Cancel</button>
            <button onClick={()=>{ if(form.type==="qc") doQC(form.lotId,"failed",form.remarks); else doClientInsp(form.lotId,"rejected",form.remarks); }} style={css.btn.danger}>
              {form.type==="qc"?"Fail / Hold":"Reject"}
            </button>
            <button onClick={()=>{ if(form.type==="qc") doQC(form.lotId,"approved",form.remarks); else doClientInsp(form.lotId,"approved",form.remarks); }} style={css.btn.primary}>
              {form.type==="qc"?"Pass QC → Client Inspection":"Client Approve → To Stock"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STOCK MODULE
// ═══════════════════════════════════════════════════════════════════════════════
const StockModule = ({ user, stock, setStock, orders, contractors }) => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [modal, setModal] = useState(null);
  const [activeLot, setActiveLot] = useState(null);
  const [mForm, setMForm] = useState({});
  const [toast, setToast] = useState(null);

  const yr = new Date().getFullYear();
  const showToast = (msg,color="green") => { setToast({msg,color}); setTimeout(()=>setToast(null),3000); };
  const canAllocate = ["super_admin","store_admin","planning_admin"].includes(user.role);
  const canIssue    = ["super_admin","store_admin"].includes(user.role);
  const canRelease  = ["super_admin","store_admin","planning_admin"].includes(user.role);

  const totals = {
    available: stock.reduce((s,x)=>s+(x.wtAvailable||0),0),
    allocated: stock.reduce((s,x)=>s+(x.wtAllocated||0),0),
    issued:    stock.reduce((s,x)=>s+(x.wtIssued||0),0),
    consumed:  stock.reduce((s,x)=>s+(x.wtConsumed||0),0),
  };

  const filtered = stock.filter(s => {
    const ms = filter==="all" || (filter==="offcuts"?s.isOffcut:s.status===filter);
    const mq = !search || [s.lotNo,s.batchNo,s.matCode,s.section,s.size,s.grade,s.vendorName,s.heatNo].some(v=>(v||"").toLowerCase().includes(search.toLowerCase()));
    return ms && mq;
  });

  const stCol = { available:"green", allocated:"blue", issued:"purple", consumed:"gray", qc_hold:"amber" };
  const openModal = (m,lot) => { setModal(m); setActiveLot(lot); setMForm({}); };
  const closeModal = () => { setModal(null); setActiveLot(null); setMForm({}); };

  // MTC diversion check for Transfer modal
  const tAllocIdx = activeLot && mForm.allocIdx !== undefined && mForm.allocIdx !== "" ? +mForm.allocIdx : -1;
  const tOrigAlloc = tAllocIdx >= 0 ? activeLot?.allocations?.[tAllocIdx] : null;
  const tOrigClientId = tOrigAlloc ? orders.find(o=>o.id===tOrigAlloc.orderId)?.clientId : null;
  const tNewClientId  = mForm.newOrderId ? orders.find(o=>o.id===mForm.newOrderId)?.clientId : null;
  const mtcDivWarn    = !!(tOrigClientId && tNewClientId && tOrigClientId !== tNewClientId);

  const saveAlloc = () => {
    if (!mForm.orderId || !mForm.wt) return showToast("Fill required fields","amber");
    const wt = +mForm.wt;
    if (wt <= 0 || wt > activeLot.wtAvailable) return showToast("Invalid weight","amber");
    const drg = orders.find(o=>o.id===mForm.orderId)?.drawings?.find(d=>d.id===mForm.drawingId);
    const alloc = { orderId:mForm.orderId, drawingId:mForm.drawingId||"", drawingNo:drg?.drawingNo||"", markNo:mForm.markNo||"", wt, reservedBy:user.name, reservedDate:today(), status:"allocated" };
    setStock(prev=>prev.map(s=>s.id!==activeLot.id?s:{ ...s, wtAllocated:(s.wtAllocated||0)+wt, wtAvailable:(s.wtAvailable||0)-wt, status:"allocated", allocations:[...(s.allocations||[]),alloc], auditLog:[...(s.auditLog||[]),{action:"allocated",orderId:mForm.orderId,wt,by:user.name,date:today(),reason:""}] }));
    showToast("Stock allocated"); closeModal();
  };

  const saveRelease = () => {
    if (!mForm.reason || mForm.allocIdx === undefined || mForm.allocIdx === "") return showToast("Fill required fields","amber");
    const idx = +mForm.allocIdx;
    const allocWt = activeLot.allocations[idx]?.wt || 0;
    const orderId = activeLot.allocations[idx]?.orderId || "";
    setStock(prev=>prev.map(s=>s.id!==activeLot.id?s:{ ...s, wtAllocated:Math.max(0,(s.wtAllocated||0)-allocWt), wtAvailable:(s.wtAvailable||0)+allocWt, status:(s.wtAllocated-allocWt)<=0&&(s.wtIssued||0)===0?"available":s.status, allocations:s.allocations.filter((_,i)=>i!==idx), auditLog:[...(s.auditLog||[]),{action:"released",orderId,wt:allocWt,by:user.name,date:today(),reason:mForm.reason}] }));
    showToast("Allocation released"); closeModal();
  };

  const saveTransfer = () => {
    if (mForm.allocIdx === undefined || mForm.allocIdx === "" || !mForm.newOrderId || !mForm.reason) return showToast("Fill required fields","amber");
    if ((activeLot.wtIssued||0) > 0) return showToast("Cannot transfer — material already issued","amber");
    const idx = +mForm.allocIdx;
    const allocWt = activeLot.allocations[idx]?.wt || 0;
    const fromOrderId = activeLot.allocations[idx]?.orderId || "";
    const drg = orders.find(o=>o.id===mForm.newOrderId)?.drawings?.find(d=>d.id===mForm.newDrawingId);
    const newAlloc = { ...activeLot.allocations[idx], orderId:mForm.newOrderId, drawingId:mForm.newDrawingId||"", drawingNo:drg?.drawingNo||"", markNo:mForm.newMarkNo||"" };
    setStock(prev=>prev.map(s=>s.id!==activeLot.id?s:{ ...s, allocations:s.allocations.map((a,i)=>i===idx?newAlloc:a), originalOrderId:fromOrderId, diversionLog:[...(s.diversionLog||[]),{from:fromOrderId,to:mForm.newOrderId,wt:allocWt,by:user.name,date:today(),reason:mForm.reason,mtcOverride:!!mForm.mtcOverride}], auditLog:[...(s.auditLog||[]),{action:mForm.mtcOverride?"diverted/mtc-override":"transferred",orderId:mForm.newOrderId,wt:allocWt,by:user.name,date:today(),reason:mForm.reason}] }));
    showToast("Stock transferred"); closeModal();
  };

  const saveIssue = () => {
    if (!mForm.contractorId || !mForm.orderId) return showToast("Fill required fields","amber");
    const wt = +(mForm.wt || activeLot.wtAllocated);
    if (wt <= 0) return showToast("Invalid weight","amber");
    let maxIsn = 0;
    stock.forEach(s=>(s.issues||[]).forEach(iss=>{ const m=(iss.issueNoteNo||"").match(/^ISN-(\d{4})-(\d+)$/); if(m&&+m[1]===yr) maxIsn=Math.max(maxIsn,+m[2]); }));
    const issNoteNo = `ISN-${yr}-${String(maxIsn+1).padStart(3,"0")}`;
    const con = (contractors||[]).find(c=>c.id===mForm.contractorId);
    const issEntry = { issueId:`ISS-${Date.now()}`, issueDate:today(), issuedTo:con?.name||mForm.contractorId, contractorId:mForm.contractorId, orderId:mForm.orderId, drawingId:mForm.drawingId||"", drawingNo:"", wt, issuedBy:user.name, issueNoteNo:issNoteNo, nestingRunId:"", dxfLink:mForm.dxfLink||"" };
    setStock(prev=>prev.map(s=>s.id!==activeLot.id?s:{ ...s, wtIssued:(s.wtIssued||0)+wt, wtAllocated:Math.max(0,(s.wtAllocated||0)-wt), status:"issued", issues:[...(s.issues||[]),issEntry], auditLog:[...(s.auditLog||[]),{action:"issued",orderId:mForm.orderId,wt,by:user.name,date:today(),reason:`ISN:${issNoteNo}`}] }));
    const lotSnap = {...activeLot};
    setMForm({ issNoteNo, issEntry, lotSnap, contractorName:con?.name||"" });
    setModal("print");
    showToast("Issue note generated");
  };

  const saveOffcut = () => {
    const offcutWt = +(mForm.offcutWt||0);
    if (offcutWt < 5) return showToast("Minimum off-cut weight is 5 kg","amber");
    let maxLot = 0;
    stock.forEach(s=>{ const m=(s.lotNo||"").match(/^LOT-(\d{4})-(\d+)$/); if(m&&+m[1]===yr) maxLot=Math.max(maxLot,+m[2]); });
    const newLotNo = `LOT-${yr}-${String(maxLot+1).padStart(3,"0")}`;
    const dim = activeLot.section==="PLATE" ? (mForm.offcutDim||"") : (mForm.offcutLength||"");
    const newLot = { id:`OC-${Date.now()}`, lotNo:newLotNo, batchNo:activeLot.batchNo, itemCode:dim?`${activeLot.matCode}/${dim}`:activeLot.matCode, matCode:activeLot.matCode, matLibId:activeLot.matLibId||"", matType:activeLot.matType, grade:activeLot.grade, section:activeLot.section, size:activeLot.size, vendorId:activeLot.vendorId, vendorCode:activeLot.vendorCode, vendorName:activeLot.vendorName, heatNo:activeLot.heatNo, wtReceived:offcutWt, wtAvailable:offcutWt, wtAllocated:0, wtIssued:0, wtConsumed:0, status:"available", bayId:activeLot.bayId, mtcUploaded:activeLot.mtcUploaded, mtcDoc:activeLot.mtcDoc, rmQcStatus:"approved", clientInspStatus:activeLot.clientInspStatus, receivedDate:today(), isOffcut:true, parentLotId:activeLot.id, parentBatchNo:activeLot.batchNo, offcutLength:mForm.offcutLength||null, offcutDimensions:dim, nestingRunId:"", allocations:[], issues:[], auditLog:[], diversionLog:[], originalOrderId:"", qcHoldReason:"" };
    const consumed = +(mForm.consumedWt||0);
    setStock(prev=>[...prev.map(s=>s.id!==activeLot.id?s:{ ...s, wtConsumed:(s.wtConsumed||0)+consumed, auditLog:[...(s.auditLog||[]),{action:"offcut-created",orderId:"",wt:offcutWt,by:user.name,date:today(),reason:`Off-cut → ${newLotNo}`}] }), newLot]);
    showToast(`Off-cut lot created: ${newLotNo}`); closeModal();
  };

  return (
    <div>
      {toast && <div style={{ position:"fixed",top:20,right:20,zIndex:2000,background:toast.color==="green"?T.greenBg:T.amberBg,border:`1px solid ${toast.color==="green"?T.green:T.amber}`,borderRadius:8,padding:"12px 20px",color:toast.color==="green"?T.green:T.amber,fontSize:13,fontWeight:600 }}>{toast.msg}</div>}

      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:20,fontWeight:800,color:T.text }}>Stock & Inventory</div>
        <div style={{ fontSize:12,color:T.textMid }}>RM lots · Bay allocation · Partial allocation · QC status · MTC tracking · Issue notes</div>
      </div>

      <div style={{ display:"flex",gap:10,marginBottom:16,flexWrap:"wrap" }}>
        <StatCard label="Available" value={fmt.wtT(totals.available)} sub={`${stock.filter(s=>s.status==="available").length} lots`} color={T.green} />
        <StatCard label="Allocated" value={fmt.wtT(totals.allocated)} sub={`${stock.filter(s=>s.status==="allocated").length} lots`} color={T.accent} />
        <StatCard label="Issued" value={fmt.wtT(totals.issued)} sub={`${stock.filter(s=>s.status==="issued").length} lots`} color="#A78BFA" />
        <StatCard label="Consumed" value={fmt.wtT(totals.consumed)} sub={`${stock.filter(s=>s.status==="consumed").length} lots`} color={T.textMid} />
        <StatCard label="QC Hold" value={stock.filter(s=>s.status==="qc_hold").length} sub="lots on hold" color={T.amber} />
        <StatCard label="Off-cuts" value={stock.filter(s=>s.isOffcut).length} sub={fmt.wtT(stock.filter(s=>s.isOffcut).reduce((a,x)=>a+(x.wtAvailable||0),0))} color="#22D3EE" />
      </div>

      <div style={{ display:"flex",gap:8,marginBottom:14,flexWrap:"wrap" }}>
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:T.textLow,fontSize:12 }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Lot, batch, matCode, vendor..." style={{ ...css.input,paddingLeft:28,width:260 }} />
        </div>
        {[["all","All"],["available","Available"],["allocated","Allocated"],["issued","Issued"],["consumed","Consumed"],["qc_hold","QC Hold"],["offcuts","Off-cuts"]].map(([f,lbl])=>(
          <button key={f} onClick={()=>setFilter(f)} style={{ ...css.btn.secondary,...(filter===f?{background:`${T.accent}22`,color:T.accent,borderColor:T.accent}:{}) }}>
            {lbl} ({f==="all"?stock.length:f==="offcuts"?stock.filter(s=>s.isOffcut).length:stock.filter(s=>s.status===f).length})
          </button>
        ))}
      </div>

      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
          <thead>
            <tr>
              <TH></TH>
              <TH>Lot No</TH><TH>Batch No</TH><TH>Mat Code</TH><TH>Section / Size</TH><TH>Grade</TH>
              <TH>Vendor</TH><TH>Bay</TH>
              <TH right>Rcvd kg</TH><TH right>Avail kg</TH><TH right>Alloc kg</TH><TH right>Issued kg</TH>
              <TH>MTC</TH><TH>Heat No</TH><TH>RM QC</TH><TH>Client</TH><TH>Status</TH><TH>Actions</TH>
            </tr>
          </thead>
          {filtered.length===0 && <tbody><tr><td colSpan={18} style={{ padding:32,textAlign:"center",color:T.textLow }}>No stock found</td></tr></tbody>}
          {filtered.map(s=>(
            <tbody key={s.id}>
              <tr style={{ background:expandedId===s.id?`${T.accent}11`:"transparent",borderBottom:`1px solid ${T.border}`,cursor:"pointer" }} onClick={()=>setExpandedId(expandedId===s.id?null:s.id)}>
                <TD><span style={{ color:T.textLow,fontSize:10 }}>{expandedId===s.id?"▼":"▶"}</span></TD>
                <TD mono>{s.lotNo}{s.isOffcut&&<span style={{ marginLeft:4 }}><Badge color="teal">OC</Badge></span>}</TD>
                <TD mono>{s.batchNo}</TD>
                <TD mono>{s.matCode||`${s.section||""}/${s.size||""}`}</TD>
                <TD>{s.section} {s.size}</TD>
                <TD><Badge color="gray">{s.grade}</Badge></TD>
                <TD>{s.vendorName}</TD>
                <TD><Badge color="teal">{s.bayId}</Badge></TD>
                <TD right mono>{fmt.num(s.wtReceived)}</TD>
                <TD right mono bold color={T.green}>{fmt.num(s.wtAvailable)}</TD>
                <TD right mono color={T.accent}>{fmt.num(s.wtAllocated)}</TD>
                <TD right mono color="#A78BFA">{fmt.num(s.wtIssued||0)}</TD>
                <TD>{s.mtcUploaded?<a href={s.mtcDoc} target="_blank" rel="noreferrer" style={{ fontSize:10,color:T.green,fontWeight:700 }}>MTC ✓</a>:<span style={{ fontSize:10,color:T.red,fontWeight:700 }}>⚠ Missing</span>}</TD>
                <TD mono>{s.heatNo||<span style={{ color:T.textLow }}>—</span>}</TD>
                <TD><Badge color={qcStatusBadge[s.rmQcStatus]||"gray"}>{s.rmQcStatus}</Badge></TD>
                <TD><Badge color={qcStatusBadge[s.clientInspStatus]||"gray"}>{s.clientInspStatus}</Badge></TD>
                <TD><Badge color={stCol[s.status]||"gray"}>{s.status?.replace("_"," ")}</Badge></TD>
                <TD onClick={e=>e.stopPropagation()}>
                  <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
                    {canAllocate&&s.status==="available"&&s.rmQcStatus==="approved"&&s.clientInspStatus==="approved"&&(
                      <button onClick={()=>openModal("allocate",s)} style={{ ...css.btn.sm,fontSize:10 }}>Alloc</button>
                    )}
                    {canRelease&&(s.allocations||[]).length>0&&(
                      <button onClick={()=>openModal("release",s)} style={{ ...css.btn.sm,background:T.amberBg,color:T.amber,border:`1px solid ${T.amber}`,fontSize:10 }}>Release</button>
                    )}
                    {canRelease&&(s.allocations||[]).length>0&&(s.wtIssued||0)===0&&(
                      <button onClick={()=>openModal("transfer",s)} style={{ ...css.btn.sm,background:"transparent",color:T.textMid,border:`1px solid ${T.border}`,fontSize:10 }}>Transfer</button>
                    )}
                    {canIssue&&s.status==="allocated"&&s.clientInspStatus==="approved"&&(
                      <button onClick={()=>openModal("issue",s)} style={{ ...css.btn.sm,background:"#2D1B69",color:"#A78BFA",border:"1px solid #A78BFA",fontSize:10 }}>Issue</button>
                    )}
                    {canIssue&&s.status==="issued"&&(
                      <button onClick={()=>openModal("offcut",s)} style={{ ...css.btn.sm,background:"#0D3340",color:"#22D3EE",border:"1px solid #22D3EE",fontSize:10 }}>Off-cut</button>
                    )}
                    {(s.issues||[]).length>0&&(
                      <button onClick={e=>{e.stopPropagation();const iss=s.issues[s.issues.length-1];setMForm({issNoteNo:iss.issueNoteNo,issEntry:iss,lotSnap:s,contractorName:iss.issuedTo});setModal("print");}} style={{ ...css.btn.sm,background:"transparent",color:T.textMid,border:`1px solid ${T.border}`,fontSize:10 }}>ISN↗</button>
                    )}
                  </div>
                </TD>
              </tr>
              {expandedId===s.id&&(
                <tr>
                  <td colSpan={18} style={{ background:`${T.accent}08`,padding:"12px 20px",borderBottom:`1px solid ${T.border}` }}>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:12 }}>
                      {[["PO",s.poId||"—"],["GRN",s.grnId||"—"],["Received",fmt.date(s.receivedDate)],["Bay",s.bayId||"—"],["Heat No",s.heatNo||"—"],["Batch No",s.batchNo||"—"],["Item Code",s.itemCode||"—"],["Off-cut",s.isOffcut?`Yes${s.parentLotId?" — parent: "+s.parentLotId:""}` :"No"]].map(([k,v])=>(
                        <div key={k}><div style={css.label}>{k}</div><div style={{ fontSize:12,color:T.text,fontFamily:T.fontMono }}>{v}</div></div>
                      ))}
                    </div>
                    {(s.qcHoldReason||s.status==="qc_hold")&&<div style={{ background:T.amberBg,border:`1px solid ${T.amber}`,borderRadius:6,padding:"6px 10px",fontSize:12,color:T.amber,marginBottom:10 }}>🔒 Hold reason: {s.qcHoldReason||"Pending QC inspection"}</div>}
                    {(s.allocations||[]).length>0&&(
                      <div style={{ marginBottom:12 }}>
                        <div style={{ fontSize:11,fontWeight:700,color:T.textMid,marginBottom:6,letterSpacing:"0.05em" }}>ALLOCATIONS</div>
                        <table style={{ width:"100%",fontSize:11,borderCollapse:"collapse" }}>
                          <thead><tr>{["Order","Drawing","Mark No","Weight (kg)","Reserved By","Date","Status"].map(h=><th key={h} style={{ textAlign:"left",padding:"3px 8px",color:T.textMid,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                          <tbody>{(s.allocations||[]).map((a,i)=>(
                            <tr key={i}><td style={{ padding:"4px 8px",fontFamily:T.fontMono }}>{a.orderId}</td><td style={{ padding:"4px 8px" }}>{a.drawingNo||a.drawingId||"—"}</td><td style={{ padding:"4px 8px",fontFamily:T.fontMono }}>{a.markNo||"—"}</td><td style={{ padding:"4px 8px",fontFamily:T.fontMono }}>{fmt.num(a.wt)}</td><td style={{ padding:"4px 8px" }}>{a.reservedBy||"—"}</td><td style={{ padding:"4px 8px" }}>{a.reservedDate||"—"}</td><td style={{ padding:"4px 8px" }}><Badge color={a.status==="issued"?"purple":a.status==="consumed"?"gray":"blue"}>{a.status||"allocated"}</Badge></td></tr>
                          ))}</tbody>
                        </table>
                      </div>
                    )}
                    {(s.issues||[]).length>0&&(
                      <div style={{ marginBottom:12 }}>
                        <div style={{ fontSize:11,fontWeight:700,color:T.textMid,marginBottom:6,letterSpacing:"0.05em" }}>ISSUE HISTORY</div>
                        <table style={{ width:"100%",fontSize:11,borderCollapse:"collapse" }}>
                          <thead><tr>{["ISN No","Date","Issued To","Order","Weight (kg)","DXF"].map(h=><th key={h} style={{ textAlign:"left",padding:"3px 8px",color:T.textMid,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                          <tbody>{(s.issues||[]).map((iss,i)=>(
                            <tr key={i}><td style={{ padding:"4px 8px",fontFamily:T.fontMono,color:T.accent }}>{iss.issueNoteNo}</td><td style={{ padding:"4px 8px" }}>{iss.issueDate}</td><td style={{ padding:"4px 8px" }}>{iss.issuedTo}</td><td style={{ padding:"4px 8px",fontFamily:T.fontMono }}>{iss.orderId}</td><td style={{ padding:"4px 8px",fontFamily:T.fontMono }}>{fmt.num(iss.wt)}</td><td style={{ padding:"4px 8px" }}>{iss.dxfLink?<a href={iss.dxfLink} target="_blank" rel="noreferrer" style={{ color:T.accent }}>DXF↗</a>:"—"}</td></tr>
                          ))}</tbody>
                        </table>
                      </div>
                    )}
                    {(s.auditLog||[]).length>0&&(
                      <div>
                        <div style={{ fontSize:11,fontWeight:700,color:T.textMid,marginBottom:6,letterSpacing:"0.05em" }}>AUDIT LOG</div>
                        {[...(s.auditLog||[])].reverse().map((e,i)=>(
                          <div key={i} style={{ fontSize:11,color:T.textLow,display:"flex",gap:10,marginBottom:3 }}>
                            <span style={{ color:T.accent,fontFamily:T.fontMono,minWidth:90 }}>{e.date}</span>
                            <Badge color="gray">{e.action}</Badge>
                            {e.wt>0&&<span>{fmt.num(e.wt)} kg</span>}
                            {e.orderId&&<span style={{ fontFamily:T.fontMono }}>{e.orderId}</span>}
                            <span>by {e.by}</span>
                            {e.reason&&<span>· {e.reason}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          ))}
        </table>
      </div>

      {/* ALLOCATE MODAL */}
      {modal==="allocate"&&activeLot&&(
        <Modal title={`Allocate Stock — ${activeLot.lotNo}`} onClose={closeModal} width={520}>
          <div style={{ ...css.card,background:T.bg,marginBottom:14 }}>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
              {[["Mat Code",activeLot.matCode||`${activeLot.section} ${activeLot.size}`],["Grade",activeLot.grade],["Available",`${fmt.num(activeLot.wtAvailable)} kg`]].map(([k,v])=>(
                <div key={k}><div style={css.label}>{k}</div><div style={{ fontSize:12,color:T.text,fontFamily:T.fontMono }}>{v}</div></div>
              ))}
            </div>
          </div>
          <Field label="Allocate to Order" required>
            <Sel value={mForm.orderId||""} onChange={e=>setMForm(f=>({...f,orderId:e.target.value,drawingId:"",markNo:"",wt:""}))}>
              <option value="">Select order...</option>
              {orders.map(o=><option key={o.id} value={o.id}>{o.id} — {o.projectDesc}</option>)}
            </Sel>
          </Field>
          {mForm.orderId&&(
            <Field label="Drawing">
              <Sel value={mForm.drawingId||""} onChange={e=>setMForm(f=>({...f,drawingId:e.target.value,markNo:"",wt:""}))}>
                <option value="">Select drawing...</option>
                {(orders.find(o=>o.id===mForm.orderId)?.drawings||[]).map(d=><option key={d.id} value={d.id}>{d.drawingNo} — {d.title}</option>)}
              </Sel>
            </Field>
          )}
          {mForm.drawingId&&(
            <Field label="Mark No (Part)">
              <Sel value={mForm.markNo||""} onChange={e=>{
                const p=(orders.find(o=>o.id===mForm.orderId)?.drawings?.find(d=>d.id===mForm.drawingId)?.parts||[]).find(x=>x.markNo===e.target.value);
                setMForm(f=>({...f,markNo:e.target.value,wt:p?(p.calcTotalWt||p.clientTotalWt||0):""}));
              }}>
                <option value="">Select part...</option>
                {(orders.find(o=>o.id===mForm.orderId)?.drawings?.find(d=>d.id===mForm.drawingId)?.parts||[]).map(p=>(
                  <option key={p.markNo} value={p.markNo}>{p.markNo} — {p.matCode||p.section} — {fmt.num(p.calcTotalWt||p.clientTotalWt||0)} kg</option>
                ))}
              </Sel>
            </Field>
          )}
          <Field label="Weight to Allocate (kg)" required>
            <Input type="number" value={mForm.wt||""} onChange={e=>setMForm(f=>({...f,wt:e.target.value}))} max={activeLot.wtAvailable} placeholder={`Max ${fmt.num(activeLot.wtAvailable)} kg`} />
          </Field>
          <InfoBanner color="blue">Partial allocation supported. Remaining weight stays available for other orders.</InfoBanner>
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
            <button onClick={closeModal} style={css.btn.secondary}>Cancel</button>
            <button onClick={saveAlloc} style={css.btn.primary}>Allocate Stock</button>
          </div>
        </Modal>
      )}

      {/* RELEASE MODAL */}
      {modal==="release"&&activeLot&&(
        <Modal title={`Release Allocation — ${activeLot.lotNo}`} onClose={closeModal} width={480}>
          <Field label="Select Allocation to Release" required>
            <Sel value={mForm.allocIdx!==undefined?String(mForm.allocIdx):""} onChange={e=>setMForm(f=>({...f,allocIdx:e.target.value}))}>
              <option value="">Select allocation...</option>
              {(activeLot.allocations||[]).map((a,i)=>(
                <option key={i} value={i}>{a.orderId} — {a.markNo||a.drawingId||"—"} — {fmt.num(a.wt)} kg</option>
              ))}
            </Sel>
          </Field>
          {(activeLot.wtIssued||0)>0&&<InfoBanner color="amber">⚠ {fmt.num(activeLot.wtIssued)} kg already issued — physical return required before releasing.</InfoBanner>}
          <Field label="Reason" required>
            <Input value={mForm.reason||""} onChange={e=>setMForm(f=>({...f,reason:e.target.value}))} placeholder="Reason for releasing allocation..." />
          </Field>
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
            <button onClick={closeModal} style={css.btn.secondary}>Cancel</button>
            <button onClick={saveRelease} style={css.btn.amber}>Release Allocation</button>
          </div>
        </Modal>
      )}

      {/* TRANSFER MODAL */}
      {modal==="transfer"&&activeLot&&(
        <Modal title={`Transfer Allocation — ${activeLot.lotNo}`} onClose={closeModal} width={520}>
          {(activeLot.wtIssued||0)>0
            ?<InfoBanner color="red">Cannot transfer — {fmt.num(activeLot.wtIssued)} kg already issued. Recall material first.</InfoBanner>
            :<>
              <Field label="Allocation to Transfer" required>
                <Sel value={mForm.allocIdx!==undefined?String(mForm.allocIdx):""} onChange={e=>setMForm(f=>({...f,allocIdx:e.target.value,newOrderId:"",newDrawingId:""}))}>
                  <option value="">Select allocation...</option>
                  {(activeLot.allocations||[]).map((a,i)=>(
                    <option key={i} value={i}>{a.orderId} — {fmt.num(a.wt)} kg</option>
                  ))}
                </Sel>
              </Field>
              <Field label="Transfer to Order" required>
                <Sel value={mForm.newOrderId||""} onChange={e=>setMForm(f=>({...f,newOrderId:e.target.value,newDrawingId:""}))}>
                  <option value="">Select order...</option>
                  {orders.filter(o=>o.id!==activeLot.allocations?.[+mForm.allocIdx]?.orderId).map(o=><option key={o.id} value={o.id}>{o.id} — {o.projectDesc}</option>)}
                </Sel>
              </Field>
              {mForm.newOrderId&&(
                <Field label="New Drawing">
                  <Sel value={mForm.newDrawingId||""} onChange={e=>setMForm(f=>({...f,newDrawingId:e.target.value}))}>
                    <option value="">Select drawing...</option>
                    {(orders.find(o=>o.id===mForm.newOrderId)?.drawings||[]).map(d=><option key={d.id} value={d.id}>{d.drawingNo} — {d.title}</option>)}
                  </Sel>
                </Field>
              )}
              {mtcDivWarn&&(
                <InfoBanner color="amber">
                  ⚠ MTC diversion: material was received for a different client. TPI inspector may require re-inspection.
                  <div style={{ marginTop:8 }}>
                    <label style={{ display:"flex",alignItems:"center",gap:6,cursor:"pointer" }}>
                      <input type="checkbox" checked={!!mForm.mtcOverride} onChange={e=>setMForm(f=>({...f,mtcOverride:e.target.checked}))} />
                      <span style={{ fontSize:12 }}>I confirm diversion and accept MTC re-inspection risk</span>
                    </label>
                  </div>
                </InfoBanner>
              )}
              <Field label="Reason" required>
                <Input value={mForm.reason||""} onChange={e=>setMForm(f=>({...f,reason:e.target.value}))} placeholder="Reason for transferring..." />
              </Field>
              <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
                <button onClick={closeModal} style={css.btn.secondary}>Cancel</button>
                <button onClick={saveTransfer} disabled={mtcDivWarn&&!mForm.mtcOverride} style={{ ...css.btn.primary,opacity:mtcDivWarn&&!mForm.mtcOverride?0.5:1 }}>Transfer Stock</button>
              </div>
            </>
          }
        </Modal>
      )}

      {/* ISSUE MODAL */}
      {modal==="issue"&&activeLot&&(
        <Modal title={`Issue Material — ${activeLot.lotNo}`} onClose={closeModal} width={540}>
          <div style={{ ...css.card,background:T.bg,marginBottom:14 }}>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              {[["Item Code",activeLot.itemCode||activeLot.matCode||"—"],["Batch No",activeLot.batchNo],["Heat No",activeLot.heatNo||"—"],["Allocated",`${fmt.num(activeLot.wtAllocated)} kg`]].map(([k,v])=>(
                <div key={k}><div style={css.label}>{k}</div><div style={{ fontSize:12,color:T.text,fontFamily:T.fontMono }}>{v}</div></div>
              ))}
            </div>
          </div>
          {(activeLot.allocations||[]).length>0&&(
            <div style={{ ...css.card,background:T.bg,marginBottom:14,padding:10 }}>
              <div style={{ fontSize:10,color:T.textMid,fontWeight:700,marginBottom:6 }}>ALLOCATED TO</div>
              {activeLot.allocations.map((a,i)=>(
                <div key={i} style={{ display:"flex",gap:8,fontSize:11,color:T.textLow,marginBottom:3 }}>
                  <span style={{ fontFamily:T.fontMono,color:T.text }}>{a.orderId}</span>
                  {a.drawingNo&&<span>{a.drawingNo}</span>}
                  {a.markNo&&<span style={{ fontFamily:T.fontMono }}>{a.markNo}</span>}
                  <span style={{ color:T.accent }}>{fmt.num(a.wt)} kg</span>
                </div>
              ))}
            </div>
          )}
          <Field label="Issue to Contractor" required>
            <Sel value={mForm.contractorId||""} onChange={e=>setMForm(f=>({...f,contractorId:e.target.value}))}>
              <option value="">Select contractor...</option>
              {(contractors||[]).filter(c=>c.active).map(c=><option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </Sel>
          </Field>
          <Field label="Order" required>
            <Sel value={mForm.orderId||activeLot.allocations?.[0]?.orderId||""} onChange={e=>setMForm(f=>({...f,orderId:e.target.value}))}>
              <option value="">Select order...</option>
              {orders.map(o=><option key={o.id} value={o.id}>{o.id} — {o.projectDesc}</option>)}
            </Sel>
          </Field>
          <Field label="DXF Cutting Layout (Drive link)">
            <Input value={mForm.dxfLink||""} onChange={e=>setMForm(f=>({...f,dxfLink:e.target.value}))} placeholder="https://drive.google.com/..." />
          </Field>
          <Field label="Weight to Issue (kg)" required>
            <Input type="number" value={mForm.wt||String(activeLot.wtAllocated)} onChange={e=>setMForm(f=>({...f,wt:e.target.value}))} max={activeLot.wtAllocated} placeholder={`Max ${fmt.num(activeLot.wtAllocated)} kg`} />
          </Field>
          <InfoBanner color="blue">Issue note number will be auto-generated on confirm.</InfoBanner>
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
            <button onClick={closeModal} style={css.btn.secondary}>Cancel</button>
            <button onClick={saveIssue} style={{ ...css.btn.primary,background:"#4C1D95",border:"1px solid #A78BFA" }}>Issue & Generate ISN</button>
          </div>
        </Modal>
      )}

      {/* OFF-CUT MODAL */}
      {modal==="offcut"&&activeLot&&(
        <Modal title={`Record Off-cut — ${activeLot.lotNo}`} onClose={closeModal} width={460}>
          <InfoBanner color="blue">Off-cut inherits QC approval and batch number from parent lot. No re-inspection required.</InfoBanner>
          <Field label="Consumed Weight (kg)" required>
            <Input type="number" value={mForm.consumedWt||""} onChange={e=>setMForm(f=>({...f,consumedWt:e.target.value}))} placeholder="Weight cut/processed..." />
          </Field>
          <Field label="Off-cut Remaining Weight (kg)" required>
            <Input type="number" value={mForm.offcutWt||""} onChange={e=>setMForm(f=>({...f,offcutWt:e.target.value}))} placeholder="Min 5 kg to record as off-cut..." />
          </Field>
          <Field label={activeLot.section==="PLATE"?"Off-cut Dimensions (LxW mm)":"Off-cut Length (mm)"}>
            {activeLot.section==="PLATE"
              ?<Input value={mForm.offcutDim||""} onChange={e=>setMForm(f=>({...f,offcutDim:e.target.value}))} placeholder="e.g. 1300X400" />
              :<Input type="number" value={mForm.offcutLength||""} onChange={e=>setMForm(f=>({...f,offcutLength:e.target.value,offcutDim:e.target.value}))} placeholder="e.g. 2340" />
            }
          </Field>
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
            <button onClick={closeModal} style={css.btn.secondary}>Cancel</button>
            <button onClick={saveOffcut} style={{ ...css.btn.primary,background:"#0D3340",border:"1px solid #22D3EE",color:"#22D3EE" }}>Create Off-cut Lot</button>
          </div>
        </Modal>
      )}

      {/* PRINT ISN MODAL */}
      {modal==="print"&&mForm.issEntry&&(
        <Modal title={`Issue Note — ${mForm.issNoteNo||""}`} onClose={closeModal} width={680}>
          <div style={{ background:"#fff",color:"#000",padding:32,borderRadius:8,fontFamily:"Georgia,serif",fontSize:13 }}>
            <div style={{ textAlign:"center",marginBottom:20 }}>
              <div style={{ fontSize:20,fontWeight:700 }}>MATERIAL ISSUE NOTE</div>
              <div style={{ fontSize:14,marginTop:4 }}>Structo Fabrication Works</div>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16 }}>
              <div><strong>Issue Note No:</strong> {mForm.issNoteNo}</div>
              <div><strong>Date:</strong> {mForm.issEntry?.issueDate}</div>
              <div><strong>Store Officer:</strong> {mForm.issEntry?.issuedBy}</div>
              <div><strong>Issued To:</strong> {mForm.contractorName||mForm.issEntry?.issuedTo}</div>
            </div>
            <div style={{ borderTop:"1px solid #ccc",paddingTop:12,marginBottom:12 }}>
              <div style={{ fontWeight:700,marginBottom:8 }}>MATERIAL DETAILS</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                <div><strong>Item Code:</strong> {mForm.lotSnap?.itemCode||mForm.lotSnap?.matCode||"—"}</div>
                <div><strong>Lot No:</strong> {mForm.lotSnap?.lotNo}</div>
                <div><strong>Batch No:</strong> {mForm.lotSnap?.batchNo}</div>
                <div><strong>Heat No:</strong> {mForm.lotSnap?.heatNo||"—"}</div>
                <div><strong>Weight Issued:</strong> {fmt.num(mForm.issEntry?.wt)} kg</div>
                <div><strong>Bay:</strong> {mForm.lotSnap?.bayId}</div>
              </div>
            </div>
            <div style={{ borderTop:"1px solid #ccc",paddingTop:12,marginBottom:20 }}>
              <div style={{ fontWeight:700,marginBottom:8 }}>AGAINST ORDER / DRAWING</div>
              <div><strong>Order:</strong> {mForm.issEntry?.orderId||"—"}</div>
              <div style={{ marginTop:4 }}><strong>Drawing:</strong> {mForm.issEntry?.drawingNo||mForm.issEntry?.drawingId||"—"}</div>
              {mForm.issEntry?.dxfLink&&<div style={{ marginTop:4 }}><strong>DXF Layout:</strong> {mForm.issEntry.dxfLink}</div>}
            </div>
            <div style={{ borderTop:"1px solid #ccc",paddingTop:24,display:"grid",gridTemplateColumns:"1fr 1fr",gap:60 }}>
              <div><div style={{ borderTop:"1px solid #000",paddingTop:4,marginTop:48 }}>Issued By (Store Officer)</div></div>
              <div><div style={{ borderTop:"1px solid #000",paddingTop:4,marginTop:48 }}>Received By (Contractor)</div></div>
            </div>
          </div>
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end",marginTop:14 }}>
            <button onClick={closeModal} style={css.btn.secondary}>Close</button>
            <button onClick={()=>window.print()} style={css.btn.primary}>🖨 Print Issue Note</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLS MODULE
// ═══════════════════════════════════════════════════════════════════════════════

// FFD (First Fit Decreasing) 1-D cutting algorithm
const runFFD = (parts, stockBars, kerfMm) => {
  const kerf = kerfMm || 3;
  const pieces = [];
  parts.forEach(p => { for (let i=0;i<(+p.qty||0);i++) pieces.push({markNo:p.markNo,length:+p.length}); });
  pieces.sort((a,b) => b.length - a.length);
  const bars = [];
  stockBars.forEach(s => { for (let i=0;i<(+s.qty||1);i++) bars.push({label:s.label,length:+s.length,rem:+s.length,cuts:[]}); });
  bars.sort((a,b) => a.length - b.length); // off-cuts (shorter) first
  const plan = [];
  for (const piece of pieces) {
    let placed = false;
    for (const bar of plan) {
      const needed = piece.length + (bar.cuts.length>0?kerf:0);
      if (bar.rem >= needed) { bar.rem -= needed; bar.cuts.push(piece); placed = true; break; }
    }
    if (!placed) {
      const next = bars.shift();
      if (!next) { plan.push({label:"INSUFFICIENT STOCK",length:0,rem:0,cuts:[piece],insufficient:true}); continue; }
      next.rem -= piece.length; next.cuts.push(piece); plan.push(next);
    }
  }
  return plan;
};

// ── Excel helpers (dynamic import of xlsx so it only loads when needed) ──────
const parseXlsxParts = async (file, colDefs) => {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  if (!rows.length) throw new Error("Empty sheet");
  // find first row that looks like a header (>=2 non-empty cells)
  let hdrIdx = 0;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    if (rows[i].filter(c => String(c).trim()).length >= 2) { hdrIdx = i; break; }
  }
  const hdrs = rows[hdrIdx].map(h => String(h).trim().toLowerCase());
  const colMap = {};
  colDefs.forEach(def => {
    const idx = hdrs.findIndex(h => def.headers.includes(h));
    if (idx >= 0) colMap[def.key] = idx;
  });
  const missing = colDefs.filter(d => d.required && !(d.key in colMap)).map(d => d.label);
  if (missing.length) throw new Error(`Missing columns: ${missing.join(", ")}`);
  return rows.slice(hdrIdx + 1)
    .filter(r => r.some(c => String(c).trim()))
    .map(r => {
      const obj = {};
      colDefs.forEach(def => { obj[def.key] = colMap[def.key] !== undefined ? String(r[colMap[def.key]] ?? "").trim() : ""; });
      return obj;
    });
};

const downloadXlsxTemplate = async (headers, filename) => {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Parts");
  XLSX.writeFile(wb, filename);
};

const ToolsModule = ({ user, orders, materials, nestingRuns, setNestingRuns }) => {
  const [tool, setTool] = useState("weight");
  const bcFileRef = useRef(null);
  const paFileRef = useRef(null);
  const [bcXlsxErr, setBcXlsxErr] = useState(null);
  const [paXlsxErr, setPaXlsxErr] = useState(null);

  // ── Tool 1: Weight Calculator ─────────────────────────────────────────────
  const [wcMatId, setWcMatId]   = useState("");
  const [wcLength, setWcLength] = useState("");
  const [wcWeight, setWcWeight] = useState("");
  const wcMat = (materials||[]).find(m=>m.id===wcMatId);
  const wcResultFwd = wcMat && wcLength ? (
    wcMat.isPlate
      ? `${(+wcLength/1000*(wcMat.wtPerM2||0)).toFixed(3)} kg  (per metre width)`
      : `${((+wcLength/1000)*(wcMat.wtPerMetre||0)).toFixed(3)} kg`
  ) : null;
  const wcResultRev = wcMat && wcWeight ? (
    wcMat.isPlate ? null : `${((+wcWeight/(wcMat.wtPerMetre||1))*1000).toFixed(0)} mm`
  ) : null;

  // ── Tool 2: Bar Cutting Calculator ───────────────────────────────────────
  const [bcMatId, setBcMatId] = useState("");
  const [bcParts, setBcParts] = useState([{markNo:"P1",length:"",qty:"1"}]);
  const [bcStock, setBcStock] = useState([{label:"",length:"",qty:"1"}]);
  const [bcKerf, setBcKerf]   = useState("3");
  const [bcPlan, setBcPlan]   = useState(null);
  const bcMat = (materials||[]).find(m=>m.id===bcMatId);
  const bcLibStdLengths = bcMat && !bcMat.isPlate ? (bcMat.standardLengths||[]) : [];

  const runBarCalc = () => {
    const parts = bcParts.filter(p=>p.markNo&&+p.length>0&&+p.qty>0);
    const stock = bcStock.filter(s=>+s.length>0&&+s.qty>0).map(s=>({...s,label:s.label||`${s.length}mm`}));
    if (!parts.length||!stock.length) return;
    setBcPlan(runFFD(parts,stock,+bcKerf));
  };

  const bcSummary = bcPlan ? {
    barsUsed: bcPlan.length,
    totalCut: bcPlan.reduce((a,b)=>a+b.cuts.reduce((x,c)=>x+c.length,0),0),
    totalWaste: bcPlan.reduce((a,b)=>a+(b.rem||0),0),
    utilPct: (() => { const tot=bcPlan.reduce((a,b)=>a+b.length,0); return tot>0?((tot-bcPlan.reduce((a,b)=>a+(b.rem||0),0))/tot*100):0; })(),
  } : null;

  const BC_COLS = [
    { key:"markNo", label:"Mark No",     headers:["mark no","markno","mark","part","part no"], required:false },
    { key:"length", label:"Length (mm)", headers:["length (mm)","length(mm)","length mm","length","l (mm)","l(mm)","l mm","l"], required:true },
    { key:"qty",    label:"Qty",         headers:["qty","quantity","no.","nos","count"], required:true },
  ];
  const handleBcXlsx = async (e) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    try {
      setBcXlsxErr(null);
      const rows = await parseXlsxParts(file, BC_COLS);
      if (!rows.length) { setBcXlsxErr("No data rows found in sheet."); return; }
      setBcParts(rows.map((r,i) => ({ markNo: r.markNo || `P${i+1}`, length: r.length, qty: r.qty || "1" })));
      setBcPlan(null);
    } catch(err) { setBcXlsxErr(err.message); }
  };

  // ── Tool 3: Plate Area Estimator ─────────────────────────────────────────
  const [paMatId, setPaMatId] = useState("");
  const [paParts, setPaParts] = useState([{markNo:"",length:"",width:"",qty:"1"}]);
  const [paSheets, setPaSheets] = useState([{label:"",length:"",width:"",qty:"1"}]);
  const [paKerf, setPaKerf] = useState("3");
  const paMat = (materials||[]).find(m=>m.id===paMatId);
  const paTotalArea = paParts.reduce((a,p)=>{
    const kf = +paKerf/1000;
    return a + ((+p.length/1000+kf)*(+p.width/1000+kf)*(+p.qty||1));
  },0);
  const paSheetArea = paSheets.reduce((a,s)=>a+(+s.length/1000)*(+s.width/1000)*(+s.qty||1),0);
  const paUtil = paSheetArea>0 ? Math.min(100,(paTotalArea/paSheetArea)*100).toFixed(1) : "—";
  const paWasteArea = Math.max(0,paSheetArea-paTotalArea);
  const paWasteKg = paMat && !paMat.isPlate ? 0 : paMat ? paWasteArea*(paMat.wtPerM2||0) : 0;

  const PA_COLS = [
    { key:"markNo", label:"Mark No",     headers:["mark no","markno","mark","part","part no"], required:false },
    { key:"length", label:"Length (mm)", headers:["length (mm)","length(mm)","length mm","length","l (mm)","l(mm)","l mm","l"], required:true },
    { key:"width",  label:"Width (mm)",  headers:["width (mm)","width(mm)","width mm","width","w (mm)","w(mm)","w mm","w"], required:true },
    { key:"qty",    label:"Qty",         headers:["qty","quantity","no.","nos","count"], required:true },
  ];
  const handlePaXlsx = async (e) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    try {
      setPaXlsxErr(null);
      const rows = await parseXlsxParts(file, PA_COLS);
      if (!rows.length) { setPaXlsxErr("No data rows found in sheet."); return; }
      setPaParts(rows.map((r,i) => ({ markNo: r.markNo || `P${i+1}`, length: r.length, width: r.width, qty: r.qty || "1" })));
    } catch(err) { setPaXlsxErr(err.message); }
  };

  // ── Tool 4: Nesting Bridge ────────────────────────────────────────────────
  const [nbOrderIds, setNbOrderIds] = useState([]);
  const [nbForm, setNbForm] = useState({});
  const [nbDone, setNbDone] = useState(null);
  const saveNbRun = () => {
    const yr = new Date().getFullYear();
    let max=0;
    (nestingRuns||[]).forEach(r=>{const m=(r.id||"").match(/^NEST-(\d{4})-(\d+)$/);if(m&&+m[1]===yr)max=Math.max(max,+m[2]);});
    const id=`NEST-${yr}-${String(max+1).padStart(3,"0")}`;
    const run={id,runDate:today(),runBy:user.name,materialCode:nbForm.materialCode||"",orders:nbOrderIds,drawings:[],lotsUsed:[],sheetsOrBarsUsed:+(nbForm.sheets||0),utilisationPct:+(nbForm.util||0),wasteKg:+(nbForm.waste||0),offcutsCreated:[],dxfLink:nbForm.dxfLink||"",status:"confirmed",parts:[]};
    setNestingRuns(prev=>[...prev,run]);
    setNbDone(id); setNbOrderIds([]); setNbForm({});
  };

  // ── Tool 5: Joint Approval Manager ───────────────────────────────────────
  const canApproveJoint = ["super_admin","planning_admin","qc_admin"].includes(user.role);
  const allJointParts = orders.flatMap(o=>
    o.parts.filter(p=>p.jointApprovalStatus==="requested"||p.jointApprovalStatus==="approved")
          .map(p=>({...p,orderId:o.id,orderDesc:o.projectDesc}))
  );

  const updateJointPart = (orderId, partId, updates) => {
    // This would need setOrders — not passed here. Show read-only for now.
    // (Will be wired in Step 11/12 or when setOrders is passed)
  };

  const toolTabs = [
    ["weight","⚖ Weight Calc"],
    ["bar","📏 Bar Cutting"],
    ["plate","▭ Plate Estimator"],
    ["nesting","🔗 Nesting Bridge"],
    ["joints","🔩 Joint Approval"],
  ];

  return (
    <div>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:20, fontWeight:800, color:T.text }}>Tools</div>
        <div style={{ fontSize:12, color:T.textMid }}>Calculation utilities · Nesting bridge · Joint approval · All roles</div>
      </div>

      <div style={{ display:"flex", gap:2, marginBottom:20, borderBottom:`1px solid ${T.border}` }}>
        {toolTabs.map(([t,lbl])=>(
          <button key={t} onClick={()=>setTool(t)} style={{ ...css.btn.ghost, padding:"8px 14px", fontSize:12, fontWeight:tool===t?700:400, color:tool===t?T.accent:T.textMid, borderBottom:tool===t?`2px solid ${T.accent}`:"2px solid transparent", borderRadius:0 }}>{lbl}</button>
        ))}
      </div>

      {/* ─────────────────────────── WEIGHT CALCULATOR ──────────────────────── */}
      {tool==="weight" && (
        <div style={{ maxWidth:520 }}>
          <SectionHd title="Weight Calculator" sub="Section weight from length · or reverse: length from weight" />
          <Field label="Material">
            <Sel value={wcMatId} onChange={e=>setWcMatId(e.target.value)}>
              <option value="">Select material...</option>
              {(materials||[]).filter(m=>m.active&&!m.isPlate).map(m=><option key={m.id} value={m.id}>{m.sectionType} {m.size} — {m.grade} ({m.wtPerMetre} kg/m)</option>)}
            </Sel>
          </Field>
          {wcMat && (
            <div style={{ ...css.card, background:T.bg, marginBottom:14, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
              {[["Type",wcMat.sectionType],["Grade",wcMat.grade],["Wt/m",`${wcMat.wtPerMetre} kg/m`]].map(([k,v])=>(
                <div key={k}><div style={css.label}>{k}</div><div style={{ fontSize:12, color:T.text, fontFamily:T.fontMono }}>{v}</div></div>
              ))}
            </div>
          )}
          <div style={{ ...css.card, marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.textMid, marginBottom:10 }}>LENGTH → WEIGHT</div>
            <Field label="Length (mm)">
              <Input type="number" value={wcLength} onChange={e=>setWcLength(e.target.value)} placeholder="e.g. 6000" />
            </Field>
            {wcResultFwd && <div style={{ fontSize:18, fontWeight:700, color:T.green, fontFamily:T.fontMono, marginTop:8 }}>{wcResultFwd}</div>}
          </div>
          <div style={{ ...css.card }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.textMid, marginBottom:10 }}>WEIGHT → LENGTH</div>
            <Field label="Weight (kg)">
              <Input type="number" value={wcWeight} onChange={e=>setWcWeight(e.target.value)} placeholder="e.g. 53.76" />
            </Field>
            {wcResultRev && <div style={{ fontSize:18, fontWeight:700, color:T.accent, fontFamily:T.fontMono, marginTop:8 }}>{wcResultRev} mm</div>}
          </div>
        </div>
      )}

      {/* ─────────────────────────── BAR CUTTING CALCULATOR ────────────────── */}
      {tool==="bar" && (
        <div>
          <SectionHd title="Bar / Section Cutting Calculator" sub="1D cutting optimisation · First Fit Decreasing algorithm" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
            <div style={css.card}>
              <div style={{ fontSize:12, fontWeight:700, color:T.textMid, marginBottom:10 }}>MATERIAL & SETTINGS</div>
              <Field label="Material">
                <Sel value={bcMatId} onChange={e=>{setBcMatId(e.target.value);setBcPlan(null);const m=(materials||[]).find(x=>x.id===e.target.value);if(m&&(m.standardLengths||[]).length) setBcStock(m.standardLengths.map(l=>({label:`${l}mm std`,length:String(l),qty:"1"})));}} >
                  <option value="">Select section...</option>
                  {(materials||[]).filter(m=>m.active&&!m.isPlate).map(m=><option key={m.id} value={m.id}>{m.sectionType} {m.size} ({m.wtPerMetre} kg/m)</option>)}
                </Sel>
              </Field>
              <Field label="Kerf Width (mm)">
                <Input type="number" value={bcKerf} onChange={e=>setBcKerf(e.target.value)} style={{ width:100 }} />
              </Field>
            </div>
            <div style={css.card}>
              <div style={{ fontSize:12, fontWeight:700, color:T.textMid, marginBottom:10 }}>AVAILABLE STOCK</div>
              {bcStock.map((s,i)=>(
                <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr auto auto auto", gap:6, marginBottom:6, alignItems:"center" }}>
                  <Input value={s.label} onChange={e=>setBcStock(st=>st.map((x,j)=>j===i?{...x,label:e.target.value}:x))} placeholder="Label (e.g. 12m std)" style={{ fontSize:11 }} />
                  <Input type="number" value={s.length} onChange={e=>setBcStock(st=>st.map((x,j)=>j===i?{...x,length:e.target.value}:x))} placeholder="mm" style={{ width:70, fontSize:11 }} />
                  <Input type="number" value={s.qty} onChange={e=>setBcStock(st=>st.map((x,j)=>j===i?{...x,qty:e.target.value}:x))} placeholder="Qty" style={{ width:50, fontSize:11 }} />
                  <button onClick={()=>setBcStock(st=>st.filter((_,j)=>j!==i))} style={{ ...css.btn.ghost, color:T.red, fontSize:14, padding:"2px 6px" }}>✕</button>
                </div>
              ))}
              <button onClick={()=>setBcStock(s=>[...s,{label:"",length:"",qty:"1"}])} style={{ ...css.btn.secondary, fontSize:11, padding:"4px 10px" }}>+ Add Length</button>
            </div>
          </div>

          <div style={{ ...css.card, marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.textMid }}>PARTS TO CUT</div>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <button onClick={()=>downloadXlsxTemplate(["Mark No","Length (mm)","Qty"],"bar_cutting_template.xlsx")} style={{ ...css.btn.ghost, fontSize:11, padding:"4px 10px", color:T.textMid }}>↓ Template</button>
                <input ref={bcFileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display:"none" }} onChange={handleBcXlsx} />
                <button onClick={()=>bcFileRef.current?.click()} style={{ ...css.btn.secondary, fontSize:11, padding:"4px 10px" }}>📤 Upload Excel</button>
                <button onClick={()=>setBcParts(p=>[...p,{markNo:"",length:"",qty:"1"}])} style={{ ...css.btn.secondary, fontSize:11, padding:"4px 10px" }}>+ Add Part</button>
              </div>
            </div>
            {bcXlsxErr && <div style={{ fontSize:11, color:T.red, marginBottom:8, padding:"6px 10px", background:`${T.red}22`, borderRadius:4 }}>⚠ {bcXlsxErr}</div>}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 110px 60px 28px", gap:8, marginBottom:4 }}>
              {["Mark No","Length (mm)","Qty",""].map(h=><div key={h} style={{ fontSize:10, fontWeight:700, color:T.textLow, textTransform:"uppercase" }}>{h}</div>)}
            </div>
            {bcParts.map((p,i)=>(
              <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 110px 60px 28px", gap:8, marginBottom:6, alignItems:"center" }}>
                <Input value={p.markNo} onChange={e=>setBcParts(ps=>ps.map((x,j)=>j===i?{...x,markNo:e.target.value}:x))} placeholder="Mark No" style={{ fontSize:11 }} />
                <Input type="number" value={p.length} onChange={e=>setBcParts(ps=>ps.map((x,j)=>j===i?{...x,length:e.target.value}:x))} placeholder="mm" style={{ fontSize:11 }} />
                <Input type="number" value={p.qty} onChange={e=>setBcParts(ps=>ps.map((x,j)=>j===i?{...x,qty:e.target.value}:x))} placeholder="Qty" style={{ fontSize:11 }} />
                <button onClick={()=>setBcParts(ps=>ps.filter((_,j)=>j!==i))} style={{ ...css.btn.ghost, color:T.red, fontSize:14, padding:"2px 4px" }}>✕</button>
              </div>
            ))}
          </div>

          <button onClick={runBarCalc} style={css.btn.primary}>▶ Run Cutting Optimisation</button>

          {bcPlan && (
            <div style={{ marginTop:16 }}>
              <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
                <StatCard label="Bars Used" value={bcSummary.barsUsed} color={T.text} />
                <StatCard label="Utilisation" value={`${bcSummary.utilPct.toFixed(1)}%`} color={bcSummary.utilPct>=85?T.green:bcSummary.utilPct>=70?T.amber:T.red} />
                <StatCard label="Total Waste" value={`${fmt.num(Math.round(bcSummary.totalWaste))} mm`} color={T.textMid} />
                {bcMat && <StatCard label="Waste Weight" value={`${((bcSummary.totalWaste/1000)*(bcMat.wtPerMetre||0)).toFixed(1)} kg`} color={T.amber} />}
              </div>
              <div style={{ ...css.card }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.textMid, marginBottom:10 }}>CUTTING PLAN</div>
                {bcPlan.map((bar,bi)=>(
                  <div key={bi} style={{ marginBottom:10, padding:10, background:T.bg, borderRadius:6 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:bar.insufficient?T.red:T.text }}>{bar.label} ({bar.length}mm)</span>
                      <span style={{ fontSize:11, color:T.textMid }}>Rem: {fmt.num(Math.round(bar.rem))}mm · {bar.cuts.length} cuts</span>
                    </div>
                    <div style={{ display:"flex", gap:2, flexWrap:"wrap" }}>
                      {bar.cuts.map((c,ci)=>(
                        <div key={ci} style={{ background:`${T.accent}33`, border:`1px solid ${T.accent}`, borderRadius:3, padding:"2px 8px", fontSize:11, fontFamily:T.fontMono }}>{c.markNo} {fmt.num(c.length)}mm</div>
                      ))}
                      {bar.rem>3 && <div style={{ background:T.border, borderRadius:3, padding:"2px 8px", fontSize:11, color:T.textLow, fontFamily:T.fontMono }}>waste {fmt.num(Math.round(bar.rem))}mm</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────── PLATE AREA ESTIMATOR ───────────────────── */}
      {tool==="plate" && (
        <div>
          <SectionHd title="Plate Area Estimator" sub="Rectangular area packing estimate · For irregular shapes use DeepNest" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
            <div style={css.card}>
              <div style={{ fontSize:12, fontWeight:700, color:T.textMid, marginBottom:10 }}>MATERIAL & SETTINGS</div>
              <Field label="Plate Material">
                <Sel value={paMatId} onChange={e=>setPaMatId(e.target.value)}>
                  <option value="">Select plate...</option>
                  {(materials||[]).filter(m=>m.active&&m.isPlate).map(m=><option key={m.id} value={m.id}>PLATE {m.size} — {m.grade} ({m.wtPerM2} kg/m²)</option>)}
                </Sel>
              </Field>
              <Field label="Kerf Width (mm)">
                <Input type="number" value={paKerf} onChange={e=>setPaKerf(e.target.value)} style={{ width:100 }} />
              </Field>
            </div>
            <div style={css.card}>
              <div style={{ fontSize:12, fontWeight:700, color:T.textMid, marginBottom:10 }}>AVAILABLE SHEET SIZES</div>
              {paSheets.map((s,i)=>(
                <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr auto auto auto auto", gap:5, marginBottom:5, alignItems:"center" }}>
                  <Input value={s.label} onChange={e=>setPaSheets(ss=>ss.map((x,j)=>j===i?{...x,label:e.target.value}:x))} placeholder="Label" style={{ fontSize:11 }} />
                  <Input type="number" value={s.length} onChange={e=>setPaSheets(ss=>ss.map((x,j)=>j===i?{...x,length:e.target.value}:x))} placeholder="L mm" style={{ width:70, fontSize:11 }} />
                  <Input type="number" value={s.width} onChange={e=>setPaSheets(ss=>ss.map((x,j)=>j===i?{...x,width:e.target.value}:x))} placeholder="W mm" style={{ width:70, fontSize:11 }} />
                  <Input type="number" value={s.qty} onChange={e=>setPaSheets(ss=>ss.map((x,j)=>j===i?{...x,qty:e.target.value}:x))} placeholder="Qty" style={{ width:50, fontSize:11 }} />
                  <button onClick={()=>setPaSheets(ss=>ss.filter((_,j)=>j!==i))} style={{ ...css.btn.ghost, color:T.red, fontSize:14, padding:"2px 6px" }}>✕</button>
                </div>
              ))}
              <button onClick={()=>setPaSheets(s=>[...s,{label:"",length:"",width:"",qty:"1"}])} style={{ ...css.btn.secondary, fontSize:11, padding:"4px 10px" }}>+ Add Sheet</button>
            </div>
          </div>

          <div style={{ ...css.card, marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.textMid }}>PARTS (BOUNDING BOX DIMENSIONS)</div>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <button onClick={()=>downloadXlsxTemplate(["Mark No","Length (mm)","Width (mm)","Qty"],"plate_estimator_template.xlsx")} style={{ ...css.btn.ghost, fontSize:11, padding:"4px 10px", color:T.textMid }}>↓ Template</button>
                <input ref={paFileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display:"none" }} onChange={handlePaXlsx} />
                <button onClick={()=>paFileRef.current?.click()} style={{ ...css.btn.secondary, fontSize:11, padding:"4px 10px" }}>📤 Upload Excel</button>
                <button onClick={()=>setPaParts(p=>[...p,{markNo:"",length:"",width:"",qty:"1"}])} style={{ ...css.btn.secondary, fontSize:11, padding:"4px 10px" }}>+ Add Part</button>
              </div>
            </div>
            {paXlsxErr && <div style={{ fontSize:11, color:T.red, marginBottom:8, padding:"6px 10px", background:`${T.red}22`, borderRadius:4 }}>⚠ {paXlsxErr}</div>}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 90px 90px 60px 28px", gap:8, marginBottom:4 }}>
              {["Mark No","L (mm)","W (mm)","Qty",""].map(h=><div key={h} style={{ fontSize:10, fontWeight:700, color:T.textLow, textTransform:"uppercase" }}>{h}</div>)}
            </div>
            {paParts.map((p,i)=>(
              <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 90px 90px 60px 28px", gap:8, marginBottom:6, alignItems:"center" }}>
                <Input value={p.markNo} onChange={e=>setPaParts(ps=>ps.map((x,j)=>j===i?{...x,markNo:e.target.value}:x))} placeholder="Mark No" style={{ fontSize:11 }} />
                <Input type="number" value={p.length} onChange={e=>setPaParts(ps=>ps.map((x,j)=>j===i?{...x,length:e.target.value}:x))} placeholder="mm" style={{ fontSize:11 }} />
                <Input type="number" value={p.width} onChange={e=>setPaParts(ps=>ps.map((x,j)=>j===i?{...x,width:e.target.value}:x))} placeholder="mm" style={{ fontSize:11 }} />
                <Input type="number" value={p.qty} onChange={e=>setPaParts(ps=>ps.map((x,j)=>j===i?{...x,qty:e.target.value}:x))} placeholder="Qty" style={{ fontSize:11 }} />
                <button onClick={()=>setPaParts(ps=>ps.filter((_,j)=>j!==i))} style={{ ...css.btn.ghost, color:T.red, fontSize:14, padding:"2px 4px" }}>✕</button>
              </div>
            ))}
          </div>

          {paTotalArea > 0 && (
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:14 }}>
              <StatCard label="Parts Area" value={`${paTotalArea.toFixed(3)} m²`} color={T.accent} />
              <StatCard label="Stock Area" value={`${paSheetArea.toFixed(3)} m²`} color={T.text} />
              <StatCard label="Estimated Util" value={`${paUtil}%`} color={+paUtil>=70?T.green:T.amber} />
              <StatCard label="Waste Area" value={`${paWasteArea.toFixed(3)} m²`} color={T.amber} />
              {paMat && <StatCard label="Waste Weight" value={`${paWasteKg.toFixed(1)} kg`} color={T.amber} />}
            </div>
          )}
          <InfoBanner color="amber">Estimate uses bounding box area. For irregular parts use DeepNest for accurate nesting — this estimate may under-report material needed by 10–30%.</InfoBanner>
        </div>
      )}

      {/* ─────────────────────────── NESTING BRIDGE ─────────────────────────── */}
      {tool==="nesting" && (
        <div style={{ maxWidth:620 }}>
          <SectionHd title="Nesting Bridge (DeepNest Import)" sub="Record nesting results from DeepNest — creates nesting run record" />
          {nbDone
            ? <div style={{ ...css.card, background:T.greenBg, border:`1px solid ${T.green}`, textAlign:"center", padding:32 }}>
                <div style={{ fontSize:18, fontWeight:700, color:T.green, marginBottom:8 }}>✓ Nesting Run Created</div>
                <div style={{ fontFamily:T.fontMono, fontSize:20, color:T.text, marginBottom:16 }}>{nbDone}</div>
                <button onClick={()=>setNbDone(null)} style={css.btn.primary}>Create Another Run</button>
              </div>
            : <>
                <Field label="Material Code" required>
                  <Sel value={nbForm.materialCode||""} onChange={e=>setNbForm(f=>({...f,materialCode:e.target.value}))}>
                    <option value="">Select material...</option>
                    {(materials||[]).filter(m=>m.active).map(m=><option key={m.id} value={m.matCode}>{m.matCode}</option>)}
                  </Sel>
                </Field>
                <Field label="Orders Included" required>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    {orders.map(o=>(
                      <label key={o.id} style={{ display:"flex", alignItems:"center", gap:4, cursor:"pointer", fontSize:12, color:T.text }}>
                        <input type="checkbox" checked={nbOrderIds.includes(o.id)} onChange={e=>setNbOrderIds(ids=>e.target.checked?[...ids,o.id]:ids.filter(x=>x!==o.id))} />
                        {o.id}
                      </label>
                    ))}
                  </div>
                </Field>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                  <Field label="Bars / Sheets Used" required>
                    <Input type="number" value={nbForm.sheets||""} onChange={e=>setNbForm(f=>({...f,sheets:e.target.value}))} placeholder="e.g. 18" />
                  </Field>
                  <Field label="Utilisation %">
                    <Input type="number" value={nbForm.util||""} onChange={e=>setNbForm(f=>({...f,util:e.target.value}))} placeholder="e.g. 87.3" step="0.1" />
                  </Field>
                  <Field label="Waste (kg)">
                    <Input type="number" value={nbForm.waste||""} onChange={e=>setNbForm(f=>({...f,waste:e.target.value}))} placeholder="e.g. 312" />
                  </Field>
                </div>
                <Field label="DXF Cutting Layout (Drive link)">
                  <Input value={nbForm.dxfLink||""} onChange={e=>setNbForm(f=>({...f,dxfLink:e.target.value}))} placeholder="https://drive.google.com/..." />
                </Field>
                <InfoBanner color="blue">Run ID will be auto-generated as NEST-{new Date().getFullYear()}-NNN. The run will be recorded as Confirmed status.</InfoBanner>
                <button onClick={saveNbRun} disabled={!nbForm.materialCode||!nbOrderIds.length||!nbForm.sheets} style={{ ...css.btn.primary, opacity:(!nbForm.materialCode||!nbOrderIds.length||!nbForm.sheets)?0.5:1 }}>Confirm Import → Create Nesting Run</button>
              </>
          }
        </div>
      )}

      {/* ─────────────────────────── JOINT APPROVAL MANAGER ────────────────── */}
      {tool==="joints" && (
        <div>
          <SectionHd title="Joint Approval Manager" sub="Parts with joint requests pending client approval" />
          {allJointParts.length === 0
            ? <div style={{ ...css.card, textAlign:"center", padding:40, color:T.textLow }}>
                No joint approval requests found across active orders. Joint requests are created in the Drawing Part List (TabParts).
              </div>
            : <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead><tr>
                    <TH>Order</TH><TH>Drawing</TH><TH>Mark No</TH><TH>Description</TH>
                    <TH>Section / Size</TH><TH right>Length (mm)</TH>
                    <TH>Split Dims</TH><TH>Status</TH><TH>Doc Link</TH>
                    {canApproveJoint && <TH>Action</TH>}
                  </tr></thead>
                  <tbody>
                    {allJointParts.map((p,i)=>(
                      <tr key={i} style={{ background:i%2===0?"transparent":T.bg }}>
                        <TD mono>{p.orderId}</TD>
                        <TD mono>{p.drawingNo}</TD>
                        <TD mono>{p.markNo}</TD>
                        <TD>{p.desc}</TD>
                        <TD>{p.section} {p.size}</TD>
                        <TD right mono>{fmt.num(p.length)}</TD>
                        <TD mono>{(p.jointSplitDimensions||[]).join(" + ")||"—"}</TD>
                        <TD><Badge color={p.jointApprovalStatus==="approved"?"green":p.jointApprovalStatus==="rejected"?"red":"amber"}>{p.jointApprovalStatus}</Badge></TD>
                        <TD>{p.jointApprovalDoc?<a href={p.jointApprovalDoc} target="_blank" rel="noreferrer" style={{ fontSize:11, color:T.accent }}>Doc↗</a>:"—"}</TD>
                        {canApproveJoint && <TD>
                          <span style={{ fontSize:11, color:T.textLow }}>Edit in Order → Parts tab</span>
                        </TD>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const Dashboard = ({ user, pos, stock, purchaseReqs, orders }) => {
  const roleLabel = ROLES_LABEL[user.role]||user.role;
  const activePOs = pos.filter(p=>p.status!=="cancelled"&&p.status!=="fully_received");
  const pendingQC = stock.filter(s=>s.rmQcStatus==="pending");
  const clientPend = stock.filter(s=>s.rmQcStatus==="approved"&&s.clientInspStatus==="pending");
  const availStock = stock.filter(s=>s.status==="available"&&s.clientInspStatus==="approved");

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:800, color:T.text }}>Welcome back, {user.name.split(" ")[0]} 👋</div>
        <div style={{ fontSize:13, color:T.textMid }}>{roleLabel} · {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
      </div>

      <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
        <StatCard label="Active Orders" value={orders.length} sub={`${orders.filter(o=>o.status==="active").length} active`} color={T.accent} />
        <StatCard label="Open POs" value={activePOs.length} sub={`of ${pos.length} total`} color={T.gold} />
        <StatCard label="RM QC Pending" value={pendingQC.length} color={pendingQC.length>0?T.amber:T.green} />
        <StatCard label="Client Insp Pending" value={clientPend.length} sub={clientPend.length>0?"HARD GATE":""} color={clientPend.length>0?T.red:T.green} />
        <StatCard label="Available Stock Lots" value={availStock.length} color={T.green} />
        <StatCard label="Material Reqs" value={purchaseReqs.length} color={T.text} />
      </div>

      {clientPend.length>0 && (
        <InfoBanner color="red">
          🚫 <strong>HARD GATE:</strong> {clientPend.length} lot(s) awaiting client inspection — production cannot start on these materials.
          {clientPend.map(s=>` ${s.lotNo} (${s.section} ${s.size})`).join(",")}
        </InfoBanner>
      )}

      {pendingQC.length>0 && (
        <InfoBanner color="amber">
          ⚠ {pendingQC.length} lot(s) pending RM QC inspection: {pendingQC.map(s=>s.lotNo).join(", ")}
        </InfoBanner>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginTop:8 }}>
        {/* PO Status */}
        <div style={{ ...css.card }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:12 }}>Purchase Orders</div>
          {pos.map(po=>(
            <div key={po.id} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${T.border}`, alignItems:"center" }}>
              <div>
                <span style={{ fontFamily:T.fontMono, fontSize:11, color:T.accentHi }}>{po.id}</span>
                <span style={{ fontSize:11, color:T.textMid, marginLeft:8 }}>{po.vendorName.split(" ").slice(0,2).join(" ")}</span>
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <span style={{ fontSize:11, color:T.textMid, fontFamily:T.fontMono }}>{po.lines.reduce((s,l)=>s+(l.totalPrice||0),0)/1000|0}K</span>
                <Badge color={poStatusBadge[po.status]||"gray"}>{po.status.replace("_"," ")}</Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Stock Summary */}
        <div style={{ ...css.card }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:12 }}>Stock Summary</div>
          {stock.map(s=>(
            <div key={s.id} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${T.border}`, alignItems:"center" }}>
              <div>
                <span style={{ fontFamily:T.fontMono, fontSize:11, color:T.text }}>{s.section} {s.size}</span>
                <span style={{ fontSize:11, color:T.textMid, marginLeft:8 }}>{s.lotNo}</span>
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <span style={{ fontSize:11, fontFamily:T.fontMono, color:T.green }}>{fmt.num(s.wtAvailable)} kg</span>
                <Badge color={statusColors2[s.status]||"gray"}>{s.status?.replace("_"," ")}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
const statusColors2 = { available:"green", allocated:"blue", qc_hold:"amber", rejected:"red", consumed:"gray" };

// ─── PLACEHOLDER ──────────────────────────────────────────────────────────────
const Placeholder = ({ title, session, icon, desc }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:400 }}>
    <div style={{ textAlign:"center", maxWidth:480 }}>
      <div style={{ fontSize:48, marginBottom:16 }}>{icon}</div>
      <div style={{ fontSize:22, fontWeight:800, color:T.text, marginBottom:8 }}>{title}</div>
      <div style={{ display:"inline-block", background:T.amberBg, border:`1px solid ${T.amber}`, borderRadius:6, padding:"4px 12px", fontSize:12, color:T.amber, fontWeight:700, marginBottom:14 }}>{session}</div>
      <div style={{ fontSize:13, color:T.textMid, lineHeight:1.6 }}>{desc}</div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ORDERS MODULE — Full Session 2 implementation
// ═══════════════════════════════════════════════════════════════════════════════

const ROLES_S2 = [
  { id:"super_admin", label:"Super Admin", level:"admin" }, { id:"planning_admin", label:"Planning Admin", level:"admin" },
  { id:"planning_user", label:"Planning User", level:"user" }, { id:"purchase_admin", label:"Purchase Admin", level:"admin" },
  { id:"finance_admin", label:"Finance Admin", level:"admin" }, { id:"finance_user", label:"Finance User", level:"user" },
  { id:"qc_admin", label:"QC Admin", level:"admin" }, { id:"store_admin", label:"Store Admin", level:"admin" },
  { id:"floor_planner", label:"Floor Planner", level:"admin" }, { id:"dispatch_admin", label:"Dispatch Admin", level:"admin" },
];

// LEGACY — superseded by App-level clients state; kept for reference only
const CLIENTS_S2 = [
  { id:"CL-001", code:"TATA", name:"Tata Projects Limited",    gstin:"27AAACT1234A1Z5", pan:"AAACT1234A", state:"Maharashtra", stateCode:"27", paymentTerms:"60 days", creditLimit:5000000 },
  { id:"CL-002", code:"BHEL", name:"Bharat Heavy Electricals", gstin:"07AAACB1234B1Z3", pan:"AAACB1234B", state:"Delhi",       stateCode:"07", paymentTerms:"45 days", creditLimit:3000000 },
  { id:"CL-003", code:"NMC",  name:"Nagpur Municipal Corp.",   gstin:"27AAALG1234C1Z1", pan:"AAALG1234C", state:"Maharashtra", stateCode:"27", paymentTerms:"90 days", creditLimit:1000000 },
];

const totalDrgWt = (o) => (o.drawings||[]).reduce((s,d)=>s+(d.totalWt||0),0);
const receivedDrgWt = (o) => (o.drawings||[]).filter(d=>d.receivedDate).reduce((s,d)=>s+(d.totalWt||0),0);

const SEED_ORDERS = [
  {
    id:"SF-2025-0001", status:"active", clientId:"CL-001", clientPoNo:"TPL/PO/2025/NWK/4521",
    projectDesc:"Nagpur-Wardha Expressway — Jetty Structure Structural Steel Works",
    orderDate:"2025-01-10", endDate:"2025-10-31", orderUnit:"Ton", ratePerUnit:95000, orderQty:250, orderValue:23750000, gstRate:18,
    clientPoDoc:"https://drive.google.com/file/d/sample1/view",
    billing:{ addr:"Tata Centre, 43 Chowringhee Road, Kolkata 700071", gstin:"27AAACT1234A1Z5", pan:"AAACT1234A", stateCode:"27", state:"Maharashtra", contact:"Anil Verma", phone:"033-22883434", email:"procurement@tataprojects.com" },
    shippingAddresses:[{ id:"SA-001", site:"Nagpur-Wardha Expressway Site", addr:"NH-361, Near Wardha River Bridge, Wardha 442001", gstin:"27AAACT1234A1Z5", contact:"Site Engineer", phone:"9876540001", dispatchSpec:"Wooden rafters + shrink wrap", notes:"Gate pass required 48hrs prior" }],
    milestones:[
      { id:"MS-001", desc:"Advance Against Bank Guarantee",      type:"advance", gstPct:0,  basis:"percent", value:10, trigger:"bg",            invoices:[] },
      { id:"MS-002", desc:"Against Raw Material Inspection",     type:"running", gstPct:18, basis:"percent", value:15, trigger:"rm_inspection",  invoices:[] },
      { id:"MS-003", desc:"Against Fabrication & QC",            type:"running", gstPct:18, basis:"percent", value:50, trigger:"fabrication_qc", invoices:[] },
      { id:"MS-004", desc:"Against Dispatch",                    type:"running", gstPct:18, basis:"percent", value:20, trigger:"dispatch",       invoices:[] },
      { id:"MS-005", desc:"Retention",                           type:"final",   gstPct:18, basis:"percent", value:5,  trigger:"retention",      invoices:[] },
    ],
    drawings:[
      { id:"D001", drawingNo:"TPL-JETTY-COL-01", title:"Main Column Type A", qty:4,  unitWt:857.78,totalWt:3431.12,revNo:"B",drawingDate:"2025-01-05",receivedDate:"2025-01-12",phase:1,priority:1,driveLink:"https://drive.google.com/file/d/dwg001/view",fileType:"PDF",status:"active",revHistory:[{rev:"A",date:"2024-12-20",note:"Initial issue"},{rev:"B",date:"2025-01-05",note:"Column dimensions revised"}] },
      { id:"D002", drawingNo:"TPL-JETTY-BM-01",  title:"Main Beam Type B",   qty:6,  unitWt:420.50,totalWt:2523.00,revNo:"A",drawingDate:"2025-01-05",receivedDate:"2025-01-12",phase:1,priority:2,driveLink:"https://drive.google.com/file/d/dwg002/view",fileType:"PDF",status:"active",revHistory:[{rev:"A",date:"2025-01-05",note:"Initial issue"}] },
      { id:"D003", drawingNo:"TPL-JETTY-BP-01",  title:"Base Plate Assembly", qty:8,  unitWt:215.30,totalWt:1722.40,revNo:"A",drawingDate:"2025-01-05",receivedDate:"2025-01-12",phase:1,priority:2,driveLink:"https://drive.google.com/file/d/dwg003/view",fileType:"PDF",status:"active",revHistory:[{rev:"A",date:"2025-01-05",note:"Initial issue"}] },
      { id:"D004", drawingNo:"TPL-JETTY-BRK-01", title:"Bracings H&D",       qty:12, unitWt:145.60,totalWt:1747.20,revNo:"A",drawingDate:"2025-01-08",receivedDate:"2025-01-15",phase:2,priority:1,driveLink:"https://drive.google.com/file/d/dwg004/view",fileType:"PDF",status:"active",revHistory:[{rev:"A",date:"2025-01-08",note:"Initial issue"}] },
      { id:"D005", drawingNo:"TPL-JETTY-PL-01",  title:"Platform Level 1",   qty:2,  unitWt:980.00,totalWt:1960.00,revNo:"A",drawingDate:"2025-01-08",receivedDate:"",           phase:2,priority:2,driveLink:"",fileType:"",status:"pending",revHistory:[] },
      { id:"D006", drawingNo:"TPL-JETTY-PL-02",  title:"Platform Level 2",   qty:2,  unitWt:920.00,totalWt:1840.00,revNo:"A",drawingDate:"2025-01-08",receivedDate:"",           phase:3,priority:1,driveLink:"",fileType:"",status:"pending",revHistory:[] },
    ],
    parts:[
      { id:"P001",drawingId:"D001",revNo:"B",itemNo:1, markNo:"SBK-101",desc:"BRACKET ANGLE",          fabType:"Fabricate", matType:"MS",grade:"E250",section:"ISA",    size:"75x75x8",   length:150, width:75, qtyPerDrg:80,clientUnitWt:1.335, clientTotalWt:106.8,  calcUnitWt:1.335, calcTotalWt:106.8,  jointsAllowed:false,source:"Procure",      partLink:"",remarks:"" },
      { id:"P002",drawingId:"D001",revNo:"B",itemNo:2, markNo:"SBK-103",desc:"HEAVY BRACKET",          fabType:"Fabricate", matType:"MS",grade:"E250",section:"ISA",    size:"150x150x16",length:270, width:150,qtyPerDrg:5, clientUnitWt:9.666, clientTotalWt:48.33,  calcUnitWt:9.666, calcTotalWt:48.33,  jointsAllowed:false,source:"Procure",      partLink:"",remarks:"" },
      { id:"P003",drawingId:"D001",revNo:"B",itemNo:3, markNo:"PL-001", desc:"BASE PLATE 10MM",        fabType:"Fabricate", matType:"MS",grade:"E250",section:"PLATE",  size:"10mm",      length:500, width:500,qtyPerDrg:4, clientUnitWt:19.625,clientTotalWt:78.5,   calcUnitWt:19.625,calcTotalWt:78.5,   jointsAllowed:true, source:"Procure",      partLink:"",remarks:"" },
      { id:"P004",drawingId:"D001",revNo:"B",itemNo:4, markNo:"BOLT-M24",desc:"M24 HDG BOLTS",         fabType:"Bought Out",matType:"MS",grade:"Galv",section:"—",      size:"M24x100",   length:100, width:0,  qtyPerDrg:32,clientUnitWt:0.51,  clientTotalWt:16.32,  calcUnitWt:0.51,  calcTotalWt:16.32,  jointsAllowed:false,source:"Procure",      partLink:"",remarks:"Galvanised hot dip" },
      { id:"P005",drawingId:"D002",revNo:"A",itemNo:1, markNo:"WB-201", desc:"WIDE FLANGE BEAM",       fabType:"Fabricate", matType:"MS",grade:"E250",section:"ISMB",   size:"300",       length:6200,width:0,  qtyPerDrg:2, clientUnitWt:285.82,clientTotalWt:571.64, calcUnitWt:285.82,calcTotalWt:571.64, jointsAllowed:false,source:"Procure",      partLink:"",remarks:"" },
      { id:"P006",drawingId:"D002",revNo:"A",itemNo:2, markNo:"CH-202", desc:"CHANNEL PURLIN",         fabType:"Fabricate", matType:"MS",grade:"E250",section:"ISMC",   size:"150",       length:2500,width:0,  qtyPerDrg:8, clientUnitWt:41.0,  clientTotalWt:328.0,  calcUnitWt:41.0,  calcTotalWt:328.0,  jointsAllowed:false,source:"Client Supply", partLink:"",remarks:"Client supplied SAIL material" },
      { id:"P007",drawingId:"D002",revNo:"A",itemNo:3, markNo:"FB-203", desc:"FLAT BAR STIFFENER",     fabType:"Fabricate", matType:"MS",grade:"E250",section:"Flat Bar",size:"75x10",     length:150, width:75, qtyPerDrg:50,clientUnitWt:0.883, clientTotalWt:44.15,  calcUnitWt:0.883, calcTotalWt:44.15,  jointsAllowed:true, source:"Procure",      partLink:"",remarks:"" },
      { id:"P008",drawingId:"D003",revNo:"A",itemNo:1, markNo:"BP-301", desc:"BASE PLATE 12MM",        fabType:"Fabricate", matType:"MS",grade:"E250",section:"PLATE",  size:"12mm",      length:600, width:600,qtyPerDrg:1, clientUnitWt:33.912,clientTotalWt:33.912, calcUnitWt:33.912,calcTotalWt:33.912, jointsAllowed:false,source:"Procure",      partLink:"",remarks:"" },
      { id:"P009",drawingId:"D003",revNo:"A",itemNo:2, markNo:"SBK-302",desc:"ANCHOR BOLTS",           fabType:"Bought Out",matType:"MS",grade:"Galv",section:"—",      size:"M30x600",   length:600, width:0,  qtyPerDrg:4, clientUnitWt:3.37,  clientTotalWt:13.48,  calcUnitWt:3.37,  calcTotalWt:13.48,  jointsAllowed:false,source:"Procure",      partLink:"",remarks:"With nuts and washers" },
      { id:"P010",drawingId:"D004",revNo:"A",itemNo:1, markNo:"BRC-401",desc:"DIAGONAL BRACING",       fabType:"Fabricate", matType:"MS",grade:"E250",section:"ISA",    size:"100x100x10",length:2400,width:0,  qtyPerDrg:4, clientUnitWt:35.76, clientTotalWt:143.04, calcUnitWt:35.76, calcTotalWt:143.04, jointsAllowed:false,source:"Procure",      partLink:"",remarks:"" },
      { id:"P011",drawingId:"D004",revNo:"A",itemNo:2, markNo:"GP-402", desc:"GUSSET PLATE 8MM",       fabType:"Fabricate", matType:"MS",grade:"E250",section:"PLATE",  size:"8mm",       length:300, width:250,qtyPerDrg:8, clientUnitWt:4.712, clientTotalWt:37.696, calcUnitWt:4.712, calcTotalWt:37.696, jointsAllowed:false,source:"Procure",      partLink:"",remarks:"" },
    ],
    quality:{ tpiRequired:true,tpiAgencyId:"TPI-001",tpiAgencyName:"Bureau Veritas India",tpiHoldPoints:["welding","painting"],wpsDoc:"",
      approvedMakes:[{id:"QAM-001",matType:"MS Plates",makes:"JSW Steel, SAIL",remarks:"No Essar material"},{id:"QAM-002",matType:"Angles/ISA",makes:"JSW Steel, SAIL",remarks:""},{id:"QAM-003",matType:"Channels/ISMC",makes:"JSW Steel, SAIL",remarks:""},{id:"QAM-004",matType:"Beams/ISMB",makes:"JSW Steel, SAIL",remarks:"JSW preferred"}],
      paintCoats:[{coatNo:1,type:"Primer",dft:50,make:"Akzo Nobel",product:"Interplus 356",dryTime:8,remarks:""},{coatNo:2,type:"MIO",dft:75,make:"Akzo Nobel",product:"Intergard 269",dryTime:16,remarks:""},{coatNo:3,type:"Finish",dft:50,make:"Akzo Nobel",product:"Interthane 990",dryTime:24,remarks:""}],
      weldSpec:{process:"SMAW",electrodeType:"E7018",grade:"E7018-1",make:"Lincoln Electric",remarks:"Preheat required for plates >12mm"},
      dispatchSpec:{packingType:"Wooden rafters + shrink wrap",remarks:"All sharp edges to be covered."},
      mdccDocs:[{id:"MDCC-D-001",docName:"Mill Test Certificates (MTCs)",mandatory:true},{id:"MDCC-D-002",docName:"TPI Weld Inspection Report",mandatory:true},{id:"MDCC-D-003",docName:"TPI Paint Inspection Report",mandatory:true},{id:"MDCC-D-004",docName:"Dimensional Check Report",mandatory:true},{id:"MDCC-D-005",docName:"Paint DFT Report",mandatory:true},{id:"MDCC-D-006",docName:"Final Visual Inspection",mandatory:true},{id:"MDCC-D-007",docName:"Weight Summary",mandatory:false},{id:"MDCC-D-008",docName:"Packing List",mandatory:false}],
    },
    amendments:[{id:"AMD-001",field:"orderQty",oldVal:"220 Ton",newVal:"250 Ton",date:"2025-02-15",changedBy:"Anita Sharma",reason:"Client revised scope per letter TPL/AMD/2025/001",docLink:"https://drive.google.com/file/d/amd001/view"}],
    invoices:[], createdBy:"Anita Sharma", createdAt:"2025-01-12",
  },
  {
    id:"SF-2025-0002", status:"active", clientId:"CL-002", clientPoNo:"BHEL/PO/2025/ESS/0187",
    projectDesc:"NTPC Mouda — Equipment Support Structure",
    orderDate:"2025-01-28", endDate:"2025-07-31", orderUnit:"Ton", ratePerUnit:88000, orderQty:45, orderValue:3960000, gstRate:18,
    clientPoDoc:"https://drive.google.com/file/d/sample2/view",
    billing:{ addr:"BHEL House, Siri Fort, New Delhi 110049", gstin:"07AAACB1234B1Z3", pan:"AAACB1234B", stateCode:"07", state:"Delhi", contact:"Suresh Rajan", phone:"011-26001000", email:"mm@bhel.in" },
    shippingAddresses:[{ id:"SA-101", site:"NTPC Mouda Site", addr:"NTPC Mouda, Dist. Nagpur 441111", gstin:"", contact:"Site Manager", phone:"9876540099", dispatchSpec:"Shrink wrap only", notes:"" }],
    milestones:[
      { id:"MS-101", desc:"Advance",              type:"advance", gstPct:0,  basis:"percent", value:10, trigger:"advance",       invoices:[] },
      { id:"MS-102", desc:"Against RM Inspection",type:"running", gstPct:18, basis:"percent", value:20, trigger:"rm_inspection",  invoices:[] },
      { id:"MS-103", desc:"Against Dispatch",     type:"running", gstPct:18, basis:"percent", value:60, trigger:"dispatch",       invoices:[] },
      { id:"MS-104", desc:"Retention",            type:"final",   gstPct:18, basis:"percent", value:10, trigger:"retention",      invoices:[] },
    ],
    drawings:[
      { id:"D101", drawingNo:"BHEL-ESS-FR-01",  title:"Equipment Support Frame",   qty:2, unitWt:980.0, totalWt:1960.0, revNo:"A",drawingDate:"2025-01-22",receivedDate:"2025-01-28",phase:1,priority:1,driveLink:"https://drive.google.com/file/d/d101/view",fileType:"PDF",status:"active",revHistory:[{rev:"A",date:"2025-01-22",note:"Initial issue"}] },
      { id:"D102", drawingNo:"BHEL-ESS-PED-01", title:"Equipment Pedestal",        qty:4, unitWt:145.0, totalWt:580.0,  revNo:"A",drawingDate:"2025-01-22",receivedDate:"2025-01-28",phase:1,priority:2,driveLink:"https://drive.google.com/file/d/d102/view",fileType:"PDF",status:"active",revHistory:[{rev:"A",date:"2025-01-22",note:"Initial issue"}] },
      { id:"D103", drawingNo:"BHEL-ESS-ACC-01", title:"Access Platform & Handrail",qty:1, unitWt:360.0, totalWt:360.0,  revNo:"A",drawingDate:"2025-01-22",receivedDate:"",           phase:1,priority:3,driveLink:"",fileType:"",status:"pending",revHistory:[] },
    ],
    parts:[
      { id:"P101",drawingId:"D101",revNo:"A",itemNo:1,markNo:"FR-101",desc:"MAIN COLUMN RHS",    fabType:"Fabricate",matType:"MS",grade:"E250",section:"RHS",  size:"100x50x4",length:3500,width:0,qtyPerDrg:4,clientUnitWt:32.27, clientTotalWt:129.08, calcUnitWt:32.27, calcTotalWt:129.08, jointsAllowed:false,source:"Procure",partLink:"",remarks:"" },
      { id:"P102",drawingId:"D101",revNo:"A",itemNo:2,markNo:"FR-102",desc:"HORIZONTAL ISMB",    fabType:"Fabricate",matType:"MS",grade:"E250",section:"ISMB", size:"200",      length:2000,width:0,qtyPerDrg:3,clientUnitWt:50.8,  clientTotalWt:152.4,  calcUnitWt:50.8,  calcTotalWt:152.4,  jointsAllowed:false,source:"Procure",partLink:"",remarks:"" },
      { id:"P103",drawingId:"D101",revNo:"A",itemNo:3,markNo:"PL-103",desc:"MOUNTING PLATE 16MM",fabType:"Fabricate",matType:"MS",grade:"E350",section:"PLATE",size:"16mm",     length:400, width:400,qtyPerDrg:2,clientUnitWt:20.096,clientTotalWt:40.192, calcUnitWt:20.096,calcTotalWt:40.192, jointsAllowed:false,source:"Procure",partLink:"",remarks:"" },
      { id:"P104",drawingId:"D102",revNo:"A",itemNo:1,markNo:"PED-201",desc:"PEDESTAL ISMC",     fabType:"Fabricate",matType:"MS",grade:"E250",section:"ISMC", size:"200",      length:800, width:0,qtyPerDrg:2,clientUnitWt:17.68, clientTotalWt:35.36,  calcUnitWt:17.68, calcTotalWt:35.36,  jointsAllowed:false,source:"Procure",partLink:"",remarks:"" },
      { id:"P105",drawingId:"D102",revNo:"A",itemNo:2,markNo:"BP-202", desc:"BASE PLATE 12MM",   fabType:"Fabricate",matType:"MS",grade:"E250",section:"PLATE",size:"12mm",     length:300, width:300,qtyPerDrg:1,clientUnitWt:8.478, clientTotalWt:8.478,  calcUnitWt:8.478, calcTotalWt:8.478,  jointsAllowed:false,source:"Procure",partLink:"",remarks:"" },
    ],
    quality:{ tpiRequired:false,tpiAgencyId:"",tpiAgencyName:"",tpiHoldPoints:[],wpsDoc:"",
      approvedMakes:[{id:"QAM-101",matType:"MS Plates",makes:"JSW Steel, SAIL, Tata Steel",remarks:""},{id:"QAM-102",matType:"RHS/SHS",makes:"APL Apollo, Tata Structura",remarks:""}],
      paintCoats:[{coatNo:1,type:"Primer",dft:50,make:"Berger Paints",product:"Berger Rustop",dryTime:6,remarks:""},{coatNo:2,type:"Finish",dft:50,make:"Berger Paints",product:"Berger Syntex HB",dryTime:8,remarks:""}],
      weldSpec:{process:"SMAW",electrodeType:"E7018",grade:"E7018",make:"ESAB",remarks:""},
      dispatchSpec:{packingType:"Shrink wrap only",remarks:""},
      mdccDocs:[{id:"MDCC-D-101",docName:"Mill Test Certificates",mandatory:true},{id:"MDCC-D-102",docName:"Dimensional Check Report",mandatory:true},{id:"MDCC-D-103",docName:"Paint DFT Report",mandatory:true},{id:"MDCC-D-104",docName:"Packing List",mandatory:false}],
    },
    amendments:[], invoices:[], createdBy:"Vikram Singh", createdAt:"2025-01-30",
  },
];

// ─── ORDER TAB COMPONENTS ─────────────────────────────────────────────────────
const TabBar2 = ({ tabs, active, onChange }) => (
  <div style={{ display:"flex", gap:2, borderBottom:`1px solid ${T.border}`, marginBottom:20, overflowX:"auto" }}>
    {tabs.map(t => (
      <button key={t.id} onClick={()=>onChange(t.id)} style={{ padding:"10px 14px", fontSize:12, fontWeight:active===t.id?700:500, color:active===t.id?T.accent:T.textMid, background:"transparent", border:"none", borderBottom:active===t.id?`2px solid ${T.accent}`:"2px solid transparent", cursor:"pointer", fontFamily:T.font, whiteSpace:"nowrap" }}>{t.label}</button>
    ))}
  </div>
);
const Row2 = ({ label, value, mono }) => (
  <div style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${T.border}` }}>
    <span style={{ fontSize:12, color:T.textMid }}>{label}</span>
    <span style={{ fontSize:13, color:T.text, fontFamily:mono?T.fontMono:T.font, fontWeight:500 }}>{value||"—"}</span>
  </div>
);
const DrawingReleaseBanner = ({ order }) => {
  const all = order.drawings||[];
  const totalRegisteredKg = all.reduce((s,d)=>s+(d.totalWt||0),0);
  const receivedKg = all.filter(d=>d.receivedDate).reduce((s,d)=>s+(d.totalWt||0),0);
  const pendingKg = totalRegisteredKg - receivedKg;
  const pct = totalRegisteredKg > 0 ? Math.min(100,Math.round(receivedKg/totalRegisteredKg*100)) : 0;
  const recDrgs = all.filter(d=>d.receivedDate).length;
  const orderKg = (order.orderQty||0)*1000;
  const notInRegisterKg = orderKg - totalRegisteredKg;
  return (
    <div style={{ background:pct===100?T.greenBg:T.amberBg, border:`1px solid ${pct===100?T.green:T.amber}`, borderRadius:8, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
      <div>
        <div style={{ fontSize:11, color:T.textMid, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:2 }}>Drawing Release Status</div>
        <div style={{ fontSize:14, fontWeight:700, color:pct===100?T.green:T.amber }}>{recDrgs} of {all.length} drawings received · {(receivedKg/1000).toFixed(1)}T of {(totalRegisteredKg/1000).toFixed(1)}T registered</div>
        {pendingKg>0 && <div style={{ fontSize:12, color:T.textMid, marginTop:2 }}>⚠ {(pendingKg/1000).toFixed(1)}T drawing weight pending client release</div>}
        {notInRegisterKg>0 && <div style={{ fontSize:12, color:T.amber, marginTop:2 }}>⚠ {(notInRegisterKg/1000).toFixed(1)}T of order weight not yet in drawing register</div>}
      </div>
      <div style={{ flex:1, minWidth:200 }}>
        <div style={{ height:6, background:T.border, borderRadius:3, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, background:pct===100?T.green:T.amber, borderRadius:3 }} />
        </div>
        <div style={{ fontSize:11, color:T.textMid, marginTop:4 }}>{pct}% drawings received by weight</div>
      </div>
    </div>
  );
};
const TabBasicDetails = ({ order, onChange, canEdit, clients }) => {
  const clientList = clients||[];
  const client = clientList.find(c=>c.id===order.clientId)||{};
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div><label style={css.label}>Sales Order No</label><input value={order.id} disabled style={{ ...css.input, opacity:0.6 }} /></div>
        <div><label style={css.label}>Status</label><select value={order.status||"active"} onChange={e=>onChange({...order,status:e.target.value})} disabled={!canEdit} style={css.input}><option value="active">Active</option><option value="completed">Completed</option><option value="on_hold">On Hold</option><option value="cancelled">Cancelled</option></select></div>
        <div><label style={css.label}>Client <span style={{color:T.red}}>*</span></label><select value={order.clientId||""} onChange={e=>onChange({...order,clientId:e.target.value})} disabled={!canEdit} style={css.input}><option value="">Select...</option>{clientList.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label style={css.label}>Client PO No</label><input value={order.clientPoNo||""} onChange={e=>onChange({...order,clientPoNo:e.target.value})} disabled={!canEdit} style={css.input} /></div>
        <div style={{ gridColumn:"span 2" }}><label style={css.label}>Project Description</label><input value={order.projectDesc||""} onChange={e=>onChange({...order,projectDesc:e.target.value})} disabled={!canEdit} style={css.input} /></div>
        <div><label style={css.label}>Order Date</label><input type="date" value={order.orderDate||""} onChange={e=>onChange({...order,orderDate:e.target.value})} disabled={!canEdit} style={css.input} /></div>
        <div><label style={css.label}>End Date</label><input type="date" value={order.endDate||""} onChange={e=>onChange({...order,endDate:e.target.value})} disabled={!canEdit} style={css.input} /></div>
        <div><label style={css.label}>Order Unit</label><select value={order.orderUnit||"Ton"} onChange={e=>onChange({...order,orderUnit:e.target.value})} disabled={!canEdit} style={css.input}><option>Ton</option><option>Nos</option><option>Kg</option></select></div>
        <div><label style={css.label}>Rate per {order.orderUnit||"Unit"} (₹)</label><input type="number" value={order.ratePerUnit||""} onChange={e=>onChange({...order,ratePerUnit:+e.target.value,orderValue:(+e.target.value)*(order.orderQty||0)})} disabled={!canEdit} style={css.input} /></div>
        <div><label style={css.label}>Order Qty ({order.orderUnit||"Unit"})</label><input type="number" value={order.orderQty||""} onChange={e=>onChange({...order,orderQty:+e.target.value,orderValue:(order.ratePerUnit||0)*(+e.target.value)})} disabled={!canEdit} style={css.input} /></div>
        <div><label style={css.label}>Order Value (₹) — Auto</label><input value={fmt.currency(order.orderValue||0)} disabled style={{ ...css.input, opacity:0.7, color:T.green }} /></div>
        <div><label style={css.label}>GST Rate (%)</label><select value={order.gstRate||18} onChange={e=>onChange({...order,gstRate:+e.target.value})} disabled={!canEdit} style={css.input}><option value={0}>0%</option><option value={5}>5%</option><option value={12}>12%</option><option value={18}>18%</option></select></div>
      </div>
      <div style={{ marginTop:12 }}>
        <label style={css.label}>Client PO Document</label>
        <div style={{ display:"flex", gap:8 }}>
          <input value={order.clientPoDoc||""} onChange={e=>onChange({...order,clientPoDoc:e.target.value})} disabled={!canEdit} style={{ ...css.input, flex:1 }} placeholder="Drive link..." />
          {order.clientPoDoc && <a href={order.clientPoDoc} target="_blank" rel="noreferrer" style={{ ...css.btn.sm, textDecoration:"none" }}>View</a>}
        </div>
        <div style={{ fontSize:11, color:T.red, marginTop:4 }}>⚠ Critical document — system will warn if missing</div>
      </div>
      {client.name && (
        <div style={{ ...css.card, background:T.bgInput, marginTop:12 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.textMid, marginBottom:8 }}>CLIENT REFERENCE</div>
          <Row2 label="GSTIN" value={client.gstin} mono /><Row2 label="State" value={`${client.state} (${client.stateCode})`} /><Row2 label="Payment Terms" value={client.paymentTerms} /><Row2 label="Credit Limit" value={fmt.currency(client.creditLimit)} mono />
        </div>
      )}
    </div>
  );
};
const TabGSTBilling = ({ order, onChange, canEdit }) => {
  const b = order.billing||{};
  const upd = (k,v) => onChange({...order,billing:{...b,[k]:v}});
  return (
    <div>
      <div style={{ ...css.card, background:T.amberBg, border:`1px solid ${T.amber}`, marginBottom:16, fontSize:12, color:T.amber }}>Billing details default from client master. Override here if billing to a different entity.</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div style={{ gridColumn:"span 2" }}><label style={css.label}>Billing Address</label><textarea value={b.addr||""} onChange={e=>upd("addr",e.target.value)} disabled={!canEdit} style={{ ...css.input, minHeight:64, resize:"vertical" }} /></div>
        <div><label style={css.label}>Contact</label><input value={b.contact||""} onChange={e=>upd("contact",e.target.value)} disabled={!canEdit} style={css.input} /></div>
        <div><label style={css.label}>Phone</label><input value={b.phone||""} onChange={e=>upd("phone",e.target.value)} disabled={!canEdit} style={css.input} /></div>
        <div><label style={css.label}>Email</label><input value={b.email||""} onChange={e=>upd("email",e.target.value)} disabled={!canEdit} style={css.input} /></div>
        <div><label style={css.label}>GSTIN</label><input value={b.gstin||""} onChange={e=>upd("gstin",e.target.value)} disabled={!canEdit} style={css.input} /></div>
        <div><label style={css.label}>PAN</label><input value={b.pan||""} onChange={e=>upd("pan",e.target.value)} disabled={!canEdit} style={css.input} /></div>
        <div><label style={css.label}>State</label><input value={b.state||""} onChange={e=>upd("state",e.target.value)} disabled={!canEdit} style={css.input} /></div>
        <div><label style={css.label}>State Code</label><input value={b.stateCode||""} onChange={e=>upd("stateCode",e.target.value)} disabled={!canEdit} style={css.input} /></div>
      </div>
    </div>
  );
};
const TabShipping = ({ order, onChange, canEdit }) => {
  const [modal, setModal] = useState(null); const [form, setForm] = useState({});
  const addrs = order.shippingAddresses||[];
  const save = () => { onChange({...order,shippingAddresses:modal==="add"?[...addrs,{...form,id:`SA-${Date.now()}`}]:addrs.map(a=>a.id===form.id?form:a)}); setModal(null); };
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.text }}>Shipping Addresses ({addrs.length})</div>
        {canEdit && <button onClick={()=>{setForm({});setModal("add");}} style={css.btn.primary}>+ Add Site</button>}
      </div>
      {addrs.length===0 && <div style={{ color:T.textLow, textAlign:"center", padding:32 }}>No shipping addresses added</div>}
      {addrs.map(a=>(
        <div key={a.id} style={{ ...css.card, marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{a.site}</div>
              <div style={{ fontSize:12, color:T.textMid }}>{a.addr}</div>
              <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
                <Badge color="blue">{a.contact}</Badge>
                {a.dispatchSpec && <Badge color="amber">{a.dispatchSpec}</Badge>}
                {a.notes && <Badge color="gray">{a.notes}</Badge>}
              </div>
            </div>
            {canEdit && <button onClick={()=>{setForm({...a});setModal("edit");}} style={css.btn.ghost}>Edit</button>}
          </div>
        </div>
      ))}
      {modal && (
        <Modal title={modal==="add"?"Add Shipping Address":"Edit Shipping Address"} onClose={()=>setModal(null)}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ gridColumn:"span 2" }}><label style={css.label}>Site Name</label><input value={form.site||""} onChange={e=>setForm({...form,site:e.target.value})} style={css.input} /></div>
            <div style={{ gridColumn:"span 2" }}><label style={css.label}>Address</label><textarea value={form.addr||""} onChange={e=>setForm({...form,addr:e.target.value})} style={{ ...css.input, minHeight:60, resize:"vertical" }} /></div>
            <div><label style={css.label}>GSTIN</label><input value={form.gstin||""} onChange={e=>setForm({...form,gstin:e.target.value})} style={css.input} /></div>
            <div><label style={css.label}>Contact</label><input value={form.contact||""} onChange={e=>setForm({...form,contact:e.target.value})} style={css.input} /></div>
            <div><label style={css.label}>Phone</label><input value={form.phone||""} onChange={e=>setForm({...form,phone:e.target.value})} style={css.input} /></div>
            <div><label style={css.label}>Dispatch Spec</label><input value={form.dispatchSpec||""} onChange={e=>setForm({...form,dispatchSpec:e.target.value})} style={css.input} /></div>
            <div style={{ gridColumn:"span 2" }}><label style={css.label}>Notes</label><textarea value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})} style={{ ...css.input, minHeight:48, resize:"vertical" }} /></div>
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:12 }}><button onClick={()=>setModal(null)} style={css.btn.secondary}>Cancel</button><button onClick={save} style={css.btn.primary}>Save</button></div>
        </Modal>
      )}
    </div>
  );
};
const TabMilestones = ({ order, onChange, canEdit }) => {
  const [modal, setModal] = useState(null); const [form, setForm] = useState({});
  const [invoiceModal, setInvoiceModal] = useState(null); const [invForm, setInvForm] = useState({});
  const ms = order.milestones||[];
  const totalPct = ms.reduce((s,m)=>s+(+m.value||0),0);
  const invoiced = ms.reduce((s,m)=>s+(m.invoices||[]).reduce((ss,inv)=>ss+(inv.amount||0),0),0);
  const saveMs = () => { const updated = modal==="add"?[...ms,{...form,id:`MS-${Date.now()}`,invoices:[]}]:ms.map(m=>m.id===form.id?{...form,invoices:m.invoices}:m); onChange({...order,milestones:updated}); setModal(null); };
  const saveInvoice = (msId) => { const updated=ms.map(m=>m.id===msId?{...m,invoices:[...(m.invoices||[]),{...invForm,id:`INV-${Date.now()}`,raisedDate:today(),status:"draft"}]}:m); onChange({...order,milestones:updated}); setInvoiceModal(null); };
  const triggerLabels = { bg:"Against Bank Guarantee",rm_inspection:"Against RM Inspection",fabrication_qc:"Against Fabrication & QC",dispatch:"Against Dispatch",retention:"Retention Release",advance:"Advance" };
  return (
    <div>
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <StatCard label="Order Value" value={fmt.currency(order.orderValue)} color={T.text} />
        <StatCard label="Total %" value={`${totalPct}%`} sub={totalPct===100?"✓ 100%":"⚠ Should total 100%"} color={totalPct===100?T.green:T.red} />
        <StatCard label="Total Invoiced" value={fmt.currency(invoiced)} color={T.accent} />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.text }}>Milestones ({ms.length})</div>
        {canEdit && <button onClick={()=>{setForm({type:"running",gstPct:18,basis:"percent"});setModal("add");}} style={css.btn.primary}>+ Add Milestone</button>}
      </div>
      {ms.map((m,i)=>{
        const msValue = m.basis==="percent"?(order.orderValue*(m.value/100)):m.value;
        const totalInv = (m.invoices||[]).reduce((s,inv)=>s+(inv.amount||0),0);
        return (
          <div key={m.id} style={{ ...css.card, marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                  <span style={{ fontSize:11, fontFamily:T.fontMono, color:T.textLow }}>MS-{String(i+1).padStart(2,"0")}</span>
                  <Badge color={m.type==="advance"?"gold":m.type==="final"?"purple":"blue"}>{m.type}</Badge>
                  <Badge color="gray">{m.gstPct}% GST</Badge>
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{m.desc}</div>
                <div style={{ fontSize:12, color:T.textMid }}>{triggerLabels[m.trigger]||m.trigger} · {m.basis==="percent"?`${m.value}% = ${fmt.currency(msValue)}`:`Fixed ${fmt.currency(m.value)}`}</div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                {canEdit && <button onClick={()=>{setInvForm({msId:m.id,ratePerUnit:order.ratePerUnit||0});setInvoiceModal(m.id);}} style={css.btn.sm}>+ Invoice</button>}
                {canEdit && <button onClick={()=>{setForm({...m});setModal("edit");}} style={css.btn.ghost}>Edit</button>}
              </div>
            </div>
            {(m.invoices||[]).length>0 && (
              <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${T.border}` }}>
                <div style={{ fontSize:11, color:T.textMid, fontWeight:600, marginBottom:6, textTransform:"uppercase" }}>Invoices ({m.invoices.length})</div>
                {m.invoices.map(inv=>(
                  <div key={inv.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 10px", background:T.bgInput, borderRadius:6, marginBottom:4 }}>
                    <div>
                      <span style={{ fontSize:12, fontFamily:T.fontMono, color:T.accentHi }}>{inv.invoiceNo||inv.id}</span>
                      <span style={{ fontSize:11, color:T.textMid, marginLeft:10 }}>{fmt.date(inv.raisedDate)}</span>
                      <span style={{ fontSize:12, color:T.textMid, marginLeft:10 }}>{inv.qty} {order.orderUnit} × ₹{fmt.num(inv.ratePerUnit)}</span>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:T.green, fontFamily:T.fontMono }}>{fmt.currency(inv.amount)}</span>
                      <Badge color={inv.status==="paid"?"green":inv.status==="sent"?"amber":"gray"}>{inv.status}</Badge>
                    </div>
                  </div>
                ))}
                <div style={{ fontSize:12, color:T.textMid, textAlign:"right", marginTop:4 }}>Invoiced: <strong style={{color:T.text}}>{fmt.currency(totalInv)}</strong> of {fmt.currency(msValue)}</div>
              </div>
            )}
          </div>
        );
      })}
      {modal && (
        <Modal title={modal==="add"?"Add Milestone":"Edit Milestone"} onClose={()=>setModal(null)}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ gridColumn:"span 2" }}><label style={css.label}>Description</label><input value={form.desc||""} onChange={e=>setForm({...form,desc:e.target.value})} style={css.input} /></div>
            <div><label style={css.label}>Type</label><select value={form.type||"running"} onChange={e=>setForm({...form,type:e.target.value})} style={css.input}><option value="advance">Advance</option><option value="running">Running</option><option value="final">Final</option></select></div>
            <div><label style={css.label}>Trigger</label><select value={form.trigger||""} onChange={e=>setForm({...form,trigger:e.target.value})} style={css.input}><option value="">Select...</option>{Object.entries(triggerLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
            <div><label style={css.label}>Basis</label><select value={form.basis||"percent"} onChange={e=>setForm({...form,basis:e.target.value})} style={css.input}><option value="percent">% of Order</option><option value="fixed">Fixed Amount</option></select></div>
            <div><label style={css.label}>{form.basis==="percent"?"Percentage (%)":"Amount (₹)"}</label><input type="number" value={form.value||""} onChange={e=>setForm({...form,value:+e.target.value})} style={css.input} /></div>
            <div><label style={css.label}>GST %</label><select value={form.gstPct??18} onChange={e=>setForm({...form,gstPct:+e.target.value})} style={css.input}><option value={0}>0%</option><option value={5}>5%</option><option value={12}>12%</option><option value={18}>18%</option></select></div>
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:12 }}><button onClick={()=>setModal(null)} style={css.btn.secondary}>Cancel</button><button onClick={saveMs} style={css.btn.primary}>Save Milestone</button></div>
        </Modal>
      )}
      {invoiceModal && (
        <Modal title="Raise Invoice Against Milestone" onClose={()=>setInvoiceModal(null)} width={480}>
          <div style={{ fontSize:12, color:T.textMid, marginBottom:16 }}>{ms.find(m=>m.id===invoiceModal)?.desc}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div><label style={css.label}>Invoice No</label><input value={invForm.invoiceNo||""} onChange={e=>setInvForm({...invForm,invoiceNo:e.target.value})} style={css.input} placeholder="SF/INV/2025/001" /></div>
            <div><label style={css.label}>Qty ({order.orderUnit})</label><input type="number" value={invForm.qty||""} onChange={e=>setInvForm({...invForm,qty:+e.target.value,amount:(+e.target.value)*(invForm.ratePerUnit||order.ratePerUnit||0)})} style={css.input} /></div>
            <div><label style={css.label}>Rate per Unit (₹)</label><input type="number" value={invForm.ratePerUnit||order.ratePerUnit||""} onChange={e=>setInvForm({...invForm,ratePerUnit:+e.target.value,amount:(invForm.qty||0)*(+e.target.value)})} style={css.input} /></div>
            <div><label style={css.label}>Amount (₹) — Auto</label><input value={fmt.currency(invForm.amount||0)} disabled style={{ ...css.input, opacity:0.7, color:T.green }} /></div>
            <div style={{ gridColumn:"span 2" }}><label style={css.label}>Remarks</label><textarea value={invForm.remarks||""} onChange={e=>setInvForm({...invForm,remarks:e.target.value})} style={{ ...css.input, minHeight:60, resize:"vertical" }} /></div>
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:12 }}><button onClick={()=>setInvoiceModal(null)} style={css.btn.secondary}>Cancel</button><button onClick={()=>saveInvoice(invoiceModal)} style={css.btn.primary}>Raise Invoice</button></div>
        </Modal>
      )}
    </div>
  );
};
const TabDrawings = ({ order, onChange, canEdit }) => {
  const [modal, setModal] = useState(null); const [form, setForm] = useState({}); const [expandRev, setExpandRev] = useState(null);
  const [importModal, setImportModal] = useState(false); const [importRows, setImportRows] = useState([]); const [importErr, setImportErr] = useState(""); const [importMode, setImportMode] = useState("append");
  const fileRef = useRef(null);
  const drawings = order.drawings||[];
  const byPhase = drawings.reduce((acc,d)=>{ const k=`Phase ${d.phase||1}`; if(!acc[k]) acc[k]=[]; acc[k].push(d); return acc; },{});
  Object.keys(byPhase).forEach(k=>byPhase[k].sort((a,b)=>(a.priority||1)-(b.priority||1)));
  const totalWt = drawings.reduce((s,d)=>s+(d.totalWt||0),0);
  const receivedWt = drawings.filter(d=>d.receivedDate).reduce((s,d)=>s+(d.totalWt||0),0);
  const saveDrawing = () => { const twc=(form.qty||0)*(form.unitWt||0); const updated=modal==="add"?[...drawings,{...form,id:`D-${Date.now()}`,totalWt:twc,status:form.receivedDate?"active":"pending",revHistory:[{rev:form.revNo||"A",date:form.drawingDate||"",note:"Initial issue"}]}]:drawings.map(d=>d.id===form.id?{...d,...form,totalWt:twc}:d); onChange({...order,drawings:updated}); setModal(null); };
  const saveRevision = () => { const updated=drawings.map(d=>d.id===form.id?{...d,revNo:form.revNo||d.revNo,drawingDate:form.drawingDate||d.drawingDate,receivedDate:form.receivedDate||d.receivedDate,driveLink:form.driveLink||d.driveLink,status:"active",revHistory:[...(d.revHistory||[]).map(r=>r.rev===d.revNo?{...r,superseded:true}:r),{rev:form.revNo,date:form.drawingDate,note:form.note,superseded:false}]}:d); onChange({...order,drawings:updated}); setModal(null); };

  // ── Drawing Register column spec (matches MRP Sheet 1) ──
  const DRG_COLS = [
    { key:"drawingNo",    hdr:"Drawing No",      required:true,  hint:"e.g. TPL-JETTY-COL-01" },
    { key:"title",        hdr:"Title",            required:true,  hint:"e.g. Main Column Type A" },
    { key:"qty",          hdr:"Qty",              required:true,  hint:"Number of assemblies" },
    { key:"unitWt",       hdr:"Unit Wt (kg)",     required:true,  hint:"Weight of 1 assembly in kg" },
    { key:"totalWt",      hdr:"Total Wt (kg)",    required:false, hint:"Auto = Qty × Unit Wt. Leave blank." },
    { key:"revNo",        hdr:"Rev No",           required:false, hint:"e.g. A, B, C" },
    { key:"drawingDate",  hdr:"Drawing Date",     required:false, hint:"DD-MM-YYYY" },
    { key:"receivedDate", hdr:"Received Date",    required:false, hint:"DD-MM-YYYY. Blank = pending." },
    { key:"phase",        hdr:"Phase",            required:true,  hint:"1, 2, 3 …" },
    { key:"priority",     hdr:"Priority",         required:true,  hint:"1 = highest within phase" },
    { key:"driveLink",    hdr:"Drive Link",       required:false, hint:"Google Drive URL" },
    { key:"remarks",      hdr:"Remarks",          required:false, hint:"Any notes" },
  ];

  const downloadTemplate = () => {
    const header = DRG_COLS.map(c=>c.hdr);
    const hints  = DRG_COLS.map(c=>c.hint);
    const sample = ["DRG-001","Sample Drawing",4,850.5,"","A","01-01-2025","15-01-2025",1,1,"https://drive.google.com/...",""];
    const rows = [header, hints, sample];
    const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`drawing_register_template_${order.id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const parseDate = (v) => {
    if(!v) return "";
    const s = String(v).trim();
    // DD-MM-YYYY or DD/MM/YYYY
    const m1 = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if(m1) return `${m1[3]}-${m1[2].padStart(2,"0")}-${m1[1].padStart(2,"0")}`;
    // Excel serial number
    if(/^\d+$/.test(s)){ const d=new Date(Math.round((+s-25569)*86400*1000)); return d.toISOString().slice(0,10); }
    // ISO
    if(s.match(/^\d{4}-\d{2}-\d{2}/)) return s.slice(0,10);
    return "";
  };

  const handleFile = async (e) => {
    setImportErr(""); setImportRows([]);
    const file = e.target.files[0]; if(!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    try {
      if(ext==="csv") {
        const text = await file.text();
        const lines = text.split("\n").map(l=>l.split(",").map(v=>v.trim().replace(/^"|"$/g,"").replace(/""/g,'"')));
        // find header row
        const hdrIdx = lines.findIndex(l=>l.some(c=>c.toLowerCase().includes("drawing no")||c.toLowerCase().includes("drawing_no")));
        if(hdrIdx<0){ setImportErr("Could not find header row. Make sure one row contains 'Drawing No'."); return; }
        const hdrs = lines[hdrIdx].map(h=>h.toLowerCase().trim());
        const colMap = {};
        DRG_COLS.forEach(c=>{ const idx=hdrs.findIndex(h=>h.includes(c.hdr.toLowerCase().split(" ")[0].toLowerCase())||h===c.key.toLowerCase()); if(idx>=0) colMap[c.key]=idx; });
        const rows = lines.slice(hdrIdx+1).filter(l=>l.some(v=>v.trim())).map((l,i)=>{
          const obj={};
          DRG_COLS.forEach(c=>{ if(colMap[c.key]!==undefined) obj[c.key]=l[colMap[c.key]]||""; });
          return obj;
        }).filter(r=>r.drawingNo);
        if(rows.length===0){ setImportErr("No data rows found after header."); return; }
        // parse & validate
        const parsed = rows.map((r,i)=>({
          id:`D-IMP-${Date.now()}-${i}`,
          drawingNo: r.drawingNo?.trim(),
          title: r.title?.trim()||"",
          qty: parseFloat(r.qty)||0,
          unitWt: parseFloat(r.unitWt)||0,
          totalWt: parseFloat(r.totalWt)||((parseFloat(r.qty)||0)*(parseFloat(r.unitWt)||0)),
          revNo: r.revNo?.trim()||"A",
          drawingDate: parseDate(r.drawingDate),
          receivedDate: parseDate(r.receivedDate),
          phase: parseInt(r.phase)||1,
          priority: parseInt(r.priority)||1,
          driveLink: r.driveLink?.trim()||"",
          remarks: r.remarks?.trim()||"",
          status: parseDate(r.receivedDate)?"active":"pending",
          revHistory:[{rev:r.revNo?.trim()||"A",date:parseDate(r.drawingDate)||"",note:"Imported"}],
        }));
        const errs = parsed.filter(r=>!r.drawingNo||!r.qty||!r.unitWt);
        if(errs.length>0){ setImportErr(`${errs.length} row(s) missing Drawing No, Qty or Unit Wt. Please fix and re-upload.`); return; }
        setImportRows(parsed);
      } else {
        setImportErr("Please upload a CSV file. Save your Excel as CSV (File → Save As → CSV) before importing.");
      }
    } catch(err){ setImportErr("Error reading file: "+err.message); }
  };

  const confirmImport = () => {
    const base = importMode==="replace" ? [] : drawings;
    const newIds = new Set(importRows.map(r=>r.drawingNo));
    const merged = [...base.filter(d=>!newIds.has(d.drawingNo)), ...importRows];
    onChange({...order, drawings:merged});
    setImportModal(false); setImportRows([]); fileRef.current.value="";
  };
  return (
    <div>
      <DrawingReleaseBanner order={order} />
      <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }}>
        <StatCard label="Total Drawings" value={drawings.length} color={T.text} />
        <StatCard label="Received" value={drawings.filter(d=>d.receivedDate).length} sub={`${(receivedWt/1000).toFixed(1)}T`} color={T.green} />
        <StatCard label="Pending" value={drawings.filter(d=>!d.receivedDate).length} sub={`${((totalWt-receivedWt)/1000).toFixed(1)}T`} color={T.amber} />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.text }}>Drawing Register</div>
        {canEdit && <div style={{ display:"flex", gap:8 }}>
          <button onClick={downloadTemplate} style={css.btn.secondary}>⬇ Download Template</button>
          <button onClick={()=>setImportModal(true)} style={css.btn.amber}>📥 Import from Excel/CSV</button>
          <button onClick={()=>{setForm({phase:1,priority:1,revNo:"A",status:"pending"});setModal("add");}} style={css.btn.primary}>+ Add Drawing</button>
        </div>}
      </div>
      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept=".csv" style={{display:"none"}} onChange={handleFile} />

      <div style={{ overflowX:"auto" }}>
        {Object.entries(byPhase).sort().map(([phase,pDrawings])=>(
          <div key={phase} style={{ marginBottom:24 }}>
            <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:8 }}>
              <span style={{ background:T.accent, color:"#fff", borderRadius:5, padding:"3px 10px", fontSize:12, fontWeight:700 }}>{phase}</span>
              <span style={{ fontSize:12, color:T.textMid }}>{pDrawings.length} drawing(s) · {(pDrawings.reduce((s,d)=>s+(d.totalWt||0),0)/1000).toFixed(2)} T</span>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead><tr>{["Pri","Drawing No","Title","Qty","Unit Wt","Total Wt","Rev","Drg Date","Received","File","Status","Revisions",""].map(h=><th key={h} style={{ padding:"7px 10px", textAlign:"left", fontSize:10, fontWeight:700, color:T.textMid, textTransform:"uppercase", borderBottom:`2px solid ${T.borderHi}`, background:T.bgInput, whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
              <tbody>
                {pDrawings.map((d,i)=>(
                  <>
                    <tr key={d.id} style={{ background:i%2===0?"transparent":T.bg, borderLeft:`3px solid ${d.receivedDate?T.green:T.amber}` }}>
                      <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}><Badge color="blue">P{d.priority||1}</Badge></td>
                      <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono, fontSize:12, fontWeight:700, color:T.accentHi, whiteSpace:"nowrap" }}>{d.drawingNo}</td>
                      <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, maxWidth:220 }}>{d.title}</td>
                      <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, textAlign:"center", fontFamily:T.fontMono }}>{d.qty}</td>
                      <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, textAlign:"right", fontFamily:T.fontMono }}>{fmt.num(d.unitWt)}</td>
                      <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, textAlign:"right", fontFamily:T.fontMono, color:T.green, fontWeight:700 }}>{fmt.num(d.totalWt)}</td>
                      <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, textAlign:"center" }}><Badge color="gray">Rev {d.revNo}</Badge></td>
                      <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, color:T.textMid, whiteSpace:"nowrap" }}>{fmt.date(d.drawingDate)}</td>
                      <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, color:d.receivedDate?T.green:T.amber, whiteSpace:"nowrap" }}>{d.receivedDate?fmt.date(d.receivedDate):"⏳ Pending"}</td>
                      <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}>{d.driveLink?<a href={d.driveLink} target="_blank" rel="noreferrer" style={{ ...css.btn.sm, textDecoration:"none", background:T.greenLo, color:T.green, padding:"3px 8px" }}>View</a>:<span style={{ fontSize:11, color:T.textLow }}>—</span>}</td>
                      <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}><Badge color={d.receivedDate?"green":"amber"}>{d.receivedDate?"Received":"Pending"}</Badge></td>
                      <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}>{(d.revHistory||[]).length>0&&<button onClick={()=>setExpandRev(expandRev===d.id?null:d.id)} style={{ ...css.btn.ghost, fontSize:11, padding:"2px 8px", color:T.accent, border:`1px solid ${T.border}`, borderRadius:4 }}>{expandRev===d.id?"▲":"▼"} {d.revHistory.length} rev</button>}</td>
                      <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}><div style={{ display:"flex", gap:6 }}>{canEdit&&<button onClick={()=>{setForm({...d});setModal("edit");}} style={{ ...css.btn.ghost, fontSize:11, padding:"3px 8px" }}>Edit</button>}{canEdit&&<button onClick={()=>{setForm({...d,oldRevNo:d.revNo,revNo:"",drawingDate:"",receivedDate:"",note:""});setModal("revise");}} style={{ ...css.btn.ghost, fontSize:11, padding:"3px 8px", color:T.amber }}>Revise</button>}</div></td>
                    </tr>
                    {expandRev===d.id&&<tr key={`${d.id}-rev`}><td colSpan={14} style={{ padding:"0 10px 10px 40px", background:T.bgInput, borderBottom:`1px solid ${T.border}` }}>
                      <div style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", padding:"8px 0 6px" }}>Revision History</div>
                      <table style={{ borderCollapse:"collapse", width:"100%" }}><thead><tr>{["Rev","Date","Note","Status"].map(h=><th key={h} style={{ padding:"4px 10px", textAlign:"left", fontSize:10, fontWeight:700, color:T.textLow, textTransform:"uppercase", borderBottom:`1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                      <tbody>{(d.revHistory||[]).map((r,ri)=><tr key={ri} style={{ opacity:r.superseded?0.5:1 }}><td style={{ padding:"5px 10px", fontFamily:T.fontMono, fontWeight:700, color:r.superseded?T.textLow:T.green }}>{r.rev}</td><td style={{ padding:"5px 10px", color:T.textMid }}>{fmt.date(r.date)}</td><td style={{ padding:"5px 10px", color:T.text }}>{r.note}</td><td style={{ padding:"5px 10px" }}>{r.superseded?<Badge color="gray">Superseded</Badge>:<Badge color="green">Current</Badge>}</td></tr>)}</tbody></table>
                    </td></tr>}
                  </>
                ))}
                <tr style={{ background:T.bgInput }}><td colSpan={4} style={{ padding:"6px 10px", fontSize:11, fontWeight:700, color:T.textMid }}>Phase Total ({pDrawings.length})</td><td /><td style={{ padding:"6px 10px", textAlign:"right", fontFamily:T.fontMono, fontWeight:700, color:T.accent }}>{fmt.num(pDrawings.reduce((s,d)=>s+(d.totalWt||0),0))} kg</td><td colSpan={7} /></tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>
      {(modal==="add"||modal==="edit")&&<Modal title={modal==="add"?"Add Drawing":"Edit Drawing"} onClose={()=>setModal(null)} width={700}><div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}><div><label style={css.label}>Drawing No</label><input value={form.drawingNo||""} onChange={e=>setForm({...form,drawingNo:e.target.value})} style={css.input} /></div><div style={{ gridColumn:"span 1" }}><label style={css.label}>Title</label><input value={form.title||""} onChange={e=>setForm({...form,title:e.target.value})} style={css.input} /></div><div><label style={css.label}>Qty</label><input type="number" value={form.qty||""} onChange={e=>setForm({...form,qty:+e.target.value,totalWt:(+e.target.value)*(form.unitWt||0)})} style={css.input} /></div><div><label style={css.label}>Unit Wt (kg)</label><input type="number" value={form.unitWt||""} onChange={e=>setForm({...form,unitWt:+e.target.value,totalWt:(form.qty||0)*(+e.target.value)})} style={css.input} /></div><div><label style={css.label}>Rev No</label><input value={form.revNo||""} onChange={e=>setForm({...form,revNo:e.target.value})} style={css.input} placeholder="A" /></div><div><label style={css.label}>Drawing Date</label><input type="date" value={form.drawingDate||""} onChange={e=>setForm({...form,drawingDate:e.target.value})} style={css.input} /></div><div><label style={css.label}>Received Date</label><input type="date" value={form.receivedDate||""} onChange={e=>setForm({...form,receivedDate:e.target.value})} style={css.input} /></div><div><label style={css.label}>Phase</label><select value={form.phase||1} onChange={e=>setForm({...form,phase:+e.target.value})} style={css.input}>{[1,2,3,4,5].map(n=><option key={n} value={n}>Phase {n}</option>)}</select></div><div><label style={css.label}>Priority</label><select value={form.priority||1} onChange={e=>setForm({...form,priority:+e.target.value})} style={css.input}>{[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>Priority {n}</option>)}</select></div><div><label style={css.label}>Drive Link</label><input value={form.driveLink||""} onChange={e=>setForm({...form,driveLink:e.target.value})} style={css.input} placeholder="https://drive.google.com/..." /></div></div><div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:12 }}><button onClick={()=>setModal(null)} style={css.btn.secondary}>Cancel</button><button onClick={saveDrawing} style={css.btn.primary}>Save Drawing</button></div></Modal>}
      {modal==="revise"&&<Modal title={`Revise — ${form.drawingNo}`} onClose={()=>setModal(null)} width={500}><div style={{ ...css.card, background:T.amberBg, border:`1px solid ${T.amber}`, marginBottom:14, fontSize:12, color:T.amber }}>Current Rev <strong>{form.oldRevNo}</strong> will be marked Superseded.</div><div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}><div><label style={css.label}>New Rev No</label><input value={form.revNo||""} onChange={e=>setForm({...form,revNo:e.target.value})} style={css.input} placeholder="B" /></div><div><label style={css.label}>Drawing Date</label><input type="date" value={form.drawingDate||""} onChange={e=>setForm({...form,drawingDate:e.target.value})} style={css.input} /></div><div><label style={css.label}>Received Date</label><input type="date" value={form.receivedDate||""} onChange={e=>setForm({...form,receivedDate:e.target.value})} style={css.input} /></div><div><label style={css.label}>Drive Link</label><input value={form.driveLink||""} onChange={e=>setForm({...form,driveLink:e.target.value})} style={css.input} /></div><div style={{ gridColumn:"span 2" }}><label style={css.label}>Revision Note</label><input value={form.note||""} onChange={e=>setForm({...form,note:e.target.value})} style={css.input} placeholder="e.g. Column dimensions revised" /></div></div><div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:12 }}><button onClick={()=>setModal(null)} style={css.btn.secondary}>Cancel</button><button onClick={saveRevision} style={{ ...css.btn.primary, background:T.amber }}>Save Revision</button></div></Modal>}

      {/* ── EXCEL IMPORT MODAL ── */}
      {importModal&&<Modal title="Import Drawing Register from Excel / CSV" onClose={()=>{setImportModal(false);setImportRows([]);setImportErr("");fileRef.current.value="";}} width={780}>
        {/* Step 1 - instructions */}
        <div style={{ ...css.card, background:"#0D1E3A", border:`1px solid ${T.borderHi}`, marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.accentHi, marginBottom:10 }}>How to Import</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, fontSize:12, color:T.textMid }}>
            <div><div style={{ color:T.accent, fontWeight:700, marginBottom:4 }}>Step 1</div>Click <strong style={{color:T.text}}>Download Template</strong> above to get a CSV file with the correct column headers.</div>
            <div><div style={{ color:T.accent, fontWeight:700, marginBottom:4 }}>Step 2</div>Open it in Excel. Fill your data. Keep the header row. <strong style={{color:T.text}}>Save as CSV</strong> (File → Save As → CSV UTF-8).</div>
            <div><div style={{ color:T.accent, fontWeight:700, marginBottom:4 }}>Step 3</div>Upload the CSV here. Preview the data. Choose append or replace. Confirm import.</div>
          </div>
        </div>

        {/* Column reference */}
        <div style={{ marginBottom:16, overflowX:"auto" }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Column Reference</div>
          <table style={{ borderCollapse:"collapse", fontSize:11, width:"100%" }}>
            <thead><tr>{["Column Header","Required?","Example / Notes"].map(h=><th key={h} style={{ padding:"5px 10px", textAlign:"left", background:T.bgInput, borderBottom:`1px solid ${T.border}`, color:T.textMid, fontWeight:700, textTransform:"uppercase", fontSize:10 }}>{h}</th>)}</tr></thead>
            <tbody>{DRG_COLS.map((c,i)=><tr key={c.key} style={{ background:i%2===0?"transparent":T.bg }}>
              <td style={{ padding:"5px 10px", fontFamily:T.fontMono, fontWeight:700, color:T.accentHi, borderBottom:`1px solid ${T.border}` }}>{c.hdr}</td>
              <td style={{ padding:"5px 10px", borderBottom:`1px solid ${T.border}` }}>{c.required?<Badge color="red">Required</Badge>:<Badge color="gray">Optional</Badge>}</td>
              <td style={{ padding:"5px 10px", color:T.textMid, borderBottom:`1px solid ${T.border}` }}>{c.hint}</td>
            </tr>)}</tbody>
          </table>
        </div>

        {/* File upload */}
        <div style={{ ...css.card, marginBottom:12 }}>
          <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
            <div>
              <div style={css.label}>Upload CSV File</div>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ color:T.text, fontSize:12 }} />
            </div>
            <div>
              <div style={css.label}>Import Mode</div>
              <div style={{ display:"flex", gap:12 }}>
                <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12, color:T.text }}><input type="radio" checked={importMode==="append"} onChange={()=>setImportMode("append")} /><span>Append (add to existing)</span></label>
                <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12, color:T.text }}><input type="radio" checked={importMode==="replace"} onChange={()=>setImportMode("replace")} /><span>Replace all drawings</span></label>
              </div>
              <div style={{ fontSize:11, color:T.textMid, marginTop:4 }}>Append skips rows where Drawing No already exists. Replace clears all current drawings first.</div>
            </div>
          </div>
          {importErr&&<div style={{ background:T.redBg, border:`1px solid ${T.redLo}`, borderRadius:6, padding:"8px 12px", color:T.red, fontSize:12, marginTop:10 }}>⚠ {importErr}</div>}
        </div>

        {/* Preview */}
        {importRows.length>0&&<div style={{ marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.green, marginBottom:8 }}>✓ {importRows.length} drawing(s) ready to import — preview:</div>
          <div style={{ overflowX:"auto", maxHeight:220, overflowY:"auto" }}>
            <table style={{ borderCollapse:"collapse", fontSize:11, width:"100%" }}>
              <thead><tr>{["Drawing No","Title","Qty","Unit Wt","Total Wt","Phase","Priority","Rev","Received"].map(h=><th key={h} style={{ padding:"5px 8px", background:T.bgInput, borderBottom:`1px solid ${T.border}`, color:T.textMid, fontWeight:700, textTransform:"uppercase", fontSize:10, whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
              <tbody>{importRows.map((r,i)=><tr key={i} style={{ background:i%2===0?"transparent":T.bg }}>
                <td style={{ padding:"5px 8px", fontFamily:T.fontMono, color:T.accentHi, borderBottom:`1px solid ${T.border}` }}>{r.drawingNo}</td>
                <td style={{ padding:"5px 8px", borderBottom:`1px solid ${T.border}` }}>{r.title}</td>
                <td style={{ padding:"5px 8px", fontFamily:T.fontMono, textAlign:"center", borderBottom:`1px solid ${T.border}` }}>{r.qty}</td>
                <td style={{ padding:"5px 8px", fontFamily:T.fontMono, textAlign:"right", borderBottom:`1px solid ${T.border}` }}>{r.unitWt}</td>
                <td style={{ padding:"5px 8px", fontFamily:T.fontMono, textAlign:"right", color:T.green, fontWeight:700, borderBottom:`1px solid ${T.border}` }}>{r.totalWt?.toFixed(1)}</td>
                <td style={{ padding:"5px 8px", textAlign:"center", borderBottom:`1px solid ${T.border}` }}><Badge color="blue">P{r.phase}</Badge></td>
                <td style={{ padding:"5px 8px", textAlign:"center", borderBottom:`1px solid ${T.border}` }}>{r.priority}</td>
                <td style={{ padding:"5px 8px", textAlign:"center", borderBottom:`1px solid ${T.border}` }}>{r.revNo}</td>
                <td style={{ padding:"5px 8px", borderBottom:`1px solid ${T.border}` }}>{r.receivedDate?<Badge color="green">{fmt.date(r.receivedDate)}</Badge>:<Badge color="amber">Pending</Badge>}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>}

        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button onClick={()=>{setImportModal(false);setImportRows([]);setImportErr("");fileRef.current.value="";}} style={css.btn.secondary}>Cancel</button>
          <button onClick={downloadTemplate} style={css.btn.secondary}>⬇ Download Template</button>
          <button onClick={confirmImport} disabled={importRows.length===0} style={{ ...css.btn.primary, opacity:importRows.length===0?0.4:1 }}>✓ Confirm Import ({importRows.length} rows)</button>
        </div>
      </Modal>}
    </div>
  );
};

// ─── TAB: DRAWING PART LIST ───────────────────────────────────────────────────
const TabParts = ({ order, onChange, canEdit, materials, stock }) => {
  const [modal, setModal] = useState(null); const [form, setForm] = useState({}); const [filterDrg, setFilterDrg] = useState("all");
  const [importModal, setImportModal] = useState(false); const [importRows, setImportRows] = useState([]); const [importErr, setImportErr] = useState(""); const [importMode, setImportMode] = useState("append");
  const fileRef2 = useRef(null);
  const parts = order.parts||[]; const drawings = order.drawings||[];
  const filtered = filterDrg==="all"?parts:parts.filter(p=>p.drawingId===filterDrg);
  const savePart = () => {
    const calcUnitWt = form.calcUnitWt||form.clientUnitWt||0;
    const calcTotalWt = calcUnitWt*(form.qtyPerDrg||0);
    const matCode = form.matCode || (form.section ? buildMatCode(form.section, form.matType, form.grade, form.size) : "");
    const finalForm = { ...form, calcUnitWt, calcTotalWt, matLibId:form.matLibId||"", matCode };
    const updated = modal==="add" ? [...parts,{...finalForm,id:`P-${Date.now()}`}] : parts.map(p=>p.id===form.id?finalForm:p);
    onChange({...order,parts:updated}); setModal(null);
  };
  const srcColor = {"Procure":"blue","Client Supply":"amber","Stock":"green"};

  // ── Part List column spec (matches MRP Sheet 2) ──
  const PART_COLS = [
    { key:"drawingNo",     hdr:"Drawing No",       required:true,  hint:"Must match a drawing in the register" },
    { key:"revNo",         hdr:"Rev No",           required:false, hint:"Drawing revision, e.g. A" },
    { key:"itemNo",        hdr:"Item No",          required:false, hint:"1, 2, 3 … within drawing" },
    { key:"markNo",        hdr:"Mark No",          required:true,  hint:"e.g. SBK-101, PL-001" },
    { key:"desc",          hdr:"Description",      required:true,  hint:"Part description" },
    { key:"fabType",       hdr:"Fab / Bought Out", required:true,  hint:"Fabricate or Bought Out" },
    { key:"matType",       hdr:"Material Type",    required:true,  hint:"MS, SS, etc." },
    { key:"grade",         hdr:"Grade",            required:true,  hint:"E250, E350, 304, etc." },
    { key:"section",       hdr:"Section Type",     required:true,  hint:"ISA, ISMB, PLATE, etc." },
    { key:"size",          hdr:"Size",             required:true,  hint:"e.g. 75x75x8, 10mm" },
    { key:"length",        hdr:"Length (mm)",      required:false, hint:"Length in mm" },
    { key:"width",         hdr:"Width (mm)",       required:false, hint:"Width in mm (plates only)" },
    { key:"qtyPerDrg",     hdr:"Qty per Drawing",  required:true,  hint:"Number of pieces per drawing" },
    { key:"clientUnitWt",  hdr:"Client Unit Wt",   required:false, hint:"kg — from client drawing" },
    { key:"clientTotalWt", hdr:"Client Total Wt",  required:false, hint:"kg — leave blank for auto" },
    { key:"jointsAllowed", hdr:"Joints Allowed",   required:false, hint:"Yes or No" },
    { key:"source",        hdr:"Source",           required:false, hint:"Procure / Client Supply / Stock" },
    { key:"partLink",      hdr:"Part Drawing Link",required:false, hint:"Drive URL" },
    { key:"remarks",       hdr:"Remarks",          required:false, hint:"Any notes" },
  ];

  const downloadTemplate = () => {
    const header = PART_COLS.map(c=>c.hdr);
    const hints  = PART_COLS.map(c=>c.hint);
    const sample = ["DRG-001","A",1,"SBK-101","BRACKET ANGLE","Fabricate","MS","E250","ISA","75x75x8",150,75,80,1.335,106.8,"No","Procure","",""];
    const rows = [header, hints, sample];
    const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`drawing_part_list_template_${order.id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (e) => {
    setImportErr(""); setImportRows([]);
    const file = e.target.files[0]; if(!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    try {
      if(ext==="csv") {
        const text = await file.text();
        const lines = text.split("\n").map(l=>l.split(",").map(v=>v.trim().replace(/^"|"$/g,"").replace(/""/g,'"')));
        const hdrIdx = lines.findIndex(l=>l.some(c=>c.toLowerCase().includes("mark no")||c.toLowerCase().includes("markno")||c.toLowerCase().includes("mark_no")));
        if(hdrIdx<0){ setImportErr("Could not find header row. Make sure one row contains 'Mark No'."); return; }
        const hdrs = lines[hdrIdx].map(h=>h.toLowerCase().trim());
        const colMap = {};
        PART_COLS.forEach(c=>{
          const variants = [c.key.toLowerCase(), c.hdr.toLowerCase(), c.hdr.toLowerCase().replace(/ /g,"_"), c.hdr.toLowerCase().split(" ").slice(0,2).join(" ")];
          const idx = hdrs.findIndex(h=>variants.some(v=>h===v||h.includes(v)));
          if(idx>=0) colMap[c.key]=idx;
        });
        const rows = lines.slice(hdrIdx+1).filter(l=>l.some(v=>v.trim())).map((l,i)=>{
          const obj={}; PART_COLS.forEach(c=>{ if(colMap[c.key]!==undefined) obj[c.key]=l[colMap[c.key]]||""; }); return obj;
        }).filter(r=>r.markNo||r.drawingNo);
        if(rows.length===0){ setImportErr("No data rows found after header."); return; }
        const parsed = rows.map((r,i)=>{
          const drgNo = r.drawingNo?.trim();
          const drg = drawings.find(d=>d.drawingNo===drgNo);
          const qty = parseFloat(r.qtyPerDrg)||0;
          const cuw = parseFloat(r.clientUnitWt)||0;
          const ctw = parseFloat(r.clientTotalWt)||(cuw*qty);
          const sec = r.section?.trim()||""; const sz = r.size?.trim()||""; const grd = r.grade?.trim()||"E250";
          const libMatch = (materials||[]).find(m=>m.sectionType.toLowerCase()===sec.toLowerCase()&&m.size.toLowerCase()===sz.toLowerCase()&&m.grade.toLowerCase()===grd.toLowerCase());
          return {
            id:`P-IMP-${Date.now()}-${i}`,
            drawingId: drg?.id||"",
            drawingNo: drgNo,
            revNo: r.revNo?.trim()||"A",
            itemNo: parseInt(r.itemNo)||i+1,
            markNo: r.markNo?.trim()||"",
            desc: r.desc?.trim()||"",
            fabType: r.fabType?.includes("Bought")||r.fabType?.toLowerCase()==="bought out"?"Bought Out":"Fabricate",
            matType: r.matType?.trim()||"MS",
            grade: grd,
            section: sec,
            size: sz,
            matLibId: libMatch?.id||"",
            matCode: libMatch?.matCode||buildMatCode(sec, r.matType?.trim()||"MS", grd, sz),
            length: parseFloat(r.length)||0,
            width: parseFloat(r.width)||0,
            qtyPerDrg: qty,
            clientUnitWt: cuw,
            clientTotalWt: ctw,
            calcUnitWt: cuw,
            calcTotalWt: ctw,
            jointsAllowed: r.jointsAllowed?.toLowerCase()==="yes",
            source: ["Procure","Client Supply","Stock"].find(s=>s.toLowerCase()===r.source?.toLowerCase())||"Procure",
            partLink: r.partLink?.trim()||"",
            remarks: r.remarks?.trim()||"",
            _drgMatched: !!drg,
            _libMatched: !!libMatch,
          };
        });
        const errs = parsed.filter(r=>!r.markNo||!r.qtyPerDrg);
        if(errs.length>0){ setImportErr(`${errs.length} row(s) missing Mark No or Qty. Please fix.`); return; }
        const unmatched = parsed.filter(r=>!r._drgMatched).length;
        const unmatchedLib = parsed.filter(r=>r.section&&!r._libMatched).length;
        const warns = [];
        if(unmatched>0) warns.push(`${unmatched} row(s) have Drawing No not found in Drawing Register — they will still import but won't link to a drawing.`);
        if(unmatchedLib>0) warns.push(`${unmatchedLib} row(s) have material (section/size/grade) not found in Materials Library — library match not found, check spelling.`);
        setImportErr(warns.length ? "⚠ Warning: "+warns.join(" ") : "");
        setImportRows(parsed);
      } else {
        setImportErr("Please upload a CSV file. Save your Excel as CSV (File → Save As → CSV) before importing.");
      }
    } catch(err){ setImportErr("Error reading file: "+err.message); }
  };

  const confirmImport = () => {
    const base = importMode==="replace"?[]:parts;
    const newKeys = new Set(importRows.map(r=>`${r.drawingNo}__${r.markNo}`));
    const merged = [...base.filter(p=>!newKeys.has(`${drawings.find(d=>d.id===p.drawingId)?.drawingNo}__${p.markNo}`)), ...importRows];
    onChange({...order, parts:merged});
    setImportModal(false); setImportRows([]); setImportErr(""); fileRef2.current.value="";
  };

  return (
    <div>
      <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }}>
        <StatCard label="Total Parts" value={parts.length} color={T.text} />
        <StatCard label="Fabricate" value={parts.filter(p=>p.fabType==="Fabricate").length} color={T.accent} />
        <StatCard label="Bought Out" value={parts.filter(p=>p.fabType==="Bought Out").length} color={T.textMid} />
        <StatCard label="Client Wt" value={`${(parts.reduce((s,p)=>s+(p.clientTotalWt||0),0)/1000).toFixed(2)}T`} color={T.amber} />
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:14, justifyContent:"space-between", flexWrap:"wrap" }}>
        <select value={filterDrg} onChange={e=>setFilterDrg(e.target.value)} style={{ ...css.input, width:280 }}><option value="all">All Drawings ({parts.length} parts)</option>{drawings.map(d=><option key={d.id} value={d.id}>{d.drawingNo} — {parts.filter(p=>p.drawingId===d.id).length} parts</option>)}</select>
        {canEdit&&<div style={{ display:"flex", gap:8 }}>
          <button onClick={downloadTemplate} style={css.btn.secondary}>⬇ Download Template</button>
          <button onClick={()=>setImportModal(true)} style={css.btn.amber}>📥 Import from Excel/CSV</button>
          <button onClick={()=>{setForm({fabType:"Fabricate",matType:"MS",grade:"E250",source:"Procure",jointsAllowed:false,drawingId:filterDrg!=="all"?filterDrg:"",matLibId:"",matCode:""});setModal("add");}} style={css.btn.primary}>+ Add Part</button>
        </div>}
      </div>
      {/* Hidden file input */}
      <input ref={fileRef2} type="file" accept=".csv" style={{display:"none"}} onChange={handleFile} />
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead><tr>{["Item","Drawing","Mark No","Description","Fab/BO","Material Code","L(mm)","Qty","Client Wt","Calc Wt","Joints","Source","Coverage",""].map(h=><th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:10, fontWeight:700, color:T.textMid, textTransform:"uppercase", borderBottom:`1px solid ${T.border}`, whiteSpace:"nowrap", background:T.bg }}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.length===0?<tr><td colSpan={14} style={{ padding:32, textAlign:"center", color:T.textLow }}>No parts found</td></tr>:filtered.map((p,i)=>{
              const drg=drawings.find(d=>d.id===p.drawingId);
              const dispCode = p.matCode || (p.section ? `${p.section} ${p.size}` : "—");
              // Coverage computation for Fabricate+Procure parts
              const showCoverage = p.fabType==="Fabricate" && p.source==="Procure";
              let covBadge = null;
              if (showCoverage) {
                const reqWt = (p.calcTotalWt||p.clientTotalWt||0) * (drg?.qty||1);
                const allocWt = (stock||[]).reduce((sum,s)=>{
                  const matMatch = p.matCode ? s.matCode===p.matCode : (s.section===p.section&&s.size===p.size&&s.grade===p.grade);
                  if (!matMatch) return sum;
                  return sum + (s.allocations||[]).filter(a=>a.drawingId===p.drawingId&&a.markNo===p.markNo).reduce((a,x)=>a+(x.wt||0),0);
                },0);
                const short = Math.max(0, reqWt - allocWt);
                if (allocWt===0) covBadge = <Badge color="red">None</Badge>;
                else if (short<=0) covBadge = <Badge color="green">Covered</Badge>;
                else covBadge = <Badge color="amber">{fmt.num(Math.round(short))} kg short</Badge>;
              }
              return <tr key={p.id} style={{ background:i%2===0?"transparent":T.bg }}>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono, fontSize:11, color:T.textMid }}>{p.itemNo}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontSize:11, color:T.accentHi, fontFamily:T.fontMono, whiteSpace:"nowrap" }}>{drg?.drawingNo||"—"}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontWeight:700 }}>{p.markNo}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, maxWidth:180 }}>{p.desc}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}><Badge color={p.fabType==="Fabricate"?"blue":"gray"}>{p.fabType==="Fabricate"?"Fab":"B/O"}</Badge></td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono, fontSize:11, color:p.matLibId?T.accentHi:T.textMid }}>{dispCode}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono, textAlign:"right" }}>{fmt.num(p.length)}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono, textAlign:"center" }}>{p.qtyPerDrg}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono, color:T.amber, textAlign:"right" }}>{p.clientTotalWt?.toFixed(2)}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono, color:T.green, textAlign:"right" }}>{p.calcTotalWt?.toFixed(2)}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}><Badge color={p.jointsAllowed?"amber":"gray"}>{p.jointsAllowed?"Yes":"No"}</Badge></td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}><Badge color={srcColor[p.source]||"gray"}>{p.source}</Badge></td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}>{covBadge||<span style={{ color:T.textLow, fontSize:11 }}>—</span>}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}>{canEdit&&<button onClick={()=>{setForm({...p});setModal("edit");}} style={css.btn.ghost}>Edit</button>}</td>
              </tr>;
            })}
          </tbody>
          {filtered.length>0&&<tfoot><tr><td colSpan={8} style={{ padding:"8px 10px", borderTop:`1px solid ${T.borderHi}`, fontSize:12, fontWeight:700, color:T.textMid }}>TOTALS ({filtered.length} parts)</td><td style={{ padding:"8px 10px", borderTop:`1px solid ${T.borderHi}`, fontFamily:T.fontMono, fontWeight:700, color:T.amber, textAlign:"right" }}>{filtered.reduce((s,p)=>s+(p.clientTotalWt||0),0).toFixed(2)}</td><td style={{ padding:"8px 10px", borderTop:`1px solid ${T.borderHi}`, fontFamily:T.fontMono, fontWeight:700, color:T.green, textAlign:"right" }}>{filtered.reduce((s,p)=>s+(p.calcTotalWt||0),0).toFixed(2)}</td><td colSpan={4}/></tr></tfoot>}
        </table>
      </div>
      {modal&&<Modal title={modal==="add"?"Add Part":"Edit Part"} onClose={()=>setModal(null)} width={760}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <MField label="Drawing">
            <select value={form.drawingId||""} onChange={e=>setForm(f=>({...f,drawingId:e.target.value}))} style={css.input}>
              <option value="">Select...</option>{drawings.map(d=><option key={d.id} value={d.id}>{d.drawingNo}</option>)}
            </select>
          </MField>
          <MField label="Item No"><input type="number" value={form.itemNo||""} onChange={e=>setForm(f=>({...f,itemNo:+e.target.value}))} style={css.input} /></MField>
          <MField label="Mark No *"><input value={form.markNo||""} onChange={e=>setForm(f=>({...f,markNo:e.target.value}))} style={css.input} /></MField>
          <MField label="Description"><input value={form.desc||""} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} style={css.input} /></MField>
          <MField label="Fab / Bought Out">
            <select value={form.fabType||"Fabricate"} onChange={e=>setForm(f=>({...f,fabType:e.target.value}))} style={css.input}>
              <option>Fabricate</option><option>Bought Out</option>
            </select>
          </MField>
          <MField label="Source">
            <select value={form.source||"Procure"} onChange={e=>setForm(f=>({...f,source:e.target.value}))} style={css.input}>
              <option>Procure</option><option>Stock</option><option>Client Supply</option>
            </select>
          </MField>
          {/* Material selector — full width */}
          <div style={{ gridColumn:"span 2" }}>
            <MField label="Material">
              <select value={form.matLibId||"__ns__"} onChange={e=>{
                if (e.target.value==="__ns__") { setForm(f=>({...f,matLibId:"",matCode:""})); }
                else { const m=(materials||[]).find(x=>x.id===e.target.value); if(m) setForm(f=>({...f,matLibId:m.id,matCode:m.matCode,section:m.sectionType,size:m.size,grade:m.grade,matType:m.matType})); }
              }} style={css.input}>
                <option value="__ns__">— Non-standard / not in library —</option>
                {(materials||[]).filter(m=>m.active).map(m=>(
                  <option key={m.id} value={m.id}>{m.sectionType} {m.size} — {m.grade} ({m.wtPerMetre?`${m.wtPerMetre} kg/m`:`${m.wtPerM2} kg/m²`})</option>
                ))}
              </select>
            </MField>
            {form.matLibId&&<div style={{ fontFamily:T.fontMono, fontSize:13, color:T.accentHi, fontWeight:700, marginTop:4 }}>{form.matCode}</div>}
          </div>
          {/* Free-text fallback for non-standard material */}
          {!form.matLibId&&<>
            <MField label="Mat Type"><select value={form.matType||"MS"} onChange={e=>setForm(f=>({...f,matType:e.target.value}))} style={css.input}><option>MS</option><option>SS</option><option>AL</option></select></MField>
            <MField label="Grade"><input value={form.grade||""} onChange={e=>setForm(f=>({...f,grade:e.target.value}))} style={css.input} placeholder="E250, E350..." /></MField>
            <MField label="Section"><input value={form.section||""} onChange={e=>setForm(f=>({...f,section:e.target.value}))} style={css.input} placeholder="ISA, ISMC..." /></MField>
            <MField label="Size"><input value={form.size||""} onChange={e=>setForm(f=>({...f,size:e.target.value}))} style={css.input} /></MField>
          </>}
          <MField label="Length (mm)"><input type="number" value={form.length||""} onChange={e=>setForm(f=>({...f,length:+e.target.value}))} style={css.input} /></MField>
          <MField label="Qty Per Drawing *"><input type="number" value={form.qtyPerDrg||""} onChange={e=>setForm(f=>({...f,qtyPerDrg:+e.target.value}))} style={css.input} /></MField>
          <MField label="Client Unit Wt (kg)"><input type="number" value={form.clientUnitWt||""} onChange={e=>setForm(f=>({...f,clientUnitWt:+e.target.value,clientTotalWt:(+e.target.value)*(form.qtyPerDrg||0)}))} style={css.input} /></MField>
          <MField label="Joints Allowed"><select value={form.jointsAllowed?"yes":"no"} onChange={e=>setForm(f=>({...f,jointsAllowed:e.target.value==="yes"}))} style={css.input}><option value="no">No</option><option value="yes">Yes</option></select></MField>
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:12 }}>
          <button onClick={()=>setModal(null)} style={css.btn.secondary}>Cancel</button>
          <button onClick={savePart} style={css.btn.primary}>Save Part</button>
        </div>
      </Modal>}

      {/* ── PARTS IMPORT MODAL ── */}
      {importModal&&<Modal title="Import Drawing Part List from Excel / CSV" onClose={()=>{setImportModal(false);setImportRows([]);setImportErr("");fileRef2.current.value="";}} width={800}>
        <div style={{ ...css.card, background:"#0D1E3A", border:`1px solid ${T.borderHi}`, marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.accentHi, marginBottom:10 }}>How to Import</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, fontSize:12, color:T.textMid }}>
            <div><div style={{ color:T.accent, fontWeight:700, marginBottom:4 }}>Step 1</div>Click <strong style={{color:T.text}}>Download Template</strong> to get the CSV with correct columns. These match the MRP Sheet 2 format exactly.</div>
            <div><div style={{ color:T.accent, fontWeight:700, marginBottom:4 }}>Step 2</div>Open in Excel. Your client's part list may already have most columns — just add the ERP columns (Fab/BO, Source, Joints Allowed) and <strong style={{color:T.text}}>save as CSV</strong>.</div>
            <div><div style={{ color:T.accent, fontWeight:700, marginBottom:4 }}>Step 3</div>Upload here. <strong style={{color:T.text}}>Import drawings first</strong> so parts can link to them by Drawing No. Preview, then confirm.</div>
          </div>
        </div>

        <div style={{ marginBottom:16, overflowX:"auto" }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Column Reference</div>
          <table style={{ borderCollapse:"collapse", fontSize:11, width:"100%" }}>
            <thead><tr>{["Column Header","Required?","Example / Notes"].map(h=><th key={h} style={{ padding:"5px 10px", textAlign:"left", background:T.bgInput, borderBottom:`1px solid ${T.border}`, color:T.textMid, fontWeight:700, textTransform:"uppercase", fontSize:10 }}>{h}</th>)}</tr></thead>
            <tbody>{PART_COLS.map((c,i)=><tr key={c.key} style={{ background:i%2===0?"transparent":T.bg }}>
              <td style={{ padding:"5px 10px", fontFamily:T.fontMono, fontWeight:700, color:T.accentHi, borderBottom:`1px solid ${T.border}` }}>{c.hdr}</td>
              <td style={{ padding:"5px 10px", borderBottom:`1px solid ${T.border}` }}>{c.required?<Badge color="red">Required</Badge>:<Badge color="gray">Optional</Badge>}</td>
              <td style={{ padding:"5px 10px", color:T.textMid, borderBottom:`1px solid ${T.border}` }}>{c.hint}</td>
            </tr>)}</tbody>
          </table>
        </div>

        <div style={{ ...css.card, marginBottom:12 }}>
          <div style={{ display:"flex", gap:12, alignItems:"flex-start", flexWrap:"wrap" }}>
            <div>
              <div style={css.label}>Upload CSV File</div>
              <input ref={fileRef2} type="file" accept=".csv" onChange={handleFile} style={{ color:T.text, fontSize:12 }} />
            </div>
            <div>
              <div style={css.label}>Import Mode</div>
              <div style={{ display:"flex", gap:12 }}>
                <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12, color:T.text }}><input type="radio" checked={importMode==="append"} onChange={()=>setImportMode("append")} /><span>Append</span></label>
                <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12, color:T.text }}><input type="radio" checked={importMode==="replace"} onChange={()=>setImportMode("replace")} /><span>Replace all parts</span></label>
              </div>
            </div>
          </div>
          {importErr&&<div style={{ background:importErr.startsWith("⚠")?T.amberBg:T.redBg, border:`1px solid ${importErr.startsWith("⚠")?T.amber:T.redLo}`, borderRadius:6, padding:"8px 12px", color:importErr.startsWith("⚠")?T.amber:T.red, fontSize:12, marginTop:10 }}>{importErr}</div>}
        </div>

        {importRows.length>0&&<div style={{ marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.green, marginBottom:8 }}>✓ {importRows.length} part(s) ready to import — preview:</div>
          <div style={{ overflowX:"auto", maxHeight:220, overflowY:"auto" }}>
            <table style={{ borderCollapse:"collapse", fontSize:11, width:"100%" }}>
              <thead><tr>{["Drawing No","Mark No","Description","Fab","Material Code","Qty","Client Wt","Source","Drawing?","Library?"].map(h=><th key={h} style={{ padding:"5px 8px", background:T.bgInput, borderBottom:`1px solid ${T.border}`, color:T.textMid, fontWeight:700, textTransform:"uppercase", fontSize:10, whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
              <tbody>{importRows.map((r,i)=><tr key={i} style={{ background:i%2===0?"transparent":T.bg }}>
                <td style={{ padding:"5px 8px", fontFamily:T.fontMono, color:T.accentHi, borderBottom:`1px solid ${T.border}` }}>{r.drawingNo}</td>
                <td style={{ padding:"5px 8px", fontWeight:700, borderBottom:`1px solid ${T.border}` }}>{r.markNo}</td>
                <td style={{ padding:"5px 8px", borderBottom:`1px solid ${T.border}` }}>{r.desc}</td>
                <td style={{ padding:"5px 8px", borderBottom:`1px solid ${T.border}` }}><Badge color={r.fabType==="Fabricate"?"blue":"gray"}>{r.fabType==="Fabricate"?"Fab":"B/O"}</Badge></td>
                <td style={{ padding:"5px 8px", fontFamily:T.fontMono, fontSize:11, color:r._libMatched?T.accentHi:T.textMid, borderBottom:`1px solid ${T.border}` }}>{r.matCode||`${r.section} ${r.size}`}</td>
                <td style={{ padding:"5px 8px", fontFamily:T.fontMono, textAlign:"center", borderBottom:`1px solid ${T.border}` }}>{r.qtyPerDrg}</td>
                <td style={{ padding:"5px 8px", fontFamily:T.fontMono, color:T.amber, textAlign:"right", borderBottom:`1px solid ${T.border}` }}>{r.clientTotalWt?.toFixed(2)}</td>
                <td style={{ padding:"5px 8px", borderBottom:`1px solid ${T.border}` }}><Badge color={srcColor[r.source]||"gray"}>{r.source}</Badge></td>
                <td style={{ padding:"5px 8px", borderBottom:`1px solid ${T.border}` }}>{r._drgMatched?<Badge color="green">✓</Badge>:<Badge color="amber">—</Badge>}</td>
                <td style={{ padding:"5px 8px", borderBottom:`1px solid ${T.border}` }}>{r._libMatched?<Badge color="green">✓</Badge>:r.section?<Badge color="amber">—</Badge>:<Badge color="gray">N/A</Badge>}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>}

        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button onClick={()=>{setImportModal(false);setImportRows([]);setImportErr("");fileRef2.current.value="";}} style={css.btn.secondary}>Cancel</button>
          <button onClick={downloadTemplate} style={css.btn.secondary}>⬇ Download Template</button>
          <button onClick={confirmImport} disabled={importRows.length===0} style={{ ...css.btn.primary, opacity:importRows.length===0?0.4:1 }}>✓ Confirm Import ({importRows.length} parts)</button>
        </div>
      </Modal>}
    </div>
  );
};
const TabQuality = ({ order, onChange, canEdit }) => {
  const [activeQ, setActiveQ] = useState("rm_makes");
  const q = order.quality||{};
  const updQ = (k,v) => onChange({...order,quality:{...q,[k]:v}});
  const qtabs = [{id:"rm_makes",label:"RM Approved Makes"},{id:"paint",label:"Paint Spec"},{id:"weld",label:"Weld Spec"},{id:"tpi",label:"TPI"},{id:"dispatch",label:"Dispatch Spec"},{id:"mdcc",label:"MDCC Dossier"}];
  return (
    <div>
      <TabBar2 tabs={qtabs} active={activeQ} onChange={setActiveQ} />
      {activeQ==="rm_makes"&&<div>
        <div style={{ ...css.card, background:T.amberBg, border:`1px solid ${T.amber}`, marginBottom:14, fontSize:12, color:T.amber }}>Per-order approved makes override global library defaults. These will appear in MRP export for purchase manager reference.</div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}><div style={{ fontSize:14, fontWeight:700, color:T.text }}>RM Approved Makes</div>{canEdit&&<button onClick={()=>updQ("approvedMakes",[...(q.approvedMakes||[]),{id:`QAM-${Date.now()}`,matType:"",makes:"",remarks:""}])} style={css.btn.primary}>+ Add</button>}</div>
        {(q.approvedMakes||[]).map((m,i)=><div key={m.id} style={{ ...css.card, marginBottom:8, display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:12, alignItems:"center" }}><div><div style={css.label}>Material Type</div><input value={m.matType||""} onChange={e=>{ const n=[...q.approvedMakes]; n[i]={...n[i],matType:e.target.value}; updQ("approvedMakes",n); }} disabled={!canEdit} style={css.input} /></div><div><div style={css.label}>Approved Makes</div><input value={m.makes||""} onChange={e=>{ const n=[...q.approvedMakes]; n[i]={...n[i],makes:e.target.value}; updQ("approvedMakes",n); }} disabled={!canEdit} style={css.input} /></div><div><div style={css.label}>Remarks</div><input value={m.remarks||""} onChange={e=>{ const n=[...q.approvedMakes]; n[i]={...n[i],remarks:e.target.value}; updQ("approvedMakes",n); }} disabled={!canEdit} style={css.input} /></div>{canEdit&&<button onClick={()=>updQ("approvedMakes",q.approvedMakes.filter((_,j)=>j!==i))} style={{ ...css.btn.ghost, color:T.red, marginTop:14 }}>✕</button>}</div>)}
      </div>}
      {activeQ==="paint"&&<div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}><div style={{ fontSize:14, fontWeight:700, color:T.text }}>Paint Specification</div>{canEdit&&<button onClick={()=>updQ("paintCoats",[...(q.paintCoats||[]),{coatNo:(q.paintCoats||[]).length+1,type:"Primer",dft:50,make:"",product:"",dryTime:8,remarks:""}])} style={css.btn.primary}>+ Add Coat</button>}</div>
        {(q.paintCoats||[]).map((c,i)=><div key={i} style={{ ...css.card, marginBottom:8 }}><div style={{ display:"flex", gap:8, marginBottom:12 }}><Badge color={c.type==="Primer"?"blue":c.type==="MIO"?"amber":"green"}>Coat {c.coatNo} — {c.type}</Badge><span style={{ fontSize:12, color:T.textMid }}>DFT: {c.dft}μm · Dry: {c.dryTime}h</span></div><div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr auto", gap:10, alignItems:"end" }}><div><div style={css.label}>Type</div><select value={c.type||"Primer"} onChange={e=>{ const n=[...q.paintCoats]; n[i]={...n[i],type:e.target.value}; updQ("paintCoats",n); }} disabled={!canEdit} style={css.input}><option>Primer</option><option>MIO</option><option>Finish</option><option>Intermediate</option></select></div><div><div style={css.label}>DFT (μm)</div><input type="number" value={c.dft||""} onChange={e=>{ const n=[...q.paintCoats]; n[i]={...n[i],dft:+e.target.value}; updQ("paintCoats",n); }} disabled={!canEdit} style={css.input} /></div><div><div style={css.label}>Make</div><input value={c.make||""} onChange={e=>{ const n=[...q.paintCoats]; n[i]={...n[i],make:e.target.value}; updQ("paintCoats",n); }} disabled={!canEdit} style={css.input} /></div><div><div style={css.label}>Product</div><input value={c.product||""} onChange={e=>{ const n=[...q.paintCoats]; n[i]={...n[i],product:e.target.value}; updQ("paintCoats",n); }} disabled={!canEdit} style={css.input} /></div><div><div style={css.label}>Dry Time (h)</div><input type="number" value={c.dryTime||""} onChange={e=>{ const n=[...q.paintCoats]; n[i]={...n[i],dryTime:+e.target.value}; updQ("paintCoats",n); }} disabled={!canEdit} style={css.input} /></div>{canEdit&&<button onClick={()=>updQ("paintCoats",q.paintCoats.filter((_,j)=>j!==i))} style={{ ...css.btn.ghost, color:T.red }}>✕</button>}</div></div>)}
      </div>}
      {activeQ==="weld"&&<div style={{ ...css.card }}><div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}><div><label style={css.label}>Process</label><select value={q.weldSpec?.process||"SMAW"} onChange={e=>updQ("weldSpec",{...q.weldSpec,process:e.target.value})} disabled={!canEdit} style={css.input}><option>SMAW</option><option>GMAW</option><option>FCAW</option><option>SAW</option></select></div><div><label style={css.label}>Electrode Type</label><input value={q.weldSpec?.electrodeType||""} onChange={e=>updQ("weldSpec",{...q.weldSpec,electrodeType:e.target.value})} disabled={!canEdit} style={css.input} placeholder="E7018" /></div><div><label style={css.label}>Grade</label><input value={q.weldSpec?.grade||""} onChange={e=>updQ("weldSpec",{...q.weldSpec,grade:e.target.value})} disabled={!canEdit} style={css.input} /></div><div><label style={css.label}>Make</label><input value={q.weldSpec?.make||""} onChange={e=>updQ("weldSpec",{...q.weldSpec,make:e.target.value})} disabled={!canEdit} style={css.input} placeholder="Lincoln Electric..." /></div><div style={{ gridColumn:"span 2" }}><label style={css.label}>Remarks</label><input value={q.weldSpec?.remarks||""} onChange={e=>updQ("weldSpec",{...q.weldSpec,remarks:e.target.value})} disabled={!canEdit} style={css.input} /></div><div style={{ gridColumn:"span 2" }}><label style={css.label}>WPS/WPQ Document</label><div style={{ display:"flex", gap:8 }}><input value={q.wpsDoc||""} onChange={e=>updQ("wpsDoc",e.target.value)} disabled={!canEdit} style={{ ...css.input, flex:1 }} placeholder="Drive link..." />{q.wpsDoc&&<a href={q.wpsDoc} target="_blank" rel="noreferrer" style={{ ...css.btn.sm, textDecoration:"none" }}>View</a>}</div><div style={{ fontSize:11, color:T.red, marginTop:4 }}>⚠ Critical — required for TPI inspection</div></div></div></div>}
      {activeQ==="tpi"&&<div style={{ ...css.card }}><div style={{ marginBottom:12 }}><div style={css.label}>TPI Required</div><div style={{ display:"flex", gap:12 }}><label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}><input type="radio" checked={q.tpiRequired===true} onChange={()=>updQ("tpiRequired",true)} disabled={!canEdit} /><span style={{ color:T.text }}>Yes</span></label><label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}><input type="radio" checked={q.tpiRequired===false} onChange={()=>updQ("tpiRequired",false)} disabled={!canEdit} /><span style={{ color:T.text }}>No</span></label></div></div>{q.tpiRequired&&<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}><div><label style={css.label}>TPI Agency</label><select value={q.tpiAgencyId||""} onChange={e=>{ const a=TPI_AGENCIES.find(t=>t.id===e.target.value); updQ("tpiAgencyId",e.target.value); updQ("tpiAgencyName",a?.name||""); }} disabled={!canEdit} style={css.input}><option value="">Select...</option>{TPI_AGENCIES.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div><div><div style={css.label}>Hold Points</div><div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:4 }}>{["welding","painting","rm_inspection"].map(hp=><label key={hp} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer" }}><input type="checkbox" checked={(q.tpiHoldPoints||[]).includes(hp)} disabled={!canEdit} onChange={e=>{ const pts=q.tpiHoldPoints||[]; updQ("tpiHoldPoints",e.target.checked?[...pts,hp]:pts.filter(p=>p!==hp)); }} /><span style={{ fontSize:12, color:T.text, textTransform:"capitalize" }}>{hp.replace("_"," ")}</span></label>)}</div></div></div>}</div>}
      {activeQ==="dispatch"&&<div style={{ ...css.card }}><div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}><div><label style={css.label}>Packing Type</label><select value={q.dispatchSpec?.packingType||""} onChange={e=>updQ("dispatchSpec",{...q.dispatchSpec,packingType:e.target.value})} disabled={!canEdit} style={css.input}><option value="">Select...</option><option>Shrink wrap only</option><option>Wooden rafters + shrink wrap</option><option>Wooden box</option><option>Custom</option></select></div><div style={{ gridColumn:"span 1" }}><label style={css.label}>Remarks</label><textarea value={q.dispatchSpec?.remarks||""} onChange={e=>updQ("dispatchSpec",{...q.dispatchSpec,remarks:e.target.value})} disabled={!canEdit} style={{ ...css.input, minHeight:60, resize:"vertical" }} /></div></div></div>}
      {activeQ==="mdcc"&&<div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}><div style={{ fontSize:14, fontWeight:700, color:T.text }}>MDCC Dossier Checklist</div>{canEdit&&<button onClick={()=>updQ("mdccDocs",[...(q.mdccDocs||[]),{id:`MDCC-D-${Date.now()}`,docName:"",mandatory:true}])} style={css.btn.primary}>+ Add Document</button>}</div>
        <div style={{ ...css.card, background:T.amberBg, border:`1px solid ${T.amber}`, marginBottom:14, fontSize:12, color:T.amber }}>Define which documents must be in the MDCC dossier. System tracks attachment status.</div>
        {(q.mdccDocs||[]).map((d,i)=><div key={d.id} style={{ ...css.card, marginBottom:6, display:"flex", alignItems:"center", gap:12 }}><span style={{ fontSize:11, color:T.green }}>○</span><input value={d.docName||""} onChange={e=>{ const n=[...q.mdccDocs]; n[i]={...n[i],docName:e.target.value}; updQ("mdccDocs",n); }} disabled={!canEdit} style={{ ...css.input, flex:1 }} /><label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", whiteSpace:"nowrap" }}><input type="checkbox" checked={d.mandatory} disabled={!canEdit} onChange={e=>{ const n=[...q.mdccDocs]; n[i]={...n[i],mandatory:e.target.checked}; updQ("mdccDocs",n); }} /><span style={{ fontSize:12, color:T.textMid }}>Mandatory</span></label>{d.mandatory&&<Badge color="red">Required</Badge>}{canEdit&&<button onClick={()=>updQ("mdccDocs",q.mdccDocs.filter((_,j)=>j!==i))} style={{ ...css.btn.ghost, color:T.red }}>✕</button>}</div>)}
      </div>}
    </div>
  );
};
const TabFinance = ({ order, onChange, canEdit }) => {
  const [modal, setModal] = useState(null); const [form, setForm] = useState({});
  const amds = order.amendments||[];
  const invoices = (order.milestones||[]).flatMap(m=>(m.invoices||[]).map(inv=>({...inv,milestoneName:m.desc})));
  return (
    <div>
      <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:12 }}>Invoice Register</div>
      {invoices.length===0?<div style={{ ...css.card, textAlign:"center", color:T.textLow, padding:24 }}>No invoices raised yet. Add from Payment Milestones tab.</div>:(
        <div style={{ overflowX:"auto", marginBottom:20 }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead><tr>{["Invoice No","Milestone","Date","Qty","Rate","Amount","Status"].map(h=><th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:10, fontWeight:700, color:T.textMid, textTransform:"uppercase", borderBottom:`1px solid ${T.border}`, background:T.bg }}>{h}</th>)}</tr></thead>
            <tbody>{invoices.map((inv,i)=><tr key={inv.id} style={{ background:i%2===0?"transparent":T.bg }}><td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono, fontSize:11, color:T.accentHi }}>{inv.invoiceNo||inv.id}</td><td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, color:T.textMid, fontSize:11 }}>{inv.milestoneName}</td><td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}>{fmt.date(inv.raisedDate)}</td><td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono }}>{inv.qty} {order.orderUnit}</td><td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono }}>{fmt.currency(inv.ratePerUnit)}</td><td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono, fontWeight:700, color:T.green }}>{fmt.currency(inv.amount)}</td><td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}><Badge color={inv.status==="paid"?"green":inv.status==="sent"?"amber":"gray"}>{inv.status}</Badge></td></tr>)}</tbody>
          </table>
        </div>
      )}
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.text }}>Amendment Log</div>
        {canEdit&&<button onClick={()=>{setForm({date:today()});setModal("add");}} style={css.btn.primary}>+ Log Amendment</button>}
      </div>
      {amds.length===0?<div style={{ ...css.card, textAlign:"center", color:T.textLow, padding:24 }}>No amendments recorded</div>:amds.map((a,i)=>(
        <div key={a.id} style={{ ...css.card, marginBottom:8, borderLeft:`3px solid ${T.amber}` }}>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div>
              <div style={{ display:"flex", gap:8, marginBottom:4 }}><span style={{ fontSize:11, fontFamily:T.fontMono, color:T.textLow }}>AMD-{String(i+1).padStart(3,"0")}</span><span style={{ fontSize:11, color:T.textMid }}>{fmt.date(a.date)}</span><span style={{ fontSize:11, color:T.textMid }}>by {a.changedBy}</span></div>
              <div style={{ fontSize:13, color:T.text, marginBottom:4 }}><strong>{a.field}</strong>: <span style={{color:T.red}}>{a.oldVal}</span> → <span style={{color:T.green}}>{a.newVal}</span></div>
              <div style={{ fontSize:12, color:T.textMid }}>{a.reason}</div>
            </div>
            {a.docLink&&<a href={a.docLink} target="_blank" rel="noreferrer" style={{ ...css.btn.sm, textDecoration:"none", background:T.amberBg, color:T.amber }}>View Doc</a>}
          </div>
        </div>
      ))}
      {modal==="add"&&<Modal title="Log Amendment" onClose={()=>setModal(null)} width={520}><div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}><div><label style={css.label}>Field Changed</label><input value={form.field||""} onChange={e=>setForm({...form,field:e.target.value})} style={css.input} placeholder="e.g. orderQty" /></div><div><label style={css.label}>Date</label><input type="date" value={form.date||""} onChange={e=>setForm({...form,date:e.target.value})} style={css.input} /></div><div><label style={css.label}>Old Value</label><input value={form.oldVal||""} onChange={e=>setForm({...form,oldVal:e.target.value})} style={css.input} /></div><div><label style={css.label}>New Value</label><input value={form.newVal||""} onChange={e=>setForm({...form,newVal:e.target.value})} style={css.input} /></div><div style={{ gridColumn:"span 2" }}><label style={css.label}>Reason</label><textarea value={form.reason||""} onChange={e=>setForm({...form,reason:e.target.value})} style={{ ...css.input, minHeight:60, resize:"vertical" }} /></div><div style={{ gridColumn:"span 2" }}><label style={css.label}>Amendment Doc (Drive Link)</label><input value={form.docLink||""} onChange={e=>setForm({...form,docLink:e.target.value})} style={css.input} placeholder="Drive link..." /></div></div><div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:12 }}><button onClick={()=>setModal(null)} style={css.btn.secondary}>Cancel</button><button onClick={()=>{ onChange({...order,amendments:[...amds,{...form,id:`AMD-${Date.now()}`,changedBy:"Current User"}]}); setModal(null); }} style={css.btn.primary}>Save Amendment</button></div></Modal>}
    </div>
  );
};
const OrderDetail = ({ order, onBack, onSave, user, clients, materials, stock }) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [localOrder, setLocalOrder] = useState(order);
  const [dirty, setDirty] = useState(false);
  const canEdit = user.role==="super_admin"||user.role==="planning_admin";
  const canEditFinance = user.role==="super_admin"||user.role==="planning_admin"||user.role==="finance_admin";
  const update = (updated) => { setLocalOrder(updated); setDirty(true); };
  const save = () => { onSave(localOrder); setDirty(false); };
  const isFinanceRole = user.role==="finance_admin"||user.role==="finance_user";
  useEffect(() => { if (isFinanceRole) setActiveTab("milestones"); }, []);
  const allTabs = [
    {id:"basic",label:"Basic Details"},{id:"gst",label:"GST & Billing"},{id:"shipping",label:"Shipping"},
    {id:"milestones",label:"Payment Milestones"},{id:"drawings",label:"Drawing Register",planningOnly:true},
    {id:"parts",label:"Drawing Part List",planningOnly:true},{id:"quality",label:"Quality",planningOnly:true},
    {id:"finance",label:"Finance & Amendments"},
  ];
  const tabs = allTabs.filter(t=>!t.planningOnly||!isFinanceRole);
  const clientList = clients||[];
  const client = clientList.find(c=>c.id===localOrder.clientId)||{};
  const st = {active:{color:"green",label:"Active"},completed:{color:"blue",label:"Completed"},on_hold:{color:"amber",label:"On Hold"},cancelled:{color:"red",label:"Cancelled"}}[localOrder.status]||{color:"green",label:"Active"};
  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <button onClick={onBack} style={{ ...css.btn.ghost, color:T.accent }}>← Orders</button>
            <span style={{ color:T.textLow }}>/</span>
            <span style={{ fontFamily:T.fontMono, color:T.accentHi, fontSize:14, fontWeight:700 }}>{localOrder.id}</span>
            <Badge color={st.color}>{st.label}</Badge>
          </div>
          <div style={{ fontSize:18, fontWeight:800, color:T.text }}>{localOrder.projectDesc}</div>
          <div style={{ fontSize:13, color:T.textMid, marginTop:2 }}>{client.name} · {localOrder.clientPoNo}</div>
          <div style={{ display:"flex", gap:12, marginTop:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, color:T.textMid }}>Value: <strong style={{color:T.green,fontFamily:T.fontMono}}>{fmt.currency(localOrder.orderValue)}</strong></span>
            <span style={{ fontSize:12, color:T.textMid }}>Qty: <strong style={{color:T.text,fontFamily:T.fontMono}}>{localOrder.orderQty} {localOrder.orderUnit}</strong></span>
            <span style={{ fontSize:12, color:T.textMid }}>Rate: <strong style={{color:T.text,fontFamily:T.fontMono}}>{fmt.currency(localOrder.ratePerUnit)}/{localOrder.orderUnit}</strong></span>
            <span style={{ fontSize:12, color:T.textMid }}>End: <strong style={{color:T.amber}}>{fmt.date(localOrder.endDate)}</strong></span>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {dirty&&canEdit&&<button onClick={save} style={{ ...css.btn.primary, background:T.green }}>✓ Save Changes</button>}
          {dirty&&canEdit&&<button onClick={()=>{setLocalOrder(order);setDirty(false);}} style={css.btn.secondary}>Discard</button>}
          {dirty&&!canEdit&&canEditFinance&&(activeTab==="milestones"||activeTab==="finance")&&<button onClick={save} style={{ ...css.btn.primary, background:T.green }}>✓ Save Finance</button>}
          {dirty&&!canEdit&&canEditFinance&&(activeTab==="milestones"||activeTab==="finance")&&<button onClick={()=>{setLocalOrder(order);setDirty(false);}} style={css.btn.secondary}>Discard</button>}
        </div>
      </div>
      <TabBar2 tabs={tabs} active={activeTab} onChange={setActiveTab} />
      {activeTab==="basic"      && <TabBasicDetails  order={localOrder} onChange={update} canEdit={canEdit} clients={clients||[]} />}
      {activeTab==="gst"        && <TabGSTBilling    order={localOrder} onChange={update} canEdit={canEdit} />}
      {activeTab==="shipping"   && <TabShipping      order={localOrder} onChange={update} canEdit={canEdit} />}
      {activeTab==="milestones" && <TabMilestones    order={localOrder} onChange={update} canEdit={canEditFinance} />}
      {activeTab==="drawings"   && <TabDrawings      order={localOrder} onChange={update} canEdit={canEdit} />}
      {activeTab==="parts"      && <TabParts         order={localOrder} onChange={update} canEdit={canEdit} materials={materials||[]} stock={stock||[]} />}
      {activeTab==="quality"    && <TabQuality       order={localOrder} onChange={update} canEdit={canEdit} />}
      {activeTab==="finance"    && <TabFinance       order={localOrder} onChange={update} canEdit={canEditFinance} />}
    </div>
  );
};
const OrdersList = ({ orders, onOpen, user, clients, onAddOrder }) => {
  const [search, setSearch] = useState(""); const [statusFilter, setStatusFilter] = useState("all"); const [modal, setModal] = useState(false); const [form, setForm] = useState({});
  const filtered = orders.filter(o=>(o.projectDesc.toLowerCase().includes(search.toLowerCase())||o.clientPoNo.toLowerCase().includes(search.toLowerCase())||o.id.toLowerCase().includes(search.toLowerCase()))&&(statusFilter==="all"||o.status===statusFilter));
  const canCreate = ["super_admin","planning_admin"].includes(user.role);
  const statusColor = {active:"green",completed:"blue",on_hold:"amber",cancelled:"red"};
  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:800, color:T.text }}>Orders</div>
        <div style={{ fontSize:13, color:T.textMid }}>Sales orders with drawing register, part list, quality specs and financials</div>
      </div>
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <StatCard label="Active Orders" value={orders.filter(o=>o.status==="active").length} color={T.green} />
        <StatCard label="Active Value" value={fmt.currency(orders.filter(o=>o.status==="active").reduce((s,o)=>s+(o.orderValue||0),0))} color={T.accent} />
        <StatCard label="Active Qty" value={`${orders.filter(o=>o.status==="active").reduce((s,o)=>s+(o.orderQty||0),0)}T`} color={T.gold} />
        <StatCard label="Total Orders" value={orders.length} color={T.textMid} />
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:16, justifyContent:"space-between", flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ position:"relative" }}><span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:T.textLow }}>🔍</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search orders..." style={{ ...css.input, paddingLeft:32, width:240 }} /></div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ ...css.input, width:140 }}><option value="all">All Status</option><option value="active">Active</option><option value="on_hold">On Hold</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
        </div>
        {canCreate&&<button onClick={()=>{setForm({status:"active",orderUnit:"Ton",gstRate:18,orderDate:today(),drawings:[],parts:[],milestones:[],shippingAddresses:[],amendments:[],invoices:[],quality:{tpiRequired:false,paintCoats:[],approvedMakes:[],mdccDocs:[]}});setModal(true);}} style={css.btn.primary}>+ New Order</button>}
      </div>
      {filtered.map(o=>{
        const client=(clients||[]).find(c=>c.id===o.clientId)||{};
        const received=receivedDrgWt(o); const total=totalDrgWt(o); const pct=total>0?Math.round((received/total)*100):0;
        return (
          <div key={o.id} onClick={()=>onOpen(o)} style={{ ...css.card, marginBottom:10, cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.borderColor=T.borderHi} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                  <span style={{ fontFamily:T.fontMono, color:T.accentHi, fontSize:13, fontWeight:700 }}>{o.id}</span>
                  <Badge color={statusColor[o.status]||"gray"}>{o.status}</Badge>
                  <span style={{ fontSize:12, color:T.textMid }}>{client.name}</span>
                </div>
                <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:4 }}>{o.projectDesc}</div>
                <div style={{ fontSize:12, color:T.textMid, marginBottom:8 }}>{o.clientPoNo} · {fmt.date(o.orderDate)} → {fmt.date(o.endDate)}</div>
                <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                  <span style={{ fontSize:12, color:T.textMid }}>Value: <strong style={{color:T.green,fontFamily:T.fontMono}}>{fmt.currency(o.orderValue)}</strong></span>
                  <span style={{ fontSize:12, color:T.textMid }}>Qty: <strong style={{color:T.text,fontFamily:T.fontMono}}>{o.orderQty} {o.orderUnit}</strong></span>
                  <span style={{ fontSize:12, color:T.textMid }}>Drawings: <strong style={{color:T.text}}>{(o.drawings||[]).filter(d=>d.receivedDate).length}/{(o.drawings||[]).length}</strong></span>
                  <span style={{ fontSize:12, color:T.textMid }}>Parts: <strong style={{color:T.text}}>{(o.parts||[]).length}</strong></span>
                  {o.quality?.tpiRequired&&<Badge color="purple">TPI Required</Badge>}
                  {(o.amendments||[]).length>0&&<Badge color="amber">{o.amendments.length} Amendment(s)</Badge>}
                </div>
              </div>
              <div style={{ textAlign:"right", minWidth:120 }}>
                <div style={{ fontSize:11, color:T.textMid, marginBottom:4 }}>Drawings Received</div>
                <div style={{ height:6, background:T.border, borderRadius:3, overflow:"hidden", width:120 }}><div style={{ height:"100%", width:`${pct}%`, background:pct===100?T.green:T.amber, borderRadius:3 }} /></div>
                <div style={{ fontSize:11, color:pct===100?T.green:T.amber, marginTop:4 }}>{pct}% by weight</div>
                <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>{(received/1000).toFixed(1)}T of {(total/1000).toFixed(1)}T</div>
              </div>
            </div>
          </div>
        );
      })}
      {filtered.length===0&&<div style={{ textAlign:"center", color:T.textLow, padding:48 }}>No orders found</div>}
      {modal&&<Modal title="New Order" onClose={()=>setModal(false)} width={600}><div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}><div style={{ gridColumn:"span 2" }}><label style={css.label}>Project Description</label><input value={form.projectDesc||""} onChange={e=>setForm({...form,projectDesc:e.target.value})} style={css.input} /></div><div><label style={css.label}>Client</label><select value={form.clientId||""} onChange={e=>setForm({...form,clientId:e.target.value})} style={css.input}><option value="">Select...</option>{(clients||CLIENTS_S2).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><label style={css.label}>Client PO No</label><input value={form.clientPoNo||""} onChange={e=>setForm({...form,clientPoNo:e.target.value})} style={css.input} /></div><div><label style={css.label}>Rate per Unit (₹)</label><input type="number" value={form.ratePerUnit||""} onChange={e=>setForm({...form,ratePerUnit:+e.target.value,orderValue:(+e.target.value)*(form.orderQty||0)})} style={css.input} /></div><div><label style={css.label}>Order Qty (Ton)</label><input type="number" value={form.orderQty||""} onChange={e=>setForm({...form,orderQty:+e.target.value,orderValue:(form.ratePerUnit||0)*(+e.target.value)})} style={css.input} /></div><div><label style={css.label}>Order Date</label><input type="date" value={form.orderDate||""} onChange={e=>setForm({...form,orderDate:e.target.value})} style={css.input} /></div><div><label style={css.label}>End Date</label><input type="date" value={form.endDate||""} onChange={e=>setForm({...form,endDate:e.target.value})} style={css.input} /></div></div><div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:12 }}><button onClick={()=>setModal(false)} style={css.btn.secondary}>Cancel</button><button onClick={()=>{ if(onAddOrder) onAddOrder({...form,id:`SF-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`}); setModal(false); }} style={css.btn.primary}>Create Order</button></div></Modal>}
    </div>
  );
};
const OrdersModule = ({ user, orders, setOrders, clients, materials, stock }) => {
  const [selected, setSelected] = useState(null);
  const saveOrder = (updated) => { setOrders(prev=>prev.map(o=>o.id===updated.id?updated:o)); setSelected(updated); };
  if (selected) return <OrderDetail order={selected} onBack={()=>setSelected(null)} onSave={saveOrder} user={user} clients={clients} materials={materials} stock={stock} />;
  return <OrdersList orders={orders} onOpen={setSelected} user={user} clients={clients} onAddOrder={o=>setOrders(prev=>[...prev,o])} />;
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const Login = ({ onLogin }) => {
  const [u,setU]=useState(""); const [p,setP]=useState(""); const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  const go = () => {
    setErr(""); setLoading(true);
    setTimeout(()=>{
      const user=USERS.find(x=>x.username===u.trim()&&x.password===p);
      if(user) onLogin(user); else setErr("Invalid credentials");
      setLoading(false);
    },300);
  };
  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:T.font }}>
      <div style={{ width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:12 }}>
            <div style={{ width:44, height:44, background:T.accent, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:22, fontWeight:900, color:"#fff", fontFamily:T.fontMono }}>S</span>
            </div>
            <div>
              <div style={{ fontSize:22, fontWeight:800, color:T.text, letterSpacing:"-0.02em" }}>STRUCTO</div>
              <div style={{ fontSize:11, color:T.textMid, fontWeight:600, letterSpacing:"0.15em" }}>ERP v3.0 — SESSIONS 1–3</div>
            </div>
          </div>
        </div>
        <div style={{ ...css.card, padding:32 }}>
          <div style={{ fontSize:18, fontWeight:700, color:T.text, marginBottom:18 }}>Sign In</div>
          <div style={{ marginBottom:10 }}><label style={css.label}>Username</label><input value={u} onChange={e=>setU(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} style={css.input} placeholder="username" /></div>
          <div style={{ marginBottom:16 }}><label style={css.label}>Password</label><input type="password" value={p} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} style={css.input} placeholder="••••••••" /></div>
          {err && <div style={{ background:T.redBg, border:`1px solid ${T.redLo}`, borderRadius:6, padding:"8px 12px", color:T.red, fontSize:12, marginBottom:12 }}>{err}</div>}
          <button onClick={go} disabled={loading} style={{ ...css.btn.primary, width:"100%", padding:"10px 0" }}>{loading?"Signing in...":"Sign In"}</button>
          <div style={{ marginTop:18, padding:12, background:T.bg, borderRadius:8 }}>
            <div style={{ fontSize:10, color:T.textMid, fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Quick Logins</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
              {[["Super Admin","rajesh.kumar","admin123"],["Planning Admin","vikram.singh","plan123"],["Planning User","neha.gupta","plan123"],["Purchase","deepak.rao","pur123"],["Store Admin","mohan.das","store123"],["QC Admin","priya.mehta","qc123"],["Floor Planner","suresh.patel","prod123"],["Finance Admin","sameer.shah","fin123"],["Dispatch","ramesh.kulkarni","disp123"],["Contractor","krishna.fab","con123"]].map(([role,un,pw])=>(
                <button key={role} onClick={()=>{setU(un);setP(pw);}} style={{ ...css.btn.ghost, textAlign:"left", fontSize:11, background:T.bgCard, borderRadius:4, border:`1px solid ${T.border}`, padding:"4px 8px" }}>{role}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [mod, setMod] = useState("dashboard");
  const [sidebar, setSidebar] = useState(true);
  const [purchaseReqs, setPurchaseReqs] = useState(INIT_PURCHASE_REQS);
  const [pos, setPos] = useState(INIT_POS);
  const [stock, setStock] = useState(INIT_STOCK);
  const [nestingRuns, setNestingRuns] = useState(INIT_NESTING_RUNS);
  const [orders, setOrders] = useState(SEED_ORDERS);
  const [clients, setClients] = useState(CLIENTS_FULL);
  const [vendors, setVendors] = useState(VENDORS);
  const [contractors, setContractors] = useState(CONTRACTORS);
  const [bays, setBays] = useState(BAYS_SEED);
  const [materials, setMaterials] = useState(MATERIALS_LIBRARY);
  const [paint, setPaint] = useState(PAINT_LIBRARY);
  const [tpiAgencies, setTpiAgencies] = useState(TPI_AGENCIES);
  const [approvedMakes, setApprovedMakes] = useState(APPROVED_MAKES_LIBRARY);
  const [company, setCompany] = useState({
    name:"Structo Fabricators", tradingName:"STRUCTO",
    gstin:"", pan:"", state:"Maharashtra", stateCode:"27",
    address:"", worksAddress:"", phone:"", email:"",
    bankName:"", bankAccount:"", ifsc:"", logoUrl:""
  });

  if (!user) return <Login onLogin={u=>{setUser(u);setMod("dashboard");}} />;

  const visibleNav = NAV.filter(n=>canSee(user,n.module));
  const roleLabel = ROLES_LABEL[user.role]||user.role;
  const initials = user.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  const renderMod = () => {
    switch(mod) {
      case "dashboard": return <Dashboard user={user} pos={pos} stock={stock} purchaseReqs={purchaseReqs} orders={orders} />;
      case "mrp":       return <MRPModule user={user} purchaseReqs={purchaseReqs} setPurchaseReqs={setPurchaseReqs} stock={stock} orders={orders} materials={materials} nestingRuns={nestingRuns} setNestingRuns={setNestingRuns} />;
      case "purchase":  return <PurchaseModule user={user} pos={pos} setPos={setPos} purchaseReqs={purchaseReqs} setStock={setStock} orders={orders} vendors={vendors} materials={materials} />;
      case "qc":        return <RMQCModule user={user} stock={stock} setStock={setStock} />;
      case "stock":     return <StockModule user={user} stock={stock} setStock={setStock} orders={orders} contractors={contractors} />;
      case "orders":    return <OrdersModule user={user} orders={orders} setOrders={setOrders} clients={clients} materials={materials} stock={stock} />;
      case "production":return <Placeholder title="Production" session="Session 4" icon="⚙️" desc="Instance-level tracking, cutting, fit-up, welding, blasting, painting, outbound processing." />;
      case "finance":   return <Placeholder title="Finance" session="Session 5" icon="₹" desc="Milestone invoices, tranches, receipts, credit notes." />;
      case "dispatch":  return <Placeholder title="Dispatch" session="Session 5" icon="🚚" desc="Partial dispatch, per-vehicle challans, gate-out, bilti/LR upload." />;
      case "tools":     return <ToolsModule user={user} orders={orders} materials={materials} nestingRuns={nestingRuns} setNestingRuns={setNestingRuns} />;
      case "masters":   return <MastersModule user={user} clients={clients} setClients={setClients} vendors={vendors} setVendors={setVendors} contractors={contractors} setContractors={setContractors} bays={bays} setBays={setBays} materials={materials} setMaterials={setMaterials} paint={paint} setPaint={setPaint} tpiAgencies={tpiAgencies} setTpiAgencies={setTpiAgencies} approvedMakes={approvedMakes} setApprovedMakes={setApprovedMakes} company={company} setCompany={setCompany} />;
      default:          return <Dashboard user={user} pos={pos} stock={stock} purchaseReqs={purchaseReqs} orders={orders} />;
    }
  };

  return (
    <div style={{ display:"flex", height:"100vh", background:T.bg, fontFamily:T.font, color:T.text, fontSize:14 }}>
      {/* Sidebar */}
      <div style={{ width:sidebar?216:52, minWidth:sidebar?216:52, background:T.bgCard, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", transition:"width 0.2s", overflow:"hidden" }}>
        <div style={{ padding:"12px 12px 10px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:30, height:30, background:T.accent, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <span style={{ fontSize:15, fontWeight:900, color:"#fff", fontFamily:T.fontMono }}>S</span>
          </div>
          {sidebar && <div><div style={{ fontSize:13, fontWeight:800, color:T.text }}>STRUCTO</div><div style={{ fontSize:9, color:T.textMid, letterSpacing:"0.12em" }}>ERP v3.0 · S3</div></div>}
        </div>
        <nav style={{ flex:1, overflowY:"auto", padding:"4px 0" }}>
          {visibleNav.map(item=>{
            const active=mod===item.id;
            return (
              <button key={item.id} onClick={()=>setMod(item.id)} title={!sidebar?item.label:""} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:sidebar?"7px 12px":"7px 10px", background:active?`${T.accent}22`:"transparent", borderLeft:active?`2px solid ${T.accent}`:"2px solid transparent", border:"none", color:active?T.accent:T.textMid, cursor:"pointer", fontFamily:T.font, fontSize:12, fontWeight:active?700:400, textAlign:"left" }}>
                <span style={{ fontSize:13, flexShrink:0, width:18, textAlign:"center" }}>{item.icon}</span>
                {sidebar && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
        <div style={{ padding:8, borderTop:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:T.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#fff", flexShrink:0 }}>{initials}</div>
            {sidebar && <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:700, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</div>
              <div style={{ fontSize:10, color:T.textMid, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{roleLabel}</div>
            </div>}
          </div>
          {sidebar && <button onClick={()=>setUser(null)} style={{ background:"transparent", color:T.red, border:"none", cursor:"pointer", fontFamily:T.font, fontSize:11, marginTop:6, width:"100%", textAlign:"left", padding:"2px 0" }}>Sign Out</button>}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ height:46, background:T.bgCard, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 16px", gap:12, flexShrink:0 }}>
          <button onClick={()=>setSidebar(!sidebar)} style={{ background:"transparent", border:"none", color:T.textMid, cursor:"pointer", fontSize:16, padding:"4px 6px" }}>☰</button>
          <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{NAV.find(n=>n.id===mod)?.label||"Dashboard"}</div>
          <div style={{ flex:1 }} />
          <Badge color="gold">{roleLabel}</Badge>
          <div style={{ fontSize:11, color:T.textMid }}>{new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:18 }}>
          {renderMod()}
        </div>
      </div>
    </div>
  );
}
