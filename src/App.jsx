import React, { useState, useEffect, useRef } from "react";

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
  surface2:"#161E2E",
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
  { id:"machine_operator",    label:"Machine Operator",    dept:"Production",  level:"user"  },
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
  { id:"U033", name:"Ajay Kadam",           username:"ajay.kadam",      password:"machine123", role:"machine_operator",   active:true },
  { id:"U034", name:"Ravi Thakur",          username:"ravi.thakur",     password:"machine123", role:"machine_operator",   active:true },
  { id:"USR-008", name:"Arjun Patil",       username:"arjun.qc",        password:"qc123",      role:"qc_user",            active:true },
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
  { id:"ML-001", sectionType:"ISA", matType:"MS", grade:"E250", size:"20x20x3", isPlate:false, wtPerMetre:0.91, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/20x20x3" },
  { id:"ML-002", sectionType:"ISA", matType:"MS", grade:"E350", size:"20x20x3", isPlate:false, wtPerMetre:0.91, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/20x20x3" },
  { id:"ML-003", sectionType:"ISA", matType:"MS", grade:"E250", size:"25x25x3", isPlate:false, wtPerMetre:1.15, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/25x25x3" },
  { id:"ML-004", sectionType:"ISA", matType:"MS", grade:"E350", size:"25x25x3", isPlate:false, wtPerMetre:1.15, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/25x25x3" },
  { id:"ML-005", sectionType:"ISA", matType:"MS", grade:"E250", size:"25x25x5", isPlate:false, wtPerMetre:1.84, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/25x25x5" },
  { id:"ML-006", sectionType:"ISA", matType:"MS", grade:"E350", size:"25x25x5", isPlate:false, wtPerMetre:1.84, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/25x25x5" },
  { id:"ML-007", sectionType:"ISA", matType:"MS", grade:"E250", size:"30x30x3", isPlate:false, wtPerMetre:1.39, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/30x30x3" },
  { id:"ML-008", sectionType:"ISA", matType:"MS", grade:"E350", size:"30x30x3", isPlate:false, wtPerMetre:1.39, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/30x30x3" },
  { id:"ML-009", sectionType:"ISA", matType:"MS", grade:"E250", size:"30x30x5", isPlate:false, wtPerMetre:2.24, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/30x30x5" },
  { id:"ML-010", sectionType:"ISA", matType:"MS", grade:"E350", size:"30x30x5", isPlate:false, wtPerMetre:2.24, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/30x30x5" },
  { id:"ML-011", sectionType:"ISA", matType:"MS", grade:"E250", size:"35x35x3", isPlate:false, wtPerMetre:1.63, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/35x35x3" },
  { id:"ML-012", sectionType:"ISA", matType:"MS", grade:"E350", size:"35x35x3", isPlate:false, wtPerMetre:1.63, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/35x35x3" },
  { id:"ML-013", sectionType:"ISA", matType:"MS", grade:"E250", size:"35x35x5", isPlate:false, wtPerMetre:2.65, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/35x35x5" },
  { id:"ML-014", sectionType:"ISA", matType:"MS", grade:"E350", size:"35x35x5", isPlate:false, wtPerMetre:2.65, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/35x35x5" },
  { id:"ML-015", sectionType:"ISA", matType:"MS", grade:"E250", size:"40x40x3", isPlate:false, wtPerMetre:1.87, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/40x40x3" },
  { id:"ML-016", sectionType:"ISA", matType:"MS", grade:"E350", size:"40x40x3", isPlate:false, wtPerMetre:1.87, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/40x40x3" },
  { id:"ML-017", sectionType:"ISA", matType:"MS", grade:"E250", size:"40x40x5", isPlate:false, wtPerMetre:3.06, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/40x40x5" },
  { id:"ML-018", sectionType:"ISA", matType:"MS", grade:"E350", size:"40x40x5", isPlate:false, wtPerMetre:3.06, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/40x40x5" },
  { id:"ML-019", sectionType:"ISA", matType:"MS", grade:"E250", size:"40x40x6", isPlate:false, wtPerMetre:3.62, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/40x40x6" },
  { id:"ML-020", sectionType:"ISA", matType:"MS", grade:"E350", size:"40x40x6", isPlate:false, wtPerMetre:3.62, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/40x40x6" },
  { id:"ML-021", sectionType:"ISA", matType:"MS", grade:"E250", size:"45x45x3", isPlate:false, wtPerMetre:2.12, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/45x45x3" },
  { id:"ML-022", sectionType:"ISA", matType:"MS", grade:"E350", size:"45x45x3", isPlate:false, wtPerMetre:2.12, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/45x45x3" },
  { id:"ML-023", sectionType:"ISA", matType:"MS", grade:"E250", size:"45x45x5", isPlate:false, wtPerMetre:3.47, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/45x45x5" },
  { id:"ML-024", sectionType:"ISA", matType:"MS", grade:"E350", size:"45x45x5", isPlate:false, wtPerMetre:3.47, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/45x45x5" },
  { id:"ML-025", sectionType:"ISA", matType:"MS", grade:"E250", size:"45x45x6", isPlate:false, wtPerMetre:4.12, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/45x45x6" },
  { id:"ML-026", sectionType:"ISA", matType:"MS", grade:"E350", size:"45x45x6", isPlate:false, wtPerMetre:4.12, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/45x45x6" },
  { id:"ML-027", sectionType:"ISA", matType:"MS", grade:"E250", size:"50x50x3", isPlate:false, wtPerMetre:2.36, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/50x50x3" },
  { id:"ML-028", sectionType:"ISA", matType:"MS", grade:"E350", size:"50x50x3", isPlate:false, wtPerMetre:2.36, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/50x50x3" },
  { id:"ML-029", sectionType:"ISA", matType:"MS", grade:"E250", size:"50x50x5", isPlate:false, wtPerMetre:3.88, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/50x50x5" },
  { id:"ML-030", sectionType:"ISA", matType:"MS", grade:"E350", size:"50x50x5", isPlate:false, wtPerMetre:3.88, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/50x50x5" },
  { id:"ML-031", sectionType:"ISA", matType:"MS", grade:"E250", size:"50x50x6", isPlate:false, wtPerMetre:4.62, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/50x50x6" },
  { id:"ML-032", sectionType:"ISA", matType:"MS", grade:"E350", size:"50x50x6", isPlate:false, wtPerMetre:4.62, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/50x50x6" },
  { id:"ML-033", sectionType:"ISA", matType:"MS", grade:"E250", size:"50x50x8", isPlate:false, wtPerMetre:6.0, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/50x50x8" },
  { id:"ML-034", sectionType:"ISA", matType:"MS", grade:"E350", size:"50x50x8", isPlate:false, wtPerMetre:6.0, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/50x50x8" },
  { id:"ML-035", sectionType:"ISA", matType:"MS", grade:"E250", size:"55x55x5", isPlate:false, wtPerMetre:4.29, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/55x55x5" },
  { id:"ML-036", sectionType:"ISA", matType:"MS", grade:"E350", size:"55x55x5", isPlate:false, wtPerMetre:4.29, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/55x55x5" },
  { id:"ML-037", sectionType:"ISA", matType:"MS", grade:"E250", size:"55x55x6", isPlate:false, wtPerMetre:5.12, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/55x55x6" },
  { id:"ML-038", sectionType:"ISA", matType:"MS", grade:"E350", size:"55x55x6", isPlate:false, wtPerMetre:5.12, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/55x55x6" },
  { id:"ML-039", sectionType:"ISA", matType:"MS", grade:"E250", size:"60x60x5", isPlate:false, wtPerMetre:4.69, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/60x60x5" },
  { id:"ML-040", sectionType:"ISA", matType:"MS", grade:"E350", size:"60x60x5", isPlate:false, wtPerMetre:4.69, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/60x60x5" },
  { id:"ML-041", sectionType:"ISA", matType:"MS", grade:"E250", size:"60x60x6", isPlate:false, wtPerMetre:5.62, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/60x60x6" },
  { id:"ML-042", sectionType:"ISA", matType:"MS", grade:"E350", size:"60x60x6", isPlate:false, wtPerMetre:5.62, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/60x60x6" },
  { id:"ML-043", sectionType:"ISA", matType:"MS", grade:"E250", size:"60x60x8", isPlate:false, wtPerMetre:7.35, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/60x60x8" },
  { id:"ML-044", sectionType:"ISA", matType:"MS", grade:"E350", size:"60x60x8", isPlate:false, wtPerMetre:7.35, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/60x60x8" },
  { id:"ML-045", sectionType:"ISA", matType:"MS", grade:"E250", size:"60x60x10", isPlate:false, wtPerMetre:9.03, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/60x60x10" },
  { id:"ML-046", sectionType:"ISA", matType:"MS", grade:"E350", size:"60x60x10", isPlate:false, wtPerMetre:9.03, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/60x60x10" },
  { id:"ML-047", sectionType:"ISA", matType:"MS", grade:"E250", size:"65x65x5", isPlate:false, wtPerMetre:5.1, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/65x65x5" },
  { id:"ML-048", sectionType:"ISA", matType:"MS", grade:"E350", size:"65x65x5", isPlate:false, wtPerMetre:5.1, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/65x65x5" },
  { id:"ML-049", sectionType:"ISA", matType:"MS", grade:"E250", size:"65x65x6", isPlate:false, wtPerMetre:6.12, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/65x65x6" },
  { id:"ML-050", sectionType:"ISA", matType:"MS", grade:"E350", size:"65x65x6", isPlate:false, wtPerMetre:6.12, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/65x65x6" },
  { id:"ML-051", sectionType:"ISA", matType:"MS", grade:"E250", size:"65x65x8", isPlate:false, wtPerMetre:8.0, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/65x65x8" },
  { id:"ML-052", sectionType:"ISA", matType:"MS", grade:"E350", size:"65x65x8", isPlate:false, wtPerMetre:8.0, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/65x65x8" },
  { id:"ML-053", sectionType:"ISA", matType:"MS", grade:"E250", size:"65x65x10", isPlate:false, wtPerMetre:9.84, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/65x65x10" },
  { id:"ML-054", sectionType:"ISA", matType:"MS", grade:"E350", size:"65x65x10", isPlate:false, wtPerMetre:9.84, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/65x65x10" },
  { id:"ML-055", sectionType:"ISA", matType:"MS", grade:"E250", size:"70x70x5", isPlate:false, wtPerMetre:5.51, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/70x70x5" },
  { id:"ML-056", sectionType:"ISA", matType:"MS", grade:"E350", size:"70x70x5", isPlate:false, wtPerMetre:5.51, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/70x70x5" },
  { id:"ML-057", sectionType:"ISA", matType:"MS", grade:"E250", size:"70x70x6", isPlate:false, wtPerMetre:6.62, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/70x70x6" },
  { id:"ML-058", sectionType:"ISA", matType:"MS", grade:"E350", size:"70x70x6", isPlate:false, wtPerMetre:6.62, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/70x70x6" },
  { id:"ML-059", sectionType:"ISA", matType:"MS", grade:"E250", size:"70x70x7", isPlate:false, wtPerMetre:7.71, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/70x70x7" },
  { id:"ML-060", sectionType:"ISA", matType:"MS", grade:"E350", size:"70x70x7", isPlate:false, wtPerMetre:7.71, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/70x70x7" },
  { id:"ML-061", sectionType:"ISA", matType:"MS", grade:"E250", size:"70x70x8", isPlate:false, wtPerMetre:8.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/70x70x8" },
  { id:"ML-062", sectionType:"ISA", matType:"MS", grade:"E350", size:"70x70x8", isPlate:false, wtPerMetre:8.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/70x70x8" },
  { id:"ML-063", sectionType:"ISA", matType:"MS", grade:"E250", size:"75x75x5", isPlate:false, wtPerMetre:5.91, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/75x75x5" },
  { id:"ML-064", sectionType:"ISA", matType:"MS", grade:"E350", size:"75x75x5", isPlate:false, wtPerMetre:5.91, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/75x75x5" },
  { id:"ML-065", sectionType:"ISA", matType:"MS", grade:"E250", size:"75x75x6", isPlate:false, wtPerMetre:7.11, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/75x75x6" },
  { id:"ML-066", sectionType:"ISA", matType:"MS", grade:"E350", size:"75x75x6", isPlate:false, wtPerMetre:7.11, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/75x75x6" },
  { id:"ML-067", sectionType:"ISA", matType:"MS", grade:"E250", size:"75x75x8", isPlate:false, wtPerMetre:8.96, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/75x75x8" },
  { id:"ML-068", sectionType:"ISA", matType:"MS", grade:"E350", size:"75x75x8", isPlate:false, wtPerMetre:8.96, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/75x75x8" },
  { id:"ML-069", sectionType:"ISA", matType:"MS", grade:"E250", size:"75x75x10", isPlate:false, wtPerMetre:11.1, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/75x75x10" },
  { id:"ML-070", sectionType:"ISA", matType:"MS", grade:"E350", size:"75x75x10", isPlate:false, wtPerMetre:11.1, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/75x75x10" },
  { id:"ML-071", sectionType:"ISA", matType:"MS", grade:"E250", size:"80x80x6", isPlate:false, wtPerMetre:7.61, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/80x80x6" },
  { id:"ML-072", sectionType:"ISA", matType:"MS", grade:"E350", size:"80x80x6", isPlate:false, wtPerMetre:7.61, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/80x80x6" },
  { id:"ML-073", sectionType:"ISA", matType:"MS", grade:"E250", size:"80x80x8", isPlate:false, wtPerMetre:9.64, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/80x80x8" },
  { id:"ML-074", sectionType:"ISA", matType:"MS", grade:"E350", size:"80x80x8", isPlate:false, wtPerMetre:9.64, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/80x80x8" },
  { id:"ML-075", sectionType:"ISA", matType:"MS", grade:"E250", size:"80x80x10", isPlate:false, wtPerMetre:11.9, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/80x80x10" },
  { id:"ML-076", sectionType:"ISA", matType:"MS", grade:"E350", size:"80x80x10", isPlate:false, wtPerMetre:11.9, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/80x80x10" },
  { id:"ML-077", sectionType:"ISA", matType:"MS", grade:"E250", size:"90x90x6", isPlate:false, wtPerMetre:8.62, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/90x90x6" },
  { id:"ML-078", sectionType:"ISA", matType:"MS", grade:"E350", size:"90x90x6", isPlate:false, wtPerMetre:8.62, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/90x90x6" },
  { id:"ML-079", sectionType:"ISA", matType:"MS", grade:"E250", size:"90x90x8", isPlate:false, wtPerMetre:11.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/90x90x8" },
  { id:"ML-080", sectionType:"ISA", matType:"MS", grade:"E350", size:"90x90x8", isPlate:false, wtPerMetre:11.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/90x90x8" },
  { id:"ML-081", sectionType:"ISA", matType:"MS", grade:"E250", size:"90x90x10", isPlate:false, wtPerMetre:14.0, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/90x90x10" },
  { id:"ML-082", sectionType:"ISA", matType:"MS", grade:"E350", size:"90x90x10", isPlate:false, wtPerMetre:14.0, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/90x90x10" },
  { id:"ML-083", sectionType:"ISA", matType:"MS", grade:"E250", size:"90x90x12", isPlate:false, wtPerMetre:16.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/90x90x12" },
  { id:"ML-084", sectionType:"ISA", matType:"MS", grade:"E350", size:"90x90x12", isPlate:false, wtPerMetre:16.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/90x90x12" },
  { id:"ML-085", sectionType:"ISA", matType:"MS", grade:"E250", size:"100x100x6", isPlate:false, wtPerMetre:9.61, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/100x100x6" },
  { id:"ML-086", sectionType:"ISA", matType:"MS", grade:"E350", size:"100x100x6", isPlate:false, wtPerMetre:9.61, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/100x100x6" },
  { id:"ML-087", sectionType:"ISA", matType:"MS", grade:"E250", size:"100x100x8", isPlate:false, wtPerMetre:12.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/100x100x8" },
  { id:"ML-088", sectionType:"ISA", matType:"MS", grade:"E350", size:"100x100x8", isPlate:false, wtPerMetre:12.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/100x100x8" },
  { id:"ML-089", sectionType:"ISA", matType:"MS", grade:"E250", size:"100x100x10", isPlate:false, wtPerMetre:15.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/100x100x10" },
  { id:"ML-090", sectionType:"ISA", matType:"MS", grade:"E350", size:"100x100x10", isPlate:false, wtPerMetre:15.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/100x100x10" },
  { id:"ML-091", sectionType:"ISA", matType:"MS", grade:"E250", size:"100x100x12", isPlate:false, wtPerMetre:18.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/100x100x12" },
  { id:"ML-092", sectionType:"ISA", matType:"MS", grade:"E350", size:"100x100x12", isPlate:false, wtPerMetre:18.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/100x100x12" },
  { id:"ML-093", sectionType:"ISA", matType:"MS", grade:"E250", size:"75x50x6", isPlate:false, wtPerMetre:5.8, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/75x50x6" },
  { id:"ML-094", sectionType:"ISA", matType:"MS", grade:"E350", size:"75x50x6", isPlate:false, wtPerMetre:5.8, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/75x50x6" },
  { id:"ML-095", sectionType:"ISA", matType:"MS", grade:"E250", size:"75x50x8", isPlate:false, wtPerMetre:7.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/75x50x8" },
  { id:"ML-096", sectionType:"ISA", matType:"MS", grade:"E350", size:"75x50x8", isPlate:false, wtPerMetre:7.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/75x50x8" },
  { id:"ML-097", sectionType:"ISA", matType:"MS", grade:"E250", size:"100x75x6", isPlate:false, wtPerMetre:8.12, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/100x75x6" },
  { id:"ML-098", sectionType:"ISA", matType:"MS", grade:"E350", size:"100x75x6", isPlate:false, wtPerMetre:8.12, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/100x75x6" },
  { id:"ML-099", sectionType:"ISA", matType:"MS", grade:"E250", size:"100x75x8", isPlate:false, wtPerMetre:10.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/100x75x8" },
  { id:"ML-100", sectionType:"ISA", matType:"MS", grade:"E350", size:"100x75x8", isPlate:false, wtPerMetre:10.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/100x75x8" },
  { id:"ML-101", sectionType:"ISA", matType:"MS", grade:"E250", size:"100x75x10", isPlate:false, wtPerMetre:13.2, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/100x75x10" },
  { id:"ML-102", sectionType:"ISA", matType:"MS", grade:"E350", size:"100x75x10", isPlate:false, wtPerMetre:13.2, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/100x75x10" },
  { id:"ML-103", sectionType:"ISA", matType:"MS", grade:"E250", size:"125x75x8", isPlate:false, wtPerMetre:12.3, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/125x75x8" },
  { id:"ML-104", sectionType:"ISA", matType:"MS", grade:"E350", size:"125x75x8", isPlate:false, wtPerMetre:12.3, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/125x75x8" },
  { id:"ML-105", sectionType:"ISA", matType:"MS", grade:"E250", size:"125x75x10", isPlate:false, wtPerMetre:15.1, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/125x75x10" },
  { id:"ML-106", sectionType:"ISA", matType:"MS", grade:"E350", size:"125x75x10", isPlate:false, wtPerMetre:15.1, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/125x75x10" },
  { id:"ML-107", sectionType:"ISA", matType:"MS", grade:"E250", size:"150x75x8", isPlate:false, wtPerMetre:14.0, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/150x75x8" },
  { id:"ML-108", sectionType:"ISA", matType:"MS", grade:"E350", size:"150x75x8", isPlate:false, wtPerMetre:14.0, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/150x75x8" },
  { id:"ML-109", sectionType:"ISA", matType:"MS", grade:"E250", size:"150x75x10", isPlate:false, wtPerMetre:17.3, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/150x75x10" },
  { id:"ML-110", sectionType:"ISA", matType:"MS", grade:"E350", size:"150x75x10", isPlate:false, wtPerMetre:17.3, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/150x75x10" },
  { id:"ML-111", sectionType:"ISA", matType:"MS", grade:"E250", size:"150x75x12", isPlate:false, wtPerMetre:20.5, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/150x75x12" },
  { id:"ML-112", sectionType:"ISA", matType:"MS", grade:"E350", size:"150x75x12", isPlate:false, wtPerMetre:20.5, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/150x75x12" },
  { id:"ML-113", sectionType:"ISA", matType:"MS", grade:"E250", size:"200x100x10", isPlate:false, wtPerMetre:23.2, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/200x100x10" },
  { id:"ML-114", sectionType:"ISA", matType:"MS", grade:"E350", size:"200x100x10", isPlate:false, wtPerMetre:23.2, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/200x100x10" },
  { id:"ML-115", sectionType:"ISA", matType:"MS", grade:"E250", size:"200x100x12", isPlate:false, wtPerMetre:27.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E250/200x100x12" },
  { id:"ML-116", sectionType:"ISA", matType:"MS", grade:"E350", size:"200x100x12", isPlate:false, wtPerMetre:27.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISA/MS/E350/200x100x12" },
  { id:"ML-117", sectionType:"ISMC", matType:"MS", grade:"E250", size:"75", isPlate:false, wtPerMetre:6.84, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E250/75" },
  { id:"ML-118", sectionType:"ISMC", matType:"MS", grade:"E350", size:"75", isPlate:false, wtPerMetre:6.84, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E350/75" },
  { id:"ML-119", sectionType:"ISMC", matType:"MS", grade:"E250", size:"100", isPlate:false, wtPerMetre:9.56, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E250/100" },
  { id:"ML-120", sectionType:"ISMC", matType:"MS", grade:"E350", size:"100", isPlate:false, wtPerMetre:9.56, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E350/100" },
  { id:"ML-121", sectionType:"ISMC", matType:"MS", grade:"E250", size:"125", isPlate:false, wtPerMetre:12.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E250/125" },
  { id:"ML-122", sectionType:"ISMC", matType:"MS", grade:"E350", size:"125", isPlate:false, wtPerMetre:12.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E350/125" },
  { id:"ML-123", sectionType:"ISMC", matType:"MS", grade:"E250", size:"150", isPlate:false, wtPerMetre:16.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E250/150" },
  { id:"ML-124", sectionType:"ISMC", matType:"MS", grade:"E350", size:"150", isPlate:false, wtPerMetre:16.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E350/150" },
  { id:"ML-125", sectionType:"ISMC", matType:"MS", grade:"E250", size:"175", isPlate:false, wtPerMetre:19.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E250/175" },
  { id:"ML-126", sectionType:"ISMC", matType:"MS", grade:"E350", size:"175", isPlate:false, wtPerMetre:19.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E350/175" },
  { id:"ML-127", sectionType:"ISMC", matType:"MS", grade:"E250", size:"200", isPlate:false, wtPerMetre:22.1, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E250/200" },
  { id:"ML-128", sectionType:"ISMC", matType:"MS", grade:"E350", size:"200", isPlate:false, wtPerMetre:22.1, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E350/200" },
  { id:"ML-129", sectionType:"ISMC", matType:"MS", grade:"E250", size:"225", isPlate:false, wtPerMetre:26.1, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E250/225" },
  { id:"ML-130", sectionType:"ISMC", matType:"MS", grade:"E350", size:"225", isPlate:false, wtPerMetre:26.1, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E350/225" },
  { id:"ML-131", sectionType:"ISMC", matType:"MS", grade:"E250", size:"250", isPlate:false, wtPerMetre:30.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E250/250" },
  { id:"ML-132", sectionType:"ISMC", matType:"MS", grade:"E350", size:"250", isPlate:false, wtPerMetre:30.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E350/250" },
  { id:"ML-133", sectionType:"ISMC", matType:"MS", grade:"E250", size:"300", isPlate:false, wtPerMetre:36.3, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E250/300" },
  { id:"ML-134", sectionType:"ISMC", matType:"MS", grade:"E350", size:"300", isPlate:false, wtPerMetre:36.3, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E350/300" },
  { id:"ML-135", sectionType:"ISMC", matType:"MS", grade:"E250", size:"350", isPlate:false, wtPerMetre:42.1, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E250/350" },
  { id:"ML-136", sectionType:"ISMC", matType:"MS", grade:"E350", size:"350", isPlate:false, wtPerMetre:42.1, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E350/350" },
  { id:"ML-137", sectionType:"ISMC", matType:"MS", grade:"E250", size:"400", isPlate:false, wtPerMetre:50.1, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E250/400" },
  { id:"ML-138", sectionType:"ISMC", matType:"MS", grade:"E350", size:"400", isPlate:false, wtPerMetre:50.1, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMC/MS/E350/400" },
  { id:"ML-139", sectionType:"ISMB", matType:"MS", grade:"E250", size:"100", isPlate:false, wtPerMetre:8.93, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E250/100" },
  { id:"ML-140", sectionType:"ISMB", matType:"MS", grade:"E350", size:"100", isPlate:false, wtPerMetre:8.93, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E350/100" },
  { id:"ML-141", sectionType:"ISMB", matType:"MS", grade:"E250", size:"125", isPlate:false, wtPerMetre:12.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E250/125" },
  { id:"ML-142", sectionType:"ISMB", matType:"MS", grade:"E350", size:"125", isPlate:false, wtPerMetre:12.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E350/125" },
  { id:"ML-143", sectionType:"ISMB", matType:"MS", grade:"E250", size:"150", isPlate:false, wtPerMetre:14.9, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E250/150" },
  { id:"ML-144", sectionType:"ISMB", matType:"MS", grade:"E350", size:"150", isPlate:false, wtPerMetre:14.9, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E350/150" },
  { id:"ML-145", sectionType:"ISMB", matType:"MS", grade:"E250", size:"175", isPlate:false, wtPerMetre:19.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E250/175" },
  { id:"ML-146", sectionType:"ISMB", matType:"MS", grade:"E350", size:"175", isPlate:false, wtPerMetre:19.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E350/175" },
  { id:"ML-147", sectionType:"ISMB", matType:"MS", grade:"E250", size:"200", isPlate:false, wtPerMetre:25.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E250/200" },
  { id:"ML-148", sectionType:"ISMB", matType:"MS", grade:"E350", size:"200", isPlate:false, wtPerMetre:25.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E350/200" },
  { id:"ML-149", sectionType:"ISMB", matType:"MS", grade:"E250", size:"225", isPlate:false, wtPerMetre:30.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E250/225" },
  { id:"ML-150", sectionType:"ISMB", matType:"MS", grade:"E350", size:"225", isPlate:false, wtPerMetre:30.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E350/225" },
  { id:"ML-151", sectionType:"ISMB", matType:"MS", grade:"E250", size:"250", isPlate:false, wtPerMetre:37.3, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E250/250" },
  { id:"ML-152", sectionType:"ISMB", matType:"MS", grade:"E350", size:"250", isPlate:false, wtPerMetre:37.3, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E350/250" },
  { id:"ML-153", sectionType:"ISMB", matType:"MS", grade:"E250", size:"300", isPlate:false, wtPerMetre:44.2, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E250/300" },
  { id:"ML-154", sectionType:"ISMB", matType:"MS", grade:"E350", size:"300", isPlate:false, wtPerMetre:44.2, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E350/300" },
  { id:"ML-155", sectionType:"ISMB", matType:"MS", grade:"E250", size:"350", isPlate:false, wtPerMetre:52.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E250/350" },
  { id:"ML-156", sectionType:"ISMB", matType:"MS", grade:"E350", size:"350", isPlate:false, wtPerMetre:52.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E350/350" },
  { id:"ML-157", sectionType:"ISMB", matType:"MS", grade:"E250", size:"400", isPlate:false, wtPerMetre:61.5, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E250/400" },
  { id:"ML-158", sectionType:"ISMB", matType:"MS", grade:"E350", size:"400", isPlate:false, wtPerMetre:61.5, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E350/400" },
  { id:"ML-159", sectionType:"ISMB", matType:"MS", grade:"E250", size:"450", isPlate:false, wtPerMetre:72.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E250/450" },
  { id:"ML-160", sectionType:"ISMB", matType:"MS", grade:"E350", size:"450", isPlate:false, wtPerMetre:72.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E350/450" },
  { id:"ML-161", sectionType:"ISMB", matType:"MS", grade:"E250", size:"500", isPlate:false, wtPerMetre:86.9, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E250/500" },
  { id:"ML-162", sectionType:"ISMB", matType:"MS", grade:"E350", size:"500", isPlate:false, wtPerMetre:86.9, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E350/500" },
  { id:"ML-163", sectionType:"ISMB", matType:"MS", grade:"E250", size:"550", isPlate:false, wtPerMetre:103.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E250/550" },
  { id:"ML-164", sectionType:"ISMB", matType:"MS", grade:"E350", size:"550", isPlate:false, wtPerMetre:103.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E350/550" },
  { id:"ML-165", sectionType:"ISMB", matType:"MS", grade:"E250", size:"600", isPlate:false, wtPerMetre:122.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E250/600" },
  { id:"ML-166", sectionType:"ISMB", matType:"MS", grade:"E350", size:"600", isPlate:false, wtPerMetre:122.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISMB/MS/E350/600" },
  { id:"ML-167", sectionType:"ISSC", matType:"MS", grade:"E250", size:"100", isPlate:false, wtPerMetre:21.0, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISSC/MS/E250/100" },
  { id:"ML-168", sectionType:"ISSC", matType:"MS", grade:"E350", size:"100", isPlate:false, wtPerMetre:21.0, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISSC/MS/E350/100" },
  { id:"ML-169", sectionType:"ISSC", matType:"MS", grade:"E250", size:"125", isPlate:false, wtPerMetre:28.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISSC/MS/E250/125" },
  { id:"ML-170", sectionType:"ISSC", matType:"MS", grade:"E350", size:"125", isPlate:false, wtPerMetre:28.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISSC/MS/E350/125" },
  { id:"ML-171", sectionType:"ISSC", matType:"MS", grade:"E250", size:"150", isPlate:false, wtPerMetre:37.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISSC/MS/E250/150" },
  { id:"ML-172", sectionType:"ISSC", matType:"MS", grade:"E350", size:"150", isPlate:false, wtPerMetre:37.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISSC/MS/E350/150" },
  { id:"ML-173", sectionType:"ISSC", matType:"MS", grade:"E250", size:"175", isPlate:false, wtPerMetre:47.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISSC/MS/E250/175" },
  { id:"ML-174", sectionType:"ISSC", matType:"MS", grade:"E350", size:"175", isPlate:false, wtPerMetre:47.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISSC/MS/E350/175" },
  { id:"ML-175", sectionType:"ISSC", matType:"MS", grade:"E250", size:"200", isPlate:false, wtPerMetre:61.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISSC/MS/E250/200" },
  { id:"ML-176", sectionType:"ISSC", matType:"MS", grade:"E350", size:"200", isPlate:false, wtPerMetre:61.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"ISSC/MS/E350/200" },
  { id:"ML-177", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"20x3", isPlate:false, wtPerMetre:0.47, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/20x3" },
  { id:"ML-178", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"20x3", isPlate:false, wtPerMetre:0.47, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/20x3" },
  { id:"ML-179", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"25x3", isPlate:false, wtPerMetre:0.59, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/25x3" },
  { id:"ML-180", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"25x3", isPlate:false, wtPerMetre:0.59, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/25x3" },
  { id:"ML-181", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"25x5", isPlate:false, wtPerMetre:0.98, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/25x5" },
  { id:"ML-182", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"25x5", isPlate:false, wtPerMetre:0.98, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/25x5" },
  { id:"ML-183", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"25x6", isPlate:false, wtPerMetre:1.18, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/25x6" },
  { id:"ML-184", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"25x6", isPlate:false, wtPerMetre:1.18, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/25x6" },
  { id:"ML-185", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"30x3", isPlate:false, wtPerMetre:0.71, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/30x3" },
  { id:"ML-186", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"30x3", isPlate:false, wtPerMetre:0.71, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/30x3" },
  { id:"ML-187", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"30x5", isPlate:false, wtPerMetre:1.18, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/30x5" },
  { id:"ML-188", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"30x5", isPlate:false, wtPerMetre:1.18, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/30x5" },
  { id:"ML-189", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"30x6", isPlate:false, wtPerMetre:1.41, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/30x6" },
  { id:"ML-190", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"30x6", isPlate:false, wtPerMetre:1.41, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/30x6" },
  { id:"ML-191", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"40x3", isPlate:false, wtPerMetre:0.94, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/40x3" },
  { id:"ML-192", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"40x3", isPlate:false, wtPerMetre:0.94, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/40x3" },
  { id:"ML-193", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"40x5", isPlate:false, wtPerMetre:1.57, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/40x5" },
  { id:"ML-194", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"40x5", isPlate:false, wtPerMetre:1.57, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/40x5" },
  { id:"ML-195", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"40x6", isPlate:false, wtPerMetre:1.88, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/40x6" },
  { id:"ML-196", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"40x6", isPlate:false, wtPerMetre:1.88, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/40x6" },
  { id:"ML-197", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"40x8", isPlate:false, wtPerMetre:2.51, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/40x8" },
  { id:"ML-198", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"40x8", isPlate:false, wtPerMetre:2.51, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/40x8" },
  { id:"ML-199", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"50x5", isPlate:false, wtPerMetre:1.96, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/50x5" },
  { id:"ML-200", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"50x5", isPlate:false, wtPerMetre:1.96, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/50x5" },
  { id:"ML-201", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"50x6", isPlate:false, wtPerMetre:2.36, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/50x6" },
  { id:"ML-202", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"50x6", isPlate:false, wtPerMetre:2.36, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/50x6" },
  { id:"ML-203", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"50x8", isPlate:false, wtPerMetre:3.14, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/50x8" },
  { id:"ML-204", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"50x8", isPlate:false, wtPerMetre:3.14, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/50x8" },
  { id:"ML-205", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"50x10", isPlate:false, wtPerMetre:3.93, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/50x10" },
  { id:"ML-206", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"50x10", isPlate:false, wtPerMetre:3.93, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/50x10" },
  { id:"ML-207", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"60x6", isPlate:false, wtPerMetre:2.83, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/60x6" },
  { id:"ML-208", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"60x6", isPlate:false, wtPerMetre:2.83, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/60x6" },
  { id:"ML-209", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"60x8", isPlate:false, wtPerMetre:3.77, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/60x8" },
  { id:"ML-210", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"60x8", isPlate:false, wtPerMetre:3.77, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/60x8" },
  { id:"ML-211", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"60x10", isPlate:false, wtPerMetre:4.71, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/60x10" },
  { id:"ML-212", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"60x10", isPlate:false, wtPerMetre:4.71, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/60x10" },
  { id:"ML-213", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"65x6", isPlate:false, wtPerMetre:3.06, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/65x6" },
  { id:"ML-214", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"65x6", isPlate:false, wtPerMetre:3.06, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/65x6" },
  { id:"ML-215", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"65x8", isPlate:false, wtPerMetre:4.08, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/65x8" },
  { id:"ML-216", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"65x8", isPlate:false, wtPerMetre:4.08, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/65x8" },
  { id:"ML-217", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"65x10", isPlate:false, wtPerMetre:5.1, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/65x10" },
  { id:"ML-218", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"65x10", isPlate:false, wtPerMetre:5.1, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/65x10" },
  { id:"ML-219", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"75x6", isPlate:false, wtPerMetre:3.53, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/75x6" },
  { id:"ML-220", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"75x6", isPlate:false, wtPerMetre:3.53, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/75x6" },
  { id:"ML-221", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"75x8", isPlate:false, wtPerMetre:4.71, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/75x8" },
  { id:"ML-222", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"75x8", isPlate:false, wtPerMetre:4.71, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/75x8" },
  { id:"ML-223", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"75x10", isPlate:false, wtPerMetre:5.89, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/75x10" },
  { id:"ML-224", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"75x10", isPlate:false, wtPerMetre:5.89, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/75x10" },
  { id:"ML-225", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"75x12", isPlate:false, wtPerMetre:7.07, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/75x12" },
  { id:"ML-226", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"75x12", isPlate:false, wtPerMetre:7.07, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/75x12" },
  { id:"ML-227", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"100x6", isPlate:false, wtPerMetre:4.71, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/100x6" },
  { id:"ML-228", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"100x6", isPlate:false, wtPerMetre:4.71, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/100x6" },
  { id:"ML-229", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"100x8", isPlate:false, wtPerMetre:6.28, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/100x8" },
  { id:"ML-230", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"100x8", isPlate:false, wtPerMetre:6.28, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/100x8" },
  { id:"ML-231", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"100x10", isPlate:false, wtPerMetre:7.85, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/100x10" },
  { id:"ML-232", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"100x10", isPlate:false, wtPerMetre:7.85, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/100x10" },
  { id:"ML-233", sectionType:"Flat Bar", matType:"MS", grade:"E250", size:"100x12", isPlate:false, wtPerMetre:9.42, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E250/100x12" },
  { id:"ML-234", sectionType:"Flat Bar", matType:"MS", grade:"E350", size:"100x12", isPlate:false, wtPerMetre:9.42, wtPerM2:null, standardLengths:[6000, 8000], active:true, matCode:"FLATBAR/MS/E350/100x12" },
  { id:"ML-235", sectionType:"Square Bar", matType:"MS", grade:"E250", size:"10", isPlate:false, wtPerMetre:0.79, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E250/10" },
  { id:"ML-236", sectionType:"Square Bar", matType:"MS", grade:"E350", size:"10", isPlate:false, wtPerMetre:0.79, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E350/10" },
  { id:"ML-237", sectionType:"Square Bar", matType:"MS", grade:"E250", size:"12", isPlate:false, wtPerMetre:1.13, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E250/12" },
  { id:"ML-238", sectionType:"Square Bar", matType:"MS", grade:"E350", size:"12", isPlate:false, wtPerMetre:1.13, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E350/12" },
  { id:"ML-239", sectionType:"Square Bar", matType:"MS", grade:"E250", size:"16", isPlate:false, wtPerMetre:2.01, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E250/16" },
  { id:"ML-240", sectionType:"Square Bar", matType:"MS", grade:"E350", size:"16", isPlate:false, wtPerMetre:2.01, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E350/16" },
  { id:"ML-241", sectionType:"Square Bar", matType:"MS", grade:"E250", size:"20", isPlate:false, wtPerMetre:3.14, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E250/20" },
  { id:"ML-242", sectionType:"Square Bar", matType:"MS", grade:"E350", size:"20", isPlate:false, wtPerMetre:3.14, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E350/20" },
  { id:"ML-243", sectionType:"Square Bar", matType:"MS", grade:"E250", size:"25", isPlate:false, wtPerMetre:4.91, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E250/25" },
  { id:"ML-244", sectionType:"Square Bar", matType:"MS", grade:"E350", size:"25", isPlate:false, wtPerMetre:4.91, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E350/25" },
  { id:"ML-245", sectionType:"Square Bar", matType:"MS", grade:"E250", size:"28", isPlate:false, wtPerMetre:6.16, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E250/28" },
  { id:"ML-246", sectionType:"Square Bar", matType:"MS", grade:"E350", size:"28", isPlate:false, wtPerMetre:6.16, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E350/28" },
  { id:"ML-247", sectionType:"Square Bar", matType:"MS", grade:"E250", size:"32", isPlate:false, wtPerMetre:8.04, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E250/32" },
  { id:"ML-248", sectionType:"Square Bar", matType:"MS", grade:"E350", size:"32", isPlate:false, wtPerMetre:8.04, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E350/32" },
  { id:"ML-249", sectionType:"Square Bar", matType:"MS", grade:"E250", size:"36", isPlate:false, wtPerMetre:10.17, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E250/36" },
  { id:"ML-250", sectionType:"Square Bar", matType:"MS", grade:"E350", size:"36", isPlate:false, wtPerMetre:10.17, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E350/36" },
  { id:"ML-251", sectionType:"Square Bar", matType:"MS", grade:"E250", size:"40", isPlate:false, wtPerMetre:12.56, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E250/40" },
  { id:"ML-252", sectionType:"Square Bar", matType:"MS", grade:"E350", size:"40", isPlate:false, wtPerMetre:12.56, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E350/40" },
  { id:"ML-253", sectionType:"Square Bar", matType:"MS", grade:"E250", size:"45", isPlate:false, wtPerMetre:15.9, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E250/45" },
  { id:"ML-254", sectionType:"Square Bar", matType:"MS", grade:"E350", size:"45", isPlate:false, wtPerMetre:15.9, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E350/45" },
  { id:"ML-255", sectionType:"Square Bar", matType:"MS", grade:"E250", size:"50", isPlate:false, wtPerMetre:19.63, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E250/50" },
  { id:"ML-256", sectionType:"Square Bar", matType:"MS", grade:"E350", size:"50", isPlate:false, wtPerMetre:19.63, wtPerM2:null, standardLengths:[6000], active:true, matCode:"SQBAR/MS/E350/50" },
  { id:"ML-257", sectionType:"Round Bar", matType:"MS", grade:"E250", size:"8", isPlate:false, wtPerMetre:0.39, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E250/8" },
  { id:"ML-258", sectionType:"Round Bar", matType:"MS", grade:"E350", size:"8", isPlate:false, wtPerMetre:0.39, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E350/8" },
  { id:"ML-259", sectionType:"Round Bar", matType:"MS", grade:"E250", size:"10", isPlate:false, wtPerMetre:0.62, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E250/10" },
  { id:"ML-260", sectionType:"Round Bar", matType:"MS", grade:"E350", size:"10", isPlate:false, wtPerMetre:0.62, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E350/10" },
  { id:"ML-261", sectionType:"Round Bar", matType:"MS", grade:"E250", size:"12", isPlate:false, wtPerMetre:0.89, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E250/12" },
  { id:"ML-262", sectionType:"Round Bar", matType:"MS", grade:"E350", size:"12", isPlate:false, wtPerMetre:0.89, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E350/12" },
  { id:"ML-263", sectionType:"Round Bar", matType:"MS", grade:"E250", size:"16", isPlate:false, wtPerMetre:1.58, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E250/16" },
  { id:"ML-264", sectionType:"Round Bar", matType:"MS", grade:"E350", size:"16", isPlate:false, wtPerMetre:1.58, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E350/16" },
  { id:"ML-265", sectionType:"Round Bar", matType:"MS", grade:"E250", size:"20", isPlate:false, wtPerMetre:2.47, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E250/20" },
  { id:"ML-266", sectionType:"Round Bar", matType:"MS", grade:"E350", size:"20", isPlate:false, wtPerMetre:2.47, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E350/20" },
  { id:"ML-267", sectionType:"Round Bar", matType:"MS", grade:"E250", size:"22", isPlate:false, wtPerMetre:2.98, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E250/22" },
  { id:"ML-268", sectionType:"Round Bar", matType:"MS", grade:"E350", size:"22", isPlate:false, wtPerMetre:2.98, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E350/22" },
  { id:"ML-269", sectionType:"Round Bar", matType:"MS", grade:"E250", size:"25", isPlate:false, wtPerMetre:3.85, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E250/25" },
  { id:"ML-270", sectionType:"Round Bar", matType:"MS", grade:"E350", size:"25", isPlate:false, wtPerMetre:3.85, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E350/25" },
  { id:"ML-271", sectionType:"Round Bar", matType:"MS", grade:"E250", size:"28", isPlate:false, wtPerMetre:4.83, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E250/28" },
  { id:"ML-272", sectionType:"Round Bar", matType:"MS", grade:"E350", size:"28", isPlate:false, wtPerMetre:4.83, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E350/28" },
  { id:"ML-273", sectionType:"Round Bar", matType:"MS", grade:"E250", size:"32", isPlate:false, wtPerMetre:6.31, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E250/32" },
  { id:"ML-274", sectionType:"Round Bar", matType:"MS", grade:"E350", size:"32", isPlate:false, wtPerMetre:6.31, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E350/32" },
  { id:"ML-275", sectionType:"Round Bar", matType:"MS", grade:"E250", size:"36", isPlate:false, wtPerMetre:7.99, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E250/36" },
  { id:"ML-276", sectionType:"Round Bar", matType:"MS", grade:"E350", size:"36", isPlate:false, wtPerMetre:7.99, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E350/36" },
  { id:"ML-277", sectionType:"Round Bar", matType:"MS", grade:"E250", size:"40", isPlate:false, wtPerMetre:9.86, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E250/40" },
  { id:"ML-278", sectionType:"Round Bar", matType:"MS", grade:"E350", size:"40", isPlate:false, wtPerMetre:9.86, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E350/40" },
  { id:"ML-279", sectionType:"Round Bar", matType:"MS", grade:"E250", size:"45", isPlate:false, wtPerMetre:12.5, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E250/45" },
  { id:"ML-280", sectionType:"Round Bar", matType:"MS", grade:"E350", size:"45", isPlate:false, wtPerMetre:12.5, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E350/45" },
  { id:"ML-281", sectionType:"Round Bar", matType:"MS", grade:"E250", size:"50", isPlate:false, wtPerMetre:15.41, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E250/50" },
  { id:"ML-282", sectionType:"Round Bar", matType:"MS", grade:"E350", size:"50", isPlate:false, wtPerMetre:15.41, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E350/50" },
  { id:"ML-283", sectionType:"Round Bar", matType:"MS", grade:"E250", size:"55", isPlate:false, wtPerMetre:18.65, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E250/55" },
  { id:"ML-284", sectionType:"Round Bar", matType:"MS", grade:"E350", size:"55", isPlate:false, wtPerMetre:18.65, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E350/55" },
  { id:"ML-285", sectionType:"Round Bar", matType:"MS", grade:"E250", size:"60", isPlate:false, wtPerMetre:22.19, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E250/60" },
  { id:"ML-286", sectionType:"Round Bar", matType:"MS", grade:"E350", size:"60", isPlate:false, wtPerMetre:22.19, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E350/60" },
  { id:"ML-287", sectionType:"Round Bar", matType:"MS", grade:"E250", size:"65", isPlate:false, wtPerMetre:26.04, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E250/65" },
  { id:"ML-288", sectionType:"Round Bar", matType:"MS", grade:"E350", size:"65", isPlate:false, wtPerMetre:26.04, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E350/65" },
  { id:"ML-289", sectionType:"Round Bar", matType:"MS", grade:"E250", size:"70", isPlate:false, wtPerMetre:30.19, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E250/70" },
  { id:"ML-290", sectionType:"Round Bar", matType:"MS", grade:"E350", size:"70", isPlate:false, wtPerMetre:30.19, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E350/70" },
  { id:"ML-291", sectionType:"Round Bar", matType:"MS", grade:"E250", size:"75", isPlate:false, wtPerMetre:34.67, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E250/75" },
  { id:"ML-292", sectionType:"Round Bar", matType:"MS", grade:"E350", size:"75", isPlate:false, wtPerMetre:34.67, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E350/75" },
  { id:"ML-293", sectionType:"Round Bar", matType:"MS", grade:"E250", size:"80", isPlate:false, wtPerMetre:39.46, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E250/80" },
  { id:"ML-294", sectionType:"Round Bar", matType:"MS", grade:"E350", size:"80", isPlate:false, wtPerMetre:39.46, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E350/80" },
  { id:"ML-295", sectionType:"Round Bar", matType:"MS", grade:"E250", size:"90", isPlate:false, wtPerMetre:49.93, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E250/90" },
  { id:"ML-296", sectionType:"Round Bar", matType:"MS", grade:"E350", size:"90", isPlate:false, wtPerMetre:49.93, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E350/90" },
  { id:"ML-297", sectionType:"Round Bar", matType:"MS", grade:"E250", size:"100", isPlate:false, wtPerMetre:61.65, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E250/100" },
  { id:"ML-298", sectionType:"Round Bar", matType:"MS", grade:"E350", size:"100", isPlate:false, wtPerMetre:61.65, wtPerM2:null, standardLengths:[6000], active:true, matCode:"ROUNDBAR/MS/E350/100" },
  { id:"ML-299", sectionType:"RHS", matType:"MS", grade:"E250", size:"50x25x2", isPlate:false, wtPerMetre:2.22, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/50x25x2" },
  { id:"ML-300", sectionType:"RHS", matType:"MS", grade:"E350", size:"50x25x2", isPlate:false, wtPerMetre:2.22, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/50x25x2" },
  { id:"ML-301", sectionType:"RHS", matType:"MS", grade:"E250", size:"50x25x2.5", isPlate:false, wtPerMetre:2.74, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/50x25x2.5" },
  { id:"ML-302", sectionType:"RHS", matType:"MS", grade:"E350", size:"50x25x2.5", isPlate:false, wtPerMetre:2.74, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/50x25x2.5" },
  { id:"ML-303", sectionType:"RHS", matType:"MS", grade:"E250", size:"50x25x3.2", isPlate:false, wtPerMetre:3.43, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/50x25x3.2" },
  { id:"ML-304", sectionType:"RHS", matType:"MS", grade:"E350", size:"50x25x3.2", isPlate:false, wtPerMetre:3.43, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/50x25x3.2" },
  { id:"ML-305", sectionType:"RHS", matType:"MS", grade:"E250", size:"60x40x2.5", isPlate:false, wtPerMetre:3.65, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/60x40x2.5" },
  { id:"ML-306", sectionType:"RHS", matType:"MS", grade:"E350", size:"60x40x2.5", isPlate:false, wtPerMetre:3.65, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/60x40x2.5" },
  { id:"ML-307", sectionType:"RHS", matType:"MS", grade:"E250", size:"60x40x3.2", isPlate:false, wtPerMetre:4.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/60x40x3.2" },
  { id:"ML-308", sectionType:"RHS", matType:"MS", grade:"E350", size:"60x40x3.2", isPlate:false, wtPerMetre:4.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/60x40x3.2" },
  { id:"ML-309", sectionType:"RHS", matType:"MS", grade:"E250", size:"60x40x4", isPlate:false, wtPerMetre:5.64, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/60x40x4" },
  { id:"ML-310", sectionType:"RHS", matType:"MS", grade:"E350", size:"60x40x4", isPlate:false, wtPerMetre:5.64, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/60x40x4" },
  { id:"ML-311", sectionType:"RHS", matType:"MS", grade:"E250", size:"76x38x2.5", isPlate:false, wtPerMetre:4.26, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/76x38x2.5" },
  { id:"ML-312", sectionType:"RHS", matType:"MS", grade:"E350", size:"76x38x2.5", isPlate:false, wtPerMetre:4.26, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/76x38x2.5" },
  { id:"ML-313", sectionType:"RHS", matType:"MS", grade:"E250", size:"76x38x3.2", isPlate:false, wtPerMetre:5.38, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/76x38x3.2" },
  { id:"ML-314", sectionType:"RHS", matType:"MS", grade:"E350", size:"76x38x3.2", isPlate:false, wtPerMetre:5.38, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/76x38x3.2" },
  { id:"ML-315", sectionType:"RHS", matType:"MS", grade:"E250", size:"76x38x4", isPlate:false, wtPerMetre:6.59, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/76x38x4" },
  { id:"ML-316", sectionType:"RHS", matType:"MS", grade:"E350", size:"76x38x4", isPlate:false, wtPerMetre:6.59, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/76x38x4" },
  { id:"ML-317", sectionType:"RHS", matType:"MS", grade:"E250", size:"80x40x2.5", isPlate:false, wtPerMetre:4.57, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/80x40x2.5" },
  { id:"ML-318", sectionType:"RHS", matType:"MS", grade:"E350", size:"80x40x2.5", isPlate:false, wtPerMetre:4.57, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/80x40x2.5" },
  { id:"ML-319", sectionType:"RHS", matType:"MS", grade:"E250", size:"80x40x3.2", isPlate:false, wtPerMetre:5.78, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/80x40x3.2" },
  { id:"ML-320", sectionType:"RHS", matType:"MS", grade:"E350", size:"80x40x3.2", isPlate:false, wtPerMetre:5.78, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/80x40x3.2" },
  { id:"ML-321", sectionType:"RHS", matType:"MS", grade:"E250", size:"80x40x4", isPlate:false, wtPerMetre:7.11, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/80x40x4" },
  { id:"ML-322", sectionType:"RHS", matType:"MS", grade:"E350", size:"80x40x4", isPlate:false, wtPerMetre:7.11, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/80x40x4" },
  { id:"ML-323", sectionType:"RHS", matType:"MS", grade:"E250", size:"100x50x2.5", isPlate:false, wtPerMetre:5.72, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/100x50x2.5" },
  { id:"ML-324", sectionType:"RHS", matType:"MS", grade:"E350", size:"100x50x2.5", isPlate:false, wtPerMetre:5.72, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/100x50x2.5" },
  { id:"ML-325", sectionType:"RHS", matType:"MS", grade:"E250", size:"100x50x3.2", isPlate:false, wtPerMetre:7.27, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/100x50x3.2" },
  { id:"ML-326", sectionType:"RHS", matType:"MS", grade:"E350", size:"100x50x3.2", isPlate:false, wtPerMetre:7.27, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/100x50x3.2" },
  { id:"ML-327", sectionType:"RHS", matType:"MS", grade:"E250", size:"100x50x4", isPlate:false, wtPerMetre:8.97, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/100x50x4" },
  { id:"ML-328", sectionType:"RHS", matType:"MS", grade:"E350", size:"100x50x4", isPlate:false, wtPerMetre:8.97, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/100x50x4" },
  { id:"ML-329", sectionType:"RHS", matType:"MS", grade:"E250", size:"100x50x5", isPlate:false, wtPerMetre:11.0, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/100x50x5" },
  { id:"ML-330", sectionType:"RHS", matType:"MS", grade:"E350", size:"100x50x5", isPlate:false, wtPerMetre:11.0, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/100x50x5" },
  { id:"ML-331", sectionType:"RHS", matType:"MS", grade:"E250", size:"100x60x4", isPlate:false, wtPerMetre:9.87, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/100x60x4" },
  { id:"ML-332", sectionType:"RHS", matType:"MS", grade:"E350", size:"100x60x4", isPlate:false, wtPerMetre:9.87, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/100x60x4" },
  { id:"ML-333", sectionType:"RHS", matType:"MS", grade:"E250", size:"100x60x5", isPlate:false, wtPerMetre:12.15, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/100x60x5" },
  { id:"ML-334", sectionType:"RHS", matType:"MS", grade:"E350", size:"100x60x5", isPlate:false, wtPerMetre:12.15, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/100x60x5" },
  { id:"ML-335", sectionType:"RHS", matType:"MS", grade:"E250", size:"120x60x3.2", isPlate:false, wtPerMetre:8.77, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/120x60x3.2" },
  { id:"ML-336", sectionType:"RHS", matType:"MS", grade:"E350", size:"120x60x3.2", isPlate:false, wtPerMetre:8.77, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/120x60x3.2" },
  { id:"ML-337", sectionType:"RHS", matType:"MS", grade:"E250", size:"120x60x4", isPlate:false, wtPerMetre:10.87, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/120x60x4" },
  { id:"ML-338", sectionType:"RHS", matType:"MS", grade:"E350", size:"120x60x4", isPlate:false, wtPerMetre:10.87, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/120x60x4" },
  { id:"ML-339", sectionType:"RHS", matType:"MS", grade:"E250", size:"120x60x5", isPlate:false, wtPerMetre:13.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/120x60x5" },
  { id:"ML-340", sectionType:"RHS", matType:"MS", grade:"E350", size:"120x60x5", isPlate:false, wtPerMetre:13.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/120x60x5" },
  { id:"ML-341", sectionType:"RHS", matType:"MS", grade:"E250", size:"150x50x3.2", isPlate:false, wtPerMetre:9.77, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/150x50x3.2" },
  { id:"ML-342", sectionType:"RHS", matType:"MS", grade:"E350", size:"150x50x3.2", isPlate:false, wtPerMetre:9.77, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/150x50x3.2" },
  { id:"ML-343", sectionType:"RHS", matType:"MS", grade:"E250", size:"150x50x4", isPlate:false, wtPerMetre:12.11, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/150x50x4" },
  { id:"ML-344", sectionType:"RHS", matType:"MS", grade:"E350", size:"150x50x4", isPlate:false, wtPerMetre:12.11, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/150x50x4" },
  { id:"ML-345", sectionType:"RHS", matType:"MS", grade:"E250", size:"150x75x4", isPlate:false, wtPerMetre:13.86, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/150x75x4" },
  { id:"ML-346", sectionType:"RHS", matType:"MS", grade:"E350", size:"150x75x4", isPlate:false, wtPerMetre:13.86, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/150x75x4" },
  { id:"ML-347", sectionType:"RHS", matType:"MS", grade:"E250", size:"150x75x5", isPlate:false, wtPerMetre:17.1, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/150x75x5" },
  { id:"ML-348", sectionType:"RHS", matType:"MS", grade:"E350", size:"150x75x5", isPlate:false, wtPerMetre:17.1, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/150x75x5" },
  { id:"ML-349", sectionType:"RHS", matType:"MS", grade:"E250", size:"150x100x4", isPlate:false, wtPerMetre:15.61, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/150x100x4" },
  { id:"ML-350", sectionType:"RHS", matType:"MS", grade:"E350", size:"150x100x4", isPlate:false, wtPerMetre:15.61, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/150x100x4" },
  { id:"ML-351", sectionType:"RHS", matType:"MS", grade:"E250", size:"150x100x5", isPlate:false, wtPerMetre:19.3, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/150x100x5" },
  { id:"ML-352", sectionType:"RHS", matType:"MS", grade:"E350", size:"150x100x5", isPlate:false, wtPerMetre:19.3, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/150x100x5" },
  { id:"ML-353", sectionType:"RHS", matType:"MS", grade:"E250", size:"200x100x4", isPlate:false, wtPerMetre:18.36, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/200x100x4" },
  { id:"ML-354", sectionType:"RHS", matType:"MS", grade:"E350", size:"200x100x4", isPlate:false, wtPerMetre:18.36, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/200x100x4" },
  { id:"ML-355", sectionType:"RHS", matType:"MS", grade:"E250", size:"200x100x5", isPlate:false, wtPerMetre:22.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/200x100x5" },
  { id:"ML-356", sectionType:"RHS", matType:"MS", grade:"E350", size:"200x100x5", isPlate:false, wtPerMetre:22.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/200x100x5" },
  { id:"ML-357", sectionType:"RHS", matType:"MS", grade:"E250", size:"200x100x6", isPlate:false, wtPerMetre:27.0, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/200x100x6" },
  { id:"ML-358", sectionType:"RHS", matType:"MS", grade:"E350", size:"200x100x6", isPlate:false, wtPerMetre:27.0, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/200x100x6" },
  { id:"ML-359", sectionType:"RHS", matType:"MS", grade:"E250", size:"200x150x5", isPlate:false, wtPerMetre:27.1, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/200x150x5" },
  { id:"ML-360", sectionType:"RHS", matType:"MS", grade:"E350", size:"200x150x5", isPlate:false, wtPerMetre:27.1, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/200x150x5" },
  { id:"ML-361", sectionType:"RHS", matType:"MS", grade:"E250", size:"200x150x6", isPlate:false, wtPerMetre:32.3, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/200x150x6" },
  { id:"ML-362", sectionType:"RHS", matType:"MS", grade:"E350", size:"200x150x6", isPlate:false, wtPerMetre:32.3, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/200x150x6" },
  { id:"ML-363", sectionType:"RHS", matType:"MS", grade:"E250", size:"250x150x5", isPlate:false, wtPerMetre:31.5, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/250x150x5" },
  { id:"ML-364", sectionType:"RHS", matType:"MS", grade:"E350", size:"250x150x5", isPlate:false, wtPerMetre:31.5, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/250x150x5" },
  { id:"ML-365", sectionType:"RHS", matType:"MS", grade:"E250", size:"250x150x6", isPlate:false, wtPerMetre:37.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E250/250x150x6" },
  { id:"ML-366", sectionType:"RHS", matType:"MS", grade:"E350", size:"250x150x6", isPlate:false, wtPerMetre:37.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"RHS/MS/E350/250x150x6" },
  { id:"ML-367", sectionType:"SHS", matType:"MS", grade:"E250", size:"25x25x2", isPlate:false, wtPerMetre:1.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/25x25x2" },
  { id:"ML-368", sectionType:"SHS", matType:"MS", grade:"E350", size:"25x25x2", isPlate:false, wtPerMetre:1.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/25x25x2" },
  { id:"ML-369", sectionType:"SHS", matType:"MS", grade:"E250", size:"25x25x2.5", isPlate:false, wtPerMetre:1.71, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/25x25x2.5" },
  { id:"ML-370", sectionType:"SHS", matType:"MS", grade:"E350", size:"25x25x2.5", isPlate:false, wtPerMetre:1.71, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/25x25x2.5" },
  { id:"ML-371", sectionType:"SHS", matType:"MS", grade:"E250", size:"30x30x2", isPlate:false, wtPerMetre:1.72, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/30x30x2" },
  { id:"ML-372", sectionType:"SHS", matType:"MS", grade:"E350", size:"30x30x2", isPlate:false, wtPerMetre:1.72, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/30x30x2" },
  { id:"ML-373", sectionType:"SHS", matType:"MS", grade:"E250", size:"30x30x2.5", isPlate:false, wtPerMetre:2.11, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/30x30x2.5" },
  { id:"ML-374", sectionType:"SHS", matType:"MS", grade:"E350", size:"30x30x2.5", isPlate:false, wtPerMetre:2.11, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/30x30x2.5" },
  { id:"ML-375", sectionType:"SHS", matType:"MS", grade:"E250", size:"40x40x2", isPlate:false, wtPerMetre:2.35, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/40x40x2" },
  { id:"ML-376", sectionType:"SHS", matType:"MS", grade:"E350", size:"40x40x2", isPlate:false, wtPerMetre:2.35, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/40x40x2" },
  { id:"ML-377", sectionType:"SHS", matType:"MS", grade:"E250", size:"40x40x2.5", isPlate:false, wtPerMetre:2.9, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/40x40x2.5" },
  { id:"ML-378", sectionType:"SHS", matType:"MS", grade:"E350", size:"40x40x2.5", isPlate:false, wtPerMetre:2.9, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/40x40x2.5" },
  { id:"ML-379", sectionType:"SHS", matType:"MS", grade:"E250", size:"40x40x3.2", isPlate:false, wtPerMetre:3.61, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/40x40x3.2" },
  { id:"ML-380", sectionType:"SHS", matType:"MS", grade:"E350", size:"40x40x3.2", isPlate:false, wtPerMetre:3.61, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/40x40x3.2" },
  { id:"ML-381", sectionType:"SHS", matType:"MS", grade:"E250", size:"50x50x2.5", isPlate:false, wtPerMetre:3.68, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/50x50x2.5" },
  { id:"ML-382", sectionType:"SHS", matType:"MS", grade:"E350", size:"50x50x2.5", isPlate:false, wtPerMetre:3.68, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/50x50x2.5" },
  { id:"ML-383", sectionType:"SHS", matType:"MS", grade:"E250", size:"50x50x3.2", isPlate:false, wtPerMetre:4.62, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/50x50x3.2" },
  { id:"ML-384", sectionType:"SHS", matType:"MS", grade:"E350", size:"50x50x3.2", isPlate:false, wtPerMetre:4.62, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/50x50x3.2" },
  { id:"ML-385", sectionType:"SHS", matType:"MS", grade:"E250", size:"50x50x4", isPlate:false, wtPerMetre:5.64, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/50x50x4" },
  { id:"ML-386", sectionType:"SHS", matType:"MS", grade:"E350", size:"50x50x4", isPlate:false, wtPerMetre:5.64, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/50x50x4" },
  { id:"ML-387", sectionType:"SHS", matType:"MS", grade:"E250", size:"60x60x2.5", isPlate:false, wtPerMetre:4.49, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/60x60x2.5" },
  { id:"ML-388", sectionType:"SHS", matType:"MS", grade:"E350", size:"60x60x2.5", isPlate:false, wtPerMetre:4.49, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/60x60x2.5" },
  { id:"ML-389", sectionType:"SHS", matType:"MS", grade:"E250", size:"60x60x3.2", isPlate:false, wtPerMetre:5.64, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/60x60x3.2" },
  { id:"ML-390", sectionType:"SHS", matType:"MS", grade:"E350", size:"60x60x3.2", isPlate:false, wtPerMetre:5.64, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/60x60x3.2" },
  { id:"ML-391", sectionType:"SHS", matType:"MS", grade:"E250", size:"60x60x4", isPlate:false, wtPerMetre:6.93, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/60x60x4" },
  { id:"ML-392", sectionType:"SHS", matType:"MS", grade:"E350", size:"60x60x4", isPlate:false, wtPerMetre:6.93, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/60x60x4" },
  { id:"ML-393", sectionType:"SHS", matType:"MS", grade:"E250", size:"75x75x3.2", isPlate:false, wtPerMetre:7.21, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/75x75x3.2" },
  { id:"ML-394", sectionType:"SHS", matType:"MS", grade:"E350", size:"75x75x3.2", isPlate:false, wtPerMetre:7.21, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/75x75x3.2" },
  { id:"ML-395", sectionType:"SHS", matType:"MS", grade:"E250", size:"75x75x4", isPlate:false, wtPerMetre:8.91, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/75x75x4" },
  { id:"ML-396", sectionType:"SHS", matType:"MS", grade:"E350", size:"75x75x4", isPlate:false, wtPerMetre:8.91, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/75x75x4" },
  { id:"ML-397", sectionType:"SHS", matType:"MS", grade:"E250", size:"75x75x5", isPlate:false, wtPerMetre:10.9, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/75x75x5" },
  { id:"ML-398", sectionType:"SHS", matType:"MS", grade:"E350", size:"75x75x5", isPlate:false, wtPerMetre:10.9, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/75x75x5" },
  { id:"ML-399", sectionType:"SHS", matType:"MS", grade:"E250", size:"80x80x3.2", isPlate:false, wtPerMetre:7.77, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/80x80x3.2" },
  { id:"ML-400", sectionType:"SHS", matType:"MS", grade:"E350", size:"80x80x3.2", isPlate:false, wtPerMetre:7.77, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/80x80x3.2" },
  { id:"ML-401", sectionType:"SHS", matType:"MS", grade:"E250", size:"80x80x4", isPlate:false, wtPerMetre:9.65, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/80x80x4" },
  { id:"ML-402", sectionType:"SHS", matType:"MS", grade:"E350", size:"80x80x4", isPlate:false, wtPerMetre:9.65, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/80x80x4" },
  { id:"ML-403", sectionType:"SHS", matType:"MS", grade:"E250", size:"80x80x5", isPlate:false, wtPerMetre:11.8, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/80x80x5" },
  { id:"ML-404", sectionType:"SHS", matType:"MS", grade:"E350", size:"80x80x5", isPlate:false, wtPerMetre:11.8, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/80x80x5" },
  { id:"ML-405", sectionType:"SHS", matType:"MS", grade:"E250", size:"100x100x3.2", isPlate:false, wtPerMetre:9.77, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/100x100x3.2" },
  { id:"ML-406", sectionType:"SHS", matType:"MS", grade:"E350", size:"100x100x3.2", isPlate:false, wtPerMetre:9.77, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/100x100x3.2" },
  { id:"ML-407", sectionType:"SHS", matType:"MS", grade:"E250", size:"100x100x4", isPlate:false, wtPerMetre:12.15, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/100x100x4" },
  { id:"ML-408", sectionType:"SHS", matType:"MS", grade:"E350", size:"100x100x4", isPlate:false, wtPerMetre:12.15, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/100x100x4" },
  { id:"ML-409", sectionType:"SHS", matType:"MS", grade:"E250", size:"100x100x5", isPlate:false, wtPerMetre:14.9, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/100x100x5" },
  { id:"ML-410", sectionType:"SHS", matType:"MS", grade:"E350", size:"100x100x5", isPlate:false, wtPerMetre:14.9, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/100x100x5" },
  { id:"ML-411", sectionType:"SHS", matType:"MS", grade:"E250", size:"100x100x6", isPlate:false, wtPerMetre:17.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/100x100x6" },
  { id:"ML-412", sectionType:"SHS", matType:"MS", grade:"E350", size:"100x100x6", isPlate:false, wtPerMetre:17.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/100x100x6" },
  { id:"ML-413", sectionType:"SHS", matType:"MS", grade:"E250", size:"120x120x4", isPlate:false, wtPerMetre:14.65, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/120x120x4" },
  { id:"ML-414", sectionType:"SHS", matType:"MS", grade:"E350", size:"120x120x4", isPlate:false, wtPerMetre:14.65, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/120x120x4" },
  { id:"ML-415", sectionType:"SHS", matType:"MS", grade:"E250", size:"120x120x5", isPlate:false, wtPerMetre:18.0, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/120x120x5" },
  { id:"ML-416", sectionType:"SHS", matType:"MS", grade:"E350", size:"120x120x5", isPlate:false, wtPerMetre:18.0, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/120x120x5" },
  { id:"ML-417", sectionType:"SHS", matType:"MS", grade:"E250", size:"120x120x6", isPlate:false, wtPerMetre:21.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/120x120x6" },
  { id:"ML-418", sectionType:"SHS", matType:"MS", grade:"E350", size:"120x120x6", isPlate:false, wtPerMetre:21.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/120x120x6" },
  { id:"ML-419", sectionType:"SHS", matType:"MS", grade:"E250", size:"150x150x4", isPlate:false, wtPerMetre:18.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/150x150x4" },
  { id:"ML-420", sectionType:"SHS", matType:"MS", grade:"E350", size:"150x150x4", isPlate:false, wtPerMetre:18.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/150x150x4" },
  { id:"ML-421", sectionType:"SHS", matType:"MS", grade:"E250", size:"150x150x5", isPlate:false, wtPerMetre:22.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/150x150x5" },
  { id:"ML-422", sectionType:"SHS", matType:"MS", grade:"E350", size:"150x150x5", isPlate:false, wtPerMetre:22.7, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/150x150x5" },
  { id:"ML-423", sectionType:"SHS", matType:"MS", grade:"E250", size:"150x150x6", isPlate:false, wtPerMetre:27.0, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/150x150x6" },
  { id:"ML-424", sectionType:"SHS", matType:"MS", grade:"E350", size:"150x150x6", isPlate:false, wtPerMetre:27.0, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/150x150x6" },
  { id:"ML-425", sectionType:"SHS", matType:"MS", grade:"E250", size:"200x200x5", isPlate:false, wtPerMetre:30.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/200x200x5" },
  { id:"ML-426", sectionType:"SHS", matType:"MS", grade:"E350", size:"200x200x5", isPlate:false, wtPerMetre:30.4, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/200x200x5" },
  { id:"ML-427", sectionType:"SHS", matType:"MS", grade:"E250", size:"200x200x6", isPlate:false, wtPerMetre:36.3, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/200x200x6" },
  { id:"ML-428", sectionType:"SHS", matType:"MS", grade:"E350", size:"200x200x6", isPlate:false, wtPerMetre:36.3, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/200x200x6" },
  { id:"ML-429", sectionType:"SHS", matType:"MS", grade:"E250", size:"200x200x8", isPlate:false, wtPerMetre:47.8, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/200x200x8" },
  { id:"ML-430", sectionType:"SHS", matType:"MS", grade:"E350", size:"200x200x8", isPlate:false, wtPerMetre:47.8, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/200x200x8" },
  { id:"ML-431", sectionType:"SHS", matType:"MS", grade:"E250", size:"250x250x6", isPlate:false, wtPerMetre:45.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/250x250x6" },
  { id:"ML-432", sectionType:"SHS", matType:"MS", grade:"E350", size:"250x250x6", isPlate:false, wtPerMetre:45.6, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/250x250x6" },
  { id:"ML-433", sectionType:"SHS", matType:"MS", grade:"E250", size:"250x250x8", isPlate:false, wtPerMetre:60.2, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E250/250x250x8" },
  { id:"ML-434", sectionType:"SHS", matType:"MS", grade:"E350", size:"250x250x8", isPlate:false, wtPerMetre:60.2, wtPerM2:null, standardLengths:[6000, 8000, 10000, 12000], active:true, matCode:"SHS/MS/E350/250x250x8" },
  { id:"ML-435", sectionType:"PLATE", matType:"MS", grade:"E250", size:"3mm", isPlate:true, wtPerMetre:null, wtPerM2:23.5, standardLengths:[], active:true, matCode:"PLATE/MS/E250/3MM" },
  { id:"ML-436", sectionType:"PLATE", matType:"MS", grade:"E350", size:"3mm", isPlate:true, wtPerMetre:null, wtPerM2:23.5, standardLengths:[], active:true, matCode:"PLATE/MS/E350/3MM" },
  { id:"ML-437", sectionType:"PLATE", matType:"MS", grade:"E250", size:"4mm", isPlate:true, wtPerMetre:null, wtPerM2:31.4, standardLengths:[], active:true, matCode:"PLATE/MS/E250/4MM" },
  { id:"ML-438", sectionType:"PLATE", matType:"MS", grade:"E350", size:"4mm", isPlate:true, wtPerMetre:null, wtPerM2:31.4, standardLengths:[], active:true, matCode:"PLATE/MS/E350/4MM" },
  { id:"ML-439", sectionType:"PLATE", matType:"MS", grade:"E250", size:"5mm", isPlate:true, wtPerMetre:null, wtPerM2:39.2, standardLengths:[], active:true, matCode:"PLATE/MS/E250/5MM" },
  { id:"ML-440", sectionType:"PLATE", matType:"MS", grade:"E350", size:"5mm", isPlate:true, wtPerMetre:null, wtPerM2:39.2, standardLengths:[], active:true, matCode:"PLATE/MS/E350/5MM" },
  { id:"ML-441", sectionType:"PLATE", matType:"MS", grade:"E250", size:"6mm", isPlate:true, wtPerMetre:null, wtPerM2:47.1, standardLengths:[], active:true, matCode:"PLATE/MS/E250/6MM" },
  { id:"ML-442", sectionType:"PLATE", matType:"MS", grade:"E350", size:"6mm", isPlate:true, wtPerMetre:null, wtPerM2:47.1, standardLengths:[], active:true, matCode:"PLATE/MS/E350/6MM" },
  { id:"ML-443", sectionType:"PLATE", matType:"MS", grade:"E250", size:"8mm", isPlate:true, wtPerMetre:null, wtPerM2:62.8, standardLengths:[], active:true, matCode:"PLATE/MS/E250/8MM" },
  { id:"ML-444", sectionType:"PLATE", matType:"MS", grade:"E350", size:"8mm", isPlate:true, wtPerMetre:null, wtPerM2:62.8, standardLengths:[], active:true, matCode:"PLATE/MS/E350/8MM" },
  { id:"ML-445", sectionType:"PLATE", matType:"MS", grade:"E250", size:"10mm", isPlate:true, wtPerMetre:null, wtPerM2:78.5, standardLengths:[], active:true, matCode:"PLATE/MS/E250/10MM" },
  { id:"ML-446", sectionType:"PLATE", matType:"MS", grade:"E350", size:"10mm", isPlate:true, wtPerMetre:null, wtPerM2:78.5, standardLengths:[], active:true, matCode:"PLATE/MS/E350/10MM" },
  { id:"ML-447", sectionType:"PLATE", matType:"MS", grade:"E250", size:"12mm", isPlate:true, wtPerMetre:null, wtPerM2:94.2, standardLengths:[], active:true, matCode:"PLATE/MS/E250/12MM" },
  { id:"ML-448", sectionType:"PLATE", matType:"MS", grade:"E350", size:"12mm", isPlate:true, wtPerMetre:null, wtPerM2:94.2, standardLengths:[], active:true, matCode:"PLATE/MS/E350/12MM" },
  { id:"ML-449", sectionType:"PLATE", matType:"MS", grade:"E250", size:"14mm", isPlate:true, wtPerMetre:null, wtPerM2:109.9, standardLengths:[], active:true, matCode:"PLATE/MS/E250/14MM" },
  { id:"ML-450", sectionType:"PLATE", matType:"MS", grade:"E350", size:"14mm", isPlate:true, wtPerMetre:null, wtPerM2:109.9, standardLengths:[], active:true, matCode:"PLATE/MS/E350/14MM" },
  { id:"ML-451", sectionType:"PLATE", matType:"MS", grade:"E250", size:"16mm", isPlate:true, wtPerMetre:null, wtPerM2:125.6, standardLengths:[], active:true, matCode:"PLATE/MS/E250/16MM" },
  { id:"ML-452", sectionType:"PLATE", matType:"MS", grade:"E350", size:"16mm", isPlate:true, wtPerMetre:null, wtPerM2:125.6, standardLengths:[], active:true, matCode:"PLATE/MS/E350/16MM" },
  { id:"ML-453", sectionType:"PLATE", matType:"MS", grade:"E250", size:"18mm", isPlate:true, wtPerMetre:null, wtPerM2:141.3, standardLengths:[], active:true, matCode:"PLATE/MS/E250/18MM" },
  { id:"ML-454", sectionType:"PLATE", matType:"MS", grade:"E350", size:"18mm", isPlate:true, wtPerMetre:null, wtPerM2:141.3, standardLengths:[], active:true, matCode:"PLATE/MS/E350/18MM" },
  { id:"ML-455", sectionType:"PLATE", matType:"MS", grade:"E250", size:"20mm", isPlate:true, wtPerMetre:null, wtPerM2:157.0, standardLengths:[], active:true, matCode:"PLATE/MS/E250/20MM" },
  { id:"ML-456", sectionType:"PLATE", matType:"MS", grade:"E350", size:"20mm", isPlate:true, wtPerMetre:null, wtPerM2:157.0, standardLengths:[], active:true, matCode:"PLATE/MS/E350/20MM" },
  { id:"ML-457", sectionType:"PLATE", matType:"MS", grade:"E250", size:"22mm", isPlate:true, wtPerMetre:null, wtPerM2:172.7, standardLengths:[], active:true, matCode:"PLATE/MS/E250/22MM" },
  { id:"ML-458", sectionType:"PLATE", matType:"MS", grade:"E350", size:"22mm", isPlate:true, wtPerMetre:null, wtPerM2:172.7, standardLengths:[], active:true, matCode:"PLATE/MS/E350/22MM" },
  { id:"ML-459", sectionType:"PLATE", matType:"MS", grade:"E250", size:"25mm", isPlate:true, wtPerMetre:null, wtPerM2:196.2, standardLengths:[], active:true, matCode:"PLATE/MS/E250/25MM" },
  { id:"ML-460", sectionType:"PLATE", matType:"MS", grade:"E350", size:"25mm", isPlate:true, wtPerMetre:null, wtPerM2:196.2, standardLengths:[], active:true, matCode:"PLATE/MS/E350/25MM" },
  { id:"ML-461", sectionType:"PLATE", matType:"MS", grade:"E250", size:"28mm", isPlate:true, wtPerMetre:null, wtPerM2:219.8, standardLengths:[], active:true, matCode:"PLATE/MS/E250/28MM" },
  { id:"ML-462", sectionType:"PLATE", matType:"MS", grade:"E350", size:"28mm", isPlate:true, wtPerMetre:null, wtPerM2:219.8, standardLengths:[], active:true, matCode:"PLATE/MS/E350/28MM" },
  { id:"ML-463", sectionType:"PLATE", matType:"MS", grade:"E250", size:"30mm", isPlate:true, wtPerMetre:null, wtPerM2:235.5, standardLengths:[], active:true, matCode:"PLATE/MS/E250/30MM" },
  { id:"ML-464", sectionType:"PLATE", matType:"MS", grade:"E350", size:"30mm", isPlate:true, wtPerMetre:null, wtPerM2:235.5, standardLengths:[], active:true, matCode:"PLATE/MS/E350/30MM" },
  { id:"ML-465", sectionType:"PLATE", matType:"MS", grade:"E250", size:"32mm", isPlate:true, wtPerMetre:null, wtPerM2:251.2, standardLengths:[], active:true, matCode:"PLATE/MS/E250/32MM" },
  { id:"ML-466", sectionType:"PLATE", matType:"MS", grade:"E350", size:"32mm", isPlate:true, wtPerMetre:null, wtPerM2:251.2, standardLengths:[], active:true, matCode:"PLATE/MS/E350/32MM" },
  { id:"ML-467", sectionType:"PLATE", matType:"MS", grade:"E250", size:"36mm", isPlate:true, wtPerMetre:null, wtPerM2:282.6, standardLengths:[], active:true, matCode:"PLATE/MS/E250/36MM" },
  { id:"ML-468", sectionType:"PLATE", matType:"MS", grade:"E350", size:"36mm", isPlate:true, wtPerMetre:null, wtPerM2:282.6, standardLengths:[], active:true, matCode:"PLATE/MS/E350/36MM" },
  { id:"ML-469", sectionType:"PLATE", matType:"MS", grade:"E250", size:"40mm", isPlate:true, wtPerMetre:null, wtPerM2:314.0, standardLengths:[], active:true, matCode:"PLATE/MS/E250/40MM" },
  { id:"ML-470", sectionType:"PLATE", matType:"MS", grade:"E350", size:"40mm", isPlate:true, wtPerMetre:null, wtPerM2:314.0, standardLengths:[], active:true, matCode:"PLATE/MS/E350/40MM" },
  { id:"ML-471", sectionType:"PLATE", matType:"MS", grade:"E250", size:"45mm", isPlate:true, wtPerMetre:null, wtPerM2:353.2, standardLengths:[], active:true, matCode:"PLATE/MS/E250/45MM" },
  { id:"ML-472", sectionType:"PLATE", matType:"MS", grade:"E350", size:"45mm", isPlate:true, wtPerMetre:null, wtPerM2:353.2, standardLengths:[], active:true, matCode:"PLATE/MS/E350/45MM" },
  { id:"ML-473", sectionType:"PLATE", matType:"MS", grade:"E250", size:"50mm", isPlate:true, wtPerMetre:null, wtPerM2:392.5, standardLengths:[], active:true, matCode:"PLATE/MS/E250/50MM" },
  { id:"ML-474", sectionType:"PLATE", matType:"MS", grade:"E350", size:"50mm", isPlate:true, wtPerMetre:null, wtPerM2:392.5, standardLengths:[], active:true, matCode:"PLATE/MS/E350/50MM" },
  { id:"ML-475", sectionType:"PLATE", matType:"MS", grade:"E250", size:"56mm", isPlate:true, wtPerMetre:null, wtPerM2:439.6, standardLengths:[], active:true, matCode:"PLATE/MS/E250/56MM" },
  { id:"ML-476", sectionType:"PLATE", matType:"MS", grade:"E350", size:"56mm", isPlate:true, wtPerMetre:null, wtPerM2:439.6, standardLengths:[], active:true, matCode:"PLATE/MS/E350/56MM" },
  { id:"ML-477", sectionType:"PLATE", matType:"MS", grade:"E250", size:"63mm", isPlate:true, wtPerMetre:null, wtPerM2:494.5, standardLengths:[], active:true, matCode:"PLATE/MS/E250/63MM" },
  { id:"ML-478", sectionType:"PLATE", matType:"MS", grade:"E350", size:"63mm", isPlate:true, wtPerMetre:null, wtPerM2:494.5, standardLengths:[], active:true, matCode:"PLATE/MS/E350/63MM" },
  { id:"ML-479", sectionType:"PLATE", matType:"MS", grade:"E250", size:"70mm", isPlate:true, wtPerMetre:null, wtPerM2:549.5, standardLengths:[], active:true, matCode:"PLATE/MS/E250/70MM" },
  { id:"ML-480", sectionType:"PLATE", matType:"MS", grade:"E350", size:"70mm", isPlate:true, wtPerMetre:null, wtPerM2:549.5, standardLengths:[], active:true, matCode:"PLATE/MS/E350/70MM" },
  { id:"ML-481", sectionType:"PLATE", matType:"MS", grade:"E250", size:"80mm", isPlate:true, wtPerMetre:null, wtPerM2:628.0, standardLengths:[], active:true, matCode:"PLATE/MS/E250/80MM" },
  { id:"ML-482", sectionType:"PLATE", matType:"MS", grade:"E350", size:"80mm", isPlate:true, wtPerMetre:null, wtPerM2:628.0, standardLengths:[], active:true, matCode:"PLATE/MS/E350/80MM" },
  { id:"ML-483", sectionType:"PLATE", matType:"MS", grade:"E250", size:"90mm", isPlate:true, wtPerMetre:null, wtPerM2:706.5, standardLengths:[], active:true, matCode:"PLATE/MS/E250/90MM" },
  { id:"ML-484", sectionType:"PLATE", matType:"MS", grade:"E350", size:"90mm", isPlate:true, wtPerMetre:null, wtPerM2:706.5, standardLengths:[], active:true, matCode:"PLATE/MS/E350/90MM" },
  { id:"ML-485", sectionType:"PLATE", matType:"MS", grade:"E250", size:"100mm", isPlate:true, wtPerMetre:null, wtPerM2:785.0, standardLengths:[], active:true, matCode:"PLATE/MS/E250/100MM" },
  { id:"ML-486", sectionType:"PLATE", matType:"MS", grade:"E350", size:"100mm", isPlate:true, wtPerMetre:null, wtPerM2:785.0, standardLengths:[], active:true, matCode:"PLATE/MS/E350/100MM" },
  { id:"ML-487", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"15NB/L/21.3OD×2.0", isPlate:false, wtPerMetre:0.95, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/15NB/L", nominalBore:"15NB", pipeSeries:"L", outsideDiameter:21.3, wallThickness:2.0 },
  { id:"ML-488", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"15NB/M/21.3OD×2.65", isPlate:false, wtPerMetre:1.22, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/15NB/M", nominalBore:"15NB", pipeSeries:"M", outsideDiameter:21.3, wallThickness:2.65 },
  { id:"ML-489", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"15NB/H/21.3OD×3.25", isPlate:false, wtPerMetre:1.44, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/15NB/H", nominalBore:"15NB", pipeSeries:"H", outsideDiameter:21.3, wallThickness:3.25 },
  { id:"ML-490", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"20NB/L/26.9OD×2.0", isPlate:false, wtPerMetre:1.22, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/20NB/L", nominalBore:"20NB", pipeSeries:"L", outsideDiameter:26.9, wallThickness:2.0 },
  { id:"ML-491", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"20NB/M/26.9OD×2.65", isPlate:false, wtPerMetre:1.58, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/20NB/M", nominalBore:"20NB", pipeSeries:"M", outsideDiameter:26.9, wallThickness:2.65 },
  { id:"ML-492", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"20NB/H/26.9OD×3.25", isPlate:false, wtPerMetre:1.87, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/20NB/H", nominalBore:"20NB", pipeSeries:"H", outsideDiameter:26.9, wallThickness:3.25 },
  { id:"ML-493", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"25NB/L/33.7OD×2.65", isPlate:false, wtPerMetre:2.03, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/25NB/L", nominalBore:"25NB", pipeSeries:"L", outsideDiameter:33.7, wallThickness:2.65 },
  { id:"ML-494", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"25NB/M/33.7OD×3.25", isPlate:false, wtPerMetre:2.45, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/25NB/M", nominalBore:"25NB", pipeSeries:"M", outsideDiameter:33.7, wallThickness:3.25 },
  { id:"ML-495", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"25NB/H/33.7OD×4.05", isPlate:false, wtPerMetre:2.97, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/25NB/H", nominalBore:"25NB", pipeSeries:"H", outsideDiameter:33.7, wallThickness:4.05 },
  { id:"ML-496", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"32NB/L/42.4OD×2.65", isPlate:false, wtPerMetre:2.59, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/32NB/L", nominalBore:"32NB", pipeSeries:"L", outsideDiameter:42.4, wallThickness:2.65 },
  { id:"ML-497", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"32NB/M/42.4OD×3.25", isPlate:false, wtPerMetre:3.14, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/32NB/M", nominalBore:"32NB", pipeSeries:"M", outsideDiameter:42.4, wallThickness:3.25 },
  { id:"ML-498", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"32NB/H/42.4OD×4.05", isPlate:false, wtPerMetre:3.82, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/32NB/H", nominalBore:"32NB", pipeSeries:"H", outsideDiameter:42.4, wallThickness:4.05 },
  { id:"ML-499", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"40NB/L/48.3OD×2.65", isPlate:false, wtPerMetre:2.97, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/40NB/L", nominalBore:"40NB", pipeSeries:"L", outsideDiameter:48.3, wallThickness:2.65 },
  { id:"ML-500", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"40NB/M/48.3OD×3.25", isPlate:false, wtPerMetre:3.61, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/40NB/M", nominalBore:"40NB", pipeSeries:"M", outsideDiameter:48.3, wallThickness:3.25 },
  { id:"ML-501", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"40NB/H/48.3OD×4.05", isPlate:false, wtPerMetre:4.41, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/40NB/H", nominalBore:"40NB", pipeSeries:"H", outsideDiameter:48.3, wallThickness:4.05 },
  { id:"ML-502", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"50NB/L/60.3OD×2.65", isPlate:false, wtPerMetre:3.76, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/50NB/L", nominalBore:"50NB", pipeSeries:"L", outsideDiameter:60.3, wallThickness:2.65 },
  { id:"ML-503", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"50NB/M/60.3OD×3.65", isPlate:false, wtPerMetre:5.09, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/50NB/M", nominalBore:"50NB", pipeSeries:"M", outsideDiameter:60.3, wallThickness:3.65 },
  { id:"ML-504", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"50NB/H/60.3OD×4.5", isPlate:false, wtPerMetre:6.19, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/50NB/H", nominalBore:"50NB", pipeSeries:"H", outsideDiameter:60.3, wallThickness:4.5 },
  { id:"ML-505", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"65NB/L/76.1OD×3.25", isPlate:false, wtPerMetre:5.91, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/65NB/L", nominalBore:"65NB", pipeSeries:"L", outsideDiameter:76.1, wallThickness:3.25 },
  { id:"ML-506", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"65NB/M/76.1OD×3.65", isPlate:false, wtPerMetre:6.61, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/65NB/M", nominalBore:"65NB", pipeSeries:"M", outsideDiameter:76.1, wallThickness:3.65 },
  { id:"ML-507", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"65NB/H/76.1OD×4.5", isPlate:false, wtPerMetre:8.07, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/65NB/H", nominalBore:"65NB", pipeSeries:"H", outsideDiameter:76.1, wallThickness:4.5 },
  { id:"ML-508", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"80NB/L/88.9OD×3.25", isPlate:false, wtPerMetre:6.94, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/80NB/L", nominalBore:"80NB", pipeSeries:"L", outsideDiameter:88.9, wallThickness:3.25 },
  { id:"ML-509", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"80NB/M/88.9OD×4.05", isPlate:false, wtPerMetre:8.57, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/80NB/M", nominalBore:"80NB", pipeSeries:"M", outsideDiameter:88.9, wallThickness:4.05 },
  { id:"ML-510", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"80NB/H/88.9OD×4.85", isPlate:false, wtPerMetre:10.1, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/80NB/H", nominalBore:"80NB", pipeSeries:"H", outsideDiameter:88.9, wallThickness:4.85 },
  { id:"ML-511", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"100NB/L/114.3OD×3.65", isPlate:false, wtPerMetre:10.0, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/100NB/L", nominalBore:"100NB", pipeSeries:"L", outsideDiameter:114.3, wallThickness:3.65 },
  { id:"ML-512", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"100NB/M/114.3OD×4.5", isPlate:false, wtPerMetre:12.2, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/100NB/M", nominalBore:"100NB", pipeSeries:"M", outsideDiameter:114.3, wallThickness:4.5 },
  { id:"ML-513", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"100NB/H/114.3OD×5.4", isPlate:false, wtPerMetre:14.5, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/100NB/H", nominalBore:"100NB", pipeSeries:"H", outsideDiameter:114.3, wallThickness:5.4 },
  { id:"ML-514", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"125NB/L/139.7OD×4.05", isPlate:false, wtPerMetre:13.6, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/125NB/L", nominalBore:"125NB", pipeSeries:"L", outsideDiameter:139.7, wallThickness:4.05 },
  { id:"ML-515", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"125NB/M/139.7OD×4.85", isPlate:false, wtPerMetre:16.2, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/125NB/M", nominalBore:"125NB", pipeSeries:"M", outsideDiameter:139.7, wallThickness:4.85 },
  { id:"ML-516", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"125NB/H/139.7OD×5.4", isPlate:false, wtPerMetre:18.0, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/125NB/H", nominalBore:"125NB", pipeSeries:"H", outsideDiameter:139.7, wallThickness:5.4 },
  { id:"ML-517", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"150NB/L/168.3OD×4.05", isPlate:false, wtPerMetre:16.5, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/150NB/L", nominalBore:"150NB", pipeSeries:"L", outsideDiameter:168.3, wallThickness:4.05 },
  { id:"ML-518", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"150NB/M/168.3OD×4.85", isPlate:false, wtPerMetre:19.7, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/150NB/M", nominalBore:"150NB", pipeSeries:"M", outsideDiameter:168.3, wallThickness:4.85 },
  { id:"ML-519", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"150NB/H/168.3OD×5.4", isPlate:false, wtPerMetre:21.9, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/150NB/H", nominalBore:"150NB", pipeSeries:"H", outsideDiameter:168.3, wallThickness:5.4 },
  { id:"ML-520", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"200NB/L/219.1OD×4.85", isPlate:false, wtPerMetre:25.7, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/200NB/L", nominalBore:"200NB", pipeSeries:"L", outsideDiameter:219.1, wallThickness:4.85 },
  { id:"ML-521", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"200NB/M/219.1OD×5.9", isPlate:false, wtPerMetre:31.1, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/200NB/M", nominalBore:"200NB", pipeSeries:"M", outsideDiameter:219.1, wallThickness:5.9 },
  { id:"ML-522", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"200NB/H/219.1OD×7.04", isPlate:false, wtPerMetre:36.9, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/200NB/H", nominalBore:"200NB", pipeSeries:"H", outsideDiameter:219.1, wallThickness:7.04 },
  { id:"ML-523", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"250NB/L/273.0OD×5.4", isPlate:false, wtPerMetre:35.7, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/250NB/L", nominalBore:"250NB", pipeSeries:"L", outsideDiameter:273.0, wallThickness:5.4 },
  { id:"ML-524", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"250NB/M/273.0OD×6.35", isPlate:false, wtPerMetre:41.8, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/250NB/M", nominalBore:"250NB", pipeSeries:"M", outsideDiameter:273.0, wallThickness:6.35 },
  { id:"ML-525", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"250NB/H/273.0OD×7.8", isPlate:false, wtPerMetre:51.1, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/250NB/H", nominalBore:"250NB", pipeSeries:"H", outsideDiameter:273.0, wallThickness:7.8 },
  { id:"ML-526", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"300NB/L/323.9OD×5.4", isPlate:false, wtPerMetre:42.5, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/300NB/L", nominalBore:"300NB", pipeSeries:"L", outsideDiameter:323.9, wallThickness:5.4 },
  { id:"ML-527", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"300NB/M/323.9OD×7.14", isPlate:false, wtPerMetre:55.9, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/300NB/M", nominalBore:"300NB", pipeSeries:"M", outsideDiameter:323.9, wallThickness:7.14 },
  { id:"ML-528", sectionType:"CHS", matType:"MS", grade:"IS1239", size:"300NB/H/323.9OD×8.74", isPlate:false, wtPerMetre:68.0, wtPerM2:null, standardLengths:[6000], active:true, matCode:"CHS/MS/IS1239/300NB/H", nominalBore:"300NB", pipeSeries:"H", outsideDiameter:323.9, wallThickness:8.74 },
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
  qc_admin:        { modules:["dashboard","qc","qc_ops","stock","production"],  canApprove:true,  canOverride:true,  canManageUsers:false },
  qc_user:         { modules:["dashboard","production","qc"],                  canApprove:true,  canOverride:false, canManageUsers:false },
  floor_planner:   { modules:["dashboard","mrp","production","stock"],         canApprove:true,  canOverride:false, canManageUsers:false },
  production_engineer:{ modules:["dashboard","production","qc"],               canApprove:true,  canOverride:true,  canManageUsers:false },
  blasting_engineer:  { modules:["dashboard","production"],                    canApprove:false, canOverride:false, canManageUsers:false },
  painting_engineer:  { modules:["dashboard","production"],                    canApprove:false, canOverride:false, canManageUsers:false },
  finance_admin:   { modules:["dashboard","orders","finance"],                 canApprove:true,  canOverride:false, canManageUsers:false },
  finance_user:    { modules:["dashboard","finance"],                          canApprove:false, canOverride:false, canManageUsers:false },
  dispatch_admin:  { modules:["dashboard","dispatch","qc"],                    canApprove:true,  canOverride:false, canManageUsers:false },
  dispatch_user:   { modules:["dashboard","dispatch"],                         canApprove:false, canOverride:false, canManageUsers:false },
  contractor:      { modules:["dashboard","production"],                       canApprove:false, canOverride:false, canManageUsers:false },
  machine_operator:{ modules:["dashboard","production"],                       canApprove:false, canOverride:false, canManageUsers:false },
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

// ─── SEED: MACHINES ───────────────────────────────────────────────────────────
const MACHINES_SEED = [
  { id:"MCH-001", name:"Plasma Cutter 1",  type:"Cutting", bayLocation:"Bay 3", active:true, capabilities:['cut_straight','cut_profile','bevel','grind'], specs:{maxThicknessMm:25,maxSectionSizeMm:0,notes:"Hypertherm XPR300"} },
  { id:"MCH-002", name:"Flame Cutter 1",   type:"Cutting", bayLocation:"Bay 3", active:true, capabilities:['cut_straight','cut_profile','bevel'],         specs:{maxThicknessMm:100,maxSectionSizeMm:0,notes:""} },
  { id:"MCH-003", name:"Band Saw 1",       type:"Cutting", bayLocation:"Bay 5", active:true, capabilities:['cut_straight','grind'],                        specs:{maxThicknessMm:200,maxSectionSizeMm:0,notes:""} },
  { id:"MCH-004", name:"MIG Welder 1",     type:"Welding", bayLocation:"Bay 7", active:true, capabilities:[],                                              specs:{maxThicknessMm:0,maxSectionSizeMm:0,notes:""} },
  { id:"MCH-005", name:"MIG Welder 2",     type:"Welding", bayLocation:"Bay 7", active:true, capabilities:[],                                              specs:{maxThicknessMm:0,maxSectionSizeMm:0,notes:""} },
  { id:"MCH-006", name:"SAW Machine 1",    type:"Welding", bayLocation:"Bay 8", active:true, capabilities:[],                                              specs:{maxThicknessMm:0,maxSectionSizeMm:0,notes:""} },
  { id:"MCH-007", name:"Pillar Drill 1",   type:"Drilling", bayLocation:"Bay 6", active:true, capabilities:["drill","mark"],                               specs:{maxThicknessMm:50,maxSectionSizeMm:0,notes:"Radial arm drill"} },
];

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
      { id:"P001", drawingId:"D001", drawingNo:"TPL-JETTY-COL-01", markNo:"SBK-101", desc:"BRACKET ANGLE",     fabType:"Fabricate", matType:"MS", grade:"E250", section:"ISA",     size:"75x75x8",   length:150,  qtyPerDrg:80, clientUnitWt:1.335,  clientTotalWt:106.8,  source:"Procure",       requiredOps:['Cut'] },
      { id:"P002", drawingId:"D001", drawingNo:"TPL-JETTY-COL-01", markNo:"SBK-103", desc:"HEAVY BRACKET",     fabType:"Fabricate", matType:"MS", grade:"E250", section:"ISA",     size:"150x150x16",length:270,  qtyPerDrg:5,  clientUnitWt:9.666,  clientTotalWt:48.33,  source:"Procure",       requiredOps:['Cut'] },
      { id:"P003", drawingId:"D001", drawingNo:"TPL-JETTY-COL-01", markNo:"PL-001",  desc:"BASE PLATE 10MM",   fabType:"Fabricate", matType:"MS", grade:"E250", section:"PLATE",   size:"10mm",      length:500,  qtyPerDrg:4,  clientUnitWt:19.625, clientTotalWt:78.5,   source:"Procure",       requiredOps:['Cut'] },
      { id:"P004", drawingId:"D001", drawingNo:"TPL-JETTY-COL-01", markNo:"BOLT-M24",desc:"M24 HDG BOLTS",     fabType:"Bought Out",matType:"MS", grade:"Galv", section:"—",       size:"M24x100",   length:100,  qtyPerDrg:32, clientUnitWt:0.51,   clientTotalWt:16.32,  source:"Procure"      },
      { id:"P005", drawingId:"D002", drawingNo:"TPL-JETTY-BM-01",  markNo:"WB-201",  desc:"WIDE FLANGE BEAM",  fabType:"Fabricate", matType:"MS", grade:"E250", section:"ISMB",    size:"300",       length:6200, qtyPerDrg:2,  clientUnitWt:285.82, clientTotalWt:571.64, source:"Procure",       requiredOps:['Cut'] },
      { id:"P006", drawingId:"D002", drawingNo:"TPL-JETTY-BM-01",  markNo:"CH-202",  desc:"CHANNEL PURLIN",    fabType:"Fabricate", matType:"MS", grade:"E250", section:"ISMC",    size:"150",       length:2500, qtyPerDrg:8,  clientUnitWt:41.0,   clientTotalWt:328.0,  source:"Client Supply", requiredOps:['Cut'] },
      { id:"P007", drawingId:"D002", drawingNo:"TPL-JETTY-BM-01",  markNo:"FB-203",  desc:"FLAT BAR STIFFENER",fabType:"Fabricate", matType:"MS", grade:"E250", section:"Flat Bar",size:"75x10",    length:150,  qtyPerDrg:50, clientUnitWt:0.883,  clientTotalWt:44.15,  source:"Procure",       requiredOps:['Cut'] },
      { id:"P008", drawingId:"D003", drawingNo:"TPL-JETTY-BP-01",  markNo:"BP-301",  desc:"BASE PLATE 12MM",   fabType:"Fabricate", matType:"MS", grade:"E250", section:"PLATE",   size:"12mm",      length:600,  qtyPerDrg:1,  clientUnitWt:33.912, clientTotalWt:33.912, source:"Procure",       requiredOps:['Cut'] },
      { id:"P009", drawingId:"D003", drawingNo:"TPL-JETTY-BP-01",  markNo:"SBK-302", desc:"ANCHOR BOLTS",      fabType:"Bought Out",matType:"MS", grade:"Galv", section:"—",       size:"M30x600",   length:600,  qtyPerDrg:4,  clientUnitWt:3.37,   clientTotalWt:13.48,  source:"Procure"      },
      { id:"P010", drawingId:"D004", drawingNo:"TPL-JETTY-BRK-01", markNo:"BRC-401", desc:"DIAGONAL BRACING",  fabType:"Fabricate", matType:"MS", grade:"E250", section:"ISA",     size:"100x100x10",length:2400, qtyPerDrg:4,  clientUnitWt:35.76,  clientTotalWt:143.04, source:"Procure",       requiredOps:['Cut'] },
      { id:"P011", drawingId:"D004", drawingNo:"TPL-JETTY-BRK-01", markNo:"GP-402",  desc:"GUSSET PLATE 8MM",  fabType:"Fabricate", matType:"MS", grade:"E250", section:"PLATE",   size:"8mm",       length:300,  qtyPerDrg:8,  clientUnitWt:4.712,  clientTotalWt:37.696, source:"Procure",       requiredOps:['Cut'] },
    ],
    quality:{ approvedMakes:[ {matType:"MS Plates",makes:"JSW Steel, SAIL"},{matType:"Angles/ISA",makes:"JSW Steel, SAIL"},{matType:"Channels/ISMC",makes:"JSW Steel, SAIL"},{matType:"Beams/ISMB",makes:"JSW Steel, SAIL"} ] },
    transport: { transportScope:'per_dispatch', preferredTransporter:'', vehicleType:'', distanceKm:0, freightEstimate:0, insurance:false, odc:false, nightRestriction:false, policeEscort:false, specialReqs:'', freightBilling:'dispatch_line', clientTransporter:'', clientVehicleContact:'', loadingInstructions:'' },
  },
  {
    id:"SF-2025-0002", clientId:"CL-002", projectDesc:"NTPC Mouda — Equipment Support Structure", orderQty:45, orderUnit:"Ton", ratePerUnit:88000, orderValue:3960000, status:"active",
    drawings:[
      { id:"D101", drawingNo:"BHEL-ESS-FR-01",  title:"Equipment Support Frame",  qty:2, unitWt:980.0, totalWt:1960.0, phase:1, priority:1, receivedDate:"2025-01-28", status:"active"  },
      { id:"D102", drawingNo:"BHEL-ESS-PED-01", title:"Equipment Pedestal",       qty:4, unitWt:145.0, totalWt:580.0,  phase:1, priority:2, receivedDate:"2025-01-28", status:"active"  },
      { id:"D103", drawingNo:"BHEL-ESS-ACC-01", title:"Access Platform & Handrail",qty:1,unitWt:360.0, totalWt:360.0,  phase:1, priority:3, receivedDate:"",           status:"pending" },
    ],
    parts:[
      { id:"P101", drawingId:"D101", drawingNo:"BHEL-ESS-FR-01",  markNo:"FR-101", desc:"MAIN COLUMN RHS",    fabType:"Fabricate", matType:"MS", grade:"E250", section:"RHS",   size:"100x50x4",length:3500,qtyPerDrg:4, clientUnitWt:32.27,  clientTotalWt:129.08, source:"Procure", requiredOps:['Cut'] },
      { id:"P102", drawingId:"D101", drawingNo:"BHEL-ESS-FR-01",  markNo:"FR-102", desc:"HORIZONTAL ISMB",    fabType:"Fabricate", matType:"MS", grade:"E250", section:"ISMB",  size:"200",     length:2000,qtyPerDrg:3, clientUnitWt:50.8,   clientTotalWt:152.4,  source:"Procure", requiredOps:['Cut'] },
      { id:"P103", drawingId:"D101", drawingNo:"BHEL-ESS-FR-01",  markNo:"PL-103", desc:"MOUNTING PLATE 16MM",fabType:"Fabricate", matType:"MS", grade:"E350", section:"PLATE", size:"16mm",    length:400, qtyPerDrg:2, clientUnitWt:20.096, clientTotalWt:40.192, source:"Procure", requiredOps:['Cut'] },
      { id:"P104", drawingId:"D102", drawingNo:"BHEL-ESS-PED-01", markNo:"PED-201",desc:"PEDESTAL ISMC",      fabType:"Fabricate", matType:"MS", grade:"E250", section:"ISMC",  size:"200",     length:800, qtyPerDrg:2, clientUnitWt:17.68,  clientTotalWt:35.36,  source:"Procure", requiredOps:['Cut'] },
      { id:"P105", drawingId:"D102", drawingNo:"BHEL-ESS-PED-01", markNo:"BP-202", desc:"BASE PLATE 12MM",    fabType:"Fabricate", matType:"MS", grade:"E250", section:"PLATE", size:"12mm",    length:300, qtyPerDrg:1, clientUnitWt:8.478,  clientTotalWt:8.478,  source:"Procure", requiredOps:['Cut'] },
    ],
    quality:{ approvedMakes:[ {matType:"MS Plates",makes:"JSW Steel, SAIL, Tata Steel"},{matType:"RHS/SHS",makes:"APL Apollo, Tata Structura"} ] },
    transport: { transportScope:'per_dispatch', preferredTransporter:'', vehicleType:'', distanceKm:0, freightEstimate:0, insurance:false, odc:false, nightRestriction:false, policeEscort:false, specialReqs:'', freightBilling:'dispatch_line', clientTransporter:'', clientVehicleContact:'', loadingInstructions:'' },
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
      { id:"POL-001", matType:"MS", grade:"E250", sectionType:"ISA",    size:"75x75x8",    qty:2,   unit:"MT", unitPrice:65000, totalPrice:130000, wtOrdered:2000, wtReceived:2000, status:"fully_received",     qtyOrdered:2,   pricingMethod:"PerUnit", length:null, width:null, effectiveRateKg:65,    effectiveRateUnit:65000, qtyReceived:0 },
      { id:"POL-002", matType:"MS", grade:"E250", sectionType:"ISA",    size:"150x150x16", qty:1,   unit:"MT", unitPrice:67000, totalPrice:67000,  wtOrdered:1000, wtReceived:500,  status:"partially_received", qtyOrdered:1,   pricingMethod:"PerUnit", length:null, width:null, effectiveRateKg:67,    effectiveRateUnit:67000, qtyReceived:0 },
      { id:"POL-003", matType:"MS", grade:"E250", sectionType:"ISMB",   size:"300",        qty:5,   unit:"MT", unitPrice:66000, totalPrice:330000, wtOrdered:5000, wtReceived:0,    status:"pending",            qtyOrdered:5,   pricingMethod:"PerUnit", length:null, width:null, effectiveRateKg:66,    effectiveRateUnit:66000, qtyReceived:0 },
      { id:"POL-004", matType:"MS", grade:"E250", sectionType:"PLATE",  size:"10mm",       qty:1.5, unit:"MT", unitPrice:64000, totalPrice:96000,  wtOrdered:1500, wtReceived:1500, status:"fully_received",     qtyOrdered:1.5, pricingMethod:"PerUnit", length:null, width:null, effectiveRateKg:64,    effectiveRateUnit:64000, qtyReceived:0 },
    ],
    grns:[
      {
        id:"GRN-2025-001", batchNo:"JSW001-2025-001", date:"2025-02-04", vehicleNo:"MH-31-AB-1234", challanNo:"JSW/CH/2025/4521",
        supplierInvoiceNo:"", supplierInvoiceWt:0, supplierInvoiceAmt:0, reconciliationStatus:"pending",
        lines:[
          { poLineId:"POL-001", materialDesc:"ISA 75x75x8 E250",      qty:2,   unit:"MT", qtyReceived:0, calculatedWt:2000, actualWt:2000, variance:0, wtReceived:2000, condition:"good", inspStatus:"approved" },
          { poLineId:"POL-002", materialDesc:"ISA 150x150x16 E250",   qty:0.5, unit:"MT", qtyReceived:0, calculatedWt:500,  actualWt:500,  variance:0, wtReceived:500,  condition:"good", inspStatus:"approved" },
          { poLineId:"POL-004", materialDesc:"MS PLATE 10mm E250",    qty:1.5, unit:"MT", qtyReceived:0, calculatedWt:1500, actualWt:1500, variance:0, wtReceived:1500, condition:"good", inspStatus:"approved" },
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
      { id:"POL-005", matType:"MS", grade:"E250", sectionType:"PLATE", size:"12mm",  qty:2,   unit:"MT", unitPrice:64500, totalPrice:129000, wtOrdered:2000, wtReceived:0, status:"pending", qtyOrdered:2,   pricingMethod:"PerUnit", length:null, width:null, effectiveRateKg:64.5, effectiveRateUnit:64500, qtyReceived:0 },
      { id:"POL-006", matType:"MS", grade:"E250", sectionType:"ISMB",  size:"200",   qty:1,   unit:"MT", unitPrice:66000, totalPrice:66000,  wtOrdered:1000, wtReceived:0, status:"pending", qtyOrdered:1,   pricingMethod:"PerUnit", length:null, width:null, effectiveRateKg:66,   effectiveRateUnit:66000, qtyReceived:0 },
      { id:"POL-007", matType:"MS", grade:"E350", sectionType:"PLATE", size:"16mm",  qty:0.5, unit:"MT", unitPrice:68000, totalPrice:34000,  wtOrdered:500,  wtReceived:0, status:"pending", qtyOrdered:0.5, pricingMethod:"PerUnit", length:null, width:null, effectiveRateKg:68,   effectiveRateUnit:68000, qtyReceived:0 },
    ],
    grns:[],
  },
  {
    id:"PO-2025-003", vendorId:"V-003", vendorCode:"APL003", vendorName:"APL Apollo Tubes", poDate:"2025-02-02", expectedDelivery:"2025-02-12",
    servedOrders:["SF-2025-0002"], status:"pending", remarks:"RHS for BHEL ESS frame",
    lines:[
      { id:"POL-008", matType:"MS", grade:"E250", sectionType:"RHS", size:"100x50x4", qty:0.5, unit:"MT", unitPrice:72000, totalPrice:36000, wtOrdered:500, wtReceived:0, status:"pending", qtyOrdered:0.5, pricingMethod:"PerUnit", length:null, width:null, effectiveRateKg:72, effectiveRateUnit:72000, qtyReceived:0 },
    ],
    grns:[],
  },
  {
    id:"PO-2026-002", vendorId:"V-003", vendorCode:"APL003", vendorName:"APL Apollo Tubes", poDate:"2026-03-12", expectedDelivery:"2026-03-22",
    servedOrders:["SF-2025-0002"], status:"partially_received", remarks:"RHS and SHS for BHEL frame — second order",
    lines:[
      { id:"POL-013", matType:"MS", grade:"E250", sectionType:"RHS", size:"100x50x4", qty:1,   unit:"MT", unitPrice:72000, totalPrice:72000,  wtOrdered:1000, wtReceived:1000, status:"fully_received",     qtyOrdered:1,    pricingMethod:"PerUnit", length:null, width:null, effectiveRateKg:72,   effectiveRateUnit:72000, qtyReceived:0 },
      { id:"POL-014", matType:"MS", grade:"E250", sectionType:"SHS", size:"75x75x5",  qty:0.5, unit:"MT", unitPrice:74000, totalPrice:37000,  wtOrdered:500,  wtReceived:250,  status:"partially_received", qtyOrdered:0.5,  pricingMethod:"PerUnit", length:null, width:null, effectiveRateKg:74,   effectiveRateUnit:74000, qtyReceived:0 },
      { id:"POL-015", matType:"MS", grade:"E250", sectionType:"RHS", size:"50x50x4",  qty:0.5, unit:"MT", unitPrice:71000, totalPrice:35500,  wtOrdered:500,  wtReceived:0,    status:"pending",            qtyOrdered:0.5,  pricingMethod:"PerUnit", length:null, width:null, effectiveRateKg:71,   effectiveRateUnit:71000, qtyReceived:0 },
    ],
    grns:[
      {
        id:"GRN-2026-002", batchNo:"APL003-2026-001", date:"2026-03-15", vehicleNo:"MH-31-EF-9012", challanNo:"APL/CH/2026/0098",
        bayId:"BAY-09",
        supplierInvoiceNo:"", supplierInvoiceWt:0, supplierInvoiceAmt:0, reconciliationStatus:"pending",
        lines:[
          { poLineId:"POL-013", materialDesc:"RHS 100x50x4 E250", qty:1,    unit:"MT", qtyReceived:0, calculatedWt:1000, actualWt:1000, variance:0, wtReceived:1000, condition:"good", inspStatus:"approved" },
          { poLineId:"POL-014", materialDesc:"SHS 75x75x5 E250",  qty:0.25, unit:"MT", qtyReceived:0, calculatedWt:250,  actualWt:250,  variance:0, wtReceived:250,  condition:"good", inspStatus:"approved" },
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
      { id:"POL-009", matType:"MS", grade:"E250", sectionType:"ISMB",    size:"300",       qty:3,   unit:"MT", unitPrice:66500, totalPrice:199500, wtOrdered:3000, wtReceived:3000, status:"fully_received",     qtyOrdered:3,   pricingMethod:"PerUnit", length:null, width:null, effectiveRateKg:66.5, effectiveRateUnit:66500, qtyReceived:0 },
      { id:"POL-010", matType:"MS", grade:"E250", sectionType:"PLATE",   size:"12mm",      qty:2,   unit:"MT", unitPrice:64000, totalPrice:128000, wtOrdered:2000, wtReceived:800,  status:"partially_received", qtyOrdered:2,   pricingMethod:"PerUnit", length:null, width:null, effectiveRateKg:64,   effectiveRateUnit:64000, qtyReceived:0 },
      { id:"POL-011", matType:"MS", grade:"E250", sectionType:"ISA",     size:"100x100x10",qty:1.5, unit:"MT", unitPrice:65500, totalPrice:98250,  wtOrdered:1500, wtReceived:0,    status:"pending",            qtyOrdered:1.5, pricingMethod:"PerUnit", length:null, width:null, effectiveRateKg:65.5, effectiveRateUnit:65500, qtyReceived:0 },
      { id:"POL-012", matType:"MS", grade:"E350", sectionType:"PLATE",   size:"20mm",      qty:1,   unit:"MT", unitPrice:70000, totalPrice:70000,  wtOrdered:1000, wtReceived:0,    status:"pending",            qtyOrdered:1,   pricingMethod:"PerUnit", length:null, width:null, effectiveRateKg:70,   effectiveRateUnit:70000, qtyReceived:0 },
    ],
    grns:[
      {
        id:"GRN-2026-001", batchNo:"STE002-2026-001", date:"2026-03-14", vehicleNo:"MH-40-CD-5678", challanNo:"SAIL/CH/2026/0312",
        bayId:"BAY-07",
        supplierInvoiceNo:"", supplierInvoiceWt:0, supplierInvoiceAmt:0, reconciliationStatus:"pending",
        lines:[
          { poLineId:"POL-009", materialDesc:"ISMB 300 E250",        qty:3,   unit:"MT", qtyReceived:0, calculatedWt:3000, actualWt:3000, variance:0, wtReceived:3000, condition:"good",    inspStatus:"approved" },
          { poLineId:"POL-010", materialDesc:"MS PLATE 12mm E250",   qty:0.8, unit:"MT", qtyReceived:0, calculatedWt:800,  actualWt:800,  variance:0, wtReceived:800,  condition:"damaged", inspStatus:"hold"     },
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
  { id:"STK-001", lotNo:"LOT-2025-001", batchNo:"JSW001-2025-001", poId:"PO-2025-001", poLineId:"POL-001", grnId:"GRN-2025-001", vendorId:"V-001", vendorCode:"JSW001", vendorName:"JSW Steel Limited", matType:"MS", grade:"E250", sectionType:"ISA",   qtyReceived:0, unit:"MT", length:null, width:null, calculatedWt:0, actualWt:2000, variance:0, size:"75x75x8",    itemCode:"", matCode:"", matLibId:"", heatNo:"", wtReceived:2000, wtAvailable:1800, wtAllocated:200, wtIssued:0, wtConsumed:0, status:"available", bayId:"BAY-03", mtcUploaded:true,  mtcDoc:"https://drive.google.com/file/d/mtc001/view", rmQcStatus:"approved", clientInspStatus:"approved", receivedDate:"2025-02-04", isOffcut:false, parentLotId:"", allocations:[{orderId:"SF-2025-0001",drawingId:"D001",wt:200}], reservations:[] },
  { id:"STK-002", lotNo:"LOT-2025-002", batchNo:"JSW001-2025-001", poId:"PO-2025-001", poLineId:"POL-002", grnId:"GRN-2025-001", vendorId:"V-001", vendorCode:"JSW001", vendorName:"JSW Steel Limited", matType:"MS", grade:"E250", sectionType:"ISA",   qtyReceived:0, unit:"MT", length:null, width:null, calculatedWt:0, actualWt:500,  variance:0, size:"150x150x16", itemCode:"", matCode:"", matLibId:"", heatNo:"", wtReceived:500,  wtAvailable:500,  wtAllocated:0,   wtIssued:0, wtConsumed:0, status:"available", bayId:"BAY-03", mtcUploaded:true,  mtcDoc:"https://drive.google.com/file/d/mtc002/view", rmQcStatus:"approved", clientInspStatus:"approved", receivedDate:"2025-02-04", isOffcut:false, parentLotId:"", allocations:[], reservations:[] },
  { id:"STK-003", lotNo:"LOT-2025-003", batchNo:"JSW001-2025-001", poId:"PO-2025-001", poLineId:"POL-004", grnId:"GRN-2025-001", vendorId:"V-001", vendorCode:"JSW001", vendorName:"JSW Steel Limited", matType:"MS", grade:"E250", sectionType:"PLATE", qtyReceived:0, unit:"MT", length:null, width:null, calculatedWt:0, actualWt:1500, variance:0, size:"10mm",       itemCode:"", matCode:"", matLibId:"", heatNo:"", wtReceived:1500, wtAvailable:1200, wtAllocated:300, wtIssued:0, wtConsumed:0, status:"available", bayId:"BAY-05", mtcUploaded:true,  mtcDoc:"https://drive.google.com/file/d/mtc003/view", rmQcStatus:"approved", clientInspStatus:"approved", receivedDate:"2025-02-04", isOffcut:false, parentLotId:"", allocations:[{orderId:"SF-2025-0001",drawingId:"D001",wt:300}], reservations:[] },
  { id:"STK-004", lotNo:"LOT-2025-004", batchNo:"JSW001-2025-001", poId:"PO-2025-001", poLineId:"POL-001", grnId:"GRN-2025-001", vendorId:"V-001", vendorCode:"JSW001", vendorName:"JSW Steel Limited", matType:"MS", grade:"E250", sectionType:"ISA",   qtyReceived:0, unit:"MT", length:null, width:null, calculatedWt:0, actualWt:800,  variance:0, size:"75x75x8",    itemCode:"", matCode:"", matLibId:"", heatNo:"", wtReceived:800,  wtAvailable:800,  wtAllocated:0,   wtIssued:0, wtConsumed:0, status:"qc_hold",  bayId:"BAY-04", mtcUploaded:false, mtcDoc:"", rmQcStatus:"pending",  clientInspStatus:"pending",  receivedDate:"2025-02-06", isOffcut:false, parentLotId:"", allocations:[], reservations:[], qcHoldReason:"MTC not received from supplier" },
  { id:"STK-005", lotNo:"LOT-2026-001", batchNo:"STE002-2026-001", poId:"PO-2026-001", poLineId:"POL-009", grnId:"GRN-2026-001", vendorId:"V-002", vendorCode:"STE002", vendorName:"Steel Authority of India", matType:"MS", grade:"E250", sectionType:"ISMB",  qtyReceived:0, unit:"MT", length:null, width:null, calculatedWt:0, actualWt:3000, variance:0, size:"300",       itemCode:"", matCode:"", matLibId:"", heatNo:"", wtReceived:3000, wtAvailable:3000, wtAllocated:0, wtIssued:0, wtConsumed:0, status:"qc_hold", bayId:"BAY-07", mtcUploaded:false, mtcDoc:"", rmQcStatus:"pending", clientInspStatus:"pending", receivedDate:"2026-03-14", isOffcut:false, parentLotId:"", allocations:[], reservations:[], qcHoldReason:"" },
  { id:"STK-006", lotNo:"LOT-2026-002", batchNo:"STE002-2026-001", poId:"PO-2026-001", poLineId:"POL-010", grnId:"GRN-2026-001", vendorId:"V-002", vendorCode:"STE002", vendorName:"Steel Authority of India", matType:"MS", grade:"E250", sectionType:"PLATE", qtyReceived:0, unit:"MT", length:null, width:null, calculatedWt:0, actualWt:800,  variance:0, size:"12mm",      itemCode:"", matCode:"", matLibId:"", heatNo:"", wtReceived:800,  wtAvailable:800,  wtAllocated:0, wtIssued:0, wtConsumed:0, status:"qc_hold",   bayId:"BAY-07", mtcUploaded:false, mtcDoc:"", rmQcStatus:"pending",  clientInspStatus:"pending", receivedDate:"2026-03-14", isOffcut:false, parentLotId:"", allocations:[], reservations:[], qcHoldReason:"Surface rust and minor edge damage on plates — awaiting QC decision" },
  { id:"STK-007", lotNo:"LOT-2026-003", batchNo:"APL003-2026-001", poId:"PO-2026-002", poLineId:"POL-013", grnId:"GRN-2026-002", vendorId:"V-003", vendorCode:"APL003", vendorName:"APL Apollo Tubes",        matType:"MS", grade:"E250", sectionType:"RHS",   qtyReceived:0, unit:"MT", length:null, width:null, calculatedWt:0, actualWt:1000, variance:0, size:"100x50x4",  itemCode:"", matCode:"", matLibId:"", heatNo:"", wtReceived:1000, wtAvailable:1000, wtAllocated:0, wtIssued:0, wtConsumed:0, status:"qc_hold", bayId:"BAY-09", mtcUploaded:false, mtcDoc:"", rmQcStatus:"pending", clientInspStatus:"pending", receivedDate:"2026-03-15", isOffcut:false, parentLotId:"", allocations:[], reservations:[], qcHoldReason:"" },
  { id:"STK-008", lotNo:"LOT-2026-004", batchNo:"APL003-2026-001", poId:"PO-2026-002", poLineId:"POL-014", grnId:"GRN-2026-002", vendorId:"V-003", vendorCode:"APL003", vendorName:"APL Apollo Tubes",        matType:"MS", grade:"E250", sectionType:"SHS",   qtyReceived:0, unit:"MT", length:null, width:null, calculatedWt:0, actualWt:250,  variance:0, size:"75x75x5",   itemCode:"", matCode:"", matLibId:"", heatNo:"", wtReceived:250,  wtAvailable:250,  wtAllocated:0, wtIssued:0, wtConsumed:0, status:"qc_hold", bayId:"BAY-09", mtcUploaded:false, mtcDoc:"", rmQcStatus:"pending", clientInspStatus:"pending", receivedDate:"2026-03-15", isOffcut:false, parentLotId:"", allocations:[], reservations:[], qcHoldReason:"" },
];

// ─── NESTING RUNS ─────────────────────────────────────────────────────────────
const INIT_NESTING_RUNS = [
  { id:"NEST-2025-001", runDate:"2025-02-10", runBy:"Vikram Singh", materialCode:"ISA/MS/E250/75x75x8", orders:["SF-2025-0001"], drawings:["D001","D004"], lotsUsed:["STK-001"], sheetsOrBarsUsed:18, utilisationPct:84.2, wasteKg:312, offcutsCreated:[], dxfLink:"https://drive.google.com/file/d/nest001/view", status:"confirmed", parts:[] },
  { id:"NEST-2026-001", runDate:"2026-03-18", runBy:"Vikram Singh", materialCode:"ISMB/MS/E250/300", orders:["SF-2025-0001","SF-2025-0002"], drawings:["D002","D101"], lotsUsed:["STK-005"], sheetsOrBarsUsed:12, utilisationPct:91.5, wasteKg:88, offcutsCreated:[], dxfLink:"", status:"draft", parts:[] },
];

// ─── PRODUCTION INSTANCES ──────────────────────────────────────────────────────
// Each record = one physical cut piece.
// instanceId: "{markNo}/{drawingId}/{orderId}/{instanceNo padded 3}"
// currentStage: cutting | fitup | welding | tpi_weld | blasting | painting | tpi_paint | mdcc | dispatch
// currentStatus: pending_collection | in_progress | pending_supervisor | completed | defective | outbound
const INIT_INSTANCES = [];

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
  if (!l.matCode) return l.sectionType ? buildMatCode(l.sectionType, l.matType, l.grade, l.size) : "";
  if (l.isPlate) return (l.sheetLength&&l.sheetWidth) ? `${l.matCode}/${l.sheetLength}X${l.sheetWidth}` : l.matCode;
  return l.stdLength ? `${l.matCode}/${l.stdLength}` : l.matCode;
};
// Per-bar weight for GRN qty-received field (user enters bars/pcs).
// For MT-unit POs: use library wtPerMetre × bar length if available.
// Returns 0 when unable to compute — forces weighbridge manual entry.
const calcGrnWtPU = (pl, materials) => {
  if (!pl) return 0;
  const unit = (pl.unit||'MT').toUpperCase();
  if (unit==='MT'||unit==='T') {
    const len = pl.length||pl.stdLength||0;
    if (!pl.isPlate && pl.wtPerMetre && len>0) return (len/1000)*pl.wtPerMetre;
    // No length stored — try library
    if (!pl.isPlate && materials) {
      const lib = materials.find(m=>
        (m.sectionType||'').toLowerCase()===(pl.sectionType||'').toLowerCase()&&
        normSz(m.size)===normSz(pl.size||'')&&
        (m.grade||'').toLowerCase()===(pl.grade||'').toLowerCase()
      );
      if (lib?.wtPerMetre && len>0) return (len/1000)*lib.wtPerMetre;
    }
    return 0; // cannot determine per-bar weight — user enters weighbridge
  }
  // Non-MT units (KG, Pcs, NOS): weight per piece from calcPoLineWt
  const plWt = calcPoLineWt(pl);
  const plQty = +(pl.qtyOrdered||pl.qty||0);
  return plQty>0 ? plWt/plQty : 0;
};
const calcPoLineWt = (l) => {
  const unit = (l.unit||"MT").toUpperCase();
  if (unit==="MT"||unit==="T") return (l.qty||0)*1000;
  if (unit==="KG") return (l.qty||0);
  // Count-based (Sheets/Pcs/NOS): use library weight factors (present whether or not matLibId is set)
  const len = l.length||l.sheetLength||l.stdLength||0;
  const wid = l.width||l.sheetWidth||0;
  if (l.isPlate && l.wtPerM2 && len>0 && wid>0) return (l.qty||0)*(len/1000)*(wid/1000)*(l.wtPerM2);
  if (!l.isPlate && l.wtPerMetre && len>0) return (l.qty||0)*(len/1000)*(l.wtPerMetre);
  // No library weight factors: if plate with dimensions, use density formula
  const st = (l.sectionType||l.section||"").toUpperCase();
  if (st==="PLATE" && len>0 && wid>0) {
    const thk = parseFloat((l.size||"0").replace(/[^\d.]/g,""))||0;
    return (l.qty||0)*(len/1000)*(wid/1000)*7.85*thk;
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
const nextGrnId = (pos) => {
  const year = new Date().getFullYear();
  const allGrns = pos.flatMap(p => p.grns||[]);
  const thisYear = allGrns.filter(g => g.id?.startsWith(`GRN-${year}`));
  const next = String(thisYear.length + 1).padStart(3, '0');
  return `GRN-${year}-${next}`;
};
const buildStockLots = (grnForm, po, grnId, ts) =>
  (grnForm.lines||[]).filter(l=>(l.wtReceived||0)>0).map((l,idx) => {
    const poLine = po.lines?.find(pl=>pl.id===l.poLineId)||{};
    return {
      id:`LOT-${ts}-${idx}`, poId:po.id, poLineId:l.poLineId, grnId,
      vendorId:po.vendorId, vendorName:po.vendorName, vendorCode:po.vendorCode||"",
      batchNo:grnForm.batchNo||"",
      itemCode:poLine.itemCode||"", matCode:poLine.matCode||"", matLibId:poLine.matLibId||"",
      matType:poLine.matType||"MS", grade:poLine.grade||"", sectionType:poLine.sectionType||poLine.section||"", size:poLine.size||"",
      heatNo:l.heatNo||"",
      wtReceived:l.wtReceived, wtAvailable:l.wtReceived, wtAllocated:0, wtIssued:0, wtConsumed:0,
      status:"qc_hold", bayId:grnForm.bayId||"", mtcUploaded:false, mtcDoc:"",
      rmQcStatus:"pending", clientInspStatus:"pending", receivedDate:today(),
      isOffcut:false, parentLotId:"",
      allocations:[], qcHoldReason:(l.inspStatus||"")==="hold"?(grnForm.holdReason||""):"",
      qtyReceived: l.qtyReceived||0,
      unit: poLine.unit||"MT",
      length: poLine.length||null,
      width: poLine.width||null,
      calculatedWt: l.calculatedWt||l.wtReceived||0,
      actualWt: l.actualWt||l.wtReceived||0,
      variance: l.variance||0,
    };
  });

// ─── PO LINE CSV IMPORT ───────────────────────────────────────────────────────
const PO_LINE_COLS = [
  { key:"sectionType",      variants:["section type","section","sectiontype"] },
  { key:"size",             variants:["size"] },
  { key:"grade",            variants:["grade"] },
  { key:"matType",          variants:["material type","mat type","mattype","material"] },
  { key:"qtyUnits",         variants:["qty (units)","qty(units)","qty units","qty","quantity"] },
  { key:"wtRequired",       variants:["weight required (kg)","weight required","wt required (kg)","wt required","weight (kg)"] },
  { key:"unit",             variants:["unit"] },
  { key:"unitPrice",        variants:["unit price","unit price (₹)","rate","rate per unit","price"] },
  { key:"expectedDelivery", variants:["expected delivery","delivery date","exp delivery","delivery"] },
  { key:"remarks",          variants:["remarks","notes","remark"] },
  { key:"length",           variants:["length","length (mm)","bar length","std length"] },
  { key:"width",            variants:["width","width (mm)","sheet width"] },
  { key:"pricingMethod",    variants:["pricing method","pricing","price basis","pricingmethod"] },
  { key:"manualWt",         variants:["manual wt (kg/m or kg/m2)","manual wt","manual weight","wt manual"] },
];

const normalize = s => (s||'').toLowerCase().split('x').map(seg => /^\d+\.0$/.test(seg) ? seg.replace('.0','') : seg).join('x');

const parsePOLineCSV = (text, materials) => {
  const clean = (text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text).replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  const lines = clean.split("\n").map(l =>
    l.split(",").map(v => v.trim().replace(/^"|"$/g,"").replace(/""/g,'"'))
  ).filter(l => l.some(v => v.trim()));
  const allVariants = PO_LINE_COLS.flatMap(c => c.variants);
  const hdrIdx = lines.findIndex(l =>
    l.some(c => allVariants.some(v => c.toLowerCase().trim() === v))
  );
  if (hdrIdx < 0) return { rows:[], errors:["Could not find a recognised header row. Make sure it contains 'Section Type', 'Size', 'Qty', etc."], warnings:[] };
  const hdrs = lines[hdrIdx].map(h => h.toLowerCase().trim());
  const colMap = {};
  PO_LINE_COLS.forEach(c => {
    const idx = hdrs.findIndex(h => c.variants.some(v => h === v));
    if (idx >= 0) colMap[c.key] = idx;
  });
  // Skip hint/example rows (row immediately after header where qty/wt field is non-numeric)
  const dataLines = lines.slice(hdrIdx + 1).filter(l => {
    const qtyVal = colMap.qtyUnits !== undefined ? l[colMap.qtyUnits] : (colMap.qty !== undefined ? l[colMap.qty] : "");
    return qtyVal === "" || !isNaN(parseFloat(qtyVal)) ? true : !/^e\.g\./i.test(qtyVal);
  }).filter(l => l.some(v => v.trim()));
  if (!dataLines.length) return { rows:[], errors:["No data rows found after the header row."], warnings:[] };
  const ts = Date.now();
  const rows = dataLines.map((l, i) => {
    const get = k => (colMap[k] !== undefined ? (l[colMap[k]] || "").trim() : "");
    const sectionType = get("sectionType");
    const size        = get("size");
    const grade       = get("grade") || "E250";
    const matType     = get("matType") || "MS";
    const qtyUnitsRaw  = get("qtyUnits");
    const wtReqRaw     = get("wtRequired");
    const qtyUnitsVal  = parseFloat(qtyUnitsRaw) || 0;
    const wtReqVal     = parseFloat(wtReqRaw) || 0;
    const unit        = get("unit") || "MT";
    const unitPrice   = parseFloat(get("unitPrice")) || 0;
    const remarks     = get("remarks");
    const rawDel      = get("expectedDelivery");
    let expectedDelivery = "";
    if (rawDel) { const m = rawDel.match(/^(\d{2})-(\d{2})-(\d{4})$/); expectedDelivery = m ? `${m[3]}-${m[2]}-${m[1]}` : rawDel; }
    const length        = parseFloat(get("length")) || null;
    const width         = parseFloat(get("width")) || null;
    const rawPricingMethod = get("pricingMethod");
    const manualWtRaw = get("manualWt");
    const manualWtVal = parseFloat(manualWtRaw) || null;
    const libMatch   = (materials||[]).find(m =>
      (m.sectionType||"").toLowerCase() === sectionType.toLowerCase() &&
      normalize(m.size) === normalize(size) &&
      (m.grade||"").toLowerCase() === grade.toLowerCase()
    );
    const hasQty = qtyUnitsRaw !== "" && qtyUnitsVal > 0;
    const hasWt  = wtReqRaw    !== "" && wtReqVal    > 0;
    let orderMode, qty, wtOrdered, _csvWarning;
    if (hasQty && !hasWt) {
      orderMode = "ByUnits";
      qty       = qtyUnitsVal;
      wtOrdered = calcPoLineWt({ qty, unit, sectionType, length, width,
        matLibId: libMatch?.id||"", isPlate: libMatch?.isPlate||false,
        wtPerM2: libMatch?.wtPerM2||null, wtPerMetre: libMatch?.wtPerMetre||null });
    } else if (hasWt && !hasQty) {
      orderMode = "ByWeight";
      wtOrdered = wtReqVal;
      let wp = 0;
      if (libMatch) {
        if (libMatch.isPlate && length>0 && width>0) wp = (length/1000)*(width/1000)*(libMatch.wtPerM2||0);
        else if (!libMatch.isPlate && length>0) wp = (length/1000)*(libMatch.wtPerMetre||0);
      }
      qty = wp>0 ? Math.ceil(wtOrdered/wp) : 0;
    } else if (hasQty && hasWt) {
      orderMode = "ByUnits";
      qty       = qtyUnitsVal;
      wtOrdered = calcPoLineWt({ qty, unit, sectionType, length, width,
        matLibId: libMatch?.id||"", isPlate: libMatch?.isPlate||false,
        wtPerM2: libMatch?.wtPerM2||null, wtPerMetre: libMatch?.wtPerMetre||null });
      if (wtOrdered>0 && Math.abs(wtOrdered-wtReqVal)/wtOrdered>0.05)
        _csvWarning = `Row ${i+1}: Both Qty and Weight filled — used Qty. Calc wt (${Math.round(wtOrdered)} kg) differs >5% from entered wt (${Math.round(wtReqVal)} kg).`;
    } else {
      orderMode = "ByUnits"; qty = 0; wtOrdered = 0;
    }
    const effectiveUnit = orderMode==="ByWeight" ? "KG" : (unit||"MT");
    // ByWeight orders default to PerKg pricing if not explicitly specified in CSV
    const pricingMethod = rawPricingMethod || (orderMode==="ByWeight" ? "PerKg" : "PerUnit");
    const totalPrice = pricingMethod==="PerKg" ? wtOrdered*unitPrice : qty*unitPrice;
    return {
      id: `POL-${ts}-${i}`,
      sectionType, size, grade, matType, qty, unit: effectiveUnit, unitPrice,
      totalPrice, wtOrdered, wtReceived:0, status:"pending",
      expectedDelivery, remarks,
      matLibId: libMatch?.id || "",
      matCode:  libMatch?.matCode || buildMatCode(sectionType, matType, grade, size),
      itemCode: "",
      orderMode, qtyOrdered: qty, pricingMethod, length, width,
      isPlate: libMatch?.isPlate||false,
      wtPerMetre: manualWtVal && !(libMatch?.isPlate) ? manualWtVal : (libMatch?.wtPerMetre||null),
      wtPerM2: manualWtVal && (libMatch?.isPlate||(!libMatch&&(size||"").toLowerCase().includes("plate"))) ? manualWtVal : (libMatch?.wtPerM2||null),
      wtSource: !libMatch && manualWtVal ? "manual" : "",
      libraryMatch: !!libMatch,
      wtRequired: orderMode==="ByWeight" ? wtReqVal : 0,
      effectiveRateKg: wtOrdered>0 ? Math.round(totalPrice/wtOrdered*100)/100 : 0,
      effectiveRateUnit: pricingMethod==="PerKg" ? (qty>0 ? Math.round(totalPrice/qty*100)/100 : 0) : unitPrice,
      qtyReceived: 0,
      _libMatched: !!libMatch,
      _csvWarning: _csvWarning||null,
    };
  });
  const blocking = rows.filter(r => !r.sectionType || !r.size || (!r.qty && !r.wtOrdered) || !r.unitPrice);
  if (blocking.length) return {
    rows:[], errors:[`${blocking.length} row(s) are missing required fields (Section, Size, Qty or Weight, or Unit Price). Fix the file and re-upload.`], warnings:[]
  };
  const warnings = [];
  rows.filter(r=>r._csvWarning).forEach(r=>warnings.push(r._csvWarning));
  const noMatch = rows.filter(r => !r._libMatched).length;
  if (noMatch) warnings.push(`${noMatch} row(s) have no match in the Materials Library — they will still import.`);
  const knownUnits = ["MT","T","KG","NOS","PCS","SHEETS"];
  const badUnit = rows.filter(r => r.orderMode==="ByUnits" && !knownUnits.includes((r.unit||"").toUpperCase())).length;
  if (badUnit) warnings.push(`${badUnit} row(s) have an unrecognised unit — Wt Ordered defaulted to Qty value.`);
  return { rows, errors:[], warnings };
};

// ─── PRODUCTION: INSTANCE CREATION ───────────────────────────────────────────
// Called by cutting confirmation screen when a bar is confirmed cut.
// confirmedParts: [{ markNo, drawingId, drawingNo, orderId, desc,
//                    actualQty, totalInstances, subOpsRequired:[],
//                    isDefective, defectType, defectReason }]
const createInstances = ({ nestingRunId, lotId, barRef, batchNo, cuttingBayUsed,
                           confirmedParts, confirmedBy, confirmDate, existingInstances }) => {
  const newInstances = [];
  const existing = existingInstances || [];
  confirmedParts.forEach(part => {
    // Count already-created instances for this markNo/drawing/order to continue the sequence
    const priorCount = existing.filter(
      i => i.markNo === part.markNo && i.drawingId === part.drawingId && i.orderId === part.orderId
    ).length;
    for (let n = 0; n < (part.actualQty || 0); n++) {
      const instanceNo  = priorCount + n + 1;
      const instanceId  = `${part.markNo}/${part.drawingId}/${part.orderId}/${String(instanceNo).padStart(3,"0")}`;
      const isDefective = !!part.isDefective;
      newInstances.push({
        instanceId,
        markNo:       part.markNo,
        desc:         part.desc || "",
        drawingId:    part.drawingId,
        drawingNo:    part.drawingNo || "",
        orderId:      part.orderId,
        instanceNo,
        totalInstances: part.totalInstances || part.actualQty,
        // Defective pieces stay at cutting stage; good pieces ready for collection
        currentStage:  "cutting",
        currentStatus: isDefective ? "defective" : "pending_collection",
        // Traceability
        lotId, batchNo, nestingRunId, barRef, cuttingBayUsed,
        // Assignment — auto-filled from release data when available
        assignedContractorId:   part.contractorId||"",
        assignedContractorName: part.contractorName||"",
        pinnedEngineerId:       part.pinnedEngineerId||"",
        pinnedEngineerName:     part.pinnedEngineerName||"",
        // Sub-operations
        subOpsRequired:  part.subOpsRequired || ["cut"],
        subOpsCompleted: isDefective ? [] : (part.subOpsRequired || ["cut"]),
        // Outbound processing
        outboundCount:   0,
        outboundHistory: [],
        // Stage history — first entry is cutting
        stageHistory: [{
          stage:          "cutting",
          subOps:         part.subOpsRequired || ["cut"],
          markedDoneBy:   confirmedBy,
          markedDoneDate: confirmDate,
          markedDoneTime: "",
          signedOffBy:    confirmedBy,  // cutting confirmation is single-action sign-off
          signedOffDate:  confirmDate,
          checklistItems: { dimensionsOk: !isDefective, countMatches: true },
          remarks:        isDefective ? (part.defectReason || "") : "",
          rejections:     [],
          cuttingBayUsed,
        }],
        // Defects
        defects: isDefective
          ? [{ type: part.defectType || "dimensional", reason: part.defectReason || "",
               reportedBy: confirmedBy, date: confirmDate }]
          : [],
        qualityConcernFlag: false,
        rejectionCount:     0,
      });
    }
  });
  return newInstances;
};

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
  { id:"qc_ops",    label:"QC Admin",     icon:"🔍", module:"qc_ops"     },
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
const ClientsMaster = ({ user, clients, setClients, orders, setOrders }) => {
  const [search, setSearch] = useState(""); const [modal, setModal] = useState(null); const [form, setForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const filtered = clients.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.code.toLowerCase().includes(search.toLowerCase()));
  const canEdit = user.role==="super_admin"||user.role==="finance_admin";
  const save = () => {
    if (modal==="edit"&&setOrders) {
      setOrders(prev=>prev.map(o=>o.clientId===form.id?{...o,clientName:form.name}:o));
    }
    setClients(prev=>modal==="add"?[...prev,{...form,id:`CL-${String(prev.length+1).padStart(3,"0")}`}]:prev.map(c=>c.id===form.id?form:c));
    setModal(null);
  };
  const tryDelete = (client) => {
    const refCount = (orders||[]).filter(o=>o.clientId===client.id).length;
    if (refCount>0) { setDeleteConfirm({client, blocked:true, refCount}); }
    else { setDeleteConfirm({client, blocked:false}); }
  };
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
        {key:"actions", label:"", render:r=>canEdit?(
          <div style={{ display:"flex", gap:4 }}>
            <button onClick={()=>{setForm({...r});setModal("edit");}} style={css.btn.ghost}>Edit</button>
            {user.role==="super_admin"&&<button onClick={()=>tryDelete(r)} style={{ ...css.btn.ghost, color:T.red }}>Delete</button>}
          </div>
        ):null},
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
      {deleteConfirm&&(
        <Modal title="Delete Client" onClose={()=>setDeleteConfirm(null)}>
          {deleteConfirm.blocked
            ? <InfoBanner color="red">Cannot delete — <strong>{deleteConfirm.client.name}</strong> is referenced by <strong>{deleteConfirm.refCount} order(s)</strong>. Remove or reassign those orders first.</InfoBanner>
            : <InfoBanner color="red">Permanently delete <strong>{deleteConfirm.client.name}</strong>? This cannot be undone.</InfoBanner>}
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:14 }}>
            <button onClick={()=>setDeleteConfirm(null)} style={css.btn.secondary}>Cancel</button>
            {!deleteConfirm.blocked&&<button onClick={()=>{setClients(prev=>prev.filter(c=>c.id!==deleteConfirm.client.id));setDeleteConfirm(null);}} style={{ ...css.btn.primary, background:T.red, borderColor:T.red }}>Delete</button>}
          </div>
        </Modal>
      )}
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

const VendorsMaster = ({ user, vendors, setVendors, pos, setPos, stock }) => {
  const [search, setSearch] = useState(""); const [typeFilter, setTypeFilter] = useState("all");
  const [modal, setModal] = useState(null); // null | "add" | "edit"
  const [form, setForm] = useState({});
  const [customPrefix, setCustomPrefix] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
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
      if (setPos) setPos(prev=>prev.map(p=>p.vendorId===next.id?{...p,vendorName:next.name}:p));
    }
    closeModal();
  };

  const tryDeleteVendor = (vendor) => {
    const poCount = (pos||[]).filter(p=>p.vendorId===vendor.id).length;
    const lotCount = (stock||[]).filter(s=>s.vendorId===vendor.id).length;
    const refCount = poCount+lotCount;
    setDeleteConfirm({vendor, blocked:refCount>0, poCount, lotCount});
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
        {key:"actions", label:"", render:r=>canEdit?(
          <div style={{ display:"flex", gap:4 }}>
            <button onClick={()=>openEdit(r)} style={css.btn.ghost}>Edit</button>
            {user.role==="super_admin"&&<button onClick={()=>tryDeleteVendor(r)} style={{ ...css.btn.ghost, color:T.red }}>Delete</button>}
          </div>
        ):null},
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
      {deleteConfirm&&(
        <Modal title="Delete Vendor" onClose={()=>setDeleteConfirm(null)}>
          {deleteConfirm.blocked
            ? <InfoBanner color="red">Cannot delete — <strong>{deleteConfirm.vendor.name}</strong> is referenced by <strong>{deleteConfirm.poCount} PO(s)</strong> and <strong>{deleteConfirm.lotCount} stock lot(s)</strong>. Remove references first.</InfoBanner>
            : <InfoBanner color="red">Permanently delete <strong>{deleteConfirm.vendor.name}</strong>? This cannot be undone.</InfoBanner>}
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:14 }}>
            <button onClick={()=>setDeleteConfirm(null)} style={css.btn.secondary}>Cancel</button>
            {!deleteConfirm.blocked&&<button onClick={()=>{setVendors(prev=>prev.filter(v=>v.id!==deleteConfirm.vendor.id));setDeleteConfirm(null);}} style={{ ...css.btn.primary, background:T.red, borderColor:T.red }}>Delete</button>}
          </div>
        </Modal>
      )}
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
const MAT_PAGE_SIZE = 50;
const MaterialsMaster = ({ user, materials, setMaterials }) => {
  const [search, setSearch] = useState(""); const [sectionFilter, setSectionFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all"); const [page, setPage] = useState(0);
  const [modal, setModal] = useState(null); const [form, setForm] = useState({}); const [lenInput, setLenInput] = useState("");
  const canEdit = user.role==="super_admin"||user.role==="qc_admin";
  const sections = ["all",...Array.from(new Set(materials.map(m=>m.sectionType))).sort()];
  const grades   = ["all",...Array.from(new Set(materials.map(m=>m.grade))).sort()];
  const isPlateForm = form.sectionType==="PLATE";
  const previewCode = form.sectionType&&form.matType&&form.grade&&form.size ? buildMatCode(form.sectionType,form.matType,form.grade,form.size) : "";
  const filtered = materials.filter(m=>{
    const q = search.toLowerCase();
    const matchQ = !q || (m.matCode||"").toLowerCase().includes(q) || m.size.toLowerCase().includes(q) || m.sectionType.toLowerCase().includes(q) || (m.grade||"").toLowerCase().includes(q);
    return matchQ && (sectionFilter==="all"||m.sectionType===sectionFilter) && (gradeFilter==="all"||m.grade===gradeFilter);
  });
  const totalPages = Math.ceil(filtered.length/MAT_PAGE_SIZE);
  const paged = filtered.slice(page*MAT_PAGE_SIZE, (page+1)*MAT_PAGE_SIZE);
  const resetPage = () => setPage(0);
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
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12, flexWrap:"wrap", gap:8 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:T.text }}>Materials Library</div>
          <div style={{ fontSize:12, color:T.textMid, marginTop:2 }}>
            Showing <strong style={{color:T.accent}}>{filtered.length}</strong> of {materials.length} entries
            {filtered.length<materials.length&&<span style={{color:T.amber}}> (filtered)</span>}
          </div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          <MSearch value={search} onChange={v=>{setSearch(v);resetPage();}} placeholder="Search section / size / grade / matCode…" />
          <select value={sectionFilter} onChange={e=>{setSectionFilter(e.target.value);resetPage();}} style={{ ...css.input, width:140 }}>
            {sections.map(s=><option key={s} value={s}>{s==="all"?"All Sections":s}</option>)}
          </select>
          <select value={gradeFilter} onChange={e=>{setGradeFilter(e.target.value);resetPage();}} style={{ ...css.input, width:110 }}>
            {grades.map(g=><option key={g} value={g}>{g==="all"?"All Grades":g}</option>)}
          </select>
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
        {key:"actions", label:"", render:r=>canEdit?(
          <div style={{ display:"flex", gap:4 }}>
            <button onClick={()=>openEdit(r)} style={css.btn.ghost}>Edit</button>
            {user.role==="super_admin"&&<button onClick={()=>setMaterials(prev=>prev.map(m=>m.id===r.id?{...m,active:!m.active}:m))} style={{ ...css.btn.ghost, color:r.active?T.red:T.green, fontSize:11 }}>{r.active?"Deactivate":"Activate"}</button>}
          </div>
        ):null},
      ]} rows={paged} />
      {totalPages>1&&(
        <div style={{ display:"flex", gap:6, alignItems:"center", justifyContent:"center", marginTop:12 }}>
          <button onClick={()=>setPage(0)} disabled={page===0} style={{ ...css.btn.secondary, padding:"4px 8px", fontSize:11, opacity:page===0?0.4:1 }}>«</button>
          <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{ ...css.btn.secondary, padding:"4px 8px", fontSize:11, opacity:page===0?0.4:1 }}>‹ Prev</button>
          <span style={{ fontSize:12, color:T.textMid, padding:"0 8px" }}>Page {page+1} of {totalPages} · {filtered.length} results</span>
          <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{ ...css.btn.secondary, padding:"4px 8px", fontSize:11, opacity:page>=totalPages-1?0.4:1 }}>Next ›</button>
          <button onClick={()=>setPage(totalPages-1)} disabled={page>=totalPages-1} style={{ ...css.btn.secondary, padding:"4px 8px", fontSize:11, opacity:page>=totalPages-1?0.4:1 }}>»</button>
        </div>
      )}
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
const CompanyMaster = ({ user, company, setCompany }) => {
  const [form, setForm] = useState({...company});
  const [dirty, setDirty] = useState(false);
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
      {/* Reset to seed data — super_admin only */}
      <div style={{ marginTop:32, paddingTop:20, borderTop:`1px solid ${T.border}` }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.textMid, marginBottom:8 }}>DANGER ZONE</div>
        <div style={{ display:"flex", alignItems:"center", gap:16, padding:"14px 16px", background:T.redBg, border:`1px solid ${T.red}44`, borderRadius:8 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.text }}>Reset to seed data</div>
            <div style={{ fontSize:12, color:T.textMid, marginTop:2 }}>Clears all saved data (orders, stock, POs, clients, vendors) and reloads with seed data. Use between test sessions.</div>
          </div>
          <button onClick={()=>{
            if (!window.confirm('Reset ALL data to seed defaults? This cannot be undone.')) return;
            ['structo_orders','structo_clients','structo_vendors','structo_pos','structo_stock','structo_purchaseReqs','structo_company'].forEach(k=>localStorage.removeItem(k));
            window.location.reload();
          }} style={{ ...css.btn.danger, whiteSpace:"nowrap", flexShrink:0 }}>
            Reset to Seed Data
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MASTERS: MACHINES ────────────────────────────────────────────────────────
const MachinesMaster = ({ user, machines, setMachines }) => {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const canEdit = user.role === "super_admin";
  const typeColor = { Cutting:"blue", Welding:"amber", Other:"gray" };

  const openAdd  = () => { setForm({ type:"Cutting", active:true }); setModal("add"); };
  const openEdit = r  => { setForm({...r}); setModal("edit"); };

  const save = () => {
    if (!form.name?.trim()) return;
    if (modal === "add") {
      const next = { ...form, id:`MCH-${String(machines.length+1).padStart(3,"0")}` };
      setMachines(prev => [...prev, next]);
    } else {
      setMachines(prev => prev.map(m => m.id === form.id ? form : m));
    }
    setModal(null);
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:700, color:T.text }}>Machines & Equipment ({machines.length})</div>
        {canEdit && <button onClick={openAdd} style={css.btn.primary}>+ Add Machine</button>}
      </div>
      <MTable cols={[
        { key:"id",          label:"ID",           render:r=><span style={{fontFamily:T.fontMono,fontSize:11,color:T.textMid}}>{r.id}</span> },
        { key:"name",        label:"Machine Name", render:r=><span style={{fontWeight:700}}>{r.name}</span> },
        { key:"type",        label:"Type",         render:r=><Badge color={typeColor[r.type]||"gray"}>{r.type}</Badge> },
        { key:"bayLocation", label:"Bay Location"  },
        { key:"capabilities", label:"Capabilities", render:r=><div style={{display:'flex',flexWrap:'wrap',gap:4}}>{(r.capabilities||[]).map(c=><span key={c} style={{background:T.bgInput,border:`1px solid ${T.border}`,borderRadius:4,padding:'1px 6px',fontSize:10,color:T.textMid}}>{c}</span>)}</div> },
        { key:"active",      label:"Status",       render:r=><Badge color={r.active?"green":"gray"}>{r.active?"Active":"Inactive"}</Badge> },
        { key:"actions",     label:"",             render:r=>canEdit?<button onClick={()=>openEdit(r)} style={css.btn.ghost}>Edit</button>:null },
      ]} rows={machines} />

      {modal && (
        <Modal title={modal==="add"?"Add Machine":"Edit Machine"} onClose={()=>setModal(null)} width={440}>
          <MField label="Machine Name *">
            <input value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={css.input} placeholder="e.g. Plasma Cutter 2" />
          </MField>
          <MField label="Type">
            <select value={form.type||"Cutting"} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={css.input}>
              <option>Cutting</option><option>Welding</option><option>Other</option>
            </select>
          </MField>
          <MField label="Bay Location">
            <input value={form.bayLocation||""} onChange={e=>setForm(f=>({...f,bayLocation:e.target.value}))} style={css.input} placeholder="e.g. Bay 3" />
          </MField>
          <MField label="Active">
            <select value={form.active?"yes":"no"} onChange={e=>setForm(f=>({...f,active:e.target.value==="yes"}))} style={css.input}>
              <option value="yes">Active</option><option value="no">Inactive</option>
            </select>
          </MField>
          <div style={{marginTop:8}}>
            <div style={css.label}>Capabilities</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:4}}>
              {[['cut_straight','Cut Straight'],['cut_profile','Cut Profile'],['bevel','Bevel'],['drill','Drill'],['grind','Grind'],['mark','Mark'],['notch','Notch'],['bend','Bend'],['roll','Roll'],['press_brake','Press Brake'],['shot_blast','Shot Blast'],['spray_paint','Spray Paint']].map(([v,l])=>(
                <label key={v} style={{display:'flex',alignItems:'center',gap:4,cursor:'pointer',fontSize:12}}>
                  <input type="checkbox" checked={(form.capabilities||[]).includes(v)} onChange={e=>{const caps=form.capabilities||[];setForm(f=>({...f,capabilities:e.target.checked?[...caps,v]:caps.filter(c=>c!==v)}));}} />
                  <span style={{color:T.text}}>{l}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{marginTop:8}}>
            <div style={css.label}>Specs</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:4}}>
              <MField label="Max Thickness (mm)"><input type="number" value={(form.specs||{}).maxThicknessMm||''} onChange={e=>setForm(f=>({...f,specs:{...(f.specs||{}),maxThicknessMm:+e.target.value}}))} style={css.input} /></MField>
              <MField label="Max Section Size (mm)"><input type="number" value={(form.specs||{}).maxSectionSizeMm||''} onChange={e=>setForm(f=>({...f,specs:{...(f.specs||{}),maxSectionSizeMm:+e.target.value}}))} style={css.input} /></MField>
              <div style={{gridColumn:'span 2'}}><MField label="Notes"><input value={(form.specs||{}).notes||''} onChange={e=>setForm(f=>({...f,specs:{...(f.specs||{}),notes:e.target.value}}))} style={css.input} /></MField></div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:8 }}>
            <button onClick={()=>setModal(null)} style={css.btn.secondary}>Cancel</button>
            <button onClick={save} style={css.btn.primary} disabled={!form.name?.trim()}>✓ Save Machine</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── PRODUCTION STANDARDS UTILITIES ──────────────────────────────────────────
const getAssemblyTier = (drawing, productionStandards) => {
  const partCount = (drawing.parts||[]).length;
  const totalKg   = (drawing.parts||[]).reduce((s,p)=>(s+(p.clientTotalWt||0)),0);
  const tiers     = productionStandards.tiers;
  return tiers.find(t => partCount <= t.maxParts && totalKg <= t.maxKg) || tiers[tiers.length-1];
};

const getCriticalityScore = (drawing, order, productionStandards) => {
  const tier           = getAssemblyTier(drawing, productionStandards);
  const today          = new Date();
  const dispatch       = new Date(order.endDate);
  const daysRemaining  = Math.max(0,(dispatch-today)/(1000*60*60*24));
  const coatCount      = Math.max(1,order.quality?.paintCoats?.length||1);
  const hoursNeeded    = tier.cutting+tier.fitup+tier.welding+tier.blasting+(tier.paintPerCoat*coatCount);
  const tpiBuffer      = order.quality?.tpiRequired ? 3 : 0;
  const workingDaysNeeded = (hoursNeeded/8)+tpiBuffer;
  return workingDaysNeeded > 0 ? daysRemaining/workingDaysNeeded : 999;
};

const getStampLocation = (sectionType, productionStandards) => {
  const match = productionStandards.stampLocations.find(sl =>
    sl.sectionTypes.some(st => st.toUpperCase()===(sectionType||'').toUpperCase()));
  return match?.location || 'Top face, centre of piece';
};

// ─── MASTERS: PRODUCTION STANDARDS ───────────────────────────────────────────
const ProductionStandardsMaster = ({ user, productionStandards, setProductionStandards }) => {
  const canEdit  = ["super_admin","planning_admin"].includes(user.role);
  const [tiers,  setTiers]  = useState(productionStandards.tiers.map(t=>({...t})));
  const [stamps, setStamps] = useState(productionStandards.stampLocations.map(s=>({...s})));
  const [dirty,  setDirty]  = useState(false);

  const updateTier = (idx, field, val) => {
    setTiers(prev => prev.map((t,i)=> i===idx ? {...t, [field]: field==="id"||field==="label" ? val : Number(val)||0} : t));
    setDirty(true);
  };
  const updateStamp = (idx, field, val) => {
    setStamps(prev => prev.map((s,i)=> i===idx ? (field==="sectionTypes" ? {...s, sectionTypes: val.split(",").map(v=>v.trim())} : {...s, location:val}) : s));
    setDirty(true);
  };
  const addStamp = () => { setStamps(prev=>[...prev,{sectionTypes:[""],location:""}]); setDirty(true); };
  const removeStamp = idx => { setStamps(prev=>prev.filter((_,i)=>i!==idx)); setDirty(true); };

  const save = () => {
    setProductionStandards({ tiers, stampLocations: stamps });
    setDirty(false);
  };
  const discard = () => {
    setTiers(productionStandards.tiers.map(t=>({...t})));
    setStamps(productionStandards.stampLocations.map(s=>({...s})));
    setDirty(false);
  };

  const thStyle = { padding:"8px 12px", fontSize:11, color:T.textMid, fontWeight:700, textAlign:"left", borderBottom:`1px solid ${T.border}`, whiteSpace:"nowrap" };
  const tdStyle = { padding:"6px 10px", borderBottom:`1px solid ${T.border}` };
  const numInput = (val, onChange) => (
    <input type="number" value={val} onChange={e=>onChange(e.target.value)} disabled={!canEdit}
      style={{ ...css.input, width:60, padding:"3px 6px", fontSize:12 }} />
  );

  return (
    <div>
      <SectionHd title="Production Standards" />
      {dirty && canEdit && (
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          <button onClick={save} style={css.btn.primary}>Save Changes</button>
          <button onClick={discard} style={css.btn.ghost}>Discard</button>
        </div>
      )}

      {/* Section A — Tier Rules */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:8 }}>A — Assembly Tier Rules</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", background:T.bgCard, borderRadius:8, overflow:"hidden" }}>
            <thead>
              <tr>
                {["Tier","Max Parts","Max Weight (kg)"].map(h=><th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {tiers.map((t,i)=>(
                <tr key={t.id}>
                  <td style={tdStyle}><span style={{ fontWeight:600, color:T.accent }}>{t.label}</span></td>
                  <td style={tdStyle}>{numInput(t.maxParts, v=>updateTier(i,"maxParts",v))}</td>
                  <td style={tdStyle}>{numInput(t.maxKg, v=>updateTier(i,"maxKg",v))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section B — Stage Duration Estimates */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:4 }}>B — Stage Duration Estimates (hours)</div>
        <div style={{ fontSize:11, color:T.textMid, marginBottom:8 }}>These estimates drive drawing criticality scores and cut-ahead dates.</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", background:T.bgCard, borderRadius:8, overflow:"hidden" }}>
            <thead>
              <tr>
                {["Tier","Cutting","Fit-Up","Welding","Blasting","Paint / coat"].map(h=><th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {tiers.map((t,i)=>(
                <tr key={t.id}>
                  <td style={tdStyle}><span style={{ fontWeight:600, color:T.accent }}>{t.label}</span></td>
                  <td style={tdStyle}>{numInput(t.cutting,       v=>updateTier(i,"cutting",v))}</td>
                  <td style={tdStyle}>{numInput(t.fitup,         v=>updateTier(i,"fitup",v))}</td>
                  <td style={tdStyle}>{numInput(t.welding,       v=>updateTier(i,"welding",v))}</td>
                  <td style={tdStyle}>{numInput(t.blasting,      v=>updateTier(i,"blasting",v))}</td>
                  <td style={tdStyle}>{numInput(t.paintPerCoat,  v=>updateTier(i,"paintPerCoat",v))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section C — Stamp Locations */}
      <div>
        <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:8 }}>C — Piece Stamp Location Convention</div>
        <table style={{ width:"100%", borderCollapse:"collapse", background:T.bgCard, borderRadius:8, overflow:"hidden" }}>
          <thead>
            <tr>
              <th style={thStyle}>Section Types (comma-separated)</th>
              <th style={thStyle}>Stamp Location</th>
              {canEdit && <th style={thStyle}></th>}
            </tr>
          </thead>
          <tbody>
            {stamps.map((s,i)=>(
              <tr key={i}>
                <td style={tdStyle}>
                  <input value={s.sectionTypes.join(", ")} onChange={e=>updateStamp(i,"sectionTypes",e.target.value)}
                    disabled={!canEdit} style={{ ...css.input, padding:"3px 8px", fontSize:12 }} />
                </td>
                <td style={tdStyle}>
                  <input value={s.location} onChange={e=>updateStamp(i,"location",e.target.value)}
                    disabled={!canEdit} style={{ ...css.input, padding:"3px 8px", fontSize:12 }} />
                </td>
                {canEdit && <td style={tdStyle}><button onClick={()=>removeStamp(i)} style={{ ...css.btn.ghost, color:T.red, fontSize:11, padding:"2px 8px" }}>Remove</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
        {canEdit && <button onClick={addStamp} style={{ ...css.btn.ghost, marginTop:8, fontSize:12 }}>+ Add Row</button>}
      </div>
    </div>
  );
};

// ─── MASTERS MODULE ───────────────────────────────────────────────────────────
const MastersModule = ({ user, clients, setClients, vendors, setVendors, contractors, setContractors, bays, setBays, materials, setMaterials, paint, setPaint, tpiAgencies, setTpiAgencies, approvedMakes, setApprovedMakes, company, setCompany, machines, setMachines, productionStandards, setProductionStandards, orders, setOrders, pos, setPos, stock }) => {
  const tabs = [
    { id:"company",     label:"Company Details",     show: user.role==="super_admin" },
    { id:"prodstd",     label:"Production Standards", show: ["super_admin","planning_admin"].includes(user.role) },
    { id:"clients",     label:"Clients"           },
    { id:"vendors",     label:"Vendors"           },
    { id:"contractors", label:"Contractors"       },
    { id:"bays",        label:"Storage Bays"      },
    { id:"materials",   label:"Materials Library" },
    { id:"paint",       label:"Paint Library"     },
    { id:"tpi",         label:"TPI Agencies"      },
    { id:"makes",       label:"Approved Makes"    },
    { id:"machines",    label:"Machines",          show: user.role==="super_admin" },
    { id:"users",       label:"Users",             show: user.role==="super_admin" },
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
      {activeTab==="company"     && <CompanyMaster         user={user} company={company} setCompany={setCompany} />}
      {activeTab==="prodstd"     && <ProductionStandardsMaster user={user} productionStandards={productionStandards} setProductionStandards={setProductionStandards} />}
      {activeTab==="clients"     && <ClientsMaster     user={user} clients={clients} setClients={setClients} orders={orders} setOrders={setOrders} />}
      {activeTab==="vendors"     && <VendorsMaster     user={user} vendors={vendors} setVendors={setVendors} pos={pos} setPos={setPos} stock={stock} />}
      {activeTab==="contractors" && <ContractorsMaster user={user} contractors={contractors} />}
      {activeTab==="bays"        && <BaysMaster        user={user} bays={bays} setBays={setBays} />}
      {activeTab==="materials"   && <MaterialsMaster   user={user} materials={materials} setMaterials={setMaterials} />}
      {activeTab==="paint"       && <PaintMaster       user={user} paint={paint} />}
      {activeTab==="tpi"         && <TPIMaster         user={user} tpiAgencies={tpiAgencies} />}
      {activeTab==="makes"       && <ApprovedMakesMaster user={user} approvedMakes={approvedMakes} />}
      {activeTab==="machines"    && <MachinesMaster    user={user} machines={machines} setMachines={setMachines} />}
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
  const [rejectModal, setRejectModal] = useState(null); // prId
  const [rejectReason, setRejectReason] = useState("");

  const showToast = (msg, color="green") => { setToast({msg,color}); setTimeout(()=>setToast(null),3000); };

  // Group purchase reqs by order → drawing
  // Compute requirements from order.parts (received drawings only) rather than
  // relying on purchaseReqs records, which don't exist for new orders.
  const byOrder = orders.map(o => {
    const allDrgs = o.drawings||[];
    const recvDrgs = allDrgs.filter(d=>d.receivedDate);
    const recvDrgIds = new Set(recvDrgs.map(d=>d.id));
    const recvDrgNos = new Set(recvDrgs.map(d=>d.drawingNo));

    // Build computed requirements from parts
    const agg = {};
    (o.parts||[])
      .filter(p => p.fabType==="Fabricate" && (p.source==="Procure" || !p.source))
      .forEach(p => {
        // Resolve the drawing — fall back to drawingNo match when drawingId is blank
        const drg = p.drawingId
          ? allDrgs.find(d=>d.id===p.drawingId)
          : allDrgs.find(d=>d.drawingNo===p.drawingNo);
        // Only include parts from drawings with a received date
        if (!drg?.receivedDate) return;
        // Group by drawing + matCode (or section/grade/size)
        const matKey = p.matCode || `${p.matType}|${p.grade}|${p.section}|${p.size}`;
        const key = `${drg.id}|${matKey}`;
        if (!agg[key]) {
          // Merge with existing purchaseReqs record if one exists
          const pr = purchaseReqs.find(r =>
            r.orderId===o.id && r.drawingId===drg.id &&
            r.section===p.section && r.size===p.size && r.grade===p.grade
          );
          agg[key] = {
            id: pr?.id||null,
            drawingNo: drg.drawingNo,
            drawingId: drg.id,
            matType: p.matType||'MS',
            grade: p.grade||'',
            section: p.section||'',
            size: p.size||'',
            wtRequired: 0,
            approvedMakes: pr?.approvedMakes||'',
            status: pr?.status||'pending',
            rejectReason: pr?.rejectReason||''
          };
        }
        // clientTotalWt is weight per drawing unit; multiply by drawing.qty for order total
        agg[key].wtRequired += (p.clientTotalWt||p.calcTotalWt||0) * (drg.qty||1);
      });

    const reqs = Object.values(agg).filter(r=>r.wtRequired>0);
    const totalWtReq = reqs.reduce((s,r)=>s+(r.wtRequired||0),0);
    const totalProcured = reqs.filter(r=>r.status==="approved"||r.status==="po_raised").reduce((s,r)=>s+(r.wtRequired||0),0);
    const totalDrgWt = recvDrgs.reduce((s,d)=>s+(d.totalWt||0),0);
    return { order:o, reqs, totalWtReq, totalProcured, drawings:recvDrgs, totalDrgWt };
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
  // Only include parts from drawings with receivedDate (same rule as byOrder overview).
  // Multiply by drawing.qty — clientTotalWt is per-drawing-unit, not order total.
  const filtOrders = matReqFilter==="all" ? orders : orders.filter(o=>o.id===matReqFilter);
  const fabAgg = {};
  filtOrders.forEach(o => {
    const recvDrgMap = {};
    (o.drawings||[]).filter(d=>d.receivedDate).forEach(d=>{ recvDrgMap[d.id]=d; });
    (o.parts||[]).filter(p=>p.fabType==="Fabricate"&&(p.source==="Procure"||!p.source)).forEach(p => {
      // Resolve drawing — fall back to drawingNo if drawingId is blank
      const drg = p.drawingId ? recvDrgMap[p.drawingId]
        : Object.values(recvDrgMap).find(d=>d.drawingNo===p.drawingNo);
      if (!drg) return; // skip pending drawings
      const key = p.matCode || buildMatCode(p.section,p.matType,p.grade,p.size);
      if (!fabAgg[key]) {
        const lib = (materials||[]).find(m=>m.matCode===key||(m.sectionType===p.section&&m.size.toLowerCase()===(p.size||"").toLowerCase()&&m.grade.toLowerCase()===(p.grade||"").toLowerCase()));
        const pr = purchaseReqs.find(r=>r.section===p.section&&r.size===p.size&&r.grade===p.grade);
        fabAgg[key] = { matCode:key, section:p.section, size:p.size, grade:p.grade, matType:p.matType, orders:[], wtRequired:0, lib, prStatus:pr?.status||"none" };
      }
      fabAgg[key].wtRequired += (p.calcTotalWt||p.clientTotalWt||0) * (drg.qty||1);
      if (!fabAgg[key].orders.includes(o.id)) fabAgg[key].orders.push(o.id);
    });
  });
  const fabList = Object.values(fabAgg).map(row => {
    const stockAvail = stock.filter(s=>(s.matCode&&s.matCode===row.matCode)||((s.sectionType||s.section)===row.section&&s.size===row.size&&s.grade===row.grade)).reduce((a,s)=>a+(s.wtAvailable||0),0);
    const netToProcure = Math.max(0, row.wtRequired - stockAvail);
    return { ...row, stockAvail, netToProcure };
  });
  const boAgg = {};
  filtOrders.forEach(o => {
    const recvDrgMap2 = {};
    (o.drawings||[]).filter(d=>d.receivedDate).forEach(d=>{ recvDrgMap2[d.id]=d; });
    (o.parts||[]).filter(p=>p.fabType==="Bought Out"&&(p.source==="Procure"||!p.source)).forEach(p => {
      const drg = p.drawingId ? recvDrgMap2[p.drawingId]
        : Object.values(recvDrgMap2).find(d=>d.drawingNo===p.drawingNo);
      if (!drg) return;
      const key = `${p.desc}|${p.size}`;
      if (!boAgg[key]) boAgg[key] = { desc:p.desc, size:p.size, grade:p.grade, orders:[], totalPcs:0, unitWt:p.clientUnitWt||0, totalWt:0 };
      boAgg[key].totalPcs += (p.qtyPerDrg||0) * (drg.qty||1);
      boAgg[key].totalWt += (p.calcTotalWt||p.clientTotalWt||0) * (drg.qty||1);
      if (!boAgg[key].orders.includes(o.id)) boAgg[key].orders.push(o.id);
    });
  });
  const boList = Object.values(boAgg);
  const csParts = filtOrders.flatMap(o=>{
    const recvIds = new Set((o.drawings||[]).filter(d=>d.receivedDate).map(d=>d.id));
    return (o.parts||[]).filter(p=>p.source==="Client Supply"&&(p.drawingId?recvIds.has(p.drawingId):true)).map(p=>({...p,orderId:o.id}));
  });

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
                      <tr key={r.id||`calc-${i}`} style={{ background:i%2===0?"transparent":T.bg }}>
                        <TD mono>{r.drawingNo}</TD>
                        <TD>{r.matType}</TD>
                        <TD mono>{r.grade}</TD>
                        <TD>{r.section}</TD>
                        <TD mono>{r.size}</TD>
                        <TD right mono bold color={T.gold}>{fmt.num(r.wtRequired)}</TD>
                        <TD><span style={{ fontSize:11, color:T.textMid }}>{r.approvedMakes||'—'}</span></TD>
                        <TD><Badge color={r.status==="approved"?"green":r.status==="po_raised"?"blue":r.status==="rejected"?"red":"gray"}>{r.status}</Badge></TD>
                        {PERMISSIONS[user.role]?.canApprove && <TD>
                          {/* Approve/Reject only available when a purchaseReqs record exists (r.id set) */}
                          {r.id && r.status!=="approved"&&r.status!=="po_raised"&&r.status!=="rejected"&&(
                            <div style={{ display:"flex", gap:4 }}>
                              <button onClick={()=>setPurchaseReqs(prev=>prev.map(pr=>pr.id===r.id?{...pr,status:"approved"}:pr))} style={{ ...css.btn.sm, background:T.greenLo, color:T.green, border:`1px solid ${T.green}` }}>Approve</button>
                              <button onClick={()=>{ setRejectModal(r.id); setRejectReason(""); }} style={{ ...css.btn.sm, background:T.redBg, color:T.red, border:`1px solid ${T.redLo}` }}>Reject</button>
                            </div>
                          )}
                          {r.status==="rejected"&&<span style={{ fontSize:11, color:T.textMid, fontStyle:"italic" }}>{r.rejectReason||""}</span>}
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

      {/* Reject PR Modal */}
      {rejectModal && (
        <Modal title="Reject Purchase Requisition" onClose={()=>setRejectModal(null)}>
          <InfoBanner color="red">This PR will be marked as rejected. The planning team will need to re-raise it if required.</InfoBanner>
          <div style={{ marginTop:12 }}>
            <label style={css.label}>Reason for Rejection *</label>
            <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)}
              rows={3} placeholder="State why this PR is being rejected..."
              style={{ ...css.input, width:"100%", resize:"vertical", marginTop:4 }} />
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:14 }}>
            <button onClick={()=>setRejectModal(null)} style={css.btn.secondary}>Cancel</button>
            <button disabled={!rejectReason.trim()} onClick={()=>{
              if (!rejectReason.trim()) return;
              setPurchaseReqs(prev=>prev.map(pr=>pr.id===rejectModal?{...pr,status:"rejected",rejectReason:rejectReason.trim(),rejectedBy:user.name,rejectedDate:today()}:pr));
              setRejectModal(null); setRejectReason("");
              showToast("Purchase requisition rejected","red");
            }} style={{ ...css.btn.primary, background:T.red, borderColor:T.red, opacity:rejectReason.trim()?1:0.4 }}>Reject PR</button>
          </div>
        </Modal>
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
                <TD mono>{s.lotNo}</TD><TD>{s.matType}</TD><TD mono>{s.grade}</TD><TD>{s.sectionType||s.section}</TD><TD mono>{s.size}</TD>
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
const POLineImportModal = ({ rows, err, mode, setMode, fileRef, onFile, onDownload, onConfirm, onClose }) => (
  <Modal title="Import PO Lines from CSV" onClose={onClose} width={820}>
    <div style={{ background:"#0D1E3A", border:`1px solid ${T.borderHi}`, borderRadius:8, padding:"12px 16px", marginBottom:16 }}>
      <div style={{ fontSize:13, fontWeight:700, color:T.accentHi, marginBottom:8 }}>How to Import</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, fontSize:12, color:T.textMid }}>
        <div><span style={{color:T.accent,fontWeight:700}}>Step 1 </span>Download the template CSV with sample data.</div>
        <div><span style={{color:T.accent,fontWeight:700}}>Step 2 </span>Fill in your lines. Date format: <b style={{color:T.text}}>DD-MM-YYYY</b>. Save as CSV.</div>
        <div><span style={{color:T.accent,fontWeight:700}}>Step 3 </span>Upload, choose Append or Replace, preview and confirm.</div>
      </div>
    </div>
    <div style={{ ...css.card, marginBottom:14 }}>
      <div style={{ display:"flex", gap:16, alignItems:"flex-start", flexWrap:"wrap" }}>
        <div>
          <label style={css.label}>Upload CSV File</label>
          <input type="file" accept=".csv" onChange={onFile} style={{ color:T.text, fontSize:12 }} />
        </div>
        <div>
          <label style={css.label}>Import Mode</label>
          <div style={{ display:"flex", gap:16, marginTop:4 }}>
            {["append","replace"].map(m=>(
              <label key={m} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12, color:T.text }}>
                <input type="radio" checked={mode===m} onChange={()=>setMode(m)} />
                <span>{m==="append"?"Append to existing lines":"Replace all lines"}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      {err && (
        <div style={{ marginTop:10, padding:"8px 12px", borderRadius:6, fontSize:12,
          background: err.startsWith("⚠") ? T.amberBg : T.redBg,
          border:`1px solid ${err.startsWith("⚠") ? T.amber : T.redLo}`,
          color: err.startsWith("⚠") ? T.amber : T.red }}>
          {err}
        </div>
      )}
    </div>
    {rows.length > 0 && (
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.green, marginBottom:8 }}>
          ✓ {rows.length} line{rows.length>1?"s":""} ready to import
        </div>
        <div style={{ overflowX:"auto", maxHeight:240, overflowY:"auto" }}>
          <table style={{ borderCollapse:"collapse", fontSize:11, width:"100%" }}>
            <thead><tr>
              {["Section","Size","Grade","Length","Width","Qty","Unit","Pricing","Unit Price","Total Price","Wt Ordered (kg)","Library Match"].map(h=>(
                <TH key={h}>{h}</TH>
              ))}
            </tr></thead>
            <tbody>
              {rows.map((r,i)=>(
                <tr key={i} style={{ background:i%2===0?"transparent":T.bg }}>
                  <TD mono>{r.sectionType||r.section}</TD>
                  <TD mono>{r.size}</TD>
                  <TD>{r.grade}</TD>
                  <TD mono>{r.length||"—"}</TD>
                  <TD mono>{r.width||"—"}</TD>
                  <TD right mono>{r.qty}</TD>
                  <TD>{r.unit}</TD>
                  <TD>{r.pricingMethod||"PerUnit"}</TD>
                  <TD right mono>{fmt.currency(r.unitPrice)}</TD>
                  <TD right mono bold color={T.green}>{fmt.currency(r.totalPrice)}</TD>
                  <TD right mono>{fmt.num(r.wtOrdered)}</TD>
                  <TD>{r._libMatched ? <Badge color="green">✓ Matched</Badge> : <Badge color="amber">No match</Badge>}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
    <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
      <button onClick={onClose} style={css.btn.secondary}>Cancel</button>
      <button onClick={onDownload} style={css.btn.secondary}>⬇ Download Template</button>
      <button onClick={onConfirm} disabled={!rows.length}
        style={{ ...css.btn.primary, opacity:rows.length?1:0.4 }}>
        ✓ Confirm Import ({rows.length} line{rows.length!==1?"s":""})
      </button>
    </div>
  </Modal>
);

const PurchaseModule = ({ user, pos, setPos, purchaseReqs, stock, setStock, orders, vendors, materials, setMaterials }) => {
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [grnModal, setGrnModal] = useState(null);
  const [grnForm, setGrnForm] = useState({ lines:[] });
  const [toast, setToast] = useState(null);
  const [poImpModal, setPoImpModal] = useState(false);
  const [poImpRows,  setPoImpRows]  = useState([]);
  const [poImpErr,   setPoImpErr]   = useState("");
  const [poImpMode,  setPoImpMode]  = useState("append");
  const poImpRef = useRef(null);
  const [showCancelled, setShowCancelled] = useState(false);

  const showToast = (msg,color="green") => { setToast({msg,color}); setTimeout(()=>setToast(null),3000); };
  const [addToLibModal, setAddToLibModal] = useState(null);
  const [addToLibForm, setAddToLibForm] = useState({});
  const [addToLibSuccess, setAddToLibSuccess] = useState(false);

  const downloadPOTemplate = () => {
    const hdr    = ["Section Type","Size","Grade","Material Type","Length (mm)","Width (mm)","Qty (units)","Weight Required (kg)","Unit","Pricing Method (PerUnit/PerKg)","Unit Price (₹)","Manual Wt (kg/m or kg/m2)","Expected Delivery (DD-MM-YYYY)","Remarks"];
    const hints  = ["e.g. PLATE","12mm","E250","MS","6000","1250","5 (fill OR Weight — not both)","(leave blank if Qty filled)","Sheets","PerUnit","65000","(leave blank if library match found)","20-03-2026","Any notes"];
    const sample = ["ISA","75x75x8","E250","MS","12000","","40","","Pcs","PerUnit","780","","20-03-2026","Main columns"];
    const csv = [hdr,hints,sample].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = Object.assign(document.createElement("a"),{ href:URL.createObjectURL(new Blob([csv],{type:"text/csv"})), download:"po_lines_template.csv" });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const handlePOImpFile = async e => {
    setPoImpErr(""); setPoImpRows([]);
    const file = e.target.files[0]; if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) { setPoImpErr("Please upload a .csv file — save your spreadsheet as CSV first."); return; }
    try {
      const { rows, errors, warnings } = parsePOLineCSV(await file.text(), materials);
      if (errors.length) { setPoImpErr(errors.join(" ")); return; }
      setPoImpErr(warnings.length ? "⚠ " + warnings.join(" ") : "");
      setPoImpRows(rows);
    } catch(err) { setPoImpErr("Error reading file: " + err.message); }
  };

  const confirmPOImp = () => {
    const base  = poImpMode==="replace" ? [] : (form.lines||[]);
    const clean = poImpRows.map(({_libMatched,...r})=>r);
    setForm(f=>({...f, lines:[...base,...clean]}));
    setPoImpModal(false); setPoImpRows([]); setPoImpErr(""); poImpRef.current.value="";
  };

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
        lines: lines.map((l,i)=>{ const calcWt=calcPoLineWt(l); const wtOrdered=(l.orderMode||"ByUnits")==="ByWeight"?(l.wtRequired||l.wtOrdered||0):Math.max(calcWt, l.wtOrdered||0); const totalPrice=l.pricingMethod==="PerKg"?wtOrdered*(l.unitPrice||0):(l.qty||0)*(l.unitPrice||0); const effectiveRateKg=wtOrdered>0?Math.round(totalPrice/wtOrdered*100)/100:0; const effectiveRateUnit=l.pricingMethod==="PerKg"?(l.qty||0)>0?Math.round(totalPrice/(l.qty||0)*100)/100:0:(l.unitPrice||0); return {...l, id:`POL-${Date.now()}-${i}`, wtReceived:0, status:"pending", wtOrdered, totalPrice, effectiveRateKg, effectiveRateUnit, itemCode:buildItemCode(l)}; }),
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
    const yr = new Date().getFullYear();
    const grnId = nextGrnId(pos);
    const batchNoGrn = po?.vendorCode ? genBatchNo(po.vendorCode, pos, yr) : "";
    const newGrn = { ...grnForm, id:grnId, batchNo:batchNoGrn, date:today(), createdBy:user.name, lines:(grnForm.lines||[]) };
    setPos(prev => prev.map(p => {
      if (p.id!==poId) return p;
      const updatedLines = p.lines.map(pl => {
        const grnLine = newGrn.lines.find(gl=>gl.poLineId===pl.id);
        if (!grnLine) return pl;
        const newReceived = (pl.wtReceived||0)+(grnLine.actualWt||grnLine.wtReceived||0);
        const newQtyRec = (pl.qtyReceived||0)+(grnLine.qtyReceived||0);
        return { ...pl, wtReceived:newReceived, qtyReceived:newQtyRec, status:newReceived>=pl.wtOrdered?"fully_received":"partially_received" };
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

  if (selected) return <PODetail po={pos.find(p=>p.id===selected)||{}} onBack={()=>setSelected(null)} user={user} pos={pos} setPos={setPos} stock={stock} setStock={setStock} showToast={showToast} materials={materials} />;

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

      <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginBottom:12, alignItems:"center" }}>
        <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:T.textMid, cursor:"pointer" }}>
          <input type="checkbox" checked={showCancelled} onChange={e=>setShowCancelled(e.target.checked)} />
          Show cancelled
        </label>
        {canEdit && <button onClick={()=>{setForm({servedOrders:[],lines:[],poDate:today()});setModal("new_po");}} style={css.btn.primary}>+ New PO</button>}
      </div>

      {pos.filter(po => showCancelled || po.status !== "cancelled").map(po => {
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
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={downloadPOTemplate} style={css.btn.secondary}>⬇ Template</button>
                <button onClick={()=>setPoImpModal(true)} style={css.btn.amber}>📥 Import CSV</button>
                <button onClick={()=>setForm(f=>({...f,lines:[...(f.lines||[]),{matLibId:"",matCode:"",sectionType:"",size:"",grade:"E250",matType:"MS",isPlate:false,orderMode:"ByUnits",qty:0,qtyOrdered:0,unit:"Pcs",pricingMethod:"PerUnit",unitPrice:0,wtOrdered:0,wtRequired:0,totalPrice:0,length:null,width:null,effectiveRateKg:0,qtyReceived:0,wtSource:"",libraryMatch:true}]}))} style={css.btn.sm}>+ Add Line</button>
              </div>
            } />
            {(form.lines||[]).map((l,i)=>{
              return (
  <div key={i} style={{ ...css.card, background:T.bg, marginBottom:8 }}>
    {/* Row 1: Material type selectors */}
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:8 }}>
      <Field label="Section Type">
        <Sel value={l.sectionType||""} onChange={e=>{
          const st=e.target.value;
          const isPlate=st==="PLATE";
          setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],sectionType:st,isPlate,matLibId:"",wtPerM2:null,wtPerMetre:null}; return {...f,lines:n}; });
        }}>
          <option value="">— Select —</option>
          {["ISA","ISMC","ISMB","PLATE","RHS","SHS","Flat Bar","Other"].map(s=><option key={s}>{s}</option>)}
        </Sel>
      </Field>
      <Field label="Size / Thickness">
        <Sel value={l.matLibId||"__ns__"} onChange={e=>{
          if(e.target.value==="__ns__"){setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],matLibId:"",size:"",wtPerM2:null,wtPerMetre:null,isPlate:l.sectionType==="PLATE"}; return {...f,lines:n}; });}
          else{ const m=(materials||[]).find(x=>x.id===e.target.value); if(m) setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],matLibId:m.id,matCode:m.matCode,sectionType:m.sectionType,size:m.size,grade:m.grade,matType:m.matType,isPlate:m.isPlate,wtPerMetre:m.wtPerMetre||null,wtPerM2:m.wtPerM2||null}; return {...f,lines:n}; }); }
        }}>
          <option value="__ns__">— Free text —</option>
          {(materials||[]).filter(m=>m.active&&(!l.sectionType||m.sectionType===l.sectionType)).map(m=>(
            <option key={m.id} value={m.id}>{m.size} ({m.wtPerMetre?m.wtPerMetre+" kg/m":m.wtPerM2+" kg/m²"})</option>
          ))}
        </Sel>
      </Field>
      {!l.matLibId && <Field label="Size (manual)"><Input value={l.size||""} onChange={e=>setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],size:e.target.value}; return {...f,lines:n}; })} placeholder="e.g. 75x75x8" /></Field>}
      <Field label="Grade">
        <Sel value={l.grade||"E250"} onChange={e=>setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],grade:e.target.value}; return {...f,lines:n}; })}>
          <option>E250</option><option>E350</option><option>304</option><option>316</option><option>Other</option>
        </Sel>
      </Field>
      <Field label="Mat Type">
        <Sel value={l.matType||"MS"} onChange={e=>setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],matType:e.target.value}; return {...f,lines:n}; })}>
          <option>MS</option><option>SS</option><option>AL</option>
        </Sel>
      </Field>
    </div>
    {/* No-library-match: manual weight entry + Add to Library */}
    {!l.matLibId && l.size && (()=>{
      const tentMatch = (materials||[]).find(m => m.sectionType.toLowerCase()===(l.sectionType||"").toLowerCase() && normalize(m.size)===normalize(l.size) && (m.grade||"").toLowerCase()===(l.grade||"").toLowerCase());
      if (tentMatch) return null;
      return (
        <div style={{ marginBottom:8 }}>
          <InfoBanner color="amber">No library match — enter weight manually or add this section to the library.</InfoBanner>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:6 }}>
            {!l.isPlate && (
              <Field label="Wt per Metre (kg/m)">
                <Input type="number" step="0.01" value={l.wtPerMetre||""} onChange={e=>setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],wtPerMetre:+e.target.value||null,wtSource:"manual",libraryMatch:false}; return {...f,lines:n}; })} placeholder="e.g. 5.64" />
              </Field>
            )}
            {l.isPlate && (
              <Field label="Wt per m² (kg/m²)">
                <Input type="number" step="0.01" value={l.wtPerM2||""} onChange={e=>setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],wtPerM2:+e.target.value||null,wtSource:"manual",libraryMatch:false}; return {...f,lines:n}; })} placeholder="e.g. 31.4" />
              </Field>
            )}
            {["super_admin","purchase_admin"].includes(user.role) && (
              <div style={{ alignSelf:"flex-end", paddingBottom:2 }}>
                <button style={{ ...css.btn.amber, fontSize:11 }} onClick={()=>{
                  const maxNum = Math.max(...(materials||[]).map(m=>{ const mt=m.id.match(/^ML-(\d+)$/); return mt?+mt[1]:0; }),0);
                  const newId = `ML-${String(maxNum+1).padStart(3,"0")}`;
                  const mc = buildMatCode(l.sectionType||"",l.matType||"MS",l.grade||"E250",l.size||"");
                  setAddToLibForm({ id:newId, sectionType:l.sectionType||"", size:l.size||"", grade:l.grade||"E250", matType:l.matType||"MS", isPlate:l.isPlate||false, wtPerMetre:l.wtPerMetre||null, wtPerM2:l.wtPerM2||null, standardLengths:[6000,8000,10000,12000], active:true, matCode:mc });
                  setAddToLibSuccess(false);
                  setAddToLibModal({ lineIdx:i });
                }}>+ Add to Library</button>
              </div>
            )}
          </div>
        </div>
      );
    })()}
    {/* Row 2: Dimensions (shown for count-based units) */}
    {((l.unit||"Pcs").toUpperCase()!=="MT"||(l.orderMode||"ByUnits")==="ByWeight")&&(
      <div style={{ display:"grid", gridTemplateColumns:l.isPlate?"1fr 1fr 2fr":"1fr 2fr", gap:8, marginBottom:8 }}>
        <Field label="Length (mm)"><Input type="number" value={l.length||""} onChange={e=>setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],length:+e.target.value||null}; return {...f,lines:n}; })} /></Field>
        {l.isPlate&&<Field label="Width (mm)"><Input type="number" value={l.width||""} onChange={e=>setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],width:+e.target.value||null}; return {...f,lines:n}; })} /></Field>}
        <div style={{ alignSelf:"flex-end", paddingBottom:6, fontSize:11, color:T.textLow }}>
          {l.isPlate?"Plate dims: Length × Width (mm)":"Bar/section: full bar length in mm"}
        </div>
      </div>
    )}
    {/* Order mode toggle */}
    <div style={{ display:"flex", gap:0, marginBottom:8, width:"fit-content", border:`1px solid ${T.border}`, borderRadius:6, overflow:"hidden" }}>
      {["ByUnits","ByWeight"].map(mode=>(
        <button key={mode} onClick={()=>setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],orderMode:mode,unit:mode==="ByWeight"?"KG":n[i].unit==="KG"?"Pcs":n[i].unit}; return {...f,lines:n}; })} style={{ padding:"5px 14px", fontSize:12, fontWeight:(l.orderMode||"ByUnits")===mode?700:400, color:(l.orderMode||"ByUnits")===mode?T.bg:T.textMid, background:(l.orderMode||"ByUnits")===mode?T.accent:"transparent", border:"none", cursor:"pointer", fontFamily:T.font }}>
          {mode==="ByUnits"?"Order by Units":"Order by Weight"}
        </button>
      ))}
    </div>
    {/* Row 3: Qty + Pricing */}
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr auto", gap:8, alignItems:"end" }}>
      {(l.orderMode||"ByUnits")==="ByUnits" ? (
        <Field label="Qty (sheets/pcs/bars)"><Input type="number" value={l.qty||""} onChange={e=>setForm(f=>{ const n=[...f.lines]; const nq=+e.target.value; const wt=calcPoLineWt({...n[i],qty:nq}); const tp=n[i].pricingMethod==="PerKg"?wt*(n[i].unitPrice||0):nq*(n[i].unitPrice||0); const ekg=wt>0?tp/wt:0; const eunit=n[i].pricingMethod==="PerKg"?nq>0?tp/nq:0:(n[i].unitPrice||0); n[i]={...n[i],qty:nq,qtyOrdered:nq,wtOrdered:wt,totalPrice:tp,effectiveRateKg:ekg,effectiveRateUnit:eunit}; return {...f,lines:n}; })} /></Field>
      ) : (
        <Field label="Weight Required (kg)"><Input type="number" value={l.wtRequired||""} onChange={e=>setForm(f=>{ const n=[...f.lines]; const wr=+e.target.value; const lib=(materials||[]).find(m=>m.id===n[i].matLibId); let wp=0; if(lib){if(lib.isPlate&&n[i].length>0&&n[i].width>0)wp=(n[i].length/1000)*(n[i].width/1000)*(lib.wtPerM2||0);else if(!lib.isPlate&&n[i].length>0)wp=(n[i].length/1000)*(lib.wtPerMetre||0);} const hq=wp>0?Math.ceil(wr/wp):0; const tp=n[i].pricingMethod==="PerKg"?wr*(n[i].unitPrice||0):hq*(n[i].unitPrice||0); n[i]={...n[i],wtRequired:wr,wtOrdered:wr,qty:hq,qtyOrdered:hq,totalPrice:tp,effectiveRateKg:wr>0?tp/wr:0}; return {...f,lines:n}; })} /></Field>
      )}
      {(l.orderMode||"ByUnits")==="ByUnits" ? (
        <Field label="Unit">
          <Sel value={l.unit||"Pcs"} onChange={e=>setForm(f=>{ const n=[...f.lines]; const nu=e.target.value; const wt=calcPoLineWt({...n[i],unit:nu}); const tp=n[i].pricingMethod==="PerKg"?wt*(n[i].unitPrice||0):(n[i].qty||0)*(n[i].unitPrice||0); const ekg=wt>0?tp/wt:0; n[i]={...n[i],unit:nu,wtOrdered:wt,totalPrice:tp,effectiveRateKg:ekg}; return {...f,lines:n}; })}>
            <option>Sheets</option><option>Pcs</option><option>NOS</option>
          </Sel>
        </Field>
      ) : (
        <div />
      )}
      <Field label="Pricing">
        <div style={{ display:"flex", gap:4, marginTop:4 }}>
          {["PerUnit","PerKg"].map(pm=>(
            <button key={pm} onClick={()=>setForm(f=>{ const n=[...f.lines]; const wt=calcPoLineWt(n[i]); const tp=pm==="PerKg"?wt*(n[i].unitPrice||0):(n[i].qty||0)*(n[i].unitPrice||0); const ekg=wt>0?tp/wt:0; const eunit=pm==="PerKg"?(n[i].qty||0)>0?tp/(n[i].qty||0):0:(n[i].unitPrice||0); n[i]={...n[i],pricingMethod:pm,totalPrice:tp,effectiveRateKg:ekg,effectiveRateUnit:eunit}; return {...f,lines:n}; })} style={{ flex:1, padding:"4px 6px", fontSize:11, fontWeight:l.pricingMethod===pm?700:400, color:l.pricingMethod===pm?T.accent:T.textMid, background:l.pricingMethod===pm?T.bgCard:"transparent", border:`1px solid ${l.pricingMethod===pm?T.accent:T.border}`, borderRadius:4, cursor:"pointer", fontFamily:T.font }}>{pm==="PerUnit"?"/unit":"/kg"}</button>
          ))}
        </div>
      </Field>
      <Field label={l.pricingMethod==="PerKg"?"Price/kg (₹)":"Price/unit (₹)"}><Input type="number" value={l.unitPrice||""} onChange={e=>setForm(f=>{ const n=[...f.lines]; const up=+e.target.value; const wt=calcPoLineWt(n[i]); const tp=n[i].pricingMethod==="PerKg"?wt*up:(n[i].qty||0)*up; n[i]={...n[i],unitPrice:up,totalPrice:tp,effectiveRateKg:wt>0?tp/wt:0,effectiveRateUnit:n[i].pricingMethod==="PerKg"?(n[i].qty||0)>0?tp/(n[i].qty||0):0:up}; return {...f,lines:n}; })} /></Field>
      <button onClick={()=>setForm(f=>({...f,lines:f.lines.filter((_,j)=>j!==i)}))} style={{ ...css.btn.ghost, color:T.red, paddingTop:18 }}>✕</button>
    </div>
    {/* Row 4: Live calc preview */}
    {(()=>{
      const isWtMode=(l.orderMode||"ByUnits")==="ByWeight";
      const wt=isWtMode?(l.wtRequired||0):calcPoLineWt(l);
      const tp=l.pricingMethod==="PerKg"?wt*(l.unitPrice||0):(l.qty||0)*(l.unitPrice||0);
      const effKg=wt>0?tp/wt:0;
      const mc=l.matCode||buildMatCode(l.sectionType||l.section,l.matType,l.grade,l.size);
      const ic=buildItemCode({...l,matCode:mc});
      let byWtHint=null;
      if(isWtMode&&l.matLibId){
        const lib=(materials||[]).find(m=>m.id===l.matLibId);
        if(lib){
          if(lib.isPlate&&l.length>0&&l.width>0){const wp=(l.length/1000)*(l.width/1000)*(lib.wtPerM2||0);const hq=wp>0?Math.ceil((l.wtRequired||0)/wp):null;if(hq!=null)byWtHint=`≈ ${hq} sheet${hq!==1?"s":""} of ${l.length}×${l.width}mm`;}
          else if(!lib.isPlate&&l.length>0){const wp=(l.length/1000)*(lib.wtPerMetre||0);const hq=wp>0?Math.ceil((l.wtRequired||0)/wp):null;if(hq!=null)byWtHint=`≈ ${hq} bar${hq!==1?"s":""} of ${l.length}mm`;}
        }
      }
      return (
        <div style={{ marginTop:8, padding:"8px 12px", background:T.bgCard, borderRadius:6, display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
          <div>
            <div style={css.label}>{isWtMode?"Qty Hint":"Wt Ordered"}</div>
            <div style={{ fontSize:12,fontFamily:T.fontMono,fontWeight:700 }}>
              {isWtMode
                ? <span style={{color:byWtHint?T.textLow:T.textLow}}>{byWtHint||"— enter dimensions"}</span>
                : <span style={{color:wt>0?T.green:T.textLow}}>{wt>0?`${fmt.num(Math.round(wt))} kg (${(wt/1000).toFixed(2)} T)`:"—"}</span>}
            </div>
          </div>
          <div><div style={css.label}>Line Total</div><div style={{ fontSize:12,color:T.green,fontFamily:T.fontMono,fontWeight:700 }}>{fmt.currency(tp)}</div></div>
          <div><div style={css.label}>Eff. Rate/kg</div><div style={{ fontSize:12,color:T.accent,fontFamily:T.fontMono }}>{effKg>0?`₹${effKg.toFixed(2)}/kg`:"—"}</div></div>
          <div><div style={css.label}>Item Code</div><div style={{ fontSize:11,color:ic?T.accentHi:T.textLow,fontFamily:T.fontMono }}>{ic||"—"}{l.matLibId&&<span style={{color:T.green,marginLeft:4}}>✓</span>}</div></div>
        </div>
      );
    })()}
    {/* Row 5: Delivery + Remarks */}
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 }}>
      <Field label="Expected Delivery"><Input type="date" value={l.expectedDelivery||""} onChange={e=>setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],expectedDelivery:e.target.value}; return {...f,lines:n}; })} /></Field>
      <Field label="Remarks"><Input value={l.remarks||""} onChange={e=>setForm(f=>{ const n=[...f.lines]; n[i]={...n[i],remarks:e.target.value}; return {...f,lines:n}; })} /></Field>
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
      {/* Add to Library Modal */}
      {addToLibModal && (
        <Modal title="Add to Materials Library" onClose={()=>setAddToLibModal(null)} width={560}>
          {addToLibSuccess
            ? <div style={{ textAlign:"center", padding:32 }}>
                <div style={{ fontSize:32, marginBottom:12 }}>✓</div>
                <div style={{ color:T.green, fontWeight:700, fontSize:15 }}>Added to library!</div>
                <button style={{ ...css.btn.primary, marginTop:16 }} onClick={()=>setAddToLibModal(null)}>Close</button>
              </div>
            : <>
                <G2>
                  <Field label="Section Type">
                    <Sel value={addToLibForm.sectionType||""} onChange={e=>setAddToLibForm(f=>({...f,sectionType:e.target.value,isPlate:e.target.value==="PLATE",matCode:buildMatCode(e.target.value,f.matType,f.grade,f.size)}))}>
                      {["ISA","ISMC","ISMB","PLATE","RHS","SHS","Flat Bar","Other"].map(s=><option key={s}>{s}</option>)}
                    </Sel>
                  </Field>
                  <Field label="Size"><Input value={addToLibForm.size||""} onChange={e=>setAddToLibForm(f=>({...f,size:e.target.value,matCode:buildMatCode(f.sectionType,f.matType,f.grade,e.target.value)}))} placeholder="e.g. 100x50x4" /></Field>
                  <Field label="Grade">
                    <Sel value={addToLibForm.grade||"E250"} onChange={e=>setAddToLibForm(f=>({...f,grade:e.target.value,matCode:buildMatCode(f.sectionType,f.matType,e.target.value,f.size)}))}>
                      <option>E250</option><option>E350</option><option>304</option><option>316</option><option>Other</option>
                    </Sel>
                  </Field>
                  <Field label="Mat Type">
                    <Sel value={addToLibForm.matType||"MS"} onChange={e=>setAddToLibForm(f=>({...f,matType:e.target.value,matCode:buildMatCode(f.sectionType,e.target.value,f.grade,f.size)}))}>
                      <option>MS</option><option>SS</option><option>AL</option>
                    </Sel>
                  </Field>
                </G2>
                <Field label="Mat Code (auto-generated)"><Input value={addToLibForm.matCode||""} readOnly style={{ color:T.textMid }} /></Field>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                  <label style={{ fontSize:12, color:T.text }}>Is Plate?</label>
                  <input type="checkbox" checked={!!addToLibForm.isPlate} onChange={e=>setAddToLibForm(f=>({...f,isPlate:e.target.checked,wtPerMetre:e.target.checked?null:f.wtPerMetre,wtPerM2:e.target.checked?f.wtPerM2:null}))} />
                </div>
                {!addToLibForm.isPlate && <Field label="Wt per Metre (kg/m)"><Input type="number" step="0.01" value={addToLibForm.wtPerMetre||""} onChange={e=>setAddToLibForm(f=>({...f,wtPerMetre:+e.target.value||null}))} /></Field>}
                {addToLibForm.isPlate  && <Field label="Wt per m² (kg/m²)"><Input type="number" step="0.01" value={addToLibForm.wtPerM2||""} onChange={e=>setAddToLibForm(f=>({...f,wtPerM2:+e.target.value||null}))} /></Field>}
                <Field label="Standard Lengths (mm, comma-separated)"><Input value={(addToLibForm.standardLengths||[]).join(",")} onChange={e=>setAddToLibForm(f=>({...f,standardLengths:e.target.value.split(",").map(s=>parseInt(s.trim(),10)).filter(n=>!isNaN(n)&&n>0)}))} placeholder="6000,8000,10000,12000" /></Field>
                <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                  <button onClick={()=>setAddToLibModal(null)} style={css.btn.secondary}>Cancel</button>
                  <button onClick={()=>{
                    if (!addToLibForm.sectionType||!addToLibForm.size||(!addToLibForm.wtPerMetre&&!addToLibForm.wtPerM2)) return;
                    const saved = {...addToLibForm};
                    setMaterials(prev=>[...prev,{...saved,active:true}]);
                    setForm(f=>{ const n=[...f.lines]; n[addToLibModal.lineIdx]={...n[addToLibModal.lineIdx],matLibId:saved.id,matCode:saved.matCode,isPlate:saved.isPlate,wtPerMetre:saved.wtPerMetre||null,wtPerM2:saved.wtPerM2||null,wtSource:"",libraryMatch:true}; return {...f,lines:n}; });
                    setAddToLibSuccess(true);
                  }} style={css.btn.primary}>Save to Library</button>
                </div>
              </>
          }
        </Modal>
      )}
      {/* Hidden file input for New PO CSV import */}
      <input ref={poImpRef} type="file" accept=".csv" style={{display:"none"}} onChange={handlePOImpFile} />
      {/* PO Line CSV Import Preview Modal */}
      {poImpModal && <POLineImportModal
        rows={poImpRows} err={poImpErr} mode={poImpMode} setMode={setPoImpMode}
        fileRef={poImpRef} onFile={handlePOImpFile}
        onDownload={downloadPOTemplate}
        onConfirm={confirmPOImp}
        onClose={()=>{setPoImpModal(false);setPoImpRows([]);setPoImpErr("");poImpRef.current.value="";}}
      />}
    </div>
  );
};

// ─── PO DETAIL VIEW ───────────────────────────────────────────────────────────
const PODetail = ({ po, onBack, user, pos, setPos, stock, setStock, showToast, materials }) => {
  const [tab, setTab] = useState("lines");
  const [grnModal, setGrnModal] = useState(false);
  const [grnForm, setGrnForm] = useState({ lines:[] });
  const [inspModal, setInspModal] = useState(null);
  const [poImpModal, setPoImpModal] = useState(false);
  const [poImpRows,  setPoImpRows]  = useState([]);
  const [poImpErr,   setPoImpErr]   = useState("");
  const [poImpMode,  setPoImpMode]  = useState("append");
  const poImpRef = useRef(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [reverseModal, setReverseModal] = useState(null);
  const [reverseReason, setReverseReason] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const canEdit = ["super_admin","purchase_admin","store_admin"].includes(user.role);
  const canInspect = ["super_admin","qc_admin","qc_user","store_admin"].includes(user.role);

  const downloadPOTemplate = () => {
    const hdr    = ["Section Type","Size","Grade","Material Type","Length (mm)","Width (mm)","Qty (units)","Weight Required (kg)","Unit","Pricing Method (PerUnit/PerKg)","Unit Price (₹)","Manual Wt (kg/m or kg/m2)","Expected Delivery (DD-MM-YYYY)","Remarks"];
    const hints  = ["e.g. PLATE","12mm","E250","MS","6000","1250","5 (fill OR Weight — not both)","(leave blank if Qty filled)","Sheets","PerUnit","65000","(leave blank if library match found)","20-03-2026","Any notes"];
    const sample = ["ISA","75x75x8","E250","MS","12000","","40","","Pcs","PerUnit","780","","20-03-2026","Main columns"];
    const csv = [hdr,hints,sample].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = Object.assign(document.createElement("a"),{ href:URL.createObjectURL(new Blob([csv],{type:"text/csv"})), download:`po_lines_template_${po.id}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const handlePOImpFile = async e => {
    setPoImpErr(""); setPoImpRows([]);
    const file = e.target.files[0]; if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) { setPoImpErr("Please upload a .csv file."); return; }
    try {
      const { rows, errors, warnings } = parsePOLineCSV(await file.text(), materials);
      if (errors.length) { setPoImpErr(errors.join(" ")); return; }
      setPoImpErr(warnings.length ? "⚠ " + warnings.join(" ") : "");
      setPoImpRows(rows);
    } catch(err) { setPoImpErr("Error reading file: " + err.message); }
  };

  const confirmPOImpDetail = () => {
    const ts   = Date.now();
    const base = poImpMode==="replace" ? [] : (po.lines||[]);
    const clean = poImpRows.map(({_libMatched,...r},i)=>({...r, id:`POL-${ts}-${i}`}));
    setPos(prev=>prev.map(p=>p.id===po.id?{...p,lines:[...base,...clean]}:p));
    showToast(`${clean.length} PO line(s) imported`);
    setPoImpModal(false); setPoImpRows([]); setPoImpErr(""); poImpRef.current.value="";
  };

  const saveGRN = () => {
    if (!(grnForm.lines||[]).length) { showToast("Add at least one received line", "red"); return; }
    const ts = Date.now();
    const yr = new Date().getFullYear();
    const grnId = nextGrnId(pos);
    const batchNo = po.vendorCode ? genBatchNo(po.vendorCode, pos, yr) : "";
    const newGrn = { ...grnForm, id:grnId, batchNo, date:today(), createdBy:user.name, lines:(grnForm.lines||[]), status:"received" };
    setPos(prev => prev.map(p => {
      if (p.id!==po.id) return p;
      const updLines = p.lines.map(pl=>{
        const gl = newGrn.lines.find(x=>x.poLineId===pl.id);
        if(!gl) return pl;
        const nw=(pl.wtReceived||0)+(gl.actualWt||gl.wtReceived||0);
        const nq=(pl.qtyReceived||0)+(gl.qtyReceived||0);
        return {...pl, wtReceived:nw, qtyReceived:nq, status:nw>=pl.wtOrdered?"fully_received":"partially_received"};
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

  const cancelPO = () => {
    if (!cancelReason.trim()) return;
    const hasReceived = (po.grns||[]).some(g => g.status === "received");
    if (hasReceived) { showToast("Cancel all GRNs first", "red"); setCancelModal(false); return; }
    setPos(prev => prev.map(p => p.id !== po.id ? p : {
      ...p, status:"cancelled",
      cancellationReason: cancelReason,
      cancelledBy: user.name,
      cancelledDate: today()
    }));
    showToast("PO cancelled");
    setCancelModal(false);
    onBack();
  };

  const reverseGRN = (grnId) => {
    if (!reverseReason.trim()) return;
    // Step 1 — validate: all lots for this GRN must be qc_hold
    const grnLots = (stock||[]).filter(s => s.grnId === grnId);
    const blockedLot = grnLots.find(s => s.status !== "qc_hold");
    if (blockedLot) {
      showToast(`Cannot reverse — lot ${blockedLot.lotNo} has been approved or allocated. Contact administrator.`, "red");
      return;
    }
    // Step 2 — remove stock lots immediately using functional updater (always fresh)
    setStock(prev => prev.filter(s => s.grnId !== grnId));
    // Steps 3-5 — update PO lines, GRN status, and PO status atomically
    // Read GRN lines from the pos functional updater to avoid stale-closure bugs
    setPos(prev => prev.map(p => {
      if (p.id !== po.id) return p;
      const grn = p.grns.find(g => g.id === grnId);
      if (!grn) return p;
      // Step 3 — reverse wtReceived / qtyReceived on each matching PO line
      const updLines = p.lines.map(pl => {
        const gl = grn.lines?.find(x => x.poLineId === pl.id);
        if (!gl) return pl;
        const nw = Math.max(0, (pl.wtReceived||0) - (gl.actualWt||gl.wtReceived||0));
        const nq = Math.max(0, (pl.qtyReceived||0) - (gl.qtyReceived||0));
        return { ...pl, wtReceived:nw, qtyReceived:nq,
          status: nw <= 0 ? "pending" : nw >= pl.wtOrdered ? "fully_received" : "partially_received" };
      });
      // Step 4 — recalculate PO status from updated lines
      const allFull = updLines.every(l => l.status === "fully_received");
      const anyRec  = updLines.some(l => l.status === "fully_received" || l.status === "partially_received");
      const newPoStatus = p.status === "cancelled" ? "cancelled"
        : allFull ? "fully_received" : anyRec ? "partially_received" : "pending";
      // Step 5 — mark GRN reversed with audit fields
      const updGrns = p.grns.map(g => g.id !== grnId ? g : {
        ...g, status:"reversed",
        reversalReason: reverseReason,
        reversedBy: user.name,
        reversedDate: today()
      });
      return { ...p, grns:updGrns, lines:updLines, status:newPoStatus };
    }));
    showToast("GRN reversed — stock lots removed");
    setReverseModal(null);
    setReverseReason("");
  };

  const deletePO = () => {
    setPos(prev => prev.filter(p => p.id !== po.id));
    showToast("PO deleted");
    setDeleteConfirm(false);
    onBack();
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
      <div style={{ fontSize:12, color:T.textMid, marginBottom:8 }}>PO Date: {fmt.date(po.poDate)} · Expected: {fmt.date(po.expectedDelivery)}</div>
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <StatCard label="Lines" value={po.lines?.length||0} color={T.text} />
        <StatCard label="Total Value" value={fmt.currency(totalVal)} color={T.green} />
        <StatCard label="Wt Ordered" value={`${fmt.num(totalWtOrd)} kg`} sub={`${(totalWtOrd/1000).toFixed(2)} T`} color={T.accent} />
        <StatCard label="Wt Received" value={`${fmt.num(totalWtRec)} kg`} sub={totalWtOrd>0?`${Math.round(totalWtRec/totalWtOrd*100)}%`:""} color={totalWtRec>0?T.green:T.textLow} />
        <StatCard label="GRNs" value={po.grns?.length||0} color={T.textMid} />
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {["lines","grns"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:"7px 14px", fontSize:12, fontWeight:tab===t?700:400, color:tab===t?T.accent:T.textMid, background:"transparent", border:"none", borderBottom:tab===t?`2px solid ${T.accent}`:"2px solid transparent", cursor:"pointer", fontFamily:T.font }}>
            {t==="lines"?"PO Lines":"GRNs"} {t==="grns"&&po.grns?.length>0?`(${po.grns.length})`:""}
          </button>
        ))}
        <div style={{ flex:1 }} />
        {user.role==="super_admin" && po.status==="pending" && (po.grns||[]).length===0 && (
          <button onClick={()=>setDeleteConfirm(true)} style={{ ...css.btn.ghost, color:T.red, border:`1px solid ${T.red}` }}>Delete PO</button>
        )}
        {user.role==="super_admin" && po.status!=="cancelled" && !((po.grns||[]).length===0 && po.status==="pending") && (
          <button onClick={()=>{ setCancelReason(""); setCancelModal(true); }} style={{ ...css.btn.ghost, color:T.red, border:`1px solid ${T.red}` }}>Cancel PO</button>
        )}
        {canEdit && tab==="grns" && po.status!=="cancelled" && <button onClick={()=>{ const yr=new Date().getFullYear(); const preview=po.vendorCode?genBatchNo(po.vendorCode,pos,yr):""; const autoLines=(po.lines||[]).filter(pl=>(pl.wtOrdered||0)>(pl.wtReceived||0)).map(pl=>{ const bal=Math.round((pl.wtOrdered||0)-(pl.wtReceived||0)); return {poLineId:pl.id,materialDesc:pl.itemCode||pl.matCode||`${pl.sectionType||""} ${pl.size||""}`.trim(),qtyReceived:pl.qty||0,calculatedWt:bal,actualWt:bal,wtReceived:bal,variance:0,heatNo:"",condition:"good",inspStatus:"approved"}; }); setGrnForm({lines:autoLines,batchNo:preview}); setGrnModal(true); }} style={css.btn.primary}>+ Raise GRN</button>}
        {canEdit && tab==="lines" && po.status==="pending" && (
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={downloadPOTemplate} style={css.btn.secondary}>⬇ Template</button>
            <button onClick={()=>setPoImpModal(true)} style={css.btn.amber}>📥 Import CSV</button>
          </div>
        )}
      </div>

      {/* PO Lines */}
      {tab==="lines" && (
        <div>
          {po.lines?.some(l=>l.wtSource==="manual") && (
            <InfoBanner color="amber">One or more lines have manually entered weights — verify with vendor before raising GRN.</InfoBanner>
          )}
          <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead><tr><TH>#</TH><TH>Section</TH><TH>Size</TH><TH>Grade</TH><TH right>Qty / Weight</TH><TH right>Unit Price</TH><TH>Pricing</TH><TH right>Eff ₹/kg</TH><TH right>Total</TH><TH right>Wt Ord (kg)</TH><TH right>Wt Rcvd (kg)</TH><TH>Status</TH></tr></thead>
            <tbody>
              {po.lines?.map((l,i)=>{
                return (
                <tr key={l.id} style={{ background:i%2===0?"transparent":T.bg }}>
                  <TD mono color={T.textLow}>{i+1}</TD>
                  <TD><span style={{fontFamily:T.fontMono,fontSize:11,color:l.matLibId?T.accentHi:T.text}}>{l.sectionType||l.section||"—"}</span></TD>
                  <TD mono>{l.size||"—"}</TD>
                  <TD>{l.grade||"—"}</TD>
                  <TD right mono>
                    {(l.orderMode||"ByUnits")==="ByWeight"
                      ? <>{fmt.num(l.wtOrdered||0)} kg <span style={{color:T.textLow,fontSize:11}}>(≈ {l.qtyOrdered||l.qty} {l.unit==="KG"?"pcs":l.unit||"pcs"})</span></>
                      : <>{l.qtyOrdered||l.qty} {l.unit||"MT"} <span style={{color:T.textLow,fontSize:11}}>({fmt.num(Math.round(l.wtOrdered||0))} kg)</span></>
                    }
                  </TD>
                  <TD right mono>{fmt.currency(l.unitPrice)}</TD>
                  <TD><span style={{fontSize:11,color:T.textMid}}>{l.pricingMethod||"PerUnit"}</span></TD>
                  <TD right mono>
                    {l.effectiveRateKg>0?`₹${Number(l.effectiveRateKg).toFixed(1)}/kg`:"—"}
                    {l.pricingMethod==="PerKg"&&l.effectiveRateUnit>0&&<div style={{color:T.textLow,fontSize:10}}>₹{fmt.num(Math.round(l.effectiveRateUnit))}/{l.unit||"unit"}</div>}
                  </TD>
                  <TD right mono bold color={T.green}>{fmt.currency(l.totalPrice)}</TD>
                  <TD right mono>{fmt.num(l.wtOrdered)}</TD>
                  <TD right mono color={l.wtReceived>0?T.green:T.textLow}>{fmt.num(l.wtReceived||0)}</TD>
                  <TD><Badge color={l.status==="fully_received"?"green":l.status==="partially_received"?"amber":l.status==="pending"?"gray":"red"}>{l.status?.replace("_"," ")}</Badge>{l.wtSource==="manual"&&<span style={{marginLeft:4}}><Badge color="amber">Manual wt</Badge></span>}</TD>
                </tr>
                );
              })}
              <tr style={{ background:T.bgInput }}>
                <td colSpan={8} style={{ padding:"6px 10px", fontWeight:700, fontSize:12, color:T.textMid }}>Total</td>
                <td style={{ padding:"6px 10px", textAlign:"right", fontFamily:T.fontMono, fontWeight:700, color:T.green }}>{fmt.currency(totalVal)}</td>
                <td style={{ padding:"6px 10px", textAlign:"right", fontFamily:T.fontMono, fontWeight:700 }}>{fmt.num(totalWtOrd)}</td>
                <td style={{ padding:"6px 10px", textAlign:"right", fontFamily:T.fontMono, fontWeight:700, color:T.green }}>{fmt.num(totalWtRec)}</td>
                <td/>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* GRNs */}
      {tab==="grns" && (
        <div>
          {po.grns?.length===0 && <div style={{ ...css.card, textAlign:"center", color:T.textLow, padding:32 }}>No GRNs raised yet</div>}
          {po.grns?.map(grn=>(
            <div key={grn.id} style={{ ...css.card, marginBottom:12, opacity:grn.status==="reversed"?0.7:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                    <span style={{ fontFamily:T.fontMono, color:T.accentHi, fontSize:13, fontWeight:700 }}>{grn.id}</span>
                    <Badge color={grn.status==="reversed"?"red":"green"}>{grn.status==="reversed"?"Reversed":"Received"}</Badge>
                  </div>
                  <div style={{ fontSize:12, color:T.textMid }}>Date: {fmt.date(grn.date)} · Vehicle: {grn.vehicleNo} · Challan: {grn.challanNo} · By: {grn.createdBy}</div>
                  {grn.batchNo&&<div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>Batch: <span style={{fontFamily:T.fontMono,color:T.accentHi,fontWeight:700}}>{grn.batchNo}</span></div>}
                  {grn.supplierInvoiceNo&&<div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>Invoice: <span style={{fontFamily:T.fontMono,color:T.text}}>{grn.supplierInvoiceNo}</span>{grn.supplierInvoiceWt>0?` · Inv Wt: ${fmt.num(grn.supplierInvoiceWt)} kg`:""}{grn.supplierInvoiceAmt>0?` · Inv Amt: ${fmt.currency(grn.supplierInvoiceAmt)}`:""}</div>}
                  {grn.remarks && <div style={{ fontSize:12, color:T.textMid, marginTop:4 }}>{grn.remarks}</div>}
                  {grn.status==="reversed" && <div style={{ fontSize:11, color:T.red, marginTop:4 }}>Reversed by {grn.reversedBy} on {fmt.date(grn.reversedDate)} — {grn.reversalReason}</div>}
                </div>
                {user.role==="super_admin" && grn.status!=="reversed" && (
                  <button onClick={()=>{ setReverseReason(""); setReverseModal(grn.id); }} style={{ ...css.btn.ghost, color:T.red, border:`1px solid ${T.red}`, alignSelf:"flex-start", fontSize:11 }}>Reverse GRN</button>
                )}
              </div>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead><tr><TH>PO Line</TH><TH>Material</TH><TH right>Qty Rcvd</TH><TH right>Calc Wt (kg)</TH><TH right>Actual Wt (kg)</TH><TH right>Variance</TH><TH>Insp</TH></tr></thead>
                <tbody>
                  {grn.lines?.map((l,i)=>(
                    <tr key={i} style={{ background:i%2===0?"transparent":T.bg }}>
                      <TD mono>{l.poLineId}</TD>
                      <TD><span style={{fontFamily:T.fontMono,fontSize:11}}>{l.materialDesc||l.poLineId}</span></TD>
                      <TD right mono>{l.qtyReceived||"—"}</TD>
                      <TD right mono>{fmt.num(l.calculatedWt||l.wtReceived)}</TD>
                      <TD right mono bold color={T.green}>{fmt.num(l.actualWt||l.wtReceived)}</TD>
                      <TD right mono color={(()=>{ const vp=l.calculatedWt>0?Math.abs(l.variance||0)/l.calculatedWt*100:0; return vp<=2?T.green:vp<=5?T.amber:T.red; })()}>{l.variance!=null?`${l.variance>0?"+":""}${l.variance}`:"—"}</TD>
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
            {["super_admin","store_admin","store_user"].includes(user.role) && <>
              <Field label="Supplier Invoice No"><Input value={grnForm.supplierInvoiceNo||""} onChange={e=>setGrnForm(f=>({...f,supplierInvoiceNo:e.target.value}))} /></Field>
              <Field label="Supplier Invoice Wt (kg)"><Input type="number" value={grnForm.supplierInvoiceWt||""} onChange={e=>setGrnForm(f=>({...f,supplierInvoiceWt:+e.target.value}))} /></Field>
              <Field label="Supplier Invoice Amt (₹)"><Input type="number" value={grnForm.supplierInvoiceAmt||""} onChange={e=>setGrnForm(f=>({...f,supplierInvoiceAmt:+e.target.value}))} /></Field>
              <Field label="Reconciliation">
                <Sel value={grnForm.reconciliationStatus||"pending"} onChange={e=>setGrnForm(f=>({...f,reconciliationStatus:e.target.value}))}>
                  <option value="pending">Pending</option><option value="matched">Matched</option><option value="variance">Variance</option><option value="dispute">Dispute</option>
                </Sel>
              </Field>
            </>}
          </G2>
          {(grnForm.lines||[]).some(l=>l.inspStatus==="hold") && (
            <Field label="Hold Reason"><Input value={grnForm.holdReason||""} onChange={e=>setGrnForm(f=>({...f,holdReason:e.target.value}))} placeholder="Reason for hold..." /></Field>
          )}
          <SectionHd title="Received Lines" action={
            <button onClick={()=>setGrnForm(f=>({...f,lines:[...(f.lines||[]),{poLineId:"",materialDesc:"",qtyReceived:0,calculatedWt:0,actualWt:0,variance:0,wtReceived:0,heatNo:"",condition:"good",inspStatus:"approved"}]}))} style={css.btn.sm}>+ Add Line</button>
          } />
          {(grnForm.lines||[]).map((l,i)=>(
            <div key={i} style={{ ...css.card, background:T.bg, marginBottom:8 }}>
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"3fr 1fr 1fr 1fr", gap:8, alignItems:"end", marginBottom:6 }}>
                  <Field label="PO Line Ref">
                    <Sel value={l.poLineId||""} onChange={e=>setGrnForm(f=>{ const n=[...f.lines]; const pl=po.lines?.find(x=>x.id===e.target.value); const wtPU=calcGrnWtPU(pl,materials); const cw=n[i].qtyReceived>0&&wtPU>0?Math.round(n[i].qtyReceived*wtPU):0; n[i]={...n[i],poLineId:e.target.value,materialDesc:pl?.itemCode||pl?.matCode||`${pl?.sectionType||pl?.section||""} ${pl?.size||""}`.trim(),calculatedWt:Math.round(cw),actualWt:Math.round(cw),wtReceived:Math.round(cw),variance:0}; return {...f,lines:n}; })}>
                      <option value="">Select PO line...</option>
                      {po.lines?.map(pl=><option key={pl.id} value={pl.id}>{pl.id} — {pl.itemCode||pl.matCode||`${pl.sectionType||pl.section||""} ${pl.size||""}`.trim()} (Bal: {fmt.num((pl.wtOrdered||0)-(pl.wtReceived||0))} kg)</option>)}
                    </Sel>
                  </Field>
                  <Field label="Qty Received"><Input type="number" value={l.qtyReceived||""} onChange={e=>setGrnForm(f=>{ const n=[...f.lines]; const pl=po.lines?.find(x=>x.id===n[i].poLineId); const wtPU=calcGrnWtPU(pl,materials); const qr=+e.target.value; const cw=wtPU>0?Math.round(qr*wtPU):0; n[i]={...n[i],qtyReceived:qr,calculatedWt:cw,actualWt:cw,wtReceived:cw,variance:0}; return {...f,lines:n}; })} placeholder="Bars / Pcs" /></Field>
                  <Field label="Calc Wt (kg)"><Input value={l.calculatedWt||""} readOnly style={{opacity:0.6,cursor:"default",fontFamily:T.fontMono,fontSize:12}} /></Field>
                  <Field label="Weighbridge (kg)"><Input type="number" value={l.actualWt||""} onChange={e=>setGrnForm(f=>{ const n=[...f.lines]; const aw=+e.target.value; const vr=Math.round(aw-(n[i].calculatedWt||0)); n[i]={...n[i],actualWt:aw,wtReceived:aw,variance:vr}; return {...f,lines:n}; })} placeholder={`Calc: ${l.calculatedWt||0}`} /></Field>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr auto", gap:8, alignItems:"end" }}>
                  {(()=>{ const vp=l.calculatedWt>0?Math.abs(l.variance||0)/l.calculatedWt*100:0; const vc=vp<=2?T.green:vp<=5?T.amber:T.red; return (
                    <Field label="Variance"><Input value={l.variance!==undefined&&l.variance!==null&&l.calculatedWt>0?`${(l.variance>0?"+":"")}${l.variance} kg (${vp.toFixed(1)}%)`:"—"} readOnly style={{opacity:0.9,cursor:"default",fontFamily:T.fontMono,color:vc,fontSize:11}} /></Field>
                  ); })()}
                  <Field label={<span>Heat No {!l.heatNo&&<span style={{color:T.amber,fontSize:10}}>⚠</span>}</span>}><Input value={l.heatNo||""} onChange={e=>setGrnForm(f=>{ const n=[...f.lines]; n[i]={...n[i],heatNo:e.target.value}; return {...f,lines:n}; })} placeholder="From MTC..." /></Field>
                  <Field label="Condition"><Sel value={l.condition||"good"} onChange={e=>setGrnForm(f=>{ const n=[...f.lines]; n[i]={...n[i],condition:e.target.value}; return {...f,lines:n}; })}><option value="good">Good</option><option value="damaged">Damaged</option><option value="short">Short</option></Sel></Field>
                  <Field label="Insp"><Sel value={l.inspStatus||"approved"} onChange={e=>setGrnForm(f=>{ const n=[...f.lines]; n[i]={...n[i],inspStatus:e.target.value}; return {...f,lines:n}; })}><option value="approved">Approved</option><option value="hold">Hold</option><option value="rejected">Rejected</option></Sel></Field>
                  <button onClick={()=>setGrnForm(f=>({...f,lines:f.lines.filter((_,j)=>j!==i)}))} style={{ ...css.btn.ghost, color:T.red, paddingTop:20 }}>✕</button>
                </div>
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
      {/* Hidden file input for PODetail CSV import */}
      <input ref={poImpRef} type="file" accept=".csv" style={{display:"none"}} onChange={handlePOImpFile} />
      {poImpModal && <POLineImportModal
        rows={poImpRows} err={poImpErr} mode={poImpMode} setMode={setPoImpMode}
        fileRef={poImpRef} onFile={handlePOImpFile}
        onDownload={downloadPOTemplate}
        onConfirm={confirmPOImpDetail}
        onClose={()=>{setPoImpModal(false);setPoImpRows([]);setPoImpErr("");poImpRef.current.value="";}}
      />}

      {/* Cancel PO Modal */}
      {cancelModal && (
        <Modal title={`Cancel ${po.id}`} onClose={()=>setCancelModal(false)} width={480}>
          {(po.grns||[]).some(g=>g.status==="received")
            ? <>
                <InfoBanner color="red">Cannot cancel — one or more GRNs have been received. Reverse all GRNs first, then cancel the PO.</InfoBanner>
                <div style={{ display:"flex", justifyContent:"flex-end", marginTop:12 }}>
                  <button onClick={()=>setCancelModal(false)} style={css.btn.primary}>OK</button>
                </div>
              </>
            : <>
                <InfoBanner color="amber">This will mark the PO as Cancelled. This action is logged and cannot be undone automatically.</InfoBanner>
                <Field label="Cancellation Reason (mandatory)">
                  <textarea value={cancelReason} onChange={e=>setCancelReason(e.target.value)} rows={3} style={{ width:"100%", background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:6, color:T.text, fontSize:13, padding:"8px 10px", fontFamily:T.font, resize:"vertical", boxSizing:"border-box" }} placeholder="State the reason for cancellation..." />
                </Field>
                <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:8 }}>
                  <button onClick={()=>setCancelModal(false)} style={css.btn.secondary}>Back</button>
                  <button onClick={cancelPO} disabled={!cancelReason.trim()} style={{ ...css.btn.primary, background:T.red, opacity:cancelReason.trim()?1:0.5 }}>Confirm Cancel</button>
                </div>
              </>
          }
        </Modal>
      )}

      {/* Reverse GRN Modal */}
      {reverseModal && (()=>{
        const grnLots = (stock||[]).filter(s => s.grnId === reverseModal);
        const blockedLot = grnLots.find(s => s.status !== "qc_hold");
        return (
          <Modal title={`Reverse ${reverseModal}`} onClose={()=>setReverseModal(null)} width={480}>
            {blockedLot
              ? <>
                  <InfoBanner color="red">Cannot reverse — lot {blockedLot.lotNo} has been approved or allocated. Contact administrator.</InfoBanner>
                  <div style={{ display:"flex", justifyContent:"flex-end", marginTop:12 }}>
                    <button onClick={()=>setReverseModal(null)} style={css.btn.primary}>OK</button>
                  </div>
                </>
              : <>
                  <InfoBanner color="red">Reversing this GRN will remove all stock lots created from it and subtract the received weight from PO line counters.</InfoBanner>
                  <Field label="Reversal Reason (mandatory)">
                    <textarea value={reverseReason} onChange={e=>setReverseReason(e.target.value)} rows={3} style={{ width:"100%", background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:6, color:T.text, fontSize:13, padding:"8px 10px", fontFamily:T.font, resize:"vertical", boxSizing:"border-box" }} placeholder="State the reason for reversal..." />
                  </Field>
                  <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:8 }}>
                    <button onClick={()=>setReverseModal(null)} style={css.btn.secondary}>Back</button>
                    <button onClick={()=>reverseGRN(reverseModal)} disabled={!reverseReason.trim()} style={{ ...css.btn.primary, background:T.red, opacity:reverseReason.trim()?1:0.5 }}>Confirm Reversal</button>
                  </div>
                </>
            }
          </Modal>
        );
      })()}

      {/* Delete PO Confirm */}
      {deleteConfirm && (
        <Modal title="Delete Purchase Order" onClose={()=>setDeleteConfirm(false)} width={400}>
          <InfoBanner color="red">Delete {po.id}? This cannot be undone.</InfoBanner>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:12 }}>
            <button onClick={()=>setDeleteConfirm(false)} style={css.btn.secondary}>Cancel</button>
            <button onClick={deletePO} style={{ ...css.btn.primary, background:T.red }}>Delete PO</button>
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
  const [revertModal, setRevertModal] = useState(null); // {type:"qc"|"client"|"reinspect", lot}
  const [revertReason, setRevertReason] = useState("");

  const showToast = (msg,color="green") => { setToast({msg,color}); setTimeout(()=>setToast(null),3000); };
  const canQC = ["super_admin","qc_admin","qc_user","store_admin"].includes(user.role);

  const qcPending = stock.filter(s=>s.rmQcStatus==="pending");
  const clientPending = stock.filter(s=>s.rmQcStatus==="approved"&&s.clientInspStatus==="pending");
  const approved = stock.filter(s=>s.rmQcStatus==="approved"&&s.clientInspStatus==="approved");
  const failed = stock.filter(s=>s.rmQcStatus==="failed");
  const onHold = stock.filter(s=>s.status==="qc_hold");

  const doQC = (lotId, result, remarks) => {
    const mtcDoc  = form.mtcLink?.trim()||"";
    const heatNo  = form.heatNo?.trim()||"";
    setStock(prev=>prev.map(s=>s.id===lotId?{...s,
      rmQcStatus:result, qcRemarks:remarks, qcDate:today(), qcBy:user.name,
      status:result==="failed"?"rejected":s.status,
      mtcDoc: mtcDoc||s.mtcDoc, heatNo: heatNo||s.heatNo,
      mtcUploaded: mtcDoc ? true : s.mtcUploaded
    }:s));
    showToast(result==="approved"?"RM QC Approved — pending client inspection":"RM QC result saved");
    setModal(null);
  };

  const doClientInsp = (lotId, result, remarks) => {
    setStock(prev=>prev.map(s=>s.id===lotId?{...s,clientInspStatus:result,clientInspRemarks:remarks,clientInspDate:today(),
      status:(result==="approved"&&s.rmQcStatus==="approved")?"available":"qc_hold"}:s));
    showToast(result==="approved"?"Client Inspection Passed — material added to available stock ✓":"Client inspection result saved");
    setModal(null);
  };

  const revertQC = (lot, reason) => {
    setStock(prev=>prev.map(s=>s.id===lot.id?{...s,rmQcStatus:"pending",qcRemarks:"",qcDate:null,qcBy:null,status:"qc_hold",
      auditLog:[...(s.auditLog||[]),{action:"qc_reverted",by:user.name,date:today(),reason}]}:s));
    setRevertModal(null); setRevertReason("");
    showToast("RM QC approval reverted — lot returned to pending","amber");
  };

  const revertClientInsp = (lot, reason) => {
    if ((lot.wtAllocated||0)>0) { showToast(`Cannot revert — lot has ${fmt.num(lot.wtAllocated)} kg allocated`,"red"); return; }
    setStock(prev=>prev.map(s=>s.id===lot.id?{...s,clientInspStatus:"pending",clientInspRemarks:"",clientInspDate:null,status:"qc_hold",
      auditLog:[...(s.auditLog||[]),{action:"client_insp_reverted",by:user.name,date:today(),reason}]}:s));
    setRevertModal(null); setRevertReason("");
    showToast("Client inspection reverted — lot returned to QC hold","amber");
  };

  const reInspect = (lot, reason) => {
    setStock(prev=>prev.map(s=>s.id===lot.id?{...s,rmQcStatus:"pending",qcRemarks:"",qcDate:null,qcBy:null,status:"qc_hold",
      auditLog:[...(s.auditLog||[]),{action:"reinspect_requested",by:user.name,date:today(),reason}]}:s));
    setRevertModal(null); setRevertReason("");
    showToast("Lot returned to RM QC Pending for re-inspection","green");
  };

  const QCRow = ({ lot, type, actions }) => (
    <tr style={{ borderBottom:`1px solid ${T.border}` }}>
      <TD mono>{lot.lotNo}</TD>
      <TD>{lot.matType} {lot.grade}</TD>
      <TD>{lot.sectionType||lot.section}</TD>
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
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {canQC && type!=="done" && type!=="failed" && (
            <button onClick={()=>{setForm({lotId:lot.id,type,lot});setModal("inspect");}} style={{ ...css.btn.sm, background:T.amberBg, color:T.amber, border:`1px solid ${T.amber}` }}>
              {type==="qc"?"Inspect":"Client Insp"}
            </button>
          )}
          {actions}
        </div>
      </TD>
    </tr>
  );

  const Section = ({ title, lots, type, color, actionsFor }) => (
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
              <tbody>{lots.map(l=><QCRow key={l.id} lot={l} type={type} actions={actionsFor?actionsFor(l):null} />)}</tbody>
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
      <Section title="Client Inspection Pending" lots={clientPending} type="client" color="gold"
        actionsFor={user.role==="super_admin"?lot=>(
          <button onClick={()=>{setRevertModal({type:"qc",lot});setRevertReason("");}} style={{ ...css.btn.sm, background:T.amberBg, color:T.amber, border:`1px solid ${T.amber}` }}>
            Revert QC ↩
          </button>
        ):null}
      />
      <Section title="Approved & Available in Stock" lots={approved} type="done" color="green"
        actionsFor={user.role==="super_admin"?lot=>(
          <button onClick={()=>{setRevertModal({type:"client",lot});setRevertReason("");}} style={{ ...css.btn.sm, background:T.redBg, color:T.red, border:`1px solid ${T.redLo}` }}>
            Revert Insp ↩
          </button>
        ):null}
      />
      <Section title="Failed / Rejected Lots" lots={failed} type="failed" color="red"
        actionsFor={["super_admin","qc_admin","qc_user"].includes(user.role)?lot=>(
          <button onClick={()=>{setRevertModal({type:"reinspect",lot});setRevertReason("");}} style={{ ...css.btn.sm, background:T.greenLo, color:T.green, border:`1px solid ${T.green}` }}>
            Re-inspect
          </button>
        ):null}
      />

      {/* Revert / Re-inspect Modal */}
      {revertModal && (
        <Modal title={revertModal.type==="qc"?"Revert RM QC Approval":revertModal.type==="client"?"Revert Client Inspection":"Send for Re-inspection"} onClose={()=>setRevertModal(null)}>
          <InfoBanner color={revertModal.type==="reinspect"?"blue":"red"}>
            {revertModal.type==="qc"&&"This will set the lot back to RM QC Pending. The QC approval will be cleared."}
            {revertModal.type==="client"&&"This will set the lot back to QC Hold. The client inspection approval will be cleared. Blocked if material is allocated."}
            {revertModal.type==="reinspect"&&"This will return the failed lot to RM QC Pending for a fresh inspection."}
          </InfoBanner>
          {revertModal.type==="client"&&(revertModal.lot.wtAllocated||0)>0&&(
            <InfoBanner color="red">⚠ Cannot revert — this lot has {fmt.num(revertModal.lot.wtAllocated)} kg allocated. Release allocations first.</InfoBanner>
          )}
          <div style={{ marginTop:12 }}>
            <label style={css.label}>Reason *</label>
            <textarea value={revertReason} onChange={e=>setRevertReason(e.target.value)} rows={3}
              placeholder="State the reason for this action..."
              style={{ ...css.input, width:"100%", resize:"vertical", marginTop:4 }} />
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:14 }}>
            <button onClick={()=>setRevertModal(null)} style={css.btn.secondary}>Cancel</button>
            <button disabled={!revertReason.trim()||(revertModal.type==="client"&&(revertModal.lot.wtAllocated||0)>0)}
              onClick={()=>{
                if (!revertReason.trim()) return;
                if (revertModal.type==="qc") revertQC(revertModal.lot, revertReason);
                else if (revertModal.type==="client") revertClientInsp(revertModal.lot, revertReason);
                else reInspect(revertModal.lot, revertReason);
              }}
              style={{ ...css.btn.primary, opacity:(revertReason.trim()&&!(revertModal.type==="client"&&(revertModal.lot.wtAllocated||0)>0))?1:0.4 }}>
              Confirm
            </button>
          </div>
        </Modal>
      )}

      {/* Inspection Modal */}
      {modal==="inspect" && (
        <Modal title={form.type==="qc"?"RM QC Inspection":"Client Inspection"} onClose={()=>setModal(null)} width={560}>
          <div style={{ ...css.card, background:T.bg, marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.textMid, marginBottom:8 }}>LOT DETAILS</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[["Lot No",form.lot?.lotNo],["Material",`${form.lot?.matType} ${form.lot?.grade}`],["Section/Size",`${(form.lot?.sectionType||form.lot?.section||'')} ${form.lot?.size||''}`.trim()],["Wt Received",`${fmt.num(form.lot?.wtReceived)} kg`],["Bay",form.lot?.bayId],["MTC",form.lot?.mtcUploaded?"Uploaded ✓":"⚠ Missing"]].map(([k,v])=>(
                <div key={k}><div style={css.label}>{k}</div><div style={{ fontSize:12, color:v?.includes?.("⚠")?T.red:T.text, fontFamily:k.includes("Lot")||k.includes("Wt")||k.includes("Bay")?T.fontMono:T.font }}>{v}</div></div>
              ))}
            </div>
          </div>

          {form.type==="qc" && (
            <div>
              <div style={{ ...css.card, background:T.bg, marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.textMid, marginBottom:10, letterSpacing:"0.06em" }}>MTC DOCUMENT UPLOAD</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div style={{ gridColumn:"span 2" }}>
                    <label style={css.label}>Drive Link</label>
                    <input value={form.mtcLink||""} onChange={e=>setForm(f=>({...f,mtcLink:e.target.value}))}
                      placeholder="https://drive.google.com/..."
                      style={{ ...css.input, marginTop:4, width:"100%" }} />
                  </div>
                  <div>
                    <label style={css.label}>Heat Number</label>
                    <input value={form.heatNo||""} onChange={e=>setForm(f=>({...f,heatNo:e.target.value}))}
                      placeholder="e.g. JSW-HEAT-2026-001"
                      style={{ ...css.input, marginTop:4 }} />
                  </div>
                </div>
              </div>
              <Field label="Inspection Checks">
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {["MTC Verified","Dimensions Checked","Visual Inspection OK","Surface Condition OK","Identification Marking OK"].map(check=>(
                    <div key={check}>
                      <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                        <input type="checkbox" checked={form[check]||false} onChange={e=>setForm(f=>({...f,[check]:e.target.checked}))} />
                        <span style={{ fontSize:12, color:T.text }}>{check}</span>
                      </label>
                      {check==="MTC Verified" && form["MTC Verified"] && !(form.mtcLink||"").trim() && (
                        <div style={{ fontSize:11, color:T.amber, marginTop:3, marginLeft:24 }}>⚠ MTC Verified requires a document link</div>
                      )}
                    </div>
                  ))}
                </div>
              </Field>
              {!form.lot?.mtcUploaded && !(form.mtcLink||"").trim() && <InfoBanner color="red">⚠ MTC not uploaded — system will allow QC but will log warning. Upload MTC before client inspection.</InfoBanner>}
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
const StockModule = ({ user, stock, setStock, orders, contractors, materials, issueRequests=[], setIssueRequests }) => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [modal, setModal] = useState(null);
  const [activeLot, setActiveLot] = useState(null);
  const [mForm, setMForm] = useState({});
  const [toast, setToast] = useState(null);
  const [mtcUploadId, setMtcUploadId] = useState(null); // lotId with inline MTC form open
  const [mtcForm, setMtcForm] = useState({});
  const [resModal, setResModal] = useState(null); // null | "add" | "confirm_release"
  const [resForm, setResForm] = useState({});
  const [resLot, setResLot] = useState(null);
  const [resRelIdx, setResRelIdx] = useState(-1);

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
    const ms = filter==="all" || (filter==="offcuts"?s.isOffcut:filter==="reserved"?(s.reservations||[]).length>0:s.status===filter);
    const mq = !search || [s.lotNo,s.batchNo,s.matCode,(s.sectionType||s.section),s.size,s.grade,s.vendorName,s.heatNo].some(v=>(v||"").toLowerCase().includes(search.toLowerCase()));
    return ms && mq;
  });

  const stCol = { available:"green", allocated:"blue", issued:"purple", consumed:"gray", qc_hold:"amber", written_off:"red", pending_offcut_verification:"amber", reserved:"amber" };
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
    const dim = (activeLot.sectionType||activeLot.section)==="PLATE" ? (mForm.offcutDim||"") : (mForm.offcutLength||"");
    const newLot = { id:`OC-${Date.now()}`, lotNo:newLotNo, batchNo:activeLot.batchNo, itemCode:dim?`${activeLot.matCode}/${dim}`:activeLot.matCode, matCode:activeLot.matCode, matLibId:activeLot.matLibId||"", matType:activeLot.matType, grade:activeLot.grade, sectionType:activeLot.sectionType||activeLot.section||"", size:activeLot.size, vendorId:activeLot.vendorId, vendorCode:activeLot.vendorCode, vendorName:activeLot.vendorName, heatNo:activeLot.heatNo, wtReceived:offcutWt, wtAvailable:offcutWt, wtAllocated:0, wtIssued:0, wtConsumed:0, status:"pending_offcut_verification", bayId:activeLot.bayId, mtcUploaded:activeLot.mtcUploaded, mtcDoc:activeLot.mtcDoc, rmQcStatus:"approved", clientInspStatus:activeLot.clientInspStatus, receivedDate:today(), isOffcut:true, parentLotId:activeLot.id, parentBatchNo:activeLot.batchNo, offcutLength:mForm.offcutLength||null, offcutDimensions:dim, nestingRunId:"", allocations:[], issues:[], auditLog:[], diversionLog:[], originalOrderId:"", qcHoldReason:"" };
    const consumed = +(mForm.consumedWt||0);
    setStock(prev=>[...prev.map(s=>s.id!==activeLot.id?s:{ ...s, wtConsumed:(s.wtConsumed||0)+consumed, auditLog:[...(s.auditLog||[]),{action:"offcut-created",orderId:"",wt:offcutWt,by:user.name,date:today(),reason:`Off-cut → ${newLotNo}`}] }), newLot]);
    showToast(`Off-cut lot created: ${newLotNo}`); closeModal();
  };

  const saveWriteOff = () => {
    if (!mForm.writeOffReason?.trim()) return showToast("Reason is required","amber");
    const writeOffWt = +(mForm.writeOffWt||activeLot.wtAvailable||0);
    if (writeOffWt <= 0) return showToast("Invalid write-off weight","amber");
    if (writeOffWt > (activeLot.wtAvailable||0)) return showToast(`Cannot write off more than available weight (${fmt.num(activeLot.wtAvailable)} kg)`,"amber");
    const newAvail = (activeLot.wtAvailable||0) - writeOffWt;
    setStock(prev=>prev.map(s=>s.id!==activeLot.id?s:{
      ...s,
      wtAvailable: newAvail,
      writeOffWt: (s.writeOffWt||0)+writeOffWt,
      writeOffReason: mForm.writeOffReason.trim(),
      writeOffType: mForm.writeOffType||"other",
      status: newAvail<=0?"written_off":s.status,
      auditLog:[...(s.auditLog||[]),{action:"written_off",wt:writeOffWt,by:user.name,date:today(),reason:mForm.writeOffReason.trim()}]
    }));
    showToast(`Write-off recorded — ${fmt.num(writeOffWt)} kg${newAvail<=0?" · Lot fully written off":""}`,"green");
    closeModal();
  };

  const saveReserve = () => {
    if (!resForm.orderId || !resForm.kg) { showToast("Fill required fields","amber"); return; }
    const kg = +resForm.kg;
    if (kg<=0 || kg>resLot.wtAvailable) { showToast(`Max available: ${fmt.num(resLot.wtAvailable)} kg`,"amber"); return; }
    const ord = orders.find(o=>o.id===resForm.orderId);
    const entry = { orderId:resForm.orderId, orderRef:ord?.id||"", kg, reservedBy:user.name, reservedAt:today() };
    setStock(prev=>prev.map(s=>s.id!==resLot.id?s:{
      ...s,
      reservations:[...(s.reservations||[]),entry],
      status:(s.status==="available"||s.status==="reserved")?"reserved":s.status,
      auditLog:[...(s.auditLog||[]),{action:"reserved",orderId:resForm.orderId,wt:kg,by:user.name,date:today(),reason:""}]
    }));
    showToast("Reservation added"); setResModal(null); setResLot(null); setResForm({});
  };

  const releaseReservation = (lot, idx) => {
    const entry = (lot.reservations||[])[idx];
    if (!entry) return;
    setStock(prev=>prev.map(s=>{
      if (s.id!==lot.id) return s;
      const newRes = s.reservations.filter((_,i)=>i!==idx);
      return { ...s, reservations:newRes,
        status: newRes.length===0 ? "available" : "reserved",
        auditLog:[...(s.auditLog||[]),{action:"reservation_released",orderId:entry.orderId,wt:entry.kg,by:user.name,date:today(),reason:"Released by user"}]
      };
    }));
    showToast("Reservation released");
  };

  return (
    <div>
      {toast && <div style={{ position:"fixed",top:20,right:20,zIndex:2000,background:toast.color==="green"?T.greenBg:T.amberBg,border:`1px solid ${toast.color==="green"?T.green:T.amber}`,borderRadius:8,padding:"12px 20px",color:toast.color==="green"?T.green:T.amber,fontSize:13,fontWeight:600 }}>{toast.msg}</div>}

      {/* ── ISSUE REQUESTS section (store_admin/super_admin only) ── */}
      {(user.role==="store_admin"||user.role==="super_admin") && (issueRequests||[]).filter(r=>r.status==="pending").length > 0 && (() => {
        const pendingReqs = (issueRequests||[]).filter(r=>r.status==="pending");
        const confirmReq = (req) => {
          const yr = new Date().getFullYear();
          let maxIsn = 0;
          // Scan both issueRequests and stock lot issues for highest ISN seq
          (issueRequests||[]).forEach(r=>{ const m=(r.issueNoteNo||"").match(/^ISN-(\d{4})-(\d+)$/); if(m&&+m[1]===yr) maxIsn=Math.max(maxIsn,+m[2]); });
          stock.forEach(s=>(s.issues||[]).forEach(iss=>{ const m=(iss.issueNoteNo||"").match(/^ISN-(\d{4})-(\d+)$/); if(m&&+m[1]===yr) maxIsn=Math.max(maxIsn,+m[2]); }));
          const issueNoteNo = `ISN-${yr}-${String(maxIsn+1).padStart(3,"0")}`;
          const issueDate = today();
          const wt = req.wtRequested||0;

          // Update the stock lot
          setStock(prev=>prev.map(lot=>{
            if (lot.id!==req.lotId) return lot;
            return {
              ...lot,
              status:"issued",
              wtIssued:(lot.wtIssued||0)+wt,
              wtAvailable:Math.max(0,(lot.wtAvailable||0)-wt),
              issues:[...(lot.issues||[]),{
                issueId:issueNoteNo, issueDate, issuedTo:req.machineName,
                machineId:req.machineId||"", releaseId:req.releaseId||"",
                wt, issuedBy:user.name, issueNoteNo
              }],
              auditLog:[...(lot.auditLog||[]),{
                action:"issued", by:user.name, date:issueDate,
                reason:"Issued to machine operator via IRQ"
              }]
            };
          }));

          // Update the IRQ
          setIssueRequests(prev=>prev.map(r=>r.id!==req.id?r:{
            ...r, status:"issued", issuedBy:user.name, issueDate, issueNoteNo,
          }));

          showToast(`Issue note ${issueNoteNo} generated`,"green");
        };
        const rejectReq = (req, reason) => {
          setIssueRequests(prev=>prev.map(r=>r.id!==req.id?r:{...r,status:"rejected",remarks:reason||"Rejected by store"}));
        };
        return (
          <div style={{ ...css.card, border:`1px solid ${T.amber}55`, marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:800, color:T.amber, marginBottom:12 }}>📋 ISSUE REQUESTS FROM MACHINE OPERATORS — {pendingReqs.length} PENDING</div>
            {pendingReqs.map(req=>{
              const lot = stock.find(s=>s.id===req.lotId)||{};
              return (
                <div key={req.id} style={{ padding:"10px 12px", background:T.bgInput, borderRadius:6, marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <div style={{ fontFamily:T.fontMono, fontSize:12, fontWeight:700, color:T.accentHi }}>{req.id}</div>
                      <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>
                        Machine: {req.machineName} · Material: {req.matCode} · Lot: {req.lotNo||req.lotId}
                      </div>
                      <div style={{ fontSize:11, color:T.textMid }}>
                        Bay: {lot.bayId||"—"} · {(req.wtRequested||0).toFixed(1)} kg · Requested by {req.requestedByName} on {req.requestDate}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={()=>confirmReq(req)} style={{ ...css.btn.green, fontSize:11, padding:"4px 10px" }}>✓ Confirm Issue</button>
                      <button onClick={()=>rejectReq(req,"")} style={{ ...css.btn.ghost, color:T.red, fontSize:11, padding:"4px 10px" }}>✕ Reject</button>
                    </div>
                  </div>
                  {req.issueNoteNo && <div style={{ fontSize:11, color:T.green, marginTop:4 }}>Issue Note: {req.issueNoteNo}</div>}
                </div>
              );
            })}
          </div>
        );
      })()}

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
        {[["all","All"],["available","Available"],["reserved","Reserved"],["allocated","Allocated"],["issued","Issued"],["consumed","Consumed"],["qc_hold","QC Hold"],["written_off","Written Off"],["offcuts","Off-cuts"]].map(([f,lbl])=>(
          <button key={f} onClick={()=>setFilter(f)} style={{ ...css.btn.secondary,...(filter===f?{background:`${T.accent}22`,color:T.accent,borderColor:T.accent}:{}) }}>
            {lbl} ({f==="all"?stock.length:f==="offcuts"?stock.filter(s=>s.isOffcut).length:f==="reserved"?stock.filter(s=>(s.reservations||[]).length>0).length:stock.filter(s=>s.status===f).length})
          </button>
        ))}
      </div>

      {/* Off-cuts Pending Verification */}
      {(user.role==="store_admin"||user.role==="super_admin"||user.role==="planning_admin") && (() => {
        const pendingOc = stock.filter(s=>s.status==="pending_offcut_verification");
        if (pendingOc.length===0) return null;
        return (
          <div style={{ ...css.card, border:`1px solid ${T.amber}55`, marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:800, color:T.amber, marginBottom:12 }}>
              ⚠ OFF-CUTS PENDING VERIFICATION — {pendingOc.length} lot{pendingOc.length!==1?"s":""}
            </div>
            {pendingOc.map(lot=>(
              <div key={lot.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderTop:`1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontFamily:T.fontMono, fontSize:12, fontWeight:700, color:T.accentHi }}>{lot.lotNo}</div>
                  <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>
                    {lot.matCode||lot.sectionType} · {lot.wtReceived} kg
                    {lot.offcutLength?` · ${lot.offcutLength}mm`:""}{lot.offcutDimensions?` · ${lot.offcutDimensions}`:""}
                    {" · "}From nesting run: {lot.nestingRunId||"—"}
                  </div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={()=>{
                    setStock(prev=>prev.map(s=>s.id!==lot.id?s:{
                      ...s, status:"available",
                      reservations:[...(s.reservations||[])],
                      auditLog:[...(s.auditLog||[]),{action:"offcut-verified",wt:lot.wtReceived,by:user.name,date:today(),reason:"Off-cut verified and accepted"}]
                    }));
                    showToast("Off-cut verified and accepted","green");
                  }} style={{ ...css.btn.primary, fontSize:11 }}>✓ Verify & Accept</button>
                  <button onClick={()=>{
                    const reason = prompt("Rejection reason:");
                    if (!reason) return;
                    setStock(prev=>prev.map(s=>s.id!==lot.id?s:{
                      ...s, status:"written_off",
                      qcHoldReason:`Off-cut rejected: ${reason}`,
                      auditLog:[...(s.auditLog||[]),{action:"offcut-rejected",wt:lot.wtReceived,by:user.name,date:today(),reason}]
                    }));
                    showToast("Off-cut rejected","amber");
                  }} style={{ ...css.btn.secondary, fontSize:11, color:T.red, borderColor:T.redLo }}>✕ Reject</button>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

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
                <TD mono>{s.matCode||`${(s.sectionType||s.section)||""}/${s.size||""}`}</TD>
                <TD>{s.sectionType||s.section} {s.size}</TD>
                <TD><Badge color="gray">{s.grade}</Badge></TD>
                <TD>{s.vendorName}</TD>
                <TD><Badge color="teal">{s.bayId}</Badge></TD>
                <TD right mono>{fmt.num(s.wtReceived)}</TD>
                <TD right mono bold color={T.green}>{fmt.num(s.wtAvailable)}</TD>
                <TD right mono color={T.accent}>{fmt.num(s.wtAllocated)}</TD>
                <TD right mono color="#A78BFA">{fmt.num(s.wtIssued||0)}</TD>
                <TD onClick={e=>e.stopPropagation()}>
                  {s.mtcUploaded
                    ? <a href={s.mtcDoc} target="_blank" rel="noreferrer" style={{ fontSize:10,color:T.green,fontWeight:700 }}>MTC ✓</a>
                    : <div>
                        <span style={{ fontSize:10,color:T.red,fontWeight:700 }}>⚠ Missing</span>
                        {mtcUploadId!==s.id
                          ? <button onClick={()=>{setMtcUploadId(s.id);setMtcForm({});}} style={{ ...css.btn.sm,fontSize:9,marginLeft:4,padding:"1px 6px",background:T.amberBg,color:T.amber,border:`1px solid ${T.amber}` }}>Upload</button>
                          : <div style={{ marginTop:4, display:"flex", flexDirection:"column", gap:4, minWidth:180 }}>
                              <input value={mtcForm.link||""} onChange={e=>setMtcForm(f=>({...f,link:e.target.value}))}
                                placeholder="Drive link..." style={{ ...css.input,fontSize:10,padding:"3px 6px" }} />
                              <input value={mtcForm.heatNo||""} onChange={e=>setMtcForm(f=>({...f,heatNo:e.target.value}))}
                                placeholder="Heat number..." style={{ ...css.input,fontSize:10,padding:"3px 6px" }} />
                              <div style={{ display:"flex",gap:4 }}>
                                <button disabled={!(mtcForm.link||"").trim()} onClick={()=>{
                                  if (!(mtcForm.link||"").trim()) return;
                                  setStock(prev=>prev.map(l=>l.id!==s.id?l:{...l,mtcDoc:mtcForm.link.trim(),heatNo:mtcForm.heatNo||l.heatNo,mtcUploaded:true}));
                                  setMtcUploadId(null); setMtcForm({});
                                  showToast("MTC uploaded","green");
                                }} style={{ ...css.btn.sm,fontSize:9,padding:"2px 8px",opacity:(mtcForm.link||"").trim()?1:0.4 }}>Save</button>
                                <button onClick={()=>setMtcUploadId(null)} style={{ ...css.btn.sm,fontSize:9,padding:"2px 8px",background:"transparent",color:T.textMid,border:`1px solid ${T.border}` }}>✕</button>
                              </div>
                            </div>
                        }
                      </div>
                  }
                </TD>
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
                    {canRelease && s.status!=="consumed" && s.status!=="written_off" && s.status!=="issued" && (
                      <button onClick={e=>{e.stopPropagation();setResLot(s);setResForm({});setResModal("add");}} style={{ ...css.btn.sm, background:T.amberBg, color:T.amber, border:`1px solid ${T.amber}`, fontSize:10 }}>Reserve</button>
                    )}
                    {user.role==="super_admin"&&(s.status==="available"||s.status==="qc_hold")&&(s.wtAllocated||0)===0&&(
                      <button onClick={e=>{e.stopPropagation();openModal("writeoff",s);}} style={{ ...css.btn.sm,background:T.redBg,color:T.red,border:`1px solid ${T.redLo}`,fontSize:10 }}>Write Off</button>
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
                    {/* Reservations */}
                    {(s.reservations||[]).length>0&&(
                      <div style={{ marginTop:8, padding:"8px 12px", background:T.amberBg+"44", borderRadius:6 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:T.amber, marginBottom:6 }}>RESERVATIONS</div>
                        {(s.reservations||[]).map((r,ri)=>(
                          <div key={ri} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"3px 0", borderBottom:`1px solid ${T.border}` }}>
                            <span style={{ fontSize:11, color:T.text }}>{r.orderRef} — {fmt.num(r.kg)} kg — by {r.reservedBy} on {r.reservedAt}</span>
                            {(user.role==="super_admin"||user.role==="planning_admin") && (
                              <button onClick={()=>releaseReservation(s,ri)} style={{ ...css.btn.sm, fontSize:9, color:T.red, padding:"1px 6px" }}>Release</button>
                            )}
                          </div>
                        ))}
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
              {[["Mat Code",activeLot.matCode||`${(activeLot.sectionType||activeLot.section)} ${activeLot.size}`],["Grade",activeLot.grade],["Available",`${fmt.num(activeLot.wtAvailable)} kg`]].map(([k,v])=>(
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
            {(()=>{
              const wt=parseFloat(mForm.wt)||0;
              if(!wt||!activeLot) return null;
              const perUnit=(activeLot.qtyReceived||0)>0?(activeLot.actualWt||activeLot.wtReceived||0)/(activeLot.qtyReceived||1):0;
              if(!perUnit) return null;
              const approxUnits=wt/perUnit;
              const rounded=Math.ceil(approxUnits*2)/2;
              const isPlate=(activeLot.sectionType||activeLot.section)==="PLATE";
              const dimStr=activeLot.length&&activeLot.width?`${activeLot.length}×${activeLot.width}×${activeLot.size||""}`:activeLot.size||"";
              return <div style={{fontSize:11,color:T.textMid,marginTop:4}}>≈ <strong style={{color:T.accent}}>{rounded}</strong> {isPlate?"sheet(s)":"bar(s)"}{dimStr?` of ${dimStr}`:""} ({fmt.num(Math.round(perUnit))} kg/unit)</div>;
            })()}
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
          <Field label={(activeLot.sectionType||activeLot.section)==="PLATE"?"Off-cut Dimensions (LxW mm)":"Off-cut Length (mm)"}>
            {(activeLot.sectionType||activeLot.section)==="PLATE"
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
      {modal==="writeoff"&&activeLot&&(
        <Modal title={`Write Off Lot — ${activeLot.lotNo}`} onClose={closeModal} width={480}>
          <InfoBanner color="red">Write-off permanently reduces available weight. This action is irreversible. Only use for damaged, lost, or expired material.</InfoBanner>
          <div style={{ ...css.card, background:T.bg, marginBottom:14, marginTop:12 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, fontSize:12 }}>
              {[["Lot No",activeLot.lotNo],["Material",`${activeLot.matType} ${activeLot.grade}`],["Size",activeLot.size],["Available",`${fmt.num(activeLot.wtAvailable)} kg`]].map(([k,v])=>(
                <div key={k}><div style={css.label}>{k}</div><div style={{ color:T.text, fontFamily:T.fontMono }}>{v}</div></div>
              ))}
            </div>
          </div>
          <Field label="Write-Off Type" required>
            <Sel value={mForm.writeOffType||"other"} onChange={e=>setMForm(f=>({...f,writeOffType:e.target.value}))}>
              {[["damaged","Damaged / Defective"],["lost","Lost / Misplaced"],["expired","Expired / Corroded"],["other","Other"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </Sel>
          </Field>
          <Field label="Weight to Write Off (kg)" required>
            <Input type="number" value={mForm.writeOffWt||""} onChange={e=>setMForm(f=>({...f,writeOffWt:e.target.value}))}
              placeholder={`Max ${fmt.num(activeLot.wtAvailable)} kg`} min={0.1} max={activeLot.wtAvailable} step={0.1} />
          </Field>
          <Field label="Reason *" required>
            <Textarea value={mForm.writeOffReason||""} onChange={e=>setMForm(f=>({...f,writeOffReason:e.target.value}))}
              placeholder="Describe the reason for write-off..." />
          </Field>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:14 }}>
            <button onClick={closeModal} style={css.btn.secondary}>Cancel</button>
            <button disabled={!mForm.writeOffReason?.trim()||(+(mForm.writeOffWt||0))<=0}
              onClick={saveWriteOff}
              style={{ ...css.btn.primary, background:T.red, borderColor:T.red, opacity:(mForm.writeOffReason?.trim()&&+(mForm.writeOffWt||0)>0)?1:0.4 }}>
              Confirm Write-Off
            </button>
          </div>
        </Modal>
      )}

      {resModal==="add" && resLot && (
        <Modal title={`Reserve Stock — ${resLot.lotNo}`} onClose={()=>{setResModal(null);setResLot(null);setResForm({});}}>
          <div style={{ fontSize:12, color:T.textMid, marginBottom:12 }}>Available: <strong style={{color:T.green}}>{fmt.num(resLot.wtAvailable)} kg</strong></div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ gridColumn:"span 2" }}>
              <label style={css.label}>Order *</label>
              <select value={resForm.orderId||""} onChange={e=>setResForm({...resForm,orderId:e.target.value})} style={css.input}>
                <option value="">Select order...</option>
                {(orders||[]).filter(o=>o.status==="active").map(o=><option key={o.id} value={o.id}>{o.id} — {o.projectDesc?.slice(0,40)}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:"span 2" }}>
              <label style={css.label}>Reserve Quantity (kg) *</label>
              <input type="number" value={resForm.kg||""} onChange={e=>setResForm({...resForm,kg:e.target.value})} min={1} max={resLot.wtAvailable} style={css.input} placeholder={`Max: ${fmt.num(resLot.wtAvailable)} kg`} />
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:16 }}>
            <button onClick={()=>{setResModal(null);setResLot(null);setResForm({});}} style={css.btn.secondary}>Cancel</button>
            <button onClick={saveReserve} style={css.btn.primary}>Save Reservation</button>
          </div>
        </Modal>
      )}

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
        <div style={{ fontSize:22, fontWeight:800, color:T.text }}>Welcome back, {(user.name||"").split(" ")[0]} 👋</div>
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
          {clientPend.map(s=>` ${s.lotNo} (${(s.sectionType||s.section)} ${s.size})`).join(",")}
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
                <span style={{ fontSize:11, color:T.textMid, marginLeft:8 }}>{(po.vendorName||"").split(" ").slice(0,2).join(" ")}</span>
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
                <span style={{ fontFamily:T.fontMono, fontSize:11, color:T.text }}>{(s.sectionType||s.section)} {s.size}</span>
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
      { id:"D001", drawingNo:"TPL-JETTY-COL-01", title:"Main Column Type A", qty:4,  unitWt:857.78,totalWt:3431.12,revNo:"B",drawingDate:"2025-01-05",receivedDate:"2025-01-12",phase:1,priority:1,driveLink:"https://drive.google.com/file/d/dwg001/view",fileType:"PDF",status:"active",revHistory:[{rev:"A",date:"2024-12-20",note:"Initial issue"},{rev:"B",date:"2025-01-05",note:"Column dimensions revised"}],assemblyGroup:"ASM-001" },
      { id:"D002", drawingNo:"TPL-JETTY-BM-01",  title:"Main Beam Type B",   qty:6,  unitWt:420.50,totalWt:2523.00,revNo:"A",drawingDate:"2025-01-05",receivedDate:"2025-01-12",phase:1,priority:2,driveLink:"https://drive.google.com/file/d/dwg002/view",fileType:"PDF",status:"active",revHistory:[{rev:"A",date:"2025-01-05",note:"Initial issue"}],assemblyGroup:"ASM-001" },
      { id:"D003", drawingNo:"TPL-JETTY-BP-01",  title:"Base Plate Assembly", qty:8,  unitWt:215.30,totalWt:1722.40,revNo:"A",drawingDate:"2025-01-05",receivedDate:"2025-01-12",phase:1,priority:2,driveLink:"https://drive.google.com/file/d/dwg003/view",fileType:"PDF",status:"active",revHistory:[{rev:"A",date:"2025-01-05",note:"Initial issue"}],assemblyGroup:"ASM-002" },
      { id:"D004", drawingNo:"TPL-JETTY-BRK-01", title:"Bracings H&D",       qty:12, unitWt:145.60,totalWt:1747.20,revNo:"A",drawingDate:"2025-01-08",receivedDate:"2025-01-15",phase:2,priority:1,driveLink:"https://drive.google.com/file/d/dwg004/view",fileType:"PDF",status:"active",revHistory:[{rev:"A",date:"2025-01-08",note:"Initial issue"}],assemblyGroup:"ASM-002" },
      { id:"D005", drawingNo:"TPL-JETTY-PL-01",  title:"Platform Level 1",   qty:2,  unitWt:980.00,totalWt:1960.00,revNo:"A",drawingDate:"2025-01-08",receivedDate:"",           phase:2,priority:2,driveLink:"",fileType:"",status:"pending",revHistory:[],assemblyGroup:"" },
      { id:"D006", drawingNo:"TPL-JETTY-PL-02",  title:"Platform Level 2",   qty:2,  unitWt:920.00,totalWt:1840.00,revNo:"A",drawingDate:"2025-01-08",receivedDate:"",           phase:3,priority:1,driveLink:"",fileType:"",status:"pending",revHistory:[],assemblyGroup:"" },
    ],
    parts:[
      { id:"P001",drawingId:"D001",revNo:"B",itemNo:1, markNo:"SBK-101",desc:"BRACKET ANGLE",          fabType:"Fabricate", matType:"MS",grade:"E250",section:"ISA",    size:"75x75x8",   matCode:"ISA/MS/E250/75x75x8",    length:150, width:75, qtyPerDrg:80,clientUnitWt:1.335, clientTotalWt:106.8,  calcUnitWt:1.335, calcTotalWt:106.8,  jointsAllowed:false,source:"Procure",      partLink:"",remarks:"" },
      { id:"P002",drawingId:"D001",revNo:"B",itemNo:2, markNo:"SBK-103",desc:"HEAVY BRACKET",          fabType:"Fabricate", matType:"MS",grade:"E250",section:"ISA",    size:"150x150x16",matCode:"ISA/MS/E250/150x150x16", length:270, width:150,qtyPerDrg:5, clientUnitWt:9.666, clientTotalWt:48.33,  calcUnitWt:9.666, calcTotalWt:48.33,  jointsAllowed:false,source:"Procure",      partLink:"",remarks:"" },
      { id:"P003",drawingId:"D001",revNo:"B",itemNo:3, markNo:"PL-001", desc:"BASE PLATE 10MM",        fabType:"Fabricate", matType:"MS",grade:"E250",section:"PLATE",  size:"10mm",      matCode:"PLATE/MS/E250/10mm",      length:500, width:500,qtyPerDrg:4, clientUnitWt:19.625,clientTotalWt:78.5,   calcUnitWt:19.625,calcTotalWt:78.5,   jointsAllowed:true, source:"Procure",      partLink:"",remarks:"" },
      { id:"P004",drawingId:"D001",revNo:"B",itemNo:4, markNo:"BOLT-M24",desc:"M24 HDG BOLTS",         fabType:"Bought Out",matType:"MS",grade:"Galv",section:"—",      size:"M24x100",                                     length:100, width:0,  qtyPerDrg:32,clientUnitWt:0.51,  clientTotalWt:16.32,  calcUnitWt:0.51,  calcTotalWt:16.32,  jointsAllowed:false,source:"Procure",      partLink:"",remarks:"Galvanised hot dip" },
      { id:"P005",drawingId:"D002",revNo:"A",itemNo:1, markNo:"WB-201", desc:"WIDE FLANGE BEAM",       fabType:"Fabricate", matType:"MS",grade:"E250",section:"ISMB",   size:"300",       matCode:"ISMB/MS/E250/300",        length:6200,width:0,  qtyPerDrg:2, clientUnitWt:285.82,clientTotalWt:571.64, calcUnitWt:285.82,calcTotalWt:571.64, jointsAllowed:false,source:"Procure",      partLink:"",remarks:"" },
      { id:"P006",drawingId:"D002",revNo:"A",itemNo:2, markNo:"CH-202", desc:"CHANNEL PURLIN",         fabType:"Fabricate", matType:"MS",grade:"E250",section:"ISMC",   size:"150",       matCode:"ISMC/MS/E250/150",        length:2500,width:0,  qtyPerDrg:8, clientUnitWt:41.0,  clientTotalWt:328.0,  calcUnitWt:41.0,  calcTotalWt:328.0,  jointsAllowed:false,source:"Client Supply", partLink:"",remarks:"Client supplied SAIL material" },
      { id:"P007",drawingId:"D002",revNo:"A",itemNo:3, markNo:"FB-203", desc:"FLAT BAR STIFFENER",     fabType:"Fabricate", matType:"MS",grade:"E250",section:"Flat Bar",size:"75x10",     matCode:"Flat Bar/MS/E250/75x10",  length:150, width:75, qtyPerDrg:50,clientUnitWt:0.883, clientTotalWt:44.15,  calcUnitWt:0.883, calcTotalWt:44.15,  jointsAllowed:true, source:"Procure",      partLink:"",remarks:"" },
      { id:"P008",drawingId:"D003",revNo:"A",itemNo:1, markNo:"BP-301", desc:"BASE PLATE 12MM",        fabType:"Fabricate", matType:"MS",grade:"E250",section:"PLATE",  size:"12mm",      matCode:"PLATE/MS/E250/12mm",      length:600, width:600,qtyPerDrg:1, clientUnitWt:33.912,clientTotalWt:33.912, calcUnitWt:33.912,calcTotalWt:33.912, jointsAllowed:false,source:"Procure",      partLink:"",remarks:"" },
      { id:"P009",drawingId:"D003",revNo:"A",itemNo:2, markNo:"SBK-302",desc:"ANCHOR BOLTS",           fabType:"Bought Out",matType:"MS",grade:"Galv",section:"—",      size:"M30x600",                                     length:600, width:0,  qtyPerDrg:4, clientUnitWt:3.37,  clientTotalWt:13.48,  calcUnitWt:3.37,  calcTotalWt:13.48,  jointsAllowed:false,source:"Procure",      partLink:"",remarks:"With nuts and washers" },
      { id:"P010",drawingId:"D004",revNo:"A",itemNo:1, markNo:"BRC-401",desc:"DIAGONAL BRACING",       fabType:"Fabricate", matType:"MS",grade:"E250",section:"ISA",    size:"100x100x10",matCode:"ISA/MS/E250/100x100x10",  length:2400,width:0,  qtyPerDrg:4, clientUnitWt:35.76, clientTotalWt:143.04, calcUnitWt:35.76, calcTotalWt:143.04, jointsAllowed:false,source:"Procure",      partLink:"",remarks:"" },
      { id:"P011",drawingId:"D004",revNo:"A",itemNo:2, markNo:"GP-402", desc:"GUSSET PLATE 8MM",       fabType:"Fabricate", matType:"MS",grade:"E250",section:"PLATE",  size:"8mm",       matCode:"PLATE/MS/E250/8mm",       length:300, width:250,qtyPerDrg:8, clientUnitWt:4.712, clientTotalWt:37.696, calcUnitWt:4.712, calcTotalWt:37.696, jointsAllowed:false,source:"Procure",      partLink:"",remarks:"" },
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
    assemblyInspectionRequired:true,
    assemblies:[
      { id:"ASM-001", assemblyNumber:"ASM-001", assemblyName:"Jetty Column Assembly", drawingsAssigned:["D001","D002"], tpiRequired:false, clientContact:"", expectedInspectionDate:"", notes:"" },
      { id:"ASM-002", assemblyNumber:"ASM-002", assemblyName:"Base Frame Assembly", drawingsAssigned:["D003","D004"], tpiRequired:false, clientContact:"", expectedInspectionDate:"", notes:"" },
    ],
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
      { id:"D101", drawingNo:"BHEL-ESS-FR-01",  title:"Equipment Support Frame",   qty:2, unitWt:980.0, totalWt:1960.0, revNo:"A",drawingDate:"2025-01-22",receivedDate:"2025-01-28",phase:1,priority:1,driveLink:"https://drive.google.com/file/d/d101/view",fileType:"PDF",status:"active",revHistory:[{rev:"A",date:"2025-01-22",note:"Initial issue"}],assemblyGroup:"" },
      { id:"D102", drawingNo:"BHEL-ESS-PED-01", title:"Equipment Pedestal",        qty:4, unitWt:145.0, totalWt:580.0,  revNo:"A",drawingDate:"2025-01-22",receivedDate:"2025-01-28",phase:1,priority:2,driveLink:"https://drive.google.com/file/d/d102/view",fileType:"PDF",status:"active",revHistory:[{rev:"A",date:"2025-01-22",note:"Initial issue"}],assemblyGroup:"" },
      { id:"D103", drawingNo:"BHEL-ESS-ACC-01", title:"Access Platform & Handrail",qty:1, unitWt:360.0, totalWt:360.0,  revNo:"A",drawingDate:"2025-01-22",receivedDate:"",           phase:1,priority:3,driveLink:"",fileType:"",status:"pending",revHistory:[],assemblyGroup:"" },
    ],
    parts:[
      { id:"P101",drawingId:"D101",revNo:"A",itemNo:1,markNo:"FR-101",desc:"MAIN COLUMN RHS",    fabType:"Fabricate",matType:"MS",grade:"E250",section:"RHS",  size:"100x50x4",matCode:"RHS/MS/E250/100x50x4", length:3500,width:0,qtyPerDrg:4,clientUnitWt:32.27, clientTotalWt:129.08, calcUnitWt:32.27, calcTotalWt:129.08, jointsAllowed:false,source:"Procure",partLink:"",remarks:"" },
      { id:"P102",drawingId:"D101",revNo:"A",itemNo:2,markNo:"FR-102",desc:"HORIZONTAL ISMB",    fabType:"Fabricate",matType:"MS",grade:"E250",section:"ISMB", size:"200",     matCode:"ISMB/MS/E250/200",     length:2000,width:0,qtyPerDrg:3,clientUnitWt:50.8,  clientTotalWt:152.4,  calcUnitWt:50.8,  calcTotalWt:152.4,  jointsAllowed:false,source:"Procure",partLink:"",remarks:"" },
      { id:"P103",drawingId:"D101",revNo:"A",itemNo:3,markNo:"PL-103",desc:"MOUNTING PLATE 16MM",fabType:"Fabricate",matType:"MS",grade:"E350",section:"PLATE",size:"16mm",    matCode:"PLATE/MS/E350/16mm",   length:400, width:400,qtyPerDrg:2,clientUnitWt:20.096,clientTotalWt:40.192, calcUnitWt:20.096,calcTotalWt:40.192, jointsAllowed:false,source:"Procure",partLink:"",remarks:"" },
      { id:"P104",drawingId:"D102",revNo:"A",itemNo:1,markNo:"PED-201",desc:"PEDESTAL ISMC",     fabType:"Fabricate",matType:"MS",grade:"E250",section:"ISMC", size:"200",     matCode:"ISMC/MS/E250/200",     length:800, width:0,qtyPerDrg:2,clientUnitWt:17.68, clientTotalWt:35.36,  calcUnitWt:17.68, calcTotalWt:35.36,  jointsAllowed:false,source:"Procure",partLink:"",remarks:"" },
      { id:"P105",drawingId:"D102",revNo:"A",itemNo:2,markNo:"BP-202", desc:"BASE PLATE 12MM",   fabType:"Fabricate",matType:"MS",grade:"E250",section:"PLATE",size:"12mm",    matCode:"PLATE/MS/E250/12mm",   length:300, width:300,qtyPerDrg:1,clientUnitWt:8.478, clientTotalWt:8.478,  calcUnitWt:8.478, calcTotalWt:8.478,  jointsAllowed:false,source:"Procure",partLink:"",remarks:"" },
    ],
    quality:{ tpiRequired:false,tpiAgencyId:"",tpiAgencyName:"",tpiHoldPoints:[],wpsDoc:"",
      approvedMakes:[{id:"QAM-101",matType:"MS Plates",makes:"JSW Steel, SAIL, Tata Steel",remarks:""},{id:"QAM-102",matType:"RHS/SHS",makes:"APL Apollo, Tata Structura",remarks:""}],
      paintCoats:[{coatNo:1,type:"Primer",dft:50,make:"Berger Paints",product:"Berger Rustop",dryTime:6,remarks:""},{coatNo:2,type:"Finish",dft:50,make:"Berger Paints",product:"Berger Syntex HB",dryTime:8,remarks:""}],
      weldSpec:{process:"SMAW",electrodeType:"E7018",grade:"E7018",make:"ESAB",remarks:""},
      dispatchSpec:{packingType:"Shrink wrap only",remarks:""},
      mdccDocs:[{id:"MDCC-D-101",docName:"Mill Test Certificates",mandatory:true},{id:"MDCC-D-102",docName:"Dimensional Check Report",mandatory:true},{id:"MDCC-D-103",docName:"Paint DFT Report",mandatory:true},{id:"MDCC-D-104",docName:"Packing List",mandatory:false}],
    },
    amendments:[], invoices:[], createdBy:"Vikram Singh", createdAt:"2025-01-30",
    assemblyInspectionRequired:false, assemblies:[],
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
        <div style={{ gridColumn:"span 2", display:"flex", alignItems:"center", gap:10, padding:"8px 0" }}>
          <input type="checkbox" id="asmInspChk" checked={!!order.assemblyInspectionRequired} onChange={e=>onChange({...order,assemblyInspectionRequired:e.target.checked})} disabled={!canEdit} style={{ width:16, height:16, accentColor:T.accent }} />
          <label htmlFor="asmInspChk" style={{ fontSize:13, color:T.text, cursor:"pointer" }}>Assembly Inspection Required <span style={{fontSize:11,color:T.textMid}}>(enables Assemblies tab)</span></label>
        </div>
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
const TabTransport = ({ order, onChange, canEdit }) => {
  const [form, setForm] = React.useState(order.transport||{transportScope:'per_dispatch',preferredTransporter:'',vehicleType:'',distanceKm:0,freightEstimate:0,insurance:false,odc:false,nightRestriction:false,policeEscort:false,specialReqs:'',freightBilling:'dispatch_line',clientTransporter:'',clientVehicleContact:'',loadingInstructions:''});
  const [dirty, setDirty] = React.useState(false);
  const upd = (field, val) => { setForm(f=>({...f,[field]:val})); setDirty(true); };
  const save = () => { onChange({...order, transport:form}); setDirty(false); };
  const discard = () => { setForm(order.transport||{}); setDirty(false); };
  const scope = form.transportScope||'per_dispatch';
  const weArrange = scope==='we_separate'||scope==='we_included';
  return (
    <div>
      {/* Section 1 */}
      <div style={{...css.card, marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:10}}>Transport Scope</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {[['client','Client arranges transport to site'],['we_separate','We arrange — billed separately'],['we_included','We arrange — included in order value'],['per_dispatch','Per dispatch — decided at time of dispatch']].map(([v,l])=>(
            <label key={v} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
              <input type="radio" checked={scope===v} onChange={()=>upd('transportScope',v)} disabled={!canEdit} />
              <span style={{fontSize:13,color:T.text}}>{l}</span>
            </label>
          ))}
        </div>
      </div>
      {/* Section 2 — Our Transport Details */}
      {weArrange&&<div style={{...css.card,marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:10}}>Our Transport Details</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <MField label="Preferred Transporter"><input value={form.preferredTransporter||''} onChange={e=>upd('preferredTransporter',e.target.value)} disabled={!canEdit} style={css.input} /></MField>
          <MField label="Vehicle Type"><select value={form.vehicleType||''} onChange={e=>upd('vehicleType',e.target.value)} disabled={!canEdit} style={css.input}><option value=''>Select...</option><option>Open flatbed</option><option>Crane-assisted</option><option>Closed body</option><option>Low-bed trailer</option><option>Own vehicle</option></select></MField>
          <MField label="Approx Distance (km)"><input type="number" value={form.distanceKm||''} onChange={e=>upd('distanceKm',+e.target.value)} disabled={!canEdit} style={css.input} /></MField>
          <MField label="Freight Estimate per Trip (₹)"><input type="number" value={form.freightEstimate||''} onChange={e=>upd('freightEstimate',+e.target.value)} disabled={!canEdit} style={css.input} /></MField>
          <MField label="Insurance"><select value={form.insurance?'yes':'no'} onChange={e=>upd('insurance',e.target.value==='yes')} disabled={!canEdit} style={css.input}><option value='no'>No</option><option value='yes'>Yes</option></select></MField>
          <MField label="ODC (Over-Dimensional Cargo)"><select value={form.odc?'yes':'no'} onChange={e=>upd('odc',e.target.value==='yes')} disabled={!canEdit} style={css.input}><option value='no'>No</option><option value='yes'>Yes</option></select></MField>
          {form.odc&&<div style={{gridColumn:'span 2'}}><MField label="ODC Notes"><input value={form.odcNote||''} onChange={e=>upd('odcNote',e.target.value)} disabled={!canEdit} style={css.input} /></MField></div>}
          <MField label="Night Movement Restriction"><select value={form.nightRestriction?'yes':'no'} onChange={e=>upd('nightRestriction',e.target.value==='yes')} disabled={!canEdit} style={css.input}><option value='no'>No</option><option value='yes'>Yes</option></select></MField>
          <MField label="Police Escort Required"><select value={form.policeEscort?'yes':'no'} onChange={e=>upd('policeEscort',e.target.value==='yes')} disabled={!canEdit} style={css.input}><option value='no'>No</option><option value='yes'>Yes</option></select></MField>
          <div style={{gridColumn:'span 2'}}><MField label="Special Requirements"><textarea value={form.specialReqs||''} onChange={e=>upd('specialReqs',e.target.value)} disabled={!canEdit} rows={2} style={{...css.input,width:'100%',resize:'vertical',fontFamily:T.font}} /></MField></div>
        </div>
      </div>}
      {/* Section 3 — Freight Billing */}
      {scope==='we_separate'&&<div style={{...css.card,marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:10}}>Freight Billing</div>
        <div style={{display:'flex',gap:16}}>
          {[['dispatch_line','Add as line item on dispatch invoice'],['separate_invoice','Raise separate freight invoice']].map(([v,l])=>(
            <label key={v} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
              <input type="radio" checked={(form.freightBilling||'dispatch_line')===v} onChange={()=>upd('freightBilling',v)} disabled={!canEdit} />
              <span style={{fontSize:13,color:T.text}}>{l}</span>
            </label>
          ))}
        </div>
      </div>}
      {/* Section 4 — Client Arranges */}
      {scope==='client'&&<div style={{...css.card,marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:10}}>Client Transporter Details</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <MField label="Transporter Name"><input value={form.clientTransporter||''} onChange={e=>upd('clientTransporter',e.target.value)} disabled={!canEdit} style={css.input} /></MField>
          <MField label="Vehicle Contact"><input value={form.clientVehicleContact||''} onChange={e=>upd('clientVehicleContact',e.target.value)} disabled={!canEdit} style={css.input} /></MField>
          <div style={{gridColumn:'span 2'}}><MField label="Loading Instructions"><textarea value={form.loadingInstructions||''} onChange={e=>upd('loadingInstructions',e.target.value)} disabled={!canEdit} rows={3} style={{...css.input,width:'100%',resize:'vertical',fontFamily:T.font}} /></MField></div>
        </div>
      </div>}
      {dirty&&canEdit&&<div style={{display:'flex',gap:8}}><button onClick={save} style={css.btn.primary}>✓ Save Transport</button><button onClick={discard} style={css.btn.secondary}>Discard</button></div>}
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
const TabAssemblies = ({ order, onChange, canEdit }) => {
  const assemblies = order.assemblies||[];
  const drawings = order.drawings||[];
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const openAdd = () => { setForm({ id:`ASM-${Date.now()}`, assemblyNumber:"", assemblyName:"", drawingsAssigned:[], tpiRequired:false, clientContact:"", expectedInspectionDate:"", notes:"" }); setModal("add"); };
  const openEdit = (a) => { setForm({...a}); setModal("edit"); };
  const saveAsm = () => {
    const updated = modal==="add" ? [...assemblies,form] : assemblies.map(a=>a.id===form.id?form:a);
    // Sync drawing.assemblyGroup for all drawings
    const newDrawings = drawings.map(d => {
      const inAsm = updated.find(a=>a.drawingsAssigned.includes(d.id));
      return { ...d, assemblyGroup: inAsm ? inAsm.id : "" };
    });
    onChange({...order, assemblies:updated, drawings:newDrawings});
    setModal(null);
  };
  const deleteAsm = (id) => {
    const updated = assemblies.filter(a=>a.id!==id);
    const newDrawings = drawings.map(d => d.assemblyGroup===id ? {...d,assemblyGroup:""} : d);
    onChange({...order, assemblies:updated, drawings:newDrawings});
  };
  const toggleDrawing = (drgId) => {
    const cur = form.drawingsAssigned||[];
    setForm({...form, drawingsAssigned: cur.includes(drgId) ? cur.filter(x=>x!==drgId) : [...cur,drgId]});
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.text }}>Assembly Groups</div>
        {canEdit && <button onClick={openAdd} style={css.btn.primary}>+ Add Assembly</button>}
      </div>
      {assemblies.length===0 && (
        <div style={{ ...css.card, textAlign:"center", color:T.textLow, padding:32 }}>No assembly groups defined. Add one to start grouping drawings.</div>
      )}
      {assemblies.map(a => {
        const asmDrawings = drawings.filter(d=>a.drawingsAssigned.includes(d.id));
        return (
          <div key={a.id} style={{ ...css.card, marginBottom:12, border:`1px solid ${T.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{a.assemblyNumber} — {a.assemblyName}</div>
                <div style={{ fontSize:11, color:T.textMid, marginTop:4 }}>
                  {asmDrawings.length} drawing{asmDrawings.length!==1?"s":""}: {asmDrawings.map(d=>d.drawingNo).join(", ")||"None assigned"}
                </div>
                {a.tpiRequired && <Badge color="amber" style={{marginTop:4}}>TPI Required</Badge>}
                {a.expectedInspectionDate && <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>Expected inspection: {a.expectedInspectionDate}</div>}
                {a.notes && <div style={{ fontSize:11, color:T.textLow, marginTop:2 }}>{a.notes}</div>}
              </div>
              {canEdit && (
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={()=>openEdit(a)} style={css.btn.sm}>Edit</button>
                  <button onClick={()=>deleteAsm(a.id)} style={{ ...css.btn.sm, color:T.red }}>Delete</button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {modal && (
        <Modal title={modal==="add"?"Add Assembly Group":"Edit Assembly Group"} onClose={()=>setModal(null)}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div><label style={css.label}>Assembly Number *</label><input value={form.assemblyNumber||""} onChange={e=>setForm({...form,assemblyNumber:e.target.value})} style={css.input} /></div>
            <div><label style={css.label}>Assembly Name *</label><input value={form.assemblyName||""} onChange={e=>setForm({...form,assemblyName:e.target.value})} style={css.input} /></div>
            <div><label style={css.label}>Client Contact</label><input value={form.clientContact||""} onChange={e=>setForm({...form,clientContact:e.target.value})} style={css.input} /></div>
            <div><label style={css.label}>Expected Inspection Date</label><input type="date" value={form.expectedInspectionDate||""} onChange={e=>setForm({...form,expectedInspectionDate:e.target.value})} style={css.input} /></div>
            <div style={{ gridColumn:"span 2", display:"flex", alignItems:"center", gap:8 }}>
              <input type="checkbox" checked={!!form.tpiRequired} onChange={e=>setForm({...form,tpiRequired:e.target.checked})} style={{ width:14, height:14, accentColor:T.accent }} />
              <span style={{ fontSize:12, color:T.text }}>TPI Required for this assembly</span>
            </div>
            <div style={{ gridColumn:"span 2" }}><label style={css.label}>Notes</label><textarea value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})} rows={2} style={{ ...css.input, resize:"vertical" }} /></div>
          </div>
          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.textMid, marginBottom:8 }}>ASSIGN DRAWINGS</div>
            {drawings.filter(d=>d.receivedDate).length===0 && <div style={{ fontSize:12, color:T.textLow }}>No received drawings available.</div>}
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {drawings.filter(d=>d.receivedDate||true).map(d => {
                const checked = (form.drawingsAssigned||[]).includes(d.id);
                const usedByOther = assemblies.find(a=>a.id!==form.id&&a.drawingsAssigned.includes(d.id));
                return (
                  <div key={d.id} onClick={()=>!usedByOther&&toggleDrawing(d.id)}
                    style={{ padding:"4px 10px", borderRadius:4, fontSize:11, cursor:usedByOther?"not-allowed":"pointer",
                      background: checked ? T.accent+"33" : T.bgInput,
                      border:`1px solid ${checked ? T.accent : T.border}`,
                      color: usedByOther ? T.textLow : T.text, opacity:usedByOther?0.5:1 }}>
                    {d.drawingNo} {usedByOther?`(in ${usedByOther.assemblyNumber})`:""}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:16 }}>
            <button onClick={()=>setModal(null)} style={css.btn.secondary}>Cancel</button>
            <button onClick={saveAsm} disabled={!form.assemblyNumber?.trim()||!form.assemblyName?.trim()} style={{ ...css.btn.primary, opacity:(!form.assemblyNumber?.trim()||!form.assemblyName?.trim())?0.4:1 }}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const TabDrawings = ({ order, onChange, canEdit, user }) => {
  const [modal, setModal] = useState(null); const [form, setForm] = useState({}); const [expandRev, setExpandRev] = useState(null);
  const [importModal, setImportModal] = useState(false); const [importRows, setImportRows] = useState([]); const [importErr, setImportErr] = useState(""); const [importMode, setImportMode] = useState("append");
  const fileRef = useRef(null);
  const drawings = order.drawings||[];
  const byPhase = drawings.reduce((acc,d)=>{ const k=`Phase ${d.phase||1}`; if(!acc[k]) acc[k]=[]; acc[k].push(d); return acc; },{});
  Object.keys(byPhase).forEach(k=>byPhase[k].sort((a,b)=>(a.priority||1)-(b.priority||1)));
  const totalWt = drawings.reduce((s,d)=>s+(d.totalWt||0),0);
  const receivedWt = drawings.filter(d=>d.receivedDate).reduce((s,d)=>s+(d.totalWt||0),0);
  const saveDrawing = () => { const twc=(form.qty||0)*(form.unitWt||0); const updated=modal==="add"?[...drawings,{...form,id:`D-${Date.now()}`,totalWt:twc,status:form.receivedDate?"active":"pending",revHistory:[{rev:form.revNo||"A",date:form.drawingDate||"",note:"Initial issue"}]}]:drawings.map(d=>d.id===form.id?{...d,...form,totalWt:twc}:d); onChange({...order,drawings:updated}); setModal(null); };
  const saveRevision = () => { const updated=drawings.map(d=>d.id===form.id?{...d,revNo:form.revNo||d.revNo,drawingDate:form.drawingDate||d.drawingDate,receivedDate:form.receivedDate||d.receivedDate,driveLink:form.driveLink||d.driveLink,status:"active",revHistory:[...(d.revHistory||[]).map(r=>r.rev===d.revNo?{...r,superseded:true,supersededDate:today(),supersededBy:user?.name||""}:r),{rev:form.revNo,date:form.drawingDate,note:form.note,superseded:false}]}:d); onChange({...order,drawings:updated}); setModal(null); };

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
    { key:"poLineItem",   hdr:"PO Line Item",     required:false, hint:"Line number in client's PO document. Used in dispatch challans." },
    { key:"phase",        hdr:"Phase",            required:true,  hint:"1, 2, 3 …" },
    { key:"priority",     hdr:"Priority",         required:true,  hint:"1 = highest within phase" },
    { key:"driveLink",    hdr:"Drive Link",       required:false, hint:"Google Drive URL" },
    { key:"remarks",      hdr:"Remarks",          required:false, hint:"Any notes" },
  ];

  const downloadTemplate = () => {
    const header = DRG_COLS.map(c=>c.hdr);
    const hints  = DRG_COLS.map(c=>c.hint);
    const sample = ["DRG-001","Sample Drawing",4,850.5,"","A","01-01-2025","15-01-2025",1,1,1,"https://drive.google.com/...",""];
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
        const raw = await file.text();
        const text = (raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw).replace(/\r\n/g,'\n').replace(/\r/g,'\n');
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
          poLineItem: parseInt(r.poLineItem)||0,
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
              <thead><tr>{["Pri","Drawing No","Title","Qty","Unit Wt","Total Wt","Rev","Drg Date","Received","PO Line","Assembly Group","File","Status","Revisions",""].map(h=><th key={h} style={{ padding:"7px 10px", textAlign:"left", fontSize:10, fontWeight:700, color:T.textMid, textTransform:"uppercase", borderBottom:`2px solid ${T.borderHi}`, background:T.bgInput, whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
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
                      <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono, fontSize:11, textAlign:"center", color:d.poLineItem?T.text:T.textLow }}>{d.poLineItem||"—"}</td>
                      <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}>
                        {canEdit ? (
                          <select value={d.assemblyGroup||""} onChange={e=>{
                            const newAsmGroup = e.target.value;
                            const newDrawings = drawings.map(dd=>dd.id===d.id?{...dd,assemblyGroup:newAsmGroup}:dd);
                            const newAssemblies = (order.assemblies||[]).map(a => {
                              if (a.drawingsAssigned.includes(d.id) && a.id!==newAsmGroup) {
                                return {...a, drawingsAssigned:a.drawingsAssigned.filter(x=>x!==d.id)};
                              }
                              if (a.id===newAsmGroup && !a.drawingsAssigned.includes(d.id)) {
                                return {...a, drawingsAssigned:[...a.drawingsAssigned,d.id]};
                              }
                              return a;
                            });
                            onChange({...order, drawings:newDrawings, assemblies:newAssemblies});
                          }} style={{ ...css.input, fontSize:11, padding:"2px 4px" }}>
                            <option value="">—</option>
                            {(order.assemblies||[]).map(a=><option key={a.id} value={a.id}>{a.assemblyName||a.assemblyNumber}</option>)}
                          </select>
                        ) : (
                          <span style={{ fontSize:11, color:T.textMid }}>{(order.assemblies||[]).find(a=>a.id===d.assemblyGroup)?.assemblyName||"—"}</span>
                        )}
                      </td>
                      <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}>{d.driveLink?<a href={d.driveLink} target="_blank" rel="noreferrer" style={{ ...css.btn.sm, textDecoration:"none", background:T.greenLo, color:T.green, padding:"3px 8px" }}>View</a>:<span style={{ fontSize:11, color:T.textLow }}>—</span>}</td>
                      <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}><Badge color={d.receivedDate?"green":"amber"}>{d.receivedDate?"Received":"Pending"}</Badge></td>
                      <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}>{(d.revHistory||[]).length>0&&<button onClick={()=>setExpandRev(expandRev===d.id?null:d.id)} style={{ ...css.btn.ghost, fontSize:11, padding:"2px 8px", color:T.accent, border:`1px solid ${T.border}`, borderRadius:4 }}>{expandRev===d.id?"▲":"▼"} {d.revHistory.length} rev</button>}</td>
                      <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}><div style={{ display:"flex", gap:6 }}>{canEdit&&<button onClick={()=>{setForm({...d});setModal("edit");}} style={{ ...css.btn.ghost, fontSize:11, padding:"3px 8px" }}>Edit</button>}{canEdit&&<button onClick={()=>{setForm({...d,oldRevNo:d.revNo,revNo:"",drawingDate:"",receivedDate:"",note:""});setModal("revise");}} style={{ ...css.btn.ghost, fontSize:11, padding:"3px 8px", color:T.amber }}>Revise</button>}</div></td>
                    </tr>
                    {expandRev===d.id&&<tr key={`${d.id}-rev`}><td colSpan={15} style={{ padding:"0 10px 10px 40px", background:T.bgInput, borderBottom:`1px solid ${T.border}` }}>
                      <div style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", padding:"8px 0 6px" }}>Revision History</div>
                      <table style={{ borderCollapse:"collapse", width:"100%" }}><thead><tr>{["Rev","Date","Note","Status"].map(h=><th key={h} style={{ padding:"4px 10px", textAlign:"left", fontSize:10, fontWeight:700, color:T.textLow, textTransform:"uppercase", borderBottom:`1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                      <tbody>{(d.revHistory||[]).map((r,ri)=><tr key={ri} style={{ opacity:r.superseded?0.5:1 }}><td style={{ padding:"5px 10px", fontFamily:T.fontMono, fontWeight:700, color:r.superseded?T.textLow:T.green }}>{r.rev}</td><td style={{ padding:"5px 10px", color:T.textMid }}>{fmt.date(r.date)}</td><td style={{ padding:"5px 10px", color:T.text }}>{r.note}</td><td style={{ padding:"5px 10px" }}>{r.superseded?<Badge color="gray">Superseded</Badge>:<Badge color="green">Current</Badge>}</td></tr>)}</tbody></table>
                    </td></tr>}
                  </>
                ))}
                <tr style={{ background:T.bgInput }}><td colSpan={4} style={{ padding:"6px 10px", fontSize:11, fontWeight:700, color:T.textMid }}>Phase Total ({pDrawings.length})</td><td /><td style={{ padding:"6px 10px", textAlign:"right", fontFamily:T.fontMono, fontWeight:700, color:T.accent }}>{fmt.num(pDrawings.reduce((s,d)=>s+(d.totalWt||0),0))} kg</td><td colSpan={8} /></tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>
      {(modal==="add"||modal==="edit")&&<Modal title={modal==="add"?"Add Drawing":"Edit Drawing"} onClose={()=>setModal(null)} width={700}><div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}><div><label style={css.label}>Drawing No</label><input value={form.drawingNo||""} onChange={e=>setForm({...form,drawingNo:e.target.value})} style={css.input} /></div><div style={{ gridColumn:"span 1" }}><label style={css.label}>Title</label><input value={form.title||""} onChange={e=>setForm({...form,title:e.target.value})} style={css.input} /></div><div><label style={css.label}>Qty</label><input type="number" value={form.qty||""} onChange={e=>setForm({...form,qty:+e.target.value,totalWt:(+e.target.value)*(form.unitWt||0)})} style={css.input} /></div><div><label style={css.label}>Unit Wt (kg)</label><input type="number" value={form.unitWt||""} onChange={e=>setForm({...form,unitWt:+e.target.value,totalWt:(form.qty||0)*(+e.target.value)})} style={css.input} /></div><div><label style={css.label}>Rev No</label><input value={form.revNo||""} onChange={e=>setForm({...form,revNo:e.target.value})} style={css.input} placeholder="A" /></div><div><label style={css.label}>Drawing Date</label><input type="date" value={form.drawingDate||""} onChange={e=>setForm({...form,drawingDate:e.target.value})} style={css.input} /></div><div><label style={css.label}>Received Date</label><input type="date" value={form.receivedDate||""} onChange={e=>setForm({...form,receivedDate:e.target.value})} style={css.input} /></div><div><label style={css.label}>PO Line Item</label><input type="number" value={form.poLineItem||""} onChange={e=>setForm({...form,poLineItem:+e.target.value})} style={css.input} placeholder="1" /></div><div><label style={css.label}>Phase</label><select value={form.phase||1} onChange={e=>setForm({...form,phase:+e.target.value})} style={css.input}>{[1,2,3,4,5].map(n=><option key={n} value={n}>Phase {n}</option>)}</select></div><div><label style={css.label}>Priority</label><select value={form.priority||1} onChange={e=>setForm({...form,priority:+e.target.value})} style={css.input}>{[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>Priority {n}</option>)}</select></div><div><label style={css.label}>Drive Link</label><input value={form.driveLink||""} onChange={e=>setForm({...form,driveLink:e.target.value})} style={css.input} placeholder="https://drive.google.com/..." /></div></div><div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:12 }}><button onClick={()=>setModal(null)} style={css.btn.secondary}>Cancel</button><button onClick={saveDrawing} style={css.btn.primary}>Save Drawing</button></div></Modal>}
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
    { key:"drawingLineItem", hdr:"Drawing Line Item", required:false, hint:"Line number from client's drawing BOM, e.g. 1, 2, 3" },
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
    { key:"requiredOps",   hdr:"Required Ops",     required:false, hint:"Comma-separated: Cut, Bevel, Drill, Grind, Mark, Notch. Defaults to Cut for Fabricate." },
    { key:"partLink",      hdr:"Part Drawing Link",required:false, hint:"Drive URL" },
    { key:"remarks",       hdr:"Remarks",          required:false, hint:"Any notes" },
  ];

  const downloadTemplate = () => {
    const header = PART_COLS.map(c=>c.hdr);
    const hints  = PART_COLS.map(c=>c.hint);
    const sample1 = ["DRG-001","A",1,1,"SBK-101","BRACKET ANGLE","Fabricate","MS","E250","ISA","75x75x8",150,75,80,1.335,106.8,"No","Procure","Cut,Bevel","",""];
    const sample2 = ["DRG-001","A",2,2,"PL-001","BASE PLATE 10MM","Fabricate","MS","E250","PLATE","10mm",500,500,4,19.625,78.5,"No","Procure","Cut","",""];
    const sample3 = ["DRG-001","A",3,3,"BOLT-M20","HEX BOLT M20x60","Bought Out","MS","8.8","","","","",20,"","","No","Procure","","",""];
    const rows = [header, hints, sample1, sample2, sample3];
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
        const raw = await file.text();
        const text = (raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw).replace(/\r\n/g,'\n').replace(/\r/g,'\n');
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
            drawingLineItem: parseInt(r.drawingLineItem)||0,
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
            requiredOps: r.requiredOps?.trim() ? r.requiredOps.split(",").map(o=>o.trim()).filter(Boolean) : (r.fabType?.includes("Bought")||r.fabType?.toLowerCase()==="bought out" ? [] : ['Cut']),
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
          <button onClick={()=>{setForm({fabType:"Fabricate",matType:"MS",grade:"E250",source:"Procure",jointsAllowed:false,drawingLineItem:1,requiredOps:['Cut'],drawingId:filterDrg!=="all"?filterDrg:"",matLibId:"",matCode:""});setModal("add");}} style={css.btn.primary}>+ Add Part</button>
        </div>}
      </div>
      {/* Hidden file input */}
      <input ref={fileRef2} type="file" accept=".csv" style={{display:"none"}} onChange={handleFile} />
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead><tr>{["Line","Item","Drawing","Mark No","Description","Fab/BO","Material Code","L(mm)","W(mm)","Qty","Client Wt","Calc Wt","Joints","Source","Req Ops","Coverage",""].map(h=><th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:10, fontWeight:700, color:T.textMid, textTransform:"uppercase", borderBottom:`1px solid ${T.border}`, whiteSpace:"nowrap", background:T.bg }}>{h}</th>)}</tr></thead>
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
                  const matMatch = p.matCode ? s.matCode===p.matCode : ((s.sectionType||s.section)===p.section&&s.size===p.size&&s.grade===p.grade);
                  if (!matMatch) return sum;
                  return sum + (s.allocations||[]).filter(a=>a.drawingId===p.drawingId&&a.markNo===p.markNo).reduce((a,x)=>a+(x.wt||0),0);
                },0);
                const short = Math.max(0, reqWt - allocWt);
                if (allocWt===0) covBadge = <Badge color="red">None</Badge>;
                else if (short<=0) covBadge = <Badge color="green">Covered</Badge>;
                else covBadge = <Badge color="amber">{fmt.num(Math.round(short))} kg short</Badge>;
              }
              return <tr key={p.id} style={{ background:i%2===0?"transparent":T.bg }}>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono, fontSize:11, color:T.textMid }}>{p.drawingLineItem||"—"}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono, fontSize:11, color:T.textMid }}>{p.itemNo}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontSize:11, color:T.accentHi, fontFamily:T.fontMono, whiteSpace:"nowrap" }}>{drg?.drawingNo||"—"}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontWeight:700 }}>{p.markNo}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, maxWidth:180 }}>{p.desc}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}><Badge color={p.fabType==="Fabricate"?"blue":"gray"}>{p.fabType==="Fabricate"?"Fab":"B/O"}</Badge></td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono, fontSize:11, color:p.matLibId?T.accentHi:T.textMid }}>{dispCode}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono, textAlign:"right" }}>{fmt.num(p.length)}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono, textAlign:"right", color:(p.width>0)?T.text:T.textLow }}>{p.width>0?fmt.num(p.width):"—"}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono, textAlign:"center" }}>{p.qtyPerDrg}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono, color:T.amber, textAlign:"right" }}>{p.clientTotalWt?.toFixed(2)}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono, color:T.green, textAlign:"right" }}>{p.calcTotalWt?.toFixed(2)}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}><Badge color={p.jointsAllowed?"amber":"gray"}>{p.jointsAllowed?"Yes":"No"}</Badge></td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}><Badge color={srcColor[p.source]||"gray"}>{p.source}</Badge></td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}>{p.fabType==="Fabricate"?(p.requiredOps||[]).map(op=><span key={op} style={{display:"inline-block",background:T.bgInput,border:`1px solid ${T.border}`,borderRadius:3,padding:"1px 5px",fontSize:10,marginRight:3,fontFamily:T.fontMono}}>{op}</span>):<Badge color="gray">B/O</Badge>}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}>{covBadge||<span style={{ color:T.textLow, fontSize:11 }}>—</span>}</td>
                <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}>{canEdit&&<button onClick={()=>{setForm({...p});setModal("edit");}} style={css.btn.ghost}>Edit</button>}</td>
              </tr>;
            })}
          </tbody>
          {filtered.length>0&&<tfoot><tr><td colSpan={11} style={{ padding:"8px 10px", borderTop:`1px solid ${T.borderHi}`, fontSize:12, fontWeight:700, color:T.textMid }}>TOTALS ({filtered.length} parts)</td><td style={{ padding:"8px 10px", borderTop:`1px solid ${T.borderHi}`, fontFamily:T.fontMono, fontWeight:700, color:T.amber, textAlign:"right" }}>{filtered.reduce((s,p)=>s+(p.clientTotalWt||0),0).toFixed(2)}</td><td style={{ padding:"8px 10px", borderTop:`1px solid ${T.borderHi}`, fontFamily:T.fontMono, fontWeight:700, color:T.green, textAlign:"right" }}>{filtered.reduce((s,p)=>s+(p.calcTotalWt||0),0).toFixed(2)}</td><td colSpan={5}/></tr></tfoot>}
        </table>
      </div>
      {modal&&<Modal title={modal==="add"?"Add Part":"Edit Part"} onClose={()=>setModal(null)} width={760}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <MField label="Drawing Line Item"><input type="number" value={form.drawingLineItem||""} onChange={e=>setForm(f=>({...f,drawingLineItem:+e.target.value}))} style={css.input} placeholder="1" /></MField>
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
          {form.fabType==="Fabricate"&&<div style={{gridColumn:'span 2'}}>
            <div style={css.label}>Required Operations</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:4}}>
              {['Cut','Bevel','Drill','Grind','Mark','Notch'].map(op=>(
                <label key={op} style={{display:'flex',alignItems:'center',gap:4,cursor:'pointer',fontSize:12}}>
                  <input type="checkbox" checked={(form.requiredOps||[]).includes(op)} onChange={e=>{const ops=form.requiredOps||[];setForm(f=>({...f,requiredOps:e.target.checked?[...ops,op]:ops.filter(o=>o!==op)}));}} />
                  <span style={{color:T.text}}>{op}</span>
                </label>
              ))}
            </div>
          </div>}
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
      {activeQ==="weld"&&<div style={{ ...css.card }}><div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}><div><label style={css.label}>Process</label><select value={q.weldSpec?.process||"SMAW"} onChange={e=>updQ("weldSpec",{...q.weldSpec,process:e.target.value})} disabled={!canEdit} style={css.input}><option>SMAW</option><option>GMAW</option><option>FCAW</option><option>SAW</option></select></div><div><label style={css.label}>Electrode Type</label><input value={q.weldSpec?.electrodeType||""} onChange={e=>updQ("weldSpec",{...q.weldSpec,electrodeType:e.target.value})} disabled={!canEdit} style={css.input} placeholder="E7018" /></div><div><label style={css.label}>Grade</label><input value={q.weldSpec?.grade||""} onChange={e=>updQ("weldSpec",{...q.weldSpec,grade:e.target.value})} disabled={!canEdit} style={css.input} /></div><div><label style={css.label}>Make</label><input value={q.weldSpec?.make||""} onChange={e=>updQ("weldSpec",{...q.weldSpec,make:e.target.value})} disabled={!canEdit} style={css.input} placeholder="Lincoln Electric..." /></div><div style={{ gridColumn:"span 2" }}><label style={css.label}>Remarks</label><input value={q.weldSpec?.remarks||""} onChange={e=>updQ("weldSpec",{...q.weldSpec,remarks:e.target.value})} disabled={!canEdit} style={css.input} /></div><div style={{ gridColumn:"span 2" }}><label style={css.label}>WPS/WPQ Document</label><div style={{ display:"flex", gap:8 }}><input value={q.wpsDoc||""} onChange={e=>updQ("wpsDoc",e.target.value)} disabled={!canEdit} style={{ ...css.input, flex:1 }} placeholder="Drive link..." />{q.wpsDoc&&<a href={q.wpsDoc} target="_blank" rel="noreferrer" style={{ ...css.btn.sm, textDecoration:"none" }}>View</a>}</div><div style={{ fontSize:11, color:T.red, marginTop:4 }}>⚠ Critical — required for TPI inspection</div></div><div style={{ gridColumn:"span 2" }}><label style={css.label}>Welding sequence / distortion control notes (optional)</label><textarea value={q.weldSpec?.weldingSequence||""} onChange={e=>updQ("weldSpec",{...q.weldSpec,weldingSequence:e.target.value})} disabled={!canEdit} rows={3} placeholder="e.g. Weld base plates before flange plates. Alternate sides on long members. Back-step on plates over 300mm." style={{ ...css.input, width:"100%", resize:"vertical", fontFamily:T.font }} /></div></div></div>}
      {activeQ==="tpi"&&<div style={{ ...css.card }}><div style={{ marginBottom:12 }}><div style={css.label}>TPI Required</div><div style={{ display:"flex", gap:12 }}><label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}><input type="radio" checked={q.tpiRequired===true} onChange={()=>updQ("tpiRequired",true)} disabled={!canEdit} /><span style={{ color:T.text }}>Yes</span></label><label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}><input type="radio" checked={q.tpiRequired===false} onChange={()=>updQ("tpiRequired",false)} disabled={!canEdit} /><span style={{ color:T.text }}>No</span></label></div></div>{q.tpiRequired&&<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}><div><label style={css.label}>TPI Agency</label><select value={q.tpiAgencyId||""} onChange={e=>{ const a=TPI_AGENCIES.find(t=>t.id===e.target.value); updQ("tpiAgencyId",e.target.value); updQ("tpiAgencyName",a?.name||""); }} disabled={!canEdit} style={css.input}><option value="">Select...</option>{TPI_AGENCIES.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div><div><div style={css.label}>Hold Points</div><div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:4 }}>{[["rm_inspection","RM Inspection"],["fit_up","Fit-Up"],["welding","Welding"],["blasting","Blasting"],["painting","Painting"]].map(([hp,label])=><label key={hp} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer" }}><input type="checkbox" checked={(q.tpiHoldPoints||[]).includes(hp)} disabled={!canEdit} onChange={e=>{ const pts=q.tpiHoldPoints||[]; updQ("tpiHoldPoints",e.target.checked?[...pts,hp]:pts.filter(p=>p!==hp)); }} /><span style={{ fontSize:12, color:T.text }}>{label}</span></label>)}</div></div></div>}</div>}
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
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [reactivateModal, setReactivateModal] = useState(false);
  const [reactivateReason, setReactivateReason] = useState("");
  const canEdit = user.role==="super_admin"||user.role==="planning_admin";
  const canEditFinance = user.role==="super_admin"||user.role==="planning_admin"||user.role==="finance_admin";
  const update = (updated) => { setLocalOrder(updated); setDirty(true); };
  const save = () => { onSave(localOrder); setDirty(false); };

  const cancelOrder = (reason) => {
    const cancelled = {...localOrder, status:"cancelled", cancellationReason:reason, cancelledBy:user.name, cancelledDate:today()};
    setLocalOrder(cancelled); onSave(cancelled); setCancelModal(false); setCancelReason("");
  };
  const reactivateOrder = (reason) => {
    const reactivated = {...localOrder, status:"active", reactivationReason:reason, reactivatedBy:user.name, reactivatedDate:today()};
    setLocalOrder(reactivated); onSave(reactivated); setReactivateModal(false); setReactivateReason("");
  };
  const isFinanceRole = user.role==="finance_admin"||user.role==="finance_user";
  useEffect(() => { if (isFinanceRole) setActiveTab("milestones"); }, []);
  const allTabs = [
    {id:"basic",label:"Basic Details"},{id:"gst",label:"GST & Billing"},{id:"shipping",label:"Shipping"},
    {id:"transport",label:"Transport"},
    {id:"milestones",label:"Payment Milestones"},{id:"drawings",label:"Drawing Register",planningOnly:true},
    {id:"parts",label:"Drawing Part List",planningOnly:true},{id:"quality",label:"Quality",planningOnly:true},
    {id:"assemblies",label:"Assemblies",planningOnly:true},
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
          {user.role==="super_admin"&&localOrder.status!=="cancelled"&&<button onClick={()=>{setCancelReason("");setCancelModal(true);}} style={{ ...css.btn.secondary, color:T.red, borderColor:T.redLo }}>Cancel Order</button>}
          {user.role==="super_admin"&&localOrder.status==="cancelled"&&<button onClick={()=>{setReactivateReason("");setReactivateModal(true);}} style={{ ...css.btn.secondary, color:T.green, borderColor:T.green }}>Reactivate</button>}
        </div>
      </div>
      <TabBar2 tabs={tabs} active={activeTab} onChange={setActiveTab} />
      {activeTab==="basic"      && <TabBasicDetails  order={localOrder} onChange={update} canEdit={canEdit} clients={clients||[]} />}
      {activeTab==="gst"        && <TabGSTBilling    order={localOrder} onChange={update} canEdit={canEdit} />}
      {activeTab==="shipping"   && <TabShipping      order={localOrder} onChange={update} canEdit={canEdit} />}
      {activeTab==="transport"   && <TabTransport     order={localOrder} onChange={update} canEdit={canEdit} />}
      {activeTab==="milestones" && <TabMilestones    order={localOrder} onChange={update} canEdit={canEditFinance} />}
      {activeTab==="drawings"   && <TabDrawings      order={localOrder} onChange={update} canEdit={canEdit} user={user} />}
      {activeTab==="parts"      && <TabParts         order={localOrder} onChange={update} canEdit={canEdit} materials={materials||[]} stock={stock||[]} />}
      {activeTab==="quality"    && <TabQuality       order={localOrder} onChange={update} canEdit={canEdit} />}
      {activeTab==="assemblies" && <TabAssemblies    order={localOrder} onChange={update} canEdit={canEdit} />}
      {activeTab==="finance"    && <TabFinance       order={localOrder} onChange={update} canEdit={canEditFinance} />}

      {cancelModal && (
        <Modal title="Cancel Order" onClose={()=>setCancelModal(false)}>
          <InfoBanner color="red">Cancelling this order will mark it as inactive. Existing allocations and POs are not automatically affected.</InfoBanner>
          <div style={{ marginTop:12 }}>
            <label style={css.label}>Cancellation Reason *</label>
            <textarea value={cancelReason} onChange={e=>setCancelReason(e.target.value)} rows={3}
              placeholder="State the reason for cancellation..."
              style={{ ...css.input, width:"100%", resize:"vertical", marginTop:4 }} />
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:14 }}>
            <button onClick={()=>setCancelModal(false)} style={css.btn.secondary}>Keep Active</button>
            <button disabled={!cancelReason.trim()} onClick={()=>cancelOrder(cancelReason)}
              style={{ ...css.btn.primary, background:T.red, borderColor:T.red, opacity:cancelReason.trim()?1:0.4 }}>
              Cancel Order
            </button>
          </div>
        </Modal>
      )}

      {reactivateModal && (
        <Modal title="Reactivate Order" onClose={()=>setReactivateModal(false)}>
          <InfoBanner color="blue">Order will be set back to Active status.</InfoBanner>
          <div style={{ marginTop:12 }}>
            <label style={css.label}>Reason for Reactivation *</label>
            <textarea value={reactivateReason} onChange={e=>setReactivateReason(e.target.value)} rows={3}
              placeholder="Why is this order being reactivated?"
              style={{ ...css.input, width:"100%", resize:"vertical", marginTop:4 }} />
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:14 }}>
            <button onClick={()=>setReactivateModal(false)} style={css.btn.secondary}>Cancel</button>
            <button disabled={!reactivateReason.trim()} onClick={()=>reactivateOrder(reactivateReason)}
              style={{ ...css.btn.primary, opacity:reactivateReason.trim()?1:0.4 }}>
              Reactivate Order
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
const OrdersList = ({ orders, onOpen, user, clients, onAddOrder }) => {
  const [search, setSearch] = useState(""); const [statusFilter, setStatusFilter] = useState("all"); const [modal, setModal] = useState(false); const [form, setForm] = useState({}); const [showCancelled, setShowCancelled] = useState(false);
  const filtered = orders.filter(o=>(showCancelled||o.status!=="cancelled")&&((o.id||'').toLowerCase().includes(search.toLowerCase())||(o.projectDesc||'').toLowerCase().includes(search.toLowerCase())||(o.clientPoNo||'').toLowerCase().includes(search.toLowerCase())||(o.clientId||'').toLowerCase().includes(search.toLowerCase()))&&(statusFilter==="all"||o.status===statusFilter));
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
          <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12, color:T.textMid, userSelect:"none" }}>
            <input type="checkbox" checked={showCancelled} onChange={e=>setShowCancelled(e.target.checked)} />
            Show cancelled
          </label>
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
              {[["Super Admin","rajesh.kumar","admin123"],["Planning Admin","vikram.singh","plan123"],["Planning User","neha.gupta","plan123"],["Purchase","deepak.rao","pur123"],["Store Admin","mohan.das","store123"],["QC Admin","priya.mehta","qc123"],["Floor Planner","suresh.patel","prod123"],["Finance Admin","sameer.shah","fin123"],["Dispatch","ramesh.kulkarni","disp123"],["Contractor","krishna.fab","con123"],["Machine Op","ajay.kadam","machine123"]].map(([role,un,pw])=>(
                <button key={role} onClick={()=>{setU(un);setP(pw);}} style={{ ...css.btn.ghost, textAlign:"left", fontSize:11, background:T.bgCard, borderRadius:4, border:`1px solid ${T.border}`, padding:"4px 8px" }}>{role}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTION: CUTTING CONFIRMATION
// ═══════════════════════════════════════════════════════════════════════════════
const CuttingConfirmation = ({ user, nestingRuns, setNestingRuns, stock, setStock,
                               instances, setInstances, orders, materials, machines, productionStandards, releases, onBack }) => {
  const [step, setStep]         = useState("runs"); // "runs" | "bars" | "barForm"
  const [selRunId, setSelRunId] = useState(null);
  const [selBarRef, setSelBarRef] = useState(null);
  const [barForm, setBarForm]   = useState({});
  const [toast, setToast]       = useState(null);
  const [testRunModal, setTestRunModal] = useState(false);
  const [testForm, setTestForm] = useState({});

  const showToast = (msg, color="green") => { setToast({msg,color}); setTimeout(()=>setToast(null),3500); };

  const createTestRun = () => {
    if (!testForm.orderId || !testForm.lotId || !(testForm.numBars > 0)) return;
    const yr = new Date().getFullYear();
    let max = 0;
    (nestingRuns||[]).forEach(r=>{ const m=(r.id||"").match(/^NEST-(\d{4})-(\d+)$/); if(m&&+m[1]===yr) max=Math.max(max,+m[2]); });
    const newId = `NEST-${yr}-${String(max+1).padStart(3,"0")}`;
    const lot = stock.find(s=>s.id===testForm.lotId)||{};
    const selDrgIds = testForm.drawingIds||[];
    const newRun = {
      id: newId, runDate: new Date().toISOString().slice(0,10), runBy: user.name,
      materialCode: lot.matCode||lot.itemCode||"",
      orders: [testForm.orderId], drawings: selDrgIds,
      lotsUsed: [testForm.lotId],
      sheetsOrBarsUsed: +testForm.numBars,
      utilisationPct: +(testForm.utilPct||0),
      wasteKg: +(testForm.wasteKg||0),
      offcutsCreated: [], dxfLink: "",
      status: "confirmed", parts: [],
    };
    setNestingRuns(prev=>[...prev, newRun]);
    setTestRunModal(false); setTestForm({});
    showToast(`Test nesting run ${newId} created — ready for cutting confirmation`);
  };
  const selRun = nestingRuns.find(r => r.id === selRunId);
  const cuttingMachines = machines.filter(m => m.type === "Cutting" && m.active);

  // Derive parts for a run from linked order parts (fallback when run.parts[] is empty)
  const getRunParts = (run) => {
    if ((run.parts||[]).length > 0) {
      return run.parts.map(p => ({
        markNo:p.markNo, desc:"", drawingId:"", drawingNo:p.drawingNo||"",
        orderId:p.orderId, plannedQty:p.qty||0, length:0,
      }));
    }
    const result = []; const seen = new Set();
    (run.orders||[]).forEach(ordId => {
      const order = orders.find(o => o.id === ordId);
      if (!order) return;
      const runDrgSet = new Set(run.drawings||[]);
      (order.parts||[]).filter(p =>
        p.fabType==="Fabricate" && p.source==="Procure" &&
        (runDrgSet.size===0 || runDrgSet.has(p.drawingId)) &&
        (!run.materialCode || p.matCode===run.materialCode)
      ).forEach(p => {
        const key = `${p.markNo}__${p.drawingId}__${ordId}`;
        if (seen.has(key)) return; seen.add(key);
        const drg = (order.drawings||[]).find(d=>d.id===p.drawingId);
        result.push({ markNo:p.markNo, desc:p.desc||"", drawingId:p.drawingId,
          drawingNo:drg?.drawingNo||"", orderId:ordId,
          plannedQty:p.qtyPerDrg||0, length:p.length||0, sectionType:p.sectionType||"" });
      });
    });
    return result;
  };

  // Generate bar list for a run
  const getBars = (run) => {
    const n = Math.max(1, run.sheetsOrBarsUsed||1);
    const prefix = (run.materialCode||"").startsWith("PLATE") ? "SHEET" : "BAR";
    return Array.from({length:n}, (_,i) => {
      const barRef = `${prefix}-${String(i+1).padStart(2,"0")}`;
      const data = (run.confirmedBars||[]).find(b=>b.barRef===barRef);
      return { barRef, confirmed:!!data, data };
    });
  };

  // Open bar confirmation form
  const openBarForm = (run, barRef) => {
    const matLib = materials.find(m=>m.matCode===run.materialCode);
    const lots   = (run.lotsUsed||[]).map(id=>stock.find(s=>s.id===id)).filter(Boolean);
    const defLot = lots[0]||{};
    // Find machine capabilities from releases linked to this run
    const relForRun = (releases||[]).find(r=>(r.machineAssignments||[]).some(ma=>ma.nestingRunId===run.id)||(r.drawings||[]).some(d=>d.nestingRunId===run.id));
    const machineId = relForRun ? ((relForRun.machineAssignments||[])[0]?.machineId||"") : "";
    const machineObj = machineId ? (machines||[]).find(m=>m.id===machineId) : null;
    const machineCaps = machineObj?.capabilities||[];
    setSelBarRef(barRef);
    setBarForm({
      lotId: defLot.id||"", batchNo: defLot.batchNo||"",
      cuttingBayUsed: "",
      isPlate: matLib?.isPlate||false,
      wtPerMetre: matLib?.wtPerMetre||0, wtPerM2: matLib?.wtPerM2||0,
      machineCaps,
      subStageChecks: { cut:false, bevel:false, grind:false, drill:false },
      parts: getRunParts(run).map(p=>({
        ...p, included:true, actualQty:p.plannedQty,
        shortReason:"", isDefective:false, defectType:"dimensional", defectReason:"",
        markingConfirmed:false, markingCannotStamp:false, markingCannotStampReason:"",
      })),
      hasOffcut:false, offcutLength:"", offcutWidth:"",
    });
    setStep("barForm");
  };

  const updatePart = (i,k,v) =>
    setBarForm(f=>{ const p=[...f.parts]; p[i]={...p[i],[k]:v}; return {...f,parts:p}; });

  const ocWt = () => {
    if (!barForm.hasOffcut) return 0;
    if (barForm.isPlate) return ((+barForm.offcutLength||0)/1000)*((+barForm.offcutWidth||0)/1000)*(barForm.wtPerM2||0);
    return ((+barForm.offcutLength||0)/1000)*(barForm.wtPerMetre||0);
  };

  // Find a replacement off-cut for a defective part
  const findReplacement = (part) => !part.length ? null :
    stock.find(s=>s.isOffcut && s.matCode===selRun?.materialCode &&
      s.status==="available" && (s.offcutLength||0)>=part.length)||null;

  const confirmBar = () => {
    if (!barForm.cuttingBayUsed) return showToast("Select a cutting bay","amber");
    const included = barForm.parts.filter(p=>p.included);
    if (!included.length) return showToast("Check at least one part","amber");
    const needsReason = included.filter(p=>!p.isDefective&&(+p.actualQty||0)<p.plannedQty&&!p.shortReason.trim());
    if (needsReason.length) return showToast("Enter reason for short quantities on highlighted parts","amber");
    const needsMarking = included.filter(p=>!p.isDefective && !p.markingConfirmed && (!p.markingCannotStamp || !p.markingCannotStampReason?.trim()));
    if (needsMarking.length) return showToast("Confirm piece marking (or enter reason for no-stamp) on all parts","amber");

    const confirmDate = today();

    // Look up contractor assignment from releases for a given drawing/order
    const getContractorForDrawing = (drawingId, orderId) => {
      for (const rel of releases||[]) {
        const drw = (rel.drawings||[]).find(d=>d.drawingId===drawingId&&d.orderId===orderId);
        if (drw?.contractorId) return { contractorId:drw.contractorId, contractorName:drw.contractorName||"",
          pinnedEngineerId:drw.pinnedEngineerId||"", pinnedEngineerName:drw.pinnedEngineerName||"" };
      }
      return {};
    };

    // Create instances
    const newInst = createInstances({
      nestingRunId:selRunId, lotId:barForm.lotId, barRef:selBarRef,
      batchNo:barForm.batchNo, cuttingBayUsed:barForm.cuttingBayUsed,
      confirmedParts: included.map(p=>{
        const ca = getContractorForDrawing(p.drawingId, p.orderId);
        return {
          markNo:p.markNo, drawingId:p.drawingId, drawingNo:p.drawingNo,
          orderId:p.orderId, desc:p.desc,
          actualQty:Math.max(1, +p.actualQty||0), totalInstances:p.plannedQty,
          subOpsRequired:["cut"],
          isDefective:p.isDefective, defectType:p.defectType, defectReason:p.defectReason,
          contractorId:ca.contractorId||"", contractorName:ca.contractorName||"",
          pinnedEngineerId:ca.pinnedEngineerId||"", pinnedEngineerName:ca.pinnedEngineerName||"",
        };
      }),
      confirmedBy:user.name, confirmDate, existingInstances:instances,
    });
    // Task 1E: pending_secondary when drill not completed but machine has drill capability
    if (barForm.subStageChecks?.drill === false && (barForm.machineCaps||[]).includes('drill')) {
      newInst.forEach(inst => {
        if (inst.currentStatus === "pending_collection") {
          inst.currentStatus = "pending_secondary";
        }
      });
    }
    setInstances(prev=>[...prev,...newInst]);

    // Update stock lot wtConsumed (sections only; plates calculated from dims)
    const wtConsumed = barForm.isPlate ? 0 :
      included.filter(p=>!p.isDefective).reduce((s,p)=>
        s+((p.length||0)/1000)*(barForm.wtPerMetre||0)*(+p.actualQty||0), 0);
    if (barForm.lotId && wtConsumed>0) {
      setStock(prev=>prev.map(s=>s.id!==barForm.lotId?s:{...s,
        wtConsumed:(s.wtConsumed||0)+wtConsumed,
        wtAvailable:Math.max(0,(s.wtAvailable||0)-wtConsumed),
        status:Math.max(0,(s.wtAvailable||0)-wtConsumed)===0?"consumed":s.status,
        auditLog:[...(s.auditLog||[]),{action:"consumed",orderId:included[0]?.orderId||"",
          wt:wtConsumed,by:user.name,date:confirmDate,reason:`Cut: ${selRunId}/${selBarRef}`}],
      }));
    }

    // Create off-cut lot if applicable
    const oc = ocWt(); let newOcId = null;
    if (barForm.hasOffcut && oc>=(barForm.isPlate?0.1:5)) {
      const yr = new Date().getFullYear();
      let maxLot=0;
      stock.forEach(s=>{const m=(s.lotNo||"").match(/^LOT-(\d{4})-(\d+)$/);if(m&&+m[1]===yr)maxLot=Math.max(maxLot,+m[2]);});
      const parentLot = stock.find(s=>s.id===barForm.lotId)||{};
      newOcId = `STK-OC-${Date.now()}`;
      const ocItemCode = barForm.isPlate
        ? `${selRun.materialCode}/${barForm.offcutLength}X${barForm.offcutWidth}`
        : `${selRun.materialCode}/${barForm.offcutLength}`;
      setStock(prev=>[...prev,{
        id:newOcId, lotNo:`LOT-${yr}-${String(maxLot+1).padStart(3,"0")}`,
        batchNo:barForm.batchNo, itemCode:ocItemCode,
        matCode:selRun.materialCode, matLibId:parentLot.matLibId||"",
        section:parentLot.section||"", size:parentLot.size||"",
        grade:parentLot.grade||"", matType:parentLot.matType||"",
        vendorId:parentLot.vendorId||"", vendorCode:parentLot.vendorCode||"",
        vendorName:parentLot.vendorName||"",
        wtReceived:oc, wtAvailable:oc, wtAllocated:0, wtIssued:0, wtConsumed:0,
        status:"pending_offcut_verification", bayId:parentLot.bayId||"",
        poId:parentLot.poId||"", grnId:parentLot.grnId||"",
        receivedDate:confirmDate,
        mtcUploaded:parentLot.mtcUploaded||false, mtcDoc:parentLot.mtcDoc||"",
        heatNo:parentLot.heatNo||"",
        rmQcStatus:"approved", clientInspStatus:"approved", qcHoldReason:"",
        isOffcut:true, parentLotId:barForm.lotId, parentBatchNo:barForm.batchNo,
        offcutLength:barForm.isPlate?null:+(barForm.offcutLength||0),
        offcutDimensions:barForm.isPlate?`${barForm.offcutLength}X${barForm.offcutWidth}`:"",
        nestingRunId:selRunId, allocations:[], issues:[],
        reservations:[...(parentLot.reservations||[])],
        auditLog:[{action:"offcut-created",orderId:"",wt:oc,by:user.name,
          date:confirmDate,reason:`Cut: ${selRunId}/${selBarRef}`}],
      }]);
    }

    // Update nesting run with confirmed bar record
    const barEntry = {
      barRef:selBarRef, status:"confirmed",
      confirmedBy:user.name, confirmedDate:confirmDate,
      cuttingBayUsed:barForm.cuttingBayUsed, lotId:barForm.lotId,
      batchNo:barForm.batchNo, parts:included,
      hasOffcut:barForm.hasOffcut, offcutWt:oc, offcutLotId:newOcId,
    };
    setNestingRuns(prev=>prev.map(r=>r.id!==selRunId?r:{
      ...r,
      confirmedBars:[...(r.confirmedBars||[]),barEntry],
      ...(newOcId?{offcutsCreated:[...(r.offcutsCreated||[]),newOcId]}:{}),
    }));

    const goodCount = newInst.filter(i=>!i.defects?.length).length;
    const badCount  = newInst.filter(i=>i.defects?.length).length;
    showToast(`${selBarRef} confirmed — ${goodCount} instance${goodCount!==1?"s":""} created${badCount?`, ${badCount} defective`:""}`);
    setStep("bars");
  };

  // ── TOAST helper ──
  const toastEl = toast && (
    <div style={{ position:"fixed",top:20,right:20,zIndex:2000,
      background:toast.color==="green"?T.greenBg:toast.color==="amber"?T.amberBg:T.redBg,
      border:`1px solid ${toast.color==="green"?T.green:toast.color==="amber"?T.amber:T.red}`,
      borderRadius:8,padding:"12px 20px",
      color:toast.color==="green"?T.green:toast.color==="amber"?T.amber:T.red,
      fontSize:13,fontWeight:600 }}>{toast.msg}</div>
  );

  // ── STEP: RUNS LIST ──
  if (step==="runs") {
    const confirmedRuns = nestingRuns.filter(r=>r.status==="confirmed");
    return (
      <div>
        {toastEl}
        <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:20,justifyContent:"space-between",flexWrap:"wrap" }}>
          <div style={{ display:"flex",gap:8,alignItems:"center" }}>
            <button onClick={onBack} style={css.btn.ghost}>← Back</button>
            <div style={{ fontSize:18,fontWeight:800,color:T.text }}>Cutting Confirmation</div>
          </div>
          {user.role==="super_admin"&&(
            <button onClick={()=>{setTestForm({});setTestRunModal(true);}} style={{ ...css.btn.secondary, fontSize:12 }}>
              + Create Test Nesting Run
            </button>
          )}
        </div>
        {confirmedRuns.length===0
          ? <InfoBanner color="amber">No confirmed nesting runs. Go to MRP → Nesting Runs and set a run to Confirmed before cutting.</InfoBanner>
          : confirmedRuns.map(run => {
              const bars = getBars(run);
              const doneCount = bars.filter(b=>b.confirmed).length;
              return (
                <div key={run.id} onClick={()=>{setSelRunId(run.id);setStep("bars");}}
                  style={{...css.card,marginBottom:12,cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=T.borderHi}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                    <div>
                      <div style={{ fontFamily:T.fontMono,fontSize:14,fontWeight:800,color:T.accentHi }}>{run.id}</div>
                      <div style={{ fontSize:12,color:T.textMid,marginTop:3 }}>
                        {run.materialCode} · {run.runDate} · Run by {run.runBy}
                      </div>
                      <div style={{ fontSize:12,color:T.textMid,marginTop:2 }}>
                        Orders: {(run.orders||[]).join(", ")} · Lots: {(run.lotsUsed||[]).join(", ")}
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <Badge color={doneCount===bars.length?"green":doneCount>0?"amber":"gray"}>
                        {doneCount}/{bars.length} bars confirmed
                      </Badge>
                      <div style={{ fontSize:12,color:T.textMid,marginTop:6 }}>
                        {run.sheetsOrBarsUsed} bars/sheets · {run.utilisationPct}% util
                      </div>
                      {run.dxfLink&&<a href={run.dxfLink} target="_blank" rel="noreferrer"
                        style={{ fontSize:11,color:T.accent }}>DXF ↗</a>}
                    </div>
                  </div>
                </div>
              );
            })
        }

        {/* Test Nesting Run Modal */}
        {testRunModal && (() => {
          const selOrder = orders.find(o=>o.id===testForm.orderId);
          const availDrawings = selOrder ? (selOrder.drawings||[]).filter(d=>d.receivedDate) : [];
          const availLots = stock.filter(s=>(s.status==="available"||s.status==="qc_hold")&&(s.wtAvailable||0)>0);
          const selDrgs = testForm.drawingIds||[];
          const isPlateRun = (() => { const lot=stock.find(s=>s.id===testForm.lotId); return lot ? (lot.sectionType||"").toUpperCase()==="PLATE" : false; })();
          const barLabel = isPlateRun ? "sheets" : "bars";
          const canCreate = testForm.orderId && testForm.lotId && +testForm.numBars > 0;
          return (
            <Modal title="Create Test Nesting Run" onClose={()=>setTestRunModal(false)} width={560}>
              <InfoBanner color="blue">Creates a confirmed nesting run for testing the cutting confirmation flow. No DeepNest file required.</InfoBanner>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:12 }}>
                <div style={{ gridColumn:"span 2" }}>
                  <label style={css.label}>Order *</label>
                  <select value={testForm.orderId||""} onChange={e=>setTestForm(f=>({...f,orderId:e.target.value,drawingIds:[]}))} style={{ ...css.input, marginTop:4 }}>
                    <option value="">Select order…</option>
                    {(orders||[]).filter(o=>o.status==="active").map(o=><option key={o.id} value={o.id}>{o.id} — {o.projectDesc}</option>)}
                  </select>
                </div>
                {selOrder && availDrawings.length > 0 && (
                  <div style={{ gridColumn:"span 2" }}>
                    <label style={css.label}>Drawings (select one or more)</label>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:4 }}>
                      {availDrawings.map(d=>(
                        <label key={d.id} style={{ display:"flex", alignItems:"center", gap:5, cursor:"pointer", fontSize:12, color:T.text, background:selDrgs.includes(d.id)?T.accentLo:T.bgInput, border:`1px solid ${selDrgs.includes(d.id)?T.accent:T.border}`, borderRadius:4, padding:"3px 8px" }}>
                          <input type="checkbox" checked={selDrgs.includes(d.id)} onChange={e=>{
                            const ids = e.target.checked ? [...selDrgs,d.id] : selDrgs.filter(x=>x!==d.id);
                            setTestForm(f=>({...f,drawingIds:ids}));
                          }} style={{ display:"none" }} />
                          {d.drawingNo}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ gridColumn:"span 2" }}>
                  <label style={css.label}>Material Lot *</label>
                  <select value={testForm.lotId||""} onChange={e=>setTestForm(f=>({...f,lotId:e.target.value}))} style={{ ...css.input, marginTop:4 }}>
                    <option value="">Select lot…</option>
                    {availLots.map(s=><option key={s.id} value={s.id}>{s.lotNo} — {s.matCode||s.itemCode||""} — {(s.wtAvailable||0).toFixed(1)} kg avail</option>)}
                  </select>
                </div>
                <div>
                  <label style={css.label}>No. of {barLabel} *</label>
                  <input type="number" min={1} value={testForm.numBars||""} onChange={e=>setTestForm(f=>({...f,numBars:e.target.value}))} style={{ ...css.input, marginTop:4 }} placeholder="e.g. 6" />
                </div>
                <div>
                  <label style={css.label}>Utilisation %</label>
                  <input type="number" min={0} max={100} value={testForm.utilPct||""} onChange={e=>setTestForm(f=>({...f,utilPct:e.target.value}))} style={{ ...css.input, marginTop:4 }} placeholder="e.g. 87" />
                </div>
                <div>
                  <label style={css.label}>Waste (kg)</label>
                  <input type="number" min={0} value={testForm.wasteKg||""} onChange={e=>setTestForm(f=>({...f,wasteKg:e.target.value}))} style={{ ...css.input, marginTop:4 }} placeholder="e.g. 45" />
                </div>
              </div>
              {canCreate && (
                <div style={{ marginTop:12, padding:"8px 12px", background:T.bg, borderRadius:6, fontSize:12, color:T.textMid }}>
                  Will create <strong style={{color:T.text,fontFamily:T.fontMono}}>NEST-{new Date().getFullYear()}-{String(((nestingRuns||[]).reduce((mx,r)=>{const m=(r.id||"").match(/^NEST-(\d{4})-(\d+)$/);return(m&&+m[1]===new Date().getFullYear())?Math.max(mx,+m[2]):mx;},0))+1).padStart(3,"0")}</strong> with {testForm.numBars} {barLabel}, ready for cutting confirmation.
                </div>
              )}
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:14 }}>
                <button onClick={()=>setTestRunModal(false)} style={css.btn.secondary}>Cancel</button>
                <button disabled={!canCreate} onClick={createTestRun}
                  style={{ ...css.btn.primary, opacity:canCreate?1:0.4 }}>
                  Create Test Run
                </button>
              </div>
            </Modal>
          );
        })()}
      </div>
    );
  }

  // ── STEP: BARS GRID ──
  if (step==="bars" && selRun) {
    const bars = getBars(selRun);
    const doneCount = bars.filter(b=>b.confirmed).length;
    return (
      <div>
        {toastEl}
        <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:16 }}>
          <button onClick={()=>setStep("runs")} style={css.btn.ghost}>← Nesting Runs</button>
          <div style={{ fontSize:16,fontWeight:800,color:T.text }}>{selRun.id}</div>
          <Badge color={doneCount===bars.length?"green":doneCount>0?"amber":"gray"}>
            {doneCount}/{bars.length} confirmed
          </Badge>
        </div>
        <div style={{ ...css.card,marginBottom:16 }}>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,fontSize:12 }}>
            <div><span style={{color:T.textMid}}>Material: </span>
              <span style={{fontFamily:T.fontMono,fontWeight:700,color:T.accentHi}}>{selRun.materialCode}</span></div>
            <div><span style={{color:T.textMid}}>Orders: </span>{(selRun.orders||[]).join(", ")}</div>
            <div><span style={{color:T.textMid}}>Utilisation: </span>
              <span style={{fontFamily:T.fontMono}}>{selRun.utilisationPct}%</span></div>
            <div><span style={{color:T.textMid}}>Waste: </span>
              <span style={{fontFamily:T.fontMono}}>{selRun.wasteKg} kg</span></div>
            <div><span style={{color:T.textMid}}>Lots used: </span>{(selRun.lotsUsed||[]).join(", ")}</div>
            {selRun.dxfLink&&<div><a href={selRun.dxfLink} target="_blank" rel="noreferrer"
              style={{color:T.accent,fontSize:11}}>DXF Layout ↗</a></div>}
          </div>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12 }}>
          {bars.map(bar=>(
            <div key={bar.barRef} style={{ ...css.card,
              borderColor:bar.confirmed?T.green:T.border,
              borderLeftWidth:3 }}>
              <div style={{ fontFamily:T.fontMono,fontSize:15,fontWeight:800,
                color:bar.confirmed?T.green:T.text,marginBottom:8 }}>{bar.barRef}</div>
              {bar.confirmed ? (
                <div>
                  <Badge color="green">Confirmed ✓</Badge>
                  <div style={{ fontSize:11,color:T.textMid,marginTop:6 }}>
                    {bar.data.cuttingBayUsed}
                  </div>
                  <div style={{ fontSize:11,color:T.textMid }}>
                    {bar.data.confirmedBy} · {bar.data.confirmedDate}
                  </div>
                  {(bar.data.offcutWt||0)>0&&(
                    <div style={{ fontSize:11,color:T.amber,marginTop:4 }}>
                      Off-cut: {bar.data.offcutWt.toFixed(1)} kg
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={()=>openBarForm(selRun,bar.barRef)}
                  style={{ ...css.btn.primary,width:"100%",marginTop:4 }}>
                  Confirm Bar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── STEP: BAR CONFIRMATION FORM ──
  if (step==="barForm" && selRun) {
    const lots    = (selRun.lotsUsed||[]).map(id=>stock.find(s=>s.id===id)).filter(Boolean);
    const selLot  = stock.find(s=>s.id===barForm.lotId);
    const oc      = ocWt();
    const ocTooLight = barForm.hasOffcut && !barForm.isPlate && oc>0 && oc<5;
    return (
      <div>
        {toastEl}
        <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:16 }}>
          <button onClick={()=>setStep("bars")} style={css.btn.ghost}>← {selRun.id}</button>
          <div style={{ fontSize:16,fontWeight:800,color:T.text }}>Confirm {selBarRef}</div>
        </div>

        {/* Bar header card */}
        <div style={{ ...css.card,marginBottom:16 }}>
          <G3>
            <div>
              <div style={{ fontSize:11,color:T.textMid,marginBottom:4 }}>STOCK LOT</div>
              <select value={barForm.lotId}
                onChange={e=>{const l=stock.find(s=>s.id===e.target.value);
                  setBarForm(f=>({...f,lotId:e.target.value,batchNo:l?.batchNo||""}));}}
                style={css.input}>
                <option value="">Select lot...</option>
                {lots.map(l=><option key={l.id} value={l.id}>{l.lotNo} — {l.batchNo||"No batch"}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11,color:T.textMid,marginBottom:4 }}>CUTTING BAY *</div>
              <select value={barForm.cuttingBayUsed}
                onChange={e=>setBarForm(f=>({...f,cuttingBayUsed:e.target.value}))}
                style={{ ...css.input,borderColor:!barForm.cuttingBayUsed?T.red:T.border }}>
                <option value="">Select bay...</option>
                {cuttingMachines.map(m=><option key={m.id} value={m.name}>{m.name} ({m.bayLocation})</option>)}
                <option value="Manual">Manual / Hand Tools</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize:11,color:T.textMid,marginBottom:4 }}>BATCH NO</div>
              <div style={{ fontFamily:T.fontMono,fontSize:13,fontWeight:700,color:T.accentHi,paddingTop:6 }}>
                {barForm.batchNo||"—"}
              </div>
              {selLot&&<div style={{ fontSize:11,color:T.textMid,marginTop:4 }}>
                Available: <strong style={{color:T.green}}>{fmt.num(selLot.wtAvailable)} kg</strong>
                {selLot.heatNo&&<> · Heat: <span style={{fontFamily:T.fontMono}}>{selLot.heatNo}</span></>}
              </div>}
            </div>
          </G3>
        </div>

        {/* Parts checklist */}
        <SectionHd title={`Parts on ${selBarRef}`} sub={`${barForm.parts.length} parts found for this material`} />
        {barForm.parts.length===0&&(
          <InfoBanner color="amber">No parts found matching material code <strong>{selRun.materialCode}</strong> in the linked orders. Check that Drawing Part List entries have matching material codes and are linked to the drawings in this nesting run.</InfoBanner>
        )}
        {barForm.parts.map((p,i)=>{
          const short = p.included && !p.isDefective && (+p.actualQty||0)<p.plannedQty;
          const over  = p.included && !p.isDefective && (+p.actualQty||0)>p.plannedQty;
          const repl  = p.isDefective ? findReplacement(p) : null;
          return (
            <div key={i} style={{ ...css.card,marginBottom:10,
              borderLeft:`3px solid ${p.isDefective?T.red:p.included?T.green:T.border}` }}>
              {/* Part header row */}
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                <label style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer" }}>
                  <input type="checkbox" checked={p.included}
                    onChange={e=>updatePart(i,"included",e.target.checked)} />
                  <span style={{ fontWeight:800,fontSize:14 }}>{p.markNo}</span>
                  {p.desc&&<span style={{ fontSize:12,color:T.textMid }}>— {p.desc}</span>}
                </label>
                {p.included&&(
                  <label style={{ display:"flex",alignItems:"center",gap:6,cursor:"pointer",
                    fontSize:12,color:T.red }}>
                    <input type="checkbox" checked={p.isDefective}
                      onChange={e=>updatePart(i,"isDefective",e.target.checked)} />
                    Defective
                  </label>
                )}
              </div>
              <div style={{ fontSize:11,color:T.textMid,paddingLeft:24,marginTop:2,marginBottom:p.included?10:0 }}>
                {p.drawingNo&&<span>Drawing: {p.drawingNo} · </span>}
                Planned: <strong>{p.plannedQty}</strong> pcs
                {p.length>0&&<span> · Length: <span style={{fontFamily:T.fontMono}}>{p.length}mm</span></span>}
              </div>

              {/* Good piece — actual qty */}
              {p.included&&!p.isDefective&&(
                <div style={{ display:"flex",gap:12,alignItems:"flex-end",paddingLeft:24,flexWrap:"wrap" }}>
                  <Field label="Actual Qty">
                    <Input type="number" min={0} value={p.actualQty}
                      onChange={e=>updatePart(i,"actualQty",+e.target.value)}
                      style={{ width:80 }} />
                  </Field>
                  {short&&(
                    <Field label="Reason for short qty *" required>
                      <Input value={p.shortReason} onChange={e=>updatePart(i,"shortReason",e.target.value)}
                        placeholder="e.g. Material insufficient on this bar"
                        style={{ minWidth:240,borderColor:!p.shortReason?T.red:T.border }} />
                    </Field>
                  )}
                  {over&&<div style={{ fontSize:12,color:T.amber,fontWeight:700,paddingBottom:6 }}>
                    ⚠ Actual exceeds planned qty
                  </div>}
                </div>
              )}

              {/* Defective piece */}
              {p.included&&p.isDefective&&(
                <div style={{ paddingLeft:24 }}>
                  <div style={{ display:"flex",gap:12,marginBottom:8,flexWrap:"wrap" }}>
                    <Field label="Defect Type">
                      <Sel value={p.defectType} onChange={e=>updatePart(i,"defectType",e.target.value)}
                        style={{width:160}}>
                        <option value="dimensional">Dimensional</option>
                        <option value="surface">Surface</option>
                        <option value="wrong_cut">Wrong Cut</option>
                        <option value="damaged">Damaged</option>
                        <option value="other">Other</option>
                      </Sel>
                    </Field>
                    <Field label="Defect Reason *" required>
                      <Input value={p.defectReason} onChange={e=>updatePart(i,"defectReason",e.target.value)}
                        placeholder="Describe the defect" style={{ minWidth:240 }} />
                    </Field>
                  </div>
                  <div style={{ marginBottom:8 }}>
                    <label style={css.label}>Action Required</label>
                    <select value={p.defectAction||""} onChange={e=>updatePart(i,"defectAction",e.target.value)} style={css.input}>
                      <option value="">Select action...</option>
                      <option value="scrap_recut">Scrap &amp; Re-cut</option>
                      <option value="rectify">Rectify</option>
                      <option value="accept_deviation">Accept Deviation</option>
                    </select>
                  </div>
                  {repl
                    ? <div style={{ padding:"8px 12px",background:T.greenBg,border:`1px solid ${T.green}`,
                        borderRadius:6,fontSize:12,color:T.green }}>
                        ✓ Replacement available: Off-cut <strong style={{fontFamily:T.fontMono}}>{repl.lotNo}</strong> ({repl.offcutLength}mm) can yield a replacement piece of <strong>{p.markNo}</strong> ({p.length}mm required).
                      </div>
                    : <div style={{ padding:"8px 12px",background:T.amberBg,border:`1px solid ${T.amber}`,
                        borderRadius:6,fontSize:12,color:T.amber }}>
                        ⚠ No matching off-cut found for <strong>{p.markNo}</strong>. A new nesting run will be required to replace this piece.
                      </div>
                  }
                </div>
              )}

              {/* Piece marking */}
              {p.included && !p.isDefective && (() => {
                const sectionType = p.sectionType||"";
                const stampLoc = productionStandards ? getStampLocation(sectionType, productionStandards) : "Top face, centre of piece";
                const stampText = `${p.markNo} / ${p.drawingNo}`;
                return (
                  <div style={{ marginTop:8, padding:"8px 10px", background:p.markingConfirmed?T.greenBg:T.redBg, border:`1px solid ${p.markingConfirmed?T.green:T.red}44`, borderRadius:5 }}>
                    <label style={{ display:"flex", alignItems:"flex-start", gap:8, cursor:"pointer" }}>
                      <input type="checkbox" checked={!!p.markingConfirmed}
                        onChange={e=>updatePart(i,"markingConfirmed",e.target.checked)}
                        style={{ width:16, height:16, marginTop:2 }} />
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:p.markingConfirmed?T.green:T.red }}>
                          Mark No stamped on all {p.actualQty||p.plannedQty} piece{(p.actualQty||p.plannedQty)!==1?"s":""}
                        </div>
                        <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>Location: {stampLoc}</div>
                        <div style={{ fontSize:11, color:T.textMid }}>Stamp text: <span style={{ fontFamily:T.fontMono }}>{stampText}</span></div>
                      </div>
                    </label>
                    {!p.markingConfirmed && (
                      <div style={{ marginTop:6 }}>
                        <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:11, color:T.amber }}>
                          <input type="checkbox" checked={!!p.markingCannotStamp}
                            onChange={e=>updatePart(i,"markingCannotStamp",e.target.checked)} />
                          Cannot stamp — enter reason
                        </label>
                        {p.markingCannotStamp && (
                          <input value={p.markingCannotStampReason||""} onChange={e=>updatePart(i,"markingCannotStampReason",e.target.value)}
                            placeholder="Reason why marking cannot be done..." style={{ ...css.input, marginTop:4, fontSize:11 }} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}

        {/* Sub-stage completion checkboxes */}
        <div style={{ ...css.card, marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.textMid, marginBottom:8 }}>SUB-STAGE COMPLETION</div>
          {[
            {key:"cut", label:"Parts cut", always:true},
            {key:"bevel", label:"Bevel complete", cap:"bevel"},
            {key:"grind", label:"Grinding / deburring complete", cap:"grind"},
            {key:"drill", label:"Drilling complete", cap:"drill"},
          ].filter(s=>s.always||(barForm.machineCaps||[]).includes(s.cap)).map(s=>(
            <label key={s.key} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, cursor:"pointer" }}>
              <input type="checkbox" checked={!!(barForm.subStageChecks||{})[s.key]} onChange={e=>setBarForm(f=>({...f,subStageChecks:{...(f.subStageChecks||{}),[s.key]:e.target.checked}}))} style={{ width:14,height:14,accentColor:T.accent }} />
              <span style={{ fontSize:12, color:T.text }}>{s.label}</span>
            </label>
          ))}
        </div>

        {/* Off-cut */}
        <div style={{ ...css.card,marginBottom:20 }}>
          <label style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer",
            fontWeight:700,marginBottom:barForm.hasOffcut?14:0 }}>
            <input type="checkbox" checked={barForm.hasOffcut}
              onChange={e=>setBarForm(f=>({...f,hasOffcut:e.target.checked}))} />
            Record Off-cut to Stores
          </label>
          {barForm.hasOffcut&&(
            <div style={{ paddingLeft:24 }}>
              <div style={{ display:"flex",gap:12,alignItems:"flex-end",flexWrap:"wrap" }}>
                {barForm.isPlate ? <>
                  <Field label="Off-cut Length (mm)">
                    <Input type="number" value={barForm.offcutLength}
                      onChange={e=>setBarForm(f=>({...f,offcutLength:e.target.value}))} style={{width:120}} />
                  </Field>
                  <Field label="Off-cut Width (mm)">
                    <Input type="number" value={barForm.offcutWidth}
                      onChange={e=>setBarForm(f=>({...f,offcutWidth:e.target.value}))} style={{width:120}} />
                  </Field>
                </> : (
                  <Field label="Remaining Length (mm)">
                    <Input type="number" value={barForm.offcutLength}
                      onChange={e=>setBarForm(f=>({...f,offcutLength:e.target.value}))} style={{width:140}} />
                  </Field>
                )}
                <div style={{ paddingBottom:12,fontSize:13,fontWeight:700,
                  color:oc>0?T.green:T.textLow }}>
                  {oc>0 ? `≈ ${oc.toFixed(1)} kg` : "Enter dimensions"}
                </div>
              </div>
              {ocTooLight&&<InfoBanner color="amber">Off-cut is below 5 kg minimum for sections — it will not be recorded as a stock lot.</InfoBanner>}
              {oc>=5&&<InfoBanner color="green">Off-cut lot will be created in Stock with status Available, inheriting QC approval from parent lot.</InfoBanner>}
            </div>
          )}
        </div>

        <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
          <button onClick={()=>setStep("bars")} style={css.btn.secondary}>Cancel</button>
          <button onClick={confirmBar} style={css.btn.primary}>✓ Confirm {selBarRef}</button>
        </div>
      </div>
    );
  }

  return null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTION: DRAWING ASSIGNMENT (Production Manager View)
// ═══════════════════════════════════════════════════════════════════════════════
const STAGE_OPTS    = [{v:"fitup",l:"Fit-Up"},{v:"welding",l:"Welding"},{v:"blasting",l:"Blasting"},{v:"painting",l:"Painting"}];
const STAGE_SEQ_LABELS = { cutting:"Cutting", fitup:"Fit-Up", welding:"Welding", tpi_weld:"TPI Weld", assembly:"Assembly", blasting:"Blasting", painting:"Painting", tpi_paint:"TPI Paint", mdcc:"MDCC", dispatch:"Dispatch" };
const SUBOPS_CUT    = ["Cut","Grind","Bevel","Drill"];
const SUBOPS_WELD   = ["SMAW","GMAW","FCAW"];

const DrawingAssignment = ({ user, drawing, order, instances, setInstances,
                              nestingRuns, stock, contractors, onBack }) => {
  const [selMarkNos, setSelMarkNos] = useState(new Set());
  const [modal, setModal]           = useState(false);
  const [assignForm, setAssignForm] = useState({ contractorId:"", stage:"fitup", subOps:[], pinnedEngineerId:"", notes:"" });
  const [toast, setToast]           = useState(null);

  const showToast = (msg, color="green") => { setToast({msg,color}); setTimeout(()=>setToast(null),3500); };
  const prodEngineers = USERS.filter(u=>u.role==="production_engineer"&&u.active);
  const parts = (order.parts||[]).filter(p=>p.drawingId===drawing.id);

  // ── Panel 1: Ready to Process ──
  const readyInst = instances.filter(i=>i.orderId===order.id&&i.drawingId===drawing.id&&i.currentStatus==="pending_collection");
  const byMarkNo  = {};
  readyInst.forEach(i=>{ if(!byMarkNo[i.markNo])byMarkNo[i.markNo]=[]; byMarkNo[i.markNo].push(i); });
  const readyGroups = Object.entries(byMarkNo).map(([markNo,insts])=>({
    markNo, count:insts.length, cuttingBayUsed:insts[0]?.cuttingBayUsed,
    batchNo:insts[0]?.batchNo, readySince:insts[0]?.stageHistory?.[0]?.signedOffDate||"",
    assigned:!!insts[0]?.assignedContractorId,
    contractorName:insts[0]?.assignedContractorName||"",
    pinnedName:insts[0]?.pinnedEngineerName||"",
  }));

  // ── Panel 2: In Cutting ──
  const confirmedRuns = nestingRuns.filter(r=>r.status==="confirmed"&&
    (r.drawings?.includes(drawing.id)||r.orders?.includes(order.id)));
  const inCuttingSet = new Set();
  confirmedRuns.forEach(run=>{
    const total = run.sheetsOrBarsUsed||0;
    const done  = (run.confirmedBars||[]).length;
    if (done < total) parts.filter(p=>p.fabType==="Fabricate"&&p.source==="Procure").forEach(p=>inCuttingSet.add(p.markNo));
  });
  const instMarkNos = new Set(instances.filter(i=>i.drawingId===drawing.id&&i.orderId===order.id).map(i=>i.markNo));
  const inCuttingParts = parts.filter(p=>p.fabType==="Fabricate"&&p.source==="Procure"&&inCuttingSet.has(p.markNo)&&!readyGroups.find(g=>g.markNo===p.markNo));

  // ── Panel 3: Not Yet Planned ──
  const notYetPlanned = parts.filter(p=>p.fabType==="Fabricate"&&p.source==="Procure"&&!instMarkNos.has(p.markNo)&&!inCuttingSet.has(p.markNo));
  const getRMStatus = (p) => {
    if (stock.some(s=>(s.allocations||[]).some(a=>a.drawingId===drawing.id&&a.markNo===p.markNo)))
      return {color:"blue",label:"Allocated"};
    if (stock.some(s=>s.status==="available"&&s.matCode===p.matCode&&(s.wtAvailable||0)>0))
      return {color:"amber",label:"In Stock"};
    return {color:"red",label:"No Stock"};
  };

  // ── Bought Out ──
  const boughtOut = parts.filter(p=>p.fabType==="Bought Out");

  const toggleMark = (m) => setSelMarkNos(prev=>{ const n=new Set(prev); n.has(m)?n.delete(m):n.add(m); return n; });

  const saveAssign = () => {
    if (!assignForm.contractorId) return showToast("Select a contractor","amber");
    const con = contractors.find(c=>c.id===assignForm.contractorId);
    const eng = prodEngineers.find(u=>u.id===assignForm.pinnedEngineerId);
    const marks = [...selMarkNos];
    setInstances(prev=>prev.map(inst=>{
      if (!marks.includes(inst.markNo)||inst.drawingId!==drawing.id||
          inst.orderId!==order.id||inst.currentStatus!=="pending_collection") return inst;
      return { ...inst,
        assignedContractorId:   assignForm.contractorId,
        assignedContractorName: con?.name||"",
        pinnedEngineerId:       assignForm.pinnedEngineerId,
        pinnedEngineerName:     eng?.name||"",
        subOpsRequired:         assignForm.subOps.length?assignForm.subOps:inst.subOpsRequired,
        assignedStage:          assignForm.stage,
        assignmentNotes:        assignForm.notes,
      };
    }));
    showToast(`${marks.length} mark number(s) assigned to ${con?.name}`);
    setSelMarkNos(new Set()); setModal(false);
  };

  const toggleSubOp = op => setAssignForm(f=>({...f, subOps:f.subOps.includes(op)?f.subOps.filter(o=>o!==op):[...f.subOps,op]}));

  const toastEl = toast && <div style={{ position:"fixed",top:20,right:20,zIndex:2000,
    background:toast.color==="green"?T.greenBg:toast.color==="amber"?T.amberBg:T.redBg,
    border:`1px solid ${toast.color==="green"?T.green:toast.color==="amber"?T.amber:T.red}`,
    borderRadius:8,padding:"12px 20px",
    color:toast.color==="green"?T.green:toast.color==="amber"?T.amber:T.red,
    fontSize:13,fontWeight:600 }}>{toast.msg}</div>;

  return (
    <div>
      {toastEl}
      <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:20 }}>
        <button onClick={onBack} style={css.btn.ghost}>← All Drawings</button>
        <div>
          <div style={{ fontSize:16,fontWeight:800,color:T.text }}>{drawing.drawingNo}</div>
          <div style={{ fontSize:12,color:T.textMid }}>{order.id} · Qty: {drawing.qty||1}</div>
        </div>
        {selMarkNos.size>0&&(
          <button onClick={()=>{setAssignForm({contractorId:"",stage:"fitup",subOps:[],pinnedEngineerId:"",notes:""});setModal(true);}}
            style={{ ...css.btn.primary,marginLeft:"auto" }}>
            Assign {selMarkNos.size} selected →
          </button>
        )}
      </div>

      {/* Panel 1 */}
      <div style={{ ...css.card,marginBottom:16,borderLeft:`3px solid ${T.green}` }}>
        <SectionHd title="Panel 1 — Ready to Process"
          sub={`${readyGroups.length} mark number${readyGroups.length!==1?"s":""} — cutting confirmed, awaiting contractor assignment`} />
        {readyGroups.length===0
          ? <div style={{ color:T.textLow,fontSize:12,padding:"4px 0" }}>No instances ready yet. Confirm a nesting run bar to create instances.</div>
          : readyGroups.map(g=>(
              <div key={g.markNo} onClick={()=>!g.assigned&&toggleMark(g.markNo)}
                style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:6,
                  marginBottom:4,cursor:g.assigned?"default":"pointer",
                  background:selMarkNos.has(g.markNo)?T.accentLo:"transparent",
                  border:`1px solid ${selMarkNos.has(g.markNo)?T.accent:T.border}` }}>
                {!g.assigned&&<input type="checkbox" checked={selMarkNos.has(g.markNo)}
                  onChange={()=>toggleMark(g.markNo)} onClick={e=>e.stopPropagation()} />}
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                    <span style={{ fontWeight:800,fontSize:14 }}>{g.markNo}</span>
                    <Badge color="green">{g.count} pcs</Badge>
                    {g.assigned&&<Badge color="blue">{g.contractorName}</Badge>}
                    {g.pinnedName&&<Badge color="amber">📌 {g.pinnedName}</Badge>}
                  </div>
                  <div style={{ fontSize:11,color:T.textMid,marginTop:2 }}>
                    Bay: {g.cuttingBayUsed||"—"} · Batch: <span style={{fontFamily:T.fontMono}}>{g.batchNo||"—"}</span>
                    {g.readySince&&` · Cut: ${g.readySince}`}
                  </div>
                </div>
              </div>
            ))
        }
        {readyGroups.length>0&&selMarkNos.size===0&&readyGroups.some(g=>!g.assigned)&&(
          <div style={{ fontSize:11,color:T.textMid,marginTop:8 }}>Tap mark numbers to select for assignment.</div>
        )}
      </div>

      {/* Panel 2 */}
      <div style={{ ...css.card,marginBottom:16,borderLeft:`3px solid ${T.amber}` }}>
        <SectionHd title="Panel 2 — In Cutting"
          sub="Parts on a confirmed nesting run — bars not yet fully confirmed" />
        {inCuttingParts.length===0
          ? <div style={{ color:T.textLow,fontSize:12,padding:"4px 0" }}>No parts currently in cutting.</div>
          : inCuttingParts.map(p=>{
              const run = confirmedRuns.find(r=>r.drawings?.includes(drawing.id)||r.orders?.includes(order.id));
              return (
                <div key={p.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"8px 12px",border:`1px solid ${T.border}`,borderRadius:6,marginBottom:4 }}>
                  <div>
                    <span style={{ fontWeight:700 }}>{p.markNo}</span>
                    {p.desc&&<span style={{ fontSize:12,color:T.textMid,marginLeft:8 }}>{p.desc}</span>}
                    <div style={{ fontSize:11,color:T.textMid,marginTop:2 }}>{p.qtyPerDrg} pcs · {p.matCode||`${p.section} ${p.size}`}</div>
                  </div>
                  <div style={{ fontSize:12,textAlign:"right" }}>
                    {run&&<div style={{ fontFamily:T.fontMono,color:T.accent,fontSize:11 }}>{run.id}</div>}
                    <div style={{ color:T.textMid }}>
                      {run&&`${(run.confirmedBars||[]).length}/${run.sheetsOrBarsUsed} bars cut`}
                    </div>
                  </div>
                </div>
              );
            })
        }
      </div>

      {/* Panel 3 */}
      <div style={{ ...css.card,marginBottom:16,borderLeft:`3px solid ${T.border}` }}>
        <SectionHd title="Panel 3 — Not Yet Planned"
          sub="Parts with no nesting run — these are blocking production" />
        {notYetPlanned.length===0
          ? <div style={{ color:T.textLow,fontSize:12,padding:"4px 0" }}>All fabrication parts are planned or in cutting.</div>
          : notYetPlanned.map(p=>{
              const rm = getRMStatus(p);
              return (
                <div key={p.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"8px 12px",border:`1px solid ${T.border}`,borderRadius:6,marginBottom:4 }}>
                  <div>
                    <span style={{ fontWeight:700 }}>{p.markNo}</span>
                    {p.desc&&<span style={{ fontSize:12,color:T.textMid,marginLeft:8 }}>{p.desc}</span>}
                    <div style={{ fontSize:11,color:T.textMid,marginTop:2 }}>
                      {p.qtyPerDrg} pcs · {p.matCode||`${p.section} ${p.size}`}
                      {p.length>0&&` · ${p.length}mm`}
                    </div>
                  </div>
                  <Badge color={rm.color}>{rm.label}</Badge>
                </div>
              );
            })
        }
      </div>

      {/* Bought Out Items */}
      {boughtOut.length>0&&(
        <div style={{ ...css.card,marginBottom:16 }}>
          <SectionHd title="Bought Out Items"
            sub={`${boughtOut.length} item${boughtOut.length!==1?"s":""} — visibility only, no production tracking`} />
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
            <thead><tr><TH>Mark No</TH><TH>Description</TH><TH>Size</TH><TH right>Qty</TH><TH>Issue Status</TH></tr></thead>
            <tbody>
              {boughtOut.map(p=>{
                const issued = stock.some(s=>(s.issues||[]).some(iss=>iss.drawingId===drawing.id));
                return (
                  <tr key={p.id}>
                    <TD bold>{p.markNo}</TD><TD>{p.desc}</TD>
                    <TD mono>{p.size||"—"}</TD><TD right>{p.qtyPerDrg}</TD>
                    <TD><Badge color={issued?"green":"gray"}>{issued?"Issued from Stores":"Not Issued"}</Badge></TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Assignment Modal */}
      {modal&&(
        <Modal title={`Assign ${selMarkNos.size} Mark Number${selMarkNos.size!==1?"s":""}`} onClose={()=>setModal(false)} width={540}>
          <InfoBanner color="blue">Assigning: <strong>{[...selMarkNos].join(", ")}</strong></InfoBanner>
          <MField label="Contractor / Team *">
            <select value={assignForm.contractorId}
              onChange={e=>setAssignForm(f=>({...f,contractorId:e.target.value}))}
              style={{ ...css.input,borderColor:!assignForm.contractorId?T.red:T.border }}>
              <option value="">Select contractor...</option>
              {contractors.filter(c=>c.active).map(c=>(
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </MField>
          <MField label="Stage Starting From">
            <select value={assignForm.stage} onChange={e=>setAssignForm(f=>({...f,stage:e.target.value}))} style={css.input}>
              {STAGE_OPTS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </MField>
          <MField label="Sub-Operations Required">
            <div style={{ fontSize:11,color:T.textMid,marginBottom:6,fontWeight:700 }}>CUTTING</div>
            <div style={{ display:"flex",gap:20,marginBottom:12 }}>
              {SUBOPS_CUT.map(op=>(
                <label key={op} style={{ display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13 }}>
                  <input type="checkbox" checked={assignForm.subOps.includes(op)} onChange={()=>toggleSubOp(op)} />{op}
                </label>
              ))}
            </div>
            <div style={{ fontSize:11,color:T.textMid,marginBottom:6,fontWeight:700 }}>WELDING PROCESS</div>
            <div style={{ display:"flex",gap:20 }}>
              {SUBOPS_WELD.map(op=>(
                <label key={op} style={{ display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13 }}>
                  <input type="checkbox" checked={assignForm.subOps.includes(op)} onChange={()=>toggleSubOp(op)} />{op}
                </label>
              ))}
            </div>
          </MField>
          <MField label="Pin to Production Engineer (optional)">
            <select value={assignForm.pinnedEngineerId}
              onChange={e=>setAssignForm(f=>({...f,pinnedEngineerId:e.target.value}))} style={css.input}>
              <option value="">None — shared queue only</option>
              {prodEngineers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </MField>
          <MField label="Working Notes">
            <Textarea value={assignForm.notes} onChange={e=>setAssignForm(f=>({...f,notes:e.target.value}))}
              placeholder="Instructions or notes for the contractor..." rows={2} />
          </MField>
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end",marginTop:8 }}>
            <button onClick={()=>setModal(false)} style={css.btn.secondary}>Cancel</button>
            <button onClick={saveAssign} style={css.btn.primary} disabled={!assignForm.contractorId}>
              ✓ Assign {selMarkNos.size} Mark Number{selMarkNos.size!==1?"s":""}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STAGE WORKER QUEUE (blasting_engineer / painting_engineer)
// ═══════════════════════════════════════════════════════════════════════════════
const ROLE_STAGE_MAP = { blasting_engineer:"blasting", painting_engineer:"painting" };
const StageWorkerQueue = ({ user, instances, setInstances }) => {
  const stage = ROLE_STAGE_MAP[user.role];
  const stageLabel = stage ? (stage.charAt(0).toUpperCase()+stage.slice(1)) : "";
  const my      = instances.filter(i => i.currentStage === stage &&
    ["pending_collection","in_progress","pending_supervisor"].includes(i.currentStatus));
  const pending = my.filter(i => i.currentStatus === "pending_collection");
  const inProg  = my.filter(i => i.currentStatus === "in_progress");
  const pendSup = my.filter(i => i.currentStatus === "pending_supervisor");
  const done    = instances.filter(i => i.currentStage === stage && i.currentStatus === "completed").slice(-5);

  const upd = (id, patch) => setInstances(prev => prev.map(i => i.id===id ? {...i,...patch} : i));
  const collect = id => upd(id, { currentStatus:"in_progress", collectedAt:today() });
  const complete = id => upd(id, { currentStatus:"pending_supervisor", stageCompletedAt:today() });

  const rowStyle = { padding:"10px 14px", borderBottom:`1px solid ${T.border}`, display:"grid",
    gridTemplateColumns:"1fr 1fr 1fr auto", gap:8, alignItems:"center", fontSize:13 };

  const section = (title, color, items, action) => items.length === 0 ? null : (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontWeight:600, fontSize:12, color:T[color]||T.textMid, textTransform:"uppercase",
        letterSpacing:1, padding:"6px 14px", background:T.surfaceHi, borderBottom:`1px solid ${T.border}` }}>
        {title} ({items.length})
      </div>
      {items.map(i => (
        <div key={i.id} style={rowStyle}>
          <span style={{ fontWeight:600 }}>{i.markNo} <span style={{ fontWeight:400, color:T.textMid }}>× {i.qty||1}</span></span>
          <span style={{ color:T.textMid }}>{i.drawingNo||i.drawingId}</span>
          <span style={{ color:T.textLow, fontSize:12 }}>{i.orderId}</span>
          {action && <button onClick={()=>action(i.id)} style={{ ...css.btn.sm, background:T.accentLo, color:T.accent, border:`1px solid ${T.accent}` }}>{action===collect?"Collect":"Complete"}</button>}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding:20, maxWidth:900 }}>
      <SectionHd title={`My ${stageLabel} Work Queue`} sub={`Logged in as ${user.name}`} />
      {my.length === 0 && done.length === 0 && (
        <InfoBanner color="blue">No {stageLabel} work currently assigned to you.</InfoBanner>
      )}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden", marginBottom:16 }}>
        {section(`Pending Collection`, "amber", pending, collect)}
        {section(`In Progress`, "accent", inProg, complete)}
        {section(`Awaiting Supervisor`, "textMid", pendSup, null)}
      </div>
      {done.length > 0 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden" }}>
          <div style={{ fontWeight:600, fontSize:12, color:T.green, textTransform:"uppercase",
            letterSpacing:1, padding:"6px 14px", background:T.surfaceHi, borderBottom:`1px solid ${T.border}` }}>
            Recently Completed (last 5)
          </div>
          {done.map(i => (
            <div key={i.id} style={rowStyle}>
              <span style={{ fontWeight:600 }}>{i.markNo}</span>
              <span style={{ color:T.textMid }}>{i.drawingNo||i.drawingId}</span>
              <span style={{ color:T.textLow, fontSize:12 }}>{i.orderId}</span>
              <Badge color="green">Done</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTION STEP 5: CONTRACTOR WORK QUEUE
// ═══════════════════════════════════════════════════════════════════════════════
const ContractorWorkQueue = ({ user, instances, setInstances, releases }) => {
  const [selGroup, setSelGroup]       = useState(null);
  const [subOpChecks, setSubOpChecks] = useState({});

  const cid = user.contractorId;
  const my      = instances.filter(i => i.assignedContractorId === cid);
  const pending  = my.filter(i => i.currentStatus === "pending_collection");
  const inProg   = my.filter(i => i.currentStatus === "in_progress");
  const pendSup  = my.filter(i => i.currentStatus === "pending_supervisor");
  const outbound = my.filter(i => i.currentStatus === "outbound");
  const done     = my.filter(i => i.currentStatus === "completed").slice(-10);

  // Group pending_collection by nestingRunId+barRef
  const collGroups = {};
  pending.forEach(i => {
    const k = `${i.nestingRunId||""}/${i.barRef||""}`;
    if (!collGroups[k]) collGroups[k] = { key:k, nestingRunId:i.nestingRunId, barRef:i.barRef, cuttingBayUsed:i.cuttingBayUsed, drawingNo:i.drawingNo, orderId:i.orderId, parts:{} };
    if (!collGroups[k].parts[i.markNo]) collGroups[k].parts[i.markNo] = { markNo:i.markNo, desc:i.desc, insts:[] };
    collGroups[k].parts[i.markNo].insts.push(i);
  });

  // Group in_progress by markNo+drawingId+orderId
  const inProgGroups = {};
  inProg.forEach(i => {
    const k = `${i.markNo}/${i.drawingId}/${i.orderId}`;
    if (!inProgGroups[k]) inProgGroups[k] = { key:k, markNo:i.markNo, desc:i.desc, drawingId:i.drawingId, drawingNo:i.drawingNo, orderId:i.orderId, assignedStage:i.assignedStage||i.currentStage, subOpsRequired:i.subOpsRequired||[], insts:[], lastRejection:null };
    inProgGroups[k].insts.push(i);
    // Capture latest rejection reason for current stage
    const rejStageHist = (i.stageHistory||[]).filter(h => h.stage === (i.assignedStage||i.currentStage) && (h.rejections||[]).length > 0);
    if (rejStageHist.length > 0) {
      const latestRej = rejStageHist[rejStageHist.length-1].rejections.slice(-1)[0];
      if (latestRej) inProgGroups[k].lastRejection = latestRej;
    }
  });

  const doCollect = (group) => {
    const ids = Object.values(group.parts).flatMap(p => p.insts.map(i => i.instanceId));
    setInstances(prev => prev.map(i => ids.includes(i.instanceId) ? { ...i, currentStatus:"in_progress", collectedDate:today(), collectedBy:user.username } : i));
  };

  const doMarkComplete = (group) => {
    const ids = group.insts.map(i => i.instanceId);
    const checks = subOpChecks[group.key] || {};
    const completedOps = group.subOpsRequired.filter(op => checks[op]);
    setInstances(prev => prev.map(i => {
      if (!ids.includes(i.instanceId)) return i;
      const hist = [...(i.stageHistory||[])];
      const entry = { stage:i.currentStage, markedDoneBy:user.username, markedDoneName:user.name, markedDoneDate:today(), subOpsCompleted:completedOps };
      const existIdx = hist.findIndex(h => h.stage === i.currentStage);
      if (existIdx >= 0) hist[existIdx] = { ...hist[existIdx], ...entry };
      else hist.push(entry);
      return { ...i, currentStatus:"pending_supervisor", subOpsCompleted:completedOps, stageHistory:hist };
    }));
    setSelGroup(null);
    setSubOpChecks(prev => { const n={...prev}; delete n[group.key]; return n; });
  };

  const SectionLabel = ({ title, count, color }) => (
    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10,marginTop:24 }}>
      <div style={{ fontSize:11,fontWeight:800,color:color||T.textMid,letterSpacing:"0.08em" }}>{title}</div>
      {count > 0 && <div style={{ background:color||T.textMid,color:"#000",fontSize:10,fontWeight:800,borderRadius:8,padding:"1px 6px" }}>{count}</div>}
    </div>
  );

  // ── Completion / detail view ──
  const selGD = selGroup ? inProgGroups[selGroup] : null;
  if (selGD) {
    const checks = subOpChecks[selGD.key] || {};
    const allChecked = selGD.subOpsRequired.length === 0 || selGD.subOpsRequired.every(op => checks[op]);
    const stageLabel = STAGE_SEQ_LABELS[selGD.assignedStage] || selGD.assignedStage || "Fit-Up";
    return (
      <div>
        <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:20 }}>
          <button onClick={() => setSelGroup(null)} style={css.btn.ghost}>← Back to My Work</button>
        </div>
        {selGD.lastRejection && (
          <div style={{ background:T.redBg,border:`1px solid ${T.red}`,borderRadius:8,padding:"12px 16px",marginBottom:16 }}>
            <div style={{ fontSize:11,fontWeight:800,color:T.red,marginBottom:4 }}>⚠ REJECTION — REWORK REQUIRED</div>
            <div style={{ fontSize:13,color:T.text }}>{selGD.lastRejection.reason}</div>
            {selGD.lastRejection.rejectedBy && <div style={{ fontSize:11,color:T.textMid,marginTop:4 }}>Rejected by {selGD.lastRejection.rejectedBy} on {selGD.lastRejection.date}</div>}
          </div>
        )}
        <div style={{ ...css.card,marginBottom:16 }}>
          <div style={{ fontSize:18,fontWeight:800,color:T.text,marginBottom:2,fontFamily:T.fontMono }}>{selGD.markNo}</div>
          <div style={{ fontSize:13,color:T.textMid,marginBottom:10 }}>{selGD.desc}</div>
          <div style={{ display:"flex",gap:16,flexWrap:"wrap",fontSize:12,color:T.textMid }}>
            <span>Drawing: <span style={{color:T.text,fontFamily:T.fontMono}}>{selGD.drawingNo||selGD.drawingId}</span></span>
            <span>Order: <span style={{color:T.text,fontFamily:T.fontMono}}>{selGD.orderId}</span></span>
            <span>Qty: <span style={{color:T.text,fontWeight:700}}>{selGD.insts.length} pcs</span></span>
          </div>
        </div>
        <div style={{ ...css.card,marginBottom:16 }}>
          <div style={{ fontSize:13,fontWeight:700,color:T.text,marginBottom:14 }}>STAGE: {stageLabel}</div>
          {selGD.subOpsRequired.length > 0 ? (
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {selGD.subOpsRequired.map(op => (
                <label key={op} style={{ display:"flex",alignItems:"center",gap:12,cursor:"pointer",padding:"12px 14px",background:checks[op]?T.greenBg:T.bgInput,border:`1px solid ${checks[op]?T.green:T.border}`,borderRadius:6,userSelect:"none" }}>
                  <input type="checkbox" checked={!!checks[op]}
                    onChange={e => setSubOpChecks(prev => ({...prev,[selGD.key]:{...(prev[selGD.key]||{}),[op]:e.target.checked}}))}
                    style={{ width:18,height:18,cursor:"pointer" }} />
                  <span style={{ fontSize:15,fontWeight:600,color:checks[op]?T.green:T.text }}>{op}</span>
                </label>
              ))}
            </div>
          ) : (
            <div style={{ fontSize:13,color:T.textMid }}>No specific sub-operations required for this stage.</div>
          )}
          {(STAGE_CHECKLISTS[selGD.assignedStage]||[]).length > 0 && (
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:12,fontWeight:700,color:T.textMid,marginBottom:8,letterSpacing:"0.05em" }}>STAGE CHECKLIST</div>
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {(STAGE_CHECKLISTS[selGD.assignedStage]||[]).map(item => {
                  const ck = `stage_${item}`;
                  return (
                    <label key={item} style={{ display:"flex",alignItems:"center",gap:12,cursor:"pointer",padding:"10px 14px",background:checks[ck]?T.greenBg:T.bgInput,border:`1px solid ${checks[ck]?T.green:T.border}`,borderRadius:6,userSelect:"none" }}>
                      <input type="checkbox" checked={!!checks[ck]}
                        onChange={e => setSubOpChecks(prev => ({...prev,[selGD.key]:{...(prev[selGD.key]||{}),[ck]:e.target.checked}}))}
                        style={{ width:18,height:18,cursor:"pointer" }} />
                      <span style={{ fontSize:13,color:checks[ck]?T.green:T.text }}>{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <button onClick={() => doMarkComplete(selGD)} disabled={!allChecked}
          style={{ ...css.btn.primary,width:"100%",padding:"16px 0",fontSize:16,fontWeight:800,opacity:allChecked?1:0.35 }}>
          ✓ MARK COMPLETE
        </button>
      </div>
    );
  }

  // ── Main queue view ──
  const groupAndRender = (arr, opacity=1, showRej=false) => {
    const grps = {};
    arr.forEach(i => {
      const k = `${i.markNo}/${i.drawingId}/${i.orderId}`;
      if (!grps[k]) grps[k] = { key:k, markNo:i.markNo, desc:i.desc, drawingNo:i.drawingNo, orderId:i.orderId, insts:[], lastRejection:null };
      grps[k].insts.push(i);
      if (showRej) {
        const rh = (i.stageHistory||[]).filter(h => h.stage===(i.assignedStage||i.currentStage) && (h.rejections||[]).length>0);
        if (rh.length>0) { const lr=rh[rh.length-1].rejections.slice(-1)[0]; if (lr) grps[k].lastRejection=lr; }
      }
    });
    return Object.values(grps);
  };

  const readyToCollect = pending.length;

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22,fontWeight:800,color:T.text }}>My Work</div>
        <div style={{ fontSize:13,color:T.textMid }}>{user.name}</div>
      </div>

      {/* Batch notification badge */}
      {readyToCollect > 0 && (
        <div style={{ marginBottom:12, padding:"8px 14px", background:T.greenBg, borderRadius:8, border:`1px solid ${T.green}44`, fontSize:12, color:T.green, fontWeight:600 }}>
          ✓ {readyToCollect} part{readyToCollect!==1?"s":""} ready to collect
        </div>
      )}

      {my.length === 0 && (
        <div style={{ textAlign:"center",padding:64,color:T.textLow }}>
          <div style={{ fontSize:40,marginBottom:12 }}>📋</div>
          <div style={{ fontSize:15,fontWeight:700,color:T.textMid,marginBottom:6 }}>No work assigned yet</div>
          <div style={{ fontSize:13 }}>Parts will appear here when the production manager assigns them to you.</div>
        </div>
      )}

      {/* ── READY TO COLLECT ── */}
      {Object.keys(collGroups).length > 0 && (
        <>
          <SectionLabel title="READY TO COLLECT" count={pending.length} color={T.green} />
          {Object.values(collGroups).map(g => (
            <div key={g.key} style={{ ...css.card,border:`1px solid ${T.green}44`,marginBottom:10 }}>
              <div style={{ fontSize:11,fontWeight:800,color:T.green,marginBottom:8 }}>READY TO COLLECT</div>
              <div style={{ fontFamily:T.fontMono,fontSize:12,color:T.textMid,marginBottom:2 }}>
                {g.nestingRunId} / {g.barRef} &nbsp;·&nbsp; Bay: <span style={{color:T.text}}>{g.cuttingBayUsed||"—"}</span>
              </div>
              <div style={{ fontSize:11,color:T.textMid,marginBottom:12 }}>
                Drawing: {g.drawingNo||"—"} / Order: {g.orderId}
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:6,marginBottom:14 }}>
                {Object.values(g.parts).map(p => (
                  <div key={p.markNo} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:T.bgInput,borderRadius:5 }}>
                    <div>
                      <span style={{ fontWeight:700,color:T.text,fontFamily:T.fontMono }}>{p.markNo}</span>
                      <span style={{ color:T.textMid,marginLeft:10,fontSize:12 }}>{p.desc}</span>
                    </div>
                    <span style={{ fontSize:12,fontWeight:700,color:T.accentHi }}>{p.insts.length} pcs</span>
                  </div>
                ))}
              </div>
              <button onClick={() => doCollect(g)} style={{ ...css.btn.primary,width:"100%",padding:"12px 0",fontSize:15,fontWeight:700 }}>
                ✓ Collected
              </button>
            </div>
          ))}
        </>
      )}

      {/* ── IN PROGRESS ── */}
      {inProg.length > 0 && (
        <>
          <SectionLabel title="IN PROGRESS" count={inProg.length} color={T.accent} />
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {groupAndRender(inProg, 1, true).map(g => {
              const hasRej = !!g.lastRejection;
              return (
                <div key={g.key} onClick={() => setSelGroup(g.key)}
                  style={{ ...css.card,cursor:"pointer",border:`1px solid ${hasRej?T.red:T.border}` }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=hasRej?T.red:T.borderHi}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=hasRej?T.red:T.border}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <div>
                      {hasRej && <div style={{ fontSize:11,fontWeight:800,color:T.red,marginBottom:4 }}>⚠ REWORK REQUIRED</div>}
                      <div style={{ fontWeight:800,fontSize:14,color:T.text,fontFamily:T.fontMono }}>{g.markNo}</div>
                      <div style={{ fontSize:12,color:T.textMid,marginTop:2 }}>{g.desc} · {g.insts.length} pcs · {g.drawingNo||g.drawingId}</div>
                      <div style={{ display:"flex",gap:6,marginTop:6 }}>
                        {inProgGroups[g.key] && <Badge color="blue">{STAGE_SEQ_LABELS[inProgGroups[g.key].assignedStage]||inProgGroups[g.key].assignedStage||"Fit-Up"}</Badge>}
                        {inProgGroups[g.key]?.subOpsRequired?.length > 0 && <Badge color="gray">{inProgGroups[g.key].subOpsRequired.join(", ")}</Badge>}
                      </div>
                    </div>
                    <div style={{ fontSize:22,color:T.textLow }}>›</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── PENDING SUPERVISOR ── */}
      {pendSup.length > 0 && (
        <>
          <SectionLabel title="PENDING SUPERVISOR" count={pendSup.length} color={T.amber} />
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            {groupAndRender(pendSup).map(g => (
              <div key={g.key} style={{ ...css.card,opacity:0.7 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:700,fontSize:13,color:T.text,fontFamily:T.fontMono }}>{g.markNo}</div>
                    <div style={{ fontSize:12,color:T.textMid }}>{g.desc} · {g.insts.length} pcs · {g.drawingNo||g.drawingId}</div>
                  </div>
                  <Badge color="amber">Awaiting sign-off</Badge>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── OUTBOUND ── */}
      {outbound.length > 0 && (
        <>
          <SectionLabel title="OUTBOUND PROCESSING" count={outbound.length} color={T.amber} />
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            {groupAndRender(outbound).map(g => {
              const lastOb = g.insts[0]?.outboundHistory?.slice(-1)[0];
              return (
                <div key={g.key} style={{ ...css.card, border:`1px solid ${T.amber}44` }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <div>
                      <div style={{ fontWeight:700,fontSize:13,color:T.text,fontFamily:T.fontMono }}>{g.markNo}</div>
                      <div style={{ fontSize:12,color:T.textMid }}>{g.desc} · {g.insts.length} pcs</div>
                      {lastOb && <div style={{ fontSize:11,color:T.amber,marginTop:4 }}>
                        {lastOb.type} @ {lastOb.vendorName||"Vendor"}{lastOb.expectedReturn ? ` · Due: ${lastOb.expectedReturn}` : ""}
                      </div>}
                    </div>
                    <Badge color="amber">Outbound</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── COMPLETED (recent) ── */}
      {done.length > 0 && (
        <>
          <SectionLabel title="COMPLETED" count={done.length} color={T.green} />
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            {groupAndRender(done).map(g => (
              <div key={g.key} style={{ ...css.card,opacity:0.5 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:700,fontSize:13,color:T.text,fontFamily:T.fontMono }}>{g.markNo}</div>
                    <div style={{ fontSize:12,color:T.textMid }}>{g.desc} · {g.insts.length} pcs</div>
                  </div>
                  <Badge color="green">Done</Badge>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── WAITING FOR CUTTING ── */}
      {(() => {
        const waitingDrawings = [];
        (releases||[]).forEach(rel => {
          (rel.drawings||[]).forEach(d => {
            if (d.contractorId === cid) {
              const hasInst = instances.some(i => i.drawingId === d.drawingId && i.currentStatus !== "defective");
              if (!hasInst) waitingDrawings.push({ ...d, releaseId: rel.id });
            }
          });
        });
        if (waitingDrawings.length === 0) return null;
        return (
          <>
            <SectionLabel title="WAITING FOR CUTTING" count={waitingDrawings.length} color={T.textLow} />
            {/* Ready to collect batch notification */}
            {(() => {
              const readyCount = (instances||[]).filter(i=>
                i.assignedContractorId === cid &&
                ['fitup','welding'].includes(i.currentStage)
              ).length;
              if (readyCount === 0) return null;
              return (
                <div style={{background:'#16a34a22',border:'1px solid #16a34a',borderRadius:6,padding:'8px 14px',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                  <span style={{color:'#22c55e',fontWeight:700,fontSize:14}}>●</span>
                  <span style={{color:'#22c55e',fontWeight:600}}>{readyCount} part{readyCount>1?'s':''} cut and cleared — ready to collect</span>
                </div>
              );
            })()}
            <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
              {waitingDrawings.map((drg,i) => {
                const drgInstances = (instances||[]).filter(inst=>inst.drawingId===drg.drawingId && inst.orderId===drg.orderId);
                const cutCleared = drgInstances.filter(inst=>['fitup','welding','tpi_weld','assembly','blasting','painting','tpi_paint','mdcc','dispatch','complete'].includes(inst.currentStage)).length;
                const cuttingInProg = drgInstances.filter(inst=>['cutting','cutting_qc'].includes(inst.currentStage)).length;
                const notStarted = Math.max(0, (drg.qty||0) - drgInstances.length);
                return (
                  <div key={i} style={{ ...css.card,border:`1px solid ${T.border}` }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                      <div>
                        <div style={{ fontWeight:700,fontSize:13,color:T.textMid,fontFamily:T.fontMono,display:'flex',alignItems:'center',flexWrap:'wrap',gap:4 }}>
                          {drg.drawingNo||drg.drawingId}
                          {drg.assemblyGroup && (
                            <span style={{fontSize:11,background:'#7c3aed22',border:'1px solid #7c3aed',color:'#a78bfa',borderRadius:4,padding:'1px 6px',marginLeft:4}}>
                              {drg.assemblyGroup}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize:12,color:T.textLow }}>Release: {drg.releaseId}{drg.qty ? ` · Qty: ${drg.qty}` : ''}</div>
                      </div>
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <Badge color="gray">Waiting</Badge>
                      </div>
                    </div>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,marginTop:8}}>
                      <tbody>
                        {[
                          ['Cut and QC cleared — ready to collect', cutCleared, '#22c55e'],
                          ['Cutting in progress', cuttingInProg, '#3b82f6'],
                          ['Cut not started', notStarted, '#6b7280'],
                        ].map(([label,count,col])=>(
                          <tr key={label} style={{borderBottom:'1px solid #222'}}>
                            <td style={{padding:'3px 6px',color:'#ccc'}}>{label}</td>
                            <td style={{padding:'3px 6px',textAlign:'right',fontWeight:600,color:col}}>
                              {count}/{drg.qty||0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTION STEP 6: SUPERVISOR SOFT GATE
// ═══════════════════════════════════════════════════════════════════════════════
const TPI_STAGES = ["tpi_weld","tpi_paint","tpi_fitup","tpi_blast"];

const STAGE_NEXT = {
  cutting:"cutting_qc", cutting_qc:"fitup", fitup:"welding", welding:"tpi_weld", tpi_weld:"blasting",
  tpi_fitup:"welding", assembly:"blasting", blasting:"painting", tpi_blast:"painting",
  painting:"tpi_paint", tpi_paint:"mdcc", mdcc:"dispatch", dispatch:null,
};

const STAGE_CHECKLISTS = {
  cutting_qc: ["Length verified (±2mm)","Width/height verified","All pieces measured","Cut face smooth","Grinding complete","No heat distortion","All parts stamped","Stamp location correct","Mark legible"],
  fitup:    ["All parts present per drawing","Dimensions within tolerance","Alignment acceptable","Tack welds correctly placed","Overall length checked","Diagonal 1 checked","Diagonal 2 checked"],
  welding:  ["All joints welded","Visual weld quality acceptable","No undercutting or porosity visible","Spatter cleaned","Weld gauge reading noted","Post-weld length checked"],
  blasting: ["Surface grade achieved (Sa 2.5 / Sa 3)","No missed areas","Profile readings taken","Salt contamination checked","Re-marking verified"],
  tpi_fitup:["Fit-up inspection report reviewed","Dimensional check acceptable per report","Inspector sign-off obtained"],
  tpi_weld: ["Weld inspection report reviewed","All joints acceptable per report","NDE records complete (if required)"],
  tpi_blast:["Blasting inspection report reviewed","Surface profile readings acceptable","Salt contamination within spec"],
  tpi_paint:["Paint inspection report reviewed","DFT readings within specification","Holiday test passed"],
  mdcc:     ["MTC copies attached","TPI Weld report attached","TPI Paint report attached","Dimensional report attached","Packing list attached","Test certificates attached"],
  dispatch: ["Material loaded onto vehicle","Dispatch challan prepared","Gate pass issued"],
  assembly: ["All drawings in assembly group at Weld QC Cleared","Assembly dimensions verified per drawing","Sub-assembly fit-up acceptable","Joint preparation confirmed","Assembly marked with serial number"],
};

const SUPERVISOR_STAGES = {
  super_admin:         ["cutting_qc","fitup","welding","tpi_fitup","tpi_weld","assembly","blasting","tpi_blast","painting","tpi_paint","mdcc","dispatch"],
  production_engineer: ["cutting_qc","fitup","welding","assembly","blasting"],
  blasting_engineer:   ["blasting"],
  painting_engineer:   ["painting"],
  qc_admin:            ["cutting_qc","tpi_fitup","tpi_weld","tpi_blast","painting","tpi_paint","mdcc"],
  qc_user:             ["cutting_qc","tpi_fitup","tpi_weld","tpi_blast","painting","tpi_paint","mdcc"],
  dispatch_admin:      ["dispatch"],
};

const SupervisorQueue = ({ user, instances, setInstances, orders, tpiAgencies, releases, machines, onBack }) => {
  const [selGroup, setSelGroup]   = useState(null);
  const [checks, setChecks]       = useState({});
  const [dft, setDft]             = useState("");
  const [docRefs, setDocRefs]     = useState({});   // { [item]: "ref text" } for MDCC
  const [tpiForm, setTpiForm]     = useState({ agency:"", reportNo:"", reportDate:"", outcome:"pass" });
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [mdccRefNo, setMdccRefNo] = useState("");
  const [dimReadings, setDimReadings] = useState({});
  const [localChecks, setLocalChecks] = useState({});

  const myStages = SUPERVISOR_STAGES[user.role] || [];

  // All instances pending supervisor approval at my stages
  const myQueue = instances.filter(i =>
    i.currentStatus === "pending_supervisor" && myStages.includes(i.currentStage)
  );

  // Group by markNo+drawingId+orderId
  const groups = {};
  myQueue.forEach(i => {
    const k = `${i.markNo}/${i.drawingId}/${i.orderId}`;
    if (!groups[k]) {
      const ord = orders.find(o => o.id === i.orderId);
      groups[k] = { key:k, markNo:i.markNo, desc:i.desc, drawingId:i.drawingId, drawingNo:i.drawingNo,
        orderId:i.orderId, clientId:ord?.clientId||"", stage:i.currentStage,
        contractorName:i.assignedContractorName||"Unknown",
        pinnedEngineerId:i.pinnedEngineerId||null, isPinned:!!i.pinnedEngineerId,
        markedDoneDate: (i.stageHistory||[]).slice(-1)[0]?.markedDoneDate||"",
        batchNo:i.batchNo||"", insts:[], rejCount:0,
        weldingSequence: ord?.quality?.weldSpec?.weldingSequence||"",
        endDate: ord?.endDate||"9999-99-99",
        assignedEngineer: i.assignedEngineer||null,
      };
    }
    groups[k].insts.push(i);
    // Count rejections on current stage
    const rh = (i.stageHistory||[]).filter(h=>h.stage===i.currentStage);
    if (rh.length>0) groups[k].rejCount = Math.max(groups[k].rejCount, (rh[rh.length-1].rejections||[]).length);
  });

  // Sort: pinned first, then by rejection count desc, then by dispatch date asc (most urgent first)
  const sortedGroups = Object.values(groups)
    // QC engineer sees only their assigned jobs
    .filter(g => user.role !== 'qc_user' || (g.assignedEngineer === user.id || g.assignedEngineer === user.username))
    .sort((a,b)=>{
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (b.rejCount !== a.rejCount) return b.rejCount - a.rejCount;
      return (a.endDate||"") < (b.endDate||"") ? -1 : 1;
    });

  const resetApproval = () => { setChecks({}); setDft(""); setDocRefs({}); setTpiForm({agency:"",reportNo:"",reportDate:"",outcome:"pass"}); setRejectMode(false); setRejectReason(""); setMdccRefNo(""); setDimReadings({}); setLocalChecks({}); };

  const doApprove = (group, remarks) => {
    const stage = group.stage;
    const isTpi = TPI_STAGES.includes(stage);
    const orderForGroup = orders.find(o=>o.id===group.orderId);
    const orderQuality = orderForGroup?.quality||{};
    let nextStage = STAGE_NEXT[stage];
    if (stage==="fitup") {
      nextStage = (orderQuality.tpiHoldPoints||[]).includes('fit_up') ? 'tpi_fitup' : 'welding';
    } else if (stage==="tpi_weld") {
      const drg = orderForGroup?.drawings?.find(d=>d.id===group.drawingId);
      nextStage = drg?.assemblyGroup ? 'assembly' : 'blasting';
    } else if (stage==="welding") {
      const drg = orderForGroup?.drawings?.find(d=>d.id===group.drawingId);
      if (!((orderQuality.tpiHoldPoints||[]).includes('welding')) && drg?.assemblyGroup) {
        nextStage = 'assembly';
      }
    } else if (stage==="blasting") {
      nextStage = (orderQuality.tpiHoldPoints||[]).includes('blasting') ? 'tpi_blast' : 'painting';
    }
    if (stage === 'assembly') {
      // Check if this drawing's assembly has tpiRequired
      const orderForGrp = orders.find(o=>o.id===group.orderId);
      const drg = orderForGrp?.drawings?.find(d=>d.id===group.drawingId);
      const asmDef = (orderForGrp?.assemblies||[]).find(a=>(a.drawingsAssigned||[]).includes(group.drawingId));
      if (asmDef?.tpiRequired) {
        if (!localChecks?.assemblyTpiApproved) {
          alert('TPI approval required for this assembly before proceeding to Blasting');
          return;
        }
      }
    }
    const ids = group.insts.map(i=>i.instanceId);
    const checkedItems = Object.keys(checks).filter(k=>checks[k]);
    setInstances(prev => prev.map(i => {
      if (!ids.includes(i.instanceId)) return i;
      const hist = [...(i.stageHistory||[])];
      const idx = hist.findIndex(h=>h.stage===stage);
      const entry = { stage, signedOffBy:user.username, signedOffName:user.name, signedOffDate:today(),
        checklistItems:checkedItems, dftReading:dft||null, docRefs:docRefs||{}, remarks:remarks||"",
        dimReadings: Object.keys(dimReadings).length>0 ? Object.entries(dimReadings).map(([markNo,measuredMm])=>({markNo,measuredMm:+measuredMm})) : undefined,
        ...(isTpi ? { tpiAgency:tpiForm.agency, tpiReportNo:tpiForm.reportNo, tpiReportDate:tpiForm.reportDate, tpiOutcome:tpiForm.outcome } : {}),
        ...(stage==="mdcc" ? { mdccRefNo } : {}),
      };
      if (idx>=0) hist[idx]={...hist[idx],...entry}; else hist.push(entry);
      return {
        ...i,
        currentStage: nextStage || stage,
        currentStatus: nextStage ? "in_progress" : "completed",
        stageHistory: hist,
      };
    }));
    resetApproval();
    setSelGroup(null);
  };

  const doTpiFail = (group) => {
    // TPI hard gate fail — treated as rejection with auto-reason
    const stage = group.stage;
    const ids = group.insts.map(i=>i.instanceId);
    const failReason = `TPI Inspection FAILED — Agency: ${tpiForm.agency}, Report No: ${tpiForm.reportNo}, Date: ${tpiForm.reportDate}. Rework required before re-inspection.`;
    setInstances(prev => prev.map(i => {
      if (!ids.includes(i.instanceId)) return i;
      const hist = [...(i.stageHistory||[])];
      const idx = hist.findIndex(h=>h.stage===stage);
      const rejEntry = { rejectedBy:user.username, rejectedName:user.name, date:today(), reason:failReason, isTpiFail:true };
      const tpiEntry = { stage, tpiAgency:tpiForm.agency, tpiReportNo:tpiForm.reportNo, tpiReportDate:tpiForm.reportDate, tpiOutcome:"fail" };
      if (idx>=0) { const prevRejs=hist[idx].rejections||[]; hist[idx]={...hist[idx],...tpiEntry,rejections:[...prevRejs,rejEntry]}; }
      else hist.push({ ...tpiEntry, rejections:[rejEntry] });
      return { ...i, currentStatus:"in_progress", stageHistory:hist, rejectionCount:(i.rejectionCount||0)+1, qualityConcernFlag:true };
    }));
    resetApproval();
    setSelGroup(null);
  };

  const doReject = (group) => {
    if (!rejectReason.trim()) return;
    const stage = group.stage;
    const ids = group.insts.map(i=>i.instanceId);
    setInstances(prev => prev.map(i => {
      if (!ids.includes(i.instanceId)) return i;
      const hist = [...(i.stageHistory||[])];
      const idx = hist.findIndex(h=>h.stage===stage);
      const rejEntry = { rejectedBy:user.username, rejectedName:user.name, date:today(), reason:rejectReason.trim() };
      let newRejCount = 1;
      if (idx>=0) {
        const prevRejs = hist[idx].rejections||[];
        newRejCount = prevRejs.length + 1;
        hist[idx] = { ...hist[idx], rejections:[...prevRejs, rejEntry] };
      } else {
        hist.push({ stage, rejections:[rejEntry] });
      }
      const qualityFlag = newRejCount >= 2;
      return {
        ...i,
        currentStatus: "in_progress",
        stageHistory: hist,
        rejectionCount: (i.rejectionCount||0)+1,
        qualityConcernFlag: qualityFlag,
      };
    }));
    resetApproval();
    setSelGroup(null);
  };

  // ── Detail / checklist view ──
  const selGD = selGroup ? groups[selGroup] : null;
  if (selGD) {
    const stage = selGD.stage;
    const isTpi  = TPI_STAGES.includes(stage);
    const isMdcc = stage==="mdcc";
    const isPainting = stage==="painting";
    // MDCC checklist driven by order's mdccDocs; fall back to static list
    const orderForMdcc = isMdcc ? orders.find(o=>o.id===selGD.orderId) : null;
    const mdccOrderDocs = orderForMdcc?.quality?.mdccDocs?.map(d=>d.docName||"").filter(Boolean)||[];
    const checklist = isMdcc
      ? (mdccOrderDocs.length > 0 ? mdccOrderDocs : STAGE_CHECKLISTS.mdcc)
      : (STAGE_CHECKLISTS[stage] || []);
    const tpiDetailsOk = !isTpi || (tpiForm.agency&&tpiForm.reportNo&&tpiForm.reportDate);
    const mdccOk = !isMdcc || mdccRefNo.trim().length > 0;
    const allChecked = checklist.every(item=>checks[item]) && tpiDetailsOk && mdccOk;

    return (
      <div>
        <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:20 }}>
          <button onClick={()=>{resetApproval();setSelGroup(null);}} style={css.btn.ghost}>← Approval Queue</button>
        </div>
        {selGD.rejCount>=2&&(
          <div style={{ background:T.redBg,border:`1px solid ${T.red}`,borderRadius:8,padding:"10px 14px",marginBottom:14 }}>
            <div style={{ fontSize:11,fontWeight:800,color:T.red }}>⚠ QUALITY CONCERN — {selGD.rejCount} REJECTIONS ON THIS STAGE</div>
          </div>
        )}
        {/* Instance info */}
        <div style={{ ...css.card,marginBottom:14 }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12 }}>
            <div><div style={{color:T.textMid,fontSize:10,fontWeight:700,marginBottom:2}}>MARK NO</div><div style={{color:T.text,fontFamily:T.fontMono,fontWeight:800,fontSize:15}}>{selGD.markNo}</div></div>
            <div><div style={{color:T.textMid,fontSize:10,fontWeight:700,marginBottom:2}}>STAGE</div><div><Badge color="blue">{STAGE_SEQ_LABELS[stage]}</Badge></div></div>
            <div><div style={{color:T.textMid,fontSize:10,fontWeight:700,marginBottom:2}}>DESCRIPTION</div><div style={{color:T.text}}>{selGD.desc}</div></div>
            <div><div style={{color:T.textMid,fontSize:10,fontWeight:700,marginBottom:2}}>QTY</div><div style={{color:T.text,fontWeight:700}}>{selGD.insts.length} pcs</div></div>
            <div><div style={{color:T.textMid,fontSize:10,fontWeight:700,marginBottom:2}}>DRAWING</div><div style={{color:T.text,fontFamily:T.fontMono}}>{selGD.drawingNo}</div></div>
            <div><div style={{color:T.textMid,fontSize:10,fontWeight:700,marginBottom:2}}>ORDER</div><div style={{color:T.text,fontFamily:T.fontMono}}>{selGD.orderId}</div></div>
            <div><div style={{color:T.textMid,fontSize:10,fontWeight:700,marginBottom:2}}>CONTRACTOR</div><div style={{color:T.text}}>{selGD.contractorName}</div></div>
            <div><div style={{color:T.textMid,fontSize:10,fontWeight:700,marginBottom:2}}>BATCH NO</div><div style={{color:T.text,fontFamily:T.fontMono}}>{selGD.batchNo||"—"}</div></div>
          </div>
        </div>
        {/* Welding sequence reference (shown for welding stage if set) */}
        {stage==="welding" && selGD.weldingSequence && (
          <div style={{ ...css.card, marginBottom:14, border:`1px solid ${T.accent}44`, background:T.bgInput }}>
            <div style={{ fontSize:11, fontWeight:800, color:T.accent, marginBottom:6 }}>WELDING SEQUENCE INSTRUCTIONS FROM QC</div>
            <div style={{ fontSize:12, color:T.text, whiteSpace:"pre-wrap" }}>{selGD.weldingSequence}</div>
          </div>
        )}
        {/* TPI hard gate panel */}
        {isTpi && (
          <div style={{ ...css.card,marginBottom:14,border:`1px solid ${T.red}55` }}>
            <div style={{ display:"flex",gap:10,alignItems:"center",marginBottom:14 }}>
              <div style={{ background:T.red,color:"#fff",fontSize:10,fontWeight:800,borderRadius:4,padding:"2px 8px",letterSpacing:"0.05em" }}>HARD GATE</div>
              <div style={{ fontSize:13,fontWeight:700,color:T.text }}>TPI INSPECTION DETAILS — {STAGE_SEQ_LABELS[stage]}</div>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <div>
                <label style={css.label}>TPI AGENCY *</label>
                <select value={tpiForm.agency} onChange={e=>setTpiForm(p=>({...p,agency:e.target.value}))} style={css.input}>
                  <option value="">Select agency...</option>
                  {(tpiAgencies||[]).map(a=><option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label style={css.label}>REPORT NO *</label>
                <input value={tpiForm.reportNo} onChange={e=>setTpiForm(p=>({...p,reportNo:e.target.value}))} style={css.input} placeholder="e.g. TPI-2026-001" />
              </div>
              <div>
                <label style={css.label}>INSPECTION DATE *</label>
                <input type="date" value={tpiForm.reportDate} onChange={e=>setTpiForm(p=>({...p,reportDate:e.target.value}))} style={css.input} />
              </div>
              <div>
                <label style={css.label}>OUTCOME *</label>
                <select value={tpiForm.outcome} onChange={e=>setTpiForm(p=>({...p,outcome:e.target.value}))} style={css.input}>
                  <option value="pass">PASS — Proceed to {STAGE_SEQ_LABELS[STAGE_NEXT[stage]]}</option>
                  <option value="fail">FAIL — Rework required</option>
                </select>
              </div>
            </div>
            {tpiForm.outcome==="fail"&&(
              <div style={{ marginTop:12,background:T.redBg,border:`1px solid ${T.red}44`,borderRadius:6,padding:"8px 12px",fontSize:12,color:T.red }}>
                ⚠ Selecting FAIL will send all pieces back for rework. This is a hard gate — no override.
              </div>
            )}
          </div>
        )}
        {/* Stage checklist */}
        <div style={{ ...css.card,marginBottom:14 }}>
          <div style={{ fontSize:13,fontWeight:700,color:T.text,marginBottom:12 }}>INSPECTION CHECKLIST — {STAGE_SEQ_LABELS[stage]}</div>
          {checklist.length > 0 && (
            <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:isPainting?12:0 }}>
              {checklist.map(item=>(
                <div key={item} style={{ padding:"10px 12px",background:checks[item]?T.greenBg:T.bgInput,border:`1px solid ${checks[item]?T.green:T.border}`,borderRadius:6 }}>
                  <label style={{ display:"flex",alignItems:"center",gap:10,cursor:"pointer",userSelect:"none" }}>
                    <input type="checkbox" checked={!!checks[item]} onChange={e=>setChecks(prev=>({...prev,[item]:e.target.checked}))} style={{ width:16,height:16 }} />
                    <span style={{ fontSize:13,color:checks[item]?T.green:T.text,flex:1 }}>{item}</span>
                  </label>
                  {isMdcc && (
                    <input value={docRefs[item]||""} onChange={e=>setDocRefs(p=>({...p,[item]:e.target.value}))}
                      placeholder="Document ref / report no (optional)..."
                      style={{ ...css.input,marginTop:8,fontSize:11,padding:"5px 10px" }} />
                  )}
                </div>
              ))}
            </div>
          )}
          {checklist.length===0&&!isPainting&&(
            <div style={{ fontSize:13,color:T.textMid }}>No standard checklist for this stage. Add remarks before approving.</div>
          )}
        </div>
        {/* Fitup measurements */}
        {stage==="fitup" && (
          <div style={{...css.card,marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:8}}>DIMENSIONAL READINGS (mm)</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {[['fitupLength','Overall Length'],['fitupDiag1','Diagonal 1'],['fitupDiag2','Diagonal 2'],['fitupKeyPos','Key Position']].map(([k,l])=>(
                <div key={k}>
                  <label style={{fontSize:11,color:T.textMid,display:'block',marginBottom:2}}>{l}</label>
                  <input type="number" value={docRefs[k]||''} onChange={e=>setDocRefs(p=>({...p,[k]:e.target.value}))} placeholder="mm" style={{...css.input,width:'100%'}} />
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Fitup: tack weld verification + piece marking + welding sequence */}
        {stage === 'fitup' && <>
          <div style={{...css.card,marginBottom:14}}>
            <div style={{fontWeight:600,marginBottom:6,fontSize:13}}>Tack Weld Verification</div>
            {['Tack weld size acceptable','Tack weld spacing per procedure','No cracks in tack welds'].map((item,i)=>(
              <label key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,cursor:'pointer'}}>
                <input type="checkbox" checked={!!(localChecks||{})[`tw_${i}`]}
                  onChange={e=>setLocalChecks(c=>({...c,[`tw_${i}`]:e.target.checked}))} />
                <span style={{fontSize:13}}>{item}</span>
              </label>
            ))}
            <div style={{fontWeight:600,marginTop:10,marginBottom:6,fontSize:13}}>Piece Marking</div>
            {['Piece marking present and legible','Mark matches drawing number'].map((item,i)=>(
              <label key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,cursor:'pointer'}}>
                <input type="checkbox" checked={!!(localChecks||{})[`pm_${i}`]}
                  onChange={e=>setLocalChecks(c=>({...c,[`pm_${i}`]:e.target.checked}))} />
                <span style={{fontSize:13}}>{item}</span>
              </label>
            ))}
            <div style={{fontWeight:600,marginTop:10,marginBottom:4,fontSize:13}}>Welding Sequence</div>
            <textarea rows={2} placeholder="Note welding sequence requirement..."
              value={(localChecks||{}).weldingSequenceNote||''}
              onChange={e=>setLocalChecks(c=>({...c,weldingSequenceNote:e.target.value}))}
              style={{width:'100%',background:'#1a1a2e',border:'1px solid #333',color:'#e0e0e0',padding:6,borderRadius:4,fontSize:13,resize:'vertical'}} />
          </div>
        </>}
        {/* Welding NDT */}
        {stage==="welding" && (
          <div style={{...css.card,marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:8}}>WELD GAUGE & NDT</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div><label style={{fontSize:11,color:T.textMid,display:'block',marginBottom:2}}>Weld Gauge Reading (mm)</label><input type="number" value={docRefs['weldGauge']||''} onChange={e=>setDocRefs(p=>({...p,weldGauge:e.target.value}))} style={{...css.input,width:'100%'}} /></div>
              <div><label style={{fontSize:11,color:T.textMid,display:'block',marginBottom:2}}>Post-Weld Length (mm)</label><input type="number" value={docRefs['postWeldLength']||''} onChange={e=>setDocRefs(p=>({...p,postWeldLength:e.target.value}))} style={{...css.input,width:'100%'}} /></div>
            </div>
            {/* Additional measurement inputs */}
            <div style={{fontWeight:600,marginTop:12,marginBottom:6,fontSize:13}}>Measurements</div>
            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
              <div>
                <div style={{fontSize:12,color:'#aaa',marginBottom:3}}>Weld Gauge Reading (mm)</div>
                <input type="number" step="0.1" placeholder="0.0"
                  value={(localChecks||{}).weldGaugeReading||''}
                  onChange={e=>setLocalChecks(c=>({...c,weldGaugeReading:e.target.value}))}
                  style={{width:120,background:'#1a1a2e',border:'1px solid #333',color:'#e0e0e0',padding:'6px 8px',borderRadius:4,fontSize:13}} />
              </div>
              <div>
                <div style={{fontSize:12,color:'#aaa',marginBottom:3}}>Post-Weld Length (mm)</div>
                <input type="number" step="1" placeholder="0"
                  value={(localChecks||{}).postWeldLength||''}
                  onChange={e=>setLocalChecks(c=>({...c,postWeldLength:e.target.value}))}
                  style={{width:140,background:'#1a1a2e',border:'1px solid #333',color:'#e0e0e0',padding:'6px 8px',borderRadius:4,fontSize:13}} />
              </div>
            </div>
            <div style={{marginTop:8}}>
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12}}>
                <input type="checkbox" checked={!!docRefs['ndtRequired']} onChange={e=>setDocRefs(p=>({...p,ndtRequired:e.target.checked}))} />
                <span style={{color:T.text}}>NDT Required</span>
              </label>
              {docRefs['ndtRequired']&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:8}}>
                <div><label style={{fontSize:11,color:T.textMid,display:'block',marginBottom:2}}>NDT Type(s)</label><input value={docRefs['ndtTypes']||''} onChange={e=>setDocRefs(p=>({...p,ndtTypes:e.target.value}))} placeholder="UT, MPI, RT, PT" style={{...css.input,width:'100%'}} /></div>
                <div><label style={{fontSize:11,color:T.textMid,display:'block',marginBottom:2}}>Result</label><select value={docRefs['ndtResult']||'Pass'} onChange={e=>setDocRefs(p=>({...p,ndtResult:e.target.value}))} style={css.input}><option>Pass</option><option>Fail</option><option>Conditional</option></select></div>
                <div style={{gridColumn:'span 2'}}><label style={{fontSize:11,color:T.textMid,display:'block',marginBottom:2}}>Report Link</label><input value={docRefs['ndtLink']||''} onChange={e=>setDocRefs(p=>({...p,ndtLink:e.target.value}))} placeholder="Drive link..." style={{...css.input,width:'100%'}} /></div>
              </div>}
            </div>
          </div>
        )}
        {/* Blasting profile readings */}
        {stage==="blasting" && (
          <div style={{...css.card,marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:8}}>SURFACE PROFILE READINGS (µm)</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
              {['Reading 1','Reading 2','Reading 3'].map((l,i)=>(
                <div key={i}><label style={{fontSize:11,color:T.textMid,display:'block',marginBottom:2}}>{l}</label><input type="number" value={docRefs[`profile${i+1}`]||''} onChange={e=>setDocRefs(p=>({...p,[`profile${i+1}`]:e.target.value}))} placeholder="µm" style={{...css.input,width:'100%'}} /></div>
              ))}
            </div>
            {[docRefs['profile1'],docRefs['profile2'],docRefs['profile3']].some(v=>v)&&(()=>{
              const vals=[docRefs['profile1'],docRefs['profile2'],docRefs['profile3']].filter(v=>v).map(Number);
              const avg=vals.reduce((s,v)=>s+v,0)/vals.length;
              const pass=avg>=40&&avg<=70;
              return <div style={{marginTop:6,fontSize:11,color:pass?T.green:T.red}}>Avg: {avg.toFixed(1)} µm — {pass?"PASS (40–70 µm)":"FAIL (outside 40–70 µm range)"}</div>;
            })()}
            <div style={{marginTop:8,display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div><label style={{fontSize:11,color:T.textMid,display:'block',marginBottom:2}}>Salt Contamination (mg/m²)</label><input type="number" value={docRefs['saltLevel']||''} onChange={e=>setDocRefs(p=>({...p,saltLevel:e.target.value}))} style={{...css.input,width:'100%'}} />{docRefs['saltLevel']&&<div style={{fontSize:11,color:+docRefs['saltLevel']<=20?T.green:T.red,marginTop:2}}>{+docRefs['saltLevel']<=20?"PASS (≤20 mg/m²)":"FAIL (>20 mg/m²)"}</div>}</div>
              <div>
                <label style={{fontSize:11,color:T.textMid,display:'block',marginBottom:2}}>Dust Rating (ISO 8502-3)</label>
                <select value={(localChecks||{}).dustRating||''}
                  onChange={e=>setLocalChecks(c=>({...c,dustRating:e.target.value}))}
                  style={{...css.input,width:'100%'}}>
                  <option value="">Select...</option>
                  <option value="1">Rating 1 — Very low</option>
                  <option value="2">Rating 2 — Low (Pass)</option>
                  <option value="3">Rating 3 — Medium</option>
                  <option value="4">Rating 4 — High (Fail)</option>
                  <option value="5">Rating 5 — Very high (Fail)</option>
                </select>
                {(localChecks||{}).dustRating&&<div style={{fontSize:11,color:+(localChecks.dustRating)<=2?T.green:T.red,marginTop:2}}>{+(localChecks.dustRating)<=2?"PASS (≤ Rating 2)":"FAIL (> Rating 2, ISO 8502-3)"}</div>}
              </div>
            </div>
          </div>
        )}
        {/* Blasting → Primer timer */}
        {stage==="blasting" && (() => {
          const blastEntry = selGD.insts[0]?.stageHistory?.find(h=>h.stage==="blasting");
          if (!blastEntry?.signedOffDate) return null;
          const daysSince = Math.floor((Date.now() - new Date(blastEntry.signedOffDate).getTime()) / 86400000);
          const hoursElapsed = daysSince * 24;
          const color = hoursElapsed >= 4 ? T.red : hoursElapsed >= 3 ? T.amber : T.green;
          const label = hoursElapsed >= 4 ? "CRITICAL — Primer must be applied NOW" : hoursElapsed >= 3 ? "WARNING — Primer due within 1 hour" : "OK — Within primer window";
          return (
            <div style={{ ...css.card, marginBottom:14, border:`1px solid ${color}55`, background:color+"11" }}>
              <div style={{ fontSize:11, fontWeight:700, color, marginBottom:4 }}>TIME TO PRIMER</div>
              <div style={{ fontSize:13, fontWeight:700, color }}>{hoursElapsed.toFixed(1)} hours since blasting sign-off</div>
              <div style={{ fontSize:11, color, marginTop:4 }}>{label}</div>
              <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>Blast date: {blastEntry.signedOffDate} — Primer window: 4 hours max</div>
            </div>
          );
        })()}
        {/* Time to primer warning — shown on painting stage */}
        {isPainting && (() => {
          const blastApproval = (selGD.insts[0]?.stageHistory||[]).slice().reverse().find(h=>h.stage==='blasting'&&h.signedOffDate);
          if (!blastApproval?.signedOffDate) return null;
          const hrs = (Date.now() - new Date(blastApproval.signedOffDate).getTime()) / 3600000;
          const col = hrs >= 4 ? '#ef4444' : hrs >= 3 ? '#f59e0b' : '#22c55e';
          const msg = hrs >= 4 ? 'CRITICAL: >4h since blasting — primer application overdue!' : hrs >= 3 ? 'Warning: >3h since blasting — apply primer soon' : 'Time since blasting within limit';
          return (
            <div style={{background:col+'22',border:`1px solid ${col}`,borderRadius:6,padding:'8px 12px',marginBottom:12,color:col,fontSize:13}}>
              ⏱ {msg} ({hrs.toFixed(1)}h elapsed)
            </div>
          );
        })()}
        {/* Painting DFT per coat */}
        {isPainting && (
          <div style={{...css.card,marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:8}}>PAINT BATCH & DFT READINGS</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
              <div><label style={{fontSize:11,color:T.textMid,display:'block',marginBottom:2}}>Paint Batch No.</label><input value={docRefs['paintBatchNo']||''} onChange={e=>setDocRefs(p=>({...p,paintBatchNo:e.target.value}))} style={{...css.input,width:'100%'}} /></div>
              <div><label style={{fontSize:11,color:T.textMid,display:'block',marginBottom:2}}>Temp (°C)</label><input type="number" value={docRefs['envTemp']||''} onChange={e=>setDocRefs(p=>({...p,envTemp:e.target.value}))} style={{...css.input,width:'100%'}} /></div>
              <div><label style={{fontSize:11,color:T.textMid,display:'block',marginBottom:2}}>RH (%)</label><input type="number" value={docRefs['envRH']||''} onChange={e=>setDocRefs(p=>({...p,envRH:e.target.value}))} style={{...css.input,width:'100%'}} /></div>
              <div><label style={{fontSize:11,color:T.textMid,display:'block',marginBottom:2}}>Dew Point (°C)</label><input type="number" value={docRefs['envDewPt']||''} onChange={e=>setDocRefs(p=>({...p,envDewPt:e.target.value}))} style={{...css.input,width:'100%'}} /></div>
              <div><label style={{fontSize:11,color:T.textMid,display:'block',marginBottom:2}}>Surface Temp (°C)</label><input type="number" value={docRefs['envSurfTemp']||''} onChange={e=>setDocRefs(p=>({...p,envSurfTemp:e.target.value}))} style={{...css.input,width:'100%'}} />{(docRefs['envSurfTemp']&&docRefs['envDewPt'])&&<div style={{fontSize:11,color:+docRefs['envSurfTemp']>=(+docRefs['envDewPt']+3)?T.green:T.red,marginTop:2}}>{+docRefs['envSurfTemp']>=(+docRefs['envDewPt']+3)?"OK (surface ≥ dew+3)":"WARNING: surface temp too low"}</div>}</div>
            </div>
            <div style={{fontSize:11,color:T.textMid,marginBottom:4}}>DFT READINGS (µm) — 5 measurements</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {[1,2,3,4,5].map(i=>(
                <input key={i} type="number" value={docRefs[`dft${i}`]||''} onChange={e=>setDocRefs(p=>({...p,[`dft${i}`]:e.target.value}))} placeholder={`R${i}`} style={{...css.input,width:60}} />
              ))}
            </div>
          </div>
        )}
        {/* Painting: dry time enforcement + holiday detection + DFT summary */}
        {isPainting && (() => {
          const order = orders.find(o=>o.id===selGD.orderId);
          const paintCoats = order?.quality?.paintCoats||[];
          // Determine current coat from stageHistory
          const paintHistory = (selGD.insts[0]?.stageHistory||[]).filter(h=>h.stage==="painting");
          const coatsDone = paintHistory.length;
          const currentCoat = paintCoats[coatsDone] || null;
          const lastCoatEntry = paintHistory[paintHistory.length-1];
          // Dry time check
          let dryTimeRemaining = null;
          if (lastCoatEntry?.signedOffDate && currentCoat?.dryTime) {
            const lastApproval = new Date(lastCoatEntry.signedOffDate).getTime();
            const dryMs = (currentCoat.dryTime||0) * 3600000;
            const elapsed = Date.now() - lastApproval;
            dryTimeRemaining = Math.max(0, dryMs - elapsed) / 3600000;
          }
          // Total DFT
          const allDfts = paintHistory.flatMap(h=>[1,2,3,4,5].map(i=>+h.docRefs?.[`dft${i}`]).filter(Boolean));
          const totalAvgDft = allDfts.length ? allDfts.reduce((s,v)=>s+v,0)/allDfts.length : 0;
          const specDft = paintCoats.reduce((s,c)=>s+(c.dft||0),0);
          return (
            <div style={{ ...css.card, marginBottom:14 }}>
              {dryTimeRemaining !== null && (
                <div style={{ marginBottom:10, padding:"8px 12px", background:dryTimeRemaining>0?T.amberBg:T.greenBg, borderRadius:6, border:`1px solid ${dryTimeRemaining>0?T.amber:T.green}44` }}>
                  <div style={{ fontSize:11, fontWeight:700, color:dryTimeRemaining>0?T.amber:T.green }}>
                    {dryTimeRemaining>0?`Dry time: ${dryTimeRemaining.toFixed(1)}h remaining before next coat`:"Dry time complete — next coat can proceed"}
                  </div>
                </div>
              )}
              {currentCoat?.type==="Finish" && (
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textMid, marginBottom:6 }}>HOLIDAY DETECTION (Finish Coat)</div>
                  <select value={docRefs['holidayResult']||""} onChange={e=>setDocRefs(p=>({...p,holidayResult:e.target.value}))} style={css.input}>
                    <option value="">Select result...</option>
                    <option value="none">None — No holidays detected</option>
                    <option value="minor">Minor — Touched up</option>
                    <option value="major">Major — Full recoat required</option>
                  </select>
                </div>
              )}
              {allDfts.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textMid, marginBottom:6 }}>TOTAL DFT SUMMARY</div>
                  <div style={{ display:"flex", gap:16, fontSize:12 }}>
                    <span>Avg DFT: <strong style={{ color:totalAvgDft>=specDft*0.9?T.green:T.amber }}>{totalAvgDft.toFixed(0)} µm</strong></span>
                    <span>Spec: <strong>{specDft} µm</strong></span>
                    <span style={{ color:totalAvgDft>=specDft?T.green:T.amber }}>{totalAvgDft>=specDft?"✓ MEETS SPEC":"⚠ BELOW SPEC"}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        {/* Painting: per-coat DFT summary table */}
        {isPainting && (() => {
          const paintOrder = orders.find(o=>o.id===selGD.orderId);
          const paintSpec = paintOrder?.quality?.paintCoats||[];
          if (paintSpec.length === 0) return null;
          const history = selGD.insts[0]?.stageHistory||[];
          const coatApprovals = paintSpec.map((coat,i)=>{
            const approval = history.find(h=>h.stage==='painting'&&h.coatIndex===i);
            return { ...coat, approvedDFT: approval?.dftReading||null };
          });
          const totalSpec = paintSpec.reduce((s,c)=>s+(Number(c.dft)||0),0);
          const totalActual = coatApprovals.reduce((s,c)=>s+(Number(c.approvedDFT)||0),0);
          return (
            <div style={{background:'#1a1a2e',border:'1px solid #333',borderRadius:6,padding:12,marginBottom:14}}>
              <div style={{fontWeight:600,marginBottom:8,fontSize:13}}>DFT Summary</div>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr>
                  <th style={{textAlign:'left',padding:'4px 8px',color:'#aaa'}}>Coat</th>
                  <th style={{textAlign:'right',padding:'4px 8px',color:'#aaa'}}>Spec (μm)</th>
                  <th style={{textAlign:'right',padding:'4px 8px',color:'#aaa'}}>Actual (μm)</th>
                  <th style={{textAlign:'right',padding:'4px 8px',color:'#aaa'}}>Status</th>
                </tr></thead>
                <tbody>
                  {coatApprovals.map((c,i)=>(
                    <tr key={i} style={{borderTop:'1px solid #222'}}>
                      <td style={{padding:'4px 8px'}}>{c.name||`Coat ${i+1}`}</td>
                      <td style={{textAlign:'right',padding:'4px 8px'}}>{c.dft||'—'}</td>
                      <td style={{textAlign:'right',padding:'4px 8px'}}>{c.approvedDFT||'—'}</td>
                      <td style={{textAlign:'right',padding:'4px 8px',color:c.approvedDFT&&Number(c.approvedDFT)>=Number(c.dft)?'#22c55e':'#aaa'}}>
                        {c.approvedDFT ? (Number(c.approvedDFT)>=Number(c.dft)?'✓ Pass':'⚠ Low') : '—'}
                      </td>
                    </tr>
                  ))}
                  <tr style={{borderTop:'2px solid #444',fontWeight:600}}>
                    <td style={{padding:'4px 8px'}}>TOTAL</td>
                    <td style={{textAlign:'right',padding:'4px 8px'}}>{totalSpec}</td>
                    <td style={{textAlign:'right',padding:'4px 8px',color:totalActual>=totalSpec?'#22c55e':'#f59e0b'}}>{totalActual||'—'}</td>
                    <td style={{textAlign:'right',padding:'4px 8px',color:totalActual>=totalSpec?'#22c55e':'#f59e0b'}}>
                      {totalActual>0?(totalActual>=totalSpec?'✓ Total Pass':'⚠ Below Spec'):'—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })()}
        {/* MDCC reference number — required for MDCC approval */}
        {isMdcc && (
          <div style={{ ...css.card, marginBottom:14, border:`1px solid ${T.accent}44` }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:8 }}>MDCC SUBMISSION</div>
            <div>
              <label style={css.label}>MDCC Reference Number *</label>
              <input value={mdccRefNo} onChange={e=>setMdccRefNo(e.target.value)}
                placeholder="e.g. MDCC-2026-001" style={css.input} />
              <div style={{ fontSize:11, color:T.textMid, marginTop:4 }}>Enter the MDCC dossier reference number assigned at client submission.</div>
            </div>
          </div>
        )}
        {/* Assembly stage — sibling drawings status */}
        {stage==="assembly" && (() => {
          const orderForGroup = orders.find(o=>o.id===selGD.orderId);
          const drg = orderForGroup?.drawings?.find(d=>d.id===selGD.drawingId);
          const asmGroup = drg?.assemblyGroup;
          if (!asmGroup) return null;
          const asmDef = orderForGroup?.assemblies?.find(a=>a.id===asmGroup);
          const siblingDrgIds = asmDef?.drawingsAssigned||[];
          const siblingStatus = siblingDrgIds.map(drgId=>{
            const sibDrg = orderForGroup?.drawings?.find(d=>d.id===drgId);
            const sibInsts = instances.filter(i=>i.drawingId===drgId&&i.orderId===selGD.orderId);
            const allAtAssembly = sibInsts.length>0 && sibInsts.every(i=>["assembly","blasting","tpi_blast","painting","tpi_paint","mdcc","dispatch"].includes(i.currentStage));
            return { drawingId:drgId, drawingNo:sibDrg?.drawingNo||drgId, ready:allAtAssembly, count:sibInsts.length };
          });
          const allReady = siblingStatus.every(s=>s.ready);
          return (
            <div style={{ ...css.card, marginBottom:14, border:`1px solid ${allReady?T.green:T.amber}55` }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.textMid, marginBottom:8 }}>ASSEMBLY GROUP: {asmDef?.assemblyName||asmGroup}</div>
              {!allReady && (
                <div style={{ marginBottom:8, padding:"6px 10px", background:T.amberBg, borderRadius:5, fontSize:11, color:T.amber }}>
                  ⚠ Not all drawings in this assembly group have reached Weld QC Cleared. Assembly gate is blocking.
                </div>
              )}
              <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse" }}>
                <thead><tr style={{ color:T.textMid }}>
                  <th style={{ textAlign:"left", padding:"2px 8px" }}>Drawing</th>
                  <th style={{ textAlign:"left", padding:"2px 8px" }}>Status</th>
                </tr></thead>
                <tbody>
                  {siblingStatus.map(s=>(
                    <tr key={s.drawingId} style={{ borderTop:`1px solid ${T.border}` }}>
                      <td style={{ padding:"3px 8px", fontFamily:T.fontMono }}>{s.drawingNo}</td>
                      <td style={{ padding:"3px 8px" }}>
                        {s.ready ? <Badge color="green">Ready</Badge> : <Badge color="amber">Not ready ({s.count} pcs at earlier stage)</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
        {/* Assembly TPI fields — shown when assembly's tpiRequired is set */}
        {stage==="assembly" && (() => {
          const orderForGrp = orders.find(o=>o.id===selGD?.orderId);
          const asmDef = (orderForGrp?.assemblies||[]).find(a=>(a.drawingsAssigned||[]).includes(selGD?.drawingId));
          if (!asmDef?.tpiRequired) return null;
          return (
            <div style={{background:'#f59e0b11',border:'1px solid #f59e0b',borderRadius:6,padding:10,marginTop:10,marginBottom:14}}>
              <div style={{fontWeight:600,color:'#f59e0b',marginBottom:8,fontSize:13}}>TPI Required for this Assembly</div>
              <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:8}}>
                <div>
                  <div style={{fontSize:12,color:'#aaa',marginBottom:3}}>Inspector Name</div>
                  <input value={(localChecks||{}).assemblyTpiInspector||''}
                    onChange={e=>setLocalChecks(c=>({...c,assemblyTpiInspector:e.target.value}))}
                    placeholder="Inspector name"
                    style={{background:'#1a1a2e',border:'1px solid #333',color:'#e0e0e0',padding:'6px 8px',borderRadius:4,fontSize:13,width:180}} />
                </div>
                <div>
                  <div style={{fontSize:12,color:'#aaa',marginBottom:3}}>IRN Number</div>
                  <input value={(localChecks||{}).assemblyTpiIRN||''}
                    onChange={e=>setLocalChecks(c=>({...c,assemblyTpiIRN:e.target.value}))}
                    placeholder="IRN-XXXX"
                    style={{background:'#1a1a2e',border:'1px solid #333',color:'#e0e0e0',padding:'6px 8px',borderRadius:4,fontSize:13,width:140}} />
                </div>
              </div>
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                <input type="checkbox" checked={!!(localChecks||{}).assemblyTpiApproved}
                  onChange={e=>setLocalChecks(c=>({...c,assemblyTpiApproved:e.target.checked}))} />
                <span style={{fontSize:13,fontWeight:600}}>TPI Assembly Inspection Approved</span>
              </label>
            </div>
          );
        })()}
        {/* Dimension readings for cutting_qc */}
        {selGD.stage==="cutting_qc" && selGD.insts.length>0 && (()=>{
          // Derive machine capabilities from releases for this group's nestingRunId
          const nestingRunId = selGD.insts[0]?.nestingRunId;
          const relForRun = nestingRunId ? (releases||[]).find(r=>(r.machineAssignments||[]).some(ma=>ma.nestingRunId===nestingRunId)||(r.drawings||[]).some(d=>d.nestingRunId===nestingRunId)) : null;
          const machineId = relForRun ? ((relForRun.machineAssignments||[])[0]?.machineId||"") : "";
          const machineObj = machineId ? (machines||[]).find(m=>m.id===machineId) : null;
          const machineCaps = machineObj?.capabilities||[];
          return (
            <div style={{ ...css.card, marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.textMid, marginBottom:8 }}>DIMENSION READINGS</div>
              {[...new Set(selGD.insts.map(i=>i.markNo))].map(markNo=>(
                <div key={markNo} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <span style={{ fontSize:12, color:T.text, minWidth:80 }}>{markNo}</span>
                  <span style={{ fontSize:12, color:T.textMid }}>Measured length:</span>
                  <input type="number" value={dimReadings[markNo]||""} onChange={e=>setDimReadings(prev=>({...prev,[markNo]:e.target.value}))} placeholder="mm" style={{ ...css.input, width:100, fontSize:12 }} />
                  <span style={{ fontSize:11, color:T.textMid }}>mm</span>
                </div>
              ))}
              {/* Conditional secondary ops checklist based on machine capabilities */}
              {machineCaps.includes('bevel') && <>
                <div style={{fontWeight:600,marginTop:10,marginBottom:4,fontSize:13}}>Bevel QC Items</div>
                {['Bevel angle correct per drawing','Bevel face clean and uniform','Bevel length matches requirement'].map((item,i)=>(
                  <label key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,cursor:'pointer'}}>
                    <input type="checkbox" checked={!!(localChecks||{})[`bevel_${i}`]}
                      onChange={e=>setLocalChecks(c=>({...c,[`bevel_${i}`]:e.target.checked}))} />
                    <span style={{fontSize:13}}>{item}</span>
                  </label>
                ))}
              </>}
              {machineCaps.includes('drill') && <>
                <div style={{fontWeight:600,marginTop:10,marginBottom:4,fontSize:13}}>Drill QC Items</div>
                {['Hole diameter correct','Hole position per drawing','Hole perpendicularity acceptable','Burrs removed'].map((item,i)=>(
                  <label key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,cursor:'pointer'}}>
                    <input type="checkbox" checked={!!(localChecks||{})[`drill_${i}`]}
                      onChange={e=>setLocalChecks(c=>({...c,[`drill_${i}`]:e.target.checked}))} />
                    <span style={{fontSize:13}}>{item}</span>
                  </label>
                ))}
              </>}
            </div>
          );
        })()}
        {/* Rejection history */}
        {selGD.insts.some(i=>(i.stageHistory||[]).some(h=>h.stage===stage&&(h.rejections||[]).length>0)) && (
          <div style={{ ...css.card,marginBottom:14,border:`1px solid ${T.red}44` }}>
            <div style={{ fontSize:12,fontWeight:700,color:T.red,marginBottom:8 }}>REJECTION HISTORY</div>
            {selGD.insts[0] && (i=>{
              return (i.stageHistory||[]).filter(h=>h.stage===stage&&(h.rejections||[]).length>0).flatMap(h=>h.rejections||[]).map((r,idx)=>(
                <div key={idx} style={{ padding:"6px 8px",background:T.redBg,borderRadius:5,marginBottom:6,fontSize:12 }}>
                  <span style={{color:T.red,fontWeight:700}}>{r.rejectedName||r.rejectedBy}</span>
                  <span style={{color:T.textMid}}> on {r.date}: </span>
                  <span style={{color:T.text}}>{r.reason}</span>
                </div>
              ));
            })(selGD.insts[0])}
          </div>
        )}
        {/* Actions */}
        {isTpi && tpiDetailsOk && tpiForm.outcome==="fail" ? (
          // TPI hard gate fail path
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            <div style={{ background:T.redBg,border:`1px solid ${T.red}`,borderRadius:8,padding:"10px 14px",fontSize:12,color:T.red }}>
              <b>HARD GATE FAIL</b> — TPI report {tpiForm.reportNo} records a FAIL outcome. All pieces will be returned for rework. This action cannot be undone.
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>doTpiFail(selGD)}
                style={{ ...css.btn.danger,flex:1,padding:"13px 0",fontSize:15,fontWeight:800 }}>
                ✕ RECORD TPI FAIL — Return for Rework
              </button>
              <button onClick={()=>setTpiForm(p=>({...p,outcome:"pass"}))} style={{ ...css.btn.ghost,flex:1 }}>Cancel</button>
            </div>
          </div>
        ) : rejectMode ? (
          <div style={{ ...css.card,border:`1px solid ${T.red}` }}>
            <div style={{ fontSize:13,fontWeight:700,color:T.red,marginBottom:10 }}>REJECTION REASON (mandatory)</div>
            <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)}
              placeholder="Describe what must be corrected..." rows={3}
              style={{ ...css.input,width:"100%",resize:"vertical",fontFamily:T.font }} />
            <div style={{ display:"flex",gap:8,marginTop:10 }}>
              <button onClick={()=>doReject(selGD)} disabled={!rejectReason.trim()}
                style={{ ...css.btn.danger,opacity:rejectReason.trim()?1:0.4 }}>Confirm Rejection</button>
              <button onClick={()=>{setRejectMode(false);setRejectReason("");}} style={css.btn.ghost}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={()=>doApprove(selGD,"")} disabled={!allChecked}
              style={{ ...css.btn.green,flex:1,padding:"13px 0",fontSize:15,fontWeight:800,opacity:allChecked?1:0.35 }}>
              ✓ {isTpi?"RECORD TPI PASS":"APPROVE"} — Move to {STAGE_SEQ_LABELS[STAGE_NEXT[stage]]||"Completed"}
            </button>
            {!isTpi && (
              <button onClick={()=>setRejectMode(true)} style={{ ...css.btn.danger,flex:1,padding:"13px 0",fontSize:15,fontWeight:800 }}>
                ✕ REJECT
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Queue list view ──
  return (
    <div>
      <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:20 }}>
        {onBack && <button onClick={onBack} style={css.btn.ghost}>← Dashboard</button>}
        <div style={{ fontSize:18,fontWeight:800,color:T.text }}>My Approval Queue</div>
        {sortedGroups.length>0&&<div style={{ background:T.amber,color:"#000",fontSize:11,fontWeight:800,borderRadius:10,padding:"2px 8px" }}>{sortedGroups.length}</div>}
      </div>
      {sortedGroups.length===0&&(
        <div style={{ textAlign:"center",padding:48,color:T.textLow }}>
          <div style={{ fontSize:32,marginBottom:10 }}>✓</div>
          <div style={{ fontSize:14,fontWeight:700,color:T.textMid }}>No pending approvals</div>
          <div style={{ fontSize:12,marginTop:4 }}>Items will appear here when contractors mark work as done at {myStages.map(s=>STAGE_SEQ_LABELS[s]).join(", ")} stage{myStages.length>1?"s":""}.</div>
        </div>
      )}
      <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
        {sortedGroups.map(g=>(
          <div key={g.key} onClick={()=>{resetApproval();setSelGroup(g.key);}}
            style={{ ...css.card,cursor:"pointer",border:`1px solid ${g.rejCount>=2?T.red:g.isPinned?T.gold:T.border}` }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=g.rejCount>=2?T.red:g.isPinned?T.gold:T.borderHi}
            onMouseLeave={e=>e.currentTarget.style.borderColor=g.rejCount>=2?T.red:g.isPinned?T.gold:T.border}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
                  {g.isPinned&&<span style={{ fontSize:11,color:T.gold }}>📌</span>}
                  <span style={{ fontWeight:800,fontSize:14,color:T.text,fontFamily:T.fontMono }}>{g.markNo}</span>
                  {g.rejCount>=2&&<Badge color="red">Quality Concern</Badge>}
                </div>
                <div style={{ fontSize:12,color:T.textMid }}>{g.desc} · {g.insts.length} pcs · {g.drawingNo} / {g.orderId}</div>
                <div style={{ display:"flex",gap:8,marginTop:6 }}>
                  <Badge color="amber">{STAGE_SEQ_LABELS[g.stage]} — Awaiting Approval</Badge>
                  <span style={{ fontSize:11,color:T.textLow }}>by {g.contractorName}</span>
                </div>
                {g.markedDoneDate&&<div style={{ fontSize:11,color:T.textLow,marginTop:4 }}>Marked done: {g.markedDoneDate}</div>}
              </div>
              <div style={{ fontSize:22,color:T.textLow,alignSelf:"center" }}>›</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTION STEP 7: FULL DRAWING PROGRESS GRID
// ═══════════════════════════════════════════════════════════════════════════════
const STAGE_COLS = ["cutting","fitup","welding","tpi_weld","blasting","painting","tpi_paint","mdcc","dispatch"];

const DrawingProgressGrid = ({ drawing, order, instances, onBack }) => {
  const dInst = instances.filter(i => i.drawingId===drawing.id && i.orderId===order.id);
  const parts = drawing.parts || [];
  const fabParts = parts.filter(p => p.fabType!=="Bought Out");

  // Stage counts per markNo
  const stageCountFor = (markNo, stage) => {
    return dInst.filter(i => i.markNo===markNo && (
      STAGE_COLS.indexOf(i.currentStage) >= STAGE_COLS.indexOf(stage) ||
      (i.currentStage===stage && i.currentStatus!=="defective")
    ) && i.currentStatus!=="defective").length;
  };

  const cellColor = (count, total) => {
    if (!total) return T.textLow;
    if (count === 0) return null;
    if (count === total) return T.green;
    return T.amber;
  };

  const cellBg = (count, total) => {
    if (!total || count === 0) return "transparent";
    if (count === total) return T.greenBg;
    return T.amberBg;
  };

  const rejectedAt = (markNo, stage) =>
    dInst.filter(i => i.markNo===markNo && (i.stageHistory||[]).some(h=>h.stage===stage&&(h.rejections||[]).length>0)).length;

  return (
    <div>
      <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:20 }}>
        <button onClick={onBack} style={css.btn.ghost}>← Back</button>
        <div>
          <div style={{ fontSize:16,fontWeight:800,color:T.text,fontFamily:T.fontMono }}>{drawing.drawingNo}</div>
          <div style={{ fontSize:12,color:T.textMid }}>Order: {order.id} — {order.clientId}</div>
        </div>
      </div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:11 }}>
          <thead>
            <tr>
              <th style={{ textAlign:"left",padding:"6px 10px",color:T.textMid,fontWeight:700,borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap" }}>Mark No</th>
              <th style={{ textAlign:"left",padding:"6px 10px",color:T.textMid,fontWeight:700,borderBottom:`1px solid ${T.border}` }}>Description</th>
              <th style={{ textAlign:"center",padding:"6px 8px",color:T.textMid,fontWeight:700,borderBottom:`1px solid ${T.border}` }}>Total</th>
              {STAGE_COLS.map(s=>(
                <th key={s} style={{ textAlign:"center",padding:"6px 8px",color:T.textMid,fontWeight:700,borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap",minWidth:48 }}>
                  {STAGE_SEQ_LABELS[s]?.slice(0,4)||s.slice(0,4)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fabParts.length===0&&(
              <tr><td colSpan={STAGE_COLS.length+3} style={{ textAlign:"center",padding:32,color:T.textLow }}>No fabricated parts in this drawing.</td></tr>
            )}
            {fabParts.map((p,i)=>{
              const total = p.qtyPerDrg||0;
              const markInst = dInst.filter(inst=>inst.markNo===p.markNo&&inst.currentStatus!=="defective");
              const defCount = dInst.filter(inst=>inst.markNo===p.markNo&&inst.currentStatus==="defective").length;
              return (
                <tr key={p.id||i} style={{ background:i%2===0?"transparent":T.bg }}>
                  <td style={{ padding:"7px 10px",color:T.text,fontFamily:T.fontMono,fontWeight:700,borderBottom:`1px solid ${T.border}22` }}>{p.markNo}</td>
                  <td style={{ padding:"7px 10px",color:T.textMid,borderBottom:`1px solid ${T.border}22` }}>{p.desc||p.partDesc||"—"}</td>
                  <td style={{ textAlign:"center",padding:"7px 8px",color:T.text,fontWeight:700,borderBottom:`1px solid ${T.border}22` }}>
                    {total}
                    {defCount>0&&<span style={{ marginLeft:4,color:T.red,fontSize:10 }}>(−{defCount})</span>}
                  </td>
                  {STAGE_COLS.map(stage=>{
                    const cnt = stageCountFor(p.markNo, stage);
                    const rej = rejectedAt(p.markNo, stage);
                    const bg  = cellBg(cnt, markInst.length);
                    const clr = cellColor(cnt, markInst.length);
                    return (
                      <td key={stage} style={{ textAlign:"center",padding:"7px 4px",background:bg,borderBottom:`1px solid ${T.border}22` }}>
                        {markInst.length>0 ? (
                          <span style={{ fontSize:11,fontWeight:700,color:clr||T.textLow }}>
                            {cnt===markInst.length?"✓":cnt>0?cnt:"—"}
                            {rej>0&&<span style={{ color:T.red,marginLeft:2 }}>!</span>}
                          </span>
                        ) : <span style={{ color:T.textLow }}>—</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display:"flex",gap:16,marginTop:16,fontSize:11,color:T.textMid }}>
        <span><span style={{color:T.green,fontWeight:700}}>✓</span> All pieces at/past stage</span>
        <span><span style={{color:T.amber,fontWeight:700}}>n</span> Partial</span>
        <span style={{color:T.textLow}}>— Not started</span>
        <span><span style={{color:T.red,fontWeight:700}}>!</span> Has rejection</span>
        <span style={{color:T.red}}>(−n) Defective</span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTION STEP 8: OUTBOUND PROCESSING
// ═══════════════════════════════════════════════════════════════════════════════
const OUTBOUND_TYPES = ["Bending","Rolling","Galvanising","Hot Dip Galvanising","Powder Coating","Other"];

const OutboundProcessing = ({ user, instances, setInstances, orders, vendors, onBack }) => {
  const [selInsts, setSelInsts]   = useState(new Set());
  const [form, setForm]           = useState({ type:"Bending", vendorId:"", expectedReturn:"", notes:"" });
  const [viewRet, setViewRet]     = useState(false); // show returns panel
  const [modal, setModal]         = useState(false);

  const canManage = ["super_admin","planning_admin","floor_planner"].includes(user.role);

  // Eligible: not already outbound, not completed/defective, max 2 outbound rounds
  const eligible = instances.filter(i =>
    i.currentStatus !== "outbound" &&
    i.currentStatus !== "completed" &&
    i.currentStatus !== "defective" &&
    (i.outboundCount||0) < 2
  );

  // Currently outbound
  const outbound = instances.filter(i => i.currentStatus === "outbound");

  // Outbound vendors
  const opVendors = vendors.filter(v => v.active);

  const toggleSel = (id) => setSelInsts(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });

  const doCreate = () => {
    if (!selInsts.size || !form.vendorId || !form.type) return;
    const vend = opVendors.find(v=>v.id===form.vendorId);
    setInstances(prev => prev.map(i => {
      if (!selInsts.has(i.instanceId)) return i;
      return {
        ...i,
        currentStatus: "outbound",
        outboundCount: (i.outboundCount||0)+1,
        outboundHistory: [...(i.outboundHistory||[]), {
          type: form.type,
          vendorId: form.vendorId,
          vendorName: vend?.name||"",
          sentDate: today(),
          sentBy: user.username,
          expectedReturn: form.expectedReturn,
          notes: form.notes,
          returnDate: null,
          stageAtDispatch: i.currentStage,
          statusAtDispatch: i.currentStatus,
        }],
      };
    }));
    setSelInsts(new Set());
    setForm({ type:"Bending", vendorId:"", expectedReturn:"", notes:"" });
    setModal(false);
  };

  const doReturn = (instId) => {
    setInstances(prev => prev.map(i => {
      if (i.instanceId !== instId) return i;
      const hist = [...(i.outboundHistory||[])];
      const lastIdx = hist.length-1;
      if (lastIdx>=0) hist[lastIdx] = { ...hist[lastIdx], returnDate:today() };
      const ob = hist[lastIdx];
      return {
        ...i,
        currentStatus: ob?.statusAtDispatch || "in_progress",
        currentStage: ob?.stageAtDispatch || i.currentStage,
        outboundHistory: hist,
      };
    }));
  };

  const groupEligible = {};
  eligible.forEach(i => {
    const k = `${i.markNo}/${i.drawingId}/${i.orderId}`;
    if (!groupEligible[k]) {
      const ord = orders.find(o=>o.id===i.orderId);
      groupEligible[k] = { key:k, markNo:i.markNo, desc:i.desc, drawingNo:i.drawingNo, orderId:i.orderId, clientId:ord?.clientId||"", insts:[] };
    }
    groupEligible[k].insts.push(i);
  });

  return (
    <div>
      <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:20 }}>
        <button onClick={onBack} style={css.btn.ghost}>← Dashboard</button>
        <div style={{ fontSize:18,fontWeight:800,color:T.text }}>Outbound Processing</div>
      </div>

      {/* Currently Outbound */}
      {outbound.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:12,fontWeight:800,color:T.amber,marginBottom:10 }}>CURRENTLY AT OUTBOUND VENDOR ({outbound.length})</div>
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {outbound.map(i => {
              const ob = (i.outboundHistory||[]).slice(-1)[0];
              return (
                <div key={i.instanceId} style={{ ...css.card,border:`1px solid ${T.amber}44` }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                    <div>
                      <div style={{ fontWeight:800,fontFamily:T.fontMono,color:T.text }}>{i.markNo} <span style={{fontWeight:400,color:T.textMid,fontFamily:T.font,fontSize:12}}>— {i.instanceId}</span></div>
                      <div style={{ fontSize:12,color:T.textMid,marginTop:2 }}>{i.drawingNo} / {i.orderId}</div>
                      {ob&&<div style={{ fontSize:12,color:T.amber,marginTop:4 }}>{ob.type} @ {ob.vendorName} · Sent {ob.sentDate}{ob.expectedReturn?` · Due ${ob.expectedReturn}`:""}</div>}
                    </div>
                    {canManage&&<button onClick={()=>doReturn(i.instanceId)} style={css.btn.green}>Record Return</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create outbound request */}
      {canManage && (
        <div style={{ marginBottom:24 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
            <div style={{ fontSize:12,fontWeight:800,color:T.textMid }}>ELIGIBLE INSTANCES ({eligible.length})</div>
            {selInsts.size>0&&<button onClick={()=>setModal(true)} style={css.btn.amber}>Send {selInsts.size} piece{selInsts.size>1?"s":""} for Outbound Processing</button>}
          </div>
          {eligible.length===0&&<InfoBanner color="blue">No eligible instances. Instances at completed/defective/outbound status or with 2 prior outbound rounds are excluded.</InfoBanner>}
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            {Object.values(groupEligible).map(g=>(
              <div key={g.key} style={{ ...css.card }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                  <div>
                    <span style={{ fontWeight:800,fontSize:13,color:T.text,fontFamily:T.fontMono }}>{g.markNo}</span>
                    <span style={{ fontSize:12,color:T.textMid,marginLeft:10 }}>{g.desc} · {g.drawingNo} / {g.orderId}</span>
                  </div>
                  <span style={{ fontSize:11,color:T.textMid }}>{g.insts.length} pcs</span>
                </div>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                  {g.insts.map(i=>(
                    <label key={i.instanceId} style={{ display:"flex",alignItems:"center",gap:6,cursor:"pointer",padding:"5px 8px",background:selInsts.has(i.instanceId)?T.accentLo+"66":T.bgInput,border:`1px solid ${selInsts.has(i.instanceId)?T.accent:T.border}`,borderRadius:5 }}>
                      <input type="checkbox" checked={selInsts.has(i.instanceId)} onChange={()=>toggleSel(i.instanceId)} style={{ cursor:"pointer" }} />
                      <span style={{ fontSize:11,fontFamily:T.fontMono,color:T.text }}>{i.instanceId.split("/").slice(-1)[0]}</span>
                      <Badge color={i.currentStatus==="pending_supervisor"?"amber":"blue"}>{STAGE_SEQ_LABELS[i.currentStage]}</Badge>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal&&(
        <Modal title="Create Outbound Request" onClose={()=>setModal(false)} width={480}>
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
            <div><label style={css.label}>OUTBOUND TYPE</label>
              <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={css.input}>
                {OUTBOUND_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label style={css.label}>OUTBOUND VENDOR</label>
              <select value={form.vendorId} onChange={e=>setForm(p=>({...p,vendorId:e.target.value}))} style={css.input}>
                <option value="">Select vendor...</option>
                {opVendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div><label style={css.label}>EXPECTED RETURN DATE</label>
              <input type="date" value={form.expectedReturn} onChange={e=>setForm(p=>({...p,expectedReturn:e.target.value}))} style={css.input} />
            </div>
            <div><label style={css.label}>NOTES (OPTIONAL)</label>
              <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} rows={2} style={{ ...css.input,resize:"vertical" }} />
            </div>
            <InfoBanner color="blue">{selInsts.size} instance{selInsts.size>1?"s":""} will be marked as OUTBOUND until return is recorded.</InfoBanner>
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
              <button onClick={()=>setModal(false)} style={css.btn.secondary}>Cancel</button>
              <button onClick={doCreate} disabled={!form.vendorId||!form.type} style={{ ...css.btn.amber,opacity:form.vendorId&&form.type?1:0.4 }}>
                Confirm — Send for {form.type}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTION RELEASE WIZARD
// ═══════════════════════════════════════════════════════════════════════════════
const PRI_BADGE = score => {
  if (score < 0)   return <Badge color="red" style={{ animation:"pulse 1s infinite" }}>OVERDUE</Badge>;
  if (score < 1.0) return <Badge color="red">Critical</Badge>;
  if (score < 1.5) return <Badge color="amber">Monitor</Badge>;
  return <Badge color="green">On track</Badge>;
};

const TIER_COLOR = { simple:"blue", medium:"green", complex:"amber", heavy:"red" };

const ProductionReleaseWizard = ({ user, orders, stock, materials, machines, contractors, releases, setReleases, productionStandards, instances, onBack }) => {
  const today = () => new Date().toISOString().slice(0,10);
  const [step, setStep] = useState(1);

  // Step 1 — selected drawings
  const [selDrawings, setSelDrawings] = useState([]); // [{drawingId, orderId, drawing, order}]

  // Step 2 — RM picture (computed from selDrawings)
  const [rmPicture, setRmPicture] = useState([]); // [{matCode,section,grade,requiredKg,requiredM,availableKg,status,lots}]
  const [expandedMat, setExpandedMat] = useState({});

  // Step 3 — smart suggestions
  const [suggestions, setSuggestions] = useState([]); // [{...drawing, score:"A"|"B", extraKg}]
  const [addedSugg, setAddedSugg] = useState({});
  const [expandedDrg, setExpandedDrg] = useState(new Set());

  // Step 4 — machine assignments
  const [machineAsgn, setMachineAsgn] = useState({}); // {matCode: {machineId,lotId,startDate,endDate}}

  // Step 5 — contractor assignments
  const [contAsgn, setContAsgn] = useState({}); // {drawingId: {contractorId,stages:[],pinnedEngineerId}}

  // ── Step 1 helpers ──
  const activeReleaseDrawingIds = new Set(
    releases.filter(r=>r.status==="in_progress").flatMap(r=>r.drawings.map(d=>d.drawingId))
  );
  const allEligible = orders.flatMap(order =>
    (order.drawings||[]).filter(d=>d.receivedDate && !activeReleaseDrawingIds.has(d.id))
      .map(d=>({ drawingId:d.id, orderId:order.id, drawing:d, order }))
  ).map(e=>({
    ...e,
    tier: productionStandards ? getAssemblyTier(e.drawing, productionStandards) : {id:"simple",label:"Simple"},
    score: productionStandards ? getCriticalityScore(e.drawing, e.order, productionStandards) : 999,
  })).sort((a,b)=>a.score-b.score);

  const toggleDrw = key => setSelDrawings(prev => {
    const exists = prev.find(s=>s.drawingId===key.drawingId&&s.orderId===key.orderId);
    if (exists) return prev.filter(s=>!(s.drawingId===key.drawingId&&s.orderId===key.orderId));
    const alreadyReleased = releases.filter(r=>r.status==="in_progress").flatMap(r=>r.drawings).filter(d=>d.drawingId===key.drawingId&&d.orderId===key.orderId).length;
    const unitsToRelease = Math.max(1, (key.drawing?.qty||1) - alreadyReleased);
    return [...prev, {...key, unitsToRelease}];
  });
  const isSelected = (drawingId, orderId) => selDrawings.some(s=>s.drawingId===drawingId&&s.orderId===orderId);

  // ── Step 2 compute ──
  const computeRmPicture = () => {
    const byMat = {};
    selDrawings.forEach(entry => {
      const {drawing, order} = entry;
      const unitsToRelease = entry.unitsToRelease ?? (drawing.qty || 1);
      const drawingParts = (order.parts||[]).filter(p=>p.drawingId===drawing.id);
      drawingParts.filter(p=>p.fabType?.toLowerCase()==="fabricate"&&p.source?.toLowerCase()==="procure").forEach(p => {
        const sec = p.sectionType||p.section||"";
        const key = p.matCode||sec||"Unknown";
        if (!byMat[key]) byMat[key] = {matCode:key, section:sec, grade:p.grade||"", requiredKg:0, drawings:[], lots:[]};
        byMat[key].requiredKg += (p.clientTotalWt||0) * unitsToRelease;
        byMat[key].drawings.push({drawingNo:drawing.drawingNo, orderId:order.id, kg:(p.clientTotalWt||0)*unitsToRelease, qty:unitsToRelease});
      });
    });
    const rows = Object.values(byMat).map(row => {
      const availLots = stock.filter(s=>
        (s.matCode===row.matCode||(s.sectionType||s.section)===row.section)&&
        (s.status==="available"||s.status==="qc_hold")
      );
      const availKg = availLots.reduce((s,l)=>(s+(l.wtAvailable||l.wtReceived||0)),0);
      let status = "Not in stock — raise PO";
      if (availKg >= row.requiredKg && row.requiredKg > 0) status = "Sufficient";
      else if (availKg > 0 && availKg < row.requiredKg) status = "Partial";
      else if (availLots.some(l=>l.status==="qc_hold")) status = "QC Pending";

      // Compute Req (m) / Req (m²) from library
      const libEntry = (materials||[]).find(m=>m.matCode===row.matCode);
      let requiredM = 0;
      let reqDisplay = "—";
      if (libEntry && !libEntry.isPlate && (libEntry.wtPerMetre||0) > 0) {
        requiredM = row.requiredKg / libEntry.wtPerMetre;
        const stdLens = libEntry.standardLengths||[];
        const maxLen = stdLens.length > 0 ? stdLens[stdLens.length-1] / 1000 : 12;
        const bars = Math.ceil(requiredM / maxLen);
        reqDisplay = `${requiredM.toFixed(1)} m (≈ ${bars} bars of ${maxLen*1000}mm)`;
      } else if (libEntry && libEntry.isPlate && (libEntry.wtPerM2||0) > 0) {
        requiredM = row.requiredKg / libEntry.wtPerM2;
        reqDisplay = `${requiredM.toFixed(2)} m²`;
      }

      return {...row, availableKg:availKg, status, lots:availLots, requiredM, reqDisplay};
    });
    setRmPicture(rows);
  };

  // ── Step 3 compute ──
  const computeSuggestions = () => {
    const usedKg = {};
    rmPicture.forEach(r=>{ usedKg[r.matCode] = r.requiredKg; });
    const remainKg = {};
    rmPicture.forEach(r=>{ remainKg[r.matCode] = Math.max(0, r.availableKg - r.requiredKg); });
    const totalRequired = rmPicture.reduce((s,r)=>s+r.requiredKg,0);

    const selSet = new Set(selDrawings.map(s=>s.drawingId+"|"+s.orderId));
    const candidates = orders.flatMap(order =>
      (order.drawings||[]).filter(d=>d.receivedDate&&!activeReleaseDrawingIds.has(d.id)&&!selSet.has(d.id+"|"+order.id))
        .map(d=>({drawing:d, order}))
    );

    const suggs = [];
    candidates.forEach(({drawing, order}) => {
      const parts = (order.parts||[]).filter(p=>p.drawingId===drawing.id&&p.fabType?.toLowerCase()==="fabricate"&&p.source?.toLowerCase()==="procure");
      if (!parts.length) return;
      let extraKg = 0;
      let canCover = true;
      const needsByMat = {};
      parts.forEach(p=>{
        const key = p.matCode||p.sectionType||p.section||"Unknown";
        needsByMat[key] = (needsByMat[key]||0) + (p.clientTotalWt||0);
      });
      Object.entries(needsByMat).forEach(([mat,need])=>{
        const avail = remainKg[mat]||0;
        if (need > avail) { canCover = false; extraKg += need - avail; }
      });

      // Approved makes conflict check
      let makeConflict = false;
      const appMakes = order.quality?.approvedMakes||[];
      selDrawings.forEach(sel=>{
        const selMakes = sel.order.quality?.approvedMakes||[];
        if (appMakes.length && selMakes.length) {
          const conflict = appMakes.some(am => selMakes.some(sm => sm.matCode===am.matCode && sm.make!==am.make));
          if (conflict) makeConflict = true;
        }
      });

      const extra20pct = totalRequired > 0 ? extraKg / totalRequired < 0.2 : false;
      const tier  = productionStandards ? getAssemblyTier(drawing, productionStandards) : {id:"simple",label:"Simple"};
      const score = productionStandards ? getCriticalityScore(drawing, order, productionStandards) : 999;
      if (canCover) suggs.push({drawing, order, tier, score, suggScore:"A", extraKg:0, makeConflict});
      else if (extra20pct) suggs.push({drawing, order, tier, score, suggScore:"B", extraKg, makeConflict});
    });
    setSuggestions(suggs);
  };

  // ── Step 4 helpers ──
  const updAsgn = (matCode, field, val) =>
    setMachineAsgn(prev => {
      const defaultStart = new Date().toISOString().slice(0,10);
      const defaultEnd   = new Date(Date.now()+2*864e5).toISOString().slice(0,10);
      // For date fields, skip state update while year is still being typed (e.g. "0002").
      // Returning prev unchanged means no re-render → no Step4 remount → browser keeps
      // the intermediate digit sequence (0002 → 0020 → 0202 → 2026) without interruption.
      if ((field==="startDate"||field==="endDate") && val) {
        const yr = parseInt((val||"").split("-")[0], 10);
        if (!yr || yr < 2000 || yr > 2100) return prev;
      }
      const existing = prev[matCode] || {machineId:"",lotId:"",startDate:defaultStart,endDate:defaultEnd};
      return {...prev, [matCode]: {...existing, [field]: val}};
    });
  const cutMachines = (machines||[]).filter(m=>m.active!==false&&((m.capabilities||[]).some(c=>['cut_straight','cut_profile'].includes(c))||m.type==="Cutting"));

  // ── Step 5 helpers ──
  const updCont = (drawingId, field, val) =>
    setContAsgn(prev=>({...prev,[drawingId]:{...prev[drawingId],[field]:val}}));

  // ── Confirm (create release) ──
  const confirm = () => {
    const seq  = releases.length + 1;
    const yr   = new Date().getFullYear();
    const id   = `PR-${yr}-${String(seq).padStart(3,"0")}`;
    const drawingsPayload = selDrawings.map(({drawing, order, tier, score}) => {
      const ca = contAsgn[drawing.id]||{};
      return {
        drawingId: drawing.id, drawingNo: drawing.drawingNo, orderId: order.id, orderNo: order.id,
        contractorId: ca.contractorId||"", contractorName: (contractors||[]).find(c=>c.id===ca.contractorId)?.name||"",
        stages: ca.stages||[], pinnedEngineerId: ca.pinnedEngineerId||"",
        pinnedEngineerName: ca.pinnedEngineerId ? (USERS.find(u=>u.id===ca.pinnedEngineerId)?.name||"") : "",
        tier: tier?.id||"simple", criticalityScore: score,
      };
    });
    const machinePayload = Object.entries(machineAsgn).map(([matCode, a]) => ({
      id: `MA-${id}-${matCode}`, matCode,
      machineId: a.machineId||"", machineName: (machines||[]).find(m=>m.id===a.machineId)?.name||"",
      lotId: a.lotId||"", startDate: a.startDate||"", endDate: a.endDate||"",
      assignedBy: user.username, status:"pending",
    }));
    const rmPayload = rmPicture.map(r=>({
      matCode: r.matCode, requiredKg: r.requiredKg, requiredM: r.requiredM,
      availableKg: r.availableKg, status: r.status,
      lots: r.lots.map(l=>l.id),
    }));
    setReleases(prev=>[...prev,{
      id, releaseDate: today(), createdBy: user.username, status:"in_progress",
      drawings: drawingsPayload, machineAssignments: machinePayload, rmPicture: rmPayload,
    }]);
    onBack();
  };

  // ── UI helpers ──
  const Step1 = () => (
    <div>
      <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:4 }}>Step 1 — Select Drawings</div>
      <div style={{ fontSize:12, color:T.textMid, marginBottom:14 }}>Showing drawings with received date, not yet in another active release. Sorted by criticality (most critical first).</div>
      {allEligible.length===0 && <InfoBanner color="amber">No eligible drawings found. Drawings must have a Received Date set in the Drawing Register.</InfoBanner>}
      {allEligible.length>0 && (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", background:T.bgCard, borderRadius:8, overflow:"hidden" }}>
            <thead>
              <tr>
                {["","Drawing No","Order","Client","Parts / RM","Progress","Tier","Priority","Release Qty"].map(h=>(
                  <th key={h} style={{ padding:"8px 10px", fontSize:11, color:T.textMid, fontWeight:700, textAlign:"left", borderBottom:`1px solid ${T.border}`, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allEligible.map(({drawingId,orderId,drawing,order,tier,score})=>{
                const sel = isSelected(drawingId, orderId);
                const totalKg = (drawing.parts||[]).reduce((s,p)=>s+(p.clientTotalWt||0),0);
                const client = orders.find(o=>o.id===orderId);
                return (
                  <React.Fragment key={drawingId+orderId}>
                  <tr
                    style={{ cursor:"pointer", background:sel?`${T.accent}18`:"transparent" }}>
                    <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }} onClick={()=>toggleDrw({drawingId,orderId,drawing,order,tier,score})}>
                      <input type="checkbox" checked={sel} readOnly style={{ cursor:"pointer" }} />
                    </td>
                    <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono, fontSize:12, fontWeight:700, color:T.accentHi, cursor:"pointer" }} onClick={()=>{const s=new Set(expandedDrg);s.has(drawingId)?s.delete(drawingId):s.add(drawingId);setExpandedDrg(s);}}>{expandedDrg.has(drawingId)?"▼":"▶"} {drawing.drawingNo}</td>
                    <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontSize:12 }}>{orderId}</td>
                    <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontSize:12 }}>{client?.clientId||""}</td>
                    <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                      {(drawing.parts||[]).filter(p=>p.fabType==="Fabricate").length} parts — {[...new Set((drawing.parts||[]).filter(p=>p.matCode).map(p=>p.matCode.split("/").slice(-1)[0]))].slice(0,3).join(", ")||"—"}
                    </td>
                    <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontSize:12, color:T.textMid }}>—</td>
                    <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}><Badge color={TIER_COLOR[tier?.id]||"blue"}>{tier?.label||"?"}</Badge></td>
                    <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}>{PRI_BADGE(score)}</td>
                    <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}>
                      {(() => {
                        const selEntry = selDrawings.find(s=>s.drawingId===drawingId&&s.orderId===orderId);
                        if (!sel) return <span style={{color:T.textLow,fontSize:11}}>—</span>;
                        const maxUnits = drawing.qty||1;
                        const curr = selEntry?.unitsToRelease||1;
                        return (
                          <div style={{display:'flex',alignItems:'center',gap:4}}>
                            <button onClick={e=>{e.stopPropagation();if(curr>1)setSelDrawings(p=>p.map(s=>s.drawingId===drawingId&&s.orderId===orderId?{...s,unitsToRelease:curr-1}:s));}} style={{...css.btn.ghost,padding:'1px 6px',fontSize:12}}>−</button>
                            <span style={{fontFamily:T.fontMono,fontSize:12,minWidth:20,textAlign:'center'}}>{curr}</span>
                            <button onClick={e=>{e.stopPropagation();if(curr<maxUnits)setSelDrawings(p=>p.map(s=>s.drawingId===drawingId&&s.orderId===orderId?{...s,unitsToRelease:curr+1}:s));}} style={{...css.btn.ghost,padding:'1px 6px',fontSize:12}}>+</button>
                            <span style={{fontSize:10,color:T.textLow}}>/{maxUnits}</span>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                  {expandedDrg.has(drawingId) && (
                    <tr key={drawingId+"_exp"} style={{ background:`${T.accent}08` }}>
                      <td colSpan={9} style={{ padding:"10px 20px", borderBottom:`1px solid ${T.border}` }}>
                        <div style={{ fontSize:11, fontWeight:700, color:T.textMid, marginBottom:6 }}>PARTS</div>
                        <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse", marginBottom:10 }}>
                          <thead><tr>
                            {["Mark No","Description","Section/Size","Qty/Unit","Total Wt","Req Ops"].map(h=><th key={h} style={{ textAlign:"left", padding:"2px 8px", color:T.textMid, fontWeight:600 }}>{h}</th>)}
                          </tr></thead>
                          <tbody>
                            {(drawing.parts||[]).filter(p=>p.fabType==="Fabricate").map(p=>(
                              <tr key={p.id} style={{ borderTop:`1px solid ${T.border}` }}>
                                <td style={{ padding:"3px 8px", fontFamily:T.fontMono }}>{p.markNo}</td>
                                <td style={{ padding:"3px 8px" }}>{p.desc}</td>
                                <td style={{ padding:"3px 8px", fontFamily:T.fontMono }}>{p.section} {p.size}</td>
                                <td style={{ padding:"3px 8px", textAlign:"right" }}>{p.qtyPerDrg}</td>
                                <td style={{ padding:"3px 8px", textAlign:"right" }}>{(p.calcTotalWt||p.clientTotalWt||0).toFixed(1)} kg</td>
                                <td style={{ padding:"3px 8px" }}>{(p.requiredOps||['Cut']).join(", ")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{ fontSize:11, fontWeight:700, color:T.textMid, marginBottom:6 }}>RM REQUIREMENTS</div>
                        <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse" }}>
                          <thead><tr>
                            {["Mat Code","Req kg","Avail kg","Status"].map(h=><th key={h} style={{ textAlign:"left", padding:"2px 8px", color:T.textMid, fontWeight:600 }}>{h}</th>)}
                          </tr></thead>
                          <tbody>
                            {[...new Set((drawing.parts||[]).filter(p=>p.matCode&&p.fabType==="Fabricate").map(p=>p.matCode))].map(mc=>{
                              const reqKg = (drawing.parts||[]).filter(p=>p.matCode===mc&&p.fabType==="Fabricate").reduce((s,p)=>s+(p.calcTotalWt||p.clientTotalWt||0),0);
                              const availLots = (stock||[]).filter(s=>s.matCode===mc&&["available","reserved","allocated"].includes(s.status));
                              const availKg = availLots.reduce((s,l)=>s+(l.wtAvailable||0),0);
                              const color = availKg>=reqKg*0.9?T.green:availKg>0?T.amber:T.red;
                              return (
                                <tr key={mc} style={{ borderTop:`1px solid ${T.border}` }}>
                                  <td style={{ padding:"3px 8px", fontFamily:T.fontMono }}>{mc}</td>
                                  <td style={{ padding:"3px 8px", textAlign:"right" }}>{reqKg.toFixed(1)}</td>
                                  <td style={{ padding:"3px 8px", textAlign:"right", color }}>{availKg.toFixed(1)}</td>
                                  <td style={{ padding:"3px 8px", color, fontWeight:600 }}>{availKg>=reqKg*0.9?"Sufficient":availKg>0?"Partial":"Missing"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop:16, display:"flex", gap:8, alignItems:"center" }}>
        <button onClick={()=>{computeRmPicture();setStep(2);}} disabled={selDrawings.length===0} style={css.btn.primary}>Next: RM Picture →</button>
        <span style={{ fontSize:12, color:T.textMid }}>{selDrawings.length} drawing{selDrawings.length!==1?"s":""} selected</span>
      </div>
    </div>
  );

  const rmStatusColor = s => s==="Sufficient"?"green":s==="Partial"?"amber":s==="QC Pending"?"amber":"red";

  const Step2 = () => (
    <div>
      <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:4 }}>Step 2 — RM Picture</div>
      <div style={{ fontSize:12, color:T.textMid, marginBottom:14 }}>Raw material requirements for selected drawings, grouped by material code.</div>
      {rmPicture.length===0 && <InfoBanner color="blue">No procure parts found in selected drawings. All parts may be bought-out or fabricated in-house.</InfoBanner>}
      {rmPicture.length>0 && (
        <table style={{ width:"100%", borderCollapse:"collapse", background:T.bgCard, borderRadius:8, overflow:"hidden" }}>
          <thead>
            <tr>
              {["","Mat Code","Section","Grade","Req (kg)","Req (m)","Avail (kg)","Status","Lots"].map(h=>(
                <th key={h} style={{ padding:"8px 10px", fontSize:11, color:T.textMid, fontWeight:700, textAlign:"left", borderBottom:`1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rmPicture.map((r,ri)=>(
              <>
                <tr key={r.matCode}>
                  <td style={{ padding:"6px 10px", borderBottom:`1px solid ${T.border}` }}>
                    <button onClick={()=>setExpandedMat(p=>({...p,[r.matCode]:!p[r.matCode]}))} style={{ ...css.btn.ghost, padding:"2px 6px", fontSize:11 }}>{expandedMat[r.matCode]?"▼":"▶"}</button>
                  </td>
                  <td style={{ padding:"6px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono, fontSize:12 }}>{r.matCode}</td>
                  <td style={{ padding:"6px 10px", borderBottom:`1px solid ${T.border}`, fontSize:12 }}>{r.section}</td>
                  <td style={{ padding:"6px 10px", borderBottom:`1px solid ${T.border}`, fontSize:12 }}>{r.grade}</td>
                  <td style={{ padding:"6px 10px", borderBottom:`1px solid ${T.border}`, fontSize:12, fontWeight:700 }}>{r.requiredKg.toFixed(1)}</td>
                  <td style={{ padding:"6px 10px", borderBottom:`1px solid ${T.border}`, fontSize:12, color:r.reqDisplay==="—"?T.textLow:T.text }}>{r.reqDisplay||"—"}</td>
                  <td style={{ padding:"6px 10px", borderBottom:`1px solid ${T.border}`, fontSize:12 }}>{r.availableKg.toFixed(1)}</td>
                  <td style={{ padding:"6px 10px", borderBottom:`1px solid ${T.border}` }}><Badge color={rmStatusColor(r.status)}>{r.status}</Badge></td>
                  <td style={{ padding:"6px 10px", borderBottom:`1px solid ${T.border}`, fontSize:11, color:T.textMid }}>{r.lots.length} lot{r.lots.length!==1?"s":""}</td>
                </tr>
                {expandedMat[r.matCode] && (
                  <tr key={r.matCode+"_exp"}>
                    <td colSpan={9} style={{ padding:"0 20px 12px 32px", background:T.bg, borderBottom:`1px solid ${T.border}` }}>
                      <div style={{ fontSize:11, color:T.textMid, marginTop:8, marginBottom:4 }}>Drawings needing this material:</div>
                      {r.drawings.map((d,di)=>(
                        <div key={di} style={{ fontSize:11, color:T.text }}>{d.drawingNo} ({d.orderId}){d.qty>1?` × ${d.qty}`:""} — {d.kg.toFixed(1)} kg</div>
                      ))}
                      {r.lots.length>0 && <>
                        <div style={{ fontSize:11, color:T.textMid, marginTop:8, marginBottom:4 }}>Available lots:</div>
                        {r.lots.map(l=>{
                          const reservedForThisOrder = (l.reservations||[]).some(rv=>selDrawings.some(sd=>sd.orderId===rv.orderId));
                          const reservedForOther = !reservedForThisOrder && (l.reservations||[]).length>0;
                          return (
                            <div key={l.id} style={{ fontSize:11, color:T.text, display:"flex", alignItems:"center", gap:6, padding:"2px 0" }}>
                              {reservedForThisOrder&&<span style={{ fontSize:9, padding:"1px 5px", background:T.greenBg, color:T.green, borderRadius:3, border:`1px solid ${T.green}44` }}>Reserved for this order</span>}
                              {reservedForOther&&<span style={{ fontSize:9, padding:"1px 5px", background:T.amberBg, color:T.amber, borderRadius:3, border:`1px solid ${T.amber}44` }}>Reserved for other order</span>}
                              {l.lotNo||l.id} — {(l.wtAvailable||l.wtReceived||0).toFixed(1)} kg — <Badge color={l.status==="available"?"green":l.status==="reserved"?"amber":"blue"}>{l.status}</Badge>
                            </div>
                          );
                        })}
                      </>}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ marginTop:16, display:"flex", gap:8 }}>
        <button onClick={()=>setStep(1)} style={css.btn.ghost}>← Back</button>
        <button onClick={()=>{computeSuggestions();setStep(3);}} style={css.btn.primary}>Next: Smart Suggestions →</button>
      </div>
    </div>
  );

  const Step3 = () => {
    const selSet = new Set(selDrawings.map(s=>s.drawingId+"|"+s.orderId));

    const addSugg = (drawing, order) => {
      if (selSet.has(drawing.id+"|"+order.id)) return;
      const tier  = productionStandards ? getAssemblyTier(drawing, productionStandards) : {id:"simple",label:"Simple"};
      const score = productionStandards ? getCriticalityScore(drawing, order, productionStandards) : 999;
      const unitsToRelease = drawing.qty||1;
      setSelDrawings(prev=>[...prev,{drawingId:drawing.id,orderId:order.id,drawing,order,tier,score,unitsToRelease}]);
      setAddedSugg(p=>({...p,[drawing.id+order.id]:true}));
    };

    // Section B — by matCode
    const matGroups = {};
    rmPicture.forEach(r => {
      const candidates = orders.flatMap(order =>
        (order.drawings||[]).filter(d=>d.receivedDate&&!activeReleaseDrawingIds.has(d.id)&&!selSet.has(d.id+"|"+order.id))
          .map(d=>({drawing:d,order}))
      ).filter(({drawing,order}) => {
        const parts = (order.parts||[]).filter(p=>p.drawingId===drawing.id&&p.fabType?.toLowerCase()==="fabricate"&&p.source?.toLowerCase()==="procure");
        return parts.some(p=>(p.matCode||p.section)===r.matCode);
      });
      if (candidates.length > 0) matGroups[r.matCode] = candidates;
    });

    const hasAny = Object.keys(matGroups).length > 0;

    return (
      <div>
        <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:4 }}>Step 3 — Smart Suggestions</div>
        <div style={{ fontSize:12, color:T.textMid, marginBottom:14 }}>Additional drawings that share the same RM types and can be batched into this cutting run.</div>
        {/* Section A: Drawings In Progress */}
        {(() => {
          const inProgressDrgs = selDrawings.filter(sd => {
            const hasInstances = (instances||[]).some(i => i.drawingId===sd.drawingId && i.orderId===sd.orderId);
            const allDispatched = (instances||[]).filter(i=>i.drawingId===sd.drawingId&&i.orderId===sd.orderId)
              .every(i=>['dispatch','complete'].includes(i.currentStage));
            return hasInstances && !allDispatched;
          });
          if (inProgressDrgs.length === 0) return null;
          return (
            <div style={{marginBottom:20}}>
              <div style={{fontWeight:600,marginBottom:10,color:'#e2e8f0'}}>Drawings In Progress</div>
              {inProgressDrgs.map(sd => {
                const drg = (orders||[]).flatMap(o=>o.drawings||[]).find(d=>d.id===sd.drawingId);
                const drgInsts = (instances||[]).filter(i=>i.drawingId===sd.drawingId&&i.orderId===sd.orderId);
                const cutDone = drgInsts.filter(i=>!['cutting','cutting_qc'].includes(i.currentStage)&&i.currentStage!=='').length;
                const total = drg?.qty||drgInsts.length||1;
                const pct = Math.round((cutDone/total)*100);
                const drgMatCodes = (drg?.parts||[]).filter(p=>p.fabType==='Fabricate').map(p=>p.matCode).filter(Boolean);
                const offcuts = (stock||[]).filter(s =>
                  s.status==='available' && s.offcutParentId &&
                  drgMatCodes.some(mc => mc === s.matCode)
                );
                return (
                  <div key={sd.drawingId} style={{background:'#1e293b',borderRadius:6,padding:12,marginBottom:8,border:'1px solid #334155'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                      <span style={{fontWeight:600,fontSize:13}}>{drg?.drawingNo||sd.drawingId}</span>
                      <span style={{fontSize:12,color:'#94a3b8'}}>{cutDone}/{total} units cut ({pct}%)</span>
                    </div>
                    <div style={{background:'#0f172a',borderRadius:4,height:6,marginBottom:8}}>
                      <div style={{background:'#22c55e',width:`${pct}%`,height:'100%',borderRadius:4,transition:'width 0.3s'}} />
                    </div>
                    {offcuts.length > 0 && (
                      <div style={{fontSize:12,color:'#f59e0b',marginTop:4}}>
                        💡 {offcuts.length} off-cut lot{offcuts.length>1?'s':''} available for this drawing's RM types
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
        {!hasAny && <InfoBanner color="blue">No additional drawings found that share RM types with your current selection.</InfoBanner>}
        {Object.entries(matGroups).map(([matCode, candidates]) => (
          <div key={matCode} style={{...css.card, marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:700,color:T.accentHi,marginBottom:8}}>Also needs {matCode} — add to this cutting run:</div>
            {candidates.map(({drawing,order}) => {
              const added = addedSugg[drawing.id+order.id];
              const parts = (order.parts||[]).filter(p=>p.drawingId===drawing.id&&p.fabType?.toLowerCase()==="fabricate"&&p.source?.toLowerCase()==="procure");
              const extraKg = parts.filter(p=>(p.matCode||p.section)===matCode).reduce((s,p)=>s+(p.clientTotalWt||0),0) * (drawing.qty||1);
              return (
                <div key={drawing.id+order.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
                  <div>
                    <span style={{fontFamily:T.fontMono,fontSize:12,color:T.text,fontWeight:700}}>{drawing.drawingNo}</span>
                    <span style={{fontSize:11,color:T.textMid,marginLeft:8}}>{order.id} · {drawing.qty} units · +{extraKg.toFixed(1)} kg {matCode}</span>
                  </div>
                  {added ? <Badge color="green">Added</Badge> : <button onClick={()=>addSugg(drawing,order)} style={css.btn.primary}>+ Add</button>}
                </div>
              );
            })}
          </div>
        ))}
        <div style={{ marginTop:16, display:"flex", gap:8 }}>
          <button onClick={()=>setStep(2)} style={css.btn.ghost}>← Back</button>
          <button onClick={()=>setStep(4)} style={css.btn.primary}>Next: Machine Assignment →</button>
        </div>
      </div>
    );
  };

  const Step4 = () => {
    const todayISO   = new Date().toISOString().slice(0,10);
    const twoDaysISO = new Date(Date.now()+2*864e5).toISOString().slice(0,10);
    return (
    <div>
      <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:4 }}>Step 4 — Assign Machines</div>
      <div style={{ fontSize:12, color:T.textMid, marginBottom:14 }}>Assign cutting machines to available material lots.</div>
      {rmPicture.filter(r=>r.status!=="Not Received").length===0 && <InfoBanner color="amber">No materials are available. Proceed to assign contractors for manual scheduling.</InfoBanner>}
      {rmPicture.map(r=>{
        const avail = r.status!=="Not Received";
        const asgn  = machineAsgn[r.matCode]||{};
        const tier  = selDrawings[0]?.tier;
        const cutAheadDays = tier ? Math.ceil(tier.fitup/8) : 1;
        const cutAheadDate = new Date(Date.now()+(cutAheadDays*86400000)).toISOString().slice(0,10);
        const endDate = asgn.endDate||twoDaysISO;
        const lateWarn = endDate && endDate > cutAheadDate;
        return (
          <div key={r.matCode} style={{ ...css.card, marginBottom:12, opacity:avail?1:0.5 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <span style={{ fontFamily:T.fontMono, fontWeight:700, color:T.accentHi }}>{r.matCode}</span>
              <Badge color={rmStatusColor(r.status)}>{r.status}</Badge>
            </div>
            {!avail && <div style={{ fontSize:11, color:T.textMid }}>Not yet received — machine assignment deferred.</div>}
            {avail && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10 }}>
                <div>
                  <label style={css.label}>Machine</label>
                  <select value={asgn.machineId||""} onChange={e=>updAsgn(r.matCode,"machineId",e.target.value)} style={css.input}>
                    <option value="">Select machine...</option>
                    {cutMachines.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={css.label}>Lot</label>
                  <select value={asgn.lotId||""} onChange={e=>updAsgn(r.matCode,"lotId",e.target.value)} style={css.input}>
                    <option value="">Select lot...</option>
                    {r.lots.map(l=><option key={l.id} value={l.id}>{l.lotNo||l.id} ({(l.wtAvailable||l.wtReceived||0).toFixed(0)} kg)</option>)}
                  </select>
                </div>
                <div>
                  <label style={css.label}>Start Date</label>
                  <input type="date" value={asgn.startDate||todayISO} onChange={e=>updAsgn(r.matCode,"startDate",e.target.value)} style={css.input} />
                </div>
                <div>
                  <label style={css.label}>End Date</label>
                  <input type="date" value={endDate} onChange={e=>updAsgn(r.matCode,"endDate",e.target.value)} style={{ ...css.input, borderColor:lateWarn?T.amber:undefined }} />
                </div>
              </div>
            )}
            {avail && <div style={{ fontSize:11, color:T.textMid, marginTop:6 }}>Cut-ahead date: <span style={{ color:T.green }}>{cutAheadDate}</span>{lateWarn&&<span style={{ color:T.amber, marginLeft:8 }}>⚠ End date is after cut-ahead date</span>}</div>}
            {avail && asgn.machineId && (() => {
              const mach = (machines||[]).find(m=>m.id===asgn.machineId);
              const machCaps = mach?.capabilities||[];
              // Collect all required ops for parts in this matCode batch
              const allOps = new Set();
              selDrawings.forEach(({drawing,order}) => {
                (order.parts||[]).filter(p=>p.drawingId===drawing.id&&p.matCode===r.matCode&&p.fabType==="Fabricate").forEach(p=>{
                  (p.requiredOps||['Cut']).forEach(op=>allOps.add(op.toLowerCase()));
                });
              });
              const opToCapMap = { cut:"cut_straight", bevel:"bevel", drill:"drill", grind:"grind" };
              const missingOps = [...allOps].filter(op=>{ const cap=opToCapMap[op]; return cap&&!machCaps.includes(cap); });
              if (!missingOps.length) return null;
              return (
                <div style={{ marginTop:8, padding:"8px 12px", background:T.amberBg, borderRadius:6, border:`1px solid ${T.amber}44` }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.amber, marginBottom:6 }}>
                    ⚠ {missingOps.length} operation(s) not covered by selected machine: [{missingOps.map(o=>o.charAt(0).toUpperCase()+o.slice(1)).join(", ")}]
                  </div>
                  <div style={{ fontSize:11, color:T.textMid, marginBottom:8 }}>Assign secondary station for missing capabilities:</div>
                  {missingOps.map(op=>{
                    const capNeeded = opToCapMap[op];
                    const secMachines = (machines||[]).filter(m=>m.active!==false&&(m.capabilities||[]).includes(capNeeded));
                    const secAsgns = (asgn.secondaryAssignments||[]);
                    const secEntry = secAsgns.find(s=>s.capability===op)||{capability:op,machineId:"",startDate:"",endDate:""};
                    const updSec = (field,val) => {
                      const newSec = [...secAsgns.filter(s=>s.capability!==op),{...secEntry,[field]:val}];
                      updAsgn(r.matCode,"secondaryAssignments",newSec);
                    };
                    return (
                      <div key={op} style={{ display:"grid", gridTemplateColumns:"100px 1fr 100px 100px", gap:8, marginBottom:6, alignItems:"end" }}>
                        <div style={{ fontSize:11, color:T.text, fontWeight:600, paddingBottom:4 }}>{op.charAt(0).toUpperCase()+op.slice(1)}</div>
                        <div><label style={css.label}>Machine</label>
                          <select value={secEntry.machineId||""} onChange={e=>updSec("machineId",e.target.value)} style={{ ...css.input, fontSize:11 }}>
                            <option value="">Select...</option>
                            {secMachines.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                        </div>
                        <div><label style={css.label}>Start</label><input type="date" value={secEntry.startDate||""} onChange={e=>updSec("startDate",e.target.value)} style={{ ...css.input, fontSize:11 }} /></div>
                        <div><label style={css.label}>End</label><input type="date" value={secEntry.endDate||""} onChange={e=>updSec("endDate",e.target.value)} style={{ ...css.input, fontSize:11 }} /></div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        );
      })}
      <div style={{ marginTop:16, display:"flex", gap:8 }}>
        <button onClick={()=>setStep(3)} style={css.btn.ghost}>← Back</button>
        <button onClick={()=>setStep(5)} style={css.btn.primary}>Next: Assign Contractors →</button>
      </div>
    </div>
    );
  };

  const productionEngineers = USERS.filter(u=>u.role==="production_engineer"&&u.active);
  const STAGE_OPTS_ALL = [
    {id:"fitup",label:"Fit-Up"},{id:"welding",label:"Welding"},
    {id:"blasting",label:"Blasting"},{id:"painting",label:"Painting"},
  ];

  const Step5 = () => (
    <div>
      <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:4 }}>Step 5 — Assign Contractors</div>
      <div style={{ fontSize:12, color:T.textMid, marginBottom:14 }}>Assign contractors to each drawing and optionally pin a production engineer.</div>
      {selDrawings.map(({drawingId, orderId, drawing, order}) => {
        const ca = contAsgn[drawingId]||{};
        const stages = ca.stages||[];
        const toggleStage = s => updCont(drawingId,"stages", stages.includes(s)?stages.filter(x=>x!==s):[...stages,s]);
        return (
          <div key={drawingId+orderId} style={{ ...css.card, marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <span style={{ fontFamily:T.fontMono, fontWeight:700, color:T.accentHi }}>{drawing.drawingNo}</span>
                <span style={{ color:T.textMid, fontSize:11, marginLeft:8 }}>{orderId}</span>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label style={css.label}>Contractor</label>
                <select value={ca.contractorId||""} onChange={e=>updCont(drawingId,"contractorId",e.target.value)} style={css.input}>
                  <option value="">Select contractor...</option>
                  {(contractors||[]).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={css.label}>Pin to Engineer (optional)</label>
                <select value={ca.pinnedEngineerId||""} onChange={e=>updCont(drawingId,"pinnedEngineerId",e.target.value)} style={css.input}>
                  <option value="">No pin — shared queue</option>
                  {productionEngineers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop:10 }}>
              <label style={css.label}>Stages</label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {STAGE_OPTS_ALL.map(s=>(
                  <label key={s.id} style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, cursor:"pointer", color:stages.includes(s.id)?T.accent:T.textMid }}>
                    <input type="checkbox" checked={stages.includes(s.id)} onChange={()=>toggleStage(s.id)} />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ marginTop:16, display:"flex", gap:8 }}>
        <button onClick={()=>setStep(4)} style={css.btn.ghost}>← Back</button>
        <button onClick={confirm} style={css.btn.green}>✓ Create Release</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:20 }}>
        <button onClick={onBack} style={css.btn.ghost}>← Production</button>
        <div style={{ fontSize:18, fontWeight:800, color:T.text }}>New Production Release</div>
      </div>
      {/* Step indicator */}
      <div style={{ display:"flex", gap:4, marginBottom:24, alignItems:"center" }}>
        {["Select Drawings","RM Picture","Smart Suggestions","Assign Machines","Assign Contractors"].map((label,i)=>{
          const n = i+1;
          const active = step===n;
          const done = step>n;
          return (
            <React.Fragment key={n}>
              {i>0&&<div style={{ flex:1, height:2, background:done?T.accent:T.border, minWidth:20 }} />}
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:24, height:24, borderRadius:12, background:active?T.accent:done?T.green:T.border, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 }}>{done?"✓":n}</div>
                <span style={{ fontSize:11, color:active?T.accent:done?T.green:T.textMid, fontWeight:active?700:400, whiteSpace:"nowrap" }}>{label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      {step===1 && <Step1 />}
      {step===2 && <Step2 />}
      {step===3 && <Step3 />}
      {step===4 && <Step4 />}
      {step===5 && <Step5 />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 6: MACHINE OPERATOR QUEUE
// ═══════════════════════════════════════════════════════════════════════════════
const MachineOperatorQueue = ({ user, releases, setReleases, issueRequests, setIssueRequests, stock, materials }) => {
  // Get all machine assignments from all in_progress releases
  const allAssignments = releases.filter(r=>r.status==="in_progress").flatMap(r=>
    (r.machineAssignments||[]).map(a=>({...a, releaseId:r.id}))
  );

  // For each assignment, compute queue state (1-6)
  const getState = (a) => {
    if (!a.lotId) return 1; // RM not assigned
    const req = issueRequests.find(r=>r.machineAssignmentId===a.id);
    if (!req) return 2; // Request RM
    if (req.status==="pending") return 3; // Awaiting stores
    if (req.status==="issued") {
      if (a.cuttingComplete) return 6; // Cutting complete
      if (a.cuttingStarted) return 5; // Cutting in progress
      return 4; // RM in hand
    }
    if (req.status==="rejected") return 2; // Rejected, can re-request
    return 2;
  };

  const requestRM = (a) => {
    const yr = new Date().getFullYear();
    const seq = issueRequests.length + 1;
    const id = `IRQ-${yr}-${String(seq).padStart(3,"0")}`;
    const lot = stock.find(s=>s.id===a.lotId)||{};
    setIssueRequests(prev=>[...prev,{
      id, requestDate: new Date().toISOString().slice(0,10), requestedBy: user.username, requestedByName: user.name,
      machineId: a.machineId, machineName: a.machineName, releaseId: a.releaseId, machineAssignmentId: a.id,
      lotId: a.lotId, lotNo: lot.lotNo||"", matCode: a.matCode, wtRequested: lot.wtAvailable||0,
      status: "pending", remarks: "",
    }]);
  };

  const startCutting = (a) => {
    setReleases(prev=>prev.map(r=>({...r, machineAssignments:(r.machineAssignments||[]).map(ma=>
      ma.id===a.id ? {...ma, cuttingStarted:true, cuttingStartedBy:user.username, cuttingStartedDate:new Date().toISOString().slice(0,10)} : ma
    )})));
  };

  const completeCutting = (a) => {
    setReleases(prev=>prev.map(r=>({...r, machineAssignments:(r.machineAssignments||[]).map(ma=>
      ma.id===a.id ? {...ma, cuttingComplete:true, cuttingCompleteBy:user.username, cuttingCompleteDate:new Date().toISOString().slice(0,10)} : ma
    )})));
  };

  const STATE_LABELS = ["","RM NOT ASSIGNED","REQUEST RM","AWAITING STORES","RM IN HAND","CUTTING IN PROGRESS","CUTTING COMPLETE"];
  const STATE_COLORS = ["",T.textLow,T.accent,T.amber,T.green,T.accent,T.green];

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22,fontWeight:800,color:T.text }}>Machine Operator Queue</div>
        <div style={{ fontSize:13,color:T.textMid }}>{user.name} — {allAssignments.length} assignment{allAssignments.length!==1?"s":""}</div>
      </div>
      {allAssignments.length===0 && (
        <InfoBanner color="blue">No machine assignments yet. A production release must be created with machine assignments first.</InfoBanner>
      )}
      {allAssignments.map(a=>{
        const state = getState(a);
        const req = issueRequests.find(r=>r.machineAssignmentId===a.id);
        const lot = stock.find(s=>s.id===a.lotId)||{};
        const color = STATE_COLORS[state];
        return (
          <div key={a.id} style={{ ...css.card, marginBottom:12, borderLeft:`4px solid ${color}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ fontFamily:T.fontMono, fontSize:13, fontWeight:700, color:T.accentHi }}>{a.matCode}</div>
                <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>
                  {a.machineName} · Release {a.releaseId}
                  {a.startDate && <span> · Cut: {a.startDate} → {a.endDate}</span>}
                </div>
              </div>
              <div style={{ background:color, color:state===2?T.text:"#fff", fontSize:10, fontWeight:800, borderRadius:4, padding:"3px 8px", whiteSpace:"nowrap" }}>
                STATE {state} — {STATE_LABELS[state]}
              </div>
            </div>

            {/* Lot info */}
            {a.lotId && <div style={{ fontSize:12, color:T.textMid, marginBottom:8 }}>
              Lot: <span style={{ color:T.text, fontFamily:T.fontMono }}>{lot.lotNo||a.lotId}</span>
              {lot.bayId && <span> · Bay: {lot.bayId}</span>}
              {lot.wtAvailable>0 && <span> · {(lot.wtAvailable||0).toFixed(1)} kg available</span>}
            </div>}

            {/* Issue request info */}
            {req && <div style={{ fontSize:11, padding:"6px 10px", background:T.bgInput, borderRadius:5, marginBottom:8 }}>
              Request: <span style={{ fontFamily:T.fontMono, color:T.accentHi }}>{req.id}</span>
              <Badge color={req.status==="issued"?"green":req.status==="rejected"?"red":"amber"} style={{ marginLeft:8 }}>{req.status}</Badge>
              {req.issuedBy && <span style={{ color:T.textMid, marginLeft:8 }}>Issued by {req.issuedBy} on {req.issueDate}</span>}
              {req.status==="rejected" && req.remarks && <div style={{ color:T.red, marginTop:4 }}>Rejected: {req.remarks}</div>}
            </div>}

            {/* Actions by state */}
            {state===1 && <InfoBanner color="gray">No lot assigned to this machine task. Contact the production manager.</InfoBanner>}
            {state===2 && (
              <button onClick={()=>requestRM(a)} style={{ ...css.btn.primary, width:"100%" }}>
                📦 Request Issue from Stores
              </button>
            )}
            {state===3 && (
              <div style={{ padding:"10px 14px", background:T.amberBg, border:`1px solid ${T.amber}44`, borderRadius:6, fontSize:12, color:T.amber, textAlign:"center" }}>
                ⏳ Awaiting store confirmation — Request {req?.id}
              </div>
            )}
            {state===4 && (
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>startCutting(a)} style={{ ...css.btn.green, flex:1 }}>
                  ✂ Mark Parts Cut — Start
                </button>
              </div>
            )}
            {state===5 && (
              <div>
                <div style={{ fontSize:12, color:T.accent, marginBottom:10, fontWeight:700 }}>CUTTING IN PROGRESS — Complete all sub-operations, then mark complete.</div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>completeCutting(a)} style={{ ...css.btn.primary, flex:1, padding:"12px 0", fontSize:15, fontWeight:800 }}>
                    ✓ MARK CUTTING COMPLETE
                  </button>
                </div>
              </div>
            )}
            {state===6 && (
              <div style={{ padding:"10px 14px", background:T.greenBg, border:`1px solid ${T.green}44`, borderRadius:6, fontSize:12, color:T.green, textAlign:"center", fontWeight:700 }}>
                ✓ CUTTING COMPLETE — Pending production engineer sign-off
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── C4: Step Configuration Modal ─────────────────────────────────────────────
const EXTRA_STEP_TYPES = ["Bending","Rolling","Galvanising","Drilling","Bevelling","Notching","Other"];

const StepConfigModal = ({ drawings, orders, machines, contractors, parts, onSave, onClose }) => {
  const DEFAULT_STEPS = ["Cutting","Welding","Blasting","Painting"];
  const [configs, setConfigs] = useState(() => {
    return (drawings||[]).map(d=>{
      const order = (orders||[]).find(o=>(o.drawings||[]).find(dd=>dd.id===d.drawingId))||{};
      const drg = (order.drawings||[]).find(dd=>dd.id===d.drawingId)||{};
      const existingSteps = drg.productionSteps || DEFAULT_STEPS.map(s=>({name:s,type:"Internal",contractor:"",contactPerson:"",scopeOfWork:"",turnaroundDays:""}));
      const drgParts = (parts||[]).filter(p=>p.drawingId===d.drawingId&&p.fabType==="Fabricate");
      return { drawingId:d.drawingId, drawingNo:d.drawingNo||d.drawingId, steps:existingSteps, parts:drgParts.map(p=>({...p,ops:[...(p.requiredOps||['Cut'])]})) };
    });
  });

  const updConfig = (dIdx, newConf) => setConfigs(prev=>prev.map((c,i)=>i===dIdx?newConf:c));
  const addExtraStep = (dIdx, afterIdx, stepName) => {
    const conf = configs[dIdx];
    const newSteps = [...conf.steps];
    newSteps.splice(afterIdx+1,0,{name:stepName,type:"Outbound",contractor:"",contactPerson:"",scopeOfWork:"",turnaroundDays:""});
    updConfig(dIdx, {...conf,steps:newSteps});
  };
  const removeStep = (dIdx, stepIdx) => {
    const conf = configs[dIdx];
    if (DEFAULT_STEPS.includes(conf.steps[stepIdx].name)) return;
    updConfig(dIdx, {...conf,steps:conf.steps.filter((_,i)=>i!==stepIdx)});
  };

  return (
    <Modal title="Configure Production Steps" onClose={onClose} width={900}>
      <div style={{ maxHeight:"70vh", overflowY:"auto" }}>
        {configs.map((conf,dIdx)=>(
          <div key={conf.drawingId} style={{ marginBottom:24, padding:16, background:T.bgInput, borderRadius:8 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.accentHi, marginBottom:12 }}>{conf.drawingNo}</div>

            {/* Steps */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:T.textMid, marginBottom:8 }}>PRODUCTION STEPS</div>
              {conf.steps.map((step,sIdx)=>(
                <div key={sIdx} style={{ marginBottom:8 }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center", padding:"8px 12px", background:T.bg, borderRadius:6, border:`1px solid ${T.border}` }}>
                    <span style={{ fontSize:11, fontWeight:700, color:T.text, minWidth:80 }}>{step.name}</span>
                    <select value={step.type} onChange={e=>{const s=[...conf.steps];s[sIdx]={...s[sIdx],type:e.target.value};updConfig(dIdx,{...conf,steps:s});}} style={{ ...css.input, fontSize:11, padding:"3px 6px", width:120 }}>
                      <option value="Internal">Internal</option>
                      <option value="Outbound">Outbound</option>
                    </select>
                    {!DEFAULT_STEPS.includes(step.name) && (
                      <button onClick={()=>removeStep(dIdx,sIdx)} style={{ ...css.btn.sm, color:T.red, padding:"2px 8px", fontSize:10 }}>✕ Remove</button>
                    )}
                  </div>
                  {step.type==="Outbound" && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, padding:"8px 12px", background:T.amberBg+"44", borderRadius:"0 0 6px 6px", border:`1px solid ${T.amber}44`, borderTop:"none" }}>
                      <div><label style={css.label}>Contractor</label>
                        <select value={step.contractor||""} onChange={e=>{const s=[...conf.steps];s[sIdx]={...s[sIdx],contractor:e.target.value};updConfig(dIdx,{...conf,steps:s});}} style={{ ...css.input, fontSize:11 }}>
                          <option value="">Select...</option>
                          {(contractors||[]).map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                      <div><label style={css.label}>Contact Person</label><input value={step.contactPerson||""} onChange={e=>{const s=[...conf.steps];s[sIdx]={...s[sIdx],contactPerson:e.target.value};updConfig(dIdx,{...conf,steps:s});}} style={{ ...css.input, fontSize:11 }} /></div>
                      <div style={{ gridColumn:"span 2" }}><label style={css.label}>Scope of Work</label><textarea value={step.scopeOfWork||""} onChange={e=>{const s=[...conf.steps];s[sIdx]={...s[sIdx],scopeOfWork:e.target.value};updConfig(dIdx,{...conf,steps:s});}} rows={2} style={{ ...css.input, resize:"vertical", fontSize:11 }} /></div>
                      <div><label style={css.label}>Turnaround (days)</label><input type="number" value={step.turnaroundDays||""} onChange={e=>{const s=[...conf.steps];s[sIdx]={...s[sIdx],turnaroundDays:e.target.value};updConfig(dIdx,{...conf,steps:s});}} style={{ ...css.input, fontSize:11 }} /></div>
                    </div>
                  )}
                  {sIdx < conf.steps.length-1 && (
                    <div style={{ textAlign:"center", margin:"4px 0" }}>
                      <select defaultValue="" onChange={e=>{if(e.target.value)addExtraStep(dIdx,sIdx,e.target.value);e.target.value="";}} style={{ ...css.input, fontSize:10, padding:"2px 8px", width:"auto" }}>
                        <option value="">+ Add step after {step.name}...</option>
                        {EXTRA_STEP_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Assembly read-only card */}
            {(() => {
              const drg = (drawings||[]).find(d => d.drawingId === conf.drawingId) ||
                          (orders||[]).flatMap(o=>o.drawings||[]).find(d=>d.id===conf.drawingId);
              if (!drg?.assemblyGroup) return null;
              return (
                <div style={{background:'#7c3aed11',border:'1px solid #7c3aed55',borderRadius:6,padding:10,margin:'6px 0',display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:13,fontWeight:600,color:'#a78bfa'}}>Assembly</span>
                  <span style={{fontSize:12,color:'#94a3b8',marginLeft:4}}>{drg.assemblyGroup}</span>
                  <span style={{fontSize:11,color:'#64748b',marginLeft:'auto',fontStyle:'italic'}}>auto-inserted between Welding and Blasting</span>
                </div>
              );
            })()}

            {/* Part operations */}
            {conf.parts.length>0 && (
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:T.textMid, marginBottom:8 }}>PART OPERATIONS</div>
                <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse" }}>
                  <thead><tr style={{ color:T.textMid }}>
                    <TH>Mark No</TH><TH>Description</TH>
                    {["Cut","Bevel","Drill","Grind"].map(op=><TH key={op}>{op}</TH>)}
                  </tr></thead>
                  <tbody>
                    {conf.parts.map((p,pIdx)=>(
                      <tr key={p.id} style={{ borderTop:`1px solid ${T.border}` }}>
                        <TD mono>{p.markNo}</TD>
                        <TD>{p.desc}</TD>
                        {["Cut","Bevel","Drill","Grind"].map(op=>(
                          <TD key={op}>
                            <input type="checkbox" checked={(p.ops||[]).includes(op)} onChange={e=>{
                              const newParts=[...conf.parts];const curOps=p.ops||[];
                              newParts[pIdx]={...p,ops:e.target.checked?[...curOps,op]:curOps.filter(o=>o!==op)};
                              updConfig(dIdx,{...conf,parts:newParts});
                            }} style={{ accentColor:T.accent }} />
                            {op==='Drill' && (p.ops||[]).includes('Drill') && (() => {
                              const hasDrillMachine = (machines||[]).some(m => m.active !== false && (m.capabilities||[]).includes('drill'));
                              if (hasDrillMachine) return null;
                              return (
                                <div style={{fontSize:11,color:'#f59e0b',marginTop:2,marginLeft:24}}>
                                  ⚠ No drill-capable machine found — secondary station will be required
                                </div>
                              );
                            })()}
                          </TD>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:16 }}>
        <button onClick={onClose} style={css.btn.secondary}>Cancel</button>
        <button onClick={()=>onSave(configs)} style={css.btn.primary}>Save Steps</button>
      </div>
    </Modal>
  );
};

// ─── C3: Cross-Order Production Drawing Register ──────────────────────────────
const ProductionDrawingRegister = ({ orders, instances, stock, releases, contractors, machines, onBack }) => {
  const [filterOrder, setFilterOrder] = useState("");
  const [filterAssembly, setFilterAssembly] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [filterContractor, setFilterContractor] = useState("");
  const [excludeMissingRM, setExcludeMissingRM] = useState(false);
  const [criticalFirst, setCriticalFirst] = useState(false);
  const [expanded, setExpanded] = useState(new Set());
  const [selected, setSelected] = useState(new Set());
  const [stepConfigModal, setStepConfigModal] = useState(false);

  // Derive drawing list from all orders
  const allDrawings = [];
  (orders||[]).forEach(o => {
    (o.drawings||[]).filter(d=>d.receivedDate).forEach(d => {
      const parts = (o.parts||[]).filter(p=>p.drawingId===d.id&&p.fabType==="Fabricate");
      const totalParts = parts.length * (d.qty||1);
      const cutInsts = (instances||[]).filter(i=>i.drawingId===d.id&&i.orderId===o.id&&["cutting_qc","fitup","welding","tpi_weld","assembly","blasting","tpi_blast","painting","tpi_paint","mdcc","dispatch"].includes(i.currentStage));
      const matCodes = [...new Set(parts.map(p=>p.matCode).filter(Boolean))];
      const rmCoverage = matCodes.map(mc=>{
        const totalKg = parts.filter(p=>p.matCode===mc).reduce((s,p)=>s+(p.calcTotalWt||p.clientTotalWt||0),0);
        const availKg = (stock||[]).filter(s=>(s.matCode===mc||s.itemCode?.startsWith(mc))&&["available","reserved","allocated"].includes(s.status)).reduce((a,s)=>a+(s.wtAvailable||0),0);
        return { mc, totalKg, availKg, ok:availKg>=totalKg*0.9 };
      });
      const hasRM = rmCoverage.every(r=>r.availKg>0);
      const asmGroup = (o.assemblies||[]).find(a=>a.id===d.assemblyGroup);
      const allInsts = (instances||[]).filter(i=>i.drawingId===d.id&&i.orderId===o.id);
      const latestStage = allInsts.length>0 ? allInsts.reduce((s,i)=>{
        const stages=["cutting","cutting_qc","fitup","welding","tpi_weld","assembly","blasting","tpi_blast","painting","tpi_paint","mdcc","dispatch"];
        return stages.indexOf(i.currentStage)>stages.indexOf(s)?i.currentStage:s;
      },"cutting") : "not_started";
      const rel = (releases||[]).find(r=>(r.drawings||[]).includes(d.id)&&r.orderId===o.id);
      const conName = rel?.contractorName||"";
      allDrawings.push({ drawingId:d.id, drawingNo:d.drawingNo, title:d.title, orderId:o.id, orderRef:o.id, clientId:o.clientId, assemblyGroup:d.assemblyGroup||"", assemblyName:asmGroup?.assemblyName||"", tier:d.priority<=1?"Critical":"Standard", priority:d.priority||1, totalParts, cutParts:cutInsts.length, matCodes, rmCoverage, hasRM, latestStage, parts, contractorName:conName, endDate:o.endDate||"" });
    });
  });

  let filtered = allDrawings;
  if (filterOrder) filtered = filtered.filter(d=>d.orderId===filterOrder);
  if (filterAssembly) filtered = filtered.filter(d=>d.assemblyGroup===filterAssembly);
  if (filterStage) filtered = filtered.filter(d=>d.latestStage===filterStage);
  if (filterContractor) filtered = filtered.filter(d=>d.contractorName===filterContractor);
  if (excludeMissingRM) filtered = filtered.filter(d=>d.hasRM);
  if (criticalFirst) filtered = [...filtered].sort((a,b)=>a.priority-b.priority);

  const allAssemblies = [];
  (orders||[]).forEach(o=>(o.assemblies||[]).forEach(a=>allAssemblies.push({...a,orderId:o.id})));
  const allContractors = [...new Set((releases||[]).map(r=>r.contractorName).filter(Boolean))];

  const toggleExpand = (key) => {
    const s = new Set(expanded);
    s.has(key)?s.delete(key):s.add(key);
    setExpanded(s);
  };
  const toggleSelect = (key) => {
    const s = new Set(selected);
    s.has(key)?s.delete(key):s.add(key);
    setSelected(s);
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <button onClick={onBack} style={css.btn.ghost}>← Dashboard</button>
        <div style={{ fontSize:18, fontWeight:800, color:T.text }}>Cross-Order Drawing Register</div>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        <select value={filterOrder} onChange={e=>setFilterOrder(e.target.value)} style={{ ...css.input, width:180 }}>
          <option value="">All Orders</option>
          {(orders||[]).filter(o=>o.status==="active").map(o=><option key={o.id} value={o.id}>{o.id}</option>)}
        </select>
        <select value={filterAssembly} onChange={e=>setFilterAssembly(e.target.value)} style={{ ...css.input, width:180 }}>
          <option value="">All Assemblies</option>
          {allAssemblies.map(a=><option key={a.id} value={a.id}>{a.assemblyName||a.assemblyNumber}</option>)}
        </select>
        <select value={filterStage} onChange={e=>setFilterStage(e.target.value)} style={{ ...css.input, width:150 }}>
          <option value="">All Stages</option>
          {["not_started","cutting","cutting_qc","fitup","welding","blasting","painting","mdcc","dispatch"].map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}
        </select>
        <select value={filterContractor} onChange={e=>setFilterContractor(e.target.value)} style={{ ...css.input, width:160 }}>
          <option value="">All Contractors</option>
          {allContractors.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:T.text, cursor:"pointer" }}>
          <input type="checkbox" checked={excludeMissingRM} onChange={e=>setExcludeMissingRM(e.target.checked)} style={{ accentColor:T.accent }} />
          Exclude Missing RM
        </label>
        <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:T.text, cursor:"pointer" }}>
          <input type="checkbox" checked={criticalFirst} onChange={e=>setCriticalFirst(e.target.checked)} style={{ accentColor:T.accent }} />
          Critical First
        </label>
      </div>

      {/* Action bar */}
      {selected.size>0 && (
        <div style={{ display:"flex", gap:8, marginBottom:12, padding:"10px 14px", background:T.accent+"22", borderRadius:8, alignItems:"center" }}>
          <span style={{ fontSize:12, color:T.accent, fontWeight:600 }}>{selected.size} drawing(s) selected</span>
          <button style={css.btn.primary} onClick={()=>setStepConfigModal(true)}>Configure Steps</button>
          <button style={{ ...css.btn.secondary, color:T.amber }} onClick={()=>{
            const rows = filtered;
            const orderRefs = [...new Set([...selected].map(id => {
              const row = rows.find(r => r.drawingId === id.split("/")[0] && r.orderId === id.split("/")[1]);
              return row?.orderRef || row?.orderId;
            }))].filter(Boolean).join(', ');
            alert(`Navigate to Stock → Reservations to reserve material for order(s): ${orderRefs}`);
          }}>Reserve Stock</button>
          <button style={{ ...css.btn.ghost }} onClick={()=>setSelected(new Set())}>Clear</button>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr>
              <TH></TH>
              <TH>Drawing No</TH><TH>Order</TH><TH>Client</TH><TH>Assembly Group</TH>
              <TH>Tier</TH><TH>Priority</TH><TH>Parts Cut/Total</TH>
              <TH>RM Types</TH><TH>Stage</TH><TH>Status</TH>
            </tr>
          </thead>
          <tbody>
            {filtered.length===0&&<tr><td colSpan={11} style={{ padding:32,textAlign:"center",color:T.textLow }}>No drawings found</td></tr>}
            {filtered.map(d=>{
              const key = `${d.drawingId}/${d.orderId}`;
              const isExp = expanded.has(key);
              const isSel = selected.has(key);
              const rmOk = d.rmCoverage.every(r=>r.availKg>=r.totalKg*0.9);
              const rmPartial = !rmOk && d.rmCoverage.some(r=>r.availKg>0);
              const rmColor = rmOk?T.green:rmPartial?T.amber:T.red;
              return (
                <React.Fragment key={key}>
                  <tr style={{ background:isSel?`${T.accent}22`:isExp?`${T.accent}11`:"transparent", borderBottom:`1px solid ${T.border}`, cursor:"pointer" }}>
                    <TD onClick={e=>{e.stopPropagation();toggleSelect(key);}}>
                      <input type="checkbox" checked={isSel} onChange={()=>{}} style={{ accentColor:T.accent }} />
                    </TD>
                    <TD onClick={()=>toggleExpand(key)} mono>{d.drawingNo}</TD>
                    <TD onClick={()=>toggleExpand(key)}><Badge color="blue">{d.orderId}</Badge></TD>
                    <TD onClick={()=>toggleExpand(key)}>{d.clientId}</TD>
                    <TD onClick={()=>toggleExpand(key)}>{d.assemblyName||<span style={{color:T.textLow}}>—</span>}</TD>
                    <TD onClick={()=>toggleExpand(key)}><Badge color={d.tier==="Critical"?"red":"gray"}>{d.tier}</Badge></TD>
                    <TD onClick={()=>toggleExpand(key)} mono>{d.priority}</TD>
                    <TD onClick={()=>toggleExpand(key)} mono>{d.cutParts}/{d.totalParts}</TD>
                    <TD onClick={()=>toggleExpand(key)}>
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                        {d.matCodes.map(mc=>{
                          const r = d.rmCoverage.find(x=>x.mc===mc);
                          const c = r?.availKg>=r?.totalKg*0.9?T.green:r?.availKg>0?T.amber:T.red;
                          return <span key={mc} style={{ fontSize:10, padding:"1px 5px", borderRadius:3, background:c+"22", color:c, border:`1px solid ${c}44` }}>{mc.split("/").slice(-1)[0]}</span>;
                        })}
                      </div>
                    </TD>
                    <TD onClick={()=>toggleExpand(key)}><Badge color="gray">{d.latestStage.replace("_"," ")}</Badge></TD>
                    <TD onClick={()=>toggleExpand(key)}>
                      <span style={{ width:8, height:8, borderRadius:"50%", display:"inline-block", background:rmColor, marginRight:4 }}></span>
                      {rmOk?"RM OK":rmPartial?"Partial":d.latestStage==="not_started"?"Not Started":"In Progress"}
                    </TD>
                  </tr>
                  {isExp && (
                    <tr style={{ background:`${T.accent}08` }}>
                      <td colSpan={11} style={{ padding:"12px 16px" }}>
                        {/* Section A: Part status */}
                        <div style={{ marginBottom:12 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:T.textMid, marginBottom:6 }}>PARTS</div>
                          <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse" }}>
                            <thead><tr style={{ color:T.textMid }}>
                              <th style={{ textAlign:"left", padding:"2px 8px" }}>Mark No</th>
                              <th style={{ textAlign:"left", padding:"2px 8px" }}>Description</th>
                              <th style={{ textAlign:"left", padding:"2px 8px" }}>Section/Size</th>
                              <th style={{ textAlign:"right", padding:"2px 8px" }}>Qty</th>
                              <th style={{ textAlign:"left", padding:"2px 8px" }}>Stage</th>
                            </tr></thead>
                            <tbody>
                              {d.parts.map(p=>{
                                const pInsts = (instances||[]).filter(i=>i.markNo===p.markNo&&i.drawingId===d.drawingId&&i.orderId===d.orderId);
                                const stage = pInsts.length>0?pInsts[0].currentStage:"not_started";
                                return (
                                  <tr key={p.id} style={{ borderTop:`1px solid ${T.border}` }}>
                                    <td style={{ padding:"3px 8px", fontFamily:T.fontMono }}>{p.markNo}</td>
                                    <td style={{ padding:"3px 8px" }}>{p.desc}</td>
                                    <td style={{ padding:"3px 8px", fontFamily:T.fontMono }}>{p.section} {p.size}</td>
                                    <td style={{ padding:"3px 8px", textAlign:"right" }}>{p.qtyPerDrg}</td>
                                    <td style={{ padding:"3px 8px" }}><Badge color="gray">{stage.replace("_"," ")}</Badge></td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        {/* Section B: RM status */}
                        <div>
                          <div style={{ fontSize:11, fontWeight:700, color:T.textMid, marginBottom:6 }}>RM STATUS</div>
                          <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse" }}>
                            <thead><tr style={{ color:T.textMid }}>
                              <th style={{ textAlign:"left", padding:"2px 8px" }}>Mat Code</th>
                              <th style={{ textAlign:"right", padding:"2px 8px" }}>Req kg</th>
                              <th style={{ textAlign:"right", padding:"2px 8px" }}>Avail kg</th>
                              <th style={{ textAlign:"left", padding:"2px 8px" }}>Status</th>
                            </tr></thead>
                            <tbody>
                              {d.rmCoverage.map(r=>(
                                <tr key={r.mc} style={{ borderTop:`1px solid ${T.border}` }}>
                                  <td style={{ padding:"3px 8px", fontFamily:T.fontMono }}>{r.mc}</td>
                                  <td style={{ padding:"3px 8px", textAlign:"right" }}>{fmt.num(r.totalKg)}</td>
                                  <td style={{ padding:"3px 8px", textAlign:"right", color:r.availKg>=r.totalKg*0.9?T.green:T.amber }}>{fmt.num(r.availKg)}</td>
                                  <td style={{ padding:"3px 8px" }}>
                                    <span style={{ color:r.availKg>=r.totalKg*0.9?T.green:r.availKg>0?T.amber:T.red, fontWeight:600, fontSize:11 }}>
                                      {r.availKg>=r.totalKg*0.9?"Sufficient":r.availKg>0?"Partial":"Missing"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {/* Section C: Assignment */}
                        <div style={{marginTop:12}}>
                          <div style={{fontWeight:600,fontSize:12,color:'#aaa',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>Assignment</div>
                          {(() => {
                            const rel = (releases||[]).find(r =>
                              r.orderId === d.orderId &&
                              (r.drawings||[]).some(rd => rd.drawingId === d.drawingId)
                            );
                            const ma = rel ? (rel.machineAssignments||[]).find(ma2 =>
                              d.parts.some(p => p.matCode === ma2.matCode)
                            ) : null;
                            const machine = ma ? (machines||[]).find(m => m.id === ma.machineId) : null;
                            const drgObj = (orders||[]).flatMap(o=>o.drawings||[]).find(dr=>dr.id===d.drawingId);
                            const contrSteps = (drgObj?.productionSteps||[]).filter(s => s.type === 'Outbound');
                            return (
                              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                                <tbody>
                                  <tr style={{borderBottom:'1px solid #1e293b'}}>
                                    <td style={{padding:'4px 8px',color:'#94a3b8',width:140}}>Assigned Machine</td>
                                    <td style={{padding:'4px 8px',color:'#e2e8f0'}}>{machine ? `${machine.name} (${machine.bayLocation||'—'})` : '—'}</td>
                                  </tr>
                                  <tr style={{borderBottom:'1px solid #1e293b'}}>
                                    <td style={{padding:'4px 8px',color:'#94a3b8'}}>Machine Assignment</td>
                                    <td style={{padding:'4px 8px',color:'#e2e8f0'}}>
                                      {ma ? `${ma.startDate||'—'} → ${ma.endDate||'—'}` : '—'}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style={{padding:'4px 8px',color:'#94a3b8'}}>Outbound Steps</td>
                                    <td style={{padding:'4px 8px',color:'#e2e8f0'}}>
                                      {contrSteps.length === 0 ? '—' : contrSteps.map((s,i) => (
                                        <span key={i} style={{marginRight:8,background:'#7c3aed22',border:'1px solid #7c3aed55',borderRadius:4,padding:'1px 6px',color:'#a78bfa',fontSize:11}}>
                                          {s.name}{s.contractorName ? ` — ${s.contractorName}` : ''}
                                        </span>
                                      ))}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            );
                          })()}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {stepConfigModal && (
        <StepConfigModal
          drawings={[...selected].map(k=>{const [drawingId,orderId]=k.split("/");return {drawingId,orderId};})}
          orders={orders}
          machines={[]}
          contractors={contractors}
          parts={(orders||[]).flatMap(o=>o.parts||[])}
          onSave={(configs)=>{
            setStepConfigModal(false);
          }}
          onClose={()=>setStepConfigModal(false)}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// QC ADMIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
const QC_PROCESS_TYPES = ['Cutting QC','Weld QC','Blast QC','Paint QC','Assembly QC'];
const STAGE_TO_PROCESS = {
  cutting_qc:'Cutting QC', welding:'Weld QC', tpi_weld:'Weld QC',
  blasting:'Blast QC', tpi_blast:'Blast QC',
  painting:'Paint QC', tpi_paint:'Paint QC',
  assembly:'Assembly QC',
};

const QcAdminScreen = ({ user, instances, setInstances, orders, qcRules, setQcRules, overrideLog, setOverrideLog }) => {
  const [tab, setTab] = useState("pending");
  const [ruleModal, setRuleModal] = useState(null);
  const [ruleForm, setRuleForm] = useState({});
  const [overrideModal, setOverrideModal] = useState(null);
  const [overrideInst, setOverrideInst] = useState(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideEngineer, setOverrideEngineer] = useState("");

  const canEdit = ["super_admin","qc_admin"].includes(user.role);
  const engineers = USERS.filter(u=>["production_engineer","qc_admin","super_admin"].includes(u.role)&&u.active);

  // Pending jobs — instances at pending_supervisor
  const pendingJobs = instances.filter(i=>i.currentStatus==="pending_supervisor");

  // Get process type from stage
  const getProcessType = (stage) => STAGE_TO_PROCESS[stage]||"";

  // Auto-assign based on qcRules
  const getAssignedEngineer = (stage) => {
    const proc = getProcessType(stage);
    const rule = qcRules.find(r=>r.processType===proc);
    return rule ? (engineers.find(u=>u.id===rule.assignedEngineerId)||null) : null;
  };

  const doOverride = () => {
    if (!overrideReason.trim()||!overrideEngineer) return;
    const inst = overrideInst;
    setInstances(prev=>prev.map(i=>i.instanceId===inst.instanceId?{...i,assignedEngineer:overrideEngineer}:i));
    setOverrideLog(prev=>[...prev,{
      instanceId:inst.instanceId, markNo:inst.markNo, drawingId:inst.drawingId,
      overriddenBy:user.username, overriddenAt:today(), reason:overrideReason.trim(),
      assignedTo:overrideEngineer
    }]);
    setOverrideModal(null); setOverrideInst(null); setOverrideReason(""); setOverrideEngineer("");
  };

  const saveRule = () => {
    if (!ruleForm.processType||!ruleForm.assignedEngineerId) return;
    const newRule = { id:ruleForm.id||`QCR-${Date.now()}`, processType:ruleForm.processType, assignedEngineerId:ruleForm.assignedEngineerId };
    if (ruleModal==="add") {
      setQcRules(prev=>[...prev.filter(r=>r.processType!==newRule.processType), newRule]);
    } else {
      setQcRules(prev=>prev.map(r=>r.id===newRule.id?newRule:r));
    }
    setRuleModal(null); setRuleForm({});
  };

  const deleteRule = (id) => setQcRules(prev=>prev.filter(r=>r.id!==id));

  const tabs = [
    {id:"pending",label:`Pending Jobs (${pendingJobs.length})`},
    {id:"rules",label:"Assignment Rules"},
    {id:"log",label:`Override Log (${overrideLog.length})`},
  ];

  return (
    <div>
      <div style={{ fontSize:20, fontWeight:800, color:T.text, marginBottom:16 }}>QC Admin — Assignment</div>
      <TabBar2 tabs={tabs} active={tab} onChange={setTab} />

      {tab==="pending" && (
        <div>
          {pendingJobs.length===0 && (
            <div style={{ textAlign:"center", padding:48, color:T.textLow }}>No pending QC jobs.</div>
          )}
          <div style={{ overflowX:"auto" }}>
            {pendingJobs.length>0 && (
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead><tr>
                  {["Mark No","Drawing","Order","Stage","Process Type","Assigned Engineer","Time in Queue","Priority","Action"].map(h=>(
                    <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:11, fontWeight:700, color:T.textMid, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {pendingJobs.map(i=>{
                    const order = orders.find(o=>o.id===i.orderId);
                    const proc = getProcessType(i.currentStage);
                    const assignedEng = i.assignedEngineer ? engineers.find(u=>u.id===i.assignedEngineer) : getAssignedEngineer(i.currentStage);
                    const lastHistEntry = (i.stageHistory||[]).slice(-1)[0];
                    const markedDate = lastHistEntry?.markedDoneDate||"";
                    const daysSince = markedDate ? Math.floor((Date.now()-new Date(markedDate).getTime())/86400000) : "?";
                    const isUrgent = order?.endDate && order.endDate < today();
                    return (
                      <tr key={i.instanceId} style={{ borderBottom:`1px solid ${T.border}`, background:isUrgent?T.redBg:"transparent" }}>
                        <td style={{ padding:"7px 10px", fontFamily:T.fontMono, fontWeight:700 }}>{i.markNo}</td>
                        <td style={{ padding:"7px 10px" }}>{i.drawingNo||i.drawingId}</td>
                        <td style={{ padding:"7px 10px" }}>{i.orderId}</td>
                        <td style={{ padding:"7px 10px" }}><Badge color="blue">{(i.currentStage||"").replace("_"," ")}</Badge></td>
                        <td style={{ padding:"7px 10px" }}>{proc||"—"}</td>
                        <td style={{ padding:"7px 10px", color:assignedEng?T.green:T.amber }}>{assignedEng?.name||"Unassigned"}</td>
                        <td style={{ padding:"7px 10px", color:T.textMid }}>{daysSince} day{daysSince!==1?"s":""}</td>
                        <td style={{ padding:"7px 10px" }}>{isUrgent?<Badge color="red">Overdue</Badge>:<Badge color="gray">Normal</Badge>}</td>
                        <td style={{ padding:"7px 10px" }}>
                          {canEdit && (
                            <button onClick={()=>{setOverrideInst(i);setOverrideEngineer(i.assignedEngineer||"");setOverrideReason("");setOverrideModal(true);}} style={css.btn.sm}>Reassign</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab==="rules" && (
        <div>
          {canEdit && (
            <div style={{ marginBottom:14 }}>
              <button onClick={()=>{setRuleForm({});setRuleModal("add");}} style={css.btn.primary}>+ Add Rule</button>
            </div>
          )}
          {qcRules.length===0 && <div style={{ color:T.textLow, fontSize:12 }}>No assignment rules. Add a rule to auto-assign engineers to QC stages.</div>}
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead><tr>
              {["Process Type","Assigned Engineer","Action"].map(h=>(
                <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:11, fontWeight:700, color:T.textMid, borderBottom:`1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {qcRules.map(r=>{
                const eng = engineers.find(u=>u.id===r.assignedEngineerId);
                return (
                  <tr key={r.id} style={{ borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:"7px 10px" }}><Badge color="blue">{r.processType}</Badge></td>
                    <td style={{ padding:"7px 10px" }}>{eng?.name||r.assignedEngineerId}</td>
                    <td style={{ padding:"7px 10px", display:"flex", gap:6 }}>
                      {canEdit&&<button onClick={()=>{setRuleForm({...r});setRuleModal("edit");}} style={css.btn.sm}>Edit</button>}
                      {canEdit&&<button onClick={()=>deleteRule(r.id)} style={{ ...css.btn.sm,color:T.red }}>Delete</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab==="log" && (
        <div>
          {overrideLog.length===0 && <div style={{ color:T.textLow, fontSize:12 }}>No override log entries.</div>}
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead><tr>
              {["Date","Mark No","Drawing","Assigned To","Override By","Reason"].map(h=>(
                <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:11, fontWeight:700, color:T.textMid, borderBottom:`1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {overrideLog.map((entry,i)=>(
                <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                  <td style={{ padding:"7px 10px" }}>{entry.overriddenAt}</td>
                  <td style={{ padding:"7px 10px", fontFamily:T.fontMono }}>{entry.markNo}</td>
                  <td style={{ padding:"7px 10px" }}>{entry.drawingId}</td>
                  <td style={{ padding:"7px 10px" }}>{engineers.find(u=>u.id===entry.assignedTo)?.name||entry.assignedTo}</td>
                  <td style={{ padding:"7px 10px" }}>{entry.overriddenBy}</td>
                  <td style={{ padding:"7px 10px" }}>{entry.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rule Modal */}
      {ruleModal && (
        <Modal title={ruleModal==="add"?"Add Assignment Rule":"Edit Assignment Rule"} onClose={()=>{setRuleModal(null);setRuleForm({});}}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div><label style={css.label}>Process Type *</label>
              <select value={ruleForm.processType||""} onChange={e=>setRuleForm(f=>({...f,processType:e.target.value}))} style={css.input}>
                <option value="">Select...</option>
                {QC_PROCESS_TYPES.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div><label style={css.label}>Assigned Engineer *</label>
              <select value={ruleForm.assignedEngineerId||""} onChange={e=>setRuleForm(f=>({...f,assignedEngineerId:e.target.value}))} style={css.input}>
                <option value="">Select...</option>
                {engineers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:16 }}>
            <button onClick={()=>{setRuleModal(null);setRuleForm({});}} style={css.btn.secondary}>Cancel</button>
            <button onClick={saveRule} disabled={!ruleForm.processType||!ruleForm.assignedEngineerId} style={{ ...css.btn.primary, opacity:(!ruleForm.processType||!ruleForm.assignedEngineerId)?0.4:1 }}>Save Rule</button>
          </div>
        </Modal>
      )}

      {/* Override Modal */}
      {overrideModal && overrideInst && (
        <Modal title={`Reassign — ${overrideInst.markNo}`} onClose={()=>{setOverrideModal(null);setOverrideInst(null);setOverrideReason("");}}>
          <div style={{ marginBottom:12 }}>
            <label style={css.label}>Assign To *</label>
            <select value={overrideEngineer} onChange={e=>setOverrideEngineer(e.target.value)} style={css.input}>
              <option value="">Select engineer...</option>
              {engineers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label style={css.label}>Reason *</label>
            <textarea value={overrideReason} onChange={e=>setOverrideReason(e.target.value)} rows={3} placeholder="State reason for reassignment..." style={{ ...css.input, resize:"vertical", width:"100%" }} />
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:16 }}>
            <button onClick={()=>{setOverrideModal(null);setOverrideInst(null);setOverrideReason("");}} style={css.btn.secondary}>Cancel</button>
            <button onClick={doOverride} disabled={!overrideReason.trim()||!overrideEngineer} style={{ ...css.btn.primary, opacity:(!overrideReason.trim()||!overrideEngineer)?0.4:1 }}>Confirm Reassignment</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTION MODULE
// ═══════════════════════════════════════════════════════════════════════════════
const ProductionModule = ({ user, instances, setInstances, orders, stock, setStock,
                            nestingRuns, setNestingRuns, machines, contractors, materials, vendors, tpiAgencies,
                            releases, setReleases, productionStandards, issueRequests, setIssueRequests }) => {
  const [view, setView]           = useState("dashboard");
  const [selOrderId, setSelOrderId]   = useState("");
  const [selDrawingId, setSelDrawingId] = useState("");

  // Contractor → own work queue only (after hooks)
  if (user.role === "contractor") return <ContractorWorkQueue user={user} instances={instances} setInstances={setInstances} releases={releases||[]} />;
  // Machine operator → machine queue
  if (user.role === "machine_operator") return <MachineOperatorQueue user={user} releases={releases||[]} setReleases={setReleases} issueRequests={issueRequests||[]} setIssueRequests={setIssueRequests} stock={stock} materials={materials||[]} />;
  // Stage workers (blasting/painting engineers) → stage-filtered work queue
  if (["blasting_engineer","painting_engineer"].includes(user.role)) return <StageWorkerQueue user={user} instances={instances} setInstances={setInstances} />;

  const canAssign = ["super_admin","planning_admin","floor_planner"].includes(user.role);

  const totalInstances    = instances.length;
  const readyToCollect    = instances.filter(i=>i.currentStatus==="pending_collection").length;
  const inProgress        = instances.filter(i=>i.currentStatus==="in_progress").length;
  const pendingSupervisor = instances.filter(i=>i.currentStatus==="pending_supervisor").length;
  const defective         = instances.filter(i=>i.currentStatus==="defective").length;
  const qualityConcerns   = instances.filter(i=>i.qualityConcernFlag).length;

  // ── Release creation wizard ──
  if (view==="release_new") return (
    <ProductionReleaseWizard user={user} orders={orders} stock={stock} materials={materials||[]}
      machines={machines} contractors={contractors} releases={releases||[]} setReleases={setReleases}
      productionStandards={productionStandards} instances={instances||[]} onBack={()=>setView("dashboard")} />
  );

  // ── Supervisor queue view ──
  if (view==="approvals") return (
    <SupervisorQueue user={user} instances={instances} setInstances={setInstances}
      orders={orders} tpiAgencies={tpiAgencies||[]} releases={releases||[]} machines={machines||[]} onBack={()=>setView("dashboard")} />
  );

  // ── Outbound processing view ──
  if (view==="outbound") return (
    <OutboundProcessing user={user} instances={instances} setInstances={setInstances}
      orders={orders} vendors={vendors||[]} onBack={()=>setView("dashboard")} />
  );

  // ── Drawing Register view ──
  if (view==="register") return (
    <ProductionDrawingRegister orders={orders} instances={instances} stock={stock} releases={releases||[]} contractors={contractors||[]} machines={machines||[]} onBack={()=>setView("dashboard")} />
  );

  // ── Progress grid view ──
  if (view==="progress") {
    const activeOrders = orders.filter(o=>o.status==="active");
    const selOrder  = orders.find(o=>o.id===selOrderId);
    const recvDrawings = (selOrder?.drawings||[]).filter(d=>d.receivedDate);
    const selDrawing = recvDrawings.find(d=>d.id===selDrawingId);
    if (selOrderId&&selDrawingId&&selDrawing&&selOrder) return (
      <DrawingProgressGrid drawing={selDrawing} order={selOrder} instances={instances}
        onBack={()=>setSelDrawingId("")} />
    );
    return (
      <div>
        <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:20 }}>
          <button onClick={()=>{setView("dashboard");setSelOrderId("");setSelDrawingId("");}} style={css.btn.ghost}>← Dashboard</button>
          <div style={{ fontSize:18,fontWeight:800,color:T.text }}>Drawing Progress</div>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20 }}>
          <div>
            <label style={css.label}>ORDER</label>
            <select value={selOrderId} onChange={e=>{setSelOrderId(e.target.value);setSelDrawingId("");}} style={css.input}>
              <option value="">Select order...</option>
              {activeOrders.map(o=><option key={o.id} value={o.id}>{o.id} — {o.clientId}</option>)}
            </select>
          </div>
          <div>
            <label style={css.label}>DRAWING</label>
            <select value={selDrawingId} onChange={e=>setSelDrawingId(e.target.value)} style={css.input} disabled={!selOrderId}>
              <option value="">Select drawing...</option>
              {recvDrawings.map(d=><option key={d.id} value={d.id}>{d.drawingNo}</option>)}
            </select>
          </div>
        </div>
      </div>
    );
  }

  // ── Cutting Confirmation view ──
  if (view==="cutting") return (
    <CuttingConfirmation user={user} nestingRuns={nestingRuns} setNestingRuns={setNestingRuns}
      stock={stock} setStock={setStock} instances={instances} setInstances={setInstances}
      orders={orders} materials={materials} machines={machines} productionStandards={productionStandards}
      releases={releases||[]} onBack={()=>setView("dashboard")} />
  );

  // ── Assignment view ──
  if (view==="assignments") {
    const activeOrders = orders.filter(o=>o.status==="active");
    const selOrder     = orders.find(o=>o.id===selOrderId);
    const recvDrawings = (selOrder?.drawings||[]).filter(d=>d.receivedDate);
    const selDrawing   = recvDrawings.find(d=>d.id===selDrawingId);

    if (selOrderId&&selDrawingId&&selDrawing&&selOrder) return (
      <DrawingAssignment user={user} drawing={selDrawing} order={selOrder}
        instances={instances} setInstances={setInstances}
        nestingRuns={nestingRuns} stock={stock} contractors={contractors}
        onBack={()=>setSelDrawingId("")} />
    );

    return (
      <div>
        <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:20 }}>
          <button onClick={()=>{setView("dashboard");setSelOrderId("");setSelDrawingId("");}} style={css.btn.ghost}>← Dashboard</button>
          <div style={{ fontSize:18,fontWeight:800,color:T.text }}>Assignment</div>
        </div>
        <InfoBanner color="blue">Select an order and drawing to view the three-panel assignment screen.</InfoBanner>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginTop:16 }}>
          <div>
            <div style={{ fontSize:11,color:T.textMid,fontWeight:700,marginBottom:6 }}>ORDER</div>
            <select value={selOrderId} onChange={e=>{setSelOrderId(e.target.value);setSelDrawingId("");}} style={css.input}>
              <option value="">Select order...</option>
              {activeOrders.map(o=><option key={o.id} value={o.id}>{o.id} — {o.clientId}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:11,color:T.textMid,fontWeight:700,marginBottom:6 }}>DRAWING</div>
            <select value={selDrawingId} onChange={e=>setSelDrawingId(e.target.value)} style={css.input}
              disabled={!selOrderId}>
              <option value="">Select drawing...</option>
              {recvDrawings.map(d=><option key={d.id} value={d.id}>{d.drawingNo}{d.revNo?` Rev ${d.revNo}`:""}</option>)}
            </select>
          </div>
        </div>
        {selOrderId&&recvDrawings.length===0&&(
          <InfoBanner color="amber">No drawings with received date found for this order. Mark drawings as received in Orders → Drawing Register first.</InfoBanner>
        )}
        {/* Drawing summary cards for selected order */}
        {selOrderId&&recvDrawings.length>0&&(
          <div style={{ marginTop:20 }}>
            <div style={{ fontSize:13,fontWeight:700,color:T.text,marginBottom:12 }}>Drawings in {selOrderId}</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10 }}>
              {recvDrawings.map(d=>{
                const dInst = instances.filter(i=>i.drawingId===d.id&&i.orderId===selOrderId);
                const ready = dInst.filter(i=>i.currentStatus==="pending_collection").length;
                const inProg = dInst.filter(i=>i.currentStatus==="in_progress").length;
                return (
                  <div key={d.id} onClick={()=>setSelDrawingId(d.id)}
                    style={{ ...css.card,cursor:"pointer",borderColor:selDrawingId===d.id?T.accent:T.border }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=T.borderHi}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=selDrawingId===d.id?T.accent:T.border}>
                    <div style={{ fontFamily:T.fontMono,fontSize:13,fontWeight:700,color:T.accentHi,marginBottom:4 }}>{d.drawingNo}</div>
                    <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                      {ready>0&&<Badge color="green">{ready} ready</Badge>}
                      {inProg>0&&<Badge color="blue">{inProg} in progress</Badge>}
                      {ready===0&&inProg===0&&<Badge color="gray">No instances</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Dashboard ──
  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22,fontWeight:800,color:T.text }}>Production</div>
        <div style={{ fontSize:13,color:T.textMid }}>Instance-level tracking — cutting through dispatch</div>
      </div>

      <div style={{ display:"flex",gap:12,marginBottom:24,flexWrap:"wrap" }}>
        <StatCard label="Active Releases"    value={(releases||[]).filter(r=>r.status==="in_progress").length} color={T.accent} />
        <StatCard label="Total Instances"    value={totalInstances}    color={T.text} />
        <StatCard label="Ready to Collect"   value={readyToCollect}    color={T.green} />
        <StatCard label="In Progress"        value={inProgress}        color={T.accent} />
        <StatCard label="Pending Supervisor" value={pendingSupervisor} color={T.amber} />
        <StatCard label="Defective"          value={defective}         color={T.red} />
        {qualityConcerns>0&&<StatCard label="Quality Concerns" value={qualityConcerns} color={T.red} />}
      </div>

      <div style={{ display:"flex",gap:12,marginBottom:24,flexWrap:"wrap" }}>
        {canAssign&&<button onClick={()=>setView("release_new")} style={css.btn.green}>+ New Release</button>}
        <button onClick={()=>setView("cutting")} style={css.btn.primary}>✂ Cutting Confirmation</button>
        {canAssign&&<button onClick={()=>{setSelOrderId("");setSelDrawingId("");setView("assignments");}} style={css.btn.secondary}>📋 Assignment</button>}
        <button onClick={()=>{setSelOrderId("");setSelDrawingId("");setView("progress");}} style={css.btn.secondary}>📊 Progress Grid</button>
        {canAssign&&<button onClick={()=>setView("outbound")} style={css.btn.secondary}>🔄 Outbound</button>}
        <button onClick={()=>setView("register")} style={css.btn.secondary}>📋 Drawing Register</button>
        {(SUPERVISOR_STAGES[user.role]||[]).length>0&&(
          <button onClick={()=>setView("approvals")} style={{ ...css.btn.amber,position:"relative" }}>
            🔍 Approval Queue
            {pendingSupervisor>0&&<span style={{ position:"absolute",top:-6,right:-6,background:T.red,color:"#fff",fontSize:10,fontWeight:800,borderRadius:10,padding:"1px 5px",minWidth:16,textAlign:"center" }}>{pendingSupervisor}</span>}
          </button>
        )}
      </div>

      {/* ── Step 11: Collection Notifications ── */}
      {canAssign && readyToCollect>0 && (()=>{
        const byContractor = {};
        instances.filter(i=>i.currentStatus==="pending_collection").forEach(i=>{
          const k = i.assignedContractorId||"Unassigned";
          if (!byContractor[k]) byContractor[k]={name:i.assignedContractorName||"Unassigned",count:0,parts:{}};
          byContractor[k].count++;
          if (!byContractor[k].parts[i.markNo]) byContractor[k].parts[i.markNo]=0;
          byContractor[k].parts[i.markNo]++;
        });
        return (
          <div style={{ ...css.card,border:`1px solid ${T.green}44`,marginBottom:20 }}>
            <div style={{ fontSize:12,fontWeight:800,color:T.green,marginBottom:10 }}>📦 READY FOR COLLECTION — {readyToCollect} PIECES</div>
            <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
              {Object.values(byContractor).map((c,i)=>(
                <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:T.bgInput,borderRadius:6 }}>
                  <div>
                    <span style={{ fontWeight:700,color:T.text,fontSize:13 }}>{c.name}</span>
                    <span style={{ color:T.textMid,fontSize:11,marginLeft:10 }}>{Object.entries(c.parts).map(([mk,n])=>`${mk}×${n}`).join(", ")}</span>
                  </div>
                  <Badge color="green">{c.count} pcs pending collection</Badge>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Step 12: Quality Concern Flags ── */}
      {(user.role==="qc_admin"||user.role==="super_admin"||canAssign) && (()=>{
        const flags = instances.filter(i=>i.qualityConcernFlag);
        if (!flags.length) return null;
        return (
          <div style={{ ...css.card,border:`1px solid ${T.red}55`,marginBottom:20 }}>
            <div style={{ fontSize:12,fontWeight:800,color:T.red,marginBottom:10 }}>⚠ QUALITY CONCERNS — {flags.length} INSTANCE{flags.length>1?"S":""} FLAGGED</div>
            <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
              {flags.map(i=>{
                const rejCount = i.rejectionCount||0;
                return (
                  <div key={i.instanceId} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:T.redBg,borderRadius:6 }}>
                    <div>
                      <span style={{ fontWeight:700,color:T.text,fontFamily:T.fontMono,fontSize:12 }}>{i.instanceId}</span>
                      <span style={{ color:T.textMid,fontSize:11,marginLeft:10 }}>{i.drawingNo} / {i.orderId}</span>
                    </div>
                    <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                      <Badge color="red">{rejCount} rejection{rejCount>1?"s":""}</Badge>
                      <Badge color="blue">{STAGE_SEQ_LABELS[i.currentStage]||i.currentStage}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {totalInstances===0 ? (
        <div style={{ textAlign:"center",padding:64,color:T.textLow }}>
          <div style={{ fontSize:40,marginBottom:12 }}>⚙️</div>
          <div style={{ fontSize:15,fontWeight:700,color:T.textMid,marginBottom:6 }}>No production instances yet</div>
          <div style={{ fontSize:13 }}>Instances are created when a nesting run bar is confirmed cut.</div>
          <button onClick={()=>setView("cutting")} style={{ ...css.btn.primary,marginTop:16 }}>Go to Cutting Confirmation →</button>
        </div>
      ) : (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
            <thead><tr>
              {["Instance ID","Mark No","Drawing","Order","Stage","Status","Bay","Contractor","Pinned Eng."].map(h=><TH key={h}>{h}</TH>)}
            </tr></thead>
            <tbody>
              {instances.slice().reverse().map((inst,i)=>(
                <tr key={inst.instanceId} style={{ background:i%2===0?"transparent":T.bg }}>
                  <TD mono>{inst.instanceId}</TD>
                  <TD bold>{inst.markNo}</TD>
                  <TD mono>{inst.drawingNo||"—"}</TD>
                  <TD>{inst.orderId}</TD>
                  <TD><Badge color="blue">{STAGE_SEQ_LABELS[inst.currentStage]||inst.currentStage}</Badge></TD>
                  <TD><Badge color={
                    inst.currentStatus==="pending_collection"?"green":
                    inst.currentStatus==="in_progress"?"blue":
                    inst.currentStatus==="pending_supervisor"?"amber":
                    inst.currentStatus==="defective"?"red":
                    inst.currentStatus==="completed"?"teal":
                    inst.currentStatus==="outbound"?"gold":"gray"
                  }>{inst.currentStatus?.replace(/_/g," ")}</Badge></TD>
                  <TD mono>{inst.cuttingBayUsed||"—"}</TD>
                  <TD>{inst.assignedContractorName||<span style={{color:T.textLow,fontSize:11}}>Unassigned</span>}</TD>
                  <TD>{inst.pinnedEngineerName||<span style={{color:T.textLow,fontSize:11}}>—</span>}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── STARTUP MIGRATION: PO LINE WEIGHTS ──────────────────────────────────────
// Fixes POs saved before the library .0-strip fix where wtOrdered was not
// calculated (equals qtyOrdered or is 0). Runs once at load from localStorage.
const normSz = s => (s||'').toLowerCase().split('x').map(seg=>/^\d+\.0$/.test(seg)?seg.replace('.0',''):seg).join('x');

const migratePOLines = (pos, materials) => {
  return pos.map(po => ({
    ...po,
    lines: (po.lines||[]).map(line => {
      const looksWrong = (line.wtOrdered||0) === (line.qtyOrdered||0) || (line.wtOrdered||0) === 0;
      if (!looksWrong) return line;

      const libMatch = (materials||[]).find(m =>
        (m.sectionType||'').toLowerCase() === (line.sectionType||'').toLowerCase() &&
        normSz(m.size) === normSz(line.size||'') &&
        (m.grade||'').toLowerCase() === (line.grade||'').toLowerCase()
      );
      if (!libMatch) return line;

      let wtOrdered = line.wtOrdered;
      if (libMatch.wtPerMetre && line.length && line.qtyOrdered) {
        wtOrdered = Math.round(line.qtyOrdered * (line.length / 1000) * libMatch.wtPerMetre * 100) / 100;
      } else if (libMatch.wtPerM2 && line.length && line.width && line.qtyOrdered) {
        wtOrdered = Math.round(line.qtyOrdered * (line.length / 1000) * (line.width / 1000) * libMatch.wtPerM2 * 100) / 100;
      }
      if (wtOrdered === line.wtOrdered) return line; // no change calculated

      const totalPrice = line.pricingMethod === 'PerKg'
        ? wtOrdered * (line.unitPrice||0)
        : (line.qtyOrdered||0) * (line.unitPrice||0);
      const effectiveRateKg = wtOrdered > 0 ? Math.round(totalPrice / wtOrdered * 100) / 100 : 0;

      return { ...line, wtOrdered, totalPrice, effectiveRateKg, libraryMatch: true, wtSource: 'library-migrated' };
    })
  }));
};

// ─── STARTUP MIGRATION: GRN LINE WEIGHTS ─────────────────────────────────────
// Fixes two known GRN weight bugs:
// (a) actualWt === qtyReceived — qty saved as kg instead of computing from bars
// (b) actualWt === qtyReceived * 1000 — MT×1000 unit bug (bars treated as MT qty)
// Recalculates using library wtPerMetre + bar length stored on PO line.
const migrateGRNLines = (pos, materials) => {
  return pos.map(po => {
    const grns = (po.grns||[]).map(grn => ({
      ...grn,
      lines: (grn.lines||[]).map(gl => {
        const qty = gl.qtyReceived||0;
        const awt = gl.actualWt||0;
        // Bug (a): actualWt was saved as bare count (no weight calculation at all)
        const bugA = awt === qty && qty > 0 && qty < 100;
        // Bug (b): actualWt = qty * 1000 — MT unit factor applied to bar count
        const bugB = qty > 0 && qty < 200 && Math.abs(awt - qty * 1000) < 1;
        if (!bugA && !bugB) return gl;

        const poLine = (po.lines||[]).find(l => l.id === gl.poLineId);
        if (!poLine) return gl;

        const libMatch = (materials||[]).find(m =>
          (m.sectionType||'').toLowerCase() === (poLine.sectionType||'').toLowerCase() &&
          normSz(m.size) === normSz(poLine.size||'') &&
          (m.grade||'').toLowerCase() === (poLine.grade||'').toLowerCase()
        );
        if (!libMatch || !libMatch.wtPerMetre) return gl;

        // Use PO line bar length, fall back to 12 000 mm (standard structural length)
        const length = poLine.length || 12000;
        const actualWt = Math.round(qty * (length / 1000) * libMatch.wtPerMetre * 100) / 100;

        return { ...gl, actualWt, calculatedWt: actualWt, wtReceived: actualWt, variance: 0, wtSource: 'grn-migrated' };
      })
    }));

    // Also fix po.lines[i].wtReceived to match corrected GRN actuals
    const lines = (po.lines||[]).map(line => {
      const newWtReceived = grns.reduce((sum, grn) => {
        const gl = (grn.lines||[]).find(l => l.poLineId === line.id);
        return sum + (gl ? (gl.actualWt||0) : 0);
      }, 0);
      if (newWtReceived === (line.wtReceived||0)) return line;
      return { ...line, wtReceived: Math.round(newWtReceived * 100) / 100 };
    });

    return { ...po, grns, lines };
  });
};

// ─── STARTUP MIGRATION: STOCK LOT WEIGHTS ────────────────────────────────────
// Fixes stock lots saved with wrong weights from GRN bugs:
// (b) wtReceived === qtyReceived * 1000  — MT×1000 unit bug
// Also applies targeted overrides for specific known-bad lots.
const STOCK_LOT_OVERRIDES = {
  'LOT-2026-005': 337.68,   // RHS 100x50x4 E250 — 6 bars × 12 m × 4.69 kg/m
  // LOT-2026-006 is correct (1 524 kg)
  'LOT-2026-007': 1397.76,  // ISA 75x75x8 E250 — 13 bars × 12 m × 8.96 kg/m
};
const migrateStockLots = (lots, materials) => {
  return lots.map(lot => {
    // Ensure reservations array exists
    if (!lot.reservations) lot = { ...lot, reservations: [] };
    // Targeted override takes highest priority
    const override = STOCK_LOT_OVERRIDES[lot.lotNo];
    if (override != null && Math.abs((lot.wtReceived||0) - override) > 1) {
      const alreadyAllocated = (lot.wtAllocated||0) + (lot.wtIssued||0) + (lot.wtConsumed||0);
      const newAvail = Math.max(0, override - alreadyAllocated);
      return { ...lot, wtReceived: override, wtAvailable: newAvail, actualWt: override, calculatedWt: override, wtSource: 'lot-corrected' };
    }
    // General fix: MT×1000 bug — section lots where wtReceived = qtyReceived * 1000
    const qty = lot.qtyReceived||0;
    if (!lot.isPlate && qty > 0 && qty < 200 && Math.abs((lot.wtReceived||0) - qty * 1000) < 1) {
      const libMatch = (materials||[]).find(m =>
        (m.sectionType||'').toLowerCase() === (lot.sectionType||'').toLowerCase() &&
        normSz(m.size) === normSz(lot.size||'') &&
        (m.grade||'').toLowerCase() === (lot.grade||'').toLowerCase()
      );
      if (libMatch?.wtPerMetre) {
        const length = lot.length || 12000;
        const corrected = Math.round(qty * (length / 1000) * libMatch.wtPerMetre * 100) / 100;
        const alreadyAllocated = (lot.wtAllocated||0) + (lot.wtIssued||0) + (lot.wtConsumed||0);
        const newAvail = Math.max(0, corrected - alreadyAllocated);
        return { ...lot, wtReceived: corrected, wtAvailable: newAvail, actualWt: corrected, calculatedWt: corrected, wtSource: 'lot-corrected' };
      }
    }
    return lot;
  });
};

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [mod, setMod] = useState("dashboard");
  const [sidebar, setSidebar] = useState(true);
  const [purchaseReqs, setPurchaseReqs] = useState(() => { try { const s=localStorage.getItem('structo_purchaseReqs'); return s?JSON.parse(s):INIT_PURCHASE_REQS; } catch { return INIT_PURCHASE_REQS; } });
  const [pos, setPos]                   = useState(() => { try { const s=localStorage.getItem('structo_pos'); if (s) { const loaded=JSON.parse(s); return migrateGRNLines(migratePOLines(loaded, MATERIALS_LIBRARY), MATERIALS_LIBRARY); } return INIT_POS; } catch { return INIT_POS; } });
  const [stock, setStock]               = useState(() => {
    try {
      const s = localStorage.getItem('structo_stock');
      const loaded = s ? JSON.parse(s) : INIT_STOCK;
      return migrateStockLots(loaded, MATERIALS_LIBRARY);
    } catch { return INIT_STOCK; }
  });
  const [nestingRuns, setNestingRuns]   = useState(INIT_NESTING_RUNS);
  const [instances, setInstances]       = useState(INIT_INSTANCES);
  const [orders, setOrders]             = useState(() => {
    try {
      const s = localStorage.getItem('structo_orders');
      if (!s) return SEED_ORDERS;
      const loaded = JSON.parse(s);
      return loaded.map(o => {
        const base = { drawings:[], parts:[], milestones:[], shippingAddresses:[], amendments:[], quality:{tpiRequired:false,paintCoats:[],approvedMakes:[],mdccDocs:[]}, transport:{transportScope:'per_dispatch',preferredTransporter:'',vehicleType:'',distanceKm:0,freightEstimate:0,insurance:false,odc:false,nightRestriction:false,policeEscort:false,specialReqs:'',freightBilling:'dispatch_line',clientTransporter:'',clientVehicleContact:'',loadingInstructions:''}, projectDesc:'', clientPoNo:'', id:'', status:'active', clientId:'', ...o };
        // Migrate drawings missing poLineItem / assemblyGroup
        base.drawings = (base.drawings||[]).map(d => ({
          ...d,
          ...(d.poLineItem == null ? { poLineItem:0 } : {}),
          ...(d.assemblyGroup == null ? { assemblyGroup:'' } : {}),
        }));
        // Migrate order-level assembly fields
        if (base.assemblyInspectionRequired == null) base.assemblyInspectionRequired = false;
        if (!base.assemblies) base.assemblies = [];
        // Migrate parts missing matCode / requiredOps / drawingLineItem
        const drgCounters = {};
        base.parts = (base.parts||[]).map(p => {
          let updated = p;
          if (!updated.matCode && updated.section && updated.section!=="—" && updated.grade && updated.size) {
            updated = { ...updated, matCode:`${updated.section}/MS/${updated.grade}/${updated.size}` };
          }
          if (!updated.requiredOps && updated.fabType==="Fabricate") {
            updated = { ...updated, requiredOps:['Cut'] };
          }
          if (!updated.drawingLineItem) {
            const key = updated.drawingId||"__none__";
            drgCounters[key] = (drgCounters[key]||0) + 1;
            updated = { ...updated, drawingLineItem:drgCounters[key] };
          }
          return updated;
        });
        return base;
      });
    } catch { return SEED_ORDERS; }
  });
  const [clients, setClients]           = useState(() => { try { const s=localStorage.getItem('structo_clients'); return s?JSON.parse(s):CLIENTS_FULL; } catch { return CLIENTS_FULL; } });
  const [vendors, setVendors]           = useState(() => { try { const s=localStorage.getItem('structo_vendors'); return s?JSON.parse(s):VENDORS; } catch { return VENDORS; } });
  const [contractors, setContractors]   = useState(CONTRACTORS);
  const [bays, setBays]                 = useState(BAYS_SEED);
  const [materials, setMaterials]       = useState(MATERIALS_LIBRARY);
  const [paint, setPaint]               = useState(PAINT_LIBRARY);
  const [tpiAgencies, setTpiAgencies]   = useState(TPI_AGENCIES);
  const [approvedMakes, setApprovedMakes] = useState(APPROVED_MAKES_LIBRARY);
  const [machines, setMachines]         = useState(MACHINES_SEED);
  const [releases, setReleases]         = useState([]);
  const [qcRules, setQcRules]           = useState([]);
  const [overrideLog, setOverrideLog]   = useState([]);
  const [issueRequests, setIssueRequests] = useState([]);
  const [productionStandards, setProductionStandards] = useState({
    tiers: [
      { id:'simple',  label:'Simple',  maxParts:5,   maxKg:200,   cutting:4,  fitup:4,  welding:8,  blasting:2, paintPerCoat:1 },
      { id:'medium',  label:'Medium',  maxParts:10,  maxKg:800,   cutting:8,  fitup:8,  welding:16, blasting:3, paintPerCoat:2 },
      { id:'complex', label:'Complex', maxParts:20,  maxKg:2000,  cutting:12, fitup:16, welding:30, blasting:4, paintPerCoat:3 },
      { id:'heavy',   label:'Heavy',   maxParts:999, maxKg:99999, cutting:20, fitup:30, welding:60, blasting:6, paintPerCoat:4 },
    ],
    stampLocations: [
      { sectionTypes:['ISA','ISMC','ISMB'], location:'Web face, 50mm from left end, top edge' },
      { sectionTypes:['RHS','SHS'],         location:'Flat face (widest), 50mm from left end' },
      { sectionTypes:['PLATE','Flat Bar'],  location:'Top face, bottom-left corner, 50mm from each edge' },
      { sectionTypes:['OTHER'],             location:'Top face, centre of piece' },
    ]
  });
  const [company, setCompany]           = useState(() => {
    const defaults = { name:"Structo Fabricators", tradingName:"STRUCTO", gstin:"", pan:"", state:"Maharashtra", stateCode:"27", address:"", worksAddress:"", phone:"", email:"", bankName:"", bankAccount:"", ifsc:"", logoUrl:"" };
    try { const s=localStorage.getItem('structo_company'); return s?JSON.parse(s):defaults; } catch { return defaults; }
  });

  // ── Persist 7 state arrays to localStorage ──
  useEffect(() => { try { localStorage.setItem('structo_orders',       JSON.stringify(orders));       } catch(e) { console.warn('Storage full',e); } }, [orders]);
  useEffect(() => { try { localStorage.setItem('structo_clients',      JSON.stringify(clients));      } catch(e) { console.warn('Storage full',e); } }, [clients]);
  useEffect(() => { try { localStorage.setItem('structo_vendors',      JSON.stringify(vendors));      } catch(e) { console.warn('Storage full',e); } }, [vendors]);
  useEffect(() => { try { localStorage.setItem('structo_pos',          JSON.stringify(pos));          } catch(e) { console.warn('Storage full',e); } }, [pos]);
  useEffect(() => { try { localStorage.setItem('structo_stock',        JSON.stringify(stock));        } catch(e) { console.warn('Storage full',e); } }, [stock]);
  useEffect(() => { try { localStorage.setItem('structo_purchaseReqs', JSON.stringify(purchaseReqs)); } catch(e) { console.warn('Storage full',e); } }, [purchaseReqs]);
  useEffect(() => { try { localStorage.setItem('structo_company',      JSON.stringify(company));      } catch(e) { console.warn('Storage full',e); } }, [company]);

  if (!user) return <Login onLogin={u=>{setUser(u);setMod("dashboard");}} />;

  const visibleNav = NAV.filter(n=>canSee(user,n.module));
  const roleLabel = ROLES_LABEL[user.role]||user.role;
  const initials = user.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  const renderMod = () => {
    switch(mod) {
      case "dashboard": return <Dashboard user={user} pos={pos} stock={stock} purchaseReqs={purchaseReqs} orders={orders} />;
      case "mrp":       return <MRPModule user={user} purchaseReqs={purchaseReqs} setPurchaseReqs={setPurchaseReqs} stock={stock} orders={orders} materials={materials} nestingRuns={nestingRuns} setNestingRuns={setNestingRuns} />;
      case "purchase":  return <PurchaseModule user={user} pos={pos} setPos={setPos} purchaseReqs={purchaseReqs} stock={stock} setStock={setStock} orders={orders} vendors={vendors} materials={materials} setMaterials={setMaterials} />;
      case "qc":        return <RMQCModule user={user} stock={stock} setStock={setStock} />;
      case "qc_ops":    return <QcAdminScreen user={user} instances={instances} setInstances={setInstances} orders={orders} qcRules={qcRules} setQcRules={setQcRules} overrideLog={overrideLog} setOverrideLog={setOverrideLog} />;
      case "stock":     return <StockModule user={user} stock={stock} setStock={setStock} orders={orders} contractors={contractors} materials={materials} issueRequests={issueRequests} setIssueRequests={setIssueRequests} />;
      case "orders":    return <OrdersModule user={user} orders={orders} setOrders={setOrders} clients={clients} materials={materials} stock={stock} />;
      case "production":return <ProductionModule user={user} instances={instances} setInstances={setInstances} orders={orders} stock={stock} setStock={setStock} nestingRuns={nestingRuns} setNestingRuns={setNestingRuns} machines={machines} contractors={contractors} materials={materials} vendors={vendors} tpiAgencies={tpiAgencies} releases={releases} setReleases={setReleases} productionStandards={productionStandards} issueRequests={issueRequests} setIssueRequests={setIssueRequests} />;
      case "finance":   return <Placeholder title="Finance" session="Session 5" icon="₹" desc="Milestone invoices, tranches, receipts, credit notes." />;
      case "dispatch":  return <Placeholder title="Dispatch" session="Session 5" icon="🚚" desc="Partial dispatch, per-vehicle challans, gate-out, bilti/LR upload." />;
      case "tools":     return <ToolsModule user={user} orders={orders} materials={materials} nestingRuns={nestingRuns} setNestingRuns={setNestingRuns} />;
      case "masters":   return <MastersModule user={user} clients={clients} setClients={setClients} vendors={vendors} setVendors={setVendors} contractors={contractors} setContractors={setContractors} bays={bays} setBays={setBays} materials={materials} setMaterials={setMaterials} paint={paint} setPaint={setPaint} tpiAgencies={tpiAgencies} setTpiAgencies={setTpiAgencies} approvedMakes={approvedMakes} setApprovedMakes={setApprovedMakes} company={company} setCompany={setCompany} machines={machines} setMachines={setMachines} productionStandards={productionStandards} setProductionStandards={setProductionStandards} orders={orders} setOrders={setOrders} pos={pos} setPos={setPos} stock={stock} />;
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
              <button key={item.id} onClick={()=>setMod(item.id)} title={!sidebar?item.label:""} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:sidebar?"7px 12px":"7px 10px", background:active?`${T.accent}22`:"transparent", border:"none", borderLeft:active?`2px solid ${T.accent}`:"2px solid transparent", color:active?T.accent:T.textMid, cursor:"pointer", fontFamily:T.font, fontSize:12, fontWeight:active?700:400, textAlign:"left" }}>
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
