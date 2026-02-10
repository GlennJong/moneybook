import { useState, useRef, useMemo, useEffect } from 'react';
import type { Transaction } from '../types';

type TransactionFormProps = {
  transactions?: Transaction[];
  onSubmit: (data: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'syncStatus'>) => Promise<void>;
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
  const [isTagsFocused, setIsTagsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewName(initialData.name);
      setNewPrice(String(initialData.price));
      setTags(initialData.tags || []);
    } else {
      setNewName('');
      setNewPrice('');
      setTags([]);
    }
  }, [initialData]);

  const priceRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const tagsRef = useRef<HTMLInputElement>(null);

  const suggestedTags = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach(t => {
      t.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    
    // All unique tags sorted by frequency
    const allTags = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);

    // Filter based on input and exclude already selected
    return allTags.filter(tag => 
      !tags.includes(tag) && 
      tag.toLowerCase().includes(tagInput.toLowerCase())
    ).slice(0, tagInput ? 10 : 5); // Show more if searching
  }, [transactions, tagInput, tags]);

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
    tagsRef.current?.focus();
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
        description: initialData?.description || '' 
      });
      
      if (!initialData) {
        // Reset form only if creating
        setNewName('');
        setNewPrice('');
        setTags([]);
        setTagInput('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: 'white' }}>
      
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
              tagsRef.current?.focus();
            }
          }}
        />
      </div>


      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Tags</label>
        <div 
          style={{ 
            border: '1px solid #767676', 
            borderRadius: '2px', 
            padding: '4px', 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '4px', 
            backgroundColor: 'white',
            minHeight: '38px', // Match standard input height
            alignItems: 'center'
          }}
          onClick={() => tagsRef.current?.focus()}
        >
          {tags.map(tag => (
            <span 
              key={tag} 
              style={{
                backgroundColor: '#e0e0e0',
                borderRadius: '16px',
                padding: '2px 8px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '14px'
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
                  marginLeft: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: 0,
                  color: '#666'
                }}
              >
                ×
              </button>
            </span>
          ))}
          <input 
            ref={tagsRef as React.Ref<HTMLInputElementWithComposing>}
            style={{ 
              border: 'none', 
              outline: 'none', 
              flexGrow: 1, 
              padding: '4px', 
              fontSize: '16px',
              minWidth: '60px'
            }}
            placeholder={tags.length === 0 ? "Food, Drink" : ""}
            value={tagInput} 
            onChange={e => setTagInput(e.target.value)}
            onFocus={() => setIsTagsFocused(true)}
            onBlur={() => setTimeout(() => setIsTagsFocused(false), 200)} 
            onCompositionStart={() => {
              (tagsRef.current as HTMLInputElementWithComposing | null)!.isComposing = true;
            }}
            onCompositionEnd={() => {
              (tagsRef.current as HTMLInputElementWithComposing | null)!.isComposing = false;
            }}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing || (tagsRef.current as HTMLInputElementWithComposing | null)?.isComposing) {
                return;
              }

              if (e.key === 'Enter') {
                e.preventDefault();
                if (tagInput.trim()) {
                  addTag(tagInput.trim());
                } else {
                  handleSubmit();
                }
              } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
                removeTag(tags[tags.length - 1]);
              }
            }}
          />
        </div>
        {isTagsFocused && suggestedTags.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            {suggestedTags.map(tag => (
              <button
                key={tag}
                onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
                onClick={() => addTag(tag)}
                style={{
                  backgroundColor: '#e9ecef',
                  border: '1px solid #ced4da',
                  borderRadius: '16px',
                  padding: '4px 12px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  color: '#495057'
                }}
              >
                {tag}
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
