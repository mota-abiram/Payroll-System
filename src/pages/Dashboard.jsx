import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const { employees, payrolls } = useApp();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // Mock "Today" and "Current Month"
    const now = new Date();
    const CURRENT_MONTH = String(now.getMonth() + 1).padStart(2, '0');
    const CURRENT_YEAR = String(now.getFullYear());

    const stats = useMemo(() => {
        const totalEmployees = employees.length;

        // Active Departments (Unique Count)
        const uniqueDefaults = new Set(employees.map(e => e.department).filter(Boolean));
        const activeDepartments = uniqueDefaults.size;

        // Payroll Cost (Current Month)
        const currentMonthPayrolls = payrolls.filter(p => p.month === CURRENT_MONTH && p.year === CURRENT_YEAR);
        const totalCost = currentMonthPayrolls.reduce((sum, p) => sum + parseFloat(p.net || 0), 0);

        // Pending Tasks: Employees without payroll generated for this month
        const paidEmployeeIds = new Set(currentMonthPayrolls.map(p => p.employeeId));
        const pendingPayrolls = employees.filter(e => !paidEmployeeIds.has(e.id)).length;

        return {
            totalEmployees,
            activeDepartments,
            payrollCost: totalCost.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }),
            pendingTasks: pendingPayrolls
        };
    }, [employees, payrolls, CURRENT_MONTH, CURRENT_YEAR]);

    return (
        <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark pb-6">
            <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-8 py-4 bg-white dark:bg-background-dark">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <div className="flex items-center gap-4">
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <div className="size-10 rounded-full bg-gray-300 bg-center bg-cover" style={{ backgroundImage: `url("https://ui-avatars.com/api/?name=${currentUser?.email || 'User'}&background=0D8ABC&color=fff")` }}></div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                {/* Welcome */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {currentUser?.email?.split('@')[0] || 'Admin'}!</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Here's your payroll overview for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Employees" value={stats.totalEmployees} icon="group" />
                    <StatCard title="Active Departments" value={stats.activeDepartments} icon="domain" />
                    <StatCard title="Monthly Payroll Cost" value={stats.payrollCost} icon="payments" />
                    <StatCard title="Pending Payrolls" value={stats.pendingTasks} icon="pending_actions" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Payrolls */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Payroll Runs</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="py-3 px-4 font-medium">Run ID</th>
                                        <th className="py-3 px-4 font-medium">Month</th>
                                        <th className="py-3 px-4 font-medium">Status</th>
                                        <th className="py-3 px-4 font-medium">Total Net</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {payrolls.length === 0 ? (
                                        <tr><td colSpan="4" className="py-4 text-center text-gray-500">No payrolls generated yet.</td></tr>
                                    ) : (
                                        payrolls.slice(0, 5).map(p => (
                                            <tr key={p.id}>
                                                <td className="py-3 px-4 text-gray-900 dark:text-white">{p.id}</td>
                                                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{p.month}/{p.year}</td>
                                                <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                                                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">₹{p.net}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col gap-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quick Actions</h3>
                        <button onClick={() => navigate('/payroll')} className="flex w-full items-center justify-center rounded-lg h-10 bg-primary text-white font-bold hover:bg-primary/90 transition-colors">Run New Payroll</button>
                        <button onClick={() => navigate('/employees')} className="flex w-full items-center justify-center rounded-lg h-10 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Add Employee</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const StatCard = ({ title, value, icon }) => (
    <div className="flex items-center gap-4 rounded-xl p-6 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
        {icon && (
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
        )}
        <div className="flex flex-col gap-1">
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">{title}</p>
            <p className="text-gray-900 dark:text-white text-2xl font-bold">{value}</p>
        </div>
    </div>
);

const StatusBadge = ({ status }) => (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'Generated' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800'
        }`}>
        {status}
    </span>
);
