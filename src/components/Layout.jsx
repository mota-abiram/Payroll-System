import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (e) {
            console.error(e);
        }
    };

    const getLinkClasses = (path) => {
        const base = "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ";
        if (location.pathname === path) {
            return base + "bg-primary/10 text-primary dark:bg-primary/20 font-bold";
        }
        return base + "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium";
    };

    return (
        <div className="relative flex min-h-screen w-full bg-background-light dark:bg-background-dark text-gray-900 dark:text-white font-display overflow-hidden">
            {/* Sidebar */}
            <aside className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4 shrink-0 h-screen overflow-y-auto">
                <div className="flex items-center gap-3 px-3 py-2 mb-6">
                    <div className="text-primary size-8 flex items-center justify-center">
                        <span className="material-symbols-outlined !text-4xl">database</span>
                    </div>
                    <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-[#111418] dark:text-white">PayCorp</h2>
                </div>

                <nav className="flex flex-col gap-2 flex-1">
                    <Link to="/" className={getLinkClasses('/')}>
                        <span className="material-symbols-outlined">dashboard</span>
                        <p className="text-sm leading-normal">Dashboard</p>
                    </Link>
                    <Link to="/employees" className={getLinkClasses('/employees')}>
                        <span className="material-symbols-outlined">group</span>
                        <p className="text-sm leading-normal">Employees</p>
                    </Link>
                    <Link to="/payroll" className={getLinkClasses('/payroll')}>
                        <span className="material-symbols-outlined">payments</span>
                        <p className="text-sm leading-normal">Payroll</p>
                    </Link>
                    <Link to="/settings" className={getLinkClasses('/settings')}>
                        <span className="material-symbols-outlined">settings</span>
                        <p className="text-sm leading-normal">Settings</p>
                    </Link>
                </nav>

                <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-3 items-center px-2 mb-3">
                        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-gray-200" style={{ backgroundImage: `url("https://ui-avatars.com/api/?name=${currentUser?.email || 'User'}&background=0D8ABC&color=fff")` }}></div>
                        <div className="flex flex-col overflow-hidden">
                            <h1 className="text-[#111418] dark:text-white text-sm font-medium leading-normal truncate">{currentUser?.email?.split('@')[0] || 'Admin'}</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-normal leading-normal truncate">{currentUser?.email || 'admin@company.com'}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {children}
            </main>
        </div>
    );
}
