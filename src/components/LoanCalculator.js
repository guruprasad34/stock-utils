import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

const LoanCalculator = () => {
  const [loanAmount, setLoanAmount] = useState('2000000');
  const [annualInterestRate, setAnnualInterestRate] = useState('8.5');
  const [loanPeriodYears, setLoanPeriodYears] = useState('15');
  const [paymentsPerYear, setPaymentsPerYear] = useState('12');
  const [startDate, setStartDate] = useState('2026-02-03');
  const [extraPaymentInterval, setExtraPaymentInterval] = useState('1');
  const [extraPayment, setExtraPayment] = useState('100000');
  
  const [summary, setSummary] = useState({
    scheduledPayment: 0,
    scheduledNumberOfPayments: 0,
    actualNumberOfPayments: 0,
    totalEarlyPayments: 0,
    totalInterest: 0,
  });
  
  const [paymentSchedule, setPaymentSchedule] = useState([]);

  const calculateLoan = () => {
    const principal = parseFloat(loanAmount) || 0;
    const annualRate = parseFloat(annualInterestRate) / 100 || 0;
    const years = parseFloat(loanPeriodYears) || 0;
    const paymentsYearly = parseInt(paymentsPerYear) || 12;
    const extraPmt = parseFloat(extraPayment) || 0;
    const extraInterval = parseInt(extraPaymentInterval) || 1;

    if (principal <= 0 || annualRate <= 0 || years <= 0) {
      return;
    }

    // Calculate monthly interest rate and total number of payments
    const periodicRate = annualRate / paymentsYearly;
    const totalPayments = years * paymentsYearly;

    // Calculate EMI using formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    const emi = (principal * periodicRate * Math.pow(1 + periodicRate, totalPayments)) / 
                (Math.pow(1 + periodicRate, totalPayments) - 1);

    // Generate payment schedule
    let balance = principal;
    let cumulativeInterest = 0;
    const schedule = [];
    let paymentNumber = 1;
    const start = new Date(startDate);

    while (balance > 0.01 && paymentNumber <= totalPayments) {
      const interestPayment = balance * periodicRate;
      
      // Determine if extra payment applies this month
      const hasExtraPayment = extraInterval > 0 && (paymentNumber % extraInterval === 0);
      const extraPmtAmount = hasExtraPayment ? extraPmt : 0;
      
      const totalPayment = Math.min(emi + extraPmtAmount, balance + interestPayment);
      const principalPayment = totalPayment - interestPayment;
      
      balance = Math.max(0, balance - principalPayment);
      cumulativeInterest += interestPayment;

      // Calculate payment date
      const paymentDate = new Date(start);
      paymentDate.setMonth(start.getMonth() + paymentNumber - 1);
      
      schedule.push({
        paymentNumber,
        paymentDate: paymentDate.toLocaleDateString('en-GB'),
        beginningBalance: balance + principalPayment,
        scheduledPayment: emi,
        extraPayment: extraPmtAmount,
        totalPayment: totalPayment,
        principal: principalPayment,
        interest: interestPayment,
        endingBalance: balance,
        cumulativeInterest: cumulativeInterest,
      });

      paymentNumber++;
    }

    // Calculate summary
    const totalEarlyPayments = schedule.reduce((sum, row) => sum + row.totalPayment, 0);
    
    setSummary({
      scheduledPayment: emi.toFixed(2),
      scheduledNumberOfPayments: totalPayments,
      actualNumberOfPayments: schedule.length,
      totalEarlyPayments: totalEarlyPayments.toFixed(2),
      totalInterest: cumulativeInterest.toFixed(2),
    });

    setPaymentSchedule(schedule);
  };

  useEffect(() => {
    calculateLoan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (value) => {
    return parseFloat(value).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1400,
        backgroundColor: 'white',
        padding: { xs: 2, sm: 3, md: 4 },
        borderRadius: 3,
        boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
        margin: '0 auto',
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 100px)',
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          color: '#2c3e50',
          fontWeight: 'bold',
          textAlign: 'center',
          mb: { xs: 2, sm: 3, md: 4 },
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
        }}
      >
        Loan EMI Calculator
      </Typography>

      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* Left Side - Enter Values */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2, color: '#34495e', fontWeight: 'bold', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Enter Values
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Loan Amount"
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Annual Interest Rate (%)"
                  type="number"
                  value={annualInterestRate}
                  onChange={(e) => setAnnualInterestRate(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Loan Period (Years)"
                  type="number"
                  value={loanPeriodYears}
                  onChange={(e) => setLoanPeriodYears(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Number of Payments per Year"
                  type="number"
                  value={paymentsPerYear}
                  onChange={(e) => setPaymentsPerYear(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Start Date of Loan"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Extra Payment Interval (in months)"
                  type="number"
                  value={extraPaymentInterval}
                  onChange={(e) => setExtraPaymentInterval(e.target.value)}
                  fullWidth
                  helperText="0 = no extra payments"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Optional Extra Payments"
                  type="number"
                  value={extraPayment}
                  onChange={(e) => setExtraPayment(e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Right Side - Loan Summary */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2, color: '#34495e', fontWeight: 'bold', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Loan Summary
            </Typography>
            <Box
              sx={{
                backgroundColor: '#ecf0f1',
                padding: { xs: 2, sm: 3 },
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                overflowX: 'auto',
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                    <Typography variant="body1" sx={{ color: '#34495e', fontSize: { xs: '0.875rem', sm: '1rem' }, whiteSpace: 'nowrap' }}>
                      Scheduled Payment
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', sm: '1rem' }, whiteSpace: 'nowrap' }}>
                      ₹{formatCurrency(summary.scheduledPayment)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                    <Typography variant="body1" sx={{ color: '#34495e', fontSize: { xs: '0.875rem', sm: '1rem' }, whiteSpace: 'nowrap' }}>
                      Scheduled Number of Payments
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', sm: '1rem' }, whiteSpace: 'nowrap' }}>
                      {summary.scheduledNumberOfPayments}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                    <Typography variant="body1" sx={{ color: '#34495e', fontSize: { xs: '0.875rem', sm: '1rem' }, whiteSpace: 'nowrap' }}>
                      Actual Number of Payments
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', sm: '1rem' }, whiteSpace: 'nowrap' }}>
                      {summary.actualNumberOfPayments}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                    <Typography variant="body1" sx={{ color: '#34495e', fontSize: { xs: '0.875rem', sm: '1rem' }, whiteSpace: 'nowrap' }}>
                      Total Early Payments
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', sm: '1rem' }, whiteSpace: 'nowrap' }}>
                      ₹{formatCurrency(summary.totalEarlyPayments)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                    <Typography variant="body1" sx={{ color: '#34495e', fontSize: { xs: '0.875rem', sm: '1rem' }, whiteSpace: 'nowrap' }}>
                      Total Interest
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', sm: '1rem' }, whiteSpace: 'nowrap' }}>
                      ₹{formatCurrency(summary.totalInterest)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Calculate Button */}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={calculateLoan}
              fullWidth
              sx={{
                backgroundColor: '#3498db',
                '&:hover': { backgroundColor: '#2980b9' },
                padding: '12px',
                fontSize: '16px',
              }}
            >
              Calculate
            </Button>
          </Grid>

          {/* Payment Schedule Table */}
          {paymentSchedule.length > 0 && (
            <Grid item xs={12}>
              <Typography
                variant="h6"
                sx={{ mt: { xs: 2, sm: 3 }, mb: 2, color: '#34495e', fontWeight: 'bold', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
              >
                Payment Schedule
              </Typography>
              <TableContainer 
                component={Paper} 
                sx={{ 
                  maxHeight: { xs: 400, sm: 500, md: 600 },
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#34495e', color: 'white', fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>
                        Payment Number
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#34495e', color: 'white', fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>
                        Payment Date
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#34495e', color: 'white', fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }} align="right">
                        Beginning Balance
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#34495e', color: 'white', fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }} align="right">
                        Scheduled Payment
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#34495e', color: 'white', fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }} align="right">
                        Extra Payment
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#34495e', color: 'white', fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }} align="right">
                        Total Payment
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#34495e', color: 'white', fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }} align="right">
                        Principal
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#34495e', color: 'white', fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }} align="right">
                        Interest
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#34495e', color: 'white', fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }} align="right">
                        Ending Balance
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#34495e', color: 'white', fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }} align="right">
                        Cumulative Interest
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paymentSchedule.map((row) => (
                      <TableRow
                        key={row.paymentNumber}
                        sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}
                      >
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{row.paymentNumber}</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>{row.paymentDate}</TableCell>
                        <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>₹{formatCurrency(row.beginningBalance)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>₹{formatCurrency(row.scheduledPayment)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>₹{formatCurrency(row.extraPayment)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>₹{formatCurrency(row.totalPayment)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>₹{formatCurrency(row.principal)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>₹{formatCurrency(row.interest)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>₹{formatCurrency(row.endingBalance)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>₹{formatCurrency(row.cumulativeInterest)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}
        </Grid>
      </Box>
  );
};

export default LoanCalculator;