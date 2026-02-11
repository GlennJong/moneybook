import { useState, useRef, useMemo, useEffect } from 'react';
import type { Transaction } from '../types';

type TransactionFormProps = {
  transactions?: Transaction[];
  onSubmit: (data: Omit<Transaction, 'id' | 'updated_at' | 'syncStatus'> & { created_at: string }) => Promise<void>;
  initialData?: Transaction | null;
  onCancel?: () => void;
  submitLabel?: string;
}

interface HTMLInputElementWithComposing extends HTMLInputElement {
  isComposing?: boolean;
}

const TransactionForm = ({ onSubmit, transactions = [], initialData, onCancel, submitLabel }: TransactionFormProps) => {
  const [newName, setNewName] = useState(initialData?.name || '');
  const [newPrice, setNewPrice] = useState(initialData ? String(initialData.price) : '');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [createdDate, setCreatedDate] = useState(() => {
    // Format date for datetime-local input (YYYY-MM-DDThh:mm)
    const date = initialData ? new Date(initialData.created_at) : new Date();
    // Adjust for local timezone offset to display correct local time in input
    const offset = date.getTimezoneOffset() * 60000;
    const localIso = new Date(date.getTime() - offset).toISOString().slice(0, 16);
    return localIso;
  });
  const [isTagsFocused, setIsTagsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTagSelectorOpen, setIsTagSelectorOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewName(initialData.name);
      setNewPrice(String(initialData.price));
      setTags(initialData.tags?.filter(t => t.trim() !== '') || []);
      
      const date = new Date(initialData.created_at);
      const offset = date.getTimezoneOffset() * 60000;
      const localIso = new Date(date.getTime() - offset).toISOString().slice(0, 16);
      setCreatedDate(localIso);
    } else {
      setNewName('');
      setNewPrice('');
      setTags([]);
      const date = new Date();
      const offset = date.getTimezoneOffset() * 60000;
      const localIso = new Date(date.getTime() - offset).toISOString().slice(0, 16);
      setCreatedDate(localIso);
    }
  }, [initialData]);

  const priceRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const tagsRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const allAvailableTags = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach(t => {
      t.tags.forEach(tag => {
        if (tag && tag.trim()) {
            counts[tag] = (counts[tag] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }, [transactions]);
  
  const suggestedTags = useMemo(() => {
    // Filter based on input and exclude already selected
    return allAvailableTags.filter(tag => 
      tag.trim() !== '' &&
      !tags.includes(tag) && 
      tag.toLowerCase().includes(tagInput.toLowerCase())
    );
  }, [allAvailableTags, tagInput, tags]);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
    setTagInput('');
    // Keep focus on input if selector is open
    if (isTagSelectorOpen) {
        tagInputRef.current?.focus();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!newName || isSubmitting) return;

    setIsSubmitting(true);
    
    // Add pending tag if exists
    const finalTags = [...tags];
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      finalTags.push(tagInput.trim());
    }

    try {
      await onSubmit({ 
        name: newName, 
        price: newPrice ? Number(newPrice) : 0, 
        tags: finalTags,
        description: initialData?.description || '',
        created_at: new Date(createdDate).toISOString()
      });
      
      if (!initialData) {
        // Reset form only if creating
        setNewName('');
        setNewPrice('');
        setTags([]);
        setTagInput('');
        const date = new Date();
        const offset = date.getTimezoneOffset() * 60000;
        const localIso = new Date(date.getTime() - offset).toISOString().slice(0, 16);
        setCreatedDate(localIso);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: 'white' }}>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Date & Time</label>
        <input 
          type="datetime-local"
          style={{ width: '100%', padding: '8px', fontSize: '16px' }}
          value={createdDate}
          onChange={e => setCreatedDate(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Price ($)</label>
        <input 
          ref={priceRef}
          type="number"
          inputMode="decimal"
          style={{ width: '100%', padding: '8px', fontSize: '16px' }}
          placeholder="0" 
          value={newPrice} 
          onChange={e => setNewPrice(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
                nameRef.current?.focus();
            }
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Item Name</label>
        <input 
          ref={nameRef}
          style={{ width: '100%', padding: '8px', fontSize: '16px' }}
          placeholder="e.g. Lunch" 
          value={newName} 
          onChange={e => setNewName(e.target.value)}
          onCompositionStart={() => {
            const el = nameRef.current as HTMLInputElementWithComposing | null;
            if (el) el.isComposing = true;
          }}
          onCompositionEnd={() => {
            const el = nameRef.current as HTMLInputElementWithComposing | null;
            if (el) el.isComposing = false;
          }}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing || (nameRef.current as HTMLInputElementWithComposing | null)?.isComposing) return;
            if (e.key === 'Enter') {
              setIsTagSelectorOpen(true);
            }
          }}
        />
      </div>


      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Tags</label>
        
        <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '8px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
            {tags.map(tag => (
                <span 
                    key={tag} 
                    style={{
                        backgroundColor: '#e0e0e0',
                        borderRadius: '16px',
                        padding: '4px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '14px',
                        flexShrink: 0,
                        whiteSpace: 'nowrap'
                    }}
                >
                    {tag}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            removeTag(tag);
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            marginLeft: '6px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: 0,
                            color: '#666',
                            lineHeight: 1
                        }}
                    >
                        ×
                    </button>
                </span>
            ))}
            <button
                onClick={() => setIsTagSelectorOpen(true)}
                style={{
                    backgroundColor: 'transparent',
                    border: '1px dashed #999',
                    borderRadius: '16px',
                    padding: '4px 12px',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0,
                    whiteSpace: 'nowrap'
                }}
            >
                + Add Tag
            </button>
        </div>
      </div>
      
      {/* Tag Selector Modal */}
      {isTagSelectorOpen && (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 3000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end', // Bottom sheet style could be nice, or center
        }}>
            <div style={{
                backgroundColor: 'white',
                width: '100%',
                height: '80vh', // Take up most of screen
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideUp 0.3s ease-out'
            }}>
                <style>{`
                    @keyframes slideUp {
                        from { transform: translateY(100%); }
                        to { transform: translateY(0); }
                    }
                `}</style>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>Select Tags</h2>
                    <button 
                        onClick={() => setIsTagSelectorOpen(false)}
                        style={{ background: 'none', border: 'none', fontSize: '16px', color: '#007bff', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Done
                    </button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <input 
                        ref={tagInputRef}
                        autoFocus
                        style={{ 
                            width: '100%', 
                            padding: '12px', 
                            fontSize: '16px',
                            border: '1px solid #ccc',
                            borderRadius: '8px'
                        }}
                        placeholder="Search or create tag..."
                        value={tagInput} 
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (tagInput.trim()) {
                                    addTag(tagInput.trim());
                                } else {
                                    // If empty enter, maybe close? Or just do nothing.
                                    // setIsTagSelectorOpen(false); 
                                }
                            }
                        }}
                    />
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                         {/* Show filtered suggestions */}
                         {suggestedTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => addTag(tag)}
                                style={{
                                    backgroundColor: 'white',
                                    border: '1px solid #ced4da',
                                    borderRadius: '20px',
                                    padding: '8px 16px',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    color: '#495057'
                                }}
                            >
                                + {tag}
                            </button>
                        ))}
                    </div>

                    {tagInput && suggestedTags.length === 0 && (
                        <div style={{ padding: '10px 0', color: '#666' }}>
                            Press Enter to create "{tagInput}"
                        </div>
                    )}

                    <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />
                    
                    <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>Selected</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                        {tags.length > 0 ? tags.map(tag => (
                            <button 
                                key={tag} 
                                onClick={() => removeTag(tag)}
                                style={{
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '20px',
                                    padding: '8px 16px',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                {tag} <span>×</span>
                            </button>
                        )) : (
                            <span style={{ color: '#999' }}>No tags selected</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              padding: '12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer',
              width: '100px'
            }}
          >
            Cancel
          </button>
        )}
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{ 
            flex: 1,
            padding: '12px', 
            backgroundColor: isSubmitting ? '#94c2ff' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            fontSize: '16px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.8 : 1
          }}
        >
          {isSubmitting ? 'Saving...' : (submitLabel || (initialData ? 'Save Changes' : 'Add Transaction'))}
        </button>
      </div>
    </div>
  );
};

export default TransactionForm;
