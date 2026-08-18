/**
 * One architecture diagram per project.
 *
 * Drawn rather than screenshotted, for two reasons. The production systems
 * belong to the companies that run them, so their interfaces are not mine to
 * publish. And a screenshot of a form tells a reader almost nothing about where
 * the agent sits or what stops it — which is the only thing worth showing.
 *
 * Every diagram uses the same grammar so they can be read in sequence:
 *
 *   solid box        a system or a service
 *   dashed box       a store
 *   filled accent    where the agent acts
 *   dashed rule      a boundary nothing crosses without passing a check
 *
 * They use theme tokens, so they invert with the page rather than being two
 * exported images that drift apart.
 */

type DiagramProps = { className?: string };

const RULE = "var(--color-rule-strong)";
const INK = "var(--color-ink)";
const DIM = "var(--color-dim)";
const FAINT = "var(--color-faint)";
const COLD = "var(--color-cold)";
const WARM = "var(--color-warm)";

const mono = {
  fontFamily: "var(--font-mono)",
  fontSize: 9,
  letterSpacing: "0.08em",
};

const label = { fontFamily: "var(--font-display)", fontSize: 11 };

function Box({
  x,
  y,
  w,
  h,
  title,
  sub,
  accent = false,
  dashed = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
  accent?: boolean;
  dashed?: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={3}
        fill={accent ? "color-mix(in srgb, var(--color-cold) 12%, transparent)" : "var(--color-panel)"}
        stroke={accent ? COLD : RULE}
        strokeDasharray={dashed ? "3 3" : undefined}
      />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 3 : h / 2 + 4)} textAnchor="middle" fill={accent ? COLD : INK} style={label}>
        {title}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 11} textAnchor="middle" fill={FAINT} style={mono}>
          {sub}
        </text>
      )}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={RULE} strokeWidth={1} markerEnd="url(#tip)" />;
}

function Defs() {
  return (
    <defs>
      <marker id="tip" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M0 1 L7 4 L0 7 z" fill={RULE} />
      </marker>
    </defs>
  );
}

function Frame({ children, viewBox, className }: { children: React.ReactNode; viewBox: string; className?: string }) {
  return (
    <div className={`border-rule bg-inset overflow-x-auto rounded-xl border p-4 ${className ?? ""}`}>
      <svg viewBox={viewBox} className="h-auto w-full min-w-[520px]" role="img">
        <Defs />
        {children}
      </svg>
    </div>
  );
}

/** Eleven domains readable, nothing writable without a named approval. */
function PdmDiagram({ className }: DiagramProps) {
  return (
    <Frame viewBox="0 0 600 272" className={className}>
      <text x={0} y={10} fill={FAINT} style={mono}>
        ELEVEN RECORD DOMAINS
      </text>
      <Box x={0} y={18} w={104} h={34} title="PDM" dashed />
      <Box x={0} y={58} w={104} h={34} title="ECM" dashed />
      <Box x={0} y={98} w={104} h={34} title="QMS" dashed />
      <Box x={0} y={138} w={104} h={34} title="Procurement" dashed />
      <text x={52} y={176} textAnchor="middle" fill={FAINT} style={mono}>
        + 7 more
      </text>

      <Arrow x1={106} y1={35} x2={158} y2={86} />
      <Arrow x1={106} y1={75} x2={158} y2={94} />
      <Arrow x1={106} y1={115} x2={158} y2={102} />
      <Arrow x1={106} y1={155} x2={158} y2={110} />

      <Box x={160} y={72} w={112} h={56} title="Retrieval" sub="pgvector" />
      <Arrow x1={274} y1={100} x2={316} y2={100} />
      <Box x={318} y={72} w={112} h={56} title="Agent" sub="29 scoped tools" accent />
      <text x={374} y={144} textAnchor="middle" fill={COLD} style={mono}>
        reads everything
      </text>

      {/* The write path is the whole argument, so it gets the boundary. */}
      <line x1={0} y1={196} x2={600} y2={196} stroke={WARM} strokeWidth={1} strokeDasharray="4 4" />
      <text x={0} y={190} fill={WARM} style={mono}>
        NO TOOL WRITES BELOW THIS LINE WITHOUT A NAME ON IT
      </text>

      <Arrow x1={374} y1={152} x2={374} y2={204} />
      <rect x={160} y={206} width={150} height={58} rx={3} fill="color-mix(in srgb, var(--color-warm) 12%, transparent)" stroke={WARM} />
      <text x={235} y={224} textAnchor="middle" fill={WARM} style={label}>
        Approval inbox
      </text>
      <text x={235} y={240} textAnchor="middle" fill={FAINT} style={mono}>
        dry-run field diff
      </text>
      <text x={235} y={256} textAnchor="middle" fill={FAINT} style={mono}>
        role-gated
      </text>

      <Arrow x1={318} y1={100} x2={318} y2={100} />
      <Arrow x1={158} y1={235} x2={120} y2={235} />
      <Box x={0} y={210} w={118} h={50} title="Applied" sub="one transaction" />

      <Arrow x1={312} y1={235} x2={348} y2={235} />
      <Box x={350} y={210} w={128} h={50} title="Rejected" sub="note required" />
      <text x={496} y={232} fill={DIM} style={mono}>
        proposes
      </text>
      <text x={496} y={244} fill={DIM} style={mono}>
        never applies
      </text>
    </Frame>
  );
}

/** Router, two agents, three guardrail positions. */
function AgentDiagram({ className }: DiagramProps) {
  return (
    <Frame viewBox="0 0 600 250" className={className}>
      <Box x={0} y={90} w={92} h={44} title="Question" />
      <Arrow x1={94} y1={112} x2={132} y2={112} />

      <rect x={134} y={78} width={78} height={68} rx={3} fill="color-mix(in srgb, var(--color-warm) 12%, transparent)" stroke={WARM} />
      <text x={173} y={104} textAnchor="middle" fill={WARM} style={label}>
        Input
      </text>
      <text x={173} y={118} textAnchor="middle" fill={WARM} style={mono}>
        guardrail
      </text>
      <text x={173} y={132} textAnchor="middle" fill={FAINT} style={mono}>
        no model call
      </text>

      <Arrow x1={214} y1={112} x2={252} y2={112} />
      <Box x={254} y={90} w={80} h={44} title="Router" />

      <Arrow x1={336} y1={104} x2={374} y2={62} />
      <Arrow x1={336} y1={120} x2={374} y2={162} />
      <Box x={376} y={38} w={112} h={44} title="Knowledge" sub="documents" accent />
      <Box x={376} y={140} w={112} h={44} title="Telemetry" sub="time series" accent />

      <rect x={376} y={92} width={112} height={38} rx={3} fill="color-mix(in srgb, var(--color-warm) 12%, transparent)" stroke={WARM} />
      <text x={432} y={107} textAnchor="middle" fill={WARM} style={label}>
        Arguments
      </text>
      <text x={432} y={121} textAnchor="middle" fill={FAINT} style={mono}>
        ajv + bounds
      </text>

      <Arrow x1={490} y1={60} x2={528} y2={95} />
      <Arrow x1={490} y1={162} x2={528} y2={129} />
      <rect x={506} y={90} width={94} height={44} rx={3} fill="color-mix(in srgb, var(--color-warm) 12%, transparent)" stroke={WARM} />
      <text x={553} y={108} textAnchor="middle" fill={WARM} style={label}>
        Grounding
      </text>
      <text x={553} y={122} textAnchor="middle" fill={FAINT} style={mono}>
        floor 0.35
      </text>

      <text x={0} y={228} fill={FAINT} style={mono}>
        THREE CHECKS, IN THE THREE PLACES A DIFFERENT THING CAN GO WRONG
      </text>
    </Frame>
  );
}

/** Read once, watch continuously, chase automatically. */
function ComplianceDiagram({ className }: DiagramProps) {
  return (
    <Frame viewBox="0 0 600 230" className={className}>
      <text x={0} y={10} fill={FAINT} style={mono}>
        EXPENSIVE, ONCE
      </text>
      <Box x={0} y={20} w={104} h={48} title="Scan" sub="photo of paper" dashed />
      <Arrow x1={106} y1={44} x2={144} y2={44} />
      <Box x={146} y={20} w={110} h={48} title="Vision read" sub="extract fields" accent />

      <Arrow x1={258} y1={44} x2={296} y2={44} />
      <rect x={298} y={20} width={110} height={48} rx={3} fill="color-mix(in srgb, var(--color-warm) 12%, transparent)" stroke={WARM} />
      <text x={353} y={40} textAnchor="middle" fill={WARM} style={label}>
        Schema check
      </text>
      <text x={353} y={54} textAnchor="middle" fill={FAINT} style={mono}>
        rejects, not records
      </text>

      <Arrow x1={410} y1={44} x2={448} y2={44} />
      <Box x={450} y={20} w={110} h={48} title="Store" sub="dates, issuers" dashed />

      <line x1={505} y1={70} x2={505} y2={104} stroke={RULE} strokeWidth={1} markerEnd="url(#tip)" />

      <text x={0} y={124} fill={FAINT} style={mono}>
        NEARLY FREE, CONTINUOUSLY
      </text>
      <Box x={450} y={110} w={110} h={48} title="Monitor" sub="on a horizon" accent />
      <Arrow x1={448} y1={134} x2={410} y2={134} />
      <Box x={298} y={110} w={110} h={48} title="Raise" sub="about to lapse" />
      <Arrow x1={296} y1={134} x2={258} y2={134} />
      <Box x={146} y={110} w={110} h={48} title="Outreach" sub="supplier chased" accent />

      <text x={0} y={196} fill={DIM} style={{ ...mono, fontSize: 10 }}>
        Splitting the two is what lets the second one run all the time.
      </text>
    </Frame>
  );
}

/** States enforced where every writer has to pass through them. */
function TalentDiagram({ className }: DiagramProps) {
  return (
    <Frame viewBox="0 0 600 210" className={className}>
      <Box x={0} y={20} w={104} h={40} title="Interface" sub="Next.js" />
      <Box x={0} y={70} w={104} h={40} title="Import" dashed />
      <Box x={0} y={120} w={104} h={40} title="Manual fix" dashed />

      <Arrow x1={106} y1={40} x2={186} y2={78} />
      <Arrow x1={106} y1={90} x2={186} y2={90} />
      <Arrow x1={106} y1={140} x2={186} y2={102} />

      <rect x={188} y={56} width={130} height={68} rx={3} fill="color-mix(in srgb, var(--color-warm) 12%, transparent)" stroke={WARM} />
      <text x={253} y={82} textAnchor="middle" fill={WARM} style={label}>
        Typed schema
      </text>
      <text x={253} y={96} textAnchor="middle" fill={FAINT} style={mono}>
        Drizzle
      </text>
      <text x={253} y={110} textAnchor="middle" fill={FAINT} style={mono}>
        states enforced here
      </text>

      <Arrow x1={320} y1={90} x2={358} y2={90} />
      <Box x={360} y={56} w={110} h={68} title="Postgres" sub="one truth" dashed />

      <text x={0} y={186} fill={DIM} style={{ ...mono, fontSize: 10 }}>
        Every path in passes the same constraint, so no writer can bypass it.
      </text>
    </Frame>
  );
}

const DIAGRAMS: Record<string, (props: DiagramProps) => React.ReactElement> = {
  "agentic-pdm-ecm-qms": PdmDiagram,
  "grounded-engineering-agent": AgentDiagram,
  "autonomous-compliance": ComplianceDiagram,
  talentflow: TalentDiagram,
};

export function ProjectDiagram({ slug, className }: { slug: string; className?: string }) {
  const Diagram = DIAGRAMS[slug];
  return Diagram ? <Diagram className={className} /> : null;
}
