
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import ReactQuill from 'react-quill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Switch } from '@/components/ui/switch';
import { logAction } from '@/services/logService';

const BlogPostEditor = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const quillRef = useRef(null);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');
  const [slug, setSlug] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [showAuthor, setShowAuthor] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [originalSlug, setOriginalSlug] = useState('');

  const isEditing = useMemo(() => !!postId && postId !== 'new', [postId]);

  const slugify = (text) => {
    if (!text) return '';
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  };

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      const fetchPost = async () => {
        try {
          const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('id', postId)
            .single();

          if (error) throw error;

          setTitle(data.title);
          setSubtitle(data.subtitle || '');
          setContent(data.content);
          setStatus(data.status);
          setSlug(data.slug);
          setOriginalSlug(data.slug);
          setCoverImageUrl(data.cover_image_url || '');
          setShowAuthor(data.show_author);
        } catch (error) {
          toast({ title: 'Erro ao carregar postagem', description: error.message, variant: 'destructive' });
          navigate('/app/settings/blog-management');
        } finally {
          setLoading(false);
        }
      };
      fetchPost();
    }
  }, [isEditing, postId, navigate]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!isEditing || slug === originalSlug) {
        setSlug(slugify(newTitle));
    }
  };

  const imageHandler = useCallback(() => {
    if (!userProfile?.id) {
      toast({ title: "Erro de Autenticação", description: "Usuário não identificado para fazer upload.", variant: "destructive" });
      return;
    }
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        toast({ title: "Upload iniciado...", description: "Aguarde enquanto a imagem é enviada." });
        const filePath = `public/${userProfile.id}/${Date.now()}_${file.name}`;
        
        await logAction({ tag: 'BLOG_IMAGE_UPLOAD_ATTEMPT', message: `Tentativa de upload de imagem para o blog: ${file.name}`, meta: { filePath }, userId: userProfile.id });
        const { error: uploadError } = await supabase.storage
          .from('blog_images')
          .upload(filePath, file);

        if (uploadError) {
          toast({ title: "Erro no upload da imagem", description: uploadError.message, variant: "destructive" });
          await logAction({ level: 'ERROR', tag: 'BLOG_IMAGE_UPLOAD_ERROR', message: 'Falha no upload de imagem do blog.', error: uploadError, userId: userProfile.id });
          return;
        }

        const { data: { publicUrl } } = supabase.storage.from('blog_images').getPublicUrl(filePath);

        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', publicUrl);
        toast({ title: "Sucesso!", description: "Imagem inserida no editor." });
        await logAction({ tag: 'BLOG_IMAGE_UPLOAD_SUCCESS', message: 'Imagem do blog inserida com sucesso.', meta: { publicUrl }, userId: userProfile.id });
      }
    };
  }, [userProfile]);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{'list': 'ordered'}, {'list': 'bullet'}],
        ['link', 'image', 'blockquote', 'code-block'],
        ['clean']
      ],
      handlers: {
        image: imageHandler,
      }
    },
  }), [imageHandler]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) {
      toast({ title: 'Campos obrigatórios', description: 'Título e conteúdo são necessários.', variant: 'destructive' });
      return;
    }
    if (!userProfile?.id) {
      toast({ title: "Erro de Autenticação", description: "Não é possível salvar a postagem sem um autor.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const logTag = isEditing ? 'BLOG_POST_UPDATE' : 'BLOG_POST_CREATE';
    await logAction({ tag: `${logTag}_ATTEMPT`, message: `Tentativa de salvar post: "${title}"`, meta: { isEditing }, userId: userProfile.id });

    let finalSlug = slugify(slug.trim() || title.trim());
    if (!finalSlug) {
        toast({ title: 'URL Inválida', description: 'A URL (slug) não pode estar vazia.', variant: 'destructive' });
        setIsSaving(false);
        return;
    }

    const { data: existingPost, error: slugError } = await supabase
      .rpc('check_slug_exists', {
        p_slug: finalSlug,
        p_post_id: isEditing ? postId : null
      });

    if (slugError) {
        toast({ title: 'Erro ao verificar URL', description: slugError.message, variant: 'destructive' });
        await logAction({ level: 'ERROR', tag: 'BLOG_SLUG_CHECK_ERROR', message: `Erro ao verificar slug: ${finalSlug}`, error: slugError, userId: userProfile.id });
        setIsSaving(false);
        return;
    }

    if (existingPost) {
        finalSlug = `${finalSlug}-${Date.now().toString(36).slice(-4)}`;
        toast({ title: 'URL Ajustada', description: 'Uma URL única foi gerada para esta postagem para evitar duplicatas.', variant: 'default' });
    }

    const postData = {
      title,
      subtitle,
      content,
      status,
      slug: finalSlug,
      author_id: userProfile.id,
      cover_image_url: coverImageUrl || null,
      show_author: showAuthor,
      updated_at: new Date().toISOString(),
    };

    try {
      let savedPost;
      if (isEditing) {
        const { data, error } = await supabase.from('blog_posts').update(postData).eq('id', postId).select().single();
        if (error) throw error;
        savedPost = data;
      } else {
        const { data, error } = await supabase.from('blog_posts').insert([{ ...postData, id: uuidv4() }]).select().single();
        if (error) throw error;
        savedPost = data;
      }

      await logAction({ tag: `${logTag}_SUCCESS`, message: `Post "${savedPost.title}" salvo com sucesso.`, meta: { postId: savedPost.id, slug: savedPost.slug }, userId: userProfile.id });
      toast({ title: 'Sucesso!', description: `Postagem ${isEditing ? 'atualizada' : 'criada'} com sucesso.` });
      navigate('/app/settings/blog-management');
    } catch (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      await logAction({ level: 'ERROR', tag: `${logTag}_ERROR`, message: `Falha ao salvar post: "${title}"`, error, userId: userProfile.id });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button type="button" variant="outline" size="icon" onClick={() => navigate('/app/settings/blog-management')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-2xl text-foreground">{isEditing ? 'Editar Postagem' : 'Nova Postagem'}</CardTitle>
                <CardDescription>Preencha os detalhes e crie seu conteúdo.</CardDescription>
              </div>
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar Postagem
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input id="title" value={title} onChange={handleTitleChange} placeholder="O título da sua postagem" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtítulo</Label>
                    <Input id="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Um subtítulo cativante para o post" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="slug">URL (slug)</Label>
                    <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
                    <p className="text-xs text-muted-foreground">A URL é gerada a partir do título, mas pode ser ajustada.</p>
                </div>
            </div>
            <div className="md:col-span-1 space-y-2">
                 <Label htmlFor="status">Status</Label>
                 <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>

           <div className="space-y-2">
            <Label htmlFor="cover-image">URL da Imagem de Capa (Opcional)</Label>
            <Input id="cover-image" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://exemplo.com/imagem.jpg" />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="show-author" checked={showAuthor} onCheckedChange={setShowAuthor} />
            <Label htmlFor="show-author">Mostrar autor na postagem</Label>
          </div>

          <div className="space-y-2">
            <Label>Conteúdo</Label>
            <div className="bg-background rounded-md border">
              <ReactQuill ref={quillRef} theme="snow" value={content} onChange={setContent} modules={modules} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Postagem
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default BlogPostEditor;
