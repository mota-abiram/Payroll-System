/**
 * Data Access Layer (DAL)
 * Currently uses localStorage (Adapter Pattern).
 * FUTURE: Switch this file to use 'supabase-js' or 'axios' to connect to a real DB.
 */

// Simulated Network Delay for "Realism" (Optional, set to 0 for speed)
const DELAY = 300;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Employees ---

export const getEmployees = async () => {
    await sleep(DELAY);
    const data = localStorage.getItem('employees');
    // Fallback Mock Data if empty (First run)
    if (!data) return [];
    return JSON.parse(data);
};

export const saveEmployee = async (employee) => {
    await sleep(DELAY);
    const employees = await getEmployees();
    const index = employees.findIndex(e => e.id === employee.id);
    let newUrl;
    if (index >= 0) {
        employees[index] = employee;
    } else {
        employees.push(employee);
    }
    localStorage.setItem('employees', JSON.stringify(employees));
    return employee;
};

export const deleteEmployee = async (id) => {
    await sleep(DELAY);
    let employees = await getEmployees();
    employees = employees.filter(e => e.id !== id);
    localStorage.setItem('employees', JSON.stringify(employees));
};

// --- Attendance ---

export const getAttendance = async (monthStr) => {
    // monthStr format 'YYYY-MM'
    await sleep(DELAY);
    const data = localStorage.getItem('attendance');
    const all = data ? JSON.parse(data) : [];
    if (!monthStr) return all;
    return all.filter(a => a.date.startsWith(monthStr));
};

export const saveAttendanceLog = async (log) => {
    await sleep(DELAY);
    const data = localStorage.getItem('attendance');
    let all = data ? JSON.parse(data) : [];
    const idx = all.findIndex(a => a.employeeId === log.employeeId && a.date === log.date);
    if (idx >= 0) {
        all[idx] = { ...all[idx], ...log };
    } else {
        all.push({ id: Date.now(), ...log });
    }
    localStorage.setItem('attendance', JSON.stringify(all));
};

// --- Payroll ---

export const getPayrolls = async (month, year) => {
    await sleep(DELAY);
    const data = localStorage.getItem('payrolls');
    const all = data ? JSON.parse(data) : [];
    if (month && year) {
        return all.filter(p => String(p.month) === String(month) && String(p.year) === String(year));
    }
    return all;
};

export const savePayrolls = async (newRecords) => {
    await sleep(DELAY);
    const data = localStorage.getItem('payrolls');
    let all = data ? JSON.parse(data) : [];

    // Remove duplicates (Overwrite logic)
    newRecords.forEach(record => {
        all = all.filter(p => p.id !== record.id); // Remove existing ID
    });

    // In a real DB, we would delete WHERE month=X and year=Y first if doing a full re-run
    // Here we append and trust the ID uniqueness or Context logic

    const final = [...all, ...newRecords];
    localStorage.setItem('payrolls', JSON.stringify(final));
    return final;
};
