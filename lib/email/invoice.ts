import type { BrandTheme } from "@/lib/theme";

function formatCurrency(value: unknown) {
  const amount = Number(value || 0);
  return `KES ${amount.toLocaleString()}`;
}

function formatDate(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function escapePdfText(value: unknown) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function getDiscountAmount(booking: any) {
  const subtotal = Number(booking?.subtotal || 0);
  const calloutFee = Number(booking?.calloutFee || 0);
  const grandTotal = Number(booking?.grandTotal || 0);
  const discount = subtotal + calloutFee - grandTotal;
  return discount > 0 ? discount : 0;
}

function getPaidDepositAmount(booking: any) {
  const depositAmount = Number(booking?.depositAmount || 0);
  const status = String(booking?.status || "").toLowerCase();
  return status === "confirmed" && depositAmount > 0 ? depositAmount : 0;
}

function buildPdf(lines: string[]) {
  const header = "%PDF-1.4\n";
  const contentCommands = [
    "BT",
    "/F1 12 Tf",
    "50 790 Td",
    "16 TL",
    ...lines.map((line, index) =>
      index === 0 ? `(${escapePdfText(line)}) Tj` : `T* (${escapePdfText(line)}) Tj`
    ),
    "ET",
  ].join("\n");
  const stream = `${contentCommands}\n`;

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
    `5 0 obj << /Length ${Buffer.byteLength(stream, "utf8")} >> stream\n${stream}endstream endobj\n`,
  ];

  let body = "";
  const offsets = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(header + body, "utf8"));
    body += object;
  }

  const xrefOffset = Buffer.byteLength(header + body, "utf8");
  const xref =
    `xref\n0 ${objects.length + 1}\n` +
    "0000000000 65535 f \n" +
    offsets
      .slice(1)
      .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
      .join("");

  const trailer = `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(header + body + xref + trailer, "utf8");
}

export function buildInvoiceAttachment(data: {
  business: any;
  booking: any;
  theme: BrandTheme;
}) {
  const { business, booking } = data;
  const bookingKey = booking?.bookingKey || booking?._id?.toString?.() || "booking";
  const subtotal = Number(booking?.subtotal || 0);
  const calloutFee = Number(booking?.calloutFee || 0);
  const grandTotal = Number(booking?.grandTotal || 0);
  const discountAmount = getDiscountAmount(booking);
  const paidDeposit = getPaidDepositAmount(booking);
  const balanceDue = Math.max(0, grandTotal - paidDeposit);

  const lines = [
    `${business?.name || "Lodday Business"} Invoice`,
    `Invoice No: ${bookingKey}`,
    `Appointment Date: ${formatDate(booking?.date)}`,
    `Customer: ${booking?.customerName || "Customer"}`,
    `Phone: ${booking?.customerPhone || "-"}`,
    `Email: ${booking?.customerEmail || "-"}`,
    " ",
    "Services",
    ...(booking?.services || []).map((service: any, index: number) => {
      const title = service?.serviceName || service?.serviceId?.name || `Service ${index + 1}`;
      return `${index + 1}. ${title} - ${formatCurrency(service?.price || 0)}`;
    }),
    " ",
    `Subtotal: ${formatCurrency(subtotal)}`,
    ...(calloutFee > 0 ? [`Callout Fee: ${formatCurrency(calloutFee)}`] : []),
    ...(discountAmount > 0 ? [`Discount: -${formatCurrency(discountAmount)}`] : []),
    ...(paidDeposit > 0 ? [`Deposit Paid: -${formatCurrency(paidDeposit)}`] : []),
    `Balance Due After Service: ${formatCurrency(balanceDue)}`,
  ];

  return {
    filename: `invoice-${bookingKey}.pdf`,
    content: buildPdf(lines),
    contentType: "application/pdf",
  };
}
