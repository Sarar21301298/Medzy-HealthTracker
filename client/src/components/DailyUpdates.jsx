import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Filter, 
  Heart, 
  Eye, 
  Clock, 
  Plus, 
  Search,
  Bookmark,
  AlertCircle,
  TrendingUp,
  Globe,
  Droplets,
  X,
  Edit3,
  Trash2,
  Sparkles,
  Bell,
  Tag,
  User,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Modal from './Modal';

const DailyUpdates = () => {
  const { user, getAuthHeaders } = useAuth();
  const { showNotification } = useNotification();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: 'all',
    priority: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'medical_news',
    priority: 'medium',
    tags: ''
  });

  const categoryOptions = [
    { value: 'all', label: 'All Updates', icon: Globe, color: 'text-gray-600', bgColor: 'bg-gray-100', borderColor: 'border-gray-200' },
    { value: 'blood_availability', label: 'Blood Availability', icon: Droplets, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
    { value: 'website_improvements', label: 'Website Updates', icon: TrendingUp, color: 'text-healthcare-green-600', bgColor: 'bg-healthcare-green-50', borderColor: 'border-healthcare-green-200' },
    { value: 'medical_news', label: 'Medical News', icon: AlertCircle, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', dotColor: 'bg-gray-400' },
    { value: 'medium', label: 'Medium', color: 'bg-healthcare-green-100 text-healthcare-green-800 dark:bg-healthcare-green-900 dark:text-healthcare-green-300', dotColor: 'bg-healthcare-green-500' },
    { value: 'high', label: 'High', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', dotColor: 'bg-yellow-500' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', dotColor: 'bg-red-500' }
  ];

  useEffect(() => {
    fetchUpdates();
  }, [filters, pagination.currentPage]);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        category: filters.category,
        priority: filters.priority,
        search: filters.search,
        page: pagination.currentPage,
        limit: 10
      });

      console.log('🔍 Fetching updates with params:', queryParams.toString());
      const response = await fetch(`/api/daily-updates?${queryParams}`);
      console.log('📡 API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 API Response data:', data);
        setUpdates(data.updates || []);
        setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
      } else {
        console.error('❌ API Error:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('❌ Error details:', errorData);
      }
    } catch (error) {
      console.error('❌ Network Error fetching updates:', error);
      showNotification('Failed to fetch updates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUpdate = async (e) => {
    e.preventDefault();
    try {
      const headers = getAuthHeaders();
      const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
      
      console.log('📝 Creating update with data:', { ...formData, tags: tagsArray });
      console.log('🔑 Using headers:', headers);
      
      const response = await fetch('/api/daily-updates', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...formData,
          tags: tagsArray
        })
      });

      console.log('📡 Create response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Create success:', result);
        showNotification('🎉 Update published successfully!', 'success');
        setShowCreateModal(false);
        resetForm();
        // Force refresh the updates list
        setTimeout(() => {
          console.log('🔄 Refreshing updates list...');
          fetchUpdates();
        }, 500);
      } else {
        const error = await response.json();
        console.error('❌ Create error:', error);
        showNotification(error.message || 'Failed to create update', 'error');
      }
    } catch (error) {
      console.error('❌ Network error creating update:', error);
      showNotification('Failed to create update', 'error');
    }
  };

  const handleUpdateEdit = async (e) => {
    e.preventDefault();
    try {
      const headers = getAuthHeaders();
      const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
      
      const response = await fetch(`/api/daily-updates/${editingUpdate._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          ...formData,
          tags: tagsArray
        })
      });

      if (response.ok) {
        showNotification('✅ Update modified successfully!', 'success');
        setEditingUpdate(null);
        resetForm();
        fetchUpdates();
      } else {
        const error = await response.json();
        showNotification(error.message || 'Failed to update', 'error');
      }
    } catch (error) {
      console.error('Error updating:', error);
      showNotification('Failed to update', 'error');
    }
  };

  const handleLike = async (updateId) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`/api/daily-updates/${updateId}/like`, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        fetchUpdates(); // Refresh to show updated like count
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleDelete = async (updateId) => {
    if (!window.confirm('Are you sure you want to delete this update?')) return;
    
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`/api/daily-updates/${updateId}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        showNotification('🗑️ Update deleted successfully', 'success');
        fetchUpdates();
      } else {
        const error = await response.json();
        showNotification(error.message || 'Failed to delete update', 'error');
      }
    } catch (error) {
      console.error('Error deleting update:', error);
      showNotification('Failed to delete update', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'medical_news',
      priority: 'medium',
      tags: ''
    });
  };

  const getCategoryConfig = (category) => {
    return categoryOptions.find(opt => opt.value === category) || categoryOptions[0];
  };

  const getCategoryIcon = (category) => {
    const config = getCategoryConfig(category);
    const IconComponent = config.icon;
    return <IconComponent className={`h-5 w-5 ${config.color}`} />;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = priorityOptions.find(opt => opt.value === priority);
    if (!priorityConfig) return null;
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${priorityConfig?.color || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
        <div className={`w-2 h-2 rounded-full ${priorityConfig?.dotColor || 'bg-gray-400'}`}></div>
        {priorityConfig?.label || priority}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today • ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 2) {
      return 'Yesterday • ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const startEdit = (update) => {
    setEditingUpdate(update);
    setFormData({
      title: update.title,
      content: update.content,
      category: update.category,
      priority: update.priority,
      tags: update.tags.join(', ')
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-healthcare-green-600"></div>
          <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border dark:border-gray-700 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-healthcare-green-100 to-green-100 dark:from-healthcare-green-900/20 dark:to-green-900/20 rounded-full -mr-16 -mt-16 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full -ml-12 -mb-12 opacity-50"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-r from-healthcare-green-600 to-green-500 p-2 rounded-xl">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              Daily Updates
              <Sparkles className="h-6 w-6 text-yellow-500" />
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Stay informed with the latest health updates, blood availability, and platform improvements
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Bell className="h-4 w-4" />
                <span>{updates.length} active updates</span>
              </div>
            </div>
          </div>
          
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-healthcare-green-600 to-green-500 hover:from-healthcare-green-700 hover:to-green-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Create Update
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border dark:border-gray-700 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter Updates</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Updates
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search title, content, or tags..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 dark:bg-gray-700 dark:text-white transition-colors"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 dark:bg-gray-700 dark:text-white transition-colors"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 dark:bg-gray-700 dark:text-white transition-colors"
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ category: 'all', priority: 'all', search: '' })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Updates List */}
      <div className="space-y-6">
        {updates.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-lg border dark:border-gray-700 text-center">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-4 w-16 h-16 mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No updates found
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              No updates match your current filters. Try adjusting your search criteria.
            </p>
          </div>
        ) : (
          updates.map((update) => {
            const categoryConfig = getCategoryConfig(update.category);
            return (
              <div 
                key={update._id} 
                className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-l-4 ${categoryConfig.borderColor} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`${categoryConfig.bgColor} ${categoryConfig.color} p-3 rounded-xl flex-shrink-0`}>
                      {getCategoryIcon(update.category)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {update.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(update.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {update.viewCount} views
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {update.author?.name || 'Admin'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getPriorityBadge(update.priority)}
                    {user?.role === 'admin' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(update)}
                          className="p-2 text-healthcare-green-600 hover:bg-healthcare-green-100 dark:hover:bg-healthcare-green-900 rounded-lg transition-colors duration-200"
                          title="Edit update"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(update._id)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors duration-200"
                          title="Delete update"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {update.content}
                  </p>
                </div>

                {update.tags && update.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {update.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-healthcare-green-100 dark:bg-healthcare-green-900/50 text-healthcare-green-700 dark:text-healthcare-green-300 text-xs rounded-full font-medium"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-6">
                    {user && (
                      <button
                        onClick={() => handleLike(update._id)}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 group"
                      >
                        <Heart 
                          className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                            update.likes?.some(like => like.user === user.id) 
                              ? 'fill-red-500 text-red-500' 
                              : ''
                          }`} 
                        />
                        <span className="text-sm font-medium">{update.likeCount || 0} likes</span>
                      </button>
                    )}
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm">Update #{update._id.slice(-6)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Enhanced Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border dark:border-gray-700 mt-8">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalItems)} of {pagination.totalItems} updates
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                disabled={pagination.currentPage === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Previous
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Create/Edit Update Modal */}
      <Modal
        isOpen={showCreateModal || editingUpdate}
        onClose={() => {
          setShowCreateModal(false);
          setEditingUpdate(null);
          resetForm();
        }}
        title={
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-healthcare-green-600 to-green-500 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            {editingUpdate ? 'Edit Daily Update' : 'Create Daily Update'}
          </div>
        }
      >
        <form onSubmit={editingUpdate ? handleUpdateEdit : handleCreateUpdate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Update Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              maxLength={200}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="Enter an engaging title for your update..."
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.title.length}/200 characters
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              maxLength={1000}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 dark:bg-gray-700 dark:text-white transition-colors resize-none"
              placeholder="Write your update content here. Be clear and informative..."
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.content.length}/1000 characters
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 dark:bg-gray-700 dark:text-white transition-colors"
              >
                {categoryOptions.slice(1).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 dark:bg-gray-700 dark:text-white transition-colors"
              >
                {priorityOptions.slice(1).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="e.g., urgent, announcement, health, blood-bank"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Separate multiple tags with commas. Tags help users find relevant updates.
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setEditingUpdate(null);
                resetForm();
              }}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-healthcare-green-600 to-green-500 hover:from-healthcare-green-700 hover:to-green-600 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {editingUpdate ? 'Update' : 'Publish'} Update
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DailyUpdates;

