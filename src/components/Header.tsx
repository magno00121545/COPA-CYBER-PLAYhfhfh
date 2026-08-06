import { useState } from 'react';
import { Download, LogOut, Menu } from 'lucide-react';
import { generateSocialMediaPDF } from '../lib/pdfExport';
import { exportDatabaseJSON } from '../lib/supabase';

interface HeaderProps {
  activeTab: string;
  onLogout?: () => void;
  onToggleSidebar: () => void;
}

export default function Header({ activeTab, onLogout, onToggleSidebar }: HeaderProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExportPDF() {
    try {
      setExporting(true);
      await generateSocialMediaPDF();
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Erro ao gerar PDF. Verifique o console.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <header className="h-16 border-b border-gray-800/50 flex items-center justify-between px-4 sm:px-8 bg-[#0a0a0a]/50 backdrop-blur-xl">
      <div className="flex items-center space-x-4">
        <button onClick={onToggleSidebar} className="md:hidden p-2 text-gray-400 hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
        <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold hidden sm:inline">Painel Administrativo</span>
        <span className="text-gray-700 hidden sm:inline">/</span>
        <span className="text-sm font-medium">{activeTab}</span>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="bg-[#39FF14]/10 hover:bg-[#39FF14] text-[#39FF14] hover:text-black border border-[#39FF14]/40 font-bold px-3 py-1.5 rounded-lg text-[10px] sm:text-xs transition cursor-pointer flex items-center gap-2"
        >
          {exporting ? (
            <>Gerando...</>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF Redes Sociais</span>
            </>
          )}
        </button>

        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold">Administrador</p>
          <p className="text-[10px] text-[#39FF14]">Super Administrador</p>
        </div>

        {onLogout && (
          <button
            onClick={async () => {
              if (confirm('Deseja fazer o download de um Backup do sistema antes de sair?')) {
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
                  // Allow browser to download before logout
                  setTimeout(onLogout, 500);
                } catch(e) {
                  console.error(e);
                  onLogout();
                }
              } else {
                onLogout();
              }
            }}
            title="Sair da área administrativa"
            className="p-2 bg-red-950/40 border border-red-800/50 hover:bg-red-900/60 text-red-400 hover:text-white rounded-lg transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        )}
      </div>
    </header>
  );
}
