import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import {
  Menu, X, ArrowRight, Search, Mail, Lock, User as UserIcon,
  BookOpen, Library, LayoutGrid, Sparkles, UserCircle, Shield,
  Plus, Check, XCircle, Clock, RotateCcw, Tag, ChevronDown, LogOut
} from 'lucide-react';

/* ============================================================
   TOKENS
   ink        #10140f   deep moss-black background
   ink2       #161b14   panel / card background
   line       #2a2f24   hairline borders
   paper      #f2e8d2   aged-paper cream (stamps, light chips)
   brass      #b98d4c   primary accent
   brassLight #ddb87a   accent hover
   forest     #3c5c46   secondary accent (available / success)
   rust       #a85c3c   tertiary accent (due / alert)
   text       #ded8c8   primary text
   muted      #8c8677   secondary text
   ============================================================ */

/* ---------------- Font injection ---------------- */
function useLibraryFonts() {
  useEffect(() => {
    if (document.getElementById('lib-fonts')) return;
    const link = document.createElement('link');
    link.id = 'lib-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap';
    document.head.appendChild(link);
  }, []);
}

/* ---------------- Reveal on scroll (no framer-motion available) ---------------- */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold, rootMargin: '-40px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: `opacity 0.7s cubic-bezier(.22,1,.36,1) ${delay}s, transform 0.7s cubic-bezier(.22,1,.36,1) ${delay}s`,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)'
      }}
    >
      {children}
    </div>
  );
}

/* ---------------- Count-up ---------------- */
function useCountUp(target, active, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf, start;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return val;
}

/* ---------------- 3D hero: a stack of books, rendered in vanilla three.js ---------------- */
function BookStack3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const width = mount.clientWidth || 400;
    const height = mount.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0.4, 1.1, 5.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffe8c0, 1.1);
    key.position.set(3, 4, 3);
    scene.add(key);
    const rim = new THREE.PointLight(0xb98d4c, 1.1, 12);
    rim.position.set(-3, 1.5, 2);
    scene.add(rim);
    const fill = new THREE.PointLight(0x3c5c46, 0.6, 10);
    fill.position.set(2, -1, -2);
    scene.add(fill);

    const group = new THREE.Group();
    scene.add(group);

    const bookColors = [0xa85c3c, 0x3c5c46, 0xb98d4c, 0x5a4632];
    const stack = new THREE.Group();
    const bookW = 1.5, bookD = 1.05;
    for (let i = 0; i < 4; i++) {
      const h = 0.13 + (i % 2) * 0.03;
      const geo = new THREE.BoxGeometry(bookW - i * 0.08, h, bookD - i * 0.05);
      const mat = new THREE.MeshStandardMaterial({ color: bookColors[i % bookColors.length], roughness: 0.55, metalness: 0.05 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = i * 0.16;
      mesh.rotation.y = (i - 1.5) * 0.09;
      stack.add(mesh);

      // page-block edge (cream sliver) to read as a book, not a box
      const pageGeo = new THREE.BoxGeometry(bookW - i * 0.08 - 0.08, h - 0.03, bookD - i * 0.05 - 0.06);
      const pageMat = new THREE.MeshStandardMaterial({ color: 0xf2e8d2, roughness: 0.9 });
      const page = new THREE.Mesh(pageGeo, pageMat);
      page.position.set(0.03, i * 0.16, 0);
      page.rotation.y = mesh.rotation.y;
      stack.add(page);
    }
    stack.position.y = -0.35;
    group.add(stack);

    // an open book resting on top, angled toward camera
    const openBook = new THREE.Group();
    const coverGeo = new THREE.BoxGeometry(0.62, 0.03, 0.85);
    const coverMat = new THREE.MeshStandardMaterial({ color: 0xb98d4c, roughness: 0.4, metalness: 0.15 });
    const leftCover = new THREE.Mesh(coverGeo, coverMat);
    leftCover.position.set(-0.32, 0, 0);
    leftCover.rotation.z = 0.32;
    const rightCover = new THREE.Mesh(coverGeo, coverMat);
    rightCover.position.set(0.32, 0, 0);
    rightCover.rotation.z = -0.32;
    const pagesGeo = new THREE.BoxGeometry(0.6, 0.05, 0.82);
    const pagesMat = new THREE.MeshStandardMaterial({ color: 0xf2e8d2, roughness: 0.85 });
    const pages = new THREE.Mesh(pagesGeo, pagesMat);
    openBook.add(leftCover, rightCover, pages);
    openBook.position.set(0, 0.42, 0.15);
    openBook.rotation.x = -0.25;
    group.add(openBook);

    const clock = new THREE.Clock();
    let raf;
    const animate = () => {
      const t = clock.getElapsedTime();
      group.rotation.y = t * 0.28;
      group.position.y = Math.sin(t * 0.7) * 0.06;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(raf);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
}

/* ---------------- Mock data (shapes mirror the described API) ---------------- */
const GENRES = ['Fiction', 'Poetry', 'Science', 'History', 'Philosophy', 'Mathematics'];

const BOOKS = [
  { id: 'b1', title: 'The Unquiet Archive', author: 'Nadia Okoye', genre: 'Fiction', subject: 'Contemporary Lit', condition: 'Good', listingType: 'library', price: null, available: true, call: 'F—OKO—14', color: '#a85c3c' },
  { id: 'b2', title: 'Elements of Still Water', author: 'H. Marchetti', genre: 'Poetry', subject: 'Modern Poetry', condition: 'Like New', listingType: 'p2p', price: 6, available: true, call: 'P—MAR—02', color: '#3c5c46' },
  { id: 'b3', title: 'A Short History of Almost Everyone', author: 'D. Falk', genre: 'History', subject: 'World History', condition: 'Fair', listingType: 'library', price: null, available: false, call: 'H—FAL—21', color: '#b98d4c' },
  { id: 'b4', title: 'Proofs Without Words', author: 'R. Iyer', genre: 'Mathematics', subject: 'Combinatorics', condition: 'Good', listingType: 'p2p', price: 8, available: true, call: 'M—IYE—07', color: '#5a4632' },
  { id: 'b5', title: 'On Certain Kinds of Doubt', author: 'S. Weyland', genre: 'Philosophy', subject: 'Epistemology', condition: 'Good', listingType: 'library', price: null, available: true, call: 'PH—WEY—09', color: '#a85c3c' },
  { id: 'b6', title: 'The Cartography of Small Towns', author: 'J. Renner', genre: 'Fiction', subject: 'Regional Fiction', condition: 'Like New', listingType: 'p2p', price: 5, available: true, call: 'F—REN—33', color: '#3c5c46' },
  { id: 'b7', title: 'Fieldnotes on Weather', author: 'C. Obi', genre: 'Science', subject: 'Earth Science', condition: 'Fair', listingType: 'library', price: null, available: true, call: 'S—OBI—18', color: '#b98d4c' },
  { id: 'b8', title: 'Late Correspondence', author: 'M. Faulkner', genre: 'Poetry', subject: 'Epistolary Poetry', condition: 'Good', listingType: 'library', price: null, available: false, call: 'P—FAU—05', color: '#5a4632' },
  { id: 'b9', title: 'The Weight of Small Numbers', author: 'A. Petrossian', genre: 'Mathematics', subject: 'Number Theory', condition: 'Like New', listingType: 'p2p', price: 7, available: true, call: 'M—PET—11', color: '#a85c3c' }
];

const RENTALS = [
  { id: 'r1', bookTitle: 'The Unquiet Archive', author: 'Nadia Okoye', status: 'active', dueDate: '2026-08-14', daysLeft: 13, totalDays: 21 },
  { id: 'r2', bookTitle: 'Fieldnotes on Weather', author: 'C. Obi', status: 'requested', dueDate: null, daysLeft: null, totalDays: null },
  { id: 'r3', bookTitle: 'A Short History of Almost Everyone', author: 'D. Falk', status: 'returned', dueDate: '2026-06-02', daysLeft: 0, totalDays: 21 }
];

const RECOMMENDATIONS = [
  { id: 'rec1', title: 'The Cartography of Small Towns', author: 'J. Renner', match: 94, reason: 'Matches your interest in regional fiction and past rental of "The Unquiet Archive."' },
  { id: 'rec2', title: 'On Certain Kinds of Doubt', author: 'S. Weyland', match: 87, reason: 'Popular among students who also browsed Philosophy titles this term.' },
  { id: 'rec3', title: 'Proofs Without Words', author: 'R. Iyer', match: 76, reason: 'Matches your saved subject preference: Combinatorics.' }
];

const LISTINGS = [
  { id: 'l1', title: 'Elements of Still Water', requests: [{ id: 'req1', name: 'K. Sundaram', status: 'pending' }] },
  { id: 'l2', title: 'The Weight of Small Numbers', requests: [{ id: 'req2', name: 'D. Alaoui', status: 'pending' }, { id: 'req3', name: 'F. Nakamura', status: 'approved' }] }
];

const ADMIN_STATS = {
  totalBooks: 214,
  activeRentals: 58,
  totalUsers: 341,
  genreBreakdown: [
    { genre: 'Fiction', count: 68 }, { genre: 'History', count: 41 }, { genre: 'Science', count: 37 },
    { genre: 'Poetry', count: 29 }, { genre: 'Philosophy', count: 22 }, { genre: 'Mathematics', count: 17 }
  ],
  statusBreakdown: [
    { status: 'Active', count: 58, color: '#3c5c46' }, { status: 'Requested', count: 14, color: '#b98d4c' },
    { status: 'Returned', count: 132, color: '#8c8677' }, { status: 'Overdue', count: 10, color: '#a85c3c' }
  ],
  topBooks: [
    { title: 'The Unquiet Archive', rentals: 19 }, { title: 'A Short History of Almost Everyone', rentals: 16 },
    { title: 'Late Correspondence', rentals: 13 }, { title: 'Elements of Still Water', rentals: 11 }
  ]
};

/* ---------------- Small atoms ---------------- */
function StatusBadge({ status }) {
  const map = {
    active: { label: 'Active', color: '#3c5c46', bg: 'rgba(60,92,70,0.16)' },
    requested: { label: 'Requested', color: '#b98d4c', bg: 'rgba(185,141,76,0.16)' },
    returned: { label: 'Returned', color: '#8c8677', bg: 'rgba(140,134,119,0.16)' },
    pending: { label: 'Pending', color: '#b98d4c', bg: 'rgba(185,141,76,0.16)' },
    approved: { label: 'Approved', color: '#3c5c46', bg: 'rgba(60,92,70,0.16)' }
  };
  const s = map[status] || map.returned;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] tracking-[0.15em] uppercase font-medium transition-colors duration-500"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
      {s.label}
    </span>
  );
}

function StampBurst({ text, show }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
      <div
        className="border-[3px] rounded-md px-6 py-2 font-mono text-lg tracking-[0.3em] uppercase"
        style={{
          color: '#a85c3c', borderColor: '#a85c3c',
          transform: 'rotate(-9deg)',
          animation: 'stampIn 0.5s cubic-bezier(.2,1.4,.4,1) forwards'
        }}
      >
        {text}
      </div>
    </div>
  );
}

function MatchBar({ value, active }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setW(value), 120);
    return () => clearTimeout(t);
  }, [active, value]);
  return (
    <div className="w-full h-1.5 rounded-full bg-[#2a2f24] overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${w}%`,
          background: 'linear-gradient(90deg, #3c5c46, #b98d4c)',
          transition: 'width 1.1s cubic-bezier(.22,1,.36,1)'
        }}
      />
    </div>
  );
}

function BookCover({ color, className = '' }) {
  return (
    <div
      className={`relative rounded-md overflow-hidden ${className}`}
      style={{ background: `linear-gradient(155deg, ${color}, #10140f 130%)` }}
    >
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: '#f2e8d2', opacity: 0.25 }} />
      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-px" style={{ backgroundColor: '#f2e8d2', opacity: 0.4 }} />
    </div>
  );
}

/* ---------------- Layout shell ---------------- */
const NAV_ITEMS = [
  { key: 'browse', label: 'Browse', icon: Library, roles: ['student', 'owner', 'admin'] },
  { key: 'recommendations', label: 'For You', icon: Sparkles, roles: ['student', 'owner', 'admin'] },
  { key: 'myRentals', label: 'My Rentals', icon: BookOpen, roles: ['student', 'owner', 'admin'] },
  { key: 'myListings', label: 'My Listings', icon: LayoutGrid, roles: ['owner', 'admin'] },
  { key: 'admin', label: 'Admin', icon: Shield, roles: ['admin'] },
  { key: 'profile', label: 'Profile', icon: UserCircle, roles: ['student', 'owner', 'admin'] }
];

function NavShell({ page, setPage, role, onSignOut, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role));

  return (
    <div className="min-h-screen bg-[#10140f] text-[#ded8c8]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <nav className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 md:px-10 py-5 backdrop-blur-md bg-[#10140f]/80 border-b border-[#2a2f24]">
        <button onClick={() => setPage('browse')} className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-[#b98d4c]" />
          <span className="text-base tracking-[0.22em] uppercase" style={{ fontFamily: "'Fraunces', serif" }}>Endsheet</span>
        </button>

        <div className="hidden md:flex items-center gap-8">
          {items.map((item) => {
            const Icon = item.icon;
            const activeItem = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                className="relative flex items-center gap-1.5 text-xs tracking-[0.14em] uppercase pb-1 transition-colors"
                style={{ color: activeItem ? '#ddb87a' : '#8c8677' }}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
                <span
                  className="absolute -bottom-[1px] left-0 h-[1.5px] bg-[#b98d4c] transition-all duration-300"
                  style={{ width: activeItem ? '100%' : '0%' }}
                />
              </button>
            );
          })}
          <button onClick={onSignOut} className="text-xs tracking-[0.14em] uppercase text-[#8c8677] hover:text-[#a85c3c] transition-colors flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        <button onClick={() => setMenuOpen(true)} className="md:hidden text-[#ded8c8]">
          <Menu className="w-6 h-6" />
        </button>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-[#10140f]/98 flex flex-col items-center justify-center gap-7">
          <button onClick={() => setMenuOpen(false)} className="absolute top-6 right-6 text-[#ded8c8]"><X className="w-6 h-6" /></button>
          {items.map((item) => (
            <button key={item.key} onClick={() => { setPage(item.key); setMenuOpen(false); }} className="text-xl" style={{ fontFamily: "'Fraunces', serif", color: page === item.key ? '#ddb87a' : '#ded8c8' }}>
              {item.label}
            </button>
          ))}
          <button onClick={onSignOut} className="mt-4 text-sm tracking-[0.14em] uppercase text-[#a85c3c]">Sign Out</button>
        </div>
      )}

      <main className="pt-24">{children}</main>
    </div>
  );
}

/* ---------------- AUTH PAGE ---------------- */
function AuthPage({ onSignIn }) {
  useLibraryFonts();
  const [mode, setMode] = useState('signin');
  const [role, setRole] = useState('student');

  return (
    <div className="min-h-screen bg-[#10140f] text-[#ded8c8] relative overflow-hidden flex items-center justify-center px-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,#1a2117_0%,#10140f_65%)]" />
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: '#3c5c46' }} />
      <div className="absolute -bottom-24 -right-16 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: '#b98d4c' }} />

      <div className="relative z-10 w-full max-w-md">
        <Reveal className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <BookOpen className="w-6 h-6 text-[#b98d4c]" />
            <span className="text-lg tracking-[0.25em] uppercase" style={{ fontFamily: "'Fraunces', serif" }}>Endsheet</span>
          </div>
          <p className="text-xs tracking-[0.25em] uppercase text-[#8c8677]">A campus book exchange</p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-[#2a2f24] bg-[#161b14]/80 backdrop-blur-xl p-8">
            <div className="flex mb-7 rounded-full border border-[#2a2f24] p-1">
              {['signin', 'signup'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 py-2 text-xs tracking-[0.15em] uppercase rounded-full transition-colors"
                  style={{ backgroundColor: mode === m ? '#b98d4c' : 'transparent', color: mode === m ? '#10140f' : '#8c8677' }}
                >
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); onSignIn(role); }} className="space-y-4">
              {mode === 'signup' && (
                <div className="flex items-center gap-3 border-b border-[#2a2f24] focus-within:border-[#b98d4c] transition-colors pb-2.5">
                  <UserIcon className="w-4 h-4 text-[#8c8677]" />
                  <input required placeholder="Full name" className="flex-1 bg-transparent text-sm placeholder-[#5f5b4f] focus:outline-none" />
                </div>
              )}
              <div className="flex items-center gap-3 border-b border-[#2a2f24] focus-within:border-[#b98d4c] transition-colors pb-2.5">
                <Mail className="w-4 h-4 text-[#8c8677]" />
                <input required type="email" placeholder="you@university.edu" className="flex-1 bg-transparent text-sm placeholder-[#5f5b4f] focus:outline-none" />
              </div>
              <div className="flex items-center gap-3 border-b border-[#2a2f24] focus-within:border-[#b98d4c] transition-colors pb-2.5">
                <Lock className="w-4 h-4 text-[#8c8677]" />
                <input required type="password" placeholder="Password" className="flex-1 bg-transparent text-sm placeholder-[#5f5b4f] focus:outline-none" />
              </div>

              {mode === 'signup' && (
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#8c8677] mb-2">I am a</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['student', 'owner', 'admin'].map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        className="py-2 rounded-lg text-[11px] tracking-[0.1em] uppercase border transition-colors capitalize"
                        style={{
                          borderColor: role === r ? '#b98d4c' : '#2a2f24',
                          color: role === r ? '#ddb87a' : '#8c8677',
                          backgroundColor: role === r ? 'rgba(185,141,76,0.08)' : 'transparent'
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="w-full mt-2 py-3 rounded-full bg-[#b98d4c] text-[#10140f] text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#ddb87a] transition-colors flex items-center justify-center gap-2">
                {mode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </Reveal>

        <Reveal delay={0.2} className="text-center mt-6">
          <p className="text-[11px] text-[#5f5b4f]">Demo only — sign in instantly as any role above.</p>
        </Reveal>
      </div>
    </div>
  );
}

/* ---------------- BROWSE PAGE ---------------- */
function BrowsePage({ onOpenBook }) {
  const [query, setQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const filtered = BOOKS.filter((b) => {
    const matchesQuery = (b.title + b.author).toLowerCase().includes(query.toLowerCase());
    const matchesGenre = genreFilter === 'All' || b.genre === genreFilter;
    const matchesType = typeFilter === 'All' || b.listingType === typeFilter;
    return matchesQuery && matchesGenre && matchesType;
  });

  return (
    <div>
      <section className="relative h-[70vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#1a2117_0%,#10140f_70%)]" />
        <div className="absolute inset-0"><BookStack3D /></div>
        <div className="relative z-10 h-full flex flex-col items-center justify-end pb-16 px-6 text-center pointer-events-none">
          <p className="text-[11px] tracking-[0.35em] uppercase text-[#b98d4c] mb-4">Library &amp; Peer Exchange</p>
          <h1 className="text-5xl md:text-6xl leading-[1.05] max-w-2xl text-[#f2e8d2]" style={{ fontFamily: "'Fraunces', serif" }}>
            Every Book Here<br />Has Been Read Before
          </h1>
          <p className="mt-5 text-sm md:text-base text-[#8c8677] max-w-md">
            Borrow from the campus library, or rent directly from students who've already turned the pages.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-10 -mt-10 relative z-10 max-w-6xl mx-auto">
        <Reveal className="rounded-2xl border border-[#2a2f24] bg-[#161b14] p-4 md:p-5 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex items-center gap-2.5 flex-1 border border-[#2a2f24] rounded-full px-4 py-2.5">
            <Search className="w-4 h-4 text-[#8c8677]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title or author…"
              className="flex-1 bg-transparent text-sm placeholder-[#5f5b4f] focus:outline-none"
            />
          </div>
          <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className="bg-[#10140f] border border-[#2a2f24] rounded-full px-4 py-2.5 text-xs tracking-wide focus:outline-none">
            <option>All</option>
            {GENRES.map((g) => <option key={g}>{g}</option>)}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-[#10140f] border border-[#2a2f24] rounded-full px-4 py-2.5 text-xs tracking-wide focus:outline-none">
            <option value="All">All Listings</option>
            <option value="library">Library</option>
            <option value="p2p">Peer-to-Peer</option>
          </select>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 my-12">
          {filtered.map((b, i) => (
            <Reveal key={b.id} delay={(i % 3) * 0.08}>
              <button onClick={() => onOpenBook(b.id)} className="group text-left w-full rounded-2xl border border-[#2a2f24] overflow-hidden hover:border-[#b98d4c]/50 transition-colors">
                <BookCover color={b.color} className="h-40 group-hover:scale-[1.03] transition-transform duration-500" />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] tracking-[0.1em] text-[#8c8677]">{b.call}</span>
                    <span className="text-[10px] tracking-[0.15em] uppercase" style={{ color: b.available ? '#3c5c46' : '#a85c3c' }}>
                      {b.available ? 'Available' : 'Checked Out'}
                    </span>
                  </div>
                  <h3 className="text-lg text-[#f2e8d2] leading-snug" style={{ fontFamily: "'Fraunces', serif" }}>{b.title}</h3>
                  <p className="text-xs text-[#8c8677] mt-1">{b.author} · {b.genre}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] tracking-[0.15em] uppercase text-[#5f5b4f]">{b.listingType === 'library' ? 'Library Copy' : `Peer · $${b.price}/mo`}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#b98d4c] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </button>
            </Reveal>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-sm text-[#5f5b4f] py-16">No titles match — try clearing a filter.</p>
          )}
        </div>
      </section>
    </div>
  );
}

/* ---------------- BOOK DETAILS PAGE ---------------- */
function BookDetailsPage({ bookId, onBack }) {
  const book = BOOKS.find((b) => b.id === bookId) || BOOKS[0];
  const [requested, setRequested] = useState(false);
  const [showStamp, setShowStamp] = useState(false);

  const handleRequest = () => {
    setRequested(true);
    setShowStamp(true);
    setTimeout(() => setShowStamp(false), 1400);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-10">
      <button onClick={onBack} className="text-xs tracking-[0.15em] uppercase text-[#8c8677] hover:text-[#b98d4c] mb-8 flex items-center gap-1.5">
        ← Back to Browse
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <Reveal>
          <div className="relative">
            <BookCover color={book.color} className="h-[420px]" />
            <StampBurst text={book.listingType === 'library' ? 'Requested' : 'Sent'} show={showStamp} />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <span className="font-mono text-[11px] tracking-[0.1em] text-[#8c8677]">{book.call}</span>
          <h1 className="text-4xl mt-2 mb-3 text-[#f2e8d2]" style={{ fontFamily: "'Fraunces', serif" }}>{book.title}</h1>
          <p className="text-sm text-[#8c8677] mb-6">{book.author} · {book.genre} · {book.subject}</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="border border-[#2a2f24] rounded-xl p-4">
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#5f5b4f] mb-1">Condition</p>
              <p className="text-sm text-[#ded8c8]">{book.condition}</p>
            </div>
            <div className="border border-[#2a2f24] rounded-xl p-4">
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#5f5b4f] mb-1">Listing</p>
              <p className="text-sm text-[#ded8c8]">{book.listingType === 'library' ? 'Campus Library' : `Peer · $${book.price}/mo`}</p>
            </div>
          </div>

          <p className="text-sm text-[#8c8677] leading-relaxed mb-8">
            A well-kept copy currently in the {book.listingType === 'library' ? 'library stacks' : 'personal collection of a fellow student'}.
            Standard rental period is 21 days, renewable once if no other request is pending.
          </p>

          <button
            onClick={handleRequest}
            disabled={requested || !book.available}
            className="px-8 py-3.5 rounded-full text-xs tracking-[0.2em] uppercase font-medium transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
            style={{
              backgroundColor: requested ? 'transparent' : book.available ? '#b98d4c' : '#2a2f24',
              color: requested ? '#3c5c46' : book.available ? '#10140f' : '#5f5b4f',
              border: requested ? '1px solid #3c5c46' : 'none'
            }}
          >
            {requested ? <><Check className="w-3.5 h-3.5" /> Request Sent</> : book.available ? <>Request to Rent <ArrowRight className="w-3.5 h-3.5" /></> : 'Currently Unavailable'}
          </button>
        </Reveal>
      </div>
    </div>
  );
}

/* ---------------- RECOMMENDATIONS PAGE ---------------- */
function RecommendationsPage({ onOpenBook }) {
  const [ref, inView] = useInView();
  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-14" ref={ref}>
      <Reveal className="mb-12 text-center">
        <p className="text-[11px] tracking-[0.35em] uppercase text-[#b98d4c] mb-3">Curated From Your Shelf</p>
        <h1 className="text-4xl text-[#f2e8d2]" style={{ fontFamily: "'Fraunces', serif" }}>Recommended For You</h1>
      </Reveal>

      <div className="space-y-5">
        {RECOMMENDATIONS.map((r, i) => {
          const book = BOOKS.find((b) => b.title === r.title);
          return (
            <Reveal key={r.id} delay={i * 0.1}>
              <button
                onClick={() => book && onOpenBook(book.id)}
                className="w-full text-left flex flex-col md:flex-row gap-5 md:items-center border border-[#2a2f24] rounded-2xl p-5 hover:border-[#b98d4c]/40 transition-colors"
              >
                <BookCover color={book?.color || '#3c5c46'} className="w-full md:w-24 h-32 md:h-28 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg text-[#f2e8d2]" style={{ fontFamily: "'Fraunces', serif" }}>{r.title}</h3>
                    <span className="font-mono text-sm text-[#ddb87a]">{r.match}%</span>
                  </div>
                  <p className="text-xs text-[#8c8677] mb-3">{r.author}</p>
                  <MatchBar value={r.match} active={inView} />
                  <p className="text-xs text-[#5f5b4f] mt-3 leading-relaxed">{r.reason}</p>
                </div>
              </button>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- MY RENTALS PAGE ---------------- */
function MyRentalsPage() {
  const [rentals, setRentals] = useState(RENTALS);
  const returnBook = (id) => setRentals((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'returned', daysLeft: 0 } : r)));

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-14">
      <Reveal className="mb-10">
        <p className="text-[11px] tracking-[0.35em] uppercase text-[#b98d4c] mb-3">Your Checkout Card</p>
        <h1 className="text-4xl text-[#f2e8d2]" style={{ fontFamily: "'Fraunces', serif" }}>My Rentals</h1>
      </Reveal>

      <div className="space-y-4">
        {rentals.map((r, i) => {
          const progress = r.totalDays ? Math.max(0, Math.min(100, 100 - (r.daysLeft / r.totalDays) * 100)) : 0;
          return (
            <Reveal key={r.id} delay={i * 0.08}>
              <div className="border border-[#2a2f24] rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base text-[#f2e8d2]" style={{ fontFamily: "'Fraunces', serif" }}>{r.bookTitle}</h3>
                    <p className="text-xs text-[#8c8677]">{r.author}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                {r.status === 'active' && (
                  <>
                    <div className="w-full h-1.5 rounded-full bg-[#2a2f24] overflow-hidden mb-2">
                      <div className="h-full rounded-full bg-[#b98d4c] transition-all duration-700" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-[#8c8677] flex items-center gap-1.5"><Clock className="w-3 h-3" /> {r.daysLeft} days left · due {r.dueDate}</p>
                      <button onClick={() => returnBook(r.id)} className="text-[11px] tracking-[0.1em] uppercase text-[#ddb87a] hover:text-[#b98d4c] flex items-center gap-1.5">
                        <RotateCcw className="w-3 h-3" /> Return Book
                      </button>
                    </div>
                  </>
                )}
                {r.status === 'requested' && <p className="text-[11px] text-[#8c8677]">Awaiting approval from the lender.</p>}
                {r.status === 'returned' && <p className="text-[11px] text-[#5f5b4f]">Returned on {r.dueDate}.</p>}
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- MY LISTINGS PAGE (owner) ---------------- */
function MyListingsPage({ onAddBook }) {
  const [listings, setListings] = useState(LISTINGS);
  const [flash, setFlash] = useState(null);

  const decide = (listingId, reqId, status) => {
    setListings((prev) => prev.map((l) => l.id === listingId ? { ...l, requests: l.requests.map((r) => r.id === reqId ? { ...r, status } : r) } : l));
    setFlash(reqId);
    setTimeout(() => setFlash(null), 900);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-14">
      <Reveal className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.35em] uppercase text-[#b98d4c] mb-3">Your Shelf</p>
          <h1 className="text-4xl text-[#f2e8d2]" style={{ fontFamily: "'Fraunces', serif" }}>My Listings</h1>
        </div>
        <button onClick={onAddBook} className="self-start px-6 py-3 rounded-full bg-[#b98d4c] text-[#10140f] text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#ddb87a] transition-colors flex items-center gap-2">
          <Plus className="w-3.5 h-3.5" /> Add Book
        </button>
      </Reveal>

      <div className="space-y-6">
        {listings.map((l, i) => (
          <Reveal key={l.id} delay={i * 0.1}>
            <div className="border border-[#2a2f24] rounded-2xl p-5">
              <h3 className="text-base text-[#f2e8d2] mb-4" style={{ fontFamily: "'Fraunces', serif" }}>{l.title}</h3>
              <div className="space-y-2.5">
                {l.requests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between border border-[#2a2f24] rounded-xl px-4 py-2.5" style={{ backgroundColor: flash === r.id ? 'rgba(60,92,70,0.12)' : 'transparent', transition: 'background-color 0.5s' }}>
                    <span className="text-sm text-[#ded8c8]">{r.name}</span>
                    {r.status === 'pending' ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => decide(l.id, r.id, 'approved')} className="w-7 h-7 rounded-full border border-[#3c5c46] text-[#3c5c46] flex items-center justify-center hover:bg-[#3c5c46] hover:text-[#10140f] transition-colors"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => decide(l.id, r.id, 'rejected')} className="w-7 h-7 rounded-full border border-[#a85c3c] text-[#a85c3c] flex items-center justify-center hover:bg-[#a85c3c] hover:text-[#10140f] transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <StatusBadge status={r.status === 'approved' ? 'approved' : 'returned'} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ---------------- ADD / EDIT BOOK PAGE ---------------- */
function AddEditBookPage({ onDone }) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setDone(true); setTimeout(onDone, 900); }, 900);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-10 py-14">
      <Reveal className="mb-10">
        <p className="text-[11px] tracking-[0.35em] uppercase text-[#b98d4c] mb-3">New Entry</p>
        <h1 className="text-4xl text-[#f2e8d2]" style={{ fontFamily: "'Fraunces', serif" }}>List a Book</h1>
      </Reveal>

      <Reveal delay={0.1}>
        <form onSubmit={submit} className="space-y-5 border border-[#2a2f24] rounded-2xl p-7">
          {[
            { label: 'Title', placeholder: 'e.g. The Unquiet Archive' },
            { label: 'Author', placeholder: 'e.g. Nadia Okoye' },
            { label: 'Subject', placeholder: 'e.g. Contemporary Lit' }
          ].map((f) => (
            <div key={f.label}>
              <label className="text-[10px] tracking-[0.15em] uppercase text-[#8c8677] mb-1.5 block">{f.label}</label>
              <input required placeholder={f.placeholder} className="w-full bg-[#10140f] border border-[#2a2f24] focus:border-[#b98d4c] rounded-lg px-4 py-2.5 text-sm placeholder-[#5f5b4f] focus:outline-none transition-colors" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] tracking-[0.15em] uppercase text-[#8c8677] mb-1.5 block">Genre</label>
              <select className="w-full bg-[#10140f] border border-[#2a2f24] focus:border-[#b98d4c] rounded-lg px-4 py-2.5 text-sm focus:outline-none">
                {GENRES.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] tracking-[0.15em] uppercase text-[#8c8677] mb-1.5 block">Condition</label>
              <select className="w-full bg-[#10140f] border border-[#2a2f24] focus:border-[#b98d4c] rounded-lg px-4 py-2.5 text-sm focus:outline-none">
                <option>Like New</option><option>Good</option><option>Fair</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] tracking-[0.15em] uppercase text-[#8c8677] mb-1.5 block">Monthly Rental Price (P2P only)</label>
            <input type="number" min="0" placeholder="8" className="w-full bg-[#10140f] border border-[#2a2f24] focus:border-[#b98d4c] rounded-lg px-4 py-2.5 text-sm placeholder-[#5f5b4f] focus:outline-none transition-colors" />
          </div>

          <button type="submit" disabled={submitting || done} className="w-full py-3.5 rounded-full text-xs tracking-[0.2em] uppercase font-medium transition-colors flex items-center justify-center gap-2"
            style={{ backgroundColor: done ? 'transparent' : '#b98d4c', color: done ? '#3c5c46' : '#10140f', border: done ? '1px solid #3c5c46' : 'none' }}>
            {done ? <><Check className="w-3.5 h-3.5" /> Listed</> : submitting ? 'Saving…' : 'List Book'}
          </button>
        </form>
      </Reveal>
    </div>
  );
}

/* ---------------- ADMIN DASHBOARD ---------------- */
function AdminDashboard() {
  const [ref, inView] = useInView(0.1);
  const totalBooks = useCountUp(ADMIN_STATS.totalBooks, inView);
  const activeRentals = useCountUp(ADMIN_STATS.activeRentals, inView);
  const totalUsers = useCountUp(ADMIN_STATS.totalUsers, inView);
  const maxGenre = Math.max(...ADMIN_STATS.genreBreakdown.map((g) => g.count));
  const totalStatus = ADMIN_STATS.statusBreakdown.reduce((s, x) => s + x.count, 0);

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-14" ref={ref}>
      <Reveal className="mb-10">
        <p className="text-[11px] tracking-[0.35em] uppercase text-[#b98d4c] mb-3">Circulation Desk</p>
        <h1 className="text-4xl text-[#f2e8d2]" style={{ fontFamily: "'Fraunces', serif" }}>Admin Dashboard</h1>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
        {[
          { label: 'Books Catalogued', value: totalBooks },
          { label: 'Active Rentals', value: activeRentals },
          { label: 'Registered Users', value: totalUsers }
        ].map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08}>
            <div className="border border-[#2a2f24] rounded-2xl p-6">
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#8c8677] mb-2">{s.label}</p>
              <p className="text-4xl text-[#f2e8d2] font-mono">{s.value}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Reveal>
          <h3 className="text-sm tracking-[0.15em] uppercase text-[#8c8677] mb-5">By Genre</h3>
          <div className="space-y-3">
            {ADMIN_STATS.genreBreakdown.map((g) => (
              <div key={g.genre}>
                <div className="flex justify-between text-xs mb-1"><span className="text-[#ded8c8]">{g.genre}</span><span className="text-[#8c8677] font-mono">{g.count}</span></div>
                <div className="w-full h-2 rounded-full bg-[#2a2f24] overflow-hidden">
                  <div className="h-full rounded-full bg-[#b98d4c]" style={{ width: inView ? `${(g.count / maxGenre) * 100}%` : '0%', transition: 'width 1s cubic-bezier(.22,1,.36,1)' }} />
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h3 className="text-sm tracking-[0.15em] uppercase text-[#8c8677] mb-5">Rental Status</h3>
          <div className="flex h-4 w-full rounded-full overflow-hidden mb-4 border border-[#2a2f24]">
            {ADMIN_STATS.statusBreakdown.map((s) => (
              <div key={s.status} style={{ width: inView ? `${(s.count / totalStatus) * 100}%` : '0%', backgroundColor: s.color, transition: 'width 1s cubic-bezier(.22,1,.36,1)' }} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ADMIN_STATS.statusBreakdown.map((s) => (
              <div key={s.status} className="flex items-center gap-2 text-xs text-[#8c8677]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} /> {s.status} <span className="font-mono text-[#ded8c8]">{s.count}</span>
              </div>
            ))}
          </div>

          <h3 className="text-sm tracking-[0.15em] uppercase text-[#8c8677] mt-8 mb-4">Most Requested</h3>
          <div className="space-y-2">
            {ADMIN_STATS.topBooks.map((b, i) => (
              <div key={b.title} className="flex items-center justify-between text-xs border-b border-[#2a2f24] pb-2">
                <span className="text-[#ded8c8]">{b.title}</span>
                <span className="font-mono text-[#b98d4c]">{b.rentals}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* ---------------- PROFILE PAGE ---------------- */
function ProfilePage() {
  const [genres, setGenres] = useState(['Fiction', 'Philosophy']);
  const [input, setInput] = useState('');

  const addTag = (e) => {
    e.preventDefault();
    const v = input.trim();
    if (v && !genres.includes(v)) setGenres([...genres, v]);
    setInput('');
  };
  const removeTag = (g) => setGenres(genres.filter((x) => x !== g));

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-10 py-14">
      <Reveal className="mb-10">
        <p className="text-[11px] tracking-[0.35em] uppercase text-[#b98d4c] mb-3">Reader Card</p>
        <h1 className="text-4xl text-[#f2e8d2]" style={{ fontFamily: "'Fraunces', serif" }}>Profile &amp; Preferences</h1>
      </Reveal>

      <Reveal delay={0.1} className="border border-[#2a2f24] rounded-2xl p-7 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#2a2f24] flex items-center justify-center"><UserCircle className="w-7 h-7 text-[#b98d4c]" /></div>
          <div>
            <p className="text-lg text-[#f2e8d2]" style={{ fontFamily: "'Fraunces', serif" }}>M. Faulkner</p>
            <p className="text-xs text-[#8c8677]">m.faulkner@university.edu</p>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.2} className="border border-[#2a2f24] rounded-2xl p-7">
        <h3 className="text-sm tracking-[0.15em] uppercase text-[#8c8677] mb-4 flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> Genre Preferences</h3>
        <div className="flex flex-wrap gap-2 mb-5">
          {genres.map((g) => (
            <span key={g} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-[#2a2f24] text-[#ded8c8]" style={{ animation: 'chipIn 0.35s cubic-bezier(.2,1.4,.4,1)' }}>
              {g}
              <button onClick={() => removeTag(g)} className="text-[#8c8677] hover:text-[#a85c3c]"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <form onSubmit={addTag} className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Add a genre or subject…" className="flex-1 bg-[#10140f] border border-[#2a2f24] focus:border-[#b98d4c] rounded-full px-4 py-2 text-sm placeholder-[#5f5b4f] focus:outline-none transition-colors" />
          <button type="submit" className="px-4 py-2 rounded-full border border-[#b98d4c] text-[#ddb87a] text-xs uppercase tracking-wider hover:bg-[#b98d4c] hover:text-[#10140f] transition-colors">Add</button>
        </form>
      </Reveal>
    </div>
  );
}

/* ---------------- APP ROOT ---------------- */
export default function BookRentalShowcase() {
  useLibraryFonts();
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState('student');
  const [page, setPage] = useState('browse');
  const [selectedBookId, setSelectedBookId] = useState(null);

  const openBook = useCallback((id) => { setSelectedBookId(id); setPage('details'); }, []);

  const handleSignIn = (r) => { setRole(r); setAuthed(true); setPage('browse'); };
  const handleSignOut = () => { setAuthed(false); setPage('browse'); };

  if (!authed) return <AuthPage onSignIn={handleSignIn} />;

  let content;
  switch (page) {
    case 'browse': content = <BrowsePage onOpenBook={openBook} />; break;
    case 'details': content = <BookDetailsPage bookId={selectedBookId} onBack={() => setPage('browse')} />; break;
    case 'recommendations': content = <RecommendationsPage onOpenBook={openBook} />; break;
    case 'myRentals': content = <MyRentalsPage />; break;
    case 'myListings': content = <MyListingsPage onAddBook={() => setPage('addBook')} />; break;
    case 'addBook': content = <AddEditBookPage onDone={() => setPage('myListings')} />; break;
    case 'admin': content = <AdminDashboard />; break;
    case 'profile': content = <ProfilePage />; break;
    default: content = <BrowsePage onOpenBook={openBook} />;
  }

  return (
    <>
      <style>{`
        @keyframes stampIn { 0% { opacity: 0; transform: rotate(-9deg) scale(2.4); } 60% { opacity: 1; } 100% { opacity: 1; transform: rotate(-9deg) scale(1); } }
        @keyframes chipIn { 0% { opacity: 0; transform: scale(0.6); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>
      <NavShell page={page} setPage={setPage} role={role} onSignOut={handleSignOut}>
        {content}
      </NavShell>
    </>
  );
}
