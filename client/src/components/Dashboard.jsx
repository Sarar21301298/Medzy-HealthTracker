import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import CustomerDashboard from './CustomerDashboard';
import PharmacyVendorDashboard from './PharmacyVendorDashboard';
import RiderDashboard from './RiderDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'customer':
        return <CustomerDashboard />;
      case 'pharmacy_vendor':
        return <PharmacyVendorDashboard />;
      case 'rider':
        return <RiderDashboard />;
      default:
        return <div>Invalid user role</div>;
    }
  };

  return renderDashboard();
};

export default Dashboard;

