import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { inventoryService, roleService, userService } from '../services/userService';
import { InventoryItem, Resource } from '../types';
import InventoryTypeItemsPanel from '../components/InventoryTypeItemsPanel';
import './InventoryPage.css';

interface InventorySectionData {
  typeName: string;
  icon: string;
  items: InventoryItem[];
}

const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { resourceTypeName } = useParams<{ resourceTypeName?: string }>();
  const user = useSelector((state: RootState) => state.auth.user);
  const authEmail = useSelector((state: RootState) => state.auth.email);
  const userEmail = authEmail || user?.email || localStorage.getItem('email') || '';

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsFetchFailed, setItemsFetchFailed] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isDetailedDashboard = !!resourceTypeName;
  const decodedTypeName = resourceTypeName ? decodeURIComponent(resourceTypeName) : '';

  useEffect(() => {
    if (!userEmail) {
      setLoading(false);
      setItemsFetchFailed(true);
      setError('Missing session email');
      return;
    }

    loadInventoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  const loadInventoryData = async () => {
    if (!userEmail) {
      return;
    }

    setLoading(true);
    setItemsFetchFailed(false);

    try {
      const [currentUser, roles] = await Promise.all([
        userService.getCurrentUser(userEmail),
        roleService.getRolesForUser(userEmail),
      ]);

      const normalizeRole = (role: string) => role.toLowerCase().replace(/[\s_-]/g, '');
      const roleSet = new Set((roles || []).map((role) => normalizeRole(role)));
      const isAdmin = currentUser.accessLevel === 'Admin';
      const canCreateOrManage = isAdmin || roleSet.has('poweruser') || roleSet.has('inventorymanager') || roleSet.has('inventoryadmin');

      setCanCreate(canCreateOrManage);

      const [itemsData, resourcesData] = await Promise.all([
        inventoryService.getItems(userEmail),
        inventoryService.getResources(userEmail),
      ]);

      setItems(itemsData || []);
      setResources(resourcesData);
      setItemsFetchFailed(false);
      setError(null);
    } catch (err) {
      setItems([]);
      setResources([]);
      setItemsFetchFailed(true);
      setError('Failed to load inventory dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showInventoryLandingState = itemsFetchFailed || items.length === 0;

  const resourceCount = resources.length;
  const totalAvailable = useMemo(
    () => items.reduce((total, item) => total + (Number(item.availableQuantity) || 0), 0),
    [items]
  );
  const totalPending = useMemo(
    () => items.reduce((total, item) => total + (Number(item.pendingQuantity) || 0), 0),
    [items]
  );

  const matchesSearch = (item: InventoryItem, text: string) => {
    if (!text) {
      return true;
    }

    const normalizedText = text.toLowerCase();
    const searchableFields = [
      item.resourceType,
      item.resourceCategory,
      item.resourceSubType,
      item.resourceTags,
      item.resourceDescription,
      ...(item.customTagNames || []),
    ]
      .filter((value): value is string => !!value)
      .join(' ')
      .toLowerCase();

    return searchableFields.includes(normalizedText);
  };

  const sections = useMemo(() => {
    const map = new Map<string, InventorySectionData>();

    items.forEach((item) => {
      if (!matchesSearch(item, searchQuery)) {
        return;
      }

      const typeName = item.resourceCategory || 'Uncategorized';
      const existing = map.get(typeName);

      if (!existing) {
        map.set(typeName, {
          typeName,
          icon: item.resourceIcon || '📦',
          items: [item],
        });
        return;
      }

      existing.items.push(item);
      if (!existing.icon && item.resourceIcon) {
        existing.icon = item.resourceIcon;
      }
    });

    const resolvedSections = Array.from(map.values()).map((section) => {
      const resource = resources.find((candidate) => candidate.category === section.typeName && candidate.icon);
      if (resource?.icon) {
        return { ...section, icon: resource.icon };
      }
      return section;
    });

    return resolvedSections.sort((left, right) => left.typeName.localeCompare(right.typeName));
  }, [items, resources, searchQuery]);

  const detailedSection = useMemo(
    () => sections.find((section) => section.typeName.toLowerCase() === decodedTypeName.toLowerCase()),
    [sections, decodedTypeName]
  );

  if (loading) {
    return (
      <div className="inventory-page-content">
        <div className="loading">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="inventory-page-content">
      <div className="inventory-dashboard-header">
        <div className="inventory-dashboard-title">
          <h1>{isDetailedDashboard ? `Inventory Dashboard (${decodedTypeName})` : 'Inventory Dashboard'}</h1>
          <p>Find items fast, open details, and keep quantities accurate.</p>
        </div>
        <button
          className="inventory-compose-btn"
          onClick={() => navigate('/inventory/new')}
          disabled={!canCreate}
          title={canCreate ? 'Create resource and item' : 'Requires InventoryManager, PowerUser, or Admin'}
        >
          + Create
        </button>
      </div>

      <div className="inventory-search-wrap" role="search">
        <span className="inventory-search-icon" aria-hidden="true">🔍</span>
        <input
          type="text"
          className="inventory-search-input"
          placeholder="Search resources, resource tags, and items"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <span className="inventory-search-filter" aria-hidden="true">☰</span>
      </div>

      <div className="inventory-summary-grid">
        <div className="inventory-summary-card">
          <span>Items</span>
          <strong>{items.length}</strong>
        </div>
        <div className="inventory-summary-card">
          <span>Resources</span>
          <strong>{resourceCount}</strong>
        </div>
        <div className="inventory-summary-card">
          <span>Available Units</span>
          <strong>{totalAvailable}</strong>
        </div>
        <div className="inventory-summary-card">
          <span>Pending Units</span>
          <strong>{totalPending}</strong>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

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
              ? 'We could not load items from the database right now.'
              : 'Use Create to add your first resource and item.'}
          </p>
        </div>
      ) : isDetailedDashboard ? (
        detailedSection ? (
          <InventoryTypeItemsPanel
            title={detailedSection.typeName}
            icon={detailedSection.icon}
            items={detailedSection.items}
            mode="detailed"
            onOpenItem={(itemId) => navigate(`/inventory/items/${itemId}`)}
          />
        ) : (
          <div className="inventory-empty-dashboard">
            <h2>No items found for {decodedTypeName}</h2>
            <p className="inventory-empty-message">Try a different Resource Type section from the main dashboard.</p>
          </div>
        )
      ) : (
        <div className="inventory-sections-grid">
          {sections.map((section) => (
            <InventoryTypeItemsPanel
              key={section.typeName}
              title={section.typeName}
              icon={section.icon}
              headingLink={`/inventory/dashboard/${encodeURIComponent(section.typeName)}`}
              items={section.items}
              mode="main"
              onOpenItem={(itemId) => navigate(`/inventory/items/${itemId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
