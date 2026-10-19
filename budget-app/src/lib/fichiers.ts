/** Partager (iPhone / Android) ou télécharger un fichier ; lire un fichier choisi. */
export function partagerOuTelecharger(nom: string, blob: Blob) {
  const file = new File([blob], nom, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) return navigator.share({ files: [file], title: nom }).catch(() => {});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nom;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const lireFichier = (f: File) => new Promise<string>((ok, ko) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result));
  r.onerror = () => ko(r.error);
  r.readAsText(f, 'utf-8');
});
