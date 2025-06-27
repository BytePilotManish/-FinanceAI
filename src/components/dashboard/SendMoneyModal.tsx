import React, { useState } from 'react';
import { X, Send, User, CreditCard, Building } from 'lucide-react';

interface SendMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (transferData: any) => void;
}

const SendMoneyModal: React.FC<SendMoneyModalProps> = ({ isOpen, onClose, onSend }) => {
  const [transferData, setTransferData] = useState({
    recipientType: 'contact',
    recipientName: '',
    recipientAccount: '',
    ifscCode: '',
    amount: '',
    description: '',
    fromAccount: 'savings'
  });

  const [recentContacts] = useState([
    { id: '1', name: 'Priya Sharma', account: '**** 4567', bank: 'HDFC Bank' },
    { id: '2', name: 'Amit Kumar', account: '**** 8901', bank: 'SBI' },
    { id: '3', name: 'Neha Patel', account: '**** 2345', bank: 'ICICI Bank' }
  ]);

  const accounts = [
    { id: 'savings', name: 'Savings Account', balance: 2211110.10 },
    { id: 'current', name: 'Current Account', balance: 1605110.40 }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferData.amount || !transferData.recipientName) {
      alert('Please fill in all required fields');
      return;
    }

    const transferInfo = {
      ...transferData,
      amount: parseFloat(transferData.amount),
      timestamp: new Date(),
      id: `TXN${Date.now()}`
    };

    onSend(transferInfo);
    onClose();
    setTransferData({
      recipientType: 'contact',
      recipientName: '',
      recipientAccount: '',
      ifscCode: '',
      amount: '',
      description: '',
      fromAccount: 'savings'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Send Money</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* From Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Account</label>
            <select
              value={transferData.fromAccount}
              onChange={(e) => setTransferData({ ...transferData, fromAccount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - ₹{account.balance.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          {/* Recipient Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Send To</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTransferData({ ...transferData, recipientType: 'contact' })}
                className={`p-3 border-2 rounded-lg text-left ${
                  transferData.recipientType === 'contact'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <User className="h-5 w-5 mb-1" />
                <div className="text-sm font-medium">Contact</div>
              </button>
              <button
                type="button"
                onClick={() => setTransferData({ ...transferData, recipientType: 'new' })}
                className={`p-3 border-2 rounded-lg text-left ${
                  transferData.recipientType === 'new'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Building className="h-5 w-5 mb-1" />
                <div className="text-sm font-medium">New Recipient</div>
              </button>
            </div>
          </div>

          {/* Recent Contacts */}
          {transferData.recipientType === 'contact' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recent Contacts</label>
              <div className="space-y-2">
                {recentContacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => setTransferData({
                      ...transferData,
                      recipientName: contact.name,
                      recipientAccount: contact.account
                    })}
                    className={`w-full p-3 border rounded-lg text-left hover:bg-gray-50 ${
                      transferData.recipientName === contact.name
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-sm text-gray-600">{contact.account} • {contact.bank}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* New Recipient Details */}
          {transferData.recipientType === 'new' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label>
                <input
                  type="text"
                  value={transferData.recipientName}
                  onChange={(e) => setTransferData({ ...transferData, recipientName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter recipient name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <input
                  type="text"
                  value={transferData.recipientAccount}
                  onChange={(e) => setTransferData({ ...transferData, recipientAccount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter account number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={transferData.ifscCode}
                  onChange={(e) => setTransferData({ ...transferData, ifscCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter IFSC code"
                  required
                />
              </div>
            </>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input
              type="number"
              value={transferData.amount}
              onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
              required
              min="1"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={transferData.description}
              onChange={(e) => setTransferData({ ...transferData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter description"
            />
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send Money
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendMoneyModal;