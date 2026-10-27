import nodemailer from 'nodemailer';

// Both admin updates and checkout confirmations use the same SMTP configuration.
async function sendEmail({ email, subject, text }) {
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
    });
    return { state: result.accepted?.length ? 'accepted' : 'failed' };
  } catch {
    return { state: 'failed' };
  } finally {
    transport.close();
  }
}

export function sendOrderStatusEmail({ email, orderId, status }) {
  return sendEmail({
    email,
    subject: `FoodHub: Order #${orderId} is ${status}`,
    text: `Your FoodHub order #${orderId} is now ${status}.\n\nThank you for ordering with FoodHub.`,
  });
}

export function sendOrderConfirmationEmail(order) {
  const money = (amount) => `$${Number(amount).toFixed(2)}`;
  const payment = { cash: 'Cash on delivery', card: 'Card on delivery', paynow: 'PayNow' };
  const lines = order.items.map(
    (item) =>
      `${item.quantity} × ${item.name} @ ${money(item.unitPrice)} = ${money(item.quantity * item.unitPrice)}`,
  );
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
      `Payment: ${payment[order.payment]}`,
      `Delivery address: ${order.address}`,
      `Contact phone: ${order.phone}`,
      ...(order.notes ? [`Kitchen notes: ${order.notes}`] : []),
      '',
      'Log in to FoodHub to track your order.',
      'Thank you for ordering with us.',
    ].join('\n'),
  });
}
