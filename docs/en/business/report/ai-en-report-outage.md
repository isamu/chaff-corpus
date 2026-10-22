# Website outage, October 21: what happened

**Short version:** Our website was down for about an hour and a quarter yesterday afternoon, from 2:10 to 3:25 p.m., because the SSL certificate expired and nobody caught it in time. It's fixed, and we're putting a couple of things in place so it doesn't happen again.

## What happened

At 2:10 p.m. the certificate for our main domain expired. From that point on, anyone visiting the site got a full-page browser warning saying the connection wasn't secure. Most people (sensibly) didn't click through, so for practical purposes the site was down. The checkout page and the customer login were affected too.

We found out at about 2:40, when a customer emailed support with a screenshot of the warning. Our uptime monitor didn't flag anything, because it only checks whether the server responds, and the server was responding just fine.

Once we knew what was going on, the fix itself was quick. Priya renewed the certificate and deployed it, and the site was back to normal at 3:25.

## Why it happened

The certificate was supposed to renew automatically. It turns out the auto-renewal had been failing quietly since we moved hosting in August. The renewal job was still pointing at the old server, so every attempt failed, and the failure emails were going to an address nobody checks anymore.

So it wasn't one mistake so much as a few small gaps lining up: a setting that didn't get updated during the move, alerts going to the wrong inbox, and a monitor that wasn't looking for this kind of problem.

## Impact

- About 75 minutes where the site was effectively unreachable for most visitors
- Roughly 30 minutes of that before we knew about it
- We estimate around 40 orders didn't go through during that window, based on a normal Tuesday afternoon
- A handful of support emails, all answered by end of day

## What we're changing

- **Auto-renewal is fixed** and pointed at the new server. Priya tested it end to end this morning.
- **Renewal alerts now go to the shared ops inbox** instead of one person's old address.
- **We added a certificate check to our monitoring**, which will warn us 14 days before any certificate expires.
- **Hosting migration checklist:** we're adding "check certificate renewal" to it, so the next move doesn't trip over the same thing.

Thanks to everyone who jumped in yesterday, and to the customer who sent the screenshot. If you have questions or think we've missed something, let me know.
