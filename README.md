# Air Mail — anniversary site

A private site for the two of you: a bulletin board for notes and photos, a
merged calendar (yours / hers / shared, each its own color), a shared doodle
canvas, and a trivia game you can fill with inside jokes.

Everything runs as static files on GitHub Pages. The bulletin board and
doodle page talk to a small free [Supabase](https://supabase.com) project
(a hosted Postgres database + file storage) so your notes and drawings
persist and sync between you. The calendar is just an embed of Google
Calendars you already have.

**You will only ever need to edit two files by hand: `js/config.js` and
`data/questions.json`.** Everything else works as-is.

---

## 1. Get the site on GitHub

1. Create a new repository on GitHub (public or private both work with
   GitHub Pages, but see the security note at the bottom before making it
   public).
2. Push this folder's contents to the repo:
   ```bash
   cd anniversary-site
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```
3. In the repo, go to **Settings → Pages**, set **Source** to "Deploy from
   a branch", branch `main`, folder `/ (root)`. Save.
4. GitHub gives you a URL like `https://YOUR-USERNAME.github.io/YOUR-REPO/`.
   It takes a minute or two to go live after each push.

You now have a real, working site with placeholder data. The next two
sections make it actually yours.

---

## 2. Set up Supabase (for the board + doodle)

1. Go to [supabase.com](https://supabase.com), sign up free, and create a
   new project (any name/region/password — you won't need the DB password
   again after setup).
2. Once it's ready, open **Project Settings → API**. Copy the **Project
   URL** and the **anon public** key.
3. Open `js/config.js` in the repo and paste them in:
   ```js
   supabaseUrl: "https://xxxxxxxx.supabase.co",
   supabaseAnonKey: "eyJ...",
   ```
4. In the Supabase dashboard, open the **SQL Editor**, paste the following,
   and run it. This creates the two tables the site needs and opens them up
   to read/write without a login system (see the security note at the
   bottom for what this trade-off means):

   ```sql
   create table notes (
     id uuid primary key default gen_random_uuid(),
     author text not null,
     message text,
     image_url text,
     x float,
     y float,
     rotation float,
     created_at timestamptz default now()
   );
   alter table notes enable row level security;
   create policy "anyone can read notes" on notes for select using (true);
   create policy "anyone can write notes" on notes for insert with check (true);
   create policy "anyone can update notes" on notes for update using (true);
   create policy "anyone can delete notes" on notes for delete using (true);

   create table doodle_strokes (
     id bigint generated always as identity primary key,
     points jsonb not null,
     color text not null,
     width float not null,
     created_at timestamptz default now()
   );
   alter table doodle_strokes enable row level security;
   create policy "anyone can read strokes" on doodle_strokes for select using (true);
   create policy "anyone can write strokes" on doodle_strokes for insert with check (true);
   create policy "anyone can delete strokes" on doodle_strokes for delete using (true);
   ```
5. Go to **Storage**, create a new bucket named exactly `note-photos`, and
   mark it **Public** (toggle at creation, or in bucket settings after).
6. In **Project Settings → API**, the realtime feature is on by default;
   nothing else to configure there.
7. Commit and push your edited `js/config.js`. Reload the site — the board
   and doodle page should now load without the orange "needs setup"
   banner.

---

## 3. Set up the calendar

1. In Google Calendar, create **three calendars** (gear icon → Settings →
   "Add calendar" → "Create new calendar"): one for you, one for her, one
   for shared events.
2. For each, open its **Settings and sharing** page:
   - Under "Access permissions," check **"Make available to public"** (set
     to "See all event details"). This is what lets it be embedded —
     it isn't listed anywhere searchable, only usable if someone has the ID.
   - Scroll to "Integrate calendar" and copy the **Calendar ID** (looks
     like `abcd1234@group.calendar.google.com`).
3. Paste the three IDs into `js/config.js` under `calendars`, and pick a
   timezone string (e.g. `"America/New_York"`).
4. Colors in `config.js` are hex codes without the `#`. Any hex works —
   pick three you can tell apart at a glance.
5. From here on, just add events to the relevant calendar from the regular
   Google Calendar app on either phone — they'll show up on the site
   automatically, no redeploy needed.

---

## 4. Personalize the rest

- `js/config.js` — set `yourName` and `herName`; they're used on the home
  page and as the author dropdown on the bulletin board.
- `data/questions.json` — replace the placeholder questions with your own.
  Each entry is:
  ```json
  { "question": "...", "options": ["A", "B", "C", "D"], "answerIndex": 1 }
  ```
  `answerIndex` is which option (counting from 0) is correct.

---

## 5. Preview locally before pushing

Browsers block some of this (module-like `fetch` calls) when you just
double-click `index.html`. Serve it locally instead:

```bash
cd anniversary-site
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

---

## A note on privacy

There's no login system here — the Supabase policies above let anyone with
the site's URL read and write notes/doodles, and the calendars are set to
"public" (unlisted, but not password protected). That's fine for a private
gift between two people as long as the GitHub Pages URL itself isn't
shared or indexed anywhere public. If you want a bit more of a lock on the
door, two easy upgrades later:
- Make the GitHub repo **private** — GitHub Pages still works from a
  private repo (on any paid GitHub plan; free accounts should keep the
  repo public but the URL is still effectively unlisted).
- Add a simple shared password prompt in JavaScript before the page
  content loads — ask if you'd like this built in.
