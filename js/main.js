(function () {
  'use strict';

  /* ---------- Меню на телефоне ---------- */
  var toggle = document.querySelector('[data-menu-toggle]');
  var menu = document.getElementById('mobile-menu');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.hidden = !open;
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(menu.hidden); });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); }
    });
  }

  /* ---------- Выбор объекта в форме ---------- */
  document.querySelectorAll('[data-pills]').forEach(function (group) {
    group.addEventListener('click', function (e) {
      var pill = e.target.closest('.pill');
      if (!pill) return;
      group.querySelectorAll('.pill').forEach(function (p) {
        p.setAttribute('aria-pressed', p === pill ? 'true' : 'false');
      });
    });
  });

  /* ---------- Кнопки, которые сразу выбирают пункт в заявке ---------- */
  document.querySelectorAll('[data-pick]').forEach(function (link) {
    link.addEventListener('click', function () {
      var target = document.querySelector('.pill[data-value="' + link.getAttribute('data-pick') + '"]');
      if (!target) return;
      target.closest('[data-pills]').querySelectorAll('.pill').forEach(function (p) {
        p.setAttribute('aria-pressed', p === target ? 'true' : 'false');
      });
    });
  });

  /* ---------- Форма заявки ---------- */
  var form = document.getElementById('lead-form');
  if (!form) return;

  var success = document.getElementById('form-success');
  var errorBox = document.getElementById('form-error');
  var again = document.getElementById('form-again');
  var submitBtn = form.querySelector('[type="submit"]');
  var fields = form.elements;

  function showError(text, field) {
    errorBox.textContent = text;
    errorBox.hidden = false;
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      field.focus();
    }
  }

  function clearError() {
    errorBox.hidden = true;
    errorBox.textContent = '';
    fields.namedItem('phone').removeAttribute('aria-invalid');
    fields.namedItem('consent').removeAttribute('aria-invalid');
  }

  form.addEventListener('input', clearError);
  form.addEventListener('change', clearError);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearError();

    var phone = fields.namedItem('phone');
    var consent = fields.namedItem('consent');

    if (phone.value.replace(/\D/g, '').length < 10) {
      showError('Укажите телефон — перезвоним и посчитаем объём', phone);
      return;
    }
    if (!consent.checked) {
      showError('Отметьте согласие на обработку персональных данных', consent);
      return;
    }

    var picked = form.querySelector('.pill[aria-pressed="true"]');
    var data = {
      name: fields.namedItem('client_name').value.trim(),
      phone: phone.value.trim(),
      volume: fields.namedItem('volume').value.trim(),
      object: picked ? picked.textContent.trim() : ''
    };

    submitBtn.disabled = true;
    sendLead(data)
      .then(function () {
        form.hidden = true;
        success.hidden = false;
        document.getElementById('success-title').focus();
      })
      .catch(function () {
        showError('Не удалось отправить заявку. Позвоните нам, пожалуйста.', null);
      })
      .then(function () {
        submitBtn.disabled = false;
      });
  });

  again.addEventListener('click', function () {
    form.reset();
    form.querySelectorAll('.pill').forEach(function (p, i) {
      p.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    });
    clearError();
    success.hidden = true;
    form.hidden = false;
    fields.namedItem('client_name').focus();
  });

  /*
   * Отправка заявки.
   * Сайт статический, своего сервера у него нет, поэтому заявка уходит письмом:
   * у посетителя открывается почта с готовым текстом на адрес LEAD_EMAIL,
   * ему остаётся нажать «Отправить».
   * Чтобы заявки приходили сами, без почты посетителя, замените тело функции
   * на запрос к обработчику на сервере, например:
   *
   *   return fetch('/send', {
   *     method: 'POST',
   *     headers: { 'Content-Type': 'application/json' },
   *     body: JSON.stringify(data)
   *   }).then(function (r) { if (!r.ok) throw new Error('Ошибка отправки'); });
   */
  var LEAD_EMAIL = 'daneliavsevolod0@gmail.com';

  function sendLead(data) {
    var body = [
      'Имя: ' + (data.name || '—'),
      'Телефон: ' + data.phone,
      'Объём: ' + (data.volume ? data.volume + ' т' : '—'),
      'Что нужно: ' + (data.object || '—')
    ].join('\n');
    window.location.href = 'mailto:' + LEAD_EMAIL +
      '?subject=' + encodeURIComponent('Заявка с сайта ICE FORCE') +
      '&body=' + encodeURIComponent(body);
    return Promise.resolve(data);
  }
})();
