# TriSolve: The Innovation Marketplace

TriSolve is a dynamic web platform designed to bridge the gap between real-world problems, innovative solutions, and strategic investors. It functions as a marketplace of ideas, fostering a community where problem-solvers, solution-crafters, and financial backers can connect, collaborate, and create value.

## Key Features

-   **Problem & Solution Marketplace**: Users can submit well-defined problems and propose creative solutions, creating a public repository of challenges and innovations.
-   **Investor Hub**: Investors gain access to a curated list of problems and solutions, with tools to identify promising ventures.
-   **Reputation System**: A points and upvote system helps establish credibility. Users earn points for creating popular content, making it easy to identify key contributors.
-   **AI-Powered Matchmaking**: Investors can leverage a generative AI tool that suggests high-potential problem/solution creator pairings based on expertise, reputation, and investor criteria.
-   **Admin Dashboard**: A comprehensive dashboard for administrators to manage users, moderate content, and oversee platform activity.

## User Roles

-   **User**: The core of the community. Users can submit problems, propose solutions, and post "random ideas." They earn points for their contributions.
-   **Investor**: A premium role with access to advanced features, including the AI Matchmaking tool and the ability to initiate "deals" (private chats) with creators.
-   **Admin**: Has full oversight of the platform, with the ability to manage all users and content. The first user to sign up for the platform is automatically designated as an Admin.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (with App Router)
-   **Database**: [Cloud Firestore](https://firebase.google.com/docs/firestore)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
-   **AI**: [Google's Gemini model via Genkit](https://firebase.google.com/docs/genkit)
-   **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)

## Local Development Setup

Follow these steps to get your local development environment set up and running.

### 1. Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (version 20 or later) and npm installed on your machine.

### 2. Install Dependencies

Install the project dependencies using npm:

```bash
npm install
```

### 3. Set Up Environment Variables

This project connects to Firebase. You'll need to create a local environment file to store your Firebase project credentials.

1.  Create a new Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2.  In your project's settings, create a new Web App.
3.  Copy the `firebaseConfig` object values.
4.  Create a file named `.env.local` in the root of your project by copying the `.env` template file.
5.  Paste your credentials into `.env.local`. It should look like this:

    ```
    NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123...
    NEXT_PUBLIC_FIREBASE_APP_ID=1:123...:web:...
    ```

### 4. Seed the Database

To get started, you need to populate your Firestore database with some initial data. This script will create the necessary collections (`users`, `problems`, etc.) and add some sample content.

Run the following command:

```bash
npm run db:seed
```

### 5. Run the Development Server

Now you can start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002).
