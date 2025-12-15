import { db } from '../firebase';
import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    doc,
    query,
    where,
    writeBatch,
    deleteDoc
} from 'firebase/firestore';

/**
 * Data Access Layer (DAL) - Firebase Firestore Implementation
 */

// Helper to sanitize undefined values (Firestore doesn't like them)
const sanitize = (obj) => JSON.parse(JSON.stringify(obj));

// --- Employees ---

export const getEmployees = async (ownerId) => {
    try {
        if (!db || !ownerId) return []; // Fallback if not configured
        const querySnapshot = await getDocs(collection(db, "admins", ownerId, "employees"));
        const employees = [];
        querySnapshot.forEach((doc) => {
            employees.push({ id: doc.id, ...doc.data() });
        });

        // If empty, return local check for fallback or empty array
        return employees.length > 0 ? employees : [];
    } catch (e) {
        console.error("Error getting employees: ", e);
        return [];
    }
};

export const saveEmployee = async (ownerId, employee) => {
    try {
        if (!ownerId) throw new Error("Owner ID missing");
        const docRef = doc(db, "admins", ownerId, "employees", employee.id);
        await setDoc(docRef, sanitize(employee));
        return employee;
    } catch (e) {
        console.error("Error saving employee: ", e);
        throw e;
    }
};

export const deleteEmployee = async (ownerId, id) => {
    try {
        if (!ownerId) throw new Error("Owner ID missing");
        await deleteDoc(doc(db, "admins", ownerId, "employees", id));
    } catch (e) {
        console.error("Error deleting employee: ", e);
        throw e;
    }
};

// --- Attendance ---

export const getAttendance = async (ownerId, monthStr) => {
    // monthStr format 'YYYY-MM'
    try {
        if (!ownerId) return [];
        // Optimized Query: Filter by date string prefix
        // Firestore simple query limitation: use string range or client filter
        // Here we fetch usage for the month.
        const q = query(
            collection(db, "admins", ownerId, "attendance"),
            where("date", ">=", `${monthStr}-01`),
            where("date", "<=", `${monthStr}-31`)
        );

        const querySnapshot = await getDocs(q);
        const attendance = [];
        querySnapshot.forEach((doc) => {
            attendance.push({ id: doc.id, ...doc.data() });
        });
        return attendance;
    } catch (e) {
        console.error("Error getting attendance: ", e);
        return [];
    }
};

export const saveAttendanceLog = async (ownerId, log) => {
    try {
        if (!ownerId) return;
        // Composite Key ID for uniqueness: EMPID_DATE
        const id = `${log.employeeId}_${log.date}`;
        await setDoc(doc(db, "admins", ownerId, "attendance", id), sanitize(log));
    } catch (e) {
        console.error("Error saving attendance: ", e);
    }
};

// --- Payroll ---

export const getPayrolls = async (ownerId, month, year) => {
    try {
        if (!ownerId) return [];
        const q = query(
            collection(db, "admins", ownerId, "payrolls"),
            where("month", "==", String(month)),
            where("year", "==", String(year))
        );

        const querySnapshot = await getDocs(q);
        const payrolls = [];
        querySnapshot.forEach((doc) => {
            payrolls.push({ id: doc.id, ...doc.data() });
        });
        return payrolls;
    } catch (e) {
        console.error("Error getting payrolls: ", e);
        return [];
    }
};

export const savePayrolls = async (ownerId, newRecords) => {
    try {
        if (!ownerId) return;
        const batch = writeBatch(db);

        newRecords.forEach(record => {
            const docRef = doc(db, "admins", ownerId, "payrolls", record.id);
            batch.set(docRef, sanitize(record));
        });

        await batch.commit();
        return newRecords;
    } catch (e) {
        console.error("Error saving batch payrolls: ", e);
        throw e;
    }
};

export const deletePayrolls = async (ownerId, month, year) => {
    try {
        if (!ownerId) return;
        const q = query(
            collection(db, "admins", ownerId, "payrolls"),
            where("month", "==", String(month)),
            where("year", "==", String(year))
        );
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);

        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
    } catch (e) {
        console.error("Error deleting payrolls: ", e);
        throw e;
    }
};

// --- Settings (Singleton) ---

export const getSettings = async (ownerId) => {
    try {
        if (!ownerId) return null;
        const docRef = doc(db, "admins", ownerId, "settings", "global");
        const sDoc = await getDoc(docRef);

        if (sDoc.exists()) {
            return sDoc.data();
        } else {
            return null; // Let caller handle defaults
        }
    } catch (e) {
        console.error("Error getting settings: ", e);
        return null; // Return null instead of empty object for consistency
    }
};

export const saveSettings = async (ownerId, settings) => {
    try {
        if (!ownerId) return;
        await setDoc(doc(db, "admins", ownerId, "settings", "global"), sanitize(settings));
        return settings;
    } catch (e) {
        console.error("Error saving settings: ", e);
        throw e;
    }
};
