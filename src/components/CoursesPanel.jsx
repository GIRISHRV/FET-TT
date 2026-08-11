import React from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { useAppStore } from '../store';

export default function CoursesPanel() {
  const { currentBatch, selectedSubjects } = useAppStore();

  if (!currentBatch) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
        Your courses for this semester. You can edit your electives in Settings.
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 1, bgcolor: 'background.surfaceContainerLow', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }} aria-label="courses table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '18%' }}>L-T-P-C</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '27%' }}>Faculty</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentBatch.subjects.map((sub) => {
              // Since type metadata is missing, all subjects are togglable
              const isSelected = selectedSubjects.includes(sub.code);

              return (
                <TableRow 
                  key={sub.code}
                  sx={{ 
                    opacity: isSelected ? 1 : 0.5,
                    '&:last-child td, &:last-child th': { border: 0 }
                  }}
                >
                  <TableCell sx={{ whiteSpace: 'normal', pr: 1 }}>{sub.code}</TableCell>
                  <TableCell sx={{ whiteSpace: 'normal', pr: 1 }}>{sub.name}</TableCell>
                  <TableCell sx={{ whiteSpace: 'normal', pr: 1 }}>{sub.ltpe || '-'}</TableCell>
                  <TableCell sx={{ whiteSpace: 'normal', pr: 1 }}>{sub.faculty || '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
