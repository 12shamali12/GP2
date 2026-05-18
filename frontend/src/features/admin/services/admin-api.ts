import { httpJson } from "@/lib/api/http";
import { authHeaders } from "@/lib/api/auth";
import { ADMIN_USERNAME } from "@/features/admin/lib/admin-config";
import { getLeaderboardSnapshot as fetchLeaderboardSnapshot } from "@/features/leaderboard/services/leaderboard-api";
import type {
  DoctorRequestItem,
  LeaderboardSnapshot,
  ManagedUser,
  SemesterProgressionPreview,
  SupervisorRequestItem,
  UserProfileReportItem,
} from "@/features/admin/types/admin";
import type { AdminGroupItem, PlanningWorkspaceData } from "@/features/supervision/types";
import type { NotificationItem } from "@/features/notifications/types/notification";

type AdminQueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean | null | undefined>;

export type AdminShellCounts = {
  pendingQueue: number;
  supervisorRequests: number;
  doctorRequests: number;
  groupModeration: number;
  groups: number;
  planning: number;
  users: number;
  userReports: number;
  notifications: number;
  chat: number;
};

type CacheEntry<T> = {
  expiresAt: number;
  data?: T;
  inFlight?: Promise<T>;
};

const ADMIN_CACHE_TTL_MS = 30_000;
const adminCache = new Map<string, CacheEntry<unknown>>();

const getCachedAdmin = <T,>(key: string): T | undefined => {
  const entry = adminCache.get(key);
  if (!entry || entry.expiresAt <= Date.now() || entry.data === undefined) {
    return undefined;
  }
  return entry.data as T;
};

const clearAdminCache = (...prefixes: string[]) => {
  if (prefixes.length === 0) {
    adminCache.clear();
    return;
  }
  for (const key of Array.from(adminCache.keys())) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      adminCache.delete(key);
    }
  }
};

const cachedAdminLoader = <T,>(
  key: string,
  loader: () => Promise<T>,
  ttlMs = ADMIN_CACHE_TTL_MS,
): Promise<T> => {
  const now = Date.now();
  const cached = adminCache.get(key) as CacheEntry<T> | undefined;

  if (cached?.data !== undefined && cached.expiresAt > now) {
    return Promise.resolve(cached.data);
  }

  if (cached?.inFlight) {
    return cached.inFlight;
  }

  const inFlight = loader()
    .then((data) => {
      adminCache.set(key, {
        data,
        expiresAt: Date.now() + ttlMs,
      });
      return data;
    })
    .catch((error) => {
      adminCache.delete(key);
      throw error;
    });

  adminCache.set(key, {
    data: cached?.data,
    expiresAt: cached?.expiresAt ?? 0,
    inFlight,
  });

  return inFlight;
};

const safeGet = async <T,>(loader: () => Promise<T>, fallback: T) => {
  try {
    return await loader();
  } catch {
    return fallback;
  }
};

export const getAdminJson = <T,>(path: string, query?: Record<string, AdminQueryValue>) =>
  httpJson<T>(path, { headers: { ...authHeaders() }, query });

export const postAdminJson = <T,>(
  path: string,
  body?: FormData | Record<string, unknown> | unknown[] | string | number | boolean | null,
  extraHeaders?: Record<string, string>,
) =>
  httpJson<T>(path, {
    method: "POST",
    headers: { ...authHeaders(), ...extraHeaders },
    body,
  }).then((data) => {
    clearAdminCache();
    return data;
  });

export const patchAdminJson = <T,>(
  path: string,
  body?: FormData | Record<string, unknown> | unknown[] | string | number | boolean | null,
) =>
  httpJson<T>(path, {
    method: "PATCH",
    headers: { ...authHeaders() },
    body,
  }).then((data) => {
    clearAdminCache();
    return data;
  });

export const getSupervisorRequests = () =>
  cachedAdminLoader("supervisorRequests", () =>
    getAdminJson<SupervisorRequestItem[]>("/supervisor/requests"),
  );

export const getDoctorRequests = () =>
  cachedAdminLoader("doctorRequests", () =>
    getAdminJson<DoctorRequestItem[]>("/supervisor/doctor-requests"),
  );

export const getUsers = () =>
  cachedAdminLoader("users", () => getAdminJson<ManagedUser[]>("/supervisor/users"));

export const getGroups = () =>
  cachedAdminLoader("groups", () => getAdminJson<AdminGroupItem[]>("/supervisor/groups"));

export const getPlanningWorkspace = () =>
  cachedAdminLoader("planning", () =>
    getAdminJson<PlanningWorkspaceData>("/supervisor/planning"),
  );

export const getSemesterProgression = () =>
  cachedAdminLoader("semesterProgression", () =>
    getAdminJson<SemesterProgressionPreview>("/supervisor/semesters/progression"),
  );

export const advanceEligibleStudents = () =>
  postAdminJson<{ message: string; advancedStudents?: number }>(
    "/supervisor/semesters/advance",
  );

export const updateStudentSemester = (userId: string, semesterId?: string | null) =>
  postAdminJson<{ message: string }>(`/supervisor/users/${userId}/semester`, {
    semesterId: semesterId ?? undefined,
  });

export const getLeaderboardSnapshot = (): Promise<LeaderboardSnapshot> =>
  cachedAdminLoader("leaderboard", () => fetchLeaderboardSnapshot());

export const getUserProfileReports = () =>
  cachedAdminLoader("userReports", () =>
    getAdminJson<UserProfileReportItem[]>("/profiles/reports", {
      identifier: ADMIN_USERNAME,
    }),
  );

export const decideUserProfileReport = (
  reportId: string,
  status: UserProfileReportItem["status"],
  resolutionNote?: string,
) =>
  postAdminJson<{ message: string }>(`/profiles/reports/${reportId}/decision`, {
    reviewerIdentifier: ADMIN_USERNAME,
    status,
    resolutionNote,
  });

export const decideSupervisorRequest = (id: string, approve: boolean) =>
  postAdminJson(`/supervisor/requests/${id}/decision`, { approve });

export const decideDoctorRequest = (id: string, approve: boolean) =>
  postAdminJson(`/supervisor/doctor-requests/${id}/decision`, { approve });

export const setUserBlocked = (id: string, blocked: boolean) =>
  postAdminJson(`/supervisor/users/${id}/block`, { blocked });

export const deleteUser = (id: string) =>
  postAdminJson(`/supervisor/users/${id}/delete`);

export const reapproveSupervisor = (id: string) =>
  postAdminJson(`/supervisor/users/${id}/reapprove`);

export const reapproveDoctor = (id: string) =>
  postAdminJson(`/supervisor/users/${id}/reapprove-doctor`);

export const createGroup = (body: { name: string; description: string; semesterLabel: string }) =>
  postAdminJson("/supervisor/groups", body);

export const updateGroup = (
  id: string,
  body: { name: string; description: string; semesterLabel: string; active: boolean },
) => postAdminJson(`/supervisor/groups/${id}/update`, body);

export const addDoctorToGroup = (groupId: string, doctorId: string) =>
  postAdminJson(`/supervisor/groups/${groupId}/doctors`, { doctorId });

export const deleteGroup = (id: string) =>
  postAdminJson(`/supervisor/groups/${id}/delete`);

export const decideGroupJoinRequest = (id: string, approve: boolean) =>
  postAdminJson(`/supervisor/group-requests/${id}/decision`, { approve });

export const decidePartnerRequest = (id: string, approve: boolean) =>
  postAdminJson(`/supervisor/partner-requests/${id}/decision`, { approve });

export const removeDoctorFromGroup = (groupId: string, doctorId: string) =>
  postAdminJson(`/supervisor/groups/${groupId}/doctors/${doctorId}/remove`);

export const removePartnerPair = (pairId: string) =>
  postAdminJson(`/supervisor/partner-pairs/${pairId}/remove`);

export const getAdminShellCounts = async (): Promise<AdminShellCounts> => {
  const [
    supervisorRequests,
    doctorRequests,
    groups,
    users,
    planning,
    userReports,
    notifications,
    chatUnread,
  ] = await Promise.all([
    safeGet(getSupervisorRequests, []),
    safeGet(getDoctorRequests, []),
    safeGet(getGroups, []),
    safeGet(getUsers, []),
    safeGet(getPlanningWorkspace, null),
    safeGet(getUserProfileReports, []),
    safeGet(
      () =>
        getAdminJson<NotificationItem[]>("/notifications", {
          identifier: ADMIN_USERNAME,
        }),
      [],
    ),
    safeGet(
      () =>
        getAdminJson<number | { count: number }>("/chat/unread-count", {
          identifier: ADMIN_USERNAME,
        }),
      0,
    ),
  ]);

  const groupModeration = groups.reduce((total, group) => {
    const joinCount = Array.isArray(group.joinRequests) ? group.joinRequests.length : 0;
    const partnerCount = Array.isArray(group.partnerRequests)
      ? group.partnerRequests.length
      : 0;
    return total + joinCount + partnerCount;
  }, 0);

  const unreadChatCount =
    typeof chatUnread === "number"
      ? chatUnread
      : typeof chatUnread?.count === "number"
        ? chatUnread.count
        : 0;

  return {
    pendingQueue: supervisorRequests.length + doctorRequests.length + groupModeration,
    supervisorRequests: supervisorRequests.length,
    doctorRequests: doctorRequests.length,
    groupModeration,
    groups: groups.length,
    planning: Array.isArray(planning?.plans) ? planning.plans.length : 0,
    users: users.filter((user) => user.role !== "ADMIN").length,
    userReports: userReports.filter((item) => item.status === "PENDING").length,
    notifications: notifications.filter((item) => !item.read).length,
    chat: unreadChatCount,
  };
};
