/* Maquettes : le seul script partagé, la préparation du message. */

(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const field = form.querySelector('input[name="company"]');
  const address = 'contact.mprnl@gmail.com';

  const buildMailto = (company) => {
    const name = company.trim();
    const subject = name
      ? `Alternance développeur : ${name}`
      : 'Alternance développeur, septembre 2027';
    const body = [
      'Bonjour Mattia,',
      '',
      name
        ? `Je vous contacte au sujet d'une alternance au sein de ${name}.`
        : "Je vous contacte au sujet d'une alternance.",
      '',
      'Le poste : ',
      'Les technologies : ',
      'À partir de : septembre 2027',
      '',
      'Bien à vous,',
      '',
    ].join('\n');

    return `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    window.location.href = buildMailto(field ? field.value : '');
  });
})();
