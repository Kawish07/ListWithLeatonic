import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PrivacyPage = () => {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-white rounded-3xl shadow-lg p-10">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
            <p className="text-slate-700 mb-6">Your privacy is important to us. This policy explains how we collect, use, and protect your information.</p>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Information We Collect</h2>
              <p className="text-slate-600">We collect information you provide directly and information collected automatically.</p>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">How We Use Information</h2>
              <p className="text-slate-600">We use information to provide and improve services, send communications, and for analytics.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-2">Contact</h2>
              <p className="text-slate-600">If you have questions about this policy, contact us at support@listwithleatonic.example.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PrivacyPage;
