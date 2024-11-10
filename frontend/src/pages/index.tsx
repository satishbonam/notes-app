// src/pages/index.tsx
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const Home: React.FC = () => {
  const { isAuthenticated, loginWithRedirect, logout } = useAuth0();

  return (
    <div className='container mx-auto text-center p-4'>
      <h1 className='text-2xl font-semibold mb-4'>Welcome to My Notes App</h1>
      {isAuthenticated ? (
        <>
          <Link href='/notes' className='text-blue-500'>
            Go to My Notes
          </Link>

          <Button
            onClick={() => logout()}
            variant='default'>
            Logout
          </Button>
        </>
      ) : (
        <Button onClick={() => loginWithRedirect()} variant={'default'}>
          Login
        </Button>
      )}
    </div>
  );
};

export default Home;
