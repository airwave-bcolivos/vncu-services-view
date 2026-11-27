import { useEffect } from "react";
import { jobService } from "@/services/job.service";

export function useCompletedJobSync(jobIds: readonly string[], onCompleted: (ids: ReadonlySet<string>) => void) {
    useEffect(() => {
        if (!jobIds.length) return;
        const controller = new AbortController();
        let checking = false;

        async function refresh() {
            if (checking || document.visibilityState !== "visible") return;
            checking = true;
            try {
                const results = await Promise.allSettled(
                    jobIds.map((id) => jobService.getJobDetail(id, controller.signal))
                );
                const completed = new Set(results.flatMap((result) =>
                    result.status === "fulfilled" && result.value.status === "COMPLETED" ? [result.value.id] : []
                ));
                if (!controller.signal.aborted && completed.size) onCompleted(completed);
            } finally {
                checking = false;
            }
        }

        const timer = window.setInterval(refresh, 10000);
        document.addEventListener("visibilitychange", refresh);
        window.addEventListener("focus", refresh);
        return () => {
            controller.abort();
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", refresh);
            window.removeEventListener("focus", refresh);
        };
    }, [jobIds, onCompleted]);
}
