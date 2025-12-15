import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { STATUTORY_RULES } from '../utils/statutoryRegistry';

/**
 * Generate a standard Indian Salary Slip PDF
 */
export const generateSalarySlipPDF = (payroll, employee) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    const COMPANY_NAME = "PayCorp Pvt Ltd"; // TODO: From Config
    const COMPANY_ADDR = "123, Business Park, Tech City, Bangalore - 560103";

    // --- Styling Constants ---
    const primaryColor = [41, 128, 185]; // Blue
    const lightGray = [240, 240, 240];
    const textColor = 50;

    // --- Helper: Currency Formatter ---
    const formatCurrency = (val) => `Rs. ${parseFloat(val || 0).toLocaleString('en-IN')}`;

    // --- Header ---
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(COMPANY_NAME.toUpperCase(), pageWidth / 2, 20, { align: 'center' });

    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(COMPANY_ADDR, pageWidth / 2, 27, { align: 'center' });

    doc.setDrawColor(200);
    doc.line(15, 32, pageWidth - 15, 32);

    // --- Title ---
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Salary Slip for ${payroll.month}/${payroll.year}`, pageWidth / 2, 42, { align: 'center' });

    // --- Employee Details ---
    const empData = [
        ['Employee Name', employee.name, 'Date of Joining', '01-Jan-2023'],
        ['Employee ID', employee.id, 'Department', employee.department],
        ['Designation', employee.role, 'Bank Account', employee.bankDetails?.accountNumber || 'N/A'],
        ['PAN', 'ABCDE1234F', 'PF Number', 'MH/BAN/00000/000'],
    ];

    doc.autoTable({
        startY: 50,
        body: empData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1.5 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 35 },
            1: { cellWidth: 60 },
            2: { fontStyle: 'bold', cellWidth: 35 },
            3: { cellWidth: 40 }
        },
        margin: { left: 15 }
    });

    // --- Attendance Summary ---
    const attY = doc.lastAutoTable.finalY + 5;
    const paidDays = payroll.details?.paidDays || 30;
    const lopDays = payroll.details?.leavesTaken || 0;
    const otHours = payroll.details?.otHours || 0;

    doc.setFillColor(245, 245, 245);
    doc.rect(15, attY, pageWidth - 30, 14, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text("Attendance Details", 20, attY + 6);

    doc.setFont('helvetica', 'normal');
    doc.text(`Total Days: ${payroll.details?.daysInMonth || 30}    |    Paid Days: ${paidDays}    |    LOP Days: ${lopDays}    |    OT Hours: ${otHours}`, 20, attY + 10);


    // --- Salary Table (Earnings | Deductions) ---

    // Prepare Data
    const earnings = [
        { label: 'Basic Pay', amount: payroll.details?.proratedBasic },
        { label: 'House Rent Allowance', amount: payroll.details?.proratedHRA },
        { label: 'Special Allowance', amount: payroll.details?.proratedAllowances },
        { label: 'Overtime Pay', amount: payroll.details?.otPay },
    ].filter(i => parseFloat(i.amount) > 0);

    const deductions = [
        { label: 'Provident Fund', amount: payroll.details?.employeeEPF },
        { label: 'Professional Tax', amount: payroll.details?.pt },
        { label: 'Income Tax (TDS)', amount: 0 },
        { label: 'Medical Insurance', amount: payroll.details?.medical },
        { label: 'LOP Deduction', amount: payroll.details?.lopAmount },
    ].filter(i => parseFloat(i.amount) > 0);

    // Normalize rows
    const maxRows = Math.max(earnings.length, deductions.length);
    const tableBody = [];

    for (let i = 0; i < maxRows; i++) {
        const e = earnings[i];
        const d = deductions[i];
        tableBody.push([
            e ? e.label : '',
            e ? formatCurrency(e.amount) : '',
            d ? d.label : '',
            d ? formatCurrency(d.amount) : ''
        ]);
    }

    // Totals Row
    tableBody.push([
        { content: 'Total Earnings', styles: { fontStyle: 'bold', fillColor: [240, 255, 240] } },
        { content: formatCurrency(payroll.gross), styles: { fontStyle: 'bold', fillColor: [240, 255, 240] } },
        { content: 'Total Deductions', styles: { fontStyle: 'bold', fillColor: [255, 240, 240] } },
        { content: formatCurrency(payroll.deductions), styles: { fontStyle: 'bold', fillColor: [255, 240, 240] } },
    ]);

    doc.autoTable({
        startY: attY + 20,
        head: [['Earnings', 'Amount', 'Deductions', 'Amount']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold', halign: 'center' },
        columnStyles: {
            0: { cellWidth: 55 },
            1: { cellWidth: 35, halign: 'right' },
            2: { cellWidth: 55 },
            3: { cellWidth: 35, halign: 'right' }
        },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 15, right: 15 }
    });


    // --- Net Pay & Footer ---
    const finalY = doc.lastAutoTable.finalY + 15;

    // Net Pay Box
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, finalY, pageWidth - 30, 20, 'F');

    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("Net Salary Payable", 20, finalY + 8);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(payroll.net), 20, finalY + 15);

    doc.setFontSize(10);
    doc.text("(In Words: " + amountToWords(payroll.net) + ")", pageWidth - 20, finalY + 13, { align: 'right' });


    // Disclaimer
    doc.setTextColor(150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text("This is a system generated payslip and does not require signature.", pageWidth / 2, 280, { align: 'center' });

    // Save
    doc.save(`Payslip_${employee.name}_${payroll.month}_${payroll.year}.pdf`);
};

// Simple Number to Words Converter (Stub)
const amountToWords = (num) => {
    // Basic implementation or placeholder
    return "Rupees ... Only";
};
