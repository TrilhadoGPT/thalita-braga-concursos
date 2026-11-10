# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The new `/material/aula-09-nov-26` route is for people who received access to the 09/11/26 class materials. This audience is inferred from the user's description of the page as material for that class.

## Product Purpose

Let visitors open the class material folder directly, or enter a passphrase to continue to the bonus folder.

## Capabilities and Constraints

- The public site is deployed on Vercel from `site-produtos/`.
- Material and bonus content live in Google Drive; the page links to those folders.
- The bonus passphrase must be checked by a Vercel serverless function using environment variables. The redirect destination is also server-side configuration.
- The page gate does not change Google Drive's own sharing permissions.
- The route should not be indexed by search engines.

## Brand Commitments

- The requested page title is `Thalita Braga Concursos`.
- Preserve the existing site identity in `site-produtos/assets/base.css` and the GTM container used by its existing pages.

## Evidence on Hand

- The user supplied the material and bonus Google Drive folder links and the passphrase for Vercel configuration.
- No GTM event trigger for this access flow has been supplied or confirmed.

## Product Principles

- Make the two folder choices clear and immediate.
- Keep the passphrase and bonus destination out of browser-delivered files.
- Report an incorrect passphrase clearly and let the visitor retry.
