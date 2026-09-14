import { useState } from 'react';
import { Database, Search, Sparkles } from 'lucide-react';

const CATALOG_DEFAULTS = {
  typeId: 1,
  langId: 4,
  countryFilterId: 21
};

const firstArray = (payload, preferredKeys = []) => {
  const root = payload?.data ?? payload;

  if (Array.isArray(root)) return root;
  if (!root || typeof root !== 'object') return [];

  for (const key of preferredKeys) {
    if (Array.isArray(root[key])) return root[key];
  }

  return Object.values(root).find(Array.isArray) || [];
};

const valueFor = (row, keys) => {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
};

const flattenOptions = (input, idKeys, labelKeys) => {
  const output = [];
  const seenObjects = new Set();

  const visit = (value, depth = 0) => {
    if (depth > 8 || value == null) return;

    if (Array.isArray(value)) {
      value.forEach((entry) => visit(entry, depth + 1));
      return;
    }

    if (typeof value !== 'object' || seenObjects.has(value)) return;
    seenObjects.add(value);

    const id = valueFor(value, idKeys);
    const label = valueFor(value, labelKeys);

    if (id != null && label != null) {
      output.push({ id: String(id), label: String(label), raw: value });
    }

    Object.values(value).forEach((entry) => {
      if (entry && typeof entry === 'object') visit(entry, depth + 1);
    });
  };

  visit(input);

  const unique = new Map();
  output.forEach((option) => {
    if (!unique.has(option.id)) unique.set(option.id, option);
  });

  return [...unique.values()].sort((a, b) => a.label.localeCompare(b.label));
};

const catalogRequest = async (action, params = {}) => {
  const query = new URLSearchParams({
    action,
    typeId: String(CATALOG_DEFAULTS.typeId),
    langId: String(CATALOG_DEFAULTS.langId),
    countryFilterId: String(CATALOG_DEFAULTS.countryFilterId),
    ...Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, String(value)])
    )
  });

  const response = await fetch(`/api/autoparts-catalog?${query.toString()}`, {
    headers: { Accept: 'application/json' }
  });
  const payload = await response.json();

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || 'Reference catalogue request failed.');
  }

  return payload.data;
};

const toPartCards = (payload) => {
  const root = payload?.data ?? payload;
  const discovered = [];
  const seenObjects = new Set();

  const visit = (value, depth = 0) => {
    if (depth > 8 || value == null || discovered.length >= 50) return;
    if (Array.isArray(value)) {
      value.forEach((entry) => visit(entry, depth + 1));
      return;
    }
    if (typeof value !== 'object' || seenObjects.has(value)) return;
    seenObjects.add(value);

    if (valueFor(value, ['articleNo', 'articleNumber', 'partNumber']) != null) {
      discovered.push(value);
      return;
    }

    Object.values(value).forEach((entry) => {
      if (entry && typeof entry === 'object') visit(entry, depth + 1);
    });
  };

  visit(root);

  const rows = discovered.length
    ? discovered
    : firstArray(root, ['articles', 'articleList', 'results', 'parts', 'data']);

  const cards = rows.slice(0, 50).map((row, index) => ({
    id: String(valueFor(row, ['articleId', 'id', 'articleLinkId']) || `part-${index}`),
    partNumber: String(valueFor(row, ['articleNo', 'articleNumber', 'partNumber']) || 'Not supplied'),
    title: String(valueFor(row, [
      'articleName',
      'productName',
      'genericArticleDescription',
      'description',
      'name'
    ]) || 'Automotive part'),
    brand: String(valueFor(row, [
      'supplierName',
      'brandName',
      'manufacturerName',
      'brand',
      'supplier'
    ]) || 'Brand not supplied')
  }));

  const unique = new Map();
  cards.forEach((card) => {
    const key = `${card.id}:${card.partNumber}`;
    if (!unique.has(key)) unique.set(key, card);
  });

  return [...unique.values()];
};

export default function AutoPartsCatalogPanel({ vehicle, colors }) {
  const [manufacturers, setManufacturers] = useState([]);
  const [models, setModels] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parts, setParts] = useState([]);
  const [manufacturerId, setManufacturerId] = useState('');
  const [modelId, setModelId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');

  const palette = colors || {
    panel: '#101524',
    panel2: '#0C111C',
    bg: '#070A12',
    border: '#1E2A42',
    orange: '#FF5A00',
    emerald: '#10B981',
    cyan: '#00E5FF',
    text: '#E2E8F0',
    textDim: '#64748B'
  };

  const run = async (step, request) => {
    setLoadingStep(step);
    setError('');

    try {
      return await request();
    } catch (requestError) {
      setError(requestError?.message || 'Reference catalogue request failed.');
      return null;
    } finally {
      setLoadingStep('');
    }
  };

  const loadManufacturers = async () => {
    const payload = await run('manufacturers', () => catalogRequest('manufacturers'));
    if (!payload) return;

    const options = flattenOptions(
      firstArray(payload, ['manufacturers']),
      ['manufacturerId', 'id'],
      ['manufacturerName', 'name']
    );
    setManufacturers(options);
  };

  const selectManufacturer = async (nextId) => {
    setManufacturerId(nextId);
    setModelId('');
    setVehicleId('');
    setCategoryId('');
    setModels([]);
    setVehicles([]);
    setCategories([]);
    setParts([]);
    if (!nextId) return;

    const payload = await run('models', () => catalogRequest('models', {
      manufacturerId: nextId
    }));
    if (!payload) return;

    setModels(flattenOptions(
      firstArray(payload, ['models']),
      ['modelId', 'id'],
      ['modelName', 'name', 'description']
    ));
  };

  const selectModel = async (nextId) => {
    setModelId(nextId);
    setVehicleId('');
    setCategoryId('');
    setVehicles([]);
    setCategories([]);
    setParts([]);
    if (!nextId) return;

    const payload = await run('vehicles', () => catalogRequest('vehicles', {
      modelId: nextId
    }));
    if (!payload) return;

    setVehicles(flattenOptions(
      firstArray(payload, ['vehicles', 'types', 'modelTypes']),
      ['vehicleId', 'typeId', 'carId', 'id'],
      ['vehicleName', 'typeName', 'description', 'name', 'fullDescription']
    ));
  };

  const selectVehicle = async (nextId) => {
    setVehicleId(nextId);
    setCategoryId('');
    setCategories([]);
    setParts([]);
    if (!nextId) return;

    const payload = await run('categories', () => catalogRequest('categories', {
      vehicleId: nextId
    }));
    if (!payload) return;

    setCategories(flattenOptions(
      payload,
      ['categoryId', 'assemblyGroupNodeId', 'productId', 'nodeId', 'id'],
      ['categoryName', 'assemblyGroupName', 'productName', 'nodeName', 'description', 'name']
    ));
  };

  const selectCategory = async (nextId) => {
    setCategoryId(nextId);
    setParts([]);
    if (!nextId || !vehicleId) return;

    const payload = await run('parts', () => catalogRequest('parts', {
      vehicleId,
      categoryId: nextId
    }));
    if (payload) setParts(toPartCards(payload));
  };

  const searchPartNumber = async () => {
    const cleanPartNumber = partNumber.trim();
    if (cleanPartNumber.length < 2) {
      setError('Enter at least two characters from the part number.');
      return;
    }

    const payload = await run('part-number', () => catalogRequest('part-number', {
      partNumber: cleanPartNumber
    }));
    if (payload) setParts(toPartCards(payload));
  };

  const selectClass = 'w-full rounded-lg border px-3 py-2 text-xs text-slate-100 outline-none disabled:opacity-50';

  return (
    <section className="rounded-xl border p-4" style={{ background: palette.panel, borderColor: palette.border }}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: palette.textDim }}>
        <Database className="h-3.5 w-3.5" style={{ color: palette.emerald }} /> Reference Fitment Catalogue
      </div>

      <p className="mt-2 text-xs leading-relaxed" style={{ color: palette.textDim }}>
        Use this catalogue to identify compatible article and part numbers. It does not represent a supplier's live stock, trade price, delivery promise or ordering connection.
      </p>

      {vehicle && (
        <p className="mt-2 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: palette.border, background: palette.panel2, color: palette.text }}>
          Active vehicle: {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'Vehicle details incomplete'}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={partNumber}
          onChange={(event) => setPartNumber(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && searchPartNumber()}
          placeholder="Search an OEM or aftermarket part number"
          className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm text-slate-100 outline-none"
          style={{ borderColor: palette.border, background: palette.bg }}
        />
        <button
          onClick={searchPartNumber}
          disabled={Boolean(loadingStep)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50"
          style={{ background: palette.emerald }}
        >
          {loadingStep === 'part-number' ? <Sparkles className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Reference
        </button>
      </div>

      {!manufacturers.length ? (
        <button
          onClick={loadManufacturers}
          disabled={Boolean(loadingStep)}
          className="mt-3 w-full rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50"
          style={{ borderColor: palette.emerald, color: palette.emerald, background: palette.panel2 }}
        >
          {loadingStep === 'manufacturers' ? 'Loading makes…' : 'Browse compatible parts by vehicle'}
        </button>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <select
            aria-label="Vehicle make"
            value={manufacturerId}
            onChange={(event) => selectManufacturer(event.target.value)}
            disabled={Boolean(loadingStep)}
            className={selectClass}
            style={{ borderColor: palette.border, background: palette.bg }}
          >
            <option value="">1. Select make</option>
            {manufacturers.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>

          <select
            aria-label="Vehicle model"
            value={modelId}
            onChange={(event) => selectModel(event.target.value)}
            disabled={!manufacturerId || Boolean(loadingStep)}
            className={selectClass}
            style={{ borderColor: palette.border, background: palette.bg }}
          >
            <option value="">2. Select model</option>
            {models.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>

          <select
            aria-label="Vehicle variant"
            value={vehicleId}
            onChange={(event) => selectVehicle(event.target.value)}
            disabled={!modelId || Boolean(loadingStep)}
            className={selectClass}
            style={{ borderColor: palette.border, background: palette.bg }}
          >
            <option value="">3. Select engine / variant</option>
            {vehicles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>

          <select
            aria-label="Part category"
            value={categoryId}
            onChange={(event) => selectCategory(event.target.value)}
            disabled={!vehicleId || Boolean(loadingStep)}
            className={selectClass}
            style={{ borderColor: palette.border, background: palette.bg }}
          >
            <option value="">4. Select part category</option>
            {categories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </div>
      )}

      {loadingStep && loadingStep !== 'manufacturers' && (
        <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: palette.cyan }}>
          <Sparkles className="h-3.5 w-3.5 animate-spin" /> Loading reference catalogue…
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: '#EF444455', background: '#EF444410', color: '#FCA5A5' }}>
          {error}
        </div>
      )}

      {parts.length > 0 && (
        <div className="mt-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: palette.cyan }}>
            Reference results — {parts.length}
          </div>
          <div className="grid max-h-96 gap-2 overflow-y-auto sm:grid-cols-2">
            {parts.map((part) => (
              <div key={part.id} className="rounded-lg border p-3" style={{ borderColor: palette.border, background: palette.bg }}>
                <div className="text-xs font-bold text-slate-100">{part.title}</div>
                <div className="mt-1 text-[10px]" style={{ color: palette.textDim }}>{part.brand}</div>
                <div className="mt-2 font-mono text-xs" style={{ color: palette.emerald }}>{part.partNumber}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
