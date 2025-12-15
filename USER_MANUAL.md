# PayCorp - User Manual & Walkthrough

Welcome to the **PayCorp Payroll Management System**. This guide will walk you through the daily operations of the application, from logging in to generating monthly payslips.

---

## 1. Logging In

**Accessing the App**
1.  Navigate to the application URL in your web browser.
2.  You will see the **Sign In** screen.
3.  Click the **"Sign in with Google"** button.
4.  Select your authorized company email address.
    *   *Note: Only authorized email addresses can access the system. If you are unable to login, please contact the system administrator to add your email to the allowlist.*

---

## 2. Dashboard

Upon logging in, you are greeted by the Dashboard. This is your command center.
*   **Quick Stats**: View total active employees, total payroll processed this month, and pending actions.
*   **Navigation Sidebar**: Use the left sidebar to switch between different modules:
    *   **Dashboard**: Home screen.
    *   **Employees**: Manage your team.
    *   **Payroll**: Process salaries.
    *   **Settings**: Configure system rules.

---

## 3. Managing Employees

Navigate to the **Employees** tab in the sidebar.

### Adding a New Employee
1.  Click the **"+ Add Employee"** button in the top right corner.
2.  fill in the **Personal Details** (Name, Email, Role).
3.  Select the **Department** from the dropdown list (e.g., Marketing, Engineering, HR).
4.  **Salary Structure**:
    *   Enter the **CTC (Cost to Company)**.
    *   The system will automatically calculate the **Fixed Basic**, **HRA**, **PF**, and **Allowances** based on company tax slabs.
    *   *Tip: You can manually override these values if necessary, but the auto-calculation is recommended.*
5.  Click **Save**.

### Editing an Employee
1.  Click on an employee's name in the list.
2.  Click the **"Edit"** button.
3.  Update the necessary fields.
4.  Click **Save**.

### Removing an Employee
1.  Select the employee.
2.  Click the **"Remove"** button (or the trash icon).
3.  Confirm the action. *Warning: This cannot be undone.*

---

## 4. Processing Payroll

Navigate to the **Payroll** tab. This is where you calculate salaries and generate slips.

### Running a New Payroll Batch
1.  Click the **"Run New Payroll"** button.
2.  **Select Employee(s)**:
    *   Choose **"All Employees"** to process the whole company.
    *   Choose **"Specific Employee"** for individual adjustments.
3.  **Select Month(s)**:
    *   Click "Add Month" to choose the month and year you are processing (e.g., October 2024).
    *   You can process multiple months at once if needed.
4.  Click **"Calculate"**.
    *   The system will process attendance data, calculate Loss of Pay (LOP) for unpaid leaves, and compute the final Net Salary.

### Reviewing & Editing Payroll
Once payroll is generated, you will see a list of records.
1.  **Search/Filter**: Use the search bar or month filter to find a specific record.
2.  **Edit Specifics**: Click on a payroll record to open details.
    *   **Edit Mode**: detailed breakdown of Earnings and Deductions.
    *   **Unpaid Leaves (LOP)**: If you change the number of unpaid leaves, the salary is *instantly recalculated*.
    *   **Bonus/Overtime**: Add any one-time bonuses or overtime hours here.
3.  Click **Save Changes**.



---

## 5. Settings

Navigate to the **Settings** tab.

### Holiday Management
*   **View Holidays**: See the list of public holidays configured for the year.
*   **Add Holiday**: Enter the date and name of the holiday to ensure payroll calculates working days correctly.

---

