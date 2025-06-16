import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Settings, Wrench, Package, ClipboardList, Menu, X, Sun, Moon, FilePlus2, Palette as AppIcon, Users, LogOut, UserCircle, ShieldCheck, Briefcase, ChevronDown, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu.jsx"; 
import Dashboard from '@/components/Dashboard';
import EquipmentManager from '@/components/EquipmentManager';
import PartsManager from '@/components/PartsManager';
import WorkOrderManager from '@/components/WorkOrderManager';
import ServiceRequestManager from '@/components/ServiceRequestManager';
import UserManagementPage from '@/components/UserManagementPage';
import CompanyManager from '@/components/CompanyManager'; 
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/hooks/useAuth.js';
import { AUTH_STATES } from '@/context/AuthProvider.jsx';

const MainLayout = () => {
  const { userProfile, userCompanies, selectCompany, authState, handleLogout, refreshAuthData } = useAuth();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);
  const [theme, setTheme] = useLocalStorage('theme', 'dark');

  const [equipments, setEquipments] = useState([]);
  const [parts, setParts] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [serviceRequestToConvert, setServiceRequestToConvert] = useState(null);
  const [budgetData] = useState({ 
    monthlyBudget: 50000, yearlyBudget: 600000,
    categories: { preventive: 40, corrective: 35, emergency: 15, improvement: 10 }
  });

  const fetchAllDataForCompany = useCallback(async (companyId) => {
    if (!userProfile) return;
    const isClientWithNoCompany = userProfile.role === 'client' && !companyId;
    
    try {
      const [equipmentsRes, partsRes, workOrdersRes, serviceRequestsRes] = await Promise.all([
        companyId ? supabase.from('equipments').select('*').eq('company_id', companyId).order('createdat', { ascending: false }) : Promise.resolve({data:[]}),
        companyId ? supabase.from('parts').select('*').eq('company_id', companyId).order('createdat', { ascending: false }) : Promise.resolve({data:[]}),
        companyId ? supabase.from('work_orders').select('*').eq('company_id', companyId).order('createdat', { ascending: false }) : Promise.resolve({data:[]}),
        isClientWithNoCompany ? supabase.from('service_requests').select('*, equipments(name)').eq('user_id', userProfile.id).is('company_id', null).order('created_at', { ascending: false }) :
        companyId ? supabase.from('service_requests').select('*, equipments(name)').eq('company_id', companyId).order('created_at', { ascending: false }) : Promise.resolve({data:[]})
      ]);

      if (equipmentsRes.error) throw equipmentsRes.error; setEquipments(equipmentsRes.data || []);
      if (partsRes.error) throw partsRes.error; setParts(partsRes.data || []);
      if (workOrdersRes.error) throw workOrdersRes.error; setWorkOrders(workOrdersRes.data || []);
      if (serviceRequestsRes.error) throw serviceRequestsRes.error; setServiceRequests(serviceRequestsRes.data || []);
      
      if (companyId) toast({title: "Dados da empresa carregados!"});
    } catch (error) {
      toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
      setEquipments([]); setParts([]); setWorkOrders([]); setServiceRequests([]);
    }
  }, [userProfile]);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));

  useEffect(() => {
    setIsClient(true);
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    if (userProfile?.current_company_id) {
        fetchAllDataForCompany(userProfile.current_company_id);
    } else if (userProfile?.role === 'client') {
        fetchAllDataForCompany(null); 
    } else {
        setEquipments([]); setParts([]); setWorkOrders([]); setServiceRequests([]);
    }
  }, [userProfile, userProfile?.current_company_id, fetchAllDataForCompany]);


  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'technician', 'client', 'company_admin', 'company_technician', 'company_viewer'] },
    { id: 'requests', label: 'Solicitações', icon: FilePlus2, roles: ['admin', 'technician', 'client', 'company_admin', 'company_technician', 'company_viewer'] },
    { id: 'work-orders', label: 'Ordens de Serviço', icon: ClipboardList, roles: ['admin', 'technician', 'company_admin', 'company_technician'] },
    { id: 'equipment', label: 'Equipamentos', icon: Settings, roles: ['admin', 'technician', 'company_admin', 'company_technician'] },
    { id: 'parts', label: 'Peças', icon: Package, roles: ['admin', 'technician', 'company_admin', 'company_technician'] },
    { id: 'user-management', label: 'Usuários Sistema', icon: Users, roles: ['admin'] }, 
    { id: 'company-management', label: 'Minhas Empresas', icon: Briefcase, roles: ['company_admin', 'admin', 'technician', 'client'] },
  ];

  const getRoleForFiltering = () => {
    if (userProfile?.current_company_id) {
      const companyMembership = userCompanies.find(c => c.id === userProfile.current_company_id);
      return companyMembership?.role_in_company || userProfile?.role; 
    }
    return userProfile?.role; 
  };

  const currentUserRoleForNav = getRoleForFiltering();
  const availableNav = navigation.filter(item => userProfile && currentUserRoleForNav && item.roles.includes(currentUserRoleForNav));
  
  const currentYear = new Date().getFullYear();
  const showSidebar = isClient && (isMobileMenuOpen || screenWidth >= 768);
  const currentCompanyName = userCompanies.find(c => c.id === userProfile?.current_company_id)?.name || "Nenhuma Empresa";

  const convertServiceRequestToWorkOrder = async (request) => {
    if (!userProfile?.current_company_id) {
      toast({ title: "Ação Necessária", description: "Selecione uma empresa antes de converter a solicitação.", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from('service_requests').update({ status: 'convertida', updated_at: new Date().toISOString() }).eq('id', request.id);
      if (error) throw error;
      
      toast({ title: "Sucesso!", description: "Status da solicitação atualizado. Redirecionando..." });
      fetchAllDataForCompany(userProfile.current_company_id); 
      
      setServiceRequestToConvert(request);
      setActiveTab('work-orders');

    } catch (error) {
       toast({ title: "Erro na Atualização", description: `Falha ao atualizar status da solicitação: ${error.message}`, variant: "destructive"});
    }
  };

  const renderMainContent = () => {
    if (authState === AUTH_STATES.COMPANY_SELECTION_PENDING) {
      return (
        <div className="flex-1 flex items-center justify-center p-4">
            <CompanyManager refreshAuthData={refreshAuthData} />
        </div>
      );
    }
    
    switch (activeTab) {
      case 'dashboard': return <Dashboard equipments={equipments} parts={parts} workOrders={workOrders} serviceRequests={serviceRequests} maintenanceGoals={[]} budgetData={budgetData} userProfile={userProfile} companyName={currentCompanyName} />;
      case 'equipment': return <EquipmentManager equipments={equipments} setEquipments={() => fetchAllDataForCompany(userProfile?.current_company_id)} />;
      case 'parts': return <PartsManager parts={parts} setParts={() => fetchAllDataForCompany(userProfile?.current_company_id)} />;
      case 'work-orders': return <WorkOrderManager workOrders={workOrders} setWorkOrders={() => fetchAllDataForCompany(userProfile?.current_company_id)} equipments={equipments} userProfile={userProfile} serviceRequestToConvert={serviceRequestToConvert} onConversionHandled={() => setServiceRequestToConvert(null)} />;
      case 'requests': return <ServiceRequestManager serviceRequests={serviceRequests} setServiceRequests={() => fetchAllDataForCompany(userProfile?.current_company_id)} equipments={equipments} onConvertToWorkOrder={convertServiceRequestToWorkOrder} userProfile={userProfile} />;
      case 'user-management': return userProfile?.role === 'admin' ? <UserManagementPage /> : <div className="text-center p-8"><ShieldCheck className="h-16 w-16 mx-auto text-destructive mb-4" /> <h2 className="text-2xl font-semibold">Acesso Negado</h2> <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p></div>;
      case 'company-management': return <CompanyManager refreshAuthData={refreshAuthData} />;
      default: return <Dashboard equipments={equipments} parts={parts} workOrders={workOrders} serviceRequests={serviceRequests} maintenanceGoals={[]} budgetData={budgetData} userProfile={userProfile} companyName={currentCompanyName} />;
    }
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="relative flex h-screen">
        {isClient && screenWidth < 768 && (
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ position: 'fixed', top: '1rem', left: '1rem', zIndex: 50 }} className="text-foreground">
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
        )}
        <AnimatePresence>
          {showSidebar && (
            <motion.div initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed md:relative z-40 w-64 h-full bg-card/70 dark:bg-card/50 backdrop-blur-lg border-r border-border/50 shadow-lg">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-border/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-500 dark:to-purple-600 rounded-lg flex items-center justify-center shadow-md"><AppIcon className="h-6 w-6 text-primary-foreground" /></div>
                    <div><h1 className="text-xl font-bold text-foreground">Super Serviço</h1><p className="text-xs text-muted-foreground">SaaS Edition</p></div>
                  </div>
                  {userProfile && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start p-2 rounded-md bg-muted/50 border border-border/30 hover:bg-muted">
                          <div className="flex items-center gap-2 w-full">
                            <UserCircle className="h-7 w-7 text-primary flex-shrink-0" />
                            <div className="flex-grow overflow-hidden">
                              <p className="text-sm font-medium text-foreground truncate" title={userProfile.full_name}>{userProfile.full_name}</p>
                              <p className="text-xs text-muted-foreground capitalize truncate">{currentUserRoleForNav} @ {currentCompanyName}</p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto flex-shrink-0" />
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="start">
                        <DropdownMenuLabel>Mudar de Empresa</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {userCompanies.length > 0 ? userCompanies.map(company => (
                          <DropdownMenuItem key={company.id} onClick={() => selectCompany(company.id)} className="cursor-pointer">
                            <Briefcase className="mr-2 h-4 w-4" />
                            <span>{company.name}</span>
                            {userProfile.current_company_id === company.id && <Check className="ml-auto h-4 w-4 text-primary" />}
                          </DropdownMenuItem>
                        )) : (
                          <DropdownMenuItem disabled>Nenhuma empresa associada</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setActiveTab('company-management')}>
                          <Plus className="mr-2 h-4 w-4" /> Gerenciar Empresas
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <nav className="flex-1 p-4 space-y-1">
                  {availableNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <motion.button key={item.id} whileHover={{ scale: 1.02, x: 2 }} whileTap={{ scale: 0.98 }} onClick={() => { setActiveTab(item.id); if (screenWidth < 768) setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${isActive ? 'bg-primary/10 dark:bg-primary/20 text-primary border border-primary/30 dark:border-primary/50 shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 dark:hover:bg-accent/70'}`}>
                        <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                        <span className={`font-medium ${isActive ? 'text-primary' : ''}`}>{item.label}</span>
                        {isActive && (<motion.div layoutId="activeTabHighlight" className="ml-auto w-1.5 h-6 bg-primary rounded-full" />)}
                      </motion.button>
                    );
                  })}
                </nav>
                <div className="p-4 mt-auto border-t border-border/50 space-y-2">
                  <Button variant="ghost" size="sm" onClick={toggleTheme} className="w-full flex justify-center items-center gap-2 text-muted-foreground hover:text-foreground">
                    {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="w-full flex justify-center items-center gap-2 text-muted-foreground hover:text-destructive hover:border-destructive">
                    <LogOut className="h-4 w-4" /> Logout
                  </Button>
                </div>
                <div className="p-4 border-t border-border/50"><div className="text-xs text-muted-foreground text-center"><p>© {currentYear} Super Serviço</p><p>SaaS MVP 1.0.2</p></div></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {isClient && isMobileMenuOpen && screenWidth < 768 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 dark:bg-black/80 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
        )}
        <div className="flex-1 flex flex-col min-h-screen md:ml-64">
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
             <AnimatePresence mode="wait">
              <motion.div key={activeTab + (userProfile?.current_company_id || 'no-company')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
                {isClient && renderMainContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;