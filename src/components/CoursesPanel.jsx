import React from 'react';
import { 
  Box, Typography, Paper, List, ListItem, Divider, Chip, Stack 
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { useAppStore } from '../store';

export default function CoursesPanel() {
  const { currentBatch, selectedSubjects } = useAppStore();

  if (!currentBatch) return null;

  // Helper to parse L-T-P-C into an array of chips if possible
  const renderLTPC = (ltpeStr) => {
    if (!ltpeStr || ltpeStr === '-') return null;
    
    const parts = ltpeStr.split('-');
    if (parts.length >= 3) {
      return (
        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
          {parts[0] !== '0' && <Chip size="small" label={`L:${parts[0]}`} sx={{ height: 18, fontSize: '0.65rem' }} />}
          {parts[1] !== '0' && <Chip size="small" label={`T:${parts[1]}`} sx={{ height: 18, fontSize: '0.65rem' }} />}
          {parts[2] !== '0' && <Chip size="small" label={`P:${parts[2]}`} sx={{ height: 18, fontSize: '0.65rem' }} />}
          {parts[3] && parts[3] !== '0' && <Chip size="small" color="primary" variant="outlined" label={`C:${parts[3]}`} sx={{ height: 18, fontSize: '0.65rem' }} />}
        </Stack>
      );
    }
    
    return (
      <Chip size="small" label={ltpeStr} sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }} />
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', px: 1, py: 2 }}>
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
          {currentBatch.subjects.map((sub, index) => {
            const isSelected = selectedSubjects.includes(sub.code);
            const isLast = index === currentBatch.subjects.length - 1;

            return (
              <React.Fragment key={sub.code}>
                <ListItem 
                  sx={{ 
                    py: 1.5, 
                    px: 2,
                    opacity: isSelected ? 1 : 0.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    bgcolor: isSelected ? 'transparent' : 'action.hover'
                  }}
                >
                  <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600, 
                          lineHeight: 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {sub.name}
                      </Typography>
                      
                      {sub.faculty && sub.faculty !== '-' && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <PersonIcon sx={{ fontSize: 14 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {sub.faculty}
                          </span>
                        </Typography>
                      )}
                    </Box>

                    {/* Right side: Code and optional skipped tag */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, bgcolor: 'action.selected', px: 1, py: 0.25, borderRadius: 1 }}>
                        {sub.code}
                      </Typography>
                      {!isSelected && (
                        <Typography variant="caption" color="error" sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
                          Skipped
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {renderLTPC(sub.ltpe)}
                </ListItem>
                {!isLast && <Divider component="li" />}
              </React.Fragment>
            );
          })}
        </List>
      </Paper>
    </Box>
  );
}
