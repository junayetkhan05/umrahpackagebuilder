/* ==================== LOGOUT (No confirm dialog) ==================== */
async function logout() {
  try {
    if (window.firebaseAuth && window.firebaseAuthFns) {
      const { signOut } = window.firebaseAuthFns;
      await signOut(window.firebaseAuth);
    }
  } catch (e) {
    console.error('Logout failed:', e);
  }
  // Direct redirect to login page
  window.location.href = 'login.html';
}
/* ============================================================
   LINK GOOGLE ACCOUNT — Same user two-way login
   ============================================================ */

async function linkGoogleAccount() {
  const user = window.firebaseAuth?.currentUser;
  if (!user) {
    alert('⚠️ You need to be logged in first.');
    return;
  }

  // Check if Google is already linked
  const providers = user.providerData.map(p => p.providerId);
  if (providers.includes('google.com')) {
    alert('✅ Google is already linked to your account!\n\nYou can sign in with both Email/Password and Google.');
    return;
  }

  if (!confirm('🔗 Link your Google account?\n\nAfter linking, you can sign in with both:\n• Email + Password\n• Google button')) {
    return;
  }

  try {
    if (!window.firebaseAuthFns) throw new Error('Firebase not ready');
    const { GoogleAuthProvider, linkWithPopup } = window.firebaseAuthFns;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    // Show loading
    if (typeof showLoading === 'function') showLoading('Linking Google account...');

    const result = await linkWithPopup(user, provider);
    console.log('✅ Google linked:', result.user.email);

    if (typeof hideLoading === 'function') hideLoading();

    alert(
      '✅ Success!\n\n' +
      'Google account linked to:\n' +
      user.email + '\n\n' +
      'You can now sign in using:\n' +
      '• Email + Password\n' +
      '• Google button'
    );

    // Refresh user info
    if (typeof updateUserUI === 'function') updateUserUI();

    // Refresh account section
    if (typeof renderAccountInfo === 'function') renderAccountInfo();

  } catch (err) {
    console.error('Link error:', err);
    if (typeof hideLoading === 'function') hideLoading();

    let msg = 'Failed to link Google account.';
    if (err.code === 'auth/credential-already-in-use') {
      msg = '⚠️ This Google account is already linked to another user.';
    } else if (err.code === 'auth/email-already-in-use') {
      msg = '⚠️ This email is already in use.';
    } else if (err.code === 'auth/popup-closed-by-user') {
      msg = 'Link cancelled.';
    } else if (err.code === 'auth/popup-blocked') {
      msg = 'Popup blocked. Please allow popups.';
    } else if (err.message) {
      msg = err.message;
    }
    alert(msg);
  }
}

/* ============================================================
   GET LINKED PROVIDERS — Show account info
   ============================================================ */

function getLinkedProviders() {
  const user = window.firebaseAuth?.currentUser;
  if (!user) return [];

  return user.providerData.map(p => ({
    id: p.providerId,
    name: p.providerId === 'google.com' ? 'Google'
        : p.providerId === 'password' ? 'Email/Password'
        : p.providerId,
    email: p.email
  }));
}

function renderAccountInfo() {
  const container = document.getElementById('accountProviders');
  if (!container) return;

  const providers = getLinkedProviders();
  if (!providers.length) {
    container.innerHTML = '<div style="color:var(--text-3);font-size:12px">No linked providers</div>';
    return;
  }

  const icons = {
    'google.com': '🔵',
    'password': '✉️'
  };

  container.innerHTML = providers.map(p => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg-2);border-radius:10px;margin-bottom:8px">
      <span style="font-size:18px">${icons[p.id] || '🔗'}</span>
      <div style="flex:1">
        <div style="font-weight:700;font-size:13px">${p.name}</div>
        <div style="font-size:11px;color:var(--text-3)">${p.email || ''}</div>
      </div>
      <span class="status-badge active">✓ Linked</span>
    </div>
  `).join('');
}