import { Op } from 'sequelize';
import crypto from 'crypto';

const PAYTECH_URL = 'https://paytech.sn/api/payment/request-payment';

// ─── Vérification d'authenticité des notifications IPN PayTech ────────────
// Documentation officielle : https://docs.intech.sn/doc_paytech.php#ipnfonctionment
//
// PayTech propose 2 méthodes de vérification. On implémente les deux, avec
// priorité à la méthode HMAC (recommandée par PayTech) :
//
//  1) HMAC-SHA256 (si le champ hmac_compute est présent dans la notif) :
//     message = `${final_item_price || item_price}|${ref_command}|${API_KEY}`
//     hmac    = HMAC_SHA256(message, API_SECRET)
//
//  2) SHA256 des clés (fallback) :
//     api_key_sha256    doit égaler SHA256(notre API_KEY)
//     api_secret_sha256 doit égaler SHA256(notre API_SECRET)
//
// Sans cette vérification, n'importe qui peut POST sur /api/paiements/confirmer
// et faire passer un paiement en "CONFIRME" sans jamais avoir payé.
export const verifierIPN = (body) => {
  const apiKey = process.env.PAYTECH_API_KEY;
  const apiSecret = process.env.PAYTECH_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error('[verifierIPN] PAYTECH_API_KEY / PAYTECH_API_SECRET manquants côté serveur.');
    return false;
  }

  // Compare deux chaînes de longueur potentiellement différente sans lever
  // d'exception et en temps constant (évite les attaques par timing).
  const comparerEnSecurite = (a, b) => {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  };

  const { hmac_compute, ref_command, item_price, final_item_price, api_key_sha256, api_secret_sha256 } = body;

  // ─── Méthode 1 : HMAC-SHA256 (recommandée) ───────────────────────────────
  if (hmac_compute) {
    const prix = final_item_price ?? item_price;
    const message = `${prix}|${ref_command}|${apiKey}`;
    const hmacAttendu = crypto.createHmac('sha256', apiSecret).update(message).digest('hex');
    return comparerEnSecurite(hmacAttendu, String(hmac_compute));
  }

  // ─── Méthode 2 : SHA256 des clés (fallback) ──────────────────────────────
  if (api_key_sha256 && api_secret_sha256) {
    const keyAttendu = crypto.createHash('sha256').update(apiKey).digest('hex');
    const secretAttendu = crypto.createHash('sha256').update(apiSecret).digest('hex');
    return (
      comparerEnSecurite(keyAttendu, String(api_key_sha256)) &&
      comparerEnSecurite(secretAttendu, String(api_secret_sha256))
    );
  }

  // Ni hmac_compute, ni les hachages SHA256 : notification non vérifiable → rejetée.
  return false;
};

export const initierPaytech = async ({ refCommand, itemName, montant, ipnUrl, successUrl, cancelUrl }) => {
  const response = await fetch(PAYTECH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API_KEY': process.env.PAYTECH_API_KEY,
      'API_SECRET': process.env.PAYTECH_API_SECRET,
    },
    body: JSON.stringify({
      item_name: itemName,
      item_price: Math.round(montant),
      currency: 'XOF',
      ref_command: refCommand,
      command_name: `Paiement Afrika Influence — ${itemName}`,
      env: process.env.PAYTECH_ENV || 'test',
      ipn_url: ipnUrl,
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayTech error ${response.status}: ${text}`);
  }

  return response.json();
};

export const genererNumeroFacture = async (Paiement) => {
  const count = await Paiement.count({ where: { numeroFacture: { [Op.not]: null } } });
  return `FAC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};

export const genererNumeroRecu = async (Paiement) => {
  const count = await Paiement.count({ where: { numeroRecuCreateur: { [Op.not]: null } } });
  return `REC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};