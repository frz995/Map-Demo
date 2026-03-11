import React, { useState } from 'react';
import { Layers, Building, Map as MapIcon, Navigation, Mountain, Globe, Moon, Sun, ChevronDown, ChevronUp } from 'lucide-react';

interface LayerSidebarProps {
  visibility: {
    roads: boolean;
    buildings: boolean;
    geodetic: boolean;
  };
  onToggleLayer: (layer: 'roads' | 'buildings' | 'geodetic') => void;
  is3DEnabled: boolean;
  onToggle3D: () => void;
  isTerrainEnabled: boolean;
  onToggleTerrain: () => void;
  activeBasemap: 'DARK' | 'LIGHT' | 'SATELLITE';
  onBasemapChange: (basemap: 'DARK' | 'LIGHT' | 'SATELLITE') => void;
  className?: string;
}

const LayerSidebar: React.FC<LayerSidebarProps> = ({
  visibility,
  onToggleLayer,
  is3DEnabled,
  onToggle3D,
  isTerrainEnabled,
  onToggleTerrain,
  activeBasemap,
  onBasemapChange,
  className
}) => {
  const isLightTheme = activeBasemap === 'LIGHT';
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      className={`rounded-lg shadow-lg w-64 border backdrop-blur-sm transition-all duration-300 ease-in-out overflow-hidden ${
        activeBasemap === 'LIGHT'
          ? 'bg-white/90 text-black border-[#d4d4d4]'
          : 'bg-[#2d2d2d]/90 text-white border-[#404040]'
      } ${className || ''}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 text-left font-bold border-b transition-colors ${
          activeBasemap === 'LIGHT' ? 'border-[#d4d4d4] hover:bg-gray-50' : 'border-[#404040] hover:bg-[#363636]'
        }`}
      >
        <div className="flex items-center gap-2">
            <Layers className="text-[#0066cc]" size={14} />
            <h2 className="text-sm">Layers Control</h2>
        </div>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <div className={`transition-all duration-300 ease-in-out origin-top ${
          isOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="p-3 space-y-2">
        
        {/* Basemap Selection */}
        <div>
          <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Basemap</h3>
          <div
            className={`flex gap-1.5 p-1 rounded-md ${
              isLightTheme ? 'bg-[#f3f3f3]' : 'bg-[#1a1a1a]'
            }`}
          >
            <button
              onClick={() => onBasemapChange('LIGHT')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] transition-colors ${
                activeBasemap === 'LIGHT'
                  ? 'bg-[#e0e0e0] text-black shadow-sm'
                  : isLightTheme
                    ? 'text-gray-600 hover:text-black'
                    : 'text-gray-400 hover:text-white'
              }`}
              title="Light Map"
            >
              <Sun size={12} />
              Light
            </button>
            <button
              onClick={() => onBasemapChange('DARK')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] transition-colors ${
                activeBasemap === 'DARK'
                  ? 'bg-[#404040] text-white shadow-sm'
                  : isLightTheme
                    ? 'text-gray-600 hover:text-black'
                    : 'text-gray-400 hover:text-white'
              }`}
              title="Dark Map"
            >
              <Moon size={12} />
              Dark
            </button>
            <button
              onClick={() => onBasemapChange('SATELLITE')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] transition-colors ${
                activeBasemap === 'SATELLITE'
                  ? 'bg-[#0066cc] text-white shadow-sm'
                  : isLightTheme
                    ? 'text-gray-600 hover:text-black'
                    : 'text-gray-400 hover:text-white'
              }`}
              title="Satellite Imagery"
            >
              <Globe size={12} />
              Sat
            </button>
          </div>
        </div>

        <div className={`h-px my-1 ${isLightTheme ? 'bg-gray-200' : 'bg-[#404040]'}`} />

        {/* 3D Globe Toggle */}
        <div
          className={`flex items-center justify-between p-1.5 rounded transition-colors ${
            isLightTheme ? 'hover:bg-[#f3f3f3]' : 'hover:bg-[#363636]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Globe size={16} className={is3DEnabled ? "text-[#0066cc]" : (isLightTheme ? "text-gray-500" : "text-gray-400")} />
            <span className="text-xs font-medium">3D Globe</span>
          </div>
          <button
            onClick={onToggle3D}
            className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${
              is3DEnabled ? 'bg-[#0066cc]' : (isLightTheme ? 'bg-gray-300' : 'bg-[#404040]')
            }`}
          >
            <div
              className={`w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${
                is3DEnabled ? 'left-4' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* 3D Terrain (Hillshade) Toggle */}
        <div
          className={`flex items-center justify-between p-1.5 rounded transition-colors ${
            isLightTheme ? 'hover:bg-[#f3f3f3]' : 'hover:bg-[#363636]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Mountain size={16} className={isTerrainEnabled ? "text-[#0066cc]" : (isLightTheme ? "text-gray-500" : "text-gray-400")} />
            <span className="text-xs font-medium">3D Terrain</span>
          </div>
          <button
            onClick={onToggleTerrain}
            className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${
              isTerrainEnabled ? 'bg-[#0066cc]' : (isLightTheme ? 'bg-gray-300' : 'bg-[#404040]')
            }`}
          >
            <div
              className={`w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${
                isTerrainEnabled ? 'left-4' : 'left-1'
              }`}
            />
          </button>
        </div>

        <div className={`h-px my-1 ${isLightTheme ? 'bg-gray-200' : 'bg-[#404040]'}`} />

        {/* Layer Toggles */}
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 px-1.5">OVERLAYS</h3>

        {/* Road Network */}
        <div
          className={`flex items-center justify-between p-1.5 rounded transition-colors ${
            isLightTheme ? 'hover:bg-[#f3f3f3]' : 'hover:bg-[#363636]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Navigation size={16} className={visibility.roads ? "text-[#0066cc]" : (isLightTheme ? "text-gray-500" : "text-gray-400")} />
            <span className="text-xs font-medium">Road Network</span>
          </div>
          <button
            onClick={() => onToggleLayer('roads')}
            className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${
              visibility.roads ? 'bg-[#0066cc]' : (isLightTheme ? 'bg-gray-300' : 'bg-[#404040]')
            }`}
          >
            <div
              className={`w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${
                visibility.roads ? 'left-4' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Planned Buildings */}
        <div
          className={`flex items-center justify-between p-1.5 rounded transition-colors ${
            isLightTheme ? 'hover:bg-[#f3f3f3]' : 'hover:bg-[#363636]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building size={16} className={visibility.buildings ? "text-[#0066cc]" : (isLightTheme ? "text-gray-500" : "text-gray-400")} />
            <span className="text-xs font-medium">Planned Buildings</span>
          </div>
          <button
            onClick={() => onToggleLayer('buildings')}
            className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${
              visibility.buildings ? 'bg-[#0066cc]' : (isLightTheme ? 'bg-gray-300' : 'bg-[#404040]')
            }`}
          >
            <div
              className={`w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${
                visibility.buildings ? 'left-4' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Geodetic Points */}
        <div
          className={`flex items-center justify-between p-1.5 rounded transition-colors ${
            isLightTheme ? 'hover:bg-[#f3f3f3]' : 'hover:bg-[#363636]'
          }`}
        >
          <div className="flex items-center gap-2">
            <MapIcon size={16} className={visibility.geodetic ? "text-[#0066cc]" : (isLightTheme ? "text-gray-500" : "text-gray-400")} />
            <span className="text-xs font-medium">Geodetic Points</span>
          </div>
          <button
            onClick={() => onToggleLayer('geodetic')}
            className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${
              visibility.geodetic ? 'bg-[#0066cc]' : (isLightTheme ? 'bg-gray-300' : 'bg-[#404040]')
            }`}
          >
            <div
              className={`w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${
                visibility.geodetic ? 'left-4' : 'left-1'
              }`}
            />
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default LayerSidebar;
