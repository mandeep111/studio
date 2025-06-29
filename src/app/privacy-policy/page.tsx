import Header from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex-1 py-12 md:py-24">
        <div className="container mx-auto max-w-4xl px-4 md:px-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-muted-foreground prose dark:prose-invert">
              <p>Last updated: {new Date().toLocaleDateString()}</p>

              <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
              <p>
                Welcome to Problem2Profit ("we", "our", "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
              </p>

              <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
              <p>We may collect information about you in a variety of ways. The information we may collect on the platform includes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and expertise, that you voluntarily give to us when you register with the platform.</li>
                <li><strong>User-Generated Content:</strong> We collect the problems, solutions, ideas, businesses, and other content you post to the platform.</li>
                <li><strong>Financial Data:</strong> We may collect data related to your payments, such as credit card information, when you purchase a premium membership or start a deal. All payment data is stored by our payment processor, Stripe, and you should review their privacy policy. We do not store financial information on our servers.</li>
                <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the platform, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the platform.</li>
              </ul>

              <h2 className="text-xl font-semibold text-foreground">3. Use of Your Information</h2>
              <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the platform to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Create and manage your account.</li>
                <li>Process your transactions and deliver the services you have requested.</li>
                <li>Facilitate communication between users.</li>
                <li>Monitor and analyze usage and trends to improve your experience with the platform.</li>
                <li>Notify you of updates to the platform.</li>
                <li>Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.</li>
              </ul>
              
              <h2 className="text-xl font-semibold text-foreground">4. Disclosure of Your Information</h2>
              <p>We do not share your personal information with third parties except as described in this privacy policy. We may share information we have collected about you in certain situations:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>With Other Users:</strong> When you post content, your name, expertise, and other profile information will be visible to other users of the platform.</li>
                <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.</li>
              </ul>

              <h2 className="text-xl font-semibold text-foreground">5. Security of Your Information</h2>
              <p>
                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
