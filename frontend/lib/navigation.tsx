import React from 'react';
import {
  IconHome, IconUsers, IconSignal, IconHistory,
  IconOffer, IconCollab, IconMsg, IconCampaign,
  IconPayment, IconProfile, IconContent, IconWallet, IconStar
} from '@/components/ui/Icons';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function getSidebarConfig(role: string): { nav: NavItem[], roleLabel: string, roleColor: string } {
  switch (role) {
    case 'ADMINISTRATEUR':
      return {
        roleLabel: 'Administrateur',
        roleColor: 'bg-red-500/20 text-red-100',
        nav: [
          { href: '/admin/dashboard',     label: 'Tableau de bord', icon: <IconHome /> },
          { href: '/admin/utilisateurs',  label: 'Utilisateurs',    icon: <IconUsers /> },
          { href: '/admin/transactions',  label: 'Transactions',    icon: <IconWallet /> },
          { href: '/admin/signalements',  label: 'Signalements',    icon: <IconSignal /> },
          { href: '/admin/logs',          label: 'Journaux',        icon: <IconHistory /> },
        ]
      };
    case 'MODERATEUR':
      return {
        roleLabel: 'Modérateur',
        roleColor: 'bg-brand-400/20 text-brand-100',
        nav: [
          { href: '/moderateur/dashboard',    label: 'Tableau de bord',     icon: <IconHome /> },
          { href: '/moderateur/campagnes',    label: 'Campagnes',           icon: <IconCampaign /> },
          { href: '/moderateur/signalements', label: 'Signalements',        icon: <IconSignal /> },
          { href: '/moderateur/contenus',     label: 'Contenus',            icon: <IconContent /> },
          { href: '/moderateur/historique',   label: 'Mon historique',      icon: <IconHistory /> },
        ]
      };
    case 'CREATEUR':
      return {
        roleLabel: 'Créateur',
        roleColor: 'bg-brass-500/20 text-brass-300',
        nav: [
          { href: '/createur/dashboard', label: 'Tableau de bord', icon: <IconHome /> },
          { href: '/createur/campagnes', label: 'Campagnes',       icon: <IconCampaign /> },
          { href: '/createur/favoris',   label: 'Favoris',         icon: <IconStar /> },
          { href: '/createur/offres',    label: 'Mes offres',      icon: <IconOffer /> },
          { href: '/collaborations',     label: 'Collaborations',  icon: <IconCollab /> },
          { href: '/messages',           label: 'Messages',        icon: <IconMsg /> },
          { href: '/paiements',          label: 'Paiements',       icon: <IconPayment /> },
        ]
      };
    case 'ENTREPRISE':
      return {
        roleLabel: 'Entreprise',
<<<<<<< Updated upstream
        roleColor: 'bg-white/10 text-white',
=======
        roleColor: 'bg-brand-400/20 text-brand-100',
>>>>>>> Stashed changes
        nav: [
          { href: '/entreprise/dashboard', label: 'Tableau de bord', icon: <IconHome /> },
          { href: '/campagnes',            label: 'Mes campagnes',   icon: <IconCampaign /> },
          { href: '/entreprise/createurs', label: 'Créateurs',       icon: <IconUsers /> },
          { href: '/collaborations',       label: 'Collaborations',  icon: <IconCollab /> },
          { href: '/entreprise/solde',     label: 'Mon solde',       icon: <IconWallet /> },
          { href: '/paiements',            label: 'Paiements',       icon: <IconPayment /> },
          { href: '/entreprise/profil',    label: 'Mon profil',      icon: <IconProfile /> },
        ]
      };
    case 'PARTICULIER':
      return {
        roleLabel: 'Particulier',
<<<<<<< Updated upstream
        roleColor: 'bg-white/10 text-white',
=======
        roleColor: 'bg-brand-400/20 text-brand-100', // Match entreprise theme
>>>>>>> Stashed changes
        nav: [
          { href: '/entreprise/dashboard', label: 'Tableau de bord', icon: <IconHome /> },
          { href: '/campagnes',            label: 'Mes campagnes',   icon: <IconCampaign /> },
          { href: '/entreprise/createurs', label: 'Créateurs',       icon: <IconUsers /> },
          { href: '/collaborations',       label: 'Collaborations',  icon: <IconCollab /> },
          { href: '/entreprise/solde',     label: 'Mon solde',       icon: <IconWallet /> },
          { href: '/paiements',            label: 'Paiements',       icon: <IconPayment /> },
          { href: '/entreprise/profil',    label: 'Mon profil',      icon: <IconProfile /> },
        ]
      };
    default:
      return {
        roleLabel: 'Utilisateur',
        roleColor: 'bg-gray-400/20 text-gray-100',
        nav: []
      };
  }
}
