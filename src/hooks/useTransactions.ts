import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchScript } from '../common/fetch';
import type { Transaction, RawData } from '../types';

type SyncAction = 'add' | 'edit' | 'delete';

type SyncTask = {
  id: string; // Task ID (random)
  action: SyncAction;
  targetId: string; // The transaction ID
  data?: RawData;
  timestamp: number;
};

export const useTransactions = (scriptUrl: string | null) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('local_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [pendingTasks, setPendingTasks] = useState<SyncTask[]>(() => {
    try {
      const saved = localStorage.getItem('moneybook_pending_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const processingRef = useRef(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('local_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('moneybook_pending_tasks', JSON.stringify(pendingTasks));
  }, [pendingTasks]);

  // Sync Logic
  const processQueue = useCallback(async () => {
    // If running or no tasks, skip
    if (!scriptUrl || pendingTasks.length === 0 || processingRef.current) return;

    processingRef.current = true;
    setIsSyncing(true);
    
    // Snapshot tasks to sync
    const tasksToSync = [...pendingTasks];
    const completedTaskIds: string[] = [];

    try {
      // Group tasks by action
      const addTasks = tasksToSync.filter(t => t.action === 'add');
      const editTasks = tasksToSync.filter(t => t.action === 'edit');
      const deleteTasks = tasksToSync.filter(t => t.action === 'delete');

      // 1. Batch Add
      if (addTasks.length > 0) {
        try {
          const payload = addTasks.map(t => t.data);
          await fetchScript(scriptUrl, 'POST', payload);
          completedTaskIds.push(...addTasks.map(t => t.id));
        } catch (e) {
          console.error("Batch add failed", e);
        }
      }

      // 2. Individual Edits
      if (editTasks.length > 0) {
        await Promise.all(editTasks.map(async (task) => {
          try {
            if (!task.data) return;
            const url = scriptUrl.includes('?') ? `${scriptUrl}&method=UPDATE` : `${scriptUrl}?method=UPDATE`;
            await fetchScript(url, 'POST', task.data);
            completedTaskIds.push(task.id);
          } catch (e) {
            console.error(`Edit failed for task ${task.id}`, e);
          }
        }));
      }

      // 3. Individual Deletes
      if (deleteTasks.length > 0) {
        await Promise.all(deleteTasks.map(async (task) => {
          try {
            const url = scriptUrl.includes('?') ? `${scriptUrl}&method=DELETE` : `${scriptUrl}?method=DELETE`;
            await fetchScript(url, 'POST', { id: task.targetId });
            completedTaskIds.push(task.id);
          } catch (e) {
            console.error(`Delete failed for task ${task.id}`, e);
          }
        }));
      }

      // Update state based on results
      setPendingTasks(prev => prev.filter(t => !completedTaskIds.includes(t.id)));
      
      const syncedTargetIds = tasksToSync.filter(t => completedTaskIds.includes(t.id)).map(t => t.targetId);
      const failedTargetIds = tasksToSync.filter(t => !completedTaskIds.includes(t.id)).map(t => t.targetId);

      setTransactions(prev => prev.map(t => {
        if (syncedTargetIds.includes(t.id)) return { ...t, syncStatus: 'synced' };
        if (failedTargetIds.includes(t.id)) return { ...t, syncStatus: 'error' };
        return t;
      }));

    } catch (e) {
      console.error("Sync process critical error", e);
    } finally {
      processingRef.current = false;
      setIsSyncing(false);
    }
  }, [scriptUrl, pendingTasks]); 

  // Periodic Sync / Auto Sync
  useEffect(() => {
    // Attempt sync on mount if there are pending tasks
    if (pendingTasks.length > 0 && !processingRef.current) {
        processQueue();
    }

    const interval = setInterval(() => {
        if (pendingTasks.length > 0 && !processingRef.current) {
            processQueue();
        }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [pendingTasks.length, processQueue]);


  // Actions
  const addTransaction = useCallback(async (data: Omit<Transaction, 'id' | 'updated_at' | 'syncStatus'> & { created_at?: string }) => {
    const newTx: Transaction = {
      ...data,
      id: crypto.randomUUID(),
      created_at: data.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      syncStatus: 'pending'
    };

    setTransactions(prev => [newTx, ...prev]);

    const rawData: RawData = {
        id: newTx.id,
        name: newTx.name,
        price: newTx.price,
        description: newTx.description || '',
        tags: newTx.tags.join(','),
        created_at: newTx.created_at,
        updated_at: newTx.updated_at
    };

    const task: SyncTask = {
        id: crypto.randomUUID(),
        action: 'add',
        targetId: newTx.id,
        data: rawData,
        timestamp: Date.now()
    };

    setPendingTasks(prev => [...prev, task]);
    return newTx.id;
  }, []);

  const updateTransaction = useCallback(async (id: string, data: Partial<Omit<Transaction, 'id' | 'syncStatus'>>) => {
    // Access latest transactions state inside the updater
    setTransactions(currentTransactions => {
        const index = currentTransactions.findIndex(t => t.id === id);
        if (index === -1) return currentTransactions;

        const currentTx = currentTransactions[index];
        const updatedTx = { ...currentTx, ...data, updated_at: new Date().toISOString(), syncStatus: 'pending' as const };
        
        const newTransactions = [...currentTransactions];
        newTransactions[index] = updatedTx;

        // Side effect: Queue the task
        // We do this by scheduling a state update for pendingTasks immediately
        const rawData: RawData = {
            id: updatedTx.id,
            name: updatedTx.name,
            price: updatedTx.price,
            description: updatedTx.description || '',
            tags: updatedTx.tags.join(','),
            created_at: updatedTx.created_at,
            updated_at: updatedTx.updated_at
        };

        const task: SyncTask = {
            id: crypto.randomUUID(),
            action: 'edit',
            targetId: id,
            data: rawData,
            timestamp: Date.now()
        };
        
        // We must update the queue. 
        // Note: calling setPendingTasks inside setTransactions callback is safe in React 18+ batching, 
        // but to be clean/safe we can do it outside or use a ref for the queue if we wanted complex logic.
        // Here we just queue the state update.
        setTimeout(() => {
          setPendingTasks(prevQueue => [...prevQueue, task]);
        }, 0);

        return newTransactions;
    });

  }, []);

  const removeTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    
    const task: SyncTask = {
        id: crypto.randomUUID(),
        action: 'delete',
        targetId: id,
        timestamp: Date.now()
    };
    setPendingTasks(prev => [...prev, task]);
  }, []);

  const syncFromCloud = useCallback(async () => {
    if (!scriptUrl) return;
    try {
      // Try to push pending changes first
      await processQueue();

      const cloudData = await fetchScript(scriptUrl);
      const syncedTransactions: Transaction[] = cloudData.map(d => ({
        ...d,
        syncStatus: 'synced'
      }));
      
      setTransactions(prev => {
          const pendingMap = new Map();
          // Keep current pending items
          prev.forEach(t => {
              if (t.syncStatus === 'pending' || t.syncStatus === 'error') {
                  pendingMap.set(t.id, t);
              }
          });

          const merged = [...syncedTransactions];
          // Re-apply pending local versions on top of cloud versions
          pendingMap.forEach((val, key) => {
              const idx = merged.findIndex(t => t.id === key);
              if (idx >= 0) {
                  merged[idx] = val;
              } else {
                  // Pending create
                  merged.unshift(val);
              }
          });
          
          return merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      });

    } catch(e) {
      console.error("Sync failed", e);
    }
  }, [scriptUrl, processQueue]);

  return {
    transactions,
    addTransaction,
    removeTransaction,
    updateTransaction,
    syncFromCloud,
    pushPendingChanges: processQueue,
    pendingTaskCount: pendingTasks.length,
    isSyncing
  };
};
