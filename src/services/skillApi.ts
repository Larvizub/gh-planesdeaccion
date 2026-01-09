import axios from 'axios';

const BASE_URL = import.meta.env.VITE_SKILL_API_URL;

const skillApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getAuthToken = async () => {
  try {
    const response = await skillApi.post('/login', {
      username: import.meta.env.VITE_SKILL_USERNAME,
      password: import.meta.env.VITE_SKILL_PASSWORD,
      companyAuthId: import.meta.env.VITE_SKILL_COMPANY_AUTH_ID,
    });
    return response.data.token;
  } catch (error) {
    console.error('Error authenticating with Skill API:', error);
    throw error;
  }
};

export const getEvents = async (token: string, idData: number = 14) => {
  try {
    const response = await skillApi.get('/getevents', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        idData,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching events from Skill API:', error);
    throw error;
  }
};

export default skillApi;
