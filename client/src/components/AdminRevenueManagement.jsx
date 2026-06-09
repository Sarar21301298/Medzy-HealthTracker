import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  ShoppingCart,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';

const AdminRevenueManagement = () => {
  const { getAuthHeaders } = useAuth();
  const { success, error } = useNotification();
  
  const [stats, setStats] = useState({
    totalMedzyRevenue: 0,
    completedRevenue: 0,
    pendingRevenue: 0,
    totalVendorEarnings: 0,
    completedVendorEarnings: 0,
    pendingVendorEarnings: 0,
    totalAmount: 0,
    totalPayments: 0,
    completedPayments: 0,
    pendingPayments: 0,
    failedPayments: 0
  });
  const [vendorRevenue, setVendorRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchRevenueStats();
    fetchVendorRevenue();
  }, [dateRange]);

  const fetchRevenueStats = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (dateRange.startDate) queryParams.append('startDate', dateRange.startDate);
      if (dateRange.endDate) queryParams.append('endDate', dateRange.endDate);

      const response = await fetch(`/api/payments/stats?${queryParams}`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      } else {
        error('Failed to fetch revenue stats');
      }
    } catch (err) {
      error('Network error while fetching stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorRevenue = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (dateRange.startDate) queryParams.append('startDate', dateRange.startDate);
      if (dateRange.endDate) queryParams.append('endDate', dateRange.endDate);

      const response = await fetch(`/api/payments/revenue/vendors?${queryParams}`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (response.ok) {
        // Extract vendors array and summary data
        setVendorRevenue(data.vendors || []);
        // Update stats with the summary data
        setStats(prevStats => ({
          ...prevStats,
          totalMedzyRevenue: data.totalRevenue || 0,
          completedRevenue: data.completedRevenue || 0,
          pendingRevenue: data.pendingRevenue || 0,
          totalVendorEarnings: data.totalVendorEarnings || 0,
          completedVendorEarnings: data.completedVendorEarnings || 0,
          pendingVendorEarnings: data.pendingVendorEarnings || 0
        }));
      } else {
        error('Failed to fetch vendor revenue');
      }
    } catch (err) {
      error('Network error while fetching vendor revenue');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT'
    }).format(amount);
  };

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange,
      summary: stats,
      vendorBreakdown: vendorRevenue
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `medzy-revenue-report-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    success('Revenue report exported successfully');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Revenue Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Track Medzy's revenue and vendor earnings</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
          <button
            onClick={() => {
              fetchRevenueStats();
              fetchVendorRevenue();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-healthcare-green-600 text-white rounded-lg hover:bg-healthcare-green-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex items-center gap-4 mb-4">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Date Range</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setDateRange({ startDate: '', endDate: '' })}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Clear Dates
            </button>
          </div>
        </div>
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {formatCurrency(stats.totalAmount || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Gross revenue from all transactions
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Medzy Revenue (15%)</p>
              <p className="text-2xl font-bold text-healthcare-green-600">
                {formatCurrency(stats.totalMedzyRevenue || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Platform commission earnings
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-healthcare-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vendor Earnings (85%)</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats.totalVendorEarnings || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Total paid to vendors
              </p>
            </div>
            <Users className="h-10 w-10 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.totalPayments || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Completed transactions
              </p>
            </div>
            <ShoppingCart className="h-10 w-10 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Revenue Distribution
          </h3>
          
          <div className="space-y-4">
            {/* Medzy Revenue Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-healthcare-green-600 rounded"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Medzy (15%)</span>
              </div>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                {formatCurrency(stats.totalMedzyRevenue || 0)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-healthcare-green-600 h-3 rounded-full" 
                style={{ 
                  width: `${stats.totalAmount > 0 ? (stats.totalMedzyRevenue / stats.totalAmount) * 100 : 0}%` 
                }}
              ></div>
            </div>

            {/* Vendor Revenue Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-purple-600 rounded"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Vendors (85%)</span>
              </div>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                {formatCurrency(stats.totalVendorEarnings || 0)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-purple-600 h-3 rounded-full" 
                style={{ 
                  width: `${stats.totalAmount > 0 ? (stats.totalVendorEarnings / stats.totalAmount) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Payment Status Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Payment Status Overview
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-600 rounded"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Completed</span>
              </div>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                {stats.completedPayments || 0}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-600 rounded"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Pending</span>
              </div>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                {stats.pendingPayments || 0}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-600 rounded"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Failed</span>
              </div>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                {stats.failedPayments || 0}
              </span>
            </div>

            {/* Success Rate */}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Success Rate</span>
                <span className="text-lg font-bold text-green-600">
                  {stats.totalPayments > 0 
                    ? Math.round((stats.completedPayments / stats.totalPayments) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Revenue Breakdown Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Vendor Revenue Breakdown
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Gross Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Vendor Earnings (85%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Medzy Revenue (15%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Revenue Share
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin text-healthcare-green-600 mr-2" />
                      Loading vendor revenue...
                    </div>
                  </td>
                </tr>
              ) : vendorRevenue.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No vendor revenue data found
                  </td>
                </tr>
              ) : (
                vendorRevenue.map((vendor) => (
                  <tr key={vendor.vendorId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {vendor.vendorName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {vendor.vendorEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {vendor.totalOrders}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {formatCurrency(vendor.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(vendor.vendorEarnings)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-healthcare-green-600">
                        {formatCurrency(vendor.medzyRevenue)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div 
                            className="bg-healthcare-green-600 h-2 rounded-full" 
                            style={{ 
                              width: `${stats.totalMedzyRevenue > 0 ? (vendor.medzyRevenue / stats.totalMedzyRevenue) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {stats.totalMedzyRevenue > 0 
                            ? Math.round((vendor.medzyRevenue / stats.totalMedzyRevenue) * 100) 
                            : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRevenueManagement;

