import React, { useState } from 'react';
import { X, ArrowDownLeft, User, Share2, Copy } from 'lucide-react';

interface RequestMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequest: (requestData: any) => void;
}

const RequestMoneyModal: React.FC<RequestMoneyModalProps> = ({ isOpen, onClose, onRequest }) => {
  const [requestData, setRequestData] = useState({
    requestType: 'contact',
    fromName: '',
    fromEmail: '',
    amount: '',
    description: '',
    dueDate: ''
  });

  const [recentContacts] = useState([
    { id: '1', name: 'Rajesh Kumar', email: 'rajesh@example.com', phone: '+91 98765 43210' },
    { id: '2', name: 'Sunita Sharma', email: 'sunita@example.com', phone: '+91 87654 32109' },
    { id: '3', name: 'Vikram Singh', email: 'vikram@example.com', phone: '+91 76543 21098' }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestData.amount || !requestData.fromName) {
      alert('Please fill in all required fields');
      return;
    }

    const requestInfo = {
      ...requestData,
      amount: parseFloat(requestData.amount),
      timestamp: new Date(),
      id: `REQ${Date.now()}`,
      status: 'pending'
    };

    onRequest(requestInfo);
    onClose();
    setRequestData({
      requestType: 'contact',
      fromName: '',
      fromEmail: '',
      amount: '',
      description: '',
      dueDate: ''
    });
  };

  const generatePaymentLink = () => {
    const link = `https://financeai.com/pay/${Date.now()}`;
    navigator.clipboard.writeText(link);
    alert('Payment link copied to clipboard!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Request Money</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Request Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Request From</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRequestData({ ...requestData, requestType: 'contact' })}
                className={`p-3 border-2 rounded-lg text-left ${
                  requestData.requestType === 'contact'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <User className="h-5 w-5 mb-1" />
                <div className="text-sm font-medium">Contact</div>
              </button>
              <button
                type="button"
                onClick={() => setRequestData({ ...requestData, requestType: 'link' })}
                className={`p-3 border-2 rounded-lg text-left ${
                  requestData.requestType === 'link'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Share2 className="h-5 w-5 mb-1" />
                <div className="text-sm font-medium">Payment Link</div>
              </button>
            </div>
          </div>

          {/* Recent Contacts */}
          {requestData.requestType === 'contact' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Contact</label>
              <div className="space-y-2">
                {recentContacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => setRequestData({
                      ...requestData,
                      fromName: contact.name,
                      fromEmail: contact.email
                    })}
                    className={`w-full p-3 border rounded-lg text-left hover:bg-gray-50 ${
                      requestData.fromName === contact.name
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-sm text-gray-600">{contact.email}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual Entry */}
          {requestData.requestType === 'contact' && !requestData.fromName && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={requestData.fromName}
                  onChange={(e) => setRequestData({ ...requestData, fromName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={requestData.fromEmail}
                  onChange={(e) => setRequestData({ ...requestData, fromEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email"
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
              value={requestData.amount}
              onChange={(e) => setRequestData({ ...requestData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
              required
              min="1"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={requestData.description}
              onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="What is this request for?"
              required
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
            <input
              type="date"
              value={requestData.dueDate}
              onChange={(e) => setRequestData({ ...requestData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Payment Link Option */}
          {requestData.requestType === 'link' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Payment Link</h3>
              <p className="text-sm text-blue-700 mb-3">
                Generate a payment link that you can share via email, SMS, or social media.
              </p>
              <button
                type="button"
                onClick={generatePaymentLink}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Copy className="h-4 w-4" />
                Generate & Copy Link
              </button>
            </div>
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <ArrowDownLeft className="h-4 w-4" />
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestMoneyModal;