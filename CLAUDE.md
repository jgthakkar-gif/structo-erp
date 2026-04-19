# Structo ERP

Fabrication shop ERP — single React file, Sessions 1–3 complete.

## Key files
- src/App.jsx — entire application (~2900 lines)

## Commands
- `npm run dev` — start dev server at http://localhost:5173
- `npm run build` — production build

## Architecture
Single-file React app. No router, no external state library.
All state in useState hooks. Dark theme, IBM Plex fonts.

## Modules built (Sessions 1–3)
Masters, Orders (8 tabs), MRP Planning, Purchase, GRN, RM Quality, Stock.
Session 4 (Production tracking) is next to build.

## Seed data
- Orders: SF-2025-0001 (Tata Projects, 250T), SF-2025-0002 (BHEL, 45T)
- Stock lots: STK-001 to STK-004 (STK-004 is QC Hold, MTC missing)

## Key logins
- super_admin: rajesh.kumar / admin123
- planning_admin: vikram.singh / plan123
- finance_admin: sameer.shah / fin123
