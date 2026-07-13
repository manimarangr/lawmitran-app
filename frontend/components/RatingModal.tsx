'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { createRating } from '@/lib/api/ratings';
import Icon from '@/components/ui/Icon';

/** Rate a lawyer after a closed lead — feeds profile ratings and annual awards. */
export function RatingModal({
  leadId,
  lawyerId,
  onClose,
}: {
  leadId: string;
  lawyerId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const m = useMutation({
    mutationFn: () => createRating({ leadId, lawyerId, score, comment: comment || undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-leads'] }),
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rating-title"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-1 flex items-start justify-between">
          <h3 id="rating-title" className="text-lg font-bold text-navy">Rate this lawyer</h3>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <p className="mb-5 text-xs text-slate-500">
          Honest feedback helps other clients choose — and powers our lawyer awards.
        </p>

        {m.isSuccess ? (
          <div className="py-4 text-center">
            <p className="font-bold text-navy">Thanks for the feedback!</p>
            <button onClick={onClose} className="mt-3 text-sm font-semibold text-gold hover:underline">
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {err && (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>
            )}
            <div
              role="radiogroup"
              aria-label="Score out of 5 stars"
              className="flex justify-center gap-1"
              onMouseLeave={() => setHover(0)}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={score === n}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  onClick={() => setScore(n)}
                  onMouseEnter={() => setHover(n)}
                  className={`text-3xl transition ${
                    (hover || score) >= n ? 'text-amber-400' : 'text-slate-200'
                  }`}
                >
                  <Icon name="star-fill" />
                </button>
              ))}
            </div>
            <div>
              <label htmlFor="rating-comment" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
                Comment <span className="font-medium normal-case text-slate-400">(optional)</span>
              </label>
              <textarea
                id="rating-comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was your experience?"
                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
              />
            </div>
            <button
              onClick={() => {
                setErr('');
                if (score === 0) return setErr('Pick a star rating first');
                m.mutate();
              }}
              disabled={m.isPending}
              className="w-full rounded-xl bg-navy py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {m.isPending ? 'Submitting…' : 'Submit rating'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
