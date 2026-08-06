import { supabase } from './supabase';
import { Category } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_efootball', name: 'eFootball', icon: '⚽', description: 'Futebol Digital (eFootball / PES)' },
  { id: 'cat_eafc', name: 'EA FC 24', icon: '🎮', description: 'EA Sports FC / FIFA' },
  { id: 'cat_futebol', name: 'Futebol', icon: '⚽', description: 'Torneios de Futebol em Geral' },
  { id: 'cat_freefire', name: 'Free Fire', icon: '🔥', description: 'Free Fire Mobile e Emulador' },
  { id: 'cat_cs2', name: 'FPS / CS2', icon: '🔫', description: 'Counter-Strike 2, Valorant e Tiro' },
  { id: 'cat_luta', name: 'Luta', icon: '🥊', description: 'Mortal Kombat, Tekken, Street Fighter' },
  { id: 'cat_corrida', name: 'Corrida', icon: '🏎️', description: 'F1 24, Gran Turismo, Forza' },
  { id: 'cat_moba', name: 'MOBA / Valorant', icon: '👑', description: 'Valorant, League of Legends, Wild Rift' },
  { id: 'cat_clash', name: 'Clash Royale', icon: '🕹️', description: 'Clash Royale e Jogos Mobile' },
];

export async function fetchCategories(): Promise<Category[]> {
  try {
    const { data } = await supabase.from('categories').select('*');
    if (data && data.length > 0) {
      return data as Category[];
    }
  } catch (error) {
    console.warn('Could not fetch categories from table, using defaults', error);
  }
  return DEFAULT_CATEGORIES;
}

export async function saveCategory(category: Partial<Category>): Promise<Category[]> {
  const newCat: Category = {
    id: category.id || 'cat_' + Date.now(),
    name: category.name || 'Nova Categoria',
    icon: category.icon || '🎮',
    description: category.description || '',
    created_at: new Date().toISOString()
  };

  await supabase.from('categories').insert(newCat);
  return fetchCategories();
}

export async function deleteCategory(id: string): Promise<Category[]> {
  await supabase.from('categories').delete().eq('id', id);
  return fetchCategories();
}
