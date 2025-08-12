const { Resend } = require('resend');

// Validate API key exists
if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Validates email address format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitizes HTML content to prevent XSS
 * @param {string} content - Content to sanitize
 * @returns {string} - Sanitized content
 */
const sanitizeHtml = (content) => {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

/**
 * Sends a welcome email to a new user.
 * @param {string} to - The recipient's email address.
 * @param {string} name - The recipient's name.
 * @throws {Error} - If email sending fails
 */
const sendWelcomeEmail = async (to, name) => {
  if (!to || !name) {
    throw new Error('Email address and name are required');
  }
  
  if (!isValidEmail(to)) {
    throw new Error('Invalid email address format');
  }

  const sanitizedName = sanitizeHtml(name);
  
  try {
    await resend.emails.send({
      from: 'hello@4minmail.org',
      to,
      subject: 'Welcome to Expense Tracker!',
      html: `<h1>Hi ${sanitizedName},</h1><p>Welcome to Expense Tracker. We're excited to have you on board!</p>`,
    });
    console.log(`Welcome email sent to ${to}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};

/**
 * Sends a password reset email.
 * @param {string} to - The recipient's email address.
 * @param {string} token - The password reset token.
 * @param {string} baseUrl - Base URL for the application
 * @throws {Error} - If email sending fails
 */
const sendPasswordResetEmail = async (to, token, baseUrl = process.env.BASE_URL || 'http://localhost:3000') => {
  if (!to || !token) {
    throw new Error('Email address and token are required');
  }
  
  if (!isValidEmail(to)) {
    throw new Error('Invalid email address format');
  }

  const resetUrl = `${baseUrl}/reset-password/${encodeURIComponent(token)}`;

  try {
    await resend.emails.send({
      from: 'security@your-verified-domain.com',
      to,
      subject: 'Your Password Reset Request',
      html: `<p>You requested a password reset. Click the link below to reset your password:</p>
             <a href="${resetUrl}">${resetUrl}</a>
             <p>If you did not request this, please ignore this email.</p>`,
    });
    console.log(`Password reset email sent to ${to}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

/**
 * Sends a budget alert email.
 * @param {string} to - The recipient's email address.
 * @param {object} budget - The budget details.
 * @throws {Error} - If email sending fails
 */
const sendBudgetAlertEmail = async (to, budget) => {
  if (!to || !budget) {
    throw new Error('Email address and budget data are required');
  }
  
  if (!isValidEmail(to)) {
    throw new Error('Invalid email address format');
  }

  if (!budget.name || budget.currentAmount === undefined || budget.limit === undefined) {
    throw new Error('Budget must have name, currentAmount, and limit properties');
  }

  const sanitizedBudgetName = sanitizeHtml(budget.name);
  const currentAmount = Number(budget.currentAmount);
  const limit = Number(budget.limit);

  if (isNaN(currentAmount) || isNaN(limit)) {
    throw new Error('Budget amounts must be valid numbers');
  }

  try {
    await resend.emails.send({
      from: 'alerts@your-verified-domain.com',
      to,
      subject: `Budget Alert: ${sanitizedBudgetName}`,
      html: `<p>You are close to reaching your budget for <strong>${sanitizedBudgetName}</strong>.</p>
             <p>Current Amount: $${currentAmount.toFixed(2)}</p>
             <p>Budget Limit: $${limit.toFixed(2)}</p>`,
    });
    console.log(`Budget alert sent to ${to}`);
  } catch (error) {
    console.error('Error sending budget alert email:', error);
    throw new Error(`Failed to send budget alert email: ${error.message}`);
  }
};

/**
 * Sends a monthly expense report email.
 * @param {string} to - The recipient's email address.
 * @param {object} report - The report data.
 * @throws {Error} - If email sending fails
 */
const sendMonthlyReportEmail = async (to, report) => {
  if (!to || !report) {
    throw new Error('Email address and report data are required');
  }
  
  if (!isValidEmail(to)) {
    throw new Error('Invalid email address format');
  }

  const requiredFields = ['name', 'month', 'year', 'totalIncome', 'totalExpenses', 'balance', 'transactionCount'];
  for (const field of requiredFields) {
    if (report[field] === undefined || report[field] === null) {
      throw new Error(`Report must have ${field} property`);
    }
  }

  const sanitizedName = sanitizeHtml(report.name);
  const sanitizedMonth = sanitizeHtml(report.month);
  const totalIncome = Number(report.totalIncome);
  const totalExpenses = Number(report.totalExpenses);
  const balance = Number(report.balance);
  const transactionCount = Number(report.transactionCount);

  if (isNaN(totalIncome) || isNaN(totalExpenses) || isNaN(balance) || isNaN(transactionCount)) {
    throw new Error('Report numeric values must be valid numbers');
  }

  try {
    await resend.emails.send({
      from: 'reports@your-verified-domain.com',
      to,
      subject: `Your Expense Report for ${sanitizedMonth} ${report.year}`,
      html: `<h1>Monthly Report for ${sanitizedName}</h1>
             <h2>${sanitizedMonth} ${report.year}</h2>
             <p>Here is your financial summary:</p>
             <ul>
               <li>Total Income: $${totalIncome.toFixed(2)}</li>
               <li>Total Expenses: $${totalExpenses.toFixed(2)}</li>
               <li><strong>Net Balance: $${balance.toFixed(2)}</strong></li>
               <li>Transactions: ${transactionCount}</li>
             </ul>
             <p>Keep up the great work!</p>`,
    });
    console.log(`Monthly report sent to ${to}`);
  } catch (error) {
    console.error('Error sending monthly report email:', error);
    throw new Error(`Failed to send monthly report email: ${error.message}`);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBudgetAlertEmail,
  sendMonthlyReportEmail,
};
