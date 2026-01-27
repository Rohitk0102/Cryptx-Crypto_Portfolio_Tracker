import { useState } from 'react';
import { GraduationCap, Clock, Check, ArrowRight } from 'lucide-react';
import { coursesData } from '../../data/content';

const tabs = [
    { id: 'undergraduate', label: 'Undergraduate' },
    { id: 'postgraduate', label: 'Postgraduate' },
    { id: 'research', label: 'Research' },
];

export default function Courses() {
    const [activeTab, setActiveTab] = useState('undergraduate');
    const courses = coursesData[activeTab] || [];

    return (
        <section id="courses" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                    <div>
                        <span className="section-tag">Programs</span>
                        <h2 className="section-title">Academic Curricula</h2>
                    </div>

                    <div className="flex bg-slate-50 p-1 rounded-xl">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === tab.id
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {courses.map((course) => (
                        <div
                            key={course.id}
                            className="group bg-white p-8 rounded-3xl border border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 flex flex-col"
                        >
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                <GraduationCap size={24} />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">{course.name}</h3>
                            <div className="flex items-center gap-2 text-slate-400 mb-6 text-sm font-medium">
                                <Clock size={14} />
                                <span>{course.duration}</span>
                            </div>

                            <ul className="space-y-3 mb-8 flex-grow">
                                {course.highlights.map((highlight, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <Check size={16} className="text-blue-600 mt-1 flex-shrink-0" />
                                        <span className="text-sm text-slate-600 font-medium">
                                            {highlight}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <button className="text-sm font-bold text-slate-900 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                                Program Details
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
