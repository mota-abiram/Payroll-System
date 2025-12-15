import { STATUTORY_RULES } from "../utils/statutoryRegistry";

/**
 * Pure Math Engine for Salary Calculation
 * Can be used by the main runner (using attendance array) or the UI Editor (using manual overrides)
 */
/**
 * Pure Math Engine for Salary Calculation
 */
export const calculateSalaryStats = (employee, unpaidLeaves, paidLeaves, totalOtHours, daysInMonth, overrideBonus = 0) => {
    // STANDARD 30-DAY LOGIC
    // Regardless of whether the month has 28, 30, or 31 days, the base divisor is 30.
    const STANDARD_DAYS = 30;

    // REVISED STRATEGY: Receive 'payableDays' directly calculated by the caller.
    // DailyRate = Fixed / daysInMonth (Dynamic).
    // PaidDays = MAX(0, daysInMonth - UnpaidLeaves).

    let paidDays = Math.max(0, daysInMonth - unpaidLeaves);

    // Paid Leaves are tracked for records but don't dedcut salary.
    // So if I have 2 Unpaid Leaves and 2 Paid Leaves:
    // Salary Deducted for 2 days.
    // Paid Days = 28 (in 30 day month).

    const dailyRate = employee.salaryStructure.fixedBasic / daysInMonth;

    const { ctc, fixedBasic, pt, medical, hra, otherAllowances } = employee.salaryStructure;
    const fixedGross = fixedBasic + hra + otherAllowances;

    const dailyGrossRate = fixedGross / daysInMonth;
    const lopDeduction = Math.round(dailyGrossRate * unpaidLeaves);

    // Earnings = FixedGross - LOP + OT + Bonus
    // This strictly ensures that 0 leaves = Full Slaray.

    // Handle Partial Month (Passed implicitly via logic? No, we need strict flag).
    // For now, adhering to User Request "Same for 28/29/30/31" -> This "Deduction Method" works best.

    const grossEarnedBeforeOtBonus = Math.max(0, fixedGross - lopDeduction);

    // 2. OT Calculation
    // TODO: Move OT Rate to Employee Config
    const otRate = 100; // Hourly rate
    const otPay = Math.round(totalOtHours * otRate);

    // 3. Bonus / Incentive
    const bonus = parseFloat(overrideBonus) || 0;

    // 4. Gross Total
    const grossEarned = grossEarnedBeforeOtBonus + otPay + bonus;

    // 5. Statutory & Deductions

    // PF is usually 12% of Earned Basic.
    // We need 'Earned Basic' for statutory calc.
    // Ratio of earning.
    const earningRatio = fixedGross > 0 ? grossEarnedBeforeOtBonus / fixedGross : 0;

    const earnedBasic = Math.round(fixedBasic * earningRatio);
    const earnedHRA = Math.round(hra * earningRatio);
    const earnedAllowances = Math.round(otherAllowances * earningRatio);

    const employerEPF = Math.round(earnedBasic * STATUTORY_RULES.pf.employerContribution);
    const employeeEPF = Math.round(earnedBasic * STATUTORY_RULES.pf.employeeContribution);

    // ESIC
    const isEsicEligible = fixedGross <= STATUTORY_RULES.esic.wageLimit;
    const esicEmployee = isEsicEligible ? Math.ceil(grossEarned * STATUTORY_RULES.esic.employee) : 0;

    // PT (Placeholder)
    const applicablePT = grossEarned > 0 ? pt : 0;

    // Net
    const totalDeductions = employeeEPF + esicEmployee + applicablePT + medical;
    const netSalary = grossEarned - totalDeductions;

    // Employer Splits
    const employerPension = Math.round(earnedBasic * STATUTORY_RULES.pf.employerPension);
    const employerEPFBalance = Math.round(earnedBasic * STATUTORY_RULES.pf.employerEPFBalance);
    const edli = Math.round(earnedBasic * STATUTORY_RULES.pf.edli);
    const adminCharges = Math.round(earnedBasic * STATUTORY_RULES.pf.adminCharges);

    // Back-calculate "Paid Days" for display
    // If specific logic used:
    const effectivePaidDays = ((grossEarnedBeforeOtBonus / fixedGross) * STANDARD_DAYS) || 0;

    return {
        gross: grossEarned.toFixed(0),
        deductions: totalDeductions.toFixed(0),
        net: netSalary.toFixed(0),
        details: {
            daysInMonth, // Display only
            paidDays: effectivePaidDays.toFixed(1),
            leavesTaken: unpaidLeaves, // Backwards compat or UI usage
            unpaidLeaves,
            paidLeaves,

            fixedCTC: ctc,
            fixedBasic,
            hra,
            otherAllowances,

            earnedBasic: earnedBasic.toFixed(0),
            earnedHRA: earnedHRA.toFixed(0),
            earnedAllowances: earnedAllowances.toFixed(0),

            otHours: totalOtHours,
            otPay: otPay.toFixed(0),

            bonus: bonus.toFixed(0),

            grossSalary: grossEarned.toFixed(0),
            lopAmount: lopDeduction.toFixed(0),

            employeeEPF: employeeEPF.toFixed(0),
            esicEmployee: esicEmployee.toFixed(0),
            pt: applicablePT,
            medical,

            employerSplits: {
                pension: employerPension,
                epfBalance: employerEPFBalance,
                edli,
                admin: adminCharges
            }
        }
    };
};

/**
 * Core Payroll Calculation Engine
 */
export const calculateEmployeePayroll = (employee, employeeAttendance, daysInMonth, month, year) => {
    // 1. Attendance Processing
    const unpaidAbsents = employeeAttendance.filter(a => a.status === 'Absent').length;
    const paidLeaves = employeeAttendance.filter(a => a.status === 'Leave').length; // 'Leave' is Paid
    const halfDays = employeeAttendance.filter(a => a.status === 'Half Day').length;

    // Logic: Absent = 1 Unpaid. Half Day = 0.5 Unpaid. Leave = 1 Paid.
    const unpaidLeaves = unpaidAbsents + (halfDays * 0.5);

    // OT Calculation
    const totalOtHours = employeeAttendance.reduce((sum, a) => sum + (parseFloat(a.otHours) || 0), 0);

    // Proration Logic (Join Date)
    let effectiveUnpaidLeaves = unpaidLeaves;

    if (employee.joiningDate) {
        // Parse 'YYYY-MM-DD' strictly as local date to avoid UTC shifts
        const [jYear, jMonth, jDay] = employee.joiningDate.split('-').map(Number);
        const joinDate = new Date(jYear, jMonth - 1, jDay);

        const payrollMonthStart = new Date(Number(year), Number(month) - 1, 1);
        const payrollMonthEnd = new Date(Number(year), Number(month), 0);

        // If Joined AFTER Month Start
        if (joinDate > payrollMonthStart && joinDate <= payrollMonthEnd) {
            // Calculate days NOT employed in this month
            // Example: Month 1-30. Joined 25th.
            // Not employed: 1st to 24th = 24 days.
            // These count as "LOP" for the standard calculation.
            const daysNotEmployed = joinDate.getDate() - 1;
            effectiveUnpaidLeaves += daysNotEmployed;
        }
    }

    // 2. Delegate to Math Engine
    const calculated = calculateSalaryStats(employee, effectiveUnpaidLeaves, paidLeaves, totalOtHours, daysInMonth);

    return {
        id: `PAY-${employee.id}-${month}-${year}`,
        employeeId: employee.id,
        employeeName: employee.name,
        month,
        year,
        gross: calculated.gross,
        deductions: calculated.deductions,
        net: calculated.net,
        status: "Generated",
        generatedDate: new Date().toISOString().split('T')[0],
        details: calculated.details
    };
};
