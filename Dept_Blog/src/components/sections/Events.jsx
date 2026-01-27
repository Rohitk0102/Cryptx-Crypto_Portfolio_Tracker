import { Calendar, ArrowUpRight } from 'lucide-react';
import { eventsData } from '../../data/content';

export default function Events() {
    return (
        <section id="events" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                    <div>
                        <span className="section-tag">Engagements</span>
                        <h2 className="section-title">Department Events</h2>
                    </div>
                    <p className="text-slate-500 max-w-sm text-lg font-medium leading-relaxed">
                        National level hackathons and technical symposiums focusing on AI and modern engineering.
                    </p>
                </div>

                <div className="space-y-4">
                    {eventsData.map((event, idx) => (
                        <div
                            key={idx}
                            className="bg-white p-8 rounded-3xl border border-slate-100 flex flex-col md:flex-row md:items-center gap-8 group hover:border-slate-300 transition-all shadow-sm hover:shadow-md"
                        >
                            {/* Date */}
                            <div className="flex flex-col md:w-40 flex-shrink-0">
                                <div className="flex items-center gap-2 text-blue-600 text-sm font-bold uppercase tracking-widest mb-1">
                                    <Calendar size={14} />
                                    {event.date.split(',')[1]?.trim() || '2025'}
                                </div>
                                <span className="text-lg font-bold text-slate-900">
                                    {event.date.split(',')[0]}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="flex-grow">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                                        {event.type}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                                    {event.name}
                                </h3>
                                <p className="text-slate-500 text-base font-medium max-w-2xl">
                                    {event.objective}
                                </p>
                            </div>

                            {/* Action */}
                            <div className="flex-shrink-0">
                                <button className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                                    <ArrowUpRight size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
