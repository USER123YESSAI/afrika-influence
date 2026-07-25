'use client';
import Link from 'next/link';

export default function ConditionsUtilisationPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/landing" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Retour à l'accueil
        </Link>

        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 sm:p-12">
          <div className="mb-10 text-center">
            <h1 className="font-display text-4xl text-gray-900 mb-4">Conditions d'Utilisation</h1>
            <p className="text-gray-500">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
          </div>

          <div className="prose prose-emerald max-w-none text-gray-600 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p>
                Bienvenue sur <strong>Afrika Influence Hub</strong>. En accédant à notre plateforme et en l'utilisant, vous acceptez d'être lié par les présentes Conditions Générales d'Utilisation (CGU). Ces conditions régissent l'accès et l'utilisation des services proposés par Afrika Influence, visant à mettre en relation des créateurs de contenu (influenceurs) et des marques en Afrique.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Inscription et Compte</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Vous devez fournir des informations exactes, complètes et à jour lors de la création de votre compte.</li>
                <li>Vous êtes responsable de la sécurité de votre mot de passe et de toute activité effectuée sous votre compte.</li>
                <li>La plateforme se réserve le droit de suspendre ou supprimer un compte en cas de fausse déclaration ou d'usurpation d'identité.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Règles pour les Créateurs</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Authenticité :</strong> Il est strictement interdit d'utiliser des robots, d'acheter des abonnés ou de générer du faux engagement pour gonfler vos statistiques.</li>
                <li><strong>Engagements :</strong> Lorsqu'une collaboration est acceptée, le créateur s'engage à livrer le contenu dans les délais impartis et en respectant le brief de la marque.</li>
                <li><strong>Conformité :</strong> Le contenu publié ne doit pas être illégal, diffamatoire, obscène ou enfreindre les droits d'auteur de tiers.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Règles pour les Marques</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Les marques s'engagent à fournir des briefs clairs et précis pour leurs campagnes.</li>
                <li>Les marques doivent s'acquitter des paiements convenus selon les termes de la plateforme avant le lancement effectif ou la validation de la campagne.</li>
                <li>Il est interdit de contourner la plateforme pour contractualiser directement avec un créateur découvert via Afrika Influence dans le but d'éviter les frais de service.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Paiements et Rémunération</h2>
              <p>
                Les paiements sont sécurisés par Afrika Influence. Les fonds de la marque sont bloqués jusqu'à la validation de la livraison par le créateur. Afrika Influence prélève une commission sur les transactions pour couvrir les frais de fonctionnement de la plateforme. Les créateurs sont responsables de déclarer leurs revenus aux autorités fiscales de leur pays de résidence.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Propriété Intellectuelle</h2>
              <p>
                Sauf accord contraire explicite conclu entre la marque et le créateur lors de l'acceptation de la campagne, le créateur conserve les droits d'auteur sur son contenu, mais concède à la marque une licence d'utilisation à des fins promotionnelles selon les termes définis dans la collaboration.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Modification des conditions</h2>
              <p>
                Afrika Influence se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de tout changement majeur. La poursuite de l'utilisation de la plateforme après modification vaut acceptation des nouvelles conditions.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
