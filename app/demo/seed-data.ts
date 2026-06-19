export interface DemoVariant {
  id: string;
  variantType: string; // "urgency_led" | "results_led" | "personal_note"
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
  scheduledSendAt: string | null; // ISO string or null
  approvalStatus: "approved" | "draft";
  variants: DemoVariant[];
}

export interface DemoCohort {
  programName: string;
  cartOpenDate: string; // "YYYY-MM-DD"
  cartCloseDate: string;
  cohortStartDate: string;
  emails: DemoEmail[];
}

export const DEMO_COHORT: DemoCohort = {
  programName: "Systems for Solos: The Freelance Design Business Blueprint",
  cartOpenDate: "2026-07-14",
  cartCloseDate: "2026-07-28",
  cohortStartDate: "2026-08-04",
  emails: [
    {
      id: "demo-email-1",
      position: 1,
      emailType: "pre_launch_warmup",
      subjectLine: "Something is coming — and I think it's going to change how you run your business",
      previewText: "I've been building something for the past six months and I'm finally ready to share it.",
      bodyHtml: `<p>Hey — it's Maya.</p>
<p>I've been quiet in your inbox for a little while, and I promise there's a reason for that. I've been heads-down building something I've wanted to create for years, and it's almost ready.</p>
<p>If you've been freelancing for a while and you're tired of the feast-or-famine cycle — the months where you're slammed, followed by the months where you're refreshing your inbox hoping a new inquiry lands — I think what I'm about to share is going to feel like a breath of fresh air.</p>
<p>I started my freelance design practice almost a decade ago. For most of that time, I ran it by vibes. I said yes to everything. I undercharged, overdelivered, and burned out in spectacular fashion at least twice. The systems that finally turned things around weren't glamorous. They were boring, repeatable, and they worked.</p>
<p>I'm going to tell you all about it very soon. Keep an eye on your inbox next week — I'll be sharing more details about what I've been working on and who it's for.</p>
<p>Talk soon,<br/>Maya</p>`,
      scheduledSendAt: "2026-07-07T09:00:00Z",
      approvalStatus: "approved",
      variants: [],
    },
    {
      id: "demo-email-2",
      position: 2,
      emailType: "list_primer",
      subjectLine: "Are you a freelance designer who's great at the work but exhausted by the business side?",
      previewText: "Before I open the doors, I want to make sure this is actually for you.",
      bodyHtml: `<p>Quick check-in before I share what I've been building.</p>
<p>I want to make sure this is actually a fit before I tell you everything. So let me ask: does any of this sound familiar?</p>
<p>You do excellent work — clients rave about you — but you're constantly anxious about where the next project is coming from. You've been freelancing long enough that you should have this figured out by now, but somehow every month still feels a little uncertain. You've tried raising your rates, but it felt awkward and you weren't sure how to position it. You wish you had a waitlist, but you're not sure how to get there from here.</p>
<p>If you nodded at even two of those, keep reading. This is for you. If you're a new freelancer just getting started, I want to be honest: this is probably not the right fit yet. The systems I teach work best when you already have some client experience under your belt and you're ready to scale what's working.</p>
<p>Stay tuned — I'll be sharing all the details in a few days. In the meantime, I'd love to know: what's the single biggest thing that feels broken in your freelance business right now? Hit reply and tell me. I read every response.</p>
<p>— Maya</p>`,
      scheduledSendAt: "2026-07-11T09:00:00Z",
      approvalStatus: "approved",
      variants: [],
    },
    {
      id: "demo-email-3",
      position: 3,
      emailType: "cart_open",
      subjectLine: "Doors are open — Systems for Solos is live",
      previewText: "The program that teaches you the business side of freelance design. Enrollment closes July 28.",
      bodyHtml: `<p>It's here. Systems for Solos is officially open for enrollment.</p>
<p>This is the program I wish had existed when I was in year three of freelancing — when I was good at the work but had no idea how to turn it into a predictable, sustainable business. It's eight weeks, fully live, and built specifically for freelance designers who are ready to stop winging it.</p>
<p>Here's what you'll walk away with: a repeatable client acquisition process that doesn't depend on referrals or luck, a pricing framework that accounts for the full scope of your work (not just the hours you can bill), a proposal template that closes at a higher rate, and the systems to keep projects on track without constant check-ins and scope creep.</p>
<p>The cohort starts August 4th. We'll meet twice a week for live sessions, and you'll have access to a private community where you can ask questions and get feedback between calls. I keep cohorts small on purpose — I want to actually know everyone in the room.</p>
<p>Enrollment closes July 28th. If you've been waiting to figure out how to run this thing like a real business, this is your window.</p>
<p><a href="#">Enroll in Systems for Solos →</a></p>
<p>— Maya</p>`,
      scheduledSendAt: "2026-07-14T09:00:00Z",
      approvalStatus: "approved",
      variants: [],
    },
    {
      id: "demo-email-4",
      position: 4,
      emailType: "curriculum_deep_dive",
      subjectLine: "What you'll actually learn inside Systems for Solos (week by week)",
      previewText: "I want to be really specific about what's covered — because vague program promises drive me up a wall.",
      bodyHtml: `<p>I know "here's what you'll learn" emails can feel thin. So I want to be as specific as possible about what we cover in Systems for Solos, week by week.</p>
<p>Weeks 1–2: Positioning and pricing. We start here because everything downstream depends on it. You'll clarify who you're actually for, what makes you different from every other designer with a similar skill set, and how to price projects in a way that reflects real value — not just hours.</p>
<p>Weeks 3–4: Client acquisition. Not "post on LinkedIn and hope." We build a simple, repeatable system for generating warm inquiries consistently — one that doesn't require you to be online all day or perform for an audience you're not comfortable building.</p>
<p>Weeks 5–6: Proposals and onboarding. The most expensive place most freelancers leak money is the gap between inquiry and signed contract. We fix that. You'll leave with a proposal template and an onboarding process that sets the right expectations from day one.</p>
<p>Weeks 7–8: Project management and scope. Late payments, scope creep, revision spirals — we cover all of it. You'll have a contract framework, a revision policy that clients actually respect, and a system for ending every project with a strong referral relationship.</p>
<p>This is eight weeks of work, but it's the kind of work that changes how you operate for the next decade. If that sounds like what you need, enrollment is open through July 28th.</p>
<p><a href="#">See full curriculum and enroll →</a></p>
<p>— Maya</p>`,
      scheduledSendAt: "2026-07-16T09:00:00Z",
      approvalStatus: "approved",
      variants: [],
    },
    {
      id: "demo-email-5",
      position: 5,
      emailType: "student_story",
      subjectLine: "How Priya raised her rates by 40% without losing a single client",
      previewText: "She almost didn't do it. Here's what changed.",
      bodyHtml: `<p>I want to tell you about Priya.</p>
<p>Priya is a brand identity designer who went through the first cohort of Systems for Solos last year. When she joined, she was charging rates she'd set in 2021 — rates she knew were too low but felt too scared to change. She was worried her clients would leave. She was worried she wasn't "established enough" to charge more. She was stuck.</p>
<p>By week three of the program, Priya had rebuilt her pricing framework from scratch using the method we teach in module two. She raised her project rates by 40% and sent revised pricing to her three best retainer clients. She lost exactly none of them. One of them responded to say it was "long overdue."</p>
<p>By the end of the cohort, Priya had filled her calendar through the end of the year at her new rates and had a waitlist of two new clients for Q1. She also had, in her words, "a lot less dread on Sunday nights."</p>
<p>Priya's story isn't unusual for people who go through this program. The systems work because they're not abstract — they're specific, testable, and built for the actual realities of running a one-person design business.</p>
<p>If you're ready for your version of Priya's story, enrollment is still open. Doors close July 28th.</p>
<p><a href="#">Join the cohort →</a></p>
<p>— Maya</p>`,
      scheduledSendAt: "2026-07-19T09:00:00Z",
      approvalStatus: "approved",
      variants: [],
    },
    {
      id: "demo-email-6",
      position: 6,
      emailType: "objection_handling",
      subjectLine: "\"I can't afford a program right now\" — let's talk about that",
      previewText: "The real math on investing in your business when money feels tight.",
      bodyHtml: `<p>I get this one a lot, and I want to talk about it honestly rather than just throwing a payment plan at you.</p>
<p>If you're a freelance designer charging $3,000 per project and you close one additional project per quarter because your proposals are clearer and your positioning is sharper — that's $12,000 in additional revenue over a year. If you raise your rates by 25% and retain your current client load, the math is even more dramatic. The program pays for itself many times over if you implement what's inside.</p>
<p>I also want to name something else: the cost of not changing. If the way you're running your business right now is generating anxiety, undercharging, and a feast-or-famine cycle — what does another year of that cost you? Not just in money, but in energy and time and the slow erosion of loving the work you're doing.</p>
<p>That said, I'm not going to tell you this is right for everyone regardless of circumstances. If you're in genuine financial hardship, this is not the right moment and I'd rather you not stretch for it. But if "I can't afford it" is actually "I'm scared it won't work" — I'd invite you to look at that honestly.</p>
<p>Yes, there's a payment plan. Three installments. Reach out and I'll send you the details.</p>
<p>Enrollment closes July 28th.</p>
<p>— Maya</p>`,
      scheduledSendAt: "2026-07-22T09:00:00Z",
      approvalStatus: "approved",
      variants: [],
    },
    {
      id: "demo-email-7",
      position: 7,
      emailType: "close_48h",
      subjectLine: "48 hours left — a few things I want to make sure you know",
      previewText: "Enrollment closes Monday at midnight.",
      bodyHtml: `<p>Enrollment for Systems for Solos closes in 48 hours — Monday, July 28th at midnight.</p>
<p>If you've been on the fence, I want to share a few things that might help you decide.</p>
<p>This is a live cohort, not a self-paced course. We meet twice a week, you'll have real accountability, and you'll build this alongside other freelancers who are in the same season of their business. That structure matters — it's why people actually finish and implement, rather than adding it to the pile of courses they bought and never opened.</p>
<p>I also want to be clear about what this isn't: it's not a freelancing 101 program, it's not about getting clients on social media, and it's not about building a personal brand. It's about the unsexy operational side of running a freelance business — and making it work reliably.</p>
<p>If that's what you need right now, here's the link. If you have questions, reply to this email. I'm checking it today and tomorrow.</p>
<p><a href="#">Enroll before Monday →</a></p>
<p>— Maya</p>`,
      scheduledSendAt: "2026-07-26T09:00:00Z",
      approvalStatus: "approved",
      variants: [],
    },
    {
      id: "demo-email-8",
      position: 8,
      emailType: "close_24h",
      subjectLine: "Last day — enrollment closes tonight at midnight",
      previewText: "This is the last email I'll send about Systems for Solos.",
      bodyHtml: `<p>This is the last email I'll send about Systems for Solos enrollment.</p>
<p>Doors close tonight at midnight. If you've been meaning to join and haven't yet, this is the moment.</p>
<p>I want to say something genuine here: I built this program because I spent years figuring out the hard way how to run a freelance design business that didn't run me into the ground. I made most of the classic mistakes — undercharging, overcommitting, saying yes to bad-fit clients because I was afraid of the gap, avoiding difficult conversations until they became disasters.</p>
<p>The systems inside this program are the ones that actually changed things for me. They're not complicated. They're just not obvious, and nobody taught me any of them when I started.</p>
<p>If you're a freelancer who's ready to stop figuring it out alone, I'd love to have you in the cohort.</p>
<p><a href="#">Join Systems for Solos — closes tonight →</a></p>
<p>Talk soon,<br/>Maya</p>`,
      scheduledSendAt: "2026-07-27T09:00:00Z",
      approvalStatus: "approved",
      variants: [],
    },
    {
      id: "demo-email-9",
      position: 9,
      emailType: "final_call",
      subjectLine: "Cart closes in 3 hours — last call for Systems for Solos",
      previewText: "Doors close at midnight. This is your final reminder.",
      bodyHtml: `<p>Three hours left.</p>
<p>Enrollment for Systems for Solos closes at midnight tonight. After that, the doors are closed until the next cohort — and I don't have dates set for that yet.</p>
<p>If you're in, here's the link: <a href="#">Enroll now →</a></p>
<p>If you're not — no hard feelings. I'll keep writing about the business side of freelancing in this newsletter and I hope something I share is useful to you wherever you are.</p>
<p>Thank you for being here and for following along during this launch. It means a lot.</p>
<p>— Maya</p>`,
      scheduledSendAt: "2026-07-28T18:00:00Z",
      approvalStatus: "approved",
      variants: [
        {
          id: "demo-variant-urgency",
          variantType: "urgency_led",
          subjectLine: "Cart closes in 3 hours — last call for Systems for Solos",
          previewText: "Doors close at midnight. This is your final reminder.",
          bodyHtml: `<p>Three hours left.</p>
<p>Enrollment for Systems for Solos closes at midnight tonight. After that, the doors are closed until the next cohort — and I don't have dates set for that yet.</p>
<p>If you've been on the fence this whole launch, I want to say this: the fence is a comfortable place to sit, but it doesn't move you forward. The cost of staying where you are is real, even if it's invisible.</p>
<p>The cohort starts August 4th. Eight weeks. Small group. Real systems for running a freelance design business that works.</p>
<p>If you're in, here's the link: <a href="#">Enroll before midnight →</a></p>
<p>— Maya</p>`,
        },
        {
          id: "demo-variant-results",
          variantType: "results_led",
          subjectLine: "Before doors close: what past students built in 8 weeks",
          previewText: "Real outcomes from the last cohort — and why the next one is even stronger.",
          bodyHtml: `<p>Before I close enrollment tonight, I want to share one more look at what past students have built inside Systems for Solos.</p>
<p>From the last cohort: six out of twelve students raised their rates before the program ended. Four students restructured their client onboarding process and reported fewer revision requests. Three students landed new clients directly from the referral systems we built in week eight. One student — a packaging designer who'd been freelancing for four years — said it was the first time her business felt like something she was actually running rather than something that was running her.</p>
<p>The next cohort starts August 4th. Enrollment closes in a few hours.</p>
<p>If you're ready to build something that works, here's your link: <a href="#">Join the cohort →</a></p>
<p>— Maya</p>`,
        },
        {
          id: "demo-variant-personal",
          variantType: "personal_note",
          subjectLine: "A quick personal note before I close the doors",
          previewText: "Something I don't usually say out loud about why I built this.",
          bodyHtml: `<p>I'm closing enrollment in a few hours and I wanted to send one last note — less salesy, more honest.</p>
<p>I built Systems for Solos because I spent a long time feeling embarrassed about the business side of my practice. I was good at design. I was bad at running a business. And I felt like I was the only one — because nobody was talking about it, at least not in any real way.</p>
<p>This program is what I needed back then. It's not about becoming a business person instead of a creative. It's about being a creative who has a business that supports them instead of draining them.</p>
<p>If any part of that resonates, I'd love to have you in the cohort. Doors close tonight at midnight.</p>
<p><a href="#">Join us →</a></p>
<p>With gratitude,<br/>Maya</p>`,
        },
      ],
    },
  ],
};
