
import React, { useMemo } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  LayoutDashboard, Settings, HardHat, Wrench, ClipboardList, Users, 
  Building, BookOpen, ListTree, ChevronsUpDown, Ticket, Percent
} from 'lucide-react';

export const navigationConfig = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard', roles: ['company_admin', 'company_technician', 'company_viewer', 'client', 'admin'], feature: 'dashboard_access' },
  { id: 'company-management', label: 'Minha Empresa', icon: Building, path: '/app/company-management', roles: ['company_admin', 'company_technician', 'company_viewer', 'client', 'admin'], feature: 'company_view_access' },
  { id: 'requests', label: 'Solicitação de Serviço', icon: ClipboardList, path: '/app/requests', roles: ['company_admin', 'company_technician', 'company_viewer', 'client', 'admin'], feature: 'requests_management' },
  { id: 'work-orders', label: 'Ordem de Serviço', icon: Wrench, path: '/app/work-orders', roles: ['company_admin', 'company_technician', 'admin'], feature: 'work_orders_management' },
  { id: 'maintenances', label: 'Manutenções', icon: Wrench, path: '/app/maintenances', roles: ['company_admin', 'company_technician', 'admin'], feature: 'maintenances_management' },
  { 
    id: 'registrations', 
    label: 'Cadastros', 
    icon: ListTree, 
    type: 'accordion',
    roles: ['company_admin', 'company_technician', 'company_viewer', 'admin'],
    children: [
      { id: 'categories', label: 'Categorias', icon: ListTree, path: '/app/categories', roles: ['company_admin', 'company_technician', 'admin'], feature: 'category_management' },
      { id: 'equipment', label: 'Equipamentos', icon: Settings, path: '/app/equipment', roles: ['company_admin', 'company_technician', 'company_viewer', 'admin'], feature: 'equipment_management' },
      { id: 'parts', label: 'Peças e Estoque', icon: HardHat, path: '/app/parts', roles: ['company_admin', 'company_technician', 'admin'], feature: 'parts_management' },
    ]
  },
  { 
    id: 'admin-settings', 
    label: 'Configurações', 
    icon: Settings, 
    type: 'accordion',
    roles: ['admin'],
    children: [
        { id: 'user-management-admin', label: 'Usuários do Sistema', icon: Users, path: '/app/user-management', roles: ['admin'], feature: 'user_management_system' },
        { id: 'promotions', label: 'Promoções', icon: Percent, path: '/app/settings/promotions', roles: ['admin'], feature: 'promotions_management' },
    ]
  },
  { id: 'blog', label: 'Blog (Público)', icon: BookOpen, path: '/blog', roles: ['company_admin', 'company_technician', 'company_viewer', 'client', 'admin'], feature: 'blog_public_view' },
];

const SidebarContent = ({ currentUserRoleForNav, activeLicense, activeTab, handleNavClick, locationPathname, hasAccess, navigateToPricing }) => {
  
  const availableNav = useMemo(() => {
    return navigationConfig.map(item => {
      if (item.type === 'accordion') {
        const visibleChildren = item.children.filter(child => 
          currentUserRoleForNav && child.roles.includes(currentUserRoleForNav)
        );
        return visibleChildren.length > 0 ? { ...item, children: visibleChildren } : null;
      }
      return (currentUserRoleForNav && item.roles.includes(currentUserRoleForNav)) ? item : null;
    }).filter(Boolean);
  }, [currentUserRoleForNav]);
  
  const renderNavItem = (item, isChild = false) => {
    const isActive = activeTab === item.id || (item.path && item.path !== '/app' && locationPathname.startsWith(item.path));
    const isFeatureLocked = item.feature && !hasAccess(item.feature);

    const NavButton = () => (
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={`w-full justify-start text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} ${isChild ? 'pl-11' : ''}`}
        onClick={() => handleNavClick(item.id, item.path)}
        disabled={isFeatureLocked}
      >
        {!isChild && <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary' : ''}`} />}
        {item.label}
      </Button>
    );

    if (isFeatureLocked) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full cursor-not-allowed"><NavButton /></div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Funcionalidade não inclusa no seu plano atual.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return <NavButton />;
  };

  const accordionDefaultValue = useMemo(() => {
    const activeItem = availableNav.find(item => 
      item.type === 'accordion' && item.children.some(child => activeTab === child.id || (child.path && locationPathname.startsWith(child.path)))
    );
    return activeItem ? activeItem.id : undefined;
  }, [availableNav, activeTab, locationPathname]);

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="grid items-start gap-1">
          <Accordion type="single" collapsible defaultValue={accordionDefaultValue} className="w-full">
            {availableNav.map(item => {
              if (item.type === 'accordion') {
                return (
                  <AccordionItem key={item.id} value={item.id} className="border-b-0">
                    <AccordionTrigger className="py-2 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:no-underline rounded-md hover:bg-muted data-[state=open]:bg-muted justify-start">
                      <div className="flex items-center">
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.label}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pl-2 pt-1 space-y-1">
                      {item.children.map(child => (
                        <div key={child.id}>{renderNavItem(child, true)}</div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                );
              }
              return <div key={item.id}>{renderNavItem(item)}</div>;
            })}
          </Accordion>
        </nav>
      </ScrollArea>
      <div className="px-4 py-4 border-t border-border/50">
        <div className="p-3 rounded-lg bg-muted/50 text-center flex flex-col items-center">
          <p className="text-sm font-semibold text-foreground">Plano Atual</p>
          <Badge variant="outline" className="mt-1.5 mb-2.5 text-primary border-primary bg-primary/10">
            {activeLicense?.planName || 'N/A'}
          </Badge>
          <Button size="sm" className="w-full" onClick={navigateToPricing}>
            Ver Planos e Upgrades
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SidebarContent;