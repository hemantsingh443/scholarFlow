import { useState, useEffect, useRef, useCallback } from 'react';
import { getWebSocketUrl } from '../api/research';

/**
 * Custom hook for managing research with WebSocket real-time updates.
 */
export function useResearch() {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activities, setActivities] = useState([]);
  const wsRef = useRef(null);

  /**
   * Add activity to the feed
   */
  const addActivity = useCallback((action, message, detail = null) => {
    setActivities(prev => [...prev.slice(-20), { 
      action, 
      message, 
      detail, 
      timestamp: Date.now() 
    }]);
  }, []);

  /**
   * Start a new research session via WebSocket.
   */
  const startResearch = useCallback((query) => {
    setIsLoading(true);
    setError(null);
    setSession(null);
    setActivities([]);

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    addActivity('connecting', 'Connecting to research server...');

    // Create WebSocket connection
    const ws = new WebSocket(getWebSocketUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      addActivity('connected', 'Connected. Starting research...');
      // Send the start command
      ws.send(JSON.stringify({
        action: 'start',
        query: query
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'started':
            addActivity('started', 'Research session started');
            setSession({
              session_id: data.session_id,
              status: 'planning',
              plan: [],
              current_task_index: 0,
              documents: [],
              logs: []
            });
            break;

          case 'progress':
            // Update session with progress
            setSession(prev => ({
              ...prev,
              status: data.status,
              plan: data.plan || prev?.plan || [],
              current_task_index: data.current_task_index ?? prev?.current_task_index ?? 0,
              documents: data.documents || prev?.documents || [],
              logs: data.logs || prev?.logs || []
            }));

            // Add activity based on node
            const taskIdx = data.current_task_index ?? 0;
            const plan = data.plan || [];
            
            if (data.node === 'planner') {
              addActivity('planning', 'Research plan created', 
                `${plan.length} questions to investigate`);
            } else if (data.node === 'researcher') {
              addActivity('researching', 
                `Investigating question ${taskIdx + 1}/${plan.length}`,
                plan[taskIdx]?.substring(0, 60));
            } else if (data.node === 'writer') {
              addActivity('writing', 'Synthesizing research report...');
            }
            
            // Add activity for new documents
            if (data.documents && data.documents.length > 0) {
              const latestDoc = data.documents[data.documents.length - 1];
              if (latestDoc?.title) {
                addActivity('paper_done', 'Paper analyzed', 
                  latestDoc.title.substring(0, 50));
              }
            }
            break;

          case 'completed':
            addActivity('completed', 'Research complete!', 'Report generated');
            setSession(prev => ({
              ...prev,
              status: 'completed',
              report: data.report,
              documents: data.documents || prev?.documents || []
            }));
            setIsLoading(false);
            ws.close();
            break;

          case 'error':
            addActivity('error', 'Error occurred', data.message);
            setError(data.message);
            setIsLoading(false);
            ws.close();
            break;

          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      addActivity('error', 'Connection error');
      setError('WebSocket connection failed');
      setIsLoading(false);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      if (isLoading) {
        // Unexpected close
        setIsLoading(false);
      }
    };
  }, [addActivity, isLoading]);

  /**
   * Clear the current session.
   */
  const clearSession = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setSession(null);
    setError(null);
    setActivities([]);
    setIsLoading(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    session,
    isLoading,
    error,
    activities,
    startResearch,
    clearSession,
  };
}
