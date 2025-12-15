import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAdmin({ children }) {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return null; // or spinner
    }

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    if (currentUser.role !== 'admin') {
        // Redirect to dashboard or show unauthorized page
        // For now, redirect to root dashboard which represents "Employee Self Service"
        // But if root is also admin, we might need a separate /my-dashboard
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">gpp_maybe</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Restricted</h2>
                <p className="text-gray-500 mt-2">You do not have permission to view this page.</p>
            </div>
        );
    }

    return children;
}
