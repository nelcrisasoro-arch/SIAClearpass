export interface RealtimeMessage {
  data: string;
}

export interface RealtimeHandlers {
  onMessage: (message: RealtimeMessage) => void;
  onError: () => void;
}

export interface RealtimeConnection {
  close: () => void;
}

export const connectRealtime = (url: string, handlers: RealtimeHandlers): RealtimeConnection | null => {
  if (typeof EventSource === 'undefined') return null;

  const source = new EventSource(url);
  source.onmessage = handlers.onMessage;
  source.onerror = handlers.onError;

  return { close: () => source.close() };
};
