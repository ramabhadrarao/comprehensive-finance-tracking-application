// src/pages/DashboardPage.tsx - Updated with new services and types
import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  AlertTriangle,
  CreditCard,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Activity
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
  Cell,
  BarChart,
  Bar
} from 'recharts';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboard';
import { DashboardStats, InvestorStats, PaymentStats, PlanStats } from '../types';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface DashboardData {
  stats: DashboardStats;
  investorStats: InvestorStats;
  paymentStats: PaymentStats;
  planStats: PlanStats;
  recentActivity: Array<{
    id: string;
    type: 'investment_created' | 'payment_received' | 'investor_added' | 'plan_created' | 'document_uploaded' | 'user_login';
    title: string;
    description: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error';
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
  }>;
  alerts: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: string;
    actionRequired: boolean;
    actionUrl?: string;
  }>;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [trendingMetrics, setTrendingMetrics] = useState<any>(null);
  const [quickActions, setQuickActions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);

  const isManager = user?.role === 'admin' || user?.role === 'finance_manager';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        if (isManager) {
          // Fetch comprehensive dashboard for admin/finance managers
          const [overviewResponse, trendingResponse, quickActionsResponse] = await Promise.all([
            dashboardService.getDashboardOverview(),
            dashboardService.getTrendingMetrics({ period: 'month' }),
            dashboardService.getQuickActionsData()
          ]);

          setDashboardData(overviewResponse.data);
          setTrendingMetrics(trendingResponse.data);
          setQuickActions(quickActionsResponse.data);
        } else {
          // Simplified dashboard for investors
          const response = await dashboardService.getDashboardOverview();
          setDashboardData(response.data);
        }
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isManager]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      investment_created: <FileText className="h-4 w-4" />,
      payment_received: <CreditCard className="h-4 w-4" />,
      investor_added: <Users className="h-4 w-4" />,
      plan_created: <TrendingUp className="h-4 w-4" />,
      document_uploaded: <FileText className="h-4 w-4" />,
      user_login: <Activity className="h-4 w-4" />
    };
    return icons[type as keyof typeof icons] || <Activity className="h-4 w-4" />;
  };

  const getActivityColor = (status: string) => {
    const colors = {
      success: 'text-green-600 bg-green-100',
      warning: 'text-yellow-600 bg-yellow-100',
      error: 'text-red-600 bg-red-100'
    };
    return colors[status as keyof typeof colors] || 'text-blue-600 bg-blue-100';
  };

  const getAlertIcon = (type: string) => {
    const icons = {
      info: <FileText className="h-4 w-4 text-blue-600" />,
      warning: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
      error: <AlertTriangle className="h-4 w-4 text-red-600" />,
      success: <TrendingUp className="h-4 w-4 text-green-600" />
    };
    return icons[type as keyof typeof icons] || <FileText className="h-4 w-4 text-blue-600" />;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

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
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Failed to load dashboard data</p>
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
          value={dashboardData.stats.totalInvestments || 0}
          icon={FileText}
          color="blue"
          change={trendingMetrics?.investments?.percentage ? `${trendingMetrics.investments.percentage > 0 ? '+' : ''}${trendingMetrics.investments.percentage}% from last month` : undefined}
          changeType={trendingMetrics?.investments?.trend || 'neutral'}
        />
        <StatCard
          title="Active Investments"
          value={dashboardData.stats.activeInvestments || 0}
          icon={TrendingUp}
          color="green"
          change={`${dashboardData.stats.activeInvestments || 0} currently active`}
          changeType="neutral"
        />
        <StatCard
          title="Total Value"
          value={formatCurrency(dashboardData.stats.totalValue || 0)}
          icon={DollarSign}
          color="purple"
          change={trendingMetrics?.revenue?.percentage ? `${trendingMetrics.revenue.percentage > 0 ? '+' : ''}${trendingMetrics.revenue.percentage}% from last month` : undefined}
          changeType={trendingMetrics?.revenue?.trend || 'neutral'}
        />
        <StatCard
          title="Returns Paid"
          value={formatCurrency(dashboardData.stats.totalPaid || 0)}
          icon={CreditCard}
          color="yellow"
          change={`${formatCurrency(dashboardData.stats.remainingValue || 0)} remaining`}
          changeType="neutral"
        />
      </motion.div>

      {/* Charts Section for Managers */}
      {isManager && trendingMetrics && (
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
              <AreaChart data={trendingMetrics.investments.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Payment Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendingMetrics.payments.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Alerts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Alerts */}
        {dashboardData.alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
                <Bell className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
              {dashboardData.alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{formatDate(alert.timestamp)}</p>
                    </div>
                    {alert.actionRequired && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Action Required
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Activity */}
        {dashboardData.recentActivity.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <Activity className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
              {dashboardData.recentActivity.slice(0, 8).map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 p-1 rounded-full ${getActivityColor(activity.status)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400">{formatDate(activity.timestamp)}</p>
                        <span className="text-xs font-medium text-gray-600">by {activity.user.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick Actions for Managers */}
      {isManager && quickActions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.shortcuts?.map((shortcut: any) => (
                <a
                  key={shortcut.id}
                  href={shortcut.url}
                  className="relative p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-${shortcut.color}-100`}>
                      <TrendingUp className={`h-5 w-5 text-${shortcut.color}-600`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{shortcut.title}</p>
                      <p className="text-xs text-gray-500">{shortcut.description}</p>
                    </div>
                  </div>
                  {shortcut.badge && shortcut.badge > 0 && (
                    <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {shortcut.badge}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Additional Stats for Admin/Finance Manager */}
      {isManager && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Investor Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Investor Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Investors</span>
                <span className="font-semibold">{dashboardData.investorStats.totalInvestors}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Investors</span>
                <span className="font-semibold text-green-600">{dashboardData.investorStats.activeInvestors}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">New This Month</span>
                <span className="font-semibold text-blue-600">{dashboardData.investorStats.newThisMonth}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">With User Accounts</span>
                <span className="font-semibold text-purple-600">{dashboardData.investorStats.withUserAccounts}</span>
              </div>
            </div>
          </motion.div>

          {/* Payment Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Payments</span>
                <span className="font-semibold">{dashboardData.paymentStats.totalPayments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold text-green-600">{dashboardData.paymentStats.completedPayments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending</span>
                <span className="font-semibold text-yellow-600">{dashboardData.paymentStats.pendingPayments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">This Month</span>
                <span className="font-semibold text-blue-600">{dashboardData.paymentStats.thisMonthPayments}</span>
              </div>
            </div>
          </motion.div>

          {/* Plan Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Plans</span>
                <span className="font-semibold">{dashboardData.planStats.totalPlans}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Plans</span>
                <span className="font-semibold text-green-600">{dashboardData.planStats.activePlans}</span>
              </div>
              {dashboardData.planStats.mostPopularPlan && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Most Popular</div>
                  <div className="font-semibold text-purple-600 text-sm">
                    {dashboardData.planStats.mostPopularPlan.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {dashboardData.planStats.mostPopularPlan.investmentCount} investments
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;