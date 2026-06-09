import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  ShoppingCart,
  AlertCircle,
  Star,
  TrendingUp,
  Download,
  RefreshCw,
  Grid,
  List,
  X,
  Loader,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useDarkMode } from '../context/DarkModeContext';

const ScrapedMedicineSearch = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('name_asc');
  const [selectedSource, setSelectedSource] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMedicines, setTotalMedicines] = useState(0);
  const itemsPerPage = 12;

  // Stats
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const autoRefreshTimerRef = useRef(null);
  const autoRefreshAttemptsRef = useRef(0);

  const { user, getAuthHeaders } = useAuth();
  const { success, error } = useNotification();
  const { isDarkMode } = useDarkMode();

  // Categories list
  const categories = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Suppository'];
const sources = ['all', 'Arogga'];

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch medicines when filters change (reset to page 1)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, priceRange, inStockOnly, sortBy, selectedSource]);

  // Fetch medicines when page changes or filters are reset
  useEffect(() => {
    fetchScrapedMedicines();
  }, [currentPage, searchQuery, selectedCategory, priceRange, inStockOnly, sortBy, selectedSource]);

  useEffect(() => {
    return () => {
      if (autoRefreshTimerRef.current) {
        clearTimeout(autoRefreshTimerRef.current);
      }
    };
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/medicines/scrape/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchScrapedMedicines = async () => {
    try {
      setSearching(true);

      let url = new URL('/api/medicines/scrape/search', window.location.origin);
      
      if (searchQuery) {
        url.searchParams.append('query', searchQuery);
      }
      if (selectedCategory !== 'all') {
        url.searchParams.append('category', selectedCategory);
      }
      if (priceRange.min) {
        url.searchParams.append('minPrice', priceRange.min);
      }
      if (priceRange.max) {
        url.searchParams.append('maxPrice', priceRange.max);
      }
      if (inStockOnly) {
        url.searchParams.append('inStockOnly', 'true');
      }
      url.searchParams.append('sortBy', sortBy);
      url.searchParams.append('page', currentPage);
      url.searchParams.append('limit', itemsPerPage);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.success) {
        setMedicines(data.medicines);
        setTotalPages(data.pagination.totalPages);
        setTotalMedicines(data.pagination.total);

        const shouldAutoRefresh = data.scraper?.inProgress && data.pagination.total === 0;
        if (shouldAutoRefresh && autoRefreshAttemptsRef.current < 6) {
          autoRefreshAttemptsRef.current += 1;
          autoRefreshTimerRef.current = setTimeout(() => {
            fetchScrapedMedicines();
            fetchStats();
          }, 1500);
        } else {
          autoRefreshAttemptsRef.current = 0;
        }
      } else {
        error('Failed to fetch medicines');
      }
    } catch (err) {
      console.error('Error fetching scraped medicines:', err);
      error('Error fetching medicines');
    } finally {
      setSearching(false);
    }
  };

  const triggerScraping = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/medicines/scrape/trigger', {
        method: 'POST'
      });

      const data = await response.json();
      if (data.success) {
        success(`✅ Successfully scraped ${data.count} medicines!`);
        // Refresh the medicines list
        await fetchScrapedMedicines();
        await fetchStats();
      } else {
        error('Scraping failed');
      }
    } catch (err) {
      console.error('Error triggering scrape:', err);
      error('Error during scraping');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      const response = await fetch('/api/medicines/scrape/clear-cache', {
        method: 'POST'
      });

      const data = await response.json();
      if (data.success) {
        success('Cache cleared successfully');
        await fetchScrapedMedicines();
      }
    } catch (err) {
      console.error('Error clearing cache:', err);
      error('Error clearing cache');
    }
  };

  const handlePriceChange = (type, value) => {
    setPriceRange(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleAddToCart = async (medicine) => {
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
          scrapedMedicineId: medicine._id,
          scrapedMedicineData: {
            name: medicine.name,
            manufacturer: medicine.manufacturer || 'Unknown',
            price: medicine.price,
            imageUrl: medicine.imageUrl || '',
            source: medicine.source,
            sourceUrl: medicine.sourceUrl || ''
          },
          quantity: 1
        })
      });

      if (response.ok) {
        success(`✅ ${medicine.name} added to cart!`);
        // Dispatch event for cart update
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        const errorData = await response.json();
        error(errorData.message || 'Failed to add to cart');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      error('Failed to add to cart. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} p-4 md:p-8`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Find Medicines Around You
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Browse medicines from verified pharmacy websites
          </p>
        </div>


        {/* Search Bar */}
        <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search medicines (e.g., Paracetamol, Aspirin)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded border-none focus:ring-2 focus:ring-blue-500 outline-none ${
                  isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                }`}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded flex items-center gap-2 transition ${
                isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className={`mb-6 p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Filters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`w-full px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none border-none ${
                    isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}s</option>
                  ))}
                </select>
              </div>

              {/* Source Filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Source
                </label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className={`w-full px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none border-none ${
                    isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {sources.map(source => (
                    <option key={source} value={source}>
                      {source === 'all' ? 'All Sources' : source}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Min Price
                </label>
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => handlePriceChange('min', e.target.value)}
                  className={`w-full px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none border-none ${
                    isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Max Price
                </label>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => handlePriceChange('max', e.target.value)}
                  className={`w-full px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none border-none ${
                    isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                />
              </div>

              {/* Sort */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`w-full px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none border-none ${
                    isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                  <option value="price_asc">Price (Low to High)</option>
                  <option value="price_desc">Price (High to Low)</option>
                </select>
              </div>

              {/* Stock Filter */}
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    In Stock Only
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Results Info */}
        <div className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {totalMedicines > 0 && (
            <p>
              Showing <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold">
                {Math.min(currentPage * itemsPerPage, totalMedicines)}
              </span>{' '}
              of <span className="font-semibold">{totalMedicines}</span> medicines
            </p>
          )}
        </div>

        {/* Loading State */}
        {searching && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-500" />
            <span className={`ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Searching medicines...
            </span>
          </div>
        )}

        {/* Medicine Cards */}
        {!searching && medicines.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {medicines.map((medicine, index) => (
                <div
                  key={`${medicine.source}_${index}`}
                  className={`rounded-lg shadow-md hover:shadow-lg transition overflow-hidden ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  }`}
                >
                  {/* Card Image */}
                  {medicine.imageUrl && (
                    <div className="w-full h-48 bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                      <img
                        src={medicine.imageUrl}
                        alt={medicine.name}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-full object-contain p-2"
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://via.placeholder.com/300x200?text=Medicine';
                        }}
                      />
                    </div>
                  )}

                  <div className="p-4">
                    {/* Source Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                        {medicine.source}
                      </span>
                      {medicine.inStock && (
                        <span className="text-green-600 text-xs font-semibold">In Stock</span>
                      )}
                    </div>

                    {/* Medicine Name */}
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                      {medicine.name}
                    </h3>

                    {/* Manufacturer */}
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                      {medicine.manufacturer}
                    </p>

                    {/* Category */}
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mb-3`}>
                      <span className="font-semibold">{medicine.category}</span>
                    </p>

                    {/* Description */}
                    {medicine.description && (
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-3 line-clamp-2`}>
                        {medicine.description}
                      </p>
                    )}

                    {/* Price */}
                    <div className="mb-4">
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                        ৳{medicine.price.toFixed(2)}
                      </p>
                      {medicine.rating > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {medicine.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(medicine)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-semibold flex items-center justify-center gap-2 transition"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>

                      {medicine.sourceUrl && (
                        <a
                          href={medicine.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex-1 px-3 py-2 rounded font-semibold flex items-center justify-center gap-2 transition border ${
                            isDarkMode
                              ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Visit
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded transition ${
                    currentPage === 1
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : `${
                          isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                        }`
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded transition ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : `${
                              isDarkMode
                                ? 'bg-gray-700 text-white hover:bg-gray-600'
                                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                            }`
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded transition ${
                    currentPage === totalPages
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : `${
                          isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                        }`
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!searching && medicines.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              No medicines found
            </p>
            <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              Try adjusting your search or filters, or click "Refresh Medicines" to fetch fresh data
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScrapedMedicineSearch;
