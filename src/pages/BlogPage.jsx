import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Wrench } from 'lucide-react';
import { getYear, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BlogFooter from '@/components/layout/BlogFooter';

const BlogPostPageContent = React.lazy(() => import('./BlogPostPage'));

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [loadingArchive, setLoadingArchive] = useState(true);
  const navigate = useNavigate();
  const { slug: activeSlug } = useParams();

  useEffect(() => {
    const fetchArchive = async () => {
      setLoadingArchive(true);
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, title, slug, created_at, updated_at, profiles(full_name)')
          .eq('status', 'published')
          .order('updated_at', { ascending: false });

        if (error) throw error;
        
        const postData = data || [];
        setPosts(postData);

        if (!activeSlug && postData.length > 0) {
          navigate(`/blog/${postData[0].slug}`, { replace: true });
        }
      } catch (error) {
        console.error('Error fetching blog archive:', error);
      } finally {
        setLoadingArchive(false);
      }
    };

    fetchArchive();
  }, []); 

  useEffect(() => {
    if (!activeSlug && !loadingArchive && posts.length > 0) {
      navigate(`/blog/${posts[0].slug}`, { replace: true });
    }
  }, [activeSlug, loadingArchive, posts, navigate]);

  const groupedPosts = useMemo(() => {
    return posts.reduce((acc, post) => {
      const year = getYear(new Date(post.created_at));
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(post);
      return acc;
    }, {});
  }, [posts]);

  const sortedYears = useMemo(() => Object.keys(groupedPosts).sort((a, b) => b - a), [groupedPosts]);

  return (
    <div className="bg-white min-h-screen text-[#1d3156] flex flex-col">
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#1d3156]">Super Serviço</h1>
          </Link>
          <nav className="flex items-center space-x-2 sm:space-x-4">
            <span className="text-lg font-semibold text-gray-500 hidden sm:inline">Blog</span>
             <div className="flex items-center space-x-1 sm:space-x-2">
                <Link to="/login">
                  <Button variant="outline" className="bg-white text-[#1d3156] border-blue-600 hover:bg-gray-100 text-xs sm:text-sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white text-xs sm:text-sm">Cadastre-se</Button>
                </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-8 lg:col-span-9">
                    {activeSlug ? (
                        <Suspense fallback={<div className="flex justify-center items-center h-full min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}>
                            <BlogPostPageContent slug={activeSlug} isEmbedded={true} />
                        </Suspense>
                    ) : (
                        <div className="flex justify-center items-center h-[calc(100vh-12rem)]">
                            {loadingArchive ? <Loader2 className="h-12 w-12 animate-spin text-blue-600" /> : <p className="text-gray-600">Selecione uma postagem para ler.</p>}
                        </div>
                    )}
                </div>

                <aside className="md:col-span-4 lg:col-span-3">
                    <div className="sticky top-24 p-4 rounded-lg bg-gray-50 border border-gray-200">
                        <h2 className="text-lg font-semibold mb-4 text-[#1d3156]">Arquivo de Postagens</h2>
                          {loadingArchive ? (
                            <div className="flex justify-center items-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                            </div>
                          ) : (
                            <Accordion type="multiple" defaultValue={sortedYears.slice(0, 1)} className="w-full">
                                {sortedYears.map((year) => (
                                    <AccordionItem key={year} value={year} className="border-b-gray-200">
                                        <AccordionTrigger className="text-base font-medium text-[#1d3156] hover:text-blue-600">{year}</AccordionTrigger>
                                        <AccordionContent>
                                            <ul className="space-y-2 pl-2">
                                                {groupedPosts[year].map((post) => (
                                                    <li key={post.id}>
                                                        <Link
                                                            to={`/blog/${post.slug}`}
                                                            className={`block p-2 rounded-md text-sm transition-colors ${
                                                                activeSlug === post.slug
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'text-gray-700 hover:bg-gray-100 hover:text-[#1d3156]'
                                                            }`}
                                                        >
                                                            <span className={`${activeSlug === post.slug ? 'font-semibold' : 'font-medium'}`}>{post.title}</span>
                                                            <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                                                                <span className="truncate pr-2">{post.profiles?.full_name || 'Autor'}</span>
                                                                <time dateTime={post.updated_at}>
                                                                  {format(new Date(post.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                                                                </time>
                                                            </div>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        )}
                    </div>
                </aside>
            </div>
        </div>
      </main>
      
      <BlogFooter />
    </div>
  );
};

export default BlogPage;