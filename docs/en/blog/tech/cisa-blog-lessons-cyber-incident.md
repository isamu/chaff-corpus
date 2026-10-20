Blog

# Lessons from CISA’s Cyber Incident

Released

July 09, 2026

By Preston Werntz, Acting Chief Information Officer; Brad Libbey, Acting Chief Information Security Officer

Related topics:

Sharing experiences from incident response activities help other organizations learn from such experiences and enables them to take necessary precautions to prevent similar incidents from happening in their environments. For years, CISA has said this type of information exchange is critical to identifying trends and contributing to broader national awareness. Now, it is our turn.

On Friday, May 15, CISA began an internal incident response when an investigative reporter inquired about internal CISA Amazon AWS GovCloud Keys and other information being made available in a public repository. The reporter received this information from a security researcher whose company continuously scans public code repositories.

## Incident Response

Within moments of receiving this information, CISA’s Office of the Chief Information Officer (OCIO) took swift and comprehensive action to mitigate any exposure to CISA’s cloud resources and code repositories.

Stop the Bleeding. CISA immediately and quickly worked to eliminate public exposure and prevent any further harm.

- The reported public repository was taken offline and a copy was saved for later analysis. This repository was not part of CISA’s official GitHub but rather was a personal repository owned by a contractor.
- CISA’s development environment was taken offline and associated credentials were reset.
- The individual who exposed the keys had their system access revoked.

Understand Scope. By analyzing the copy of the public repository and associated cybersecurity telemetry, CISA found that:

- The individual had uploaded copies of a CISA build and deployment repository to their personal GitHub account for the purpose of creating cloud infrastructure autonomously. This repository included CISA’s Infrastructure As Code and build code.
- Additionally, the individual copied both admin and build credentials into their public repository.

Assess Impact. During the forensic investigation, CISA analysis of the log files determined that:

- Leaked credentials were not used outside of CISA ‘s environments.
- No customer or mission data was exposed.

Corrective Actions. CISA swiftly implemented appropriate measures:

- All credentials across all the environments where the individual was an administrator were rotated, not just the exposed credentials.
- CISA tuned the allow and deny lists for its code repositories.
- CISA limited user ability to upload to public code repositories.

After completion of these actions, CISA’s development environment was brought back online.

## Reflection

Following an incident, it is important to conduct a “hot wash” and prepare an after-action report to reinforce effective practices and identify areas for growth.

### What Worked Well

- Take External Reporting Seriously. It is important to take cybersecurity tips and external reporting seriously. In this instance, a security researcher, through an investigative reporter, notified CISA and continued to share information with the agency throughout the incident. We are thankful for their collaboration.
- Adopt Zero Trust Principles. This incident highlighted the effectiveness of applying granular Zero Trust principles to not only production systems but to development environments as well. Maintaining strong visibility and alerting across all environments was key to CISA’s successful incident response and for detecting any future unusual activity early.
- Enhance Logging Capabilities. CISA’s SOC had the logs necessary to successfully investigate the incident. Furthermore, continuous improvement of logging capabilities remains a key element of a strong security program. To that end, CISA strategically identified further logging opportunities while conducting the incident response and has since implemented those additions to enhance visibility.

### What Can Be Strengthened

- Tighten Controls on Public Repositories. CISA users had the ability to upload to public repositories. Following review of our Zero Trust tooling, CISA determined the best way to monitor and manage uploads was to leverage our endpoint detection and response (EDR) solution. This approach enables CISA developers to pull code from public repositories while reducing the risk of uploading intellectual property or sensitive content to public repositories.
- Monitor for Secrets in Repositories. No repository should contain secrets, yet secrets made it into CISA private repositories. CISA has since rotated all secrets and created an action plan to improve management of developer secrets and to better monitor for exposed secrets going forward.
- Build Comprehensive Playbooks. It is important to prepare playbooks for all anticipated needs to ensure a rapid response if an incident occurs. CISA had missed creating a GitHub/Cloud playbook and, therefore, had to spend time building one during the early stages of the incident. CISA also encourages organizations to fine tune playbooks following any response, which CISA is practicing in this case.
- Simplify Incident Reporting Channels. Clear and distinct reporting channels are essential to ensure that incidents affecting the organization itself are handled differently from those involving its products or customers. In CISA’s case, these channels were not well defined, leading the security researcher to try multiple avenues – including emailing the contractor, submitting through CISA’s vulnerability disclosure platform (which is intended for vulnerabilities impacting the broader cybersecurity community), and ultimately involving a reporter. To reduce ambiguity, CISA is refining its reporting channels to make them easier and faster for researchers to use. Additionally, while many researchers rely on the security.txt file, organizations can ensure clarity by publishing reporting instructions in multiple prominent locations.
- Bolster Development Environment Guardrails. A best practice for organizations is to consolidate developer environments, thereby ensuring consistent security controls, streamlining oversight, and reducing risk of unmanaged tooling. CISA had been advancing consolidation efforts when the incident happened, which affirmed that such guardrails are needed for strong development environment security.
- EnsureCryptographic Key Readiness. Cryptographic key agility is an often overlooked yet vital element of cybersecurity. The complexity of CISA’s systems and interconnections with federal and industry partners caused CISA’s key rotation to take longer than anticipated. Drawing on this experience, CISA encourages others to maintain mature and well-tested key-management capabilities.

## Moving Forward

It is not a matter of “if”, but “when” a cybersecurity incident will happen to your organization. It is important to the broader cybersecurity community that we address these matters openly to strengthen trust and foster transparency. Such transparency unlocks opportunities for learning that will enhance not only CISA’s security posture but that of other organizations as well.

CISA shares our incident response experience and key findings in hopes that they will be useful to executives, leaders, and network defenders when assessing and strengthening their environments.
