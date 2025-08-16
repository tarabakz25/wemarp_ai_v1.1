type Props = {
  onExport?: () => void
}

export default function Toolbar({ onExport }: Props) {
  return (
    <div className="flex items-center gap-2 p-2 border-b">
      <button
        className="px-3 py-1 border rounded"
        onClick={() => onExport?.()}
        type="button"
      >
        Export
      </button>
    </div>
  )
}


