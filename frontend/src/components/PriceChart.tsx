import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceDataPoint {
  timestamp: number;
  price: number;
}

interface PriceChartProps {
  data: PriceDataPoint[] | null;
  height?: number;
  showAxis?: boolean;
  color?: 'green' | 'red' | 'purple' | 'auto';
}

function PriceChart({ data, height = 200, showAxis = true, color = 'auto' }: PriceChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length < 2) return null;

    const prices = data.map((d) => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const startPrice = prices[0];
    const endPrice = prices[prices.length - 1];
    const changePercent = ((endPrice - startPrice) / startPrice) * 100;

    // Determine color based on price change
    let lineColor = '#9333ea'; // purple default
    if (color === 'auto') {
      if (changePercent > 0) lineColor = '#22c55e'; // green
      else if (changePercent < 0) lineColor = '#ef4444'; // red
    } else {
      if (color === 'green') lineColor = '#22c55e';
      else if (color === 'red') lineColor = '#ef4444';
      else if (color === 'purple') lineColor = '#9333ea';
    }

    // Create SVG path
    const width = 100;
    const chartHeight = 100;
    const padding = 5;

    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
      const y =
        chartHeight - padding - ((d.price - minPrice) / priceRange) * (chartHeight - padding * 2);
      return { x, y };
    });

    const pathD = points
      .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
      .join(' ');

    // Create gradient area path
    const areaD =
      pathD +
      ` L ${points[points.length - 1].x},${chartHeight - padding} L ${padding},${chartHeight - padding} Z`;

    return {
      pathD,
      areaD,
      lineColor,
      minPrice,
      maxPrice,
      startPrice,
      endPrice,
      changePercent,
      timestamps: {
        start: new Date(data[0].timestamp * 1000).toLocaleDateString(),
        end: new Date(data[data.length - 1].timestamp * 1000).toLocaleDateString(),
      },
    };
  }, [data, color]);

  if (!chartData) {
    return (
      <div
        className="flex items-center justify-center text-gray-500"
        style={{ height }}
      >
        No price data available
      </div>
    );
  }

  const TrendIcon =
    chartData.changePercent > 0.1
      ? TrendingUp
      : chartData.changePercent < -0.1
        ? TrendingDown
        : Minus;

  const trendColorClass =
    chartData.changePercent > 0.1
      ? 'text-green-400'
      : chartData.changePercent < -0.1
        ? 'text-red-400'
        : 'text-gray-400';

  return (
    <div className="w-full">
      {/* Price Info */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <p className="text-sm text-gray-400">Current</p>
          <p className="text-lg font-semibold">${chartData.endPrice.toFixed(6)}</p>
        </div>
        <div className={`flex items-center gap-1 ${trendColorClass}`}>
          <TrendIcon className="w-4 h-4" />
          <span className="text-sm font-medium">
            {chartData.changePercent >= 0 ? '+' : ''}
            {chartData.changePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id={`gradient-${chartData.lineColor}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={chartData.lineColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={chartData.lineColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path
            d={chartData.areaD}
            fill={`url(#gradient-${chartData.lineColor})`}
          />

          {/* Line */}
          <path
            d={chartData.pathD}
            fill="none"
            stroke={chartData.lineColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Y-axis labels */}
        {showAxis && (
          <div className="absolute right-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pointer-events-none">
            <span>${chartData.maxPrice.toFixed(4)}</span>
            <span>${chartData.minPrice.toFixed(4)}</span>
          </div>
        )}
      </div>

      {/* X-axis labels */}
      {showAxis && (
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{chartData.timestamps.start}</span>
          <span>{chartData.timestamps.end}</span>
        </div>
      )}
    </div>
  );
}

export default PriceChart;
