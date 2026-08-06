export interface Tournament {
  id: string;
  name: string;
  status: string;
  max_spots: number;
  current_spots: number;
  payment_info: string;
  game?: string;
  created_at?: string;
}

export interface Player {
  id: string;
  nickname: string;
  status: 'Confirmado' | 'Aguardando';
  platform: string;
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
  position: number;
  points: number;
  wins: number;
  losses?: number;
  draws?: number;
  matches_played?: number;
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
  tournament_id: string;
  player1: string;
  player2: string;
  score1: number;
  score2: number;
  status: 'Agendado' | 'Concluído';
  created_at?: string;
}
