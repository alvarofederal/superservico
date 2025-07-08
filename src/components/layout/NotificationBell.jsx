
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NotificationItem = ({ notification, onNotificationClick }) => {
  return (
    <div 
      className={`p-3 hover:bg-muted/50 cursor-pointer border-b border-border/30 last:border-b-0 ${notification.is_read ? 'opacity-60' : ''}`}
      onClick={() => onNotificationClick(notification)}
    >
      <p className={`text-sm font-medium ${notification.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
        {notification.message}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
      </p>
    </div>
  );
};

const NotificationBell = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const isMountedRef = useRef(true);

  const fetchNotifications = useCallback(async () => {
    if (!userProfile?.id || !isMountedRef.current) return;
    setIsLoading(true);
    try {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(20);

      if (userProfile.role === 'admin') {
        query = query.eq('target_admin_role', 'admin');
      } else {
        query = query.eq('user_id', userProfile.id);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      
      if (isMountedRef.current) {
        setNotifications(data || []);
        const currentUnread = (data || []).filter(n => !n.is_read).length;
        setUnreadCount(currentUnread);
      }

    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      if (isMountedRef.current) {
        toast({ title: "Erro ao buscar notificações", description: error.message, variant: "destructive" });
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userProfile?.id, userProfile?.role]);

  useEffect(() => {
    isMountedRef.current = true;
    let notificationChannel = null;

    if (userProfile?.id) {
      fetchNotifications();

      const channelName = `notifications_user_${userProfile.id}`;
      notificationChannel = supabase.channel(channelName);
      
      notificationChannel.on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications', 
          filter: userProfile.role === 'admin' ? `target_admin_role=eq.admin` : `user_id=eq.${userProfile.id}`
      }, (payload) => {
          if (!isMountedRef.current) return;
          setNotifications(prev => [payload.new, ...prev].slice(0, 20));
          if (!payload.new.is_read) {
            setUnreadCount(prev => prev + 1);
          }
          toast({ title: "Nova Notificação!", description: payload.new.message.substring(0, 50) + '...', duration: 3000 });
      })
      .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: userProfile.role === 'admin' ? `target_admin_role=eq.admin` : `user_id=eq.${userProfile.id}`
      }, (payload) => {
           if (!isMountedRef.current) return;
           setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
           const currentUnread = notifications.map(n => n.id === payload.new.id ? payload.new : n).filter(n => !n.is_read).length;
           setUnreadCount(currentUnread);
      })
      .subscribe((status, err) => {
          if (!isMountedRef.current && notificationChannel) {
              supabase.removeChannel(notificationChannel).catch(e => console.warn("Channel cleanup on unmount before subscribe:", e.message));
              return;
          }
          if (status === 'SUBSCRIBED') {
            console.log('Conectado ao canal de notificações.');
          }
          if (status === 'CHANNEL_ERROR' || err) {
            console.error('Erro no canal de notificações:', err);
          }
      });
    }

    return () => {
      isMountedRef.current = false;
      if (notificationChannel) {
        supabase.removeChannel(notificationChannel)
          .catch(error => console.warn('Non-critical error while removing channel:', error.message));
      }
    };
  }, [userProfile?.id, fetchNotifications]);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read && isMountedRef.current) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notification.id);
        if (error) throw error;
        
        if (isMountedRef.current) {
          setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error);
        if (isMountedRef.current) {
          toast({ title: "Erro", description: "Não foi possível marcar a notificação como lida.", variant: "destructive" });
        }
      }
    }
    if (notification.link_to) {
      navigate(notification.link_to);
    }
    setIsPanelOpen(false); 
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0 || !isMountedRef.current) return;
    try {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;

        let query = supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
        if (userProfile.role === 'admin') {
            query = query.eq('target_admin_role', 'admin');
        } else {
            query = query.eq('user_id', userProfile.id);
        }
        
        const { error } = await query;
        if (error) throw error;

        if (isMountedRef.current) {
          setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
          setUnreadCount(0);
          toast({ title: "Notificações Marcadas", description: "Todas as notificações foram marcadas como lidas."});
        }
    } catch (error) {
        console.error("Erro ao marcar todas como lidas:", error);
        if (isMountedRef.current) {
          toast({ title: "Erro", description: "Não foi possível marcar todas as notificações como lidas.", variant: "destructive" });
        }
    }
  }

  return (
    <Popover open={isPanelOpen} onOpenChange={setIsPanelOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-foreground hover:bg-muted/80">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 border-border shadow-2xl bg-card" align="end">
        <div className="p-4 border-b border-border/30 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-foreground">Notificações</h3>
          {unreadCount > 0 && (
             <Button variant="link" size="sm" onClick={markAllAsRead} className="text-primary p-0 h-auto">Marcar todas como lidas</Button>
          )}
        </div>
        {isLoading ? (
          <div className="p-4 flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground text-center">Nenhuma notificação nova.</p>
        ) : (
          <ScrollArea className="h-[300px]">
            {notifications.map(notification => (
              <NotificationItem key={notification.id} notification={notification} onNotificationClick={handleNotificationClick} />
            ))}
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
