'use client';

import { useState } from 'react';
import { avisApi } from '@/lib/api';

interface Props {
  cibleId: string;
  collaborationId: string;
  onReviewSubmitted?: () => void;
}

export default function AvisForm({ cibleId, onReviewSubmitted }: Props) {
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await avisApi.creer({ cibleId, note, commentaire: commentaire || undefined });
      setSuccess(true);
      setCommentaire('');
      setNote(5);
      onReviewSubmitted?.();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la soumission de l\'avis');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-2">⭐</div>
        <h3 className="font-semibold text-emerald-800 mb-1">Avis envoyé !</h3>
        <p className="text-sm text-emerald-600">Merci pour votre retour.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-bento p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Laisser un avis</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setNote(star)}
                className="text-3xl transition-transform hover:scale-110 focus:outline-none"
              >
                {star <= note ? '⭐' : '☆'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire (optionnel)</label>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            rows={3}
            placeholder="Partagez votre expérience..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-emerald text-white py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-bento hover-lift"
        >
          {loading ? 'Envoi en cours...' : 'Envoyer mon avis'}
        </button>
      </form>
    </div>
  );
}
