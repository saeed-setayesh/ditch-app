"use client";

import { use } from "react";
import DriverInspectionRunner from "@/components/inspection/DriverInspectionRunner";

export default function DriverInspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <DriverInspectionRunner id={id} />;
}
