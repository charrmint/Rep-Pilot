# RepPilot

RepPilot is a mobile-first adaptive workout tracker.

The MVP focuses on fast workout logging, previous-session context, and deterministic progression recommendations.

## Development

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```

## Demo mode

RepPilot supports isolated demo sessions backed by anonymous Supabase users.
Selecting **Start demo** provisions two workout templates and four completed
workouts for the visitor, without requiring an email address or password.

For hosted environments, enable Anonymous Sign-Ins in the Supabase Auth
provider settings before using the demo entry point. Local development enables
the setting in `supabase/config.toml`.
