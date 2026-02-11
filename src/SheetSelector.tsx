import { useState, useEffect } from 'react';
import { ReactHooks } from '@glennjong/vibe-sheets';
import './App.css'
import FileItem from './components/FileItem';

type CreateSheetBoxProps = {
  createSheet: (options: { sheetName: string, prefix?: string, columns?: { name: string, type: 'string' | 'number' | 'boolean' }[], tabName?: string }) => Promise<void>;
  fetchFiles: (prefix: string) => Promise<void>;
  onCreate: (newSheetNames: string) => void;
}

const CreateSheetBox = ({ createSheet, fetchFiles, onCreate }: CreateSheetBoxProps) => {
  const [sheetName, setSheetName] = useState<string>('');
  
  const handleFetchCreationSheet = async () => {
    await createSheet({
      sheetName: sheetName,
      prefix: 'moneybook-',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'price', type: 'number' },
        { name: 'tags', type: 'string' },
      ]
    })
    fetchFiles('moneybook-');
    onCreate(sheetName);
  }
  
  return (
    <div>
      <input 
        type="text" 
        value={sheetName} 
        onChange={(e) => setSheetName(e.target.value)} 
        style={{
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--input-bg)',
          color: 'var(--text-main)',
          marginBottom: '10px'
        }}
      />
      <br />
      <button
        onClick={handleFetchCreationSheet}
        style={{
          padding: '8px 16px',
          borderRadius: '4px',
          border: 'none',
          backgroundColor: 'var(--primary)',
          color: 'var(--text-inv)',
          cursor: 'pointer'
        }}
      >
        Create Sheet
      </button>
    </div>
  )
}

const SheetSelector = ({ token, onSelect }: { token: string, onSelect: (endpoint: string) => void }) => {
  const { 
    createSheet, 
    fetchFiles,
    loading,
    files,
  } = ReactHooks.useSheetManager(token);

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [ newCreationSheetName, setNewCreationSheetName ] = useState<string[]>([]);
  
  useEffect(() => {
    fetchFiles('moneybook-').finally(() => setIsInitialLoad(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleStoreEndpoint = (endpoint: string) => {
    localStorage.setItem('vibe_script_url', endpoint);
    onSelect(endpoint);
  };
  
  if (isInitialLoad || (loading && files.length === 0)) {
    return (
      <div className="card" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
        <h3>Syncing your Moneybooks...</h3>
        <p>Please wait while we fetch your data.</p>
      </div>
    );
  }
  // View: Create New (Enable if no files OR if we just created one successfully)
  if (files.length === 0) {
    return (
      <div className="card" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
        <h2>Welcome to MoneyBook</h2>
        <div style={{ padding: '1.5rem', background: 'var(--bg-item)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h3>No Moneybooks Found</h3>
          <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            It looks like you don't have a MoneyBook backend yet.
          </p>
          <CreateSheetBox
            createSheet={createSheet}
            fetchFiles={fetchFiles}
            onCreate={(sheetName: string) => setNewCreationSheetName([...newCreationSheetName, sheetName])}
          />
          <button 
            className="secondary" 
            onClick={() => fetchFiles('moneybook-')} 
            disabled={loading}
            style={{
               marginTop: '10px',
               padding: '8px 16px',
               background: 'transparent',
               border: '1px solid var(--text-secondary)',
               color: 'var(--text-secondary)',
               borderRadius: '4px',
               cursor: 'pointer'
            }}
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  // View: List Files
  return (
    <div className="card" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Select MoneyBook</h2>
          <br />
          <CreateSheetBox
            createSheet={createSheet}
            fetchFiles={fetchFiles}
            onCreate={(sheetName: string) => setNewCreationSheetName([...newCreationSheetName, sheetName])}
          />
        </div>

        {/* List Section */}
        <div>
          <div className="file-grid">
            {files.map((file) => 
              <FileItem
                isNew={newCreationSheetName.some((sheetName) => file.name.includes(sheetName))}
                key={file.id}
                file={file}
                onSelect={() => {
                  if (file.scriptUrl) {
                    handleStoreEndpoint(file.scriptUrl);
                  }
                }} />
            )}
          </div>
        </div>
        
        <button className="secondary" onClick={() => fetchFiles('moneybook-')} disabled={loading} style={{ alignSelf: 'center', marginTop: '20px' }}>
           Refresh List
        </button>
      </div>
    </div>
  );
};

export default SheetSelector
