"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Search,
  ShoppingBag,
  Filter,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import productData from "@/data/products.json"

// ---- Type definitions for safety ------------------------------------------
type Language = keyof typeof tagColors.language
type Shop = keyof typeof tagColors.shop
type ProductType = keyof typeof tagColors.type
type SortOptionValue = (typeof sortOptions)[number]["value"]

// ---- Dynamic filter option helpers ----------------------------------------

const uniqueValues = (field: keyof typeof productData[0]) =>
  Array.from(new Set(productData.map((p) => p[field] as string))).sort()

const languageOptions = uniqueValues("language")
const typeOptions = uniqueValues("type") as ProductType[]
const sellerOptions = uniqueValues("shop") as Shop[]

// ---- Sort options ----------------------------------------------------------

const sortOptions = [
  { value: "default", label: "Default" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "name-asc", label: "Name: A → Z" },
  { value: "name-desc", label: "Name: Z → A" },
] as const

// ---- Tag colour map (fallbacks included) -----------------------------------

const tagColors = {
  language: {
    English: { bg: "bg-emerald-100", text: "text-emerald-700" },
    Japanese: { bg: "bg-purple-100", text: "text-purple-700" },
    Korean: { bg: "bg-sky-100", text: "text-sky-700" },
    "Simplified Chinese": { bg: "bg-amber-100", text: "text-amber-700" },
  },
  shop: {
    "TCG Republic": { bg: "bg-orange-100", text: "text-orange-700" },
    "Bored Game Company": { bg: "bg-lime-100", text: "text-lime-700" },
  },
  type: {
    "Booster Pack": { bg: "bg-blue-100", text: "text-blue-700" },
    "Booster Box": { bg: "bg-indigo-100", text: "text-indigo-700" },
    "Booster Display Box (36 Packs)": { bg: "bg-cyan-100", text: "text-cyan-700" },
    "Elite Trainer Box": { bg: "bg-fuchsia-100", text: "text-fuchsia-700" },
    "3 Pack Blister": { bg: "bg-pink-100", text: "text-pink-700" },
    "Collection Box": { bg: "bg-rose-100", text: "text-rose-700" },
    "Precious Collector Box": { bg: "bg-teal-100", text: "text-teal-700" },
  },
} as const

const fallbackTag = { bg: "bg-stone-100", text: "text-stone-700" }

function isValidLanguage(lang: string): lang is Language {
  return lang in tagColors.language
}

function isValidShop(shop: string): shop is Shop {
  return shop in tagColors.shop
}

function isValidProductType(type: string): type is ProductType {
  return type in tagColors.type
}

// ---- Pagination ------------------------------------------------------------

const ITEMS_PER_PAGE = 12

// ---- SimpleFilterDropdown --------------------------------------------------

function SimpleFilterDropdown({
  label,
  options,
  selectedValues,
  onChange,
  badgeCount,
}: {
  label: string
  options: string[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  badgeCount: number
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const toggle = (val: string) => {
    onChange(selectedValues.includes(val) ? selectedValues.filter((v) => v !== val) : [...selectedValues, val])
  }

  return (
    <div ref={dropdownRef} className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full bg-white shadow-sm hover:shadow-md border-stone-200"
      >
        <span className="mr-1">{label}</span>
        {badgeCount > 0 && (
          <Badge className="ml-1 bg-orange-100 text-orange-700 border-none">{badgeCount}</Badge>
        )}
        <ChevronDown size={16} className="ml-1 text-stone-400" />
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black/10">
          <div className="p-2">
            <p className="px-2 py-1.5 text-sm font-semibold">Select {label}s</p>
            <div className="h-px bg-stone-200 my-1" />
            <div className="max-h-60 overflow-auto py-1">
              {options.map((opt, i) => {
                const active = selectedValues.includes(opt)
                const bg = active ? `rgba(249,115,22,${0.9 - (i / options.length) * 0.4})` : undefined
                return (
                  <div
                    key={opt}
                    className={`px-4 py-2 text-sm rounded-md cursor-pointer ${
                      active ? "text-white" : "text-stone-700 hover:bg-stone-100"
                    }`}
                    style={{ backgroundColor: bg }}
                    onClick={() => toggle(opt)}
                  >
                    {opt}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- SortDropdown ----------------------------------------------------------

function SortDropdown({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: readonly { value: string; label: string }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const chosen = options.find((o) => o.value === value) ?? options[0]

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        className="rounded-full bg-white shadow-sm hover:shadow-md border-stone-200 text-stone-600"
        onClick={() => setOpen(!open)}
      >
        <ArrowUpDown size={16} className="mr-2 text-stone-400" />
        Sort: {chosen.label}
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black/10">
          <div className="p-2">
            <p className="px-2 py-1.5 text-sm font-semibold">Sort By</p>
            <div className="h-px bg-stone-200 my-1" />
            {options.map((o) => {
              const active = value === o.value
              return (
                <div
                  key={o.value}
                  className={`px-4 py-2 text-sm rounded-md cursor-pointer ${
                    active ? "text-white" : "text-stone-700 hover:bg-stone-100"
                  }`}
                  style={{ backgroundColor: active ? "rgba(249,115,22,0.9)" : undefined }}
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                >
                  {o.label}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ---- Initialize state from URL search params ----------------------------
  const getInitialState = useCallback(
    <T,>(key: string, defaultValue: T, parser: (val: string) => T = (v) => v as T): T => {
      const param = searchParams.get(key)
      return param ? parser(param) : defaultValue
    },
    [searchParams]
  )

  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>(
    getInitialState("languages", [], (v) => v.split(",").filter(isValidLanguage))
  )
  const [selectedTypes, setSelectedTypes] = useState<ProductType[]>(
    getInitialState("types", [], (v) => v.split(",").filter(isValidProductType))
  )
  const [selectedSellers, setSelectedSellers] = useState<Shop[]>(
    getInitialState("sellers", [], (v) => v.split(",").filter(isValidShop))
  )
  const [searchQuery, setSearchQuery] = useState<string>(getInitialState("q", ""))
  const [currentPage, setCurrentPage] = useState<number>(
    getInitialState("page", 1, (v) => parseInt(v, 10) || 1)
  )
  const [sortBy, setSortBy] = useState<SortOptionValue>(
    getInitialState("sort", "default", (v) =>
      sortOptions.some((o) => o.value === v) ? (v as SortOptionValue) : "default"
    )
  )

  // ---- Update URL on state change -----------------------------------------
  useEffect(() => {
    const p = new URLSearchParams()
    if (selectedLanguages.length) p.set("languages", selectedLanguages.join(","))
    if (selectedTypes.length) p.set("types", selectedTypes.join(","))
    if (selectedSellers.length) p.set("sellers", selectedSellers.join(","))
    if (searchQuery) p.set("q", searchQuery)
    if (currentPage > 1) p.set("page", currentPage.toString())
    if (sortBy !== "default") p.set("sort", sortBy)

    // Use router.replace for non-critical updates to avoid polluting history
    router.replace(`?${p.toString()}`, { scroll: false })
  }, [selectedLanguages, selectedTypes, selectedSellers, searchQuery, currentPage, sortBy, router])

  // ---- Filter / search -----------------------------------------------------
  const filtered = productData.filter((p) => {
    if (selectedLanguages.length && !selectedLanguages.includes(p.language as Language)) return false
    if (selectedTypes.length && !selectedTypes.includes(p.type as ProductType)) return false
    if (selectedSellers.length && !selectedSellers.includes(p.shop as Shop)) return false
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // ---- Sort ---------------------------------------------------------------
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.price - b.price
      case "price-desc":
        return b.price - a.price
      case "name-asc":
        return a.name.localeCompare(b.name)
      case "name-desc":
        return b.name.localeCompare(a.name)
      default:
        return 0
    }
  })

  // ---- Pagination ----------------------------------------------------------
  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE))

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [totalPages, currentPage])

  const paginated = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const pageNumbers = () => {
    const max = 5
    if (totalPages <= max) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const arr: (number | "...")[] = [1]
    let start = Math.max(2, currentPage - 1)
    let end = Math.min(totalPages - 1, currentPage + 1)
    if (currentPage <= 2) end = 4
    if (currentPage >= totalPages - 1) start = totalPages - 3
    if (start > 2) arr.push("...")
    for (let i = start; i <= end; i++) arr.push(i)
    if (end < totalPages - 1) arr.push("...")
    arr.push(totalPages)
    return arr
  }

  const clearFilters = () => {
    setSelectedLanguages([])
    setSelectedTypes([])
    setSelectedSellers([])
    setSearchQuery("")
    setCurrentPage(1)
    setSortBy("default")
  }

  // Helper function to update state and reset page number
  const updateFilter = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    setter(value)
    setCurrentPage(1)
  }

  const activeCount = selectedLanguages.length + selectedTypes.length + selectedSellers.length

  // ---- Render --------------------------------------------------------------
  return (
    <main className="min-h-screen bg-[#fafafa] text-stone-800">
      {/* ------------------------------------------------------------------- */}
      {/* HERO */}
      <div className="relative w-full">
        <div className="w-full h-[400px] relative">
          <Image src="/images/background.png" alt="" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#fafafa] z-10" />
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-12 z-20">
          <div className="relative w-24 h-24 bg-white rounded-full p-2 shadow-md">
            <Image src="/images/logo.png" alt="HoloHut logo" fill className="object-contain p-1" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* HEADER */}
      <header className="flex flex-col items-center pt-20 pb-8 px-4 md:px-6">
        <h1 className="text-4xl font-light tracking-tight mb-2">HoloHut</h1>
        <p className="text-stone-600 text-lg mb-8 text-center max-w-md">
          Track Pokémon TCG packs in stock across India
        </p>

        {/* Sellers logos */}
        <div className="w-full max-w-md mb-8">
          <p className="text-center text-stone-500 mb-4 text-sm">Sellers Showcased</p>
          <div className="flex justify-center gap-8">
            <div className="relative h-12 w-40">
              <Image src="/images/tcgrepublic-logo.png" alt="TCG Republic" fill className="object-contain" />
            </div>
            <div className="relative h-12 w-40">
              <Image src="/images/bgc-logo.png" alt="BGC" fill className="object-contain" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-2xl mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
          <Input
            placeholder="Search for packs, boxes, or shops..."
            value={searchQuery}
            onChange={(e) => updateFilter(setSearchQuery, e.target.value)}
            className="pl-12 py-6 rounded-full border-stone-200 bg-white shadow-lg focus-visible:ring-orange-400"
          />
          {searchQuery && (
            <button
              onClick={() => updateFilter<string>(setSearchQuery, "")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filters & sort */}
        <div className="w-full max-w-7xl mb-8">
          <div className="flex flex-wrap justify-between items-center">
            <div className="flex flex-wrap gap-3 items-center mb-4 md:mb-0">
              <div className="flex items-center gap-2 mr-1">
                <Filter size={16} className="text-stone-500" />
                <span className="text-sm text-stone-500 hidden sm:inline">Filters:</span>
              </div>

              <SimpleFilterDropdown
                label="Language"
                options={languageOptions}
                selectedValues={selectedLanguages.map((lang) => lang as string)}
                onChange={(v) => updateFilter(setSelectedLanguages, v.map((v) => v as Language))}
                badgeCount={selectedLanguages.length}
              />

              <SimpleFilterDropdown
                label="Type"
                options={typeOptions.map((type) => type as string)}
                selectedValues={selectedTypes.map((type) => type as string)}
                onChange={(v) => updateFilter(setSelectedTypes, v.map((v) => v as ProductType))}
                badgeCount={selectedTypes.length}
              />

              <SimpleFilterDropdown
                label="Seller"
                options={sellerOptions.map((shop) => shop as string)}
                selectedValues={selectedSellers.map((shop) => shop as string)}
                onChange={(v) => updateFilter(setSelectedSellers, v.map((v) => v as Shop))}
                badgeCount={selectedSellers.length}
              />

              {activeCount > 0 && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="rounded-full text-stone-500 hover:bg-stone-100"
                >
                  <X size={16} className="mr-1" />
                  Clear&nbsp;{activeCount}
                </Button>
              )}
            </div>

            <SortDropdown
              value={sortBy}
              onChange={(v) => updateFilter(setSortBy, v as SortOptionValue)}
              options={sortOptions}
            />
          </div>
        </div>

        {/* Results count */}
        <div className="w-full max-w-7xl px-4 mb-4">
          <p className="text-sm text-stone-500">
            Showing {paginated.length} of {sorted.length} {sorted.length === 1 ? "result" : "results"}
            {activeCount > 0 && " with applied filters"}
            {sortBy !== "default" && " • Sorted by " + sortOptions.find((o) => o.value === sortBy)!.label}
          </p>
        </div>
      </header>

      {/* ------------------------------------------------------------------- */}
      {/* PRODUCT GRID */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {paginated.map((p) => {
            // Ensure safe access to tagColors with type checks
            const langTag = isValidLanguage(p.language) ? tagColors.language[p.language] : fallbackTag
            const typeTag = isValidProductType(p.type) ? tagColors.type[p.type] : fallbackTag
            const shopTag = isValidShop(p.shop) ? tagColors.shop[p.shop] : fallbackTag

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all group h-[480px]"
              >
                <div className="relative h-72 bg-stone-50">
                  <Image
                    src={p.image || "/placeholder.svg"}
                    alt={p.name}
                    fill
                    className="object-contain p-4 transition-transform group-hover:scale-105"
                  />
                  {/* type badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className={`${typeTag.bg} ${typeTag.text} font-normal border-none`}>{p.type}</Badge>
                  </div>
                  {/* OOS overlay */}
                  {!p.inStock && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
                      <Badge className="bg-red-500 text-white border-none px-3 py-1 text-sm">Out of Stock</Badge>
                    </div>
                  )}
                </div>

                <div className="p-4 relative h-[156px]">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-lg">{p.name}</h3>
                    <span className="font-medium text-orange-600">{p.formattedPrice}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={`${langTag.bg} ${langTag.text} border-none text-xs`}>{p.language}</Badge>
                    <Badge className={`${shopTag.bg} ${shopTag.text} border-none text-xs`}>{p.shop}</Badge>
                  </div>
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`absolute bottom-4 right-4 ${
                      !p.inStock ? "pointer-events-none" : ""
                    }`}
                    aria-disabled={!p.inStock}
                    tabIndex={!p.inStock ? -1 : undefined}
                  >
                    <Button
                      size="icon"
                      disabled={!p.inStock}
                      className="rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingBag size={16} />
                    </Button>
                  </a>
                </div>
              </div>
            )
          })}
        </div>

        {/* empty state */}
        {sorted.length === 0 && (
          <div className="text-center py-16">
            <p className="text-stone-500 mb-4">No products match your current filters.</p>
            <Button onClick={clearFilters} variant="outline">
              Clear All Filters
            </Button>
          </div>
        )}

        {/* pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12 mb-8">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-10 h-10"
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={18} />
              </Button>
              {pageNumbers().map((pg, i) =>
                pg === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-stone-400">
                    ...
                  </span>
                ) : (
                  <Button
                    key={pg}
                    variant={currentPage === pg ? "default" : "outline"}
                    className={`rounded-full w-10 h-10 ${
                      currentPage === pg
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "text-stone-600 hover:bg-stone-100"
                    }`}
                    onClick={() => setCurrentPage(pg as number)}
                  >
                    {pg}
                  </Button>
                ),
              )}
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-10 h-10"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* FOOTER */}
      <footer style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
        <p>Made with ❤️ by <a href="https://x.com/PriyanshKSingh" target="_blank" rel="noopener noreferrer">@PriyanshKSingh</a></p>
        <p style={{ fontSize: '0.9rem' }}>HoloHut does not sell any products. It only tracks stock from verified Indian Pokémon TCG retailers.</p>
      </footer>
    </main>
  )
}
