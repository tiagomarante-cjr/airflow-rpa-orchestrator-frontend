import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export type AppSession = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
  };
};

export async function getAppSession(): Promise<AppSession | null> {
  return getServerSession(authOptions) as Promise<AppSession | null>;
}
