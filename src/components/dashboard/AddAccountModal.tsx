import React, { useState } from 'react';
import { X, Building, TrendingUp, Target, CreditCard } from 'lucide-react';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (accountData: any) => void;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onSave }) => {
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({
    accountName: '',
    accountType: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    initialBalance: ''
  });

  const accountTypes = [
    {
      id: 'savings',
      name: 'Bank Account',
      description: 'Savings or Current Account',
      icon: Building,
      color: 'bg-blue-50 border-blue-200 text-blue-600'
    },
    {
      id: 'investment',
      name: 'Investment Account',
      description: 'Stocks, Mutual Funds, Bonds',
      icon: TrendingUp,
      color: 'bg-green-50 border-green-200 text-green-600'
    },
    {
      id: 'goal',
      name: 'Savings Goal',
      description: 'Emergency Fund, Vacation, etc.',
      icon: Target,
      color: 'bg-purple-50 border-purple-200 text-purple-600'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const accountData = {
      ...formData,
      accountType: selectedType,
      id: `ACC${Date.now()}`,
      balance: parseFloat(formData.initialBalance) || 0
    };
    onSave(accountData);
    onClose();
    setFormData({
      accountName: '',
      accountType: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      initialBalance: ''
    });
    setSelectedType('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Add New Account</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Account Type</label>
            <div className="grid grid-cols-1 gap-3">
              {accountTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedType === type.id
                      ? type.color
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <type.icon className="h-6 w-6" />
                    <div>
                      <h3 className="font-medium">{type.name}</h3>
                      <p className="text-sm text-gray-500">{type.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Account Details */}
          {selectedType && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter account name"
                  required
                />
              </div>

              {selectedType === 'savings' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter bank name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter account number"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter IFSC code"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedType === 'goal' ? 'Target Amount' : 'Initial Balance'} (₹)
                </label>
                <input
                  type="number"
                  value={formData.initialBalance}
                  onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                  required
                  min="0"
                />
              </div>
            </>
          )}

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
              disabled={!selectedType}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Add Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccountModal;