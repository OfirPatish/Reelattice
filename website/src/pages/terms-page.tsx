import { LegalDocumentLayout } from "@/components/legal-document-layout";
import { CONTACT_URL, OPERATOR_NAME } from "@/lib/legal";

export const TermsPage = () => (
  <LegalDocumentLayout title="Terms of Use">
    <section>
      <h2>Agreement</h2>
      <p>
        By downloading, installing, or using Reelattice, or by using this website, you agree to
        these Terms of Use. If you do not agree, do not use the software or site. Reelattice is
        operated by {OPERATOR_NAME} (&quot;we&quot;, &quot;us&quot;).
      </p>
    </section>

    <section>
      <h2>License</h2>
      <p>
        We grant you a personal, non-exclusive, non-transferable, revocable license to install and
        use Reelattice for lawful personal or internal business purposes. You may not sell,
        sublicense, redistribute, or offer the software as a hosted service to third parties without
        our prior written permission. Source code is published for transparency; that publication does
        not grant additional rights beyond this license unless a separate license file applies.
      </p>
    </section>

    <section>
      <h2>Disclaimer of warranties</h2>
      <p>
        REELATTICE AND THIS WEBSITE ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;
        WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT
        LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE,
        AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SOFTWARE WILL BE ERROR-FREE, UNINTERRUPTED,
        SECURE, OR THAT IT WILL PRESERVE OR PROCESS YOUR FOOTAGE WITHOUT LOSS OR CORRUPTION.
      </p>
    </section>

    <section>
      <h2>Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, {OPERATOR_NAME.toUpperCase()} AND
        CONTRIBUTORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
        EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE
        LOSSES, ARISING FROM OR RELATED TO YOUR USE OF OR INABILITY TO USE REELATTICE OR THIS
        WEBSITE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
      </p>
      <p>
        OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF THESE TERMS OR YOUR USE OF REELATTICE SHALL
        NOT EXCEED THE AMOUNT YOU PAID US FOR THE SOFTWARE IN THE TWELVE (12) MONTHS BEFORE THE
        CLAIM (OR USD $0 IF THE SOFTWARE WAS PROVIDED FREE OF CHARGE).
      </p>
    </section>

    <section>
      <h2>Your responsibilities</h2>
      <ul>
        <li>
          You are solely responsible for how you obtain, store, review, export, and share dashcam or
          sentry footage. Laws on recording, consent, and data protection vary by country and region.
        </li>
        <li>
          You must comply with applicable traffic, privacy, employment, and insurance rules when
          using footage from your vehicle or others&apos; vehicles.
        </li>
        <li>
          You are responsible for maintaining backups of data you care about. Deleting events in
          Reelattice removes local copies we helped organize.
        </li>
        <li>
          Do not use Reelattice to infringe intellectual property, harass others, or violate law.
        </li>
      </ul>
    </section>

    <section>
      <h2>Third parties</h2>
      <ul>
        <li>
          <strong>Tesla:</strong> Reelattice is not affiliated with, endorsed by, or sponsored by
          Tesla, Inc. Tesla, TeslaCam, and related marks are trademarks of Tesla, Inc.
        </li>
        <li>
          <strong>GitHub:</strong> Updates and installers may be delivered via GitHub Releases,
          subject to GitHub&apos;s terms.
        </li>
        <li>
          <strong>FFmpeg:</strong> Grid export may use FFmpeg, which is licensed under its own terms
          (see{" "}
          <a href="https://ffmpeg.org/legal.html" rel="noopener noreferrer" target="_blank">
            ffmpeg.org/legal.html
          </a>
          ). FFmpeg is invoked locally on your device.
        </li>
        <li>
          <strong>Hosting:</strong> This site is served via Vercel; their terms apply to hosting
          infrastructure.
        </li>
      </ul>
    </section>

    <section>
      <h2>Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless {OPERATOR_NAME} from claims, damages, and expenses
        (including reasonable legal fees) arising from your use of Reelattice, your footage, or your
        violation of these Terms or applicable law.
      </p>
    </section>

    <section>
      <h2>Changes</h2>
      <p>
        We may modify these Terms by posting an updated version on this page. The &quot;Last
        updated&quot; date will change when we do. Your continued use after changes constitutes
        acceptance.
      </p>
    </section>

    <section>
      <h2>Governing law</h2>
      <p>
        These Terms are governed by the laws applicable in your place of residence or operation,
        except where mandatory consumer protections in your jurisdiction require otherwise. Where
        permitted, you agree that courts in your jurisdiction shall have exclusive venue for
        disputes relating to these Terms.
      </p>
    </section>

    <section>
      <h2>Contact</h2>
      <p>
        Questions about these Terms:{" "}
        <a href={CONTACT_URL} rel="noopener noreferrer" target="_blank">GitHub Issues</a>.
      </p>
    </section>
  </LegalDocumentLayout>
);
