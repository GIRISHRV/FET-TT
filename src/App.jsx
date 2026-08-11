import React, { useState } from 'react';
import { 
  Box, BottomNavigation, BottomNavigationAction, Paper,
  AppBar, Toolbar, Typography, IconButton, Button
} from '@mui/material';
import TodayIcon from '@mui/icons-material/Today';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import SettingsIcon from '@mui/icons-material/Settings';
import SyncIcon from '@mui/icons-material/Sync';
import { CircularProgress } from '@mui/material';

import { useAppStore } from './store';
import SetupWizard from './components/SetupWizard';
import TodayPanel from './components/TodayPanel';
import TimetablePanel from './components/TimetablePanel';
import CoursesPanel from './components/CoursesPanel';
import FacultyPanel from './components/FacultyPanel';

export default function App() {
  const { isSetupComplete, data, batchKey, fetchError, syncData, isSyncing } = useAppStore();
  const [tab, setTab] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

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
      default: return <TodayPanel />;
    }
  };

  const titles = ['Today', 'Timetable', 'Courses', 'Faculty'];

  return (
    <Box sx={{ pb: 7, bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.default', color: 'text.primary' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700}>
            {titles[tab]}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Typography variant="body2" color="primary" fontWeight={500} sx={{ px: 1, py: 0.5, bgcolor: 'primary.container', borderRadius: 2 }}>
                {batchKey}
              </Typography>
              {data?._meta?.sourceUpdatedAt && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.65rem' }}>
                  Updated: {data._meta.sourceUpdatedAt}
                </Typography>
              )}
            </Box>
            <IconButton onClick={syncData} disabled={isSyncing}>
              {isSyncing ? <CircularProgress size={24} /> : <SyncIcon />}
            </IconButton>
            <IconButton onClick={() => setShowSettings(true)}>
              <SettingsIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2 }}>
        {renderTab()}
      </Box>

      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100 }} elevation={3}>
        <BottomNavigation
          showLabels
          value={tab}
          onChange={(event, newValue) => setTab(newValue)}
          sx={{ bgcolor: 'background.surfaceContainer' }}
        >
          <BottomNavigationAction label="Today" icon={<TodayIcon />} />
          <BottomNavigationAction label="Timetable" icon={<ViewWeekIcon />} />
          <BottomNavigationAction label="Courses" icon={<MenuBookIcon />} />
          <BottomNavigationAction label="Faculty" icon={<PersonSearchIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
