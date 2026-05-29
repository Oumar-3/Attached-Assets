import * as QueryParams from "expo-auth-session/build/QueryParams";

import { getSupabaseClient } from "./client";

function getFriendlyAuthErrorMessage(message: string) {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes("invalid refresh token") || lowerMessage.includes("refresh token not found")) {
    return "Votre ancienne session a expire. Reconnectez-vous.";
  }
  return message;
}

export async function completeOAuthSessionFromUrlAsync(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  await completeOAuthSessionFromParamsAsync(params, errorCode);
}

export async function completeOAuthSessionFromParamsAsync(
  params: Record<string, string>,
  errorCode?: string | null,
) {
  if (errorCode) throw new Error(errorCode);

  const supabase = getSupabaseClient();
  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw new Error(getFriendlyAuthErrorMessage(error.message));
    return;
  }

  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw new Error(getFriendlyAuthErrorMessage(error.message));
  }
}
