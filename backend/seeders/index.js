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
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
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
    
    // Hash password properly - don't use pre-hashed password
    const plainPassword = 'password123';
    console.log('🔐 Hashing password for all users...');
    
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@financetracker.com',
        password: plainPassword, // Let the User model hash this
        role: 'admin',
        phone: '+91-9876543210',
        isActive: true
      },
      {
        name: 'Finance Manager',
        email: 'finance@financetracker.com',
        password: plainPassword, // Let the User model hash this
        role: 'finance_manager',
        phone: '+91-9876543211',
        isActive: true
      },
      {
        name: 'John Investor',
        email: 'john@example.com',
        password: plainPassword, // Let the User model hash this
        role: 'investor',
        phone: '+91-9876543212',
        isActive: true
      },
      {
        name: 'Sarah Investor',
        email: 'sarah@example.com',
        password: plainPassword, // Let the User model hash this
        role: 'investor',
        phone: '+91-9876543213',
        isActive: true
      }
    ]);

    const [adminUser, financeUser, johnUser, sarahUser] = users;
    console.log('✅ Users created with passwords properly hashed');

    // Verify password hashing worked
    console.log('🔍 Verifying password hashing...');
    for (const user of users) {
      const isValid = await user.comparePassword(plainPassword);
      console.log(`   ${user.email}: Password hash ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    }

    // Create Settings
    console.log('⚙️  Creating settings...');
    await Settings.create({
      company: {
        name: 'FinanceTracker Pro',
        email: 'admin@financetracker.com',
        phone: '+1-234-567-8900',
        address: {
          street: '123 Business Street',
          city: 'Finance City',
          state: 'FC',
          pincode: '123456',
          country: 'India'
        },
        website: 'https://financetracker.com',
        taxId: 'GST123456789',
        registrationNumber: 'CIN123456789'
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
        smsEnabled: false,
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

    // Create Plans one by one to ensure proper ID generation
    console.log('📋 Creating investment plans...');
    const plans = [];
    
    // Plan 1: Gold Plan
    const goldPlan = new Plan({
      name: 'Gold Plan - Monthly Interest',
      description: 'High return monthly interest plan with flexible principal repayment',
      interestType: 'flat',
      interestRate: 2.5,
      minInvestment: 50000,
      maxInvestment: 1000000,
      tenure: 12,
      interestPayoutFrequency: 'monthly',
      principalRepayment: {
        percentage: 100,
        startFromMonth: 12
      },
      isActive: true,
      features: ['Monthly Interest Payout', 'Principal at Maturity', 'High Returns'],
      riskLevel: 'medium',
      createdBy: adminUser._id
    });
    await goldPlan.save();
    plans.push(goldPlan);

    // Plan 2: Silver Plan
    const silverPlan = new Plan({
      name: 'Silver Plan - Quarterly Interest',
      description: 'Stable quarterly interest with gradual principal repayment',
      interestType: 'reducing',
      interestRate: 2.0,
      minInvestment: 25000,
      maxInvestment: 500000,
      tenure: 18,
      interestPayoutFrequency: 'quarterly',
      principalRepayment: {
        percentage: 50,
        startFromMonth: 6
      },
      isActive: true,
      features: ['Quarterly Interest', 'Gradual Principal Return', 'Stable Returns'],
      riskLevel: 'low',
      createdBy: adminUser._id
    });
    await silverPlan.save();
    plans.push(silverPlan);

    // Plan 3: Platinum Plan
    const platinumPlan = new Plan({
      name: 'Platinum Plan - High Yield',
      description: 'Premium plan with highest returns and monthly payouts',
      interestType: 'flat',
      interestRate: 3.0,
      minInvestment: 100000,
      maxInvestment: 2000000,
      tenure: 24,
      interestPayoutFrequency: 'monthly',
      principalRepayment: {
        percentage: 25,
        startFromMonth: 18
      },
      isActive: true,
      features: ['Highest Returns', 'Monthly Payouts', 'Premium Service'],
      riskLevel: 'high',
      createdBy: adminUser._id
    });
    await platinumPlan.save();
    plans.push(platinumPlan);

    // Plan 4: Bronze Plan
    const bronzePlan = new Plan({
      name: 'Bronze Plan - Safe Investment',
      description: 'Conservative plan for risk-averse investors',
      interestType: 'reducing',
      interestRate: 1.5,
      minInvestment: 10000,
      maxInvestment: 200000,
      tenure: 12,
      interestPayoutFrequency: 'monthly',
      principalRepayment: {
        percentage: 100,
        startFromMonth: 10
      },
      isActive: true,
      features: ['Low Risk', 'Guaranteed Returns', 'Short Term'],
      riskLevel: 'low',
      createdBy: adminUser._id
    });
    await bronzePlan.save();
    plans.push(bronzePlan);

    // Create Investors one by one
    console.log('👤 Creating investors...');
    const investors = [];

    // Investor 1: Rajesh Kumar
    const rajeshInvestor = new Investor({
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@email.com',
      phone: '9876543210',
      address: {
        street: '123 MG Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India'
      },
      kyc: {
        panNumber: 'ABCDE1234F',
        aadharNumber: '123456789012',
        bankDetails: {
          accountNumber: '1234567890',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank',
          branchName: 'Mumbai Main Branch'
        }
      },
      status: 'active',
      userId: johnUser._id,
      createdBy: adminUser._id
    });
    await rajeshInvestor.save();
    investors.push(rajeshInvestor);

    // Investor 2: Priya Sharma
    const priyaInvestor = new Investor({
      name: 'Priya Sharma',
      email: 'priya.sharma@email.com',
      phone: '9876543211',
      address: {
        street: '456 Park Street',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        country: 'India'
      },
      kyc: {
        panNumber: 'FGHIJ5678K',
        aadharNumber: '234567890123',
        bankDetails: {
          accountNumber: '2345678901',
          ifscCode: 'ICIC0002345',
          bankName: 'ICICI Bank',
          branchName: 'Delhi CP Branch'
        }
      },
      status: 'active',
      userId: sarahUser._id,
      createdBy: adminUser._id
    });
    await priyaInvestor.save();
    investors.push(priyaInvestor);

    // Investor 3: Amit Patel
    const amitInvestor = new Investor({
      name: 'Amit Patel',
      email: 'amit.patel@email.com',
      phone: '9876543212',
      address: {
        street: '789 SG Highway',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380001',
        country: 'India'
      },
      kyc: {
        panNumber: 'LMNOP9012Q',
        aadharNumber: '345678901234',
        bankDetails: {
          accountNumber: '3456789012',
          ifscCode: 'SBIN0003456',
          bankName: 'State Bank of India',
          branchName: 'Ahmedabad Main Branch'
        }
      },
      status: 'active',
      createdBy: financeUser._id
    });
    await amitInvestor.save();
    investors.push(amitInvestor);

    // Investor 4: Sunita Reddy
    const sunitaInvestor = new Investor({
      name: 'Sunita Reddy',
      email: 'sunita.reddy@email.com',
      phone: '9876543213',
      address: {
        street: '321 Banjara Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500001',
        country: 'India'
      },
      kyc: {
        panNumber: 'RSTUV3456W',
        aadharNumber: '456789012345',
        bankDetails: {
          accountNumber: '4567890123',
          ifscCode: 'AXIS0004567',
          bankName: 'Axis Bank',
          branchName: 'Hyderabad Banjara Hills'
        }
      },
      status: 'active',
      createdBy: financeUser._id
    });
    await sunitaInvestor.save();
    investors.push(sunitaInvestor);

    // Investor 5: Vikram Singh
    const vikramInvestor = new Investor({
      name: 'Vikram Singh',
      email: 'vikram.singh@email.com',
      phone: '9876543214',
      address: {
        street: '654 Civil Lines',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302001',
        country: 'India'
      },
      kyc: {
        panNumber: 'XYZAB7890C',
        aadharNumber: '567890123456',
        bankDetails: {
          accountNumber: '5678901234',
          ifscCode: 'PUNB0005678',
          bankName: 'Punjab National Bank',
          branchName: 'Jaipur Civil Lines'
        }
      },
      status: 'active',
      createdBy: adminUser._id
    });
    await vikramInvestor.save();
    investors.push(vikramInvestor);

    // Create Investments one by one
    console.log('💰 Creating investments...');
    const investments = [];
    
    // Investment 1: Rajesh Kumar - Gold Plan
    const investment1 = new Investment({
      investor: investors[0]._id,
      plan: plans[0]._id,
      principalAmount: 100000,
      investmentDate: new Date('2024-01-15'),
      maturityDate: new Date('2025-01-15'),
      interestRate: plans[0].interestRate,
      interestType: plans[0].interestType,
      tenure: plans[0].tenure,
      totalExpectedReturns: 130000,
      totalInterestExpected: 30000,
      remainingAmount: 130000,
      notes: 'First investment in Gold Plan',
      createdBy: adminUser._id
    });
    // Manually set plan data for schedule generation
    investment1.plan = plans[0];
    investment1.schedule = investment1.generateSchedule();
    await investment1.save();
    investments.push(investment1);

    // Investment 2: Priya Sharma - Silver Plan
    const investment2 = new Investment({
      investor: investors[1]._id,
      plan: plans[1]._id,
      principalAmount: 75000,
      investmentDate: new Date('2024-02-01'),
      maturityDate: new Date('2025-08-01'),
      interestRate: plans[1].interestRate,
      interestType: plans[1].interestType,
      tenure: plans[1].tenure,
      totalExpectedReturns: 102000,
      totalInterestExpected: 27000,
      remainingAmount: 102000,
      notes: 'Conservative investment choice',
      createdBy: financeUser._id
    });
    // Manually set plan data for schedule generation
    investment2.plan = plans[1];
    investment2.schedule = investment2.generateSchedule();
    await investment2.save();
    investments.push(investment2);

    // Investment 3: Amit Patel - Platinum Plan
    const investment3 = new Investment({
      investor: investors[2]._id,
      plan: plans[2]._id,
      principalAmount: 200000,
      investmentDate: new Date('2024-03-01'),
      maturityDate: new Date('2026-03-01'),
      interestRate: plans[2].interestRate,
      interestType: plans[2].interestType,
      tenure: plans[2].tenure,
      totalExpectedReturns: 344000,
      totalInterestExpected: 144000,
      remainingAmount: 344000,
      notes: 'High yield investment for experienced investor',
      createdBy: adminUser._id
    });
    // Manually set plan data for schedule generation
    investment3.plan = plans[2];
    investment3.schedule = investment3.generateSchedule();
    await investment3.save();
    investments.push(investment3);

    // Investment 4: Sunita Reddy - Bronze Plan
    const investment4 = new Investment({
      investor: investors[3]._id,
      plan: plans[3]._id,
      principalAmount: 50000,
      investmentDate: new Date('2024-04-01'),
      maturityDate: new Date('2025-04-01'),
      interestRate: plans[3].interestRate,
      interestType: plans[3].interestType,
      tenure: plans[3].tenure,
      totalExpectedReturns: 59000,
      totalInterestExpected: 9000,
      remainingAmount: 59000,
      notes: 'Safe investment for first-time investor',
      createdBy: financeUser._id
    });
    // Manually set plan data for schedule generation
    investment4.plan = plans[3];
    investment4.schedule = investment4.generateSchedule();
    await investment4.save();
    investments.push(investment4);

    // Investment 5: Vikram Singh - Gold Plan
    const investment5 = new Investment({
      investor: investors[4]._id,
      plan: plans[0]._id,
      principalAmount: 150000,
      investmentDate: new Date('2024-05-01'),
      maturityDate: new Date('2025-05-01'),
      interestRate: plans[0].interestRate,
      interestType: plans[0].interestType,
      tenure: plans[0].tenure,
      totalExpectedReturns: 195000,
      totalInterestExpected: 45000,
      remainingAmount: 195000,
      notes: 'Second investment in portfolio',
      createdBy: adminUser._id
    });
    // Manually set plan data for schedule generation
    investment5.plan = plans[0];
    investment5.schedule = investment5.generateSchedule();
    await investment5.save();
    investments.push(investment5);

    // Create Sample Payments one by one
    console.log('💳 Creating sample payments...');
    const payments = [];

    // Payment for Investment 1 (Rajesh Kumar) - Month 1
    const payment1 = new Payment({
      investment: investment1._id,
      investor: investors[0]._id,
      scheduleMonth: 1,
      amount: 2500,
      paymentDate: new Date('2024-02-15'),
      paymentMethod: 'bank_transfer',
      referenceNumber: 'TXN001234567',
      status: 'completed',
      type: 'interest',
      interestAmount: 2500,
      principalAmount: 0,
      penaltyAmount: 0,
      bonusAmount: 0,
      notes: 'First month interest payment',
      processedBy: financeUser._id
    });
    await payment1.save();
    payments.push(payment1);

    // Update the investment schedule for payment 1
    investment1.schedule[0].paidAmount = 2500;
    investment1.schedule[0].status = 'paid';
    investment1.schedule[0].paidDate = payment1.paymentDate;
    investment1.updatePaymentStatus();
    await investment1.save();

    // Payment for Investment 1 (Rajesh Kumar) - Month 2
    const payment2 = new Payment({
      investment: investment1._id,
      investor: investors[0]._id,
      scheduleMonth: 2,
      amount: 2500,
      paymentDate: new Date('2024-03-15'),
      paymentMethod: 'upi',
      referenceNumber: 'UPI001234568',
      status: 'completed',
      type: 'interest',
      interestAmount: 2500,
      principalAmount: 0,
      penaltyAmount: 0,
      bonusAmount: 0,
      notes: 'Second month interest payment',
      processedBy: financeUser._id
    });
    await payment2.save();
    payments.push(payment2);

    // Update the investment schedule for payment 2
    investment1.schedule[1].paidAmount = 2500;
    investment1.schedule[1].status = 'paid';
    investment1.schedule[1].paidDate = payment2.paymentDate;
    investment1.updatePaymentStatus();
    await investment1.save();

    // Payment for Investment 2 (Priya Sharma)
    const payment3 = new Payment({
      investment: investment2._id,
      investor: investors[1]._id,
      scheduleMonth: 1,
      amount: 3750,
      paymentDate: new Date('2024-05-01'),
      paymentMethod: 'cheque',
      referenceNumber: 'CHQ001234569',
      status: 'completed',
      type: 'mixed',
      interestAmount: 1500,
      principalAmount: 2250,
      penaltyAmount: 0,
      bonusAmount: 0,
      notes: 'Quarterly payment with partial principal',
      processedBy: adminUser._id
    });
    await payment3.save();
    payments.push(payment3);

    // Update the investment schedule for payment 3
    investment2.schedule[0].paidAmount = 3750;
    investment2.schedule[0].status = 'paid';
    investment2.schedule[0].paidDate = payment3.paymentDate;
    investment2.updatePaymentStatus();
    await investment2.save();

    // Update investor totals
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

    // Update plan statistics
    console.log('📈 Updating plan statistics...');
    for (let i = 0; i < plans.length; i++) {
      const plan = plans[i];
      const planInvestments = investments.filter(inv => inv.plan.toString() === plan._id.toString());
      
      plan.totalInvestors = planInvestments.length;
      plan.totalInvestment = planInvestments.reduce((sum, inv) => sum + inv.principalAmount, 0);
      
      await plan.save();
    }

    console.log('✅ Seeding completed successfully!');
    console.log('\n📋 Created Data Summary:');
    console.log(`👥 Users: ${users.length}`);
    console.log(`👤 Investors: ${investors.length}`);
    console.log(`📋 Plans: ${plans.length}`);
    console.log(`💰 Investments: ${investments.length}`);
    console.log(`💳 Payments: ${payments.length}`);
    
    console.log('\n🔐 Login Credentials (Password: password123):');
    console.log('✅ Admin: admin@financetracker.com / password123');
    console.log('✅ Finance Manager: finance@financetracker.com / password123');
    console.log('✅ Investor (John): john@example.com / password123');
    console.log('✅ Investor (Sarah): sarah@example.com / password123');

    console.log('\n📊 Sample Data Created:');
    console.log('- Gold Plan with 2 investments');
    console.log('- Silver Plan with 1 investment');
    console.log('- Platinum Plan with 1 investment');
    console.log('- Bronze Plan with 1 investment');
    console.log('- 3 completed payments with proper schedule updates');

    // Final verification - test login for each user
    console.log('\n🔍 Final Password Verification:');
    const testUsers = await User.find({});
    for (const user of testUsers) {
      const isValid = await user.comparePassword('password123');
      console.log(`   ${user.email}: ${isValid ? '✅ LOGIN WILL WORK' : '❌ LOGIN WILL FAIL'}`);
    }

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedData();