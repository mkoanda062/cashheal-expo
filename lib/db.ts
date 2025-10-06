import { openDatabaseSync } from 'expo-sqlite';

// Use sync API compatible with the new architecture
// Cast to any to avoid strict typing issues across Expo SDK versions
const db: any = openDatabaseSync('cashheal.db');

export function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      // Notes table (demo)
      tx.executeSql('CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL);');

      // Balances (single row with id=1)
      tx.executeSql('CREATE TABLE IF NOT EXISTS balances (id INTEGER PRIMARY KEY, total REAL NOT NULL, current REAL NOT NULL);');

      // Spending categories
      tx.executeSql('CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE, label TEXT NOT NULL, amount REAL NOT NULL, color TEXT NOT NULL, emoji TEXT NOT NULL);');

      // Transactions history
      tx.executeSql('CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL CHECK (type IN (\'income\', \'expense\')), categoryKey TEXT, amount REAL NOT NULL, createdAt INTEGER NOT NULL);');

      // Seed balances if empty
      tx.executeSql('SELECT COUNT(*) as count FROM balances;', [], (_t: any, result: any) => {
        const count = (result.rows as any).item(0).count as number;
        if (count === 0) {
          tx.executeSql('INSERT INTO balances (id, total, current) VALUES (1, ?, ?);', [350, 150]);
        }
      });

      // Seed categories if empty
      tx.executeSql('SELECT COUNT(*) as count FROM categories;', [], (_t: any, result: any) => {
        const count = (result.rows as any).item(0).count as number;
        if (count === 0) {
          const seed: [string, string, number, string, string][] = [
            ['food', 'Nourriture', 20, '#10b981', '🍕'],
            ['fun', 'Loisirs', 50, '#22c55e', '🎮'],
            ['clothes', 'Vêtements', 30, '#16a34a', '👕'],
            ['transport', 'Transport', 15, '#15803d', '🚌'],
          ];
          seed.forEach(([key, label, amount, color, emoji]) =>
            tx.executeSql('INSERT OR IGNORE INTO categories (key, label, amount, color, emoji) VALUES (?, ?, ?, ?, ?);', [key, label, amount, color, emoji])
          );
        }
      });

      resolve();
    }, (error: any) => reject(error));
  });
}

export function addNote(title: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'INSERT INTO notes (title) VALUES (?);',
        [title],
        () => resolve(),
        (_t: any, error: any) => {
          reject(error);
          return true;
        }
      );
    });
  });
}

export function getNotes(): Promise<{ id: number; title: string }[]> {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'SELECT id, title FROM notes ORDER BY id DESC;',
        [],
        (_t: any, result: any) => {
          const rows = result.rows;
          const data: { id: number; title: string }[] = [];
          for (let i = 0; i < rows.length; i++) {
            data.push(rows.item(i));
          }
          resolve(data);
        },
        (_t: any, error: any) => {
          reject(error);
          return true;
        }
      );
    });
  });
}

export type Balance = { total: number; current: number };
export type Category = { id: number; key: string; label: string; amount: number; color: string; emoji: string };

export function getBalance(): Promise<Balance> {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'SELECT total, current FROM balances WHERE id=1;',
        [],
        (_t: any, result: any) => {
          if (result.rows.length > 0) {
            const row = result.rows.item(0) as any;
            resolve({ total: row.total, current: row.current });
          } else {
            resolve({ total: 0, current: 0 });
          }
        },
        (_t: any, error: any) => {
          reject(error);
          return true;
        }
      );
    });
  });
}

export function getCategories(): Promise<Category[]> {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'SELECT id, key, label, amount, color, emoji FROM categories ORDER BY id ASC;',
        [],
        (_t: any, result: any) => {
          const rows = result.rows;
          const items: Category[] = [];
          for (let i = 0; i < rows.length; i++) {
            items.push(rows.item(i));
          }
          resolve(items);
        },
        (_t: any, error: any) => {
          reject(error);
          return true;
        }
      );
    });
  });
}

export function setBalance(total: number, current: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      // Try update first; if no row, insert
      tx.executeSql(
        'UPDATE balances SET total=?, current=? WHERE id=1;',
        [total, current],
        (_t: any, res: any) => {
          const affected = (res as any).rowsAffected as number;
          if (!affected || affected === 0) {
            tx.executeSql('INSERT INTO balances (id, total, current) VALUES (1, ?, ?);', [total, current], () => resolve());
          } else {
            resolve();
          }
        },
        (_t: any, error: any) => {
          reject(error);
          return true;
        }
      );
    });
  });
}

export function updateCategoryAmount(key: string, delta: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'UPDATE categories SET amount = amount + ? WHERE key = ?;',
        [delta, key],
        () => resolve(),
        (_t: any, error: any) => {
          reject(error);
          return true;
        }
      );
    });
  });
}

export type Transaction = { id: number; type: 'income' | 'expense'; categoryKey?: string | null; amount: number; createdAt: number };

export function addTransaction(type: 'income' | 'expense', amount: number, categoryKey?: string | null): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'INSERT INTO transactions (type, categoryKey, amount, createdAt) VALUES (?, ?, ?, ?);',
        [type, categoryKey ?? null, amount, Date.now()],
        () => resolve(),
        (_t: any, error: any) => {
          reject(error);
          return true;
        }
      );
    });
  });
}

export function getRecentTransactions(limit = 50): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'SELECT id, type, categoryKey, amount, createdAt FROM transactions ORDER BY createdAt DESC LIMIT ?;',
        [limit],
        (_t: any, result: any) => {
          const rows = result.rows;
          const items: Transaction[] = [];
          for (let i = 0; i < rows.length; i++) {
            items.push(rows.item(i));
          }
          resolve(items);
        },
        (_t: any, error: any) => {
          reject(error);
          return true;
        }
      );
    });
  });
}

