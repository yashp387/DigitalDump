// frontend/src/pages/CollectorPickupManagement.tsx
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl, { Map as MapboxMap, LngLatBounds, Marker, Popup } from 'mapbox-gl'; // Import mapbox-gl types
import 'mapbox-gl/dist/mapbox-gl.css'; // Import mapbox-gl CSS

// Import API functions
import {
  getAvailablePickups,
  getAgentPickupsByStatus,
  acceptPickup,
  completePickup,
  getOptimizedRoute,
} from '../services/api'; // Adjust path if needed
import AuthContext from '../context/AuthContext'; // Adjust path if needed

// Define an interface for the pickup data structure from backend
interface Pickup {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email?: string;
  };
  fullName: string;
  phoneNumber: string;
  streetAddress: string;
  city: string;
  zipCode: string;
  preferredDateTime: string;
  ewasteType: string;
  ewasteSubtype?: string;
  quantity: number;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  status: 'pending' | 'accepted' | 'completed';
  assignedAgentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Interface for Mapbox Optimization API response structure (simplified)
interface MapboxRouteData {
    code: string;
    message?: string;
    waypoints: {
        name?: string; // Name associated with the waypoint (often index)
        location: [number, number]; // [longitude, latitude]
        waypoint_index: number; // Original index in the request
        trips_index: number; // Index within the returned trip
        distance: number; // Distance from route origin to waypoint
    }[];
    trips: {
        geometry: any; // GeoJSON geometry object (LineString)
        legs: any[]; // Detailed legs of the trip
        duration: number; // Total duration in seconds
        distance: number; // Total distance in meters
        weight_name: string;
        weight: number;
    }[];
}

// --- Mapbox Access Token ---
// Reads the PUBLIC token from the .env file (Vite specific)
// Ensure VITE_MAPBOX_ACCESS_TOKEN=pk.YOUR_PUBLIC_KEY is set in frontend/.env
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const CollectorPickupManagement: React.FC = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate(); // For navigation if needed

  // --- State ---
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showMapView, setShowMapView] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all' means available/pending
  const [displayedPickups, setDisplayedPickups] = useState<Pickup[]>([]);
  const [optimizedRouteData, setOptimizedRouteData] = useState<MapboxRouteData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMapLoading, setIsMapLoading] = useState<boolean>(false); // Separate loading for map init/route fetch
  const [error, setError] = useState<string | null>(null);

  // --- Map Refs ---
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<Marker[]>([]); // Keep track of markers to remove them

  // --- Fetch Time ---
  useEffect(() => {
    const now = new Date();
    setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
  }, []);

  // --- Fetch Pickup Data (List View) ---
  const fetchPickups = useCallback(async () => {
    // Don't fetch list data if map is shown
    if (showMapView) return;

    console.log(`[fetchPickups] Fetching for status: ${statusFilter}`);
    setIsLoading(true);
    setError(null);
    setDisplayedPickups([]);

    try {
      let response;
      if (statusFilter === 'all') {
        response = await getAvailablePickups();
      } else {
        response = await getAgentPickupsByStatus(statusFilter);
      }
      setDisplayedPickups(response?.requests || []);
    } catch (err: any) {
      console.error("Error fetching pickups:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch pickups.");
      setDisplayedPickups([]); // Clear pickups on error
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, showMapView]); // Dependency on filter and map view state

  // --- Fetch Optimized Route (Map View) ---
   const fetchRoute = useCallback(async () => {
    // Only fetch if map is intended to be shown
    if (!showMapView) return;

    console.log("[fetchRoute] Fetching optimized route...");
    setIsMapLoading(true); // Use separate map loading state
    setError(null);
    setOptimizedRouteData(null); // Clear previous route

    try {
      const response = await getOptimizedRoute();
      if (response && response.routeData && response.routeData.code === 'Ok') {
        setOptimizedRouteData(response.routeData);
        console.log("[fetchRoute] Optimized route data received:", response.routeData);
      } else {
        // Handle cases where Mapbox returns non-Ok code but not a network error
        const errorMsg = response?.routeData?.message || response?.message || "Failed to get optimized route from Mapbox.";
        console.error("[fetchRoute] Mapbox API returned non-Ok code:", response?.routeData);
        setError(`Map Error: ${errorMsg}`);
        setOptimizedRouteData(null);
      }
    } catch (err: any) {
      console.error("[fetchRoute] Error fetching optimized route:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to fetch optimized route.";
      setError(errorMsg);
      setOptimizedRouteData(null);
      // Optionally switch back to list view on critical error
      // setShowMapView(false);
    } finally {
      setIsMapLoading(false);
    }
  }, [showMapView]); // Dependency only on map view state

  // --- Trigger data fetching effects ---
  useEffect(() => {
    fetchPickups(); // Fetch list data when status changes or map is hidden
  }, [fetchPickups]); // Use the memoized fetchPickups

  useEffect(() => {
    if (showMapView) {
      fetchRoute(); // Fetch route data when map view is toggled ON
    } else {
      // Clean up map when switching to list view
      if (mapRef.current) {
        console.log("[Map Cleanup] Removing map instance.");
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = []; // Clear marker refs
      }
    }
  }, [showMapView, fetchRoute]); // Trigger route fetch or cleanup

  // --- Initialize and Update Map ---
  useEffect(() => {
    // Ensure map should be shown, data is ready, container exists, and map isn't already created
    if (showMapView && optimizedRouteData && mapContainerRef.current && !mapRef.current) {
        console.log("[Map Init] Initializing Mapbox map...");
        if (!MAPBOX_ACCESS_TOKEN) {
            setError("Mapbox Access Token is not configured in frontend environment variables (VITE_MAPBOX_ACCESS_TOKEN).");
            console.error("CRITICAL: Mapbox Access Token is missing!");
            return; // Stop map initialization
        }

        try {
            mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
            // Use the first waypoint (agent's location) from the OPTIMIZED route data as center
            const centerCoords = optimizedRouteData.waypoints[0]?.location || [0, 0]; // Default center if needed

            mapRef.current = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/mapbox/streets-v12', // Use a modern style
                center: centerCoords,
                zoom: 10
            });

            // Add navigation controls
            mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

            mapRef.current.on('load', () => {
                console.log("[Map Init] Map loaded event triggered.");
                // --- Draw Route ---
                if (mapRef.current?.getSource('route')) { // Remove old route if map reloads somehow
                    mapRef.current.removeLayer('route');
                    mapRef.current.removeSource('route');
                }
                if (optimizedRouteData.trips && optimizedRouteData.trips[0]?.geometry) {
                    mapRef.current?.addSource('route', {
                        'type': 'geojson',
                        'data': optimizedRouteData.trips[0].geometry
                    });
                    mapRef.current?.addLayer({
                        'id': 'route',
                        'type': 'line',
                        'source': 'route',
                        'layout': { 'line-join': 'round', 'line-cap': 'round' },
                        'paint': { 'line-color': '#3887be', 'line-width': 5, 'line-opacity': 0.75 }
                    });
                    console.log("[Map Init] Route layer added.");
                } else {
                    console.warn("[Map Init] No route geometry found in optimizedRouteData.");
                }

                // --- Clear Old Markers ---
                markersRef.current.forEach(marker => marker.remove());
                markersRef.current = [];

                // --- Add New Markers ---
                optimizedRouteData.waypoints.forEach((waypoint, index) => {
                    if (waypoint.location) {
                        const isStartEnd = index === 0 || index === optimizedRouteData.waypoints.length - 1;
                        const el = document.createElement('div');
                        el.className = 'mapbox-marker'; // Add a class for potential CSS styling
                        el.style.width = '25px';
                        el.style.height = '25px';
                        el.style.borderRadius = '50%';
                        el.style.border = '2px solid white';
                        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                        el.style.cursor = 'pointer';
                        el.style.backgroundColor = isStartEnd ? '#16a34a' : '#dc2626'; // Green for start/end, Red for pickups
                        el.style.display = 'flex';
                        el.style.alignItems = 'center';
                        el.style.justifyContent = 'center';
                        el.innerHTML = `<span style="color: white; font-size: 12px; font-weight: bold;">${index}</span>`; // Display index number

                        const popup = new Popup({ offset: 25 })
                            .setText(`Stop ${index}: ${waypoint.name || 'Pickup Location'}`);

                        const marker = new Marker(el)
                            .setLngLat(waypoint.location)
                            .setPopup(popup)
                            .addTo(mapRef.current!);

                        markersRef.current.push(marker); // Store marker reference
                    }
                });
                 console.log(`[Map Init] ${markersRef.current.length} waypoint markers added.`);

                 // --- Fit map to bounds ---
                 if (optimizedRouteData.trips && optimizedRouteData.trips[0]?.geometry?.coordinates) {
                    const coordinates = optimizedRouteData.trips[0].geometry.coordinates;
                    if (coordinates.length > 0) {
                        const bounds = coordinates.reduce((bounds, coord) => {
                            return bounds.extend(coord as mapboxgl.LngLatLike);
                        }, new LngLatBounds(coordinates[0] as mapboxgl.LngLatLike, coordinates[0] as mapboxgl.LngLatLike));

                        mapRef.current?.fitBounds(bounds, {
                            padding: { top: 50, bottom: 50, left: 50, right: 50 }, // Add padding
                            maxZoom: 15 // Prevent zooming in too much
                        });
                        console.log("[Map Init] Map fitted to route bounds.");
                    }
                 }
            });

            // Handle map errors
            mapRef.current.on('error', (e) => {
                console.error("[Mapbox Error Event]", e.error);
                setError(`Map Error: ${e.error?.message || 'An unknown map error occurred.'}`);
            });

        } catch (mapError: any) {
            console.error("[Map Init] Error initializing Mapbox map:", mapError);
            setError(`Failed to initialize map: ${mapError.message}`);
        }
    }

    // Cleanup function
    return () => {
        // Only remove map if it exists AND we are navigating away OR hiding map view
        // This prevents removal if only optimizedRouteData changes (e.g., refetch)
        if (mapRef.current && !showMapView) {
             console.log("[Map Cleanup] Component unmounting or map hidden, removing map.");
             mapRef.current.remove();
             mapRef.current = null;
             markersRef.current = [];
        }
    };
  // Dependencies: Only re-initialize map if view toggles or route data is newly fetched
  }, [showMapView, optimizedRouteData]);


  // --- Action Handlers ---
  const handleAccept = async (pickupId: string) => {
    // Optional: Add specific loading state for the button/card
    setError(null); // Clear previous errors specific to this action
    try {
      console.log(`[handleAccept] Accepting pickup ${pickupId}`);
      await acceptPickup(pickupId);
      // Refresh the list after accepting
      fetchPickups(); // Refetch the current list view
      alert('Pickup accepted successfully!'); // Replace with better notification
    } catch (err: any) {
      console.error("Error accepting pickup:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to accept pickup.";
      setError(errorMsg);
      alert(`Error: ${errorMsg}`); // Simple alert for now
    }
  };

  const handleComplete = async (pickupId: string) => {
     setError(null);
    try {
      console.log(`[handleComplete] Completing pickup ${pickupId}`);
      await completePickup(pickupId);
      // Refresh the list after completing
      fetchPickups();
      alert('Pickup marked as completed!');
    } catch (err: any)      {
      console.error("Error completing pickup:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to complete pickup.";
      setError(errorMsg);
      alert(`Error: ${errorMsg}`);
    }
  };

  const handleCall = (phoneNumber: string) => {
    console.log(`[handleCall] Initiating call to ${phoneNumber}`);
    window.location.href = `tel:${phoneNumber}`;
  };

  // --- Helper to format date ---
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    } catch (e) { return 'Invalid Date'; }
  };

  // --- Construct display address ---
  const getDisplayAddress = (pickup: Pickup): string => {
      return `${pickup.streetAddress || 'N/A'}, ${pickup.city || 'N/A'}, ${pickup.zipCode || 'N/A'}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 w-full mx-auto">
      {/* Header */}
      <header className="w-full bg-white shadow-lg backdrop-blur-sm bg-opacity-90 sticky top-0 z-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="text-xl md:text-2xl font-bold text-green-600 flex items-center bg-green-50 px-3 py-1 md:px-4 md:py-2 rounded-full">
              <i className="fas fa-recycle mr-2 md:mr-3 text-2xl md:text-3xl"></i>
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-transparent bg-clip-text">DigitalDump</span>
            </div>
            <nav className="flex items-center space-x-3 md:space-x-6">
               <button
                 onClick={() => navigate('/collector/dashboard')} // Navigate to dashboard
                 title="Dashboard"
                 className="text-gray-600 hover:text-green-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
               >
                  <i className="fas fa-chart-line text-lg md:text-xl"></i>
               </button>
               <button
                 onClick={logout}
                 title="Logout"
                 className="!rounded-button cursor-pointer whitespace-nowrap bg-red-50 text-red-600 px-3 py-2 md:px-4 hover:bg-red-100 transition-colors duration-200 font-medium flex items-center text-sm md:text-base"
               >
                 <i className="fas fa-sign-out-alt mr-0 md:mr-2"></i>
                 <span className="hidden md:inline">Logout</span>
               </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6 md:py-10">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="bg-white rounded-2xl shadow-lg p-5 md:p-8 lg:p-10 mb-6 md:mb-8 bg-[url('https://readdy.ai/api/search-image?query=abstract%20modern%20geometric%20pattern%20with%20soft%20green%20and%20white%20gradient%2C%20minimalist%20design%20perfect%20for%20dashboard%20background&width=1440&height=240&seq=hero1&orientation=landscape')] bg-cover bg-center">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="bg-white/90 backdrop-blur-sm p-4 md:p-6 rounded-xl text-center md:text-left">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2">Pickup Management</h1>
                <p className="text-gray-600 flex items-center justify-center md:justify-start text-xs sm:text-sm md:text-base flex-wrap">
                  <i className="fas fa-calendar-alt mr-2 text-green-600"></i>
                  {currentDate}
                  <span className="hidden md:inline mx-2 text-green-600">•</span>
                  <i className="fas fa-clock mr-2 ml-2 md:ml-0 text-green-600"></i>
                  {currentTime}
                </p>
              </div>
              <button
                onClick={() => setShowMapView(!showMapView)}
                disabled={isMapLoading} // Disable button while map/route is loading
                className={`!rounded-button cursor-pointer whitespace-nowrap bg-green-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg hover:bg-green-700 transition-all duration-300 flex items-center font-medium shadow-lg hover:shadow-green-200 transform hover:scale-105 text-sm md:text-base ${isMapLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isMapLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                    <i className={`fas ${showMapView ? 'fa-list' : 'fa-map-marked-alt'} mr-2`}></i>
                )}
                {showMapView ? 'List View' : 'Map View'}
              </button>
            </div>
          </div>

          {/* Status Filters */}
          {!showMapView && ( // Only show filters in list view
            <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 border border-green-100">
                <div className="flex flex-wrap space-x-2 sm:space-x-4 justify-center">
                {['all', 'accepted', 'completed'].map((status) => (
                    <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    disabled={isLoading} // Disable filters while loading list
                    className={`!rounded-button cursor-pointer whitespace-nowrap px-3 py-2 md:px-5 md:py-2.5 rounded-lg transition-all duration-200 font-medium flex items-center text-xs sm:text-sm md:text-base mb-2 ${
                        statusFilter === status
                        ? 'bg-green-600 text-white shadow-md transform scale-105'
                        : 'bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-600'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                    <i className={`fas fa-fw ${ // Use fa-fw for fixed width
                        status === 'all' ? 'fa-th-list' :
                        status === 'accepted' ? 'fa-clock' :
                        status === 'completed' ? 'fa-check-circle' :
                        status === 'cancelled' ? 'fa-times-circle' :
                        'fa-question-circle'
                    } mr-2`}></i>
                    {status === 'all' ? 'Available' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
                </div>
            </div>
          )}

          {/* Loading and Error Display Area */}
          {(isLoading || isMapLoading) && (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading {isMapLoading ? 'Map and Route' : 'Pickups'}...</p>
            </div>
          )}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 text-sm md:text-base" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
               <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3 text-red-700 hover:text-red-900">
                  <span className="text-xl font-bold">×</span>
               </button>
            </div>
          )}

          {/* Conditional View: Map or List */}
          {!isLoading && !isMapLoading && !error && ( // Only render view when not loading and no error
            showMapView ? (
              // --- Map View ---
              <div className="bg-white rounded-xl shadow-lg p-2 md:p-4 border border-gray-200">
                 <div ref={mapContainerRef} className="h-[60vh] md:h-[75vh] bg-gray-100 rounded-lg relative overflow-hidden">
                    {/* Mapbox map will be initialized here */}
                    {!MAPBOX_ACCESS_TOKEN && ( // Show error if token is missing in env
                         <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-lg z-10">
                            <p className="text-red-600 font-semibold p-4 text-center">Error: Mapbox Access Token not found.<br/>Please set VITE_MAPBOX_ACCESS_TOKEN in your .env file.</p>
                         </div>
                    )}
                    {/* Placeholder while map loads */}
                     <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <p className="text-gray-500">Loading map...</p>
                     </div>
                 </div>
              </div>
            ) : (
              // --- List View ---
              <div className="grid grid-cols-1 gap-4 md:gap-6">
                {displayedPickups.length > 0 ? (
                  displayedPickups.map((pickup) => (
                    <div key={pickup._id} className="bg-white rounded-xl shadow-md p-4 md:p-6 transform transition-all duration-200 hover:shadow-lg border border-gray-100">
                      <div className="flex flex-col md:flex-row justify-between md:items-center">
                        {/* Pickup Details */}
                        <div className="mb-4 md:mb-0 md:pr-6 flex-grow overflow-hidden">
                          <div className="flex items-center mb-1">
                             <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${
                                pickup.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                pickup.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                                pickup.status === 'completed' ? 'bg-green-100 text-green-800' :
                                pickup.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                             }`}>
                                {pickup.status.charAt(0).toUpperCase() + pickup.status.slice(1)}
                             </span>
                             <h3 className="text-base md:text-lg font-semibold text-gray-800 truncate" title={pickup.userId?.name || pickup.fullName}>
                                {pickup.userId?.name || pickup.fullName || 'N/A'}
                             </h3>
                          </div>
                          <p className="text-gray-500 text-xs md:text-sm mb-2 truncate" title={getDisplayAddress(pickup)}>
                            <i className="fas fa-map-marker-alt fa-fw mr-1 text-gray-400"></i>
                            {getDisplayAddress(pickup)}
                          </p>
                          <p className="text-gray-600 text-xs md:text-sm mb-2">
                            <i className="fas fa-calendar-alt fa-fw mr-1 text-gray-400"></i>
                            {formatDate(pickup.preferredDateTime)}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs md:text-sm font-medium">
                              <i className="fas fa-box fa-fw mr-1"></i>
                              {pickup.ewasteType}{pickup.ewasteSubtype ? ` (${pickup.ewasteSubtype})` : ''}
                            </span>
                             <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs md:text-sm font-medium">
                              Qty: {pickup.quantity}
                            </span>
                          </div>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full md:w-auto flex-shrink-0 mt-3 md:mt-0">
                          {pickup.status === 'pending' && statusFilter === 'all' && (
                            <button
                              onClick={() => handleAccept(pickup._id)}
                              className="!rounded-button w-full sm:w-auto cursor-pointer whitespace-nowrap bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-all duration-200 font-medium shadow hover:shadow-md text-xs md:text-sm flex items-center justify-center"
                            >
                              <i className="fas fa-check mr-2"></i>Accept
                            </button>
                          )}
                          {pickup.status === 'accepted' && statusFilter === 'accepted' && (
                            <button
                              onClick={() => handleComplete(pickup._id)}
                              className="!rounded-button w-full sm:w-auto cursor-pointer whitespace-nowrap bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all duration-200 font-medium shadow hover:shadow-md text-xs md:text-sm flex items-center justify-center"
                            >
                              <i className="fas fa-check-double mr-2"></i>Complete
                            </button>
                          )}
                          {pickup.phoneNumber && (
                             <button
                                onClick={() => handleCall(pickup.phoneNumber)}
                                title={`Call ${pickup.fullName || 'User'}`}
                                className="!rounded-button w-full sm:w-auto cursor-pointer whitespace-nowrap bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-all duration-200 font-medium shadow hover:shadow-md text-xs md:text-sm flex items-center justify-center"
                             >
                               <i className="fas fa-phone-alt mr-2"></i>Call
                             </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  // Message when no pickups match the filter
                  <div className="text-center py-10 bg-white rounded-2xl shadow-lg border border-gray-100">
                    <i className="fas fa-info-circle text-3xl md:text-4xl text-gray-400 mb-4"></i>
                    <p className="text-gray-600 text-sm md:text-base">
                      No pickups found for the selected status ('{statusFilter === 'all' ? 'Available' : statusFilter}').
                    </p>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 md:py-10 mt-10 md:mt-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} DigitalDump. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default CollectorPickupManagement;
