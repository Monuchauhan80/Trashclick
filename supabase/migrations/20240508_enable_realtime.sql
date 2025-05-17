-- Enable real-time for the complaints table
alter publication supabase_realtime add table complaints;

-- Create an index on user_id for better performance
create index if not exists idx_complaints_user_id on complaints(user_id); 