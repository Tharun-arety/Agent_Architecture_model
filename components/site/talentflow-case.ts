/**
 * The TalentFlow case study.
 *
 * Observed in the running application on 18 Aug 2026. Figures are ones the
 * system displays about its own seeded dataset, so they describe the demo
 * rather than any real hiring round.
 */

import type { CaseStudy } from "@/components/site/system-entries";

export const TALENTFLOW_CASE: CaseStudy = {
  context: [
    "Recruitment ran on email threads and a spreadsheet. That works until two people are hiring at once, and then the state of a candidate depends on who you ask and how recently they refreshed the tab.",
    "The specific failure was not losing candidates. It was disagreeing about where they were: someone treated as rejected in one thread and awaiting feedback in another, which is worse than losing them, because nobody knows there is anything to fix.",
    "The second failure was quieter and more expensive. Nobody could say which stage was slow, which source was worth the money, or how many people were sitting untouched, because none of that exists until the pipeline is a set of records rather than a set of messages.",
  ],
  architecture: [
    "A Next.js application over Postgres with the schema defined through Drizzle. Requisitions, candidates, stages, interviews and offers are first-class records, and the pipeline states are enforced by the database rather than by convention in the interface.",
    "One database serves two audiences that must never see each other. The public job board lists open roles by team, location and working pattern, and takes applications from anyone. The hiring pipeline behind it is invite-only, reached through Google SSO or a password, and an admin adds people rather than anyone self-registering.",
    "The requisition is the same record on both sides of that wall, which is what stops the careers page drifting from the pipeline. Closing a role internally takes the advert down, because there is nothing else to take down.",
  ],
  sections: [
    {
      eyebrow: "Why a system",
      icon: "question",
      visual: "vacancyCost",
      note: "The first two figures are yours to multiply. The third is actionable today.",
      title: "A spreadsheet cannot tell you what it is costing you",
      body: [
        "Email and a spreadsheet work for one open role. They fail at three, and the failure is not dramatic: nobody loses a candidate, people just disagree about where each one is, and nobody can see the pipeline as a whole.",
        "What is genuinely missing is arithmetic. How long a hire takes, which stage is slow, which channel is worth its cost, how many good people are sitting untouched right now. None of that exists until the pipeline is records rather than messages, and you cannot improve a process whose numbers you do not have.",
        "The seeded figures make the shape of the cost concrete: 32 days to hire on average, eight seats open across five roles, and a candidate who has been waiting 20 days without anyone touching their file. What an empty seat is worth is your number, not mine, but multiplying it by the first two is the calculation this replaces guesswork with.",
      ],
    },
    {
      eyebrow: "Where the money is",
      icon: "money",
      visual: "sourceMix",
      note: "Attribution has to be captured when someone applies. It cannot be reconstructed later.",
      title: "You are paying a percentage for one of these channels",
      body: [
        "In the seeded data, 35% of candidates come from the careers site, 21% from LinkedIn, 17% from referrals and 12% inbound. All of those cost you nothing per hire. The remaining 15% comes from an agency, which bills a percentage of salary on every one that lands.",
        "That is not an argument against agencies. It is an argument for knowing the ratio. If your own careers page and referrals are producing four times the volume of the channel you pay for, that is a budget conversation worth having, and it is invisible until attribution is recorded at the moment someone applies.",
        "The same data answers the harder question: not just where candidates come from, but where the ones who get hired come from. A channel producing volume that never converts is worse than one producing nothing, because it also consumes screening time.",
      ],
    },
    {
      eyebrow: "The wall",
      icon: "wall",
      note: "The requisition is the same row on both sides, so the advert cannot outlive the role.",
      title: "Two audiences, one record",
      body: [
        "Most careers pages are a separate system, or a CMS someone updates by hand. Both drift: a role stays advertised for a month after it is filled, and a candidate applies to something that no longer exists.",
        "Here the advert is a projection of the requisition rather than a copy of it, so drift is not something to remember to prevent. It is the reason the wall between the two audiences can be strict without anyone maintaining two sets of truth.",
      ],
    },
    {
      eyebrow: "Measurement",
      icon: "scope",
      visual: "funnel",
      note: "Both counts on one axis. The gap between the bars is what a board-shaped funnel throws away.",
      title: "Counting who reached a stage, not who is sitting in it",
      body: [
        "The conversion funnel measures candidates who have ever reached each stage. In the seeded data that reads 52 applied, 33 screened, 10 interviewed, 5 offered, 2 hired — 63% from applied to screening, 30% into interview, 50% to offer.",
        "The naive version counts who is in each column right now, which is the number a kanban board gives you for free. It is also wrong: it understates throughput by every candidate who has already moved on, and it makes a healthy pipeline look empty. Getting this right is the difference between a board and a measurement.",
      ],
    },
    {
      eyebrow: "Neglect",
      icon: "time",
      visual: "dwell",
      note: "Average dwell per stage, and the four candidates who have been waiting longest right now.",
      title: "Surfacing neglect, not just position",
      body: [
        "Every candidate card carries how long it has been idle, and the dashboard reports average time in each stage — 12.6 days in applied, 12.7 in screening, 13.1 in interview, 11.5 at offer in the seeded set.",
        "That is the metric a spreadsheet never gives you. The failure mode of a hiring pipeline is not a wrong decision, it is no decision: a good candidate sitting untouched for three weeks until they take another offer. Idle time is the only thing that makes that visible before it costs you.",
      ],
    },
    {
      eyebrow: "Attribution",
      icon: "people",
      visual: "attribution",
      note: "The activity feed reads as sentences, because a decision about a person has an author.",
      title: "Every move has a name on it",
      body: [
        "Stage transitions are recorded with who made them, and the activity feed reads as a sentence: moved to offer by Marcus Webb, moved to rejected by Priya Raman.",
        "It is the same principle as the approval trail in the engineering toolchain, applied to a lighter system. A decision about a person should be attributable to a person, and it costs nothing to record it at the moment it is made.",
      ],
    },
  ],
  results: [
    {
      value: "2",
      label: "Audiences, one record",
      note: "A public job board and an invite-only pipeline projecting the same requisition.",
    },
    {
      value: "5 stages",
      label: "Enforced by the schema",
      note: "Applied, screening, interview, offer, hired. A candidate cannot be in a state the database does not allow.",
    },
    {
      value: "32 d",
      label: "Average time to hire",
      note: "Measurable at all only because the pipeline is records rather than messages.",
    },
    {
      value: "Per stage",
      label: "Time and idle days",
      note: "Where the pipeline slows down, and who has been sitting untouched.",
    },
    {
      value: "Invite only",
      label: "Access to the pipeline",
      note: "Nobody self-registers into a system holding other people’s applications.",
    },
  ],
};
