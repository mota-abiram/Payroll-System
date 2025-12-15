
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function Employees() {
    const { employees, updateEmployee, addEmployee, deleteEmployee, settings } = useApp();
    const [selectedId, setSelectedId] = useState(employees[0]?.id || null);
    const [activeTab, setActiveTab] = useState('Personal');
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [editFormData, setEditFormData] = useState(null);

    const selectedEmployee = employees.find(e => e.id === selectedId);

    const blankEmployee = {
        name: "", email: "", role: "", department: "Engineering",
        dob: "", phone: "", address: "",
        joiningDate: "",
        salaryStructure: { ctc: 0, fixedBasic: 0, pt: 200, medical: 210, hra: 0, otherAllowances: 0 },
        bankDetails: { bankName: "", accountNumber: "", ifsc: "", pan: "" },
        status: "Active"
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Not Set';
        const [year, month, day] = dateStr.split('-');
        if (!year || !month || !day) return dateStr;
        return `${day}/${month}/${year}`;
    };

    // Initialize form data when selecting a new employee or entering edit mode
    useEffect(() => {
        if (selectedEmployee && !isCreating) {
            setEditFormData(JSON.parse(JSON.stringify(selectedEmployee)));
            setIsEditing(false);
        }
    }, [selectedId, employees, isCreating]);

    const handleAddClick = () => {
        setEditFormData(blankEmployee);
        setIsCreating(true);
        setIsEditing(true);
        setSelectedId(null);
    };

    const handleSave = async () => {
        // Validation removed for bank details as the form is gone

        if (isCreating) {
            await addEmployee(editFormData);
            setIsCreating(false);
            setIsEditing(false);
            const newId = editFormData.id || `EMP-${String(employees.length + 1).padStart(3, '0')}`;
            setSelectedId(newId);
        } else {
            if (editFormData.id !== selectedId) {
                // ID Changed: Treat as Move (Add New + Delete Old)
                await addEmployee(editFormData);
                await deleteEmployee(selectedId);
                setSelectedId(editFormData.id);
            } else {
                await updateEmployee(selectedId, editFormData);
            }
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setIsCreating(false);
        setIsEditing(false);
        if (!selectedId && employees.length > 0) setSelectedId(employees[0].id);
    };

    const handleDelete = (id = selectedId) => {
        const empToDelete = employees.find(e => e.id === id);
        if (window.confirm(`Are you sure you want to remove ${empToDelete?.name}? This action cannot be undone.`)) {
            deleteEmployee(id);
            if (selectedId === id) {
                setIsEditing(false);
                setSelectedId(null);
            }
        }
    };

    const handleInputChange = (field, value) => {
        setEditFormData({ ...editFormData, [field]: value });
    };

    const handleSalaryChange = (field, value) => {
        const newVal = parseFloat(value) || 0;
        let updatedStructure = { ...editFormData.salaryStructure, [field]: newVal };

        if (field === 'ctc') {
            // Auto-calculate components based on User's Golden Rule (30k Example)
            // Rule:
            // 1. Fixed Basic based on Slab
            // 2. Employer PF (12% of Basic) is part of CTC.
            // 3. Gross = CTC - Employer PF.
            // 4. HRA = 60% of Basic.
            // 5. Allowances = Balance.

            // Slab Logic for Fixed Basic (User Specified Slabs)
            let newFixedBasic = 10000;

            if (newVal > 50000) {
                // Slab: > 50000
                newFixedBasic = 15000;
            } else if (newVal > 35000) {
                // Slab: <= 50000 (and > 35000)
                newFixedBasic = 12500;
            } else {
                // Slab: <= 35000
                newFixedBasic = 10000;
            }

            // 2. Employer PF (12% of Basic) which is deduced from CTC
            const employerPF = Math.round(newFixedBasic * 0.12);

            // 3. Gross Salary (CTC - Employer EPF)
            const grossSalary = newVal - employerPF;

            // 4. HRA (60% of Fixed Basic - matches user example 6000 for 10000 basic)
            const newHra = Math.round(newFixedBasic * 0.60);

            // 5. Other Allowances (Balancing Figure: Gross - Basic - HRA)
            const newOtherAllowances = Math.max(0, grossSalary - newFixedBasic - newHra);

            updatedStructure = {
                ...updatedStructure,
                ctc: newVal,
                fixedBasic: newFixedBasic,
                hra: newHra,
                otherAllowances: newOtherAllowances,
                // Set default deductions as per example
                pt: 200,
                medical: 210
            };
        }

        setEditFormData({
            ...editFormData,
            salaryStructure: updatedStructure
        });
    };

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-3 bg-white dark:bg-gray-900/50 shrink-0">
                <h1 className="text-xl font-black text-gray-900 dark:text-white">Employee Management</h1>
                <button onClick={handleAddClick} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90">
                    <span className="material-symbols-outlined">add</span> Add Employee
                </button>
            </header>

            <div className="flex flex-1 overflow-hidden p-6 gap-6">
                {/* List Panel */}
                <div className="w-2/5 flex flex-col bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-y-auto h-full">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white dark:bg-gray-900/50 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Name</th>
                                    <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">ID</th>
                                    <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Dept</th>
                                    <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {employees.map(emp => (
                                    <tr
                                        key={emp.id}
                                        onClick={() => setSelectedId(emp.id)}
                                        className={`cursor-pointer transition-colors ${selectedId === emp.id ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center text-primary text-xs font-bold">
                                                    {emp.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{emp.name}</p>
                                                    <p className="text-xs text-gray-500">{emp.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{emp.id}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{emp.department}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(emp.id); }}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Details Panel */}
                <div className="w-3/5 flex flex-col gap-6 overflow-y-auto">
                    {(selectedEmployee || isCreating) ? (
                        <>
                            {/* Header Card */}
                            <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                                <div className="flex gap-4">
                                    <div className="bg-primary/20 rounded-full w-24 h-24 flex items-center justify-center text-primary text-4xl font-bold">
                                        {isCreating ? '+' : selectedEmployee.name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{isCreating ? "New Employee" : selectedEmployee.name}</h2>
                                        <p className="text-gray-500">{isCreating ? "Draft" : selectedEmployee.role}</p>
                                        <p className="text-gray-500">{isCreating ? editFormData?.id || "EMP-###" : selectedEmployee.id}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {isEditing ? (
                                        <>
                                            <button onClick={handleCancel} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700">Cancel</button>
                                            <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90">Save</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700">Edit</button>
                                            <button onClick={() => handleDelete(selectedId)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">delete</span> Remove
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Tabs Card */}
                            <div className="flex-1 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex space-x-6 border-b border-gray-200 dark:border-gray-700 mb-6">
                                    {['Personal', 'Job & Salary'].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                {activeTab === 'Personal' && (
                                    <div className="grid grid-cols-2 gap-6">
                                        {isEditing ? (
                                            <>
                                                <div><label className="text-sm font-medium text-gray-500">Employee ID</label><input type="text" value={editFormData?.id || ''} onChange={e => handleInputChange('id', e.target.value)} className="w-full rounded border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1" placeholder="Auto-generated if empty" /></div>
                                                <div><label className="text-sm font-medium text-gray-500">Name</label><input type="text" value={editFormData?.name} onChange={e => handleInputChange('name', e.target.value)} className="w-full rounded border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1" /></div>
                                                <div><label className="text-sm font-medium text-gray-500">Role</label><input type="text" value={editFormData?.role} onChange={e => handleInputChange('role', e.target.value)} className="w-full rounded border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1" /></div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">Department</label>
                                                    <select
                                                        value={editFormData?.department || ''}
                                                        onChange={e => handleInputChange('department', e.target.value)}
                                                        className="w-full rounded border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1"
                                                    >
                                                        <option value="">Select Department</option>
                                                        {settings.departments.map(dept => (
                                                            <option key={dept} value={dept}>{dept}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div><label className="text-sm font-medium text-gray-500">Email</label><input type="text" value={editFormData?.email} onChange={e => handleInputChange('email', e.target.value)} className="w-full rounded border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1" /></div>
                                                <div><label className="text-sm font-medium text-gray-500">Phone</label><input type="text" value={editFormData?.phone} onChange={e => handleInputChange('phone', e.target.value)} className="w-full rounded border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1" /></div>
                                                <div><label className="text-sm font-medium text-gray-500">DOB</label><input type="date" value={editFormData?.dob} onChange={e => handleInputChange('dob', e.target.value)} className="w-full rounded border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1" /></div>
                                                <div><label className="text-sm font-medium text-gray-500">Address</label><input type="text" value={editFormData?.address} onChange={e => handleInputChange('address', e.target.value)} className="w-full rounded border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1" /></div>
                                            </>
                                        ) : (
                                            <>
                                                <div><label className="text-sm font-medium text-gray-500">Employee ID</label><p className="text-gray-900 dark:text-white">{selectedEmployee.id}</p></div>
                                                <div><label className="text-sm font-medium text-gray-500">Department</label><p className="text-gray-900 dark:text-white">{selectedEmployee.department}</p></div>
                                                <div><label className="text-sm font-medium text-gray-500">Email</label><p className="text-gray-900 dark:text-white">{selectedEmployee.email}</p></div>
                                                <div><label className="text-sm font-medium text-gray-500">Phone</label><p className="text-gray-900 dark:text-white">{selectedEmployee.phone}</p></div>
                                                <div><label className="text-sm font-medium text-gray-500">DOB</label><p className="text-gray-900 dark:text-white">{formatDate(selectedEmployee.dob)}</p></div>
                                                <div><label className="text-sm font-medium text-gray-500">Address</label><p className="text-gray-900 dark:text-white">{selectedEmployee.address}</p></div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'Job & Salary' && (
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-gray-900 dark:text-white">Employment Details</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <span className="text-sm text-gray-500">Date of Joining</span>
                                                {isEditing ? (
                                                    <input type="date" value={editFormData?.joiningDate} onChange={e => handleInputChange('joiningDate', e.target.value)} className="w-full rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-1" />
                                                ) : (
                                                    <p className="font-bold text-lg text-gray-900 dark:text-white">{formatDate(selectedEmployee.joiningDate)}</p>
                                                )}
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <span className="text-sm text-gray-500">Status</span>
                                                <p className="font-bold text-lg text-green-600">Active</p>
                                            </div>
                                        </div>

                                        <h3 className="font-bold text-gray-900 dark:text-white mt-6">Salary Structure</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-900">
                                                <span className="text-sm text-gray-500">CTC</span>
                                                {isEditing ? (
                                                    <input type="number" value={editFormData?.salaryStructure?.ctc} onChange={e => handleSalaryChange('ctc', e.target.value)} className="w-full rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-1" />
                                                ) : (
                                                    <p className="font-bold text-lg text-blue-600 dark:text-blue-400">₹{selectedEmployee.salaryStructure.ctc?.toLocaleString()}</p>
                                                )}
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <span className="text-sm text-gray-500">Fixed Basic (PF Basis)</span>
                                                {isEditing ? (
                                                    <input type="number" value={editFormData?.salaryStructure?.fixedBasic} onChange={e => handleSalaryChange('fixedBasic', e.target.value)} className="w-full rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-1" />
                                                ) : (
                                                    <p className="font-bold text-lg">₹{selectedEmployee.salaryStructure.fixedBasic?.toLocaleString()}</p>
                                                )}
                                            </div>
                                            {/* Derived Fields Display */}
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <span className="text-sm text-gray-500">Empr PF (12% Basic)</span>
                                                <p className="font-medium text-gray-700 dark:text-gray-300">₹{Math.round((isEditing ? editFormData?.salaryStructure?.fixedBasic : selectedEmployee.salaryStructure.fixedBasic) * 0.12).toLocaleString()}</p>
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-green-100 dark:border-green-900">
                                                <span className="text-sm text-gray-500">Gross Salary</span>
                                                <p className="font-bold text-lg text-green-600 dark:text-green-400">
                                                    ₹{((isEditing ? editFormData?.salaryStructure?.ctc : selectedEmployee.salaryStructure.ctc) - Math.round((isEditing ? editFormData?.salaryStructure?.fixedBasic : selectedEmployee.salaryStructure.fixedBasic) * 0.12)).toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <span className="text-sm text-gray-500">HRA</span>
                                                {isEditing ? (
                                                    <input type="number" value={editFormData?.salaryStructure?.hra} onChange={e => handleSalaryChange('hra', e.target.value)} className="w-full rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-1" />
                                                ) : (
                                                    <p className="font-bold text-lg">₹{selectedEmployee.salaryStructure.hra?.toLocaleString()}</p>
                                                )}
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <span className="text-sm text-gray-500">Other Allowances</span>
                                                {isEditing ? (
                                                    <input type="number" value={editFormData?.salaryStructure?.otherAllowances} onChange={e => handleSalaryChange('otherAllowances', e.target.value)} className="w-full rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-1" />
                                                ) : (
                                                    <p className="font-bold text-lg">₹{selectedEmployee.salaryStructure.otherAllowances?.toLocaleString()}</p>
                                                )}
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <span className="text-sm text-gray-500">PT (Deduction)</span>
                                                {isEditing ? (
                                                    <input type="number" value={editFormData?.salaryStructure?.pt} onChange={e => handleSalaryChange('pt', e.target.value)} className="w-full rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-1" />
                                                ) : (
                                                    <p className="font-bold text-lg text-red-500">-₹{selectedEmployee.salaryStructure.pt}</p>
                                                )}
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <span className="text-sm text-gray-500">Medical (Deduction)</span>
                                                {isEditing ? (
                                                    <input type="number" value={editFormData?.salaryStructure?.medical} onChange={e => handleSalaryChange('medical', e.target.value)} className="w-full rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-1" />
                                                ) : (
                                                    <p className="font-bold text-lg text-red-500">-₹{selectedEmployee.salaryStructure.medical}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">Select an employee to view details</div>
                    )}
                </div>
            </div>
        </div>
    );
}
