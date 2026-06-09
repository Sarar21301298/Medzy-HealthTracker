import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Phone, Star, Clock } from 'lucide-react';

// Fix default markers for Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const PharmacyMap = ({ 
  initialCenter = { latitude: 23.8103, longitude: 90.4125 }, // Dhaka, Bangladesh
  pharmacies = [],
  userLocation = null,
  onPharmacySelect = () => {},
  height = '400px',
  showUserLocation = true
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);

  // Custom pharmacy icon
  const pharmacyIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#059669" width="32" height="32">
        <path d="M19 8h-2V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm7 8h-3v3h-2v-3H8v-2h3v-3h2v3h3v2z"/>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  // User location icon
  const userIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" width="24" height="24">
        <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" fill="#ffffff"/>
      </svg>
    `),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const center = userLocation 
      ? [userLocation.latitude, userLocation.longitude]
      : [initialCenter.latitude, initialCenter.longitude];

    const map = L.map(mapRef.current, {
      center,
      zoom: userLocation ? 13 : 10,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [initialCenter, userLocation]);

  // Update markers when pharmacies change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add user location marker
    if (showUserLocation && userLocation) {
      const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: userIcon
      })
      .addTo(mapInstanceRef.current)
      .bindPopup('Your Location')
      .openPopup();

      markersRef.current.push(userMarker);
    }

    // Add pharmacy markers
    pharmacies.forEach(pharmacy => {
      if (!pharmacy.location?.coordinates) return;

      const [lon, lat] = pharmacy.location.coordinates;
      
      const popupContent = `
        <div class="p-3 min-w-[200px]">
          <h3 class="font-semibold text-gray-900 mb-2">${pharmacy.name}</h3>
          <div class="space-y-1 text-sm text-gray-600">
            <div class="flex items-start gap-2">
              <svg class="w-4 h-4 mt-0.5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>${pharmacy.address}</span>
            </div>
            ${pharmacy.phone ? `
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                <span>${pharmacy.phone}</span>
              </div>
            ` : ''}
            ${pharmacy.distance ? `
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-healthcare-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 11H7l3-3 3 3h-2v4h-2v-4zm1-9C6.48 2 3 5.48 3 10c0 5.25 7 13 7 13s7-7.75 7-13c0-4.52-3.48-8-8-8z"/>
                </svg>
                <span class="text-healthcare-green-600 font-medium">${pharmacy.distance}km away</span>
              </div>
            ` : ''}
          </div>
          <button 
            class="mt-2 w-full bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 transition-colors"
            onclick="window.selectPharmacy('${pharmacy._id}')"
          >
            Select Pharmacy
          </button>
        </div>
      `;

      const marker = L.marker([lat, lon], { icon: pharmacyIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(popupContent);

      // Store pharmacy data on marker for selection
      marker.pharmacyData = pharmacy;
      
      marker.on('click', () => {
        setSelectedPharmacy(pharmacy);
        onPharmacySelect(pharmacy);
      });

      markersRef.current.push(marker);
    });

    // Fit map to show all markers if there are pharmacies
    if (markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }

  }, [pharmacies, userLocation, showUserLocation, onPharmacySelect]);

  // Global function for popup button clicks
  useEffect(() => {
    window.selectPharmacy = (pharmacyId) => {
      const pharmacy = pharmacies.find(p => p._id === pharmacyId);
      if (pharmacy) {
        setSelectedPharmacy(pharmacy);
        onPharmacySelect(pharmacy);
      }
    };

    return () => {
      delete window.selectPharmacy;
    };
  }, [pharmacies, onPharmacySelect]);

  // Get directions to selected pharmacy
  const getDirections = (pharmacy) => {
    if (userLocation && pharmacy.location?.coordinates) {
      const [pharmLon, pharmLat] = pharmacy.location.coordinates;
      const url = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${pharmLat},${pharmLon}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="relative">
      <div
        ref={mapRef}
        style={{ height }}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600"
      />
      
      {/* Selected Pharmacy Info */}
      {selectedPharmacy && (
        <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 p-4 max-w-xs z-[1000]">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {selectedPharmacy.name}
            </h3>
            <button
              onClick={() => setSelectedPharmacy(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-start gap-2">
              <MapPin className="w-3 h-3 mt-0.5 text-gray-500" />
              <span>{selectedPharmacy.address}</span>
            </div>
            
            {selectedPharmacy.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 text-gray-500" />
                <span>{selectedPharmacy.phone}</span>
              </div>
            )}
            
            {selectedPharmacy.distance && (
              <div className="flex items-center gap-2">
                <Navigation className="w-3 h-3 text-healthcare-green-500" />
                <span className="text-healthcare-green-600 font-medium">
                  {selectedPharmacy.distance}km away
                </span>
              </div>
            )}
          </div>
          
          {userLocation && selectedPharmacy.location?.coordinates && (
            <button
              onClick={() => getDirections(selectedPharmacy)}
              className="mt-3 w-full bg-green-600 text-white py-1 px-3 rounded text-xs hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
            >
              <Navigation className="w-3 h-3" />
              Get Directions
            </button>
          )}
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 p-3 z-[1000]">
        <div className="text-xs font-medium text-gray-900 dark:text-white mb-2">Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">+</span>
            </div>
            <span className="text-gray-600 dark:text-gray-400">Pharmacy</span>
          </div>
          {showUserLocation && userLocation && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-healthcare-green-600 rounded-full border-2 border-white"></div>
              <span className="text-gray-600 dark:text-gray-400">Your Location</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PharmacyMap;

