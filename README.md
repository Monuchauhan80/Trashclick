# TrashClick

A waste reporting application built with React, TypeScript, and Supabase. Report and track waste in your community to help keep it clean.

## Features

- User authentication (login, registration, profile management)
- Interactive map to view waste reports
- Waste reporting form with location selection
- Image upload for waste reports
- Theme switching (light/dark mode)
- Mobile responsive design

## Setup Instructions

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Supabase account

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Create the following tables in your Supabase database:

**waste_reports table:**
```sql
create table waste_reports (
  id uuid not null default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  location jsonb not null,
  address text,
  waste_type text not null,
  urgency_level text not null,
  image_urls text[],
  user_id uuid references auth.users(id),
  status text not null default 'reported',
  reported_at timestamp with time zone default now()
);

-- Enable RLS
alter table waste_reports enable row level security;

-- Create policies
create policy "Users can view all reports" 
on waste_reports for select 
to authenticated, anon
using (true);

create policy "Users can insert their own reports" 
on waste_reports for insert 
to authenticated 
with check (auth.uid() = user_id);

create policy "Users can update their own reports" 
on waste_reports for update 
to authenticated 
using (auth.uid() = user_id);
```

3. Set up storage buckets:

- Create a bucket named `waste-images`
- Set the bucket to public
- Add appropriate RLS policies to allow users to upload and view images

### Application Setup

1. Clone this repository:
```
git clone https://github.com/yourusername/trashclick.git
cd trashclick
```

2. Install dependencies:
```
npm install
```

3. Create a `.env` file in the root directory with your Supabase credentials:
```
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

4. Start the development server:
```
npm start
```

## Deployment

This app can be deployed to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

1. Build the production version:
```
npm run build
```

2. Deploy the build folder to your hosting service of choice.

## Technologies Used

- React 18
- TypeScript
- Supabase (Authentication, Database, Storage)
- React Router
- Google Maps API
- CSS Variables for theming

## License

MIT 