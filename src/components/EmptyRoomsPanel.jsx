import React, { useState, useMemo } from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemIcon, Divider, Chip, ToggleButton, ToggleButtonGroup, Stack, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import { useAppStore } from '../store';
import { getTodayDayName, getCurrentPeriod } from '../utils';

export default function EmptyRoomsPanel() {
  const { masterRoomSchedule, currentBatch } = useAppStore();
  
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = getTodayDayName();
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(today) ? today : 'Mon';
  });
  
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const p = getCurrentPeriod(currentBatch);
    return p ? p.periodStr : '1';
  });

  const emptyRooms = useMemo(() => {
    if (!masterRoomSchedule) return [];
    const rooms = [];
    
    Object.keys(masterRoomSchedule).forEach(roomName => {
      const daySchedule = masterRoomSchedule[roomName][selectedDay];
      if (!daySchedule || !daySchedule[selectedPeriod]) {
        rooms.push(roomName);
      }
    });
    
    return rooms.sort();
  }, [masterRoomSchedule, selectedDay, selectedPeriod]);

  if (!masterRoomSchedule || !currentBatch) return null;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const periods = Object.entries(currentBatch.periodLabels || {});

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ px: 2, pt: 2, pb: 1, position: 'sticky', top: '64px', bgcolor: 'background.default', zIndex: 10 }}>
        
        <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel>Day</InputLabel>
            <Select
              value={selectedDay}
              label="Day"
              onChange={(e) => setSelectedDay(e.target.value)}
              sx={{ borderRadius: 2, bgcolor: 'background.paper' }}
            >
              {days.map(day => (
                <MenuItem key={day} value={day} sx={{ fontWeight: 500 }}>{day}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ flex: 1.5 }}>
            <InputLabel>Time Slot</InputLabel>
            <Select
              value={selectedPeriod}
              label="Time Slot"
              onChange={(e) => setSelectedPeriod(e.target.value)}
              sx={{ borderRadius: 2, bgcolor: 'background.paper' }}
            >
              {periods.map(([p, label]) => {
                const timeStr = label.match(/\((.*?)\)/)?.[1] || '';
                return (
                  <MenuItem key={p} value={p} sx={{ fontWeight: 500 }}>
                    P{p} • {timeStr}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Stack>

        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 0, fontWeight: 600 }}>
          {emptyRooms.length} Rooms Available
        </Typography>
      </Box>

      {/* Room List */}
      <List sx={{ px: 1 }}>
        {emptyRooms.map((room, index) => (
          <React.Fragment key={room}>
            <ListItem sx={{ py: 1.5, px: 2, bgcolor: 'background.paper', borderRadius: 2, mb: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <MeetingRoomIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary={<Typography variant="body1" fontWeight={600}>{room}</Typography>}
              />
              <Chip size="small" label="Free" color="success" sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600 }} />
            </ListItem>
          </React.Fragment>
        ))}
      </List>
      
      {emptyRooms.length === 0 && (
        <Box sx={{ mt: 5, textAlign: 'center' }}>
          <Typography color="text.secondary">No empty rooms found for this period.</Typography>
        </Box>
      )}
    </Box>
  );
}
