STRUCTO ERP — COMPLETE DESIGN SPECIFICATION
Sessions 4 onwards — all decisions locked

SECTION 1 — DATA STRUCTURES (build first, everything depends on these)

1.1 Vendor Master — new fields
Every vendor in the system gets a system-generated vendor code at creation time.
Format: {3-letter-abbr}{3-digit-seq} — e.g. JSW001, APL003, AKZ001
Generation logic:

Take first 3 letters of vendor name, uppercase, strip spaces and special characters
Check if that 3-letter code already exists among vendors of the same type category
If no collision — assign it with the next available sequence number within that type
If collision detected — system suggests alternative using initials of each word in the name. Nagpur Structural Works → NSW. User sees both options and confirms.
Sequence number is global across all vendors — not per type — so JSW001 and APL003 coexist without confusion

Type categories for collision detection:
RM (raw material), PT (paint/consumables), TR (transport), OP (outbound processing), SV (service/subcontract)
New fields on vendor record:
vendorCode: "JSW001"          — system generated, immutable after creation
vendorType: "RM"              — RM / PT / TR / OP / SV
vendorShortName: "JSW"        — the 3-letter part, editable by super admin only

1.2 Materials Library — revised structure
Remove sheet dimensions from material master code for plates. The master code identifies material type only.
Material Master Code format:
For sections: {sectionType}/{matType}/{grade}/{size}

ISA/MS/E250/75X75X8
ISMB/MS/E250/300
PLATE/MS/E250/10MM  ← no dimensions here

For plates the size field is thickness only — 10MM, 12MM, 16MM etc.
New/revised fields on library entry:
matCode: "ISA/MS/E250/75X75X8"    — auto-generated from other fields
sectionType: "ISA"                 — ISA/ISMC/ISMB/PLATE/RHS/SHS/Flat Bar etc.
matType: "MS"                      — MS / SS / AL etc.
grade: "E250"                      — E250 / E350 / 304 etc.
size: "75X75X8"                    — cross-section for sections, thickness for plates
wtPerMetre: 8.96                   — kg/m for sections, null for plates
wtPerM2: null                      — kg/m² for plates, null for sections
standardLengths: [6000,8000,10000,12000]  — available mill lengths for sections
isPlate: false                     — true for PLATE type
active: true
Item Code — used on PO lines and GRN, includes commercial dimension:

Sections: ISA/MS/E250/75X75X8/12000 (with chosen length at end)
Plates: PLATE/MS/E250/10MM/2500X8000 (with sheet dimensions at end)
Off-cut sections: ISA/MS/E250/75X75X8/2340 (with actual remaining length)
Off-cut plates: PLATE/MS/E250/10MM/1300X400 (with actual remaining dimensions)


1.3 Drawing Part List — revised structure
Parts now link to materials library by ID instead of free text.
New/revised fields on each part:
matLibId: "ML-003"              — links to MATERIALS_LIBRARY entry
matCode: "ISA/MS/E250/75X75X8" — copied from library at time of selection
                                  (denormalised for display without lookup)
section: "ISA"                  — copied from library
size: "75x75x8"                 — copied from library
grade: "E250"                   — copied from library
matType: "MS"                   — copied from library
length: 150                     — cutting length in mm (from client drawing)
width: 75                       — width in mm (for plates and flat bars)
                                  bounding box dimension for irregular plates
jointPosition: ""               — blank if no joint, "middle-third" etc. if approved
jointApprovalStatus: "none"     — none / requested / approved / rejected
jointApprovalDoc: ""            — drive link to client approval document
jointSplitDimensions: []        — array of lengths if joint approved
                                  e.g. [2500, 1700] for a 4200mm part split in two
In the part form (TabParts):

Section and Size fields replaced by a single Material dropdown
Dropdown shows: ISA 75x75x8 — E250 (8.96 kg/m) for sections
Dropdown shows: PLATE 10mm — E250 (78.5 kg/m²) for plates
On selection auto-fills matLibId, matCode, section, size, grade, matType
Last option in dropdown: Non-standard / not in library — enables free text fallback
Free text fallback used for bought-out items (bolts, washers) that have no library entry

CSV import matching:
After import, system tries to auto-match each row to library entry by sectionType + size + grade string match. Match found → matLibId set automatically. No match → row imports but shows warning badge Library match not found — check spelling. Count of unmatched rows shown in import preview footer.

1.4 Stock Lot — revised structure
Complete revision of stock lot data structure to support the five states, batch numbers, allocation tracking, issue tracking, and off-cut lineage.
id: "STK-001"
lotNo: "LOT-2026-001"           — sequential, year-prefixed
batchNo: "JSW001-2026-047"      — system generated at GRN save
itemCode: "ISA/MS/E250/75X75X8/12000"  — item code including commercial dimension
matCode: "ISA/MS/E250/75X75X8"  — material master code (for aggregation/search)
matLibId: "ML-003"              — links to library
section: "ISA"
size: "75x75x8"
grade: "E250"
matType: "MS"
vendorId: "V-001"
vendorCode: "JSW001"
vendorName: "JSW Steel Limited"

— Quantities —
wtReceived: 2000                — total kg received in this lot
wtAllocated: 400                — kg tagged to orders (reserved, still in yard)
wtIssued: 200                   — kg physically handed to teams for processing
wtConsumed: 0                   — kg confirmed cut/processed
wtOffcut: 0                     — kg returned as off-cut after cutting
wtAvailable: 1400               — wtReceived - wtAllocated - wtIssued - wtConsumed
                                  system maintains this as a derived value

— Status —
status: "allocated"             — available / allocated / issued / consumed / offcut
bayId: "BAY-03"

— Traceability —
poId: "PO-2025-001"
grnId: "GRN-2025-001"
grnLineId: "POL-001"
receivedDate: "2025-02-04"
mtcUploaded: true
mtcDoc: "https://drive.google.com/..."
heatNo: ""                      — supplier's mill heat number from MTC
                                  entered by store team at GRN/QC time

— QC —
rmQcStatus: "approved"          — pending / approved / failed
clientInspStatus: "approved"    — pending / approved / rejected
qcHoldReason: ""

— Off-cut lineage —
isOffcut: false                 — true if this lot is an off-cut
parentLotId: ""                 — STK-001 if this is an off-cut from STK-001
parentBatchNo: ""               — carries forward from parent for MTC traceability
offcutLength: null              — for section off-cuts, remaining length in mm
offcutDimensions: ""            — for plate off-cuts, "1300X400"
nestingRunId: ""                — NEST-2026-001 — which nesting run consumed material
                                  from this lot and generated this off-cut

— MTC diversion warning —
originalOrderId: ""             — if material was diverted from another order,
                                  the original order is recorded here
diversionLog: []                — array of diversion events with who/when/why/override

— Reservations —
allocations: [
  {
    orderId: "SF-2025-0001",
    drawingId: "D001",
    drawingNo: "TPL-JETTY-COL-01",
    markNo: "SBK-101",
    wt: 200,
    reservedBy: "vikram.singh",
    reservedDate: "2025-02-10",
    nestingRunId: "NEST-2026-001",
    status: "allocated"         — allocated / issued / consumed
  }
]

— Issue tracking —
issues: [
  {
    issueId: "ISS-2026-001",
    issueDate: "2026-03-16",
    issuedTo: "Krishna Fabricators",
    contractorId: "CON-001",
    orderId: "SF-2025-0001",
    drawingId: "D001",
    drawingNo: "TPL-JETTY-COL-01",
    wt: 200,
    issuedBy: "mohan.das",
    issueNoteNo: "ISN-2026-001",  — printable issue note reference number
    nestingRunId: "NEST-2026-001",
    dxfLink: "https://drive.google.com/..."  — link to cutting layout DXF on Drive
  }
]

— Audit trail —
auditLog: [
  {
    action: "allocated",        — allocated/released/transferred/issued/consumed
                                  /offcut-created/diverted/mtc-override
    orderId: "", drawingId: "", wt: 0,
    by: "vikram.singh",
    date: "2026-03-16",
    reason: "",
    nestingRunId: ""
  }
]

1.5 Nesting Run — new data structure
Every nesting run gets its own record. This ties together the bridge tool import, the DXF files on Drive, and the stock movements.
id: "NEST-2026-001"
runDate: "2026-03-16"
runBy: "vikram.singh"
materialCode: "ISA/MS/E250/75X75X8"   — one run per material type
orders: ["SF-2025-0001"]
drawings: ["D001", "D002", "D004"]
lotsUsed: ["STK-001", "STK-002"]      — which lots were consumed
sheetsOrBarsUsed: 40                   — how many physical units
utilisationPct: 87.3                   — from nesting result
wasteKg: 556                          — calculated waste
offcutsCreated: ["STK-007", "STK-008"] — new off-cut lots created
dxfLink: "https://drive.google.com/..." — cutting layout on Drive
status: "confirmed"                    — draft / confirmed / cancelled
parts: [
  {
    markNo: "SBK-101",
    drawingNo: "TPL-JETTY-COL-01",
    orderId: "SF-2025-0001",
    lotId: "STK-001",
    sheetOrBarRef: "BAR-03",          — which physical bar this part is cut from
    wtConsumed: 1.335,                 — weight of this piece
    qty: 80
  }
]

SECTION 2 — MODULES TO BUILD OR REVISE

2.1 Masters Module — Vendors tab changes
Add to new vendor form:

Vendor Type dropdown (RM / PT / TR / OP / SV)
On save, system auto-generates vendorCode
Shows generated code in a preview before confirming: Your vendor code will be JSW001
If collision detected, shows: JSW is already used by JSW Coatings (JSW002). Suggested alternative: JST for JSW Steel Trading. Accept suggestion or type your own 3-letter code.
vendorCode shown prominently on vendor card/row — it is a key reference used everywhere

Vendor list display:
Add vendorCode column to the vendor table. Make it searchable — store team should be able to search by code when receiving material.

2.2 Materials Library tab changes
Add to each library entry:

Auto-generate matCode field from sectionType + matType + grade + size on save
Show matCode prominently on each row — it is the key identifier
For sections: show wtPerMetre, standardLengths (editable multi-value field)
For plates: show wtPerM2, no standardLengths (plates are ordered by area/weight)
Add isPlate toggle — auto-set based on sectionType === "PLATE"


2.3 Stock Module — complete rebuild
Five filter tabs replacing current four:
All · Available · Allocated · Issued · Consumed · Off-cuts
Stock summary cards (top):

Total Stock (all received, QC approved) in Tonnes
Available (unallocated) — with + expand showing per-order breakdown
Allocated (reserved, in yard) — with + expand
Issued (out for processing) — with + expand
Consumed (cut/processed) — with + expand
Off-cut Stock — count and weight

Table columns (revised):
Lot No · Batch No · Material Code · Section/Size · Grade · Vendor · Bay · Received (kg) · Available (kg) · Allocated (kg) · Issued (kg) · Consumed (kg) · MTC · Heat No · RM QC · Client Insp · Status · Actions
Row expand (click row):
Shows: GRN ref · PO ref · Received date · MTC doc link · Heat number · Hold reason if any · Allocation detail (order/drawing/wt/reserved by/date per allocation) · Issue detail (issue note no/issued to/date per issue) · Audit log timeline · Off-cut lineage (parent lot if off-cut, or child off-cuts if parent)
Actions column:

Available + clientInsp approved: Allocate button (planning admin / super admin)
Allocated: Release button (planning admin / super admin) and Transfer button
Allocated + clientInsp approved: Issue button (store admin / super admin)
Any status: View DXF button if dxfLink is set

Allocate modal:

Select order → select drawing → select mark no (part) → weight auto-suggests from part requirement
Shows: required weight for that part, currently allocated weight, gap
On confirm: adds allocation entry, reduces wtAvailable, increases wtAllocated, logs to auditLog

Release modal:

Shows current allocation detail
Mandatory reason field
If wtIssued > 0 for this lot: warns "material already issued — physical return required before release"
On confirm: removes allocation, restores wtAvailable, logs to auditLog

Transfer modal:

Select new order → new drawing → new mark no
If any wtIssued > 0: blocks transfer, shows "cannot transfer — material already issued"
MTC diversion check: if new order has different clientId than original order — shows amber warning "MTC was raised for {originalClient}. {newClient}'s TPI inspector may require re-inspection. Override?" — override requires confirmation and is logged with mtc-override in auditLog

Issue modal:

Select contractor or in-house team
Shows all allocations on this lot (may be multiple orders/drawings if cross-order nesting)
Issue note number auto-generated: ISN-{YYYY}-{3-digit-seq}
DXF link field — paste Google Drive link to the cutting layout file
On confirm: moves allocations from Allocated to Issued status, updates wtIssued, generates printable issue note

Printable Issue Note:

Issue note number, date, store officer name
Material: item code, batch number, heat number
Issued to: contractor name
Against: order IDs and drawing numbers
Weight issued (kg)
DXF cutting layout link (shown as URL)
Signature line for receiving contractor
Print button generates a clean A4 print layout

Off-cut creation:
When cutting is confirmed complete (consumption recorded), system checks: wtIssued - wtConsumed = off-cut weight. If off-cut weight > minimum threshold (configurable, default 5 kg for sections, 0.5 m² for plates), system prompts: "Record off-cut? Remaining weight: X kg. Enter dimensions." Store team enters off-cut dimensions. System creates new stock lot with:

New lotNo, same batchNo as parent
parentLotId linked to original lot
isOffcut: true
Status: available (inherits QC approval from parent — off-cuts do not need re-inspection if same batch)
matCode same as parent, itemCode updated with off-cut dimensions


2.4 Purchase Module — PO Line changes
Material field in PO line form:
Replace free-text section/size inputs with Material dropdown (same as TabParts) — selects from library, auto-fills matCode, section, size, grade, matType.
Standard length selector:
After material selected, if section (not plate) — show Standard Length dropdown populated from library's standardLengths array: 6000mm / 8000mm / 10000mm / 12000mm. Selection appends to item code: ISA/MS/E250/75X75X8/12000.
For plates — show Length × Width fields for the specific sheet size being ordered. Item code: PLATE/MS/E250/10MM/2500X8000.
wtOrdered calculation (fixes existing bug):

Sections: wtOrdered = qty (in units) × (length/1000) × wtPerMetre from library
Plates: wtOrdered = qty (in units) × (length/1000) × (width/1000) × wtPerM2 from library
Show live calculation preview in the form as user fills it in

PO ID generation (fixes existing bug):
Sequential format: PO-{YYYY}-{3-digit-seq} — same pattern as orders

2.5 GRN — changes
Batch number:
Auto-generated on GRN save: {vendorCode}-{YYYY}-{3-digit-seq}
Sequence is per vendor per year — JSW001's 47th GRN in 2026 = JSW001-2026-047
Show generated batch number in GRN confirmation screen before final save
Heat number field:
Add heatNo text field to each GRN line — store team reads this from the physical MTC document and enters it. Optional but flagged if left blank for RM lots.
Stock lot creation (fixes existing bug):
Each received GRN line (wtReceived > 0) creates one stock lot with:

All fields populated from GRN line + PO + vendor
itemCode constructed from matCode + commercial dimension from PO line
batchNo from the GRN-level batch number
Initial status: qc_hold always — regardless of visual inspection result
(visual inspection result is logged but QC progression is through RM QC module)
Bay from GRN form (add bay selector to GRN form)
wtAvailable = wtReceived initially

Lot number format (fixes existing bug):
LOT-{YYYY}-{3-digit-seq} — sequential across all lots in that year

2.6 MRP Module — revised
Three views (tabs within MRP):
View 1 — Planning Overview (existing, revised)
Same as current but reading from live orders state not hardcoded ORDERS constant.
Drawing release alerts, per-order drawing list with expand.
View 2 — Material Requirements (new — as designed)
Derived live from order.parts — no manual PR generation needed for discovery.
Table 1 — Fabrication Materials (fabType=Fabricate, source=Procure):
Aggregated by matCode (material master code).
Columns: Material Code · Section · Size · Grade · Approved Makes · Orders · Wt Required (kg) · Length/Area column (metres for sections using wtPerMetre from library, m² for plates using wtPerM2) · Stock Available (kg) · Net to Procure (kg) · Coverage bar · PR Status
Length calculation: (totalWtRequired / wtPerMetre) metres, then ÷ standardLength to show bars needed
Area calculation: totalWtRequired / wtPerM2 m²
Net to procure colour:

0 = green (fully covered by stock)


0 with PR approved = amber




0 with no PR = red



Table 2 — Bought Out Items (fabType=Bought Out, source=Procure):
Aggregated by description + size.
Columns: Description · Size · Grade · Orders · Total Pcs · Unit Wt (kg) · Total Wt (kg) · PR Status
Client supply box below both tables — lists source=Client Supply parts with no action needed.
Order filter at top — isolate one order.
View 3 — Nesting Runs (new)
History of all nesting runs. Each row: Run ID · Date · Material Code · Orders · Sheets/Bars Used · Utilisation % · Waste kg · Off-cuts Created · Status · DXF link.
Button: + New Nesting Run — opens the bridge tool import flow (see Section 2.7).

2.7 Tools Tab — new module
Visible to all roles, each tool filtered by role. Nav item: Tools.
Tool 1 — Bar/Section Cutting Calculator
Purpose: 1D cutting optimisation for sections. Fully internal — no DeepNest needed.
Inputs:

Material selector (from library — sections only)
Parts to cut: auto-populated from selected order/drawings' part list (fabType=Fabricate, source=Procure, matching section type). Planner can also add manual rows.
Available stock: three sub-tabs:

Standard lengths: pre-populated from library's standardLengths, planner enters available quantity per length
Off-cut stock: auto-pulled from stock module lots matching this material, showing each off-cut's length and available quantity, planner ticks which to include
Manual input: free entry of any dimension and quantity not yet in system



Settings: kerf width (default 3mm), minimum remnant to keep as off-cut (default 150mm)
Algorithm: First Fit Decreasing — sorts parts longest to shortest, fills each bar greedily using off-cuts first, then standard lengths. Re-runs with and without joints (if any joint approvals exist for these parts) and shows both scenarios.
Output:

Cutting plan: list of bars/off-cuts used, with cut sequence per bar shown as a simple horizontal strip diagram
Summary: bars needed, utilisation %, waste kg, waste %
Joint comparison: if joint approvals pending — shows "Without joints: 40 bars, 13% waste" vs "With joints: 35 bars, 8% waste — save 5 bars, 556 kg"
Export button: generates CSV ready for nesting run import into ERP

Tool 2 — Plate Area Estimator
Purpose: Plate material estimation. Internal rectangular algorithm — no DeepNest needed for rectangular parts.
Inputs:

Material selector (plates only)
Parts: auto-populated from selected order/drawings' part list (PLATE sections)
For each part shows: mark no, length × width (bounding box), qty, total area
Available stock: standard sheet sizes with quantity, plus off-cut plate lots from stock
Kerf width (default 3mm), grain direction constraint (yes/no — if yes, no 90° rotation)
For irregular parts: shows a warning badge Irregular shape — use DeepNest for accurate nesting and uses area-based estimate with a 70% utilisation factor

Output:

Sheets needed per size, utilisation %, waste area m² and kg
For irregular parts — clear label Estimated (±15%) — verify with DeepNest
Export CSV for nesting run import

Tool 3 — Nesting Bridge (DeepNest Import)
Purpose: Import nesting results from DeepNest back into ERP. Creates stock reservations and nesting run record.
Workflow:

Planner selects orders and drawings to nest
Tool generates nesting run ID: NEST-{YYYY}-{3-digit-seq}
ERP exports a CSV — one row per part, with mark no, drawing no, order, material code, dimensions, qty. Planner uses this to set up DeepNest (naming parts correctly with mark no so they can be matched back)
Planner runs DeepNest externally, exports SVG result, uploads to Drive, copies link
Planner returns to bridge tool, enters: sheets/bars used, utilisation %, waste kg (reads from DeepNest UI — these three numbers are visible on screen in DeepNest), Drive link to DXF
For each part in the run, planner selects which lot it was cut from (dropdown filtered to matching material, available lots only)
Confirm import — ERP creates nesting run record, updates stock reservations, marks parts as having a confirmed nesting run

Note on SVG parsing: If DeepNest SVG export is available, tool can optionally read it to auto-extract utilisation % and sheet count, saving manual entry. This is optional — manual entry of three numbers is fast enough.
Tool 4 — Weight Calculator
Simple utility. Input: section type + size + length → weight in kg.
Also: reverse — input weight → length.
Useful for quick checks on the shop floor or when reviewing a drawing.
No order linkage needed — standalone calculator.
Tool 5 — Joint Approval Manager
Shows all parts across all orders where jointApprovalStatus is requested or approved.
Pending requests: part details, proposed split dimensions, estimated material saving.
Actions: mark as approved (attach client email/document Drive link), mark as rejected.
On approval: updates part record, recalculates material requirements for that part in MRP.
More tools can be added here in future sessions — paint consumption estimator, delivery schedule calculator, dispatch document checklist, invoice eligibility calculator.

2.8 Drawing Part List — coverage column
In TabParts, add a Coverage column for fabricate + procure parts.
For each such part:

Required wt = part.clientTotalWt × drawing.qty
Allocated wt = sum of allocations from stock lots where matCode matches AND allocation.drawingId matches this drawing AND allocation.markNo matches this part
Coverage badge: green Covered / amber X kg short / red None

Add Allocate from stock button on rows where coverage < required (store admin / planning admin only). Opens allocation modal pre-filtered to matching material lots.

SECTION 3 — BUG FIXES (from previous sessions — fix these first)
Before building anything in Section 2, Claude Code must first fix all existing bugs:

Orders state isolated — MRP, Stock, Dashboard all read hardcoded ORDERS constant. Fix: lift orders state to App component, pass as prop everywhere.
Masters state isolated — clients/vendors added in Masters don't appear in order/PO dropdowns. Fix: lift clients, vendors to App component.
GRN creates no stock lots. Fix: saveGRN must call setStock to create lots.
GRN stock lot status incorrectly set to available — must always start as qc_hold.
Hard gate not enforced — stock allocation allowed without clientInspStatus=approved.
PO ID format is timestamp. Fix: sequential PO-YYYY-NNN format.
Lot number format is wrong. Fix: sequential LOT-YYYY-NNN format.
wtOrdered = 0 on PO lines. Fix: calculate from qty × length × wtPerMetre.
Finance Admin can trigger Save via dirty state. Fix: Save only shows for canEdit roles.
PR approval has no role guard. Fix: only canApprove roles see approve button.
Dashboard stats hardcoded. Fix: derive from live state.
calcTotalWt not set when parts added manually. Fix: calcUnitWt = clientUnitWt if blank, calcTotalWt = calcUnitWt × qtyPerDrg.


SECTION 4 — BUILD SEQUENCE FOR CLAUDE CODE
Do in this exact order — each step depends on the previous:
Step 1: Fix all 12 bugs from Section 3. Run npm run build after. Zero errors before proceeding.
Step 2: Add vendorCode generation to Vendors Master. Update vendor data structure.
Step 3: Update Materials Library — add matCode auto-generation, standardLengths, isPlate, wtPerMetre/wtPerM2 already exist.
Step 4: Update Drawing Part List form — replace section/size free text with material library dropdown. Add matLibId to part data structure. Update CSV import matching.
Step 5: Update PO line form — same material dropdown, standard length selector, wtOrdered calculation fix.
Step 6: Update GRN — add batch number generation, heat number field, bay selector, correct stock lot creation with all new fields.
Step 7: Rebuild Stock Module — five states, new table columns, row expand, Allocate/Release/Transfer/Issue modals, printable issue note, off-cut creation flow.
Step 8: Build MRP View 2 — Material Requirements with two tables, length/area column, stock coverage, order filter.
Step 9: Build MRP View 3 — Nesting Runs history and new run button.
Step 10: Build Tools tab — Weight Calculator first (simplest), then Bar Cutting Calculator, then Plate Estimator, then Nesting Bridge, then Joint Approval Manager.
Step 11: Add coverage column to Drawing Part List with Allocate from stock button.
Step 12: Final integration test — run npm run build, verify all modules work together with shared state.

