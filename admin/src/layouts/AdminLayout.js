import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AdminLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-white text-black">
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

export default AdminLayout;
