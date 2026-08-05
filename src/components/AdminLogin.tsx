import { useState } from 'react';
import type { FormEvent } from 'react';
import { Lock, ArrowLeft, ShieldAlert } from 'lucide-react';

interface AdminLoginProps {
  onLogin: () => void;
  onBackToPublic?: () => void;
}

export default function AdminLogin({ onLogin, onBackToPublic }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (password === '258090') {
        onLogin();
      } else {
        setError('Senha de acesso incorreta. Tente novamente.');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#050505] p-4">
      <div className="w-full max-w-md bg-[#111] p-8 rounded-2xl border border-gray-800 space-y-6 shadow-2xl relative">
        {onBackToPublic && (
          <button 
            onClick={onBackToPublic}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#39FF14] transition font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Portal Público
          </button>
        )}

        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-wide">Área Administrativa</h2>
          <p className="text-xs text-gray-400">Digite a senha de administrador para acessar o painel de controle do Cyberplay.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-500/50 text-red-300 rounded-xl text-xs flex items-center gap-2 font-bold">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Senha de Acesso
            </label>
            <input 
              type="password" 
              placeholder="Digite a senha (ex: 258090)" 
              className="w-full bg-[#050505] border border-gray-700 p-3.5 rounded-xl text-white font-mono text-center tracking-widest text-lg focus:outline-none focus:border-[#39FF14] transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>

          <button 
            type="submit"
            disabled={loading || !password}
            className="w-full bg-[#39FF14] text-black font-black p-3.5 rounded-xl hover:brightness-110 transition disabled:opacity-40 cursor-pointer text-sm"
          >
            {loading ? 'AUTENTICANDO...' : 'ENTRAR NO PAINEL'}
          </button>
        </form>

        <p className="text-[10px] text-gray-500 text-center font-mono">
          CYBER PLAY SYSTEM • PROTEÇÃO ADMINISTRATIVA
        </p>
      </div>
    </div>
  );
}

