import React from 'react';
import { useLocation } from 'react-router-dom';
import NotImplementedCard from '../components/NotImplementedCard';
import { NotImplementedExceptionPayload } from '../types/NotImplementedException';

const fallbackPayload: NotImplementedExceptionPayload = {
  title: 'Not Implemented',
  message: 'Functionality not yet implemented',
  description: 'This feature is currently in development and will be available in a future release.',
  icon: '🛠️',
  variant: 'search',
};

const NotImplementedPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as NotImplementedExceptionPayload | null;
  const payload = state ?? fallbackPayload;

  return (
    <NotImplementedCard
      title={payload.title}
      message={payload.message}
      description={payload.description}
      icon={payload.icon}
      variant={payload.variant}
    />
  );
};

export default NotImplementedPage;
