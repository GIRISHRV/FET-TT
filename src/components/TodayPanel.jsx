import React, { useMemo, useState, useEffect } from 'react';
import { 
  Box, Typography, Chip, Paper, LinearProgress
} from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WbCloudyIcon from '@mui/icons-material/WbCloudy';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import { useAppStore } from '../store';
import { getTodayDayName, getCurrentPeriod, formatTime12h, getPeriodsForBatch, toMins } from '../utils';
import { useDaySchedule } from '../hooks/useDaySchedule';

function getHeaderGradient(hour) {
  if (hour >= 5 && hour < 12) {
    // Morning (Orange to warm gold/brown)
    return 'linear-gradient(135deg, #ef6905 0%, #b8860b 100%)'; 
  } else if (hour >= 12 && hour < 17) {
    // Afternoon (Burgundy to Orange)
    return 'linear-gradient(135deg, #8b2626 0%, #ef6905 100%)';
  } else {
    // Evening/Night (Forest Green to Burgundy)
    return 'linear-gradient(135deg, #486c2f 0%, #8b2626 100%)';
  }
}

function HeaderBackgroundIcon({ hour }) {
  let Icon;
  if (hour >= 5 && hour < 12) {
    Icon = WbSunnyIcon;
  } else if (hour >= 12 && hour < 17) {
    Icon = WbSunnyIcon; // Afternoon sun
  } else {
    Icon = NightsStayIcon;
  }

  return (
    <Icon 
      sx={{ 
        position: 'absolute', 
        right: '-10%', 
        bottom: '-20%', 
        fontSize: '200px', 
        opacity: 0.15,
        transform: 'rotate(-15deg)'
      }} 
    />
  );
}

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
  let isUpNext = false;

  const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();

  if (nextClass) {
    const startMins = toMins(nextClass.period.start);
    const diff = startMins - nowMins;
    if (diff > 0) {
      if (diff <= 15) {
        isUpNext = true;
        countdownStr = `Starts in ${diff}m`;
      } else {
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        countdownStr = h > 0 ? `${h}h ${m}m until next class` : `${m}m until next class`;
      }
    }
  } else {
    // Check if we are done for today
    const lastClass = [...todayClasses].reverse().find(c => c.taking && !c.isFreeSlot);
    if (lastClass) {
       const endMins = toMins(lastClass.period.end);
       if (nowMins > endMins) {
         countdownStr = 'Done for today! 🎉';
       }
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      
      {/* Live Clock / Hero Header */}
      <Box sx={{ 
        background: getHeaderGradient(currentTime.getHours()),
        color: '#ffffff',
        p: 4, 
        borderRadius: '24px', 
        mx: 1,
        mt: 1,
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        mb: 2,
        boxShadow: '0 8px 32px rgba(239, 105, 5, 0.15)',
        position: 'relative',
        overflow: 'hidden',
        '@keyframes shadowPulse': {
          '0%': { boxShadow: '0 8px 32px rgba(239, 105, 5, 0.15)' },
          '100%': { boxShadow: '0 8px 32px rgba(239, 105, 5, 0.4)' }
        },
        animation: 'shadowPulse 3s infinite alternate ease-in-out'
      }}>
        {/* Subtle overlay for contrast */}
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.1)' }} />
        
        {/* Background Graphic */}
        <HeaderBackgroundIcon hour={currentTime.getHours()} />

        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {isUpNext ? (
            <>
              <Typography variant="body2" sx={{ textTransform: 'uppercase', letterSpacing: 2, opacity: 0.9, mb: 1, fontWeight: 'bold' }}>
                Up Next
              </Typography>
              <Typography variant="h4" fontWeight={800} textAlign="center" sx={{ lineHeight: 1.2 }}>
                {nextClass.name || nextClass.code}
              </Typography>
              {nextClass.room && (
                <Typography variant="subtitle1" sx={{ mt: 0.5, fontWeight: 500, opacity: 0.95 }}>
                  Room {nextClass.room.replace(/ Room$/i, '')}
                </Typography>
              )}
              <Chip 
                label={countdownStr} 
                sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 'bold' }} 
              />
            </>
          ) : (
            <>
              <Typography variant="body2" sx={{ textTransform: 'uppercase', letterSpacing: 1, opacity: 0.9, fontWeight: 500 }}>
                Current Time
              </Typography>
              <Typography variant="h2" fontWeight={800} sx={{ mt: 1, letterSpacing: '-1px', textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </Typography>
              {countdownStr && (
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 500, opacity: 0.9 }}>
                  {countdownStr}
                </Typography>
              )}
            </>
          )}
        </Box>
      </Box>

      <Box sx={{ flex: 1, position: 'relative', pt: 1, pb: 4, px: 1 }}>
        {/* The timeline vertical line */}
        <Box sx={{ position: 'absolute', left: 75, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, transparent, rgba(239,105,5,0.7) 15%, rgba(239,105,5,0.7) 85%, transparent)', boxShadow: '0 0 8px rgba(239,105,5,0.4)', zIndex: 0 }} />
        
        {todayClasses.map((cls, idx) => {
          const isCurrent = currentPeriod && currentPeriod.id === cls.id;
          const isPast = !isCurrent && toMins(cls.period.end) < nowMins;
          
          let opacity = 1;
          if (cls.isFreeSlot || !cls.taking) opacity = 0.5;

          let progressPercent = 0;
          if (isCurrent) {
            const startMins = toMins(cls.period.start);
            const endMins = toMins(cls.period.end);
            const total = endMins - startMins;
            const elapsed = nowMins - startMins;
            progressPercent = Math.min(100, Math.max(0, (elapsed / total) * 100));
          }
          
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
                position: 'absolute', left: 76, top: 12, transform: 'translateX(-50%)', 
                width: isCurrent ? 16 : 12, height: isCurrent ? 16 : 12, 
                borderRadius: '50%', 
                bgcolor: 'background.default',
                border: isCurrent ? '4px solid' : '2px solid',
                borderColor: isPast ? 'divider' : 'primary.main',
                boxShadow: isCurrent ? '0 0 12px rgba(239,105,5,0.8), inset 0 0 4px rgba(239,105,5,0.4)' : 'none',
                zIndex: 2,
                transition: 'all 0.3s ease'
              }} />

              {/* Card Body */}
              <Paper 
                elevation={isCurrent ? 4 : 0}
                sx={{ 
                  flex: 1, ml: 3, px: 1.5, py: 1.5, 
                  borderRadius: 2,
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
                  <Typography variant="body1" fontWeight={isCurrent ? 'bold' : '600'} color={isCurrent ? 'primary.main' : 'text.primary'} sx={{ lineHeight: 1.2 }}>
                    {cls.taking ? (cls.name || cls.code) : 'Free Period'}
                  </Typography>
                  
                  {cls.taking && cls.name && !cls.isFreeSlot && !cls.isLunch && (
                    <Typography variant="caption" color={isCurrent ? 'primary.main' : 'text.secondary'} sx={{ opacity: 0.8, mt: 0.5 }}>
                      {cls.code} {cls.room && ` • Room ${cls.room.replace(/ Room$/i, '')}`}
                    </Typography>
                  )}

                  {!cls.taking && !cls.isFreeSlot && !cls.isLunch && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                      (Skipping: {cls.name || cls.code})
                    </Typography>
                  )}
                  
                  {/* Lunch / Free slot with Room string if it randomly has one */}
                  {cls.taking && (cls.isFreeSlot || cls.isLunch) && cls.room && (
                    <Typography variant="caption" color={isCurrent ? 'primary.main' : 'text.secondary'} sx={{ opacity: 0.8, mt: 0.5 }}>
                      Room {cls.room.replace(/ Room$/i, '')}
                    </Typography>
                  )}

                  {/* Badges */}
                  {(isCurrent || (cls.taking && cls.isLab)) && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                      {isCurrent && <Typography variant="caption" fontWeight="bold" color="primary.main" sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>HAPPENING NOW</Typography>}
                      {isCurrent && cls.taking && cls.isLab && <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>•</Typography>}
                      {cls.taking && cls.isLab && <Typography variant="caption" fontWeight="bold" color="secondary.main" sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>LAB</Typography>}
                    </Box>
                  )}

                  {/* Progress Bar for Current Class */}
                  {isCurrent && (
                    <Box sx={{ mt: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="primary.main" fontWeight="600">Progress</Typography>
                        <Typography variant="caption" color="primary.main" fontWeight="bold">{Math.round(progressPercent)}%</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={progressPercent} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          bgcolor: 'rgba(var(--mui-palette-primary-mainChannel), 0.2)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                          }
                        }} 
                      />
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
