/** Confirmation sous forme de feuille, renvoie une promesse (affichée par ConfirmHost). */
export interface Demande { message: string; titre?: string; ok: string; annuler: string; danger: boolean; resoudre: (v: boolean) => void }
const demande = ref<Demande | null>(null);

export function confirmer(message: string, o: { titre?: string; ok?: string; annuler?: string; danger?: boolean } = {}): Promise<boolean> {
  return new Promise(resoudre => {
    demande.value = { message, titre: o.titre, ok: o.ok ?? 'OK', annuler: o.annuler ?? '×', danger: o.danger ?? true, resoudre };
  });
}
export function repondre(v: boolean) {
  demande.value?.resoudre(v);
  demande.value = null;
}
export const useDemande = () => demande;
