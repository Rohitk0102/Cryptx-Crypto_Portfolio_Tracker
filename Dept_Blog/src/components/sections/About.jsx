import { aboutContent } from '../../data/content';
import { BookOpen, Target, Users } from 'lucide-react';

export default function About() {
    const stats = [
        { icon: BookOpen, label: "Core Domains", value: "6+" },
        { icon: Target, label: "Success Rate", value: "98%" },
        { icon: Users, label: "Students", value: "500+" },
    ];

    return (
        <section id="about" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <span className="section-tag">About the Department</span>
                        <h2 className="section-title mb-8">Outcome-Oriented Education</h2>

                        <div className="space-y-6">
                            {aboutContent.paragraphs.map((p, idx) => (
                                <p key={idx} className="text-lg text-slate-600 leading-relaxed">
                                    {p}
                                </p>
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-8 mt-12 pt-12 border-t border-slate-100">
                            {stats.map((stat, idx) => (
                                <div key={idx}>
                                    <p className="text-3xl font-extrabold text-slate-900 mb-1">{stat.value}</p>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {aboutContent.focusAreas.map((area, idx) => (
                            <div key={idx} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-4 border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                    <span className="text-xs font-bold">{idx + 1}</span>
                                </div>
                                <p className="font-bold text-slate-900 leading-snug">{area}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
