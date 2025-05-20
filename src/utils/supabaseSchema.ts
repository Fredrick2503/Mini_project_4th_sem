
/**
 * Unisphere Supabase Schema - For Reference Only
 * 
 * This file outlines the database schema to be set up in Supabase.
 * You'll need to create these tables and relationships in your Supabase instance.
 * 
 * =================== SQL for Creating Tables ===================
 * 
 * -- Create profiles table (extends Supabase auth)
 * create table public.profiles (
 *   id uuid references auth.users on delete cascade not null primary key,
 *   email text not null,
 *   full_name text,
 *   role text not null default 'student' check (role in ('super_admin', 'admin', 'teacher', 'student')),
 *   google_linked boolean default false,
 *   google_refresh_token text,
 *   avatar_url text,
 *   created_at timestamp with time zone default now() not null,
 *   updated_at timestamp with time zone default now() not null
 * );
 * 
 * -- Set up Row Level Security
 * alter table public.profiles enable row level security;
 * 
 * -- Create RLS policies
 * create policy "Users can view their own profile"
 *   on profiles for select
 *   using (auth.uid() = id);
 *   ------
 * create policy "Users can update their own profile"
 *   on profiles for update
 *   using (auth.uid() = id);
 * 
 * create policy "Admins can view all profiles"
 *   on profiles for select
 *   using (
 *     exists (
 *       select 1 from profiles
 *       where profiles.id = auth.uid()
 *       and (profiles.role = 'super_admin' or profiles.role = 'admin')
 *     )
 *   );
 *   
 * create policy "Super admins can update all profiles"
 *   on profiles for update
 *   using (
 *     exists (
 *       select 1 from profiles
 *       where profiles.id = auth.uid()
 *       and profiles.role = 'super_admin'
 *     )
 *   );
 * 
 * -- Create courses table
 * create table public.courses (
 *   id uuid default uuid_generate_v4() primary key,
 *   title text not null,
 *   description text,
 *   thumbnail_url text,
 *   google_course_id text,
 *   created_by uuid references public.profiles(id) not null,
 *   created_at timestamp with time zone default now() not null,
 *   updated_at timestamp with time zone default now() not null
 * );
 * 
 * -- Set up Row Level Security for courses
 * alter table public.courses enable row level security;
 * 
 * -- Create course_members junction table
 * create table public.course_members (
 *   id uuid default uuid_generate_v4() primary key,
 *   course_id uuid references public.courses(id) on delete cascade not null,
 *   user_id uuid references public.profiles(id) on delete cascade not null,
 *   role text not null default 'student' check (role in ('teacher', 'student')),
 *   created_at timestamp with time zone default now() not null,
 *   unique(course_id, user_id)
 * );
 * 
 * -- Set up Row Level Security for course_members
 * alter table public.course_members enable row level security;
 * 
 * -- Create course_materials table
 * create table public.course_materials (
 *   id uuid default uuid_generate_v4() primary key,
 *   course_id uuid references public.courses(id) on delete cascade not null,
 *   title text not null,
 *   description text,
 *   content_type text not null check (content_type in ('document', 'video', 'link', 'assignment')),
 *   content_url text not null,
 *   google_material_id text,
 *   created_by uuid references public.profiles(id) not null,
 *   created_at timestamp with time zone default now() not null,
 *   updated_at timestamp with time zone default now() not null
 * );
 * 
 * -- Set up Row Level Security for course_materials
 * alter table public.course_materials enable row level security;
 * 
 * =================== End of SQL ===================
 */

// This file is just for reference and doesn't export anything
export {};
