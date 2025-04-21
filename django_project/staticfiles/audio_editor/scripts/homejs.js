const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const openSidebar = document.getElementById('openSidebar');
    const closeSidebar = document.getElementById('closeSidebar');

    openSidebar.addEventListener('click', () => {
      sidebar.classList.add('active');
      overlay.classList.add('active');
    });

    closeSidebar.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });

    const audioUpload = document.getElementById('audioUpload');
    const fileNameDisplay = document.getElementById('fileName');

    audioUpload.addEventListener('change', () => {
      const file = audioUpload.files[0];
      if (file) {
        fileNameDisplay.textContent = `✅ Uploaded: ${file.name}`;
        fileNameDisplay.style.color = '#00796b';
      } else {
        fileNameDisplay.textContent = '';
      }
    });