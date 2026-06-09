import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Filter, 
  Search,
  Eye,
  RefreshCw,
  DollarSign,
  User,
  Calendar,
  Settings,
  FileText,
  CreditCard,
  AlertCircle,
  Send,
  Plus
} from 'lucide-react';
import BkashRefund from './BkashRefund';

const AdminSupportManagement = () => {
  const { getAuthHeaders } = useAuth();
  const { success, error } = useNotification();
  
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    priority: '',
    category: '',
    search: ''
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Admin response form
  const [adminResponse, setAdminResponse] = useState('');
  const [resolutionForm, setResolutionForm] = useState({
    action: '',
    amount: '',
    details: '',
    internalNote: ''
  });

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [filters, pagination.page]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      
      // Remove empty filters
      Object.keys(filters).forEach(key => {
        if (!filters[key]) queryParams.delete(key);
      });

      const response = await fetch(`/api/support?${queryParams}`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (response.ok) {
        setTickets(data.tickets);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
      } else {
        error('Failed to fetch support tickets');
      }
    } catch (err) {
      error('Network error while fetching tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/support/stats', {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleTicketAction = async (ticketId, updateData) => {
    try {
      const response = await fetch(`/api/support/${ticketId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        success('Ticket updated successfully');
        fetchTickets();
        fetchStats();
        setShowTicketModal(false);
        setSelectedTicket(null);
        setAdminResponse('');
        setResolutionForm({ action: '', amount: '', details: '', internalNote: '' });
      } else {
        error('Failed to update ticket');
      }
    } catch (err) {
      error('Network error while updating ticket');
    }
  };

  const handleProcessRefund = async (ticketId, refundData) => {
    try {
      const response = await fetch(`/api/support/${ticketId}/process-refund`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(refundData)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        success(`Refund processed successfully! Amount: ৳${result.amount}`);
        fetchTickets();
        fetchStats();
        setShowRefundModal(false);
      } else {
        error(result.message || 'Failed to process refund');
      }
    } catch (err) {
      error('Network error while processing refund');
    }
  };

  const openTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setAdminResponse(ticket.adminResponse || '');
    setResolutionForm({
      action: ticket.resolutionAction || '',
      amount: ticket.resolutionAmount || '',
      details: ticket.resolutionDetails || '',
      internalNote: ''
    });
    setShowTicketModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-healthcare-green-100 text-healthcare-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'payment_issue': return 'bg-red-100 text-red-800';
      case 'complaint': return 'bg-orange-100 text-orange-800';
      case 'help': return 'bg-healthcare-green-100 text-healthcare-green-800';
      case 'suggestion': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT'
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Support Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage customer support tickets and payment issues</p>
        </div>
        <button
          onClick={() => {
            fetchTickets();
            fetchStats();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-healthcare-green-600 text-white rounded-lg hover:bg-healthcare-green-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Tickets</p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {stats.total || 0}
              </p>
            </div>
            <MessageCircle className="h-6 w-6 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Open</p>
              <p className="text-xl font-bold text-healthcare-green-600">
                {stats.open || 0}
              </p>
            </div>
            <Clock className="h-6 w-6 text-healthcare-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-xl font-bold text-yellow-600">
                {stats.inProgress || 0}
              </p>
            </div>
            <Settings className="h-6 w-6 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
              <p className="text-xl font-bold text-green-600">
                {stats.resolved || 0}
              </p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Payment Issues</p>
              <p className="text-xl font-bold text-red-600">
                {stats.paymentIssues || 0}
              </p>
            </div>
            <CreditCard className="h-6 w-6 text-red-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Urgent</p>
              <p className="text-xl font-bold text-red-600">
                {stats.urgent || 0}
              </p>
            </div>
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            <option value="">All Types</option>
            <option value="payment_issue">Payment Issue</option>
            <option value="complaint">Complaint</option>
            <option value="help">Help Request</option>
            <option value="suggestion">Suggestion</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            <option value="">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            <option value="">All Categories</option>
            <option value="payment">Payment</option>
            <option value="refund">Refund</option>
            <option value="billing">Billing</option>
            <option value="order">Order</option>
            <option value="technical">Technical</option>
            <option value="general">General</option>
          </select>

          <button
            onClick={() => setFilters({ status: '', type: '', priority: '', category: '', search: '' })}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Support Tickets</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin text-healthcare-green-600 mr-2" />
                      Loading tickets...
                    </div>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No tickets found
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {ticket.customerName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {ticket.customerEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-800 dark:text-gray-200 max-w-xs">
                        <div className="font-medium truncate">{ticket.subject}</div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs truncate">
                          {ticket.message}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(ticket.type)}`}>
                        {ticket.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ticket.relatedPayment ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-800 dark:text-gray-200">
                            {formatCurrency(ticket.relatedPayment.amount)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {ticket.relatedPayment.paymentMethod?.toUpperCase()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openTicketModal(ticket)}
                          className="text-healthcare-green-600 hover:text-healthcare-green-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {ticket.relatedPayment && ticket.type === 'payment_issue' && (
                          <button
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowRefundModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Process Refund"
                          >
                            <DollarSign className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Support Ticket Details
              </h2>
              <button
                onClick={() => setShowTicketModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Ticket Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {selectedTicket.customerName} ({selectedTicket.customerEmail})
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Created</label>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {new Date(selectedTicket.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
                <p className="text-sm text-gray-800 dark:text-gray-200">{selectedTicket.subject}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {selectedTicket.message}
                </p>
              </div>

              {/* Payment Info */}
              {selectedTicket.relatedPayment && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Related Payment</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Transaction ID</label>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {selectedTicket.relatedPayment.transactionId}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {formatCurrency(selectedTicket.relatedPayment.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Refund Request */}
              {selectedTicket.requestedRefundAmount && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Refund Requested
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-yellow-700 dark:text-yellow-300">Amount</label>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        {formatCurrency(selectedTicket.requestedRefundAmount)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-yellow-700 dark:text-yellow-300">Reason</label>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        {selectedTicket.refundReason || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Response */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin Response
                </label>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  placeholder="Enter your response to the customer..."
                />
              </div>

              {/* Resolution Form */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Resolution</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action</label>
                    <select
                      value={resolutionForm.action}
                      onChange={(e) => setResolutionForm(prev => ({ ...prev, action: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    >
                      <option value="">Select Action</option>
                      <option value="refund_approved">Approve Refund</option>
                      <option value="refund_rejected">Reject Refund</option>
                      <option value="partial_refund">Partial Refund</option>
                      <option value="replacement">Replacement</option>
                      <option value="store_credit">Store Credit</option>
                    </select>
                  </div>

                  {(resolutionForm.action === 'refund_approved' || 
                    resolutionForm.action === 'partial_refund' || 
                    resolutionForm.action === 'store_credit') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                      <input
                        type="number"
                        value={resolutionForm.amount}
                        onChange={(e) => setResolutionForm(prev => ({ ...prev, amount: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        placeholder="Enter amount"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => setSelectedTicket(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resolution Details</label>
                    <textarea
                      value={resolutionForm.details}
                      onChange={(e) => setResolutionForm(prev => ({ ...prev, details: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      placeholder="Enter resolution details..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Internal Note</label>
                    <textarea
                      value={resolutionForm.internalNote}
                      onChange={(e) => setResolutionForm(prev => ({ ...prev, internalNote: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      placeholder="Internal note (not visible to customer)..."
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                
                <button
                  onClick={() => handleTicketAction(selectedTicket.id, {
                    status: selectedTicket.status,
                    adminResponse: adminResponse,
                    resolutionAction: resolutionForm.action,
                    resolutionAmount: resolutionForm.amount,
                    resolutionDetails: resolutionForm.details,
                    internalNote: resolutionForm.internalNote
                  })}
                  className="px-4 py-2 bg-healthcare-green-600 text-white rounded-md hover:bg-healthcare-green-700 flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Update Ticket
                </button>
                
                {selectedTicket.relatedPayment && resolutionForm.action === 'refund_approved' && (
                  <button
                    onClick={() => {
                      setShowTicketModal(false);
                      setShowRefundModal(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    Process Refund
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedTicket?.relatedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                Process Refund
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Customer: {selectedTicket.customerName}
              </p>
            </div>

            {selectedTicket.relatedPayment.paymentMethod === 'bkash' ? (
              <BkashRefund
                payment={selectedTicket.relatedPayment}
                onSuccess={(data) => {
                  success(`Refund processed successfully! Amount: ৳${data.amount}`);
                  setShowRefundModal(false);
                  fetchTickets();
                  fetchStats();
                }}
                onError={(message) => {
                  error(message);
                }}
                onCancel={() => setShowRefundModal(false)}
              />
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Payment Details</h4>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-semibold">{formatCurrency(selectedTicket.relatedPayment.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Method:</span>
                      <span className="font-semibold">
                        {selectedTicket.relatedPayment.paymentMethod?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    This is a {selectedTicket.relatedPayment.paymentMethod} payment. Manual refund processing required.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleProcessRefund(selectedTicket.id, {
                      amount: selectedTicket.requestedRefundAmount || selectedTicket.relatedPayment.amount,
                      reason: selectedTicket.refundReason || 'Support ticket refund',
                      refundMethod: 'manual'
                    })}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg"
                  >
                    Process Manual Refund
                  </button>

                  <button
                    onClick={() => setShowRefundModal(false)}
                    className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupportManagement;

