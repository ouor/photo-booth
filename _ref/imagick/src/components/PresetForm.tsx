import type { InputDefinition, PresetDocument, StickerInputDefinition } from "../dsl-schema";
import type { RenderImageValue, RenderInputs } from "../lib/preset-engine";
import { ImageInputField } from "./ImageInputField";

interface PresetFormProps {
  preset: PresetDocument;
  values: RenderInputs;
  onChange: (name: string, value: RenderInputs[string]) => void;
}

function toImageValue(url: string): RenderImageValue {
  return {
    kind: "image",
    url,
  };
}

function findStickerOption(input: StickerInputDefinition, assetPath: string) {
  return input.options.find((option) => option.asset === assetPath);
}

function renderHint(input: InputDefinition) {
  switch (input.type) {
    case "image":
      return "File, camera, clipboard";
    case "text":
      return input.maxLength ? `Max ${input.maxLength} chars` : "Short text";
    case "sticker":
      return `${input.options.length} preset stickers`;
    case "emoji":
      return `${input.allowed?.length ?? 0} emoji options`;
    case "camera":
      return "Camera source";
    default:
      return "";
  }
}

export function PresetForm({ preset, values, onChange }: PresetFormProps) {
  return (
    <form className="input-panel">
      <div className="section-heading">
        <h2>Preset Inputs</h2>
        <span>{preset.inputs.length} fields</span>
      </div>
      <div className="input-fields">
        {preset.inputs.map((input) => {
          const value = values[input.name];

          return (
            <label key={input.name} className="field-card">
              <div className="field-head">
                <strong>{input.label ?? input.name}</strong>
                <span>{renderHint(input)}</span>
              </div>
              {input.description ? <p className="field-copy">{input.description}</p> : null}

              {input.type === "image" ? (
                <ImageInputField
                  input={input}
                  value={typeof value === "object" && value?.kind === "image" ? value : null}
                  onChange={(nextValue) => onChange(input.name, nextValue)}
                />
              ) : null}

              {input.type === "text" ? (
                input.multiline ? (
                  <textarea
                    rows={4}
                    maxLength={input.maxLength}
                    placeholder={input.placeholder}
                    value={typeof value === "string" ? value : ""}
                    onChange={(event) => onChange(input.name, event.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    maxLength={input.maxLength}
                    placeholder={input.placeholder}
                    value={typeof value === "string" ? value : ""}
                    onChange={(event) => onChange(input.name, event.target.value)}
                  />
                )
              ) : null}

              {input.type === "sticker" ? (
                <select
                  value={typeof value === "object" && value?.kind === "image" ? value.url : ""}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    onChange(input.name, nextValue ? toImageValue(nextValue) : null);
                  }}
                >
                  <option value="">No sticker</option>
                  {input.options.map((option) => (
                    <option key={option.id} value={option.asset}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : null}

              {input.type === "emoji" ? (
                <select
                  value={typeof value === "string" ? value : ""}
                  onChange={(event) => onChange(input.name, event.target.value || null)}
                >
                  <option value="">No emoji</option>
                  {input.allowed?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : null}

              {input.type === "camera" ? (
                <small>Camera-only fields will share this capture flow.</small>
              ) : null}

              {input.type === "sticker" && typeof value === "object" && value?.kind === "image" ? (
                <small>Selected: {findStickerOption(input, value.url)?.label ?? "Sticker"}</small>
              ) : null}
            </label>
          );
        })}
      </div>
    </form>
  );
}
