'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const transactionSchema = z.object({
  type: z.enum(['expense', 'income']),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  amount: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number({ message: 'Amount is required' }).min(1, 'Amount must be at least 1')
  ),
  category: z.string().min(1, 'Category is required'),
  paymentAccountId: z.string().optional(),
  date: z.string().min(1, 'Date is required').refine(s => !isNaN(Date.parse(s)), { message: 'Invalid date format' }),
  description: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  initialData?: any;
  onSuccess: (wasEdit: boolean) => void;
}

export function TransactionForm({ initialData, onSuccess }: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Refs for keyboard navigation
  const titleRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      type: initialData?.type || 'expense',
      title: initialData?.title || '',
      amount: initialData?.amount !== undefined ? initialData.amount : '',
      category: initialData?.category || 'Others',
      paymentAccountId: initialData?.paymentAccountId?._id || initialData?.paymentAccountId || '',
      date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      description: initialData?.description || '',
    },
  });

  const selectedType = form.watch('type');

  useEffect(() => {
    // Fetch dynamic categories and ledger accounts
    const loadMeta = async () => {
      try {
        const [catRes, accRes] = await Promise.all([
          fetch(`/api/admin/expenses-incomes/categories?type=${selectedType}`),
          fetch('/api/admin/accounts')
        ]);
        if (catRes.ok) {
          const cData = await catRes.json();
          const loadedCategories = cData.categories || [];
          setCategories(loadedCategories);
          const currentCategory = form.getValues('category');
          const isCurrentValid = loadedCategories.some((c: any) => c.name === currentCategory);
          if (!isCurrentValid && loadedCategories.length > 0) {
            form.setValue('category', loadedCategories[0].name);
          }
        }
        if (accRes.ok) {
          const aData = await accRes.json();
          setAccounts(aData.accounts || []);
        }
      } catch (err) {
        console.error('Meta load error in TransactionForm:', err);
      }
    };
    loadMeta();
  }, [selectedType]);

  const onSubmit = async (values: TransactionFormValues) => {
    setLoading(true);
    try {
      const url = initialData ? `/api/admin/expenses-incomes/${initialData._id}` : '/api/admin/expenses-incomes';
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success(`Transaction ${initialData ? 'updated' : 'created'} successfully`);
        if (initialData) {
          onSuccess(true);
        } else {
          form.reset({
            type: form.getValues('type'),
            title: '',
            amount: '' as any,
            category: categories.length > 0 ? categories[0].name : 'Others',
            paymentAccountId: '',
            date: form.getValues('date'),
            description: '',
          });
          onSuccess(false);
          setTimeout(() => {
            titleRef.current?.focus();
          }, 50);
        }
      } else {
        toast.error('Failed to save transaction');
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 text-xs">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Date</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  {...field} 
                  ref={(e) => {
                    field.ref(e);
                    dateRef.current = e;
                  }}
                  className="h-8 text-xs"
                  autoFocus
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs">Transaction Type</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex items-center gap-6 pt-0.5"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="expense" id="type-expense" />
                    <Label htmlFor="type-expense" className="text-rose-600 dark:text-rose-400 font-bold cursor-pointer text-xs select-none">
                      Expense (খরচ)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="income" id="type-income" />
                    <Label htmlFor="type-income" className="text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer text-xs select-none">
                      Income (আয়)
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Category *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c._id} value={c.name} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                    {categories.length === 0 && (
                      <SelectItem value="Others" className="text-xs">Others</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Bank / Cash Account</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a._id} value={a._id} className="text-xs">
                        {a.name} (৳{Math.round(a.currentBalance || 0)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Title / Reason *</FormLabel>
              <FormControl>
                <Input 
                  placeholder={selectedType === 'expense' ? 'e.g. Facebook Ads Campaign / Office Rent' : 'e.g. Direct Sales / Partner Inflow'} 
                  {...field} 
                  ref={(e) => {
                    field.ref(e);
                    titleRef.current = e;
                  }}
                  className="h-8 text-xs"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Amount (৳) *</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Enter amount"
                  {...field} 
                  onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                  ref={(e) => {
                    field.ref(e);
                    amountRef.current = e;
                  }}
                  className="h-8 text-xs text-right font-bold"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Description / Note</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Optional additional notes..." 
                  {...field} 
                  ref={(e) => {
                    field.ref(e);
                    descriptionRef.current = e;
                  }}
                  className="text-xs min-h-[60px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button ref={submitBtnRef} type="submit" className="w-full h-8 font-bold text-xs" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          {initialData ? 'Update' : 'Confirm & Record'} {selectedType === 'expense' ? 'Expense' : 'Income'}
        </Button>
      </form>
    </Form>
  );
}
