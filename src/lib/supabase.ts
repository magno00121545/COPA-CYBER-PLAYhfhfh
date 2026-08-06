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

// Local storage helper with memory fallback
const memoryStore: Record<string, any[]> = {};

function getLocalStorageData(table: string): any[] {
  if (memoryStore[table] && memoryStore[table].length > 0) {
    return memoryStore[table];
  }
  try {
    const raw = localStorage.getItem(`cyberplay_db_${table}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryStore[table] = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn(`Error reading local storage for ${table}:`, e);
  }
  if (!memoryStore[table]) memoryStore[table] = [];
  return memoryStore[table];
}

function setLocalStorageData(table: string, data: any[]) {
  memoryStore[table] = data;
  try {
    localStorage.setItem(`cyberplay_db_${table}`, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error writing local storage for ${table} (quota or size limit):`, e);
  }
}

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
    try {
      activeSubscriptions[table] = onSnapshot(
        collection(db, table),
        (snapshot) => {
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
        },
        (error) => {
          console.warn(`Firestore subscription error on table ${table} (quota or offline):`, error.message);
        }
      );
    } catch (e) {
      console.warn(`Failed to set up Firestore realtime on ${table}:`, e);
    }
  }
}

export async function clearAllDatabaseData() {
  const tables = ['tournaments', 'players', 'rankings', 'matches', 'tournament_registrations', 'financial_records', 'categories', 'settings', 'vip_members'];
  for (const table of tables) {
    setLocalStorageData(table, []);
    try {
      const snapshot = await getDocs(collection(db, table));
      for (const d of snapshot.docs) {
        await deleteDoc(doc(db, table, d.id));
      }
    } catch (e) {
      console.warn(`Error clearing Firestore table ${table}:`, e);
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
        let result: any[] = [];
        let fetchedFromFirestore = false;

        try {
          const snapshot = await getDocs(collection(db, this.table));
          result = snapshot.docs.map(d => d.data());
          fetchedFromFirestore = true;
          if (result.length > 0) {
            setLocalStorageData(this.table, result);
          }
        } catch (e) {
          console.warn(`Firestore select failed for ${this.table} (using local storage fallback):`, e);
        }

        if (!fetchedFromFirestore || result.length === 0) {
          result = getLocalStorageData(this.table);
        }

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
          let players: any[] = [];
          try {
            const playersSnap = await getDocs(collection(db, 'players'));
            players = playersSnap.docs.map(d => d.data());
          } catch (e) {
            players = getLocalStorageData('players');
          }

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
        const localData = getLocalStorageData(this.table);
        const insertedRows: any[] = [];

        for (const row of this.insertRows) {
          const generatedId = 'id_' + Math.random().toString(36).substr(2, 9);
          const finalId = (row.id && String(row.id).trim() !== '') ? String(row.id) : generatedId;

          const newRow: any = {
            created_at: new Date().toISOString(),
            ...row,
            id: finalId
          };

          Object.keys(newRow).forEach(k => {
            if (newRow[k] === undefined) newRow[k] = null;
          });

          // Save locally first
          localData.unshift(newRow);
          insertedRows.push(newRow);

          // Attempt Firestore sync
          try {
            await setDoc(doc(db, this.table, newRow.id), newRow);
          } catch (e) {
            console.warn(`Firestore insert sync failed for ${this.table} (saved locally):`, e);
          }
        }

        setLocalStorageData(this.table, localData);
        notifyRealtime(this.table, 'INSERT', insertedRows[0]);

        if (this.isSingle) return { data: insertedRows[0] || null, error: null };
        return { data: insertedRows, error: null };
      }

      if (this.action === 'update') {
        const localData = getLocalStorageData(this.table);
        let updatedRow: any = null;
        let found = false;

        const updatedLocal = localData.map(item => {
          let matches = true;
          for (const filter of this.filters) {
            if (String(item[filter.col]) !== String(filter.val)) matches = false;
          }
          if (matches) {
            found = true;
            updatedRow = { ...item, ...this.updateFields };
            Object.keys(updatedRow).forEach(k => {
              if (updatedRow[k] === undefined) updatedRow[k] = null;
            });
            return updatedRow;
          }
          return item;
        });

        if (!found) {
          const filterId = this.filters.find(f => f.col === 'id')?.val;
          updatedRow = {
            id: filterId || ('id_' + Math.random().toString(36).substr(2, 9)),
            created_at: new Date().toISOString(),
            ...this.updateFields
          };
          Object.keys(updatedRow).forEach(k => {
            if (updatedRow[k] === undefined) updatedRow[k] = null;
          });
          updatedLocal.unshift(updatedRow);
        }

        setLocalStorageData(this.table, updatedLocal);
        notifyRealtime(this.table, 'UPDATE', updatedRow);

        try {
          if (updatedRow && updatedRow.id) {
            await setDoc(doc(db, this.table, updatedRow.id), updatedRow, { merge: true });
          }
        } catch (e) {
          console.warn(`Firestore update sync failed for ${this.table} (saved locally):`, e);
        }

        return { data: updatedRow, error: null };
      }

      if (this.action === 'delete') {
        const localData = getLocalStorageData(this.table);
        let deletedRow: any = null;

        const remaining = localData.filter(item => {
          let matches = true;
          for (const filter of this.filters) {
            if (String(item[filter.col]) !== String(filter.val)) matches = false;
          }
          if (matches) {
            deletedRow = item;
            return false;
          }
          return true;
        });

        if (deletedRow) {
          setLocalStorageData(this.table, remaining);
          notifyRealtime(this.table, 'DELETE', deletedRow);

          try {
            await deleteDoc(doc(db, this.table, deletedRow.id));
          } catch (e) {
            console.warn(`Firestore delete sync failed for ${this.table} (deleted locally):`, e);
          }
        }

        return { data: deletedRow, error: null };
      }

      return { data: null, error: null };
    } catch (e: any) {
      console.error('Supabase MockQueryBuilder error:', e);
      return { data: null, error: null }; // Avoid throwing unhandled error to UI
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
          ['tournaments', 'players', 'rankings', 'matches', 'tournament_registrations', 'settings', 'categories', 'vip_members'].forEach(t => setupFirestoreRealtime(t));
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
  const tables = ['tournaments', 'players', 'rankings', 'matches', 'tournament_registrations', 'financial_records', 'settings', 'categories'];
  const data: Record<string, any[]> = {};
  for (const table of tables) {
    let items = getLocalStorageData(table);
    try {
      const snapshot = await getDocs(collection(db, table));
      if (snapshot.docs.length > 0) {
        items = snapshot.docs.map(d => d.data());
      }
    } catch (e) {
      console.warn(`Error exporting table ${table} from Firestore:`, e);
    }
    data[table] = items;
  }
  return JSON.stringify(data, null, 2);
}

export async function importDatabaseJSON(jsonStr: string) {
  const data = JSON.parse(jsonStr);
  const tables = Object.keys(data);
  for (const table of tables) {
    const items = data[table];
    if (Array.isArray(items)) {
      setLocalStorageData(table, items);
      for (const item of items) {
        if (item.id) {
          try {
            await setDoc(doc(db, table, item.id), item);
          } catch (e) {
            console.warn(`Error importing item ${item.id} into Firestore table ${table}:`, e);
          }
        }
      }
    }
  }
}

