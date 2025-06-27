import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface FinanceAIDB extends DBSchema {
  marketAnalysis: {
    key: string;
    value: {
      positiveIndicators: string[];
      riskFactors: string[];
      strategicActions: string[];
      taxPlanning: string[];
      lastSynced: Date;
    };
  };
  portfolioData: {
    key: string;
    value: {
      name: string;
      value: number;
      color: string;
    }[];
  };
  financialGoals: {
    key: string;
    value: {
      name: string;
      icon: string;
      progress: number;
      target: string;
      current: string;
    }[];
  };
  investmentData: {
    key: string;
    value: {
      name: string;
      investments: number;
      savings: number;
      returns: number;
    }[];
  };
}

let db: IDBPDatabase<FinanceAIDB>;

export async function initDB() {
  db = await openDB<FinanceAIDB>('financeAI-v1', 1, {
    upgrade(db) {
      // Market Analysis Store
      db.createObjectStore('marketAnalysis');
      
      // Portfolio Data Store
      db.createObjectStore('portfolioData');
      
      // Financial Goals Store
      db.createObjectStore('financialGoals');
      
      // Investment Data Store
      db.createObjectStore('investmentData');
    },
  });
  return db;
}

export async function getDB() {
  if (!db) {
    db = await initDB();
  }
  return db;
}

// Market Analysis Operations
export async function saveMarketAnalysis(data: FinanceAIDB['marketAnalysis']['value']) {
  const db = await getDB();
  await db.put('marketAnalysis', data, 'current');
}

export async function getMarketAnalysis(): Promise<FinanceAIDB['marketAnalysis']['value'] | null> {
  const db = await getDB();
  return db.get('marketAnalysis', 'current');
}

// Portfolio Data Operations
export async function savePortfolioData(data: FinanceAIDB['portfolioData']['value']) {
  const db = await getDB();
  await db.put('portfolioData', data, 'current');
}

export async function getPortfolioData(): Promise<FinanceAIDB['portfolioData']['value'] | null> {
  const db = await getDB();
  return db.get('portfolioData', 'current');
}

// Financial Goals Operations
export async function saveFinancialGoals(data: FinanceAIDB['financialGoals']['value']) {
  const db = await getDB();
  await db.put('financialGoals', data, 'current');
}

export async function getFinancialGoals(): Promise<FinanceAIDB['financialGoals']['value'] | null> {
  const db = await getDB();
  return db.get('financialGoals', 'current');
}

// Investment Data Operations
export async function saveInvestmentData(data: FinanceAIDB['investmentData']['value']) {
  const db = await getDB();
  await db.put('investmentData', data, 'current');
}

export async function getInvestmentData(): Promise<FinanceAIDB['investmentData']['value'] | null> {
  const db = await getDB();
  return db.get('investmentData', 'current');
}