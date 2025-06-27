import React, { useState } from 'react';
import { X, CreditCard, Eye, EyeOff, MoreHorizontal, Plus } from 'lucide-react';

interface ManageCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageCardsModal: React.FC<ManageCardsModalProps> = ({ isOpen, onClose }) => {
  const [showCardNumber, setShowCardNumber] = useState<{ [key: string]: boolean }>({});

  const cards = [
    {
      id: '1',
      type: 'Credit Card',
      bank: 'HDFC Bank',
      number: '4532 1234 5678 9012',
      expiry: '12/26',
      limit: 500000,
      available: 485000,
      status: 'Active'
    },
    {
      id: '2',
      type: 'Debit Card',
      bank: 'SBI',
      number: '5678 9012 3456 7890',
      expiry: '08/25',
      limit: 100000,
      available: 95000,
      status: 'Active'
    }
  ];

  const toggleCardVisibility = (cardId: string) => {
    setShowCardNumber(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const formatCardNumber = (number: string, show: boolean) => {
    if (show) return number;
    return number.replace(/\d(?=\d{4})/g, '*');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Manage Cards</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {cards.map((card) => (
            <div key={card.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{card.type}</h3>
                    <p className="text-sm text-gray-600">{card.bank}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    card.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {card.status}
                  </span>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Card Number</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm">
                      {formatCardNumber(card.number, showCardNumber[card.id])}
                    </p>
                    <button
                      onClick={() => toggleCardVisibility(card.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showCardNumber[card.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expires</p>
                  <p className="font-medium">{card.expiry}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Credit Limit</p>
                  <p className="font-medium">₹{card.limit.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="font-medium text-green-600">₹{card.available.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  Block Card
                </button>
                <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  View Statements
                </button>
                <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  Set Limits
                </button>
              </div>
            </div>
          ))}

          <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 flex items-center justify-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Card
          </button>
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

export default ManageCardsModal;