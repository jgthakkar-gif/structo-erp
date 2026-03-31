# STRUCTO ERP — DEPENDENCY MAP
# Version 1.1 — March 2026
# Updated: Assembly definition moved to order level
#          Stock reservation model replaces drawing-level manual allocation
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

drawing.productionSteps (array of step objects — configurable)
  READS:   Machine assignment — step sequence
           Contractor dashboard — visible stages
           QC alert chain — which QC type at each stage
           Instance stage progression — next stage
  WRITES:  Production step configuration modal
  DISPLAYS: Instance detail timeline, Contractor dashboard stage indicator
  TRIGGERS: Step added/removed → all instances for this drawing update stage map
  NOTE: Assembly step is auto-inserted based on drawing.assemblyGroup
        Do not manually insert Assembly step here — it is derived
  IF CHANGED: Warn if instances are already past the modified step

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
  READS:   Machine assignment — secondary station determination
           Cutting confirmation — sub-stage checkboxes
           Step configuration — operations confirmation display
  WRITES:  Drawing Part List tab
           Step configuration modal — per part confirmation (overrides import value)
           CSV import col "Required Ops"
  DISPLAYS: Drawing Part List table — Req Ops badges
             Machine assignment — capability warning
             Cutting confirmation — operation checkboxes
  TRIGGERS: Drill added → check machine capability → secondary station row if needed
  NOTE: Value entered at drawing import is a default/hint
        Confirmed value is set at production step configuration — this is the binding value
  IF CHANGED: Re-evaluate machine assignments for active releases

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

lot.status (QC Hold | Available | Reserved | Allocated | Issued | Consumed | Written Off | pending_offcut_verification)
  READS:   Nesting panel — material tier display (reserved/available/other-order)
           Production drawing register — RM status dots (green/amber/red)
           MRP Planning — net available stock
           Stock module filters
           Off-cut verification banner — filters pending_offcut_verification lots
  WRITES:  RM Quality (QC Hold → Available)
           Stock reservation screen (Available → Reserved) — CHANGED FROM OLD MODEL
           Nesting confirmation (Reserved → Allocated) — AUTO now, not manual
           Store Admin confirm issue (Allocated → Issued)
           Cutting confirmation (Issued → Consumed)
           Cutting confirmation off-cut creation (→ pending_offcut_verification)
           Store Admin off-cut verify: pending_offcut_verification → Available
           Store Admin off-cut reject: pending_offcut_verification → alert on operator next bar form
  DISPLAYS: Stock module STATUS column
             Production register RM status dot
             Nesting panel — material tier indicator
             Stock module "Off-cuts Pending Verification" banner (pending_offcut_verification)
  TRIGGERS: Available → appears in all orders' nesting panels
             Reserved → appears preferentially in reserved order's nesting
             Reserved → appears with amber warning in other orders' nesting
             Allocated → locked to specific nesting run, specific parts
             Issued → machine operator card goes to STATE 4
             pending_offcut_verification → appears in Store Admin alert banner only
             Verified (→ Available) → off-cut inherits parent.reservations automatically
  IF CHANGED: Manual status change (super_admin only) must be logged with reason
  NOTE: pending_offcut_verification is a transient state — off-cuts are NOT available
        for nesting or reservation until Store Admin verifies dimensions

lot.reservations (array of {orderId, kg, reservedBy, reservedAt})
  *** NEW FIELD — replaces drawing-level allocations for soft lock ***
  READS:   Stock reservation screen — current reservation splits shown
           Nesting panel — which reservations apply to current order
           MRP Planning — reserved stock per order
  WRITES:  Stock reservation screen — Reserve for Order action
  DISPLAYS: Stock module — reservation detail per lot
             Stock reservation screen — existing reservation table
  TRIGGERS: Reservation added → lot.status changes to Reserved
             All reservations removed → lot.status returns to Available
             Nesting confirmed → reservation converts to hard allocation automatically
  IF CHANGED: If reservation removed after nesting confirmed — requires super_admin

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

lot.batchNo
  READS:   Off-cut inheritance, MDCC dossier, QC records
  WRITES:  Auto-generated at GRN save
  DISPLAYS: Stock module BATCH NO column, lot tags, GRN record
  TRIGGERS: Off-cut inherits this batch number
  IF CHANGED: Never — traceability chain breaks

lot.heatNo
  READS:   RM Quality inspection, MDCC dossier, TPI inspection
  WRITES:  GRN entry, RM Quality inspection confirmation
  DISPLAYS: Stock module HEAT NO column, lot detail
  IF CHANGED: Requires super_admin — log reason — alert QC Admin

lot.mtcLink (Google Drive URL)
  READS:   RM Quality, Client inspection, MDCC dossier
  WRITES:  RM Quality inspection modal
  DISPLAYS: Stock module MTC column (tick or Missing badge)
  TRIGGERS: Set → MTC badge turns green tick
             Missing → client inspection blocked
  IF CHANGED: Verify new link accessible and correct document

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
  TRIGGERS: drill unchecked AND machine has drill cap → currentStatus:"pending_secondary"
  NOTE: Only checkboxes for capabilities present on the assigned machine are shown
        e.g. if machine has no 'drill' capability, drill checkbox is hidden
  IF CHANGED: pending_secondary instances need routing to secondary machine assignment

instance.defectAction (scrap_recut | rectify | accept_deviation)
  *** NEW FIELD — set at cutting confirmation when isDefective=true ***
  READS:   QC Admin — defect resolution tracking
  WRITES:  Cutting confirmation bar form — defectAction select (visible when isDefective)
  DISPLAYS: Cutting confirmation, QC Admin pending jobs
  TRIGGERS: scrap_recut → part re-enters nesting queue
             rectify → part stays at cutting stage pending fix
             accept_deviation → part proceeds with deviation note
  IF CHANGED: Requires super_admin after initial save

stageHistory[].weldGaugeReading (number, mm — welding stage)
stageHistory[].postWeldLength (number, mm — welding stage)
  *** NEW FIELDS — recorded at welding stage approval ***
  WRITES:  SupervisorQueue welding stage form — Measurements section
  DISPLAYS: Welding approval form, MDCC dossier
  IF CHANGED: Never edit after approved — historical QC record

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
# NESTING OBJECTS
# ═══════════════════════════════════════════════════════════════════

nestingBatch.type (NEST-PLN = preliminary | NEST-BCH = floor)
  READS:   MRP Planning — shows PLN batches
           Production — shows BCH batches
           Comparison view — PLN referenced by BCH
  WRITES:  MRP Planning (PLN), Production nesting panel (BCH)
  IF CHANGED: Never change type after creation

nestingBatch.parentPlanBatchId (NEST-BCH references parent NEST-PLN)
  READS:   Comparison view — shows deviation from preliminary plan
  WRITES:  Set when floor batch is created
  DISPLAYS: Nesting panel comparison view
  IF CHANGED: Never — historical reference

nestingLot.rmUnitIds (array of RM Unit ID strings)
  READS:   Machine assignment, Machine operator queue, Cutting confirmation,
           Off-cut return, MDCC dossier
  WRITES:  Nesting result processing — from API response or 1D calculator
           Set automatically on nesting confirmation — not manually entered
  DISPLAYS: Machine assignment expandable lot view, Machine operator queue card
  TRIGGERS: Created → lot.allocations auto-created from nesting output
             Created → lot.status changes from Reserved to Allocated
             Created → machine assignment screen shows expandable unit rows
  IF CHANGED: Never — if re-nesting needed, use re-nest workflow

nestingLot.sourceReservations (array of lotId + orderId that fed this nesting lot)
  READS:   Traceability — which reservations became this allocation
  WRITES:  Set automatically at nesting confirmation
  DISPLAYS: Nesting lot detail
  IF CHANGED: Never — historical record

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
  rajesh.kumar / admin123 — Super Admin
  vikram.singh / plan123  — Planning Admin
  sameer.shah  / fin123   — Finance Admin
  ajay.kadam   / machine123 — Machine Operator
  krishna.fab  / contractor123 — Contractor
  mohan.das    — Store Admin (verify password in seed data)

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

RM QUALITY MODULE:
  [ ] Inspect → MTC upload → Pass QC → Client Inspection Pending
  [ ] Client Inspection Approve → Available status
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
  - Stock reservation is a SOFT LOCK at order level — manual, simple
  - Stock allocation is a HARD LOCK from nesting output — automatic, no manual entry
  - Required Ops on parts are HINTS at import — BINDING values set at step configuration
  - QC is ALWAYS automatic after every machine operation — cannot be removed from flow
  - EOD contractor update is a CONVENTION (production engineer enforces) — not a system block
  - 1D bar nesting built IN ERP — no external API needed
  - Plate nesting uses Nesting Center API — REST API, Python/JS client

Last updated: March 2026 — Session 4 Phase 3 (gap fill) — v1.3
