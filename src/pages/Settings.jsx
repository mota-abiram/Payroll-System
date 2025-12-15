import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Settings() {
    const { settings, setSettings } = useApp();
    const [activeTab, setActiveTab] = useState('Departments');
    const [newDepartment, setNewDepartment] = useState('');

    const addDepartment = (e) => {
        e.preventDefault();
        if (newDepartment && !settings.departments.includes(newDepartment)) {
            setSettings({ ...settings, departments: [...settings.departments, newDepartment] });
            setNewDepartment('');
        }
    };

    const removeDepartment = (dept) => {
        setSettings({ ...settings, departments: settings.departments.filter(d => d !== dept) });
    };

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">App Settings</h1>
                <button className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90">Save Changes</button>
            </div>

            <div className="flex gap-8 border-b border-gray-200 dark:border-gray-700 mb-6">
                {['Departments', 'Holidays', 'Statutory'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="max-w-4xl">
                {activeTab === 'Departments' && (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Manage Departments</h2>

                        <form onSubmit={addDepartment} className="flex gap-4 mb-6">
                            <input
                                type="text"
                                placeholder="New Department Name"
                                value={newDepartment}
                                onChange={e => setNewDepartment(e.target.value)}
                                className="flex-1 rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2"
                            />
                            <button type="submit" className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-bold px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700">Add</button>
                        </form>

                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {settings.departments.map(dept => (
                                <li key={dept} className="py-4 flex justify-between items-center">
                                    <span className="font-medium text-gray-900 dark:text-white">{dept}</span>
                                    <button onClick={() => removeDepartment(dept)} className="text-red-500 hover:text-red-700 font-bold text-sm">Remove</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {activeTab === 'Statutory' && (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Statutory Rules</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">PF contribution (% of Basic)</label>
                                <input
                                    type="number"
                                    value={settings.rules.pfPercent}
                                    onChange={e => setSettings({ ...settings, rules: { ...settings.rules, pfPercent: parseFloat(e.target.value) } })}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">ESI contribution (%)</label>
                                <input
                                    type="number"
                                    value={settings.rules.esiPercent}
                                    onChange={e => setSettings({ ...settings, rules: { ...settings.rules, esiPercent: parseFloat(e.target.value) } })}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2"
                                />
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'Holidays' && (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Holiday Calendar</h2>

                        <div className="flex gap-4 mb-6">
                            <input
                                type="date"
                                id="newHolidayDate"
                                className="rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2"
                            />
                            <input
                                type="text"
                                id="newHolidayName"
                                placeholder="Holiday Name (e.g. Diwali)"
                                className="flex-1 rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2"
                            />
                            <button
                                onClick={() => {
                                    const date = document.getElementById('newHolidayDate').value;
                                    const name = document.getElementById('newHolidayName').value;
                                    if (date && name) {
                                        const newHolidays = [...settings.holidays, { date, name }]
                                            .sort((a, b) => new Date(a.date) - new Date(b.date));
                                        updateSettings({ ...settings, holidays: newHolidays });
                                        document.getElementById('newHolidayDate').value = '';
                                        document.getElementById('newHolidayName').value = '';
                                    }
                                }}
                                className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-bold px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700"
                            >
                                Add Holiday
                            </button>
                        </div>

                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {settings.holidays.map((h, i) => (
                                <li key={i} className="py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 rounded-lg">
                                    <div className="flex gap-4 items-center">
                                        <span className="font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">{h.date}</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{h.name}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newHolidays = settings.holidays.filter((_, idx) => idx !== i);
                                            updateSettings({ ...settings, holidays: newHolidays });
                                        }}
                                        className="text-red-500 hover:text-red-700 font-bold text-sm"
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                            {settings.holidays.length === 0 && (
                                <p className="text-gray-500 text-center py-4">No holidays added yet.</p>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
