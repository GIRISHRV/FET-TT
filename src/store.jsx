import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [data, setData] = useState(() => {
    const cached = localStorage.getItem('qb_data_cache');
    return cached ? JSON.parse(cached) : null;
  });
  const [fetchError, setFetchError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // User selections
  const [program, setProgram] = useState(() => localStorage.getItem('qb_program') || null);
  const [semester, setSemester] = useState(() => localStorage.getItem('qb_semester') || null);
  const [section, setSection] = useState(() => localStorage.getItem('qb_section') || null);
  const [batchKey, setBatchKey] = useState(() => localStorage.getItem('qb_batch') || null);
  
  // Selected electives (subject codes)
  const [selectedSubjects, setSelectedSubjects] = useState(() => {
    const saved = localStorage.getItem('qb_batch_subjects');
    return saved ? JSON.parse(saved) : [];
  });

  // UI State
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('qb_theme_mode');
    if (savedMode) return savedMode;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Persist selections to localStorage
  useEffect(() => {
    if (program) localStorage.setItem('qb_program', program);
    if (semester) localStorage.setItem('qb_semester', semester);
    if (section) localStorage.setItem('qb_section', section);
    if (batchKey) localStorage.setItem('qb_batch', batchKey);
    localStorage.setItem('qb_batch_subjects', JSON.stringify(selectedSubjects));
    localStorage.setItem('qb_theme_mode', mode);
  }, [program, semester, section, batchKey, selectedSubjects, mode]);

  const syncData = async () => {
    setIsSyncing(true);
    try {
      // Fetch our own data.json with a cache-buster to ensure we get the absolute latest
      // bypassing the service worker or browser cache.
      // Use import.meta.env.BASE_URL so this works cleanly on GitHub Pages subdirectories
      const baseUrl = import.meta.env.BASE_URL || '/';
      const url = `${baseUrl}data.json?t=${Date.now()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch latest data.json");
      
      const parsed = await response.json();
      
      setData(parsed);
      setFetchError(null);
      localStorage.setItem('qb_data_cache', JSON.stringify(parsed));
      return true;
    } catch (e) {
      console.error("Sync failed:", e);
      setFetchError(e.message);
      throw e;
    } finally {
      setIsSyncing(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    syncData().catch(console.error);
  }, []);

  const toggleMode = () => setMode(prev => prev === 'light' ? 'dark' : 'light');

  const setBatch = (prog, sem, sec, subjects = null) => {
    setProgram(prog);
    setSemester(sem);
    setSection(sec);
    const key = `${prog}|${sem}|${sec}`;
    setBatchKey(key);
    
    if (subjects) {
      setSelectedSubjects(subjects);
    } else if (data && data.batches[key]) {
      // Auto-select all electives by default if no subjects provided
      const allSubjects = data.batches[key].subjects.map(s => s.code);
      setSelectedSubjects(allSubjects);
    } else {
      setSelectedSubjects([]);
    }
  };
  
  const toggleSubject = (code) => {
    setSelectedSubjects(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const isSetupComplete = !!batchKey;
  
  const currentBatch = useMemo(() => {
    return data && batchKey ? data.batches[batchKey] : null;
  }, [data, batchKey]);

  const masterRoomSchedule = useMemo(() => {
    if (!data || !data.batches) return null;
    const rooms = {};
    
    Object.values(data.batches).forEach(batch => {
      if (!batch.grid) return;
      Object.entries(batch.grid).forEach(([day, periods]) => {
        Object.entries(periods).forEach(([p, cls]) => {
          const classes = Array.isArray(cls) ? cls : [cls];
          classes.forEach(c => {
            if (['class', 'lab', 'sametime', 'lab-continue'].includes(c.type) && c.text) {
              const match = c.text.match(/ in (.+)$/);
              if (match) {
                const roomName = match[1].trim();
                if (!rooms[roomName]) rooms[roomName] = {};
                if (!rooms[roomName][day]) rooms[roomName][day] = {};
                rooms[roomName][day][p] = {
                  text: c.text,
                  type: c.type,
                  batch: batch.title || `${batch.program} ${batch.semester}${batch.section}`
                };
              }
            }
          });
        });
      });
    });
    
    return rooms;
  }, [data]);

  const value = {
    data,
    mode,
    toggleMode,
    program,
    semester,
    section,
    batchKey,
    setBatch,
    selectedSubjects,
    toggleSubject,
    isSetupComplete,
    currentBatch,
    masterRoomSchedule,
    fetchError,
    syncData,
    isSyncing
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppStore = () => useContext(AppContext);
