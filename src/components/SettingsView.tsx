import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { clearAllDatabaseData, supabase, exportDatabaseJSON, importDatabaseJSON } from '../lib/supabase';
import { Trash2, AlertTriangle, CheckCircle2, MessageCircle, Award, Plus, ExternalLink, Save, Download, Upload, Gamepad2, Layers, Sparkles, Image as ImageIcon, Camera, X } from 'lucide-react';
import { fetchCategories, saveCategory, deleteCategory as removeCat, DEFAULT_CATEGORIES } from '../lib/categories';
import { Category } from '../lib/types';

export interface Sponsor {
  id: string;
  name: string;
  category: string;
  website?: string;
  logoUrl?: string;
}

export default function SettingsView() {
  const [pixKey, setPixKey] = useState('');
  const [pixName, setPixName] = useState('');
  const [defaultFee, setDefaultFee] = useState('R$ 20,00');
  const [acceptedPaymentMethods, setAcceptedPaymentMethods] = useState('PIX (Instantâneo), Dinheiro no Local, Cartão de Crédito/Débito');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('');
  const [pixInstructions, setPixInstructions] = useState('');
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [saved, setSaved] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  // Category State
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('⚽');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Sponsor form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Patrocinador Master');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    loadCategories();
  }, []);

  async function loadCategories() {
    const cats = await fetchCategories();
    setCategories(cats);
  }

  async function handleAddCategory(e: FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const updated = await saveCategory({
      name: newCatName.trim(),
      icon: newCatIcon || '🎮',
      description: newCatDesc.trim()
    });

    setCategories(updated);
    setNewCatName('');
    setNewCatDesc('');
  }

  async function handleQuickAddCategory(preset: { name: string; icon: string; description: string }) {
    const updated = await saveCategory(preset);
    setCategories(updated);
  }

  async function handleDeleteCategory(id: string) {
    if (confirm('Deseja excluir esta categoria do sistema?')) {
      const updated = await removeCat(id);
      setCategories(updated);
    }
  }

  function handleSponsorLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('A foto da imagem é muito grande. Escolha uma foto de até 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 400; // max size in px for lightweight storage

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/png', 0.9);
          setLogoUrl(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }


  async function loadSettings() {
    const { data } = await supabase.from('settings').select('*').eq('id', 'global').single();
    if (data) {
      setPixKey(data.pixKey || '');
      setPixName(data.pixName || '');
      setDefaultFee(data.defaultFee || 'R$ 20,00');
      setAcceptedPaymentMethods(data.acceptedPaymentMethods || 'PIX (Instantâneo), Dinheiro no Local, Cartão de Crédito/Débito');
      setWhatsappNumber(data.whatsappNumber || '');
      setWhatsappGroupLink(data.whatsappGroupLink || '');
      setPixInstructions(data.pixInstructions || '');
      setSponsors(data.sponsors || []);
    }
    setLoading(false);
  }

  async function handleSaveSettings() {
    const payload = {
      pixKey,
      pixName,
      defaultFee,
      acceptedPaymentMethods,
      whatsappNumber,
      whatsappGroupLink,
      pixInstructions,
      sponsors
    };

    await supabase.from('settings').update(payload).eq('id', 'global');

    const { data } = await supabase.from('settings').select('*').eq('id', 'global').single();
    if (!data) {
      await supabase.from('settings').insert({
        id: 'global',
        ...payload
      });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    await handleSaveSettings();
  }

  async function handleAddSponsor(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const newSponsor: Sponsor = {
      id: 'sp_' + Date.now(),
      name: name.trim(),
      category: category.trim() || 'Patrocinador Master',
      website: website.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
    };

    const updated = [...sponsors, newSponsor];
    setSponsors(updated);
    
    // Save to DB
    await supabase.from('settings').update({ sponsors: updated }).eq('id', 'global');
    
    const { data } = await supabase.from('settings').select('*').eq('id', 'global').single();
    if (!data) {
        await supabase.from('settings').insert({ id: 'global', sponsors: updated });
    }

    // Reset form
    setName('');
    setWebsite('');
    setLogoUrl('');
  }

  async function handleDeleteSponsor(id: string) {
    const updated = sponsors.filter(s => s.id !== id);
    setSponsors(updated);
    await supabase.from('settings').update({ sponsors: updated }).eq('id', 'global');
  }

  function handleResetAllData() {
    if (confirm('ATENÇÃO: Deseja realmente ZERAR todos os dados de torneios, jogadores, rankings e inscrições? Esta ação não pode ser desfeita.')) {
      clearAllDatabaseData();
      setResetDone(true);
      setTimeout(() => setResetDone(false), 4000);
    }
  }

  async function handleBackup() {
    try {
      const data = await exportDatabaseJSON();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cyberplay_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Erro ao gerar backup: ' + e);
    }
  }

  async function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm('ATENÇÃO: Restaurar um backup irá substituir TODOS os dados atuais. Deseja continuar?')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const jsonStr = event.target?.result as string;
          await importDatabaseJSON(jsonStr);
          alert('Backup restaurado com sucesso! Recarregando sistema...');
          window.location.reload();
        } catch (error) {
          alert('Erro ao restaurar backup: arquivo inválido.');
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  }

  function getWhatsAppLink() {
    const cleanPhone = whatsappNumber.replace(/\D/g, '');
    if (!cleanPhone) return '#';
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent('Olá! Vim pelo site Cyber Play.')}`;
  }

  const qrCodeUrl = pixKey
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixKey)}`
    : '';

  const whatsappQrUrl = whatsappNumber
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getWhatsAppLink())}`
    : '';

  if (loading) {
    return <div className="text-white p-4">Carregando configurações...</div>;
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Configurações de Pagamento (PIX) & Sistema</h2>
        <p className="text-gray-400 text-sm">
          Cadastre sua Chave PIX. O QR Code e a chave serão exibidos na tela inicial para os participantes realizarem o pagamento da inscrição.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-[#111] p-6 rounded-xl border border-gray-800 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Chave PIX (CPF, CNPJ, Email, Telefone ou Chave Aleatória)</label>
            <input
              type="text"
              required
              placeholder="Ex: 123.456.789-00 ou pix@cyberplay.com"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              className="w-full bg-[#050505] border border-gray-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#39FF14]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Nome do Beneficiário / Recebedor</label>
            <input
              type="text"
              placeholder="Ex: Cyberplay Organizações Esportivas"
              value={pixName}
              onChange={(e) => setPixName(e.target.value)}
              className="w-full bg-[#050505] border border-gray-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#39FF14]"
            />
          </div>
        </div>

        <div className="p-4 bg-[#161616] border border-[#39FF14]/30 rounded-xl space-y-4">
          <h4 className="text-xs font-black text-[#39FF14] uppercase tracking-wider">
            ⚙️ Configurações Padrão de Taxa e Meios de Pagamento
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1">
                💵 Valor Padrão da Taxa de Inscrição (R$)
              </label>
              <input
                type="text"
                placeholder="Ex: R$ 20,00"
                value={defaultFee}
                onChange={(e) => setDefaultFee(e.target.value)}
                className="w-full bg-[#050505] border border-gray-700 p-3 rounded-lg text-white font-bold text-[#39FF14] focus:outline-none focus:border-[#39FF14]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1">
                💳 Formas de Pagamento Aceitas no Sistema
              </label>
              <input
                type="text"
                placeholder="Ex: PIX, Dinheiro no Local, Cartão"
                value={acceptedPaymentMethods}
                onChange={(e) => setAcceptedPaymentMethods(e.target.value)}
                className="w-full bg-[#050505] border border-gray-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#39FF14]"
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-3">
          <label className="block text-sm font-bold text-emerald-400 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-400 fill-emerald-950" />
            Número do WhatsApp do Organizador (Comprovantes & QR Code)
          </label>
          <input
            type="text"
            placeholder="Ex: (85) 99999-9999 ou 5585999999999"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            className="w-full bg-[#050505] border border-emerald-700/60 p-3 rounded-lg text-white font-mono focus:outline-none focus:border-[#39FF14]"
          />
          <p className="text-xs text-emerald-300/80 leading-relaxed">
            Seu número aparecerá na tela inicial junto a um <strong>QR Code exclusivo do WhatsApp</strong> e um botão direto para os jogadores enviarem comprovantes e tirarem dúvidas!
          </p>
        </div>
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-3 mt-4">
          <label className="block text-sm font-bold text-emerald-400 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-400 fill-emerald-950" />
            Link do Grupo do WhatsApp (Comunidade / Torneios)
          </label>
          <input
            type="text"
            placeholder="Ex: https://chat.whatsapp.com/..."
            value={whatsappGroupLink}
            onChange={(e) => setWhatsappGroupLink(e.target.value)}
            className="w-full bg-[#050505] border border-emerald-700/60 p-3 rounded-lg text-white focus:outline-none focus:border-[#39FF14]"
          />
          <p className="text-xs text-emerald-300/80 leading-relaxed">
            Se preenchido, os jogadores poderão entrar no grupo diretamente pela página inicial.
          </p>
        </div>


        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Instruções para o Participante</label>
          <textarea
            rows={3}
            value={pixInstructions}
            onChange={(e) => setPixInstructions(e.target.value)}
            placeholder="Ex: Realize o pagamento do PIX e preencha seu Nickname e Plataforma."
            className="w-full bg-[#050505] border border-gray-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#39FF14]"
          />
        </div>

        {saved && (
          <div className="p-3 bg-green-950/80 border border-green-500 text-green-300 rounded-lg text-sm font-bold">
            ✓ Configurações do PIX salvas com sucesso no banco de dados!
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-[#39FF14] text-black font-black p-3 rounded-lg hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          SALVAR CHAVE PIX E INSTRUÇÕES
        </button>
      </form>

      {/* Seção de Cadastro e Gestão de Categorias e Jogos */}
      <div className="bg-[#111] p-6 rounded-xl border border-gray-800 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-[#39FF14]" />
              Gestão e Cadastro de Categorias de Jogos
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Cadastre novos jogos e modalidades (ex: eFootball, EA FC 25, Free Fire, CS2, Mortal Kombat, Clash Royale).
              Todas as categorias ativas aparecerão nos filtros de Ranking, Chaveamento de Partidas e Inscrições públicas.
            </p>
          </div>
        </div>

        {/* Adicionar Rápido com 1 clique */}
        <div className="p-4 bg-[#080808] rounded-xl border border-gray-800 space-y-2">
          <span className="text-xs font-bold text-[#39FF14] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Adicionar Rápido Sugestões Populares (1-Clique)
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { name: 'eFootball 2026', icon: '⚽', description: 'Torneios Digitais de eFootball / PES' },
              { name: 'EA FC 25', icon: '🎮', description: 'EA Sports FC 25 / FIFA' },
              { name: 'Free Fire', icon: '🔥', description: 'Free Fire Battle Royale' },
              { name: 'CS2 / FPS', icon: '🔫', description: 'Counter-Strike 2 e Jogos de Tiro' },
              { name: 'Mortal Kombat 1', icon: '🥊', description: 'Jogos de Luta e Combate' },
              { name: 'Clash Royale', icon: '🕹️', description: 'Clash Royale e Jogos de Estratégia Mobile' },
              { name: 'Rocket League', icon: '🚀', description: 'Futebol com Carros / Rocket League' },
              { name: 'Valorant', icon: '👑', description: 'Valorant e MOBA' },
              { name: 'F1 24', icon: '🏎️', description: 'Jogos de Corrida e Automobilismo' },
            ].map(preset => {
              const exists = categories.some(c => c.name.toLowerCase() === preset.name.toLowerCase());
              return (
                <button
                  key={preset.name}
                  type="button"
                  disabled={exists}
                  onClick={() => handleQuickAddCategory(preset)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition ${
                    exists
                      ? 'bg-gray-900/50 text-gray-600 border-gray-800/60 cursor-not-allowed opacity-50'
                      : 'bg-[#161616] hover:bg-[#222] text-gray-200 border-gray-700 hover:border-[#39FF14] text-white cursor-pointer'
                  }`}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.name}</span>
                  {exists && <span className="text-[10px] text-gray-500">(Adicionado)</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Formulário Manual de Categoria */}
        <form onSubmit={handleAddCategory} className="bg-[#080808] p-4 rounded-xl border border-gray-800 space-y-4">
          <h4 className="text-sm font-bold text-[#39FF14] uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Cadastrar Categoria Personalizada
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Nome do Jogo / Categoria *</label>
              <input
                type="text"
                required
                placeholder="Ex: eFootball 2026, Brawl Stars, Tekken 8"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full bg-[#111] border border-gray-700 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-[#39FF14]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Ícone / Emoji</label>
              <select
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                className="w-full bg-[#111] border border-gray-700 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-[#39FF14]"
              >
                <option value="⚽">⚽ Futebol (eFootball)</option>
                <option value="🎮">🎮 Controle / EA FC</option>
                <option value="🔥">🔥 Fogo / Free Fire</option>
                <option value="🔫">🔫 Tiro / CS2 / Valorant</option>
                <option value="🥊">🥊 Luta / Mortal Kombat</option>
                <option value="🏎️">🏎️ Corrida / F1</option>
                <option value="👑">👑 Coroa / MOBA</option>
                <option value="🕹️">🕹️ Arcade / Mobile</option>
                <option value="🚀">🚀 Foguete / Rocket League</option>
                <option value="🎯">🎯 Alvo / Precisão</option>
                <option value="🏆">🏆 Troféu / Competitivo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Descrição Opcional</label>
              <input
                type="text"
                placeholder="Ex: Regras da plataforma e modalidade"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                className="w-full bg-[#111] border border-gray-700 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-[#39FF14]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-[#39FF14] text-black font-black px-5 py-2.5 rounded-lg hover:brightness-110 transition cursor-pointer text-xs flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>CADASTRAR CATEGORIA</span>
          </button>
        </form>

        {/* Lista de Categorias Ativas */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>Categorias Cadastradas no Sistema ({categories.length})</span>
            <span className="text-[10px] text-gray-500">Exibidas no Ranking e no Chaveamento</span>
          </h4>

          {categories.length === 0 ? (
            <p className="text-xs text-gray-500 italic bg-[#050505] p-4 rounded-lg border border-gray-800 text-center">
              Nenhuma categoria cadastrada. O sistema utilizará as categorias padrão.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map(cat => (
                <div key={cat.id} className="bg-[#050505] p-3.5 rounded-xl border border-gray-800 flex items-center justify-between gap-2 shadow-sm hover:border-gray-700 transition">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl p-2 bg-[#111] rounded-lg border border-gray-800 shrink-0">
                      {cat.icon || '🎮'}
                    </span>
                    <div className="min-w-0">
                      <h5 className="font-bold text-white text-sm truncate">{cat.name}</h5>
                      {cat.description && (
                        <p className="text-[10px] text-gray-400 truncate">{cat.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    title="Excluir Categoria"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Seção de Patrocinadores & Apoio */}
      <div className="bg-[#111] p-6 rounded-xl border border-gray-800 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-[#39FF14]" />
              Gerenciar Patrocinadores & Apoio Oficial
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Os patrocinadores cadastrados aqui serão exibidos em destaque no rodapé da tela inicial para todos os participantes.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddSponsor} className="bg-[#080808] p-4 rounded-xl border border-gray-800 space-y-4">
          <h4 className="text-sm font-bold text-[#39FF14] uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Cadastrar Novo Patrocinador
          </h4>

          {/* Sugestões de Marcas Populares */}
          <div className="p-3 bg-[#111] rounded-lg border border-gray-800 space-y-2">
            <span className="text-[10px] font-bold text-[#39FF14] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Preencher Rápido com Marcas Famosas (1-Clique):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'PlayStation', category: 'Patrocinador Master', website: 'https://playstation.com', logoUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=150&auto=format&fit=crop&q=80' },
                { name: 'Red Bull', category: 'Apoio Oficial', website: 'https://redbull.com', logoUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=150&auto=format&fit=crop&q=80' },
                { name: 'EA Sports', category: 'Patrocinador Master', website: 'https://ea.com', logoUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150&auto=format&fit=crop&q=80' },
                { name: 'Xbox', category: 'Parceiro Premier', website: 'https://xbox.com', logoUrl: 'https://images.unsplash.com/photo-1621252179027-945198901061?w=150&auto=format&fit=crop&q=80' },
                { name: 'Monster Energy', category: 'Apoio Oficial', website: 'https://monsterenergy.com', logoUrl: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=150&auto=format&fit=crop&q=80' },
                { name: 'Nike E-Sports', category: 'Parceiro Premier', website: 'https://nike.com', logoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&auto=format&fit=crop&q=80' },
              ].map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setName(preset.name);
                    setCategory(preset.category);
                    setWebsite(preset.website);
                    setLogoUrl(preset.logoUrl);
                  }}
                  className="text-[11px] bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 hover:text-white px-2.5 py-1 rounded border border-gray-700 transition flex items-center gap-1"
                >
                  <span>⚡</span>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Nome da Empresa / Patrocinador *</label>
              <input
                type="text"
                required
                placeholder="Ex: Arena E-Sports, GameStation..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#111] border border-gray-700 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-[#39FF14]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Categoria / Nível</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#111] border border-gray-700 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-[#39FF14]"
              >
                <option value="Patrocinador Master">Patrocinador Master</option>
                <option value="Apoio Oficial">Apoio Oficial</option>
                <option value="Parceiro Premier">Parceiro Premier</option>
                <option value="Media Partner">Media Partner</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Link / Instagram / Website (Opcional)</label>
              <input
                type="url"
                placeholder="Ex: https://instagram.com/patrocinador"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full bg-[#111] border border-gray-700 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-[#39FF14]"
              />
            </div>

            {/* SEÇÃO DE LOGO: UPLOAD DE FOTO OU URL */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#39FF14] mb-1 flex items-center justify-between">
                <span>Foto / Logomarca do Patrocinador</span>
                <span className="text-[10px] text-gray-400 font-normal">Enviar do Computador/Celular ou colar URL</span>
              </label>

              <div className="flex gap-2 items-center">
                {/* Botão de Upload de Foto */}
                <label className="bg-[#1a1a1a] hover:bg-[#252525] border border-gray-700 hover:border-[#39FF14] text-white px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#39FF14]" />
                  <span>ENVIAR FOTO</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSponsorLogoUpload}
                    className="hidden"
                  />
                </label>

                {/* Input de URL da Imagem */}
                <input
                  type="url"
                  placeholder="Ou cole a URL da imagem (https://...)"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full bg-[#111] border border-gray-700 p-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#39FF14]"
                />
              </div>

              {/* Pré-visualização da Foto da Logo */}
              {logoUrl ? (
                <div className="flex items-center gap-3 p-2 bg-[#111] border border-[#39FF14]/40 rounded-lg">
                  <img
                    src={logoUrl}
                    alt="Preview Logo"
                    className="w-12 h-12 object-contain bg-black p-1 rounded border border-gray-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#39FF14]">Foto / Logo Carregada com Sucesso!</p>
                    <p className="text-[10px] text-gray-400 truncate">A logomarca aparecerá em destaque no rodapé e nos parceiros.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/40 rounded transition cursor-pointer shrink-0"
                    title="Remover Imagem"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-[10px] text-gray-500 italic">
                  💡 Dica: Você pode anexar qualquer arquivo de imagem (.png, .jpg, .svg, .webp) direto do seu aparelho.
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="bg-[#39FF14] text-black font-black px-5 py-2.5 rounded-lg hover:brightness-110 transition cursor-pointer text-xs flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>ADICIONAR PATROCINADOR</span>
          </button>
        </form>

        {/* Lista de Patrocinadores Cadastrados */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Patrocinadores Ativos ({sponsors.length})
          </h4>

          {sponsors.length === 0 ? (
            <p className="text-xs text-gray-500 italic bg-[#050505] p-4 rounded-lg border border-gray-800 text-center">
              Nenhum patrocinador cadastrado ainda.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sponsors.map(sp => (
                <div key={sp.id} className="bg-[#050505] p-4 rounded-xl border border-gray-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {sp.logoUrl ? (
                      <img src={sp.logoUrl} alt={sp.name} className="w-10 h-10 object-contain rounded bg-black p-1 border border-gray-800" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] font-black flex items-center justify-center text-sm">
                        {sp.name[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h5 className="font-bold text-white text-sm">{sp.name}</h5>
                      <span className="text-[10px] bg-gray-800 text-[#39FF14] font-bold px-2 py-0.5 rounded border border-gray-700">
                        {sp.category}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSponsor(sp.id)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(pixKey || whatsappNumber) && (
        <div className="bg-[#111] p-6 rounded-xl border border-gray-800 space-y-6">
          <h3 className="text-lg font-bold text-[#39FF14] flex items-center gap-2">
            <span>Pré-visualização dos QR Codes na Tela Inicial</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pixKey && (
              <div className="flex flex-col items-center p-4 bg-[#050505] rounded-xl border border-gray-800 text-center space-y-3">
                <span className="text-xs font-bold text-[#39FF14] uppercase tracking-wider">QR Code PIX</span>
                <img
                  src={qrCodeUrl}
                  alt="QR Code PIX"
                  className="w-36 h-36 bg-white p-2 rounded-lg border border-gray-700 object-contain"
                />
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Chave PIX</p>
                  <p className="text-xs font-mono text-[#39FF14] font-bold select-all bg-[#111] px-2 py-1 rounded border border-gray-800">
                    {pixKey}
                  </p>
                </div>
              </div>
            )}

            {whatsappNumber && (
              <div className="flex flex-col items-center p-4 bg-[#050505] rounded-xl border border-emerald-900/60 text-center space-y-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" /> QR Code WhatsApp
                </span>
                <img
                  src={whatsappQrUrl}
                  alt="QR Code WhatsApp"
                  className="w-36 h-36 bg-white p-2 rounded-lg border border-emerald-500/50 object-contain"
                />
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Número de Contato</p>
                  <p className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/40 px-3 py-1 rounded border border-emerald-800/60">
                    {whatsappNumber}
                  </p>
                </div>
              </div>
            )}
            
            {whatsappGroupLink && (
              <div className="flex flex-col items-center p-4 bg-[#050505] rounded-xl border border-emerald-900/60 text-center space-y-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" /> Grupo do WhatsApp
                </span>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(whatsappGroupLink)}`}
                  alt="QR Code Grupo WhatsApp"
                  className="w-36 h-36 bg-white p-2 rounded-lg border border-emerald-500/50 object-contain"
                />
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Link do Grupo</p>
                  <p className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/40 px-3 py-1 rounded border border-emerald-800/60 truncate max-w-[150px]">
                    {whatsappGroupLink}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Zona de Backup e Restore */}
      <div className="bg-[#111] p-6 rounded-xl border border-blue-900/50 space-y-4">
        <div className="flex items-center gap-2 text-blue-400 font-bold text-lg">
          <Download className="w-5 h-5" />
          <h3>Backup e Restauração de Dados</h3>
        </div>
        <p className="text-xs text-gray-400">
          Você pode fazer o download de um backup completo do sistema, ou enviar um arquivo para restaurar todos os dados.
        </p>

        <div className="flex gap-4">
          <button
            onClick={handleBackup}
            className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-bold px-4 py-3 rounded-lg text-sm transition cursor-pointer flex justify-center items-center gap-2"
          >
            <Download className="w-5 h-5" /> GERAR BACKUP COMPLETO
          </button>
          
          <label className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold px-4 py-3 rounded-lg text-sm transition cursor-pointer flex justify-center items-center gap-2">
            <Upload className="w-5 h-5" /> RESTAURAR BACKUP
            <input type="file" accept=".json" className="hidden" onChange={handleRestore} />
          </label>
        </div>
      </div>

      {/* Zona de Perigo - Limpar e Zerar Sistema */}
      <div className="bg-[#111] p-6 rounded-xl border border-red-900/50 space-y-4">
        <div className="flex items-center gap-2 text-red-400 font-bold text-lg">
          <AlertTriangle className="w-5 h-5" />
          <h3>Zerar Banco de Dados e Sistema</h3>
        </div>
        <p className="text-xs text-gray-400">
          Esta opção apaga todos os campeonatos, inscrições, jogadores e partidas, deixando o sistema 100% limpo ("zeradinho"). Lembre-se de fazer um backup antes se desejar!
        </p>

        {resetDone && (
          <div className="p-3 bg-green-950/80 border border-green-500 text-green-300 rounded-lg text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>Sistema zerado com sucesso! Todos os dados foram limpos.</span>
          </div>
        )}

        <button
          onClick={handleResetAllData}
          className="bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700 font-bold px-4 py-2.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>ZERAR E APAGAR TODOS OS DADOS DE TESTE</span>
        </button>
      </div>
    </div>
  );
}
