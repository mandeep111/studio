import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-muted text-muted-foreground mt-auto">
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Problem2Profit Logo" width={28} height={28} />
            <span className="font-semibold text-foreground">Problem2Profit</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link href="/info" className="text-sm hover:underline underline-offset-4">
              Info & Safety
            </Link>
            <Link href="/feedback" className="text-sm hover:underline underline-offset-4">
              Feedback
            </Link>
            <Link href="/privacy-policy" className="text-sm hover:underline underline-offset-4">
              Privacy Policy
            </Link>
          </nav>
          <div className="text-sm text-center md:text-right">
            © {new Date().getFullYear()} Problem2Profit. All Rights Reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
