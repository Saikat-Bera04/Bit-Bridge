// Import polyfills first to ensure Buffer is defined globally
import "./polyfills";

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initPerformanceOptimizations } from "./utils/performance";

// Initialize performance optimizations immediately
initPerformanceOptimizations();

// Create root with error boundary and loading state
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Filter out React setState warnings from error boundary
      if (event.error?.message?.includes('setState') || 
          event.error?.message?.includes('Cannot update a component')) {
        console.warn('React warning (handled):', event.error?.message);
        return;
      }
      console.error('Application error:', event.error);
      setHasError(true);
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Filter out React warnings from unhandled rejections
      if (event.reason?.message?.includes('setState') || 
          event.reason?.message?.includes('Cannot update a component')) {
        console.warn('React warning (handled):', event.reason?.message);
        return;
      }
      console.error('Unhandled promise rejection:', event.reason);
      setHasError(true);
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Faster loading - reduce delay
    const timer = setTimeout(() => setIsLoading(false), 50);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      clearTimeout(timer);
    };
  }, []);
  
  if (hasError) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#ef4444' }}>Something went wrong</h2>
        <p style={{ marginBottom: '20px', color: '#6b7280' }}>
          The application encountered an error. Please try reloading the page.
        </p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#0f172a'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid #1e293b',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#94a3b8', fontFamily: 'system-ui, sans-serif', fontSize: '14px' }}>Loading...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

// Add CSS for spinner animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

// Get root element and create app
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
