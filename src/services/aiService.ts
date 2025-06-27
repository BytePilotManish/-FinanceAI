import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../lib/supabase/client';
import { notificationService } from './notificationService';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | React.ReactNode;
  timestamp: Date;
}

export interface FinancialInsight {
  type: string;
  content: string;
  confidence: number;
}

export interface UserFinancialData {
  profile?: any;
  accounts?: any[];
  transactions?: any[];
  goals?: any[];
  portfolio?: any[];
  totalBalance?: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  investmentValue?: number;
  savingsRate?: number;
}

export interface ProactiveAlert {
  title: string;
  message: string;
  type: 'transaction' | 'security' | 'investment' | 'system' | 'goal';
  category: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: any;
}

// Indian-specific mock insights for fallback
const mockInsights: FinancialInsight[] = [
  {
    type: 'Investment',
    content: 'Consider increasing your SIP investments in NIFTY index funds for better long-term returns. Current market conditions favor systematic investment.',
    confidence: 85
  },
  {
    type: 'Tax Planning',
    content: 'Maximize your tax savings under Section 80C through ELSS mutual funds and PPF investments. Consider NPS for additional tax benefits under 80CCD(1B).',
    confidence: 92
  },
  {
    type: 'Fixed Income',
    content: 'Current RBI repo rate at 6.5%. Good time to lock in high-yield FDs and government bonds. Consider tax-free bonds for better post-tax returns.',
    confidence: 88
  }
];

const getIndianContext = (query: string, userData?: UserFinancialData) => {
  let contextualInfo = '';
  
  if (userData) {
    contextualInfo = `
    User's Financial Context:
    - Total Balance: ₹${userData.totalBalance?.toLocaleString('en-IN') || 'N/A'}
    - Monthly Income: ₹${userData.monthlyIncome?.toLocaleString('en-IN') || 'N/A'}
    - Monthly Expenses: ₹${userData.monthlyExpenses?.toLocaleString('en-IN') || 'N/A'}
    - Investment Value: ₹${userData.investmentValue?.toLocaleString('en-IN') || 'N/A'}
    - Savings Rate: ${userData.savingsRate?.toFixed(1) || 'N/A'}%
    - Number of Accounts: ${userData.accounts?.length || 0}
    - Number of Goals: ${userData.goals?.length || 0}
    - Recent Transactions: ${userData.transactions?.length || 0}
    `;
  }

  return `As an Indian financial advisor with access to the user's financial data, please provide personalized advice on: ${query}. 
  
  ${contextualInfo}
  
  Consider Indian financial context including:
  - Indian tax laws and regulations
  - Indian investment options (mutual funds, stocks, FDs, PPF, NPS)
  - RBI policies and Indian market conditions
  - Indian retirement planning options
  - Indian insurance products
  - Indian real estate market
  
  Provide specific, actionable advice based on the user's current financial situation.`;
};

export const aiService = {
  async sendMessage(message: string, userData?: UserFinancialData): Promise<ChatMessage> {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = getIndianContext(message, userData);
      
      const result = await model.generateContent(prompt);
      if (!result.response) {
        throw new Error('No response from AI model');
      }
      
      const text = result.response.text();
      return {
        role: 'assistant',
        content: text,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      return {
        role: 'assistant',
        content: 'I apologize, but I cannot provide a response at this moment. Please try again later.',
        timestamp: new Date()
      };
    }
  },

  async getFinancialInsights(userData: UserFinancialData): Promise<FinancialInsight[]> {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Create detailed prompt with user's financial data
      const prompt = `You are a financial analysis AI. Analyze this user's financial data and provide exactly 3 personalized insights for Indian investors.

USER'S FINANCIAL DATA:
- Total Balance: ₹${userData.totalBalance?.toLocaleString('en-IN') || 'N/A'}
- Monthly Income: ₹${userData.monthlyIncome?.toLocaleString('en-IN') || 'N/A'}
- Monthly Expenses: ₹${userData.monthlyExpenses?.toLocaleString('en-IN') || 'N/A'}
- Investment Value: ₹${userData.investmentValue?.toLocaleString('en-IN') || 'N/A'}
- Savings Rate: ${userData.savingsRate?.toFixed(1) || 'N/A'}%
- Number of Accounts: ${userData.accounts?.length || 0}
- Active Goals: ${userData.goals?.filter(g => g.status === 'in_progress').length || 0}
- Recent Transactions: ${userData.transactions?.slice(0, 5).map(t => `${t.category}: ₹${t.amount}`).join(', ') || 'None'}

ACCOUNT BREAKDOWN:
${userData.accounts?.map(acc => `- ${acc.account_name}: ₹${acc.current_balance?.toLocaleString('en-IN')}`).join('\n') || 'No accounts'}

FINANCIAL GOALS:
${userData.goals?.map(goal => `- ${goal.name}: ₹${goal.current_amount?.toLocaleString('en-IN')} / ₹${goal.target_amount?.toLocaleString('en-IN')} (${Math.round((goal.current_amount / goal.target_amount) * 100)}%)`).join('\n') || 'No goals set'}

IMPORTANT: Respond ONLY with a valid JSON array containing exactly 3 objects. Each object MUST have these exact fields:
- "type": string (one of: "Investment", "Risk", "Opportunity", "Tax Planning", "Goal Progress")
- "content": string (personalized insight based on user's data)
- "confidence": number (between 0-100)

Example format:
[{"type":"Investment","content":"Based on your ₹X balance and Y% savings rate, consider...","confidence":85},{"type":"Risk","content":"Your current expense ratio suggests...","confidence":75},{"type":"Opportunity","content":"With your goal progress at Z%, you could...","confidence":90}]

Focus your analysis on:
- User's specific financial situation and patterns
- Personalized recommendations based on their data
- Indian market context and tax implications
- Goal progress and optimization strategies

Remember: Return ONLY the JSON array, no other text, no markdown formatting.`;

      const result = await model.generateContent(prompt);
      if (!result.response) {
        throw new Error('No response from AI model');
      }

      const text = result.response.text().trim();
      
      try {
        // Remove any potential markdown formatting or extra text
        const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
        const parsedInsights = JSON.parse(jsonStr);
        
        if (Array.isArray(parsedInsights) && parsedInsights.length === 3) {
          // Validate the structure of each insight
          const validInsights = parsedInsights.every(insight => 
            typeof insight.type === 'string' &&
            ['Investment', 'Risk', 'Opportunity', 'Tax Planning', 'Goal Progress'].includes(insight.type) &&
            typeof insight.content === 'string' &&
            typeof insight.confidence === 'number' &&
            insight.confidence >= 0 &&
            insight.confidence <= 100
          );

          if (validInsights) {
            return parsedInsights;
          }
        }
        console.error('Invalid insights format received:', text);
        return mockInsights;
      } catch (e) {
        console.error('Failed to parse AI response:', text);
        return mockInsights;
      }
    } catch (error) {
      console.error('Error getting financial insights:', error);
      return mockInsights;
    }
  },

  async generateProactiveAlerts(userData: UserFinancialData): Promise<ProactiveAlert[]> {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `You are a proactive financial AI assistant. Analyze this user's financial data and identify potential alerts or recommendations.

USER'S FINANCIAL DATA:
- Total Balance: ₹${userData.totalBalance?.toLocaleString('en-IN') || 'N/A'}
- Monthly Income: ₹${userData.monthlyIncome?.toLocaleString('en-IN') || 'N/A'}
- Monthly Expenses: ₹${userData.monthlyExpenses?.toLocaleString('en-IN') || 'N/A'}
- Savings Rate: ${userData.savingsRate?.toFixed(1) || 'N/A'}%
- Number of Accounts: ${userData.accounts?.length || 0}

RECENT TRANSACTIONS (Last 10):
${userData.transactions?.slice(0, 10).map(t => `- ${t.transaction_type}: ₹${t.amount} (${t.category}) on ${t.transaction_date}`).join('\n') || 'No recent transactions'}

FINANCIAL GOALS:
${userData.goals?.map(goal => {
  const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
  return `- ${goal.name}: ${progress.toFixed(1)}% complete (₹${goal.current_amount?.toLocaleString('en-IN')} / ₹${goal.target_amount?.toLocaleString('en-IN')})`;
}).join('\n') || 'No goals set'}

Identify 2-4 proactive alerts based on:
1. Unusual spending patterns
2. Goals falling behind schedule
3. Low savings rate warnings
4. Investment opportunities
5. Tax planning reminders
6. Emergency fund adequacy

IMPORTANT: Respond ONLY with a valid JSON array. Each alert object MUST have:
- "title": string (concise alert title)
- "message": string (detailed explanation)
- "type": string (one of: "transaction", "investment", "goal", "system")
- "category": string (one of: "info", "warning", "success", "error")
- "priority": string (one of: "low", "medium", "high", "urgent")
- "metadata": object (additional context data)

Example format:
[{"title":"High Spending Alert","message":"Your expenses this month are 25% higher than usual...","type":"transaction","category":"warning","priority":"medium","metadata":{"amount":50000,"category":"shopping"}}]

Return ONLY the JSON array, no other text.`;

      const result = await model.generateContent(prompt);
      if (!result.response) {
        return [];
      }

      const text = result.response.text().trim();
      
      try {
        const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
        const alerts = JSON.parse(jsonStr);
        
        if (Array.isArray(alerts)) {
          // Validate alert structure
          const validAlerts = alerts.filter(alert => 
            alert.title && alert.message && alert.type && alert.category && alert.priority
          );
          
          return validAlerts;
        }
      } catch (e) {
        console.error('Failed to parse proactive alerts:', text);
      }
      
      return [];
    } catch (error) {
      console.error('Error generating proactive alerts:', error);
      return [];
    }
  },

  async sendProactiveNotifications(alerts: ProactiveAlert[]): Promise<void> {
    for (const alert of alerts) {
      try {
        await notificationService.createNotification({
          title: alert.title,
          message: alert.message,
          type: alert.type,
          category: alert.category,
          priority: alert.priority,
          is_read: false,
          metadata: alert.metadata || {}
        });
      } catch (error) {
        console.error('Error sending proactive notification:', error);
      }
    }
  },

  async fetchUserFinancialData(): Promise<UserFinancialData> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('No authenticated user');

      // Fetch all financial data in parallel
      const [
        profileResult,
        accountsResult,
        transactionsResult,
        goalsResult,
        portfolioResult
      ] = await Promise.allSettled([
        supabase.from('profiles').select('*').eq('id', userData.user.id).single(),
        supabase.from('accounts').select('*').eq('user_id', userData.user.id),
        supabase.from('transactions').select('*').eq('user_id', userData.user.id).order('transaction_date', { ascending: false }).limit(50),
        supabase.from('financial_goals').select('*').eq('user_id', userData.user.id),
        supabase.from('portfolio_holdings').select('*').eq('user_id', userData.user.id)
      ]);

      // Extract data from results
      const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
      const accounts = accountsResult.status === 'fulfilled' ? accountsResult.value.data || [] : [];
      const transactions = transactionsResult.status === 'fulfilled' ? transactionsResult.value.data || [] : [];
      const goals = goalsResult.status === 'fulfilled' ? goalsResult.value.data || [] : [];
      const portfolio = portfolioResult.status === 'fulfilled' ? portfolioResult.value.data || [] : [];

      // Calculate financial metrics
      const totalBalance = accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
      
      // Calculate monthly income and expenses from recent transactions
      const recentTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return transactionDate >= thirtyDaysAgo;
      });

      const monthlyIncome = recentTransactions
        .filter(t => t.transaction_type === 'deposit' || t.transaction_type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const monthlyExpenses = recentTransactions
        .filter(t => t.transaction_type === 'withdrawal' || t.transaction_type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const investmentValue = portfolio.reduce((sum, holding) => {
        return sum + (holding.quantity * (holding.current_price || holding.purchase_price));
      }, 0);

      const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

      return {
        profile,
        accounts,
        transactions,
        goals,
        portfolio,
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        investmentValue,
        savingsRate
      };
    } catch (error) {
      console.error('Error fetching user financial data:', error);
      return {};
    }
  }
};