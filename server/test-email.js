import dotenv from 'dotenv';
import { sendInquiryNotification, sendClientConfirmation, testEmailConfiguration } from './utils/emailService.js';

dotenv.config();

console.log('🧪 Testing Email Configuration...\n');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);
console.log('\n');

const testEmails = async () => {
  try {
    // Step 1: Test connection
    console.log('Step 1: Testing email server connection...');
    const connectionTest = await testEmailConfiguration();
    
    if (!connectionTest.success) {
      console.error('❌ Connection failed:', connectionTest.error);
      return;
    }
    
    console.log('✅ Connection successful!\n');

    // Step 2: Send test inquiry notification
    console.log('Step 2: Sending test inquiry notification to admin...');
    const inquiryTest = await sendInquiryNotification({
      name: 'John Doe',
      email: 'johndoe@example.com',
      phone: '+1 234 567 8900',
      message: 'This is a test inquiry. I am interested in viewing this property next week. Please contact me at your earliest convenience.',
      purpose: 'viewing',
      propertyTitle: 'Luxury Villa in Downtown',
      propertyPrice: 500000,
      propertyType: 'House'
    });

    if (inquiryTest.success) {
      console.log('✅ Inquiry notification sent successfully!');
      console.log('   Message ID:', inquiryTest.messageId);
    } else {
      console.error('❌ Failed to send inquiry notification:', inquiryTest.error);
    }

    console.log('\n');

    // Step 3: Send test client confirmation
    console.log('Step 3: Sending test confirmation to client...');
    const confirmationTest = await sendClientConfirmation({
      name: 'John Doe',
      email: process.env.EMAIL_USER, // Send to yourself for testing
      propertyTitle: 'Luxury Villa in Downtown',
      purpose: 'viewing'
    });

    if (confirmationTest.success) {
      console.log('✅ Client confirmation sent successfully!');
      console.log('   Message ID:', confirmationTest.messageId);
    } else {
      console.error('❌ Failed to send confirmation:', confirmationTest.error);
    }

    console.log('\n');
    console.log('✅ Email test completed!');
    console.log('📧 Check your inbox:', process.env.EMAIL_USER);
    console.log('📧 Admin inbox:', process.env.ADMIN_EMAIL);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testEmails();