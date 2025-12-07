import { createTransport } from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️ Email credentials not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env file');
    return null;
  }

  // Use SMTP configuration
  return createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Send inquiry notification email to admin
 */
export const sendInquiryNotification = async (inquiryData) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('⚠️ Email not sent: Transporter not configured');
      return { success: false, message: 'Email service not configured' };
    }

    const {
      name,
      email,
      phone,
      message,
      purpose,
      lookingFor,
      state,
      preferredDate,
      preferredTime,
      propertyTitle,
      propertyPrice,
      propertyType
    } = inquiryData;

    // Admin email (where notifications will be sent)
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

    const purposeLabels = {
      buy: 'Buy',
      rent: 'Rent',
      viewing: 'Schedule Viewing',
      info: 'Get Information'
    };

    const lookingForLabels = {
      for_home: "Looking for a home",
      sell_property: "Sell my property",
      pre_approved: "Get pre-approved",
      general: "General inquiry"
    };

    // Email content
    const mailOptions = {
      from: `"Realizty Inquiries" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `🏠 New Property Inquiry - ${propertyTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
            }
            .header {
              background: linear-gradient(135deg, #2c43f5 0%, #0519ad 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .header p {
              margin: 10px 0 0 0;
              opacity: 0.9;
              font-size: 14px;
            }
            .content {
              padding: 30px;
            }
            .property-info {
              background: #f0f4ff;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #2c43f5;
            }
            .client-info {
              background: #fff9e6;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #ffc107;
            }
            .section-title {
              margin-top: 0;
              font-size: 18px;
              font-weight: bold;
            }
            .info-row {
              margin: 10px 0;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: bold;
              color: #666;
              display: inline-block;
              min-width: 100px;
            }
            .info-value {
              color: #333;
            }
            .message-box {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              font-style: italic;
              border-left: 3px solid #2c43f5;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .purpose-badge {
              display: inline-block;
              padding: 5px 15px;
              background: #2c43f5;
              color: white;
              border-radius: 20px;
              font-size: 14px;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding: 20px;
              border-top: 2px solid #eee;
              color: #999;
              font-size: 12px;
            }
            .cta-button {
              display: inline-block;
              padding: 12px 30px;
              background: #2c43f5;
              color: white !important;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .cta-container {
              text-align: center;
            }
            a {
              color: #2c43f5;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏠 New Property Inquiry</h1>
              <p>You have received a new inquiry from your website</p>
            </div>
            
            <div class="content">
              <div class="property-info">
                <h3 class="section-title" style="color: #2c43f5;">📋 Property Details</h3>
                <div class="info-row">
                  <span class="info-label">Property:</span>
                  <span class="info-value"><strong>${propertyTitle}</strong></span>
                </div>
                ${propertyPrice ? `
                <div class="info-row">
                  <span class="info-label">Price:</span>
                  <span class="info-value"><strong>$${propertyPrice.toLocaleString()}</strong></span>
                </div>
                ` : ''}
                ${propertyType && propertyType !== 'N/A' ? `
                <div class="info-row">
                  <span class="info-label">Type:</span>
                  <span class="info-value">${propertyType}</span>
                </div>
                ` : ''}
                <div class="info-row">
                  <span class="info-label">Purpose:</span>
                  <span class="info-value">
                    <span class="purpose-badge">${purposeLabels[purpose] || purpose}</span>
                  </span>
                </div>
              </div>

              <div class="client-info">
                <h3 class="section-title" style="color: #ff9800;">👤 Client Information</h3>
                <div class="info-row">
                  <span class="info-label">Name:</span>
                  <span class="info-value"><strong>${name}</strong></span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value">
                    <a href="mailto:${email}">${email}</a>
                  </span>
                </div>
                ${phone ? `
                <div class="info-row">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">
                    <a href="tel:${phone}">${phone}</a>
                  </span>
                </div>
                ` : ''}
                ${state ? `
                <div class="info-row">
                  <span class="info-label">State/Province:</span>
                  <span class="info-value">${state}</span>
                </div>
                ` : ''}
                ${lookingFor ? `
                <div class="info-row">
                  <span class="info-label">Looking For:</span>
                  <span class="info-value">${lookingForLabels[lookingFor] || lookingFor}</span>
                </div>
                ` : ''}
                ${preferredDate || preferredTime ? `
                <div class="info-row">
                  <span class="info-label">Preferred:</span>
                  <span class="info-value">${preferredDate ? preferredDate : ''}${preferredDate && preferredTime ? ' at ' : ''}${preferredTime ? preferredTime : ''}</span>
                </div>
                ` : ''}
              </div>

              <h3 style="color: #2c43f5; margin-bottom: 10px;">💬 Message</h3>
              <div class="message-box">
                ${message}
              </div>

              <div class="cta-container">
                <a href="mailto:${email}" class="cta-button">
                  📧 Reply to ${name}
                </a>
              </div>

              <div class="footer">
                <p><strong>Realizty Property Management System</strong></p>
                <p>Inquiry received on ${new Date().toLocaleString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Send email
    console.log('📧 Sending email to:', adminEmail);
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', info.messageId);
    console.log('✅ Email accepted by:', info.accepted);
    
    return {
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully'
    };

  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command
    });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send confirmation email to client
 */
export const sendClientConfirmation = async (inquiryData) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      return { success: false, message: 'Email service not configured' };
    }

    const { name, email, propertyTitle, purpose } = inquiryData;

    const purposeMessages = {
      buy: 'purchase',
      rent: 'rent',
      viewing: 'schedule a viewing for',
      info: 'learn more about'
    };

    const mailOptions = {
      from: `"Realizty" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Thank you for your inquiry - ${propertyTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background-color: #ffffff;
            }
            .header { 
              background: linear-gradient(135deg, #2c43f5 0%, #0519ad 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
            }
            .content { 
              padding: 30px; 
            }
            .content p {
              margin: 15px 0;
              font-size: 16px;
            }
            .property-name {
              color: #2c43f5;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              padding: 20px;
              border-top: 2px solid #eee;
              color: #999;
              font-size: 12px;
            }
            .contact-info {
              background: #f0f4ff;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #2c43f5;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You! 🏠</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${name}</strong>,</p>
              
              <p>Thank you for your inquiry about <span class="property-name">${propertyTitle}</span>.</p>
              
              <p>We have received your message regarding your interest to <strong>${purposeMessages[purpose] || 'learn more about'}</strong> this property.</p>
              
              <p>One of our experienced real estate agents will review your inquiry and contact you within 24 hours.</p>
              
              <div class="contact-info">
                <p style="margin: 0;"><strong>📧 Email:</strong> ${process.env.EMAIL_USER}</p>
                <p style="margin: 10px 0 0 0;"><strong>🌐 Website:</strong> <a href="${process.env.ADMIN_URL || 'http://localhost:3000'}" style="color: #2c43f5;">Visit our website</a></p>
              </div>
              
              <p>We appreciate your interest in our properties and look forward to helping you find your perfect home!</p>
              
              <p>Best regards,<br><strong>The Realizty Team</strong></p>
              
              <div class="footer">
                <p><strong>Realizty Property Management</strong></p>
                <p>This is an automated confirmation email.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    console.log('📧 Sending confirmation email to client:', email);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Confirmation email sent to client:', info.messageId);
    
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test email configuration
 */
export const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      return { success: false, message: 'Email credentials not configured' };
    }

    // Verify connection
    await transporter.verify();
    console.log('✅ Email server connection verified');
    
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    console.error('❌ Email configuration test failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send a generic contact message to admin (from contact form)
 */
export const sendAdminContact = async (contactData) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      return { success: false, message: 'Email service not configured' };
    }

    const { name, email, phone, subject, message } = contactData;
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

    const mailOptions = {
      from: `"Website Contact" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: subject || `Contact form message from ${name || email}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>New contact form submission</h2>
          <p><strong>Name:</strong> ${name || 'N/A'}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          ${phone ? `<p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>` : ''}
          <hr />
          <p>${message || ''}</p>
          <hr />
          <p style="font-size:12px;color:#666;">Sent on ${new Date().toLocaleString()}</p>
        </div>
      `
    };

    console.log('📧 Sending contact form email to admin:', adminEmail);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Contact email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending contact email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email to user
 */
export const sendPasswordReset = async ({ name, email, resetLink }) => {
  try {
    const transporter = createTransporter();
    if (!transporter) return { success: false, message: 'Email service not configured' };

    const mailOptions = {
      from: `"Realizty Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Password reset request`,
      html: `
        <div style="font-family: Arial, sans-serif; color:#333;">
          <h2>Password Reset Request</h2>
          <p>Hi ${name || 'User'},</p>
          <p>We received a request to reset your password. Click the button below to set a new password. This link will expire in 1 hour.</p>
          <p style="text-align:center;margin:20px 0;"><a href="${resetLink}" style="background:#2c43f5;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">Reset Password</a></p>
          <p>If you did not request this, ignore this email.</p>
          <p style="font-size:12px;color:#666;">Sent on ${new Date().toLocaleString()}</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send password changed confirmation to user
 */
export const sendPasswordChangedConfirmation = async ({ name, email }) => {
  try {
    const transporter = createTransporter();
    if (!transporter) return { success: false, message: 'Email service not configured' };

    const mailOptions = {
      from: `"Realizty Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your password was changed`,
      html: `
        <div style="font-family: Arial, sans-serif; color:#333;">
          <h2>Password Changed</h2>
          <p>Hi ${name || 'User'},</p>
          <p>This is a confirmation that your account password was changed successfully. If you did not perform this action, please contact support immediately.</p>
          <p style="font-size:12px;color:#666;">Sent on ${new Date().toLocaleString()}</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password changed confirmation sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password changed confirmation:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendInquiryNotification,
  sendClientConfirmation,
  sendPasswordReset,
  sendPasswordChangedConfirmation,
  sendAdminContact,
  testEmailConfiguration
};