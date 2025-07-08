import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Home, Rss } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BlogPostPage = ({ slug: propSlug, isEmbedded = false }) => {
  const params = useParams();
  const slug = propSlug || params.slug;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug) return;

    const fetchPost = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*, profiles(full_name, avatar_url)')
          .eq('slug', slug)
          .eq('status', 'published')
          .single();

        if (error || !data) {
          throw new Error('Post não encontrado ou erro ao buscar.');
        }
        setPost(data);
        document.title = `${data.title} - Super Serviço Blog`;
      } catch (error) {
        console.error('Error fetching post:', error);
        if (!isEmbedded) navigate('/blog');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug, navigate, isEmbedded]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96 bg-transparent">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col justify-center items-center min-h-96 bg-transparent text-center">
        <h1 className="text-3xl font-bold mb-4 text-[#1d3156]">Post não encontrado</h1>
        <p className="text-gray-600 mb-6">O post que você está procurando não existe ou não está mais disponível.</p>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link to="/blog">Voltar para o Blog</Link>
        </Button>
      </div>
    );
  }

  const renderHeader = () => {
    if (isEmbedded) return null;
    return (
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg">
              <Rss className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#1d3156]">Super Serviço Blog</h1>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/blog')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Todos os Posts
            </Button>
            <Button onClick={() => navigate('/')}>
              <Home className="mr-2 h-4 w-4" />
              Início
            </Button>
          </div>
        </div>
      </header>
    );
  };

  return (
    <div className={`${!isEmbedded ? 'bg-white min-h-screen text-[#1d3156]' : 'bg-transparent'}`}>
      {renderHeader()}
      <div className={`${!isEmbedded ? 'container mx-auto px-4 py-8 max-w-4xl' : ''}`}>
        <article className="p-6 rounded-lg bg-white border border-gray-200 shadow-md">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2 leading-tight text-[#1d3156]">{post.title}</h1>
          {post.subtitle && (
            <p className="text-xl md:text-2xl text-gray-500 mb-4">{post.subtitle}</p>
          )}
          {post.show_author && (
            <div className="flex items-center gap-4 mb-6 text-gray-500">
              <div className="flex items-center gap-2">
                <img-replace src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${post.profiles?.full_name}&background=random`} alt={post.profiles?.full_name} className="w-10 h-10 rounded-full object-cover" />
                <span className="font-medium text-gray-700">{post.profiles?.full_name || 'Autor'}</span>
              </div>
              <span>•</span>
              <time dateTime={post.created_at}>
                {format(new Date(post.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </time>
            </div>
          )}

          {post.cover_image_url && (
            <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
              <img-replace src={post.cover_image_url} alt={post.title} className="w-full h-auto object-cover" />
            </div>
          )}

          <div
            className="prose prose-lg max-w-none prose-headings:text-[#1d3156] prose-p:text-gray-700 prose-a:text-blue-600 hover:prose-a:text-blue-700 prose-strong:text-[#1d3156]"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </div>
    </div>
  );
};

export default BlogPostPage;