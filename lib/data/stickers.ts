export interface Sticker {
  id: string
  imageUrl: string
  name: string
  category: 'hearts' | 'stars' | 'text' | 'shapes'
}

export const mockStickers: Sticker[] = [
  // Hearts
  {
    id: 'heart-1',
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMzIgNTJMOC44IDI4LjhDNC40IDI0LjQgNC40IDE3LjYgOC44IDEzLjJDMTMuMiA4LjggMjAgOC44IDI0LjQgMTMuMkwzMiAyMC44TDM5LjYgMTMuMkM0NCA4LjggNTAuOCA4LjggNTUuMiAxMy4yQzU5LjYgMTcuNiA1OS42IDI0LjQgNTUuMiAyOC44TDMyIDUyWiIgZmlsbD0iI0ZGNkFCNyIvPjwvc3ZnPg==',
    name: 'Pink Heart',
    category: 'hearts',
  },
  {
    id: 'heart-2',
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMzIgNTJMOC44IDI4LjhDNC40IDI0LjQgNC40IDE3LjYgOC44IDEzLjJDMTMuMiA4LjggMjAgOC44IDI0LjQgMTMuMkwzMiAyMC44TDM5LjYgMTMuMkM0NCA4LjggNTAuOCA4LjggNTUuMiAxMy4yQzU5LjYgMTcuNiA1OS42IDI0LjQgNTUuMiAyOC44TDMyIDUyWiIgZmlsbD0iI0ZGQzFEOCIvPjwvc3ZnPg==',
    name: 'Light Pink Heart',
    category: 'hearts',
  },
  // Stars
  {
    id: 'star-1',
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMzIgOEwzNy42IDI2LjRMNTYgMzJMMzcuNiAzNy42TDMyIDU2TDI2LjQgMzcuNkw4IDMyTDI2LjQgMjYuNEwzMiA4WiIgZmlsbD0iI0ZGRDcwMCIvPjwvc3ZnPg==',
    name: 'Yellow Star',
    category: 'stars',
  },
  {
    id: 'star-2',
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMzIgOEwzNy42IDI2LjRMNTYgMzJMMzcuNiAzNy42TDMyIDU2TDI2LjQgMzcuNkw4IDMyTDI2LjQgMjYuNEwzMiA4WiIgZmlsbD0iI0ZGQzFGRiIvPjwvc3ZnPg==',
    name: 'Pink Star',
    category: 'stars',
  },
  // Text
  {
    id: 'text-1',
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTIwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIHJ4PSIyMCIgZmlsbD0iI0ZGNkFCNyIvPjx0ZXh0IHg9IjYwIiB5PSIyNyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjIwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiPkxPVkU8L3RleHQ+PC9zdmc+',
    name: 'Love',
    category: 'text',
  },
  {
    id: 'text-2',
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTIwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIHJ4PSIyMCIgZmlsbD0iIzdDRTBGRiIvPjx0ZXh0IHg9IjYwIiB5PSIyNyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjIwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiPllBWTwvdGV4dD48L3N2Zz4=',
    name: 'Yay',
    category: 'text',
  },
  // Shapes
  {
    id: 'shape-1',
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIyNCIgZmlsbD0iI0ZGQzFGRiIvPjwvc3ZnPg==',
    name: 'Circle',
    category: 'shapes',
  },
  {
    id: 'shape-2',
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSI4IiB5PSI4IiB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHJ4PSI4IiBmaWxsPSIjN0NFMEZGIi8+PC9zdmc+',
    name: 'Square',
    category: 'shapes',
  },
]
