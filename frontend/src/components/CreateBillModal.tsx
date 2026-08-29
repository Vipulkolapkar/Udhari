'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Loader2, Tag, Calendar, User, ShoppingBag } from 'lucide-react';
import { Customer, InvoiceItem, Language, ShopUser } from '../types';
import { getTranslation } from '../lib/translations';
import { CATEGORY_PRESET_ITEMS } from '../lib/mockData';

interface CreateBillModalProps {
  customer: Customer;
  currentShop: ShopUser | null;
  language: Language;
  onClose: () => void;
  onSubmit: (
    customerId: string,
    billData: {
      items: InvoiceItem[];
      total_amount: number;
      discount_amount: number;
      taken_by_name?: string;
      notes?: string;
      due_date?: string;
    }
  ) => void;
}

export const CreateBillModal: React.FC<CreateBillModalProps> = ({
  customer,
  currentShop,
  language,
  onClose,
  onSubmit
}) => {
  const t = getTranslation(language);
  const shopCategory = currentShop?.shop_category || 'GENERAL';
  const presets = CATEGORY_PRESET_ITEMS[shopCategory] || CATEGORY_PRESET_ITEMS.GENERAL;

  const [items, setItems] = useState<{ id: string; name: string; quantity: number; price: number }[]>([
    { id: '1', name: presets[0]?.name || t.itemName, quantity: 1, price: presets[0]?.price || 50 }
  ]);
  const [takenBy, setTakenBy] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  const addItemRow = (name = '', price = 0, quantity = 1) => {
    setItems((prev) => [
      ...prev,
      { id: String(Date.now() + Math.random()), name, quantity, price }
    ]);
  };

  const removeItemRow = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: 'name' | 'quantity' | 'price', value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
  const netTotal = Math.max(0, subtotal - (Number(discountAmount) || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (netTotal <= 0) return;

    const formattedItems: InvoiceItem[] = items.map((item) => ({
      id: `item_${Date.now()}_${Math.random()}`,
      invoice_id: '',
      item_name: item.name.trim() || t.itemName,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.price) || 0,
      subtotal: (Number(item.quantity) || 1) * (Number(item.price) || 0)
    }));

    onSubmit(customer.id, {
      items: formattedItems,
      total_amount: netTotal,
      discount_amount: Number(discountAmount) || 0,
      taken_by_name: takenBy.trim() || undefined,
      notes: notes.trim() || undefined,
      due_date: dueDate || undefined
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <ShoppingBag size={18} color="#ffffff" />
            <span>{t.giveCredit} — {customer.name}</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Preset Items Chips */}
            <div className="form-group">
              <label className="form-label">{t.quickPresets}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {presets.slice(0, 8).map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className="denom-chip"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                    onClick={() => addItemRow(preset.name, preset.price, 1)}
                  >
                    + {preset.name.split(' ')[0]} (₹{preset.price})
                  </button>
                ))}
              </div>
            </div>

            {/* Items Table */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">{t.itemsList}</label>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ minHeight: '30px', padding: '0.2rem 0.65rem', fontSize: '0.78rem' }}
                  onClick={() => addItemRow('', 0, 1)}
                >
                  <Plus size={13} /> {t.addItem}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 75px 85px 36px',
                      gap: '0.4rem',
                      alignItems: 'center'
                    }}
                  >
                    <input
                      type="text"
                      className="form-input"
                      placeholder={t.itemName}
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      placeholder={t.qty}
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                      required
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="form-input"
                      placeholder={t.rate}
                      value={item.price}
                      onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                      required
                    />
                    <button
                      type="button"
                      className="icon-btn"
                      style={{ color: 'var(--color-debit)' }}
                      onClick={() => removeItemRow(item.id)}
                      disabled={items.length <= 1}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Extra Metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">{t.takenBy}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={language === 'mr' ? '.  / ' : false ? '.  / ' : 'e.g. Self / Assistant'}
                  value={takenBy}
                  onChange={(e) => setTakenBy(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.dueDate}
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Chillar Waiver & Net Total */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', alignItems: 'center' }}>
              <div className="form-group">
                <label className="form-label">{t.discountWaived} (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="0"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                />
              </div>

              <div style={{ textAlign: 'right', background: '#18181b', border: '1px solid var(--border-subtle)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.total}</span>
                <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                  ₹{netTotal.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              {t.cancel}
            </button>
            <button type="submit" className="btn btn-primary">
              + {t.save} (₹{netTotal})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
