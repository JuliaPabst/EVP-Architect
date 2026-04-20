import {useEffect, useState} from 'react';

/**
 * Custom hook to securely load the admin token for employer-facing routes.
 *
 * Purpose:
 *   Reads the admin token exclusively from the URL hash fragment.
 *   Pages are inaccessible without the token present in the URL hash.
 *
 *   Hash fragments are never sent to the server, so the token does not
 *   appear in server logs. The hash is intentionally kept in the URL so
 *   the employer can copy and share the link with colleagues.
 *
 * Share link format: /path/to/page#admin=TOKEN
 *
 * @param projectId - UUID of the project
 * @returns The admin token (string), null if absent, or undefined while still loading
 */
export default function useAdminToken(
  projectId: string,
): string | null | undefined {
  const [adminToken, setAdminToken] = useState<string | null | undefined>(
    undefined,
  );

  useEffect(() => {
    const {hash} = globalThis.location;
    const hashParams = new URLSearchParams(hash.slice(1));
    const tokenFromHash = hashParams.get('admin');

    setAdminToken(tokenFromHash);
  }, [projectId]);

  return adminToken;
}
