import EventSource from 'react-native-sse';

interface RealtimeHandlers {
  onMessage: (message: { data: string }) => void;
  onOpen?: () => void;
  onError: () => void;
}

interface RealtimeConnection {
  close: () => void;
}

export const connectRealtime = (url: string, handlers: RealtimeHandlers): RealtimeConnection | null => {
  try {
    const source = new EventSource(url);
    source.addEventListener('open', () => handlers.onOpen?.());
    source.addEventListener('message', (message) => {
      handlers.onMessage({ data: message.data ?? '' });
    });
    source.addEventListener('error', handlers.onError);

    return { close: () => source.close() };
  } catch {
    handlers.onError();
    return null;
  }
};
