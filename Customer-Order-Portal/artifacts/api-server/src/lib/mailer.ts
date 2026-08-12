/**
 * Mailer Mock — logs all emails to email_log table instead of actually sending.
 */
import { db } from "@workspace/db";
import { emailLogTable } from "@workspace/db/schema";

async function send(opts: {
  to: string; cc?: string; subject: string; body: string; category: string;
}): Promise<void> {
  await db.insert(emailLogTable).values({
    toAddress: opts.to,
    ccAddress: opts.cc,
    subject: opts.subject,
    bodyText: opts.body,
    category: opts.category,
  });
}

export async function sendOrderConfirmation(opts: {
  to: string; firstName: string; orderNumber: string; totalCents: number;
  shopifyOrderNumber: string; locationNickname: string; poNumber: string;
}): Promise<void> {
  const total = (opts.totalCents / 100).toFixed(2);
  await send({
    to: opts.to,
    subject: `Order Confirmation — ${opts.orderNumber}`,
    body: `Hi ${opts.firstName},\n\nYour order ${opts.orderNumber} (Shopify: ${opts.shopifyOrderNumber}) has been received.\n\nShip To: ${opts.locationNickname}\nPO Number: ${opts.poNumber}\nTotal: $${total}\n\nThank you for ordering from Smart On X!`,
    category: "order_confirmation",
  });
}

export async function sendTempPassword(opts: {
  to: string; firstName: string; username: string; tempPassword: string;
}): Promise<void> {
  await send({
    to: opts.to,
    subject: "Your Smart On X Portal Access",
    body: `Hi ${opts.firstName},\n\nYour Smart On X portal account has been created.\n\nUsername: ${opts.username}\nTemporary Password: ${opts.tempPassword}\n\nPlease log in at your earliest convenience and change your password.\n\nLogin: https://portal.smartonx.com/login`,
    category: "account_created",
  });
}

export async function sendForgotUsername(opts: {
  to: string; firstName: string; username: string;
}): Promise<void> {
  await send({
    to: opts.to,
    subject: "Your Smart On X Username",
    body: `Hi ${opts.firstName},\n\nYour Smart On X portal username is: ${opts.username}\n\nLogin: https://portal.smartonx.com/login`,
    category: "forgot_username",
  });
}

export async function sendPasswordReset(opts: {
  to: string; firstName: string; token: string;
}): Promise<void> {
  await send({
    to: opts.to,
    subject: "Reset Your Smart On X Password",
    body: `Hi ${opts.firstName},\n\nClick the link below to reset your password (expires in 1 hour):\nhttps://portal.smartonx.com/reset-password?token=${opts.token}\n\nIf you did not request this, ignore this email.`,
    category: "password_reset",
  });
}

export async function sendLocationRequestNotification(opts: {
  to: string; orgName: string; locationNickname: string; requestedBy: string;
}): Promise<void> {
  await send({
    to: opts.to,
    subject: `New Location Request — ${opts.orgName}`,
    body: `A new location request has been submitted.\n\nOrg: ${opts.orgName}\nLocation: ${opts.locationNickname}\nRequested by: ${opts.requestedBy}\n\nReview in the admin console.`,
    category: "location_request",
  });
}

export async function sendLocationRequestResult(opts: {
  to: string; firstName: string; locationNickname: string;
  approved: boolean; reason?: string;
}): Promise<void> {
  const status = opts.approved ? "approved" : "rejected";
  await send({
    to: opts.to,
    subject: `Location Request ${opts.approved ? "Approved" : "Rejected"} — ${opts.locationNickname}`,
    body: `Hi ${opts.firstName},\n\nYour location request for "${opts.locationNickname}" has been ${status}.${!opts.approved && opts.reason ? `\n\nReason: ${opts.reason}` : ""}\n\nIf you have questions, please contact your Smart On X representative.`,
    category: "location_request_result",
  });
}
