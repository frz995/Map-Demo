import { useState } from 'react';
import { Map } from 'maplibre-gl';
import MapContainer from './components/MapContainer';
import LayerSidebar from './components/LayerSidebar';
import PropertyPanel from './components/PropertyPanel';
import KMLExport from './components/KMLExport';
import SearchBar from './components/SearchBar';
import MeasurementTool from './components/MeasurementTool';
import CesiumGlobe from './components/CesiumGlobe';
import QuickLocationsPanel from './components/QuickLocationsPanel';
import { LAYERS } from './utils/mapConfig';
import './css/main.css';

function App() {
  const [mapInstance, setMapInstance] = useState<Map | null>(null);
  const [layersVisibility, setLayersVisibility] = useState({
    roads: true,
    buildings: true,
    geodetic: true,
  });
  const [is3DEnabled, setIs3DEnabled] = useState(false);
  const [isTerrainEnabled, setIsTerrainEnabled] = useState(false);
  const [initialCameraView, setInitialCameraView] = useState<{lng: number, lat: number, zoom: number} | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<Record<string, unknown> | null>(null);
  const [activeBasemap, setActiveBasemap] = useState<'DARK' | 'LIGHT' | 'SATELLITE'>('DARK');
  
  // Callback to trigger flyTo in Cesium
  const [flyTo3D, setFlyTo3D] = useState<((location: 'HOME' | 'ROADS' | 'BUILDINGS') => void) | null>(null);

  const blinkLayer = (layerId: string, type: 'line' | 'fill-extrusion' | 'symbol' | 'circle') => {
    if (!mapInstance) return;

    let count = 0;
    const maxBlinks = 6; // 3 cycles
    
    // Get original opacity or set defaults
    const originalOpacity = type === 'line' ? 0.8 : (type === 'fill-extrusion' ? 0.9 : 1);

    const interval = setInterval(() => {
        count++;
        // Blink state: dimmed
        const isDimmed = count % 2 !== 0;
        const opacity = isDimmed ? 0.2 : originalOpacity;
        
        try {
            if (mapInstance.getLayer(layerId)) {
                if (type === 'line') {
                    mapInstance.setPaintProperty(layerId, 'line-opacity', opacity);
                } else if (type === 'fill-extrusion') {
                     mapInstance.setPaintProperty(layerId, 'fill-extrusion-opacity', opacity);
                } else if (type === 'symbol') {
                     mapInstance.setPaintProperty(layerId, 'text-opacity', opacity);
                     mapInstance.setPaintProperty(layerId, 'icon-opacity', opacity);
                } else if (type === 'circle') {
                     mapInstance.setPaintProperty(layerId, 'circle-opacity', opacity);
                     mapInstance.setPaintProperty(layerId, 'circle-stroke-opacity', opacity);
                }
            }
        } catch (e) {
            console.warn("Error blinking layer:", e);
            clearInterval(interval);
        }

        if (count >= maxBlinks) {
            clearInterval(interval);
            // Ensure restored to original
            try {
                if (mapInstance.getLayer(layerId)) {
                    if (type === 'line') {
                        mapInstance.setPaintProperty(layerId, 'line-opacity', originalOpacity);
                    } else if (type === 'fill-extrusion') {
                         mapInstance.setPaintProperty(layerId, 'fill-extrusion-opacity', originalOpacity);
                    } else if (type === 'symbol') {
                         mapInstance.setPaintProperty(layerId, 'text-opacity', 1);
                         mapInstance.setPaintProperty(layerId, 'icon-opacity', 1);
                    } else if (type === 'circle') {
                         mapInstance.setPaintProperty(layerId, 'circle-opacity', 1);
                         mapInstance.setPaintProperty(layerId, 'circle-stroke-opacity', 1);
                    }
                }
            } catch (err) {
                console.warn("Error restoring layer opacity:", err);
            }
        }
    }, 300);
  };

  const handleFlyToLocation = (location: 'HOME' | 'ROADS' | 'BUILDINGS') => {
    console.log("App: handleFlyToLocation called with", location, "is3DEnabled:", is3DEnabled, "flyTo3D:", !!flyTo3D);
    
    if (is3DEnabled) {
      if (flyTo3D) {
        flyTo3D(location);
      } else {
        console.warn("App: flyTo3D is not ready yet!");
      }
    } else if (!is3DEnabled && mapInstance) {
      // Basic 2D implementation
      switch (location) {
        case 'HOME':
          // Center on Geodetic Points centroid
          mapInstance.flyTo({
            center: [3.3933, 6.4600],
            zoom: 13,
            speed: 0.8,
            curve: 1.2,
            essential: true
          });
          // Blink Geodetic points if visible
          if (layersVisibility.geodetic) {
             blinkLayer(LAYERS.geodetic.id, 'circle');
          }
          break;
        case 'ROADS':
          // Center of the Coastal Road
          mapInstance.flyTo({
            center: [3.4025, 6.448],
            zoom: 14,
            speed: 0.8,
            curve: 1.2,
            essential: true
          });
          // Blink Roads
          if (layersVisibility.roads) {
             blinkLayer(LAYERS.roads.id, 'line');
          }
          break;
        case 'BUILDINGS':
           // Center of Govt Office Complex
           mapInstance.flyTo({
            center: [3.395, 6.4525], 
            zoom: 16,
            speed: 0.8,
            curve: 1.2,
            essential: true
          });
          // Blink Buildings
          if (layersVisibility.buildings) {
             blinkLayer(LAYERS.buildings.id, 'fill-extrusion');
          }
          break;
      }
    }
  };

  const handleToggleLayer = (layer: 'roads' | 'buildings' | 'geodetic') => {
    setLayersVisibility((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  const handleToggle3D = () => {
    if (!is3DEnabled && mapInstance) {
        // Switching to 3D: Capture current 2D map center and zoom
        const center = mapInstance.getCenter();
        const zoom = mapInstance.getZoom();
        
        // Use functional state update to ensure state is set before toggle
        setInitialCameraView({
            lng: center.lng,
            lat: center.lat,
            zoom: zoom
        });
    }
    setIs3DEnabled((prev) => !prev);
  };

  const handleToggleTerrain = () => {
    setIsTerrainEnabled((prev) => !prev);
  };

  const handleFeatureClick = (properties: Record<string, unknown>) => {
    setSelectedFeature(properties);
  };

  const handleBasemapChange = (basemap: 'DARK' | 'LIGHT' | 'SATELLITE') => {
    setActiveBasemap(basemap);
  };

  return (
    <div
      className={`relative w-full h-screen overflow-hidden ${
        activeBasemap === 'LIGHT' ? 'theme-light-ui' : 'theme-dark-ui'
      }`}
    >
      {!is3DEnabled && (
        <MapContainer
          onMapLoad={setMapInstance}
          layersVisibility={layersVisibility}
          onFeatureClick={handleFeatureClick}
          is3DEnabled={false}
          isTerrainEnabled={isTerrainEnabled}
          activeBasemap={activeBasemap}
        />
      )}

      {is3DEnabled && mapInstance === null && (
        <CesiumGlobe
          activeBasemap={activeBasemap}
          is3DEnabled={is3DEnabled}
          initialCameraView={initialCameraView}
          onRegisterFlyTo={setFlyTo3D}
        />
      )}
      
      {/* Header / Title Overlay - Adjusted position to make room for search */}
      <div className="absolute top-4 left-4 z-50 pointer-events-none">
      </div>
      
      <SearchBar map={is3DEnabled ? null : mapInstance} activeBasemap={activeBasemap} />

      <div className="absolute top-4 left-4 z-50 flex flex-col gap-2 pointer-events-none max-h-[calc(100vh-2rem)]">
        <div className="pointer-events-auto">
          <LayerSidebar
            visibility={layersVisibility}
            onToggleLayer={handleToggleLayer}
            is3DEnabled={is3DEnabled}
            onToggle3D={handleToggle3D}
            isTerrainEnabled={isTerrainEnabled}
            onToggleTerrain={handleToggleTerrain}
            activeBasemap={activeBasemap}
            onBasemapChange={handleBasemapChange}
          />
        </div>
        
        {/* Quick Locations Panel - Always visible */}
        <div className="pointer-events-auto w-64">
           <QuickLocationsPanel
             activeBasemap={activeBasemap}
             onFlyToLocation={handleFlyToLocation}
           />
        </div>
      </div>

      <MeasurementTool map={is3DEnabled ? null : mapInstance} activeBasemap={activeBasemap} />

      <PropertyPanel
        properties={selectedFeature}
        onClose={() => setSelectedFeature(null)}
      />

      <KMLExport map={is3DEnabled ? null : mapInstance} />
      
      {/* Branding Overlay */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-[#2d2d2d] bg-opacity-90 px-4 py-1 rounded-full shadow-lg border border-[#404040] pointer-events-none z-50">
        <h1 className="text-sm font-bold text-white tracking-wide">
          West African <span className="text-[#0066cc]">OneMap</span>
        </h1>
      </div>
    </div>
  );
}

export default App;
