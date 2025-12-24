import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, BusinessDetails } from '../types';

export const generatePDF = (doc: Document, business: BusinessDetails, viewMode: boolean = false) => {
  const pdf = new jsPDF();
  const margin = 20;
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  
  // Color Palette
  const accentColor: [number, number, number] = [37, 99, 235]; // blue-600
  const lightBlue: [number, number, number] = [191, 219, 254]; // blue-200 (Light Blue)
  const deepBlue: [number, number, number] = [30, 58, 138];   // blue-900
  const secondaryColor: [number, number, number] = [15, 23, 42]; // Slate-900
  const lightGray: [number, number, number] = [100, 116, 139]; // Slate-500

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('-').reverse().join('-');
  };

  // 1. Top Decorative Bar
  pdf.setFillColor(...accentColor);
  pdf.rect(0, 0, pageWidth, 2, 'F');

  let currentY = margin;

  // 2. Logo (Top Left)
  if (business.logoUrl) {
    try {
      const imgProps = pdf.getImageProperties(business.logoUrl);
      const maxWidth = 45;
      const maxHeight = 20;
      
      const widthRatio = maxWidth / imgProps.width;
      const heightRatio = maxHeight / imgProps.height;
      const ratio = Math.min(widthRatio, heightRatio);
      
      const finalWidth = imgProps.width * ratio;
      const finalHeight = imgProps.height * ratio;

      pdf.addImage(business.logoUrl, 'PNG', margin, currentY, finalWidth, finalHeight, undefined, 'FAST');
      currentY += finalHeight + 5; 
    } catch (e) {
      console.error("Failed to add logo to PDF", e);
      currentY += 10;
    }
  } else {
    currentY += 10;
  }

  // 3. Header Section - Metadata (Right)
  const rightAlignX = pageWidth - margin;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(...accentColor);
  const metaY = Math.max(margin, currentY - 20); 
  pdf.text(doc.type.toUpperCase(), rightAlignX, metaY + 5, { align: 'right' });
  
  pdf.setFontSize(10);
  pdf.setTextColor(...secondaryColor);
  pdf.text(`NO: ${doc.number}`, rightAlignX, metaY + 12, { align: 'right' });
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...lightGray);
  pdf.text(`Issue Date: ${formatDateDisplay(doc.date)}`, rightAlignX, metaY + 18, { align: 'right' });
  pdf.text(`Due Date: ${formatDateDisplay(doc.dueDate)}`, rightAlignX, metaY + 23, { align: 'right' });

  // 4. Header Section - Business Info (Left)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(...secondaryColor);
  pdf.text(business.name.toUpperCase(), margin, currentY + 5);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...lightGray);
  
  const addressLines = pdf.splitTextToSize(business.address, 75);
  pdf.text(addressLines, margin, currentY + 12);
  
  const addressHeight = addressLines.length * 5;
  const contactY = currentY + 12 + addressHeight;
  
  pdf.text(`Email: ${business.email}`, margin, contactY);
  pdf.text(`Phone: ${business.phone}`, margin, contactY + 5);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...secondaryColor);
  pdf.text(`TIN: ${business.tinNumber}`, margin, contactY + 10);

  const headerEndRight = metaY + 30;
  const headerEndLeft = contactY + 10;
  currentY = Math.max(headerEndRight, headerEndLeft) + 10;

  pdf.setDrawColor(241, 245, 249); 
  pdf.line(margin, currentY, pageWidth - margin, currentY);

  // 6. Bill To Section
  currentY += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...secondaryColor);
  pdf.text('BILL TO', margin, currentY);
  
  pdf.setFontSize(12);
  pdf.text(doc.clientName, margin, currentY + 7);
  
  if (doc.clientEmail) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...lightGray);
    pdf.text(doc.clientEmail, margin, currentY + 13);
  }

  // 7. Main Table
  const tableHeaders = [['DESCRIPTION', 'QTY', 'UNIT PRICE', 'TOTAL']];
  const tableData = doc.items.map(item => [
    item.description,
    item.quantity.toString(),
    `${business.currency} ${item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    `${business.currency} ${(item.quantity * item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
  ]);

  const subtotal = doc.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const taxAmount = (subtotal * business.taxPercentage) / 100;
  const total = subtotal + taxAmount;

  autoTable(pdf, {
    startY: currentY + 25,
    head: tableHeaders,
    body: tableData,
    theme: 'plain',
    headStyles: { 
      fillColor: [248, 250, 252],
      textColor: secondaryColor,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 4,
    },
    bodyStyles: { 
      fontSize: 9,
      textColor: secondaryColor,
      cellPadding: 4
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 45 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 45 }
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      if (data.section === 'head') {
        const colIndex = data.column.index;
        if (colIndex === 1) data.cell.styles.halign = 'center';
        if (colIndex === 2 || colIndex === 3) data.cell.styles.halign = 'right';
      }
    },
    didDrawCell: (data) => {
        if (data.section === 'body') {
            pdf.setDrawColor(241, 245, 249);
            pdf.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
    }
  });

  // 8. Summary Block
  const summaryY = ((pdf as any).lastAutoTable?.finalY || 150) + 15;
  const summaryX = pageWidth - margin;
  const labelX = pageWidth - margin - 90; 
  
  if (doc.status === 'Paid') {
    pdf.saveGraphicsState();
    const GState = (pdf as any).GState;
    if (GState) {
        pdf.setGState(new GState({ opacity: 0.12 })); 
    }
    pdf.setFontSize(65);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(16, 185, 129); 
    pdf.text('PAID', pageWidth * 0.7, summaryY + 15, { angle: 12, align: 'center' });
    pdf.restoreGraphicsState();
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...lightGray);
  
  pdf.text('Subtotal:', labelX, summaryY);
  pdf.text(`${business.currency} ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, summaryX, summaryY, { align: 'right' });

  pdf.text(`Tax (${business.taxPercentage}%):`, labelX, summaryY + 8);
  pdf.text(`${business.currency} ${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, summaryX, summaryY + 8, { align: 'right' });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...secondaryColor);
  pdf.text('TOTAL AMOUNT:', labelX, summaryY + 22);
  
  pdf.setFontSize(16);
  pdf.setTextColor(...accentColor);
  pdf.text(`${business.currency} ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, summaryX, summaryY + 22, { align: 'right' });

  let footerContentY = summaryY + 45;

  if (doc.notes) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...secondaryColor);
    pdf.text('NOTES & TERMS', margin, footerContentY);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...lightGray);
    const splitNotes = pdf.splitTextToSize(doc.notes, pageWidth - (2 * margin));
    pdf.text(splitNotes, margin, footerContentY + 5);
    footerContentY += (splitNotes.length * 4) + 12;
  }

  if (business.paymentDetails) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...secondaryColor);
    pdf.text('PAYMENT DETAILS', margin, footerContentY);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...lightGray);
    const splitPayment = pdf.splitTextToSize(business.paymentDetails, pageWidth - (2 * margin));
    pdf.text(splitPayment, margin, footerContentY + 5);
  }

  // 9. MODERN WAVE PATTERN FOOTER (FIXED)
  pdf.saveGraphicsState();
  const GState = (pdf as any).GState;
  
  // Set transparency to 25% for primary wave
  if (GState) {
    pdf.setGState(new GState({ opacity: 0.25 }));
  }
  
  pdf.setFillColor(...lightBlue);
  
  // Primary Wave
  pdf.lines(
    [
      [0, -15],
      [pageWidth * 0.25, -20, pageWidth * 0.75, 10, pageWidth, -10],
      [0, 25]
    ],
    0, pageHeight,
    [1, 1],
    'F',
    true
  );

  // Secondary overlapping wave for depth (15% opacity)
  if (GState) {
    pdf.setGState(new GState({ opacity: 0.15 }));
  }
  pdf.setFillColor(...accentColor);
  
  pdf.lines(
    [
      [0, -25],
      [pageWidth * 0.35, 20, pageWidth * 0.65, -15, pageWidth, 15],
      [0, 10]
    ],
    0, pageHeight,
    [1, 1],
    'F',
    true
  );

  pdf.restoreGraphicsState();

  // Footer Branding & Info
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(...secondaryColor);
  pdf.text(business.name.toUpperCase(), margin, pageHeight - 12);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(...lightGray);
  pdf.text(`TIN: ${business.tinNumber}  |  ${business.email}`, margin, pageHeight - 8);

  // Page Numbering
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(...deepBlue);
  const totalPages = (pdf as any).internal.getNumberOfPages();
  pdf.text(`Page 1 of ${totalPages}`, pageWidth - margin, pageHeight - 12, { align: 'right' });
  
  // Final Action
  if (viewMode) {
    const blobURL = pdf.output('bloburl');
    window.open(blobURL as any, '_blank');
  } else {
    pdf.save(`${doc.type}_${doc.number}.pdf`);
  }
};