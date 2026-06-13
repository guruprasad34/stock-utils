import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Grid,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AverageCalculatorPage from './components/AverageCalculator';
import ReturnCalculatorPage from './components/ReturnsCalculator';
import LoanCalculatorPage from './components/LoanCalculator';
import './App.css';

// Define an array of route objects to make it dynamic
const routes = [
  { path: '/average', label: 'Average Calculator', description: 'Calculate the average buy price across multiple trades.', component: <AverageCalculatorPage /> },
  { path: '/returns', label: 'Returns Calculator', description: 'Work out returns on your investments over time.', component: <ReturnCalculatorPage /> },
  { path: '/loan', label: 'Loan Calculator', description: 'Plan EMI payments, prepayments, and loan tenure.', component: <LoanCalculatorPage /> },
  // Add new route objects here as you add new components
];

// Simple landing page that lists all available calculators
const HomePage = () => (
  <Box sx={{ width: '100%', maxWidth: 1000, px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6 } }}>
    {/* <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1, textAlign: 'center' }}>
      Stock Utils
    </Typography> */}
    <Typography variant="body1" sx={{ color: '#7f8c8d', mb: 4, textAlign: 'center' }}>
      Choose a calculator to get started
    </Typography>
    <Grid container spacing={3}>
      {routes.map((route) => (
        <Grid item xs={12} sm={6} md={4} key={route.path}>
          <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <CardActionArea component={Link} to={route.path} sx={{ height: '100%', p: 1 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#34495e', mb: 1 }}>
                  {route.label}
                </Typography>
                <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
                  {route.description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Box>
);

const AppLayout = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const toggleDrawer = () => setOpen(!open);

  // Hide the navbar/sidebar when no calculator is selected (on the landing page)
  const isHome = location.pathname === '/';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {!isHome && (
        <>
          {/* Navbar (AppBar) */}
          <AppBar position="fixed">
            <Toolbar>
              <IconButton edge="start" color="inherit" aria-label="menu" onClick={toggleDrawer} sx={{ display: { xs: 'block', sm: 'none' }, mr: 1 }}>
                <MenuIcon />
              </IconButton>
              <Typography
                variant="h6"
                component={Link}
                to="/"
                sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}
              >
                Calculators
              </Typography>
              {/* Dynamically generate navbar buttons */}
              {routes.map((route) => (
                <Button key={route.path} component={Link} to={route.path} color="inherit" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                  {route.label}
                </Button>
              ))}
            </Toolbar>
          </AppBar>

          {/* Sidebar Drawer */}
          <Drawer
            sx={{
              width: 240,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: 240,
                boxSizing: 'border-box',
              },
            }}
            variant="temporary"
            anchor="left"
            open={open}
            onClose={toggleDrawer}
          >
            {/* Dynamically generate sidebar links */}
            <List>
              <ListItem disablePadding>
                <ListItemButton component={Link} to="/" onClick={toggleDrawer}>
                  <ListItemText primary="Home" />
                </ListItemButton>
              </ListItem>
              {routes.map((route) => (
                <ListItem disablePadding key={route.path}>
                  <ListItemButton component={Link} to={route.path} onClick={toggleDrawer}>
                    <ListItemText primary={route.label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Drawer>
        </>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#f4f6f8',
          paddingTop: isHome ? 0 : 8, // Only offset for AppBar when navbar is shown
          display: 'flex',
          justifyContent: 'center', // Centers content horizontally
          alignItems: 'flex-start', // Align to top so tall content isn't clipped
          minHeight: '100vh',
          width: '100%',
          overflowY: 'auto',
        }}
      >
        {/* Dynamically generate routes */}
        <Routes>
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.component} />
          ))}
          {/* Default Route - landing page with list of calculators */}
          <Route path="/" element={<HomePage />} />
          {/* Catch-all fallback so unknown paths also show the landing page */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Box>
    </Box>
  );
};

const App = () => (
  <Router>
    <AppLayout />
  </Router>
);

export default App;