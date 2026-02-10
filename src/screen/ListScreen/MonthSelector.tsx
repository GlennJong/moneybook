type MonthSelectorProps = {
  currentMonth: Date;
  onNavigate: (offset: number) => void;
};

const MonthSelector = ({ currentMonth, onNavigate }: MonthSelectorProps) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
      <button 
        onClick={() => onNavigate(-1)}
        style={{ padding: '5px 15px', cursor: 'pointer' }}
      >
        &lt;
      </button>
      <h2 style={{ margin: 0 }}>
        {currentMonth.toLocaleString('default', { year: 'numeric', month: 'long' })}
      </h2>
      <button 
        onClick={() => onNavigate(1)}
        style={{ padding: '5px 15px', cursor: 'pointer' }}
      >
        &gt;
      </button>
    </div>
  );
};

export default MonthSelector;
