import { useState } from 'react';
import { type DriveFile } from '@glennjong/vibe-sheets';

import type { Data } from '../types';
import { fetchScript } from '../common/fetch';


const FileItem = ({ isNew, file, onSelect }: { isNew: boolean, file: DriveFile, onSelect: (data: Data[]) => void }) => {
  
  const [ isFetching, setIsFetching ] = useState(false);
  const [ isAccessed, setIsAccessed ] = useState<boolean | undefined>(!isNew);
  
  const handleSelect = async () => {
    try {
      if (file.description) {
        if (file.scriptUrl) {
          setIsFetching(true);
          const data = await fetchScript(file.scriptUrl);
          setIsAccessed(true);
          onSelect(data);
          setIsFetching(false);
        }
      }
    } catch (e) {
      console.error("Invalid file description", e);
      setIsAccessed(false);
      setIsFetching(false);
    }
  };

  // View: List Files
  return (
    <div className="card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
      <div key={file.id} className="file-card">
        <h3>{file.name.replace('moneybook-', '')}</h3>
        <div className="file-card-actions">
          <a href={file.webViewLink} target="_blank" rel="noreferrer" style={{ flex: 1 }}>
            <button style={{ width: '100%', background: 'var(--bg-item)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
              Open
            </button>
          </a>
          <button 
            disabled={isFetching}
            onClick={handleSelect}
            style={{ 
              backgroundColor: 'var(--primary)',
              color: 'var(--text-inv)',
              border: 'none'
            }}
          >
            { isFetching ? 'Loading...' : 'Select' }
          </button>
        </div>
        { isAccessed === false && 
          <div style={{ marginTop: '1rem', color: 'var(--danger)', fontSize: '0.9rem' }}>
            <p>無法讀取資料，請先授權。</p>
            <button 
              onClick={() => {
                const scriptUrl = file.scriptUrl;
                window.open(scriptUrl, 'auth', 'width=600,height=400');
                setIsAccessed(undefined);
              }}
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--text-inv)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
            >
              前往授權
            </button>
          </div>
        }
      </div>
    </div>
  );
};

export default FileItem;
