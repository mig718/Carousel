import React from 'react';
import './SearchPage.css';

const SearchPage: React.FC = () => {
  return (
    <div className="search-page">
      <div className="search-container">
        <div className="coming-soon-icon">🔍</div>
        <h1>Search</h1>
        <p className="coming-soon-message">Functionality not yet implemented</p>
        <p className="coming-soon-description">
          This search feature is currently in development and will be available in a future release.
        </p>
      </div>
    </div>
  );
};

export default SearchPage;
