export const getEmailTemplate = (title: string, content: string, actionText?: string, actionUrl?: string) => {
  const logoUrl = "https://costaricacc.com/cccr/Logoheroica.png";
  
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f7f9; font-family: 'Segoe UI', Arial, sans-serif;">
        <center>
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f7f9; table-layout: fixed;">
                <tr>
                    <td align="center" style="padding: 20px 0;">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px; max-width: 95%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                            <tr>
                                <td align="center" style="background-color: #000000; padding: 40px 20px;">
                                    <!-- Capa blanca para que el logo sea visible -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 4px;">
                                        <tr>
                                            <td style="padding: 8px 15px;">
                                                <img src="${logoUrl}" alt="Grupo Heroica" width="140" border="0" style="display: block; width: 140px; height: auto; outline: none; border: none;">
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #111111; text-transform: uppercase; border-bottom: 3px solid #f0f0f0; padding-bottom: 12px;">
                                        ${title}
                                    </h1>
                                    <div style="font-size: 16px; line-height: 1.8; color: #444444; padding-top: 25px;">
                                        ${content.replace(/class="highlight"/g, 'style="color: #000000; font-weight: 700;"')}
                                    </div>
                                    ${actionText && actionUrl ? `
                                    <div style="text-align: center; padding-top: 35px;">
                                        <a href="${actionUrl}" style="display: inline-block; padding: 16px 32px; background-color: #000000; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; text-transform: uppercase; font-size: 14px;">
                                            ${actionText}
                                        </a>
                                    </div>
                                    ` : ''}
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="background-color: #f9f9f9; padding: 25px 20px; border-top: 1px solid #eeeeee;">
                                    <p style="margin: 0; font-size: 12px; color: #888888;">
                                        &copy; ${new Date().getFullYear()} <strong>Grupo Heroica</strong><br>
                                        Mensaje automático, no responder.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </center>
    </body>
    </html>
  `;
};
