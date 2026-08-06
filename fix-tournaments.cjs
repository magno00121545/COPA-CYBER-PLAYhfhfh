const fs = require('fs');
let code = fs.readFileSync('src/components/TournamentsView.tsx', 'utf8');

code = code.replace("const [paymentInfo, setPaymentInfo] = useState('');", "const [paymentInfo, setPaymentInfo] = useState('');\n  const [game, setGame] = useState('');");

const insertRegex = /insert\(\[\{\s*name,\s*status: 'Inscrições abertas',\s*max_spots: parseInt\(maxSpots\),\s*current_spots: 0,\s*payment_info: paymentInfo\s*\}\]\);/;
code = code.replace(insertRegex, `insert([{ 
      name, 
      status: 'Inscrições abertas',
      max_spots: parseInt(maxSpots),
      current_spots: 0,
      payment_info: paymentInfo,
      game
    }]);`);

code = code.replace("setMaxSpots('');\n      setPaymentInfo('');", "setMaxSpots('');\n      setPaymentInfo('');\n      setGame('');");

const inputRegex = /<input\s+type="number"\s+value=\{maxSpots\}/;
code = code.replace(inputRegex, `<input
          type="text"
          value={game}
          onChange={(e) => setGame(e.target.value)}
          placeholder="Jogo (ex: EA FC 24, CS2)"
          className="bg-black border border-gray-700 p-3 rounded-lg text-white"
        />
        <input
          type="number"
          value={maxSpots}`);

// Make the form grid have 5 columns
code = code.replace("grid-cols-1 md:grid-cols-4", "grid-cols-1 md:grid-cols-5");

// Display the game on the card
code = code.replace('<p className="text-gray-400 text-sm mb-4">{t.status}</p>', '<p className="text-[#39FF14] text-xs font-bold mb-1">{t.game || \'Não especificado\'}</p>\n            <p className="text-gray-400 text-sm mb-4">{t.status}</p>');

fs.writeFileSync('src/components/TournamentsView.tsx', code);
