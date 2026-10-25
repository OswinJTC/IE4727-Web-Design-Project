// A local photo preview only. The PHP page validates and saves the upload.
const photoInput = document.getElementById('dish-photo');
if (photoInput) {
  let previewUrl;
  photoInput.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      this.value = '';
      alert('Choose a JPG or PNG photo up to 2 MB.');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    const image = document.createElement('img');
    image.src = previewUrl;
    image.alt = 'New dish photo';
    document.getElementById('photo-preview').replaceChildren(image);
    document.getElementById('photo-label').textContent = 'Replace photo';
  });
}
