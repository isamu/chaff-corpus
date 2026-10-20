# NIST Finalizes Guidelines on Protecting Online Identity and Access Tokens From Misuse

September 15, 2026

## Share

- A newly finalized report can help cloud service providers and their customers better protect identity and access tokens, which are widely used when accessing online applications.
- In the hands of an adversary, tokens can be dangerous, and the publication is designed to help organizations take effective steps to avoid exposing them to attackers.
- The report authors have modified and expanded the publication in response to public feedback on the December 2025 draft version.

Credit: dee karen/Shutterstock

When you sign in to an online service like webmail, behind the scenes is often a token — a snippet of information identifying you and what online resources you are permitted to use, such as your inbox, contacts or other potentially sensitive information. Keeping these tokens safe is critical for protecting against unauthorized access, and it’s the goal of a newly finalized publication from the National Institute of Standards and Technology (NIST) and the Cybersecurity and Infrastructure Security Agency (CISA).

The publication, whose full title is Protecting Tokens and Assertions from Forgery, Theft, and Misuse (NIST IR 8587), provides implementation guidelines to help maintain the security of tokens, which are widely used in digital systems. The publication responds to NIST’s tasking in Executive Order 14306 and builds on recent updates to Special Publication 800-53, NIST’s catalog of security and privacy tools, for the purpose of enhancing the security of tokens and token management.

While the document is primarily written for federal agencies and the cloud service providers (CSPs) they work with, it can help any organization that handles identity tokens and related forms of identity assertions, said NIST Digital Identity Program Lead Ryan Galluzzo.

“This publication provides implementation considerations for protecting tokens appropriately,” said Galluzzo, one of the publication’s authors. “Anyone who is using tokens as part of their access management infrastructure can look to this for insights, whether they are in government or commercial industry.”

Many of the services we use online — from web-based email to data backup — are based in “the cloud,” which is made up of remote computer servers that require authorization to access. Tokens are a key part of the access management infrastructure at most major CSPs. They contain cryptographically protected information about a user that can be used as part of authentication. They can also enable things such as single sign-on, which allows a user to use multiple applications without having to constantly reauthenticate. If you like the convenience of single sign-on, thank a token.

Tokens are widely used in many other ways in digital infrastructure, and they are an important part of zero trust architectures. However, without proper protection, a bad actor can exploit tokens to break into sensitive systems. In one attack the report cites, foreign actors accessed agency email systems using forged tokens derived from a single stolen commercial signing key. The attackers stole more than 60,000 emails from a single agency.

The report’s intended audience is both federal agencies, which need to understand how to configure services from their CSPs appropriately, and the CSPs themselves, which need to deliver secure products to these agencies. The publication lays out a set of principles for both parties, delineating what provider and consumer organizations should do to ensure that data remains protected.

Galluzzo said the authors revised the initial draft of the publication in response to reader feedback. Among the most notable changes are:

- Guidelines regarding cryptographic key protection are now less prescriptive and more outcome-based, focusing on organizations’ overall capabilities. More advice is also included on cryptographic key usage, protection and storage.
- New high-level considerations for handling AI and migration to post-quantum cryptography (PQC) standards are now included. The publication does not offer a comprehensive set of tools for either topic. (NIST’s National Cybersecurity Center of Excellence (NCCoE) recently published a concept paper on applying identity standards and best practices to AI agents, and it has launched a PQC migration project as well.)
- New references to current and emerging standards are now included so that organizations can find different ways to achieve their desired outcomes. More options are now available for tasks such as token revocation and sharing signals around tokens.

Galluzzo highlighted the critical support NIST and CISA received from industry partners such as the Joint Cyber Defense Collaborative, which provided critical feedback.

“This document consolidates insights from across the cybersecurity community to help improve our ability to protect government data, resources and systems from the evolving threats they face today,” he said.

Information technology, Cloud computing and virtualization, Cybersecurity and privacy and Identity and access management

Released September 15, 2026

<!-- https://csrc.nist.gov/pubs/ir/8587/final https://www.whitehouse.gov/presidential-actions/2025/06/sustaining-select-efforts-to-strengthen-the-nations-cybersecurity-and-amending-executive-order-13694-and-executive-order-14144/ https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final https://www.microsoft.com/en-us/security/blog/2023/07/14/analysis-of-storm-0558-techniques-for-unauthorized-email-access/ https://nvlpubs.nist.gov/nistpubs/ir/2025/NIST.IR.8587.ipd.pdf https://www.nccoe.nist.gov/ https://www.nccoe.nist.gov/projects/software-and-ai-agent-identity-and-authorization https://www.nccoe.nist.gov/applied-cryptography/migration-to-pqc -->
