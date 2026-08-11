import React, { useState } from 'react';
import { 
  Box, Typography, Button, FormControl, InputLabel, Select, MenuItem,
  Fade, Slide, IconButton, Switch, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useAppStore } from '../store';

export default function SetupWizard({ onClose }) {
  const { data, setBatch, selectedSubjects, isSetupComplete, mode, toggleMode, program, semester, section } = useAppStore();
  
  const [step, setStep] = useState(isSetupComplete ? 3 : 0); 
  const [tempProg, setTempProg] = useState(isSetupComplete ? program : '');
  const [tempSem, setTempSem] = useState(isSetupComplete ? semester : '');
  const [tempSec, setTempSec] = useState(isSetupComplete ? section : '');
  
  const [tempSubjects, setTempSubjects] = useState([]);

  // Initialize tempSubjects when reaching step 3
  React.useEffect(() => {
    if (step === 3 && data) {
      const key = `${tempProg}|${tempSem}|${tempSec}`;
      const batch = data.batches[key];
      if (batch) {
        if (isSetupComplete && tempProg === program && tempSem === semester && tempSec === section) {
          // Editing current batch
          setTempSubjects(selectedSubjects);
        } else {
          // New batch, select all by default
          setTempSubjects(batch.subjects.map(s => s.code));
        }
      }
    }
  }, [step, tempProg, tempSem, tempSec, data, isSetupComplete, program, semester, section, selectedSubjects]);

  if (!data || !data.programs) return null;

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => Math.max(0, s - 1));

  const sems = tempProg ? Object.keys(data.index[tempProg] || {}) : [];
  const secs = tempProg && tempSem ? data.index[tempProg][tempSem] || [] : [];
  
  const toggleTempSubject = (code) => {
    setTempSubjects(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const finishSetup = () => {
    setBatch(tempProg, tempSem, tempSec, tempSubjects);
    if (onClose) onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 0: // Program
        return (
          <Slide direction="left" in={step === 0} mountOnEnter unmountOnExit>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h4" fontWeight={500}>What are you studying?</Typography>
              <Typography color="text.secondary">Select your program to get started.</Typography>
              <FormControl fullWidth variant="filled" sx={{ mt: 2 }}>
                <InputLabel>Program</InputLabel>
                <Select
                  value={tempProg}
                  onChange={(e) => {
                    setTempProg(e.target.value);
                    setTempSem('');
                    setTempSec('');
                  }}
                >
                  {data.programs.map(p => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button 
                variant="contained" 
                size="large" 
                disabled={!tempProg} 
                onClick={handleNext}
                sx={{ mt: 4 }}
              >
                Next
              </Button>
            </Box>
          </Slide>
        );
      case 1: // Semester
        return (
          <Slide direction="left" in={step === 1} mountOnEnter unmountOnExit>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: -1 }}>
                <IconButton onClick={handleBack}><ArrowBackIcon /></IconButton>
                <Typography variant="h4" fontWeight={500}>Semester</Typography>
              </Box>
              <Typography color="text.secondary">Which semester are you in?</Typography>
              <FormControl fullWidth variant="filled" sx={{ mt: 2 }}>
                <InputLabel>Semester</InputLabel>
                <Select
                  value={tempSem}
                  onChange={(e) => {
                    setTempSem(e.target.value);
                    setTempSec('');
                    // Auto-skip section if only 1 section exists
                    const availableSecs = data.index[tempProg][e.target.value] || [];
                    if (availableSecs.length === 1) {
                      setTempSec(availableSecs[0]);
                      setStep(3); // Go straight to electives or finish
                    }
                  }}
                >
                  {sems.map(s => (
                    <MenuItem key={s} value={s}>Semester {s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button 
                variant="contained" 
                size="large" 
                disabled={!tempSem} 
                onClick={handleNext}
                sx={{ mt: 4 }}
              >
                Next
              </Button>
            </Box>
          </Slide>
        );
      case 2: // Section
        return (
          <Slide direction="left" in={step === 2} mountOnEnter unmountOnExit>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: -1 }}>
                <IconButton onClick={handleBack}><ArrowBackIcon /></IconButton>
                <Typography variant="h4" fontWeight={500}>Section</Typography>
              </Box>
              <Typography color="text.secondary">Select your section.</Typography>
              <FormControl fullWidth variant="filled" sx={{ mt: 2 }}>
                <InputLabel>Section</InputLabel>
                <Select
                  value={tempSec}
                  onChange={(e) => setTempSec(e.target.value)}
                >
                  {secs.map(s => (
                    <MenuItem key={s} value={s}>Section {s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button 
                variant="contained" 
                size="large" 
                disabled={!tempSec} 
                onClick={handleNext}
                sx={{ mt: 4 }}
              >
                Next
              </Button>
            </Box>
          </Slide>
        );
      case 3: // Electives (or Finish)
        // Check if there are electives
        const key = `${tempProg}|${tempSem}|${tempSec}`;
        const batch = data.batches[key];
        const hasElectives = batch && batch.subjects && batch.subjects.length > 0;
        
        return (
          <Fade in={step === 3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ml: -1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton onClick={() => {
                    if (isSetupComplete && onClose) onClose();
                    else setStep(secs.length === 1 ? 1 : 2);
                  }}>
                    <ArrowBackIcon />
                  </IconButton>
                  <Typography variant="h4" fontWeight={500}>{isSetupComplete ? 'Settings' : 'Review'}</Typography>
                </Box>
                <IconButton onClick={toggleMode}>
                  {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
              </Box>
              
              <Box sx={{ p: 3, bgcolor: 'background.surfaceContainerLow', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">{tempProg}</Typography>
                  <Typography color="text.secondary">Sem {tempSem} • Sec {tempSec}</Typography>
                </Box>
                {isSetupComplete && (
                  <Button variant="outlined" size="small" onClick={() => setStep(0)}>
                    Change Batch
                  </Button>
                )}
              </Box>

                <Box sx={{ mt: 2, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" gutterBottom>Courses</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Toggle off any electives you aren't taking.
                  </Typography>
                  
                  <TableContainer component={Paper} sx={{ borderRadius: 1, bgcolor: 'background.surfaceContainerLow', mt: 1, overflowY: 'auto', overflowX: 'hidden', flex: 1 }}>
                    <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }} aria-label="courses table">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', width: '80%' }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', width: '20%' }} align="right">Taking?</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {batch.subjects.map((sub) => {
                          const selected = tempSubjects.includes(sub.code);
                          return (
                            <TableRow 
                              key={sub.code}
                              sx={{ 
                                opacity: selected ? 1 : 0.5,
                                '&:last-child td, &:last-child th': { border: 0 }
                              }}
                            >
                              <TableCell sx={{ whiteSpace: 'normal', pr: 1 }}>{sub.name}</TableCell>
                              <TableCell align="right" sx={{ whiteSpace: 'normal' }}>
                                <Switch 
                                  checked={selected}
                                  onChange={() => toggleTempSubject(sub.code)}
                                  color="primary"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

              <Button 
                variant="contained" 
                size="large" 
                onClick={finishSetup}
                sx={{ mt: 'auto', mb: 4 }}
              >
                {isSetupComplete ? 'Save Changes' : "Let's Go!"}
              </Button>
            </Box>
          </Fade>
        );
      default: return null;
    }
  };

  return (
    <Box sx={{ 
      position: 'fixed', inset: 0, zIndex: 1200, 
      bgcolor: 'background.default', 
      display: 'flex', flexDirection: 'column',
      p: 3, pt: 8
    }}>
      {renderStep()}
    </Box>
  );
}
