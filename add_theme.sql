-- הוסף עמודה לתמה ויזואלית של המשחק
-- ברירת מחדל: עיצוב נוכחי ('current')
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'current';
