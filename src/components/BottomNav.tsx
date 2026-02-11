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
      backgroundColor: 'var(--bg-card)',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingTop: '12px',
      paddingBottom: 'calc(25px + env(safe-area-inset-bottom))',
      zIndex: 1000,
      boxShadow: '0 -2px 5px var(--shadow-color)'
    }}>
      <button 
        onClick={() => onTabChange('today')}
        style={{
          background: 'none',
          border: 'none',
          color: currentTab === 'today' ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '1em',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1
        }}
      >
        <span className="material-icons" style={{ fontSize: '1.5em' }}>calendar_today</span>
      </button>

      <button 
        onClick={() => onTabChange('list')}
        style={{
          background: 'none',
          border: 'none',
          color: currentTab === 'list' ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '1em',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1
        }}
      >
        <span className="material-icons" style={{ fontSize: '1.5em' }}>list</span>
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
          backgroundColor: 'var(--primary)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'var(--text-inv)',
          fontSize: '2em',
          boxShadow: '0 4px 10px var(--shadow-color)'
        }}>
          <span className="material-icons" style={{ fontSize: '1em' }}>add</span>
        </div>
      </button>

      <button 
        onClick={() => onTabChange('discover')}
        style={{
          background: 'none',
          border: 'none',
          color: currentTab === 'discover' ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '1em',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1
        }}
      >
        <span className="material-icons" style={{ fontSize: '1.5em' }}>pie_chart</span>
      </button>

      <button 
        onClick={() => onTabChange('config')}
        style={{
          background: 'none',
          border: 'none',
          color: currentTab === 'config' ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '1em',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1
        }}
      >
        <span className="material-icons" style={{ fontSize: '1.5em' }}>settings</span>
      </button>
    </div>
  );
};

export default BottomNav;
