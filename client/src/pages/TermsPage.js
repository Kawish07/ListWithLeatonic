import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TermsPage = () => {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-white rounded-3xl shadow-lg p-10">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Terms of Service</h1>
            <p className="text-slate-700 mb-6">Welcome to ListWithLeatonic. These Terms of Service govern your use of our website and services. Please read them carefully.</p>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">1. Acceptance</h2>
              <p className="text-slate-600">By using our service you agree to these terms. If you do not agree, please do not use the service.</p>
            </section>

            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">2. Use of Service</h2>
              <p className="text-slate-600">You agree to use the service in compliance with applicable laws and not to misuse it.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-2">3. Changes</h2>
              <p className="text-slate-600">We may update these terms from time to time. Material changes will be posted on the site.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default TermsPage;
