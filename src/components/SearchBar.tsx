import React, { useMemo, useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Map, Popup } from 'maplibre-gl';
import { DUMMY_ROADS_GEOJSON, DUMMY_BUILDINGS_GEOJSON, DUMMY_GEODETIC_GEOJSON } from '../utils/mapConfig';
import * as turf from '@turf/turf';
import type { Feature, Geometry } from 'geojson';

interface SearchBarProps {
  map: Map | null;
  activeBasemap: 'DARK' | 'LIGHT' | 'SATELLITE';
}

interface SearchResult {
  id: string;
  name: string;
  type: string;
  geometry: Geometry;
  properties: Record<string, unknown>;
}

const SearchBar: React.FC<SearchBarProps> = ({ map, activeBasemap }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const isLightTheme = activeBasemap === 'LIGHT';

  // Consolidate searchable data
  const allFeatures: Array<{ featureType: string; geometry: Geometry; properties: Record<string, unknown> }> = useMemo(
    () => [
      ...DUMMY_ROADS_GEOJSON.features.map((f) => ({ featureType: 'Road', geometry: f.geometry, properties: f.properties })),
      ...DUMMY_BUILDINGS_GEOJSON.features.map((f) => ({ featureType: 'Building', geometry: f.geometry, properties: f.properties })),
      ...DUMMY_GEODETIC_GEOJSON.features.map((f) => ({ featureType: 'Geodetic Point', geometry: f.geometry, properties: f.properties })),
    ],
    [],
  );

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const filtered = allFeatures
      .filter((f) => {
        const nameOrId = f.properties.name ?? f.properties.id ?? '';
        return String(nameOrId).toLowerCase().includes(query.toLowerCase());
      })
      .map((f, i) => {
        const nameOrId = f.properties.name ?? f.properties.id ?? 'Unknown Feature';
        return {
          id: `result-${i}`,
          name: String(nameOrId),
          type: f.featureType,
          geometry: f.geometry,
          properties: f.properties,
        };
      });

    setResults(filtered);
    setShowResults(true);
  }, [allFeatures, query]);

  const handleSelect = (result: SearchResult) => {
    if (!map) return;

    // Calculate bounding box for zoom
    const feature: Feature<Geometry, Record<string, unknown>> = { type: 'Feature', geometry: result.geometry, properties: result.properties };
    const bbox = turf.bbox(feature as unknown as turf.AllGeoJSON);

    map.fitBounds(bbox as [number, number, number, number], {
      padding: 100,
      maxZoom: 16,
      duration: 1500
    });

    // Create a temporary popup
    new Popup()
        .setLngLat(turf.center(feature as unknown as turf.AllGeoJSON).geometry.coordinates as [number, number])
        .setHTML(`<h3>${result.name}</h3><p>${result.type}</p>`)
        .addTo(map);

    setQuery(result.name);
    setShowResults(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-96 z-50">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search places, roads, or points..."
          className={
            isLightTheme
              ? 'w-full bg-white text-black pl-10 pr-10 py-2.5 rounded-full border border-[#d4d4d4] focus:outline-none focus:border-[#0066cc] shadow-lg'
              : 'w-full bg-[#2d2d2d] text-white pl-10 pr-10 py-2.5 rounded-full border border-[#404040] focus:outline-none focus:border-[#0066cc] shadow-lg'
          }
        />
        <Search
          className={`absolute left-3.5 top-2.5 ${
            isLightTheme ? 'text-gray-500' : 'text-gray-400'
          }`}
          size={18}
        />
        {query && (
          <button 
            onClick={clearSearch}
            className={`absolute right-3 top-2.5 ${
              isLightTheme ? 'text-gray-500 hover:text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div
          className={
            isLightTheme
              ? 'absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-[#d4d4d4] overflow-hidden max-h-60 overflow-y-auto'
              : 'absolute top-full mt-2 w-full bg-[#2d2d2d] rounded-lg shadow-xl border border-[#404040] overflow-hidden max-h-60 overflow-y-auto'
          }
        >
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className={
                isLightTheme
                  ? 'w-full text-left px-4 py-3 hover:bg-[#f3f3f3] border-b border-[#e5e5e5] last:border-0 transition-colors flex justify-between items-center group'
                  : 'w-full text-left px-4 py-3 hover:bg-[#363636] border-b border-[#404040] last:border-0 transition-colors flex justify-between items-center group'
              }
            >
              <span
                className={
                  isLightTheme
                    ? 'text-black font-medium group-hover:text-[#0066cc] transition-colors'
                    : 'text-white font-medium group-hover:text-[#0066cc] transition-colors'
                }
              >
                {result.name}
              </span>
              <span
                className={
                  isLightTheme
                    ? 'text-xs text-gray-600 uppercase tracking-wider'
                    : 'text-xs text-gray-500 uppercase tracking-wider'
                }
              >
                {result.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
