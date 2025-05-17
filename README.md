# TrashClick - Community Reporting Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TrashClick is a web application designed to empower communities to report environmental issues like improperly disposed trash and facilitate their resolution by connecting reporters with relevant municipal departments.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Cloning the Repository](#cloning-the-repository)
  - [Installation](#installation)
  - [Supabase Setup](#supabase-setup)
  - [Environment Variables](#environment-variables)
  - [Running the Development Server](#running-the-development-server)
- [Key Functionality](#key-functionality)
  - [Initial Admin Setup](#initial-admin-setup)
  - [User Roles](#user-roles)
  - [Reporting Issues](#reporting-issues)
  - [Managing Reports](#managing-reports)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

-   **User Authentication:** Secure user registration, login, and session management via Supabase Auth.
-   **Issue Reporting:** Simple interface for users to submit reports including description, location (manual input or map selection), and optional image uploads.
-   **Interactive Map:** Integrated map (`MapPicker` using MapLibre GL JS and Geoapify) for precise location selection and visualization.
-   **Dashboard Views:**
    -   **User Dashboard:** View personal report history and status.
    -   **Admin Dashboard:** Overview of all reports, batch status updates, report assignment to municipalities, admin user management (invites).
    -   **Municipality/Department Dashboard:** View reports assigned to the specific department, manage members (future scope).
-   **Role-Based Access Control:** Distinct interfaces and capabilities for regular users, administrators, and municipality users.
-   **Municipality Management:** Admins can define municipalities/departments; users can create/join municipalities.
-   **Status Tracking:** Reports progress through statuses (Pending, In Progress, Resolved, Rejected).
-   **Notifications:** User feedback via toast notifications for actions and errors.
-   **Responsive Design:** Adapts to various screen sizes using Tailwind CSS.
-   **Admin Setup:** Secure initial setup process for the first administrator when none exist.

## Tech Stack

-   **Framework:** Next.js (App Router)
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **UI Components:** Shadcn UI
-   **State Management:** React Hooks (useState, useEffect, useContext)
-   **Backend & Database:** Supabase (PostgreSQL, Auth, Storage)
-   **Mapping:** MapLibre GL JS, Geoapify (for geocoding/API key)
-   **Icons:** Lucide React
-   **Date Formatting:** date-fns

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

-   Node.js (v18 or later recommended)
-   npm, yarn, or pnpm
-   A Supabase account (Free tier is sufficient)
-   A Geoapify API Key (Free tier available) for map functionality

### Cloning the Repository

```bash
git clone <your-repository-url>
cd trash-click
```

### Installation

Install project dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Supabase Setup

1.  **Create a Supabase Project:** Go to [supabase.com](https://supabase.com/) and create a new project.
2.  **Database Schema:** Navigate to the `SQL Editor` in your Supabase project dashboard. You will need the following tables. You can use the Supabase GUI or run SQL scripts.
    *   `profiles`: Stores user profile information, linked to `auth.users`. Needs columns like `id` (UUID, foreign key to `auth.users`), `email`, `full_name`, `role` (e.g., 'user', 'admin'), `is_admin` (boolean), `municipality_id` (UUID, nullable, foreign key to `municipalities`).
    *   `complaints` (or `reports`): Stores report details. Needs columns like `id` (UUID), `user_id` (UUID, nullable, foreign key to `profiles`), `description` (text), `location` (text), `latitude` (numeric/text), `longitude` (numeric/text), `image_url` (text, nullable), `status` (enum/text: 'pending', 'in_progress', 'resolved', 'rejected'), `created_at`, `updated_at`, `municipality_id` (UUID, nullable, foreign key to `municipalities`).
    *   `municipalities`: Stores department/municipality information. Needs columns like `id` (UUID), `name` (text), `created_at`.
    *   `municipalities_users`: Links users to municipalities (many-to-many). Needs columns like `id` (UUID), `user_id` (UUID, foreign key to `profiles`), `municipality_id` (UUID, foreign key to `municipalities`), `role` (enum/text: e.g., 'member', 'admin').
    *   *(Optional but Recommended)*: Set up Row Level Security (RLS) policies on your tables to control data access. The application logic partially relies on RLS for security.
3.  **API Keys:** In your Supabase project settings (`Project Settings` > `API`), find your `Project URL` and `anon` (public) key.

### Environment Variables

Create a `.env.local` file in the root of the project and add the following variables:

```plaintext
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
GEOAPIFY_API_KEY=YOUR_GEOAPIFY_API_KEY

# Optional: Key for the initial admin setup page in production environments
# ADMIN_SETUP_KEY=your_secure_setup_key 
```

Replace the placeholder values with your actual keys.

### Running the Development Server

Start the Next.js development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Key Functionality

### Initial Admin Setup

If no users with the 'admin' role exist in the `profiles` table:

1.  Navigate to `/admin/setup`.
2.  Log in or create a new account if prompted.
3.  If an `ADMIN_SETUP_KEY` is configured in your environment (recommended for production), enter it.
4.  Click the "Make Me Admin" button. This will update your profile's role to 'admin'.

### User Roles

-   **Regular User:** Can register, log in, submit reports, view their own reports, and potentially join/create a municipality.
-   **Municipality User:** Belongs to a specific municipality/department. Can view reports assigned to their department (via `/department/dashboard`).
-   **Admin:** Has full access. Can view all reports, manage report statuses and assignments, invite other admins (via `/admin/invite`), manage municipalities, and access the admin dashboard (`/admin/dashboard`).

### Reporting Issues

1.  Log in to your account.
2.  Navigate to `/reports/new`.
3.  Fill in the description.
4.  Provide the location either by typing or selecting on the map.
5.  Optionally upload an image.
6.  Select the relevant category/department (municipality).
7.  Submit the report.

### Managing Reports

-   **Users:** View their submitted reports on the `/reports` page.
-   **Municipality Users:** View reports assigned to their department on the `/department/dashboard` page.
-   **Admins:** View all reports on the `/admin/dashboard` page. Can filter by status, select multiple reports, and perform batch updates (change status, assign to municipality). Can also view individual report details by clicking on them.

## Project Structure

```
/
├── app/                  # Next.js App Router Pages
│   ├── (auth)/           # Authentication routes (login, register)
│   ├── admin/            # Admin-specific pages (dashboard, setup, invite)
│   ├── dashboard/        # User dashboard
│   ├── department/       # Municipality/Department user dashboard
│   ├── municipality/     # Municipality management page
│   ├── profile/          # User profile page
│   ├── reports/          # Report listing, details, and creation pages
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # Shared React components
│   ├── ui/               # Shadcn UI components
│   ├── MapPicker.tsx     # Map component
│   ├── Navbar.tsx        # Navigation bar
│   └── StatusUpdateModal.tsx # Modal for report status updates
├── contexts/             # React Context providers (e.g., Supabase)
├── lib/                  # Utility functions & libraries config
│   ├── supabase.ts       # Supabase client setup
│   └── utils.ts          # General utility functions (e.g., cn)
├── public/               # Static assets (images, etc.)
├── types/                # TypeScript definitions
│   └── supabase.ts       # Auto-generated Supabase types
├── .env.local.example    # Example environment variables
├── next.config.js        # Next.js configuration
├── package.json          # Project dependencies and scripts
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs, feature requests, or improvements.

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (assuming MIT, add a LICENSE file if needed). 