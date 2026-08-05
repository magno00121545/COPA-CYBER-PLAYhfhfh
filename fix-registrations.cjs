const fs = require('fs');
let code = fs.readFileSync('src/components/RegistrationsView.tsx', 'utf8');

code = code.replace("import { CheckCircle2, XCircle, Trash2, Search, Filter, UserCheck, ShieldAlert, RefreshCw, Clock, BellRing, Radio, MessageCircle } from 'lucide-react';", "import { CheckCircle2, XCircle, Trash2, Search, Filter, UserCheck, ShieldAlert, RefreshCw, Clock, BellRing, Radio, MessageCircle, FileText } from 'lucide-react';\nimport { generateRegistrationReceiptPDF } from '../lib/pdfExport';");

const oldTrash = `                        <button
                          onClick={() => deleteRegistration(r.id)}
                          disabled={actionLoading === r.id}
                          className="p-1.5 text-gray-500 hover:text-red-400 transition cursor-pointer rounded-lg hover:bg-red-950/30"
                          title="Excluir inscrição"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>`;

const newTrash = `                        <button
                          onClick={() => generateRegistrationReceiptPDF(r, tName)}
                          className="p-1.5 text-gray-500 hover:text-blue-400 transition cursor-pointer rounded-lg hover:bg-blue-950/30"
                          title="Gerar PDF do Comprovante"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteRegistration(r.id)}
                          disabled={actionLoading === r.id}
                          className="p-1.5 text-gray-500 hover:text-red-400 transition cursor-pointer rounded-lg hover:bg-red-950/30"
                          title="Excluir inscrição"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>`;

code = code.replace(oldTrash, newTrash);

fs.writeFileSync('src/components/RegistrationsView.tsx', code);
