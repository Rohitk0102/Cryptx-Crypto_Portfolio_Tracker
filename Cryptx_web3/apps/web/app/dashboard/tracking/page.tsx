'use client';

import RealTimeTracking from '@/components/dashboard/RealTimeTracking';

export default function TrackingPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Live Token Tracking</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            Real-time token prices and market data
          </p>
        </div>
      </div>

      <RealTimeTracking />
    </div>
  );
}
