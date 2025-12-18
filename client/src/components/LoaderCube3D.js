import React from 'react';

const LoaderCube3D = () => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#141414' }}>
      {/* Animated background grid */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Floating orbs in background */}
      <div className="absolute top-20 left-20 w-64 h-64 rounded-full opacity-10 blur-3xl animate-float-1" style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }}></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full opacity-10 blur-3xl animate-float-2" style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }}></div>

      {/* Main loader container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* 3D Cube Scene with enhanced effects */}
        <div className="loader-scene mb-12">
          <div className="loader-cube-container">
            {/* Main rotating cube with neon edges */}
            <div className="loader-cube">
              <div className="cube-face cube-front">
                <div className="face-inner"></div>
              </div>
              <div className="cube-face cube-back">
                <div className="face-inner"></div>
              </div>
              <div className="cube-face cube-right">
                <div className="face-inner"></div>
              </div>
              <div className="cube-face cube-left">
                <div className="face-inner"></div>
              </div>
              <div className="cube-face cube-top">
                <div className="face-inner"></div>
              </div>
              <div className="cube-face cube-bottom">
                <div className="face-inner"></div>
              </div>
            </div>
            
            {/* Enhanced orbiting particles with trails */}
            <div className="particle-orbit">
              <div className="particle particle-1"></div>
            </div>
            <div className="particle-orbit">
              <div className="particle particle-2"></div>
            </div>
            <div className="particle-orbit">
              <div className="particle particle-3"></div>
            </div>
            
            {/* Rotating rings */}
            <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
          </div>
        </div>

        {/* Loading text with enhanced styling */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-black tracking-[0.3em] text-white mb-3 animate-pulse-slow" style={{ 
            textShadow: '0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,255,255,0.3)'
          }}>
            LOADING
          </h2>
          
          {/* Animated progress bar */}
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-gradient-to-r from-white/50 via-white to-white/50 animate-progress"></div>
          </div>
          
          {/* Enhanced pulsing dots */}
          <div className="flex gap-3 justify-center mt-4">
            <div className="dot-pulse dot-1"></div>
            <div className="dot-pulse dot-2"></div>
            <div className="dot-pulse dot-3"></div>
            <div className="dot-pulse dot-4"></div>
          </div>
        </div>

        {/* Percentage counter */}
        <div className="mt-8 text-white/60 text-sm tracking-widest font-mono animate-count">
          <span className="inline-block w-12 text-center">...</span>
        </div>
      </div>

      <style jsx>{`
        /* Floating animations for background orbs */
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.1); }
        }
        
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 40px) scale(1.15); }
        }
        
        .animate-float-1 { animation: float-1 8s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 10s ease-in-out infinite; }

        /* 3D Scene Setup */
        .loader-scene {
          perspective: 1200px;
          width: 200px;
          height: 200px;
          position: relative;
        }

        .loader-cube-container {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
        }

        .loader-cube {
          width: 120px;
          height: 120px;
          position: absolute;
          top: 50%;
          left: 50%;
          transform-style: preserve-3d;
          animation: rotateCube 6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
          transform: translate(-50%, -50%) rotateX(0deg) rotateY(0deg);
          filter: drop-shadow(0 0 30px rgba(255, 255, 255, 0.3));
        }

        .cube-face {
          position: absolute;
          width: 120px;
          height: 120px;
          border: 2px solid rgba(255, 255, 255, 0.6);
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.08) 0%, 
            rgba(255, 255, 255, 0.02) 50%,
            rgba(0, 0, 0, 0.3) 100%
          );
          backdrop-filter: blur(5px);
          box-shadow: 
            0 0 30px rgba(255, 255, 255, 0.2) inset,
            0 0 50px rgba(0, 0, 0, 0.8);
          overflow: hidden;
        }

        .face-inner {
          position: absolute;
          inset: 10px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: innerGlow 2s ease-in-out infinite;
        }

        @keyframes innerGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(255, 255, 255, 0.1) inset; }
          50% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.3) inset; }
        }

        .cube-front  { transform: translateZ(60px); }
        .cube-back   { transform: rotateY(180deg) translateZ(60px); }
        .cube-right  { transform: rotateY(90deg) translateZ(60px); }
        .cube-left   { transform: rotateY(-90deg) translateZ(60px); }
        .cube-top    { transform: rotateX(90deg) translateZ(60px); }
        .cube-bottom { transform: rotateX(-90deg) translateZ(60px); }

        @keyframes rotateCube {
          0% { transform: translate(-50%, -50%) rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
          33% { transform: translate(-50%, -50%) rotateX(120deg) rotateY(120deg) rotateZ(45deg); }
          66% { transform: translate(-50%, -50%) rotateX(240deg) rotateY(240deg) rotateZ(-45deg); }
          100% { transform: translate(-50%, -50%) rotateX(360deg) rotateY(360deg) rotateZ(0deg); }
        }

        /* Enhanced Orbiting Particles */
        .particle-orbit {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }

        .particle {
          position: absolute;
          width: 10px;
          height: 10px;
          background: radial-gradient(circle, #ffffff, rgba(255, 255, 255, 0.4));
          border-radius: 50%;
          box-shadow: 
            0 0 15px rgba(255, 255, 255, 0.9), 
            0 0 30px rgba(255, 255, 255, 0.6),
            0 0 45px rgba(255, 255, 255, 0.3);
          top: 50%;
          left: 50%;
        }

        .particle-1 {
          animation: orbit1 4s linear infinite;
        }

        .particle-2 {
          animation: orbit2 4s linear infinite;
          animation-delay: -1.33s;
          width: 8px;
          height: 8px;
        }

        .particle-3 {
          animation: orbit3 4s linear infinite;
          animation-delay: -2.66s;
          width: 12px;
          height: 12px;
        }

        @keyframes orbit1 {
          0% { transform: translate(-50%, -50%) rotate(0deg) translateX(100px) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg) translateX(100px) rotate(-360deg); }
        }

        @keyframes orbit2 {
          0% { transform: translate(-50%, -50%) rotate(0deg) translateX(90px) rotate(0deg) scale(1); }
          50% { transform: translate(-50%, -50%) rotate(180deg) translateX(90px) rotate(-180deg) scale(1.3); }
          100% { transform: translate(-50%, -50%) rotate(360deg) translateX(90px) rotate(-360deg) scale(1); }
        }

        @keyframes orbit3 {
          0% { transform: translate(-50%, -50%) rotate(0deg) translateX(110px) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(-360deg) translateX(110px) rotate(360deg); }
        }

        /* Rotating rings around cube */
        .ring {
          position: absolute;
          top: 50%;
          left: 50%;
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }

        .ring-1 {
          width: 160px;
          height: 160px;
          animation: rotateRing1 8s linear infinite;
        }

        .ring-2 {
          width: 180px;
          height: 180px;
          animation: rotateRing2 10s linear infinite reverse;
          border-color: rgba(255, 255, 255, 0.1);
        }

        @keyframes rotateRing1 {
          0% { transform: translate(-50%, -50%) rotateZ(0deg) rotateX(75deg); }
          100% { transform: translate(-50%, -50%) rotateZ(360deg) rotateX(75deg); }
        }

        @keyframes rotateRing2 {
          0% { transform: translate(-50%, -50%) rotateZ(0deg) rotateY(75deg); }
          100% { transform: translate(-50%, -50%) rotateZ(360deg) rotateY(75deg); }
        }

        /* Enhanced Pulsing Dots */
        .dot-pulse {
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
          animation: dotPulse 1.6s ease-in-out infinite;
        }

        .dot-1 { animation-delay: 0s; }
        .dot-2 { animation-delay: 0.2s; }
        .dot-3 { animation-delay: 0.4s; }
        .dot-4 { animation-delay: 0.6s; }

        @keyframes dotPulse {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(0.7);
            box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
          }
          50% { 
            opacity: 1;
            transform: scale(1.3);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.9);
          }
        }

        /* Progress bar animation */
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }

        /* Slow pulse for text */
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        /* Counter animation */
        @keyframes count {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }

        .animate-count {
          animation: count 2s ease-in-out infinite;
        }

        /* Radial glow effect around the scene */
        .loader-scene::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 60%);
          transform: translate(-50%, -50%);
          animation: sceneGlow 3s ease-in-out infinite;
          pointer-events: none;
          border-radius: 50%;
        }

        @keyframes sceneGlow {
          0%, 100% { 
            opacity: 0.4;
            transform: translate(-50%, -50%) scale(0.9);
          }
          50% { 
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }
      `}</style>
    </div>
  );
};

export default LoaderCube3D;