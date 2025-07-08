import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { XCircle, MessageSquare as MessageSquareWarning, CalendarDays, User, Tag, AlertTriangle, Image as ImageIconLucide, Send, Loader2, Download } from 'lucide-react';
import { TICKET_STATUS_LABELS, TICKET_STATUS_COLORS, TICKET_PRIORITY_LABELS, TICKET_PRIORITY_COLORS } from './TicketTable';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const TicketDetailsModal = ({ isOpen, setIsOpen, ticket, onTicketUpdate }) => {
  const { userProfile } = useAuth();
  const [images, setImages] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(ticket?.status);

  const isAdmin = userProfile?.role === 'admin' || (ticket?.company_id && userProfile?.current_company_id === ticket.company_id && userProfile.role_in_company === 'company_admin');


  const fetchTicketDetails = async () => {
    if (!ticket?.id) return;
    setIsLoadingData(true);
    try {
      const [imagesRes, commentsRes] = await Promise.all([
        supabase.from('ticket_images').select('*').eq('ticket_id', ticket.id),
        supabase.from('ticket_comments').select('*, profiles(full_name, avatar_url)').eq('ticket_id', ticket.id).order('created_at', { ascending: true })
      ]);

      if (imagesRes.error) throw imagesRes.error;
      setImages(imagesRes.data || []);

      if (commentsRes.error) throw commentsRes.error;
      setComments(commentsRes.data || []);

    } catch (error) {
      toast({ title: "Erro ao Carregar Detalhes", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  };
  
  useEffect(() => {
    if (isOpen && ticket?.id) {
      fetchTicketDetails();
      setCurrentStatus(ticket.status);
    } else {
      setImages([]);
      setComments([]);
      setNewComment('');
    }
  }, [isOpen, ticket]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !userProfile || !ticket?.id) return;
    setIsSubmittingComment(true);
    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticket.id,
          user_id: userProfile.id,
          comment: newComment.trim(),
        })
        .select('*, profiles(full_name, avatar_url)')
        .single();

      if (error) throw error;
      setComments(prev => [...prev, data]);
      setNewComment('');
      toast({ title: "Comentário Adicionado!" });
    } catch (error) {
      toast({ title: "Erro ao Adicionar Comentário", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!isAdmin || !ticket?.id) return;
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ticket.id)
        .select()
        .single();
      
      if (error) throw error;
      setCurrentStatus(newStatus);
      toast({ title: "Status Atualizado!", description: `Chamado agora está ${TICKET_STATUS_LABELS[newStatus]}.` });
      if (onTicketUpdate) onTicketUpdate(data);
      setEditingStatus(false);
    } catch (error)
 {
      toast({ title: "Erro ao Atualizar Status", description: error.message, variant: "destructive" });
    }
  };

  const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return 'N/A';
    try {
      const formatString = includeTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy";
      return format(parseISO(dateString), formatString, { locale: ptBR });
    } catch (error) {
      return dateString; 
    }
  };

  const downloadImage = async (imageUrl, imageName) => {
    try {
      const { data, error } = await supabase.storage.from('ticket-attachments').download(imageUrl.substring(imageUrl.lastIndexOf('ticket-attachments/') + 'ticket-attachments/'.length));
      if (error) throw error;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(data);
      link.download = imageName || imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast({title: "Download Iniciado", description: `Baixando ${imageName}...`});
    } catch (error) {
      toast({title: "Erro no Download", description: `Não foi possível baixar a imagem: ${error.message}`, variant: "destructive"});
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl bg-gradient-to-br from-card via-background to-card/70 backdrop-blur-xl border-border/50 shadow-2xl rounded-xl">
        <DialogHeader className="pb-4 border-b border-border/30">
          <DialogTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-sky-400 to-emerald-400 flex items-center">
            <MessageSquareWarning className="mr-3 h-8 w-8" /> Detalhes do Chamado
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base">
            Visualizando informações do chamado: <span className="font-semibold text-foreground">{ticket.title}</span>
          </DialogDescription>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
        ) : (
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <InfoItem Icon={User} label="Aberto por" value={ticket.profiles?.full_name || ticket.user?.full_name || 'Desconhecido'} />
                <InfoItem Icon={CalendarDays} label="Data de Criação" value={formatDate(ticket.created_at)} />
                <InfoItem Icon={Tag} label="Módulo" value={ticket.application_module} />
                <InfoItem Icon={AlertTriangle} label="Prioridade">
                  <Badge className={cn(TICKET_PRIORITY_COLORS[ticket.priority], 'text-white text-xs border-0')}>
                    {TICKET_PRIORITY_LABELS[ticket.priority]}
                  </Badge>
                </InfoItem>
                <div className="md:col-span-2">
                  <InfoItem Icon={AlertTriangle} label="Status">
                    {isAdmin && editingStatus ? (
                      <div className="flex items-center gap-2">
                        <select 
                          value={currentStatus} 
                          onChange={(e) => handleStatusChange(e.target.value)}
                          className="block w-full p-2 border border-input rounded-md bg-background text-sm focus:ring-primary focus:border-primary"
                        >
                          {Object.entries(TICKET_STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                        <Button variant="ghost" size="sm" onClick={() => setEditingStatus(false)}>Cancelar</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge className={cn(TICKET_STATUS_COLORS[currentStatus], 'text-white text-xs border-0')}>
                          {TICKET_STATUS_LABELS[currentStatus]}
                        </Badge>
                        {isAdmin && <Button variant="link" size="sm" onClick={() => setEditingStatus(true)} className="p-0 h-auto text-xs">Alterar</Button>}
                      </div>
                    )}
                  </InfoItem>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2">Descrição do Problema</h4>
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {images.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Imagens Anexadas</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {images.map(img => (
                      <div key={img.id} className="relative group border border-border rounded-md overflow-hidden shadow-sm aspect-square">
                        <img  
                          alt={img.file_name || 'Anexo do chamado'}
                          className="w-full h-full object-cover"
                         src="https://images.unsplash.com/photo-1595872018818-97555653a011" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                           <Button variant="ghost" size="icon" onClick={() => downloadImage(img.image_url, img.file_name)} title="Baixar imagem" className="text-white hover:bg-white/20">
                            <Download className="h-5 w-5" />
                          </Button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate text-center" title={img.file_name}>
                          {img.file_name || 'anexo'} ({img.file_size_kb ? `${img.file_size_kb}KB` : ''})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-lg font-semibold text-foreground mb-3">Comentários</h4>
                <div className="space-y-4 mb-4 max-h-60 overflow-y-auto bg-muted/20 p-3 rounded-md">
                  {comments.length === 0 && <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>}
                  {comments.map(comment => (
                    <div key={comment.id} className="flex items-start space-x-3 p-2.5 bg-card/50 rounded-md shadow-sm border border-border/20">
                      <img  
                        alt={comment.profiles?.full_name || 'Usuário'}
                        className="h-8 w-8 rounded-full flex-shrink-0 mt-0.5"
                        src="https://images.unsplash.com/photo-1675806998504-e037bb684870" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-foreground">{comment.profiles?.full_name || 'Usuário Anônimo'}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{comment.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {(isAdmin || ticket.user_id === userProfile?.id || (ticket.company_id && userProfile?.current_company_id === ticket.company_id && userProfile.role_in_company === 'company_technician') ) && (
                  <div className="space-y-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Adicionar um comentário..."
                      rows={3}
                      className="bg-background focus:border-primary"
                    />
                    <Button onClick={handleAddComment} disabled={isSubmittingComment || !newComment.trim()} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                      {isSubmittingComment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Enviar Comentário
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="pt-6 border-t border-border/30">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="bg-background hover:bg-muted">
            <XCircle className="mr-2 h-4 w-4" /> Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const InfoItem = ({ Icon, label, value, children }) => (
  <div className="flex items-start space-x-2">
    <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children || <p className="text-sm font-semibold text-foreground">{value || '-'}</p>}
    </div>
  </div>
);

export default TicketDetailsModal;