/**
 * Offline Request Queue & Progressive Web App Auto-Sync
 * Stores offline lab translations and symptom queries locally in localStorage
 * and flushes them automatically upon network reconnection.
 */

export interface QueuedReportJob {
  id: string;
  image: string;
  pincode: string;
  targetLanguage: string;
  queuedAt: string;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
}

const STORAGE_KEY = 'sentinel_offline_queue_v2';
const QUEUE_EVENT = 'sentinel_queue_updated';

function notifyQueueChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(QUEUE_EVENT));
  }
}

export function subscribeToQueueUpdates(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(QUEUE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(QUEUE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function getQueuedReports(): QueuedReportJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function enqueueOfflineReport(job: {
  image: string;
  pincode: string;
  targetLanguage: string;
}): QueuedReportJob {
  const queue = getQueuedReports();
  const newJob: QueuedReportJob = {
    ...job,
    id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    queuedAt: new Date().toISOString(),
    status: 'pending',
    retryCount: 0
  };

  // Limit queued images in localStorage to avoid storage quota overflow (max 5)
  const updated = [newJob, ...queue.slice(0, 4)];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyQueueChange();
  } catch (err) {
    console.warn('LocalStorage quota limit reached, maintaining last items', err);
  }

  return newJob;
}

export function removeQueuedReport(id: string): void {
  try {
    const queue = getQueuedReports();
    const updated = queue.filter((j) => j.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyQueueChange();
  } catch (err) {
    console.warn('Failed to remove queued item', err);
  }
}

/**
 * Auto-sync worker: Executes when internet connection is restored
 */
export async function flushOfflineQueue(
  onReportProcessed?: (jobId: string, result: any) => void
): Promise<number> {
  const queue = getQueuedReports();
  if (queue.length === 0 || !navigator.onLine) {
    return 0;
  }

  let processedCount = 0;

  for (const job of queue) {
    try {
      const response = await fetch('/api/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: job.image,
          pincode: job.pincode,
          targetLanguage: job.targetLanguage
        })
      });

      if (response.ok) {
        const data = await response.json();
        removeQueuedReport(job.id);
        processedCount++;
        if (onReportProcessed) {
          onReportProcessed(job.id, data);
        }
      } else {
        // If server returns error, increment retry
        job.retryCount = (job.retryCount || 0) + 1;
        if (job.retryCount > 3) {
          removeQueuedReport(job.id);
        }
      }
    } catch (err) {
      console.warn('Failed to sync offline job:', job.id, err);
      // Stop loop on network disruption
      break;
    }
  }

  notifyQueueChange();
  return processedCount;
}
