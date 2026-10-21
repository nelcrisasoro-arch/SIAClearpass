import { AdminPortal } from './components/admin/AdminPortal';
import { ClearPassProvider } from './context/ClearPassContext';

export default function App() {
  return (
    <ClearPassProvider>
      <AdminPortal />
    </ClearPassProvider>
  );
}
