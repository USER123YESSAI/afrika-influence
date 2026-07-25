'use client';
import Link from 'next/link';

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/landing" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Retour à l'accueil
        </Link>

        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 sm:p-12">
          <div className="mb-10 text-center">
            <h1 className="font-display text-4xl text-gray-900 mb-4">Politique de Confidentialité</h1>
            <p className="text-gray-500">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
          </div>

          <div className="prose prose-brand max-w-none text-gray-600 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p>
                La protection de vos données personnelles est une priorité pour <strong>Afrika Influence Hub</strong>. Cette Politique de Confidentialité explique comment nous collectons, utilisons, partageons et protégeons les informations personnelles des créateurs et des marques utilisant notre plateforme.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Données que nous collectons</h2>
              <p>Nous collectons différentes catégories de données lors de votre utilisation de nos services :</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Données d'identification :</strong> Nom complet, pseudonyme (handle), adresse e-mail.</li>
                <li><strong>Données de profil :</strong> Photo de profil, logo, biographie, pays de résidence, secteurs d'activité (niches).</li>
                <li><strong>Données liées aux réseaux sociaux :</strong> Statistiques d'audience (nombre d'abonnés), liens vers vos comptes réseaux sociaux.</li>
                <li><strong>Données financières :</strong> Informations de paiement (ex: numéros Orange Money ou Wave) nécessaires pour le versement ou la réception de fonds.</li>
                <li><strong>Données d'utilisation :</strong> Historique de vos collaborations, messages échangés via la messagerie interne, logs de connexion.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Utilisation de vos données</h2>
              <p>Vos données personnelles sont utilisées exclusivement pour :</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Fournir, exploiter et améliorer notre plateforme.</li>
                <li>Mettre en relation les créateurs avec les marques correspondant à leur profil et leur audience.</li>
                <li>Traiter les transactions financières et sécuriser les paiements des campagnes.</li>
                <li>Vous envoyer des notifications importantes liées à votre compte (nouvelle offre, validation de contenu, etc.).</li>
                <li>Garantir la sécurité de la plateforme en luttant contre la fraude et les faux profils.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Partage de vos données</h2>
              <p>
                <strong>Profils publics :</strong> Les informations du profil des créateurs (nom, niches, audience, photos) sont visibles par les marques inscrites pour faciliter les propositions de collaboration.
                <br /><br />
                <strong>Tiers de confiance :</strong> Nous ne vendons <strong>jamais</strong> vos données personnelles. Elles peuvent être partagées uniquement avec nos prestataires de paiement sécurisés pour finaliser les transactions, ou avec les autorités compétentes si la loi nous y oblige.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Sécurité de vos données</h2>
              <p>
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles (chiffrement des mots de passe, accès sécurisé par token, certificats SSL) pour protéger vos données contre l'accès, la modification ou la destruction non autorisés.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Vos droits</h2>
              <p>Conformément aux lois applicables sur la protection des données, vous avez le droit de :</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Accéder aux données personnelles que nous détenons à votre sujet.</li>
                <li>Modifier ou corriger vos informations directement depuis votre Espace Profil.</li>
                <li>Demander la suppression complète et définitive de votre compte et de toutes vos données associées.</li>
              </ul>
              <p className="mt-4">
                Pour exercer ces droits, vous pouvez nous contacter via la rubrique Aide de votre espace ou nous écrire à <strong>contact@afrikainfluence.com</strong>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
