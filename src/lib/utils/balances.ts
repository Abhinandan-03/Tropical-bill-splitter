export type GroupExpense = {
  id: string;
  paid_by: string;
  amount: number;
  description: string;
};

export type GroupMember = {
  user_id: string;
  users: { name: string; email: string };
};

export type Balance = {
  fromUser: string;
  fromName: string;
  toUser: string;
  toName: string;
  amount: number;
};

export function calculateBalances(members: GroupMember[], expenses: GroupExpense[]): Balance[] {
  if (members.length === 0 || expenses.length === 0) return [];

  // 1. Calculate net balances for each user
  const netBalances: Record<string, number> = {};
  
  // Initialize balances to 0 for all members
  members.forEach(m => {
    netBalances[m.user_id] = 0;
  });

  // Calculate who paid and what their share is
  expenses.forEach(expense => {
    const amount = Number(expense.amount);
    const splitAmount = amount / members.length;

    // The person who paid gets the total amount added to their balance
    if (netBalances[expense.paid_by] !== undefined) {
      netBalances[expense.paid_by] += amount;
    }

    // Everyone (including the payer) gets the split amount subtracted from their balance
    members.forEach(m => {
      netBalances[m.user_id] -= splitAmount;
    });
  });

  // 2. Separate into debtors (negative balance) and creditors (positive balance)
  type UserBalance = { userId: string; amount: number; name: string };
  const debtors: UserBalance[] = [];
  const creditors: UserBalance[] = [];

  Object.keys(netBalances).forEach(userId => {
    const amount = Math.round(netBalances[userId] * 100) / 100; // Round to 2 decimal places
    const user = members.find(m => m.user_id === userId);
    const name = user?.users?.name || user?.users?.email || 'Unknown User';

    if (amount < -0.01) {
      debtors.push({ userId, amount, name });
    } else if (amount > 0.01) {
      creditors.push({ userId, amount, name });
    }
  });

  // Sort to make the algorithm more efficient (pay largest debts first)
  debtors.sort((a, b) => a.amount - b.amount); // Most negative first
  creditors.sort((a, b) => b.amount - a.amount); // Most positive first

  // 3. Match debtors to creditors
  const settlements: Balance[] = [];
  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];

    const debtAmount = Math.abs(debtor.amount);
    const creditAmount = creditor.amount;

    const settlementAmount = Math.min(debtAmount, creditAmount);

    settlements.push({
      fromUser: debtor.userId,
      fromName: debtor.name,
      toUser: creditor.userId,
      toName: creditor.name,
      amount: Math.round(settlementAmount * 100) / 100
    });

    debtor.amount += settlementAmount;
    creditor.amount -= settlementAmount;

    // Use a small epsilon for floating point comparisons
    if (Math.abs(debtor.amount) < 0.01) d++;
    if (Math.abs(creditor.amount) < 0.01) c++;
  }

  return settlements;
}
