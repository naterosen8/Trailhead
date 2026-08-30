export const CIRCLES = [
  { id: 'college', label: 'College students' },
  { id: 'entrepreneurs', label: 'Entrepreneurs' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'creators', label: 'Creators' },
  { id: 'investors', label: 'Investors' },
  { id: 'outdoors', label: 'Outdoors' },
  { id: 'trades', label: 'Trades' },
]

export function circleLabel(id) {
  return CIRCLES.find((c) => c.id === id)?.label || id
}
