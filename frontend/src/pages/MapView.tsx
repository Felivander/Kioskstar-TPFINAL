import { useEffect, useState, useCallback, useRef } from 'react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Spinner from '../components/Spinner';
import { Locate, Flame, Store, Search, MapPin, Package, Compass, Navigation, X } from 'lucide-react';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

interface MapBranch {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  kiosk: { id: number; name: string; address: string; imageUrl?: string | null };
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
    kiosk: { id: number; name: string; imageUrl?: string | null };
  };
  distance: number;
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const DEFAULT_CENTER = { lat: -31.3929, lng: -58.0207 }; // Concordia, Entre Ríos

interface MapHandlerProps {
  mapRef: React.MutableRefObject<any>;
  initialCenter?: { lat: number; lng: number };
}

function MapHandler({ mapRef, initialCenter }: MapHandlerProps) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
    if (map && initialCenter) {
      map.panTo(initialCenter);
    }
  }, [map, mapRef, initialCenter]);

  return null;
}

export default function MapView() {
  const [branches, setBranches] = useState<MapBranch[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<MapBranch | null>(null);
  const [userLocation, setUserLocation] = useState(DEFAULT_CENTER);
  const [initialCenter, setInitialCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [searching, setSearching] = useState(false);
  const [closestBranchId, setClosestBranchId] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const mapRef = useRef<any>(null);

  const selectBranchAndZoom = (b: MapBranch) => {
    if (selectedBranch?.id === b.id) {
      setSelectedBranch(null);
      if (mapRef.current) {
        mapRef.current.setZoom(13);
      }
    } else {
      setSelectedBranch(b);
      // Offset center coordinate so the marker is not hidden behind the floating panel
      const isLargeScreen = window.innerWidth >= 1024;
      if (mapRef.current) {
        if (isLargeScreen) {
          mapRef.current.panTo({ lat: b.lat, lng: b.lng - 0.0035 });
        } else {
          mapRef.current.panTo({ lat: b.lat - 0.0018, lng: b.lng });
        }
        mapRef.current.setZoom(16);
      }
    }
  };

  const recenterUserLocation = () => {
    console.log('Solicitando ubicación de usuario...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          console.log('Ubicación obtenida:', loc);
          setUserLocation(loc);
          if (mapRef.current) {
            mapRef.current.panTo(loc);
            mapRef.current.setZoom(16);
          }
        },
        (err) => {
          console.error('Error de geolocalización:', err);
          alert(`No se pudo acceder a tu ubicación (${err.message}). Por favor activa los permisos de GPS.`);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
      );
    } else {
      alert('Tu navegador no soporta geolocalización.');
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setInitialCenter(loc);
        },
        () => { /* use default */ },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
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

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) { loadBranches(); return; }
    setSearching(true);
    try {
      const { data } = await api.get(`/map/search?product=${encodeURIComponent(query)}&lat=${userLocation.lat}&lng=${userLocation.lng}`);
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
        if (mapRef.current) {
          mapRef.current.panTo({ lat: sortedBranches[0].lat, lng: sortedBranches[0].lng });
        }
      }
    } catch { loadBranches(); }
    setSearching(false);
  }, [userLocation]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(search);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search, performSearch]);

  const getResultsForBranch = (branchId: number) => {
    if (!searchResults) return null;
    return searchResults.filter((r) => r.branch.id === branchId);
  };

  const formatDistance = (km: number | undefined) => {
    if (!km) return '';
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
  };

  const renderDetailsContent = (b: MapBranch) => {
    const results = getResultsForBranch(b.id);
    const hasImage = b.kiosk?.imageUrl && !failedImages[b.id];
    return (
      <>
        {/* Header / Photo Banner */}
        <div className="relative w-full h-28 lg:h-36 bg-gradient-to-br from-primary-500/10 to-primary-600/5 flex items-center justify-center overflow-hidden shrink-0">
          {hasImage ? (
            <img
              src={b.kiosk.imageUrl || undefined}
              alt={b.kiosk.name}
              onError={() => setFailedImages((prev) => ({ ...prev, [b.id]: true }))}
              className="w-full h-full object-cover"
            />
          ) : (
            <Store size={36} className="text-surface-400" />
          )}
          {/* Close Button */}
          <button
            onClick={() => setSelectedBranch(null)}
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/75 transition-colors shadow-sm cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content Container (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-extrabold text-surface-900 text-base leading-tight truncate flex-1">{b.kiosk?.name || b.name}</h2>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-surface-500 font-medium truncate flex items-center gap-0.5 max-w-[120px]" title={b.address}>
                  <MapPin size={11} className="text-surface-400 shrink-0" />
                  {b.address}
                </span>
                {b.distance !== undefined && (
                  <span className="text-[10px] text-orange-600 font-extrabold bg-orange-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0" title={`A ${formatDistance(b.distance)} de tu ubicación`}>
                    <Navigation size={9} className="text-primary-600 rotate-45 shrink-0" />
                    {formatDistance(b.distance)}
                  </span>
                )}
              </div>
            </div>
            {b.kiosk?.name && b.kiosk.name !== b.name && (
              <p className="text-[10px] text-surface-400 font-medium mt-0.5">{b.name}</p>
            )}
          </div>

          {/* Stock Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1.5">
              Stock Disponible ({results?.length || 0})
            </h3>
            {results && results.length > 0 ? (
              <div className="flex flex-col gap-1.5 overflow-y-auto pr-0.5">
                {results.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-surface-100 hover:border-primary-100 transition-colors shadow-sm">
                    <span className="text-surface-800 font-semibold truncate mr-2">{r.product.name}</span>
                    <div className="flex gap-2 shrink-0 items-center">
                      <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md text-[10px]">{r.quantity} uds</span>
                      <span className="text-primary-600 font-extrabold">${r.product.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 bg-surface-50 rounded-xl border border-surface-100 border-dashed">
                <Package size={18} className="mx-auto mb-1 text-surface-400" />
                <p className="text-[10px] text-surface-400">No hay stock registrado para búsqueda</p>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  if (!API_KEY) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="text-center py-16 bg-white rounded-2xl border border-surface-100">
          <Compass size={48} className="mx-auto mb-3 text-surface-400" />
          <p className="text-surface-700 font-medium">Google Maps API Key no configurada</p>
          <p className="text-surface-400 text-sm mt-1">Agregá VITE_GOOGLE_MAPS_API_KEY en frontend/.env</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="shrink-0">
          <h1 className="text-xl font-bold text-surface-900">Mapa de Kioscos</h1>
          <p className="text-surface-500 text-xs mt-0.5">Encontrá kioscos cercanos y buscá productos</p>
        </div>

        {/* Search */}
        <div className="flex gap-2 flex-1 max-w-md w-full md:justify-end">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && performSearch(search)}
            placeholder="Buscar producto..."
            className="flex-1 max-w-xs px-3.5 py-1.5 rounded-xl border border-surface-200 bg-white focus:ring-2 focus:ring-primary-500 outline-none text-xs"
            aria-label="Buscar en el mapa"
          />
          <button onClick={() => performSearch(search)} disabled={searching}
            className="px-4 py-1.5 rounded-xl gradient-primary text-white font-medium text-xs shadow-md shadow-primary-500/20 hover:shadow-lg transition-all disabled:opacity-60 flex items-center gap-1.5 shrink-0">
            {searching ? <Spinner size="sm" /> : 'Buscar'}
          </button>
          {searchResults && (
            <button onClick={() => { setSearch(''); loadBranches(); }}
              className="px-3 py-1.5 rounded-xl border border-surface-200 text-xs text-surface-600 hover:bg-surface-50 transition-colors shrink-0">
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      {searchResults && (
        <div className="flex items-center gap-2 text-xs">
          <span className="bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium">
            {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} en {branches.length} sucursal{branches.length !== 1 ? 'es' : ''}
          </span>
          {closestBranchId && (
            <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
              <Flame size={12} className="w-3.5 h-3.5 text-orange-700 fill-current inline mr-0.5" /> Más cercano destacado
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0 w-full overflow-hidden">
          {/* Map Area with absolute Map and floating Details overlay */}
          <div className="relative flex-1 min-h-[350px] lg:min-h-0 w-full h-full lg:w-5/6">
            <div className="absolute inset-0 rounded-2xl overflow-hidden border border-surface-200">
              <APIProvider apiKey={API_KEY}>
                <GoogleMap
                  defaultCenter={DEFAULT_CENTER}
                  defaultZoom={13}
                  mapId="kioskstar-map"
                  gestureHandling="greedy"
                  disableDefaultUI={true}
                  className="w-full h-full"
                >
                  <MapHandler mapRef={mapRef} initialCenter={initialCenter} />
                  {/* User location */}
                  <AdvancedMarker position={userLocation}>
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-8 h-8 rounded-full bg-primary-400/30 animate-ping" />
                      <div className="absolute w-12 h-12 rounded-full bg-primary-500/10 blur-sm -z-10" />
                      <div className="w-3.5 h-3.5 bg-primary-500 rounded-full border-2 border-white shadow-md" />
                    </div>
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
                        onClick={() => selectBranchAndZoom(b)}
                      >
                        {isClosest ? (
                          /* Flame aura marker for closest */
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
                              <Flame size={12} className="text-white fill-white inline shrink-0" /> {b.kiosk?.name || b.name}
                            </div>
                          </div>
                        ) : (
                          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full shadow-lg text-xs font-bold cursor-pointer transition-transform hover:scale-110
                            ${selectedBranch?.id === b.id
                              ? 'bg-primary-600 text-white scale-110'
                              : hasResults
                                ? 'bg-emerald-500 text-white'
                                : 'bg-white text-surface-900 border border-surface-200'}`}>
                            <Store size={12} className="inline shrink-0" /> {b.kiosk?.name || b.name}
                          </div>
                        )}
                      </AdvancedMarker>
                    );
                  })}
                </GoogleMap>
              </APIProvider>
            </div>

            {/* Selected Kiosk Details Panel - Desktop (Slide over map) */}
            <AnimatePresence>
              {selectedBranch && (
                <motion.div
                  key="desktop-details"
                  initial={{ x: '-105%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '-105%', opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 28 }}
                  className="hidden lg:flex absolute left-10 top-6 bottom-6 w-[320px] z-10 bg-white/80 backdrop-blur-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] border border-white/50 rounded-3xl flex flex-col overflow-hidden transition-all duration-300"
                >
                  {renderDetailsContent(selectedBranch)}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected Kiosk Details Panel - Mobile (Slide Up over map) */}
            <AnimatePresence>
              {selectedBranch && (
                <motion.div
                  key="mobile-details"
                  initial={{ y: '105%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '105%', opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 28 }}
                  className="lg:hidden absolute left-4 bottom-4 w-[calc(100%-2rem)] max-w-[320px] h-[360px] z-10 bg-white/80 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-white/50 rounded-3xl flex flex-col overflow-hidden"
                >
                  {renderDetailsContent(selectedBranch)}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botón Geolocalización */}
            <button
              onClick={recenterUserLocation}
              className="absolute right-4 bottom-24 bg-white hover:bg-surface-50 border border-surface-200/80 rounded-xl p-2.5 shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer z-10 text-primary-600 flex items-center justify-center"
              title="Mi ubicación"
            >
              <Locate size={18} />
            </button>
          </div>

          {/* Sidebar list — sorted by distance when searching */}
          <div className="w-full lg:w-1/6 space-y-2 overflow-y-auto max-h-[500px] lg:max-h-full pr-1 lg:pr-6 lg:-mr-6 shrink-0 custom-scrollbar relative">
            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-20">
                <Spinner size="md" />
              </div>
            )}
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider px-1">
              {searchResults ? 'Ordenado por cercanía' : `${branches.length} kiosco${branches.length !== 1 ? 's' : ''}`}
            </p>
            {branches.length === 0 ? (
              <div className="text-center py-8">
                <Search size={32} className="mx-auto mb-2 text-surface-400" />
                <p className="text-surface-500 text-sm">No se encontraron kioscos</p>
              </div>
            ) : (
              <motion.div
                key={branches.map((b) => b.id).join(',')}
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {branches.map((b, idx) => {
                  const results = getResultsForBranch(b.id);
                  const isClosest = closestBranchId === b.id;
                  return (
                    <motion.button
                      key={b.id}
                      variants={itemVariants}
                      onClick={() => selectBranchAndZoom(b)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 relative overflow-hidden block cursor-pointer
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
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-0.5">
                          <Flame size={10} className="w-2.5 h-2.5 fill-current" /> MÁS CERCANO
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
                      <p className="text-xs text-surface-400 mt-0.5 flex items-center gap-1">
                        <MapPin size={12} className="text-surface-400 shrink-0" />
                        <span>{b.address}</span>
                      </p>
                      {results && results.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {results.map((r) => (
                            <span key={r.id} className={`text-[10px] px-1.5 py-0.5 rounded-full ${isClosest ? 'bg-orange-100 text-orange-700' : 'bg-emerald-50 text-emerald-700'}`}>
                              {r.product.name} ({r.quantity}) · ${r.product.price}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>
      </div>
  );
}
