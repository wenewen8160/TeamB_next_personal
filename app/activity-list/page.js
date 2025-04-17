"use client";

import { Suspense } from "react";
import ActivityListContent from "./ActivityListContent";

export default function ActivityListPage() {
  return (
    <Suspense fallback={<div>載入中...</div>}>
      <ActivityListContent />
    </Suspense>
  );
}
