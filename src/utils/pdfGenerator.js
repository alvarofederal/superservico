
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePdf = async (elementId, fileName = 'relatorio.pdf') => {
  const input = document.getElementById(elementId);
  if (!input) {
    throw new Error(`Elemento com id '${elementId}' não encontrado.`);
  }

  // Use html2canvas para capturar o elemento. A opção `useCORS` é importante para imagens externas.
  // A opção `scale` melhora a resolução do canvas.
  const canvas = await html2canvas(input, {
    useCORS: true,
    scale: 2, 
    logging: false,
    backgroundColor: null, // Mantém o fundo transparente se houver
  });
  
  const imgData = canvas.toDataURL('image/png');

  // Configurações do PDF. Vamos usar A4 (210x297 mm)
  const pdfWidth = 210;
  const pdfHeight = 297;
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Calcula a proporção da imagem para caber no PDF
  const imgProps = pdf.getImageProperties(imgData);
  const margin = 10; // 10mm de margem
  const usablePdfWidth = pdfWidth - margin * 2;
  const usablePdfHeight = pdfHeight - margin * 2;
  
  const imgWidth = usablePdfWidth;
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

  let heightLeft = imgHeight;
  let position = margin; // Posição inicial no eixo Y

  // Adiciona a primeira página
  pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
  heightLeft -= usablePdfHeight;

  // Se a imagem for maior que uma página, adiciona novas páginas
  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin; // Move a imagem para cima para a próxima seção
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= usablePdfHeight;
  }

  pdf.save(fileName);
};
