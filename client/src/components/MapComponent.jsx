import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Locate, Search } from 'lucide-react';

const MapComponent = ({ 
  address, 
  onLocationSelect, 
  height = '400px',
  initialLat = 23.8103, // Dhaka, Bangladesh
  initialLng = 90.4125,
  showSearch = true 
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapError, setMapError] = useState(null);

  // Initialize map
  useEffect(() => {
    const initializeMap = async () => {
      try {
        // Dynamically import Leaflet to avoid SSR issues
        const L = (await import('leaflet')).default;
        
        // Import CSS
        await import('leaflet/dist/leaflet.css');
        
        // Fix default markers
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        if (!mapRef.current) return;

        // Initialize map if not already done
        if (!mapInstanceRef.current) {
          const map = L.map(mapRef.current).setView([
            address?.latitude || initialLat, 
            address?.longitude || initialLng
          ], 13);

          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          // Add marker
          const marker = L.marker([
            address?.latitude || initialLat, 
            address?.longitude || initialLng
          ]).addTo(map);

          // Handle map clicks
          map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            
            // Reverse geocoding using Nominatim
            reverseGeocode(lat, lng);
          });

          mapInstanceRef.current = map;
          markerRef.current = marker;
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to load map. Please check your internet connection.');
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map when address changes
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && address?.latitude && address?.longitude) {
      const newLatLng = [address.latitude, address.longitude];
      mapInstanceRef.current.setView(newLatLng, 13);
      markerRef.current.setLatLng(newLatLng);
    }
  }, [address?.latitude, address?.longitude]);

  // Reverse geocoding function
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.address) {
        const locationData = {
          latitude: lat,
          longitude: lng,
          street: data.address.road || data.address.house_number ? 
            `${data.address.house_number || ''} ${data.address.road || ''}`.trim() : '',
          city: data.address.city || data.address.town || data.address.village || '',
          state: data.address.state || data.address.county || '',
          postalCode: data.address.postcode || '',
          country: data.address.country || 'Bangladesh'
        };
        
        onLocationSelect(locationData);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  // Search for location
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=bd`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 15);
          markerRef.current.setLatLng([lat, lng]);
          reverseGeocode(lat, lng);
        }
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([lat, lng], 15);
            markerRef.current.setLatLng([lat, lng]);
            reverseGeocode(lat, lng);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your location. Please search for your address manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  if (mapError) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"
        style={{ height }}
      >
        <div className="text-center p-4">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-healthcare-green-500 focus:border-transparent"
            />
          </div>
          <button
            type="button"
            onClick={searchLocation}
            disabled={isSearching}
            className="px-4 py-2 bg-healthcare-green-600 text-white rounded-lg hover:bg-healthcare-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          <button
            type="button"
            onClick={getCurrentLocation}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            title="Use current location"
          >
            <Locate className="h-4 w-4" />
            <span className="hidden sm:inline">Current</span>
          </button>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden"
      />
      
      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Click on the map to select your location
      </p>
    </div>
  );
};

export default MapComponent;

