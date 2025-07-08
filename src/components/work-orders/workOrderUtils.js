
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toast } from '@/components/ui/use-toast';

const statusLabels = { pending: 'Pendente', 'in-progress': 'Em Andamento', completed: 'Concluída', cancelled: 'Cancelada' };
const priorityLabels = { low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica' };
const typeLabels = { preventive: 'Preventiva', corrective: 'Corretiva', emergency: 'Emergência', improvement: 'Melhoria', inspection: 'Inspeção', predictive: 'Preditiva', other: 'Outra' };

export const generateWorkOrderPDF = (order, equipment) => {
  try {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor('#3B82F6'); 
    doc.text(`Ordem de Serviço: #${order.id.substring(0, 8)}`, 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

    doc.autoTable({
      startY: 40,
      head: [['Campo', 'Valor']],
      body: [
        ['Título', order.title],
        ['Status', statusLabels[order.status] || order.status],
        ['Prioridade', priorityLabels[order.priority] || order.priority],
        ['Tipo', typeLabels[order.type] || order.type],
        ['Responsável', order.assignedto || 'Não definido'],
        ['Data Agendada', order.scheduleddate ? new Date(order.scheduleddate).toLocaleString('pt-BR') : 'Não agendado'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }, 
      styles: { fontSize: 10 },
    });

    let finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(14);
    doc.setTextColor('#3B82F6');
    doc.text('Descrição do Serviço', 14, finalY);
    doc.setFontSize(10);
    doc.setTextColor(40);
    const descriptionLines = doc.splitTextToSize(order.description || 'Nenhuma descrição fornecida.', 180);
    doc.text(descriptionLines, 14, finalY + 7);
    finalY += descriptionLines.length * 5 + 10;


    doc.setFontSize(14);
    doc.setTextColor('#3B82F6');
    doc.text('Detalhes do Equipamento', 14, finalY);
    doc.autoTable({
        startY: finalY + 5,
        head: [['Equipamento', 'Detalhes']],
        body: [
            ['Nome', equipment.name || 'N/A'],
            ['Localização', equipment.location || 'N/A'],
            ['Modelo', equipment.model || 'N/A'],
            ['Número de Série', equipment.serialnumber || 'N/A'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 10 },
    });

    finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(14);
    doc.setTextColor('#3B82F6');
    doc.text('Observações', 14, finalY);
    doc.setFontSize(10);
    doc.setTextColor(40);
    const notesLines = doc.splitTextToSize(order.notes || 'Nenhuma observação.', 180);
    doc.text(notesLines, 14, finalY + 7);
    finalY = doc.lastAutoTable.finalY + 20;

    doc.line(14, finalY, 196, finalY); 
    doc.text('Assinatura do Técnico:', 14, finalY + 10);
    doc.text('Data:', 140, finalY + 10);

    doc.save(`OS_${order.id.substring(0, 8)}.pdf`);
    toast({ title: 'Sucesso', description: 'Relatório PDF gerado com sucesso.' });
  } catch (error) {
    toast({ title: 'Erro', description: `Não foi possível gerar o PDF: ${error.message}`, variant: 'destructive' });
  }
};
