/**
 * Smart French time formatting for "last seen" / "Dernière connexion" display.
 *
 * - < 1 min:    "À l'instant"
 * - < 60 min:   "il y a X min"
 * - < 24h:      "il y a Xh"
 * - Yesterday:  "Hier à HH:MM"
 * - < 7 days:   "il y a Xj"
 * - Older:      "DD/MM/YYYY"
 */
export function formatLastSeen(dateStr: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);

  if (m < 1) return "À l'instant";
  if (m < 60) return `il y a ${m} min`;
  if (h < 24) return `il y a ${h}h`;

  const date = new Date(dateStr);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  if (d < 7) return `il y a ${d}j`;

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
