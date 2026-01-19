import { Outlet, NavLink } from 'react-router-dom';
import { useAccount, useDisconnect } from 'wagmi';
import { LayoutDashboard, ArrowLeftRight, MessageCircle, Wallet, Settings, LogOut } from 'lucide-react';
import { useTradingStore } from '../lib/store';

function Layout() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const accessStatus = useTradingStore((s) => s.accessStatus);

  const navItems = [
    { to: '/', icon: MessageCircle, label: 'Luna AI' },
    { to: '/trade', icon: ArrowLeftRight, label: 'Trade' },
    { to: '/portfolio', icon: Wallet, label: 'Portfolio' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-moonboots-dark-light border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <img src="/logo.png" alt="MoonBoots" className="h-8 w-auto" />
          <p className="text-xs text-gray-500 mt-1">Trading Agency</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-moonboots-purple text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-800">
          {accessStatus && (
            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
              {accessStatus.isVIP && (
                <span className="inline-block px-2 py-1 text-xs bg-moonboots-gold/20 text-moonboots-gold rounded mb-2">
                  VIP Member
                </span>
              )}
              <p className="text-xs text-gray-400">
                Fee Rate: {(accessStatus.effectiveFeeBps / 100).toFixed(2)}%
              </p>
              {accessStatus.feeDiscount > 0 && (
                <p className="text-xs text-green-400">
                  {(accessStatus.feeDiscount * 100).toFixed(0)}% discount applied
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">
                {address && truncateAddress(address)}
              </p>
              <p className="text-xs text-gray-500">Connected</p>
            </div>
            <button
              onClick={() => disconnect()}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Disconnect"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
