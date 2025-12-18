import React from 'react';
import LoaderCube3D from './LoaderCube3D';

const RouteLoaderOverlay = ({ visible = false }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      <LoaderCube3D />
    </div>
  );
};

export default RouteLoaderOverlay;