import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inventoryService, roleService, userService } from '../services/userService';
import { InventoryItem } from '../types';
import './StyleDetailsPage.css';

const readFilesAsDataUrls = async (files: FileList): Promise<string[]> => {
  const readers = Array.from(files).map(
    (file) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      })
  );

  return Promise.all(readers);
};

const StyleDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { styleId } = useParams<{ styleId: string }>();
  const requesterEmail = localStorage.getItem('email') || '';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requiredItemIds, setRequiredItemIds] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [canAccessStyle, setCanAccessStyle] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiredItemNames = useMemo(() => {
    const itemMap = new Map(items.map((item) => [item.id, item.resourceType]));
    return requiredItemIds.map((id) => itemMap.get(id)).filter((itemName): itemName is string => !!itemName);
  }, [items, requiredItemIds]);

  useEffect(() => {
    const load = async () => {
      if (!requesterEmail || !styleId) {
        setLoading(false);
        setError('Missing required style context');
        return;
      }

      setLoading(true);
      try {
        const [style, itemData, currentUser, roles] = await Promise.all([
          inventoryService.getStyleById(requesterEmail, styleId),
          inventoryService.getItems(requesterEmail),
          userService.getCurrentUser(requesterEmail),
          roleService.getRolesForUser(requesterEmail),
        ]);

        const roleSet = new Set((roles || []).map((role) => role.toLowerCase()));
        const isAdmin = currentUser.accessLevel === 'Admin';
        const canRead = isAdmin || roleSet.has('poweruser') || roleSet.has('stylesuser') || roleSet.has('stylesmanager');
        const canEdit = isAdmin || roleSet.has('poweruser') || roleSet.has('stylesmanager');
        setCanAccessStyle(canRead);
        setCanManage(canEdit);

        setName(style.name);
        setDescription(style.description);
        setRequiredItemIds(style.requiredItemIds || []);
        setImageUrls(style.imageUrls || []);
        setItems(itemData || []);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load style');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [requesterEmail, styleId]);

  const onSave = async () => {
    if (!styleId || !canManage) {
      return;
    }

    setSaving(true);
    try {
      await inventoryService.updateStyle(requesterEmail, styleId, {
        name,
        description,
        requiredItemIds,
        imageUrls,
      });
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save style');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!styleId || !canManage) {
      return;
    }

    if (!window.confirm(`Delete style "${name}"?`)) {
      return;
    }

    try {
      await inventoryService.deleteStyle(requesterEmail, styleId);
      navigate('/styles');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete style');
    }
  };

  const onUploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    try {
      const uploaded = await readFilesAsDataUrls(files);
      setImageUrls((prev) => [...prev, ...uploaded]);
    } catch {
      setError('Failed to process selected images');
    }
  };

  if (loading) {
    return <div className="style-details-loading">Loading style...</div>;
  }

  if (!canAccessStyle) {
    return <div className="style-details-error">You do not have access to this style.</div>;
  }

  return (
    <div className="style-details-page">
      <div className="style-details-header">
        <button type="button" className="style-details-back" onClick={() => navigate('/styles')}>
          ← Back to Styles
        </button>
        <h1>{name || 'Style'}</h1>
        <p>
          Style templates define required inventory input for jobs and customer orders. This mapping is used to track
          required, reserved, and used items automatically.
        </p>
      </div>

      {error && <div className="style-details-error">{error}</div>}

      <section className="style-details-panel">
        <h2>Style Details</h2>

        <label>Name *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} disabled={!canManage || saving} />

        <label>Description *</label>
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} disabled={!canManage || saving} />
      </section>

      <section className="style-details-panel">
        <h2>Required Inventory Items</h2>
        <div className="style-required-list">
          {items.map((item) => {
            const checked = requiredItemIds.includes(item.id);
            return (
              <label key={item.id} className="style-required-checkbox">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!canManage || saving}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setRequiredItemIds((prev) => [...prev, item.id]);
                    } else {
                      setRequiredItemIds((prev) => prev.filter((id) => id !== item.id));
                    }
                  }}
                />
                <span>{item.resourceType}</span>
              </label>
            );
          })}
        </div>

        <p className="style-required-summary">
          Linked items: {requiredItemNames.length > 0 ? requiredItemNames.join(', ') : 'None'}
        </p>
      </section>

      <section className="style-details-panel">
        <h2>Images</h2>
        <input type="file" accept="image/*" multiple disabled={!canManage || saving} onChange={(e) => onUploadImages(e.target.files)} />

        <div className="style-images-grid">
          {imageUrls.length === 0 ? (
            <span className="style-images-empty">No style images uploaded.</span>
          ) : (
            imageUrls.map((imageUrl, index) => (
              <div key={`${imageUrl.slice(0, 24)}-${index}`} className="style-image-card">
                <img src={imageUrl} alt={`Style image ${index + 1}`} />
                <button
                  type="button"
                  onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== index))}
                  disabled={!canManage || saving}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="style-details-actions">
        <button type="button" className="style-save" onClick={onSave} disabled={!canManage || saving || !name.trim() || !description.trim()}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button type="button" className="style-delete" onClick={onDelete} disabled={!canManage || saving}>
          Delete Style
        </button>
      </div>
    </div>
  );
};

export default StyleDetailsPage;
