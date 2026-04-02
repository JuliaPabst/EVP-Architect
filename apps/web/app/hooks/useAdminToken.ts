import {useEffect, useState} from 'react';

const STORAGE_KEY_PREFIX = 'evp_admin_token_';

function getStorageKey(projectId: string): string {
  return `${STORAGE_KEY_PREFIX}${projectId}`;
}

/**
 * Custom hook to securely load the admin token for employer-facing routes.
 *
 * Purpose:
 *   Reads the admin token from the URL hash fragment on first load and
 *   persists it to sessionStorage for subsequent step navigation.
 *   Subsequent pages without a hash fall back to sessionStorage.
 *
 *   Hash fragments are never sent to the server, so the token does not
 *   appear in server logs. The hash is intentionally kept in the URL so
 *   the employer can copy and share the link with colleagues.
 *
 * Share link format: /path/to/page#admin=TOKEN
 *
 * @param projectId - UUID of the project (used to namespace the storage key)
 * @returns The admin token (string), null if confirmed absent, or undefined while still loading
 */
export default function useAdminToken(
  projectId: string,
): string | null | undefined {
  const [adminToken, setAdminToken] = useState<string | null | undefined>(
    undefined,
  );

  useEffect(() => {
    const {hash} = window.location;
    const hashParams = new URLSearchParams(hash.slice(1));
    const tokenFromHash = hashParams.get('admin');

    if (tokenFromHash) {
      sessionStorage.setItem(getStorageKey(projectId), tokenFromHash);
      setAdminToken(tokenFromHash);
    } else {
      const stored = sessionStorage.getItem(getStorageKey(projectId));

      setAdminToken(stored);
    }
  }, [projectId]);

  return adminToken;
}
