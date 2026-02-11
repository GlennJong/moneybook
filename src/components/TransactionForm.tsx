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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const tagInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

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
    // Keep focus on input
    tagInputRef.current?.focus();
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
    <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-card)' }}>
      
      <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-main)' }}>
            {createdDate.replace('T', ' ')}
        </div>
        <div style={{ position: 'relative' }}>
            <button
                type="button"
                style={{
                    backgroundColor: 'var(--bg-item)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <span className="material-icons" style={{ fontSize: '20px' }}>calendar_month</span>
            </button>
            <input 
                ref={dateInputRef}
                type="datetime-local"
                style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%', 
                    opacity: 0, 
                    zIndex: 10,
                    cursor: 'pointer'
                }}
                value={createdDate}
                onChange={e => setCreatedDate(e.target.value)}
                onClick={(e) => {
                    // Try to force show picker on desktop
                    try {
                        if ('showPicker' in e.currentTarget) {
                            (e.currentTarget).showPicker();
                        }
                    } catch (err) {
                      console.error(err);
                        // ignore
                    }
                }}
            />
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <input 
          ref={priceRef}
          type="number"
          inputMode="decimal"
          style={{ width: '100%', padding: '8px', fontSize: '16px', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', boxSizing: 'border-box' }}
          placeholder="How much?" 
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
        <input 
          ref={nameRef}
          style={{ width: '100%', padding: '8px', fontSize: '16px', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', boxSizing: 'border-box' }}
          placeholder="What are you buying?" 
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
              tagInputRef.current?.focus();
            }
          }}
        />
      </div>


      <div style={{ marginBottom: '20px' }}>
        
        <div style={{
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          backgroundColor: 'var(--input-bg)',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Selected Tags Chips */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '8px', marginBottom: '5px', overflowX: 'auto', paddingBottom: '4px' }}>
              {tags.map(tag => (
                <span 
                  key={tag} 
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--text-inv)',
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
                      e.preventDefault(); 
                      removeTag(tag);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      marginLeft: '6px',
                      cursor: 'pointer',
                      color: 'inherit',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <span className="material-icons" style={{ fontSize: '14px' }}>close</span>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Input */}
          <input 
            ref={tagInputRef}
            style={{ 
              width: '100%', 
              padding: '0', 
              fontSize: '16px', 
              backgroundColor: 'transparent', 
              color: 'var(--text-main)', 
              border: 'none', 
              outline: 'none',
              boxSizing: 'border-box' 
            }}
            placeholder={tags.length > 0 ? "Add another tag..." : "Add tags..."} 
            value={tagInput} 
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (tagInput.trim()) {
                  addTag(tagInput.trim());
                } else {
                  handleSubmit();
                }
              }
            }}
          />
        </div>

        {/* Suggestions */}
        {(tagInput || suggestedTags.length > 0) && (
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '8px', marginTop: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                {suggestedTags.slice(0, 15).map(tag => (
                    <button
                        key={tag}
                        onClick={(e) => {
                            e.preventDefault();
                            addTag(tag);
                        }}
                        style={{
                            backgroundColor: 'var(--bg-item)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            padding: '4px 12px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            color: 'var(--text-main)',
                            flexShrink: 0,
                            whiteSpace: 'nowrap'
                        }}
                    >
                        + {tag}
                    </button>
                ))}
            </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              padding: '12px',
              backgroundColor: 'var(--text-secondary)',
              color: 'var(--text-inv)',
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
            backgroundColor: isSubmitting ? 'var(--primary-bg-subtle)' : 'var(--primary)', 
            color: 'var(--text-inv)', 
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
