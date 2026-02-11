import type { Transaction } from '../../types';
import TransactionForm from '../../components/TransactionForm';

type CreateTransactionProps = {
  transactions?: Transaction[];
  onSubmit: (data: Omit<Transaction, 'id' | 'updated_at' | 'syncStatus'> & { created_at?: string }) => Promise<void>;
  initialData?: Transaction | null;
  onCancel?: () => void;
}

const CreateScreen = ({ onSubmit, transactions = [], initialData, onCancel }: CreateTransactionProps) => {
  const handleCreate = async (data: Omit<Transaction, "id" | "updated_at" | "syncStatus"> & { created_at?: string }) => {
    await onSubmit(data);
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
