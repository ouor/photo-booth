import type { ChangeEvent } from "react";
import type { InputDefinition, PresetDocument, StickerInputDefinition } from "../dsl-schema";
import type { RenderImageValue, RenderInputs } from "../lib/preset-engine";

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
      return "JPG, PNG, WebP";
    case "text":
      return input.maxLength ? `Max ${input.maxLength} chars` : "Short text";
    case "sticker":
      return `${input.options.length} preset stickers`;
    case "emoji":
      return `${input.allowed?.length ?? 0} emoji options`;
    case "camera":
      return "Camera support comes next";
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
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        onChange(input.name, null);
                        return;
                      }

                      onChange(input.name, toImageValue(URL.createObjectURL(file)));
                    }}
                  />
                  <small>{typeof value === "object" && value?.kind === "image" ? "Image selected" : "No image selected"}</small>
                </>
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
                <button type="button" className="ghost-button" disabled>
                  Enable camera soon
                </button>
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
