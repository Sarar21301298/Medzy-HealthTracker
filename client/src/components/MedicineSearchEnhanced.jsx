import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  AlertCircle, 
  Star,
  MapPin,
  Phone,
  Mail,
  Package,
  Building,
  DollarSign,
  Clock,
  CheckCircle,
  X,
  Eye,
  Grid,
  List,
  Navigation,
  Map,
  Loader,
  SlidersHorizontal,
  RefreshCw,
  TrendingUp,
  Award,
  Truck,
  Shield,
  Target,
  Compass,
  Bookmark,
  Heart,
  Share2,
  Scale,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useDarkMode } from '../context/DarkModeContext';
import Modal from './Modal';
import PharmacyMap from './PharmacyMap';

const MedicineSearchEnhanced = () => {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareData, setCompareData] = useState({
    medicine: null,
    matches: []
  });
  const { user, getAuthHeaders } = useAuth();
  const { success, error } = useNotification();
  const { isDarkMode } = useDarkMode();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [inStockOnly, setInStockOnly] = useState(false);
  const [prescriptionFilter, setPrescriptionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [maxDistance, setMaxDistance] = useState(10); // km
  const [ratingFilter, setRatingFilter] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMedicines, setTotalMedicines] = useState(0);
  const itemsPerPage = 12;

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    setLocationLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(location);
          setLocationLoading(false);
          success('Location detected successfully!');
          
          // Auto-enable nearby search when location is detected
          setNearbyOnly(true);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationLoading(false);
          error('Unable to get your location. Please enable location services.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      setLocationLoading(false);
      error('Geolocation is not supported by this browser.');
    }
  }, [success, error]);

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  // Fetch medicines with enhanced filters
  const fetchMedicines = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        search: searchQuery,
        category: selectedCategory,
        sortBy,
        sortOrder,
        inStockOnly: inStockOnly.toString(),
        prescriptionFilter,
        ...(priceRange.min && { minPrice: priceRange.min }),
        ...(priceRange.max && { maxPrice: priceRange.max }),
        ...(ratingFilter > 0 && { minRating: ratingFilter.toString() }),
        ...(nearbyOnly && userLocation && { 
          latitude: userLocation.latitude.toString(),
          longitude: userLocation.longitude.toString(),
          maxDistance: maxDistance.toString()
        })
      });

      const response = await fetch(`/api/medicines/search?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        
        // Calculate distances for nearby pharmacies if location is available
        if (userLocation && data.medicines) {
          data.medicines = data.medicines.map(medicine => {
            if (medicine.pharmacy?.location?.coordinates) {
              const [pharmLon, pharmLat] = medicine.pharmacy.location.coordinates;
              const distance = calculateDistance(
                userLocation.latitude, userLocation.longitude,
                pharmLat, pharmLon
              );
              return { ...medicine, distance: Math.round(distance * 10) / 10 }; // Round to 1 decimal
            }
            return medicine;
          });

          // Sort by distance if nearby filter is enabled
          if (nearbyOnly) {
            data.medicines.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
          }
        }

        setMedicines(data.medicines || []);
        setTotalPages(data.totalPages || 1);
        setTotalMedicines(data.totalMedicines || 0);
        setCurrentPage(page);
        
        // Extract unique pharmacies for map view
        const uniquePharmacies = data.medicines?.reduce((acc, medicine) => {
          if (medicine.pharmacy && !acc.find(p => p._id === medicine.pharmacy._id)) {
            acc.push({
              ...medicine.pharmacy,
              distance: medicine.distance
            });
          }
          return acc;
        }, []) || [];
        setPharmacies(uniquePharmacies);
        
      } else {
        throw new Error('Failed to fetch medicines');
      }
    } catch (err) {
      console.error('Error fetching medicines:', err);
      error('Failed to load medicines. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery, selectedCategory, priceRange, inStockOnly, prescriptionFilter,
    sortBy, sortOrder, nearbyOnly, userLocation, maxDistance, ratingFilter,
    getAuthHeaders, error
  ]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/medicines/categories', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, [getAuthHeaders]);

  // Initial load
  useEffect(() => {
    fetchCategories();
    fetchMedicines(1);
  }, [fetchCategories, fetchMedicines]);

  // Handle search and filter changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchMedicines(1);
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  // Handle other filter changes
  useEffect(() => {
    fetchMedicines(1);
  }, [
    selectedCategory, priceRange, inStockOnly, prescriptionFilter,
    sortBy, sortOrder, nearbyOnly, maxDistance, ratingFilter
  ]);

  // Add to cart function
  const addToCart = async (medicine, quantity = 1, event = null) => {
    // Prevent any default behavior
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!user) {
      error('Please login to add items to cart');
      return;
    }

    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          medicineId: medicine._id,
          quantity
        })
      });

      if (response.ok) {
        success(`${medicine.name} added to cart!`);
        // Trigger cart update event
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to add to cart');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      error(err.message || 'Failed to add to cart');
    }
  };

  // Filter reset
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceRange({ min: '', max: '' });
    setInStockOnly(false);
    setPrescriptionFilter('all');
    setSortBy('name');
    setSortOrder('asc');
    setNearbyOnly(false);
    setMaxDistance(10);
    setRatingFilter(0);
    setCurrentPage(1);
  };

  // Get directions to pharmacy
  const getDirections = (pharmacy) => {
    if (userLocation && pharmacy.location?.coordinates) {
      const [pharmLon, pharmLat] = pharmacy.location.coordinates;
      const url = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${pharmLat},${pharmLon}`;
      window.open(url, '_blank');
    } else {
      error('Location not available for directions');
    }
  };

  const normalizeMedicineName = (name = '') => {
    return name
      .toLowerCase()
      .replace(/\b\d+(?:\.\d+)?\s*(mg|mcg|ml|gm|g|iu|%|tablet|tab|capsule|cap|syrup|injection|drop|drops)\b/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const tokenizeMedicineName = (name = '') => {
    const stopWords = new Set(['tablet', 'tab', 'capsule', 'cap', 'syrup', 'injection', 'drop', 'drops', 'mg', 'mcg', 'ml', 'gm', 'g', 'iu', 'suspension', 'solution']);

    return normalizeMedicineName(name)
      .split(' ')
      .filter((token) => token && token.length > 1 && !stopWords.has(token));
  };

  const getMatchScore = (target, candidate) => {
    const targetTokens = new Set(tokenizeMedicineName(target));
    const candidateTokens = new Set(tokenizeMedicineName(candidate));

    if (targetTokens.size === 0 || candidateTokens.size === 0) return 0;

    let sharedTokens = 0;
    targetTokens.forEach((token) => {
      if (candidateTokens.has(token)) {
        sharedTokens += 1;
      }
    });

    const overlapRatio = sharedTokens / Math.max(targetTokens.size, candidateTokens.size);
    const exactMatch = normalizeMedicineName(target) === normalizeMedicineName(candidate) ? 1 : 0;

    return overlapRatio + exactMatch;
  };

  const openCompareModal = async (medicine, event = null) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setCompareLoading(true);
    setCompareModalOpen(true);
    setCompareData({ medicine, matches: [] });

    try {
      const response = await fetch('/api/medicines/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: medicine.name || '',
          genericName: medicine.genericName || '',
          manufacturer: medicine.manufacturer || '',
          price: medicine.price || 0,
          limit: 8
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch scraped medicine comparisons');
      }

      const data = await response.json();
      const matches = data?.matches || [];

      setCompareData({ medicine, matches });
    } catch (err) {
      console.error('Error comparing medicine prices:', err);
      error('Could not load comparison prices. Please try again.');
      setCompareData({ medicine, matches: [] });
    } finally {
      setCompareLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Enhanced Header with Location */}
        <div className="bg-gradient-to-r from-healthcare-green-600 via-purple-600 to-healthcare-green-800 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Search className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Smart Medicine Search</h1>
                  <p className="text-healthcare-green-100 text-lg">Find medicines with GPS & compare prices instantly</p>
                </div>
              </div>
              
              {userLocation && (
                <div className="flex items-center gap-2 text-healthcare-green-100">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Searching near your location</span>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            
            {/* Location & Map Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={getCurrentLocation}
                disabled={locationLoading}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  userLocation
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
                    : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/30'
                }`}
              >
                {locationLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : userLocation ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Compass className="w-5 h-5" />
                )}
                {locationLoading ? 'Getting Location...' : userLocation ? 'Location Active' : 'Enable GPS'}
              </button>

              <button
                onClick={() => setShowMap(!showMap)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/30 rounded-xl font-semibold transition-all duration-200"
              >
                <Map className="w-5 h-5" />
                {showMap ? 'Hide Map' : 'Pharmacy Map'}
              </button>
            </div>
          </div>
          
          {/* Location Info */}
          {userLocation && (
            <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="flex items-center gap-2 text-white">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">
                  📍 Location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                  {nearbyOnly && ` • Searching within ${maxDistance}km`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border dark:border-gray-700 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search medicines, brands, generics, or symptoms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent transition-all duration-200 text-lg"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  showFilters
                    ? 'bg-healthcare-green-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                Advanced Filters
                {showFilters && <div className="w-2 h-2 bg-white rounded-full animate-pulse ml-1"></div>}
              </button>
              
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-600 text-healthcare-green-600 dark:text-healthcare-green-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  <span className="text-sm font-medium">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-healthcare-green-600 dark:text-healthcare-green-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span className="text-sm font-medium">List</span>
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Enhanced Advanced Filters */}
        {showFilters && (
          <div className="bg-gradient-to-r from-gray-50 to-healthcare-green-50 dark:from-gray-800 dark:to-healthcare-green-900/20 rounded-2xl shadow-xl border dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-healthcare-green-100 dark:bg-healthcare-green-900/50 rounded-lg">
                <SlidersHorizontal className="w-5 h-5 text-healthcare-green-600 dark:text-healthcare-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Smart Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price Range (৳)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Distance Filter */}
            {userLocation && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Distance (km)
                </label>
                <select
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value={5}>Within 5km</option>
                  <option value={10}>Within 10km</option>
                  <option value={20}>Within 20km</option>
                  <option value={50}>Within 50km</option>
                  <option value={100}>Within 100km</option>
                </select>
              </div>
            )}

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Rating
              </label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value={0}>Any Rating</option>
                <option value={1}>1+ Stars</option>
                <option value={2}>2+ Stars</option>
                <option value={3}>3+ Stars</option>
                <option value={4}>4+ Stars</option>
                <option value={5}>5 Stars Only</option>
              </select>
            </div>
          </div>

          {/* Filter Toggles */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-gray-300 text-healthcare-green-600 focus:ring-healthcare-green-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">In Stock Only</span>
            </label>

            {userLocation && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nearbyOnly}
                  onChange={(e) => setNearbyOnly(e.target.checked)}
                  className="rounded border-gray-300 text-healthcare-green-600 focus:ring-healthcare-green-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Nearby Pharmacies Only</span>
              </label>
            )}

            <button
              onClick={resetFilters}
              className="text-sm text-healthcare-green-600 dark:text-healthcare-green-400 hover:underline"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}

      {/* Map View */}
      {showMap && pharmacies.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📍 Nearby Pharmacies Map
          </h3>
          <PharmacyMap
            initialCenter={userLocation}
            pharmacies={pharmacies}
            userLocation={userLocation}
            height="400px"
            onPharmacySelect={(pharmacy) => {
              success(`Selected: ${pharmacy.name}`);
            }}
          />
        </div>
      )}

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {medicines.length} of {totalMedicines} medicines
          {nearbyOnly && userLocation && ` within ${maxDistance}km`}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-');
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
            }}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
            <option value="rating-desc">Rating (High to Low)</option>
            {nearbyOnly && <option value="distance-asc">Distance (Near to Far)</option>}
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-healthcare-green-600 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400">Searching medicines...</p>
          </div>
        </div>
      )}

      {/* Medicine Grid/List */}
      {!loading && medicines.length > 0 && (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
          : 'space-y-4'
        }>
          {medicines.map((medicine) => (
            <div
              key={medicine._id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full ${
                viewMode === 'list' ? 'flex-row' : ''
              }`}
            >
              {/* Medicine Image */}
              <div className={`${viewMode === 'list' ? 'w-32 h-32 flex-shrink-0' : 'h-48'} bg-gray-100 dark:bg-gray-700 relative`}>
                {medicine.imageUrl ? (
                  <img
                    src={medicine.imageUrl}
                    alt={medicine.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                {/* Stock Status */}
                <div className="absolute top-2 right-2">
                  {medicine.stock > 0 ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      In Stock
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Distance Badge */}
                {medicine.distance && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 bg-healthcare-green-100 text-healthcare-green-800 text-xs font-medium rounded-full">
                      {medicine.distance}km away
                    </span>
                  </div>
                )}
              </div>

              {/* Medicine Info */}
              <div className={`p-4 flex flex-col flex-1 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
                    {medicine.name}
                  </h3>
                  <button
                    onClick={() => setSelectedMedicine(medicine)}
                    className="text-healthcare-green-600 dark:text-healthcare-green-400 hover:text-healthcare-green-800 dark:hover:text-healthcare-green-300"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {medicine.genericName} • {medicine.strength}
                </p>

                {/* Price and Rating */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-green-600">৳{medicine.price}</span>
                  </div>
                  
                  {medicine.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {medicine.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Pharmacy Info */}
                <div className="flex-1">
                  {medicine.pharmacy && (
                    <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="w-4 h-4 text-healthcare-green-600" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {medicine.pharmacy.name}
                        </span>
                      </div>
                      
                      <div className="flex items-start gap-2 mb-2">
                        <MapPin className="w-3 h-3 text-gray-500 mt-0.5" />
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {medicine.pharmacy.address}
                        </p>
                      </div>

                      {/* Vendor Rating */}
                      {medicine.pharmacy.totalReviews > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                            {medicine.pharmacy.rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({medicine.pharmacy.totalReviews} reviews)
                          </span>
                        </div>
                      )}

                      {medicine.distance && (
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-healthcare-green-600 dark:text-healthcare-green-400 font-medium">
                            📍 {medicine.distance}km away
                          </span>
                          {userLocation && (
                            <button
                              onClick={() => getDirections(medicine.pharmacy)}
                              className="text-xs text-healthcare-green-600 dark:text-healthcare-green-400 hover:underline"
                            >
                              Get Directions
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <button
                    type="button"
                    onClick={(e) => addToCart(medicine, 1, e)}
                    disabled={medicine.stock === 0}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      medicine.stock > 0
                        ? 'bg-healthcare-green-600 text-white hover:bg-healthcare-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    onClick={(e) => openCompareModal(medicine, e)}
                    className="px-3 py-2 border border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400 dark:border-healthcare-green-400 rounded-lg hover:bg-healthcare-green-50 dark:hover:bg-healthcare-green-900/30 transition-colors"
                    title="Compare with online pharmacy prices"
                  >
                    <Scale className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && medicines.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No medicines found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Try adjusting your search criteria or filters
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-healthcare-green-600 text-white rounded-lg hover:bg-healthcare-green-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => fetchMedicines(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => fetchMedicines(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Medicine Detail Modal */}
      {selectedMedicine && (
        <Modal
          isOpen={!!selectedMedicine}
          onClose={() => setSelectedMedicine(null)}
          size="large"
        >
          <div className="p-6 bg-white dark:bg-gray-800">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedMedicine.name}
              </h2>
              <button
                onClick={() => setSelectedMedicine(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Medicine Image */}
              <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                {selectedMedicine.imageUrl ? (
                  <img
                    src={selectedMedicine.imageUrl}
                    alt={selectedMedicine.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>

              {/* Medicine Details */}
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    
                    Medicine Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">Generic Name:</span> {selectedMedicine.genericName}</p>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">Strength:</span> {selectedMedicine.strength}</p>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">Form:</span> {selectedMedicine.form}</p>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-green-600 dark:text-green-400">Price:</span> <span className="font-bold text-green-600 dark:text-green-400">৳{selectedMedicine.price}</span></p>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">Stock:</span> <span className={`font-medium ${selectedMedicine.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{selectedMedicine.stock} units</span></p>
                  </div>
                </div>

                {selectedMedicine.pharmacy && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      
                      Pharmacy Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">Name:</span> {selectedMedicine.pharmacy.name}</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium text-gray-900 dark:text-white">Address:</span> 
                        {selectedMedicine.pharmacy.address && selectedMedicine.pharmacy.address !== 'undefined, undefined' 
                          ? selectedMedicine.pharmacy.address 
                          : selectedMedicine.pharmacy.street && selectedMedicine.pharmacy.city 
                            ? `${selectedMedicine.pharmacy.street}, ${selectedMedicine.pharmacy.city}` 
                            : 'Address not available'
                        }
                      </p>
                      {selectedMedicine.pharmacy.phone && (
                        <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">Phone:</span> {selectedMedicine.pharmacy.phone}</p>
                      )}
                      {selectedMedicine.pharmacy.totalReviews > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">Rating:</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-medium text-yellow-600 dark:text-yellow-400">
                              {selectedMedicine.pharmacy.rating.toFixed(1)}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              ({selectedMedicine.pharmacy.totalReviews} reviews)
                            </span>
                          </div>
                        </div>
                      )}
                      {selectedMedicine.distance && (
                        <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">Distance:</span> <span className="font-medium text-healthcare-green-600 dark:text-healthcare-green-400">{selectedMedicine.distance}km away</span></p>
                      )}
                    </div>
                    
                    {userLocation && (
                      <button
                        onClick={() => getDirections(selectedMedicine.pharmacy)}
                        className="mt-3 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <MapPin className="w-4 h-4" />
                        Get Directions
                      </button>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={(e) => addToCart(selectedMedicine, 1, e)}
                    disabled={selectedMedicine.stock === 0}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                      selectedMedicine.stock > 0
                        ? 'bg-healthcare-green-600 dark:bg-healthcare-green-500 text-white hover:bg-healthcare-green-700 dark:hover:bg-healthcare-green-600 shadow-lg'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {selectedMedicine.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => openCompareModal(selectedMedicine, e)}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium border border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400 dark:border-healthcare-green-400 hover:bg-healthcare-green-50 dark:hover:bg-healthcare-green-900/30 transition-colors"
                  >
                    <Scale className="w-5 h-5" />
                    Compare Prices
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Compare Price Modal */}
      <Modal
        isOpen={compareModalOpen}
        onClose={() => {
          setCompareModalOpen(false);
          setCompareData({ medicine: null, matches: [] });
        }}
        size="large"
      >
        <div className="p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Price Comparison</h2>
              {compareData.medicine && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {compareData.medicine.name}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setCompareModalOpen(false);
                setCompareData({ medicine: null, matches: [] });
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {compareData.medicine && (
            <div className="mb-4 p-4 rounded-lg bg-healthcare-green-50 dark:bg-healthcare-green-900/20 border border-healthcare-green-100 dark:border-healthcare-green-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pharmacy Partner Price</span>
                <span className="text-lg font-bold text-healthcare-green-700 dark:text-healthcare-green-400">৳{compareData.medicine.price}</span>
              </div>
            </div>
          )}

          {compareLoading ? (
            <div className="py-10 text-center">
              <Loader className="w-7 h-7 animate-spin text-healthcare-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Checking online pharmacy prices...</p>
            </div>
          ) : compareData.matches.length === 0 ? (
            <div className="py-10 text-center">
              <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-700 dark:text-gray-300 font-medium">No matching scraped price found</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try another medicine or check again later.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {compareData.matches.map((item) => {
                const vendorPrice = Number(compareData.medicine?.price || 0);
                const scrapedPrice = Number(item.price || 0);
                const diff = scrapedPrice - vendorPrice;

                return (
                  <div
                    key={`${item.source}-${item._id || item.name}`}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{item.source || 'Online Pharmacy'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{item.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">৳{scrapedPrice}</p>
                        <p className={`text-xs font-medium ${diff <= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                          {diff === 0 ? 'Same price' : diff < 0 ? `Cheaper by ৳${Math.abs(diff).toFixed(2)}` : `Higher by ৳${diff.toFixed(2)}`}
                        </p>
                      </div>
                    </div>

                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-sm text-healthcare-green-600 dark:text-healthcare-green-400 hover:underline"
                      >
                        View offer
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MedicineSearchEnhanced;

