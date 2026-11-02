import { Backpack, BookOpen, CreditCard, Droplets, Gem, KeyRound, Package, Shirt, Smartphone, Wallet, type LucideProps } from 'lucide-react'

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  'Phones & Electronics': Smartphone,
  'ID & Cards': CreditCard,
  Keys: KeyRound,
  'Bags & Backpacks': Backpack,
  'Books & Stationery': BookOpen,
  Clothing: Shirt,
  'Wallets & Money': Wallet,
  'Jewellery & Watches': Gem,
  'Bottles & Lunch boxes': Droplets,
}

export function CategoryIcon({ category, ...props }: { category: string } & LucideProps) {
  const Icon = ICONS[category] ?? Package
  return <Icon aria-hidden {...props} />
}
