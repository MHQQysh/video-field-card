(() => {
  const search = document.querySelector('#paper-search');
  const team = document.querySelector('#team-filter');
  const year = document.querySelector('#year-filter');
  const topic = document.querySelector('#topic-filter');
  const cards = Array.from(document.querySelectorAll('[data-paper-card]'));
  const groups = Array.from(document.querySelectorAll('[data-year-group]'));
  const count = document.querySelector('#visible-count');
  const empty = document.querySelector('#empty-state');
  const reset = document.querySelector('#reset-filters');

  if (!search || !team || !year || !topic || !count) return;

  const selected = (element) => (element.value || '').trim();
  const containsToken = (value, token) => !token || value.split('|').includes(token);

  function applyFilters() {
    const queryTokens = selected(search).toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const selectedTeam = selected(team);
    const selectedYear = selected(year);
    const selectedTopic = selected(topic);
    let visible = 0;

    cards.forEach((card) => {
      const searchable = (card.dataset.search || '').toLocaleLowerCase();
      const matchesQuery = queryTokens.every((token) => searchable.includes(token));
      const matches = matchesQuery
        && containsToken(card.dataset.labs || '', selectedTeam)
        && (!selectedYear || card.dataset.year === selectedYear)
        && containsToken(card.dataset.topics || '', selectedTopic);
      card.hidden = !matches;
      if (matches) visible += 1;
    });

    groups.forEach((group) => {
      group.hidden = !group.querySelector('[data-paper-card]:not([hidden])');
    });
    count.textContent = String(visible);
    if (empty) empty.hidden = visible !== 0;
  }

  [search, team, year, topic].forEach((element) => {
    element.addEventListener(element === search ? 'input' : 'change', applyFilters);
  });

  if (reset) {
    reset.addEventListener('click', () => {
      search.value = '';
      team.value = '';
      year.value = '';
      topic.value = '';
      applyFilters();
      search.focus();
    });
  }

  applyFilters();
})();
