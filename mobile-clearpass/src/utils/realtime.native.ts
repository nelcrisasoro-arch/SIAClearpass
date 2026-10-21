import EventSource from 'react-native-sse';

interface RealtimeHandlers {
  onMessage: (message: { data: string }) => void;
  onError: () => void;
}

interface RealtimeConnection {
  close: () => void;
}

export const connectRealtime = (url: string, handlers: RealtimeHandlers): RealtimeConnection => {
  const source = new EventSource(url);
  source.addEventListener('message', (message) => {
    handlers.onMessage({ data: message.data ?? '' });
  });
  source.addEventListener('error', handlers.onError);

  return { close: () => source.close() };
};
