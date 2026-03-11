import type { RasterDEMSourceSpecification, StyleSpecification } from 'maplibre-gl';
import type { FeatureCollection, LineString, Point, Polygon } from 'geojson';

export const WEST_AFRICA_CENTER = {
  lng: 3.3792,
  lat: 6.5244,
  zoom: 13
};

export const BASEMAP_STYLES = {
  LIGHT: {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: '&copy; Esri'
      }
    },
    layers: [
      {
        id: 'esri-light',
        type: 'raster',
        source: 'raster-tiles',
        minzoom: 0,
        maxzoom: 22
      }
    ]
  } as StyleSpecification,
  DARK: {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxzoom: 20
      }
    },
    layers: [
      {
        id: 'osm-dark',
        type: 'raster',
        source: 'raster-tiles',
        minzoom: 0,
        maxzoom: 20
      }
    ]
  } as StyleSpecification,
  SATELLITE: {
    version: 8,
    sources: {
      'satellite-tiles': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: '&copy; Esri'
      },
      'satellite-labels': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: '&copy; Esri'
      }
    },
    layers: [
      {
        id: 'simple-tiles',
        type: 'raster',
        source: 'satellite-tiles',
        minzoom: 0,
        maxzoom: 22
      },
      {
        id: 'satellite-labels-layer',
        type: 'raster',
        source: 'satellite-labels',
        minzoom: 0,
        maxzoom: 22
      }
    ]
  } as StyleSpecification
};

export const TERRAIN_SOURCE: RasterDEMSourceSpecification = {
  type: 'raster-dem',
  tiles: ['https://demotiles.maplibre.org/terrain-tiles/rgb/{z}/{x}/{y}.png'],
  tileSize: 256,
  encoding: 'mapbox',
  maxzoom: 14
};

export const THEME_COLORS = {
  LIGHT: {
    roads: '#d91c1c',
    roadsCasing: '#e67e22',
    roadsFill: '#f9e79f',
    buildings: '#ffffff',
    buildingsStroke: '#bdc3c7',
    water: '#d6eaf8',
    parks: '#d4efdf',
    geodetic: '#ff6d00',
    geodeticStroke: '#ffffff',
    poiCommercial: '#e91e63', // Pink
    poiTransit: '#2196f3'     // Blue
  },
  DARK: {
    roads: '#4d94ff',
    roadsCasing: '#4d94ff', // Fallback
    roadsFill: '#4d94ff', // Fallback
    buildings: '#e0e0e0',
    buildingsStroke: '#ffffff', // Fallback
    water: '#1a1a1a', // Fallback
    parks: '#2d2d2d', // Fallback
    geodetic: '#ff9900',
    geodeticStroke: '#ffffff',
    poiCommercial: '#e91e63',
    poiTransit: '#2196f3'
  },
  SATELLITE: {
    roads: '#ffeb3b',
    roadsCasing: '#ffeb3b',
    roadsFill: '#ffeb3b',
    buildings: '#ff5722',
    buildingsStroke: '#ffffff',
    water: '#0000ff',
    parks: '#00ff00',
    geodetic: '#00e676',
    geodeticStroke: '#000000',
    poiCommercial: '#e91e63',
    poiTransit: '#2196f3'
  }
};

export const LAYERS = {
  roads: {
    id: 'road-network',
    type: 'line',
    source: 'roads-source',
    paint: {
      'line-color': '#0066cc', // Default
      'line-width': 3,
      'line-opacity': 1
    }
  },
  roadsCasing: {
    id: 'road-network-casing',
    type: 'line',
    source: 'roads-source',
    paint: {
      'line-color': '#e67e22',
      'line-width': 5,
      'line-opacity': 1
    }
  },
  buildings: {
    id: 'planned-buildings',
    type: 'fill-extrusion',
    source: 'buildings-source',
    paint: {
      'fill-extrusion-color': '#2d2d2d',
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.9
    }
  },
  buildings2D: { // Non-extruded for 2D mode
    id: 'planned-buildings-2d',
    type: 'fill',
    source: 'buildings-source',
    paint: {
      'fill-color': '#ffffff',
      'fill-outline-color': '#bdc3c7',
      'fill-opacity': 0.9
    }
  },
  geodetic: {
    id: 'geodetic-points',
    type: 'symbol',
    source: 'geodetic-source',
    layout: {
      'icon-image': 'marker-15', 
      'icon-allow-overlap': true,
      'icon-size': 1.5
    },
    paint: {
      'text-color': '#ffffff'
    }
  }
} as const;

export const DUMMY_ROADS_GEOJSON: FeatureCollection<LineString, { name: string; type: string }> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Proposed Coastal Road', type: 'Primary' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [3.3850, 6.4450], // Apapa end
          [3.3900, 6.4480], // Marina approach
          [3.3950, 6.4500], // CMS/Marina
          [3.4020, 6.4510], // Onikan
          [3.4100, 6.4490], // Near Five Cowries Creek
          [3.4200, 6.4450]  // Victoria Island
        ]
      }
    }
  ]
};

export const DUMMY_BUILDINGS_GEOJSON: FeatureCollection<Polygon, { name: string; height: number; usage: string }> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Gov Office A - Secretariat', height: 60, usage: 'Government' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [3.3940, 6.4520], [3.3950, 6.4520], [3.3950, 6.4530], [3.3940, 6.4530], [3.3940, 6.4520]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Gov Office B - Ministry', height: 45, usage: 'Government' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [3.3955, 6.4525], [3.3965, 6.4525], [3.3965, 6.4535], [3.3955, 6.4535], [3.3955, 6.4525]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Gov Office C - Agency', height: 35, usage: 'Government' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [3.3945, 6.4510], [3.3955, 6.4510], [3.3955, 6.4518], [3.3945, 6.4518], [3.3945, 6.4510]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Gov Office D - Annex', height: 40, usage: 'Government' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [3.3960, 6.4515], [3.3970, 6.4515], [3.3970, 6.4522], [3.3960, 6.4522], [3.3960, 6.4515]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Gov Office E - HQ', height: 55, usage: 'Government' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [3.3930, 6.4525], [3.3938, 6.4525], [3.3938, 6.4535], [3.3930, 6.4535], [3.3930, 6.4525]
        ]]
      }
    }
  ]
};

export const DUMMY_GEODETIC_GEOJSON: FeatureCollection<Point, { id: string; elevation: number; status: string }> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { id: 'GP-LGS-01', elevation: 15, status: 'Active' },
      geometry: {
        type: 'Point',
        coordinates: [3.3900, 6.4500]
      }
    },
    {
      type: 'Feature',
      properties: { id: 'GP-LGS-02', elevation: 12, status: 'Active' },
      geometry: {
        type: 'Point',
        coordinates: [3.4100, 6.4600]
      }
    },
    {
      type: 'Feature',
      properties: { id: 'GP-LGS-03', elevation: 10, status: 'Maintenance' },
      geometry: {
        type: 'Point',
        coordinates: [3.3800, 6.4700]
      }
    }
  ]
};
