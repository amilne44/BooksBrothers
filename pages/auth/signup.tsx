import React, { useState } from 'react';
import Router from 'next/router';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const submit = async (e: any) => {
    e.preventDefault();
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    if (res.ok) {
      alert('Account created — now sign in');
      Router.push('/api/auth/signin');
    } else {
      const err = await res.json();
      alert('Signup failed: ' + (err.error || JSON.stringify(err)));
    }
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Sign up — Books Brothers</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
        <input placeholder="Name (optional)" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">Create account</button>
      </form>
    </main>
  );
}