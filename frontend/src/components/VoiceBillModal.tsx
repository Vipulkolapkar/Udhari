'use client';

import React, { useState } from 'react';
import { X, Mic, MicOff, Check, ArrowRight } from 'lucide-react';
import { Customer, Language } from '../types';
import { getTranslation } from '../lib/translations';

interface VoiceBillModalProps {
  customers: Customer[];
  language: Language;
  onClose: () => void;
  onRecognized: (customer: Customer, amount: number, note: string) => void;
}

export const VoiceBillModal: React.FC<VoiceBillModalProps> = ({
  customers,
  language,
  onClose,
  onRecognized
}) => {
  const t = getTranslation(language);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [extractedData, setExtractedData] = useState<{
    customer: Customer | null;
    amount: number;
    itemsNote: string;
  } | null>(null);

  const samplePrompts = language === 'mr' ? [
    '           ',
    '     ',
    '         ',
  ] : false ? [
    '           ',
    '     ',
    '         ',
  ] : [
    'Sachin Patil 2 notebooks and 1 pen 120 credit',
    'Ramesh Kulkarni xerox copy 500',
    'Santosh Jadhav sunflower oil and sugar 250',
  ];

  const parseSpokenText = (text: string) => {
    let matchedCustomer: Customer | null = null;

    for (const cust of customers) {
      const plainName = cust.name.toLowerCase().split('(')[0].trim();
      const firstName = plainName.split(' ')[0];
      const lastName = plainName.split(' ')[1] || '';

      if (
        text.toLowerCase().includes(plainName) ||
        text.toLowerCase().includes(firstName) ||
        (lastName && text.toLowerCase().includes(lastName))
      ) {
        matchedCustomer = cust;
        break;
      }
    }

    if (!matchedCustomer && customers.length > 0) {
      matchedCustomer = customers[0];
    }

    const numbers = text.match(/\d+/g);
    let amount = 100;
    if (numbers && numbers.length > 0) {
      amount = Number(numbers[numbers.length - 1]);
    }

    setExtractedData({
      customer: matchedCustomer,
      amount: amount,
      itemsNote: text
    });
  };

  const handleStartListening = () => {
    setIsListening(true);
    setTranscript('');

    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      // @ts-expect-error - Webkit vendor prefix
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'mr' ? 'mr-IN' : false ? 'hi-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        setTranscript(spoken);
        parseSpokenText(spoken);
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      setTimeout(() => {
        const demo = samplePrompts[0];
        setTranscript(demo);
        parseSpokenText(demo);
        setIsListening(false);
      }, 1200);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Mic size={18} color="#ffffff" />
            <span>{t.voiceBilling}</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {t.voiceBillingSubtitle}
          </p>

          {/* Minimalist Mic Button */}
          <div style={{ margin: '1.25rem 0', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleStartListening}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: isListening ? '#ffffff' : '#18181b',
                border: isListening ? '2px solid #ffffff' : '1px solid var(--border-medium)',
                color: isListening ? '#000000' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {isListening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
          </div>

          <div style={{ fontSize: '0.8rem', fontWeight: 500, color: isListening ? '#ffffff' : 'var(--text-muted)' }}>
            {isListening ? t.listening : t.tapToStartMic}
          </div>

          {/* Spoken Transcript Box */}
          {transcript && (
            <div style={{
              background: '#18181b',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem',
              marginTop: '1rem',
              textAlign: 'left'
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {t.recognizedSpeech}:
              </span>
              <p style={{ fontSize: '0.9rem', fontWeight: 500, color: '#ffffff', marginTop: '0.2rem' }}>
                &ldquo;{transcript}&rdquo;
              </p>
            </div>
          )}

          {/* Extracted Structured Card */}
          {extractedData && extractedData.customer && (
            <div style={{
              background: '#18181b',
              border: '1px solid #ffffff',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem',
              marginTop: '0.85rem',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ffffff', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                <Check size={13} style={{ display: 'inline', marginRight: '4px' }} />
                {t.extractedInfo}:
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{t.customer}:</span>
                <strong>{extractedData.customer.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{t.amount}:</span>
                <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>₹{extractedData.amount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{t.notes}:</span>
                <span style={{ color: 'var(--text-muted)' }}>{extractedData.itemsNote.slice(0, 30)}...</span>
              </div>
            </div>
          )}

          {/* Sample Prompts */}
          <div style={{ marginTop: '1rem', textAlign: 'left' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {t.trySample}:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
              {samplePrompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="denom-chip"
                  style={{ textAlign: 'left', padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                  onClick={() => {
                    setTranscript(p);
                    parseSpokenText(p);
                  }}
                >
                  &ldquo;{p}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            {t.cancel}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!extractedData || !extractedData.customer}
            onClick={() => {
              if (extractedData && extractedData.customer) {
                onRecognized(extractedData.customer, extractedData.amount, extractedData.itemsNote);
              }
            }}
          >
            {t.proceedToBill}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
