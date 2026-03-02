import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { InventoryItem } from '../types';
import './InventoryTypeItemsPanel.css';

type SortOrder = 'az' | 'za' | 'availableDesc' | 'availableAsc' | 'pendingDesc' | 'pendingAsc';

interface InventoryTypeItemsPanelProps {
  title: string;
  icon?: string;
  items: InventoryItem[];
  mode: 'main' | 'detailed';
  headingLink?: string;
  onOpenItem: (itemId: string) => void;
}

const InventoryTypeItemsPanel: React.FC<InventoryTypeItemsPanelProps> = ({
  title,
  icon = '📦',
  items,
  mode,
  headingLink,
  onOpenItem,
}) => {
  const [sortOrder, setSortOrder] = useState<SortOrder>('az');

  const sortedItems = useMemo(() => {
    const nextItems = [...items];

    nextItems.sort((left, right) => {
      switch (sortOrder) {
        case 'za':
          return right.resourceType.localeCompare(left.resourceType);
        case 'availableDesc':
          return (right.availableQuantity || 0) - (left.availableQuantity || 0);
        case 'availableAsc':
          return (left.availableQuantity || 0) - (right.availableQuantity || 0);
        case 'pendingDesc':
          return (right.pendingQuantity || 0) - (left.pendingQuantity || 0);
        case 'pendingAsc':
          return (left.pendingQuantity || 0) - (right.pendingQuantity || 0);
        case 'az':
        default:
          return left.resourceType.localeCompare(right.resourceType);
      }
    });

    return nextItems;
  }, [items, sortOrder]);

  return (
    <section className={`inventory-type-panel ${mode === 'detailed' ? 'detailed' : 'main'}`}>
      <div className="inventory-type-panel-header">
        <div className="inventory-type-panel-title-wrap">
          <span className="inventory-type-panel-icon">{icon}</span>
          {headingLink ? (
            <Link className="inventory-type-panel-link" to={headingLink}>
              {title}
            </Link>
          ) : (
            <h2 className="inventory-type-panel-title">{title}</h2>
          )}
        </div>

        <select
          className="inventory-type-panel-sort"
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value as SortOrder)}
          aria-label={`Sort ${title} items`}
        >
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
          <option value="availableDesc">By Available Quantity (Desc)</option>
          <option value="availableAsc">By Available Quantity (Asc)</option>
          <option value="pendingDesc">By Pending Quantity (Desc)</option>
          <option value="pendingAsc">By Pending Quantity (Asc)</option>
        </select>
      </div>

      <div className={`inventory-type-panel-grid ${mode}`}>
        {sortedItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className="inventory-type-item-card"
            onClick={() => onOpenItem(item.id)}
          >
            <div className="inventory-type-item-card-head">
              <h3>{item.resourceType}</h3>
              <span>{item.resourceCategory}</span>
            </div>

            {item.resourceSubType && <p className="inventory-type-item-tags">{item.resourceSubType}</p>}
            {item.resourceDescription && <p className="inventory-type-item-desc">{item.resourceDescription}</p>}

            <div className="inventory-type-item-qty">
              <div>
                <small>Available</small>
                <strong>{item.availableQuantity}</strong>
              </div>
              <div>
                <small>Pending</small>
                <strong>{item.pendingQuantity}</strong>
              </div>
            </div>

            {item.customTagNames && item.customTagNames.length > 0 && (
              <div className="inventory-type-item-custom-tags">
                {item.customTagNames.map((tagName) => (
                  <span key={`${item.id}-${tagName}`}>{tagName}</span>
                ))}
              </div>
            )}

            <div className="inventory-type-item-footer">Open Item</div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default InventoryTypeItemsPanel;
