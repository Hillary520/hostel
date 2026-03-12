import type { ReactNode } from 'react'

import { Modal } from './Modal'

export interface DetailItem {
  label: string
  value: ReactNode
}

export interface DetailSection {
  title?: string
  items: DetailItem[]
}

export function DetailsModal({
  open,
  title,
  onClose,
  sections,
}: {
  open: boolean
  title: string
  onClose: () => void
  sections: DetailSection[]
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="space-y-6">
        {sections.map((section, sectionIndex) => (
          <section key={`${section.title ?? 'section'}-${sectionIndex}`} className="space-y-3">
            {section.title && <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{section.title}</h4>}
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 bg-muted/30 p-4 rounded-lg border">
              {section.items.map((item, itemIndex) => (
                <div key={`${item.label}-${itemIndex}`} className="space-y-1">
                  <dt className="text-sm font-medium text-muted-foreground">{item.label}</dt>
                  <dd className="text-sm font-semibold text-foreground">{item.value ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Modal>
  )
}
