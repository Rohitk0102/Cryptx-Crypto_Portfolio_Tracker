import { ArrowRight } from 'lucide-react';
import { departmentInfo } from '../../data/content';

export default function Hero() {
    const scrollToAbout = () => {
        const element = document.getElementById('about');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="relative min-h-[90vh] flex items-center bg-slate-50 overflow-hidden pt-20">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
                <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full mb-8 shadow-sm">
                        <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                            {departmentInfo.university}
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-8">
                        Information Technology &<br />
                        <span className="text-slate-500">Computer Applications</span>
                    </h1>

                    <p className="text-xl text-slate-600 mb-12 max-w-xl font-medium leading-relaxed">
                        {departmentInfo.tagline}
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={scrollToAbout}
                            className="btn-primary"
                        >
                            Explore Programs
                            <ArrowRight size={18} />
                        </button>
                        <button
                            onClick={() => document.getElementById('hod').scrollIntoView({ behavior: 'smooth' })}
                            className="btn-secondary"
                        >
                            Learn about HOD
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
