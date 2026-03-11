import React, { useRef, useState, useEffect } from 'react';
import { Ruler, Trash2 } from 'lucide-react';
import { type MapMouseEvent, Map, GeoJSONSource } from 'maplibre-gl';
import * as turf from '@turf/turf';

interface MeasurementToolProps {
  map: Map | null;
  activeBasemap: 'DARK' | 'LIGHT' | 'SATELLITE';
}

const MeasurementTool: React.FC<MeasurementToolProps> = ({ map, activeBasemap }) => {
  const [isActive, setIsActive] = useState(false);
  const [distance, setDistance] = useState<number>(0);
  const pointsRef = useRef<number[][]>([]);
  const isLightTheme = activeBasemap === 'LIGHT';

  useEffect(() => {
    if (!map) return;

    // Add source and layer for measurement line
    if (!map.getSource('measure-source')) {
      map.addSource('measure-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: []
          },
          properties: {}
        }
      });

      map.addLayer({
        id: 'measure-line',
        type: 'line',
        source: 'measure-source',
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          'line-color': '#ff0000',
          'line-width': 3,
          'line-dasharray': [2, 2]
        }
      });

      map.addLayer({
        id: 'measure-points',
        type: 'circle',
        source: 'measure-source',
        paint: {
          'circle-radius': 5,
          'circle-color': '#ff0000',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });
    }

    const handleClick = (e: MapMouseEvent) => {
      if (!isActive) return;

      const newPoint = [e.lngLat.lng, e.lngLat.lat];
      const updated = [...pointsRef.current, newPoint];
      pointsRef.current = updated;
        
      const source = map.getSource('measure-source') as GeoJSONSource;
      if (source) {
        source.setData({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: updated,
          },
          properties: {},
        });
      }

      if (updated.length > 1) {
        const line = turf.lineString(updated);
        const length = turf.length(line, { units: 'kilometers' });
        setDistance(length);
      }
    };

    if (isActive) {
      map.getCanvas().style.cursor = 'crosshair';
      map.on('click', handleClick);
    } else {
      map.getCanvas().style.cursor = '';
      map.off('click', handleClick);
    }

    return () => {
      map.off('click', handleClick);
    };
  }, [isActive, map]);

  const resetMeasurement = () => {
    pointsRef.current = [];
    setDistance(0);
    if (map) {
      const source = map.getSource('measure-source') as GeoJSONSource;
      if (source) {
        source.setData({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: []
            },
            properties: {}
        });
      }
    }
  };

  const toggleTool = () => {
    setIsActive(!isActive);
    if (isActive) {
      // Deactivating
      resetMeasurement();
    }
  };

  return (
    <div className="absolute bottom-24 right-4 z-50 flex flex-col gap-2">
      <button
        onClick={toggleTool}
        className={`p-3 rounded-full shadow-lg transition-colors flex items-center justify-center group ${
          isActive
            ? 'bg-[#ff0000] text-white'
            : isLightTheme
              ? 'bg-white text-black hover:bg-[#f3f3f3]'
              : 'bg-[#2d2d2d] text-white hover:bg-[#363636]'
        }`}
        title="Measure Distance"
      >
        <Ruler size={24} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap group-hover:ml-2">
          Measure
        </span>
      </button>

      {isActive && (
        <div
          className={`p-3 rounded-lg shadow-lg border w-48 animate-in fade-in slide-in-from-top-2 ${
            isLightTheme ? 'bg-white border-[#d4d4d4]' : 'bg-[#2d2d2d] border-[#404040]'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span
              className={
                isLightTheme
                  ? 'text-xs font-semibold text-gray-600 uppercase'
                  : 'text-xs font-semibold text-gray-400 uppercase'
              }
            >
              Distance
            </span>
            <button
              onClick={resetMeasurement}
              className={isLightTheme ? 'text-gray-500 hover:text-black' : 'text-gray-400 hover:text-white'}
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className={isLightTheme ? 'text-xl font-bold text-black' : 'text-xl font-bold text-white'}>
            {distance.toFixed(2)}{' '}
            <span className={isLightTheme ? 'text-sm font-normal text-gray-600' : 'text-sm font-normal text-gray-400'}>
              km
            </span>
          </div>
          <div className={isLightTheme ? 'text-xs text-gray-600 mt-1' : 'text-xs text-gray-500 mt-1'}>
            Click on map to add points
          </div>
        </div>
      )}
    </div>
  );
};

export default MeasurementTool;
