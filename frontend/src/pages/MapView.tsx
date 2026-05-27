import { useEffect, useState, useCallback } from 'react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import api from '../services/api';
import Spinner from '../components/Spinner';

interface MapBranch {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  kiosk: { id: number; name: string; address: string };
  distance?: number;
}

interface SearchResult {
  id: number;
  product: { id: number; name: string; price: number };
  quantity: number;
  branch: {
    id: number;
    name: string;
    address: string;
    lat: number;
    lng: number;
    kiosk: { id: number; name: string };
  };
  distance: number;
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const DEFAULT_CENTER = { lat: -31.3929, lng: -58.0207 }; // Concordia, Entre Ríos

export default function MapView() {
  const [branches, setBranches] = useState<MapBranch[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<MapBranch | null>(null);
  const [userLocation, setUserLocation] = useState(DEFAULT_CENTER);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [searching, setSearching] = useState(false);
  const [closestBranchId, setClosestBranchId] = useState<number | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setMapCenter(loc);
        },
        () => { /* use default */ }
      );
    }
  }, []);

  useEffect(() => { loadBranches(); }, []);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/map/kiosks?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=50`);
      setBranches(data);
      setSearchResults(null);
      setClosestBranchId(null);
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleSearch = useCallback(async () => {
    if (!search.trim()) { loadBranches(); return; }
    setSearching(true);
    try {
      const { data } = await api.get(`/map/search?product=${encodeURIComponent(search)}&lat=${userLocation.lat}&lng=${userLocation.lng}`);
      setSearchResults(data);

      // Build branch list sorted by distance
      const branchMap = new Map<number, MapBranch>();
      data.forEach((r: SearchResult) => {
        if (!branchMap.has(r.branch.id)) {
          branchMap.set(r.branch.id, {
            id: r.branch.id,
            name: r.branch.name,
            address: r.branch.address,
            lat: r.branch.lat,
            lng: r.branch.lng,
            kiosk: r.branch.kiosk as MapBranch['kiosk'],
            distance: r.distance,
          });
        }
      });

      const sortedBranches = Array.from(branchMap.values()).sort((a, b) => (a.distance || 999) - (b.distance || 999));
      setBranches(sortedBranches);

      // Mark closest
      if (sortedBranches.length > 0) {
        setClosestBranchId(sortedBranches[0].id);
        setMapCenter({ lat: sortedBranches[0].lat, lng: sortedBranches[0].lng });
      }
    } catch { loadBranches(); }
    setSearching(false);
  }, [search, userLocation]);

  const getResultsForBranch = (branchId: number) => {
    if (!searchResults) return null;
    return searchResults.filter((r) => r.branch.id === branchId);
  };

  const formatDistance = (km: number | undefined) => {
    if (!km) return '';
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
  };

  if (!API_KEY) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="text-center py-16 bg-white rounded-2xl border border-surface-100">
          <span className="text-5xl block mb-3">🗺️</span>
          <p className="text-surface-700 font-medium">Google Maps API Key no configurada</p>
          <p className="text-surface-400 text-sm mt-1">Agregá VITE_GOOGLE_MAPS_API_KEY en frontend/.env</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Mapa de Kioscos</h1>
          <p className="text-surface-500 text-sm mt-0.5">Encontrá kioscos cercanos y buscá productos</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Buscar producto en kioscos cercanos..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 bg-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
          aria-label="Buscar en el mapa"
        />
        <button onClick={handleSearch} disabled={searching}
          className="px-5 py-2.5 rounded-xl gradient-primary text-white font-medium text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all disabled:opacity-60 flex items-center gap-2">
          {searching ? <Spinner size="sm" /> : 'Buscar'}
        </button>
        {searchResults && (
          <button onClick={() => { setSearch(''); loadBranches(); }}
            className="px-3 py-2.5 rounded-xl border border-surface-200 text-sm text-surface-600 hover:bg-surface-50 transition-colors">
            Limpiar
          </button>
        )}
      </div>

      {/* Results count */}
      {searchResults && (
        <div className="flex items-center gap-2 text-xs">
          <span className="bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium">
            {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} en {branches.length} sucursal{branches.length !== 1 ? 'es' : ''}
          </span>
          {closestBranchId && (
            <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
              🔥 Más cercano destacado
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 flex-1"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-0">
          {/* Map */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden min-h-[350px] lg:min-h-0 border border-surface-200">
            <APIProvider apiKey={API_KEY}>
              <GoogleMap
                center={mapCenter}
                defaultZoom={13}
                mapId="kioskstar-map"
                gestureHandling="greedy"
                disableDefaultUI={false}
                className="w-full h-full min-h-[350px]"
              >
                {/* User location */}
                <AdvancedMarker position={userLocation}>
                  <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
                </AdvancedMarker>

                {/* Branch markers */}
                {branches.map((b) => {
                  const isClosest = closestBranchId === b.id;
                  const results = getResultsForBranch(b.id);
                  const hasResults = results && results.length > 0;
                  return (
                    <AdvancedMarker
                      key={b.id}
                      position={{ lat: b.lat, lng: b.lng }}
                      onClick={() => setSelectedBranch(selectedBranch?.id === b.id ? null : b)}
                    >
                      {isClosest ? (
                        /* 🔥 Fire aura marker for closest */
                        <div className="relative flex items-center justify-center">
                          <div className="absolute w-16 h-16 rounded-full animate-pulse"
                            style={{
                              background: 'radial-gradient(circle, rgba(255,100,0,0.4) 0%, rgba(255,60,0,0.2) 40%, rgba(255,0,0,0.1) 70%, transparent 100%)',
                              filter: 'blur(4px)',
                            }} />
                          <div className="absolute w-12 h-12 rounded-full animate-ping opacity-30"
                            style={{ background: 'radial-gradient(circle, rgba(255,165,0,0.6) 0%, transparent 70%)' }} />
                          <div className="relative flex items-center gap-1 px-3 py-1.5 rounded-full shadow-xl text-xs font-bold cursor-pointer z-10"
                            style={{
                              background: 'linear-gradient(135deg, #ff6a00, #ee0979)',
                              color: 'white',
                              boxShadow: '0 0 20px rgba(255,100,0,0.5), 0 0 40px rgba(255,60,0,0.3)',
                            }}>
                            🔥 {b.kiosk?.name || b.name}
                          </div>
                        </div>
                      ) : (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full shadow-lg text-xs font-bold cursor-pointer transition-transform hover:scale-110
                          ${selectedBranch?.id === b.id
                            ? 'bg-primary-600 text-white scale-110'
                            : hasResults
                              ? 'bg-emerald-500 text-white'
                              : 'bg-white text-surface-900 border border-surface-200'}`}>
                          🏪 {b.kiosk?.name || b.name}
                        </div>
                      )}
                    </AdvancedMarker>
                  );
                })}

                {/* Info window */}
                {selectedBranch && (
                  <InfoWindow
                    position={{ lat: selectedBranch.lat, lng: selectedBranch.lng }}
                    onCloseClick={() => setSelectedBranch(null)}
                    pixelOffset={[0, -30]}
                  >
                    <div className="p-1 min-w-[180px]">
                      <h3 className="font-bold text-surface-900 text-sm">{selectedBranch.kiosk?.name}</h3>
                      <p className="text-xs text-surface-500 mt-0.5">{selectedBranch.name}</p>
                      <p className="text-xs text-surface-400 mt-0.5">📍 {selectedBranch.address}</p>
                      {selectedBranch.distance !== undefined && (
                        <p className="text-xs text-orange-600 font-medium mt-1">📏 {formatDistance(selectedBranch.distance)}</p>
                      )}
                      {(() => {
                        const results = getResultsForBranch(selectedBranch.id);
                        if (!results || results.length === 0) return null;
                        return (
                          <div className="mt-2 pt-2 border-t border-surface-100">
                            <p className="text-xs font-medium text-surface-700 mb-1">Productos encontrados:</p>
                            {results.map((r) => (
                              <div key={r.id} className="flex items-center justify-between text-xs py-0.5">
                                <span className="text-surface-700">{r.product.name}</span>
                                <div className="flex gap-2">
                                  <span className="text-emerald-600 font-medium">{r.quantity} uds</span>
                                  <span className="text-primary-600 font-medium">${r.product.price}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </APIProvider>
          </div>

          {/* Sidebar list — sorted by distance when searching */}
          <div className="space-y-2 overflow-y-auto max-h-[500px] lg:max-h-full pr-1">
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider px-1">
              {searchResults ? 'Ordenado por cercanía' : `${branches.length} kiosco${branches.length !== 1 ? 's' : ''}`}
            </p>
            {branches.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-3xl block mb-2">🔍</span>
                <p className="text-surface-500 text-sm">No se encontraron kioscos</p>
              </div>
            ) : branches.map((b, idx) => {
              const results = getResultsForBranch(b.id);
              const isClosest = closestBranchId === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    setSelectedBranch(selectedBranch?.id === b.id ? null : b);
                    setMapCenter({ lat: b.lat, lng: b.lng });
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 relative overflow-hidden
                    ${isClosest
                      ? 'border-orange-300 shadow-lg'
                      : selectedBranch?.id === b.id
                        ? 'bg-primary-50 border-primary-200 shadow-sm'
                        : 'bg-white border-surface-100 hover:border-primary-200 hover:shadow-sm'}`}
                  style={isClosest ? {
                    background: 'linear-gradient(135deg, rgba(255,106,0,0.08) 0%, rgba(238,9,121,0.05) 100%)',
                    boxShadow: '0 0 15px rgba(255,100,0,0.15)',
                  } : undefined}
                >
                  {isClosest && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                      🔥 MÁS CERCANO
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-0.5">
                    <h3 className={`font-semibold text-sm ${isClosest ? 'text-orange-900' : 'text-surface-900'}`}>
                      {searchResults && <span className="text-surface-400 mr-1.5">#{idx + 1}</span>}
                      {b.kiosk?.name || b.name}
                    </h3>
                    {b.distance !== undefined && (
                      <span className={`text-xs font-medium shrink-0 ml-2 ${isClosest ? 'text-orange-600' : 'text-surface-400'}`}>
                        {formatDistance(b.distance)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-surface-600">{b.name}</p>
                  <p className="text-xs text-surface-400 mt-0.5">📍 {b.address}</p>
                  {results && results.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {results.map((r) => (
                        <span key={r.id} className={`text-[10px] px-1.5 py-0.5 rounded-full ${isClosest ? 'bg-orange-100 text-orange-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {r.product.name} ({r.quantity}) · ${r.product.price}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
