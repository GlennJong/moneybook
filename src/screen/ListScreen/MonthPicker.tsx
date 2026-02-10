type MonthPickerProps = {
  isOpen: boolean;
  onClose: () => void;
  months: string[];
  onSelect: (month: string) => void;
};

const MonthPicker = ({ isOpen, onClose, months, onSelect }: MonthPickerProps) => {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          width: '80%',
          maxWidth: '300px',
          maxHeight: '70vh',
          overflowY: 'auto',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, textAlign: 'center' }}>Jump to Month</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {months.map(month => (
            <button
              key={month}
              onClick={() => onSelect(month)}
              style={{
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa',
                cursor: 'pointer',
                fontSize: '1em'
              }}
            >
              {month}
            </button>
          ))}
          {months.length === 0 && (
            <p style={{ textAlign: 'center', color: '#666' }}>No records found</p>
          )}
        </div>
        <button 
          onClick={onClose}
          style={{
            marginTop: '20px',
            width: '100%',
            padding: '10px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#666',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default MonthPicker;
