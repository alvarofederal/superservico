import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import BlogPostEditor from '@/components/blog/BlogPostEditor';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { Toaster } from '@/components/ui/toaster';

vi.mock('@/hooks/useAuth');
vi.mock('@/lib/supabaseClient');
vi.mock('react-quill', () => ({
  __esModule: true,
  default: ({ value, onChange }) => (
    <textarea data-testid="react-quill-mock" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));
vi.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: vi.fn(),
  };
});

const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockUserProfile = { id: 'user-123', full_name: 'Admin User' };

describe('BlogPostEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ userProfile: mockUserProfile });

    const fromMock = vi.fn().mockReturnThis();
    const selectMock = vi.fn().mockReturnThis();
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockResolvedValue({ error: null });
    const eqMock = vi.fn().mockReturnThis();
    const singleMock = vi.fn();

    supabase.from = fromMock;
    fromMock.select = selectMock;
    fromMock.insert = insertMock;
    fromMock.update = updateMock;
    selectMock.eq = eqMock;
    eqMock.single = singleMock;
  });

  const renderComponent = (postId) => {
    const { useParams } = require('react-router-dom');
    useParams.mockReturnValue({ postId });

    return render(
      <MemoryRouter initialEntries={[`/app/settings/blog-editor/${postId}`]}>
        <Routes>
          <Route path="/app/settings/blog-editor/:postId" element={<BlogPostEditor />} />
        </Routes>
        <Toaster />
      </MemoryRouter>
    );
  };

  it('deve renderizar para criar uma nova postagem', () => {
    renderComponent('new');
    expect(screen.getByText('Nova Postagem')).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toBeInTheDocument();
    expect(screen.getByTestId('react-quill-mock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salvar Postagem/i })).toBeInTheDocument();
  });

  it('deve criar uma nova postagem com sucesso', async () => {
    supabase.from('blog_posts').select().eq().single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    renderComponent('new');

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Meu Novo Post de Teste' } });
    fireEvent.change(screen.getByTestId('react-quill-mock'), { target: { value: '<p>Conteúdo do post.</p>' } });
    
    const saveButton = screen.getAllByRole('button', { name: /Salvar Postagem/i })[0];
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(supabase.from('blog_posts').insert).toHaveBeenCalledTimes(1);
      const insertedData = supabase.from('blog_posts').insert.mock.calls[0][0][0];
      expect(insertedData).toEqual(expect.objectContaining({
        title: 'Meu Novo Post de Teste',
        content: '<p>Conteúdo do post.</p>',
        status: 'draft',
        slug: 'meu-novo-post-de-teste',
        author_id: mockUserProfile.id,
        id: 'mock-uuid',
      }));
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Sucesso!' }));
      expect(mockNavigate).toHaveBeenCalledWith('/app/settings/blog-management');
    });
  });
  
  it('deve gerar um slug único se o slug inicial já existir', async () => {
    supabase.from('blog_posts').select().eq().single.mockResolvedValueOnce({ data: {id: 'some-other-id'}, error: null });
    renderComponent('new');

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Post com Título Repetido' } });
    fireEvent.change(screen.getByTestId('react-quill-mock'), { target: { value: '<p>Conteúdo.</p>' } });
    
    const saveButton = screen.getAllByRole('button', { name: /Salvar Postagem/i })[0];
    fireEvent.click(saveButton);

    await waitFor(() => {
        expect(supabase.from('blog_posts').insert).toHaveBeenCalledTimes(1);
        const insertedData = supabase.from('blog_posts').insert.mock.calls[0][0][0];
        expect(insertedData.slug).toMatch(/^post-com-titulo-repetido-[a-z0-9]{4}$/);
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'URL Ajustada' }));
    });
  });

  it('deve carregar os dados de uma postagem existente para edição', async () => {
    const existingPost = {
      id: 'post-456',
      title: 'Post para Editar',
      content: '<p>Conteúdo original.</p>',
      status: 'published',
      slug: 'post-para-editar',
      cover_image_url: 'http://example.com/image.png'
    };
    supabase.from('blog_posts').select().eq().single.mockResolvedValue({ data: existingPost, error: null });

    renderComponent('post-456');

    await waitFor(() => {
      expect(screen.getByText('Editar Postagem')).toBeInTheDocument();
      expect(screen.getByLabelText('Título')).toHaveValue(existingPost.title);
      expect(screen.getByTestId('react-quill-mock')).toHaveValue(existingPost.content);
      expect(screen.getByLabelText('URL da Imagem de Capa (Opcional)')).toHaveValue(existingPost.cover_image_url);
      expect(screen.getByText('Publicado')).toBeInTheDocument();
    });
  });

  it('deve atualizar uma postagem existente com sucesso', async () => {
     const existingPost = { id: 'post-456', title: 'Post Antigo', content: '<p>Original</p>', slug: 'post-antigo' };
     supabase.from('blog_posts').select().eq().single.mockResolvedValue({ data: existingPost, error: null });

     renderComponent('post-456');

     await waitFor(() => {
         expect(screen.getByLabelText('Título')).toHaveValue('Post Antigo');
     });

     fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Post com Título Atualizado' } });
     fireEvent.change(screen.getByTestId('react-quill-mock'), { target: { value: '<p>Conteúdo atualizado.</p>' } });

     const saveButton = screen.getAllByRole('button', { name: /Salvar Postagem/i })[0];
     fireEvent.click(saveButton);

     await waitFor(() => {
        expect(supabase.from('blog_posts').update).toHaveBeenCalledTimes(1);
        const updateCall = supabase.from('blog_posts').update.mock.calls[0][0];
        expect(updateCall).toEqual(expect.objectContaining({
            title: 'Post com Título Atualizado',
            content: '<p>Conteúdo atualizado.</p>'
        }));
        expect(supabase.from('blog_posts').update().eq).toHaveBeenCalledWith('id', 'post-456');
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ description: 'Postagem atualizada com sucesso.' }));
        expect(mockNavigate).toHaveBeenCalledWith('/app/settings/blog-management');
     });
  });
});