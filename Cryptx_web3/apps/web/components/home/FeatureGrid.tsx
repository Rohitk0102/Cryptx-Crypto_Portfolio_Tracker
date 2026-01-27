'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useWalletConnect } from '@/hooks/useWalletConnect';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';

export default function FeatureGrid() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const { connect, isConnecting } = useWalletConnect();

    const features = [
        {
            title: "Portfolio",
            desc: "View wallet balances and assets across multiple chains",
            action: () => {
                if (isAuthenticated) {
                    router.push('/dashboard?tab=portfolio');
                } else {
                    connect();
                }
            }
        },
        {
            title: "Live Tracking",
            desc: "Real-time token prices and market data",
            action: () => {
                if (isAuthenticated) {
                    router.push('/dashboard?tab=tracking');
                } else {
                    connect();
                }
            }
        }
    ];

    return (
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {features.map((feature, idx) => (
                <Card
                    key={idx}
                    hover={true}
                    onClick={feature.action}
                    className="p-8"
                >
                    <CardTitle className="mb-3">
                        {feature.title}
                    </CardTitle>
                    <CardDescription>
                        {feature.desc}
                    </CardDescription>
                </Card>
            ))}
        </div>
    );
}