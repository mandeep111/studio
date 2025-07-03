# Problem2Profit: The Online Shark Tank

## Why Problem2Profit Exists (And Why You Should Care)

Let’s be honest. We've all had that "what if" idea. But then what? You write it down, forget about it, and go back to scrolling.

**Enter Problem2Profit.**

Think of it as Shark Tank, but online, and with fewer judgments. It’s a secure online marketplace where anyone can submit a real-world problem, pitch a solution, list an existing business, or throw a random idea into the ring for investors to see.

---

## Core Features

Our platform is built for innovators, entrepreneurs, and investors.

-   **Problem & Solution Marketplace**: The heart of the platform. Submit challenges and pitch solutions. Your "what ifs" become "why nots."
-   **Business & Idea Hub**: Already have a running business? List it to seek growth funding. Have a half-baked idea? Throw it out there for the community to see.
-   **AI-Powered Matchmaking**: Investors can describe their investment thesis, and our AI suggests high-potential problem/solution creator pairings, saving you from recycled pitches.
-   **Structured & Secure Deal-Making**: Start a deal to open a private chat room. Share protected attachments and negotiate terms securely. You control the pace and the pitch.
-   **Reputation System**: Earn points for creating popular content and participating actively. A strong reputation signals credibility to investors.

---

## Technology Stack

-   **Framework**: [Next.js](https://nextjs.org/) (with App Router)
-   **Database**: [Cloud Firestore](https://firebase.google.com/docs/firestore)
-   **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
-   **Generative AI**: [Google's Gemini model via Genkit](https://firebase.google.com/docs/genkit)
-   **Payments**: [Stripe](https://stripe.com/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)

---

## Local Development Setup

### 1. Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (version 20 or later) and npm installed.

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

1.  Create a new Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2.  Enable Firestore, Firebase Authentication (with Email/Password and Google providers), and Firebase Storage.
3.  In your project's settings, create a new Web App and copy the `firebaseConfig` object.
4.  Create `.env.local` by copying `.env` and paste your credentials.

    ```
    NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
    # ... and so on
    ```

### 4. Seed the Database

Run the seed script to populate your Firestore database with sample data.

```bash
npm run db:seed
```

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002).
