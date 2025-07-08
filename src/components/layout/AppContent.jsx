import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';
import { useCompanyData } from '@/hooks/useCompanyData.js';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage.js';

// Import all page components
import Dashboard from '@/components/Dashboard';
import EquipmentManager from '@/components/EquipmentManager';
import CategoryManager from '@/components/categories/CategoryManager';
import PartsManager from '@/components/PartsManager';
import WorkOrderManager from '@/components/WorkOrderManager';
import ServiceRequestManager from '@/components/ServiceRequestManager';
import MaintenanceManager from '@/components/MaintenanceManager';
import CompanyManager from '@/components/company/CompanyManager'; 
import UserManagementPage from '@/components/UserManagementPage';
import LicenseManagerPage from '@/components/admin/LicenseContractManager';
import SettingsPage from '@/components/admin/SettingsPage';
import TicketManager from '@/components/tickets/TicketManager';
import TermsManager from '@/components/admin/TermsManager';
import SystemParametersManager from '@/components/admin/SystemParametersManager';
import BlogManager from '@/components/blog/BlogManager';
import BlogPostEditor from '@/components/blog/BlogPostEditor';
import UserProfilePage from '@/components/user-profile/UserProfilePage.jsx';
import AdminUserPermissions from '@/components/admin/AdminUserPermissions';
import PromotionsManager from '@/components/promotions/PromotionsManager';
import SystemAgentDashboard from '@/components/admin/SystemAgentDashboard';
import FeatureLockedComponent from '@/components/FeatureLockedComponent';
import { AUTH_STATES } from '@/context/AuthProvider.jsx';
import { navigationConfig } from '@/components/layout/SidebarContent';


const AppContent = () => {
    const { userProfile, userCompanies, currentCompanyId, hasAccess, activeLicense, authState, refreshAuthData, getRoleForFiltering } = useAuth();
    const { companyData } = useCompanyData();
    const { equipments, parts, workOrders, serviceRequests, categories } = companyData;
    const location = useLocation();

    const [activeTab, setActiveTab] = useLocalStorage('activeAppTab', 'dashboard');
    const [serviceRequestToConvert, setServiceRequestToConvert] = useState(null);
    const onConversionHandled = useCallback(() => setServiceRequestToConvert(null), []);

    const currentUserRoleForNav = getRoleForFiltering ? getRoleForFiltering() : userProfile?.role;
    
    useEffect(() => {
        const path = location.pathname;
        const navItemFromPath = [...navigationConfig]
            .filter(item => item.path) 
            .sort((a, b) => (b.path?.length || 0) - (a.path?.length || 0))
            .find(item => path.startsWith(item.path));
        
        if (navItemFromPath) {
            if (activeTab !== navItemFromPath.id) {
                setActiveTab(navItemFromPath.id);
            }
        } else if (path === '/app' || path === '/app/') {
            setActiveTab('dashboard');
        } else if (path === '/app/profile') {
            // No specific tab for profile, keep the last active one.
        }
    }, [location.pathname, setActiveTab]);

    let displayedCompanyName = "Nenhuma Empresa Selecionada";
    if (userProfile?.role === 'admin' && !currentCompanyId) {
        displayedCompanyName = "Visão Geral (Admin)";
    } else if (currentCompanyId) {
        const company = userCompanies.find(c => c.company_id === currentCompanyId);
        displayedCompanyName = company?.company_name || "Empresa Desconhecida";
    }

    const convertServiceRequestToWorkOrder = useCallback(async (request) => {
        if (!currentCompanyId && userProfile?.role !== 'admin') {
            toast({ title: "Ação Necessária", description: "Selecione uma empresa antes de converter a solicitação.", variant: "destructive" });
            return;
        }
        if (!hasAccess('work_orders_management')) {
            toast({ title: "Acesso Negado", description: "Seu plano atual não permite criar ordens de serviço.", variant: "destructive" });
            return;
        }

        try {
            const { error } = await supabase.from('service_requests').update({ status: 'convertida', updated_at: new Date().toISOString() }).eq('id', request.id);
            if (error) throw error;
            toast({ title: "Sucesso!", description: "Status da solicitação atualizado. Redirecionando..." });
            setServiceRequestToConvert(request);
        } catch (error) {
            toast({ title: "Erro na Atualização", description: `Falha ao atualizar status da solicitação: ${error.message}`, variant: "destructive"});
        }
    }, [currentCompanyId, userProfile, hasAccess]);

    useEffect(() => {
        if (serviceRequestToConvert) {
            setActiveTab('work-orders');
        }
    }, [serviceRequestToConvert, setActiveTab]);

    const pageComponents = useMemo(() => {
        const budgetData = { monthlyBudget: 50000, yearlyBudget: 600000, categories: { preventive: 40, corrective: 35, emergency: 15, improvement: 10 }};

        return {
            'dashboard': <Dashboard equipments={equipments} parts={parts} workOrders={workOrders} serviceRequests={serviceRequests} maintenanceGoals={[]} budgetData={budgetData} userProfile={userProfile} companyName={displayedCompanyName} />,
            'equipment': <EquipmentManager equipments={equipments} categories={categories} />,
            'categories': <CategoryManager categories={categories} />,
            'parts': <PartsManager parts={parts} />,
            'work-orders': <WorkOrderManager workOrders={workOrders} equipments={equipments} userProfile={userProfile} serviceRequestToConvert={serviceRequestToConvert} onConversionHandled={onConversionHandled} />,
            'requests': <ServiceRequestManager serviceRequests={serviceRequests} equipments={equipments} onConvertToWorkOrder={convertServiceRequestToWorkOrder} userProfile={userProfile} />,
            'maintenances': <MaintenanceManager />,
            'company-management': <CompanyManager />,
            'user-management-admin': <UserManagementPage />,
            'settings': <SettingsPage />,
        };
    }, [equipments, parts, workOrders, serviceRequests, categories, userProfile, displayedCompanyName, serviceRequestToConvert, onConversionHandled, convertServiceRequestToWorkOrder]);

    const renderContent = () => {
        const path = location.pathname;

        // Specific high-priority routes
        if (path === '/app/profile') return <UserProfilePage />;
        if (currentUserRoleForNav === 'admin') {
            if (path.startsWith('/app/admin/permissions/')) return <AdminUserPermissions />;
            if (path === '/app/user-management') return <UserManagementPage />;
            if (path === '/app/settings/licenses-contracts') return <LicenseManagerPage />;
            if (path === '/app/settings/terms-policies') return <TermsManager />;
            if (path === '/app/settings/system-parameters') return <SystemParametersManager />;
            if (path === '/app/settings/tickets') return <TicketManager />;
            if (path === '/app/settings/blog-management') return <BlogManager />;
            if (path.startsWith('/app/settings/blog-editor')) return <BlogPostEditor />;
            if (path === '/app/settings/promotions') return <PromotionsManager />;
            if (path === '/app/settings/system-agent') return <SystemAgentDashboard />;
            if (path === '/app/settings') return <SettingsPage />;
        }
        
        // Handle state where company selection is needed
        if (authState === AUTH_STATES.COMPANY_SELECTION_PENDING && userProfile?.role !== 'admin') {
            return <CompanyManager refreshAuthData={refreshAuthData} />;
        }

        // Feature-locked or standard page rendering
        const navItem = navigationConfig.find(item => item.id === activeTab);
        if (navItem && !hasAccess(navItem.feature)) {
            return <FeatureLockedComponent featureName={navItem.label} currentPlan={activeLicense?.planName} />;
        }
        
        const componentToRender = pageComponents[activeTab] || pageComponents['dashboard'];

        return (
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                {componentToRender}
            </motion.div>
        );
    };

    return renderContent();
};

export default AppContent;