import PDFDocument from 'pdfkit';
import { Invoice, User } from '../types';

export function generateInvoicePDF(
  invoice: Invoice,
  user: User,
  stream: NodeJS.WritableStream
): void {
  const doc = new PDFDocument({ margin: 50 });

  doc.pipe(stream);

  // Header with company name
  doc
    .fontSize(20)
    .text('FAKTURA', 50, 50, { align: 'right' })
    .fontSize(10)
    .text(`Faktura Nr: ${invoice.invoiceNumber}`, { align: 'right' })
    .text(`Dato: ${new Date(invoice.createdAt).toLocaleDateString('da-DK')}`, {
      align: 'right',
    })
    .text(`Forfaldsdato: ${new Date(invoice.dueDate).toLocaleDateString('da-DK')}`, {
      align: 'right',
    })
    .moveDown();

  // From (your company)
  doc
    .fontSize(14)
    .text('Fra:', 50, 150)
    .fontSize(10)
    .text(user.companyName, 50, 170)
    .text(user.name, 50, 185)
    .text(`CVR: ${user.cvr}`, 50, 200)
    .text(user.email, 50, 215);

  // To (customer)
  doc
    .fontSize(14)
    .text('Til:', 300, 150)
    .fontSize(10)
    .text(invoice.customerName, 300, 170)
    .text(invoice.customerEmail, 300, 185);

  if (invoice.customerCVR) {
    doc.text(`CVR: ${invoice.customerCVR}`, 300, 200);
  }

  // Line items table
  const tableTop = 280;
  doc
    .fontSize(10)
    .text('Beskrivelse', 50, tableTop, { bold: true })
    .text('Antal', 300, tableTop, { bold: true, width: 60, align: 'right' })
    .text('Enhedspris', 360, tableTop, { bold: true, width: 80, align: 'right' })
    .text('Total', 450, tableTop, { bold: true, width: 90, align: 'right' });

  doc
    .moveTo(50, tableTop + 15)
    .lineTo(540, tableTop + 15)
    .stroke();

  let yPosition = tableTop + 25;

  invoice.items.forEach((item) => {
    doc
      .fontSize(9)
      .text(item.description, 50, yPosition)
      .text(item.quantity.toString(), 300, yPosition, { width: 60, align: 'right' })
      .text(`${item.unitPrice.toFixed(2)} ${invoice.currency}`, 360, yPosition, {
        width: 80,
        align: 'right',
      })
      .text(`${item.total.toFixed(2)} ${invoice.currency}`, 450, yPosition, {
        width: 90,
        align: 'right',
      });

    yPosition += 20;
  });

  // Totals
  yPosition += 10;

  doc
    .moveTo(350, yPosition)
    .lineTo(540, yPosition)
    .stroke();

  yPosition += 15;

  doc
    .fontSize(10)
    .text('Subtotal:', 350, yPosition)
    .text(`${invoice.subtotal.toFixed(2)} ${invoice.currency}`, 450, yPosition, {
      width: 90,
      align: 'right',
    });

  yPosition += 20;

  doc
    .text('Moms (25%):', 350, yPosition)
    .text(`${invoice.tax.toFixed(2)} ${invoice.currency}`, 450, yPosition, {
      width: 90,
      align: 'right',
    });

  yPosition += 20;

  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Total:', 350, yPosition)
    .text(`${invoice.total.toFixed(2)} ${invoice.currency}`, 450, yPosition, {
      width: 90,
      align: 'right',
    });

  // Payment info
  yPosition += 60;

  doc
    .font('Helvetica')
    .fontSize(10)
    .text('Betalingsinformation:', 50, yPosition)
    .fontSize(9)
    .text(`Betal venligst senest ${new Date(invoice.dueDate).toLocaleDateString('da-DK')}`, 50, yPosition + 20)
    .text('Overførsel til kontonummer: DK5000400440116243', 50, yPosition + 35)
    .text(`Reference: ${invoice.invoiceNumber}`, 50, yPosition + 50);

  // Footer
  doc
    .fontSize(8)
    .text(
      `${user.companyName} | CVR: ${user.cvr} | ${user.email}`,
      50,
      doc.page.height - 50,
      { align: 'center', width: doc.page.width - 100 }
    );

  doc.end();
}
