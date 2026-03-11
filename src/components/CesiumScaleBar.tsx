import React, { useEffect, useState } from 'react';
import { Cartesian2, EllipsoidGeodesic } from '@cesium/engine';
import { Viewer } from '@cesium/widgets';

interface CesiumScaleBarProps {
  viewer: Viewer | null;
}

const CesiumScaleBar: React.FC<CesiumScaleBarProps> = ({ viewer }) => {
  const [distanceLabel, setDistanceLabel] = useState<string>('');
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const barWidth = 100; // Fixed width in pixels

  useEffect(() => {
    if (!viewer) return;

    const scene = viewer.scene;
    const canvas = scene.canvas;
    const globe = scene.globe;
    const ellipsoid = globe.ellipsoid;
    const geodesic = new EllipsoidGeodesic();

    const updateScale = () => {
      // Calculate scale at the bottom-center of the screen
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      
      const leftPixel = new Cartesian2((width / 2) - (barWidth / 2), height - 30);
      const rightPixel = new Cartesian2((width / 2) + (barWidth / 2), height - 30);

      const leftRay = scene.camera.getPickRay(leftPixel);
      const rightRay = scene.camera.getPickRay(rightPixel);

      if (!leftRay || !rightRay) return;

      const leftPosition = globe.pick(leftRay, scene);
      const rightPosition = globe.pick(rightRay, scene);

      if (!leftPosition || !rightPosition) {
        setIsVisible(false);
        return;
      }

      const leftCartographic = ellipsoid.cartesianToCartographic(leftPosition);
      const rightCartographic = ellipsoid.cartesianToCartographic(rightPosition);

      geodesic.setEndPoints(leftCartographic, rightCartographic);
      const distance = geodesic.surfaceDistance;

      if (distance > 0) {
        setIsVisible(true);
        let label = '';
        if (distance >= 1000) {
            label = `${(distance / 1000).toFixed(1)} km`;
        } else {
            label = `${Math.round(distance)} m`;
        }
        setDistanceLabel(label);
      } else {
        setIsVisible(false);
      }
    };

    const removeListener = scene.postRender.addEventListener(updateScale);
    
    // Initial update
    updateScale();

    return () => {
      removeListener();
    };
  }, [viewer]);

  if (!isVisible || !viewer) return null;

  return (
    <div className="absolute bottom-8 left-4 z-10 flex flex-col items-center pointer-events-none text-white drop-shadow-md select-none">
      <div className="text-xs font-semibold mb-0.5 text-shadow-sm">{distanceLabel}</div>
      <div 
        className="h-2 border-x border-b border-white/90 bg-black/30 backdrop-blur-[1px]" 
        style={{ width: `${barWidth}px` }} 
      />
    </div>
  );
};

export default CesiumScaleBar;
