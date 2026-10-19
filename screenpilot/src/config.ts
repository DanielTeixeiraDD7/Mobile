/**
 * Clé publique TMDB (usage personnel, non commercial). Elle est visible dans l'app :
 * c'est normal pour une app web ; en cas d'abus, la régénérer sur themoviedb.org/settings/api.
 */
export const TMDB_API_KEY = '2f90ec4e9d50efbfeec6574f1aba03dc';

/**
 * Projet Supabase (comptes et amis). Clé « publishable » : publique par conception,
 * la sécurité est assurée par les règles RLS de supabase/schema.sql. Jamais de clé secrète ici.
 * Surchargeable au build (tests locaux) : VITE_SP_SUPABASE_URL / VITE_SP_SUPABASE_KEY.
 */
export const SUPABASE_URL: string = import.meta.env.VITE_SP_SUPABASE_URL || 'https://iyefzfmvqrlbgvqshjqc.supabase.co';
export const SUPABASE_KEY: string = import.meta.env.VITE_SP_SUPABASE_KEY || 'sb_publishable_JFfqhJo-4RJDfscLJRvuhA_WsVUM9L0';
