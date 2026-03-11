import React, { useEffect, useRef, useState } from 'react';
import maplibregl, { type AddLayerObject, type MapLayerMouseEvent, Map, NavigationControl, ScaleControl, GeolocateControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../css/map.css';
import { 
  WEST_AFRICA_CENTER, 
  BASEMAP_STYLES, 
  TERRAIN_SOURCE, 
  LAYERS, 
  THEME_COLORS,
  DUMMY_ROADS_GEOJSON, 
  DUMMY_BUILDINGS_GEOJSON, 
  DUMMY_GEODETIC_GEOJSON
} from '../utils/mapConfig';

type FeatureProperties = Record<string, unknown>;

interface MapContainerProps {
  onMapLoad?: (map: Map | null) => void;
  layersVisibility: {
    roads: boolean;
    buildings: boolean;
    geodetic: boolean;
  };
  onFeatureClick: (properties: FeatureProperties) => void;
  is3DEnabled: boolean;
  isTerrainEnabled: boolean;
  activeBasemap: 'DARK' | 'LIGHT' | 'SATELLITE';
}

const MapContainer: React.FC<MapContainerProps> = ({ 
  onMapLoad, 
  layersVisibility, 
  onFeatureClick,
  is3DEnabled,
  isTerrainEnabled,
  activeBasemap
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mouseCoords, setMouseCoords] = useState<{lng: number, lat: number} | null>(null);
  const isLightTheme = activeBasemap === 'LIGHT';

  // Initialize Map
  useEffect(() => {
    if (map.current) return;

    if (mapContainer.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: BASEMAP_STYLES[activeBasemap],
        center: [WEST_AFRICA_CENTER.lng, WEST_AFRICA_CENTER.lat],
        zoom: WEST_AFRICA_CENTER.zoom,
        pitch: 0,
        bearing: 0,
        antialias: false
      });

      // Add Controls
      map.current.addControl(new NavigationControl(), 'top-right');
      map.current.addControl(new ScaleControl({ maxWidth: 200, unit: 'metric' }), 'bottom-left');
      map.current.addControl(new GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true
      }), 'top-right');

      map.current.on('load', () => {
        setIsLoaded(true);
        if (onMapLoad && map.current) {
          onMapLoad(map.current);
        }
        
        // Initial data loading with initial theme (activeBasemap)
        loadDataSources(map.current, activeBasemap);
      });

      // Mouse coordinates
      map.current.on('mousemove', (e) => {
        setMouseCoords({
          lng: parseFloat(e.lngLat.lng.toFixed(4)),
          lat: parseFloat(e.lngLat.lat.toFixed(4))
        });
      });
    }

    return () => {
      map.current?.remove();
      map.current = null;
      onMapLoad?.(null);
    };
  }, []);

  // Helper to load sources and layers (needed for init and style changes)
  const loadDataSources = (mapInstance: Map | null, currentBasemap: 'DARK' | 'LIGHT' | 'SATELLITE') => {
    if (!mapInstance) return;

    // 1. Add Sources
    if (!mapInstance.getSource('terrain-source')) {
        mapInstance.addSource('terrain-source', TERRAIN_SOURCE);
    }
    if (!mapInstance.getSource('roads-source')) {
      mapInstance.addSource('roads-source', { type: 'geojson', data: DUMMY_ROADS_GEOJSON });
    }
    if (!mapInstance.getSource('buildings-source')) {
      mapInstance.addSource('buildings-source', { type: 'geojson', data: DUMMY_BUILDINGS_GEOJSON });
    }
    if (!mapInstance.getSource('geodetic-source')) {
      mapInstance.addSource('geodetic-source', { type: 'geojson', data: DUMMY_GEODETIC_GEOJSON });
    }

    const themeColors = THEME_COLORS[currentBasemap];

    // 2. Add Layers (Order matters: Bottom -> Top)

    // Roads Casing (Background)
    if (!mapInstance.getLayer(LAYERS.roadsCasing.id) && currentBasemap === 'LIGHT') {
       mapInstance.addLayer({
         ...LAYERS.roadsCasing,
         paint: {
           ...LAYERS.roadsCasing.paint,
           'line-color': themeColors.roadsCasing || '#e67e22'
         }
       } as unknown as AddLayerObject);
    }

    // Roads Fill (Foreground)
    if (!mapInstance.getLayer(LAYERS.roads.id)) {
        mapInstance.addLayer({
            ...LAYERS.roads,
            paint: {
                ...LAYERS.roads.paint,
                'line-color': currentBasemap === 'LIGHT' ? (themeColors.roadsFill || '#f9e79f') : themeColors.roads,
                'line-width': currentBasemap === 'LIGHT' ? 3 : 2
            }
        } as unknown as AddLayerObject);
    }

    // Buildings
    // For Light mode, we prefer the "clean white with stroke" look (2D style)
    // But we also support extrusion if needed.
    // Strategy: Add both, toggle visibility? Or just use one based on preference.
    // Given the prompt "Set default extrusion to 0 for 2D mode", we'll use the 2D layer for Light Mode default.
    
    if (!mapInstance.getLayer(LAYERS.buildings2D.id) && currentBasemap === 'LIGHT') {
       mapInstance.addLayer({
         ...LAYERS.buildings2D,
         paint: {
           ...LAYERS.buildings2D.paint,
           'fill-color': themeColors.buildings || '#ffffff',
           'fill-outline-color': themeColors.buildingsStroke || '#bdc3c7'
         }
       } as unknown as AddLayerObject);
    }

    // Also add the extruded layer for other modes or if we want to toggle
    if (!mapInstance.getLayer(LAYERS.buildings.id)) {
        mapInstance.addLayer({
            ...LAYERS.buildings,
            layout: {
              visibility: currentBasemap === 'LIGHT' ? 'none' : 'visible' // Hide extruded in Light mode by default
            },
            paint: {
                ...LAYERS.buildings.paint,
                'fill-extrusion-color': themeColors.buildings
            }
        } as unknown as AddLayerObject);
    }
    
    // Geodetic
    if (!mapInstance.getLayer(LAYERS.geodetic.id)) {
      mapInstance.addLayer({
        id: LAYERS.geodetic.id,
        type: 'circle',
        source: LAYERS.geodetic.source,
        paint: {
          'circle-radius': 6,
          'circle-color': themeColors.geodetic,
          'circle-stroke-width': 2,
          'circle-stroke-color': themeColors.geodeticStroke
        }
      });
    }

    // Re-attach click listeners
    const layers = [LAYERS.roads.id, LAYERS.buildings.id, LAYERS.geodetic.id]; 
    layers.forEach(layerId => {
      if (!mapInstance.getLayer(layerId)) return;
      
      mapInstance.off('click', layerId, handleClick);
      mapInstance.on('click', layerId, handleClick);
      
      mapInstance.off('mouseenter', layerId, handleMouseEnter);
      mapInstance.on('mouseenter', layerId, handleMouseEnter);
      
      mapInstance.off('mouseleave', layerId, handleMouseLeave);
      mapInstance.on('mouseleave', layerId, handleMouseLeave);
    });
  };

  // Event handlers defined outside to be referenceable for removal
  const handleClick = (e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      onFeatureClick((feature.properties ?? {}) as FeatureProperties);
      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`<h3>${feature.properties?.name || 'Feature'}</h3>`)
        .addTo(map.current!);
    }
  };
  const handleMouseEnter = () => { if (map.current) map.current.getCanvas().style.cursor = 'pointer'; };
  const handleMouseLeave = () => { if (map.current) map.current.getCanvas().style.cursor = ''; };


  // Effect for Basemap Change
  useEffect(() => {
    if (!map.current || !isLoaded) return;
    
    const style = BASEMAP_STYLES[activeBasemap];
    map.current.setStyle(style);

    map.current.once('styledata', () => {
      loadDataSources(map.current, activeBasemap);
      setVisibility(LAYERS.roads.id, layersVisibility.roads);
      setVisibility(LAYERS.buildings.id, layersVisibility.buildings);
      setVisibility(LAYERS.geodetic.id, layersVisibility.geodetic);
      
      if (is3DEnabled) {
         map.current?.setTerrain({ source: 'terrain-source', exaggeration: 1.5 });
      }
    });
  }, [activeBasemap]);


  // Helper for visibility
  const setVisibility = (layerId: string, isVisible: boolean) => {
      if (map.current?.getLayer(layerId)) {
        map.current.setLayoutProperty(
          layerId,
          'visibility',
          isVisible ? 'visible' : 'none'
        );
      }
  };

  // Effect for Layer Visibility
  useEffect(() => {
    if (!map.current || !isLoaded) return;
    setVisibility(LAYERS.roads.id, layersVisibility.roads);
    setVisibility(LAYERS.buildings.id, layersVisibility.buildings);
    setVisibility(LAYERS.geodetic.id, layersVisibility.geodetic);
  }, [layersVisibility, isLoaded, activeBasemap]); // Dependency on activeBasemap ensures re-run after style change

  // Effect for Terrain (Hillshade/DEM)
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    if (isTerrainEnabled) {
      // Add terrain source if not present
      if (!map.current.getSource('terrain-source')) {
          map.current.addSource('terrain-source', TERRAIN_SOURCE);
      }
      
      // Enable terrain (3D mesh effect on 2D map)
      map.current.setTerrain({ source: 'terrain-source', exaggeration: 1.5 });
      
      // Add hillshade layer for visual depth if not present
      if (!map.current.getLayer('hillshade')) {
        // Find a suitable layer to place hillshade before
        // Usually before roads, but after land/water/basemap
        // 'roads-layer' is a good candidate if it exists
        const beforeLayer = map.current.getLayer('roads-layer') ? 'roads-layer' : undefined;
        
        map.current.addLayer({
          id: 'hillshade',
          type: 'hillshade',
          source: 'terrain-source',
          paint: {
            'hillshade-shadow-color': '#000000',
            'hillshade-highlight-color': '#FFFFFF',
            'hillshade-accent-color': '#000000',
            'hillshade-exaggeration': 0.5 // Reduce exaggeration for subtler effect
          }
        } as unknown as AddLayerObject, beforeLayer); 
      }
    } else {
      // Disable terrain
      map.current.setTerrain(null);
      
      // Remove hillshade layer if present
      if (map.current.getLayer('hillshade')) {
        map.current.removeLayer('hillshade');
      }
    }
  }, [isTerrainEnabled, isLoaded, activeBasemap]);

  return (
    <div className="relative w-full h-full">
        <div 
          ref={mapContainer} 
          className={`map-container ${isLightTheme ? 'theme-light-ui' : 'theme-dark-ui'}`} 
        />
        
        {/* Coordinate Display */}
        <div
          className={`absolute bottom-1 right-12 z-10 text-xs px-2 py-1 rounded border font-mono pointer-events-none ${
            isLightTheme
              ? 'bg-white bg-opacity-90 text-black border-[#d4d4d4]'
              : 'bg-[#2d2d2d] bg-opacity-80 text-white border-[#404040]'
          }`}
        >
          {mouseCoords ? `Lon: ${mouseCoords.lng}, Lat: ${mouseCoords.lat}` : 'Ready'}
        </div>
    </div>
  );
};

export default MapContainer;
