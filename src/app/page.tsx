import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 lg:py-24">
          {/* Background decorative orbs */}
          <div className="absolute top-20 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-orb-1 pointer-events-none"></div>
          <div className="absolute bottom-10 -right-32 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-orb-2 pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl animate-glow-pulse pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col gap-8 max-w-2xl">
                <h1 className="animate-hero-fade-up animate-hero-delay-2 text-5xl lg:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight">
                  Scale Your Hiring with <span className="text-primary bg-clip-text">AI-Powered</span> Intelligence
                </h1>
                <p className="animate-hero-fade-up animate-hero-delay-3 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  Automate screening and assessments with our advanced AI platform to find the best talent faster. Reduce time-to-hire by 70% while improving candidate quality.
                </p>
                <div className="animate-hero-fade-up animate-hero-delay-4 flex flex-col sm:flex-row gap-4">
                  <Link href="/signup" className="bg-primary text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 shadow-xl shadow-primary/25 flex items-center justify-center gap-2">
                    Get Started for Free <span className="material-symbols-outlined">arrow_forward</span>
                  </Link>
                  <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">play_circle</span> View Demo
                  </button>
                </div>
              </div>
              <div className="relative animate-hero-scale-in">
                <div className="animate-hero-float aspect-square rounded-3xl bg-gradient-to-tr from-primary/20 to-blue-400/10 flex items-center justify-center p-8 overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div className="w-full h-full bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,#135bec_1px,transparent_1px)] [background-size:20px_20px]"></div>
                    <div className="absolute inset-0 animate-shimmer"></div>
                    <div className="p-6 h-full flex flex-col relative z-10">
                      <div className="flex gap-2 mb-6">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="space-y-4">
                        <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="h-24 bg-primary/5 rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors duration-300"></div>
                          <div className="h-24 bg-primary/5 rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors duration-300"></div>
                          <div className="h-24 bg-primary/5 rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors duration-300"></div>
                        </div>
                        <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-md"></div>
                        <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded-md"></div>
                        <div className="h-40 w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-primary/40">smart_toy</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 animate-hero-slide-left">
                  <div className="size-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <span className="material-symbols-outlined">check_circle</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Candidate Score</p>
                    <p className="text-sm font-bold">98/100 - Strong Fit</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-24 bg-white dark:bg-background-dark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-primary font-bold text-sm tracking-widest uppercase mb-3">Platform Features</h2>
              <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-6">Powerful Features for Modern Hiring</h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">Everything you need to find, assess, and hire top talent in a fraction of the time.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: "search", title: "Screening", desc: "Automated resume parsing and filtering. AI ranks candidates based on skill match and experience." },
                { icon: "assignment", title: "Assessments", desc: "Custom technical and behavioral tests. Industry-standard coding environments and skill checks." },
                { icon: "videocam", title: "AI Interviews", desc: "Interactive AI-led candidate screenings. Real-time sentiment analysis and behavioral insights." },
                { icon: "bar_chart", title: "Analytics", desc: "Deep data insights into your hiring funnel. Diversity tracking and conversion optimization." },
              ].map((feature) => (
                <div key={feature.title} className="p-8 rounded-2xl bg-background-light dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary transition-all group">
                  <div className="size-14 rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                    <span className="material-symbols-outlined text-3xl">{feature.icon}</span>
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="py-24 bg-background-light dark:bg-background-dark/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-6">How it Works</h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg">Three simple steps to build your dream team with confidence.</p>
            </div>
            <div className="relative">
              <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 z-0"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
                {[
                  { step: 1, title: "Create Job", desc: "Upload your JD and set your target skills. AI generates tailored assessments instantly." },
                  { step: 2, title: "AI Screens Candidates", desc: "Our AI analyzes resumes and conducts initial screenings, filtering out unqualified applicants." },
                  { step: 3, title: "Hire the Best", desc: "Review deep insights on top performers and make data-driven offers with confidence." },
                ].map((item) => (
                  <div key={item.step} className="flex flex-col items-center text-center">
                    <div className="size-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-black mb-8 border-8 border-background-light dark:border-background-dark shadow-xl">{item.step}</div>
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{item.title}</h4>
                    <p className="text-slate-600 dark:text-slate-400 max-w-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-primary rounded-[2rem] p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/30">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_20%,#ffffff_1px,transparent_1px)] [background-size:40px_40px]"></div>
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to transform your hiring?</h2>
                <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">Join thousands of companies using HIREWISE to find their next superstar employees. No credit card required.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/signup" className="bg-white text-primary px-10 py-4 rounded-xl font-bold text-lg hover:bg-slate-100 transition-all">Get Started for Free</Link>
                  <button className="bg-blue-600 text-white border border-white/20 px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all">Schedule a Demo</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
