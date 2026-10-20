/** Browser implementation. Metro uses imagePicker.native.ts on Android. */
export const pickProfileImage = () => new Promise<string | null>((resolve) => {
  if (typeof document === 'undefined') return resolve(null);

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return resolve(null);

    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  };
  input.click();
});
