import React from 'react';

const ContactPage = () => (
  <div className="py-16 px-8 max-w-3xl mx-auto">
    <h1 className="text-4xl font-bold mb-6 text-accent">Contact Us</h1>
    <p className="text-lg text-gray-700 mb-4">Have questions or need support? Reach out to our team and we'll be happy to assist you.</p>
    <ul className="text-lg text-gray-700">
      <li>Email: <a href="mailto:support@realiztyx.com" className="text-accent underline">support@realiztyx.com</a></li>
      <li>Phone: <a href="tel:+1234567890" className="text-accent underline">+1 234 567 890</a></li>
    </ul>
  </div>
);

export default ContactPage;
