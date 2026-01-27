import { User, Award, Calendar, ChevronRight } from 'lucide-react';
import { hodList, departmentInfo } from '../../data/content';

export default function HOD() {
    const currentHOD = hodList.find(h => h.isCurrent);
    const pastHODs = hodList.filter(h => !h.isCurrent);

    return (
        <section id="hod" className="py-24 bg-slate-50">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="section-header text-center mb-20">
                    <span className="section-tag">Leadership</span>
                    <h2 className="section-title">Department Administration</h2>
                </div>

                <div className="grid lg:grid-cols-12 gap-12">
                    {/* Featured Current HOD */}
                    <div className="lg:col-span-8">
                        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-10 items-center">
                            <div className="w-40 h-40 rounded-3xl bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                <User size={80} className="text-slate-300 translate-y-4" />
                            </div>
                            <div>
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-4">
                                    Current Head of Department
                                </span>
                                <h3 className="text-3xl font-extrabold text-slate-900 mb-2">{currentHOD?.name}</h3>
                                <p className="text-lg text-slate-600 mb-8 max-w-lg">
                                    Overseeing academic excellence and industry collaborations at AU College of Engineering.
                                </p>

                                <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                                    <div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Tenure</span>
                                        <p className="font-bold text-slate-900">{currentHOD?.tenure}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Status</span>
                                        <p className="font-bold text-slate-900">Active</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Past HODs */}
                    <div className="lg:col-span-4 space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Succession List</h4>
                        {pastHODs.map((hod, idx) => (
                            <div key={idx} className="p-6 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-slate-300 transition-all cursor-default">
                                <div>
                                    <h5 className="font-bold text-slate-900">{hod.name}</h5>
                                    <p className="text-sm font-medium text-slate-500 mt-1">{hod.tenure}</p>
                                </div>
                                <ChevronRight size={18} className="text-slate-300" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
