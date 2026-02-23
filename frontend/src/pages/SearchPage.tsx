import React from 'react';
import NotImplementedCard from '../components/NotImplementedCard';
import { NotImplementedException } from '../types/NotImplementedException';

const SearchPage: React.FC = () => {
  const notImplemented = new NotImplementedException({
    title: 'Search',
    message: 'Functionality not yet implemented',
    description: 'This search feature is currently in development and will be available in a future release.',
    icon: '🔍',
    variant: 'search',
  });

  return (
    <NotImplementedCard
      title={notImplemented.payload.title}
      message={notImplemented.payload.message}
      description={notImplemented.payload.description}
      icon={notImplemented.payload.icon}
      variant={notImplemented.payload.variant}
    />
  );
};

export default SearchPage;
