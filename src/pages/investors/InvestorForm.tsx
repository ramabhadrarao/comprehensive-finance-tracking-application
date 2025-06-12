import React from 'react';
import { useForm } from 'react-hook-form';
import Button from '../../components/common/Button';
import { Investor } from '../../types';

interface InvestorFormProps {
  investor?: Investor;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  kyc: {
    panNumber: string;
    aadharNumber: string;
    bankDetails: {
      accountNumber: string;
      ifscCode: string;
      bankName: string;
      branchName: string;
    };
  };
  status: 'active' | 'inactive' | 'blocked';
}

const InvestorForm: React.FC<InvestorFormProps> = ({ investor, onSubmit, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: investor ? {
      name: investor.name,
      email: investor.email,
      phone: investor.phone,
      address: {
        street: investor.address?.street || '',
        city: investor.address?.city || '',
        state: investor.address?.state || '',
        pincode: investor.address?.pincode || '',
        country: investor.address?.country || 'India'
      },
      kyc: {
        panNumber: investor.kyc.panNumber,
        aadharNumber: investor.kyc.aadharNumber,
        bankDetails: {
          accountNumber: investor.kyc.bankDetails.accountNumber,
          ifscCode: investor.kyc.bankDetails.ifscCode,
          bankName: investor.kyc.bankDetails.bankName,
          branchName: investor.kyc.bankDetails.branchName
        }
      },
      status: investor.status
    } : {
      address: { country: 'India' },
      status: 'active'
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              {...register('name', { required: 'Name is required' })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              type="email"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              {...register('phone', {
                required: 'Phone is required',
                pattern: {
                  value: /^[6-9]\d{9}$/,
                  message: 'Invalid phone number'
                }
              })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              {...register('status')}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Street Address</label>
            <input
              {...register('address.street')}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input
              {...register('address.city')}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <input
              {...register('address.state')}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Pincode</label>
            <input
              {...register('address.pincode', {
                pattern: {
                  value: /^\d{6}$/,
                  message: 'Invalid pincode'
                }
              })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.address?.pincode && (
              <p className="mt-1 text-sm text-red-600">{errors.address.pincode.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Country</label>
            <input
              {...register('address.country')}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* KYC Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">KYC Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">PAN Number</label>
            <input
              {...register('kyc.panNumber', {
                required: 'PAN number is required',
                pattern: {
                  value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                  message: 'Invalid PAN number'
                }
              })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
            />
            {errors.kyc?.panNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.kyc.panNumber.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Aadhar Number</label>
            <input
              {...register('kyc.aadharNumber', {
                required: 'Aadhar number is required',
                pattern: {
                  value: /^\d{12}$/,
                  message: 'Invalid Aadhar number'
                }
              })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.kyc?.aadharNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.kyc.aadharNumber.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Account Number</label>
            <input
              {...register('kyc.bankDetails.accountNumber', {
                required: 'Account number is required'
              })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.kyc?.bankDetails?.accountNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.kyc.bankDetails.accountNumber.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
            <input
              {...register('kyc.bankDetails.ifscCode', {
                required: 'IFSC code is required',
                pattern: {
                  value: /^[A-Z]{4}0[A-Z0-9]{6}$/,
                  message: 'Invalid IFSC code'
                }
              })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
            />
            {errors.kyc?.bankDetails?.ifscCode && (
              <p className="mt-1 text-sm text-red-600">{errors.kyc.bankDetails.ifscCode.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bank Name</label>
            <input
              {...register('kyc.bankDetails.bankName', {
                required: 'Bank name is required'
              })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.kyc?.bankDetails?.bankName && (
              <p className="mt-1 text-sm text-red-600">{errors.kyc.bankDetails.bankName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Branch Name</label>
            <input
              {...register('kyc.bankDetails.branchName', {
                required: 'Branch name is required'
              })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.kyc?.bankDetails?.branchName && (
              <p className="mt-1 text-sm text-red-600">{errors.kyc.bankDetails.branchName.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {investor ? 'Update Investor' : 'Create Investor'}
        </Button>
      </div>
    </form>
  );
};

export default InvestorForm;