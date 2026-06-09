import React, { useState, useEffect } from 'react';
import { Users, MessageCircle, Trash2, Eye, CheckCircle, Clock, AlertTriangle, UserPlus, Settings, BarChart3, Download, Heart, Calendar, Star, CreditCard, Truck, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import MedicineRequestManagement from './MedicineRequestManagement';
import DailyUpdates from './DailyUpdates';
import AdminReviews from './AdminReviews';
import AdminPaymentManagement from './AdminPaymentManagement';
import AdminRevenueManagement from './AdminRevenueManagement';
import AdminDisputeManagement from './AdminDisputeManagement';
import AdminSupportManagement from './AdminSupportManagement';
import AdminDonationManagement from './AdminDonationManagement';
import RiderReviewQueue from './RiderReviewQueue';
import TopBar from './TopBar';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [medicineRequests, setMedicineRequests] = useState([]);
  const [stats, setStats] = useState({ users: {}, support: {}, requests: {} });
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const { user, getAuthHeaders } = useAuth();
  const { success, error, warning, showConfirm } = useNotification();

  // New state for enhanced admin features
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    phone: '',
    password: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    role: 'customer'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Don't fetch if user is not logged in or no token
    if (!user || !localStorage.getItem('token')) {
      return;
    }
    
    try {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      
      // Fetch users
      const usersResponse = await fetch('/api/users', { headers });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        // Ensure role property exists for each user
        const processedUsers = usersData.map(user => ({
          ...user,
          role: user.role || 'customer' // Default to customer if role is missing
        }));
        setUsers(processedUsers);
      }

      // Fetch medicine requests
      const requestsResponse = await fetch('/api/medicine-requests/all', { headers });
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setMedicineRequests(requestsData);
        // Update stats
        const stats = {
          total: requestsData.length,
          pending: requestsData.filter(r => r.status === 'pending').length,
          approved: requestsData.filter(r => r.status === 'approved').length,
          rejected: requestsData.filter(r => r.status === 'rejected').length
        };
        setStats(prev => ({ ...prev, requests: stats }));
      }

      // Fetch support tickets
      const ticketsResponse = await fetch('/api/support', { headers });
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json();
        setSupportTickets(ticketsData);
      }

      // Fetch stats
      const userStatsResponse = await fetch('/api/users/stats', { headers });
      const supportStatsResponse = await fetch('/api/support/stats', { headers });
      
      if (userStatsResponse.ok && supportStatsResponse.ok) {
        const userStats = await userStatsResponse.json();
        const supportStats = await supportStatsResponse.json();
        setStats({ users: userStats, support: supportStats });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

    const toggleUserStatus = async (userId, currentStatus) => {
      if (!user || !localStorage.getItem('token')) {
        return;
      }

      try {
        const response = await fetch(`/api/users/${userId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ isActive: !currentStatus })
        });

        if (response.ok) {
          setUsers(users.map(u => 
            u.id === userId ? { ...u, isActive: !currentStatus } : u
          ));
          success(`User status ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        } else {
          const errorData = await response.json();
          error(`${errorData.message}`);
        }
      } catch (err) {
        error('Error updating user status. Please try again.');
      }
    };

    const handleDeleteUser = async (userId) => {
      // Don't make API calls if user is not logged in or no token
      if (!user || !localStorage.getItem('token')) {
        return;
      }
      
      const confirmed = await showConfirm(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone.',
      { confirmText: 'Delete', cancelText: 'Cancel', type: 'error' }
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
        success('User deleted successfully');
        fetchData(); // Refresh stats
      } else {
        const errorData = await response.json();
        error(`${errorData.message}`);
      }
    } catch (err) {
      error('Error deleting user. Please try again.');
    }
  };

  const handleUpdateTicket = async (ticketId, status, response) => {
    if (!user || !localStorage.getItem('token')) {
      return;
    }
    
    try {
      const updateResponse = await fetch(`/api/support/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status, adminResponse: response })
      });

      if (updateResponse.ok) {
        fetchData();
        setSelectedTicket(null);
        setAdminResponse('');
        success('Ticket updated successfully');
      }
    } catch (err) {
      error('Error updating ticket. Please try again.');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!user || !localStorage.getItem('token')) {
      return;
    }
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(newUserData)
      });

      if (response.ok) {
        setNewUserData({
          email: '',
          phone: '',
          password: '',
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          gender: '',
          role: 'customer'
        });
        setShowCreateUser(false);
        fetchData();
        success('User created successfully');
      } else {
        const errorData = await response.json();
        error(`${errorData.message}`);
      }
    } catch (err) {
      error('Error creating user. Please try again.');
    }
  };

  const exportUsers = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Email,Phone,Role,Gender,Status,Created Date\n"
      + users.map(user => 
          `"${user.firstName} ${user.lastName}","${user.email}","${user.phone}","${user.role}","${user.gender}","${user.isActive ? 'Active' : 'Inactive'}","${new Date(user.createdAt).toLocaleDateString()}"`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "medsy_users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status) => {
    const colors = {
      'open': 'bg-red-100 text-red-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'resolved': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-healthcare-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-healthcare-green-50 to-white dark:from-healthcare-green-900/20 dark:to-gray-800 rounded-2xl p-6 shadow-lg border border-healthcare-green-100 dark:border-healthcare-green-700/50 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-healthcare-green-600 to-healthcare-green-500 p-4 rounded-xl shadow-lg">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.users.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 rounded-2xl p-6 shadow-lg border border-blue-100 dark:border-blue-700/50 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-4 rounded-xl shadow-lg">
              <MessageCircle className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Support Tickets</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.support.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-800 rounded-2xl p-6 shadow-lg border border-amber-100 dark:border-amber-700/50 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-amber-600 to-amber-500 p-4 rounded-xl shadow-lg">
              <Clock className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Open Tickets</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.support.open || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-800 rounded-2xl p-6 shadow-lg border border-red-100 dark:border-red-700/50 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-red-600 to-red-500 p-4 rounded-xl shadow-lg">
              <AlertTriangle className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Complaints</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.support.complaints || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-lg border dark:border-gray-700/50 backdrop-blur-sm overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
          <div className="flex flex-wrap overflow-x-auto">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 font-semibold text-sm transition-all duration-300 flex items-center gap-2 relative whitespace-nowrap ${
                activeTab === 'users'
                  ? 'text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Users className="h-5 w-5" />
              User Management
              {activeTab === 'users' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-healthcare-green-600 to-healthcare-green-400 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`px-6 py-4 font-semibold text-sm transition-all duration-300 flex items-center gap-2 relative whitespace-nowrap ${
                activeTab === 'support'
                  ? 'text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <MessageCircle className="h-5 w-5" />
              Support
              {activeTab === 'support' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-healthcare-green-600 to-healthcare-green-400 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('medicine-requests')}
              className={`px-6 py-4 font-semibold text-sm transition-all duration-300 flex items-center gap-2 relative whitespace-nowrap ${
                activeTab === 'medicine-requests'
                  ? 'text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Heart className="h-5 w-5" />
              Requests
              {activeTab === 'medicine-requests' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-healthcare-green-600 to-healthcare-green-400 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('daily-updates')}
              className={`px-6 py-4 font-semibold text-sm transition-all duration-300 flex items-center gap-2 relative whitespace-nowrap ${
                activeTab === 'daily-updates'
                  ? 'text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Calendar className="h-5 w-5" />
              Updates
              {activeTab === 'daily-updates' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-healthcare-green-600 to-healthcare-green-400 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-4 font-semibold text-sm transition-all duration-300 flex items-center gap-2 relative whitespace-nowrap ${
                activeTab === 'payments'
                  ? 'text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <CreditCard className="h-5 w-5" />
              Payments
              {activeTab === 'payments' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-healthcare-green-600 to-healthcare-green-400 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('disputes')}
              className={`px-6 py-4 font-semibold text-sm transition-all duration-300 flex items-center gap-2 relative whitespace-nowrap ${
                activeTab === 'disputes'
                  ? 'text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
              Disputes
              {activeTab === 'disputes' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-healthcare-green-600 to-healthcare-green-400 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('enhanced-support')}
              className={`px-6 py-4 font-semibold text-sm transition-all duration-300 flex items-center gap-2 relative whitespace-nowrap ${
                activeTab === 'enhanced-support'
                  ? 'text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Settings className="h-5 w-5" />
              Advanced
              {activeTab === 'enhanced-support' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-healthcare-green-600 to-healthcare-green-400 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-6 py-4 font-semibold text-sm transition-all duration-300 flex items-center gap-2 relative whitespace-nowrap ${
                activeTab === 'reviews'
                  ? 'text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Star className="h-5 w-5" />
              Reviews
              {activeTab === 'reviews' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-healthcare-green-600 to-healthcare-green-400 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('riders')}
              className={`px-6 py-4 font-semibold text-sm transition-all duration-300 flex items-center gap-2 relative whitespace-nowrap ${
                activeTab === 'riders'
                  ? 'text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Truck className="h-5 w-5" />
              Riders
              {activeTab === 'riders' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-healthcare-green-600 to-healthcare-green-400 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('donations')}
              className={`px-6 py-4 font-semibold text-sm transition-all duration-300 flex items-center gap-2 relative whitespace-nowrap ${
                activeTab === 'donations'
                  ? 'text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Gift className="h-5 w-5" />
              Donations
              {activeTab === 'donations' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-healthcare-green-600 to-healthcare-green-400 rounded-t-full" />
              )}
            </button>
          </div>
        </div>

        <div className="p-8">
          {activeTab === 'enhanced-support' && <AdminSupportManagement />}
          {activeTab === 'disputes' && <AdminDisputeManagement />}
          {activeTab === 'riders' && <RiderReviewQueue />}
          {activeTab === 'donations' && <AdminDonationManagement />}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage all users ({users.length})</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCreateUser(true)}
                    className="bg-gradient-to-r from-healthcare-green-600 to-healthcare-green-500 hover:from-healthcare-green-700 hover:to-healthcare-green-600 text-white px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center space-x-2 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                  >
                    <UserPlus className="h-5 w-5" />
                    <span>Add User</span>
                  </button>
                  <button
                    onClick={exportUsers}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center space-x-2 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                  >
                    <Download className="h-5 w-5" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800">
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">Name</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">Email</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">Phone</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">Role</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">Gender</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">Created</th>
                      <th className="text-right px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                    {users.map((user, index) => (
                      <tr key={user.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800/30' : 'bg-gray-50 dark:bg-gray-800/50'} hover:bg-gradient-to-r hover:from-healthcare-green-50 hover:to-white dark:hover:from-healthcare-green-900/20 dark:hover:to-gray-800 transition-all duration-200`}>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.phone}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold bg-gradient-to-r from-healthcare-green-100 to-emerald-100 dark:from-healthcare-green-900/50 dark:to-emerald-900/50 text-healthcare-green-800 dark:text-healthcare-green-200 px-3 py-1.5 rounded-full capitalize border border-healthcare-green-200 dark:border-healthcare-green-700">
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 capitalize">{user.gender}</td>
                        <td className="px-6 py-4">
                          {user.role === 'admin' ? (
                            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700">
                              Always Active
                            </span>
                          ) : (
                            <button
                              onClick={() => toggleUserStatus(user.id, user.isActive)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-200 border ${
                                user.isActive 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800/70 border-green-200 dark:border-green-700' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800/70 border-red-200 dark:border-red-700'
                              }`}
                            >
                              {user.isActive ? 'Active' : 'Inactive'}
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end space-x-2">
                          {user.role !== 'admin' && (
                            <>
                              <button
                                onClick={() => toggleUserStatus(user.id, user.isActive)}
                                className={`p-2 rounded-lg transition-all duration-200 ${
                                  user.isActive 
                                    ? 'text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/30' 
                                    : 'text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30'
                                }`}
                                title={user.isActive ? "Deactivate User" : "Activate User"}
                              >
                                {user.isActive ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-700 p-2 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                                title="Delete User"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'medicine-requests' && (
            <div className="p-6">
              <MedicineRequestManagement />
            </div>
          )}

          {activeTab === 'daily-updates' && (
            <div className="p-0">
              <DailyUpdates />
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="p-0">
              <AdminPaymentManagement />
            </div>
          )}


          {activeTab === 'revenue' && (
            <div className="p-0">
              <AdminRevenueManagement />
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="p-0">
              <AdminReviews />
            </div>
          )}

          {activeTab === 'support' && (
            <AdminSupportManagement />
          )}


        </div>
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-3 mb-6">
              <UserPlus className="h-6 w-6 text-healthcare-green-600 dark:text-healthcare-green-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New User</h3>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newUserData.firstName}
                    onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newUserData.lastName}
                    onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={newUserData.dateOfBirth}
                  onChange={(e) => setNewUserData({...newUserData, dateOfBirth: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                  <select
                    required
                    value={newUserData.gender}
                    onChange={(e) => setNewUserData({...newUserData, gender: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="customer">Customer</option>
                    <option value="pharmacy_vendor">Pharmacy Vendor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-healthcare-green-600 text-white rounded-lg hover:bg-healthcare-green-700 flex items-center space-x-2"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Respond to Ticket</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500"
                defaultValue={selectedTicket.status}
                onChange={(e) => setSelectedTicket({...selectedTicket, status: e.target.value})}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-healthcare-green-500"
                placeholder="Enter your response..."
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setAdminResponse('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateTicket(selectedTicket.id, selectedTicket.status, adminResponse)}
                className="px-4 py-2 bg-healthcare-green-600 text-white rounded-lg hover:bg-healthcare-green-700"
              >
                Update Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

