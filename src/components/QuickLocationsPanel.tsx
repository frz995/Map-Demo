import React, { useState } from 'react';
import { Navigation, ChevronDown, ChevronUp } from 'lucide-react';
import { DUMMY_ROADS_GEOJSON, DUMMY_BUILDINGS_GEOJSON, DUMMY_GEODETIC_GEOJSON } from '../utils/mapConfig';

interface QuickLocationsPanelProps {
  activeBasemap: 'DARK' | 'LIGHT' | 'SATELLITE';
  onFlyToLocation: (location: 'HOME' | 'ROADS' | 'BUILDINGS') => void;
}

const QuickLocationsPanel: React.FC<QuickLocationsPanelProps> = ({ activeBasemap, onFlyToLocation }) => {
  const [isLocationsOpen, setIsLocationsOpen] = useState(true);

  const stats = {
    home: DUMMY_GEODETIC_GEOJSON.features.length,
    roads: DUMMY_ROADS_GEOJSON.features.length,
    buildings: DUMMY_BUILDINGS_GEOJSON.features.length
  };

  return (
    <div 
        className={`rounded-lg shadow-lg w-full backdrop-blur-sm border transition-all duration-300 ease-in-out overflow-hidden ${
        activeBasemap === 'LIGHT' 
            ? 'bg-white/90 text-gray-800 border-gray-200' 
            : 'bg-[#2d2d2d]/90 text-white border-[#404040]'
        }`}
    >
      <button 
        onClick={() => setIsLocationsOpen(!isLocationsOpen)}
        className={`w-full flex items-center justify-between p-3 text-sm font-bold ${
            isLocationsOpen ? 'border-b' : ''
        } ${
            activeBasemap === 'LIGHT' ? 'border-gray-200' : 'border-[#404040]'
        }`}
      >
        <div className="flex items-center gap-2">
            <Navigation size={14} className="text-[#0066cc]" />
            Quick Locations
        </div>
        {isLocationsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      
      <div className={`transition-all duration-300 ease-in-out origin-top ${
          isLocationsOpen ? 'max-h-40 opacity-100 p-3 pt-2' : 'max-h-0 opacity-0 p-0 overflow-hidden'
      }`}>
        <div className="space-y-1.5">
            <button
            onClick={() => onFlyToLocation('HOME')}
            className={`w-full text-left px-2 py-1.5 rounded transition-colors text-xs font-medium flex items-center justify-between group ${
                activeBasemap === 'LIGHT'
                ? 'hover:bg-blue-50 text-gray-700 hover:text-[#0066cc]'
                : 'hover:bg-[#404040] text-gray-200 hover:text-[#4da6ff]'
            }`}
            >
            <span className="flex items-center gap-2"><span>🏠</span> Lagos Home</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeBasemap === 'LIGHT' ? 'bg-gray-100 text-gray-500' : 'bg-[#3d3d3d] text-gray-400'
            }`}>{stats.home} Mkrs</span>
            </button>
            <button
            onClick={() => onFlyToLocation('ROADS')}
            className={`w-full text-left px-2 py-1.5 rounded transition-colors text-xs font-medium flex items-center justify-between group ${
                activeBasemap === 'LIGHT'
                ? 'hover:bg-blue-50 text-gray-700 hover:text-[#0066cc]'
                : 'hover:bg-[#404040] text-gray-200 hover:text-[#4da6ff]'
            }`}
            >
            <span className="flex items-center gap-2"><span>🛣️</span> Coastal Road</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeBasemap === 'LIGHT' ? 'bg-gray-100 text-gray-500' : 'bg-[#3d3d3d] text-gray-400'
            }`}>{stats.roads} Route</span>
            </button>
            <button
            onClick={() => onFlyToLocation('BUILDINGS')}
            className={`w-full text-left px-2 py-1.5 rounded transition-colors text-xs font-medium flex items-center justify-between group ${
                activeBasemap === 'LIGHT'
                ? 'hover:bg-blue-50 text-gray-700 hover:text-[#0066cc]'
                : 'hover:bg-[#404040] text-gray-200 hover:text-[#4da6ff]'
            }`}
            >
            <span className="flex items-center gap-2"><span>🏢</span> Govt. Complex</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeBasemap === 'LIGHT' ? 'bg-gray-100 text-gray-500' : 'bg-[#3d3d3d] text-gray-400'
            }`}>{stats.buildings} Bldgs</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default QuickLocationsPanel;
