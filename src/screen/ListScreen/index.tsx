import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
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
  const [showBigPurchaseOnly, setShowBigPurchaseOnly] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (!container) return;

    // Initialize lastScrollY to current scroll position to prevent initial jump
    lastScrollY.current = container.scrollTop;

    const handleScroll = () => {
      const currentScrollY = container.scrollTop;
      
      // iOS Style: 
      // Scrolling DOWN (viewing lower content) -> Header/Footer hides to show more content.
      // Scrolling UP (viewing higher content) -> Header/Footer shows.
      // "Slide from bottom to top" gesture = Scrolling DOWN.
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setShowToolbar(false);
      } else {
        setShowToolbar(true);
      }
      lastScrollY.current = currentScrollY;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
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
    
    if (showBigPurchaseOnly) {
      const threshold = Number(localStorage.getItem('moneybook_big_purchase_threshold') || 1000);
      data = data.filter(t => t.price >= threshold);
    }

    // Sort by date asc (Oldest to Newest)
    return [...data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [selectedTag, transactions, showBigPurchaseOnly]);

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
  useLayoutEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
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

  const scrollToBottom = () => {
    const container = document.getElementById('main-scroll-container');
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
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
      
      {/* Floating Toolbar */}
      <div 
        style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom))', // Above bottom nav
          left: '20px',
          right: '20px',
          backgroundColor: 'var(--bg-card)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '10px 15px',
          boxShadow: '0 4px 15px var(--shadow-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          zIndex: 900,
          transform: showToolbar ? 'translateY(0)' : 'translateY(150%)',
          transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* Big Purchase Toggle */}
        <button 
          onClick={() => setShowBigPurchaseOnly(!showBigPurchaseOnly)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            backgroundColor: showBigPurchaseOnly ? 'var(--primary-bg-subtle)' : 'transparent',
            color: showBigPurchaseOnly ? 'var(--primary)' : 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
            flexShrink: 0
          }}
          title={`Show Big Purchases Only (>= $${Number(localStorage.getItem('moneybook_big_purchase_threshold') || 1000)})`}
        >
          <span className="material-icons">{showBigPurchaseOnly ? 'savings' : 'attach_money'}</span>
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', flexShrink: 0 }}></div>
        
        {/* Scroll To Bottom */}
        <button 
          onClick={scrollToBottom}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
            flexShrink: 0
          }}
          title="Scroll to Bottom"
        >
          <span className="material-icons">arrow_downward</span>
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', flexShrink: 0 }}></div>

        {/* Tags Scroll View */}
        <div style={{ 
          display: 'flex', 
          overflowX: 'auto', 
          gap: '8px', 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          paddingRight: '10px',
          alignItems: 'center'
        }}>
          <style dangerouslySetInnerHTML={{__html: `
            ::-webkit-scrollbar { display: none; }
          `}} />
          
          <button 
            onClick={() => setSelectedTag(null)}
            style={{ 
              backgroundColor: selectedTag === null ? 'var(--primary)' : 'var(--bg-item)',
              color: selectedTag === null ? 'var(--text-inv)' : 'var(--text-main)',
              border: selectedTag === null ? 'none' : '1px solid var(--border-color)',
              padding: '6px 12px',
              borderRadius: '20px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: '0.9rem',
              fontWeight: 500,
              flexShrink: 0
            }}
          >
            All
          </button>
          
          {uniqueTags.map(tag => (
            <button 
              key={tag}
              onClick={() => setSelectedTag(tag)}
              style={{ 
                backgroundColor: selectedTag === tag ? 'var(--primary)' : 'var(--bg-item)',
                color: selectedTag === tag ? 'var(--text-inv)' : 'var(--text-main)',
                border: selectedTag === tag ? 'none' : '1px solid var(--border-color)',
                padding: '6px 12px',
                borderRadius: '20px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontSize: '0.9rem',
                fontWeight: 500,
                flexShrink: 0
              }}
            >
              {tag}
            </button>
          ))}
        </div>
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
                backgroundColor: 'var(--bg-card)',
                padding: '10px',
                borderRadius: '8px',
                marginBottom: '10px',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                boxShadow: '0 4px 6px -1px var(--shadow-color)',
                cursor: 'pointer',
                border: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0 }}>{month}</h3>
                <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>▼</span>
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
            
            {(() => {
              const dayGroups: { dateStr: string, date: Date, items: Transaction[], total: number }[] = [];
              let currentGroup: typeof dayGroups[0] | null = null;

              data.items.forEach(tx => {
                  const d = new Date(tx.created_at);
                  const dateStr = d.toDateString();

                  if (!currentGroup || currentGroup.dateStr !== dateStr) {
                      currentGroup = { dateStr, date: d, items: [], total: 0 };
                      dayGroups.push(currentGroup);
                  }
                  currentGroup.items.push(tx);
                  currentGroup.total += tx.price;
              });

              return dayGroups.map(group => (
                <div key={group.dateStr} style={{ marginBottom: '10px' }}>
                  <div style={{ 
                      padding: '8px 4px', 
                      backgroundColor: 'var(--bg-main)', // Transparent-ish or main bg
                      fontSize: '0.9em',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid var(--border-color)',
                      fontWeight: 'bold'
                  }}>
                      <span>{group.date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', weekday: 'short' })}</span>
                      <span>${group.total.toLocaleString()}</span>
                  </div>
                  
                  {group.items.map(tx => (
                    <SwipeableItem
                      key={tx.id}
                      onDelete={() => removeTransaction(tx.id)}
                      onClick={() => onEdit(tx)}
                    >
                      <div 
                        style={{ 
                          padding: '12px 10px', 
                          borderBottom: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-item)', // Ensure items have background
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          opacity: tx.syncStatus === 'pending' ? 0.7 : 1,
                          cursor: 'pointer' 
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-main)' }}>{tx.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            {tx.tags.join(', ')}
                            {tx.syncStatus === 'pending' && <span style={{ color: 'var(--warning)', marginLeft: '5px' }}>●</span>}
                            {tx.syncStatus === 'error' && <span style={{ color: 'var(--danger)', marginLeft: '5px' }}>!</span>}
                          </div>
                        </div>
                        <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>
                           ${tx.price.toLocaleString()}
                        </div>
                      </div>
                    </SwipeableItem>
                  ))}
                </div>
              ));
            })()}
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
            No transactions found.
          </div>
        )}
      </div>
    </div>
  );
}

export default ListScreen;
