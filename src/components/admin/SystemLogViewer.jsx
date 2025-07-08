
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, AlertCircle, FileText, Code, Filter, Calendar } from 'lucide-react';
import { format, startOfDay, subDays, startOfMonth, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Pagination from '@/components/ui/pagination';

const LogEntry = ({ log }) => (
  <div className="p-3 mb-2 border-l-4 rounded-r-md border-blue-500 bg-muted/50 dark:bg-muted/20">
    {log.level === 'ERROR' && <div className="border-l-4 border-destructive bg-destructive/10 rounded-r-md -ml-3 -mr-3 -mt-3 p-3 mb-3">
        <p className="font-bold text-destructive">ERRO</p>
    </div>}
    <div className="flex justify-between items-start text-sm">
      <div className="flex-1">
        <p className="font-mono text-xs text-muted-foreground">
          {format(new Date(log.created_at), 'HH:mm:ss')}
        </p>
        <p className="font-semibold text-foreground">{log.message}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="font-mono">{log.tag}</Badge>
          <Badge variant="outline">{log.level}</Badge>
        </div>
      </div>
    </div>
    {log.meta && (
      <div className="mt-2 text-xs text-muted-foreground bg-black/20 dark:bg-black/50 p-2 rounded-md">
        <pre className="whitespace-pre-wrap break-all">
          {JSON.stringify(log.meta, null, 2)}
        </pre>
      </div>
    )}
    {log.error_stack && (
       <Accordion type="single" collapsible className="w-full mt-2">
        <AccordionItem value="stacktrace">
          <AccordionTrigger className="text-xs text-destructive hover:no-underline">Mostrar Stack Trace</AccordionTrigger>
          <AccordionContent>
            <div className="mt-2 text-xs text-destructive-foreground bg-destructive/80 p-2 rounded-md">
              <pre className="whitespace-pre-wrap break-all">{log.error_stack}</pre>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    )}
  </div>
);


const SystemLogViewer = () => {
  const [filterTag, setFilterTag] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: logs = [], isLoading, isError, error } = useQuery(
    ['system_logs'],
    async () => {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2000); 

      if (error) throw error;
      return data;
    }
  );

  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = startOfDay(subDays(now, 1));
    const sevenDaysAgoStart = startOfDay(subDays(now, 7));
    const thisMonthStart = startOfMonth(now);

    return logs.filter(log => {
      const logDate = new Date(log.created_at);
      const tagMatch = filterTag ? log.tag.toLowerCase().includes(filterTag.toLowerCase()) : true;
      const levelMatch = filterLevel === 'all' ? true : log.level === filterLevel;
      
      let dateMatch = true;
      switch (dateFilter) {
        case 'today':
          dateMatch = logDate >= todayStart;
          break;
        case 'yesterday':
          dateMatch = logDate >= yesterdayStart && logDate < todayStart;
          break;
        case 'last7days':
          dateMatch = logDate >= sevenDaysAgoStart;
          break;
        case 'thisMonth':
          dateMatch = logDate >= thisMonthStart;
          break;
        case 'all':
        default:
          dateMatch = true;
          break;
      }

      return tagMatch && levelMatch && dateMatch;
    });
  }, [logs, filterTag, filterLevel, dateFilter]);
  
  const groupedLogs = useMemo(() => {
    const paginatedLogs = filteredLogs.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

    return paginatedLogs.reduce((acc, log) => {
      const dateKey = format(startOfDay(new Date(log.created_at)), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(log);
      return acc;
    }, {});
  }, [filteredLogs, currentPage, itemsPerPage]);

  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive">
        <AlertCircle className="h-12 w-12 mb-4" />
        <p className="text-lg font-semibold">Erro ao carregar logs</p>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Code className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Visualizador de Logs do Sistema</CardTitle>
              <CardDescription>Audite e rastreie todas as ações importantes realizadas na plataforma.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-1">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Filtrar por TAG..."
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger><SelectValue placeholder="Filtrar por nível" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Níveis</SelectItem>
                <SelectItem value="INFO">INFO</SelectItem>
                <SelectItem value="WARN">WARN</SelectItem>
                <SelectItem value="ERROR">ERROR</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger><SelectValue placeholder="Filtrar por data" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sempre</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="yesterday">Ontem</SelectItem>
                <SelectItem value="last7days">Últimos 7 dias</SelectItem>
                <SelectItem value="thisMonth">Este Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {Object.keys(groupedLogs).length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">Nenhum log encontrado</h3>
          <p className="text-muted-foreground">Tente ajustar seus filtros ou aguarde novas ações no sistema.</p>
        </div>
      ) : (
        <>
          {Object.entries(groupedLogs).map(([date, dateLogs]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-4 sticky top-16 bg-background/80 backdrop-blur-sm py-2 z-10">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">
                  {format(new Date(date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </h2>
              </div>
              <div className="space-y-2">
                {dateLogs.map(log => (
                  <LogEntry key={log.id} log={log} />
                ))}
              </div>
            </div>
          ))}
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredLogs.length / itemsPerPage)}
            totalItems={filteredLogs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </>
      )}
    </div>
  );
};

export default SystemLogViewer;
