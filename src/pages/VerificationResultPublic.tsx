import VerificationResult from "@/components/VerificationResult";

export default function VerificationResultPublic() {
  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="w-full border-b border-border/40 bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/favicon.ico" alt="logo" className="h-6 w-6 rounded" />
            <span className="font-semibold tracking-tight">Verification Result</span>
          </div>
          <div>
            <a href="/verify-public" className="text-sm text-muted-foreground hover:text-foreground">Back to Verify</a>
          </div>
        </div>
      </header>
      <VerificationResult backPath="/verify-public" />
    </div>
  );
}


