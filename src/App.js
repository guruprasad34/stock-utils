import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { Box, AppBar, Toolbar, IconButton, Typography, Drawer, List, ListItem, ListItemText, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AverageCalculatorPage from './components/AverageCalculator';
import ReturnCalculatorPage from './components/ReturnsCalculator';
import './App.css';

// Define an array of route objects to make it dynamic
const routes = [
  { path: '/average', label: 'Average Calculator', component: <AverageCalculatorPage /> },
  { path: '/returns', label: 'Returns Calculator', component: <ReturnCalculatorPage /> },
  // Add new route objects here as you add new components
];

const App = () => {
  const [open, setOpen] = useState(false);

  const toggleDrawer = () => setOpen(!open);

  return (
    <Router>
      <Box sx={ { display: 'flex', height: '100vh' } }>
        {/* Navbar (AppBar) */ }
        <AppBar position="fixed">
          <Toolbar>
            <IconButton edge="start" color="inherit" aria-label="menu" onClick={ toggleDrawer } sx={ { display: { xs: 'block', sm: 'none' } } }>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={ { flexGrow: 1 } }>
              Stock Calculators
            </Typography>
            {/* Dynamically generate navbar buttons */ }
            { routes.map((route) => (
              <Button key={ route.path } component={ Link } to={ route.path } color="inherit" sx={ { display: { xs: 'none', sm: 'inline' } } }>
                { route.label }
              </Button>
            )) }
          </Toolbar>
        </AppBar>

        {/* Sidebar Drawer */ }
        <Drawer
          sx={ {
            width: 240,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 240,
              boxSizing: 'border-box',
            },
          } }
          variant="temporary"
          anchor="left"
          open={ open }
          onClose={ toggleDrawer }
        >
          {/* Dynamically generate sidebar links */ }
          <List>
            { routes.map((route) => (
              <ListItem
                button // This makes the ListItem clickable, and it doesn't need a value like true.
                component={ Link }
                to={ route.path }
                onClick={ toggleDrawer }
                key={ route.path }
              >
                <ListItemText primary={ route.label } />
              </ListItem>
            )) }
          </List>
        </Drawer>

        {/* Main Content Area */ }
        <Box
          component="main"
          sx={ {
            flexGrow: 1,
            bgcolor: '#f4f6f8',
            paddingTop: 8, // To avoid AppBar overlapping content
            // overflow: 'hidden', // Prevents overflow and horizontal scrolling
            display: 'flex',
            justifyContent: 'center', // Centers content horizontally
            alignItems: 'center', // Centers content vertically
            height: '100vh', // Makes sure content takes full viewport height
          } }
        >
          {/* Dynamically generate routes */ }
          <Routes>
            { routes.map((route) => (
              <Route key={ route.path } path={ route.path } element={ route.component } />
            )) }
            {/* Default Route */ }
            <Route path="/" element={ <AverageCalculatorPage /> } />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
};

export default App;
