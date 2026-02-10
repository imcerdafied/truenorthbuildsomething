import { Target, TrendingUp, MessageCircle, GitBranch } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 space-y-16">
      {/* Hero */}
      <section className="space-y-4">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <Target className="w-5 h-5 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-semibold">TrueNorthOS</h1>
        <p className="text-lg text-muted-foreground">
          Outcome-driven planning for teams that value clarity, confidence, and alignment.
        </p>
        <p className="text-base text-muted-foreground">
          TrueNorthOS helps teams define what matters, track real progress, and surface risk early — without turning work into bureaucracy.
        </p>
      </section>

      {/* What TrueNorthOS does */}
      <section>
        <h2 className="text-xl font-semibold mb-6">What TrueNorthOS does</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-6">
            <Target className="w-5 h-5 text-muted-foreground mb-3" />
            <h3 className="font-medium mb-2">Define Outcomes</h3>
            <p className="text-sm text-muted-foreground">
              Create clear, human-authored outcomes that focus teams on impact rather than activity.
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <TrendingUp className="w-5 h-5 text-muted-foreground mb-3" />
            <h3 className="font-medium mb-2">Track Progress</h3>
            <p className="text-sm text-muted-foreground">
              Measure progress against meaningful signals, not proxy metrics or task completion.
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <MessageCircle className="w-5 h-5 text-muted-foreground mb-3" />
            <h3 className="font-medium mb-2">Confidence Check-ins</h3>
            <p className="text-sm text-muted-foreground">
              Capture human judgment alongside progress to identify risk, uncertainty, and momentum early.
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <GitBranch className="w-5 h-5 text-muted-foreground mb-3" />
            <h3 className="font-medium mb-2">Alignment</h3>
            <p className="text-sm text-muted-foreground">
              Understand how team outcomes support broader organizational goals when alignment becomes critical.
            </p>
          </div>
        </div>
      </section>

      {/* How TrueNorthOS is different */}
      <section>
        <h2 className="text-xl font-semibold mb-6">How TrueNorthOS is different</h2>
        <p className="text-muted-foreground mb-4">
          TrueNorthOS is intentionally designed around how organizations actually work.
        </p>
        <ul className="space-y-0">
          <li className="border-l-2 border-muted pl-4 py-2 text-sm text-muted-foreground">
            Human-first by design — outcomes are authored, owned, and assessed by people
          </li>
          <li className="border-l-2 border-muted pl-4 py-2 text-sm text-muted-foreground">
            Separates confidence from progress to avoid false certainty
          </li>
          <li className="border-l-2 border-muted pl-4 py-2 text-sm text-muted-foreground">
            Works before perfect data exists
          </li>
          <li className="border-l-2 border-muted pl-4 py-2 text-sm text-muted-foreground">
            Avoids premature automation and compliance overhead
          </li>
          <li className="border-l-2 border-muted pl-4 py-2 text-sm text-muted-foreground">
            Scales from a single team to enterprise environments without re-platforming
          </li>
        </ul>
      </section>

      {/* Who it's for */}
      <section>
        <h2 className="text-xl font-semibold mb-6">Who it&apos;s for</h2>
        <p className="text-muted-foreground mb-4">
          Built for teams and leaders responsible for outcomes, not just execution.
        </p>
        <ul className="space-y-0">
          <li className="border-l-2 border-muted pl-4 py-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Product and engineering leaders</span> — who need visibility into progress and risk without micromanaging
          </li>
          <li className="border-l-2 border-muted pl-4 py-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">PMs and outcome owners</span> — who want to track what matters and communicate confidence clearly
          </li>
          <li className="border-l-2 border-muted pl-4 py-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Leadership and ops</span> — who care about alignment and roll-up without losing the human story
          </li>
        </ul>
      </section>
    </div>
  );
}
