-- Aggregate Paystack revenue per local day in Africa/Nairobi timezone
CREATE OR REPLACE FUNCTION public.daily_paystack_revenue_by_day(
  _start_date date,
  _end_date date
)
RETURNS TABLE(day date, total_amount numeric, order_count bigint)
LANGUAGE sql STABLE AS $$
  SELECT
    day_series.day,
    COALESCE(SUM(o.total_amount), 0) AS total_amount,
    COALESCE(COUNT(o.*), 0) AS order_count
  FROM generate_series(_start_date, _end_date, interval '1 day') AS day_series(day)
  LEFT JOIN public.orders o
    ON (o.created_at AT TIME ZONE 'Africa/Nairobi')::date = day_series.day
    AND o.payment_method = 'paystack'
    AND o.status <> 'cancelled'
  GROUP BY day_series.day
  ORDER BY day_series.day;
$$;
