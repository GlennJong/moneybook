import { useState, useEffect, useMemo } from "react";
import type { Transaction } from "../../types";
import MonthPicker from "./MonthPicker";
import SwipeableItem from "../../components/SwipeableItem";

interface ListScreenProps {
  transactions: Transaction[];
  removeTransaction: (id: string) => void;
  syncFromCloud: () => void;
  onEdit: (tx: Transaction) => void;
}

const ListScreen = ({ transactions, removeTransaction, syncFromCloud, onEdit }: ListScreenProps) => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Derived state
  const uniqueTags = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.flatMap(t => t.tags || []).filter(Boolean).forEach(tag => {
      counts[tag] = (counts[tag] || 0) + 1;
    });

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);

    const maxTags = Number(localStorage.getItem('moneybook_max_tags') || 10);
    return maxTags > 0 ? sorted.slice(0, maxTags) : sorted;
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let data = transactions;
    if (selectedTag) {
      data = data.filter(t => t.tags?.includes(selectedTag));
    }
    // Sort by date asc (Oldest to Newest)
    return [...data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [selectedTag, transactions]);

  const totalAmount = useMemo(() => 
    filteredTransactions.reduce((sum, t) => sum + t.price, 0),
  [filteredTransactions]);

  // Group by month
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, { total: number, items: Transaction[] }> = {};
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.created_at);
      const key = date.toLocaleString('default', { year: 'numeric', month: 'long' }); // e.g., "February 2026"
      
      if (!groups[key]) {
        groups[key] = { total: 0, items: [] };
      }
      groups[key].items.push(t);
      groups[key].total += t.price;
    });
    
    return groups;
  }, [filteredTransactions]);

  // Initial sync
  useEffect(() => {
    syncFromCloud();
  }, [syncFromCloud]);

  // Scroll to bottom on mount
  useEffect(() => {
    // Use timeout to ensure DOM is ready
    setTimeout(() => {
      const container = document.getElementById('main-scroll-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 0);
  }, []); // Only run on mount

  const scrollToMonth = (month: string) => {
    setIsMonthPickerOpen(false);
    const element = document.getElementById(`month-${month}`);
    const container = document.getElementById('main-scroll-container');
    
    if (element && container) {
      const headerOffset = 60; 
      // Calculate position relative to container
      const elementRelativeTop = element.getBoundingClientRect().top - container.getBoundingClientRect().top;
      const currentScroll = container.scrollTop;
      
      container.scrollTo({
        top: currentScroll + elementRelativeTop - headerOffset,
        behavior: "smooth"
      });
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <MonthPicker 
        isOpen={isMonthPickerOpen}
        onClose={() => setIsMonthPickerOpen(false)}
        months={Object.keys(groupedTransactions)}
        onSelect={scrollToMonth}
      />

      <div style={{ textAlign: 'center', fontSize: '1.2em', marginBottom: '20px', fontWeight: 'bold' }}>
        Total: ${totalAmount.toLocaleString()}
      </div>
      
      <div className="filter-section" style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setSelectedTag(null)}
          style={{ 
            backgroundColor: selectedTag === null ? '#007bff' : '#f0f0f0',
            color: selectedTag === null ? 'white' : 'black',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '15px',
            cursor: 'pointer'
          }}
        >
          All
        </button>
        {uniqueTags.map(tag => (
          <button 
            key={tag}
            onClick={() => setSelectedTag(tag)}
            style={{ 
              backgroundColor: selectedTag === tag ? '#007bff' : '#f0f0f0',
              color: selectedTag === tag ? 'white' : 'black',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '15px',
              cursor: 'pointer'
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="transaction-list">
        {Object.entries(groupedTransactions).map(([month, data]) => (
          <div key={month} id={`month-${month}`} style={{ marginBottom: '30px', scrollMarginTop: '60px' }}>
            <div 
              onClick={() => !isMobile && setIsMonthPickerOpen(true)}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '8px',
                marginBottom: '10px',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0 }}>{month}</h3>
                <span style={{ fontSize: '0.8em', color: '#666' }}>▼</span>
              </div>
              <span style={{ fontWeight: 'bold' }}>${data.total.toLocaleString()}</span>
              
              {isMobile && (
                <select
                  value={month}
                  onChange={(e) => scrollToMonth(e.target.value)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                >
                  {Object.keys(groupedTransactions).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )}
            </div>
            
            {data.items.map(tx => (
              <SwipeableItem
                key={tx.id}
                onDelete={() => removeTransaction(tx.id)}
                onClick={() => onEdit(tx)}
              >
                <div 
                  style={{ 
                    padding: '10px', 
                    borderBottom: '1px solid #eee',
                    display: 'flex', 
                    justifyContent: 'space-between',
                    opacity: tx.syncStatus === 'pending' ? 0.7 : 1,
                    cursor: 'pointer' 
                  }}
                >
                  <div>
                    <small style={{ color: '#999' }}>
                      {(() => {
                        const d = new Date(tx.created_at);
                        return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                      })()}
                      {tx.syncStatus === 'pending' && <span style={{ color: 'orange', marginLeft: '5px' }}> (Syncing...)</span>}
                      {tx.syncStatus === 'error' && <span style={{ color: 'red', marginLeft: '5px' }}> (Failed to modify)</span>}
                    </small>
                    <br />
                    <div>
                      <strong>{tx.name}</strong> - ${tx.price}
                      <div>
                        <small style={{ color: '#666' }}>{tx.tags.join(', ')}</small>
                      </div>
                    </div>
                  </div>
                </div>
              </SwipeableItem>
            ))}
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>
            No transactions found.
          </div>
        )}
      </div>
    </div>
  );
}

export default ListScreen;
