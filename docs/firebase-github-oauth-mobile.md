# LandBD GitHub OAuth — Android/mobile fix

The existing Firebase authentication and server-side GitHub identity checks remain intact. The observed `auth/popup-closed-by-user` error means Firebase's popup authentication did not finish; it is not proof that the GitHub OAuth credentials are wrong.

## Production migration (coordinate these steps)

1. Deploy this patch (Next.js transparent rewrites and `proxy.ts` exemption). The routes `/__/auth/*` and `/__/firebase/init.json` are transparently proxied to the existing Firebase Hosting project. They must not be HTTP redirects.
2. Verify the helper endpoint at `https://landbd.pincodeit.com/__/auth/handler` serves Firebase's handler.
3. In GitHub **Developer Settings → OAuth Apps → LandBD**, change the **Authorization callback URL** to `https://landbd.pincodeit.com/__/auth/handler`.
4. In Firebase Authentication → Settings → Authorized domains, confirm `landbd.pincodeit.com` is allowed.
5. Set the **Production** Vercel environment variable `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=landbd.pincodeit.com` and redeploy. Do not change the other Firebase configuration.
6. Verify Android Chrome GitHub login and desktop sign-in, plus the unchanged Email/Password flow.

The callback and environment-variable changes must be coordinated; changing the callback before the matching deployment may briefly interrupt GitHub login. Until the custom `authDomain` is set, this patch preserves the existing popup behavior, while showing a usable Bangla error rather than the raw Firebase exception.

## Security

Signing in to GitHub does not by itself grant admin rights. The existing server must verify Firebase ID-token claims and the authorized GitHub provider identity before `Super Admin` access. Never grant admin privileges based on a client-supplied username or email.

Documentation: https://firebase.google.com/docs/auth/web/redirect-best-practices
