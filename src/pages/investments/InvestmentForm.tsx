// src/pages/investments/InvestmentForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
  selectedRepaymentPlan: {
    planType: 'existing' | 'new';
    existingPlanId?: string;
    customPlan?: {
      paymentType: 'interest' | 'interestWithPrincipal';
      // Interest payment fields
      interestPayment?: {
        dateOfInvestment: string;
        amountInvested: number;
        tenure: number;
        interestRate: number;
        interestType: 'flat' | 'reducing';
        interestFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'others';
        interestStartDate?: string;
        principalRepaymentOption: 'fixed' | 'flexible';
        withdrawalAfterPercentage?: number;
        principalSettlementTerm?: number;
      };
      // Interest with Principal fields
      interestWithPrincipalPayment?: {
        interestRate: number;
        interestType: 'flat' | 'reducing';
        dateOfInvestment: string;
        investedAmount: number;
        principalRepaymentPercentage: number;
        paymentFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'others';
        interestPayoutDate?: string;
        principalPayoutDate?: string;
      };
    };
  };
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
    control,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: {
      investmentDate: new Date().toISOString().split('T')[0],
      selectedRepaymentPlan: {
        planType: 'existing'
      }
    }
  });

  const watchPlan = watch('plan');
  const watchPrincipalAmount = watch('principalAmount');
  const watchRepaymentPlanType = useWatch({ control, name: 'selectedRepaymentPlan.planType' });
  const watchPaymentType = useWatch({ control, name: 'selectedRepaymentPlan.customPlan.paymentType' });
  const watchInterestFrequency = useWatch({ control, name: 'selectedRepaymentPlan.customPlan.interestPayment.interestFrequency' });
  const watchIWPFrequency = useWatch({ control, name: 'selectedRepaymentPlan.customPlan.interestWithPrincipalPayment.paymentFrequency' });
  const watchPrincipalOption = useWatch({ control, name: 'selectedRepaymentPlan.customPlan.interestPayment.principalRepaymentOption' });

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

    // This is a simplified calculation - in production, you'd call the API
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

      {/* Repayment Plan Selection */}
      {selectedPlan && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select Repayment Plan</h3>
          
          {/* Plan Type Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Repayment Plan</label>
            <select
              {...register('selectedRepaymentPlan.planType', { required: 'Please select a repayment plan type' })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="existing">Choose from Existing Plans</option>
              <option value="new">Want to Configure New</option>
            </select>
          </div>

          {/* Existing Plans */}
          {watchRepaymentPlanType === 'existing' && selectedPlan.repaymentPlans && selectedPlan.repaymentPlans.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select a Plan</label>
              <select
                {...register('selectedRepaymentPlan.existingPlanId', { 
                  required: 'Please select an existing plan' 
                })}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Plan</option>
                {selectedPlan.repaymentPlans
                  .filter(rp => rp.isActive)
                  .map((repaymentPlan) => (
                    <option key={repaymentPlan._id} value={repaymentPlan._id}>
                      {repaymentPlan.planName} - {repaymentPlan.paymentType}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Custom Plan Configuration */}
          {watchRepaymentPlanType === 'new' && (
            <div className="space-y-6">
              {/* Payment Type */}
              <div>
                <fieldset className="border border-gray-200 rounded-lg p-4">
                  <legend className="text-sm font-medium text-gray-900 px-2">Payment Type</legend>
                  <div className="space-y-2 mt-2">
                    <label className="flex items-center">
                      <input
                        {...register('selectedRepaymentPlan.customPlan.paymentType')}
                        type="radio"
                        value="interest"
                        className="mr-2"
                      />
                      Interest
                    </label>
                    <label className="flex items-center">
                      <input
                        {...register('selectedRepaymentPlan.customPlan.paymentType')}
                        type="radio"
                        value="interestWithPrincipal"
                        className="mr-2"
                      />
                      Interest with Principal
                    </label>
                  </div>
                </fieldset>
              </div>

              {/* Interest Payment Configuration */}
              {watchPaymentType === 'interest' && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-blue-900 mb-4">Interest Payment Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date of Investment</label>
                      <input
                        {...register('selectedRepaymentPlan.customPlan.interestPayment.dateOfInvestment')}
                        type="date"
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount Invested</label>
                      <input
                        {...register('selectedRepaymentPlan.customPlan.interestPayment.amountInvested')}
                        type="number"
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tenure (Months)</label>
                      <input
                        {...register('selectedRepaymentPlan.customPlan.interestPayment.tenure')}
                        type="number"
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Interest (%)</label>
                      <input
                        {...register('selectedRepaymentPlan.customPlan.interestPayment.interestRate')}
                        type="number"
                        step="0.01"
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Interest Type</label>
                      <select
                        {...register('selectedRepaymentPlan.customPlan.interestPayment.interestType')}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="flat">Flat</option>
                        <option value="reducing">Reducing</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Interest Payment Frequency</label>
                      <select
                        {...register('selectedRepaymentPlan.customPlan.interestPayment.interestFrequency')}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">-- Select Frequency --</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="half-yearly">Half-Yearly</option>
                        <option value="yearly">Yearly</option>
                        <option value="others">Others</option>
                      </select>
                    </div>

                    {watchInterestFrequency === 'others' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Interest Payout Start Date</label>
                        <input
                          {...register('selectedRepaymentPlan.customPlan.interestPayment.interestStartDate')}
                          type="date"
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Principal Repayment Option</label>
                      <select
                        {...register('selectedRepaymentPlan.customPlan.interestPayment.principalRepaymentOption')}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">-- Select Option --</option>
                        <option value="fixed">Fixed Tenure – Principal will be repaid at the end</option>
                        <option value="flexible">Flexible Withdrawal – Early withdrawal possible</option>
                      </select>
                    </div>

                    {watchPrincipalOption === 'flexible' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Withdraw Allowed After Tenure (%)</label>
                          <input
                            {...register('selectedRepaymentPlan.customPlan.interestPayment.withdrawalAfterPercentage')}
                            type="number"
                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Principal Settlement Term (Months)</label>
                          <input
                            {...register('selectedRepaymentPlan.customPlan.interestPayment.principalSettlementTerm')}
                            type="number"
                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Interest with Principal Configuration */}
              {watchPaymentType === 'interestWithPrincipal' && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-green-900 mb-4">Interest with Principal Payment Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Interest (%)</label>
                      <input
                        {...register('selectedRepaymentPlan.customPlan.interestWithPrincipalPayment.interestRate')}
                        type="number"
                        step="0.01"
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Interest Type</label>
                      <select
                        {...register('selectedRepaymentPlan.customPlan.interestWithPrincipalPayment.interestType')}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="flat">Flat</option>
                        <option value="reducing">Reducing</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date of Investment</label>
                      <input
                        {...register('selectedRepaymentPlan.customPlan.interestWithPrincipalPayment.dateOfInvestment')}
                        type="date"
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Invested Amount</label>
                      <input
                        {...register('selectedRepaymentPlan.customPlan.interestWithPrincipalPayment.investedAmount')}
                        type="number"
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Principal Repayment Percentage</label>
                      <input
                        {...register('selectedRepaymentPlan.customPlan.interestWithPrincipalPayment.principalRepaymentPercentage')}
                        type="number"
                        step="0.01"
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Interest with Principal Payment Frequency</label>
                      <select
                        {...register('selectedRepaymentPlan.customPlan.interestWithPrincipalPayment.paymentFrequency')}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">-- Select Frequency --</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="half-yearly">Half-Yearly</option>
                        <option value="yearly">Yearly</option>
                        <option value="others">Others</option>
                      </select>
                    </div>

                    {watchIWPFrequency === 'others' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Interest Payout Date</label>
                          <input
                            {...register('selectedRepaymentPlan.customPlan.interestWithPrincipalPayment.interestPayoutDate')}
                            type="date"
                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Principal Payout Date</label>
                          <input
                            {...register('selectedRepaymentPlan.customPlan.interestWithPrincipalPayment.principalPayoutDate')}
                            type="date"
                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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