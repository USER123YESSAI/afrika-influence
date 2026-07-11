// backend/services/notificationService.js
import { Notification } from '../models/index.js';

// ─── CRÉER UNE NOTIFICATION ───────────────────────────────────────────────────

export async function creerNotification(destinataireId, type, entiteCible, entiteCibleId) {
  if (!destinataireId || !type) return null;
  try {
    return await Notification.create({
      destinataireId,
      type,
      entiteCible:   entiteCible   || null,
      entiteCibleId: entiteCibleId || null,
      lue:           false,
      dateCreation:  new Date(),
    });
  } catch (err) {
    console.error('[notificationService] Erreur création notification :', err.message);
    return null;
  }
}

export async function getNotifications(utilisateurId) {
  return Notification.findAll({
    where: { destinataireId: utilisateurId },
    order: [['dateCreation', 'DESC']],
    limit: 50,
  });
}

export async function marquerLue(notifId, utilisateurId) {
  const notif = await Notification.findByPk(notifId);
  if (!notif) throw { status: 404, message: 'Notification introuvable.' };
  if (notif.destinataireId !== utilisateurId)
    throw { status: 403, message: 'Accès interdit.' };
  await notif.update({ lue: true });
  return notif;
}

export async function marquerToutesLues(utilisateurId) {
  await Notification.update(
    { lue: true },
    { where: { destinataireId: utilisateurId, lue: false } }
  );
}
