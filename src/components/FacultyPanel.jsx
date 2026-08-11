import React, { useMemo, useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton,
  Avatar, Badge, List, ListItem, ListItemButton, Divider
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
      width: 44,
      height: 44,
      fontWeight: 'bold',
      fontSize: '1.1rem'
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'fadeIn 0.2s ease-in', p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton edge="start" onClick={onBack} sx={{ ml: -1 }}><ArrowBackIcon /></IconButton>
        <Typography variant="h5" fontWeight={600}>{facultyName}</Typography>
      </Box>

      <Typography variant="subtitle2" gutterBottom color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1.5 }}>
        {currentDayStr}'s Schedule
      </Typography>

      <Paper 
        elevation={0} 
        variant="outlined" 
        sx={{ 
          borderRadius: 2, 
          overflow: 'hidden', 
          bgcolor: 'background.paper',
          display: 'flex', 
          flexDirection: 'column', 
          flex: 1
        }}
      >
        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <List disablePadding>
            {dynamicPeriods.map((period, index) => {
              const slot = daySchedule.find(s => s.periodIndex === index);
              const isCurrent = index === currentPeriodIdx;
              const isPast = index < currentPeriodIdx;
              const parsed = slot ? parseSlotText(slot.text) : null;
              
              return (
                <React.Fragment key={index}>
                  <ListItem 
                    sx={{ 
                      py: 2.5,
                      px: 3,
                      opacity: isPast ? 0.5 : 1,
                      bgcolor: isCurrent ? 'primary.container' : 'transparent',
                      borderLeft: isCurrent ? 4 : 0,
                      borderColor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3
                    }}
                  >
                    <Box sx={{ minWidth: 85, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="caption" component="div" color={isCurrent ? 'primary.onContainer' : 'text.secondary'} fontWeight={isCurrent ? 'bold' : 'normal'}>
                        {formatTime12h(period.start)}
                      </Typography>
                      <Typography variant="caption" component="div" color={isCurrent ? 'primary.onContainer' : 'text.secondary'} fontWeight={isCurrent ? 'bold' : 'normal'}>
                        {formatTime12h(period.end)}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {slot ? (
                        <>
                          <Typography variant="body1" fontWeight={isCurrent ? 'bold' : '600'} color={isCurrent ? 'primary.onContainer' : 'text.primary'}>
                            {parsed ? parsed.code : slot.text} 
                          </Typography>
                          <Typography variant="caption" color={isCurrent ? 'primary.onContainer' : 'text.secondary'} sx={{ mt: 0.5, display: 'block' }}>
                            Batch: {slot.batch.replace(/\|/g, ' ')}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body1" color="text.secondary" fontStyle="italic">
                          Free
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ textAlign: 'right', minWidth: 80 }}>
                      <Typography variant="body2" fontWeight="600" color={isCurrent ? 'primary.onContainer' : 'text.primary'}>
                        {slot ? (parsed ? parsed.room : '-') : '-'}
                      </Typography>
                    </Box>
                  </ListItem>
                  {index < dynamicPeriods.length - 1 && <Divider component="li" />}
                </React.Fragment>
              );
            })}
          </List>
        </Box>
      </Paper>
    </Box>
  );
}

function FacultyListItem({ facultyName, subjectCode, subjectName, data, now, currentBatch, isSkipped, onClick }) {
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
    <ListItemButton
      onClick={onClick}
      sx={{ 
        py: 1.5, 
        px: 2,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        opacity: isSkipped ? 0.5 : 1,
        bgcolor: isSkipped ? 'action.hover' : 'transparent',
        transition: 'background-color 0.2s',
        '&:hover': {
          bgcolor: 'action.selected'
        }
      }}
    >
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant="dot"
        sx={{
          mt: 0.5,
          '& .MuiBadge-badge': {
            backgroundColor: status === 'Free' ? '#4caf50' : '#f44336', 
            color: status === 'Free' ? '#4caf50' : '#f44336',
            boxShadow: `0 0 0 2px var(--mui-palette-background-paper)`,
            minWidth: 10,
            height: 10,
            borderRadius: '50%',
          },
        }}
      >
        <Avatar {...stringAvatar(facultyName)} />
      </Badge>

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Typography variant="body1" fontWeight="600" noWrap>
          {facultyName}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ fontWeight: 600, color: 'var(--mui-palette-text-primary)' }}>{subjectCode}</span>
          <span style={{ opacity: 0.8 }}>{subjectName}</span>
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Chip 
            label={statusText} 
            size="small" 
            color={status === 'Free' ? 'success' : 'error'} 
            variant={status === 'Free' ? 'outlined' : 'filled'}
            sx={{ fontWeight: '600', height: 20, fontSize: '0.65rem' }}
          />
          {isSkipped && (
            <Chip size="small" label="Skipped" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
          )}
        </Box>
      </Box>

      <Box sx={{ textAlign: 'right', flexShrink: 0, pt: 0.5 }}>
        {nextFreeText && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
            {nextFreeText}
          </Typography>
        )}
      </Box>
    </ListItemButton>
  );
}

export default function FacultyPanel() {
  const { currentBatch, selectedSubjects, data } = useAppStore();
  const [now, setNow] = useState(new Date());
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000); 
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

  // We iterate over all subjects, skipping only those that don't have a faculty listed
  const allSubjectsWithFaculty = currentBatch.subjects.filter(sub => sub.faculty);

  // Flatten out so each faculty has an entry, even if a subject has multiple faculties
  const facultyEntries = [];
  allSubjectsWithFaculty.forEach(sub => {
    const isSkipped = !selectedSubjects.includes(sub.code);
    const faculties = sub.faculty.split(',').map(f => f.trim()).filter(Boolean);
    
    faculties.forEach(facultyName => {
      facultyEntries.push({
        facultyName,
        subjectCode: sub.code,
        subjectName: sub.name,
        isSkipped
      });
    });
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', px: 1, py: 2, animation: 'fadeIn 0.2s ease-in' }}>
      <Paper 
        elevation={0} 
        variant="outlined" 
        sx={{ 
          borderRadius: 2, 
          overflow: 'hidden', 
          bgcolor: 'background.paper',
          mx: 1 
        }}
      >
        <List disablePadding>
          {facultyEntries.map((entry, index) => (
            <React.Fragment key={`${entry.subjectCode}-${index}`}>
              <FacultyListItem 
                facultyName={entry.facultyName} 
                subjectCode={entry.subjectCode}
                subjectName={entry.subjectName}
                data={data}
                now={now}
                currentBatch={currentBatch}
                isSkipped={entry.isSkipped}
                onClick={() => setSelectedFaculty(entry.facultyName)}
              />
              {index < facultyEntries.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
