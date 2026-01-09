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
    const authData = {
      username: import.meta.env.VITE_SKILL_USERNAME?.trim(),
      password: import.meta.env.VITE_SKILL_PASSWORD?.trim(),
      companyAuthId: import.meta.env.VITE_SKILL_COMPANY_AUTH_ID?.trim(),
      companyId: ""
    };
    
    console.log('Autenticando en:', BASE_URL + '/authenticate');
    
    const response = await skillApi.post('/authenticate', authData);
    console.log('Respuesta Auth:', response.data);
    
    if (response.data.success === false) {
      throw new Error(`Error Skill API (${response.data.errorCode}): ${response.data.errorMessage || 'Credenciales inválidas'}`);
    }
    
    const token = response.data.result?.token || response.data.token;
    if (!token) throw new Error('No se encontró el token en la respuesta');
    return token;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error en autenticación:', error.response?.data || error.message);
    } else {
      console.error('Error en autenticación:', error);
    }
    throw error;
  }
};

export const getEvents = async (token: string, idData: number, startDate: string, endDate: string) => {
  try {
    const response = await skillApi.post('/events', {
      Events: {
        startDate,
        endDate
      }
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        idData: idData,
        companyAuthId: import.meta.env.VITE_SKILL_COMPANY_AUTH_ID?.trim(),
      }
    });
    return response.data.result?.events || response.data.events || [];
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error al obtener eventos:', error.response?.data || error.message);
    } else {
      console.error('Error al obtener eventos:', error);
    }
    throw error;
  }
};

export default skillApi;
