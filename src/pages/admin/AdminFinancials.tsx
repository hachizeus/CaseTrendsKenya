import { useEffect, useMemo, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler, Title } from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler, Title);

const DATE_RANGES = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "ytd", label: "Year to Date" },
] as const;

type DateRangeKey = (typeof DATE_RANGES)[number]["value"];

type RevenueAnalyticsRow = {
  day: string;
  payment_method?: string;
  total_amount: number;
  order_count?: number;
};

const formatDateLabel = (isoDate: string) => {
  if (!isoDate) return "—";
  const [year, month, day] = isoDate.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: "numeric",
    timeZone: "Africa/Nairobi",
  }).format(date);
};

const formatDateInNairobi = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const getRangeBounds = (range: DateRangeKey) => {
  const end = new Date();
  const start = new Date(end);

  if (range === "7d") {
    start.setDate(end.getDate() - 6);
  } else if (range === "30d") {
    start.setDate(end.getDate() - 29);
  } else {
    start.setMonth(0, 1);
  }

  return {
    startDate: formatDateInNairobi(start),
    endDate: formatDateInNairobi(end),
  };
};

const buildChartData = (analytics: RevenueAnalyticsRow[]) => {
  const labels = analytics.map((row) => formatDateLabel(row.day));
  const revenue = analytics.map((row) => Number(row.total_amount));
  const orderVolume = analytics.map((row) => Number(row.order_count ?? 0));

  return {
    labels,
    revenue,
    orderVolume,
    paystackRevenue: revenue.reduce((sum, value) => sum + value, 0),
  };
};

const createCurrencyTooltip = {
  callbacks: {
    label: (context: any) => {
      const value = context.parsed?.y ?? context.parsed ?? 0;
      return `KSh ${Number(value).toLocaleString()}`;
    },
  },
};

const FinancialsPage = () => {
  const { role, loading: authLoading } = useAuth();
  const isAdmin = role === "admin";
  const [dateRange, setDateRange] = useState<DateRangeKey>("7d");
  const [analytics, setAnalytics] = useState<RevenueAnalyticsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    const loadAnalytics = async () => {
      setLoading(true);
      setError(null);

      const { startDate, endDate } = getRangeBounds(dateRange);
      const result = await supabase.rpc("daily_paystack_revenue_by_day", {
        _start_date: startDate,
        _end_date: endDate,
      });

      const fetchError = result.error;
      const rows = result.data as unknown as RevenueAnalyticsRow[] | null;

      if (fetchError) {
        console.error("Revenue analytics fetch failed:", fetchError);
        setError("Unable to load revenue analytics at this time.");
        setAnalytics([]);
      } else {
        setAnalytics(rows ?? []);
      }

      setLoading(false);
    };

    loadAnalytics();
  }, [dateRange, isAdmin]);

  const { labels, revenue, orderVolume, paystackRevenue } = useMemo(
    () => buildChartData(analytics),
    [analytics],
  );

  const totalRevenue = useMemo(
    () => analytics.reduce((sum, row) => sum + Number(row.total_amount), 0),
    [analytics],
  );

  const totalOrders = useMemo(
    () => analytics.reduce((sum, row) => sum + Number(row.order_count ?? 0), 0),
    [analytics],
  );

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const hasChartData = revenue.length > 0 && revenue.some((value) => value > 0);
  const hasPaystackData = paystackRevenue > 0;

  const lineChartData = {
    labels,
    datasets: [
      {
        label: "Daily Revenue",
        data: revenue,
        fill: true,
        tension: 0.4,
        borderColor: "#FF1493",
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return "rgba(255,20,147,0.25)";
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "rgba(255,20,147,0.28)");
          gradient.addColorStop(0.65, "rgba(255,20,147,0.12)");
          gradient.addColorStop(1, "rgba(255,20,147,0)");
          return gradient;
        },
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: "#FF1493",
        pointHoverRadius: 6,
        pointHoverBorderWidth: 2,
        pointHoverBorderColor: "#FF1493",
      },
    ],
  };

  const doughnutChartData = {
    labels: ["Paystack Revenue"],
    datasets: [
      {
        data: [paystackRevenue],
        backgroundColor: ["#FF1493"],
        hoverBackgroundColor: ["#e01382"],
        borderWidth: 1,
        borderColor: "#ffffff20",
      },
    ],
  };

  const barChartData = {
    labels,
    datasets: [
      {
        label: "Order Volume",
        data: orderVolume,
        backgroundColor: "rgba(255,20,147,0.72)",
        borderColor: "#FF1493",
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 32,
      },
    ],
  };

  const sharedOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: createCurrencyTooltip,
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.1)" },
        ticks: { 
          color: "#ffffff80",
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: window.innerWidth < 640 ? 10 : 12
          }
        },
        border: { color: "rgba(255,255,255,0.2)" },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.1)" },
        ticks: { 
          color: "#ffffff80", 
          callback: (value: any) => {
            if (window.innerWidth < 640) {
              return Number(value) >= 1000 ? `KSh ${(value/1000).toFixed(0)}k` : `KSh ${value}`;
            }
            return `KSh ${Number(value).toLocaleString()}`;
          },
          font: {
            size: window.innerWidth < 640 ? 10 : 12
          }
        },
        border: { color: "rgba(255,255,255,0.2)" },
      },
    },
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]">
        <div className="max-w-lg w-full rounded-xl border border-white/10 bg-white/5 p-6 sm:p-10 text-center">
          <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-primary">Access Denied</p>
          <h1 className="mt-4 text-xl sm:text-2xl font-semibold text-white">Admin access required</h1>
          <p className="mt-3 text-xs sm:text-sm text-white/50">
            This dashboard is restricted to administrators. If you believe this is an error, please contact your team owner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)] min-h-screen">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Financial Dashboard</h1>
          <p className="text-xs sm:text-sm text-white/50 mt-1">High-fidelity analytics for revenue, order volume, and payment channel performance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {DATE_RANGES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDateRange(option.value)}
              className={`rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                dateRange === option.value
                  ? "bg-primary text-white"
                  : "border border-white/20 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-4">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5 shadow-sm">
              <p className="text-xs sm:text-sm text-white/50">Total Revenue</p>
              <p className="mt-2 sm:mt-3 text-xl sm:text-2xl lg:text-3xl font-semibold text-white truncate">KSh {totalRevenue.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5 shadow-sm">
              <p className="text-xs sm:text-sm text-white/50">Total Orders</p>
              <p className="mt-2 sm:mt-3 text-xl sm:text-2xl lg:text-3xl font-semibold text-white">{totalOrders.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5 shadow-sm">
              <p className="text-xs sm:text-sm text-white/50">Avg. Order Value</p>
              <p className="mt-2 sm:mt-3 text-xl sm:text-2xl lg:text-3xl font-semibold text-white truncate">KSh {averageOrderValue.toFixed(0).toLocaleString()}</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Revenue Trend</h2>
                <p className="mt-1 text-xs text-white/40 hidden sm:block">Daily revenue over the selected date range.</p>
              </div>
            </div>
            <div className="mt-4 sm:mt-6 h-[300px] sm:h-[360px] min-h-[280px] w-full">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-white/50">Loading chart...</div>
              ) : !hasChartData ? (
                <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 px-4 sm:px-6 text-center text-white/50">
                  <p className="text-sm font-medium">No revenue recorded for this period.</p>
                  <p className="mt-2 text-xs text-white/30">Try a different date range or verify that paid orders exist in the selected window.</p>
                </div>
              ) : (
                <Line data={lineChartData} options={{
                  ...sharedOptions,
                  plugins: {
                    ...sharedOptions.plugins,
                    title: {
                      display: true,
                      text: "Daily Revenue",
                      color: "#ffffff",
                      font: { size: window.innerWidth < 640 ? 12 : 14, weight: 600 },
                    },
                  },
                }} />
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Paystack Revenue</h2>
                <p className="mt-1 text-xs text-white/40 hidden sm:block">All revenue shown here comes from Paystack transactions only.</p>
              </div>
            </div>
            <div className="mt-4 sm:mt-6 h-[280px] sm:h-[320px] min-h-[260px] w-full">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-white/50">Loading chart...</div>
              ) : !hasPaystackData ? (
                <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 px-4 sm:px-6 text-center text-white/50">
                  <p className="text-sm font-medium">No Paystack revenue recorded for this period.</p>
                  <p className="mt-2 text-xs text-white/30">Try a different date range or verify Paystack order data in the selected window.</p>
                </div>
              ) : (
                <Doughnut data={doughnutChartData} options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context: any) => {
                          const value = context.parsed;
                          return `${context.label}: KSh ${Number(value).toLocaleString()}`;
                        },
                      },
                    },
                  },
                }} />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Order Volume</h2>
                <p className="mt-1 text-xs text-white/40 hidden sm:block">Orders placed per day in the current range.</p>
              </div>
            </div>
            <div className="mt-4 sm:mt-6 h-[280px] sm:h-[320px] min-h-[260px] w-full">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-white/50">Loading chart...</div>
              ) : !orderVolume.some((value) => value > 0) ? (
                <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 px-4 sm:px-6 text-center text-white/50">
                  <p className="text-sm font-medium">No orders recorded for this period.</p>
                  <p className="mt-2 text-xs text-white/30">Please choose a wider range or verify order data in Supabase.</p>
                </div>
              ) : (
                <Bar data={barChartData} options={{
                  ...sharedOptions,
                  plugins: {
                    ...sharedOptions.plugins,
                    title: {
                      display: true,
                      text: "Daily Order Volume",
                      color: "#ffffff",
                      font: { size: window.innerWidth < 640 ? 12 : 14, weight: 600 },
                    },
                  },
                }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialsPage;