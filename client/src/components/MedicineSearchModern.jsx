import React, { useState, useMemo } from 'react';
import { Search, MapPin, Pill, Star, ShoppingCart, Eye, MoreVertical, TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardBody, Button, Input, Badge, Alert } from './ui';

const MedicineSearchModern = ({ onAddToCart = null, searchResults = [], isLoading = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Dhaka');
  const [sortBy, setSortBy] = useState('relevance');
  const [filterCategory, setFilterCategory] = useState('all');

  // Sample medicine data if no results provided
  const defaultMedicines = [
    {
      id: 1,
      name: 'Paracetamol 500mg',
      brand: 'Acetamine Plus',
      price: 25,
      originalPrice: 40,
      inStock: 150,
      rating: 4.8,
      reviews: 234,
      category: 'pain-relief',
      availability: 'available',
      pharmacies: 12,
      image: '💊'
    },
    {
      id: 2,
      name: 'Amoxicillin 250mg',
      brand: 'BioMed Plus',
      price: 45,
      originalPrice: 60,
      inStock: 89,
      rating: 4.9,
      reviews: 456,
      category: 'antibiotics',
      availability: 'available',
      pharmacies: 24,
      image: '💉'
    },
    {
      id: 3,
      name: 'Omeprazole 20mg',
      brand: 'GasterCare',
      price: 35,
      originalPrice: 55,
      inStock: 5,
      rating: 4.6,
      reviews: 178,
      category: 'digestive',
      availability: 'lowstock',
      pharmacies: 18,
      image: '🔬'
    },
    {
      id: 4,
      name: 'Metformin 500mg',
      brand: 'DiabCare',
      price: 30,
      originalPrice: 45,
      inStock: 0,
      rating: 4.7,
      reviews: 567,
      category: 'chronic-disease',
      availability: 'unavailable',
      pharmacies: 20,
      image: '⚕️'
    }
  ];

  const medicines = searchResults.length > 0 ? searchResults : defaultMedicines;

  // Filter and sort
  const filtered = useMemo(() => {
    let result = medicines.filter(med => {
      const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           med.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || med.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [searchQuery, filterCategory, sortBy, medicines]);

  const categories = [
    { id: 'all', label: 'All Medicines' },
    { id: 'pain-relief', label: 'Pain Relief' },
    { id: 'antibiotics', label: 'Antibiotics' },
    { id: 'digestive', label: 'Digestive' },
    { id: 'chronic-disease', label: 'Chronic Care' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-healthcare-green-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text-healthcare mb-4">
            Find Medicines
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Search, compare prices, and check availability across pharmacies
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8 p-8 shadow-soft-lg">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-7">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by medicine name or brand..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-healthcare w-full"
                  />
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div className="md:col-span-3">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="input-healthcare pl-10 w-full"
                  >
                    <option>Dhaka</option>
                    <option>Chittagong</option>
                    <option>Rangpur</option>
                    <option>Sylhet</option>
                  </select>
                </div>
              </div>
              <div className="md:col-span-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-healthcare w-full"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    filterCategory === cat.id
                      ? 'bg-healthcare-green-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Results Info */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600 dark:text-gray-300">
            Found <span className="font-bold text-healthcare-green-600">{filtered.length}</span> medicines
          </p>
          {filtered.length > 0 && (
            <Badge variant="green">
              Showing results for "{searchQuery || 'all medicines'}"
            </Badge>
          )}
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card-healthcare p-6 animate-pulse">
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(medicine => (
              <Card key={medicine.id} className="card-healthcare-hover overflow-hidden">
                <CardBody>
                  {/* Header with image and availability */}
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-4xl">{medicine.image}</div>
                      <Badge variant={
                        medicine.availability === 'available' ? 'green' : 
                        medicine.availability === 'lowstock' ? 'yellow' : 'red'
                      }>
                        {medicine.availability === 'available' ? 'In Stock' :
                         medicine.availability === 'lowstock' ? 'Low Stock' : 'Out of Stock'}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">
                      {medicine.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {medicine.brand}
                    </p>
                  </div>

                  {/* Price Section */}
                  <div className="mb-4 p-4 bg-healthcare-green-50 dark:bg-healthcare-green-900/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl font-bold text-healthcare-green-600 dark:text-healthcare-green-400">
                        ৳{medicine.price}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        ৳{medicine.originalPrice}
                      </span>
                      <Badge variant="teal">
                        {Math.round((1 - medicine.price / medicine.originalPrice) * 100)}% OFF
                      </Badge>
                    </div>
                  </div>

                  {/* Rating and Reviews */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {medicine.rating}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ({medicine.reviews} reviews)
                    </span>
                  </div>

                  {/* Stock and Availability */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <div className="text-gray-600 dark:text-gray-400">Available</div>
                      <div className="font-bold text-gray-900 dark:text-white">{medicine.inStock} units</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <div className="text-gray-600 dark:text-gray-400">Pharmacies</div>
                      <div className="font-bold text-gray-900 dark:text-white">{medicine.pharmacies} stores</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      fullWidth
                      variant="primary"
                      onClick={() => onAddToCart?.(medicine)}
                      disabled={medicine.availability === 'unavailable'}
                      className="group"
                    >
                      <ShoppingCart className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      Add to Cart
                    </Button>
                    <Button
                      fullWidth
                      variant="outline"
                      className="group"
                    >
                      <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      View Details
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Pill className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No medicines found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try different search terms or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineSearchModern;

