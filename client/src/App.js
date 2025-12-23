import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Components
import Header from './components/Header';
import Footer from './components/Footer';

// Layout Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/LoadingSpinner';
import RouteLoaderOverlay from './components/RouteLoaderOverlay';

// Public Pages
import HomePage from './pages/HomePage';
import ForSalePage from './pages/ForSalePage';
import ForRentPage from './pages/ForRentPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ContactUsPage from './pages/ContactUsPage';
import LocationPage from './pages/LocationPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';

// User Pages
import UserDashboardPage from './pages/user/UserDashboardPage';
import UserPropertiesPage from './pages/user/UserPropertiesPage';
import UserLeadsPage from './pages/user/UserLeadsPage';
import UserLeadDetailPage from './pages/user/UserLeadDetailPage';
import UserProfilePage from './pages/user/UserProfilePage';
import AddPropertyPage from './pages/AddPropertyPage';
import EditPropertyPage from './pages/EditPropertyPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPropertiesPage from './pages/admin/AdminPropertiesPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminClientsPage from './pages/admin/AdminClientsPage';
import AdminLeadsPage from './pages/admin/AdminLeadsPage';
import AdvancedSearchPage from './pages/admin/AdvancedSearchPage';

// Auth Store
import useAuthStore from './store/authStore';
import HeroSection from './components/HeroSection';
import ToastContainer from './components/ToastContainer';
import ConfirmContainer from './components/ConfirmContainer';
import ScrollToTopOnRouteChange from './components/ScrollToTopOnRouteChange';
import usePerformanceHints from './hooks/usePerformance';

// Main App Component
function AppContent() {
  // Initialize performance hints early so DOM class/attributes are set
  usePerformanceHints();
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, checkAuth, isLoading } = useAuthStore();
  const lenisRef = React.useRef(null);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    // Register GSAP plugins and initialize smooth scroll once
    gsap.registerPlugin(ScrollTrigger);
    // Avoid re-initializing Lenis if already present
    if (!lenisRef.current) {
      const lenis = new Lenis({
        smooth: true,
        lerp: 0.1,
      });

      // store for use in route-change scroll resets
      lenisRef.current = lenis;

      // Expose Lenis instance on window so route-change scroll helpers can use it
      try { window.lenis = lenis; } catch (e) {}

      // Connect Lenis with ScrollTrigger so GSAP knows about the virtual scroll
      lenis.on('scroll', ScrollTrigger.update);

      // Tell ScrollTrigger to use Lenis' virtual scroll instead of the native scroller
      try {
        ScrollTrigger.scrollerProxy(document.scrollingElement || document.documentElement, {
          scrollTop(value) {
            if (arguments.length) {
              // when ScrollTrigger wants to set the scroll, use Lenis
              try {
                const currentY = (lenis && lenis.scroll && lenis.scroll.instance && lenis.scroll.instance.scroll && typeof lenis.scroll.instance.scroll.y === 'number')
                  ? lenis.scroll.instance.scroll.y
                  : (document.scrollingElement && document.scrollingElement.scrollTop) || 0;
                // Only call scrollTo if the requested value differs meaningfully from the current position
                if (typeof value === 'number' && Math.abs(value - currentY) > 2) {
                  lenis.scrollTo(value);
                }
              } catch (e) {}
            }
            // return current scroll position
            return (lenis && lenis.scroll && lenis.scroll.instance && lenis.scroll.instance.scroll && typeof lenis.scroll.instance.scroll.y === 'number')
              ? lenis.scroll.instance.scroll.y
              : (document.scrollingElement && document.scrollingElement.scrollTop) || 0;
          },
          getBoundingClientRect() {
            return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
          },
          // pinType matters on mobile where transforms may be used
          pinType: (document.scrollingElement || document.documentElement).style.transform ? 'transform' : 'fixed'
        });

        // Keep ScrollTrigger in sync on refresh
        const onRefresh = () => {
          try { lenis.update(); } catch (e) {}
        };
        ScrollTrigger.addEventListener('refresh', onRefresh);
        // ensure initial refresh
        ScrollTrigger.refresh();
      } catch (err) {
        // ignore scrollerProxy errors
        console.warn('ScrollTrigger scrollerProxy setup failed', err);
      }

      // Start RAF loop and keep id so we can cancel it on unmount
      let rafId;
      const handleRaf = (time) => {
        if (!lenisRef.current) return;
        try {
          lenisRef.current.raf(time);
        } catch (err) {
          // ignore raf errors
        }
        rafId = requestAnimationFrame(handleRaf);
      };
      rafId = requestAnimationFrame(handleRaf);

      // Check authentication on mount
      const initAuth = async () => {
        await checkAuth();
        setIsInitialized(true);
      };

      initAuth();

      // cleanup function
      return () => {
        // stop RAF
        if (rafId) cancelAnimationFrame(rafId);

        // remove ScrollTrigger update listener from Lenis
        try {
          if (lenis && typeof lenis.off === 'function') {
            lenis.off('scroll', ScrollTrigger.update);
          }
        } catch (err) {
          // ignore
        }

        // remove refresh listener if possible
        try { ScrollTrigger.removeEventListener && ScrollTrigger.removeEventListener('refresh', onRefresh); } catch (e) {}

        // Destroy lenis instance if available
        try {
          if (lenis && typeof lenis.destroy === 'function') lenis.destroy();
        } catch (err) {
          // ignore
        }

        // Kill remaining ScrollTriggers
        try { ScrollTrigger.getAll().forEach(t => t.kill()); } catch (err) {}

        lenisRef.current = null;
      };
    } else {
      // If lenis already exists, still ensure auth is initialized
      (async () => {
        await checkAuth();
        setIsInitialized(true);
      })();
    }
  }, [checkAuth]);

  // NOTE: route-change scrolling is handled by `ScrollToTopOnRouteChange` component
  // Show a short full-screen loader on route changes
  useEffect(() => {
    // skip showing loader on very first render until initialized
    if (!isInitialized) return;
    setRouteLoading(true);
    const timer = setTimeout(() => setRouteLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (isLoading || !isInitialized) {
    return <RouteLoaderOverlay visible={true} />;
  }

  return (
    <div className="min-h-screen bg-transparent text-black flex flex-col">
      <RouteLoaderOverlay visible={routeLoading} />
      <ScrollToTopOnRouteChange />
      <ToastContainer />
      <ConfirmContainer />
      {/* Public routes without sidebar */}
      <Routes>
        {/* Public routes with header/footer */}
        <Route path="/" element={
          <>
            <Header />
            <main className="flex-1">
              <HeroSection />
              <HomePage />
            </main>
            <Footer />
          </>
        } />
        
        <Route path="/forsale" element={
          <>
            <Header />
            <main className="flex-1">
              <HeroSection />
              <ForSalePage />
            </main>
            <Footer />
          </>
        } />
        
        <Route path="/forrent" element={
          <>
            <Header />
            <main className="flex-1">
              <HeroSection />
              <ForRentPage />
            </main>
            <Footer />
          </>
        } />

        <Route path="/location/:id" element={
          <>
            <Header />
            <main className="flex-1">
              <LocationPage />
            </main>
            <Footer />
          </>
        } />
        
        <Route path="/property/:id" element={
          <>
            {/* <Header /> */}
            <main className="flex-1">
              {/* <HeroSection /> */}
              <PropertyDetailPage />
            </main>
            <Footer />
          </>
        } />
        
        <Route path="/contact" element={
          <>
            <Header />
            <main className="flex-1">
              <HeroSection />
              <ContactUsPage />
            </main>
            <Footer />
          </>
        } />

        <Route path="/privacy" element={
          <>
            <main className="flex-1">
              <HeroSection />
              <PrivacyPage />
            </main>
          </>
        } />
        <Route path="/terms" element={
          <>
            <main className="flex-1">
              <HeroSection />
              <TermsPage />
            </main>
          </>
        } />
        
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* User Dashboard Routes */}
        <Route path="/user/*" element={
          <ProtectedRoute>
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex-1 overflow-auto">
                <Routes>
                  <Route path="dashboard" element={<UserDashboardPage />} />
                  <Route path="properties" element={<UserPropertiesPage />} />
                  <Route path="leads" element={<UserLeadsPage />} />
                  <Route path="leads/:id" element={<UserLeadDetailPage />} />
                  <Route path="profile" element={<UserProfilePage />} />
                </Routes>
              </div>
            </div>
          </ProtectedRoute>
        } />

        {/* Property Management (public with auth) */}
        <Route path="/add-property" element={
          <ProtectedRoute>
            <>
              <AddPropertyPage />
              <Footer />
            </>
          </ProtectedRoute>
        } />
        
        <Route path="/edit-property/:id" element={
          <ProtectedRoute>
            <>
              <Header />
              <EditPropertyPage />
              <Footer />
            </>
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <AdminRoute>
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex-1 overflow-auto bg-[#101624]">
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="properties" element={<AdminPropertiesPage />} />
                  <Route path="properties/pending" element={
                    <AdminPropertiesPage pendingOnly={true} />
                  } />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="clients" element={<AdminClientsPage />} />
                  <Route path="leads" element={<AdminLeadsPage />} />
                  <Route path="search" element={<AdvancedSearchPage />} />
                </Routes>
              </div>
            </div>
          </AdminRoute>
        } />

        {/* Catch all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

// Main App wrapper

// Only wrap App in <Router> if not already wrapped
const App = () => <AppContent />;

export default App;