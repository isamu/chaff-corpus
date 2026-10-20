Blog

# Patch Smarter, Not Harder

Released

June 10, 2026

By Chris Butera, Acting Executive Assistant Director for Cybersecurity, and Dr. Jonathan Spring , Senior Technical Advisor

Related topics:

Artificial intelligence is assisting both researchers and adversaries in identifying flaws in software, vastly increasing the pace at which new vulnerabilities are discovered. Defenders are already struggling to keep up. Per Verizon’s 2026 Data Breach Investigations Report, only 26% of vulnerabilities on CISA’s Known Exploited Vulnerabilities (KEV) Catalog were fully remediated by organizations in 2025, a drop from the previous year’s 38%. The median time for full resolution rose to 43 days.

Defenders need greater clarity and speed to patch systems in today’s threat landscape. We must flip the script on patching prioritization: patch smarter, not harder.

CISA's Binding Operational Directive (BOD) 26-04, “Prioritizing Security Updates Based on Risk” presents a new framework for patching prioritization and incident management best practices. Under this directive, agencies are empowered to defer lower priority vulnerabilities and focus efforts on the areas of highest risk.

From CISA’s vantage point as the Nation’s cyber defense agency, it has become clear that the greatest risk stems from vulnerabilities displaying four characteristics:

- Public exposure,
- Ability for an attacker to fully automate exploitation,
- Whether exploitation gives an attacker full control of a system, and
- Evidence of real-world exploitation (i.e., a KEV).

Using this criteria, only the highest risk vulnerabilities must be patched within three days, while vulnerabilities presenting less risk may be remediated over longer timelines, even possibly deferred until the next system upgrade.

Some may notice that this patching framework mostly prioritizes vulnerabilities sitting at the network’s edge, which may seem to overlook the network’s core. However, in practice, CISA does not observe threat actors primarily compromising core networks through product vulnerabilities. Instead, threat actors often use exploitable configurations and valid credentials -- a technique known as living off the land (LOTL). LOTL is better addressed through other means, such as hardening system configurations, network segmentation, and phishing-resistant multi-factor authentication (MFA) enforcement.

This new approach to vulnerability prioritization has already had proven success in focusing and strengthening Federal government vulnerability management.

In an initial analysis at one large civilian agency, only 1% of vulnerability instances fall into the three-day category, with over 60% of the vulnerability instances deferred to the next system upgrade. This more aggressive tiering of vulnerabilities ensures that the most critical vulnerabilities are addressed first, and more quickly.

BOD 26-04 is a major stride toward addressing the cybersecurity risks posed by AI advancements as the cybersecurity community strives to automate and scale vulnerability management and bolster software engineering security practices to counter the evolving threat landscape.
