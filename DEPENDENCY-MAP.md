# STRUCTO ERP — DEPENDENCY MAP
# Version 2.5 — April 2026
# Session 4 Phase 4 — Purchase module fixes: GRN reversal, rate entry, GRN redesign, lot weight exclusions
# Updated:
#   FIX 1 — GRN REVERSAL (reverseGRN in PODetail):
#     OLD: setStock(prev => prev.filter(s => s.grnId !== grnId))  [DELETE]
#     NEW: setStock(prev => prev.map(s => s.grnId !== grnId ? s : { ...s, status:'rejected',
#              wtAvailable:0, rejectedAt, rejectedBy, rejectionReason:'GRN reversed', grnReversed:true }))
#     NEW lot fields on reversal: lot.rejectedAt (ISO string), lot.rejectedBy (user.name),
#              lot.rejectionReason (string), lot.grnReversed (boolean true)
#     Toast updated: "GRN reversed — lots marked rejected (material remains in yard)"
#     stCol map: added rejected:"red", returned:"gray"
#     Stock filter tabs: added ['rejected','Rejected'] tab
#     Stock lot actions: added Return to Vendor + Re-inspect buttons for rejected lots
#     Return to Vendor: sets lot.status='returned', stores returnDate/vehicleNo/returnChallan/remarks
#
#   FIX 2 — RATE MANDATORY ON PO CREATION:
#     Single PR → PO modal (convertSingleModal):
#       csf.lineRates: { "${li}-${di}": rate } — per-dimension rate storage in convertSingleForm
#       csf.rates: { [matCode]: rate } — group-level rate (auto-fills non-manual per-line)
#       Changing first dim (di===0) auto-fills all other dims in same matCode group
#       manualRate per-line flag: prevents group auto-fill from overwriting explicit entries
#       anyRateZero: disables Create PO button; red border on zero-rate inputs
#     Combine PRs modal (combineModal):
#       combineForm.rates: { [matCode]: rate } — per-matCode rate input section added
#       Create PO disabled when any matCode rate is zero/missing
#     saveSingleConvertPO: rate = lineRates[`${li}-${di}`] ?? rates[matCode]
#     createCombinedPO: pricingMethod:"PerKg", unitPrice, totalPrice saved per line
#     po.totalValue: now computed and saved (allLines.reduce totalPrice sum)
#
#   FIX 3 — GRN REDESIGN (PODetail.saveGRN and GRN modal):
#     grnGroupRates state: { [matCode]: groupRate } — new in PODetail, cleared on GRN close
#     grnForm.lines[] NEW FIELDS:
#       .checked (boolean, default true) — whether line is included in this receipt
#       .rcvgQty (number) — qty being received in this GRN (≤ balance qty)
#       .rate (number) — unit price ₹/kg for this line (from PO line unitPrice or manual)
#       .manualRate (boolean) — true = user typed rate manually (don't auto-fill from group)
#       .lineValue (number) — actualWt × rate rounded to 2dp
#     GRN modal: 3-section design:
#       Section A — Header: date picker, GRN No preview, vehicle, challan, DC no, supplier invoice
#       Section B — MTC Definition: MTC-N labels, quick-assign buttons per matCode and for all
#       Section C — Excel-like table grouped by matCode:
#         Group header: matCode | N lines | PO wt | Rate input → Apply to group
#         Columns: ☑ | Dimensions | PO Qty | Rcvg Qty | Calc Wt | Actual Wt | Variance | MTC | Rate | Value
#     Totals footer: checked line count, calc wt, actual wt, variance, total value
#     "Confirm GRN (N lines)" button
#     saveGRN: filters checked!==false && actualWt>0; uses rcvgQty for qty tracking
#     newGrn.totalActualWt: sum of checked lines actualWt
#     buildStockLots UPDATED:
#       wtReceived: l.actualWt||l.wtReceived (was l.wtReceived only)
#       wtAvailable: l.actualWt||l.wtReceived (was l.wtReceived)
#       lot.unitPrice: l.rate||0 — NEW field on lot
#       lot.lineValue: l.lineValue||Math.round(wt*rate*100)/100 — NEW field on lot
#     GRN display (GRNs tab) UPDATED:
#       Lines table: added Rate ₹/kg and Value ₹ columns; totals footer row
#       MTCs table: shown below lines when grn.mtcs.length>0
#       Weight summary: Received/Rejected+Returned/Net Good from stock lots by grnId
#
#   FIX 4 — REJECTED LOT WEIGHT EXCLUDED FROM CALCULATIONS:
#     activeLotWt helper: (lot) => ['rejected','returned','written_off'].includes(lot.status) ? 0 : (lot.wtAvailable||0)
#     MRP stockAvail (~line 3461): now filters out rejected/returned/written_off lots before summing wtAvailable
#     OrderProgressTracker receivedKg (~line 10196):
#       OLD: orderLots.reduce((s,l)=>s+(l.kg||l.weightKg||0))  [wrong field]
#       NEW: orderLots filtered !['rejected','returned','written_off'].includes(l.status)
#            then .reduce((s,l)=>s+(l.wtReceived||0))  [correct field]
#
# Prior: v2.4 — OrderProgressTracker full redesign + buildStockLots size fix
# Updated:
#   ORDER PROGRESS TRACKER REDESIGN:
#     New stage IDs (replaces old stageGroups):
#       Procurement: mrp_released, rm_ordered, rm_received, rm_qc,
#                    nesting_planned, nesting_confirmed
#       Production:  cutting_done (merged cutting+cutting_qc), fit_up, tpi_fitup,
#                    welding, tpi_weld, [assembly], blasting, tpi_blast
#       Paint:       paint_coat_N, tpi_paint_N (per coat)
#       Completion:  mdcc_applied, mdcc_received, dispatch
#     Removed: cutting_qc from tracker (still in production workflow/STAGE_NEXT)
#     NEW: buildStageList(ord) → { stages, stageGroups } inside component
#     NEW: calcWeightProgress(stage) → { doneKg, totalKg, pct, status }
#     NEW: calcDrawingProgress(stage) → { done, total, pct, status }
#     NEW: progressView state ('weight'|'drawing') — toggle UI in JSX
#     NEW: [Weight %] [Drawing Count] toggle buttons before stage groups
#     Overall %: last paint coat tpi_done_wt.pct (weight-based), fallback to stage ratio
#     mrp_released: auto-derives from nestingBatches[].lots[].allParts vs order markNos
#       (no Mark Done button — manual:true removed; pm.mrp_done still accepted as fallback)
#     Calc types: binary | po_wt | lots_wt | rm_qc_wt | nesting_wt | nest_bch_wt |
#                 cutting_wt | prod_step_wt | tpi_done_wt | dispatch_wt
#     autoComplete on TPI stages when !tpiHolds.has(stage) → shows ➖ "No TPI Required"
#     Icons: ✅ completed | ⚡ in_progress | ⏳ not_started | ➖ autoComplete
#     Subtext: kg/kg (weight view) or N/N drawings (drawing view)
#     handleExport: uses calcWeightProgress or calcDrawingProgress per progressView
#     Stats row: DRAWINGS count | TOTAL WEIGHT (kg) | STAGES DONE (weight-based count)
#   PROPS (unchanged from v2.3, added in prior session):
#     OrderProgressTracker: order, onChange, user, pos, stock, nestingBatches,
#                           releases, instances, purchaseReqs, onBack
#   buildStockLots SIZE NORMALIZATION:
#     lot.size: poLine.size.replace(/mm$/i,'')+'mm' — ensures consistent "mm" suffix
#       e.g. "100" → "100mm", "100mm" → "100mm", "100MM" → "100mm"
#
# Prior: v2.3 — CSV normalization + GRN header-level MTC entry
# Updated:
#   CSV NORMALIZATION (FIX 1 — handleNestImport):
#     matCode: .trim() applied after col() lookup
#     sheetDim: .trim().toUpperCase() — '1500x9200' and '1500X9200' now merge
#     sheetNo: parseInt + .toString().trim() before grouping
#     Effect: duplicate dimension groups from case variants are eliminated
#   GRN MTC HEADER ENTRY (FIX 2):
#     grnForm.mtcs = [{id, mtcNo, heatNo, grade, driveLink}] — new header-level array
#     GRN modal: new "Mill Test Certificates" section with [+ Add MTC] / delete buttons
#     Each GRN line: mtcId dropdown (from grnForm.mtcs) auto-fills heatNo on selection
#     "Apply MTC-1 to all lines" shortcut button when ≥1 MTC defined
#     buildStockLots: lot.heatNo/mtcNo/mtcDoc/mtcUploaded inherited from assigned MTC
#       (falls back to l.heatNo if no MTC assigned — backward compat)
#     NEW lot field: lot.mtcNo (string) — MTC document number
#     NEW lot field: lot.mtcDoc — now set from MTC.driveLink at GRN save (was hardcoded "")
#     lot.mtcUploaded: now true when MTC.driveLink present (was hardcoded false)
#     RM QC inspect button: pre-fills form.mtcLink/heatNo/mtcNo from lot at open time
#     Inspection modal: MTC fields shown read-only when pre-filled; [Override MTC] unlocks
#     doQC: now saves form.mtcNo back to lot.mtcNo (alongside existing mtcDoc/heatNo save)
#
# Prior: v2.2 — single-PR convert modal stays on Requisitions tab
#   PERSISTENCE (FIX 1):
#     nestingBatches → localStorage key 'structo_nestingBatches' (was in-memory only)
#     instances      → localStorage key 'structo_instances'
#     releases       → localStorage key 'structo_releases'
#     qcRules        → localStorage key 'structo_qcRules'
#     overrideLog    → localStorage key 'structo_overrideLog'
#     issueRequests  → localStorage key 'structo_issueRequests'
#     welders        → localStorage key 'structo_welders' (fallback: WELDERS_SEED)
#     machines       → localStorage key 'structo_machines' (fallback: MACHINES_SEED)
#   STALE PR DETECTION (FIX 1):
#     prForBatch: now excludes status='stale' and status='cancelled'
#     handleNestImport + handleConfirmBatch: marks matching PRs stale (>24h, not converted)
#       pr.status = 'stale', pr.staleReason = 'source batch reimported'
#     MRPNestExport now receives setPurchaseReqs prop for stale marking
#     Requisitions tab: prStatusBadge includes stale:'red'
#   VENDOR DROPDOWNS (FIX 2):
#     MRPModule now receives vendors + setMod props
#     PurchaseModule now receives setMod prop
#     All vendor fields (convertPoModal, new_po modal, combine modal) show all active vendors
#       sorted alphabetically; include '+ Add New Vendor' option → setMod('masters')
#     vendorType filter removed from all PO vendor dropdowns
#   PO LINES (FIX 3 — already complete from ef4ec38):
#     convertPoModal (MRP): flatMap over pr.lots × lot.lines, weight per sheet calculated
#     Purchase 'Convert to PO' button: flatMap + weight calculation
#     createCombinedPO: flatMap over all selected PRs × lots × lines + weight
#     PODetail gate: po.sourceType==='nesting' OR po.lines.some(l=>l.prId)
#   MULTI-PR COMBINE (FIX 4 — already complete from 4ec0b7b):
#     selectedPrs state + checkboxes on pending PR cards
#     Sticky combine bar (≥2 selected) → combine modal → createCombinedPO
#     po.prIds = array of all included PR ids; each PR.status = 'converted', PR.poId = newPoId
#     createCombinedPO: STAYS on Requisitions tab (removed setPurTab/setSelected calls)
#   SINGLE PR CONVERT (Part 4):
#     convertSingleModal state (PR object) + convertSingleForm state (vendorId/poDate/notes/rates)
#     saveSingleConvertPO: flatMap pr.lots × l.lines → per-dimension PO lines with weight + rate
#     Modal: vendor dropdown (all active vendors A-Z + Add New Vendor), PO date, notes,
#       read-only lines table grouped by matCode with ₹/kg input per group + group total
#     STAYS on Requisitions tab after creation
#     Old "Convert to PO" path (setForm + setModal("new_po") + setPurTab) removed
#
# Prior: v2.2 — single-PR convert modal stays on Requisitions tab
# Prior: v2.0 — consumables, parseNestingMatCode, nestingSheetWt, single+combined PO creation
# Prior: v1.9 — rmUnitId fractions, normRmMatCode, off-cut fields, PR/PO badges, discard flow
#
# INSTRUCTIONS FOR CLAUDE CODE:
# Before changing ANY field, function, or data structure,
# find it in this map and update ALL listed dependent locations.
# After completing work, update this map with any new dependencies.
#
# FORMAT:
#   OBJECT.field
#     READS:    modules/functions that read this field
#     WRITES:   modules/functions that write this field
#     DISPLAYS: UI components that show this field
#     TRIGGERS: what happens when this field changes
#     IF CHANGED: what else must be updated

# ═══════════════════════════════════════════════════════════════════
# ORDER OBJECT
# ═══════════════════════════════════════════════════════════════════

order.id (e.g. SF-2026-4693)
  READS:   PO creation, Production release, GRN, Stock reservation, MRP Planning
  WRITES:  Auto-generated on order save
  DISPLAYS: Order list, Order header, PO form, Stock lot tags, Production register
  IF CHANGED: Cascade update all linked POs, GRNs, lots, releases, instances

order.status (Active | On Hold | Cancelled | Complete)
  READS:   Orders list filter, Production drawing register filter, MRP Planning
  WRITES:  Order detail status toggle, Cancel Order (super_admin only)
  DISPLAYS: Orders list badge, Order header badge
  TRIGGERS: Cancelled → hide from production and MRP, mark instances inactive
  IF CHANGED: Verify cancelled orders still visible to Finance for invoice history

order.assemblyInspectionRequired (boolean)
  READS:   Order tab visibility — controls whether Assemblies tab shows
           Production drawing register — assembly group column visibility
           Assembly step insertion logic — per drawing
  WRITES:  Order Basic Details tab — Assembly Inspection Required toggle
  DISPLAYS: Basic Details tab — toggle field
  TRIGGERS: true → Assemblies tab becomes visible in order and production
             false → Assemblies tab hidden, no assembly step for any drawing in order
             false → Assembly Group column in production register shows N/A for all drawings
  IF CHANGED: If changed to false after assemblies defined — warn user, all assembly
             definitions and drawing assignments will be deactivated

order.assemblies (array of assembly objects)
  READS:   Production drawing register — assembly group per drawing
           Assembly stage gate logic — which drawings must complete together
           Assembly stage screen — group display
           Drawing Register tab — assembly dropdown options
           Step configuration screen — read-only assembly info per drawing
  WRITES:  Order Assemblies tab — add/edit/delete assemblies
           Drawing Register tab — assembly dropdown per drawing row
  DISPLAYS: Order Assemblies tab, Drawing Register — Assembly Group column,
             Production cross-order register — Assembly Group column,
             Assembly stage screen — group headers,
             Contractor dashboard — assembly group indicator per drawing
  TRIGGERS: Assembly created → drawing register shows new option in assembly dropdown
             Drawing assigned to assembly → drawing gets Assembly step in sequence
             Drawing removed from assembly → Assembly step removed from sequence
             All drawings in group reach Weld QC Cleared → Assembly stage activates
  HARD GATE: All drawings in same assembly must reach Weld QC Cleared before any
             can proceed to Assembly stage
  IF CHANGED: If assembly deleted after production started — warn, check active instances

order.assemblies[].tpiRequired (boolean per assembly)
  READS:   Assembly stage gate — TPI gate for this specific assembly
  WRITES:  Order Assemblies tab — TPI Required toggle per assembly
  DISPLAYS: Assembly stage screen — TPI Required banner per group
  TRIGGERS: true → TPI hard gate added at Assembly stage for this assembly's drawings
             false → internal sign-off only at Assembly stage
  IF CHANGED: If changed after assembly stage is active — re-evaluate current gate status

order.quality.tpiRequired (boolean — overall order level)
  READS:   Production stage gate logic — every stage transition check
  WRITES:  Order Quality tab
  DISPLAYS: Order Quality tab, production instance stage gate banners
  TRIGGERS: true → check tpiHoldPoints for each stage transition
  IF CHANGED: All active instances must re-evaluate current gate status
  NOTE: Assembly TPI is controlled separately in order.assemblies[].tpiRequired

order.quality.tpiHoldPoints (array: rm_inspection|fit_up|welding|blasting|painting)
  READS:   Production stage gate — specific stage transition checks
  WRITES:  Order Quality tab — checkboxes (now 5 options including fit_up and blasting)
  DISPLAYS: Order Quality tab, instance detail stage gate banner
  TRIGGERS: Adding hold point → retroactively gates active instances at that stage
  IF CHANGED: Check all active instances at that stage — may now need TPI approval

order.quality.paintSpec (array of coat objects)
  READS:   Painting stage QC checklist — required DFT shown
  WRITES:  Order Quality tab — paint specification
  DISPLAYS: Painting QC modal — required DFT per coat
  IF CHANGED: Active painting instances must show updated spec

order.transport (scope, transporter, vehicleType, freightEstimate, etc.)
  READS:   Dispatch module — freight line item determination
  WRITES:  Order Transport tab
  DISPLAYS: Order Transport tab, Dispatch challan header
  IF CHANGED: No cascade — reference data only

order.milestones (array)
  READS:   Finance module — invoice schedule
  WRITES:  Order Payment Milestones tab
  DISPLAYS: Finance tab, Milestones tab
  IF CHANGED: Recalculate invoice schedule, verify % sum = 100

# ═══════════════════════════════════════════════════════════════════
# DRAWING OBJECT
# ═══════════════════════════════════════════════════════════════════

drawing.receivedDate
  READS:   Production drawing register — eligible drawings filter
           Cross-order register — Active vs Pending status
           MRP Planning — eligible drawings for nesting batch
  WRITES:  Drawing Register tab, CSV import col "Received Date"
  DISPLAYS: Drawing Register table, Production register Status badge
  TRIGGERS: Set → status Active → drawing appears in Production and MRP planning
  IF CHANGED: If cleared → drawing disappears from Production and MRP immediately

drawing.assemblyGroup (string: "Assembly 1" | "Assembly 2" | "")
  SOURCE:  Populated from order.assemblies definitions — NOT set in production
  READS:   Assembly stage gate logic
           Cross-order register filter — filter by assembly
           Assembly stage screen — group display
           Step configuration — read-only display
  WRITES:  Order Assemblies tab — drawing assignment to assembly
           Drawing Register tab — assembly dropdown per drawing row (same data)
  DISPLAYS: Drawing Register table — Assembly Group column
             Cross-order production register — Assembly Group column
             Step configuration — read-only assembly info
             Contractor dashboard — assembly group per drawing
  TRIGGERS: Set → Assembly step automatically inserted between Welding and Blasting
             Set → assembly gate logic activates for this drawing
             Blank → no Assembly step, direct Welding QC to Blasting
  IF CHANGED: Re-evaluate all active instances for this drawing
  IMPORTANT: Production Engineer cannot change this — it is set at order level only

drawing.poLineItem (number)
  READS:   Dispatch challan, Invoice line items
  WRITES:  Drawing Register tab, CSV import col "PO Line Item"
  DISPLAYS: Drawing Register table — PO Line column
  IF CHANGED: Update dispatch challan template

drawing.productionSteps (array of step objects — generated by Release Wizard)
  *** WRITTEN by Release Wizard confirm() — NOT by a separate step-config modal ***
  SHAPE:  Each step object: { stage, status, completedAt, completedBy, ... }
          Stages generated in order:
            nesting → cutting → cutting_qc → [secondary_ops if secOps] →
            fit_up → welding → blasting → paint_coat_1..N → mdcc → dispatch
          Cutting step includes: { machineId, operatorId, rmUnits:[] }
          Fit-up / welding / blasting steps include: { contractorId, tpiRequired, tpiOfferedAt, tpiDoneAt, tpiIrn }
          Paint steps include: { coatName, contractorId, tpiRequired, tpiOfferedAt, tpiDoneAt, tpiIrn }
          secondary_ops step includes: { ops: ['Bevel','Drill',...] }
  READS:   ContractorWorkQueue — visible stages per drawing
           StepConfigModal (~line 12169) — existingSteps default
           Production register — stage indicator
           QC alert chain — which QC type at each stage
           Instance stage progression — next stage
  WRITES:  Release Wizard confirm() via buildProductionSteps() — written to order.drawings[].productionSteps
           StepConfigModal onSave — can override per drawing
  DISPLAYS: Instance detail timeline, Contractor dashboard stage indicator
  TRIGGERS: Written at wizard confirm → contractor dashboard shows correct stage sequence
             secondary_ops step present → secondary machine assignment visible in Step 4
  NOTE: Assembly step is NOT auto-inserted here — it is derived from drawing.assemblyGroup
        getPaintCoats(order.quality) determines how many paint_coat_N steps are generated
        buildProductionSteps reads: order.quality.tpiHoldPoints, order.quality.paintSpec,
          contAsgn[drawing.id].contractorId, machineAsgn[matCode].machineId
  IF CHANGED: Warn if instances are already past the modified step
  NEVER READ from CSV — set only via UI (wizard confirm or step-config modal)

drawing.qty (total units to fabricate)
  READS:   Production Step 1 — release qty selector max
           MRP Planning — total RM requirement
           Instance creation — instances per part
  WRITES:  Drawing Register tab, CSV import
  DISPLAYS: Drawing Register table, Production Step 1
  IF CHANGED: Recalculate MRP requirements, check open POs

# ═══════════════════════════════════════════════════════════════════
# DRAWING PART OBJECT
# ═══════════════════════════════════════════════════════════════════

part.requiredOps (array: Cut|Bevel|Drill|Grind|Mark|Notch)
  READS:   Release Wizard Step 4 — secondary assignment trigger and capability warning
           buildProductionSteps — determines secondary_ops step + ops list
           Cutting confirmation — sub-stage checkboxes
           Step configuration modal — per part confirmation display
  WRITES:  Drawing Part List tab (initial hint value)
           CSV import col "Required Ops" (initial hint value)
           Release Wizard confirm() — FIX 2 writes confirmedOps back to part.requiredOps
             (this is the BINDING write — overwrites the hint with confirmed value)
  DISPLAYS: Drawing Part List table — Req Ops badges
             Release Wizard Step 4 — capability warning per matCode
             Cutting confirmation — operation checkboxes
  TRIGGERS: Drill confirmed → secondary_ops step added to drawing.productionSteps
             Drill confirmed → Step 4 secondary assignment row shown for drill
             Drill confirmed AND machine has no drill cap → amber warning in Step 4
  NOTE: Value at CSV import is a HINT only
        BINDING value is written at Release Wizard confirm() from confirmedOps state
        After wizard confirm, part.requiredOps is the authoritative operations list
  IF CHANGED: Re-evaluate machine assignments for active releases
  FLOW: CSV import → part.requiredOps (hint) → Wizard Step 4 confirm checkboxes →
        confirm() writes confirmed value back → part.requiredOps (binding)

part.drawingLineItem (number)
  READS:   QC inspection reports, NCR records, MDCC dossier
  WRITES:  Drawing Part List tab, CSV import col "Drawing Line Item"
  DISPLAYS: Drawing Part List table — Line column (first column)
  IF CHANGED: Update existing inspection records referencing this part

part.fabType (Fabricate | Bought Out)
  READS:   RM requirement calculation — Fabricate only
           Instance creation — Fabricate only
           MRP Planning nesting — Fabricate only
           Required Ops — Bought Out shows no ops
  WRITES:  Drawing Part List tab, CSV import col "Fab/BO"
  DISPLAYS: Drawing Part List table — Fab/BO badge
  TRIGGERS: Fabricate → included in RM calc and nesting
             Bought Out → excluded, check stores separately
  IF CHANGED: Recalculate RM requirements

part.clientTotalWt
  READS:   Drawing total weight, MRP RM requirement (kg), PO verification
  WRITES:  Drawing Part List tab, CSV import
  DISPLAYS: Drawing Part List table — CLIENT WT
  IF CHANGED: Recalculate drawing total and order total weights

part.matCode (derived: matType+grade+sectionType+size)
  READS:   MRP RM grouping for nesting lots
           Stock reservation matching
           Production nesting panel — groups by matCode
  WRITES:  Derived — auto-calculated
  DISPLAYS: Drawing Part List table — Material Code column
  TRIGGERS: Determines which nesting lot this part belongs to
  IF CHANGED: Check active nesting lots — part may need different lot

# ═══════════════════════════════════════════════════════════════════
# STOCK LOT OBJECT
# ═══════════════════════════════════════════════════════════════════

lot.status (qc_hold | available | reserved | partially_reserved | allocated | issued | consumed | written_off | pending_offcut_verification | rejected | returned)
  *** CORRECTED: Release Wizard writes 'reserved' not 'allocated' — see lot.reservedFor ***
  *** NEW STATUS: partially_reserved — lot split across multiple orders via GRN auto-reservation ***
  *** NEW STATUS: rejected — GRN reversed (lot stays in yard but excluded from all calculations) ***
  *** NEW STATUS: returned — lot sent back to vendor after rejection ***
  FULL STATUS LIFECYCLE:
    GRN created               → qc_hold
    RM QC approved            → qc_hold (unchanged — needs client inspection too)
    Client inspection approved (no reservations) → available
    Client inspection approved (1 reservation)   → reserved
    Client inspection approved (2+ reservations) → partially_reserved
    Release Wizard confirm()  → reserved (was incorrectly 'allocated' — FIXED)
    GRN auto-reservation set  → stays qc_hold until QC passes (lot.reservations populated)
    Off-cut created           → pending_offcut_verification
    Store Admin verifies      → available (or reserved if parent had reservations)
    Nesting NEST-BCH confirm  → allocated (HARD LOCK — this is the only path to allocated)
    Store Admin issues        → issued
    Cutting confirmation      → consumed
    GRN reversed (super_admin) → rejected (wtAvailable set to 0; material stays in yard)
    Return to Vendor (store_admin/super_admin) → returned (from rejected only)
  READS:   computeRmPicture — includes available+qc_hold+reserved+partially_reserved lots
           Release Wizard Step 4 dropdown — hides allocated/issued/consumed/rejected/returned
           Stock module filter tabs
           Off-cut verification banner — pending_offcut_verification
           activeLotWt helper — returns 0 for rejected/returned/written_off
           MRP stockAvail — excludes rejected/returned/written_off
           OrderProgressTracker receivedKg — excludes rejected/returned/written_off
  WRITES:  doClientInsp — sets available/reserved/partially_reserved based on lot.reservations
           Release Wizard confirm() — sets 'reserved' (FIXED — no longer 'allocated')
           GRN saveGRN — stays qc_hold with lot.reservations populated if coveredOrders set
           Nesting NEST-BCH — sets 'allocated'
           Store Admin issue — sets 'issued'
           Cutting — sets 'consumed'
           Off-cut creation — sets 'pending_offcut_verification'
           Store Admin verify — sets 'available' or 'reserved' based on parent.reservations
           reverseGRN (super_admin) — sets 'rejected', wtAvailable=0, adds audit fields
           Return to Vendor modal (store_admin/super_admin) — sets 'returned'
  DISPLAYS: Stock module STATUS column badge (stCol: rejected→"red", returned→"gray")
             Production register RM status dot
             Release Wizard Step 4 lot dropdown — shows only eligible lots
             Stock module "Off-cuts Pending Verification" banner
             GRNs tab weight summary — shows rejected/net good breakdown
  TRIGGERS: reserved/partially_reserved → lot appears in reserved order's Step 4 dropdown with ✓
             reserved/partially_reserved → included in computeRmPicture lot filter
             pending_offcut_verification → Store Admin alert banner only
             rejected → wtAvailable forced to 0; excluded from MRP/Tracker calcs
             rejected → Return to Vendor and Re-inspect buttons visible in Stock module
  IF CHANGED: Manual status change (super_admin only) must be logged with reason
  IMPORTANT: 'allocated' is ONLY set by Nesting NEST-BCH confirmation (hard lock)
             'reserved' is the soft lock — set by wizard confirm() and GRN auto-reservation
             Off-cut verification restores to 'reserved' (not 'available') if parent had reservations
             'rejected' and 'returned' are the ONLY terminal states where material is not in yard (usable)

lot.reservations (array of reservation objects)
  *** EXTENDED: now has multiple sources — see below ***
  SHAPE:  Each entry: { orderId, kg, reservedAt, reservedBy, source, [releaseId], [grnId], [poId] }
  SOURCES:
    source:'release_wizard' — written by Release Wizard confirm()
      fields: orderId, kg (not set — wizard reserves whole lot), reservedAt, source, releaseId
    source:'grn_auto' — written by saveGRN when po.coveredOrders is set
      fields: orderId, kg, reservedAt, reservedBy, source, grnId, poId
    source:'manual' — written by Stock reservation screen (existing)
      fields: orderId, kg, reservedBy, reservedAt, source
  READS:   Release Wizard Step 3 — lot badges "Reserved for this order" / "Reserved for other order"
           Release Wizard Step 4 dropdown — priority sort: reservations[].orderId === primaryOrderId
           doClientInsp — length determines new lot.status (0=available, 1=reserved, 2+=partially_reserved)
           Stock module filter tab "Reserved" — counts lots where (reservations||[]).length > 0
           Off-cut creation — inherits parent.reservations
           computeRmPicture — includes reserved/partially_reserved lots in Step 2 picture
  WRITES:  Release Wizard confirm() — appends {orderId, reservedAt, source:'release_wizard', releaseId}
           saveGRN (PurchaseModule) — sets full array with pro-rata splits when coveredOrders set
           saveGRN (PODetail) — same as above
           Stock reservation screen — manual adds/removes
  DISPLAYS: Stock module lot detail — reservation breakdown per lot
  TRIGGERS: length === 1 → lot.status = 'reserved' (after QC clearance)
             length >= 2 → lot.status = 'partially_reserved' (after QC clearance)
             length === 0 → lot.status = 'available' (after QC clearance or reservation release)
             Any entry with orderId X → lot appears first in Step 4 dropdown for order X
  IF CHANGED: If reservation removed after nesting confirmed — requires super_admin
  NOTE: Lots remain qc_hold with lot.reservations populated until client inspection passes
        doClientInsp is the trigger that converts pending to the final status

lot.reservedFor (orderId string — single-order shortcut)
  *** NEW FIELD — written by Release Wizard confirm() for quick lookup ***
  READS:   Release Wizard Step 4 dropdown — `l.reservedFor === primaryOrderId` check
  WRITES:  Release Wizard confirm() — set alongside lot.reservations entry
  NOTE:    For single-order wizard reservations. GRN auto-reservations use lot.reservations[]
           only (no lot.reservedFor). Both fields are checked in Step 4 priority sort.
  IF CHANGED: Never override — update lot.reservations[] instead

lot.reservedAt (YYYY-MM-DD string — date of reservation)
  *** NEW FIELD — written by Release Wizard confirm() ***
  READS:   Audit trail
  WRITES:  Release Wizard confirm() — set to today()
  IF CHANGED: Never — historical record

lot.releaseId (PR-YYYY-NNN — release that reserved this lot)
  *** NEW FIELD — written by Release Wizard confirm() ***
  READS:   Traceability — which release reserved this lot
           Release Wizard Step 4 — not currently used for filtering, for audit only
  WRITES:  Release Wizard confirm() — set to generated release id
  IF CHANGED: Never — historical record

lot.pendingReservations (boolean)
  *** REMOVED — was redundant with lot.reservations[] ***
  NOTE:    Previously written by saveGRN and doClientInsp. Removed as lot.reservations[]
           already captures all reservation info. Status transitions (qc_hold → reserved/
           partially_reserved) now handled via lot.reservations.length check only.
  IF CHANGED: Do not re-add — use lot.reservations[] instead

lot.matCode (string — e.g. "PLATE/MS/E250/8MM" or "" for GRN-created lots)
  *** FIX 2: lot matching in Release Wizard computeRmPicture ***
  READS:   computeRmPicture — normMatCode(s.matCode) vs normMatCode(row.matCode)
  WRITES:  GRN buildStockLots — inherits from poLine.matCode (may be "")
           Cutting off-cut creation — inherits from parent lot
  MATCH LOGIC (FIX2): Three-way fallback in computeRmPicture:
    1. sNorm && rNorm && sNorm===rNorm → full normalized matCode match
    2. !s.matCode && secMatch → lot has no matCode → section type fallback
    3. !row.matCode.includes('/') && secMatch → row is just section (e.g. "PLATE") → section fallback
  NOTE: Seed order parts (SEED_ORDERS) have no matCode on parts → key="PLATE" etc.
        Orders module parts DO have matCode. FIX2 handles both cases.
  IF CHANGED: normMatCode() strips trailing mm (case-insensitive). Update matching logic if
              new matCode formats are introduced.

normRmMatCode(mc) — display/ID helper
  *** NEW HELPER — added for nesting rmUnitId and off-cut ID generation ***
  BEHAVIOR: Appends "mm" to bare numeric last segment of matCode path
            "PLATE/MS/E250/8" → "PLATE/MS/E250/8mm" (already "8mm" → unchanged)
  READS:   handleNestImport() — for rmUnitId construction
           parseNestingResult() — same
           CuttingConfirmation confirmBar() — for parentRmUnitId and off-cut lot.id
  WRITES:  Pure function — no side effects
  NOTE:    Use normMatCode() for COMPARISON, normRmMatCode() for ID DISPLAY/GENERATION
  IF CHANGED: All rmUnitId strings and off-cut lot.id values must be regenerated

lot.allocations (array of {drawingId, orderId, partId, rmUnitId, kg})
  *** NOW SYSTEM-GENERATED from nesting output — not manually entered ***
  READS:   Machine assignment — which lot/unit per RM type
           Machine operator queue — which lot to request
           Cutting confirmation — which lot was cut
           MDCC dossier — material traceability
  WRITES:  System only — generated automatically when nesting run is confirmed
           Super admin can override with logged reason
  DISPLAYS: Stock lot detail — allocation breakdown
             Machine assignment screen — lot allocation per RM unit
  TRIGGERS: Created → lot.status moves from Reserved to Allocated
             Created → machine operator can see assigned unit in queue
  IF CHANGED: Never change allocations manually — use re-nest workflow instead

lot.offcutParentId (reference to parent lot)
  READS:   Off-cut reservation inheritance — inherits parent reservation
           Traceability — traces off-cut back to original lot and MTC
  WRITES:  System — set at off-cut creation (cutting confirmation)
  DISPLAYS: Stock module — off-cut detail
  TRIGGERS: Created → off-cut inherits parent.reservations automatically
  IF CHANGED: Never change — breaks traceability chain

lot.parentRmUnitId (string — e.g. "PLATE/MS/E350/10mm/SHEET-01")
  *** NEW FIELD — added for off-cut traceability and dimension grouping ***
  FORMAT:  normRmMatCode(materialCode) + "/" + barRef (sheet reference)
  READS:   Off-cut ID generation (CuttingConfirmation) — count existing OCs from same unit
           Stock module lot detail view — shows parent RM unit info
  WRITES:  CuttingConfirmation confirmBar() — set when creating off-cut lot
  DISPLAYS: Stock module — off-cut card shows parentRmUnitId
  TRIGGERS: New off-cut count: stock.filter(s=>s.parentRmUnitId===parentRmUnitId).length
  IF CHANGED: Off-cut IDs (lot.id) are derived from this — never change retroactively

lot.offcutSequence (string — e.g. "OC-1", "OC-2")
  *** NEW FIELD — sequential off-cut counter per RM unit ***
  FORMAT:  "OC-" + (existing off-cut count + 1)
  READS:   Stock module lot detail view
  WRITES:  CuttingConfirmation confirmBar() — derived from parentRmUnitId count
  DISPLAYS: Stock module — off-cut card shows offcutSequence
  NOTE:    lot.id = parentRmUnitId + "/" + offcutSequence
  IF CHANGED: Never change — breaks lot ID consistency

lot.rmUnitId (string — per-sheet unit ID within a nesting run)
  *** FORMAT: normRmMatCode(matCode)/sheetDim/n-of-groupTotal ***
  FORMAT:  Fractions counted per dimension group within each lot, NOT across all sheets
  EXAMPLE: "PLATE/MS/E350/10mm/2400x1200/1-3" = first of 3 sheets with dim 2400x1200 in this lot
  READS:   Cutting confirmation — identifies which physical sheet is being cut
           Machine operator queue — which RM unit to request
           MDCC dossier — material traceability per sheet
  WRITES:  handleNestImport() — generated when CSV nesting results are imported
           parseNestingResult() — generated from DeepNest API bridge output
  DISPLAYS: Nesting batch detail, stock lot sheets view (grouped by dimension)
  TRIGGERS: Per-dimension grouping via byDim[sheetDim] before assigning n-of-total
  IF CHANGED: normRmMatCode() must be applied to matCode before building ID
              Fractions must be per-dim group — see handleNestImport byDim pattern

lot.batchNo
  READS:   Off-cut inheritance, MDCC dossier, QC records
  WRITES:  Auto-generated at GRN save
  DISPLAYS: Stock module BATCH NO column, lot tags, GRN record
  TRIGGERS: Off-cut inherits this batch number
  IF CHANGED: Never — traceability chain breaks

lot.heatNo
  READS:   RM Quality inspection, MDCC dossier, TPI inspection
  WRITES:  GRN save (via MTC assignment), RM Quality doQC confirmation
  DISPLAYS: Stock module HEAT NO column, lot detail, QC inspection modal (read-only pre-fill)
  IF CHANGED: Requires super_admin — log reason — alert QC Admin

lot.mtcNo (string — MTC document number)
  READS:   RM Quality inspection, MDCC dossier
  WRITES:  GRN save (from grnLine.mtcId → grnForm.mtcs[n].mtcNo), doQC confirmation
  DISPLAYS: QC inspection modal MTC No field (read-only pre-fill with override)
  IF CHANGED: Also update lot.mtcDoc and lot.heatNo for consistency

lot.mtcDoc (Google Drive URL — was lot.mtcLink in earlier sessions)
  READS:   RM Quality, Client inspection, MDCC dossier
  WRITES:  GRN save (from MTC.driveLink), RM Quality doQC (form.mtcLink saved here)
  DISPLAYS: Stock module MTC column (tick or Missing badge), QC inspection modal
  TRIGGERS: Set → mtcUploaded=true, MTC badge turns green tick
             Missing → client inspection blocked
  IF CHANGED: Verify new link accessible and correct document
  NOTE: field internally named mtcDoc not mtcLink on the lot object

lot.unitPrice (number — ₹/kg at time of receipt)
  *** NEW FIELD — added v2.5 ***
  READS:   GRN display — Rate column
  WRITES:  buildStockLots: l.rate||0
  DISPLAYS: Stock module lot detail (rate), GRN lines Rate column
  IF CHANGED: lineValue should be recalculated; use super_admin override flow

lot.lineValue (number — wtReceived × unitPrice rounded to 2dp)
  *** NEW FIELD — added v2.5 ***
  READS:   GRN display — Value column; GRN totals footer
  WRITES:  buildStockLots: l.lineValue || Math.round(wt*rate*100)/100
  DISPLAYS: Stock module lot detail, GRN lines Value column, GRN totals footer
  IF CHANGED: Log reason; may affect purchase valuation

lot.rejectedAt (ISO timestamp — set on GRN reversal)
  *** NEW FIELD — added v2.5 ***
  WRITES:  reverseGRN in PODetail — new Date().toISOString()
  DISPLAYS: Stock module rejected lot card (future: audit trail)

lot.rejectedBy (string — user.name at reversal)
  *** NEW FIELD — added v2.5 ***
  WRITES:  reverseGRN in PODetail
  DISPLAYS: Stock module rejected lot card (audit trail)

lot.rejectionReason (string)
  *** NEW FIELD — added v2.5 ***
  WRITES:  reverseGRN: hardcoded 'GRN reversed'; Return to Vendor: user-entered remarks
  DISPLAYS: Stock module rejected lot card

lot.grnReversed (boolean true)
  *** NEW FIELD — added v2.5 ***
  WRITES:  reverseGRN in PODetail
  READS:   (available for future GRN history audit)

# ─── GRN FORM (transient — not persisted; used during GRN modal) ───

grnForm.lines[].checked (boolean, default true)
  *** NEW FIELD — added v2.5 ***
  READS:   saveGRN — filters checked!==false && actualWt>0 lines only
           GRN modal Section C — checkbox per line
  WRITES:  GRN modal checkbox onChange
  INITIAL: true — set in "Raise GRN" button onClick

grnForm.lines[].rcvgQty (number)
  *** NEW FIELD — added v2.5 ***
  READS:   saveGRN — used as qty for PO line qtyReceived update
           GRN modal Section C — Rcvg Qty input
  WRITES:  "Raise GRN" button: balQty (balance qty); GRN modal Rcvg Qty input
  INITIAL: balQty = (qtyOrdered||qty) - (qtyReceived||0)
  NOTE: rcvgQty stored on saved GRN line for display (rcvgQty||qtyReceived in GRNs tab)

grnForm.lines[].rate (number — ₹/kg)
  *** NEW FIELD — added v2.5 ***
  READS:   saveGRN → saved to newGrn.lines[].rate → buildStockLots → lot.unitPrice
           GRN modal Section C — Rate input per line
           grnGroupRates onChange — auto-fills non-manual lines
  WRITES:  "Raise GRN" button: pl.unitPrice||0; group rate changes; per-line input
  INITIAL: pl.unitPrice||0 from PO line

grnForm.lines[].manualRate (boolean)
  *** NEW FIELD — added v2.5 ***
  READS:   grnGroupRates onChange — skips lines where manualRate===true
  WRITES:  Per-line rate input onChange sets manualRate:true
  INITIAL: false

grnForm.lines[].lineValue (number)
  *** NEW FIELD — added v2.5 ***
  READS:   saveGRN → saved to newGrn.lines[].lineValue → buildStockLots → lot.lineValue
           GRN modal Section C — Value column (computed display)
           Totals footer — totalValue sum
  WRITES:  Per-line rate change: Math.round(actualWt*rate*100)/100

grnGroupRates ({ [matCode]: number } — PODetail component state)
  *** NEW STATE — added v2.5 ***
  READS:   GRN modal Section C group header — Rate input for each matCode
  WRITES:  Group Rate input onChange — auto-fills non-manual grnForm.lines for that matCode
  INITIAL: {} — set in "Raise GRN" onClick; cleared in modal onClose and saveGRN

grnForm.mtcs (array of {id, mtcNo, heatNo, grade, driveLink})
  READS:   buildStockLots — finds mtc by grnLine.mtcId to populate lot fields
           GRN line MTC dropdown — renders options
           "Apply MTC-1 to all lines" button — uses mtcs[0].id
  WRITES:  [+ Add MTC] button, per-MTC field edits, [✕] delete
  DISPLAYS: GRN modal "Mill Test Certificates" section above Received Lines
  INITIAL: [] — set in + Raise GRN button onClick and form resets
  IF CHANGED: All lot fields (heatNo/mtcNo/mtcDoc/mtcUploaded) derived from this at save time

grnLine.mtcId (string — references grnForm.mtcs[n].id)
  READS:   buildStockLots — looks up mtc from grnForm.mtcs array
  WRITES:  Per-line MTC dropdown onChange; "Apply MTC-1 to all lines" sets all lines
           onChange also auto-fills grnLine.heatNo from mtc.heatNo
  DISPLAYS: GRN line row — MTC dropdown (replaces manual Heat No when MTCs defined)
  FALLBACK: If no MTCs in grnForm.mtcs, shows manual Heat No input instead
  IF CHANGED: Re-derive lot.heatNo — buildStockLots prefers mtc.heatNo over l.heatNo

# ═══════════════════════════════════════════════════════════════════
# PRODUCTION INSTANCE OBJECT
# ═══════════════════════════════════════════════════════════════════

instance.id (markNo/drawingNo/orderId/sequence)
  READS:   All production tracking, QC records, contractor dashboard, MDCC
  WRITES:  Auto-generated at cutting confirmation Tier 2 sign-off
  DISPLAYS: Production progress grid, contractor dashboard part list
  TRIGGERS: Created → contractor dashboard shows new part, dashboard counter increments
  IF CHANGED: Never — breaks all QC records

instance.stage (Cutting|Fit-Up|Welding|Assembly|Blasting|Painting|Complete)
  READS:   Production register — Parts Cut/Needed calculation
           Contractor dashboard — stage indicator
           Assembly gate logic — checks all group drawings
           Stage gate function — validates transition
  WRITES:  Stage transition functions — called after QC clearance
  DISPLAYS: Production register, contractor dashboard, progress grid
  TRIGGERS: Changed → register Parts Cut/Needed recalculates
             Changed to Blasting → check assembly gate if drawing in assembly group
             Changed to Blasting → check TPI blasting hold point
  IF CHANGED: Always use stage transition function — never set directly

instance.assemblyGateStatus (not_required|waiting_for_group|ready|cleared)
  *** NEW FIELD — driven by drawing.assemblyGroup ***
  READS:   Assembly stage gate — can this drawing proceed to Blasting?
           Assembly stage screen — group completion display
  WRITES:  System — updated when sibling drawings' stages change
  DISPLAYS: Assembly stage screen per group, instance detail
  TRIGGERS: All sibling instances reach Weld QC Cleared →
             assemblyGateStatus changes to ready for all siblings
             TPI Assembly cleared → assemblyGateStatus changes to cleared
             cleared → all sibling instances can proceed to Blasting
  IF CHANGED: Never set manually — always derived from sibling instance stages

instance.qcStatus (object with status per stage)
  READS:   Stage gate — cannot progress until current stage QC cleared
           QC Admin screen — pending jobs
           QC Engineer screen — assigned jobs
           Contractor dashboard — part status counts
  WRITES:  QC Engineer inspection modal — Clear or Reject
  DISPLAYS: Contractor dashboard part status table, instance detail timeline
  TRIGGERS: Cutting QC cleared → contractor notified (batch), stage can progress
             Any QC rejected → alert to operator/contractor with reason
  IF CHANGED: Reverting clearance requires super_admin — logged

instance.dimReadings (array of {markNo, measuredMm} — cutting QC only)
  *** NEW FIELD — recorded by Production Engineer at cutting_qc stage ***
  READS:   cutting_qc stage approval form — display to engineer
  WRITES:  SupervisorQueue cutting_qc approval — dimension reading inputs per markNo
  DISPLAYS: cutting_qc approval form — "Measured length of [markNo]: [____] mm"
             stageHistory entry containing dimReadings
  TRIGGERS: Saved with stage approval — stored in stageHistory[].dimReadings
  SECONDARY: If machine has 'bevel' capability → 3 bevel QC checklist items shown
             If machine has 'drill' capability → 4 drill QC checklist items shown
  IF CHANGED: Never edit after approved — historical QC record

instance.subStageChecks ({cut:bool, bevel:bool, grind:bool, drill:bool})
  *** NEW FIELD — driven by machine.capabilities at cutting confirmation ***
  READS:   Cutting confirmation form — which checkboxes to render
           Secondary station routing — if pending ops after cut confirmation
  WRITES:  Cutting confirmation — checkboxes driven by barForm.machineCaps
  DISPLAYS: Cutting confirmation bar form — sub-stage checklist
  TRIGGERS: Any requiredOp beyond 'Cut' → instance.currentStatus="pending_secondary",
            instance.currentStage="secondary_ops" (routing logic in confirmBar)
  NOTE: Routing now checks inst.subOpsRequired (from order part's requiredOps, not machine caps)
        Machine caps used for QC checklist items only (D1/D2). subOpsRequired set from
        order.parts[].requiredOps at confirmBar time (not hardcoded ["cut"]).
  IF CHANGED: Update confirmBar requiredOps lookup; update SecondaryOpsQueue in MachineOperatorQueue

barForm.goodQty (number, per part in barForm.parts[])
  *** REPLACES barForm.actualQty — FIX 1 ***
  READS:   confirmBar — good instance qty; wtConsumed calculation
           handleGoodQtyChange — syncs barForm.defects[] length
  WRITES:  "Good Pieces Cut" input in CuttingConfirmation barForm UI
  DISPLAYS: Cutting confirmation bar form — replaces "Actual Qty"
  TRIGGERS: goodQty change → defects[] auto-resized to plannedQty - goodQty
  IF CHANGED: Update confirmBar + handleGoodQtyChange + wtConsumed + piece marking display

barForm.defects (array per part: [{defectType, action, reason}])
  *** NEW FIELD — one entry per defective piece — FIX 1 ***
  READS:   confirmBar — splits into per-defective-piece confirmedPartsAll entries
  WRITES:  Defective piece rows in barForm UI (auto-appears when defQty > 0)
  DISPLAYS: Per-piece rows with type dropdown, action radio, reason text
  TRIGGERS: defects[i].action="rework" → instance.currentStatus="rework"
             defects[i].action="writeoff" → instance.currentStatus="written_off"
             defects[i].action="use_as_is" → instance.currentStatus="pending_pe_approval"
  NOTE: defectAction stored on instance.defects[0].action via createInstances
  IF CHANGED: Update createInstances, confirmBar routing block, MachineOperatorQueue rework

instance.defectAction (stored via instance.defects[0].action)
  *** UPDATED — now stored on instance.defects[0].action via createInstances ***
  READS:   confirmBar routing — newInst routing block reads inst.defects?.[0]?.action
  WRITES:  Cutting confirmation — per defective-piece action radio
  DISPLAYS: MachineOperatorQueue Rework Queue — original defect reason
  TRIGGERS: rework → instance.currentStage="cutting", instance.currentStatus="rework"
             writeoff → instance.currentStatus="written_off", writeoffRequiresReplacement=true
             use_as_is → instance.currentStatus="pending_pe_approval" (PE must approve)
  IF CHANGED: Update createInstances defects[].action + confirmBar routing + MachineOperatorQueue

stageHistory[].weldGaugeReading (number, mm — welding stage)
stageHistory[].postWeldLength (number, mm — welding stage)
  *** NEW FIELDS — recorded at welding stage approval ***
  WRITES:  SupervisorQueue welding stage form — Measurements section
  DISPLAYS: Welding approval form, MDCC dossier
  IF CHANGED: Never edit after approved — historical QC record

stageHistory[].weldingDetails ({welderId, welderName, wpsUsed, completedAt, completedBy})
  *** NEW FIELD — recorded at welding stage approval ***
  WRITES:  SupervisorQueue welding form — welder dropdown + WPS input
  READS:   welder.id from welders state filtered by contractor
  DISPLAYS: Welding approval form, MDCC dossier
  IF CHANGED: Never edit after approved — historical QC record

stageHistory[].ndtDetails ({required, types[], agency, reportLink, result, date})
  *** NEW FIELD — recorded at welding stage approval ***
  WRITES:  SupervisorQueue welding form — NDT section (UT/RT/PT/MT checkboxes)
  TRIGGERS: required=true AND result='fail' → ndtGateOk=false → approve button disabled
  DISPLAYS: Welding approval form
  IF CHANGED: Never edit after approved — historical QC record

stageHistory[].cuttingQcMeasurements ([{markNo, actualL, actualW}])
stageHistory[].cuttingQcApprovedAt (ISO timestamp)
stageHistory[].cuttingQcApprovedBy (userId)
  *** NEW FIELDS — recorded at cutting_qc stage approval ***
  WRITES:  SupervisorQueue cutting_qc form — L×W dimensional table per markNo
  TRIGGERS: Dim fail without reason → cuttingQcGateOk=false → approve blocked
  TOLERANCE: ±2mm (≤500mm) · ±3mm (500–2000mm) · ±5mm (>2000mm)
  IF CHANGED: Never edit after approved — historical QC record

stageHistory[].fitupQcMeasurements ([{dim, actual}])
stageHistory[].fitupQcApprovedAt / fitupQcApprovedBy
  *** NEW FIELDS — recorded at fitup stage approval ***
  WRITES:  SupervisorQueue fitup form — 5-row dimension table (L/W/H/Diag1/Diag2)
  IF CHANGED: Never edit after approved

stageHistory[].appliedAt (ISO timestamp — painting stage)
  *** NEW FIELD — dry time countdown reference ***
  WRITES:  doApprove for painting stage — new Date().toISOString()
  READS:   Painting stage dry time check — replaces date-only signedOffDate for accuracy
  TRIGGERS: Enables accurate countdown (HH:MM:SS) to nextCoatAvailableAt
  IF CHANGED: Never edit after approved

stageHistory[].dftReadingsDetailed ([{value, location, takenAt, takenBy}])
stageHistory[].dftAvg (number — average of readings)
  *** NEW FIELDS — DFT per-reading data at painting stage ***
  WRITES:  SupervisorQueue painting form — up to 10 DFT readings with location
  DISPLAYS: Painting form avg/min/target panel; DFT summary table
  IF CHANGED: Never edit after approved

instance.blastingCompletedAt (ISO timestamp)
  *** NEW FIELD — written to instance (not just stageHistory) for live timer access ***
  WRITES:  doApprove for blasting stage
  READS:   Painting stage live blast timer (HH:MM:SS countdown using now state)
  TRIGGERS: >amberHours → amber warning; >redHours → red + PE override required
  THRESHOLDS: productionStandards.blastThresholds.{amberHours:3, redHours:4}
  IF CHANGED: Never edit after set

instance.reblastWaivedBy / reblastWaivedReason / reblastWaivedAt
  *** NEW FIELDS — PE override for blast timer red state ***
  WRITES:  PE override button on painting stage (requires prompt for reason)
  READS:   Painting stage blast timer — if set, shows override notice, hides override button
  IF CHANGED: Requires super_admin override

stageHistory[].dustRating (string "1"-"5" — blasting stage, ISO 8502-3)
  *** NEW FIELD — recorded at blasting stage approval ***
  WRITES:  SupervisorQueue blasting stage form — Dust Rating select
  TRIGGERS: Rating 1-2 = Pass, Rating 3-5 = Fail
  IF CHANGED: Never edit after approved

stageHistory[].envTemp / envRH / envDewPt / envSurfTemp (painting stage)
  *** NEW FIELDS — environmental conditions captured at each coat approval ***
  WRITES:  SupervisorQueue painting stage form — Environmental Conditions section
  DISPLAYS: Painting approval form, MDCC dossier
  IF CHANGED: Never edit after approved

instance.currentStatus value: "assembly_hold"
  *** NEW STATUS — instance is at assembly stage but waiting for sibling drawings ***
  WRITES:  doApprove for welding/tpi_weld when drawing has assemblyGroup and siblings not done
  READS:   E2 gate: when last sibling completes welding, all assembly_hold instances released
  DISPLAYS: SupervisorQueue assembly form — sibling status table
  TRIGGERS: All siblings welding done → all assembly_hold instances set to in_progress
  NOTE: Uses __assembly_hold__ sentinel in nextStage; setInstances translates to stage=assembly+status=assembly_hold

# ═══════════════════════════════════════════════════════════════════
# WELDER REGISTER (NEW MASTER)
# ═══════════════════════════════════════════════════════════════════

welders[] (App state: const [welders, setWelders] = useState(WELDERS_SEED))
  READS:   SupervisorQueue welding form — dropdown filtered by contractorId
           D4 welder tracking — weldingDetails.welderId resolved to welder record
  WRITES:  Masters → Welders tab — WeldersMaster component
  DISPLAYS: Masters Welders tab, welding sign-off cert display
  TRIGGERS: Cert expiry ≤30 days → expiring_soon badge; <0 → expired badge + alert banner
  IF CHANGED: Add/edit/delete via WeldersMaster; adding welders to a contractor enables dropdown in welding sign-off

welder.certifications[].expiryDate
  READS:   certStatus() fn in WeldersMaster — auto-computes valid/expiring_soon/expired
  DISPLAYS: WeldersMaster table cert status badge; expiry alert banner
  TRIGGERS: ≤30 days → amber badge + top-of-page alert listing affected welders
             Expired → red badge
  IF CHANGED: Edit via WeldersMaster modal

productionStandards.blastThresholds ({amberHours:3, redHours:4})
  *** NEW FIELD — configurable blast-to-primer window thresholds ***
  READS:   SupervisorQueue painting stage live timer
  WRITES:  ProductionStandardsMaster (future — currently set as default only)
  DEFAULT: amberHours:3, redHours:4
  IF CHANGED: Update ProductionStandardsMaster if UI editing is added

instance.assignedEngineer (user.id — set by QC auto-assignment rules)
  *** NEW FIELD — set in doApprove when creating next pending_supervisor item ***
  READS:   SupervisorQueue filter — qc_user sees only their assigned jobs
           QC Admin screen — Pending Jobs table
  WRITES:  doApprove — auto-assigned via qcRules matching processType
           QC Admin — manual override (sets assignedEngineer + appends to overrideLog)
  TRIGGERS: Set → qc_user role filters queue to their jobs only
  IF CHANGED: Override requires QC Admin — logged in overrideLog

instance.tpiStatus (per stage: not_required|pending|cleared)
  READS:   Stage gate — checks alongside qcStatus before transition
  WRITES:  TPI inspection modal
  DISPLAYS: Instance detail — TPI gate banner
  TRIGGERS: Set to pending → amber banner on instance
             Cleared → stage transition allowed (if internal QC also cleared)

instance.pieceMarking (boolean)
  READS:   Cutting confirmation — mandatory checkbox validation
           QC dimensional check — engineer verifies
  WRITES:  Cutting confirmation — mandatory checkbox
  TRIGGERS: Must be true before bar confirmation can be submitted
  IF CHANGED: Cannot be set false after cutting confirmation

# ═══════════════════════════════════════════════════════════════════
# PRODUCTION RELEASE OBJECT (releases[] state)
# ═══════════════════════════════════════════════════════════════════
#
# Shape written by Release Wizard confirm():
#   { id: "PR-YYYY-NNN",
#     releaseDate, createdBy, status: "in_progress",
#     drawings: [drawingsPayload],
#     machineAssignments: [machinePayload],
#     rmPicture: [rmPayload]
#   }

release.drawings[n] (one entry per selected drawing)
  SHAPE:  { drawingId, drawingNo, orderId, orderNo,
             contractorId, contractorName,
             stages: [],          ← contractor stage list (fit_up, welding, etc.)
             pinnedEngineerId, pinnedEngineerName,
             tier, criticalityScore }
  *** stages field is NEW — written by FIX 4 (contAsgn[drawing.id].stages) ***
  READS:   ContractorWorkQueue — filter drawings assigned to this contractor
           Production register — drawing detail
  WRITES:  Release Wizard confirm() — drawingsPayload loop reads contAsgn
  NOTE:    stages determines which stage cards are shown to the contractor

release.machineAssignments[n] (one entry per matCode)
  SHAPE:  { id: "MA-{releaseId}-{matCode}", matCode,
             machineId, machineName,
             lotId, startDate, endDate,
             secondaryAssignments: [],   ← NEW FIELD — FIX 5
             assignedBy, status: "pending" }
  *** secondaryAssignments is NEW — written by FIX 5 ***
  SHAPE of secondaryAssignments[]:
    { capability: "drill"|"bevel"|...,
      machineId, startDate, endDate }
  READS:   Cutting confirmation — which machine to assign per matCode
           Engineer cutting QC — secondary ops section (checks machine capabilities)
           Production register — machine assignment display
  WRITES:  Release Wizard confirm() — machinePayload from machineAsgn state
           machineAsgn state: { [matCode]: { machineId, lotId, startDate, endDate,
                                              secondaryAssignments: [] } }
  TRIGGERS: secondaryAssignments non-empty → cutting confirmation shows secondary ops section
  IF CHANGED: Never update directly — use re-release workflow

# ═══════════════════════════════════════════════════════════════════
# NESTING OBJECTS
# ═══════════════════════════════════════════════════════════════════

# ── Planning Batches (NEST-PLN) — created by MRP import ─────────────
# State: nestingBatches[] in App component (useState([]))
# Passed to: MRPModule as nestingBatches / setNestingBatches props
#
# Shape:
#   { id: "NEST-PLN-2026-001",
#     createdAt: "YYYY-MM-DD",
#     createdBy: user.name,
#     status: "Planned",
#     source: "import" | "api" | "manual",   ← NEW FIELD
#     apiJobs: [],                             ← NEW FIELD (populated when source='api')
#     lots: [
#       { lotId: "NEST-PLN-2026-001-PLATE-E250-12mm",
#         matCode: "PLATE/E250/12mm",
#         sheets: [
#           { sheetNo, sheetDim, utilisPct, parts:[], rmUnitId }
#         ],
#         parts: ["B1","B2",...]   // all unique markNos in this lot
#       }
#     ]
#   }

nestingBatch.id (NEST-PLN-YYYY-NNN)
  READS:   MRP Nesting Runs tab — batch header display
           Lot lotId generation — used as prefix
           PurchaseModule Requisitions tab — links PR to batch via nestingBatchId
  WRITES:  handleNestImport — auto-generated from nestingBatches sequence
  DISPLAYS: Nesting Runs tab Section A — Planning Batches
            Nesting batch card — PR/PO status badge
  IF CHANGED: Never — all child lotIds would break

nestingBatch.status ('active' | 'discarded')
  *** NEW VALUE — 'discarded' added for Discard Nesting Run flow ***
  READS:   MRP Nesting Runs tab — showDiscardedBatches toggle
           prForBatch() — check if batch is discarded before showing PR action
  WRITES:  discardBatch() — sets 'discarded' + discardedReason + discardedAt
  DISPLAYS: Nesting Runs tab — discarded batches hidden unless toggle is on
  IF CHANGED: Discarded batches show in section only when showDiscardedBatches=true

nestingBatch.discardedReason (string)
  WRITES:  discardBatch() — stores user-entered reason for discard
  DISPLAYS: Discarded batch card (amber strike-through style)
  IF CHANGED: N/A — historical record

nestingBatch.lots[].rmUnitId (format: matCode/sheetDim/n-total)
  *** FIXED — fractions now per dimension group within each lot ***
  FORMAT:  normRmMatCode(matCode)/{sheetDim}/{n}-{groupTotal}
           Example: PLATE/MS/E250/8mm/2400x1200/1-3  (1st of 3 sheets of this dimension in lot)
  IMPORTANT: n and total are counted WITHIN each dimension group (byDim[sheetDim]) NOT across all sheets
  READS:   Nesting Runs tab drill-down — Sheets table
           Future: machine assignment lot detail view
  WRITES:  handleNestImport — computed per sheet from grouping
  DISPLAYS: Nesting Runs tab Section A → lot → sheet row
  TRIGGERS: Created → lot detail visible in drill-down
  IF CHANGED: Never — if re-nesting needed, create new batch

nestingBatch.lots[].sheets (array per lot)
  READS:   Nesting Runs tab — sheet drill-down rows
  WRITES:  handleNestImport — grouped from import file rows
  DISPLAYS: Sheet No | Dimensions | RM Unit ID | Utilisation % | Parts on Sheet
  IF CHANGED: Never — re-import creates new batch

nestingBatch.source ('import' | 'api' | 'manual')
  *** NEW FIELD — origin of batch data ***
  READS:   Nesting Runs tab — badge display (planned: "Imported" / "API" / "Manual")
  WRITES:  handleNestImport — sets 'import' when created from file upload
           API bridge (future) — sets 'api'
  NOTE:    'api' batches will also populate nestingBatch.apiJobs[]
  IF CHANGED: Informational only — no cascade

nestingBatch.apiJobs (array — populated when source='api')
  *** NEW FIELD — Nesting Center API job references ***
  READS:   Nesting Runs tab — API job status display (future)
  WRITES:  API bridge when batch submitted to Nesting Center API
  NOTE:    Currently empty [] for all batches (API bridge not yet implemented)
           vite.config.js proxy at /nesting-api → https://api-nesting.nestingcenter.com
           is configured but no code calls it yet
  IF CHANGED: Only updated by API bridge — never manually set

# ── Production Nesting Runs (NEST-YYYY-NNN) — DeepNest bridge ────────
# State: nestingRuns[] in App component — SEPARATE from nestingBatches
# Shape: existing (runDate, materialCode, orders[], sheetsOrBarsUsed,
#                  utilisationPct, wasteKg, offcutsCreated[], dxfLink, status, parts[])

nestingRun.id (NEST-YYYY-NNN)
  READS:   CuttingConfirmation — selRun lookup
           Machine assignment, Production register, MDCC dossier
  WRITES:  New Nesting Run modal (MRP Nesting Runs tab)
           ToolsModule Nesting Bridge
           CuttingConfirmation test run creator
  DISPLAYS: Nesting Runs tab Section B — Production Nesting Runs table
  IF CHANGED: Never — cutting instances and allocations reference this

nestingLot.sourceReservations (array of lotId + orderId that fed this nesting lot)
  READS:   Traceability — which reservations became this allocation
  WRITES:  Set automatically at nesting confirmation
  DISPLAYS: Nesting lot detail
  IF CHANGED: Never — historical record

# ── Purchase Requisitions — Nesting Type ──────────────────────────────
# purchaseReqs[] in App component — shared between MRPModule and PurchaseModule

purchaseReq.type ('nesting' | undefined)
  *** NEW FIELD — identifies nesting-sourced PRs ***
  READS:   PurchaseModule Requisitions tab — filters purchaseReqs where type==="nesting"
           MRPModule batch card — prForBatch() checks type==="nesting" && nestingBatchId
  WRITES:  MRPModule createBatchPr() — sets type:"nesting"
  DISPLAYS: PurchaseModule Requisitions tab — shows nesting PRs with Convert/Discard actions
  IF CHANGED: Only "nesting" type handled in Requisitions tab; standard PRs not shown there

purchaseReq.nestingBatchId (string — links PR to a nestingBatch)
  *** NEW FIELD — bidirectional link between PR and nesting batch ***
  READS:   MRPModule prForBatch(batchId) — finds PR matching this batch
           PurchaseModule — shows batch ID on requisition row
  WRITES:  MRPModule createBatchPr() — set to batch.id
  IF CHANGED: prForBatch() relies on this — never rename field

purchaseReq.status ('open' | 'converted' | 'cancelled')
  READS:   MRPModule batch card — prForBatch().status for badge display
           PurchaseModule Requisitions tab — filter by status
  WRITES:  MRPModule discardBatch() — sets 'cancelled' if PR exists and no PO
           PurchaseModule convertPoModal — sets 'converted' when PO created
  TRIGGERS: 'converted' → poForPr() lookup becomes valid (pr.poId set)

purchaseReq.poId (string — links to converted PO)
  READS:   MRPModule poForPr(pr) — finds PO matching this PR
           PurchaseModule Requisitions — "View {po.id}" button visibility
  WRITES:  PurchaseModule savePO() — set when form.prId exists (single PR convert)
           PurchaseModule createCombinedPO() — set on ALL selectedPrs simultaneously
  IF CHANGED: poForPr() relies on pos.find(p=>p.id===pr.poId)

# ── PO Object Fields ──────────────────────────────────────────────────

po.sourceType ('nesting' | undefined)
  *** NEW FIELD — identifies nesting-originated POs ***
  READS:   PODetail lines tab — branch to grouped matCode view vs. flat table
           PurchaseModule new_po modal — hides [+ Add Line] and CSV import when nesting
  WRITES:  PurchaseModule savePO() — set from form.sourceType (set in Convert to PO handler)
           PurchaseModule createCombinedPO() — always sets "nesting"
  DISPLAYS: PODetail lines tab — nesting POs show matCode groups with ₹/kg input per group
  IF CHANGED: Both PODetail branch and New PO modal [+ Add Line] guard must be updated together

po.prIds (string[] | undefined)
  *** NEW FIELD — for combined multi-PR POs ***
  READS:   PurchaseModule Requisitions tab — each PR with poId shows "View {po.id}" button;
           poId is set on each individual PR, so prIds is for traceability only
  WRITES:  PurchaseModule createCombinedPO()
  NOTE:    For single-PR conversion, only pr.poId is set (no po.prIds needed)
  IF CHANGED: No functional dependency — informational only

po.line.sourceType ('nesting' | undefined)
  *** NEW FIELD — per-line origin marker ***
  READS:   PurchaseModule new_po modal — filter nesting lines out of editable map
           PurchaseModule new_po modal — shows read-only nesting summary above editable lines
  WRITES:  Convert to PO handler and createCombinedPO() — always set "nesting"
  IF CHANGED: The filter `l.sourceType!=="nesting"` in new_po modal line render must match

po.line.sheetDim (string e.g. "6000X1250")
  *** NEW FIELD — dimension string for nesting plate lines ***
  READS:   PODetail grouped nesting view — "Dimensions" column
  WRITES:  Convert to PO handler, createCombinedPO() — from ln.sheetDim||ln.dims
  IF CHANGED: nestingSheetWt() parses this — must use X delimiter (uppercase)

po.line.wtPerSheet (number kg)
  *** NEW FIELD — weight per sheet calculated at line creation ***
  FORMULA: L(mm) × W(mm) × t(mm) × 7.85 / 10^6
           where t = parseFloat(matCode.split("/")[3].replace(/mm$/i,""))
  READS:   PODetail grouped nesting view — "Wt/Sheet" column
  WRITES:  nestingSheetWt() helper called in Convert to PO and createCombinedPO()
  NOTE:    0 if sheetDim is blank or t cannot be parsed from matCode
  IF CHANGED: Update nestingSheetWt() helper; recalculate wtOrdered (= wtPerSheet × qty)

po.line.unitPrice (number — ₹/kg)
  *** FIELD NOW POPULATED — v2.5: both single-convert and combine-PO paths now save this ***
  READS:   PODetail lines table — Unit Price column
           "Raise GRN" button init — pre-fills grnForm.lines[].rate
           buildStockLots — lot.unitPrice inherits from pl.unitPrice
  WRITES:  saveSingleConvertPO: rate from csf.lineRates[`${li}-${di}`] ?? csf.rates[matCode]
           createCombinedPO: parseFloat(combineForm.rates?.[l.matCode])||0
  IF CHANGED: Recalculate po.line.totalPrice and po.totalValue

po.line.pricingMethod ('PerKg' | 'PerUnit' | undefined)
  *** FIELD NOW POPULATED — v2.5 ***
  READS:   PODetail lines table — Pricing column
  WRITES:  saveSingleConvertPO: hardcoded "PerKg"
           createCombinedPO: hardcoded "PerKg"
  IF CHANGED: Update effectiveRateKg display calculation in PODetail

po.line.totalPrice (number — unitPrice × wtOrdered rounded to 2dp)
  *** FIELD NOW POPULATED — v2.5 ***
  READS:   PODetail lines table — Total column; po.totalValue sum
  WRITES:  saveSingleConvertPO: Math.round(wtPerSheet * qty * rate * 100) / 100
           createCombinedPO: Math.round(wtPS * qty * 100)/100 * rate rounded to 2dp
  IF CHANGED: Recompute po.totalValue

po.totalValue (number — sum of all po.lines[].totalPrice)
  *** FIELD NOW POPULATED — v2.5: createCombinedPO and saveSingleConvertPO both save this ***
  READS:   PODetail header — Total PO Value display
  WRITES:  createCombinedPO: allLines.reduce((s,l)=>s+(l.totalPrice||0),0)
           saveSingleConvertPO: lines.reduce sum
  IF CHANGED: No cascade — display only

csf.lineRates ({ "${li}-${di}": rate } — convertSingleForm field)
  *** NEW FIELD — v2.5 ***
  KEY FORMAT: `${lotIndex}-${dimIndex}` matching pr.lots[li].lines[di]
  READS:   saveSingleConvertPO: rate = csf.lineRates[key] ?? csf.rates[matCode]
           convertSingleModal: per-dim rate input binding; anyRateZero check
  WRITES:  Per-dim rate input onChange; group rate input auto-fills non-manual dims (di!==0 without override)
  INITIAL: {} on convertSingleModal open
  NOTE:    csf.rates[matCode] is the group-level fallback; csf.lineRates is the per-dim override

combineForm.rates ({ [matCode]: number } — combineModal field)
  *** NEW FIELD — v2.5 ***
  READS:   createCombinedPO: parseFloat(combineForm.rates?.[l.matCode])||0 per line
           combineModal: per-matCode rate input; anyRateZero guard on Create PO button
  WRITES:  Per-matCode rate input onChange in combineModal
  INITIAL: {} on combine modal open
  NOTE:    One rate per matCode applies to ALL lines for that material

po.line.category ('raw_material' | 'paint' | 'consumable' | undefined)
  *** NEW FIELD — structured line type from LinePicker ***
  READS:   No current reader — reserved for future display (category badge)
  WRITES:  LinePicker modal — set per category button chosen
  NOTE:    Lines without category (legacy POs) display unchanged — no migration needed
  IF CHANGED: Add category badge rendering to PODetail lines table if needed

po.line.itemDescription (string)
  *** NEW FIELD — auto-generated description from LinePicker ***
  FORMAT:  RM: "ISA E250 75x75x8", Paint: "Primer — Berger 20L", Cons: "SMAW E7018 3.15mm — ESAB 5kg"
  READS:   Not yet used in display (future: replace itemCode in GRN line descriptions)
  WRITES:  LinePicker modal on Add to PO click
  IF CHANGED: Update GRN auto-line materialDesc when using this field

parseNestingMatCode(matCode) — PO creation helper
  *** NEW HELPER — before PurchaseModule, shared by Convert to PO and createCombinedPO ***
  BEHAVIOR: Splits matCode by "/" → {sectionType[0], matType[1], grade[2], size[3]}
  EXAMPLE:  "PLATE/MS/E350/10mm" → {sectionType:"PLATE", matType:"MS", grade:"E350", size:"10mm"}
  READS:   Convert to PO handler, createCombinedPO()
  IF CHANGED: Both handlers must be updated; sectionType used in GRN material description

nestingSheetWt(matCode, sheetDim) — PO weight calculation helper
  *** NEW HELPER — before PurchaseModule ***
  FORMULA: L × W × t × 7.85 / 1e6  (all in mm)
  PARSES:  t from matCode.split("/")[3] stripping "mm" suffix
           L,W from sheetDim.toUpperCase().split("X")
  READS:   Convert to PO, createCombinedPO(), combine bar total weight display
  IF CHANGED: Update all three callers; test against: PLATE/MS/E350/10, 6000X1250 → 471.0 kg

# ── Consumables Master ────────────────────────────────────────────────

consumable object shape
  {id:string, name:string, category:"consumables", subCategory:string,
   sizes:string[], packSizes:string[], approvedMakes:string[],
   hsnCode:string, unit:string, reorderLevel:number, reorderQty:number,
   trackingTier:"strict"|"quantity"|"none"}
  READS:   ConsumablesMaster table and add/edit modal
           PurchaseModule LinePicker modal (category=consumable)
  WRITES:  ConsumablesMaster save() — add/edit
  DISPLAYS: Masters → Consumables tab — searchable table with filter by subCategory
  IF CHANGED: Update LinePicker consumable dropdown source

consumables state (array of consumable objects)
  READS:   ConsumablesMaster, PurchaseModule LinePicker
  WRITES:  ConsumablesMaster.save()
  NOTE:    Initialized from CONSUMABLES_SEED (50 items, 7 sub-categories)
           NOT persisted to localStorage yet — resets on page reload
  IF CHANGED: Add localStorage persistence if needed (same pattern as paint/materials)

consumable.id (CON-NNN format)
  READS:   LinePicker — consumableId field on po.line
  WRITES:  ConsumablesMaster save() — max existing id + 1
  IF CHANGED: Update po.line.consumableId references

# ── MRP Drawing Selection ──────────────────────────────────────────────

nestSelDrgs (state: {[orderId|drgId]: boolean})
  *** CHANGED — absent key now means UNCHECKED (was: checked) ***
  DEFAULT: {} empty object = ALL drawings unchecked
  READS:   isDrgSel() — returns nestSelDrgs[key] ?? false (was ?? true)
  WRITES:  Order-level checkbox — sets all drawings for an order true/false
           Individual drawing checkbox — sets single key
           Select All — sets all keys to true
           Clear All — sets {} (clears all = all unchecked)
  RESETS:  useEffect on [view] change — setNestSelDrgs({})
  DISPLAYS: Export button disabled when selectedCount === 0
            Counter: "{N} drawings selected"
  IF CHANGED: Do not revert to ?? true default — users prefer opt-in selection

# ── Excel Export (MRPNestExport component) ────────────────────────────
# handleDownloadExcel() — builds 3-sheet XLSX workbook via SheetJS

MRPNestExport.handleDownloadExcel
  *** IMPLEMENTED — was a non-functional stub before this session ***
  READS:   allDrawings (filtered by selectedDrawingIds set)
           allParts (filtered by same drawing selection)
  WRITES:  Triggers browser file download: NEST-PLN-{orderIds}-{YYYYMMDD}.xlsx
  SHEET 1: "Drawing Register" — Drawing No, Title, Qty, Rev, Drawing Date,
                                 Received Date, Order ID, Phase, Priority, Wts
  SHEET 2: "Parts List" — Mark No, Drawing No, Description, Material Code,
                            L mm, W mm, Qty, Client Wt (kg), Total Wt (kg), Source
  SHEET 3: "Material Summary" — Material Code, Total Qty, Total Weight (kg)
           (aggregated from allParts, not from purchaseReqs)
  FILENAME: NEST-PLN-{orderIds}-{YYYYMMDD}.xlsx
            If >3 orders: NEST-PLN-MULTI-{YYYYMMDD}.xlsx
  DEPENDENCY: import * as XLSX from 'xlsx' (line 2 of App.jsx)
              xlsx@0.18.5 in package.json — already installed
  IF CHANGED: Keep Sheet 1-3 column order stable — nesting software may expect it

# ── Import File Parser ─────────────────────────────────────────────────
# handleNestFileChange → handleNestImport in MRPModule

nestImport.expectedColumns
  REQUIRED: "Material Code" (or matcode / material_code / mat code)
  OPTIONAL: Mark No, Drawing No, Sheet No, Sheet Dim (LxW), Parts on Sheet,
            Utilisation % (or utilisation / utilization)
  FORMAT:   .xlsx (parsed via XLSX.read) or .csv (BOM-strip + comma split)
  COLUMN MATCHING: case-insensitive, strips non-alphanumeric chars for fallback
  IF MISSING Material Code column: parse rejected with error message

nestImport.batchCreation
  ON SAVE: Groups rows by Material Code → one lot per unique matCode
           Groups rows within lot by (Sheet No + Sheet Dim) → one sheet entry
           Generates rmUnitId per sheet
           Creates NEST-PLN-YYYY-NNN batch record → appended to nestingBatches
  SUCCESS TOAST: "Batch {id} created — {N} lots, {M} sheets, {M} RM units"

# ═══════════════════════════════════════════════════════════════════
# MACHINE OBJECT (Masters)
# ═══════════════════════════════════════════════════════════════════

machine.capabilities (array: cut_straight|cut_profile|bevel|drill|grind|etc.)
  READS:   Production Step 4 — machine dropdown filter
           Step 4 — secondary assignment trigger
           Cutting confirmation — sub-stage checkboxes
           Engineer Tier 2 checklist — secondary ops section
  WRITES:  Masters → Machines tab — capabilities checkboxes
  DISPLAYS: Masters Machines tab — capability badges
             Step 4 — capability warning
             Cutting confirmation — checkbox list
  TRIGGERS: Cut capability removed → machine disappears from cutting machine dropdown
             Drill added → machine appears in secondary drilling dropdown
  IF CHANGED: Re-check active releases using this machine for affected operations

machine.bay
  READS:   Machine operator queue — pickup location, RM delivery location
           Store Admin — delivery confirmation
  WRITES:  Masters → Machines tab
  DISPLAYS: Machine operator queue card
  IF CHANGED: Update active machine assignments if bay changes

# ═══════════════════════════════════════════════════════════════════
# QC ASSIGNMENT RULES
# ═══════════════════════════════════════════════════════════════════

qcRule (processType → engineerId mapping — hybrid model)
  READS:   QC alert generation — determines assignee for new jobs
  WRITES:  QC Admin assignment rules screen
  DISPLAYS: QC Admin — rules table
  TRIGGERS: New QC job → rule evaluated → job assigned to matching engineer
             If no rule matches → job goes to QC Admin unassigned queue
  IF CHANGED: Only affects new jobs — in-flight jobs keep current assignment
             unless manually overridden by QC Admin

qcRule.override (manual reassignment log)
  READS:   Audit trail — shows deviations from rules
  WRITES:  QC Admin manual reassignment action
  DISPLAYS: QC Admin — override history per job
  IF CHANGED: Never — append only

# ═══════════════════════════════════════════════════════════════════
# PURCHASE ORDER OBJECT
# ═══════════════════════════════════════════════════════════════════

po.pricingMethod (PerUnit | PerKg)
  READS:   PO weight calculation, GRN, PO total value
  WRITES:  PO line CSV import, PO line form
  DISPLAYS: PO lines table
  TRIGGERS: PerUnit → weight = qty × length × wtPerMetre from library
             PerKg → weight = Weight Required field directly
  IF CHANGED: Recalculate affected PO line weights and total

po.unit (Sheets | Pcs)
  READS:   PO import parser
  WRITES:  PO line CSV import col "Unit", PO line form
  DISPLAYS: PO lines table
  CRITICAL: Must be "Sheets" for plates — "Kg" or anything else causes import failure
  IF CHANGED: Plates always "Sheets", sections always "Pcs"

po.coveredOrders (array of orderId strings — max 5)
  *** NEW FIELD — enables GRN auto-reservation ***
  READS:   saveGRN (PurchaseModule) — triggers auto-reservation on lot creation
           saveGRN (PODetail) — same
           PO line MRP Allocation panel — determines which orders to split across
  WRITES:  New PO modal "Orders Covered" checkboxes (active orders only, max 5)
           Initial value: [] (set in + New PO button onClick)
  DISPLAYS: Not yet displayed on PO list card — only in form during creation
  TRIGGERS: Non-empty → saveGRN writes lot.reservations[] on GRN confirm
             Non-empty → MRP Allocation panel shown per PO line
  IF CHANGED: Cannot update after PO saved — GRN already linked to original coverage
  NOTE: Distinct from po.servedOrders (display-only many-to-many link)
        coveredOrders drives auto-reservation behaviour; servedOrders is a badge tag only
  NOT IN CSV: Set only via UI form

po.includesStock (boolean)
  *** NEW FIELD — indicates PO includes general stock (no order earmark) ***
  READS:   Not yet read by any downstream component — informational only
  WRITES:  New PO modal "Stock (general)" toggle in Orders Covered section
           Initial value: false
  DISPLAYS: Not displayed post-save — form field only
  IF CHANGED: No cascade — informational flag for planner awareness
  NOT IN CSV: Set only via UI form

poLine.orderAllocations (array of {orderId, kg, unit})
  *** NEW FIELD — per-line kg split for GRN auto-reservation ***
  SHAPE:  [{ orderId: "SF-2025-0001", kg: 2500.0, unit: "MT" }, ...]
  READS:   saveGRN — used for pro-rata reservation split when po.coveredOrders is set
           MRP Allocation panel — current allocation display and edit
  WRITES:  MRP Allocation panel — auto-suggested from order part demands for this matCode;
             user can override per-order kg; "⟳ Reset" restores suggestion
           saveGRN does NOT write this — it only reads it
  DISPLAYS: MRP Allocation panel in PO line form — one input per covered order
  TRIGGERS: GRN saveGRN reads these values → pro-rata lot.reservations written
             If empty/missing → saveGRN falls back to equal split across coveredOrders
  INITIAL: Not set at PO creation — populated from Allocation panel interaction
  IF CHANGED: Only relevant before GRN is confirmed; after GRN, lot.reservations is authoritative
  NOT IN CSV: Set only via UI (allocation panel)

# ═══════════════════════════════════════════════════════════════════
# CSV IMPORT PARSERS — RULES FOR ALL PARSERS
# ═══════════════════════════════════════════════════════════════════

ALL CSV PARSERS must implement these two fixes (already done — do not revert):
  1. Strip UTF-8 BOM:
     const clean = str.charCodeAt(0) === 0xFEFF ? str.slice(1) : str
  2. Normalise line endings:
     .replace(/\r\n/g,'\n').replace(/\r/g,'\n')
  PARSERS: PO lines, Drawing Register, Drawing Part List, Materials Library

Drawing Register CSV column order (current v1.1):
  Drawing No | Title | Qty | Unit Wt (kg) | Total Wt (kg) | Phase | Priority |
  Rev No | Drawing Date | Received Date | PO Line Item | Drive Link
  NOTE: Assembly Group is NOT in the CSV — it is set in the order Assemblies tab

Drawing Part List CSV column order (current v1.1):
  Drawing No | Rev No | Drawing Line Item | Item No | Mark No | Description |
  Fab/BO | Mat Type | Grade | Section Type | Size | Length (mm) | Width (mm) |
  Qty Per Drawing | Client Unit Wt (kg) | Client Total Wt (kg) |
  Joints Allowed | Source | Required Ops
  NOTE: Required Ops values are hints — binding values set at step configuration

PO Lines CSV column order (current):
  Section Type | Size | Grade | Material Type | Length (mm) | Width (mm) |
  Qty (units) | Weight Required (kg) | Unit | Pricing Method (PerUnit/PerKg) |
  Unit Price (₹) | Manual Wt (kg/m or kg/m2) | Expected Delivery (DD-MM-YYYY) | Remarks
  CRITICAL: Unit = "Sheets" for plates, "Pcs" for sections
  CRITICAL: Pricing Method = "PerKg" or "PerUnit" — no spaces, exact case

# ═══════════════════════════════════════════════════════════════════
# DATE INPUTS — RULE FOR ALL DATE FIELDS
# ═══════════════════════════════════════════════════════════════════

ALL date inputs must:
  - type="date" HTML input
  - Store as YYYY-MM-DD string — never Date object or locale string
  - Default: new Date().toISOString().slice(0,10)
  - NEVER use toLocaleDateString() or toLocaleString()
  AFFECTED: Production machine assignment dates, GRN date, PO delivery date,
            Drawing received date, Assembly expected inspection date (new)

# ═══════════════════════════════════════════════════════════════════
# ROLE-BASED ACCESS
# ═══════════════════════════════════════════════════════════════════

Finance Admin (sameer.shah):
  CANNOT SEE: Basic Details, Shipping, Transport, Drawing Register,
              Drawing Part List, Quality, Assemblies tabs in Orders
  OPENS TO: Milestones tab by default
  NEW ASSEMBLIES TAB: Hidden from Finance Admin
  IF NEW TAB ADDED TO ORDERS: Default hidden for Finance Admin

Machine Operator (ajay.kadam):
  CANNOT SEE: Orders, Purchase, Stock, MRP Planning, Finance, Dispatch, Masters
  CAN SEE: Production (own queue only), Tools
  IF NEW PRODUCTION VIEW ADDED: Default hidden for Machine Operator

Contractor (krishna.fab):
  CANNOT SEE: Orders, Purchase, Stock, MRP Planning, Finance, Dispatch, Masters
              Other contractors' work
  CAN SEE: Production (own drawings only), Tools
  CAN SEE in contractor view: Assembly Group label on drawing (read only)
  IF NEW PRODUCTION VIEW ADDED: Default hidden for Contractor

Store Admin (mohan.das):
  CANNOT SEE: Orders (full), MRP Planning, Production (planning), Finance
  CAN SEE: Stock (full including new Reservation screen), Purchase (GRN), Dashboard
  NEW: Stock reservation screen is visible to Store Admin
  IF NEW STOCK FEATURE ADDED: Default visible for Store Admin

QC Admin:
  CANNOT SEE: Orders (financial), MRP Planning, Finance
  CAN SEE: RM Quality (full), Production (QC screens only), Stock (read)
  CAN SEE: QC Assignment Rules screen (only QC Admin can set rules)

Planning Admin (vikram.singh):
  CAN SEE: Orders (full), MRP Planning, Purchase, Stock (full), Production (full), Masters
  CAN DO: Create preliminary nesting batches, reserve stock for orders
  CAN DO: Define assemblies in order Assemblies tab
  CAN DO: Set assembly groups on drawings

Production Engineer:
  CAN SEE: Production (full), Orders (read), Stock (read), RM Quality (read)
  CAN DO: All production planning and assignment
  CANNOT DO: Change assembly group definitions (order-level — Planning Admin only)
  CANNOT DO: Change stock reservations (Stock Admin / Planning Admin only)

# ═══════════════════════════════════════════════════════════════════
# SEED DATA REFERENCE
# ═══════════════════════════════════════════════════════════════════

Seed orders:
  SF-2025-0001 — Tata Projects, TPI: welding + painting hold points
  SF-2025-0002 — BHEL, no TPI
  SF-2026-4693 — NMC Gokulpeth FOB, no TPI, no assembly inspection required

Seed machines:
  Plasma Cutter 1: [cut_straight, cut_profile, bevel, grind]
  Flame Cutter 1:  [cut_straight, cut_profile, bevel]
  Band Saw 1:      [cut_straight, grind]
  MIG Welder 1, MIG Welder 2, SAW: no cut capabilities
  Pillar Drill 1:  [drill, mark]

Seed users:
  rajesh.kumar / admin123    — Super Admin
  vikram.singh / plan123     — Planning Admin
  sameer.shah  / fin123      — Finance Admin
  ajay.kadam   / machine123  — Machine Operator
  krishna.fab  / contractor123 — Contractor
  mohan.das    — Store Admin (verify password in seed data)
  arjun.qc / qc123           — QC User (filtered SupervisorQueue by assignedEngineer)

Materials Library:
  528 entries in src/materials_library_complete.js
  Library lookup must normalise size strings before matching
  Known issue: some RHS/SHS entries had .0 suffix — fixed

# ═══════════════════════════════════════════════════════════════════
# REGRESSION CHECKLIST — RUN AFTER EVERY CLAUDE CODE SESSION
# ═══════════════════════════════════════════════════════════════════

ORDERS MODULE:
  [ ] All 9 tabs visible including Transport and Assemblies (when required)
  [ ] Assembly Inspection Required toggle in Basic Details
  [ ] Assemblies tab: hidden when toggle = No, visible when Yes
  [ ] Assemblies tab: add/edit assembly groups with drawings assigned
  [ ] Drawing Register: Assembly Group column with dropdown matching order assemblies
  [ ] TPI hold points: 5 checkboxes (RM Inspection, Fit-Up, Welding, Blasting, Painting)
  [ ] Finance Admin: Assemblies tab hidden, opens to Milestones tab

STOCK MODULE:
  [ ] Lot statuses: QC Hold, Available, Reserved, Allocated, Issued, Consumed, Written Off
  [ ] Reservation screen: reserve lot for order with kg split
  [ ] Multiple reservations on one lot shown correctly
  [ ] Release reservation works (Planning Admin / super_admin)
  [ ] Nesting confirmation → reservations auto-convert to allocations
  [ ] Off-cut inherits parent reservation
  [ ] All existing filters still work: Available, QC Hold, Allocated, Issued, Off-cuts
  [ ] Issue request flow unchanged: IRQ → Store Admin confirms → Issued → operator STATE 4
  [ ] Off-cut return: operator enters → store admin alert → verify → Available

PURCHASE MODULE:
  [ ] CSV import BOM strip working
  [ ] CSV import line ending normalisation working
  [ ] PerUnit weight calculation correct
  [ ] PerKg weight calculation correct
  [ ] GRN raises correctly, lots in QC Hold
  [ ] + New PO button initialises coveredOrders:[] and includesStock:false
  [ ] Orders Covered checkboxes show only Active orders (max 5) + Stock toggle
  [ ] MRP Allocation panel appears when coveredOrders non-empty AND matCode set AND wtOrdered > 0
  [ ] MRP Allocation panel splits kg by order part demand (pro-rata)
  [ ] ⟳ Reset button restores suggested allocation
  [ ] GRN saveGRN writes lot.reservations[] when po.coveredOrders is set
  [ ] Single-order GRN → lot.status = 'reserved' after QC passes
  [ ] Multi-order GRN → lot.status = 'partially_reserved' after QC passes
  [ ] GRN with no coveredOrders → lot.status = 'available' after QC passes (unchanged)

RM QUALITY MODULE:
  [ ] Inspect → MTC upload → Pass QC → Client Inspection Pending
  [ ] Client Inspection Approve → Available status (no reservations)
  [ ] Client Inspection Approve → Reserved status (1 reservation)
  [ ] Client Inspection Approve → Partially Reserved status (2+ reservations)
  [ ] Revert functions work (super_admin only)

PRODUCTION MODULE:
  [ ] Cross-order drawing register shows all active drawings
  [ ] Assembly Group column shows values from order Assemblies tab
  [ ] Filter by assembly group works
  [ ] Filter exclude missing RM works
  [ ] Expandable row: part status, RM status (showing reserved/allocated), machine/contractor
  [ ] Step configuration: assembly group shown read-only (not editable here)
  [ ] Step configuration: Assembly step auto-shown for drawings with assembly group
  [ ] Step configuration: no Assembly step for drawings with blank assembly group
  [ ] Nesting panel: material shown in 3 tiers (reserved/available/other-order amber)
  [ ] Nesting confirmation: hard allocations auto-created, lot status → Allocated
  [ ] Machine assignment: expandable lots → RM units
  [ ] Date inputs show 2026 not 0002
  [ ] QC alert chain fires after machine operator marks complete
  [ ] QC Admin rules route correctly, override works
  [ ] Contractor dashboard: part status table correct counts
  [ ] Assembly stage: shows group completion (X/9 drawings complete)
  [ ] Assembly stage: hard gate enforced — all drawings must reach Weld QC Cleared
  [ ] Assembly TPI gate: if tpiRequired on assembly = Yes, IRN required before blasting
  [ ] EOD prompt to contractor at 5pm if no update
  [ ] Production engineer flagged next morning for missing EOD updates
  [ ] Release Wizard: confirmed lot shows status 'reserved' (not 'allocated') after confirm
  [ ] Release Wizard Step 4: reserved-for-this-order lots appear first with ✓ label
  [ ] Release Wizard Step 4: lots reserved for other orders are hidden
  [ ] Release Wizard Step 4: allocated/issued/consumed lots are hidden
  [ ] Release Wizard confirm: part.requiredOps updated from confirmedOps (binding write)
  [ ] Release Wizard confirm: drawing.productionSteps written with correct stage sequence
  [ ] Release Wizard confirm: secondaryAssignments persisted in release.machineAssignments
  [ ] Release Wizard confirm: release.drawings[].stages contains contractor stage list

MRP MODULE — NESTING EXPORT:
  [ ] "Export Nesting Sheets" button goes to MRPNestExport view
  [ ] Per-drawing checkboxes in overview tab select/deselect drawings for export
  [ ] Selection count shown when not all drawings selected
  [ ] MRPNestExport: "Download Excel" button triggers file download (not a stub)
  [ ] Downloaded file is named NEST-PLN-{orderId}-{YYYYMMDD}.xlsx
  [ ] Excel file has 3 sheets: Drawing Register, Parts List, Material Summary
  [ ] Only selected drawings appear in Sheet 1 and Sheet 2
  [ ] Material Summary aggregates from parts (not purchaseReqs)

MRP MODULE — NESTING IMPORT:
  [ ] "Import Nesting Results" button opens modal with real file picker
  [ ] File picker accepts .xlsx and .csv
  [ ] Uploading a valid file shows parse-preview table (matCode, sheets, parts, RM Unit IDs)
  [ ] Missing Material Code column shows clear error message
  [ ] "Create Nesting Batch" button disabled until file parsed successfully
  [ ] On import: batch record NEST-PLN-YYYY-NNN created in nestingBatches state
  [ ] Success toast shows: lot count, sheet count, RM unit count
  [ ] Nesting Runs tab Section A shows new batch with expand arrow

MRP MODULE — NESTING RUNS TAB:
  [ ] Tab has two sections: "Planning Batches" and "Production Nesting Runs"
  [ ] Section A empty state message when no batches yet
  [ ] Section A: click batch row to expand → shows lots
  [ ] Section A: click lot row to expand → shows sheets table
  [ ] Sheets table columns: Sheet No, Dimensions, RM Unit ID, Utilisation %, Parts on Sheet
  [ ] Utilisation % colour coded: green ≥85%, amber ≥70%, red <70%
  [ ] Section B: existing DeepNest bridge table unchanged

MASTERS MODULE:
  [ ] Machine capabilities save correctly
  [ ] Materials Library 528 entries, search works
  [ ] Clients, Vendors, Bays, Approved Makes, TPI Agencies all functional

ROLE ACCESS:
  [ ] Machine operator: Production (own queue) + Tools only
  [ ] Contractor: Production (own drawings) + Tools only
  [ ] Finance Admin: Milestones tab only in Orders, Assemblies tab hidden
  [ ] Store Admin: Stock (full with reservation) + Purchase (GRN) + Dashboard

# ═══════════════════════════════════════════════════════════════════
# MAINTENANCE INSTRUCTIONS
# ═══════════════════════════════════════════════════════════════════

When adding a new field:
  1. Add to this map under correct object
  2. List READS, WRITES, DISPLAYS, TRIGGERS, IF CHANGED
  3. Add to CSV parser section if CSV-importable
  4. Add to regression checklist

When modifying an existing field:
  1. Find it in this map
  2. Check and update ALL READS locations
  3. Check and update ALL DISPLAYS locations
  4. Update IF CHANGED note

When adding a new module or screen:
  1. Add role access rules to ROLE-BASED ACCESS section
  2. Add new data objects to this map
  3. Add regression checklist items

KEY DESIGN DECISIONS RECORDED HERE:
  - Assembly groups defined at ORDER level (Assemblies tab) — not at production step config
  - Stock SOFT LOCK = 'reserved' status — set by Release Wizard OR GRN auto-reservation
  - Stock HARD LOCK = 'allocated' status — set ONLY by Nesting NEST-BCH confirmation
  - Release Wizard confirm() writes 'reserved' NOT 'allocated' (corrected in Session 4)
  - lot.reservations[] is the canonical reservation record — multiple sources can write it
  - lot.reservedFor is a convenience scalar for single-order wizard reservations only
  - 'partially_reserved' is a new status for lots split across ≥2 orders via GRN auto
  - GRN auto-reservation: lots stay qc_hold with lot.reservations populated until QC passes
  - doClientInsp applies the final status (reserved/partially_reserved/available) based on reservations
  - po.coveredOrders drives GRN auto-reservation; po.servedOrders is display-only (badge tag)
  - poLine.orderAllocations enables pro-rata split; fallback is equal split across coveredOrders
  - drawing.productionSteps written at Release Wizard confirm() — NOT at a separate config step
  - buildProductionSteps() generates the full stage sequence including TPI hold points and paint coats
  - part.requiredOps: HINT at import, BINDING after Release Wizard confirm() writes confirmedOps
  - release.machineAssignments[].secondaryAssignments: persisted capability-gap machines per op
  - release.drawings[].stages: contractor stage list (fit_up, welding, etc.) for that drawing
  - Required Ops on parts are HINTS at import — BINDING values set at step configuration
  - QC is ALWAYS automatic after every machine operation — cannot be removed from flow
  - EOD contractor update is a CONVENTION (production engineer enforces) — not a system block
  - 1D bar nesting built IN ERP — no external API needed
  - Plate nesting: MRP module exports/imports XLSX locally via SheetJS — NO external API
    (Nesting Center API proxy exists in vite.config.js but is NOT called by any code yet)
  - nestingBatches (NEST-PLN) and nestingRuns (NEST-YYYY-NNN) are SEPARATE state arrays
    PLN = planning batches from nesting software import → shown in Nesting Runs tab Section A
    BCH = production runs from DeepNest bridge → shown in Nesting Runs tab Section B
  - nestingBatch.source distinguishes import / api / manual origins
  - nestingBatch.apiJobs reserved for future Nesting Center API integration (empty now)

Last updated: April 2026 — Session 4 Phase 3 (Fix A/B + map update) — v1.5
