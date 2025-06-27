import React, { useState } from 'react';
import { Target, Calendar, IndianRupee, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';

interface SetGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: any) => void;
}

const SetGoalModal: React.FC<SetGoalModalProps> = ({ isOpen, onClose, onSave }) => {
  const [goalData, setGoalData] = useState({
    name: '',
    target_amount: '',
    target_date: '',
    goal_type: 'retirement',
    priority: 'medium',
    current_amount: '0'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const goalTypes = [
    { id: 'retirement', label: 'Retirement' },
    { id: 'education', label: 'Children Education' },
    { id: 'house', label: 'House Purchase' },
    { id: 'emergency', label: 'Emergency Fund' },
    { id: 'vacation', label: 'Vacation' },
    { id: 'car', label: 'Car Purchase' },
    { id: 'marriage', label: 'Marriage' },
    { id: 'business', label: 'Business Setup' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('No authenticated user');

      const newGoal = {
        user_id: userData.user.id,
        name: goalData.name,
        goal_type: goalData.goal_type,
        target_amount: parseFloat(goalData.target_amount),
        current_amount: parseFloat(goalData.current_amount),
        target_date: goalData.target_date,
        priority: goalData.priority,
        status: 'in_progress'
      };

      const { error: insertError } = await supabase
        .from('financial_goals')
        .insert(newGoal);

      if (insertError) throw insertError;

      onSave(newGoal);
      onClose();
      setGoalData({
        name: '',
        target_amount: '',
        target_date: '',
        goal_type: 'retirement',
        priority: 'medium',
        current_amount: '0'
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-semibold">Set New Financial Goal</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal Name
            </label>
            <input
              type="text"
              value={goalData.name}
              onChange={(e) => setGoalData({ ...goalData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter goal name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal Type
            </label>
            <select
              value={goalData.goal_type}
              onChange={(e) => setGoalData({ ...goalData, goal_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {goalTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Amount (₹)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="number"
                value={goalData.target_amount}
                onChange={(e) => setGoalData({ ...goalData, target_amount: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter target amount"
                required
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Amount (₹)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="number"
                value={goalData.current_amount}
                onChange={(e) => setGoalData({ ...goalData, current_amount: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter current amount"
                required
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={goalData.target_date}
                onChange={(e) => setGoalData({ ...goalData, target_date: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority Level
            </label>
            <select
              value={goalData.priority}
              onChange={(e) => setGoalData({ ...goalData, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetGoalModal;