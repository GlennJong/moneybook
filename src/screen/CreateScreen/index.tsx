import type { Transaction } from '../../types';
import TransactionForm from '../../components/TransactionForm';

type CreateTransactionProps = {
  transactions?: Transaction[];
  onSubmit: (data: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'syncStatus'>) => Promise<void>;
  initialData?: Transaction | null;
  onCancel?: () => void;
}

const CreateScreen = ({ onSubmit, transactions = [], initialData, onCancel }: CreateTransactionProps) => {
  const handleCreate = async (data: Omit<Transaction, "id" | "created_at" | "updated_at" | "syncStatus">) => {
    await onSubmit(data);
    if (!initialData) {
      alert('Transaction Added!');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>{initialData ? 'Edit Transaction' : 'Add Transaction'}</h1>
      <TransactionForm 
        transactions={transactions}
        onSubmit={handleCreate}
        initialData={initialData}
        onCancel={onCancel}
      />
    </div>
  );
}

export default CreateScreen;
