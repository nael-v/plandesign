import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  accent?: ReactNode;
};

export function StatCard({ title, value, description, accent }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>{title}</CardDescription>
            <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
          </div>
          {accent ? <div>{accent}</div> : null}
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <p className="text-sm leading-6 text-muted">{description}</p>
      </CardContent>
    </Card>
  );
}