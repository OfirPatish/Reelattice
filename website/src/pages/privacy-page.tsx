import { LegalDocumentLayout } from "@/components/legal-document-layout";
import { CONTACT_URL, OPERATOR_NAME } from "@/lib/legal";

export const PrivacyPage = () => (
  <LegalDocumentLayout title="Privacy Policy">
    <section>
      <h2>Overview</h2>
      <p>
        Reelattice is designed to be local-first. This policy describes how the Reelattice desktop
        application, this website, and related download flows handle information. It applies to{" "}
        {OPERATOR_NAME} (&quot;we&quot;, &quot;us&quot;) as the operator of Reelattice.
      </p>
    </section>

    <section>
      <h2>Reelattice desktop application</h2>
      <ul>
        <li>
          Footage, metadata, tags, notes, and cases are stored on your computer in folders you
          control (by default under Documents/Reelattice and your user AppData directory).
        </li>
        <li>
          We do not operate a Reelattice account system, cloud sync, or telemetry pipeline that
          uploads your library to us.
        </li>
        <li>
          Software updates are fetched from GitHub Releases when you check for updates or on startup
          (as configured in the app). That request goes to GitHub, not to a Reelattice server we
          operate.
        </li>
        <li>
          Grid export and thumbnails may invoke FFmpeg locally on your machine. No encode is sent to
          us.
        </li>
      </ul>
    </section>

    <section>
      <h2>This website</h2>
      <p>
        The marketing site is a static front end hosted on Vercel. We do not use first-party
        analytics, advertising pixels, or newsletter forms on this site.
      </p>
      <ul>
        <li>
          Vercel and other infrastructure providers may automatically log standard connection data
          (such as IP address, user agent, and request time) for security and delivery. See{" "}
          <a href="https://vercel.com/legal/privacy-policy" rel="noopener noreferrer" target="_blank">
            Vercel&apos;s privacy policy
          </a>
          .
        </li>
        <li>
          Fonts are loaded from Google Fonts when you visit the site; Google may receive your IP
          address as part of that request.
        </li>
        <li>
          The <code>/download</code> page requests release metadata from GitHub&apos;s public API to
          locate the latest installer. GitHub may log that request under its own policies.
        </li>
      </ul>
      <p>We do not set marketing or tracking cookies on this website.</p>
    </section>

    <section>
      <h2>What we do not collect</h2>
      <p>
        We do not ask for your name, email, or payment details to use the free desktop app or this
        website. We do not receive your Tesla footage, GPS traces, or event notes unless you
        voluntarily send them to us (for example, in a support issue on GitHub).
      </p>
    </section>

    <section>
      <h2>Children</h2>
      <p>
        Reelattice is not directed at children under 13. We do not knowingly collect personal
        information from children.
      </p>
    </section>

    <section>
      <h2>Changes</h2>
      <p>
        We may update this policy by posting a revised version on this page with a new &quot;Last
        updated&quot; date. Material changes will be reflected here; continued use after changes
        constitutes acceptance of the updated policy.
      </p>
    </section>

    <section>
      <h2>Contact</h2>
      <p>
        Questions about privacy:{" "}
        <a href={CONTACT_URL} rel="noopener noreferrer" target="_blank">GitHub Issues</a> on the
        Reelattice repository.
      </p>
    </section>
  </LegalDocumentLayout>
);
