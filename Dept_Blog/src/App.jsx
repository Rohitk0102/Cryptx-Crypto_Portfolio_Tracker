import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Hero from './components/sections/Hero';
import About from './components/sections/About';
import HOD from './components/sections/HOD';
import Courses from './components/sections/Courses';
import Events from './components/sections/Events';

export default function App() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <Navbar />
      <main>
        <Hero />
        <About />
        <HOD />
        <Courses />
        <Events />
      </main>
      <Footer />
    </div>
  );
}
