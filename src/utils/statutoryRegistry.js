export const STATUTORY_RULES = {
    pf: {
        employeeContribution: 0.12,
        employerContribution: 0.12,
        employerPension: 0.0833,
        employerEPFBalance: 0.0367,
        edli: 0.005,
        adminCharges: 0.005,
        adminMin: 500, // Conceptually, but we use per-employee calc currently
    },
    esic: {
        employer: 0.0325,
        employee: 0.0075,
        wageLimit: 21000
    },
    pt: {
        // Simplified Logic: In production this would be State-wise table
        defaultDeduction: 200,
        standardLimit: 10000
    },
    slabs: {
        basic: [
            { limit: 35000, value: 10000 },
            { limit: 50000, value: 12500 },
            { limit: Infinity, value: 15000 }
        ]
    }
};

export const getFixedBasicFromCTC = (ctc) => {
    if (ctc > 50000) return 15000;
    if (ctc > 35000) return 12500;
    return 10000;
};
