import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { investmentsService } from '../../services/investments';
import { Investment } from '../../types';
import toast from 'react-hot-toast';

interface PaymentFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface FormData {
  investment: string;
  scheduleMonth: number;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card' | 'other';
  referenceNumber: string;
  interestAmount: number;
  principalAmount: number;
  penaltyAmount: number;
  bonusAmount: number;
  notes: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSubmit, onCancel }) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: {
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
      penaltyAmount: 0,
      bonusAmount: 0
    }
  });

  const watchInvestment = watch('investment');
  const watchScheduleMonth = watch('scheduleMonth');
  const watchAmount = watch('amount');

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const response = await investmentsService.getInvestments({ 
          status: 'active',
          limit: 100 
        });
        setInvestments(response.data || []);
      } catch (error: any) {
        toast.error('Failed to load investments');
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, []);

  useEffect(() => {
    if (watchInvestment) {
      const investment = investments.find(inv => inv._id === watchInvestment);
      setSelectedInvestment(investment || null);
      
      if (investment) {
        // Get pending/overdue months
        const pendingMonths = investment.schedule
          .filter(s => s.status === 'pending' || s.status === 'overdue' || s.status === 'partial')
          .map(s => s.month);
        setAvailableMonths(pendingMonths);
        
        if (pendingMonths.length > 0) {
          setValue('scheduleMonth', pendingMonths[0]);
        }
      }
    }
  }, [watchInvestment, investments, setValue]);

  useEffect(() => {
    if (selectedInvestment && watchScheduleMonth) {
      const scheduleItem = selectedInvestment.schedule.find(s => s.month === watchScheduleMonth);
      if (scheduleItem) {
        const remainingAmount = scheduleItem.totalAmount - scheduleItem.paidAmount;
        setValue('amount', remainingAmount);
        setValue('interestAmount', Math.min(remainingAmount, scheduleItem.interestAmount));
        setValue('principalAmount', Math.max(0, remainingAmount - scheduleItem.interestAmount));
      }
    }
  }, [selectedInvestment, watchScheduleMonth, setValue]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getScheduleDetails = () => {
    if (!selectedInvestment || !watchScheduleMonth) return null;
    
    const scheduleItem = selectedInvestment.schedule.find(s => s.month === watchScheduleMonth);
    return scheduleItem;
  };

  const scheduleDetails = getScheduleDetails();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Investment Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Investment</label>
            <select
              {...register('investment', { required: 'Please select an investment' })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Investment</option>
              {investments.map((investment) => (
                <option key={investment._id} value={investment._id}>
                  {investment.investmentId} - {investment.investor.name}
                </option>
              ))}
            </select>
            {errors.investment && <p className="mt-1 text-sm text-red-600">{errors.investment.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Schedule Month</label>
            <select
              {...register('scheduleMonth', { 
                required: 'Please select a schedule month',
                valueAsNumber: true 
              })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!selectedInvestment}
            >
              <option value="">Select Month</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  Month {month}
                </option>
              ))}
            </select>
            {errors.scheduleMonth && <p className="mt-1 text-sm text-red-600">{errors.scheduleMonth.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Date</label>
            <input
              {...register('paymentDate', { required: 'Payment date is required' })}
              type="date"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.paymentDate && <p className="mt-1 text-sm text-red-600">{errors.paymentDate.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select
              {...register('paymentMethod', { required: 'Payment method is required' })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
            {errors.paymentMethod && <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Reference Number</label>
            <input
              {...register('referenceNumber')}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Transaction reference number"
            />
          </div>
        </div>
      </div>

      {/* Schedule Information */}
      {scheduleDetails && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-md font-medium text-blue-900 mb-3">Schedule Details - Month {scheduleDetails.month}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Due Date:</span>
              <div className="font-medium">{new Date(scheduleDetails.dueDate).toLocaleDateString()}</div>
            </div>
            <div>
              <span className="text-blue-700">Total Due:</span>
              <div className="font-medium">{formatCurrency(scheduleDetails.totalAmount)}</div>
            </div>
            <div>
              <span className="text-blue-700">Already Paid:</span>
              <div className="font-medium">{formatCurrency(scheduleDetails.paidAmount)}</div>
            </div>
            <div>
              <span className="text-blue-700">Remaining:</span>
              <div className="font-medium">{formatCurrency(scheduleDetails.totalAmount - scheduleDetails.paidAmount)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Amount Breakdown */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Amount Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Payment Amount (₹)</label>
            <input
              {...register('amount', {
                required: 'Payment amount is required',
                min: { value: 0.01, message: 'Amount must be greater than 0' },
                valueAsNumber: true
              })}
              type="number"
              step="0.01"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter payment amount"
            />
            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Interest Amount (₹)</label>
            <input
              {...register('interestAmount', {
                min: { value: 0, message: 'Interest amount cannot be negative' },
                valueAsNumber: true
              })}
              type="number"
              step="0.01"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Interest portion"
            />
            {errors.interestAmount && <p className="mt-1 text-sm text-red-600">{errors.interestAmount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Principal Amount (₹)</label>
            <input
              {...register('principalAmount', {
                min: { value: 0, message: 'Principal amount cannot be negative' },
                valueAsNumber: true
              })}
              type="number"
              step="0.01"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Principal portion"
            />
            {errors.principalAmount && <p className="mt-1 text-sm text-red-600">{errors.principalAmount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Penalty Amount (₹)</label>
            <input
              {...register('penaltyAmount', {
                min: { value: 0, message: 'Penalty amount cannot be negative' },
                valueAsNumber: true
              })}
              type="number"
              step="0.01"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Penalty (if any)"
            />
            {errors.penaltyAmount && <p className="mt-1 text-sm text-red-600">{errors.penaltyAmount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bonus Amount (₹)</label>
            <input
              {...register('bonusAmount', {
                min: { value: 0, message: 'Bonus amount cannot be negative' },
                valueAsNumber: true
              })}
              type="number"
              step="0.01"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Bonus (if any)"
            />
            {errors.bonusAmount && <p className="mt-1 text-sm text-red-600">{errors.bonusAmount.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes about this payment"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Record Payment
        </Button>
      </div>
    </form>
  );
};

export default PaymentForm;