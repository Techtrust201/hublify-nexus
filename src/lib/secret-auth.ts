const SECRET_DEV = "dev-uniquement-32-caracteres-min";

/** Secret de session. En production, l'absence de secret dédié arrête le serveur. */
export function resoudreSecretAuth(env: {
  secret: string | undefined;
  nodeEnv: string | undefined;
}) {
  const secret = env.secret?.trim() ?? "";
  if (env.nodeEnv === "production") {
    if (secret.length < 32 || secret === SECRET_DEV) {
      throw new Error("BETTER_AUTH_SECRET manquant ou trop faible pour la production");
    }
    return secret;
  }
  return secret.length >= 32 ? secret : SECRET_DEV;
}
