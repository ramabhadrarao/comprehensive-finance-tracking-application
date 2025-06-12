import React from 'react';
import { useForm } from 'react-hook-form';
import Button from '../../components/common/Button';
import { Plan } from '../../types';

interface PlanFormProps {
  plan?: Plan;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  description: string;
  interestType: 'flat' | 'reducing';
  interestRate: number;
  minInvestment: number;
  maxInvestment: number;
  tenure: number;
  interestPayoutFrequency: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  principalRepayment: {
    percentage: number;
    startFromMonth: number;
  };
  isActive: boolean;
  features: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

const PlanForm: React.FC<PlanFormProps> = ({ plan, onSubmit, onCancel }) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: plan ? {
      name: plan.name,
      description: plan.description || '',
      interestType: plan.interestType,
      interestRate: plan.interestRate,
      minInvestment: plan.minInvestment,
      maxInvestment: plan.maxInvestment,
      tenure: plan.tenure,
      interestPayoutFrequency: plan.interestPayoutFrequency,
      principalRepayment: {
        percentage: plan.principalRepayment.percentage,
        startFromMonth: plan.principalRepayment.startFromMonth
      },
      isActive: plan.isActive,
      features: plan.features || [],
      riskLevel: plan.riskLevel
    } : {
      interestType: 'flat',
      interestPayoutFrequency: 'monthly',
      principalRepayment: {
        percentage: 100,
        startFromMonth: 1
      },
      isActive: true,
      features: [],
      riskLevel: 'medium'
    }
  });

  const watchTenure = watch('tenure');
  const watchStartFromMonth = watch('principalRepayment.startFromMonth');

  const handleFormSubmit = (data: FormData) => {
    // Convert features string to array if needed
    const formattedData = {
      ...data,
      features: Array.isArray(data.features) ? data.features : data.features.toString().split(',').map(f => f.trim()).filter(f => f)
    };
    onSubmit(formattedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Plan Name</label>
            <input
              {...register('name', { required: 'Plan name is required' })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter plan name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter plan description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Interest Type</label>
            <select
              {...register('interestType', { required: 'Interest type is required' })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="flat">Flat Interest</option>
              <option value="reducing">Reducing Balance</option>
            </select>
            {errors.interestType && <p className="mt-1 text-sm text-red-600">{errors.interestType.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Interest Rate (% per month)</label>
            <input
              {...register('interestRate', {
                required: 'Interest rate is required',
                min: { value: 0, message: 'Interest rate must be positive' },
                max: { value: 100, message: 'Interest rate cannot exceed 100%' }
              })}
              type="number"
              step="0.1"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="2.5"
            />
            {errors.interestRate && <p className="mt-1 text-sm text-red-600">{errors.interestRate.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tenure (months)</label>
            <input
              {...register('tenure', {
                required: 'Tenure is required',
                min: { value: 1, message: 'Tenure must be at least 1 month' },
                max: { value: 240, message: 'Tenure cannot exceed 240 months' }
              })}
              type="number"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="12"
            />
            {errors.tenure && <p className="mt-1 text-sm text-red-600">{errors.tenure.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Interest Payout Frequency</label>
            <select
              {...register('interestPayoutFrequency', { required: 'Payout frequency is required' })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="half_yearly">Half Yearly</option>
              <option value="yearly">Yearly</option>
            </select>
            {errors.interestPayoutFrequency && <p className="mt-1 text-sm text-red-600">{errors.interestPayoutFrequency.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Risk Level</label>
            <select
              {...register('riskLevel')}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>

          <div>
            <label className="flex items-center">
              <input
                {...register('isActive')}
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Plan is Active</span>
            </label>
          </div>
        </div>
      </div>

      {/* Investment Range */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Investment Range</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Minimum Investment (₹)</label>
            <input
              {...register('minInvestment', {
                required: 'Minimum investment is required',
                min: { value: 1000, message: 'Minimum investment must be at least ₹1,000' }
              })}
              type="number"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="50000"
            />
            {errors.minInvestment && <p className="mt-1 text-sm text-red-600">{errors.minInvestment.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Maximum Investment (₹)</label>
            <input
              {...register('maxInvestment', {
                required: 'Maximum investment is required',
                min: { value: 1000, message: 'Maximum investment must be at least ₹1,000' }
              })}
              type="number"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="1000000"
            />
            {errors.maxInvestment && <p className="mt-1 text-sm text-red-600">{errors.maxInvestment.message}</p>}
          </div>
        </div>
      </div>

      {/* Principal Repayment */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Principal Repayment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Repayment Percentage (%)</label>
            <input
              {...register('principalRepayment.percentage', {
                required: 'Repayment percentage is required',
                min: { value: 0, message: 'Percentage must be non-negative' },
                max: { value: 100, message: 'Percentage cannot exceed 100%' }
              })}
              type="number"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="100"
            />
            {errors.principalRepayment?.percentage && (
              <p className="mt-1 text-sm text-red-600">{errors.principalRepayment.percentage.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Start From Month</label>
            <input
              {...register('principalRepayment.startFromMonth', {
                required: 'Start month is required',
                min: { value: 1, message: 'Start month must be at least 1' },
                max: { value: watchTenure || 240, message: 'Start month cannot exceed tenure' }
              })}
              type="number"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="12"
            />
            {errors.principalRepayment?.startFromMonth && (
              <p className="mt-1 text-sm text-red-600">{errors.principalRepayment.startFromMonth.message}</p>
            )}
            {watchStartFromMonth > watchTenure && (
              <p className="mt-1 text-sm text-yellow-600">Start month should not exceed tenure</p>
            )}
          </div>
        </div>
      </div>

      {/* Features */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Plan Features</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700">Features (comma-separated)</label>
          <textarea
            {...register('features')}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="High Returns, Monthly Payouts, Flexible Terms"
          />
          <p className="mt-1 text-sm text-gray-500">Enter features separated by commas</p>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {plan ? 'Update Plan' : 'Create Plan'}
        </Button>
      </div>
    </form>
  );
};

export default PlanForm;