const fs = require('fs');
let code = fs.readFileSync('src/components/PublicView.tsx', 'utf8');

const groupQr = `              {/* QR Code Group */}
              {whatsappGroupLink && (
                <div className="flex flex-col items-center bg-[#050505] p-5 rounded-2xl border border-blue-900/60 shadow-xl space-y-2">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 fill-current" /> GRUPO ZAP
                  </span>
                  <img
                    src={\`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=\${encodeURIComponent(whatsappGroupLink)}\`}
                    alt="QR Code do Grupo"
                    className="w-40 h-40 bg-white p-2 rounded-xl border border-blue-500/50 object-contain shadow-inner"
                  />
                  <a href={whatsappGroupLink} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400 font-bold uppercase tracking-wider hover:underline">
                    Entrar no Grupo
                  </a>
                </div>
              )}`;

const regex = /\{\/\* QR Code WhatsApp \*\/\}\s*\{whatsappNumber && \([\s\S]*?Escanear WhatsApp<\/p>\s*<\/div>\s*\)\}/;
const replacement = code.match(regex)[0] + "\n" + groupQr;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/PublicView.tsx', code);
