
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import useLocalStorage from '@/hooks/useLocalStorage.js';
import { useAuth } from '@/hooks/useAuth.js';
import Header from '@/components/layout/Header';
import SidebarContent from '@/components/layout/SidebarContent';
import AppContent from '@/components/layout/AppContent';

const MainLayout = () => {
  const { userProfile, activeLicense, hasAccess, getRoleForFiltering } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useLocalStorage('activeAppTab', 'dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);

  useEffect(() => {
    setIsClient(true);
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = (tabId, path, state = {}) => {
    if (path.startsWith('/blog')) {
      window.open(path, '_blank');
      return;
    }
    setActiveTab(tabId);
    navigate(path, { state });
    if (screenWidth < 768) {
      setIsMobileMenuOpen(false);
    }
  };
  
  const currentUserRoleForNav = getRoleForFiltering ? getRoleForFiltering() : userProfile?.role;
  const showDesktopSidebar = isClient && screenWidth >= 768;
  const showMobileSidebar = isClient && isMobileMenuOpen && screenWidth < 768;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col">
      <Header
        isMobile={isClient && screenWidth < 768}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onNavClick={handleNavClick}
      />

      <div className="flex flex-1 pt-16">
        {showDesktopSidebar && (
          <aside className="fixed top-16 left-0 z-20 w-64 h-[calc(100vh-4rem)] bg-card/70 dark:bg-card/50 backdrop-blur-lg border-r border-border/50 shadow-lg flex flex-col">
            <SidebarContent
              currentUserRoleForNav={currentUserRoleForNav}
              activeLicense={activeLicense}
              activeTab={activeTab}
              handleNavClick={handleNavClick}
              locationPathname={location.pathname}
              hasAccess={hasAccess}
              navigateToPricing={() => navigate('/pricing')}
            />
          </aside>
        )}

        <AnimatePresence>
          {showMobileSidebar && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-16 left-0 z-20 w-64 h-[calc(100vh-4rem)] bg-card/70 dark:bg-card/50 backdrop-blur-lg border-r border-border/50 shadow-lg flex flex-col md:hidden"
            >
              <SidebarContent
                currentUserRoleForNav={currentUserRoleForNav}
                activeLicense={activeLicense}
                activeTab={activeTab}
                handleNavClick={handleNavClick}
                locationPathname={location.pathname}
                hasAccess={hasAccess}
                navigateToPricing={() => navigate('/pricing')}
              />
            </motion.aside>
          )}
        </AnimatePresence>
        
        {showMobileSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 z-10 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        <main className={`flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto ${showDesktopSidebar ? 'md:ml-64' : ''}`}>
           <AnimatePresence mode="wait">
              {isClient && <AppContent />}
           </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
