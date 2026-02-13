import { useState, useLayoutEffect, useRef, lazy, Suspense } from "react";
import type { Transaction } from "../types";
import TodayScreen from "./TodayScreen";
import BottomNav from "../components/BottomNav";
import { useTransactions } from "../hooks/useTransactions";

const TransactionForm = lazy(() => import('../components/TransactionForm'));
const ListScreen = lazy(() => import("./ListScreen"));
const DiscoverScreen = lazy(() => import("./DiscoverScreen"));
const CreateScreen = lazy(() => import("./CreateScreen"));
const ConfigScreen = lazy(() => import("./ConfigScreen"));

export type Tab = 'list' | 'create' | 'discover' | 'config' | 'today';

const MainLayout = () => {
  const [currentTab, setCurrentTab] = useState<Tab>('today');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentTab]);

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const scriptUrl = localStorage.getItem('vibe_script_url');
  const { 
    transactions, 
    addTransaction, 
    removeTransaction, 
    updateTransaction, 
    syncFromCloud,
    pushPendingChanges,
    isSyncing,
    pendingTaskCount
  } = useTransactions(scriptUrl);

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    // setCurrentTab('create'); // No longer navigation
  };

  const handleTabChange = (tab: Tab) => {
    if (tab === 'create') {
      setEditingTransaction(null);
    }
    setCurrentTab(tab);
  };

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden' // Prevent outer scroll
    }}>
      <div 
        ref={scrollContainerRef}
        id="main-scroll-container" 
        style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
      >
        <Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <span className="spinner" style={{ width: '24px', height: '24px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
          </div>
        }>
          {currentTab === 'list' && (
            <ListScreen 
              transactions={transactions}
              removeTransaction={removeTransaction}
              syncFromCloud={syncFromCloud}
              onEdit={handleEdit}
            />
          )}
          {currentTab === 'today' && (
            <TodayScreen 
              transactions={transactions}
              removeTransaction={removeTransaction}
              onEdit={handleEdit}
              highlightedId={highlightedId}
            />
          )}
          {currentTab === 'create' && (
            <CreateScreen 
              transactions={transactions}
              onSubmit={async (data) => {
                  const newId = await addTransaction(data);
                  setHighlightedId(newId);
                  setCurrentTab('today'); // Navigate back after adding
                  setTimeout(() => setHighlightedId(null), 3000);
              }} 
            />
          )}
          {currentTab === 'discover' && <DiscoverScreen transactions={transactions} />}
          {currentTab === 'config' && (
            <ConfigScreen 
              onSync={pushPendingChanges}
              isSyncing={isSyncing}
              pendingCount={pendingTaskCount}
            />
          )}
        </Suspense>
      </div>
      
      {/* Edit Overlay */}
      {editingTransaction && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'var(--bg-main)',
          zIndex: 2000,
          overflowY: 'auto',
          padding: '20px'
        }}>
          <Suspense fallback={<div>Loading form...</div>}>
            <h1>Edit Transaction</h1>
            <TransactionForm
                transactions={transactions}
                initialData={editingTransaction}
                onCancel={() => setEditingTransaction(null)}
                onSubmit={async (data) => {
                    await updateTransaction(editingTransaction.id, data);
                    setEditingTransaction(null);
                }}
            />
          </Suspense>
        </div>
      )}

      <BottomNav 
        currentTab={currentTab} 
        onTabChange={handleTabChange} 
      />

      {/* Sync Status Indicator */}
      {(isSyncing || pendingTaskCount > 0) && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom))',
          right: '20px',
          backgroundColor: isSyncing ? 'var(--primary)' : 'var(--warning)',
          color: isSyncing ? 'var(--text-inv)' : 'var(--text-main)',
          padding: '8px 12px',
          borderRadius: '20px',
          fontSize: '0.8em',
          fontWeight: 'bold',
          boxShadow: '0 2px 5px var(--shadow-color)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          {isSyncing ? (
             <>
               <span className="spinner" style={{ width: '10px', height: '10px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
               Syncing...
               <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
             </>
          ) : (
             <span>{pendingTaskCount} pending</span>
          )}
        </div>
      )}
    </div>
  );
};

export default MainLayout;
