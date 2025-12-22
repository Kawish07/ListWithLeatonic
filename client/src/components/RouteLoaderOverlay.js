import React from 'react';
import Loader3D from './Loader3D';

const RouteLoaderOverlay = ({ visible = false }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      <Loader3D text={visible === true ? 'Loading...' : 'Loading...'} />
    </div>
  );
};

export default RouteLoaderOverlay;