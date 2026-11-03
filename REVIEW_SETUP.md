# Artwork review email notifications — Netlify Forms (no Resend)

Recipient: **tmerriweather@terraboost.biz**. Configure this address in Netlify's **Forms > Submission notifications** for the form named **artwork-review-complete**. The address must belong to an active member of your Netlify team.

## Deploy and activate

1. Upload the **contents** of this ZIP to the root of the GitHub repository for your existing Netlify site. Include `netlify/functions/review.cjs`, `review-notification-form.html`, `netlify.toml`, `package.json`, `index.html`, `shared/`, and `scripts/`.
2. In the Netlify dashboard, open **Forms** and enable **Form detection** if it is disabled. Redeploy the site **after** enabling detection. Verify that **artwork-review-complete** appears in Forms.
3. Open **Forms > Submission notifications > Add notification > Email notification**. Select **artwork-review-complete** and set the recipient to **tmerriweather@terraboost.biz**. Netlify requires the recipient to be an active member of the site's Netlify team; invite that address first if necessary.
4. **Fix for `MissingBlobsEnvironmentError` (required on your testrun03 deployment):** In Netlify, open **Project configuration > Environment variables**, and create these two **secret, server-side** variables:
   - `REVIEW_BLOBS_SITE_ID`: the site's **Project ID / Site ID** (find it under **Project configuration > General > Project details**; this is a UUID, not the `testrun03` name).
   - `REVIEW_BLOBS_TOKEN`: a **Netlify personal access token** from a Netlify user with access to this site (User settings > Applications > Personal access tokens). Treat this as a secret. Never put it in HTML, GitHub, or `netlify.toml`.
   Scope both variables to **Functions** (or All scopes) and to the **Production** deploy context. **Trigger a new deploy** after saving. The updated function explicitly passes these credentials to `@netlify/blobs`, instead of relying only on automatic runtime injection.
   - You may omit these variables on Netlify deployments where automatic Blobs configuration already works, but your reported error indicates it is not working on this site.
5. Test `https://testrun03.netlify.app/.netlify/functions/review?view=%2Fshared%2FHEB_Oct2026.html`. A healthy response contains `"decisions":{}`. If you get `BLOBS_NOT_CONFIGURED`, check both variables and redeploy. If you get a 401/403 or another 500, inspect the **review** Function logs and verify the token has site access.
6. Remove the now-unused `RESEND_API_KEY` and `REVIEW_FROM_EMAIL` variables if present. Netlify provides `URL` automatically for deployed sites; verify the site URL is correct.
7. Open a deployed `/shared/*.html` page, submit decisions for all cards, then confirm one entry appears in **Forms > artwork-review-complete > Submissions** and the notification arrives in the mailbox. Check the Spam submissions view if a submission is missing.

## How it works

The existing Netlify Function stores individual artwork decisions in Netlify Blobs. When all cards in a shared view have Approved/Rejected decisions, the function sends **one URL-encoded form submission** to the site's statically registered `artwork-review-complete` form. Netlify Forms stores the consolidated report and (once configured in Netlify UI) sends an email notification. It does **not** require Resend or a verified sender domain. This particular Netlify deployment **does** require a server-side Netlify access token for Blobs storage until automatic Blobs context is available. Rejection comments and card details are included in the `report` field.

The response property `emailed` means the form submission request was accepted, **not that an email was delivered**. The UI may report `emailError` if the form request fails; retry by submitting a decision again. An incomplete review does not submit a form. The first complete review triggers the report; later changes do not generate another report.

## Important limitations

* Public shared views allow anyone with the URL to submit or alter decisions; there is no reviewer authentication.
* Netlify Forms email notifications only go to active Netlify team members. Form detection, a registered form, and a notification rule are required before email delivery works.
* Netlify spam filtering can hold a submission; review the Netlify Forms Spam section when troubleshooting.
* A successful HTTP response does not independently prove a form was registered or an email delivered; **test a full review on the live site**.
* Netlify Blobs state updates are not transactional. Simultaneous final decisions may result in duplicate or missed reports under race conditions. For compliance-critical approvals, use transactional storage and authenticated reviewers.
* The `index.html` password gate is client-side and not a secure access boundary.

All 49 shared pages and their grouped navigation, landscape PDF, HTML download, and artwork decision controls are retained. New exports continue to use the existing review endpoint.


## Shared page path fix

The review function now normalizes percent-encoded filenames and full URLs to a consistent `/shared/filename.html` identifier. This resolves HTTP 400 `Invalid shared page path` for valid shared pages. If a 400 persists, inspect the response `received` field (it contains the supplied path, not credentials) and compare it with the actual deployed URL.

After deployment, verify GET at `/.netlify/functions/review?view=%2Fshared%2FHEB_Oct2026.html`, then test an Approved decision from the shared page. This does not guarantee email notification delivery until the form is configured and tested.


## Consolidated report verification (updated)

The function now posts the completed report to `/` using Netlify's AJAX Forms pattern. The registered form declares `summary`, `report`, and `artwork_decisions` fields. Open **Netlify > Forms > artwork-review-complete**, click the individual submission row (not just its timestamp) to view field values. The `report` field is the human-readable card-by-card report; `artwork_decisions` contains JSON for each card. A notification rule must separately be configured for `tmerriweather@terraboost.biz`.

After deployment, use a **new, uncompleted shared view** for the end-to-end test. A view previously marked `emailed: true` will not send another report, even if you replace the code. If `emailed: false` and all decisions are complete, changing and resaving one card will retry the form submission. `emailed: true` means the form POST was accepted, not that an email reached the inbox. Check the Netlify Forms submission detail, spam submissions, and notification settings.

If a new report still shows only one artwork, verify the review progress count: the function freezes the initial artwork list (`state.cards`) on the first saved decision. Changes to the list after that point require an intentional new review round; do not silently overwrite existing approval records.


## Spam-filtering improvements

This update keeps Netlify Forms and its original form name. The notification payload now includes a readable venue, a completion status, a concise summary, and human-readable artwork decisions rather than a JSON dump. The full report remains available in the `report` field. The view URL is provided once as its own field. Existing Blobs review state and all shared pages are unchanged.

**Important:** Netlify/Akismet controls spam classification. These content changes may reduce false positives but cannot guarantee verified delivery or override the spam filter. Mark legitimate reports as verified in Netlify Forms, and contact Netlify support with example submission IDs if new reports continue to be flagged. Existing reviews marked `emailed: true` will not automatically resubmit after deployment; test using an uncompleted shared view.
