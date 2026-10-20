import React, { useEffect } from 'react';
import { useClearPass } from '../../context/ClearPassContext';
import { apiFetch } from '../../utils/api';
import { registerForPushNotifications } from '../../utils/pushNotifications';
import { appStorage } from '../../utils/storage';

export const PushNotificationRegistrationRN: React.FC = () => {
  const { currentUser, currentRole } = useClearPass();

  useEffect(() => {
    if (!currentUser || (currentRole !== 'Student' && currentRole !== 'Personnel')) return;
    let active = true;

    void registerForPushNotifications()
      .then(async (token) => {
        if (!active || !token) return;
        const response = await apiFetch('/api/push/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (!response.ok) throw new Error('Push notification registration failed.');
        appStorage.setItem('sia_clearpass_push_token', token);
      })
      .catch((error) => console.warn('[ClearPass push registration]:', error));

    return () => { active = false; };
  }, [currentUser?.user_id, currentRole]);

  return null;
};
