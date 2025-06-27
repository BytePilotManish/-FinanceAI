export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  pan_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  account_name: string;
  account_type: string;
  account_number: string | null;
  bank_name: string | null;
  ifsc_code: string | null;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  transaction_type: string;
  category: string;
  amount: number;
  description: string | null;
  status: string;
  transaction_date: string;
  created_at: string;
}

export interface FinancialGoal {
  id: string;
  user_id: string;
  name: string;
  goal_type: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioHolding {
  id: string;
  user_id: string;
  asset_type: string;
  asset_name: string;
  quantity: number;
  purchase_price: number;
  current_price: number | null;
  purchase_date: string;
  created_at: string;
  updated_at: string;
}

export interface MarketAnalysis {
  id: string;
  analysis_type: string;
  content: any;
  confidence_score: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoanAssessment {
  id: string;
  user_id: string;
  assessment_date: string;
  loan_application_data: {
    personal_info: {
      full_name: string;
      age: number;
      marital_status: string;
      dependents: number;
      education: string;
    };
    financial_info: {
      income: number;
      employment_type: string;
      employment_years: number;
      credit_score: number;
      existing_loans: number;
      monthly_expenses: number;
    };
    loan_info: {
      amount: number;
      term: number;
      purpose: string;
    };
    assets_info: {
      total_assets: number;
      property_ownership: boolean;
      vehicle_ownership: boolean;
    };
  };
  risk_score: number;
  risk_breakdown: {
    credit_risk: number;
    income_stability: number;
    debt_burden: number;
    asset_coverage: number;
    employment_stability: number;
  };
  recommendations: string[];
  summary: string;
  created_at: string;
}