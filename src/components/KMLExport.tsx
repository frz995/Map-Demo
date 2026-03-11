import React from 'react';
import { Download } from 'lucide-react';
import { Map } from 'maplibre-gl';

interface KMLExportProps {
  map: Map | null;
}

const KMLExport: React.FC<KMLExportProps> = ({ map }) => {
  const handleExport = () => {
    if (!map) return;

    const bounds = map.getBounds();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>West African OneMap Export</name>
    <Placemark>
      <name>Current View</name>
      <description>Exported from West African OneMap</description>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              ${sw.lng},${sw.lat},0
              ${ne.lng},${sw.lat},0
              ${ne.lng},${ne.lat},0
              ${sw.lng},${ne.lat},0
              ${sw.lng},${sw.lat},0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;

    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onemap-export-${new Date().toISOString().slice(0, 10)}.kml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="absolute bottom-8 right-4 z-50 bg-[#0066cc] hover:bg-[#0052a3] text-white p-3 rounded-full shadow-lg transition-colors flex items-center justify-center group"
      title="Export View to KML"
    >
      <Download size={24} />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap group-hover:ml-2">
        Export KML
      </span>
    </button>
  );
};

export default KMLExport;
