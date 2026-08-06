export interface Tournament {
  id: string;
  name: string;
  status: string;
  max_spots: number;
  current_spots: number;
  payment_info: string;
  entry_fee?: string;
  payment_methods?: string;
  game?: string;
  platform?: string;
  prize_1st?: string;
  prize_2nd?: string;
  prize_3rd?: string;
  created_at?: string;
}

export interface Player {
  id: string;
  nickname: string;
  status: 'Confirmado' | 'Aguardando';
  platform: string;
  name?: string;
  phone?: string;
  created_at?: string;
}

export interface FinancialRecord {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  created_at?: string;
}

export interface Ranking {
  id: string;
  player_id: string;
  game_category?: string;
  position: number;
  points: number;
  wins: number;
  losses?: number;
  draws?: number;
  matches_played?: number;
  goals_for?: number;
  goals_against?: number;
  created_at?: string;
}

export interface TournamentRegistration {
  id: string;
  tournament_id: string;
  nickname: string;
  platform: string;
  phone?: string;
  status: 'Pendente' | 'Confirmado' | 'Recusado';
  created_at?: string;
}

export interface Match {
  id: string;
  tournament_id?: string;
  game_category?: string;
  player1: string;
  player2: string;
  score1: number;
  score2: number;
  winner?: string;
  loser?: string;
  match_date?: string;
  match_time?: string;
  phase?: string;
  punishment?: string;
  status: 'Agendado' | 'Em Andamento' | 'Concluído' | 'Finalizado';
  created_at?: string;
}

export interface Penalty {
  id: string;
  player_nickname: string;
  game_category?: string;
  points_deducted: number;
  reason: string;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  created_at?: string;
}

