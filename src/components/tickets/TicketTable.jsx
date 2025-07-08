import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, MessageSquare as MessageSquareWarning, ArrowUpDown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Pagination from '@/components/ui/pagination';

export const TICKET_STATUS_LABELS = {
  open: 'Aberto',
  in_progress: 'Em Andamento',
  resolved: 'Resolvido',
  closed: 'Fechado',
  reopened: 'Reaberto',
};

export const TICKET_STATUS_COLORS = {
  open: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  resolved: 'bg-green-500',
  closed: 'bg-gray-500',
  reopened: 'bg-purple-500',
};

export const TICKET_PRIORITY_LABELS = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

export const TICKET_PRIORITY_COLORS = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
};


const TicketTable = ({ 
  tickets, 
  onViewDetails, 
  onEdit, 
  onDelete,
  sortConfig,
  requestSort,
  currentUserRole 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.ceil(tickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTickets = tickets.slice(startIndex, endIndex);

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
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto bg-card p-4 rounded-lg shadow-xl border border-border/20">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/10">
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('id')}>ID {getSortIndicator('id')}</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('title')}>Título {getSortIndicator('title')}</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('application_module')}>Módulo {getSortIndicator('application_module')}</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('priority')}>Prioridade {getSortIndicator('priority')}</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('status')}>Status {getSortIndicator('status')}</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('created_at')}>Criação {getSortIndicator('created_at')}</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTickets.map((ticket) => (
              <TableRow key={ticket.id} className="hover:bg-muted/5 transition-colors duration-150">
                <TableCell className="font-mono text-xs text-muted-foreground truncate" title={ticket.id}>{ticket.id.substring(0,8)}...</TableCell>
                <TableCell className="font-medium text-foreground max-w-xs truncate" title={ticket.title}>{ticket.title}</TableCell>
                <TableCell className="text-muted-foreground">{ticket.application_module}</TableCell>
                <TableCell>
                  <Badge className={cn(TICKET_PRIORITY_COLORS[ticket.priority] || 'bg-gray-400', 'text-white text-xs border-0')}>
                    {TICKET_PRIORITY_LABELS[ticket.priority] || ticket.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn(TICKET_STATUS_COLORS[ticket.status] || 'bg-gray-400', 'text-white text-xs border-0')}>
                    {TICKET_STATUS_LABELS[ticket.status] || ticket.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{formatDate(ticket.created_at)}</TableCell>
                <TableCell className="space-x-1 whitespace-nowrap">
                  <Button variant="ghost" size="icon" onClick={() => onViewDetails(ticket)} title="Visualizar Detalhes">
                    <Eye className="h-4 w-4 text-blue-500 hover:text-blue-400" />
                  </Button>
                  {(currentUserRole === 'admin' || currentUserRole === 'company_admin') && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => onEdit(ticket)} title="Editar Chamado">
                        <Edit className="h-4 w-4 text-yellow-500 hover:text-yellow-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(ticket.id)} title="Excluir Chamado">
                        <Trash2 className="h-4 w-4 text-destructive hover:text-red-400" />
                      </Button>
                    </>
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
        totalItems={tickets.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  );
};

export default TicketTable;