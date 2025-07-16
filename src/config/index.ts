import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

export const API_URL        = extra.API_URL!;
export const AUTH0_DOMAIN   = extra.AUTH0_DOMAIN!;
export const AUTH0_CLIENT_ID = extra.AUTH0_CLIENT_ID!;
export const AUTH0_AUDIENCE = extra.AUTH0_AUDIENCE!;
