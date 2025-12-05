import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logEvent } from '../api/logging';

const DataTracker = () => {
  const location = useLocation();

  useEffect(() => {
    logEvent('NAVIGATE', { path: location.pathname });
  }, [location]);

  useEffect(() => {
    let mouseTimer = null;
    const sessionStartTime = Date.now();

    const handleMouseMove = (event) => {
      if (mouseTimer) return;
      
      mouseTimer = setTimeout(() => {
        logEvent('MOUSE_MOVE', {
            x: event.clientX,
            y: event.clientY,
        }, {
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
        });
        mouseTimer = null;
      }, 1000);
    };

    const handleBeforeUnload = () => {
      const duration = Date.now() - sessionStartTime;
      logEvent('SESSION_END', { durationMs: duration });
    };

    logEvent('SESSION_START', { time: sessionStartTime });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return null;
};

export default DataTracker;