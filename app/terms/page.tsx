import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="container fade-in" style={{ padding: '40px 24px', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '24px', color: 'var(--gold-400)' }}>Terms of Service</h1>
      
      <div className="card">
        <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
          <strong>Last Updated:</strong> May 18, 2026
        </p>

        <h2 style={{ fontSize: '20px', marginBottom: '12px', marginTop: '24px', color: 'var(--green-200)' }}>1. Acceptance of Terms</h2>
        <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
          By accessing and using this application, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use the application.
        </p>

        <h2 style={{ fontSize: '20px', marginBottom: '12px', marginTop: '24px', color: 'var(--green-200)' }}>2. No Affiliation with Burr and Burton Academy</h2>
        <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
          You acknowledge that this service is an independent project and is <strong>not affiliated with, associated with, authorized by, endorsed by, or in any way officially connected to Burr and Burton Academy</strong>.
        </p>

        <h2 style={{ fontSize: '20px', marginBottom: '12px', marginTop: '24px', color: 'var(--green-200)' }}>3. Prohibited Conduct and Information Sharing</h2>
        <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
          Users are expected to maintain a respectful and secure environment. <strong>Students are expressly forbidden from sharing any information obtained from this website with other people.</strong> This includes sharing other students' schedules, class rosters, or personal details outside of this platform. This rule is strictly enforced to maintain FERPA compliance and protect student privacy. Violations will result in account termination.
        </p>

        <h2 style={{ fontSize: '20px', marginBottom: '12px', marginTop: '24px', color: 'var(--green-200)' }}>4. Termination</h2>
        <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
          We reserve the right to terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms of Service.
        </p>

        <div style={{ marginTop: '32px' }}>
          <Link href="/" className="btn btn-ghost">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
