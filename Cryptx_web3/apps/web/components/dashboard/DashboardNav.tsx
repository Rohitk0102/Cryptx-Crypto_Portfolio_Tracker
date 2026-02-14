'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/dashboard' || path === '/dashboard/portfolio') {
      return pathname === '/dashboard' || pathname === '/dashboard/portfolio';
    }
    return pathname?.startsWith(path);
  };

  const navItems = [
    { path: '/dashboard/portfolio', label: 'Portfolio' },
    { path: '/dashboard/tracking', label: 'Live Tracking' },
    { path: '/dashboard/transactions', label: 'Transactions' },
    { path: '/dashboard/pnl', label: 'Profit & Loss' },
    { path: '/dashboard/forecasting', label: 'AI Forecasting' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8" role="navigation">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              prefetch={true}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${isActive(item.path)
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
