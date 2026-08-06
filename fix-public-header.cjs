const fs = require('fs');
let code = fs.readFileSync('src/components/PublicView.tsx', 'utf8');

const oldHeader = `        <button onClick={onGoToAdmin} className="text-gray-400 hover:text-[#39FF14] text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer">
          <ShieldCheck className="w-4 h-4" /> Area do Administrador
        </button>
      </header>`;

const newHeader = `        <div className="flex items-center gap-4">
          {whatsappGroupLink && (
            <a 
              href={whatsappGroupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span className="hidden sm:inline">Entrar no Grupo</span>
            </a>
          )}
          <button onClick={onGoToAdmin} className="text-gray-400 hover:text-[#39FF14] text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer">
            <ShieldCheck className="w-4 h-4" /> <span className="hidden sm:inline">Area do Administrador</span>
          </button>
        </div>
      </header>`;
code = code.replace(oldHeader, newHeader);

// Wait, fix-public-group.cjs might have messed up if the regex matched, but the regex `renderHeaderRegex` did not match because the header was different.
fs.writeFileSync('src/components/PublicView.tsx', code);
