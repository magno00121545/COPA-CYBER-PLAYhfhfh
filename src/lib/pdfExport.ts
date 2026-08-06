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

export async function generateVipCardPDF(member: any) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [53.98, 85.6], // Standard card size
  });

  drawCardFront(doc, member, 0, 0);
  
  doc.addPage();
  drawCardBack(doc, member, 0, 0);

  doc.save(`Carteirinha_${member.nickname}.pdf`);
}

export async function generateMultipleVipCardsPDF(members: any[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const cardsPerPage = 5;

  for (let i = 0; i < members.length; i += cardsPerPage) {
    if (i > 0) doc.addPage();
    const pageMembers = members.slice(i, i + cardsPerPage);
    for (const member of pageMembers) {
      const index = pageMembers.indexOf(member);
      const row = index;
      const x = 19;
      const y = 10 + row * 55;
      
      // Front and Back side-by-side
      await drawCardFront(doc, member, x, y);
      
      // Minimal fold line
      (doc as any).setDrawColor(200, 200, 200);
      (doc as any).setLineDash([1, 1], 0);
      doc.line(x + 85.6, y, x + 85.6, y + 53.98);
      (doc as any).setLineDash([], 0);
      
      await drawCardBack(doc, member, x + 85.6, y);
    }
  }

  doc.save(`Carteirinhas_VIP_SideBySide_${Date.now()}.pdf`);
}

export async function generateDoubleSidedVipCardsPDF(members: any[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const cardsPerPage = 10;

  // Fronts on Page 1
  const page1Members = members.slice(0, cardsPerPage);
  for (const member of page1Members) {
      const index = page1Members.indexOf(member);
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 10 + col * 95;
      const y = 10 + row * 55;
      await drawCardFront(doc, member, x, y);
  }

  // Backs on Page 2
  doc.addPage();
  for (const member of page1Members) {
      const index = page1Members.indexOf(member);
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 10 + col * 95;
      const y = 10 + row * 55;
      await drawCardBack(doc, member, x, y);
  }

  doc.save(`Carteirinhas_VIP_DoubleSided_${Date.now()}.pdf`);
}


async function resizeImage(url: string, maxWidth: number, maxHeight: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = width * ratio;
      height = height * ratio;
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function addResizedImage(doc: any, url: string, format: string, x: number, y: number, w: number, h: number) {
  try {
    const resizedUrl = await resizeImage(url, w * 4, h * 4); // Resize to 4x display size for quality
    doc.addImage(resizedUrl, format, x, y, w, h);
  } catch (e) {
    // If resize fails, try original
    try {
        doc.addImage(url, format, x, y, w, h);
    } catch (e2) {
        console.error("Failed to add image", e2);
    }
  }
}

async function drawCardFront(doc: any, member: any, x: number, y: number) {
  // Background
  if (member.background_image_url) {
    await addResizedImage(doc, member.background_image_url, 'JPEG', x, y, 85.6, 53.98);
  } else {
    doc.setFillColor(15, 15, 15);
    doc.rect(x, y, 85.6, 53.98, 'F');
  }

  // Border
  doc.setDrawColor(57, 255, 20);
  doc.setLineWidth(0.8);
  doc.rect(x + 2, y + 2, 81.6, 49.98);

  // Title
  doc.setFillColor(57, 255, 20);
  doc.rect(x + 2, y + 2, 81.6, 8, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('MEMBRO VIP - CYBER PLAY', x + 42.8, y + 7.5, { align: 'center' });

  // Avatar
  if (member.image_url) {
    await addResizedImage(doc, member.image_url, 'JPEG', x + 5, y + 12, 20, 20);
  }

  // Details
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  
  const startX = x + 30;
  const startY = y + 18;
  const lineHeight = 5;

  doc.text(`NOME: ${member.name}`, startX, startY);
  doc.text(`NICK: ${member.nickname}`, startX, startY + lineHeight);
  doc.text(`ID: ${member.id_member}`, startX, startY + lineHeight * 2);
  doc.text(`NASC: ${member.birth_date}`, startX, startY + lineHeight * 3);
  doc.text(`TIME: ${member.team}`, startX, startY + lineHeight * 4);
  
  // Footer
  doc.setTextColor(57, 255, 20);
  doc.setFontSize(5);
  doc.text(`@CyberPlay | ${member.social_media || ''}`, x + 42.8, y + 50, { align: 'center' });
}

async function drawCardBack(doc: any, member: any, x: number, y: number) {
    // Back side - Simple gamer aesthetic
    if (member.background_back_image_url) {
      await addResizedImage(doc, member.background_back_image_url, 'JPEG', x, y, 85.6, 53.98);
    } else if (member.background_image_url) {
      await addResizedImage(doc, member.background_image_url, 'JPEG', x, y, 85.6, 53.98);
    } else {
        doc.setFillColor(15, 15, 15);
        doc.rect(x, y, 85.6, 53.98, 'F');
    }
    
    doc.setDrawColor(57, 255, 20);
    doc.setLineWidth(0.8);
    doc.rect(x + 2, y + 2, 81.6, 49.98);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('VIP MEMBER', x + 42.8, y + 33, { align: 'center' });
}


