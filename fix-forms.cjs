const fs = require('fs');
let code = fs.readFileSync('src/components/PublicView.tsx', 'utf8');

// Remove the inline register function
code = code.replace(/async function register[\s\S]*?setRegisteredSuccess\(true\);\n  \}/, '');

// In the card rendering:
const cardJSXRegex = /\{registering === t\.id \? \([\s\S]*?\) : \([\s\S]*?Garantir Vaga[\s\S]*?\)\}/;
const newCardJSX = `
                <button
                  className="w-full bg-[#39FF14] text-black font-black p-3 rounded-xl text-sm hover:brightness-110 transition cursor-pointer mt-2"
                  onClick={() => {
                    setSelectedTournamentId(t.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Garantir Vaga
                </button>
`;
code = code.replace(cardJSXRegex, newCardJSX);

fs.writeFileSync('src/components/PublicView.tsx', code);
