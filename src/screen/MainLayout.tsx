import { useState } from "react";
import type { Transaction } from "../types";
import ListScreen from "./ListScreen";
import DiscoverScreen from "./DiscoverScreen";
import CreateScreen from "./CreateScreen";
import ConfigScreen from "./ConfigScreen";
import TodayScreen from "./TodayScreen";
import BottomNav from "../components/BottomNav";
import { useTransactions } from "../hooks/useTransactions";
import TransactionForm from '../components/TransactionForm';

export type Tab = 'list' | 'create' | 'discover' | 'config' | 'today';

const MainLayout = () => {
  const [currentTab, setCurrentTab] = useState<Tab>('list');
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
      <div id="main-scroll-container" style={{ flex: 1, overflowY: 'auto', paddingBottom: '70px' }}>
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
          />
        )}
        {currentTab === 'create' && (
          <CreateScreen 
            transactions={transactions}
            onSubmit={async (data) => {
                 await addTransaction(data);
                 setCurrentTab('list'); // Navigate back after adding
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
      </div>
      
      {/* Edit Overlay */}
      {editingTransaction && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#f5f5f5',
          zIndex: 2000,
          overflowY: 'auto',
          padding: '20px'
        }}>
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
          bottom: '70px',
          right: '20px',
          backgroundColor: isSyncing ? '#0d6efd' : '#ffc107',
          color: isSyncing ? 'white' : 'black',
          padding: '8px 12px',
          borderRadius: '20px',
          fontSize: '0.8em',
          fontWeight: 'bold',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
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
