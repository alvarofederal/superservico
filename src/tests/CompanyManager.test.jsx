import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CompanyManager from '@/components/CompanyManager';
import { useAuth }
from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/lib/supabaseClient';

vi.mock('@/hooks/useAuth');
vi.mock('@/lib/supabaseClient');
vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({ toasts: [], toast: vi.fn(), dismiss: vi.fn() })
}));

const mockUserProfileBase = {
  id: 'user-owner-123',
  full_name: 'Proprietário Teste',
  role: 'admin',
  current_company_id: null,
};

const mockInvitedUserProfile = {
  id: 'user-invited-456',
  full_name: 'Usuário Convidado',
  email: 'invite@example.com',
  role: 'technician',
};

const mockRefreshAuthData = vi.fn();
const mockSelectCompany = vi.fn();

describe('CompanyManager', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    useAuth.mockReturnValue({
      userProfile: mockUserProfileBase,
      userCompanies: [],
      selectCompany: mockSelectCompany,
      authState: 'AUTHENTICATED',
    });

    supabase.from = vi.fn((tableName) => {
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        rpc: vi.fn(),
      };

      if (tableName === 'companies') {
        mockChain.insert.mockResolvedValue({
          data: [{ id: 'new-company-id', name: 'Nova Empresa Teste', owner_id: mockUserProfileBase.id }],
          error: null,
        });
        mockChain.select().single.mockResolvedValue({
          data: { id: 'new-company-id', name: 'Nova Empresa Teste', owner_id: mockUserProfileBase.id },
          error: null
        });
      } else if (tableName === 'company_users') {
        mockChain.insert.mockResolvedValue({ error: null });
        mockChain.delete.mockResolvedValue({ error: null });
      } else if (tableName === 'profiles') {
        mockChain.select().eq.mockImplementation((column, value) => {
          if (column === 'email' && value === 'invite@example.com') {
            return { single: vi.fn().mockResolvedValue({ data: mockInvitedUserProfile, error: null }) };
          }
          return { single: vi.fn().mockResolvedValue({ data: null, error: { message: 'User not found' } }) };
        });
      }
      return mockChain;
    });
    
    supabase.rpc = vi.fn((fnName, params) => {
        if (fnName === 'get_company_members_details') {
            if (params.company_id_param === 'company-1') {
                 return Promise.resolve({ data: [
                    { user_id: mockUserProfileBase.id, user_full_name: 'Proprietário Teste', user_email: 'owner@test.com', user_avatar_url: null, user_role_in_company: 'company_admin' },
                    { user_id: 'user-member-789', user_full_name: 'Membro Teste', user_email: 'member@test.com', user_avatar_url: null, user_role_in_company: 'company_technician' }
                 ], error: null });
            }
            return Promise.resolve({ data: [], error: null });
        }
        return Promise.resolve({ data: null, error: { message: 'RPC not found'} });
    });


    render(
      <>
        <CompanyManager refreshAuthData={mockRefreshAuthData} />
        <Toaster />
      </>
    );
  });

  it('renders correctly and shows create company prompt if no companies and no current company', () => {
    expect(screen.getByText('Gerenciamento de Empresas')).toBeInTheDocument();
    expect(screen.getByText('Comece Criando Sua Empresa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Criar Minha Primeira Empresa/i })).toBeInTheDocument();
  });

  it('opens create company dialog when "Nova Empresa" is clicked', async () => {
    fireEvent.click(screen.getByRole('button', { name: /Nova Empresa/i }));
    await waitFor(() => {
      expect(screen.getByText('Criar Nova Empresa')).toBeInTheDocument();
    });
  });

  it('creates a new company successfully', async () => {
    fireEvent.click(screen.getByRole('button', { name: /Nova Empresa/i }));
    await waitFor(() => screen.getByText('Criar Nova Empresa'));

    fireEvent.change(screen.getByLabelText('Nome da Empresa'), { target: { value: 'Nova Empresa Teste' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Empresa' }));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('companies');
      expect(supabase.from('companies').insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Nova Empresa Teste', owner_id: mockUserProfileBase.id })
        ])
      );
      expect(mockRefreshAuthData).toHaveBeenCalled();
      expect(mockSelectCompany).toHaveBeenCalledWith('new-company-id');
      expect(screen.getByText('Sucesso!')).toBeInTheDocument();
    });
  });

  it('shows company list and details when companies exist and one is selected', async () => {
    const companiesWithOne = [{ id: 'company-1', name: 'Minha Empresa Ativa', owner_id: mockUserProfileBase.id, role_in_company: 'company_admin' }];
    useAuth.mockReturnValue({
      userProfile: { ...mockUserProfileBase, current_company_id: 'company-1' },
      userCompanies: companiesWithOne,
      selectCompany: mockSelectCompany,
      authState: 'AUTHENTICATED',
    });

    render(
      <>
        <CompanyManager refreshAuthData={mockRefreshAuthData} />
        <Toaster />
      </>
    );

    await waitFor(() => {
      expect(screen.getByText('Minha Empresa Ativa')).toBeInTheDocument();
      expect(screen.getByText('Gerenciar: Minha Empresa Ativa')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Convidar Membro/i })).toBeInTheDocument();
    });
    
    await waitFor(() => {
        expect(screen.getByText('Proprietário Teste')).toBeInTheDocument();
        expect(screen.getByText('Membro Teste')).toBeInTheDocument();
    });
  });

  it('opens invite user dialog when "Convidar Membro" is clicked', async () => {
    useAuth.mockReturnValue({
      userProfile: { ...mockUserProfileBase, current_company_id: 'company-1' },
      userCompanies: [{ id: 'company-1', name: 'Minha Empresa Ativa', owner_id: mockUserProfileBase.id, role_in_company: 'company_admin' }],
      selectCompany: mockSelectCompany,
      authState: 'AUTHENTICATED',
    });
    
    render(
      <>
        <CompanyManager refreshAuthData={mockRefreshAuthData} />
        <Toaster />
      </>
    );

    await waitFor(() => screen.getByRole('button', { name: /Convidar Membro/i }));
    fireEvent.click(screen.getByRole('button', { name: /Convidar Membro/i }));

    await waitFor(() => {
      expect(screen.getByText('Convidar Novo Membro para Minha Empresa Ativa')).toBeInTheDocument();
    });
  });

  it('invites a user successfully', async () => {
    useAuth.mockReturnValue({
      userProfile: { ...mockUserProfileBase, current_company_id: 'company-1' },
      userCompanies: [{ id: 'company-1', name: 'Minha Empresa Ativa', owner_id: mockUserProfileBase.id, role_in_company: 'company_admin' }],
      selectCompany: mockSelectCompany,
      authState: 'AUTHENTICATED',
    });

    render(
      <>
        <CompanyManager refreshAuthData={mockRefreshAuthData} />
        <Toaster />
      </>
    );

    await waitFor(() => screen.getByRole('button', { name: /Convidar Membro/i }));
    fireEvent.click(screen.getByRole('button', { name: /Convidar Membro/i }));
    await waitFor(() => screen.getByText('Convidar Novo Membro para Minha Empresa Ativa'));

    fireEvent.change(screen.getByLabelText('Email do Usuário'), { target: { value: 'invite@example.com' } });
    
    const roleSelect = screen.getByRole('combobox');
    fireEvent.mouseDown(roleSelect);
    await waitFor(() => screen.getByText('Técnico da Empresa'));
    fireEvent.click(screen.getByText('Técnico da Empresa'));

    fireEvent.click(screen.getByRole('button', { name: 'Convidar Usuário' }));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(supabase.from('profiles').select().eq).toHaveBeenCalledWith('email', 'invite@example.com');
      
      expect(supabase.from).toHaveBeenCalledWith('company_users');
      expect(supabase.from('company_users').insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ company_id: 'company-1', user_id: mockInvitedUserProfile.id, role_in_company: 'company_technician' })
        ])
      );
      expect(screen.getByText('Sucesso!')).toBeInTheDocument();
    });
  });

  it('handles removing a user from company', async () => {
    const companyId = 'company-1';
    const userIdToRemove = 'user-member-789';
    useAuth.mockReturnValue({
      userProfile: { ...mockUserProfileBase, current_company_id: companyId },
      userCompanies: [{ id: companyId, name: 'Minha Empresa Ativa', owner_id: mockUserProfileBase.id, role_in_company: 'company_admin' }],
      selectCompany: mockSelectCompany,
      authState: 'AUTHENTICATED',
    });

    render(
      <>
        <CompanyManager refreshAuthData={mockRefreshAuthData} />
        <Toaster />
      </>
    );

    await waitFor(() => {
      expect(screen.getByText('Membro Teste')).toBeInTheDocument();
    });
    
    const removeButtons = screen.getAllByRole('button', { name: /confirmar remoção/i, hidden: true });
    
    let targetRemoveButton;
    for (const button of removeButtons) {
        const row = button.closest('tr');
        if (row && row.textContent.includes('Membro Teste')) {
            targetRemoveButton = button;
            break;
        }
    }
    expect(targetRemoveButton).toBeDefined();

    await act(async () => {
      fireEvent.click(targetRemoveButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Tem certeza que deseja remover Membro Teste da empresa Minha Empresa Ativa?')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remover' }));
    });

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('company_users');
      expect(supabase.from('company_users').delete).toHaveBeenCalled();
      expect(supabase.from('company_users').delete().eq).toHaveBeenCalledWith('user_id', userIdToRemove);
      expect(supabase.from('company_users').delete().eq().eq).toHaveBeenCalledWith('company_id', companyId);
      expect(screen.getByText('Usuário Removido')).toBeInTheDocument();
    });
  });

});