import React from 'react';
import { NotImplementedCardVariant } from '../types/NotImplementedException';
import './NotImplementedCard.css';

interface NotImplementedCardProps {
  title: string;
  message: string;
  description: string;
  icon?: string;
  variant?: NotImplementedCardVariant;
  items?: string[];
  onItemClick?: (item: string) => void;
}

const NotImplementedCard: React.FC<NotImplementedCardProps> = ({
  title,
  message,
  description,
  icon,
  variant = 'search',
  items = [],
  onItemClick,
}) => {
  if (variant === 'settings-list') {
    return (
      <div className="settings-detail">
        <div className="settings-detail-header">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <div className="settings-list">
          {items.map((item) => (
            <button
              key={item}
              type="button"
              className="settings-list-item"
              onClick={() => onItemClick?.(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="search-page">
      <div className="search-container">
        {icon ? <div className="coming-soon-icon">{icon}</div> : null}
        <h1>{title}</h1>
        <p className="coming-soon-message">{message}</p>
        <p className="coming-soon-description">{description}</p>
      </div>
    </div>
  );
};

export default NotImplementedCard;
