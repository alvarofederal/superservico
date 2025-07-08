
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button, buttonVariants } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { PlusCircle, MoreHorizontal, Edit, Trash2, Loader2, UploadCloud } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { logAction } from '@/services/logService';

const BlogManager = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, created_at, status, profiles(full_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      toast({
        title: 'Erro ao carregar postagens',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePublishPost = async (postToPublish) => {
    await logAction({ tag: 'BLOG_POST_PUBLISH_ATTEMPT', message: `Tentativa de publicar post: "${postToPublish.title}"`, meta: { postId: postToPublish.id }, userId: userProfile?.id });
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('id', postToPublish.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Postagem publicada!',
        description: `"${data.title}" agora está visível publicamente.`,
      });
      await logAction({ tag: 'BLOG_POST_PUBLISH_SUCCESS', message: `Post "${data.title}" publicado.`, meta: { postId: data.id }, userId: userProfile?.id });
      setPosts(posts.map((p) => (p.id === data.id ? { ...p, status: data.status } : p)));
    } catch (error) {
      toast({
        title: 'Erro ao publicar postagem',
        description: error.message,
        variant: 'destructive',
      });
      await logAction({ level: 'ERROR', tag: 'BLOG_POST_PUBLISH_ERROR', message: `Falha ao publicar post: "${postToPublish.title}"`, error, meta: { postId: postToPublish.id }, userId: userProfile?.id });
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    await logAction({ tag: 'BLOG_POST_DELETE_ATTEMPT', message: `Tentativa de excluir post: "${postToDelete.title}"`, meta: { postId: postToDelete.id }, userId: userProfile?.id });

    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', postToDelete.id);
      if (error) throw error;

      toast({
        title: 'Postagem excluída!',
        description: 'A postagem foi removida com sucesso.',
      });
      await logAction({ tag: 'BLOG_POST_DELETE_SUCCESS', message: `Post "${postToDelete.title}" excluído.`, meta: { postId: postToDelete.id }, userId: userProfile?.id });
      setPosts(posts.filter((p) => p.id !== postToDelete.id));
    } catch (error) {
      toast({
        title: 'Erro ao excluir postagem',
        description: error.message,
        variant: 'destructive',
      });
       await logAction({ level: 'ERROR', tag: 'BLOG_POST_DELETE_ERROR', message: `Falha ao excluir post: "${postToDelete.title}"`, error, meta: { postId: postToDelete.id }, userId: userProfile?.id });
    } finally {
      setShowDeleteDialog(false);
      setPostToDelete(null);
    }
  };

  const confirmDelete = (post) => {
    setPostToDelete(post);
    setShowDeleteDialog(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Gerenciamento de Blog
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Crie, edite e gerencie as postagens do seu blog.
          </p>
        </div>
        <Button onClick={() => navigate('/app/settings/blog-editor/new')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Postagem
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card border rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>{post.profiles?.full_name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                          {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(post.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {post.status === 'draft' && (
                              <>
                                <DropdownMenuItem onClick={() => handlePublishPost(post)}>
                                  <UploadCloud className="mr-2 h-4 w-4" />
                                  Publicar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onClick={() => navigate(`/app/settings/blog-editor/${post.id}`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => confirmDelete(post)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="5" className="h-24 text-center">
                      Nenhuma postagem encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a postagem "{postToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPostToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default BlogManager;
