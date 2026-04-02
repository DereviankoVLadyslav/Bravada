(function () {
  function createStatusElement(form) {
    let status = form.querySelector('.form-status');
    if (!status) {
      status = document.createElement('p');
      status.className = 'form-status is-hidden';
      status.setAttribute('aria-live', 'polite');
      form.appendChild(status);
    }
    return status;
  }

  function setStatus(statusEl, type, message) {
    statusEl.textContent = message;
    statusEl.className = 'form-status';
    if (type) {
      statusEl.classList.add(type);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const forms = document.querySelectorAll('.emailjs-form');
    if (!forms.length) return;

    const config = window.EMAILJS_CONFIG || {};
    const requiredKeys = ['publicKey', 'serviceId', 'templateId'];
    const missingKeys = requiredKeys.filter((key) => !config[key] || config[key].startsWith('YOUR_'));

    forms.forEach((form) => {
      createStatusElement(form);
    });

    if (!window.emailjs) {
      forms.forEach((form) => {
        const status = createStatusElement(form);
        setStatus(status, 'is-error', 'EmailJS library failed to load.');
      });
      return;
    }

    if (missingKeys.length) {
      forms.forEach((form) => {
        const status = createStatusElement(form);
        setStatus(status, 'is-error', 'Set your EmailJS public key, service ID, and template ID in emailjs-config.js.');
      });
      return;
    }

    emailjs.init({ publicKey: config.publicKey });

    forms.forEach((form) => {
      const status = createStatusElement(form);
      const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
      const originalButtonText = submitButton ? submitButton.textContent : '';

      form.addEventListener('submit', function (event) {
        event.preventDefault();

        if (!form.reportValidity()) {
          return;
        }

        const honeypot = form.querySelector('input[name="website"]');
        if (honeypot && honeypot.value.trim() !== '') {
          return;
        }

        const pageUrlField = form.querySelector('input[name="page_url"]');
        if (pageUrlField) {
          pageUrlField.value = window.location.href;
        }

        const submittedAtField = form.querySelector('input[name="submitted_at"]');
        if (submittedAtField) {
          submittedAtField.value = new Date().toLocaleString();
        }

        setStatus(status, '', 'Sending your message...');

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = 'Sending...';
        }

        emailjs.sendForm(config.serviceId, config.templateId, form).then(
          function () {
            form.reset();
            if (pageUrlField) {
              pageUrlField.value = window.location.href;
            }
            setStatus(status, 'is-success', 'Thank you. Your message has been sent successfully.');
          },
          function (error) {
            console.error('EmailJS error:', error);
            setStatus(status, 'is-error', 'Message was not sent. Please check your EmailJS settings and try again.');
          }
        ).finally(function () {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
          }
        });
      });
    });
  });
})();
