export const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '…';
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'open': return 'Ouverte';
    case 'in_progress': return 'En cours';
    case 'finished': return 'Terminée';
    default: return status;
  }
};