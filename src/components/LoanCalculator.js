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
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  useTheme,
  Divider,
} from '@mui/material';

const LoanCalculator = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loanAmount, setLoanAmount] = useState('2000000');
  const [annualInterestRate, setAnnualInterestRate] = useState('8.5');
  const [loanPeriodYears, setLoanPeriodYears] = useState('15');
  const [paymentsPerYear, setPaymentsPerYear] = useState('12');
  const [startDate, setStartDate] = useState('2026-02-03');

  // Strategy for handling extra payments: 'reduceTenure' or 'reduceEMI'
  const [extraPaymentStrategy, setExtraPaymentStrategy] = useState('reduceTenure');

  // Map of paymentNumber -> extra payment amount (editable per row)
  const [extraPayments, setExtraPayments] = useState({});

  const [summary, setSummary] = useState({
    scheduledPayment: 0,
    scheduledNumberOfPayments: 0,
    actualNumberOfPayments: 0,
    totalEarlyPayments: 0,
    totalInterest: 0,
  });

  const [paymentSchedule, setPaymentSchedule] = useState([]);

  // Compute EMI for a given principal, periodic rate, and number of payments
  const computeEMI = (principal, periodicRate, numPayments) => {
    if (periodicRate === 0) return principal / numPayments;
    return (
      (principal * periodicRate * Math.pow(1 + periodicRate, numPayments)) /
      (Math.pow(1 + periodicRate, numPayments) - 1)
    );
  };

  // Core simulation engine. Runs the amortization for a given strategy and
  // returns the resulting schedule plus totals. Pure function — no state writes.
  const runSimulation = (principal, periodicRate, scheduledTotalPayments, baseEMI, extraPaymentsMap, strategy, start) => {
    let balance = principal;
    let cumulativeInterest = 0;
    const schedule = [];
    let paymentNumber = 1;

    let currentEMI = baseEMI;
    let remainingScheduled = scheduledTotalPayments;

    const maxIterations = scheduledTotalPayments + 1200;

    while (balance > 0.01 && paymentNumber <= maxIterations) {
      const interestPayment = balance * periodicRate;
      const extraPmtAmount = extraPaymentsMap[paymentNumber] || 0;

      let totalPayment = Math.min(currentEMI + extraPmtAmount, balance + interestPayment);
      let principalPayment = totalPayment - interestPayment;

      const beginningBalance = balance;
      balance = Math.max(0, balance - principalPayment);
      cumulativeInterest += interestPayment;

      const paymentDate = new Date(start);
      paymentDate.setMonth(start.getMonth() + paymentNumber - 1);

      schedule.push({
        paymentNumber,
        paymentDate: paymentDate.toLocaleDateString('en-GB'),
        beginningBalance,
        scheduledPayment: currentEMI,
        extraPayment: extraPmtAmount,
        totalPayment,
        principal: principalPayment,
        interest: interestPayment,
        endingBalance: balance,
        cumulativeInterest,
      });

      remainingScheduled = Math.max(remainingScheduled - 1, 0);

      if (extraPmtAmount > 0 && strategy === 'reduceEMI' && balance > 0.01 && remainingScheduled > 0) {
        currentEMI = computeEMI(balance, periodicRate, remainingScheduled);
      }

      paymentNumber++;
    }

    const totalPaid = schedule.reduce((sum, row) => sum + row.totalPayment, 0);

    return {
      schedule,
      totalInterest: cumulativeInterest,
      totalPaid,
      numPayments: schedule.length,
      finalEMI: currentEMI,
    };
  };

  const [comparison, setComparison] = useState(null);

  const calculateLoan = (extraPaymentsMap = extraPayments) => {
    const principal = parseFloat(loanAmount) || 0;
    const annualRate = parseFloat(annualInterestRate) / 100 || 0;
    const years = parseFloat(loanPeriodYears) || 0;
    const paymentsYearly = parseInt(paymentsPerYear) || 12;

    if (principal <= 0 || annualRate <= 0 || years <= 0) {
      return;
    }

    const periodicRate = annualRate / paymentsYearly;
    const scheduledTotalPayments = Math.round(years * paymentsYearly);
    const baseEMI = computeEMI(principal, periodicRate, scheduledTotalPayments);
    const start = new Date(startDate);

    // Run with the currently selected strategy (drives the main table)
    const selectedResult = runSimulation(
      principal, periodicRate, scheduledTotalPayments, baseEMI, extraPaymentsMap, extraPaymentStrategy, start
    );

    setSummary({
      scheduledPayment: baseEMI.toFixed(2),
      scheduledNumberOfPayments: scheduledTotalPayments,
      actualNumberOfPayments: selectedResult.numPayments,
      totalEarlyPayments: selectedResult.totalPaid.toFixed(2),
      totalInterest: selectedResult.totalInterest.toFixed(2),
    });

    setPaymentSchedule(selectedResult.schedule);

    // If any extra payments exist, also run both strategies for comparison
    const hasExtra = Object.values(extraPaymentsMap).some((v) => v > 0);

    if (hasExtra) {
      // Baseline with no extra payments at all (for savings comparison)
      const baselineResult = runSimulation(
        principal, periodicRate, scheduledTotalPayments, baseEMI, {}, 'reduceTenure', start
      );

      const reduceTenureResult = runSimulation(
        principal, periodicRate, scheduledTotalPayments, baseEMI, extraPaymentsMap, 'reduceTenure', start
      );

      const reduceEMIResult = runSimulation(
        principal, periodicRate, scheduledTotalPayments, baseEMI, extraPaymentsMap, 'reduceEMI', start
      );

      const tenureMonthsSaved = baselineResult.numPayments - reduceTenureResult.numPayments;
      const tenureInterestSaved = baselineResult.totalInterest - reduceTenureResult.totalInterest;

      const emiInterestSaved = baselineResult.totalInterest - reduceEMIResult.totalInterest;
      const newEMIAfterFirstExtra = reduceEMIResult.finalEMI;
      const emiReduction = baseEMI - newEMIAfterFirstExtra;

      setComparison({
        baseEMI,
        reduceTenure: {
          monthsSaved: tenureMonthsSaved,
          interestSaved: tenureInterestSaved,
          totalInterest: reduceTenureResult.totalInterest,
          numPayments: reduceTenureResult.numPayments,
        },
        reduceEMI: {
          interestSaved: emiInterestSaved,
          totalInterest: reduceEMIResult.totalInterest,
          numPayments: reduceEMIResult.numPayments,
          newEMI: newEMIAfterFirstExtra,
          emiReduction,
        },
      });
    } else {
      setComparison(null);
    }
  };

  useEffect(() => {
    calculateLoan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExtraPaymentChange = (paymentNumber, value) => {
    const numericValue = parseFloat(value);
    const updated = { ...extraPayments };

    if (!value || isNaN(numericValue) || numericValue <= 0) {
      delete updated[paymentNumber];
    } else {
      updated[paymentNumber] = numericValue;
    }

    setExtraPayments(updated);
    calculateLoan(updated);
  };

  const handleClearExtraPayments = () => {
    setExtraPayments({});
    calculateLoan({});
  };

  const handleStrategyChange = (event, newStrategy) => {
    if (newStrategy !== null) {
      setExtraPaymentStrategy(newStrategy);
    }
  };

  // Recalculate whenever the strategy changes, using the current extra payments map
  useEffect(() => {
    if (paymentSchedule.length > 0) {
      calculateLoan(extraPayments);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraPaymentStrategy]);

  const formatCurrency = (value) => {
    return parseFloat(value).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const totalPrepaid = Object.values(extraPayments).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

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

            {/* Extra Payment Strategy Toggle */}
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ mb: 1, color: '#34495e', fontWeight: 'bold' }}>
                When an extra payment is made:
              </Typography>
              <ToggleButtonGroup
                value={extraPaymentStrategy}
                exclusive
                onChange={handleStrategyChange}
                orientation={isMobile ? 'vertical' : 'horizontal'}
                fullWidth
                size="small"
              >
                <ToggleButton value="reduceTenure" sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, lineHeight: 1.3, py: { xs: 1, sm: 0.5 } }}>
                  {isMobile ? 'Same EMI, shorter tenure' : 'Keep EMI same, reduce tenure'}
                </ToggleButton>
                <ToggleButton value="reduceEMI" sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, lineHeight: 1.3, py: { xs: 1, sm: 0.5 } }}>
                  {isMobile ? 'Same tenure, lower EMI' : 'Keep tenure same, reduce EMI'}
                </ToggleButton>
              </ToggleButtonGroup>
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
                    Original EMI
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
                    Total Payments Made
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
              {totalPrepaid > 0 && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                    <Typography variant="body1" sx={{ color: '#2980b9', fontSize: { xs: '0.875rem', sm: '1rem' }, whiteSpace: 'nowrap' }}>
                      Total Prepaid (Extra Payments)
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#2980b9', fontSize: { xs: '0.875rem', sm: '1rem' }, whiteSpace: 'nowrap' }}>
                      ₹{formatCurrency(totalPrepaid)}
                    </Typography>
                  </Box>
                </Grid>
              )}
              {extraPaymentStrategy === 'reduceTenure' && summary.scheduledNumberOfPayments > 0 && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                    <Typography variant="body1" sx={{ color: '#27ae60', fontSize: { xs: '0.875rem', sm: '1rem' }, whiteSpace: 'nowrap' }}>
                      Tenure Reduced By
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#27ae60', fontSize: { xs: '0.875rem', sm: '1rem' }, whiteSpace: 'nowrap' }}>
                      {Math.max(summary.scheduledNumberOfPayments - summary.actualNumberOfPayments, 0)} payments
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Strategy Comparison Panel */}
          {comparison && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, color: '#34495e', fontWeight: 'bold', fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
                Which option saves more?
              </Typography>

              {isMobile ? (
                <Grid container spacing={1.5}>
                  {[
                    {
                      key: 'reduceTenure',
                      label: 'Same EMI, Reduced Tenure',
                      win: comparison.reduceTenure.interestSaved >= comparison.reduceEMI.interestSaved,
                      rows: [
                        ['New EMI', `₹${formatCurrency(comparison.baseEMI)}`, 'unchanged'],
                        ['Remaining Payments', comparison.reduceTenure.numPayments, `−${comparison.reduceTenure.monthsSaved} months`],
                        ['Total Interest', `₹${formatCurrency(comparison.reduceTenure.totalInterest)}`, null],
                        ['Interest Saved', `₹${formatCurrency(comparison.reduceTenure.interestSaved)}`, null],
                      ],
                    },
                    {
                      key: 'reduceEMI',
                      label: 'Same Tenure, Reduced EMI',
                      win: comparison.reduceEMI.interestSaved > comparison.reduceTenure.interestSaved,
                      rows: [
                        ['New EMI', `₹${formatCurrency(comparison.reduceEMI.newEMI)}`, `−₹${formatCurrency(comparison.reduceEMI.emiReduction)}/mo`],
                        ['Remaining Payments', comparison.reduceEMI.numPayments, 'unchanged'],
                        ['Total Interest', `₹${formatCurrency(comparison.reduceEMI.totalInterest)}`, null],
                        ['Interest Saved', `₹${formatCurrency(comparison.reduceEMI.interestSaved)}`, null],
                      ],
                    },
                  ].map((card) => (
                    <Grid item xs={12} key={card.key}>
                      <Paper
                        sx={{
                          p: 1.5,
                          border: card.win ? '2px solid #27ae60' : '1px solid #e0e0e0',
                          backgroundColor: card.win ? '#eafaf1' : '#fff',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#34495e' }}>
                            {card.label}
                          </Typography>
                          {card.win && (
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#27ae60', backgroundColor: '#d4f5e2', px: 1, py: 0.25, borderRadius: 1 }}>
                              Better
                            </Typography>
                          )}
                        </Box>
                        <Divider sx={{ mb: 1 }} />
                        {card.rows.map(([label, value, note], idx) => (
                          <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: idx < card.rows.length - 1 ? 0.75 : 0 }}>
                            <Typography sx={{ fontSize: '0.78rem', color: '#34495e' }}>{label}</Typography>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography sx={{ fontSize: '0.78rem', fontWeight: idx === card.rows.length - 1 ? 'bold' : 'normal', color: idx === card.rows.length - 1 ? '#27ae60' : 'inherit' }}>
                                {value}
                              </Typography>
                              {note && (
                                <Typography sx={{ fontSize: '0.68rem', color: note.startsWith('−') ? '#27ae60' : '#7f8c8d' }}>
                                  {note}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
              <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#ecf0f1', fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                        Metric
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 'bold',
                          fontSize: { xs: '0.75rem', sm: '0.85rem' },
                          backgroundColor: comparison.reduceTenure.interestSaved >= comparison.reduceEMI.interestSaved ? '#eafaf1' : '#ecf0f1',
                        }}
                      >
                        Same EMI,<br />Reduced Tenure
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 'bold',
                          fontSize: { xs: '0.75rem', sm: '0.85rem' },
                          backgroundColor: comparison.reduceEMI.interestSaved > comparison.reduceTenure.interestSaved ? '#eafaf1' : '#ecf0f1',
                        }}
                      >
                        Same Tenure,<br />Reduced EMI
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>New EMI</TableCell>
                      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                        ₹{formatCurrency(comparison.baseEMI)}
                        <Typography component="span" sx={{ display: 'block', fontSize: '0.7rem', color: '#7f8c8d' }}>
                          unchanged
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                        ₹{formatCurrency(comparison.reduceEMI.newEMI)}
                        <Typography component="span" sx={{ display: 'block', fontSize: '0.7rem', color: '#27ae60' }}>
                          −₹{formatCurrency(comparison.reduceEMI.emiReduction)}/mo
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>Remaining Payments</TableCell>
                      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                        {comparison.reduceTenure.numPayments}
                        <Typography component="span" sx={{ display: 'block', fontSize: '0.7rem', color: '#27ae60' }}>
                          −{comparison.reduceTenure.monthsSaved} months
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                        {comparison.reduceEMI.numPayments}
                        <Typography component="span" sx={{ display: 'block', fontSize: '0.7rem', color: '#7f8c8d' }}>
                          unchanged
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>Total Interest</TableCell>
                      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                        ₹{formatCurrency(comparison.reduceTenure.totalInterest)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                        ₹{formatCurrency(comparison.reduceEMI.totalInterest)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                        Interest Saved vs No Prepayment
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 'bold',
                          fontSize: { xs: '0.75rem', sm: '0.85rem' },
                          color: '#27ae60',
                          backgroundColor: comparison.reduceTenure.interestSaved >= comparison.reduceEMI.interestSaved ? '#eafaf1' : 'transparent',
                        }}
                      >
                        ₹{formatCurrency(comparison.reduceTenure.interestSaved)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 'bold',
                          fontSize: { xs: '0.75rem', sm: '0.85rem' },
                          color: '#27ae60',
                          backgroundColor: comparison.reduceEMI.interestSaved > comparison.reduceTenure.interestSaved ? '#eafaf1' : 'transparent',
                        }}
                      >
                        ₹{formatCurrency(comparison.reduceEMI.interestSaved)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              )}
              <Typography variant="body2" sx={{ mt: 1, color: '#7f8c8d', fontSize: '0.78rem' }}>
                {comparison.reduceTenure.interestSaved >= comparison.reduceEMI.interestSaved
                  ? `Keeping the EMI the same and reducing tenure saves you ₹${formatCurrency(
                      comparison.reduceTenure.interestSaved - comparison.reduceEMI.interestSaved
                    )} more in interest, and you'll be debt-free ${comparison.reduceTenure.monthsSaved} months sooner.`
                  : `Reducing the EMI while keeping the tenure same saves you ₹${formatCurrency(
                      comparison.reduceEMI.interestSaved - comparison.reduceTenure.interestSaved
                    )} more in interest overall, though it takes the same time to finish.`}
                {' '}The selected option above (toggle) drives the schedule table below.
              </Typography>
            </Box>
          )}
        </Grid>

        {/* Calculate Button */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => calculateLoan()}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: { xs: 2, sm: 3 }, mb: 2 }}>
              <Typography
                variant="h6"
                sx={{ color: '#34495e', fontWeight: 'bold', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
              >
                Payment Schedule
              </Typography>
              {totalPrepaid > 0 && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleClearExtraPayments}
                  sx={{ textTransform: 'none' }}
                >
                  Clear Extra Payments
                </Button>
              )}
            </Box>
            <Typography variant="body2" sx={{ mb: 2, color: '#7f8c8d', fontSize: '0.8rem' }}>
              Edit the "Extra Payment" value for any row to add a prepayment. The schedule recalculates automatically based on your selected strategy above.
            </Typography>

            {isMobile ? (
              <Box sx={{ maxHeight: 500, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {paymentSchedule.map((row) => (
                  <Paper
                    key={row.paymentNumber}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      border: row.extraPayment > 0 ? '1px solid #27ae60' : '1px solid #e0e0e0',
                      backgroundColor: row.extraPayment > 0 ? '#eafaf1' : '#fff',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#34495e' }}>
                        #{row.paymentNumber} · {row.paymentDate}
                      </Typography>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                        ₹{formatCurrency(row.totalPayment)}
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 1 }} />
                    <Grid container spacing={0.5} sx={{ fontSize: '0.75rem' }}>
                      <Grid item xs={6}>
                        <Typography sx={{ fontSize: '0.7rem', color: '#7f8c8d' }}>Beginning Balance</Typography>
                        <Typography sx={{ fontSize: '0.78rem' }}>₹{formatCurrency(row.beginningBalance)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography sx={{ fontSize: '0.7rem', color: '#7f8c8d' }}>Ending Balance</Typography>
                        <Typography sx={{ fontSize: '0.78rem' }}>₹{formatCurrency(row.endingBalance)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography sx={{ fontSize: '0.7rem', color: '#7f8c8d' }}>Scheduled Payment</Typography>
                        <Typography sx={{ fontSize: '0.78rem' }}>₹{formatCurrency(row.scheduledPayment)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography sx={{ fontSize: '0.7rem', color: '#7f8c8d' }}>Principal / Interest</Typography>
                        <Typography sx={{ fontSize: '0.78rem' }}>₹{formatCurrency(row.principal)} / ₹{formatCurrency(row.interest)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography sx={{ fontSize: '0.7rem', color: '#7f8c8d' }}>Cumulative Interest</Typography>
                        <Typography sx={{ fontSize: '0.78rem' }}>₹{formatCurrency(row.cumulativeInterest)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography sx={{ fontSize: '0.7rem', color: '#7f8c8d', mb: 0.25 }}>Extra Payment</Typography>
                        <TextField
                          type="number"
                          size="small"
                          variant="outlined"
                          value={extraPayments[row.paymentNumber] || ''}
                          placeholder="0"
                          onChange={(e) => handleExtraPaymentChange(row.paymentNumber, e.target.value)}
                          inputProps={{
                            min: 0,
                            style: { textAlign: 'right', fontSize: '0.78rem', padding: '4px 8px' },
                          }}
                          fullWidth
                          sx={{
                            '& input[type=number]': { MozAppearance: 'textfield' },
                            '& input[type=number]::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 },
                            '& input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#fff7e6',
                              '& fieldset': { borderColor: '#f39c12' },
                              '&:hover fieldset': { borderColor: '#e67e22' },
                              '&.Mui-focused fieldset': { borderColor: '#e67e22' },
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>
            ) : (
            <TableContainer
              component={Paper}
              sx={{
                maxHeight: { xs: 400, sm: 500, md: 600 },
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
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
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#34495e', color: 'white', fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap', minWidth: 140 }} align="right">
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
                      sx={{
                        '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' },
                        ...(row.extraPayment > 0 ? { backgroundColor: '#eafaf1 !important' } : {}),
                      }}
                    >
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{row.paymentNumber}</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>{row.paymentDate}</TableCell>
                      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>₹{formatCurrency(row.beginningBalance)}</TableCell>
                      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>₹{formatCurrency(row.scheduledPayment)}</TableCell>
                      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>
                        <TextField
                          type="number"
                          size="small"
                          variant="outlined"
                          value={extraPayments[row.paymentNumber] || ''}
                          placeholder="0"
                          onChange={(e) => handleExtraPaymentChange(row.paymentNumber, e.target.value)}
                          inputProps={{
                            min: 0,
                            style: { textAlign: 'right', fontSize: '0.8rem', padding: '4px 8px' },
                          }}
                          sx={{
                            width: 110,
                            '& input[type=number]': {
                              MozAppearance: 'textfield',
                            },
                            '& input[type=number]::-webkit-outer-spin-button': {
                              WebkitAppearance: 'none',
                              margin: 0,
                            },
                            '& input[type=number]::-webkit-inner-spin-button': {
                              WebkitAppearance: 'none',
                              margin: 0,
                            },
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#fff7e6',
                              '& fieldset': {
                                borderColor: '#f39c12',
                              },
                              '&:hover fieldset': {
                                borderColor: '#e67e22',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#e67e22',
                              },
                            },
                          }}
                        />
                      </TableCell>
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
            )}
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default LoanCalculator;