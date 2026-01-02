-- Copy dan paste script ini di SQL Editor Supabase kamu

-- Tambahkan kolom 'steps' ke tabel 'activities'
alter table activities 
add column steps int4 default 0;

-- Selesai! Hanya satu baris ini saja.
