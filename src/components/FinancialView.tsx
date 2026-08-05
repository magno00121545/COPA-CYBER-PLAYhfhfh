import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { FinancialRecord } from '../lib/types';

export default function FinancialView() {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    const { data, error } = await supabase.from('financial_records').select('*');
    if (error) console.error('Error fetching records:', error);
    else setRecords(data || []);
  }

  const filteredRecords = useMemo(() => {
    if (filter === 'all') return records;
    return records.filter(r => r.type === filter);
  }, [records, filter]);

  const totals = useMemo(() => {
    const income = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const expense = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    return { income, expense, balance: income - expense };
  }, [records]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111] p-5 rounded-xl border border-gray-800 shadow-xl">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Entradas</p>
          <h3 className="text-2xl font-black text-[#39FF14]">R$ {totals.income.toFixed(2)}</h3>
        </div>
        <div className="bg-[#111] p-5 rounded-xl border border-gray-800 shadow-xl">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Saídas</p>
          <h3 className="text-2xl font-black text-red-500">R$ {totals.expense.toFixed(2)}</h3>
        </div>
        <div className="bg-[#111] p-5 rounded-xl border border-gray-800 shadow-xl">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Saldo</p>
          <h3 className={`text-2xl font-black ${totals.balance >= 0 ? 'text-white' : 'text-red-500'}`}>R$ {totals.balance.toFixed(2)}</h3>
        </div>
      </div>

      <div className="flex gap-2">
        {(['all', 'income', 'expense'] as const).map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize ${filter === f ? 'bg-[#39FF14] text-black' : 'bg-gray-800 text-white'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-[#111] rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-900 text-gray-500 uppercase font-bold text-xs">
            <tr>
              <th className="p-4">Descrição</th>
              <th className="p-4">Tipo</th>
              <th className="p-4 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((r) => (
              <tr key={r.id} className="border-t border-gray-800">
                <td className="p-4">{r.description}</td>
                <td className="p-4 capitalize">{r.type}</td>
                <td className={`p-4 text-right font-bold ${r.type === 'income' ? 'text-[#39FF14]' : 'text-red-500'}`}>
                  {r.type === 'income' ? '+' : '-'} R$ {r.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
