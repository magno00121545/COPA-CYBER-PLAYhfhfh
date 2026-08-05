const fs = require('fs');
let code = fs.readFileSync('src/lib/supabase.ts', 'utf8');

const oldChannel = `  channel(name: string) {
    return {
      on(event: string, filter: any, callback: (payload: any) => void) {
        const targetTable = filter?.table || '*';
        const listener = { table: targetTable, callback };
        listeners.push(listener);
        
        if (targetTable !== '*') {
           setupFirestoreRealtime(targetTable);
        }

        return {
          subscribe(statusCallback?: (status: string) => void) {
            if (statusCallback) statusCallback('SUBSCRIBED');
            return this;
          }
        };
      }
    };
  },`;

const newChannel = `  channel(name: string) {
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
  },`;

code = code.replace(oldChannel, newChannel);
fs.writeFileSync('src/lib/supabase.ts', code);
