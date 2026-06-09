import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, Clock, AlertCircle, Heart, Pill, Users, BarChart3, Plus, Settings, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import MedicineManagement from './MedicineManagement';
import VendorOrderManagement from './VendorOrderManagement';
import VendorReports from './VendorReports';
import VendorReviews from './VendorReviews';
import DailyUpdates from './DailyUpdates';
import ProfileManagement from './ProfileManagement';
import TopBar from './TopBar';

const PharmacyVendorDashboard = () => {
  const { user, getAuthHeaders } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState({
    totalMedicines: 0,
    totalOrders: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    
    // Set up real-time refresh every 30 seconds for statistics
    const statsInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard stats...');
      fetchDashboardStats();
    }, 30000);

    return () => {
      clearInterval(statsInterval);
    };
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching dashboard stats for vendor:', user?.id);

      // Fetch vendor statistics
      const [statsResponse, medicinesResponse] = await Promise.all([
        fetch('/api/orders/vendor/stats?timeframe=30d', {
          headers: getAuthHeaders()
        }),
        fetch('/api/medicines/search?vendorId=' + user?.id, {
          headers: getAuthHeaders()
        })
      ]);

      let stats = { summary: {} };
      let medicines = { medicines: [] };

      if (statsResponse.ok) {
        stats = await statsResponse.json();
        console.log('✅ Stats fetched successfully:', stats);
      } else {
        const error = await statsResponse.text();
        console.error('❌ Failed to fetch stats:', statsResponse.status, error);
      }

      if (medicinesResponse.ok) {
        medicines = await medicinesResponse.json();
        console.log('✅ Medicines fetched successfully:', medicines.medicines?.length, 'items');
      } else {
        const error = await medicinesResponse.text();
        console.error('❌ Failed to fetch medicines:', medicinesResponse.status, error);
      }

      const newStats = {
        totalMedicines: medicines.medicines?.length || 0,
        totalOrders: stats.summary?.totalOrders || 0,
        pendingOrders: stats.summary?.pending || 0,
        lowStockItems: medicines.medicines?.filter(m => m.stockQuantity < 10).length || 0,
        totalRevenue: stats.summary?.totalRevenue || 0
      };

      console.log('📈 Dashboard stats updated:', newStats);
      setDashboardStats(newStats);

    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {t('vendorDashboard.overview') || 'Overview'}
            </button>
            <button
              onClick={() => setActiveTab('medicines')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'medicines'
                  ? 'border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {t('vendorDashboard.inventory') || 'Medicine Inventory'}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {t('vendorDashboard.orders') || 'Orders'}
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {t('vendorDashboard.reports') || 'Reports'}
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'reviews'
                  ? 'border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {t('vendorDashboard.vendorReviews') || 'Reviews'}
            </button>
            <button
              onClick={() => setActiveTab('daily-updates')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'daily-updates'
                  ? 'border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {t('vendorDashboard.dailyUpdates') || 'Daily Updates'}
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-green-600 to-healthcare-green-500 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
            <h2 className="text-3xl font-bold mb-2">{t('common.welcome')} {t('vendorDashboard.toMedZy')} {user?.firstName}!</h2>
            <p className="opacity-90 text-lg">{t('vendorDashboard.managePharmacy')}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {/* <button
                onClick={() => setActiveTab('medicines')}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-5 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 font-medium hover:scale-105 transform"
              >
                <Package className="h-4 w-4" />
                <span>Manage Inventory</span>
              </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-5 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 font-medium hover:scale-105 transform"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>View Orders</span>
                </button>
              <button
                onClick={() => setActiveTab('reports')}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-5 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 font-medium hover:scale-105 transform"
              >
                <BarChart3 className="h-4 w-4" />
                <span>View Reports</span>
              </button> */}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                  <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('vendorDashboard.products') || 'Products'}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '...' : dashboardStats.totalMedicines}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {dashboardStats.totalMedicines > 0 ? t('vendorDashboard.inInventory') || 'In inventory' : t('vendorDashboard.readyForInventory') || 'Ready for inventory'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center space-x-3">
                <div className="bg-healthcare-green-100 dark:bg-healthcare-green-900 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-healthcare-green-600 dark:text-healthcare-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('vendorDashboard.orders') || 'Orders'}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '...' : dashboardStats.totalOrders}</p>
                  <p className="text-xs text-healthcare-green-600 dark:text-healthcare-green-400">
                    {dashboardStats.totalOrders > 0 ? t('vendorDashboard.last30Days') || 'Last 30 days' : t('vendorDashboard.awaitingFirstOrder') || 'Awaiting first order'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('vendorDashboard.pending') || 'Pending'}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '...' : dashboardStats.pendingOrders}</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    {dashboardStats.pendingOrders > 0 ? t('vendorDashboard.needAttention') || 'Need attention' : t('vendorDashboard.noPendingOrders') || 'No pending orders'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center space-x-3">
                <div className="bg-red-100 dark:bg-red-900 p-3 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('vendorDashboard.lowStock') || 'Low Stock'}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '...' : dashboardStats.lowStockItems}</p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {dashboardStats.lowStockItems > 0 ? t('vendorDashboard.itemsNeedRestock') || 'Items need restock' : t('vendorDashboard.allItemsInStock') || 'All items in stock'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Summary */}
          {dashboardStats.totalRevenue > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-healthcare-green-50 dark:from-green-900/30 dark:to-healthcare-green-900/30 rounded-xl p-6 border dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">💰 {t('vendorDashboard.revenueSummary') || 'Revenue Summary'}</h3>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    ৳{dashboardStats.totalRevenue.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{t('vendorDashboard.totalRevenueLabel') || 'Total revenue (Last 30 days)'}</p>
                </div>
                <div className="text-right">
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                  >
                    {t('vendorDashboard.viewDetailedReports') || 'View Detailed Reports'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                 onClick={() => setActiveTab('medicines')}>
              <div className="text-center">
                <div className="bg-healthcare-green-100 dark:bg-healthcare-green-900 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-healthcare-green-600 dark:text-healthcare-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('vendorDashboard.manageInventory') || 'Manage Inventory'}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {t('vendorDashboard.addUpdateTrackMedicines') || 'Add, update, and track your medicine inventory'}
                </p>
                <div className="text-healthcare-green-600 dark:text-healthcare-green-400 font-medium">
                  {dashboardStats.totalMedicines} {t('vendorDashboard.medicinesInStock') || 'medicines in stock'}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                 onClick={() => setActiveTab('orders')}>
              <div className="text-center">
                <div className="bg-green-100 dark:bg-green-900 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('vendorDashboard.processOrders') || 'Process Orders'}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {t('vendorDashboard.viewManageOrders') || 'View and manage customer orders'}
                </p>
                <div className="text-green-600 dark:text-green-400 font-medium">
                  {dashboardStats.pendingOrders} {t('vendorDashboard.pendingOrdersLabel') || 'pending orders'}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                 onClick={() => setActiveTab('reports')}>
              <div className="text-center">
                <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('vendorDashboard.viewReports') || 'View Reports'}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {t('vendorDashboard.analyzeSalesPerformance') || 'Analyze sales and performance data'}
                </p>
                <div className="text-purple-600 dark:text-purple-400 font-medium">
                  ৳{dashboardStats.totalRevenue.toFixed(2)} {t('vendorDashboard.totalRevenueShort') || 'total revenue'}
                </div>
              </div>
            </div>
          </div>

          {/* Getting Started Guide */}
          {dashboardStats.totalMedicines === 0 && (
            <div className="bg-gradient-to-br from-white to-healthcare-green-50 dark:from-gray-800 dark:to-healthcare-green-900/30 rounded-xl shadow-sm border dark:border-gray-700 p-8">
              <div className="text-center">
                <div className="bg-healthcare-green-100 dark:bg-healthcare-green-900 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-10 w-10 text-healthcare-green-600 dark:text-healthcare-green-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">🏥 {t('vendorDashboard.pharmacyManagementSystem') || 'Pharmacy Management System'}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
                  {t('vendorDashboard.startManagingInventory') || 'Start managing your pharmacy inventory efficiently!'}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-3xl mx-auto mb-8">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-healthcare-green-200 dark:border-healthcare-green-700">
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                      <Pill className="h-4 w-4 mr-2 text-healthcare-green-600 dark:text-healthcare-green-400" />
                      💊 {t('vendorDashboard.inventoryManagement') || 'Inventory Management'}
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700 dark:text-gray-300">• {t('vendorDashboard.addManageMedicines') || 'Add and manage medicines'}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">• {t('vendorDashboard.trackStockLevels') || 'Track stock levels'}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">• {t('vendorDashboard.monitorExpiryDates') || 'Monitor expiry dates'}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">• {t('vendorDashboard.stockInOutTracking') || 'Stock in/out tracking'}</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-700">
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                      <Users className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                      👥 {t('vendorDashboard.featuresAvailable') || 'Features Available'}
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700 dark:text-gray-300">• {t('vendorDashboard.completeMedicineDatabase') || 'Complete medicine database'}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">• {t('vendorDashboard.realtimeStockUpdates') || 'Real-time stock updates'}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">• {t('vendorDashboard.lowStockAlerts') || 'Low stock alerts'}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">• {t('vendorDashboard.comprehensiveReporting') || 'Comprehensive reporting'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-healthcare-green-100 to-purple-100 dark:from-healthcare-green-900/50 dark:to-purple-900/50 p-6 rounded-xl border border-healthcare-green-200 dark:border-healthcare-green-700">
                  <p className="text-healthcare-green-800 dark:text-healthcare-green-200 font-medium mb-2">
                    🚀 <strong>{t('vendorDashboard.readyToStart') || 'Ready to Start'}:</strong> {t('vendorDashboard.medicineInventoryManagement') || 'Medicine Inventory Management'}
                  </p>
                  <p className="text-sm text-healthcare-green-700 dark:text-healthcare-green-300 mb-4">
                    {t('vendorDashboard.clickMedicineInventoryTab') || 'Click on "Medicine Inventory" tab to start adding your medicines and managing your pharmacy stock.'}
                  </p>
                  <div className="mt-4">
                    <button 
                      onClick={() => setActiveTab('medicines')}
                      className="bg-healthcare-green-600 dark:bg-healthcare-green-700 text-white px-6 py-2 rounded-lg hover:bg-healthcare-green-700 dark:hover:bg-healthcare-green-600 transition-colors font-medium"
                    >
                      📋 {t('vendorDashboard.startManagingInventoryBtn') || 'Start Managing Inventory'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'medicines' && <MedicineManagement />}

      {activeTab === 'orders' && <VendorOrderManagement />}

      {activeTab === 'reports' && <VendorReports />}

      {activeTab === 'reviews' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('vendorDashboard.myReviews') || 'My Reviews'}</h2>
          <VendorReviews />
        </div>
      )}

      {activeTab === 'daily-updates' && <DailyUpdates />}
    </div>
  );
};

export default PharmacyVendorDashboard;

