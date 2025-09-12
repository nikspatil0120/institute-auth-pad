import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-background text-foreground">
      {/* Top bar with right-aligned quick links */}
      <header className="w-full border-b border-border/40 bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.ico" alt="logo" className="h-6 w-6 rounded" />
            <span className="font-semibold tracking-tight">Institute Auth</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hover:bg-primary/10">
              <Link to="/login">Institute Portal</Link>
            </Button>
            <Button asChild variant="ghost" className="hover:bg-primary/10">
              <Link to="/student-login">Student Login</Link>
            </Button>
            <Button asChild variant="ghost" className="hover:bg-primary/10">
              <Link to="/admin/login">Admin Login</Link>
            </Button>
            <Button asChild variant="ghost" className="hover:bg-primary/10">
              <Link to="/legacy-request">Legacy Documents</Link>
            </Button>
            <Button asChild className="bg-gradient-primary hover:shadow-glow">
              <Link to="/verify-public">Verify Document</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero section (revamped, image-less, ultra-polished) */}
      <section className="relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute -top-28 -left-32 h-80 w-80 rounded-full bg-primary/20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-28 -right-32 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl animate-pulse" />
          <div className="absolute inset-0 bg-[radial-gradient(transparent,transparent,rgba(255,255,255,0.02))]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-24">
          <div className="mx-auto max-w-4xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/70 px-3 py-1 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Live blockchain verification
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-green-400">
                Authenticate Academic Documents
              </span>
              <br />
              with Unmatched Trust
            </h1>
            <p className="mx-auto max-w-3xl text-muted-foreground text-lg">
              Issue tamper-evident PDFs with embedded QR and cryptographic hashes. Verify instantly via Certificate ID, UIN, or secure PDF upload.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button asChild size="lg" variant="outline" className="border-border/60">
                <Link to="/verify-public">Verify a Document</Link>
              </Button>
            </div>
            {/* Quick capability chips */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
              <div>
                <span className="block text-foreground font-semibold">PDF Watermark + QR</span>
                Embedded metadata for instant checks
              </div>
              <div>
                <span className="block text-foreground font-semibold">JSON Ledger</span>
                Append-only audit trail
              </div>
              <div>
                <span className="block text-foreground font-semibold">Deterministic IDs</span>
                Certificate ID & UIN support
              </div>
              <div>
                <span className="block text-foreground font-semibold">JWT Security</span>
                Safe institute access
              </div>
            </div>
          </div>

          {/* Fancy stats bar */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border/50 bg-card/70 p-6 text-center shadow-card">
              <div className="text-3xl font-extrabold">3</div>
              <div className="text-sm text-muted-foreground">Types Supported</div>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/70 p-6 text-center shadow-card">
              <div className="text-3xl font-extrabold">QR</div>
              <div className="text-sm text-muted-foreground">Embedded Metadata</div>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/70 p-6 text-center shadow-card">
              <div className="text-3xl font-extrabold">256</div>
              <div className="text-sm text-muted-foreground">Bit Hashing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Info sections */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        {/* Value props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-border/50 bg-card/70 p-6 shadow-card">
            <h3 className="text-xl font-semibold mb-2">Purpose</h3>
            <p className="text-muted-foreground">
              Prevent document fraud and streamline issuance with a verifiable trail. Institutes issue PDFs that include watermarks, QR codes, and cryptographic hashes.
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/70 p-6 shadow-card">
            <h3 className="text-xl font-semibold mb-2">How It Works</h3>
            <p className="text-muted-foreground">
              Each document is processed, hashed (SHA-256), and recorded in a ledger. Verifiers can scan the QR or upload the PDF to confirm authenticity.
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/70 p-6 shadow-card">
            <h3 className="text-xl font-semibold mb-2">Who It’s For</h3>
            <p className="text-muted-foreground">
              Educational institutes, employers, and students who need trustworthy academic records and instant verification.
            </p>
          </div>
        </div>

        {/* Features grid */}
        <div className="mt-8 rounded-xl border border-border/50 bg-card/70 p-6 shadow-card">
          <h3 className="text-xl font-semibold mb-3">Features</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-muted-foreground list-disc pl-5">
            <li>Institute portal for issuing and managing documents</li>
            <li>Deterministic Certificate IDs and UIN enforcement</li>
            <li>Watermarks, headers, and embedded QR metadata</li>
            <li>Public verification via ID, UIN, or PDF upload</li>
            <li>Append-only JSON ledger for auditability</li>
            <li>Role-based access with JWT security</li>
          </ul>
        </div>

        {/* Simple timeline */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-xl border border-border/50 bg-card/70 p-6 shadow-card">
            <h4 className="font-semibold mb-1">1. Upload</h4>
            <p className="text-muted-foreground">Securely upload your PDF. We validate and prepare it for issuance.</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/70 p-6 shadow-card">
            <h4 className="font-semibold mb-1">2. Issue</h4>
            <p className="text-muted-foreground">We watermark, embed QR, compute hash, and record an immutable ledger entry.</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/70 p-6 shadow-card">
            <h4 className="font-semibold mb-1">3. Verify</h4>
            <p className="text-muted-foreground">Verify via Certificate ID, UIN, or by uploading the PDF—instantly.</p>
          </div>
        </div>

        {/* Legacy Documents Section */}
        <div className="mt-12 rounded-xl border border-border/50 bg-card/70 p-8 shadow-card">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-semibold mb-2">Legacy Document Digitization</h3>
            <p className="text-muted-foreground">
              Digitize and verify your old academic documents with our legacy document system
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Submit Legacy Document</h4>
              <p className="text-muted-foreground">
                Upload your old certificates, marksheets, or documents for digital verification. 
                Include student details, UIN, and issuing institute information.
              </p>
              <Button asChild className="bg-gradient-primary hover:shadow-glow">
                <Link to="/legacy-request">Submit Document</Link>
              </Button>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Search Legacy Document</h4>
              <p className="text-muted-foreground">
                Search for verified legacy documents using UIN. View and download 
                your digitized documents once they're verified by the institute.
              </p>
              <Button asChild variant="outline" className="border-border/50">
                <Link to="/legacy-search">Search Document</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Institute Auth. All rights reserved.
      </footer>
    </div>
  );
};

export default Index;
