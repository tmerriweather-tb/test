# Artwork review email notifications — Netlify Forms (no Resend)

Recipient: **tmerriweather@terraboost.biz**. Configure this address in Netlify's **Forms > Submission notifications** for the form named **artwork-review-complete**. The address must belong to an active member of your Netlify team.

## Deploy and activate

1. Upload the **contents** of this ZIP to the root of the GitHub repository for your existing Netlify site. Include `netlify/functions/review.cjs`, `review-notification-form.html`, `netlify.toml`, `package.json`, `index.html`, `shared/`, and `scripts/`.
2. In the Netlify dashboard, open **Forms** and enable **Form detection** if it is disabled. Redeploy the site **after** enabling detection. Verify that **artwork-review-complete** appears in Forms.
3. Open **Forms > Submission notifications > Add notification > Email notification**. Select **artwork-review-complete** and set the recipient to **tmerriweather@terraboost.biz**. Netlify requires the recipient to be an active member of the site's Netlify team; invite that address first if necessary.
4. Remove the now-unused `RESEND_API_KEY` and `REVIEW_FROM_EMAIL` variables if present. Netlify provides `URL` automatically for deployed sites; verify the site URL is correct.
5. Open a deployed `/shared/*.html` page, submit decisions for all cards, then confirm one entry appears in **Forms > artwork-review-complete > Submissions** and the notification arrives in the mailbox. Check the Spam submissions view if a submission is missing.

## How it works

The existing Netlify Function stores individual artwork decisions in Netlify Blobs. When all cards in a shared view have Approved/Rejected decisions, the function sends **one URL-encoded form submission** to the site's statically registered `artwork-review-complete` form. Netlify Forms stores the consolidated report and (once configured in Netlify UI) sends an email notification. It does **not** require Resend, an API key, or a verified sender domain. Rejection comments and card details are included in the `report` field.

The response property `emailed` means the form submission request was accepted, **not that an email was delivered**. The UI may report `emailError` if the form request fails; retry by submitting a decision again. An incomplete review does not submit a form. The first complete review triggers the report; later changes do not generate another report.

## Important limitations

* Public shared views allow anyone with the URL to submit or alter decisions; there is no reviewer authentication.
* Netlify Forms email notifications only go to active Netlify team members. Form detection, a registered form, and a notification rule are required before email delivery works.
* Netlify spam filtering can hold a submission; review the Netlify Forms Spam section when troubleshooting.
* A successful HTTP response does not independently prove a form was registered or an email delivered; **test a full review on the live site**.
* Netlify Blobs state updates are not transactional. Simultaneous final decisions may result in duplicate or missed reports under race conditions. For compliance-critical approvals, use transactional storage and authenticated reviewers.
* The `index.html` password gate is client-side and not a secure access boundary.

All 49 shared pages and their grouped navigation, landscape PDF, HTML download, and artwork decision controls are retained. New exports continue to use the existing review endpoint.
