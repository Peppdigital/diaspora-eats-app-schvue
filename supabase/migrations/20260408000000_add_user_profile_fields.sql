alter table user_profile
  add column if not exists default_location_city  text,
  add column if not exists default_location_state text,
  add column if not exists diaspora_segment        text[],
  add column if not exists favorite_cuisines       text[];
