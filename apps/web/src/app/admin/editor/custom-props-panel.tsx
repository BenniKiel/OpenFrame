import type { PageNode, ComponentManifest, PropertyControl } from "@/lib/openframe";
import { useEditorStore } from "@/lib/editor";

export function CustomPropsPanel({ node, manifest }: { node: PageNode; manifest: ComponentManifest }) {
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const removeSelectedNode = useEditorStore((s) => s.removeSelectedNode);

  return (
    <div className="ec-props-stack">
      <PropsSection title={`${manifest.displayName} Properties`}>
        {manifest.description && (
          <p className="ec-props-hint mb-3 text-[11px] leading-relaxed">
            {manifest.description}
          </p>
        )}
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(manifest.propertyControls).map(([key, control]) => {
            if (control.hidden) {
              const currentVal = node.props[control.hidden.prop];
              if (currentVal === control.hidden.is) return null;
            }

            return (
              <PropertyControlField
                key={key}
                propKey={key}
                control={control}
                value={node.props[key]}
                onChange={(val) => updateNodeProps(node.id, { [key]: val })}
              />
            );
          })}
        </div>
      </PropsSection>

      {node.id !== "root" ? (
        <section className="ec-props-section">
          <button type="button" className="ec-props-danger-btn w-full" onClick={() => removeSelectedNode()}>
            Remove layer
          </button>
        </section>
      ) : null}
    </div>
  );
}

function PropertyControlField({
  propKey,
  control,
  value,
  onChange,
}: {
  propKey: string;
  control: PropertyControl;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const label = (
    <div className="flex justify-between items-baseline mb-1">
      <span className="ec-text-muted">{control.title}</span>
    </div>
  );

  const description = control.description ? (
    <p className="ec-props-hint mt-1 text-[10px] opacity-75">{control.description}</p>
  ) : null;

  switch (control.type) {
    case "string":
      if (control.multiline) {
        return (
          <label className="ec-label flex flex-col gap-1 text-[11px]">
            {label}
            <textarea
              className="ec-field ec-input w-full resize-y rounded-md px-2.5 py-1.5 font-mono text-[12px] min-h-[60px]"
              value={String(value ?? "")}
              placeholder={control.placeholder}
              maxLength={control.maxLength}
              onChange={(e) => onChange(e.target.value)}
            />
            {description}
          </label>
        );
      }
      return (
        <label className="ec-label flex flex-col gap-1 text-[11px]">
          {label}
          <input
            type="text"
            className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[12px]"
            value={String(value ?? "")}
            placeholder={control.placeholder}
            maxLength={control.maxLength}
            onChange={(e) => onChange(e.target.value)}
          />
          {description}
        </label>
      );

    case "number":
      return (
        <label className="ec-label flex flex-col gap-1 text-[11px]">
          {label}
          <div className="flex gap-2 items-center">
            <input
              type="number"
              className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[12px] w-full min-w-0"
              value={value as number ?? ""}
              min={control.min}
              max={control.max}
              step={control.step}
              onChange={(e) => onChange(Number(e.target.value))}
            />
            {control.unit && <span className="text-[11px] text-zinc-500 shrink-0">{control.unit}</span>}
          </div>
          {description}
        </label>
      );

    case "boolean":
      return (
        <label className="ec-label flex items-center justify-between gap-2 text-[11px] py-1 cursor-pointer">
          <div className="flex flex-col">
            <span className="ec-text-muted">{control.title}</span>
            {description}
          </div>
          <input
            type="checkbox"
            className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
        </label>
      );

    case "enum":
      return (
        <label className="ec-label flex flex-col gap-1 text-[11px]">
          {label}
          <select
            className="ec-input rounded-md px-2 py-1.5 text-[12px]"
            value={String(value ?? control.options[0])}
            onChange={(e) => onChange(e.target.value)}
          >
            {control.options.map((opt, i) => (
              <option key={opt} value={opt}>
                {control.optionLabels?.[i] ?? opt}
              </option>
            ))}
          </select>
          {description}
        </label>
      );

    case "color":
      return (
        <label className="ec-label flex flex-col gap-1 text-[11px]">
          {label}
          <div className="flex gap-2 items-center">
            <div
              className="w-6 h-6 rounded-md border border-zinc-200 shrink-0"
              style={{ backgroundColor: String(value ?? "") || "transparent" }}
            />
            <input
              type="text"
              className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[12px] w-full min-w-0"
              value={String(value ?? "")}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
          {description}
        </label>
      );

    case "image":
      return (
        <label className="ec-label flex flex-col gap-1 text-[11px]">
          {label}
          <input
            type="text"
            className="ec-input rounded-md px-2.5 py-1.5 font-mono text-[12px]"
            value={String(value ?? "")}
            placeholder="https://..."
            onChange={(e) => onChange(e.target.value)}
          />
          {description}
        </label>
      );

    case "array": {
      const arr = Array.isArray(value) ? value : [];
      return (
        <div className="ec-label flex flex-col gap-2 text-[11px]">
          {label}
          {description}
          <div className="flex flex-col gap-2 pl-2 border-l-2 border-zinc-100">
            {arr.map((itemValue, i) => (
              <div key={i} className="flex gap-2 items-start bg-zinc-50/50 p-2 rounded-md">
                <div className="flex-1 min-w-0">
                  <PropertyControlField
                    propKey={`${propKey}[${i}]`}
                    control={{ ...control.itemControl, title: `Item ${i + 1}` }}
                    value={itemValue}
                    onChange={(newItemValue) => {
                      const newArr = [...arr];
                      newArr[i] = newItemValue;
                      onChange(newArr);
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="mt-[22px] p-1 text-zinc-400 hover:text-red-500 rounded"
                  onClick={() => {
                    const newArr = [...arr];
                    newArr.splice(i, 1);
                    onChange(newArr);
                  }}
                  title="Remove item"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            ))}
            {(!control.maxItems || arr.length < control.maxItems) && (
              <button
                type="button"
                className="self-start text-xs text-indigo-600 hover:text-indigo-700 font-medium py-1"
                onClick={() => {
                  const newArr = [...arr, undefined];
                  onChange(newArr);
                }}
              >
                + Add item
              </button>
            )}
          </div>
        </div>
      );
    }

    case "object": {
      const obj = (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Record<string, unknown>;
      return (
        <div className="ec-label flex flex-col gap-2 text-[11px]">
          {label}
          {description}
          <div className="flex flex-col gap-3 pl-3 py-1 border-l-2 border-zinc-100 mt-1">
            {Object.entries(control.fields).map(([fieldKey, fieldControl]) => (
              <PropertyControlField
                key={fieldKey}
                propKey={`${propKey}.${fieldKey}`}
                control={fieldControl}
                value={obj[fieldKey]}
                onChange={(newFieldValue) => {
                  onChange({ ...obj, [fieldKey]: newFieldValue });
                }}
              />
            ))}
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

function PropsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="ec-props-section">
      <div className="ec-props-section-head">
        <h3 className="ec-props-section-title">{title}</h3>
      </div>
      <div className="ec-props-section-body">{children}</div>
    </section>
  );
}
