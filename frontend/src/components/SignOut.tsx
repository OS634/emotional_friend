import React from 'react';
import { Button } from '@mui/material';
import { auth } from '../firebase';

function SignOut() {
  const user = auth.currentUser;

  return (
    <div className='header'>
      <Button 
        style={{ color: "white", fontSize: "15px" }}
        onClick={() => auth.signOut()}
      >
        Sign Out
      </Button>
      {user && <h3>{user.displayName}</h3>}
    </div>
  );
}

export default SignOut;