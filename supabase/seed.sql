-- =============================================================================
-- Seed — campuses, categories, moderation deny-list
-- CAMPUS-MARKETPLACE-ARCHITECTURE.md §5.5, §5.8, §14 (Phase 0)
--
-- Idempotent: safe to re-run. Slugs match src/lib/data/catalogue.ts so the
-- placeholder arrays can be swapped for queries without touching the routes.
-- =============================================================================

insert into campuses (name, slug, county, email_domain, is_active) values
  ('Kabarak University', 'kabarak', 'Nakuru', 'kabarak.ac.ke', true)
on conflict (slug) do update
  set name = excluded.name, county = excluded.county,
      email_domain = excluded.email_domain, is_active = excluded.is_active;

-- §5.5 launch set, dense-demand first. "Others" is the single catch-all and is
-- watched at /admin/others-watch — it is a taxonomy discovery mechanism, not a
-- dumping ground.
insert into categories (name, slug, icon, sort_order, is_catchall, blurb) values
  ('Food & Snacks',        'food-snacks',        'utensils',    10, false,
   'Home-cooked meals, hostel delivery, baked goods and late-night snacks.'),
  ('Hostel & Room',        'hostel-room',        'bed',         20, false,
   'Mattresses, kettles, buckets, fans and bedding. Busiest at semester open and close.'),
  ('Fashion & Thrift',     'fashion-thrift',     'shirt',       30, false,
   'Clothes, shoes and bags — new, thrifted and barely worn.'),
  ('Electronics & Phones', 'electronics-phones', 'smartphone',  40, false,
   'Phones, laptops, accessories and repair services.'),
  ('Books & Stationery',   'books-stationery',   'book-open',   50, false,
   'Textbooks, past papers, notes and printing.'),
  ('Services',             'services',           'sparkles',    60, false,
   'Braiding, laundry, photography, repairs and design work.'),
  ('Rentals',              'rentals',            'calendar',    70, false,
   'Gowns, suits, cameras and calculators — by the day.'),
  ('Others',               'others',             'shapes',      99, true,
   'Everything that does not fit yet. We watch this category and promote what keeps showing up.')
on conflict (slug) do update
  set name = excluded.name, icon = excluded.icon,
      sort_order = excluded.sort_order, is_catchall = excluded.is_catchall,
      blurb = excluded.blurb;

-- §5.8 deny-list. `block` refuses the write outright; `flag` publishes and
-- queues it for a moderator, which is the default posture — a list that blocks
-- on every match generates more false-positive frustration than it prevents
-- harm. Expect to tune this weekly in the first month.
insert into moderation_keywords (phrase, severity, category) values
  -- academic dishonesty: the most common and most socially normalised violation
  ('assignment writing',   'flag',  'academic'),
  ('write my assignment',  'block', 'academic'),
  ('do my assignment',     'block', 'academic'),
  ('exam paper',           'flag',  'academic'),
  ('leaked paper',         'block', 'academic'),
  ('ghostwriting',         'flag',  'academic'),
  ('ghost writer',         'flag',  'academic'),
  ('proxy attendance',     'block', 'academic'),
  ('sit my exam',          'block', 'academic'),
  ('thesis writing',       'flag',  'academic'),

  ('alcohol',              'flag',  'alcohol'),
  ('whisky',               'flag',  'alcohol'),
  ('vodka',                'flag',  'alcohol'),
  ('vape',                 'flag',  'tobacco'),
  ('shisha',               'flag',  'tobacco'),
  ('cigarettes',           'flag',  'tobacco'),

  ('weed',                 'block', 'drugs'),
  ('cocaine',              'block', 'drugs'),
  ('mdma',                 'block', 'drugs'),
  ('tramadol',             'block', 'medication'),
  ('prescription',         'flag',  'medication'),

  ('gun',                  'block', 'weapons'),
  ('pistol',               'block', 'weapons'),
  ('taser',                'flag',  'weapons'),
  ('knife',                'flag',  'weapons'),

  ('escort',               'block', 'adult'),
  ('sugar daddy',          'block', 'adult'),
  ('sugar mummy',          'block', 'adult'),
  ('nudes',                'block', 'adult'),

  ('loan',                 'flag',  'financial'),
  ('quick money',          'flag',  'financial'),
  ('forex signals',        'flag',  'financial'),
  ('investment opportunity','flag', 'financial'),
  ('crypto doubling',      'block', 'financial'),
  ('binary options',       'flag',  'financial')
on conflict (phrase) do update
  set severity = excluded.severity, category = excluded.category, is_active = true;
