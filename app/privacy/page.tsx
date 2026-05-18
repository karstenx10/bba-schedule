import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="container fade-in" style={{ padding: '40px 24px', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '24px', color: 'var(--gold-400)' }}>Privacy Policy</h1>
      
      <div className="card">
        <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
          <strong>Last Updated:</strong> May 18, 2026
        </p>

        <h2 style={{ fontSize: '20px', marginBottom: '12px', marginTop: '24px', color: 'var(--green-200)' }}>1. Educational Privacy & FERPA Compliance</h2>
        <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
          This application is designed to be fully compliant with the Family Educational Rights and Privacy Act (FERPA). We treat all student data with the utmost security and confidentiality. Your schedule and class information are protected and only accessible to authorized users within the system.
        </p>

        <h2 style={{ fontSize: '20px', marginBottom: '12px', marginTop: '24px', color: 'var(--green-200)' }}>2. Affiliation Disclaimer</h2>
        <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
          <strong>Please note:</strong> This application is completely independent and is <strong>not affiliated with, endorsed by, or sponsored by Burr and Burton Academy</strong>. It is a tool created independently for student use.
        </p>

        <h2 style={{ fontSize: '20px', marginBottom: '12px', marginTop: '24px', color: 'var(--green-200)' }}>3. Information Sharing Restrictions</h2>
        <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
          To protect the privacy of all students, <strong>you are strictly prohibited from sharing any information found on this website with other people</strong>. This includes, but is not limited to, sharing screenshots of class rosters, schedules of other students, or any data that identifies other users. Violating this policy will result in immediate termination of your access.
        </p>

        <h2 style={{ fontSize: '20px', marginBottom: '12px', marginTop: '24px', color: 'var(--green-200)' }}>4. Data Collection</h2>
        <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
          We only collect information necessary to provide the scheduling and chat features of this application. We do not sell your personal data to third parties.
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
