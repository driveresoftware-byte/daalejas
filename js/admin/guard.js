// Llama a esto al principio de cada página protegida del panel admin.
// Devuelve la sesión si existe; si no, redirige a /admin/login.html y no resuelve.
async function requireAdminSession() {
  const { data } = await db.auth.getSession();
  if (!data.session) {
    window.location.href = "/admin/login.html";
    return null;
  }
  return data.session;
}

async function adminLogout() {
  await db.auth.signOut();
  window.location.href = "/admin/login.html";
}
