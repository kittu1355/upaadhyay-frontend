// admin/js/auth.js — admin session on top of the Laravel API (../js/api.js must load first).
// Admin ID = the admin account's email. Real protection is server-side: every /api/admin/* route
// checks the Sanctum token AND role:admin, so a hand-edited browser cannot reach admin data.
// Create / reset the admin account on the server with:
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='strong-password' php artisan db:seed --class=AdminSeeder

// Resolves to the signed-in admin user, or null (no token, expired token, or a non-admin account).
async function adminCurrent(){
  if(!api.hasToken()) return null;
  const u = await api.me();
  if(u && u.role !== 'admin'){ api.clearAuth(); return null; }   // another role's token: never reused for admin
  return u || null;
}

// Sign in through POST /api/admin/login (administrators only; a faculty/institution account gets the same
// "Invalid email or password" and no token). Resolves { ok:true, user } or { ok:false, message }.
async function adminLogin(adminId, password){
  try{
    const d = await api.post('/admin/login', { email: String(adminId || '').trim(), password: password }, { noAuthRedirect: true });
    return { ok:true, user: api._accept(d) };
  }catch(e){
    if(e && e.status === 429) return { ok:false, message:'Too many attempts. Wait a minute and try again.' };
    if(e && e.status === 0)   return { ok:false, message:e.message };
    return { ok:false, message:(e && e.message) || 'Could not sign in. Try again.' };
  }
}

// Page guard: call at the top of every admin page. Redirects to the login page when not an admin.
async function requireAdmin(){
  const u = await adminCurrent();
  if(!u){ api.clearAuth(); window.location.replace('login.html'); return null; }
  return u;
}

async function adminLogout(){
  await api.logout();
  window.location.href = 'login.html';
}
