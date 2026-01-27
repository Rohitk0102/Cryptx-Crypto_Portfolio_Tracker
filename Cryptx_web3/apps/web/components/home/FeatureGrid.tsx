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
            icon: "📊",
            title: "My Portfolio",
            desc: "View your wallet balances & assets",
            action: () => {
                if (isAuthenticated) {
                    router.push('/dashboard?tab=portfolio');
                } else {
                    connect();
                }
            }
        },
        {
            icon: "🔴",
            title: "Live Token Tracking",
            desc: "Real-time prices & market data",
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
        <div className="grid md:grid-cols-2 gap-6 mt-16 w-full max-w-4xl mx-auto px-4 z-10 relative">
            {features.map((feature, idx) => (
                <Card
                    key={idx}
                    hover={true}
                    onClick={feature.action}
                    className="flex flex-col items-start text-left h-full cursor-pointer"
                >
                    <div className="text-4xl mb-6 p-3 bg-white/5 rounded-2xl w-fit backdrop-blur-md border border-white/10 group-hover:scale-110 group-hover:bg-primary/20 group-hover:border-primary/30 transition-all duration-300">
                        {feature.icon}
                    </div>
                    <CardTitle className="group-hover:text-primary-foreground transition-colors">
                        {feature.title}
                    </CardTitle>
                    <CardDescription className="group-hover:text-gray-300 transition-colors">
                        {feature.desc}
                    </CardDescription>
                </Card>
            ))}
        </div>
    );
}