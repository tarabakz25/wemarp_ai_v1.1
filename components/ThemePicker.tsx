type Props = {
  value: string
  onChange: (v: string) => void
  options?: string[]
}

export default function ThemePicker({ value, onChange, options = ['default'] }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded px-2 py-1"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  )
}


