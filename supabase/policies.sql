-- Each signed-in user can only see and change their own rows.
do $$ declare t text; begin
  foreach t in array array['members','medicines','prescriptions','reports','visits','messages'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "own rows" on %I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
-- Private file storage: users access only their own folder.
create policy "own files read" on storage.objects for select to authenticated using (bucket_id = 'records' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files write" on storage.objects for insert to authenticated with check (bucket_id = 'records' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files delete" on storage.objects for delete to authenticated using (bucket_id = 'records' and (storage.foldername(name))[1] = auth.uid()::text);
