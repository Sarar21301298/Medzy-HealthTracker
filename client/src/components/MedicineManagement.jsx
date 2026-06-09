import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Eye,
  RefreshCw,
  Pill,
  Image,
  Upload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from './LoadingSpinner';
import Modal from './Modal';

const MedicineManagement = () => {
  console.log('🚀 MedicineManagement component loaded');
  
  const { user, getAuthHeaders } = useAuth();
  const { showNotification } = useNotification();
  
  console.log('👤 User:', user);
  console.log('🔔 showNotification function:', typeof showNotification);
  
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const addImageInputRef = useRef(null);
  const editImageInputRef = useRef(null);

  const API_BASE_URL = '/api';

  const resolveImageUrl = useCallback((imageUrl) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }

    if (imageUrl.startsWith('/uploads/')) {
      const backendBaseUrl = API_BASE_URL.replace('/api', '');
      return `${backendBaseUrl}${imageUrl}`;
    }

    return imageUrl;
  }, [API_BASE_URL]);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    manufacturer: '',
    category: 'Tablet',
    description: '',
    price: '',
    stockQuantity: '',
    minStockLevel: '10',
    expiryDate: '',
    batchNumber: '',
    prescriptionRequired: false,
    dosage: '',
    sideEffects: '',
    imageUrl: '',
    tags: []
  });

  const [stockFormData, setStockFormData] = useState({
    quantity: '',
    type: 'in',
    reason: ''
  });

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/medicines/data/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        showNotification('Please login to access medicine inventory', 'error');
        return;
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        category: selectedCategory,
        sortBy,
        sortOrder
      });

      console.log('Fetching medicines with token:', token ? 'Present' : 'Missing');

      const response = await fetch(`${API_BASE_URL}/medicines/vendor-medicines?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched medicines data:', data);
        setMedicines(data.medicines);
        setStats(data.stats);
        setPagination(data.pagination);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch medicines' }));
        console.error('Error response:', errorData);
        showNotification(errorData.message || 'Failed to fetch medicines', 'error');
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
      showNotification('Network error while fetching medicines', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 useEffect for fetchMedicines triggered');
    fetchMedicines();
  }, [currentPage, searchTerm, selectedCategory, sortBy, sortOrder]);

  useEffect(() => {
    console.log('🔄 useEffect for fetchCategories triggered');
    fetchCategories();
  }, []);

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        showNotification('Please login to add medicines', 'error');
        return;
      }

      console.log('Adding medicine with token:', token ? 'Present' : 'Missing');
      console.log('Form data:', formData);

      const response = await fetch(`${API_BASE_URL}/medicines`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      console.log('Add medicine response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Medicine added successfully:', data);
        showNotification('Medicine added successfully', 'success');
        setShowAddModal(false);
        resetForm();
        fetchMedicines();
      } else {
        const error = await response.json().catch(() => ({ message: 'Failed to add medicine' }));
        console.error('Add medicine error:', error);
        showNotification(error.message || 'Failed to add medicine', 'error');
      }
    } catch (error) {
      console.error('Error adding medicine:', error);
      showNotification('Network error while adding medicine', 'error');
    }
  };

  const handleEditMedicine = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/medicines/${selectedMedicine._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showNotification('Medicine updated successfully', 'success');
        setShowEditModal(false);
        resetForm();
        fetchMedicines();
      } else {
        const error = await response.json();
        showNotification(error.message || 'Failed to update medicine', 'error');
      }
    } catch (error) {
      console.error('Error updating medicine:', error);
      showNotification('Error updating medicine', 'error');
    }
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/medicines/${selectedMedicine._id}/stock`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stockFormData)
      });

      if (response.ok) {
        showNotification('Stock updated successfully', 'success');
        setShowStockModal(false);
        setStockFormData({ quantity: '', type: 'in', reason: '' });
        fetchMedicines();
      } else {
        const error = await response.json();
        showNotification(error.message || 'Failed to update stock', 'error');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      showNotification('Error updating stock', 'error');
    }
  };

  const handleDeleteMedicine = async (medicineId) => {
    if (!confirm('Are you sure you want to delete this medicine?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/medicines/${medicineId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showNotification('Medicine deleted successfully', 'success');
        fetchMedicines();
      } else {
        const error = await response.json();
        showNotification(error.message || 'Failed to delete medicine', 'error');
      }
    } catch (error) {
      console.error('Error deleting medicine:', error);
      showNotification('Error deleting medicine', 'error');
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('Please login to upload images', 'error');
        return;
      }

      setIsUploadingImage(true);
      const uploadData = new FormData();
      uploadData.append('image', file);

      const authHeaders = getAuthHeaders ? getAuthHeaders() : {};
      const authorization = authHeaders.Authorization || authHeaders.authorization || '';

      const response = await fetch(`${API_BASE_URL}/medicines/upload-image`, {
        method: 'POST',
        headers: {
          ...(authorization ? { Authorization: authorization } : { Authorization: `Bearer ${token}` })
        },
        body: uploadData
      });

      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { message: responseText };
      }

      if (!response.ok) {
        showNotification(data.message || responseText || 'Failed to upload image', 'error');
        return;
      }

      setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
      showNotification('Medicine image uploaded successfully', 'success');
    } catch (error) {
      console.error('Error uploading medicine image:', error);
      showNotification('Network error while uploading image', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const triggerImagePicker = (mode = 'add') => {
    const input = mode === 'edit' ? editImageInputRef.current : addImageInputRef.current;
    if (input) {
      input.click();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      genericName: '',
      manufacturer: '',
      category: 'Tablet',
      description: '',
      price: '',
      stockQuantity: '',
      minStockLevel: '10',
      expiryDate: '',
      batchNumber: '',
      prescriptionRequired: false,
      dosage: '',
      sideEffects: '',
      imageUrl: '',
      tags: []
    });
  };

  const openEditModal = (medicine) => {
    setSelectedMedicine(medicine);
    setFormData({
      name: medicine.name,
      genericName: medicine.genericName,
      manufacturer: medicine.manufacturer,
      category: medicine.category,
      description: medicine.description,
      price: medicine.price.toString(),
      stockQuantity: medicine.stockQuantity.toString(),
      minStockLevel: medicine.minStockLevel.toString(),
      expiryDate: medicine.expiryDate.split('T')[0],
      batchNumber: medicine.batchNumber,
      prescriptionRequired: medicine.prescriptionRequired,
      dosage: medicine.dosage,
      sideEffects: medicine.sideEffects || '',
      imageUrl: medicine.imageUrl || '',
      tags: medicine.tags || []
    });
    setShowEditModal(true);
  };

  const openStockModal = (medicine) => {
    setSelectedMedicine(medicine);
    setShowStockModal(true);
  };

  const openDetailsModal = (medicine) => {
    setSelectedMedicine(medicine);
    setShowDetailsModal(true);
  };

  const getStockStatusColor = (medicine) => {
    if (medicine.stockQuantity === 0) return 'text-red-600 bg-red-100';
    if (medicine.stockQuantity <= medicine.minStockLevel) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getExpiryStatusColor = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    if (expiry < now) return 'text-red-600 bg-red-100';
    if (expiry <= thirtyDaysFromNow) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Debug render
  console.log('🎨 Rendering MedicineManagement with:', {
    medicines: medicines.length,
    stats,
    loading,
    user: user?.role
  });

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-healthcare-green-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2"> Medicine Inventory</h2>
            <p className="opacity-90">Manage your pharmacy stock efficiently</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 font-medium hover:scale-105 transform"
          >
            <Plus className="h-5 w-5" />
            <span>Add Medicine</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span className="text-sm font-medium">Total Medicines</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalMedicines || 0}</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-medium">Total Stock</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalStock || 0}</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">Low Stock</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.lowStockCount || 0}</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span className="text-sm font-medium">Expiring Soon</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.expiringSoonCount || 0}</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5" />
              <span className="text-sm font-medium">Expired</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.expiredCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="stockQuantity-asc">Stock Low-High</option>
              <option value="stockQuantity-desc">Stock High-Low</option>
              <option value="price-asc">Price Low-High</option>
              <option value="price-desc">Price High-Low</option>
            </select>
            
            <button
              onClick={fetchMedicines}
              className="p-2 text-gray-500 hover:text-healthcare-green-600 hover:bg-healthcare-green-50 rounded-lg transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Medicines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medicines.map((medicine) => (
          <div key={medicine._id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow">
            {medicine.imageUrl ? (
              <div className="mb-4 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <img
                  src={resolveImageUrl(medicine.imageUrl)}
                  alt={medicine.name}
                  className="w-full h-40 object-contain"
                />
              </div>
            ) : (
              <div className="mb-4 h-40 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center space-x-2 text-sm">
                  <Image className="h-4 w-4" />
                  <span>No image</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">{medicine.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{medicine.genericName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{medicine.manufacturer}</p>
              </div>
              <span className="bg-healthcare-green-100 dark:bg-healthcare-green-900 text-healthcare-green-800 dark:text-healthcare-green-200 text-xs font-medium px-2 py-1 rounded">
                {medicine.category}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Price:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">৳{medicine.price}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Stock:</span>
                <span className={`text-sm font-medium px-2 py-1 rounded ${getStockStatusColor(medicine)}`}>
                  {medicine.stockQuantity} units
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Expires:</span>
                <span className={`text-xs font-medium px-2 py-1 rounded ${getExpiryStatusColor(medicine.expiryDate)}`}>
                  {new Date(medicine.expiryDate).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Batch:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{medicine.batchNumber}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => openDetailsModal(medicine)}
                className="flex-1 bg-healthcare-green-50 dark:bg-healthcare-green-900 text-healthcare-green-600 dark:text-healthcare-green-300 py-2 px-3 rounded-lg hover:bg-healthcare-green-100 dark:hover:bg-healthcare-green-800 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
              >
                <Eye className="h-4 w-4" />
                <span>View</span>
              </button>
              <button
                onClick={() => openStockModal(medicine)}
                className="flex-1 bg-green-50 text-green-600 py-2 px-3 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Stock</span>
              </button>
              <button
                onClick={() => openEditModal(medicine)}
                className="bg-yellow-50 text-yellow-600 py-2 px-3 rounded-lg hover:bg-yellow-100 transition-colors"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteMedicine(medicine._id)}
                className="bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={!pagination.hasPrevPage}
            className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
            disabled={!pagination.hasNextPage}
            className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Add Medicine Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add New Medicine"
      >
        <form onSubmit={handleAddMedicine} className="space-y-6">
          {/* Basic Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Pill className="h-5 w-5 mr-2 text-healthcare-green-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medicine Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Paracetamol"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generic Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.genericName}
                  onChange={(e) => setFormData({...formData, genericName: e.target.value})}
                  placeholder="e.g., Acetaminophen"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manufacturer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                  placeholder="e.g., Johnson & Johnson"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 transition-colors"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Detailed description of the medicine, its uses, and benefits"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 transition-colors"
                rows="3"
                required
              />
            </div>
          </div>

          {/* Pricing & Stock Section */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Pricing & Stock Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (৳) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">৳</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 transition-colors"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Initial Stock</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Number of units to add initially</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Stock Alert</label>
                <input
                  type="number"
                  min="0"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData({...formData, minStockLevel: e.target.value})}
                  placeholder="10"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Alert when stock goes below this level</p>
              </div>
            </div>
          </div>

          {/* Product Details Section */}
          <div className="bg-healthcare-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-healthcare-green-600" />
              Product Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                  placeholder="e.g., BT2024001"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dosage <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                  placeholder="e.g., 500mg, 10ml, 1 tablet"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 transition-colors"
                  required
                />
              </div>
              
              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="prescriptionRequired"
                  checked={formData.prescriptionRequired}
                  onChange={(e) => setFormData({...formData, prescriptionRequired: e.target.checked})}
                  className="mr-3 h-4 w-4 text-healthcare-green-600 focus:ring-healthcare-green-500 border-gray-300 rounded"
                />
                <label htmlFor="prescriptionRequired" className="text-sm font-medium text-gray-700 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1 text-orange-500" />
                  Prescription Required
                </label>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Side Effects (Optional)</label>
              <textarea
                value={formData.sideEffects}
                onChange={(e) => setFormData({...formData, sideEffects: e.target.value})}
                placeholder="List any known side effects, contraindications, or warnings"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 transition-colors"
                rows="3"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Medicine Picture (Optional)</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="Paste image URL or upload below"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 transition-colors"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => triggerImagePicker('add')}
                  disabled={isUploadingImage}
                  className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  <span>{isUploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                </button>
                <input
                  ref={addImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploadingImage}
                  onChange={(e) => {
                    handleImageUpload(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </div>

              {formData.imageUrl && (
                <div className="mt-3 rounded-lg border border-gray-200 overflow-hidden bg-white">
                  <img
                    src={resolveImageUrl(formData.imageUrl)}
                    alt="Medicine preview"
                    className="w-full h-40 object-contain"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              className="px-6 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-healthcare-green-600 text-white rounded-lg hover:bg-healthcare-green-700 transition-colors font-medium flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Medicine</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Medicine Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
          setSelectedMedicine(null);
        }}
        title="Edit Medicine"
      >
        <form onSubmit={handleEditMedicine} className="space-y-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name *</label>
              <input
                type="text"
                value={formData.genericName}
                onChange={(e) => setFormData({...formData, genericName: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer *</label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (৳) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
              <input
                type="number"
                min="0"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({...formData, minStockLevel: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number *</label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosage *</label>
              <input
                type="text"
                value={formData.dosage}
                onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                placeholder="e.g., 500mg"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
              rows="3"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Side Effects</label>
            <textarea
              value={formData.sideEffects}
              onChange={(e) => setFormData({...formData, sideEffects: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
              rows="2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Picture</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="Paste image URL or upload below"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
            />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => triggerImagePicker('edit')}
                disabled={isUploadingImage}
                className="inline-flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                <span>{isUploadingImage ? 'Uploading...' : 'Upload Image'}</span>
              </button>
              <input
                ref={editImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploadingImage}
                onChange={(e) => {
                  handleImageUpload(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>

            {formData.imageUrl && (
              <div className="mt-3 rounded-lg border border-gray-200 overflow-hidden bg-white">
                <img
                  src={resolveImageUrl(formData.imageUrl)}
                  alt="Medicine preview"
                  className="w-full h-36 object-contain"
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="editPrescriptionRequired"
              checked={formData.prescriptionRequired}
              onChange={(e) => setFormData({...formData, prescriptionRequired: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="editPrescriptionRequired" className="text-sm text-gray-700">
              Prescription Required
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                resetForm();
                setSelectedMedicine(null);
              }}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-healthcare-green-600 text-white rounded-lg hover:bg-healthcare-green-700"
            >
              Update Medicine
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Update Modal */}
      <Modal
        isOpen={showStockModal}
        onClose={() => {
          setShowStockModal(false);
          setStockFormData({ quantity: '', type: 'in', reason: '' });
          setSelectedMedicine(null);
        }}
        title={`Update Stock - ${selectedMedicine?.name}`}
      >
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Current Stock: <span className="font-semibold">{selectedMedicine?.stockQuantity} units</span>
          </p>
        </div>

        <form onSubmit={handleUpdateStock} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
            <select
              value={stockFormData.type}
              onChange={(e) => setStockFormData({...stockFormData, type: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
            >
              <option value="in">Stock In (Add)</option>
              <option value="out">Stock Out (Remove)</option>
              <option value="expired">Expired (Remove)</option>
              <option value="damaged">Damaged (Remove)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              value={stockFormData.quantity}
              onChange={(e) => setStockFormData({...stockFormData, quantity: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <input
              type="text"
              value={stockFormData.reason}
              onChange={(e) => setStockFormData({...stockFormData, reason: e.target.value})}
              placeholder="Optional reason for stock update"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowStockModal(false);
                setStockFormData({ quantity: '', type: 'in', reason: '' });
                setSelectedMedicine(null);
              }}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Update Stock
            </button>
          </div>
        </form>
      </Modal>

      {/* Medicine Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedMedicine(null);
        }}
        title="Medicine Details"
      >
        {selectedMedicine && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Medicine Picture</label>
                {selectedMedicine.imageUrl ? (
                  <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden bg-white">
                    <img
                      src={resolveImageUrl(selectedMedicine.imageUrl)}
                      alt={selectedMedicine.name}
                      className="w-full h-48 object-contain"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">No image uploaded</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Medicine Name</label>
                <p className="text-sm text-gray-900">{selectedMedicine.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Generic Name</label>
                <p className="text-sm text-gray-900">{selectedMedicine.genericName}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                <p className="text-sm text-gray-900">{selectedMedicine.manufacturer}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <p className="text-sm text-gray-900">{selectedMedicine.category}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <p className="text-sm text-gray-900">৳{selectedMedicine.price}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Stock</label>
                <p className={`text-sm font-medium ${getStockStatusColor(selectedMedicine).replace('bg-', '').split(' ')[0]}`}>
                  {selectedMedicine.stockQuantity} units
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Min Stock Level</label>
                <p className="text-sm text-gray-900">{selectedMedicine.minStockLevel} units</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                <p className={`text-sm font-medium ${getExpiryStatusColor(selectedMedicine.expiryDate).replace('bg-', '').split(' ')[0]}`}>
                  {new Date(selectedMedicine.expiryDate).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                <p className="text-sm text-gray-900">{selectedMedicine.batchNumber}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Dosage</label>
                <p className="text-sm text-gray-900">{selectedMedicine.dosage}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Prescription Required</label>
                <p className="text-sm text-gray-900">{selectedMedicine.prescriptionRequired ? 'Yes' : 'No'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Added On</label>
                <p className="text-sm text-gray-900">{new Date(selectedMedicine.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <p className="text-sm text-gray-900">{selectedMedicine.description}</p>
            </div>
            
            {selectedMedicine.sideEffects && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Side Effects</label>
                <p className="text-sm text-gray-900">{selectedMedicine.sideEffects}</p>
              </div>
            )}

            {/* Stock History */}
            {selectedMedicine.stockHistory && selectedMedicine.stockHistory.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recent Stock History</label>
                <div className="max-h-32 overflow-y-auto">
                  {selectedMedicine.stockHistory
                    .slice()
                    .reverse()
                    .slice(0, 5)
                    .map((entry, index) => (
                      <div key={index} className="flex justify-between items-center py-1 border-b border-gray-100">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            entry.type === 'in' ? 'bg-green-100 text-green-800' :
                            entry.type === 'out' ? 'bg-healthcare-green-100 text-healthcare-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {entry.type.toUpperCase()}
                          </span>
                          <span className="text-sm">{entry.quantity} units</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(entry.date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MedicineManagement;

