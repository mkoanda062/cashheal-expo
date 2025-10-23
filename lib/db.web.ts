// Version web-compatible de la base de données utilisant localStorage

export type Balance = { total: number; current: number };
export type Category = { id: number; key: string; label: string; amount: number; color: string; emoji: string };
export type Transaction = { id: number; type: 'income' | 'expense'; categoryKey?: string | null; amount: number; createdAt: number };

// Stockage local pour le web
const STORAGE_PREFIX = 'cashheal_';

function getStorageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(getStorageKey(key));
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(getStorageKey(key), JSON.stringify(value));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
  }
}

export async function initializeDatabase(): Promise<void> {
  // Initialiser les données par défaut si elles n'existent pas
  const balance = getFromStorage('balance', { total: 350, current: 150 });
  setToStorage('balance', balance);

  const categories = getFromStorage('categories', [
    { id: 1, key: 'food', label: 'Nourriture', amount: 20, color: '#10b981', emoji: '🍕' },
    { id: 2, key: 'fun', label: 'Loisirs', amount: 50, color: '#22c55e', emoji: '🎮' },
    { id: 3, key: 'clothes', label: 'Vêtements', amount: 30, color: '#16a34a', emoji: '👕' },
    { id: 4, key: 'transport', label: 'Transport', amount: 15, color: '#15803d', emoji: '🚌' },
  ]);
  setToStorage('categories', categories);

  const transactions = getFromStorage('transactions', []);
  setToStorage('transactions', transactions);
}

export async function addNote(title: string): Promise<void> {
  const notes = getFromStorage('notes', []);
  const newNote = { id: Date.now(), title };
  notes.unshift(newNote);
  setToStorage('notes', notes);
}

export async function getNotes(): Promise<{ id: number; title: string }[]> {
  return getFromStorage('notes', []);
}

export async function getBalance(): Promise<Balance> {
  return getFromStorage('balance', { total: 0, current: 0 });
}

export async function getCategories(): Promise<Category[]> {
  return getFromStorage('categories', []);
}

export async function setBalance(total: number, current: number): Promise<void> {
  setToStorage('balance', { total, current });
}

export async function updateCategoryAmount(key: string, delta: number): Promise<void> {
  const categories = getFromStorage('categories', []);
  const updatedCategories = categories.map(cat => 
    cat.key === key ? { ...cat, amount: Math.max(0, cat.amount + delta) } : cat
  );
  setToStorage('categories', updatedCategories);
}

export async function updateCategory(key: string, amount: number): Promise<void> {
  const categories = getFromStorage('categories', []);
  const updatedCategories = categories.map(cat => 
    cat.key === key ? { ...cat, amount: Math.max(0, amount) } : cat
  );
  setToStorage('categories', updatedCategories);
}

export async function addTransaction(type: 'income' | 'expense', amount: number, categoryKey?: string | null): Promise<void> {
  const transactions = getFromStorage('transactions', []);
  const newTransaction = {
    id: Date.now(),
    type,
    categoryKey: categoryKey ?? null,
    amount,
    createdAt: Date.now(),
  };
  transactions.unshift(newTransaction);
  setToStorage('transactions', transactions);
}

interface GetTransactionsOptions {
  from?: number;
  to?: number;
  limit?: number;
}

export async function getTransactions(options: GetTransactionsOptions = {}): Promise<Transaction[]> {
  let transactions = getFromStorage('transactions', []);
  
  const { from, to, limit } = options;
  
  if (typeof from === 'number') {
    transactions = transactions.filter(t => t.createdAt >= from);
  }
  
  if (typeof to === 'number') {
    transactions = transactions.filter(t => t.createdAt <= to);
  }
  
  if (typeof limit === 'number') {
    transactions = transactions.slice(0, limit);
  }
  
  return transactions;
}

export async function getRecentTransactions(limit = 50): Promise<Transaction[]> {
  return getTransactions({ limit });
}
