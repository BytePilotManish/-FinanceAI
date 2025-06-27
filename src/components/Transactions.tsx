import React, { useState, useEffect } from 'react';
import { PieChart, Search, Download, Filter, ArrowUpDown, ChevronDown, Plus, Calendar, ArrowUp, ArrowDown } from 'lucide-react';

interface Transaction {
  id: string;
  name: string;
  amount: number;
  status: 'paid' | 'processing' | 'failed';
  category: string;
  account: string;
  date: string;
  time: string;
  type: 'subscription' | 'stock' | 'deposit' | 'withdrawal' | 'investment';
  methodDetails: string;
}

const Transactions = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1m');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState({ start: '', end: '' });
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Transaction;
    direction: 'asc' | 'desc';
  } | null>(null);

  const timeframes = [
    { id: '1w', label: '1W', days: 7 },
    { id: '1m', label: '1M', days: 30 },
    { id: '3m', label: '3M', days: 90 },
    { id: '1y', label: 'YTD', days: 365 },
    { id: 'all', label: 'ALL', days: 0 }
  ];

  const stats = [
    { label: 'Total Received', amount: '₹3,12,123', count: 45 },
    { label: 'Upcoming', amount: '₹2,000', count: 1 },
    { label: 'Past Due', amount: '₹3,999', count: 3 },
    { label: 'Refunded', amount: '₹100', count: 1 },
    { label: 'Stopped', amount: '₹10,595', count: 20 }
  ];

  // Generate sample transactions for different timeframes
  const generateTransactions = (days: number) => {
    const transactions: Transaction[] = [];
    const types = ['subscription', 'stock', 'deposit', 'withdrawal', 'investment'] as const;
    const statuses = ['paid', 'processing', 'failed'] as const;
    const categories = ['Income', 'Investment', 'Bills', 'Shopping', 'Transfer'];
    const accounts = ['Savings Account', 'Investment Account', 'Current Account'];
    
    const now = new Date();
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

    for (let i = 0; i < (days * 2); i++) {
      const date = new Date(startDate.getTime() + (Math.random() * (now.getTime() - startDate.getTime())));
      const type = types[Math.floor(Math.random() * types.length)];
      const amount = Math.floor(Math.random() * 1000000) + 1000;

      transactions.push({
        id: `TXN${String(i).padStart(6, '0')}`,
        name: `Transaction ${i + 1}`,
        amount,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        account: accounts[Math.floor(Math.random() * accounts.length)],
        date: date.toLocaleDateString('en-IN'),
        time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        type,
        methodDetails: `**** ${Math.floor(Math.random() * 10000)}`
      });
    }

    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  useEffect(() => {
    const timeframe = timeframes.find(t => t.id === selectedTimeframe);
    const days = timeframe?.days || 0;
    const newTransactions = generateTransactions(days);
    setTransactions(newTransactions);
  }, [selectedTimeframe]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, selectedStatus, selectedType, selectedDateRange, sortConfig]);

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(search) ||
        t.id.toLowerCase().includes(search) ||
        t.category.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(t => t.status === selectedStatus);
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(t => t.type === selectedType);
    }

    // Apply date range filter
    if (selectedDateRange.start && selectedDateRange.end) {
      const start = new Date(selectedDateRange.start);
      const end = new Date(selectedDateRange.end);
      filtered = filtered.filter(t => {
        const date = new Date(t.date);
        return date >= start && date <= end;
      });
    }

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredTransactions(filtered);
  };

  const handleSort = (key: keyof Transaction) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: keyof Transaction) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="h-4 w-4" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const exportTransactions = () => {
    const csvContent = [
      ['ID', 'Name', 'Amount', 'Status', 'Category', 'Account', 'Date', 'Time', 'Type'],
      ...filteredTransactions.map(t => [
        t.id,
        t.name,
        t.amount,
        t.status,
        t.category,
        t.account,
        t.date,
        t.time,
        t.type
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${selectedTimeframe}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatAmount = (amount: number) => {
    const absAmount = Math.abs(amount);
    return `₹${absAmount.toLocaleString('en-IN', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="p-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-xl border border-gray-200">
            <h3 className="text-sm text-gray-600 mb-2">{stat.label}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-gray-900">{stat.amount}</span>
              <span className="text-sm text-gray-500">({stat.count})</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Transactions</h2>
            <div className="flex gap-2">
              <button 
                onClick={exportTransactions}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button 
                onClick={() => setShowNewTransactionModal(true)}
                className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Transaction
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              >
                <option value="all">All Types</option>
                <option value="subscription">Subscription</option>
                <option value="stock">Stock</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="investment">Investment</option>
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="flex gap-2">
              {timeframes.map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setSelectedTimeframe(tf.id)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedTimeframe === tf.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center gap-2">
                    ID/Transaction
                    {getSortIcon('id')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-2">
                    Date
                    {getSortIcon('date')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('account')}
                >
                  <div className="flex items-center gap-2">
                    Account
                    {getSortIcon('account')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center gap-2">
                    Amount
                    {getSortIcon('amount')}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === 'stock' ? 'bg-blue-50' :
                        transaction.type === 'subscription' ? 'bg-purple-50' :
                        transaction.type === 'deposit' ? 'bg-green-50' :
                        transaction.type === 'withdrawal' ? 'bg-red-50' :
                        'bg-orange-50'
                      }`}>
                        <PieChart className={`h-5 w-5 ${
                          transaction.type === 'stock' ? 'text-blue-600' :
                          transaction.type === 'subscription' ? 'text-purple-600' :
                          transaction.type === 'deposit' ? 'text-green-600' :
                          transaction.type === 'withdrawal' ? 'text-red-600' :
                          'text-orange-600'
                        }`} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{transaction.name}</div>
                        <div className="text-sm text-gray-500">#{transaction.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{transaction.date}</div>
                    <div className="text-sm text-gray-500">{transaction.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{transaction.account}</div>
                    <div className="text-sm text-gray-500">{transaction.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      transaction.status === 'paid' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      transaction.type === 'deposit' ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : ''}{formatAmount(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <select className="border border-gray-300 rounded-lg text-sm py-1 pl-2 pr-8">
              <option>10 per page</option>
              <option>25 per page</option>
              <option>50 per page</option>
            </select>
            <span className="text-sm text-gray-500">
              Showing {filteredTransactions.length} of {transactions.length} results
            </span>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>
              Previous
            </button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;