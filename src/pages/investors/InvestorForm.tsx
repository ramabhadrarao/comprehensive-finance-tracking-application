// src/pages/investors/InvestorForm.tsx - Enhanced with User Account Creation
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, CheckCircle, XCircle, User, Lock } from 'lucide-react';
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
  // NEW: User account creation fields
  createUserAccount: boolean;
  userAccountDetails?: {
    password: string;
    confirmPassword: string;
    sendCredentials: boolean;
    temporaryPassword: boolean;
  };
}

const InvestorForm: React.FC<InvestorFormProps> = ({ investor, onSubmit, onCancel }) => {
  const [showAadhar, setShowAadhar] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [panValidation, setPanValidation] = useState<{ isValid: boolean; message: string } | null>(null);
  const [ifscValidation, setIfscValidation] = useState<{ isValid: boolean; message: string } | null>(null);
  const [createUserAccount, setCreateUserAccount] = useState(!investor); // Default to true for new investors

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
      status: investor.status,
      createUserAccount: !!investor.userId, // True if user already has account
      userAccountDetails: {
        password: '',
        confirmPassword: '',
        sendCredentials: false,
        temporaryPassword: false
      }
    } : {
      address: { country: 'India' },
      status: 'active',
      createUserAccount: true,
      userAccountDetails: {
        password: '',
        confirmPassword: '',
        sendCredentials: true,
        temporaryPassword: true
      }
    }
  });

  // Watch form values
  const watchPan = watch('kyc.panNumber');
  const watchIfsc = watch('kyc.bankDetails.ifscCode');
  const watchPassword = watch('userAccountDetails.password');
  const watchCreateAccount = watch('createUserAccount');

  // Generate temporary password
  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue('userAccountDetails.password', password);
    setValue('userAccountDetails.confirmPassword', password);
  };

  // Validation functions
  const validatePAN = (pan: string) => {
    if (!pan) return null;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const isValid = panRegex.test(pan.toUpperCase());
    return {
      isValid,
      message: isValid ? 'Valid PAN format' : 'Invalid PAN format. Example: AKDPB7458C'
    };
  };

  const validateIFSC = (ifsc: string) => {
    if (!ifsc) return null;
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    const isValid = ifscRegex.test(ifsc.toUpperCase());
    return {
      isValid,
      message: isValid ? 'Valid IFSC format' : 'Invalid IFSC format. Example: SBIN0001234'
    };
  };

  // Real-time validation
  React.useEffect(() => {
    setPanValidation(watchPan ? validatePAN(watchPan) : null);
  }, [watchPan]);

  React.useEffect(() => {
    setIfscValidation(watchIfsc ? validateIFSC(watchIfsc) : null);
  }, [watchIfsc]);

  // Auto-format handlers
  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setValue('kyc.panNumber', value);
  };

  const handleIfscChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setValue('kyc.bankDetails.ifscCode', value);
  };

  const ValidationIcon: React.FC<{ validation: { isValid: boolean; message: string } | null }> = ({ validation }) => {
    if (!validation) return null;
    return validation.isValid ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const passwordStrength = (password: string) => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
      { score: 0, label: 'Very Weak', color: 'text-red-600' },
      { score: 1, label: 'Weak', color: 'text-red-500' },
      { score: 2, label: 'Fair', color: 'text-yellow-500' },
      { score: 3, label: 'Good', color: 'text-blue-500' },
      { score: 4, label: 'Strong', color: 'text-green-500' },
      { score: 5, label: 'Very Strong', color: 'text-green-600' }
    ];

    return levels[score] || levels[0];
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name *</label>
            <input
              {...register('name', { 
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
                pattern: {
                  value: /^[a-zA-Z\s]+$/,
                  message: 'Name should only contain letters and spaces'
                }
              })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter full name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email *</label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address'
                }
              })}
              type="email"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter email address"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
            <input
              {...register('phone', {
                required: 'Phone number is required',
                pattern: {
                  value: /^[6-9]\d{9}$/,
                  message: 'Please enter a valid 10-digit mobile number starting with 6-9'
                }
              })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter 10-digit mobile number"
              maxLength={10}
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

      {/* Address Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Street Address</label>
            <input
              {...register('address.street')}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter street address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input
              {...register('address.city')}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter city"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <input
              {...register('address.state')}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter state"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Pincode</label>
            <input
              {...register('address.pincode', {
                pattern: {
                  value: /^\d{6}$/,
                  message: 'Pincode must be exactly 6 digits'
                }
              })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter 6-digit pincode"
              maxLength={6}
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
              placeholder="Enter country"
            />
          </div>
        </div>
      </div>

      {/* KYC Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">KYC Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PAN Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700">PAN Number *</label>
            <div className="relative">
              <input
                {...register('kyc.panNumber', {
                  required: 'PAN number is required',
                  pattern: {
                    value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                    message: 'Invalid PAN format. Example: AKDPB7458C'
                  }
                })}
                onChange={handlePanChange}
                className={`mt-1 block w-full border rounded-lg px-3 py-2 pr-10 focus:ring-blue-500 focus:border-blue-500 ${
                  panValidation?.isValid ? 'border-green-300' : 
                  panValidation?.isValid === false ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="AKDPB7458C"
                maxLength={10}
                style={{ textTransform: 'uppercase' }}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <ValidationIcon validation={panValidation} />
              </div>
            </div>
            {errors.kyc?.panNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.kyc.panNumber.message}</p>
            )}
            {panValidation && (
              <p className={`mt-1 text-sm ${panValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                {panValidation.message}
              </p>
            )}
          </div>

          {/* Aadhar Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Aadhar Number *</label>
            <div className="relative">
              <input
                {...register('kyc.aadharNumber', {
                  required: 'Aadhar number is required',
                  pattern: {
                    value: /^\d{12}$/,
                    message: 'Aadhar number must be exactly 12 digits'
                  }
                })}
                type={showAadhar ? 'text' : 'password'}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter 12-digit Aadhar number"
                maxLength={12}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowAadhar(!showAadhar)}
              >
                {showAadhar ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
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
          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Account Number *</label>
            <div className="relative">
              <input
                {...register('kyc.bankDetails.accountNumber', {
                  required: 'Account number is required',
                  pattern: {
                    value: /^\d{9,18}$/,
                    message: 'Account number must be 9-18 digits'
                  }
                })}
                type={showAccount ? 'text' : 'password'}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter bank account number"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowAccount(!showAccount)}
              >
                {showAccount ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.kyc?.bankDetails?.accountNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.kyc.bankDetails.accountNumber.message}</p>
            )}
          </div>

          {/* IFSC Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700">IFSC Code *</label>
            <div className="relative">
              <input
                {...register('kyc.bankDetails.ifscCode', {
                  required: 'IFSC code is required',
                  pattern: {
                    value: /^[A-Z]{4}0[A-Z0-9]{6}$/,
                    message: 'Invalid IFSC format. Example: SBIN0001234'
                  }
                })}
                onChange={handleIfscChange}
                className={`mt-1 block w-full border rounded-lg px-3 py-2 pr-10 focus:ring-blue-500 focus:border-blue-500 ${
                  ifscValidation?.isValid ? 'border-green-300' : 
                  ifscValidation?.isValid === false ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="SBIN0001234"
                maxLength={11}
                style={{ textTransform: 'uppercase' }}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <ValidationIcon validation={ifscValidation} />
              </div>
            </div>
            {errors.kyc?.bankDetails?.ifscCode && (
              <p className="mt-1 text-sm text-red-600">{errors.kyc.bankDetails.ifscCode.message}</p>
            )}
            {ifscValidation && (
              <p className={`mt-1 text-sm ${ifscValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                {ifscValidation.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bank Name *</label>
            <input
              {...register('kyc.bankDetails.bankName', {
                required: 'Bank name is required',
                minLength: { value: 2, message: 'Bank name must be at least 2 characters' }
              })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter bank name"
            />
            {errors.kyc?.bankDetails?.bankName && (
              <p className="mt-1 text-sm text-red-600">{errors.kyc.bankDetails.bankName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Branch Name *</label>
            <input
              {...register('kyc.bankDetails.branchName', {
                required: 'Branch name is required',
                minLength: { value: 2, message: 'Branch name must be at least 2 characters' }
              })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter branch name"
            />
            {errors.kyc?.bankDetails?.branchName && (
              <p className="mt-1 text-sm text-red-600">{errors.kyc.bankDetails.branchName.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* NEW: User Account Creation Section */}
      {!investor && (
        <div className="border-t pt-6">
          <div className="flex items-center space-x-3 mb-4">
            <User className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">User Account Creation</h3>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <div className="flex items-center">
              <input
                {...register('createUserAccount')}
                type="checkbox"
                checked={createUserAccount}
                onChange={(e) => setCreateUserAccount(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-3"
              />
              <div>
                <label className="text-sm font-medium text-blue-900">
                  Create user account for this investor
                </label>
                <p className="text-sm text-blue-700">
                  This will allow the investor to log in and view their investment portfolio
                </p>
              </div>
            </div>
          </div>

          {watchCreateAccount && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password *</label>
                  <div className="relative">
                    <input
                      {...register('userAccountDetails.password', {
                        required: watchCreateAccount ? 'Password is required' : false,
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters'
                        }
                      })}
                      type={showPassword ? 'text' : 'password'}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {watchPassword && (
                    <div className="mt-1">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full transition-all duration-300 ${
                              passwordStrength(watchPassword).score <= 2
                                ? 'bg-red-500'
                                : passwordStrength(watchPassword).score <= 3
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{
                              width: `${(passwordStrength(watchPassword).score / 5) * 100}%`,
                            }}
                          />
                        </div>
                        <span
                          className={`text-xs ${passwordStrength(watchPassword).color}`}
                        >
                          {passwordStrength(watchPassword).label}
                        </span>
                      </div>
                    </div>
                  )}
                  {errors.userAccountDetails?.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.userAccountDetails.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
                  <div className="relative">
                    <input
                      {...register('userAccountDetails.confirmPassword', {
                        required: watchCreateAccount ? 'Please confirm password' : false,
                        validate: (value) =>
                          !watchCreateAccount || value === watchPassword || 'Passwords do not match'
                      })}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.userAccountDetails?.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.userAccountDetails.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateTempPassword}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Generate Temporary Password
                </Button>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      {...register('userAccountDetails.temporaryPassword')}
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                    />
                    <label className="text-sm text-gray-700">Temporary password</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      {...register('userAccountDetails.sendCredentials')}
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                    />
                    <label className="text-sm text-gray-700">Send credentials via email</label>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> The investor will be assigned the "investor" role and will only be able to view their own investments and payments.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validation Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Validation Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <div className="flex items-center">
            <ValidationIcon validation={panValidation} />
            <span className="ml-2">PAN Number Format</span>
          </div>
          <div className="flex items-center">
            <ValidationIcon validation={ifscValidation} />
            <span className="ml-2">IFSC Code Format</span>
          </div>
          {watchCreateAccount && (
            <div className="flex items-center">
              {watchPassword && passwordStrength(watchPassword).score >= 3 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="ml-2">Password Strength</span>
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          loading={isSubmitting}
          disabled={
            panValidation?.isValid === false || 
            ifscValidation?.isValid === false ||
            (watchCreateAccount && passwordStrength(watchPassword || '').score < 3)
          }
        >
          {investor ? 'Update Investor' : 'Create Investor'}
        </Button>
      </div>
    </form>
  );
};

export default InvestorForm;