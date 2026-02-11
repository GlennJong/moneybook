import { useState } from 'react';
import { ReactHooks } from '@glennjong/vibe-sheets';
import './App.css'
import SheetSelector from './SheetSelector';
import MainLayout from './screen/MainLayout';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  const [selectedScriptUrl, setSelectedScriptUrl] = useState<string | null>(
    localStorage.getItem('vibe_script_url') || null
  );

  const { login, accessToken, isAppsScriptEnabled } = ReactHooks.useGoogleAuth({
    clientId
  });


  if (selectedScriptUrl) {
    return (
      <MainLayout />
    );
  }
  
  // Handle getting GAS permission if it's not enabled
  if (!accessToken) {
    return (
      <div className="card" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
        <h1>Welcome to MoneyBook</h1>
        <button onClick={login}>Login with Google</button>
      </div>
    );
  }
  else if (accessToken && !isAppsScriptEnabled) {
    return (
      <div className="card" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
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

  
  // Handle sheet selection and store vibe_script_url
  return (
    <SheetSelector
      token={accessToken}
      onSelect={(endpoint: string) => {
        localStorage.setItem('vibe_script_url', endpoint);
        setSelectedScriptUrl(endpoint);
      }}
    />
  )
}

export default App
