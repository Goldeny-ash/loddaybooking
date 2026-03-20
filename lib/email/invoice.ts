import type { BrandTheme } from "@/lib/theme";

function formatCurrency(value: unknown) {
  const amount = Number(value || 0);
  return `KES ${amount.toLocaleString()}`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function renderServiceRows(services: any[]) {
  return (services || [])
    .map((service: any, index: number) => {
      const title = escapeHtml(
        service?.serviceName || service?.serviceId?.name || `Service ${index + 1}`
      );
      const price = Number(service?.price || 0);

      return `
        <tr>
          <td style="padding:12px 10px;border-bottom:1px solid rgba(15,23,42,0.08);color:#0f172a;">${String(
            index + 1
          ).padStart(2, "0")}</td>
          <td style="padding:12px 10px;border-bottom:1px solid rgba(15,23,42,0.08);color:#0f172a;font-weight:600;">${title}</td>
          <td style="padding:12px 10px;border-bottom:1px solid rgba(15,23,42,0.08);color:#475569;text-align:right;">${formatCurrency(
            price
          )}</td>
        </tr>
      `;
    })
    .join("");
}

export function buildInvoiceAttachment(data: {
  business: any;
  booking: any;
  theme: BrandTheme;
}) {
  const { business, booking, theme } = data;
  const bookingKey = booking?.bookingKey || booking?._id?.toString?.() || "booking";
  const subtotal = Number(booking?.subtotal || 0);
  const calloutFee = Number(booking?.calloutFee || 0);
  const grandTotal = Number(booking?.grandTotal || 0);
  const discountAmount = getDiscountAmount(booking);
  const paidDeposit = getPaidDepositAmount(booking);
  const balanceDue = Math.max(0, grandTotal - paidDeposit);

  const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Invoice ${escapeHtml(bookingKey)}</title>
  </head>
  <body style="margin:0;padding:32px;background:linear-gradient(135deg, ${theme.primaryLight} 0%, ${theme.accentLight} 100%);font-family:Arial, sans-serif;color:#0f172a;">
    <div style="max-width:860px;margin:0 auto;background:rgba(255,255,255,0.95);border-radius:28px;overflow:hidden;box-shadow:0 22px 60px rgba(15,23,42,0.18);">
      <div style="padding:32px 36px;background:linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%);color:#ffffff;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:14px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.9;">${escapeHtml(
                business?.name || "Lodday Business"
              )}</p>
              <h1 style="margin:0;font-size:54px;line-height:1;font-weight:800;">Invoice.</h1>
              <p style="margin:12px 0 0;font-size:16px;">No. ${escapeHtml(bookingKey)}</p>
            </td>
            <td style="text-align:right;vertical-align:top;">
              <div style="display:inline-block;padding:16px 18px;border-radius:22px;background:rgba(255,255,255,0.16);min-width:220px;text-align:left;">
                <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;opacity:0.85;">Invoice Date</p>
                <p style="margin:0 0 14px;font-size:20px;font-weight:700;">${escapeHtml(
                  formatDate(booking?.date) || formatDate(new Date().toISOString())
                )}</p>
                <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;opacity:0.85;">Amount Due After Service</p>
                <p style="margin:0;font-size:28px;font-weight:800;">${formatCurrency(balanceDue)}</p>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <div style="padding:32px 36px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
          <tr>
            <td style="width:50%;padding-right:12px;vertical-align:top;">
              <div style="padding:22px;border-radius:24px;background:#ffffff;border:1px solid rgba(15,23,42,0.08);box-shadow:0 14px 40px rgba(15,23,42,0.08);">
                <p style="margin:0 0 12px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;">Invoice To</p>
                <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:${theme.primary};">${escapeHtml(
                  booking?.customerName || "Customer"
                )}</p>
                <p style="margin:0 0 6px;">Phone: ${escapeHtml(booking?.customerPhone || "-")}</p>
                <p style="margin:0 0 6px;">Email: ${escapeHtml(booking?.customerEmail || "-")}</p>
                <p style="margin:0;">Appointment: ${escapeHtml(formatDate(booking?.date))} ${escapeHtml(
                  booking?.startTime || ""
                )}</p>
              </div>
            </td>
            <td style="width:50%;padding-left:12px;vertical-align:top;">
              <div style="padding:22px;border-radius:24px;background:${theme.backgroundSoft};border:1px solid rgba(15,23,42,0.08);">
                <p style="margin:0 0 12px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;">Payment Summary</p>
                <p style="margin:0 0 8px;">Business: <strong>${escapeHtml(business?.name || "-")}</strong></p>
                <p style="margin:0 0 8px;">Status: <strong>${escapeHtml(booking?.status || "confirmed")}</strong></p>
                <p style="margin:0;">Deposit counts toward the full service charge.</p>
              </div>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;border-radius:18px;overflow:hidden;">
          <thead>
            <tr style="background:${theme.primary};color:#ffffff;">
              <th align="left" style="padding:14px 10px;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">No.</th>
              <th align="left" style="padding:14px 10px;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">Service Description</th>
              <th align="right" style="padding:14px 10px;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${renderServiceRows(booking?.services || [])}
          </tbody>
        </table>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 0 auto;min-width:320px;">
          <tr>
            <td style="padding:8px 0;color:#475569;">Subtotal</td>
            <td style="padding:8px 0 8px 24px;text-align:right;font-weight:700;">${formatCurrency(subtotal)}</td>
          </tr>
          ${
            calloutFee > 0
              ? `<tr><td style="padding:8px 0;color:#475569;">Callout Fee</td><td style="padding:8px 0 8px 24px;text-align:right;font-weight:700;">${formatCurrency(
                  calloutFee
                )}</td></tr>`
              : ""
          }
          ${
            discountAmount > 0
              ? `<tr><td style="padding:8px 0;color:#475569;">Discount Applied</td><td style="padding:8px 0 8px 24px;text-align:right;font-weight:700;color:#0f766e;">- ${formatCurrency(
                  discountAmount
                )}</td></tr>`
              : ""
          }
          ${
            paidDeposit > 0
              ? `<tr><td style="padding:8px 0;color:#475569;">Deposit Paid</td><td style="padding:8px 0 8px 24px;text-align:right;font-weight:700;color:#0f766e;">- ${formatCurrency(
                  paidDeposit
                )}</td></tr>`
              : ""
          }
          <tr>
            <td style="padding:14px 0 0;color:#0f172a;font-size:18px;font-weight:800;">Balance Due After Service</td>
            <td style="padding:14px 0 0 24px;text-align:right;font-size:22px;font-weight:900;color:${theme.primary};">${formatCurrency(
              balanceDue
            )}</td>
          </tr>
        </table>

        <div style="margin-top:32px;padding:22px;border-radius:24px;background:linear-gradient(135deg, ${theme.primaryLight} 0%, ${theme.backgroundSoft} 100%);">
          <p style="margin:0 0 10px;font-size:16px;font-weight:800;color:${theme.accent};">Notes</p>
          <p style="margin:0 0 8px;line-height:1.7;">Prices are subject to change after the final in-person assessment or any approved add-on changes.</p>
          <p style="margin:0;line-height:1.7;">Any deposit paid is already included in the service charge and has been deducted from the balance shown above.</p>
        </div>
      </div>
    </div>
  </body>
</html>`;

  return {
    filename: `invoice-${bookingKey}.html`,
    content: Buffer.from(html, "utf-8"),
    contentType: "text/html; charset=utf-8",
  };
}
