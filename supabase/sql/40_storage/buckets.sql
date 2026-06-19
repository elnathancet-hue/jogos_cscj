/*
 * ===========================================================================
 * STORAGE — bucket de mídia pública
 * ===========================================================================
 * Bucket 'media' (público): capas de jogo e logos de organização. Leitura
 * pública (são imagens exibidas); escrita por usuários autenticados, que
 * gerenciam os próprios arquivos (owner = auth.uid()).
 * ===========================================================================
 */

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Leitura pública.
drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects
  for select to public
  using (bucket_id = 'media');

-- Upload por autenticados (dono = quem subiu).
drop policy if exists media_insert on storage.objects;
create policy media_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and owner = (select auth.uid()));

drop policy if exists media_update on storage.objects;
create policy media_update on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and owner = (select auth.uid()))
  with check (bucket_id = 'media' and owner = (select auth.uid()));

drop policy if exists media_delete on storage.objects;
create policy media_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and owner = (select auth.uid()));
