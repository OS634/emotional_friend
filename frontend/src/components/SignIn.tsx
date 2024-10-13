import { Button } from '@mui/material'
import React from 'react'
import firebase from "firebase/compat/app"
import { auth, provider } from '../firebase';
import {signInWithPopup} from "firebase/auth";

function SignIn() {

  const signInWithGoogle = () => {
    signInWithPopup(auth, provider)
  };
  return (
    <div>
      <Button onClick={signInWithGoogle}>
        Login to Google
      </Button>
    </div>
  )
}

export default SignIn;