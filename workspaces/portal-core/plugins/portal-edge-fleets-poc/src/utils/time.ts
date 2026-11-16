const defaultLang = 'en-US';

const defaultFormatter = new Intl.DateTimeFormat(defaultLang, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  year: 'numeric',
});

export const getDateDisplay = (timestamp?: string) => {
  if (!timestamp) {
    return 'N/A';
  }

  return defaultFormatter.format(new Date(timestamp));
};
