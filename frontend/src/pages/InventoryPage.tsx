import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { inventoryService } from '../services/userService';
import { InventoryItem, ResourceType } from '../types';
import SearchableSelect from '../components/SearchableSelect';
import './InventoryPage.css';

const InventoryPage: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const userEmail = user?.email || '';

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [types, setTypes] = useState<ResourceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsFetchFailed, setItemsFetchFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    resourceTypeId: '',
    resourceSubTypeId: '',
    availableQuantity: '',
  });

  useEffect(() => {
    loadInventoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  const loadInventoryData = async () => {
    setLoading(true);
    setItemsFetchFailed(false);

    try {
      const itemsData = await inventoryService.getItems(userEmail);
      setItems(itemsData);
    } catch (err) {
      setItems([]);
      setItemsFetchFailed(true);
      console.error(err);
    }

    try {
      const typesData = await inventoryService.getTypes(userEmail);
      setTypes(typesData);
    } catch (err) {
      setTypes([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSubTypes = (parentTypeId: string) => {
    return types.filter((t) => t.parentTypeId === parentTypeId);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newItem = await inventoryService.createItem(userEmail, {
        name: formData.name,
        description: formData.description,
        resourceTypeId: formData.resourceTypeId,
        resourceSubTypeId: formData.resourceSubTypeId || undefined,
        availableQuantity: parseInt(formData.availableQuantity) || 0,
      });
      setItems([...items, newItem]);
      setFormData({
        name: '',
        description: '',
        resourceTypeId: '',
        resourceSubTypeId: '',
        availableQuantity: '',
      });
      setItemsFetchFailed(false);
      setError(null);
      setShowAddForm(false);
    } catch (err) {
      setError('Failed to add item');
      console.error(err);
    }
  };

  const showInventoryLandingState = !showAddForm && (itemsFetchFailed || items.length === 0);

  const handleQuantityAdjust = async (itemId: string, delta: number) => {
    try {
      const updated = await inventoryService.adjustQuantity(userEmail, itemId, delta);
      setItems(items.map((i) => (i.id === itemId ? updated : i)));
    } catch (err) {
      setError('Failed to adjust quantity');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="inventory-page-content">
        <div className="loading">Loading inventory...</div>
      </div>
    );
  }

  return (
      <div className="inventory-page-content">
        <div className="inventory-page-header">
          <button
            className="btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : '+ Add Item'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {showAddForm && (
          <form className="add-item-form" onSubmit={handleAddItem}>
            <h2>Add New Inventory Item</h2>

            <div className="form-group">
              <label>Item Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Premium Round Diamond"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <SearchableSelect
                  label="Resource Type"
                  placeholder="Select item type..."
                  required
                  value={formData.resourceTypeId}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      resourceTypeId: value,
                      resourceSubTypeId: '',
                    })
                  }
                  options={types
                    .filter((t) => !t.parentTypeId)
                    .map((t) => ({
                      value: t.id,
                      label: t.name,
                    }))}
                />
              </div>

              {formData.resourceTypeId && getSubTypes(formData.resourceTypeId).length > 0 && (
                <div className="form-group">
                  <SearchableSelect
                    label="Sub Type"
                    placeholder="Select sub type..."
                    value={formData.resourceSubTypeId}
                    onChange={(value) =>
                      setFormData({ ...formData, resourceSubTypeId: value })
                    }
                    options={getSubTypes(formData.resourceTypeId).map((t) => ({
                      value: t.id,
                      label: t.name,
                    }))}
                  />
                </div>
              )}
            </div>

            {(formData.resourceTypeId || true) && (
              <>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Item description"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Available Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.availableQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, availableQuantity: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
              </>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Save Item
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {showInventoryLandingState ? (
          <div className="inventory-empty-dashboard">
            <img
              className="inventory-empty-icon"
              src="/inventory-empty.svg"
              alt="Empty inventory"
            />
            <h2>There is no data here yet...</h2>
            <p className="inventory-empty-message">
              {itemsFetchFailed
                ? 'We could not load inventory items from the database right now.'
                : 'Click "+ Add Item" to create the first inventory item.'}
            </p>
          </div>
        ) : (
          <div className="items-grid">
            {items.map((item) => (
              <div key={item.id} className="inventory-card">
                <div className="card-header">
                  <h3>{item.name}</h3>
                  <span className="item-type">
                    {item.resourceTypeName}
                    {item.resourceSubTypeName && ` / ${item.resourceSubTypeName}`}
                  </span>
                </div>

                {item.description && (
                  <p className="card-description">{item.description}</p>
                )}

                <div className="quantity-section">
                  <span className="quantity-label">Available Quantity:</span>
                  <div className="quantity-controls">
                    <button
                      className="btn-sm btn-secondary"
                      onClick={() => handleQuantityAdjust(item.id, -1)}
                    >
                      −
                    </button>
                    <span className="quantity-value">{item.availableQuantity}</span>
                    <button
                      className="btn-sm btn-secondary"
                      onClick={() => handleQuantityAdjust(item.id, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="card-footer">
                  <small>
                    Last updated:{' '}
                    {new Date(item.updatedAt || item.id).toLocaleDateString()}
                  </small>
                </div>
              </div>
            ))
            }
          </div>
        )}
      </div>
  );
};

export default InventoryPage;
