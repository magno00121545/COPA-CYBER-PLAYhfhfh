import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { clearAllDatabaseData, supabase, exportDatabaseJSON, importDatabaseJSON } from '../lib/supabase';
import { Trash2, AlertTriangle, CheckCircle2, MessageCircle, Award, Plus, ExternalLink, Save, Download, Upload } from 'lucide-react';

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
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('');
  const [pixInstructions, setPixInstructions] = useState('');
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [saved, setSaved] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  // Sponsor form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Patrocinador Master');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data } = await supabase.from('settings').select('*').eq('id', 'global').single();
    if (data) {
      setPixKey(data.pixKey || '');
      setPixName(data.pixName || '');
      setWhatsappNumber(data.whatsappNumber || '');
      setWhatsappGroupLink(data.whatsappGroupLink || '');
      setPixInstructions(data.pixInstructions || '');
      setSponsors(data.sponsors || []);
    }
    setLoading(false);
  }

  async function handleSaveSettings() {
    await supabase.from('settings').update({
      pixKey,
      pixName,
      whatsappNumber,
      whatsappGroupLink,
      pixInstructions,
      sponsors
    }).eq('id', 'global');

    const { data } = await supabase.from('settings').select('*').eq('id', 'global').single();
    if (!data) {
        await supabase.from('settings').insert({
            id: 'global',
            pixKey,
            pixName,
            whatsappNumber,
      whatsappGroupLink,
      pixInstructions,
      sponsors
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

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">URL da Logomarca (Opcional)</label>
              <input
                type="url"
                placeholder="Ex: https://link-da-imagem.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full bg-[#111] border border-gray-700 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-[#39FF14]"
              />
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
