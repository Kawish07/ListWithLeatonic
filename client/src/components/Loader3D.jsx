import React from 'react';

const Loader3D = ({ size = 220, text = 'Loading...' }) => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="loader-wrap" style={{ width: '100%', textAlign: 'center' }}>
        <div className="scene" style={{ width: size, height: size }}>
          <div className="pyramid">
            <div className="face f1" />
            <div className="face f2" />
            <div className="face f3" />
            <div className="face f4" />
          </div>
          <div className="shadow" />
        </div>
        <div className="mt-6 text-gray-300">{text}</div>
      </div>

      <style>{`
        .loader-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; }
        .scene { position:relative; perspective:1200px; display:inline-block; }
        .pyramid { position:relative; width:120px; height:120px; transform-style:preserve-3d; transform: translateY(-10px) rotateX(20deg); animation: spin 6s linear infinite; margin:0 auto; }
        .face { position:absolute; left:0; top:0; width:120px; height:120px; transform-origin:50% 100%; clip-path: polygon(50% 0, 0% 100%, 100% 100%); box-shadow: 0 8px 30px rgba(2,6,23,0.6); }
        .face.f1 { background: linear-gradient(135deg, #ff6ac1, #b37cff); transform: rotateY(0deg) translateZ(60px) rotateX(14deg); }
        .face.f2 { background: linear-gradient(135deg, #7ef0d3, #4fb3ff); transform: rotateY(90deg) translateZ(60px) rotateX(14deg); }
        .face.f3 { background: linear-gradient(135deg, #ffd36a, #ff8a6a); transform: rotateY(180deg) translateZ(60px) rotateX(14deg); }
        .face.f4 { background: linear-gradient(135deg, #8b7bff, #4fe0ff); transform: rotateY(270deg) translateZ(60px) rotateX(14deg); }
        .shadow { position:absolute; left:50%; transform:translateX(-50%) translateY(62px); width:140px; height:30px; border-radius:50%; background: radial-gradient(circle at 50% 40%, rgba(143,73,255,0.45), rgba(0,0,0,0.05) 55%); filter: blur(8px); opacity:0.9; animation: pulse 2.6s ease-in-out infinite; }

        @keyframes spin { from { transform: translateY(-10px) rotateX(20deg) rotateY(0deg); } to { transform: translateY(-10px) rotateX(20deg) rotateY(360deg); } }
        @keyframes pulse { 0% { transform:translateX(-50%) translateY(64px) scaleX(1); opacity:0.85 } 50% { transform:translateX(-50%) translateY(66px) scaleX(1.1); opacity:0.6 } 100% { transform:translateX(-50%) translateY(64px) scaleX(1); opacity:0.85 } }
      `}</style>
    </div>
  );
};

export default Loader3D;
