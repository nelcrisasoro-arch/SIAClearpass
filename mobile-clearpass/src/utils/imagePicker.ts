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
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null;
      if (!dataUrl) return resolve(null);
      const image = new Image();
      image.onload = () => {
        const edge = 512;
        const scale = Math.min(1, edge / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) return resolve(dataUrl);
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.45));
      };
      image.onerror = () => resolve(dataUrl);
      image.src = dataUrl;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  };
  input.click();
});
