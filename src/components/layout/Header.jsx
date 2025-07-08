import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Menu, X, Sun, Moon, Wrench as AppIcon, CreditCard } from 'lucide-react';
import { useTheme } from '@/context/ThemeProvider';
import { useAuth } from '@/hooks/useAuth.js';
import { AUTH_STATES } from '@/context/AuthProvider.jsx';
import NotificationBell from '@/components/layout/NotificationBell';
import CompanySelectorDropdown from '@/components/layout/CompanySelectorDropdown';
import UserProfileDropdown from '@/components/layout/UserProfileDropdown';

const Header = ({ isMobile, isMobileMenuOpen, onToggleMobileMenu, onNavClick }) => {
    const { userProfile, userCompanies, currentCompanyId, selectCompany, authState } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    let displayedCompanyName = "Nenhuma Empresa Selecionada";
    if (userProfile?.role === 'admin' && !currentCompanyId) {
        displayedCompanyName = "Visão Geral (Admin)";
    } else if (currentCompanyId) {
        const company = userCompanies.find(c => c.company_id === currentCompanyId);
        displayedCompanyName = company?.company_name || "Empresa Desconhecida";
    }

    return (
        <header className="sticky top-0 z-30 w-full bg-card/80 dark:bg-card/60 backdrop-blur-lg border-b border-border/50 shadow-sm">
            <div className="container mx-auto px-2 sm:px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-1 sm:gap-2">
                    {isMobile && (
                        <Button variant="ghost" size="icon" onClick={onToggleMobileMenu} className="text-foreground">
                            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    )}
                    <Link to="/app" onClick={() => onNavClick('dashboard', '/app')} className="flex items-center gap-2 shrink-0">
                        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center shadow-md">
                            <AppIcon className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <h1 className="text-base sm:text-lg font-bold text-foreground hidden xs:block">Super Serviço</h1>
                    </Link>
                    
                    {userProfile && userCompanies && userCompanies.length > 0 && (userProfile.role === 'admin' || authState !== AUTH_STATES.COMPANY_SELECTION_PENDING) ? (
                        <div className="ml-1 sm:ml-2 border-l border-border/50 pl-1 sm:pl-2">
                            <CompanySelectorDropdown 
                                userCompanies={userCompanies} 
                                currentCompanyId={currentCompanyId}
                                currentCompanyName={displayedCompanyName}
                                selectCompany={selectCompany}
                                onManageCompanies={() => onNavClick('company-management', '/app/company-management')}
                            />
                        </div>
                    ) : null}
                </div>
                
                <div className="flex items-center gap-1.5 sm:gap-3">
                    <NotificationBell />
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    onClick={() => navigate('/pricing')}
                                    className="h-9"
                                >
                                    <CreditCard className="h-4 w-4 sm:mr-1.5" />
                                    <span className="hidden sm:inline">Planos</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Ver Planos de Assinatura</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-foreground hover:bg-muted/80 h-9 w-9">
                        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    </Button>
                    <UserProfileDropdown />
                </div>
            </div>
        </header>
    );
};

export default Header;