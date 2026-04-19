# STRUCTO ERP — Session 4: Production Module
# Complete Specification v3 — All Decisions Locked
# Updated: March 2026

---

## 1. ROLES

New role: machine_operator
Add to PERMISSIONS:
- modules: ["dashboard","production"]
- canApprove: false, canOverride: false

Add to USERS seed:
{ id:"U033", name:"Ajay Kadam", username:"ajay.kadam", password:"machine123", role:"machine_operator" }
{ id:"U034", name:"Ravi Thakur", username:"ravi.thakur", password:"machine123", role:"machine_operator" }

Add to ROLES array:
{ id:"machine_operator", label:"Machine Operator", dept:"Production", level:"user" }

Add to Login quick-login panel:
Machine Operator — ajay.kadam / machine123

Role mapping in production:
- floor_planner/planning_admin: create releases, assign RM to machines, assign drawings to contractors
- machine_operator: machine queue, request RM from stores, mark parts cut
- contractor: fit-up/welding/blasting/painting queue, mark stages Done
- production_engineer: supervisor for fit-up, welding, blasting soft gates (shared queue + optional pin)
- qc_admin: supervisor for TPI, painting DFT, MDCC
- store_admin: issue requests from machine operators, confirm physical issue
- dispatch_admin: final dispatch stages

Supervisor assignment: Option B (stage-based) + Hybrid (shared queue, optional pin)
- All production_engineers see all fit-up/welding queues
- PM can optionally pin a specific engineer to a drawing
- Pinned drawing appears at top of that engineer's queue with pin badge
- Other engineers can still act on it

---

## 2. CORE CONCEPTS

Production Release: top-level container grouping multiple drawings
from multiple orders into one batch release to the floor.
ID format: PR-{YYYY}-{3-digit-seq}

Production Instance: atomic unit, one physical cut piece.
Created when cutting is confirmed on a bar/sheet.
Identity: MarkNo/DrawingNo/OrderID/Inst-N

Stage sequence:
Cutting -> Fit-Up -> Welding -> TPI Weld ->
Blasting -> Painting (N coats) -> TPI Paint -> MDCC -> Dispatch

Outbound Processing can interrupt at any stage (max twice per instance).

Hard Gates (no override):
- TPI Weld approval before Blasting
- TPI Paint approval before MDCC
- MDCC complete before Dispatch
- RM Issue confirmed by stores before machine operator can cut

Soft Gates: supervisor approval required at every stage transition.
Rejection sends instance back to floor with mandatory reason.
2+ rejections on same stage = quality concern flag.

---

## 3. PRODUCTION STANDARDS — MASTERS SUB-TAB

Add "Production Standards" sub-tab in Masters.
Visible to: super_admin, planning_admin only.

App state — add to App component:

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
})

Pass productionStandards and setProductionStandards as props to MastersModule.

Three editable sections on the Production Standards tab:

Section A — Assembly Tier Rules:
Editable table: Tier | Max Parts | Max Weight (kg)
Super admin can edit thresholds.

Section B — Stage Duration Estimates (hours):
Editable table: Tier | Cutting | Fit-Up | Welding | Blasting | Paint/coat
All cells editable. Plant incharge sets from experience.
Note: "These estimates drive drawing criticality scores and cut-ahead dates."

Section C — Piece Stamp Location Convention:
Editable table: Section Types | Stamp Location
Pre-filled with seed values above. Add/edit/delete rows. Super admin only.

Utility functions — add to App component:

const getAssemblyTier = (drawing, productionStandards) => {
  const partCount = (drawing.parts||[]).length
  const totalKg = (drawing.parts||[]).reduce((s,p)=>(s+(p.clientTotalWt||0)),0)
  const tiers = productionStandards.tiers
  return tiers.find(t => partCount <= t.maxParts && totalKg <= t.maxKg) || tiers[tiers.length-1]
}

const getCriticalityScore = (drawing, order, productionStandards) => {
  const tier = getAssemblyTier(drawing, productionStandards)
  const today = new Date()
  const dispatch = new Date(order.endDate)
  const daysRemaining = Math.max(0,(dispatch-today)/(1000*60*60*24))
  const coatCount = Math.max(1,order.quality?.paintCoats?.length||1)
  const hoursNeeded = tier.cutting+tier.fitup+tier.welding+tier.blasting+(tier.paintPerCoat*coatCount)
  const tpiBuffer = order.quality?.tpiRequired ? 3 : 0
  const workingDaysNeeded = (hoursNeeded/8)+tpiBuffer
  return workingDaysNeeded > 0 ? daysRemaining/workingDaysNeeded : 999
}

const getStampLocation = (sectionType, productionStandards) => {
  const match = productionStandards.stampLocations.find(sl =>
    sl.sectionTypes.some(st => st.toUpperCase()===(sectionType||'').toUpperCase()))
  return match?.location || 'Top face, centre of piece'
}

---

## 4. MACHINES MASTER SUB-TAB

Add Machines sub-tab to Masters. Super Admin only.
Fields: Machine Name | Type (Cutting/Welding/Other) | Bay Location | Active

Seed data:
Plasma Cutter 1 — Cutting — Bay 3
Flame Cutter 1 — Cutting — Bay 3
Band Saw 1 — Cutting — Bay 5
MIG Welder 1 — Welding — Bay 7
MIG Welder 2 — Welding — Bay 7
SAW Machine 1 — Welding — Bay 8

---

## 5. PRODUCTION RELEASE DATA STRUCTURE

Add to App state:
const [releases, setReleases] = useState([])

Structure:
{
  id: "PR-2026-001",
  releaseDate: "2026-03-22",
  createdBy: "suresh.patel",
  status: "in_progress",
  drawings: [
    {
      drawingId, drawingNo, orderId, orderNo,
      contractorId, contractorName,
      stages: ["fitup","welding"],
      pinnedEngineerId, pinnedEngineerName,
      tier, criticalityScore
    }
  ],
  machineAssignments: [
    {
      id, matCode, lotId, lotNo,
      machineId, machineName,
      startDate, endDate, cutAheadDate,
      assignedBy, status,
      issueRequestId, issueNoteId
    }
  ],
  rmPicture: [
    { matCode, requiredKg, requiredM, availableKg, status, lots:[] }
  ]
}

---

## 6. PRODUCTION RELEASE CREATION — 5 STEPS

Step 1 — Select Drawings:
Show all drawings across all orders that are:
- receivedDate is set
- Not already in another active release

Columns: checkbox | Drawing No | Order | Client | Phase | Parts | Weight | Tier | Priority Score | RM Status

Priority Score display:
> 1.5 = green badge "On track"
1.0-1.5 = amber badge "Monitor"
< 1.0 = red badge "Critical"
< 0 = pulsing red badge "OVERDUE"

Sort by score ascending by default (most critical at top).
Show tier badge (Simple/Medium/Complex/Heavy) per drawing.

Step 2 — RM Picture:
Aggregate all parts (fabType=Fabricate, source=Procure) from selected drawings.
Group by matCode.
Columns: Material Code | Section | Grade | Required (kg) | Required (m or m2) |
Available (kg) | Status | Lots Available

+ expand per row: which lots cover this material, which drawings need it and how much.

Status values:
Sufficient (available >= required) — green
Partial (0 < available < required) — amber
QC Pending — amber
Not Received — red

Step 3 — Smart Suggestions:
Algorithm:
1. For each matCode, calculate remainingStock = available - requiredBySelected
2. Scan ALL drawings across ALL orders (not already selected, not in another release)
3. Score each candidate:
   Score A (no cost): ALL matCodes coverable from remainingStock — show green
   Score B (minor top-up): extra procurement < 20% of current total — show amber
4. Show Score A as "Add at no cost" and Score B as "Add with minor top-up"
5. Cross-order suggestions included
6. Approved makes conflict check: if two orders need same material but require
   different approved makes from the same lot — show warning, do not block

Step 4 — Assign Machines:
For each matCode where status = Available:
- Machine dropdown (from Machines master, type=Cutting)
- Lot selector (pre-selected, editable)
- Start date, End date
- Show cut-ahead date: today + (tier.fitup/8) days
- Warn amber if end date > cut-ahead date

Materials not yet available shown as greyed out with reason.

Step 5 — Assign Contractors:
Per drawing: Contractor dropdown | Stages | Pin to engineer (optional)
On confirm: populate machine operator queues and contractor queues.

---

## 7. RM ISSUE REQUEST FLOW

Structure:
{
  id: "IRQ-2026-001",
  requestDate, requestedBy, machineId, machineName,
  releaseId, machineAssignmentId,
  lotId, lotNo, matCode, wtRequested,
  status: "pending", // pending/issued/cancelled
  issuedBy, issueDate, issueNoteNo, remarks
}

Machine operator flow (6 queue states):
STATE 1 — RM NOT ASSIGNED: gray card, no action
STATE 2 — REQUEST RM: blue card, "Request Issue from Stores" button
STATE 3 — AWAITING STORES: amber card, shows request ID, no action
STATE 4 — RM IN HAND: green card, "View Nesting Plan" + "Mark Parts Cut" buttons
STATE 5 — CUTTING IN PROGRESS: shows cutting checklist
STATE 6 — CUTTING COMPLETE: pending supervisor confirmation

Store admin sees issue requests in Stock module under "ISSUE REQUESTS" section:
Each request shows: machine, operator, material, lot, weight, bay, date
Actions: Confirm Issue (opens issue note) | Reject (with reason)

On confirm: issue note auto-generated ISN-{YYYY}-{NNN}
Machine operator queue updates to STATE 4.

Off-cut return flow:
After cutting completion with off-cut dimensions entered:
Store admin sees "PENDING OFF-CUT RECEIPT" in stock module.
On confirm receipt: new lot created inheriting parent batch number.

---

## 8. CUTTING CONFIRMATION

Two-tier: machine operator marks (Tier 1), production engineer signs off (Tier 2).
Instance created only after Tier 2 sign-off.

Partial bar: bar can be partially confirmed.
Parts for Order A cut today — instances created for A.
Parts for Order B cut tomorrow — instances created later.

Per part in cutting confirmation screen:
- Actually cut: numeric input (default = planned qty)
- Sub-ops checkboxes: Cut | Bevel | Grind | Drill
- MANDATORY piece marking checkbox:
  "Mark No stamped on all [qty] pieces"
  Location shown: getStampLocation(part.sectionType, productionStandards)
  Stamp text shown: [markNo] / [drawingNo]
  Cannot submit until ALL piece marking checkboxes ticked.
  If cannot stamp: reason required, QC Admin notified.
- Defect checkbox: if ticked, reason dropdown, system checks off-cuts for replacement

Off-cut entry:
Checkbox: Return off-cut to stores
If ticked: length (sections) or length x width (plates)
Estimated weight auto-calculated from dimensions + library wtPerMetre/wtPerM2

On confirm: instances created, collection notifications sent,
off-cut lot created, nesting run bar marked confirmed,
parent lot wtConsumed updated.

Store on each instance:
markingConfirmed, markingLocation, markingDate, markingBy

---

## 9. CONTRACTOR ASSEMBLY SCREEN

My Work Queue grouped by Production Release -> Drawing.

Queue states:
READY TO COLLECT: cutting confirmed, shows which machine area, Confirm Collection button
IN PROGRESS: collected, stage checkboxes shown
WAITING FOR CUTTING: shows expected cutting date
WAITING FOR RM: shows blocking reason
PENDING SUPERVISOR: marked done, awaiting sign-off
COMPLETED: supervisor approved

Stage completion checkboxes — fit-up example:
- All parts present per drawing
- Dimensions within tolerance
- Alignment acceptable
- Tack welds placed
- Bought-out items present (if any — shows issue status per BO item)
MARK [STAGE] COMPLETE — large button, mobile-friendly

Bought-out items checklist shown below fabrication parts.
Cannot mark fit-up complete until all bought-out items show as issued.

---

## 10. SUPERVISOR SOFT GATE SCREEN

Approval queue sorted by urgency (dispatch date proximity).
Pinned drawings at top with pin badge.

Each item shows: Mark No / Drawing / Order / Stage /
Contractor / Time since marked done / Rejection flag if 2+

Stage checklists:

Fit-Up:
- All parts present per drawing
- Dimensions within tolerance
- Alignment acceptable
- Tack welds correctly placed

Welding:
- All joints welded
- Visual weld quality acceptable
- No undercutting or porosity visible
- Spatter cleaned
[Read-only reference box shown if order.quality.weldSpec.weldingSequence is set:
"Welding sequence instructions from QC: [weldingSequence text]"]

Blasting:
- Surface grade achieved (Sa 2.5 / Sa 3)
- No missed areas
- Completed within time limit before painting
- All pieces re-marked with paint pen post-blast
- Mark numbers legible and match cut list
- Surface profile achieved

Painting (per coat):
- Coat applied uniformly
- DFT reading: [numeric input] micrometers (required, within 10% of spec)
- No runs or holidays
- Dry before next coat

MDCC: driven by order MDCC dossier checklist (all mandatory items)

Actions: APPROVE (moves to next stage) | REJECT (mandatory reason, back to contractor)
2+ rejections: quality concern flag, QC Admin notified, PM sees flag.

Full drawing progress grid per drawing:
Columns: Mark No | Desc | Total | Cut | FU | WLD | BLS | PNT | Done
Color: green=all done, amber=partial, gray=not started, red=rejected

---

## 11. OUTBOUND PROCESSING

Types: Bending / Rolling / Galvanising / Hot Dip Galvanising / Powder Coating / Other
Max twice per instance. Can interrupt at any stage.

Flow: PM creates outbound request -> stores issues to vendor (same issue note process)
-> instance status: OUTBOUND — [Type] — [Vendor] — due [date]
-> all parties see outbound status
-> piece returns -> stores records return -> instance resumes at same stage

Outbound history logged on instance.

---

## 12. TPI HARD GATES

TPI Weld: hard stop before Blasting.
TPI inspector name, inspection date, report number entered.
Report document uploaded (Drive link).
No override. Full stop until approved.

TPI Paint: hard stop before MDCC.
Same fields as TPI Weld.
No override.

---

## 13. MDCC DOSSIER COMPLETION

Driven by order.quality.mdccDocs checklist.
All mandatory docs must show green tick before MDCC can be submitted.
On submission: MDCC reference number entered, client response tracked.
MDCC received = hard gate before dispatch.

---

## 14. INSTANCE DATA STRUCTURE

{
  instanceId: "COL-101/NMC-FOB-COL-01/SF-2026-9046/001",
  markNo, desc, drawingId, drawingNo, orderId, instanceNo, totalInstances,
  releaseId,
  currentStage: "fitup",
  currentStatus: "pending_supervisor",
  lotId, batchNo, nestingRunId, barRef, machineName,
  assignedContractorId, assignedContractorName,
  pinnedEngineerId, pinnedEngineerName,
  subOpsRequired: [], subOpsCompleted: [],
  markingConfirmed: false,
  markingLocation: "",
  markingDate: "",
  markingBy: "",
  outboundCount: 0, outboundHistory: [],
  stageHistory: [],
  defects: [],
  qualityConcernFlag: false,
  rejectionCount: 0
}

---

## 15. WELDING SEQUENCE FIELD IN QUALITY TAB

In OrderDetail TabQuality WeldSpec section add optional textarea:
Label: "Welding sequence / distortion control notes (optional)"
Placeholder: "e.g. Weld base plates before flange plates. Alternate sides on long members. Back-step on plates over 300mm."
Rows: 3
Stored as: order.quality.weldSpec.weldingSequence

Show in supervisor welding stage sign-off as read-only reference box
labelled "Welding sequence instructions from QC:"
Only shown if weldingSequence is not empty.

---

## 16. DEFERRED ITEMS — DO NOT BUILD IN SESSION 4

Session 6: welding bay load view, cut list printable output,
fit-up elapsed time warning, consumables tracking UI,
welder productivity KPIs, yield per machine operator,
operating factor trending, contractor performance comparison.

Session 5: scrap category in stock, scrap revenue calculation.

When needed: night shift flag on production release, jig flag on part list.

---

## 17. BUILD SEQUENCE — V3 FINAL (17 steps)

Step 1: Add machine_operator to ROLES, PERMISSIONS, USERS seed, Login quick-panel
Step 2: Add Production Standards sub-tab to Masters + productionStandards state to App
        (tiers, stamp locations, stage durations — all editable)
        Add getAssemblyTier, getCriticalityScore, getStampLocation utility functions
Step 3: Add Machines sub-tab to Masters with seed data
Step 4: Add releases state to App, pass as prop to ProductionModule
Step 5: Build Production Release creation — all 5 steps:
        Step 1 with criticality score, tier badges, sorted by priority
        Step 2 with RM picture and + expand
        Step 3 with smart suggestions and approved makes conflict check
        Step 4 with machine assignments and cut-ahead date warning
        Step 5 with contractor assignments and optional engineer pin
Step 6: Build Machine Operator screen — 6 queue states,
        cutting checklist with mandatory piece marking checkbox,
        stamp location display by section type, off-cut entry, DXF link
Step 7: Build RM Issue Request flow — operator requests, store admin
        sees in Stock module, confirm issue generates issue note,
        machine operator queue updates to STATE 4, off-cut return flow
Step 8: Build contractor assembly screen — collection notification,
        stage checkboxes, bought-out items checklist, all queue states
Step 9: Build supervisor soft gate screen — approval queue,
        updated checklists (blasting has re-marking items,
        welding shows sequence reference note),
        approve/reject flow, full drawing progress grid
Step 10: Build cutting confirmation — two-tier, partial bar,
         defect handling, mandatory piece marking with stamp location,
         off-cut creation, instance birth on Tier 2 sign-off
Step 11: Build outbound processing flow
Step 12: Build TPI hard gate screens (TPI Weld and TPI Paint)
Step 13: Build MDCC dossier completion screen
Step 14: Wire collection notifications (cutting confirmed -> contractor queue)
Step 15: Wire quality concern flags (2+ rejections -> QC Admin notification)
Step 16: Wire smart suggestion algorithm to live orders and stock state
Step 17: npm run build zero errors. Browser verification:
         a) machine_operator sees only their queue, no other modules
         b) Production Standards editable in Masters
         c) Criticality score shown and drawings sorted correctly
         d) Piece marking checkbox blocks submit if unticked
         e) Stamp location shown correctly by section type
         f) Blasting checklist has re-marking items
         g) Welding sequence shows in supervisor sign-off when set
         h) Contractor sees collection notification after cutting confirmed
         i) Supervisor approve/reject works correctly
         j) npm run build zero errors
