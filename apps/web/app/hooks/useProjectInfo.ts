import {useEffect, useState} from 'react';

interface ProjectInfo {
  readonly company_name: string;
  readonly location: string | null;
  readonly profile_image_url: string | null;
}

interface UseProjectInfoResult {
  readonly isLoading: boolean;
  readonly projectInfo: ProjectInfo | null;
}

const projectInfoCache = new Map<string, ProjectInfo>();

/**
 * Custom hook to fetch public project info for the employee survey.
 * No authentication required — only projectId needed.
 *
 * @param projectId - UUID of the project
 * @returns Object with projectInfo and loading state
 */
export default function useProjectInfo(
  projectId: string,
): UseProjectInfoResult {
  const [isLoading, setIsLoading] = useState(true);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);

  useEffect(() => {
    let isDisposed = false;

    const fetchProjectInfo = async () => {
      const cached = projectInfoCache.get(projectId);

      if (cached) {
        if (!isDisposed) {
          setProjectInfo(cached);
          setIsLoading(false);
        }

        return;
      }

      try {
        const response = await fetch(
          `/api/employee-survey/project-info?projectId=${projectId}`,
        );

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as ProjectInfo;

        projectInfoCache.set(projectId, data);

        if (!isDisposed) {
          setProjectInfo(data);
        }
      } catch {
        // Project info is optional — survey still works without it
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    };

    fetchProjectInfo().catch(() => undefined);

    return () => {
      isDisposed = true;
    };
  }, [projectId]);

  return {isLoading, projectInfo};
}
