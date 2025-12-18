import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, differenceInMinutes, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Search, RefreshCw, Clock } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface OfficerProfile {
  id: string;
  first_name: string;
  last_name: string;
  badge_number: string | null;
  rank: string | null;
  division: string | null;
  license_id: string | null;
  duty_status: string | null;
  last_duty_activity: string | null;
}

interface DutySession {
  id: string;
  officer_id: string | null;
  start_time: string;
  end_time: string | null;
  duration_hours: number | null;
  created_at: string;
}

interface OfficerDutyStats {
  id: string;
  name: string;
  badge: string;
  rank: string;
  division: string;
  status: "On Duty" | "Off Duty";
  totalMinutesToday: number;
  totalMinutesWeek: number;
  totalMinutesMonth: number;
  lastActivity: string | null;
}

const normalizeStatus = (value: string | null | undefined): "On Duty" | "Off Duty" => {
  const v = (value ?? "").toLowerCase().trim();
  return v === "on duty" || v === "on_duty" || v === "onduty" ? "On Duty" : "Off Duty";
};

const addOverlapMinutes = (start: Date, end: Date, windowStart: Date, windowEnd: Date) => {
  const overlapStart = start > windowStart ? start : windowStart;
  const overlapEnd = end < windowEnd ? end : windowEnd;
  return Math.max(0, differenceInMinutes(overlapEnd, overlapStart));
};

export default function DutyHours() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = "Duty Hours | MDT";
  }, []);

  // Fetch roster (officers)
  const {
    data: profiles,
    refetch: refetchProfiles,
    isFetching: isFetchingProfiles,
    dataUpdatedAt: profilesUpdatedAt,
  } = useQuery({
    queryKey: ["duty-hours", "profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, first_name, last_name, badge_number, rank, division, license_id, duty_status, last_duty_activity"
        )
        .order("last_name", { ascending: true });

      if (error) throw error;
      return (data ?? []) as OfficerProfile[];
    },
    staleTime: 5_000,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });

  // Fetch duty sessions relevant for current month window
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const {
    data: sessions,
    refetch: refetchSessions,
    isFetching: isFetchingSessions,
    dataUpdatedAt: sessionsUpdatedAt,
  } = useQuery({
    queryKey: ["duty-hours", "sessions", format(monthStart, "yyyy-MM")],
    queryFn: async () => {
      // Include sessions that overlap this month, including active sessions (end_time is null).
      const { data, error } = await supabase
        .from("duty_sessions")
        .select("id, officer_id, start_time, end_time, duration_hours, created_at")
        .lte("start_time", monthEnd.toISOString())
        .or(`end_time.is.null,end_time.gte.${monthStart.toISOString()}`)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return (data ?? []) as DutySession[];
    },
    staleTime: 5_000,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });

  // Realtime updates (invalidate queries on changes)
  useEffect(() => {
    const channel = supabase
      .channel("duty-hours-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "duty_sessions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["duty-hours", "sessions"] });
          queryClient.invalidateQueries({ queryKey: ["duty-hours", "profiles"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["duty-hours", "profiles"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const isFetching = isFetchingProfiles || isFetchingSessions;
  const lastUpdatedAt = Math.max(profilesUpdatedAt ?? 0, sessionsUpdatedAt ?? 0);

  const officerStats = useMemo((): OfficerDutyStats[] => {
    if (!profiles) return [];

    const nowLocal = new Date();
    const todayStart = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const weekStart = startOfWeek(nowLocal, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(nowLocal, { weekStartsOn: 1 });

    const monthStartLocal = startOfMonth(nowLocal);
    const monthEndLocal = endOfMonth(nowLocal);

    const sessionsByOfficer = new Map<string, DutySession[]>();
    for (const s of sessions ?? []) {
      if (!s.officer_id) continue;
      const list = sessionsByOfficer.get(s.officer_id) ?? [];
      list.push(s);
      sessionsByOfficer.set(s.officer_id, list);
    }

    return profiles.map((p) => {
      const officerSessions = sessionsByOfficer.get(p.id) ?? [];
      const hasActiveSession = officerSessions.some((s) => !s.end_time);

      let totalMinutesToday = 0;
      let totalMinutesWeek = 0;
      let totalMinutesMonth = 0;

      for (const s of officerSessions) {
        const start = new Date(s.start_time);
        const end = s.end_time ? new Date(s.end_time) : nowLocal;

        totalMinutesToday += addOverlapMinutes(start, end, todayStart, tomorrowStart);
        totalMinutesWeek += addOverlapMinutes(start, end, weekStart, weekEnd);
        totalMinutesMonth += addOverlapMinutes(start, end, monthStartLocal, monthEndLocal);
      }

      const latestSession = officerSessions
        .slice()
        .sort((a, b) =>
          new Date(a.end_time ?? a.start_time).getTime() -
          new Date(b.end_time ?? b.start_time).getTime()
        )
        .at(-1);

      const lastActivity = p.last_duty_activity ?? latestSession?.end_time ?? null;

      return {
        id: p.id,
        name: `${p.first_name} ${p.last_name}`.trim(),
        badge: p.badge_number ?? "—",
        rank: p.rank ?? "Unknown",
        division: p.division ?? "Unknown",
        status: hasActiveSession ? "On Duty" : normalizeStatus(p.duty_status),
        totalMinutesToday,
        totalMinutesWeek,
        totalMinutesMonth,
        lastActivity,
      };
    });
  }, [profiles, sessions]);

  const filteredStats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return officerStats;

    return officerStats.filter((o) => {
      return (
        o.name.toLowerCase().includes(q) ||
        o.badge.toLowerCase().includes(q) ||
        o.rank.toLowerCase().includes(q) ||
        o.division.toLowerCase().includes(q)
      );
    });
  }, [officerStats, searchQuery]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleManualRefresh = async () => {
    await Promise.all([refetchProfiles(), refetchSessions()]);
  };

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Duty Hours</h1>
          <p className="text-muted-foreground">
            Live duty status and time totals
            {lastUpdatedAt ? (
              <span className="ml-2 text-xs text-muted-foreground/70">
                • Last updated: {format(new Date(lastUpdatedAt), "h:mm:ss a")}
              </span>
            ) : null}
          </p>
        </div>

        <Button variant="outline" onClick={handleManualRefresh} disabled={isFetching} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </header>

      <section aria-label="Search officers" className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search officers by name, badge, rank, division…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </section>

      <section aria-label="Officer duty cards" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredStats.map((officer) => (
          <Card key={officer.id} className="border-border/50 bg-card/80">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate text-lg">{officer.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Badge {officer.badge} • {officer.rank} • {officer.division}
                  </p>
                </div>

                <Badge variant={officer.status === "On Duty" ? "success" : "muted"}>
                  {officer.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-xs text-muted-foreground">Today</p>
                  <p className="font-semibold text-foreground">{formatTime(officer.totalMinutesToday)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-xs text-muted-foreground">This Week</p>
                  <p className="font-semibold text-foreground">{formatTime(officer.totalMinutesWeek)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-xs text-muted-foreground">This Month</p>
                  <p className="font-semibold text-foreground">{formatTime(officer.totalMinutesMonth)}</p>
                </div>
              </div>

              {officer.lastActivity ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Last activity: {format(new Date(officer.lastActivity), "MMM d, h:mm a")}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </section>

      {filteredStats.length === 0 ? (
        <section className="rounded-lg border border-border/50 bg-card/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">No officers match your search.</p>
        </section>
      ) : null}
    </main>
  );
}
