import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './supabase';

export async function generateSocialMediaPDF() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Fetch data
  const { data: rankingsData } = await supabase.from('rankings').select('*, players(nickname)');
  const { data: matchesData } = await supabase.from('matches').select('*');

  const rankings = (rankingsData as any[]) || [];
  const matches = (matchesData as any[]) || [];

  // Sort rankings by points, then wins
  rankings.sort((a, b) => {
    if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
    return (b.wins || 0) - (a.wins || 0);
  });

  // Background Light Theme
  doc.setFillColor(245, 245, 245); // Light gray background
  doc.rect(0, 0, 210, 297, 'F');

  // Title
  doc.setTextColor(0, 100, 0); // Darker Green
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('CYBER PLAY ESPORTS', 14, 20);

  doc.setTextColor(50, 50, 50); // Dark Gray
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('CLASSIFICAÇÃO GERAL & CHAVEAMENTOS', 14, 28);

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text(`Atualizado em: ${currentDate}`, 14, 35);

  let currentY = 48;

  // SECTION 1: CLASSIFICAÇÃO
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('🏆 TABELA DE CLASSIFICAÇÃO', 14, currentY);

  currentY += 4;

  const rankingRows = rankings.map((r, index) => {
    const pos = index + 1;
    const nickname = r.players?.nickname || 'Jogador sem nome';
    const wins = r.wins || 0;
    const losses = r.losses || 0;
    const draws = r.draws || 0;
    const pj = r.matches_played || (wins + losses + draws);
    const winRate = pj > 0 ? `${Math.round((wins / pj) * 100)}%` : '0%';
    const points = `${r.points || 0} PTS`;

    return [`#${pos}`, nickname, pj, wins, draws, losses, winRate, points];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['POS', 'JOGADOR', 'PJ', 'V', 'E', 'D', 'APROV.', 'PONTOS']],
    body: rankingRows.length > 0 ? rankingRows : [['-', 'Nenhum jogador classificado', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: [0, 80, 0],
      fontStyle: 'bold',
      halign: 'center',
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [50, 50, 50],
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 16 },
      1: { fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', cellWidth: 16 },
      6: { halign: 'center', cellWidth: 22 },
      7: { halign: 'right', fontStyle: 'bold', cellWidth: 26 },
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 14;

  // SECTION 2: CHAVEAMENTOS / CONFRONTOS
  if (currentY > 230) {
    doc.addPage();
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 0, 210, 297, 'F');
    currentY = 20;
  }

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('⚔️ CHAVEAMENTOS E CONFRONTOS', 14, currentY);

  currentY += 4;

  const matchRows = matches.map((m) => {
    return [m.player1 || 'Jogador 1', `${m.score1 ?? 0} x ${m.score2 ?? 0}`, m.player2 || 'Jogador 2', m.status || 'Agendado'];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['JOGADOR 1', 'PLACAR', 'JOGADOR 2', 'STATUS']],
    body: matchRows.length > 0 ? matchRows : [['-', 'vs', '-', 'Nenhum confronto']],
    theme: 'grid',
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: [0, 80, 0],
      fontStyle: 'bold',
      halign: 'center',
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [50, 50, 50],
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold' },
      1: { halign: 'center', fontStyle: 'bold', textColor: [0, 80, 0] },
      2: { halign: 'center', fontStyle: 'bold' },
      3: { halign: 'center', textColor: [100, 100, 100] },
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    margin: { left: 14, right: 14 },
  });

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(220, 220, 220); // Light footer
    doc.rect(0, 280, 210, 17, 'F');
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(8);
    doc.text('CYBER PLAY ESPORTS — DOCUMENTO OFICIAL PARA REDES SOCIAIS', 14, 286);
    
    // Creator watermark
    doc.setTextColor(0, 100, 0); // Darker Green
    doc.setFont('helvetica', 'bold');
    doc.text('Criado por MAGNO THIAGO CYBER GHOST', 14, 292);
    
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${i} de ${pageCount}`, 180, 286);
  }

  // Save the PDF file
  doc.save(`Cyber_Play_Classificacao_Chaveamento_${Date.now()}.pdf`);
}

export async function generateRegistrationReceiptPDF(registration: any, tournamentName: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  // Background
  doc.setFillColor(245, 245, 245);
  doc.rect(0, 0, 148, 210, 'F');
  
  // Border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.rect(5, 5, 138, 200);

  // Title
  doc.setTextColor(0, 100, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CYBER PLAY ESPORTS', 14, 20);
  
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('COMPROVANTE DE INSCRIÇÃO', 14, 28);
  
  // Line separator
  doc.setDrawColor(0, 100, 0);
  doc.setLineWidth(0.5);
  doc.line(14, 32, 134, 32);
  
  // Details
  let currentY = 45;
  
  const addField = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(label, 14, currentY);
    
    currentY += 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(value, 14, currentY);
    currentY += 10;
  };

  addField('TORNEIO:', tournamentName || 'Torneio Cyber Play');
  addField('NICKNAME:', registration.nickname || 'N/A');
  addField('PLATAFORMA:', registration.platform || 'N/A');
  addField('STATUS:', registration.status || 'Pendente');
  
  if (registration.created_at) {
    const date = new Date(registration.created_at).toLocaleString('pt-BR');
    addField('DATA DA INSCRIÇÃO:', date);
  }

  // Footer message
  currentY += 10;
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(0, 100, 0);
  doc.setFontSize(9);
  const msg = registration.status === 'Confirmado' 
    ? 'Inscrição confirmada. Boa sorte no torneio!' 
    : 'Aguardando pagamento / validação.';
  doc.text(msg, 14, currentY);
  
  doc.setFillColor(220, 220, 220);
  doc.rect(0, 195, 148, 15, 'F');
  
  doc.setTextColor(0, 100, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Criado por MAGNO THIAGO CYBER GHOST', 14, 202);
  
  doc.save(`Comprovante_${registration.nickname || 'Inscricao'}.pdf`);
}
