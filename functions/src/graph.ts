import * as msal from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";
import { defineSecret } from "firebase-functions/params";

// Definición de secretos de Firebase
const MS_CLIENT_ID = defineSecret("MICROSOFT_CLIENT_ID");
const MS_CLIENT_SECRET = defineSecret("MICROSOFT_CLIENT_SECRET");
const MS_TENANT_ID = defineSecret("MICROSOFT_TENANT_ID");
const MS_SENDER_EMAIL = defineSecret("MICROSOFT_SENDER_EMAIL");

let clientInstance: Client | null = null;

async function getGraphClient(): Promise<Client> {
  if (clientInstance) return clientInstance;

  const msalConfig = {
    auth: {
      clientId: MS_CLIENT_ID.value(),
      authority: `https://login.microsoftonline.com/${MS_TENANT_ID.value()}`,
      clientSecret: MS_CLIENT_SECRET.value(),
    },
  };

  const cca = new msal.ConfidentialClientApplication(msalConfig);
  
  const tokenResponse = await cca.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });

  if (!tokenResponse) {
    throw new Error("Could not acquire access token for Microsoft Graph");
  }

  clientInstance = Client.init({
    authProvider: (done) => {
      done(null, tokenResponse.accessToken);
    },
  });

  return clientInstance;
}

export async function sendEmail(to: string[], subject: string, htmlContent: string) {
  try {
    const client = await getGraphClient();
    const sender = MS_SENDER_EMAIL.value();

    const email = {
      message: {
        subject: subject,
        body: {
          contentType: "Html",
          content: htmlContent,
        },
        toRecipients: to.map(email => ({
          emailAddress: {
            address: email,
          },
        })),
      },
      saveToSentItems: "false",
    };

    await client.api(`/users/${sender}/sendMail`).post(email);
    console.log(`Email sent successfully to ${to.join(", ")}`);
  } catch (error) {
    console.error("Error sending email via Microsoft Graph:", error);
    throw error;
  }
}
