import React from 'react';

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const getTypeColor = (type) => {
  const colors = {
    preventive: 'bg-green-500',
    corrective: 'bg-yellow-500',
    emergency: 'bg-red-500',
    improvement: 'bg-blue-500'
  };
  return colors[type] || 'bg-gray-500';
};

export const getStatusColor = (status) => {
  const colors = {
    completed: 'text-green-400',
    in_progress: 'text-blue-400',
    pending: 'text-yellow-400'
  };
  return colors[status] || 'text-gray-400';
};

export const categories = {
  all: 'Todas as Categorias',
  preventive: 'Preventiva',
  corrective: 'Corretiva',
  emergency: 'Emergencial',
  improvement: 'Melhoria'
};

export const periods = {
  week: 'Última Semana',
  month: 'Último Mês',
  quarter: 'Último Trimestre',
  year: 'Último Ano'
};