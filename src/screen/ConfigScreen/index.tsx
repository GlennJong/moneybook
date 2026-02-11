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

      <div className="card" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>Sync Status</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 'bold', color: pendingCount > 0 ? '#d63384' : '#198754' }}>
              {pendingCount > 0 ? `${pendingCount} changes pending` : 'All changes synced'}
            </div>
            {isSyncing && <div style={{ fontSize: '0.9em', color: '#0d6efd' }}>Syncing in progress...</div>}
          </div>
          {onSync && (
            <button 
              onClick={() => onSync()}
              disabled={isSyncing || pendingCount === 0}
              style={{
                padding: '8px 16px',
                backgroundColor: isSyncing || pendingCount === 0 ? '#e9ecef' : '#0d6efd',
                color: isSyncing || pendingCount === 0 ? '#6c757d' : 'white',
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

      <div className="card" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Max Tags to Show in Filter List
          </label>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            value={maxTags}
            onChange={handleMaxTagsChange}
          />
          <p style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
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
            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            value={bigPurchaseThreshold}
            onChange={handleThresholdChange}
          />
          <p style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
            Transactions above this amount will be considered "Big Purchases".
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfigScreen;
