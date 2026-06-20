export interface DemoVariant {
  id: string;
  variantType: string;
  subjectLine: string;
  previewText: string;
  bodyHtml: string;
}

export interface DemoEmail {
  id: string;
  position: number;
  emailType: string;
  subjectLine: string;
  previewText: string;
  bodyHtml: string;
  scheduledSendAt: string | null;
  approvalStatus: "approved" | "draft";
  variants: DemoVariant[];
}

export interface DemoCohort {
  programName: string;
  cartOpenDate: string;
  cartCloseDate: string;
  cohortStartDate: string;
  emails: DemoEmail[];
}

// Build cohort with dates computed dynamically so demo always looks live.
export function buildDemoCohort(): DemoCohort {
  const now = new Date();

  function addDays(base: Date, days: number): Date {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
  }

  function toDateStr(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  function toSendAt(base: Date, offsetDays: number): string {
    const d = addDays(base, offsetDays);
    d.setUTCHours(13, 0, 0, 0);
    return d.toISOString();
  }

  const cartOpen = addDays(now, 14);
  const cartClose = addDays(now, 21);
  const cohortStart = addDays(now, 35);

  return {
    programName: "The Mindset Shift Accelerator",
    cartOpenDate: toDateStr(cartOpen),
    cartCloseDate: toDateStr(cartClose),
    cohortStartDate: toDateStr(cohortStart),
    emails: [
      {
        id: "demo-j-1",
        position: 1,
        emailType: "pre_launch_warmup",
        subjectLine: "I want to ask you something.",
        previewText: "This has been sitting with me for a while.",
        bodyHtml: `<p>I want to ask you something.</p>
<p>When was the last time you made a decision — a real one — from a place of clarity instead of fear?</p>
<p>I've been coaching women in leadership for six years. And the pattern I see, over and over, isn't a skills gap. It's not a strategy gap. It's a belief gap. We tell ourselves a story about what we're allowed to want, allowed to ask for, allowed to become.</p>
<p>We've been building something to change that. Something structured. Something that actually works. I'll tell you more soon.</p>
<p>For now — sit with the question.</p>
<p>— Jordan</p>`,
        scheduledSendAt: toSendAt(cartOpen, -14),
        approvalStatus: "approved",
        variants: [],
      },
      {
        id: "demo-j-2",
        position: 2,
        emailType: "list_primer",
        subjectLine: "Who this is for (and who it isn't).",
        previewText: "I want to be honest before I tell you everything.",
        bodyHtml: `<p>Before I open the doors next week, I want to be direct.</p>
<p>The Mindset Shift Accelerator is a six-week cohort for women in leadership who are done playing small — but haven't been able to fully step into what they know they're capable of. Not because they lack skill. Because something internal keeps pulling them back.</p>
<p>This is for you if: you're already in a leadership role and it still doesn't feel like enough. You know what you should do, but you don't do it. You second-guess decisions you'd make in a heartbeat for someone else.</p>
<p>This is not for you if: you're looking for tactics, frameworks, or a 90-day business plan. We go deeper than that.</p>
<p>We keep cohorts small. We keep the work real. I'll share the details Thursday.</p>
<p>— Jordan</p>`,
        scheduledSendAt: toSendAt(cartOpen, -7),
        approvalStatus: "approved",
        variants: [],
      },
      {
        id: "demo-j-3",
        position: 3,
        emailType: "cart_open",
        subjectLine: "The door opens today.",
        previewText: "We're ready when you are.",
        bodyHtml: `<p>It's here.</p>
<p>The Mindset Shift Accelerator is open for enrollment as of right now.</p>
<p>Six weeks. A small cohort of women in leadership. Live sessions every Tuesday and Thursday, plus a private community between calls.</p>
<p>Week one, we surface the story. Week two, we test it. Weeks three through six, we replace it — with something that actually fits who you're becoming.</p>
<p>We start in three weeks. The cohort closes before then. If you've been waiting for the right moment: this is it.</p>
<p><a href="#">Enroll in the Mindset Shift Accelerator →</a></p>
<p>— Jordan</p>`,
        scheduledSendAt: toSendAt(cartOpen, 0),
        approvalStatus: "approved",
        variants: [],
      },
      {
        id: "demo-j-4",
        position: 4,
        emailType: "curriculum_deep_dive",
        subjectLine: "What actually happens inside.",
        previewText: "Week by week, here's what we do.",
        bodyHtml: `<p>A few people have asked me what the six weeks actually look like. Fair question.</p>
<p>Week one is about surfacing. We get the story on the table — the one you've been telling yourself about your limits. We don't judge it. We examine it.</p>
<p>Week two is about testing. Where did that story come from? Is it still true? We push on it together, as a cohort.</p>
<p>Weeks three and four are where the work gets real. We identify the patterns that show up in your leadership — in decisions, in conflict, in the moments you go quiet when you have something to say.</p>
<p>Weeks five and six are about building the new default. Not a technique. A different way of operating under pressure.</p>
<p>We meet twice a week, live. The sessions are recorded. The community is active.</p>
<p>We start in less than three weeks.</p>
<p><a href="#">Secure your spot →</a></p>
<p>— Jordan</p>`,
        scheduledSendAt: toSendAt(cartOpen, 2),
        approvalStatus: "approved",
        variants: [],
      },
      {
        id: "demo-j-5",
        position: 5,
        emailType: "student_story",
        subjectLine: "Amara went quiet in every meeting. Then she didn't.",
        previewText: "She knew what to say. She just couldn't say it.",
        bodyHtml: `<p>Amara is a VP at a tech company. She manages a team of fourteen. She had been in rooms where she was the most prepared person at the table — and she still went quiet.</p>
<p>"I'd have the answer," she told me. "And then I'd watch someone else say it. And I'd feel relieved."</p>
<p>That's not a communication problem. That's a permission problem.</p>
<p>We worked on it for six weeks in a previous cohort. Not on her delivery. On her sense of what she was allowed to take up in a room.</p>
<p>Three months after we finished, she was promoted to SVP. She told me it wasn't because she changed how she talked. It was because she stopped waiting for permission that was never coming.</p>
<p>That's the work. That's what we do.</p>
<p><a href="#">Join us →</a></p>
<p>— Jordan</p>`,
        scheduledSendAt: toSendAt(cartOpen, 4),
        approvalStatus: "approved",
        variants: [],
      },
      {
        id: "demo-j-6",
        position: 6,
        emailType: "objection_handling",
        subjectLine: "The three reasons you're still thinking about it.",
        previewText: "Let's be honest about what's in the way.",
        bodyHtml: `<p>I know some of you are still thinking about it. Let me name what's in the way.</p>
<p>One: "I don't have time." You have time for the things you've decided matter. The question is whether you've decided this matters.</p>
<p>Two: "I need to see results first." I understand this. I can't promise you a VP title or a raise. I can promise you clarity. The results come from what you do with it.</p>
<p>Three: "I'm not sure I'm the right fit." If you read the email I sent on Tuesday — the one about who this is and isn't for — and it landed for you, you're the right fit.</p>
<p>We close enrollment in a few days. The cohort stays small by design. If you have questions, hit reply. I'll answer every one.</p>
<p>— Jordan</p>`,
        scheduledSendAt: toSendAt(cartOpen, 6),
        approvalStatus: "approved",
        variants: [],
      },
      {
        id: "demo-j-7",
        position: 7,
        emailType: "close_48h",
        subjectLine: "Two days left.",
        previewText: "Enrollment closes in 48 hours.",
        bodyHtml: `<p>Enrollment closes in 48 hours.</p>
<p>If you've been meaning to decide, now's the time.</p>
<p>We have a few spots left. We won't be adding more. When this cohort fills, we close, and the next one won't open until next quarter.</p>
<p>If you want in: <a href="#">enroll here</a>.</p>
<p>If you're on the fence and want to talk it through, hit reply and I'll get back to you today.</p>
<p>— Jordan</p>`,
        scheduledSendAt: toSendAt(cartClose, -2),
        approvalStatus: "approved",
        variants: [],
      },
      {
        id: "demo-j-8",
        position: 8,
        emailType: "close_24h",
        subjectLine: "Tomorrow at midnight, this closes.",
        previewText: "Last full day to enroll.",
        bodyHtml: `<p>This is the last full day to enroll in the Mindset Shift Accelerator.</p>
<p>Tomorrow at midnight, we close the cohort and stop taking applications. No exceptions — we keep the group tight on purpose.</p>
<p>If you've been reading every email and something in you keeps saying yes, listen to that.</p>
<p><a href="#">Enroll before midnight tomorrow →</a></p>
<p>— Jordan</p>`,
        scheduledSendAt: toSendAt(cartClose, -1),
        approvalStatus: "approved",
        variants: [],
      },
      {
        id: "demo-j-9",
        position: 9,
        emailType: "final_call",
        subjectLine: "Last chance. We close tonight.",
        previewText: "Midnight tonight.",
        bodyHtml: `<p>Tonight at midnight, enrollment closes.</p>
<p>If you're in, now's the moment.</p>
<p><a href="#">Enroll in the Mindset Shift Accelerator →</a></p>
<p>— Jordan</p>`,
        scheduledSendAt: toSendAt(cartClose, 0),
        approvalStatus: "approved",
        variants: [
          {
            id: "demo-j-9-v1",
            variantType: "urgency_led",
            subjectLine: "Last chance. We close tonight.",
            previewText: "Midnight tonight. No extensions.",
            bodyHtml: `<p>Tonight at midnight, enrollment closes. We don't extend deadlines — the cohort starts in two weeks and we need to close the group now.</p>
<p>If you've been on the edge: decide now. <a href="#">Enroll here.</a></p>
<p>— Jordan</p>`,
          },
          {
            id: "demo-j-9-v2",
            variantType: "results_led",
            subjectLine: "What you get if you say yes tonight.",
            previewText: "Six weeks. One shift. Here's what changes.",
            bodyHtml: `<p>Enrollment closes tonight at midnight.</p>
<p>Here's what the women who've done this work tell me afterward: they stop waiting to feel ready. They start showing up like they've already decided they belong in the room.</p>
<p>Six weeks. Twice a week, live. A cohort of women who get it.</p>
<p><a href="#">Enroll before midnight →</a></p>
<p>— Jordan</p>`,
          },
          {
            id: "demo-j-9-v3",
            variantType: "personal_note",
            subjectLine: "A personal note before we close.",
            previewText: "I mean this.",
            bodyHtml: `<p>I don't usually do last-chance emails that try to manufacture urgency. This isn't that.</p>
<p>We close tonight because we have to. The cohort starts in two weeks. I need to know who's in the room.</p>
<p>If you've been following along and something in these emails has felt true — about the belief gap, about going quiet, about waiting for permission — I hope you'll join us.</p>
<p>We'd be glad to have you.</p>
<p><a href="#">Enroll in the Mindset Shift Accelerator →</a></p>
<p>— Jordan</p>`,
          },
        ],
      },
    ],
  };
}

// Backwards-compat export for any remaining static references
export const DEMO_COHORT = buildDemoCohort();
