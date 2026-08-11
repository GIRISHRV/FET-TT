import React, { useMemo, useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Button, IconButton,
  Avatar, Badge
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useAppStore } from '../store';
import { formatTime12h, getTodayDayName, parseSlotText, getPeriodsForBatch, toMins } from '../utils';

function stringToColor(string) {
  let hash = 0;
  let i;
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}

function stringAvatar(name) {
  let initials = name[0] || 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1 && parts[1][0]) {
    initials = `${parts[0][0]}${parts[1][0]}`;
  }
  return {
    sx: {
      bgcolor: stringToColor(name),
      width: 48,
      height: 48,
      fontWeight: 'bold',
      fontSize: '1.2rem'
    },
    children: initials.toUpperCase(),
  };
}


function getFacultyGlobalSchedule(data, facultyName) {
  const schedule = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] };
  const lowerName = facultyName.toLowerCase();
  
  for (const batchKey in data.batches) {
    const batch = data.batches[batchKey];
    if (!batch.grid || !batch.subjects) continue;
    
    // Find all subject codes in this batch taught by this faculty
    const facultySubjects = batch.subjects.filter(sub => 
      sub.faculty && sub.faculty.toLowerCase().includes(lowerName)
    ).map(sub => sub.code);
    
    if (facultySubjects.length === 0) continue;
    
    for (const day in batch.grid) {
      if (!schedule[day]) schedule[day] = [];
      
      const daySlots = batch.grid[day];
      for (const periodKey in daySlots) {
        const slotData = daySlots[periodKey];
        if (!slotData || !slotData.text) continue;
        
        const parsed = parseSlotText(slotData.text);
        if (parsed && parsed.code) {
          // The slot code usually looks like "C17A". We check if it starts with the subject code
          // and is NOT immediately followed by another digit (so C1 doesn't match C18).
          const matches = facultySubjects.some(subCode => {
            const regex = new RegExp(`^${subCode}(?![0-9])`, 'i');
            return regex.test(parsed.code);
          });
          
          if (matches) {
            schedule[day].push({
              periodIndex: parseInt(periodKey, 10) - 1, // 0-indexed for dynamicPeriods array
              text: slotData.text,
              batch: batchKey
            });
          }
        }
      }
    }
  }
  
  // Sort the schedule periods for each day
  for (const day in schedule) {
    schedule[day].sort((a, b) => a.periodIndex - b.periodIndex);
  }
  
  return schedule;
}

function FacultyDetailsView({ facultyName, data, now, currentBatch, onBack }) {
  const schedule = useMemo(() => getFacultyGlobalSchedule(data, facultyName), [data, facultyName]);
  
  const currentDayStr = getTodayDayName();
  const daySchedule = schedule[currentDayStr] || [];
  
  const currentMins = now.getHours() * 60 + now.getMinutes();
  
  const dynamicPeriods = getPeriodsForBatch(currentBatch);
  const currentPeriodIdx = dynamicPeriods.findIndex(p => toMins(p.start) <= currentMins && toMins(p.end) >= currentMins);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', animation: 'fadeIn 0.2s ease-in' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: -1 }}>
        <IconButton onClick={onBack}><ArrowBackIcon /></IconButton>
        <Typography variant="h5" fontWeight={500}>{facultyName}</Typography>
      </Box>

      <Paper sx={{ p: 2, bgcolor: 'background.surfaceContainerLow', borderRadius: 2, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Typography variant="subtitle2" gutterBottom color="text.secondary" sx={{ textTransform: 'uppercase', flexShrink: 0 }}>
          {currentDayStr}'s Schedule (Across College)
        </Typography>
        
        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <Table size="small" aria-label="faculty-schedule" sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableBody>
              {dynamicPeriods.map((period, index) => {
                const slot = daySchedule.find(s => s.periodIndex === index);
                const isCurrent = index === currentPeriodIdx;
                const parsed = slot ? parseSlotText(slot.text) : null;
                
                return (
                  <TableRow 
                    key={index} 
                    sx={{ 
                      opacity: index < currentPeriodIdx ? 0.5 : 1,
                      bgcolor: isCurrent ? 'primary.container' : 'transparent',
                      borderLeft: isCurrent ? 4 : 0,
                      borderColor: 'primary.main'
                    }}
                  >
                    <TableCell sx={{ pl: isCurrent ? 1 : 0, borderBottom: 'none', width: '35%' }}>
                      <Typography variant="caption" color={isCurrent ? 'primary.onContainer' : 'text.secondary'} fontWeight={isCurrent ? 'bold' : 'normal'} display="block">
                        {formatTime12h(period.start)} - {formatTime12h(period.end)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: 'none', width: '40%', whiteSpace: 'normal', pr: 1 }}>
                      {slot ? (
                        <>
                          <Typography variant="body2" fontWeight={isCurrent ? 'bold' : 'normal'} color={isCurrent ? 'primary.onContainer' : 'text.primary'}>
                            {parsed ? parsed.code : slot.text} 
                          </Typography>
                          <Typography variant="caption" color={isCurrent ? 'primary.onContainer' : 'text.secondary'} display="block">
                            Batch: {slot.batch.replace(/\|/g, ' ')}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                          Free
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ pr: 0, borderBottom: 'none', textAlign: 'right', width: '25%', whiteSpace: 'normal' }}>
                      <Typography variant="body2" color={isCurrent ? 'primary.onContainer' : 'text.primary'}>
                        {slot ? (parsed ? parsed.room : '-') : '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Box>
  );
}

function FacultyCard({ facultyName, subjectCode, subjectName, data, now, currentBatch, onClick }) {
  const schedule = useMemo(() => getFacultyGlobalSchedule(data, facultyName), [data, facultyName]);
  
  const currentDayStr = getTodayDayName();
  const daySchedule = schedule[currentDayStr] || [];
  
  const currentMins = now.getHours() * 60 + now.getMinutes();
  
  const dynamicPeriods = getPeriodsForBatch(currentBatch);
  const currentPeriodIdx = dynamicPeriods.findIndex(p => toMins(p.start) <= currentMins && toMins(p.end) >= currentMins);
  
  let status = 'Free';
  let statusText = 'Free right now';
  
  if (currentPeriodIdx !== -1) {
    const busySlot = daySchedule.find(s => s.periodIndex === currentPeriodIdx);
    if (busySlot) {
      status = 'Busy';
      const parsed = parseSlotText(busySlot.text);
      statusText = `Busy in ${parsed?.room || 'Class'}`;
    }
  }
  
  let nextFreeText = 'Free rest of day';
  if (status === 'Busy') {
    for (let i = currentPeriodIdx + 1; i < dynamicPeriods.length; i++) {
      const busy = daySchedule.find(s => s.periodIndex === i);
      if (!busy) {
        nextFreeText = `Free next at ${formatTime12h(dynamicPeriods[i].start)}`;
        break;
      }
    }
  } else {
    // If free now, when is next class?
    let nextClassIdx = -1;
    for (let i = Math.max(0, currentPeriodIdx + 1); i < dynamicPeriods.length; i++) {
      const busy = daySchedule.find(s => s.periodIndex === i);
      if (busy) {
        nextClassIdx = i;
        break;
      }
    }
    if (nextClassIdx !== -1) {
      nextFreeText = `Busy next at ${formatTime12h(dynamicPeriods[nextClassIdx].start)}`;
    }
  }

  return (
    <Paper 
      elevation={0}
      onClick={onClick}
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        p: 2, 
        mb: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.surfaceContainerLow',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          bgcolor: 'action.hover',
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
          boxShadow: 2
        }
      }}
    >
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant="dot"
        sx={{
          '& .MuiBadge-badge': {
            backgroundColor: status === 'Free' ? '#4caf50' : '#f44336', // Success/Error colors
            color: status === 'Free' ? '#4caf50' : '#f44336',
            boxShadow: `0 0 0 2px var(--mui-palette-background-paper)`,
            minWidth: 12,
            height: 12,
            borderRadius: '50%',
            '&::after': {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              animation: status === 'Free' ? 'ripple 1.2s infinite ease-in-out' : 'none',
              border: '1px solid currentColor',
              content: '""',
            },
          },
          '@keyframes ripple': {
            '0%': { transform: 'scale(.8)', opacity: 1 },
            '100%': { transform: 'scale(2.4)', opacity: 0 },
          },
        }}
      >
        <Avatar {...stringAvatar(facultyName)} />
      </Badge>

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Typography variant="body1" fontWeight="bold" noWrap>
          {facultyName}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {subjectCode} • {subjectName}
        </Typography>
      </Box>

      <Box sx={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
        <Chip 
          label={statusText} 
          size="small" 
          color={status === 'Free' ? 'success' : 'error'} 
          variant={status === 'Free' ? 'outlined' : 'filled'}
          sx={{ fontWeight: 'bold', height: 20, fontSize: '0.7rem' }}
        />
        {nextFreeText && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            {nextFreeText}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

export default function FacultyPanel() {
  const { currentBatch, selectedSubjects, data } = useAppStore();
  const [now, setNow] = useState(new Date());
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000); // 30 seconds
    return () => clearInterval(timer);
  }, []);

  if (!currentBatch) return null;

  if (selectedFaculty) {
    return (
      <FacultyDetailsView 
        facultyName={selectedFaculty}
        data={data}
        now={now}
        currentBatch={currentBatch}
        onBack={() => setSelectedFaculty(null)}
      />
    );
  }

  // Since type metadata is missing, we consider all subjects in the batch.
  // We can filter to only show faculties of subjects the user is actually taking.
  const activeSubjects = currentBatch.subjects.filter(sub => selectedSubjects.includes(sub.code));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', animation: 'fadeIn 0.2s ease-in' }}>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
        Your faculty members for this semester. Click on a faculty to view their schedule.
      </Typography>

      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: 0.5, pb: 2 }}>
        {activeSubjects.map((sub) => {
          if (!sub.faculty) return null;
          
          const faculties = sub.faculty.split(',').map(f => f.trim()).filter(Boolean);
          
          return faculties.map((facultyName, idx) => (
            <FacultyCard 
              key={`${sub.code}-${idx}`} 
              facultyName={facultyName} 
              subjectCode={sub.code}
              subjectName={sub.name}
              data={data}
              now={now}
              currentBatch={currentBatch}
              onClick={() => setSelectedFaculty(facultyName)}
            />
          ));
        })}
      </Box>
    </Box>
  );
}
