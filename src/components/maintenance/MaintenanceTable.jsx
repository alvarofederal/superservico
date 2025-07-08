
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, CheckCircle, XCircle, ArrowUpDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { maintenanceStatusColors, maintenanceStatusLabels, maintenanceTypeLabels, getDateColorClass } from '@/components/maintenance/maintenanceUtils';
import Pagination from '@/components/ui/pagination';

const MaintenanceTable = ({ 
  maintenances, 
  onEdit, 
  onDetails,
  onTimeline,
  onUpdateStatus, 
  isSubmitting, 
  getEquipmentName,
  getAssignedUserName,
  sortConfig,
  requestSort
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.ceil(maintenances.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMaintenances = maintenances.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? <ArrowUpDown className="h-3 w-3 ml-1 inline transform rotate-0" /> : <ArrowUpDown className="h-3 w-3 ml-1 inline transform rotate-180" />;
    }
    return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-30" />;
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto bg-card p-4 rounded-lg shadow-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('title')}>Título {getSortIndicator('title')}</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('equipment_name')}>Equipamento {getSortIndicator('equipment_name')}</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('type')}>Tipo {getSortIndicator('type')}</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('scheduled_date')}>Data Agendada {getSortIndicator('scheduled_date')}</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('status')}>Status {getSortIndicator('status')}</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentMaintenances.map((m) => (
              <TableRow key={m.id} className="hover:bg-muted/20">
                <TableCell className="font-medium text-foreground max-w-xs truncate" title={m.title}>{m.title}</TableCell>
                <TableCell className="max-w-xs truncate" title={getEquipmentName(m)}>{getEquipmentName(m)}</TableCell>
                <TableCell><Badge variant="outline">{maintenanceTypeLabels[m.type] || m.type}</Badge></TableCell>
                <TableCell className={cn("font-medium", getDateColorClass(m.scheduled_date))}>
                  {new Date(m.scheduled_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </TableCell>
                <TableCell>
                  <Badge className={`${maintenanceStatusColors[m.status]} text-primary-foreground border-0`}>
                    {maintenanceStatusLabels[m.status] || m.status}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-1 whitespace-nowrap">
                  <Button variant="ghost" size="icon" onClick={() => onTimeline(m)} title="Ver Linha do Tempo"><Activity className="h-4 w-4 text-purple-500" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onDetails(m)} title="Visualizar Detalhes"><Eye className="h-4 w-4 text-blue-500" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(m)} title="Editar Manutenção"><Edit className="h-4 w-4 text-yellow-500" /></Button>
                  {m.status !== 'completed' && m.status !== 'cancelled' && (
                    <Button variant="ghost" size="icon" onClick={() => onUpdateStatus(m.id, 'completed')} title="Marcar como Concluída" disabled={isSubmitting}>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </Button>
                  )}
                   {m.status !== 'cancelled' && m.status !== 'completed' && (
                    <Button variant="ghost" size="icon" onClick={() => onUpdateStatus(m.id, 'cancelled')} title="Cancelar Manutenção" disabled={isSubmitting}>
                      <XCircle className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={maintenances.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  );
};

export default MaintenanceTable;
