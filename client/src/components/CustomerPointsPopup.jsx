import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  X, 
  Star, 
  Gift, 
  TrendingUp, 
  Calendar,
  RefreshCw,
  Award,
  Coins
} from 'lucide-react';

const CustomerPointsPopup = ({ isOpen, onClose, customerId = null }) => {
  const { getAuthHeaders, user } = useAuth();
  const { success, error } = useNotification();
  
  const [pointsData, setPointsData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('balance');

  // Determine if we're viewing as admin or customer
  const isAdminView = user.role === 'admin' && customerId;
  const targetCustomerId = isAdminView ? customerId : user.id;

  useEffect(() => {
    if (isOpen) {
      fetchPointsData();
    }
  }, [isOpen, customerId]);

  const fetchPointsData = async () => {
    setLoading(true);
    try {
      let balanceEndpoint, transactionEndpoint;
      
      if (isAdminView) {
        // Admin viewing specific customer
        balanceEndpoint = `/api/customer-points/customer/${targetCustomerId}`;
        transactionEndpoint = `/api/customer-points/admin/${targetCustomerId}/transactions?limit=10`;
      } else {
        // Customer viewing their own points
        balanceEndpoint = '/api/customer-points/balance';
        transactionEndpoint = '/api/customer-points/transactions?limit=10';
      }

      const [balanceResponse, transactionResponse] = await Promise.all([
        fetch(balanceEndpoint, { headers: getAuthHeaders() }),
        fetch(transactionEndpoint, { headers: getAuthHeaders() })
      ]);

      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setPointsData(balanceData);
      }

      if (transactionResponse.ok) {
        const transactionData = await transactionResponse.json();
        setTransactions(transactionData.data || transactionData.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching points data:', err);
      error('Failed to load points data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'earned': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'refund': return <Gift className="h-4 w-4 text-healthcare-green-500" />;
      case 'refund_credit': return <Gift className="h-4 w-4 text-healthcare-green-500" />;
      case 'used': return <Coins className="h-4 w-4 text-orange-500" />;
      case 'expired': return <Calendar className="h-4 w-4 text-red-500" />;
      default: return <Star className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'earned': return 'text-green-600';
      case 'refund': return 'text-healthcare-green-600';
      case 'refund_credit': return 'text-healthcare-green-600';
      case 'used': return 'text-orange-600';
      case 'expired': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {isAdminView ? 'Customer Points' : 'My Points'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-healthcare-green-500" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setActiveTab('balance')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'balance'
                      ? 'bg-white dark:bg-gray-800 text-healthcare-green-600 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  Balance
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'history'
                      ? 'bg-white dark:bg-gray-800 text-healthcare-green-600 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  History
                </button>
              </div>

              {/* Balance Tab */}
              {activeTab === 'balance' && pointsData && (
                <div className="space-y-4">
                  {/* Available Points */}
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">Available Points</p>
                        <p className="text-3xl font-bold">
                          {pointsData.balance?.toLocaleString() || pointsData.availablePoints?.toLocaleString() || 0}
                        </p>
                      </div>
                      <Coins className="h-10 w-10 opacity-80" />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 dark:text-green-400">Total Earned</p>
                          <p className="text-xl font-semibold text-green-700 dark:text-green-300">
                            {pointsData.totalEarned?.toLocaleString() || pointsData.totalPoints?.toLocaleString() || 0}
                          </p>
                        </div>
                        <TrendingUp className="h-6 w-6 text-green-500" />
                      </div>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-orange-600 dark:text-orange-400">Total Used</p>
                          <p className="text-xl font-semibold text-orange-700 dark:text-orange-300">
                            {pointsData.totalUsed?.toLocaleString() || pointsData.usedPoints?.toLocaleString() || 0}
                          </p>
                        </div>
                        <Coins className="h-6 w-6 text-orange-500" />
                      </div>
                    </div>
                  </div>

                  {/* Conversion Rate Info */}
                  <div className="bg-healthcare-green-50 dark:bg-healthcare-green-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-healthcare-green-500" />
                      <div>
                        <p className="text-sm text-healthcare-green-600 dark:text-healthcare-green-400 font-medium">
                          Conversion Rate
                        </p>
                        <p className="text-xs text-healthcare-green-500 dark:text-healthcare-green-300">
                          {pointsData.pointConversionRate ? `1 BDT = ${pointsData.pointConversionRate} points` : '1 BDT = 10 points'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  {transactions.length > 0 ? (
                    transactions.map((transaction, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {transaction.description}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(transaction.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${getTransactionColor(transaction.type)}`}>
                            {transaction.type === 'used' || transaction.type === 'expired' ? '-' : '+'}
                            {Math.abs(transaction.points || transaction.pointsChange)?.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {transaction.type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <Star className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No transaction history yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Refresh Button */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={fetchPointsData}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-healthcare-green-600 text-white rounded-lg hover:bg-healthcare-green-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Data
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerPointsPopup;

