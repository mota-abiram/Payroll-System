
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { calculateSalaryStats } from '../services/payrollService';

export default function Payroll() {
    const { payrolls, calculatePayroll, updatePayroll, clearPayrolls, employees } = useApp();
    const [view, setView] = useState('list'); // list, create
    const [step, setStep] = useState(1);
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));

    const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
    // Dynamic Years (Current - 1 to Current + 1)
    const availableYears = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

    const [searchTerm, setSearchTerm] = useState('');
    const [editingPayroll, setEditingPayroll] = useState(null);

    const handleEdit = (payroll) => {
        // Recalculate immediately to ensure all derived fields (like earnedHRA) are populated
        // even if the saved record is from an older version of the logic.
        const hydrated = recalculateSinglePayroll(payroll);
        setEditingPayroll(hydrated);
        setView('edit');
    };

    const recalculateSinglePayroll = (payroll) => {
        // 1. Get Employee Data (Need salary structure)
        const employee = employees.find(e => e.id === payroll.employeeId);
        if (!employee) return payroll;

        // 2. Get Inputs
        // Fallback to leavesTaken if unpaidLeaves not present (backwards compat)
        const unpaidLeaves = parseFloat(payroll.details.unpaidLeaves !== undefined ? payroll.details.unpaidLeaves : (payroll.details.leavesTaken || 0));
        const paidLeaves = parseFloat(payroll.details.paidLeaves || 0);

        const totalOtHours = parseFloat(payroll.details.otHours || 0);
        const bonus = parseFloat(payroll.details.bonus || 0);
        const daysInMonth = payroll.details.daysInMonth || 30; // Fallback only if missing in record

        // 3. Use Shared Logic
        const calculated = calculateSalaryStats(employee, unpaidLeaves, paidLeaves, totalOtHours, daysInMonth, bonus);

        // 4. Merge back
        return {
            ...payroll,
            gross: calculated.gross,
            deductions: calculated.deductions,
            net: calculated.net,
            details: calculated.details
        };
    };

    const handleEditChange = (path, value) => {
        // Deep update helper
        const newPayroll = JSON.parse(JSON.stringify(editingPayroll)); // Deep clone
        const keys = path.split('.');
        let current = newPayroll;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;

        // Trigger calculation if relevant fields change
        if (path === 'details.unpaidLeaves' || path === 'details.paidLeaves' || path === 'details.otHours' || path === 'details.bonus') {
            const recalculated = recalculateSinglePayroll(newPayroll);
            setEditingPayroll(recalculated);
        } else {
            setEditingPayroll(newPayroll);
        }
    };

    const handleSaveEdit = () => {
        if (editingPayroll) {
            updatePayroll(editingPayroll.id, editingPayroll);
        }
        setEditingPayroll(null);
        setView('list');
    };

    // Run Payroll Form State
    const [runScope, setRunScope] = useState('all'); // all, single
    const [runEmployeeId, setRunEmployeeId] = useState('');
    const [runMonths, setRunMonths] = useState([{ month: String(new Date().getMonth() + 1).padStart(2, '0'), year: String(new Date().getFullYear()) }]);

    // Helper to add a month to the list
    const addRunMonth = () => {
        const waitingId = `${selectedYear}-${selectedMonth}`;
        if (!runMonths.some(m => `${m.year}-${m.month}` === waitingId)) {
            setRunMonths([...runMonths, { month: selectedMonth, year: selectedYear }]);
        }
    };

    const removeRunMonth = (index) => {
        setRunMonths(runMonths.filter((_, i) => i !== index));
    };

    const handleRunPayroll = () => {
        if (runMonths.length === 0) {
            alert("Please select at least one month to process.");
            return;
        }
        if (runScope === 'single' && !runEmployeeId) {
            alert("Please select an employee.");
            return;
        }

        const employeeId = runScope === 'single' ? runEmployeeId : null;
        calculatePayroll(runMonths, employeeId);
        setView('list');
    };

    const handleClearPayroll = () => {
        if (window.confirm(`Are you sure you want to clear all payroll records for ${selectedMonth}/${selectedYear}? This action cannot be undone.`)) {
            clearPayrolls(selectedMonth, selectedYear);
        }
    };

    const filteredPayrolls = payrolls.filter(p => {
        const nameMatch = (p.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const idMatch = (p.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTerm = nameMatch || idMatch;
        // Show only payrolls for the currently selected month context
        const matchesDate = String(p.month) === selectedMonth && String(p.year) === selectedYear;
        return matchesTerm && matchesDate;
    });

    const sortedPayrolls = [...filteredPayrolls].sort((a, b) => b.id.localeCompare(a.id));

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden p-8">
            {view === 'list' && (
                <>
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payroll Processing</h1>
                            <p className="text-gray-500 mt-1">Manage and run monthly payroll.</p>
                        </div>
                        <div className="flex gap-3">
                            {filteredPayrolls.length > 0 && (
                                <button
                                    onClick={handleClearPayroll}
                                    className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold hover:bg-red-100 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined">delete_sweep</span> Clear Records
                                </button>
                            )}
                            <button
                                onClick={() => setView('create')}
                                className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">play_arrow</span> Run New Payroll
                            </button>
                        </div>
                    </div>

                    {/* Search and Filter Bar */}
                    <div className="flex gap-4 mb-6">
                        <div className="relative flex-1 max-w-md">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">search</span>
                            {/* Simple month filter for list view - independent of run form */}
                            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="absolute right-0 top-0 h-full bg-transparent border-l border-gray-300 dark:border-gray-700 px-2 text-sm outline-none text-gray-500">
                                <option value="01">Jan</option><option value="02">Feb</option><option value="03">Mar</option><option value="04">Apr</option>
                                <option value="05">May</option><option value="06">Jun</option><option value="07">Jul</option><option value="08">Aug</option>
                                <option value="09">Sep</option><option value="10">Oct</option><option value="11">Nov</option><option value="12">Dec</option>
                            </select>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by Name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 max-w-md pl-4 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-gray-500">Employee</th>
                                    <th className="px-6 py-4 font-medium text-gray-500">Month</th>
                                    <th className="px-6 py-4 font-medium text-gray-500">Gross Earned</th>
                                    <th className="px-6 py-4 font-medium text-gray-500">LOP</th>
                                    <th className="px-6 py-4 font-medium text-gray-500">Deductions</th>
                                    <th className="px-6 py-4 font-medium text-gray-500">Net Salary</th>
                                    <th className="px-6 py-4 font-medium text-gray-500">Status</th>
                                    <th className="px-6 py-4 font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {sortedPayrolls.map(p => (
                                    <tr key={p.id} className="bg-white dark:bg-gray-900">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {employees.find(e => e.id === p.employeeId)?.name || p.employeeId}
                                            <div className="text-xs text-gray-500">{p.employeeId}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{p.month}/{p.year}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">₹{p.gross}</td>
                                        <td className="px-6 py-4 text-red-500">-₹{p.details?.lopAmount}</td>
                                        <td className="px-6 py-4 text-red-500">-₹{p.deductions}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">₹{p.net}</td>
                                        <td className="px-6 py-4"><span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">{p.status}</span></td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => handleEdit(p)} className="text-primary hover:text-primary/80 font-bold text-sm">Edit</button>
                                        </td>
                                    </tr>
                                ))}
                                {sortedPayrolls.length === 0 && (
                                    <tr><td colSpan="8" className="p-8 text-center text-gray-500">No payroll history found. Click "Run New Payroll".</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {view === 'edit' && editingPayroll && (
                <div className="max-w-7xl mx-auto w-full overflow-y-auto pb-20">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-gray-900 dark:text-white text-3xl font-bold leading-tight">Payroll Processing Update</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">Update attendance, overtime, and other components for an accurate payroll run.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setView('list')} className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-bold leading-normal tracking-wide">
                                <span className="truncate">Cancel</span>
                            </button>
                            <button onClick={handleSaveEdit} className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-wide gap-2">
                                <span className="material-symbols-outlined text-xl">save</span>
                                <span className="truncate">Save Changes</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Attendance Section */}
                        <div className="p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Attendance & Overtime</h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Days in month</label>
                                    <input disabled className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm cursor-not-allowed" value={editingPayroll.details?.daysInMonth || 30} type="number" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unpaid Leaves (LOP)</label>
                                    <input onChange={(e) => handleEditChange('details.unpaidLeaves', parseFloat(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm" value={editingPayroll.details?.unpaidLeaves !== undefined ? editingPayroll.details?.unpaidLeaves : editingPayroll.details?.leavesTaken} type="number" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Paid Leaves</label>
                                    <input onChange={(e) => handleEditChange('details.paidLeaves', parseFloat(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm" value={editingPayroll.details?.paidLeaves || 0} type="number" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Paid Days</label>
                                    <input disabled className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm cursor-not-allowed" value={editingPayroll.details?.paidDays} type="number" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">OT hours</label>
                                    <input onChange={(e) => handleEditChange('details.otHours', parseFloat(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm" value={editingPayroll.details?.otHours} type="number" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">LOP Amount</label>
                                    <p className="mt-1 text-base font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md">-₹{editingPayroll.details?.lopAmount}</p>
                                </div>
                            </div>
                        </div>

                        {/* Salary Details */}
                        <div className="p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Earnings (Prorated)</h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Earned Basic</label>
                                    <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md">₹{editingPayroll.details?.earnedBasic}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Earned HRA</label>
                                    <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md">₹{editingPayroll.details?.earnedHRA}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Earned Allowances</label>
                                    <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md">₹{editingPayroll.details?.earnedAllowances}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">OT Pay</label>
                                    <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md">₹{editingPayroll.details?.otPay}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bonus / Incentive</label>
                                    <input
                                        type="number"
                                        value={editingPayroll.details?.bonus || 0}
                                        onChange={(e) => handleEditChange('details.bonus', parseFloat(e.target.value))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm"
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Gross Earned</label>
                                    <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-md border border-green-200 dark:border-green-800">₹{editingPayroll.gross}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Compliance */}
                            {/* Deductions Section */}
                            <div className="p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 space-y-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Employee Deductions & Taxes</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Employee PF (12%)</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md">₹{editingPayroll.details?.employeeEPF}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Professional Tax</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md">₹{editingPayroll.details?.pt}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Medical Insurance</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md">₹{editingPayroll.details?.medical}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Income Tax (TDS)</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md">₹{0}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Deductions (PF+PT+Med+TDS+LOP)</label>
                                    <p className="mt-1 text-base font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md border border-red-100 dark:border-red-900/30 w-full md:w-1/4">-₹{editingPayroll.deductions}</p>
                                </div>
                            </div>

                            {/* Employer Contributions (Info) */}
                            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800 space-y-4">
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Employer Contributions (CTC Components)</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">Pension (8.33%)</label>
                                        <p className="text-gray-900 dark:text-white font-mono">₹{editingPayroll.details?.employerSplits?.pension}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">EPF Balance (3.67%)</label>
                                        <p className="text-gray-900 dark:text-white font-mono">₹{editingPayroll.details?.employerSplits?.epfBalance}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">EDLI (0.5%)</label>
                                        <p className="text-gray-900 dark:text-white font-mono">₹{editingPayroll.details?.employerSplits?.edli}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">PF Admin (0.5%)</label>
                                        <p className="text-gray-900 dark:text-white font-mono">₹{editingPayroll.details?.employerSplits?.admin}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Net Pay */}
                        <div className="p-6 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/50 flex flex-wrap justify-between items-center gap-4">
                            <h2 className="text-xl font-bold text-primary dark:text-primary-light">Net Salary to be paid</h2>
                            <p className="text-3xl font-bold text-primary dark:text-primary-light">₹{editingPayroll.net}</p>
                        </div>
                    </div>
                </div>
            )}

            {view === 'create' && (
                <div className="max-w-3xl mx-auto w-full mt-10">
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Run New Payroll</h2>

                        {/* Scope Selector */}
                        <div className="mb-8">
                            <label className="block text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">Who to pay?</label>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setRunScope('all')}
                                    className={`flex-1 py-3 px-4 rounded-lg border text-left flex items-center gap-3 transition-all ${runScope === 'all'
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                >
                                    <div className={`size-5 rounded-full border flex items-center justify-center ${runScope === 'all' ? 'border-primary' : 'border-gray-400'}`}>
                                        {runScope === 'all' && <div className="size-3 bg-primary rounded-full" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">All Employees</p>
                                        <p className="text-xs text-gray-500">Run payroll for everyone in the company.</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setRunScope('single')}
                                    className={`flex-1 py-3 px-4 rounded-lg border text-left flex items-center gap-3 transition-all ${runScope === 'single'
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                >
                                    <div className={`size-5 rounded-full border flex items-center justify-center ${runScope === 'single' ? 'border-primary' : 'border-gray-400'}`}>
                                        {runScope === 'single' && <div className="size-3 bg-primary rounded-full" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">Specific Employee</p>
                                        <p className="text-xs text-gray-500">Select a single employee to pay.</p>
                                    </div>
                                </button>
                            </div>

                            {/* Employee Dropdown */}
                            {runScope === 'single' && (
                                <div className="mt-4 animate-fadeIn">
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Select Employee</label>
                                    <select
                                        value={runEmployeeId}
                                        onChange={e => setRunEmployeeId(e.target.value)}
                                        className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 px-4 py-2"
                                    >
                                        <option value="">-- Select --</option>
                                        {employees.map(e => (
                                            <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <hr className="my-8 border-gray-100 dark:border-gray-800" />

                        {/* Month Selection */}
                        <div className="mb-8">
                            <label className="block text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">Select Month(s)</label>

                            <div className="flex gap-4 items-end mb-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium mb-1 text-gray-500">Month</label>
                                    <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 px-4 py-2">
                                        <option value="01">January</option><option value="02">February</option><option value="03">March</option><option value="04">April</option>
                                        <option value="05">May</option><option value="06">June</option><option value="07">July</option><option value="08">August</option>
                                        <option value="09">September</option><option value="10">October</option><option value="11">November</option><option value="12">December</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-medium mb-1 text-gray-500">Year</label>
                                    <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 px-4 py-2">
                                        {availableYears.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                                <button onClick={addRunMonth} className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined">add</span> Add
                                </button>
                            </div>

                            {/* List of selected months */}
                            <div className="flex flex-wrap gap-2">
                                {runMonths.map((m, idx) => (
                                    <div key={`${m.month}-${m.year}`} className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 border border-blue-100 dark:border-blue-900">
                                        {m.month}/{m.year}
                                        <button onClick={() => removeRunMonth(idx)} className="hover:text-red-500 flex items-center"><span className="material-symbols-outlined text-sm">close</span></button>
                                    </div>
                                ))}
                                {runMonths.length === 0 && <span className="text-red-500 text-sm italic">No months selected. Please add at least one.</span>}
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-8">
                            <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">Summary</h3>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                This will generate payroll for <strong>{runScope === 'single' ? '1 Selected Employee' : `${employees.length} Active Employees`}</strong> across <strong>{runMonths.length} Month(s)</strong>.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setView('list')} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={handleRunPayroll} disabled={runMonths.length === 0} className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                                Process Payroll
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
