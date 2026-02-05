import { useState, useEffect } from 'react';
import { ReactHooks } from '@glennjong/vibe-sheets';
import './App.css'
import FileItem from './components/FileItem';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const FileSelector = ({ token, onSelect }: { token: string, onSelect: (endpoint: string) => void }) => {
  const { 
    createSheet, 
    creationResult,
    fetchFiles,
    loading,
    files,
  } = ReactHooks.useSheetManager(token);
  
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  useEffect(() => {
    fetchFiles('moneybook-').finally(() => setIsInitialLoad(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleStoreEndpoint = (endpoint: string) => {
    localStorage.setItem('vibe_script_url', endpoint);
    // setSelectedScriptUrl(endpoint);
    onSelect(endpoint);
  };
  

  if (isInitialLoad || (loading && files.length === 0)) {
    return (
      <div className="card">
        <h3>Syncing your Moneybooks...</h3>
        <p>Please wait while we fetch your data.</p>
      </div>
    );
  }
  // View: Create New (Enable if no files OR if we just created one successfully)
  if (files.length === 0 || creationResult) {
    return (
      <div className="card">
        <h2>Welcome to MoneyBook</h2>
        <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
          {creationResult ? (
            <div className="success-banner" style={{ textAlign: 'left' }}>
              <p><strong>🎉 Backend Created Successfully!</strong></p>
              
              <div style={{ margin: '10px 0', padding: '12px', background: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '6px', color: '#856404' }}>
                <strong>⚠️ 重要與安全性：</strong>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem' }}>
                  為了讓後端開始運作，請務必點擊下方的 <b>Open Apps Script</b> 按鈕，並依指示完成 Google 帳號授權 (Review Permissions)。
                </p>
              </div>

              <p style={{ fontSize: '0.9em', marginTop: '0.5rem', opacity: 0.8 }}>{creationResult.tip}</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '1rem', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <a href={creationResult.spreadsheetUrl} target="_blank" rel="noreferrer">
                    <button className="secondary" style={{ fontSize: '0.8rem' }}>Open Sheet</button>
                  </a>
                  <a href={creationResult.scriptUrl} target="_blank" rel="noreferrer">
                    <button className="secondary" style={{ fontSize: '0.8rem' }}>Open Apps Script (Authorize Here)</button>
                  </a>
                </div>
                <button onClick={() => { fetchFiles('moneybook-'); }} style={{ marginTop: '10px' }}>
                  Refresh & Go to List
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3>No Moneybooks Found</h3>
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                It looks like you don't have a MoneyBook backend yet.
              </p>
              <button onClick={() => createSheet({
                sheetName: "我的記帳本",
                prefix: 'moneybook-',
                columns: [
                  { name: 'name', type: 'string' },
                  { name: 'price', type: 'number' },
                  { name: 'tags', type: 'string' },
                ]
              })} disabled={loading}>
                {loading ? "Creating..." : "建立帳本"}
              </button>
              <br/><br/>
              <button className="secondary" onClick={() => fetchFiles('moneybook-')} disabled={loading}>
                Check Again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // View: List Files
  return (
    <div className="card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Select MoneyBook</h2>
          <button onClick={() => createSheet({
              sheetName: "我的記帳本 " + (files.length + 1),
              prefix: 'moneybook-',
              columns: [
                { name: 'name', type: 'string' },
                { name: 'price', type: 'number' },
                { name: 'tags', type: 'string' },
              ]
            })} style={{ fontSize: '0.8rem', padding: '0.5rem' }}>
             + New
          </button>
        </div>

        {/* List Section */}
        <div style={{ textAlign: 'left' }}>
          <div className="file-grid">
            {files.map((file) => 
              <FileItem
                key={file.id}
                file={file}
                onSelect={(data) => {
                  console.log(data);
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

function App() {
  const [selectedScriptUrl, setSelectedScriptUrl] = useState<string | null>(
    localStorage.getItem('vibe_script_url') || null
  );

  
  const { login, accessToken, isAppsScriptEnabled } = ReactHooks.useGoogleAuth({
    clientId
  });


  if (selectedScriptUrl) {
    return (
      <>app core</>
    );
  }
  

  if (!accessToken) {
    return (
      <div className="card">
        <h1>Welcome to MoneyBook</h1>
        <button onClick={login}>Login with Google</button>
      </div>
    );
  }
  else if (accessToken && !isAppsScriptEnabled) {
    return (
      <div className="card">
        <h1>Hi! New User</h1>
        { isAppsScriptEnabled === undefined ? 
          <p>Checking your Apps Script permission...</p>
          :
          <>
            <p>Before we start using MoneyBook, you need to enable Apps Script.</p>
            <a target="_blank" href="https://script.google.com/home/usersettings?pli=1">Click Me</a>
          </>
        }
      </div>
    );
  }

  const handleSelect = (endpoint: string) => {
    localStorage.setItem('vibe_script_url', endpoint);
    setSelectedScriptUrl(endpoint);
  }

  return (
    <>
      <FileSelector token={accessToken} onSelect={handleSelect} />
    </>
  )
}

export default App
