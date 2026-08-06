import { useState, useEffect, ChangeEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Printer, CreditCard, Upload, CheckCircle2, X, Sparkles, Loader2, Image as ImageIcon, User, ShieldCheck } from 'lucide-react';
import { generateVipCardPDF, generateMultipleVipCardsPDF, generateDoubleSidedVipCardsPDF } from '../lib/pdfExport';

export default function VipCardsView() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [showPrintOptions, setShowPrintOptions] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    id_member: '',
    age: '',
    address: '',
    social_media: '',
    image_url: '',
    birth_date: '',
    team: '',
    controller_image_url: '',
    background_image_url: '',
    background_back_image_url: ''
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('vip_members').select('*');
      if (error) console.error('Error fetching VIP members:', error);
      setMembers(data || []);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  }

  const fetchFullMember = async (id: string) => {
    try {
      const { data } = await supabase.from('vip_members').select('*').eq('id', id).single();
      return data || members.find(m => m.id === id);
    } catch (e) {
      return members.find(m => m.id === id);
    }
  };

  const handleEdit = async (member: any) => {
    const fullMember = await fetchFullMember(member.id);
    const m = fullMember || member;
    setEditingMember(m);
    setFormData({
      name: m.name || '',
      nickname: m.nickname || '',
      id_member: m.id_member || '',
      age: m.age || '',
      address: m.address || '',
      social_media: m.social_media || '',
      image_url: m.image_url || '',
      birth_date: m.birth_date || '',
      team: m.team || '',
      controller_image_url: m.controller_image_url || '',
      background_image_url: m.background_image_url || '',
      background_back_image_url: m.background_back_image_url || ''
    });
    setShowForm(true);
  };

  const handlePrint = async (member: any) => {
    const fullMember = await fetchFullMember(member.id);
    generateVipCardPDF(fullMember || member);
  };
  
  const handleMultiplePrint = async (type: 'sideBySide' | 'doubleSided') => {
    if (selectedMembers.length === 0) return;
    const fullMembers = await Promise.all(selectedMembers.map(m => fetchFullMember(m.id)));
    if (type === 'sideBySide') {
      generateMultipleVipCardsPDF(fullMembers);
    } else {
      generateDoubleSidedVipCardsPDF(fullMembers);
    }
    setShowPrintOptions(false);
  };

  const compressImage = (dataUrl: string, maxWidth = 300, maxHeight = 300, quality = 0.4): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingImage(true);
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          const compressed = await compressImage(base64, 300, 300, 0.4);
          setFormData(prev => ({ ...prev, [field]: compressed }));
          setUploadingImage(false);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error('Error compressing file:', err);
        setUploadingImage(false);
      }
    }
  };

  const removeImage = (field: string) => {
    setFormData(prev => ({ ...prev, [field]: '' }));
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingMember(null);
    setFormData({
      name: '',
      nickname: '',
      id_member: '',
      age: '',
      address: '',
      social_media: '',
      image_url: '',
      birth_date: '',
      team: '',
      controller_image_url: '',
      background_image_url: '',
      background_back_image_url: ''
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim() && !formData.nickname.trim() && !formData.id_member.trim()) {
      alert('Por favor, informe ao menos o Nome, Nickname ou ID do Membro VIP.');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: formData.name.trim() || formData.nickname.trim() || 'Membro VIP',
        nickname: formData.nickname.trim() || formData.name.trim() || 'VIP',
        id_member: formData.id_member.trim() || 'VIP-' + Math.floor(1000 + Math.random() * 9000),
        age: formData.age.trim(),
        address: formData.address.trim(),
        social_media: formData.social_media.trim(),
        image_url: formData.image_url,
        birth_date: formData.birth_date.trim(),
        team: formData.team.trim(),
        controller_image_url: formData.controller_image_url,
        background_image_url: formData.background_image_url,
        background_back_image_url: formData.background_back_image_url
      };

      let error = null;
      if (editingMember && editingMember.id) {
        payload.id = editingMember.id;
        const res = await supabase.from('vip_members').update(payload).eq('id', editingMember.id);
        error = res.error;
      } else {
        const res = await supabase.from('vip_members').insert([payload]);
        error = res.error;
      }

      if (error) {
        console.error('Error saving member:', error);
        alert('Erro ao salvar carteirinha VIP: ' + (error.message || String(error)));
      } else {
        alert('✨ Carteirinha VIP salva com sucesso!');
        resetForm();
        await fetchMembers();
      }
    } catch (err: any) {
      console.error('Unexpected error during handleSave:', err);
      alert('Erro ao salvar carteirinha VIP: ' + (err.message || String(err)));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza de que deseja excluir este membro VIP?')) {
      const { error } = await supabase.from('vip_members').delete().eq('id', id);
      if (error) {
        console.error('Error deleting member:', error);
        alert('Erro ao excluir membro: ' + error.message);
      } else {
        setSelectedMembers(prev => prev.filter(m => m.id !== id));
        fetchMembers();
      }
    }
  };

  const toggleSelect = (member: any) => {
    if (selectedMembers.find(m => m.id === member.id)) {
      setSelectedMembers(selectedMembers.filter(m => m.id !== member.id));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER DA SEÇÃO */}
      <div className="bg-[#111] p-6 rounded-2xl border border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div>
          <span className="text-[10px] font-bold text-[#39FF14] uppercase tracking-widest flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Módulo de Credenciamento Gamer
          </span>
          <h2 className="text-2xl font-black text-white flex items-center gap-2 mt-0.5">
            <CreditCard className="w-6 h-6 text-[#39FF14]" /> Carteirinhas VIP
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Cadastre membros VIP e gere carteirinhas personalizadas em PDF prontas para impressão
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedMembers.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPrintOptions(!showPrintOptions)}
                className="bg-[#39FF14] text-black px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg hover:brightness-110 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Selecionados ({selectedMembers.length})</span>
              </button>

              {showPrintOptions && (
                <div className="absolute top-12 right-0 bg-[#151515] border border-gray-700 rounded-xl p-3 flex flex-col gap-2 z-20 shadow-2xl w-60">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Formato do PDF</span>
                  <button
                    type="button"
                    onClick={() => handleMultiplePrint('sideBySide')}
                    className="text-left text-xs text-white hover:text-[#39FF14] p-2 hover:bg-gray-800 rounded transition font-bold"
                  >
                    ✂️ Lado a Lado (Corte & Dobra)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMultiplePrint('doubleSided')}
                    className="text-left text-xs text-white hover:text-[#39FF14] p-2 hover:bg-gray-800 rounded transition font-bold"
                  >
                    📄 Frente e Verso (Página Dupla)
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
            className="bg-[#39FF14] text-black px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg hover:brightness-110 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm ? 'Fechar Formulário' : '+ Novo Membro VIP'}</span>
          </button>
        </div>
      </div>

      {/* FORMULÁRIO DE CADASTRO / EDIÇÃO */}
      {showForm && (
        <div className="bg-[#111] p-6 rounded-2xl border border-[#39FF14]/40 space-y-6 shadow-2xl">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#39FF14]" />
              {editingMember ? 'Editar Carteirinha do Membro VIP' : 'Cadastrar Novo Membro VIP'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-gray-400 hover:text-white transition p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Nome Completo *</label>
              <input
                type="text"
                placeholder="Ex: Carlos Eduardo Silva"
                className="w-full bg-[#050505] border border-gray-700 p-3 rounded-xl text-xs text-white focus:outline-none focus:border-[#39FF14]"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Nickname / Gamer Tag *</label>
              <input
                type="text"
                placeholder="Ex: CarlinhosGamer99"
                className="w-full bg-[#050505] border border-gray-700 p-3 rounded-xl text-xs text-white focus:outline-none focus:border-[#39FF14]"
                value={formData.nickname}
                onChange={e => setFormData({ ...formData, nickname: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">ID / Matrícula VIP</label>
              <input
                type="text"
                placeholder="Ex: VIP-2026-001"
                className="w-full bg-[#050505] border border-gray-700 p-3 rounded-xl text-xs text-white focus:outline-none focus:border-[#39FF14]"
                value={formData.id_member}
                onChange={e => setFormData({ ...formData, id_member: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Time / Clube / Organização</label>
              <input
                type="text"
                placeholder="Ex: Cyber Ghost Esports"
                className="w-full bg-[#050505] border border-gray-700 p-3 rounded-xl text-xs text-white focus:outline-none focus:border-[#39FF14]"
                value={formData.team}
                onChange={e => setFormData({ ...formData, team: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Data de Nascimento</label>
              <input
                type="text"
                placeholder="Ex: 15/08/1998"
                className="w-full bg-[#050505] border border-gray-700 p-3 rounded-xl text-xs text-white focus:outline-none focus:border-[#39FF14]"
                value={formData.birth_date}
                onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Idade</label>
              <input
                type="text"
                placeholder="Ex: 26 anos"
                className="w-full bg-[#050505] border border-gray-700 p-3 rounded-xl text-xs text-white focus:outline-none focus:border-[#39FF14]"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Endereço / Cidade</label>
              <input
                type="text"
                placeholder="Ex: São Paulo - SP"
                className="w-full bg-[#050505] border border-gray-700 p-3 rounded-xl text-xs text-white focus:outline-none focus:border-[#39FF14]"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Instagram / Redes Sociais</label>
              <input
                type="text"
                placeholder="Ex: @carlinhos_pro"
                className="w-full bg-[#050505] border border-gray-700 p-3 rounded-xl text-xs text-white focus:outline-none focus:border-[#39FF14]"
                value={formData.social_media}
                onChange={e => setFormData({ ...formData, social_media: e.target.value })}
              />
            </div>
          </div>

          {/* SEÇÃO DE IMAGENS */}
          <div className="space-y-3 pt-2 border-t border-gray-800">
            <span className="text-xs font-bold text-[#39FF14] uppercase tracking-wider block">
              📸 Imagens e Arte da Carteirinha (Selecione do dispositivo)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Avatar 3x4 */}
              <div className="bg-[#050505] p-3 rounded-xl border border-gray-800 space-y-2">
                <label className="block text-xs font-bold text-gray-300">Foto do Jogador (Perfil / Avatar)</label>
                {formData.image_url ? (
                  <div className="relative group">
                    <img src={formData.image_url} alt="Avatar" className="w-full h-24 object-cover rounded-lg border border-[#39FF14]/50" />
                    <button
                      type="button"
                      onClick={() => removeImage('image_url')}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-xs hover:bg-red-500 transition"
                      title="Remover Imagem"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-24 border border-dashed border-gray-700 hover:border-[#39FF14] rounded-lg cursor-pointer bg-black/40 hover:bg-black/60 transition">
                    <Upload className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-400 font-bold">Enviar Foto Perfil</span>
                    <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'image_url')} className="hidden" />
                  </label>
                )}
              </div>

              {/* Imagem do Controle */}
              <div className="bg-[#050505] p-3 rounded-xl border border-gray-800 space-y-2">
                <label className="block text-xs font-bold text-gray-300">Ícone do Controle / Console</label>
                {formData.controller_image_url ? (
                  <div className="relative group">
                    <img src={formData.controller_image_url} alt="Control" className="w-full h-24 object-contain rounded-lg border border-[#39FF14]/50 bg-black" />
                    <button
                      type="button"
                      onClick={() => removeImage('controller_image_url')}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-xs hover:bg-red-500 transition"
                      title="Remover Imagem"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-24 border border-dashed border-gray-700 hover:border-[#39FF14] rounded-lg cursor-pointer bg-black/40 hover:bg-black/60 transition">
                    <Upload className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-400 font-bold">Enviar Controle</span>
                    <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'controller_image_url')} className="hidden" />
                  </label>
                )}
              </div>

              {/* Fundo da Frente */}
              <div className="bg-[#050505] p-3 rounded-xl border border-gray-800 space-y-2">
                <label className="block text-xs font-bold text-gray-300">Arte de Fundo (Frente)</label>
                {formData.background_image_url ? (
                  <div className="relative group">
                    <img src={formData.background_image_url} alt="Fundo Frente" className="w-full h-24 object-cover rounded-lg border border-[#39FF14]/50" />
                    <button
                      type="button"
                      onClick={() => removeImage('background_image_url')}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-xs hover:bg-red-500 transition"
                      title="Remover Imagem"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-24 border border-dashed border-gray-700 hover:border-[#39FF14] rounded-lg cursor-pointer bg-black/40 hover:bg-black/60 transition">
                    <Upload className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-400 font-bold">Enviar Fundo Frente</span>
                    <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'background_image_url')} className="hidden" />
                  </label>
                )}
              </div>

              {/* Fundo do Verso */}
              <div className="bg-[#050505] p-3 rounded-xl border border-gray-800 space-y-2">
                <label className="block text-xs font-bold text-gray-300">Arte de Fundo (Verso)</label>
                {formData.background_back_image_url ? (
                  <div className="relative group">
                    <img src={formData.background_back_image_url} alt="Fundo Verso" className="w-full h-24 object-cover rounded-lg border border-[#39FF14]/50" />
                    <button
                      type="button"
                      onClick={() => removeImage('background_back_image_url')}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-xs hover:bg-red-500 transition"
                      title="Remover Imagem"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-24 border border-dashed border-gray-700 hover:border-[#39FF14] rounded-lg cursor-pointer bg-black/40 hover:bg-black/60 transition">
                    <Upload className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-400 font-bold">Enviar Fundo Verso</span>
                    <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'background_back_image_url')} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* BOTÃO DE SALVAR */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || uploadingImage}
              className="px-8 py-3 bg-[#39FF14] hover:brightness-110 text-black font-black text-sm rounded-xl transition cursor-pointer shadow-xl flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Salvando Carteirinha...</span>
                </>
              ) : uploadingImage ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processando Imagem...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>SALVAR CARTEIRINHA VIP</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* LISTA DE MEMBROS VIP */}
      {loading ? (
        <div className="bg-[#111] p-12 rounded-2xl border border-gray-800 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#39FF14] mx-auto" />
          <p className="text-sm font-bold text-gray-400">Carregando carteirinhas VIP...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-[#111] p-12 rounded-2xl border border-gray-800 text-center space-y-3">
          <CreditCard className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Nenhuma Carteirinha VIP Cadastrada</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Clique no botão acima em "+ Novo Membro VIP" para cadastrar seu primeiro membro com foto e gerar o PDF impresso!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {members.map((member) => {
            const isSelected = selectedMembers.some(m => m.id === member.id);
            return (
              <div
                key={member.id}
                className={`bg-[#111] p-5 rounded-2xl border transition shadow-xl space-y-4 ${
                  isSelected ? 'border-[#39FF14] bg-[#162014]' : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {member.image_url ? (
                      <img
                        src={member.image_url}
                        alt={member.nickname}
                        className="w-12 h-12 object-cover rounded-xl border border-[#39FF14]/40 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-[#39FF14]" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-black text-white text-base leading-tight">{member.name || member.nickname}</h3>
                      <p className="text-xs font-bold text-[#39FF14]">@{member.nickname}</p>
                      <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">ID: {member.id_member || 'N/A'}</span>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(member)}
                    className="w-5 h-5 accent-[#39FF14] cursor-pointer shrink-0 mt-1"
                    title="Selecionar para impressão em lote"
                  />
                </div>

                <div className="text-xs space-y-1 bg-[#050505] p-3 rounded-xl border border-gray-800 text-gray-300">
                  {member.team && <p><strong className="text-gray-400">Time:</strong> {member.team}</p>}
                  {member.birth_date && <p><strong className="text-gray-400">Nascimento:</strong> {member.birth_date}</p>}
                  {member.social_media && <p><strong className="text-gray-400">Redes:</strong> {member.social_media}</p>}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(member)}
                    className="flex-1 py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl transition cursor-pointer text-center"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(member.id)}
                    className="p-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-red-400 rounded-xl transition cursor-pointer"
                    title="Excluir Carteirinha"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrint(member)}
                    className="flex-1 py-2 px-3 bg-[#39FF14]/10 hover:bg-[#39FF14]/20 border border-[#39FF14]/30 text-[#39FF14] text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Baixar PDF</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
