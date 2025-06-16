// backend/seeders/index.js - Complete Updated Seeder
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Investor from '../models/Investor.js';
import Plan from '../models/Plan.js';
import Investment from '../models/Investment.js';
import Payment from '../models/Payment.js';
import Settings from '../models/Settings.js';
import connectDB from '../config/database.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();
    
    // Clear ALL existing data
    console.log('🗑️  Clearing ALL existing data...');
    await Promise.all([
      User.deleteMany({}),
      Investor.deleteMany({}),
      Plan.deleteMany({}),
      Investment.deleteMany({}),
      Payment.deleteMany({}),
      Settings.deleteMany({})
    ]);

    // Create Users with proper password hashing
    console.log('👥 Creating users...');
    
    const plainPassword = 'password123';
    console.log('🔐 Setting up authentication...');
    
    const users = await User.create([
      {
        name: 'System Administrator',
        email: 'admin@financetracker.com',
        password: plainPassword,
        role: 'admin',
        phone: '+91-9876543210',
        isActive: true
      },
      {
        name: 'Finance Manager',
        email: 'finance@financetracker.com',
        password: plainPassword,
        role: 'finance_manager',
        phone: '+91-9876543211',
        isActive: true
      },
      {
        name: 'Raj Patel',
        email: 'raj@example.com',
        password: plainPassword,
        role: 'investor',
        phone: '+91-9876543212',
        isActive: true
      },
      {
        name: 'Priya Singh',
        email: 'priya@example.com',
        password: plainPassword,
        role: 'investor',
        phone: '+91-9876543213',
        isActive: true
      },
      {
        name: 'Amit Sharma',
        email: 'amit@example.com',
        password: plainPassword,
        role: 'investor',
        phone: '+91-9876543214',
        isActive: true
      }
    ]);

    const [adminUser, financeUser, rajUser, priyaUser, amitUser] = users;
    console.log('✅ Users created successfully');

    // Verify password hashing
    console.log('🔍 Verifying password hashing...');
    for (const user of users) {
      const isValid = await user.comparePassword(plainPassword);
      console.log(`   ${user.email}: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    }

    // Create Settings
    console.log('⚙️  Creating system settings...');
    await Settings.create({
      company: {
        name: 'FinanceTracker Pro',
        email: 'admin@financetracker.com',
        phone: '+1-234-567-8900',
        address: {
          street: '123 Financial District',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India'
        },
        website: 'https://financetracker.com',
        taxId: 'GST27ABCDE1234F1Z5',
        registrationNumber: 'U67120MH2024PTC123456'
      },
      financial: {
        defaultCurrency: 'INR',
        currencySymbol: '₹',
        financialYearStart: 'April',
        interestCalculationMethod: 'monthly',
        defaultLateFee: 2,
        gracePeriodDays: 7
      },
      notifications: {
        emailEnabled: true,
        smsEnabled: true,
        paymentReminders: {
          enabled: true,
          daysBefore: 3
        },
        overdueAlerts: {
          enabled: true,
          frequency: 'weekly'
        },
        investmentMaturity: {
          enabled: true,
          daysBefore: 30
        }
      },
      security: {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true
        },
        sessionTimeout: 60,
        maxLoginAttempts: 5,
        twoFactorAuth: false
      },
      backup: {
        enabled: true,
        frequency: 'daily',
        retentionDays: 30
      },
      updatedBy: adminUser._id
    });

    // Create Enhanced Plans with Repayment Plans
    console.log('📋 Creating comprehensive investment plans...');
    const plans = [];
    
    // Plan 1: Premium Gold Plan with Multiple Repayment Options
    const premiumGoldPlan = new Plan({
      name: 'Premium Gold Plan - Elite Investment',
      description: 'High-yield premium investment plan with multiple repayment options and exclusive benefits for elite investors',
      interestType: 'flat',
      interestRate: 3.0,
      minInvestment: 100000,
      maxInvestment: 5000000,
      tenure: 12,
      interestPayoutFrequency: 'monthly',
      principalRepayment: {
        percentage: 100,
        startFromMonth: 12
      },
      isActive: true,
      features: ['Premium Returns', 'Monthly Interest', 'Flexible Withdrawal', 'Dedicated Support', 'VIP Services'],
      riskLevel: 'medium',
      createdBy: adminUser._id,
      repaymentPlans: [
        {
          planName: 'Monthly Interest Only',
          paymentType: 'interest',
          interestPayment: {
            interestType: 'flat',
            interestRate: 3.0,
            interestFrequency: 'monthly',
            principalRepaymentOption: 'fixed',
            withdrawalAfterPercentage: 80,
            principalSettlementTerm: 3
          },
          isDefault: true,
          isActive: true
        },
        {
          planName: 'Quarterly Interest with Principal',
          paymentType: 'interestWithPrincipal',
          interestWithPrincipalPayment: {
            interestRate: 3.0,
            interestType: 'flat',
            principalRepaymentPercentage: 25,
            paymentFrequency: 'quarterly'
          },
          isDefault: false,
          isActive: true
        },
        {
          planName: 'Flexible Withdrawal Plan',
          paymentType: 'interest',
          interestPayment: {
            interestType: 'reducing',
            interestRate: 3.2,
            interestFrequency: 'monthly',
            principalRepaymentOption: 'flexible',
            withdrawalAfterPercentage: 60,
            principalSettlementTerm: 6
          },
          isDefault: false,
          isActive: true
        }
      ]
    });
    await premiumGoldPlan.save();
    plans.push(premiumGoldPlan);

    // Plan 2: Smart Silver Plan
    const smartSilverPlan = new Plan({
      name: 'Smart Silver Plan - Balanced Growth',
      description: 'Balanced investment plan with steady returns and moderate risk for smart investors',
      interestType: 'reducing',
      interestRate: 2.5,
      minInvestment: 50000,
      maxInvestment: 2000000,
      tenure: 18,
      interestPayoutFrequency: 'quarterly',
      principalRepayment: {
        percentage: 50,
        startFromMonth: 6
      },
      isActive: true,
      features: ['Steady Growth', 'Quarterly Payouts', 'Balanced Risk', 'Professional Management'],
      riskLevel: 'low',
      createdBy: adminUser._id,
      repaymentPlans: [
        {
          planName: 'Standard Quarterly Plan',
          paymentType: 'interestWithPrincipal',
          interestWithPrincipalPayment: {
            interestRate: 2.5,
            interestType: 'reducing',
            principalRepaymentPercentage: 30,
            paymentFrequency: 'quarterly'
          },
          isDefault: true,
          isActive: true
        },
        {
          planName: 'Monthly Interest Plan',
          paymentType: 'interest',
          interestPayment: {
            interestType: 'reducing',
            interestRate: 2.3,
            interestFrequency: 'monthly',
            principalRepaymentOption: 'fixed'
          },
          isDefault: false,
          isActive: true
        }
      ]
    });
    await smartSilverPlan.save();
    plans.push(smartSilverPlan);

    // Plan 3: Platinum Elite Plan
    const platinumElitePlan = new Plan({
      name: 'Platinum Elite Plan - Maximum Returns',
      description: 'Ultra-premium investment plan with maximum returns for high-net-worth individuals',
      interestType: 'flat',
      interestRate: 3.5,
      minInvestment: 500000,
      maxInvestment: 10000000,
      tenure: 24,
      interestPayoutFrequency: 'monthly',
      principalRepayment: {
        percentage: 25,
        startFromMonth: 18
      },
      isActive: true,
      features: ['Maximum Returns', 'Elite Status', 'Personal Advisor', 'Priority Processing', 'Exclusive Events'],
      riskLevel: 'high',
      createdBy: adminUser._id,
      repaymentPlans: [
        {
          planName: 'Elite Monthly Returns',
          paymentType: 'interest',
          interestPayment: {
            interestType: 'flat',
            interestRate: 3.5,
            interestFrequency: 'monthly',
            principalRepaymentOption: 'flexible',
            withdrawalAfterPercentage: 75,
            principalSettlementTerm: 6
          },
          isDefault: true,
          isActive: true
        },
        {
          planName: 'Progressive Principal Plan',
          paymentType: 'interestWithPrincipal',
          interestWithPrincipalPayment: {
            interestRate: 3.5,
            interestType: 'flat',
            principalRepaymentPercentage: 20,
            paymentFrequency: 'monthly'
          },
          isDefault: false,
          isActive: true
        }
      ]
    });
    await platinumElitePlan.save();
    plans.push(platinumElitePlan);

    // Plan 4: Secure Bronze Plan
    const secureBronzePlan = new Plan({
      name: 'Secure Bronze Plan - Safe Investment',
      description: 'Conservative investment plan with guaranteed returns and minimal risk for first-time investors',
      interestType: 'flat',
      interestRate: 2.0,
      minInvestment: 25000,
      maxInvestment: 500000,
      tenure: 12,
      interestPayoutFrequency: 'monthly',
      principalRepayment: {
        percentage: 100,
        startFromMonth: 10
      },
      isActive: true,
      features: ['Low Risk', 'Guaranteed Returns', 'Beginner Friendly', 'Short Term', 'Capital Protection'],
      riskLevel: 'low',
      createdBy: adminUser._id,
      repaymentPlans: [
        {
          planName: 'Safe Monthly Interest',
          paymentType: 'interest',
          interestPayment: {
            interestType: 'flat',
            interestRate: 2.0,
            interestFrequency: 'monthly',
            principalRepaymentOption: 'fixed'
          },
          isDefault: true,
          isActive: true
        }
      ]
    });
    await secureBronzePlan.save();
    plans.push(secureBronzePlan);

    // Plan 5: Dynamic Growth Plan
    const dynamicGrowthPlan = new Plan({
      name: 'Dynamic Growth Plan - Adaptive Strategy',
      description: 'Adaptive investment plan with dynamic returns based on market performance',
      interestType: 'reducing',
      interestRate: 2.8,
      minInvestment: 75000,
      maxInvestment: 3000000,
      tenure: 15,
      interestPayoutFrequency: 'monthly',
      principalRepayment: {
        percentage: 60,
        startFromMonth: 8
      },
      isActive: true,
      features: ['Dynamic Returns', 'Market Linked', 'Professional Management', 'Growth Potential', 'Performance Bonus'],
      riskLevel: 'medium',
      createdBy: adminUser._id,
      repaymentPlans: [
        {
          planName: 'Adaptive Monthly Plan',
          paymentType: 'interest',
          interestPayment: {
            interestType: 'reducing',
            interestRate: 2.8,
            interestFrequency: 'monthly',
            principalRepaymentOption: 'flexible',
            withdrawalAfterPercentage: 70,
            principalSettlementTerm: 4
          },
          isDefault: true,
          isActive: true
        },
        {
          planName: 'Growth with Principal',
          paymentType: 'interestWithPrincipal',
          interestWithPrincipalPayment: {
            interestRate: 2.8,
            interestType: 'reducing',
            principalRepaymentPercentage: 40,
            paymentFrequency: 'quarterly'
          },
          isDefault: false,
          isActive: true
        }
      ]
    });
    await dynamicGrowthPlan.save();
    plans.push(dynamicGrowthPlan);

    console.log(`✅ Created ${plans.length} investment plans with repayment options`);

    // Create Comprehensive Investors
    console.log('👤 Creating diverse investor profiles...');
    const investors = [];

    // Investor 1: High Net Worth Individual
    const rajeshInvestor = new Investor({
      name: 'Rajesh Kumar Patel',
      email: 'rajesh.patel@email.com',
      phone: '9876543210',
      address: {
        street: '401, Oberoi Sky Heights, Lokhandwala Complex',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400053',
        country: 'India'
      },
      kyc: {
        panNumber: 'ABCDE1234F',
        aadharNumber: '123456789012',
        bankDetails: {
          accountNumber: '12345678901234',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank',
          branchName: 'Andheri West Branch'
        }
      },
      status: 'active',
      userId: rajUser._id,
      createdBy: adminUser._id
    });
    await rajeshInvestor.save();
    investors.push(rajeshInvestor);

    // Investor 2: Corporate Executive
    const priyaInvestor = new Investor({
      name: 'Priya Singh Chauhan',
      email: 'priya.chauhan@email.com',
      phone: '9876543211',
      address: {
        street: 'B-405, DLF Phase 2, Sector 25',
        city: 'Gurgaon',
        state: 'Haryana',
        pincode: '122002',
        country: 'India'
      },
      kyc: {
        panNumber: 'FGHIJ5678K',
        aadharNumber: '234567890123',
        bankDetails: {
          accountNumber: '23456789012345',
          ifscCode: 'ICIC0002345',
          bankName: 'ICICI Bank',
          branchName: 'DLF Phase 2 Branch'
        }
      },
      status: 'active',
      userId: priyaUser._id,
      createdBy: financeUser._id
    });
    await priyaInvestor.save();
    investors.push(priyaInvestor);

    // Investor 3: Business Owner
    const amitInvestor = new Investor({
      name: 'Amit Sharma',
      email: 'amit.sharma@email.com',
      phone: '9876543212',
      address: {
        street: '1201, Shanti Tower, Satellite Road',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380015',
        country: 'India'
      },
      kyc: {
        panNumber: 'LMNOP9012Q',
        aadharNumber: '345678901234',
        bankDetails: {
          accountNumber: '34567890123456',
          ifscCode: 'SBIN0003456',
          bankName: 'State Bank of India',
          branchName: 'Satellite Branch'
        }
      },
      status: 'active',
      userId: amitUser._id,
      createdBy: financeUser._id
    });
    await amitInvestor.save();
    investors.push(amitInvestor);

    // Investor 4: IT Professional
    const sunitaInvestor = new Investor({
      name: 'Sunita Reddy Venkatesh',
      email: 'sunita.reddy@email.com',
      phone: '9876543213',
      address: {
        street: '801, Phoenix Towers, Hi-Tech City',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
        country: 'India'
      },
      kyc: {
        panNumber: 'RSTUV3456W',
        aadharNumber: '456789012345',
        bankDetails: {
          accountNumber: '45678901234567',
          ifscCode: 'AXIS0004567',
          bankName: 'Axis Bank',
          branchName: 'Hi-Tech City Branch'
        }
      },
      status: 'active',
      createdBy: financeUser._id
    });
    await sunitaInvestor.save();
    investors.push(sunitaInvestor);

    // Investor 5: Senior Professional
    const vikramInvestor = new Investor({
      name: 'Vikram Singh Rathore',
      email: 'vikram.rathore@email.com',
      phone: '9876543214',
      address: {
        street: '602, Royal Palms, Civil Lines',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302006',
        country: 'India'
      },
      kyc: {
        panNumber: 'XYZAB7890C',
        aadharNumber: '567890123456',
        bankDetails: {
          accountNumber: '56789012345678',
          ifscCode: 'PUNB0005678',
          bankName: 'Punjab National Bank',
          branchName: 'Civil Lines Branch'
        }
      },
      status: 'active',
      createdBy: adminUser._id
    });
    await vikramInvestor.save();
    investors.push(vikramInvestor);

    console.log(`✅ Created ${investors.length} investor profiles`);

    // Create Sophisticated Investments with Enhanced Features
    console.log('💰 Creating sophisticated investments...');
    const investments = [];
    
    // Investment 1: Rajesh - Premium Gold Plan with Custom Repayment
    const investment1 = new Investment({
      investor: investors[0]._id,
      plan: plans[0]._id,
      selectedRepaymentPlan: {
        planType: 'existing',
        existingPlanId: plans[0].repaymentPlans[0]._id
      },
      principalAmount: 1500000,
      investmentDate: new Date('2024-01-15'),
      maturityDate: new Date('2025-01-15'),
      interestRate: plans[0].interestRate,
      interestType: plans[0].interestType,
      tenure: plans[0].tenure,
      totalExpectedReturns: 2040000,
      totalInterestExpected: 540000,
      remainingAmount: 2040000,
      notes: 'Premium investment with VIP services - High Net Worth Individual',
      createdBy: adminUser._id,
      timeline: [
        {
          date: new Date('2024-01-15'),
          type: 'investment_created',
          description: 'Premium Gold Plan investment created for ₹15,00,000',
          amount: 1500000,
          performedBy: adminUser._id,
          metadata: {
            planId: plans[0]._id,
            investorId: investors[0]._id,
            repaymentPlanType: 'existing'
          }
        },
        {
          date: new Date('2024-01-16'),
          type: 'document_uploaded',
          description: 'KYC documents verified and uploaded',
          performedBy: financeUser._id,
          metadata: {
            category: 'kyc',
            documentCount: 4
          }
        },
        {
          date: new Date('2024-01-20'),
          type: 'note_added',
          description: 'VIP services activated - Dedicated relationship manager assigned',
          performedBy: adminUser._id,
          metadata: {
            vipStatus: true,
            relationshipManager: 'Sarah Johnson'
          }
        }
      ],
      riskAssessment: {
        score: 6,
        factors: ['High Net Worth', 'Premium Plan', 'Stable Income'],
        lastUpdated: new Date('2024-01-15')
      }
    });
    
    investment1.plan = plans[0];
    investment1.schedule = investment1.generateSchedule();
    await investment1.save();
    investments.push(investment1);

    // Investment 2: Priya - Smart Silver Plan with Quarterly Payouts
    const investment2 = new Investment({
      investor: investors[1]._id,
      plan: plans[1]._id,
      selectedRepaymentPlan: {
        planType: 'existing',
        existingPlanId: plans[1].repaymentPlans[0]._id
      },
      principalAmount: 750000,
      investmentDate: new Date('2024-02-01'),
      maturityDate: new Date('2025-08-01'),
      interestRate: plans[1].interestRate,
      interestType: plans[1].interestType,
      tenure: plans[1].tenure,
      totalExpectedReturns: 1087500,
      totalInterestExpected: 337500,
      remainingAmount: 1087500,
      notes: 'Corporate executive - Balanced investment approach',
      createdBy: financeUser._id,
      timeline: [
        {
          date: new Date('2024-02-01'),
          type: 'investment_created',
          description: 'Smart Silver Plan investment created for ₹7,50,000',
          amount: 750000,
          performedBy: financeUser._id,
          metadata: {
            planId: plans[1]._id,
            investorId: investors[1]._id
          }
        },
        {
          date: new Date('2024-02-05'),
          type: 'document_uploaded',
          description: 'Investment agreement signed and uploaded',
          performedBy: financeUser._id,
          metadata: {
            category: 'agreement',
            fileName: 'investment_agreement_v2.pdf'
          }
        },
        {
          date: new Date('2024-02-10'),
          type: 'communication',
          description: 'Welcome call completed - Investment details explained',
          performedBy: financeUser._id,
          metadata: {
            callDuration: '45 minutes',
            satisfaction: 'excellent'
          }
        }
      ],
      riskAssessment: {
        score: 4,
        factors: ['Corporate Professional', 'Balanced Approach', 'Regular Income'],
        lastUpdated: new Date('2024-02-01')
      }
    });
    
    investment2.plan = plans[1];
    investment2.schedule = investment2.generateSchedule();
    await investment2.save();
    investments.push(investment2);

    // Investment 3: Amit - Platinum Elite Plan with Maximum Returns
    const investment3 = new Investment({
      investor: investors[2]._id,
      plan: plans[2]._id,
      selectedRepaymentPlan: {
        planType: 'new',
        customPlan: {
          paymentType: 'interest',
          interestPayment: {
            dateOfInvestment: new Date('2024-03-01'),
            amountInvested: 2500000,
            tenure: 24,
            interestRate: 3.5,
            interestType: 'flat',
            interestFrequency: 'monthly',
            interestStartDate: new Date('2024-04-01'),
            principalRepaymentOption: 'flexible',
            withdrawalAfterPercentage: 80,
            principalSettlementTerm: 6
          }
        }
      },
      principalAmount: 2500000,
      investmentDate: new Date('2024-03-01'),
      maturityDate: new Date('2026-03-01'),
      interestRate: plans[2].interestRate,
      interestType: plans[2].interestType,
      tenure: plans[2].tenure,
      totalExpectedReturns: 4600000,
      totalInterestExpected: 2100000,
      remainingAmount: 4600000,
      notes: 'Business owner - Ultra-premium investment with custom repayment plan',
      createdBy: adminUser._id,
      timeline: [
        {
          date: new Date('2024-03-01'),
          type: 'investment_created',
          description: 'Platinum Elite Plan investment created for ₹25,00,000',
          amount: 2500000,
          performedBy: adminUser._id,
          metadata: {
            planId: plans[2]._id,
            investorId: investors[2]._id,
            customPlan: true
          }
        },
        {
          date: new Date('2024-03-02'),
          type: 'note_added',
          description: 'Custom repayment plan configured with flexible withdrawal options',
          performedBy: adminUser._id,
          metadata: {
            customConfiguration: true,
            withdrawalOption: 'flexible'
          }
        },
        {
          date: new Date('2024-03-05'),
          type: 'document_uploaded',
          description: 'Legal agreement and compliance documents uploaded',
          performedBy: financeUser._id,
          metadata: {
            category: 'legal',
            documentCount: 6
          }
        },
        {
          date: new Date('2024-03-10'),
          type: 'status_changed',
          description: 'Investment status confirmed as active after due diligence',
          performedBy: adminUser._id,
          metadata: {
            oldStatus: 'pending',
            newStatus: 'active',
            dueDiligenceCompleted: true
          }
        }
      ],
      riskAssessment: {
        score: 7,
        factors: ['Business Owner', 'High Investment Amount', 'Custom Plan', 'Platinum Tier'],
        lastUpdated: new Date('2024-03-01')
      }
    });
    
    investment3.plan = plans[2];
    investment3.schedule = investment3.generateSchedule();
    await investment3.save();
    investments.push(investment3);

    // Investment 4: Sunita - Secure Bronze Plan (Conservative)
    const investment4 = new Investment({
      investor: investors[3]._id,
      plan: plans[3]._id,
      selectedRepaymentPlan: {
        planType: 'existing',
        existingPlanId: plans[3].repaymentPlans[0]._id
      },
      principalAmount: 350000,
      investmentDate: new Date('2024-04-01'),
      maturityDate: new Date('2025-04-01'),
      interestRate: plans[3].interestRate,
      interestType: plans[3].interestType,
      tenure: plans[3].tenure,
      totalExpectedReturns: 434000,
      totalInterestExpected: 84000,
      remainingAmount: 434000,
      notes: 'First-time investor - Conservative approach with guaranteed returns',
      createdBy: financeUser._id,
      timeline: [
        {
          date: new Date('2024-04-01'),
          type: 'investment_created',
          description: 'Secure Bronze Plan investment created for ₹3,50,000',
          amount: 350000,
          performedBy: financeUser._id,
          metadata: {
            planId: plans[3]._id,
            investorId: investors[3]._id,
            firstTimeInvestor: true
          }
        },
        {
          date: new Date('2024-04-03'),
          type: 'communication',
          description: 'Investment education session conducted for first-time investor',
          performedBy: financeUser._id,
          metadata: {
            sessionType: 'education',
            duration: '60 minutes',
            topics: ['risk management', 'return expectations', 'payment schedule']
          }
        },
        {
          date: new Date('2024-04-05'),
          type: 'document_uploaded',
          description: 'Complete KYC documentation submitted and verified',
          performedBy: financeUser._id,
          metadata: {
            category: 'kyc',
            verificationStatus: 'completed'
          }
        }
      ],
      riskAssessment: {
        score: 3,
        factors: ['First Time Investor', 'Conservative Plan', 'IT Professional', 'Stable Income'],
        lastUpdated: new Date('2024-04-01')
      }
    });
    
    investment4.plan = plans[3];
    investment4.schedule = investment4.generateSchedule();
    await investment4.save();
    investments.push(investment4);

    // Investment 5: Vikram - Dynamic Growth Plan
    const investment5 = new Investment({
      investor: investors[4]._id,
      plan: plans[4]._id,
      selectedRepaymentPlan: {
        planType: 'new',
        customPlan: {
          paymentType: 'interestWithPrincipal',
          interestWithPrincipalPayment: {
            interestRate: 2.8,
            interestType: 'reducing',
            dateOfInvestment: new Date('2024-05-01'),
            investedAmount: 1200000,
            principalRepaymentPercentage: 35,
            paymentFrequency: 'quarterly',
            interestPayoutDate: new Date('2024-08-01'),
            principalPayoutDate: new Date('2024-08-01')
          }
        }
      },
      principalAmount: 1200000,
      investmentDate: new Date('2024-05-01'),
      maturityDate: new Date('2025-08-01'),
      interestRate: plans[4].interestRate,
      interestType: plans[4].interestType,
      tenure: plans[4].tenure,
      totalExpectedReturns: 1704000,
      totalInterestExpected: 504000,
      remainingAmount: 1704000,
      notes: 'Senior professional - Dynamic growth strategy with market-linked performance',
      createdBy: adminUser._id,
      timeline: [
        {
          date: new Date('2024-05-01'),
          type: 'investment_created',
          description: 'Dynamic Growth Plan investment created for ₹12,00,000',
          amount: 1200000,
          performedBy: adminUser._id,
          metadata: {
            planId: plans[4]._id,
            investorId: investors[4]._id,
            dynamicStrategy: true
          }
        },
        {
          date: new Date('2024-05-02'),
          type: 'note_added',
          description: 'Custom quarterly payment plan with principal component configured',
          performedBy: adminUser._id,
          metadata: {
            customPlan: true,
            paymentFrequency: 'quarterly',
            principalComponent: true
          }
        },
        {
          date: new Date('2024-05-03'),
          type: 'document_uploaded',
          description: 'Investment strategy document and risk disclosure uploaded',
          performedBy: financeUser._id,
          metadata: {
            category: 'agreement',
            riskDisclosure: true
          }
        },
        {
          date: new Date('2024-05-10'),
          type: 'communication',
          description: 'Portfolio review meeting scheduled for monthly performance tracking',
          performedBy: adminUser._id,
          metadata: {
            meetingType: 'portfolio_review',
            frequency: 'monthly',
            nextMeeting: '2024-06-10'
          }
        }
      ],
      riskAssessment: {
        score: 5,
        factors: ['Senior Professional', 'Dynamic Strategy', 'Market Linked', 'Custom Plan'],
        lastUpdated: new Date('2024-05-01')
      }
    });
    
    investment5.plan = plans[4];
    investment5.schedule = investment5.generateSchedule();
    await investment5.save();
    investments.push(investment5);

    console.log(`✅ Created ${investments.length} sophisticated investments`);

    // Create Comprehensive Payment Records
    console.log('💳 Creating comprehensive payment history...');
    const payments = [];

    // Payment 1: Rajesh - Premium Gold Plan - Month 1
    const payment1 = new Payment({
      investment: investment1._id,
      investor: investors[0]._id,
      scheduleMonth: 1,
      amount: 45000,
      paymentDate: new Date('2024-02-15'),
      paymentMethod: 'bank_transfer',
      referenceNumber: 'HDFC240215001',
      status: 'completed',
      type: 'interest',
      interestAmount: 45000,
      principalAmount: 0,
      penaltyAmount: 0,
      bonusAmount: 0,
      notes: 'Premium plan first month interest payment - VIP processing',
      processedBy: financeUser._id,
      verifiedBy: adminUser._id,
      verifiedAt: new Date('2024-02-15')
    });
    await payment1.save();
    payments.push(payment1);

    // Update investment schedule and add timeline
    investment1.schedule[0].paidAmount = 45000;
    investment1.schedule[0].status = 'paid';
    investment1.schedule[0].paidDate = payment1.paymentDate;
    investment1.timeline.push({
      date: new Date('2024-02-15'),
      type: 'payment_received',
      description: 'First month interest payment received - ₹45,000',
      amount: 45000,
      performedBy: financeUser._id,
      metadata: {
        paymentId: payment1._id,
        month: 1,
        onTime: true
      }
    });
    investment1.updatePaymentStatus();
    await investment1.save();

    // Payment 2: Rajesh - Premium Gold Plan - Month 2
    const payment2 = new Payment({
      investment: investment1._id,
      investor: investors[0]._id,
      scheduleMonth: 2,
      amount: 45000,
      paymentDate: new Date('2024-03-14'),
      paymentMethod: 'upi',
      referenceNumber: 'UPI240314002',
      status: 'completed',
      type: 'interest',
      interestAmount: 45000,
      principalAmount: 0,
      penaltyAmount: 0,
      bonusAmount: 0,
      notes: 'Second month interest payment via UPI',
      processedBy: financeUser._id,
      verifiedBy: financeUser._id,
      verifiedAt: new Date('2024-03-14')
    });
    await payment2.save();
    payments.push(payment2);

    // Update investment schedule and timeline
    investment1.schedule[1].paidAmount = 45000;
    investment1.schedule[1].status = 'paid';
    investment1.schedule[1].paidDate = payment2.paymentDate;
    investment1.timeline.push({
      date: new Date('2024-03-14'),
      type: 'payment_received',
      description: 'Second month interest payment received - ₹45,000',
      amount: 45000,
      performedBy: financeUser._id,
      metadata: {
        paymentId: payment2._id,
        month: 2,
        paymentMethod: 'upi'
      }
    });
    investment1.updatePaymentStatus();
    await investment1.save();

    // Payment 3: Priya - Smart Silver Plan - Quarterly Payment
    const payment3 = new Payment({
      investment: investment2._id,
      investor: investors[1]._id,
      scheduleMonth: 1,
      amount: 56250,
      paymentDate: new Date('2024-05-01'),
      paymentMethod: 'cheque',
      referenceNumber: 'CHQ240501003',
      status: 'completed',
      type: 'mixed',
      interestAmount: 18750,
      principalAmount: 37500,
      penaltyAmount: 0,
      bonusAmount: 0,
      notes: 'Quarterly payment with interest and principal component',
      processedBy: financeUser._id,
      verifiedBy: adminUser._id,
      verifiedAt: new Date('2024-05-01')
    });
    await payment3.save();
    payments.push(payment3);

    // Update investment schedule and timeline
    investment2.schedule[0].paidAmount = 56250;
    investment2.schedule[0].status = 'paid';
    investment2.schedule[0].paidDate = payment3.paymentDate;
    investment2.timeline.push({
      date: new Date('2024-05-01'),
      type: 'payment_received',
      description: 'Quarterly payment received - ₹56,250 (Interest: ₹18,750, Principal: ₹37,500)',
      amount: 56250,
      performedBy: financeUser._id,
      metadata: {
        paymentId: payment3._id,
        quarter: 1,
        breakdown: {
          interest: 18750,
          principal: 37500
        }
      }
    });
    investment2.updatePaymentStatus();
    await investment2.save();

    // Payment 4: Amit - Platinum Elite Plan - Month 1
    const payment4 = new Payment({
      investment: investment3._id,
      investor: investors[2]._id,
      scheduleMonth: 1,
      amount: 87500,
      paymentDate: new Date('2024-04-01'),
      paymentMethod: 'bank_transfer',
      referenceNumber: 'SBIN240401004',
      status: 'completed',
      type: 'interest',
      interestAmount: 87500,
      principalAmount: 0,
      penaltyAmount: 0,
      bonusAmount: 0,
      notes: 'Platinum elite plan first month payment - Ultra-premium service',
      processedBy: adminUser._id,
      verifiedBy: adminUser._id,
      verifiedAt: new Date('2024-04-01')
    });
    await payment4.save();
    payments.push(payment4);

    // Update investment schedule and timeline
    investment3.schedule[0].paidAmount = 87500;
    investment3.schedule[0].status = 'paid';
    investment3.schedule[0].paidDate = payment4.paymentDate;
    investment3.timeline.push({
      date: new Date('2024-04-01'),
      type: 'payment_received',
      description: 'Platinum Elite Plan first month payment - ₹87,500',
      amount: 87500,
      performedBy: adminUser._id,
      metadata: {
        paymentId: payment4._id,
        month: 1,
        eliteService: true
      }
    });
    investment3.updatePaymentStatus();
    await investment3.save();

    // Payment 5: Sunita - Secure Bronze Plan - Month 1
    const payment5 = new Payment({
      investment: investment4._id,
      investor: investors[3]._id,
      scheduleMonth: 1,
      amount: 7000,
      paymentDate: new Date('2024-05-01'),
      paymentMethod: 'upi',
      referenceNumber: 'UPI240501005',
      status: 'completed',
      type: 'interest',
      interestAmount: 7000,
      principalAmount: 0,
      penaltyAmount: 0,
      bonusAmount: 0,
      notes: 'First payment for new investor - Bronze plan',
      processedBy: financeUser._id,
      verifiedBy: financeUser._id,
      verifiedAt: new Date('2024-05-01')
    });
    await payment5.save();
    payments.push(payment5);

    // Update investment schedule and timeline
    investment4.schedule[0].paidAmount = 7000;
    investment4.schedule[0].status = 'paid';
    investment4.schedule[0].paidDate = payment5.paymentDate;
    investment4.timeline.push({
      date: new Date('2024-05-01'),
      type: 'payment_received',
      description: 'First month interest payment received - ₹7,000',
      amount: 7000,
      performedBy: financeUser._id,
      metadata: {
        paymentId: payment5._id,
        month: 1,
        firstPayment: true
      }
    });
    investment4.updatePaymentStatus();
    await investment4.save();

    console.log(`✅ Created ${payments.length} comprehensive payment records`);

    // Update Investor Statistics
    console.log('📊 Updating investor statistics...');
    for (let i = 0; i < investors.length; i++) {
      const investor = investors[i];
      const investorInvestments = investments.filter(inv => inv.investor.toString() === investor._id.toString());
      const investorPayments = payments.filter(pay => pay.investor.toString() === investor._id.toString());
      
      investor.totalInvestment = investorInvestments.reduce((sum, inv) => sum + inv.principalAmount, 0);
      investor.activeInvestments = investorInvestments.filter(inv => inv.status === 'active').length;
      investor.totalReturns = investorPayments.reduce((sum, pay) => sum + pay.amount, 0);
      
      await investor.save();
    }

    // Update Plan Statistics
    console.log('📈 Updating plan statistics...');
    for (let i = 0; i < plans.length; i++) {
      const plan = plans[i];
      const planInvestments = investments.filter(inv => inv.plan.toString() === plan._id.toString());
      
      plan.totalInvestors = planInvestments.length;
      plan.totalInvestment = planInvestments.reduce((sum, inv) => sum + inv.principalAmount, 0);
      
      await plan.save();
    }

    // Generate Summary Report
    const totalInvestmentValue = investments.reduce((sum, inv) => sum + inv.principalAmount, 0);
    const totalPaymentsValue = payments.reduce((sum, pay) => sum + pay.amount, 0);
    const totalExpectedReturns = investments.reduce((sum, inv) => sum + inv.totalExpectedReturns, 0);

    console.log('\n✅ SEEDING COMPLETED SUCCESSFULLY!');
    console.log('\n📋 COMPREHENSIVE DATA SUMMARY:');
    console.log('═══════════════════════════════════════════');
    console.log(`👥 Users Created: ${users.length}`);
    console.log(`👤 Investors Created: ${investors.length}`);
    console.log(`📋 Investment Plans: ${plans.length} (with repayment options)`);
    console.log(`💰 Investments Created: ${investments.length}`);
    console.log(`💳 Payments Recorded: ${payments.length}`);
    console.log(`⚙️  System Settings: Configured`);
    
    console.log('\n💼 FINANCIAL SUMMARY:');
    console.log('═══════════════════════════════════════════');
    console.log(`💵 Total Investment Value: ₹${(totalInvestmentValue / 100000).toFixed(1)} Lakhs`);
    console.log(`📈 Total Expected Returns: ₹${(totalExpectedReturns / 100000).toFixed(1)} Lakhs`);
    console.log(`💰 Total Payments Made: ₹${(totalPaymentsValue / 100000).toFixed(1)} Lakhs`);
    console.log(`📊 Average Investment: ₹${(totalInvestmentValue / investments.length / 100000).toFixed(1)} Lakhs`);
    
    console.log('\n🔐 LOGIN CREDENTIALS:');
    console.log('═══════════════════════════════════════════');
    console.log('📧 Email: admin@financetracker.com');
    console.log('🔑 Password: password123');
    console.log('👤 Role: System Administrator');
    console.log('');
    console.log('📧 Email: finance@financetracker.com');
    console.log('🔑 Password: password123'); 
    console.log('👤 Role: Finance Manager');
    console.log('');
    console.log('📧 Email: raj@example.com');
    console.log('🔑 Password: password123');
    console.log('👤 Role: Investor (Rajesh Kumar Patel)');
    
    console.log('\n📊 FEATURE HIGHLIGHTS:');
    console.log('═══════════════════════════════════════════');
    console.log('✅ Multiple Repayment Plan Options per Plan');
    console.log('✅ Custom Repayment Plan Configurations');
    console.log('✅ Comprehensive Investment Timeline');
    console.log('✅ Document Management with Categories');
    console.log('✅ Risk Assessment Scoring');
    console.log('✅ Payment History with Verification');
    console.log('✅ Real-time Schedule Updates');
    console.log('✅ Professional Investor Profiles');
    console.log('✅ Enhanced System Settings');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('═══════════════════════════════════════════');
    console.log('1. 🚀 Start the backend: cd backend && npm run dev');
    console.log('2. 🌐 Start the frontend: npm run dev');
    console.log('3. 📱 Login with any of the above credentials');
    console.log('4. 🔍 Explore the new features and enhanced UI');
    console.log('5. 📋 Test investment creation with repayment plans');
    console.log('6. 📎 Upload documents and track timeline');
    
    console.log('\n✨ Database successfully seeded with comprehensive test data!');

    // Final Password Verification
    console.log('\n🔍 FINAL AUTHENTICATION VERIFICATION:');
    console.log('═══════════════════════════════════════════');
    const testUsers = await User.find({});
    for (const user of testUsers) {
      const isValid = await user.comparePassword('password123');
      console.log(`✅ ${user.email}: ${isValid ? 'Authentication Ready' : 'Authentication Failed'}`);
    }

  } catch (error) {
    console.error('❌ SEEDING FAILED:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Execute the seeding
seedData();