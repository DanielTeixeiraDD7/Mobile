import { canIncrement } from '../domain/progress';
import { formatNumber, mediaTitle, statusLabel, totalUnits, unitShort } from '../domain/labels';
import type { LibraryEntry, TitleLanguage } from '../domain/types';
import { navigate } from '../router';
import { plusOne } from './actions';
import { Icon } from './icons';
import { Poster } from './Poster';

export function progressText(e: LibraryEntry) {
  const total = totalUnits(e.media);
  return `${unitShort(e.type)} ${formatNumber(e.progress)} / ${total ?? '?'}`;
}

export function EntryRow({ entry, lang, showStatus = false, extra }: { entry: LibraryEntry; lang: TitleLanguage; showStatus?: boolean; extra?: string }) {
  const title = mediaTitle(entry.media, lang);
  const total = totalUnits(entry.media);
  const pct = total ? Math.min(100, (entry.progress / total) * 100) : 0;
  const can = canIncrement(entry) && entry.status !== 'COMPLETED';
  return (
    <li className="entry">
      <button type="button" className="entry-main" onClick={() => navigate({ name: 'media', type: entry.type, id: entry.mediaId })}>
        <Poster src={entry.media.cover} color={entry.media.coverColor} title={title} size="sm" />
        <span className="grow">
          <span className="entry-title clamp2">{title}</span>
          <span className="entry-meta small muted">
            {progressText(entry)}
            {showStatus && <> · {statusLabel(entry.type, entry.status)}</>}
            {extra && <> · {extra}</>}
          </span>
          <span className="bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
        </span>
      </button>
      {can && (
        <button type="button" className="plus" onClick={() => void plusOne(entry)} aria-label={`+1 ${entry.type === 'ANIME' ? 'épisode' : 'chapitre'} : ${title}`}>
          <Icon name="plus" />
        </button>
      )}
    </li>
  );
}
