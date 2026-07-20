'use client';

import { useEffect, useState, useRef } from 'react';
import { notifApi } from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  entiteCible?: string;
  entiteCibleId?: string;
  message?: string;
  dateCreation: string;
  lue: boolean;
}

const getMessageFromType = (type: string) => {
  switch (type) {
    case 'NOUVELLE_INVITATION': return 'Nouvelle invitation de collaboration reçue.';
    case 'NOUVEAU_MESSAGE': return 'Vous avez un nouveau message.';
    case 'COLLABORATION_ACCEPTEE': return 'Une invitation a été acceptée.';
    case 'COLLABORATION_REFUSEE': return 'Une invitation a été refusée.';
    case 'CONTENU_SOUMIS': return 'Un contenu a été soumis pour validation.';
    case 'CONTENU_VALIDE': return 'Votre contenu a été validé !';
    case 'PAIEMENT_RECU': return 'Paiement confirmé.';
    case 'AVERTISSEMENT_SIGNALEMENT': return '⚠️ Vous avez reçu un avertissement de l\'équipe de modération.';
    case 'SIGNALEMENT_TRAITE': return 'Votre signalement a été traité.';
    default: return 'Nouvelle notification.';
  }
};

export default function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await notifApi.lister() as Notification[];
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.lue).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notifApi.marquerLue(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lue: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(notifications.filter(n => !n.lue).map(n => notifApi.marquerLue(n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, lue: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-bento border border-gray-100 z-50"
        >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Aucune notification
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notif.lue ? 'bg-brand-50' : ''
                  }`}
                  onClick={() => !notif.lue && markAsRead(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      !notif.lue ? 'bg-brand-600' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{getMessageFromType(notif.type)}</p>
                      {notif.message && (
                        <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.dateCreation).toLocaleString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
