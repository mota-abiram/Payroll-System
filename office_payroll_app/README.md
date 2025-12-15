# Stitch Office Payroll App - Application Walkthrough

## Overview
This is a robust, internal payroll processing application designed for managing employee data, attendance, and monthly payroll generation. It supports multi-tenancy, allowing multiple admins to manage their own isolated set of data.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- Firebase Project (configured in `src/firebase.js`)

### Installation
1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
3.  **Login**:
    Open the app in your browser. You must sign in with a Google account that is whitelisted in `src/adminConfig.js`.

---

## 🔑 Authentication & Security
- **Google Sign-In**: Secure login via Firebase Authentication.
- **Admin Allowlist**: Only emails explicitly permitted in `src/adminConfig.js` can access the dashboard.
- **Data Isolation**: Each admin has their own dedicated workspace. Data created by one admin (employees, payrolls, etc.) is not visible to others.

---

## 👥 Employee Management
Navigate to the **Employees** tab to manage your workforce.

### Features:
- **Add New Employee**: Click the "+ Add Employee" button.
    - **Personal Details**: Name, Email, Role, etc.
    - **Department**: Choose from a standardized list (e.g., Marketing, Engineering, HR, SEO, etc.).
    - **Salary Structure**: Enter the **CTC**. The app automatically calculates the breakdown:
        - **Fixed Basic**: Based on slabs (e.g., <35k, >50k).
        - **HRA**: 60% of Basic.
        - **PF & Deductions**: Auto-calculated.
- **Edit/Remove**: Click on any employee in the list to view details, edit their information, or remove them from the system.
- **Search**: Quickly find employees by name or ID.

---

## 🗓️ Attendance Tracking
(Currently integrated into Payroll logic)
The system tracks daily attendance to ensure accurate salary calculation.
- **LOP (Loss of Pay)**: The system automatically deducts salary for unpaid leaves based on the daily rate (calculated dynamically based on the actual number of days in the month).

---

## 💸 Payroll Processing
Navigate to the **Payroll** tab to generate and manage salaries.

### Running Payroll
1.  **Generate New**: Click "Run New Payroll".
2.  **Scope Selection**:
    - **All Employees**: Process payroll for the entire company at once.
    - **Specific Employee**: Select a single employee to process.
3.  **Month Selection**: Add one or multiple months to the processing queue.
4.  **Calculate**: The system fetches attendance, calculates payable days, deducts LOP for unpaid leaves, and computes the Net Salary.

### Managing Records
- **List View**: See all generated payroll records filtered by month or search term.
- **Edit**: Click a record to make manual adjustments (e.g., add a one-time Bonus, adjust Unpaid Leaves).
    - *Note*: Changing "Unpaid Leaves" automatically recalculates the Net Salary in real-time.
- **PDF Export**: Generate a professional payslip PDF for any record with a single click.

---

## ⚙️ Settings
Manage global configurations for your organization.
- **Holidays**: Add or remove holidays for the year. This affects the working day calculations.
- **Configuration**: View or update Department lists and other rule-based settings.

---

## 🛠️ Technical Highlights
- **Framework**: React + Vite
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore (Multi-tenant architecture)
- **State Management**: React Context (`AppContext` provider)
- **Deployment**: Ready for Vercel/Netlify

---

## ℹ️ Admin Configuration
To add a new administrator:
1. Open `src/adminConfig.js`.
2. Add their Google email address to the `ADMIN_EMAILS` array:
   ```javascript
   export const ADMIN_EMAILS = [
       "abiram@digitalmojo.in",
       "new.admin@company.com" // Add new email here
   ];
   ```
