/**
 * The legal text, and the facts it is built on.
 *
 * Written from what the app actually does, which is why it is short. LVL100
 * keeps everything in the browser it is running in: there is no account, no
 * server, no analytics and no third-party script. Most of a privacy policy is
 * an inventory of where data goes, and this one has almost nothing to list.
 *
 * The temptation with these pages is to paste a generic template. A template
 * describes a normal app — cookies, ad partners, data processors, an account
 * you can ask to delete — and every one of those sentences would be a lie
 * here. Claiming to share data with partners who do not exist is its own kind
 * of dishonesty, and it buries the one fact that actually matters: it never
 * leaves the device.
 *
 * NOT LEGAL ADVICE. These are drafted to be accurate about the software, and
 * they need a real review before the app takes money or launches properly.
 * The operator details below are placeholders and must be filled in — a UK or
 * EU trader has to identify itself, and "somebody" is not an identification.
 */

/**
 * Who runs this. EVERY FIELD HERE IS A PLACEHOLDER.
 *
 * UK and EU consumer law both require a trader to give a name, a geographic
 * address and a way to be contacted quickly. An app store will ask for the
 * same. Fill these in before anything ships to the public.
 */
export const OPERATOR = {
  filled: false,
  name: 'TO BE CONFIRMED',
  entity: 'Sole trader / limited company — to be confirmed',
  address: 'Registered address — to be confirmed',
  companyNo: null,
  email: 'TO BE CONFIRMED',
  country: 'United Kingdom',
}

/** Bumped whenever the substance of any document below changes. */
export const LEGAL_VERSION = '0.1'
export const LEGAL_UPDATED = '20 September 2026'

/**
 * What the app stores, in the words somebody would use to describe it.
 *
 * Kept as data rather than prose because it is the answer to three different
 * questions — what is collected, why, and how to get rid of it — and all three
 * pages want to say the same thing without drifting apart.
 */
export const DATA_KEPT = [
  {
    what: 'Your character',
    detail: 'The name and handle you chose, your avatar, level, XP and gear.',
    why: 'It is the game. Without it there is nothing to come back to.',
  },
  {
    what: 'Your training',
    detail: 'Sessions you timed or imported: activity, duration, distance, sets, reps and weights.',
    why: 'It is what the app is for, and what every chart and record is built from.',
  },
  {
    what: 'Which games you play',
    detail: 'The ones you picked at character creation, if you picked any.',
    why: 'It decides whether the app offers aim training as something worth doing.',
  },
  {
    what: 'Your settings',
    detail: 'Light or dark, your training split and goal, and which best efforts you pinned.',
    why: 'So the app looks and behaves the way you left it.',
  },
  {
    what: 'Route traces, if you allow location',
    detail: 'The path of an outdoor session, while that session is running.',
    why: 'To measure distance and pace without asking you to type a number in.',
  },
]

/** The parts of a phone the app asks for, and what happens if you say no. */
export const PERMISSIONS = [
  {
    what: 'Location',
    when: 'Only while an outdoor session is running, and only if you allow it.',
    refused: 'The session still runs and still counts. It just cannot say how far you went.',
  },
  {
    what: 'Files',
    when: 'Only when you choose a workout file to import.',
    refused: 'Nothing is read. You can still time sessions in the app.',
  },
]

/**
 * Each document, as a heading and a set of paragraphs.
 *
 * Plain sentences rather than clause-numbered legalese. A policy nobody reads
 * protects nobody, and the substance here is simple enough to say outright.
 */
export const DOCS = {
  privacy: {
    id: 'privacy',
    title: 'Privacy',
    summary: 'Everything stays on your device. There is no account and no server to send it to.',
    sections: [
      {
        h: 'The short version',
        p: [
          'LVL100 runs entirely in your browser. Your character, your training history and your settings are saved in that browser’s own storage, on your device.',
          'There is no account to make, no server that holds your data and nothing that leaves the device unless you deliberately export or share it.',
        ],
      },
      {
        h: 'What is stored',
        list: 'data',
      },
      {
        h: 'Who can see it',
        p: [
          'Nobody but you, unless you choose otherwise. The app makes no network requests at all in normal use — no analytics, no crash reporting, no advertising, no third-party scripts.',
          'Sharing a profile builds a code from your own data that you can pass to somebody. It is created only when you press the button, and it goes wherever you send it.',
        ],
      },
      {
        h: 'Location',
        p: [
          'Outdoor sessions can follow your route to measure distance and pace. The browser asks first, the trace is only recorded while the session is running, and it is stored with that session on your device like everything else.',
          'Refusing is a supported way to use the app, not a degraded one — the clock still runs and the session still counts.',
        ],
      },
      {
        h: 'Getting rid of it',
        p: [
          'Clearing this site’s data in your browser settings deletes everything the app holds, permanently and immediately. There is no copy anywhere else, so there is nothing to request and nobody to ask.',
          'Uninstalling or clearing the browser has the same effect. It is not recoverable, so export first if you want to keep it.',
        ],
      },
      {
        h: 'Children',
        p: [
          'The app is not aimed at children under 13 and does not knowingly collect anything from them. Since it collects nothing centrally, there is nothing held about anyone of any age.',
        ],
      },
      {
        h: 'Your rights',
        p: [
          'UK and EU data protection law gives you rights to see, correct, export and delete personal data held about you. Those rights are exercised here directly: it is all on your device, you can read it, change it in the app and delete it by clearing the site’s data.',
          'If that ever changes — if accounts or syncing are added — this page will change with it, and it will say so plainly before anything is switched on.',
        ],
      },
    ],
  },

  cookies: {
    id: 'cookies',
    title: 'Cookies',
    summary: 'None. The app uses your browser’s local storage instead, and only to remember your own game.',
    sections: [
      {
        h: 'There are no cookies',
        p: [
          'LVL100 sets no cookies. It uses local storage, which is a different thing: it stays in your browser, it is never attached to a network request and no server receives it — because there is no server.',
        ],
      },
      {
        h: 'Why there is no banner',
        p: [
          'Consent is required for storage that is not strictly necessary for a service you asked for — tracking, measurement, advertising. The storage here holds your character and your training, which is the service. Remove it and there is no app.',
          'No analytics, no pixels, no embeds and no third-party scripts run here, so there is nothing to ask you to agree to. A banner would be theatre.',
        ],
      },
      {
        h: 'Clearing it',
        p: [
          'Clearing this site’s data in your browser removes all of it and resets the app to a new character.',
        ],
      },
    ],
  },

  terms: {
    id: 'terms',
    title: 'Terms',
    summary: 'A free prototype, provided as is. Train sensibly — it is a game, not a coach.',
    sections: [
      {
        h: 'What this is',
        p: [
          'LVL100 is an early prototype, free to use, provided as it is and without any warranty. Features may change or disappear, and the save format may change in a way that ends an old character.',
        ],
      },
      {
        h: 'It is not health advice',
        p: [
          'The app suggests training — splits, exercises, weights to try next. Those suggestions come from simple, general rules applied to what you logged. They are not personal advice, they are not medical advice, and nobody has assessed you.',
          'You are responsible for what you do in the gym. If you have an injury, a health condition, or you are new to lifting, talk to a doctor or a qualified coach. Stop if something hurts.',
        ],
      },
      {
        h: 'Fair use',
        p: [
          'Do not try to break it for other people, and do not pass it off as your own. That is the whole list.',
        ],
      },
      {
        h: 'Liability',
        p: [
          'To the extent the law allows, the operator is not liable for loss or damage arising from using the app — including lost progress. Nothing here limits liability for death or personal injury caused by negligence, for fraud, or anything else that cannot legally be limited.',
        ],
      },
      {
        h: 'Other people’s trademarks',
        p: [
          'Game names and logos shown on a profile are the trademarks of their owners and are used only to identify the games somebody plays. LVL100 is not affiliated with, endorsed by or connected to any of them.',
        ],
      },
      {
        h: 'Governing law',
        p: [
          'These terms are governed by the law of England and Wales, and the courts there have jurisdiction. If you are a consumer elsewhere, this does not take away rights your local law gives you.',
        ],
      },
    ],
  },

  refunds: {
    id: 'refunds',
    title: 'Refunds',
    summary: 'Nothing is for sale yet, so nothing has been charged. Here is what will apply when it is.',
    sections: [
      {
        h: 'Nothing is being sold',
        p: [
          'The app takes no payments. The subscription page shows placeholder pricing and its button is disabled — there is no payment provider behind it and nothing in the app is locked.',
          'If you believe you have been charged for LVL100, you have not been charged by us. Contact your bank.',
        ],
      },
      {
        h: 'When it does take payments',
        p: [
          'A subscription will be cancellable at any time and will run to the end of the period already paid for. Cancelling stops the next charge; it does not claw back the current one.',
          'UK and EU consumer law gives 14 days to change your mind about a digital subscription. You can ask to start using it immediately inside those 14 days, and doing so means giving up the right to cancel for a refund — which will be said clearly at the point of purchase, not buried here.',
          'If the service is broken, unavailable or not as described, you are entitled to a repair, a replacement or your money back. That is the law and it is not something a policy can sign away.',
        ],
      },
      {
        h: 'How to ask',
        p: [
          'By email, to the address on this page. A request will get a reply within five working days and a refund within 14 days of it being agreed, to the method it was paid with.',
        ],
      },
    ],
  },
}

export const DOC_ORDER = ['privacy', 'terms', 'cookies', 'refunds']
