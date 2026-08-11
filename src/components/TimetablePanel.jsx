import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Chip, Tabs, Tab, Paper
} from '@mui/material';
import { useAppStore } from '../store';
import { formatTime12h, toMins } from '../utils';
import { useDaySchedule } from '../hooks/useDaySchedule';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function TimetablePanel() {
  const { currentBatch, selectedSubjects } = useAppStore();
  
  // Set initial tab to today (if mon-fri), otherwise Monday
  const todayIdx = (new Date().getDay() - 1 + 7) % 7;
  const initialTab = (todayIdx >= 0 && todayIdx < 5) ? todayIdx : 0;
  
  const [tab, setTab] = useState(initialTab);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1 minute is fine for this panel
    return () => clearInterval(timer);
  }, []);

  if (!currentBatch) return null;

  const currentDay = DAYS[tab];
  const dayClasses = useDaySchedule(currentBatch, selectedSubjects, currentDay);
  const hasClasses = dayClasses.length > 0;
  const isTodayTab = todayIdx === tab;

  // Compute current period if viewing today's tab
  let currentPeriod = null;
  if (isTodayTab) {
    const mins = currentTime.getHours() * 60 + currentTime.getMinutes();
    currentPeriod = dayClasses.find(c => {
      const s = toMins(c.period.start);
      const e = toMins(c.period.end);
      return mins >= s && mins < e;
    });
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
      <Tabs 
        value={tab} 
        onChange={(e, v) => setTab(v)} 
        variant="fullWidth" 
        sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 48 }}
      >
        {DAYS.map((day, index) => (
          <Tab 
            key={day} 
            label={day} 
            value={index} 
            sx={{ minWidth: 0, px: 1 }}
          />
        ))}
      </Tabs>

      {!hasClasses ? (
        <Typography textAlign="center" color="text.secondary" sx={{ mt: 4 }}>
          No classes on {currentDay}.
        </Typography>
      ) : (
        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative', pt: 2, pb: 4, px: 1 }}>
          {/* The timeline vertical line */}
          <Box sx={{ position: 'absolute', left: 75, top: 0, bottom: 0, width: 2, bgcolor: 'divider', zIndex: 0 }} />
          
          {dayClasses.map((cls, idx) => {
            const isCurrent = isTodayTab && currentPeriod && currentPeriod.id === cls.id;
            const isPast = isTodayTab && !isCurrent && toMins(cls.period.end) < (currentTime.getHours() * 60 + currentTime.getMinutes());
            
            let opacity = 1;
            if (cls.isFreeSlot || !cls.taking) opacity = 0.5;
            
            return (
              <Box key={cls.id} sx={{ display: 'flex', mb: 1, position: 'relative', zIndex: 1, opacity, transition: 'all 0.3s ease' }}>
                {/* Time Column */}
                <Box sx={{ width: 75, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', pr: 1.5, pt: 0.5 }}>
                  <Typography variant="body2" fontWeight={isCurrent ? 'bold' : 'medium'} color={isCurrent ? 'primary.main' : (isPast ? 'text.secondary' : 'text.primary')} sx={{ whiteSpace: 'nowrap' }}>
                    {formatTime12h(cls.period.start)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                    {formatTime12h(cls.period.end)}
                  </Typography>
                </Box>
                
                {/* Timeline Node */}
                <Box sx={{ 
                  position: 'absolute', left: 80, top: 12, transform: 'translateX(-50%)', 
                  width: isCurrent ? 12 : 8, height: isCurrent ? 12 : 8, 
                  borderRadius: '50%', 
                  bgcolor: isCurrent ? 'primary.main' : (isPast ? 'divider' : 'background.paper'),
                  border: isCurrent ? 'none' : '2px solid',
                  borderColor: isPast ? 'divider' : 'primary.main',
                  boxShadow: isCurrent ? '0 0 10px rgba(var(--mui-palette-primary-mainChannel), 0.8)' : 'none',
                  zIndex: 2,
                  transition: 'all 0.3s ease'
                }} />

                {/* Card Body */}
                <Paper 
                  elevation={isCurrent ? 4 : 0}
                  sx={{ 
                    flex: 1, ml: 3, px: 1.5, py: 1, 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: isCurrent ? 'primary.main' : (cls.isFreeSlot || !cls.taking ? 'divider' : 'transparent'),
                    borderStyle: cls.isFreeSlot || !cls.taking ? 'dashed' : 'solid',
                    bgcolor: isCurrent ? 'primary.container' : 'background.surfaceContainerLow',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {/* Glow bar for current */}
                  {isCurrent && (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, bgcolor: 'primary.main' }} />
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    <Typography variant="body2" fontWeight={isCurrent ? 'bold' : 'medium'} color={isCurrent ? 'primary.onContainer' : 'text.primary'} sx={{ lineHeight: 1.2 }}>
                      {cls.taking ? (cls.name || cls.code) : 'Free Period'}
                    </Typography>
                    
                    {cls.taking && cls.name && !cls.isFreeSlot && !cls.isLunch && (
                      <Typography variant="caption" color={isCurrent ? 'primary.onContainer' : 'text.secondary'} sx={{ opacity: 0.8, fontSize: '0.65rem', mt: 0.25 }}>
                        {cls.code} {cls.room && ` • Room: ${cls.room}`}
                      </Typography>
                    )}

                    {!cls.taking && !cls.isFreeSlot && !cls.isLunch && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.65rem' }}>
                        (Skipping: {cls.name || cls.code})
                      </Typography>
                    )}
                    
                    {/* Lunch / Free slot with Room string if it randomly has one */}
                    {cls.taking && (cls.isFreeSlot || cls.isLunch) && cls.room && (
                      <Typography variant="caption" color={isCurrent ? 'primary.onContainer' : 'text.secondary'} sx={{ opacity: 0.8, fontSize: '0.65rem', mt: 0.25 }}>
                        Room: {cls.room}
                      </Typography>
                    )}

                    {/* Badges */}
                    {(isCurrent || (cls.taking && cls.isLab)) && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                        {isCurrent && <Typography variant="caption" fontWeight="bold" color="primary.main" sx={{ fontSize: '0.6rem', textTransform: 'uppercase' }}>HAPPENING NOW</Typography>}
                        {isCurrent && cls.taking && cls.isLab && <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>•</Typography>}
                        {cls.taking && cls.isLab && <Typography variant="caption" fontWeight="medium" color="secondary.main" sx={{ fontSize: '0.6rem', textTransform: 'uppercase' }}>LAB</Typography>}
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
