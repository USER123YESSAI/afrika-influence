'use client';
import { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface Props {
  url: string;
  onClose: () => void;
}

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const resolveUrl = (url: string) => (url.startsWith('http') ? url : `${BASE}${url}`);
const isHosted = (url: string) => url.startsWith('/uploads/');
const extension = (url: string) => url.split('.').pop()?.toLowerCase().split('?')[0] ?? '';

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const VIDEO_EXT = ['mp4', 'mov', 'webm'];

// Aperçu intelligent : un fichier qu'on héberge (image/vidéo) s'affiche directement
// dans la popup ; un lien externe (Instagram, TikTok...) ne peut pas être embarqué
// (ces plateformes le bloquent volontairement) — on propose alors juste de l'ouvrir.
export default function ContenuViewerModal({ url, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const hosted = isHosted(url);
  const ext = extension(url);
  const resolved = resolveUrl(url);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative max-w-3xl max-h-[85vh] w-full" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute -top-10 right-0 text-white/80 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          {hosted && IMAGE_EXT.includes(ext) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolved} alt="Contenu soumis" className="w-full max-h-[80vh] object-contain bg-gray-50" />
          ) : hosted && VIDEO_EXT.includes(ext) ? (
            <video src={resolved} controls autoPlay className="w-full max-h-[80vh] bg-black" />
          ) : hosted ? (
            <div className="p-10 text-center">
              <p className="text-sm text-gray-500 mb-4">Aperçu non disponible pour ce type de fichier.</p>
              <a href={resolved} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-emerald-600 font-medium hover:underline">
                <ExternalLink size={16} /> Ouvrir le fichier
              </a>
            </div>
          ) : (
            <div className="p-10 text-center">
              <p className="text-sm text-gray-500 mb-4">
                Ce contenu est hébergé sur une plateforme externe et ne peut pas être prévisualisé ici.
              </p>
              <a href={resolved} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-emerald-600 font-medium hover:underline break-all">
                <ExternalLink size={16} /> {resolved}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
