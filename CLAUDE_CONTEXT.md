# Structo ERP — Claude Code Context

## Current State
Version: 2.6
Main file: src/App.jsx (~16,000 lines)
Tech: React 18 + Vite + Tailwind + localStorage

## Active Order for Testing
SF-2026-6273 — ISGEC Heavy Engineering
97 drawings, 1455 parts, 125T, due 30 Apr 2026

## What Is Working
- Procurement: Nesting → PR → PO → GRN → Stock → QC ✅
- Release Wizard: creates instances on confirm ✅ (just fixed)
- QC framework: D1-D6 built ✅
- Welder register ✅
- Progress tracker: weight-based ✅

## Critical Issues To Fix Next
1. Release Wizard assigns by matCode not per RM Unit
   - Machine Operator sees all lots of same type
   - Should see one specific sheet/bar at a time
   - Need per-RM-Unit assignment in Step 4

2. GRN Excel-like table — verify working

3. Progress tracker RM Ordered still 0%

## Next Features To Build
1. Role-based dashboards
2. Mobile screens (contractor, machine op, QC)
3. Paint surface area calculation
4. Finance module

## Key Design Decisions
[paste key decisions from our chat here]
