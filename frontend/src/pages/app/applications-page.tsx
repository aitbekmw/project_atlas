import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  acceptApplication,
  getMyApplications,
  listApplications,
  rejectApplication,
  withdrawApplication,
} from "@/api/applications";
import { createConversation, listConversations } from "@/api/conversations";
import { getJob, getMyJobs } from "@/api/jobs";
import { getUser } from "@/api/users";
import {
  ApplicationActions,
  ApplicationCard,
} from "@/components/applications/application-card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { ApplicationListSkeleton } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/i18n/locale-context";
import { queryKeys } from "@/lib/query-keys";
import { fullName, getErrorMessage } from "@/lib/utils";
import type { Application, Job } from "@/types/api";

async function invalidateApplicationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.applications }),
    queryClient.invalidateQueries({ queryKey: queryKeys.myApplications }),
    queryClient.invalidateQueries({ queryKey: ["job-applications"] }),
    queryClient.invalidateQueries({ queryKey: ["job"] }),
    queryClient.invalidateQueries({ queryKey: ["jobs"] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.myJobs }),
    queryClient.invalidateQueries({ queryKey: queryKeys.conversations }),
  ]);
}

export function ApplicationsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isWorker = user?.role === "worker";
  const isAdmin = user?.role === "admin";
  const isCustomer = user?.role === "customer";

  const myApplicationsQuery = useQuery({
    queryKey: queryKeys.myApplications,
    queryFn: getMyApplications,
    enabled: isWorker,
  });
  const visibleApplicationsQuery = useQuery({
    queryKey: queryKeys.applications,
    queryFn: listApplications,
    enabled: isCustomer || isAdmin,
  });
  const myJobsQuery = useQuery({
    queryKey: queryKeys.myJobs,
    queryFn: getMyJobs,
    enabled: isCustomer,
  });

  const listQuery = isWorker ? myApplicationsQuery : visibleApplicationsQuery;
  const myJobIds = useMemo(
    () => new Set((myJobsQuery.data ?? []).map((job) => job.id)),
    [myJobsQuery.data],
  );

  const applications = useMemo(() => {
    const items = listQuery.data ?? [];
    if (isCustomer) {
      return items.filter((item) => myJobIds.has(item.job_id));
    }
    return items;
  }, [isCustomer, listQuery.data, myJobIds]);

  const acceptMutation = useMutation({
    mutationFn: acceptApplication,
    onSuccess: async () => {
      toast.success(t("app.accepted"));
      await invalidateApplicationQueries(queryClient);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const rejectMutation = useMutation({
    mutationFn: rejectApplication,
    onSuccess: async () => {
      toast.success(t("app.rejected"));
      await invalidateApplicationQueries(queryClient);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const withdrawMutation = useMutation({
    mutationFn: withdrawApplication,
    onSuccess: async () => {
      toast.success(t("app.withdrawn"));
      await invalidateApplicationQueries(queryClient);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  async function openChat(application: Application, job: Job) {
    try {
      const conversations = await listConversations();
      const existing = conversations.find(
        (item) => item.job_id === job.id && item.worker_id === application.worker_id,
      );
      if (existing) {
        navigate(`/app/chat/${existing.id}`);
        return;
      }
      const conversation = await createConversation(job.id, application.worker_id);
      navigate(`/app/chat/${conversation.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const isLoading =
    listQuery.isLoading || (isCustomer && myJobsQuery.isLoading);
  const isError = listQuery.isError || (isCustomer && myJobsQuery.isError);
  const error = listQuery.error ?? myJobsQuery.error;

  return (
    <div>
      <PageHeader
        title={isWorker ? t("app.titleWorker") : isAdmin ? t("app.titleAdmin") : t("app.titleCustomer")}
        description={
          isWorker
            ? t("app.hintWorker")
            : isAdmin
              ? t("app.hintAdmin")
              : t("app.hintCustomer")
        }
      />
      {isLoading ? <ApplicationListSkeleton /> : null}
      {isError ? (
        <ErrorState error={error} onRetry={() => void listQuery.refetch()} />
      ) : null}
      {!isLoading && !isError && applications.length === 0 ? (
        <EmptyState
          icon="inbox"
          title={t("app.empty")}
          description={
            isWorker
              ? t("app.emptyWorker")
              : t("app.emptyCustomer")
          }
          action={
            isWorker ? (
              <Button asChild>
                <Link to="/app/search">{t("nav.searchJobs")}</Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link to={isAdmin ? "/app/admin/jobs" : "/app/jobs"}>
                  {isAdmin ? t("landing.allJobs") : t("nav.myJobs")}
                </Link>
              </Button>
            )
          }
        />
      ) : null}
      {!isError ? (
        <div className="grid gap-3">
          {applications.map((application) => (
            <ApplicationItem
              key={application.id}
              application={application}
              currentUserId={user?.id}
              incoming={!isWorker}
              busy={
                acceptMutation.isPending ||
                rejectMutation.isPending ||
                withdrawMutation.isPending
              }
              onAccept={() => acceptMutation.mutate(application.id)}
              onReject={() => rejectMutation.mutate(application.id)}
              onWithdraw={() => withdrawMutation.mutate(application.id)}
              onChat={(job) => void openChat(application, job)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ApplicationItem({
  application,
  currentUserId,
  incoming,
  busy,
  onAccept,
  onReject,
  onWithdraw,
  onChat,
}: {
  application: Application;
  currentUserId?: number;
  incoming: boolean;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
  onWithdraw: () => void;
  onChat: (job: Job) => void;
}) {
  const { t } = useI18n();
  const jobQuery = useQuery({
    queryKey: queryKeys.job(application.job_id),
    queryFn: () => getJob(application.job_id),
    retry: false,
  });
  const workerQuery = useQuery({
    queryKey: queryKeys.user(application.worker_id),
    queryFn: () => getUser(application.worker_id),
    enabled: incoming,
    retry: false,
  });
  const job = jobQuery.data;
  const workerName = workerQuery.data ? fullName(workerQuery.data) : t("common.userFallback", { id: application.worker_id });
  const isMine = application.worker_id === currentUserId;
  const isPending = application.status === "PENDING";
  const isAccepted = application.status === "ACCEPTED";
  const canManage = incoming && isPending;
  const canWithdraw = isMine && isPending;
  const canChat = incoming && isAccepted && Boolean(job);

  return (
    <ApplicationCard
      application={application}
      job={job}
      workerName={incoming ? workerName : undefined}
      actions={
        <ApplicationActions
          busy={busy}
          onAccept={canManage ? onAccept : undefined}
          onReject={canManage ? onReject : undefined}
          onWithdraw={canWithdraw ? onWithdraw : undefined}
          onChat={canChat && job ? () => onChat(job) : undefined}
        />
      }
    />
  );
}
