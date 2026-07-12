# AssetFlow - Enterprise Asset & Resource Management System

AssetFlow is a robust, modular, and secure ERP-grade Asset and Resource Management System developed as part of the Odoo Hackathon. The platform includes role-based workflows, detailed analytics, predictive maintenance tracking, asset lifecycle operations, and physical inventory audit logging.

---

## 🌟 Key Features

1. **Dashboard Overview (Screen 2)**:
   - Dynamic real-time operational snapshots tailored by role.
   - 6 KPI Cards: Available Assets, Allocated Assets, Maintenance Today, Active Bookings, Pending Transfers, and Upcoming Returns.
   - Red Overdue Return Alert Banner listing assets past their expected return dates.
   - Quick Action modals: Register Assets, Book Resources, and Request Maintenance.
   - Live Recent Activity Logs.

2. **Organization Setup (Screen 3)**:
   - **Tab A - Department Management**: Renders divisions. Supports hierarchical child departments, heads, and active/inactive status.
   - **Tab B - Category Management**: Define asset categories with dynamic, parameter-specific attributes (such as default warranty periods).
   - **Tab C - Employee Directory**: Promotion registry enabling admins to re-assign departments, adjust system permissions (Admin, Asset Manager, Department Head), and update active employment status.

3. **Asset Inventory (Screen 4)**:
   - Advanced search capabilities matching tag/IDs, serial numbers, QR codes, and names.
   - Dropdown filter sets dynamically loaded from active category and department listings.
   - Holds Department tracing (correctly matches indirect user allocations).

4. **Lifecycle & Allocations**:
   - Manages state transitions: `Available`, `Allocated`, `Reserved`, `Under Maintenance`, `Lost`, `Retired`, `Disposed`.
   - Prevents double-allocation conflicts by validating asset status upon checkout.
   - Provides check-in details.

5. **Shared Resource Bookings**:
   - Collision-checked booking calendar. Restricts overlapping reservations by evaluating start and end windows.

6. **Maintenance Approval Queue**:
   - Request ticketing system routing non-administrative requests to a `Pending Approval` queue, needing approvals before maintenance work can commence.

7. **Audit Inspection & Discrepancy Reporting**:
   - Schedule inspection cycles, verify items on-site, log location/status discrepancies, and generate downloadable Crimson-themed PDF reports.

---

## ⚙️ Architecture & Tech Stack

- **Frontend**: React + TypeScript + Vite + Material UI (MUI) + Recharts + Framer Motion.
- **Backend**: Node.js + Express + TypeScript + Nodemon + ts-node.
- **Database**: Supabase PostgreSQL Integration with local `localStorage` automatic mock database fallback for sandbox execution.
