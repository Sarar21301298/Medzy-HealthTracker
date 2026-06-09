import React, { useState } from 'react';
import MedicineSearchEnhanced from './MedicineSearchEnhanced';
import ScrapedMedicineSearch from './ScrapedMedicineSearch';

const CombinedMedicineSearch = () => {
  const [activeTab, setActiveTab] = useState('vendor');
  const [smartQuery, setSmartQuery] = useState('');
  const [smartResults, setSmartResults] = useState([]);
  const [smartMeta, setSmartMeta] = useState(null);
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartError, setSmartError] = useState('');

  const runSmartSearch = async (event) => {
    event.preventDefault();

    const query = smartQuery.trim();
    if (!query) {
      setSmartError('Enter a medicine name or request, for example: Find me the cheapest Ibuprofen.');
      return;
    }

    try {
      setSmartLoading(true);
      setSmartError('');

      const response = await fetch('/api/medicines/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query, limit: 12 })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to search medicines');
      }

      setSmartResults(data.results || []);
      setSmartMeta(data.parsedQuery || null);
    } catch (error) {
      console.error('Smart medicine search failed:', error);
      setSmartResults([]);
      setSmartMeta(null);
      setSmartError(error.message || 'Could not run smart search');
    } finally {
      setSmartLoading(false);
    }
  };

  const clearSmartSearch = () => {
    setSmartQuery('');
    setSmartResults([]);
    setSmartMeta(null);
    setSmartError('');
  };

  return (
    <div className="w-full">
      <div className="mb-8 rounded-2xl border border-healthcare-green-200 dark:border-healthcare-green-900 bg-gradient-to-br from-healthcare-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <form onSubmit={runSmartSearch} className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Smart Search
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={smartQuery}
                onChange={(e) => setSmartQuery(e.target.value)}
                placeholder="Find me the cheapest Ibuprofen"
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-healthcare-green-500 focus:outline-none focus:ring-2 focus:ring-healthcare-green-200 dark:focus:ring-healthcare-green-900"
              />
              <button
                type="submit"
                disabled={smartLoading}
                className="rounded-xl bg-healthcare-green-600 px-5 py-3 font-semibold text-white transition hover:bg-healthcare-green-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {smartLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {smartError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {smartError}
          </div>
        )}

        {smartMeta && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-healthcare-green-700 dark:text-healthcare-green-300">
            {smartMeta.medicineName && <span className="rounded-full bg-white/80 px-3 py-1 dark:bg-gray-900/80">Query: {smartMeta.medicineName}</span>}
            {smartMeta.sortOrder && <span className="rounded-full bg-white/80 px-3 py-1 dark:bg-gray-900/80">Sort: {smartMeta.sortOrder}</span>}
            {smartMeta.inStockOnly && <span className="rounded-full bg-white/80 px-3 py-1 dark:bg-gray-900/80">In stock only</span>}
            {typeof smartMeta.maxPrice === 'number' && <span className="rounded-full bg-white/80 px-3 py-1 dark:bg-gray-900/80">Max price: {smartMeta.maxPrice}</span>}
          </div>
        )}

        {smartResults.length > 0 && (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {smartResults.map((medicine) => (
              <div key={`${medicine.sourceType}-${medicine.id}`} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-healthcare-green-600 dark:text-healthcare-green-400">{medicine.sourceLabel}</p>
                    <h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{medicine.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{medicine.manufacturer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">৳{Number(medicine.price || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{medicine.inStock ? 'In stock' : 'Out of stock'}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-300">
                  {medicine.category && <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800">{medicine.category}</span>}
                  {medicine.vendorName && <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800">{medicine.vendorName}</span>}
                </div>
                {medicine.description && (
                  <p className="mt-3 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">{medicine.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('vendor')}
            className={`py-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'vendor'
                ? 'border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Pharmacy Partners
          </button>
          <button
            onClick={() => setActiveTab('scraped')}
            className={`py-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'scraped'
                ? 'border-healthcare-green-500 text-healthcare-green-600 dark:text-healthcare-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Online Pharmacies
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'vendor' && (
          <div>
            <MedicineSearchEnhanced />
          </div>
        )}

        {activeTab === 'scraped' && (
          <div>
            <ScrapedMedicineSearch />
          </div>
        )}
      </div>
    </div>
  );
};

export default CombinedMedicineSearch;
