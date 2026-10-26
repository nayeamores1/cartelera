export function validarFormularioAuth(correo: string, clave: string, confirmacion?: string): string | null {
  const email = correo.trim();
  if (!email) return 'Escribe tu correo electrónico.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Escribe un correo electrónico válido.';
  if (!clave) return 'Escribe tu contraseña.';
  if (confirmacion !== undefined) {
    if (clave.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (!confirmacion) return 'Confirma tu contraseña.';
    if (clave !== confirmacion) return 'Las contraseñas no coinciden.';
  }
  return null;
}
