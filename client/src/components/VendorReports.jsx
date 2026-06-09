import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Users,
  ShoppingCart,
  Award,
  PieChart,
  LineChart,
  Activity,
  CreditCard,
  Percent
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const VendorReports = () => {
  const [stats, setStats] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const { getAuthHeaders } = useAuth();
  const { success, error } = useNotification();

  useEffect(() => {
    fetchStats();
    fetchEarnings();
    
    // Set up real-time refresh every 5 minutes for reports
    const reportsInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing vendor reports...');
      fetchStats();
      fetchEarnings();
    }, 300000); // 5 minutes

    return () => {
      clearInterval(reportsInterval);
    };
  }, [timeframe]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching vendor stats with timeframe:', timeframe);

      const response = await fetch(`/api/orders/vendor/stats?timeframe=${timeframe}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Vendor stats fetched successfully:', data);
        setStats(data);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch stats:', response.status, errorText);
        throw new Error(`Failed to fetch statistics: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ Error fetching stats:', err);
      error('Failed to load statistics: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    try {
      const response = await fetch('/api/payments/vendor/earnings', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Vendor earnings fetched successfully:', data);
        setEarnings(data);
      } else {
        console.log('⚠️ Earnings endpoint not available, using stats data for earnings');
        // Fallback: calculate earnings from stats if available
        if (stats?.summary) {
          setEarnings({
            totalEarnings: (stats.summary.totalRevenue || 0) * 0.85, // 85% vendor share
            medzyCommission: (stats.summary.totalRevenue || 0) * 0.15, // 15% platform fee
            totalOrders: stats.summary.totalOrders || 0,
            totalAmount: stats.summary.totalRevenue || 0,
            sslEarnings: (stats.summary.sslRevenue || 0) * 0.85,
            codEarnings: (stats.summary.codRevenue || 0) * 0.85
          });
        }
      }
    } catch (err) {
      console.log('⚠️ Error fetching earnings, using fallback calculation');
      // Fallback calculation from stats
      if (stats?.summary) {
        setEarnings({
          totalEarnings: (stats.summary.totalRevenue || 0) * 0.85,
          medzyCommission: (stats.summary.totalRevenue || 0) * 0.15,
          totalOrders: stats.summary.totalOrders || 0,
          totalAmount: stats.summary.totalRevenue || 0,
          sslEarnings: (stats.summary.sslRevenue || 0) * 0.85,
          codEarnings: (stats.summary.codRevenue || 0) * 0.85
        });
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchEarnings()]);
    setRefreshing(false);
    success('Statistics updated');
  };

  const formatCurrency = (amount) => {
    return `৳${(amount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeframeName = (tf) => {
    const names = {
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      '90d': 'Last 90 Days',
      '1y': 'Last Year'
    };
    return names[tf] || 'Last 30 Days';
  };

  const downloadReport = () => {
    if (!stats) return;

    const reportData = {
      timeframe: getTimeframeName(timeframe),
      generatedAt: new Date().toISOString(),
      summary: stats.summary,
      earnings: earnings,
      topMedicines: stats.topMedicines,
      dailySales: stats.dailySales,
      sslOrderStats: stats.sslOrderStats
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `vendor-report-${timeframe}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    success('Report exported successfully');
  };

  const handleExport = () => {
    if (!stats && !earnings) {
      error('No data available to export');
      return;
    }

    const reportData = {
      timeframe: getTimeframeName(timeframe),
      generatedAt: new Date().toISOString(),
      summary: {
        totalOrders: stats?.summary?.totalOrders || 0,
        grossRevenue: stats?.summary?.totalRevenue || 0,
        vendorEarnings: (stats?.summary?.totalRevenue || 0) * 0.85,
        medzyCommission: (stats?.summary?.totalRevenue || 0) * 0.15,
        commissionRate: '15%',
        vendorShare: '85%',
        sslOrders: stats?.summary?.sslOrders || 0,
        sslRevenue: stats?.summary?.sslRevenue || 0,
        codOrders: stats?.summary?.codOrders || 0,
        codRevenue: stats?.summary?.codRevenue || 0
      },
      performanceData: {
        topMedicines: stats?.topMedicines || [],
        topCustomers: stats?.topCustomers || [],
        dailySales: stats?.dailySales || []
      },
      earningsBreakdown: {
        sslEarnings: (stats?.summary?.sslRevenue || 0) * 0.85,
        codEarnings: (stats?.summary?.codRevenue || 0) * 0.85,
        totalEarnings: (stats?.summary?.totalRevenue || 0) * 0.85,
        platformFee: (stats?.summary?.totalRevenue || 0) * 0.15
      }
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `vendor-earnings-report-${timeframe}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    success('Earnings report exported successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-healthcare-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-300">Track your pharmacy performance, sales, and earnings</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center space-x-2 bg-healthcare-green-600 dark:bg-healthcare-green-700 text-white px-4 py-2 rounded-lg hover:bg-healthcare-green-700 dark:hover:bg-healthcare-green-600 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${(refreshing || loading) ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={downloadReport}
            className="flex items-center space-x-2 bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Auto-refresh: 5min
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveSection('overview')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeSection === 'overview'
                  ? 'border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveSection('earnings')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeSection === 'earnings'
                  ? 'border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Earnings
            </button>
            <button
              onClick={() => setActiveSection('performance')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeSection === 'performance'
                  ? 'border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Performance
            </button>
          </nav>
        </div>
      </div>

      {/* Key Metrics - Enhanced with SSL tracking */}
      {activeSection === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats?.summary?.totalRevenue || 0)}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {getTimeframeName(timeframe)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="bg-healthcare-green-100 dark:bg-healthcare-green-900 p-3 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-healthcare-green-600 dark:text-healthcare-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.summary?.totalOrders || 0}
                  </p>
                  <p className="text-xs text-healthcare-green-600 dark:text-healthcare-green-400">
                    Orders processed
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="bg-emerald-100 dark:bg-emerald-900 p-3 rounded-lg">
                  <CreditCard className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">SSL Orders</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.summary?.sslOrders || 0}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Online payments
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(
                      stats?.summary?.totalOrders > 0 
                        ? (stats?.summary?.totalRevenue || 0) / stats.summary.totalOrders 
                        : 0
                    )}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    Per order
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.summary?.totalCustomers || 0}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Unique customers
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
              Payment Method Performance
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                      <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">SSL Commerce</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Online payments</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">{stats?.summary?.sslOrders || 0}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {formatCurrency(stats?.summary?.sslRevenue || 0)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-healthcare-green-50 dark:bg-healthcare-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-healthcare-green-100 dark:bg-healthcare-green-900 p-2 rounded-lg">
                      <Package className="w-4 h-4 text-healthcare-green-600 dark:text-healthcare-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Cash on Delivery</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">COD payments</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">{stats?.summary?.codOrders || 0}</p>
                    <p className="text-sm text-healthcare-green-600 dark:text-healthcare-green-400">
                      {formatCurrency(stats?.summary?.codRevenue || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">SSL Revenue Share</span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    {stats?.summary?.totalRevenue > 0 
                      ? Math.round(((stats?.summary?.sslRevenue || 0) / stats.summary.totalRevenue) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ 
                      width: `${stats?.summary?.totalRevenue > 0 
                        ? ((stats?.summary?.sslRevenue || 0) / stats.summary.totalRevenue) * 100
                        : 0}%` 
                    }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">COD Revenue Share</span>
                  <span className="text-sm font-bold text-healthcare-green-600 dark:text-healthcare-green-400">
                    {stats?.summary?.totalRevenue > 0 
                      ? Math.round(((stats?.summary?.codRevenue || 0) / stats.summary.totalRevenue) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-healthcare-green-500 h-2 rounded-full" 
                    style={{ 
                      width: `${stats?.summary?.totalRevenue > 0 
                        ? ((stats?.summary?.codRevenue || 0) / stats.summary.totalRevenue) * 100
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Earnings Section */}
      {activeSection === 'earnings' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Your Earnings</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(earnings?.totalEarnings || (stats?.summary?.totalRevenue || 0) * 0.85)}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    85% vendor share
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg">
                  <Percent className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Platform Fee</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {formatCurrency(earnings?.medzyCommission || (stats?.summary?.totalRevenue || 0) * 0.15)}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    15% commission
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="bg-emerald-100 dark:bg-emerald-900 p-3 rounded-lg">
                  <CreditCard className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">SSL Earnings</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency((stats?.summary?.sslRevenue || 0) * 0.85)}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    From online orders
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="bg-healthcare-green-100 dark:bg-healthcare-green-900 p-3 rounded-lg">
                  <Package className="h-6 w-6 text-healthcare-green-600 dark:text-healthcare-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">COD Earnings</p>
                  <p className="text-2xl font-bold text-healthcare-green-600 dark:text-healthcare-green-400">
                    {formatCurrency((stats?.summary?.codRevenue || 0) * 0.85)}
                  </p>
                  <p className="text-xs text-healthcare-green-600 dark:text-healthcare-green-400">
                    From COD orders
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                Revenue Split Breakdown
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-green-600 rounded"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Earnings (85%)</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    {formatCurrency((stats?.summary?.totalRevenue || 0) * 0.85)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                  <div className="bg-green-600 h-3 rounded-full" style={{ width: '85%' }}></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-orange-600 rounded"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Platform Fee (15%)</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    {formatCurrency((stats?.summary?.totalRevenue || 0) * 0.15)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                  <div className="bg-orange-600 h-3 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-healthcare-green-600 dark:text-healthcare-green-400" />
                Payment Method Earnings
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">SSL Commerce</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{stats?.summary?.sslOrders || 0} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 dark:text-green-400">
                      {formatCurrency((stats?.summary?.sslRevenue || 0) * 0.85)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      From {formatCurrency(stats?.summary?.sslRevenue || 0)} gross
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-healthcare-green-50 dark:bg-healthcare-green-900/20 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Cash on Delivery</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{stats?.summary?.codOrders || 0} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-healthcare-green-600 dark:text-healthcare-green-400">
                      {formatCurrency((stats?.summary?.codRevenue || 0) * 0.85)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      From {formatCurrency(stats?.summary?.codRevenue || 0)} gross
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings Summary */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">💰 Earnings Summary</h3>
                <p className="text-green-100 text-lg">
                  Total Earnings: <span className="font-bold">{formatCurrency((stats?.summary?.totalRevenue || 0) * 0.85)}</span> from{' '}
                  <span className="font-bold">{stats?.summary?.totalOrders || 0}</span> orders.
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-green-100 text-sm">
                    🌐 SSL Earnings: {formatCurrency((stats?.summary?.sslRevenue || 0) * 0.85)} ({stats?.summary?.sslOrders || 0} orders)
                  </p>
                  <p className="text-green-100 text-sm">
                    💵 COD Earnings: {formatCurrency((stats?.summary?.codRevenue || 0) * 0.85)} ({stats?.summary?.codOrders || 0} orders)
                  </p>
                  <p className="text-green-100 text-sm">
                    🏢 Platform fee: {formatCurrency((stats?.summary?.totalRevenue || 0) * 0.15)} (15% commission)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {stats?.summary?.totalOrders > 0 
                    ? formatCurrency((stats?.summary?.totalRevenue || 0) / stats.summary.totalOrders)
                    : formatCurrency(0)
                  }
                </div>
                <div className="text-green-100">Average Order Value</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Performance Section */}
      {activeSection === 'performance' && (
        <>
          {/* Top Medicines */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-healthcare-green-600 dark:text-healthcare-green-400" />
              Top Performing Medicines
            </h3>
            
            {stats?.topMedicines?.length > 0 ? (
              <div className="space-y-4">
                {stats.topMedicines.map((medicine, index) => (
                  <div key={medicine._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-healthcare-green-100 dark:bg-healthcare-green-900 p-2 rounded-lg">
                        <span className="text-healthcare-green-600 dark:text-healthcare-green-400 font-bold">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{medicine.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {medicine.category} • {medicine.company}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">{medicine.totalSold} sold</p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {formatCurrency(medicine.totalRevenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No medicine sales data available for the selected period.
              </p>
            )}
          </div>

          {/* Top Customers */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
              Top Customers
            </h3>
            
            {stats?.topCustomers?.length > 0 ? (
              <div className="space-y-4">
                {stats.topCustomers.map((customer, index) => (
                  <div key={customer._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                        <span className="text-purple-600 dark:text-purple-400 font-bold">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{customer.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">{customer.totalOrders} orders</p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {formatCurrency(customer.totalSpent)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No customer data available for the selected period.
              </p>
            )}
          </div>

          {/* Performance Summary */}
          <div className="bg-gradient-to-r from-purple-500 to-healthcare-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">📈 Performance Summary</h3>
                <p className="text-purple-100 text-lg">
                  {getTimeframeName(timeframe)} Performance Metrics
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-purple-100 text-sm">
                    🥇 Best performing medicine: {stats?.topMedicines?.[0]?.name || 'N/A'}
                  </p>
                  <p className="text-purple-100 text-sm">
                    👤 Most valuable customer: {stats?.topCustomers?.[0]?.name || 'N/A'}
                  </p>
                  <p className="text-purple-100 text-sm">
                    📊 Average order value: {formatCurrency(
                      stats?.summary?.totalOrders > 0 
                        ? (stats?.summary?.totalRevenue || 0) / stats.summary.totalOrders 
                        : 0
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {stats?.summary?.totalOrders || 0}
                </div>
                <div className="text-purple-100">Total Orders</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Export Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Data</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Download your report data for {getTimeframeName(timeframe).toLowerCase()}
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export to Excel</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorReports;

