import React from 'react';
import { ListTree } from 'lucide-react';
import GenericManagerPage from '@/components/common/GenericManagerPage';

const categoryFormFields = [
  {
    name: 'name',
    label: 'Nome da Categoria *',
    type: 'text',
    placeholder: 'Ex: Elétrica, Mecânica, Hidráulica',
    validation: { required: 'O nome é obrigatório.' },
  },
  {
    name: 'description',
    label: 'Descrição',
    type: 'textarea',
    placeholder: 'Descreva brevemente a categoria (opcional)',
    fullWidth: true,
  },
];

const categoryTableColumns = [
  {
    header: 'Nome',
    accessor: 'name',
    className: 'font-medium',
  },
  {
    header: 'Descrição',
    accessor: 'description',
    className: 'text-muted-foreground',
  },
];

const CategoryManager = () => {
  return (
    <GenericManagerPage
      tableName="equipment_categories"
      queryKey="categories"
      pageIcon={ListTree}
      pageTitle="Categorias de Equipamentos"
      pageDescription="Crie e gerencie as categorias para organizar seus equipamentos."
      columns={categoryTableColumns}
      formFields={categoryFormFields}
      searchColumn="name"
      addPermission="category_management"
      editPermission="category_management"
      deletePermission="category_management"
    />
  );
};

export default CategoryManager;