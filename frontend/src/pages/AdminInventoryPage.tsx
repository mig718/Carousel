import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import DataTable, { CellRenderContext } from '../components/DataTable';
import { inventoryService, userService } from '../services/userService';
import { InventoryItem, InventoryItemCustomTag, Resource, ResourceTag, ResourceType, TagGraphic, TagGraphicOption } from '../types';
import './AdminInventoryPage.css';

interface EditableTextCellProps {
  value: string;
  originalValue: string;
  onCommit: (nextValue: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  placeholder?: string;
  readOnly?: boolean;
}

const EditableTextCell: React.FC<EditableTextCellProps> = ({ value, originalValue, onCommit, isEditing, onStartEdit, onEndEdit, placeholder, readOnly = false }) => {
  const [draftValue, setDraftValue] = useState(value ?? '');

  useEffect(() => {
    setDraftValue(value ?? '');
  }, [value]);

  if (readOnly) {
    return <span className="read-only-field">{value || placeholder || '—'}</span>;
  }

  if (!isEditing) {
    return (
      <button type="button" className="editable-read" onClick={onStartEdit}>
        {value || placeholder || '—'}
      </button>
    );
  }

  return (
    <div className="editable-control">
      <input
        autoFocus
        type="text"
        value={draftValue}
        onChange={(e) => setDraftValue(e.target.value)}
        onBlur={() => {
          onCommit(draftValue);
          onEndEdit();
        }}
      />
    </div>
  );
};

interface EditableNumberCellProps {
  value: number;
  originalValue: number;
  onCommit: (nextValue: number) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
}

const EditableNumberCell: React.FC<EditableNumberCellProps> = ({ value, originalValue, onCommit, isEditing, onStartEdit, onEndEdit }) => {
  const [draftValue, setDraftValue] = useState(String(value ?? 0));

  useEffect(() => {
    setDraftValue(String(value ?? 0));
  }, [value]);

  if (!isEditing) {
    return (
      <button type="button" className="editable-read" onClick={onStartEdit}>
        {Number(value ?? 0)}
      </button>
    );
  }

  return (
    <div className="editable-control">
      <input
        autoFocus
        type="number"
        min="0"
        value={draftValue}
        onChange={(e) => setDraftValue(e.target.value)}
        onBlur={() => {
          onCommit(Number(draftValue) || 0);
          onEndEdit();
        }}
      />
    </div>
  );
};

interface EditableColorSwatchProps {
  value?: string;
  onCommit: (nextValue: string) => void;
  readOnly?: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
}

interface FormColorPickerProps {
  value: string;
  onChange: (nextValue: string) => void;
}

const EditableColorSwatch: React.FC<EditableColorSwatchProps> = ({ value, onCommit, readOnly = false, isEditing, onStartEdit, onEndEdit }) => {
  const resolvedValue = (value && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#4F46E5').toUpperCase();

  if (readOnly) {
    return (
      <div className="tag-color-cell">
        <span className="tag-color-swatch-button read-only" aria-label={`Tag color ${resolvedValue}`}>
          <span className="tag-color-swatch" style={{ backgroundColor: resolvedValue }} />
        </span>
      </div>
    );
  }

  return (
    <div className="tag-color-cell">
      <label
        className={`tag-color-swatch-button${isEditing ? ' is-editing' : ''}`}
        aria-label={`Edit tag color ${resolvedValue}`}
      >
        <input
          className="tag-color-picker-input"
          type="color"
          value={resolvedValue}
          onFocus={onStartEdit}
          onClick={(event) => {
            event.stopPropagation();
            onStartEdit();
          }}
          onChange={(e) => {
            onCommit(e.target.value.toUpperCase());
            onEndEdit();
          }}
          onBlur={onEndEdit}
        />
        <span className="tag-color-swatch" style={{ backgroundColor: resolvedValue }} />
      </label>
    </div>
  );
};

const FormColorPicker: React.FC<FormColorPickerProps> = ({ value, onChange }) => {
  const resolvedValue = (value && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#4F46E5').toUpperCase();

  return (
    <div className="form-color-picker">
      <label className="tag-color-swatch-button" aria-label={`Select color ${resolvedValue}`}>
        <input
          className="tag-color-picker-input"
          type="color"
          value={resolvedValue}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
        />
        <span className="tag-color-swatch" style={{ backgroundColor: resolvedValue }} />
      </label>
    </div>
  );
};

const AdminInventoryPage: React.FC = () => {
  const requesterEmail = localStorage.getItem('email') || '';

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [resourceTags, setResourceTags] = useState<ResourceTag[]>([]);
  const [tagGraphics, setTagGraphics] = useState<TagGraphicOption[]>([]);
  const [resourceIcons, setResourceIcons] = useState<string[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [itemCustomTags, setItemCustomTags] = useState<InventoryItemCustomTag[]>([]);

  const [showTypeForm, setShowTypeForm] = useState(false);
  const [showTagForm, setShowTagForm] = useState(false);
  const [showItemCustomTagForm, setShowItemCustomTagForm] = useState(false);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);

  const [typeForm, setTypeForm] = useState({ name: '', description: '', icon: '💎' });
  const [tagForm, setTagForm] = useState({ name: '', description: '', color: '#4F46E5', graphic: TagGraphic.Diamond });
  const [itemCustomTagForm, setItemCustomTagForm] = useState({ name: '', description: '', color: '#4F46E5', graphic: TagGraphic.Diamond });
  const [resourceForm, setResourceForm] = useState({ resourceTypeId: '', selectedTagIds: [] as string[], description: '' });
  const [itemForm, setItemForm] = useState({ resourceId: '', availableQuantity: '0', pendingQuantity: '0' });

  const loadPageData = async () => {
    try {
      const [typeData, tagData, graphicData, iconData, resourceData, itemData, itemCustomTagData] = await Promise.all([
        inventoryService.getResourceTypes(requesterEmail),
        inventoryService.getResourceTags(requesterEmail),
        inventoryService.getTagGraphics(requesterEmail),
        inventoryService.getResourceIcons(requesterEmail),
        inventoryService.getResources(requesterEmail),
        inventoryService.getItems(requesterEmail),
        inventoryService.getItemCustomTags(requesterEmail),
      ]);

      setResourceTypes(typeData || []);
      setResourceTags(tagData || []);
      setTagGraphics(graphicData || []);
      setResourceIcons(iconData || []);
      setResources(resourceData || []);
      setItems(itemData || []);
      setItemCustomTags(itemCustomTagData || []);

      const defaultGraphic = (graphicData && graphicData.length > 0 ? graphicData[0].key : TagGraphic.Diamond) as TagGraphic;
      setTagForm((prev) => ({ ...prev, graphic: prev.graphic || defaultGraphic }));
      setItemCustomTagForm((prev) => ({ ...prev, graphic: prev.graphic || defaultGraphic }));
      setLoadError(null);
    } catch (err: any) {
      setLoadError(err.response?.data?.message || 'Failed to load data');
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = await userService.getCurrentUser(requesterEmail);
        const hasAdminAccess = currentUser.accessLevel === 'Admin';
        setIsAdmin(hasAdminAccess);
        if (!hasAdminAccess) {
          return;
        }

        await loadPageData();
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

  const selectedResourceType = useMemo(
    () => resourceTypes.find((type) => type.id === resourceForm.resourceTypeId),
    [resourceTypes, resourceForm.resourceTypeId]
  );

  const selectedTagNames = useMemo(() => {
    const tagById = new Map(resourceTags.map((tag) => [tag.id, tag.name]));
    return resourceForm.selectedTagIds
      .map((id) => tagById.get(id))
      .filter((name): name is string => !!name)
      .sort((a, b) => a.localeCompare(b));
  }, [resourceForm.selectedTagIds, resourceTags]);

  const tagGraphicIconByKey = useMemo(
    () => new Map(tagGraphics.map((graphic) => [graphic.key, graphic.icon])),
    [tagGraphics]
  );

  const resourcePreviewName = useMemo(() => {
    if (!selectedResourceType) {
      return '';
    }
    const prefix = selectedTagNames.join(' ').trim();
    return `${prefix ? `${prefix} ` : ''}${selectedResourceType.name}`.trim();
  }, [selectedResourceType, selectedTagNames]);

  const tagsForResource = (resource: Resource): string[] => {
    if (Array.isArray(resource.tags) && resource.tags.length > 0) {
      return resource.tags;
    }

    return (resource.subType || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  };

  const resolveResourceTagIds = (resource: Resource): string[] => {
    const targetTags = tagsForResource(resource).map((tag) => tag.toLowerCase());
    return resourceTags
      .filter((tag) => targetTags.includes(tag.name.toLowerCase()))
      .map((tag) => tag.id);
  };

  const onCreateResourceType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await inventoryService.createResourceType(requesterEmail, {
        name: typeForm.name,
        description: typeForm.description,
        icon: typeForm.icon,
      });
      setResourceTypes((prev) => [...prev, created]);
      setTypeForm({ name: '', description: '', icon: resourceIcons[0] || '💎' });
      setShowTypeForm(false);
      setActionError(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to create resource type');
    }
  };

  const onUpdateResourceType = async (id: string, updates: Partial<ResourceType>) => {
    const existing = resourceTypes.find((type) => type.id === id);
    if (!existing) {
      throw new Error('Resource type not found');
    }

    if (!existing.editable) {
      throw new Error('Predefined resource types cannot be edited');
    }

    try {
      const updated = await inventoryService.updateResourceType(requesterEmail, id, {
        name: updates.name ?? existing.name,
        description: updates.description ?? existing.description,
        icon: updates.icon ?? existing.icon,
      });
      setResourceTypes((prev) => prev.map((type) => (type.id === id ? updated : type)));
      setResources((prev) =>
        prev.map((resource) =>
          resource.resourceTypeId === id
            ? {
                ...resource,
                category: updated.name,
                icon: updated.icon,
              }
            : resource
        )
      );
      setActionError(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to update resource type');
      throw err;
    }
  };

  const onDeleteResourceType = async (id: string) => {
    const existing = resourceTypes.find((type) => type.id === id);
    if (!existing || !existing.editable) {
      setActionError('Predefined resource types cannot be deleted');
      return;
    }

    if (!window.confirm(`Delete resource type "${existing.name}"?`)) {
      return;
    }

    try {
      await inventoryService.deleteResourceType(requesterEmail, id);
      setResourceTypes((prev) => prev.filter((type) => type.id !== id));
      setActionError(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to delete resource type');
      throw err;
    }
  };

  const onCreateResourceTag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await inventoryService.createResourceTag(requesterEmail, {
        name: tagForm.name,
        description: tagForm.description,
        color: tagForm.color,
        graphic: tagForm.graphic,
      });
      setResourceTags((prev) => [...prev, created]);
      setTagForm((prev) => ({ ...prev, name: '', description: '' }));
      setShowTagForm(false);
      setActionError(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to create resource tag');
    }
  };

  const onUpdateResourceTag = async (id: string, updates: Partial<ResourceTag>) => {
    const existing = resourceTags.find((tag) => tag.id === id);
    if (!existing) {
      throw new Error('Resource tag not found');
    }

    if (!existing.editable) {
      throw new Error('Predefined resource tags cannot be edited');
    }

    try {
      const updated = await inventoryService.updateResourceTag(requesterEmail, id, {
        name: updates.name ?? existing.name,
        description: updates.description ?? existing.description,
        color: updates.color ?? existing.color,
        graphic: updates.graphic ?? existing.graphic,
      });
      setResourceTags((prev) => prev.map((tag) => (tag.id === id ? updated : tag)));
      await loadPageData();
      setActionError(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to update resource tag');
      throw err;
    }
  };

  const onDeleteResourceTag = async (id: string) => {
    const existing = resourceTags.find((tag) => tag.id === id);
    if (!existing || !existing.editable) {
      setActionError('Predefined resource tags cannot be deleted');
      return;
    }

    if (!window.confirm(`Delete resource tag "${existing.name}"?`)) {
      return;
    }

    try {
      await inventoryService.deleteResourceTag(requesterEmail, id);
      setResourceTags((prev) => prev.filter((tag) => tag.id !== id));
      setActionError(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to delete resource tag');
      throw err;
    }
  };

  const onCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const created = await inventoryService.createResource(requesterEmail, {
        resourceTypeId: resourceForm.resourceTypeId,
        tagIds: resourceForm.selectedTagIds,
        category: selectedResourceType?.name || '',
        type: resourcePreviewName,
        subType: selectedTagNames.join(', '),
        description: resourceForm.description,
      });

      setResources((prev) => [...prev, created]);
      setResourceForm({ resourceTypeId: '', selectedTagIds: [], description: '' });
      setShowResourceForm(false);
      setActionError(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to create resource');
    }
  };

  const onCreateItemCustomTag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await inventoryService.createItemCustomTag(requesterEmail, {
        name: itemCustomTagForm.name,
        description: itemCustomTagForm.description,
        color: itemCustomTagForm.color,
        graphic: itemCustomTagForm.graphic,
      });
      setItemCustomTags((prev) => [...prev, created]);
      setItemCustomTagForm((prev) => ({ ...prev, name: '', description: '' }));
      setShowItemCustomTagForm(false);
      setActionError(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to create custom tag');
    }
  };

  const onUpdateItemCustomTag = async (id: string, updates: Partial<InventoryItemCustomTag>) => {
    const existing = itemCustomTags.find((tag) => tag.id === id);
    if (!existing) {
      throw new Error('Inventory custom tag not found');
    }

    if (!existing.editable) {
      throw new Error('Predefined inventory custom tags cannot be edited');
    }

    try {
      const updated = await inventoryService.updateItemCustomTag(requesterEmail, id, {
        name: updates.name ?? existing.name,
        description: updates.description ?? existing.description,
        color: updates.color ?? existing.color,
        graphic: updates.graphic ?? existing.graphic,
      });
      setItemCustomTags((prev) => prev.map((tag) => (tag.id === id ? updated : tag)));
      await loadPageData();
      setActionError(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to update custom tag');
      throw err;
    }
  };

  const onDeleteItemCustomTag = async (id: string) => {
    const existing = itemCustomTags.find((tag) => tag.id === id);
    if (!existing || !existing.editable) {
      setActionError('Predefined inventory custom tags cannot be deleted');
      return;
    }

    if (!window.confirm(`Delete inventory custom tag "${existing.name}"?`)) {
      return;
    }

    try {
      await inventoryService.deleteItemCustomTag(requesterEmail, id);
      setItemCustomTags((prev) => prev.filter((tag) => tag.id !== id));
      setActionError(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to delete custom tag');
      throw err;
    }
  };

  const onUpdateResource = async (id: string, updates: Partial<Resource>) => {
    const existing = resources.find((resource) => resource.id === id);
    if (!existing) {
      throw new Error('Resource not found');
    }

    try {
      const updated = await inventoryService.updateResource(requesterEmail, id, {
        resourceTypeId: existing.resourceTypeId || '',
        tagIds: resolveResourceTagIds(existing),
        category: existing.category,
        type: existing.type,
        subType: existing.subType,
        description: updates.description ?? existing.description,
      });
      setResources((prev) => prev.map((resource) => (resource.id === id ? updated : resource)));
      setItems((prev) =>
        prev.map((item) =>
          item.resourceId === id
            ? {
                ...item,
                resourceCategory: updated.category,
                resourceType: updated.type,
                resourceSubType: updated.subType,
                resourceIcon: updated.icon,
                resourceTags: (updated.tags || []).join(', '),
                resourceDescription: updated.description,
              }
            : item
        )
      );
      setActionError(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to update resource');
      throw err;
    }
  };

  const onCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const created = await inventoryService.createItem(requesterEmail, {
        resourceId: itemForm.resourceId,
        availableQuantity: Number(itemForm.availableQuantity) || 0,
        pendingQuantity: Number(itemForm.pendingQuantity) || 0,
      });
      setItems((prev) => [...prev, created]);
      setItemForm({ resourceId: '', availableQuantity: '0', pendingQuantity: '0' });
      setShowItemForm(false);
      setActionError(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to create item');
    }
  };

  const onUpdateItem = async (id: string, updates: Partial<InventoryItem>) => {
    const existing = items.find((item) => item.id === id);
    if (!existing) {
      throw new Error('Item not found');
    }

    try {
      const updated = await inventoryService.updateItem(requesterEmail, id, {
        resourceId: existing.resourceId,
        availableQuantity: updates.availableQuantity !== undefined ? Number(updates.availableQuantity) : existing.availableQuantity,
        pendingQuantity: updates.pendingQuantity !== undefined ? Number(updates.pendingQuantity) : existing.pendingQuantity,
      });
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      setActionError(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to update item');
      throw err;
    }
  };

  const adjustItem = async (itemId: string, delta: number) => {
    try {
      const updated = await inventoryService.adjustQuantity(requesterEmail, itemId, delta);
      setItems((prev) => prev.map((item) => (item.id === itemId ? updated : item)));
      setActionError(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to adjust quantity');
    }
  };

  const resourceTypeColumns = [
    {
      key: 'icon',
      label: 'Icon',
      render: (value: string) => <span className="icon-cell">{value || '📦'}</span>,
    },
    {
      key: 'name',
      label: 'Resource Type',
      required: true,
      render: (
        value: string,
        row: ResourceType,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string,
        context: CellRenderContext
      ) => (
        <EditableTextCell
          value={value || ''}
          originalValue={originalValue || ''}
          onCommit={(nextValue) => onCommit('name', nextValue, originalValue || '')}
          isEditing={context.isEditing}
          onStartEdit={context.beginEdit}
          onEndEdit={context.endEdit}
          readOnly={!row.editable}
        />
      ),
    },
    {
      key: 'description',
      label: 'Description',
      required: true,
      render: (
        value: string,
        row: ResourceType,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string,
        context: CellRenderContext
      ) => (
        <EditableTextCell
          value={value || ''}
          originalValue={originalValue || ''}
          onCommit={(nextValue) => onCommit('description', nextValue, originalValue || '')}
          isEditing={context.isEditing}
          onStartEdit={context.beginEdit}
          onEndEdit={context.endEdit}
          readOnly={!row.editable}
        />
      ),
    },
  ];

  const resourceTagColumns = [
    {
      key: 'name',
      label: 'Resource Tag',
      required: true,
      render: (
        value: string,
        row: ResourceTag,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string,
        context: CellRenderContext
      ) => (
        <EditableTextCell
          value={value || ''}
          originalValue={originalValue || ''}
          onCommit={(nextValue) => onCommit('name', nextValue, originalValue || '')}
          isEditing={context.isEditing}
          onStartEdit={context.beginEdit}
          onEndEdit={context.endEdit}
          readOnly={!row.editable}
        />
      ),
    },
    {
      key: 'graphic',
      label: 'Graphic',
      render: (value: string) => {
        const icon = tagGraphicIconByKey.get(value as TagGraphic) || '🏷️';
        return <span className="icon-cell">{icon}</span>;
      },
    },
    {
      key: 'color',
      label: 'Color',
      render: (
        value: string,
        row: ResourceTag,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string,
        context: CellRenderContext
      ) => (
        <EditableColorSwatch
          value={value}
          onCommit={(nextValue) => onCommit('color', nextValue, (originalValue || '#4F46E5').toUpperCase())}
          readOnly={!row.editable}
          isEditing={context.isEditing}
          onStartEdit={context.beginEdit}
          onEndEdit={context.endEdit}
        />
      ),
    },
    {
      key: 'description',
      label: 'Description',
      required: true,
      render: (
        value: string,
        row: ResourceTag,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string,
        context: CellRenderContext
      ) => (
        <EditableTextCell
          value={value || ''}
          originalValue={originalValue || ''}
          onCommit={(nextValue) => onCommit('description', nextValue, originalValue || '')}
          isEditing={context.isEditing}
          onStartEdit={context.beginEdit}
          onEndEdit={context.endEdit}
          readOnly={!row.editable}
        />
      ),
    },
  ];

  const resourceColumns = [
    {
      key: 'icon',
      label: 'Icon',
      render: (value: string, row: Resource) => <span className="icon-cell">{row.icon || value || '📦'}</span>,
    },
    { key: 'category', label: 'Resource Type' },
    { key: 'type', label: 'Resource' },
    {
      key: 'subType',
      label: 'Resource Tags',
      render: (value: string, row: Resource) => <span>{(row.tags || []).join(', ') || row.subType || value || '—'}</span>,
    },
    {
      key: 'description',
      label: 'Description',
      render: (
        value: string,
        row: Resource,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string,
        context: CellRenderContext
      ) => (
        <EditableTextCell
          value={value || ''}
          originalValue={originalValue || ''}
          onCommit={(nextValue) => onCommit('description', nextValue, originalValue || '')}
          isEditing={context.isEditing}
          onStartEdit={context.beginEdit}
          onEndEdit={context.endEdit}
          placeholder="Add description"
        />
      ),
    },
  ];

  const itemCustomTagColumns = [
    {
      key: 'name',
      label: 'Custom Tag',
      required: true,
      render: (
        value: string,
        row: InventoryItemCustomTag,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string,
        context: CellRenderContext
      ) => (
        <EditableTextCell
          value={value || ''}
          originalValue={originalValue || ''}
          onCommit={(nextValue) => onCommit('name', nextValue, originalValue || '')}
          isEditing={context.isEditing}
          onStartEdit={context.beginEdit}
          onEndEdit={context.endEdit}
          readOnly={!row.editable}
        />
      ),
    },
    {
      key: 'graphic',
      label: 'Graphic',
      render: (value: string) => {
        const icon = tagGraphicIconByKey.get(value as TagGraphic) || '🏷️';
        return <span className="icon-cell">{icon}</span>;
      },
    },
    {
      key: 'color',
      label: 'Color',
      render: (
        value: string,
        row: InventoryItemCustomTag,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string,
        context: CellRenderContext
      ) => (
        <EditableColorSwatch
          value={value}
          onCommit={(nextValue) => onCommit('color', nextValue, (originalValue || '#4F46E5').toUpperCase())}
          readOnly={!row.editable}
          isEditing={context.isEditing}
          onStartEdit={context.beginEdit}
          onEndEdit={context.endEdit}
        />
      ),
    },
    {
      key: 'description',
      label: 'Description',
      required: true,
      render: (
        value: string,
        row: InventoryItemCustomTag,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string,
        context: CellRenderContext
      ) => (
        <EditableTextCell
          value={value || ''}
          originalValue={originalValue || ''}
          onCommit={(nextValue) => onCommit('description', nextValue, originalValue || '')}
          isEditing={context.isEditing}
          onStartEdit={context.beginEdit}
          onEndEdit={context.endEdit}
          readOnly={!row.editable}
        />
      ),
    },
  ];

  const inventoryColumns = [
    {
      key: 'resourceIcon',
      label: 'Icon',
      render: (value: string) => <span className="icon-cell">{value || '📦'}</span>,
    },
    { key: 'resourceCategory', label: 'Resource Type' },
    { key: 'resourceType', label: 'Resource' },
    { key: 'resourceTags', label: 'Resource Tags' },
    {
      key: 'availableQuantity',
      label: 'Available',
      render: (
        value: number,
        row: InventoryItem,
        onCommit: (field: string, value: number, originalValue: number) => void,
        isModified: boolean,
        originalValue: number,
        context: CellRenderContext
      ) => (
        <EditableNumberCell
          value={Number(value ?? 0)}
          originalValue={Number(originalValue ?? 0)}
          onCommit={(nextValue) => onCommit('availableQuantity', nextValue, Number(originalValue ?? 0))}
          isEditing={context.isEditing}
          onStartEdit={context.beginEdit}
          onEndEdit={context.endEdit}
        />
      ),
    },
    {
      key: 'pendingQuantity',
      label: 'Pending/Reserved',
      render: (
        value: number,
        row: InventoryItem,
        onCommit: (field: string, value: number, originalValue: number) => void,
        isModified: boolean,
        originalValue: number,
        context: CellRenderContext
      ) => (
        <EditableNumberCell
          value={Number(value ?? 0)}
          originalValue={Number(originalValue ?? 0)}
          onCommit={(nextValue) => onCommit('pendingQuantity', nextValue, Number(originalValue ?? 0))}
          isEditing={context.isEditing}
          onStartEdit={context.beginEdit}
          onEndEdit={context.endEdit}
        />
      ),
    },
    {
      key: 'quickAdjust',
      label: 'Quick ±',
      render: (_value: unknown, row: InventoryItem) => (
        <div className="quick-adjust-actions">
          <button type="button" className="btn-sm-adjust" onClick={() => adjustItem(row.id, -1)}>
            -1
          </button>
          <button type="button" className="btn-sm-adjust" onClick={() => adjustItem(row.id, 1)}>
            +1
          </button>
        </div>
      ),
    },
  ];

  if (!loading && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="admin-inventory-container">
      {actionError && <div className="error-message">{actionError}</div>}

      <section className="inventory-section section-resource-types">
        <h2>Resource Types</h2>
        <DataTable
          columns={resourceTypeColumns}
          data={resourceTypes}
          onRowUpdate={onUpdateResourceType}
          onRowDelete={onDeleteResourceType}
          canDeleteRow={(row) => !!row.editable}
          isLoading={loading}
          error={loadError}
          emptyMessage="No resource types found"
          canAdd
          onAddClick={() => setShowTypeForm((prev) => !prev)}
        />

        {showTypeForm && (
          <form className="inventory-form" onSubmit={onCreateResourceType}>
            <h3>Add Type</h3>
            <label>Name *</label>
            <input required value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} placeholder="e.g. Alloy" />

            <label>Icon *</label>
            <select required value={typeForm.icon} onChange={(e) => setTypeForm({ ...typeForm, icon: e.target.value })}>
              {resourceIcons.map((icon) => (
                <option key={icon} value={icon}>{icon}</option>
              ))}
            </select>

            <label>Description *</label>
            <textarea required rows={3} value={typeForm.description} onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} />

            <div className="inventory-form-actions">
              <button type="submit" className="btn-primary">Save Type</button>
              <button type="button" className="btn-secondary" onClick={() => setShowTypeForm(false)}>Cancel</button>
            </div>
          </form>
        )}
      </section>

      <section className="inventory-section section-resource-tags">
        <h2>Resource Tags</h2>
        <DataTable
          columns={resourceTagColumns}
          data={resourceTags}
          onRowUpdate={onUpdateResourceTag}
          onRowDelete={onDeleteResourceTag}
          canDeleteRow={(row) => !!row.editable}
          isLoading={loading}
          error={loadError}
          emptyMessage="No resource tags found"
          canAdd
          onAddClick={() => setShowTagForm((prev) => !prev)}
        />

        {showTagForm && (
          <form className="inventory-form" onSubmit={onCreateResourceTag}>
            <h3>Add Tag</h3>
            <label>Resource Tag *</label>
            <input required value={tagForm.name} onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })} placeholder="e.g. matte" />

            <div className="optional-field-stack">
              <div className="optional-field-row">
                <label className="optional-field-label">Icon (Optional)</label>
                <select className="optional-field-control" value={tagForm.graphic} onChange={(e) => setTagForm({ ...tagForm, graphic: e.target.value as TagGraphic })}>
                  {tagGraphics.map((graphic) => (
                    <option key={graphic.key} value={graphic.key}>{graphic.icon}</option>
                  ))}
                </select>
              </div>

              <div className="optional-field-row">
                <label className="optional-field-label">Color (Optional)</label>
                <div className="optional-field-control">
                  <FormColorPicker value={tagForm.color} onChange={(nextValue) => setTagForm({ ...tagForm, color: nextValue })} />
                </div>
              </div>
            </div>

            <label>Description *</label>
            <textarea required rows={2} value={tagForm.description} onChange={(e) => setTagForm({ ...tagForm, description: e.target.value })} />

            <div className="inventory-form-actions">
              <button type="submit" className="btn-primary">Save Tag</button>
              <button type="button" className="btn-secondary" onClick={() => setShowTagForm(false)}>Cancel</button>
            </div>
          </form>
        )}
      </section>

      <section className="inventory-section section-resources">
        <h2>Resources (Definitions)</h2>
        <DataTable
          columns={resourceColumns}
          data={resources}
          onRowUpdate={onUpdateResource}
          isLoading={loading}
          error={loadError}
          emptyMessage="No resources found"
          canAdd
          onAddClick={() => setShowResourceForm((prev) => !prev)}
        />

        {showResourceForm && (
          <form className="inventory-form" onSubmit={onCreateResource}>
            <h3>Add Resource</h3>
            <label>Resource Type *</label>
            <select required value={resourceForm.resourceTypeId} onChange={(e) => setResourceForm({ ...resourceForm, resourceTypeId: e.target.value })}>
              <option value="">Select type</option>
              {resourceTypes.map((type) => (
                <option key={type.id} value={type.id}>{`${type.icon} ${type.name}`}</option>
              ))}
            </select>

            <label>Resource Tags</label>
            <div className="tag-grid">
              {resourceTags.map((tag) => {
                const checked = resourceForm.selectedTagIds.includes(tag.id);
                return (
                  <label key={tag.id} className="tag-checkbox">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setResourceForm((prev) => ({ ...prev, selectedTagIds: [...prev.selectedTagIds, tag.id] }));
                        } else {
                          setResourceForm((prev) => ({ ...prev, selectedTagIds: prev.selectedTagIds.filter((id) => id !== tag.id) }));
                        }
                      }}
                    />
                    <span>{tag.name}</span>
                  </label>
                );
              })}
            </div>

            <div className="full-type-preview">
              <strong>Resource Preview:</strong> {resourcePreviewName || 'Select Resource Type and Resource Tags'}
            </div>

            <label>Description *</label>
            <textarea required rows={3} value={resourceForm.description} onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })} />

            <div className="inventory-form-actions">
              <button type="submit" className="btn-primary">Save Resource</button>
              <button type="button" className="btn-secondary" onClick={() => setShowResourceForm(false)}>Cancel</button>
            </div>
          </form>
        )}
      </section>

      <section className="inventory-section section-inventory-tags">
        <h2>Inventory Custom Tags</h2>
        <DataTable
          columns={itemCustomTagColumns}
          data={itemCustomTags}
          onRowUpdate={onUpdateItemCustomTag}
          onRowDelete={onDeleteItemCustomTag}
          canDeleteRow={(row) => !!row.editable}
          isLoading={loading}
          error={loadError}
          emptyMessage="No custom tags found"
          canAdd
          onAddClick={() => setShowItemCustomTagForm((prev) => !prev)}
        />

        {showItemCustomTagForm && (
          <form className="inventory-form" onSubmit={onCreateItemCustomTag}>
            <h3>Add Custom Tag</h3>
            <label>Name *</label>
            <input required value={itemCustomTagForm.name} onChange={(e) => setItemCustomTagForm({ ...itemCustomTagForm, name: e.target.value })} placeholder="e.g. urgent" />

            <div className="optional-field-stack">
              <div className="optional-field-row">
                <label className="optional-field-label">Icon (Optional)</label>
                <select className="optional-field-control" value={itemCustomTagForm.graphic} onChange={(e) => setItemCustomTagForm({ ...itemCustomTagForm, graphic: e.target.value as TagGraphic })}>
                  {tagGraphics.map((graphic) => (
                    <option key={graphic.key} value={graphic.key}>{graphic.icon}</option>
                  ))}
                </select>
              </div>

              <div className="optional-field-row">
                <label className="optional-field-label">Color (Optional)</label>
                <div className="optional-field-control">
                  <FormColorPicker value={itemCustomTagForm.color} onChange={(nextValue) => setItemCustomTagForm({ ...itemCustomTagForm, color: nextValue })} />
                </div>
              </div>
            </div>

            <label>Description *</label>
            <textarea required rows={2} value={itemCustomTagForm.description} onChange={(e) => setItemCustomTagForm({ ...itemCustomTagForm, description: e.target.value })} />

            <div className="inventory-form-actions">
              <button type="submit" className="btn-primary">Save Tag</button>
              <button type="button" className="btn-secondary" onClick={() => setShowItemCustomTagForm(false)}>Cancel</button>
            </div>
          </form>
        )}
      </section>

      <section className="inventory-section section-inventory-items">
        <h2>Items</h2>
        <DataTable
          columns={inventoryColumns}
          data={items}
          onRowUpdate={onUpdateItem}
          isLoading={loading}
          error={loadError}
          emptyMessage="No items found"
          canAdd
          onAddClick={() => setShowItemForm((prev) => !prev)}
        />

        {showItemForm && (
          <form className="inventory-form" onSubmit={onCreateItem}>
            <h3>Add Item</h3>

            <label>Resource Definition *</label>
            <select required value={itemForm.resourceId} onChange={(e) => setItemForm({ ...itemForm, resourceId: e.target.value })}>
              <option value="">Select Resource</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>{`${resource.icon || '📦'} ${resource.type}`}</option>
              ))}
            </select>

            <label>Available Quantity *</label>
            <input type="number" min="0" required value={itemForm.availableQuantity} onChange={(e) => setItemForm({ ...itemForm, availableQuantity: e.target.value })} />

            <label>Pending/Reserved Quantity *</label>
            <input type="number" min="0" required value={itemForm.pendingQuantity} onChange={(e) => setItemForm({ ...itemForm, pendingQuantity: e.target.value })} />

            <div className="inventory-form-actions">
              <button type="submit" className="btn-primary">Save Item</button>
              <button type="button" className="btn-secondary" onClick={() => setShowItemForm(false)}>Cancel</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};

export default AdminInventoryPage;
