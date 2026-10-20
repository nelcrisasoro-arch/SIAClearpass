import AppRootRN from './src/App';

type ClearPassRuntime = typeof globalThis & { __CLEARPASS_API_BASE_URL__?: string };

// Native clients call the same API as the deployed web application.
(globalThis as ClearPassRuntime).__CLEARPASS_API_BASE_URL__ = 'https://sia-clearpass.onrender.com';

export default AppRootRN;
