import axios from 'axios';
import React, { useState } from 'react'

const ForgotPassword = () => {

 const [email , setEmail] = useState('');

 const handleformchange = (e) =>{
    setEmail(e.target.value)
 }

 const handleformsubmit = async (e) =>{
    e.preventDefault();
    console.log("sending mail to " ,email);

    try {
        const response = await axios.post("http://localhost:3000/emailService/forgot-email-pass", { email} );
        if (response.status === 200) {
          alert("link to reset password has been sent");
        }
      } catch (error) {
        console.error("error sending email:", error);
      }
 }
  return (
   <>
    <form onSubmit={handleformsubmit}>
        <input type="email" placeholder='enter your email'  value={email} onChange={handleformchange} required/>
        <button type='submit'>Send</button>
    </form>
   
   </>
   
  )
}

export default ForgotPassword
