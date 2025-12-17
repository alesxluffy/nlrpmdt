import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, Calendar, Copy, Check, RefreshCw } from "lucide-react";
import { format, differenceInMinutes, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DutyLog {
  id: string;
  license_id: string;
  status: string;
  rank_at_time: string | null;
  raw_message: string | null;
  created_at: string;
}

interface OfficerDutyStats {
  id: string;
  name: string;
  rank: string;
  division: string;
  license_id: string;
  totalMinutesToday: number;
  totalMinutesWeek: number;
  totalMinutesMonth: number;
  lastStatus: string;
  lastStatusTime: string;
}

const DutyHours = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);

  const webhookUrl = `https://dvaudymlldvgjsltduus.supabase.co/functions/v1/duty-webhook`;

  // Fetch profiles with license_id - refresh every 10 seconds
  const { data: profiles, refetch: refetchProfiles } = useQuery({
    queryKey: ["profiles-with-license"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, rank, division, license_id")
        .not("license_id", "is", null)
        .neq("license_id", "");

      if (error) throw error;
      return data;
    },
    staleTime: 5_000,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });

  // Fetch duty logs - refresh every 10 seconds
  const { data: dutyLogs, dataUpdatedAt, refetch: refetchLogs, isFetching } = useQuery({
    queryKey: ["duty-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("duty_logs")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as DutyLog[];
    },
    staleTime: 5_000,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });

  const handleManualRefresh = async () => {
    await Promise.all([refetchProfiles(), refetchLogs()]);
    toast.success("Duty hours refreshed");
  };

  // Calculate duty hours for each officer
  const officerStats = useMemo(() => {
    if (!profiles || !dutyLogs) return [];

    const normalizeLicense = (value: string | null | undefined) =>
      (value ?? "")
        .trim()
        .toLowerCase()
        .replace(/^(license:)+/, "");

    const normalizeStatus = (value: string | null | undefined) => {
      const v = (value ?? "").toLowerCase().replace(/-/g, "_");
      if (v === "on_duty") return "on_duty";
      if (v === "off_duty") return "off_duty";
      return "unknown";
    };

    const addOverlapMinutes = (
      start: Date,
      end: Date,
      windowStart: Date,
      windowEnd: Date
    ) => {
      const overlapStart = start > windowStart ? start : windowStart;
      const overlapEnd = end < windowEnd ? end : windowEnd;
      return Math.max(0, differenceInMinutes(overlapEnd, overlapStart));
    };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return profiles.map((profile) => {
      const profileLicense = normalizeLicense(profile.license_id);

      const officerLogs = dutyLogs
        .filter((log) => normalizeLicense(log.license_id) === profileLicense)
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

      let totalMinutesToday = 0;
      let totalMinutesWeek = 0;
      let totalMinutesMonth = 0;
      let lastOnDuty: Date | null = null;

      for (const log of officerLogs) {
        const logTime = new Date(log.created_at);
        const status = normalizeStatus(log.status);

        if (status === "on_duty") {
          lastOnDuty = logTime;
          continue;
        }

        if (status === "off_duty" && lastOnDuty) {
          totalMinutesToday += addOverlapMinutes(
            lastOnDuty,
            logTime,
            todayStart,
            tomorrowStart
          );
          totalMinutesWeek += addOverlapMinutes(
            lastOnDuty,
            logTime,
            weekStart,
            weekEnd
          );
          totalMinutesMonth += addOverlapMinutes(
            lastOnDuty,
            logTime,
            monthStart,
            monthEnd
          );
          lastOnDuty = null;
        }
      }

      // If still on duty, count time until now
      if (lastOnDuty) {
        totalMinutesToday += addOverlapMinutes(
          lastOnDuty,
          now,
          todayStart,
          tomorrowStart
        );
        totalMinutesWeek += addOverlapMinutes(lastOnDuty, now, weekStart, weekEnd);
        totalMinutesMonth += addOverlapMinutes(
          lastOnDuty,
          now,
          monthStart,
          monthEnd
        );
      }

      const lastLog = officerLogs[officerLogs.length - 1];

      return {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
        rank: profile.rank || "Unknown",
        division: profile.division || "Unknown",
        license_id: profile.license_id || "",
        totalMinutesToday,
        totalMinutesWeek,
        totalMinutesMonth,
        lastStatus: lastLog ? normalizeStatus(lastLog.status) : "unknown",
        lastStatusTime: lastLog?.created_at || "",
      } as OfficerDutyStats;
    });
  }, [profiles, dutyLogs]);

  const filteredStats = officerStats.filter(
    (officer) =>
      officer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.rank.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.division.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    toast.success("Webhook URL copied to clipboard");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Duty Hours</h1>
            <p className="text-muted-foreground">
              Track officer on-duty time via Discord webhook
              {dataUpdatedAt && (
                <span className="ml-2 text-xs text-muted-foreground/70">
                  • Last updated: {format(new Date(dataUpdatedAt), "h:mm:ss a")}
                </span>
              )}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleManualRefresh}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Webhook URL Card */}
        <Card className="border-primary/20 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Discord Webhook URL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono truncate">
                {webhookUrl}
              </code>
              <Button size="sm" variant="outline" onClick={copyWebhookUrl}>
                {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Send POST requests with JSON body: {"{"}"content": "(license:xxx) went on-duty. (Rank)"{"}"}
            </p>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search officers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStats.map((officer) => (
            <Card key={officer.id} className="border-border/50 bg-card/80">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{officer.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {officer.rank} • {officer.division}
                    </p>
                  </div>
                  <Badge
                    variant={officer.lastStatus === "on_duty" ? "default" : "secondary"}
                    className={
                      officer.lastStatus === "on_duty"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {officer.lastStatus === "on_duty" ? "On Duty" : "Off Duty"}
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
                {officer.lastStatusTime && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Last activity: {format(new Date(officer.lastStatusTime), "MMM d, h:mm a")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No duty records found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Officers with license IDs will appear here once duty logs are received
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default DutyHours;
