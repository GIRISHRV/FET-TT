import React, { useState, useEffect } from 'react';
import { 
  Box, BottomNavigation, BottomNavigationAction, Paper,
  AppBar, Toolbar, Typography, IconButton, Button, Chip
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import TodayIcon from '@mui/icons-material/Today';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import SettingsIcon from '@mui/icons-material/Settings';
import SyncIcon from '@mui/icons-material/Sync';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import { CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

import { useAppStore } from './store';
import SetupWizard from './components/SetupWizard';
import TodayPanel from './components/TodayPanel';
import TimetablePanel from './components/TimetablePanel';
import CoursesPanel from './components/CoursesPanel';
import FacultyPanel from './components/FacultyPanel';
import EmptyRoomsPanel from './components/EmptyRoomsPanel';
import { getTodayDayName, getCurrentPeriod, getPeriodsForBatch, toMins } from './utils';

const generateStars = (n, color) => {
  let value = `${Math.floor(Math.random() * 100)}vw ${Math.floor(Math.random() * 200)}vh ${color}`;
  for (let i = 1; i < n; i++) {
    value += `, ${Math.floor(Math.random() * 100)}vw ${Math.floor(Math.random() * 200)}vh ${color}`;
  }
  return value;
};
const starsSmall = generateStars(150, 'rgba(255,255,255,0.2)');
const starsMedium = generateStars(70, 'rgba(255,255,255,0.4)');
const starsLarge = generateStars(30, 'rgba(255,255,255,0.6)');

export default function App() {
  const { isSetupComplete, data, batchKey, fetchError, syncData, isSyncing, currentBatch, selectedSubjects } = useAppStore();
  const [tab, setTab] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [direction, setDirection] = useState(0);
  const [notifPerm, setNotifPerm] = useState(Notification.permission);

  // Notification Logic
  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(perm => {
        setNotifPerm(perm);
      });
    }
  };

  useEffect(() => {
    if (notifPerm !== 'granted' || !currentBatch) return;

    const checkNextClass = () => {
      const dayName = getTodayDayName();
      if (!['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(dayName)) return;
      
      const gridDay = currentBatch.grid[dayName];
      if (!gridDay) return;

      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();

      // Find the upcoming class
      const periods = getPeriodsForBatch(currentBatch, dayName);
      for (const p of periods) {
        const clsList = Array.isArray(gridDay[p.periodStr]) ? gridDay[p.periodStr] : [gridDay[p.periodStr]];
        const validClass = clsList.find(c => {
          if (c.type === 'free' || c.type === 'lunch') return false;
          if (c.type === 'lab') {
            const match = c.text.match(/^([^ (]+)/);
            return match && selectedSubjects.includes(match[1]);
          }
          return true;
        });

        if (validClass) {
          const startMins = toMins(p.startTime);
          // If class starts in exactly 10 minutes (give or take a few seconds)
          if (startMins - currentMins === 10) {
            new Notification('Upcoming Class in 10 mins!', {
              body: validClass.text,
              icon: '/icons/icon-192x192.png'
            });
          }
          // If we found a class that is in the future, stop looking
          if (startMins > currentMins) break;
        }
      }
    };

    const interval = setInterval(checkNextClass, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [notifPerm, currentBatch, selectedSubjects]);

  const handleTabChange = (event, newValue) => {
    setDirection(newValue > tab ? 1 : -1);
    setTab(newValue);
  };

  const handleDragEnd = (e, { offset, velocity }) => {
    const swipeThreshold = 50;
    if (offset.x < -swipeThreshold && tab < 4) {
      setDirection(1);
      setTab(tab + 1);
    } else if (offset.x > swipeThreshold && tab > 0) {
      setDirection(-1);
      setTab(tab - 1);
    }
  };

  // If data isn't loaded yet and there's an error
  if (!data && fetchError) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 2 }}>
        <Typography color="error">Error loading data: {fetchError}</Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>Retry</Button>
      </Box>
    );
  }

  // If data isn't loaded yet
  if (!data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  // If setup is incomplete or user requested settings
  if (!isSetupComplete || showSettings) {
    return <SetupWizard onClose={() => setShowSettings(false)} />;
  }

  const renderTab = () => {
    switch (tab) {
      case 0: return <TodayPanel />;
      case 1: return <TimetablePanel />;
      case 2: return <CoursesPanel />;
      case 3: return <FacultyPanel />;
      case 4: return <EmptyRoomsPanel />;
      default: return <TodayPanel />;
    }
  };

  const titles = ['Today', 'Timetable', 'Courses', 'Faculty', 'Empty Rooms'];

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir < 0 ? '100%' : '-100%', opacity: 0 })
  };

  return (
    <Box sx={{ position: 'relative', height: '100dvh', overflow: 'hidden', bgcolor: 'background.default' }}>
      
      {/* Drifting Stardust Background */}
      <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0, opacity: (theme) => theme.palette.mode === 'dark' ? 1 : 0.3 }}>
        <motion.div animate={{ y: ['0vh', '-100vh'] }} transition={{ repeat: Infinity, duration: 150, ease: 'linear' }} style={{ position: 'absolute', width: '100%', height: '100%' }}>
          <Box sx={{ width: '2px', height: '2px', borderRadius: '50%', boxShadow: starsSmall }} />
          <Box sx={{ width: '2px', height: '2px', borderRadius: '50%', boxShadow: starsSmall, transform: 'translateY(100vh)' }} />
        </motion.div>
        
        <motion.div animate={{ y: ['0vh', '-100vh'] }} transition={{ repeat: Infinity, duration: 100, ease: 'linear' }} style={{ position: 'absolute', width: '100%', height: '100%' }}>
          <Box sx={{ width: '3px', height: '3px', borderRadius: '50%', boxShadow: starsMedium }} />
          <Box sx={{ width: '3px', height: '3px', borderRadius: '50%', boxShadow: starsMedium, transform: 'translateY(100vh)' }} />
        </motion.div>

        <motion.div animate={{ y: ['0vh', '-100vh'] }} transition={{ repeat: Infinity, duration: 50, ease: 'linear' }} style={{ position: 'absolute', width: '100%', height: '100%' }}>
          <Box sx={{ width: '4px', height: '4px', borderRadius: '50%', boxShadow: starsLarge }} />
          <Box sx={{ width: '4px', height: '4px', borderRadius: '50%', boxShadow: starsLarge, transform: 'translateY(100vh)' }} />
        </motion.div>
      </Box>

      {/* Scrollable Content Area */}
      <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 1 }}>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={tab}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'tween', duration: 0.2 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}
          >
            <Box sx={{ pt: '65px', pb: '65px', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
              {renderTab()}
            </Box>
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Top AppBar */}
      <AppBar 
        position="absolute" 
        elevation={0} 
        sx={{ 
          top: 0, left: 0, right: 0,
          background: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.7)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderBottom: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'}`,
          color: 'text.primary', 
          zIndex: 110, 
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: 2, minHeight: { xs: 64, sm: 64 } }}>
          <Typography 
            variant="h6" 
            fontWeight={800} 
            sx={{ 
              background: 'linear-gradient(90deg, #ef6905, #8b2626)', 
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px'
            }}
          >
            {titles[tab]}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={batchKey ? (batchKey.split('|').length === 3 ? `${batchKey.split('|')[0]} • Sem ${batchKey.split('|')[1]} • Sec ${batchKey.split('|')[2]}` : batchKey) : ''} 
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700, borderRadius: 1.5, mr: 0.5, borderWidth: 1.5 }}
            />
            
            {'Notification' in window && notifPerm !== 'granted' && (
              <IconButton size="small" color="warning" onClick={requestNotificationPermission} sx={{ bgcolor: 'action.hover' }}>
                <NotificationsOffIcon fontSize="small" />
              </IconButton>
            )}
            
            <IconButton size="small" onClick={syncData} disabled={isSyncing} sx={{ bgcolor: 'action.hover' }}>
              {isSyncing ? <CircularProgress size={18} /> : <SyncIcon fontSize="small" />}
            </IconButton>
            <IconButton size="small" onClick={() => setShowSettings(true)} sx={{ bgcolor: 'action.hover' }}>
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Bottom Nav */}
      <Paper 
        sx={{ 
          position: 'absolute', bottom: 0, left: 0, right: 0, 
          zIndex: 110, 
          bgcolor: 'transparent' 
        }} 
        elevation={0}
      >
        <BottomNavigation
          showLabels
          value={tab}
          onChange={handleTabChange}
          sx={{ 
            background: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.7)',
            boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderTop: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'}`,
            '& .MuiBottomNavigationAction-root': { minWidth: 'auto', px: 1 } 
          }}
        >
          <BottomNavigationAction label="Today" icon={<TodayIcon />} />
          <BottomNavigationAction label="Time" icon={<ViewWeekIcon />} />
          <BottomNavigationAction label="Courses" icon={<MenuBookIcon />} />
          <BottomNavigationAction label="Faculty" icon={<PersonSearchIcon />} />
          <BottomNavigationAction label="Rooms" icon={<MeetingRoomIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
