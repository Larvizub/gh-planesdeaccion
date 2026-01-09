import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios, { AxiosRequestConfig, Method } from "axios";
import corsLib from "cors";

const cors = corsLib({ origin: true });

admin.initializeApp();

const SKILL_BASE_URL = "https://grupoheroicaapi.skillsuite.net/app/wssuite/api";

export const skillProxy = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    const fullPath = req.url || "";
    const cleanPath = fullPath.replace(/^\/api-skill/, "");

    try {
      const url = `${SKILL_BASE_URL}${cleanPath}`;
      console.log(`Proxying ${req.method} to: ${url}`);

      const config: AxiosRequestConfig = {
        method: req.method as Method,
        url: url,
        data: req.body,
        headers: {
          "Content-Type": "application/json",
          "idData": (req.headers["iddata"] as string) || "",
          "companyAuthId": (req.headers["companyauthid"] as string) || "",
          "Authorization": (req.headers["authorization"] as string) || "",
        },
      };

      const response = await axios(config);
      res.status(200).json(response.data);
    } catch (error: any) {
      console.error("Proxy Error:", error.response?.data || error.message);
      const status = error.response?.status || 500;
      const errorData = error.response?.data || { errorMessage: error.message };
      res.status(status).json(errorData);
    }
  });
});
