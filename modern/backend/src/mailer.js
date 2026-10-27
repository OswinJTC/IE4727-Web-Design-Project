import nodemailer from 'nodemailer';

// Both admin updates and checkout confirmations use the same SMTP configuration.
async function sendEmail({ email, subject, text, html }) {
  const { SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SMTP_PORT = '587' } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) return { state: 'unconfigured' };
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_PORT === '465',
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  try {
    const result = await transport.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: email,
      subject,
      text,
      html,
    });
    return { state: result.accepted?.length ? 'accepted' : 'failed' };
  } catch {
    return { state: 'failed' };
  } finally {
    transport.close();
  }
}

const escapeHtml = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character],
  );
const money = (amount) => `$${Number(amount).toFixed(2)}`;
const paymentLabels = { cash: 'Cash on delivery', card: 'Card on delivery', paynow: 'PayNow' };
const statusContent = {
  Pending: {
    title: 'Order received.',
    description: 'Your order is confirmed and waiting to be prepared.',
    background: '#fff2df',
    color: '#a34e06',
  },
  Preparing: {
    title: 'Your order is being prepared.',
    description: 'Our kitchen is preparing your meal. We’ll keep you updated on its progress.',
    background: '#e8eeff',
    color: '#234fce',
  },
  'Out for delivery': {
    title: 'Your order is out for delivery.',
    description:
      'Your order is out for delivery. Please keep your phone nearby so the delivery team can reach you.',
    background: '#f1e8ff',
    color: '#7428d5',
  },
  Delivered: {
    title: 'Your order has been delivered.',
    description: 'Your order has been marked as delivered. Thank you for choosing FoodHub.',
    background: '#e6f4e9',
    color: '#198246',
  },
  Cancelled: {
    title: 'Your order has been cancelled.',
    description: 'You can review the details of this cancelled order in My orders.',
    background: '#eeece9',
    color: '#625b55',
  },
};

// Inline styles and presentation tables keep the layout usable in email clients without CSS layout support.
function emailLayout({
  orderId,
  status,
  title,
  description,
  content = '',
  label = 'ORDER STATUS UPDATE',
  total = null,
}) {
  const appearance = statusContent[status];
  const stages = ['Pending', 'Preparing', 'Out for delivery', 'Delivered'];
  const labels = ['Received', 'Preparing', 'Delivery', 'Delivered'];
  const progress =
    status === 'Cancelled'
      ? ''
      : `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:14px;table-layout:fixed"><tr>${stages.map((stage, index) => `<td width="25%" valign="top" style="padding-right:${index === 3 ? 0 : 6}px"><div style="height:4px;background:${index <= stages.indexOf(status) ? '#c2410c' : '#e7e3df'};border-radius:4px;font-size:1px;line-height:4px">&nbsp;</div><p style="margin:8px 0 0;font-size:11px;line-height:1.5;font-weight:${index === stages.indexOf(status) ? 700 : 400};color:${index === stages.indexOf(status) ? appearance.color : '#78716c'}"><span style="display:block;margin-bottom:3px;font-size:10px;line-height:1.4">STEP ${index + 1}</span>${labels[index]}</p></td>`).join('')}</tr></table>`;
  const summary = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf9f7;border:1px solid #e7e3df;border-radius:12px"><tr>
<td width="50%" valign="top" style="padding:18px"><p style="margin:0 0 8px;font-size:10px;letter-spacing:1px;white-space:nowrap;color:#78716c">ORDER NUMBER</p><p style="margin:0;font-size:24px;font-weight:700">#${escapeHtml(orderId)}</p></td>
<td width="50%" align="right" valign="top" style="padding:18px"><p style="margin:0 0 8px;font-size:10px;letter-spacing:1px;white-space:nowrap;color:#78716c">${total === null ? 'CURRENT STATUS' : 'ORDER TOTAL'}</p>${total === null ? `<span style="display:inline-block;padding:7px 11px;border-radius:20px;background:${appearance.background};color:${appearance.color};font-size:12px;line-height:1.5;font-weight:700">${escapeHtml(status)}</span>` : `<p style="margin:0;font-size:28px;line-height:1.1;font-weight:700;color:#c2410c">${money(total)}</p>`}</td>
</tr>${total === null ? '' : `<tr><td colspan="2" style="padding:12px 18px;border-top:1px solid #e7e3df;font-size:12px;line-height:1.6;color:#6d6560"><strong style="color:#a34e06">Pending</strong> &middot; Waiting for preparation</td></tr>`}</table>`;
  const tracking = progress
    ? `<p style="margin:24px 0 0;font-size:10px;font-weight:700;letter-spacing:1px;color:#78716c">ORDER PROGRESS</p>${progress}`
    : '';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>FoodHub · Order #${escapeHtml(orderId)}</title>
<style>@media only screen and (max-width:480px){.email-padding{padding:24px 20px!important}.email-title{font-size:28px!important}.email-outer{padding:16px 8px!important}}</style></head>
<body style="margin:0;padding:0;background:#f6f5f3;color:#1c1917;font-family:Arial,Helvetica,sans-serif">
<div style="display:none;font-size:1px;color:#f6f5f3;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">${escapeHtml(description)} Order #${escapeHtml(orderId)}.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f5f3"><tr><td align="center" class="email-outer" style="padding:36px 12px">
<!--[if mso]><table role="presentation" width="600" align="center"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e7e3df;border-radius:16px;overflow:hidden">
<tr><td style="height:5px;background:#c2410c;font-size:1px;line-height:5px">&nbsp;</td></tr>
<tr><td class="email-padding" style="padding:32px">
<p style="margin:0 0 24px;font-size:24px;font-weight:700;letter-spacing:-1px"><span style="color:#c2410c">●</span> FoodHub</p>
<p style="margin:0;color:#c2410c;font-size:11px;font-weight:700;letter-spacing:1.5px">${escapeHtml(label)}</p>
<h1 class="email-title" style="margin:12px 0 14px;font-size:32px;line-height:1.2;letter-spacing:-1px;font-weight:700">${escapeHtml(title)}</h1>
<p style="margin:0 0 24px;color:#6d6560;font-size:15px;line-height:1.7">${escapeHtml(description)}</p>
${summary}${tracking}${content}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:28px"><tr><td style="padding:18px;background:#fff4ee;border-radius:10px"><p style="margin:0;font-size:13px;line-height:1.7;color:#7c3a1e">View your order in <strong>My orders</strong> when you log in to FoodHub.</p></td></tr></table>
</td></tr>
<tr><td class="email-padding" style="padding:22px 32px;background:#faf9f7;border-top:1px solid #e7e3df"><p style="margin:0 0 6px;font-size:13px;font-weight:700">Thanks for choosing FoodHub.</p><p style="margin:0;color:#78716c;font-size:11px;line-height:1.7">This is an automatic update about your order. Keep this email for your records.</p></td></tr>
</table><!--[if mso]></td></tr></table><![endif]-->
<p style="margin:20px 0 0;color:#a8a29e;font-size:11px">FoodHub · Freshly cooked, thoughtfully delivered.</p>
</td></tr></table></body></html>`;
}

export function sendOrderStatusEmail({ email, orderId, status }) {
  return sendEmail({
    email,
    subject: `FoodHub: Order #${orderId} is ${status}`,
    text: `Your FoodHub order #${orderId} is now ${status}.\n\nThank you for ordering with FoodHub.`,
    html: emailLayout({ orderId, status, ...statusContent[status] }),
  });
}

export function sendOrderConfirmationEmail(order) {
  const lines = order.items.map(
    (item) =>
      `${item.quantity} × ${item.name} @ ${money(item.unitPrice)} = ${money(item.quantity * item.unitPrice)}`,
  );
  const rows = order.items
    .map(
      (item) =>
        `<tr><td style="padding:16px 12px 16px 0;border-bottom:1px solid #eeeae6;overflow-wrap:anywhere"><p style="margin:0 0 5px;font-size:14px;line-height:1.5;font-weight:700">${escapeHtml(item.name)}</p><p style="margin:0;font-size:12px;color:#78716c">${money(item.unitPrice)} each</p></td><td align="center" style="padding:16px 8px;border-bottom:1px solid #eeeae6;font-size:13px">${escapeHtml(item.quantity)}</td><td align="right" style="padding:16px 0;border-bottom:1px solid #eeeae6;font-size:14px;white-space:nowrap">${money(item.quantity * item.unitPrice)}</td></tr>`,
    )
    .join('');
  const content = `<h2 style="margin:28px 0 14px;font-size:16px;font-weight:700">Your order</h2>
<table aria-label="Order items" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse"><thead><tr style="color:#78716c;font-size:10px;letter-spacing:1px;text-align:left"><th scope="col" style="padding:10px 0;border-bottom:1px solid #e7e3df">ITEM</th><th scope="col" width="40" style="padding:10px 8px;border-bottom:1px solid #e7e3df;text-align:center">QTY</th><th scope="col" width="90" style="padding:10px 0;border-bottom:1px solid #e7e3df;text-align:right">AMOUNT</th></tr></thead><tbody>${rows}</tbody></table>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:20px 0;font-size:15px;font-weight:700">Total</td><td align="right" style="padding:20px 0;font-size:26px;font-weight:700;color:#c2410c">${money(order.total)}</td></tr></table>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf9f7;border:1px solid #e7e3df;border-radius:10px"><tr><td style="padding:20px;overflow-wrap:anywhere"><p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:1px;color:#78716c">DELIVERY DETAILS</p><p style="margin:0;font-size:14px;line-height:1.7"><strong>${escapeHtml(order.name)}</strong><br>${escapeHtml(order.address).replace(/\r?\n/g, '<br>')}<br>${escapeHtml(order.phone)}</p><p style="margin:18px 0 6px;font-size:10px;font-weight:700;letter-spacing:1px;color:#78716c">PAYMENT</p><p style="margin:0;font-size:14px;line-height:1.7">${escapeHtml(paymentLabels[order.payment])}</p>${order.notes ? `<p style="margin:18px 0 6px;font-size:10px;font-weight:700;letter-spacing:1px;color:#78716c">KITCHEN NOTES</p><p style="margin:0;font-size:14px;line-height:1.7">${escapeHtml(order.notes).replace(/\r?\n/g, '<br>')}</p>` : ''}</td></tr></table>`;
  return sendEmail({
    email: order.email,
    subject: `FoodHub: Order #${order.orderId} confirmed`,
    text: [
      `Hi ${order.name},`,
      '',
      `Thank you! Your FoodHub order #${order.orderId} has been placed.`,
      'Status: Pending',
      '',
      ...lines,
      `Total: ${money(order.total)}`,
      '',
      `Payment: ${paymentLabels[order.payment]}`,
      `Delivery address: ${order.address}`,
      `Contact phone: ${order.phone}`,
      ...(order.notes ? [`Kitchen notes: ${order.notes}`] : []),
      '',
      'Log in to FoodHub to track your order.',
      'Thank you for ordering with us.',
    ].join('\n'),
    html: emailLayout({
      orderId: order.orderId,
      status: 'Pending',
      label: 'ORDER CONFIRMATION',
      title: 'Order placed successfully.',
      description: `Hi ${order.name}, we’ve received your order. We’ll let you know when preparation starts.`,
      total: order.total,
      content,
    }),
  });
}
