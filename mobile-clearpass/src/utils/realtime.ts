export interface RealtimeMessage {
  data: string;
}

export interface RealtimeHandlers {
  onMessage: (message: RealtimeMessage) => void;
  onOpen?: () => void;
  onError: () => void;
}

export interface RealtimeConnection {
  close: () => void;
}

export const connectRealtime = (url: string, handlers: RealtimeHandlers): RealtimeConnection | null => {
  if (typeof EventSource === 'undefined') return null;

  try {
    const source = new EventSource(url);
    source.onmessage = handlers.onMessage;
    source.onopen = handlers.onOpen ?? null;
    source.onerror = handlers.onError;

    return { close: () => source.close() };
  } catch {
    handlers.onError();
    return null;
  }
};
