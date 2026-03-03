import React, { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import DataTable, { CellRenderContext, DataTableHandle } from '../components/DataTable';
import { inventoryService, userService } from '../services/userService';
import { InventoryItem, Style } from '../types';
import './AdminStylesPage.css';

const parseItemIds = (raw: string): string[] =>
  raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

const parseImageUrls = (raw: string): string[] =>
  raw
    .split('|')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

const EditableTextCell: React.FC<{
  value: string;
  originalValue: string;
  placeholder?: string;
  onCommit: (nextValue: string) => void;
  context: CellRenderContext;
}> = ({ value, originalValue, placeholder, onCommit, context }) => {
  if (!context.isEditing) {
    return (
      <button type="button" className="admin-styles-inline-read" onClick={context.beginEdit}>
        {value || placeholder || '—'}
      </button>
    );
  }

  return (
    <input
      autoFocus
      className="admin-styles-inline-input"
      value={value || ''}
      onChange={(e) => onCommit(e.target.value)}
      onBlur={() => context.endEdit()}
    />
  );
};

const AdminStylesPage: React.FC = () => {
  const requesterEmail = localStorage.getItem('email') || '';
  const tableRef = useRef<DataTableHandle>(null);

  const [styles, setStyles] = useState<Style[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [stylesData, itemData] = await Promise.all([
        inventoryService.getStyles(requesterEmail),
        inventoryService.getItems(requesterEmail),
      ]);

      setStyles(stylesData || []);
      setItems(itemData || []);
      setLoadError(null);
    } catch (err: any) {
      setLoadError(err.response?.data?.message || 'Failed to load styles');
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

        await loadData();
      } finally {
        setLoading(false);
      }
    };

    if (requesterEmail) {
      load();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requesterEmail]);

  const onUpdateStyle = async (styleId: string, updates: Record<string, any>) => {
    const existing = styles.find((style) => style.id === styleId);
    if (!existing) {
      throw new Error('Style not found');
    }

    try {
      const updated = await inventoryService.updateStyle(requesterEmail, styleId, {
        name: updates.name ?? existing.name,
        description: updates.description ?? existing.description,
        requiredItemIds: updates.requiredItemIdsCsv !== undefined ? parseItemIds(updates.requiredItemIdsCsv) : existing.requiredItemIds,
        imageUrls: updates.imageUrlsPipe !== undefined ? parseImageUrls(updates.imageUrlsPipe) : existing.imageUrls,
      });
      setStyles((prev) => prev.map((style) => (style.id === styleId ? updated : style)));
      setActionError(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to update style');
      throw err;
    }
  };

  const onCreateStyle = async (rowData: any) => {
    try {
      const created = await inventoryService.createStyle(requesterEmail, {
        name: rowData.name || '',
        description: rowData.description || '',
        requiredItemIds: parseItemIds(rowData.requiredItemIdsCsv || ''),
        imageUrls: parseImageUrls(rowData.imageUrlsPipe || ''),
      });
      setStyles((prev) => [...prev, created]);
      setActionError(null);
      return created.id;
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to create style');
      throw err;
    }
  };

  const onDeleteStyle = async (styleId: string) => {
    const existing = styles.find((style) => style.id === styleId);
    if (!existing) {
      return;
    }

    if (!window.confirm(`Delete style "${existing.name}"?`)) {
      return;
    }

    try {
      await inventoryService.deleteStyle(requesterEmail, styleId);
      setStyles((prev) => prev.filter((style) => style.id !== styleId));
      setActionError(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to delete style');
    }
  };

  if (!loading && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const styleRows = styles.map((style) => ({
    ...style,
    requiredItemIdsCsv: (style.requiredItemIds || []).join(', '),
    imageUrlsPipe: (style.imageUrls || []).join(' | '),
    requiredItemCount: style.requiredItemIds?.length || 0,
    imageCount: style.imageUrls?.length || 0,
  }));

  const styleColumns = [
    {
      key: 'name',
      label: 'Style Name',
      required: true,
      render: (
        value: string,
        row: any,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string,
        context: CellRenderContext
      ) => (
        <EditableTextCell
          value={value}
          originalValue={originalValue || ''}
          placeholder="Enter style name"
          onCommit={(nextValue) => {
            onCommit('name', nextValue, originalValue || '');
            context.setFieldValidity(nextValue.trim().length > 0);
          }}
          context={context}
        />
      ),
    },
    {
      key: 'description',
      label: 'Description',
      required: true,
      render: (
        value: string,
        row: any,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string,
        context: CellRenderContext
      ) => (
        <EditableTextCell
          value={value}
          originalValue={originalValue || ''}
          placeholder="Enter style description"
          onCommit={(nextValue) => {
            onCommit('description', nextValue, originalValue || '');
            context.setFieldValidity(nextValue.trim().length > 0);
          }}
          context={context}
        />
      ),
    },
    {
      key: 'requiredItemIdsCsv',
      label: 'Required Item IDs (comma)',
      render: (
        value: string,
        row: any,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string,
        context: CellRenderContext
      ) => (
        <EditableTextCell
          value={value}
          originalValue={originalValue || ''}
          placeholder="item-id-1, item-id-2"
          onCommit={(nextValue) => onCommit('requiredItemIdsCsv', nextValue, originalValue || '')}
          context={context}
        />
      ),
    },
    {
      key: 'imageUrlsPipe',
      label: 'Image URLs (| separated)',
      render: (
        value: string,
        row: any,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string,
        context: CellRenderContext
      ) => (
        <EditableTextCell
          value={value}
          originalValue={originalValue || ''}
          placeholder="https://img-1 | https://img-2"
          onCommit={(nextValue) => onCommit('imageUrlsPipe', nextValue, originalValue || '')}
          context={context}
        />
      ),
    },
    {
      key: 'requiredItemCount',
      label: 'Item Links',
    },
    {
      key: 'imageCount',
      label: 'Images',
    },
  ];

  return (
    <div className="admin-styles-page">
      {actionError && <div className="error-message">{actionError}</div>}

      <section className="admin-styles-section">
        <h2>Styles</h2>
        <p className="admin-styles-hint">
          Use direct table edits for quick updates. Required item IDs must match Inventory Item IDs.
          {(items || []).length > 0 ? ` Inventory items available: ${items.length}.` : ''}
        </p>

        <DataTable
          ref={tableRef}
          columns={styleColumns}
          data={styleRows}
          onRowUpdate={onUpdateStyle}
          onRowCreate={onCreateStyle}
          onRowDelete={onDeleteStyle}
          isLoading={loading}
          error={loadError}
          emptyMessage="No styles found"
          canAdd
          onAddClick={() => tableRef.current?.addNewRow()}
          addButtonLabel="Add Style"
          newRowDefaults={{
            name: '',
            description: '',
            requiredItemIdsCsv: '',
            imageUrlsPipe: '',
            requiredItemCount: 0,
            imageCount: 0,
          }}
        />
      </section>
    </div>
  );
};

export default AdminStylesPage;
