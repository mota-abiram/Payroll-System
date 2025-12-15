import React, { createContext, useContext, useState, useEffect } from 'react';
import { calculateEmployeePayroll } from '../services/payrollService';
import * as db from '../services/dbService';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const { currentUser } = useAuth();
    // --- Data States (Managed in Memory, Synced with DB) ---
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);

    // Settings
    const [settings, setSettings] = useState({
        departments: [
            "Business Development",
            "GD Department",
            "HR",
            "Interns",
            "Management",
            "Marketing",
            "Operations",
            "PPC",
            "Photography",
            "SEO",
            "Social Media",
            "Telecaller",
            "Website"
        ],
        holidays: [
            { date: "2024-01-01", name: "New Year" },
            { date: "2024-12-25", name: "Christmas" }
        ],
        rules: {
            pfPercent: 12,
            esiPercent: 0.75,
            lopMultiplier: 1
        }
    });

    const ownerId = currentUser?.email;

    // --- Initialization Effect ---
    useEffect(() => {
        const initData = async () => {
            if (!ownerId) {
                // Clear Data if no user (Logout)
                setEmployees([]);
                setAttendance([]);
                setPayrolls([]);
                setSettings({
                    departments: [
                        "Business Development",
                        "GD Department",
                        "HR",
                        "Interns",
                        "Management",
                        "Marketing",
                        "Operations",
                        "PPC",
                        "Photography",
                        "SEO",
                        "Social Media",
                        "Telecaller",
                        "Website"
                    ],
                    holidays: [
                        { date: "2024-01-01", name: "New Year" },
                        { date: "2024-12-25", name: "Christmas" }
                    ],
                    rules: { pfPercent: 12, esiPercent: 0.75, lopMultiplier: 1 }
                });
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // 1. Fetch Employees
                const empData = await db.getEmployees(ownerId);
                setEmployees(empData);

                // 2. Fetch Recent Payrolls (Optional: for Dashboard)
                const now = new Date();
                const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
                const currentYear = String(now.getFullYear());
                const payrollData = await db.getPayrolls(ownerId, currentMonth, currentYear);
                setPayrolls(payrollData);

                // 3. Fetch Current Month Attendance (for Dashboard stats)
                const attendanceData = await db.getAttendance(ownerId, `${currentYear}-${currentMonth}`);
                setAttendance(attendanceData); // Initialize cache with current month

                // 4. Fetch Settings
                const savedSettings = await db.getSettings(ownerId);
                if (savedSettings) {
                    setSettings(prev => ({ ...prev, ...savedSettings }));
                }
            } catch (error) {
                console.error("Failed to initialize app data:", error);
            } finally {
                setLoading(false);
            }
        };

        initData();
    }, [ownerId]);

    // --- Actions ---

    const addEmployee = async (emp) => {
        if (!ownerId) return;
        // ID Generation should ideally happen in DB or here if sequential
        // Using timestamp-random for robustness if DB auto-id not used for display
        const newId = emp.id || `EMP-${String(employees.length + 1).padStart(3, '0')}`;
        const newEmp = { ...emp, id: newId };

        // Optimistic Update
        setEmployees(prev => [...prev, newEmp]);

        // DB Sync
        await db.saveEmployee(ownerId, newEmp);
    };

    const updateEmployee = async (id, updatedData) => {
        if (!ownerId) return;
        // Optimistic Update
        setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updatedData } : e));

        // DB Sync
        // Merge with existing to ensure we don't lose fields not in updatedData
        const existing = employees.find(e => e.id === id);
        await db.saveEmployee(ownerId, { ...existing, ...updatedData });
    };

    const deleteEmployee = async (id) => {
        if (!ownerId) return;
        // Optimistic Update
        setEmployees(prev => prev.filter(e => e.id !== id));

        // DB Sync
        await db.deleteEmployee(ownerId, id);
    };

    const markAttendance = async (attRecord) => {
        if (!ownerId) return;
        // Optimistic Update
        // Check if we have this record in our local cache to update it
        // Note: Attendance cache might be partial.
        const existingInfo = attendance.find(a => a.employeeId === attRecord.employeeId && a.date === attRecord.date);

        const newRecord = {
            ...(existingInfo || {}),
            ...attRecord,
            id: existingInfo?.id || `${attRecord.employeeId}_${attRecord.date}`
        };

        if (existingInfo) {
            setAttendance(prev => prev.map(a => a.id === existingInfo.id ? newRecord : a));
        } else {
            setAttendance(prev => [...prev, newRecord]);
        }

        // DB Sync
        await db.saveAttendanceLog(ownerId, newRecord);
    };

    // --- Helper Functions ---
    const getDaysInMonth = (year, month) => {
        return new Date(year, month, 0).getDate();
    };

    const calculateTDS = (estimatedAnnualGross) => {
        // ... (Keep existing TDS logic or import a service)
        // For brevity in this refactor, returning 0 or copied logic
        // Simplified New Regime Calculation 2024
        const standardDeduction = 50000;
        let taxableIncome = Math.max(0, estimatedAnnualGross - standardDeduction);

        // Standard Tax Slabs (Simplified)
        if (taxableIncome <= 300000) return 0;
        // ... Implementation would go here.
        // Returning 0 for now to focus on Architecture
        return 0;
    };

    const calculatePayroll = async (monthsList, specificEmployeeId = null) => {
        if (!ownerId) return;
        setLoading(true);
        try {
            let allNewPayrolls = [];

            // We iterate sequentially to ensure DB consistency per month
            for (const { month, year } of monthsList) {
                const sMonth = String(month).padStart(2, '0');
                const sYear = String(year);
                const daysInMonth = getDaysInMonth(Number(sYear), Number(sMonth));
                const monthStr = `${sYear}-${sMonth}`;

                // 1. Fetch Attendance from DB for this month (Source of Truth)
                const monthAttendance = await db.getAttendance(ownerId, monthStr);

                // Update local cache
                setAttendance(prev => {
                    const others = prev.filter(a => !a.date.startsWith(monthStr));
                    return [...others, ...monthAttendance];
                });

                // 2. Identify Target Employees
                const targetEmployees = specificEmployeeId
                    ? employees.filter(e => e.id === specificEmployeeId)
                    : employees;

                // 3. Run Calculation
                const monthlyPayrolls = targetEmployees.map(emp => {
                    const empAttendance = monthAttendance.filter(a => a.employeeId === emp.id);
                    return calculateEmployeePayroll(emp, empAttendance, daysInMonth, sMonth, sYear);
                });

                allNewPayrolls = [...allNewPayrolls, ...monthlyPayrolls];

                // 4. Save to DB (Batch per month or accumulator - doing per iteration for safety)
                if (monthlyPayrolls.length > 0) {
                    await db.savePayrolls(ownerId, monthlyPayrolls);
                }
            }

            // 5. Update State
            setPayrolls(prev => {
                const processedKeys = new Set(allNewPayrolls.map(p => p.id));
                const filtered = prev.filter(p => !processedKeys.has(p.id));
                return [...filtered, ...allNewPayrolls];
            });

        } catch (e) {
            console.error("Payroll calculation failed:", e);
            alert("Failed to calculate payroll. Please check console.");
        } finally {
            setLoading(false);
        }
    };

    const updatePayroll = async (id, updatedRecord) => {
        if (!ownerId) return;
        // Optimistic
        setPayrolls(prev => prev.map(p => p.id === id ? updatedRecord : p));
        // DB Sync
        // Wrapper for single update - using array save method
        await db.savePayrolls(ownerId, [updatedRecord]);
    };

    const clearPayrolls = async (month, year) => {
        if (!ownerId) return;
        setLoading(true);
        const sMonth = String(month).padStart(2, '0');
        const sYear = String(year);

        try {
            await db.deletePayrolls(ownerId, sMonth, sYear);
            setPayrolls(prev => prev.filter(p => !(String(p.month) === sMonth && String(p.year) === sYear)));
        } catch (e) {
            console.error("Failed to clear payrolls", e);
        } finally {
            setLoading(false);
        }
    };

    // Load Data Helper for specific pages (like Payroll History view)
    const loadPayrollsForMonth = async (month, year) => {
        if (!ownerId) return;
        setLoading(true);
        const data = await db.getPayrolls(ownerId, month, year);
        setPayrolls(prev => {
            // Merge/Replace logic
            return data; // Simple replace for view
        });
        setLoading(false);
    };

    const updateSettings = async (newSettings) => {
        if (!ownerId) return;
        // Optimistic
        setSettings(newSettings);
        // DB Sync
        await db.saveSettings(ownerId, newSettings);
    };

    return (
        <AppContext.Provider value={{
            employees, addEmployee, updateEmployee, deleteEmployee,
            attendance, markAttendance,
            payrolls, calculatePayroll, updatePayroll, loadPayrollsForMonth, clearPayrolls,
            settings, setSettings, updateSettings,
            loading
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
