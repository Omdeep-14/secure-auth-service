

CREATE TABLE Users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name text not null unique,
    email text not null,
    password_hash text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
)

