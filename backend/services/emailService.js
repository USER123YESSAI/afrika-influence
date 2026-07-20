// backend/services/emailService.js
import axios from 'axios';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export async function sendEmail({ to, subject, htmlContent, textContent }) {
  if (!process.env.BREVO_API_KEY) {
    console.warn('[emailService] BREVO_API_KEY not configured, skipping email send');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const response = await axios.post(
      BREVO_API_URL,
      {
        sender: {
          name: 'Afrika Influence Hub',
          email: process.env.BREVO_SENDER_EMAIL || 'noreply@afrikainfluence.com',
        },
        to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
        subject,
        htmlContent,
        textContent: textContent || htmlContent.replace(/<[^>]*>/g, ''),
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('[emailService] Email sent successfully:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[emailService] Error sending email:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}

export async function sendWelcomeEmail(email, nom) {
  const subject = 'Bienvenue sur Afrika Influence Hub';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Bienvenue sur Afrika Influence Hub, ${nom} !</h2>
      <p>Merci de vous être inscrit sur notre plateforme de marketing d'influence africaine.</p>
      <p>Votre compte est actuellement en attente de validation par notre équipe.</p>
      <p>Vous serez notifié dès que votre compte sera validé.</p>
      <p style="color: #666;">Cordialement,<br>L'équipe Afrika Influence Hub</p>
    </div>
  `;

  return sendEmail({ to: email, subject, htmlContent });
}

export async function sendPasswordResetEmail(email, resetLink) {
  const subject = 'Réinitialisation de votre mot de passe';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Réinitialisation de mot de passe</h2>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
      <p><a href="${resetLink}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a></p>
      <p style="color: #666;">Ce lien expire dans 1 heure.</p>
      <p style="color: #666;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
      <p style="color: #666;">Cordialement,<br>L'équipe Afrika Influence Hub</p>
    </div>
  `;

  return sendEmail({ to: email, subject, htmlContent });
}

export async function sendAccountValidatedEmail(email, nom) {
  const subject = 'Votre compte a été validé';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Félicitations, ${nom} !</h2>
      <p>Votre compte Afrika Influence Hub a été validé avec succès.</p>
      <p>Vous pouvez maintenant vous connecter et commencer à utiliser la plateforme.</p>
      <p style="color: #666;">Cordialement,<br>L'équipe Afrika Influence Hub</p>
    </div>
  `;

  return sendEmail({ to: email, subject, htmlContent });
}

export async function sendAccountRejectedEmail(email, nom, raison) {
  const subject = 'Votre compte a été rejeté';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">Compte rejeté</h2>
      <p>Bonjour ${nom},</p>
      <p>Nous regrettons de vous informer que votre compte a été rejeté.</p>
      ${raison ? `<p>Raison : ${raison}</p>` : ''}
      <p>Si vous pensez qu'il s'agit d'une erreur, veuillez nous contacter.</p>
      <p style="color: #666;">Cordialement,<br>L'équipe Afrika Influence Hub</p>
    </div>
  `;

  return sendEmail({ to: email, subject, htmlContent });
}

export async function sendNewInvitationEmail(email, createurNom, campagneTitre) {
  const subject = 'Nouvelle invitation de collaboration';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Nouvelle invitation !</h2>
      <p>Bonjour ${createurNom},</p>
      <p>Vous avez reçu une nouvelle invitation pour la campagne <strong>${campagneTitre}</strong>.</p>
      <p>Connectez-vous à votre espace créateur pour l'accepter ou la refuser.</p>
      <p style="color: #666;">Cordialement,<br>L'équipe Afrika Influence Hub</p>
    </div>
  `;
  return sendEmail({ to: email, subject, htmlContent });
}

export async function sendNewMessageEmail(email, destinataireNom, expediteurNom, campagneTitre) {
  const subject = 'Nouveau message reçu';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Nouveau message !</h2>
      <p>Bonjour ${destinataireNom},</p>
      <p>Vous avez reçu un nouveau message de <strong>${expediteurNom}</strong> concernant la collaboration <strong>${campagneTitre}</strong>.</p>
      <p>Connectez-vous pour lire le message et y répondre.</p>
      <p style="color: #666;">Cordialement,<br>L'équipe Afrika Influence Hub</p>
    </div>
  `;
  return sendEmail({ to: email, subject, htmlContent });
}

export const MOTIF_LABELS = {
  COMPORTEMENT_INAPPROPRIE: 'Comportement inapproprié',
  NON_RESPECT_ACCORD: 'Non-respect de l\'accord',
  CONTENU_FRAUDULEUX: 'Contenu frauduleux',
  PAIEMENT_NON_RECU: 'Paiement non reçu',
  COMMUNICATION_ABUSIVE: 'Communication abusive',
  AUTRE: 'Autre',
};

export async function sendAvertissementEmail(email, nom, motif, decisionAdmin) {
  const subject = 'Avertissement de l\'équipe de modération';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">Avertissement</h2>
      <p>Bonjour ${nom},</p>
      <p>Un signalement vous concernant a été examiné et jugé fondé par notre équipe de modération.</p>
      <p><strong>Motif :</strong> ${MOTIF_LABELS[motif] || motif}</p>
      ${decisionAdmin ? `<p><strong>Message de la modération :</strong> ${decisionAdmin}</p>` : ''}
      <p>Nous vous invitons à respecter les règles de la plateforme afin d'éviter toute sanction ultérieure (suspension du compte).</p>
      <p style="color: #666;">Cordialement,<br>L'équipe Afrika Influence Hub</p>
    </div>
  `;
  return sendEmail({ to: email, subject, htmlContent });
}

export async function sendPaymentNotificationEmail(email, nom, montant, reference) {
  const subject = 'Confirmation de paiement';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Paiement confirmé !</h2>
      <p>Bonjour ${nom},</p>
      <p>Nous vous confirmons le paiement d'un montant de <strong>${montant} FCFA</strong> (Réf: ${reference}).</p>
      <p>Connectez-vous à votre tableau de bord pour plus de détails.</p>
      <p style="color: #666;">Cordialement,<br>L'équipe Afrika Influence Hub</p>
    </div>
  `;
  return sendEmail({ to: email, subject, htmlContent });
}
