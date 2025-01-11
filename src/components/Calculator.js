import React, { useState, useEffect } from 'react';
import {
  TextField,
  Box,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';

const Calculator = () => {
  const [shares, setShares] = useState([{ buyPrice: '', quantity: '' }, { buyPrice: '', quantity: '' }]);
  const [currencySymbol, setCurrencySymbol] = useState('₹'); // Default to INR

  useEffect(() => {
    // Detect user's region and set currency symbol
    const userLocale = navigator.language || 'en-IN'; // Default to 'en-US' if no locale detected
    const region = userLocale.split('-')[1] || 'IN'; // Get region from language code

    let currency = '₹'; // Default to INR
    if (region === 'US') {
      currency = '$'; // USD
    } else if (region === 'GB') {
      currency = '£'; // GBP
    } else if (region === 'EU') {
      currency = '€'; // EUR
    }

    setCurrencySymbol(currency);
  }, []);

  const layoutStyles = {
    containerWidth: '100%', // Set the container width to 100% for responsiveness
    containerHeight: 'auto', // Height adjusts automatically based on content
  };

  const handleInputChange = (index, field, value) => {
    if (value >= 0 || value === '') {
      const updatedShares = [...shares];
      updatedShares[index][field] = value;
      setShares(updatedShares);
    }
  };

  const handleAddShare = () => {
    setShares([...shares, { buyPrice: '', quantity: '' }]);
  };

  const handleDeleteShare = (index) => {
    if (index !== 0) {
      const updatedShares = shares.filter((_, i) => i !== index);
      setShares(updatedShares);
    }
  };

  const calculateResults = () => {
    const totalInvestment = shares.reduce((sum, share) => {
      const price = parseFloat(share.buyPrice) || 0;
      const qty = parseInt(share.quantity) || 0;
      if (price && qty) {
        return sum + price * qty;
      }
      return sum
    }, 0);

    const totalQuantity = shares.reduce((sum, share) => {
      const qty = parseInt(share.quantity) || 0;
      if (share.buyPrice) {
        return sum + qty;
      }
      return sum;
    }, 0);

    const averagePrice = totalQuantity > 0 ? totalInvestment / totalQuantity : 0;

    return {
      totalInvestment: totalInvestment.toFixed(2),
      totalQuantity,
      averagePrice: averagePrice.toFixed(2),
    };
  };

  const hasValues = shares.some((share) => share.buyPrice || share.quantity);
  const results = calculateResults();

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      sx={{
        width: '100vw',
        backgroundColor: '#f4f6f8',
        padding: 2,
      }}
    >
      <Box
        sx={{
          width: layoutStyles.containerWidth,
          height: layoutStyles.containerHeight,
          backgroundColor: 'white',
          padding: 4,
          borderRadius: 3,
          boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
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
          Stock Average Calculator
        </Typography>

        {shares.map((share, index) => (
          <Box
            key={index}
            mb={2}
            display="flex"
            alignItems="center"
            gap={2}
            flexDirection={{ xs: 'column', sm: 'row' }} // Stack items vertically on small screens
            sx={{
              transition: 'all 0.3s ease',
              '&:hover': { backgroundColor: '#f9fafb', borderRadius: 2 },
            }}
          >
            <TextField
              label={`Buy Price (Share ${index + 1})`}
              type="number"
              value={share.buyPrice}
              onChange={(e) => handleInputChange(index, 'buyPrice', e.target.value)}
              fullWidth
              sx={{
                // backgroundColor: '#ecf0f1',
                borderRadius: 1,
              }}
            />
            <Box
              display="flex"
              alignItems="center"
              gap={1} // Space between the quantity field and delete icon
              sx={{
                width: '100%',
                flexDirection: 'row', // Ensure horizontal alignment
              }}
            >
              <TextField
                label={`Quantity (Share ${index + 1})`}
                type="number"
                value={share.quantity}
                onChange={(e) => handleInputChange(index, 'quantity', e.target.value)}
                fullWidth
                sx={{
                  // backgroundColor: '#ecf0f1',
                  borderRadius: 1,
                }}
              />
              {index > 0 && (
                <IconButton
                  color="error"
                  onClick={() => handleDeleteShare(index)}
                  sx={{
                    color: '#e74c3c',
                    padding: '10px', // Increased padding to ensure spacing around the icon
                    marginLeft: '8px', // Ensure space between the quantity field and icon
                    '&:hover': {
                      backgroundColor: '#f4f6f8', // Adding hover effect for better visual appeal
                    },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          </Box>
        ))}

        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleAddShare}
          fullWidth
          sx={{
            mt: 2,
            backgroundColor: '#3498db',
            color: 'white',
            '&:hover': { backgroundColor: '#2980b9' },
          }}
        >
          Add More
        </Button>

        {hasValues && (
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexDirection={{ xs: 'column', sm: 'row' }} // Stack results vertically on small screens
            sx={{
              backgroundColor: '#ecf0f1',
              padding: 3,
              borderRadius: 2,
              marginTop: 4,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            <Box mb={{ xs: 2, sm: 0 }}>
              <Typography variant="h6" sx={{ color: '#34495e' }}>
                Total Shares
              </Typography>
              <Typography variant="h5">{results.totalQuantity}</Typography>
            </Box>
            <Box mb={{ xs: 2, sm: 0 }}>
              <Typography variant="h6" sx={{ color: '#34495e' }}>
                Total Amount
              </Typography>
              <Typography variant="h5">{currencySymbol}{results.totalInvestment}</Typography>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: '#34495e' }}>
                Average Price
              </Typography>
              <Typography variant="h5">{currencySymbol}{results.averagePrice}</Typography>
            </Box>
          </Box>
        )}

        {hasValues && (
          <Box mt={4}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead
                  sx={{
                    backgroundColor: '#3498db',
                  }}
                >
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Share</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                      Total Bought
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                      Per Share Price
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                      Total Amount
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shares.map((share, index) => {
                    const price = parseFloat(share.buyPrice) || 0;
                    const qty = parseInt(share.quantity) || 0;
                    const totalAmount = price * qty;

                    return (
                      <TableRow key={index}>
                        <TableCell>Share {index + 1}</TableCell>
                        <TableCell align="right">{qty}</TableCell>
                        <TableCell align="right">{price.toFixed(2)}</TableCell>
                        <TableCell align="right">{totalAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Calculator;
