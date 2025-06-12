import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  AlertTriangle,
  CreditCard,
  FileText,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import StatCard from '../components/common/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { investmentsService } from '../services/investments';
import { investorsService } from '../services/investors';
import { paymentsService } from '../services/payments';
import { DashboardStats, InvestorStats, PaymentStats } from '../types';
import { motion } from 'framer-motion';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [investorStats, setInvestorStats] = useState<InvestorStats | null>(null);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (user?.role === 'admin' || user?.role === 'finance_manager') {
          const [investmentResponse, investorResponse, paymentResponse, upcomingResponse] = await Promise.all([
            investmentsService.getStats(),
            investorsService.getStats(),
            paymentsService.getStats(),
            investmentsService.getUpcomingDue(7)
          ]);

          setDashboardStats(investmentResponse.data);
          setInvestorStats(investorResponse.data);
          setPaymentStats(paymentResponse.data);
          setUpcomingPayments(upcomingResponse.data);
        } else {
          // For investor role, fetch limited data
          const [investmentResponse, paymentResponse] = await Promise.all([
            investmentsService.getInvestments({ limit: 5 }),
            paymentsService.getPayments({ limit: 5 })
          ]);
          
          // Process investor-specific data
          const investments = investmentResponse.data || [];
          const payments = paymentResponse.data || [];
          
          setDashboardStats({
            totalInvestments: investments.length,
            activeInvestments: investments.filter(i => i.status === 'active').length,
            completedInvestments: investments.filter(i => i.status === 'completed').length,
            totalValue: investments.reduce((sum, i) => sum + i.principalAmount, 0),
            totalPaid: investments.reduce((sum, i) => sum + i.totalPaidAmount, 0),
            remainingValue: investments.reduce((sum, i) => sum + i.remainingAmount, 0),
            overduePayments: 0,
            averageInvestmentSize: investments.length > 0 ? investments.reduce((sum, i) => sum + i.principalAmount, 0) / investments.length : 0
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Sample data for charts
  const chartData = [
    { month: 'Jan', investments: 4000, returns: 2400 },
    { month: 'Feb', investments: 3000, returns: 1398 },
    { month: 'Mar', investments: 2000, returns: 9800 },
    { month: 'Apr', investments: 2780, returns: 3908 },
    { month: 'May', investments: 1890, returns: 4800 },
    { month: 'Jun', investments: 2390, returns: 3800 },
  ];

  const pieData = [
    { name: 'Active', value: dashboardStats?.activeInvestments || 0, color: '#3B82F6' },
    { name: 'Completed', value: dashboardStats?.completedInvestments || 0, color: '#10B981' },
    { name: 'Overdue', value: dashboardStats?.overduePayments || 0, color: '#EF4444' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white"
      >
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="mt-2 opacity-90">
          Here's an overview of your {user?.role === 'investor' ? 'investment portfolio' : 'finance management dashboard'}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard
          title="Total Investments"
          value={dashboardStats?.totalInvestments || 0}
          icon={FileText}
          color="blue"
          change="+12% from last month"
          changeType="positive"
        />
        <StatCard
          title="Active Investments"
          value={dashboardStats?.activeInvestments || 0}
          icon={TrendingUp}
          color="green"
          change={`${dashboardStats?.activeInvestments || 0} currently active`}
          changeType="neutral"
        />
        <StatCard
          title="Total Value"
          value={formatCurrency(dashboardStats?.totalValue || 0)}
          icon={DollarSign}
          color="purple"
          change="+8.2% from last month"
          changeType="positive"
        />
        <StatCard
          title="Returns Paid"
          value={formatCurrency(dashboardStats?.totalPaid || 0)}
          icon={CreditCard}
          color="yellow"
          change={`${formatCurrency(dashboardStats?.remainingValue || 0)} remaining`}
          changeType="neutral"
        />
      </motion.div>

      {/* Charts Section */}
      {(user?.role === 'admin' || user?.role === 'finance_manager') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Investment Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area
                  type="monotone"
                  dataKey="investments"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="returns"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Investment Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Upcoming Payments */}
      {upcomingPayments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Payments (Next 7 Days)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Investment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Investor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingPayments.slice(0, 5).map((payment, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {payment.investmentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.investor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payment.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Interest + Principal
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Additional Stats for Admin/Finance Manager */}
      {(user?.role === 'admin' || user?.role === 'finance_manager') && investorStats && paymentStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Investor Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Investor Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Investors</span>
                <span className="font-semibold">{investorStats.totalInvestors}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Investors</span>
                <span className="font-semibold text-green-600">{investorStats.activeInvestors}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">New This Month</span>
                <span className="font-semibold text-blue-600">{investorStats.newThisMonth}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Investment</span>
                <span className="font-semibold">{formatCurrency(investorStats.averageInvestment)}</span>
              </div>
            </div>
          </motion.div>

          {/* Payment Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Payments</span>
                <span className="font-semibold">{paymentStats.totalPayments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold text-green-600">{paymentStats.completedPayments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending</span>
                <span className="font-semibold text-yellow-600">{paymentStats.pendingPayments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">This Month</span>
                <span className="font-semibold text-blue-600">{paymentStats.thisMonthPayments}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;