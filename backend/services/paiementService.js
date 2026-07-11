import { Op } from 'sequelize';

const PAYTECH_URL = 'https://paytech.sn/api/payment/request-payment';

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
