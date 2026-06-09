import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const MedicineRequestForm = () => {
  const [formData, setFormData] = useState({
    medicineName: '',
    quantity: '',
    reason: '',
    prescriptionImage: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { getAuthHeaders } = useAuth();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setFormData({
        ...formData,
        prescriptionImage: reader.result
      });
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const requestData = {
        ...formData,
        prescriptionImage: formData.prescriptionImage || undefined
      };
      
      const response = await axios.post('/api/medicine-requests', requestData, {
        headers: getAuthHeaders()
      });

      const data = response.data;
      setMessage('✅ Request submitted successfully! We will review your request shortly.');
      setFormData({
        medicineName: '',
        quantity: '',
        reason: '',
        prescriptionImage: ''
      });
    } catch (error) {
      console.error('Error submitting medicine request:', error);
      setMessage('❌ ' + (error.message || 'Error submitting request. Please try again.'));
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg dark:bg-gray-800">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Request Medicine as Needy Person</h2>
        <p className="text-gray-600 dark:text-gray-400">Please provide accurate information to help us process your request quickly.</p>
      </div>
      
      {message && (
        <div className={`p-4 mb-6 rounded-lg border ${
          message.includes('❌') 
            ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
            : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Medicine Name *
            </label>
            <input
              type="text"
              name="medicineName"
              value={formData.medicineName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-healthcare-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
              placeholder="Enter medicine name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Quantity Needed *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              required
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-healthcare-green-500 focus:ring-healthcare-green-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Reason for Request
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            required
            rows="3"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-healthcare-green-500 focus:ring-healthcare-green-500 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Upload Prescription (Optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-300"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You can optionally upload a prescription to support your request
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-healthcare-green-600 hover:bg-healthcare-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-healthcare-green-500 disabled:opacity-50"
        >
          {loading ? <LoadingSpinner /> : 'Submit Request'}
        </button>
      </form>
    </div>
  );
};

export default MedicineRequestForm;

