# STRUCTO ERP — DEPENDENCY MAP
# Version 1.5 — April 2026
# Updated: Release Wizard (productionSteps, requiredOps binding, lot reservation fix)
#          PO smart allocation (coveredOrders, includesStock, orderAllocations)
#          GRN auto-reservation (lot.reservations extended, partially_reserved status)
#          lot.status correction: wizard now writes 'reserved' not 'allocated'
#          Nesting integration fields documented
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

lot.status (qc_hold | available | reserved | partially_reserved | allocated | issued | consumed | written_off | pending_offcut_verification)
  *** CORRECTED: Release Wizard writes 'reserved' not 'allocated' — see lot.reservedFor ***
  *** NEW STATUS: partially_reserved — lot split across multiple orders via GRN auto-reservation ***
  FULL STATUS LIFECYCLE:
    GRN created               → qc_hold
    RM QC approved            → qc_hold (unchanged — needs client inspection too)
    Client inspection approved (no reservations) → available
    Client inspection approved (1 reservation)   → reserved
    Client inspection approved (2+ reservations) → partially_reserved
    Release Wizard confirm()  → reserved (was incorrectly 'allocated' — FIXED)
    GRN auto-reservation set  → stays qc_hold until QC passes (pendingReservations:true)
    Off-cut created           → pending_offcut_verification
    Store Admin verifies      → available (or reserved if parent had reservations)
    Nesting NEST-BCH confirm  → allocated (HARD LOCK — this is the only path to allocated)
    Store Admin issues        → issued
    Cutting confirmation      → consumed
  READS:   computeRmPicture — includes available+qc_hold+reserved+partially_reserved lots
           Release Wizard Step 4 dropdown — hides allocated/issued/consumed
           Stock module filter tabs
           Off-cut verification banner — pending_offcut_verification
  WRITES:  doClientInsp — sets available/reserved/partially_reserved based on lot.reservations
           Release Wizard confirm() — sets 'reserved' (FIXED — no longer 'allocated')
           GRN saveGRN — stays qc_hold with pendingReservations:true if coveredOrders set
           Nesting NEST-BCH — sets 'allocated'
           Store Admin issue — sets 'issued'
           Cutting — sets 'consumed'
           Off-cut creation — sets 'pending_offcut_verification'
           Store Admin verify — sets 'available' or 'reserved' based on parent.reservations
  DISPLAYS: Stock module STATUS column badge (stCol map includes partially_reserved → amber)
             Production register RM status dot
             Release Wizard Step 4 lot dropdown — shows only eligible lots
             Stock module "Off-cuts Pending Verification" banner
  TRIGGERS: reserved/partially_reserved → lot appears in reserved order's Step 4 dropdown with ✓
             reserved/partially_reserved → included in computeRmPicture lot filter
             pending_offcut_verification → Store Admin alert banner only
  IF CHANGED: Manual status change (super_admin only) must be logged with reason
  IMPORTANT: 'allocated' is ONLY set by Nesting NEST-BCH confirmation (hard lock)
             'reserved' is the soft lock — set by wizard confirm() and GRN auto-reservation
             Off-cut verification restores to 'reserved' (not 'available') if parent had reservations

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
  NOTE: Lots remain qc_hold with pendingReservations:true until client inspection passes
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
  *** NEW FIELD — GRN auto-reservation flag until QC clearance ***
  READS:   doClientInsp — if true, applies reservation-based status (reserved/partially_reserved)
  WRITES:  saveGRN when po.coveredOrders is set — set to true
           doClientInsp — set to false after status applied
  NOTE:    While true, lot.reservations are recorded but lot.status stays qc_hold
           After doClientInsp clears: pendingReservations=false, status becomes reserved/partially_reserved
  IF CHANGED: Never set manually — managed by GRN and QC inspection flow

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
  WRITES:  handleNestImport — auto-generated from nestingBatches sequence
  DISPLAYS: Nesting Runs tab Section A — Planning Batches
  IF CHANGED: Never — all child lotIds would break

nestingBatch.lots[].rmUnitId (format: matCode/sheetDim/n-total)
  *** IMPLEMENTED — generated at import time ***
  FORMAT:  {matCode}/{sheetDim}/{n}-{total}
           Example: PLATE/E250/12mm/2500x1250/1-4
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
  - GRN auto-reservation: lots stay qc_hold with pendingReservations:true until QC passes
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
