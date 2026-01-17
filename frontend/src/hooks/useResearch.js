import { useState, useEffect, useRef, useCallback } from 'react';
import { getWebSocketUrl, getApiBaseUrl } from '../api/research';

const STORAGE_KEY = 'scholarflow_session';
const HISTORY_KEY = 'scholarflow_history';
const MAX_HISTORY = 10;
const POLL_INTERVAL = 10000;

export function useResearch() {
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingSessionId, setPollingSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [activities, setActivities] = useState([]);
  
  const wsRef = useRef(null);
  const hasRestoredRef = useRef(false);

  // ============================================
  // Storage Functions
  // ============================================

  const saveToStorage = useCallback((sessionData) => {
    if (sessionData) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      } catch (e) {}
    }
  }, []);

  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }, []);

  // ============================================
  // History Functions
  // ============================================

  const loadHistory = useCallback(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }, []);

  const saveHistory = useCallback((historyData) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(historyData));
    } catch (e) {}
  }, []);

  const addToHistory = useCallback((sessionData) => {
    if (!sessionData?.session_id || sessionData.status !== 'completed' || !sessionData.report) return;
    
    setHistory(prev => {
      if (prev.some(s => s.session_id === sessionData.session_id)) return prev;
      
      const newHistory = [
        {
          session_id: sessionData.session_id,
          original_query: sessionData.original_query || 'Research',
          status: sessionData.status,
          report: sessionData.report,
          documents: sessionData.documents || [],
          timestamp: Date.now()
        },
        ...prev
      ].slice(0, MAX_HISTORY);
      
      saveHistory(newHistory);
      return newHistory;
    });
  }, [saveHistory]);

  const loadSessionFromHistory = useCallback((sessionId) => {
    const historyItem = history.find(s => s.session_id === sessionId);
    if (historyItem) {
      setSession(historyItem);
      saveToStorage(historyItem);
      setActivities([{ action: 'completed', message: 'Loaded from history', timestamp: Date.now() }]);
      setError(null);
      setIsLoading(false);
      setIsPolling(false);
      setPollingSessionId(null);
    }
  }, [history, saveToStorage]);

  const clearHistoryFn = useCallback(() => {
    setHistory([]);
    setSession(null);
    clearStorage();
    setActivities([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (e) {}
  }, [clearStorage]);

  // ============================================
  // Polling via useEffect (reactive approach)
  // ============================================

  // This effect runs the polling interval
  useEffect(() => {
    if (!pollingSessionId) {
      console.log('[Polling] No session ID, not starting interval');
      return;
    }

    console.log('[Polling] Starting interval for:', pollingSessionId);
    let consecutiveErrors = 0;
    const MAX_ERRORS = 3;
    
    const fetchSession = async () => {
      try {
        console.log('[Polling] Fetching...');
        const response = await fetch(`${getApiBaseUrl()}/api/session/${pollingSessionId}`);
        
        if (!response.ok) {
          consecutiveErrors++;
          console.log('[Polling] Response not OK:', response.status, `(${consecutiveErrors}/${MAX_ERRORS})`);
          
          if (response.status === 404 || response.status >= 500 || consecutiveErrors >= MAX_ERRORS) {
            console.log('[Polling] Session lost or too many errors. Stopping.');
            setError('Session lost or server unavailable. Please start a new research session.');
            setIsPolling(false);
            setIsLoading(false);
            setPollingSessionId(null);
            clearStorage();
            setSession(null);
          }
          return;
        }
        
        // Reset error counter on success
        consecutiveErrors = 0;
        
        const data = await response.json();
        console.log('[Polling] Got:', data.status, '| Report:', !!data.report);
        
        // Update session
        const updatedSession = {
          session_id: data.session_id,
          status: data.status,
          report: data.report,
          plan: data.plan || [],
          current_task_index: data.current_task_index || 0,
          documents: data.documents || [],
          original_query: data.original_query || ''
        };
        
        setSession(updatedSession);
        saveToStorage(updatedSession);
        
        // Update activity
        if (data.status === 'completed' && data.report) {
          console.log('[Polling] ✓ COMPLETE! Stopping poll.');
          setActivities(prev => [...prev, {
            action: 'completed',
            message: 'Research complete!',
            timestamp: Date.now()
          }]);
          setIsPolling(false);
          setIsLoading(false);
          setPollingSessionId(null); // This will stop the interval
          addToHistory(updatedSession);
        } else {
          // Show what's happening
          const taskIdx = data.current_task_index || 0;
          const totalTasks = data.plan?.length || 0;
          const currentQuestion = data.plan?.[taskIdx] || '';
          
          setActivities(prev => {
            const filtered = prev.filter(a => a.action !== 'polling');
            return [...filtered, {
              action: 'polling',
              message: `${data.status === 'writing' ? 'Writing report...' : `Researching question ${taskIdx + 1}/${totalTasks}`}`,
              detail: currentQuestion.substring(0, 60) + (currentQuestion.length > 60 ? '...' : ''),
              timestamp: Date.now()
            }];
          });
        }
      } catch (e) {
        consecutiveErrors++;
        console.error('[Polling] Network error:', e.message, `(${consecutiveErrors}/${MAX_ERRORS})`);
        
        if (consecutiveErrors >= MAX_ERRORS) {
          console.log('[Polling] Too many network errors. Stopping.');
          setError('Cannot reach server. Please check your connection or try again later.');
          setIsPolling(false);
          setIsLoading(false);
          setPollingSessionId(null);
        }
      }
    };

    // Fetch immediately
    fetchSession();
    
    // Then set interval
    const intervalId = setInterval(fetchSession, POLL_INTERVAL);
    console.log('[Polling] Interval started:', intervalId);
    
    // Cleanup
    return () => {
      console.log('[Polling] Clearing interval:', intervalId);
      clearInterval(intervalId);
    };
  }, [pollingSessionId, saveToStorage, addToHistory]);

  // ============================================
  // Start/Stop Polling Functions
  // ============================================

  const startPolling = useCallback((sessionId) => {
    console.log('▶ Start polling for:', sessionId);
    setPollingSessionId(sessionId);
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    console.log('■ Stop polling');
    setPollingSessionId(null);
    setIsPolling(false);
  }, []);

  // ============================================
  // Restore on Mount
  // ============================================

  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    setHistory(loadHistory());

    const stored = loadFromStorage();
    if (stored?.session_id) {
      console.log('Restoring session:', stored.session_id, stored.status);
      setSession(stored);
      
      if (stored.status === 'completed' && stored.report) {
        setActivities([{ action: 'completed', message: 'Report ready', timestamp: Date.now() }]);
        return;
      }
      
      setIsLoading(true);
      setActivities([{ 
        action: 'polling', 
        message: 'Session restored - checking for updates...', 
        timestamp: Date.now() 
      }]);
      startPolling(stored.session_id);
    }
  }, [loadFromStorage, loadHistory, startPolling]);

  // ============================================
  // Activity Feed Helper
  // ============================================

  const addActivity = useCallback((action, message, detail = null) => {
    setActivities(prev => [...prev.slice(-20), { action, message, detail, timestamp: Date.now() }]);
  }, []);

  // ============================================
  // Start Research
  // ============================================

  const startResearch = useCallback((query) => {
    if (session?.status === 'completed' && session?.report) {
      addToHistory(session);
    }
    
    stopPolling();
    setIsLoading(true);
    setError(null);
    setSession(null);
    setActivities([]);
    clearStorage();

    if (wsRef.current) wsRef.current.close();

    addActivity('connecting', 'Connecting...');

    const ws = new WebSocket(getWebSocketUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      addActivity('connected', 'Connected');
      ws.send(JSON.stringify({ action: 'start', query }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'started':
            addActivity('started', 'Research started');
            setSession({
              session_id: data.session_id,
              status: 'planning',
              plan: [],
              current_task_index: 0,
              documents: [],
              original_query: query
            });
            saveToStorage({
              session_id: data.session_id,
              status: 'planning',
              original_query: query
            });
            break;

          case 'progress':
            setSession(prev => {
              const updated = {
                ...prev,
                status: data.status,
                plan: data.plan || prev?.plan || [],
                current_task_index: data.current_task_index ?? prev?.current_task_index ?? 0,
                documents: data.documents || prev?.documents || []
              };
              saveToStorage(updated);
              return updated;
            });

            const taskIdx = data.current_task_index ?? 0;
            const plan = data.plan || [];
            
            if (data.node === 'planner') {
              addActivity('planning', 'Plan created', `${plan.length} questions`);
            } else if (data.node === 'researcher') {
              addActivity('researching', `Question ${taskIdx + 1}/${plan.length}`, plan[taskIdx]?.substring(0, 50));
            } else if (data.node === 'writer') {
              addActivity('writing', 'Writing report...');
            }
            break;

          case 'completed':
            addActivity('completed', 'Research complete!');
            const completed = {
              ...session,
              status: 'completed',
              report: data.report,
              documents: data.documents || session?.documents || []
            };
            setSession(completed);
            saveToStorage(completed);
            addToHistory(completed);
            setIsLoading(false);
            ws.close();
            break;

          case 'error':
            addActivity('error', 'Error', data.message);
            setError(data.message);
            setIsLoading(false);
            ws.close();
            break;
        }
      } catch (e) {
        console.error('Parse error:', e);
      }
    };

    ws.onerror = () => {
      addActivity('error', 'Connection failed');
      setError('Connection failed');
      setIsLoading(false);
    };

    ws.onclose = () => {
      const current = loadFromStorage();
      if (current?.session_id && current.status !== 'completed') {
        console.log('WS closed, starting poll...');
        addActivity('polling', 'Connection lost, polling...');
        startPolling(current.session_id);
      }
    };
  }, [addActivity, clearStorage, saveToStorage, stopPolling, startPolling, loadFromStorage, session, addToHistory]);

  // ============================================
  // Clear Session
  // ============================================

  const clearSession = useCallback(() => {
    if (session?.status === 'completed' && session?.report) {
      addToHistory(session);
    }
    stopPolling();
    if (wsRef.current) wsRef.current.close();
    setSession(null);
    setError(null);
    setActivities([]);
    setIsLoading(false);
    clearStorage();
  }, [clearStorage, stopPolling, session, addToHistory]);

  // ============================================
  // Downloads
  // ============================================

  const downloadMarkdown = useCallback(() => {
    if (!session?.report) return;
    const blob = new Blob([session.report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${session.session_id?.substring(0, 8) || 'research'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [session]);

  const downloadPDF = useCallback(async () => {
    if (!session?.session_id) return;
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/session/${session.session_id}/pdf`);
      if (!response.ok) throw new Error('PDF generation failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${session.session_id.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError('PDF download failed');
    }
  }, [session]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return {
    session,
    history,
    isLoading,
    isPolling,
    error,
    activities,
    startResearch,
    clearSession,
    loadSessionFromHistory,
    clearHistory: clearHistoryFn,
    downloadMarkdown,
    downloadPDF,
  };
}
