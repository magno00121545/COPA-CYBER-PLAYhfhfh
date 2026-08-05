import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "velvety-dock-ssjh2",
  appId: "1:322024526210:web:f90bf00a16e9d959c7bf9b",
  apiKey: "AIzaSyD_JNeoNJrQsBOE1C7n3oxUx_Yz2coyLQc",
  authDomain: "velvety-dock-ssjh2.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-cyberplay-89ba9b18-2350-4810-8567-39648fa8542b");

const listeners: Array<{ table: string; callback: (payload: any) => void }> = [];
const activeSubscriptions: Record<string, () => void> = {};

function notifyRealtime(table: string, eventType: string, record: any) {
  listeners.forEach(l => {
    if (l.table === table || l.table === '*') {
      l.callback({ eventType, new: record, old: record });
    }
  });
}

function setupFirestoreRealtime(table: string) {
  if (table === '*') return;
  if (!activeSubscriptions[table]) {
    let isInitial = true;
    activeSubscriptions[table] = onSnapshot(collection(db, table), (snapshot) => {
      if (isInitial) {
        isInitial = false;
        return; // Skip initial load
      }
      snapshot.docChanges().forEach((change) => {
        const record = change.doc.data();
        if (change.type === 'added') {
          notifyRealtime(table, 'INSERT', record);
        }
        if (change.type === 'modified') {
          notifyRealtime(table, 'UPDATE', record);
        }
        if (change.type === 'removed') {
          notifyRealtime(table, 'DELETE', record);
        }
      });
    });
  }
}

export async function clearAllDatabaseData() {
  const tables = ['tournaments', 'players', 'rankings', 'matches', 'tournament_registrations', 'financial_records'];
  for (const table of tables) {
    const snapshot = await getDocs(collection(db, table));
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, table, d.id));
    }
  }
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

  select(fields = '*') { this.action = 'select'; this.selectFields = fields; return this; }
  insert(data: any | any[]) { this.action = 'insert'; this.insertRows = Array.isArray(data) ? data : [data]; return this; }
  update(data: any) { this.action = 'update'; this.updateFields = data; return this; }
  delete() { this.action = 'delete'; return this; }
  eq(col: string, val: any) { this.filters.push({ col, val }); return this; }
  order(col: string, opts?: { ascending?: boolean }) { this.orderInfo = { col, asc: opts?.ascending ?? true }; return this; }
  single() { this.isSingle = true; return this; }

  async execute() {
    try {
      if (this.action === 'select') {
        const snapshot = await getDocs(collection(db, this.table));
        let result = snapshot.docs.map(d => d.data());
        
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

        if (this.table === 'rankings') {
          const playersSnap = await getDocs(collection(db, 'players'));
          const players = playersSnap.docs.map(d => d.data());
          result = result.map(r => {
            const player = players.find(p => p.id === r.player_id);
            return {
              ...r,
              players: { nickname: player?.nickname || 'Jogador Cyber Play' }
            };
          });
        }

        if (this.isSingle) return { data: result[0] || null, error: null };
        return { data: result, error: null };
      }

      if (this.action === 'insert') {
        const insertedRows: any[] = [];
        for (const row of this.insertRows) {
          const newRow: any = {
            id: row.id || ('id_' + Math.random().toString(36).substr(2, 9)),
            created_at: new Date().toISOString(),
            ...row
          };
          // Convert any undefined to null to prevent Firestore errors
          Object.keys(newRow).forEach(k => {
            if (newRow[k] === undefined) newRow[k] = null;
          });
          
          await setDoc(doc(db, this.table, newRow.id), newRow);
          insertedRows.push(newRow);
        }
        if (this.isSingle) return { data: insertedRows[0] || null, error: null };
        return { data: insertedRows, error: null };
      }

      if (this.action === 'update') {
        const snapshot = await getDocs(collection(db, this.table));
        const items = snapshot.docs.map(d => d.data());
        let updatedRow: any = null;
        for (const item of items) {
          let matches = true;
          for (const filter of this.filters) {
            if (String(item[filter.col]) !== String(filter.val)) matches = false;
          }
          if (matches) {
            updatedRow = { ...item, ...this.updateFields };
            // Convert any undefined to null
            Object.keys(updatedRow).forEach(k => {
              if (updatedRow[k] === undefined) updatedRow[k] = null;
            });
            await setDoc(doc(db, this.table, item.id), updatedRow, { merge: true });
          }
        }
        return { data: updatedRow, error: null };
      }

      if (this.action === 'delete') {
        const snapshot = await getDocs(collection(db, this.table));
        const items = snapshot.docs.map(d => d.data());
        let deletedRow: any = null;
        for (const item of items) {
          let matches = true;
          for (const filter of this.filters) {
            if (String(item[filter.col]) !== String(filter.val)) matches = false;
          }
          if (matches) {
            deletedRow = item;
            await deleteDoc(doc(db, this.table, item.id));
          }
        }
        return { data: deletedRow, error: null };
      }

      return { data: null, error: null };
    } catch (e: any) {
      console.error('Supabase MockQueryBuilder error:', e);
      return { data: null, error: { message: e.message || String(e) } };
    }
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export const supabase = {
  from(table: string) {
    return new MockQueryBuilder(table);
  },
  channel(name: string) {
    return {
      on(event: string, filter: any, callback: (payload: any) => void) {
        const targetTable = filter?.table || '*';
        const listener = { table: targetTable, callback };
        listeners.push(listener);
        
        if (targetTable !== '*') {
           setupFirestoreRealtime(targetTable);
        } else {
           ['tournaments', 'players', 'rankings', 'matches', 'tournament_registrations', 'settings'].forEach(t => setupFirestoreRealtime(t));
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
    onAuthStateChange: (cb?: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: () => Promise.resolve({ error: { message: 'Modo local ativado' } }),
  }
};

export async function exportDatabaseJSON() {
  const tables = ['tournaments', 'players', 'rankings', 'matches', 'tournament_registrations', 'financial_records', 'settings'];
  const data: Record<string, any[]> = {};
  for (const table of tables) {
    const snapshot = await getDocs(collection(db, table));
    data[table] = snapshot.docs.map(d => d.data());
  }
  return JSON.stringify(data, null, 2);
}

export async function importDatabaseJSON(jsonStr: string) {
  const data = JSON.parse(jsonStr);
  const tables = Object.keys(data);
  for (const table of tables) {
    const items = data[table];
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.id) {
          await setDoc(doc(db, table, item.id), item);
        }
      }
    }
  }
}
