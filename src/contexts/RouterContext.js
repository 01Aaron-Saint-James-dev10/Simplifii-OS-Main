import React, { createContext, useState, useContext, useCallback } from 'react';

const RouterContext = createContext();

/**
 * RouterContext
 *
 * Minimal in-app router for v1. No URL routing.
 * Views: 'home' | 'canvas'
 */
export const RouterProvider = ({ children }) => {
  const [view, setView] = useState('home');
  const [canvasTarget, setCanvasTarget] = useState({ courseId: null, assessmentTitle: null });

  const navigateToCanvas = useCallback((courseId, assessmentTitle) => {
    setCanvasTarget({ courseId, assessmentTitle: assessmentTitle || null });
    setView('canvas');
  }, []);

  const navigateHome = useCallback(() => {
    setView('home');
  }, []);

  return (
    <RouterContext.Provider value={{
      view,
      courseId: canvasTarget.courseId,
      assessmentTitle: canvasTarget.assessmentTitle,
      navigateToCanvas,
      navigateHome,
    }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => useContext(RouterContext);
