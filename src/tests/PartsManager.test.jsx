import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PartsManager from '@/components/PartsManager';
import { Toaster } from '@/components/ui/toaster'; 
import { supabase } from '@/lib/supabaseClient'; 

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn() 
    }))
  }
}));

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({ toasts: [], toast: vi.fn(), dismiss: vi.fn() }) 
}));


const mockSetGlobalParts = vi.fn();
const initialMockParts = [
  { id: '1', name: 'Test Part 1', partNumber: 'TP001', category: 'Filtros', quantity: 10, minQuantity: 5, unitCost: 100, supplier: 'Supplier A', location: 'Loc A', description: 'Desc A', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

describe('PartsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset supabase mock implementation for each test
    supabase.from('parts').single.mockImplementation((args) => {
      if (supabase.from('parts').insert().select().single.mock.calls.length > 0) {
        return Promise.resolve({ data: { id: 'mock-new-id', ...args, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, error: null });
      }
      if (supabase.from('parts').update().select().single.mock.calls.length > 0) {
        return Promise.resolve({ data: { id: '1', ...args, updatedAt: new Date().toISOString() }, error: null });
      }
      return Promise.resolve({ data: null, error: { message: 'Default mock error or no data' } });
    });
     supabase.from('parts').delete().eq().mockResolvedValue({ error: null });


    render(
      <>
        <PartsManager parts={JSON.parse(JSON.stringify(initialMockParts))} setParts={mockSetGlobalParts} />
        <Toaster />
      </>
    );
  });

  afterEach(() => {
    // Ensure all mocks are reset if they were changed during a test
     supabase.from.mockClear();
     supabase.from('parts').insert.mockClear();
     supabase.from('parts').update.mockClear();
     supabase.from('parts').delete.mockClear();
     supabase.from('parts').select.mockClear();
     supabase.from('parts').single.mockClear();
     supabase.from('parts').eq.mockClear();
  });

  it('renders correctly with initial parts', () => {
    expect(screen.getByText('Gestão de Peças')).toBeInTheDocument();
    expect(screen.getByText('Test Part 1')).toBeInTheDocument();
  });

  it('opens dialog to add a new part', async () => {
    fireEvent.click(screen.getByText('Nova Peça'));
    await waitFor(() => {
      expect(screen.getByText('Cadastrar Nova Peça')).toBeInTheDocument();
    });
  });

  it('adds a new part successfully', async () => {
    const newPartData = { id: 'gen-id-2', name: 'New Part From Test', partNumber: 'P002-Test', category: 'Rolamentos', quantity: 20, minQuantity: 10, unitCost: 50, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    supabase.from('parts').insert().select().single.mockResolvedValueOnce({ data: newPartData, error: null });

    fireEvent.click(screen.getByText('Nova Peça'));
    await waitFor(() => {
      expect(screen.getByText('Cadastrar Nova Peça')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Nome da Peça *'), { target: { value: newPartData.name } });
    fireEvent.change(screen.getByLabelText('Código da Peça *'), { target: { value: newPartData.partNumber } });
    // Simulate selecting a category if your Select component supports it or ensure default works
    // For example, if the default is 'Filtros' and you want 'Rolamentos', you'd need to interact with Select
    // For now, we'll assume the default 'Filtros' is picked up if not changed, or test with it
    
    // Manually select a different category to ensure it's passed
    const categorySelect = screen.getByRole('combobox', { name: /categoria \*/i });
    fireEvent.mouseDown(categorySelect);
    await waitFor(() => {
      // This assumes 'Rolamentos' is an option. Adjust selector as needed.
      fireEvent.click(screen.getByText('Rolamentos', { selector: '[role="option"]' })); 
    });
    
    fireEvent.change(screen.getByLabelText('Quantidade em Estoque'), { target: { value: newPartData.quantity.toString() }});
    fireEvent.change(screen.getByLabelText('Quantidade Mínima'), { target: { value: newPartData.minQuantity.toString() }});
    fireEvent.change(screen.getByLabelText('Custo Unitário (R$)'), { target: { value: newPartData.unitCost.toString() }});


    fireEvent.click(screen.getByText('Cadastrar Peça'));
    
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('parts');
      expect(supabase.from('parts').insert).toHaveBeenCalledTimes(1);
      expect(supabase.from('parts').insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ 
            name: newPartData.name, 
            partNumber: newPartData.partNumber, 
            category: newPartData.category, // Check if the selected category is passed
            quantity: newPartData.quantity,
            minQuantity: newPartData.minQuantity,
            unitCost: newPartData.unitCost
          })
        ])
      );
      expect(mockSetGlobalParts).toHaveBeenCalledWith(expect.any(Function)); // or specific array if known
    });
  });

  it('opens dialog to edit an existing part', async () => {
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]); 

    await waitFor(() => {
      expect(screen.getByText('Editar Peça')).toBeInTheDocument();
      expect(screen.getByLabelText('Nome da Peça *')).toHaveValue('Test Part 1');
    });
  });

  it('updates an existing part successfully', async () => {
    const updatedPartData = { ...initialMockParts[0], name: 'Updated Part Name Test', quantity: 25, updatedAt: new Date().toISOString() };
    supabase.from('parts').update().eq().select().single.mockResolvedValueOnce({ data: updatedPartData, error: null });

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]); 

    await waitFor(() => {
      expect(screen.getByLabelText('Nome da Peça *')).toHaveValue('Test Part 1');
    });

    fireEvent.change(screen.getByLabelText('Nome da Peça *'), { target: { value: updatedPartData.name } });
    fireEvent.change(screen.getByLabelText('Quantidade em Estoque'), { target: { value: updatedPartData.quantity.toString() }});
    fireEvent.click(screen.getByText('Atualizar Peça'));

    await waitFor(() => {
      expect(supabase.from('parts').update).toHaveBeenCalledTimes(1);
      expect(supabase.from('parts').update().eq).toHaveBeenCalledWith('id', initialMockParts[0].id);
      expect(supabase.from('parts').update().eq().select().single).toHaveBeenCalled();
      expect(mockSetGlobalParts).toHaveBeenCalled();
    });
  });
  
  it('deletes a part after confirmation', async () => {
    supabase.from('parts').delete().eq().mockResolvedValueOnce({ error: null });

    const deleteButtons = screen.getAllByText('Excluir');
    fireEvent.click(deleteButtons[0]); 

    await waitFor(() => {
      expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument();
    });

    const confirmDeleteButton = screen.getByRole('button', { name: 'Excluir' }); 
    fireEvent.click(confirmDeleteButton);

    await waitFor(() => {
      expect(supabase.from('parts').delete).toHaveBeenCalledTimes(1);
      expect(supabase.from('parts').delete().eq).toHaveBeenCalledWith('id', initialMockParts[0].id);
      expect(mockSetGlobalParts).toHaveBeenCalled();
    });
  });

  it('filters parts by search term', async () => {
    fireEvent.change(screen.getByPlaceholderText('Buscar por nome, código ou fornecedor...'), { target: { value: 'NonExistentPart' } });
    await waitFor(() => {
      expect(screen.queryByText('Test Part 1')).not.toBeInTheDocument();
      expect(screen.getByText('Nenhuma Peça Encontrada')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Buscar por nome, código ou fornecedor...'), { target: { value: 'Test Part' } });
    await waitFor(() => {
      expect(screen.getByText('Test Part 1')).toBeInTheDocument();
    });
  });

});