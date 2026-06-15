import axios from "axios";

const AIRFLOW_BASE_URL = process.env.AIRFLOW_BASE_URL!;
const AIRFLOW_USERNAME = process.env.AIRFLOW_USERNAME!;
const AIRFLOW_PASSWORD = process.env.AIRFLOW_PASSWORD!;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token;
  }

  const response = await axios.post(`${AIRFLOW_BASE_URL}/auth/token`, {
    username: AIRFLOW_USERNAME,
    password: AIRFLOW_PASSWORD,
  });

  const token: string = response.data.access_token;
  // Cache for 23 hours (tokens typically last 24h)
  cachedToken = { token, expiresAt: now + 23 * 60 * 60 * 1000 };
  return token;
}

export async function airflowRequest(
  method: "get" | "post" | "patch" | "delete",
  path: string,
  data?: unknown,
) {
  const token = await getToken();
  const response = await axios({
    method,
    url: `${AIRFLOW_BASE_URL}${path}`,
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  return response.data;
}
