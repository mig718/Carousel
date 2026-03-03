import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { inventoryService, roleService, userService } from '../services/userService';
import { InventoryItem, Style } from '../types';
import './StylesPage.css';

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

const StylesPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const authEmail = useSelector((state: RootState) => state.auth.email);
  const requesterEmail = authEmail || user?.email || localStorage.getItem('email') || '';

  const [styles, setStyles] = useState<Style[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [canAccessStyles, setCanAccessStyles] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requiredItemIds, setRequiredItemIds] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const shouldTreatStylesErrorAsEmpty = (error: any): boolean => {
    const status = error?.response?.status;
    const message = String(error?.response?.data?.message || error?.message || '').toLowerCase();
    return status === 404 || message.includes('not found') || message.includes('no styles');
  };

  const loadPageData = async () => {
    if (!requesterEmail) {
      return;
    }

    setLoading(true);
    try {
      const [currentUser, roles] = await Promise.all([
        userService.getCurrentUser(requesterEmail),
        roleService.getRolesForUser(requesterEmail),
      ]);

      const normalizeRole = (role: string) => role.toLowerCase().replace(/[\s_-]/g, '');
      const roleSet = new Set((roles || []).map((role) => normalizeRole(role)));
      const isAdmin = currentUser.accessLevel === 'Admin';
      const canRead = isAdmin || roleSet.has('poweruser') || roleSet.has('stylesuser') || roleSet.has('stylesmanager');
      const canEdit = isAdmin || roleSet.has('poweruser') || roleSet.has('stylesmanager');
      setCanAccessStyles(canRead);
      setCanManage(canEdit);

      if (!canRead) {
        setStyles([]);
        setItems([]);
        setError(null);
        return;
      }

      const [styleResult, itemResult] = await Promise.allSettled([
        inventoryService.getStyles(requesterEmail),
        inventoryService.getItems(requesterEmail),
      ]);

      if (styleResult.status === 'fulfilled') {
        setStyles(styleResult.value || []);
      } else {
        if (shouldTreatStylesErrorAsEmpty(styleResult.reason)) {
          setStyles([]);
        } else {
          throw styleResult.reason;
        }
      }

      if (itemResult.status === 'fulfilled') {
        setItems(itemResult.value || []);
      } else {
        setItems([]);
      }

      setError(null);
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message || err?.message;
      setError(
        backendMessage
          ? `Error while loading styles data: ${backendMessage}`
          : 'Error while loading styles data.'
      );
      setStyles([]);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requesterEmail) {
      loadPageData();
    } else {
      setLoading(false);
      setError('Missing session email');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requesterEmail]);

  const filteredStyles = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) {
      return styles;
    }

    return styles.filter((style) => {
      const searchable = [style.name, style.description, ...(style.requiredItemNames || [])].join(' ').toLowerCase();
      return searchable.includes(normalized);
    });
  }, [styles, searchQuery]);

  const totalRequiredItems = useMemo(
    () => styles.reduce((count, style) => count + (style.requiredItemIds?.length || 0), 0),
    [styles]
  );

  const totalImages = useMemo(
    () => styles.reduce((count, style) => count + (style.imageUrls?.length || 0), 0),
    [styles]
  );

  const onCreateStyle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      return;
    }

    setSaving(true);
    try {
      await inventoryService.createStyle(requesterEmail, {
        name,
        description,
        requiredItemIds,
        imageUrls,
      });

      setName('');
      setDescription('');
      setRequiredItemIds([]);
      setImageUrls([]);
      setShowCreate(false);
      await loadPageData();
      setError(null);
    } catch (err: any) {
      const backendMessage = String(err?.response?.data?.message || err?.message || '');
      const normalized = backendMessage.toLowerCase();
      if (normalized.includes('value too long for type character varying')) {
        setError('Error while saving style: style content is too large for current database schema.');
      } else {
        setError(err.response?.data?.message || 'Error while saving style.');
      }
    } finally {
      setSaving(false);
    }
  };

  const onUploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    try {
      const uploaded = await readFilesAsDataUrls(files);
      setImageUrls((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError('Failed to process one or more selected images');
    }
  };

  if (loading) {
    return <div className="styles-loading">Loading styles...</div>;
  }

  if (!canAccessStyles) {
    return <div className="error-message">You do not have access to Styles.</div>;
  }

  return (
    <div className="styles-page-content">
      <div className="styles-dashboard-header">
        <div className="styles-dashboard-title">
          <h1>Styles Dashboard</h1>
          <p>Template complete jewelry items by defining visuals and required inventory inputs.</p>
        </div>
        <button
          className="styles-compose-btn"
          onClick={() => setShowCreate((prev) => !prev)}
          disabled={!canManage}
          title={canManage ? 'Create style template' : 'Requires StylesManager, PowerUser, or Admin'}
        >
          {showCreate ? 'Close' : '+ Create Style'}
        </button>
      </div>

      <div className="styles-search-wrap" role="search">
        <span className="styles-search-icon" aria-hidden="true">🔎</span>
        <input
          type="text"
          className="styles-search-input"
          placeholder="Search styles, descriptions, and required items"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      <div className="styles-summary-grid">
        <div className="styles-summary-card">
          <span>Styles</span>
          <strong>{styles.length}</strong>
        </div>
        <div className="styles-summary-card">
          <span>Template Images</span>
          <strong>{totalImages}</strong>
        </div>
        <div className="styles-summary-card">
          <span>Required Item Links</span>
          <strong>{totalRequiredItems}</strong>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCreate && (
        <form className="styles-create-form" onSubmit={onCreateStyle}>
          <h2>Create Style</h2>

          <label>Style Name *</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Classic Solitaire Ring" />

          <label>Description *</label>
          <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />

          <label>Required Inventory Items</label>
          <div className="styles-item-grid">
            {items.map((item) => {
              const checked = requiredItemIds.includes(item.id);
              return (
                <label key={item.id} className="styles-item-checkbox">
                  <input
                    type="checkbox"
                    checked={checked}
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

          <label>Style Images</label>
          <input type="file" accept="image/*" multiple onChange={(e) => onUploadImages(e.target.files)} />
          {imageUrls.length > 0 && (
            <div className="styles-image-preview-grid">
              {imageUrls.map((imageUrl, index) => (
                <div key={`${imageUrl.slice(0, 24)}-${index}`} className="styles-image-preview">
                  <img src={imageUrl} alt={`Style preview ${index + 1}`} />
                  <button type="button" onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== index))}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="styles-form-actions">
              <button type="submit" className="styles-action-btn styles-btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Style'}
            </button>
              <button type="button" className="styles-action-btn styles-btn-secondary" onClick={() => setShowCreate(false)} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {filteredStyles.length === 0 ? (
        <div className="styles-empty-dashboard">
          <h2>No styles found</h2>
          <p>Create a style template to connect visuals and required inventory inputs.</p>
        </div>
      ) : (
        <div className="styles-card-grid">
          {filteredStyles.map((style) => (
            <article key={style.id} className="style-card">
              <div className="style-card-header">
                <h2>{style.name}</h2>
                <button type="button" onClick={() => navigate(`/styles/${style.id}`)}>Open</button>
              </div>
              <p>{style.description}</p>

              {(style.imageUrls || []).length > 0 && (
                <div className="style-card-images">
                  {style.imageUrls.slice(0, 3).map((imageUrl, index) => (
                    <img key={`${style.id}-${index}`} src={imageUrl} alt={`${style.name} reference ${index + 1}`} />
                  ))}
                </div>
              )}

              <div className="style-card-tags">
                {(style.requiredItemNames || []).length === 0 ? (
                  <span className="style-card-empty">No required inventory items</span>
                ) : (
                  style.requiredItemNames.slice(0, 6).map((nameValue) => (
                    <span key={`${style.id}-${nameValue}`} className="style-required-tag">{nameValue}</span>
                  ))
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default StylesPage;
