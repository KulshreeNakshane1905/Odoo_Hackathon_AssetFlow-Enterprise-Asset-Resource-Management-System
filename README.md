# AssetFlow — Enterprise Asset & Resource Management System

AssetFlow is a modular, high-performance, and secure ERP-grade Asset and Resource Management System developed for the Odoo Hackathon. The platform enables organizations of any scale (factories, corporate offices, schools, hospitals) to digitize their physical inventory lifecycles, resource reservations, maintenance pipelines, and audit cycles.

---

## 🌟 Key Product Features (Screens 1 to 10)

### 🔐 1. Authentication & Security (Screen 1)
- **Role-Based Security**: Signup defaults to a standard **Employee** account with no privilege self-elevation. Admin/Manager roles must be explicitly promoted in the organization directory.
- **Clean Restyling**: Modern midnight radial backdrop with transparent slate-glass input boxes and custom segmented pill tab controllers. 
- **External Typography Labels**: Avoids MUI overlapping labels by rendering static label texts above input containers (Stripe/Vercel style).

### 📊 2. Operations Dashboard (Screen 2)
- **KPI Summary Widgets**: Displays key operational metrics: Assets Available, Allocated, Under Maintenance, Active Bookings, and Pending Transfers.
- **Overdue Return Alerts**: Explicitly separates and flags allocations past their return dates to ensure compliance.
- **Quick Actions Panel**: Direct launching points for asset registration, booking, and maintenance request dialogs.

### 🏢 3. Organization Setup Panel (Screen 3)
- **Tab A (Departments)**: Renders the organizational hierarchy, parent-child divisions, and assigns Department Heads.
- **Tab B (Asset Categories)**: Custom categories (Electronics, Furniture, Vehicles, etc.) with dynamic warranty parameters.
- **Tab C (Employee Directory)**: The main promotion registry where admins re-allocate employees, toggle statuses, and elevate users to managers/heads.

### 📦 4. Asset Inventory Register (Screen 4)
- **Lifecycle Tracking**: Strict state transitions: `Available`, `Allocated`, `Reserved`, `Under Maintenance`, `Lost`, `Retired`, and `Disposed`.
- **Advanced Search & Filtering**: Multi-keyword search by Asset Tag (e.g. `AF-0012`), serial number, QR codes, category, location, and department.
- **Event History Ledger**: Clicking any asset displays its complete timeline of allocations and maintenance tickets.

### 🔄 5. Asset Allocation & Transfers (Screen 5)
- **Conflict Blockers**: Restricts double-allocation. Attempting to allocate an active asset alerts the operator who holds it and presents a **Transfer Request** workflow.
- **Transfer Pipeline**: Routes request states: `Requested` $\rightarrow$ `Approved` $\rightarrow$ `Re-allocated` (automatically archiving history).
- **Check-in Auditing**: Captures condition check-in logs and reverts the asset status back to `Available`.

### 📆 6. Resource Booking Scheduler (Screen 6)
- **Month Grid Calendar**: An interactive visual calendar grid displaying shared resource bookings by day.
- **Overlap Validation**: Restricts booking collisions (e.g., if a room is reserved 9:00-10:00, a slot 9:30-10:30 is blocked, while 10:00-11:00 succeeds).
- **Upcoming Reminders**: Prominently warns the logged-in user if a booking starts in under 30 minutes.

### 🔧 7. 5-Stage Maintenance Management (Screen 7)
- **Service Request**: Raise tickets with description, priorities (`Critical` priority displays pulsing red warnings), and photo uploads.
- **Approval Workflow**: Follows states: `Pending Approval` $\rightarrow$ `Approved` (mutates asset state to `Under Maintenance`) $\rightarrow$ `Technician Assigned` $\rightarrow$ `In Progress` $\rightarrow$ `Resolved` (records repair cost and restores asset to `Available`).
- **History Timelines**: Audit the service lifecycle of any asset.

### 🕵️ 8. Structured Compliance Audits (Screen 8)
- **Audit Cycles**: Schedule compliance scopes by department/location, assigning multiple auditors.
- **Inspector Deck**: A fast, in-line auditor console to verify, flag missing (updates state to `Lost`), or flag damaged (auto-injects maintenance tickets) items.
- **Discrepancy PDF Builder**: Generates downloadable PDF summaries of mismatch details.

### 📈 9. Reports & Advanced Analytics (Screen 9)
- **Portfolio Analytics**: Interactive charts showing utilization counts, incident frequencies by category, and portfolio values.
- **Peak Hour Heatmap**: A business hour density grid (Days vs Hours) mapping peak booking windows with color opacities.
- **Excel & CSV Exporting**: Pure JS workbook downloader using the SheetJS (`xlsx`) library.

### 🔔 10. Live Notifications Feed & Security Log (Screen 10)
- **Mockup Notification List**: Categorized unread cards (Alerts, Approvals, Bookings) with relative time (e.g. `2m ago`) and live pulsing badges.
- **Security Audit Trails**: Read-only compliance ledger showing Operator, role, timestamp, action, and transaction details.

---

## 🎨 Design System & Theme Customizations

AssetFlow features a custom-built, responsive Slate Obsidian visual layout:
- **Obsidian Dark Palette**: Primary Cobalt Blue (`#2563eb`), dark background space (`#070a13`), and slate card papers (`#0f172a`).
- **Rounded Glassmorphism**: Cards feature `16px` border radiuses with soft border glows (`1px solid rgba(255,255,255,0.06)`).
- **Real-Time Pulse Animations**: Dynamic animations highlight state changes:
  - Green pulses (`.pulse-green`) indicate Ongoing bookings and In Progress work orders.
  - Amber pulses (`.pulse-amber`) show Upcoming slots and Assigned technician stages.
  - Red pulses (`.pulse-red`) warn of Critical priority alerts.

---

## ⚙️ Technology Stack & Architecture

- **Frontend**: React (v18), TypeScript, Vite, Material UI (MUI v5), Recharts, Framer Motion, and SheetJS (`xlsx`).
- **Backend**: Node.js, Express, TypeScript, Nodemon.
- **Simulator Database**: Full local client-side `localStorage` database fallback engine. The application runs completely in-browser when the server is offline, initializing database schemas.

---

## 🚀 Setup & Installation Instructions

### Prerequisites
- Node.js (v16.x or higher)
- npm (v8.x or higher)

### 1. Clone & Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 2. Run the Local Development Server
```bash
npm run dev
```
The client will launch locally at `http://localhost:5173`. Toggle the User Switcher in the top bar to test different roles (Admin, Asset Manager, Department Head, Employee).

### 3. Build for Production
To bundle the frontend for production:
```bash
npm run build
```
This compiles the code into optimized, minified chunks under the `dist` directory.

---

## 📂 Codebase Directory Layout

```text
├── backend/                       # Server-side Express codebase
│   └── src/
│       ├── index.ts               # API Entry Point
│       └── ...
├── frontend/                      # Client-side React Application
│   ├── src/
│   │   ├── components/            # Reusable widgets (e.g. AIChatbot)
│   │   ├── context/               # Auth, Theme, & Notifications Providers
│   │   ├── pages/                 # Screens 1-10 page files
│   │   │   ├── Assets.tsx
│   │   │   ├── Bookings.tsx
│   │   │   ├── AuditCycles.tsx
│   │   │   ├── Reports.tsx
│   │   │   ├── Notifications.tsx
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── api.ts             # API services and LocalStorage simulator database
│   │   ├── theme/
│   │   │   └── ThemeContext.tsx   # Cobalt Obsidian design theme
│   │   ├── App.tsx                # Master app layout & sidebar router
│   │   └── main.tsx
│   └── package.json
└── full_presentation_script.md    # Step-by-step presentation script guide
```

---

## 📄 License & Credits
Developed as part of the Odoo Hackathon. Created with a clean architecture focus.
