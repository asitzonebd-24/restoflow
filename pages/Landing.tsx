import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Utensils, 
  ShieldCheck, 
  ArrowRight, 
  ChefHat, 
  ShoppingBag, 
  UserPlus, 
  LayoutDashboard, 
  Package, 
  Receipt, 
  PieChart, 
  Globe, 
  Zap, 
  Smartphone, 
  Clock,
  CheckCircle2,
  Menu,
  X,
  Languages,
  AlertCircle,
  TrendingUp,
  Users,
  Cloud,
  MessageCircle,
  Phone,
  Check,
  Play
} from 'lucide-react';
import { RegistrationModal } from '../src/components/RegistrationModal';
import { motion, AnimatePresence } from 'framer-motion';

export const Landing = () => {
  const { business } = useApp();
  const navigate = useNavigate();
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lang, setLang] = useState<'bn' | 'en'>('bn');

  const t = {
    bn: {
      brand: "RestoKeep",
      nav: {
        features: "ফিচার",
        pricing: "প্রাইসিং",
        contact: "যোগাযোগ",
        signIn: "Sign In",
        getStarted: "Get Started"
      },
      hero: {
        badge: "রেস্টুরেন্ট ম্যানেজমেন্টের আধুনিক সমাধান",
        headline: "আপনার রেস্টুরেন্ট পরিচালনা হোক এখন আরও সহজ ও স্মার্ট",
        subheadline: "অর্ডার ম্যানেজমেন্ট থেকে শুরু করে ইনভেন্টরি এবং হিসাব-নিকাশ—সবকিছুই এখন আপনার হাতের মুঠোয়। RestoKeep এর মাধ্যমে আপনার ব্যবসার গতি বাড়ান।",
        ctaFree: "Free Trial শুরু করুন",
        ctaDemo: "ডেমো দেখুন"
      },
      problem: {
        title: "রেস্টুরেন্ট পরিচালনায় কি এই সমস্যাগুলো ফেস করছেন?",
        items: [
          { icon: <AlertCircle className="text-[#f37021]" />, text: "অর্ডার নিতে ভুল হওয়া এবং কাস্টমার অসন্তুষ্টি" },
          { icon: <AlertCircle className="text-[#f37021]" />, text: "ইনভেন্টরি বা স্টক মেলাতে হিমশিম খাওয়া" },
          { icon: <AlertCircle className="text-[#f37021]" />, text: "ম্যানুয়াল হিসাব-নিকাশে ভুল এবং সময় অপচয়" }
        ]
      },
      solution: {
        title: "RestoKeep - আপনার রেস্টুরেন্টের অল-ইন-ওয়ান সমাধান",
        desc: "আমরা আপনার রেস্টুরেন্টের জটিল কাজগুলোকে সহজ করে তুলি, যাতে আপনি খাবারের গুণমান এবং কাস্টমার সার্ভিসে বেশি মনোযোগ দিতে পারেন।"
      },
      features: {
        title: "আমাদের শক্তিশালী ফিচারসমূহ",
        list: [
          { icon: <ShoppingBag />, title: "অর্ডার ম্যানেজমেন্ট", desc: "টেবিল, টেক-অ্যাওয়ে এবং অনলাইন অর্ডার ম্যানেজ করুন দ্রুত।" },
          { icon: <Package />, title: "ইনভেন্টরি ট্র্যাকিং", desc: "স্টক লেভেল এবং কাঁচামালের সঠিক হিসাব রাখুন।" },
          { icon: <PieChart />, title: "সেলস রিপোর্ট", desc: "প্রতিদিনের বিক্রি এবং লাভের বিস্তারিত রিপোর্ট দেখুন।" },
          { icon: <Users />, title: "স্টাফ রোল ম্যানেজমেন্ট", desc: "ওয়েটার, শেফ এবং ম্যানেজারদের জন্য আলাদা এক্সেস।" },
          { icon: <Utensils />, title: "মাল্টি-রেস্টুরেন্ট সাপোর্ট", desc: "একই ড্যাশবোর্ড থেকে একাধিক ব্রাঞ্চ পরিচালনা করুন।" },
          { icon: <Cloud />, title: "সিকিউর ক্লাউড ডাটা", desc: "আপনার সমস্ত তথ্য থাকবে ১০০% নিরাপদ ও ক্লাউডে সংরক্ষিত।" }
        ]
      },
      pricing: {
        title: "আপনার জন্য সেরা প্ল্যানটি বেছে নিন",
        badge: "৭ দিনের ফ্রি ট্রায়াল সুবিধা",
        plans: [
          { name: "Basic Plan", price: "৪৯৯", period: "/মাস", features: ["সিঙ্গেল ব্রাঞ্চ", "আনলিমিটেড অর্ডার", "বেসিক রিপোর্ট", "ইমেইল সাপোর্ট"] },
          { name: "Pro Plan", price: "৯৯৯", period: "/মাস", features: ["মাল্টি-ব্রাঞ্চ সাপোর্ট", "অ্যাডভান্সড ইনভেন্টরি", "বিস্তারিত রিপোর্ট", "২৪/৭ প্রায়োরিটি সাপোর্ট"], popular: true }
        ]
      },
      why: {
        title: "কেন RestoKeep বেছে নেবেন?",
        items: [
          { title: "সহজ ব্যবহার", desc: "যেকোনো স্মার্টফোন বা কম্পিউটার থেকে সহজেই ব্যবহারযোগ্য।" },
          { title: "বাংলাদেশ উপযোগী", desc: "আমাদের দেশের রেস্টুরেন্ট ব্যবসার ধরন অনুযায়ী তৈরি।" },
          { title: "দ্রুত সাপোর্ট", desc: "যেকোনো সমস্যায় আমাদের টিম সবসময় আপনার পাশে আছে।" },
          { title: "সাশ্রয়ী মূল্য", desc: "অল্প খরচে প্রিমিয়াম সব ফিচার ব্যবহারের সুযোগ।" }
        ]
      },
      cta: {
        title: "আজই আপনার রেস্টুরেন্টকে ডিজিটাল করুন",
        desc: "RestoKeep এর সাথে আপনার ব্যবসার নতুন যাত্রা শুরু হোক এখনই।",
        btnStart: "আজই শুরু করুন",
        btnTrial: "ফ্রি ট্রায়াল নিন"
      },
      contact: {
        title: "আমাদের সাথে যোগাযোগ করুন",
        name: "আপনার নাম",
        phone: "মোবাইল নম্বর",
        message: "আপনার বার্তা",
        send: "বার্তা পাঠান",
        whatsapp: "WhatsApp এ কথা বলুন",
        messenger: "Messenger এ নক দিন"
      }
    },
    en: {
      brand: "RestoKeep",
      nav: {
        features: "Features",
        pricing: "Pricing",
        contact: "Contact",
        signIn: "Sign In",
        getStarted: "Get Started"
      },
      hero: {
        badge: "Modern Solution for Restaurant Management",
        headline: "Manage Your Restaurant Smarter and Easier",
        subheadline: "From order management to inventory and accounting—everything is now at your fingertips. Boost your business with RestoKeep.",
        ctaFree: "Start Free Trial",
        ctaDemo: "Watch Demo"
      },
      problem: {
        title: "Facing These Problems in Your Restaurant?",
        items: [
          { icon: <AlertCircle className="text-[#f37021]" />, text: "Order mistakes and customer dissatisfaction" },
          { icon: <AlertCircle className="text-[#f37021]" />, text: "Struggling with inventory and stock mismatch" },
          { icon: <AlertCircle className="text-[#f37021]" />, text: "Errors and time waste in manual accounting" }
        ]
      },
      solution: {
        title: "RestoKeep - Your All-in-One Restaurant Solution",
        desc: "We simplify your complex restaurant tasks so you can focus more on food quality and customer service."
      },
      features: {
        title: "Our Powerful Features",
        list: [
          { icon: <ShoppingBag />, title: "Order Management", desc: "Manage table, takeaway, and online orders quickly." },
          { icon: <Package />, title: "Inventory Tracking", desc: "Keep track of stock levels and raw materials accurately." },
          { icon: <PieChart />, title: "Sales Reports", desc: "View detailed reports of daily sales and profits." },
          { icon: <Users />, title: "Staff Role Management", desc: "Separate access for waiters, chefs, and managers." },
          { icon: <Utensils />, title: "Multi-restaurant Support", desc: "Manage multiple branches from a single dashboard." },
          { icon: <Cloud />, title: "Secure Cloud Data", desc: "Your data is 100% safe and stored in the cloud." }
        ]
      },
      pricing: {
        title: "Choose the Best Plan for You",
        badge: "7 Days Free Trial Available",
        plans: [
          { name: "Basic Plan", price: "499", period: "/mo", features: ["Single Branch", "Unlimited Orders", "Basic Reports", "Email Support"] },
          { name: "Pro Plan", price: "999", period: "/mo", features: ["Multi-branch Support", "Advanced Inventory", "Detailed Reports", "24/7 Priority Support"], popular: true }
        ]
      },
      why: {
        title: "Why Choose RestoKeep?",
        items: [
          { title: "Easy to Use", desc: "Easily usable from any smartphone or computer." },
          { title: "Made for Bangladesh", desc: "Built according to the restaurant business style of our country." },
          { title: "Fast Support", desc: "Our team is always by your side for any issues." },
          { title: "Affordable Price", premium: "Premium features at a low cost." }
        ]
      },
      cta: {
        title: "Digitalize Your Restaurant Today",
        desc: "Start your business's new journey with RestoKeep now.",
        btnStart: "Start Today",
        btnTrial: "Get Free Trial"
      },
      contact: {
        title: "Contact Us",
        name: "Your Name",
        phone: "Mobile Number",
        message: "Your Message",
        send: "Send Message",
        whatsapp: "Chat on WhatsApp",
        messenger: "Message on Messenger"
      }
    }
  };

  const cur = t[lang];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#cce0ff] overflow-x-hidden scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src="/logo.png" alt="RestoKeep Logo" className="w-full h-full object-contain" onError={(e) => {
                e.currentTarget.src = 'https://picsum.photos/seed/restaurant/200/200';
              }} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">{cur.brand}</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-slate-600 hover:text-[#0056b3] transition-colors">{cur.nav.features}</a>
            <a href="#pricing" className="text-sm font-bold text-slate-600 hover:text-[#0056b3] transition-colors">{cur.nav.pricing}</a>
            <a href="#contact" className="text-sm font-bold text-slate-600 hover:text-[#0056b3] transition-colors">{cur.nav.contact}</a>
            
            <button 
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold transition-all border border-slate-200"
            >
              <Languages size={14} className="text-[#0056b3]" />
              {lang === 'en' ? 'বাংলা' : 'English'}
            </button>

            <button 
              onClick={() => navigate('/login')}
              className="text-sm font-bold text-slate-900 hover:text-[#0056b3] transition-colors"
            >
              {cur.nav.signIn}
            </button>
            <button 
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-6 py-2.5 bg-[#0056b3] text-white rounded-xl text-sm font-bold hover:bg-[#004494] transition-all shadow-lg shadow-[#0056b3]/20 active:scale-95"
            >
              {cur.nav.getStarted}
            </button>
          </div>

          <div className="flex items-center gap-4 md:hidden">
            <button 
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-bold border border-slate-200"
            >
              <Languages size={14} className="text-[#0056b3]" />
              {lang === 'en' ? 'বাংলা' : 'English'}
            </button>
            <button 
              className="p-2 text-slate-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-6">
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold">{cur.nav.features}</a>
              <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold">{cur.nav.pricing}</a>
              <a href="#contact" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold">{cur.nav.contact}</a>
              <button onClick={() => { setIsMenuOpen(false); navigate('/login'); }} className="text-2xl font-bold text-left">{cur.nav.signIn}</button>
              <button 
                onClick={() => { setIsMenuOpen(false); setIsRegisterModalOpen(true); }}
                className="w-full py-4 bg-[#0056b3] text-white rounded-2xl text-lg font-bold"
              >
                {cur.nav.getStarted}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-gradient-to-b from-[#e6f0ff]/50 to-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#e6f0ff] text-[#0056b3] rounded-full text-[10px] font-bold uppercase tracking-widest mb-8">
              <Zap size={14} fill="currentColor" /> {cur.hero.badge}
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-8 max-w-4xl mx-auto">
              {cur.hero.headline}
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 font-medium leading-relaxed mb-12">
              {cur.hero.subheadline}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => setIsRegisterModalOpen(true)}
                className="w-full sm:w-auto px-10 py-5 bg-[#0056b3] text-white rounded-2xl font-bold text-lg hover:bg-[#004494] transition-all shadow-2xl shadow-[#0056b3]/20 flex items-center justify-center gap-3 group active:scale-95"
              >
                {cur.hero.ctaFree} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <Play size={20} fill="currentColor" className="text-[#f37021]" /> {cur.hero.ctaDemo}
              </button>
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 relative max-w-5xl mx-auto"
          >
            <div className="aspect-[16/10] bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border-8 border-white relative group">
              <img 
                src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=2070&auto=format&fit=crop" 
                alt="Dashboard Preview" 
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
              <div className="absolute bottom-10 left-10 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#0056b3] rounded-xl flex items-center justify-center text-white">
                    <LayoutDashboard size={24} />
                  </div>
                  <h4 className="text-white text-xl font-bold">{cur.dashboardPreview}</h4>
                </div>
                <div className="flex gap-4">
                  <div className="h-2 w-32 bg-white/20 rounded-full" />
                  <div className="h-2 w-20 bg-white/10 rounded-full" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">{cur.problem.title}</h2>
            <div className="w-20 h-1.5 bg-[#f37021] mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {cur.problem.items.map((item, i) => (
              <div key={i} className="p-8 rounded-3xl bg-[#fff1e6]/50 border border-[#ffe3cc] flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                  {item.icon}
                </div>
                <p className="text-lg font-bold text-slate-800 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 bg-[#0056b3] text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-8">{cur.solution.title}</h2>
          <p className="text-xl md:text-2xl text-[#e6f0ff] max-w-3xl mx-auto font-medium leading-relaxed">
            {cur.solution.desc}
          </p>
        </div>
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -ml-48 -mb-48" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 md:py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <p className="text-[#0056b3] font-bold uppercase tracking-[0.3em] text-[10px] mb-4">Features</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">{cur.features.title}</h2>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {cur.features.list.map((feature, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className="p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
              >
                <div className="w-16 h-16 bg-[#e6f0ff] text-[#0056b3] rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-[#0056b3] group-hover:text-white transition-all duration-500">
                  {React.cloneElement(feature.icon as React.ReactElement, { size: 28 })}
                </div>
                <h3 className="text-2xl font-bold mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#fff1e6] text-[#f37021] rounded-full text-[10px] font-bold uppercase tracking-widest mb-6">
              <CheckCircle2 size={14} /> {cur.pricing.badge}
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">{cur.pricing.title}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {cur.pricing.plans.map((plan, i) => (
              <div key={i} className={`p-10 rounded-[3rem] border-2 transition-all relative ${plan.popular ? 'border-[#0056b3] bg-white shadow-2xl shadow-[#0056b3]/10 scale-105 z-10' : 'border-slate-100 bg-slate-50'}`}>
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-[#f37021] text-white text-xs font-black uppercase tracking-widest rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-black mb-6">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-5xl font-black tracking-tighter">৳{plan.price}</span>
                  <span className="text-slate-400 font-bold">{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-10">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-slate-600 font-medium">
                      <div className="w-5 h-5 bg-[#fff1e6] text-[#f37021] rounded-full flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={4} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => setIsRegisterModalOpen(true)}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 ${plan.popular ? 'bg-[#0056b3] text-white shadow-xl shadow-[#0056b3]/20 hover:bg-[#004494]' : 'bg-slate-900 text-white hover:bg-black'}`}
                >
                  {cur.nav.getStarted}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">{cur.why.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {cur.why.items.map((item, i) => (
              <div key={i} className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-[#e6f0ff] text-[#0056b3] rounded-2xl flex items-center justify-center mb-6">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="text-xl font-bold mb-3">{item.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-40 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#0056b3,transparent)] opacity-20" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-8">
                {cur.cta.title}
              </h2>
              <p className="text-slate-400 text-lg md:text-xl font-medium mb-12 max-w-2xl mx-auto">
                {cur.cta.desc}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="w-full sm:w-auto px-10 py-5 bg-[#0056b3] text-white rounded-2xl font-bold text-lg hover:bg-[#004494] transition-all active:scale-95 shadow-xl shadow-[#0056b3]/20"
                >
                  {cur.cta.btnStart}
                </button>
                <button 
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="w-full sm:w-auto px-10 py-5 bg-white/10 text-white border border-white/20 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all active:scale-95"
                >
                  {cur.cta.btnTrial}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 md:py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8">{cur.contact.title}</h2>
              <p className="text-slate-500 text-lg font-medium mb-12 leading-relaxed">
                আপনার যেকোনো প্রশ্ন বা ডেমোর জন্য আমাদের সাথে যোগাযোগ করুন। আমাদের টিম আপনাকে সাহায্য করতে প্রস্তুত।
              </p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => window.open('https://wa.me/8801303565316', '_blank')}
                  className="w-full sm:w-auto flex items-center gap-4 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                >
                  <Phone size={20} fill="currentColor" /> {cur.contact.whatsapp}
                </button>
                <button 
                  onClick={() => window.open('https://fb.com/restokeep', '_blank')}
                  className="w-full sm:w-auto flex items-center gap-4 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
                >
                  <MessageCircle size={20} fill="currentColor" /> {cur.contact.messenger}
                </button>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
              <form className="space-y-6" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name');
                const phone = formData.get('phone');
                const message = formData.get('message');
                const whatsappNumber = "8801303565316";
                const text = `*New Inquiry from RestoKeep Landing Page*%0A%0A*Name:* ${name}%0A*Phone:* ${phone}%0A*Message:* ${message}`;
                window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
              }}>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{cur.contact.name}</label>
                  <input name="name" type="text" required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-[#0056b3] outline-none transition-all font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{cur.contact.phone}</label>
                  <input name="phone" type="tel" required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-[#0056b3] outline-none transition-all font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{cur.contact.message}</label>
                  <textarea name="message" required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-[#0056b3] outline-none transition-all font-medium h-32 resize-none" />
                </div>
                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all active:scale-95">
                  {cur.contact.send}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-20">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 flex items-center justify-center">
                <img src="/logo.png" alt="RestoKeep Logo" className="w-full h-full object-contain" onError={(e) => {
                  e.currentTarget.src = 'https://picsum.photos/seed/restaurant/200/200';
                }} />
              </div>
              <span className="text-2xl font-black tracking-tighter text-slate-900">{cur.brand}</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-sm font-bold text-slate-600">
              <a href="#" className="hover:text-[#0056b3] transition-colors">About</a>
              <a href="#" className="hover:text-[#0056b3] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#0056b3] transition-colors">Terms</a>
              <a href="#" className="hover:text-[#0056b3] transition-colors">Support</a>
            </div>
          </div>

          <div className="text-center pt-10 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              © 2026 {cur.brand} Professional OS. {cur.rights}
            </p>
          </div>
        </div>
      </footer>

      <RegistrationModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
      />
    </div>
  );
};
