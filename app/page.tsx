import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-red-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/3 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-8">
        {/* App Icon — clickable link to dashboard */}
        <Link
          href="/dashboard"
          className="group transition-transform duration-500 hover:scale-105 active:scale-95"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-accent/20 rounded-full blur-[40px] group-hover:blur-[60px] group-hover:bg-accent/30 transition-all duration-500" />
            <Image
              src="/icon-512.png"
              alt="Syncro-Link YouTube Auto-Poster"
              width={280}
              height={280}
              priority
              className="relative rounded-2xl shadow-2xl shadow-black/50"
            />
          </div>
        </Link>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-accent">Syncro-Link</span>
          </h1>
          <p className="text-foreground/40 text-lg">YouTube Auto-Poster</p>
        </div>

        {/* Enter button */}
        <Link
          href="/dashboard"
          className="bg-accent/10 border border-accent/30 text-accent px-8 py-3 rounded-full text-sm font-medium hover:bg-accent/20 hover:border-accent/50 transition-all duration-300"
        >
          Enter Dashboard
        </Link>

        {/* Subtle tagline */}
        <p className="text-foreground/20 text-xs max-w-sm">
          Upload, schedule, and manage your YouTube content from one place.
        </p>
      </div>
    </main>
  );
}
