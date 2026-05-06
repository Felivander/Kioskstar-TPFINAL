import { useEffect, useState } from 'react';
import api from '../services/api';
import Spinner from '../components/Spinner';

interface MapKiosk {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  branches: { id: number; name: string; address: string }[];
}

export default function MapView() {
  const [kiosks, setKiosks] = useState<MapKiosk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedKiosk, setSelectedKiosk] = useState<MapKiosk | null>(null);

  useEffect(() => {
    loadKiosks();
  }, []);

  const loadKiosks = async () => {
    try {
      const { data } = await api.get('/kiosks');
      setKiosks(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) { loadKiosks(); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/map/search?product=${encodeURIComponent(search)}`);
      setKiosks(data);
    } catch {
      // fallback to all
      loadKiosks();
    } finally {
      setLoading(false);
    }
  };

  const filtered = kiosks.filter((k) =>
    k.name.toLowerCase().includes(search.toLowerCase()) ||
    k.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Mapa de Kioscos</h1>
        <p className="text-surface-500 text-sm mt-1">Encontrá kioscos cercanos y buscá productos</p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Buscar kiosco o producto..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 bg-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
          aria-label="Buscar en el mapa"
        />
        <button onClick={handleSearch}
          className="px-5 py-2.5 rounded-xl gradient-primary text-white font-medium text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all">
          Buscar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map placeholder */}
          <div className="lg:col-span-2 bg-surface-900 rounded-2xl overflow-hidden min-h-[400px] flex items-center justify-center relative">
            <div id="google-map" className="absolute inset-0" />
            {/* Placeholder when Google Maps not loaded */}
            <div className="text-center text-surface-400 z-10">
              <span className="text-6xl block mb-4">🗺️</span>
              <p className="text-lg font-medium text-surface-300">Mapa Interactivo</p>
              <p className="text-sm mt-1">Google Maps API se integra aquí</p>
              <p className="text-xs mt-2 text-surface-500">{filtered.length} kioscos encontrados</p>
            </div>
          </div>

          {/* Kiosk list */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-2">🔍</span>
                <p className="text-surface-500 text-sm">No se encontraron kioscos</p>
              </div>
            ) : filtered.map((kiosk) => (
              <button
                key={kiosk.id}
                onClick={() => setSelectedKiosk(selectedKiosk?.id === kiosk.id ? null : kiosk)}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-200
                  ${selectedKiosk?.id === kiosk.id
                    ? 'bg-primary-50 border-primary-200 shadow-sm'
                    : 'bg-white border-surface-100 hover:border-primary-200 hover:shadow-sm'}`}
                aria-label={`Ver kiosco ${kiosk.name}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-surface-900 text-sm">{kiosk.name}</h3>
                  <span className="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded-full">
                    {kiosk.branches?.length || 0} suc.
                  </span>
                </div>
                <p className="text-xs text-surface-500 flex items-center gap-1">📍 {kiosk.address}</p>
                {selectedKiosk?.id === kiosk.id && kiosk.branches?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-primary-100 space-y-1">
                    {kiosk.branches.map((b) => (
                      <p key={b.id} className="text-xs text-surface-600">• {b.name} — {b.address}</p>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
