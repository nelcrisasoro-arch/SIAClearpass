/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ClearPassProvider } from './context/ClearPassContext';
import { AdminPortal } from './components/admin/AdminPortal';

export default function App() {
  return (
    <ClearPassProvider>
      <div className="min-h-screen bg-slate-900 text-slate-100 antialiased font-sans">
        <AdminPortal />
      </div>
    </ClearPassProvider>
  );
}
