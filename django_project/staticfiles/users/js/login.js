
    const captchaText = document.getElementById("captchaText");
    const captchaInput = document.getElementById("captchaInput");
    const refreshBtn = document.getElementById("refreshCaptcha");
    const form = document.getElementById("loginForm");
    const error = document.getElementById("captchaError");

    function generateCaptcha() {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let captcha = "";
      for (let i = 0; i < 5; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      captchaText.textContent = captcha;
      return captcha;
    }

    let currentCaptcha = generateCaptcha();

    refreshBtn.addEventListener("click", () => {
      currentCaptcha = generateCaptcha();
      error.textContent = "";
      captchaInput.value = "";
    });

    form.addEventListener("submit", function(e) {
      if (captchaInput.value.trim().toUpperCase() !== currentCaptcha) {
        e.preventDefault();
        error.textContent = "Incorrect CAPTCHA. Please try again.";
      } else {
        error.textContent = "";
      }
    });