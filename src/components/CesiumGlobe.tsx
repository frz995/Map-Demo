import React, { useEffect, useRef, useState } from 'react';
import { Viewer } from '@cesium/widgets';
import { 
  Cartesian3, 
  UrlTemplateImageryProvider, 
  ArcGisMapServerImageryProvider,
  GeoJsonDataSource,
  BoundingSphere,
  Color,
  createWorldTerrainAsync,
  ArcGISTiledElevationTerrainProvider,
  EasingFunction,
  HeadingPitchRange,
  ColorMaterialProperty,
  ConstantProperty,
  PointGraphics
} from '@cesium/engine';
import { Globe, Map as MapIcon } from 'lucide-react';
import '@cesium/widgets/Source/widgets.css';
import { WEST_AFRICA_CENTER, DUMMY_ROADS_GEOJSON, DUMMY_BUILDINGS_GEOJSON, DUMMY_GEODETIC_GEOJSON } from '../utils/mapConfig';
import '../css/cesium.css';
import CesiumScaleBar from './CesiumScaleBar';

type BasemapId = 'DARK' | 'LIGHT' | 'SATELLITE';

interface CesiumGlobeProps {
  activeBasemap: BasemapId;
  is3DEnabled: boolean;
  initialCameraView: { lng: number, lat: number, zoom: number } | null;
  onRegisterFlyTo?: React.Dispatch<React.SetStateAction<((location: 'HOME' | 'ROADS' | 'BUILDINGS') => void) | null>>;
}

const CesiumGlobe: React.FC<CesiumGlobeProps> = ({ activeBasemap, is3DEnabled, initialCameraView, onRegisterFlyTo }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isCesiumReady, setIsCesiumReady] = useState(false);
  const [cesiumViewer, setCesiumViewer] = useState<Viewer | null>(null);
  const [isGlobeView, setIsGlobeView] = useState(false);
  const [reinitToken, setReinitToken] = useState(0);
  const lastViewRef = useRef<{destination: Cartesian3, orientation: {heading: number, pitch: number, roll: number}} | null>(null);
  const contextLostHandlerRef = useRef<((e: Event) => void) | null>(null);

  const activeBasemapRef = useRef(activeBasemap);
  const initialCameraViewRef = useRef(initialCameraView);
  
  // Refs for data sources to allow "Zoom To" functionality
  const roadsDataSourceRef = useRef<GeoJsonDataSource | null>(null);
  const buildingsDataSourceRef = useRef<GeoJsonDataSource | null>(null);
  const geodeticDataSourceRef = useRef<GeoJsonDataSource | null>(null);

  // Stable ref for flyTo handler to avoid stale closures
  const handleFlyToRef = useRef<((location: 'HOME' | 'ROADS' | 'BUILDINGS') => void) | null>(null);

  useEffect(() => {
    activeBasemapRef.current = activeBasemap;
  }, [activeBasemap]);

  useEffect(() => {
    initialCameraViewRef.current = initialCameraView;
  }, [initialCameraView]);

  const blinkDataSource = (dataSource: GeoJsonDataSource | null) => {
    if (!dataSource) return;
    
    let count = 0;
    const maxBlinks = 6;
    const entities = dataSource.entities.values;
    
    const interval = setInterval(() => {
        count++;
        const isVisible = count % 2 === 0;
        
        for (let i = 0; i < entities.length; i++) {
            entities[i].show = isVisible;
        }

        if (viewerRef.current && !viewerRef.current.isDestroyed()) {
            viewerRef.current.scene.requestRender();
        }
        
        if (count >= maxBlinks) {
            clearInterval(interval);
            // Ensure visible
            for (let i = 0; i < entities.length; i++) {
                entities[i].show = true;
            }
        }
    }, 300);
  };

  const handleFlyToLocation = (location: 'HOME' | 'ROADS' | 'BUILDINGS') => {
    console.log("CesiumGlobe: Executing flyToLocation:", location);
    if (!viewerRef.current) {
        console.warn("CesiumGlobe: Viewer ref is null, cannot fly to location");
        return;
    }
    
    // If in globe view, reset state but don't force immediate restore, just fly to new target
    if (isGlobeView) {
        console.log("CesiumGlobe: Exiting Globe View for flyTo");
        setIsGlobeView(false);
        lastViewRef.current = null; 
    }

    try {
        let destination;
        let orientation;
        let dataSourceToBlink;

        switch (location) {
            case 'HOME':
                destination = Cartesian3.fromDegrees(3.3933, 6.4600, 15000);
                orientation = { heading: 0, pitch: -Math.PI / 2, roll: 0 };
                dataSourceToBlink = geodeticDataSourceRef.current;
                break;
            case 'ROADS':
                destination = Cartesian3.fromDegrees(3.4025, 6.448, 6000);
                orientation = { heading: 0, pitch: -Math.PI / 4, roll: 0 };
                dataSourceToBlink = roadsDataSourceRef.current;
                break;
            case 'BUILDINGS':
                destination = Cartesian3.fromDegrees(3.395, 6.4525, 1500);
                orientation = { heading: 0, pitch: -Math.PI / 4, roll: 0 };
                dataSourceToBlink = buildingsDataSourceRef.current;
                break;
        }

        if (destination && orientation) {
            console.log("CesiumGlobe: Flying to", location);
            viewerRef.current.resolutionScale = 0.7;
            viewerRef.current.camera.flyTo({
                destination,
                orientation,
                duration: 3,
                easingFunction: EasingFunction.CUBIC_IN_OUT,
                complete: () => {
                    if (!viewerRef.current?.isDestroyed()) {
                        viewerRef.current!.resolutionScale = window.devicePixelRatio > 1 ? 0.9 : 1.0;
                        viewerRef.current!.scene.requestRender();
                    }
                },
                cancel: () => {
                    if (!viewerRef.current?.isDestroyed()) {
                        viewerRef.current!.resolutionScale = window.devicePixelRatio > 1 ? 0.9 : 1.0;
                        viewerRef.current!.scene.requestRender();
                    }
                }
            });
            viewerRef.current.scene.requestRender();
            if (dataSourceToBlink) {
                blinkDataSource(dataSourceToBlink);
            }
        }
    } catch (e) {
        console.error("CesiumGlobe: Error flying to location:", e);
    }
  };

  // Update ref on every render with latest closure
  handleFlyToRef.current = handleFlyToLocation;

  useEffect(() => {
    if (onRegisterFlyTo) {
      // Register a stable proxy function that calls the current ref
      onRegisterFlyTo(() => (location) => {
        if (handleFlyToRef.current) {
          handleFlyToRef.current(location);
        }
      });
    }
  }, [onRegisterFlyTo]);

  useEffect(() => {
    // Only initialize if enabled
    if (!is3DEnabled) {
      setIsCesiumReady(false);
      setIsGlobeView(false);
      lastViewRef.current = null;
      return;
    }
    
    // Safety check for container
    if (!containerRef.current) {
      console.error("Cesium container ref is null");
      return;
    }
    
    // Prevent double init
    if (viewerRef.current) return;

    const initCesium = async () => {
      try {
        console.log("Initializing Cesium Viewer...");
        setError(null);
        setIsMounted(true);

        // Initial provider: use a safe synchronous default (OSM or Dark)
        let imageryProvider;
        if (activeBasemapRef.current === 'DARK') {
          imageryProvider = new UrlTemplateImageryProvider({
            url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            subdomains: ['a', 'b', 'c', 'd'],
            maximumLevel: 20,
            credit: 'Map tiles by CartoDB, under CC BY 3.0. Data by OpenStreetMap, under ODbL.'
          });
        } else {
          imageryProvider = new UrlTemplateImageryProvider({
            url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
          });
        }

        if (!containerRef.current) return;

        const viewer = new Viewer(containerRef.current, {
          animation: false,
          timeline: false,
          geocoder: false,
          baseLayerPicker: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          infoBox: false,
          fullscreenButton: false,
          // Performance optimizations
          requestRenderMode: false,
          contextOptions: {
            webgl: {
              powerPreference: "high-performance",
              alpha: false,
              antialias: false,
              depth: true,
              stencil: false,
              preserveDrawingBuffer: false,
              premultipliedAlpha: false
            }
          }
        });

        // Optimize resolution scale for high-DPI screens but keep it performant
        viewer.resolutionScale = window.devicePixelRatio > 1 ? 0.9 : 1.0;
        
        // Disable some expensive default post-processing if not needed
        viewer.scene.globe.enableLighting = false; // Only enable if we want sun lighting
        viewer.scene.globe.show = true;
        viewer.scene.globe.baseColor = Color.fromCssColorString('#1b1b1b');
        viewer.scene.globe.maximumScreenSpaceError = 4.0;
        viewer.scene.fog.enabled = true;
        viewer.scene.fog.density = 0.0001;
        viewer.scene.fog.screenSpaceErrorFactor = 2.0;

        viewer.scene.imageryLayers.removeAll();
        viewer.scene.imageryLayers.addImageryProvider(imageryProvider);

        // Enable Terrain (Try ArcGISTiledElevationTerrainProvider for reliable no-token access)
        try {
            const terrainProvider = await ArcGISTiledElevationTerrainProvider.fromUrl(
              "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
            );
            viewer.terrainProvider = terrainProvider;
        } catch (e) {
            console.warn("Failed to load ArcGIS terrain, trying Cesium World Terrain...", e);
            try {
                viewer.terrainProvider = await createWorldTerrainAsync();
            } catch (e2) {
                console.warn("Failed to load Cesium World Terrain:", e2);
            }
        }

        // Load GeoJSON Layers (Roads & Buildings)
        const loadLayers = async () => {
            // Roads (Proposed Coastal Road) - Cased Look (Background + Foreground)
            try {
                // Background (Orange Casing)
                const roadsBgSource = await GeoJsonDataSource.load(DUMMY_ROADS_GEOJSON, {
                    stroke: Color.fromCssColorString('#E67E22'),
                    strokeWidth: 8, // Wider for casing
                    clampToGround: true
                });
                viewer.dataSources.add(roadsBgSource);

                // Foreground (Yellow Fill)
                const roadsFgSource = await GeoJsonDataSource.load(DUMMY_ROADS_GEOJSON, {
                    stroke: Color.fromCssColorString('#F9E79F'),
                    strokeWidth: 4,
                    clampToGround: true
                });
                viewer.dataSources.add(roadsFgSource);
                roadsDataSourceRef.current = roadsFgSource; // Use foreground for zoom reference
            } catch (e) {
                console.warn("Failed to load roads:", e);
            }

            // Buildings (Government Office Complex)
            try {
                const buildingsSource = await GeoJsonDataSource.load(DUMMY_BUILDINGS_GEOJSON);
                const entities = buildingsSource.entities.values;
                
                for (let i = 0; i < entities.length; i++) {
                    const entity = entities[i];
                    if (entity.polygon) {
                        entity.polygon.material = new ColorMaterialProperty(Color.WHITE); // Clean White
                        entity.polygon.outline = new ConstantProperty(true);
                        entity.polygon.outlineColor = new ConstantProperty(Color.fromCssColorString('#BDC3C7')); // Subtle Grey Stroke
                        
                        // Extrude based on height property if available
                        if (entity.properties && entity.properties.height) {
                            entity.polygon.extrudedHeight = entity.properties.height;
                        }
                    }
                }
                viewer.dataSources.add(buildingsSource);
                buildingsDataSourceRef.current = buildingsSource;
            } catch (e) {
                console.warn("Failed to load buildings:", e);
            }

            // Geodetic Points (Lagos Home markers)
            try {
                const geodeticSource = await GeoJsonDataSource.load(DUMMY_GEODETIC_GEOJSON);
                const entities = geodeticSource.entities.values;
                
                for (let i = 0; i < entities.length; i++) {
                    const entity = entities[i];
                    if (entity.billboard) {
                        entity.billboard.color = new ConstantProperty(Color.fromCssColorString('#ff9900'));
                        entity.billboard.scale = new ConstantProperty(0.8);
                    } else {
                        const point = new PointGraphics();
                        point.pixelSize = new ConstantProperty(10);
                        point.color = new ConstantProperty(Color.fromCssColorString('#ff9900'));
                        point.outlineColor = new ConstantProperty(Color.WHITE);
                        point.outlineWidth = new ConstantProperty(2);
                        entity.point = point;
                    }
                }
                viewer.dataSources.add(geodeticSource);
                geodeticDataSourceRef.current = geodeticSource;
            } catch (e) {
                console.warn("Failed to load geodetic:", e);
            }
        };
        await loadLayers();

        // Set initial view based on 2D map state if available, otherwise default
        let startHeight = 1500000;
        let startLng = WEST_AFRICA_CENTER.lng;
        let startLat = WEST_AFRICA_CENTER.lat;

        const initCameraView = initialCameraViewRef.current;
        if (initCameraView) {
            startLng = initCameraView.lng;
            startLat = initCameraView.lat;
            // Convert MapLibre zoom to Cesium height (approximate)
            startHeight = 10000000 / Math.pow(2, initCameraView.zoom - 3); 
            if (startHeight < 100) startHeight = 100; // Cap min height
        }

        viewer.camera.setView({
          destination: Cartesian3.fromDegrees(
            startLng,
            startLat,
            startHeight
          ),
          orientation: {
              heading: 0,
              pitch: -Math.PI / 2.2,
              roll: 0
          }
        });

        // Cinematic Fly-To Effect if transitioning from 2D
        if (initCameraView) {
            // Use a slightly longer timeout to ensure the viewer is fully ready
            setTimeout(() => {
                if (!viewer.isDestroyed()) {
                  viewer.camera.flyTo({
                      destination: Cartesian3.fromDegrees(
                          startLng,
                          startLat,
                          startHeight * 0.6 // Zoom in slightly for dramatic effect
                      ),
                      orientation: {
                          heading: 0,
                          pitch: -Math.PI / 4, // 45 degrees
                          roll: 0
                      },
                      duration: 3, // 3 seconds
                      easingFunction: EasingFunction.QUINTIC_IN_OUT
                  });
                }
            }, 800); 
        }

        const handleResize = () => {
          try {
            viewer.resize();
          } catch (e) {
            console.warn("Cesium resize error:", e);
          }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        viewerRef.current = viewer;
        setCesiumViewer(viewer);
        setIsCesiumReady(true);
        console.log("Cesium Viewer initialized successfully");

        const canvas = viewer.scene.canvas;
        const handleContextLost = (e: Event) => {
          try {
            (e as WebGLContextEvent).preventDefault?.();
          } catch (err) {
            console.warn("Failed to prevent WebGL context default:", err);
          }

          setError("WebGL context was lost. Reinitializing 3D view...");
          setIsCesiumReady(false);
          setCesiumViewer(null);
          setIsGlobeView(false);
          lastViewRef.current = null;

          try {
            viewerRef.current?.destroy();
          } catch (err) {
            console.warn("Failed to destroy viewer after context loss:", err);
          }
          viewerRef.current = null;
          setReinitToken((t) => t + 1);
        };
        contextLostHandlerRef.current = handleContextLost;
        canvas.addEventListener('webglcontextlost', handleContextLost, false);

      } catch (err: unknown) {
        console.error("Failed to initialize Cesium:", err);
        setError(err instanceof Error ? err.message : "Unknown error initializing Cesium");
      }
    };

    initCesium();

    return () => {
      // Cleanup function
      console.log("Destroying Cesium Viewer...");
      window.removeEventListener('resize', () => {}); // Can't remove anonymous, but effect closure handles it
      
      if (viewerRef.current) {
        try {
          if (contextLostHandlerRef.current) {
            viewerRef.current.scene.canvas.removeEventListener('webglcontextlost', contextLostHandlerRef.current, false);
          }
          viewerRef.current.destroy();
        } catch (e) {
          console.warn("Error destroying viewer:", e);
        }
        viewerRef.current = null;
        setCesiumViewer(null);
        setIsCesiumReady(false);
      }
    };
  }, [is3DEnabled, reinitToken]); // Re-run when toggled

  // Basemap switching effect
  useEffect(() => {
    if (!isCesiumReady || !viewerRef.current) return;
    
    const viewer = viewerRef.current;
    const imageryLayers = viewer.imageryLayers;

    const updateBasemap = async () => {
      try {
        imageryLayers.removeAll();

        let provider;
        let labelsProvider;

        switch (activeBasemap) {
          case 'DARK':
            provider = new UrlTemplateImageryProvider({
              url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              subdomains: ['a', 'b', 'c', 'd'],
              maximumLevel: 20,
              credit: 'Map tiles by CartoDB, under CC BY 3.0. Data by OpenStreetMap, under ODbL.'
            });
            break;
          case 'SATELLITE':
            try {
              provider = await ArcGisMapServerImageryProvider.fromUrl(
                'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
              );
              labelsProvider = await ArcGisMapServerImageryProvider.fromUrl(
                'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer'
              );
            } catch (err) {
              console.error("Failed to load satellite imagery:", err);
            }
            break;
          case 'LIGHT':
          default:
            try {
              provider = await ArcGisMapServerImageryProvider.fromUrl(
                'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
              );
            } catch (err) {
              console.error("Failed to load Esri Light imagery:", err);
              // Fallback to OSM if Esri fails
              provider = new UrlTemplateImageryProvider({
                url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
              });
            }
            break;
        }

        if (provider) {
          imageryLayers.addImageryProvider(provider);
        }
        
        if (labelsProvider) {
          imageryLayers.addImageryProvider(labelsProvider);
        }
        
        // Force render
        viewer.scene.requestRender();

      } catch (e) {
         console.warn("Error updating basemap:", e);
      }
    };

    updateBasemap();
  }, [activeBasemap, isCesiumReady]);

  useEffect(() => {
    // Monitor camera height to update state if user manually zooms in
    if (!viewerRef.current) return;
    
    const viewer = viewerRef.current;
    
    const checkHeight = () => {
        try {
            const height = viewer.camera.positionCartographic.height;
            // If we are below 3000km, we are definitely not in "Globe View" anymore
            if (height < 3000000 && isGlobeView) {
                console.log("Camera moved close to ground, resetting Globe View state");
                setIsGlobeView(false);
            } else if (height > 5000000 && !isGlobeView) {
                 // If we are above 5000km, we are in "Globe View"
                 console.log("Camera moved to space, setting Globe View state");
                 setIsGlobeView(true);
            }
        } catch (e) {
            console.warn("Error checking camera height:", e);
        }
    };

    // Check immediately on mount/update to fix any stale state
    checkHeight();

    viewer.camera.moveEnd.addEventListener(checkHeight);
    
    return () => {
        if (!viewer.isDestroyed()) {
            viewer.camera.moveEnd.removeEventListener(checkHeight);
        }
    };
  }, [isGlobeView]);

  const handleToggleGlobeView = () => {
    console.log("Globe button clicked. Current state:", isGlobeView);
    
    if (!viewerRef.current || viewerRef.current.isDestroyed()) {
        console.error("Viewer ref is null or destroyed, cannot toggle view");
        return;
    }

    try {
        const camera = viewerRef.current.camera;
        const height = camera.positionCartographic.height;
        // Robust check: If we are high up (> 3000km), treat as Globe View. Otherwise, Map View.
        const isCurrentlyHigh = height > 3000000;

        // Cancel any existing camera flights to prevent conflicts
        camera.cancelFlight();

        if (isCurrentlyHigh) {
            // We are in Space -> Go to Map
            console.log("High altitude detected. Returning to Map.");
            
            // Lower resolution scale for smoother flight
            viewerRef.current.resolutionScale = 0.7;

            if (lastViewRef.current) {
                 console.log("Restoring view:", lastViewRef.current);
                 camera.flyTo({
                    destination: lastViewRef.current.destination,
                    orientation: lastViewRef.current.orientation,
                    duration: 2.0,
                    easingFunction: EasingFunction.CUBIC_IN_OUT,
                    complete: () => {
                        if (!viewerRef.current?.isDestroyed()) {
                            viewerRef.current!.resolutionScale = window.devicePixelRatio > 1 ? 0.9 : 1.0;
                            viewerRef.current!.scene.requestRender();
                        }
                        setIsGlobeView(false);
                    },
                    cancel: () => {
                        if (!viewerRef.current?.isDestroyed()) {
                            viewerRef.current!.resolutionScale = window.devicePixelRatio > 1 ? 0.9 : 1.0;
                            viewerRef.current!.scene.requestRender();
                        }
                    }
                });
                viewerRef.current.scene.requestRender();
            } else {
                // Fallback to Home view if no last view
                console.warn("No last view to restore, flying to Home");
                viewerRef.current.resolutionScale = window.devicePixelRatio > 1 ? 0.9 : 1.0; // Restore immediately if using fallback
                handleFlyToLocation('HOME');
                setIsGlobeView(false);
            }
        } else {
            // We are near Ground -> Go to Space
            console.log("Low altitude detected. Zooming to Globe.");
            
            // Save current view before flying out
            const currentView = {
                destination: camera.position.clone(),
                orientation: {
                    heading: camera.heading,
                    pitch: camera.pitch,
                    roll: camera.roll
                }
            };
            lastViewRef.current = currentView;
            console.log("Saving view and flying to globe:", currentView);
            
            // Lower resolution scale for smoother flight
            viewerRef.current.resolutionScale = 0.7;

            const viewer = viewerRef.current;
            const center = Cartesian3.fromDegrees(3.3933, 6.4600, 0.0);
            const radius = viewer.scene.globe.ellipsoid.maximumRadius * 1.05;
            const globeSphere = new BoundingSphere(center, radius);

            camera.flyToBoundingSphere(globeSphere, {
                offset: new HeadingPitchRange(0.0, -Math.PI / 3, radius * 3.0),
                duration: 2.0,
                easingFunction: EasingFunction.CUBIC_IN_OUT,
                complete: () => {
                    console.log("Globe view flight complete");
                    if (!viewerRef.current?.isDestroyed()) {
                        viewerRef.current!.resolutionScale = window.devicePixelRatio > 1 ? 0.9 : 1.0;
                        viewerRef.current!.scene.requestRender();
                    }
                    setIsGlobeView(true);
                },
                cancel: () => {
                    console.warn("Globe view flight cancelled");
                    if (!viewerRef.current?.isDestroyed()) {
                        viewerRef.current!.resolutionScale = window.devicePixelRatio > 1 ? 0.9 : 1.0;
                        viewerRef.current!.scene.requestRender();
                    }
                }
            });
            viewerRef.current.scene.requestRender();
        }
    } catch (e) {
        console.error("Error in toggle globe view:", e);
    }
  };

  if (!is3DEnabled) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-40"
      style={{ width: '100vw', height: '100vh', background: '#000' }}
    >
      {error && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white p-4 rounded z-50">
          <h3 className="font-bold">Cesium Error:</h3>
          <p>{error}</p>
        </div>
      )}
      {!isMounted && !error && (
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white z-50">
            Loading 3D Globe...
         </div>
      )}
      <div
        ref={containerRef}
        className="cesium-viewer"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Scale Bar */}
      {isCesiumReady && cesiumViewer && (
        <CesiumScaleBar viewer={cesiumViewer} />
      )}
      
      {/* Locations Panel Removed (Moved to App.tsx) */}

      {/* Globe View Button */}
      {isCesiumReady && (
        <button
          onClick={handleToggleGlobeView}
          className={`absolute bottom-40 right-4 p-3 rounded-full shadow-lg transition-colors flex items-center justify-center group z-[60] pointer-events-auto ${
            isGlobeView 
              ? 'bg-white text-black hover:bg-gray-100'
              : 'bg-[#0066cc] hover:bg-[#0052a3] text-white'
          }`}
          title={isGlobeView ? "Return to Previous View" : "Zoom to Globe View"}
        >
          {isGlobeView ? <MapIcon size={24} /> : <Globe size={24} />}
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap group-hover:ml-2">
            {isGlobeView ? "Return to Map" : "Globe View"}
          </span>
        </button>
      )}
    </div>
  );
};

export default CesiumGlobe;
