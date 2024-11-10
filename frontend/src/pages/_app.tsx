'use client';
import { AppProps } from 'next/app';
import dynamic from 'next/dynamic';

import { Auth0Provider } from '@auth0/auth0-react';
import '../styles/globals.css';
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN!}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!}
      cacheLocation="localstorage"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
      }}>
      <Component {...pageProps} />
    </Auth0Provider>
  );
}

export default dynamic(() => Promise.resolve(MyApp), {
  ssr: false,
});
