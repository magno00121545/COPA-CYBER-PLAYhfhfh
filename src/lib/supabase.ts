import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

function isValidUrl(urlString: string) {
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// Realtime event dispatcher & storage engine
const listeners: Array<{ table: string; callback: (payload: any) => void }> = [];

function notifyRealtime(table: string, eventType: string, record: any) {
  listeners.forEach(l => {
    if (l.table === table || l.table === '*') {
      l.callback({
        eventType,
        new: record,
        old: record
      });
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cyberplay_realtime_change', {
      detail: { table, eventType, record }
    }));
  }
}

// Initial Seed Data for fallback local storage mode (empty so user starts fresh)
function getInitialSeedData(table: string): any[] {
  return [];
}

// Function to clear all local data completely
export function clearAllDatabaseData() {
  if (typeof localStorage !== 'undefined') {
    const keys = ['tournaments', 'players', 'rankings', 'matches', 'tournament_registrations', 'financial_records'];
    keys.forEach(k => {
      localStorage.removeItem(`cyberplay_table_${k}`);
      localStorage.setItem(`cyberplay_table_${k}`, JSON.stringify([]));
      notifyRealtime(k, 'DELETE_ALL', null);
    });
  }
}

// Automatically clear pre-existing demo data once to ensure fresh clean state
if (typeof localStorage !== 'undefined' && !localStorage.getItem('cyberplay_cleaned_v2')) {
  clearAllDatabaseData();
  localStorage.setItem('cyberplay_cleaned_v2', 'true');
}

class MockQueryBuilder {
  private table: string;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private selectFields: string = '*';
  private insertRows: any[] = [];
  private updateFields: any = null;
  private filters: Array<{ col: string; val: any }> = [];
  private orderInfo: { col: string; asc: boolean } | null = null;
  private isSingle: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(fields = '*') {
    if (this.action !== 'insert') {
      this.action = 'select';
    }
    this.selectFields = fields;
    return this;
  }

  insert(data: any | any[]) {
    this.action = 'insert';
    this.insertRows = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.updateFields = data;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, val });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderInfo = { col, asc: opts?.ascending ?? true };
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async execute() {
    const key = `cyberplay_table_${this.table}`;
    let items: any[] = [];
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          items = JSON.parse(stored);
        } catch (e) {
          items = getInitialSeedData(this.table);
        }
      } else {
        items = getInitialSeedData(this.table);
        localStorage.setItem(key, JSON.stringify(items));
      }
    } else {
      items = getInitialSeedData(this.table);
    }

    if (this.action === 'select') {
      let result = [...items];
      for (const filter of this.filters) {
        result = result.filter(item => String(item[filter.col]) === String(filter.val));
      }
      if (this.orderInfo) {
        const { col, asc } = this.orderInfo;
        result.sort((a, b) => {
          if (a[col] > b[col]) return asc ? 1 : -1;
          if (a[col] < b[col]) return asc ? -1 : 1;
          return 0;
        });
      }

      // Handle special join for rankings players(nickname)
      if (this.table === 'rankings') {
        let players: any[] = [];
        if (typeof localStorage !== 'undefined') {
          try {
            players = JSON.parse(localStorage.getItem('cyberplay_table_players') || '[]');
          } catch (e) {}
        }
        if (!players.length) {
          players = getInitialSeedData('players');
        }

        result = result.map(r => {
          const player = players.find(p => p.id === r.player_id);
          return {
            ...r,
            players: { nickname: player?.nickname || 'Jogador Cyber Play' }
          };
        });
      }

      if (this.isSingle) {
        return { data: result[0] || null, error: null };
      }
      return { data: result, error: null };
    }

    if (this.action === 'insert') {
      const insertedRows: any[] = [];
      for (const row of this.insertRows) {
        const newRow = {
          id: row.id || ('id_' + Math.random().toString(36).substr(2, 9)),
          created_at: new Date().toISOString(),
          ...row
        };
        items.unshift(newRow);
        insertedRows.push(newRow);
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(items));
      }
      notifyRealtime(this.table, 'INSERT', insertedRows[0]);

      if (this.isSingle) {
        return { data: insertedRows[0] || null, error: null };
      }
      return { data: insertedRows, error: null };
    }

    if (this.action === 'update') {
      let updatedRow: any = null;
      items = items.map(item => {
        let matches = true;
        for (const filter of this.filters) {
          if (String(item[filter.col]) !== String(filter.val)) matches = false;
        }
        if (matches) {
          updatedRow = { ...item, ...this.updateFields };
          return updatedRow;
        }
        return item;
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(items));
      }
      if (updatedRow) {
        notifyRealtime(this.table, 'UPDATE', updatedRow);
      }
      return { data: updatedRow, error: null };
    }

    if (this.action === 'delete') {
      let deletedRow: any = null;
      items = items.filter(item => {
        let matches = true;
        for (const filter of this.filters) {
          if (String(item[filter.col]) !== String(filter.val)) matches = false;
        }
        if (matches) deletedRow = item;
        return !matches;
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(items));
      }
      if (deletedRow) {
        notifyRealtime(this.table, 'DELETE', deletedRow);
      }
      return { data: deletedRow, error: null };
    }

    return { data: null, error: null };
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

const fallbackClient = {
  from(table: string) {
    return new MockQueryBuilder(table);
  },
  channel(name: string) {
    return {
      on(event: string, filter: any, callback: (payload: any) => void) {
        const targetTable = filter?.table || '*';
        const listener = { table: targetTable, callback };
        listeners.push(listener);

        const customHandler = (e: any) => {
          if (e.detail.table === targetTable || targetTable === '*') {
            callback({
              eventType: e.detail.eventType,
              new: e.detail.record,
              old: e.detail.record
            });
          }
        };
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cyberplay_realtime_change', {
            detail: { table: targetTable, eventType: 'INITIAL', record: null }
          }));
          window.addEventListener('cyberplay_realtime_change', customHandler);
        }

        return {
          subscribe(statusCallback?: (status: string) => void) {
            if (statusCallback) statusCallback('SUBSCRIBED');
            return this;
          }
        };
      }
    };
  },
  removeChannel(channelObj: any) {
    return Promise.resolve();
  },
  auth: {
    getSession: () => Promise.resolve({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: () => Promise.resolve({ error: { message: 'Modo local ativado' } }),
  }
};

let rawClient: any = null;
if (isValidUrl(supabaseUrl) && supabaseAnonKey) {
  try {
    rawClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Could not initialize Supabase client, falling back to local database engine.', err);
  }
}

export const supabase = rawClient || fallbackClient;

