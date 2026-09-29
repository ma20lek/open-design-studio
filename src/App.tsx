import { useMemo, useState } from 'react'
import './App.css'

type Tool = 'select' | 'rectangle' | 'ellipse' | 'text'
type ShapeType = 'rectangle' | 'ellipse' | 'text'

type CanvasShape = {
  id: number
  type: ShapeType
  x: number
  y: number
  width: number
  height: number
  fill: string
  text?: string
  fontSize?: number
}

const defaultShapes: CanvasShape[] = [
  {
    id: 1,
    type: 'rectangle',
    x: 110,
    y: 120,
    width: 180,
    height: 120,
    fill: '#7c3aed',
  },
  {
    id: 2,
    type: 'ellipse',
    x: 360,
    y: 180,
    width: 200,
    height: 160,
    fill: '#22c55e',
  },
  {
    id: 3,
    type: 'text',
    x: 220,
    y: 70,
    width: 260,
    height: 80,
    fill: '#e2e8f0',
    text: 'Open Design Studio',
    fontSize: 30,
  },
]

const STORAGE_KEY = 'open-design-studio-state'

function App() {
  const [activeTool, setActiveTool] = useState<Tool>('select')
  const [shapes, setShapes] = useState<CanvasShape[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? (JSON.parse(saved) as CanvasShape[]) : defaultShapes
  })
  const [selectedId, setSelectedId] = useState<number>(defaultShapes[0].id)
  const [status, setStatus] = useState('Ready to design')

  const selectedShape = useMemo(
    () => shapes.find((shape) => shape.id === selectedId) ?? null,
    [selectedId, shapes],
  )

  const updateSelectedShape = <K extends keyof CanvasShape>(key: K, value: CanvasShape[K]) => {
    if (!selectedShape) return

    setShapes((current) =>
      current.map((shape) =>
        shape.id === selectedShape.id
          ? {
              ...shape,
              [key]: value,
            }
          : shape,
      ),
    )
  }

  const addShape = (type: ShapeType) => {
    const baseShape: CanvasShape = {
      id: Date.now() + Math.random(),
      type,
      x: 80 + shapes.length * 30,
      y: 100 + shapes.length * 20,
      width: type === 'text' ? 220 : 140,
      height: type === 'text' ? 52 : 110,
      fill: type === 'text' ? '#f8fafc' : type === 'ellipse' ? '#f59e0b' : '#38bdf8',
      text: type === 'text' ? 'New headline' : undefined,
      fontSize: 28,
    }

    const nextShapes = [...shapes, baseShape]
    setShapes(nextShapes)
    setSelectedId(baseShape.id)
    setStatus(`${type} layer added`)
    setActiveTool('select')
  }

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shapes))
    setStatus('Saved locally')
  }

  const handleLoad = () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      setStatus('No saved document found')
      return
    }

    try {
      const nextShapes = JSON.parse(saved) as CanvasShape[]
      setShapes(nextShapes)
      setSelectedId(nextShapes[0]?.id ?? 0)
      setStatus('Loaded last saved document')
    } catch {
      setStatus('Saved document could not be loaded')
    }
  }

  const handleExport = () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
        ${shapes
          .map((shape) => {
            if (shape.type === 'rectangle') {
              return `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" rx="20" fill="${shape.fill}" />`
            }

            if (shape.type === 'ellipse') {
              return `<ellipse cx="${shape.x + shape.width / 2}" cy="${shape.y + shape.height / 2}" rx="${shape.width / 2}" ry="${shape.height / 2}" fill="${shape.fill}" />`
            }

            return `<text x="${shape.x}" y="${shape.y + (shape.height || 40)}" font-size="${shape.fontSize ?? 28}" fill="${shape.fill}" font-family="Inter, Arial, sans-serif" font-weight="700">${shape.text ?? 'Design'}</text>`
          })
          .join('')}
      </svg>
    `

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'open-design-studio-export.svg'
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus('Exported SVG artwork')
  }

  return (
    <div className="studio-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">O</div>
          <div>
            <p className="eyebrow">Design workspace</p>
            <h1>Open Design Studio</h1>
          </div>
        </div>

        <div className="toolbar-actions">
          <button type="button" className="secondary-button" onClick={handleLoad}>Load</button>
          <button type="button" className="secondary-button" onClick={handleSave}>Save</button>
          <button type="button" className="primary-button" onClick={handleExport}>Export</button>
        </div>
      </header>

      <div className="workspace-layout">
        <aside className="panel tools-panel">
          <p className="panel-label">Tools</p>
          <div className="tool-list">
            {(['select', 'rectangle', 'ellipse', 'text'] as Tool[]).map((tool) => (
              <button
                key={tool}
                type="button"
                className={tool === activeTool ? 'tool-button active' : 'tool-button'}
                onClick={() => {
                  if (tool === 'select') {
                    setActiveTool('select')
                    setStatus('Selection mode')
                    return
                  }

                  setActiveTool(tool)
                  setStatus(`${tool} tool enabled`)
                  addShape(tool === 'rectangle' ? 'rectangle' : tool === 'ellipse' ? 'ellipse' : 'text')
                }}
              >
                {tool === 'select' ? 'Select' : tool === 'rectangle' ? 'Rectangle' : tool === 'ellipse' ? 'Ellipse' : 'Text'}
              </button>
            ))}
          </div>

          <div className="status-box">
            <span>Status</span>
            <strong>{status}</strong>
          </div>
        </aside>

        <main className="canvas-panel panel">
          <div className="canvas-header">
            <div>
              <p className="panel-label">Canvas</p>
              <h2>Campaign hero concept</h2>
            </div>
            <span>1200 × 700</span>
          </div>

          <div className="canvas-surface">
            {shapes.map((shape) => {
              const isSelected = shape.id === selectedId

              if (shape.type === 'rectangle') {
                return (
                  <button
                    key={shape.id}
                    type="button"
                    className={isSelected ? 'canvas-shape selected' : 'canvas-shape'}
                    style={{
                      left: shape.x,
                      top: shape.y,
                      width: shape.width,
                      height: shape.height,
                      background: shape.fill,
                    }}
                    onClick={() => {
                      setSelectedId(shape.id)
                      setStatus('Rectangle selected')
                    }}
                  />
                )
              }

              if (shape.type === 'ellipse') {
                return (
                  <button
                    key={shape.id}
                    type="button"
                    className={isSelected ? 'canvas-shape selected' : 'canvas-shape'}
                    style={{
                      left: shape.x,
                      top: shape.y,
                      width: shape.width,
                      height: shape.height,
                      background: shape.fill,
                      borderRadius: '999px',
                    }}
                    onClick={() => {
                      setSelectedId(shape.id)
                      setStatus('Ellipse selected')
                    }}
                  />
                )
              }

              return (
                <button
                  key={shape.id}
                  type="button"
                  className={isSelected ? 'canvas-text selected' : 'canvas-text'}
                  style={{
                    left: shape.x,
                    top: shape.y,
                    width: shape.width,
                    height: shape.height,
                    color: shape.fill,
                    fontSize: shape.fontSize,
                  }}
                  onClick={() => {
                    setSelectedId(shape.id)
                    setStatus('Text layer selected')
                  }}
                >
                  {shape.text}
                </button>
              )
            })}
          </div>
        </main>

        <aside className="panel inspector-panel">
          <p className="panel-label">Inspector</p>

          {selectedShape ? (
            <div className="inspector-fields">
              <label>
                <span>Position X</span>
                <input
                  type="number"
                  value={selectedShape.x}
                  onChange={(event) => updateSelectedShape('x', Number(event.target.value))}
                />
              </label>

              <label>
                <span>Position Y</span>
                <input
                  type="number"
                  value={selectedShape.y}
                  onChange={(event) => updateSelectedShape('y', Number(event.target.value))}
                />
              </label>

              <label>
                <span>Width</span>
                <input
                  type="number"
                  value={selectedShape.width}
                  onChange={(event) => updateSelectedShape('width', Number(event.target.value))}
                />
              </label>

              <label>
                <span>Height</span>
                <input
                  type="number"
                  value={selectedShape.height}
                  onChange={(event) => updateSelectedShape('height', Number(event.target.value))}
                />
              </label>

              <label>
                <span>Fill</span>
                <input
                  type="color"
                  value={selectedShape.fill}
                  onChange={(event) => updateSelectedShape('fill', event.target.value)}
                />
              </label>

              {selectedShape.type === 'text' ? (
                <label>
                  <span>Text</span>
                  <textarea
                    value={selectedShape.text ?? ''}
                    onChange={(event) => updateSelectedShape('text', event.target.value)}
                  />
                </label>
              ) : null}
            </div>
          ) : (
            <p className="empty-state">Select a layer to edit its properties.</p>
          )}
        </aside>
      </div>
    </div>
  )
}

export default App
