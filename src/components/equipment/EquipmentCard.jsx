
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarDays, MapPin, Edit, QrCode, Power, PowerOff, AlertTriangle, Wrench, Lock, Briefcase, Eye } from 'lucide-react';

const EquipmentCard = ({ equipment, onEdit, onShowQr, onShowDetails, canEdit, canViewQr }) => {
  const getStatusVariant = (status) => {
    switch (status) {
      case 'operational': return 'bg-green-500 hover:bg-green-600';
      case 'maintenance': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'broken': return 'bg-red-500 hover:bg-red-600';
      case 'retired': return 'bg-slate-500 hover:bg-slate-600';
      default: return 'bg-gray-400 hover:bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational': return <Power className="mr-1.5 h-3.5 w-3.5" />;
      case 'maintenance': return <Wrench className="mr-1.5 h-3.5 w-3.5" />;
      case 'broken': return <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />;
      case 'retired': return <PowerOff className="mr-1.5 h-3.5 w-3.5" />;
      default: return null;
    }
  };

  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card/80 backdrop-blur-sm border-border/70 hover:border-primary/50">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold text-foreground leading-tight truncate" title={equipment.name}>
            {equipment.name || 'Nome Indisponível'}
          </CardTitle>
          <Badge variant="outline" className={`whitespace-nowrap text-xs font-medium px-2.5 py-1 rounded-full border-transparent text-white ${getStatusVariant(equipment.status)}`}>
            {getStatusIcon(equipment.status)}
            {equipment.status ? equipment.status.charAt(0).toUpperCase() + equipment.status.slice(1) : 'Desconhecido'}
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground truncate" title={equipment.category || 'Categoria não especificada'}>
          {equipment.category || 'Categoria não especificada'}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 pb-4 space-y-3 text-sm flex-grow">
        <div className="flex items-center text-muted-foreground">
          <Briefcase className="h-4 w-4 mr-2 text-sky-500" />
          <span className="truncate">Marca/Modelo: <span className="font-medium text-foreground ml-1">{equipment.brand || 'N/A'} / {equipment.model || 'N/A'}</span></span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <MapPin className="h-4 w-4 mr-2 text-rose-500" />
          <span className="truncate">Local: <span className="font-medium text-foreground ml-1">{equipment.location || 'N/A'}</span></span>
        </div>
      </CardContent>
      <CardFooter className="px-5 py-4 border-t border-border/50 flex justify-end gap-2">
         <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={onShowDetails}>
                        <Eye className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Ver Detalhes</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onShowQr(equipment)} 
                className={`border-primary/50 text-primary/80 hover:bg-primary/10 hover:text-primary ${!canViewQr ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!canViewQr}
              >
                <QrCode className="h-4 w-4" />
                {!canViewQr && <Lock className="ml-1 h-3 w-3"/>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{canViewQr ? 'Mostrar QRCode' : 'Funcionalidade indisponível'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(equipment)} 
                disabled={!canEdit}
              >
                <Edit className="h-4 w-4" />
                {!canEdit && <Lock className="ml-1 h-3 w-3"/>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{canEdit ? 'Editar Equipamento' : 'Funcionalidade indisponível'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
};

export default EquipmentCard;
