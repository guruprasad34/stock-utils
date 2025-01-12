import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Grid,
} from '@mui/material';

const ReturnsCalculator = () => {
  const [currentPrice, setCurrentPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isPercentageMode, setIsPercentageMode] = useState(true); // Toggle for mode
  const [expectedPercentage, setExpectedPercentage] = useState('');
  const [expectedSellPrice, setExpectedSellPrice] = useState('');
  const [brokerCommission, setBrokerCommission] = useState(25); // Default broker commission
  const [results, setResults] = useState({
    sellPrice: 0,
    returnPercentage: 0,
    profitAmount: 0,
    profitPerStock: 0,
    perStockSellPrice: 0,
  });

  const calculateResults = () => {
    const price = parseFloat(currentPrice) || 0;
    const qty = parseInt(quantity) || 0;
    const commission = parseFloat(brokerCommission) || 0;

    if (price > 0 && qty > 0) {
      let sellPrice = 0;
      let returnPercentage = 0;

      if (isPercentageMode) {
        // If mode is percentage
        returnPercentage = parseFloat(expectedPercentage) || 0;
        sellPrice = price + (price * returnPercentage) / 100;
        setExpectedSellPrice(sellPrice.toFixed(2));
      } else {
        // If mode is sell price
        sellPrice = parseFloat(expectedSellPrice) || 0;
        returnPercentage = ((sellPrice - price) / price) * 100;
        setExpectedPercentage(returnPercentage.toFixed(2));
      }

      const totalSellValue = sellPrice * qty;
      const totalCost = price * qty + commission;
      const profitAmount = totalSellValue - totalCost;
      const profitPerStock = profitAmount / qty;
      const perStockSellPrice = sellPrice; // Per stock sell price

      setResults({
        sellPrice: (sellPrice * qty).toFixed(2),
        returnPercentage: returnPercentage.toFixed(2),
        profitAmount: profitAmount.toFixed(2),
        profitPerStock: profitPerStock.toFixed(2),
        perStockSellPrice: perStockSellPrice.toFixed(2),
      });
    }
  };

  return (
    <Box
      sx={{
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f4f6f8',
        padding: 4,
        marginTop: '120px', // Adjust the margin to be at least the height of your navbar
      }}
    >
      <Box
        sx={{
          backgroundColor: 'white',
          padding: 4,
          borderRadius: 3,
          boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: 600,
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            color: '#2c3e50',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          Stock Return Calculator
        </Typography>

        <Grid container spacing={3}>
          {/* Current Price */}
          <Grid item xs={12}>
            <TextField
              label="Current Price"
              type="number"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
              fullWidth
            />
          </Grid>

          {/* Quantity */}
          <Grid item xs={12}>
            <TextField
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              fullWidth
            />
          </Grid>

          {/* Toggle for Mode */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={isPercentageMode}
                  onChange={(e) => setIsPercentageMode(e.target.checked)}
                />
              }
              label={isPercentageMode ? 'Enter Return %' : 'Enter Sell Price'}
              sx={{ display: 'block' }} // Ensure the toggle is on a new line
            />
          </Grid>

          {/* Input Fields */}
          <Grid item xs={6}>
            <TextField
              label="Expected Return %"
              type="number"
              value={expectedPercentage}
              onChange={(e) => setExpectedPercentage(e.target.value)}
              disabled={!isPercentageMode}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Expected Sell Price"
              type="number"
              value={expectedSellPrice}
              onChange={(e) => setExpectedSellPrice(e.target.value)}
              disabled={isPercentageMode}
              fullWidth
            />
          </Grid>

          {/* Broker Commission */}
          <Grid item xs={6}>
            <TextField
              label="Broker Commission"
              type="number"
              value={brokerCommission}
              onChange={(e) => setBrokerCommission(e.target.value)}
              fullWidth
              helperText="Default: ₹25. You can edit this value."
            />
          </Grid>

          {/* Calculate Button */}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={calculateResults}
              fullWidth
              sx={{
                backgroundColor: '#3498db',
                '&:hover': { backgroundColor: '#2980b9' },
              }}
            >
              Calculate
            </Button>
          </Grid>

          {/* Results */}
          {results.sellPrice > 0 && (
            <Grid item xs={12}>
              <Box
                sx={{
                  backgroundColor: '#ecf0f1',
                  padding: 3,
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}
              >
                <Grid container spacing={3}>
                  {/* Sell Price */}
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    sx={{
                      textAlign: { xs: 'center', sm: 'left' },
                    }}
                  >
                    <Typography variant="h6" sx={{ color: '#34495e' }}>
                      Total Sell Value
                    </Typography>
                    <Typography variant="h5">₹{results.sellPrice}</Typography>
                  </Grid>

                  {/* Return Percentage */}
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    sx={{
                      textAlign: { xs: 'center', sm: 'left' },
                    }}
                  >
                    <Typography variant="h6" sx={{ color: '#34495e' }}>
                      Return Percentage
                    </Typography>
                    <Typography variant="h5">{results.returnPercentage}%</Typography>
                  </Grid>

                  {/* Profit Amount */}
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    sx={{
                      textAlign: { xs: 'center', sm: 'left' },
                    }}
                  >
                    <Typography variant="h6" sx={{ color: '#34495e' }}>
                      Profit Amount
                    </Typography>
                    <Typography variant="h5">₹{results.profitAmount}</Typography>
                  </Grid>

                  {/* Per Stock Sell Price */}
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    sx={{
                      textAlign: { xs: 'center', sm: 'left' },
                    }}
                  >
                    <Typography variant="h6" sx={{ color: '#34495e' }}>
                      Per Stock Sell Price
                    </Typography>
                    <Typography variant="h5">₹{results.perStockSellPrice}</Typography>
                  </Grid>

                  {/* Profit Per Stock */}
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    sx={{
                      textAlign: { xs: 'center', sm: 'left' },
                    }}
                  >
                    <Typography variant="h6" sx={{ color: '#34495e' }}>
                      Profit Per Stock
                    </Typography>
                    <Typography variant="h5">₹{results.profitPerStock}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default ReturnsCalculator;
