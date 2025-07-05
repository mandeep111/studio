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

## Environment Setup (Dev vs. Prod)

To ensure your development and testing do not affect live user data, it is crucial to use two separate Firebase projects: one for **development** and one for **production**. Your production project ID is `trisolve-2c9cf`.

### 1. Create a Development Firebase Project

If you haven't already, create a new Firebase project to be used exclusively for development.

-   Go to the [Firebase Console](https://console.firebase.google.com/).
-   Click "Add project" and follow the steps.
-   For **each** project (`trisolve-2c9cf` and your new dev project), you need to:
    -   Enable Firestore.
    -   Enable Firebase Authentication (with Email/Password and Google providers).
    -   Enable Firebase Storage.
    -   In your project's settings, create a new Web App to get the `firebaseConfig` object.

### 2. Local Development Setup (`.env.local`)

Your local environment should **always** point to your **Development Project**.

1.  **Prerequisites**: Make sure you have [Node.js](https://nodejs.org/) (version 20 or later) and npm installed.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Create and Configure `.env.local`**:
    -   Create a file named `.env.local` in the root of your project.
    -   Use the Web App `firebaseConfig` from your **Development Project** to fill in the `NEXT_PUBLIC_` variables.
    -   Generate a new private key for your **Development Project** (Project Settings > Service Accounts > Generate new private key).
    -   Copy the entire contents of the downloaded JSON file and paste it as a single line for the `FIREBASE_SERVICE_ACCOUNT_JSON` variable.
    -   Add your Stripe **test** keys.

    Your `.env.local` should look exactly like this, but with your keys:
    ```
# Firebase client keys from your DEVELOPMENT project
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-dev-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-dev-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-dev-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...

# Firebase Admin SDK service account from your DEVELOPMENT project
FIREBASE_SERVICE_ACCOUNT_JSON='{"type": "service_account", ...}'

# Other keys
NEXT_PUBLIC_BASE_URL=http://localhost:9002
GOOGLE_API_KEY=AIza...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
```
4.  **Seed Your Development Database**:
    ```bash
    npm run db:seed
    ```
5.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    The application will be available at [http://localhost:9002](http://localhost:9002) and will be connected to your **Development Project**.

### 3. Production Deployment

When you deploy your application, you will configure the environment variables in your hosting provider's settings using the keys from your **Production Project** (`trisolve-2c9cf`). **Do not** commit your `.env.local` file to version control.