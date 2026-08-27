const wrapperStart = `
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff;">
    <div style="background: #1a2340; padding: 24px 32px; border-radius: 12px 12px 0 0;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align: middle;">
            <table cellpadding="0" cellspacing="0" border="0" style="background: #4ade80; border-radius: 8px; width: 32px; height: 32px;">
              <tr>
                <td align="center" valign="middle" style="width: 32px; height: 32px; color: #1a2340; font-weight: 700; font-size: 16px;">C</td>
              </tr>
            </table>
          </td>
          <td style="padding-left: 10px; vertical-align: middle;">
            <span style="color: #ffffff; font-size: 18px; font-weight: 700;">Competent</span>
          </td>
        </tr>
      </table>
    </div>
    <div style="border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px; padding: 32px;">
`

const wrapperEnd = `
    </div>
    <div style="text-align: center; padding: 24px 0 10px 0;">
      <table cellpadding="0" cellspacing="0" border="0" align="center">
        <tr>
          <td style="vertical-align: middle;">
            <table cellpadding="0" cellspacing="0" border="0" style="background: #1a2340; border-radius: 6px; width: 22px; height: 22px;">
              <tr>
                <td align="center" valign="middle" style="width: 22px; height: 22px; color: #4ade80; font-weight: 700; font-size: 11px;">C</td>
              </tr>
            </table>
          </td>
          <td style="padding-left: 6px; vertical-align: middle;">
            <span style="color: #1A2E4A; font-size: 13px; font-weight: 700;">Competent</span>
          </td>
        </tr>
      </table>
    </div>
    <div style="text-align: center; padding: 0 0 20px 0; color: #9CA3AF; font-size: 11px;">
      Erasmushogeschool Brussel · Toegepaste Informatica
    </div>
  </div>
`

export function stagementorUitnodigingTemplate({ naam, code, link }) {
  return `
    ${wrapperStart}
      <h1 style="color: #1A2E4A; font-size: 20px; font-weight: 700; margin: 0 0 16px 0;">Welkom bij Competent</h1>
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">Beste ${naam},</p>
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
        Je bent toegevoegd als stagementor op het Competent-platform van de Erasmushogeschool Brussel.
        Activeer hieronder je account om aan de slag te gaan.
      </p>
      <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <p style="color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">Activatiecode</p>
        <span style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #1A2E4A;">${code}</span>
      </div>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${link}" style="background: #1A2E4A; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 14px; font-weight: 600;">
          Account activeren
        </a>
      </div>
      <p style="color: #9CA3AF; font-size: 12px; margin: 0;">Deze code is 24 uur geldig.</p>
    ${wrapperEnd}
  `
}

export function stageStatusTemplate({ naam, bedrijf, status, feedback }) {
  const statusConfig = {
    goedgekeurd: { tekst: 'goedgekeurd', kleur: '#065F46', bg: '#D1FAE5' },
    afgekeurd: { tekst: 'afgekeurd', kleur: '#991B1B', bg: '#FEE2E2' },
    aanpassingen: { tekst: 'aanpassingen vereist', kleur: '#92400E', bg: '#FEF3C7' },
  }
  const config = statusConfig[status] || { tekst: status, kleur: '#374151', bg: '#F3F4F6' }

  return `
    ${wrapperStart}
      <h1 style="color: #1A2E4A; font-size: 20px; font-weight: 700; margin: 0 0 16px 0;">Update over je stageaanvraag</h1>
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">Beste ${naam},</p>
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
        Je stageaanvraag bij <strong>${bedrijf}</strong> heeft een update gekregen:
      </p>
      <div style="background: ${config.bg}; border-radius: 8px; padding: 14px 18px; margin-bottom: ${feedback ? '16px' : '24px'}; text-align: center;">
        <span style="color: ${config.kleur}; font-size: 15px; font-weight: 700; text-transform: capitalize;">${config.tekst}</span>
      </div>
      ${feedback ? `
      <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 6px 0;">Feedback</p>
        <p style="color: #374151; font-size: 14px; line-height: 1.5; margin: 0;">${feedback}</p>
      </div>
      ` : ''}
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">
        Log in op het platform voor meer details.
      </p>
    ${wrapperEnd}
  `
}

export function wachtwoordResetTemplate({ naam, code }) {
  return `
    ${wrapperStart}
      <h1 style="color: #1A2E4A; font-size: 20px; font-weight: 700; margin: 0 0 16px 0;">Wachtwoord resetten</h1>
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">Beste ${naam},</p>
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
        Gebruik onderstaande code om je wachtwoord te resetten.
      </p>
      <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 20px;">
        <p style="color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">Resetcode</p>
        <span style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #1A2E4A;">${code}</span>
      </div>
      <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
        Deze code is 15 minuten geldig. Als je dit niet hebt aangevraagd, negeer deze e-mail.
      </p>
    ${wrapperEnd}
  `
}