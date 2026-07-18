import React, { useState, useEffect, useRef } from "react";
import { T, css } from "../theme.js";
import { fmt, today, normMatCode, buildDIId, getFinancialYear, calcSheetWt,
  getOrderPrefix, detectDrawingPrefix, getDrawingShortCode,
  buildDIUniqueId, buildPartUniqueId, computePartBaseUniqueId, computeTotalPieces,
  parseCSVText, can, USERS, computePaintableArea, getPaintCoats } from "../helpers.js";
import { Badge, Modal, Field, Input, Sel, InfoBanner, SectionHd, Textarea, MField,
  StatCard, TH, TD, G2, G3, TabBar2, Row2 } from "../components/ui.jsx";

// HP constants (used by TPI quality in production)
const HP_LABELS = { fit_up:"Fit-Up", welding:"Welding", blasting:"Blasting", painting:"Painting", rm_inspection:"RM Inspection" };
const HP_DPR_STAGE = { fit_up:"tpi_fitup", welding:"tpi_weld", blasting:"tpi_blast", painting:"tpi_paint" };
const HP_PREV_STAGE = { fit_up:"fitup", welding:"welding", blasting:"blasting", painting:"painting" };
const HP_NEXT_STAGE = { fit_up:"welding", welding:"__check_order__", blasting:"painting", painting:"mdcc" };

const STAGE_OPTS    = [{v:"fitup",l:"Fit-Up"},{v:"welding",l:"Welding"},{v:"blasting",l:"Blasting"},{v:"painting",l:"Painting"}];
const TpiQcPanel = ({ orders, dprs, setDprs, instances, setInstances, user, tpiTemplates, setTpiTemplates, contractors }) => {
  const activeOrders = (orders||[]).filter(o=>o.status==="active"&&o.quality?.tpiRequired&&(o.quality?.tpiHoldPoints||[]).length>0);
  const HP_ORDER = ["fit_up","welding","blasting","painting"];
  const activeTabs = HP_ORDER.filter(hp => {
    const dprStage = HP_DPR_STAGE[hp];
    return activeOrders.some(o=>(o.quality?.tpiHoldPoints||[]).includes(hp)) ||
           (dprs||[]).some(d=>d.currentStage===dprStage);
  });

  const [activeHp, setActiveHp] = useState(activeTabs[0]||"welding");
  const countForHp = hp => {
    const dprStage = HP_DPR_STAGE[hp];
    return (dprs||[]).filter(d=>d.currentStage===dprStage).length;
  };
  const updDpr = (id, patch) => setDprs(prev=>prev.map(d=>d.id===id?{...d,...patch}:d));

  const advInstances = (dpr, toStage) => {
    setInstances(prev=>prev.map(i=>{
      if(i.drawingId!==dpr.drawingId||i.orderId!==dpr.orderId||i.isSideCut) return i;
      return {...i,currentStage:toStage,currentStatus:toStage==="complete"?"complete":"in_progress",
        stageHistory:[...(i.stageHistory||[]),{stage:i.currentStage,completedAt:new Date().toISOString(),completedBy:user.username}]};
    }));
  };

  // ── Hold-point panel ─────────────────────────────────────────────────────────
  const HoldPointPanel = ({ hp }) => {
    const dprStage = HP_DPR_STAGE[hp];
    const nextStage = HP_NEXT_STAGE[hp];

    // Awaiting offer: at TPI stage with no offer record for THIS hold point
    const hasOfferForHp = d => (d.tpiRecords||[]).some(r=>r.holdPoint===hp&&r.offeredAt);
    const hasClearanceForHp = d => (d.tpiRecords||[]).some(r=>r.holdPoint===hp&&(r.outcome||r.waivedBy));
    const awaitingOffer = (dprs||[]).filter(d=>d.currentStage===dprStage&&!hasOfferForHp(d));
    // Offered: at TPI stage with offer recorded for this hold point, no outcome yet
    const offered = (dprs||[]).filter(d=>d.currentStage===dprStage&&hasOfferForHp(d)&&!hasClearanceForHp(d));
    // Cleared (passed or waived) for this hold point
    const cleared = (dprs||[]).filter(d=>hasClearanceForHp(d)&&(d.tpiRecords||[]).some(r=>r.holdPoint===hp));

    const [section, setSection] = useState("offer");
    const [selected, setSelected] = useState(new Set()); // selected DPR IDs for batch offer
    const [offerForm, setOfferForm] = useState({inspector:"",offeredAt:new Date().toISOString().slice(0,10),expectedDate:"",scope:""});
    const [outcomeMap, setOutcomeMap] = useState({}); // dprId → {outcome, certNo, inspDate, remarks}
    const [waiveMap, setWaiveMap]   = useState({}); // dprId → reason
    const [showOutcomeForm, setShowOutcomeForm] = useState(false);
    const [certNo, setCertNo]   = useState("");
    const [inspDate, setInspDate] = useState(new Date().toISOString().slice(0,10));
    const [batchRemarks, setBatchRemarks] = useState("");

    // Generate XLSX report
    const generateReport = () => {
      const doneDprs = cleared;
      if (doneDprs.length===0) { alert("No cleared drawings to export."); return; }
      const firstOrder = (orders||[]).find(o=>o.id===doneDprs[0]?.orderId)||{};
      const template = firstOrder.quality?.tpiOrderTemplates?.[hp] ||
        [{field:"markNo",label:"Mark No"},{field:"description",label:"Description"},{field:"qty",label:"Qty"},{field:"acceptReject",label:"Accept/Reject"},{field:"certNo",label:"Cert No"},{field:"inspDate",label:"Insp Date"},{field:"remarks",label:"Remarks"}];
      const rows = []; let srNo=1;
      doneDprs.forEach(dpr=>{
        const order=(orders||[]).find(o=>o.id===dpr.orderId)||{};
        const drawing=(order.drawings||[]).find(d=>d.id===dpr.drawingId)||{};
        const tpiRecord=(dpr.tpiRecords||[]).filter(r=>r.holdPoint===hp).slice(-1)[0]||{};
        const parts=(order.parts||[]).filter(p=>p.drawingId===dpr.drawingId&&p.fabType==="Fabricate");
        parts.forEach(part=>{
          const ctx={order,drawing,part:{...part,unitWt:part.unitWt||(part.wt||0)/Math.max(part.qtyPerDrg||1,1)},tpiRecord};
          rows.push([srNo++, ...template.map(col=>resolveTpiField(col.field,ctx))]);
        });
      });
      const wb=XLSX.utils.book_new();
      const ws=XLSX.utils.aoa_to_sheet([["Sr No",...template.map(c=>c.label)],...rows]);
      ws['!cols']=[{wch:6},...template.map(()=>({wch:18}))];
      XLSX.utils.book_append_sheet(wb,ws,`${HP_LABELS[hp]} TPI`);
      XLSX.writeFile(wb,`TPI-${HP_LABELS[hp].replace(/\s/g,"")}-${firstOrder.orderNo||"ORDER"}-${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    const submitOffer = () => {
      if (!offerForm.inspector||!offerForm.offeredAt||selected.size===0) return;
      const ts = new Date().toISOString();
      const batchId = `TPI-BATCH-${Date.now()}`;
      [...selected].forEach(dprId=>{
        const dpr=(dprs||[]).find(d=>d.id===dprId);
        if(!dpr) return;
        // Store offer per holdPoint in tpiRecords — not top-level tpiOfferedAt
        // This allows each stage's TPI to have its own offer record independently
        updDpr(dprId,{
          tpiBatchId:batchId,
          tpiRecords:[...(dpr.tpiRecords||[]).filter(r=>!(r.holdPoint===hp&&!r.outcome)),
            {holdPoint:hp,offeredAt:offerForm.offeredAt,inspector:offerForm.inspector,
             expectedDate:offerForm.expectedDate,scope:offerForm.scope||`${HP_LABELS[hp]} inspection`,
             offeredBy:user.username,batchId}],
          stageHistory:[...(dpr.stageHistory||[]),{stage:dprStage,action:"tpi_offered",by:user.username,at:ts,inspector:offerForm.inspector,batchId}]
        });
      });
      setSelected(new Set()); setSection("offered");
    };

    const submitOutcome = () => {
      if (!certNo||!inspDate) return;
      const ts = new Date().toISOString();
      Object.entries(outcomeMap).forEach(([dprId, om])=>{
        const dpr=(dprs||[]).find(d=>d.id===dprId); if(!dpr) return;
        const outcome = om.outcome||"pass";
        const isPass = outcome==="pass"||outcome==="conditional_pass"||outcome==="not_inspected";
        const nextStage = getHpNextStage(hp, dpr, orders);
        const existing = dpr.tpiRecords||[];
        const updRec = [...existing.filter(r=>!(r.holdPoint===hp&&!r.outcome)),
          {...(existing.find(r=>r.holdPoint===hp&&r.offeredAt&&!r.outcome)||{}),
           holdPoint:hp,outcome,certNo,inspDate,remarks:om.remarks||batchRemarks,
           clearedAt:ts,clearedBy:user.username}];
        updDpr(dprId,{
          tpiRecords:updRec,
          ...(isPass?{currentStage:nextStage,currentStatus:nextStage==="complete"?"complete":"in_progress",tpiClearedAt:ts}:{currentStage:HP_PREV_STAGE[hp],currentStatus:"in_progress",tpiFailedAt:ts}),
          stageHistory:[...(dpr.stageHistory||[]),{stage:dprStage,action:isPass?"tpi_cleared":"tpi_failed",outcome,certNo,by:user.username,at:ts}]
        });
        if(isPass) advInstances(dpr,nextStage);
        else advInstances(dpr,HP_PREV_STAGE[hp]);
      });
      setCertNo(""); setInspDate(new Date().toISOString().slice(0,10)); setBatchRemarks(""); setOutcomeMap({}); setShowOutcomeForm(false); setSection("cleared");
    };

    const submitWaive = (dprId) => {
      const reason = waiveMap[dprId]; if(!reason?.trim()) return;
      const ts = new Date().toISOString();
      const dpr=(dprs||[]).find(d=>d.id===dprId); if(!dpr) return;
      const resolvedNext = getHpNextStage(hp, dpr, orders);
      updDpr(dprId,{
        currentStage:resolvedNext, currentStatus:resolvedNext==="complete"?"complete":"in_progress",
        tpiRecords:[...(dpr.tpiRecords||[]).filter(r=>!(r.holdPoint===hp&&!r.outcome)),
          {holdPoint:hp,outcome:"waived",reason,waivedBy:user.username,at:ts}],
        stageHistory:[...(dpr.stageHistory||[]),{stage:dprStage,action:"tpi_waived",reason,by:user.username,at:ts}]
      });
      advInstances(dpr,resolvedNext);
      setWaiveMap(p=>({...p,[dprId]:""}));
    };

    const getOrder = dpr => (orders||[]).find(o=>o.id===dpr.orderId)||{};

    const SECTIONS = [
      {id:"offer",   label:"Awaiting Offer",       count:awaitingOffer.length, color:T.amber},
      {id:"offered", label:"Offered — Pending",     count:offered.length,       color:T.accent},
      {id:"cleared", label:"Cleared / History",     count:cleared.length,       color:T.green},
    ];

    return (
      <div>
        {/* Report button */}
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:16,padding:"10px 14px",background:T.bgInput,borderRadius:8,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:12,fontWeight:700,color:T.text}}>TPI Report</div>
          <div style={{flex:1}}/>
          <button onClick={generateReport} style={css.btn.primary}>📥 Export XLSX</button>
          <div style={{fontSize:11,color:T.textLow}}>{cleared.length} cleared · {offered.length} pending · {awaitingOffer.length} not offered</div>
        </div>

        {/* Section tabs */}
        <div style={{display:"flex",gap:0,borderBottom:`1px solid ${T.border}`,marginBottom:16}}>
          {SECTIONS.map(s=>(
            <button key={s.id} onClick={()=>setSection(s.id)} style={{padding:"8px 16px",fontSize:12,fontWeight:section===s.id?700:400,color:section===s.id?T.accent:T.textMid,background:"transparent",border:"none",borderBottom:section===s.id?`2px solid ${T.accent}`:"2px solid transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              {s.label}
              {s.count>0&&<span style={{background:section===s.id?T.accent:s.color,color:"#fff",borderRadius:10,fontSize:10,fontWeight:800,padding:"1px 6px"}}>{s.count}</span>}
            </button>
          ))}
        </div>

        {/* ── AWAITING OFFER ── */}
        {section==="offer"&&(
          <div>
            {awaitingOffer.length===0
              ? <div style={{textAlign:"center",padding:40,color:T.textLow}}>✓ No drawings awaiting TPI offer</div>
              : <>
                  {/* Selection + Offer form */}
                  <div style={{...css.card,marginBottom:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <div style={{fontSize:13,fontWeight:700,color:T.text}}>Select drawings to offer as a batch</div>
                      <button onClick={()=>setSelected(selected.size===awaitingOffer.length?new Set():new Set(awaitingOffer.map(d=>d.id)))} style={css.btn.ghost}>
                        {selected.size===awaitingOffer.length?"Deselect All":"Select All"}
                      </button>
                    </div>
                    {awaitingOffer.map(dpr=>{
                      const order=getOrder(dpr);
                      const drawing=(order.drawings||[]).find(d=>d.id===dpr.drawingId)||{};
                      const ageDays=dpr.weldCompleteAt||dpr.blastCompleteAt?Math.floor((Date.now()-new Date(dpr.weldCompleteAt||dpr.blastCompleteAt).getTime())/86400000):null;
                      return (
                        <div key={dpr.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                          <input type="checkbox" checked={selected.has(dpr.id)} onChange={e=>{const ns=new Set(selected);e.target.checked?ns.add(dpr.id):ns.delete(dpr.id);setSelected(ns);}} />
                          <div style={{flex:1}}>
                            <div style={{fontFamily:T.fontMono,fontWeight:700,color:T.accent,fontSize:12}}>{dpr.drawingNo}</div>
                            <div style={{fontSize:11,color:T.textMid}}>{order.orderNo} · {order.clientName}{drawing.assemblyGroup?` · Asm: ${drawing.assemblyGroup}`:""}</div>
                          </div>
                          {ageDays!==null&&<span style={{fontSize:11,color:ageDays>7?T.amber:T.textLow}}>{ageDays}d waiting</span>}
                          {/* Waive option */}
                          <div style={{display:"flex",gap:6,alignItems:"center"}}>
                            <input value={waiveMap[dpr.id]||""} onChange={e=>setWaiveMap(p=>({...p,[dpr.id]:e.target.value}))}
                              placeholder="Waive reason…" style={{...css.input,fontSize:11,width:150}} />
                            <button disabled={!(waiveMap[dpr.id]||"").trim()} onClick={()=>submitWaive(dpr.id)}
                              style={{...css.btn.ghost,fontSize:11,color:T.amber,opacity:(waiveMap[dpr.id]||"").trim()?1:0.4}}>Waive</button>
                          </div>
                        </div>
                      );
                    })}
                    {/* Offer form */}
                    {selected.size>0&&(
                      <div style={{marginTop:16,padding:14,background:T.bgInput,borderRadius:6}}>
                        <div style={{fontSize:12,fontWeight:700,color:T.textMid,marginBottom:10}}>Offer {selected.size} drawing{selected.size!==1?"s":""} to TPI</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
                          <div><label style={css.label}>Inspector Name</label><input value={offerForm.inspector} onChange={e=>setOfferForm(p=>({...p,inspector:e.target.value}))} style={css.input} placeholder="e.g. Mr. A. Sharma" /></div>
                          <div><label style={css.label}>Date Offered</label><input type="date" value={offerForm.offeredAt} onChange={e=>setOfferForm(p=>({...p,offeredAt:e.target.value}))} style={css.input} /></div>
                          <div><label style={css.label}>Expected Inspection Date</label><input type="date" value={offerForm.expectedDate} onChange={e=>setOfferForm(p=>({...p,expectedDate:e.target.value}))} style={css.input} /></div>
                        </div>
                        <div style={{marginBottom:10}}><label style={css.label}>Scope (auto-filled)</label><input value={offerForm.scope||`${HP_LABELS[hp]} inspection as per WPS/drawing`} onChange={e=>setOfferForm(p=>({...p,scope:e.target.value}))} style={css.input} /></div>
                        <button onClick={submitOffer} disabled={!offerForm.inspector} style={{...css.btn.primary,opacity:offerForm.inspector?1:0.45}}>📤 Offer Batch to TPI</button>
                      </div>
                    )}
                  </div>
                </>
            }
          </div>
        )}

        {/* ── OFFERED — PENDING ── */}
        {section==="offered"&&(
          <div>
            {offered.length===0
              ? <div style={{textAlign:"center",padding:40,color:T.textLow}}>No drawings currently offered to TPI</div>
              : <>
                  {/* Group by batchId */}
                  {(()=>{
                    const batches={};
                    offered.forEach(d=>{const bid=d.tpiBatchId||d.id;if(!batches[bid])batches[bid]=[];batches[bid].push(d);});
                    return Object.entries(batches).map(([bid,dprsInBatch])=>{
                      const first=dprsInBatch[0];
                      const overdue=first.tpiExpectedDate&&new Date(first.tpiExpectedDate)<new Date();
                      return (
                        <div key={bid} style={{...css.card,marginBottom:16,borderLeft:`3px solid ${overdue?T.red:T.accent}`}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                            <div>
                              <div style={{fontSize:13,fontWeight:700,color:T.text}}>Inspector: {first.tpiInspector||"—"}</div>
                              <div style={{fontSize:11,color:T.textMid}}>Offered: {first.tpiOfferedAt?new Date(first.tpiOfferedAt).toLocaleDateString("en-IN"):"-"} · Expected: {first.tpiExpectedDate||"—"}</div>
                            </div>
                            {overdue&&<Badge color="red">OVERDUE</Badge>}
                          </div>
                          {dprsInBatch.map(dpr=>{
                            const order=getOrder(dpr);
                            const om=outcomeMap[dpr.id]||{};
                            return (
                              <div key={dpr.id} style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:8,alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                                <div>
                                  <div style={{fontFamily:T.fontMono,fontSize:12,fontWeight:700,color:T.accent}}>{dpr.drawingNo}</div>
                                  <div style={{fontSize:11,color:T.textMid}}>{order.orderNo}</div>
                                </div>
                                <select value={om.outcome||""} onChange={e=>setOutcomeMap(p=>({...p,[dpr.id]:{...om,outcome:e.target.value}}))} style={{...css.input,fontSize:11,width:160}}>
                                  <option value="">Outcome…</option>
                                  <option value="pass">Pass</option>
                                  <option value="conditional_pass">Conditional Pass</option>
                                  <option value="fail">Fail</option>
                                  <option value="not_inspected">Not Inspected (random sample)</option>
                                </select>
                                <input value={om.remarks||""} onChange={e=>setOutcomeMap(p=>({...p,[dpr.id]:{...om,remarks:e.target.value}}))}
                                  placeholder="Remarks…" style={{...css.input,fontSize:11,width:180}} />
                              </div>
                            );
                          })}
                          {/* Batch outcome form */}
                          {!showOutcomeForm||showOutcomeForm!==bid
                            ? <button onClick={()=>{ setShowOutcomeForm(bid); const init={}; dprsInBatch.forEach(d=>{init[d.id]={outcome:"pass",remarks:""}}); setOutcomeMap(p=>({...p,...init})); }} style={{...css.btn.primary,marginTop:10}}>Record Batch Outcome</button>
                            : <div style={{marginTop:12,padding:12,background:T.bgInput,borderRadius:6}}>
                                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
                                  <div><label style={css.label}>Certificate / Report No</label><input value={certNo} onChange={e=>setCertNo(e.target.value)} style={css.input} placeholder="e.g. BV/WLD/2026/001" /></div>
                                  <div><label style={css.label}>Inspection Date</label><input type="date" value={inspDate} onChange={e=>setInspDate(e.target.value)} style={css.input} /></div>
                                  <div><label style={css.label}>Batch Remarks</label><input value={batchRemarks} onChange={e=>setBatchRemarks(e.target.value)} style={css.input} placeholder="General observations…" /></div>
                                </div>
                                <div style={{display:"flex",gap:8}}>
                                  <button onClick={submitOutcome} disabled={!certNo} style={{...css.btn.green,opacity:certNo?1:0.45}}>✓ Submit Outcomes</button>
                                  <button onClick={()=>setShowOutcomeForm(false)} style={css.btn.ghost}>Cancel</button>
                                </div>
                              </div>
                          }
                        </div>
                      );
                    });
                  })()}
                </>
            }
          </div>
        )}

        {/* ── CLEARED / HISTORY ── */}
        {section==="cleared"&&(
          <div>
            {cleared.length===0
              ? <div style={{textAlign:"center",padding:40,color:T.textLow}}>No TPI clearances recorded yet</div>
              : cleared.map(dpr=>{
                  const order=getOrder(dpr);
                  const rec=(dpr.tpiRecords||[]).filter(r=>r.holdPoint===hp).slice(-1)[0]||{};
                  const isWaived=dpr.tpiWaived&&rec.outcome==="waived";
                  return (
                    <div key={dpr.id} style={{...css.card,marginBottom:8,borderLeft:`3px solid ${isWaived?T.amber:T.green}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div>
                          <div style={{fontFamily:T.fontMono,fontWeight:700,color:T.accent,fontSize:13}}>{dpr.drawingNo}</div>
                          <div style={{fontSize:11,color:T.textMid,marginTop:2}}>{order.orderNo} · {order.clientName}</div>
                          {rec.certNo&&<div style={{fontSize:11,color:T.textMid,marginTop:2}}>Cert: <span style={{fontFamily:T.fontMono,color:T.text}}>{rec.certNo}</span> · {rec.inspDate?new Date(rec.inspDate).toLocaleDateString("en-IN"):""}</div>}
                          {isWaived&&<div style={{fontSize:11,color:T.amber,marginTop:2}}>Waived: {rec.reason}</div>}
                        </div>
                        <Badge color={isWaived?"amber":rec.outcome==="conditional_pass"?"amber":"green"}>
                          {isWaived?"Waived":rec.outcome==="not_inspected"?"Not Inspected":rec.outcome==="conditional_pass"?"Conditional Pass":"Cleared ✓"}
                        </Badge>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        )}
      </div>
    );
  };

  if (activeTabs.length===0) return (
    <div style={{textAlign:"center",padding:48,color:T.textLow}}>
      <div style={{fontSize:32,marginBottom:12}}>🔍</div>
      <div style={{fontSize:14,fontWeight:600,color:T.textMid}}>No TPI hold points configured</div>
      <div style={{fontSize:12,marginTop:6}}>Enable TPI on an order via Orders → Quality → TPI tab and select hold points.</div>
    </div>
  );

  return (
    <div>
      <div style={{display:"flex",gap:0,borderBottom:`1px solid ${T.border}`,marginBottom:20}}>
        {activeTabs.map(hp=>(
          <button key={hp} onClick={()=>setActiveHp(hp)} style={{padding:"10px 18px",fontSize:13,fontWeight:activeHp===hp?700:400,color:activeHp===hp?T.accent:T.textMid,background:"transparent",border:"none",borderBottom:activeHp===hp?`2px solid ${T.accent}`:"2px solid transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:7}}>
            {HP_LABELS[hp]} TPI
            {countForHp(hp)>0&&<span style={{background:activeHp===hp?T.accent:T.amber,color:"#fff",borderRadius:10,fontSize:11,fontWeight:800,padding:"1px 7px"}}>{countForHp(hp)}</span>}
          </button>
        ))}
      </div>
      <HoldPointPanel key={activeHp} hp={activeHp} />
    </div>
  );
};


// ─── TPI FIELD POOL ───────────────────────────────────────────────────────────
const TPI_FIELD_POOL = [
  { id:"orderNo",       label:"Order No",          source:"order" },
  { id:"clientName",    label:"Client Name",        source:"order" },
  { id:"drawingNo",     label:"Drawing No",         source:"drawing" },
  { id:"drawingRev",    label:"Rev",                source:"drawing" },
  { id:"drawingDate",   label:"Drawing Date",       source:"drawing" },
  { id:"assemblyGroup", label:"Assembly Group",     source:"drawing" },
  { id:"markNo",        label:"Mark No",            source:"part" },
  { id:"description",   label:"Description / Component", source:"part" },
  { id:"qty",           label:"Qty",                source:"part" },
  { id:"unitWt",        label:"Unit Wt (kg)",       source:"calc" },
  { id:"totalWt",       label:"Total Wt (kg)",      source:"calc" },
  { id:"grade",         label:"Material Grade",     source:"part" },
  { id:"thickness",     label:"Thickness / Size",   source:"part" },
  { id:"welderId",      label:"Welder ID",          source:"tpi" },
  { id:"welderName",    label:"Welder Name",        source:"tpi" },
  { id:"wpsNo",         label:"WPS No",             source:"tpi" },
  { id:"jointId",       label:"Joint ID",           source:"tpi" },
  { id:"weldType",      label:"Weld Type",          source:"tpi" },
  { id:"ndtType",       label:"NDT Type",           source:"tpi" },
  { id:"ndtResult",     label:"NDT Result",         source:"tpi" },
  { id:"fitupResult",   label:"Fit-Up Result",      source:"tpi" },
  { id:"dimResult",     label:"Dimensional Result", source:"tpi" },
  { id:"remarks",       label:"Inspector Remarks",  source:"tpi" },
  { id:"acceptReject",  label:"Accept / Reject",    source:"tpi" },
  { id:"certNo",        label:"Certificate No",     source:"tpi" },
  { id:"inspDate",      label:"Inspection Date",    source:"tpi" },
  { id:"stage",         label:"Stage",              source:"meta" },
];

const getHpNextStage = (hp, dpr, orders) => {
  const order = (orders||[]).find(o=>o.id===dpr?.orderId);
  const hasPaint = (order?.quality?.paintSpecs||[]).length>0 || (order?.quality?.paintCoats||[]).length>0;
  if (hp==="welding") { const hasBlasting=order?.quality?.blastingRequired!==false; if(hasBlasting) return "blasting"; if(hasPaint) return "painting"; return "complete"; }
  if (hp==="blasting") { if(hasPaint) return "painting"; return "mdcc"; }
  if (hp==="painting") return "mdcc";
  return HP_NEXT_STAGE[hp]||"complete";
};

function resolveTpiField(fieldId, ctx) {
  const { order, drawing, part, tpiRecord } = ctx;
  const q = order?.quality||{};
  const unitWt = part?.unitWt||0;
  switch(fieldId) {
    case "orderNo":       return order?.orderNo||"";
    case "clientName":    return order?.clientName||"";
    case "drawingNo":     return drawing?.drawingNo||drawing?.id||"";
    case "drawingRev":    return drawing?.rev||"";
    case "drawingDate":   return drawing?.drawingDate?new Date(drawing.drawingDate).toLocaleDateString("en-IN"):"";
    case "assemblyGroup": return drawing?.assemblyGroup||"";
    case "markNo":        return part?.markNo||"";
    case "description":   return part?.desc||"";
    case "qty":           return part?.qtyPerDrg||"";
    case "unitWt":        return unitWt>0?unitWt.toFixed(2):"";
    case "totalWt":       return unitWt>0?(unitWt*(part?.qtyPerDrg||1)).toFixed(2):"";
    case "grade":         return part?.grade||"";
    case "thickness":     return part?.size||part?.thickness||"";
    case "welderId":      return tpiRecord?.welderId||"";
    case "welderName":    return tpiRecord?.welderName||"";
    case "wpsNo":         return tpiRecord?.wpsNo||(q.weldSpecs?.[0]?.wpsDoc?"Per WPS":"");
    case "jointId":       return tpiRecord?.jointId||"";
    case "weldType":      return tpiRecord?.weldType||"";
    case "ndtType":       return tpiRecord?.ndtType||"";
    case "ndtResult":     return tpiRecord?.ndtResult||"";
    case "fitupResult":   return tpiRecord?.fitupResult||"";
    case "dimResult":     return tpiRecord?.dimResult||"";
    case "remarks":       return tpiRecord?.remarks||"";
    case "acceptReject":  return tpiRecord?.outcome==="pass"||tpiRecord?.outcome==="conditional_pass"?"Accept":tpiRecord?.outcome==="fail"?"Reject":"";
    case "certNo":        return tpiRecord?.certNo||"";
    case "inspDate":      return tpiRecord?.inspDate?new Date(tpiRecord.inspDate).toLocaleDateString("en-IN"):"";
    case "stage":         return HP_LABELS[tpiRecord?.holdPoint]||"";
    default:              return "";
  }
}

const TpiQualitySetup = ({ order, onChange, canEdit, tpiAgencies }) => {
  const q = order.quality||{};
  const updQ = (k,v) => onChange({...order, quality:{...q,[k]:v}});
  const [templateBuilderHp, setTemplateBuilderHp] = React.useState(null);
  const [savedTemplates, setSavedTemplates] = React.useState(()=>{ try { return JSON.parse(localStorage.getItem("structo_tpiTemplates")||"[]"); } catch { return []; } });
  const persistTemplates = (arr) => { setSavedTemplates(arr); try { localStorage.setItem("structo_tpiTemplates",JSON.stringify(arr)); } catch {} };
  const HP_LIST = [["rm_inspection","RM Inspection"],["fit_up","Fit-Up"],["welding","Welding"],["blasting","Blasting"],["painting","Painting"]];
  const activeHps = q.tpiHoldPoints||[];
  const tpiConfig = q.tpiConfig||{};
  const tpiOrderTemplates = q.tpiOrderTemplates||{};
  const updConfig = (hp,patch) => updQ("tpiConfig",{...tpiConfig,[hp]:{...(tpiConfig[hp]||{}),...patch}});
  const updTemplate = (hp,cols) => updQ("tpiOrderTemplates",{...tpiOrderTemplates,[hp]:cols});
  const DEFAULT_COLS = [{field:"markNo",label:"Mark No"},{field:"description",label:"Description"},{field:"qty",label:"Qty"},{field:"unitWt",label:"Unit Wt (kg)"},{field:"totalWt",label:"Total Wt (kg)"},{field:"grade",label:"Material Grade"},{field:"acceptReject",label:"Accept / Reject"},{field:"remarks",label:"Remarks"}];
  const getTemplate = (hp) => tpiOrderTemplates[hp]||DEFAULT_COLS;
  const setTemplate = (hp,cols) => updTemplate(hp,cols);
  const TPI_AGENCIES_LOCAL = [{id:"TPI-001",name:"Bureau Veritas"},{id:"TPI-002",name:"Lloyd's Register"},{id:"TPI-003",name:"DNV GL"},{id:"TPI-004",name:"SGS"},{id:"TPI-005",name:"Intertek"}];

  const TemplateBuilder = ({hp}) => {
    const [cols,setCols] = React.useState(getTemplate(hp).map((c,i)=>({...c,_id:i})));
    const [newField,setNewField] = React.useState("");
    const [newLabel,setNewLabel] = React.useState("");
    const save = () => { setTemplate(hp,cols.map(({_id,...c})=>c)); setTemplateBuilderHp(null); };
    const moveUp = (i) => { if(i===0) return; const n=[...cols]; [n[i-1],n[i]]=[n[i],n[i-1]]; setCols(n); };
    const moveDown = (i) => { if(i===cols.length-1) return; const n=[...cols]; [n[i],n[i+1]]=[n[i+1],n[i]]; setCols(n); };
    const del = (i) => setCols(cols.filter((_,j)=>j!==i));
    const addCol = () => { if(!newField) return; const pool=TPI_FIELD_POOL.find(f=>f.id===newField); setCols([...cols,{field:newField,label:newLabel||pool?.label||newField,_id:Date.now()}]); setNewField(""); setNewLabel(""); };
    const sampleParts = (order.parts||[]).filter(p=>p.fabType==="Fabricate").slice(0,2);
    const saveAsTemplate = () => { const name=window.prompt("Template name:"); if(!name) return; persistTemplates([...savedTemplates,{id:`TPITMPL-${Date.now()}`,clientId:order.clientId,clientName:order.clientName,holdPoint:hp,name,columns:cols.map(({_id,...c})=>c)}]); };
    const clientTemplates = savedTemplates.filter(t=>t.clientId===order.clientId&&t.holdPoint===hp);
    return (
      <div style={{...css.card,marginTop:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,color:T.text}}>Report Template — {HP_LABELS[hp]}</div>
          <div style={{display:"flex",gap:8}}>
            {clientTemplates.length>0&&<select onChange={e=>{const t=savedTemplates.find(x=>x.id===e.target.value);if(t)setCols(t.columns.map((c,i)=>({...c,_id:i})));}} style={{...css.input,width:"auto",fontSize:11}}><option value="">Load saved template…</option>{clientTemplates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>}
            <button onClick={saveAsTemplate} style={{...css.btn.ghost,fontSize:11}}>💾 Save as Template</button>
            <button onClick={save} style={css.btn.green}>✓ Apply</button>
            <button onClick={()=>setTemplateBuilderHp(null)} style={css.btn.ghost}>✕</button>
          </div>
        </div>
        <div style={{marginBottom:14}}>
          {cols.map((col,i)=>(
            <div key={col._id||i} style={{display:"grid",gridTemplateColumns:"26px 1fr 1fr 60px",gap:6,marginBottom:4,alignItems:"center"}}>
              <span style={{fontSize:11,color:T.textLow,textAlign:"center"}}>{i+1}</span>
              <div style={{fontSize:12,color:T.accent,fontFamily:T.fontMono,padding:"5px 8px",background:T.bgInput,borderRadius:4}}>{TPI_FIELD_POOL.find(f=>f.id===col.field)?.label||col.field}</div>
              <input value={col.label} onChange={e=>{const n=[...cols];n[i]={...n[i],label:e.target.value};setCols(n);}} style={{...css.input,fontSize:12}} />
              <div style={{display:"flex",gap:3}}>
                <button onClick={()=>moveUp(i)} disabled={i===0} style={{...css.btn.ghost,padding:"3px 6px",fontSize:11,opacity:i===0?0.3:1}}>↑</button>
                <button onClick={()=>moveDown(i)} disabled={i===cols.length-1} style={{...css.btn.ghost,padding:"3px 6px",fontSize:11,opacity:i===cols.length-1?0.3:1}}>↓</button>
                <button onClick={()=>del(i)} style={{...css.btn.ghost,padding:"3px 6px",fontSize:11,color:T.red}}>✕</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:16,padding:"10px 12px",background:T.bgInput,borderRadius:6}}>
          <select value={newField} onChange={e=>{setNewField(e.target.value);setNewLabel(TPI_FIELD_POOL.find(f=>f.id===e.target.value)?.label||"");}} style={{...css.input,width:"auto",fontSize:12}}><option value="">Add field…</option>{TPI_FIELD_POOL.filter(f=>!cols.find(c=>c.field===f.id)).map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select>
          <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder="Custom header (optional)" style={{...css.input,fontSize:12,flex:1}} />
          <button onClick={addCol} disabled={!newField} style={{...css.btn.primary,opacity:newField?1:0.4}}>+ Add</button>
        </div>
        {sampleParts.length>0&&<div style={{overflowX:"auto",borderRadius:6,border:`1px solid ${T.border}`}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}><thead><tr style={{background:T.bgInput}}><th style={{padding:"6px 8px",fontWeight:700,color:T.textMid,fontSize:10}}>#</th>{cols.map((col,i)=><th key={i} style={{padding:"6px 8px",fontWeight:700,color:T.textMid,fontSize:10}}>{col.label}</th>)}</tr></thead><tbody>{sampleParts.map((part,ri)=>{const drg=(order.drawings||[]).find(d=>d.id===part.drawingId)||{};const ctx={order,drawing:drg,part:{...part,unitWt:part.unitWt||(part.wt||0)/Math.max(part.qtyPerDrg||1,1)},tpiRecord:{}};return(<tr key={part.markNo} style={{background:ri%2===0?"transparent":T.bgInput}}><td style={{padding:"5px 8px",color:T.textLow,borderBottom:`1px solid ${T.border}`}}>{ri+1}</td>{cols.map((col,ci)=><td key={ci} style={{padding:"5px 8px",color:T.text,borderBottom:`1px solid ${T.border}`}}>{resolveTpiField(col.field,ctx)||<span style={{color:T.textLow}}>—</span>}</td>)}</tr>);})}</tbody></table></div>}
      </div>
    );
  };

  return (
    <div style={{...css.card}}>
      <div style={{marginBottom:16}}>
        <div style={css.label}>TPI Required</div>
        <div style={{display:"flex",gap:12,marginTop:4}}>
          {[[true,"Yes"],[false,"No"]].map(([v,l])=>(
            <label key={String(v)} style={{display:"flex",alignItems:"center",gap:8,cursor:canEdit?"pointer":"default"}}>
              <input type="radio" checked={q.tpiRequired===v} onChange={()=>canEdit&&updQ("tpiRequired",v)} disabled={!canEdit} />
              <span style={{color:T.text}}>{l}</span>
            </label>
          ))}
        </div>
      </div>
      {q.tpiRequired&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
            <div>
              <label style={css.label}>TPI Agency</label>
              <select value={q.tpiAgencyId||""} disabled={!canEdit} style={css.input}
                onChange={e=>{const agencyList=tpiAgencies?.length?tpiAgencies:TPI_AGENCIES_LOCAL;const a=agencyList.find(t=>t.id===e.target.value);onChange({...order,quality:{...q,tpiAgencyId:e.target.value,tpiAgencyName:a?.name||""}});}}>
                <option value="">Select agency…</option>
                {(tpiAgencies?.length?tpiAgencies:TPI_AGENCIES_LOCAL).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <div style={css.label}>Hold Points</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
                {HP_LIST.map(([hp,label])=>(
                  <label key={hp} style={{display:"flex",alignItems:"center",gap:6,cursor:canEdit?"pointer":"default"}}>
                    <input type="checkbox" checked={activeHps.includes(hp)} disabled={!canEdit}
                      onChange={e=>{const pts=activeHps;updQ("tpiHoldPoints",e.target.checked?[...pts,hp]:pts.filter(p=>p!==hp));}} />
                    <span style={{fontSize:12,color:T.text}}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          {activeHps.filter(hp=>hp!=="rm_inspection").map(hp=>{
            const cfg=tpiConfig[hp]||{};
            const coveragePct=cfg.coveragePct??100;
            return (
              <div key={hp} style={{...css.card,background:T.bgInput,marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.text}}>{HP_LABELS[hp]} TPI</div>
                  {canEdit&&<button onClick={()=>setTemplateBuilderHp(templateBuilderHp===hp?null:hp)} style={{...css.btn.ghost,fontSize:11,color:T.accent}}>{templateBuilderHp===hp?"▲ Close Template":"📋 Configure Report Template"}</button>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                  <div>
                    <label style={css.label}>Coverage %</label>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <input type="number" min={1} max={100} value={coveragePct} disabled={!canEdit}
                        onChange={e=>updConfig(hp,{coveragePct:Math.min(100,Math.max(1,+e.target.value))})}
                        style={{...css.input,width:70}} />
                      <span style={{fontSize:12,color:coveragePct<100?T.amber:T.green,fontWeight:700}}>{coveragePct<100?`Partial — ${coveragePct}%`:"Full"}</span>
                    </div>
                  </div>
                  {coveragePct<100&&<div><label style={css.label}>Selection Method</label><select value={cfg.selectionMethod||"first"} disabled={!canEdit} onChange={e=>updConfig(hp,{selectionMethod:e.target.value})} style={css.input}><option value="first">First N drawings</option><option value="random">Random</option><option value="manual">Manual pick</option></select></div>}
                  {hp==="welding"&&<div><label style={css.label}>NDT Required</label><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>{["RT","UT","MPI","VT"].map(ndt=>(<label key={ndt} style={{display:"flex",alignItems:"center",gap:4,cursor:canEdit?"pointer":"default",fontSize:12}}><input type="checkbox" checked={((cfg.ndtTypes||[])).includes(ndt)} disabled={!canEdit} onChange={e=>{const t=cfg.ndtTypes||[];updConfig(hp,{ndtTypes:e.target.checked?[...t,ndt]:t.filter(x=>x!==ndt)});}} />{ndt}</label>))}</div></div>}
                </div>
                {templateBuilderHp===hp&&canEdit&&<TemplateBuilder hp={hp} />}
                {templateBuilderHp!==hp&&<div style={{marginTop:10,fontSize:11,color:T.textLow}}>Report columns: <span style={{color:T.textMid}}>{getTemplate(hp).map(c=>c.label).join(" · ")}</span></div>}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

// ─── VendorTagInput ───────────────────────────────────────────────────────────
const VendorTagInput = ({ value, onChange, vendors, disabled }) => {
  const [query, setQuery]   = React.useState("");
  const [open, setOpen]     = React.useState(false);
  const containerRef        = React.useRef(null);
  const tags = value ? value.split(",").map(s => s.trim()).filter(Boolean) : [];
  const vendorNames = (vendors||[]).map(v => v.name).filter(Boolean);
  const suggestions = vendorNames.filter(n => n.toLowerCase().includes(query.toLowerCase()) && !tags.includes(n));
  const customAllowed = query.trim() && !tags.includes(query.trim()) && !vendorNames.includes(query.trim());
  const addTag = (name) => { const t=name.trim(); if(!t||tags.includes(t)){setQuery("");setOpen(false);return;} onChange([...tags,t].join(", ")); setQuery(""); setOpen(false); };
  const removeTag = (tag) => onChange(tags.filter(t=>t!==tag).join(", "));
  React.useEffect(() => {
    const handler = e => { if(containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  if (disabled) return (
    <div style={{display:"flex",gap:4,flexWrap:"wrap",minHeight:32,padding:"4px 0"}}>
      {tags.length>0 ? tags.map(t=><Badge key={t} color="green">{t}</Badge>) : <span style={{color:T.textLow,fontSize:12}}>—</span>}
    </div>
  );
  return (
    <div ref={containerRef} style={{position:"relative"}}>
      <div onClick={()=>setOpen(true)} style={{...css.input,display:"flex",flexWrap:"wrap",gap:4,padding:"4px 8px",minHeight:36,cursor:"text",alignItems:"center",height:"auto"}}>
        {tags.map(t=>(
          <span key={t} style={{display:"inline-flex",alignItems:"center",gap:3,background:T.greenBg,border:`1px solid ${T.green}`,borderRadius:4,padding:"1px 6px",fontSize:11,color:T.green}}>
            {t}
            <button onMouseDown={e=>{e.preventDefault();e.stopPropagation();removeTag(t);}} style={{background:"none",border:"none",cursor:"pointer",color:T.green,fontSize:11,padding:0,lineHeight:1}}>✕</button>
          </span>
        ))}
        <input value={query} onChange={e=>{setQuery(e.target.value);setOpen(true);}} onFocus={()=>setOpen(true)}
          onKeyDown={e=>{if(e.key==="Enter"&&query.trim()){e.preventDefault();addTag(query);}if(e.key==="Backspace"&&!query&&tags.length)removeTag(tags[tags.length-1]);}}
          placeholder={tags.length===0?"Type to search or add vendor…":""} style={{background:"transparent",border:"none",outline:"none",fontSize:12,color:T.text,fontFamily:T.font,minWidth:140,flex:1}} />
      </div>
      {open&&(suggestions.length>0||customAllowed)&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:1200,background:T.bgCard,border:`1px solid ${T.borderHi}`,borderRadius:6,marginTop:2,boxShadow:"0 4px 16px rgba(0,0,0,0.5)",maxHeight:200,overflowY:"auto"}}>
          {suggestions.map(n=>(
            <div key={n} onMouseDown={e=>{e.preventDefault();addTag(n);}} style={{padding:"8px 12px",cursor:"pointer",fontSize:12,color:T.text,borderBottom:`1px solid ${T.border}`}}
              onMouseEnter={e=>{e.currentTarget.style.background=T.bgHover;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>{n}</div>
          ))}
          {customAllowed&&(
            <div onMouseDown={e=>{e.preventDefault();addTag(query);}} style={{padding:"8px 12px",cursor:"pointer",fontSize:12,color:T.amber,borderBottom:`1px solid ${T.border}`}}
              onMouseEnter={e=>{e.currentTarget.style.background=T.bgHover;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
              + Add "<strong>{query.trim()}</strong>"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TabQuality = ({ order, onChange, canEdit, vendors, tpiAgencies }) => {
  const [activeQ, setActiveQ]       = useState("rm_makes");
  const [activeSpec, setActiveSpec] = useState(0);
  const q = order.quality||{};
  const updQ = (k,v) => onChange({...order,quality:{...q,[k]:v}});
  const qtabs = [{id:"rm_makes",label:"RM Approved Makes"},{id:"blast",label:"Blast Spec"},{id:"paint",label:"Paint Spec"},{id:"weld",label:"Weld Spec"},{id:"tpi",label:"TPI"},{id:"dispatch",label:"Dispatch Spec"},{id:"mdcc",label:"MDCC Dossier"}];
  return (
    <div>
      <TabBar2 tabs={qtabs} active={activeQ} onChange={setActiveQ} />
      {activeQ==="rm_makes"&&<div>
        <div style={{ ...css.card, background:T.amberBg, border:`1px solid ${T.amber}`, marginBottom:14, fontSize:12, color:T.amber }}>Per-order approved makes override global library defaults. These will appear in MRP export for purchase manager reference.</div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}><div style={{ fontSize:14, fontWeight:700, color:T.text }}>RM Approved Makes</div>{canEdit&&<button onClick={()=>updQ("approvedMakes",[...(q.approvedMakes||[]),{id:`QAM-${Date.now()}`,matType:"",makes:"",remarks:""}])} style={css.btn.primary}>+ Add</button>}</div>
        {(q.approvedMakes||[]).map((m,i)=>(
          <div key={m.id} style={{ ...css.card, marginBottom:8, display:"grid", gridTemplateColumns:"1fr 2fr 1fr auto", gap:12, alignItems:"start" }}>
            <div>
              <div style={css.label}>Material Type</div>
              <input value={m.matType||""} onChange={e=>{ const n=[...q.approvedMakes]; n[i]={...n[i],matType:e.target.value}; updQ("approvedMakes",n); }} disabled={!canEdit} style={css.input} />
            </div>
            <div>
              <div style={css.label}>Approved Makes</div>
              <VendorTagInput
                value={m.makes||""}
                onChange={v=>{ const n=[...q.approvedMakes]; n[i]={...n[i],makes:v}; updQ("approvedMakes",n); }}
                vendors={vendors}
                disabled={!canEdit}
              />
            </div>
            <div>
              <div style={css.label}>Remarks</div>
              <input value={m.remarks||""} onChange={e=>{ const n=[...q.approvedMakes]; n[i]={...n[i],remarks:e.target.value}; updQ("approvedMakes",n); }} disabled={!canEdit} style={css.input} />
            </div>
            {canEdit&&<button onClick={()=>updQ("approvedMakes",q.approvedMakes.filter((_,j)=>j!==i))} style={{ ...css.btn.ghost, color:T.red, marginTop:18 }}>✕</button>}
          </div>
        ))}
      </div>}
      {activeQ==="blast"&&(
        <div style={{ ...css.card }}>
          <div style={{ marginBottom:16 }}>
            <div style={css.label}>Blasting Required</div>
            <div style={{ display:"flex", gap:12, marginTop:4 }}>
              <label style={{ display:"flex", alignItems:"center", gap:8, cursor:canEdit?"pointer":"default" }}>
                <input type="radio" checked={q.blastingRequired!==false} onChange={()=>canEdit&&updQ("blastingRequired",true)} disabled={!canEdit} />
                <span style={{ color:T.text }}>Yes</span>
              </label>
              <label style={{ display:"flex", alignItems:"center", gap:8, cursor:canEdit?"pointer":"default" }}>
                <input type="radio" checked={q.blastingRequired===false} onChange={()=>canEdit&&updQ("blastingRequired",false)} disabled={!canEdit} />
                <span style={{ color:T.text }}>No</span>
              </label>
            </div>
          </div>
          {q.blastingRequired!==false&&(
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
              <div>
                <label style={css.label}>Blasting Standard</label>
                <select value={q.blastingStandard||"Sa 2.5"} disabled={!canEdit}
                  onChange={e=>updQ("blastingStandard",e.target.value)} style={css.input}>
                  {["Sa 1","Sa 2","Sa 2.5","Sa 3","SIS-05 59 00 St 3","SSPC-SP6","SSPC-SP10"].map(s=>(
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={css.label}>Surface Profile (Rz microns)</label>
                <input value={q.blastingProfile||"40-70"} disabled={!canEdit}
                  onChange={e=>updQ("blastingProfile",e.target.value)}
                  style={css.input} placeholder="e.g. 40-70" />
              </div>
              <div>
                <label style={css.label}>Primer Window (hours)</label>
                <input type="number" value={q.primerWindowHrs??4} disabled={!canEdit} min={1} max={24}
                  onChange={e=>updQ("primerWindowHrs",parseFloat(e.target.value)||4)}
                  style={css.input} />
                <div style={{ fontSize:10, color:T.textLow, marginTop:3 }}>Max time between blast complete and primer application. Default: 4 hrs.</div>
              </div>
              <div>
                <label style={css.label}>Blast Contractor</label>
                <input value={q.blastContractorNote||""} disabled={!canEdit}
                  onChange={e=>updQ("blastContractorNote",e.target.value)}
                  style={css.input} placeholder="Assigned at production stage" />
              </div>
              <div>
                <label style={css.label}>Ambient Conditions Note</label>
                <input value={q.blastAmbientNote||""} disabled={!canEdit}
                  onChange={e=>updQ("blastAmbientNote",e.target.value)}
                  style={css.input} placeholder="e.g. Humidity < 85%, no dew point" />
              </div>
              <div>
                <label style={css.label}>Remarks</label>
                <input value={q.blastRemarks||""} disabled={!canEdit}
                  onChange={e=>updQ("blastRemarks",e.target.value)}
                  style={css.input} placeholder="Any specific blasting notes" />
              </div>
            </div>
          )}
        </div>
      )}
      {activeQ==="paint"&&(()=>{
        // Migrate legacy paintCoats → paintSpecs on first render
        const paintSpecs = q.paintSpecs
          ? q.paintSpecs
          : (q.paintCoats?.length ? [{specLabel:"A", coats:q.paintCoats}] : []);

        const updSpecs = (newSpecs) => onChange({...order, quality:{...q, paintSpecs:newSpecs}});

        const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const nextLabel = ALPHA[paintSpecs.length] || String(paintSpecs.length+1);

        const selIdx  = Math.min(activeSpec, Math.max(0, paintSpecs.length-1));
        const selSpec = paintSpecs[selIdx] || null;

        const updSpec = (patch) => {
          updSpecs(paintSpecs.map((s,i)=>i===selIdx?{...s,...patch}:s));
        };
        const addCoat = () => {
          const coats = selSpec?.coats||[];
          updSpec({coats:[...coats,{coatNo:coats.length+1,type:"Primer",dft:50,make:"",product:"",dryTime:8,remarks:"",requiresQc:true}]});
        };
        const updCoat = (ci,patch) => {
          updSpec({coats:(selSpec.coats||[]).map((c,j)=>j===ci?{...c,...patch}:c)});
        };
        const removeCoat = (ci) => {
          updSpec({coats:(selSpec.coats||[]).filter((_,j)=>j!==ci)});
        };
        const removeSpec = () => {
          const n = paintSpecs.filter((_,i)=>i!==selIdx);
          updSpecs(n);
          setActiveSpec(Math.max(0, selIdx-1));
        };

        return (
          <div>
            {/* Spec selector tabs */}
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:16, flexWrap:"wrap" }}>
              {paintSpecs.map((ps,i)=>(
                <button key={i} onClick={()=>setActiveSpec(i)}
                  style={{ padding:"6px 16px", fontSize:12, fontWeight:selIdx===i?700:400,
                    color:selIdx===i?T.accent:T.textMid,
                    background:selIdx===i?T.bgHover:"transparent",
                    border:`1px solid ${selIdx===i?T.accent:T.border}`,
                    borderRadius:6, cursor:"pointer", fontFamily:T.font }}>
                  Paint Spec {ps.specLabel||ALPHA[i]||i+1}
                  {(ps.coats||[]).length>0 && (
                    <span style={{ marginLeft:6, fontSize:10, color:T.textLow }}>
                      {(ps.coats||[]).length} coat{(ps.coats||[]).length!==1?"s":""}
                      {" · "}{(ps.coats||[]).reduce((s,c)=>s+(c.dft||0),0)} µm
                    </span>
                  )}
                </button>
              ))}
              {canEdit && (
                <button onClick={()=>{ updSpecs([...paintSpecs,{specLabel:nextLabel,coats:[]}]); setActiveSpec(paintSpecs.length); }}
                  style={{ ...css.btn.secondary, fontSize:12, padding:"6px 12px" }}>
                  + Add Spec
                </button>
              )}
              {paintSpecs.length===0 && !canEdit && (
                <span style={{ fontSize:12, color:T.textLow }}>No paint specifications defined</span>
              )}
            </div>

            {selSpec && (
              <div style={css.card}>
                {/* Spec label + summary + delete */}
                <div style={{ display:"flex", gap:12, alignItems:"flex-end", marginBottom:16, flexWrap:"wrap" }}>
                  <div>
                    <label style={css.label}>Spec Label</label>
                    <input value={selSpec.specLabel||""} disabled={!canEdit}
                      onChange={e=>updSpec({specLabel:e.target.value})}
                      style={{ ...css.input, width:220 }}
                      placeholder="e.g. A, Standard, External, RAL7035" />
                  </div>
                  <div style={{ fontSize:12, color:T.textMid, paddingBottom:8 }}>
                    {(selSpec.coats||[]).length} coat{(selSpec.coats||[]).length!==1?"s":""}&ensp;·&ensp;
                    Total DFT: <strong style={{ color:T.gold }}>{(selSpec.coats||[]).reduce((s,c)=>s+(c.dft||0),0)} µm</strong>
                  </div>
                  <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"flex-end", paddingBottom:2 }}>
                    {canEdit && (
                      <button onClick={addCoat} style={css.btn.primary}>+ Add Coat</button>
                    )}
                    {canEdit && paintSpecs.length>1 && (
                      <button onClick={removeSpec}
                        style={{ ...css.btn.ghost, color:T.red }}>Delete Spec</button>
                    )}
                  </div>
                </div>

                {/* Coat rows */}
                {(selSpec.coats||[]).length===0
                  ? <div style={{ fontSize:12, color:T.textLow, padding:"12px 0" }}>No coats defined yet — click + Add Coat</div>
                  : (selSpec.coats||[]).map((c,ci)=>(
                    <div key={ci} style={{ ...css.card, background:T.bg, marginBottom:8 }}>
                      <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                        <Badge color={c.type==="Primer"?"blue":c.type==="MIO"?"amber":"green"}>
                          Coat {c.coatNo||ci+1} — {c.type}
                        </Badge>
                        <span style={{ fontSize:12, color:T.textMid }}>DFT: {c.dft}µm · Dry: {c.dryTime}h</span>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr auto", gap:10, alignItems:"end" }}>
                        <div><div style={css.label}>Type</div>
                          <select value={c.type||"Primer"} disabled={!canEdit}
                            onChange={e=>updCoat(ci,{type:e.target.value})} style={css.input}>
                            <option>Primer</option><option>MIO</option><option>Finish</option><option>Intermediate</option>
                          </select>
                        </div>
                        <div><div style={css.label}>DFT (µm)</div>
                          <input type="number" value={c.dft||""} disabled={!canEdit}
                            onChange={e=>updCoat(ci,{dft:+e.target.value})} style={css.input} />
                        </div>
                        <div><div style={css.label}>Make</div>
                          <input value={c.make||""} disabled={!canEdit}
                            onChange={e=>updCoat(ci,{make:e.target.value})} style={css.input} />
                        </div>
                        <div><div style={css.label}>Product</div>
                          <input value={c.product||""} disabled={!canEdit}
                            onChange={e=>updCoat(ci,{product:e.target.value})} style={css.input} />
                        </div>
                        <div><div style={css.label}>Dry Time (h)</div>
                          <input type="number" value={c.dryTime||""} disabled={!canEdit}
                            onChange={e=>updCoat(ci,{dryTime:+e.target.value})} style={css.input} />
                        </div>
                        <div>
                          <div style={css.label}>QC Required</div>
                          <label style={{ display:"flex", alignItems:"center", gap:6, marginTop:6, cursor:canEdit?"pointer":"default" }}>
                            <input type="checkbox" checked={c.requiresQc!==false} disabled={!canEdit}
                              onChange={e=>updCoat(ci,{requiresQc:e.target.checked})} />
                            <span style={{ fontSize:12, color:T.text }}>Yes</span>
                          </label>
                        </div>
                        {canEdit && (
                          <button onClick={()=>removeCoat(ci)}
                            style={{ ...css.btn.ghost, color:T.red }}>✕</button>
                        )}
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        );
      })()}

      {/* Paint area summary — shown in paint tab */}
      {activeQ==="paint" && (()=>{
        const allParts = order.parts||[];
        const allDrawings = order.drawings||[];
        const excPct = order.paintExclusionPct ?? 10;
        let grossTotal = 0; let canCalcAll = true;
        allParts.filter(p=>p.fabType==="Fabricate").forEach(p=>{
          const drg = allDrawings.find(d=>d.id===p.drawingId);
          const ga = computePaintableArea(p, drg);
          if (ga===null) { canCalcAll=false; return; }
          const pp = p.paintPct !== undefined ? (100-0) : (100-excPct); // use per-part if set, else order default
          const partPct = p.paintPct !== undefined ? p.paintPct : (100-excPct);
          grossTotal += ga * (p.qtyPerDrg||1) * (drg?.qty||1);
        });
        const netTotal = grossTotal * (1 - excPct/100);

        const paintSpecs = order.quality?.paintSpecs||[];

        return (
          <div style={{...css.card, marginTop:16, borderLeft:`3px solid ${T.accent}`}}>
            <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:12}}>Paint Quantity Estimate</div>
            <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:10,color:T.textMid,fontWeight:700}}>GROSS PAINTABLE AREA</div>
                <div style={{fontFamily:T.fontMono,fontSize:16,fontWeight:800,color:T.text}}>{grossTotal.toFixed(2)} m²</div>
              </div>
              <div style={{color:T.textLow}}>−</div>
              <div>
                <div style={{fontSize:10,color:T.textMid,fontWeight:700}}>EXCLUSION</div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {canEdit ? (
                    <input type="text" inputMode="decimal" value={excPct}
                      onChange={e=>{const v=parseFloat(e.target.value);if(!isNaN(v)&&v>=0&&v<=50)onChange({...order,paintExclusionPct:v});}}
                      style={{...css.input,width:60,fontFamily:T.fontMono,textAlign:"center"}} />
                  ) : <span style={{fontFamily:T.fontMono,fontSize:14,fontWeight:700}}>{excPct}</span>}
                  <span style={{fontSize:12,color:T.textMid}}>% = {(grossTotal*excPct/100).toFixed(2)} m²</span>
                </div>
              </div>
              <div style={{color:T.textLow}}>=</div>
              <div>
                <div style={{fontSize:10,color:T.textMid,fontWeight:700}}>NET PAINTABLE AREA</div>
                <div style={{fontFamily:T.fontMono,fontSize:16,fontWeight:800,color:T.green}}>{netTotal.toFixed(2)} m²</div>
              </div>
              {!canCalcAll && <div style={{fontSize:11,color:T.amber}}>⚠ Some parts have no dimensions — area may be understated</div>}
            </div>

            {paintSpecs.length>0 && (
              <div>
                <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>Paint Required Per Spec</div>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead><tr style={{background:T.bgInput}}>
                    {["Spec","Coat","Type","DFT (µm)","Coverage (m²/L)","Litres Required"].map(h=>(
                      <th key={h} style={{padding:"5px 10px",textAlign:"left",color:T.textMid,fontWeight:700,borderBottom:`1px solid ${T.border}`}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {paintSpecs.flatMap((ps,si)=>(ps.coats||[]).map((coat,ci)=>{
                      const coverageRate = coat.coverageRate || 10; // m²/litre default
                      const litres = netTotal>0 ? (netTotal/coverageRate).toFixed(1) : "—";
                      return (
                        <tr key={`${si}-${ci}`} style={{borderBottom:`1px solid ${T.border}`}}>
                          <td style={{padding:"5px 10px",color:T.accent,fontWeight:700}}>Spec {ps.specLabel||si+1}</td>
                          <td style={{padding:"5px 10px"}}>Coat {coat.coatNo}</td>
                          <td style={{padding:"5px 10px"}}>{coat.type||"—"}</td>
                          <td style={{padding:"5px 10px",fontFamily:T.fontMono}}>{coat.dft||"—"}</td>
                          <td style={{padding:"5px 10px",fontFamily:T.fontMono}}>
                            {canEdit ? (
                              <input type="text" inputMode="decimal" defaultValue={coverageRate}
                                onBlur={e=>{
                                  const v=parseFloat(e.target.value)||10;
                                  const newSpecs=paintSpecs.map((s,i)=>i!==si?s:{...s,coats:(s.coats||[]).map((c,j)=>j!==ci?c:{...c,coverageRate:v})});
                                  onChange({...order,quality:{...order.quality,paintSpecs:newSpecs}});
                                }}
                                style={{...css.input,width:60,fontFamily:T.fontMono,textAlign:"center",fontSize:11}} />
                            ) : coverageRate}
                          </td>
                          <td style={{padding:"5px 10px",fontFamily:T.fontMono,fontWeight:700,color:T.green}}>{litres} L</td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
                <div style={{fontSize:10,color:T.textLow,marginTop:6}}>Coverage rate (m²/litre) is editable per coat. Default 10 m²/L. Typical: primer 11 m²/L at 35µm, intermediate 8 m²/L at 50µm.</div>
              </div>
            )}
          </div>
        );
      })()}

      {activeQ==="weld"&&(()=>{
        // Migration: derive weldSpecs from legacy single weldSpec object
        const weldSpecs = q.weldSpecs || (q.weldSpec
          ? [{ process:q.weldSpec.process||"SMAW", electrodeOrWire:q.weldSpec.electrodeType||"",
               grade:q.weldSpec.grade||"", approvedMake:q.weldSpec.make||"",
               notes:q.weldSpec.remarks||"" }]
          : []);
        // weldingSequence is order-level (migrate from legacy weldSpec.weldingSequence)
        const weldingSeq = q.weldingSequence ?? q.weldSpec?.weldingSequence ?? "";

        const updSpecs = (ns) => onChange({...order, quality:{...q, weldSpecs:ns}});
        const updSpec  = (i,patch) => updSpecs(weldSpecs.map((s,j)=>j===i?{...s,...patch}:s));
        const addSpec  = () => updSpecs([...weldSpecs,{process:"SMAW",electrodeOrWire:"",grade:"",approvedMake:"",notes:""}]);
        const delSpec  = (i) => updSpecs(weldSpecs.filter((_,j)=>j!==i));
        const updSeq   = (v) => onChange({...order, quality:{...q, weldingSequence:v}});

        const PROCESSES = ["SMAW","MIG (GMAW)","SAW","FCAW","TIG (GTAW)","Other"];

        return (
          <div>
            {/* WPS/WPQ — order level */}
            <div style={{ ...css.card, marginBottom:14 }}>
              <label style={css.label}>WPS / WPQ Document</label>
              <div style={{ display:"flex", gap:8, marginTop:4 }}>
                <input value={q.wpsDoc||""} onChange={e=>updQ("wpsDoc",e.target.value)}
                  disabled={!canEdit} style={{ ...css.input, flex:1 }} placeholder="Drive link..." />
                {q.wpsDoc && <a href={q.wpsDoc} target="_blank" rel="noreferrer" style={{ ...css.btn.sm, textDecoration:"none" }}>View</a>}
              </div>
              <div style={{ fontSize:11, color:T.red, marginTop:4 }}>⚠ Critical — required for TPI inspection</div>
            </div>

            {/* Weld Specs list */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:700, color:T.text }}>Weld Specifications</div>
              {canEdit && <button onClick={addSpec} style={css.btn.primary}>+ Add Weld Spec</button>}
            </div>
            {weldSpecs.length===0 && !canEdit && (
              <div style={{ fontSize:12, color:T.textLow, padding:"12px 0" }}>No weld specifications defined</div>
            )}
            {weldSpecs.map((ws,i)=>(
              <div key={i} style={{ ...css.card, marginBottom:10, background:T.bg }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr auto", gap:12, alignItems:"end" }}>
                  <div>
                    <label style={css.label}>Process</label>
                    <select value={ws.process||"SMAW"} disabled={!canEdit}
                      onChange={e=>updSpec(i,{process:e.target.value})} style={css.input}>
                      {PROCESSES.map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={css.label}>Electrode / Wire</label>
                    <input value={ws.electrodeOrWire||""} disabled={!canEdit}
                      onChange={e=>updSpec(i,{electrodeOrWire:e.target.value})}
                      style={css.input} placeholder="E7018 / ER70S-6…" />
                  </div>
                  <div>
                    <label style={css.label}>Grade</label>
                    <input value={ws.grade||""} disabled={!canEdit}
                      onChange={e=>updSpec(i,{grade:e.target.value})}
                      style={css.input} placeholder="E250 / E350…" />
                  </div>
                  <div>
                    <label style={css.label}>Approved Make</label>
                    <input value={ws.approvedMake||""} disabled={!canEdit}
                      onChange={e=>updSpec(i,{approvedMake:e.target.value})}
                      style={css.input} placeholder="ESAB / Lincoln / D&H…" />
                  </div>
                  {canEdit && (
                    <button onClick={()=>delSpec(i)} disabled={weldSpecs.length<=1}
                      title={weldSpecs.length<=1?"Cannot delete the only spec":"Remove this spec"}
                      style={{ ...css.btn.ghost, color:T.red, opacity:weldSpecs.length<=1?0.3:1,
                               cursor:weldSpecs.length<=1?"not-allowed":"pointer" }}>✕</button>
                  )}
                  <div style={{ gridColumn:"span 4" }}>
                    <label style={css.label}>Notes (optional)</label>
                    <input value={ws.notes||""} disabled={!canEdit}
                      onChange={e=>updSpec(i,{notes:e.target.value})}
                      style={css.input} placeholder="e.g. Preheat required for plates >12mm…" />
                  </div>
                </div>
              </div>
            ))}

            {/* Welding sequence — order level */}
            <div style={{ ...css.card, marginTop:8 }}>
              <label style={css.label}>Welding sequence / distortion control notes (optional)</label>
              <textarea value={weldingSeq} disabled={!canEdit}
                onChange={e=>updSeq(e.target.value)} rows={3}
                placeholder="e.g. Weld base plates before flange plates. Alternate sides on long members. Back-step on plates over 300mm."
                style={{ ...css.input, width:"100%", resize:"vertical", fontFamily:T.font, marginTop:4 }} />
            </div>
          </div>
        );
      })()}
      {activeQ==="tpi"&&<TpiQualitySetup order={order} onChange={onChange} canEdit={canEdit} tpiAgencies={tpiAgencies} />}
      {activeQ==="dispatch"&&<div style={{ ...css.card }}><div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}><div><label style={css.label}>Packing Type</label><select value={q.dispatchSpec?.packingType||""} onChange={e=>updQ("dispatchSpec",{...q.dispatchSpec,packingType:e.target.value})} disabled={!canEdit} style={css.input}><option value="">Select...</option><option>Shrink wrap only</option><option>Wooden rafters + shrink wrap</option><option>Wooden box</option><option>Custom</option></select></div><div style={{ gridColumn:"span 1" }}><label style={css.label}>Remarks</label><textarea value={q.dispatchSpec?.remarks||""} onChange={e=>updQ("dispatchSpec",{...q.dispatchSpec,remarks:e.target.value})} disabled={!canEdit} style={{ ...css.input, minHeight:60, resize:"vertical" }} /></div></div></div>}
      {activeQ==="mdcc"&&<div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}><div style={{ fontSize:14, fontWeight:700, color:T.text }}>MDCC Dossier Checklist</div>{canEdit&&<button onClick={()=>updQ("mdccDocs",[...(q.mdccDocs||[]),{id:`MDCC-D-${Date.now()}`,docName:"",mandatory:true}])} style={css.btn.primary}>+ Add Document</button>}</div>
        <div style={{ ...css.card, background:T.amberBg, border:`1px solid ${T.amber}`, marginBottom:14, fontSize:12, color:T.amber }}>Define which documents must be in the MDCC dossier. System tracks attachment status.</div>
        {(q.mdccDocs||[]).map((d,i)=><div key={d.id} style={{ ...css.card, marginBottom:6, display:"flex", alignItems:"center", gap:12 }}><span style={{ fontSize:11, color:T.green }}>○</span><input value={d.docName||""} onChange={e=>{ const n=[...q.mdccDocs]; n[i]={...n[i],docName:e.target.value}; updQ("mdccDocs",n); }} disabled={!canEdit} style={{ ...css.input, flex:1 }} /><label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", whiteSpace:"nowrap" }}><input type="checkbox" checked={d.mandatory} disabled={!canEdit} onChange={e=>{ const n=[...q.mdccDocs]; n[i]={...n[i],mandatory:e.target.checked}; updQ("mdccDocs",n); }} /><span style={{ fontSize:12, color:T.textMid }}>Mandatory</span></label>{d.mandatory&&<Badge color="red">Required</Badge>}{canEdit&&<button onClick={()=>updQ("mdccDocs",q.mdccDocs.filter((_,j)=>j!==i))} style={{ ...css.btn.ghost, color:T.red }}>✕</button>}</div>)}
      </div>}
    </div>
  );
};
const TabMaterialBalance = ({ order, stock, releases, instances, pos, nestingBatches }) => {
  const [expanded, setExpanded] = React.useState({});
  const toggleExpand = key => setExpanded(prev => ({...prev, [key]: !prev[key]}));

  // Gather all rmUnitAssignments for this order
  const orderReleases = (releases||[]).filter(r =>
    (r.drawings||[]).some(d=>d.orderId===order.id)
  );
  const allRmAssignments = orderReleases.flatMap(r =>
    (r.rmUnitAssignments||[]).map(ru => ({...ru, releaseId: r.id, releaseNo: r.releaseNo||r.id}))
  );

  // Build per-matCode buckets
  const matMap = {};
  allRmAssignments.forEach(ru => {
    const mc = normMatCode(ru.matCode||"") || ru.matCode || "Unknown";
    if (!matMap[mc]) matMap[mc] = {matCode: ru.matCode||mc, rmUnits: [], plannedKg: 0, issuedKg: 0, offcutKg: 0};
    matMap[mc].rmUnits.push(ru);
    matMap[mc].plannedKg += ru.sheetWt || 0;
  });

  // Gather issue transactions from stock lots
  (stock||[]).forEach(lot => {
    const mc = normMatCode(lot.matCode||"") || lot.matCode || "Unknown";
    if (!matMap[mc]) return;
    (lot.issues||[]).forEach(iss => {
      // Only count issues linked to this order's releases
      const isOrderRelease = orderReleases.some(r => r.id === iss.releaseId) ||
        allRmAssignments.some(ru => ru.rmUnitId === iss.rmUnitId);
      if (isOrderRelease || iss.releaseId) {
        matMap[mc].issuedKg += iss.wt || 0;
        if (!matMap[mc].issues) matMap[mc].issues = [];
        matMap[mc].issues.push({...iss, lotNo: lot.lotNo||lot.id, lotId: lot.id});
      }
    });
    // Offcut lots linked to this order
    if (lot.type === "offcut" || lot.isOffcut) {
      const linked = allRmAssignments.some(ru => ru.stockLotId === lot.parentLotId || ru.stockLotId === lot.id);
      if (linked) {
        matMap[mc].offcutKg += lot.wtReceived || lot.wtAvailable || 0;
        if (!matMap[mc].offcuts) matMap[mc].offcuts = [];
        matMap[mc].offcuts.push(lot);
      }
    }
  });

  const rows = Object.values(matMap);
  const totals = rows.reduce((acc, r) => {
    acc.planned += r.plannedKg;
    acc.issued += r.issuedKg;
    acc.offcut += r.offcutKg;
    return acc;
  }, {planned: 0, issued: 0, offcut: 0});
  totals.consumed = Math.max(0, totals.issued - totals.offcut);
  totals.variance = totals.issued - totals.planned;

  const colHdr = {padding:"8px 10px", textAlign:"left", fontSize:10, fontWeight:700, color:T.textMid, textTransform:"uppercase", borderBottom:`1px solid ${T.border}`, background:T.bg, whiteSpace:"nowrap"};
  const colCell = {padding:"8px 10px", borderBottom:`1px solid ${T.border}`, fontFamily:T.fontMono, fontSize:12};

  const SummaryCard = ({label, value, color, sub}) => (
    <div style={{ ...css.card, flex:1, minWidth:120, textAlign:"center" }}>
      <div style={{ fontSize:11, color:T.textMid, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:800, color: color||T.text, fontFamily:T.fontMono }}>{(value||0).toFixed(1)}</div>
      <div style={{ fontSize:10, color:T.textLow }}>kg</div>
      {sub && <div style={{ fontSize:10, color:T.textMid, marginTop:4 }}>{sub}</div>}
    </div>
  );

  if (rows.length === 0) return (
    <div style={{ ...css.card, textAlign:"center", color:T.textLow, padding:32 }}>
      No material releases found for this order. Release drawings first.
    </div>
  );

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        <SummaryCard label="Planned (Released)" value={totals.planned} color={T.accent} />
        <SummaryCard label="Issued from Store" value={totals.issued} color={T.blue||T.accent} />
        <SummaryCard label="Offcut Returned" value={totals.offcut} color={T.textMid} />
        <SummaryCard label="Net Consumed" value={totals.consumed} color={T.green} />
        <SummaryCard label="Variance (Issued−Planned)" value={totals.variance}
          color={totals.variance > 0 ? T.red : totals.variance < -0.5 ? T.amber : T.green}
          sub={totals.variance > 0 ? "Over plan" : totals.variance < -0.5 ? "Under-issued" : "On plan"} />
      </div>

      {/* Per-matCode table */}
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr>
              {["Material","RM Units","Planned (kg)","Issued (kg)","Offcut (kg)","Consumed (kg)","Variance","Utilisation"].map(h =>
                <th key={h} style={colHdr}>{h}</th>
              )}
              <th style={colHdr}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const consumed = Math.max(0, r.issuedKg - r.offcutKg);
              const variance = r.issuedKg - r.plannedKg;
              const utilisPct = r.plannedKg > 0 ? Math.round(consumed / r.plannedKg * 100) : 0;
              const isOpen = expanded[r.matCode];
              return (
                <React.Fragment key={r.matCode}>
                  <tr style={{ background:"transparent" }}>
                    <td style={{...colCell, color:T.text, fontWeight:600, fontFamily:"inherit"}}>{r.matCode}</td>
                    <td style={{...colCell, textAlign:"center"}}>{r.rmUnits.length}</td>
                    <td style={colCell}>{r.plannedKg.toFixed(1)}</td>
                    <td style={{...colCell, color: r.issuedKg > 0 ? T.text : T.textLow}}>{r.issuedKg.toFixed(1)}</td>
                    <td style={{...colCell, color:T.textMid}}>{r.offcutKg.toFixed(1)}</td>
                    <td style={{...colCell, color:T.green, fontWeight:600}}>{consumed.toFixed(1)}</td>
                    <td style={{...colCell, color: variance > 0.5 ? T.red : variance < -0.5 ? T.amber : T.green}}>
                      {variance > 0 ? "+" : ""}{variance.toFixed(1)}
                    </td>
                    <td style={colCell}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ flex:1, height:6, background:T.border, borderRadius:3, minWidth:60 }}>
                          <div style={{ width:`${Math.min(100,utilisPct)}%`, height:"100%", background:utilisPct>=90?T.green:utilisPct>=70?T.amber:T.red, borderRadius:3 }} />
                        </div>
                        <span style={{ fontSize:11, color:T.textMid, minWidth:32 }}>{utilisPct}%</span>
                      </div>
                    </td>
                    <td style={{...colCell, textAlign:"center"}}>
                      {((r.issues||[]).length > 0 || (r.offcuts||[]).length > 0) && (
                        <button onClick={() => toggleExpand(r.matCode)} style={{...css.btn.ghost, fontSize:11, padding:"2px 8px"}}>
                          {isOpen ? "▲" : "▼"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {isOpen && (r.issues||[]).length > 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding:"0 0 8px 24px", background:T.bg }}>
                        <div style={{ fontSize:11, color:T.textMid, fontWeight:700, padding:"6px 0 4px" }}>Issue Transactions</div>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                          <thead>
                            <tr>{["Issue Note","Date","Lot No","RM Unit","Qty (kg)","Issued To"].map(h =>
                              <th key={h} style={{...colHdr, fontSize:9}}>{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {(r.issues||[]).map((iss,i) => (
                              <tr key={i}>
                                <td style={{...colCell, fontSize:11, color:T.accentHi}}>{iss.issueNoteNo||iss.issueId||"—"}</td>
                                <td style={{...colCell, fontSize:11}}>{fmt.date(iss.issueDate)}</td>
                                <td style={{...colCell, fontSize:11}}>{iss.lotNo||iss.lotId||"—"}</td>
                                <td style={{...colCell, fontSize:10, color:T.textMid, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{iss.rmUnitId||"—"}</td>
                                <td style={{...colCell, fontSize:11}}>{(iss.wt||0).toFixed(1)}</td>
                                <td style={{...colCell, fontSize:11, color:T.textMid}}>{iss.issuedTo||"—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                  {isOpen && (r.offcuts||[]).length > 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding:"0 0 8px 24px", background:T.bg }}>
                        <div style={{ fontSize:11, color:T.textMid, fontWeight:700, padding:"6px 0 4px" }}>Offcut Lots</div>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                          <thead>
                            <tr>{["Lot No","Material","Wt (kg)","Status"].map(h =>
                              <th key={h} style={{...colHdr, fontSize:9}}>{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {(r.offcuts||[]).map((lot,i) => (
                              <tr key={i}>
                                <td style={{...colCell, fontSize:11, color:T.accentHi}}>{lot.lotNo||lot.id}</td>
                                <td style={{...colCell, fontSize:11}}>{lot.matCode}</td>
                                <td style={{...colCell, fontSize:11}}>{(lot.wtReceived||lot.wtAvailable||0).toFixed(1)}</td>
                                <td style={{...colCell, fontSize:11}}><Badge color="blue">{lot.status||"offcut"}</Badge></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {/* Totals row */}
            <tr style={{ background:T.bg, fontWeight:700 }}>
              <td style={{...colCell, color:T.text}}>TOTAL</td>
              <td style={{...colCell, textAlign:"center"}}>{rows.reduce((a,r)=>a+r.rmUnits.length,0)}</td>
              <td style={colCell}>{totals.planned.toFixed(1)}</td>
              <td style={colCell}>{totals.issued.toFixed(1)}</td>
              <td style={colCell}>{totals.offcut.toFixed(1)}</td>
              <td style={{...colCell, color:T.green}}>{totals.consumed.toFixed(1)}</td>
              <td style={{...colCell, color: totals.variance > 0.5 ? T.red : totals.variance < -0.5 ? T.amber : T.green}}>
                {totals.variance > 0 ? "+" : ""}{totals.variance.toFixed(1)}
              </td>
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
const TabFinance = ({ order, onChange, canEdit }) => {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [finTab, setFinTab] = useState("budget");
  const amds = order.amendments||[];
  const invoices = (order.milestones||[]).flatMap(m=>(m.invoices||[]).map(inv=>({...inv,milestoneName:m.desc})));
  const qty = order.orderQty||0;
  const budget = order.budget||{};
  const updBudget = (k,v) => onChange({...order, budget:{...budget, [k]:v}});

  // Budget calculations
  const rmBudget        = qty*(budget.rmRatePerT||0);
  const paintBudget     = qty*(budget.paintRatePerT||0);
  const contractorBudget= qty*(budget.contractorRatePerT||0);
  const transportBudget = qty*(budget.transportRatePerT||0);
  const totalBudget     = rmBudget+paintBudget+contractorBudget+transportBudget;
  const grossMarginEst  = (order.orderValue||0)-totalBudget;
  const marginPct       = (order.orderValue||0)>0?Math.round(grossMarginEst/(order.orderValue||1)*100):0;

  // Amendable fields — label, key on order, display formatter, input type, update patch builder
  const AMD_FIELDS = [
    { label:"End Date",      key:"endDate",      type:"date",   fmt: v=>v?new Date(v).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—", patch: v=>({endDate:v}) },
    { label:"Order Qty",     key:"orderQty",     type:"number", fmt: v=>`${v||0} ${order.orderUnit||"Ton"}`, patch: v=>({orderQty:+v, orderValue:(order.ratePerUnit||0)*(+v)}) },
    { label:"Rate per Unit", key:"ratePerUnit",  type:"number", fmt: v=>`₹${fmt.num(v||0)}/Ton`, patch: v=>({ratePerUnit:+v, orderValue:(+v)*(order.orderQty||0)}) },
    { label:"Client PO No",  key:"clientPoNo",   type:"text",   fmt: v=>v||"—", patch: v=>({clientPoNo:v}) },
    { label:"Client PO Doc", key:"clientPoDoc",  type:"text",   fmt: v=>v||"—", patch: v=>({clientPoDoc:v}) },
    { label:"Order Scope",   key:"projectDesc",  type:"text",   fmt: v=>v||"—", patch: v=>({projectDesc:v}) },
  ];

  const selField = AMD_FIELDS.find(f=>f.label===form.field);

  const openModal = () => setForm({ date:today(), field:"", newVal:"", reason:"", docLink:"" });

  const onFieldSelect = (label) => {
    const f = AMD_FIELDS.find(x=>x.label===label);
    setForm(prev=>({ ...prev, field:label,
      oldVal: f ? f.fmt(order[f.key]) : "",
      newVal: f ? String(order[f.key]||"") : "",
    }));
  };

  const saveAmendment = () => {
    if (!form.field||!form.newVal||!form.reason?.trim()) return;
    const f = AMD_FIELDS.find(x=>x.label===form.field);
    const amd = {
      id:`AMD-${Date.now()}`,
      date:form.date||today(),
      field:form.field,
      oldVal:form.oldVal||"",
      newVal:f ? f.fmt(form.newVal) : form.newVal,
      reason:form.reason.trim(),
      docLink:form.docLink?.trim()||"",
      changedBy:"Current User",
    };
    // Actually update the order field + log amendment
    const patch = f ? f.patch(form.newVal) : {};
    onChange({ ...order, ...patch, amendments:[...amds, amd] });
    setModal(null); setForm({});
  };

  return (
    <div>
      {/* Finance sub-tabs */}
      <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${T.border}`, marginBottom:20 }}>
        {[["budget","Budget"],["invoices","Invoice Register"],["amendments","Amendment Log"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setFinTab(id)} style={{ padding:"8px 16px", fontSize:12, fontWeight:finTab===id?700:400, color:finTab===id?T.accent:T.textMid, background:"transparent", border:"none", borderBottom:finTab===id?`2px solid ${T.accent}`:"2px solid transparent", cursor:"pointer" }}>{lbl}</button>
        ))}
      </div>

      {/* Budget tab */}
      {finTab==="budget"&&(
        <div>
          <div style={{ ...css.card, marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:14 }}>Budget — Cost per Tonne</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div>
                <label style={css.label}>RM Cost (₹/T)</label>
                <input type="number" value={budget.rmRatePerT||""} disabled={!canEdit}
                  onChange={e=>updBudget("rmRatePerT",+e.target.value)} style={css.input} placeholder="e.g. 55000" />
              </div>
              <div>
                <label style={css.label}>Paint Cost (₹/T) <span style={{fontSize:10,color:T.textLow}}>— typically 7–15% of order rate</span></label>
                <input type="number" value={budget.paintRatePerT||""} disabled={!canEdit}
                  onChange={e=>updBudget("paintRatePerT",+e.target.value)} style={css.input} placeholder="e.g. 8000" />
              </div>
              <div>
                <label style={css.label}>Contractor Cost (₹/T)</label>
                <input type="number" value={budget.contractorRatePerT||""} disabled={!canEdit}
                  onChange={e=>updBudget("contractorRatePerT",+e.target.value)} style={css.input} placeholder="e.g. 12000" />
              </div>
              <div>
                <label style={css.label}>Transport / Outbound (₹/T)</label>
                <input type="number" value={budget.transportRatePerT||""} disabled={!canEdit}
                  onChange={e=>updBudget("transportRatePerT",+e.target.value)} style={css.input} placeholder="e.g. 2000" />
              </div>
            </div>
            {totalBudget>0&&(
              <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:12 }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12 }}>
                  {[
                    ["RM Budget",        rmBudget,         "blue"],
                    ["Paint Budget",      paintBudget,      "amber"],
                    ["Contractor Budget", contractorBudget, "purple"],
                    ["Transport Budget",  transportBudget,  "teal"],
                  ].map(([lbl,val,col])=>(
                    <div key={lbl} style={{ background:T.bgInput, borderRadius:6, padding:"8px 12px" }}>
                      <div style={{ fontSize:10, color:T.textMid, fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>{lbl}</div>
                      <div style={{ fontSize:14, fontWeight:700, color:T.accent }}>{fmt.currency(val)}</div>
                      <div style={{ fontSize:10, color:T.textLow }}>{(order.orderValue||0)>0?Math.round(val/(order.orderValue||1)*100):0}% of order</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                  <div style={{ background:T.bgInput, borderRadius:6, padding:"10px 14px" }}>
                    <div style={{ fontSize:10, color:T.textMid, fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>Total Direct Cost</div>
                    <div style={{ fontSize:16, fontWeight:700, color:T.text }}>{fmt.currency(totalBudget)}</div>
                  </div>
                  <div style={{ background:T.bgInput, borderRadius:6, padding:"10px 14px" }}>
                    <div style={{ fontSize:10, color:T.textMid, fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>Order Value</div>
                    <div style={{ fontSize:16, fontWeight:700, color:T.green }}>{fmt.currency(order.orderValue||0)}</div>
                  </div>
                  <div style={{ background:marginPct>=20?T.greenBg:marginPct>=10?T.amberBg:T.redBg, borderRadius:6, padding:"10px 14px", border:`1px solid ${marginPct>=20?T.green:marginPct>=10?T.amber:T.red}44` }}>
                    <div style={{ fontSize:10, color:T.textMid, fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>Gross Margin Est.</div>
                    <div style={{ fontSize:16, fontWeight:700, color:marginPct>=20?T.green:marginPct>=10?T.amber:T.red }}>{fmt.currency(grossMarginEst)} <span style={{fontSize:12}}>({marginPct}%)</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {totalBudget===0&&canEdit&&(
            <div style={{ ...css.card, background:T.bgInput, textAlign:"center", padding:24, color:T.textLow, fontSize:12 }}>
              Enter cost rates above to see budget breakdown and gross margin estimate.
            </div>
          )}
        </div>
      )}

      {/* Invoice Register tab */}
      {finTab==="invoices"&&(
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
      </div>
      )}
      {/* Amendment Log tab */}
      {finTab==="amendments"&&(
      <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.text }}>Amendment Log</div>
        {canEdit&&<button onClick={()=>{openModal();setModal("add");}} style={css.btn.primary}>+ Log Amendment</button>}
      </div>
      {amds.length===0
        ? <div style={{ ...css.card, textAlign:"center", color:T.textLow, padding:24 }}>No amendments recorded</div>
        : amds.map((a,i)=>(
          <div key={a.id} style={{ ...css.card, marginBottom:8, borderLeft:`3px solid ${T.amber}` }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div>
                <div style={{ display:"flex", gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:11, fontFamily:T.fontMono, color:T.textLow }}>AMD-{String(i+1).padStart(3,"0")}</span>
                  <span style={{ fontSize:11, color:T.textMid }}>{fmt.date(a.date)}</span>
                  <span style={{ fontSize:11, color:T.textMid }}>by {a.changedBy}</span>
                </div>
                <div style={{ fontSize:13, color:T.text, marginBottom:4 }}>
                  <strong>{a.field}</strong>: <span style={{color:T.red}}>{a.oldVal}</span> → <span style={{color:T.green,fontWeight:700}}>{a.newVal}</span>
                </div>
                <div style={{ fontSize:12, color:T.textMid }}>{a.reason}</div>
              </div>
              {a.docLink&&<a href={a.docLink} target="_blank" rel="noreferrer" style={{ ...css.btn.sm, textDecoration:"none", background:T.amberBg, color:T.amber }}>View Doc</a>}
            </div>
          </div>
        ))
      }

      {modal==="add"&&(
        <Modal title="Log Amendment" onClose={()=>{setModal(null);setForm({});}} width={520}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={css.label}>Field to Amend <span style={{color:T.red}}>*</span></label>
              <select value={form.field||""} onChange={e=>onFieldSelect(e.target.value)} style={css.input}>
                <option value="">Select field…</option>
                {AMD_FIELDS.map(f=><option key={f.key} value={f.label}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label style={css.label}>Amendment Date</label>
              <input type="date" value={form.date||today()} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={css.input} />
            </div>
            {form.field&&(
              <>
                <div>
                  <label style={css.label}>Current Value</label>
                  <input value={form.oldVal||""} disabled style={{ ...css.input, opacity:0.7, background:T.bgInput }} />
                </div>
                <div>
                  <label style={css.label}>New Value <span style={{color:T.red}}>*</span></label>
                  {selField?.type==="date"
                    ? <input type="date" value={form.newVal||""} onChange={e=>setForm(p=>({...p,newVal:e.target.value}))} style={css.input} />
                    : selField?.type==="number"
                    ? <input type="number" value={form.newVal||""} onChange={e=>setForm(p=>({...p,newVal:e.target.value}))} style={css.input} />
                    : <input value={form.newVal||""} onChange={e=>setForm(p=>({...p,newVal:e.target.value}))} style={css.input} />
                  }
                </div>
              </>
            )}
            <div style={{ gridColumn:"span 2" }}>
              <label style={css.label}>Reason <span style={{color:T.red}}>*</span></label>
              <textarea value={form.reason||""} onChange={e=>setForm(p=>({...p,reason:e.target.value}))} rows={3}
                placeholder="e.g. Client requested delivery extension — ref email 24 Apr 2026"
                style={{ ...css.input, resize:"vertical" }} />
            </div>
            <div style={{ gridColumn:"span 2" }}>
              <label style={css.label}>Supporting Document (optional)</label>
              <input value={form.docLink||""} onChange={e=>setForm(p=>({...p,docLink:e.target.value}))} style={css.input} placeholder="Drive link…" />
            </div>
          </div>
          <div style={{ padding:"10px 14px", background:T.amberBg, borderRadius:6, border:`1px solid ${T.amber}44`, fontSize:11, color:T.amber, marginBottom:14 }}>
            ⚠ This will update the order field immediately and log the change permanently.
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button onClick={()=>{setModal(null);setForm({});}} style={css.btn.ghost}>Cancel</button>
            <button onClick={saveAmendment} disabled={!form.field||!form.newVal||!form.reason?.trim()}
              style={{ ...css.btn.primary, opacity:(form.field&&form.newVal&&form.reason?.trim())?1:0.45 }}>
              ✓ Save Amendment
            </button>
          </div>
        </Modal>
      )}
      </div>
      )}
    </div>
  );
};
// ─── ORDER PROGRESS TRACKER ───────────────────────────────────────────────────
const OrderProgressTracker = ({ order, onChange, user, pos, stock, nestingBatches, releases, instances, purchaseReqs, onBack, dprs, drawingInstances }) => {
  const [expandedDrg, setExpandedDrg] = useState(null);
  const [progressView, setProgressView] = useState('weight');
  const q = order.quality || {};
  const tpiHolds = new Set(q.tpiHoldPoints || []);
  const paintCoats = getPaintCoats(q);
  const fabDrawings = (order.drawings || []).filter(d => !['purchase','ga'].includes(d.drawingType||''));
  const pm = order.progressMarkers || {};

  const buildStageList = (ord) => {
    const q2 = ord.quality || {};
    const tpi2 = new Set(q2.tpiHoldPoints || []);
    const coats = getPaintCoats(q2);
    const tpiPaint = tpi2.has('painting');
    const paintStageList = (coats.length > 0 ? coats : [{type:'Paint'}]).flatMap((c,i) => {
      const coatLabel = c.type||`Coat ${i+1}`;
      return [
        { key:`paint_coat_${i+1}`,       label:coatLabel,                  calcType:'prod_step_wt',  group:'paint' },
        { key:`tpi_paint_${i+1}_offered`, label:`${coatLabel} TPI Offered`, calcType:'tpi_offered_wt',group:'paint', tpiNA:!tpiPaint, prodStageKey:`paint_coat_${i+1}` },
        { key:`tpi_paint_${i+1}_done`,    label:`${coatLabel} TPI Done`,    calcType:'tpi_done_wt',   group:'paint', tpiNA:!tpiPaint, prodStageKey:`paint_coat_${i+1}` },
      ];
    });
    const stages = [
      { key:'drawings_received',  label:'Drawings Received',    calcType:'drawings_wt',    group:'procurement' },
      { key:'mrp_released',       label:'MRP Released',         calcType:'binary',          group:'procurement' },
      { key:'rm_ordered',         label:'RM Ordered',           calcType:'po_wt',           group:'procurement' },
      { key:'rm_received',        label:'RM Received',          calcType:'lots_wt',         group:'procurement' },
      { key:'cutting_done',       label:'Cutting Done',         calcType:'cutting_wt',      group:'production' },
      { key:'fit_up',             label:'Fit-Up Done',          calcType:'prod_step_wt',    group:'production' },
      { key:'tpi_fitup_offered',  label:'Fit-Up TPI Offered',   calcType:'tpi_offered_wt',  group:'production', tpiNA:!tpi2.has('fit_up'),   prodStageKey:'fit_up' },
      { key:'tpi_fitup_done',     label:'Fit-Up TPI Done',      calcType:'tpi_done_wt',     group:'production', tpiNA:!tpi2.has('fit_up'),   prodStageKey:'fit_up' },
      { key:'welding',            label:'Welding Done',         calcType:'prod_step_wt',    group:'production' },
      { key:'tpi_weld_offered',   label:'Welding TPI Offered',  calcType:'tpi_offered_wt',  group:'production', tpiNA:!tpi2.has('welding'),  prodStageKey:'welding' },
      { key:'tpi_weld_done',      label:'Welding TPI Done',     calcType:'tpi_done_wt',     group:'production', tpiNA:!tpi2.has('welding'),  prodStageKey:'welding' },
      ...(ord.assemblyInspectionRequired ? [{ key:'assembly', label:'Assembly Done', calcType:'prod_step_wt', group:'production' }] : []),
      { key:'blasting',           label:'Blasting Done',        calcType:'prod_step_wt',    group:'production' },
      { key:'tpi_blast_offered',  label:'Blasting TPI Offered', calcType:'tpi_offered_wt',  group:'production', tpiNA:!tpi2.has('blasting'), prodStageKey:'blasting' },
      { key:'tpi_blast_done',     label:'Blasting TPI Done',    calcType:'tpi_done_wt',     group:'production', tpiNA:!tpi2.has('blasting'), prodStageKey:'blasting' },
      ...paintStageList,
      { key:'mdcc_applied',       label:'MDCC Applied',         calcType:'binary',          group:'completion', manual:true },
      { key:'mdcc_received',      label:'MDCC Received',        calcType:'binary',          group:'completion', manual:true },
      { key:'dispatch',           label:'Dispatch',             calcType:'dispatch_wt',     group:'completion' },
    ];
    const groups = [
      { id:'procurement', label:'Procurement', color:T.accent,  stages:stages.filter(s=>s.group==='procurement') },
      { id:'production',  label:'Production',  color:T.textMid, stages:stages.filter(s=>s.group==='production') },
      { id:'paint',       label:'Paint',       color:T.green,   stages:stages.filter(s=>s.group==='paint') },
      { id:'completion',  label:'Completion',  color:T.amber,   stages:stages.filter(s=>s.group==='completion') },
    ];
    return { stages, stageGroups: groups };
  };
  const { stages: allStageList, stageGroups } = buildStageList(order);

  // Pre-computed context for weight calculations
  const totalOrderKg = (order.orderUnit==='Ton'||order.orderUnit==='MT') ? (order.orderQty||0)*1000 : (order.orderQty||0);
  const drawingsTotalWt = fabDrawings.reduce((s,d)=>s+(d.totalWt||0),0);
  const effectiveTotalKg = drawingsTotalWt || totalOrderKg || 1;
  const drgPartsMap = new Map();
  (order.parts||[]).forEach(p=>{ if(!drgPartsMap.has(p.drawingId)) drgPartsMap.set(p.drawingId,[]); drgPartsMap.get(p.drawingId).push(p); });
  const orderMarkNosSet = new Set((order.parts||[]).map(p=>p.markNo));
  const batchesForOrder = (nestingBatches||[]).filter(b=>(b.lots||[]).some(l=>(l.parts||[]).some(mn=>orderMarkNosSet.has(mn))));
  const mrpDrawingWt = fabDrawings.filter(d=>(drgPartsMap.get(d.id)||[]).some(p=>batchesForOrder.some(b=>(b.lots||[]).some(l=>(l.parts||[]).includes(p.markNo))))).reduce((s,d)=>s+(d.totalWt||0),0);
  const mrpReleasedOk = mrpDrawingWt >= effectiveTotalKg || !!pm.mrp_done;
  const orderPos = (pos||[]).filter(p=>p.orderRef===order.id||p.orderId===order.id||(p.coveredOrders||[]).includes(order.id)||(p.servedOrders||[]).includes(order.id));
  const orderPoIds = new Set(orderPos.map(p=>p.id));
  const convertedPrBatchIds = new Set((purchaseReqs||[]).filter(pr=>pr.nestingBatchId&&pr.status==='converted').map(pr=>pr.nestingBatchId));
  const batchesWithConvertedPo = batchesForOrder.filter(b=>convertedPrBatchIds.has(b.id));
  const orderedDrawings = fabDrawings.filter(d=>(drgPartsMap.get(d.id)||[]).some(p=>batchesWithConvertedPo.some(b=>(b.lots||[]).some(l=>(l.parts||[]).includes(p.markNo)))));
  const poKg = orderedDrawings.reduce((s,d)=>s+(d.totalWt||0),0);
  const poDrawingCount = orderedDrawings.length;
  const orderMatCodes = new Set(
    (order.parts||[]).filter(p=>p.fabType==="Fabricate"&&p.source?.toLowerCase()==="procure")
      .map(p=>normMatCode(p.matCode))
  );
  const orderLots = (stock||[]).filter(l=>
    !['rejected','returned','written_off'].includes(l.status) && !l.isOffcut &&
    (
      (l.reservations||[]).some(r=>r.orderId===order.id) ||
      orderPoIds.has(l.poId) ||
      (l.wtReceived>0 && orderMatCodes.has(normMatCode(l.matCode)))
    )
  );
  const receivedKg = orderLots.reduce((s,l)=>s+(l.wtReceived||0),0);
  // Build set of matCodes available in received lots
  const receivedMatCodes=new Set(orderLots.map(l=>normMatCode(l.matCode)));
  // A drawing is "received" if ALL its fabricate parts' matCodes have stock received
  // OR if it has a reservation linking it to this order
  const receivedDrawings = fabDrawings.filter(d=>{
    // First try reservation link
    if(orderLots.some(l=>(l.reservations||[]).some(r=>r.orderId===order.id&&(!r.drawingId||r.drawingId===d.id)))) return true;
    // Fall back — drawing is received if its parts' matCodes are all in received stock
    const drgParts=(drgPartsMap.get(d.id)||drgPartsMap.get(d.drawingNo)||[]).filter(p=>p.fabType==="Fabricate"&&p.source?.toLowerCase()==="procure");
    if(drgParts.length===0) return false;
    const drgMatCodes=new Set(drgParts.map(p=>normMatCode(p.matCode)));
    return [...drgMatCodes].every(mc=>receivedMatCodes.has(mc));
  });
  const receivedDrawingKg = receivedDrawings.reduce((s,d)=>s+(d.totalWt||0),0);
  const receivedDrawingCount = receivedDrawings.length;
  const drawingsReceivedKg = fabDrawings.filter(d=>d.receivedDate).reduce((s,d)=>s+(d.totalWt||0),0);
  const PAST_CUTTING = new Set(['fitup','tpi_fitup','welding','tpi_weld','assembly','blasting','tpi_blast','painting','tpi_paint','mdcc','dispatch','complete']);
  const cuttingDoneKg = fabDrawings.filter(d=>(instances||[]).some(inst=>inst.drawingId===d.id&&inst.orderId===order.id&&PAST_CUTTING.has(inst.currentStage))).reduce((s,d)=>s+(d.totalWt||0),0);
  const DISPATCH_STAGES = new Set(['dispatch','complete','dispatched']);
  const dispatchKg = fabDrawings.filter(d=>(instances||[]).some(inst=>inst.drawingId===d.id&&inst.orderId===order.id&&DISPATCH_STAGES.has(inst.currentStage))).reduce((s,d)=>s+(d.totalWt||0),0);

  const calcWeightProgress = (stage) => {
    if (stage.tpiNA) return { tpiNA:true, pct:0, status:'na' };
    const { key, calcType } = stage;
    if (calcType==='drawings_wt') { const pct=effectiveTotalKg>0?Math.min(100,Math.round(drawingsReceivedKg/effectiveTotalKg*100)):0; return {doneKg:drawingsReceivedKg,totalKg:effectiveTotalKg,pct,status:pct===0?'not_started':pct>=100?'completed':'in_progress'}; }
    if (calcType==='binary') {
      if (key==='mrp_released') {
        const pct=effectiveTotalKg>0?Math.min(100,Math.round(mrpDrawingWt/effectiveTotalKg*100)):0;
        const mrpDrawingCount=fabDrawings.filter(d=>(drgPartsMap.get(d.id)||[]).some(p=>batchesForOrder.some(b=>(b.lots||[]).some(l=>(l.parts||[]).includes(p.markNo))))).length;
        return {doneKg:mrpDrawingWt,totalKg:effectiveTotalKg,pct,drawingCount:mrpDrawingCount,totalDrawings:fabDrawings.length,status:pct===0?'not_started':pct>=100?'completed':'in_progress'};
      }
      const ok=key==='mdcc_applied'?!!pm.mdcc_applied:key==='mdcc_received'?!!pm.mdcc_received:false;
      return {doneKg:ok?effectiveTotalKg:0,totalKg:effectiveTotalKg,pct:ok?100:0,status:ok?'completed':'not_started'};
    }
    if (calcType==='po_wt') { const pct=effectiveTotalKg>0?Math.min(100,Math.round(poKg/effectiveTotalKg*100)):0; return {doneKg:poKg,totalKg:effectiveTotalKg,pct,drawingCount:poDrawingCount,totalDrawings:fabDrawings.length,status:pct===0?'not_started':pct>=100?'completed':'in_progress'}; }
    if (calcType==='lots_wt') { const pct=effectiveTotalKg>0?Math.min(100,Math.round(receivedDrawingKg/effectiveTotalKg*100)):0; return {doneKg:receivedDrawingKg,totalKg:effectiveTotalKg,pct,drawingCount:receivedDrawingCount,totalDrawings:fabDrawings.length,status:pct===0?'not_started':pct>=100?'completed':'in_progress'}; }
    if (calcType==='cutting_wt') { const pct=effectiveTotalKg>0?Math.min(100,Math.round(cuttingDoneKg/effectiveTotalKg*100)):0; return {doneKg:cuttingDoneKg,totalKg:effectiveTotalKg,pct,status:pct===0?'not_started':pct>=100?'completed':'in_progress'}; }
    if (calcType==='prod_step_wt') {
      // fit_up and welding are tracked at DPR level — use DPR stages
      if (key === 'fit_up') {
        const orderDprs = (dprs||[]).filter(d => d.orderId === order.id);
        const doneKg2 = fabDrawings.filter(d => {
          const dpr = orderDprs.find(dp => dp.drawingId === d.id);
          return dpr && ['welding','weld_qc','tpi_weld','complete'].includes(dpr.currentStage);
        }).reduce((s,d) => s+(d.totalWt||0), 0);
        const inProgKg = fabDrawings.filter(d => {
          const dpr = orderDprs.find(dp => dp.drawingId === d.id);
          return dpr && dpr.currentStage === 'fitup';
        }).reduce((s,d) => s+(d.totalWt||0), 0);
        const pct = effectiveTotalKg>0 ? Math.min(100,Math.round(doneKg2/effectiveTotalKg*100)) : 0;
        return {doneKg:doneKg2,totalKg:effectiveTotalKg,pct,status:pct>=100?'completed':doneKg2>0||inProgKg>0?'in_progress':'not_started'};
      }
      if (key === 'welding') {
        const orderDprs = (dprs||[]).filter(d => d.orderId === order.id);
        const doneKg2 = fabDrawings.filter(d => {
          const dpr = orderDprs.find(dp => dp.drawingId === d.id);
          return dpr && ['weld_qc','tpi_weld','complete'].includes(dpr.currentStage);
        }).reduce((s,d) => s+(d.totalWt||0), 0);
        const inProgKg = fabDrawings.filter(d => {
          const dpr = orderDprs.find(dp => dp.drawingId === d.id);
          return dpr && dpr.currentStage === 'welding';
        }).reduce((s,d) => s+(d.totalWt||0), 0);
        const pct = effectiveTotalKg>0 ? Math.min(100,Math.round(doneKg2/effectiveTotalKg*100)) : 0;
        return {doneKg:doneKg2,totalKg:effectiveTotalKg,pct,status:pct>=100?'completed':doneKg2>0||inProgKg>0?'in_progress':'not_started'};
      }
      const doneKg2=fabDrawings.filter(d=>(d.productionSteps||[]).find(s=>s.stage===key)?.status==='completed').reduce((s,d)=>s+(d.totalWt||0),0);
      const inProgKg=fabDrawings.filter(d=>(d.productionSteps||[]).find(s=>s.stage===key)?.status==='in_progress').reduce((s,d)=>s+(d.totalWt||0),0);
      const pct=effectiveTotalKg>0?Math.min(100,Math.round(doneKg2/effectiveTotalKg*100)):0;
      return {doneKg:doneKg2,totalKg:effectiveTotalKg,pct,status:pct>=100?'completed':doneKg2>0||inProgKg>0?'in_progress':'not_started'};
    }
    if (calcType==='tpi_offered_wt') {
      const doneKg2=fabDrawings.filter(d=>(d.productionSteps||[]).find(s=>s.stage===stage.prodStageKey)?.tpiOfferedAt).reduce((s,d)=>s+(d.totalWt||0),0);
      const pct=effectiveTotalKg>0?Math.min(100,Math.round(doneKg2/effectiveTotalKg*100)):0;
      return {doneKg:doneKg2,totalKg:effectiveTotalKg,pct,status:pct===0?'not_started':pct>=100?'completed':'in_progress'};
    }
    if (calcType==='tpi_done_wt') {
      const doneKg2=fabDrawings.filter(d=>(d.productionSteps||[]).find(s=>s.stage===stage.prodStageKey)?.tpiDoneAt).reduce((s,d)=>s+(d.totalWt||0),0);
      const pct=effectiveTotalKg>0?Math.min(100,Math.round(doneKg2/effectiveTotalKg*100)):0;
      return {doneKg:doneKg2,totalKg:effectiveTotalKg,pct,status:pct>=100?'completed':doneKg2>0?'in_progress':'not_started'};
    }
    if (calcType==='dispatch_wt') { const pct=effectiveTotalKg>0?Math.min(100,Math.round(dispatchKg/effectiveTotalKg*100)):0; return {doneKg:dispatchKg,totalKg:effectiveTotalKg,pct,status:pct===0?'not_started':pct>=100?'completed':'in_progress'}; }
    return {doneKg:0,totalKg:effectiveTotalKg,pct:0,status:'not_started'};
  };

  const calcDrawingProgress = (stage) => {
    if (stage.tpiNA) return { tpiNA:true, pct:0, status:'na' };
    const { key, calcType } = stage;
    const total = fabDrawings.length;
    if (calcType==='drawings_wt') { const done2=fabDrawings.filter(d=>d.receivedDate).length; const pct=total>0?Math.round(done2/total*100):0; return {done:done2,total,pct,status:done2===0?'not_started':done2===total?'completed':'in_progress'}; }
    if (calcType==='binary') {
      const ok=key==='mrp_released'?mrpReleasedOk:key==='mdcc_applied'?!!pm.mdcc_applied:key==='mdcc_received'?!!pm.mdcc_received:false;
      return {done:ok?total:0,total,pct:ok?100:0,status:ok?'completed':'not_started'};
    }
    if (calcType==='po_wt') { const ok=orderPos.length>0; return {done:ok?total:0,total,pct:ok?100:0,status:ok?'completed':'not_started'}; }
    if (calcType==='lots_wt') { const done2=orderLots.length>0?Math.round(total*orderLots.filter(l=>l.rmQcStatus).length/Math.max(orderLots.length,1)):0; const pct=total>0?Math.round(done2/total*100):0; return {done:done2,total,pct,status:done2===0?'not_started':done2===total?'completed':'in_progress'}; }
    if (calcType==='cutting_wt') { const done2=fabDrawings.filter(d=>(instances||[]).some(inst=>inst.drawingId===d.id&&inst.orderId===order.id&&PAST_CUTTING.has(inst.currentStage))).length; const pct=total>0?Math.round(done2/total*100):0; return {done:done2,total,pct,status:done2===0?'not_started':done2===total?'completed':'in_progress'}; }
    if (calcType==='prod_step_wt') {
      // fit_up and welding tracked at DPR level
      if (key === 'fit_up') {
        const orderDprs = (dprs||[]).filter(d => d.orderId === order.id);
        const done2 = fabDrawings.filter(d => {
          const dpr = orderDprs.find(dp => dp.drawingId === d.id);
          return dpr && ['welding','weld_qc','tpi_weld','complete'].includes(dpr.currentStage);
        }).length;
        const inProg = fabDrawings.filter(d => {
          const dpr = orderDprs.find(dp => dp.drawingId === d.id);
          return dpr && dpr.currentStage === 'fitup';
        }).length;
        const pct=total>0?Math.round(done2/total*100):0;
        return {done:done2,total,pct,status:done2===0&&inProg===0?'not_started':done2===total?'completed':'in_progress'};
      }
      if (key === 'welding') {
        const orderDprs = (dprs||[]).filter(d => d.orderId === order.id);
        const done2 = fabDrawings.filter(d => {
          const dpr = orderDprs.find(dp => dp.drawingId === d.id);
          return dpr && ['weld_qc','tpi_weld','complete'].includes(dpr.currentStage);
        }).length;
        const inProg = fabDrawings.filter(d => {
          const dpr = orderDprs.find(dp => dp.drawingId === d.id);
          return dpr && dpr.currentStage === 'welding';
        }).length;
        const pct=total>0?Math.round(done2/total*100):0;
        return {done:done2,total,pct,status:done2===0&&inProg===0?'not_started':done2===total?'completed':'in_progress'};
      }
      const done2=fabDrawings.filter(d=>(d.productionSteps||[]).find(s=>s.stage===key)?.status==='completed').length; const inProg=fabDrawings.filter(d=>(d.productionSteps||[]).find(s=>s.stage===key)?.status==='in_progress').length; const pct=total>0?Math.round(done2/total*100):0; return {done:done2,total,pct,status:done2===0&&inProg===0?'not_started':done2===total?'completed':'in_progress'};
    }
    if (calcType==='tpi_offered_wt') { const done2=fabDrawings.filter(d=>(d.productionSteps||[]).find(s=>s.stage===stage.prodStageKey)?.tpiOfferedAt).length; const pct=total>0?Math.round(done2/total*100):0; return {done:done2,total,pct,status:done2===0?'not_started':done2===total?'completed':'in_progress'}; }
    if (calcType==='tpi_done_wt') { const done2=fabDrawings.filter(d=>(d.productionSteps||[]).find(s=>s.stage===stage.prodStageKey)?.tpiDoneAt).length; const pct=total>0?Math.round(done2/total*100):0; return {done:done2,total,pct,status:done2===0?'not_started':done2===total?'completed':'in_progress'}; }
    if (calcType==='dispatch_wt') { const done2=fabDrawings.filter(d=>(instances||[]).some(inst=>inst.drawingId===d.id&&inst.orderId===order.id&&DISPATCH_STAGES.has(inst.currentStage))).length; const pct=total>0?Math.round(done2/total*100):0; return {done:done2,total,pct,status:done2===0?'not_started':done2===total?'completed':'in_progress'}; }
    return {done:0,total,pct:0,status:'not_started'};
  };

  const activeStages = allStageList.filter(s=>!s.tpiNA);
  const lastPaintTpiDoneStage = allStageList.filter(s=>s.group==='paint'&&s.calcType==='tpi_done_wt'&&!s.tpiNA).pop();
  const lastPaintCoatStage = allStageList.filter(s=>s.group==='paint'&&s.calcType==='prod_step_wt').pop();
  const overallRefStage = lastPaintTpiDoneStage || lastPaintCoatStage;
  const overallPct = overallRefStage
    ? calcWeightProgress(overallRefStage).pct
    : Math.round(activeStages.filter(s=>calcWeightProgress(s).status==='completed').length/Math.max(activeStages.length,1)*100);

  const endDate = order.endDate ? new Date(order.endDate) : null;
  const daysToEnd = endDate ? Math.floor((endDate-Date.now())/86400000) : null;
  const trackStatus = !endDate?'on_track':daysToEnd<0?'delayed':daysToEnd<14&&overallPct<60?'at_risk':'on_track';
  const trackColor = {on_track:T.green,at_risk:T.amber,delayed:T.red}[trackStatus];
  const trackLabel = {on_track:'On Track',at_risk:'At Risk',delayed:'Delayed'}[trackStatus];

  const tpiAlerts = fabDrawings.flatMap(d=>
    (d.productionSteps||[])
      .filter(s=>s.tpiRequired&&s.tpiOfferedAt&&!s.tpiDoneAt)
      .map(s=>({drawingNo:d.drawingNo,stage:s.stage,days:Math.floor((Date.now()-new Date(s.tpiOfferedAt))/86400000)}))
      .filter(a=>a.days>=5)
  );

  const canEditMarkers = ["super_admin","planning_admin"].includes(user?.role||"");
  const toggleMarker = (key) => {
    if (!canEditMarkers||!onChange) return;
    const newVal = pm[key] ? null : {at:new Date().toISOString(), by:user?.id||"", byName:user?.name||""};
    onChange({...order, progressMarkers:{...pm,[key]:newVal}});
  };

  const handleExport = () => {
    const calcFn = progressView==='weight' ? calcWeightProgress : calcDrawingProgress;
    const rows=stageGroups.map(g=>`<h3>${g.label}</h3><table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;font-size:13px"><tr><th>Stage</th><th>Done</th><th>Total</th><th>%</th><th>Status</th></tr>${g.stages.map(s=>{const p=calcFn(s);const done=progressView==='weight'?((p.doneKg||0)/1000).toFixed(2)+'T':p.done;const tot=progressView==='weight'?((p.totalKg||0)/1000).toFixed(2)+'T':p.total;return `<tr><td>${s.label}</td><td>${done}</td><td>${tot}</td><td>${p.pct}%</td><td>${p.status.replace(/_/g,' ')}</td></tr>`;}).join('')}</table>`).join('');
    const html=`<!DOCTYPE html><html><head><title>Progress — ${order.id}</title><style>body{font-family:sans-serif;padding:32px}h2{margin-bottom:4px}p{margin:0 0 16px;color:#666}h3{margin:24px 0 8px}th{background:#f5f5f5}</style></head><body><h2>Order Progress — ${order.id}</h2><p>${order.projectDesc||''} | ${order.clientId||''} | Overall: ${overallPct}% | <strong>${trackLabel}</strong></p>${rows}</body></html>`;
    const w=window.open('','_blank'); if(w){w.document.write(html);w.document.close();}
  };

  return (
    <div>
      {onBack&&<div style={{display:"flex",gap:8,alignItems:"center",marginBottom:20}}><button onClick={onBack} style={{...css.btn.ghost,color:T.accent}}>← Back</button><div style={{fontSize:18,fontWeight:800,color:T.text}}>Order Progress — {order.id}</div></div>}

      {/* Summary header */}
      <div style={{...css.card,display:"flex",gap:20,alignItems:"center",marginBottom:16,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:200}}>
          <div style={{fontSize:12,color:T.textMid,marginBottom:6}}>{order.projectDesc}</div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:32,fontWeight:800,color:T.text,fontFamily:T.fontMono}}>{overallPct}%</div>
            <div>
              <Badge color={trackStatus==='on_track'?'green':trackStatus==='at_risk'?'amber':'red'}>{trackLabel}</Badge>
              {daysToEnd!==null&&<div style={{fontSize:11,color:T.textMid,marginTop:3}}>{daysToEnd<0?`${-daysToEnd}d overdue`:`${daysToEnd}d remaining`}</div>}
            </div>
          </div>
          <div style={{marginTop:8,background:T.bgInput,borderRadius:4,height:6,overflow:"hidden"}}>
            <div style={{width:`${overallPct}%`,height:"100%",background:trackColor,borderRadius:4,transition:"width 0.3s"}}/>
          </div>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          {[{v:fabDrawings.length,l:"DRAWINGS",c:T.accent},{v:`${(effectiveTotalKg/1000).toFixed(2)}T`,l:"TOTAL WEIGHT",c:T.text},{v:`${activeStages.filter(s=>calcWeightProgress(s).status==='completed').length}/${activeStages.length}`,l:"STAGES DONE",c:T.green}].map(x=>(
            <div key={x.l} style={{textAlign:"center",padding:"8px 14px",background:T.bgInput,borderRadius:6}}>
              <div style={{fontSize:20,fontWeight:800,color:x.c,fontFamily:T.fontMono}}>{x.v}</div>
              <div style={{fontSize:10,color:T.textMid,fontWeight:600}}>{x.l}</div>
            </div>
          ))}
          <button onClick={handleExport} style={css.btn.ghost}>↗ Export</button>
        </div>
      </div>

      {/* View toggle */}
      <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:6,marginBottom:12}}>
        <span style={{fontSize:11,color:T.textMid}}>View:</span>
        {[{v:'weight',l:'Weight %'},{v:'drawing',l:'Drawing Count'}].map(opt=>(
          <button key={opt.v} onClick={()=>setProgressView(opt.v)} style={{...css.btn.ghost,fontSize:11,padding:"3px 10px",background:progressView===opt.v?T.accent:'transparent',color:progressView===opt.v?'#fff':T.textMid,border:`1px solid ${progressView===opt.v?T.accent:T.border}`}}>{opt.l}</button>
        ))}
      </div>

      {/* TPI alerts */}
      {tpiAlerts.length>0&&(
        <div style={{...css.card,border:`1px solid ${T.red}55`,marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:800,color:T.red,marginBottom:8}}>⏸ TPI WAIT ALERTS ({tpiAlerts.length})</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {tpiAlerts.map((a,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 10px",background:T.redBg,borderRadius:4,fontSize:12}}>
                <span><strong>{a.drawingNo}</strong> — {a.stage.replace(/_/g,' ')}</span>
                <Badge color="red">{a.days}d waiting</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stage groups */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {stageGroups.map(group=>(
          <div key={group.id} style={css.card}>
            <div style={{fontSize:11,fontWeight:800,color:group.color,marginBottom:10,letterSpacing:"0.08em"}}>{group.label.toUpperCase()}</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {group.stages.map(stage=>{
                if (stage.tpiNA) return (
                  <div key={stage.key} style={{display:"flex",alignItems:"center",gap:8,padding:"2px 0",opacity:0.45}}>
                    <span style={{fontSize:13,width:26}}>➖</span>
                    <span style={{fontSize:12,color:T.textLow,fontStyle:'italic'}}>{stage.label} — N/A (TPI not required)</span>
                  </div>
                );
                const p = progressView==='weight' ? calcWeightProgress(stage) : calcDrawingProgress(stage);
                const sc = p.status==='completed'?T.green:p.status==='in_progress'?T.accent:T.textLow;
                const icon = p.status==='completed'?'✅':p.status==='in_progress'?'⚡':'⏳';
                const subtext = progressView==='weight'
                  ? (p.doneKg>=0 ? `${(p.doneKg/1000).toFixed(2)}T / ${(p.totalKg/1000).toFixed(2)}T` : '')
                  : (p.total>0 ? `${p.done} / ${p.total} drawings` : '');
                return (
                  <div key={stage.key} style={{display:"grid",gridTemplateColumns:"26px 1fr 80px 48px",alignItems:"center",gap:8}}>
                    <span style={{fontSize:13}}>{icon}</span>
                    <div style={{display:"flex",flexDirection:"column",gap:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                        <span style={{fontSize:13,color:T.text}}>{stage.label}</span>
                        {stage.manual&&canEditMarkers&&onChange&&(
                          <button onClick={()=>toggleMarker(stage.key)} style={{...css.btn.ghost,fontSize:10,padding:"1px 6px",color:p.status==='completed'?T.green:T.textMid}}>
                            {p.status==='completed'?'✓ Done':'Mark Done'}
                          </button>
                        )}
                        {stage.manual&&p.status==='completed'&&pm[stage.key]&&(!canEditMarkers||!onChange)&&(
                          <span style={{fontSize:10,color:T.green}}>✓ {pm[stage.key]?.byName||'Done'}</span>
                        )}
                      </div>
                      {subtext&&<div style={{fontSize:10,color:T.textMid,fontFamily:T.fontMono}}>{subtext}</div>}
                    </div>
                    <div style={{background:T.bgInput,borderRadius:3,height:5,overflow:"hidden"}}>
                      <div style={{width:`${p.pct}%`,height:"100%",background:sc,transition:"width 0.3s"}}/>
                    </div>
                    <div style={{textAlign:"right",fontFamily:T.fontMono,fontSize:12,color:sc,fontWeight:700}}>{p.pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Per-drawing drill-down */}
      {fabDrawings.length>0&&(
        <div style={{...css.card,marginTop:14}}>
          <div style={{fontSize:11,fontWeight:800,color:T.textMid,marginBottom:10,letterSpacing:"0.08em"}}>DRAWING DRILL-DOWN</div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {fabDrawings.map(d=>{
              const steps=d.productionSteps||[];
              const doneSteps=steps.filter(s=>s.status==='completed').length;
              const drgPct=steps.length>0?Math.round(doneSteps/steps.length*100):0;
              const isExp=expandedDrg===d.id;
              return (
                <div key={d.id}>
                  <div onClick={()=>setExpandedDrg(isExp?null:d.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",background:isExp?`${T.accent}14`:T.bgInput,borderRadius:6,cursor:"pointer"}}>
                    <span style={{fontSize:10,color:T.textLow,width:10}}>{isExp?'▼':'▶'}</span>
                    <span style={{fontFamily:T.fontMono,fontWeight:700,color:T.accentHi,fontSize:12,minWidth:110}}>{d.drawingNo}</span>
                    <div style={{flex:1,background:T.border,borderRadius:3,height:4,overflow:"hidden"}}>
                      <div style={{width:`${drgPct}%`,height:"100%",background:drgPct===100?T.green:T.accent}}/>
                    </div>
                    <span style={{fontFamily:T.fontMono,fontSize:11,color:T.textMid,minWidth:32,textAlign:"right"}}>{drgPct}%</span>
                    <span style={{fontSize:10,color:T.textMid,minWidth:60,textAlign:"right"}}>{doneSteps}/{steps.length} stages</span>
                  </div>
                  {isExp&&(
                    <div style={{padding:"10px 14px 10px 36px",background:`${T.accent}08`,borderRadius:"0 0 6px 6px",marginTop:2}}>
                      {steps.length===0?(
                        <div style={{fontSize:11,color:T.textLow}}>No production steps configured yet.</div>
                      ):(
                        <div style={{display:"flex",flexDirection:"column",gap:5}}>
                          {steps.map(s=>{
                            const sc=s.status==='completed'?T.green:s.status==='in_progress'?T.accent:T.textLow;
                            const tpiWaitDays=s.tpiRequired&&s.tpiOfferedAt&&!s.tpiDoneAt?Math.floor((Date.now()-new Date(s.tpiOfferedAt))/86400000):0;
                            return (
                              <div key={s.stage} style={{display:"flex",alignItems:"center",gap:8,fontSize:12}}>
                                <span style={{color:sc,fontWeight:700,width:16}}>{s.status==='completed'?'✓':s.status==='in_progress'?'⬤':'○'}</span>
                                <span style={{color:T.text,flex:1}}>{s.stage.replace(/_/g,' ')}</span>
                                {s.tpiRequired&&<span style={{fontSize:10,color:T.amber,fontWeight:600}}>TPI</span>}
                                {s.completedAt&&<span style={{fontSize:10,color:T.textMid}}>{fmt.date(s.completedAt)}</span>}
                                {tpiWaitDays>0&&<Badge color="red">{tpiWaitDays}d TPI wait</Badge>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── TAB INSTANCES — top-level component to avoid useState-in-IIFE error ────
const STAGE_SEQ_LABELS = { cutting:"Cutting", fitup:"Fit-Up", fit_up:"Fit-Up", welding:"Welding", tpi_weld:"TPI Weld", assembly:"Assembly", blasting:"Blasting", painting:"Painting", tpi_paint:"TPI Paint", mdcc:"MDCC", dispatch:"Dispatch" };
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
  const revertCollect = id => upd(id, { currentStatus:"pending_collection", collectedAt:null });
  const complete = id => upd(id, { currentStatus:"pending_supervisor", stageCompletedAt:today() });

  const rowStyle = { padding:"10px 14px", borderBottom:`1px solid ${T.border}`, display:"grid",
    gridTemplateColumns:"1fr 1fr 1fr auto", gap:8, alignItems:"center", fontSize:13 };

  const section = (title, color, items, action, revertAction) => items.length === 0 ? null : (
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
          <div style={{display:"flex",gap:6}}>
            {action && <button onClick={()=>action(i.id)} style={{ ...css.btn.sm, background:T.accentLo, color:T.accent, border:`1px solid ${T.accent}` }}>{action===collect?"Collect":"Complete"}</button>}
            {revertAction && <button onClick={()=>revertAction(i.id)} style={{ ...css.btn.sm, background:T.amberBg, color:T.amber, border:`1px solid ${T.amber}` }}>↩ Undo</button>}
          </div>
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
        {section(`In Progress`, "accent", inProg, complete, revertCollect)}
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
const ContractorWorkQueue = ({ user, instances, setInstances, releases, stock, orders, nestingBatches, dprs, setDprs, correctionsLog, setCorrectionsLog, notifications, setNotifications }) => {
  const [tab,    setTab]    = useState("collect");   // "collect" | "fitup" | "welding" | "complete"
  const [selDpr, setSelDpr] = useState(null);
  const [collectModal, setCollectModal] = useState(null); // dpr being collected
  const [collectForm,  setCollectForm]  = useState({});
  const [cqCorrModal, setCqCorrModal] = useState(null); // {dpr, type}
  const [cqCorrForm,  setCqCorrForm]  = useState({});

  // ── Contractor Queue Correction Handlers ────────────────────────────────

  const doRevertCollection = (dpr, reason) => {
    if (!reason?.trim()) return showToast("Reason required","amber");
    setDprs(prev=>prev.map(d=>d.id!==dpr.id?d:{
      ...d, collected:false, collectedAt:null, collectedBy:null,
      auditLog:[...(d.auditLog||[]),{action:"collection-reverted",by:user.name,date:today(),reason}]
    }));
    if(setCorrectionsLog) setCorrectionsLog(prev=>[...prev, createCorrectionEntry({
      action:"revert-collection", entityId:dpr.id, entityType:"dpr",
      fromValue:{collected:true}, toValue:{collected:false}, reason, triggeredBy:user
    })]);
    showToast("Collection mark reverted"); setCqCorrModal(null);
  };

  const doRevertWeldingComplete = (dpr, reason) => {
    if (!reason?.trim()) return showToast("Reason required","amber");
    // Block if welding QC already passed
    const weldQcPassed = (dpr.stageHistory||[]).some(h=>h.stage==="welding_qc"&&h.action==="approved");
    if (weldQcPassed) return showToast("Cannot revert — welding QC already approved. Use NCR route.","amber");
    setDprs(prev=>prev.map(d=>d.id!==dpr.id?d:{
      ...d, currentStage:"welding", currentStatus:"in_progress",
      weldingCompletedAt:null, weldingCompletedBy:null,
      auditLog:[...(d.auditLog||[]),{action:"welding-complete-reverted",by:user.name,date:today(),reason}]
    }));
    if(setCorrectionsLog) setCorrectionsLog(prev=>[...prev, createCorrectionEntry({
      action:"revert-welding-complete", entityId:dpr.id, entityType:"dpr",
      fromValue:{stage:"welding_complete"}, toValue:{stage:"welding",status:"in_progress"}, reason, triggeredBy:user
    })]);
    showToast("Welding complete mark reverted"); setCqCorrModal(null);
  };

  const doEditWelderId = (dpr, newWelderId, newWelderName, reason) => {
    if (!reason?.trim()) return showToast("Reason required","amber");
    if (!newWelderId) return showToast("Select a welder","amber");
    setDprs(prev=>prev.map(d=>d.id!==dpr.id?d:{
      ...d, welderId:newWelderId, welderName:newWelderName,
      auditLog:[...(d.auditLog||[]),{action:"welder-id-changed",by:user.name,date:today(),
        reason:`Changed from ${dpr.welderName||"—"} to ${newWelderName} — ${reason}`}]
    }));
    if(setCorrectionsLog) setCorrectionsLog(prev=>[...prev, createCorrectionEntry({
      action:"edit-welder-id", entityId:dpr.id, entityType:"dpr",
      fromValue:{welderId:dpr.welderId,welderName:dpr.welderName},
      toValue:{welderId:newWelderId,welderName:newWelderName}, reason, triggeredBy:user
    })]);
    showToast("Welder ID updated"); setCqCorrModal(null);
  };

  const doReassignContractor = (dpr, newContractorId, newContractorName, reason) => {
    if (!reason?.trim()) return showToast("Reason required — note any partial work done by previous contractor","amber");
    if (!newContractorId) return showToast("Select a contractor","amber");
    const prevContractor = dpr.weldContractorName||dpr.fitupContractorName||"—";
    const stage = dpr.currentStage;
    const isWeld = stage==="welding"||stage==="welding_qc";
    setDprs(prev=>prev.map(d=>d.id!==dpr.id?d:{
      ...d,
      ...(isWeld?{weldContractorId:newContractorId,weldContractorName:newContractorName}:{fitupContractorId:newContractorId,fitupContractorName:newContractorName}),
      auditLog:[...(d.auditLog||[]),{action:"contractor-reassigned",by:user.name,date:today(),
        reason:`Reassigned from ${prevContractor} to ${newContractorName} — ${reason}`}]
    }));
    if(setCorrectionsLog) setCorrectionsLog(prev=>[...prev, createCorrectionEntry({
      action:"reassign-contractor", entityId:dpr.id, entityType:"dpr",
      fromValue:{contractor:prevContractor}, toValue:{contractor:newContractorName}, reason, triggeredBy:user
    })]);
    if(setNotifications) setNotifications(prev=>[...prev, createNotification({
      type:"correction", message:`${dpr.drawingNo} reassigned from ${prevContractor} to ${newContractorName} — ${reason}`,
      forRoles:["contractor","production_admin","production_engineer"], entityId:dpr.id, orderId:dpr.orderId, raisedBy:user.name
    })]);
    showToast(`Contractor reassigned to ${newContractorName}`); setCqCorrModal(null);
  };
  const [showAsm, setShowAsm] = useState(false);
  const cid = user.contractorId;

  const myDprs = (dprs||[]).filter(d =>
    d.fitupContractorId === cid || d.weldContractorId === cid
  );

  const updDpr = (dprId, patch) =>
    setDprs(prev => prev.map(d => d.id === dprId ? { ...d, ...patch } : d));

  const advanceDrawingInstances = (dpr, toStage, toStatus = "in_progress") => {
    setInstances(prev => prev.map(i => {
      if (i.drawingId !== dpr.drawingId || i.orderId !== dpr.orderId || i.isSideCut) return i;
      return { ...i, currentStage: toStage, currentStatus: toStatus,
        stageHistory: [...(i.stageHistory||[]), {
          stage: i.currentStage, completedAt: new Date().toISOString(), completedBy: user.username
        }]
      };
    }));
  };

  // Get best (most advanced) stage per markNo across ALL instances
  // Fixes the case where a part was cut in a previous release on a shared sheet
  const STAGE_ORDER_BEST = ['complete','tpi_paint','paint_qc','painting','tpi_blast','blast_qc','blasting','tpi_weld','weld_qc','welding','tpi_fitup','fitup','fit_up','cutting_qc','cutting','pending'];
  const getBestStagePerMarkNo = (markNos) => {
    const best = {};
    const markNoSet = new Set(markNos);
    (instances||[]).filter(i => markNoSet.has(i.markNo)).forEach(i => {
      const curr = best[i.markNo];
      if (!curr || STAGE_ORDER_BEST.indexOf(i.currentStage) < STAGE_ORDER_BEST.indexOf(curr)) {
        best[i.markNo] = i.currentStage;
      }
    });
    return best;
  };

  const getPartsReadiness = (dpr) => {
    const order = (orders||[]).find(o => o.id === dpr.orderId);
    if (!order) return { total:0, cutCleared:0, readyForCollection:0, inCuttingQc:0, inCutting:0, outbound:0, notStarted:0, pct:0 };
    const drawing = (order.drawings||[]).find(d => d.id === dpr.drawingId);
    if (!drawing) return { total:0, cutCleared:0, readyForCollection:0, inCuttingQc:0, inCutting:0, outbound:0, notStarted:0, pct:0 };
    const drgParts = (order.parts||[]).filter(p => p.drawingId === drawing.id && p.fabType === "Fabricate");
    const total = drgParts.length;
    const DONE = new Set(['cutting_qc','fitup','fit_up','welding','weld_qc','tpi_fitup','tpi_weld','blasting','blast_qc','tpi_blast','painting','paint_qc','tpi_paint','dispatch','complete']);
    const stageOrder = ['complete','welding','fitup','fit_up','blasting','painting','cutting_qc','cutting','pending'];
    const bestStage  = {};
    const bestStatus = {};
    const partMarkNos = new Set(drgParts.map(p => p.markNo));
    (instances||[]).filter(i => partMarkNos.has(i.markNo)).forEach(i => {
      const curr = bestStage[i.markNo];
      if (!curr || stageOrder.indexOf(i.currentStage) < stageOrder.indexOf(curr)) {
        bestStage[i.markNo]  = i.currentStage;
        bestStatus[i.markNo] = i.currentStatus;
      }
    });
    let cutCleared = 0, readyForCollection = 0, inCuttingQc = 0, inCutting = 0, outbound = 0, notStarted = 0;
    Object.entries(bestStage).forEach(([markNo, stage]) => {
      const status = bestStatus[markNo];
      if (status === "outbound")                              { outbound++; }
      else if (DONE.has(stage) && status==="pending_collection") { readyForCollection++; }
      else if (DONE.has(stage))                               { cutCleared++; }
      else if (stage === "cutting_qc")                        { inCuttingQc++; }
      else if (stage === "cutting")                           { inCutting++; }
      else                                                    { notStarted++; }
    });
    const inInstanceMarkNos = new Set(Object.keys(bestStage));
    drgParts.forEach(p => { if (!inInstanceMarkNos.has(p.markNo)) notStarted++; });
    const pct = total > 0 ? Math.round(cutCleared / total * 100) : 0;
    return { total, cutCleared, readyForCollection, inCuttingQc, inCutting, outbound, notStarted, pct, order, drawing };
  };

  const doAction = (dpr, action) => {
    const ts = new Date().toISOString();
    if (action === 'start_fitup') {
      updDpr(dpr.id, { currentStage:'fitup', currentStatus:'in_progress', fitupStartedAt:ts,
        stageHistory:[...(dpr.stageHistory||[]), { stage:'fitup', action:'started', by:user.username, at:ts }] });
      advanceDrawingInstances(dpr, 'fitup', 'in_progress');
    } else if (action === 'mark_fitup_complete') {
      updDpr(dpr.id, { currentStage:'fitup_qc', currentStatus:'pending_qc', fitupCompleteAt:ts,
        stageHistory:[...(dpr.stageHistory||[]), { stage:'fitup', action:'completed', by:user.username, at:ts }] });
      advanceDrawingInstances(dpr, 'fitup', 'pending_supervisor');
      setTab("welding");
    } else if (action === 'start_welding') {
      updDpr(dpr.id, { currentStage:'welding', currentStatus:'in_progress', weldStartedAt:ts,
        stageHistory:[...(dpr.stageHistory||[]), { stage:'welding', action:'started', by:user.username, at:ts }] });
      advanceDrawingInstances(dpr, 'welding', 'in_progress');
    } else if (action === 'mark_weld_complete') {
      updDpr(dpr.id, { currentStage:'weld_qc', currentStatus:'pending_qc', weldCompleteAt:ts,
        stageHistory:[...(dpr.stageHistory||[]), { stage:'welding', action:'completed', by:user.username, at:ts }] });
      advanceDrawingInstances(dpr, 'welding', 'pending_supervisor');
      setTab("complete");
    }
    setSelDpr(null);
  };

  // ── Bucket classification ──────────────────────────────────────────────────
  // Tab 1 — Fit-Up: pending (ready) + in fitup + rejected back from fitup_qc
  // Awaiting collection — cut QC cleared, contractor needs to collect
  const tabCollect = myDprs.filter(d =>
    (d.fitupContractorId === cid || d.weldContractorId === cid) &&
    d.currentStage === "awaiting_collection"
  );

  const tab1 = myDprs.filter(d =>
    d.fitupContractorId === cid &&
    ['pending','fitup'].includes(d.currentStage)
  );
  // Tab 2 — Welding: awaiting fitup QC + in welding (incl rejected from weld_qc) + awaiting TPI
  const tab2_awaitingQc = myDprs.filter(d => d.currentStage === 'fitup_qc');
  const tab2_welding    = myDprs.filter(d =>
    d.weldContractorId === cid && d.currentStage === 'welding'
  );
  const tab2_tpiPending = myDprs.filter(d =>
    (d.fitupContractorId === cid || d.weldContractorId === cid) &&
    ['tpi_fitup','tpi_weld'].includes(d.currentStage)
  );
  // Tab 3 — Complete: awaiting weld inspection (weld_qc + tpi_weld) + cleared
  const tab3_awaitingInsp = myDprs.filter(d => ['weld_qc','tpi_weld'].includes(d.currentStage));
  const tab3_cleared      = myDprs.filter(d => d.currentStage === 'complete');

  // ── Shared drawing card (keeps existing part-readiness display intact) ──────
  const DprCard = ({ dpr, onClick, accent, onCorrect }) => {
    const { pct, cutCleared, readyForCollection, inCuttingQc, inCutting, outbound, total } = getPartsReadiness(dpr);
    const order = (orders||[]).find(o => o.id === dpr.orderId) || {};
    const borderColor = accent || T.accent;
    const scope = dpr.fitupContractorId === cid && dpr.weldContractorId === cid
      ? "Fit-Up + Welding"
      : dpr.fitupContractorId === cid ? "Fit-Up" : "Welding";
    return (
      <div onClick={onClick}
        style={{ ...css.card, marginBottom:8, cursor: onClick ? "pointer" : "default",
          borderLeft:`3px solid ${borderColor}` }}
        onMouseEnter={e => { if(onClick) e.currentTarget.style.background = T.bgHover; }}
        onMouseLeave={e => { if(onClick) e.currentTarget.style.background = T.bgCard; }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
          <div style={{flex:1}}>
            <div style={{ fontFamily:T.fontMono, fontWeight:700, color:T.accent, fontSize:13 }}>{dpr.drawingNo}</div>
            <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>
              {order.orderNo || dpr.orderId} · {dpr.totalParts||total} parts · {dpr.totalWt>0?(dpr.totalWt/1000).toFixed(2)+"T":"—"}
            </div>
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            {total > 0 && (
              <div style={{ marginTop:4, height:4, background:T.border, borderRadius:2, width:80, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${pct}%`, background:pct>=80?T.green:pct>=50?T.amber:T.red }} />
              </div>
            )}
            {onCorrect&&(
              <button onClick={e=>{e.stopPropagation();onCorrect(dpr);}}
                style={{...css.btn.ghost,fontSize:10,padding:"2px 8px",marginLeft:4}}>⋯</button>
            )}
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:6, fontSize:11, flexWrap:"wrap" }}>
          {cutCleared > 0        && <span style={{color:T.green}}>✅ {cutCleared} collected</span>}
          {readyForCollection > 0 && <span style={{color:T.accent}}>📦 {readyForCollection} to collect</span>}
          {inCuttingQc > 0       && <span style={{color:"#06B6D4"}}>🔍 {inCuttingQc} cutting QC</span>}
          {inCutting > 0         && <span style={{color:T.textMid}}>✂ {inCutting} cutting</span>}
          {outbound > 0          && <span style={{color:T.amber}}>🚚 {outbound} outbound</span>}
          {total > 0             && <span style={{color:T.textLow}}>of {total}</span>}
          <span style={{color:T.accentLo, marginLeft:"auto"}}>{scope}</span>
          {dpr.welderName&&<span style={{color:T.textLow}}>Welder: {dpr.welderName}</span>}
        </div>
      </div>
    );
  };

  // ── Section label ──────────────────────────────────────────────────────────
  const SL = ({ title, count, color, sub }) => (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, marginTop:20 }}>
      <div style={{ fontSize:11, fontWeight:800, color:color||T.textMid, letterSpacing:"0.08em" }}>{title}</div>
      {count > 0 && <div style={{ background:color||T.textMid, color:"#fff", fontSize:10,
        fontWeight:800, borderRadius:8, padding:"1px 6px" }}>{count}</div>}
      {sub && <div style={{ fontSize:11, color:T.textLow }}>{sub}</div>}
    </div>
  );

  // ── Detail view (shared across tabs) ──────────────────────────────────────
  if (selDpr) {
    const dpr = selDpr;
    const { pct, cutCleared, readyForCollection, inCuttingQc, inCutting, outbound, notStarted, total, order, drawing } = getPartsReadiness(dpr);
    const threshold = 80;
    const suggestion = pct >= threshold
      ? { color:T.green,  bg:T.greenBg,  icon:"✅", label:"SAFE TO COMMIT TEAM",       sub:`${pct}% parts cut and cleared` }
      : pct >= 50
      ? { color:T.amber,  bg:T.amberBg,  icon:"⚠",  label:"PARTIAL — MONITOR CLOSELY", sub:`${pct}% ready. Parts still incoming` }
      : { color:T.red,    bg:T.redBg,    icon:"❌", label:"HOLD — INSUFFICIENT PARTS",  sub:`Only ${pct}% parts available` };

    const asmGroup  = drawing?.assemblyGroup;
    const siblings  = asmGroup ? (order?.drawings||[]).filter(d => d.assemblyGroup === asmGroup && d.id !== dpr.drawingId) : [];

    // What actions are available?
    const canStartFitup      = dpr.currentStage === 'pending'  && dpr.fitupContractorId === cid && pct >= 80;
    const canMarkFitupDone   = dpr.currentStage === 'fitup'    && dpr.fitupContractorId === cid;
    const awaitingFitupQc    = dpr.currentStage === 'fitup_qc';
    const canStartWeld       = dpr.currentStage === 'welding'  && dpr.weldContractorId  === cid && !selDpr._weldStarted;
    const weldInProgress     = dpr.currentStage === 'welding'  && dpr.weldStartedAt;
    const canMarkWeldDone    = dpr.currentStage === 'welding'  && dpr.weldContractorId  === cid;
    const awaitingWeldInsp   = ['weld_qc','tpi_weld'].includes(dpr.currentStage);
    const isComplete         = dpr.currentStage === 'complete';

    return (
      <div>
        <button onClick={() => { setSelDpr(null); setShowAsm(false); }}
          style={{ ...css.btn.ghost, marginBottom:16 }}>← Back</button>

        {/* Header */}
        <div style={{ ...css.card, marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
            <div>
              <div style={{ fontFamily:T.fontMono, fontWeight:700, color:T.accent, fontSize:16 }}>{dpr.drawingNo}</div>
              <div style={{ fontSize:12, color:T.textMid, marginTop:3 }}>
                {order?.orderNo || dpr.orderId} · {order?.clientName || ""}
              </div>
            </div>
            <Badge color={
              isComplete ? "green" :
              awaitingFitupQc || awaitingWeldInsp ? "amber" :
              dpr.currentStage === 'fitup' || dpr.currentStage === 'welding' ? "blue" : "gray"
            }>
              {isComplete ? "Complete" :
               awaitingFitupQc ? "Awaiting Fit-Up QC" :
               awaitingWeldInsp ? "Awaiting Inspection" :
               dpr.currentStage === 'fitup' ? "Fit-Up In Progress" :
               dpr.currentStage === 'welding' ? "Welding In Progress" :
               dpr.currentStage === 'pending' ? "Pending" : dpr.currentStage}
            </Badge>
          </div>

          {/* Parts readiness — 5-bucket breakdown */}
          <div style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:T.textMid, marginBottom:4 }}>
              <span>Parts Readiness</span>
              <span style={{ fontWeight:700, color:pct>=80?T.green:pct>=50?T.amber:T.red }}>{pct}% collected</span>
            </div>
            <div style={{ height:8, background:T.border, borderRadius:99, overflow:"hidden", marginBottom:10 }}>
              <div style={{ height:"100%", width:`${pct}%`, background:pct>=80?T.green:pct>=50?T.amber:T.red, borderRadius:99 }} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:6 }}>
              {[
                { icon:"✅", label:"Collected",        count:cutCleared,         color:T.green,   always:true  },
                { icon:"📦", label:"Ready to collect", count:readyForCollection,  color:T.accent,  always:false },
                { icon:"🔍", label:"Cutting QC",       count:inCuttingQc,        color:"#06B6D4", always:false },
                { icon:"✂",  label:"Cutting",          count:inCutting,          color:T.textMid, always:false },
                { icon:"🚚", label:"Outbound",         count:outbound,           color:T.amber,   always:false },
              ].map(b => (b.count > 0 || b.always) && (
                <div key={b.label} style={{ background:T.bgInput, borderRadius:6, padding:"8px 6px", textAlign:"center",
                  border:`1px solid ${b.count>0?b.color+"44":T.border}` }}>
                  <div style={{ fontSize:15, marginBottom:2 }}>{b.icon}</div>
                  <div style={{ fontSize:17, fontWeight:800, color:b.count>0?b.color:T.textLow }}>{b.count}</div>
                  <div style={{ fontSize:10, color:T.textLow, lineHeight:"1.2" }}>{b.label}</div>
                </div>
              ))}
            </div>
            {notStarted > 0 && (
              <div style={{ fontSize:11, color:T.textLow, marginTop:6 }}>
                + {notStarted} part{notStarted>1?"s":""} not yet started · Total: {total}
              </div>
            )}
          </div>

          {/* Readiness suggestion */}
          <div style={{ background:suggestion.bg, border:`1px solid ${suggestion.color}44`,
            borderRadius:6, padding:"8px 12px", fontSize:11 }}>
            <span style={{ fontWeight:700, color:suggestion.color }}>{suggestion.icon} {suggestion.label}</span>
            <span style={{ color:suggestion.color, marginLeft:8 }}>{suggestion.sub}</span>
          </div>
        </div>

        {/* Assembly siblings */}
        {asmGroup && siblings.length > 0 && (
          <div style={{ ...css.card, marginBottom:14 }}>
            <button onClick={() => setShowAsm(s => !s)}
              style={{ ...css.btn.ghost, width:"100%", textAlign:"left", display:"flex",
                justifyContent:"space-between", padding:"4px 0" }}>
              <span style={{ fontSize:11, fontWeight:700, color:T.textMid, letterSpacing:"0.06em" }}>
                ASSEMBLY: {asmGroup} ({siblings.length + 1} drawings)
              </span>
              <span style={{ fontSize:11, color:T.textMid }}>{showAsm ? "▲ Hide" : "▶ Show"} siblings</span>
            </button>
            {showAsm && (
              <InfoBanner color="blue">Assembly status shown for planning only. Your commitment is based on this drawing's parts.</InfoBanner>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {canStartFitup && (
            <button onClick={() => doAction(dpr, 'start_fitup')}
              style={{ ...css.btn.green, flex:1, padding:"12px 0", fontSize:14 }}>
              ▶ Start Fit-Up
            </button>
          )}
          {dpr.currentStage === 'pending' && pct < 80 && (
            <div style={{ flex:1, padding:"12px 16px", background:T.amberBg,
              border:`1px solid ${T.amber}44`, borderRadius:8, textAlign:"center",
              fontSize:13, color:T.amber, fontWeight:600 }}>
              ⏳ Waiting for parts — {pct}% ready
            </div>
          )}
          {canMarkFitupDone && (
            <button onClick={() => doAction(dpr, 'mark_fitup_complete')}
              style={{ ...css.btn.primary, flex:1, padding:"12px 0", fontSize:14 }}>
              ✓ Mark Fit-Up Complete
            </button>
          )}
          {awaitingFitupQc && (
            <div style={{ flex:1, padding:"12px 16px", background:T.amberBg,
              border:`1px solid ${T.amber}44`, borderRadius:8, textAlign:"center",
              fontSize:13, color:T.amber, fontWeight:700 }}>
              ⏳ Awaiting Fit-Up QC Sign-Off
            </div>
          )}
          {dpr.currentStage === 'welding' && !dpr.weldStartedAt && dpr.weldContractorId === cid && (
            <button onClick={() => doAction(dpr, 'start_welding')}
              style={{ ...css.btn.green, flex:1, padding:"12px 0", fontSize:14 }}>
              ▶ Start Welding
            </button>
          )}
          {dpr.currentStage === 'welding' && dpr.weldStartedAt && dpr.weldContractorId === cid && (
            <button onClick={() => doAction(dpr, 'mark_weld_complete')}
              style={{ ...css.btn.primary, flex:1, padding:"12px 0", fontSize:14 }}>
              ✓ Mark Welding Complete
            </button>
          )}
          {awaitingWeldInsp && (
            <div style={{ flex:1, padding:"12px 16px", background:T.amberBg,
              border:`1px solid ${T.amber}44`, borderRadius:8, textAlign:"center",
              fontSize:13, color:T.amber, fontWeight:700 }}>
              ⏳ Awaiting Inspection / TPI Sign-Off
            </div>
          )}
          {isComplete && (
            <div style={{ flex:1, padding:"12px 16px", background:T.greenBg,
              border:`1px solid ${T.green}44`, borderRadius:8, textAlign:"center",
              fontSize:13, color:T.green, fontWeight:700 }}>
              ✅ Job Complete — QC Cleared
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Tab counts for header badges ───────────────────────────────────────────
  const tab1Count = tab1.length;
  const tab2Count = tab2_awaitingQc.length + tab2_welding.length + tab2_tpiPending.length;
  const tab3Count = tab3_awaitingInsp.length + tab3_cleared.length;

  // ── Collection Handler ───────────────────────────────────────────────────

  const doConfirmCollection = (dpr, piecesCollected, piecesExpected, notes) => {
    const hasDiscrepancy = parseInt(piecesCollected) < parseInt(piecesExpected);
    const ts = new Date().toISOString();
    updDpr(dpr.id, {
      currentStage: "fitup",
      currentStatus: "in_progress",
      collected: true,
      collectedAt: ts,
      collectedBy: user.name,
      piecesExpected: piecesExpected,
      piecesCollected: piecesCollected,
      collectionNotes: notes||"",
      hasCollectionDiscrepancy: hasDiscrepancy,
      auditLog:[...(dpr.auditLog||[]),{
        action:"parts-collected", by:user.name, date:ts.slice(0,10),
        reason:`Collected ${piecesCollected}/${piecesExpected} pieces${notes?` — ${notes}`:""}`
      }]
    });
    // Advance instances to fitup
    advanceDrawingInstances(dpr, "fitup", "in_progress");
    // If discrepancy — notify production admin
    if (hasDiscrepancy && setNotifications) {
      setNotifications(prev=>[...prev, createNotification({
        type:"correction",
        message:`⚠ Collection discrepancy — ${dpr.drawingNo}: ${piecesCollected} of ${piecesExpected} pieces collected by ${user.name}. ${piecesExpected-piecesCollected} piece(s) missing.`,
        forRoles:["production_admin","production_engineer","super_admin"],
        entityId:dpr.id, orderId:dpr.orderId, raisedBy:user.name
      })]);
    }
    showToast(hasDiscrepancy
      ? `⚠ Collection recorded with discrepancy — ${piecesCollected}/${piecesExpected} pieces`
      : `✓ All ${piecesCollected} pieces collected — drawing moved to fit-up`
    );
    setCollectModal(null); setCollectForm({});
  };

  // ── Corrections Modal ────────────────────────────────────────────────────
  const CqCorrModal = () => {
    if (!cqCorrModal) return null;
    const { dpr, type } = cqCorrModal;
    const allContractors = (orders||[]).flatMap(o=>[]); // placeholder — use contractors from releases
    const contractorList = [...new Set((releases||[]).flatMap(r=>
      [r.fitupContractorId,r.weldContractorId].filter(Boolean)
    ))].map(id=>{
      // find contractor name from dprs
      const d=(dprs||[]).find(x=>x.weldContractorId===id||x.fitupContractorId===id);
      return {id, name:d?.weldContractorName||d?.fitupContractorName||id};
    });

    // Corrections menu for a DPR
    if (type==="menu") return (
      <Modal title={`Corrections — ${dpr?.drawingNo}`} onClose={()=>setCqCorrModal(null)} width={400}>
        <div style={{fontSize:11,color:T.textMid,marginBottom:12}}>
          Stage: <Badge color="blue">{dpr?.currentStage||"—"}</Badge>
          &nbsp;Contractor: <span style={{fontFamily:T.fontMono}}>{dpr?.weldContractorName||dpr?.fitupContractorName||"—"}</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {can(user,"cq.reassign_contractor")&&(
            <button onClick={()=>{setCqCorrForm({});setCqCorrModal({dpr,type:"reassign"});}}
              style={{...css.btn.secondary,textAlign:"left",justifyContent:"flex-start"}}>
              🔄 Reassign contractor (with partial work note)
            </button>
          )}
          {can(user,"cq.edit_welder")&&(
            <button onClick={()=>{setCqCorrForm({welderName:dpr?.welderName||""});setCqCorrModal({dpr,type:"edit_welder"});}}
              style={{...css.btn.secondary,textAlign:"left",justifyContent:"flex-start"}}>
              ✏ Edit welder ID / name
            </button>
          )}
          {can(user,"cq.revert_welding")&&(dpr?.currentStage==="welding_qc"||dpr?.weldingCompletedAt)&&(
            <button onClick={()=>{setCqCorrForm({});setCqCorrModal({dpr,type:"revert_welding"});}}
              style={{...css.btn.secondary,textAlign:"left",justifyContent:"flex-start",color:T.amber}}>
              ↩ Revert welding complete
            </button>
          )}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}>
          <button onClick={()=>setCqCorrModal(null)} style={css.btn.secondary}>Close</button>
        </div>
      </Modal>
    );

    // Revert Welding Complete
    if (type==="revert_welding") return (
      <Modal title={`Revert Welding Complete — ${dpr?.drawingNo}`} onClose={()=>setCqCorrModal(null)} width={440}>
        <InfoBanner color="amber">Sends drawing back to "Welding in Progress". Blocked if welding QC already approved.</InfoBanner>
        <Field label="Reason (mandatory)" style={{marginTop:12}}>
          <textarea value={cqCorrForm.reason||""} onChange={e=>setCqCorrForm(f=>({...f,reason:e.target.value}))}
            rows={3} style={{...css.input,width:"100%",resize:"vertical"}} placeholder="e.g. Welding not fully complete on all pieces" />
        </Field>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12}}>
          <button onClick={()=>setCqCorrModal(null)} style={css.btn.secondary}>Cancel</button>
          <button onClick={()=>doRevertWeldingComplete(dpr,cqCorrForm.reason)}
            disabled={!cqCorrForm.reason?.trim()}
            style={{...css.btn.primary,background:T.amber,opacity:cqCorrForm.reason?.trim()?1:0.4}}>Revert</button>
        </div>
      </Modal>
    );

    // Edit Welder ID
    if (type==="edit_welder") {
      const welderList = [...new Set((dprs||[]).map(d=>d.welderName).filter(Boolean))];
      return (
        <Modal title={`Edit Welder — ${dpr?.drawingNo}`} onClose={()=>setCqCorrModal(null)} width={440}>
          <div style={{marginBottom:8,fontSize:11,color:T.textMid}}>
            Current welder: <span style={{fontFamily:T.fontMono,color:T.text}}>{dpr?.welderName||"—"}</span>
          </div>
          <Field label="New Welder ID / Name">
            <Input value={cqCorrForm.welderName||""} onChange={e=>setCqCorrForm(f=>({...f,welderName:e.target.value}))} placeholder="e.g. W-001 or Ravi Kumar" />
          </Field>
          <Field label="Reason (mandatory)" style={{marginTop:10}}>
            <Input value={cqCorrForm.reason||""} onChange={e=>setCqCorrForm(f=>({...f,reason:e.target.value}))} placeholder="e.g. Wrong welder recorded" />
          </Field>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12}}>
            <button onClick={()=>setCqCorrModal(null)} style={css.btn.secondary}>Cancel</button>
            <button onClick={()=>doEditWelderId(dpr,cqCorrForm.welderName||dpr?.welderId||"",cqCorrForm.welderName||"",cqCorrForm.reason)}
              disabled={!cqCorrForm.reason?.trim()||!cqCorrForm.welderName?.trim()}
              style={{...css.btn.primary,opacity:(!cqCorrForm.reason?.trim()||!cqCorrForm.welderName?.trim())?0.4:1}}>Save</button>
          </div>
        </Modal>
      );
    }

    // Reassign Contractor
    if (type==="reassign") {
      const stage = dpr?.currentStage;
      const isWeld = stage==="welding"||stage==="welding_qc";
      const currentCon = isWeld?dpr?.weldContractorName:dpr?.fitupContractorName;
      return (
        <Modal title={`Reassign Contractor — ${dpr?.drawingNo}`} onClose={()=>setCqCorrModal(null)} width={480}>
          <div style={{marginBottom:10,padding:"8px 12px",background:T.amberBg,borderRadius:6,border:`1px solid ${T.amber}44`,fontSize:11}}>
            <span style={{color:T.amber,fontWeight:700}}>⚠ Partial work note:</span> If the previous contractor has done partial work, document it in the reason below. This will be logged permanently.
          </div>
          <div style={{marginBottom:8,fontSize:11,color:T.textMid}}>
            Current contractor: <span style={{fontFamily:T.fontMono,color:T.text,fontWeight:700}}>{currentCon||"—"}</span>
          </div>
          <Field label={`New ${isWeld?"welding":"fit-up"} contractor`}>
            <Input value={cqCorrForm.newContractor||""} onChange={e=>setCqCorrForm(f=>({...f,newContractor:e.target.value}))} placeholder="Contractor name" />
          </Field>
          <Field label="Reason — note any partial work done by previous contractor (mandatory)" style={{marginTop:10}}>
            <textarea value={cqCorrForm.reason||""} onChange={e=>setCqCorrForm(f=>({...f,reason:e.target.value}))}
              rows={3} style={{...css.input,width:"100%",resize:"vertical"}} placeholder="e.g. Previous contractor completed 60% fit-up. Reassigning due to capacity issue." />
          </Field>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12}}>
            <button onClick={()=>setCqCorrModal(null)} style={css.btn.secondary}>Cancel</button>
            <button onClick={()=>doReassignContractor(dpr,`CON-${Date.now()}`,cqCorrForm.newContractor,cqCorrForm.reason)}
              disabled={!cqCorrForm.reason?.trim()||!cqCorrForm.newContractor?.trim()}
              style={{...css.btn.primary,opacity:(!cqCorrForm.reason?.trim()||!cqCorrForm.newContractor?.trim())?0.4:1}}>Reassign</button>
          </div>
        </Modal>
      );
    }
    return null;
  };

  // ── Tab bar ────────────────────────────────────────────────────────────────
  const TABS = [
    { id:"collect",  label:"📦 Collect",count:tabCollect.length, alertColor: tabCollect.length>0?T.red:T.textMid },
    { id:"fitup",    label:"Fit-Up",   count:tab1Count,  alertColor: tab1.some(d=>d.currentStage==='fitup')?T.accent:T.textMid },
    { id:"welding",  label:"Welding",  count:tab2Count,  alertColor: tab2_welding.length>0?T.accent:tab2_awaitingQc.length>0?T.amber:T.textMid },
    { id:"complete", label:"Complete", count:tab3Count,  alertColor: tab3_cleared.length>0?T.green:tab3_awaitingInsp.length>0?T.amber:T.textMid },
  ];

  return (
    <div>
      <CqCorrModal />

      {/* ── COLLECT PARTS MODAL ── */}
      {collectModal&&(
        <Modal title={`Collect Parts — ${collectModal.drawingNo}`} onClose={()=>{setCollectModal(null);setCollectForm({});}} width={500}>
          {(()=>{
            const dpr = collectModal;
            const order = (orders||[]).find(o=>o.id===dpr.orderId)||{};
            const expectedParts = dpr.totalParts || (instances||[]).filter(i=>
              i.drawingId===dpr.drawingId&&i.orderId===dpr.orderId&&!i.isSideCut
            ).length;
            const curCollected = collectForm.piecesCollected!==undefined ? collectForm.piecesCollected : String(expectedParts);
            const isDiscrepancy = parseInt(curCollected||0) < expectedParts;
            return (
              <>
                {/* Drawing info */}
                <div style={{padding:"10px 14px",background:T.bg,borderRadius:6,marginBottom:14,border:`1px solid ${T.border}`}}>
                  <div style={{display:"flex",gap:16,fontSize:11,flexWrap:"wrap"}}>
                    <span style={{color:T.textMid}}>Drawing: <span style={{fontFamily:T.fontMono,fontWeight:700,color:T.accent}}>{dpr.drawingNo}</span></span>
                    <span style={{color:T.textMid}}>Order: <span style={{color:T.text}}>{order.orderNo||dpr.orderId}</span></span>
                    <span style={{color:T.textMid}}>QC cleared: <span style={{color:T.green,fontWeight:700}}>{dpr.cuttingQcClearedAt?.slice(0,10)||"—"}</span></span>
                    {dpr.awaitingCollectionSince&&(()=>{
                      const hrs = Math.round((Date.now()-new Date(dpr.awaitingCollectionSince).getTime())/3600000);
                      return <span style={{color:hrs>24?T.red:hrs>4?T.amber:T.textMid,fontWeight:hrs>4?700:400}}>
                        Waiting: {hrs}h
                      </span>;
                    })()}
                  </div>
                </div>

                {/* Piece count */}
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.textMid,marginBottom:8}}>PIECE COUNT VERIFICATION</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <Field label="Expected pieces (from QC clearance)">
                      <div style={{padding:"8px 10px",background:T.bg,borderRadius:5,fontFamily:T.fontMono,fontSize:16,fontWeight:700,color:T.text,border:`1px solid ${T.border}`}}>
                        {expectedParts}
                      </div>
                    </Field>
                    <Field label="Pieces actually collected">
                      <Input type="number" value={curCollected}
                        onChange={e=>setCollectForm(f=>({...f,piecesCollected:e.target.value}))}
                        style={{fontSize:16,fontWeight:700,
                          border:isDiscrepancy?`2px solid ${T.red}`:`2px solid ${T.green}`}} />
                    </Field>
                  </div>
                  {isDiscrepancy&&parseInt(curCollected||0)>=0&&(
                    <InfoBanner color="red" style={{marginTop:8}}>
                      ⚠ {expectedParts - parseInt(curCollected||0)} piece(s) missing — production admin will be notified automatically.
                    </InfoBanner>
                  )}
                  {!isDiscrepancy&&curCollected&&(
                    <div style={{marginTop:8,padding:"6px 10px",background:T.greenBg,borderRadius:5,fontSize:11,color:T.green,fontWeight:700}}>
                      ✓ All pieces accounted for
                    </div>
                  )}
                </div>

                {/* Notes */}
                <Field label="Notes / condition remarks (optional)">
                  <textarea value={collectForm.notes||""} onChange={e=>setCollectForm(f=>({...f,notes:e.target.value}))}
                    rows={2} style={{...css.input,width:"100%",resize:"vertical"}}
                    placeholder="e.g. All pieces in good condition / Minor surface rust on 2 pieces" />
                </Field>

                <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
                  <button onClick={()=>{setCollectModal(null);setCollectForm({});}} style={css.btn.secondary}>Cancel</button>
                  <button
                    onClick={()=>doConfirmCollection(dpr,curCollected,expectedParts,collectForm.notes)}
                    disabled={!curCollected||parseInt(curCollected)<0}
                    style={{...css.btn.primary,
                      background:isDiscrepancy?T.amber:T.green,
                      opacity:(!curCollected||parseInt(curCollected)<0)?0.4:1}}>
                    {isDiscrepancy?`⚠ Confirm with discrepancy`:`✓ Confirm Collection`}
                  </button>
                </div>
              </>
            );
          })()}
        </Modal>
      )}
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:18, fontWeight:800, color:T.text }}>My Drawings</div>
        <div style={{ fontSize:12, color:T.textMid }}>{user.name}</div>
      </div>

      {myDprs.length === 0 ? (
        <div style={{ ...css.card, textAlign:"center", padding:40, color:T.textLow, fontSize:13 }}>
          No drawings assigned yet. Drawings are assigned in the Production Release Wizard.
        </div>
      ) : (
        <>
          {/* Tab bar */}
          <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${T.border}`, marginBottom:20 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding:"10px 20px", fontSize:13, fontWeight: tab===t.id ? 700 : 400,
                color: tab===t.id ? T.accent : T.textMid,
                background:"transparent", border:"none",
                borderBottom: tab===t.id ? `2px solid ${T.accent}` : "2px solid transparent",
                cursor:"pointer", display:"flex", alignItems:"center", gap:7
              }}>
                {t.label}
                {t.count > 0 && (
                  <span style={{ background: tab===t.id ? T.accent : t.alertColor,
                    color:"#fff", borderRadius:10, fontSize:11,
                    fontWeight:800, padding:"1px 7px", minWidth:20, textAlign:"center" }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── TAB 0: COLLECT ── */}
          {tab === "collect" && (
            <div>
              {tabCollect.length === 0
                ? <div style={{ textAlign:"center", padding:48, color:T.textLow, fontSize:13 }}>
                    <div style={{ fontSize:32, marginBottom:10 }}>📦</div>
                    No parts awaiting collection
                  </div>
                : <>
                    <InfoBanner color="blue" style={{marginBottom:16}}>
                      Cutting QC has cleared these drawings. Physically collect all pieces from the cutting bay and confirm the count below before starting fit-up.
                    </InfoBanner>
                    {tabCollect.map(d=>{
                      const order = (orders||[]).find(o=>o.id===d.orderId)||{};
                      const expectedParts = d.totalParts || (instances||[]).filter(i=>
                        i.drawingId===d.drawingId&&i.orderId===d.orderId&&!i.isSideCut
                      ).length;
                      const hrs = d.awaitingCollectionSince
                        ? Math.round((Date.now()-new Date(d.awaitingCollectionSince).getTime())/3600000) : 0;
                      const urgentColor = hrs>24?T.red:hrs>4?T.amber:T.green;
                      return (
                        <div key={d.id} style={{...css.card,marginBottom:10,borderLeft:`4px solid ${urgentColor}`}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                            <div style={{flex:1}}>
                              <div style={{fontFamily:T.fontMono,fontWeight:700,color:T.accent,fontSize:14}}>{d.drawingNo}</div>
                              <div style={{fontSize:11,color:T.textMid,marginTop:2}}>
                                {order.orderNo||d.orderId} · <span style={{fontWeight:700,color:T.text}}>{expectedParts} pieces</span> to collect
                              </div>
                              {hrs>0&&(
                                <div style={{fontSize:11,color:urgentColor,fontWeight:700,marginTop:4}}>
                                  {hrs>24?`🔴 Overdue — waiting ${hrs}h`:hrs>4?`⚠ Waiting ${hrs}h`:`✓ Ready ${hrs}h ago`}
                                </div>
                              )}
                            </div>
                            <button onClick={()=>{setCollectModal(d);setCollectForm({});}}
                              style={{...css.btn.primary,background:T.green,fontSize:12,padding:"6px 14px",whiteSpace:"nowrap"}}>
                              📦 Collect Parts
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </>
              }
            </div>
          )}

          {/* ── TAB 1: FIT-UP ── */}
          {tab === "fitup" && (
            <div>
              {tab1.length === 0 ? (
                <div style={{ textAlign:"center", padding:48, color:T.textLow, fontSize:13 }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>🔧</div>
                  No fit-up work currently assigned
                </div>
              ) : (
                <>
                  {tab1.filter(d => d.currentStage === 'fitup').length > 0 && (
                    <>
                      <SL title="IN FIT-UP" count={tab1.filter(d=>d.currentStage==='fitup').length} color={T.accent} />
                      {tab1.filter(d => d.currentStage === 'fitup').map(d => (
                        <DprCard key={d.id} dpr={d} accent={T.accent} onClick={() => setSelDpr(d)}
                          onCorrect={(can(user,"cq.reassign_contractor")||can(user,"cq.edit_welder"))?dpr=>{setCqCorrForm({});setCqCorrModal({dpr,type:"menu"});}:null} />
                      ))}
                    </>
                  )}
                  {tab1.filter(d => d.currentStage === 'pending').length > 0 && (
                    <>
                      <SL title="PENDING — AWAITING PARTS" count={tab1.filter(d=>d.currentStage==='pending').length}
                        color={T.textMid} sub="80% parts needed before fit-up can start" />
                      {tab1.filter(d => d.currentStage === 'pending').map(d => (
                        <DprCard key={d.id} dpr={d} accent={T.textLow} onClick={() => setSelDpr(d)} />
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── TAB 2: WELDING ── */}
          {tab === "welding" && (
            <div>
              {tab2_awaitingQc.length === 0 && tab2_welding.length === 0 ? (
                <div style={{ textAlign:"center", padding:48, color:T.textLow, fontSize:13 }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>🔥</div>
                  No welding work at this stage
                </div>
              ) : (
                <>
                  {/* Section A — Awaiting Fit-Up QC (read-only) */}
                  {tab2_awaitingQc.length > 0 && (
                    <>
                      <SL title="AWAITING FIT-UP QC" count={tab2_awaitingQc.length} color={T.amber}
                        sub="— QC team to approve before welding proceeds" />
                      {tab2_awaitingQc.map(d => (
                        <div key={d.id} style={{ ...css.card, marginBottom:8,
                          borderLeft:`3px solid ${T.amber}`, opacity:0.85 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <div>
                              <div style={{ fontFamily:T.fontMono, fontWeight:700, color:T.accent, fontSize:13 }}>{d.drawingNo}</div>
                              <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>
                                {(orders||[]).find(o=>o.id===d.orderId)?.orderNo || d.orderId}
                              </div>
                            </div>
                            <Badge color="amber">Awaiting Fit-Up QC</Badge>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Section B — Proceed to Weld */}
                  {tab2_welding.length > 0 && (
                    <>
                      <SL title="PROCEED TO WELD" count={tab2_welding.length} color={T.accent}
                        sub="— Fit-Up QC cleared" />
                      {tab2_welding.map(d => (
                        <DprCard key={d.id} dpr={d} accent={T.accent} onClick={() => setSelDpr(d)}
                          onCorrect={(can(user,"cq.reassign_contractor")||can(user,"cq.edit_welder")||can(user,"cq.revert_welding"))?dpr=>{setCqCorrForm({});setCqCorrModal({dpr,type:"menu"});}:null} />
                      ))}
                    </>
                  )}
                  {/* Section C — Awaiting TPI Clearance */}
                  {tab2_tpiPending.length > 0 && (
                    <>
                      <SL title="AWAITING TPI CLEARANCE" count={tab2_tpiPending.length} color={T.amber}
                        sub="— TPI agency inspection pending" />
                      {tab2_tpiPending.map(d => {
                        const o=(orders||[]).find(x=>x.id===d.orderId)||{};
                        const stage = d.currentStage==="tpi_fitup"?"Fit-Up TPI":"Weld TPI";
                        return (
                          <div key={d.id} style={{...css.card,marginBottom:8,borderLeft:`3px solid ${T.amber}`}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                              <div>
                                <div style={{fontFamily:T.fontMono,fontWeight:700,color:T.accent,fontSize:13}}>{d.drawingNo}</div>
                                <div style={{fontSize:11,color:T.textMid,marginTop:2}}>{o.orderNo} · Work complete — awaiting inspector</div>
                              </div>
                              <Badge color="amber">{stage} Pending</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── TAB 3: COMPLETE ── */}
          {tab === "complete" && (
            <div>
              {tab3_awaitingInsp.length === 0 && tab3_cleared.length === 0 ? (
                <div style={{ textAlign:"center", padding:48, color:T.textLow, fontSize:13 }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>✅</div>
                  No completed jobs yet
                </div>
              ) : (
                <>
                  {/* Section A — Awaiting Inspection */}
                  {tab3_awaitingInsp.length > 0 && (
                    <>
                      <SL title="AWAITING INSPECTION / TPI" count={tab3_awaitingInsp.length} color={T.amber}
                        sub="— QC / TPI sign-off pending" />
                      {tab3_awaitingInsp.map(d => (
                        <div key={d.id} style={{ ...css.card, marginBottom:8,
                          borderLeft:`3px solid ${T.amber}` }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <div>
                              <div style={{ fontFamily:T.fontMono, fontWeight:700, color:T.accent, fontSize:13 }}>{d.drawingNo}</div>
                              <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>
                                {(orders||[]).find(o=>o.id===d.orderId)?.orderNo || d.orderId}
                              </div>
                            </div>
                            <Badge color="amber">
                              {d.currentStage === 'tpi_weld' ? 'TPI Hold' : 'Weld QC'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Section B — QC Cleared */}
                  {tab3_cleared.length > 0 && (
                    <>
                      <SL title="QC CLEARED" count={tab3_cleared.length} color={T.green} />
                      {tab3_cleared.map(d => (
                        <div key={d.id} style={{ ...css.card, marginBottom:8,
                          borderLeft:`3px solid ${T.green}` }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <div>
                              <div style={{ fontFamily:T.fontMono, fontWeight:700, color:T.accent, fontSize:13 }}>{d.drawingNo}</div>
                              <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>
                                {(orders||[]).find(o=>o.id===d.orderId)?.orderNo || d.orderId}
                              </div>
                            </div>
                            <Badge color="green">Complete ✓</Badge>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTION STEP 6: SUPERVISOR SOFT GATE
// ═══════════════════════════════════════════════════════════════════════════════
const TPI_STAGES = ["tpi_weld","tpi_paint","tpi_fitup","tpi_blast"];

// ─── DEFAULT PROCESS PIPELINE ────────────────────────────────────────────────
// Tasks that an outbound vendor can perform — drives QC checklist on return
const OUTBOUND_TASKS = [
  { id:"cut",      label:"Cutting",          qcHints:"Dimensions, squareness, kerf quality" },
  { id:"drill",    label:"Drilling",         qcHints:"Hole dia, pitch, thread gauge, position" },
  { id:"grind",    label:"Grinding",         qcHints:"Surface finish, flatness, no gouges" },
  { id:"machine",  label:"Machining",        qcHints:"Dimensional report, surface finish" },
  { id:"bend",     label:"Bending/Rolling",  qcHints:"Radius, straightness, no cracks" },
  { id:"fitup",    label:"Fit-Up",           qcHints:"Joint gaps, alignment, tack positions" },
  { id:"weld",     label:"Welding",          qcHints:"Visual, dimensional, welder cert, NDT" },
  { id:"galvanise",label:"Galvanising",      qcHints:"DFT per coat, adhesion, visual" },
  { id:"blast",    label:"Blasting",         qcHints:"Sa grade, DFT reading, anchor profile" },
  { id:"paint",    label:"Painting",         qcHints:"DFT per coat, adhesion, holiday test" },
];

const DEFAULT_PIPELINE_STEPS = [
  { step:"nesting",   type:"inhouse",  label:"Nesting"   },
  { step:"cutting",   type:"inhouse",  label:"Cutting"   },
  { step:"fitup",     type:"inhouse",  label:"Fit-Up"    },
  { step:"welding",   type:"inhouse",  label:"Welding"   },
  { step:"blasting",  type:"inhouse",  label:"Blasting"  },
  { step:"painting",  type:"inhouse",  label:"Painting"  },
  { step:"mdcc",      type:"inhouse",  label:"MDCC"      },
];

const DEFAULT_PROCESS_TYPES = [
  { id:"PT-NEST",  name:"Nesting",          type:"inhouse",  color:"#6366F1", canDelete:false },
  { id:"PT-CUT",   name:"Cutting",          type:"inhouse",  color:"#3B82F6", canDelete:false },
  { id:"PT-FITUP", name:"Fit-Up",           type:"inhouse",  color:"#8B5CF6", canDelete:false },
  { id:"PT-WELD",  name:"Welding",          type:"inhouse",  color:"#F59E0B", canDelete:false },
  { id:"PT-BLAST", name:"Blasting",         type:"inhouse",  color:"#EF4444", canDelete:false },
  { id:"PT-PAINT", name:"Painting",         type:"inhouse",  color:"#10B981", canDelete:false },
  { id:"PT-MDCC",  name:"MDCC",             type:"inhouse",  color:"#06B6D4", canDelete:false },
  { id:"PT-GALV",  name:"Galvanising",      type:"outbound", color:"#F59E0B", canDelete:true  },
  { id:"PT-ROLL",  name:"Rolling",          type:"outbound", color:"#8B5CF6", canDelete:true  },
  { id:"PT-BEND",  name:"Bending",          type:"outbound", color:"#EC4899", canDelete:true  },
  { id:"PT-STRESS",name:"Stress Relieving", type:"outbound", color:"#EF4444", canDelete:true  },
  { id:"PT-MACH",  name:"Machining",        type:"outbound", color:"#6366F1", canDelete:true  },
  { id:"PT-HOTDIP",name:"Hot-Dip Coating",  type:"outbound", color:"#F97316", canDelete:true  },
];

// Build drawing instance ID
// buildDIId imported from helpers.js

// Build default process steps for a drawing
const buildDefaultProcessSteps = (drawing) => DEFAULT_PIPELINE_STEPS.map(s=>({...s}));

// Get next step in a drawing instance's pipeline
const getDIPipelineNext = (di, currentStep) => {
  const steps = di?.processSteps || DEFAULT_PIPELINE_STEPS;
  const idx = steps.findIndex(s=>s.step===currentStep);
  if (idx===-1||idx>=steps.length-1) return null;
  return steps[idx+1];
};

// Get display label for pipeline
const getPipelineLabel = (steps) =>
  (steps||DEFAULT_PIPELINE_STEPS).map(s=>s.label||s.step).join(" → ");

// Migrate orders to create drawing instances
// ─── UNIQUE ID HELPERS ────────────────────────────────────────────────────────

// Extract order prefix: last 3 digits after final '/' in orderNo
// FXL26-27/0001 → "001", FXL26-27/0123 → "123"
// getOrderPrefix, detectDrawingPrefix, getDrawingShortCode, buildDIUniqueId,
// buildPartUniqueId, computePartBaseUniqueId, computeTotalPieces — imported from helpers.js

const migrateDrawingInstances = (orders, existingInstances) => {
  const existing = new Set((existingInstances||[]).map(di=>di.id));
  const newInstances = [];
  (orders||[]).forEach(order=>{
    const orderPrefix = getOrderPrefix(order.orderNo||order.id);
    const drawings = order.drawings||[];
    // Use stored prefix override if available, otherwise auto-detect
    const strippedPrefix = order.drawingPrefix !== undefined ? order.drawingPrefix : detectDrawingPrefix(drawings);
    drawings.forEach(drawing=>{
      const qty = drawing.qty||1;
      const shortCode = drawing.shortCode || getDrawingShortCode(drawing.drawingNo||"", strippedPrefix);
      for (let i=1; i<=qty; i++) {
        const id = buildDIId(drawing.id, i);
        if (!existing.has(id)) {
          const uniqueId = buildDIUniqueId(orderPrefix, shortCode, i, qty);
          newInstances.push({
            id,
            drawingId:    drawing.id,
            drawingNo:    drawing.drawingNo,
            orderId:      order.id,
            orderNo:      order.id,
            instanceNo:   i,
            totalInstances: qty,
            uniqueId,
            shortCode,
            orderPrefix,
            status:       "unreleased",
            processSteps: buildDefaultProcessSteps(drawing),
            releaseId:    null,
            dprId:        null,
            createdAt:    new Date().toISOString(),
            isAutoMigrated: true,
          });
        }
      }
    });
  });
  return newInstances;
};

const STAGE_NEXT = {
  cutting:"cutting_qc", cutting_qc:"awaiting_collection", awaiting_collection:"fitup",
  fitup:"welding", welding:"tpi_weld", tpi_weld:"blasting",
  tpi_fitup:"welding", assembly:"blasting", blasting:"painting", tpi_blast:"painting",
  painting:"tpi_paint", tpi_paint:"mdcc", mdcc:"dispatch", dispatch:null,
};

const STAGE_CHECKLISTS = {
  cutting_qc: ["Length verified (±2mm)","Width/height verified","All pieces measured","Cut face smooth","Grinding complete","No heat distortion","All parts stamped","Stamp location correct","Mark legible"],
  fitup:    ["All parts present and piece marked","Joint gap within spec (per WPS)","Alignment correct — no angular distortion","Tack welds placed correctly","Temporary supports/cleats in place","Drawing reference checked","Dimensional check — overall length/width/height","Squareness check","Joint fit-up gap measured and within tolerance","Camber/pre-set per drawing (if specified)","Weld joint preparation adequate"],
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

const SupervisorQueue = ({ user, instances, setInstances, orders, tpiAgencies, releases, machines, welders, productionStandards, onBack, ncrs, setNcrs, notifications, setNotifications, correctionsLog, setCorrectionsLog, scrapQueue, setScrapQueue }) => {
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
  const [weldingForm, setWeldingForm] = useState({ welderId:"", welderName:"", wpsUsed:"", ndtRequired:false, ndtTypes:[], ndtAgency:"", ndtReport:"", ndtResult:"pass", ndtDate:"", ndtFailReason:"" });
  const [devBlastHours, setDevBlastHours] = useState("3");
  const [devCoatHours, setDevCoatHours]   = useState("4");
  const [cuttingMeasurements, setCuttingMeasurements] = useState({}); // {[markNo]: {actualL:"", actualW:"", failReason:""}}
  const [dftReadings, setDftReadings] = useState([]); // [{value:"", location:""}]
  const [now, setNow] = useState(Date.now());

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
        weldingSequence: ord?.quality?.weldingSequence || ord?.quality?.weldSpec?.weldingSequence || "",
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
    .filter(g => user.role !== 'qc_user' || !g.assignedEngineer || g.assignedEngineer === user.id || g.assignedEngineer === user.username)
    .sort((a,b)=>{
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (b.rejCount !== a.rejCount) return b.rejCount - a.rejCount;
      return (a.endDate||"") < (b.endDate||"") ? -1 : 1;
    });

  useEffect(()=>{
    const id = setInterval(()=>setNow(Date.now()), 10000);
    return ()=>clearInterval(id);
  }, []);

  const resetApproval = () => { setChecks({}); setDft(""); setDocRefs({}); setTpiForm({agency:"",reportNo:"",reportDate:"",outcome:"pass"}); setRejectMode(false); setRejectReason(""); setMdccRefNo(""); setDimReadings({}); setLocalChecks({}); setWeldingForm({welderId:"",welderName:"",wpsUsed:"",ndtRequired:false,ndtTypes:[],ndtAgency:"",ndtReport:"",ndtResult:"pass",ndtDate:"",ndtFailReason:""}); setCuttingMeasurements({}); setDftReadings([]); };

  const doApprove = (group, remarks) => {
    const stage = group.stage;
    const isTpi = TPI_STAGES.includes(stage);
    const orderForGroup = orders.find(o=>o.id===group.orderId);
    const orderQuality = orderForGroup?.quality||{};
    let nextStage = STAGE_NEXT[stage];
    if (stage==="fitup") {
      nextStage = (orderQuality.tpiHoldPoints||[]).includes('fit_up') ? 'tpi_fitup' : 'welding';
    } else if (stage==="tpi_weld" || stage==="welding") {
      const drg = orderForGroup?.drawings?.find(d=>d.id===group.drawingId);
      const hasTpiGate = (orderQuality.tpiHoldPoints||[]).includes('welding');
      if (stage==="welding" && hasTpiGate) {
        // No assembly routing — TPI gate takes precedence (nextStage already set by STAGE_NEXT)
      } else if (drg?.assemblyGroup) {
        const asmDef = (orderForGroup?.assemblies||[]).find(a=>(a.drawingsAssigned||[]).includes(group.drawingId));
        const siblingIds = (asmDef?.drawingsAssigned||[]).filter(id=>id!==group.drawingId);
        const allSiblingsDone = siblingIds.every(sibId=>{
          const sibInsts = instances.filter(i=>i.drawingId===sibId&&i.orderId===group.orderId);
          if (!sibInsts.length) return false;
          const pastWeld = ["assembly","assembly_hold","blasting","tpi_blast","painting","tpi_paint","mdcc","dispatch"];
          return sibInsts.every(i=>pastWeld.includes(i.currentStage)||
            (i.currentStage==="tpi_weld"&&i.currentStatus==="completed")||
            (i.currentStage==="welding"&&i.currentStatus==="completed"));
        });
        if (allSiblingsDone) {
          nextStage = 'assembly';
        } else {
          nextStage = '__assembly_hold__'; // special sentinel
        }
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

    const isAssemblyHold = nextStage === '__assembly_hold__';
    const effectiveNextStage = isAssemblyHold ? 'assembly' : nextStage;

    setInstances(prev => {
      const entry = { stage, signedOffBy:user.username, signedOffName:user.name, signedOffDate:today(),
        checklistItems:checkedItems, dftReading:dft||null, dftReadingsDetailed: dftReadings.length>0 ? dftReadings.map(r=>({value:+r.value||0,location:r.location||"",takenAt:new Date().toISOString(),takenBy:user.username})) : undefined, dftAvg: dftReadings.length>0 ? +(dftReadings.map(r=>+r.value).filter(Boolean).reduce((s,v,_,a)=>s+v/a.length,0).toFixed(1)) : undefined, docRefs:docRefs||{}, remarks:remarks||"",
        dimReadings: Object.keys(dimReadings).length>0 ? Object.entries(dimReadings).map(([markNo,measuredMm])=>({markNo,measuredMm:+measuredMm})) : undefined,
        ...(isTpi ? { tpiAgency:tpiForm.agency, tpiReportNo:tpiForm.reportNo, tpiReportDate:tpiForm.reportDate, tpiOutcome:tpiForm.outcome } : {}),
        ...(stage==="mdcc" ? { mdccRefNo } : {}),
        ...(stage==="welding" ? {
          weldingDetails:{ welderId:weldingForm.welderId, welderName:weldingForm.welderName||"", wpsUsed:weldingForm.wpsUsed, completedAt:new Date().toISOString(), completedBy:user.id||user.username },
          ndtDetails:weldingForm.ndtRequired ? { required:true, types:weldingForm.ndtTypes, agency:weldingForm.ndtAgency, reportLink:weldingForm.ndtReport, result:weldingForm.ndtResult, date:weldingForm.ndtDate } : { required:false },
        } : {}),
        ...(stage==="cutting_qc" ? {
          cuttingQcMeasurements: Object.entries(cuttingMeasurements).filter(([k])=>k!=='_failReason').map(([markNo,m])=>({markNo, actualL:+m.actualL||null, actualW:+m.actualW||null})),
          cuttingQcApprovedAt: new Date().toISOString(),
          cuttingQcApprovedBy: user.id||user.username,
        } : {}),
        ...(stage==="fitup" ? {
          fitupQcMeasurements: [['fitupLength','Overall Length'],['fitupWidth','Overall Width'],['fitupHeight','Overall Height'],['fitupDiag1','Diagonal 1'],['fitupDiag2','Diagonal 2']].filter(([k])=>docRefs[k]).map(([k,dim])=>({dim, actual:+docRefs[k]})),
          fitupQcApprovedAt: new Date().toISOString(),
          fitupQcApprovedBy: user.id||user.username,
        } : {}),
        ...(stage==="blasting" ? { blastingCompletedAt: new Date().toISOString() } : {}),
        ...(stage==="painting" ? { appliedAt: new Date().toISOString() } : {}),
      };

      let updated = prev.map(i => {
        if (!ids.includes(i.instanceId)) return i;
        const hist = [...(i.stageHistory||[])];
        const idx = hist.findIndex(h=>h.stage===stage);
        if (idx>=0) hist[idx]={...hist[idx],...entry}; else hist.push(entry);
        return {
          ...i,
          currentStage: isAssemblyHold ? 'assembly' : (effectiveNextStage || stage),
          currentStatus: isAssemblyHold ? 'assembly_hold' : (effectiveNextStage ? "in_progress" : "completed"),
          stageHistory: hist,
          ...(stage==="blasting" ? { blastingCompletedAt: entry.blastingCompletedAt } : {}),
        };
      });

      // If advancing to assembly (not hold), also release any assembly_hold siblings
      if (!isAssemblyHold && (stage==="tpi_weld"||stage==="welding") && effectiveNextStage==="assembly") {
        const ord = prev.find(i=>ids.includes(i.instanceId));
        if (ord) {
          const orderForGrp = orders.find(o=>o.id===ord.orderId);
          const thisDrawing = orderForGrp?.drawings?.find(d=>d.id===ord.drawingId);
          if (thisDrawing?.assemblyGroup) {
            const asmDef = (orderForGrp?.assemblies||[]).find(a=>(a.drawingsAssigned||[]).includes(ord.drawingId));
            const siblingIds = (asmDef?.drawingsAssigned||[]);
            updated = updated.map(i=>{
              if (i.currentStage==="assembly"&&i.currentStatus==="assembly_hold"&&i.orderId===ord.orderId&&siblingIds.includes(i.drawingId)) {
                return {...i, currentStatus:"in_progress"};
              }
              return i;
            });
          }
        }
      }

      return updated;
    });
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
    const ndtGateOk = stage!=="welding" || !weldingForm.ndtRequired || weldingForm.ndtResult==="pass";
    const cuttingQcGateOk = stage!=="cutting_qc" || (() => {
      const anyFailed = Object.entries(cuttingMeasurements).filter(([k])=>k!=='_failReason').some(([markNo,m])=>{
        const order = orders.find(o=>o.id===selGD.orderId);
        const part = (order?.parts||[]).find(p=>p.markNo===markNo&&p.drawingId===selGD.drawingId);
        const getTol = (d)=>+d<=500?2:+d<=2000?3:5;
        const lFail = part?.length&&m.actualL&&Math.abs(+m.actualL-+part.length)>getTol(part.length);
        const wFail = part?.width&&m.actualW&&Math.abs(+m.actualW-+part.width)>getTol(part.width);
        return lFail||wFail;
      });
      return !anyFailed || (cuttingMeasurements._failReason||"").trim().length>0;
    })();
    const holidayGateOk = stage!=="painting" || docRefs['holidayResult']!=="fail";
    const allChecked = checklist.every(item=>checks[item]) && tpiDetailsOk && mdccOk && ndtGateOk && cuttingQcGateOk && holidayGateOk;

    return (
      <div>
        <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:20 }}>
          <button onClick={()=>{resetApproval();setSelGroup(null);}} style={css.btn.ghost}>← Approval Queue</button>
        </div>
        {stage==="cutting_qc" && (() => {
          const order = orders.find(o=>o.id===selGD.orderId);
          const drg = order?.drawings?.find(d=>d.id===selGD.drawingId);
          const part = (order?.parts||[]).find(p=>p.markNo===selGD.markNo&&p.drawingId===selGD.drawingId);
          const matCode = part?.matCode || selGD.insts[0]?.matCode || "";
          const approvedMakesStr = (order?.quality?.approvedMakes||[]).join(", ");
          return (
            <div style={{background:T.bgInput,borderRadius:6,padding:"8px 14px",marginBottom:12,fontSize:12,display:"flex",gap:16,flexWrap:"wrap"}}>
              <span style={{color:T.textMid}}>📋 <a href="#" style={{color:T.accent}} onClick={e=>{e.preventDefault();}}>Part List</a></span>
              {drg?.driveLink && <a href={drg.driveLink} target="_blank" rel="noreferrer" style={{color:T.accent}}>📐 Drawing</a>}
              <span style={{color:T.textMid}}>🔩 RM: <strong style={{color:T.text}}>{matCode}</strong>{order?.quality?.grade&&` — Grade ${order.quality.grade}`}{approvedMakesStr&&` — Makes: ${approvedMakesStr}`}</span>
            </div>
          );
        })()}
        {stage==="fitup" && (() => {
          const order = orders.find(o=>o.id===selGD.orderId);
          const drg = order?.drawings?.find(d=>d.id===selGD.drawingId);
          const weldSpec = order?.quality?.weldSpec||{};
          return (
            <div style={{background:T.bgInput,borderRadius:6,padding:"8px 14px",marginBottom:12,fontSize:12,display:"flex",gap:16,flexWrap:"wrap"}}>
              {drg?.driveLink && <a href={drg.driveLink} target="_blank" rel="noreferrer" style={{color:T.accent}}>📐 Assembly Drawing</a>}
              {weldSpec.process && <span style={{color:T.textMid}}>📋 Weld Spec: <strong style={{color:T.text}}>{weldSpec.process}</strong></span>}
              <span style={{color:T.textMid}}>📏 General tolerance: ±3mm</span>
            </div>
          );
        })()}
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
            <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:8}}>KEY DIMENSIONS (mm)</div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{color:T.textMid,fontSize:11}}>
                  <th style={{textAlign:"left",padding:"3px 8px"}}>Dimension</th>
                  <th style={{textAlign:"left",padding:"3px 8px"}}>Drawing Value</th>
                  <th style={{textAlign:"left",padding:"3px 8px"}}>Actual</th>
                  <th style={{textAlign:"left",padding:"3px 8px"}}>Result</th>
                </tr>
              </thead>
              <tbody>
                {[['fitupLength','Overall Length','—'],['fitupWidth','Overall Width','—'],['fitupHeight','Overall Height','—'],['fitupDiag1','Diagonal 1','—'],['fitupDiag2','Diagonal 2','—']].map(([k,l,target])=>{
                  return (
                    <tr key={k} style={{borderTop:`1px solid ${T.border}`}}>
                      <td style={{padding:"5px 8px",color:T.textMid}}>{l}</td>
                      <td style={{padding:"5px 8px",color:T.textLow}}>—</td>
                      <td style={{padding:"5px 8px"}}>
                        <input type="number" value={docRefs[k]||''} onChange={e=>setDocRefs(p=>({...p,[k]:e.target.value}))}
                          placeholder="mm" style={{...css.input,width:90,padding:"3px 6px",fontSize:12}} />
                      </td>
                      <td style={{padding:"5px 8px",color:T.textMid}}>Recorded</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
        {/* Welding: welder tracking + enhanced NDT */}
        {stage==="welding" && (() => {
          const order = orders.find(o=>o.id===selGD.orderId);
          const qual = order?.quality||{};
          // Find contractorId from releases for this drawing
          let contractorId = "";
          for (const rel of releases||[]) {
            const d = (rel.drawings||[]).find(d=>d.drawingId===selGD.drawingId&&d.orderId===selGD.orderId);
            if (d?.contractorId) { contractorId = d.contractorId; break; }
          }
          const contrWelders = (welders||[]).filter(w=>w.active && (!contractorId || w.contractorId===contractorId));
          const selWelder = contrWelders.find(w=>w.id===weldingForm.welderId);
          const weldSpec = qual.weldSpec||{};
          const ndtOk = !weldingForm.ndtRequired || weldingForm.ndtResult==="pass";
          return (
            <div style={{...css.card,marginBottom:14}}>
              {/* Reference links */}
              <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap",fontSize:12}}>
                {order?.drawings?.find(d=>d.id===selGD.drawingId)?.driveLink && (
                  <a href={order.drawings.find(d=>d.id===selGD.drawingId).driveLink} target="_blank" rel="noreferrer"
                    style={{color:T.accent}}>📐 Drawing</a>
                )}
                {weldSpec.process && <span style={{color:T.textMid}}>🔧 Weld Spec: <strong style={{color:T.text}}>{weldSpec.process}</strong>{weldSpec.electrode&&` — Electrode: ${weldSpec.electrode}`}</span>}
              </div>
              <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:10}}>WELDER SIGN-OFF</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                <div>
                  <label style={css.label}>Welder</label>
                  {contrWelders.length>0 ? (
                    <select value={weldingForm.welderId} onChange={e=>{
                      const w=contrWelders.find(x=>x.id===e.target.value);
                      setWeldingForm(f=>({...f,welderId:e.target.value,welderName:w?.name||""}));
                    }} style={css.input}>
                      <option value="">Select welder...</option>
                      {contrWelders.map(w=><option key={w.id} value={w.id}>{w.name} ({(w.certifications||[]).map(c=>c.process).join("/")})</option>)}
                    </select>
                  ) : (
                    <input value={weldingForm.welderName} onChange={e=>setWeldingForm(f=>({...f,welderName:e.target.value}))}
                      style={css.input} placeholder="Enter welder name" />
                  )}
                  {contrWelders.length===0 && <div style={{fontSize:10,color:T.amber,marginTop:2}}>Add welders in Masters → Welders for dropdown selection</div>}
                </div>
                <div>
                  <label style={css.label}>WPS Used</label>
                  <input value={weldingForm.wpsUsed} onChange={e=>setWeldingForm(f=>({...f,wpsUsed:e.target.value}))}
                    style={css.input} placeholder={weldSpec.process||"e.g. WPS-001 IS 2062 E250"} />
                </div>
              </div>
              {selWelder && (
                <div style={{background:T.bgInput,borderRadius:5,padding:"6px 10px",marginBottom:10,fontSize:11}}>
                  Cert: {selWelder.certifications.map(c=>`${c.process} ${c.position} — ${c.certNo} (exp ${c.expiryDate})`).join(" | ")}
                </div>
              )}
              <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:8}}>WELD MEASUREMENTS</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                <div><label style={css.label}>Weld Gauge Reading (mm)</label><input type="number" value={docRefs['weldGauge']||''} onChange={e=>setDocRefs(p=>({...p,weldGauge:e.target.value}))} style={{...css.input,width:"100%"}} /></div>
                <div><label style={css.label}>Post-Weld Length (mm)</label><input type="number" value={docRefs['postWeldLength']||''} onChange={e=>setDocRefs(p=>({...p,postWeldLength:e.target.value}))} style={{...css.input,width:"100%"}} /></div>
              </div>
              <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:8}}>NDT (NON-DESTRUCTIVE TESTING)</div>
              <div style={{display:"flex",gap:16,marginBottom:8}}>
                {[true,false].map(v=>(
                  <label key={String(v)} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13}}>
                    <input type="radio" checked={weldingForm.ndtRequired===v}
                      onChange={()=>setWeldingForm(f=>({...f,ndtRequired:v}))} />
                    {v?"NDT Required":"NDT Not Required"}
                  </label>
                ))}
              </div>
              {weldingForm.ndtRequired && (
                <div>
                  <div style={{marginBottom:8}}>
                    <label style={css.label}>NDT Type(s)</label>
                    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                      {["UT","RT","PT","MT"].map(t=>(
                        <label key={t} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13}}>
                          <input type="checkbox" checked={(weldingForm.ndtTypes||[]).includes(t)}
                            onChange={e=>setWeldingForm(f=>({...f,ndtTypes:e.target.checked?[...(f.ndtTypes||[]),t]:(f.ndtTypes||[]).filter(x=>x!==t)}))} />
                          {t}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                    <div><label style={css.label}>NDT Agency</label><input value={weldingForm.ndtAgency} onChange={e=>setWeldingForm(f=>({...f,ndtAgency:e.target.value}))} style={css.input} placeholder="Agency name" /></div>
                    <div><label style={css.label}>NDT Date</label><input type="date" value={weldingForm.ndtDate} onChange={e=>setWeldingForm(f=>({...f,ndtDate:e.target.value}))} style={css.input} /></div>
                    <div style={{gridColumn:"span 2"}}><label style={css.label}>NDT Report Link</label><input value={weldingForm.ndtReport} onChange={e=>setWeldingForm(f=>({...f,ndtReport:e.target.value}))} style={css.input} placeholder="Drive link..." /></div>
                  </div>
                  <div style={{marginBottom:8}}>
                    <label style={css.label}>NDT Result</label>
                    <div style={{display:"flex",gap:16}}>
                      {[["pass","Pass — Proceed"],["fail","Fail — Rework required"]].map(([v,l])=>(
                        <label key={v} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13}}>
                          <input type="radio" checked={weldingForm.ndtResult===v} onChange={()=>setWeldingForm(f=>({...f,ndtResult:v}))} />
                          <span style={{color:v==="fail"?T.red:T.text}}>{l}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {weldingForm.ndtResult==="fail" && (
                    <div>
                      <label style={css.label}>Fail Reason *</label>
                      <textarea value={weldingForm.ndtFailReason} onChange={e=>setWeldingForm(f=>({...f,ndtFailReason:e.target.value}))}
                        rows={2} style={{...css.input,width:"100%",resize:"vertical",fontFamily:T.font}} />
                      <div style={{fontSize:11,color:T.red,marginTop:4}}>NDT Fail — approval is blocked until result is changed to Pass or NDT is waived by Production Engineer.</div>
                    </div>
                  )}
                  {!ndtOk && (
                    <div style={{padding:"8px 12px",background:T.redBg,border:`1px solid ${T.red}44`,borderRadius:6,fontSize:12,color:T.red,marginTop:8}}>
                      ⛔ NDT required and result is FAIL — cannot approve this stage.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
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
          const blastEntry = (selGD.insts[0]?.stageHistory||[]).slice().reverse().find(h=>h.stage==="blasting"&&h.signedOffDate);
          if (!blastEntry?.signedOffDate) return null;
          const ambTh = productionStandards?.blastThresholds?.amberHours ?? 3;
          const redTh = productionStandards?.blastThresholds?.redHours ?? 4;
          return (
            <div style={{...css.card,marginBottom:14,border:`1px solid ${T.accent}44`,background:T.bgInput}}>
              <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:4}}>PRIMER WINDOW REQUIREMENT</div>
              <div style={{fontSize:12,color:T.text}}>Primer must be applied within <strong style={{color:T.amber}}>{redTh} hours</strong> of blast completion. Warning at {ambTh}h.</div>
              <div style={{fontSize:11,color:T.textMid,marginTop:4}}>Blasting sign-off recorded — primer countdown will start on painting stage.</div>
            </div>
          );
        })()}
        {/* DEV: Blast time setter — super_admin only */}
        {stage==="blasting" && user.role==="super_admin" && (
          <div style={{...css.card,marginBottom:14,border:"1px solid #7c3aed55",background:"#7c3aed0a",padding:"10px 14px"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#a78bfa",marginBottom:8}}>⚙ DEV — Set blastingCompletedAt</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <select value={devBlastHours} onChange={e=>setDevBlastHours(e.target.value)} style={{...css.input,width:130}}>
                {["1","2","3","3.5","4","5"].map(h=><option key={h} value={h}>{h}h ago</option>)}
              </select>
              <button onClick={()=>{
                const ts = new Date(Date.now()-parseFloat(devBlastHours)*3600000).toISOString();
                const ids = selGD.insts.map(i=>i.instanceId);
                setInstances(prev=>prev.map(i=>ids.includes(i.instanceId)?{...i,blastingCompletedAt:ts}:i));
              }} style={{...css.btn.ghost,fontSize:12,color:"#a78bfa",borderColor:"#7c3aed55"}}>Set</button>
              <span style={{fontSize:11,color:T.textLow}}>Sets instance.blastingCompletedAt for painting stage timer</span>
            </div>
          </div>
        )}
        {/* Time to primer warning — shown on painting stage */}
        {isPainting && (() => {
          const inst0 = selGD.insts[0];
          const blastTs = inst0?.blastingCompletedAt || (()=>{
            const h = (inst0?.stageHistory||[]).slice().reverse().find(h=>h.stage==='blasting'&&h.signedOffDate);
            return h?.signedOffDate ? h.signedOffDate : null;
          })();
          if (!blastTs) return null;
          const hrs = (now - new Date(blastTs).getTime()) / 3600000;
          const ambTh = productionStandards?.blastThresholds?.amberHours ?? 3;
          const redTh = productionStandards?.blastThresholds?.redHours ?? 4;
          const isRed = hrs >= redTh;
          const isAmber = !isRed && hrs >= ambTh;
          const col = isRed ? T.red : isAmber ? T.amber : T.green;
          const hh = Math.floor(hrs); const mm = Math.floor((hrs-hh)*60); const ss = Math.floor(((hrs-hh)*60-mm)*60);
          const timeStr = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
          const msg = isRed ? `❌ Re-blast may be required — ${hrs.toFixed(1)}h since blasting (>${redTh}h limit)` :
            isAmber ? `⚠ Apply primer soon — ${hrs.toFixed(1)}h elapsed (>${ambTh}h amber threshold)` :
            `✅ Surface ready for primer — ${hrs.toFixed(1)}h elapsed`;
          return (
            <div style={{background:col+'22',border:`1px solid ${col}`,borderRadius:6,padding:'8px 12px',marginBottom:12}}>
              <div style={{color:col,fontSize:13,fontWeight:isRed?700:500}}>{msg}</div>
              <div style={{color:col,fontSize:20,fontFamily:T.fontMono,fontWeight:800,marginTop:4}}>⏱ {timeStr}</div>
              {isRed && !inst0?.reblastWaivedBy && (
                <div style={{marginTop:8,display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:11,color:T.red}}>Production Engineer override required to proceed without re-blast.</span>
                  <button onClick={()=>{
                    const reason = prompt("Enter override reason for proceeding without re-blast:");
                    if (!reason?.trim()) return;
                    setInstances(prev=>prev.map(i=>selGD.insts.some(si=>si.instanceId===i.instanceId)?{...i,reblastWaivedBy:user.username,reblastWaivedReason:reason,reblastWaivedAt:new Date().toISOString()}:i));
                  }} style={{...css.btn.ghost,fontSize:11,color:T.amber,borderColor:T.amber}}>Override (PE)</button>
                </div>
              )}
              {inst0?.reblastWaivedBy && (
                <div style={{marginTop:4,fontSize:11,color:T.amber}}>Override granted by {inst0.reblastWaivedBy}</div>
              )}
            </div>
          );
        })()}
        {/* DEV: Coat applied time setter — super_admin only */}
        {isPainting && user.role==="super_admin" && (
          <div style={{...css.card,marginBottom:10,border:"1px solid #7c3aed55",background:"#7c3aed0a",padding:"10px 14px"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#a78bfa",marginBottom:8}}>⚙ DEV — Set last coat appliedAt</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <select value={devCoatHours} onChange={e=>setDevCoatHours(e.target.value)} style={{...css.input,width:140}}>
                {["1","4","8","12","24","36"].map(h=><option key={h} value={h}>{h}h ago</option>)}
              </select>
              <button onClick={()=>{
                const ts = new Date(Date.now()-parseFloat(devCoatHours)*3600000).toISOString();
                const ids = selGD.insts.map(i=>i.instanceId);
                setInstances(prev=>prev.map(i=>{
                  if (!ids.includes(i.instanceId)) return i;
                  const hist = [...(i.stageHistory||[])];
                  let lastPaintIdx = -1;
                  for (let j=hist.length-1; j>=0; j--) { if (hist[j].stage==="painting") { lastPaintIdx=j; break; } }
                  if (lastPaintIdx>=0) hist[lastPaintIdx]={...hist[lastPaintIdx],appliedAt:ts};
                  return {...i,stageHistory:hist};
                }));
              }} style={{...css.btn.ghost,fontSize:12,color:"#a78bfa",borderColor:"#7c3aed55"}}>Set</button>
              <span style={{fontSize:11,color:T.textLow}}>Sets last painting stageHistory entry's appliedAt for dry time countdown</span>
            </div>
          </div>
        )}
        {/* Painting DFT per coat */}
        {isPainting && (
          <div style={{...css.card,marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:8}}>PAINT BATCH & ENVIRONMENT</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
              <div><label style={css.label}>Paint Batch No.</label><input value={docRefs['paintBatchNo']||''} onChange={e=>setDocRefs(p=>({...p,paintBatchNo:e.target.value}))} style={{...css.input,width:'100%'}} /></div>
              <div><label style={css.label}>Temp (°C)</label><input type="number" value={docRefs['envTemp']||''} onChange={e=>setDocRefs(p=>({...p,envTemp:e.target.value}))} style={{...css.input,width:'100%'}} /></div>
              <div><label style={css.label}>RH (%)</label><input type="number" value={docRefs['envRH']||''} onChange={e=>setDocRefs(p=>({...p,envRH:e.target.value}))} style={{...css.input,width:'100%'}} /></div>
              <div><label style={css.label}>Dew Point (°C)</label><input type="number" value={docRefs['envDewPt']||''} onChange={e=>setDocRefs(p=>({...p,envDewPt:e.target.value}))} style={{...css.input,width:'100%'}} /></div>
              <div><label style={css.label}>Surface Temp (°C)</label><input type="number" value={docRefs['envSurfTemp']||''} onChange={e=>setDocRefs(p=>({...p,envSurfTemp:e.target.value}))} style={{...css.input,width:'100%'}} />
                {(docRefs['envSurfTemp']&&docRefs['envDewPt'])&&<div style={{fontSize:11,color:+docRefs['envSurfTemp']>=(+docRefs['envDewPt']+3)?T.green:T.red,marginTop:2}}>{+docRefs['envSurfTemp']>=(+docRefs['envDewPt']+3)?"OK (surface ≥ dew+3)":"WARNING: surface temp too low"}</div>}
              </div>
            </div>
            <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:6}}>DFT READINGS (µm)</div>
            {dftReadings.map((r,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:6,alignItems:"center"}}>
                <input type="number" value={r.value||""} onChange={e=>setDftReadings(prev=>{const n=[...prev];n[i]={...n[i],value:e.target.value};return n;})}
                  placeholder="µm" style={{...css.input,width:80}} />
                <input value={r.location||""} onChange={e=>setDftReadings(prev=>{const n=[...prev];n[i]={...n[i],location:e.target.value};return n;})}
                  placeholder="Location (e.g. Top flange)" style={{...css.input,flex:1}} />
                <button onClick={()=>setDftReadings(prev=>prev.filter((_,j)=>j!==i))} style={{...css.btn.ghost,padding:"5px 8px",fontSize:11}}>✕</button>
              </div>
            ))}
            {dftReadings.length<10 && (
              <button onClick={()=>setDftReadings(prev=>[...prev,{value:"",location:""}])} style={{...css.btn.ghost,fontSize:11,marginBottom:8}}>+ Add Reading</button>
            )}
            {dftReadings.length>0 && (() => {
              const vals = dftReadings.map(r=>+r.value).filter(Boolean);
              if (!vals.length) return null;
              const avg = vals.reduce((s,v)=>s+v,0)/vals.length;
              const min = Math.min(...vals);
              const order = orders.find(o=>o.id===selGD.orderId);
              const paintCoats = getPaintCoats(order?.quality);
              const coatsDone = (selGD.insts[0]?.stageHistory||[]).filter(h=>h.stage==="painting").length;
              const currentCoat = paintCoats[coatsDone];
              const target = currentCoat?.dft||0;
              const pass = !target || avg >= target;
              return (
                <div style={{background:pass?T.greenBg:T.redBg,border:`1px solid ${pass?T.green:T.red}44`,borderRadius:6,padding:"8px 12px",fontSize:12}}>
                  <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                    <span>Avg: <strong style={{color:pass?T.green:T.red}}>{avg.toFixed(1)} µm</strong></span>
                    <span>Min: <strong style={{color:min<(target*0.9)?T.amber:T.text}}>{min.toFixed(0)} µm</strong></span>
                    {target>0&&<span>Target: <strong>{target} µm</strong></span>}
                    <span style={{fontWeight:700,color:pass?T.green:T.red}}>{pass?"✅ PASS":"❌ FAIL — below target"}</span>
                  </div>
                  {min<(target||0)*0.9&&<div style={{color:T.amber,marginTop:4,fontSize:11}}>⚠ Min reading below 90% of target — check low spots</div>}
                </div>
              );
            })()}
          </div>
        )}
        {/* Painting: dry time enforcement + holiday detection + DFT summary */}
        {isPainting && (() => {
          const order = orders.find(o=>o.id===selGD.orderId);
          const paintCoats = getPaintCoats(order?.quality);
          // Determine current coat from stageHistory
          const paintHistory = (selGD.insts[0]?.stageHistory||[]).filter(h=>h.stage==="painting");
          const coatsDone = paintHistory.length;
          const currentCoat = paintCoats[coatsDone] || null;
          const lastCoatEntry = paintHistory[paintHistory.length-1];
          // Dry time check
          let dryTimeRemaining = null;
          if ((lastCoatEntry?.appliedAt || lastCoatEntry?.signedOffDate) && currentCoat?.dryTime) {
            const lastApproval = new Date(lastCoatEntry.appliedAt || lastCoatEntry.signedOffDate).getTime();
            const dryMs = (currentCoat.dryTime||0) * 3600000;
            const elapsed = now - lastApproval;
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
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textMid, marginBottom:8 }}>HOLIDAY DETECTION (Finish Coat)</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                    <div>
                      <label style={css.label}>Holiday Detector Instrument</label>
                      <input value={docRefs['holidayInstrument']||""} onChange={e=>setDocRefs(p=>({...p,holidayInstrument:e.target.value}))}
                        style={css.input} placeholder="e.g. Elcometer 270" />
                    </div>
                    <div>
                      <label style={css.label}>Test Voltage (V)</label>
                      <input type="number" value={docRefs['holidayVoltage']||""} onChange={e=>setDocRefs(p=>({...p,holidayVoltage:e.target.value}))}
                        style={css.input} placeholder="e.g. 67.5" />
                    </div>
                  </div>
                  <label style={css.label}>Holiday Test Result</label>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {[["none","No holidays found ✅"],["repaired","Holidays found and repaired ⚠"],["fail","Holidays found — not repaired ❌ (fail)"]].map(([v,l])=>(
                      <label key={v} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13}}>
                        <input type="radio" checked={docRefs['holidayResult']===v} onChange={()=>setDocRefs(p=>({...p,holidayResult:v}))} />
                        <span style={{color:v==="fail"?T.red:T.text}}>{l}</span>
                      </label>
                    ))}
                  </div>
                  {docRefs['holidayResult']==="fail" && (
                    <div style={{marginTop:8,padding:"8px 12px",background:T.redBg,border:`1px solid ${T.red}44`,borderRadius:6,fontSize:12,color:T.red}}>
                      ⛔ Holiday test FAIL — approval blocked. Stage cannot advance until holidays are repaired.
                    </div>
                  )}
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
          const paintSpec = getPaintCoats(paintOrder?.quality);
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
        {stage==="cutting_qc" && selGD.insts.length>0 && (()=>{
          const order = orders.find(o=>o.id===selGD.orderId);
          // Derive machine caps
          const nestingRunId = selGD.insts[0]?.nestingRunId;
          const relForRun = (releases||[]).find(r=>(r.machineAssignments||[]).some(ma=>ma.nestingRunId===nestingRunId));
          const machineId = relForRun ? ((relForRun.machineAssignments||[])[0]?.machineId||"") : "";
          const machineObj = (machines||[]).find(m=>m.id===machineId);
          const machineCaps = (machineObj?.capabilities||[]).map(c=>c.toLowerCase());

          const getTolerance = (dimMm) => {
            const d = +dimMm||0;
            if (d<=500) return 2;
            if (d<=2000) return 3;
            return 5;
          };
          const checkPass = (drawing, actual) => {
            if (!actual) return null;
            const tol = getTolerance(drawing);
            return Math.abs((+actual)-(+drawing)) <= tol;
          };

          const uniqueMarks = [...new Set(selGD.insts.map(i=>i.markNo))];
          const anyFailed = uniqueMarks.some(markNo=>{
            const part = (order?.parts||[]).find(p=>p.markNo===markNo&&p.drawingId===selGD.drawingId);
            const m = cuttingMeasurements[markNo]||{};
            const lPass = part?.length ? checkPass(part.length, m.actualL) : null;
            const wPass = part?.width ? checkPass(part.width, m.actualW) : null;
            return lPass===false || wPass===false;
          });

          return (
            <div style={{...css.card,marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,color:T.textMid,marginBottom:10}}>DIMENSIONAL MEASUREMENTS</div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr style={{color:T.textMid,fontSize:11}}>
                      <th style={{textAlign:"left",padding:"4px 8px"}}>Mark No</th>
                      <th style={{textAlign:"left",padding:"4px 8px"}}>Drawing L (mm)</th>
                      <th style={{textAlign:"left",padding:"4px 8px"}}>Drawing W (mm)</th>
                      <th style={{textAlign:"left",padding:"4px 8px"}}>Actual L</th>
                      <th style={{textAlign:"left",padding:"4px 8px"}}>Actual W</th>
                      <th style={{textAlign:"left",padding:"4px 8px"}}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueMarks.map(markNo=>{
                      const part = (order?.parts||[]).find(p=>p.markNo===markNo&&p.drawingId===selGD.drawingId);
                      const m = cuttingMeasurements[markNo]||{};
                      const lPass = (part?.length&&m.actualL) ? checkPass(part.length, m.actualL) : null;
                      const wPass = (part?.width&&m.actualW) ? checkPass(part.width, m.actualW) : null;
                      const rowFailed = lPass===false || wPass===false;
                      return (
                        <tr key={markNo} style={{borderTop:`1px solid ${T.border}`,background:rowFailed?T.redBg:"transparent"}}>
                          <td style={{padding:"6px 8px",fontFamily:T.fontMono,fontWeight:600,color:T.text}}>{markNo}</td>
                          <td style={{padding:"6px 8px",color:T.textMid}}>{part?.length||"—"}</td>
                          <td style={{padding:"6px 8px",color:T.textMid}}>{part?.width||"—"}</td>
                          <td style={{padding:"6px 8px"}}>
                            <input type="number" value={m.actualL||""} onChange={e=>setCuttingMeasurements(prev=>({...prev,[markNo]:{...prev[markNo],actualL:e.target.value}}))}
                              placeholder="mm" style={{...css.input,width:80,padding:"4px 6px",fontSize:12}} />
                          </td>
                          <td style={{padding:"6px 8px"}}>
                            <input type="number" value={m.actualW||""} onChange={e=>setCuttingMeasurements(prev=>({...prev,[markNo]:{...prev[markNo],actualW:e.target.value}}))}
                              placeholder="mm" style={{...css.input,width:80,padding:"4px 6px",fontSize:12}} />
                          </td>
                          <td style={{padding:"6px 8px"}}>
                            {(lPass!==null||wPass!==null) ? (
                              <span style={{fontWeight:700,color:rowFailed?T.red:T.green}}>
                                {rowFailed?"✗ FAIL":"✓ PASS"}
                              </span>
                            ) : <span style={{color:T.textLow}}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {anyFailed && (
                <div style={{marginTop:10}}>
                  <label style={css.label}>Failure Reason (mandatory when dimensions fail) *</label>
                  <textarea value={cuttingMeasurements._failReason||""} onChange={e=>setCuttingMeasurements(prev=>({...prev,_failReason:e.target.value}))}
                    rows={2} placeholder="Describe dimension failure..." style={{...css.input,width:"100%",resize:"vertical",fontFamily:T.font}} />
                </div>
              )}
              <div style={{marginTop:10,fontSize:11,color:T.textMid}}>
                Tolerance: ±2mm (≤500mm) · ±3mm (500–2000mm) · ±5mm (&gt;2000mm)
              </div>
              {/* Machine conditional items */}
              {machineCaps.includes('bevel') && (
                <div style={{marginTop:12}}>
                  <div style={{fontWeight:700,fontSize:12,color:T.text,marginBottom:6}}>BEVEL QC ITEMS</div>
                  {['Bevel angle correct per drawing','Bevel face clean and uniform','Bevel length matches requirement'].map((item,i)=>(
                    <label key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,cursor:"pointer"}}>
                      <input type="checkbox" checked={!!(localChecks||{})[`bevel_${i}`]} onChange={e=>setLocalChecks(c=>({...c,[`bevel_${i}`]:e.target.checked}))} />
                      <span style={{fontSize:13}}>{item}</span>
                    </label>
                  ))}
                </div>
              )}
              {machineCaps.includes('drill') && (
                <div style={{marginTop:12}}>
                  <div style={{fontWeight:700,fontSize:12,color:T.text,marginBottom:6}}>DRILL QC ITEMS</div>
                  {['Hole diameter correct','Hole position per drawing','Hole perpendicularity acceptable','Burrs removed'].map((item,i)=>(
                    <label key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,cursor:"pointer"}}>
                      <input type="checkbox" checked={!!(localChecks||{})[`drill_${i}`]} onChange={e=>setLocalChecks(c=>({...c,[`drill_${i}`]:e.target.checked}))} />
                      <span style={{fontSize:13}}>{item}</span>
                    </label>
                  ))}
                </div>
              )}
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
            <div style={{ display:"flex",gap:8,marginTop:10,flexWrap:"wrap" }}>
              <button onClick={()=>doReject(selGD)} disabled={!rejectReason.trim()}
                style={{ ...css.btn.danger,opacity:rejectReason.trim()?1:0.4 }}>Confirm Rejection</button>
              {can(user,"qc.raise_concern")&&rejectReason.trim()&&(
                <button onClick={()=>{
                  const order=(orders||[]).find(o=>o.id===selGD?.orderId);
                  const ncrNo=genNcrNo(selGD?.orderId||"",ncrs||[]);
                  const newNcr={id:`NCR-${Date.now()}`,ncrNo,orderId:selGD?.orderId,orderNo:order?.orderNo,instanceId:selGD?.id,markNo:selGD?.markNo,drawingNo:selGD?.drawingNo,stage,description:rejectReason,disposition:"rework",reworkStage:stage,raisedBy:user.name,raisedAt:today(),status:"open",auditLog:[{action:"ncr-raised",by:user.name,date:today(),reason:rejectReason}]};
                  if(setNcrs) setNcrs(prev=>[...prev,newNcr]);
                  if(setNotifications) setNotifications(prev=>[...prev,createNotification({type:"ncr",message:`NCR ${ncrNo} raised — ${selGD?.markNo} at ${stage}: ${rejectReason}`,forRoles:["planning_admin","production_admin","super_admin"],entityId:selGD?.id,orderId:selGD?.orderId,raisedBy:user.name})]);
                  doReject(selGD);
                  showToast(`NCR ${ncrNo} raised`);
                }} style={{...css.btn.ghost,color:T.red,border:`1px solid ${T.red}`}}>
                  Also raise NCR
                </button>
              )}
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
  const parts = (order.parts||[]).filter(p => p.drawingId===drawing.id);
  const fabParts = parts.filter(p => (p.fabType||"").toLowerCase()!=="bought out");
  const noInstances = dInst.length === 0;

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
            {fabParts.length>0&&noInstances&&(
              <tr><td colSpan={STAGE_COLS.length+3} style={{ padding:0 }}>
                <div style={{ margin:"8px 0",padding:"10px 14px",background:`${T.accent}14`,border:`1px solid ${T.accent}44`,borderRadius:6,fontSize:12,color:T.accent }}>
                  ℹ No production instances yet — showing planned parts from drawing register. Complete a nesting run and confirm cutting to begin production tracking.
                </div>
                <table style={{ width:"100%",borderCollapse:"collapse",fontSize:11 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign:"left",padding:"5px 10px",color:T.textMid,fontWeight:700,borderBottom:`1px solid ${T.border}` }}>Mark No</th>
                      <th style={{ textAlign:"left",padding:"5px 10px",color:T.textMid,fontWeight:700,borderBottom:`1px solid ${T.border}` }}>Description</th>
                      <th style={{ textAlign:"center",padding:"5px 8px",color:T.textMid,fontWeight:700,borderBottom:`1px solid ${T.border}` }}>Qty</th>
                      <th style={{ textAlign:"left",padding:"5px 10px",color:T.textMid,fontWeight:700,borderBottom:`1px solid ${T.border}` }}>Material</th>
                      <th style={{ textAlign:"left",padding:"5px 10px",color:T.textMid,fontWeight:700,borderBottom:`1px solid ${T.border}` }}>Req Ops</th>
                      <th style={{ textAlign:"left",padding:"5px 10px",color:T.textMid,fontWeight:700,borderBottom:`1px solid ${T.border}` }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fabParts.map((p,i)=>(
                      <tr key={p.id||i} style={{ background:i%2===0?"transparent":T.bg }}>
                        <td style={{ padding:"6px 10px",fontFamily:T.fontMono,fontWeight:700,color:T.text,borderBottom:`1px solid ${T.border}22` }}>{p.markNo}</td>
                        <td style={{ padding:"6px 10px",color:T.textMid,borderBottom:`1px solid ${T.border}22` }}>{p.desc||p.partDesc||"—"}</td>
                        <td style={{ textAlign:"center",padding:"6px 8px",color:T.text,fontWeight:700,borderBottom:`1px solid ${T.border}22` }}>{p.qtyPerDrg||p.qty||0}</td>
                        <td style={{ padding:"6px 10px",color:T.textMid,fontFamily:T.fontMono,fontSize:11,borderBottom:`1px solid ${T.border}22` }}>{p.matCode||(p.sectionType||p.section||"")+(" "+(p.grade||"")+" "+(p.size||"")).trim()||"—"}</td>
                        <td style={{ padding:"6px 10px",color:T.textMid,borderBottom:`1px solid ${T.border}22` }}>{(p.requiredOps||[]).join(", ")||"Cut"}</td>
                        <td style={{ padding:"6px 10px",color:T.textLow,fontStyle:"italic",borderBottom:`1px solid ${T.border}22` }}>Not yet released to production</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td></tr>
            )}
            {!noInstances&&fabParts.map((p,i)=>{
              const total = p.qtyPerDrg||p.qty||0;
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

  // Eligible: not already outbound/qc_pending, not completed/defective, max 2 outbound rounds
  const eligible = instances.filter(i =>
    i.currentStatus !== "outbound" &&
    i.currentStatus !== "outbound_qc_pending" &&
    i.currentStatus !== "completed" &&
    i.currentStatus !== "defective" &&
    (i.outboundCount||0) < 2
  );

  // Currently outbound (at vendor)
  const outbound = instances.filter(i => i.currentStatus === "outbound");
  // Returned, awaiting QC sign-off
  const awaitingObQc = instances.filter(i => i.currentStatus === "outbound_qc_pending");

  // Outbound vendors
  const opVendors = vendors.filter(v => v.active);

  const toggleSel = (id) => setSelInsts(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });

  const doCreate = () => {
    if (!selInsts.size || !form.vendorId || !form.type) return;
    const vend = opVendors.find(v=>v.id===form.vendorId);
    setInstances(prev => prev.map(i => {
      if (!selInsts.has(i.instanceId)) return i;
      // Find the matching outbound pipeline step to capture tasks + reEntryStep
      const obStep = (i.processSteps||[]).find(s => s.type==="outbound" && s.exitAfterStep === i.currentStage)
        || (i.processSteps||[]).find(s => s.type==="outbound"); // fallback: first outbound step
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
          returnRecordedBy: null,
          stageAtDispatch: i.currentStage,
          statusAtDispatch: i.currentStatus,
          tasks: obStep?.tasks || form.tasks || [],
          reEntryStep: obStep?.reEntryStep || form.reEntryStep || null,
        }],
      };
    }));
    setSelInsts(new Set());
    setForm({ type:"Bending", vendorId:"", expectedReturn:"", notes:"", tasks:[], reEntryStep:"" });
    setModal(false);
  };

  const doReturn = (instId) => {
    setInstances(prev => prev.map(i => {
      if (i.instanceId !== instId) return i;
      const hist = [...(i.outboundHistory||[])];
      const lastIdx = hist.length - 1;
      if (lastIdx >= 0) hist[lastIdx] = { ...hist[lastIdx], returnDate: today(), returnRecordedBy: user.username };
      const ob = hist[lastIdx];
      // Find reEntryStep from the pipeline step that matches this outbound record
      // ob.tasks and ob.reEntryStep were stored at dispatch time from pipeline step data
      return {
        ...i,
        currentStatus: "outbound_qc_pending",  // gate — must pass QC before re-entering flow
        outboundHistory: hist,
        // preserve currentStage (where it was when sent) — QC sign-off will advance to reEntryStep
      };
    }));
    showToast("Return recorded — pending Outbound QC sign-off", "amber");
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

      {/* Returned — awaiting outbound QC */}
      {awaitingObQc.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:12,fontWeight:800,color:"#06B6D4",marginBottom:10 }}>🔍 RETURNED — AWAITING OUTBOUND QC ({awaitingObQc.length})</div>
          <InfoBanner color="blue">These pieces have returned from the vendor. Go to QC &amp; Inspection → Outbound QC to sign off.</InfoBanner>
          <div style={{ display:"flex",flexDirection:"column",gap:8,marginTop:8 }}>
            {awaitingObQc.map(i => {
              const ob = (i.outboundHistory||[]).slice(-1)[0];
              return (
                <div key={i.instanceId} style={{ ...css.card,border:`1px solid ${"#06B6D4"}44` }}>
                  <div style={{ fontWeight:800,fontFamily:T.fontMono,color:T.text }}>{i.markNo} <span style={{fontWeight:400,color:T.textMid,fontFamily:T.font,fontSize:12}}>— {i.instanceId}</span></div>
                  <div style={{ fontSize:12,color:T.textMid,marginTop:2 }}>{i.drawingNo} / {i.orderId}</div>
                  {ob&&<div style={{ fontSize:12,color:"#06B6D4",marginTop:4 }}>
                    {ob.type} @ {ob.vendorName} · Returned {ob.returnDate} · Tasks: {(ob.tasks||[]).join(", ")||"—"}
                  </div>}
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
// PRODUCTION RELEASE WIZARD — helpers
// ═══════════════════════════════════════════════════════════════════════════════

// Calculate plate sheet weight from rmUnitId dimensions
// rmUnitId format: PLATE/MS/E350/16mm/1500X11200/1-3
// Returns weight in kg using steel density 7850 kg/m³
// ─── LOT NUMBER + RMUNIT ID HELPERS ─────────────────────────────────────────
// Alphanumeric lot counter: A001..A999, B001..B999 ... Z999 (skip I and O)
const LOT_ALPHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // skip I and O
const SECTION_PREFIX = {
  PLATE:"PLT", PLT:"PLT",
  ISA:"ISA", ISMC:"ISMC", ISMB:"ISMB",
  SHS:"SHS", RHS:"RHS",
  "FLAT BAR":"FLB", "FLAT":"FLB", FLB:"FLB",
  "ROUND BAR":"RDB", RDB:"RDB",
};

// Generate next lot number from existing stock lots
// Returns { lotNo: "A342", nextAlpha: "A", nextNum: 343 }
const genLotNo = (existingStock) => {
  let bestAlpha = 0; // index into LOT_ALPHA_CHARS
  let bestNum = 0;
  (existingStock||[]).forEach(s => {
    const m = (s.lotNo||"").match(/^([A-HJ-NP-Z])(\d{3})$/);
    if (!m) return;
    const ai = LOT_ALPHA_CHARS.indexOf(m[1]);
    const num = parseInt(m[2], 10);
    if (ai > bestAlpha || (ai === bestAlpha && num > bestNum)) {
      bestAlpha = ai; bestNum = num;
    }
  });
  // Increment
  let nextNum = bestNum + 1;
  let nextAlpha = bestAlpha;
  if (nextNum > 999) { nextNum = 1; nextAlpha++; }
  if (nextAlpha >= LOT_ALPHA_CHARS.length) { nextAlpha = 0; nextNum = 1; } // safety wrap
  return `${LOT_ALPHA_CHARS[nextAlpha]}${String(nextNum).padStart(3,"0")}`;
};

// Generate rmUnitId from lot record + sequence number
// e.g. A342/PLT/E350/16mm/1500X6300/1
const buildRmUnitId = (lotNo, sectionType, grade, size, sheetDim, seq) => {
  const prefix = SECTION_PREFIX[(sectionType||"").toUpperCase()] || (sectionType||"UNK").toUpperCase().slice(0,4);
  const gradeStr = (grade||"E250").replace(/[^A-Z0-9]/gi,"");
  const sizeStr  = (size||"").replace(/\s/g,"");
  const dimStr   = (sheetDim||"").toUpperCase().replace(/[×x]/g,"X");
  return `${lotNo}/${prefix}/${gradeStr}/${sizeStr}/${dimStr}/${seq}`; // seq format: "groupNo-sheetInGroup" e.g. "2-4"
};

// Build offcut rmUnitId — same lotNo, own dimensions, /1 /2 sequence
const buildOffcutRmUnitId = (parentLotNo, sectionType, grade, size, offcutDim, existingStock) => {
  const prefix = SECTION_PREFIX[(sectionType||"").toUpperCase()] || (sectionType||"UNK").toUpperCase().slice(0,4);
  const gradeStr = (grade||"E250").replace(/[^A-Z0-9]/gi,"");
  const sizeStr  = (size||"").replace(/\s/g,"");
  const dimStr   = (offcutDim||"").toUpperCase().replace(/[×x]/g,"X");
  const baseId   = `${parentLotNo}/${prefix}/${gradeStr}/${sizeStr}/${dimStr}`;
  // Count existing offcuts with same baseId
  const existing = (existingStock||[]).filter(s=>s.isOffcut&&(s.rmUnitId||"").startsWith(baseId+"/")).length;
  return `${baseId}/${existing+1}`;
};

// Parse rmUnitId — handles both old format (PLATE/MS/E350/16mm/1500X6300/1-4)
// and new format (A342/PLT/E350/16mm/1500X6300/1)
const parseRmUnitIdNew = (rmUnitId) => {
  if (!rmUnitId) return { isNew:false, lotNo:"", sectionPrefix:"", grade:"", size:"", dim:"", seq:1 };
  const parts = rmUnitId.split("/");
  // New format: first segment matches alphanumeric lot pattern
  if (/^[A-HJ-NP-Z]\d{3}$/.test(parts[0])) {
    return { isNew:true, lotNo:parts[0], sectionPrefix:parts[1]||"", grade:parts[2]||"",
      size:parts[3]||"", dim:parts[4]||"", seq:parseInt(parts[5]||"1",10) };
  }
  return { isNew:false };
};

// calcSheetWt imported from helpers.js

// "PLATE/MS/E350/16mm/1500X11200/2-3" → 3 (the total unit count from the range)
const parseRmUnitTotal = rmUnitId => {
  const parts = (rmUnitId||"").split("/");
  const last = parts[parts.length-1]||"";
  const m = last.match(/\d+-(\d+)/);
  return m ? parseInt(m[1],10) : 1;
};

// "1500X11200" → {w:1500, l:11200}
const parseRmUnitDim = sheetDim => {
  const m = (sheetDim||"").match(/^(\d+)[Xx](\d+)$/);
  return m ? {w:parseInt(m[1],10), l:parseInt(m[2],10)} : {w:0, l:0};
};

// Weight of one RM unit — new format: use lot.sheetWt; old format: lot.wtReceived / range total
const getRmUnitWt = (lot, rmUnitId) => {
  if (lot?.sheetWt > 0) return lot.sheetWt;
  const total = parseRmUnitTotal(rmUnitId); // legacy fallback
  return total > 0 ? (lot?.wtReceived||0) / total : 0;
};

// Sum part weights and areas for a list of mark numbers
const getRmUnitPartStats = (markNos, allOrderParts) => {
  let wt = 0, area = 0;
  (markNos||[]).forEach(mn => {
    const p = (allOrderParts||[]).find(x=>x.markNo===mn);
    if(p){ wt += (p.clientUnitWt||0)*(p.clientQty||1); area += (p.area||0)*(p.clientQty||1); }
  });
  return {wt, area, totalWt:wt};
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

// ─── PIPELINE EDITOR MODAL (top-level to avoid hooks-in-conditional error) ────
const PipelineEditorModal = ({ pipelineEditDI, setPipelineEditDI, processTypes, setDrawingInstances, setSelDrawings, DEFAULT_PIPELINE_STEPS }) => {
  const [steps, setSteps] = React.useState([]);
  const [addingStep, setAddingStep] = React.useState(false);
  const [newStepType, setNewStepType] = React.useState("");
  const [customStepType, setCustomStepType] = React.useState("");
  const [newExitAfter, setNewExitAfter] = React.useState("");
  const [newReEntry, setNewReEntry] = React.useState("");
  const [newTasks, setNewTasks] = React.useState([]);

  React.useEffect(()=>{
    if (pipelineEditDI) {
      setSteps([...(pipelineEditDI.processSteps||DEFAULT_PIPELINE_STEPS)]);
      setAddingStep(false); setNewStepType(""); setCustomStepType(""); setNewExitAfter(""); setNewReEntry(""); setNewTasks([]);
    }
  },[pipelineEditDI?.id]);

  if (!pipelineEditDI) return null;
  const di = pipelineEditDI;

  const inhouseSteps = steps.filter(s => s.type !== "outbound");
  // For exit dropdown: all inhouse steps (piece leaves after one of these)
  // For reEntry dropdown: only inhouse steps that come after the chosen exit step
  const exitIdx = inhouseSteps.findIndex(s => s.step === newExitAfter);
  const reEntryOptions = exitIdx >= 0 ? inhouseSteps.slice(exitIdx + 1) : inhouseSteps;

  const moveStep = (i, dir) => setSteps(prev=>{ const s=[...prev]; const t=s[i]; s[i]=s[i+dir]; s[i+dir]=t; return s; });
  const removeStep = (i) => setSteps(prev=>prev.filter((_,idx)=>idx!==i));
  const toggleTask = (id) => setNewTasks(prev => prev.includes(id) ? prev.filter(t=>t!==id) : [...prev,id]);

  const resolvedStepType = newStepType === "__other__" ? customStepType.trim() : newStepType;

  const stripIntermediateSteps = (stepList, exitAfter, reEntry) => {
    const exitIdx    = stepList.findIndex(s => s.step === exitAfter);
    const reEntryIdx = stepList.findIndex(s => s.step === reEntry);
    if (exitIdx < 0 || reEntryIdx < 0 || reEntryIdx <= exitIdx) return stepList;
    return stepList.filter((s, i) => i <= exitIdx || i >= reEntryIdx || s.type === "outbound");
  };

  const addStep = () => {
    if (!resolvedStepType || !newExitAfter || !newReEntry || newTasks.length === 0) return;
    const pt = newStepType === "__other__"
      ? { name: customStepType.trim(), id: "" }
      : (processTypes||DEFAULT_PROCESS_TYPES).find(p=>p.id===newStepType);
    const newStep = {
      step: pt?.name?.toLowerCase().replace(/\s+/g,"_") || resolvedStepType.toLowerCase(),
      label: pt?.name || resolvedStepType,
      type: "outbound",
      processTypeId: pt?.id || "",
      exitAfterStep: newExitAfter,
      reEntryStep: newReEntry,
      tasks: newTasks,
    };
    const exitStepIdx = steps.findIndex(s => s.step === newExitAfter);
    const insertAt = exitStepIdx >= 0 ? exitStepIdx + 1 : steps.length;
    setSteps(prev => { const s=[...prev]; s.splice(insertAt,0,newStep); return s; });
    setAddingStep(false); setNewStepType(""); setCustomStepType(""); setNewExitAfter(""); setNewReEntry(""); setNewTasks([]);
  };

  const canAdd = resolvedStepType && newExitAfter && newReEntry && newTasks.length > 0;

  const save = () => {
    let finalSteps = [...steps];
    steps.filter(s=>s.type==="outbound").forEach(ob=>{
      finalSteps = stripIntermediateSteps(finalSteps, ob.exitAfterStep, ob.reEntryStep);
    });
    if (setDrawingInstances) setDrawingInstances(prev=>prev.map(d=>d.id!==di.id?d:{...d,processSteps:finalSteps}));
    if (setSelDrawings) setSelDrawings(prev=>prev.map(s=>s.diId!==di.id?s:{...s,processSteps:finalSteps}));
    setPipelineEditDI(null);
  };

  return (
    <Modal title={`Drawing Pipeline — ${di.drawingNo} · ${di.instanceNo}/${di.totalInstances}`} onClose={()=>setPipelineEditDI(null)} width={580}>
      <div style={{fontSize:11,color:T.textMid,marginBottom:12}}>
        Inhouse steps run sequentially. Outbound steps send the drawing to a third-party vendor between two inhouse stages.
      </div>

      {/* Current pipeline */}
      <div style={{marginBottom:12}}>
        {steps.map((step,i)=>(
          <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"8px 10px",
            background:step.type==="outbound"?T.amberBg:T.bg,
            borderRadius:5,marginBottom:4,border:`1px solid ${step.type==="outbound"?T.amber:T.border}`}}>
            <span style={{fontSize:11,color:T.textMid,width:20,textAlign:"center",paddingTop:2}}>{i+1}</span>
            <div style={{flex:1}}>
              <span style={{fontSize:12,fontWeight:step.type==="outbound"?700:400,
                color:step.type==="outbound"?T.amber:T.text}}>
                {step.type==="outbound"&&"⬆ "}{step.label||step.step}
              </span>
              {step.type==="outbound" && (
                <div style={{fontSize:10,color:T.textMid,marginTop:3,lineHeight:"1.6"}}>
                  {step.exitAfterStep && <span>Exit after: <b>{step.exitAfterStep}</b> · </span>}
                  {step.reEntryStep  && <span>Re-enter at: <b>{step.reEntryStep}</b> · </span>}
                  {step.tasks?.length > 0 && <span>Tasks: {step.tasks.join(", ")}</span>}
                </div>
              )}
            </div>
            <Badge color={step.type==="outbound"?"amber":"blue"}>{step.type==="outbound"?"outbound":"inhouse"}</Badge>
            <div style={{display:"flex",gap:2,flexShrink:0}}>
              <button disabled={i===0} onClick={()=>moveStep(i,-1)} style={{...css.btn.ghost,fontSize:10,padding:"1px 6px"}}>↑</button>
              <button disabled={i===steps.length-1} onClick={()=>moveStep(i,1)} style={{...css.btn.ghost,fontSize:10,padding:"1px 6px"}}>↓</button>
              {step.type==="outbound" && (
                <button onClick={()=>removeStep(i)} style={{...css.btn.ghost,fontSize:10,padding:"1px 6px",color:T.red}}>✕</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add outbound step form */}
      {!addingStep
        ? <button onClick={()=>setAddingStep(true)} style={{...css.btn.secondary,fontSize:11,width:"100%",marginBottom:12}}>
            ＋ Add Outbound Step
          </button>
        : <div style={{padding:"12px",background:T.bg,borderRadius:6,marginBottom:12,border:`1px solid ${T.amber}55`}}>
            <div style={{fontSize:11,fontWeight:700,color:T.amber,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>
              New Outbound Step
            </div>

            {/* Row 1: Process type + exit + re-entry */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
              <Field label="Process type *">
                <Sel value={newStepType} onChange={e=>setNewStepType(e.target.value)}>
                  <option value="">Select...</option>
                  {(processTypes||DEFAULT_PROCESS_TYPES).filter(p=>p.type==="outbound").map(p=>(
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                  <option value="__other__">Other (specify)...</option>
                </Sel>
                {newStepType==="__other__" && (
                  <input placeholder="Type process name..." style={{...css.input, marginTop:6}}
                    onChange={e=>setCustomStepType(e.target.value)} value={customStepType} />
                )}
              </Field>
              <Field label="Send after *">
                <Sel value={newExitAfter} onChange={e=>{ setNewExitAfter(e.target.value); setNewReEntry(""); }}>
                  <option value="">— select —</option>
                  {inhouseSteps.map((s,i)=><option key={i} value={s.step}>{s.label||s.step}</option>)}
                </Sel>
              </Field>
              <Field label="Comes back at *">
                <Sel value={newReEntry} onChange={e=>setNewReEntry(e.target.value)}
                  disabled={!newExitAfter}>
                  <option value="">— select —</option>
                  {reEntryOptions.map((s,i)=><option key={i} value={s.step}>{s.label||s.step}</option>)}
                </Sel>
              </Field>
            </div>

            {/* Row 2: Task checkboxes */}
            <div style={{marginBottom:10}}>
              <div style={{fontSize:11,color:T.textMid,fontWeight:600,marginBottom:6}}>
                TASKS PERFORMED BY VENDOR * <span style={{fontWeight:400,color:T.textLow}}>(drives QC checklist on return)</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {OUTBOUND_TASKS.map(t=>(
                  <div key={t.id} onClick={()=>toggleTask(t.id)}
                    title={t.qcHints}
                    style={{padding:"4px 10px",borderRadius:4,fontSize:11,cursor:"pointer",userSelect:"none",
                      background: newTasks.includes(t.id) ? T.amber+"33" : T.bgInput,
                      border:`1px solid ${newTasks.includes(t.id) ? T.amber : T.border}`,
                      color: newTasks.includes(t.id) ? T.amber : T.text,
                      fontWeight: newTasks.includes(t.id) ? 700 : 400 }}>
                    {newTasks.includes(t.id) ? "✓ " : ""}{t.label}
                  </div>
                ))}
              </div>
              {newTasks.length > 0 && (
                <div style={{fontSize:10,color:T.textLow,marginTop:6}}>
                  QC on return will check: {newTasks.map(id=>OUTBOUND_TASKS.find(t=>t.id===id)?.qcHints).filter(Boolean).join(" · ")}
                </div>
              )}
            </div>

            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setAddingStep(false)} style={{...css.btn.ghost,fontSize:11}}>Cancel</button>
              <button onClick={addStep} disabled={!canAdd}
                style={{...css.btn.primary,fontSize:11,opacity:canAdd?1:0.4,cursor:canAdd?"pointer":"not-allowed"}}>
                Add Step
              </button>
            </div>
          </div>
      }

      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={()=>setPipelineEditDI(null)} style={css.btn.secondary}>Cancel</button>
        <button onClick={save} style={css.btn.primary}>Save Pipeline</button>
      </div>
    </Modal>
  );
};

const ProductionReleaseWizard = ({ user, orders, setOrders, stock, setStock, materials, machines, contractors, releases, setReleases, productionStandards, instances, setInstances, nestingBatches, purchaseReqs, onBack, dprs, setDprs, drawingInstances, setDrawingInstances, processTypes }) => {
  const today = () => new Date().toISOString().slice(0,10);
  const [step, setStep] = useState(1);
  const [selDrawings, setSelDrawings] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [pipelineEditDI, setPipelineEditDI] = useState(null);
  const [rmPicture, setRmPicture] = useState([]);
  const [expandedMat, setExpandedMat] = useState({});
  const [rmUnitAsgn, setRmUnitAsgn] = useState({}); // {rmUnitId: {contractorId, startDate, endDate, ops:{markNo:{op:contractorId}}}}
  const [confirmedOps, setConfirmedOps] = useState({}); // {partId: string[]}
  const [contAsgn, setContAsgn] = useState({});
  const [exitWarning, setExitWarning] = useState(false);

  // ── buildProductionSteps ──
  const buildProductionSteps = (drawing, order, contAsgnSnap, confirmedOpsSnap, rmUnitAsgnSnap) => {
    const allCoats = getPaintCoats(order.quality);
    const ca = contAsgnSnap[drawing.id] || {};
    const contractorId         = ca.contractorId         || "";
    const blastingContractorId = "";
    const paintingContractorId = "";
    const tpiStages = new Set(ca.tpiStages?.length ? ca.tpiStages : (order.quality?.tpiHoldPoints || []));
    const drawingParts = (order.parts||[]).filter(p=>p.drawingId===drawing.id&&p.fabType==="Fabricate");
    const allOps = new Set(drawingParts.flatMap(p=>confirmedOpsSnap[p.id]||p.requiredOps||['Cut']));
    const secOps = [...allOps].filter(op=>op!=='Cut');
    // cuttingContractorId: first rmUnit contractor assigned to any part of this drawing
    const drawingMarkNos = new Set(drawingParts.map(p=>p.markNo));
    let cuttingContractorId = "";
    for (const [rmUnitId, a] of Object.entries(rmUnitAsgnSnap)) {
      if (a.contractorId && Object.keys(a.ops||{}).some(mn=>drawingMarkNos.has(mn))) {
        cuttingContractorId = a.contractorId; break;
      }
    }
    const steps = [];
    steps.push({ stage:'cutting', type:'contractor', status:'pending', contractorId:cuttingContractorId, rmUnits:[], completedAt:null });
    steps.push({ stage:'cutting_qc', type:'qc', status:'pending', completedAt:null, completedBy:null });
    if (secOps.length > 0)
      steps.push({ stage:'secondary_ops', type:'production', status:'pending', ops:secOps, completedAt:null });
    steps.push({ stage:'fit_up',  type:'contractor', status:'pending', contractorId, tpiRequired:tpiStages.has('fit_up'),  tpiOfferedAt:null, tpiDoneAt:null, tpiIrn:null, completedAt:null });
    steps.push({ stage:'welding', type:'contractor', status:'pending', contractorId, tpiRequired:tpiStages.has('welding'), tpiOfferedAt:null, tpiDoneAt:null, tpiIrn:null, completedAt:null });
    steps.push({ stage:'blasting',type:'contractor', status:'pending', contractorId:blastingContractorId, tpiRequired:tpiStages.has('blasting'), tpiOfferedAt:null, tpiDoneAt:null, tpiIrn:null, completedAt:null });
    if (allCoats.length > 0) {
      allCoats.forEach((coat,i) => steps.push({ stage:`paint_coat_${i+1}`, type:'contractor', status:'pending', coatName:coat.type||`Coat ${i+1}`, contractorId:paintingContractorId, tpiRequired:tpiStages.has('painting'), tpiOfferedAt:null, tpiDoneAt:null, tpiIrn:null, completedAt:null }));
    } else {
      steps.push({ stage:'paint_coat_1', type:'contractor', status:'pending', coatName:'Paint', contractorId:paintingContractorId, tpiRequired:tpiStages.has('painting'), tpiOfferedAt:null, tpiDoneAt:null, tpiIrn:null, completedAt:null });
    }
    steps.push({ stage:'mdcc',     type:'production', status:'pending', appliedAt:null, receivedAt:null });
    steps.push({ stage:'dispatch', type:'production', status:'pending', completedAt:null });
    return steps;
  };

  // ── Step 1 helpers ──
  const activeReleaseDrawingMap = new Map(
    releases.filter(r=>r.status==="in_progress").flatMap(r=>(r.drawings||[]).filter(d=>d.drawingId).map(d=>[d.drawingId,r.id]))
  );
  const activeReleaseDrawingIds = new Set(activeReleaseDrawingMap.keys());

  const allEligible = orders.flatMap(order=>
    (order.drawings||[]).filter(d=>d.receivedDate)
      .map(d=>({drawingId:d.id,orderId:order.id,drawing:d,order}))
  ).map(e=>{
    let tier={id:"simple",label:"Simple"}; let score=999;
    try { if(productionStandards){tier=getAssemblyTier(e.drawing,productionStandards);score=getCriticalityScore(e.drawing,e.order,productionStandards);} } catch {}
    return {...e,tier,score};
  }).sort((a,b)=>a.score-b.score);

  const noDateDrawings = orders.flatMap(order=>(order.drawings||[]).filter(d=>!d.receivedDate).map(d=>({drawing:d,order})));
  const alreadyReleasedDrawings = orders.flatMap(order=>(order.drawings||[]).filter(d=>d.receivedDate&&activeReleaseDrawingIds.has(d.id)).map(d=>({drawing:d,order,releaseId:activeReleaseDrawingMap.get(d.id)||""})));

  const toggleDrw = key => {
    const exists=selDrawings.find(s=>s.drawingId===key.drawingId&&s.orderId===key.orderId);
    if(exists){
      setSelDrawings(prev=>prev.filter(s=>!(s.drawingId===key.drawingId&&s.orderId===key.orderId)));
      return;
    }
    // Warn if drawing is in an active release with unstarted rmUnits
    const inActiveRelease=activeReleaseDrawingIds.has(key.drawingId);
    if(inActiveRelease){
      const releaseId=activeReleaseDrawingMap.get(key.drawingId)||"";
      const hasUnstartedRmUnits=(releases||[]).find(r=>r.id===releaseId)
        ?.rmUnitAssignments?.some(ru=>
          (key.drawing?ru.parts?.some(mn=>(key.order.parts||[]).filter(p=>p.drawingId===key.drawingId).map(p=>p.markNo).includes(mn)):false)
          &&ru.status==="pending"
        );
      if(hasUnstartedRmUnits){
        const proceed=window.confirm(
          `Drawing ${key.drawing?.drawingNo} has unstarted rmUnits in release ${releaseId}.\n\nAdding it again may create duplicate cutting jobs. Proceed anyway?`
        );
        if(!proceed) return;
      }
    }
    const unitsToRelease=Math.max(1,(key.drawing?.qty||1));
    setSelDrawings(prev=>[...prev,{...key,unitsToRelease}]);
  };
  const isSelected=(drawingId,orderId)=>selDrawings.some(s=>s.drawingId===drawingId&&s.orderId===orderId);

  // ── Step 2 compute ──
  const computeRmPicture = () => {
    const DONE_STAGES_RM = new Set(['cutting_qc','fitup','fit_up','welding','weld_qc','tpi_weld','blasting','painting','dispatch','complete']);
    const byMat={};
    selDrawings.forEach(entry=>{
      const {drawing,order}=entry;
      const unitsToRelease=entry.unitsToRelease??(drawing.qty||1);
      const drawingParts=(order.parts||[]).filter(p=>p.drawingId===drawing.id);
      drawingParts.filter(p=>p.fabType?.toLowerCase()==="fabricate"&&p.source?.toLowerCase()==="procure").forEach(p=>{
        const sec=p.sectionType||p.section||"";
        const key=p.matCode||sec||"Unknown";
        if(!byMat[key]) byMat[key]={matCode:key,section:sec,grade:p.grade||"",requiredKg:0,drawings:[],lots:[]};
        byMat[key].requiredKg+=(p.clientTotalWt||0)*unitsToRelease;
        byMat[key].drawings.push({drawingNo:drawing.drawingNo,orderId:order.id,kg:(p.clientTotalWt||0)*unitsToRelease,qty:unitsToRelease});
      });
    });
    const rows=Object.values(byMat).map(row=>{
      const availLots=stock.filter(s=>{
        const sNorm=normMatCode(s.matCode),rNorm=normMatCode(row.matCode);
        const secMatch=(s.sectionType||s.section||"").toUpperCase()===(row.section||"").toUpperCase();
        const matMatch=(sNorm&&rNorm&&sNorm===rNorm)||(!s.matCode&&secMatch)||(!row.matCode.includes('/')&&secMatch);
        return matMatch&&(s.status==="available"||s.status==="qc_hold"||s.status==="reserved"||s.status==="partially_reserved");
      });
      const availKg=availLots.reduce((s,l)=>(s+(l.wtAvailable||l.wtReceived||0)),0);
      let status="Not in stock — raise PO";
      if(availKg>=row.requiredKg&&row.requiredKg>0) status="Sufficient";
      else if(availKg>0&&availKg<row.requiredKg) status="Partial";
      else if(availLots.some(l=>l.status==="qc_hold")) status="QC Pending";
      const libEntry=(materials||[]).find(m=>m.matCode===row.matCode);
      let requiredM=0,reqDisplay="—";
      const isPlate=row.section?.toUpperCase()==="PLATE"||(libEntry?.isPlate)||false;
      if(libEntry&&!isPlate&&(libEntry.wtPerMetre||0)>0){
        requiredM=row.requiredKg/libEntry.wtPerMetre;
        const stdLens=libEntry.standardLengths||[];
        const maxLen=stdLens.length>0?stdLens[stdLens.length-1]/1000:12;
        const bars=Math.ceil(requiredM/maxLen);
        reqDisplay=`${requiredM.toFixed(1)} m (≈ ${bars} bars of ${maxLen*1000}mm)`;
      } else if(isPlate&&(libEntry?.wtPerM2||0)>0){
        requiredM=row.requiredKg/libEntry.wtPerM2;
        reqDisplay=`${requiredM.toFixed(2)} m²`;
      } else if(isPlate){
        reqDisplay="— (m² rate not set)";
      }
      // Find nesting batches covering this matCode for selected drawings
      const selMarkNosForMat=new Set(selDrawings.flatMap(({drawing,order})=>(order.parts||[]).filter(p=>p.drawingId===drawing.id&&p.matCode===row.matCode&&p.fabType==="Fabricate").map(p=>p.markNo)));
      const batchesForMat=(nestingBatches||[]).filter(b=>(b.lots||[]).some(l=>l.matCode===row.matCode&&(l.parts||[]).some(mn=>selMarkNosForMat.has(mn))));
      const allOrderParts=selDrawings.flatMap(({order})=>order.parts||[]);
      const rmUnitsForMat=[];
      batchesForMat.forEach(batch=>{
        (batch.lots||[]).forEach(lot=>{
          if(lot.matCode!==row.matCode) return;
          (lot.sheets||[]).forEach(sheet=>{
            if(!sheet.rmUnitId) return;
            const selParts=(sheet.parts||[]).filter(mn=>selMarkNosForMat.has(mn));
            if(selParts.length===0) return;
            const allSheetParts=(sheet.parts||[]);
            const allStats=getRmUnitPartStats(allSheetParts,allOrderParts);
            const selStats=getRmUnitPartStats(selParts,allOrderParts);
            const sheetWt=calcSheetWt(sheet.rmUnitId)||0;
            const utilisPct=sheet.utilisPct||0;
            // ── Detect already-cut status ──────────────────────────────────
            const sheetInsts=(instances||[]).filter(i=>i.rmUnitId===sheet.rmUnitId&&!i.isSideCut);
            // Also check releases — if cuttingComplete is true on rmUnitAssignment, sheet is done
            const releaseForSheet=(releases||[]).some(r=>(r.rmUnitAssignments||[]).some(ru=>ru.rmUnitId===sheet.rmUnitId&&ru.cuttingComplete));
            // A sheet is "done" if ANY instance from the selected-drawing parts is past cutting
            // OR if the release marks cuttingComplete (mirrors Step 1 logic)
            const selPartMarkNos=new Set(selParts);
            const sheetIsCut=releaseForSheet||sheetInsts.some(i=>DONE_STAGES_RM.has(i.currentStage)&&selPartMarkNos.has(i.markNo));
            const sheetIsInCutting=!sheetIsCut&&sheetInsts.some(i=>i.currentStage==="cutting"&&selPartMarkNos.has(i.markNo));
            let cuttingStatus="pending";
            if(sheetIsCut) cuttingStatus="done";
            else if(sheetIsInCutting) cuttingStatus="partial";
            // ────────────────────────────────────────────────────────────────
            rmUnitsForMat.push({
              rmUnitId:sheet.rmUnitId,
              batchId:batch.id,
              sheetDim:sheet.sheetDim||"",
              selPartCount:selParts.length,
              totalPartCount:allSheetParts.length,
              selPartWt:selStats.totalWt,
              allPartWt:allStats.totalWt,
              sheetWt,
              utilisPct,
              lotId:lot.lotId,
              cuttingStatus,
            });
          });
        });
      });
      return {...row,availableKg:availKg,status,lots:availLots,requiredM,reqDisplay,batchesForMat,rmUnitsForMat};
    });
    setRmPicture(rows);
  };

  // ── Step 3 — get RM units from nesting batches for selected drawings ──
  const getSelDrawingMarkNos = () => {
    const map={}; // markNo -> {drawingNo, orderId, partId, selected}
    const selDrawingIds=new Set(selDrawings.map(s=>s.drawingId));
    selDrawings.forEach(({drawing,order})=>{
      (order.parts||[]).filter(p=>p.drawingId===drawing.id&&p.fabType==="Fabricate").forEach(p=>{
        map[p.markNo]={drawingNo:drawing.drawingNo,orderId:order.id,partId:p.id,selected:true,part:p};
      });
    });
    // Also map non-selected drawing markNos for colour coding
    orders.forEach(order=>{
      (order.parts||[]).filter(p=>!selDrawingIds.has(p.drawingId)&&p.fabType==="Fabricate").forEach(p=>{
        if(!map[p.markNo]) map[p.markNo]={drawingNo:(order.drawings||[]).find(d=>d.id===p.drawingId)?.drawingNo||p.drawingId,orderId:order.id,partId:p.id,selected:false,part:p};
      });
    });
    return map;
  };

  const getRmUnitsForRelease = () => {
    const markNoMap=getSelDrawingMarkNos();
    const selMarkNos=new Set(Object.keys(markNoMap).filter(mn=>markNoMap[mn].selected));
    // Build set of rmUnitIds already fully cut (from existing releases)
    const alreadyCutRmUnits=new Set(
      (releases||[]).flatMap(r=>(r.rmUnitAssignments||[]).filter(ru=>ru.cuttingComplete).map(ru=>ru.rmUnitId))
    );
    const rmUnits=[];
    const seen=new Set();
    (nestingBatches||[]).forEach(batch=>{
      (batch.lots||[]).forEach(lot=>{
        (lot.sheets||[]).forEach(sheet=>{
          if(!sheet.rmUnitId) return;
          if(seen.has(sheet.rmUnitId)) return;
          // Only include sheets that have at least one part from selected drawings
          const hasSelPart=(sheet.parts||[]).some(p=>selMarkNos.has(typeof p==="string"?p:p.markNo));
          if(!hasSelPart) return;
          // Skip sheets already fully cut in a previous release
          if(alreadyCutRmUnits.has(sheet.rmUnitId)) return;
          seen.add(sheet.rmUnitId);
          rmUnits.push({
            rmUnitId: sheet.rmUnitId,
            batchId: batch.id,
            lotId: lot.lotId,
            matCode: lot.matCode,
            dimensions: sheet.sheetDim||"",
            parts: (sheet.parts||[]).map(p=>{ const mn=typeof p==="string"?p:p.markNo; return {markNo:mn,qty:typeof p==="object"?p.qty:1,...(markNoMap[mn]||{selected:false,drawingNo:"?",orderId:"?"})}; }),
          });
        });
      });
    });
    return rmUnits;
  };

  const updRmUnitAsgn=(rmUnitId,field,val)=>setRmUnitAsgn(prev=>({...prev,[rmUnitId]:{...prev[rmUnitId],[field]:val}}));
  const updRmUnitOp=(rmUnitId,markNo,op,contractorId)=>setRmUnitAsgn(prev=>{
    const ru=prev[rmUnitId]||{};
    const opsMap=ru.ops||{};
    const partEntry=opsMap[markNo]||{};
    return {...prev,[rmUnitId]:{...ru,ops:{...opsMap,[markNo]:{...partEntry,ops:partEntry.ops||['Cut'],opContractors:{...(partEntry.opContractors||{}),[op]:contractorId}}}}};
  });
  const updRmUnitPartOps=(rmUnitId,markNo,newOps)=>setRmUnitAsgn(prev=>{
    const ru=prev[rmUnitId]||{};
    const opsMap=ru.ops||{};
    const partEntry=opsMap[markNo]||{};
    return {...prev,[rmUnitId]:{...ru,ops:{...opsMap,[markNo]:{...partEntry,ops:newOps}}}};
  });

  const updCont=(drawingId,field,val)=>setContAsgn(prev=>({...prev,[drawingId]:{...prev[drawingId],[field]:val}}));

  // ── Confirm ──
  const confirm = () => {
    const seq=releases.length+1;
    const yr=new Date().getFullYear();
    const id=`PR-${yr}-${String(seq).padStart(3,"0")}`;
    const contAsgnSnap=contAsgn;
    const confirmedOpsSnap=confirmedOps;
    const rmUnitAsgnSnap=rmUnitAsgn;

    setOrders(prevOrders=>prevOrders.map(ord=>{
      const affected=selDrawings.filter(s=>s.orderId===ord.id);
      if(!affected.length) return ord;
      const updatedParts=(ord.parts||[]).map(p=>{const ops=confirmedOpsSnap[p.id];return ops?{...p,requiredOps:ops}:p;});
      const updatedDrawings=(ord.drawings||[]).map(drg=>{
        const sel=affected.find(s=>s.drawingId===drg.id);
        if(!sel) return drg;
        const steps=buildProductionSteps(drg,ord,contAsgnSnap,confirmedOpsSnap,rmUnitAsgnSnap);
        return {...drg,productionSteps:steps};
      });
      return {...ord,parts:updatedParts,drawings:updatedDrawings};
    }));

    // Stock reservations from rmUnit assignments
    const lotReservationMap={};
    const rmUnits=getRmUnitsForRelease();
    rmUnits.forEach(ru=>{
      const a=rmUnitAsgnSnap[ru.rmUnitId];
      if(a?.contractorId&&ru.lotId){
        const orderId=selDrawings[0]?.orderId||"";
        lotReservationMap[ru.lotId]=orderId;
      }
    });
    if(Object.keys(lotReservationMap).length>0)
      setStock(prevStock=>prevStock.map(lot=>{
        const orderId=lotReservationMap[lot.id];
        if(!orderId) return lot;
        return {...lot,status:'reserved',reservedFor:orderId,reservedAt:today(),releaseId:id,
          reservations:[...(lot.reservations||[]),{orderId,reservedAt:today(),source:'release_wizard',releaseId:id}]};
      }));

    const drawingsPayload=selDrawings.map(({drawing,order,tier,score})=>{
      const ca=contAsgnSnap[drawing.id]||{};
      return {
        drawingId:drawing.id,drawingNo:drawing.drawingNo,orderId:order.id,orderNo:order.id,
        contractorId:ca.contractorId||"",
        contractorName:(contractors||[]).find(c=>c.id===ca.contractorId)?.name||"",
        blastingContractorId:"",
        blastingContractorName:"",
        paintingContractorId:"",
        paintingContractorName:"",
        stages:ca.stages||[],tpiStages:ca.tpiStages||[],pinnedEngineerId:ca.pinnedEngineerId||"",
        pinnedEngineerName:ca.pinnedEngineerId?(USERS.find(u=>u.id===ca.pinnedEngineerId)?.name||""):"",
        tier:tier?.id||"simple",criticalityScore:score,
      };
    });

    const rmUnitPayload=rmUnits.map(ru=>{
      const a=rmUnitAsgnSnap[ru.rmUnitId]||{};
      // Get the stock lot allocated for this matCode in Step 2
      // This applies to ALL rmUnits of the same matCode
      const allocEntry=rmUnitAsgnSnap[`alloc::${ru.matCode}`]||{};
      const stockLotId=allocEntry.lotId||"";
      const stockLot=(stock||[]).find(s=>s.id===stockLotId)||
        (stock||[]).find(s=>normMatCode(s.matCode)===normMatCode(ru.matCode)&&
          ['available','reserved','partially_reserved'].includes(s.status))||{};
      // Sheet weight: calculate from dimensions (most accurate for plates)
      const sheetWt=calcSheetWt(ru.rmUnitId)||
        (stockLot.wtReceived&&parseRmUnitTotal(ru.rmUnitId)>0
          ?Math.round(stockLot.wtReceived/parseRmUnitTotal(ru.rmUnitId)*100)/100
          :0);
      return {
        rmUnitId:ru.rmUnitId,batchId:ru.batchId,lotId:ru.lotId,matCode:ru.matCode,
        stockLotId,
        stockLotNo:stockLot.lotNo||stockLotId,
        sheetWt,
        dimensions:ru.dimensions,parts:ru.parts.map(p=>p.markNo),
        contractorId:a.contractorId||"",
        contractorName:(contractors||[]).find(c=>c.id===a.contractorId)?.name||"",
        dxfLink:a.dxfLink||"",
        nestingFile:a.nestingFile||"",
        startDate:a.startDate||today(),endDate:a.endDate||today(),
        ops:a.ops||{},status:a.contractorId?"assigned":"pending",
        assignedBy:user.username,
      };
    });

    const baseTs=Date.now(); let instIdx=0;
    const newInstances=[];
    const nowIso=new Date().toISOString();
    selDrawings.forEach(({drawing,order,unitsToRelease,diId,instanceNo,totalInstances,uniqueId:diUniqueId})=>{
      const ca=contAsgnSnap[drawing.id]||{};
      const contractorName=(contractors||[]).find(c=>c.id===ca.contractorId)?.name||"";
      const qty=unitsToRelease??(drawing.qty||1);
      const fabParts=(order.parts||[]).filter(p=>p.drawingId===drawing.id&&(p.fabType||"").toLowerCase()==="fabricate");
      // Drawing instance info for uniqueId generation
      const orderPrefix = getOrderPrefix(order.orderNo||order.id);
      const strippedPrefix = order.drawingPrefix !== undefined ? order.drawingPrefix : detectDrawingPrefix(order.drawings||[]);
      const shortCode = drawing.shortCode || getDrawingShortCode(drawing.drawingNo||"", strippedPrefix);
      const dInstNo = instanceNo || 1;
      const dInstTotal = totalInstances || drawing.qty || 1;
      const diUID = diUniqueId || buildDIUniqueId(orderPrefix, shortCode, dInstNo, dInstTotal);
      fabParts.forEach(part=>{
        // Find rmUnit containing this part
        const matchingRmUnit=rmUnits.find(ru=>ru.parts.some(p=>p.markNo===part.markNo));
        const rmUnitAsgnEntry=matchingRmUnit?rmUnitAsgnSnap[matchingRmUnit.rmUnitId]:null;
        const partQty = part.qtyPerDrg || part.clientQty || 1;
        // Create one instance per physical piece
        for (let pieceNo = 1; pieceNo <= partQty; pieceNo++) {
          const uniqueId = buildPartUniqueId(diUID, part.markNo||"", pieceNo, partQty);
          newInstances.push({
            instanceId:`INST-${baseTs}-${instIdx++}`,
            uniqueId,
            drawingInstanceId: diId || buildDIId(drawing.id, dInstNo),
            releaseId:id,orderId:order.id,orderNo:order.orderNo||order.id,
            drawingId:drawing.id,drawingNo:drawing.drawingNo||"",
            markNo:part.markNo||"",desc:part.description||"",
            pieceNo, totalPieces:partQty,
            matCode:part.matCode||"",
            qty:1, partWt:part.clientUnitWt||0,
            requiredOps:confirmedOpsSnap[part.id]||part.requiredOps||["Cut"],
            subOpsRequired:(confirmedOpsSnap[part.id]||part.requiredOps||["cut"]).map(op=>(op||"").toLowerCase()),
            assignedContractorId:ca.contractorId||null,
            assignedContractorName:contractorName,
            pinnedEngineerId:ca.pinnedEngineerId||"",
            assignedStage:"fit_up",currentStage:"cutting",currentStatus:"pending",
            rmUnitId:matchingRmUnit?.rmUnitId||"",
            cuttingContractorId:rmUnitAsgnEntry?.contractorId||"",
            cuttingContractorName:(contractors||[]).find(c=>c.id===rmUnitAsgnEntry?.contractorId)?.name||"",
            lotId:matchingRmUnit?.lotId||"",
            nestingRunId:null,barRef:null,batchNo:matchingRmUnit?.batchId||null,
            cuttingBayUsed:"",stageHistory:[],defects:[],outboundCount:0,outboundHistory:[],
            qualityConcernFlag:false,rejectionCount:0,createdAt:nowIso,createdBy:user.username,
          });
        }
      });
    });
    if(newInstances.length>0) setInstances(prev=>[...prev,...newInstances]);

    // Create Drawing Production Records (DPRs) — one per drawing
    const dprTs=Date.now();
    const newDprs=selDrawings.map(({drawing,order,unitsToRelease},dprIdx)=>{
      const ca=contAsgnSnap[drawing.id]||{};
      const fitupContractorId=ca.fitupContractorId||ca.contractorId||"";
      const weldContractorId=ca.contractorId||ca.fitupContractorId||"";
      const fitupContractorName=(contractors||[]).find(c=>c.id===fitupContractorId)?.name||"";
      const weldContractorName=(contractors||[]).find(c=>c.id===weldContractorId)?.name||"";
      const qty=unitsToRelease??(drawing.qty||1);
      const drgParts=(order.parts||[]).filter(p=>p.drawingId===drawing.id&&p.fabType==="Fabricate");
      const drgRmUnits=[...new Set(newInstances.filter(i=>i.drawingId===drawing.id&&i.orderId===order.id).map(i=>i.rmUnitId).filter(Boolean))];
      return {
        id:`DPR-${dprTs}-${dprIdx}`,
        releaseId:id,
        orderId:order.id,
        orderNo:order.orderNo||order.id,
        drawingId:drawing.id,
        drawingNo:drawing.drawingNo||"",
        drawingTitle:drawing.title||"",
        qty,
        totalWt:drawing.totalWt||0,
        totalParts:drgParts.length,
        rmUnitIds:drgRmUnits,
        fitupContractorId,
        fitupContractorName,
        weldContractorId,
        weldContractorName,
        pinnedEngineerId:ca.pinnedEngineerId||"",
        tpiStages:ca.tpiStages||[],
        currentStage:"pending", // pending → fitup → fitup_qc → welding → weld_qc → complete
        currentStatus:"awaiting_parts", // awaiting_parts → ready → in_progress → pending_qc → complete
        stageHistory:[],
        fitupStartedAt:null,
        fitupCompleteAt:null,
        fitupQcApprovedAt:null,
        weldStartedAt:null,
        weldCompleteAt:null,
        weldQcApprovedAt:null,
        createdAt:new Date().toISOString(),
        createdBy:user.username,
      };
    });
    if(newDprs.length>0) setDprs(prev=>[...prev,...newDprs]);

    // Collect all drawing instance IDs being released
    const releasedDIIds = selDrawings.map(s=>s.diId).filter(Boolean);

    setReleases(prev=>[...prev,{
      id,releaseDate:today(),createdBy:user.username,status:"in_progress",
      drawings:drawingsPayload,rmUnitAssignments:rmUnitPayload,
      drawingInstanceIds:releasedDIIds,
      rmPicture:rmPicture.map(r=>({matCode:r.matCode,requiredKg:r.requiredKg,availableKg:r.availableKg,status:r.status,lots:r.lots.map(l=>l.id)})),
    }]);

    // Update drawing instance statuses to "released"
    if (releasedDIIds.length>0) {
      setDrawingInstances(prev=>prev.map(di=>
        releasedDIIds.includes(di.id)
          ? {...di, status:"released", releaseId:id, releasedAt:today()}
          : di
      ));
    }

    // Create one DPR per drawing instance — pipeline drives the stage flow
    const diDprs = selDrawings.filter(s=>s.diId).map(s=>{
      const existingDpr = (dprs||[]).find(d=>d.drawingId===s.drawingId&&d.orderId===s.orderId&&d.drawingInstanceId===s.diId);
      if (existingDpr) return null;
      const pipeline = s.processSteps||DEFAULT_PIPELINE_STEPS;
      // First inhouse stage (skipping nesting which happens before DPR)
      const firstStage = pipeline.find(p=>p.step!=="nesting")||pipeline[0]||{step:"cutting"};
      // Collect part-level outbound steps for reference
      const order = (orders||[]).find(o=>o.id===s.orderId);
      const drawingParts = (order?.parts||[]).filter(p=>p.drawingId===s.drawingId&&p.fabType==="Fabricate");
      const partOutboundSteps = drawingParts.filter(p=>(p.processSteps||[]).some(ps=>ps.type==="outbound"))
        .map(p=>({markNo:p.markNo,steps:p.processSteps.filter(ps=>ps.type==="outbound")}));
      const hasOutboundSteps = pipeline.some(p=>p.type==="outbound");
      return {
        id:`DPR-${s.diId}-${Date.now()}`,
        drawingId:s.drawingId, drawingNo:s.drawingNo,
        orderId:s.orderId, releaseId:id,
        drawingInstanceId:s.diId,
        instanceNo:s.instanceNo, totalInstances:s.totalInstances,
        processSteps:pipeline,              // full pipeline from instance
        currentStage:firstStage.step,
        currentStatus:"in_progress",
        hasOutboundSteps,                   // flag for quick checks
        partOutboundSteps,                  // part-level outbound steps
        totalParts:drawingParts.length, totalWt:0,
        stageHistory:[], auditLog:[{action:"dpr-created",by:user.username,date:today(),
          reason:`Pipeline: ${pipeline.map(p=>p.label||p.step).join("→")}`}]
      };
    }).filter(Boolean);
    if (diDprs.length>0) setDprs(prev=>[...prev,...diDprs]);

    // Show outbound steps summary if any
    const outboundCount = diDprs.filter(d=>d.hasOutboundSteps).length;
    if (outboundCount>0) {
      showToast(`Release confirmed — ${outboundCount} drawing instance${outboundCount!==1?"s have":" has"} outbound steps to plan`,"amber");
    }

    onBack();
  };


  // ── UI ──
  const Step1 = () => {
    const activeOrders = (orders||[]).filter(o=>(o.status||"").toLowerCase()==="active")
      .sort((a,b)=>new Date(a.endDate||"9999")-new Date(b.endDate||"9999"));
    const selectedOrder = activeOrders.find(o=>o.id===selectedOrderId);

    // Get drawing instances for this order
    const orderInstances = (drawingInstances||[]).filter(di=>di.orderId===selectedOrderId);

    // Group by drawing
    const instancesByDrawing = {};
    orderInstances.forEach(di=>{
      if (!instancesByDrawing[di.drawingId]) instancesByDrawing[di.drawingId] = [];
      instancesByDrawing[di.drawingId].push(di);
    });

    // For each drawing, sort instances by instanceNo
    Object.values(instancesByDrawing).forEach(arr=>arr.sort((a,b)=>a.instanceNo-b.instanceNo));

    // Which instances are already in an active release
    const releasedDiIds = new Set(
      (releases||[]).filter(r=>r.status==="in_progress")
        .flatMap(r=>(r.drawingInstanceIds||[]))
    );

    const toggleDI = (di) => {
      const key = di.id;
      const exists = selDrawings.find(s=>s.diId===key);
      if (exists) {
        setSelDrawings(prev=>prev.filter(s=>s.diId!==key));
      } else {
        if (releasedDiIds.has(key)) {
          const proceed = window.confirm(
            `Drawing instance ${di.drawingNo} · ${di.instanceNo}/${di.totalInstances} is already in an active release.\n\nRelease again?`
          );
          if (!proceed) return;
        }
        const drawing = (selectedOrder?.drawings||[]).find(d=>d.id===di.drawingId)||{};
        setSelDrawings(prev=>[...prev, {
          diId: di.id,
          drawingId: di.drawingId,
          drawingNo: di.drawingNo,
          instanceNo: di.instanceNo,
          totalInstances: di.totalInstances,
          uniqueId: di.uniqueId || "",
          orderId: di.orderId,
          drawing,
          order: selectedOrder,
          unitsToRelease: 1,
          processSteps: di.processSteps||DEFAULT_PIPELINE_STEPS,
        }]);
      }
    };

    const isDISelected = (diId) => selDrawings.some(s=>s.diId===diId);

    const selectAllUnreleased = () => {
      const toAdd = orderInstances.filter(di=>
        !isDISelected(di.id) && !releasedDiIds.has(di.id) && di.status!=="complete"
      );
      const drawing_map = {};
      (selectedOrder?.drawings||[]).forEach(d=>{ drawing_map[d.id]=d; });
      toAdd.forEach(di=>{
        const drawing = drawing_map[di.drawingId]||{};
        setSelDrawings(prev=>[...prev,{
          diId:di.id, drawingId:di.drawingId, drawingNo:di.drawingNo,
          instanceNo:di.instanceNo, totalInstances:di.totalInstances,
          uniqueId:di.uniqueId||"",
          orderId:di.orderId, drawing, order:selectedOrder, unitsToRelease:1,
          processSteps:di.processSteps||DEFAULT_PIPELINE_STEPS,
        }]);
      });
    };

    return (
      <div>
        <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:4}}>Step 1 — Select Drawing Instances</div>
        <div style={{fontSize:12,color:T.textMid,marginBottom:14}}>Each row is one physical unit of a drawing. Select which units to include in this release.</div>

        {/* Order selector */}
        <div style={{marginBottom:14}}>
          <label style={css.label}>Select Order</label>
          <select value={selectedOrderId} onChange={e=>setSelectedOrderId(e.target.value)} style={{...css.input,maxWidth:560}}>
            <option value="">Select an order...</option>
            {activeOrders.map(o=>(
              <option key={o.id} value={o.id}>{o.id} — {o.clientId}{o.endDate?` · Due ${fmt.date(o.endDate)}`:""}</option>
            ))}
          </select>
        </div>

        {!selectedOrderId&&(
          <div style={{padding:"32px 20px",textAlign:"center",color:T.textLow,fontSize:13,background:T.bgCard,borderRadius:8,border:`1px solid ${T.border}`}}>
            Select an order above to see drawing instances
          </div>
        )}

        {selectedOrderId&&orderInstances.length===0&&(
          <InfoBanner color="amber">No drawing instances found. Make sure drawings have a Received Date and qty set in the Drawing Register.</InfoBanner>
        )}

        {orderInstances.length>0&&(()=>{
          const drawings = (selectedOrder?.drawings||[]).filter(d=>instancesByDrawing[d.id]);
          const totalInstances = orderInstances.length;
          const selectedCount = selDrawings.filter(s=>s.orderId===selectedOrderId).length;
          const unreleasedCount = orderInstances.filter(di=>!releasedDiIds.has(di.id)&&di.status!=="complete").length;

          return (
            <div>
              {/* Summary bar */}
              <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:T.textMid}}>
                  <span style={{fontWeight:700,color:T.text}}>{selectedCount}</span> selected ·
                  <span style={{marginLeft:4,color:T.amber}}>{releasedDiIds.size} in active release</span> ·
                  <span style={{marginLeft:4,color:T.textMid}}>{totalInstances} total instances</span>
                </span>
                {unreleasedCount>0&&(
                  <button onClick={selectAllUnreleased} style={{...css.btn.ghost,fontSize:11}}>
                    Select all unreleased ({unreleasedCount})
                  </button>
                )}
                {selectedCount>0&&(
                  <button onClick={()=>setSelDrawings(prev=>prev.filter(s=>s.orderId!==selectedOrderId))} style={{...css.btn.ghost,fontSize:11,color:T.red}}>
                    Clear selection
                  </button>
                )}
              </div>

              {/* Drawing groups */}
              {drawings.map(drawing=>{
                const instances = instancesByDrawing[drawing.id]||[];
                const allSelected = instances.every(di=>isDISelected(di.id));
                const someSelected = instances.some(di=>isDISelected(di.id));
                return (
                  <div key={drawing.id} style={{marginBottom:12,border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden"}}>
                    {/* Drawing header */}
                    <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:T.bgInput,cursor:"pointer"}}
                      onClick={()=>{
                        if (allSelected) {
                          setSelDrawings(prev=>prev.filter(s=>!instances.some(di=>di.id===s.diId)));
                        } else {
                          instances.forEach(di=>{ if(!isDISelected(di.id)) toggleDI(di); });
                        }
                      }}>
                      <input type="checkbox" checked={allSelected} ref={el=>{if(el) el.indeterminate=someSelected&&!allSelected;}}
                        onChange={()=>{}} style={{cursor:"pointer"}} />
                      <span style={{fontFamily:T.fontMono,fontWeight:700,color:T.accent,fontSize:13}}>{drawing.drawingNo}</span>
                      <span style={{fontSize:11,color:T.textMid,flex:1}}>{drawing.title||""}</span>
                      <span style={{fontSize:11,color:T.textMid}}>{instances.length} instance{instances.length!==1?"s":""}</span>
                      <span style={{fontSize:11,color:T.textMid}}>{drawing.unitWt?`${drawing.unitWt} kg/unit`:"—"}</span>
                    </div>

                    {/* Instance rows */}
                    {instances.map(di=>{
                      const isSelected = isDISelected(di.id);
                      const isInRelease = releasedDiIds.has(di.id);
                      const isComplete = di.status==="complete";
                      const pipeline = di.processSteps||DEFAULT_PIPELINE_STEPS;
                      return (
                        <div key={di.id}
                          onClick={()=>!isComplete&&toggleDI(di)}
                          style={{
                            display:"flex", alignItems:"center", gap:10,
                            padding:"8px 14px 8px 28px",
                            borderTop:`1px solid ${T.border}`,
                            background: isSelected ? T.accentBg : isComplete ? T.greenBg : "transparent",
                            cursor: isComplete?"default":"pointer",
                            opacity: isComplete?0.6:1,
                          }}>
                          <input type="checkbox" checked={isSelected} disabled={isComplete}
                            onChange={()=>toggleDI(di)} onClick={e=>e.stopPropagation()} style={{cursor:"pointer"}} />
                          {/* Instance badge */}
                          <span style={{fontFamily:T.fontMono,fontSize:12,fontWeight:700,
                            color: isComplete?T.green:isInRelease?T.amber:T.text,
                            minWidth:40}}>
                            {di.instanceNo}/{di.totalInstances}
                          </span>
                          {/* Status badge */}
                          <Badge color={isComplete?"green":isInRelease?"amber":di.status==="in_production"?"blue":"gray"}>
                            {isComplete?"Complete":isInRelease?"In Release":di.status==="in_production"?"In Production":"Unreleased"}
                          </Badge>
                          {/* Pipeline display */}
                          <div style={{flex:1,display:"flex",gap:3,flexWrap:"wrap",alignItems:"center"}}>
                            {pipeline.map((step,si)=>(
                              <React.Fragment key={step.step}>
                                <span style={{fontSize:10,padding:"1px 6px",borderRadius:3,
                                  background:step.type==="outbound"?T.amberBg:T.bgInput,
                                  color:step.type==="outbound"?T.amber:T.textMid,
                                  border:`1px solid ${step.type==="outbound"?T.amber:T.border}`}}>
                                  {step.type==="outbound"?"⬆ ":""}{step.label||step.step}
                                </span>
                                {si<pipeline.length-1&&<span style={{fontSize:9,color:T.textLow}}>→</span>}
                              </React.Fragment>
                            ))}
                          </div>
                          {/* Edit pipeline button */}
                          {(user.role==="production_admin"||user.role==="super_admin")&&!isComplete&&(
                            <button onClick={e=>{e.stopPropagation(); setPipelineEditDI(di);}}
                              style={{...css.btn.ghost,fontSize:10,padding:"2px 8px",flexShrink:0,
                                color:T.accent,border:`1px solid ${T.accent}`}}>
                              ⚙ Pipeline
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Outbound steps warning */}
        {(()=>{
          const outboundSels = selDrawings.filter(s=>
            s.orderId===selectedOrderId&&
            (s.processSteps||[]).some(ps=>ps.type==="outbound")
          );
          if (outboundSels.length===0) return null;
          return (
            <div style={{marginTop:14,padding:"10px 14px",background:T.amberBg,borderRadius:8,border:`1px solid ${T.amber}`}}>
              <div style={{fontWeight:700,fontSize:12,color:T.amber,marginBottom:6}}>
                ⬆ {outboundSels.length} selected instance{outboundSels.length!==1?"s have":" has"} outbound steps
              </div>
              <div style={{fontSize:11,color:T.amber}}>
                Vendors will be assigned at execution time when each outbound step is reached.
                Outbound steps: {[...new Set(outboundSels.flatMap(s=>(s.processSteps||[]).filter(p=>p.type==="outbound").map(p=>p.label||p.step)))].join(", ")}
              </div>
            </div>
          );
        })()}

        {/* Next button */}
        {selDrawings.filter(s=>s.orderId===selectedOrderId).length > 0 && (
          <div style={{marginTop:20,display:"flex",justifyContent:"flex-end"}}>
            <button onClick={()=>{ computeRmPicture(); setStep(2); }} style={css.btn.primary}>
              Next: RM Picture →
            </button>
          </div>
        )}

      </div>
    );
  };


  const rmStatusColor = (status) => {
    if (!status) return "gray";
    const s = status.toLowerCase();
    if (s==="sufficient") return "green";
    if (s==="partial") return "amber";
    if (s.includes("qc")) return "amber";
    if (s.includes("not in stock") || s.includes("raise po")) return "red";
    return "gray";
  };

  const Step2 = () => (
    <div>
      <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:4}}>Step 2 — RM Picture</div>
      <div style={{fontSize:12,color:T.textMid,marginBottom:14}}>Raw material requirements for selected drawings, grouped by material code.</div>
      {rmPicture.length===0&&<InfoBanner color="blue">No procure parts found in selected drawings.</InfoBanner>}
      {rmPicture.length>0&&(
        <table style={{width:"100%",borderCollapse:"collapse",background:T.bgCard,borderRadius:8,overflow:"hidden"}}>
          <thead>
            <tr style={{background:T.bgInput}}>
              {["","Mat Code","Section","Grade","Parts / Sheet (kg)","Utilisation","Avail (kg)","Status","RM Units","Nesting Batch","Allocate RM Unit"].map(h=>(
                <th key={h} style={{padding:"8px 10px",fontSize:11,color:T.textMid,fontWeight:700,textAlign:"left",borderBottom:`1px solid ${T.border}`}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rmPicture.map((r)=>(
              <React.Fragment key={r.matCode}>
                <tr>
                  <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`}}>
                    <button onClick={()=>setExpandedMat(p=>({...p,[r.matCode]:!p[r.matCode]}))} style={{...css.btn.ghost,padding:"2px 6px",fontSize:11}}>{expandedMat[r.matCode]?"▼":"▶"}</button>
                  </td>
                  <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`,fontFamily:T.fontMono,fontSize:12}}>{r.matCode}</td>
                  <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`,fontSize:12}}>{r.section}</td>
                  <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`,fontSize:12}}>{r.grade}</td>
                  <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`,fontSize:12}}>
                    {(()=>{
                      const totalPartWt=(r.rmUnitsForMat||[]).reduce((s,x)=>s+(x.selPartWt||0),0);
                      const totalSheetWt=(r.rmUnitsForMat||[]).reduce((s,x)=>s+(x.sheetWt||0),0);
                      if(totalSheetWt===0) return <span style={{color:T.textLow}}>—</span>;
                      const pct=totalSheetWt>0?Math.round(totalPartWt/totalSheetWt*100):0;
                      const color=pct>=85?T.green:pct>=70?T.amber:T.red;
                      return (
                        <span>
                          <span style={{fontWeight:700,color:T.text}}>{totalPartWt.toFixed(0)}</span>
                          <span style={{color:T.textMid}}> / {totalSheetWt.toFixed(0)} kg</span>
                          <span style={{marginLeft:6,fontSize:10,color,fontWeight:600}}>({pct}%)</span>
                        </span>
                      );
                    })()}
                  </td>
                  <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`,fontSize:12}}>
                    {(()=>{
                      const units=r.rmUnitsForMat||[];
                      if(units.length===0) return <span style={{color:T.textLow}}>—</span>;
                      const withUtil=units.filter(u=>u.utilisPct>0);
                      if(withUtil.length===0) return <span style={{color:T.textLow}}>—</span>;
                      const avg=withUtil.reduce((s,u)=>s+u.utilisPct,0)/withUtil.length;
                      const color=avg>=85?T.green:avg>=70?T.amber:T.red;
                      return <span style={{fontWeight:600,color}}>{avg.toFixed(1)}%</span>;
                    })()}
                  </td>
                  <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`,fontSize:12}}>{r.availableKg.toFixed(1)}</td>
                  <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`}}><Badge color={rmStatusColor(r.status)}>{r.status}</Badge></td>
                  <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`,fontSize:11,color:T.textMid,fontFamily:T.fontMono}}>
                    {(()=>{
                      const all=(r.rmUnitsForMat||[]);
                      const pending=all.filter(u=>u.cuttingStatus!=="done");
                      const done=all.filter(u=>u.cuttingStatus==="done");
                      if(all.length===0) return "—";
                      return (
                        <span>
                          {pending.length>0&&<span style={{color:T.accent,fontWeight:700}}>{pending.length} to cut</span>}
                          {pending.length>0&&done.length>0&&<span style={{color:T.textLow}}> · </span>}
                          {done.length>0&&<span style={{color:T.green}}>{done.length} ✓ done</span>}
                        </span>
                      );
                    })()}
                  </td>
                  <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`,fontSize:11,color:T.accent,fontFamily:T.fontMono}}>
                    {(r.batchesForMat||[]).map(b=>b.id).join(", ")||"—"}
                  </td>
                  <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`}}>
                    {(()=>{
                      const pending=(r.rmUnitsForMat||[]).filter(u=>u.cuttingStatus!=="done");
                      if((r.rmUnitsForMat||[]).length===0) return <span style={{fontSize:11,color:T.textLow}}>No RM units in nesting</span>;
                      if(pending.length===0) return <span style={{fontSize:11,color:T.green}}>✓ All sheets already cut</span>;
                      return (
                        <select
                          value={rmUnitAsgn[`alloc::${r.matCode}`]?.rmUnitId||""}
                          onChange={e=>{
                            const ru=(r.rmUnitsForMat||[]).find(x=>x.rmUnitId===e.target.value);
                            const stockLot=(stock||[]).find(s=>
                              normMatCode(s.matCode)===normMatCode(r.matCode)&&
                              ['available','reserved','partially_reserved'].includes(s.status)
                            )||{};
                            setRmUnitAsgn(prev=>({...prev,[`alloc::${r.matCode}`]:{
                              rmUnitId:e.target.value,
                              sheetDim:ru?.sheetDim||"",
                              batchId:ru?.batchId||"",
                              matCode:r.matCode,
                              lotId:stockLot.id||"",
                              lotNo:stockLot.lotNo||"",
                            }}));
                          }}
                          style={{...css.input,fontSize:11,padding:"3px 6px",minWidth:180}}
                        >
                          <option value="">— Select RM unit —</option>
                          {pending.map(ru=>(
                            <option key={ru.rmUnitId} value={ru.rmUnitId}>
                              {ru.rmUnitId} — {ru.selPartCount}/{ru.totalPartCount} parts{ru.cuttingStatus==="partial"?" (partial)":""}{ru.utilisPct>0?` — ${ru.utilisPct.toFixed(0)}% util`:""}
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </td>
                </tr>
                {expandedMat[r.matCode]&&(
                  <tr>
                    <td colSpan={11} style={{padding:"0 20px 12px 32px",background:T.bg,borderBottom:`1px solid ${T.border}`}}>
                      <div style={{fontSize:11,color:T.textMid,marginTop:8,marginBottom:4}}>Drawings needing this material:</div>
                      {r.drawings.map((d,di)=><div key={di} style={{fontSize:11,color:T.text}}>{d.drawingNo} ({d.orderId}){d.qty>1?` × ${d.qty}`:""} — {d.kg.toFixed(1)} kg</div>)}
                      {(r.rmUnitsForMat||[]).length>0&&<>
                        <div style={{fontSize:11,color:T.textMid,marginTop:8,marginBottom:4}}>RM units in nesting batches:</div>
                        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,marginTop:4}}>
                          <thead>
                            <tr style={{background:T.bgInput}}>
                              {["RM Unit ID","Dimensions","Sel Parts","All Parts","Parts Wt (kg)","Sheet Wt (kg)","Usage %","Nesting Util%","Cut Status"].map(h=>(
                                <th key={h} style={{padding:"4px 8px",textAlign:"left",color:T.textLow,fontWeight:600,fontSize:10,borderBottom:`1px solid ${T.border}`}}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(r.rmUnitsForMat||[]).map(ru=>{
                              const usagePct=ru.sheetWt>0?Math.round((ru.selPartWt||0)/ru.sheetWt*100):0;
                              const usageColor=usagePct>=85?T.green:usagePct>=70?T.amber:T.red;
                              const utilColor=ru.utilisPct>=85?T.green:ru.utilisPct>=70?T.amber:ru.utilisPct>0?T.red:T.textLow;
                              const isDone=ru.cuttingStatus==="done";
                              return (
                                <tr key={ru.rmUnitId} style={{borderBottom:`1px solid ${T.border}33`,opacity:isDone?0.5:1}}>
                                  <td style={{padding:"4px 8px",fontFamily:T.fontMono,color:isDone?T.textLow:T.accentHi,fontSize:10}}>{ru.rmUnitId}</td>
                                  <td style={{padding:"4px 8px",fontFamily:T.fontMono,fontSize:10}}>{ru.sheetDim}</td>
                                  <td style={{padding:"4px 8px",fontSize:10,color:T.green,fontWeight:600}}>{ru.selPartCount}</td>
                                  <td style={{padding:"4px 8px",fontSize:10,color:T.textMid}}>{ru.totalPartCount}</td>
                                  <td style={{padding:"4px 8px",fontSize:10,fontWeight:600}}>{(ru.selPartWt||0).toFixed(1)}</td>
                                  <td style={{padding:"4px 8px",fontSize:10,color:T.textMid}}>{ru.sheetWt>0?ru.sheetWt.toFixed(1):"—"}</td>
                                  <td style={{padding:"4px 8px",fontSize:10,fontWeight:600,color:usageColor}}>{ru.sheetWt>0?`${usagePct}%`:"—"}</td>
                                  <td style={{padding:"4px 8px",fontSize:10,color:utilColor}}>{ru.utilisPct>0?`${ru.utilisPct.toFixed(1)}%`:"—"}</td>
                                  <td style={{padding:"4px 8px",fontSize:10}}>
                                    {isDone
                                      ? <span style={{color:T.green,fontWeight:700}}>✓ Cut</span>
                                      : ru.cuttingStatus==="partial"
                                      ? <span style={{color:T.amber,fontWeight:700}}>Partial</span>
                                      : <span style={{color:T.accent}}>To cut</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </>}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
      <div style={{marginTop:16,display:"flex",gap:8}}>
        <button onClick={()=>setStep(1)} style={css.btn.ghost}>← Back</button>
        <button onClick={()=>setStep(3)} style={css.btn.primary}>Next: Cutting Assignment →</button>
      </div>
    </div>
  );

  const Step3 = () => {
    const rmUnits=getRmUnitsForRelease();
    const cuttingContractors=(contractors||[]).filter(c=>c.active!==false&&(c.type||[]).includes('cutting'));
    const unassignedCount=rmUnits.filter(ru=>!rmUnitAsgn[ru.rmUnitId]?.contractorId).length;

    return (
      <div>
        <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:4}}>Step 3 — Cutting Assignment</div>
        <div style={{fontSize:12,color:T.textMid,marginBottom:6}}>Assign each RM unit to a cutting contractor. Parts from non-selected drawings shown in amber.</div>
        {unassignedCount>0&&<InfoBanner color="amber">{unassignedCount} RM unit{unassignedCount!==1?"s":""} not yet assigned. You may proceed and assign later.</InfoBanner>}
        {rmUnits.length===0&&<InfoBanner color="blue">No RM units found in nesting batches for selected drawings. Check that nesting has been imported for this order.</InfoBanner>}
        {rmUnits.length>0&&(
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",background:T.bgCard,borderRadius:8,fontSize:12}}>
              <thead>
                <tr style={{background:T.bgInput}}>
                  {["","RM Unit ID","Mat Code","Dimensions","Parts","Nesting File","Contractor","Start Date","End Date","Status"].map(h=>(
                    <th key={h} style={{padding:"8px 10px",fontSize:11,color:T.textMid,fontWeight:700,textAlign:"left",borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rmUnits.map(ru=>{
                  const a=rmUnitAsgn[ru.rmUnitId]||{};
                  const assigned=!!a.contractorId;
                  const expanded=expandedMat[`ru::${ru.rmUnitId}`];
                  const selCount=ru.parts.filter(p=>p.selected).length;
                  return (
                    <React.Fragment key={ru.rmUnitId}>
                      <tr style={{background:assigned?"transparent":`${T.red}08`}}>
                        <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`}}>
                          <button onClick={()=>setExpandedMat(p=>({...p,[`ru::${ru.rmUnitId}`]:!p[`ru::${ru.rmUnitId}`]}))} style={{...css.btn.ghost,padding:"2px 6px",fontSize:11}}>{expanded?"▼":"▶"}</button>
                        </td>
                        <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,fontFamily:T.fontMono,fontSize:11,color:T.accentHi}}>{ru.rmUnitId}</td>
                        <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,fontSize:11}}>{ru.matCode}</td>
                        <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,fontSize:11,fontFamily:T.fontMono}}>{ru.dimensions}</td>
                        <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,fontSize:11,color:T.textMid}}>{selCount}/{ru.parts.length}</td>
                        <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`}}>
                          <input type="text" value={a.dxfLink||""} onChange={e=>updRmUnitAsgn(ru.rmUnitId,"dxfLink",e.target.value)} placeholder="Drive link..." style={{...css.input,fontSize:11,padding:"3px 6px",minWidth:120}} />
                        </td>
                        <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`}}>
                          <select value={a.contractorId||""} onChange={e=>updRmUnitAsgn(ru.rmUnitId,"contractorId",e.target.value)} style={{...css.input,fontSize:11,padding:"3px 6px",minWidth:150}}>
                            <option value="">— Assign contractor —</option>
                            {cuttingContractors.map(c=><option key={c.id} value={c.id}>{c.name}{c.isInHouse?" (In-House)":""}</option>)}
                          </select>
                        </td>
                        <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`}}>
                          <input type="date" value={a.startDate||today()} onChange={e=>updRmUnitAsgn(ru.rmUnitId,"startDate",e.target.value)} style={{...css.input,fontSize:11,padding:"3px 5px"}} />
                        </td>
                        <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`}}>
                          <input type="date" value={a.endDate||today()} onChange={e=>updRmUnitAsgn(ru.rmUnitId,"endDate",e.target.value)} style={{...css.input,fontSize:11,padding:"3px 5px"}} />
                        </td>
                        <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`}}>
                          {assigned?<Badge color="green">Assigned</Badge>:<Badge color="red">Pending</Badge>}
                        </td>
                      </tr>
                      {expanded&&(
                        <tr>
                          <td colSpan={10} style={{padding:"6px 16px 10px 40px",background:T.bg,borderBottom:`1px solid ${T.border}`}}>
                            <div style={{fontSize:10,fontWeight:700,color:T.textMid,marginBottom:4}}>PARTS ON THIS SHEET</div>
                            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                              {ru.parts.map(p=>(
                                <span key={p.markNo} style={{padding:"2px 6px",borderRadius:3,background:p.selected?T.accentLo:T.amberBg,color:p.selected?T.accentHi:T.amber,fontSize:10,fontFamily:T.fontMono}} title={p.selected?"Selected drawing":"Other drawing"}>
                                  {p.markNo}{!p.selected&&" ⚠"}
                                </span>
                              ))}
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
        )}
        <div style={{marginTop:16,display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>setStep(2)} style={css.btn.ghost}>← Back</button>
          <button
            onClick={()=>{
              if(unassignedCount>0) setExitWarning(true);
              else setStep(4);
            }}
            style={css.btn.primary}>Next: Operations & Routing →</button>
          {exitWarning&&(
            <div style={{padding:"8px 12px",background:T.amberBg,border:`1px solid ${T.amber}`,borderRadius:6,fontSize:12,color:T.amber,display:"flex",gap:10,alignItems:"center"}}>
              ⚠ {unassignedCount} RM unit{unassignedCount!==1?"s":""} unassigned. Proceed anyway?
              <button onClick={()=>{setExitWarning(false);setStep(4);}} style={{...css.btn.primary,padding:"3px 10px",fontSize:11}}>Yes, proceed</button>
              <button onClick={()=>setExitWarning(false)} style={{...css.btn.ghost,padding:"3px 10px",fontSize:11}}>Go back</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const productionEngineers=USERS.filter(u=>u.role==="production_engineer"&&u.active);
  const FITUP_WELDING_STAGES=[{id:"fitup",label:"Fit-Up"},{id:"welding",label:"Welding"}];
  const TPI_STAGE_OPTS=[{id:"fit_up",label:"Fit-Up"},{id:"welding",label:"Welding"},{id:"blasting",label:"Blasting"},{id:"painting",label:"Painting"}];

  const Step4 = () => {
    const rmUnits=getRmUnitsForRelease();
    const ALL_SEC_OPS=['Drill','Bevel','Grind'];
    const cuttingContractors=(contractors||[]).filter(c=>c.active!==false&&(c.type||[]).includes('cutting'));

    return (
      <div>
        <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:4}}>Step 4 — Operations & Routing</div>
        <div style={{fontSize:12,color:T.textMid,marginBottom:14}}>Define the operation chain for each part. Cut is always first. Additional operations route the part to the next station before welding.</div>
        {rmUnits.length===0&&<InfoBanner color="blue">No RM units found. Go back to Step 3.</InfoBanner>}
        {rmUnits.map(ru=>{
          const a=rmUnitAsgn[ru.rmUnitId]||{};
          const cuttingContractorName=(contractors||[]).find(c=>c.id===a.contractorId)?.name||"Unassigned";
          return (
            <div key={ru.rmUnitId} style={{...css.card,marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontFamily:T.fontMono,fontWeight:700,color:T.accentHi,fontSize:13}}>{ru.rmUnitId}</span>
                <span style={{fontSize:11,color:T.textMid}}>Cutting: <span style={{color:T.text,fontWeight:600}}>{cuttingContractorName}</span></span>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead>
                    <tr style={{background:T.bgInput}}>
                      <th style={{padding:"6px 10px",textAlign:"left",color:T.textMid,fontWeight:700,fontSize:10,borderBottom:`1px solid ${T.border}`}}>Mark No</th>
                      <th style={{padding:"6px 10px",textAlign:"left",color:T.textMid,fontWeight:700,fontSize:10,borderBottom:`1px solid ${T.border}`}}>Drawing</th>
                      <th style={{padding:"6px 10px",textAlign:"center",color:T.green,fontWeight:700,fontSize:10,borderBottom:`1px solid ${T.border}`}}>Cut ✓</th>
                      {ALL_SEC_OPS.map(op=>(
                        <th key={op} style={{padding:"6px 10px",textAlign:"left",color:T.textMid,fontWeight:700,fontSize:10,borderBottom:`1px solid ${T.border}`,minWidth:200}}>{op}</th>
                      ))}
                      <th style={{padding:"6px 10px",textAlign:"left",color:T.amber,fontWeight:700,fontSize:10,borderBottom:`1px solid ${T.border}`}}>Next → Weld</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ru.parts.map(p=>{
                      const partOps=rmUnitAsgn[ru.rmUnitId]?.ops?.[p.markNo]?.ops||p.part?.requiredOps||['Cut'];
                      const opContractors=rmUnitAsgn[ru.rmUnitId]?.ops?.[p.markNo]?.opContractors||{};
                      const hasSecOp=ALL_SEC_OPS.some(op=>partOps.includes(op));
                      return (
                        <tr key={p.markNo} style={{borderBottom:`1px solid ${T.border}44`,background:p.selected?"transparent":`${T.amber}08`}}>
                          <td style={{padding:"6px 10px",fontFamily:T.fontMono,color:p.selected?T.accentHi:T.amber,fontWeight:600}}>{p.markNo}{!p.selected&&<span style={{fontSize:9,marginLeft:4,color:T.amber}}>⚠ other drg</span>}</td>
                          <td style={{padding:"6px 10px",fontSize:10,color:T.textMid}}>{p.drawingNo}</td>
                          <td style={{padding:"6px 10px",textAlign:"center"}}>
                            <span style={{color:T.green,fontSize:14}}>✓</span>
                          </td>
                          {ALL_SEC_OPS.map(op=>{
                            const checked=partOps.includes(op);
                            const contractorForOp=opContractors[op]||"";
                            const isSame=contractorForOp==="__same__";
                            return (
                              <td key={op} style={{padding:"6px 10px"}}>
                                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                                  <label style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer",fontSize:11}}>
                                    <input type="checkbox" checked={checked} onChange={e=>{
                                      const newOps=e.target.checked?[...new Set([...partOps,op])]:partOps.filter(x=>x!==op);
                                      updRmUnitPartOps(ru.rmUnitId,p.markNo,newOps);
                                      if(p.partId) setConfirmedOps(prev=>({...prev,[p.partId]:newOps}));
                                      if(!e.target.checked) updRmUnitOp(ru.rmUnitId,p.markNo,op,"");
                                    }} />
                                    <span style={{color:checked?T.text:T.textLow}}>{op}</span>
                                  </label>
                                  {checked&&(
                                    <div style={{paddingLeft:18}}>
                                      <label style={{display:"flex",alignItems:"center",gap:4,fontSize:10,cursor:"pointer",marginBottom:3}}>
                                        <input type="radio" checked={isSame} onChange={()=>updRmUnitOp(ru.rmUnitId,p.markNo,op,"__same__")} />
                                        <span style={{color:isSame?T.green:T.textMid}}>Same contractor ({cuttingContractorName})</span>
                                      </label>
                                      <label style={{display:"flex",alignItems:"center",gap:4,fontSize:10,cursor:"pointer"}}>
                                        <input type="radio" checked={!isSame&&contractorForOp!==""}  onChange={()=>updRmUnitOp(ru.rmUnitId,p.markNo,op,"__diff__")} />
                                        <span style={{color:!isSame&&contractorForOp!==""?T.accent:T.textMid}}>Different contractor</span>
                                      </label>
                                      {!isSame&&contractorForOp!==""&&(
                                        <select value={contractorForOp==="__diff__"?"":contractorForOp} onChange={e=>updRmUnitOp(ru.rmUnitId,p.markNo,op,e.target.value||"__diff__")} style={{...css.input,fontSize:10,padding:"2px 4px",marginTop:3,minWidth:140}}>
                                          <option value="">Select...</option>
                                          {cuttingContractors.map(c=><option key={c.id} value={c.id}>{c.name}{c.isInHouse?" (In-House)":""}</option>)}
                                        </select>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                          <td style={{padding:"6px 10px",fontSize:10,color:T.amber,fontWeight:600}}>
                            {hasSecOp?"After ops":"Direct"}
                            <div style={{fontSize:9,color:T.textLow}}>→ Weld contractor</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
        <div style={{marginTop:16,display:"flex",gap:8}}>
          <button onClick={()=>setStep(3)} style={css.btn.ghost}>← Back</button>
          <button onClick={()=>setStep(5)} style={css.btn.primary}>Next: Welding Assignment →</button>
        </div>
      </div>
    );
  };

  const Step5 = () => {
    const missingContractor=selDrawings.some(({drawingId})=>{
      const ca=contAsgn[drawingId]||{};
      return (ca.stages||[]).some(s=>['fitup','welding'].includes(s))&&!ca.contractorId;
    });
    return (
      <div>
        <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:4}}>Step 5 — Welding & Contractor Assignment</div>
        <div style={{fontSize:12,color:T.textMid,marginBottom:8}}>Assign fit-up and welding contractors per drawing.</div>
        <div style={{marginBottom:14,display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={()=>selDrawings.forEach(({drawingId})=>{
            const ca=contAsgn[drawingId]||{};
            if(ca.fitupContractorId) updCont(drawingId,"contractorId",ca.fitupContractorId);
          })} style={{...css.btn.ghost,fontSize:11}}>Copy all fit-up → welding</button>
        </div>
        {selDrawings.map(({drawingId,orderId,drawing,order})=>{
          const ca=contAsgn[drawingId]||{};
          const stages=ca.stages||[];
          const tpiStages=ca.tpiStages!==undefined?ca.tpiStages:(order.quality?.tpiHoldPoints||[]);
          const toggleStage=s=>updCont(drawingId,"stages",stages.includes(s)?stages.filter(x=>x!==s):[...stages,s]);
          const toggleTpi=s=>updCont(drawingId,"tpiStages",tpiStages.includes(s)?tpiStages.filter(x=>x!==s):[...tpiStages,s]);
          return (
            <div key={drawingId+orderId} style={{...css.card,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div>
                  <span style={{fontFamily:T.fontMono,fontWeight:700,color:T.accentHi}}>{drawing.drawingNo}</span>
                  <span style={{color:T.textMid,fontSize:11,marginLeft:8}}>{orderId}</span>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:10}}>
                <div>
                  <label style={css.label}>Fit-Up Contractor</label>
                  <select value={ca.fitupContractorId||ca.contractorId||""} onChange={e=>{
                    updCont(drawingId,"fitupContractorId",e.target.value);
                    if(!ca.weldContractorId) updCont(drawingId,"contractorId",e.target.value);
                  }} style={css.input}>
                    <option value="">Select contractor...</option>
                    {(contractors||[]).filter(c=>(c.type||[]).some(t=>['fit_up','welding'].includes(t))).map(c=><option key={c.id} value={c.id}>{c.name}{c.isInHouse?" (In-House)":""}</option>)}
                  </select>
                </div>
                <div>
                  <label style={css.label}>
                    Welding Contractor
                    <button onClick={()=>updCont(drawingId,"contractorId",ca.fitupContractorId||ca.contractorId||"")} style={{...css.btn.ghost,fontSize:9,padding:"1px 6px",marginLeft:8}}>= Same as fit-up</button>
                  </label>
                  <select value={ca.contractorId||ca.fitupContractorId||""} onChange={e=>updCont(drawingId,"contractorId",e.target.value)} style={css.input}>
                    <option value="">Select contractor...</option>
                    {(contractors||[]).filter(c=>(c.type||[]).some(t=>['fit_up','welding'].includes(t))).map(c=><option key={c.id} value={c.id}>{c.name}{c.isInHouse?" (In-House)":""}</option>)}
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
              <div style={{marginBottom:10}}>
                <label style={css.label}>Stages (Fit-Up / Welding Contractor)</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {FITUP_WELDING_STAGES.map(s=>(
                    <label key={s.id} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,cursor:"pointer",color:stages.includes(s.id)?T.accent:T.textMid}}>
                      <input type="checkbox" checked={stages.includes(s.id)} onChange={()=>toggleStage(s.id)} />{s.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={css.label}>TPI Required at Stage</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {TPI_STAGE_OPTS.map(s=>(
                    <label key={s.id} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,cursor:"pointer",color:tpiStages.includes(s.id)?T.accent:T.textMid}}>
                      <input type="checkbox" checked={tpiStages.includes(s.id)} onChange={()=>toggleTpi(s.id)} />{s.label}
                    </label>
                  ))}
                </div>
                {order.quality?.tpiHoldPoints?.length>0&&<div style={{fontSize:10,color:T.textLow,marginTop:4}}>Pre-checked from order quality: {order.quality.tpiHoldPoints.join(", ")}</div>}
              </div>
            </div>
          );
        })}
        {missingContractor&&<InfoBanner color="amber">Contractor required for fit-up/welding drawings before confirming.</InfoBanner>}
        <div style={{marginTop:16,display:"flex",gap:8}}>
          <button onClick={()=>setStep(4)} style={css.btn.ghost}>← Back</button>
          <button onClick={confirm} disabled={missingContractor} style={missingContractor?{...css.btn.green,opacity:0.45,cursor:"not-allowed"}:css.btn.green}>✓ Create Release</button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:20}}>
        <button onClick={onBack} style={css.btn.ghost}>← Production</button>
        <div style={{fontSize:18,fontWeight:800,color:T.text}}>New Production Release</div>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:24,alignItems:"center"}}>
        {["Select Drawings","RM Picture","Cutting Assignment","Operations & Routing","Welding & Contractors"].map((label,i)=>{
          const n=i+1; const active=step===n; const done=step>n;
          return (
            <React.Fragment key={n}>
              {i>0&&<div style={{flex:1,height:2,background:done?T.accent:T.border,minWidth:20}} />}
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:24,height:24,borderRadius:12,background:active?T.accent:done?T.green:T.border,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{done?"✓":n}</div>
                <span style={{fontSize:11,color:active?T.accent:done?T.green:T.textMid,fontWeight:active?700:400,whiteSpace:"nowrap"}}>{label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <PipelineEditorModal
        pipelineEditDI={pipelineEditDI}
        setPipelineEditDI={setPipelineEditDI}
        processTypes={processTypes}
        setDrawingInstances={setDrawingInstances}
        setSelDrawings={setSelDrawings}
        DEFAULT_PIPELINE_STEPS={DEFAULT_PIPELINE_STEPS}
      />
      {step===1&&<Step1 />}
      {step===2&&<Step2 />}
      {step===3&&<Step3 />}
      {step===4&&<Step4 />}
      {step===5&&<Step5 />}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════════════════
// STEP 6: MACHINE OPERATOR QUEUE
// ═══════════════════════════════════════════════════════════════════════════════
const MachineOperatorQueue = ({ user, releases, setReleases, issueRequests, setIssueRequests, stock, setStock, materials, instances, setInstances, orders, nestingBatches }) => {
  const today = () => new Date().toISOString().slice(0,10);
  const [tab, setTab] = useState("assignments");

  // ── All rmUnits assigned to this operator / contractor ─────────────────────
  const myRmUnits = releases.filter(r => r.status === "in_progress").flatMap(r =>
    (r.rmUnitAssignments||[])
      .filter(ru => ru.contractorId && (ru.contractorId === user.contractorId || user.role === "machine_operator" || user.role === "super_admin"))
      .map(ru => ({ ...ru, releaseId: r.id }))
  );
  const legacyAssignments = releases.filter(r => r.status === "in_progress").flatMap(r =>
    (r.machineAssignments||[]).map(a => ({ ...a, releaseId: r.id, _legacy: true }))
  );

  // ── State machine per rmUnit ───────────────────────────────────────────────
  // 1=no lot  2=request rm  3=awaiting store  4=rm in hand  5=cutting  6=complete
  const getRmState = (ru) => {
    if (!ru.lotId) return 1;
    const req = (issueRequests||[]).find(r => r.rmUnitId === ru.rmUnitId && r.releaseId === ru.releaseId);
    if (!req) return 2;
    if (req.status === "pending")  return 3;
    if (req.status === "issued") {
      if (ru.cuttingComplete) return 6;
      if (ru.cuttingStarted)  return 5;
      return 4;
    }
    if (req.status === "rejected") return 2;
    return 2;
  };
  const getLegacyState = (a) => {
    if (!a.lotId) return 1;
    const req = (issueRequests||[]).find(r => r.machineAssignmentId === a.id);
    if (!req) return 2;
    if (req.status === "pending")  return 3;
    if (req.status === "issued") {
      if (a.cuttingComplete) return 6;
      if (a.cuttingStarted)  return 5;
      return 4;
    }
    return 2;
  };

  // ── Tab buckets ────────────────────────────────────────────────────────────
  // Tab 1 — Assignments: state 1,2,3 (no lot / request pending / awaiting store)
  const tab1 = myRmUnits.filter(ru => [1,2,3].includes(getRmState(ru)));
  // Tab 2 — Cut/Process: state 4,5 (rm in hand / cutting)
  const tab2 = myRmUnits.filter(ru => [4,5].includes(getRmState(ru)));
  // Tab 3 — Completed: state 6
  const tab3 = myRmUnits.filter(ru => getRmState(ru) === 6);
  // Tab 4 — Offcuts: all offcut lots traceable to this operator's rmUnits
  // Include completed/cancelled release rmUnitIds for offcut tab visibility
  const allMyRmUnits = releases.flatMap(r =>
    (r.rmUnitAssignments||[])
      .filter(ru => ru.contractorId && (ru.contractorId === user.contractorId || user.role === "machine_operator" || user.role === "super_admin"))
      .map(ru => ({ ...ru, releaseId: r.id }))
  );
  const myRmUnitIds = new Set(allMyRmUnits.map(ru => ru.rmUnitId));
  const tab4Offcuts = (stock||[]).filter(s => s.isOffcut && (myRmUnitIds.has(s.parentRmUnitId) || myRmUnitIds.has(s.createdFrom)));

  // ── Actions (unchanged logic) ──────────────────────────────────────────────
  const requestRmForUnit = (ru) => {
    const yr  = new Date().getFullYear();
    const seq = (issueRequests||[]).length + 1;
    const id  = `IRQ-${yr}-${String(seq).padStart(3,"0")}`;
    const stockLot = (stock||[]).find(s => s.id === ru.stockLotId) ||
      (stock||[]).find(s => normMatCode(s.matCode) === normMatCode(ru.matCode) &&
        ['available','reserved','partially_reserved'].includes(s.status)) || {};
    const sheetWt = ru.sheetWt || calcSheetWt(ru.rmUnitId) ||
      (stockLot.wtReceived && parseRmUnitTotal(ru.rmUnitId) > 0
        ? Math.round(stockLot.wtReceived / parseRmUnitTotal(ru.rmUnitId) * 100) / 100
        : stockLot.wtAvailable || 0);
    setIssueRequests(prev => [...prev, {
      id, requestDate:today(), requestedBy:user.username, requestedByName:user.name,
      rmUnitId:ru.rmUnitId, releaseId:ru.releaseId,
      lotId:stockLot.id||ru.stockLotId||ru.lotId, lotNo:stockLot.lotNo||"",
      matCode:ru.matCode, dimensions:ru.dimensions||"",
      contractorId:ru.contractorId||"", contractorName:ru.contractorName||user.name,
      wtRequested:sheetWt, parts:ru.parts||[],
      dxfLink:ru.dxfLink||"", nestingFile:ru.nestingFile||"",
      status:"pending", remarks:"",
    }]);
  };

  const startCuttingRu = (ru) => {
    setReleases(prev => prev.map(r => r.id !== ru.releaseId ? r : {
      ...r, rmUnitAssignments:(r.rmUnitAssignments||[]).map(x =>
        x.rmUnitId === ru.rmUnitId
          ? { ...x, cuttingStarted:true, cuttingStartedBy:user.username, cuttingStartedDate:today() }
          : x
      )
    }));
  };

  const completeCuttingRu = (ru, offcutWt, offcutDim) => {
    setReleases(prev => prev.map(r => r.id !== ru.releaseId ? r : {
      ...r, rmUnitAssignments:(r.rmUnitAssignments||[]).map(x =>
        x.rmUnitId === ru.rmUnitId
          ? { ...x, cuttingComplete:true, cuttingCompleteBy:user.username,
              cuttingCompleteDate:today(), offcutWt:parseFloat(offcutWt)||0, offcutDim:offcutDim||"" }
          : x
      )
    }));
    // Auto-create offcut stock lot
    const offWt = parseFloat(offcutWt) || 0;
    if (offWt > 0) {
      const lot = (stock||[]).find(s => s.id === (ru.stockLotId||ru.lotId)) || {};
      setStock(prev => [...prev, {
        id:`STK-OFFCUT-${Date.now()}`,
        parentLotId:ru.stockLotId||ru.lotId, parentRmUnitId:ru.rmUnitId,
        matCode:ru.matCode, sectionType:lot.sectionType||"PLATE",
        grade:lot.grade||"", size:lot.size||"",
        lotNo: genLotNo(stock),
        rmUnitId: buildOffcutRmUnitId(lot.lotNo||"???", lot.sectionType||"PLATE", lot.grade||"", lot.size||"", offcutDim, stock),
        sheetDim: offcutDim||"",
        sheetLength: (offcutDim||"").split(/[Xx×]/)[0]||0,
        sheetWidth:  (offcutDim||"").split(/[Xx×]/)[1]||0,
        sheetWt: offWt,
        sheetCount: 1,
        wtReceived:offWt, wtAvailable:offWt, wtAllocated:0, wtIssued:0,
        status:"pending_store",
        isOffcut:true, bayId:lot.bayId||"",
        // Inherit MTC and batch traceability from parent lot
        heatNo:lot.heatNo||"", batchNo:lot.batchNo||"",
        mtcUploaded:lot.mtcUploaded||false, mtcDoc:lot.mtcDoc||"",
        vendorId:lot.vendorId||"", vendorCode:lot.vendorCode||"", vendorName:lot.vendorName||"",
        poId:lot.poId||"", grnId:lot.grnId||"",
        receivedDate:today(), createdBy:user.username,
        createdFrom:ru.rmUnitId, releaseId:ru.releaseId,
        reservations:[], issues:[],
        auditLog:[{ action:"offcut_created", by:user.username, date:today(),
          reason:`Offcut from ${ru.rmUnitId}` }],
      }]);
    }
    const ts = new Date().toISOString();
    // Advance instances to cutting_qc + create side-cut instances
    setInstances(prev => {
      const updated = prev.map(inst =>
        inst.rmUnitId === ru.rmUnitId && inst.currentStage === "cutting"
          ? { ...inst, currentStage:"cutting_qc", currentStatus:"pending_supervisor", cutAt:ts, cutBy:user.username }
          : inst
      );
      const batch = (nestingBatches||[]).find(b => b.id === ru.batchId);
      if (!batch) return updated;
      const lot2 = (batch.lots||[]).find(l => l.matCode === ru.matCode);
      if (!lot2) return updated;
      const sheet = (lot2.sheets||[]).find(s => s.rmUnitId === ru.rmUnitId);
      if (!sheet) return updated;
      const allMarkNos = new Set(sheet.parts||[]);
      const existingMarkNos = new Set(updated.filter(i => i.rmUnitId === ru.rmUnitId).map(i => i.markNo));
      const newInstances = [];
      const baseTs = Date.now(); let idx = 0;
      (orders||[]).forEach(order => {
        (order.parts||[]).filter(p => allMarkNos.has(p.markNo) && !existingMarkNos.has(p.markNo)).forEach(p => {
          newInstances.push({
            instanceId:`SIDECUT-${ru.rmUnitId}-${p.markNo}-${baseTs+idx++}`,
            markNo:p.markNo, desc:p.desc||"", drawingId:p.drawingId||"",
            drawingNo:"", orderId:order.id, instanceNo:1, totalInstances:1,
            currentStage:"cutting_qc", currentStatus:"pending_supervisor",
            rmUnitId:ru.rmUnitId, cuttingContractorId:ru.contractorId||"",
            cuttingContractorName:ru.contractorName||"",
            lotId:ru.lotId||"", nestingRunId:null, barRef:null, batchNo:ru.batchId||"",
            cuttingBayUsed:"", stageHistory:[], defects:[], outboundCount:0,
            outboundHistory:[], qualityConcernFlag:false, rejectionCount:0,
            createdAt:ts, createdBy:user.username, cutAt:ts, cutBy:user.username,
            isSideCut:true,
          });
        });
      });
      return [...updated, ...newInstances];
    });
  };

  // ── Section label helper ───────────────────────────────────────────────────
  const SL = ({ title, count, color, sub }) => (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, marginTop:20 }}>
      <div style={{ fontSize:11, fontWeight:800, color:color||T.textMid, letterSpacing:"0.08em" }}>{title}</div>
      {count > 0 && <div style={{ background:color||T.textMid, color:"#fff", fontSize:10,
        fontWeight:800, borderRadius:8, padding:"1px 6px" }}>{count}</div>}
      {sub && <div style={{ fontSize:11, color:T.textLow }}>{sub}</div>}
    </div>
  );

  // ── rmUnit card — Tab 1 (Assignments) ─────────────────────────────────────
  const AssignmentCard = ({ ru }) => {
    const state = getRmState(ru);
    const req   = (issueRequests||[]).find(r => r.rmUnitId === ru.rmUnitId && r.releaseId === ru.releaseId);
    const lot   = (stock||[]).find(s => s.id === ru.lotId) || {};
    const borderColor = state === 3 ? T.amber : state === 1 ? T.textLow : T.accent;
    return (
      <div style={{ ...css.card, marginBottom:10, borderLeft:`4px solid ${borderColor}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
          <div>
            <div style={{ fontFamily:T.fontMono, fontSize:13, fontWeight:700, color:T.accent }}>{ru.rmUnitId}</div>
            <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>
              {ru.matCode} · {ru.dimensions} · Release {ru.releaseId}
            </div>
            <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>
              Parts on sheet: <strong style={{ color:T.text }}>{(ru.parts||[]).length}</strong>
              {ru.startDate && <span> · Planned: {ru.startDate} → {ru.endDate}</span>}
            </div>
          </div>
          <Badge color={state===3?"amber":state===1?"gray":"blue"}>
            {state===1?"No Lot":state===2?"Request RM":state===3?"Awaiting Store":"—"}
          </Badge>
        </div>
        {ru.lotId && (
          <div style={{ fontSize:12, color:T.textMid, marginBottom:8, padding:"6px 10px",
            background:T.bgInput, borderRadius:5 }}>
            Lot: <span style={{ color:T.text, fontFamily:T.fontMono }}>{lot.lotNo||ru.lotId}</span>
            {lot.bayId && <span> · Bay: <strong>{lot.bayId}</strong></span>}
            {lot.wtAvailable > 0 && <span> · {lot.wtAvailable.toFixed(0)} kg available</span>}
          </div>
        )}
        {(ru.dxfLink||ru.nestingFile) && (
          <div style={{ display:"flex", gap:8, marginBottom:8 }}>
            {ru.dxfLink && <a href={ru.dxfLink} target="_blank" rel="noopener noreferrer"
              style={{ fontSize:11, color:T.accent, padding:"3px 8px", background:T.bgInput,
                borderRadius:4, border:`1px solid ${T.border}`, textDecoration:"none" }}>📐 DXF</a>}
            {ru.nestingFile && <a href={ru.nestingFile} target="_blank" rel="noopener noreferrer"
              style={{ fontSize:11, color:T.accent, padding:"3px 8px", background:T.bgInput,
                borderRadius:4, border:`1px solid ${T.border}`, textDecoration:"none" }}>📋 Nesting</a>}
          </div>
        )}
        {req && req.status === "rejected" && (
          <div style={{ fontSize:11, color:T.red, padding:"6px 10px",
            background:T.redBg, borderRadius:5, marginBottom:8 }}>
            ✕ Request {req.id} rejected — {req.remarks || "No reason given"}
          </div>
        )}
        {state === 1 && (
          <div style={{ fontSize:12, color:T.textLow, padding:"10px", background:T.bgInput,
            borderRadius:6, textAlign:"center" }}>No lot assigned — contact production manager</div>
        )}
        {state === 2 && (
          <button onClick={() => requestRmForUnit(ru)}
            style={{ ...css.btn.primary, width:"100%", padding:"10px 0", fontSize:13 }}>
            📦 Request Material Issue from Store
          </button>
        )}
        {state === 3 && (
          <div style={{ padding:"10px 14px", background:T.amberBg,
            border:`1px solid ${T.amber}44`, borderRadius:6, fontSize:12,
            color:T.amber, textAlign:"center" }}>
            ⏳ Awaiting store — Request <strong>{req?.id}</strong> pending
          </div>
        )}
      </div>
    );
  };

  // ── rmUnit card — Tab 2 (Cut/Process) ─────────────────────────────────────
  const CutCard = ({ ru }) => {
    const state = getRmState(ru);
    const req   = (issueRequests||[]).find(r => r.rmUnitId === ru.rmUnitId && r.releaseId === ru.releaseId);
    const lot   = (stock||[]).find(s => s.id === ru.lotId) || {};
    const [showOffcut, setShowOffcut] = React.useState(false);
    const [offcutWt,   setOffcutWt]   = React.useState("");
    const [offcutDim,  setOffcutDim]  = React.useState("");
    const [showLayout, setShowLayout] = React.useState(false);

    // Find nesting sheet data for this rmUnit
    const nestSheet = React.useMemo(()=>{
      for (const batch of (nestingBatches||[])) {
        for (const lot2 of (batch.lots||[])) {
          const s = (lot2.sheets||[]).find(sh=>sh.rmUnitId===ru.rmUnitId);
          if (s) return s;
        }
      }
      return null;
    },[nestingBatches, ru.rmUnitId]);

    // Auto-populate offcut from nesting data when showOffcut opens
    const handleShowOffcut = () => {
      if (nestSheet?.offcutDim && !offcutDim) setOffcutDim(nestSheet.offcutDim);
      setShowOffcut(true);
    };

    // Parts with positions from nesting
    const partsWithPos = nestSheet?.parts || ru.parts || [];
    const hasPositions = partsWithPos.some(p=>p?.x !== null && p?.x !== undefined);

    // Simple SVG layout for machine operator
    const renderLayout = () => {
      const svgW = 400; const svgH = 130; const pad = 8;
      const shL = nestSheet?.sheetLen || 1000;
      const shW = nestSheet?.sheetWid || 500;
      const scale = Math.min((svgW-pad*2)/shL, (svgH-pad*2)/shW);
      const colors = ["#DBEAFE","#DCFCE7","#FEF3C7","#EDE9FE","#CFFAFE","#FFE4E6"];
      return (
        <svg width={svgW} height={svgH+20} style={{display:"block",border:"1px solid #CBD5E1",borderRadius:4,background:"#F8FAFC",marginTop:6}}>
          <rect x={pad} y={pad} width={shL*scale} height={shW*scale} fill="#F1F5F9" stroke="#94A3B8" strokeWidth={1}/>
          {nestSheet?.lengthUsed && nestSheet.lengthUsed < shL && (
            <rect x={pad+nestSheet.lengthUsed*scale} y={pad} width={(shL-nestSheet.lengthUsed)*scale} height={shW*scale}
              fill="#FEF9C3" stroke="#D97706" strokeWidth={1} strokeDasharray="3,2" opacity={0.6}/>
          )}
          {hasPositions && partsWithPos.map((p,pi)=>{
            if (!p || p.x===null || p.x===undefined) return null;
            const pw=80; const ph=50;
            const isRot=Math.abs(p.rotation||0)>0.1;
            return (
              <g key={pi}>
                <rect x={pad+p.x*scale} y={pad+p.y*scale}
                  width={(isRot?ph:pw)*scale} height={(isRot?pw:ph)*scale}
                  fill={colors[pi%colors.length]} stroke="#1D4ED8" strokeWidth={0.8} opacity={0.85}/>
                <text x={pad+p.x*scale+(isRot?ph:pw)*scale/2} y={pad+p.y*scale+(isRot?pw:ph)*scale/2+3}
                  textAnchor="middle" fontSize={8} fontFamily="monospace" fill="#1D4ED8" fontWeight="600">
                  {p.markNo||p}
                </text>
              </g>
            );
          })}
          <text x={pad} y={svgH+14} fontSize={8} fill="#64748B" fontFamily="monospace">
            {nestSheet?.sheetDim} {nestSheet?.offcutDim?`· Offcut≈${nestSheet.offcutDim}`:""}
          </text>
        </svg>
      );
    };

    return (
      <div style={{ ...css.card, marginBottom:10,
        borderLeft:`4px solid ${state===5?T.accent:T.green}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
          <div>
            <div style={{ fontFamily:T.fontMono, fontSize:13, fontWeight:700, color:T.accent }}>{ru.rmUnitId}</div>
            <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>
              {ru.matCode} · {ru.dimensions}
            </div>
          </div>
          <Badge color={state===5?"blue":"green"}>
            {state===5?"Cutting in Progress":"RM in Hand — Ready"}
          </Badge>
        </div>
        {/* Lot info */}
        <div style={{ fontSize:12, color:T.textMid, marginBottom:10, padding:"6px 10px",
          background:T.bgInput, borderRadius:5 }}>
          Lot: <span style={{ color:T.text, fontFamily:T.fontMono }}>{lot.lotNo||ru.lotId}</span>
          {req?.issuedBy && <span style={{ color:T.textMid }}> · Issued by {req.issuedBy} on {req.issueDate}</span>}
        </div>
        {/* Parts on sheet */}
        <div style={{ marginBottom:10 }}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{ fontSize:11, color:T.textMid, fontWeight:700 }}>
              Parts on this sheet ({partsWithPos.length})
            </div>
            {(hasPositions || nestSheet) && (
              <button onClick={()=>setShowLayout(s=>!s)}
                style={{...css.btn.ghost,fontSize:10,padding:"2px 6px"}}>
                {showLayout?"▲ Hide Layout":"👁 View Cut Layout"}
              </button>
            )}
          </div>
          <div style={{ paddingTop:4, display:"flex", flexWrap:"wrap", gap:4 }}>
            {partsWithPos.map((p,pi) => (
              <span key={pi} style={{ fontFamily:T.fontMono, fontSize:10,
                color:T.text, background:T.bgInput, padding:"2px 6px", borderRadius:4 }}>
                {p.markNo||p}{typeof p==="object"&&p.qty>1?` ×${p.qty}`:""}
              </span>
            ))}
          </div>
          {showLayout && nestSheet && renderLayout()}
          {nestSheet?.offcutDim && (
            <div style={{fontSize:10,color:T.green,marginTop:4}}>
              📐 Nesting suggests offcut ≈ <strong>{nestSheet.offcutDim}</strong> — verify after cutting
            </div>
          )}
        </div>
        {(ru.dxfLink||ru.nestingFile) && (
          <div style={{ display:"flex", gap:8, marginBottom:10 }}>
            {ru.dxfLink && <a href={ru.dxfLink} target="_blank" rel="noopener noreferrer"
              style={{ fontSize:11, color:T.accent, padding:"3px 8px", background:T.bgInput,
                borderRadius:4, border:`1px solid ${T.border}`, textDecoration:"none" }}>📐 DXF</a>}
            {ru.nestingFile && <a href={ru.nestingFile} target="_blank" rel="noopener noreferrer"
              style={{ fontSize:11, color:T.accent, padding:"3px 8px", background:T.bgInput,
                borderRadius:4, border:`1px solid ${T.border}`, textDecoration:"none" }}>📋 Nesting</a>}
          </div>
        )}
        {/* Actions */}
        {state === 4 && (
          <button onClick={() => startCuttingRu(ru)}
            style={{ ...css.btn.green, width:"100%", padding:"10px 0", fontSize:13 }}>
            ✂ Start Cutting
          </button>
        )}
        {state === 5 && !showOffcut && (
          <button onClick={handleShowOffcut}
            style={{ ...css.btn.primary, width:"100%", padding:"10px 0", fontSize:13 }}>
            ✓ Mark Cutting Complete + Log Offcut
          </button>
        )}
        {state === 5 && showOffcut && (
          <div style={{ padding:14, background:T.bgInput, borderRadius:8,
            border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:12 }}>
              Log Offcut & Confirm Complete
            </div>
            {/* Expected offcut from nesting */}
            {(()=>{
              const batch = (nestingBatches||[]).find(b=>(b.lots||[]).some(l=>(l.sheets||[]).some(s=>s.rmUnitId===ru.rmUnitId)));
              const lot2 = batch?(batch.lots||[]).find(l=>(l.sheets||[]).some(s=>s.rmUnitId===ru.rmUnitId)):null;
              const sheet = lot2?(lot2.sheets||[]).find(s=>s.rmUnitId===ru.rmUnitId):null;
              const sheetDim = sheet?.sheetDim||ru.rmUnitId?.split("/").slice(-2,-1)[0]||"";
              const dimParts = sheetDim.split(/[Xx×]/);
              const sheetL=parseFloat(dimParts[0])||0, sheetW=parseFloat(dimParts[1])||0;
              const sheetAreaMm2 = sheetL*sheetW;
              const utilisPct = sheet?.utilisPct||0;
              const expectedMm2 = utilisPct>0 ? sheetAreaMm2*(1-utilisPct/100) : 0;
              if (!expectedMm2) return null;
              return (
                <div style={{ padding:"8px 10px", background:T.bg, borderRadius:6, border:`1px solid ${T.border}`, marginBottom:10, fontSize:11 }}>
                  <span style={{ color:T.textMid }}>Expected offcut: </span>
                  <span style={{ fontFamily:T.fontMono, color:T.amber, fontWeight:700 }}>{(expectedMm2/1e6).toFixed(2)} m²</span>
                  <span style={{ color:T.textMid }}> ({Math.round(expectedMm2).toLocaleString()} mm²)</span>
                  <span style={{ color:T.textMid }}> · Utilisation {utilisPct}%</span>
                </div>
              );
            })()}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
              <div>
                <label style={css.label}>Offcut Weight (kg)</label>
                <input type="number" value={offcutWt} onChange={e => setOffcutWt(e.target.value)}
                  placeholder="0" style={{ ...css.input, fontSize:12 }} />
              </div>
              <div>
                <label style={css.label}>Offcut Dimensions (mm)</label>
                <input type="text" value={offcutDim} onChange={e => setOffcutDim(e.target.value)}
                  placeholder="e.g. 1500×3200" style={{ ...css.input, fontSize:12 }} />
              </div>
            </div>
            <div style={{ fontSize:11, color:T.textMid, marginBottom:12 }}>
              {parseFloat(offcutWt) > 0
                ? `Offcut of ${offcutWt} kg will be logged and sent to store for acceptance.`
                : "Enter 0 if no offcut (full utilisation)."}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => { completeCuttingRu(ru, offcutWt, offcutDim); setShowOffcut(false); }}
                style={{ ...css.btn.green, flex:1, padding:"10px 0", fontSize:13 }}>
                ✓ Confirm Complete
              </button>
              <button onClick={() => setShowOffcut(false)} style={{ ...css.btn.ghost, padding:"10px 16px" }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── rmUnit card — Tab 3 (Completed) ───────────────────────────────────────
  // ── Corrections state ──────────────────────────────────────────────────────
  const [corrModal, setCorrModal] = useState(null); // {ru, type}
  const [corrForm, setCorrForm] = useState({});

  const addAuditLog = (arr, action, by, reason) => [
    ...(arr||[]),
    { action, by, date:today(), reason, ts:new Date().toISOString() }
  ];

  // Correction: revert cutting confirmation
  const doRevertCutting = (ru, reason) => {
    if (!reason?.trim()) return showToast("Reason required","amber");
    // Remove instances created for this rmUnit that are still at cutting stage
    setInstances(prev => (prev||[]).filter(i =>
      !(i.rmUnitId === ru.rmUnitId && i.currentStage === "cutting")
    ));
    // Revert the rmUnitAssignment
    setReleases(prev => prev.map(r => r.id !== ru.releaseId ? r : {
      ...r, rmUnitAssignments:(r.rmUnitAssignments||[]).map(x =>
        x.rmUnitId !== ru.rmUnitId ? x : {
          ...x, cuttingComplete:false, cuttingCompleteBy:null,
          cuttingCompleteDate:null, offcutWt:0, offcutDim:"",
          revertedAt:today(), revertedBy:user.name, revertReason:reason
        }
      )
    }));
    showToast(`Cutting reverted for ${ru.rmUnitId}`);
    setCorrModal(null);
  };

  // Correction: edit offcut dimensions on completed sheet
  const doEditOffcut = (ru, newDim, newWt) => {
    // Find and update the offcut stock lot
    setStock(prev => prev.map(s => {
      if (!s.isOffcut || s.createdFrom !== ru.rmUnitId) return s;
      const wt = parseFloat(newWt)||s.wtReceived;
      return { ...s, sheetDim:newDim, offcutDimensions:newDim, wtReceived:wt, wtAvailable:wt,
        auditLog:addAuditLog(s.auditLog,"offcut-edited",user.name,`Dim: ${s.offcutDimensions}→${newDim}, Wt: ${s.wtReceived}→${wt}`) };
    }));
    // Update rmUnitAssignment offcut fields
    setReleases(prev => prev.map(r => r.id !== ru.releaseId ? r : {
      ...r, rmUnitAssignments:(r.rmUnitAssignments||[]).map(x =>
        x.rmUnitId !== ru.rmUnitId ? x : { ...x, offcutDim:newDim, offcutWt:parseFloat(newWt)||x.offcutWt }
      )
    }));
    showToast("Offcut updated");
    setCorrModal(null);
  };

  // Correction: add missed offcut retrospectively
  const doAddOffcutRetro = (ru, dim, wt) => {
    if (!dim?.trim()) return showToast("Enter offcut dimensions first","amber");
    // Find the parent stock lot — prefer stockLotId, then lotId, then matCode+issued match
    const lot = (stock||[]).find(s => s.id === (ru.stockLotId||ru.lotId)) ||
                (stock||[]).find(s => normMatCode(s.matCode)===normMatCode(ru.matCode) && (s.status==="issued"||s.status==="available")) ||
                (stock||[]).find(s => normMatCode(s.matCode)===normMatCode(ru.matCode)) || {};
    // Auto-calculate weight if not entered: L × W × thickness × 7850 / 1e9
    let offWt = parseFloat(wt)||0;
    if (offWt === 0 && dim?.trim()) {
      const parts = dim.trim().toUpperCase().split(/[X×]/);
      const l = parseFloat(parts[0])||0;
      const w = parseFloat(parts[1])||l; // if only one dimension (section), use it as length
      const isPlate = (ru.matCode||"").toUpperCase().includes("PLT")||(ru.matCode||"").toUpperCase().includes("PLATE");
      if (isPlate) {
        // Extract thickness from matCode e.g. PLATE/MS/E350/12MM → 12
        const thkMatch = (ru.matCode||"").match(/(\d+(?:\.\d+)?)\s*MM/i);
        const thk = thkMatch ? parseFloat(thkMatch[1]) : (parseFloat(lot.size)||0);
        if (l>0 && w>0 && thk>0) offWt = +(l/1000 * w/1000 * thk/1000 * 7850).toFixed(1);
      } else {
        // Section: use wtPerMetre from materials library
        const lib = (materials||[]).find(m=>normMatCode(m.matCode)===normMatCode(ru.matCode));
        if (lib?.wtPerMetre && l>0) offWt = +(l/1000 * lib.wtPerMetre).toFixed(1);
      }
    }
    const newLotNo = genLotNo(stock);
    const newOc = {
      id:`STK-OFFCUT-RETRO-${Date.now()}`,
      lotNo:newLotNo, parentLotId:lot.id||"", parentRmUnitId:ru.rmUnitId,
      matCode:ru.matCode, sectionType:lot.sectionType||"PLATE",
      grade:lot.grade||"", size:lot.size||"",
      rmUnitId:buildOffcutRmUnitId(lot.lotNo||"???",lot.sectionType||"PLATE",lot.grade||"",lot.size||"",dim,stock),
      sheetDim:dim, offcutDimensions:dim, sheetWt:offWt,
      wtReceived:offWt, wtAvailable:offWt, wtAllocated:0, wtIssued:0, wtConsumed:0,
      status:"pending_store", isOffcut:true, bayId:lot.bayId||"",
      // Inherit MTC and batch traceability from parent lot
      heatNo:lot.heatNo||"", batchNo:lot.batchNo||"",
      mtcUploaded:lot.mtcUploaded||false, mtcDoc:lot.mtcDoc||"",
      vendorId:lot.vendorId||"", vendorCode:lot.vendorCode||"", vendorName:lot.vendorName||"",
      poId:lot.poId||"", grnId:lot.grnId||"",
      receivedDate:today(), createdBy:user.name, createdFrom:ru.rmUnitId,
      releaseId:ru.releaseId, isRetroAdded:true,
      auditLog:[{action:"offcut-retro-added",by:user.name,date:today(),reason:`Retrospectively added — missed during cutting confirmation`}],
      reservations:[], issues:[],
    };
    setStock(prev => [...prev, newOc]);
    setReleases(prev => prev.map(r => r.id !== ru.releaseId ? r : {
      ...r, rmUnitAssignments:(r.rmUnitAssignments||[]).map(x =>
        x.rmUnitId !== ru.rmUnitId ? x : { ...x, offcutWt:(x.offcutWt||0)+offWt, offcutDim:x.offcutDim||dim }
      )
    }));
    showToast(`Offcut lot ${newLotNo} added retrospectively`);
    setCorrModal(null);
  };

  // Correction: edit good/defective split
  const doEditSplit = (ru, markNo, newGoodQty, reason) => {
    if (!reason?.trim()) return showToast("Reason required","amber");
    setInstances(prev => {
      const relevant = prev.filter(i => i.rmUnitId === ru.rmUnitId && i.markNo === markNo && i.currentStage === "cutting");
      const currentGood = relevant.filter(i => !i.defects?.length).length;
      const delta = newGoodQty - currentGood;
      if (delta === 0) return prev;
      const updated = prev.map(i => {
        if (i.rmUnitId !== ru.rmUnitId || i.markNo !== markNo) return i;
        return { ...i, auditLog:addAuditLog(i.auditLog||[],"split-edited",user.name,reason) };
      });
      return updated;
    });
    showToast("Split updated");
    setCorrModal(null);
  };

  // Correction: edit lot reference
  const doEditLotRef = (ru, newLotId, reason) => {
    if (!reason?.trim()) return showToast("Reason required","amber");
    const newLot = (stock||[]).find(s => s.id === newLotId);
    if (!newLot) return showToast("Lot not found","amber");
    setInstances(prev => prev.map(i =>
      i.rmUnitId !== ru.rmUnitId ? i : {
        ...i, lotId:newLotId, batchNo:newLot.batchNo||i.batchNo,
        auditLog:addAuditLog(i.auditLog||[],"lot-ref-edited",user.name,`${i.lotId}→${newLotId}: ${reason}`)
      }
    ));
    setReleases(prev => prev.map(r => r.id !== ru.releaseId ? r : {
      ...r, rmUnitAssignments:(r.rmUnitAssignments||[]).map(x =>
        x.rmUnitId !== ru.rmUnitId ? x : { ...x, stockLotId:newLotId, stockLotNo:newLot.lotNo }
      )
    }));
    showToast("Lot reference updated");
    setCorrModal(null);
  };

  const CompletedCard = ({ ru }) => {
    const allInsts = (instances||[]).filter(i => i.rmUnitId === ru.rmUnitId);
    // Group by markNo, take first instance per mark for stage display
    const byMark = {};
    allInsts.filter(i => !i.isSideCut).forEach(i => {
      if (!byMark[i.markNo]) byMark[i.markNo] = i;
    });
    const marks = Object.values(byMark);

    // Derive status buckets across all instances
    const qcPending    = allInsts.filter(i => i.currentStage === "cutting_qc");
    const qcCleared    = allInsts.filter(i => ["fitup","welding","complete"].includes(i.currentStage));
    const collected    = allInsts.filter(i => i.currentStage === "fitup" && i.currentStatus === "in_progress");
    const awaitingColl = allInsts.filter(i => i.currentStage === "fitup" && i.currentStatus !== "in_progress");

    // Derive single summary status for the card border
    const borderColor = qcPending.length > 0 ? T.amber : T.green;

    // Unique contractor names for "to be collected by"
    const collContractors = [...new Set(
      allInsts.filter(i => i.assignedContractorName).map(i => i.assignedContractorName)
    )];

    return (
      <div style={{ ...css.card, marginBottom:10, borderLeft:`4px solid ${borderColor}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
          <div>
            <div style={{ fontFamily:T.fontMono, fontSize:13, fontWeight:700, color:T.accent }}>{ru.rmUnitId}</div>
            <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>
              {ru.matCode} · Completed {ru.cuttingCompleteDate || "—"}
            </div>
            {ru.offcutWt > 0 && (
              <div style={{ fontSize:11, color:T.textLow, marginTop:2 }}>
                Offcut: {ru.offcutWt} kg ({ru.offcutDim || "—"})
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <Badge color={qcPending.length > 0 ? "amber" : allInsts.length === 0 ? "gray" : "green"}>
              {qcPending.length > 0 ? `${qcPending.length} QC Pending` : allInsts.length === 0 ? "No Instances" : "QC Cleared"}
            </Badge>
            {(can(user,"production.revert_cutting")||can(user,"production.edit_offcut")||can(user,"production.add_offcut_retro")||can(user,"production.edit_split")||can(user,"production.edit_lot_ref"))&&(
              <button onClick={()=>{ setCorrForm({}); setCorrModal({ru,type:"menu"}); }}
                style={{ ...css.btn.ghost, fontSize:11, padding:"3px 8px" }}>⋯ Correct</button>
            )}
          </div>
        </div>

        {/* Status breakdown */}
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {qcPending.length > 0 && (
            <div style={{ padding:"8px 10px", background:T.amberBg,
              border:`1px solid ${T.amber}44`, borderRadius:6, fontSize:11 }}>
              <div style={{ fontWeight:700, color:T.amber, marginBottom:4 }}>
                ⏳ {qcPending.length} instance{qcPending.length!==1?"s":""} — Cutting QC Pending
              </div>
              <div style={{ color:T.textMid }}>
                QC team to inspect — {qcPending[0]?.assignedEngineer || "unassigned to QC user"}
              </div>
            </div>
          )}
          {awaitingColl.length > 0 && (
            <div style={{ padding:"8px 10px", background:T.greenBg,
              border:`1px solid ${T.green}44`, borderRadius:6, fontSize:11 }}>
              <div style={{ fontWeight:700, color:T.green, marginBottom:4 }}>
                ✅ {awaitingColl.length} instance{awaitingColl.length!==1?"s":""} — QC Cleared
              </div>
              {collContractors.length > 0
                ? <div style={{ color:T.textMid }}>
                    To be collected by: <strong style={{ color:T.text }}>{collContractors.join(", ")}</strong>
                  </div>
                : <div style={{ color:T.textMid }}>Awaiting weld contractor assignment — will go to bay</div>
              }
            </div>
          )}
          {collected.length > 0 && (
            <div style={{ padding:"8px 10px", background:T.bgInput,
              border:`1px solid ${T.border}`, borderRadius:6, fontSize:11 }}>
              <div style={{ fontWeight:700, color:T.textMid, marginBottom:4 }}>
                🚚 {collected.length} instance{collected.length!==1?"s":""} — Collected / In Fit-Up
              </div>
              <div style={{ color:T.textLow }}>
                {[...new Set(collected.map(i => i.assignedContractorName).filter(Boolean))].join(", ")||"Contractor"}
                {" "}has taken custody
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Corrections Modal ──────────────────────────────────────────────────────
  const CorrModal = () => {
    if (!corrModal) return null;
    const { ru, type } = corrModal;
    const relRu = (releases||[]).flatMap(r=>(r.rmUnitAssignments||[]).map(x=>({...x,releaseId:r.id}))).find(x=>x.rmUnitId===ru?.rmUnitId&&x.releaseId===ru?.releaseId)||ru||{};
    const existingOffcut = (stock||[]).find(s=>s.isOffcut&&s.createdFrom===ru?.rmUnitId);
    const relInstances = (instances||[]).filter(i=>i.rmUnitId===ru?.rmUnitId);
    const hasProgressed = relInstances.some(i=>i.currentStage&&i.currentStage!=="cutting");

    if (type==="menu") return (
      <Modal title={`Corrections — ${ru?.rmUnitId}`} onClose={()=>setCorrModal(null)} width={480}>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {can(user,"production.edit_offcut")&&existingOffcut&&(
            <button onClick={()=>{ setCorrForm({dim:existingOffcut.offcutDimensions||relRu.offcutDim||"",wt:existingOffcut.wtReceived||relRu.offcutWt||""}); setCorrModal({ru,type:"edit_offcut"}); }}
              style={{ ...css.btn.secondary, textAlign:"left", justifyContent:"flex-start" }}>
              ✏️ Edit offcut dimensions / weight
            </button>
          )}
          {can(user,"production.edit_offcut")&&!existingOffcut&&(
            <button onClick={()=>{ setCorrForm({dim:"",wt:""}); setCorrModal({ru,type:"add_offcut"}); }}
              style={{ ...css.btn.secondary, textAlign:"left", justifyContent:"flex-start" }}>
              ➕ Record offcut (not logged during cutting)
            </button>
          )}
          {can(user,"production.add_offcut_retro")&&existingOffcut&&(
            <button onClick={()=>{ setCorrForm({dim:"",wt:""}); setCorrModal({ru,type:"add_offcut"}); }}
              style={{ ...css.btn.secondary, textAlign:"left", justifyContent:"flex-start" }}>
              ➕ Add additional offcut retrospectively
            </button>
          )}
          {can(user,"production.edit_split")&&relInstances.some(i=>i.currentStage==="cutting")&&(
            <button onClick={()=>{ setCorrForm({markNo:"",goodQty:"",reason:""}); setCorrModal({ru,type:"edit_split"}); }}
              style={{ ...css.btn.secondary, textAlign:"left", justifyContent:"flex-start" }}>
              ✏️ Edit good / defective split
            </button>
          )}
          {can(user,"production.edit_lot_ref")&&(
            <button onClick={()=>{ setCorrForm({newLotId:"",reason:""}); setCorrModal({ru,type:"edit_lot_ref"}); }}
              style={{ ...css.btn.secondary, textAlign:"left", justifyContent:"flex-start" }}>
              🔄 Edit lot reference
            </button>
          )}
          {can(user,"production.revert_cutting")&&!hasProgressed&&(
            <button onClick={()=>{ setCorrForm({reason:""}); setCorrModal({ru,type:"revert_cutting"}); }}
              style={{ ...css.btn.ghost, textAlign:"left", justifyContent:"flex-start", color:T.red, border:`1px solid ${T.red}` }}>
              ↩ Revert cutting confirmation
            </button>
          )}
          {can(user,"production.revert_cutting")&&hasProgressed&&(
            <div style={{ padding:"8px 12px", background:T.amberBg, borderRadius:6, fontSize:12, color:T.amber }}>
              ⚠ Revert not available — parts have progressed beyond cutting (QC/Fit-up/Welding)
            </div>
          )}
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:12 }}>
          <button onClick={()=>setCorrModal(null)} style={css.btn.secondary}>Close</button>
        </div>
      </Modal>
    );

    if (type==="edit_offcut") {
      const eDimRef = React.useRef(corrForm.dim||"");
      const eWtRef = React.useRef(corrForm.wt||"");
      return (
        <Modal title="Edit Offcut" onClose={()=>setCorrModal(null)} width={440}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <Field label="Offcut Dimensions (e.g. 1200X800)">
              <input defaultValue={corrForm.dim||""} onChange={e=>{eDimRef.current=e.target.value;}}
                placeholder="LxW in mm" style={{...css.input}} />
            </Field>
            <Field label="Offcut Weight (kg)">
              <input type="number" defaultValue={corrForm.wt||""} onChange={e=>{eWtRef.current=e.target.value;}}
                style={{...css.input}} />
            </Field>
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button onClick={()=>setCorrModal({ru,type:"menu"})} style={css.btn.secondary}>Back</button>
            <button onClick={()=>doEditOffcut(ru,eDimRef.current,eWtRef.current)} style={css.btn.primary}>Save Changes</button>
          </div>
        </Modal>
      );
    }

    if (type==="add_offcut") {
      const dimRef = React.useRef(corrForm.dim||"");
      const isPlate = (ru?.matCode||"").toUpperCase().includes("PLATE")||(ru?.matCode||"").toUpperCase().startsWith("PLT");
      return (
        <Modal title="Add Missed Offcut" onClose={()=>setCorrModal(null)} width={440}>
          <InfoBanner color="amber">This offcut was not recorded at cutting time. It will be created as a stock lot pending store verification.</InfoBanner>
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:12, marginBottom:12 }}>
            <Field label={isPlate?"Offcut Dimensions (LxW in mm — e.g. 1200X800)":"Offcut Length (mm)"}>
              <input defaultValue={corrForm.dim||""} onChange={e=>{ dimRef.current=e.target.value; }}
                placeholder={isPlate?"e.g. 1200X800":"e.g. 1200"} style={{...css.input}} autoFocus />
            </Field>
            <div style={{ fontSize:11, color:T.textMid, padding:"6px 10px", background:T.bg, borderRadius:4 }}>
              Weight will be auto-calculated from dimensions and material thickness. Leave as-is if you want to enter manually in stock after store verification.
            </div>
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button onClick={()=>setCorrModal({ru,type:"menu"})} style={css.btn.secondary}>Back</button>
            <button onClick={()=>doAddOffcutRetro(ru, dimRef.current, "")} style={css.btn.primary}>Add Offcut</button>
          </div>
        </Modal>
      );
    }

    if (type==="edit_split") return (
      <Modal title="Edit Good / Defective Split" onClose={()=>setCorrModal(null)} width={480}>
        <InfoBanner color="amber">Requires mandatory reason. This creates an audit trail.</InfoBanner>
        <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:10 }}>
          <Field label="Mark No">
            <Sel value={corrForm.markNo||""} onChange={e=>setCorrForm(f=>({...f,markNo:e.target.value}))}>
              <option value="">Select part...</option>
              {[...new Set(relInstances.filter(i=>i.currentStage==="cutting").map(i=>i.markNo))].map(mn=>(
                <option key={mn} value={mn}>{mn} — {relInstances.filter(i=>i.markNo===mn&&i.currentStage==="cutting").length} instances</option>
              ))}
            </Sel>
          </Field>
          <Field label="New Good Qty">
            <Input type="number" value={corrForm.goodQty||""} onChange={e=>setCorrForm(f=>({...f,goodQty:e.target.value}))} />
          </Field>
          <Field label="Reason (mandatory)">
            <Input value={corrForm.reason||""} onChange={e=>setCorrForm(f=>({...f,reason:e.target.value}))} placeholder="e.g. Miscounted during confirmation" />
          </Field>
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:12 }}>
          <button onClick={()=>setCorrModal({ru,type:"menu"})} style={css.btn.secondary}>Back</button>
          <button onClick={()=>doEditSplit(ru,corrForm.markNo,+corrForm.goodQty,corrForm.reason)} style={css.btn.primary}>Save</button>
        </div>
      </Modal>
    );

    if (type==="edit_lot_ref") return (
      <Modal title="Edit Lot Reference" onClose={()=>setCorrModal(null)} width={480}>
        <InfoBanner color="amber">Changes which physical stock lot is recorded as consumed for this sheet. Requires mandatory reason.</InfoBanner>
        <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:10 }}>
          <Field label="New Lot No">
            <Sel value={corrForm.newLotId||""} onChange={e=>setCorrForm(f=>({...f,newLotId:e.target.value}))}>
              <option value="">Select lot...</option>
              {(stock||[]).filter(s=>normMatCode(s.matCode)===normMatCode(ru?.matCode)&&!s.isOffcut).map(s=>(
                <option key={s.id} value={s.id}>{s.lotNo} — {s.sheetDim||s.size} — {s.status}</option>
              ))}
            </Sel>
          </Field>
          <Field label="Reason (mandatory)">
            <Input value={corrForm.reason||""} onChange={e=>setCorrForm(f=>({...f,reason:e.target.value}))} placeholder="e.g. Wrong lot scanned at time of issue" />
          </Field>
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:12 }}>
          <button onClick={()=>setCorrModal({ru,type:"menu"})} style={css.btn.secondary}>Back</button>
          <button onClick={()=>doEditLotRef(ru,corrForm.newLotId,corrForm.reason)} style={css.btn.primary}>Update Lot</button>
        </div>
      </Modal>
    );

    if (type==="revert_cutting") return (
      <Modal title="Revert Cutting Confirmation" onClose={()=>setCorrModal(null)} width={480}>
        <InfoBanner color="red">This will remove all cutting instances for this sheet and reset it to pending. Use only when cutting has NOT actually happened.</InfoBanner>
        <div style={{ marginTop:12 }}>
          <Field label="Reason (mandatory)">
            <Input value={corrForm.reason||""} onChange={e=>setCorrForm(f=>({...f,reason:e.target.value}))} placeholder="e.g. Confirmed by mistake — sheet not yet cut" />
          </Field>
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:12 }}>
          <button onClick={()=>setCorrModal({ru,type:"menu"})} style={css.btn.secondary}>Back</button>
          <button onClick={()=>doRevertCutting(ru,corrForm.reason)}
            style={{ ...css.btn.primary, background:T.red, borderColor:T.red }}>
            ↩ Revert Cutting
          </button>
        </div>
      </Modal>
    );

    return null;
  };

  // ── Tab counts ─────────────────────────────────────────────────────────────
  const totalJobs = myRmUnits.length + legacyAssignments.length;
  const TABS = [
    { id:"assignments", label:"Assignments", count:tab1.length,
      alert: tab1.some(r=>getRmState(r)===3) ? T.amber : T.accent },
    { id:"cutting",     label:"Cut / Process", count:tab2.length,
      alert: tab2.length > 0 ? T.accent : T.textMid },
    { id:"completed",   label:"Completed", count:tab3.length,
      alert: T.green },
    { id:"offcuts",     label:"Offcuts", count:tab4Offcuts.length,
      alert: tab4Offcuts.some(o=>["pending_store","pending_offcut_verification"].includes(o.status)) ? T.amber : T.green },
  ];

  return (
    <div>
      <CorrModal />
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:800, color:T.text }}>My Cutting Jobs</div>
        <div style={{ fontSize:13, color:T.textMid }}>{user.name} · {totalJobs} job{totalJobs!==1?"s":""}</div>
      </div>

      {totalJobs === 0 ? (
        <InfoBanner color="blue">No cutting jobs assigned yet. A production release must be created and assigned to you first.</InfoBanner>
      ) : (
        <>
          {/* Tab bar */}
          <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${T.border}`, marginBottom:20 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding:"10px 18px", fontSize:13, fontWeight: tab===t.id?700:400,
                color: tab===t.id ? T.accent : T.textMid,
                background:"transparent", border:"none",
                borderBottom: tab===t.id ? `2px solid ${T.accent}` : "2px solid transparent",
                cursor:"pointer", display:"flex", alignItems:"center", gap:7
              }}>
                {t.label}
                {t.count > 0 && (
                  <span style={{ background: tab===t.id ? T.accent : t.alert,
                    color:"#fff", borderRadius:10, fontSize:11,
                    fontWeight:800, padding:"1px 7px", minWidth:20, textAlign:"center" }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── TAB 1: ASSIGNMENTS ── */}
          {tab === "assignments" && (
            <div>
              {tab1.length === 0 ? (
                <div style={{ textAlign:"center", padding:48, color:T.textLow, fontSize:13 }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>📋</div>
                  All assigned sheets have been issued — check Cut / Process tab
                </div>
              ) : (
                <>
                  {tab1.filter(r=>getRmState(r)===3).length > 0 && (
                    <SL title="AWAITING STORE ISSUE" count={tab1.filter(r=>getRmState(r)===3).length} color={T.amber} />
                  )}
                  {tab1.filter(r=>getRmState(r)===3).map(ru =>
                    <AssignmentCard key={ru.rmUnitId+ru.releaseId} ru={ru} />
                  )}
                  {tab1.filter(r=>getRmState(r)===2).length > 0 && (
                    <SL title="REQUEST PENDING — ACTION NEEDED" count={tab1.filter(r=>getRmState(r)===2).length} color={T.accent} />
                  )}
                  {tab1.filter(r=>getRmState(r)===2).map(ru =>
                    <AssignmentCard key={ru.rmUnitId+ru.releaseId} ru={ru} />
                  )}
                  {tab1.filter(r=>getRmState(r)===1).length > 0 && (
                    <SL title="NO LOT ASSIGNED" count={tab1.filter(r=>getRmState(r)===1).length} color={T.textLow} />
                  )}
                  {tab1.filter(r=>getRmState(r)===1).map(ru =>
                    <AssignmentCard key={ru.rmUnitId+ru.releaseId} ru={ru} />
                  )}
                </>
              )}
            </div>
          )}

          {/* ── TAB 2: CUT / PROCESS ── */}
          {tab === "cutting" && (
            <div>
              {tab2.length === 0 ? (
                <div style={{ textAlign:"center", padding:48, color:T.textLow, fontSize:13 }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>✂️</div>
                  No sheets in hand yet — material must be issued by store first
                </div>
              ) : (
                <>
                  {tab2.filter(r=>getRmState(r)===5).length > 0 && (
                    <SL title="CUTTING IN PROGRESS" count={tab2.filter(r=>getRmState(r)===5).length} color={T.accent} />
                  )}
                  {tab2.filter(r=>getRmState(r)===5).map(ru =>
                    <CutCard key={ru.rmUnitId+ru.releaseId} ru={ru} />
                  )}
                  {tab2.filter(r=>getRmState(r)===4).length > 0 && (
                    <SL title="RM IN HAND — READY TO CUT" count={tab2.filter(r=>getRmState(r)===4).length} color={T.green} />
                  )}
                  {tab2.filter(r=>getRmState(r)===4).map(ru =>
                    <CutCard key={ru.rmUnitId+ru.releaseId} ru={ru} />
                  )}
                </>
              )}
            </div>
          )}

          {/* ── TAB 3: COMPLETED ── */}
          {tab === "completed" && (
            <div>
              {tab3.length === 0 ? (
                <div style={{ textAlign:"center", padding:48, color:T.textLow, fontSize:13 }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>✅</div>
                  No completed sheets yet
                </div>
              ) : (
                <>
                  <SL title="CUTTING COMPLETE" count={tab3.length} color={T.green}
                    sub="— showing part disposition status" />
                  {tab3.map(ru => <CompletedCard key={ru.rmUnitId+ru.releaseId} ru={ru} />)}
                </>
              )}
            </div>
          )}

          {/* ── TAB 4: OFFCUTS ── */}
          {tab === "offcuts" && (
            <div>
              {tab4Offcuts.length === 0 ? (
                <div style={{ textAlign:"center", padding:48, color:T.textLow, fontSize:13 }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>♻️</div>
                  No offcuts logged yet
                </div>
              ) : (
                <>
                  {tab4Offcuts.filter(o=>["pending_store","pending_offcut_verification"].includes(o.status)).length > 0 && (
                    <>
                      <SL title="PENDING STORE ACCEPTANCE"
                        count={tab4Offcuts.filter(o=>["pending_store","pending_offcut_verification"].includes(o.status)).length}
                        color={T.amber} sub="— store team to verify and accept into stock" />
                      {tab4Offcuts.filter(o=>["pending_store","pending_offcut_verification"].includes(o.status)).map(offcut => (
                        <div key={offcut.id} style={{ ...css.card, marginBottom:8,
                          borderLeft:`3px solid ${T.amber}` }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                            <div>
                              <div style={{ fontFamily:T.fontMono, fontSize:12, fontWeight:700, color:T.text }}>
                                {offcut.lotNo}
                              </div>
                              <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>
                                {offcut.matCode} · {offcut.size||"—"} · {offcut.wtReceived} kg
                              </div>
                              <div style={{ fontSize:11, color:T.textLow, marginTop:2 }}>
                                From: {offcut.parentRmUnitId}
                              </div>
                            </div>
                            <Badge color="amber">Awaiting Store</Badge>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {tab4Offcuts.filter(o=>!["pending_store","pending_offcut_verification"].includes(o.status)).length > 0 && (
                    <>
                      <SL title="ACCEPTED INTO STOCK"
                        count={tab4Offcuts.filter(o=>!["pending_store","pending_offcut_verification"].includes(o.status)).length}
                        color={T.green} />
                      {tab4Offcuts.filter(o=>!["pending_store","pending_offcut_verification"].includes(o.status)).map(offcut => (
                        <div key={offcut.id} style={{ ...css.card, marginBottom:8,
                          borderLeft:`3px solid ${T.green}` }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                            <div>
                              <div style={{ fontFamily:T.fontMono, fontSize:12, fontWeight:700, color:T.text }}>
                                {offcut.lotNo}
                              </div>
                              <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>
                                {offcut.matCode} · {offcut.size||"—"} · {offcut.wtReceived} kg
                              </div>
                              <div style={{ fontSize:11, color:T.textLow, marginTop:2 }}>
                                Stock Lot ID: <span style={{ fontFamily:T.fontMono, color:T.accent }}>{offcut.id}</span>
                              </div>
                            </div>
                            <Badge color="green">In Stock ✓</Badge>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Legacy assignments — shown only in assignments tab as a footnote */}
          {tab === "assignments" && legacyAssignments.length > 0 && (
            <div style={{ marginTop:24 }}>
              <SL title="LEGACY ASSIGNMENTS" count={legacyAssignments.length} color={T.textLow} />
              {legacyAssignments.map(a => {
                const state = getLegacyState(a);
                const req   = (issueRequests||[]).find(r => r.machineAssignmentId === a.id);
                const lot   = (stock||[]).find(s => s.id === a.lotId) || {};
                return (
                  <div key={a.id} style={{ ...css.card, marginBottom:8, opacity:0.8,
                    borderLeft:`3px solid ${T.textLow}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontFamily:T.fontMono, fontSize:12, color:T.text }}>{a.matCode}</div>
                        <div style={{ fontSize:11, color:T.textMid }}>{a.machineName} · Release {a.releaseId}</div>
                      </div>
                      <Badge color="gray">Legacy</Badge>
                    </div>
                    {state === 2 && <button onClick={()=>{const yr=new Date().getFullYear();const seq=(issueRequests||[]).length+1;const id=`IRQ-${yr}-${String(seq).padStart(3,"0")}`;const lot2=(stock||[]).find(s=>s.id===a.lotId)||{};setIssueRequests(prev=>[...prev,{id,requestDate:today(),requestedBy:user.username,requestedByName:user.name,machineId:a.machineId,machineName:a.machineName,releaseId:a.releaseId,machineAssignmentId:a.id,lotId:a.lotId,lotNo:lot2.lotNo||"",matCode:a.matCode,wtRequested:lot2.wtAvailable||0,status:"pending",remarks:""}]);}} style={{...css.btn.primary,width:"100%",marginTop:8,fontSize:12}}>📦 Request Issue</button>}
                    {state === 3 && <div style={{marginTop:8,padding:"8px",background:T.amberBg,borderRadius:4,fontSize:11,color:T.amber,textAlign:"center"}}>⏳ Awaiting store — {req?.id}</div>}
                    {state >= 4 && <div style={{marginTop:8,padding:"8px",background:T.greenBg,borderRadius:4,fontSize:11,color:T.green,textAlign:"center"}}>✓ {state===6?"Complete":"In Progress"}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
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

// ─── Drawing Status Card ────────────────────────────────────────────────────
const DSC_STAGE_LABELS = {
  nesting:'Nesting', cutting:'Cutting', cutting_qc:'Cut QC', secondary_ops:'Sec Ops',
  fit_up:'Fit-Up', tpi_fitup:'TPI Fit-Up', welding:'Welding', tpi_weld:'TPI Weld',
  assembly:'Assembly', blasting:'Blasting', tpi_blast:'TPI Blast',
  paint_coat_1:'Paint 1', paint_coat_2:'Paint 2', paint_coat_3:'Paint 3',
  mdcc:'MDCC', dispatch:'Dispatch',
};

const DrawingStatusCard = ({ user, drawing, order, stock, orders, setOrders, releases, instances, machines, contractors, nestingBatches, onBack }) => {
  const [expandedStage, setExpandedStage]   = useState(null);
  const [expandedMcRow, setExpandedMcRow]   = useState(null);   // matCode string or null
  const [expandedRmUnits, setExpandedRmUnits] = useState(new Set()); // Set of rmUnitId
  const [reworkModal, setReworkModal]       = useState(null); // { partId, markNo }
  const [reworkReason, setReworkReason]     = useState("");
  const [reworkDecision, setReworkDecision] = useState("rework");
  const [tpiModal, setTpiModal]             = useState(null); // { stageIdx, action:'done' }
  const [tpiIrn, setTpiIrn]                 = useState("");
  const [outboundForm, setOutboundForm]     = useState(null);
  const [secondsAgo, setSecondsAgo]         = useState(0);

  // Auto-refresh counter (state already live in React — no server fetch needed)
  useEffect(() => {
    const tick    = setInterval(() => setSecondsAgo(s => s + 1), 1000);
    const refresh = setInterval(() => setSecondsAgo(0), 60000);
    return () => { clearInterval(tick); clearInterval(refresh); };
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────────
  const rel = (releases||[]).find(r =>
    (r.drawings||[]).some(rd => rd.drawingId === drawing.id && rd.orderId === order.id)
  );
  const machineAsgns = rel ? (rel.machineAssignments||[]) : [];

  const drawingParts = (order.parts||[]).filter(p => p.drawingId === drawing.id && p.fabType === "Fabricate");
  const steps = drawing.productionSteps || [];

  const currentStepIdx = steps.findIndex(s => s.status !== 'completed');
  const currentStepObj = currentStepIdx >= 0 ? steps[currentStepIdx] : steps[steps.length - 1];
  const currentStage   = currentStepObj?.stage || "not_released";

  const prevStep    = currentStepIdx > 0 ? steps[currentStepIdx - 1] : null;
  const stageStart  = prevStep?.completedAt ? new Date(prevStep.completedAt)
                    : rel ? new Date(rel.releaseDate) : new Date();
  const daysAtStage = Math.max(0, Math.floor((Date.now() - stageStart.getTime()) / 86400000));

  // RM rows: one per matCode required by fabricate parts of this drawing
  const drawingMatCodes = [...new Set(drawingParts.map(p => p.matCode).filter(Boolean))];
  const rmRows = drawingMatCodes.map(mc => {
    const maAsgn     = machineAsgns.find(ma => ma.matCode === mc);
    const assignedLot = maAsgn?.lotId ? (stock||[]).find(l => l.id === maAsgn.lotId) : null;
    const linkedLots = (stock||[]).filter(l =>
      l.matCode === mc && (
        l.id === maAsgn?.lotId ||
        l.reservedFor === order.id ||
        (l.reservations||[]).some(r => r.orderId === order.id) ||
        (l.allocations||[]).some(a => a.orderId === order.id && a.drawingId === drawing.id)
      )
    );
    const reqKg      = drawingParts.filter(p => p.matCode === mc).reduce((s,p) => s+(p.clientTotalWt||0), 0);
    const receivedKg = linkedLots.reduce((s,l) => s+(l.wtReceived||0), 0);
    const qcOk       = linkedLots.length > 0 && linkedLots.every(l => l.rmQcStatus==="approved" && l.clientInspStatus==="approved");
    const qcPart     = !qcOk && linkedLots.some(l => l.rmQcStatus==="approved");
    const qcStatus   = linkedLots.length===0 ? "none" : qcOk ? "approved" : qcPart ? "partial" : "pending";
    const locBays    = [...new Set(linkedLots.map(l => l.bayId).filter(Boolean))].join(", ") || "—";
    return { mc, reqKg, receivedKg, qcStatus, lots: linkedLots, location: locBays, maAsgn, assignedLot };
  });

  // Parts + instance enrichment
  const partsStatus = drawingParts.map(p => ({
    ...p,
    _insts: (instances||[]).filter(i => i.markNo===p.markNo && i.drawingId===drawing.id && i.orderId===order.id),
  }));
  const partsReady   = partsStatus.filter(p => p.qcStatus==="passed").length;
  const partsInProg  = partsStatus.filter(p => p.cutAt && p.qcStatus!=="passed" && p.qcStatus!=="written_off").length;
  const partsBlocked = partsStatus.filter(p => p.qcStatus==="rework"||p.qcStatus==="written_off").length;
  const partsTotal   = partsStatus.length;

  const hour          = new Date().getHours();
  const endOfShift    = hour >= 17;
  const uncollected   = partsStatus.filter(p =>
    p.qcStatus==="passed" && p.collectionStatus!=="collected" && (p.location||"").toLowerCase().includes("bay")
  );

  const outboundOps = (order.outboundOps||[]).filter(op => op.drawingId === drawing.id);

  // ── Action helpers ────────────────────────────────────────────────────────
  const updPart = (partId, patch) => setOrders(prev => prev.map(o =>
    o.id !== order.id ? o : { ...o, parts: o.parts.map(p => p.id===partId ? {...p,...patch} : p) }
  ));
  const updStep = (idx, patch) => setOrders(prev => prev.map(o =>
    o.id !== order.id ? o : {
      ...o,
      drawings: o.drawings.map(d => d.id!==drawing.id ? d : {
        ...d,
        productionSteps: (d.productionSteps||[]).map((s,i) => i===idx ? {...s,...patch} : s)
      })
    }
  ));

  const doConfirmCut = (partId) => {
    const ts = new Date().toISOString();
    updPart(partId, { cutAt:ts, cutBy:user.username, collectionStatus:"pending_qc", location:"Cutting Bay" });
  };
  const doQcPass = (partId) => {
    const ts   = new Date().toISOString();
    const ma   = machineAsgns[0];
    const mach = ma ? (machines||[]).find(m => m.id===ma.machineId) : null;
    updPart(partId, { qcStatus:"passed", qcAt:ts, qcBy:user.username,
      collectionStatus:"ready_for_collection", location: mach ? `${mach.name} Bay` : "Machine Bay" });
  };
  const doReworkDecision = () => {
    if (!reworkModal) return;
    const ts = new Date().toISOString();
    if (reworkDecision === "rework") {
      updPart(reworkModal.partId, { qcStatus:"rework", qcAt:ts, qcBy:user.username,
        reworkReason, cutAt:null, cutBy:null, collectionStatus:"not_ready", location:"—" });
    } else {
      updPart(reworkModal.partId, { qcStatus:"written_off", qcAt:ts, qcBy:user.username, reworkReason });
    }
    setReworkModal(null); setReworkReason(""); setReworkDecision("rework");
  };
  const doCollected = (partId) => {
    const ts = new Date().toISOString();
    updPart(partId, { collectionStatus:"collected", collectedBy:user.username, collectedAt:ts,
      location:`Contractor — ${user.name}` });
  };
  const doMoveHolding = (partId) => {
    const ts = new Date().toISOString();
    updPart(partId, { location:"Holding Bay", movedToHoldingAt:ts, movedBy:user.username, collectionStatus:"holding" });
  };
  const doStageComplete = (idx) => {
    const ts = new Date().toISOString();
    updStep(idx, { status:"completed", completedAt:ts, completedBy:user.username });
  };
  const doTpiOffer = (idx) => {
    updStep(idx, { tpiOfferedAt:new Date().toISOString(), tpiOfferedBy:user.username });
    setTpiModal(null);
  };
  const doTpiDone = (idx) => {
    updStep(idx, { tpiDoneAt:new Date().toISOString(), tpiIrn, tpiDoneBy:user.username });
    setTpiModal(null); setTpiIrn("");
  };
  const doAddOutboundOp = () => {
    if (!outboundForm) return;
    const newOp = { id:`OB-${Date.now()}`, drawingId:drawing.id, ...outboundForm,
      status:"pending", createdAt:new Date().toISOString(), createdBy:user.username };
    setOrders(prev => prev.map(o => o.id!==order.id ? o :
      { ...o, outboundOps:[...(o.outboundOps||[]), newOp] }
    ));
    setOutboundForm(null);
  };

  // ── Style helpers ─────────────────────────────────────────────────────────
  const secCard  = { marginBottom:16, background:T.bgCard, borderRadius:8, border:`1px solid ${T.border}` };
  const secHd    = { fontSize:11, fontWeight:800, color:T.textMid, letterSpacing:"0.08em",
                     padding:"10px 14px", borderBottom:`1px solid ${T.border}` };
  const secBody  = { padding:"12px 14px" };
  const colFor   = s => s==="completed"?T.green : s==="in_progress"?T.amber : s==="blocked"?T.red : T.textLow;
  const iconFor  = s => s==="completed"?"✅" : s==="in_progress"?"⚡" : s==="blocked"?"❌" : "⏳";

  const role       = user.role;
  const isEng      = ["production_engineer","super_admin"].includes(role);
  const isPlan     = role === "planning_admin";
  const isQc       = ["qc_user","qc_admin"].includes(role);
  const isStore    = role === "store_admin";
  const isContr    = role === "contractor";
  const isOp       = role === "machine_operator";
  const hasActions = isEng||isQc||isStore||isContr||isOp;

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:16 }}>
        <button onClick={onBack} style={css.btn.ghost}>← Back</button>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginBottom:4 }}>
            <span style={{ fontFamily:T.fontMono, fontSize:16, fontWeight:800, color:T.accentHi }}>{drawing.drawingNo}</span>
            {drawing.title && <span style={{ fontSize:14, color:T.text, fontWeight:600 }}>{drawing.title}</span>}
            <Badge color="blue">{order.id}</Badge>
            <Badge color="gray">{order.clientId}</Badge>
            {drawing.totalWt>0 && <span style={{fontSize:12,color:T.textMid}}>{(drawing.totalWt/1000).toFixed(2)} T</span>}
          </div>
          <div style={{ display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ fontSize:20, fontWeight:800, color:colFor(currentStepObj?.status) }}>
              {iconFor(currentStepObj?.status)} {(DSC_STAGE_LABELS[currentStage]||currentStage).toUpperCase()}
            </span>
            {daysAtStage>0 && <span style={{fontSize:12,color:T.textMid}}>{daysAtStage} day{daysAtStage!==1?"s":""} at this stage</span>}
            {steps.length===0 && <span style={{fontSize:12,color:T.amber}}>⚠ Not yet released</span>}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:4 }}>
            <span style={{ fontSize:11, color:T.textLow }}>
              Last updated: {secondsAgo<60?`${secondsAgo}s ago`:`${Math.floor(secondsAgo/60)}m ago`}
            </span>
            <button onClick={()=>setSecondsAgo(0)} style={{...css.btn.sm,fontSize:10,padding:"1px 8px"}}>↻ Refresh</button>
          </div>
        </div>
      </div>

      {/* ── SECTION A — RM STATUS ──────────────────────────────────── */}
      <div style={secCard}>
        <div style={secHd}>A — RM STATUS</div>
        <div style={secBody}>
          {rmRows.length===0 && <div style={{color:T.textLow,fontSize:12}}>No fabricate parts requiring RM for this drawing.</div>}
          {rmRows.length>0 && (
            <div style={{ display:"grid", gridTemplateColumns:"20px 2fr 1fr 1fr 1fr 1fr 1fr 1.5fr", gap:6, padding:"0 0 4px", borderBottom:`1px solid ${T.border}` }}>
              {["","MAT CODE","RM UNITS","RECEIVED","QC STATUS","TPI","RESERVED","LOCATION"].map(h=>(
                <div key={h} style={{fontSize:10,color:T.textLow,fontWeight:700}}>{h}</div>
              ))}
            </div>
          )}
          {rmRows.map(r => {
            const qcC = r.qcStatus==="approved"?T.green:r.qcStatus==="partial"?T.amber:r.qcStatus==="none"?T.red:T.amber;
            const qcL = r.qcStatus==="approved"?"✅ Approved":r.qcStatus==="partial"?"⚡ Partial":r.qcStatus==="none"?"❌ None":"⏳ Pending";
            const reservedKg = r.lots.filter(l=>["reserved","partially_reserved","allocated","issued"].includes(l.status)).reduce((s,l)=>s+(l.wtReceived||0),0);
            const isRowExp = expandedMcRow === r.mc;
            const toggleRow = () => setExpandedMcRow(p => p===r.mc ? null : r.mc);

            // Nesting batch data for this matCode
            const nestBatchLot = (nestingBatches||[]).flatMap(b=>b.lots||[]).find(l=>l.matCode===r.mc);
            const nestSheets   = nestBatchLot?.sheets||[];
            const drgMarkNos   = new Set(drawingParts.map(p=>p.markNo));
            const relevantSheets = nestSheets.filter(sh=>(sh.parts||[]).some(p=>drgMarkNos.has(p.markNo)));

            return (
              <div key={r.mc}>
                {/* ── Clickable row ── */}
                <div
                  onClick={toggleRow}
                  style={{ display:"grid", gridTemplateColumns:"20px 2fr 1fr 1fr 1fr 1fr 1fr 1.5fr", gap:6, alignItems:"center",
                    padding:"8px 0", borderBottom:`1px solid ${T.border}44`, cursor:"pointer",
                    background:isRowExp?`${T.accent}08`:"transparent" }}>
                  <div style={{fontSize:10,color:T.textMid,userSelect:"none"}}>{isRowExp?"▼":"▶"}</div>
                  <div style={{fontFamily:T.fontMono,fontSize:12,fontWeight:700,color:T.accentHi}}>{r.mc}</div>
                  <div style={{fontSize:11,color:T.textMid}}>
                    {r.lots.length>0
                      ? `${r.lots.length} lot${r.lots.length!==1?"s":""}`
                      : <span style={{color:T.textLow}}>No lot</span>}
                  </div>
                  <div style={{fontSize:11,color:r.receivedKg>0?T.text:T.textLow}}>{r.receivedKg.toFixed(0)} kg</div>
                  <div style={{fontSize:11,color:qcC,fontWeight:600}}>{qcL}</div>
                  <div style={{fontSize:11,color:T.textLow}}>—</div>
                  <div style={{fontSize:11,color:reservedKg>0?T.green:T.textLow}}>{reservedKg.toFixed(0)} kg</div>
                  <div style={{fontSize:11,color:T.textMid}}>{r.location}</div>
                </div>

                {/* ── Expanded panel ── */}
                {isRowExp && (
                  <div style={{padding:"10px 12px 12px 28px",background:`${T.accent}06`,borderBottom:`1px solid ${T.border}44`}}>
                    {/* Case 1: no lot assigned */}
                    {r.lots.length===0 && (
                      <div style={{fontSize:11,color:T.textLow,fontStyle:"italic"}}>
                        No lot assigned yet — pending Release Wizard or floor nesting
                      </div>
                    )}

                    {/* Case 2: lot assigned, no nesting batch */}
                    {r.lots.length>0 && relevantSheets.length===0 && (() => {
                      const l = r.assignedLot || r.lots[0];
                      return (
                        <div>
                          <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:6}}>LOT DETAILS</div>
                          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,fontSize:11,marginBottom:8}}>
                            <div><span style={{color:T.textLow}}>Lot ID </span><span style={{fontFamily:T.fontMono,color:T.accentHi}}>{l.lotNo||l.id}</span></div>
                            <div><span style={{color:T.textLow}}>Total weight </span><span style={{color:T.text}}>{(l.wtReceived||0).toFixed(0)} kg</span></div>
                            <div><span style={{color:T.textLow}}>Status </span><Badge color={["reserved","partially_reserved"].includes(l.status)?"amber":l.status==="allocated"?"blue":l.status==="available"?"green":"gray"}>{l.status.replace("_"," ")}</Badge></div>
                            <div><span style={{color:T.textLow}}>Bay </span><span style={{color:T.text}}>{l.bayId||"—"}</span></div>
                          </div>
                          <div style={{fontSize:11,color:T.amber,fontStyle:"italic"}}>
                            RM units pending — floor nesting not yet run
                          </div>
                        </div>
                      );
                    })()}

                    {/* Case 3: nesting batch with RM units */}
                    {relevantSheets.length>0 && (
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:6}}>RM UNITS ({relevantSheets.length})</div>
                        <div style={{display:"grid",gridTemplateColumns:"20px 2fr 1.5fr 1fr 1.5fr",gap:6,padding:"3px 0",borderBottom:`1px solid ${T.border}66`,marginBottom:4}}>
                          {["","RM Unit ID","Dimensions","Parts","Cut Status"].map((h,i)=>(
                            <div key={i} style={{fontSize:9,color:T.textLow,fontWeight:700}}>{h}</div>
                          ))}
                        </div>
                        {relevantSheets.map(sh => {
                          const shParts = (sh.parts||[]).filter(p=>drgMarkNos.has(p.markNo));
                          const totalQty = shParts.reduce((s,p)=>s+(p.qty||1),0);
                          const cutQty   = shParts.filter(p=>{
                            const ps = partsStatus.find(x=>x.markNo===p.markNo);
                            return !!ps?.cutAt;
                          }).reduce((s,p)=>s+(p.qty||1),0);
                          const isUnitExp = expandedRmUnits.has(sh.rmUnitId||sh.sheetNo);
                          const toggleUnit = (e) => {
                            e.stopPropagation();
                            const uid = sh.rmUnitId||sh.sheetNo;
                            setExpandedRmUnits(prev=>{ const n=new Set(prev); n.has(uid)?n.delete(uid):n.add(uid); return n; });
                          };
                          return (
                            <div key={sh.rmUnitId||sh.sheetNo}>
                              <div onClick={toggleUnit} style={{display:"grid",gridTemplateColumns:"20px 2fr 1.5fr 1fr 1.5fr",gap:6,padding:"5px 0",borderBottom:`1px solid ${T.border}33`,cursor:"pointer",alignItems:"center"}}>
                                <div style={{fontSize:10,color:T.textMid}}>{isUnitExp?"▼":"▶"}</div>
                                <div style={{fontFamily:T.fontMono,fontSize:10,color:T.accentHi}}>{sh.rmUnitId||`Sheet ${sh.sheetNo}`}</div>
                                <div style={{fontSize:10,color:T.textMid}}>{sh.sheetDim||"—"}</div>
                                <div style={{fontSize:10,color:T.text}}>{shParts.length} parts</div>
                                <div style={{fontSize:10,color:cutQty>=totalQty&&totalQty>0?T.green:cutQty>0?T.amber:T.textMid}}>
                                  {cutQty}/{totalQty} cut
                                </div>
                              </div>
                              {isUnitExp && (
                                <div style={{paddingLeft:24,paddingBottom:6,background:`${T.bg}88`}}>
                                  <table style={{width:"100%",fontSize:10,borderCollapse:"collapse",marginTop:4}}>
                                    <thead>
                                      <tr style={{color:T.textLow}}>
                                        <th style={{textAlign:"left",padding:"2px 6px"}}>Mark No</th>
                                        <th style={{textAlign:"right",padding:"2px 6px"}}>Qty</th>
                                        <th style={{textAlign:"left",padding:"2px 6px"}}>Drawing No</th>
                                        <th style={{textAlign:"left",padding:"2px 6px"}}>Order</th>
                                        <th style={{textAlign:"center",padding:"2px 6px"}}>Cut</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {shParts.map(pt=>{
                                        const ps = partsStatus.find(x=>x.markNo===pt.markNo);
                                        const cutDone = !!ps?.cutAt;
                                        return (
                                          <tr key={pt.markNo} style={{borderTop:`1px solid ${T.border}33`}}>
                                            <td style={{padding:"3px 6px",fontFamily:T.fontMono,color:T.accentHi}}>{pt.markNo}</td>
                                            <td style={{padding:"3px 6px",textAlign:"right",color:T.text}}>{pt.qty||1} pcs</td>
                                            <td style={{padding:"3px 6px",fontFamily:T.fontMono,color:T.textMid}}>{drawing.drawingNo}</td>
                                            <td style={{padding:"3px 6px",color:T.textMid}}>{order.id}</td>
                                            <td style={{padding:"3px 6px",textAlign:"center"}}>{cutDone?<span style={{color:T.green}}>✅</span>:<span style={{color:T.textLow}}>⏳</span>}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION B — PARTS STATUS ──────────────────────────────── */}
      <div style={secCard}>
        <div style={secHd}>B — PARTS STATUS</div>
        <div style={secBody}>
          <div style={{display:"flex",gap:16,marginBottom:10,flexWrap:"wrap"}}>
            <span style={{fontSize:12,color:T.green,fontWeight:600}}>✅ {partsReady}/{partsTotal} ready for next stage</span>
            <span style={{fontSize:12,color:T.amber,fontWeight:600}}>⚡ {partsInProg} in progress</span>
            {partsBlocked>0 && <span style={{fontSize:12,color:T.red,fontWeight:600}}>❌ {partsBlocked} blocked</span>}
            {endOfShift&&uncollected.length>0 && <span style={{fontSize:12,color:T.amber,fontWeight:700}}>⚠ {uncollected.length} uncollected at end of shift</span>}
          </div>
          {partsStatus.length===0 && <div style={{color:T.textLow,fontSize:12}}>No fabricate parts defined for this drawing.</div>}
          {partsStatus.length>0 && (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",fontSize:11,borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{color:T.textMid,borderBottom:`1px solid ${T.border}`}}>
                    <th style={{textAlign:"left",padding:"4px 8px"}}>Mark No</th>
                    <th style={{textAlign:"left",padding:"4px 8px"}}>Description</th>
                    <th style={{textAlign:"left",padding:"4px 8px"}}>Req Ops</th>
                    <th style={{textAlign:"center",padding:"4px 8px"}}>Cut</th>
                    <th style={{textAlign:"center",padding:"4px 8px"}}>QC</th>
                    <th style={{textAlign:"left",padding:"4px 8px"}}>Collection</th>
                    <th style={{textAlign:"left",padding:"4px 8px"}}>Location</th>
                    {hasActions && <th style={{textAlign:"left",padding:"4px 8px"}}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {partsStatus.map(p => {
                    const cutDone   = !!p.cutAt;
                    const qcVal     = p.qcStatus||"not_started";
                    const colStatus = p.collectionStatus||"not_ready";
                    const isRework  = qcVal==="rework";
                    const isWO      = qcVal==="written_off";
                    const rowBg     = isWO?`${T.red}0f`:isRework?`${T.amber}0f`:qcVal==="passed"?`${T.green}08`:"transparent";
                    const colLabel  = colStatus==="collected"?`Collected — ${p.collectedBy||""}`:colStatus==="ready_for_collection"?"Ready — awaiting collection":colStatus==="holding"?"In Holding Bay":cutDone?"Pending QC":"Not started";
                    const colColor  = colStatus==="collected"?T.green:colStatus==="ready_for_collection"?T.amber:T.textMid;
                    return (
                      <tr key={p.id} style={{background:rowBg,borderBottom:`1px solid ${T.border}44`}}>
                        <td style={{padding:"5px 8px",fontFamily:T.fontMono,color:T.accentHi,fontWeight:700}}>{p.markNo}</td>
                        <td style={{padding:"5px 8px",color:T.text}}>{p.desc||"—"}</td>
                        <td style={{padding:"5px 8px"}}>
                          <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                            {(p.requiredOps||["Cut"]).map(op=>(
                              <span key={op} style={{fontSize:9,padding:"1px 4px",borderRadius:3,background:`${T.accent}22`,color:T.accent,border:`1px solid ${T.accent}44`}}>{op}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{padding:"5px 8px",textAlign:"center"}}>
                          {cutDone
                            ? <span title={`Cut ${p.cutAt?.slice(0,10)} by ${p.cutBy}`} style={{color:T.green}}>✅</span>
                            : <span style={{color:T.textLow}}>⏳</span>}
                        </td>
                        <td style={{padding:"5px 8px",textAlign:"center"}}>
                          {qcVal==="passed"?<span style={{color:T.green}}>✅</span>
                           :qcVal==="rework"?<span style={{color:T.amber}} title={p.reworkReason||""}>⚠️ Rework</span>
                           :qcVal==="written_off"?<span style={{color:T.red}}>❌ W/O</span>
                           :cutDone?<span style={{color:T.amber}}>⚡</span>
                           :<span style={{color:T.textLow}}>⏳</span>}
                        </td>
                        <td style={{padding:"5px 8px",color:colColor}}>{colLabel}</td>
                        <td style={{padding:"5px 8px",color:T.textMid}}>{p.location||"—"}</td>
                        {hasActions && (
                          <td style={{padding:"5px 8px"}}>
                            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                              {(isOp||isEng)&&!cutDone&&!isRework&&!isWO&&(
                                <button onClick={()=>doConfirmCut(p.id)} style={{...css.btn.green,fontSize:10,padding:"2px 8px"}}>✓ Cut</button>
                              )}
                              {(isQc||isEng)&&cutDone&&qcVal==="not_started"&&(
                                <>
                                  <button onClick={()=>doQcPass(p.id)} style={{...css.btn.green,fontSize:10,padding:"2px 8px"}}>✓ Pass</button>
                                  <button onClick={()=>setReworkModal({partId:p.id,markNo:p.markNo})} style={{...css.btn.ghost,color:T.red,fontSize:10,padding:"2px 8px"}}>Fail</button>
                                </>
                              )}
                              {isContr&&colStatus==="ready_for_collection"&&(
                                <button onClick={()=>doCollected(p.id)} style={{...css.btn.primary,fontSize:10,padding:"2px 8px"}}>✓ Collected</button>
                              )}
                              {(isStore||isEng)&&endOfShift&&colStatus==="ready_for_collection"&&(
                                <button onClick={()=>doMoveHolding(p.id)} style={{...css.btn.amber,fontSize:10,padding:"2px 8px"}}>→ Holding</button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION C — STAGE PROGRESS ───────────────────────────── */}
      <div style={secCard}>
        <div style={secHd}>C — STAGE PROGRESS</div>
        <div style={secBody}>
          {steps.length===0 && (
            <div style={{color:T.amber,fontSize:12}}>⚠ Release not yet confirmed — no stage sequence defined. Create a production release to populate the timeline.</div>
          )}
          {steps.length>0 && (
            <>
              <div style={{display:"flex",overflowX:"auto",paddingBottom:8,alignItems:"flex-start"}}>
                {steps.map((s,i) => {
                  const isBlocked   = !!(s.tpiRequired && s.tpiOfferedAt && !s.tpiDoneAt);
                  const nodeState   = isBlocked ? 'blocked'
                    : s.status==='completed' ? 'completed'
                    : i===currentStepIdx      ? 'in_progress'
                    : 'pending';
                  const nc = nodeState==='completed'?T.green:nodeState==='in_progress'?T.amber:nodeState==='blocked'?T.red:T.textLow;
                  const ni = nodeState==='completed'?'✓':nodeState==='in_progress'?'⬤':nodeState==='blocked'?'⏸':'○';
                  const sz = nodeState==='in_progress'?36:30;
                  const prevLine = i>0&&steps[i-1].status==='completed'?T.green:T.border;
                  const nextLine = s.status==='completed'?T.green:T.border;
                  const isExp    = expandedStage===i;
                  const tpiWaitDays = s.tpiOfferedAt
                    ? Math.max(0,Math.floor((Date.now()-new Date(s.tpiOfferedAt).getTime())/86400000))
                    : 0;
                  const completionLabel = s.completedAt ? (()=>{
                    const d=new Date(s.completedAt);
                    return `${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}`;
                  })() : null;
                  return (
                    <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",minWidth:80,flexShrink:0}}>
                      <div style={{display:"flex",alignItems:"center",width:"100%"}}>
                        {i>0 && <div style={{flex:1,height:2,background:prevLine}} />}
                        <button
                          onClick={()=>setExpandedStage(isExp?null:i)}
                          title={`${DSC_STAGE_LABELS[s.stage]||s.stage} — ${nodeState}`}
                          style={{width:sz,height:sz,borderRadius:"50%",border:`2px solid ${nc}`,
                            background:nodeState==='completed'?`${nc}33`:nodeState==='in_progress'?`${nc}18`:'transparent',
                            color:nc,fontSize:nodeState==='completed'?14:12,fontWeight:700,cursor:"pointer",
                            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                            boxShadow:nodeState==='in_progress'?`0 0 8px ${nc}55`:'none'}}>
                          {ni}
                        </button>
                        {i<steps.length-1 && <div style={{flex:1,height:2,background:nextLine}} />}
                      </div>
                      <div style={{fontSize:9,color:nc,marginTop:4,textAlign:"center",maxWidth:76,lineHeight:1.2,fontWeight:nodeState==='in_progress'?700:400}}>
                        {DSC_STAGE_LABELS[s.stage]||s.stage.replace(/_/g," ")}
                      </div>
                      {nodeState==='completed'&&completionLabel&&(
                        <div style={{fontSize:8,color:T.green,marginTop:1}}>{completionLabel}</div>
                      )}
                      {nodeState==='in_progress'&&(
                        <div style={{fontSize:8,color:T.amber,marginTop:1,fontWeight:700}}>Day {Math.max(1,daysAtStage+1)}</div>
                      )}
                      {nodeState==='blocked'&&(
                        <div style={{fontSize:8,color:T.red,marginTop:1}}>TPI {tpiWaitDays}d wait</div>
                      )}
                      {s.tpiRequired===true&&(
                        <div style={{fontSize:8,color:s.tpiDoneAt?T.green:s.tpiOfferedAt?T.amber:T.textLow,marginTop:1}}>
                          {s.tpiDoneAt?"TPI ✓":s.tpiOfferedAt?"TPI ⚡":"TPI ⏳"}
                        </div>
                      )}
                      {s.tpiRequired===false&&(
                        <div style={{fontSize:8,color:T.textLow,marginTop:1}}>TPI N/A</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {expandedStage!==null && steps[expandedStage] && (() => {
                const s  = steps[expandedStage];
                const sc = colFor(s.status);
                return (
                  <div style={{marginTop:10,padding:12,background:T.bg,borderRadius:6,border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:10}}>
                      {iconFor(s.status)} {DSC_STAGE_LABELS[s.stage]||s.stage} — <span style={{color:sc}}>{s.status}</span>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,fontSize:11,marginBottom:10}}>
                      {s.completedAt && <div><span style={{color:T.textMid}}>Completed: </span><span style={{color:T.text}}>{s.completedAt.slice(0,10)} by {s.completedBy||"—"}</span></div>}
                      {s.contractorId && <div><span style={{color:T.textMid}}>Contractor: </span><span style={{color:T.text}}>{(contractors||[]).find(c=>c.id===s.contractorId)?.name||s.contractorId}</span></div>}
                      {s.machineId && <div><span style={{color:T.textMid}}>Machine: </span><span style={{color:T.text}}>{(machines||[]).find(m=>m.id===s.machineId)?.name||s.machineId}</span></div>}
                      {s.tpiRequired!==undefined && <div><span style={{color:T.textMid}}>TPI Required: </span><Badge color={s.tpiRequired?"amber":"gray"}>{s.tpiRequired?"Yes":"No"}</Badge></div>}
                      {s.tpiOfferedAt && <div><span style={{color:T.textMid}}>TPI Offered: </span><span style={{color:T.amber}}>{s.tpiOfferedAt.slice(0,10)} by {s.tpiOfferedBy||"—"}</span></div>}
                      {s.tpiDoneAt && <div><span style={{color:T.textMid}}>TPI Done: </span><span style={{color:T.green}}>{s.tpiDoneAt.slice(0,10)}</span></div>}
                      {s.tpiIrn && <div><span style={{color:T.textMid}}>IRN: </span><span style={{fontFamily:T.fontMono,color:T.accentHi}}>{s.tpiIrn}</span></div>}
                      {s.ops && s.ops.length>0 && <div><span style={{color:T.textMid}}>Ops: </span>{s.ops.join(", ")}</div>}
                      {s.coatName && <div><span style={{color:T.textMid}}>Coat: </span>{s.coatName}</div>}
                    </div>
                    {isEng && s.status!=="completed" && (
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        <button onClick={()=>doStageComplete(expandedStage)} style={{...css.btn.green,fontSize:11}}>✓ Mark Stage Complete</button>
                        {s.tpiRequired&&!s.tpiOfferedAt && <button onClick={()=>doTpiOffer(expandedStage)} style={{...css.btn.amber,fontSize:11}}>TPI — Offer Inspection</button>}
                        {s.tpiRequired&&s.tpiOfferedAt&&!s.tpiDoneAt && <button onClick={()=>setTpiModal({stageIdx:expandedStage,action:"done"})} style={{...css.btn.primary,fontSize:11}}>TPI — Enter IRN</button>}
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>

      {/* ── SECTION D — OUTBOUND OPERATIONS ──────────────────────── */}
      <div style={secCard}>
        <div style={secHd}>D — OUTBOUND OPERATIONS</div>
        <div style={secBody}>
          {outboundOps.length===0 && <div style={{color:T.textLow,fontSize:12}}>No outbound operations defined for this drawing.</div>}
          {outboundOps.map((op,i) => (
            <div key={op.id||i} style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,padding:"8px 0",borderBottom:`1px solid ${T.border}44`,fontSize:12}}>
              <div><span style={{color:T.textMid,fontSize:10}}>OPERATION </span><br/>{op.operation||"—"}</div>
              <div><span style={{color:T.textMid,fontSize:10}}>VENDOR </span><br/>{op.vendor||"—"}</div>
              <div><span style={{color:T.textMid,fontSize:10}}>AFTER STAGE </span><br/>{DSC_STAGE_LABELS[op.insertAfterStage]||op.insertAfterStage||"—"}</div>
              <div><span style={{color:T.textMid,fontSize:10}}>STATUS </span><br/><Badge color={op.status==="returned"?"green":op.status==="dispatched"?"blue":"gray"}>{op.status||"pending"}</Badge></div>
              {op.expectedReturn && <div><span style={{color:T.textMid,fontSize:10}}>EXPECTED RETURN </span><br/>{op.expectedReturn}</div>}
              {op.actualReturn && <div><span style={{color:T.textMid,fontSize:10}}>ACTUAL RETURN </span><br/>{op.actualReturn}</div>}
              {op.dispatchedDate && <div><span style={{color:T.textMid,fontSize:10}}>DISPATCHED </span><br/>{op.dispatchedDate}</div>}
            </div>
          ))}
          {isEng && !outboundForm && (
            <button onClick={()=>setOutboundForm({operation:"",vendor:"",insertAfterStage:"welding",expectedReturn:""})} style={{...css.btn.sm,marginTop:outboundOps.length>0?10:0}}>+ Add Outbound Operation</button>
          )}
          {isEng && outboundForm && (
            <div style={{marginTop:10,padding:12,background:T.bg,borderRadius:6,border:`1px solid ${T.border}`,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,alignItems:"end"}}>
              <div><label style={css.label}>Operation</label><input value={outboundForm.operation} onChange={e=>setOutboundForm(f=>({...f,operation:e.target.value}))} style={css.input} placeholder="e.g. Galvanising" /></div>
              <div><label style={css.label}>Vendor</label><input value={outboundForm.vendor} onChange={e=>setOutboundForm(f=>({...f,vendor:e.target.value}))} style={css.input} /></div>
              <div><label style={css.label}>Insert After Stage</label>
                <select value={outboundForm.insertAfterStage} onChange={e=>setOutboundForm(f=>({...f,insertAfterStage:e.target.value}))} style={css.input}>
                  {["cutting","secondary_ops","fit_up","welding","blasting","paint_coat_1"].map(st=><option key={st} value={st}>{DSC_STAGE_LABELS[st]||st}</option>)}
                </select>
              </div>
              <div><label style={css.label}>Expected Return</label><input type="date" value={outboundForm.expectedReturn||""} onChange={e=>setOutboundForm(f=>({...f,expectedReturn:e.target.value}))} style={css.input} /></div>
              <div style={{display:"flex",gap:6,gridColumn:"span 4",justifyContent:"flex-end"}}>
                <button onClick={()=>setOutboundForm(null)} style={css.btn.secondary}>Cancel</button>
                <button onClick={doAddOutboundOp} disabled={!outboundForm.operation.trim()} style={{...css.btn.primary,opacity:outboundForm.operation.trim()?1:0.5}}>Save</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION E — ALERTS & ACTIONS ─────────────────────────── */}
      <div style={secCard}>
        <div style={secHd}>E — ALERTS & ACTIONS</div>
        <div style={secBody}>
          {/* End-of-shift alert banner */}
          {endOfShift&&uncollected.length>0&&(isEng||isStore)&&(
            <div style={{padding:10,background:T.amberBg,border:`1px solid ${T.amber}55`,borderRadius:6,marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:T.amber,marginBottom:6}}>⚠ END OF SHIFT — {uncollected.length} part{uncollected.length!==1?"s":""} uncollected</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {uncollected.map(p=>(
                  <div key={p.id} style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontFamily:T.fontMono,fontSize:11}}>{p.markNo}</span>
                    <span style={{fontSize:11,color:T.textMid}}>{p.location}</span>
                    <button onClick={()=>doMoveHolding(p.id)} style={{...css.btn.amber,fontSize:10,padding:"2px 8px"}}>→ Holding Bay</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Production Engineer — escalation alerts */}
          {isEng && (
            <div>
              <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:8}}>Production Engineer Actions</div>
              {daysAtStage>5&&steps.length>0&&(
                <div style={{padding:8,background:T.redBg,border:`1px solid ${T.red}55`,borderRadius:4,fontSize:12,color:T.red,marginBottom:8}}>
                  🔴 Stuck at {DSC_STAGE_LABELS[currentStage]||currentStage} for {daysAtStage} days — escalation required
                </div>
              )}
              {(() => {
                const tpiWaiting = steps.filter(s=>s.tpiRequired&&s.tpiOfferedAt&&!s.tpiDoneAt);
                return tpiWaiting.length>0?(
                  <div style={{padding:8,background:T.amberBg,border:`1px solid ${T.amber}55`,borderRadius:4,fontSize:12,color:T.amber,marginBottom:8}}>
                    ⚡ TPI offered but not cleared on {tpiWaiting.length} stage{tpiWaiting.length!==1?"s":""}: {tpiWaiting.map(s=>DSC_STAGE_LABELS[s.stage]||s.stage).join(", ")}
                  </div>
                ):null;
              })()}
              {daysAtStage<=5&&steps.every(s=>!s.tpiRequired||s.tpiDoneAt||!s.tpiOfferedAt)&&uncollected.length===0&&(
                <div style={{fontSize:12,color:T.textLow}}>No escalation alerts — drawing progressing normally.</div>
              )}
              {steps.length===0&&(
                <div style={{fontSize:12,color:T.textMid}}>Create a Production Release to begin tracking this drawing.</div>
              )}
            </div>
          )}

          {/* Machine Operator */}
          {isOp && (
            <div>
              <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:8}}>Parts to Cut</div>
              {partsStatus.filter(p=>!p.cutAt&&p.qcStatus!=="written_off").length===0
                ? <div style={{color:T.textLow,fontSize:12}}>All parts cut or nothing assigned to your machine.</div>
                : partsStatus.filter(p=>!p.cutAt&&p.qcStatus!=="written_off").map(p=>(
                  <div key={p.id} style={{display:"flex",gap:8,alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${T.border}44`}}>
                    <span style={{fontFamily:T.fontMono,fontSize:12,color:T.accentHi,minWidth:80}}>{p.markNo}</span>
                    <span style={{fontSize:11,color:T.textMid,flex:1}}>{p.section} {p.size} — {p.qtyPerDrg||1} pcs — {(p.clientTotalWt||0).toFixed(1)} kg</span>
                    <button onClick={()=>doConfirmCut(p.id)} style={{...css.btn.green,fontSize:11}}>✓ Confirm Cut</button>
                  </div>
                ))
              }
            </div>
          )}

          {/* QC Engineer */}
          {isQc && (
            <div>
              <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:8}}>Parts Pending Cutting QC</div>
              {partsStatus.filter(p=>p.cutAt&&(!p.qcStatus||p.qcStatus==="not_started")).length===0
                ? <div style={{color:T.textLow,fontSize:12}}>No parts pending QC for this drawing.</div>
                : partsStatus.filter(p=>p.cutAt&&(!p.qcStatus||p.qcStatus==="not_started")).map(p=>(
                  <div key={p.id} style={{display:"flex",gap:8,alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${T.border}44`}}>
                    <span style={{fontFamily:T.fontMono,fontSize:12,color:T.accentHi,minWidth:80}}>{p.markNo}</span>
                    <span style={{fontSize:11,color:T.textMid,flex:1}}>Cut {p.cutAt?.slice(0,10)||"—"} by {p.cutBy||"—"}</span>
                    <button onClick={()=>doQcPass(p.id)} style={{...css.btn.green,fontSize:11}}>✓ Pass</button>
                    <button onClick={()=>setReworkModal({partId:p.id,markNo:p.markNo})} style={{...css.btn.ghost,color:T.red,fontSize:11}}>✕ Fail</button>
                  </div>
                ))
              }
            </div>
          )}

          {/* Store Admin */}
          {isStore && (
            <div>
              <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:8}}>Collection & Holding Bay Actions</div>
              {partsStatus.filter(p=>p.qcStatus==="passed"&&p.collectionStatus!=="collected").length===0
                ? <div style={{color:T.textLow,fontSize:12}}>No pending collection actions for this drawing.</div>
                : partsStatus.filter(p=>p.qcStatus==="passed"&&p.collectionStatus!=="collected").map(p=>(
                  <div key={p.id} style={{display:"flex",gap:8,alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${T.border}44`}}>
                    <span style={{fontFamily:T.fontMono,fontSize:12,color:T.accentHi,minWidth:80}}>{p.markNo}</span>
                    <span style={{fontSize:11,color:T.textMid,flex:1}}>{p.location||"Machine Bay"}</span>
                    {p.collectionStatus==="holding"
                      ? <span style={{fontSize:11,color:T.amber}}>In Holding Bay</span>
                      : <button onClick={()=>doMoveHolding(p.id)} style={{...css.btn.amber,fontSize:11}}>→ Holding Bay</button>
                    }
                  </div>
                ))
              }
            </div>
          )}

          {/* Contractor */}
          {isContr && (
            <div>
              <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:8}}>Parts Ready for Collection</div>
              {partsStatus.filter(p=>p.qcStatus==="passed"&&p.collectionStatus==="ready_for_collection").length===0
                ? <div style={{color:T.textLow,fontSize:12}}>No parts ready for collection at this time.</div>
                : partsStatus.filter(p=>p.qcStatus==="passed"&&p.collectionStatus==="ready_for_collection").map(p=>(
                  <div key={p.id} style={{display:"flex",gap:8,alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${T.border}44`}}>
                    <span style={{fontFamily:T.fontMono,fontSize:12,color:T.accentHi,minWidth:80}}>{p.markNo}</span>
                    <span style={{fontSize:11,color:T.textMid,flex:1}}>{p.location||"Machine Bay"}</span>
                    <button onClick={()=>doCollected(p.id)} style={{...css.btn.primary,fontSize:11}}>✓ Collected</button>
                  </div>
                ))
              }
            </div>
          )}

          {/* Planning Admin — read-only */}
          {isPlan && (
            <div style={{fontSize:12,color:T.textMid,padding:"8px 12px",background:T.bg,borderRadius:4}}>
              👁 Read-only view — Planning Admin has no actions here.
            </div>
          )}

          {!isEng&&!isQc&&!isStore&&!isContr&&!isOp&&!isPlan&&(
            <div style={{color:T.textLow,fontSize:12}}>No actions available for your role on this drawing.</div>
          )}
        </div>
      </div>

      {/* ── REWORK MODAL ──────────────────────────────────────────── */}
      {reworkModal && (
        <Modal title={`QC Fail — ${reworkModal.markNo}`} onClose={()=>{setReworkModal(null);setReworkReason("");setReworkDecision("rework");}} width={440}>
          <div style={{marginBottom:12}}>
            <label style={css.label}>Reason for Rejection</label>
            <textarea value={reworkReason} onChange={e=>setReworkReason(e.target.value)}
              style={{...css.input,height:72,resize:"vertical"}} placeholder="Describe the defect or non-conformance..." />
          </div>
          <div style={{marginBottom:16}}>
            <label style={css.label}>Decision</label>
            <div style={{display:"flex",gap:16,marginTop:6}}>
              <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:12}}>
                <input type="radio" value="rework" checked={reworkDecision==="rework"} onChange={()=>setReworkDecision("rework")} />
                Rework (return to cutting queue)
              </label>
              <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:12,color:T.red}}>
                <input type="radio" value="writeoff" checked={reworkDecision==="writeoff"} onChange={()=>setReworkDecision("writeoff")} />
                Write-Off (flag replacement RM)
              </label>
            </div>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button onClick={()=>{setReworkModal(null);setReworkReason("");setReworkDecision("rework");}} style={css.btn.secondary}>Cancel</button>
            <button onClick={doReworkDecision} disabled={!reworkReason.trim()}
              style={{...css.btn.primary,opacity:reworkReason.trim()?1:0.5}}>Confirm Decision</button>
          </div>
        </Modal>
      )}

      {/* ── TPI IRN MODAL ─────────────────────────────────────────── */}
      {tpiModal?.action==="done" && (
        <Modal title="TPI — Enter Inspection Release Note" onClose={()=>{setTpiModal(null);setTpiIrn("");}} width={380}>
          <label style={css.label}>IRN Number</label>
          <input value={tpiIrn} onChange={e=>setTpiIrn(e.target.value)}
            style={{...css.input,marginBottom:16}} placeholder="e.g. IRN-2026-0042" autoFocus />
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button onClick={()=>{setTpiModal(null);setTpiIrn("");}} style={css.btn.secondary}>Cancel</button>
            <button onClick={()=>doTpiDone(tpiModal.stageIdx)} disabled={!tpiIrn.trim()}
              style={{...css.btn.primary,opacity:tpiIrn.trim()?1:0.5}}>Confirm TPI Cleared</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── C3: Cross-Order Production Drawing Register ──────────────────────────────
const ProductionDrawingRegister = ({ orders, instances, stock, releases, contractors, machines, onBack, onViewStatus, onViewProgress }) => {
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
      const DONE_STAGES_STEP1 = new Set(["cutting_qc","fitup","fit_up","welding","weld_qc","tpi_fitup","tpi_weld","blasting","blast_qc","tpi_blast","painting","paint_qc","tpi_paint","mdcc","complete"]);
      const STAGE_ORD_STEP1 = ['complete','tpi_paint','paint_qc','painting','tpi_blast','blast_qc','blasting','tpi_weld','weld_qc','welding','tpi_fitup','fitup','fit_up','cutting_qc','cutting','pending'];
      const partMarkNosStep1 = new Set(parts.map(p=>p.markNo));
      const bestStep1 = {};
      (instances||[]).filter(i=>partMarkNosStep1.has(i.markNo)).forEach(i=>{
        const curr = bestStep1[i.markNo];
        if(!curr||STAGE_ORD_STEP1.indexOf(i.currentStage)<STAGE_ORD_STEP1.indexOf(curr)) bestStep1[i.markNo]=i.currentStage;
      });
      const cutParts = Object.values(bestStep1).filter(s=>DONE_STAGES_STEP1.has(s)).length;
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
      allDrawings.push({ drawingId:d.id, drawingNo:d.drawingNo, title:d.title, orderId:o.id, orderRef:o.id, clientId:o.clientId, assemblyGroup:d.assemblyGroup||"", assemblyName:asmGroup?.assemblyName||"", tier:d.priority<=1?"Critical":"Standard", priority:d.priority||1, totalParts, cutParts, matCodes, rmCoverage, hasRM, latestStage, parts, contractorName:conName, endDate:o.endDate||"" });
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
              <TH>RM Types</TH><TH>Stage</TH><TH>Status</TH><TH></TH>
            </tr>
          </thead>
          <tbody>
            {filtered.length===0&&<tr><td colSpan={12} style={{ padding:32,textAlign:"center",color:T.textLow }}>No drawings found</td></tr>}
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
                    <TD onClick={e=>e.stopPropagation()}>
                      {onViewStatus && <button style={{ ...css.btn.ghost, fontSize:11, padding:"3px 8px" }} onClick={()=>onViewStatus(d.drawingId, d.orderId)}>View Status</button>}
                      {onViewProgress && <button style={{ ...css.btn.ghost, fontSize:11, padding:"3px 8px" }} onClick={()=>onViewProgress(d.orderId)}>Progress</button>}
                    </TD>
                  </tr>
                  {isExp && (
                    <tr style={{ background:`${T.accent}08` }}>
                      <td colSpan={12} style={{ padding:"12px 16px" }}>
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

// ── MDCC Module ─────────────────────────────────────────────────────────────
const MDCCModule = ({ dprs, setDprs, orders, user }) => {
  const [selDpr, setSelDpr] = useState(null);
  const [linkForm, setLinkForm] = useState({});
  const [showLinkMap, setShowLinkMap] = useState({});
  const [linkValMap, setLinkValMap]   = useState({});

  const DEFAULT_DOCS = [
    { key:"mtc",        label:"Mill Test Certificate (MTC)",      required:true },
    { key:"weld_map",   label:"Weld Map + WPS Records",           required:true },
    { key:"dim_report", label:"Dimensional Inspection Report",    required:true },
    { key:"ndt",        label:"NDT / RT Records",                 required:false },
    { key:"dft",        label:"Paint DFT Records",                required:true },
    { key:"client_sof", label:"Client Sign-off / Final Cert",     required:true },
  ];

  // All DPRs at mdcc stage
  const mdccDprs = (dprs||[]).filter(d=>d.currentStage==="mdcc");

  const getOrderDocs = (dpr) => {
    const order=(orders||[]).find(o=>o.id===dpr.orderId)||{};
    return order.quality?.mdccDocs?.length>0 ? order.quality.mdccDocs : DEFAULT_DOCS;
  };

  const getChecklist = (dpr) => dpr.mdccChecklist||{};

  const toggleItem = (dpr, key) => {
    const ts = new Date().toISOString();
    const existing = dpr.mdccChecklist||{};
    const item = existing[key]||{};
    const verified = !item.verified;
    setDprs(prev=>prev.map(d=>d.id!==dpr.id?d:{...d,
      mdccChecklist:{...existing,[key]:{...item,verified,verifiedBy:verified?user.username:"",verifiedAt:verified?ts:""}}
    }));
  };

  const setLink = (dpr, key, link) => {
    const existing = dpr.mdccChecklist||{};
    const item = existing[key]||{};
    setDprs(prev=>prev.map(d=>d.id!==dpr.id?d:{...d,
      mdccChecklist:{...existing,[key]:{...item,link}}
    }));
  };

  const clearForDispatch = (dpr) => {
    const ts = new Date().toISOString();
    setDprs(prev=>prev.map(d=>d.id!==dpr.id?d:{...d,
      currentStage:"complete", currentStatus:"complete",
      mdccClearedAt:ts, mdccClearedBy:user.username,
      stageHistory:[...(d.stageHistory||[]),{stage:"mdcc",action:"cleared",by:user.username,at:ts}]
    }));
    setSelDpr(null);
  };

  const canClear = (dpr) => {
    const docs = getOrderDocs(dpr);
    const checklist = getChecklist(dpr);
    return docs.filter(d=>d.required).every(d=>checklist[d.key]?.verified);
  };

  if (selDpr) {
    const dpr = (dprs||[]).find(d=>d.id===selDpr.id)||selDpr;
    const order=(orders||[]).find(o=>o.id===dpr.orderId)||{};
    const docs = getOrderDocs(dpr);
    const checklist = getChecklist(dpr);
    const doneCount = docs.filter(d=>checklist[d.key]?.verified).length;
    const reqDone = docs.filter(d=>d.required&&checklist[d.key]?.verified).length;
    const reqTotal = docs.filter(d=>d.required).length;
    const ready = canClear(dpr);

    return (
      <div>
        <button onClick={()=>setSelDpr(null)} style={{...css.btn.ghost,marginBottom:16}}>← Back to MDCC Queue</button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{fontFamily:T.fontMono,fontSize:16,fontWeight:800,color:T.accent}}>{dpr.drawingNo}</div>
            <div style={{fontSize:12,color:T.textMid,marginTop:2}}>{order.id} · {order.clientName}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:13,fontWeight:700,color:ready?T.green:T.amber}}>{reqDone}/{reqTotal} required items verified</div>
            <div style={{fontSize:11,color:T.textLow}}>{doneCount} of {docs.length} total</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{height:6,background:T.border,borderRadius:3,overflow:"hidden",marginBottom:20}}>
          <div style={{width:`${Math.round(reqDone/Math.max(reqTotal,1)*100)}%`,height:"100%",background:ready?T.green:T.amber,borderRadius:3,transition:"width 0.3s"}}/>
        </div>

        {/* Checklist */}
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
          {docs.map(doc=>{
            const item=checklist[doc.key]||{};
            const showLink = showLinkMap[doc.key]||false;
            const linkVal  = linkValMap[doc.key]!==undefined ? linkValMap[doc.key] : (item.link||"");
            return (
              <div key={doc.key} style={{...css.card,borderLeft:`3px solid ${item.verified?T.green:doc.required?T.amber:T.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{display:"flex",gap:12,alignItems:"flex-start",flex:1}}>
                    <input type="checkbox" checked={!!item.verified} onChange={()=>toggleItem(dpr,doc.key)}
                      style={{marginTop:3,cursor:"pointer",width:16,height:16}} />
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <span style={{fontSize:13,fontWeight:600,color:T.text}}>{doc.label}</span>
                        {doc.required&&<Badge color="amber">Required</Badge>}
                        {item.verified&&<Badge color="green">✓ Verified</Badge>}
                      </div>
                      {item.verified&&<div style={{fontSize:11,color:T.textLow,marginTop:2}}>
                        By {item.verifiedBy} · {item.verifiedAt?.slice(0,10)||""}
                      </div>}
                      {/* Document link */}
                      {item.link&&!showLink&&(
                        <div style={{display:"flex",gap:8,alignItems:"center",marginTop:6}}>
                          <a href={item.link} target="_blank" rel="noreferrer"
                            style={{fontSize:11,color:T.accent,textDecoration:"none"}}>📎 View Document ↗</a>
                          <button onClick={()=>{setShowLinkMap(m=>({...m,[doc.key]:true}));setLinkValMap(m=>({...m,[doc.key]:item.link||""}));}} style={{...css.btn.ghost,fontSize:10,padding:"1px 6px"}}>Edit</button>
                        </div>
                      )}
                      {!item.link&&!showLink&&(
                        <button onClick={()=>setShowLinkMap(m=>({...m,[doc.key]:true}))} style={{...css.btn.ghost,fontSize:10,marginTop:6}}>+ Add Document Link</button>
                      )}
                      {showLink&&(
                        <div style={{display:"flex",gap:6,alignItems:"center",marginTop:6}}>
                          <input value={linkVal} onChange={e=>setLinkValMap(m=>({...m,[doc.key]:e.target.value}))}
                            placeholder="Paste Google Drive / OneDrive link..." style={{...css.input,fontSize:11,flex:1}} />
                          <button onClick={()=>{setLink(dpr,doc.key,linkVal);setShowLinkMap(m=>({...m,[doc.key]:false}));}} style={css.btn.primary}>Save</button>
                          <button onClick={()=>setShowLinkMap(m=>({...m,[doc.key]:false}))} style={css.btn.ghost}>✕</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={()=>clearForDispatch(dpr)} disabled={!ready}
          style={{...css.btn.green,width:"100%",padding:"12px 0",fontSize:14,opacity:ready?1:0.4}}>
          {ready?"✓ Clear for Dispatch — Mark MDCC Complete":"Complete all required items to clear for dispatch"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{fontSize:16,fontWeight:800,color:T.text,marginBottom:4}}>MDCC Dossier Queue</div>
      <div style={{fontSize:12,color:T.textMid,marginBottom:20}}>{mdccDprs.length} drawing{mdccDprs.length!==1?"s":""} awaiting MDCC clearance</div>
      {mdccDprs.length===0&&(
        <div style={{...css.card,textAlign:"center",padding:48,color:T.textLow}}>
          <div style={{fontSize:32,marginBottom:12}}>📋</div>
          <div>No drawings at MDCC stage yet.</div>
          <div style={{fontSize:11,marginTop:6}}>Drawings appear here after paint QC / TPI is cleared.</div>
        </div>
      )}
      {mdccDprs.map(dpr=>{
        const order=(orders||[]).find(o=>o.id===dpr.orderId)||{};
        const drawing=(order.drawings||[]).find(d=>d.id===dpr.drawingId)||{};
        const docs=getOrderDocs(dpr);
        const checklist=getChecklist(dpr);
        const doneReq=docs.filter(d=>d.required&&checklist[d.key]?.verified).length;
        const totalReq=docs.filter(d=>d.required).length;
        const pct=Math.round(doneReq/Math.max(totalReq,1)*100);
        const ready=canClear(dpr);
        return (
          <div key={dpr.id} style={{...css.card,marginBottom:10,cursor:"pointer",borderLeft:`3px solid ${ready?T.green:T.amber}`}}
            onClick={()=>setSelDpr(dpr)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontFamily:T.fontMono,fontWeight:700,color:T.accent}}>{dpr.drawingNo}</div>
                <div style={{fontSize:11,color:T.textMid,marginTop:2}}>{order.id} · {order.clientName} · {((drawing.totalWt||0)/1000).toFixed(2)}T</div>
              </div>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,fontWeight:700,color:ready?T.green:T.amber}}>{doneReq}/{totalReq}</div>
                  <div style={{fontSize:10,color:T.textLow}}>required</div>
                </div>
                <div style={{width:60,height:6,background:T.border,borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${pct}%`,height:"100%",background:ready?T.green:T.amber,borderRadius:3}}/>
                </div>
                <Badge color={ready?"green":"amber"}>{ready?"Ready":"Pending"}</Badge>
                <span style={{fontSize:12,color:T.textMid}}>→</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Dispatch Module ──────────────────────────────────────────────────────────
const DispatchModule = ({ dprs, setDprs, orders, challans, setChallans, user }) => {
  const [selDrawings, setSelDrawings] = useState(new Set());
  const [challanForm, setChallanForm] = useState({
    date: today(), vehicleNo:"", driverName:"", lrNo:"", transporter:"", remarks:""
  });
  const [view, setView] = useState("create"); // create | history
  const [printChallan, setPrintChallan] = useState(null);

  // All dispatched and ready drawings
  const readyDprs = (dprs||[]).filter(d=>
    d.currentStage==="complete" && d.mdccClearedAt && !d.dispatchedAt
  );
  const dispatchedDprs = (dprs||[]).filter(d=>d.dispatchedAt);

  const getDrInfo = (dpr) => {
    const order=(orders||[]).find(o=>o.id===dpr.orderId)||{};
    const drawing=(order.drawings||[]).find(d=>d.id===dpr.drawingId)||{};
    return {order, drawing, wt:(drawing.totalWt||0)/1000};
  };

  const selectedWt = [...selDrawings].reduce((s,id)=>{
    const dpr=(dprs||[]).find(d=>d.id===id);
    if(!dpr) return s;
    const {wt}=getDrInfo(dpr);
    return s+wt;
  },0);

  // Auto-generate challan number
  const nextChallanNo = () => {
    const fy = new Date().getMonth()>=3 ? new Date().getFullYear() : new Date().getFullYear()-1;
    const fyStr = `${String(fy).slice(-2)}-${String(fy+1).slice(-2)}`;
    const seq = ((challans||[]).length+1).toString().padStart(3,"0");
    return `DC/${fyStr}/${seq}`;
  };

  const createChallan = () => {
    if(!challanForm.vehicleNo||selDrawings.size===0) return;
    const ts = new Date().toISOString();
    const challanNo = nextChallanNo();
    const drawings = [...selDrawings].map(id=>{
      const dpr=(dprs||[]).find(d=>d.id===id)||{};
      const {order,drawing,wt}=getDrInfo(dpr);
      return {dprId:id, drawingNo:dpr.drawingNo, orderId:dpr.orderId, orderNo:order.id,
        clientName:order.clientName||"", totalWt:wt,
        clientTag:drawing.clientTag||"", userField1:drawing.userField1||""};
    });

    // Create challan record
    const newChallan = {
      id:`CHALLAN-${Date.now()}`, challanNo,
      date:challanForm.date||today(),
      vehicleNo:challanForm.vehicleNo, driverName:challanForm.driverName,
      lrNo:challanForm.lrNo, transporter:challanForm.transporter,
      remarks:challanForm.remarks,
      drawings, totalWt:selectedWt,
      createdBy:user.username, createdAt:ts, status:"dispatched"
    };
    setChallans(prev=>[...prev, newChallan]);

    // Mark DPRs as dispatched
    setDprs(prev=>prev.map(d=>!selDrawings.has(d.id)?d:{...d,
      dispatchedAt:ts, challanNo, vehicleNo:challanForm.vehicleNo,
      stageHistory:[...(d.stageHistory||[]),{stage:"complete",action:"dispatched",challanNo,by:user.username,at:ts}]
    }));

    setSelDrawings(new Set());
    setChallanForm({date:today(),vehicleNo:"",driverName:"",lrNo:"",transporter:"",remarks:""});
    setPrintChallan(newChallan);
  };

  // Print view
  if (printChallan) {
    const company = JSON.parse(localStorage.getItem('structo_company')||'{}');
    return (
      <div>
        <div style={{display:"flex",gap:8,marginBottom:16,displayPrint:"none"}}>
          <button onClick={()=>window.print()} style={css.btn.primary}>🖨 Print Challan</button>
          <button onClick={()=>setPrintChallan(null)} style={css.btn.ghost}>← Back</button>
        </div>
        <div style={{background:"#fff",color:"#000",padding:32,maxWidth:700,margin:"0 auto",border:"1px solid #ccc",fontFamily:"serif"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
            <div>
              <div style={{fontSize:20,fontWeight:700}}>{company.name||"STRUCTO FABRICATION"}</div>
              <div style={{fontSize:12}}>{company.address||""}</div>
              <div style={{fontSize:12}}>GST: {company.gstin||""}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:16,fontWeight:700}}>DELIVERY CHALLAN</div>
              <div style={{fontSize:14,fontWeight:700,color:"#1d4ed8"}}>{printChallan.challanNo}</div>
              <div style={{fontSize:12}}>Date: {printChallan.date}</div>
            </div>
          </div>
          <hr/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,margin:"12px 0"}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>To</div>
              <div style={{fontSize:13,fontWeight:700}}>{[...new Set(printChallan.drawings.map(d=>d.clientName))].join(", ")}</div>
            </div>
            <div>
              <div style={{fontSize:11}}>Vehicle: <strong>{printChallan.vehicleNo}</strong></div>
              {printChallan.driverName&&<div style={{fontSize:11}}>Driver: {printChallan.driverName}</div>}
              {printChallan.lrNo&&<div style={{fontSize:11}}>LR/Bilti: {printChallan.lrNo}</div>}
              {printChallan.transporter&&<div style={{fontSize:11}}>Transporter: {printChallan.transporter}</div>}
            </div>
          </div>
          <hr/>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,marginTop:12}}>
            <thead>
              <tr style={{background:"#f1f5f9"}}>
                {["Sr","Drawing No","Client Tag","Order","Weight (T)"].map(h=>(
                  <th key={h} style={{padding:"6px 8px",textAlign:"left",borderBottom:"1px solid #cbd5e1"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {printChallan.drawings.map((d,i)=>(
                <tr key={d.dprId} style={{borderBottom:"1px solid #e2e8f0"}}>
                  <td style={{padding:"5px 8px"}}>{i+1}</td>
                  <td style={{padding:"5px 8px",fontFamily:"monospace",fontWeight:600}}>{d.drawingNo}</td>
                  <td style={{padding:"5px 8px",fontFamily:"monospace",color:"#1d4ed8"}}>{d.clientTag||"—"}</td>
                  <td style={{padding:"5px 8px"}}>{d.orderNo}</td>
                  <td style={{padding:"5px 8px",textAlign:"right"}}>{d.totalWt.toFixed(3)}</td>
                </tr>
              ))}
              <tr style={{borderTop:"2px solid #64748b",fontWeight:700}}>
                <td colSpan={4} style={{padding:"6px 8px",textAlign:"right"}}>TOTAL</td>
                <td style={{padding:"6px 8px",textAlign:"right"}}>{printChallan.totalWt.toFixed(3)}</td>
              </tr>
            </tbody>
          </table>
          {printChallan.remarks&&<div style={{marginTop:12,fontSize:12}}>Remarks: {printChallan.remarks}</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:24,marginTop:40,paddingTop:16,borderTop:"1px solid #cbd5e1"}}>
            <div style={{textAlign:"center"}}>
              <div style={{borderTop:"1px solid #000",paddingTop:4,fontSize:11}}>Prepared By</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{borderTop:"1px solid #000",paddingTop:4,fontSize:11}}>Checked By</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{borderTop:"1px solid #000",paddingTop:4,fontSize:11}}>Received By</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{fontSize:16,fontWeight:800,color:T.text}}>Dispatch</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setView("create")} style={{...css.btn[view==="create"?"primary":"ghost"]}}>Create Challan</button>
          <button onClick={()=>setView("history")} style={{...css.btn[view==="history"?"primary":"ghost"]}}>Challan History ({(challans||[]).length})</button>
        </div>
      </div>

      {view==="create"&&(
        <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
          {/* Left: Drawing selector */}
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:10}}>
              Ready for Dispatch — {readyDprs.length} drawing{readyDprs.length!==1?"s":""}
            </div>
            {readyDprs.length===0&&(
              <div style={{...css.card,textAlign:"center",padding:32,color:T.textLow}}>
                <div style={{fontSize:28,marginBottom:8}}>🚚</div>
                No drawings ready for dispatch yet.<br/>
                <span style={{fontSize:11}}>Complete MDCC dossier to make drawings dispatch-ready.</span>
              </div>
            )}
            {/* Group by order */}
            {[...new Set(readyDprs.map(d=>d.orderId))].map(orderId=>{
              const orderDprs=readyDprs.filter(d=>d.orderId===orderId);
              const order=(orders||[]).find(o=>o.id===orderId)||{};
              const allSel=orderDprs.every(d=>selDrawings.has(d.id));
              return (
                <div key={orderId} style={{...css.card,marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div>
                      <span style={{fontFamily:T.fontMono,fontWeight:700,color:T.accent}}>{orderId}</span>
                      <span style={{fontSize:11,color:T.textMid,marginLeft:8}}>{order.clientName}</span>
                    </div>
                    <button onClick={()=>{
                      const ns=new Set(selDrawings);
                      if(allSel) orderDprs.forEach(d=>ns.delete(d.id));
                      else orderDprs.forEach(d=>ns.add(d.id));
                      setSelDrawings(ns);
                    }} style={{...css.btn.ghost,fontSize:11}}>
                      {allSel?"Deselect All":"Select All"}
                    </button>
                  </div>
                  {orderDprs.map(dpr=>{
                    const {drawing,wt}=getDrInfo(dpr);
                    const sel=selDrawings.has(dpr.id);
                    return (
                      <div key={dpr.id} onClick={()=>{const ns=new Set(selDrawings);sel?ns.delete(dpr.id):ns.add(dpr.id);setSelDrawings(ns);}}
                        style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                          padding:"6px 10px",marginBottom:4,borderRadius:6,cursor:"pointer",
                          background:sel?`${T.accent}22`:T.bgInput,border:`1px solid ${sel?T.accent:T.border}`}}>
                        <div style={{display:"flex",gap:10,alignItems:"center"}}>
                          <input type="checkbox" checked={sel} onChange={()=>{}} style={{pointerEvents:"none"}}/>
                          <div>
                            <div style={{fontFamily:T.fontMono,fontSize:12,fontWeight:700,color:T.accent}}>{dpr.drawingNo}</div>
                            <div style={{fontSize:10,color:T.textLow}}>MDCC cleared {dpr.mdccClearedAt?.slice(0,10)||""}</div>
                          </div>
                        </div>
                        <span style={{fontFamily:T.fontMono,fontSize:12,color:T.textMid}}>{wt.toFixed(3)}T</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Right: Challan form */}
          <div style={{width:300}}>
            <div style={{...css.card}}>
              <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14}}>Challan Details</div>
              <div style={{padding:"8px 12px",background:T.bgInput,borderRadius:6,marginBottom:12}}>
                <div style={{fontSize:11,color:T.textMid}}>Selected</div>
                <div style={{fontSize:18,fontWeight:800,color:T.accent}}>{selDrawings.size} drawings</div>
                <div style={{fontSize:12,color:T.textMid}}>{selectedWt.toFixed(3)}T gross weight</div>
              </div>
              <label style={css.label}>Date</label>
              <input type="date" value={challanForm.date} onChange={e=>setChallanForm(p=>({...p,date:e.target.value}))} style={{...css.input,marginBottom:8}} />
              <label style={css.label}>Vehicle No <span style={{color:T.red}}>*</span></label>
              <input value={challanForm.vehicleNo} onChange={e=>setChallanForm(p=>({...p,vehicleNo:e.target.value}))} style={{...css.input,marginBottom:8}} placeholder="e.g. MH-31-AB-1234"/>
              <label style={css.label}>Driver Name (optional)</label>
              <input value={challanForm.driverName} onChange={e=>setChallanForm(p=>({...p,driverName:e.target.value}))} style={{...css.input,marginBottom:8}} />
              <label style={css.label}>LR / Bilti No (optional)</label>
              <input value={challanForm.lrNo} onChange={e=>setChallanForm(p=>({...p,lrNo:e.target.value}))} style={{...css.input,marginBottom:8}} />
              <label style={css.label}>Transporter (optional)</label>
              <input value={challanForm.transporter} onChange={e=>setChallanForm(p=>({...p,transporter:e.target.value}))} style={{...css.input,marginBottom:8}} />
              <label style={css.label}>Remarks</label>
              <input value={challanForm.remarks} onChange={e=>setChallanForm(p=>({...p,remarks:e.target.value}))} style={{...css.input,marginBottom:14}} />
              <button onClick={createChallan} disabled={!challanForm.vehicleNo||selDrawings.size===0}
                style={{...css.btn.primary,width:"100%",padding:"10px 0",opacity:challanForm.vehicleNo&&selDrawings.size>0?1:0.4}}>
                🚚 Create & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {view==="history"&&(
        <div>
          {(challans||[]).length===0&&<div style={{...css.card,textAlign:"center",padding:32,color:T.textLow}}>No challans created yet.</div>}
          {[...(challans||[])].reverse().map(ch=>(
            <div key={ch.id} style={{...css.card,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <div style={{fontFamily:T.fontMono,fontWeight:700,color:T.accent,fontSize:14}}>{ch.challanNo}</div>
                  <div style={{fontSize:11,color:T.textMid,marginTop:2}}>
                    {ch.date} · {ch.vehicleNo} {ch.driverName?`· ${ch.driverName}`:""} {ch.lrNo?`· LR: ${ch.lrNo}`:""}
                  </div>
                  <div style={{fontSize:11,color:T.textMid}}>{ch.drawings?.length} drawings · {ch.totalWt?.toFixed(3)}T</div>
                </div>
                <button onClick={()=>setPrintChallan(ch)} style={css.btn.ghost}>🖨 Print</button>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {(ch.drawings||[]).map(d=>(
                  <span key={d.dprId} style={{fontFamily:T.fontMono,fontSize:10,padding:"2px 6px",background:T.bgInput,borderRadius:4,color:T.accent}}>{d.drawingNo}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Interim TPI Panel (inside TpiQcPanel context) ────────────────────────────
// Handled inline in TpiQcPanel via tpiRecords with visitNo field


// ─── OUTBOUND QC PANEL ───────────────────────────────────────────────────────
const OutboundQcPanel = ({ user, instances, setInstances, orders }) => {
  const [selInst, setSelInst] = useState(null);
  const [checks, setChecks] = useState({});  // { taskId+param: true/false }
  const [notes, setNotes] = useState("");
  const [verdict, setVerdict] = useState(""); // "pass" | "fail"
  const [failReason, setFailReason] = useState("");

  const pending = (instances||[]).filter(i => i.currentStatus === "outbound_qc_pending");

  const openInst = (inst) => {
    setSelInst(inst);
    setChecks({});
    setNotes("");
    setVerdict("");
    setFailReason("");
  };

  const getOb = (inst) => (inst?.outboundHistory||[]).slice(-1)[0] || {};

  // Build checklist from tasks in the outbound history record
  const buildChecklist = (ob) => {
    const taskIds = ob?.tasks || [];
    return taskIds.flatMap(tid => {
      const task = OUTBOUND_TASKS.find(t => t.id === tid);
      if (!task) return [];
      // Split qcHints into individual check items
      return task.qcHints.split(",").map(hint => ({
        key: `${tid}__${hint.trim()}`,
        taskLabel: task.label,
        hint: hint.trim(),
      }));
    });
  };

  const doSignOff = () => {
    if (!selInst) return;
    if (!verdict) return showToast("Select Pass or Fail","amber");
    if (verdict === "fail" && !failReason.trim()) return showToast("Enter failure reason","amber");
    const ob = getOb(selInst);
    const ts = new Date().toISOString();
    setInstances(prev => prev.map(i => {
      if (i.instanceId !== selInst.instanceId) return i;
      const hist = [...(i.outboundHistory||[])];
      const lastIdx = hist.length - 1;
      if (lastIdx >= 0) hist[lastIdx] = {
        ...hist[lastIdx],
        obQcVerdict: verdict,
        obQcBy: user.username,
        obQcAt: ts,
        obQcNotes: notes,
        obQcChecks: checks,
        obQcFailReason: verdict === "fail" ? failReason : null,
      };
      if (verdict === "pass") {
        // Advance to reEntryStep from the outbound history record
        const reEntry = ob?.reEntryStep || ob?.stageAtDispatch || i.currentStage;
        return {
          ...i,
          currentStatus: "in_progress",
          currentStage: reEntry,
          stageHistory: [...(i.stageHistory||[]), { stage:"outbound_qc", action:"passed", by:user.username, at:ts }],
          outboundHistory: hist,
        };
      } else {
        // Fail — flag for rework/re-send, stays at outbound_qc_pending with flag
        return {
          ...i,
          currentStatus: "outbound_qc_failed",
          outboundHistory: hist,
          stageHistory: [...(i.stageHistory||[]), { stage:"outbound_qc", action:"failed", by:user.username, at:ts, reason:failReason }],
        };
      }
    }));
    showToast(verdict === "pass" ? "Outbound QC passed — piece re-entered production" : "Outbound QC failed — flagged for action", verdict === "pass" ? "green" : "red");
    setSelInst(null);
  };

  if (selInst) {
    const ob = getOb(selInst);
    const checklist = buildChecklist(ob);
    const allChecked = checklist.length === 0 || checklist.every(c => checks[c.key]);
    const order = (orders||[]).find(o => o.id === selInst.orderId);
    return (
      <div>
        <button onClick={() => setSelInst(null)} style={{ ...css.btn.ghost, marginBottom:16 }}>← Back</button>
        <div style={{ ...css.card, marginBottom:14 }}>
          <div style={{ fontSize:16, fontWeight:800, fontFamily:T.fontMono, color:T.accent, marginBottom:4 }}>{selInst.markNo}</div>
          <div style={{ fontSize:12, color:T.textMid }}>{selInst.drawingNo} · {order?.orderNo || selInst.orderId}</div>
          <div style={{ fontSize:12, color:T.amber, marginTop:6 }}>
            {ob.type} @ {ob.vendorName} · Sent {ob.sentDate} · Returned {ob.returnDate}
          </div>
          {ob.reEntryStep && (
            <div style={{ fontSize:12, color:T.green, marginTop:4 }}>
              On pass → will advance to: <strong>{ob.reEntryStep}</strong>
            </div>
          )}
          {ob.tasks?.length > 0 && (
            <div style={{ fontSize:11, color:T.textMid, marginTop:4 }}>
              Tasks performed: {ob.tasks.map(tid => OUTBOUND_TASKS.find(t=>t.id===tid)?.label||tid).join(", ")}
            </div>
          )}
        </div>

        {/* QC Checklist */}
        {checklist.length > 0 && (
          <div style={{ ...css.card, marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.textMid, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.06em" }}>QC Checklist</div>
            {checklist.map(c => (
              <label key={c.key} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0",
                borderBottom:`1px solid ${T.border}22`, cursor:"pointer" }}>
                <input type="checkbox" checked={!!checks[c.key]} onChange={e => setChecks(prev=>({...prev,[c.key]:e.target.checked}))}
                  style={{ width:16, height:16, accentColor:T.green, flexShrink:0 }} />
                <div>
                  <span style={{ fontSize:11, fontWeight:600, color:T.accent }}>{c.taskLabel}</span>
                  <span style={{ fontSize:11, color:T.text, marginLeft:8 }}>{c.hint}</span>
                </div>
              </label>
            ))}
            {!allChecked && <div style={{ fontSize:11, color:T.amber, marginTop:8 }}>⚠ Tick all items to enable pass</div>}
          </div>
        )}

        {/* Notes */}
        <div style={{ ...css.card, marginBottom:14 }}>
          <label style={css.label}>QC Notes (optional)</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2}
            style={{ ...css.input, resize:"vertical" }} placeholder="Observations, measurements, remarks..." />
        </div>

        {/* Verdict */}
        <div style={{ ...css.card, marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.textMid, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.06em" }}>Verdict</div>
          <div style={{ display:"flex", gap:10, marginBottom:12 }}>
            <button onClick={()=>setVerdict("pass")} disabled={!allChecked}
              style={{ flex:1, padding:"10px", borderRadius:6, border:`2px solid ${verdict==="pass"?T.green:T.border}`,
                background:verdict==="pass"?T.greenBg:"transparent", color:verdict==="pass"?T.green:T.textMid,
                fontWeight:700, cursor:allChecked?"pointer":"not-allowed", opacity:allChecked?1:0.5, fontSize:13 }}>
              ✅ Pass — Release to production
            </button>
            <button onClick={()=>setVerdict("fail")}
              style={{ flex:1, padding:"10px", borderRadius:6, border:`2px solid ${verdict==="fail"?T.red:T.border}`,
                background:verdict==="fail"?T.redBg:"transparent", color:verdict==="fail"?T.red:T.textMid,
                fontWeight:700, cursor:"pointer", fontSize:13 }}>
              ❌ Fail — Flag for action
            </button>
          </div>
          {verdict === "fail" && (
            <div>
              <label style={css.label}>Failure reason *</label>
              <textarea value={failReason} onChange={e=>setFailReason(e.target.value)} rows={2}
                style={{ ...css.input, resize:"vertical" }} placeholder="Describe the non-conformance..." />
            </div>
          )}
        </div>

        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button onClick={()=>setSelInst(null)} style={css.btn.ghost}>Cancel</button>
          <button onClick={doSignOff} disabled={!verdict}
            style={{ ...css.btn.primary, opacity:verdict?1:0.4, cursor:verdict?"pointer":"not-allowed" }}>
            Submit QC Decision
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize:13, fontWeight:700, color:T.textMid, marginBottom:14, textTransform:"uppercase", letterSpacing:"0.06em" }}>
        Outbound QC — Pending Sign-Off ({pending.length})
      </div>

      {pending.length === 0 && (
        <InfoBanner color="blue">No pieces awaiting outbound QC. When outbound pieces are returned and recorded in Outbound Processing, they will appear here.</InfoBanner>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {pending.map(inst => {
          const ob = getOb(inst);
          const order = (orders||[]).find(o => o.id === inst.orderId);
          const checklist = buildChecklist(ob);
          return (
            <div key={inst.instanceId} onClick={() => openInst(inst)}
              style={{ ...css.card, cursor:"pointer", borderLeft:`3px solid ${"#06B6D4"}` }}
              onMouseEnter={e=>e.currentTarget.style.background=T.bgHover}
              onMouseLeave={e=>e.currentTarget.style.background=T.bgCard}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontFamily:T.fontMono, fontWeight:700, color:T.accent, fontSize:13 }}>
                    {inst.markNo} <span style={{ fontWeight:400, color:T.textMid, fontFamily:T.font, fontSize:11 }}>— {inst.instanceId}</span>
                  </div>
                  <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>
                    {inst.drawingNo} · {order?.orderNo || inst.orderId}
                  </div>
                  <div style={{ fontSize:11, color:T.amber, marginTop:4 }}>
                    {ob.type} @ {ob.vendorName} · Returned {ob.returnDate}
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <Badge color="blue">{checklist.length} checks</Badge>
                  {ob.reEntryStep && <div style={{ fontSize:10, color:T.green, marginTop:4 }}>→ {ob.reEntryStep}</div>}
                </div>
              </div>
              {ob.tasks?.length > 0 && (
                <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
                  {ob.tasks.map(tid => (
                    <span key={tid} style={{ fontSize:10, padding:"2px 8px", borderRadius:4,
                      background:T.amber+"22", border:`1px solid ${T.amber}44`, color:T.amber }}>
                      {OUTBOUND_TASKS.find(t=>t.id===tid)?.label||tid}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const QcAdminScreen = ({ user, instances, setInstances, orders, qcRules, setQcRules, overrideLog, setOverrideLog, dprs, setDprs, contractors, tpiTemplates, setTpiTemplates, ncrs, setNcrs, notifications, setNotifications, correctionsLog, setCorrectionsLog, scrapQueue, setScrapQueue, stock }) => {
  const isAdmin = ["super_admin","qc_admin"].includes(user.role);
  const [tab, setTab] = useState("cutting_qc");
  const [corrModal, setCorrModal] = useState(null);
  const [corrForm, setCorrForm] = useState({});

  // ── QC Correction Handlers ────────────────────────────────────────────────

  // Revert cutting QC clearance
  const doRevertQcClearance = (inst, reason, physicalHappened) => {
    if (!reason?.trim()) return showToast("Reason required","amber");
    const downstream = inst.currentStage !== "cutting_qc";
    if (downstream && !physicalHappened) return showToast("Cannot revert — downstream work exists. Raise NCR instead.","amber");
    setInstances(prev => prev.map(i => i.id !== inst.id ? i : {
      ...i, currentStage:"cutting", currentStatus:"pending",
      qcClearedAt:null, qcClearedBy:null,
      auditLog:[...(i.auditLog||[]),{ action:"qc-clearance-reverted", by:user.name, date:today(), reason, physicalHappened }]
    }));
    setCorrectionsLog(prev=>[...prev, createCorrectionEntry({ action:"revert_qc_clearance", entityId:inst.id, entityType:"instance", orderId:inst.orderId, fromValue:{stage:inst.currentStage,status:inst.currentStatus}, toValue:{stage:"cutting",status:"pending"}, reason, physicalHappened, triggeredBy:user })]);
    setNotifications(prev=>[...prev, createNotification({ type:"correction", message:`QC clearance reverted for ${inst.markNo} (${inst.drawingNo}) — ${reason}`, forRoles:["production_admin","production_engineer","machine_operator"], entityId:inst.id, entityType:"instance", orderId:inst.orderId, raisedBy:user.name })]);
    showToast("QC clearance reverted"); setCorrModal(null);
  };

  // Revert cutting QC rejection (wrongly rejected)
  const doRevertQcRejection = (inst, reason) => {
    if (!reason?.trim()) return showToast("Reason required","amber");
    setInstances(prev => prev.map(i => i.id !== inst.id ? i : {
      ...i, currentStage:"cutting_qc", currentStatus:"pending",
      qcRejectedAt:null, qcRejectedBy:null, qcRejectionReason:null,
      auditLog:[...(i.auditLog||[]),{ action:"qc-rejection-reverted", by:user.name, date:today(), reason }]
    }));
    setCorrectionsLog(prev=>[...prev, createCorrectionEntry({ action:"revert_qc_rejection", entityId:inst.id, entityType:"instance", orderId:inst.orderId, fromValue:"rejected", toValue:"pending_qc", reason, triggeredBy:user })]);
    showToast("Rejection reverted — part sent back to QC queue"); setCorrModal(null);
  };

  // Edit rejection reason
  const doEditRejectionReason = (inst, newReason) => {
    if (!newReason?.trim()) return showToast("Reason required","amber");
    setInstances(prev => prev.map(i => i.id !== inst.id ? i : {
      ...i, qcRejectionReason:newReason,
      auditLog:[...(i.auditLog||[]),{ action:"rejection-reason-edited", by:user.name, date:today(), reason:`Changed from: "${i.qcRejectionReason}" to: "${newReason}"` }]
    }));
    showToast("Rejection reason updated"); setCorrModal(null);
  };

  // Raise NCR from QC
  const doRaiseNcr = (inst, ncrData) => {
    if (!ncrData.description?.trim()) return showToast("Description required","amber");
    if (!ncrData.disposition) return showToast("Disposition required","amber");
    const order = (orders||[]).find(o=>o.id===inst.orderId);
    const ncrNo = genNcrNo(inst.orderId, ncrs);
    const newNcr = {
      id:`NCR-${Date.now()}`, ncrNo, orderId:inst.orderId, orderNo:order?.orderNo||inst.orderId,
      instanceId:inst.id, markNo:inst.markNo, drawingNo:inst.drawingNo,
      stage:inst.currentStage, description:ncrData.description,
      dimensionsFound:ncrData.dimensionsFound||"", dimensionsRequired:ncrData.dimensionsRequired||"",
      disposition:ncrData.disposition, // "use_as_is"|"rework"|"scrap"
      reworkStage:ncrData.reworkStage||null,
      raisedBy:user.name, raisedAt:today(), status:"open",
      concessionRequested:ncrData.disposition==="use_as_is",
      auditLog:[{ action:"ncr-raised", by:user.name, date:today(), reason:ncrData.description }]
    };
    setNcrs(prev=>[...prev, newNcr]);

    // Handle disposition
    if (ncrData.disposition==="rework") {
      const reworkStage = ncrData.reworkStage||"cutting";
      setInstances(prev=>prev.map(i=>i.id!==inst.id?i:{
        ...i, currentStage:reworkStage, currentStatus:"rework",
        ncrId:ncrNo, isRework:true,
        auditLog:[...(i.auditLog||[]),{action:"ncr-rework",by:user.name,date:today(),reason:`NCR ${ncrNo}: ${ncrData.description}`}]
      }));
      setNotifications(prev=>[...prev, createNotification({ type:"ncr", message:`NCR ${ncrNo} raised — ${inst.markNo} sent back to ${reworkStage} for rework`, forRoles:["production_admin","production_engineer","machine_operator"], entityId:inst.id, orderId:inst.orderId, raisedBy:user.name })]);
    } else if (ncrData.disposition==="scrap") {
      setInstances(prev=>prev.map(i=>i.id!==inst.id?i:{
        ...i, currentStage:"scrapped", currentStatus:"scrapped",
        ncrId:ncrNo, scrappedAt:today(), scrappedBy:user.name,
        auditLog:[...(i.auditLog||[]),{action:"scrapped",by:user.name,date:today(),reason:`NCR ${ncrNo}: ${ncrData.description}`}]
      }));
      // Add to scrap queue for planning admin decision on replacement cutting
      setScrapQueue(prev=>[...prev,{
        id:`SQ-${Date.now()}`, ncrNo, orderId:inst.orderId, orderNo:order?.orderNo,
        instanceId:inst.id, markNo:inst.markNo, drawingNo:inst.drawingNo,
        matCode:inst.matCode||"", qty:1, status:"pending_decision",
        raisedBy:user.name, raisedAt:today(),
        description:`Scrapped at ${inst.currentStage} — ${ncrData.description}`
      }]);
      setNotifications(prev=>[...prev, createNotification({ type:"scrap_queue", message:`NCR ${ncrNo} — ${inst.markNo} scrapped. Planning admin decision required for replacement cutting.`, forRoles:["planning_admin","super_admin"], entityId:inst.id, orderId:inst.orderId, raisedBy:user.name })]);
    } else {
      // use_as_is — flag on instance, keep moving
      setInstances(prev=>prev.map(i=>i.id!==inst.id?i:{
        ...i, ncrId:ncrNo, useAsIs:true,
        auditLog:[...(i.auditLog||[]),{action:"ncr-use-as-is",by:user.name,date:today(),reason:`NCR ${ncrNo}: concession requested`}]
      }));
      setNotifications(prev=>[...prev, createNotification({ type:"ncr", message:`NCR ${ncrNo} — ${inst.markNo} use-as-is concession requested. Awaiting client approval.`, forRoles:["planning_admin","qc_admin","super_admin"], entityId:inst.id, orderId:inst.orderId, raisedBy:user.name })]);
    }
    showToast(`NCR ${ncrNo} raised`); setCorrModal(null);
  };

  // DPR-level rejection (fit-up / welding)
  const doDprRejection = (dpr, stage, pieceActions, reason) => {
    if (!reason?.trim()) return showToast("Reason required","amber");
    const order = (orders||[]).find(o=>o.id===dpr.orderId);
    // pieceActions: {instanceId: "continue"|"rework"|"scrap"}
    const reworkInsts = Object.entries(pieceActions||{}).filter(([,v])=>v==="rework").map(([id])=>id);
    const scrapInsts  = Object.entries(pieceActions||{}).filter(([,v])=>v==="scrap").map(([id])=>id);
    const reworkStage = stage==="fitup_qc"?"fitup":"welding";

    setInstances(prev=>prev.map(i=>{
      if (reworkInsts.includes(i.id)) return {...i, currentStage:reworkStage, currentStatus:"rework", isRework:true, auditLog:[...(i.auditLog||[]),{action:`${stage}-rejected-rework`,by:user.name,date:today(),reason}]};
      if (scrapInsts.includes(i.id)) return {...i, currentStage:"scrapped", currentStatus:"scrapped", scrappedAt:today(), scrappedBy:user.name, auditLog:[...(i.auditLog||[]),{action:`${stage}-rejected-scrap`,by:user.name,date:today(),reason}]};
      return i;
    }));

    // Revert DPR stage
    setDprs(prev=>prev.map(d=>d.id!==dpr.id?d:{
      ...d, currentStage:reworkStage,
      auditLog:[...(d.auditLog||[]),{action:`${stage}-rejected`,by:user.name,date:today(),reason}]
    }));

    // Add scrapped pieces to scrap queue
    if (scrapInsts.length>0) {
      const scrapEntries = scrapInsts.map(id=>{
        const inst = (instances||[]).find(i=>i.id===id)||{};
        const ncrNo = genNcrNo(dpr.orderId, ncrs);
        return { id:`SQ-${Date.now()}-${id}`, ncrNo, orderId:dpr.orderId, orderNo:order?.orderNo, instanceId:id, markNo:inst.markNo, drawingNo:inst.drawingNo, matCode:inst.matCode||"", qty:1, status:"pending_decision", raisedBy:user.name, raisedAt:today(), description:`Scrapped at ${stage} — ${reason}` };
      });
      setScrapQueue(prev=>[...prev,...scrapEntries]);
      setNotifications(prev=>[...prev, createNotification({ type:"scrap_queue", message:`${scrapInsts.length} piece(s) scrapped at ${stage} in ${dpr.drawingNo}. Planning admin decision required.`, forRoles:["planning_admin","super_admin"], entityId:dpr.id, orderId:dpr.orderId, raisedBy:user.name })]);
    }

    if (reworkInsts.length>0) {
      setNotifications(prev=>[...prev, createNotification({ type:"qc_rejection", message:`${reworkInsts.length} piece(s) sent back to ${reworkStage} for rework — ${dpr.drawingNo}`, forRoles:["production_admin","production_engineer","contractor"], entityId:dpr.id, orderId:dpr.orderId, raisedBy:user.name })]);
    }
    showToast(`Rejection processed — ${reworkInsts.length} rework, ${scrapInsts.length} scrap`); setCorrModal(null);
  };

  // ── DPR QC Panel — Fit-Up QC and Weld QC tabs ───────────────────────────────
  const DprQcPanel = ({ dprStage }) => {
    const isFitup = dprStage === "fitup_qc";
    const isBlast = dprStage === "blast_qc";
    const isWeld  = dprStage === "weld_qc";
    const label   = isFitup ? "Fit-Up" : isBlast ? "Blast" : "Weld";

    // Unified next-stage: checks TPI hold points first, then blast/paint requirements
    const getQcNextStage = (dpr) => {
      const order = (orders||[]).find(o=>o.id===dpr?.orderId);
      const holdPoints = order?.quality?.tpiHoldPoints || [];
      if (isFitup) return holdPoints.includes("fit_up") ? "tpi_fitup" : "welding";
      if (isWeld) {
        if (holdPoints.includes("welding")) return "tpi_weld";
        return order?.quality?.blastingRequired===false ? "complete" : "blasting";
      }
      if (isBlast) {
        if (holdPoints.includes("blasting")) return "tpi_blast";
        const hasSpecs = (order?.quality?.paintSpecs||[]).length>0 || (order?.quality?.paintCoats||[]).length>0;
        return hasSpecs ? "painting" : "complete";
      }
      // paint_qc → mdcc (always goes to MDCC dossier before dispatch)
      return holdPoints.includes("painting") ? "tpi_paint" : "mdcc";
    };
    const getNextDprStage = getQcNextStage;
    const getNextInstStage = (dpr) => {
      const next = getQcNextStage(dpr);
      return next === "complete" ? "complete" : next;
    };

    const pending = (dprs || []).filter(d => d.currentStage === dprStage);
    const [selId,      setSelId]      = useState(null);
    const [rejectMode, setRejectMode] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [checks,     setChecks]     = useState({});

    const CHECKLIST = isFitup
      ? ["Joint fit-up dimensions verified","Root gap within WPS tolerance","Tack welds acceptable","Distortion within limits","Drawing mark-up checked"]
      : isBlast
      ? ["Blasting standard achieved (Sa grade verified)","Surface profile within spec (Rz microns)","No visible rust, mill scale, or contamination","Edges and corners adequately blasted","Ambient conditions recorded (humidity, dew point)"]
      : ["Visual weld inspection passed","Weld size/profile meets spec","Undercut / overlap checked","Weld coverage complete","NDE requirements noted"];

    const stageKey = isFitup ? "fitup" : isBlast ? "blast" : "weld";

    const selDpr = pending.find(d => d.id === selId);
    const updDpr = (id, patch) => setDprs(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));

    const advInstances = (dpr, toStage) => {
      setInstances(prev => prev.map(i => {
        if (i.drawingId !== dpr.drawingId || i.orderId !== dpr.orderId || i.isSideCut) return i;
        return { ...i, currentStage: toStage, currentStatus: toStage === "complete" ? "complete" : "in_progress",
          stageHistory: [...(i.stageHistory||[]), { stage: i.currentStage, completedAt: new Date().toISOString(), completedBy: user.username }] };
      }));
    };

    const doApprove = () => {
      if (!selDpr) return;
      const ts = new Date().toISOString();
      const resolvedNext     = getNextDprStage(selDpr);
      const resolvedInstNext = getNextInstStage(selDpr);
      updDpr(selDpr.id, {
        currentStage: resolvedNext,
        currentStatus: resolvedNext === "complete" ? "complete" : "in_progress",
        [`${stageKey}QcApprovedAt`]: ts,
        [`${stageKey}QcApprovedBy`]: user.username,
        stageHistory: [...(selDpr.stageHistory||[]), {
          stage: dprStage, action: "approved", by: user.username, at: ts,
          checklist: CHECKLIST.filter(c => checks[c])
        }]
      });
      advInstances(selDpr, resolvedInstNext);
      setSelId(null); setChecks({}); setRejectMode(false); setRejectReason("");
    };

    const doReject = () => {
      if (!selDpr || !rejectReason.trim()) return;
      const ts = new Date().toISOString();
      const prevStage = isFitup ? "fitup" : isBlast ? "blasting" : "welding";
      updDpr(selDpr.id, {
        currentStage: prevStage, currentStatus: "in_progress",
        stageHistory: [...(selDpr.stageHistory||[]), {
          stage: dprStage, action: "rejected", by: user.username, at: ts, reason: rejectReason
        }]
      });
      setInstances(prev => prev.map(i => {
        if (i.drawingId !== selDpr.drawingId || i.orderId !== selDpr.orderId || i.isSideCut) return i;
        return { ...i, currentStage: prevStage, currentStatus: "in_progress",
          stageHistory: [...(i.stageHistory||[]), { stage: dprStage, action: "rejected", at: ts, reason: rejectReason }] };
      }));
      setSelId(null); setChecks({}); setRejectMode(false); setRejectReason("");
    };

    if (pending.length === 0) return (
      <div style={{ padding:"40px 20px", textAlign:"center", color:T.textLow, fontSize:13 }}>
        ✓ No drawings pending {label} QC
      </div>
    );

    if (selDpr) {
      const order    = (orders||[]).find(o => o.id === selDpr.orderId) || {};
      const drawing  = (order.drawings||[]).find(d => d.id === selDpr.drawingId) || {};
      const fitupCon = (contractors||[]).find(c => c.id === selDpr.fitupContractorId);
      const weldCon  = (contractors||[]).find(c => c.id === selDpr.weldContractorId);
      const blastCon = (contractors||[]).find(c => c.id === selDpr.blastContractorId);
      const drgParts = (order.parts||[]).filter(p => p.drawingId === selDpr.drawingId && p.fabType === "Fabricate");
      const drgInsts = { length: drgParts.length }; // use part count not instance count
      const allChecked = CHECKLIST.every(c => checks[c]);
      const completedAt = isFitup ? selDpr.fitupCompleteAt : selDpr.weldCompleteAt;
      return (
        <div>
          <button onClick={() => { setSelId(null); setChecks({}); setRejectMode(false); setRejectReason(""); }}
            style={{ ...css.btn.ghost, marginBottom:16 }}>← Back to queue</button>
          <div style={{ ...css.card, marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
              <div>
                <div style={{ fontFamily:T.fontMono, fontWeight:700, color:T.accent, fontSize:15 }}>{selDpr.drawingNo || selDpr.drawingId}</div>
                <div style={{ fontSize:12, color:T.textMid, marginTop:3 }}>{order.orderNo} · {order.clientName}</div>
                {drawing.assemblyGroup && <div style={{ fontSize:11, color:T.textLow, marginTop:2 }}>Assembly: {drawing.assemblyGroup}</div>}
              </div>
              <Badge color="amber">{label} QC Pending</Badge>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
              <div style={{ background:T.bgInput, borderRadius:6, padding:"8px 12px" }}>
                <div style={{ fontSize:10, color:T.textMid, fontWeight:700, textTransform:"uppercase" }}>Fit-Up By</div>
                <div style={{ fontSize:12, fontWeight:600, color:T.text, marginTop:2 }}>{fitupCon?.name || "—"}</div>
              </div>
              <div style={{ background:T.bgInput, borderRadius:6, padding:"8px 12px" }}>
                <div style={{ fontSize:10, color:T.textMid, fontWeight:700, textTransform:"uppercase" }}>Weld By</div>
                <div style={{ fontSize:12, fontWeight:600, color:T.text, marginTop:2 }}>{weldCon?.name || "—"}</div>
              </div>
              <div style={{ background:T.bgInput, borderRadius:6, padding:"8px 12px" }}>
                <div style={{ fontSize:10, color:T.textMid, fontWeight:700, textTransform:"uppercase" }}>Parts</div>
                <div style={{ fontSize:12, fontWeight:600, color:T.text, marginTop:2 }}>{drgInsts.length} instances</div>
              </div>
            </div>
          </div>
          <div style={{ ...css.card, marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>
              {label} QC Checklist
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {CHECKLIST.map(item => (
                <label key={item} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"8px 10px",
                  background:checks[item] ? T.greenBg : T.bgInput, borderRadius:6,
                  border:`1px solid ${checks[item] ? T.green : T.border}` }}>
                  <input type="checkbox" checked={!!checks[item]} onChange={e => setChecks(p => ({ ...p, [item]: e.target.checked }))} />
                  <span style={{ fontSize:13, color:checks[item] ? T.green : T.text, fontWeight:checks[item]?600:400 }}>{item}</span>
                  {checks[item] && <span style={{ marginLeft:"auto", color:T.green, fontSize:12 }}>✓</span>}
                </label>
              ))}
            </div>
            <div style={{ marginTop:10, fontSize:11, color:T.textLow }}>
              {CHECKLIST.filter(c=>checks[c]).length} / {CHECKLIST.length} items checked
            </div>
          </div>
          {!rejectMode ? (
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={doApprove} disabled={!allChecked}
                style={{ ...css.btn.green, flex:1, padding:"10px 0", fontSize:13, opacity:allChecked?1:0.45 }}>
                ✓ Approve {label} QC — Advance to {isFitup?"Welding":isBlast?"Painting":"Blasting/Complete"}
                {!allChecked && <span style={{ fontSize:11, marginLeft:6 }}>({CHECKLIST.filter(c=>!checks[c]).length} remaining)</span>}
              </button>
              <button onClick={() => setRejectMode(true)} style={{ ...css.btn.ghost, color:T.red, padding:"10px 16px" }}>✕ Reject</button>
            </div>
          ) : (
            <div style={{ padding:14, background:T.redBg, borderRadius:8, border:`1px solid ${T.redLo}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.red, marginBottom:8 }}>Rejection Reason — Drawing returns to {isFitup?"Fit-Up":isBlast?"Blasting":"Welding"}</div>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2}
                placeholder="State reason for rejection…" style={{ ...css.input, width:"100%", resize:"vertical", marginBottom:8 }} />
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={doReject} disabled={!rejectReason.trim()}
                  style={{ ...css.btn.primary, background:T.red, opacity:rejectReason.trim()?1:0.45 }}>Confirm Reject</button>
                <button onClick={() => setRejectMode(false)} style={css.btn.ghost}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Queue list
    return (
      <div>
        <div style={{ fontSize:12, color:T.textLow, marginBottom:14 }}>
          {pending.length} drawing{pending.length!==1?"s":""} awaiting {label} QC approval
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {pending.map(dpr => {
            const order    = (orders||[]).find(o => o.id === dpr.orderId) || {};
            const fitupCon = (contractors||[]).find(c => c.id === dpr.fitupContractorId);
            const weldCon  = (contractors||[]).find(c => c.id === dpr.weldContractorId);
            const blastCon = (contractors||[]).find(c => c.id === dpr.blastContractorId);
            const drgInsts = { length: (order.parts||[]).filter(p=>p.drawingId===dpr.drawingId&&p.fabType==="Fabricate").length };
            const completedAt = isFitup ? dpr.fitupCompleteAt : isBlast ? dpr.blastCompleteAt : dpr.weldCompleteAt;
            const ageDays = completedAt ? Math.floor((Date.now()-new Date(completedAt).getTime())/86400000) : null;
            return (
              <div key={dpr.id} onClick={() => setSelId(dpr.id)}
                style={{ ...css.card, cursor:"pointer", borderLeft:`3px solid ${T.amber}` }}
                onMouseEnter={e=>e.currentTarget.style.background=T.bgHover}
                onMouseLeave={e=>e.currentTarget.style.background=T.bgCard}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontFamily:T.fontMono, fontWeight:700, color:T.accent, fontSize:13 }}>{dpr.drawingNo||dpr.drawingId}</div>
                    <div style={{ fontSize:11, color:T.textMid, marginTop:3 }}>{order.orderNo} · {order.clientName}</div>
                    <div style={{ fontSize:11, color:T.textLow, marginTop:4, display:"flex", gap:12 }}>
                      {isBlast
                        ? <span>Blast: <strong style={{color:T.text}}>{blastCon?.name||"—"}</strong></span>
                        : isFitup
                        ? <><span>Fit-Up: <strong style={{color:T.text}}>{fitupCon?.name||"—"}</strong></span><span>Weld: <strong style={{color:T.text}}>{weldCon?.name||"—"}</strong></span></>
                        : <><span>Fit-Up: <strong style={{color:T.text}}>{fitupCon?.name||"—"}</strong></span><span>Weld: <strong style={{color:T.text}}>{weldCon?.name||"—"}</strong></span></>
                      }
                      <span>{drgInsts.length} parts</span>
                      {ageDays!==null&&<span style={{color:ageDays>2?T.amber:T.textLow}}>Waiting {ageDays}d</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                    <Badge color="amber">{label} QC</Badge>
                    <span style={{ fontSize:11, color:T.textLow }}>Tap to inspect →</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  // ── end DprQcPanel ──────────────────────────────────────────────────────────

  // ── PaintQcPanel — per-coat QC approval ─────────────────────────────────────
  const PaintQcPanel = () => {
    const updDpr = (id, patch) => setDprs(prev=>prev.map(d=>d.id===id?{...d,...patch}:d));

    // Build a flat list of all coats pending QC across all painting DPRs
    // A coat needs QC if: requiresQc !== false AND qcStatus is not "approved"/"rejected"
    const coatQueue = [];
    (dprs||[]).filter(d=>d.currentStage==="painting"||d.currentStage==="paint_qc").forEach(dpr=>{
      const order = (orders||[]).find(o=>o.id===dpr.orderId)||{};
      const drawing = (order.drawings||[]).find(d=>d.id===dpr.drawingId)||{};
      const specs = order.quality?.paintSpecs || (order.quality?.paintCoats?.length?[{specLabel:"A",coats:order.quality.paintCoats}]:[]);
      const specId = drawing.paintSpecId || (specs[0]?.specLabel) || "A";
      const spec = specs.find(s=>s.specLabel===specId)||specs[0];
      const specCoats = spec?.coats || [];
      (dpr.paintCoats||[]).forEach((coat, ci) => {
        const specCoat = specCoats[ci] || {};
        if (specCoat.requiresQc===false) return; // skip coats that don't need QC
        if (coat.qcStatus==="approved") return; // already done
        coatQueue.push({ dpr, order, drawing, coat, ci, specCoat,
          coatLabel:`${coat.type} (Coat ${coat.coatNo||ci+1})` });
      });
    });

    // Also handle final paint_qc drawings — where all qc-required coats are approved
    const finalQueue = (dprs||[]).filter(d=>d.currentStage==="paint_qc"&&
      !(d.paintCoats||[]).some(c=>c.requiresQc!==false&&c.qcStatus!=="approved"));

    const [selCoat, setSelCoat] = useState(null); // {dprId, coatIdx}
    const [selFinal, setSelFinal] = useState(null);
    const [rejectMode, setRejectMode] = useState(false);
    const [form, setForm] = useState({});

    // ── Per-coat approval ──────────────────────────────────────────────────────
    const doCoatApprove = (entry) => {
      const { dpr, ci } = entry;
      const ts = new Date().toISOString();
      const updCoats = (dpr.paintCoats||[]).map((c,i)=>i===ci?{...c,
        qcStatus:"approved", qcApprovedAt:ts, qcApprovedBy:user.username,
        qcDftReading:parseFloat(form.dft)||null, qcRemarks:form.remarks||""
      }:c);
      // Check if all required coats now approved
      const order = (orders||[]).find(o=>o.id===dpr.orderId)||{};
      const drawing = (order.drawings||[]).find(d=>d.id===dpr.drawingId)||{};
      const specs = order.quality?.paintSpecs || (order.quality?.paintCoats?.length?[{specLabel:"A",coats:order.quality.paintCoats}]:[]);
      const specId = drawing.paintSpecId || (specs[0]?.specLabel) || "A";
      const spec = specs.find(s=>s.specLabel===specId)||specs[0];
      const specCoats = spec?.coats || [];
      const allDone = updCoats.every((c,i)=>specCoats[i]?.requiresQc===false||c.qcStatus==="approved");
      const allCoatsApplied = updCoats.length >= specCoats.length;
      // If all coats applied AND all required QCs done → move to paint_qc or tpi_paint
      const holdPoints = (order.quality?.tpiHoldPoints||[]);
      const nextStage = allDone && allCoatsApplied
        ? (holdPoints.includes("painting") ? "tpi_paint" : "paint_qc")
        : dpr.currentStage;
      updDpr(dpr.id, {
        paintCoats: updCoats,
        currentStage: nextStage,
        currentStatus: nextStage==="paint_qc"||nextStage==="tpi_paint" ? "pending_qc" : "in_progress",
        stageHistory:[...(dpr.stageHistory||[]),{stage:"painting",action:`coat_${ci+1}_qc_approved`,by:user.username,at:ts}]
      });
      setSelCoat(null); setForm({});
    };

    const doCoatReject = (entry) => {
      const { dpr, ci } = entry;
      if (!form.remarks?.trim()) return;
      const ts = new Date().toISOString();
      const updCoats = (dpr.paintCoats||[]).map((c,i)=>i===ci?{...c,
        qcStatus:"rejected", qcRejectedAt:ts, qcRejectedBy:user.username, qcRemarks:form.remarks
      }:c);
      updDpr(dpr.id, { paintCoats:updCoats,
        stageHistory:[...(dpr.stageHistory||[]),{stage:"painting",action:`coat_${ci+1}_qc_rejected`,by:user.username,at:ts,reason:form.remarks}]
      });
      setSelCoat(null); setForm({});
    };

    // ── Final paint_qc approval ────────────────────────────────────────────────
    const doFinalApprove = (dpr) => {
      const ts = new Date().toISOString();
      updDpr(dpr.id,{currentStage:"complete",currentStatus:"complete",
        paintQcApprovedAt:ts,paintQcApprovedBy:user.username,
        stageHistory:[...(dpr.stageHistory||[]),{stage:"paint_qc",action:"approved",by:user.username,at:ts,remarks:form.remarks||""}]});
      setInstances(prev=>prev.map(i=>{
        if(i.drawingId!==dpr.drawingId||i.orderId!==dpr.orderId||i.isSideCut) return i;
        return {...i,currentStage:"complete",currentStatus:"complete",
          stageHistory:[...(i.stageHistory||[]),{stage:"paint_qc",completedAt:ts,completedBy:user.username}]};
      }));
      setSelFinal(null); setForm({});
    };

    if (coatQueue.length===0&&finalQueue.length===0) return (
      <div style={{padding:"40px 20px",textAlign:"center",color:T.textLow,fontSize:13}}>✓ No paint QC pending</div>
    );

    // ── Coat detail view ───────────────────────────────────────────────────────
    if (selCoat) {
      const entry = coatQueue.find(e=>e.dpr.id===selCoat.dprId&&e.ci===selCoat.ci);
      if (!entry) { setSelCoat(null); return null; }
      const {dpr, order, coat, specCoat} = entry;
      return (
        <div>
          <button onClick={()=>{setSelCoat(null);setForm({});setRejectMode(false);}} style={{...css.btn.ghost,marginBottom:16}}>← Back to queue</button>
          <div style={{...css.card,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontFamily:T.fontMono,fontWeight:700,color:T.accent,fontSize:15}}>{dpr.drawingNo}</div>
                <div style={{fontSize:12,color:T.textMid,marginTop:3}}>{order.orderNo} · {order.clientName}</div>
              </div>
              <Badge color="amber">Coat {coat.coatNo}: {coat.type}</Badge>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
              <div style={{background:T.bgInput,borderRadius:6,padding:"8px 12px"}}>
                <div style={{fontSize:10,color:T.textMid,fontWeight:700,textTransform:"uppercase"}}>Applied At</div>
                <div style={{fontSize:12,fontWeight:600,color:T.text,marginTop:2}}>{coat.appliedAt?new Date(coat.appliedAt).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}):"—"}</div>
              </div>
              <div style={{background:T.bgInput,borderRadius:6,padding:"8px 12px"}}>
                <div style={{fontSize:10,color:T.textMid,fontWeight:700,textTransform:"uppercase"}}>Target DFT</div>
                <div style={{fontSize:12,fontWeight:600,color:T.text,marginTop:2}}>{specCoat.dft||coat.dft||"—"} μm</div>
              </div>
              <div style={{background:T.bgInput,borderRadius:6,padding:"8px 12px"}}>
                <div style={{fontSize:10,color:T.textMid,fontWeight:700,textTransform:"uppercase"}}>Applied By</div>
                <div style={{fontSize:12,fontWeight:600,color:T.text,marginTop:2}}>{coat.appliedBy||"—"}</div>
              </div>
            </div>
            {coat.dryTimeOverride&&<div style={{marginTop:10,padding:"6px 10px",background:T.amberBg,borderRadius:4,fontSize:11,color:T.amber}}>⚠ Dry time was not elapsed when coat was applied</div>}
            {coat.coatNo===1&&coat.primerWindowOk===false&&<div style={{marginTop:6,padding:"6px 10px",background:T.redBg,borderRadius:4,fontSize:11,color:T.red}}>⚠ Primer applied outside the window</div>}
          </div>
          <div style={{...css.card,marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.05em"}}>QC Inspection</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <label style={css.label}>Actual DFT Reading (μm)</label>
                <input type="number" value={form.dft||""} onChange={e=>setForm(p=>({...p,dft:e.target.value}))}
                  placeholder={`Target: ${specCoat.dft||coat.dft||"—"} μm`} style={css.input} />
              </div>
              <div>
                <label style={css.label}>Remarks</label>
                <input value={form.remarks||""} onChange={e=>setForm(p=>({...p,remarks:e.target.value}))}
                  placeholder="Observations, instrument used…" style={css.input} />
              </div>
            </div>
          </div>
          {!rejectMode
            ? <div style={{display:"flex",gap:10}}>
                <button onClick={()=>doCoatApprove(entry)} style={{...css.btn.green,flex:1,padding:"11px 0",fontSize:13}}>✓ Approve Coat {coat.coatNo} QC</button>
                <button onClick={()=>setRejectMode(true)} style={{...css.btn.ghost,color:T.red,padding:"11px 16px"}}>✕ Reject</button>
              </div>
            : <div style={{padding:14,background:T.redBg,borderRadius:8,border:`1px solid ${T.redLo}`}}>
                <div style={{fontSize:12,fontWeight:700,color:T.red,marginBottom:8}}>Rejection Reason — Coat must be reapplied</div>
                <textarea value={form.remarks||""} onChange={e=>setForm(p=>({...p,remarks:e.target.value}))} rows={2}
                  style={{...css.input,width:"100%",resize:"vertical",marginBottom:8}} placeholder="State reason…" />
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>doCoatReject(entry)} disabled={!form.remarks?.trim()}
                    style={{...css.btn.primary,background:T.red,opacity:form.remarks?.trim()?1:0.45}}>Confirm Reject</button>
                  <button onClick={()=>setRejectMode(false)} style={css.btn.ghost}>Cancel</button>
                </div>
              </div>
          }
        </div>
      );
    }

    return (
      <div>
        {/* Per-coat queue */}
        {coatQueue.length>0&&(
          <div style={{marginBottom:24}}>
            <div style={{fontSize:13,fontWeight:700,color:T.textMid,marginBottom:12}}>COAT QC PENDING — {coatQueue.length}</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {coatQueue.map((entry,i)=>{
                const {dpr,order,coat,coatLabel} = entry;
                const ageHrs = coat.appliedAt ? Math.round((Date.now()-new Date(coat.appliedAt).getTime())/3600000) : null;
                return (
                  <div key={`${dpr.id}-${entry.ci}`} onClick={()=>{setSelCoat({dprId:dpr.id,ci:entry.ci});setForm({});}}
                    style={{...css.card,cursor:"pointer",borderLeft:`3px solid ${T.accent}`}}
                    onMouseEnter={e=>e.currentTarget.style.background=T.bgHover}
                    onMouseLeave={e=>e.currentTarget.style.background=T.bgCard}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontFamily:T.fontMono,fontWeight:700,color:T.accent,fontSize:13}}>{dpr.drawingNo}</div>
                        <div style={{fontSize:11,color:T.textMid,marginTop:2}}>{order.orderNo} · {coatLabel}</div>
                        {ageHrs!==null&&<div style={{fontSize:11,color:ageHrs>24?T.amber:T.textLow,marginTop:2}}>Applied {ageHrs}h ago</div>}
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                        <Badge color="amber">{coat.type} QC</Badge>
                        <span style={{fontSize:11,color:T.textLow}}>Tap to inspect →</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Final paint_qc queue */}
        {finalQueue.length>0&&(
          <div>
            <div style={{fontSize:13,fontWeight:700,color:T.textMid,marginBottom:12}}>FINAL PAINT SIGN-OFF — {finalQueue.length}</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {finalQueue.map(dpr=>{
                const order=(orders||[]).find(o=>o.id===dpr.orderId)||{};
                const coats=dpr.paintCoats||[];
                return (
                  <div key={dpr.id} onClick={()=>{setSelFinal(dpr.id);setForm({});}}
                    style={{...css.card,cursor:"pointer",borderLeft:`3px solid ${T.green}`}}
                    onMouseEnter={e=>e.currentTarget.style.background=T.bgHover}
                    onMouseLeave={e=>e.currentTarget.style.background=T.bgCard}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontFamily:T.fontMono,fontWeight:700,color:T.accent,fontSize:13}}>{dpr.drawingNo}</div>
                        <div style={{fontSize:11,color:T.textMid,marginTop:2}}>{order.orderNo} · {order.clientName}</div>
                        <div style={{fontSize:11,color:T.green,marginTop:2}}>✓ All {coats.length} coats applied and QC approved</div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                        <Badge color="green">Final Sign-Off</Badge>
                        <span style={{fontSize:11,color:T.textLow}}>Tap to approve →</span>
                      </div>
                    </div>
                    {selFinal===dpr.id&&(
                      <div style={{marginTop:12}} onClick={e=>e.stopPropagation()}>
                        <textarea value={form.remarks||""} onChange={e=>setForm(p=>({...p,remarks:e.target.value}))} rows={2}
                          placeholder="Final QC remarks…" style={{...css.input,width:"100%",resize:"vertical",marginBottom:8}} />
                        <div style={{display:"flex",gap:8}}>
                          <button onClick={()=>doFinalApprove(dpr)} style={{...css.btn.green,flex:1}}>✓ Approve — Mark Drawing Complete</button>
                          <button onClick={()=>setSelFinal(null)} style={css.btn.ghost}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Inspection tabs config ──
  const INSP_TABS = [
    { id:"cutting_qc",   label:"Cutting QC",    stages:["cutting_qc"] },
    { id:"fitup",        label:"Fit-Up QC",     stages:["fitup","tpi_fitup"] },
    { id:"weld",         label:"Weld QC",       stages:["welding","tpi_weld"] },
    { id:"blast",        label:"Blast QC",      stages:["blast_qc"] },
    { id:"paint",        label:"Paint QC",      stages:["paint_qc"] },
    { id:"mdcc",         label:"MDCC",          stages:["mdcc"] },
    { id:"tpi",          label:"TPI",           stages:["tpi_fitup","tpi_weld","tpi_blast","tpi_paint"] },
    { id:"outbound_qc",  label:"Outbound QC",   stages:["outbound_qc_pending"] },
  ];
  const adminTabs = isAdmin ? [
    { id:"rules",  label:"Assignment Rules" },
    { id:"log",    label:"Override Log" },
  ] : [];
  const allTabs = [...INSP_TABS, { id:"history", label:"📋 History" }, ...adminTabs];

  // ── Admin state ──
  const [historyFilter, setHistoryFilter] = useState({ stage:"all", status:"all", orderId:"", search:"" });
  const [ruleModal, setRuleModal] = useState(null);
  const [ruleForm, setRuleForm] = useState({});
  const [overrideModal, setOverrideModal] = useState(null);
  const [overrideInst, setOverrideInst] = useState(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideEngineer, setOverrideEngineer] = useState("");

  const engineers = USERS.filter(u=>["production_engineer","qc_admin","super_admin"].includes(u.role)&&u.active);

  const getProcessType = (stage) => STAGE_TO_PROCESS[stage]||"";
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
      overriddenBy:user.username, overriddenAt:new Date().toISOString().slice(0,10),
      reason:overrideReason.trim(), assignedTo:overrideEngineer
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

  // ── Inspection Queue Panel ──
  const InspectionPanel = ({ stages }) => {
    const myQueue = instances.filter(i=>
      i.currentStatus==="pending_supervisor" &&
      stages.includes(i.currentStage) &&
      (!i.assignedEngineer || i.assignedEngineer===user.id || i.assignedEngineer===user.username)
    );

    // Group by rmUnitId first, then by markNo+drawingId
    const rmUnitGroups = {};
    myQueue.forEach(i=>{
      const rmKey = i.rmUnitId||`no-rmunit-${i.drawingId}`;
      if(!rmUnitGroups[rmKey]) rmUnitGroups[rmKey]={
        rmUnitId:i.rmUnitId||"",
        drawingNo:i.drawingNo,
        orderId:i.orderId,
        stage:i.currentStage,
        parts:[],
      };
      rmUnitGroups[rmKey].parts.push(i);
    });

    const [selRmUnit, setSelRmUnit] = useState(null);
    const [checks, setChecks] = useState({});
    const [dimReadings, setDimReadings] = useState({});
    const [rejectMode, setRejectMode] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const rmGroups = Object.values(rmUnitGroups);

    if(rmGroups.length===0) return (
      <div style={{padding:"40px 20px",textAlign:"center",color:T.textLow,fontSize:13}}>
        ✓ No pending {stages[0].replace(/_/g," ")} inspections
      </div>
    );

    const selGroup = selRmUnit ? rmGroups.find(g=>g.rmUnitId===selRmUnit||(g.rmUnitId===""&&selRmUnit==="no-rmunit")) : null;
    const checklist = STAGE_CHECKLISTS[stages[0]]||[];

    if(selGroup){
      const allChecked = checklist.length>0 && checklist.every(item=>checks[item]);
      const doApprove = () => {
        const ts = new Date().toISOString();
        // Find the drawing this rmUnit belongs to
        const drawingId = selGroup?.parts?.[0]?.drawingId || selGroup?.drawingId;
        const orderId   = selGroup?.parts?.[0]?.orderId   || selGroup?.orderId;
        setInstances(prev=>prev.map(inst=>{
          if(!selGroup.parts.some(p=>p.instanceId===inst.instanceId)) return inst;
          // cutting_qc → awaiting_collection (contractor must collect before fitup)
          const nextStage = "awaiting_collection";
          return {...inst,
            currentStage: nextStage,
            currentStatus: "awaiting_collection",
            stageHistory: [...(inst.stageHistory||[]),{
              stage:inst.currentStage, status:"approved",
              approvedBy:user.username, approvedAt:ts,
              checklistItems:Object.keys(checks).filter(k=>checks[k]),
              dimReadings: dimReadings
            }]
          };
        }));
        // Also update the DPR to awaiting_collection so contractor sees it
        if (drawingId && orderId) {
          setDprs(prev=>prev.map(d=>{
            if (d.drawingId!==drawingId||d.orderId!==orderId) return d;
            return {...d, currentStage:"awaiting_collection", currentStatus:"awaiting_collection",
              cuttingQcClearedAt:ts, cuttingQcClearedBy:user.username,
              awaitingCollectionSince:ts,
              auditLog:[...(d.auditLog||[]),{action:"cutting-qc-cleared",by:user.username,date:ts.slice(0,10)}]
            };
          }));
        }
        setSelRmUnit(null); setChecks({}); setDimReadings({}); setRejectMode(false); setRejectReason("");
      };
      const doReject = () => {
        if(!rejectReason.trim()) return;
        const ts = new Date().toISOString();
        setInstances(prev=>prev.map(inst=>{
          if(!selGroup.parts.some(p=>p.instanceId===inst.instanceId)) return inst;
          return {...inst,
            currentStage:"cutting",
            currentStatus:"pending",
            stageHistory:[...(inst.stageHistory||[]),{
              stage:inst.currentStage, status:"rejected",
              rejectedBy:user.username, rejectedAt:ts,
              reason:rejectReason
            }]
          };
        }));
        setSelRmUnit(null); setChecks({}); setRejectMode(false); setRejectReason("");
      };

      return (
        <div>
          <button onClick={()=>{setSelRmUnit(null);setChecks({});setRejectMode(false);}} style={{...css.btn.ghost,marginBottom:16}}>← Back to queue</button>
          <div style={{...css.card,marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div>
                <div style={{fontFamily:T.fontMono,fontWeight:700,color:T.accentHi,fontSize:14}}>{selGroup.rmUnitId||selGroup.drawingNo}</div>
                <div style={{fontSize:12,color:T.textMid,marginTop:2}}>{selGroup.drawingNo} · {selGroup.orderId} · <Badge color="blue">{selGroup.stage.replace(/_/g," ")}</Badge></div>
              </div>
              <div style={{fontSize:12,color:T.textMid}}>{selGroup.parts.length} part{selGroup.parts.length!==1?"s":""}</div>
            </div>

            {/* Parts table */}
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,marginBottom:16}}>
              <thead>
                <tr style={{background:T.bgInput}}>
                  {["Mark No","Drawing","Mat Code","Qty","Assignment","Cut By","Cut At"].map(h=>(
                    <th key={h} style={{padding:"6px 10px",textAlign:"left",color:T.textMid,fontWeight:700,fontSize:10,borderBottom:`1px solid ${T.border}`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(()=>{
                  // Deduplicate by markNo — show unique parts with qty count
                  const uniqueParts={};
                  selGroup.parts.forEach(p=>{
                    if(!uniqueParts[p.markNo]) uniqueParts[p.markNo]={...p,qty:0};
                    uniqueParts[p.markNo].qty++;
                  });
                  return Object.values(uniqueParts).map(p=>{
                    const isSideCut=p.isSideCut||p.releaseId==="side_cut";
                    const isAssigned=!!p.assignedContractorId;
                    return (
                      <tr key={p.markNo} style={{borderBottom:`1px solid ${T.border}33`,background:isSideCut?`${T.amber}08`:"transparent"}}>
                        <td style={{padding:"5px 10px",fontFamily:T.fontMono,color:isSideCut?T.amber:T.accentHi,fontWeight:600}}>
                          {p.markNo}
                          {isSideCut&&<span style={{marginLeft:4,fontSize:9,color:T.amber}}>side cut</span>}
                        </td>
                        <td style={{padding:"5px 10px",fontFamily:T.fontMono,fontSize:10,color:T.textMid}}>{p.drawingNo}</td>
                        <td style={{padding:"5px 10px",fontSize:10}}>{p.matCode}</td>
                        <td style={{padding:"5px 10px",fontSize:10,textAlign:"right",fontWeight:600}}>{p.qty} pcs</td>
                        <td style={{padding:"5px 10px",fontSize:10}}>
                          {isAssigned
                            ?<span style={{color:T.green,fontWeight:600}}>{p.assignedContractorName}</span>
                            :<span style={{color:T.amber,fontSize:10}}>Unassigned — holding bay</span>}
                        </td>
                        <td style={{padding:"5px 10px",fontSize:10}}>{p.cutBy||"—"}</td>
                        <td style={{padding:"5px 10px",fontSize:10,color:T.textMid}}>{p.cutAt?.slice(0,16).replace("T"," ")||"—"}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>

            {/* Checklist */}
            {checklist.length>0&&(
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:8}}>INSPECTION CHECKLIST</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {checklist.map(item=>(
                    <label key={item} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:checks[item]?T.greenBg:T.bgInput,borderRadius:4,cursor:"pointer",border:`1px solid ${checks[item]?T.green:T.border}`,fontSize:12}}>
                      <input type="checkbox" checked={!!checks[item]} onChange={e=>setChecks(p=>({...p,[item]:e.target.checked}))} />
                      <span style={{color:checks[item]?T.green:T.text}}>{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Dimension readings for cutting QC */}
            {stages.includes("cutting_qc")&&(
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:8}}>DIMENSION READINGS (optional)</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                  {["Length (mm)","Width (mm)","Diagonal (mm)"].map(dim=>(
                    <div key={dim}>
                      <label style={{...css.label,fontSize:10}}>{dim}</label>
                      <input type="number" value={dimReadings[dim]||""} onChange={e=>setDimReadings(p=>({...p,[dim]:e.target.value}))} style={{...css.input,fontSize:11}} placeholder="Actual reading" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {!rejectMode?(
              <div style={{display:"flex",gap:8}}>
                <button onClick={doApprove} disabled={checklist.length>0&&!allChecked} style={{...css.btn.green,flex:1,padding:"10px 0",fontSize:13,opacity:checklist.length>0&&!allChecked?0.45:1}}>
                  ✓ Approve — {selGroup.parts.length} part{selGroup.parts.length!==1?"s":""}
                  {checklist.length>0&&!allChecked&&<span style={{fontSize:11,marginLeft:6}}>({checklist.filter(i=>!checks[i]).length} items remaining)</span>}
                </button>
                <button onClick={()=>setRejectMode(true)} style={{...css.btn.ghost,color:T.red,padding:"10px 16px"}}>✕ Reject</button>
              </div>
            ):(
              <div style={{padding:"12px",background:T.redBg,borderRadius:6,border:`1px solid ${T.red}44`}}>
                <div style={{fontSize:12,fontWeight:700,color:T.red,marginBottom:8}}>Rejection Reason</div>
                <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} rows={2} placeholder="State reason for rejection..." style={{...css.input,width:"100%",resize:"vertical",marginBottom:8}} />
                <div style={{display:"flex",gap:8}}>
                  <button onClick={doReject} disabled={!rejectReason.trim()} style={{...css.btn.primary,background:T.red,opacity:rejectReason.trim()?1:0.45}}>Confirm Reject</button>
                  <button onClick={()=>setRejectMode(false)} style={css.btn.ghost}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Queue list view
    return (
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",background:T.bgCard,borderRadius:8,fontSize:12}}>
          <thead>
            <tr style={{background:T.bgInput}}>
              {["RM Unit / Drawing","Order","Stage","Parts","Cut By","Waiting Since","Action"].map(h=>(
                <th key={h} style={{padding:"8px 10px",fontSize:10,color:T.textMid,fontWeight:700,textAlign:"left",borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rmGroups.map(g=>{
              const waitingSince=g.parts[0]?.cutAt||g.parts[0]?.createdAt||"";
              const hoursWaiting=waitingSince?Math.round((Date.now()-new Date(waitingSince).getTime())/3600000):0;
              const waitColor=hoursWaiting>24?T.red:hoursWaiting>8?T.amber:T.green;
              return (
                <tr key={g.rmUnitId||g.drawingNo} style={{borderBottom:`1px solid ${T.border}`,cursor:"pointer"}} onClick={()=>setSelRmUnit(g.rmUnitId||"no-rmunit")}>
                  <td style={{padding:"8px 10px",fontFamily:T.fontMono,fontWeight:700,color:T.accentHi,fontSize:11}}>{g.rmUnitId||g.drawingNo}</td>
                  <td style={{padding:"8px 10px",fontSize:11}}>{g.orderId}</td>
                  <td style={{padding:"8px 10px"}}><Badge color="blue">{g.stage.replace(/_/g," ")}</Badge></td>
                  <td style={{padding:"8px 10px",fontSize:11,fontWeight:600}}>{g.parts.length}</td>
                  <td style={{padding:"8px 10px",fontSize:11,color:T.textMid}}>{g.parts[0]?.cutBy||"—"}</td>
                  <td style={{padding:"8px 10px",fontSize:11,color:waitColor}}>{hoursWaiting>0?`${hoursWaiting}h ago`:"Just now"}</td>
                  <td style={{padding:"8px 10px"}}>
                    <div style={{display:"flex",gap:6}}>
                      <div style={{display:"flex",gap:6}}>
                        <button style={{...css.btn.primary,fontSize:11,padding:"3px 10px"}} onClick={e=>{e.stopPropagation();setSelRmUnit(g.rmUnitId||"no-rmunit");}}>Inspect →</button>
                        {can(user,"production.revert_cutting_qc")&&g.instances?.some(i=>i.currentStatus==="cleared"||i.currentStatus==="qc_cleared"||i.currentStatus==="rejected")&&(
                          <button style={{...css.btn.ghost,fontSize:10,padding:"2px 8px"}} onClick={e=>{e.stopPropagation();const inst=g.instances?.find(i=>i.currentStatus==="cleared"||i.currentStatus==="qc_cleared"||i.currentStatus==="rejected");if(inst){setCorrForm({});setCorrModal({inst,type:"menu"});}}}>⋯</button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // ── QC Corrections Modal ──────────────────────────────────────────────────
  const QcCorrModal = () => {
    if (!corrModal) return null;
    const { inst, dpr, type } = corrModal;

    // Menu — entry point showing all correction options
    if (type==="menu") {
      const isCleared = inst?.currentStatus==="cleared"||inst?.currentStatus==="qc_cleared";
      const isRejected = inst?.currentStatus==="rejected"||inst?.currentStatus==="qc_rejected";
      return (
        <Modal title={`Corrections — ${inst?.markNo||""} (${inst?.drawingNo||""})`} onClose={()=>setCorrModal(null)} width={440}>
          <div style={{fontSize:11,color:T.textMid,marginBottom:12}}>
            Stage: <Badge color="blue">{inst?.currentStage||"—"}</Badge>
            <span style={{marginLeft:8}}>Status: <span style={{fontWeight:700,color:isCleared?T.green:isRejected?T.red:T.amber}}>{inst?.currentStatus||"—"}</span></span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {isCleared&&can(user,"production.revert_cutting_qc")&&(
              <button onClick={()=>{setCorrForm({});setCorrModal({inst,type:"revert_clearance"});}}
                style={{...css.btn.secondary,textAlign:"left",justifyContent:"flex-start"}}>
                ↩ Revert QC clearance (send back to QC pending)
              </button>
            )}
            {isCleared&&can(user,"qc.raise_concern")&&(
              <button onClick={()=>{setCorrForm({});setCorrModal({inst,type:"raise_ncr"});}}
                style={{...css.btn.secondary,textAlign:"left",justifyContent:"flex-start",color:T.red}}>
                ⚠ Raise NCR (non-conformance)
              </button>
            )}
            {isRejected&&can(user,"production.revert_cutting_qc")&&(
              <button onClick={()=>{setCorrForm({});setCorrModal({inst,type:"revert_rejection"});}}
                style={{...css.btn.secondary,textAlign:"left",justifyContent:"flex-start"}}>
                ↩ Revert rejection (wrongly rejected)
              </button>
            )}
            {isRejected&&(
              <button onClick={()=>{setCorrForm({reason:inst?.qcRejectionReason||""});setCorrModal({inst,type:"edit_reason"});}}
                style={{...css.btn.secondary,textAlign:"left",justifyContent:"flex-start"}}>
                ✏ Edit rejection reason
              </button>
            )}
            {!isCleared&&!isRejected&&(
              <div style={{fontSize:12,color:T.textMid,padding:"12px 0"}}>No corrections available for current status.</div>
            )}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}>
            <button onClick={()=>setCorrModal(null)} style={css.btn.secondary}>Close</button>
          </div>
        </Modal>
      );
    }

    // Revert QC Clearance
    if (type==="revert_clearance") return (
      <Modal title="Revert QC Clearance" onClose={()=>setCorrModal(null)} width={480}>
        <InfoBanner color="amber">This will send the part back to cutting QC pending. Requires mandatory reason.</InfoBanner>
        <div style={{marginTop:12,marginBottom:12}}>
          <Field label="Has any downstream work started (fit-up / welding)?">
            <div style={{display:"flex",gap:8,marginTop:4}}>
              {["Yes — downstream work exists","No — part has not moved forward"].map(opt=>(
                <label key={opt} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:12}}>
                  <input type="radio" checked={corrForm.physicalHappened===opt} onChange={()=>setCorrForm(f=>({...f,physicalHappened:opt}))} />
                  {opt}
                </label>
              ))}
            </div>
          </Field>
          {corrForm.physicalHappened==="Yes — downstream work exists"&&(
            <InfoBanner color="red">Cannot fully revert — downstream work exists. Raise an NCR instead.</InfoBanner>
          )}
          <Field label="Reason (mandatory)" style={{marginTop:10}}>
            <Input value={corrForm.reason||""} onChange={e=>setCorrForm(f=>({...f,reason:e.target.value}))} placeholder="e.g. Approved in error — dimension recheck needed" />
          </Field>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button onClick={()=>setCorrModal(null)} style={css.btn.secondary}>Cancel</button>
          <button onClick={()=>doRevertQcClearance(inst,corrForm.reason,corrForm.physicalHappened==="No — part has not moved forward")}
            disabled={!corrForm.physicalHappened||!corrForm.reason||corrForm.physicalHappened==="Yes — downstream work exists"}
            style={{...css.btn.primary,background:T.amber,opacity:(!corrForm.physicalHappened||!corrForm.reason||corrForm.physicalHappened==="Yes — downstream work exists")?0.4:1}}>
            Revert Clearance
          </button>
        </div>
      </Modal>
    );

    // Revert QC Rejection
    if (type==="revert_rejection") return (
      <Modal title="Revert QC Rejection" onClose={()=>setCorrModal(null)} width={480}>
        <InfoBanner color="amber">Has the piece been physically scrapped or disposed of? If yes, this cannot be reverted.</InfoBanner>
        <div style={{marginTop:12,marginBottom:12}}>
          <Field label="Has the piece been scrapped or disposed of?">
            <div style={{display:"flex",gap:8,marginTop:4}}>
              {["Yes — already scrapped","No — piece is available"].map(opt=>(
                <label key={opt} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:12}}>
                  <input type="radio" checked={corrForm.scrapped===opt} onChange={()=>setCorrForm(f=>({...f,scrapped:opt}))} />
                  {opt}
                </label>
              ))}
            </div>
          </Field>
          {corrForm.scrapped==="Yes — already scrapped"&&<InfoBanner color="red">Cannot revert — piece already scrapped.</InfoBanner>}
          <Field label="Reason (mandatory)" style={{marginTop:10}}>
            <Input value={corrForm.reason||""} onChange={e=>setCorrForm(f=>({...f,reason:e.target.value}))} placeholder="e.g. Wrongly rejected — re-measured and within tolerance" />
          </Field>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button onClick={()=>setCorrModal(null)} style={css.btn.secondary}>Cancel</button>
          <button onClick={()=>doRevertQcRejection(inst,corrForm.reason)}
            disabled={!corrForm.scrapped||corrForm.scrapped==="Yes — already scrapped"||!corrForm.reason}
            style={{...css.btn.primary,opacity:(!corrForm.scrapped||corrForm.scrapped==="Yes — already scrapped"||!corrForm.reason)?0.4:1}}>
            Revert Rejection
          </button>
        </div>
      </Modal>
    );

    // Edit Rejection Reason
    if (type==="edit_reason") return (
      <Modal title="Edit Rejection Reason" onClose={()=>setCorrModal(null)} width={440}>
        <Field label="New rejection reason">
          <Input value={corrForm.reason||inst?.qcRejectionReason||""} onChange={e=>setCorrForm(f=>({...f,reason:e.target.value}))} />
        </Field>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12}}>
          <button onClick={()=>setCorrModal(null)} style={css.btn.secondary}>Cancel</button>
          <button onClick={()=>doEditRejectionReason(inst,corrForm.reason)} style={css.btn.primary}>Save</button>
        </div>
      </Modal>
    );

    // Raise NCR
    if (type==="raise_ncr") return (
      <Modal title={`Raise NCR — ${inst?.markNo||""}`} onClose={()=>setCorrModal(null)} width={560}>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Field label="Defect description (mandatory)">
            <Input value={corrForm.description||""} onChange={e=>setCorrForm(f=>({...f,description:e.target.value}))} placeholder="Describe the non-conformance" />
          </Field>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <Field label="Dimensions found">
              <Input value={corrForm.dimensionsFound||""} onChange={e=>setCorrForm(f=>({...f,dimensionsFound:e.target.value}))} placeholder="e.g. 2390mm" />
            </Field>
            <Field label="Dimensions required">
              <Input value={corrForm.dimensionsRequired||""} onChange={e=>setCorrForm(f=>({...f,dimensionsRequired:e.target.value}))} placeholder="e.g. 2388mm" />
            </Field>
          </div>
          <Field label="Disposition (mandatory)">
            <Sel value={corrForm.disposition||""} onChange={e=>setCorrForm(f=>({...f,disposition:e.target.value}))}>
              <option value="">Select...</option>
              <option value="rework">Rework — send back for correction</option>
              <option value="scrap">Scrap — replace with new cutting</option>
              <option value="use_as_is">Use as-is — request client concession</option>
            </Sel>
          </Field>
          {corrForm.disposition==="rework"&&(
            <Field label="Rework at stage">
              <Sel value={corrForm.reworkStage||"cutting"} onChange={e=>setCorrForm(f=>({...f,reworkStage:e.target.value}))}>
                <option value="cutting">Cutting (re-cut the piece)</option>
                <option value="fitup">Fit-up (re-do fit-up)</option>
                <option value="welding">Welding (repair weld)</option>
              </Sel>
            </Field>
          )}
          {corrForm.disposition==="scrap"&&(
            <InfoBanner color="amber">This piece will be marked as scrapped. A replacement cutting request will be sent to the Planning Admin for decision.</InfoBanner>
          )}
          {corrForm.disposition==="use_as_is"&&(
            <InfoBanner color="blue">A concession request will be raised. The part will continue in production pending client approval.</InfoBanner>
          )}
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
          <button onClick={()=>setCorrModal(null)} style={css.btn.secondary}>Cancel</button>
          <button onClick={()=>doRaiseNcr(inst,corrForm)}
            disabled={!corrForm.description||!corrForm.disposition}
            style={{...css.btn.primary,opacity:(!corrForm.description||!corrForm.disposition)?0.4:1}}>
            Raise NCR
          </button>
        </div>
      </Modal>
    );

    // DPR Stage Rejection (fit-up / welding)
    if (type==="dpr_rejection") {
      const dprInsts = (instances||[]).filter(i=>i.drawingId===dpr?.drawingId&&i.orderId===dpr?.orderId&&["fitup","welding"].includes(i.currentStage));
      return (
        <Modal title={`Reject at ${corrModal.stage==="fitup_qc"?"Fit-Up":"Welding"} — ${dpr?.drawingNo}`} onClose={()=>setCorrModal(null)} width={560}>
          <InfoBanner color="amber">Select what to do with each piece. Rework sends it back to the previous stage. Scrap creates a replacement cutting request.</InfoBanner>
          <div style={{marginTop:12,marginBottom:12}}>
            {dprInsts.length===0&&<div style={{fontSize:12,color:T.textMid}}>No instances found for this drawing at current stage.</div>}
            {dprInsts.map(i=>(
              <div key={i.id} style={{display:"flex",alignItems:"center",gap:12,padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>
                <span style={{fontFamily:T.fontMono,fontSize:12,fontWeight:700,width:80}}>{i.markNo}</span>
                <span style={{fontSize:11,color:T.textMid,flex:1}}>{i.description||""}</span>
                <div style={{display:"flex",gap:6}}>
                  {["continue","rework","scrap"].map(action=>(
                    <button key={action} onClick={()=>setCorrForm(f=>({...f,pieceActions:{...f.pieceActions,[i.id]:action}}))}
                      style={{...css.btn.ghost,fontSize:10,padding:"2px 8px",
                        background:(corrForm.pieceActions||{})[i.id]===action?(action==="continue"?T.green:action==="rework"?T.amber:T.red):"transparent",
                        color:(corrForm.pieceActions||{})[i.id]===action?"#fff":T.textMid,
                        border:`1px solid ${action==="continue"?T.green:action==="rework"?T.amber:T.red}`}}>
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <Field label="Rejection reason (mandatory)" style={{marginTop:12}}>
              <Input value={corrForm.reason||""} onChange={e=>setCorrForm(f=>({...f,reason:e.target.value}))} placeholder="State reason for rejection" />
            </Field>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button onClick={()=>setCorrModal(null)} style={css.btn.secondary}>Cancel</button>
            <button onClick={()=>doDprRejection(dpr,corrModal.stage,corrForm.pieceActions,corrForm.reason)}
              disabled={!corrForm.reason}
              style={{...css.btn.primary,background:T.red,opacity:!corrForm.reason?0.4:1}}>
              Confirm Rejection
            </button>
          </div>
        </Modal>
      );
    }
    return null;
  };

  // ── Tab bar ──
  return (
    <div>
      <QcCorrModal />
      <div style={{fontSize:18,fontWeight:800,color:T.text,marginBottom:16}}>QC & Inspection</div>
      <div style={{display:"flex",gap:0,marginBottom:20,borderBottom:`1px solid ${T.border}`,flexWrap:"wrap"}}>
        {allTabs.map(t=>{
          const isInsp=INSP_TABS.find(x=>x.id===t.id);
          // fitup/weld tabs count DPRs; all others count instances
          let pendingCount=0;
          if(t.id==="fitup") pendingCount=(dprs||[]).filter(d=>d.currentStage==="fitup_qc").length;
          else if(t.id==="weld") pendingCount=(dprs||[]).filter(d=>d.currentStage==="weld_qc").length;
          else if(t.id==="blast") pendingCount=(dprs||[]).filter(d=>d.currentStage==="blast_qc").length;
          else if(t.id==="paint") pendingCount=(dprs||[]).filter(d=>d.currentStage==="paint_qc").length;
          else if(t.id==="tpi") pendingCount=(dprs||[]).filter(d=>["tpi_fitup","tpi_weld","tpi_blast","tpi_paint"].includes(d.currentStage)).length;
          else if(t.id==="outbound_qc") pendingCount=(instances||[]).filter(i=>i.currentStatus==="outbound_qc_pending").length;
          else if(isInsp) pendingCount=(instances||[]).filter(i=>
            i.currentStatus==="pending_supervisor"&&
            isInsp.stages.includes(i.currentStage)&&
            (!i.assignedEngineer||i.assignedEngineer===user.id||i.assignedEngineer===user.username)
          ).length;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:"10px 16px",fontSize:12,fontWeight:tab===t.id?700:400,
              color:tab===t.id?T.accent:T.textMid,background:"transparent",border:"none",
              borderBottom:tab===t.id?`2px solid ${T.accent}`:"2px solid transparent",
              cursor:"pointer",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"
            }}>
              {t.label}
              {pendingCount>0&&<span style={{background:T.amber,color:"#fff",borderRadius:"50%",fontSize:10,padding:"1px 5px",fontWeight:700}}>{pendingCount}</span>}
            </button>
          );
        })}
      </div>

      {/* Inspection tabs — fitup/weld/blast/paint use DPR-level panel, TPI uses TPI panel, others use instance-level panel */}
      {tab==="fitup"       && <DprQcPanel dprStage="fitup_qc" />}
      {tab==="weld"        && <DprQcPanel dprStage="weld_qc"  />}
      {tab==="blast"       && <DprQcPanel dprStage="blast_qc" />}
      {tab==="paint"       && <PaintQcPanel />}
      {tab==="tpi"         && <TpiQcPanel orders={orders} dprs={dprs} setDprs={setDprs} instances={instances} setInstances={setInstances} user={user} tpiTemplates={tpiTemplates} setTpiTemplates={setTpiTemplates} contractors={contractors} />}
      {tab==="mdcc"        && <MDCCModule dprs={dprs} setDprs={setDprs} orders={orders} user={user} />}
      {tab==="outbound_qc" && <OutboundQcPanel user={user} instances={instances} setInstances={setInstances} orders={orders} />}
      {INSP_TABS.filter(t=>!["fitup","weld","blast","paint","tpi","mdcc","outbound_qc"].includes(t.id)).map(t=>tab===t.id&&<InspectionPanel key={t.id} stages={t.stages} />)}

      {/* Admin-only tabs */}
      {/* ── HISTORY TAB ── */}
      {tab==="history"&&(()=>{
        const ALL_STAGES = [
          {id:"all",label:"All Stages"},
          {id:"cutting_qc",label:"Cutting QC"},
          {id:"fitup_qc",label:"Fit-Up QC"},
          {id:"welding_qc",label:"Weld QC"},
          {id:"blast_qc",label:"Blast QC"},
          {id:"paint_qc",label:"Paint QC"},
          {id:"mdcc",label:"MDCC"},
          {id:"tpi_fitup",label:"TPI Fit-Up"},
          {id:"tpi_weld",label:"TPI Weld"},
        ];
        // Gather all instances that have been through QC
        const qcInstances = (instances||[]).filter(i=>{
          const hasQcHistory = (i.stageHistory||[]).some(h=>
            ["cutting_qc","fitup_qc","welding_qc","blast_qc","paint_qc","mdcc","tpi_fitup","tpi_weld"].includes(h.stage)
          );
          const isInQc = ["cutting_qc","fitup_qc","welding_qc","blast_qc","paint_qc","mdcc"].includes(i.currentStage);
          const isScrapped = i.currentStage==="scrapped";
          return hasQcHistory||isInQc||isScrapped;
        });

        const filtered = qcInstances.filter(i=>{
          if (historyFilter.stage!=="all" && i.currentStage!==historyFilter.stage &&
              !(i.stageHistory||[]).some(h=>h.stage===historyFilter.stage)) return false;
          if (historyFilter.status==="cleared" && i.currentStatus!=="cleared"&&i.currentStatus!=="qc_cleared") return false;
          if (historyFilter.status==="rejected" && i.currentStatus!=="rejected"&&i.currentStatus!=="qc_rejected") return false;
          if (historyFilter.status==="pending" && i.currentStatus!=="pending_qc"&&i.currentStatus!=="pending") return false;
          if (historyFilter.orderId && i.orderId!==historyFilter.orderId) return false;
          if (historyFilter.search) {
            const q=historyFilter.search.toLowerCase();
            if (!(i.markNo||"").toLowerCase().includes(q)&&
                !(i.drawingNo||"").toLowerCase().includes(q)&&
                !(i.id||"").toLowerCase().includes(q)) return false;
          }
          return true;
        }).slice().reverse(); // most recent first

        const orders = (instances||[]).map(i=>({id:i.orderId,no:i.orderId})).filter((v,i,a)=>a.findIndex(x=>x.id===v.id)===i);

        const canCorrect = can(user,"production.revert_cutting_qc")||can(user,"production.edit_defect")||can(user,"qc.raise_concern");

        return (
          <div>
            {/* Filters */}
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"flex-end"}}>
              <Field label="Stage" style={{minWidth:130}}>
                <Sel value={historyFilter.stage} onChange={e=>setHistoryFilter(f=>({...f,stage:e.target.value}))}>
                  {ALL_STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                </Sel>
              </Field>
              <Field label="Status" style={{minWidth:120}}>
                <Sel value={historyFilter.status} onChange={e=>setHistoryFilter(f=>({...f,status:e.target.value}))}>
                  <option value="all">All</option>
                  <option value="cleared">Cleared ✓</option>
                  <option value="rejected">Rejected ✗</option>
                  <option value="pending">Pending</option>
                </Sel>
              </Field>
              <Field label="Order" style={{minWidth:150}}>
                <Sel value={historyFilter.orderId} onChange={e=>setHistoryFilter(f=>({...f,orderId:e.target.value}))}>
                  <option value="">All Orders</option>
                  {orders.map(o=><option key={o.id} value={o.id}>{o.id}</option>)}
                </Sel>
              </Field>
              <Field label="Search mark / drawing" style={{flex:1,minWidth:160}}>
                <Input value={historyFilter.search} onChange={e=>setHistoryFilter(f=>({...f,search:e.target.value}))}
                  placeholder="Mark no, drawing no..." />
              </Field>
              {(historyFilter.stage!=="all"||historyFilter.status!=="all"||historyFilter.orderId||historyFilter.search)&&(
                <button onClick={()=>setHistoryFilter({stage:"all",status:"all",orderId:"",search:""})}
                  style={{...css.btn.ghost,fontSize:11,alignSelf:"flex-end"}}>Clear</button>
              )}
            </div>

            <div style={{fontSize:11,color:T.textMid,marginBottom:8}}>{filtered.length} record{filtered.length!==1?"s":""}</div>

            {filtered.length===0
              ? <div style={{...css.card,textAlign:"center",padding:32,color:T.textLow}}>No QC records match the current filters</div>
              : <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead><tr style={{background:T.bgInput}}>
                      {["Mark No","Drawing","Order","Stage","Status","Cleared/Rejected By","Date","Reason",""].map(h=>(
                        <th key={h} style={{padding:"7px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:T.textMid,borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {filtered.map((inst,i)=>{
                        // Find most recent QC history entry
                        const qcHistory = (inst.stageHistory||[]).filter(h=>
                          ["cutting_qc","fitup_qc","welding_qc","blast_qc","paint_qc","mdcc"].includes(h.stage)
                        );
                        const lastQc = qcHistory[qcHistory.length-1]||{};
                        const isCleared = inst.currentStatus==="cleared"||inst.currentStatus==="qc_cleared"||(lastQc.action==="approved");
                        const isRejected = inst.currentStatus==="rejected"||inst.currentStatus==="qc_rejected"||(lastQc.action==="rejected")||inst.currentStage==="scrapped";
                        const statusColor = isCleared?T.green:isRejected?T.red:T.amber;
                        const statusLabel = isCleared?"Cleared":isRejected?"Rejected":"Pending";
                        return (
                          <tr key={inst.id||i} style={{borderBottom:`1px solid ${T.border}`,background:i%2===0?"transparent":T.bg}}>
                            <td style={{padding:"6px 10px",fontFamily:T.fontMono,fontWeight:700,color:T.accent}}>{inst.markNo||"—"}</td>
                            <td style={{padding:"6px 10px",fontSize:11,color:T.text}}>{inst.drawingNo||"—"}</td>
                            <td style={{padding:"6px 10px",fontSize:11,fontFamily:T.fontMono,color:T.textMid}}>{inst.orderId||"—"}</td>
                            <td style={{padding:"6px 10px"}}>
                              <Badge color={inst.currentStage?.includes("qc")?"blue":inst.currentStage==="scrapped"?"red":"gray"}>
                                {inst.currentStage||"—"}
                              </Badge>
                            </td>
                            <td style={{padding:"6px 10px"}}>
                              <span style={{fontFamily:T.fontMono,fontSize:11,fontWeight:700,color:statusColor}}>{statusLabel}</span>
                            </td>
                            <td style={{padding:"6px 10px",fontSize:11,color:T.textMid}}>{lastQc.completedBy||inst.qcClearedBy||inst.qcRejectedBy||"—"}</td>
                            <td style={{padding:"6px 10px",fontSize:11,fontFamily:T.fontMono,color:T.textLow,whiteSpace:"nowrap"}}>{(lastQc.completedAt||inst.qcClearedAt||inst.qcRejectedAt||"").slice(0,10)||"—"}</td>
                            <td style={{padding:"6px 10px",fontSize:11,color:T.textMid,maxWidth:200}}>{inst.qcRejectionReason||lastQc.remarks||"—"}</td>
                            <td style={{padding:"6px 10px"}}>
                              {canCorrect&&(
                                <button onClick={()=>{ setCorrForm({}); setCorrModal({inst,type:"menu"}); }}
                                  style={{...css.btn.ghost,fontSize:10,padding:"2px 8px"}}>⋯ Correct</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
            }
          </div>
        );
      })()}

      {tab==="rules"&&isAdmin&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700,color:T.text}}>Assignment Rules</div>
            <button onClick={()=>{setRuleForm({});setRuleModal("add");}} style={css.btn.primary}>+ Add Rule</button>
          </div>
          {qcRules.length===0&&<InfoBanner color="blue">No assignment rules set. QC jobs go to shared pool.</InfoBanner>}
          {qcRules.length>0&&(
            <table style={{width:"100%",borderCollapse:"collapse",background:T.bgCard,borderRadius:8,fontSize:12}}>
              <thead>
                <tr style={{background:T.bgInput}}>
                  {["Process Type","Assigned Engineer","Actions"].map(h=>(
                    <th key={h} style={{padding:"8px 10px",fontSize:10,color:T.textMid,fontWeight:700,textAlign:"left",borderBottom:`1px solid ${T.border}`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {qcRules.map(r=>{
                  const eng=engineers.find(u=>u.id===r.assignedEngineerId);
                  return (
                    <tr key={r.id} style={{borderBottom:`1px solid ${T.border}`}}>
                      <td style={{padding:"8px 10px",fontWeight:600}}>{r.processType}</td>
                      <td style={{padding:"8px 10px"}}>{eng?.name||r.assignedEngineerId}</td>
                      <td style={{padding:"8px 10px",display:"flex",gap:8}}>
                        <button onClick={()=>{setRuleForm({...r});setRuleModal("edit");}} style={{...css.btn.ghost,fontSize:11,padding:"2px 8px"}}>Edit</button>
                        <button onClick={()=>deleteRule(r.id)} style={{...css.btn.ghost,fontSize:11,padding:"2px 8px",color:T.red}}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab==="log"&&isAdmin&&(
        <div>
          <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:16}}>Override Log</div>
          {overrideLog.length===0&&<InfoBanner color="blue">No overrides recorded.</InfoBanner>}
          {overrideLog.length>0&&(
            <table style={{width:"100%",borderCollapse:"collapse",background:T.bgCard,borderRadius:8,fontSize:12}}>
              <thead>
                <tr style={{background:T.bgInput}}>
                  {["Mark No","Drawing","Overridden By","Assigned To","Date","Reason"].map(h=>(
                    <th key={h} style={{padding:"8px 10px",fontSize:10,color:T.textMid,fontWeight:700,textAlign:"left",borderBottom:`1px solid ${T.border}`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overrideLog.map((l,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                    <td style={{padding:"8px 10px",fontFamily:T.fontMono,color:T.accentHi}}>{l.markNo}</td>
                    <td style={{padding:"8px 10px",fontFamily:T.fontMono,fontSize:10,color:T.textMid}}>{l.drawingId}</td>
                    <td style={{padding:"8px 10px"}}>{l.overriddenBy}</td>
                    <td style={{padding:"8px 10px"}}>{engineers.find(u=>u.id===l.assignedTo)?.name||l.assignedTo}</td>
                    <td style={{padding:"8px 10px",color:T.textMid}}>{l.overriddenAt?.slice(0,10)}</td>
                    <td style={{padding:"8px 10px",color:T.textMid}}>{l.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Rule modal */}
      {ruleModal&&(
        <Modal title={ruleModal==="add"?"Add Assignment Rule":"Edit Assignment Rule"} onClose={()=>{setRuleModal(null);setRuleForm({});}}>
          <div style={{marginBottom:12}}>
            <label style={css.label}>Process Type *</label>
            <select value={ruleForm.processType||""} onChange={e=>setRuleForm(p=>({...p,processType:e.target.value}))} style={css.input}>
              <option value="">Select...</option>
              {QC_PROCESS_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{marginBottom:16}}>
            <label style={css.label}>Assign To *</label>
            <select value={ruleForm.assignedEngineerId||""} onChange={e=>setRuleForm(p=>({...p,assignedEngineerId:e.target.value}))} style={css.input}>
              <option value="">Select engineer...</option>
              {engineers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
            <button onClick={()=>{setRuleModal(null);setRuleForm({});}} style={css.btn.secondary}>Cancel</button>
            <button onClick={saveRule} disabled={!ruleForm.processType||!ruleForm.assignedEngineerId} style={{...css.btn.primary,opacity:(!ruleForm.processType||!ruleForm.assignedEngineerId)?0.4:1}}>Save Rule</button>
          </div>
        </Modal>
      )}

      {/* Override modal */}
      {overrideModal&&overrideInst&&(
        <Modal title={`Reassign — ${overrideInst.markNo}`} onClose={()=>{setOverrideModal(null);setOverrideInst(null);setOverrideReason("");}}>
          <div style={{marginBottom:12}}>
            <label style={css.label}>Assign To *</label>
            <select value={overrideEngineer} onChange={e=>setOverrideEngineer(e.target.value)} style={css.input}>
              <option value="">Select engineer...</option>
              {engineers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label style={css.label}>Reason *</label>
            <textarea value={overrideReason} onChange={e=>setOverrideReason(e.target.value)} rows={3} placeholder="State reason for reassignment..." style={{...css.input,resize:"vertical",width:"100%"}} />
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:16}}>
            <button onClick={()=>{setOverrideModal(null);setOverrideInst(null);setOverrideReason("");}} style={css.btn.secondary}>Cancel</button>
            <button onClick={doOverride} disabled={!overrideReason.trim()||!overrideEngineer} style={{...css.btn.primary,opacity:(!overrideReason.trim()||!overrideEngineer)?0.4:1}}>Reassign</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// RM UNIT GROUP ROW — collapsible row group for production dashboard
// ═══════════════════════════════════════════════════════════════════════════════
const RmUnitGroupRow = ({ rmUnitId, insts, T, css, STAGE_SEQ_LABELS }) => {
  const [open, setOpen] = React.useState(false);
  const statuses=insts.map(i=>i.currentStatus);
  const allDone=statuses.every(s=>s==="completed"||s==="outbound");
  const anyDefect=statuses.some(s=>s==="defective");
  const anyProgress=statuses.some(s=>s==="in_progress");
  const rollupColor=anyDefect?"red":allDone?"teal":anyProgress?"blue":"gray";
  const rollupLabel=anyDefect?"Has Defects":allDone?"Complete":anyProgress?"In Progress":"Pending";
  const TH2=({children,mono})=><th style={{padding:"5px 8px",fontSize:10,color:T.textMid,fontWeight:700,textAlign:"left",borderBottom:`1px solid ${T.border}`,fontFamily:mono?T.fontMono:undefined}}>{children}</th>;
  const TD2=({children,mono,bold})=><td style={{padding:"5px 8px",fontSize:11,borderBottom:`1px solid ${T.border}44`,fontFamily:mono?T.fontMono:undefined,fontWeight:bold?700:undefined}}>{children}</td>;
  return (
    <>
      <tr style={{background:open?T.accentLo+"22":"transparent",cursor:"pointer"}} onClick={()=>setOpen(p=>!p)}>
        <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,width:24}}><span style={{fontSize:11}}>{open?"▼":"▶"}</span></td>
        <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,fontFamily:T.fontMono,fontSize:11,color:T.accentHi,fontWeight:700}}>{rmUnitId||"— no RM unit —"}</td>
        <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,fontSize:11,color:T.textMid}}>{insts.length} part{insts.length!==1?"s":""}</td>
        <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,fontSize:11,color:T.textMid}}>{insts[0]?.orderId||"—"}</td>
        <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,fontSize:11,color:T.textMid}}>{insts[0]?.cuttingContractorName||"—"}</td>
        <td colSpan={4} style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`}}><Badge color={rollupColor}>{rollupLabel}</Badge></td>
      </tr>
      {open&&(
        <tr>
          <td colSpan={9} style={{padding:"0 0 0 32px",background:T.bg,borderBottom:`1px solid ${T.border}`}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead>
                <tr>
                  <TH2 mono>Instance ID</TH2>
                  <TH2 bold>Mark No</TH2>
                  <TH2 mono>Drawing</TH2>
                  <TH2>Stage</TH2>
                  <TH2>Status</TH2>
                  <TH2>Bay</TH2>
                  <TH2>Contractor</TH2>
                  <TH2>Pinned Eng.</TH2>
                </tr>
              </thead>
              <tbody>
                {insts.map((inst,i)=>(
                  <tr key={inst.instanceId} style={{background:i%2===0?"transparent":T.bg}}>
                    <TD2 mono>{inst.instanceId}</TD2>
                    <TD2 bold>{inst.markNo}</TD2>
                    <TD2 mono>{inst.drawingNo||"—"}</TD2>
                    <TD2><Badge color="blue">{STAGE_SEQ_LABELS[inst.currentStage]||inst.currentStage}</Badge></TD2>
                    <TD2><Badge color={inst.currentStatus==="pending_collection"?"green":inst.currentStatus==="in_progress"?"blue":inst.currentStatus==="pending_supervisor"?"amber":inst.currentStatus==="defective"?"red":inst.currentStatus==="completed"?"teal":inst.currentStatus==="outbound"?"gold":"gray"}>{inst.currentStatus?.replace(/_/g," ")}</Badge></TD2>
                    <TD2 mono>{inst.cuttingBayUsed||"—"}</TD2>
                    <TD2>{inst.assignedContractorName||<span style={{color:T.textLow,fontSize:10}}>Unassigned</span>}</TD2>
                    <TD2>{inst.pinnedEngineerName||<span style={{color:T.textLow,fontSize:10}}>—</span>}</TD2>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTION ENGINEER SCREEN — DPR view across all orders
// ═══════════════════════════════════════════════════════════════════════════════
const DPR_STAGE_META = {
  pending:    { label:"Pending",       color:T.textLow,  bg:"#F1F5F9" },
  fitup:      { label:"Fit-Up",        color:"#0E7490",  bg:"#CFFAFE" },
  fitup_qc:   { label:"Fit-Up QC",     color:"#D97706",  bg:"#FEF3C7" },
  tpi_fitup:  { label:"Fit-Up TPI",    color:"#D97706",  bg:"#FEF3C7" },
  welding:    { label:"Welding",       color:"#7C3AED",  bg:"#EDE9FE" },
  weld_qc:    { label:"Weld QC",       color:"#D97706",  bg:"#FEF3C7" },
  tpi_weld:   { label:"Weld TPI",      color:"#D97706",  bg:"#FEF3C7" },
  blasting:   { label:"Blasting",      color:"#B45309",  bg:"#FEF3C7" },
  blast_qc:   { label:"Blast QC",      color:"#D97706",  bg:"#FEF3C7" },
  tpi_blast:  { label:"Blast TPI",     color:"#D97706",  bg:"#FEF3C7" },
  painting:   { label:"Painting",      color:"#1D4ED8",  bg:"#DBEAFE" },
  paint_qc:   { label:"Paint QC",      color:"#D97706",  bg:"#FEF3C7" },
  tpi_paint:  { label:"Paint TPI",     color:"#D97706",  bg:"#FEF3C7" },
  mdcc:       { label:"MDCC Dossier",  color:"#6D28D9",  bg:"#EDE9FE" },
  complete:   { label:"Complete",      color:"#059669",  bg:"#D1FAE5" },
};
const DPR_STAGES_ORDER = ["pending","fitup","fitup_qc","tpi_fitup","welding","weld_qc","tpi_weld","blasting","blast_qc","tpi_blast","painting","paint_qc","tpi_paint","mdcc","complete"];

const ProductionEngineerScreen = ({ user, dprs, orders, instances, contractors, onBack }) => {
  const [filterOrder,  setFilterOrder]  = useState("all");
  const [filterStage,  setFilterStage]  = useState("all");
  const [filterContr,  setFilterContr]  = useState("all");
  const [search,       setSearch]       = useState("");
  const [selDpr,       setSelDpr]       = useState(null);
  const [sortCol,      setSortCol]      = useState("order");
  const [sortDir,      setSortDir]      = useState("asc");

  // Build enriched DPR rows
  const rows = (dprs || []).map(dpr => {
    const order   = (orders || []).find(o => o.id === dpr.orderId) || {};
    const drawing  = (order.drawings || []).find(d => d.id === dpr.drawingId) || {};
    // Parts readiness — use best stage per markNo across ALL instances (handles side-cut parts)
    const drgParts = (order.parts||[]).filter(p => p.drawingId === dpr.drawingId && p.fabType === "Fabricate");
    const totalParts = drgParts.length;
    const STAGE_ORD = ['complete','tpi_paint','paint_qc','painting','tpi_blast','blast_qc','blasting','tpi_weld','weld_qc','welding','tpi_fitup','fitup','fit_up','cutting_qc','cutting','pending'];
    const DONE_SET = new Set(["cutting_qc","fitup","fit_up","welding","weld_qc","tpi_fitup","tpi_weld","blasting","blast_qc","tpi_blast","painting","paint_qc","tpi_paint","mdcc","complete"]);
    const partMarkNos = new Set(drgParts.map(p => p.markNo));
    const bestStage = {};
    (instances||[]).filter(i => partMarkNos.has(i.markNo)).forEach(i => {
      const curr = bestStage[i.markNo];
      if (!curr || STAGE_ORD.indexOf(i.currentStage) < STAGE_ORD.indexOf(curr)) bestStage[i.markNo] = i.currentStage;
    });
    const cutCleared = Object.values(bestStage).filter(s => DONE_SET.has(s)).length;
    const pct = totalParts > 0 ? Math.round((cutCleared / totalParts) * 100) : 0;
    const stage = dpr.currentStage || "pending";
    const meta  = DPR_STAGE_META[stage] || DPR_STAGE_META.pending;
    const fitupCon  = (contractors || []).find(c => c.id === dpr.fitupContractorId);
    const weldCon   = (contractors || []).find(c => c.id === dpr.weldContractorId);
    // Age in days since release
    const ageDays = dpr.createdAt ? Math.floor((Date.now() - new Date(dpr.createdAt).getTime()) / 86400000) : null;
    return { dpr, order, drawing, totalParts, cutCleared, pct, stage, meta, fitupCon, weldCon, ageDays };
  });

  // Unique orders with DPRs
  const orderOpts = [...new Map(rows.map(r => [r.order.id, r.order])).values()].filter(o => o.id);
  const contrOpts  = [...new Map([
    ...rows.filter(r=>r.fitupCon).map(r=>[r.fitupCon.id, r.fitupCon]),
    ...rows.filter(r=>r.weldCon).map(r=>[r.weldCon.id,  r.weldCon]),
  ]).values()];

  // Filter + search
  const filtered = rows.filter(r => {
    if (filterOrder !== "all" && r.order.id !== filterOrder) return false;
    if (filterStage !== "all" && r.stage !== filterStage)   return false;
    if (filterContr !== "all" && r.dpr.fitupContractorId !== filterContr && r.dpr.weldContractorId !== filterContr) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.dpr.drawingNo?.toLowerCase().includes(q) &&
          !r.order.orderNo?.toLowerCase().includes(q)  &&
          !r.order.clientName?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let av, bv;
    if (sortCol === "order")   { av = a.order.orderNo||"";   bv = b.order.orderNo||""; }
    if (sortCol === "drawing") { av = a.dpr.drawingNo||"";   bv = b.dpr.drawingNo||""; }
    if (sortCol === "stage")   { av = DPR_STAGES_ORDER.indexOf(a.stage); bv = DPR_STAGES_ORDER.indexOf(b.stage); }
    if (sortCol === "pct")     { av = a.pct; bv = b.pct; }
    if (sortCol === "age")     { av = a.ageDays||0; bv = b.ageDays||0; }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ?  1 : -1;
    return 0;
  });

  const toggleSort = col => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };
  const SortHd = ({ col, children, right }) => {
    const active = sortCol === col;
    return (
      <th onClick={() => toggleSort(col)} style={{ padding:"8px 10px", textAlign:right?"right":"left", fontSize:10, fontWeight:700,
        color:active ? T.accent : T.textMid, textTransform:"uppercase", letterSpacing:"0.04em",
        borderBottom:`2px solid ${T.borderHi}`, background:T.bgInput, whiteSpace:"nowrap", cursor:"pointer", userSelect:"none" }}>
        {children}{active ? (sortDir==="asc"?" ↑":" ↓") : ""}
      </th>
    );
  };

  // Summary stats
  const byStage = {};
  DPR_STAGES_ORDER.forEach(s => byStage[s] = rows.filter(r => r.stage === s).length);
  const totalDprs = rows.length;

  // DPR Detail panel
  if (selDpr) {
    const r = rows.find(x => x.dpr.id === selDpr);
    if (!r) { setSelDpr(null); return null; }
    const { dpr, order, drawing, pct, totalParts, cutCleared, fitupCon, weldCon, ageDays } = r;
    const history = dpr.stageHistory || [];
    // Use all instances for this drawing's parts, best stage per markNo
    const drgParts = (order.parts||[]).filter(p => p.drawingId === dpr.drawingId && p.fabType === "Fabricate");
    const partMarkNos = new Set(drgParts.map(p => p.markNo));
    const STAGE_ORD2 = ['complete','welding','fitup','fit_up','blasting','painting','cutting_qc','cutting','pending'];
    const bestStageMap = {};
    (instances||[]).filter(i => partMarkNos.has(i.markNo)).forEach(i => {
      const curr = bestStageMap[i.markNo];
      if (!curr || STAGE_ORD2.indexOf(i.currentStage) < STAGE_ORD2.indexOf(curr)) bestStageMap[i.markNo] = i.currentStage;
    });
    const stageGroups = {};
    Object.entries(bestStageMap).forEach(([mn, stage]) => {
      if (!stageGroups[stage]) stageGroups[stage] = [];
      stageGroups[stage].push(mn);
    });
    return (
      <div>
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:20 }}>
          <button onClick={() => setSelDpr(null)} style={css.btn.ghost}>← Back to List</button>
          <div style={{ fontSize:18, fontWeight:800, color:T.text }}>Drawing Detail</div>
          <div style={{ flex:1 }} />
          <Badge color={r.stage === "complete" ? "green" : r.stage === "fitup_qc" || r.stage === "weld_qc" ? "amber" : "blue"}>
            {DPR_STAGE_META[r.stage]?.label || r.stage}
          </Badge>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
          {/* Left: identity */}
          <div style={css.card}>
            <div style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>Drawing Info</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[
                ["Order",    order.orderNo || dpr.orderId],
                ["Client",   order.clientName || "—"],
                ["Drawing",  dpr.drawingNo || dpr.drawingId],
                ["Assembly", drawing.assemblyGroup || "—"],
                ["Released", dpr.createdAt ? new Date(dpr.createdAt).toLocaleDateString("en-IN") : "—"],
                ["Age",      ageDays != null ? `${ageDays}d` : "—"],
              ].map(([l,v]) => (
                <div key={l}>
                  <div style={{ fontSize:10, color:T.textMid, fontWeight:700, textTransform:"uppercase" }}>{l}</div>
                  <div style={{ fontSize:13, color:T.text, fontWeight:500, fontFamily:l==="Drawing"?T.fontMono:T.font }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: contractor + readiness */}
          <div style={css.card}>
            <div style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>Assignment & Readiness</div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, color:T.textMid, fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>Parts Readiness</div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ flex:1, height:10, background:T.border, borderRadius:99, overflow:"hidden" }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:pct>=80?T.green:pct>=50?T.amber:T.red, borderRadius:99, transition:"width 0.3s" }} />
                </div>
                <span style={{ fontSize:13, fontWeight:800, color:pct>=80?T.green:pct>=50?T.amber:T.red, minWidth:40, textAlign:"right" }}>{pct}%</span>
              </div>
              <div style={{ fontSize:11, color:T.textLow, marginTop:4 }}>{cutCleared} of {totalParts} parts cut & cleared</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div style={{ background:T.bgInput, borderRadius:6, padding:"8px 10px" }}>
                <div style={{ fontSize:10, color:T.textMid, fontWeight:700, textTransform:"uppercase", marginBottom:3 }}>Fit-Up</div>
                <div style={{ fontSize:12, fontWeight:600, color:fitupCon ? T.text : T.textLow }}>{fitupCon?.name || "Not assigned"}</div>
                {fitupCon?.isInHouse && <div style={{ fontSize:10, color:T.accent }}>In-House</div>}
              </div>
              <div style={{ background:T.bgInput, borderRadius:6, padding:"8px 10px" }}>
                <div style={{ fontSize:10, color:T.textMid, fontWeight:700, textTransform:"uppercase", marginBottom:3 }}>Welding</div>
                <div style={{ fontSize:12, fontWeight:600, color:weldCon ? T.text : T.textLow }}>{weldCon?.name || "Not assigned"}</div>
                {weldCon?.isInHouse && <div style={{ fontSize:10, color:T.accent }}>In-House</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Stage Progress Bar */}
        <div style={{ ...css.card, marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:14 }}>DPR Stage Progress</div>
          <div style={{ display:"flex", gap:0, alignItems:"stretch" }}>
            {DPR_STAGES_ORDER.map((s, i) => {
              const stageIdx  = DPR_STAGES_ORDER.indexOf(r.stage);
              const thisIdx   = i;
              const done      = thisIdx < stageIdx;
              const current   = thisIdx === stageIdx;
              const meta      = DPR_STAGE_META[s];
              return (
                <React.Fragment key={s}>
                  <div style={{ flex:1, textAlign:"center", padding:"10px 6px", background:done?T.green:current?meta.bg:"transparent",
                    border:`1px solid ${done?T.green:current?meta.color:T.border}`, borderRadius:i===0?"6px 0 0 6px":i===DPR_STAGES_ORDER.length-1?"0 6px 6px 0":"0",
                    borderLeft:i>0?"none":undefined }}>
                    <div style={{ fontSize:11, fontWeight:700, color:done?"#fff":current?meta.color:T.textLow }}>{meta.label}</div>
                    {done && <div style={{ fontSize:10, color:"rgba(255,255,255,0.8)" }}>✓</div>}
                    {current && <div style={{ fontSize:10, color:meta.color }}>● Now</div>}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Part breakdown by stage */}
        <div style={{ ...css.card, marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>Parts by Stage (best stage per part)</div>
          {Object.entries(stageGroups).length === 0
            ? <div style={{ color:T.textLow, fontSize:12 }}>No instances yet for this drawing.</div>
            : Object.entries(stageGroups).map(([stage, markNosInStage]) => (
              <div key={stage} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
                <div style={{ width:120, fontSize:11, fontWeight:600, color:T.textMid }}>{stage.replace(/_/g," ").toUpperCase()}</div>
                <div style={{ flex:1, height:8, background:T.border, borderRadius:99, overflow:"hidden" }}>
                  <div style={{ width:`${(markNosInStage.length/(totalParts||1))*100}%`, height:"100%", background:T.accent, borderRadius:99 }} />
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:T.text, minWidth:40, textAlign:"right" }}>{markNosInStage.length}</div>
              </div>
            ))}
        </div>

        {/* Stage History */}
        {history.length > 0 && (
          <div style={css.card}>
            <div style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>Stage History</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {history.map((h, i) => (
                <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"8px 10px", background:T.bgInput, borderRadius:6 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:T.accent, marginTop:3, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <span style={{ fontSize:12, fontWeight:700, color:T.text }}>{(h.stage||"").replace(/_/g," ").toUpperCase()}</span>
                      <Badge color="gray">{h.action || "updated"}</Badge>
                    </div>
                    <div style={{ fontSize:11, color:T.textLow, marginTop:2 }}>
                      by {h.by || "—"} · {h.at ? new Date(h.at).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}) : "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:20 }}>
        <button onClick={onBack} style={css.btn.ghost}>← Production</button>
        <div style={{ fontSize:18, fontWeight:800, color:T.text }}>Production Engineer — DPR View</div>
        <div style={{ flex:1 }} />
        <div style={{ fontSize:12, color:T.textLow }}>{totalDprs} total DPRs across {orderOpts.length} order{orderOpts.length !== 1 ? "s" : ""}</div>
      </div>

      {/* Stage summary pills */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {DPR_STAGES_ORDER.map(s => {
          const meta = DPR_STAGE_META[s];
          const cnt  = byStage[s] || 0;
          const active = filterStage === s;
          return (
            <button key={s} onClick={() => setFilterStage(active ? "all" : s)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", border:`1px solid ${active ? meta.color : T.border}`,
                borderRadius:99, background:active ? meta.bg : "transparent", cursor:"pointer", fontFamily:T.font }}>
              <span style={{ fontSize:12, fontWeight:700, color:active ? meta.color : T.textMid }}>{meta.label}</span>
              <span style={{ fontSize:12, fontWeight:800, color:active ? meta.color : T.textLow }}>{cnt}</span>
            </button>
          );
        })}
        {filterStage !== "all" && (
          <button onClick={() => setFilterStage("all")} style={{ ...css.btn.ghost, fontSize:11 }}>✕ Clear</button>
        )}
      </div>

      {/* Filters row */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search drawing / order / client…"
          style={{ ...css.input, maxWidth:260 }} />
        <select value={filterOrder} onChange={e => setFilterOrder(e.target.value)} style={{ ...css.input, width:"auto" }}>
          <option value="all">All Orders</option>
          {orderOpts.map(o => <option key={o.id} value={o.id}>{o.orderNo} — {o.clientName}</option>)}
        </select>
        <select value={filterContr} onChange={e => setFilterContr(e.target.value)} style={{ ...css.input, width:"auto" }}>
          <option value="all">All Contractors</option>
          {contrOpts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div style={{ flex:1 }} />
        <div style={{ fontSize:11, color:T.textLow, alignSelf:"center" }}>{sorted.length} drawing{sorted.length !== 1 ? "s" : ""}</div>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div style={{ textAlign:"center", padding:64, color:T.textLow }}>
          <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
          <div style={{ fontSize:14, fontWeight:600, color:T.textMid }}>No DPRs match the current filters</div>
          {dprs.length === 0 && <div style={{ fontSize:12, marginTop:6 }}>DPRs are created when a production release is confirmed.</div>}
        </div>
      ) : (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr>
                <SortHd col="order">Order</SortHd>
                <SortHd col="drawing">Drawing</SortHd>
                <th style={{ padding:"8px 10px", fontSize:10, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:"0.04em", borderBottom:`2px solid ${T.borderHi}`, background:T.bgInput }}>Fit-Up By</th>
                <th style={{ padding:"8px 10px", fontSize:10, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:"0.04em", borderBottom:`2px solid ${T.borderHi}`, background:T.bgInput }}>Weld By</th>
                <SortHd col="stage">Stage</SortHd>
                <SortHd col="pct" right>Parts Ready</SortHd>
                <SortHd col="age" right>Age</SortHd>
                <th style={{ padding:"8px 10px", fontSize:10, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:"0.04em", borderBottom:`2px solid ${T.borderHi}`, background:T.bgInput }}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(({ dpr, order, drawing, pct, totalParts, cutCleared, stage, meta, fitupCon, weldCon, ageDays }, i) => (
                <tr key={dpr.id} style={{ background:i%2===0?"transparent":T.bgInput }}
                  onMouseEnter={e => e.currentTarget.style.background=T.bgHover}
                  onMouseLeave={e => e.currentTarget.style.background=i%2===0?"transparent":T.bgInput}>
                  <TD mono>{order.orderNo || dpr.orderId}</TD>
                  <TD mono>{dpr.drawingNo || dpr.drawingId}</TD>
                  <TD>{fitupCon ? <span>{fitupCon.name}{fitupCon.isInHouse?" 🏭":""}</span> : <span style={{color:T.textLow}}>—</span>}</TD>
                  <TD>{weldCon  ? <span>{weldCon.name}{weldCon.isInHouse?" 🏭":""}</span>  : <span style={{color:T.textLow}}>—</span>}</TD>
                  <TD>
                    <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:99, fontSize:11, fontWeight:700,
                      background:meta.bg, color:meta.color }}>{meta.label}</span>
                  </TD>
                  <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, textAlign:"right" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"flex-end" }}>
                      <div style={{ width:60, height:6, background:T.border, borderRadius:99, overflow:"hidden" }}>
                        <div style={{ width:`${pct}%`, height:"100%", background:pct>=80?T.green:pct>=50?T.amber:T.red, borderRadius:99 }} />
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color:pct>=80?T.green:pct>=50?T.amber:T.red, minWidth:32, textAlign:"right" }}>{pct}%</span>
                    </div>
                  </td>
                  <TD right color={ageDays!=null&&ageDays>14?T.amber:T.textLow}>{ageDays!=null?`${ageDays}d`:"—"}</TD>
                  <td style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}` }}>
                    <button onClick={() => setSelDpr(dpr.id)} style={css.btn.ghost}>Detail →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// BLAST & PAINT CONTRACTOR QUEUE
// ═══════════════════════════════════════════════════════════════════════════════
const BlastPaintContractorQueue = ({ user, dprs, setDprs, orders, instances, setInstances, correctionsLog, setCorrectionsLog }) => {
  const [tab, setTab] = useState("blasting");
  const cid = user.contractorId;

  const myDprs = (dprs||[]).filter(d =>
    d.blastContractorId === cid || d.paintContractorId === cid
  );

  const updDpr = (id, patch) => setDprs(prev => prev.map(d => d.id===id ? {...d,...patch} : d));

  const [bpCorrModal, setBpCorrModal] = useState(null);
  const [bpCorrForm,  setBpCorrForm]  = useState({});

  // ── Blast & Paint Correction Handlers ──────────────────────────────────

  const doEditDft = (dpr, coatIdx, newDft, reason) => {
    if (!reason?.trim()) return showToast("Reason required","amber");
    if (!newDft) return showToast("Enter new DFT reading","amber");
    const coats = [...(dpr.coats||[])];
    const oldDft = coats[coatIdx]?.dftReading||"—";
    coats[coatIdx] = {...coats[coatIdx], dftReading:newDft,
      dftEditHistory:[...(coats[coatIdx]?.dftEditHistory||[]),
        {from:oldDft, to:newDft, by:user.name, date:today(), reason}]};
    setDprs(prev=>prev.map(d=>d.id!==dpr.id?d:{
      ...d, coats,
      auditLog:[...(d.auditLog||[]),{action:"dft-edited",by:user.name,date:today(),
        reason:`Coat ${coatIdx+1} DFT: ${oldDft}→${newDft} — ${reason}`}]
    }));
    if(setCorrectionsLog) setCorrectionsLog(prev=>[...prev, createCorrectionEntry({
      action:"edit-dft-reading", entityId:dpr.id, entityType:"dpr",
      fromValue:{coat:coatIdx+1,dft:oldDft}, toValue:{coat:coatIdx+1,dft:newDft}, reason, triggeredBy:user
    })]);
    showToast("DFT reading updated"); setBpCorrModal(null);
  };

  const doEditCoatRecord = (dpr, coatIdx, patch, reason) => {
    if (!reason?.trim()) return showToast("Reason required","amber");
    const coats = [...(dpr.coats||[])];
    const oldCoat = {...coats[coatIdx]};
    coats[coatIdx] = {...oldCoat, ...patch,
      editHistory:[...(oldCoat.editHistory||[]),{from:oldCoat, to:patch, by:user.name, date:today(), reason}]};
    setDprs(prev=>prev.map(d=>d.id!==dpr.id?d:{
      ...d, coats,
      auditLog:[...(d.auditLog||[]),{action:"coat-record-edited",by:user.name,date:today(),reason}]
    }));
    if(setCorrectionsLog) setCorrectionsLog(prev=>[...prev, createCorrectionEntry({
      action:"edit-coat-record", entityId:dpr.id, entityType:"dpr",
      fromValue:oldCoat, toValue:patch, reason, triggeredBy:user
    })]);
    showToast("Coat record updated"); setBpCorrModal(null);
  };

  const doRevertBlastOrPaint = (dpr, stage, reason) => {
    if (!reason?.trim()) return showToast("Reason required","amber");
    const STAGE_ORDER = ["blasting","blast_qc","painting","painting_qc","mdcc"];
    const stageIdx = STAGE_ORDER.indexOf(dpr.currentStage);
    const targetIdx = STAGE_ORDER.indexOf(stage);
    if (stageIdx > targetIdx + 1) return showToast(`Cannot revert — ${STAGE_ORDER[stageIdx]} is further ahead. Use NCR route.`,"amber");
    setDprs(prev=>prev.map(d=>d.id!==dpr.id?d:{
      ...d, currentStage:stage, currentStatus:"in_progress",
      auditLog:[...(d.auditLog||[]),{action:`stage-reverted-to-${stage}`,by:user.name,date:today(),reason}]
    }));
    if(setCorrectionsLog) setCorrectionsLog(prev=>[...prev, createCorrectionEntry({
      action:`revert-to-${stage}`, entityId:dpr.id, entityType:"dpr",
      fromValue:{stage:dpr.currentStage}, toValue:{stage}, reason, triggeredBy:user
    })]);
    showToast(`Reverted to ${stage}`); setBpCorrModal(null);
  };

  // Blast & Paint Corrections Modal
  const BpCorrModal = () => {
    if (!bpCorrModal) return null;
    const { dpr, type } = bpCorrModal;

    if (type==="edit_dft") {
      const coats = dpr?.coats||[];
      return (
        <Modal title={`Edit DFT Reading — ${dpr?.drawingNo}`} onClose={()=>setBpCorrModal(null)} width={480}>
          <div style={{marginBottom:12}}>
            {coats.length===0&&<div style={{color:T.textMid,fontSize:12}}>No coat records found for this drawing.</div>}
            {coats.map((coat,i)=>(
              <div key={i} style={{padding:"8px 12px",background:T.bg,borderRadius:6,marginBottom:8,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:11,fontWeight:700,color:T.textMid,marginBottom:4}}>Coat {i+1} — {coat.productName||"—"} · {coat.coatDate||"—"}</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:11,color:T.textMid}}>Current DFT: <span style={{fontFamily:T.fontMono,color:T.text}}>{coat.dftReading||"—"} µm</span></span>
                  {can(user,"bp.edit_dft")&&(
                    <button onClick={()=>setBpCorrForm(f=>({...f,editCoatIdx:i,newDft:coat.dftReading||""}))}
                      style={{...css.btn.sm,fontSize:10}}>Edit</button>
                  )}
                </div>
                {bpCorrForm.editCoatIdx===i&&(
                  <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:6}}>
                    <Input type="number" value={bpCorrForm.newDft||""} onChange={e=>setBpCorrForm(f=>({...f,newDft:e.target.value}))}
                      placeholder="New DFT in µm" />
                    <Input value={bpCorrForm.reason||""} onChange={e=>setBpCorrForm(f=>({...f,reason:e.target.value}))}
                      placeholder="Reason for correction (mandatory)" />
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>doEditDft(dpr,i,bpCorrForm.newDft,bpCorrForm.reason)} style={{...css.btn.primary,fontSize:11}}>Save</button>
                      <button onClick={()=>setBpCorrForm(f=>({...f,editCoatIdx:null}))} style={{...css.btn.ghost,fontSize:11}}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <button onClick={()=>setBpCorrModal(null)} style={css.btn.secondary}>Close</button>
          </div>
        </Modal>
      );
    }

    if (type==="revert_stage") return (
      <Modal title={`Revert Stage — ${dpr?.drawingNo}`} onClose={()=>setBpCorrModal(null)} width={460}>
        <div style={{marginBottom:12,fontSize:11,color:T.textMid}}>
          Current stage: <Badge color="blue">{dpr?.currentStage}</Badge>
        </div>
        <Field label="Revert to stage">
          <Sel value={bpCorrForm.targetStage||""} onChange={e=>setBpCorrForm(f=>({...f,targetStage:e.target.value}))}>
            <option value="">Select...</option>
            {["blasting","blast_qc","painting","painting_qc"].filter(s=>s!==dpr?.currentStage).map(s=>(
              <option key={s} value={s}>{s.replace("_"," ")}</option>
            ))}
          </Sel>
        </Field>
        <Field label="Reason (mandatory)" style={{marginTop:10}}>
          <textarea value={bpCorrForm.reason||""} onChange={e=>setBpCorrForm(f=>({...f,reason:e.target.value}))}
            rows={3} style={{...css.input,width:"100%",resize:"vertical"}} placeholder="e.g. Blast QC failed — sending back to blasting" />
        </Field>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12}}>
          <button onClick={()=>setBpCorrModal(null)} style={css.btn.secondary}>Cancel</button>
          <button onClick={()=>doRevertBlastOrPaint(dpr,bpCorrForm.targetStage,bpCorrForm.reason)}
            disabled={!bpCorrForm.targetStage||!bpCorrForm.reason?.trim()}
            style={{...css.btn.primary,background:T.amber,opacity:(!bpCorrForm.targetStage||!bpCorrForm.reason?.trim())?0.4:1}}>
            Revert Stage
          </button>
        </div>
      </Modal>
    );

    return null;
  };

  const advInstances = (dpr, toStage) => {
    setInstances(prev => prev.map(i => {
      if (i.drawingId !== dpr.drawingId || i.orderId !== dpr.orderId || i.isSideCut) return i;
      return { ...i, currentStage: toStage, currentStatus: toStage==="complete"?"complete":"in_progress",
        stageHistory:[...(i.stageHistory||[]),{stage:i.currentStage,completedAt:new Date().toISOString(),completedBy:user.username}] };
    }));
  };

  // Primer window urgency
  const getPrimerStatus = (dpr, order) => {
    if (!dpr.blastCompleteAt) return null;
    const windowHrs = order?.quality?.primerWindowHrs ?? 4;
    const elapsedMs = Date.now() - new Date(dpr.blastCompleteAt).getTime();
    const elapsedHrs = elapsedMs / 3600000;
    const remainingHrs = windowHrs - elapsedHrs;
    if (remainingHrs > 0) return { ok:true, remainingHrs, pct: Math.max(0,(remainingHrs/windowHrs)*100) };
    return { ok:false, expiredHrs: -remainingHrs };
  };

  // ── Tab 1: Blasting ─────────────────────────────────────────────────────────
  const blastAssigned   = myDprs.filter(d => d.blastContractorId===cid && d.currentStage==="blasting");
  const blastAwaitingQc = myDprs.filter(d => d.blastContractorId===cid && d.currentStage==="blast_qc");
  // ── Tab 2: Painting ─────────────────────────────────────────────────────────
  const paintActive  = myDprs.filter(d => d.paintContractorId===cid && d.currentStage==="painting");
  const paintAwaitQc = myDprs.filter(d => d.paintContractorId===cid && d.currentStage==="paint_qc");
  const paintTpiPending = myDprs.filter(d => d.paintContractorId===cid && d.currentStage==="tpi_paint");
  // ── Tab 3: Complete ─────────────────────────────────────────────────────────
  const done = myDprs.filter(d => d.currentStage==="complete" &&
    (d.blastContractorId===cid || d.paintContractorId===cid));

  const SL = ({ title, count, color, sub }) => (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, marginTop:20 }}>
      <div style={{ fontSize:11, fontWeight:800, color:color||T.textMid, letterSpacing:"0.08em" }}>{title}</div>
      {count>0&&<div style={{ background:color||T.textMid, color:"#fff", fontSize:10, fontWeight:800, borderRadius:8, padding:"1px 6px" }}>{count}</div>}
      {sub&&<div style={{ fontSize:11, color:T.textLow }}>{sub}</div>}
    </div>
  );

  const getOrder = dpr => (orders||[]).find(o=>o.id===dpr.orderId)||{};
  const getPaintSpec = (dpr) => {
    const order = getOrder(dpr);
    const drawing = (order.drawings||[]).find(d=>d.id===dpr.drawingId)||{};
    const specs = order.quality?.paintSpecs || (order.quality?.paintCoats?.length ? [{specLabel:"A",coats:order.quality.paintCoats}] : []);
    const specId = drawing.paintSpecId || (specs[0]?.specLabel) || "A";
    return specs.find(s=>s.specLabel===specId) || specs[0] || null;
  };

  // ── Blast card ──────────────────────────────────────────────────────────────
  const BlastCard = ({ dpr, mode }) => {
    const order = getOrder(dpr);
    const [confirming, setConfirming] = useState(false);
    const [note, setNote] = useState("");

    const doBlastComplete = () => {
      const ts = new Date().toISOString();
      updDpr(dpr.id, {
        currentStage: "blast_qc", currentStatus: "pending_qc",
        blastCompleteAt: ts, blastCompleteBy: user.username,
        blastNote: note,
        stageHistory: [...(dpr.stageHistory||[]), { stage:"blasting", action:"completed", by:user.username, at:ts, note }]
      });
      advInstances(dpr, "blasting");
      setConfirming(false);
    };

    return (
      <div style={{ ...css.card, marginBottom:10, borderLeft:`3px solid ${mode==="active"?T.amber:T.green}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
          <div>
            <div style={{ fontFamily:T.fontMono, fontWeight:700, color:T.accent, fontSize:13 }}>{dpr.drawingNo}</div>
            <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>{order.orderNo} · {order.clientName}</div>
            <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>
              Standard: <strong style={{color:T.text}}>{order.quality?.blastingStandard||"Sa 2.5"}</strong>
              {order.quality?.blastingProfile&&<span> · Profile: <strong style={{color:T.text}}>{order.quality.blastingProfile} Rz</strong></span>}
            </div>
          </div>
          <Badge color={mode==="active"?"amber":"green"}>
            {mode==="active"?"Blasting":"Awaiting Blast QC"}
          </Badge>
        </div>
        {mode==="active" && !confirming && (
          <button onClick={()=>setConfirming(true)} style={{ ...css.btn.primary, width:"100%", padding:"10px 0", fontSize:13 }}>
            ✓ Mark Blasting Complete
          </button>
        )}
        {mode==="active" && confirming && (
          <div style={{ padding:12, background:T.bgInput, borderRadius:6 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.textMid, marginBottom:8 }}>Confirm Blast Complete</div>
            <label style={css.label}>Notes (optional)</label>
            <input value={note} onChange={e=>setNote(e.target.value)}
              placeholder="e.g. Profile achieved Sa 2.5, ambient conditions ok"
              style={{ ...css.input, marginBottom:10 }} />
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={doBlastComplete} style={{ ...css.btn.green, flex:1 }}>Confirm Complete</button>
              <button onClick={()=>setConfirming(false)} style={css.btn.ghost}>Cancel</button>
            </div>
          </div>
        )}
        {mode==="awaiting_qc" && (
          <div style={{ padding:"8px 12px", background:T.amberBg, border:`1px solid ${T.amber}44`, borderRadius:6, fontSize:11, color:T.amber, fontWeight:700 }}>
            ⏳ Awaiting Blast QC Sign-Off · Completed {dpr.blastCompleteAt ? new Date(dpr.blastCompleteAt).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}) : "—"}
          </div>
        )}
      </div>
    );
  };

  // ── Paint card ──────────────────────────────────────────────────────────────
  const PaintCard = ({ dpr, mode }) => {
    const order   = getOrder(dpr);
    const spec    = getPaintSpec(dpr);
    const coats   = spec?.coats || [];
    const applied = dpr.paintCoats || [];
    const primerStatus = getPrimerStatus(dpr, order);
    const [confirming, setConfirming] = useState(false);
    const [note, setNote] = useState("");

    // Dry time check for previous coat
    const lastApplied = applied[applied.length - 1];
    const dryTimeOk = (() => {
      if (!lastApplied?.appliedAt || !lastApplied?.dryTime) return true;
      const elapsed = (Date.now() - new Date(lastApplied.appliedAt).getTime()) / 3600000;
      return elapsed >= lastApplied.dryTime;
    })();
    const dryTimeRemaining = (() => {
      if (!lastApplied?.appliedAt || !lastApplied?.dryTime || dryTimeOk) return 0;
      const elapsed = (Date.now() - new Date(lastApplied.appliedAt).getTime()) / 3600000;
      return Math.max(0, lastApplied.dryTime - elapsed);
    })();

    // QC lock — previous coat must be QC approved (if requiresQc) before next coat
    const lastAppliedQcOk = (() => {
      if (!lastApplied) return true; // no previous coat
      if (lastApplied.requiresQc===false) return true; // QC not needed
      return lastApplied.qcStatus === "approved";
    })();
    const nextCoatIdx = applied.length;
    const nextCoat    = coats[nextCoatIdx] || null;

    const doCoatComplete = () => {
      const ts = new Date().toISOString();
      const newCoat = {
        coatNo: nextCoatIdx + 1,
        type: nextCoat?.type || "Coat",
        dft: nextCoat?.dft || 0,
        dryTime: nextCoat?.dryTime || 0,
        appliedAt: ts,
        appliedBy: user.username,
        note,
        primerWindowOk: nextCoatIdx === 0 ? (primerStatus?.ok ?? true) : true,
        dryTimeOverride: nextCoatIdx > 0 && !dryTimeOk,
      };
      const updCoats = [...applied, newCoat];
      const allCoatsDone = updCoats.length >= coats.length;
      updDpr(dpr.id, {
        paintCoats: updCoats,
        currentStage: allCoatsDone ? "paint_qc" : "painting",
        currentStatus: allCoatsDone ? "pending_qc" : "in_progress",
        stageHistory: [...(dpr.stageHistory||[]), {
          stage:"painting", action:`coat_${nextCoatIdx+1}_complete`,
          by:user.username, at:ts, coatType:nextCoat?.type, note
        }]
      });
      if (allCoatsDone) advInstances(dpr, "painting");
      setConfirming(false); setNote("");
    };

    return (
      <div style={{ ...css.card, marginBottom:10,
        borderLeft:`3px solid ${primerStatus&&!primerStatus.ok?T.red:primerStatus?.ok?T.amber:T.accent}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
          <div>
            <div style={{ fontFamily:T.fontMono, fontWeight:700, color:T.accent, fontSize:13 }}>{dpr.drawingNo}</div>
            <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>{order.orderNo} · Spec {spec?.specLabel||"A"}</div>
          </div>
          <Badge color={mode==="awaiting_qc"?"amber":"blue"}>
            {mode==="awaiting_qc" ? "Awaiting Paint QC" : `${applied.length}/${coats.length} coats done`}
          </Badge>
        </div>

        {/* Primer window alert */}
        {primerStatus && applied.length === 0 && (
          <div style={{ marginBottom:10, padding:"8px 12px", borderRadius:6,
            background: primerStatus.ok ? T.amberBg : T.redBg,
            border:`1px solid ${primerStatus.ok ? T.amber : T.red}44` }}>
            {primerStatus.ok
              ? <span style={{color:T.amber,fontWeight:700}}>⚡ PRIMER WINDOW — {primerStatus.remainingHrs.toFixed(1)}h remaining</span>
              : <span style={{color:T.red,fontWeight:700}}>⚠ PRIMER WINDOW EXPIRED — {primerStatus.expiredHrs.toFixed(1)}h ago. Apply primer and flag for QC.</span>
            }
          </div>
        )}

        {/* Coat progress */}
        <div style={{ display:"flex", gap:4, marginBottom:10 }}>
          {coats.map((coat, ci) => {
            const done = ci < applied.length;
            const current = ci === applied.length;
            return (
              <div key={ci} style={{ flex:1, padding:"6px 8px", textAlign:"center", borderRadius:4,
                background: done?T.greenBg:current?T.bgInput:"transparent",
                border:`1px solid ${done?T.green:current?T.accent:T.border}` }}>
                <div style={{ fontSize:10, fontWeight:700, color:done?T.green:current?T.accent:T.textLow }}>
                  {coat.type}
                </div>
                <div style={{ fontSize:9, color:T.textLow }}>{coat.dft} μm DFT</div>
                {done && (() => {
                  const ac = applied[ci];
                  if (coat.requiresQc===false) return <div style={{fontSize:9,color:T.green}}>✓ Done</div>;
                  if (ac?.qcStatus==="approved") return <div style={{fontSize:9,color:T.green}}>✓ QC ✓</div>;
                  if (ac?.qcStatus==="rejected") return <div style={{fontSize:9,color:T.red}}>✕ Rejected</div>;
                  return <div style={{fontSize:9,color:T.amber}}>⏳ QC Pending</div>;
                })()}
                {current && !done && <div style={{ fontSize:9, color:T.accent }}>Next</div>}
              </div>
            );
          })}
        </div>

        {/* Dry time warning */}
        {!dryTimeOk && nextCoat && (
          <div style={{ marginBottom:8, padding:"6px 10px", background:T.amberBg,
            border:`1px solid ${T.amber}44`, borderRadius:4, fontSize:11, color:T.amber }}>
            ⚠ Dry time: {dryTimeRemaining.toFixed(1)}h remaining before {nextCoat.type}
          </div>
        )}

        {/* QC lock warning */}
        {mode==="active" && nextCoat && !lastAppliedQcOk && (
          <div style={{ marginBottom:8, padding:"8px 12px", background:T.amberBg,
            border:`1px solid ${T.amber}44`, borderRadius:4, fontSize:11, color:T.amber, fontWeight:700 }}>
            🔒 Awaiting QC approval for {lastApplied?.type} before {nextCoat.type} can be applied
          </div>
        )}
        {/* Action */}
        {mode==="active" && nextCoat && !confirming && lastAppliedQcOk && (
          <button onClick={()=>setConfirming(true)}
            style={{ ...css.btn.primary, width:"100%", padding:"10px 0", fontSize:13 }}>
            ✓ Mark {nextCoat.type} Complete
          </button>
        )}
        {mode==="active" && nextCoat && confirming && (
          <div style={{ padding:12, background:T.bgInput, borderRadius:6 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.textMid, marginBottom:8 }}>
              Confirm {nextCoat.type} Applied
              {!dryTimeOk && <span style={{color:T.amber, marginLeft:8}}>⚠ Dry time not elapsed</span>}
            </div>
            <label style={css.label}>Notes (optional)</label>
            <input value={note} onChange={e=>setNote(e.target.value)}
              placeholder="e.g. DFT readings, ambient conditions, batch no." style={{ ...css.input, marginBottom:10 }} />
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={doCoatComplete} style={{ ...css.btn.green, flex:1 }}>Confirm</button>
              <button onClick={()=>{setConfirming(false);setNote("");}} style={css.btn.ghost}>Cancel</button>
            </div>
          </div>
        )}
        {mode==="awaiting_qc" && (
          <div style={{ padding:"8px 12px", background:T.amberBg, border:`1px solid ${T.amber}44`,
            borderRadius:6, fontSize:11, color:T.amber, fontWeight:700 }}>
            ⏳ All {coats.length} coat{coats.length!==1?"s":""} applied — Awaiting Paint QC Sign-Off
          </div>
        )}
      </div>
    );
  };

  const TABS = [
    { id:"blasting", label:"Blasting", count:blastAssigned.length+blastAwaitingQc.length, alert:T.amber },
    { id:"painting", label:"Painting", count:paintActive.length+paintAwaitQc.length+paintTpiPending.length, alert:T.accent },
    { id:"complete", label:"Complete",  count:done.length, alert:T.green },
  ];

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <BpCorrModal />
        <div style={{ fontSize:18, fontWeight:800, color:T.text }}>My Blast & Paint Jobs</div>
        <div style={{ fontSize:12, color:T.textMid }}>{user.name} · {myDprs.length} drawing{myDprs.length!==1?"s":""}</div>
      </div>

      {myDprs.length === 0 ? (
        <InfoBanner color="blue">No blast/paint jobs assigned yet. Assignments are made by the production team once welding is complete and QC cleared.</InfoBanner>
      ) : (
        <>
          <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${T.border}`, marginBottom:20 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                padding:"10px 18px", fontSize:13, fontWeight:tab===t.id?700:400,
                color:tab===t.id?T.accent:T.textMid, background:"transparent", border:"none",
                borderBottom:tab===t.id?`2px solid ${T.accent}`:"2px solid transparent",
                cursor:"pointer", display:"flex", alignItems:"center", gap:7 }}>
                {t.label}
                {t.count>0&&<span style={{ background:tab===t.id?T.accent:t.alert, color:"#fff",
                  borderRadius:10, fontSize:11, fontWeight:800, padding:"1px 7px" }}>{t.count}</span>}
              </button>
            ))}
          </div>

          {tab==="blasting"&&(
            <div>
              {blastAssigned.length===0&&blastAwaitingQc.length===0&&(
                <div style={{textAlign:"center",padding:48,color:T.textLow}}>
                  <div style={{fontSize:32,marginBottom:10}}>🔧</div>No blasting jobs assigned
                </div>
              )}
              {blastAssigned.length>0&&<>
                <SL title="IN BLASTING" count={blastAssigned.length} color={T.amber} />
                {blastAssigned.map(d=><BlastCard key={d.id} dpr={d} mode="active" />)}
              </>}
              {blastAwaitingQc.length>0&&<>
                <SL title="AWAITING BLAST QC" count={blastAwaitingQc.length} color={T.textMid} />
                {blastAwaitingQc.map(d=><BlastCard key={d.id} dpr={d} mode="awaiting_qc" />)}
              </>}
            </div>
          )}

          {tab==="painting"&&(
            <div>
              {paintActive.length===0&&paintAwaitQc.length===0&&(
                <div style={{textAlign:"center",padding:48,color:T.textLow}}>
                  <div style={{fontSize:32,marginBottom:10}}>🎨</div>No painting jobs assigned yet
                </div>
              )}
              {paintActive.length>0&&<>
                <SL title="IN PAINTING" count={paintActive.length} color={T.accent} />
                {paintActive.map(d=><PaintCard key={d.id} dpr={d} mode="active" />)}
              </>}
              {paintAwaitQc.length>0&&<>
                <SL title="AWAITING PAINT QC" count={paintAwaitQc.length} color={T.textMid} />
                {paintAwaitQc.map(d=><PaintCard key={d.id} dpr={d} mode="awaiting_qc" />)}
              </>}
              {paintTpiPending.length>0&&<>
                <SL title="AWAITING TPI CLEARANCE" count={paintTpiPending.length} color={T.amber} sub="— TPI agency to inspect" />
                {paintTpiPending.map(d=>{
                  const o=(orders||[]).find(x=>x.id===d.orderId)||{};
                  return (
                    <div key={d.id} style={{...css.card,marginBottom:8,borderLeft:`3px solid ${T.amber}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontFamily:T.fontMono,fontWeight:700,color:T.accent}}>{d.drawingNo}</div>
                          <div style={{fontSize:11,color:T.textMid}}>{o.orderNo} · All coats applied and QC cleared</div>
                        </div>
                        <Badge color="amber">Paint TPI Pending</Badge>
                      </div>
                    </div>
                  );
                })}
              </>}
            </div>
          )}

          {tab==="complete"&&(
            <div>
              {done.length===0&&(
                <div style={{textAlign:"center",padding:48,color:T.textLow}}>No completed jobs yet</div>
              )}
              {done.map(d=>{
                const order=getOrder(d);
                return (
                  <div key={d.id} style={{ ...css.card, marginBottom:8, borderLeft:`3px solid ${T.green}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontFamily:T.fontMono, fontWeight:700, color:T.accent }}>{d.drawingNo}</div>
                        <div style={{ fontSize:11, color:T.textMid }}>{order.orderNo} · {order.clientName}</div>
                      </div>
                      <Badge color="green">Complete ✓</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTION MODULE
// ═══════════════════════════════════════════════════════════════════════════════
// ─── PLAN PRODUCTION — PRE-NESTING MATERIAL FEASIBILITY ─────────────────────
// Read-only analysis layer: checks which drawings/instances can be produced with
// currently approved stock. Estimate only — real nesting confirms. Touches nothing
// in MRP/PR/PO/GRN. Next build steps: nesting handoff + confirm/supersede chain.
const PLAN_PLATE_SET = new Set(["PLATE","PLATES","PL","FLAT PLATE","CHECKER PLATE"]);
const planIsPlate = (section) => PLAN_PLATE_SET.has((section||"").toUpperCase().trim());

const PlanProductionScreen = ({ user, orders, drawingInstances, stock, nestingBatches, purchaseReqs, productionStandards, onBack }) => {
  const [selOrderIds, setSelOrderIds] = useState([]);
  const [selInstIds, setSelInstIds]   = useState({});   // {diId:true}
  const [expanded, setExpanded]       = useState({});   // {drawingId:true}
  const [showBlocked, setShowBlocked] = useState(true);

  const cutCap = productionStandards?.cuttingCapacity || { plateTPD:0, sectionTPD:0 };

  const toggleOrder = (oid) => setSelOrderIds(prev => prev.includes(oid) ? prev.filter(x=>x!==oid) : [...prev, oid]);

  // ── Build per-order approved stock pool ──
  // Approved-makes filter: order.quality.approvedMakes[].makes (comma-sep string)
  // matched against lot.vendorName / vendorCode. No approvedMakes defined → all pass.
  const buildPool = (order) => {
    const makeTokens = (order.quality?.approvedMakes||[])
      .flatMap(m => (m.makes||"").split(",").map(s=>s.trim().toLowerCase()).filter(Boolean));
    const pool = {};   // normMatCode → {approvedWt, totalWt, lots:[]}
    (stock||[]).forEach(lot => {
      // A lot reserved for THIS order is available to this order's plan; only
      // weight reserved for OTHER orders is off-limits. (Auto-reservation at GRN
      // sets fresh lots to "reserved" for their source order — that material
      // exists precisely for these drawings.)
      if (!["available","partially_reserved","reserved"].includes(lot.status)) return;
      if (lot.rmQcStatus !== "approved") return;
      const key = normMatCode(lot.matCode);
      if (!key) return;
      if (!pool[key]) pool[key] = { approvedWt:0, totalWt:0, lots:[] };
      const resTotal = (lot.reservations||[]).reduce((a,r)=>a+(r.kg||0),0);
      const resMine  = (lot.reservations||[]).filter(r=>r.orderId===order.id).reduce((a,r)=>a+(r.kg||0),0);
      const free = Math.max(0, (lot.wtAvailable||0) - resTotal);
      const avail = Math.min(lot.wtAvailable||0, free + resMine);
      if (avail <= 0) return;
      pool[key].totalWt += avail;
      const vn = (lot.vendorName||"").toLowerCase(), vc = (lot.vendorCode||"").toLowerCase();
      // Trader-supplied material: the MILL is what approved-makes means. Match
      // explicit millMake if captured, else the heat number (mill prefixes like
      // "JSW25-..." live there), else fall back to vendor name/code.
      const mm = (lot.millMake||"").toLowerCase(), hn = (lot.heatNo||"").toLowerCase();
      const makeOk = makeTokens.length===0 || makeTokens.some(t =>
        (mm&&(mm.includes(t)||t.includes(mm))) || (hn&&hn.includes(t)) ||
        (vn&&(vn.includes(t)||t.includes(vn))) || (vc&&(vc.includes(t)||t.includes(vc))));
      if (makeOk) { pool[key].approvedWt += avail; pool[key].lots.push(lot.id); }
    });
    return pool;
  };

  // ── Per-drawing analysis for one order ──
  const analyseOrder = (order) => {
    const pool = buildPool(order);
    const unreleasedByDrawing = {};
    (drawingInstances||[]).forEach(di => {
      if (di.status !== "unreleased") return;
      const d = (order.drawings||[]).find(x=>x.id===di.drawingId);
      if (!d) return;
      (unreleasedByDrawing[di.drawingId] = unreleasedByDrawing[di.drawingId]||[]).push(di);
    });

    const rows = Object.entries(unreleasedByDrawing).map(([drawingId, dis]) => {
      const drawing = order.drawings.find(d=>d.id===drawingId);
      const parts = (order.parts||[]).filter(p => p.drawingId===drawingId && (p.fabType||"Fabricate")==="Fabricate");
      // Per-instance requirement per matCode
      const reqByMat = {};   // normMatCode → {wtPerInst, marks:[], section, display}
      parts.forEach(p => {
        const key = normMatCode(p.matCode) || `${p.section}|${p.grade}|${p.size}`.toUpperCase();
        if (!reqByMat[key]) reqByMat[key] = { wtPerInst:0, marks:[], section:p.section||"", display:p.matCode||key };
        reqByMat[key].wtPerInst += (p.calcTotalWt||0);
        if (p.markNo && !reqByMat[key].marks.includes(p.markNo)) reqByMat[key].marks.push(p.markNo);
      });
      const selCount = dis.filter(di=>selInstIds[di.id]).length;
      const nForCheck = selCount || dis.length;   // unselected drawings evaluated at full unreleased count

      // Tier detection (confidence badge, not different math):
      // Tier 1 — all marks appear in some non-discarded nesting batch's lot parts
      // Tier 2 — a purchaseReq exists matching any required matCode
      // Tier 3 — fresh calc
      const allMarks = parts.map(p=>p.markNo).filter(Boolean);
      const batchMarks = new Set();
      (nestingBatches||[]).forEach(b => { if (b.status==="discarded") return;
        (b.lots||[]).forEach(l => (l.parts||[]).forEach(mk => batchMarks.add(mk))); });
      const marksNested = allMarks.filter(mk=>batchMarks.has(mk)).length;
      const tier = (allMarks.length>0 && marksNested===allMarks.length) ? 1
        : (purchaseReqs||[]).some(pr => Object.keys(reqByMat).some(k => normMatCode(pr.matCode)===k)) ? 2 : 3;

      // Coverage per matCode (drawing evaluated alone against pool)
      const matRows = Object.entries(reqByMat).map(([key, r]) => {
        const p = pool[key] || { approvedWt:0, totalWt:0 };
        const reqWt = r.wtPerInst * nForCheck;
        return { key, display:r.display, section:r.section, marks:r.marks, reqWt,
                 approvedWt:p.approvedWt, totalWt:p.totalWt, covered: p.approvedWt >= reqWt && reqWt>0 };
      });
      const totalMarks   = allMarks.length || parts.length;
      const coveredMarks = matRows.filter(m=>m.covered).reduce((s,m)=>s+m.marks.length,0);
      const wtPerInst    = Object.values(reqByMat).reduce((s,r)=>s+r.wtPerInst,0) || (drawing.unitWt||0);
      const coveredWtPI  = matRows.filter(m=>m.covered).reduce((s,m)=>s+(m.reqWt/Math.max(nForCheck,1)),0);

      // Feasibility status per locked thresholds:
      // all covered → feasible
      // >10 marks: ≥80% count AND ≥60% weight → warn ; else blocked
      // ≤10 marks: missing ≤2 marks → warn ; else blocked
      let status;
      if (matRows.length>0 && matRows.every(m=>m.covered)) status = "feasible";
      else if (matRows.length===0) status = "nodata";
      else {
        const cntPct = totalMarks>0 ? coveredMarks/totalMarks : 0;
        const wtPct  = wtPerInst>0 ? coveredWtPI/wtPerInst : 0;
        const missing = totalMarks - coveredMarks;
        status = (totalMarks>10 ? (cntPct>=0.8 && wtPct>=0.6) : (missing<=2 && missing>0)) ? "warn" : "blocked";
      }
      const plateWtPI   = Object.values(reqByMat).filter(r=>planIsPlate(r.section)).reduce((s,r)=>s+r.wtPerInst,0);
      const sectionWtPI = wtPerInst - plateWtPI;
      return { order, drawing, dis, parts, matRows, tier, status, wtPerInst, plateWtPI, sectionWtPI,
               totalMarks, coveredMarks, matCount:matRows.length, selCount };
    });
    return { pool, rows };
  };

  const analyses = selOrderIds.map(oid => {
    const order = (orders||[]).find(o=>o.id===oid);
    return order ? analyseOrder(order) : null;
  }).filter(Boolean);
  const allRows = analyses.flatMap(a=>a.rows);

  // ── Selection totals ──
  const selRows = allRows.map(r => ({...r, n:r.dis.filter(di=>selInstIds[di.id]).length})).filter(r=>r.n>0);
  const selInstCount = selRows.reduce((s,r)=>s+r.n,0);
  const selWt        = selRows.reduce((s,r)=>s+r.wtPerInst*r.n,0);
  const selPlateWt   = selRows.reduce((s,r)=>s+r.plateWtPI*r.n,0);
  const selSectionWt = selRows.reduce((s,r)=>s+r.sectionWtPI*r.n,0);
  const plateDays    = cutCap.plateTPD>0   ? (selPlateWt/1000)/cutCap.plateTPD     : null;
  const sectionDays  = cutCap.sectionTPD>0 ? (selSectionWt/1000)/cutCap.sectionTPD : null;

  // ── Cumulative over-allocation check: selected reqs vs each order's pool ──
  const shortfalls = [];
  analyses.forEach(a => {
    const need = {};
    a.rows.forEach(r => {
      const n = r.dis.filter(di=>selInstIds[di.id]).length;
      if (!n) return;
      r.matRows.forEach(m => { need[m.key] = (need[m.key]||0) + (m.reqWt/Math.max(r.selCount||r.dis.length,1))*n; });
    });
    Object.entries(need).forEach(([key, wt]) => {
      const p = a.pool[key] || {approvedWt:0, totalWt:0};
      if (wt > p.approvedWt) shortfalls.push({ order:a.rows[0]?.order, key, needWt:wt, approvedWt:p.approvedWt, totalWt:p.totalWt });
    });
  });

  const toggleDrawing = (r, on) => setSelInstIds(prev => {
    const next = {...prev};
    r.dis.forEach(di => { if (on) next[di.id]=true; else delete next[di.id]; });
    return next;
  });
  const selectAllFeasible = () => setSelInstIds(prev => {
    const next = {...prev};
    allRows.filter(r=>r.status==="feasible").forEach(r=>r.dis.forEach(di=>next[di.id]=true));
    return next;
  });

  const stBadge = (s) => s==="feasible" ? <Badge color="green">Feasible</Badge>
    : s==="warn" ? <Badge color="amber">Partial — review</Badge>
    : s==="nodata" ? <Badge color="gray">No part data</Badge>
    : <Badge color="red">Blocked</Badge>;
  const tierBadge = (t) => t===1 ? <Badge color="teal">Tier 1 · nested</Badge> : t===2 ? <Badge color="purple">Tier 2 · MRP</Badge> : <Badge color="gray">Tier 3 · calc</Badge>;
  const tonnes = (kg) => (kg/1000).toFixed(2)+" T";

  const visibleRows = allRows.filter(r => showBlocked || r.status!=="blocked");

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <button onClick={onBack} style={css.btn.ghost}>← Production</button>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:T.text }}>Plan Production — Material Feasibility</div>
          <div style={{ fontSize:11, color:T.textMid }}>Approximate, based on average floor throughput and approved stock. Real nesting confirms the final cut plan.</div>
        </div>
      </div>

      {/* Order selection */}
      <div style={{ ...css.card, marginBottom:14 }}>
        <div style={css.label}>Select project(s)</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:6 }}>
          {(orders||[]).filter(o=>!["completed","cancelled"].includes(o.status)).map(o => (
            <button key={o.id} onClick={()=>toggleOrder(o.id)}
              style={{ ...css.btn.secondary, ...(selOrderIds.includes(o.id) ? { background:T.accent, color:"#fff", border:`1px solid ${T.accent}` } : {}) }}>
              {o.orderNo||o.id} · {o.clientName||""}
            </button>
          ))}
          {(orders||[]).filter(o=>!["completed","cancelled"].includes(o.status)).length===0 && (
            <div style={{ fontSize:12, color:T.textMid, padding:"6px 2px" }}>
              No active projects to plan — {(orders||[]).length===0
                ? "no orders exist yet."
                : `all ${(orders||[]).length} order(s) are marked completed or cancelled. Check the order status in the Orders module if this is unexpected.`}
            </div>
          )}
        </div>
        {selOrderIds.length>1 && (
          <div style={{ marginTop:10 }}>
            <InfoBanner color="amber">
              <b>{selOrderIds.length} projects selected — {selOrderIds.length} separate nesting runs will be needed (one per project).</b> Material pools are evaluated per project against that project's approved makes; stock is never pooled across projects.
            </InfoBanner>
          </div>
        )}
      </div>

      {selOrderIds.length>0 && (
        <>
          {/* Summary stat cards */}
          <div style={{ display:"flex", gap:12, marginBottom:14, flexWrap:"wrap" }}>
            <StatCard label="Selected Instances" value={selInstCount} sub={`${selRows.length} drawings`} />
            <StatCard label="Selected Weight" value={tonnes(selWt)} />
            <StatCard label="Plate" value={tonnes(selPlateWt)} sub={plateDays!=null ? `≈ ${plateDays.toFixed(1)} cutting days` : "set Plate T/day in Production Standards"} />
            <StatCard label="Section" value={tonnes(selSectionWt)} sub={sectionDays!=null ? `≈ ${sectionDays.toFixed(1)} cutting days` : "set Section T/day in Production Standards"} color={T.gold} />
          </div>
          {(plateDays!=null||sectionDays!=null) && (
            <div style={{ fontSize:11, color:T.textMid, marginBottom:12 }}>
              Plate and section cutting run in parallel — the bottleneck is the larger of the two, not the sum. Estimate only: thickness mix changes real cutting time.
            </div>
          )}

          {/* Over-allocation warnings for current selection */}
          {shortfalls.length>0 && (
            <InfoBanner color="red">
              <b>Selection exceeds approved stock for {shortfalls.length} material(s):</b>
              {shortfalls.map((s,i)=>(
                <div key={i} style={{ marginTop:4, fontFamily:T.fontMono, fontSize:11 }}>
                  {s.key} — need {tonnes(s.needWt)}, approved {tonnes(s.approvedWt)}{s.totalWt>s.approvedWt && <> (total in stock {tonnes(s.totalWt)} — gap is vendor-approval, may be worth chasing)</>}
                </div>
              ))}
            </InfoBanner>
          )}

          {/* Drawing list */}
          <div style={{ ...css.card }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.text }}>Drawings with unreleased instances ({allRows.length})</div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={selectAllFeasible} style={css.btn.sm}>Select all feasible</button>
                <button onClick={()=>setShowBlocked(v=>!v)} style={css.btn.ghost}>{showBlocked?"Hide":"Show"} blocked</button>
              </div>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead><tr>
                  <TH> </TH><TH>Drawing</TH><TH>Order</TH><TH>Source</TH><TH right>Unreleased</TH><TH right>Wt / inst</TH><TH>Parts · Materials</TH><TH>Feasibility</TH>
                </tr></thead>
                <tbody>
                  {visibleRows.map(r => {
                    const allSel = r.dis.every(di=>selInstIds[di.id]);
                    return (
                    <React.Fragment key={r.drawing.id}>
                      <tr style={{ cursor:"pointer" }} onClick={()=>setExpanded(p=>({...p,[r.drawing.id]:!p[r.drawing.id]}))}>
                        <TD><input type="checkbox" checked={allSel} onClick={e=>e.stopPropagation()} onChange={e=>toggleDrawing(r, e.target.checked)} disabled={r.status==="blocked"} /></TD>
                        <TD bold>{r.drawing.drawingNo}<div style={{fontSize:10,color:T.textLow,fontWeight:400}}>{r.drawing.title||""}</div></TD>
                        <TD mono>{r.order.orderNo||r.order.id}</TD>
                        <TD>{tierBadge(r.tier)}</TD>
                        <TD right mono>{r.selCount>0 ? `${r.selCount} / ${r.dis.length}` : r.dis.length}</TD>
                        <TD right mono>{(r.wtPerInst||0).toFixed(0)} kg</TD>
                        <TD><span style={{fontSize:11,color:T.textMid}}>{r.totalMarks} parts · {r.matCount} materials{r.status!=="feasible"&&r.status!=="nodata"&&<> · <b>{r.coveredMarks}/{r.totalMarks} covered</b></>}</span></TD>
                        <TD>{stBadge(r.status)}</TD>
                      </tr>
                      {expanded[r.drawing.id] && (
                        <tr><td colSpan={8} style={{ padding:"6px 10px 12px 34px", borderBottom:`1px solid ${T.border}`, background:T.bgInput }}>
                          {/* Instance checkboxes */}
                          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:8 }}>
                            {r.dis.map(di => (
                              <label key={di.id} style={{ fontSize:11, fontFamily:T.fontMono, display:"flex", gap:4, alignItems:"center", cursor: r.status==="blocked"?"not-allowed":"pointer", color:T.textMid }}>
                                <input type="checkbox" checked={!!selInstIds[di.id]} disabled={r.status==="blocked"}
                                  onChange={e=>setSelInstIds(p=>{ const n={...p}; if(e.target.checked) n[di.id]=true; else delete n[di.id]; return n; })} />
                                {di.id}
                              </label>
                            ))}
                          </div>
                          {/* Per-material coverage */}
                          <table style={{ borderCollapse:"collapse", fontSize:11 }}>
                            <thead><tr><TH>Material</TH><TH right>Required</TH><TH right>Approved avail</TH><TH right>Total in stock</TH><TH> </TH></tr></thead>
                            <tbody>
                              {r.matRows.map(m => (
                                <tr key={m.key}>
                                  <TD mono>{m.display}</TD>
                                  <TD right mono>{tonnes(m.reqWt)}</TD>
                                  <TD right mono color={m.covered?T.green:T.red}>{tonnes(m.approvedWt)}</TD>
                                  <TD right mono>{tonnes(m.totalWt)}{m.totalWt>m.approvedWt && !m.covered && <span style={{color:T.amber}}> ← approval gap</span>}</TD>
                                  <TD>{m.covered ? <Badge color="green">OK</Badge> : <Badge color="red">Short</Badge>}</TD>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td></tr>
                      )}
                    </React.Fragment>
                  );})}
                </tbody>
              </table>
            </div>
            {allRows.length===0 && <div style={{ padding:20, textAlign:"center", color:T.textLow, fontSize:12 }}>No unreleased instances in the selected project(s).</div>}
          </div>

          {/* Handoff placeholder — next build step wires this to floor nesting */}
          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:14, gap:10, alignItems:"center" }}>
            <span style={{ fontSize:11, color:T.textLow }}>Next step (upcoming build): send selection to floor nesting with RM unit selection</span>
            <button disabled style={{ ...css.btn.primary, opacity:0.45, cursor:"not-allowed" }}>Send to Nesting →</button>
          </div>
        </>
      )}
    </div>
  );
};

const ProductionModule = ({ user, instances, setInstances, orders, setOrders, stock, setStock,
                            nestingRuns, setNestingRuns, nestingBatches, machines, contractors, materials, vendors, tpiAgencies,
                            releases, setReleases, productionStandards, issueRequests, setIssueRequests, welders, pos, purchaseReqs,
                            dprs, setDprs, correctionsLog, setCorrectionsLog, notifications, setNotifications,
                            ncrs, setNcrs, scrapQueue, setScrapQueue,
                            drawingInstances, setDrawingInstances, processTypes, appUsers }) => {
  const [view, setView]           = useState(() => {
    const forced = sessionStorage.getItem('dev_target_view');
    if (forced) { sessionStorage.removeItem('dev_target_view'); return forced; }
    return "dashboard";
  });
  const [selOrderId, setSelOrderId]   = useState("");
  const [selDrawingId, setSelDrawingId] = useState("");
  const [selStatusDrawing, setSelStatusDrawing] = useState(null); // {drawingId, orderId}
  const [selProgressOrderId, setSelProgressOrderId] = useState("");
  const [assignForm, setAssignForm] = useState({}); // blast/paint contractor assignment form

  // Contractor → own work queue only (after hooks)
  if (user.role === "contractor") {
    // Route blast/paint contractors to dedicated queue
    const cid = user.contractorId;
    const contr = (contractors||[]).find(c=>c.id===cid)||{};
    const isBlastPaint = (contr.type||[]).some(t=>["blasting","painting"].includes(t));
    const isFitWeld = (contr.type||[]).some(t=>["fit_up","welding","cutting"].includes(t));
    if (isBlastPaint && !isFitWeld) return <BlastPaintContractorQueue user={user} dprs={dprs||[]} setDprs={setDprs} orders={orders||[]} instances={instances} setInstances={setInstances} correctionsLog={correctionsLog||[]} setCorrectionsLog={setCorrectionsLog} />;
    return <ContractorWorkQueue user={user} instances={instances} setInstances={setInstances} releases={releases||[]} stock={stock||[]} orders={orders||[]} nestingBatches={nestingBatches||[]} dprs={dprs||[]} setDprs={setDprs} correctionsLog={correctionsLog||[]} setCorrectionsLog={setCorrectionsLog} notifications={notifications||[]} setNotifications={setNotifications} />;
  }
  // Machine operator → machine queue
  if (user.role === "machine_operator") return <MachineOperatorQueue user={user} releases={releases||[]} setReleases={setReleases} issueRequests={issueRequests||[]} setIssueRequests={setIssueRequests} stock={stock} setStock={setStock} materials={materials||[]} instances={instances||[]} setInstances={setInstances} orders={orders||[]} nestingBatches={nestingBatches||[]} />;
  // Stage workers (blasting/painting engineers) → stage-filtered work queue
  if (["blasting_engineer","painting_engineer"].includes(user.role)) return <StageWorkerQueue user={user} instances={instances} setInstances={setInstances} />;

  const canAssign = can(user,"production.new_release")||can(user,"production.confirm_cutting");

  const totalInstances    = instances.length;
  const readyToCollect    = instances.filter(i=>i.currentStatus==="pending_collection").length;
  const inProgress        = instances.filter(i=>i.currentStatus==="in_progress").length;
  const pendingSupervisor = instances.filter(i=>i.currentStatus==="pending_supervisor").length;
  const defective         = instances.filter(i=>i.currentStatus==="defective").length;
  const qualityConcerns   = instances.filter(i=>i.qualityConcernFlag).length;

  // ── Production Engineer DPR view ──
  if (view==="plan_production") return (
    <PlanProductionScreen user={user} orders={orders||[]} drawingInstances={drawingInstances||[]}
      stock={stock||[]} nestingBatches={nestingBatches||[]} purchaseReqs={purchaseReqs||[]}
      productionStandards={productionStandards} onBack={()=>setView("dashboard")} />
  );
  if (view==="eng_dpr") return (
    <ProductionEngineerScreen user={user} dprs={dprs||[]} orders={orders||[]} instances={instances||[]} contractors={contractors||[]} onBack={()=>setView("dashboard")} />
  );

  // ── Release creation wizard ──
  if (view==="release_new") return (
    <ProductionReleaseWizard user={user} orders={orders} setOrders={setOrders} stock={stock} setStock={setStock} materials={materials||[]}
      machines={machines} contractors={contractors} releases={releases||[]} setReleases={setReleases}
      productionStandards={productionStandards} instances={instances||[]} setInstances={setInstances}
      nestingBatches={nestingBatches||[]} purchaseReqs={purchaseReqs||[]}
      onBack={()=>setView("dashboard")} dprs={dprs||[]} setDprs={setDprs}
      drawingInstances={drawingInstances||[]} setDrawingInstances={setDrawingInstances}
      processTypes={processTypes||DEFAULT_PROCESS_TYPES} />
  );

  // ── Supervisor queue view ──
  if (view==="approvals") return (
    <SupervisorQueue user={user} instances={instances} setInstances={setInstances}
      orders={orders} tpiAgencies={tpiAgencies||[]} releases={releases||[]} machines={machines||[]} welders={welders||[]} productionStandards={productionStandards} onBack={()=>setView("dashboard")}
      ncrs={ncrs||[]} setNcrs={setNcrs} notifications={notifications||[]} setNotifications={setNotifications}
      correctionsLog={correctionsLog||[]} setCorrectionsLog={setCorrectionsLog} scrapQueue={scrapQueue||[]} setScrapQueue={setScrapQueue} />
  );

  // ── Outbound processing view ──
  if (view==="outbound") return (
    <OutboundProcessing user={user} instances={instances} setInstances={setInstances}
      orders={orders} vendors={vendors||[]} onBack={()=>setView("dashboard")} />
  );

  // ── Order Progress view ──
  if (view==="order_progress" && selProgressOrderId) {
    const progOrder = orders.find(o=>o.id===selProgressOrderId);
    if (progOrder) return (
      <div style={{ padding:0 }}>
        <OrderProgressTracker order={progOrder}
          onChange={(updated)=>setOrders(prev=>prev.map(o=>o.id===updated.id?updated:o))}
          user={user} pos={pos||[]} stock={stock||[]} nestingBatches={nestingBatches||[]} releases={releases||[]} instances={instances} purchaseReqs={purchaseReqs||[]} dprs={dprs||[]}
          drawingInstances={drawingInstances||[]} onBack={()=>{ setView("register"); setSelProgressOrderId(""); }} />
      </div>
    );
    return <div style={{padding:32,color:T.textLow}}>Order not found. <button style={css.btn.ghost} onClick={()=>setView("register")}>← Back</button></div>;
  }

  // ── Blast & Paint Assignment view ──
  // ── Blast & Paint Assignment Queue ──
  if (view==="assignments") {
    const canManage=["super_admin","planning_admin","floor_planner","production_engineer"].includes(user.role);
    const blastContractors=(contractors||[]).filter(c=>c.active!==false&&(c.type||[]).some(t=>["blasting","painting"].includes(t)));

    // Drawings that completed weld QC and are now at blasting stage
    const pendingAssignment = (dprs||[]).filter(d =>
      d.currentStage==="blasting" && !d.blastContractorId
    );
    const assigned = (dprs||[]).filter(d =>
      ["blasting","blast_qc","painting","paint_qc"].includes(d.currentStage) && d.blastContractorId
    );

    const doAssign = (dprId, blastCid, paintCid) => {
      const bc = blastContractors.find(c=>c.id===blastCid)||{};
      const pc = blastContractors.find(c=>c.id===paintCid)||{};
      const ts = new Date().toISOString();
      setDprs(prev=>prev.map(d=>d.id!==dprId?d:{...d,
        blastContractorId:blastCid, blastContractorName:bc.name||"",
        paintContractorId:paintCid, paintContractorName:pc.name||"",
        blastAssignedAt:ts, blastAssignedBy:user.username,
        stageHistory:[...(d.stageHistory||[]),{stage:"blasting",action:"assigned",by:user.username,at:ts,blastContractor:bc.name,paintContractor:pc.name}]
      }));
    };

    return (
      <div>
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:20 }}>
          <button onClick={()=>setView("dashboard")} style={css.btn.ghost}>← Production</button>
          <div style={{ fontSize:18, fontWeight:800, color:T.text }}>Blast & Paint Assignments</div>
          <div style={{ flex:1 }} />
          {pendingAssignment.length>0&&(
            <div style={{ background:T.amberBg, border:`1px solid ${T.amber}44`, borderRadius:6,
              padding:"6px 12px", fontSize:12, color:T.amber, fontWeight:700 }}>
              ⚠ {pendingAssignment.length} drawing{pendingAssignment.length!==1?"s":""} awaiting assignment
            </div>
          )}
        </div>

        {/* Pending assignment */}
        {pendingAssignment.length===0&&assigned.length===0&&(
          <InfoBanner color="blue">No drawings at blasting/painting stage yet. Drawings appear here after Weld QC is approved.</InfoBanner>
        )}

        {pendingAssignment.length>0&&(
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.amber, marginBottom:12 }}>
              PENDING ASSIGNMENT — {pendingAssignment.length}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {pendingAssignment.map(dpr => {
                const order = (orders||[]).find(o=>o.id===dpr.orderId)||{};
                const drawing = (order.drawings||[]).find(d=>d.id===dpr.drawingId)||{};
                const spec = getPaintCoats ? null : null;
                const paintSpecs = order.quality?.paintSpecs || [];
                const drawingSpec = paintSpecs.find(s=>s.specLabel===(drawing.paintSpecId||"A"))||paintSpecs[0];
                const af = assignForm[dpr.id]||{};
                const blastOnly = (contractors||[]).filter(c=>c.active!==false&&(c.type||[]).includes("blasting"));
                const paintOnly = (contractors||[]).filter(c=>c.active!==false&&(c.type||[]).includes("painting"));
                return (
                  <div key={dpr.id} style={{ ...css.card, borderLeft:`3px solid ${T.amber}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                      <div>
                        <div style={{ fontFamily:T.fontMono, fontWeight:700, color:T.accent, fontSize:13 }}>{dpr.drawingNo}</div>
                        <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>
                          {order.orderNo} · {order.clientName}
                          {drawing.assemblyGroup&&<span> · Assembly: {drawing.assemblyGroup}</span>}
                        </div>
                        <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>
                          Blast: <strong style={{color:T.text}}>{order.quality?.blastingStandard||"Sa 2.5"}</strong>
                          {drawingSpec&&<span> · Paint Spec: <strong style={{color:T.text}}>{drawingSpec.specLabel} ({drawingSpec.coats?.length||0} coats)</strong></span>}
                          {(drawing.totalWt||0)>0&&<span> · {((drawing.totalWt||0)/1000).toFixed(2)}T</span>}
                        </div>
                      </div>
                      <Badge color="amber">Awaiting Assignment</Badge>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:10, alignItems:"end" }}>
                      <div>
                        <label style={css.label}>Blast Contractor</label>
                        <select value={af.blastCid||""} onChange={e=>setAssignForm(p=>({...p,[dpr.id]:{...(p[dpr.id]||{}),blastCid:e.target.value}}))} style={css.input}>
                          <option value="">— Select —</option>
                          {blastOnly.map(c=><option key={c.id} value={c.id}>{c.name}{c.isInHouse?" 🏭":""}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={css.label}>Paint Contractor</label>
                        <select value={af.paintCid||""} onChange={e=>setAssignForm(p=>({...p,[dpr.id]:{...(p[dpr.id]||{}),paintCid:e.target.value}}))} style={css.input}>
                          <option value="">— Select —</option>
                          {paintOnly.map(c=><option key={c.id} value={c.id}>{c.name}{c.isInHouse?" 🏭":""}</option>)}
                        </select>
                      </div>
                      <button
                        disabled={!af.blastCid||!af.paintCid}
                        onClick={()=>{ doAssign(dpr.id, af.blastCid, af.paintCid); setAssignForm(p=>({...p,[dpr.id]:{}})); }}
                        style={{ ...css.btn.green, opacity:(!af.blastCid||!af.paintCid)?0.45:1, whiteSpace:"nowrap" }}>
                        ✓ Assign
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Assigned — currently in blast/paint */}
        {assigned.length>0&&(
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:T.textMid, marginBottom:12 }}>
              ASSIGNED — {assigned.length}
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ background:T.bgInput }}>
                  {["Drawing","Order","Stage","Blast Contractor","Paint Contractor","Assigned By","Assigned"].map(h=>(
                    <th key={h} style={{ padding:"7px 10px", textAlign:"left", fontSize:10, fontWeight:700, color:T.textMid, textTransform:"uppercase", borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assigned.map((dpr,i)=>{
                  const order=(orders||[]).find(o=>o.id===dpr.orderId)||{};
                  const meta=DPR_STAGE_META[dpr.currentStage]||{label:dpr.currentStage,color:T.textMid,bg:"#F1F5F9"};
                  return (
                    <tr key={dpr.id} style={{ background:i%2===0?"transparent":T.bgInput, borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:"7px 10px", fontFamily:T.fontMono, fontWeight:700, color:T.accent }}>{dpr.drawingNo}</td>
                      <td style={{ padding:"7px 10px", fontSize:11, color:T.textMid }}>{order.orderNo}</td>
                      <td style={{ padding:"7px 10px" }}>
                        <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:99, fontSize:11, fontWeight:700, background:meta.bg, color:meta.color }}>{meta.label}</span>
                      </td>
                      <td style={{ padding:"7px 10px", fontSize:11 }}>{dpr.blastContractorName||"—"}</td>
                      <td style={{ padding:"7px 10px", fontSize:11 }}>{dpr.paintContractorName||"—"}</td>
                      <td style={{ padding:"7px 10px", fontSize:11, color:T.textMid }}>{dpr.blastAssignedBy||"—"}</td>
                      <td style={{ padding:"7px 10px", fontSize:11, color:T.textMid }}>{dpr.blastAssignedAt?.slice(0,10)||"—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  if (view==="blast_paint") {
    const canManage=["super_admin","planning_admin","floor_planner","production_engineer"].includes(user.role);
    const blastPaintStages=new Set(['blasting','tpi_blast','paint_coat_1','paint_coat_2','paint_coat_3','tpi_paint_1','tpi_paint_2','tpi_paint_3']);
    // Drawings currently at blasting or painting stage — group by order then drawing
    const pendingDrawings=[];
    const historyDrawings=[];
    orders.filter(o=>o.status==="active").forEach(order=>{
      (order.drawings||[]).forEach(drg=>{
        const steps=drg.productionSteps||[];
        const currentStep=steps.find(s=>s.status==="in_progress")||steps.find(s=>s.status==="pending"&&steps.filter(x=>x.status==="completed").length>0);
        if(!currentStep) return;
        const isBlastPaint=blastPaintStages.has(currentStep.stage);
        if(!isBlastPaint) return;
        const hasBlastContractor=!!currentStep.contractorId;
        const entry={drawing:drg,order,currentStep,hasBlastContractor};
        if(!hasBlastContractor) pendingDrawings.push(entry);
        else historyDrawings.push(entry);
      });
    });
    // Assembly grouping
    const assemblyMap={};
    orders.forEach(order=>{
      (order.assemblies||[]).forEach((a,i)=>{
        const colors=["#2563eb","#16a34a","#d97706","#9333ea","#0891b2"];
        (a.drawingsAssigned||[]).forEach(did=>{assemblyMap[did]={name:a.assemblyName||a.assemblyNumber,color:colors[i%colors.length]};});
      });
    });
    const blastContractors=(contractors||[]).filter(c=>c.active!==false&&(c.type||[]).includes('blasting'));
    const paintContractors=(contractors||[]).filter(c=>c.active!==false&&(c.type||[]).includes('painting'));
    const assignContractor=(drawing,order,stage,contractorId)=>{
      const contractorName=(contractors||[]).find(c=>c.id===contractorId)?.name||"";
      setOrders(prev=>prev.map(ord=>{
        if(ord.id!==order.id) return ord;
        const updDrawings=(ord.drawings||[]).map(drg=>{
          if(drg.id!==drawing.id) return drg;
          const updSteps=(drg.productionSteps||[]).map(s=>s.stage===stage?{...s,contractorId,contractorName,assignedAt:new Date().toISOString(),assignedBy:user.username}:s);
          return {...drg,productionSteps:updSteps};
        });
        return {...ord,drawings:updDrawings};
      }));
    };
    return (
      <div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:20}}>
          <button onClick={()=>setView("dashboard")} style={css.btn.ghost}>← Production</button>
          <div style={{fontSize:18,fontWeight:800,color:T.text}}>Blast & Paint Assignment</div>
        </div>
        {pendingDrawings.length===0&&historyDrawings.length===0&&(
          <InfoBanner color="blue">No drawings currently at blasting or painting stage.</InfoBanner>
        )}
        {pendingDrawings.length>0&&(
          <div style={{marginBottom:24}}>
            <div style={{fontSize:13,fontWeight:700,color:T.amber,marginBottom:10}}>⚠ PENDING ASSIGNMENT ({pendingDrawings.length})</div>
            <table style={{width:"100%",borderCollapse:"collapse",background:T.bgCard,borderRadius:8,fontSize:12}}>
              <thead>
                <tr style={{background:T.bgInput}}>
                  {["Drawing No","Order","Assembly","Stage","Assign Contractor","Action"].map(h=>(
                    <th key={h} style={{padding:"8px 10px",fontSize:11,color:T.textMid,fontWeight:700,textAlign:"left",borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingDrawings.map(({drawing,order,currentStep})=>{
                  const asm=assemblyMap[drawing.id];
                  const isBlast=currentStep.stage==="blasting"||currentStep.stage==="tpi_blast";
                  const contractorList=isBlast?blastContractors:paintContractors;
                  return (
                    <tr key={drawing.id} style={{borderBottom:`1px solid ${T.border}`,background:asm?`${asm.color}11`:"transparent"}}>
                      <td style={{padding:"8px 10px",fontFamily:T.fontMono,fontWeight:700,color:T.accentHi}}>
                        {asm&&<span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:asm.color,marginRight:6}}/>}
                        {drawing.drawingNo}
                      </td>
                      <td style={{padding:"8px 10px",color:T.textMid,fontSize:11}}>{order.id}</td>
                      <td style={{padding:"8px 10px",fontSize:11,color:asm?asm.color:T.textLow}}>{asm?.name||"—"}</td>
                      <td style={{padding:"8px 10px"}}><Badge color={isBlast?"amber":"blue"}>{currentStep.stage.replace(/_/g," ")}</Badge></td>
                      <td style={{padding:"8px 10px"}}>
                        {canManage?(
                          <select
                            defaultValue=""
                            onChange={e=>{if(e.target.value)assignContractor(drawing,order,currentStep.stage,e.target.value);}}
                            style={{...css.input,fontSize:11,padding:"3px 6px",minWidth:180}}
                          >
                            <option value="">— Select contractor —</option>
                            {contractorList.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        ):<span style={{color:T.textLow,fontSize:11}}>No permission</span>}
                      </td>
                      <td style={{padding:"8px 10px"}}>
                        <button onClick={()=>{setSelStatusDrawing({drawingId:drawing.id,orderId:order.id});setView("drawing_status");}} style={{...css.btn.ghost,fontSize:10,padding:"3px 8px"}}>View Status</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {historyDrawings.length>0&&(
          <div>
            <div style={{fontSize:13,fontWeight:700,color:T.green,marginBottom:10}}>✓ ASSIGNED ({historyDrawings.length})</div>
            <table style={{width:"100%",borderCollapse:"collapse",background:T.bgCard,borderRadius:8,fontSize:12,opacity:0.8}}>
              <thead>
                <tr style={{background:T.bgInput}}>
                  {["Drawing No","Order","Stage","Contractor","Assigned By","Assigned At"].map(h=>(
                    <th key={h} style={{padding:"8px 10px",fontSize:11,color:T.textMid,fontWeight:700,textAlign:"left",borderBottom:`1px solid ${T.border}`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historyDrawings.map(({drawing,order,currentStep})=>(
                  <tr key={drawing.id} style={{borderBottom:`1px solid ${T.border}`}}>
                    <td style={{padding:"8px 10px",fontFamily:T.fontMono,fontSize:11,color:T.accentHi}}>{drawing.drawingNo}</td>
                    <td style={{padding:"8px 10px",fontSize:11,color:T.textMid}}>{order.id}</td>
                    <td style={{padding:"8px 10px"}}><Badge color="blue">{currentStep.stage.replace(/_/g," ")}</Badge></td>
                    <td style={{padding:"8px 10px",fontSize:11,fontWeight:600}}>{currentStep.contractorName||currentStep.contractorId}</td>
                    <td style={{padding:"8px 10px",fontSize:11,color:T.textMid}}>{currentStep.assignedBy||"—"}</td>
                    <td style={{padding:"8px 10px",fontSize:11,color:T.textMid}}>{currentStep.assignedAt?.slice(0,10)||"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── Drawing Register view ──
  if (view==="register") return (
    <ProductionDrawingRegister orders={orders} instances={instances} stock={stock} releases={releases||[]} contractors={contractors||[]} machines={machines||[]} onBack={()=>setView("dashboard")}
      onViewStatus={(drawingId, orderId)=>{ setSelStatusDrawing({drawingId,orderId}); setView("drawing_status"); }}
      onViewProgress={(orderId)=>{ setSelProgressOrderId(orderId); setView("order_progress"); }} />
  );

  // ── Drawing Status Card view ──
  if (view==="drawing_status" && selStatusDrawing) {
    const statusOrder = orders.find(o=>o.id===selStatusDrawing.orderId);
    const statusDrawing = (statusOrder?.drawings||[]).find(d=>d.id===selStatusDrawing.drawingId);
    if (statusOrder && statusDrawing) return (
      <DrawingStatusCard user={user} drawing={statusDrawing} order={statusOrder} stock={stock} orders={orders}
        setOrders={setOrders} releases={releases||[]} instances={instances} machines={machines||[]}
        contractors={contractors||[]} nestingBatches={nestingBatches||[]}
        onBack={()=>{ setView("register"); setSelStatusDrawing(null); }} />
    );
    return <div style={{ padding:32, color:T.textLow }}>Drawing not found. <button style={css.btn.ghost} onClick={()=>setView("register")}>← Back</button></div>;
  }

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
      releases={releases||[]} onBack={()=>setView("dashboard")}
      drawingInstances={drawingInstances||[]} setDrawingInstances={setDrawingInstances} />
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

        {(()=>{
          const pendingRmUnits=(releases||[]).filter(r=>r.status!=="cancelled").flatMap(r=>(r.rmUnitAssignments||[]).filter(ru=>ru.status==="pending"));
          if(pendingRmUnits.length===0) return null;
          const releaseIds=[...new Set(pendingRmUnits.map(ru=>{
            const rel=(releases||[]).find(r=>(r.rmUnitAssignments||[]).some(x=>x.rmUnitId===ru.rmUnitId));
            return rel?.id||"";
          }))].filter(Boolean);
          return (
            <div style={{padding:"10px 14px",background:T.amberBg,border:`1px solid ${T.amber}55`,borderRadius:6,marginBottom:12,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <span style={{fontSize:13,color:T.amber,fontWeight:700}}>⚠ {pendingRmUnits.length} RM unit{pendingRmUnits.length!==1?"s":""} unassigned</span>
              <span style={{fontSize:12,color:T.textMid}}>in {releaseIds.join(", ")}</span>
              <button onClick={()=>setView("release_new")} style={{...css.btn.amber,fontSize:11,padding:"3px 10px"}}>Complete Assignment</button>
            </div>
          );
        })()}
      <div style={{ display:"flex",gap:12,marginBottom:24,flexWrap:"wrap" }}>
        <StatCard label="Active Releases"    value={(releases||[]).filter(r=>r.status==="in_progress").length} color={T.accent} />
        <StatCard label="Total Instances"    value={totalInstances}    color={T.text} />
        <StatCard label="Ready to Collect"   value={readyToCollect}    color={T.green} />
        <StatCard label="In Progress"        value={inProgress}        color={T.accent} />
        <StatCard label="Pending Supervisor" value={pendingSupervisor} color={T.amber} />
        <StatCard label="Defective"          value={defective}         color={T.red} />
        {qualityConcerns>0&&<StatCard label="Quality Concerns" value={qualityConcerns} color={T.red} />}
      </div>

      {/* ── Active Releases with Cancel option ── */}
      {(releases||[]).filter(r=>r.status==="in_progress"||r.status==="confirmed").length>0&&(
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.textMid, marginBottom:6, letterSpacing:"0.05em" }}>ACTIVE RELEASES</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {(releases||[]).filter(r=>r.status==="in_progress"||r.status==="confirmed").map(rel=>{
              // Check if any cutting has been done for this release
              const relRmUnitIds = new Set((rel.rmUnitAssignments||[]).map(ru=>ru.rmUnitId).filter(Boolean));
              const relInstances = (instances||[]).filter(i=>i.releaseId===rel.id||relRmUnitIds.has(i.rmUnitId));
              // canCancel only blocked if parts have been collected (moved past cutting stage)
              const hasCutting = relInstances.some(i=>i.currentStage&&i.currentStage!=="cutting");
              const canCancel = !hasCutting;
              const cancelRelease = () => {
                if (!canCancel) return;
                if (!window.confirm(`Cancel release ${rel.id}? This will remove all uncut instances linked to this release.`)) return;
                // Remove instances that haven't been cut yet (still at cutting/pending)
                setInstances(prev=>(prev||[]).filter(i=>{
                  const inRel = i.releaseId===rel.id||(rel.rmUnitAssignments||[]).some(ru=>ru.rmUnitId===i.rmUnitId);
                  if (!inRel) return true;
                  // Keep instances that have progressed beyond cutting
                  return i.currentStage!=="cutting";
                }));
                // Mark release as cancelled
                setReleases(prev=>(prev||[]).map(r=>r.id!==rel.id?r:{...r,status:"cancelled",cancelledAt:today(),cancelledBy:user.name}));
                showToast(`Release ${rel.id} cancelled`);
              };
              return (
                <div key={rel.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 14px", background:T.bg, borderRadius:6, border:`1px solid ${T.border}` }}>
                  <span style={{ fontFamily:T.fontMono, fontSize:12, fontWeight:700, color:T.accent }}>{rel.id}</span>
                  <span style={{ fontSize:11, color:T.textMid }}>{fmt.date(rel.confirmedAt||rel.createdAt)}</span>
                  <span style={{ fontSize:11, color:T.textMid }}>{(rel.drawings||[]).length} drawing{(rel.drawings||[]).length!==1?"s":""}</span>
                  <Badge color="blue">in progress</Badge>
                  {relInstances.length>0&&<span style={{ fontSize:11, color:T.textMid }}>{relInstances.length} instances</span>}
                  <div style={{ flex:1 }}/>
                  {canCancel
                    ? <button onClick={cancelRelease} style={{ ...css.btn.ghost, color:T.red, border:`1px solid ${T.red}`, fontSize:11, padding:"3px 10px" }}>✕ Cancel Release</button>
                    : <span style={{ fontSize:11, color:T.textLow }}>🔒 Cutting started — cannot cancel</span>
                  }
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display:"flex",gap:12,marginBottom:24,flexWrap:"wrap" }}>
        {canAssign&&<button onClick={()=>setView("release_new")} style={css.btn.green}>+ New Release</button>}
        {canAssign&&<button onClick={()=>setView("plan_production")} style={css.btn.primary}>🧮 Plan Production</button>}
        {["super_admin","planning_admin","floor_planner","production_engineer"].includes(user.role)&&(
          <button onClick={()=>setView("eng_dpr")} style={css.btn.primary}>📐 DPR View</button>
        )}
        <button onClick={()=>setView("cutting")} style={css.btn.primary}>✂ Cutting Confirmation</button>
        {canAssign&&<button onClick={()=>{setSelOrderId("");setSelDrawingId("");setView("assignments");}} style={css.btn.secondary}>📋 Assignment</button>}
        <button onClick={()=>{setSelOrderId("");setSelDrawingId("");setView("progress");}} style={css.btn.secondary}>📊 Progress Grid</button>
        {canAssign&&<button onClick={()=>setView("outbound")} style={css.btn.secondary}>🔄 Outbound</button>}
        {["super_admin","planning_admin","floor_planner","production_engineer","supervisor"].includes(user.role)&&(
          <>
          <button onClick={()=>setView("assignments")} style={{...css.btn.ghost,fontSize:12,position:"relative"}}>
            📋 Assignments
            {(dprs||[]).filter(d=>d.currentStage==="blasting"&&!d.blastContractorId).length>0&&(
              <span style={{position:"absolute",top:-4,right:-4,background:T.amber,color:"#fff",borderRadius:"50%",fontSize:9,fontWeight:800,width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {(dprs||[]).filter(d=>d.currentStage==="blasting"&&!d.blastContractorId).length}
              </span>
            )}
          </button>
          <button onClick={()=>setView("blast_paint")} style={{...css.btn.ghost,fontSize:12}}>🎨 Blast & Paint</button>
          </>
        )}
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
          {(()=>{
            // Group instances by rmUnitId
            const groups={};
            instances.slice().reverse().forEach(inst=>{
              const key=inst.rmUnitId||"__no_rm__";
              if(!groups[key]) groups[key]=[];
              groups[key].push(inst);
            });
            return (
              <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
                <thead><tr>
                  {["","RM Unit","Parts","Order","Cutting Contractor","Status","","",""].map((h,i)=><TH key={i}>{h}</TH>)}
                </tr></thead>
                <tbody>
                  {Object.entries(groups).map(([rmUnitId,insts])=>(
                    <RmUnitGroupRow key={rmUnitId} rmUnitId={rmUnitId==="__no_rm__"?"":rmUnitId} insts={insts} T={T} css={css} STAGE_SEQ_LABELS={STAGE_SEQ_LABELS} />
                  ))}
                </tbody>
              </table>
            );
          })()}
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

// ─── CUTTING CONFIRMATION ─────────────────────────────────────────────────────
const CuttingConfirmation = ({ user, nestingRuns, setNestingRuns, stock, setStock,
                               instances, setInstances, orders, materials, machines, productionStandards, releases, onBack,
                               drawingInstances, setDrawingInstances }) => {
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
          plannedQty:(p.qtyPerDrg||0)*(drg?.qty||1), length:p.length||0, sectionType:p.sectionType||"" });
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
        ...p, included:true, goodQty:p.plannedQty, defects:[],
        shortReason:"",
        markingConfirmed:false, markingCannotStamp:false, markingCannotStampReason:"",
      })),
      hasOffcut:false, offcutLength:"", offcutWidth:"",
    });
    setStep("barForm");
  };

  const updatePart = (i,k,v) =>
    setBarForm(f=>{ const p=[...f.parts]; p[i]={...p[i],[k]:v}; return {...f,parts:p}; });

  const handleGoodQtyChange = (i,val,p) => {
    const newGoodQty = Math.min(p.plannedQty, Math.max(0, +val||0));
    const newDefQty  = p.plannedQty - newGoodQty;
    const cur = p.defects||[];
    const newDefects = newDefQty > cur.length
      ? [...cur, ...Array.from({length:newDefQty-cur.length},()=>({defectType:"dimensional",action:"",reason:""}))]
      : cur.slice(0, newDefQty);
    setBarForm(f=>{ const pts=[...f.parts]; pts[i]={...pts[i],goodQty:newGoodQty,defects:newDefects}; return {...f,parts:pts}; });
  };

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
    const needsReason = included.filter(p=>{
      const totalAccounted = (+p.goodQty||0)+(p.defects||[]).length;
      return totalAccounted < p.plannedQty && !p.shortReason.trim();
    });
    if (needsReason.length) return showToast("Enter reason for short quantities on highlighted parts","amber");
    const needsDefectReason = included.filter(p=>(p.defects||[]).some(d=>!d.reason?.trim()));
    if (needsDefectReason.length) return showToast("Enter reason for all defective pieces","amber");
    const needsDefectAction = included.filter(p=>(p.defects||[]).some(d=>!d.action));
    if (needsDefectAction.length) return showToast("Select action for all defective pieces","amber");
    const needsMarking = included.filter(p=>(+p.goodQty||0)>0 && !p.markingConfirmed && (!p.markingCannotStamp || !p.markingCannotStampReason?.trim()));
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

    // Build confirmed parts: one "good" entry per part + one entry per defective piece
    const confirmedPartsAll = [];
    included.forEach(p => {
      const ca = getContractorForDrawing(p.drawingId, p.orderId);
      const ord = (orders||[]).find(o=>o.id===p.orderId);
      const orderPart = (ord?.parts||[]).find(op=>op.markNo===p.markNo&&op.drawingId===p.drawingId);
      const reqOps = (orderPart?.requiredOps||[]).length>0 ? orderPart.requiredOps : ['Cut'];
      const base = {
        markNo:p.markNo, drawingId:p.drawingId, drawingNo:p.drawingNo,
        orderId:p.orderId, desc:p.desc, totalInstances:p.plannedQty,
        subOpsRequired:reqOps,
        contractorId:ca.contractorId||"", contractorName:ca.contractorName||"",
        pinnedEngineerId:ca.pinnedEngineerId||"", pinnedEngineerName:ca.pinnedEngineerName||"",
      };
      const gq = +p.goodQty||0;
      if (gq>0) confirmedPartsAll.push({...base, actualQty:gq, isDefective:false});
      (p.defects||[]).forEach(d => confirmedPartsAll.push({
        ...base, actualQty:1, isDefective:true,
        defectType:d.defectType||"dimensional", defectReason:d.reason||"",
        defectAction:d.action||"",
      }));
    });

    // Create instances
    const newInst = createInstances({
      nestingRunId:selRunId, lotId:barForm.lotId, barRef:selBarRef,
      batchNo:barForm.batchNo, cuttingBayUsed:barForm.cuttingBayUsed,
      confirmedParts: confirmedPartsAll,
      confirmedBy:user.name, confirmDate, existingInstances:instances,
    });
    // Route to secondary_ops if instance has any required op beyond 'Cut'
    newInst.forEach(inst => {
      if (inst.currentStatus === "pending_collection") {
        const hasSecOps = (inst.subOpsRequired||[]).some(op => op.toLowerCase() !== 'cut');
        if (hasSecOps) {
          inst.currentStatus = "pending_secondary";
          inst.currentStage = "secondary_ops";
        }
      }
    });
    // Route defective instances by action stored on their defect record
    newInst.forEach(inst => {
      if (inst.currentStatus === "defective") {
        const action = inst.defects?.[0]?.action || "";
        if (action === "rework") {
          inst.currentStage = "cutting";
          inst.currentStatus = "rework";
        } else if (action === "writeoff") {
          inst.currentStatus = "written_off";
          inst.writeoffRequiresReplacement = true;
        } else if (action === "use_as_is") {
          inst.currentStage = "cutting";
          inst.currentStatus = "pending_pe_approval";
        }
      }
    });
    // Tag instances to drawing instances
    // Each drawing in this release has one drawing instance per unit
    // For cutting, we find the drawing instances that are "released" for this drawing
    const taggedNewInst = newInst.map(inst => {
      if (!inst.drawingId||!inst.orderId) return inst;
      // Find released drawing instances for this drawing
      const diForDrawing = (drawingInstances||[]).filter(di=>
        di.drawingId===inst.drawingId && di.orderId===inst.orderId &&
        (di.status==="released"||di.status==="in_production")
      ).sort((a,b)=>a.instanceNo-b.instanceNo);

      if (diForDrawing.length===0) return inst;

      // If only one instance, auto-assign
      if (diForDrawing.length===1) {
        return {...inst, drawingInstanceId:diForDrawing[0].id,
          drawingInstanceNo:diForDrawing[0].instanceNo,
          drawingInstanceTotal:diForDrawing[0].totalInstances};
      }

      // Multiple instances — will be tagged by operator (stored as "untagged" for now)
      // Operator can tag from the completed tab
      return {...inst, drawingInstanceId:"untagged",
        availableDrawingInstances:diForDrawing.map(di=>({id:di.id,instanceNo:di.instanceNo,total:di.totalInstances}))};
    });

    setInstances(prev=>[...prev,...taggedNewInst]);

    // Update drawing instances to in_production
    const affectedDIs = new Set(taggedNewInst.map(i=>i.drawingInstanceId).filter(id=>id&&id!=="untagged"));
    if (affectedDIs.size>0 && setDrawingInstances) {
      setDrawingInstances(prev=>prev.map(di=>
        affectedDIs.has(di.id) ? {...di, status:"in_production"} : di
      ));
    }

    // Update stock lot wtConsumed (sections only; plates calculated from dims)
    const wtConsumed = barForm.isPlate ? 0 :
      included.reduce((s,p)=>
        s+((p.length||0)/1000)*(barForm.wtPerMetre||0)*((+p.goodQty||0)+(p.defects||[]).length), 0);
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
      const parentRmUnitId = `${normRmMatCode(selRun.materialCode)}/${selBarRef}`;
      const existingOcsFromUnit = stock.filter(s=>s.parentRmUnitId===parentRmUnitId).length;
      const ocSeq = existingOcsFromUnit + 1;
      const offcutSequence = `OC-${ocSeq}`;
      newOcId = `${parentRmUnitId}/${offcutSequence}`;
      const ocItemCode = barForm.isPlate
        ? `${selRun.materialCode}/${barForm.offcutLength}X${barForm.offcutWidth}`
        : `${selRun.materialCode}/${barForm.offcutLength}`;
      setStock(prev=>[...prev,{
        id:newOcId, lotNo:genLotNo(stock||[]),
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
        parentRmUnitId, offcutSequence,
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
          const defQty = p.plannedQty - (+p.goodQty||0);
          const totalAccounted = (+p.goodQty||0)+(p.defects||[]).length;
          const short = p.included && totalAccounted < p.plannedQty;
          const over  = p.included && (+p.goodQty||0) > p.plannedQty;
          const repl  = defQty>0 ? findReplacement(p) : null;
          return (
            <div key={i} style={{ ...css.card,marginBottom:10,
              borderLeft:`3px solid ${defQty>0?T.red:p.included?T.green:T.border}` }}>
              {/* Part header row */}
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                <label style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer" }}>
                  <input type="checkbox" checked={p.included}
                    onChange={e=>updatePart(i,"included",e.target.checked)} />
                  <span style={{ fontWeight:800,fontSize:14 }}>{p.markNo}</span>
                  {p.desc&&<span style={{ fontSize:12,color:T.textMid }}>— {p.desc}</span>}
                </label>
              </div>
              <div style={{ fontSize:11,color:T.textMid,paddingLeft:24,marginTop:2,marginBottom:p.included?10:0 }}>
                {p.drawingNo&&<span>Drawing: {p.drawingNo} · </span>}
                Planned: <strong>{p.plannedQty}</strong> pcs
                {p.length>0&&<span> · Length: <span style={{fontFamily:T.fontMono}}>{p.length}mm</span></span>}
              </div>

              {/* Good pieces cut + auto defective count */}
              {p.included&&(
                <div style={{ display:"flex",gap:12,alignItems:"flex-end",paddingLeft:24,flexWrap:"wrap" }}>
                  <Field label="Good Pieces Cut">
                    <Input type="number" min={0} max={p.plannedQty} value={p.goodQty??p.plannedQty}
                      onChange={e=>handleGoodQtyChange(i,+e.target.value,p)}
                      style={{ width:80 }} />
                  </Field>
                  {defQty>0&&(
                    <div style={{ paddingBottom:6 }}>
                      <div style={{ fontSize:10,color:T.textMid,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:3 }}>Defective</div>
                      <div style={{ fontSize:16,fontWeight:800,color:T.red }}>{defQty} pc{defQty!==1?"s":""}</div>
                    </div>
                  )}
                  {short&&(
                    <Field label="Reason for short qty *" required>
                      <Input value={p.shortReason} onChange={e=>updatePart(i,"shortReason",e.target.value)}
                        placeholder="e.g. Material insufficient on this bar"
                        style={{ minWidth:240,borderColor:!p.shortReason?T.red:T.border }} />
                    </Field>
                  )}
                  {over&&<div style={{ fontSize:12,color:T.amber,fontWeight:700,paddingBottom:6 }}>
                    ⚠ Good qty exceeds planned qty
                  </div>}
                </div>
              )}

              {/* Defective piece details — one row per defective piece, auto-shown */}
              {p.included&&defQty>0&&(
                <div style={{ paddingLeft:24,marginTop:10 }}>
                  <div style={{ fontSize:12,fontWeight:700,color:T.red,marginBottom:8 }}>
                    {defQty} defective piece{defQty!==1?"s":""} — record details for each:
                  </div>
                  {(p.defects||[]).map((d,di)=>(
                    <div key={di} style={{ background:T.bgInput,border:`1px solid ${T.red}33`,borderRadius:6,padding:"10px 12px",marginBottom:8 }}>
                      <div style={{ fontSize:11,color:T.textMid,fontWeight:700,marginBottom:6 }}>Defective Piece {di+1}</div>
                      <div style={{ display:"flex",gap:10,flexWrap:"wrap",marginBottom:8 }}>
                        <Field label="Defect Type">
                          <Sel value={d.defectType||"dimensional"} onChange={e=>{const nd=[...(p.defects||[])];nd[di]={...nd[di],defectType:e.target.value};updatePart(i,"defects",nd);}} style={{width:160}}>
                            <option value="dimensional">Dimensional</option>
                            <option value="surface">Surface</option>
                            <option value="wrong_cut">Wrong Cut</option>
                            <option value="damaged">Damaged</option>
                            <option value="wrong_dimension">Wrong Dimension</option>
                            <option value="other">Other</option>
                          </Sel>
                        </Field>
                        <Field label="Defect Reason *" required>
                          <Input value={d.reason||""} onChange={e=>{const nd=[...(p.defects||[])];nd[di]={...nd[di],reason:e.target.value};updatePart(i,"defects",nd);}}
                            placeholder="Describe the defect"
                            style={{ minWidth:220,borderColor:!d.reason?T.red:T.border }} />
                        </Field>
                      </div>
                      <div>
                        <label style={css.label}>Action Required *</label>
                        <div style={{ display:"flex",gap:16,flexWrap:"wrap",marginTop:4 }}>
                          {[["rework","Rework (re-cut)"],["writeoff","Write-off (scrap)"],["use_as_is","Use as-is (PE approval)"]].map(([val,lbl])=>(
                            <label key={val} style={{ display:"flex",alignItems:"center",gap:5,cursor:"pointer",fontSize:12,
                              color:d.action===val?T.text:T.textMid }}>
                              <input type="radio" checked={d.action===val}
                                onChange={()=>{const nd=[...(p.defects||[])];nd[di]={...nd[di],action:val};updatePart(i,"defects",nd);}} />
                              {lbl}
                            </label>
                          ))}
                        </div>
                        {!d.action&&<div style={{ fontSize:11,color:T.red,marginTop:4 }}>Select an action</div>}
                      </div>
                    </div>
                  ))}
                  {repl
                    ? <div style={{ padding:"8px 12px",background:T.greenBg,border:`1px solid ${T.green}`,
                        borderRadius:6,fontSize:12,color:T.green }}>
                        ✓ Replacement available: Off-cut <strong style={{fontFamily:T.fontMono}}>{repl.lotNo}</strong> ({repl.offcutLength}mm) — can yield a replacement piece of <strong>{p.markNo}</strong> ({p.length}mm required).
                      </div>
                    : <div style={{ padding:"8px 12px",background:T.amberBg,border:`1px solid ${T.amber}`,
                        borderRadius:6,fontSize:12,color:T.amber }}>
                        ⚠ No matching off-cut for <strong>{p.markNo}</strong> — a new nesting run will be required.
                      </div>
                  }
                </div>
              )}

              {/* Piece marking — only shown when there are good pieces */}
              {p.included && (+p.goodQty||0)>0 && (() => {
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
                          Mark No stamped on all {+p.goodQty||p.plannedQty} piece{(+p.goodQty||p.plannedQty)!==1?"s":""}
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
          {(()=>{
            // Calculate expected offcut from nesting batch
            const batch = (nestingBatches||[]).find(b=>(b.lots||[]).some(l=>(l.sheets||[]).some(s=>s.rmUnitId===selBarRef)));
            const lot2 = batch ? (batch.lots||[]).find(l=>(l.sheets||[]).some(s=>s.rmUnitId===selBarRef)) : null;
            const sheet = lot2 ? (lot2.sheets||[]).find(s=>s.rmUnitId===selBarRef) : null;
            const sheetDim = sheet?.sheetDim||selBarRef?.split("/").slice(-2,-1)[0]||"";
            const dimParts = sheetDim.split(/[Xx×]/);
            const sheetL = parseFloat(dimParts[0])||0;
            const sheetW = parseFloat(dimParts[1])||0;
            const sheetAreaMm2 = sheetL * sheetW;
            const utilisPct = sheet?.utilisPct||0;
            const expectedOffcutMm2 = utilisPct>0 ? sheetAreaMm2 * (1 - utilisPct/100) : 0;
            const expectedOffcutM2 = expectedOffcutMm2/1e6;
            // Actual entered offcut area
            const enteredL = parseFloat(barForm.offcutLength)||0;
            const enteredW = parseFloat(barForm.offcutWidth)||0;
            const enteredAreaMm2 = barForm.isPlate ? enteredL*enteredW : 0;
            const variancePct = expectedOffcutMm2>0 ? ((enteredAreaMm2-expectedOffcutMm2)/expectedOffcutMm2*100) : null;
            return (
              <>
                {expectedOffcutMm2>0&&(
                  <div style={{ marginBottom:12, padding:"8px 12px", background:T.bg, borderRadius:6, border:`1px solid ${T.border}`, fontSize:11 }}>
                    <div style={{ fontWeight:700, color:T.textMid, marginBottom:4 }}>EXPECTED OFFCUT (from nesting)</div>
                    <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
                      <span style={{ color:T.textMid }}>Sheet: <span style={{ fontFamily:T.fontMono, color:T.text }}>{sheetDim}</span></span>
                      <span style={{ color:T.textMid }}>Utilisation: <span style={{ fontFamily:T.fontMono, color:T.accent }}>{utilisPct}%</span></span>
                      <span style={{ color:T.textMid }}>Expected remaining: <span style={{ fontFamily:T.fontMono, color:T.amber, fontWeight:700 }}>{expectedOffcutM2.toFixed(2)} m² ({Math.round(expectedOffcutMm2).toLocaleString()} mm²)</span></span>
                    </div>
                    {barForm.hasOffcut&&enteredAreaMm2>0&&variancePct!==null&&(
                      <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ color:T.textMid }}>You entered: <span style={{ fontFamily:T.fontMono, color:T.text }}>{(enteredAreaMm2/1e6).toFixed(2)} m²</span></span>
                        <span style={{ fontFamily:T.fontMono, fontWeight:700, color:Math.abs(variancePct)<=15?T.green:Math.abs(variancePct)<=30?T.amber:T.red }}>
                          {variancePct>0?"+":""}{variancePct.toFixed(1)}% vs expected
                        </span>
                        {Math.abs(variancePct)>30&&<span style={{ color:T.red, fontSize:10 }}>⚠ Large variance — double check</span>}
                      </div>
                    )}
                  </div>
                )}
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
              </>
            );
          })()}
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
export {
  // Tab components for OrderDetail
  TabQuality, TabMaterialBalance, TabFinance,
  // Helper functions
  migrateDrawingInstances, buildDefaultProcessSteps, getDIPipelineNext, getPipelineLabel,
  genLotNo, buildRmUnitId, buildOffcutRmUnitId, parseRmUnitIdNew,
  // Constants
  STAGE_NEXT, STAGE_CHECKLISTS, SUPERVISOR_STAGES, DEFAULT_PIPELINE_STEPS,
  DEFAULT_PROCESS_TYPES, OUTBOUND_TASKS, OUTBOUND_TYPES, TPI_STAGES, STAGE_OPTS,
  STAGE_SEQ_LABELS, SUBOPS_CUT, SUBOPS_WELD, ROLE_STAGE_MAP,
  SECTION_PREFIX, PRI_BADGE, TIER_COLOR, STAGE_COLS, EXTRA_STEP_TYPES,
  DSC_STAGE_LABELS, QC_PROCESS_TYPES, STAGE_TO_PROCESS,
  // Components
  TpiQcPanel, OrderProgressTracker,
  CuttingConfirmation, DrawingAssignment, StageWorkerQueue,
  ContractorWorkQueue, SupervisorQueue, DrawingProgressGrid,
  OutboundProcessing, PipelineEditorModal, ProductionReleaseWizard,
  MachineOperatorQueue, MDCCModule, DispatchModule, OutboundQcPanel,
  QcAdminScreen, RmUnitGroupRow, DPR_STAGE_META, DPR_STAGES_ORDER,
  ProductionEngineerScreen, BlastPaintContractorQueue, ProductionModule,
  ProductionDrawingRegister, DrawingStatusCard, StepConfigModal,
};
