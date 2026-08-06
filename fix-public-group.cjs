const fs = require('fs');
let code = fs.readFileSync('src/components/PublicView.tsx', 'utf8');

code = code.replace("const [whatsappNumber, setWhatsappNumber] = useState('');", "const [whatsappNumber, setWhatsappNumber] = useState('');\n  const [whatsappGroupLink, setWhatsappGroupLink] = useState('');");

code = code.replace(/setWhatsappNumber\(data\.whatsappNumber \|\| ''\);/g, "setWhatsappNumber(data.whatsappNumber || '');\n      setWhatsappGroupLink(data.whatsappGroupLink || '');");

const renderHeaderRegex = /<\/div>\s*<\/div>\s*<\/header>/;
const whatsappGroupBtn = `
          {whatsappGroupLink && (
            <a 
              href={whatsappGroupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold px-4 py-2 rounded-lg text-sm transition flex items-center gap-2 mt-4 sm:mt-0"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              Entrar no Grupo
            </a>
          )}
`;
code = code.replace(renderHeaderRegex, whatsappGroupBtn + "\n      </div>\n    </div>\n  </header>");

fs.writeFileSync('src/components/PublicView.tsx', code);
