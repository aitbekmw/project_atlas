import { Link } from "react-router-dom";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/utils";
import type { Application, ApplicationStatus, Job } from "@/types/api";
import { APPLICATION_STATUS_LABEL } from "@/types/api";

const variant: Record<ApplicationStatus, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  ACCEPTED: "success",
  REJECTED: "danger",
};

interface ApplicationCardProps {
  application: Application;
  job?: Job;
  workerName?: string;
  actions?: ReactNode;
}

export function ApplicationCard({
  application,
  job,
  workerName,
  actions,
}: ApplicationCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to={`/jobs/${application.job_id}`}
            className="font-semibold hover:text-primary"
          >
            {job?.title ?? `Заказ #${application.job_id}`}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            {workerName ? `Исполнитель: ${workerName}` : `Отклик #${application.id}`}
            {" · "}
            {formatDate(application.created_at)}
          </p>
          {job ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {formatMoney(job.salary)}
              {job.city ? ` · ${job.city}` : ""}
            </p>
          ) : null}
          <Badge className="mt-3" variant={variant[application.status]}>
            {APPLICATION_STATUS_LABEL[application.status]}
          </Badge>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </CardContent>
    </Card>
  );
}

export function ApplicationActions({
  onAccept,
  onReject,
  onChat,
  onWithdraw,
  busy = false,
}: {
  onAccept?: () => void;
  onReject?: () => void;
  onChat?: () => void;
  onWithdraw?: () => void;
  busy?: boolean;
}) {
  return (
    <>
      {onAccept ? (
        <Button size="sm" disabled={busy} onClick={onAccept}>
          Принять
        </Button>
      ) : null}
      {onReject ? (
        <Button size="sm" variant="outline" disabled={busy} onClick={onReject}>
          Отклонить
        </Button>
      ) : null}
      {onChat ? (
        <Button size="sm" variant="outline" disabled={busy} onClick={onChat}>
          Чат
        </Button>
      ) : null}
      {onWithdraw ? (
        <Button size="sm" variant="ghost" disabled={busy} onClick={onWithdraw}>
          Отозвать
        </Button>
      ) : null}
    </>
  );
}
