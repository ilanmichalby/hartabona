-- הוסף עמודה: האם כותבי שאלות יכולים להצטרף כשחקנים
-- ברירת מחדל: כן (true)
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS allow_contributor_join boolean NOT NULL DEFAULT true;
