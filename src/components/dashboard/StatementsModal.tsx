import React, { useState } from 'react';
import { X, Download, Calendar, FileText, Eye } from 'lucide-react';

interface StatementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StatementsModal: React.FC<StatementsModalProps> = ({ isOpen, onClose }) => {
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const accounts = [
    { id: 'all', name: 'All Accounts' },
    { id: 'savings', name: 'Savings Account - **** 4567' },
    { id: 'current', name: 'Current Account - **** 9012' },
    { id: 'investment', name: 'Investment Account - **** 3456' }
  ];

  const statements = [
    {
      id: '1',
      month: 'December 2024',
      account: 'Savings Account',
      transactions: 45,
      size: '2.3 MB',
      date: '2024-12-31'
    },
    {
      id: '2',
      month: 'November 2024',
      account: 'Savings Account',
      transactions: 38,
      size: '1.9 MB',
      date: '2024-11-30'
    },
    {
      id: '3',
      month: 'October 2024',
      account: 'Investment Account',
      transactions: 22,
      size: '1.5 MB',
      date: '2024-10-31'
    }
  ];

  const handleDownload = (statementId: string) => {
    // Simulate download
    console.log(`Downloading statement ${statementId}`);
  };

  const handleGenerateCustom = () => {
    if (!dateRange.start || !dateRange.end) {
      alert('Please select both start and end dates');
      return;
    }
    console.log('Generating custom statement for:', dateRange);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Account Statements</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-gray-900">Available Statements</h3>
          <button
            onClick={handleGenerateCustom}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Generate Custom Statement
          </button>
        </div>

        {/* Statements List */}
        <div className="space-y-3">
          {statements.map((statement) => (
            <div key={statement.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{statement.month}</h4>
                    <p className="text-sm text-gray-600">{statement.account}</p>
                    <p className="text-xs text-gray-500">
                      {statement.transactions} transactions • {statement.size}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(statement.id)}
                    className="p-2 text-blue-600 hover:text-blue-700"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatementsModal;