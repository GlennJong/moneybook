import { useState, useEffect } from 'react';

interface ConfigScreenProps {
  onSync?: () => Promise<void>;
  isSyncing?: boolean;
  pendingCount?: number;
}

const ConfigScreen = ({ onSync, isSyncing = false, pendingCount = 0 }: ConfigScreenProps) => {
  const [maxTags, setMaxTags] = useState(10);
  const [bigPurchaseThreshold, setBigPurchaseThreshold] = useState(1000);

  useEffect(() => {
    const savedTags = localStorage.getItem('moneybook_max_tags');
    if (savedTags) {
      setMaxTags(Number(savedTags));
    }
    
    const savedThreshold = localStorage.getItem('moneybook_big_purchase_threshold');
    if (savedThreshold) {
      setBigPurchaseThreshold(Number(savedThreshold));
    }
  }, []);

  const handleMaxTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setMaxTags(val);
    localStorage.setItem('moneybook_max_tags', String(val));
  };

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setBigPurchaseThreshold(val);
    localStorage.setItem('moneybook_big_purchase_threshold', String(val));
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Configuration</h1>

      <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '20px', backgroundColor: 'var(--bg-card)' }}>
        <h3 style={{ marginTop: 0 }}>Sync Status</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 'bold', color: pendingCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {pendingCount > 0 ? `${pendingCount} changes pending` : 'All changes synced'}
            </div>
            {isSyncing && <div style={{ fontSize: '0.9em', color: 'var(--primary)' }}>Syncing in progress...</div>}
          </div>
          {onSync && (
            <button 
              onClick={() => onSync()}
              disabled={isSyncing || pendingCount === 0}
              style={{
                padding: '8px 16px',
                backgroundColor: isSyncing || pendingCount === 0 ? 'var(--input-bg)' : 'var(--primary)',
                color: isSyncing || pendingCount === 0 ? 'var(--text-muted)' : 'var(--text-inv)',
                border: 'none',
                borderRadius: '6px',
                cursor: isSyncing || pendingCount === 0 ? 'default' : 'pointer'
              }}
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-card)' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Max Tags to Show in Filter List
          </label>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            style={{ width: '100%', padding: '8px', fontSize: '16px', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', boxSizing: 'border-box' }}
            value={maxTags}
            onChange={handleMaxTagsChange}
          />
          <p style={{ fontSize: '0.9em', color: 'var(--text-secondary)', marginTop: '5px' }}>
            Tags will be sorted by usage frequency. Set 0 to show all tags.
          </p>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Big Purchase Threshold ($)
          </label>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            style={{ width: '100%', padding: '8px', fontSize: '16px', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', boxSizing: 'border-box' }}
            value={bigPurchaseThreshold}
            onChange={handleThresholdChange}
          />
          <p style={{ fontSize: '0.9em', color: 'var(--text-secondary)', marginTop: '5px' }}>
            Transactions above this amount will be considered "Big Purchases".
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', marginTop: '20px', backgroundColor: 'var(--bg-card)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--danger)' }}>Danger Zone</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          This will remove all local data and log you out. Unsynced changes will be lost.
        </p>
        <button
            onClick={() => {
                if(confirm('Are you sure you want to clear all data and logout? This cannot be undone.')) {
                    localStorage.clear();
                    window.location.reload();
                }
            }}
            style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'var(--danger)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: 'bold'
            }}
        >
            Leave & Clear Data
        </button>
      </div>
    </div>
  );
};

export default ConfigScreen;
