import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Printer } from 'lucide-react';
import { generateVipCardPDF, generateMultipleVipCardsPDF, generateDoubleSidedVipCardsPDF } from '../lib/pdfExport';

export default function VipCardsView() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [showPrintOptions, setShowPrintOptions] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    setLoading(true);
    // Use Supabase as defined in the existing app (it seems to be using Supabase based on lib/supabase)
    const { data } = await supabase.from('vip_members').select('*');
    setMembers(data || []);
    setLoading(false);
  }

  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', nickname: '', id_member: '', age: '', address: '', social_media: '', image_url: '', birth_date: '', team: '', controller_image_url: '', background_image_url: '', background_back_image_url: '' });

  const handleSave = async () => {
    let error;
    if (editingMember) {
      const res = await supabase.from('vip_members').update(formData).eq('id', editingMember.id);
      error = res.error;
    } else {
      const res = await supabase.from('vip_members').insert([formData]);
      error = res.error;
    }

    if (error) {
      console.error('Error saving member:', error);
      alert('Erro ao salvar membro: ' + error.message);
    } else {
      setShowForm(false);
      setEditingMember(null);
      setFormData({ name: '', nickname: '', id_member: '', age: '', address: '', social_media: '', image_url: '', birth_date: '', team: '', controller_image_url: '', background_image_url: '', background_back_image_url: '' });
      fetchMembers();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      const { error } = await supabase.from('vip_members').delete().eq('id', id);
      if (error) {
        console.error('Error deleting member:', error);
        alert('Erro ao excluir membro: ' + error.message);
      } else {
        fetchMembers();
      }
    }
  };

  const handleEdit = (member: any) => {
    setEditingMember(member);
    setFormData(member);
    setShowForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Membros VIP</h2>
        <div className="flex gap-2">
          {selectedMembers.length > 0 && (
            <div className="relative">
                <button onClick={() => setShowPrintOptions(!showPrintOptions)} className="bg-[#39FF14] text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                    <Printer className="w-4 h-4" /> Imprimir ({selectedMembers.length})
                </button>
                {showPrintOptions && (
                    <div className="absolute top-12 right-0 bg-[#111] border border-gray-800 rounded-lg p-2 flex flex-col gap-2 z-10">
                        <button onClick={() => { generateMultipleVipCardsPDF(selectedMembers); setShowPrintOptions(false); }} className="text-white text-sm hover:text-[#39FF14]">Lado a Lado (Corte e Dobre)</button>
                        <button onClick={() => { generateDoubleSidedVipCardsPDF(selectedMembers); setShowPrintOptions(false); }} className="text-white text-sm hover:text-[#39FF14]">Frente e Verso (Impressão)</button>
                    </div>
                )}
            </div>
          )}
          <button onClick={() => setShowForm(!showForm)} className="bg-[#39FF14] text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> {showForm ? 'Cancelar' : 'Novo Membro'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-[#111] p-6 rounded-xl border border-gray-800 space-y-4">
          <input placeholder="Nome" className="w-full bg-black p-2 rounded border border-gray-800" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <input placeholder="Nickname" className="w-full bg-black p-2 rounded border border-gray-800" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} />
          <input placeholder="ID" className="w-full bg-black p-2 rounded border border-gray-800" value={formData.id_member} onChange={e => setFormData({...formData, id_member: e.target.value})} />
          <input placeholder="Idade" className="w-full bg-black p-2 rounded border border-gray-800" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
          <input placeholder="Data de Nascimento" className="w-full bg-black p-2 rounded border border-gray-800" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} />
          <input placeholder="Time/Clube" className="w-full bg-black p-2 rounded border border-gray-800" value={formData.team} onChange={e => setFormData({...formData, team: e.target.value})} />
          <input placeholder="Endereço" className="w-full bg-black p-2 rounded border border-gray-800" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          <input placeholder="Redes Sociais (Link)" className="w-full bg-black p-2 rounded border border-gray-800" value={formData.social_media} onChange={e => setFormData({...formData, social_media: e.target.value})} />
          
          <label className="block text-xs text-gray-400">Avatar:</label>
          <input type="file" accept="image/*" className="w-full bg-black p-2 rounded border border-gray-800" onChange={e => handleFileChange(e, 'image_url')} />
          
          <label className="block text-xs text-gray-400">Imagem do Controle (Gamer):</label>
          <input type="file" accept="image/*" className="w-full bg-black p-2 rounded border border-gray-800" onChange={e => handleFileChange(e, 'controller_image_url')} />
          
          <label className="block text-xs text-gray-400">Imagem de Fundo (Gamer):</label>
          <input type="file" accept="image/*" className="w-full bg-black p-2 rounded border border-gray-800" onChange={e => handleFileChange(e, 'background_image_url')} />
          
          <label className="block text-xs text-gray-400">Imagem de Fundo Verso:</label>
          <input type="file" accept="image/*" className="w-full bg-black p-2 rounded border border-gray-800" onChange={e => handleFileChange(e, 'background_back_image_url')} />
          
          <button onClick={handleSave} className="bg-[#39FF14] text-black px-4 py-2 rounded font-bold w-full">SALVAR</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <div key={member.id} className="bg-[#111] p-4 rounded-xl border border-gray-800">
            <div className="flex justify-between items-start">
              <h3 className="font-bold">{member.name}</h3>
              <input type="checkbox" checked={selectedMembers.some(m => m.id === member.id)} onChange={() => toggleSelect(member)} className="accent-[#39FF14]" />
            </div>
            <p className="text-gray-400 text-sm">ID: {member.id_member}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => handleEdit(member)} className="flex-1 text-xs border border-gray-700 py-2 rounded hover:bg-gray-800">Editar</button>
              <button onClick={() => handleDelete(member.id)} className="flex-1 text-xs border border-red-900 text-red-500 py-2 rounded hover:bg-red-900/20">Excluir</button>
              <button onClick={() => generateVipCardPDF(member)} className="flex-1 bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20 py-2 rounded hover:bg-[#39FF14]/20 flex items-center justify-center gap-1">
                <Printer className="w-3 h-3" /> PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
