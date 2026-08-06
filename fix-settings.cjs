const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');

code = code.replace("const [whatsappNumber, setWhatsappNumber] = useState('');", "const [whatsappNumber, setWhatsappNumber] = useState('');\n  const [whatsappGroupLink, setWhatsappGroupLink] = useState('');");

const loadSettingsRegex = /setWhatsappNumber\(data\.whatsappNumber \|\| ''\);/;
code = code.replace(loadSettingsRegex, "setWhatsappNumber(data.whatsappNumber || '');\n      setWhatsappGroupLink(data.whatsappGroupLink || '');");

const handleSaveRegex = /whatsappNumber,\n\s*pixInstructions,\n\s*sponsors\n\s*\}\)/g;
code = code.replace(handleSaveRegex, "whatsappNumber,\n      whatsappGroupLink,\n      pixInstructions,\n      sponsors\n    })");

const handleSaveInsertRegex = /whatsappNumber,\n\s*pixInstructions,\n\s*sponsors\n\s*\}\);/g;
code = code.replace(handleSaveInsertRegex, "whatsappNumber,\n            whatsappGroupLink,\n            pixInstructions,\n            sponsors\n        });");


const groupInputJSX = `
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
`;

code = code.replace("</p>\n        </div>\n\n        <div>", "</p>\n        </div>" + groupInputJSX + "\n\n        <div>");

const qrCodesRegex = /whatsappNumber && \([\s\S]*?\{\/\* Zona de Backup e Restore \*\/\}/;
// Let's just find the whatsappNumber display in the preview section and add whatsappGroupLink preview there.

const whatsappPreview = `            {whatsappNumber && (
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
            )}`;

const newWhatsappPreview = `            {whatsappNumber && (
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
                  src={\`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=\${encodeURIComponent(whatsappGroupLink)}\`}
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
            )}`;
            
code = code.replace(whatsappPreview, newWhatsappPreview);

fs.writeFileSync('src/components/SettingsView.tsx', code);
