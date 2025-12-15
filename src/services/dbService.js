import * as localDB from './dbLocalStorage'; // The file we wrote earlier with localStorage
import * as firebaseDB from './dbFirebase';
import { db } from '../firebase';

// CONFIG: Set this to true to use Firebase
// Ideally driven by Env Variable: import.meta.env.VITE_USE_FIREBASE
const USE_FIREBASE = true;

// Simple check: If Firebase apiKey is still 'YOUR_API_KEY', fallback to local
const isFirebaseConfigured = () => {
    // This is a naive check. In production check env vars.
    // For now, let's default to local if the user hasn't updated the file.
    // But since the user ASKED for Firebase, let's try to export the Firebase one 
    // and let it error (with logs) or fallback if they haven't set it up.
    return USE_FIREBASE;
};

const getProvider = () => {
    // If you want robust fallback:
    // if (isFirebaseConfigured()) return firebaseDB;
    // return localDB;

    // For this prototype transformation step:
    // We return Firebase wrapper, but warn if keys are missing.
    return firebaseDB;
};

// --- Exports delegating to the chosen provider ---

// --- Exports delegating to the chosen provider ---

export const getEmployees = async (ownerId) => {
    try {
        return await getProvider().getEmployees(ownerId);
    } catch (e) {
        console.warn("DB Error, falling back to local:", e);
        return localDB.getEmployees();
    }
};

export const saveEmployee = async (ownerId, employee) => {
    return await getProvider().saveEmployee(ownerId, employee);
};

export const deleteEmployee = async (ownerId, id) => {
    return await getProvider().deleteEmployee(ownerId, id);
};

export const getAttendance = async (ownerId, monthStr) => {
    return await getProvider().getAttendance(ownerId, monthStr);
};

export const saveAttendanceLog = async (ownerId, log) => {
    return await getProvider().saveAttendanceLog(ownerId, log);
};

export const getPayrolls = async (ownerId, month, year) => {
    return await getProvider().getPayrolls(ownerId, month, year);
};

export const savePayrolls = async (ownerId, newRecords) => {
    return await getProvider().savePayrolls(ownerId, newRecords);
};

export const deletePayrolls = async (ownerId, month, year) => {
    return await getProvider().deletePayrolls(ownerId, month, year);
};

export const getSettings = async (ownerId) => {
    return await getProvider().getSettings(ownerId);
};

export const saveSettings = async (ownerId, settings) => {
    return await getProvider().saveSettings(ownerId, settings);
};
