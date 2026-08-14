export function stagementorUitnodigingTemplate({ naam, code, link }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">Welkom bij Competent</h2>
      <p>Beste ${naam},</p>
      <p>Je bent toegevoegd als stagementor in het Competent platform van EhB.</p>
      <p>Gebruik de volgende code om je account te activeren:</p>
      <div style="background: #f3f4f6; padding: 16px; text-align: center; border-radius: 8px; margin: 16px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1e3a5f;">${code}</span>
      </div>
      <p>
        <a href="${link}" style="background: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Account activeren
        </a>
      </p>
      <p style="color: #6b7280; font-size: 12px;">Deze code is 24 uur geldig.</p>
    </div>
  `
}

export function stageStatusTemplate({ naam, bedrijf, status, feedback }) {
  const statusTekst = {
    goedgekeurd: 'goedgekeurd',
    afgekeurd: 'afgekeurd',
    aanpassingen: 'aanpassingen vereist voor',
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">Update over je stageaanvraag</h2>
      <p>Beste ${naam},</p>
      <p>Je stageaanvraag bij <strong>${bedrijf}</strong> is ${statusTekst[status] || status}.</p>
      ${feedback ? `<p style="background: #f3f4f6; padding: 12px; border-radius: 8px;"><strong>Feedback:</strong> ${feedback}</p>` : ''}
      <p>Log in op het platform om meer details te bekijken.</p>
    </div>
  `
}

export function wachtwoordResetTemplate({ naam, code }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">Wachtwoord resetten</h2>
      <p>Beste ${naam},</p>
      <p>Gebruik de volgende code om je wachtwoord te resetten:</p>
      <div style="background: #f3f4f6; padding: 16px; text-align: center; border-radius: 8px; margin: 16px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1e3a5f;">${code}</span>
      </div>
      <p style="color: #6b7280; font-size: 12px;">Deze code is 15 minuten geldig. Als je dit niet hebt aangevraagd, negeer deze e-mail.</p>
    </div>
  `
}