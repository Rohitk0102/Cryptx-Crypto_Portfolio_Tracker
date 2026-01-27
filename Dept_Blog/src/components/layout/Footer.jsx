import { Mail, MapPin, Phone, Github, Linkedin, Twitter } from 'lucide-react';
import { departmentInfo } from '../../data/content';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer id="contact" className="bg-slate-900 text-white pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
                    {/* Logo & Info */}
                    <div className="md:col-span-6">
                        <h3 className="text-3xl font-extrabold mb-6 tracking-tight">
                            Information Technology &<br />
                            <span className="text-slate-400">Computer Applications</span>
                        </h3>
                        <p className="text-slate-400 max-w-sm text-lg mb-8 font-medium">
                            Andhra University College of Engineering (A). Professional education for the digital age.
                        </p>
                        <div className="flex gap-4">
                            {[Linkedin, Twitter, Github].map((Icon, idx) => (
                                <a key={idx} href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-900 transition-all">
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="md:col-span-3">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-8">Navigation</h4>
                        <ul className="space-y-4">
                            {['About', 'HOD', 'Courses', 'Events'].map((item) => (
                                <li key={item}>
                                    <a href={`#${item.toLowerCase()}`} className="text-slate-300 hover:text-white transition-colors font-medium">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="md:col-span-3">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-8">Contact</h4>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <Mail size={18} className="text-slate-500 mt-1" />
                                <div>
                                    <p className="text-xs font-bold text-slate-600 uppercase mb-1">Email</p>
                                    <a href="mailto:itca@andhrauniversity.edu.in" className="font-bold hover:text-slate-300 transition-colors text-sm">itca@andhrauniversity.edu.in</a>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <MapPin size={18} className="text-slate-500 mt-1" />
                                <div>
                                    <p className="text-xs font-bold text-slate-600 uppercase mb-1">Office</p>
                                    <p className="font-bold text-sm leading-relaxed">AUCE (A), Visakhapatnam, 530003</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-sm font-bold text-slate-500">
                        © {currentYear} IT&CA Department, Andhra University
                    </p>
                    <div className="flex gap-8 text-sm font-bold text-slate-600">
                        <a href="#" className="hover:text-white">Privacy Policy</a>
                        <a href="#" className="hover:text-white">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
