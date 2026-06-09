import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const MedicineSearchTest = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, getAuthHeaders } = useAuth();
  const { success, error } = useNotification();

  console.log('MedicineSearchTest - Current user:', user);
  console.log('MedicineSearchTest - getAuthHeaders function:', typeof getAuthHeaders);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    console.log('🔍 Fetching medicines...');
    setLoading(true);
    try {
      const response = await fetch('/api/medicines/search');
      console.log('API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response data:', data);
        setMedicines(data.medicines || []);
        console.log('Medicines set:', data.medicines?.length || 0);
      } else {
        console.error('API Error:', response.status, response.statusText);
        error('Failed to fetch medicines');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      error('Failed to fetch medicines');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (medicine) => {
    console.log('🛒 Add to cart clicked for:', medicine.name);
    console.log('User logged in:', !!user);
    console.log('Medicine available:', medicine.isAvailable);

    if (!user) {
      console.log('❌ User not logged in');
      error('Please login to add items to cart');
      return;
    }

    try {
      console.log('📦 Sending add to cart request...');
      const headers = getAuthHeaders();
      console.log('Auth headers:', headers);

      // Check if headers are valid
      if (!headers.Authorization) {
        console.log('❌ No authorization headers');
        error('Authentication error. Please refresh the page or login again.');
        return;
      }

      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          medicineId: medicine._id,
          quantity: 1
        })
      });

      console.log('Add to cart response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Add to cart success:', data);
        success(`${medicine.name} added to cart successfully`);
        
        // Dispatch cart update event
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        const data = await response.json();
        console.log('Add to cart error:', data);
        
        // Handle specific auth errors
        if (response.status === 401 || response.status === 403) {
          error('Session expired. Please refresh the page or login again.');
        } else {
          error(data.message || 'Failed to add to cart');
        }
      }
    } catch (err) {
      console.error('Add to cart error:', err);
      error('Failed to add to cart. Please try again.');
    }
  };

  const handleViewDetails = (medicineId) => {
    console.log('👁️ View details clicked for medicine ID:', medicineId);
    alert(`View details for medicine: ${medicineId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Loading medicines...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Medicine Search Test</h1>
      <p className="mb-4">User logged in: {user ? 'Yes' : 'No'}</p>
      <p className="mb-4">Medicines found: {medicines.length}</p>
      
      <div className="grid gap-4">
        {medicines.map((medicine, index) => (
          <div key={medicine._id || index} className="border p-4 rounded">
            <h3 className="font-semibold">{medicine.name}</h3>
            <p>Price: ৳{medicine.price}</p>
            <p>Available: {medicine.isAvailable ? 'Yes' : 'No'}</p>
            <p>Vendor: {medicine.vendor?.name}</p>
            
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  console.log('View details button clicked');
                  handleViewDetails(medicine._id);
                }}
                className="px-3 py-1 bg-healthcare-green-500 text-white rounded hover:bg-healthcare-green-600"
                style={{ pointerEvents: 'auto' }}
              >
                View Details
              </button>
              
              <button
                onClick={() => {
                  console.log('Add to cart button clicked');
                  handleAddToCart(medicine);
                }}
                disabled={!medicine.isAvailable}
                className={`px-3 py-1 rounded ${
                  medicine.isAvailable
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                style={{ pointerEvents: 'auto' }}
              >
                {!user ? 'Login Required' : medicine.isAvailable ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {medicines.length === 0 && (
        <div className="text-center p-8">
          <p>No medicines found. Please try refreshing the page.</p>
          <button 
            onClick={fetchMedicines}
            className="mt-2 px-4 py-2 bg-healthcare-green-500 text-white rounded hover:bg-healthcare-green-600"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default MedicineSearchTest;

