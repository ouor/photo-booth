import { useMemo, useState } from "react";
import "./App.css";
import type { PresetDocument } from "./dsl-schema";
import { presetLibrary } from "./lib/preset-library";

function App() {
  const [selectedPresetId, setSelectedPresetId] = useState(presetLibrary[0]?.id ?? "");

  const selectedPreset = useMemo<PresetDocument | undefined>(
    () => presetLibrary.find((entry) => entry.id === selectedPresetId)?.preset,
    [selectedPresetId],
  );

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Preset-Driven Image Studio</p>
        <h1>DSL로 프리셋을 읽고 실행하는 이미지 편집 서비스</h1>
        <p className="hero-copy">
          지금 단계에서는 프리셋을 안전하게 불러오고 해석할 준비를 마쳤습니다.
          아래 목록은 현재 앱에 등록된 템플릿이에요.
        </p>
      </section>

      <section className="workspace">
        <aside className="preset-list">
          <div className="section-heading">
            <h2>Preset Library</h2>
            <span>{presetLibrary.length} presets</span>
          </div>
          <div className="preset-cards">
            {presetLibrary.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={entry.id === selectedPresetId ? "preset-card active" : "preset-card"}
                onClick={() => setSelectedPresetId(entry.id)}
              >
                <strong>{entry.name}</strong>
                <span>{entry.dimensions}</span>
                <p>{entry.description}</p>
                <div className="tag-row">
                  {entry.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="inspector-panel">
          <div className="section-heading">
            <h2>Preset Inspector</h2>
            <span>validated</span>
          </div>
          {selectedPreset ? (
            <div className="inspector-content">
              <div className="inspector-grid">
                <div>
                  <h3>{selectedPreset.metadata.name}</h3>
                  <p>{selectedPreset.metadata.description}</p>
                </div>
                <dl>
                  <div>
                    <dt>Schema</dt>
                    <dd>{selectedPreset.schemaVersion}</dd>
                  </div>
                  <div>
                    <dt>Output</dt>
                    <dd>
                      {selectedPreset.output.width} x {selectedPreset.output.height}
                    </dd>
                  </div>
                  <div>
                    <dt>Commands</dt>
                    <dd>{selectedPreset.commands.length}</dd>
                  </div>
                  <div>
                    <dt>Inputs</dt>
                    <dd>{selectedPreset.inputs.length}</dd>
                  </div>
                </dl>
              </div>
              <div className="code-panel">
                <pre>{JSON.stringify(selectedPreset, null, 2)}</pre>
              </div>
            </div>
          ) : (
            <p>No preset selected.</p>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
