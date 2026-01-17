import { useQuery } from '@tanstack/react-query';
import { TrendingUp, DollarSign, RefreshCw, Activity } from 'lucide-react';
import { useTradingStore } from '../lib/store';
import { getRevenueStats } from '../lib/api';

function Dashboard() {
  const accessStatus = useTradingStore((s) => s.accessStatus);

  const { data: revenueStats } = useQuery({
    queryKey: ['revenue'],
    queryFn: getRevenueStats,
    refetchInterval: 30000, // Refresh every 30s
  });

  const formatUSD = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of your trading activity</p>
      </div>

      {/* Access Status */}
      {accessStatus && !accessStatus.hasAccess && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400">
            You need to hold a MoonBoots MB1 or Chappyz NFT to access trading features.
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Your Fee Rate</span>
            <DollarSign className="w-5 h-5 text-moonboots-purple" />
          </div>
          <p className="text-3xl font-bold">
            {accessStatus ? `${(accessStatus.effectiveFeeBps / 100).toFixed(2)}%` : '-'}
          </p>
          {accessStatus?.feeDiscount && accessStatus.feeDiscount > 0 && (
            <p className="text-sm text-green-400 mt-1">
              {(accessStatus.feeDiscount * 100).toFixed(0)}% discount applied
            </p>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Total Platform Fees</span>
            <Activity className="w-5 h-5 text-moonboots-purple" />
          </div>
          <p className="text-3xl font-bold">
            {revenueStats ? formatUSD(revenueStats.totalFeesUSD) : '-'}
          </p>
          <p className="text-sm text-gray-500 mt-1">All time</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Buyback Pool</span>
            <RefreshCw className="w-5 h-5 text-moonboots-gold" />
          </div>
          <p className="text-3xl font-bold">
            {revenueStats ? formatUSD(revenueStats.buybackPoolUSD) : '-'}
          </p>
          <p className="text-sm text-gray-500 mt-1">50% of fees</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">MBDAO Bought</span>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold">
            {revenueStats
              ? (BigInt(revenueStats.totalMBDAOBought) / BigInt(10 ** 18)).toLocaleString()
              : '-'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Total buybacks</p>
        </div>
      </div>

      {/* Holdings Section */}
      {accessStatus && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Your NFT Holdings</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">MoonBoots MB1</p>
              <p className="text-2xl font-bold">{accessStatus.holdings.moonbootsMB1}</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Chappyz</p>
              <p className="text-2xl font-bold">{accessStatus.holdings.chappyz}</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">MBDAO VIP</p>
              <p className="text-2xl font-bold">{accessStatus.holdings.mbdaoVIP}</p>
              {accessStatus.isVIP && (
                <span className="text-xs text-moonboots-gold">VIP Status Active</span>
              )}
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">MBDAO Tokens</p>
              <p className="text-2xl font-bold">
                {(BigInt(accessStatus.holdings.mbdaoTokens) / BigInt(10 ** 18)).toLocaleString()}
              </p>
              {accessStatus.isMBDAOHolder && (
                <span className="text-xs text-green-400">10000+ Holder Bonus</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Buybacks */}
      {revenueStats && revenueStats.buybackHistory.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Recent MBDAO Buybacks</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">USD Amount</th>
                  <th className="pb-3">MBDAO Bought</th>
                  <th className="pb-3">Transaction</th>
                </tr>
              </thead>
              <tbody>
                {revenueStats.buybackHistory.slice(-5).reverse().map((buyback, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td className="py-4 text-sm">
                      {new Date(buyback.timestamp).toLocaleDateString()}
                    </td>
                    <td className="py-4">{formatUSD(buyback.usdAmount)}</td>
                    <td className="py-4">
                      {(BigInt(buyback.mbdaoAmount) / BigInt(10 ** 18)).toLocaleString()}
                    </td>
                    <td className="py-4">
                      <a
                        href={`https://basescan.org/tx/${buyback.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-moonboots-purple hover:underline text-sm"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
