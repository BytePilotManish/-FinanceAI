import React, { useState, useEffect } from 'react';
import { Briefcase, GraduationCap, Home, HeartPulse, Target } from 'lucide-react';
import FinancialGoalCard from './FinancialGoalCard';
import { supabase } from '../../lib/supabase/client';

interface FinancialGoal {
  id: string;
  name: string;
  icon: any;
  progress: number;
  target: string;
  current: string;
  target_amount: number;
  current_amount: number;
}

const FinancialGoals = () => {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGoals();

    // Subscribe to changes
    const channel = supabase
      .channel('financial_goals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_goals'
        },
        () => {
          fetchGoals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedGoals = data.map(goal => ({
        id: goal.id,
        name: goal.name,
        icon: getIconForType(goal.goal_type),
        progress: Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)),
        target: formatCurrency(goal.target_amount),
        current: formatCurrency(goal.current_amount),
        target_amount: goal.target_amount,
        current_amount: goal.current_amount
      }));

      setGoals(formattedGoals);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching goals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'retirement':
        return Briefcase;
      case 'education':
        return GraduationCap;
      case 'house':
        return Home;
      case 'health':
        return HeartPulse;
      default:
        return Target;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-blue-200">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl border border-blue-200">
        <div className="text-red-600 text-center">
          Error loading goals: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-blue-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Financial Goals Progress</h2>
      {goals.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No financial goals set yet. Click "Set New Goal" to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {goals.map((goal) => (
            <FinancialGoalCard key={goal.id} {...goal} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FinancialGoals;