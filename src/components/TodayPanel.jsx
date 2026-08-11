import React, { useMemo, useState, useEffect } from 'react';
import { 
  Box, Typography, Chip, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow 
} from '@mui/material';
import { useAppStore } from '../store';
import { getTodayDayName, getCurrentPeriod, formatTime12h, getPeriodsForBatch, toMins } from '../utils';
import { useDaySchedule } from '../hooks/useDaySchedule';

export default function TodayPanel() {
  const { currentBatch, selectedSubjects } = useAppStore();
  const dayName = getTodayDayName();
  const todayClasses = useDaySchedule(currentBatch, selectedSubjects, dayName);
  
  const [currentPeriod, setCurrentPeriod] = useState(() => getCurrentPeriod(currentBatch));
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPeriod(getCurrentPeriod(currentBatch));
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [currentBatch]);

  if (!currentBatch) return null;

  if (todayClasses.length === 0) {
    return (
      <Box sx={{ mt: 10, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">No classes today! 🎉</Typography>
      </Box>
    );
  }

  // Calculate next class countdown
  const nextClass = useMemo(() => {
    if (!currentBatch || todayClasses.length === 0) return null;
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    
    // Find the next class that hasn't started yet and we are taking it
    return todayClasses.find(c => {
      if (!c.taking || c.isFreeSlot) return false;
      return toMins(c.period.start) > mins;
    });
  }, [todayClasses, currentTime, currentBatch]);
  
  let countdownStr = '';
  if (nextClass) {
    const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    const startMins = toMins(nextClass.period.start);
    const diff = startMins - nowMins;
    if (diff > 0) {
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      countdownStr = h > 0 ? `${h}h ${m}m until next class` : `${m}m until next class`;
    }
  } else {
    // Check if we are done for today
    const lastClass = [...todayClasses].reverse().find(c => c.taking && !c.isFreeSlot);
    if (lastClass) {
       const endMins = toMins(lastClass.period.end);
       const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
       if (nowMins > endMins) {
         countdownStr = 'Done for today! 🎉';
       }
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      
      {/* Live Clock Header */}
      <Box sx={{ 
        bgcolor: 'background.surfaceContainerHigh', 
        p: 2, 
        borderRadius: 4, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        mb: 1
      }}>
        <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
          Current Time
        </Typography>
        <Typography variant="h3" fontWeight={300} color="primary.main">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
        </Typography>
        {countdownStr && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>
            {countdownStr}
          </Typography>
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative', pt: 2, pb: 4, px: 1 }}>
        {/* The timeline vertical line */}
        <Box sx={{ position: 'absolute', left: 75, top: 0, bottom: 0, width: 2, bgcolor: 'divider', zIndex: 0 }} />
        
        {todayClasses.map((cls, idx) => {
          const isCurrent = currentPeriod && currentPeriod.id === cls.id;
          const isPast = !isCurrent && toMins(cls.period.end) < (currentTime.getHours() * 60 + currentTime.getMinutes());
          
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
    </Box>
  );
}
