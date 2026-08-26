import { Invoice, PaymentAllocation } from '../types';

export interface FIFOSimulationResult {
  allocations: {
    invoice_id: string;
    invoice_number: string;
    allocated_amount: number;
    pending_before: number;
    pending_after: number;
    resulting_status: 'PAID' | 'PARTIAL';
  }[];
  remaining_unallocated: number;
  total_settled: number;
}

/**
 * Calculates FIFO (First-In, First-Out) payment distribution across unpaid invoices.
 * Oldest invoices (by created_at) are settled first.
 */
export function simulateFIFOPayment(
  invoices: Invoice[],
  paymentAmount: number,
  discountWaived: number = 0
): FIFOSimulationResult {
  // Sort unpaid/partial invoices chronologically
  const activeInvoices = invoices
    .filter((inv) => inv.status === 'UNPAID' || inv.status === 'PARTIAL')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  let remainingCash = paymentAmount + discountWaived;
  const allocations: FIFOSimulationResult['allocations'] = [];
  let totalSettled = 0;

  for (const inv of activeInvoices) {
    if (remainingCash <= 0) break;

    const pendingOnInv = Math.max(0, inv.total_amount - inv.paid_amount - inv.discount_amount);
    if (pendingOnInv <= 0) continue;

    const allocAmount = Math.min(remainingCash, pendingOnInv);
    const pendingAfter = pendingOnInv - allocAmount;
    const isFullyPaid = pendingAfter <= 0.01; // Avoid floating point epsilon

    allocations.push({
      invoice_id: inv.id,
      invoice_number: inv.invoice_number,
      allocated_amount: allocAmount,
      pending_before: pendingOnInv,
      pending_after: Math.max(0, pendingAfter),
      resulting_status: isFullyPaid ? 'PAID' : 'PARTIAL'
    });

    remainingCash -= allocAmount;
    totalSettled += allocAmount;
  }

  return {
    allocations,
    remaining_unallocated: Math.max(0, remainingCash),
    total_settled: totalSettled
  };
}
