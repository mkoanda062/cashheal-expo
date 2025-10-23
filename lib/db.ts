import {
  openDatabaseAsync,
  type SQLiteDatabase,
  type SQLiteRunResult,
} from 'expo-sqlite';

const dbPromise = openDatabaseAsync('cashheal.db');

async function getDatabase(): Promise<SQLiteDatabase> {
  return dbPromise;
}

export type Balance = { total: number; current: number };
export type Category = { id: number; key: string; label: string; amount: number; color: string; emoji: string };
export type Transaction = { id: number; type: 'income' | 'expense'; categoryKey?: string | null; amount: number; createdAt: number };

export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync('CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL);');
    await txn.execAsync('CREATE TABLE IF NOT EXISTS balances (id INTEGER PRIMARY KEY, total REAL NOT NULL, current REAL NOT NULL);');
    await txn.execAsync(
      'CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE, label TEXT NOT NULL, amount REAL NOT NULL, color TEXT NOT NULL, emoji TEXT NOT NULL);',
    );
    await txn.execAsync(
      "CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL CHECK (type IN ('income', 'expense')), categoryKey TEXT, amount REAL NOT NULL, createdAt INTEGER NOT NULL);",
    );

    const balanceRow = await txn.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM balances;', []);
    if ((balanceRow?.count ?? 0) === 0) {
      await txn.runAsync('INSERT INTO balances (id, total, current) VALUES (1, ?, ?);', [350, 150]);
    }

    const categoryRow = await txn.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM categories;', []);
    if ((categoryRow?.count ?? 0) === 0) {
      const seed: [string, string, number, string, string][] = [
        ['food', 'Nourriture', 20, '#10b981', '🍕'],
        ['fun', 'Loisirs', 50, '#22c55e', '🎮'],
        ['clothes', 'Vêtements', 30, '#16a34a', '👕'],
        ['transport', 'Transport', 15, '#15803d', '🚌'],
      ];

      for (const [key, label, amount, color, emoji] of seed) {
        await txn.runAsync('INSERT OR IGNORE INTO categories (key, label, amount, color, emoji) VALUES (?, ?, ?, ?, ?);', [
          key,
          label,
          amount,
          color,
          emoji,
        ]);
      }
    }
  });
}

export async function addNote(title: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('INSERT INTO notes (title) VALUES (?);', [title]);
}

export async function getNotes(): Promise<{ id: number; title: string }[]> {
  const db = await getDatabase();
  return db.getAllAsync<{ id: number; title: string }>('SELECT id, title FROM notes ORDER BY id DESC;', []);
}

export async function getBalance(): Promise<Balance> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Balance>('SELECT total, current FROM balances WHERE id = 1;', []);
  return row ?? { total: 0, current: 0 };
}

export async function getCategories(): Promise<Category[]> {
  const db = await getDatabase();
  return db.getAllAsync<Category>('SELECT id, key, label, amount, color, emoji FROM categories ORDER BY id ASC;', []);
}

export async function setBalance(total: number, current: number): Promise<void> {
  const db = await getDatabase();

  await db.withExclusiveTransactionAsync(async (txn) => {
    const result: SQLiteRunResult = await txn.runAsync('UPDATE balances SET total = ?, current = ? WHERE id = 1;', [
      total,
      current,
    ]);

    if ((result.changes ?? 0) === 0) {
      await txn.runAsync('INSERT INTO balances (id, total, current) VALUES (1, ?, ?);', [total, current]);
    }
  });
}

export async function updateCategoryAmount(key: string, delta: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE categories SET amount = amount + ? WHERE key = ?;', [delta, key]);
}

export async function updateCategory(key: string, amount: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE categories SET amount = ? WHERE key = ?;', [amount, key]);
}

export async function addTransaction(type: 'income' | 'expense', amount: number, categoryKey?: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('INSERT INTO transactions (type, categoryKey, amount, createdAt) VALUES (?, ?, ?, ?);', [
    type,
    categoryKey ?? null,
    amount,
    Date.now(),
  ]);
}

interface GetTransactionsOptions {
  from?: number;
  to?: number;
  limit?: number;
}

export async function getTransactions(options: GetTransactionsOptions = {}): Promise<Transaction[]> {
  const db = await getDatabase();
  const { from, to, limit } = options;

  const conditions: string[] = [];
  const params: number[] = [];

  if (typeof from === 'number') {
    conditions.push('createdAt >= ?');
    params.push(from);
  }

  if (typeof to === 'number') {
    conditions.push('createdAt <= ?');
    params.push(to);
  }

  let query = 'SELECT id, type, categoryKey, amount, createdAt FROM transactions';
  if (conditions.length) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  query += ' ORDER BY createdAt DESC';
  if (typeof limit === 'number') {
    query += ' LIMIT ?';
    params.push(limit);
  }

  return db.getAllAsync<Transaction>(query, params);
}

export async function getRecentTransactions(limit = 50): Promise<Transaction[]> {
  const db = await getDatabase();
  return db.getAllAsync<Transaction>(
    'SELECT id, type, categoryKey, amount, createdAt FROM transactions ORDER BY createdAt DESC LIMIT ?;',
    [limit],
  );
}
