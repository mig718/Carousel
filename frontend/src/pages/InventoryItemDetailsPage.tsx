import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inventoryService, roleService, userService } from '../services/userService';
import { InventoryItem, InventoryItemCustomTag } from '../types';
import './InventoryItemDetailsPage.css';

const InventoryItemDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { itemId } = useParams<{ itemId: string }>();
  const requesterEmail = localStorage.getItem('email') || '';

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [customTags, setCustomTags] = useState<InventoryItemCustomTag[]>([]);
  const [availableQuantity, setAvailableQuantity] = useState('0');
  const [pendingQuantity, setPendingQuantity] = useState('0');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!itemId) {
        setError('Item id is missing');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [itemData, allTags, currentUser, roles] = await Promise.all([
          inventoryService.getItemById(requesterEmail, itemId),
          inventoryService.getItemCustomTags(requesterEmail),
          userService.getCurrentUser(requesterEmail),
          roleService.getRolesForUser(requesterEmail),
        ]);

        const roleSet = new Set((roles || []).map((role) => role.toLowerCase()));
        const isAdmin = currentUser.accessLevel === 'Admin';
        const canEditItem = isAdmin || roleSet.has('poweruser') || roleSet.has('inventorymanager');

        setItem(itemData);
        setCustomTags(allTags || []);
        setAvailableQuantity(String(itemData.availableQuantity ?? 0));
        setPendingQuantity(String(itemData.pendingQuantity ?? 0));
        setSelectedTagIds(itemData.customTagIds || []);
        setCanEdit(canEditItem);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load item details');
      } finally {
        setLoading(false);
      }
    };

    if (requesterEmail) {
      load();
    } else {
      setLoading(false);
    }
  }, [itemId, requesterEmail]);

  const selectedTagNames = useMemo(() => {
    const namesById = new Map(customTags.map((tag) => [tag.id, tag.name]));
    return selectedTagIds
      .map((id) => ({ id, name: namesById.get(id) }))
      .filter((tag): tag is { id: string; name: string } => !!tag.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customTags, selectedTagIds]);

  const availableCount = Math.max(0, Number(availableQuantity) || 0);
  const pendingCount = Math.max(0, Number(pendingQuantity) || 0);

  const quantityStatus = useMemo(() => {
    if (availableCount > 0) {
      return {
        key: 'available',
        label: 'Available',
        description: 'This item is in stock and can be used right away.',
      };
    }

    if (pendingCount > 0) {
      return {
        key: 'pending',
        label: 'Pending Only',
        description: 'No available units right now, but incoming quantity is pending.',
      };
    }

    return {
      key: 'unavailable',
      label: 'Unavailable',
      description: 'No available or pending quantity for this item.',
    };
  }, [availableCount, pendingCount]);

  const onToggleTag = (tagId: string) => {
    if (!canEdit) {
      return;
    }

    setSelectedTagIds((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      }
      return [...prev, tagId];
    });
  };

  const onSaveItem = async () => {
    if (!item || !canEdit) {
      return;
    }

    setSaving(true);
    try {
      const updated = await inventoryService.updateItem(requesterEmail, item.id, {
        resourceId: item.resourceId,
        availableQuantity: Number(availableQuantity) || 0,
        pendingQuantity: Number(pendingQuantity) || 0,
        customTagIds: selectedTagIds,
      });
      setItem(updated);
      setSelectedTagIds(updated.customTagIds || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  const onCreateCustomTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !newTagName.trim()) {
      return;
    }

    setCreatingTag(true);
    try {
      const created = await inventoryService.createItemCustomTag(requesterEmail, {
        name: newTagName.trim(),
        description: newTagDescription.trim() || newTagName.trim(),
      });

      setCustomTags((prev) => [...prev, created]);
      setSelectedTagIds((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]));
      setNewTagName('');
      setNewTagDescription('');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create custom tag');
    } finally {
      setCreatingTag(false);
    }
  };

  if (loading) {
    return <div className="inventory-item-loading">Loading item details...</div>;
  }

  if (!item) {
    return (
      <div className="inventory-item-page">
        <div className="inventory-item-error">Unable to find this item.</div>
        <button type="button" className="inventory-item-back" onClick={() => navigate('/inventory')}>
          Back to Inventory
        </button>
      </div>
    );
  }

  return (
    <div className="inventory-item-page">
      <div className="inventory-item-header">
        <button type="button" className="inventory-item-back" onClick={() => navigate('/inventory')}>
          ← Back to Inventory
        </button>
        <h1>{item.resourceIcon || '📦'} Item</h1>
        <div className="inventory-item-resource-focus">
          <span className="inventory-item-resource-label">Resource</span>
          <p className="inventory-item-resource-title">{item.resourceType}</p>
        </div>
        <p className="inventory-item-resource-meta">
          Resource Type: {item.resourceCategory}
          {item.resourceSubType ? ` • Resource Tags: ${item.resourceSubType}` : ''}
        </p>
      </div>

      {error && <div className="inventory-item-error">{error}</div>}

      <section className={`inventory-item-panel inventory-item-qty-panel inventory-item-qty-${quantityStatus.key}`}>
        <div className="inventory-item-qty-header">
          <h2>Quantity</h2>
          <span className={`inventory-item-qty-badge inventory-item-qty-badge-${quantityStatus.key}`}>
            {quantityStatus.label}
          </span>
        </div>
        <p className="inventory-item-qty-status-text">{quantityStatus.description}</p>
        <div className="inventory-item-qty-grid">
          <label>
            Available
            <input
              type="number"
              min="0"
              value={availableQuantity}
              onChange={(e) => setAvailableQuantity(e.target.value)}
              disabled={!canEdit || saving}
              className="inventory-item-number-input"
            />
          </label>

          <label>
            Pending
            <input
              type="number"
              min="0"
              value={pendingQuantity}
              onChange={(e) => setPendingQuantity(e.target.value)}
              disabled={!canEdit || saving}
              className="inventory-item-number-input"
            />
          </label>
        </div>
      </section>

      <section className="inventory-item-panel">
        <h2>Tags</h2>

        <div className="inventory-item-selected-tags">
          {selectedTagNames.length === 0 ? (
            <span className="inventory-item-empty-tags">No custom tags selected.</span>
          ) : (
            selectedTagNames.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className="inventory-item-tag selected"
                onClick={() => onToggleTag(tag.id)}
                disabled={!canEdit}
              >
                {tag.name}
              </button>
            ))
          )}
        </div>

        <div className="inventory-item-all-tags">
          {customTags.map((tag) => {
            const selected = selectedTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                className={`inventory-item-tag ${selected ? 'selected' : ''}`}
                onClick={() => onToggleTag(tag.id)}
                disabled={!canEdit}
                title={tag.description}
              >
                {tag.name}
              </button>
            );
          })}
        </div>

        <form className="inventory-item-new-tag" onSubmit={onCreateCustomTag}>
          <h3>Create reusable custom tag</h3>
          <input
            type="text"
            placeholder="Tag name"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            disabled={!canEdit || creatingTag}
          />
          <input
            type="text"
            placeholder="Tag description"
            value={newTagDescription}
            onChange={(e) => setNewTagDescription(e.target.value)}
            disabled={!canEdit || creatingTag}
          />
          <button type="submit" disabled={!canEdit || creatingTag || !newTagName.trim()}>
            {creatingTag ? 'Creating...' : 'Create Tag'}
          </button>
        </form>
      </section>

      <div className="inventory-item-actions">
        <button type="button" className="inventory-item-save" onClick={onSaveItem} disabled={!canEdit || saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button type="button" className="inventory-item-cancel" onClick={() => navigate('/inventory')} disabled={saving}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default InventoryItemDetailsPage;
