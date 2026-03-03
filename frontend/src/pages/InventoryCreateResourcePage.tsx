import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchableSelect from '../components/SearchableSelect';
import { inventoryService, roleService, userService } from '../services/userService';
import { ResourceTag, ResourceType } from '../types';
import './InventoryCreateResourcePage.css';

const InventoryCreateResourcePage: React.FC = () => {
  const navigate = useNavigate();
  const requesterEmail = localStorage.getItem('email') || '';

  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [resourceTags, setResourceTags] = useState<ResourceTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canCreateResource, setCanCreateResource] = useState(false);

  const [formData, setFormData] = useState({
    resourceTypeId: '',
    selectedTagIds: [] as string[],
    description: '',
    availableQuantity: '0',
    pendingQuantity: '0',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [typeData, tagData, userData, roles] = await Promise.all([
          inventoryService.getResourceTypes(requesterEmail),
          inventoryService.getResourceTags(requesterEmail),
          userService.getCurrentUser(requesterEmail),
          roleService.getRolesForUser(requesterEmail),
        ]);

        const roleSet = new Set((roles || []).map((role) => role.toLowerCase()));
        const isAdmin = userData.accessLevel === 'Admin';
        const canCreate = isAdmin || roleSet.has('poweruser') || roleSet.has('inventorymanager');

        setResourceTypes(typeData || []);
        setResourceTags(tagData || []);
        setCanCreateResource(canCreate);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load create form');
      } finally {
        setLoading(false);
      }
    };

    if (requesterEmail) {
      load();
    } else {
      setLoading(false);
    }
  }, [requesterEmail]);

  const selectedType = useMemo(
    () => resourceTypes.find((type) => type.id === formData.resourceTypeId),
    [resourceTypes, formData.resourceTypeId]
  );

  const selectedTagNames = useMemo(() => {
    const byId = new Map(resourceTags.map((tag) => [tag.id, tag.name]));
    return formData.selectedTagIds
      .map((id) => byId.get(id))
      .filter((value): value is string => !!value)
      .sort((a, b) => a.localeCompare(b));
  }, [formData.selectedTagIds, resourceTags]);

  const fullTypePreview = useMemo(() => {
    if (!selectedType) {
      return '';
    }

    const prefix = selectedTagNames.join(' ').trim();
    return `${prefix ? `${prefix} ` : ''}${selectedType.name}`.trim();
  }, [selectedType, selectedTagNames]);

  const resourceTypeOptions = useMemo(
    () =>
      resourceTypes.map((type) => ({
        value: type.id,
        label: `${type.icon || '📦'} ${type.name}`,
      })),
    [resourceTypes]
  );

  const tagOptions = useMemo(
    () =>
      resourceTags.map((tag) => ({
        value: tag.id,
        label: tag.name,
      })),
    [resourceTags]
  );

  const onToggleTag = (tagId: string) => {
    setFormData((prev) => {
      if (prev.selectedTagIds.includes(tagId)) {
        return { ...prev, selectedTagIds: prev.selectedTagIds.filter((id) => id !== tagId) };
      }
      return { ...prev, selectedTagIds: [...prev.selectedTagIds, tagId] };
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType) {
      setError('Please select a resource type');
      return;
    }

    if (!canCreateResource) {
      setError('You do not have permission to create resources');
      return;
    }

    setSaving(true);
    try {
      const createdResource = await inventoryService.createResource(requesterEmail, {
        resourceTypeId: selectedType.id,
        tagIds: formData.selectedTagIds,
        category: selectedType.name,
        type: fullTypePreview || selectedType.name,
        subType: selectedTagNames.join(', '),
        description: formData.description,
      });

      const createdItem = await inventoryService.createItem(requesterEmail, {
        resourceId: createdResource.id,
        availableQuantity: Number(formData.availableQuantity) || 0,
        pendingQuantity: Number(formData.pendingQuantity) || 0,
      });

      navigate(`/inventory/items/${createdItem.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create resource');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="inventory-create-loading">Loading create form...</div>;
  }

  return (
    <div className="inventory-create-page">
      <div className="inventory-create-header">
        <button type="button" className="inventory-back-link" onClick={() => navigate('/inventory')}>
          ← Back to Inventory
        </button>
        <h1>Create Resource + Item</h1>
        <p>Define a Resource using Resource Type and Resource Tags, then create the first item quantities.</p>
      </div>

      {error && <div className="inventory-create-error">{error}</div>}

      <form className="inventory-create-form" onSubmit={onSubmit}>
        <SearchableSelect
          label="Resource Type"
          required
          options={resourceTypeOptions}
          value={formData.resourceTypeId}
          onChange={(value) => setFormData((prev) => ({ ...prev, resourceTypeId: value }))}
          placeholder="Search type..."
          disabled={!canCreateResource || saving}
        />

        <div className="inventory-create-tags">
          <label>Resource Tags</label>
          <div className="inventory-tag-chips">
            {tagOptions.map((option) => {
              const selected = formData.selectedTagIds.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`inventory-tag-chip ${selected ? 'selected' : ''}`}
                  onClick={() => onToggleTag(option.value)}
                  disabled={!canCreateResource || saving}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="inventory-create-preview">
          <span>Resource Preview</span>
          <strong>{fullTypePreview || 'Select type and optional tags'}</strong>
        </div>

        <div className="inventory-create-field">
          <label>Description</label>
          <textarea
            rows={3}
            required
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Add useful details for this resource"
            disabled={!canCreateResource || saving}
          />
        </div>

        <div className="inventory-create-qty-grid">
          <div className="inventory-create-field">
            <label>Available Quantity</label>
            <input
              type="number"
              min="0"
              required
              value={formData.availableQuantity}
              onChange={(e) => setFormData((prev) => ({ ...prev, availableQuantity: e.target.value }))}
              disabled={!canCreateResource || saving}
            />
          </div>

          <div className="inventory-create-field">
            <label>Pending Quantity</label>
            <input
              type="number"
              min="0"
              required
              value={formData.pendingQuantity}
              onChange={(e) => setFormData((prev) => ({ ...prev, pendingQuantity: e.target.value }))}
              disabled={!canCreateResource || saving}
            />
          </div>
        </div>

        <div className="inventory-create-actions">
          <button type="submit" className="inventory-create-submit" disabled={!canCreateResource || saving}>
            {saving ? 'Adding...' : 'Add to Inventory'}
          </button>
          <button type="button" className="inventory-create-cancel" onClick={() => navigate('/inventory')} disabled={saving}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default InventoryCreateResourcePage;
