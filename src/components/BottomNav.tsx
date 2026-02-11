import type { Tab } from '../screen/MainLayout';

type BottomNavProps = {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
};

const BottomNav = ({ currentTab, onTabChange }: BottomNavProps) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'white',
      borderTop: '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '10px 0',
      zIndex: 1000,
      boxShadow: '0 -2px 5px rgba(0,0,0,0.05)'
    }}>
      <button 
        onClick={() => onTabChange('list')}
        style={{
          background: 'none',
          border: 'none',
          color: currentTab === 'list' ? '#007bff' : '#999',
          fontSize: '1em',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1
        }}
      >
        <span style={{ fontSize: '1.5em' }}>🏠</span>
        <span style={{ fontSize: '0.8em' }}>Home</span>
      </button>

      <button 
        onClick={() => onTabChange('today')}
        style={{
          background: 'none',
          border: 'none',
          color: currentTab === 'today' ? '#007bff' : '#999',
          fontSize: '1em',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1
        }}
      >
        <span style={{ fontSize: '1.5em' }}>📅</span>
        <span style={{ fontSize: '0.8em' }}>Today</span>
      </button>

      <button 
        onClick={() => onTabChange('create')}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1,
          marginTop: '-40px' // Float up effect
        }}
      >
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#007bff',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontSize: '2em',
          boxShadow: '0 4px 10px rgba(0,123,255,0.3)'
        }}>
          +
        </div>
      </button>

      <button 
        onClick={() => onTabChange('discover')}
        style={{
          background: 'none',
          border: 'none',
          color: currentTab === 'discover' ? '#007bff' : '#999',
          fontSize: '1em',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1
        }}
      >
        <span style={{ fontSize: '1.5em' }}>🔍</span>
        <span style={{ fontSize: '0.8em' }}>Discover</span>
      </button>

      <button 
        onClick={() => onTabChange('config')}
        style={{
          background: 'none',
          border: 'none',
          color: currentTab === 'config' ? '#007bff' : '#999',
          fontSize: '1em',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1
        }}
      >
        <span style={{ fontSize: '1.5em' }}>⚙️</span>
        <span style={{ fontSize: '0.8em' }}>Config</span>
      </button>
    </div>
  );
};

export default BottomNav;
