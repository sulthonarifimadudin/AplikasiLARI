-- Jalankan script ini jika tabel 'activities' SUDAH ADA

-- 1. Tambahkan kolom user_id (jika belum ada)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'user_id') THEN
        ALTER TABLE activities ADD COLUMN user_id uuid references auth.users default auth.uid();
    END IF;
END $$;

-- 2. Pastikan RLS nyala
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- 3. Hapus policy lama (jika ada) untuk menghindari duplikat/konflik
DROP POLICY IF EXISTS "Allow public insert" ON activities;
DROP POLICY IF EXISTS "Allow public select" ON activities;
DROP POLICY IF EXISTS "User can see own data" ON activities;
DROP POLICY IF EXISTS "User can insert own data" ON activities;

-- 4. Buat Policy Baru (Hanya user ybs yang bisa lihat/edit datanya)
CREATE POLICY "User can see own data"
  ON activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "User can insert own data"
  ON activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Berhasil update!
