# Structo ERP — Flow Reference Document

**Purpose:** Trace how data actually flows through the system, stage by stage, verified directly against the current codebase (App.jsx, ProductionModule.jsx, helpers.js) rather than from memory or design intent alone. This document is meant to be updated alongside every future code change so it stays a reliable map of "what the code actually does," not "what we once decided it should do."

**Companion file:** `issues_log.md` / `.docx` — tracks every gap, drift, or risk found while building this document. Issues are referenced by number from this document but live separately so they can be resolved independently.

**Last verified against code:** 10 July 2026 (Stages 2–3, Masters; Stages 1, 4–5 last verified 22 June 2026)

---

## Stage 1 — Order Entry

**Module:** `OrdersModule` → `OrderDetail` (App.jsx ~17035–17300)
**Tabs:** Basic Details, GST & Billing, Shipping, Transport, Payment Milestones, Drawing Register, Production Instances, Drawing Part List, Quality, Assemblies, Progress

### What gets created

**Order shape:** `order.{drawings[], parts[], milestones[], quality{}, transport{}, assemblies[]}`, back-filled by a migration block on every load (App.jsx ~17603). Any new order-level field must be added to this migration block too, or older saved orders will load without it.

**Drawing record** (`saveDrawing()`, ~line 15273):
`id, drawingNo, title, qty, unitWt, totalWt, revNo, drawingDate, receivedDate, poLineItem, phase, priority, driveLink, clientTag, userField1, assemblyGroup, status, revHistory[]`
- `status` is `"active"` only once `receivedDate` is set, else `"pending"`.

**Part record** (Drawing Part List tab, ~line 16580):
`drawingLineItem, drawingId, itemNo, markNo, desc, fabType (Fabricate/Bought Out), source (Procure/Stock/Client Supply), matLibId, matCode, section, size, grade, matType, length, width, calcUnitWt, calcTotalWt, qtyPerDrg`
- Picking a material from the library auto-fills section/size/grade/matType and computes weight from the library's per-metre/per-m² rates.
- **`matCode` is the central join key — referenced 1,056 times across the codebase.** Anything that changes how it's built has very wide blast radius (MRP grouping, nesting, stock matching, QC display).

**Quality spec** (`order.quality{}`): `approvedMakes[], blastingRequired, blastingStandard, surfaceProfile, paintCoats[], weldSpec, tpiRequired, ...`
- `order.quality.approvedMakes` is **display-only downstream** — shown in the Cutting QC panel for reference, never used to filter/validate at GRN, PO, or stock matching. (Distinct from the per-line `approvedMakes` field on Purchase Requisition records — same name, unrelated field.)

### Key mechanic: Production Instances are created here, not at "release"

Inside `OrderDetail`'s `update()` (~line 17045), **every edit to `order.drawings` regenerates `drawingInstances`**:
- A new instance (`DI-{drawingId}-{n}`) is created **only when `drawing.receivedDate` is set**, for `n` = 1 to `drawing.qty`.
- Each instance's `processSteps` come from `buildDefaultProcessSteps(drawing)` (ProductionModule.jsx) — this is where the production pipeline for that instance is first laid down.
- Reducing `qty` later drops excess **unreleased** instances; instances already in production are marked `"cancelled"` instead of deleted.
- Deleting a drawing keeps its instances (marked `"cancelled"` unless still unreleased) — production history is never destroyed by an Order Entry edit.

**Practical implication:** setting `receivedDate` is the actual trigger for production-trackable instances — not a separate release action.

### Confirmed downstream consumers
- `matCode`/`section`/`size`/`grade` on parts → MRP aggregation (Stage 2)
- `drawing.receivedDate` → gates MRP visibility and instance creation
- `drawingInstances[].processSteps` → the entire Production pipeline (Stage 5)
- `order.quality.approvedMakes` → Cutting QC display only (confirmed, not a hard filter)
- `order.assemblies[]`, `assemblyGroup` → Assembly stage (not yet traced in this document)

---

## Stage 2 — MRP Planning

**Module:** `MRPModule` (App.jsx, line 6271 onward)

### What it reads

Material requirements are **computed live from `order.parts`** every render — there is no persistent "MRP requirement" record until a Purchase Requisition actually exists.

`byOrder.reqs` (~line 6357–6401):
- Includes only `fabType==="Fabricate"` **and** `source==="Procure"` (or blank) parts — Bought Out and Client Supply are excluded entirely.
- Includes only parts on drawings with `receivedDate` set.
- Groups by `drawing.id + matCode` (or a fallback key if `matCode` missing).
- `wtRequired = (part.clientTotalWt || part.calcTotalWt) × drawing.qty`.
- If a `purchaseReqs` record already exists for that drawing+material, it's merged in; otherwise the row is a **"ghost" row with no `id`**, and the Approve/Reject buttons in the Overview table silently do nothing for it (see Issue #1).

### The only two ways a PR is actually created
1. **Nesting Export → Import loop.** Select drawings → export to Excel for external nesting software → re-import. `handleNestImport()` (~line 6530) groups rows by `matCode` into lots, lots into sheets, and builds a `nestingBatch` (`NEST-PLN-{year}-{seq}`).
2. From a batch: `createBatchPr()` or the post-import `raisePR()` flow generates `purchaseReqs` rows with `type:"nesting"`, `nestingBatchId`, `status:"pending"`.

Every PR generated via this path is `type:"nesting"` — but this is **not** the only way RM gets purchased at all (see Stage 3 — direct PO creation exists independently).

### The placeholder RM Unit ID
Each sheet from `handleNestImport` gets `rmUnitId = buildRmUnitId("???", section, grade, size, sheetDim, idx)` — note the literal `"???"` lot placeholder, replaced only once a real lot is assigned at GRN. **Confirmed this placeholder is never used as a matching key anywhere downstream** — it's purely a display label and a string-split source for dimension display. GRN generates a completely separate, real `rmUnitId`; the placeholder is simply discarded. Not a current bug — a caution for any future code (e.g. the planned feasibility engine) that might try to match on it (Issue #3).

### Nesting via NestingCenter API — verified behaviors (added 7–10 Jul 2026)
- **Reconciliation is enforced:** the API can return a result with parts unplaced (insufficient or too-short material). The ERP now compares placed pieces against input quantities per mark (split segments roll up to parent) and shows a red "NESTING INCOMPLETE" banner naming unplaced marks; raising a PR then requires explicit confirmation. Root cause of the NPB ~8T undercount found 8 Jul — resolved.
- **Split-before-nest:** section parts longer than the longest trial bar are detected pre-run. Joints allowed → editable max-first split proposal (floor `minSegmentMm`, allowance `jointAllowanceMm` per joint from Production Standards §D); segments sent as `MARK/S1…`, mapping stored in `batch.splitMap`. Joints not allowed → hard stop, Run disabled.
- **CAD profiles (true-shape nesting):** `part.partLink` (OneDrive/SharePoint/Drive share link, "anyone with link") is fetched at run time — direct fetch with link transformation, falling back to the `/dxf-proxy` Cloudflare Pages Function (manual redirect + cookie carrying for SharePoint redemption). The DXF is converted client-side to the API's `Contours` format (`dxfToContours`: LWPOLYLINE + R12 POLYLINE/VERTEX + CIRCLE; outer CCW, holes CW, bulges preserved). The API has **no** DXF-file field — geometry only. Fetch/convert failures are surfaced per part with reasons; failed parts nest as rectangles only after explicit confirmation.
- **Placements captured:** every placed instance (x, y, rotation in radians CCW, mirror — read from the response's `Transformation` wrapper, a parse bug fixed 10 Jul) is stored per sheet as `sheet.placements[]` with real part dims; converted contours persist as `batch.contoursMap`.
- **Cutting Plan:** printable per-sheet operator document (A3 default/A4) from the batch header — true-contour layout where CAD profiles were used, parts table with BOM weights (splice segments prorated), splice notes, offcut, order/client, RM Unit ID as document key, heat/lot + sign-off blanks. Reference document only; machine programs remain in machine CAM.
- **Material Requirements now shows nesting state** per row (✓ Nested · N sheets · batch id, with Re-nest), order-scoped via batch `orderIds`/captured drawing numbers; the importer now actually captures the Drawing No column. Batch headers show order chips, ≈RM tonnage, avg util. `NP` (a parts count) is no longer misread as a percentage.

### Stale-batch handling
Re-importing nesting data for a batch with a PR more than 24 hours old marks the old PR `status:"stale"` rather than overwriting it.

### Confirmed downstream consumers
- `purchaseReqs[]` → Purchase/PO (Stage 3), via `status:"converted"` + `poId`.
- `nestingBatches[].lots[].sheets[].rmUnitId` (placeholder) → never resolved; real `rmUnitId` created independently at GRN.
- `lots[].matCode` → carries forward unchanged into the PO line and eventual stock lot.

---

## Stage 3 — Purchase Requisition / Purchase Order

**Module:** `PurchaseModule` (App.jsx, line 8600 onward)

### Three entry points into a PO
1. **From a nesting-sourced PR** — `savePO()` / `createCombinedPO()`, pre-fills lines from `pr.lots[]`; on save, the source PR flips to `status:"converted"`.
2. **Direct manual PO** — `+ New PO` opens a blank form (`{servedOrders:[], coveredOrders:[], includesStock:false, lines:[]}`); `linePickerModal` adds lines by category (`rm`/`paint`/`consumable`) straight from the materials/paint library — no PR, no nesting, no order/drawing link required. This is the path for standard-dimension stock items (e.g. a 6mm rod) and any one-off purchase.
3. **CSV import** — `handlePOImpFile()`/`confirmPOImp()` via a downloadable template.

All three converge on the same `lines[]` shape before save.

### PO line shape (`savePO()`, ~line 8678)
`id, matCode, sectionType, matType, grade, size, isPlate, orderMode, qty, unit, pricingMethod, unitPrice, wtOrdered, wtReceived:0, qtyReceived:0, totalPrice, status:"pending", itemCode`
- `wtOrdered` = max(calculated weight, manually entered `wtRequired`) — manual entry can only raise it, never silently lower it below the calculated figure.
- A manually-added "rm" line does **not** set `matLibId` even though `matCode` is built in the same format — manual lines can't be traced back to a `materials` library row the way nesting-sourced lines can.

### PO → GRN handoff
- `saveGRN(poId)` (~line 8817) **accumulates** onto the existing PO line: `pl.wtReceived += grnLine.actualWt`, `pl.qtyReceived += grnLine.qtyReceived` — this is what makes multi-GRN partial deliveries against one PO line work.
- Line status → `"fully_received"` once cumulative `wtReceived >= wtOrdered`; PO-level status derives from line statuses.
- `buildStockLots(newGrn, po, grnId, ts)` is called in the same action as the GRN save — stock lots are not a separate step.

### PR → PO conversion — reworked 7–8 Jul 2026 (verified)
- **Unified convert flow** (Purchase → Requisitions): checkboxes from 1 selection; per-card button opens the same modal. Every line (PR × material × dimension) has an editable "Qty to this PO", defaulting to remaining — supporting 1→1, many→1, and **1→many (partial conversion)**. New PR fields: `convertedLines` (per-line converted qty), `poIds[]`; new status `partially_converted` (purple). Fully allocated → `converted`.
- **PO cancellation now reverts source PRs** (was a live bug: PRs stuck `converted` forever): line-level quantities handed back via `sourcePrId`, legacy POs matched by `po.prId`, revert note stamped into PR remarks. *The nesting-batch header badge does not yet reflect a cancelled PO — open item.*
- **Requisitions screen:** order filter + chips, section-type filter (Plates / Rolled sections / dynamic others), Select-all-visible, cancelled/stale hidden by default with toggle, two-line totals strip (Weight open/converted with clickable ⚠ unweighed; Quantity as sheets + bars/lengths + nos).
- **Weights:** resolution chain = library constant → materials master → geometric formulas (ROD d²×0.006165, BAR/FLAT w×t×0.00785, SQ) → quick-add. Quick-add writes kg/m or a **`nosOnly`** flag permanently into the materials master; nos-only items are excluded from tonnage silently, counted as "nos", and **priced per piece** on POs (unit "Nos", PerUnit) — closing the silent ₹0-line risk.

### Confirmed downstream consumers
- `po.lines[].matCode/grade/size/section` → stock lots at GRN.
- `po.vendorId/vendorCode` → tagged onto the stock lot.
- `pr.status:"converted"` + `poId` → filters "pending" PRs out of the MRP Overview.

---

## Stage 4 — GRN and RM Quality

**Module:** `PurchaseModule` (GRN tab) → `buildStockLots()` → `RMQualityModule`

### GRN — what's captured at receipt
- `grnForm.lines[]`: actual weight/qty received per PO line.
- `grnForm.heatSplits{matCode: [{heatNo, mtcNo, qty, wt}]}` — one PO line can be received as **multiple heat numbers**, each becoming its own stock lot. Keyed by `matCode`, not PO line.
- `grnForm.mtcs[]` — optional "+ Add MTC" panel at receipt (`{mtcNo, heatNo, grade, driveLink}`).

**Every lot is created with `status:"qc_hold"` regardless of whether MTC was attached.** If not added at GRN: `mtcUploaded:false, mtcDoc:"", mtcNo:""` — expected, not an error state.

### MTC added later by RM Quality — confirmed, by design
In the RM QC Inspection modal (`form.type==="qc"`):
- `MTC No`, `Heat Number`, `Drive Link` are independently editable whenever the lot doesn't already have a value for that specific field; an explicit **"Override MTC"** button unlocks all three for correction.
- `doQC()` writes `mtcDoc/heatNo/mtcNo` straight onto the stock lot — once written by QC, it's indistinguishable from an MTC that arrived with the delivery.

### Soft gate, not hard gate
- `doQC()` has **no check** preventing approval when MTC is missing — only a warning banner. The "Pass QC → Client Inspection" button is never disabled by missing MTC.
- `doClientInsp()` only checks `rmQcStatus==="approved"` — **also never blocked by missing MTC**, despite the banner text implying it should be (Issue #4).

### Audit trail
- `stock[].auditLog[]` logs `qc_reverted`, `client_insp_reverted`, `reinspect_requested` with `{by, date, reason}`.
- **The original forward approval actions (`doQC` pass/fail, `doClientInsp` approve/reject) are not logged to `auditLog` at all** — only overwritable top-level fields (`qcBy`, `qcDate`). No history of who approved first if re-approved later (Issue #5).

### Confirmed downstream consumers
- `lot.matCode/grade/section/size` → Stock allocation, MRP/feasibility matching.
- `lot.status` → gates whether Production can draw material.
- `lot.heatNo/mtcNo/mtcDoc` → travels with every downstream cut/issue record.
- `lot.rmQcStatus` + `lot.clientInspStatus` → both required `"approved"` before stock is `"available"`.

---

## Stage 5 — Production Release through Dispatch

### Two parallel completion systems exist — only one is gated (Issue #6, HIGH)

**System A — live, correctly gated** (`instances[]` + DPRs + `SupervisorQueue`):
- Every approval (`doApprove`) is gated by `allChecked` — a real `disabled={!allChecked}` on the Approve button.
- TPI stages: `tpiDetailsOk = agency && reportNo && reportDate`, all three required.
- MDCC: `mdccOk = mdccRefNo.trim().length > 0`.
- Cutting QC: dimensional tolerance (`±2/3/5mm` by size band) must pass, or an explicit fail reason recorded.
- Dispatch correctly gated: `DispatchModule`'s `readyDprs` only includes DPRs where `currentStage==="complete" && d.mdccClearedAt`.

**System B — `drawing.productionSteps[]` + `DrawingStatusCard`'s `doStageComplete`:**
- `doStageComplete(idx)` is an **unconditional** write — no check on `tpiRequired`/`tpiDoneAt`.
- The "✓ Mark Stage Complete" button has no `disabled` condition tied to TPI status.
- The red "blocked" badge (`tpiRequired && tpiOfferedAt && !tpiDoneAt`) is **purely visual**, doesn't disable anything.
- **Confirmed live, not legacy:** `drawing.productionSteps` is actively written by the Production Release Wizard's `confirm()` (~line 5409–5425) on every release, and `DrawingStatusCard` is actively mounted (~line 12134), reachable by `production_engineer` and `super_admin`.

**Net effect:** a Production Engineer or Super Admin can open the Drawing Status Card and click "Mark Stage Complete" on Welding, skipping TPI entirely — including skipping the NCR/concession trail that's the correct route for any legitimate exception (see QC section below). The hard gate exists and works; an unguarded side door sits next to it.

### The rest of the live (System A) pipeline, confirmed
- **Stage sequence (`STAGE_NEXT`):** `cutting → cutting_qc → awaiting_collection → fitup → welding → tpi_weld → blasting → painting → tpi_paint → mdcc → dispatch`.
- **Collection Event** (`awaiting_collection`) between Cutting QC clearance and Fit-Up — confirmed present.
- **Two-tier entry:** `SUPERVISOR_STAGES` role map restricts which role can approve which stage; floor-level "Done" marking (contractor queue) vs. supervisor Approve (SupervisorQueue) are separated by role, not by a two-step field on the same record.
- **Dynamic paint coats:** `paint_coat_${i+1}` steps generated per instance from `allCoats` (order's Quality tab spec) — fewer steps for a 2-coat order than a 3-coat order.
- **Outbound processing:** `order.outboundOps[]` tracked as a parallel array per drawing — pause/resume implemented as a separate record rather than literally pausing `processSteps`.
- **MDCC:** inspection checklist pulls from `order.quality.mdccDocs[]` if populated, else falls back to static `STAGE_CHECKLISTS.mdcc`.
- **Dispatch:** `createChallan` writes `dispatchedAt`, `challanNo`, appends to `stageHistory` — properly audit-logged, unlike Stage 4's RM QC.

---

## QC Inspection — Across Every Production Stage

**Module:** `SupervisorQueue` (approval), `QcAdminScreen` (assignment/admin), `OutboundQcPanel`, `TpiQcPanel`

### Confirmed strong points
- Every `doApprove()` writes a full entry to `instance.stageHistory[]` — signed-off-by, date, checklist items, plus stage-specific detail (DFT readings, NDT details, dimensional readings, TPI agency/report/IRN). This is properly durable, unlike Stage 4's RM QC.
- The same `allChecked` hard-gate pattern applies consistently at every stage: `cutting_qc`, `fitup`, `welding`/`tpi_weld`, `blasting`, `painting`/`tpi_paint`, `mdcc`.
- **Outbound QC** (`OutboundQcPanel`'s `doSignOff()`) is also properly gated — Pass requires full checklist, Fail requires a reason — and correctly re-enters the instance at the stage it left from.

### Gap found: no segregation of duties (Issue #7)
`qc_admin` and `qc_user` have **identical** stage access in `SUPERVISOR_STAGES`. The only restriction on `qc_user` is a work-queue filter (`assignedEngineer === user.id`) — a routing rule, not an approval restriction. In practice, whoever is assigned a job is the only person who can both inspect and approve it — the originally intended "QC User fills in, only QC Admin approves" separation does not exist in code.

### Naming trap: "Override Log" ≠ gate override
`QcAdminScreen`'s "Override Log" tab only reassigns **which engineer a job is routed to** (`doOverride()`), logged with a reason — it is not a "bypass this failed checklist" mechanism. There is no inline override button anywhere in the approval flow; `allChecked` is all-or-nothing at every stage.

### What functions as the real "concession" path
The **NCR mechanism** (`QcAdminScreen`'s `doRaiseNcr`) is the correct route for any legitimate exception, with three dispositions:
- `use_as_is` → sets `concessionRequested:true`
- `rework` → returns the instance to a specified stage, `isRework:true`
- `scrap`

This is a more rigorous mechanism than a simple override checkbox would be — it forces a documented concession decision — but it lives in a separate screen from the point of failure, and (per Issue #6) can be bypassed entirely via the Drawing Status Card side door.

---

## User Roles & Permissions

### Three independent permission layers, not fully consistent with each other
1. **`PERMISSIONS`** (App.jsx) — coarse `{modules[], canApprove, canOverride, canManageUsers}` per role. Drives sidebar visibility (`canSee()`) and some Approve/Reject buttons.
2. **`ROLE_DEFAULT_PERMS` + `can()`** (helpers.js) — fine-grained permission strings per role, with per-user override support via `user.permissions{}`. The most sophisticated layer, but **only called in ~26 places across ~33,000 lines** — mostly unused.
3. **Dozens of local, hardcoded role-array checks** per component (`SUPERVISOR_STAGES`, `isEng`, `canEdit = ["super_admin","purchase_admin"].includes(role)`, etc.) — **this is what actually gates most real actions**, independently maintained per screen.

This fragmentation is the direct cause of Issue #7 — `PERMISSIONS.qc_user.canApprove` is `true`, but production-stage approval actually gates on the separate `SUPERVISOR_STAGES` list.

### Masters nav visibility bug (Issue #8)
`canSee()` checks `p.modules.includes("all") || p.modules.includes(mod)`. The Masters nav item is defined with `module:"all"`, so the check is true for *every* role regardless of their own permissions (it's comparing against the literal string `"all"`, not checking whether the role's permission list contains it). **Every role, including `contractor` and `machine_operator`, sees "Masters" in the sidebar.** Same bug affects "Notifications".

### Masters read-access is mostly unrestricted (Issue #9)
Each Masters sub-component has its own `canEdit` check (confirmed in `VendorsMaster`, `ContractorsMaster`, `MaterialsMaster`, etc.), so non-admin roles cannot edit or delete — but **most tabs have no read-level restriction at all.** Vendors, Contractors, Materials Library, Bays, Paint Library, TPI Agencies, Approved Makes, Process Types, Outbound Vendors, Welders, Consumables, and Clients (including client credit limits/payment terms) are readable by any logged-in user. Only Company Details, Production Standards, Machines, Users, and Dev Tools are admin-gated.

### Production Standards §D (added Jul 2026)
Cutting Capacity & Splicing config: Plate T/day, Section T/day (feasibility cutting-days estimate), **Min splice segment (default 1500 mm)** and **Joint allowance (default 3 mm/joint)** for split-before-nest. `lastUpdated` auto-stamped. Side-fix: `save()` previously dropped `blastThresholds` on every save (latent, no UI existed) — corrected.

### Materials Library ownership (Issue #10 — RESOLVED 8 Jul 2026)
`MaterialsMaster`'s `canEdit = super_admin || qc_admin` — likely copy-pasted from `PaintMaster`/`TPIMaster`/`ApprovedMakesMaster` (legitimately QC-owned). Materials Library (sections/grades/sizes/weight rates feeding Order Entry, MRP, and Nesting) is naturally Planning/Purchase-owned data; Resolved: edit access now `super_admin | qc_admin | purchase_admin | planning_admin`. Materials also gained a `nosOnly` field (set via Requisitions quick-add; not yet exposed in the master's own edit form — open item).

### Contractor capability model — confirmed working as designed
`ContractorsMaster`: `capabilities: ["cutting","fit_up","welding","blasting","painting"]`, multi-select tag array, editable by `super_admin`/`production_admin`. This is how a contractor like Krishna Fabricators gets "Cutting" added alongside Fit-Up/Welding.

### Delete safety — confirmed working as designed
`DeleteBtn` only shows on already-deactivated records, and `checkMasterUsage()` blocks permanent deletion if the record is still referenced anywhere — deactivate-first pattern holds up in code.

---

## Document Maintenance

This document should be updated alongside any code change that touches the flows described above — not after the fact. When App.jsx, ProductionModule.jsx, or helpers.js change in ways that affect a stage described here, the corresponding section should be re-verified against the new code, not assumed to still be accurate. See `issues_log.md` for the live list of open items found while building this document.
