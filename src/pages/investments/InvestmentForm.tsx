import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { investorsService } from '../../services/investors';
import { plansService } from '../../services/plans';
import { Investor, Plan } from '../../types';
import toast from 'react-hot-toast';

interface InvestmentFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface FormData {
  investor: string;
  plan: string;
  principalAmount: number;
  investmentDate: string;
  notes: string;
}

const InvestmentForm: React.FC<InvestmentFormProps> = ({ onSubmit, onCancel }) => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: {
      investmentDate: new Date().toISOString().split('T')[0]
    }
  });

  const watchPlan = watch('plan');
  const watchPrincipalAmount = watch('principalAmount');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [investorsResponse, plansResponse] = await Promise.all([
          investorsService.getInvestors({ limit: 100 }),
          plansService.getActivePlans()
        ]);
        
        setInvestors(investorsResponse.data || []);
        setPlans(plansResponse.data || []);
      } catch (error: any) {
        toast.error('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (watchPlan) {
      const plan = plans.find(p => p._id === watchPlan);
      setSelectedPlan(plan || null);
    }
  }, [watchPlan, plans]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateExpectedReturns = () => {
    if (!selectedPlan || !watchPrincipalAmount) return null;

    const monthlyRate = selectedPlan.interestRate / 100;
    let totalInterest = 0;

    if (selectedPlan.interestType === 'flat') {
      totalInterest = watchPrincipalAmount * monthlyRate * selectedPlan.tenure;
    } else {
      // Simplified reducing balance calculation
      let remainingPrincipal = watchPrincipalAmount;
      const principalRepaymentAmount = (watchPrincipalAmount * selectedPlan.principalRepayment.percentage / 100) / 
        (selectedPlan.tenure - selectedPlan.principalRepayment.startFromMonth + 1);

      for (let month = 1; month <= selectedPlan.tenure; month++) {
        totalInterest += remainingPrincipal * monthlyRate;
        
        if (month >= selectedPlan.principalRepayment.startFromMonth) {
          remainingPrincipal -= principalRepaymentAmount;
          remainingPrincipal = Math.max(0, remainingPrincipal);
        }
      }
    }

    return {
      totalInterest: Math.round(totalInterest),
      totalReturns: Math.round(watchPrincipalAmount + totalInterest),
      monthlyInterest: Math.round(totalInterest / selectedPlan.tenure)
    };
  };

  const expectedReturns = calculateExpectedReturns();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Investment Details */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Investment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Investor</label>
            <select
              {...register('investor', { required: 'Please select an investor' })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Investor</option>
              {investors.map((investor) => (
                <option key={investor._id} value={investor._id}>
                  {investor.name} ({investor.investorId})
                </option>
              ))}
            </select>
            {errors.investor && <p className="mt-1 text-sm text-red-600">{errors.investor.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Investment Plan</label>
            <select
              {...register('plan', { required: 'Please select a plan' })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Plan</option>
              {plans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.name} - {plan.interestRate}% {plan.interestType}
                </option>
              ))}
            </select>
            {errors.plan && <p className="mt-1 text-sm text-red-600">{errors.plan.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Principal Amount (₹)</label>
            <input
              {...register('principalAmount', {
                required: 'Principal amount is required',
                min: {
                  value: selectedPlan?.minInvestment || 1,
                  message: `Minimum investment is ${formatCurrency(selectedPlan?.minInvestment || 0)}`
                },
                max: {
                  value: selectedPlan?.maxInvestment || 10000000,
                  message: `Maximum investment is ${formatCurrency(selectedPlan?.maxInvestment || 0)}`
                }
              })}
              type="number"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter investment amount"
            />
            {errors.principalAmount && <p className="mt-1 text-sm text-red-600">{errors.principalAmount.message}</p>}
            {selectedPlan && (
              <p className="mt-1 text-sm text-gray-500">
                Range: {formatCurrency(selectedPlan.minInvestment)} - {formatCurrency(selectedPlan.maxInvestment)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Investment Date</label>
            <input
              {...register('investmentDate', { required: 'Investment date is required' })}
              type="date"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.investmentDate && <p className="mt-1 text-sm text-red-600">{errors.investmentDate.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter any additional notes"
            />
          </div>
        </div>
      </div>

      {/* Plan Details */}
      {selectedPlan && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-md font-medium text-blue-900 mb-3">Selected Plan Details</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Interest Rate:</span>
              <div className="font-medium">{selectedPlan.interestRate}% per month</div>
            </div>
            <div>
              <span className="text-blue-700">Interest Type:</span>
              <div className="font-medium capitalize">{selectedPlan.interestType}</div>
            </div>
            <div>
              <span className="text-blue-700">Tenure:</span>
              <div className="font-medium">{selectedPlan.tenure} months</div>
            </div>
            <div>
              <span className="text-blue-700">Payout Frequency:</span>
              <div className="font-medium capitalize">{selectedPlan.interestPayoutFrequency}</div>
            </div>
          </div>
        </div>
      )}

      {/* Expected Returns */}
      {expectedReturns && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-md font-medium text-green-900 mb-3">Expected Returns</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded">
              <div className="text-sm text-gray-600">Total Interest</div>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(expectedReturns.totalInterest)}
              </div>
            </div>
            <div className="bg-white p-3 rounded">
              <div className="text-sm text-gray-600">Total Returns</div>
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(expectedReturns.totalReturns)}
              </div>
            </div>
            <div className="bg-white p-3 rounded">
              <div className="text-sm text-gray-600">Avg. Monthly Interest</div>
              <div className="text-lg font-bold text-purple-600">
                {formatCurrency(expectedReturns.monthlyInterest)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Create Investment
        </Button>
      </div>
    </form>
  );
};

export default InvestmentForm;